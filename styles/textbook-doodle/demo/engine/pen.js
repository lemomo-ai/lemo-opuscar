// Textbook Doodle · ink engine — a student's marks on printed paper. World units = px at zoom 1.
//   Stroke     : one pen movement (flat [x,y,…]) with a tool: ball (blue ballpoint), red (gel pen), pencil, hl (highlighter), black
//   shapes     : line / poly / curve / circle / rect / arrow / check / cross / star / heart / bubble / scribble / zigzag / underline
//   Mark       : strokes drawn in order over [t0, t0+dur], optionally removed at `off` by eraser / tape / scribble / page
//   drawMarks  : render every mark at time t. Doodles boil on twos (12 fps); the printed page never does.
import { clamp, lerp, vnoise, hash, mulberry } from '/core/lib.js';
const TAU = Math.PI * 2;

export const INK = { ball: '#1f3a9e', red: '#d3262b', pencil: '#5b5d63', black: '#1b1c22', hl: '#ffe02e', hl2: '#ff6fae', tape: '#fbfbf7' };
export const TOOL = {
  ball:   { w: 3.2, alpha: .92, color: INK.ball, jit: 1.0, boil: .7, blend: 'multiply' },
  red:    { w: 3.6, alpha: .95, color: INK.red, jit: .9, boil: .7, blend: 'multiply' },
  black:  { w: 3.4, alpha: .92, color: INK.black, jit: 1.0, boil: .7, blend: 'multiply' },
  pencil: { w: 2.6, alpha: .55, color: INK.pencil, jit: 1.2, boil: .9, blend: 'multiply', grain: true },
  hl:     { w: 30, alpha: .55, color: INK.hl, jit: .5, boil: .3, blend: 'multiply', flat: true },
  white:  { w: 4.4, alpha: .96, color: '#f4f2ea', jit: .9, boil: .6, blend: 'source-over' },   // correction pen: writing on a dark cover
  redTop: { w: 4.2, alpha: .95, color: '#ff3b3b', jit: .9, boil: .7, blend: 'source-over' },  // red pen on a dark surface (a phone screen)
  hl2:    { w: 30, alpha: .5, color: INK.hl2, jit: .5, boil: .3, blend: 'multiply', flat: true },
};

// —— geometry ——
function resample(p, step) {
  const o = [p[0], p[1]]; let carry = 0;
  for (let i = 2; i < p.length; i += 2) {
    const ax = p[i - 2], ay = p[i - 1], bx = p[i], by = p[i + 1], d = Math.hypot(bx - ax, by - ay);
    let s = step - carry;
    while (s <= d) { o.push(ax + (bx - ax) * s / d, ay + (by - ay) * s / d); s += step; }
    carry = d - (s - step);
  }
  const n = p.length; if (Math.hypot(o[o.length - 2] - p[n - 2], o[o.length - 1] - p[n - 1]) > step * .3) o.push(p[n - 2], p[n - 1]);
  return o;
}
function chaikin(p, it) {
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

let SEED = 1;
export const reseed = s => { SEED = s; };

export class Stroke {
  // o: {tool, w, seed, jit, smooth, over}
  constructor(pts, o = {}) {
    const T = TOOL[o.tool || 'ball']; this.tool = o.tool || 'ball'; this.T = T;
    this.w = o.w ?? T.w; this.seed = o.seed ?? SEED++; this.alpha = o.alpha ?? T.alpha; this.color = o.color || T.color;
    let p = o.smooth ? chaikin(pts, o.smooth) : pts.slice();
    if (o.over && p.length >= 4) {               // the stroke overshoots its end a little
      const n = p.length, tx = p[n - 2] - p[n - 4], ty = p[n - 1] - p[n - 3], l = Math.hypot(tx, ty) || 1;
      p.push(p[n - 2] + tx / l * o.over, p[n - 1] + ty / l * o.over);
    }
    this.base = Float32Array.from(resample(p, Math.max(2.5, Math.min(8, this.w * 1.2))));
    this.jit = (o.jit ?? T.jit); const n = this.base.length / 2;
    this.cum = new Float32Array(n);
    for (let i = 1; i < n; i++) this.cum[i] = this.cum[i - 1] + Math.hypot(this.base[2 * i] - this.base[2 * i - 2], this.base[2 * i + 1] - this.base[2 * i - 1]);
    this.len = this.cum[n - 1] || .001;
  }
  // hand tremor: low-frequency offset along the normal; the boil step b shifts the noise phase, so doodles boil gently at 12 fps
  pts(b) {
    const p = this.base, q = new Float32Array(p.length), n = p.length / 2;
    const A = 1.6 * this.jit, B = this.T.boil * this.jit, ph = this.seed * 7.31, pb = b * 3.7 + this.seed;
    for (let i = 0; i < n; i++) {
      const j = Math.min(i, n - 2), tx = p[2 * j + 2] - p[2 * j], ty = p[2 * j + 3] - p[2 * j + 1], l = Math.hypot(tx, ty) || 1, s = this.cum[i];
      const off = A * (vnoise(s / 160 + ph) - .5) * 2 + B * (vnoise(s / 40 + pb) - .5) * 2;
      q[2 * i] = p[2 * i] - ty / l * off; q[2 * i + 1] = p[2 * i + 1] + tx / l * off;
    }
    return q;
  }
}

// draw the first L units of a stroke: a variable-width ribbon (ballpoint pressure + an ink blob at the start); a highlighter is a flat-ended wide band
function ribbon(ctx, s, q, L, k) {
  const c = s.cum, n = c.length; if (L <= 0 || n < 1) return;
  let m = n; for (let i = 1; i < n; i++) if (c[i] > L) { m = i + 1; break; }
  m = Math.min(m, n);
  const X = new Float32Array(m), Y = new Float32Array(m), H = new Float32Array(m), flat = s.T.flat;
  for (let i = 0; i < m; i++) {
    X[i] = q[2 * i]; Y[i] = q[2 * i + 1];
    if (i === m - 1 && i > 0 && c[i] > L) { const u = (L - c[i - 1]) / ((c[i] - c[i - 1]) || 1); X[i] = lerp(q[2 * i - 2], q[2 * i], u); Y[i] = lerp(q[2 * i - 1], q[2 * i + 1], u); }
    const d = Math.min(c[i], L);
    H[i] = flat ? s.w * .5 * k : s.w * .5 * k * (.72 + .5 * vnoise(d / 55 + s.seed) ) * Math.min(1, .55 + d / 14) * (1 - .35 * clamp((d - (s.len - 10)) / 10, 0, 1));
  }
  if (m < 2 || s.len < 2) { ctx.moveTo(X[0] + H[0], Y[0]); ctx.arc(X[0], Y[0], Math.max(H[0], 1.4 * k), 0, TAU); return; }
  const nx = new Float32Array(m), ny = new Float32Array(m);
  for (let i = 0; i < m; i++) {
    const a = Math.max(0, i - 1), b = Math.min(m - 1, i + 1), tx = X[b] - X[a], ty = Y[b] - Y[a], l = Math.hypot(tx, ty) || 1;
    nx[i] = -ty / l; ny[i] = tx / l;
  }
  ctx.moveTo(X[0] + nx[0] * H[0], Y[0] + ny[0] * H[0]);
  for (let i = 1; i < m; i++) ctx.lineTo(X[i] + nx[i] * H[i], Y[i] + ny[i] * H[i]);
  if (flat) ctx.lineTo(X[m - 1] - nx[m - 1] * H[m - 1], Y[m - 1] - ny[m - 1] * H[m - 1]);
  else { const ae = Math.atan2(ny[m - 1], nx[m - 1]); ctx.arc(X[m - 1], Y[m - 1], H[m - 1], ae, ae - Math.PI, true); }
  for (let i = m - 2; i >= 0; i--) ctx.lineTo(X[i] - nx[i] * H[i], Y[i] - ny[i] * H[i]);
  if (!flat) { const as = Math.atan2(-ny[0], -nx[0]); ctx.arc(X[0], Y[0], H[0], as, as - Math.PI, true); }
  ctx.closePath();
}

export function drawStroke(ctx, s, L, b, k = 1) {
  const q = s.pts(b);
  ctx.globalCompositeOperation = s.T.blend; ctx.globalAlpha = s.alpha; ctx.fillStyle = s.color;
  ctx.beginPath(); ribbon(ctx, s, q, L ?? s.len, k); ctx.fill();
  if (!s.T.flat && (L ?? s.len) > 6) {             // a small ink blob where the pen lands
    ctx.globalAlpha = s.alpha * .8; ctx.beginPath(); ctx.arc(q[0], q[1], s.w * .62 * k, 0, TAU); ctx.fill();
  }
  if (s.T.flat && (L ?? s.len) > 4) {              // highlighter: a darker streak where it overlaps itself
    ctx.globalAlpha = s.alpha * .35; ctx.beginPath(); const s2 = Object.create(s); s2.w = s.w * .25; ribbon(ctx, s2, q, L ?? s.len, k); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

// —— shapes (all return Stroke[]) ——
const R = () => hash(SEED * 1.37 + 0.5) - .5;
export const line = (x0, y0, x1, y1, o = {}) => {
  const d = Math.hypot(x1 - x0, y1 - y0) || 1, bow = (o.bow ?? .02) * d * R() * 2, nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
  return [new Stroke([x0, y0, (x0 + x1) / 2 + nx * bow, (y0 + y1) / 2 + ny * bow, x1, y1], { smooth: 2, ...o })];
};
export const poly = (pts, o = {}) => [new Stroke(pts.flat(), o)];
export const curve = (pts, o = {}) => [new Stroke(pts.flat(), { smooth: 3, ...o })];
export function ellipse(cx, cy, rx, ry, o = {}) {   // a hand-drawn loop: not closed, it runs on a little past the start
  const a0 = o.a0 ?? -2.3, lap = o.lap ?? .35, n = Math.max(16, Math.ceil((rx + ry) * .25)), p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (TAU + lap) * i / n, wob = 1 + .04 * Math.sin(a * 2 + SEED); p.push(cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob); }
  return [new Stroke(p, o)];
}
export const circle = (cx, cy, r, o = {}) => ellipse(cx, cy, r, r * (o.squash ?? 1), o);
export function rect(x, y, w, h, o = {}) {
  const e = o.ext ?? 5;
  return [...line(x - e, y, x + w + e, y, o), ...line(x + w, y - e, x + w, y + h + e, o), ...line(x + w + e, y + h, x - e, y + h, o), ...line(x, y + h + e, x, y - e, o)];
}
export function arrow(x0, y0, x1, y1, o = {}) {
  const a = Math.atan2(y1 - y0, x1 - x0), h = o.head ?? 22, bend = o.bend ?? 0;
  const mx = (x0 + x1) / 2 - Math.sin(a) * bend, my = (y0 + y1) / 2 + Math.cos(a) * bend;
  return [new Stroke([x0, y0, mx, my, x1, y1], { smooth: 3, over: 3, ...o }),
    new Stroke([x1 + Math.cos(a + 2.6) * h, y1 + Math.sin(a + 2.6) * h, x1, y1, x1 + Math.cos(a - 2.6) * h, y1 + Math.sin(a - 2.6) * h], o)];
}
export const check = (x, y, s, o = {}) => [new Stroke([x - s * .5, y - s * .05, x - s * .15, y + s * .35, x + s * .55, y - s * .6], { tool: 'red', over: 4, ...o })];
export const cross = (x, y, s, o = {}) => [...line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { tool: 'red', ...o }), ...line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, { tool: 'red', ...o })];
export function star(x, y, r, o = {}) {
  const p = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; p.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  return [new Stroke(p, o)];
}
export function heart(x, y, s, o = {}) {
  const p = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * TAU; p.push(x + s * 16 * Math.sin(t) ** 3 / 16, y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16); }
  return [new Stroke(p, o)];
}
export function bubble(x, y, w, h, tx, ty, o = {}) {   // speech bubble + tail pointing at (tx, ty)
  return [...ellipse(x, y, w / 2, h / 2, { lap: .1, ...o }), new Stroke([x - w * .12, y + h * .42, tx, ty, x + w * .08, y + h * .47], o)];
}
export function scribble(x, y, w, h, o = {}) {   // scribble an area black: zigzag back and forth
  const rows = o.rows ?? Math.max(3, Math.round(h / ((o.gap ?? 9)))), p = [], rnd = mulberry(SEED++);
  for (let i = 0; i <= rows; i++) { const yy = y + h * i / rows + (rnd() - .5) * 3; p.push(i % 2 ? x + w + (rnd() - .5) * 8 : x + (rnd() - .5) * 8, yy); }
  return [new Stroke(p, { jit: .6, ...o })];
}
export function zigzag(x0, y0, x1, y1, amp, n, o = {}) {
  const p = []; for (let i = 0; i <= n; i++) { const u = i / n; p.push(lerp(x0, x1, u) + (i % 2 ? -1 : 1) * amp * Math.sin(Math.atan2(y1 - y0, x1 - x0)), lerp(y0, y1, u) + (i % 2 ? 1 : -1) * amp * Math.cos(Math.atan2(y1 - y0, x1 - x0))); }
  return [new Stroke(p, o)];
}
export const underline = (x0, x1, y, o = {}) => line(x0, y, x1, y + (o.tilt ?? 2), { bow: .01, over: 6, ...o });
export const hl = (x0, x1, y, o = {}) => [new Stroke([x0, y, (x0 + x1) / 2, y + (o.tilt ?? 1.5), x1, y], { tool: 'hl', smooth: 1, ...o })];   // one highlighter pass
export function wave(x0, x1, y, amp, n, o = {}) { const p = []; for (let i = 0; i <= n * 8; i++) { const u = i / (n * 8); p.push(lerp(x0, x1, u), y + Math.sin(u * n * TAU) * amp); } return [new Stroke(p, o)]; }

// —— a group of strokes = one mark, drawn over time, removed over time ——
// mark: {strokes, t0, dur, off?: {t, how: 'erase'|'tape'|'scribble'|'cut', dur}, page?, layer?}
export function mark(strokes, t0, dur, extra = {}) {
  const S = strokes.flat(); const tot = S.reduce((a, s) => a + s.len, 0);
  return { strokes: S, tot, t0, dur: Math.max(dur, 1 / 24), ...extra };
}
export const easeWrite = u => u < 0 ? 0 : u > 1 ? 1 : u - Math.sin(TAU * u) / TAU * .55;   // slow start, fast middle, slow finish

export function drawMark(ctx, m, t, b, k = 1) {
  if (t < m.t0) return;
  if (m.off && m.off.how !== 'tape' && m.off.how !== 'scribble' && t >= m.off.t + (m.off.dur ?? .2)) return;
  let L = m.tot * easeWrite((t - m.t0) / m.dur);
  for (const s of m.strokes) { if (L <= 0) break; drawStroke(ctx, s, Math.min(L, s.len), b, k); L -= s.len; }
}
