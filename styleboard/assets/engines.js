/* Scrub engines for the Workbench: draw frame f of the long take into a <canvas>, cover-fitted.
   Two ways, same interface, picked by media/manifest.json ("engine") or ?engine=img|video:
   - ImgEngine: one image per frame (webp/avif), fetched coarse-to-fine around where the camera is, decoded off the main thread
     into a small window of ImageBitmaps; a missing frame falls back to the nearest decoded one.
   - VideoEngine: one short MP4 per station (all frames in it, short GOP), fetched whole as a Blob, scrubbed by seeking.
   Interface: new X({canvas, frames, segs:[[a,b]...], fps, url(i), ...}); x.draw(f) -> frame actually on screen; x.has(f); x.stats(). */
(function (G) {
  'use strict';
  const now = () => performance.now();

  function cover(ctx, src, sw, sh) {
    const c = ctx.canvas, cw = c.width, ch = c.height, s = Math.max(cw / sw, ch / sh), dw = sw * s, dh = sh * s;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  class Base {
    constructor(o) {
      this.o = o; this.N = o.frames; this.segs = o.segs; this.fps = o.fps || 24;
      this.ctx = o.canvas.getContext('2d', { alpha: false });
      this.ctx.imageSmoothingQuality = 'high';
      this.shown = -1; this.target = Math.max(0, Math.min(this.N - 1, o.start | 0)); this.dir = 1;   // start: the frame the camera is on (a deep link, the sample's station) this.bytes = 0; this.reqs = 0; this.t0 = now();
      this.segOf = new Int16Array(this.N);
      this.segs.forEach(([a, b], i) => { for (let f = a; f <= b; f++) this.segOf[f] = i; });
    }
    seg(f) { return this.segOf[Math.max(0, Math.min(this.N - 1, f | 0))]; }
    aim(f) { f = Math.max(0, Math.min(this.N - 1, f | 0)); if (f !== this.target) this.dir = f > this.target ? 1 : -1; const moved = this.seg(f) !== this.seg(this.target); this.target = f; return moved; }
    redraw() { const f = this.shown; this.shown = -1; return this.draw(f < 0 ? this.target : f); }
  }

  /* ---------------------------------------------------------------- image sequence */
  class ImgEngine extends Base {
    constructor(o) {
      super(o);
      this.blob = new Array(this.N); this.st = new Uint8Array(this.N);   // 0 none, 2 loading, 3 loaded
      this.bmp = new Map(); this.inflight = 0; this.queue = []; this.dec = 0;
      this.conc = o.conc || 8; this.win = o.win || 12; this.keep = o.keep || 30; this.near = o.near || 6;
      this.plan(); this.pump();
    }
    has(f) { return !!this.bmp.get(f); }
    loaded(i) { const [a, b] = this.segs[i]; for (let f = a; f <= b; f++) if (this.st[f] !== 3) return false; return true; }
    plan() {   // current segment: the frames just ahead first, then coarse to fine; then the next segment in the direction of travel, then the one behind
      const t = this.target, s = this.seg(t), d = this.dir, q = [];
      for (let k = 0; k < 10; k++) q.push(t + k * d);
      const segs = [s, s + d, s - d, s + 2 * d].filter(i => i >= 0 && i < this.segs.length);
      for (const i of segs) { const [a, b] = this.segs[i]; for (const step of [12, 6, 3, 1]) for (let f = a; f <= b; f += step) q.push(f); q.push(b); }
      this.queue = q.filter(f => f >= 0 && f < this.N && !this.st[f]);
    }
    pump() {
      while (this.inflight < this.conc && this.queue.length) {
        const f = this.queue.shift(); if (this.st[f]) continue;
        this.st[f] = 2; this.inflight++;
        fetch(this.o.url(f)).then(r => { if (!r.ok) throw r.status; return r.blob(); }).then(b => {
          this.blob[f] = b; this.st[f] = 3; this.bytes += b.size; this.reqs++; this.inflight--;
          this.decode(); this.pump(); this.o.onLoad && this.o.onLoad(f);
        }).catch(() => { this.st[f] = 0; this.inflight--; this.pump(); });
      }
    }
    decode() {   // keep ImageBitmaps for a window around the target, longer in the direction of travel
      const t = this.target, d = this.dir;
      for (let k = 0; k <= this.win && this.dec < 3; k++) {
        for (const f of k ? [t + k * d, k <= this.win / 3 ? t - k * d : -1] : [t]) {
          if (f < 0 || f >= this.N || this.bmp.has(f) || this.st[f] !== 3 || this.dec >= 3) continue;
          this.bmp.set(f, null); this.dec++;
          createImageBitmap(this.blob[f]).then(bm => {
            this.dec--;
            if (this.bmp.has(f)) this.bmp.set(f, bm); else bm.close();
            this.evict(); this.decode(); this.o.onReady && this.o.onReady(f);
          }, () => { this.dec--; this.bmp.delete(f); });
        }
      }
    }
    evict() {
      if (this.bmp.size <= this.keep) return;
      const t = this.target, ks = [...this.bmp.keys()].sort((a, b) => Math.abs(b - t) - Math.abs(a - t));
      for (const f of ks) { if (this.bmp.size <= this.keep) break; const b = this.bmp.get(f); if (!b) continue; b.close(); this.bmp.delete(f); }
      const s = this.seg(t);   // compressed frames: keep the segments around the camera; the rest come back from the HTTP cache
      for (let i = 0; i < this.segs.length; i++) if (Math.abs(i - s) > 2) {
        const [a, b] = this.segs[i]; for (let f = a; f <= b; f++) if (this.st[f] === 3) { this.blob[f] = null; this.st[f] = 0; }
      }
    }
    draw(f) {
      if (this.aim(f)) this.plan(); else if (!this.queue.length) this.plan();
      this.pump(); this.decode();
      f = this.target;
      let best = this.bmp.get(f) ? f : -1, bd = 0;
      if (best < 0) { bd = 1e9; for (const [k, v] of this.bmp) if (v) { const dd = Math.abs(k - f); if (dd < bd) { bd = dd; best = k; } } }
      if (best < 0 || best === this.shown || (bd > this.near && this.shown >= 0 && Math.abs(this.shown - f) <= bd)) return this.shown;
      const b = this.bmp.get(best); cover(this.ctx, b, b.width, b.height); this.shown = best;
      return best;
    }
    stats() { let n = 0; for (const v of this.bmp.values()) if (v) n++; return { bytes: this.bytes, reqs: this.reqs, bitmaps: n, inflight: this.inflight }; }
  }

  /* ---------------------------------------------------------------- video segments */
  class VideoEngine extends Base {
    constructor(o) {
      super(o);
      this.vids = new Map(); this.loading = new Set(); this.busy = false; this.shownSeg = -1; this.seekMs = [];
      this.want();
    }
    has(f) { const o = this.vids.get(this.seg(f)); return !!o; }
    loaded(i) { return this.vids.has(i); }
    load(i) {
      if (i < 0 || i >= this.segs.length || this.vids.has(i) || this.loading.has(i)) return;
      this.loading.add(i);
      fetch(this.o.url(i)).then(r => { if (!r.ok) throw r.status; return r.blob(); }).then(b => {
        this.bytes += b.size; this.reqs++;
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.src = URL.createObjectURL(b);
        return new Promise((res, rej) => { v.addEventListener('loadeddata', () => res(v), { once: true }); v.addEventListener('error', rej, { once: true }); v.load(); });
      }).then(v => {
        this.loading.delete(i); this.vids.set(i, v);
        v.addEventListener('seeked', () => this.seeked(i, v));
        this.trim(); this.want(); this.kick(); this.o.onLoad && this.o.onLoad(i);
      }).catch(() => { this.loading.delete(i); this.want(); });
    }
    want() {   // the camera's segment alone first (full bandwidth), then the next one in the direction of travel, then the one behind
      const s = this.seg(this.target), d = this.dir;
      if (!this.vids.has(s)) { this.load(s); if (this.loading.size > 1) return; }
      if (this.loading.size < 2) this.load(s + d);
      if (this.loading.size < 2 && this.vids.has(s + d)) this.load(s - d);
    }
    trim() {
      const s = this.seg(this.target);
      for (const [i, v] of this.vids) if (Math.abs(i - s) > 2) { URL.revokeObjectURL(v.src); v.removeAttribute('src'); v.load(); this.vids.delete(i); }
    }
    kick() {
      if (this.busy) return;
      const f = this.target, i = this.seg(f), v = this.vids.get(i);
      if (!v || (this.shown === f && this.shownSeg === i)) return;
      const t = (f - this.segs[i][0] + 0.5) / this.fps;
      this.busy = true; this.sf = f; this.si = i; this.st0 = now();
      if (Math.abs(v.currentTime - t) < 1e-4 && v.readyState >= 2) { this.seeked(i, v); return; }
      v.currentTime = t;
    }
    seeked(i, v) {
      if (!this.busy || i !== this.si) return;
      const fin = () => {
        this.busy = false;
        cover(this.ctx, v, v.videoWidth, v.videoHeight); this.shown = this.sf; this.shownSeg = i;
        this.seekMs.push(now() - this.st0); if (this.seekMs.length > 400) this.seekMs.shift();
        this.kick(); this.o.onLoad && this.o.onLoad(-1);
      };
      // Safari can fire "seeked" before the new frame is decoded; wait for it to be presented when the API exists
      if (v.requestVideoFrameCallback && this.o.rvfc) v.requestVideoFrameCallback(fin); else fin();
    }
    draw(f) { if (this.aim(f) || !this.vids.has(this.seg(this.target))) this.want(); this.kick(); return this.shown; }
    redraw() { const v = this.vids.get(this.shownSeg); if (v && v.readyState >= 2) cover(this.ctx, v, v.videoWidth, v.videoHeight); return this.shown; }
    stats() { return { bytes: this.bytes, reqs: this.reqs, videos: this.vids.size, seekMs: this.seekMs.slice() }; }
  }

  G.Scrub = { ImgEngine, VideoEngine, cover };
})(window);
