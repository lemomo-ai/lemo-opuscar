// orbi.js: Orbi with continuous pose parameters, for the film (needs flat.js and heroes.js for tear/capsule).
// Same drawing as HEROES.orbi in heroes.js (the frames), but every state is a number so poses blend with easing:
//   rot (deg), look [lx, ly], lid 0..1 (blink), smile 0..1 (cheek lid rises), zoom 0..1 (barrel telescopes out, iris narrows),
//   wide 0..1 (iris opens: surprise), sq (squash: >0 wider/shorter, <0 taller), tilt (both panels, deg), tl/tr (extra per side),
//   ant (antenna sway, deg), flame 0..1 (thruster length), flick (flame flicker phase, any number).
// orbiLens(x, y, s, P) gives the lens centre in the same space as x, y (for the sight line).
const clampO = x => Math.max(0, Math.min(1, x)), lerpO = (a, b, k) => a + (b - a) * k;
function orbiLocalLens(s, P) {
  const u = v => v * s, [lx, ly] = P.look || [0, 0];
  return [u(lx * 0.06), u(0.02 + ly * 0.045)];
}
function orbiScale(P) { const q = P.sq || 0; return [1 + q, 1 - q * 0.85]; }
function orbiLens(x, y, s, P) {
  const [qx, qy] = orbiLocalLens(s, P), [kx, ky] = orbiScale(P), a = (P.rot || 0) * Math.PI / 180;
  const px = qx * kx, py = qy * ky;
  return [x + Math.cos(a) * px - Math.sin(a) * py, y + Math.sin(a) * px + Math.cos(a) * py];
}
function orbi(p, x, y, s, P = {}) {
  const u = v => v * s, [lx, ly] = P.look || [0, 0], [kx, ky] = orbiScale(P);
  const G = g(p, { transform: `translate(${r1(x)},${r1(y)}) rotate(${r1(P.rot || 0)}) scale(${kx.toFixed(4)},${ky.toFixed(4)})` });
  const fx = u(lx * 0.06), fy = u(ly * 0.045);
  // thruster flame: two hard-edged teardrops, length breathes with a smooth flicker (no random per-frame jitter)
  const fl = P.flame == null ? 1 : P.flame;
  if (fl > 0.02) {
    const fk = 1 + 0.07 * Math.sin(P.flick || 0) + 0.04 * Math.sin((P.flick || 0) * 2.3 + 1);
    tear(G, 0, u(0.33), u(0.075), 0, u(0.33 + 0.29 * fl * fk), C.coral);
    tear(G, 0, u(0.33), u(0.042), 0, u(0.33 + 0.17 * fl * fk), C.sun);
  }
  el('rect', { x: u(-0.09), y: u(0.22), width: u(0.18), height: u(0.13), rx: u(0.045), fill: C.creamD }, G);
  const panel = (sx, x0, w, tilt) => {
    const Pg = g(G, { transform: `rotate(${r1(sx * tilt)} ${r1(u(sx * 0.3))} 0)` });
    capsule(Pg, u(sx * 0.28), 0, u(sx * (x0 + 0.02)), 0, u(0.04), C.mist);
    const xa = sx > 0 ? x0 : -x0 - w;
    el('rect', { x: u(xa), y: u(-0.12), width: u(w), height: u(0.23), rx: u(0.035), fill: C.blue }, Pg);
    el('rect', { x: u(xa), y: u(0.0), width: u(w), height: u(0.11), rx: u(0.035), fill: C.blueD }, Pg);
    el('rect', { x: u(xa), y: u(-0.005), width: u(w), height: u(0.04), fill: C.blueD }, Pg);
    for (const q of [1 / 3, 2 / 3]) el('rect', { x: u(xa + w * q - 0.008), y: u(-0.12), width: u(0.016), height: u(0.23), fill: C.blueD }, Pg);
  };
  const tilt = P.tilt || 0;
  panel(-1, 0.4, 0.27, tilt + (P.tl || 0)); panel(1, 0.4, 0.27, tilt + (P.tr || 0));
  // antenna: sways about its root (follow-through)
  const AG = g(G, { transform: `rotate(${r1(P.ant || 0)} ${r1(u(0.05))} ${r1(u(-0.29))})` });
  el('path', { d: `M${r1(u(0.05))},${r1(u(-0.29))}Q${r1(u(0.06))},${r1(u(-0.47))} ${r1(u(0.2))},${r1(u(-0.5))}`, fill: 'none', stroke: C.mist, 'stroke-width': r1(u(0.032)), 'stroke-linecap': 'round' }, AG);
  el('circle', { cx: r1(u(0.2)), cy: r1(u(-0.5)), r: r1(u(0.055)), fill: C.coral }, AG);
  shaded(G, 'circle', { cx: 0, cy: 0, r: u(0.32) }, C.sun, C.sunD, u(0.05), u(0.045));
  // the lens. zoom: a darker barrel ring steps out and the cream ring turns (six grooves), the iris narrows
  const z = Math.max(0, P.zoom || 0), cx = fx, cy = u(0.02) + fy;
  const R0 = u(0.2), R1 = u(0.158), Rb = R0 * (1 + 0.16 * z), Rc = R0 * (1 + 0.07 * z);
  if (z > 0.005) el('circle', { cx: r1(cx), cy: r1(cy), r: r1(Rb), fill: C.creamD }, G);
  el('circle', { cx: r1(cx), cy: r1(cy), r: r1(Rc), fill: C.cream }, G);
  if (z > 0.005) {
    const rr = (Rc + R1) / 2, k = Math.min(1, z * 2.5), a0 = z * 1.3;
    for (let i = 0; i < 6; i++) { const a = a0 + i * Math.PI / 3; el('circle', { cx: r1(cx + Math.cos(a) * rr), cy: r1(cy + Math.sin(a) * rr), r: r1(u(0.012) * k), fill: C.creamD }, G); }
  }
  el('circle', { cx: r1(cx), cy: r1(cy), r: r1(R1), fill: C.night }, G);
  const L = g(G, { 'clip-path': clipOf('circle', { cx: r1(cx), cy: r1(cy), r: r1(R1) }) });
  // smile: the iris itself bends up into an arch (^), like a smiling eye; the cut is the lens glass colour, so nothing covers the eye
  const sm = clampO(P.smile || 0);
  const ir = u(0.098) * (1 + 0.2 * (P.wide || 0)) * (1 - 0.3 * z) * (1 + 0.22 * sm), ix = cx + fx * 0.5, iy = cy + fy * 0.5 - ir * 0.2 * sm;
  el('circle', { cx: r1(ix), cy: r1(iy), r: r1(ir), fill: C.blue }, L);
  el('circle', { cx: r1(ix), cy: r1(iy), r: r1(ir * (0.46 - 0.1 * z)), fill: C.night }, L);
  if (sm > 0.005) el('circle', { cx: r1(ix), cy: r1(iy + ir * lerpO(2.3, 0.5, sm)), r: r1(ir * lerpO(1.0, 0.92, sm)), fill: C.night }, L);
  if (sm < 0.995) el('circle', { cx: r1(ix - ir * 0.42), cy: r1(iy - ir * 0.46), r: r1(ir * 0.32 * (1 - sm)), fill: C.cream }, L);
  const lid = P.lid || 0;
  if (lid > 0.005) { const RL = R1 * 1.7; el('circle', { cx: r1(cx), cy: r1(cy - R1 - RL + 2 * R1 * lid), r: r1(RL), fill: C.sunD }, L); }
  // cheeks lift a little with the smile, and a short laugh line curves up under the lens rim
  for (const sx of [-1, 1]) el('ellipse', { cx: r1(cx + sx * u(0.235)), cy: r1(cy + u(0.12) - u(0.025) * sm), rx: r1(u(0.045)), ry: r1(u(0.028)), fill: C.coral }, G);
  // P.hold: a tape-measure case in a short arm under the body (0..1 = how far the arm is out)
  const hk = P.hold || 0;
  if (hk > 0.01) {
    const cyC = u(0.74), w = u(0.5) * hk;
    shaded(G, 'rect', { x: r1(-w / 2), y: r1(cyC - w / 2), width: r1(w), height: r1(w), rx: r1(u(0.145) * hk) }, C.coral, C.coralD, u(0.05), u(0.05));
    el('circle', { cx: r1(-u(0.026)), cy: r1(cyC - u(0.026)), r: r1(u(0.112) * hk), fill: C.cream }, G);
    el('circle', { cx: r1(-u(0.026)), cy: r1(cyC - u(0.026)), r: r1(u(0.046) * hk), fill: C.coralD }, G);
    const gy = cyC - w / 2;
    capsule(G, 0, u(0.3), 0, gy - u(0.05), u(0.045), C.mist);
    for (const sx of [-1, 1]) el('path', { d: `M0,${r1(gy - u(0.06))}Q${r1(sx * u(0.09))},${r1(gy - u(0.04))} ${r1(sx * u(0.07))},${r1(gy + u(0.03))}`, fill: 'none', stroke: C.coralD, 'stroke-width': r1(u(0.04)), 'stroke-linecap': 'round' }, G);
    el('circle', { cx: 0, cy: r1(gy - u(0.06)), r: r1(u(0.04)), fill: C.coral }, G);
  }
  if (sm > 0.005) { const w = u(0.11) * sm, yb = cy + Rc + u(0.035); el('path', { d: `M${r1(cx - w)},${r1(yb - u(0.012))}Q${r1(cx)},${r1(yb + u(0.03) * sm)} ${r1(cx + w)},${r1(yb - u(0.012))}`, fill: 'none', stroke: C.sunD, 'stroke-width': r1(u(0.022)), 'stroke-linecap': 'round' }, G); }
  return G;
}
