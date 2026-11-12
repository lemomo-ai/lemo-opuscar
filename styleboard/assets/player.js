/* The Workbench projector: one component for every film on the site.
   - a style page: one film;  - OPUSCAR 98: 98 chapters on the ruler;  - the thank-you films: several players on one page.
   Markup (written by styleboard/pages.py; without JS the browser's own controls stay):
     <div class="player" data-player data-dur="39.67" data-fps="24" data-title="The Colour of Rain"
          data-sprite="…/sprite.webp" data-grid="10,176,99,40,1"     columns, cell w, cell h, cells, seconds per cell (0 = one cell per chapter)
          data-chapters="ch-o98" data-now="1"                          id of a <script type="application/json"> with {spans, majors}; now=1 captions the chapter on the picture
          data-download="https://…/impasto.mp4" data-bigplay="0"      bigplay="0": the page has its own play button (the style page's label)
          data-bar="below">                                            below: the controls sit under the picture, not on it (films with burned-in captions)
       <video src="…" controls preload="metadata" playsinline poster="…/poster.jpg"></video>
       <picture class="pl-poster">…</picture>                          the poster in AVIF/WebP (the video's poster attribute is the no-JS one)
       <div class="pl-slot">…</div>                                    optional: page layers drawn on the picture, under the controls
     </div>
   Keys (for the player in use: focused, last touched, or the one on screen): Space/K play-pause, ← → 5 s, [ ] previous/next chapter,
   , . one frame (paused), 0–9 jump to 0–90 %, M mute, F full screen. Volume is remembered (localStorage, opuscar-player).
   Events on the player element: oc:state {state: idle|playing|paused|ended}, oc:idle {idle}, oc:chapter {i}. API: window.OCPlayer;
   a player: play() pause() toggle() seek(t, play) setLoop(a, b) / setLoop(null) chapterAt(t) fullscreen().
   Rules: styleboard/DESIGN.md §5 "Player". */
(() => {
  'use strict';
  const d = document, H = d.documentElement;
  const ZH = /^zh/i.test(H.lang || '');
  const W = ZH ? {
    play: '播放', pause: '暂停', replay: '重新播放', mute: '静音', unmute: '取消静音', vol: '音量', seek: '影片进度',
    fs: '全屏', fsx: '退出全屏', dl: '下载 1080p', dlLabel: '下载 1080p 影片', loading: '正在缓冲', error: '影片没能载入',
    of: ' / ', prev: '上一段', next: '下一段', playT: '播放《{t}》'
  } : {
    play: 'Play', pause: 'Pause', replay: 'Play again', mute: 'Mute', unmute: 'Unmute', vol: 'Volume', seek: 'Position in the film',
    fs: 'Full screen', fsx: 'Exit full screen', dl: '1080p', dlLabel: 'Download the 1080p film', loading: 'Loading', error: 'The film could not be loaded',
    of: ' of ', prev: 'Previous chapter', next: 'Next chapter', playT: 'Play {t}'
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'opuscar-player';
  const prefs = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const keep = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { } };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // m:ss. A length is rounded (39.7 s is 0:40, as the page says), a position floored.
  const tc = (t, round) => { t = Math.max(0, (round ? Math.round : Math.floor)(t || 0)); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const el = (tag, cls, html) => { const e = d.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // thin-line glyphs: 20 x 20, 1.4 stroke, square ends; the solid ones are the play and pause marks
  const I = {
    play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="f" d="M6 4.2v11.6L15.4 10z"/></svg>',
    pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="f" d="M5.6 4.4h2.6v11.2H5.6zM11.8 4.4h2.6v11.2h-2.6z"/></svg>',
    replay: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.6 10.6a5.6 5.6 0 1 0 1.9-4.9"/><path d="M6.4 2.6v3.4h3.4"/></svg>',
    prev: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4.5v11"/><path class="f" d="M15.5 4.6v10.8L7.6 10z"/></svg>',
    next: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 4.5v11"/><path class="f" d="M4.5 4.6v10.8L12.4 10z"/></svg>',
    vol: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.2 7.6h3.1l4.1-3.4v11.6l-4.1-3.4H3.2z"/><path class="w1" d="M13.2 7.4a3.7 3.7 0 0 1 0 5.2"/><path class="w2" d="M15.4 5.2a6.9 6.9 0 0 1 0 9.6"/><path class="x" d="M13.4 8l4 4M17.4 8l-4 4"/></svg>',
    fs: '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="o" d="M3.4 7.6V3.4h4.2M12.4 3.4h4.2v4.2M16.6 12.4v4.2h-4.2M7.6 16.6H3.4v-4.2"/><path class="i" d="M7.6 3.4v4.2H3.4M16.6 7.6h-4.2V3.4M12.4 16.6v-4.2h4.2M3.4 12.4h4.2v4.2"/></svg>',
    // the big mark on an unplayed film: a viewfinder's four corners round a play triangle
    big: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M4.5 17V4.5H17M55 4.5h12.5V17M67.5 55v12.5H55M17 67.5H4.5V55"/><path class="f" d="M29 24.5v23L47.5 36z"/></svg>',
    bigReplay: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M4.5 17V4.5H17M55 4.5h12.5V17M67.5 55v12.5H55M17 67.5H4.5V55"/><path d="M27.5 37.5a9 9 0 1 0 3-7.6"/><path d="M30.6 25.6v5h5"/></svg>'
  };

  // ruler ticks for a plain film: a minor tick every m seconds, a numbered major every M (at most ~80 minors and ~9 majors)
  function ticksFor(dur) {
    for (const [m, M] of [[1, 10], [2, 10], [5, 30], [10, 60], [15, 60], [30, 120], [60, 300], [120, 600]]) if (dur / m <= 80 && dur / M <= 9) return [m, M];
    return [300, 1800];
  }

  const all = [];
  let active = null;

  class Player {
    constructor(root) {
      this.root = root; root.ocPlayer = this;
      const v = this.v = root.querySelector('video');
      this.dur = +root.dataset.dur || 0;
      this.fps = +root.dataset.fps || 24;
      this.title = root.dataset.title || '';
      this.state = 'idle'; this.started = false;
      const ch = root.dataset.chapters && d.getElementById(root.dataset.chapters);
      this.ch = ch ? JSON.parse(ch.textContent) : null;              // {spans: [[t0, label, sub, kind]], majors: [[t, label]]}
      const g = (root.dataset.grid || '').split(',').map(Number);
      this.grid = g.length === 5 ? { cols: g[0], w: g[1], h: g[2], n: g[3], step: g[4] } : null;
      this.build();
      this.wire();
      all.push(this);
    }

    // ------------------------------------------------------------ markup
    build() {
      const r = this.root, v = this.v;
      v.removeAttribute('controls'); v.controls = false; v.playsInline = true; v.setAttribute('playsinline', '');
      v.disableRemotePlayback = false;
      this.below = r.dataset.bar === 'below';
      if (this.below) r.classList.add('below');
      const box = this.box = el('div', 'pl-box');
      const poster = r.querySelector('.pl-poster'), slot = r.querySelector('.pl-slot');
      box.append(v); if (poster) box.append(poster); if (slot) box.append(slot);
      box.append(el('div', 'pl-shade'));
      if (this.ch && r.dataset.now === '1') box.append(this.now = el('p', 'pl-now'));   // off for OPUSCAR 98: the film titles its own chapters
      if (r.dataset.bigplay !== '0') {
        this.big = el('button', 'pl-big', I.big); this.big.type = 'button';
        this.big.setAttribute('aria-label', this.title ? W.playT.replace('{t}', this.title) : W.play);
        box.append(this.big);
      }
      this.loupe = el('div', 'pl-loupe', '<span class="pl-thumb"></span><span class="pl-lt"><b></b><span></span></span>');
      this.loupe.setAttribute('aria-hidden', 'true');
      box.append(this.loupe);

      const bar = this.bar = el('div', 'pl-bar');
      const btn = (cls, svg, label) => { const b = el('button', 'pl-btn ' + cls, svg); b.type = 'button'; b.setAttribute('aria-label', label); return b; };
      if (this.ch) bar.append(this.bPrev = btn('pl-prev', I.prev, W.prev));
      bar.append(this.bPlay = btn('pl-play', I.play, W.play));
      if (this.ch) bar.append(this.bNext = btn('pl-next', I.next, W.next));
      bar.append(this.time = el('span', 'pl-time', `<b>0:00</b><i>/</i><span>${tc(this.dur, 1)}</span>`));
      this.time.setAttribute('aria-hidden', 'true');
      const rule = this.rule = el('div', 'pl-rule',
        '<span class="pl-base"></span><span class="pl-buf"></span><span class="pl-seg"></span><span class="pl-ticks"></span>' +
        '<span class="pl-ticks lit" aria-hidden="true"></span><span class="pl-done"></span><span class="pl-hover"></span><span class="pl-head"></span>');
      rule.tabIndex = 0;
      Object.entries({ role: 'slider', 'aria-label': W.seek, 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(this.dur)), 'aria-valuenow': '0',
        'aria-valuetext': `0:00${W.of}${tc(this.dur, 1)}` }).forEach(([k, x]) => rule.setAttribute(k, x));
      bar.append(rule);
      bar.append(this.status = el('span', 'pl-status'));
      this.status.setAttribute('role', 'status'); this.status.setAttribute('aria-live', 'polite');
      bar.append(this.bMute = btn('pl-mute', I.vol, W.mute));
      this.bMute.setAttribute('aria-pressed', 'false');
      const vol = this.volEl = el('div', 'pl-vol', '<span class="pl-vbase"></span><i style="left:0"></i><i style="left:25%"></i><i style="left:50%"></i><i style="left:75%"></i><i style="left:100%"></i><span class="pl-vfill"></span><span class="pl-vhead"></span>');
      vol.tabIndex = 0;
      Object.entries({ role: 'slider', 'aria-label': W.vol, 'aria-valuemin': '0', 'aria-valuemax': '100' }).forEach(([k, x]) => vol.setAttribute(k, x));
      bar.append(vol);
      bar.append(this.bFs = btn('pl-fs', I.fs, W.fs));
      if (this.root.dataset.download) {
        const a = this.dl = el('a', 'pl-dl', esc(W.dl) + '<i aria-hidden="true">↓</i>');
        a.href = this.root.dataset.download; a.setAttribute('aria-label', W.dlLabel); a.rel = 'noopener';
        bar.append(a);
      }
      if (this.below) { bar.append(this.loupe); r.prepend(box); box.after(bar); }   // the loupe hangs under the ruler, off the picture
      else { box.append(bar); r.prepend(box); }
      r.classList.add('pl-on');
      this.ticks();
    }

    ticks() {
      const dur = this.dur || 1, out = [];
      const pct = t => (100 * t / dur).toFixed(3) + '%';
      if (this.ch) {
        const majors = new Set((this.ch.majors || []).map(m => m[0]));
        for (const s of this.ch.spans) if (s[0] > 0.01 && !majors.has(s[0])) out.push(`<i style="left:${pct(s[0])}"${s[3] === 'x' ? ' class="x"' : ''}></i>`);
        for (const [t, lab] of this.ch.majors || []) out.push(`<i class="M" style="left:${pct(t)}"><b>${esc(lab)}</b></i>`);
      } else {
        const [m, M] = ticksFor(dur);
        for (let t = m; t < dur - m * .3; t += m) {
          const big = Math.abs(t / M - Math.round(t / M)) < 1e-6;
          out.push(`<i${big ? ' class="M"' : ''} style="left:${pct(t)}">${big ? `<b>${tc(t)}</b>` : ''}</i>`);
        }
      }
      for (const t of this.rule.querySelectorAll('.pl-ticks')) t.innerHTML = out.join('');
      this.thin();
    }

    // numbers that would touch the one before them are hidden (a narrow ruler keeps every other year, or fewer)
    thin() {
      for (const t of this.rule.querySelectorAll('.pl-ticks')) {
        let end = -Infinity;
        for (const b of t.querySelectorAll('b')) {
          b.style.visibility = '';
          const r = b.getBoundingClientRect();
          if (!r.width) continue;
          if (r.left < end + 8) b.style.visibility = 'hidden'; else end = r.right;
        }
      }
    }

    // ------------------------------------------------------------ behaviour
    wire() {
      const v = this.v, r = this.root;
      const p = prefs();
      if (typeof p.v === 'number') v.volume = clamp(p.v, 0, 1);
      if (p.m) v.muted = true;                     // never autoplays, so a remembered mute only matters once someone presses play
      this.paintVol();

      this.bPlay.addEventListener('click', () => this.toggle());
      if (this.big) this.big.addEventListener('click', () => this.toggle());
      if (this.bPrev) this.bPrev.addEventListener('click', () => this.chapterStep(-1));
      if (this.bNext) this.bNext.addEventListener('click', () => this.chapterStep(1));
      this.bMute.addEventListener('click', () => this.mute());
      this.bFs.addEventListener('click', () => this.fullscreen());

      // the picture: click = play / pause, double click = full screen; a tap first brings the controls back
      this.box.addEventListener('pointerdown', e => { this.lastPointer = e.pointerType; });
      this.box.addEventListener('click', e => {
        if (e.target.closest('.pl-bar, .pl-big, a, button, input, .pl-slot a')) return;
        if (this.lastPointer === 'touch' && r.classList.contains('idle')) { this.poke(); return; }
        this.toggle();
      });
      this.box.addEventListener('dblclick', e => { if (!e.target.closest('.pl-bar')) this.fullscreen(); });

      const on = (ev, fn) => v.addEventListener(ev, fn);
      on('play', () => { this.set('playing'); this.wait(v.readyState < 3); this.loop(); for (const o of all) if (o !== this) o.pause(); active = this; });
      on('playing', () => { this.wait(false); this.start(); });
      on('pause', () => { if (!v.ended) this.set('paused'); this.paint(); });
      on('ended', () => { if (this.loopRange) { v.currentTime = this.loopRange[0]; v.play(); return; } this.set('ended'); this.paint(); });
      on('waiting', () => this.wait(true));
      on('seeking', () => { if (!v.paused) this.wait(true); });
      on('seeked', () => { this.wait(false); if (v.currentTime > .05) this.start(); this.paint(); });
      on('canplay', () => { if (v.paused || v.readyState >= 3) this.wait(false); });
      on('progress', () => this.paintBuf());
      on('timeupdate', () => { if (v.paused) this.paint(); this.paintBuf(); });
      on('loadedmetadata', () => { if (v.duration && isFinite(v.duration) && Math.abs(v.duration - this.dur) > .5) { this.dur = v.duration; this.ticks(); this.time.lastChild.textContent = tc(this.dur, 1); } this.paint(); });
      on('volumechange', () => { this.paintVol(); keep({ v: +v.volume.toFixed(2), m: v.muted }); });
      on('error', () => { r.classList.add('err'); this.wait(false); this.say(W.error); });

      // activity: the controls fade out while the film plays and nobody moves (not with reduced motion, not while focused)
      for (const ev of ['pointermove', 'pointerdown', 'focusin', 'keydown']) r.addEventListener(ev, () => { this.poke(); active = this; }, { passive: true });
      r.addEventListener('pointerleave', () => { if (this.state === 'playing') this.hideSoon(700); });

      this.scrubber();
      this.volume();
      for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) d.addEventListener(ev, () => {
        const fs = (d.fullscreenElement || d.webkitFullscreenElement) === r;
        r.classList.toggle('fs', fs);
        this.bFs.setAttribute('aria-label', fs ? W.fsx : W.fs);
        this.poke();
      });
      if ('ResizeObserver' in window) new ResizeObserver(() => { this.paint(); this.thin(); }).observe(this.rule);
      this.paint(); this.paintBuf();
    }

    set(state) {
      if (this.state === state) return;
      this.state = state;
      const r = this.root;
      r.dataset.state = state;
      const playing = state === 'playing';
      this.bPlay.innerHTML = playing ? I.pause : state === 'ended' ? I.replay : I.play;
      this.bPlay.setAttribute('aria-label', playing ? W.pause : state === 'ended' ? W.replay : W.play);
      if (this.big) this.big.innerHTML = state === 'ended' ? I.bigReplay : I.big;
      if (!playing) this.poke(); else this.hideSoon();
      r.dispatchEvent(new CustomEvent('oc:state', { bubbles: true, detail: { state, player: this } }));
    }
    start() { if (!this.started) { this.started = true; this.root.classList.add('started'); } }
    wait(on) {
      this.waiting = on; this.root.classList.toggle('wait', on);
      clearTimeout(this.waitT);
      if (on) this.waitT = setTimeout(() => { if (this.waiting) this.say(W.loading); }, 350);   // say it only if it lasts
      else if (!this.root.classList.contains('err')) this.say('');
    }
    say(text) { if (this.status.textContent !== text) this.status.textContent = text; }

    play() {
      const v = this.v;
      if (v.ended) v.currentTime = 0;
      if (v.readyState < 3) this.wait(true);
      const p = v.play();
      if (p && p.catch) p.catch(() => { this.wait(false); this.set(v.paused ? (this.started ? 'paused' : 'idle') : 'playing'); });
    }
    pause() { if (!this.v.paused) this.v.pause(); }
    toggle() { this.v.paused || this.v.ended ? this.play() : this.pause(); }
    seek(t, play) {
      const v = this.v; t = clamp(t, 0, (this.dur || v.duration || 0) - .05);
      if (v.readyState === 0 && v.preload === 'none') v.preload = 'auto';
      v.currentTime = t; this.paint(t);
      if (play) this.play();
    }
    setLoop(a, b) { this.loopRange = a == null ? null : [a, b]; this.root.classList.toggle('looping', !!this.loopRange); }
    nudge(dt) { this.seek((this.v.currentTime || 0) + dt); this.poke(); }
    frame(k) { this.pause(); this.seek((this.v.currentTime || 0) + k / this.fps); }
    mute() { const v = this.v; if (v.muted || v.volume === 0) { v.muted = false; if (v.volume < .05) v.volume = .6; } else v.muted = true; this.poke(); }
    fullscreen() {
      const r = this.root, v = this.v;
      if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
      const sys = () => { if (v.webkitEnterFullscreen) { try { v.webkitEnterFullscreen(); } catch (e) { } } };   // iPhone: the system's own full-screen player
      if (r.requestFullscreen) r.requestFullscreen({ navigationUI: 'hide' }).catch(sys);
      else if (r.webkitRequestFullscreen) r.webkitRequestFullscreen();
      else sys();
    }

    // chapters (OPUSCAR 98): which one a time falls in, and stepping between them
    chapterAt(t) {
      const s = this.ch && this.ch.spans; if (!s) return -1;
      let lo = 0, hi = s.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s[m][0] <= t + 1e-3) lo = m; else hi = m - 1; }
      return lo;
    }
    chapterStep(k) {
      const s = this.ch.spans, t = this.v.currentTime || 0, i = this.chapterAt(t);
      const j = k < 0 && t - s[i][0] > 1.5 ? i : clamp(i + k, 0, s.length - 1);   // back: to the start of this one first, as a CD player does
      this.seek(s[j][0] + .02, !this.v.paused); this.poke();
    }

    // ------------------------------------------------------------ painting (the ruler follows the film every frame while it plays)
    loop() {
      if (this.raf) return;
      const step = () => {
        const L = this.loopRange, v = this.v;
        if (L && !this.drag && v.currentTime >= L[1] - .04) v.currentTime = L[0];
        this.paint(); this.raf = !v.paused && !v.ended ? requestAnimationFrame(step) : 0;
      };
      this.raf = requestAnimationFrame(step);
    }
    paint(at) {
      const v = this.v, dur = this.dur || v.duration || 1;
      const t = this.scrubT != null ? this.scrubT : at != null ? at : (v.currentTime || 0);
      const f = clamp(t / dur, 0, 1), w = this.rule.clientWidth;
      this.rule.style.setProperty('--p', f.toFixed(5));
      this.rule.querySelector('.pl-head').style.transform = `translateX(${(f * w).toFixed(1)}px)`;
      this.rule.querySelector('.pl-done').style.transform = `scaleX(${f.toFixed(5)})`;
      this.rule.querySelector('.pl-ticks.lit').style.clipPath = `inset(0 ${(100 - f * 100).toFixed(3)}% 0 0)`;
      const s = Math.floor(t);
      if (s !== this.shownS) {
        this.shownS = s;
        this.time.firstChild.textContent = tc(t);
        this.rule.setAttribute('aria-valuenow', String(s));
        this.rule.setAttribute('aria-valuetext', `${tc(t)}${W.of}${tc(dur, 1)}` + (this.ch ? ' · ' + this.ch.spans[this.chapterAt(t)][1] : ''));
      }
      if (this.ch) {
        const i = this.chapterAt(t);
        if (i !== this.shownCh) {
          this.shownCh = i;
          const c = this.ch.spans[i];
          if (this.now) this.now.innerHTML = `<b>${esc(c[1])}</b>${c[2] ? `<span>${esc(c[2])}</span>` : ''}`;
          this.root.dispatchEvent(new CustomEvent('oc:chapter', { bubbles: true, detail: { i, chapter: c, player: this } }));
        }
      }
    }
    paintBuf() {
      const b = this.v.buffered, dur = this.dur || this.v.duration || 1, out = [];
      for (let i = 0; i < b.length; i++) out.push(`<i style="left:${(100 * b.start(i) / dur).toFixed(2)}%;width:${(100 * (b.end(i) - b.start(i)) / dur).toFixed(2)}%"></i>`);
      const h = out.join('');
      if (h !== this.bufH) { this.bufH = h; this.rule.querySelector('.pl-buf').innerHTML = h; }
    }
    paintVol() {
      const v = this.v, x = v.muted ? 0 : v.volume;
      this.volEl.style.setProperty('--v', x.toFixed(3));
      this.volEl.setAttribute('aria-valuenow', String(Math.round(x * 100)));
      this.volEl.setAttribute('aria-valuetext', v.muted ? W.mute : Math.round(x * 100) + '%');
      this.root.classList.toggle('muted', v.muted || v.volume === 0);
      this.root.classList.toggle('quiet', !v.muted && v.volume > 0 && v.volume < .5);
      this.bMute.setAttribute('aria-pressed', String(v.muted));
      this.bMute.setAttribute('aria-label', v.muted || v.volume === 0 ? W.unmute : W.mute);
    }

    // ------------------------------------------------------------ the ruler: hover shows a frame from the sprite, drag scrubs
    scrubber() {
      const rule = this.rule, lp = this.loupe, th = lp.querySelector('.pl-thumb'), lt = lp.querySelector('.pl-lt');
      let sprite = null;
      const wantSprite = () => {
        if (sprite || !this.root.dataset.sprite || !this.grid) return;
        sprite = new Image(); sprite.decoding = 'async';
        sprite.onload = () => { const g = this.grid; th.style.backgroundImage = `url("${sprite.src}")`; th.style.backgroundSize = `${g.cols * g.w}px auto`; lp.classList.add('pic'); };
        sprite.src = this.root.dataset.sprite;
      };
      const g = this.grid;
      if (g) { lp.style.setProperty('--tw', g.w + 'px'); lp.style.setProperty('--th', g.h + 'px'); }
      const at = x => { const r = rule.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1) * (this.dur || this.v.duration || 0); };
      const show = (x, t) => {
        const br = lp.parentElement.getBoundingClientRect(), rr = rule.getBoundingClientRect();
        const cell = !g ? -1 : g.step > 0 ? Math.min(g.n - 1, Math.floor(t / g.step)) : Math.min(g.n - 1, this.chapterAt(t));
        if (cell >= 0) th.style.backgroundPosition = `${-(cell % g.cols) * g.w}px ${-Math.floor(cell / g.cols) * g.h}px`;
        let txt = `<b>${tc(t)}</b>`;
        if (this.ch) { const c = this.ch.spans[this.chapterAt(t)]; txt = `<b>${esc(c[1])}<i>${tc(t)}</i></b>${c[2] ? `<span>${esc(c[2])}</span>` : ''}`; }
        if (lt.dataset.h !== txt) { lt.innerHTML = txt; lt.dataset.h = txt; }
        const w = lp.offsetWidth || 180;
        lp.style.transform = `translateX(${clamp(x - br.left - w / 2, 8, br.width - w - 8).toFixed(1)}px)`;
        lp.classList.add('on');
        rule.querySelector('.pl-hover').style.transform = `translateX(${(x - rr.left).toFixed(1)}px)`;
        rule.classList.add('hov');
        if (this.ch) {   // light the stretch of the ruler that this chapter covers
          const i = this.chapterAt(t), s = this.ch.spans, dur = this.dur || 1, a = s[i][0], b = i + 1 < s.length ? s[i + 1][0] : dur;
          const seg = rule.querySelector('.pl-seg'); seg.style.left = (100 * a / dur) + '%'; seg.style.width = (100 * (b - a) / dur) + '%';
        }
      };
      const hide = () => { lp.classList.remove('on'); rule.classList.remove('hov'); };
      rule.addEventListener('pointerenter', wantSprite);
      rule.addEventListener('focus', wantSprite);
      this.v.addEventListener('playing', wantSprite, { once: true });
      rule.addEventListener('pointermove', e => { if (!this.drag) show(e.clientX, at(e.clientX)); });
      rule.addEventListener('pointerleave', () => { if (!this.drag) hide(); });
      rule.addEventListener('pointerdown', e => {
        if (e.button) return;
        e.preventDefault(); rule.focus({ preventScroll: true }); wantSprite();
        this.drag = true; rule.setPointerCapture(e.pointerId); this.root.classList.add('scrub');
        this.scrubT = at(e.clientX); show(e.clientX, this.scrubT); this.paint();
        this.seekSoon(this.scrubT, true);
      });
      rule.addEventListener('pointermove', e => {
        if (!this.drag) return;
        this.scrubT = at(e.clientX); show(e.clientX, this.scrubT); this.paint(); this.seekSoon(this.scrubT, true);
      });
      const end = e => {
        if (!this.drag) return;
        this.drag = false; this.root.classList.remove('scrub');
        const t = this.scrubT; this.scrubT = null;
        if (t != null) this.seek(t);
        if (e.pointerType !== 'mouse') hide(); else if (!rule.matches(':hover')) hide();
      };
      rule.addEventListener('pointerup', end); rule.addEventListener('pointercancel', end);
      rule.addEventListener('keydown', e => {
        const dur = this.dur || 0;
        let t = null;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = e.shiftKey && this.ch ? null : (this.v.currentTime || 0) - 5;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = e.shiftKey && this.ch ? null : (this.v.currentTime || 0) + 5;
        else if (e.key === 'PageDown') t = (this.v.currentTime || 0) - dur / 10;
        else if (e.key === 'PageUp') t = (this.v.currentTime || 0) + dur / 10;
        else if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = dur - .1;
        else return;
        e.preventDefault(); e.stopPropagation();
        if (t == null) { this.chapterStep(e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1); return; }
        this.seek(t); this.poke();
      });
    }
    seekSoon(t, fast) {   // while dragging: at most one seek per frame, the quick (keyframe) kind where the browser has it
      this.pendT = t;
      if (this.seekRaf) return;
      this.seekRaf = requestAnimationFrame(() => {
        this.seekRaf = 0; const v = this.v;
        if (v.readyState === 0 && v.preload === 'none') v.preload = 'auto';
        if (fast && v.fastSeek && Math.abs(v.currentTime - this.pendT) > 1) v.fastSeek(this.pendT); else v.currentTime = this.pendT;
      });
    }

    volume() {
      const vol = this.volEl, v = this.v;
      const setX = x => { const r = vol.getBoundingClientRect(); const k = clamp((x - r.left) / r.width, 0, 1); v.volume = k; v.muted = k === 0; };
      vol.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); vol.setPointerCapture(e.pointerId); this.vdrag = true; setX(e.clientX); });
      vol.addEventListener('pointermove', e => { if (this.vdrag) setX(e.clientX); });
      const end = () => { this.vdrag = false; };
      vol.addEventListener('pointerup', end); vol.addEventListener('pointercancel', end);
      vol.addEventListener('keydown', e => {
        const k = { ArrowRight: .1, ArrowUp: .1, ArrowLeft: -.1, ArrowDown: -.1, PageUp: .25, PageDown: -.25 }[e.key];
        if (k == null && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault(); e.stopPropagation();
        const x = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : clamp((v.muted ? 0 : v.volume) + k, 0, 1);
        v.volume = +x.toFixed(2); v.muted = x === 0;
      });
    }

    // ------------------------------------------------------------ controls in and out
    poke() {
      this.root.classList.remove('idle');
      if (this.idle) { this.idle = false; this.root.dispatchEvent(new CustomEvent('oc:idle', { bubbles: true, detail: { idle: false, player: this } })); }
      this.hideSoon();
    }
    hideSoon(ms = 2600) {
      clearTimeout(this.idleT);
      if (this.state !== 'playing' || reduce.matches) return;
      this.idleT = setTimeout(() => {
        if (this.state !== 'playing' || this.drag || this.vdrag || this.bar.querySelector(':focus-visible') || this.bar.matches(':hover')) return;   // a keyboard user keeps the controls
        this.root.classList.add('idle');
        this.loupe.classList.remove('on');
        if (!this.idle) { this.idle = true; this.root.dispatchEvent(new CustomEvent('oc:idle', { bubbles: true, detail: { idle: true, player: this } })); }
      }, ms);
    }
  }

  // ---------------------------------------------------------------- keys: they go to the player in use
  const seen = new Map();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => seen.set(e.target, e.intersectionRatio)), { threshold: [0, .25, .5, .75, 1] }) : null;
  function pick(target) {
    const own = target && target.closest && target.closest('.player.pl-on');
    if (own) return own.ocPlayer;
    const dlg = d.querySelector('dialog[open]'), inDlg = dlg && dlg.querySelector('.player.pl-on');
    if (inDlg) return inDlg.ocPlayer;
    if (active && (seen.get(active.root) || 0) >= .4) return active;
    let best = null, r = .5;
    for (const p of all) { const x = seen.get(p.root) || 0; if (x >= r) { best = p; r = x; } }
    return best;
  }
  d.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const p = pick(t); if (!p) return;
    const dlg = d.querySelector('dialog[open]'); if (dlg && !dlg.contains(p.root)) return;   // search open: keys are the search's
    const inside = p.root.contains(t);
    const onControl = t.closest && t.closest('button, a, [role="slider"], summary');
    const k = e.key;
    if ((k === ' ' || k === 'Enter') && onControl) return;          // Space and Enter on a focused control do what that control does
    if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); p.toggle(); p.poke(); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (onControl && !inside) return;                              // a slider or a link elsewhere on the page keeps its arrows
      e.preventDefault(); if (e.shiftKey && p.ch) p.chapterStep(k === 'ArrowLeft' ? -1 : 1); else p.nudge(k === 'ArrowLeft' ? -5 : 5);
    }
    else if ((k === '[' || k === ']') && p.ch) { e.preventDefault(); p.chapterStep(k === '[' ? -1 : 1); }
    else if (k === 'm' || k === 'M') { e.preventDefault(); p.mute(); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); p.fullscreen(); }
    else if ((k === ',' || k === '.') && p.v.paused) { e.preventDefault(); p.frame(k === ',' ? -1 : 1); }
    else if (/^[0-9]$/.test(k)) { e.preventDefault(); p.seek((p.dur || p.v.duration || 0) * (+k / 10)); p.poke(); }
  });

  function init(root = d) {
    for (const r of root.querySelectorAll('[data-player]:not(.pl-on)')) { const p = new Player(r); if (io) io.observe(r); }
  }
  window.OCPlayer = { all, init, get: r => r && r.ocPlayer, get active() { return active; } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', () => init()); else init();
})();
