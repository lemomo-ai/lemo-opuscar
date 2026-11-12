'use strict';
// 借来的光 Borrowed Light. Shared drawing kit: math, pigments, gold leaf laid in squares (texture + vector
// seams + per-square tone) and its glint mask, flat-paint helpers (ink outline, inner rim shade, white-lead strokes and dots).
// Everything is Canvas 2D and procedural; render(t) depends only on t.

const W = 1920, H = 1080;
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d', { willReadFrequently: true });

// ---------------------------------------------------------------- math
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), ei = t => Math.pow(clamp(t), 3);
const eo2 = t => 1 - Math.pow(1 - clamp(t), 2);
const popS = (x, k = 1) => x <= 0 ? 0 : 1 - Math.exp(-x * 10 / k) * Math.cos(x * 15 / k); // springy 0→1
const TAU = Math.PI * 2;
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, o = 5) { let s = 0, a = .5; for (let i = 0; i < o; i++) { s += a * vn(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 3.7; a *= .5; } return s; }
function vnT(x, y, p) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), m = k => ((k % p) + p) % p;
  const a = h2(m(xi), m(yi)), b = h2(m(xi + 1), m(yi)), c = h2(m(xi), m(yi + 1)), d = h2(m(xi + 1), m(yi + 1)); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbmT(x, y, p, o = 4) { let s = 0, a = .5; for (let i = 0; i < o; i++) { s += a * vnT(x, y, p); x *= 2; y *= 2; p *= 2; a *= .5; } return s; }
const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };
function monotone(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]); if (n === 1) return () => ys[0];
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return t => { if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1]; let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
function track(keys) { const dim = keys[0][1].length, fs = []; for (let j = 0; j < dim; j++) fs.push(monotone(keys.map(k => [k[0], k[1][j]]))); return t => fs.map(f => f(t)); }

// ---------------------------------------------------------------- pigments (no large ochre: anything yellow on screen is real leaf)
const LAPIS = '#1f3f9a', LAPIS_D = '#132a6e', LAPIS_L = '#4f74c8', ULTRA = '#22379a', ULTRA_D = '#141f66', ULTRA_V = '#2a2a8c',
  VERM = '#c8321f', VERM_D = '#8e1e12', VERM_L = '#e8603e',
  VERD = '#2f6b3a', VERD_D = '#1d4626', VERD_L = '#5f9a52', VERDI = '#3f8f7a', VERDI_D = '#25604f',
  INK = '#2a1a10', GALL = '#3b2416', ROSE = '#d97a8a', ROSE_D = '#a34a5c',
  WHITE = '#fbf6ea', BOLE = '#a8452c', OCHRE = '#d39a45', OCHRE_D = '#9a6424', OCHRE_L = '#e8bd72',
  AZUR = '#3d7fa6', AZUR_D = '#285a7c', AZUR_L = '#6aa3c2', ASH = '#8d929c', ASH_D = '#666a74',
  LILAC = '#a596c4', LILAC_D = '#6c5d92', LILAC_L = '#d6cdea',
  WOOD = '#6e4424', WOOD_D = '#4a2c15', VELL = '#efe2c4';
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixHex = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = [16, 8, 0].map(s => Math.round(lerp((A >> s) & 255, (B >> s) & 255, t))); return `rgb(${c[0]},${c[1]},${c[2]})`; };

// ---------------------------------------------------------------- line weight follows the camera (never a hairline in wide shots)
// screen width of a 2.4-unit ink line ≈ 4.0 · z^0.38 px  →  2.8 px at the whole picture, 4.3 px at z 1.2, 6.2 px at z 3.2
let LWK = 1, LWH = 1, ZOOM = 1;
function setZoom(z) { ZOOM = z; LWK = 1.667 * Math.pow(z, -.62); LWH = Math.pow(LWK, .7); }
function ink(g, path, w = 2.4, col = INK) { g.strokeStyle = col; g.lineWidth = w * LWK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path); }

// ---------------------------------------------------------------- textures
let GOLDC, GOLDF, GOLDFF, SPKC, GRAINC;
function makeGold() {   // gold leaf body: mottle and burnish streaks; 1 texel = 2 world units, period 1200 (seams are vector, see leafSeams)
  const w = 600, h = 600, c = cnv(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = fbmT(x / 600 * 24, y / 600 * 24, 24), m = vnT(x / 600 * 240, y / 600 * 240, 240), st = vnT(x / 600 * 8, y / 600 * 60, 8);
    const v = .7 + .36 * (n - .5) + .1 * (m - .5) + .08 * (st - .5);
    const i = (y * w + x) * 4; d[i] = clamp(214 * v + 40, 0, 255); d[i + 1] = clamp(164 * v + 20, 0, 255); d[i + 2] = clamp(62 * v + 4, 0, 255); d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
function makeGoldFine(s, seed, k) {   // fine overlay for close-ups: crinkles of the beaten leaf, pinholes, burnish scratches (transparent elsewhere)
  const c = cnv(s, s), g = c.getContext('2d'), im = g.createImageData(s, s), d = im.data, R = mulberry(seed), P = s / 16;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = fbmT(x / P, y / P, 16, 4), m = fbmT(x / P * 2 + 3, y / P * .7, 32, 3);
    const crink = Math.abs(Math.sin(n * 26 * k)), cr2 = Math.abs(Math.sin(m * 19 * k));
    let a = 0, col = 0;
    if (crink < .05) { a = .38 * (1 - crink / .05); col = 0; } else if (cr2 < .035) { a = .26 * (1 - cr2 / .035); col = 1; }
    const r = R(); if (r < .0025) { a = .55; col = 0; } else if (r > .996) { a = .5; col = 1; }
    const i = (y * s + x) * 4;
    if (col) { d[i] = 255; d[i + 1] = 246; d[i + 2] = 205; } else { d[i] = 96; d[i + 1] = 56; d[i + 2] = 10; }
    d[i + 3] = 255 * a;
  }
  g.putImageData(im, 0, 0); return c;
}
function makeSpk() {    // tileable fine specks for gold and vellum
  const s = 256, c = cnv(s, s), g = c.getContext('2d'), im = g.createImageData(s, s), d = im.data, R = mulberry(91);
  for (let i = 0; i < s * s; i++) { const r = R(); const v = r < .04 ? 255 : r > .96 ? 0 : 128; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = v === 128 ? 0 : 70; }
  g.putImageData(im, 0, 0); return c;
}
function makeGrain() {  // tileable pigment granules: ground ultramarine is a coarse powder, it reads as grain, never as gloss
  const s = 512, c = cnv(s, s), g = c.getContext('2d'), im = g.createImageData(s, s), d = im.data, R = mulberry(5);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = vnT(x / 8, y / 8, 64), m = vnT(x / 2.2, y / 2.2, 232.7 | 0), r = R();
    let v = 128 + 70 * (n - .5) + 40 * (m - .5) + (r < .05 ? 70 : r > .95 ? -70 : 0);
    const i = (y * s + x) * 4; d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255); d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}

// ---------------------------------------------------------------- the leaf grid: squares of 100 units laid in rows, each row shifted
// The same grid drives the vector seams, the per-square tone and (in film.js) the per-square response to light.
const LS = 100;
const rowOff = j => h2(j, 77) * LS;
const leafTilt = (i, j) => h2(i * 7 + 3, j * 13 + 5) * TAU;        // the square's tilt: which way it throws the light
const leafTone = (i, j) => h2(i * 11 + 1, j * 5 + 9);               // laid a little brighter or darker

// ---------------------------------------------------------------- gold leaf and the glint mask
let MK = null;   // {g, pre, col}: where gold silhouettes are also written (light reaches only these). col '#fff' world leaf, '#f00' screen leaf
let DIM = 0;     // 0 = gold at rest, 1 = night (dark gold)
let GP = [];     // gold points this frame: {x, y, r, k} in world units (for star flashes)
function goldPat(g) { if (!g.__gp) { g.__gp = g.createPattern(GOLDC, 'repeat'); g.__gp.setTransform(new DOMMatrix().scale(2)); g.__sp = g.createPattern(SPKC, 'repeat');
  g.__gf = g.createPattern(GOLDF, 'repeat'); g.__gf.setTransform(new DOMMatrix().scale(.25)); g.__gff = g.createPattern(GOLDFF, 'repeat'); g.__gff.setTransform(new DOMMatrix().scale(.05)); } return g.__gp; }
function maskPath(g, path, rule) { if (!MK) return; MK.g.setTransform(MK.pre.multiply(g.getTransform())); MK.g.fillStyle = MK.col || '#fff'; MK.g.fill(path, rule || 'nonzero'); }
function maskStroke(g, path, lw) { if (!MK) return; MK.g.setTransform(MK.pre.multiply(g.getTransform())); MK.g.strokeStyle = MK.col || '#fff'; MK.g.lineWidth = lw; MK.g.lineCap = 'round'; MK.g.lineJoin = 'round'; MK.g.stroke(path); }
function maskErase(g, path) { if (!MK) return; MK.g.save(); MK.g.setTransform(MK.pre.multiply(g.getTransform())); MK.g.globalCompositeOperation = 'destination-out'; MK.g.fillStyle = '#000'; MK.g.fill(path); MK.g.restore(); }
function gpush(x, y, r, k = 1) { GP.push({ x, y, r, k }); }

// squares, seams and bole inside box (current user space = leaf space)
function leafSquares(g, box, d, scale = 1) {
  const S = LS * scale, x0 = box[0] - 2, y0 = box[1] - 2, x1 = box[0] + box[2] + 2, y1 = box[1] + box[3] + 2;
  const j0 = Math.floor(y0 / S), j1 = Math.floor(y1 / S), px = g.getTransform().a ? 1 / Math.hypot(g.getTransform().a, g.getTransform().b) : 1;
  const amp = .045 + .05 * d;
  for (let j = j0; j <= j1; j++) {
    const oy = j * S, ox = rowOff(j) * scale, i0 = Math.floor((x0 + ox) / S), i1 = Math.floor((x1 + ox) / S);
    for (let i = i0; i <= i1; i++) {
      const sx = i * S - ox, tone = leafTone(i, j) - .5;
      g.fillStyle = tone > 0 ? `rgba(255,236,170,${(tone * 2 * amp).toFixed(3)})` : `rgba(70,38,4,${(-tone * 2.4 * amp).toFixed(3)})`;
      g.fillRect(sx, oy, S, S);
      // a soft burnish within the square, along its tilt
      const th = leafTilt(i, j), cxs = sx + S / 2, cys = oy + S / 2, gr = g.createLinearGradient(cxs - Math.cos(th) * S * .6, cys - Math.sin(th) * S * .6, cxs + Math.cos(th) * S * .6, cys + Math.sin(th) * S * .6);
      gr.addColorStop(0, 'rgba(255,244,200,0)'); gr.addColorStop(.55, `rgba(255,244,200,${(.07 * (1 - .6 * d)).toFixed(3)})`); gr.addColorStop(1, 'rgba(80,44,4,.06)');
      g.fillStyle = gr; g.fillRect(sx, oy, S, S);
      // bole showing where the leaf broke at a corner (one square in four)
      if (h2(i * 3 + 7, j * 17 + 2) < .15) { const R = mulberry(i * 131 + j * 977), bx = sx + (R() < .5 ? 0 : S), by = oy + (R() < .5 ? 0 : S); void 0;
        g.fillStyle = `rgba(122,44,24,${(.42 + .2 * d).toFixed(2)})`; g.beginPath();
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = S * (.035 + R() * .05); k ? g.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r) : g.moveTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); } g.fill(); }
    }
  }
  // seams: a dark line, and beside it the brighter ridge of the overlapping leaf
  const sw = Math.max(Math.min(.7 * scale, 6 * px), 1.1 * px), so = Math.max(Math.min(1.2 * scale, 9 * px), 1.6 * px);
  g.lineCap = 'butt';
  for (const pass of [0, 1]) {
    g.strokeStyle = pass ? `rgba(255,240,190,${(.4 * (1 - .55 * d)).toFixed(2)})` : `rgba(88,48,6,${(.62).toFixed(2)})`; g.lineWidth = pass ? sw * .8 : sw;
    g.beginPath();
    for (let j = j0; j <= j1 + 1; j++) { const y = j * S + (pass ? so : 0); g.moveTo(x0, y); g.lineTo(x1, y); }
    for (let j = j0; j <= j1; j++) { const oy = j * S, ox = rowOff(j) * scale, i0 = Math.floor((x0 + ox) / S), i1 = Math.floor((x1 + ox) / S);
      for (let i = i0; i <= i1 + 1; i++) { const x = i * S - ox + (pass ? so : 0); g.moveTo(x, oy); g.lineTo(x, oy + S); } }
    g.stroke();
  }
}
// leaf(): fill a path with gold leaf. o.dim overrides DIM; o.rule; o.lw ink width; o.rimW inner rim; o.nomask; o.scale leaf-grid scale
function leaf(g, path, box, o = {}) {
  const d = o.dim ?? DIM;
  g.save(); g.clip(path, o.rule || 'nonzero');
  g.fillStyle = goldPat(g); g.fillRect(box[0] - 2, box[1] - 2, box[2] + 4, box[3] + 4);
  leafSquares(g, box, d, o.scale || 1);
  const sc = Math.hypot(g.getTransform().a, g.getTransform().b);   // device px per unit: fine crinkles only when they can be seen
  const fa = ss((Math.log(sc) - Math.log(1.6)) / (Math.log(5) - Math.log(1.6))), ffa = ss((Math.log(sc) - Math.log(7)) / (Math.log(16) - Math.log(7)));
  if (fa > 0) { g.globalAlpha = fa; g.fillStyle = g.__gf; g.fillRect(box[0], box[1], box[2], box[3]); g.globalAlpha = 1; }
  if (ffa > 0) { g.globalAlpha = ffa; g.fillStyle = g.__gff; g.fillRect(box[0], box[1], box[2], box[3]); g.globalAlpha = 1; }
  const gr = g.createLinearGradient(box[0], box[1], box[0] + box[2], box[1] + box[3]), k = 1 - .75 * d;
  gr.addColorStop(0, 'rgba(255,240,170,0)'); gr.addColorStop(.32, `rgba(255,246,190,${.3 * k})`); gr.addColorStop(.5, `rgba(255,255,230,${.06 * k})`);
  gr.addColorStop(.66, 'rgba(90,50,0,.2)'); gr.addColorStop(.84, `rgba(255,236,160,${.22 * k})`); gr.addColorStop(1, 'rgba(90,50,0,.2)');
  g.fillStyle = gr; g.fillRect(box[0], box[1], box[2], box[3]);
  if (d > 0) { g.fillStyle = `rgba(46,28,10,${.34 * d})`; g.fillRect(box[0] - 2, box[1] - 2, box[2] + 4, box[3] + 4);
    g.fillStyle = `rgba(30,44,90,${.09 * d})`; g.fillRect(box[0] - 2, box[1] - 2, box[2] + 4, box[3] + 4); }   // dark leaf mirrors the blue night
  g.globalAlpha = .45; g.fillStyle = g.__sp; g.fillRect(box[0], box[1], box[2], box[3]); g.globalAlpha = 1;
  if (o.rim !== false) { g.strokeStyle = 'rgba(110,60,5,.5)'; g.lineWidth = o.rimW || 5; g.stroke(path); }
  g.restore();
  if (o.line !== false) ink(g, path, o.lw || 2.2, o.stroke || INK);
  if (!o.nomask) maskPath(g, path, o.rule);
}
function gold(g, path, box, o = {}) { leaf(g, path, box, o); }
function leafCord(g, path, w, o = {}) {      // a gold cord / fillet, dimmable
  goldPat(g); g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (o.ink !== 0) { g.strokeStyle = INK; g.lineWidth = w + (o.ink ?? 3) * LWK; g.stroke(path); }
  g.strokeStyle = g.__gp; g.lineWidth = w; g.stroke(path);
  g.strokeStyle = `rgba(60,32,6,${.22 + .45 * DIM})`; g.lineWidth = w; g.stroke(path);
  g.strokeStyle = `rgba(255,248,210,${.5 * (1 - .7 * DIM)})`; g.lineWidth = Math.max(.6, w * .22); g.setTransform(g.getTransform().translate(-w * .15, -w * .18)); g.stroke(path);
  g.restore();
  if (!o.nomask) maskStroke(g, path, w);
}
const goldStroke = (g, path, w, o = {}) => leafCord(g, path, w, o);
function P2(fn) { const p = new Path2D(); fn(p); return p; }
function shape(g, path, fill, outline = INK, lw = 1.8) { if (fill) { g.fillStyle = fill; g.fill(path); } if (outline) ink(g, path, lw, outline); }
function rimShade(g, path, col, w) { g.save(); g.clip(path); g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(path); g.restore(); }
function hiLine(g, pts, w = 1.6, a = .8) { g.strokeStyle = `rgba(255,252,238,${a})`; g.lineWidth = w * LWH; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
// white lead laid as dots: a triad (three dots in a little triangle), a ring of pearls, a row of pearls along a line
function triad(g, x, y, r, a = .92, rot = 0) { g.fillStyle = `rgba(255,252,240,${a})`; const rr = r * LWH; for (let k = 0; k < 3; k++) { const an = rot + k * TAU / 3 - Math.PI / 2; g.beginPath(); g.arc(x + Math.cos(an) * rr * 1.5, y + Math.sin(an) * rr * 1.5, rr, 0, TAU); g.fill(); } }
function pearls(g, cx, cy, R, n, r, a = .92, a0 = 0, a1 = TAU) { g.fillStyle = `rgba(255,252,240,${a})`; const rr = r * Math.sqrt(LWH); for (let i = 0; i < n; i++) { const an = a0 + (a1 - a0) * (i + .5) / n; g.beginPath(); g.arc(cx + Math.cos(an) * R, cy + Math.sin(an) * R, rr, 0, TAU); g.fill(); } }
function pearlLine(g, pts, gap, r, a = .92) { const L = arclen(pts), n = Math.floor(L[L.length - 1] / gap); g.fillStyle = `rgba(255,252,240,${a})`; const rr = r * Math.sqrt(LWH);
  for (let k = 0; k <= n; k++) { const q = alongPath(pts, L, k * gap + (L[L.length - 1] - n * gap) / 2); g.beginPath(); g.arc(q.x, q.y, rr, 0, TAU); g.fill(); } }
function star8(q, x, y, r, ri = .42, rot = 0, n = 8) { for (let k = 0; k < n * 2; k++) { const a = rot + k * Math.PI / n - Math.PI / 2, rr = k % 2 ? r * ri : r; k ? q.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : q.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } q.closePath(); }

// ---------------------------------------------------------------- path helpers
function tubePath(pts, ws, capStart = true, capEnd = true) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = ws[i] / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const p = new Path2D(); p.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
  p.lineTo(L[n - 1][0], L[n - 1][1]);
  if (capEnd) { const e = pts[n - 1], a0 = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]); p.arc(e[0], e[1], ws[n - 1] / 2, a0, a0 - Math.PI, true); } else p.lineTo(R[n - 1][0], R[n - 1][1]);
  for (let i = n - 2; i > 0; i--) p.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2);
  p.lineTo(R[0][0], R[0][1]);
  if (capStart) { const s = pts[0], a0 = Math.atan2(R[0][1] - s[1], R[0][0] - s[0]); p.arc(s[0], s[1], ws[0] / 2, a0, a0 - Math.PI, true); }
  p.closePath(); return p;
}
function catmull(pts, k = 6) {
  const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < k; j++) { const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => .5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3))); } }
  out.push(pts[pts.length - 1].slice()); return out;
}
function polyPath(pts, close = false) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (close) p.closePath(); return p; }
function arclen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
function alongPath(pts, L, s) { // point and tangent at arclength s
  s = clamp(s, 0, L[L.length - 1]); let i = 1; while (i < L.length - 1 && L[i] < s) i++;
  const u = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]), a = pts[i - 1], b = pts[i];
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), a: Math.atan2(b[1] - a[1], b[0] - a[0]), i };
}

// ---------------------------------------------------------------- stepped, leaning spires (medieval rock)
function spirePts(bx, by, w, h, lean, R) {
  const L = [], Rt = [], n = 4 + (R() * 3 | 0), topW = w * (.12 + R() * .1), tx = bx + lean * h;
  for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(bx - w / 2, tx - topW / 2, u) + (i && i < n ? (R() - .5) * w * .06 : 0), y = by - h * u;
    if (i > 0 && i < n) { const run = w * (.05 + R() * .05); L.push([x - run, y + h / n * (.15 + R() * .2)]); L.push([x - run, y]); L.push([x + run * .3, y]); } else L.push([x, y]); }
  for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(bx + w / 2, tx + topW / 2, u) + (i && i < n ? (R() - .5) * w * .06 : 0), y = by - h * u;
    if (i > 0 && i < n) { const run = w * (.05 + R() * .05); Rt.push([x + run, y + h / n * (.15 + R() * .2)]); Rt.push([x + run, y]); Rt.push([x - run * .3, y]); } else Rt.push([x, y]); }
  const top = [[tx - topW / 2, by - h], [tx - topW * .1, by - h - h * .03], [tx + topW * .2, by - h + h * .01], [tx + topW / 2, by - h]];
  return L.concat(top.slice(1, 3), Rt.reverse());
}

// ---------------------------------------------------------------- camera
function camMatrix(c) { return new DOMMatrix().translate(W / 2, H / 2).rotate(c.r * 180 / Math.PI).scale(c.z).translate(-c.x, -c.y); }
function viewRect(c) { const hw = W / 2 / c.z, hh = H / 2 / c.z, e = Math.abs(Math.sin(c.r)) * (hw + hh); return [c.x - hw - e, c.y - hh - e, c.x + hw + e, c.y + hh + e]; }
function screenBox(M, x0, y0, x1, y1) {   // world rect → screen bbox
  const ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(M));
  return [Math.min(...ps.map(p => p.x)), Math.min(...ps.map(p => p.y)), Math.max(...ps.map(p => p.x)), Math.max(...ps.map(p => p.y))];
}

// ---------------------------------------------------------------- text registry for readcheck (window.TEXTS)
let TX = [];
function reg(id, text, g, x0, y0, x1, y1) { const M = g.getTransform(), b = screenBox(M, x0, y0, x1, y1); TX.push({ id, text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] }); }
