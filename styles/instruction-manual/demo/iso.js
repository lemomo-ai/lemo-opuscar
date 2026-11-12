// iso.js — 45° axonometric engine for the Instruction Manual Art style.
// World units are centimetres, y is up. The view is orthographic: azimuth 45° (we look at every object across its corner),
// elevation 35.264° (true isometric: the three axes meet at 120°, horizontal edges run at 30° on screen).
// Everything is drawn as flat fills with one ink line weight; occlusion is painter's order by view depth.

export const PAL = {
  paper: '#F4F1EA', ink: '#1E1D1B',
  // finished parts: white board, three flat shades (top, +z face, +x face)
  part: { top: '#FFFFFF', z: '#ECE8DF', x: '#DCD7CC' },
  // the newest part of every step is safety yellow
  neu: { top: '#F7D35A', z: '#F2C230', x: '#DEAA1F' },
  metal: { top: '#D9D7D1', z: '#BDBAB3', x: '#A3A099' },
  grey1: '#CFCBC2', grey2: '#9C988F', grey3: '#6B6862',
  red: '#D23A2E', blue: '#2C66AC', shadow: '#E7E2D7',
};
export let LW = 2.6;             // the one line weight (px on screen); the film scales it gently with the camera's zoom
export function setLW(x) { LW = x; }
// line-growth: while GROW < 1 the item being drawn shows only part of its outline and a fading fill
let GROW = 1;
export function setGrow(x) { GROW = x; }
export function getGrow() { return GROW; }
// line pass: every fill painted as this colour (paper), so a whole drawing reads as clean line art
let FILLOV = null;
export function setFillOverride(x) { FILLOV = x; }
export function getFillOverride() { return FILLOV; }
// ghost: outlines only, dotted, no fill (a part that has been taken away)
let GHOST = 0;
export function setGhost(x) { GHOST = x; }
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const D2R = Math.PI / 180;

export function makeView({ cx = 960, cy = 540, s = 3, az = 45, el = 35.264 } = {}) {
  const ca = Math.cos(az * D2R), sa = Math.sin(az * D2R), ce = Math.cos(el * D2R), se = Math.sin(el * D2R);
  const v = {
    cx, cy, s, ca, sa, ce, se,
    P: (p) => { const u = p[0] * ca - p[2] * sa, w = p[0] * sa + p[2] * ca; return [cx + s * u, cy + s * (-p[1] * ce + w * se)]; },
    depth: (p) => (p[0] * sa + p[2] * ca) * ce + p[1] * se,
    eye: [sa * ce, se, ca * ce],   // unit vector pointing from the scene toward the viewer
    items: [],
  };
  v.add = (depth, fn, layer = 0) => v.items.push({ depth, fn, layer, i: v.items.length });
  // v.grow (0..1, optional): items are drawn in painter's order, each one growing in a short window after the one before
  v.flush = (g) => {
    v.items.sort((a, b) => a.layer - b.layer || a.depth - b.depth || a.i - b.i);
    const n = v.items.length, gr = v.grow, W = v.growW ?? .3;
    v.items.forEach((it, k) => {
      if (gr == null || gr >= 1) { it.fn(g); return; }
      const p = clamp01((gr - (n > 1 ? k / (n - 1) : 0) * (1 - W)) / W);
      if (p <= 0) return;
      GROW = p; it.fn(g); GROW = 1;
    });
    v.items.length = 0;
  };
  return v;
}

// ---------- vector helpers ----------
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mid3 = (...ps) => mul3(ps.reduce(add3, [0, 0, 0]), 1 / ps.length);

// ---------- 2D helpers ----------
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop(); return lo.concat(up);
}
export function circlesHull(cs, n = 40) {   // cs: [[x, y, r]] in screen px
  const pts = [];
  for (const [x, y, r] of cs) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return hull(pts);
}
export function path(g, pts, close = true) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); }
export function shape(g, pts, fill, lw = LW, ink = PAL.ink) {
  if (FILLOV && fill) fill = FILLOV;
  if (GHOST) {
    path(g, pts); g.save(); g.fillStyle = PAL.paper; g.globalAlpha *= GHOST; g.fill();
    g.setLineDash([lw * 1.2, lw * 2.6]); g.lineWidth = lw * .85; g.strokeStyle = ink; g.lineCap = 'round'; g.stroke(); g.restore(); return;
  }
  if (GROW < 1) {   // outline traced first, the flat fill comes up after it
    const lp = clamp01(GROW / .7), fp = clamp01((GROW - .45) / .55);
    path(g, pts);
    if (fill && fp > 0) { g.save(); g.globalAlpha *= fp; g.fillStyle = fill; g.fill(); g.restore(); }
    if (lw) {
      let L = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
      g.save(); g.setLineDash([L * lp, L + 10]); g.lineWidth = lw; g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); g.restore();
    }
    return;
  }
  path(g, pts); if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}

// ---------- 3D primitives (each queues one sorted item) ----------
// box between corners a and b, optionally moved by o.xf (any rigid transform p -> p). Only faces turned toward the viewer are drawn,
// shaded by which way they face: up = top, along x = x, along z = z.
export function box(v, a, b, pal = PAL.part, o = {}) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b, xf = o.xf || ((p) => p);
  const K = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(xf);
  const F = [[3, 2, 6, 7], [1, 2, 6, 5], [4, 5, 6, 7], [0, 3, 7, 4], [0, 1, 2, 3], [0, 1, 5, 4]];
  const ctr = mid3(...K), faces = [];
  for (const f of F) {
    const q = f.map((i) => K[i]), c = mid3(...q), n = norm3(sub3(c, ctr));
    if (dot3(n, v.eye) <= 1e-4) continue;
    const key = n[1] > .6 ? 'top' : Math.abs(n[0]) > Math.abs(n[2]) ? 'x' : n[1] < -.6 ? 'x' : 'z';
    faces.push({ pts: q.map(v.P), fill: pal[key], d: dot3(n, v.eye) });
  }
  faces.sort((p, q) => p.d - q.d);
  const lw = o.lw ?? LW;
  v.add(o.depth ?? v.depth(ctr) + (o.bias || 0), (g) => {
    for (const f of faces) shape(g, f.pts, f.fill, lw);
    if (o.after) o.after(g);
  }, o.layer || 0);
}
export function rotAbout(pivot, axis, ang) {   // rigid rotation for o.xf
  const k = norm3(axis), c = Math.cos(ang), s = Math.sin(ang);
  return (p) => { const d = sub3(p, pivot), r = add3(add3(mul3(d, c), mul3(cross3(k, d), s)), mul3(k, dot3(k, d) * (1 - c))); return add3(pivot, r); };
}
// convex prism: a flat convex profile (3D points, the face nearest the viewer) pushed back by `back`
export function prism(v, face, back, pal = PAL.part, o = {}) {
  const P = v.P, f2 = face.map(P), b2 = face.map((p) => P(add3(p, back)));
  const sil = hull(f2.concat(b2)), lw = o.lw ?? LW;
  // a flat board is sorted by its nearest point, so the slats and rails behind it never poke through
  v.add(o.depth ?? Math.max(...face.map(v.depth)) + (o.bias || 0), (g) => {
    shape(g, sil, o.side || pal.z, lw);
    // sharp edges running back from the face
    g.lineWidth = lw; g.strokeStyle = PAL.ink; g.lineCap = 'round';
    for (const i of o.sharp || []) { g.beginPath(); g.moveTo(...f2[i]); g.lineTo(...b2[i]); g.stroke(); }
    shape(g, f2, o.front || pal.top, lw);
    if (o.after) o.after(g);
  }, o.layer || 0);
}
// cylinder between p0 and p1 with radius r (cm), optionally moved by o.xf like box(): a rigid transform (e.g. rotAbout) applied
// to both ends, so a lid can tip open or a bar swing without working out the moved ends by hand
export function cyl(v, p0, p1, r, pal = PAL.metal, o = {}) {
  if (o.xf) { p0 = o.xf(p0); p1 = o.xf(p1); }
  const ax = norm3(sub3(p1, p0)), t0 = Math.abs(ax[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm3(cross3(ax, t0)), e2 = cross3(ax, e1), N = 36;
  const ring = (c) => { const out = []; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; out.push(v.P(add3(c, add3(mul3(e1, Math.cos(a) * r), mul3(e2, Math.sin(a) * r))))); } return out; };
  const r0 = ring(p0), r1 = ring(p1), cap = dot3(ax, v.eye) > 0 ? r1 : r0, lw = o.lw ?? LW;
  v.add(o.depth ?? v.depth(mid3(p0, p1)) + (o.bias || 0), (g) => {
    shape(g, hull(r0.concat(r1)), o.side || pal.z, lw);
    shape(g, cap, o.cap || pal.top, lw);
    if (o.after) o.after(g);
  }, o.layer || 0);
}
// hull of spheres: [[p, r]] — limbs, torsos, fists. Orthographic, so every sphere is a circle of radius r·s.
export function blob(v, sph, fill, o = {}) {
  const cs = sph.map(([p, r]) => { const q = v.P(p); return [q[0], q[1], r * v.s]; });
  const h = circlesHull(cs), lw = o.lw ?? LW;
  v.add(o.depth ?? v.depth(mid3(...sph.map((x) => x[0]))) + (o.bias || 0), (g) => { shape(g, h, fill, lw); if (o.after) o.after(g, cs); }, o.layer || 0);
}
export function poly3(v, pts, fill, o = {}) {
  const p2 = pts.map(v.P), lw = o.lw ?? LW;
  v.add(o.depth ?? v.depth(mid3(...pts)) + (o.bias || 0), (g) => shape(g, p2, fill, lw, o.ink), o.layer || 0);
}

// ---------- manual marks ----------
// solid ink arrow along a screen polyline, with a paper halo so it reads on top of line work
export function arrow2(g, pts, w = 26, o = {}) {
  const hw = w / 2, headW = o.headW ?? w * 2.3, headL = o.headL ?? w * 1.9;
  // resample the path, cut the head length off its end
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  const at = (s) => { let i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; } const t = seg[i] ? s / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]; };
  const n = Math.max(8, Math.ceil(L / 6)), body = [], bodyL = Math.max(0, L - headL);
  const tail = o.tail ?? 1;   // 0..1 taper of the tail
  for (let i = 0; i <= n; i++) body.push(at(bodyL * i / n));
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const a = body[Math.max(0, i - 1)], b = body[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const k = hw * (tail + (1 - tail) * (i / n));
    left.push([body[i][0] - dy / d * k, body[i][1] + dx / d * k]); right.push([body[i][0] + dy / d * k, body[i][1] - dx / d * k]);
  }
  const e = body[n], tip = at(L), dx = tip[0] - e[0], dy = tip[1] - e[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  const poly = [...left, [e[0] + nx * headW / 2, e[1] + ny * headW / 2], tip, [e[0] - nx * headW / 2, e[1] - ny * headW / 2], ...right.reverse()];
  path(g, poly); g.lineJoin = 'round'; g.save(); if (GROW < 1) g.globalAlpha *= clamp01(GROW * 1.6);
  if (o.halo !== 0) { g.lineWidth = o.halo ?? 12; g.strokeStyle = o.haloColor || PAL.paper; g.stroke(); }
  g.fillStyle = o.fill || PAL.ink; g.fill(); g.restore();
}
// an arrow lying in a 3D plane: origin, unit axes U and V, outline given in (u,v) cm
export function planeArrow(v, origin, U, V, len, w, o = {}) {
  const hw = w / 2, hl = o.headL ?? w * 1.7, hW = o.headW ?? w * 1.15;
  const uv = [[0, -hw], [len - hl, -hw], [len - hl, -hW], [len, 0], [len - hl, hW], [len - hl, hw], [0, hw]];
  const pts = uv.map(([a, b]) => add3(origin, add3(mul3(U, a), mul3(V, b))));
  const p2 = pts.map(v.P);
  v.add(o.depth ?? v.depth(origin) + (o.bias || 0), (g) => {
    path(g, p2); g.lineJoin = 'round'; g.save(); if (GROW < 1) g.globalAlpha *= clamp01(GROW * 1.6);
    g.lineWidth = o.halo ?? 10; g.strokeStyle = PAL.paper; g.stroke();
    g.fillStyle = o.fill || PAL.ink; g.fill(); g.restore();
  }, o.layer || 0);
}
// rotation arrow: an arc around `axis` through `c`, radius r (cm), from angle a0 to a1 (rad); drawn as a screen arrow
export function turnArrow(v, c, axis, ref, r, a0, a1, w = 16, o = {}) {
  const ax = norm3(axis), e1 = norm3(sub3(ref, mul3(ax, dot3(ref, ax)))), e2 = cross3(ax, e1), pts = [];
  for (let i = 0; i <= 48; i++) { const a = a0 + (a1 - a0) * i / 48; pts.push(v.P(add3(c, add3(mul3(e1, Math.cos(a) * r), mul3(e2, Math.sin(a) * r))))); }
  v.add(o.depth ?? 1e6, (g) => arrow2(g, pts, w, o), o.layer ?? 5);
  return pts;
}
export function dashed(g, a, b, o = {}) {
  g.save(); g.setLineDash(o.dash || [2, 9]); g.lineCap = 'round'; g.lineWidth = o.lw ?? 2.4; g.strokeStyle = o.ink || PAL.ink;
  const k = (o.p ?? 1) * (GROW < 1 ? GROW : 1);
  g.beginPath(); g.moveTo(...a); g.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); g.stroke(); g.restore();
}
export function dashed3(v, a, b, o = {}) { const p = v.P(a), q = v.P(b); v.add(o.depth ?? Math.max(v.depth(a), v.depth(b)), (g) => dashed(g, p, q, o), o.layer || 0); }

// red cross and blue tick, drawn as strokes (never a font glyph)
export function cross(g, x, y, s = 30, lw = 7) {
  g.save(); g.strokeStyle = PAL.red; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s / 2, y - s / 2); g.lineTo(x + s / 2, y + s / 2); g.moveTo(x + s / 2, y - s / 2); g.lineTo(x - s / 2, y + s / 2); g.stroke(); g.restore();
}
export function tick(g, x, y, s = 30, lw = 7) {
  g.save(); g.strokeStyle = PAL.blue; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - s * .5, y - s * .02); g.lineTo(x - s * .12, y + s * .38); g.lineTo(x + s * .55, y - s * .45); g.stroke(); g.restore();
}
export function roundRect(g, x, y, w, h, r, fill, lw = LW) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = PAL.ink; g.stroke(); }
}
// "click": three short strokes radiating from a point
export function clickMark(g, x, y, r = 28, ang = -Math.PI / 4, lw = 3) {
  g.save(); g.strokeStyle = PAL.ink; g.lineWidth = lw; g.lineCap = 'round';
  for (const k of [-1, 0, 1]) { const a = ang + k * .5; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); g.stroke(); }
  g.restore();
}
