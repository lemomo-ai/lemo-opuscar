// Every bag and tray on the belt, built from X-ray solids at real sizes (metres).
// Frame: x along the belt (the belt runs towards -x), z across it (+z = down on the top view), y up from the belt.
import { THREE, V, X, item, ctx, rbox, boxShell, cylShell, tube, lathe, flat, instanced, spring, mulberry,
  ORG, INO, MET, ALU, PVC, GLASS, CELL, PCB, EGG } from './xr.js';

const M4 = () => new THREE.Matrix4();
const Q = new THREE.Quaternion();
const along = (geo) => geo.rotateZ(Math.PI / 2);                 // cylinder axis y → x
const acrossZ = (geo) => geo.rotateX(Math.PI / 2);               // cylinder axis y → z

// ---------- shared parts ----------
function tray(parent, w = 0.60, d = 0.42, h = 0.085, t = 0.004) {
  const g = new THREE.Group(); parent.add(g);
  X(rbox(w, t, d, 0.0015), ORG, 0.75, g).position.set(0, t / 2, 0);
  for (const s of [-1, 1]) {
    X(rbox(w, h, t, 0.0015), ORG, 0.75, g).position.set(0, h / 2, s * (d / 2 - t / 2));
    X(rbox(t, h, d, 0.0015), ORG, 0.75, g).position.set(s * (w / 2 - t / 2), h / 2, 0);
    X(rbox(w, 0.006, 0.014, 0.002), ORG, 0.75, g).position.set(0, h - 0.003, s * (d / 2 + 0.004));   // rim lip
  }
  return g;
}
function cableCoil(parent, cx, cz, R, loops, seed, y0, plug = true) {
  const r = mulberry(seed); const pts = [];
  for (let i = 0; i <= loops * 40; i++) { const a = i / 40 * Math.PI * 2; const rr = R * (0.85 + 0.2 * Math.sin(a * 0.5 + r() * 0.2) + (r() - 0.5) * 0.04); pts.push(V(cx + Math.cos(a) * rr * 1.2, y0 + Math.sin(i * 0.37) * 0.004, cz + Math.sin(a) * rr)); }
  const s = pts[0], e = pts[pts.length - 1];
  const all = [s.clone().add(V(-0.06, 0, 0.03)), s.clone().add(V(-0.03, 0, 0.01)), ...pts, e.clone().add(V(0.03, 0, -0.02)), e.clone().add(V(0.05, 0, -0.05))];
  tube(all, 0.0028, PVC, 0.9, parent, all.length * 3, false, 8); tube(all, 0.0008, MET, 1.6, parent, all.length * 3, false, 5);
  if (plug) [all[0], all[all.length - 1]].forEach((p, k) => { const c = X(rbox(0.012, 0.005, 0.022, 0.0015), MET, 0.9, parent); c.position.copy(p); c.rotation.y = k ? 0.6 : -0.5; });
}
function keyShape(len, seed) {   // a pin-tumbler key in the xz plane, bow at x = 0, blade towards +x
  const r = mulberry(seed); const s = new THREE.Shape();
  s.absarc(0, 0, 0.014, Math.PI * 0.25, Math.PI * 1.75, false);
  s.lineTo(0.016, -0.004);
  const n = 6; for (let i = 0; i < n; i++) { const x = 0.016 + (len - 0.02) * (i + 0.5) / n; s.lineTo(x - 0.002, -0.0035 - r() * 0.003); s.lineTo(x + 0.002, -0.004); }
  s.lineTo(len, -0.002); s.lineTo(len, 0.003); s.lineTo(0.016, 0.004); s.lineTo(0.0099, 0.0099);
  const hole = new THREE.Path(); hole.absarc(-0.004, 0, 0.004, 0, Math.PI * 2, true); s.holes.push(hole);
  return s;
}
function keyRing(parent, x, z, n, seed, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0.004, z); g.rotation.y = rot; parent.add(g);
  X(new THREE.TorusGeometry(0.014, 0.0012, 8, 40).rotateX(Math.PI / 2), MET, 1.6, g).position.set(0, 0.002, 0);
  for (let i = 0; i < n; i++) {
    const k = new THREE.Group(); k.position.set(0.01, 0.001 + i * 0.0022, 0); k.rotation.y = -0.5 + i * 0.55; g.add(k);
    flat(keyShape(0.055 + i * 0.006, seed + i), 0.0021, MET, 1.15, k).position.x = 0.014;
  }
  return g;
}
function coins(parent, list) { for (const [x, z, r] of list) X(new THREE.CylinderGeometry(r, r, 0.0019, 32), MET, 1.0, parent).position.set(x, 0.006, z); }
function lump(parent, w, h, d, x, y, z, den, seed, weave = 0.6) { const m = X(rbox(w, h, d, Math.min(w, h, d) * 0.45, 5), ORG, den, parent, { lump: 0.7, weave, seed }); m.position.set(x, y, z); return m; }
function zipper(parent, pts, closed = true) { tube(pts, 0.0016, MET, 1.0, parent, pts.length * 12, closed, 5); }

// ---------- 1. hard-shell suitcase, lying flat ----------
export function suitcase() {
  const it = item('suitcase'); const L = 0.56, H = 0.21, D = 0.38;
  boxShell(L, H, D, 0.035, 0.003, ORG, 1.25, it).forEach(m => m.position.set(0, H / 2, 0));
  for (const z of [-0.12, -0.04, 0.04, 0.12]) for (const y of [0.0045, H - 0.0045]) X(rbox(L - 0.08, 0.004, 0.012, 0.0018), ORG, 1.2, it).position.set(0, y, z);   // shell ribs
  { const zp = []; const hx = L / 2 - 0.004, hz = D / 2 - 0.004, rc = 0.03; for (const [cx, cz, a0] of [[hx - rc, hz - rc, 0], [-hx + rc, hz - rc, 0.5], [-hx + rc, -hz + rc, 1], [hx - rc, -hz + rc, 1.5]]) for (let i = 0; i <= 6; i++) { const a = (a0 + i / 12) * Math.PI; zp.push(V(cx + Math.cos(a) * rc, H / 2, cz + Math.sin(a) * rc)); } zipper(it, zp, true); }
  // trolley: two aluminium tubes in the back panel, the grip at +x
  for (const z of [-0.085, 0.085]) {
    cylShell(0.0115, 0.47, 0.0011, ALU, 1.4, it, 24).forEach(m => { m.geometry = along(m.geometry); m.position.set(-0.01, 0.016, z); });
    cylShell(0.009, 0.45, 0.001, ALU, 1.4, it, 24).forEach(m => { m.geometry = along(m.geometry); m.position.set(0.0, 0.016, z); });
  }
  X(rbox(0.035, 0.026, 0.21, 0.01), ORG, 1.0, it).position.set(0.255, 0.018, 0);
  X(rbox(0.008, 0.006, 0.03, 0.002), MET, 1.2, it).position.set(0.255, 0.03, 0);   // release button spring plate
  // four spinner wheels at -x
  for (const z of [-0.155, 0.155]) for (const y of [0.04, 0.17]) {
    const w = new THREE.Group(); w.position.set(-L / 2 - 0.022, y, z); it.add(w);
    X(acrossZ(new THREE.CylinderGeometry(0.024, 0.024, 0.017, 28)), ORG, 1.3, w);
    X(acrossZ(new THREE.CylinderGeometry(0.0034, 0.0034, 0.03, 10)), MET, 1.6, w);
    X(new THREE.TorusGeometry(0.008, 0.002, 6, 20), MET, 1.4, w).position.z = 0.006;
    X(rbox(0.03, 0.032, 0.03, 0.006), ORG, 0.9, w).position.set(0.018, 0, 0);
  }
  // contents
  const r = mulberry(4);
  lump(it, 0.25, 0.05, 0.17, -0.12, 0.05, -0.085, 0.85, 3);          // folded shirts
  lump(it, 0.24, 0.045, 0.16, -0.13, 0.1, -0.08, 0.8, 5);
  lump(it, 0.26, 0.06, 0.15, -0.11, 0.05, 0.095, 1.0, 7);            // jeans
  for (const [x, z] of [[-0.03, 0.05], [-0.025, 0.06], [-0.035, 0.13], [-0.2, 0.05], [-0.2, 0.14]]) X(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 12), MET, 1.6, it).position.set(x, 0.08, z);   // rivets
  X(rbox(0.004, 0.004, 0.07, 0.001), MET, 1.3, it).position.set(-0.02, 0.08, 0.095);   // jeans zip
  // toiletry pouch with three bottles and a razor
  const tp = new THREE.Group(); tp.position.set(0.13, 0.03, -0.1); it.add(tp);
  lump(tp, 0.18, 0.05, 0.11, 0, 0, 0, 0.35, 9, 1);
  [[-0.05, -0.02, 0.016], [0.0, 0.02, 0.019], [0.05, -0.015, 0.014]].forEach(([x, z, rr], i) => {
    const b = new THREE.Group(); b.position.set(x, 0.0, z); b.rotation.z = Math.PI / 2; tp.add(b);
    lathe([[0, -0.04], [rr, -0.04], [rr, 0.025], [rr * 0.5, 0.03], [rr * 0.5, 0.04], [0, 0.04]], ORG, 1.1, b, 28);
    X(new THREE.CylinderGeometry(rr * 0.55, rr * 0.55, 0.012, 20).translate(0, 0.044, 0), ORG, 1.4, b);
  });
  X(rbox(0.04, 0.003, 0.012, 0.001), MET, 1.6, tp).position.set(0.02, 0.02, 0.035);
  // hair dryer: barrel, handle, motor, heating spiral, coiled cord
  const hd = new THREE.Group(); hd.position.set(0.12, 0.06, 0.08); hd.rotation.y = 0.25; it.add(hd);
  cylShell(0.034, 0.15, 0.0025, ORG, 1.2, hd, 32).forEach(m => { m.geometry = along(m.geometry); });
  X(rbox(0.03, 0.03, 0.1, 0.012), ORG, 1.3, hd).position.set(-0.03, 0, 0.07);
  X(along(new THREE.CylinderGeometry(0.016, 0.016, 0.032, 24)), MET, 1.5, hd).position.x = -0.045;
  X(along(new THREE.CylinderGeometry(0.011, 0.011, 0.04, 20)), MET, 0.9, hd).position.x = -0.045;
  spring(0.022, 0.07, 9, 0.0007, MET, 2.4, hd).rotation.z = Math.PI / 2;
  hd.children[hd.children.length - 1].position.x = 0.035;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; X(rbox(0.06, 0.0015, 0.006, 0.0005), INO, 1.1, hd).position.set(0.035, Math.cos(a) * 0.012, Math.sin(a) * 0.012); }
  cableCoil(it, -0.02, -0.06, 0.03, 4, 11, 0.13);
  // phone charger brick
  const ch = new THREE.Group(); ch.position.set(0.21, 0.03, 0.12); it.add(ch);
  X(rbox(0.05, 0.028, 0.05, 0.006), ORG, 1.2, ch);
  X(new THREE.TorusGeometry(0.009, 0.004, 10, 24).rotateX(Math.PI / 2), MET, 1.4, ch);
  X(rbox(0.012, 0.008, 0.012, 0.001), INO, 1.4, ch);
  for (const z of [-0.008, 0.008]) X(rbox(0.018, 0.002, 0.0025, 0.0005), MET, 1.6, ch).position.set(0.033, 0, z);
  return it;
}

// ---------- 2. laptop in a tray ----------
export function laptop() {
  const it = item('laptop'); tray(it);
  const lp = new THREE.Group(); lp.position.set(0, 0.006, 0); lp.rotation.y = 0.04; it.add(lp);
  const W = 0.31, D = 0.215;
  X(rbox(W, 0.0012, D, 0.0006), ALU, 1.2, lp).position.y = 0.001;                  // bottom case
  X(rbox(W, 0.0012, D, 0.0006), ALU, 1.2, lp).position.y = 0.017;                  // lid
  X(rbox(W - 0.012, 0.0009, D - 0.02, 0.0004), GLASS, 0.9, lp).position.y = 0.015; // display glass
  for (const s of [-1, 1]) { X(rbox(W, 0.016, 0.003, 0.001), ALU, 1.0, lp).position.set(0, 0.009, s * (D / 2 - 0.0015)); X(rbox(0.003, 0.016, D, 0.001), ALU, 1.0, lp).position.set(s * (W / 2 - 0.0015), 0.009, 0); }
  // keyboard plate with key holes (the grid reads as a laptop at a glance)
  const kb = new THREE.Group(); kb.position.set(0, 0.012, -0.03); lp.add(kb);
  X(rbox(0.27, 0.0008, 0.105, 0.0003), MET, 3.0, kb);
  const holes = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) { const w = (r === 5 && c > 3 && c < 9) ? 0 : 0.0155; if (!w) continue; holes.push(M4().makeTranslation(-0.1255 + c * 0.0193, 0, -0.045 + r * 0.018)); }
  holes.push(M4().compose(V(0, 0, 0.045), Q.identity(), V(5.5, 1, 1)));
  instanced(new THREE.BoxGeometry(0.0155, 0.0008, 0.0145), holes, MET, -3.0, kb);
  X(rbox(0.11, 0.0006, 0.07, 0.003), GLASS, 0.6, lp).position.set(0, 0.0115, 0.065);   // trackpad glass
  // battery: six pouch cells in the front half
  for (let i = 0; i < 3; i++) for (const z of [0.038, 0.084]) X(rbox(0.07, 0.006, 0.044, 0.002), CELL, 1.5, lp).position.set(-0.076 + i * 0.076, 0.005, z);
  // logic board, chips, heat pipe, fans
  X(rbox(0.16, 0.0015, 0.06, 0.002), PCB, 1.4, lp).position.set(0, 0.006, -0.065);
  [[-0.02, -0.065, 0.022, 0.022, 1.6], [0.025, -0.07, 0.014, 0.012, 1.4], [0.05, -0.06, 0.014, 0.01, 1.4], [-0.05, -0.07, 0.02, 0.012, 1.3]].forEach(([x, z, w, d, den]) => X(rbox(w, 0.0016, d, 0.0005), MET, den, lp).position.set(x, 0.0078, z));
  tube([V(-0.02, 0.009, -0.065), V(-0.06, 0.009, -0.07), V(-0.1, 0.009, -0.075), V(-0.125, 0.009, -0.07)], 0.0025, MET, 1.3, lp, 40);
  tube([V(-0.02, 0.009, -0.06), V(0.05, 0.009, -0.05), V(0.1, 0.009, -0.06), V(0.125, 0.009, -0.07)], 0.0025, MET, 1.3, lp, 40);
  for (const x of [-0.125, 0.125]) {
    const f = new THREE.Group(); f.position.set(x, 0.007, -0.07); lp.add(f);
    cylShell(0.03, 0.008, 0.0012, ORG, 1.2, f, 40);
    const bl = []; for (let i = 0; i < 31; i++) { const a = i / 31 * Math.PI * 2; Q.setFromAxisAngle(V(0, 1, 0), a); bl.push(M4().compose(V(Math.cos(a) * 0.019, 0, -Math.sin(a) * 0.019), Q.clone(), V(1, 1, 1))); }
    instanced(new THREE.BoxGeometry(0.016, 0.006, 0.0007), bl, ORG, 1.2, f);
    X(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 20), MET, 1.4, f);
  }
  for (const x of [-0.14, 0.14]) X(rbox(0.016, 0.005, 0.05, 0.003), MET, 1.5, lp).position.set(x, 0.005, 0.03);   // speaker magnets
  for (const x of [-0.1, 0.1]) X(rbox(0.04, 0.006, 0.012, 0.002), MET, 1.6, lp).position.set(x, 0.009, -D / 2 + 0.008);   // hinges
  const scr = []; for (let i = 0; i < 10; i++) { const a = i / 10; const x = -0.145 + 0.29 * (i % 5) / 4, z = i < 5 ? -0.1 : 0.1; scr.push(M4().makeTranslation(x, 0.003, z)); }
  instanced(new THREE.CylinderGeometry(0.0016, 0.0016, 0.004, 10), scr, MET, 1.6, lp);
  return it;
}

// ---------- 3. long umbrella ----------
export function umbrella() {
  const it = item('umbrella'); const u = new THREE.Group(); u.position.set(0.02, 0.03, 0); u.rotation.y = 0.07; it.add(u);
  cylShell(0.0048, 0.78, 0.0008, MET, 1.6, u, 16).forEach(m => { m.geometry = along(m.geometry); m.position.x = 0.0; });
  X(along(new THREE.ConeGeometry(0.006, 0.05, 16)).translate(0.415, 0, 0), MET, 1.4, u);                 // ferrule
  // crook handle (wood) with the shaft's end inside
  const hk = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 1.15; hk.push(i < 1 ? V(-0.37, 0, 0) : V(-0.42 - Math.sin(a) * 0.05, 0, -0.05 + Math.cos(a) * 0.05)); }
  tube([V(-0.33, 0, 0), V(-0.38, 0, 0), ...hk.slice(1)], 0.0135, ORG, 1.3, u, 80, false, 14);
  // eight ribs and stretchers, folded along the shaft
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2; const cy = Math.cos(a), cz = Math.sin(a);
    tube([V(0.385, cy * 0.006, cz * 0.006), V(0.2, cy * 0.016, cz * 0.016), V(-0.02, cy * 0.02, cz * 0.02), V(-0.17, cy * 0.012, cz * 0.012)], 0.0012, MET, 1.7, u, 30, false, 5);
    tube([V(0.12, cy * 0.007, cz * 0.007), V(0.0, cy * 0.016, cz * 0.016), V(-0.1, cy * 0.019, cz * 0.019)], 0.0009, MET, 1.5, u, 20, false, 5);
  }
  X(along(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 20)), ORG, 1.2, u).position.x = 0.13;           // runner
  X(along(new THREE.CylinderGeometry(0.0085, 0.0085, 0.02, 20)), ORG, 1.2, u).position.x = 0.39;          // top notch
  X(rbox(0.012, 0.002, 0.003, 0.0005), MET, 1.6, u).position.set(-0.24, 0.006, 0);                          // catch spring
  // canopy, wrapped
  lathe([[0.004, 0.0], [0.016, 0.03], [0.03, 0.2], [0.032, 0.4], [0.028, 0.53], [0.016, 0.57], [0.004, 0.58]], ORG, 0.32, (() => { const g = new THREE.Group(); g.rotation.z = Math.PI / 2; g.position.x = 0.39; u.add(g); return g; })(), 36, { weave: 1, seed: 2 });
  X(along(new THREE.CylinderGeometry(0.031, 0.031, 0.025, 28)), ORG, 0.5, u).position.x = 0.0;              // strap
  X(new THREE.CylinderGeometry(0.005, 0.005, 0.003, 14), MET, 1.6, u).position.set(0.0, 0.032, 0);          // snap
  return it;
}

// ---------- 4. a pair of sneakers ----------
function soleShape(mir, s = 1) {   // foot outline, toe at +x
  const P = [[-0.135, 0], [-0.128, 0.035], [-0.1, 0.044], [-0.04, 0.04], [0.02, 0.044], [0.075, 0.052], [0.12, 0.046], [0.145, 0.02], [0.148, -0.01], [0.13, -0.038], [0.09, -0.05], [0.04, -0.04], [-0.02, -0.032], [-0.08, -0.036], [-0.12, -0.03], [-0.134, -0.016]];
  const pts = P.map(([x, z]) => new THREE.Vector2(x * s, (mir ? -z : z) * s));
  if (mir) pts.reverse();
  const sh = new THREE.Shape(new THREE.SplineCurve([...pts, pts[0]]).getPoints(80));
  return sh;
}
// height profile of the upper along the foot: low at the toe, highest at the tongue and collar
const UPPER = [[-0.15, 0.88], [-0.11, 0.92], [-0.07, 0.86], [-0.03, 0.97], [0.02, 0.9], [0.07, 0.62], [0.11, 0.42], [0.16, 0.3]];
function upperK(x) { for (let i = 1; i < UPPER.length; i++) if (x <= UPPER[i][0]) { const [x0, k0] = UPPER[i - 1], [x1, k1] = UPPER[i]; const u = Math.max(0, Math.min(1, (x - x0) / (x1 - x0))); return k0 + (k1 - k0) * u * u * (3 - 2 * u); } return UPPER[UPPER.length - 1][1]; }
function shoe(parent, mir, x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g);
  // ExtrudeGeometry after rotateX(+pi/2) maps shape-y to -z; mirror handled in the outline
  const mk = (s, h, cls, den, y, o, shape = false) => {
    const geo = new THREE.ExtrudeGeometry(soleShape(mir, s), { depth: h, bevelEnabled: true, bevelThickness: Math.min(0.004, h / 3), bevelSize: 0.003, bevelSegments: 3, curveSegments: 12, steps: shape ? 6 : 1 }).rotateX(Math.PI / 2).translate(0, y + h, 0);
    if (shape) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i); if (yy > y) p.setY(i, y + (yy - y) * upperK(p.getX(i))); } }
    return X(geo, cls, den, g, o);
  };
  mk(1.0, 0.012, ORG, 1.3, 0.0, {});                                // outsole
  mk(0.99, 0.018, ORG, 0.55, 0.012, { lump: 0.2, seed: mir ? 3 : 4 }); // foam midsole
  mk(0.93, 0.07, ORG, 0.45, 0.03, { weave: 0.8, seed: mir ? 5 : 6 }, true);   // upper (solid, mesh fabric)
  mk(0.86, 0.064, ORG, -0.38, 0.034, {}, true);                     // hollow inside
  // tread holes
  const tr = []; for (let i = 0; i < 26; i++) for (let j = -2; j <= 2; j++) { const xx = -0.12 + i * 0.0105, zz = j * 0.014; if (Math.abs(zz) > 0.042 - (Math.abs(xx) > 0.1 ? 0.02 : 0)) continue; tr.push(M4().makeTranslation(xx, 0.005, mir ? -zz : zz)); }
  instanced(new THREE.BoxGeometry(0.0045, 0.008, 0.009), tr, ORG, -0.6, g);
  // eyelets and laces
  const ey = []; for (let i = 0; i < 6; i++) for (const s of [-1, 1]) ey.push([0.005 + i * 0.016, s * 0.018 * (mir ? -1 : 1)]);
  const top = xx => 0.03 + 0.07 * upperK(xx) - 0.004;
  for (const [xx, zz] of ey) X(new THREE.TorusGeometry(0.0032, 0.0009, 6, 16).rotateX(Math.PI / 2), MET, 1.6, g).position.set(xx, top(xx), zz);
  for (let i = 0; i < 5; i++) { const a = ey[i * 2], b = ey[i * 2 + 3]; tube([V(a[0], top(a[0]), a[1]), V((a[0] + b[0]) / 2, top((a[0] + b[0]) / 2) + 0.004, 0), V(b[0], top(b[0]), b[1])], 0.0013, ORG, 1.2, g, 12, false, 5); }
  X(rbox(0.05, 0.05, 0.06, 0.015), ORG, 0.7, g).position.set(-0.11, 0.055, 0);   // heel counter
  X(rbox(0.06, 0.002, 0.012, 0.0008), PVC, 1.2, g).position.set(-0.03, 0.03, 0);  // shank
}
export function sneakers() {
  const it = item('sneakers'); tray(it, 0.6, 0.42, 0.085);
  shoe(it, false, -0.02, -0.085, 0.42); shoe(it, true, 0.03, 0.095, 0.2);
  return it;
}

// ---------- 5. books, a spiral notebook, a pen ----------
export function books() {
  const it = item('books'); tray(it);
  const hb = new THREE.Group(); hb.position.set(-0.05, 0.006, 0.0); hb.rotation.y = -0.08; it.add(hb);
  X(rbox(0.24, 0.0025, 0.17, 0.0008), ORG, 1.5, hb).position.y = 0.001;
  X(rbox(0.24, 0.0025, 0.17, 0.0008), ORG, 1.5, hb).position.y = 0.033;
  X(rbox(0.232, 0.03, 0.162, 0.002), ORG, 0.85, hb, { weave: 0.25, seed: 4 }).position.set(0.003, 0.017, 0);
  X(rbox(0.004, 0.034, 0.17, 0.002), ORG, 1.4, hb).position.set(-0.12, 0.017, 0);
  const pb = new THREE.Group(); pb.position.set(0.02, 0.04, 0.03); pb.rotation.y = 0.21; it.add(pb);
  X(rbox(0.2, 0.02, 0.135, 0.002), ORG, 0.9, pb, { weave: 0.25, seed: 7 });
  X(rbox(0.004, 0.002, 0.13, 0.0008), MET, 1.2, pb).position.set(0.05, 0.011, 0);   // bookmark clip
  // spiral notebook with a steel coil along its spine
  const nb = new THREE.Group(); nb.position.set(0.12, 0.006, -0.1); nb.rotation.y = -0.35; it.add(nb);
  X(rbox(0.2, 0.012, 0.14, 0.002), ORG, 0.85, nb).position.y = 0.006;
  const sp = []; for (let i = 0; i <= 34 * 20; i++) { const a = i / 20 * Math.PI * 2; sp.push(V(-0.104 + Math.cos(a) * 0.0065, 0.0065 + Math.sin(a) * 0.0065, -0.066 + i / (34 * 20) * 0.132)); }
  tube(sp, 0.0008, MET, 3.2, nb, 34 * 24, false, 4);
  // pen: barrel, refill, spring, clip
  const pen = new THREE.Group(); pen.position.set(0.17, 0.012, 0.13); pen.rotation.y = 1.1; it.add(pen);
  X(along(new THREE.CylinderGeometry(0.005, 0.0045, 0.14, 16)), ORG, 1.1, pen);
  X(along(new THREE.CylinderGeometry(0.0015, 0.0015, 0.11, 8)), PVC, 1.2, pen).position.x = 0.01;
  spring(0.0022, 0.012, 9, 0.0004, MET, 2, pen).rotation.z = Math.PI / 2;
  pen.children[pen.children.length - 1].position.x = 0.05;
  X(rbox(0.045, 0.0012, 0.003, 0.0004), MET, 1.6, pen).position.set(-0.045, 0.006, 0);
  X(along(new THREE.ConeGeometry(0.0016, 0.006, 10)), MET, 1.6, pen).position.x = 0.072;
  return it;
}

// ---------- 6. vacuum flask ----------
export function thermos() {
  const it = item('thermos'); tray(it);
  const t = new THREE.Group(); t.position.set(-0.01, 0.042, 0.01); t.rotation.y = -0.12; it.add(t);
  const body = new THREE.Group(); body.rotation.z = Math.PI / 2; t.add(body);
  const out = [[0, -0.12], [0.034, -0.12], [0.036, -0.112], [0.036, 0.08], [0.03, 0.095], [0.03, 0.105], [0, 0.105]];
  const inn = [[0, -0.1155], [0.0352, -0.1155], [0.0354, -0.111], [0.0354, 0.0794], [0.0294, 0.094], [0.0294, 0.106], [0, 0.106]];
  lathe(out, MET, 1.3, body, 48); lathe(inn, MET, -1.3, body, 48);
  const inO = [[0, -0.108], [0.03, -0.108], [0.031, -0.1], [0.031, 0.08], [0.026, 0.092], [0.026, 0.104], [0, 0.104]];
  const inI = [[0, -0.1074], [0.0304, -0.1074], [0.0305, -0.0995], [0.0305, 0.0795], [0.0255, 0.0915], [0.0255, 0.105], [0, 0.105]];
  lathe(inO, MET, 1.3, body, 48); lathe(inI, MET, -1.3, body, 48);
  X(new THREE.CylinderGeometry(0.036, 0.036, 0.008, 40).translate(0, -0.116, 0), MET, 1.0, body);       // base plate
  // cap: plastic with a steel insert, silicone seal
  cylShell(0.037, 0.06, 0.0025, ORG, 1.3, body, 40).forEach(m => m.position.y = 0.125);
  X(new THREE.TorusGeometry(0.027, 0.0025, 8, 32).rotateX(Math.PI / 2), PVC, 1.2, body).position.y = 0.1;
  X(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 32), ORG, 1.1, body).position.y = 0.112;
  return it;
}

// ---------- 7. tray: belt, keys, padlock, coins, watch ----------
export function trayMisc() {
  const it = item('traymisc'); tray(it);
  // belt strap, loosely coiled, with a steel buckle
  const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2 * 1.35; const r = 0.12 - i / 120 * 0.04; pts.push(V(-0.06 + Math.cos(a) * r * 1.3, 0.01 + i / 120 * 0.006, 0.0 + Math.sin(a) * r)); }
  const bc = new THREE.CatmullRomCurve3(pts); const bgeo = new THREE.TubeGeometry(bc, 240, 1, 4, false);
  { const p = bgeo.attributes.position, n = 241 * 5; const c = new THREE.Vector3(); for (let i = 0; i < 241; i++) { const pt = bc.getPointAt(i / 240); for (let j = 0; j < 5; j++) { const k = i * 5 + j; c.set(p.getX(k) - pt.x, p.getY(k) - pt.y, p.getZ(k) - pt.z); p.setXYZ(k, pt.x + c.x * 0.0175, pt.y + c.y * 0.0018, pt.z + c.z * 0.0175); } } }
  X(bgeo, ORG, 1.2, it);
  const b0 = pts[0]; const bk = new THREE.Group(); bk.position.copy(b0).add(V(0.0, 0.004, 0)); bk.rotation.y = -0.3; it.add(bk);
  const bs = new THREE.Shape(); bs.moveTo(-0.022, -0.028); bs.lineTo(0.022, -0.028); bs.lineTo(0.022, 0.028); bs.lineTo(-0.022, 0.028); bs.lineTo(-0.022, -0.028);
  const bh = new THREE.Path(); bh.moveTo(-0.016, -0.022); bh.lineTo(-0.016, 0.022); bh.lineTo(0.016, 0.022); bh.lineTo(0.016, -0.022); bh.lineTo(-0.016, -0.022); bs.holes.push(bh);
  flat(bs, 0.004, MET, 1.4, bk);
  X(rbox(0.034, 0.003, 0.003, 0.001), MET, 1.6, bk).position.set(0.0, 0.004, 0);
  keyRing(it, 0.13, -0.11, 3, 21, 0.5);
  // padlock: solid steel body (impenetrable: black) and its shackle
  const pl = new THREE.Group(); pl.position.set(0.17, 0.0, 0.06); pl.rotation.y = 0.35; it.add(pl);
  X(rbox(0.062, 0.032, 0.052, 0.005), MET, 1.8, pl).position.set(0, 0.019, 0);
  tube([V(-0.02, 0.019, -0.024), V(-0.02, 0.019, -0.05), V(-0.01, 0.019, -0.064), V(0.01, 0.019, -0.064), V(0.02, 0.019, -0.05), V(0.02, 0.019, -0.024)], 0.0055, MET, 1.6, pl, 40, false, 10);
  coins(it, [[0.06, 0.12, 0.0125], [0.075, 0.13, 0.011], [0.045, 0.14, 0.0125], [-0.21, -0.13, 0.0105]]);
  // watch: steel case and a link bracelet
  const wt = new THREE.Group(); wt.position.set(-0.03, 0.006, 0.0); it.add(wt);
  X(new THREE.CylinderGeometry(0.019, 0.019, 0.01, 36), MET, 0.9, wt);
  X(new THREE.CylinderGeometry(0.0155, 0.0155, 0.012, 36), MET, -0.6, wt);
  for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) X(rbox(0.006, 0.004, 0.02, 0.001), MET, 1.3, wt).position.set(i * 0.0072, 0.0, 0);
  return it;
}

// ---------- 8. backpack with a power bank ----------
export function backpack() {
  const it = item('backpack'); const L = 0.44, H = 0.17, D = 0.3;
  boxShell(L, H, D, 0.06, 0.004, ORG, 1.0, it, { weave: 1, seed: 1 }).forEach(m => m.position.set(0, H / 2, 0));
  for (const z of [-0.07, 0.07]) X(rbox(0.36, 0.02, 0.06, 0.009), ORG, 0.6, it, { weave: 0.6, seed: 2 }).position.set(0.0, 0.012, z);   // shoulder straps
  for (const z of [-0.07, 0.07]) X(rbox(0.03, 0.008, 0.04, 0.002), ORG, 1.3, it).position.set(-0.17, 0.02, z);                       // buckles
  zipper(it, [V(-0.18, 0.16, -0.13), V(0.15, 0.16, -0.135), V(0.2, 0.16, 0.0), V(0.15, 0.16, 0.135), V(-0.18, 0.16, 0.13)], false);
  zipper(it, [V(0.05, 0.17, -0.09), V(0.18, 0.17, -0.08), V(0.18, 0.17, 0.08), V(0.05, 0.17, 0.09)], false);
  X(rbox(0.01, 0.003, 0.016, 0.001), MET, 1.6, it).position.set(-0.18, 0.165, -0.13);
  lump(it, 0.24, 0.06, 0.2, -0.08, 0.05, 0.02, 0.55, 6);                 // jacket
  X(rbox(0.21, 0.014, 0.15, 0.002), ORG, 0.9, it).position.set(-0.07, 0.11, -0.03);     // notebook
  cableCoil(it, 0.1, 0.07, 0.03, 4, 5, 0.06);
  X(rbox(0.06, 0.004, 0.02, 0.001), INO, 1.0, it).position.set(-0.12, 0.13, 0.09);     // lip balm tube etc.
  // the power bank: plastic shell, four cylindrical cells, the board with ports
  const pb = new THREE.Group(); pb.name = 'powerbank'; pb.position.set(0.1, 0.12, -0.06); pb.rotation.y = 0.18; it.add(pb);
  boxShell(0.144, 0.027, 0.072, 0.006, 0.0018, ORG, 1.3, pb);
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Group(); c.position.set(-0.012, 0, -0.0315 + i * 0.021); pb.add(c);
    X(along(new THREE.CylinderGeometry(0.0103, 0.0103, 0.07, 28)), CELL, 1.75, c);
    cylShell(0.0105, 0.071, 0.0004, MET, 1.6, c, 28).forEach(m => m.geometry = along(m.geometry));
    X(along(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 14)), MET, 1.6, c).position.x = 0.037;
  }
  X(rbox(0.024, 0.0016, 0.068, 0.001), PCB, 1.4, pb).position.set(0.056, 0, 0);
  for (const z of [-0.02, 0.0, 0.02]) X(rbox(0.008, 0.0035, 0.009, 0.0008), MET, 1.6, pb).position.set(0.067, 0.002, z);
  X(new THREE.TorusGeometry(0.004, 0.0018, 8, 18).rotateX(Math.PI / 2), MET, 1.5, pb).position.set(0.052, 0.002, -0.022);
  X(rbox(0.06, 0.0012, 0.008, 0.0005), MET, 1.5, pb).position.set(0.02, 0.0, 0.034);   // nickel strip
  return it;
}

// ---------- 9. tote bag with a 500 mL bottle ----------
export function tote() {
  const it = item('tote'); const L = 0.42, H = 0.12, D = 0.3;
  boxShell(L, H, D, 0.03, 0.002, ORG, 0.9, it, { weave: 1, seed: 8 }).forEach(m => m.position.set(0, H / 2, 0));
  for (const s of [-1, 1]) tube([V(-0.1, 0.11, s * 0.13), V(-0.16, 0.115, s * 0.2), V(-0.05, 0.12, s * 0.22), V(0.05, 0.12, s * 0.22), V(0.16, 0.115, s * 0.2), V(0.1, 0.11, s * 0.13)], 0.006, ORG, 1.0, it, 40, false, 8);
  lump(it, 0.22, 0.05, 0.16, -0.08, 0.04, 0.03, 0.5, 12);                       // scarf
  const wl = new THREE.Group(); wl.position.set(0.1, 0.03, 0.06); it.add(wl);
  X(rbox(0.11, 0.018, 0.09, 0.006), ORG, 1.2, wl); coins(wl, [[0.02, 0.01, 0.011], [0.03, 0.02, 0.0125]]);
  X(rbox(0.085, 0.001, 0.054, 0.003), PVC, 1.4, wl).position.set(-0.01, 0.004, 0);   // cards
  // sunglasses: plastic frame, steel hinges, lenses
  const sg = new THREE.Group(); sg.position.set(-0.1, 0.07, -0.07); sg.rotation.y = 0.3; it.add(sg);
  for (const s of [-1, 1]) { X(new THREE.TorusGeometry(0.024, 0.0025, 8, 30).rotateX(Math.PI / 2).scale(1.15, 1, 1), ORG, 1.3, sg).position.set(s * 0.032, 0, 0); X(new THREE.CylinderGeometry(0.023, 0.023, 0.002, 30).scale(1.15, 1, 1), ORG, 0.9, sg).position.set(s * 0.032, 0, 0); X(rbox(0.006, 0.004, 0.006, 0.001), MET, 1.6, sg).position.set(s * 0.06, 0, -0.005); X(rbox(0.004, 0.003, 0.12, 0.001), ORG, 1.2, sg).position.set(s * 0.062, 0, -0.065); }
  // the bottle, lying in the side pocket (separate so it can be taken out)
  const bt = new THREE.Group(); bt.name = 'bottle'; bt.position.set(0.02, 0.04, -0.105); it.add(bt); ctx.anchor = bt;
  const bb = new THREE.Group(); bb.rotation.z = -Math.PI / 2; bt.add(bb);
  const prof = [[0, -0.105], [0.03, -0.105], [0.0325, -0.1], [0.0325, -0.03], [0.031, -0.025], [0.0325, -0.02], [0.0325, 0.035], [0.026, 0.06], [0.0135, 0.08], [0.0135, 0.09], [0, 0.09]];
  const pin = prof.map(([r, y]) => [Math.max(0, r - 0.0004), y]);
  lathe(prof, ORG, 1.2, bb, 40); lathe(pin, ORG, -1.2, bb, 40);
  lathe(prof.map(([r, y]) => [Math.max(0, r - 0.0006), Math.min(y, 0.07)]).filter((p, i, a) => true), ORG, 0.95, bb, 40);     // the water
  X(new THREE.CylinderGeometry(0.0155, 0.0155, 0.018, 28).translate(0, 0.099, 0), ORG, 1.4, bb);
  ctx.anchor = it;
  return it;
}

// ---------- 10. lunch jar and keys (breakfast) ----------
export function lunch() {
  const it = item('lunch'); tray(it);
  const j = new THREE.Group(); j.position.set(-0.04, 0.062, 0.0); j.rotation.y = 0.1; it.add(j);
  const body = new THREE.Group(); body.rotation.z = Math.PI / 2; j.add(body);
  cylShell(0.056, 0.2, 0.0007, MET, 1.3, body, 48); cylShell(0.052, 0.19, 0.0007, MET, 1.3, body, 48);
  X(new THREE.CylinderGeometry(0.057, 0.057, 0.03, 48).translate(0, 0.11, 0), ORG, 1.1, body);                 // lid
  // three stacked bowls inside: rice, egg + greens, porridge
  [-0.06, 0.0, 0.06].forEach((y, i) => {
    lathe([[0, -0.028], [0.044, -0.028], [0.047, 0.026], [0.0485, 0.028], [0, 0.028]], MET, 0.9, body, 40).position.y = y;
    lathe([[0, -0.0272], [0.0432, -0.0272], [0.0462, 0.0262], [0.0477, 0.03], [0, 0.03]], MET, -0.9, body, 40).position.y = y;
    if (i === 0) X(new THREE.CylinderGeometry(0.04, 0.038, 0.04, 32), ORG, 0.95, body, { lump: 0.8, seed: 3 }).position.y = y - 0.004;
    if (i === 1) {
      const e = new THREE.Group(); e.position.y = y; body.add(e);
      X(new THREE.SphereGeometry(0.02, 24, 16).scale(1, 1.3, 1), EGG, 1.4, e).position.set(0.012, 0, 0);
      X(new THREE.SphereGeometry(0.019, 24, 16).scale(1, 1.3, 1), EGG, -1.4, e).position.set(0.012, 0, 0);
      X(new THREE.SphereGeometry(0.019, 24, 16).scale(1, 1.3, 1), ORG, 0.9, e).position.set(0.012, 0, 0);
      X(rbox(0.03, 0.03, 0.035, 0.01), ORG, 0.6, e, { lump: 0.8, seed: 9 }).position.set(-0.02, 0, 0);
    }
    if (i === 2) X(new THREE.CylinderGeometry(0.041, 0.038, 0.034, 32), ORG, 0.8, body).position.y = y - 0.006;
  });
  // spoon
  const sp = new THREE.Shape(); sp.moveTo(0, -0.003); sp.lineTo(0.11, -0.0035); sp.absellipse(0.13, 0, 0.022, 0.016, Math.PI, -Math.PI, true); sp.lineTo(0.11, 0.0035); sp.lineTo(0, 0.003); sp.lineTo(0, -0.003);
  const sg = new THREE.Group(); sg.position.set(-0.2, 0.006, 0.12); sg.rotation.y = 0.15; it.add(sg); flat(sp, 0.0015, MET, 1.4, sg);
  keyRing(it, 0.18, -0.1, 2, 31, -0.7);
  X(rbox(0.04, 0.003, 0.025, 0.004), ORG, 1.3, it).position.set(0.23, 0.006, -0.07);   // plastic key tag
  return it;
}
