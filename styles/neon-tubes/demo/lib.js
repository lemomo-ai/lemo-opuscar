// Helpers shared by the film: easing, hashes, polyline geometry and the neon tube builder.
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eo = t => 1 - Math.pow(1 - clamp(t), 3);
export const hsh = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// monotone cubic through [[t, v], ...] (Fritsch-Carlson): camera keys never overshoot
export function monotone(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 3 * (d[i - 1] + d[i]) / ((2 * d[i] + d[i - 1]) / d[i - 1] + (d[i] + 2 * d[i - 1]) / d[i]);
  return t => {
    if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (t - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
export function track(keys) {        // keys: [t, a, b, c, ...] -> f(t) = [a, b, c, ...]
  const nv = keys[0].length - 1, f = [];
  for (let j = 1; j <= nv; j++) f.push(monotone(keys.map(k => [k[0], k[j]])));
  return t => f.map(g => g(t));
}

// ---------------------------------------------------------------- polylines
export function plen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
export function cumlen(P) { const c = [0]; for (let i = 1; i < P.length; i++) c.push(c[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return c; }
// round every interior corner like glass bent over a flame: quadratic arc with radius r (clamped to 45% of each leg)
export function fillet(P, r, n = 6) {
  if (P.length < 3) return P.map(p => [p[0], p[1]]);
  const out = [[P[0][0], P[0][1]]];
  for (let i = 1; i < P.length - 1; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1];
    let ax = p0[0] - p1[0], ay = p0[1] - p1[1], bx = p2[0] - p1[0], by = p2[1] - p1[1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by); if (la < 1e-9 || lb < 1e-9) continue;
    ax /= la; ay /= la; bx /= lb; by /= lb;
    const ang = Math.acos(clamp(ax * bx + ay * by, -1, 1));
    if (ang > Math.PI - 0.03) { out.push([p1[0], p1[1]]); continue; }
    const tl = Math.min(r / Math.tan(ang / 2), la * 0.45, lb * 0.45);
    const A = [p1[0] + ax * tl, p1[1] + ay * tl], B = [p1[0] + bx * tl, p1[1] + by * tl];
    const m = Math.max(2, Math.round(n * (Math.PI - ang) / 1.6));
    for (let k = 0; k <= m; k++) { const s = k / m, u = 1 - s; out.push([u * u * A[0] + 2 * u * s * p1[0] + s * s * B[0], u * u * A[1] + 2 * u * s * p1[1] + s * s * B[1]]); }
  }
  out.push([P[P.length - 1][0], P[P.length - 1][1]]);
  return out;
}
// point and unit tangent at arc length s
export function at(P, cum, s) {
  s = clamp(s, 0, cum[cum.length - 1]);
  let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = P[i - 1], b = P[i], L = cum[i] - cum[i - 1] || 1e-9, u = (s - cum[i - 1]) / L;
  const tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, tx, ty];
}
export function sub(P, cum, s0, s1) {          // the part of P between arc lengths s0..s1
  const out = [at(P, cum, s0).slice(0, 2)];
  for (let i = 1; i < P.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) out.push(P[i]);
  out.push(at(P, cum, s1).slice(0, 2));
  return out;
}
export function toPath(P) { const p = new Path2D(); p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]); return p; }

// ---------------------------------------------------------------- glyphs -> tubes
// A tube = one bent glass unit: a polyline in metres (y up) whose ranges are either lit strokes or black-painted
// double-backs, with an electrode at each end. ranges: [{a, b, paint}], arc lengths along the whole polyline.
export function tubeFromStrokes(strokes, opt = {}) {
  const r = opt.fil ?? 0.012, pts = [], ranges = [];
  let s = 0;
  const push = (P, paint) => {          // P[0] continues from the last point
    const a = s;
    if (!pts.length) pts.push(P[0]);
    for (let i = 1; i < P.length; i++) { const q = pts[pts.length - 1]; s += Math.hypot(P[i][0] - q[0], P[i][1] - q[1]); pts.push(P[i]); }
    ranges.push({ a, b: s, paint });
  };
  strokes.forEach((st, i) => {
    const F = fillet(st, r);
    if (i > 0) push([pts[pts.length - 1], F[0]], true);             // double-back, painted
    push(F, false);
  });
  // first and last 3 cm are the painted electrode sleeves (caps = [start, end]: a broken end has neither sleeve nor cap)
  const caps = opt.caps ?? [true, true];
  const len = s, sl = Math.min(0.025, len * 0.05, (opt.D ?? 0.015) * 1.6);
  const out = [];
  for (const g of ranges) {
    if (g.b - g.a < 1e-6) continue;
    if (!g.paint) {
      const a = Math.max(g.a, caps[0] ? sl : 0), b = Math.min(g.b, len - (caps[1] ? sl : 0));
      if (g.a < a) out.push({ a: g.a, b: Math.min(a, g.b), paint: true });
      if (b > a) out.push({ a, b, paint: false });
      if (b < g.b) out.push({ a: Math.max(b, g.a), b: g.b, paint: true });
    } else out.push(g);
  }
  const T = { pts, cum: cumlen(pts), len, ranges: out, caps, D: opt.D ?? 0.015, z: opt.z ?? 0.05, coat: !!opt.coat, col: opt.col, circ: opt.circ, ends: opt.ends !== false, ties: opt.ties !== false };
  finishTube(T);
  return T;
}
export function finishTube(T) {
  T.cum = cumlen(T.pts); T.len = T.cum[T.cum.length - 1];
  T.paths = T.ranges.map(g => ({ ...g, path: toPath(sub(T.pts, T.cum, g.a, g.b)) }));
  T.full = toPath(T.pts);
  // tie wires every ~0.22 m along lit ranges
  T.tiesAt = [];
  if (T.ties) for (const g of T.ranges) if (!g.paint) { const n = Math.floor((g.b - g.a) / 0.22); for (let k = 1; k <= n; k++) T.tiesAt.push(at(T.pts, T.cum, g.a + (g.b - g.a) * k / (n + 1))); }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of T.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  T.bb = [x0, y0, x1, y1];
  return T;
}

// hanzi: box with top-left (x0, ytop) and size s (metres); grid 0..10, y down
export function hanzi(G, ch, x0, ytop, s, opt) {
  const units = G.han[ch]; if (!units) throw new Error('no glyph ' + ch);
  return units.map(u => tubeFromStrokes(u.map(st => st.map(([gx, gy]) => [x0 + gx / 10 * s, ytop - gy / 10 * s])), { fil: s * 0.03, ...opt }));
}
// Latin caps, cap height h, returns {tubes, w}
export function latin(G, word, x0, ytop, h, opt = {}) {
  const tubes = []; let x = x0; const sp = opt.track ?? 2.6;
  for (const ch of word) {
    if (ch === ' ') { x += 4.2 * h / 10; continue; }
    const L = G.lat[ch]; if (!L) throw new Error('no letter ' + ch);
    let units;
    if (L.arc) {
      const [cx, cy, rx, ry, a0, a1] = L.arc, P = [];
      for (let a = a0; a <= a1 + 1e-6; a += 6) P.push([cx + rx * Math.cos(a * Math.PI / 180), cy - ry * Math.sin(a * Math.PI / 180)]);
      units = [[P]];
    } else units = [L.u];
    for (const u of units) tubes.push(tubeFromStrokes(u.map(st => st.map(([gx, gy]) => [x + gx / 10 * h, ytop - gy / 10 * h])), { fil: h * 0.06, D: opt.D ?? 0.011, ...opt }));
    x += (L.w + sp) * h / 10;
  }
  return { tubes, w: x - x0 - sp * h / 10 };
}
export function latinWidth(G, word, h, track = 2.6) {
  let x = 0; for (const ch of word) x += ch === ' ' ? 4.2 * h / 10 : (G.lat[ch].w + track) * h / 10; return x - track * h / 10;
}
