// Small deterministic helpers shared by every module.
export function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const ss = k => k * k * (3 - 2 * k);
export const sst = (t, a, b) => ss(seg(t, a, b));
export const eo3 = k => 1 - Math.pow(1 - k, 3);
export const ei3 = k => k * k * k;
export const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const eio2 = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function hash2(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
// smooth 1D value noise
export function vnoise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u); }
// piecewise keyframes: [[t, value], ...] with an easing per segment
export function keys(t, ks, ease = eio) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const a = ks[i - 1], b = ks[i]; const k = ease((t - a[0]) / (b[0] - a[0])); return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k); }
  return ks[ks.length - 1][1];
}
// Catmull-Rom through points with uniform spacing in u in [0,1]
export function crom(pts, u) {
  const n = pts.length - 1; const x = clamp(u, 0, 1) * n; const i = Math.min(n - 1, Math.floor(x)); const f = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return p1.map((_, j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f));
}
