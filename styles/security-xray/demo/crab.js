// Chinese mitten crabs, tied with twisted straw rope, packed six to a foam box. All procedural, real size.
// Crab frame: x = left/right, z = front (+z), y = up; carapace about 68 x 62 mm.
import { THREE, V, X, item, ctx, rbox, boxShell, tube, instanced, mulberry, ORG, SHELL } from './xr.js';

const LEG = [0.62, 0.38, 0];
const TAU = Math.PI * 2;

// carapace outline: a squarish superellipse, narrower in front, four sharp teeth on each front-lateral edge
function Rf(th) {
  const a = 0.034, b = 0.031, n = 3.4;
  const c = Math.cos(th), s = Math.sin(th);
  let R = Math.pow(Math.pow(Math.abs(c) / a, n) + Math.pow(Math.abs(s) / b, n), -1 / n);
  if (s > 0) R *= 1 - 0.07 * Math.pow(s, 6);                    // front slightly narrower
  const side = Math.abs(Math.atan2(s, Math.abs(c)));             // 0 at the side, pi/2 at the front
  if (s > 0) for (const tk of [0.2, 0.42, 0.66, 0.9]) { const d = (side - tk) / 0.075; if (Math.abs(d) < 1) R += 0.0032 * Math.pow(1 - Math.abs(d), 2.2) * (d < 0 ? 1 : 0.55); }
  if (s > 0.94) R -= 0.0016 * (0.5 + 0.5 * Math.cos(Math.atan2(c, s) * 40));   // the frontal lobes between the eyes
  return R;
}
function carapaceGeo(k = 1) {
  const NR = 14, NA = 132, Ht = 0.021, Hb = 0.011; const pos = [], idx = [];
  for (let i = 0; i <= 2 * NR; i++) {
    const top = i <= NR, rho = top ? i / NR : (2 * NR - i) / NR;
    for (let j = 0; j < NA; j++) {
      const th = j / NA * TAU, R = Rf(th) * rho;
      const x = Math.cos(th) * R, z = Math.sin(th) * R;
      let y = top ? Ht * Math.pow(Math.max(0, 1 - Math.pow(rho, 2.6)), 0.55) : -Hb * Math.pow(Math.max(0, 1 - rho * rho), 0.5);
      if (top) y -= 0.0018 * Math.exp(-Math.pow(x / 0.004, 2)) * Math.exp(-Math.pow((z + 0.004) / 0.012, 2)) * rho * 2;          // cardiac groove
      if (top) y += 0.0012 * Math.exp(-Math.pow((Math.abs(x) - 0.016) / 0.007, 2)) * Math.exp(-Math.pow((z - 0.004) / 0.01, 2));  // branchial swellings
      pos.push(x * k, y * k, z * k);
    }
  }
  for (let i = 0; i < 2 * NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * NA + j, b = i * NA + (j + 1) % NA, c = (i + 1) * NA + j, d = (i + 1) * NA + (j + 1) % NA;
    idx.push(a, c, b, b, c, d);
  }
  // make sure faces point outwards (the sign of the signed volume)
  let vol = 0; for (let t = 0; t < idx.length; t += 3) { const A = idx[t] * 3, B = idx[t + 1] * 3, C = idx[t + 2] * 3; vol += pos[A] * (pos[B + 1] * pos[C + 2] - pos[B + 2] * pos[C + 1]) - pos[A + 1] * (pos[B] * pos[C + 2] - pos[B + 2] * pos[C]) + pos[A + 2] * (pos[B] * pos[C + 1] - pos[B + 1] * pos[C]); }
  if (vol < 0) for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const CARA = carapaceGeo(1), CARA_IN = carapaceGeo(0.94);

function segGeo(len, r, flat = 0.55, taper = 1) {   // a leg segment along +x from the joint
  const g = new THREE.CapsuleGeometry(r, Math.max(0.0005, len - 2 * r), 4, 10);
  g.rotateZ(-Math.PI / 2).translate(len / 2, 0, 0).scale(1, 1, flat);
  if (taper !== 1) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (taper - 1) * Math.min(1, Math.max(0, p.getX(i) / len)); p.setY(i, p.getY(i) * k); p.setZ(i, p.getZ(i) * k); } }
  return g;
}
function dactylGeo(len, r) { const g = new THREE.ConeGeometry(r, len, 10).rotateZ(-Math.PI / 2).translate(len / 2, 0, 0).scale(1, 1, 0.6); return g; }

// one walking leg; pose = {lift, yaw, b1, b2, b3}
function leg(parent, at, dims, pose, den = 1.15) {
  const root = new THREE.Group(); root.position.copy(at); parent.add(root);
  const [Lm, Lc, Lp, Ld, r] = dims;
  const j0 = new THREE.Group(); root.add(j0);
  X(segGeo(Lm, r), LEG, den, j0);
  const j1 = new THREE.Group(); j1.position.x = Lm; j0.add(j1); X(segGeo(Lc, r * 0.85), LEG, den, j1);
  const j2 = new THREE.Group(); j2.position.x = Lc; j1.add(j2); X(segGeo(Lp, r * 0.8, 0.55, 0.85), LEG, den, j2);
  const j3 = new THREE.Group(); j3.position.x = Lp; j2.add(j3); X(dactylGeo(Ld, r * 0.62), LEG, den, j3);
  const L = { root, j0, j1, j2, j3 };
  setPose(L, pose); return L;
}
function setPose(L, p) { L.root.rotation.set(0, p.yaw, 0); L.j0.rotation.z = p.lift; L.j1.rotation.z = -p.b1; L.j2.rotation.z = -p.b2; L.j3.rotation.z = -p.b3; }

function claw(parent, side, r) {
  // the big chelipeds, held forward at the front corners: merus, carpus, a large palm wrapped in the brown "mitten", two fingers
  const g = new THREE.Group(); parent.add(g);
  const s = side;   // +1 right, -1 left
  g.position.set(s * 0.02, -0.003, 0.025);
  g.rotation.y = s > 0 ? -1.1 : Math.PI + 1.1;   // merus points forward-out
  X(segGeo(0.013, 0.0058), LEG, 1.3, g);
  const c = new THREE.Group(); c.position.x = 0.013; c.rotation.y = s > 0 ? -0.55 : 0.55; g.add(c);   // the hand turns forward
  X(segGeo(0.01, 0.0056), LEG, 1.3, c);
  const h = new THREE.Group(); h.position.set(0.009, s > 0 ? -0.001 : 0.002, 0); h.rotation.y = s > 0 ? 0.12 : -0.12; c.add(h);
  const PL = 0.032, PR = PL / 2, SY = 0.48, SZ = 0.72;   // palm flattened top to bottom, as a crab's claw is seen from above
  X(new THREE.SphereGeometry(PR, 22, 14).scale(1.0, SY, SZ).translate(PR, 0, 0), LEG, 1.35, h);   // palm
  // two fingers opening sideways (a V seen from above), tips curving towards each other
  const finger = (len, rad, z, ang, den) => { const f = new THREE.Group(); f.position.set(PL * 0.86, 0, z); f.rotation.y = ang; h.add(f);
    const pts = [new THREE.Vector2(0, 0)]; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector2(rad * Math.pow(1 - u, 0.75) + 0.0003 * (1 - u), u * len)); } pts.push(new THREE.Vector2(0, len));
    const geo = new THREE.LatheGeometry(pts, 12).rotateZ(-Math.PI / 2).scale(1, 0.6, 1);
    const pp = geo.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i); pp.setZ(i, pp.getZ(i) + Math.sign(ang) * 0.005 * Math.pow(Math.max(0, x) / len, 2)); }
    X(geo, LEG, den, f); return f; };
  finger(0.028, 0.006, -0.0045, 0.32, 1.5);
  finger(0.026, 0.0054, 0.0045, -0.3, 1.5);
  // the mitten: dense hair over the palm (both faces) and the base of the fingers
  const ms = []; const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V(0, 1, 0);
  for (let i = 0; i < 950; i++) {
    const u = r(), v = r() * TAU;
    const px = 0.003 + u * (PL * 0.95), rr = Math.sqrt(Math.max(0, 1 - Math.pow((px - PR) / PR, 2)));
    const n = V(0, Math.cos(v) * SY, Math.sin(v) * SZ).normalize();
    const p = V(px, Math.cos(v) * PR * SY * rr, Math.sin(v) * PR * SZ * rr);
    const d = n.clone().add(V(0.25 + r() * 0.5, (r() - 0.5) * 0.7, (r() - 0.5) * 0.7)).normalize();
    q.setFromUnitVectors(up, d); const len = 0.006 + r() * 0.008;
    M.compose(p.clone().add(d.clone().multiplyScalar(len / 2)), q, V(1, len / 0.006, 1)); ms.push(M.clone());
  }
  instanced(new THREE.CylinderGeometry(0.0003, 0.00012, 0.006, 4), ms, ORG, 1.7, h);
  return g;
}

// twisted two-strand rope along a closed path
function rope(parent, path, r = 0.00105, turns = 26, den = 1.05) {
  const c = new THREE.CatmullRomCurve3(path, true); const N = 220; const fr = c.computeFrenetFrames(N, true);
  for (const ph of [0, Math.PI]) {
    const pts = []; for (let i = 0; i < N; i++) { const u = i / N, p = c.getPointAt(u), a = u * turns * TAU + ph; pts.push(p.clone().add(fr.normals[i].clone().multiplyScalar(Math.cos(a) * r * 0.9)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a) * r * 0.9))); }
    tube(pts, r, ORG, den, parent, N * 2, true, 6);
  }
}
function ring(axis, a, b, off, n = 40, bulge = 0) {   // ellipse around the crab: axis 'z' = loop in the xy plane at z = off
  const pts = []; for (let i = 0; i < n; i++) { const t = i / n * TAU; const ca = Math.cos(t), sa = Math.sin(t); const yy = sa > 0 ? sa * b[0] : sa * b[1];
    pts.push(axis === 'z' ? V(ca * a, yy, off + bulge * sa) : V(off, yy, ca * a)); }
  return pts;
}

export function crab(parent, seed, o = {}) {
  const r = mulberry(seed);
  const g = new THREE.Group(); parent.add(g); const prevA = ctx.anchor; ctx.anchor = g;
  X(CARA, SHELL, 1.35, g); X(CARA_IN, SHELL, -1.35, g); X(CARA_IN, ORG, 0.5, g);   // shell over the body
  // eyes
  for (const s of [-1, 1]) {   // eye stalks standing out of the front notch, bulbs on top
    const e = new THREE.Group(); e.position.set(s * 0.0085, 0.008, 0.029); e.rotation.set(-0.75, 0, s * -0.25); g.add(e);
    X(new THREE.CylinderGeometry(0.0016, 0.002, 0.011, 10).translate(0, 0.0055, 0), LEG, 1.4, e);
    X(new THREE.SphereGeometry(0.0036, 14, 10).scale(1, 1.25, 1).translate(0, 0.0128, 0), LEG, 1.7, e);
  }
  X(new THREE.SphereGeometry(0.02, 16, 10).scale(1.1, 0.35, 1).translate(0, -0.011, -0.004), ORG, 0.8, g);   // abdomen flap and mouthparts underneath
  // four pairs of walking legs, folded and swept back against the body (tied)
  const legs = [];
  const atA = [0.36, 0.0, -0.36, -0.72];
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const th = atA[k]; const R = Rf(s > 0 ? th : Math.PI - th) * 0.9;
    const at = V(s * Math.cos(th) * R, -0.006, Math.sin(th) * R);
    const sweep = 0.72 + k * 0.2;                           // legs swept back along the body
    const dims = [0.03 + (k === 3 ? -0.003 : 0), 0.012, 0.022, 0.016, 0.0036];
    const pose = { yaw: s > 0 ? -th + sweep : th - Math.PI - sweep, lift: -0.12 + r() * 0.06, b1: 1.95 + r() * 0.12, b2: 0.45, b3: 0.55 };
    const L = leg(g, at, dims, pose); L.base = pose; L.dims = dims; L.at = at; legs.push(L);
  }
  claw(g, 1, r); claw(g, -1, r);
  // the rope: two bands across, one band front to back, a knot on top
  rope(g, ring('z', 0.043, [0.027, 0.02], 0.009, 44, 0.004), 0.0014, 24, 1.5);
  rope(g, ring('z', 0.043, [0.027, 0.02], -0.016, 44, -0.003), 0.0014, 24, 1.5);
  rope(g, ring('x', 0.05, [0.028, 0.02], 0.0, 44), 0.0014, 28, 1.5);
  X(new THREE.SphereGeometry(0.0042, 12, 8).scale(1.3, 0.8, 1), ORG, 1.3, g).position.set(0.0, 0.028, 0.0);
  tube([V(0.003, 0.031, 0.002), V(0.012, 0.033, 0.01), V(0.02, 0.03, 0.022)], 0.001, ORG, 1.1, g, 12, false, 5);
  tube([V(-0.002, 0.031, -0.002), V(-0.01, 0.034, -0.012), V(-0.016, 0.031, -0.026)], 0.001, ORG, 1.1, g, 12, false, 5);
  ctx.anchor = prevA;
  return { g, legs };
}

// the foam box with six crabs; returns the item, the crabs and a twitch(k, ghostK) control on one leg
export function crabBox() {
  const it = item('crabbox');
  const bw = 0.34, bh = 0.15, bd = 0.25;
  boxShell(bw, bh, bd, 0.006, 0.02, ORG, 0.09, it, { lump: 0.4, seed: 4 }).forEach(m => m.position.set(0, bh / 2, 0));
  for (const z of [-0.05, 0.05]) X(rbox(bw + 0.004, 0.0008, 0.05, 0.0004), ORG, 1.4, it).position.set(0, bh + 0.0004, z);   // packing tape
  X(rbox(0.06, 0.0006, 0.04, 0.0003), ORG, 1.6, it).position.set(0.1, bh + 0.001, 0.08);
  // shredded-paper filler around the crabs: on the flat image it blurs them together, CT can leave it out
  const filler = new THREE.Group(); it.add(filler); { const rf = mulberry(9); for (let i = 0; i < 48; i++) { const m = X(rbox(0.04 + rf() * 0.05, 0.012 + rf() * 0.012, 0.03 + rf() * 0.04, 0.008, 3), ORG, 0.6, filler, { lump: 1, seed: i * 1.7 }); m.position.set((rf() - 0.5) * 0.28, 0.03 + rf() * 0.1, (rf() - 0.5) * 0.2); m.rotation.y = rf() * 3; } }
  // six crabs packed in two layers, so on the flat image they overlap into one mass
  const crabs = []; const r = mulberry(17);
  const slots = [[-0.085, 0.034, -0.045, 0.4], [0.06, 0.034, -0.05, 2.6], [-0.015, 0.034, 0.06, -1.2], [0.005, 0.086, -0.012, 1.7], [-0.095, 0.086, 0.045, -2.4], [0.09, 0.088, 0.05, -1.5]];
  slots.forEach(([x, y, z, ry], i) => {
    const c = crab(it, 100 + i * 7);
    c.g.position.set(x, y, z);
    c.g.rotation.set((r() - 0.5) * 0.14, ry, (r() - 0.5) * 0.14);
    crabs.push(c);
  });
  // the leg that moves: crab 6 (top layer, at the edge), right rear leg; a ghost copy for the CT motion artefact
  const C = crabs[5]; const L = C.legs[7];
  // this one has worked its leg out from under the rope: it rests half-open, away from the body
  L.base = { yaw: L.base.yaw - 0.35, lift: 0.18, b1: 1.15, b2: 0.35, b3: 0.45 }; setPose(L, L.base);
  const ghost = leg(C.g, L.at, L.dims, L.base, 0.5); ghost.root.visible = false;
  function pose(Lx, k) {   // k: 0 rest .. 1 kicked out
    const b = L.base; setPose(Lx, { yaw: b.yaw + 0.3 * k, lift: b.lift + 0.45 * k, b1: b.b1 - 0.85 * k, b2: b.b2 - 0.3 * k, b3: b.b3 - 0.4 * k });
  }
  function twitch(k, kg) { pose(L, k); if (kg == null) { ghost.root.visible = false; } else { ghost.root.visible = true; pose(ghost, kg); } }
  return { it, crabs, twitch, legCrab: C, leg: L, filler };
}
