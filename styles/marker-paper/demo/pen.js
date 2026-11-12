// Marker on white paper: the brush.
// Added for motion: strokes and letters drawn up to a length (the nib's head), a small boil on twos,
// ink density (same-colour overlaps and corners darken like a real marker), glyph-skeleton handwriting.
// Marker on white paper: a clean brush.
// Strokes and lettering are painted into one coverage layer per ink (black / red / blue),
// then multiplied onto the paper. Nothing is blurred and nothing spills outside a stroke:
// no shadows, no outward bleed, no outlines on letters.
// Stroke geometry (resample, chaikin, wobble, ribbon) adapted from styles/whiteboard/demo/engine/wb.js.
import { clamp, lerp, vnoise, hash, mulberry, TAU } from '/core/lib.js';

export const W = 1920, H = 1080;
// palette (STYLE.md §3)
export const PAPER = [250, 249, 245];             // #FAF9F5
export const INK = {
  black: { rgb: [27, 28, 32], a: .97 },            // #1B1C20  bullet-tip permanent marker
  red:   { rgb: [226, 59, 46], a: .9 },            // #E23B2E
  blue:  { rgb: [36, 86, 214], a: .9 },            // #2456D6
};

function resample(p, step) {
  const o = [p[0], p[1]]; let carry = 0;
  for (let i = 2; i < p.length; i += 2) {
    const ax = p[i - 2], ay = p[i - 1], bx = p[i], by = p[i + 1], d = Math.hypot(bx - ax, by - ay);
    let s = step - carry;
    while (s <= d) { o.push(ax + (bx - ax) * s / d, ay + (by - ay) * s / d); s += step; }
    carry = d - (s - step);
  }
  const n = p.length; if (Math.hypot(o[o.length - 2] - p[n - 2], o[o.length - 1] - p[n - 1]) > step * .25) o.push(p[n - 2], p[n - 1]);
  return o;
}
function chaikin(p, it = 1) {
  for (let k = 0; k < it; k++) {
    const o = [p[0], p[1]];
    for (let i = 0; i < p.length - 2; i += 2) {
      const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3];
      o.push(ax * .75 + bx * .25, ay * .75 + by * .25, ax * .25 + bx * .75, ay * .25 + by * .75);
    }
    o.push(p[p.length - 2], p[p.length - 1]); p = o;
  }
  return p;
}

let SEED = 11, BOIL = 0;
export const reseed = s => { SEED = s; };
export const setBoil = b => { BOIL = b; };           // 0, 1, 2: three drawings of every line, cycled on twos
const BOIL_AMP = .85;                                 // px: the line breathes, letters never move
export class Stroke {
  // o: {color, w, jitter, wav, smooth, over, pool}
  constructor(pts, o = {}) {
    this.color = o.color || 'black'; this.w = o.w ?? 8;
    this.seed = o.seed ?? (SEED += 7); this.pool = o.pool ?? 1;
    const step = Math.max(2, this.w * .45);
    let p = resample(o.smooth ? chaikin(pts, o.smooth) : pts, step);
    const J = o.jitter ?? 1, wav = o.wav ?? 260, p0 = p;   // p0: the path before the hand wobbles (corners are found here, so they never flicker)
    if (J > 0 && p.length > 4) {             // slow arm wobble + a little finger tremor, along the normal
      const q = p.slice(); let s = 0;
      for (let i = 0; i < p.length; i += 2) {
        const j = Math.min(i, p.length - 4), tx = p[j + 2] - p[j], ty = p[j + 3] - p[j + 1], tl = Math.hypot(tx, ty) || 1;
        if (i) s += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
        const off = J * (1.9 * ((vnoise(s / wav + this.seed * 7.31) - .5) * 2) + .35 * ((vnoise(s / 11 + this.seed * 3.1) - .5) * 2))
          + (BOIL ? BOIL_AMP * Math.min(1, J + .3) * ((vnoise(s / 70 + this.seed * 2.3 + BOIL * 17.1) - vnoise(s / 70 + this.seed * 2.3)) * 1.6) : 0);
        q[i] = p[i] - ty / tl * off; q[i + 1] = p[i + 1] + tx / tl * off;
      }
      p = q;
    }
    if (o.over && p.length > 4) {            // the hand runs a little past the corner
      const n = p.length, tx = p[n - 2] - p[n - 4], ty = p[n - 1] - p[n - 3], tl = Math.hypot(tx, ty) || 1;
      const hk = (hash(this.seed) - .5) * .5;
      for (let k = 1; k <= 4; k++) {
        const f = o.over * k / 4, a = hk * k / 4;
        p.push(p[n - 2] + (tx / tl * Math.cos(a) - ty / tl * Math.sin(a)) * f, p[n - 1] + (ty / tl * Math.cos(a) + tx / tl * Math.sin(a)) * f);
      }
    }
    this.pts = Float32Array.from(p);
    const n = p.length / 2; this.cum = new Float32Array(n);
    for (let i = 1; i < n; i++) this.cum[i] = this.cum[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
    this.len = this.cum[n - 1] || .001;
    // corners: where the nib turns sharply it slows and leaves a little more ink
    this.corners = [];
    const win = Math.max(3, Math.round(this.w * 1.2 / step));
    const n0 = p0.length / 2;
    for (let i = win; i < n0 - win; i++) {
      const a1 = Math.atan2(p0[2 * i + 1] - p0[2 * (i - win) + 1], p0[2 * i] - p0[2 * (i - win)]);
      const a2 = Math.atan2(p0[2 * (i + win) + 1] - p0[2 * i + 1], p0[2 * (i + win)] - p0[2 * i]);
      let da = Math.abs(a2 - a1); if (da > Math.PI) da = TAU - da;
      if (da > .85 && (!this.corners.length || this.cum[i] - this.corners[this.corners.length - 1].L > this.w * 2)) this.corners.push({ L: this.cum[i], x: p[2 * i], y: p[2 * i + 1], k: Math.min(1, da / 1.6) });
    }
  }
  at(L) {
    const c = this.cum, p = this.pts; L = clamp(L, 0, this.len);
    let lo = 0, hi = c.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] < L) lo = m; else hi = m; }
    const u = (L - c[lo]) / ((c[hi] - c[lo]) || 1);
    return [lerp(p[2 * lo], p[2 * hi], u), lerp(p[2 * lo + 1], p[2 * hi + 1], u)];
  }
  get start() { return [this.pts[0], this.pts[1]]; }
  get end() { const n = this.pts.length; return [this.pts[n - 2], this.pts[n - 1]]; }
}

// ribbon outline: bullet nib, near-constant width, a soft touch-down and a slight lift at the end
function ribbon(ctx, s0, upTo = Infinity) {
  let s = s0;
  if (upTo < s0.len - .01) {                      // the nib is still moving: cut the polyline at its head
    const c0 = s0.cum, p0 = s0.pts; let k = 0; while (k < c0.length - 1 && c0[k + 1] <= upTo) k++;
    const hd = s0.at(upTo), pts = Array.from(p0.subarray(0, 2 * (k + 1))), cum = Array.from(c0.subarray(0, k + 1));
    if (upTo - cum[k] > .3) { pts.push(hd[0], hd[1]); cum.push(upTo); }
    s = { pts, cum, len: s0.len, w: s0.w, seed: s0.seed };
  }
  const p = s.pts, c = s.cum, n = c.length;
  if (n < 2 || s0.len < s.w * .8) { const r = s.w * .55 * Math.min(1, upTo / Math.max(s0.len, 1) + .4); ctx.moveTo(p[0] + r, p[1]); ctx.arc(p[0], p[1], r, 0, TAU); return; }
  const Hh = new Float32Array(n), nx = new Float32Array(n), ny = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    const tx = p[2 * b] - p[2 * a], ty = p[2 * b + 1] - p[2 * a + 1], tl = Math.hypot(tx, ty) || 1;
    nx[i] = -ty / tl; ny[i] = tx / tl;
    const d = c[i];
    const pr = Math.min(1, .86 + d / (s.w * 3)) * (1 - .1 * clamp((d - (s.len - s.w * 2)) / (s.w * 2)));
    Hh[i] = s.w * .5 * pr * (.97 + .06 * vnoise(d / 31 + s.seed));
  }
  ctx.moveTo(p[0] + nx[0] * Hh[0], p[1] + ny[0] * Hh[0]);
  for (let i = 1; i < n; i++) ctx.lineTo(p[2 * i] + nx[i] * Hh[i], p[2 * i + 1] + ny[i] * Hh[i]);
  const ae = Math.atan2(ny[n - 1], nx[n - 1]); ctx.arc(p[2 * n - 2], p[2 * n - 1], Hh[n - 1], ae, ae - Math.PI, true);
  for (let i = n - 2; i >= 0; i--) ctx.lineTo(p[2 * i] - nx[i] * Hh[i], p[2 * i + 1] - ny[i] * Hh[i]);
  const as = Math.atan2(-ny[0], -nx[0]); ctx.arc(p[0], p[1], Hh[0], as, as - Math.PI, true);
  ctx.closePath();
}

// ───────── shapes (return Stroke or arrays of Strokes)
export const line = (x0, y0, x1, y1, o = {}) => {
  const d = Math.hypot(x1 - x0, y1 - y0) || 1, bow = (o.bow ?? .01) * d * (hash(SEED * 1.7) - .5) * 2;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
  return new Stroke([x0, y0, mx + nx * bow, my + ny * bow, x1, y1], { smooth: 2, ...o });
};
export const poly = (pts, o = {}) => new Stroke(pts.flat(), o);
export const curve = (pts, o = {}) => new Stroke(pts.flat(), { smooth: 3, ...o });
export function arc(cx, cy, r, a0, a1, o = {}) {
  const n = Math.max(10, Math.ceil(Math.abs(a1 - a0) * r / 7)), p = [], ry = o.ry ?? r;
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * ry); }
  return new Stroke(p, { wav: 300, ...o });
}
export const circle = (cx, cy, r, o = {}) => { const a0 = o.a0 ?? -2.2; return arc(cx, cy, r, a0, a0 + TAU + (o.lap ?? .22), o); };
// four separate strokes, each corner slightly overshot
export function rect(x, y, w, h, o = {}) {
  const ov = o.over ?? 7;
  return [line(x, y, x + w, y, { ...o, over: ov }), line(x + w, y, x + w, y + h, { ...o, over: ov }),
          line(x + w, y + h, x, y + h, { ...o, over: ov }), line(x, y + h, x, y, { ...o, over: ov })];
}
// arrow: shaft + two head strokes drawn separately, the way a hand does it
export function arrowHead(sh, o = {}) {
  const [ex, ey] = sh.end, [px, py] = sh.at(sh.len - 24), a = Math.atan2(ey - py, ex - px), hl = o.head ?? 30, sp = o.spread ?? 2.6;
  const q = { ...o, bow: 0, wav: 400, jitter: .4, pool: .6 };
  return [line(ex + Math.cos(a + sp) * hl, ey + Math.sin(a + sp) * hl, ex, ey, q),
          line(ex, ey, ex + Math.cos(a - sp) * hl * .95, ey + Math.sin(a - sp) * hl * .95, q)];
}
export function arrow(x0, y0, x1, y1, o = {}) {
  const sh = o.via ? curve([[x0, y0], o.via, [x1, y1]], o) : line(x0, y0, x1, y1, { over: 0, ...o });
  return [sh, ...arrowHead(sh, o)];
}
export function arrow2(x0, y0, x1, y1, o = {}) {      // double-headed (measure)
  const sh = line(x0, y0, x1, y1, { over: 0, ...o });
  const rev = new Stroke([x1, y1, x0, y0], { jitter: 0, w: 1 });
  return [sh, ...arrowHead(sh, o), ...arrowHead(rev, o)];
}
// wavy "heat" arrow
export function wavy(x0, y0, x1, y1, o = {}) {
  const d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / d, uy = (y1 - y0) / d, amp = o.amp ?? 9, wl = o.wl ?? 46, p = [];
  const body = d - 10;
  for (let s = 0; s <= body; s += 4) {
    const k = Math.sin(s / wl * TAU) * amp * Math.min(1, s / 20, (body - s) / 20 + .2);
    p.push(x0 + ux * s - uy * k, y0 + uy * s + ux * k);
  }
  p.push(x0 + ux * d, y0 + uy * d);
  const sh = new Stroke(p, { jitter: .4, ...o });
  return [sh, ...arrowHead(sh, { head: 22, ...o })];
}
export function dashed(pts, o = {}) {
  const base = new Stroke(pts.flat(), { jitter: 0, smooth: o.smooth ?? 0, w: 1 });
  const dash = o.dash ?? 26, gap = o.gap ?? 16, out = [];
  for (let s = 0; s < base.len - 4; s += dash + gap) {
    const e = Math.min(base.len, s + dash), q = [];
    for (let u = s; u <= e; u += 4) q.push(...base.at(u)); q.push(...base.at(e));
    out.push(new Stroke(q, { jitter: .25, pool: .4, ...o }));
  }
  return out;
}
// separate parallel hatch strokes clipped to a convex polygon
export function hatch(polyPts, o = {}) {
  const ang = o.angle ?? -.9, sp = o.spacing ?? 18, ca = Math.cos(ang), sa = Math.sin(ang), R = mulberry(o.seed ?? 77);
  const P = polyPts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
  const v0 = Math.min(...P.map(p => p[1])), v1 = Math.max(...P.map(p => p[1])), out = [];
  for (let v = v0 + sp * .55; v < v1 - sp * .3; v += sp * (.9 + R() * .2)) {
    const xs = [];
    for (let i = 0; i < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
      if ((ay - v) * (by - v) < 0) xs.push(ax + (v - ay) / (by - ay) * (bx - ax));
    }
    if (xs.length < 2) continue; xs.sort((a, b) => a - b);
    const m = o.margin ?? 5;
    const a = xs[0] + m + R() * 5, b = xs[xs.length - 1] - m - R() * 5; if (b - a < 6) continue;
    const vv = v + (R() - .5) * 2;
    const A = [a * ca - vv * sa, a * sa + vv * ca], B = [b * ca - vv * sa, b * sa + vv * ca];
    out.push(line(A[0], A[1], B[0], B[1], { w: o.w ?? 4, jitter: .25, color: o.color, pool: .5, bow: .015 }));
  }
  return out;
}

// ───────── the sheet: one ink-density layer per colour
// Every stroke or letter adds one unit of density U to its colour's layer ('lighter'), so where two strokes
// of the same colour cross, or a stroke runs over a letter, the layer holds two units and compose() lays the
// ink twice (darker, the way a felt marker builds up). A single stroke never darkens itself (one filled path).
export const U = .3;
let GLY = null;
export const setGlyphs = g => { GLY = g; };
export class Ink {
  constructor() {
    this.L = {};
    for (const k of Object.keys(INK)) { const c = document.createElement('canvas'); c.width = W; c.height = H; this.L[k] = c; }
    this.oc = document.createElement('canvas'); this.oc.width = W; this.oc.height = H;
    this.ox = this.oc.getContext('2d', { willReadFrequently: false });
    this.M = [1, 0, 0, 1, 0, 0];   // camera: world (paper) → screen; strokes and letters are drawn through it, so they stay crisp
  }
  setCamera(M) { this.M = M; }
  clear() { for (const c of Object.values(this.L)) c.getContext('2d').clearRect(0, 0, W, H); }
  // one stroke, drawn up to length `upTo` (the nib's head)
  stroke(s, upTo = Infinity) {
    if (upTo <= 0) return;
    const ctx = this.L[s.color].getContext('2d');
    ctx.save(); ctx.setTransform(...this.M); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff'; ctx.globalAlpha = U;
    ctx.beginPath(); ribbon(ctx, s, upTo); ctx.fill();
    if (s.pool > 0 && s.len > s.w * 1.5) {     // nib rests at touch-down: a little denser, never wider
      const [x, y] = s.start;
      ctx.globalAlpha = U * .3 * s.pool; ctx.beginPath(); ctx.arc(x, y, s.w * .42, 0, TAU); ctx.fill();
    }
    for (const c of s.corners) {                // the nib slows in a sharp turn
      if (c.L > upTo) break;
      ctx.globalAlpha = U * .32 * c.k; ctx.beginPath(); ctx.arc(c.x, c.y, s.w * .4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  add(...a) { for (const s of a.flat(4)) this.stroke(s); }
  // hand lettering from a marker font, laid out once (fixed seed: it never flickers)
  layout(str, x, y, o = {}) {
    const color = o.color || 'black', size = o.size ?? 56, fam = o.font ?? 'Kalam', weight = o.weight ?? 700;
    const ctx = this.L[color].getContext('2d');
    ctx.save(); ctx.font = `${weight} ${size}px "${fam}"`;
    const R = mulberry(o.seed ?? (SEED += 5)), chars = [...str], tr = o.track ?? 0;
    const adv = chars.map((ch, i) => ctx.measureText(chars.slice(0, i + 1).join('')).width - (i ? ctx.measureText(chars.slice(0, i).join('')).width : 0) + tr);
    ctx.restore();
    const w = adv.reduce((q, v) => q + v, 0);
    let cx = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0;
    const jit = o.jit ?? 1, G = GLY && GLY[fam + weight], gl = [];
    let L = 0;
    chars.forEach((ch, i) => {
      if (ch !== ' ') {
        const dy = (R() - .5) * size * .035 * jit, rot = (R() - .5) * .045 * jit, k = 1 + (R() - .5) * .04 * jit;
        const sk = ((G && G.g[ch]) || []).map(a => { const P = []; for (let j = 0; j < a.length; j += 2) P.push([a[j] * size, a[j + 1] * size]); return P; });
        const lens = sk.map(P => { let q = 0; for (let j = 1; j < P.length; j++) q += Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]); return q; });
        const len = Math.max(size * .2, lens.reduce((q, v) => q + v, 0) + Math.max(0, sk.length - 1) * size * .1);
        gl.push({ ch, ox: cx, dy, rot, k, sk, lens, len, L0: L }); L += len;
      }
      cx += adv[i];
    });
    return { str, x, y, color, size, fam, weight, rotAll: o.rot ?? 0, gl, L, w, hw: (G ? G.hw : .06) * size };
  }
  // draw a laid-out text up to skeleton length `upTo`; finished glyphs are filled whole
  write(T, upTo = Infinity) {
    if (upTo <= 0) return;
    const ctx = this.L[T.color].getContext('2d'), font = `${T.weight} ${T.size}px "${T.fam}"`;
    for (const g of T.gl) {
      if (g.L0 >= upTo) break;
      const part = upTo - g.L0;
      const place = c => { c.translate(T.x, T.y); c.rotate(T.rotAll); c.translate(g.ox, g.dy); c.rotate(g.rot); c.scale(g.k, g.k); };
      if (part >= g.len || !g.sk.length) {
        ctx.save(); ctx.setTransform(...this.M); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = U; ctx.fillStyle = '#fff'; ctx.font = font; ctx.textBaseline = 'alphabetic';
        place(ctx); ctx.fillText(g.ch, 0, 0); ctx.restore(); continue;
      }
      // the glyph the nib is writing: fill it on the side canvas, keep only what the nib has covered
      const o = this.ox;
      o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
      o.save(); o.setTransform(...this.M); place(o);
      o.globalCompositeOperation = 'source-over'; o.fillStyle = '#fff'; o.font = font; o.textBaseline = 'alphabetic'; o.fillText(g.ch, 0, 0);
      o.globalCompositeOperation = 'destination-in'; o.lineCap = 'round'; o.lineJoin = 'round'; o.lineWidth = T.hw * 2.9 + 1.5 * T.size / 60; o.strokeStyle = '#000';
      let left = part; o.beginPath();
      for (let k = 0; k < g.sk.length && left > 0; k++) {
        const P = g.sk[k]; o.moveTo(P[0][0], P[0][1]); if (P.length === 1) o.lineTo(P[0][0] + .1, P[0][1]);
        for (let j = 1; j < P.length && left > 0; j++) {
          const d = Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]);
          if (d <= left) { o.lineTo(P[j][0], P[j][1]); left -= d; }
          else { const u = left / d; o.lineTo(P[j - 1][0] + (P[j][0] - P[j - 1][0]) * u, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * u); left = 0; }
        }
        left -= T.size * .1;
      }
      o.stroke(); o.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = U; ctx.drawImage(this.oc, 0, 0); ctx.restore();
    }
  }
  measure(str, o = {}) {
    const ctx = this.L.black.getContext('2d'); ctx.save();
    ctx.font = `${o.weight ?? 700} ${o.size ?? 56}px "${o.font ?? 'Kalam'}"`;
    const w = ctx.measureText(str).width + (o.track ?? 0) * [...str].length; ctx.restore(); return w;
  }
}

// ───────── paper
function hash2(x, y) { let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
export function vnoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
}
// returns {rgb: Float32Array(W*H*3) paper colour, tooth: Float32Array(W*H) 0..1 fine grain}
export function makePaper(seed = 1, tint = [0, 0, 0]) {
  const N = W * H, rgb = new Float32Array(N * 3), tooth = new Float32Array(N), R = mulberry(seed * 977);
  const fib = new Float32Array(N);
  // a few hundred faint fibres, 1 px, short and bent
  for (let k = 0; k < 900; k++) {
    let x = R() * W, y = R() * H, a = R() * TAU; const len = 10 + R() * 34, s = (R() < .5 ? -1 : 1) * (1.2 + R() * 1.6);
    for (let i = 0; i < len; i++) {
      a += (R() - .5) * .25; x += Math.cos(a); y += Math.sin(a);
      const xi = x | 0, yi = y | 0; if (xi >= 0 && yi >= 0 && xi < W && yi < H) fib[yi * W + xi] += s;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const g = hash2(x + seed * 13.1, y - seed * 7.7);                 // per-pixel grain
    const m = vnoise2(x / 3.2 + seed, y / 3.2) ;                       // tooth
    const c = vnoise2(x / 90 + seed * 3, y / 90) - .5;                 // cloudy formation
    tooth[i] = m;
    // light: a soft fall-off from the top-left (one lamp over the desk), barely there
    const L = 1.5 - 3.2 * ((x / W) * .55 + (y / H) * .45);
    const v = L + (g - .5) * 2.2 + (m - .5) * 2.4 + c * 2.2 + fib[i];
    rgb[i * 3] = PAPER[0] + v + tint[0]; rgb[i * 3 + 1] = PAPER[1] + v + tint[1]; rgb[i * 3 + 2] = PAPER[2] + v * 1.05 + tint[2];
  }
  return { rgb, tooth };
}

// lay the ink on the paper: transmittance per channel. One unit = the palette colour;
// d units (overlaps) = that transmittance to the power 1 + 0.6 (d - 1): darker and deeper, never black-out.
export function compose(paper, ink, out) {
  const d = out.data, N = W * H, keys = Object.keys(INK);
  const A = keys.map(k => ink.L[k].getContext('2d').getImageData(0, 0, W, H).data);
  const C = keys.map(k => INK[k].rgb.map(v => v / 255)), AL = keys.map(k => INK[k].a);
  const { rgb, tooth } = paper, inv = 1 / (255 * U);
  for (let i = 0; i < N; i++) {
    let r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    for (let k = 0; k < A.length; k++) {
      const D = A[k][i * 4 + 3] * inv; if (!D) continue;
      const a = AL[k] * (.965 + .035 * tooth[i]), c = C[k];
      if (D <= 1) { r *= 1 - D * a * (1 - c[0]); g *= 1 - D * a * (1 - c[1]); b *= 1 - D * a * (1 - c[2]); }
      else { const e = 1 + .6 * (D - 1); r *= Math.pow(1 - a * (1 - c[0]), e); g *= Math.pow(1 - a * (1 - c[1]), e); b *= Math.pow(1 - a * (1 - c[2]), e); }
    }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  return out;
}

// the same, over a paper that has been drawn through the camera (Uint8ClampedArray RGBA); the paper's tooth is
// replaced by its mean (0.9825), invisible at this scale and stable while the camera moves
export function composeOn(pd, ink, out) {
  const d = out.data, N = W * H, keys = Object.keys(INK);
  const A = keys.map(k => ink.L[k].getContext('2d').getImageData(0, 0, W, H).data);
  const C = keys.map(k => INK[k].rgb.map(v => v / 255)), AL = keys.map(k => INK[k].a * .9825);
  const T1 = C.map((c, k) => c.map(v => 1 - AL[k] * (1 - v))), inv = 1 / (255 * U);
  for (let i = 0; i < N; i++) {
    const j = i * 4; let r = pd[j], g = pd[j + 1], b = pd[j + 2];
    for (let k = 0; k < A.length; k++) {
      const D = A[k][j + 3] * inv; if (!D) continue;
      const c = C[k], a = AL[k], t = T1[k];
      if (D <= 1) { r *= 1 - D * a * (1 - c[0]); g *= 1 - D * a * (1 - c[1]); b *= 1 - D * a * (1 - c[2]); }
      else { const e = 1 + .6 * (D - 1); r *= Math.pow(t[0], e); g *= Math.pow(t[1], e); b *= Math.pow(t[2], e); }
    }
    d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
  }
  return out;
}
// a paper as a canvas (for drawing it through the camera)
export function paperCanvas(paper) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data, { rgb } = paper;
  for (let i = 0; i < W * H; i++) { d[i * 4] = rgb[i * 3]; d[i * 4 + 1] = rgb[i * 3 + 1]; d[i * 4 + 2] = rgb[i * 3 + 2]; d[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
