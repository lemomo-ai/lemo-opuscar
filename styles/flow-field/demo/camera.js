// Perspective camera over the chart plane (world = Mercator km, z up in km).
//   target (tx, ty) on the ground, dist (km), tilt (deg from straight down), head (deg, the direction the camera looks, 0 = north), fov (deg)
export function makeCam(p, W, H) {
  const D = Math.PI / 180, th = p.tilt * D, ps = p.head * D;
  const hx = Math.sin(ps), hy = Math.cos(ps);
  const R = [Math.cos(ps), -Math.sin(ps), 0];
  const F = [Math.sin(th) * hx, Math.sin(th) * hy, -Math.cos(th)];
  let U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  // roll
  if (p.roll) { const c = Math.cos(p.roll * D), s = Math.sin(p.roll * D); const R2 = R.map((v, i) => c * v + s * U[i]), U2 = U.map((v, i) => -s * R[i] + c * v); R.splice(0, 3, ...R2); U = U2; }
  const C = [p.tx - p.dist * F[0], p.ty - p.dist * F[1], -p.dist * F[2]];
  const foc = (H / 2) / Math.tan(p.fov * D / 2), NEAR = 0.5;
  function project(X, Y, Z = 0) {
    const dx = X - C[0], dy = Y - C[1], dz = Z - C[2];
    const z = dx * F[0] + dy * F[1] + dz * F[2]; if (z < NEAR) return null;
    return [W / 2 + foc * (dx * R[0] + dy * R[1] + dz * R[2]) / z, H / 2 - foc * (dx * U[0] + dy * U[1] + dz * U[2]) / z, z];
  }
  function ray(sx, sy) {   // screen -> ground point (or null above the horizon)
    const d = [F[0] * foc + R[0] * (sx - W / 2) + U[0] * (H / 2 - sy), F[1] * foc + R[1] * (sx - W / 2) + U[1] * (H / 2 - sy), F[2] * foc + R[2] * (sx - W / 2) + U[2] * (H / 2 - sy)];
    if (d[2] >= -1e-6) return null; const t = -C[2] / d[2]; return [C[0] + t * d[0], C[1] + t * d[1], t * Math.hypot(...d)];
  }
  const ppkClamped = (X, Y) => { const dx = X - C[0], dy = Y - C[1], dz = -C[2]; const z = dx * F[0] + dy * F[1] + dz * F[2]; return foc / Math.max(z, p.dist * 0.3); };
  const ppkAt = (X, Y, Z = 0) => { const dx = X - C[0], dy = Y - C[1], dz = Z - C[2]; const z = dx * F[0] + dy * F[1] + dz * F[2]; return z > NEAR ? foc / z : 0; };
  function footprint() {   // ground area under the screen, cut at 4x the target distance (beyond it the haze is opaque)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, mn = 1e9, mx = 0;
    const top = Math.min(H - 1, Math.max(0, rowAt(p.dist * 4)));
    for (let j = 0; j <= 4; j++) for (let i = 0; i <= 4; i++) {
      const g = ray(W * i / 4, top + (H - top) * j / 4); if (!g) continue;
      x0 = Math.min(x0, g[0]); x1 = Math.max(x1, g[0]); y0 = Math.min(y0, g[1]); y1 = Math.max(y1, g[1]);
      const k = ppkAt(g[0], g[1]); mn = Math.min(mn, k); mx = Math.max(mx, k);
    }
    return { x0, y0, x1, y1, ppkMin: mn, ppkMax: mx };
  }
  // screen rows where the ground reaches distance d0 and d1 (centre column): for the far haze
  function rowAt(dd) { let lo = 0, hi = H; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2, r = ray(W / 2, m); if (!r || r[2] > dd) lo = m; else hi = m; } return (lo + hi) / 2; }
  return { ...p, C, R, U, F, foc, W, H, project, ray, ppkAt, ppkClamped, footprint, rowAt, ppkRef: foc / p.dist };
}
