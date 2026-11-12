// The wind field, computed from the best track (never drawn by hand).
// World units: Mercator kilometres (X east, Y north) around LON0/LAT0. Wind in m/s.
//   storm(τ)          position, Vmax, central pressure, Rmax, Holland B and translation velocity at storm time τ (hours since 2024-09-01 00 UTC)
//   wind(X, Y, S, o)  surface wind vector [u, v] (m/s) and |V| at a point, for storm state S
// Model (see DEMO.md / FACTS.md for sources):
//   symmetric vortex  Holland (1980) profile, normalised to the best-track Vmax:  V(r) = Vmax·sqrt((Rm/r)^B · exp(1 − (Rm/r)^B))
//   B                 Holland (1980): B = ρ·e·Vmax² / Δp, ρ = 1.15 kg m⁻³, Δp = 1010 hPa − Pc, clamped to [1.0, 2.2]
//   Rmax              Willoughby, Darling & Rahn (2006): Rmax = 46.4·exp(−0.0155·Vmax + 0.0169·φ) km
//   inflow angle      10° inside Rmax, 10→20° from Rmax to 1.2 Rmax, 20° outside (Sobey et al. 1977); +15° over land
//   background        0.55 × the storm's translation velocity, turned 20° anticlockwise (Lin & Chavas 2012)
//   land              (approximation) the vortex is cut to 0.75 over land; the up-slope part of the wind is removed in proportion
//                     to the smoothed slope of ETOPO1 terrain, so the surface flow goes round the mountains instead of over them.
export const R_E = 6371.0, LON0 = 112, LAT0 = 18, D2R = Math.PI / 180;
const Y0 = R_E * Math.log(Math.tan(Math.PI / 4 + LAT0 * D2R / 2));
export const toXY = (lon, lat) => [R_E * (lon - LON0) * D2R, R_E * Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) - Y0];
export const toLL = (X, Y) => [LON0 + X / R_E / D2R, (2 * Math.atan(Math.exp((Y + Y0) / R_E)) - Math.PI / 2) / D2R];
export const secAt = Y => 1 / Math.cos(toLL(0, Y)[1] * D2R);     // Mercator scale factor (map km per true km)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- the track
// TRACK rows: [τ hours, lat, lon, Pc hPa, Vmax m/s]
export function makeStorm(TRACK) {
  const P = TRACK.map(r => toXY(r[2], r[1]));
  const n = TRACK.length, T = TRACK.map(r => r[0]);
  const seg = τ => { let i = 0; while (i < n - 2 && τ > T[i + 1]) i++; return i; };
  // centripetal-ish Catmull–Rom on positions (uniform in time, 6-h records), linear in time outside
  function pos(τ) {
    τ = clamp(τ, T[0], T[n - 1]); const i = seg(τ), u = (τ - T[i]) / (T[i + 1] - T[i]);
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    const h = (T[i + 1] - T[i]);
    const m1 = [(p2[0] - p0[0]) / ((T[Math.min(n - 1, i + 1)] - T[Math.max(0, i - 1)]) || 1) * h, (p2[1] - p0[1]) / ((T[Math.min(n - 1, i + 1)] - T[Math.max(0, i - 1)]) || 1) * h];
    const m2 = [(p3[0] - p1[0]) / ((T[Math.min(n - 1, i + 2)] - T[i]) || 1) * h, (p3[1] - p1[1]) / ((T[Math.min(n - 1, i + 2)] - T[i]) || 1) * h];
    const u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2;
    return [a * p1[0] + b * m1[0] + c * p2[0] + d * m2[0], a * p1[1] + b * m1[1] + c * p2[1] + d * m2[1]];
  }
  // intensity: monotone (Fritsch–Carlson) cubic so the curve never overshoots a record
  function mono(col) {
    const y = TRACK.map(r => r[col]), dk = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) dk.push((y[i + 1] - y[i]) / (T[i + 1] - T[i]));
    for (let i = 1; i < n - 1; i++) m[i] = dk[i - 1] * dk[i] <= 0 ? 0 : (dk[i - 1] + dk[i]) / 2;
    m[0] = dk[0]; m[n - 1] = dk[n - 2];
    for (let i = 0; i < n - 1; i++) {
      if (dk[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / dk[i], b = m[i + 1] / dk[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * dk[i]; m[i + 1] = k * b * dk[i]; }
    }
    return τ => {
      τ = clamp(τ, T[0], T[n - 1]); const i = seg(τ), h = T[i + 1] - T[i], u = (τ - T[i]) / h;
      const u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1];
    };
  }
  const vmaxF = mono(4), pcF = mono(3);
  return function storm(τ) {
    const [X, Y] = pos(τ), a = pos(τ - 0.5), b = pos(τ + 0.5), sec = secAt(Y);
    const vt = [(b[0] - a[0]) / sec / 3.6, (b[1] - a[1]) / sec / 3.6];   // true km/h -> m/s
    const vmax = vmaxF(τ), pc = pcF(τ), lat = toLL(X, Y)[1];
    const dp = Math.max(300, (1010 - pc) * 100);
    const B = clamp(1.15 * Math.E * vmax * vmax / dp, 1.0, 2.2);
    const rmax = 46.4 * Math.exp(-0.0155 * vmax + 0.0169 * lat);
    const rout = 420 + 9 * Math.max(0, vmax - 15);   // km
    return { τ, X, Y, sec, vt, vmax, pc, B, rmax, rout, lat, eye: sstep(33, 47, vmax) };
  };
}

// ---------------------------------------------------------------- terrain (ETOPO1 grids from raw/chart.json)
let GR = null, GH = null;
function decode(g) {
  const bin = atob(g.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return { ...g, z: new Int16Array(u8.buffer) };
}
// a smoothed copy in map km for slope (box blur passes)
function blur(z, nx, ny, r, passes) {
  let a = Float32Array.from(z), b = new Float32Array(a.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < ny; j++) { let s = 0; for (let i = -r; i <= r; i++) s += a[j * nx + clamp(i, 0, nx - 1)]; for (let i = 0; i < nx; i++) { b[j * nx + i] = s / (2 * r + 1); s += a[j * nx + clamp(i + r + 1, 0, nx - 1)] - a[j * nx + clamp(i - r, 0, nx - 1)]; } }
    for (let i = 0; i < nx; i++) { let s = 0; for (let j = -r; j <= r; j++) s += b[clamp(j, 0, ny - 1) * nx + i]; for (let j = 0; j < ny; j++) { a[j * nx + i] = s / (2 * r + 1); s += b[clamp(j + r + 1, 0, ny - 1) * nx + i] - b[clamp(j - r, 0, ny - 1) * nx + i]; } }
  }
  return a;
}
export function setTerrain(chart) {
  GR = decode(chart.gridR); GH = decode(chart.gridH);
  for (const g of [GR, GH]) {
    g.zs = blur(g.z, g.nx, g.ny, g === GH ? 4 : 2, 2);           // ~8–10 km smoothing for the slope
    const land = new Float32Array(g.z.length); for (let i = 0; i < land.length; i++) land[i] = g.z[i] > 0 ? 1 : 0;
    g.land = blur(land, g.nx, g.ny, g === GH ? 3 : 1, 2);         // soft land fraction
  }
  return { GR, GH };
}
function samp(g, arr, lon, lat, edge = false) {
  let fx = (lon - g.lon0) / g.dlon, fy = (lat - g.lat0) / g.dlat;
  if (fx < 0 || fy < 0 || fx > g.nx - 1.001 || fy > g.ny - 1.001) { if (!edge) return null; fx = clamp(fx, 0, g.nx - 1.001); fy = clamp(fy, 0, g.ny - 1.001); }
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * g.nx + i;
  return (arr[k] * (1 - u) + arr[k + 1] * u) * (1 - v) + (arr[k + g.nx] * (1 - u) + arr[k + g.nx + 1] * u) * v;
}
// blend the fine Hainan grid in smoothly near its box edge, so nothing jumps
function inHi(lon, lat) { const g = GH; const m = 0.25; return sstep(0, m, lon - g.lon0) * sstep(0, m, g.lon0 + g.dlon * (g.nx - 1) - lon) * sstep(0, m, lat - g.lat0) * sstep(0, m, g.lat0 + g.dlat * (g.ny - 1) - lat); }
export function terrainAt(lon, lat, which) {   // which: 'z' raw height m, 'zs' smoothed, 'land' fraction
  const r = samp(GR, GR[which], lon, lat, true);   // beyond the grid: its edge, extended
  const w = inHi(lon, lat); if (w <= 0) return r;
  const h = samp(GH, GH[which], lon, lat); return h == null ? r : r + (h - r) * w;
}

// precomputed land fraction and slope on a regular map-km grid (fast lookups for thousands of streamlines per frame)
let TG = null;
export function buildTerrainGrid(x0, y0, x1, y1, step) {
  const nx = Math.ceil((x1 - x0) / step) + 1, ny = Math.ceil((y1 - y0) / step) + 1;
  const land = new Float32Array(nx * ny), gx = new Float32Array(nx * ny), gy = new Float32Array(nx * ny), hz = new Float32Array(nx * ny);
  const zs = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const [lon, lat] = toLL(x0 + i * step, y0 + j * step), k = j * nx + i;
    land[k] = terrainAt(lon, lat, 'land'); zs[k] = Math.max(0, terrainAt(lon, lat, 'zs')); hz[k] = Math.max(0, terrainAt(lon, lat, 'z'));
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, l = j * nx + Math.max(0, i - 1), r = j * nx + Math.min(nx - 1, i + 1), d = Math.max(0, j - 1) * nx + i, u = Math.min(ny - 1, j + 1) * nx + i;
    gx[k] = (zs[r] - zs[l]) / (2 * step); gy[k] = (zs[u] - zs[d]) / (2 * step);   // metres per map km
  }
  TG = { x0, y0, step, nx, ny, land, gx, gy, hz };
  return TG;
}
const OUT = [0, 0, 0, 0];
function tg(X, Y) {   // -> OUT = [land, gx, gy, height]
  const fx = (X - TG.x0) / TG.step, fy = (Y - TG.y0) / TG.step;
  if (fx < 0 || fy < 0 || fx >= TG.nx - 1 || fy >= TG.ny - 1) { OUT[0] = OUT[1] = OUT[2] = OUT[3] = 0; return OUT; }
  const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * TG.nx + i, a = (1 - u) * (1 - v), b = u * (1 - v), c = (1 - u) * v, d = u * v, n = TG.nx;
  OUT[0] = TG.land[k] * a + TG.land[k + 1] * b + TG.land[k + n] * c + TG.land[k + n + 1] * d;
  OUT[1] = TG.gx[k] * a + TG.gx[k + 1] * b + TG.gx[k + n] * c + TG.gx[k + n + 1] * d;
  OUT[2] = TG.gy[k] * a + TG.gy[k + 1] * b + TG.gy[k + n] * c + TG.gy[k + n + 1] * d;
  OUT[3] = TG.hz[k] * a + TG.hz[k + 1] * b + TG.hz[k + n] * c + TG.hz[k + n + 1] * d;
  return OUT;
}
export const heightAt = (X, Y) => tg(X, Y)[3];

// ---------------------------------------------------------------- the wind
const W = [0, 0, 0];
export function wind(X, Y, S, terrainOn = 1) {
  const dx = (X - S.X) / S.sec, dy = (Y - S.Y) / S.sec, r = Math.sqrt(dx * dx + dy * dy) + 1e-6;
  const T = tg(X, Y), land = T[0] * terrainOn;
  const q = Math.pow(S.rmax / r, S.B);
  let V = S.vmax * Math.sqrt(q * Math.exp(1 - q));
  V *= 1 / (1 + Math.pow(r / S.rout, 3));                     // the outer circulation ends (rout grows with intensity)
  V *= 1 - 0.25 * land;
  const ρ = r / S.rmax;
  const beta = (ρ < 1 ? 10 : ρ < 1.2 ? 10 + 50 * (ρ - 1) : 20) + 15 * land;
  const cb = Math.cos(beta * 0.017453), sb = Math.sin(beta * 0.017453);
  const tx = -dy / r, ty = dx / r;                            // anticlockwise (northern hemisphere)
  let u = V * (cb * tx - sb * dx / r), v = V * (cb * ty - sb * dy / r);
  // background: 0.55 × translation, turned 20° anticlockwise
  const c20 = 0.9397, s20 = 0.3420;
  u += 0.55 * (c20 * S.vt[0] - s20 * S.vt[1]); v += 0.55 * (s20 * S.vt[0] + c20 * S.vt[1]);
  if (terrainOn && (T[1] !== 0 || T[2] !== 0)) {
    const g = Math.hypot(T[1], T[2]), nx = T[1] / g, ny = T[2] / g, up = u * nx + v * ny;
    if (up > 0) { const k = Math.min(0.85, g / 14); u -= nx * up * k; v -= ny * up * k; }   // 14 m per km of smoothed slope: blocked to 85 %
  }
  W[0] = u; W[1] = v; W[2] = Math.hypot(u, v);
  return W;
}
