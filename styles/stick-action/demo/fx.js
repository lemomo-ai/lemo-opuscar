// Effects: flat shapes in ink, paper or one accent. Smears, sparks, speed lines, dust, shockwave, ground cracks, energy aura, paper.
import { INK, PAPER, mixCol, drawFigure } from './stick.js';

export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
export { rgba };

// the sheet: off-white, faint static grain (screen space), soft vignette — painted once
export function paperCanvas(W, H, col = PAPER, seed = 3) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data, R = rng(seed);
  for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
  for (let k = 0; k < 260; k++) { g.strokeStyle = rgba('#8a7a60', .05 + R() * .04); g.lineWidth = 1; const x = R() * W, y = R() * H, a = R() * 6.28, l = 8 + R() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }   // fibres
  const v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(60,40,20,0)'); v.addColorStop(1, 'rgba(60,40,20,.16)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// the ground line (world), with optional cracks: [{x, k (0..1 open), seed}]
export function ground(g, x0, x1, w, cracks = [], ink = INK, paper = PAPER) {
  g.save(); g.strokeStyle = ink; g.lineWidth = w; g.lineCap = 'round';
  const gaps = cracks.filter(c => c.k > 0).map(c => [c.x - c.k * 40, c.x + c.k * 40]).sort((a, b) => a[0] - b[0]);
  let x = x0; g.beginPath();
  for (const [a, b] of gaps) { if (a > x) { g.moveTo(x, 0); g.lineTo(a, 0); } x = Math.max(x, b); }
  g.moveTo(x, 0); g.lineTo(x1, 0); g.stroke();
  for (const c of cracks) if (c.k > 0) crack(g, c, w, ink);
  g.restore();
}
function crack(g, c, w, ink) {
  const R = rng(c.seed || 7), k = c.k;
  g.save(); g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'miter';
  // the two broken ends tilt, jagged branches run down into the paper and up in splinters
  for (const side of [-1, 1]) {
    const ex = c.x + side * k * 40;
    g.lineWidth = w; g.beginPath(); g.moveTo(ex + side * 60, 0); g.lineTo(ex, -k * 14 * (R() + .5)); g.stroke();
  }
  g.lineWidth = w * .55;
  for (let b = 0; b < 5; b++) {
    let x = c.x + (R() - .5) * 50 * k, y = 0; g.beginPath(); g.moveTo(x, y);
    const n = 4 + Math.floor(R() * 4), dir = R() < .5 ? -1 : 1;
    for (let i = 0; i < n; i++) { x += dir * (8 + R() * 30) * k; y += (18 + R() * 30) * k * (b < 4 ? 1 : -1); g.lineTo(x, y); }
    g.stroke();
  }
  g.restore();
}

// smear: the limbs of earlier sub-frame poses, fading from accent to nothing
export function smear(g, Js, parts, col, w) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  Js.forEach((J, i) => {
    const a = (1 - i / Js.length) * .55;
    for (const p of parts) { const pts = J[p]; g.strokeStyle = rgba(col, a); g.lineWidth = w * (1 - i / Js.length * .5); g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); g.stroke(); }
  });
  g.restore();
}

// sparks bursting from a hit point: age in seconds
export function sparks(g, x, y, age, col, seed = 1, n = 14, size = 1) {
  if (age < 0 || age > .45) return;
  const R = rng(seed), k = age / .45;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283, sp = (220 + R() * 520) * size, r0 = sp * age * .6, r1 = r0 + (60 + R() * 90) * size * (1 - k);
    g.strokeStyle = i % 3 === 0 ? INK : col; g.lineWidth = (3 + R() * 5) * size * (1 - k);
    g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.stroke();
  }
  // a star flash at the point in the first frames
  if (age < .12) { const s = (1 - age / .12) * 90 * size; g.fillStyle = col; star(g, x, y, s, s * .22, 8, R() * 6); g.fillStyle = PAPER; star(g, x, y, s * .5, s * .1, 8, R() * 6); }
  g.restore();
}
export function star(g, x, y, r1, r0, n, rot = 0) {
  g.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r0 : r1, a = rot + i * Math.PI / n; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill();
}

// radial speed lines in screen space (impact frames, rushes)
export function speedRadial(g, W, H, cx, cy, col, seed, o = {}) {
  const R = rng(seed), n = o.n || 110;
  g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = R() * 6.283, wd = (.003 + R() * .014), r0 = (o.r0 || 220) + R() * 300, r1 = 2600;
    g.globalAlpha = (o.a || 1) * (.5 + R() * .5);
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a - wd) * r1, cy + Math.sin(a - wd) * r1); g.lineTo(cx + Math.cos(a + wd) * r1, cy + Math.sin(a + wd) * r1); g.fill();
  }
  g.restore();
}
// horizontal speed lines (dashes, tracking)
export function speedH(g, W, H, col, seed, o = {}) {
  const R = rng(seed);
  g.save(); g.fillStyle = col;
  for (let i = 0; i < (o.n || 40); i++) { const y = R() * H, L = 200 + R() * 900, x = R() * (W + L) - L; g.globalAlpha = (o.a || .5) * (.4 + R() * .6); g.fillRect(x, y, L, 1 + R() * (o.hmax || 4)); }
  g.restore();
}

// dust puffs: paper discs with ink rims that pop and shrink; dir pushes them sideways
export function dust(g, x, age, seed = 1, o = {}) {
  if (age < 0 || age > .9) return;
  const R = rng(seed), k = age / .9, n = o.n || 6, dir = o.dir || 0, s = o.size || 1;
  g.save(); g.lineWidth = 3 * s; g.strokeStyle = mixCol(INK, PAPER, .35); g.fillStyle = PAPER;
  for (let i = 0; i < n; i++) {
    const side = dir || (i % 2 ? 1 : -1), dx = side * (30 + R() * 110) * s * Math.pow(k, .5), dy = -(10 + R() * 40) * s * Math.pow(k, .6);
    const r = (14 + R() * 20) * s * (k < .25 ? k / .25 : 1 - (k - .25) / .75);
    if (r <= 0) continue;
    g.beginPath(); g.arc(x + dx + (R() - .5) * 20, dy, r, 0, 7); g.fill(); g.stroke();
  }
  g.restore();
}

// shockwave: an accent ring and a thinner ink ring expanding
export function shockwave(g, x, y, age, col, o = {}) {
  if (age < 0 || age > .7) return;
  const k = age / .7, r = (o.r || 520) * Math.pow(k, .5);
  g.save(); g.lineWidth = (o.w || 26) * (1 - k); g.strokeStyle = col; g.beginPath(); g.ellipse(x, y, r, r * (o.flat || 1), 0, 0, 7); g.stroke();
  g.lineWidth = (o.w || 26) * .3 * (1 - k); g.strokeStyle = INK; g.beginPath(); g.ellipse(x, y, r * .82, r * .82 * (o.flat || 1), 0, 0, 7); g.stroke();
  g.restore();
}

// energy aura: the figure's own strokes, thick and glowing in its accent, with flame tongues rising (on ones)
export function aura(g, J, col, t, amt = 1, seed = 5) {
  if (amt <= 0) return;
  g.save();
  g.shadowColor = col; g.shadowBlur = 40 * amt;
  drawFigure(g, J, { ink: col, wk: 1 + 2.2 * amt, alpha: .35 * amt, farMix: 0 });
  g.shadowBlur = 0;
  const R = rng(seed + Math.floor(t * 24) * 13);
  g.fillStyle = col; g.globalAlpha = .55 * amt;
  const pts = [J.head, J.neck, J.hip, J.aN[2], J.aF[2], J.lN[1], J.lF[1]];
  for (let i = 0; i < 16; i++) {
    const p = pts[i % pts.length], x = p[0] + (R() - .5) * 60, y = p[1] + (R() - .5) * 40, h = (60 + R() * 120) * amt, wd = 10 + R() * 14;
    g.beginPath(); g.moveTo(x - wd, y); g.quadraticCurveTo(x - wd * .3, y - h * .5, x + (R() - .5) * 20, y - h); g.quadraticCurveTo(x + wd * .3, y - h * .5, x + wd, y); g.fill();
  }
  g.restore();
}
