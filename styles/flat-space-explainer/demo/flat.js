// flat.js: palette and flat-drawing helpers shared by the style frames, the character sheet (sheet.js) and the film.
// Everything is solid fills: each object = one base colour + one shade step. No blur, no gradients, no transparency.
const C = {
  night:'#1D2052', n2:'#252A63', n3:'#30367C', mist:'#9298D4',
  blue:'#4D7CFE', blueD:'#3A5FD9',
  mint:'#3FD8AE', mintD:'#22B38C',
  coral:'#FF6B5E', coralD:'#E14B45',
  sun:'#FFC84A', sunD:'#F2A12F',
  cream:'#FFF4E2', creamD:'#F0DCC0',
};
const NS = 'http://www.w3.org/2000/svg';
const W = 1920, H = 1080;
let svg, defs, uid = 0;

const r1 = v => Math.round(v * 10) / 10;
function el(tag, a = {}, p) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
function g(p, a = {}) { return el('g', a, p); }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function clipOf(tag, a) { const id = 'c' + (uid++); const cp = el('clipPath', { id }, defs); el(tag, a, cp); return `url(#${id})`; }
// closed Catmull-Rom through points -> smooth path
function blobPath(pts) {
  const n = pts.length; let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])},${r1(c1[1])} ${r1(c2[0])},${r1(c2[1])} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d + 'Z';
}
function polar(cx, cy, n, rf) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const r = rf(a); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return pts; }
// two-tone shape: shade colour everywhere, base colour on the copy shifted toward the light (upper-left)
function shaded(p, tag, a, base, shade, dx, dy) {
  const G = g(p);
  el(tag, { ...a, fill: shade }, G);
  const inner = g(G, { 'clip-path': clipOf(tag, a) });
  el(tag, { ...a, fill: base }, g(inner, { transform: `translate(${-dx},${-dy})` }));
  return G;
}
// two-tone group: draw(fn) is called twice, once with the shade palette (whole shape) and once with the base palette (lit side)
function twoTone(p, tag, a, dx, dy, draw) {
  const G = g(p, { 'clip-path': clipOf(tag, a) });
  draw(g(G), true);
  const lit = g(G, { 'clip-path': clipOf(tag, { ...a, transform: `translate(${-dx},${-dy})` }) });
  draw(lit, false);
  return G;
}
function sparkle(p, x, y, r, fill) { const k = r * 0.2; el('path', { d: `M${x},${y - r}Q${x + k},${y - k} ${x + r},${y}Q${x + k},${y + k} ${x},${y + r}Q${x - k},${y + k} ${x - r},${y}Q${x - k},${y - k} ${x},${y - r}Z`, fill }, p); }
// glow, flat: two hard-edged rings one and two steps lighter than the night sky
function halo(p, x, y, r1_, r2_) { el('circle', { cx: x, cy: y, r: r2_, fill: C.n2 }, p); el('circle', { cx: x, cy: y, r: r1_, fill: C.n3 }, p); }
function text(p, x, y, html, a = {}) { const t = el('text', { x, y, ...a }, p); t.innerHTML = html; if (window.__TXT && !a['data-noread']) window.__TXT.push(t); return t; }
const sup = (s, size) => `<tspan dy="${-size * 0.42}" font-size="${size * 0.62}">${s}</tspan><tspan dy="${size * 0.42}"> </tspan>`;

const inBoxes = boxes => (x, y) => boxes.some(([bx, by, bw, bh]) => x > bx - 14 && x < bx + bw + 14 && y > by - 14 && y < by + bh + 14);
function stars(p, seed, n, avoid = () => false) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * H, k = R();
    if (avoid(x, y)) continue;
    const r = k < 0.7 ? 1.4 + R() * 1.4 : 2.6 + R() * 2;
    el('circle', { cx: r1(x), cy: r1(y), r: r1(r), fill: k < 0.55 ? C.mist : k < 0.85 ? C.cream : C.sun }, p);
  }
}
function grain(p, seed) {
  // very fine print grain, 3% — keeps big flat fields from looking dead
  const id = 'gr' + (uid++);
  const f = el('filter', { id, x: 0, y: 0, width: '100%', height: '100%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, seed, result: 'n' }, f);
  el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.45' }, f);
  el('rect', { x: 0, y: 0, width: W, height: H, filter: `url(#${id})`, opacity: 0.05 }, p);
}
