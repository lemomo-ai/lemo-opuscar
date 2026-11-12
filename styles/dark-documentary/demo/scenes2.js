// Three more spaces for the film, drawn the same way as Parkes: black until a scan passes, then line echoes that slowly fade,
// a cold rim on the subject, one warm accent for the signal.
//   moon  — the Sea of Tranquillity: the lander, its TV camera on the equipment bay, Earth in the black sky (27.6–31.7 s)
//   globe — Earth and the Moon, the three receiving stations and the beams between them (schematic, not to scale) (31.7–37.4 s)
//   room  — the Parkes control room: desk, signal-strength meter, the central column, the small TV monitor (37.4–40.7 s)
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ECHO = 'const vec3 ECHO = vec3(0.70, 0.86, 1.0);';
// every scene has its own scan: a plane moving along D; behind it things exist, ahead of it they do not (yet)
const SCAN = `uniform float S; uniform vec3 D; uniform float BI; uniform float base; uniform vec3 camP; uniform vec3 Lsun; ${ECHO}
  float revealD(vec3 wp){ return S - dot(wp, D); }`;

function lineMat(u, k = 1, col = 'ECHO') {
  return new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN + `varying vec3 wp; void main(){ float d = revealD(wp);
      float a = d < 0. ? 0. : base + 0.9 * exp(-d / 6.) + 1.6 * BI * exp(-d * d / 0.4);
      gl_FragColor = vec4(${col} * a * ${k.toFixed(2)}, 1.); }`,
  });
}
function surfMat(u, { tone = 0.05, rim = 0.5, sun = 0.0, col = 'vec3(1.)' } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide,
    vertexShader: `varying vec3 wp; varying vec3 nrm; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; nrm = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN + `varying vec3 wp; varying vec3 nrm; void main(){
      vec3 n = normalize(nrm); vec3 V = normalize(camP - wp); if (dot(n, V) < 0.) n = -n;
      float d = revealD(wp); float seen = d < 0. ? 0. : 1.;
      float lam = clamp(dot(n, Lsun), 0., 1.), r = pow(1. - clamp(dot(n, V), 0., 1.), 3.);
      vec3 c = ${col} * ${tone.toFixed(3)} * (0.25 + lam * ${(1 + sun * 4).toFixed(2)}) + vec3(0.50, 0.70, 1.0) * r * ${rim.toFixed(2)};
      c += ECHO * (0.35 * exp(-max(d, 0.) / 5.) + 1.0 * BI * exp(-d * d / 0.5)) * 0.3;
      gl_FragColor = vec4(c * seen, 1.); }`,
  });
}
const edges = (mesh, mat, thr = 30) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thr), mat); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale); mesh.parent.add(e); return e; };
const uni = (dir, sun) => ({ S: { value: -1e4 }, D: { value: dir.clone().normalize() }, BI: { value: 0 }, base: { value: 0.18 }, camP: { value: new THREE.Vector3() }, Lsun: { value: sun.clone().normalize() } });

// ---------------------------------------------------------------- the Moon
export function buildMoon(rng) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const SUN = V3(-0.90, 0.24, -0.15).normalize();              // low sun from the left: long shadows to the right, hard relief
  const u = uni(V3(1, 0, 0.15), SUN);
  u.base.value = 0.32;
  // ground: regolith with craters
  const R = rng(1969);
  const craters = Array.from({ length: 26 }, () => ({ x: (R() - 0.5) * 260, z: (R() - 0.5) * 260 - 40, r: 2 + Math.pow(R(), 2) * 22 }));
  craters.push({ x: 18, z: -9, r: 6 }, { x: -9, z: 6, r: 2.4 });
  const hAt = (x, z) => { let h = 0; for (const c of craters) { const d = Math.hypot(x - c.x, z - c.z) / c.r; if (d < 1.6) h += d < 1 ? -0.22 * c.r * (1 - d * d) : 0.08 * c.r * Math.exp(-((d - 1) * (d - 1)) / 0.06); } return h * 0.6; };
  {
    const g = new THREE.PlaneGeometry(420, 420, 260, 260); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, hAt(p.getX(i), p.getZ(i))); g.computeVertexNormals();
    const m = new THREE.ShaderMaterial({
      uniforms: u, extensions: { derivatives: true },
      vertexShader: `varying vec3 wp; varying vec3 nrm; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; nrm = normal; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: SCAN + `varying vec3 wp; varying vec3 nrm;
        float lineAA(float v, float px){ float f = abs(fract(v - .5) - .5); return 1. - smoothstep(0., px, f / max(fwidth(v), 1e-5)); }
        void main(){ vec3 n = normalize(nrm); float d = revealD(wp); float seen = d < 0. ? 0. : 1.;
          float lam = clamp(dot(n, Lsun), 0., 1.);
          vec3 c = vec3(0.56, 0.56, 0.57) * pow(lam, 0.6) + vec3(0.006);
          float grid = (lineAA(wp.x / 4., 0.6) + lineAA(wp.z / 4., 0.6)) * (1. - smoothstep(0.1, 0.5, fwidth(wp.x / 4.) + fwidth(wp.z / 4.)));
          float cont = lineAA(wp.y / 0.4, 0.8) * (1. - smoothstep(0.3, 1.0, fwidth(wp.y / 0.4)));
          c += ECHO * (grid * 0.05 + cont * 0.10) * (0.4 + exp(-max(d, 0.) / 20.));
          float dist = length(wp - camP);
          c += ECHO * 0.55 * BI * exp(-d * d / 0.25) * smoothstep(6., 18., dist);   // the beam line, kept off the lens
          c *= exp(-dist / 260.);
          gl_FragColor = vec4(c * seen, 1.); }`,
    });
    scene.add(new THREE.Mesh(g, m));
  }
  // ---- the lunar module "Eagle" (simplified from its published shape; our own model) ----
  // materials: gold foil with crinkles and glints (descent stage), faceted grey panels (ascent stage), dark windows; flat-shaded,
  // lit by the same low hard sun from the left; every solid part also casts a long shadow on the regolith.
  const LITCOMMON = SCAN + `varying vec3 wp; varying vec3 nrm;
    float hh(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
      return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
  const VS = `varying vec3 wp; varying vec3 nrm; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; nrm = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`;
  const lit = (col, { crinkle = 0, spec = 0.25, shin = 24, flat = true, rim = 0.35 } = {}) => new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, vertexShader: VS,
    fragmentShader: LITCOMMON + `void main(){
      vec3 n = ${flat ? 'normalize(cross(dFdx(wp), dFdy(wp)))' : 'normalize(nrm)'};
      vec3 V = normalize(camP - wp); if (dot(n, V) < 0.) n = -n;
      ${crinkle ? `vec3 q = wp * 7.0; n = normalize(n + ${crinkle.toFixed(2)} * (vec3(n3(q), n3(q + 11.3), n3(q + 23.7)) - 0.5) * 2.0);` : ''}
      float d = revealD(wp); float seen = d < 0. ? 0. : 1.;
      float lam = max(dot(n, Lsun), 0.);
      float sp = pow(max(dot(reflect(-Lsun, n), V), 0.), ${shin.toFixed(1)});
      float r = pow(1. - clamp(dot(n, V), 0., 1.), 3.);
      vec3 c = ${col} * (0.035 + 0.95 * lam) + vec3(1.0, 0.93, 0.80) * sp * ${spec.toFixed(2)} + vec3(0.5, 0.7, 1.0) * r * ${rim.toFixed(2)} * 0.4;
      c += ECHO * 0.25 * BI * exp(-d * d / 0.5);
      gl_FragColor = vec4(c * seen, 1.); }`,
  });
  const GOLD = lit('vec3(0.62, 0.45, 0.17)', { crinkle: 0.45, spec: 0.5, shin: 30 }), BLACKFOIL = lit('vec3(0.10, 0.09, 0.08)', { crinkle: 0.4, spec: 0.5, shin: 30 });
  const PANEL = lit('vec3(0.40, 0.41, 0.43)', { spec: 0.25 }), DARKP = lit('vec3(0.16, 0.16, 0.17)', { spec: 0.2 }), WINDOW = lit('vec3(0.01, 0.012, 0.016)', { spec: 1.2, shin: 80, rim: 0.2 });
  const STRUT = lit('vec3(0.55, 0.52, 0.48)', { spec: 0.4, flat: false }), PAD = lit('vec3(0.50, 0.42, 0.25)', { crinkle: 0.3, spec: 0.5 });
  const lm = new THREE.Group(); scene.add(lm);
  const solids = [];
  const put = (geo, mat, x, y, z, { rx = 0, ry = 0, rz = 0, edge = 0, parent = lm } = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); solids.push(m); if (edge) edges(m, lineMat(u, edge), 28); return m; };
  const cyl = (a, b, r, mat) => { const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); lm.add(m); solids.push(m); return m; };
  // descent stage: an octagonal box wrapped in gold foil, black foil underneath
  put(new THREE.CylinderGeometry(2.15, 2.15, 1.65, 8, 3), GOLD, 0, 2.1, 0, { ry: Math.PI / 8, edge: 0.45 });
  put(new THREE.CylinderGeometry(2.05, 1.7, 0.35, 8, 1), BLACKFOIL, 0, 1.1, 0, { ry: Math.PI / 8 });
  put(new THREE.CylinderGeometry(0.55, 0.85, 0.5, 16, 1, true), DARKP, 0, 0.75, 0);          // descent engine bell
  // four landing legs: primary strut, two secondary struts, a dish-shaped footpad; the ladder and porch on the front (+z) leg
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 2, c = Math.cos(a), sn = Math.sin(a), side = V3(-sn, 0, c);
    const top = V3(c * 2.05, 2.75, sn * 2.05), foot = V3(c * 4.45, 0.32, sn * 4.45), knee = top.clone().lerp(foot, 0.58);
    cyl(top, foot, 0.075, STRUT);
    for (const s of [-1, 1]) cyl(V3(c * 1.95, 1.3, sn * 1.95).addScaledVector(side, s * 0.9), knee, 0.045, STRUT);
    cyl(V3(c * 2.0, 1.25, sn * 2.0), foot.clone().lerp(top, 0.18), 0.05, STRUT);
    const pts = []; for (let k = 0; k <= 8; k++) { const r = 0.48 * k / 8; pts.push(new THREE.Vector2(r, 0.06 + 0.16 * Math.pow(k / 8, 2))); }
    put(new THREE.LatheGeometry(pts, 24), PAD, foot.x, 0.04, foot.z, { edge: 0.6 });
    if (i === 0) {                                     // front leg (+z)
      const rails = [];
      for (const s of [-0.24, 0.24]) rails.push(top.clone().addScaledVector(side, s).add(V3(0, -0.15, 0.08)), knee.clone().addScaledVector(side, s).add(V3(0, 0, 0.08)));
      for (let k = 0; k < 9; k++) { const p = top.clone().lerp(knee, (k + 0.5) / 9).add(V3(0, -0.15 * (1 - (k + 0.5) / 9), 0.08)); rails.push(p.clone().addScaledVector(side, -0.24), p.clone().addScaledVector(side, 0.24)); }
      lm.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rails), lineMat(u, 1.6)));
      for (let k = 0; k < 2; k++) cyl(rails[k * 2], rails[k * 2 + 1], 0.03, STRUT);
      put(new THREE.BoxGeometry(0.9, 0.05, 0.75), PANEL, 0, 2.95, 2.25, { edge: 0.8 });          // porch
    }
  }
  // the equipment bay (MESA) folded down to the left of the ladder, with the TV camera on it
  const mesaLocal = V3(-1.25, 1.55, 2.05);
  put(new THREE.BoxGeometry(1.0, 0.08, 0.6), PANEL, mesaLocal.x, mesaLocal.y - 0.1, mesaLocal.z + 0.1, { rx: -0.35, edge: 0.8 });
  const tvcam = put(new THREE.BoxGeometry(0.34, 0.2, 0.26), DARKP, mesaLocal.x, mesaLocal.y + 0.05, mesaLocal.z + 0.2, { ry: 0.4, edge: 1.4 });
  // ascent stage: an irregular faceted cabin (convex hull), triangular windows, hatch, docking tunnel, aft equipment bay, thruster quads, antennas
  const AP = [[-1.15, 3.0, 1.05], [1.15, 3.0, 1.05], [-1.35, 3.9, 1.3], [1.35, 3.9, 1.3], [-0.95, 4.7, 0.95], [0.95, 4.7, 0.95], [-1.15, 5.25, 0.05], [1.15, 5.25, 0.05],
    [-1.45, 5.0, -1.2], [1.45, 5.0, -1.2], [-1.6, 3.0, -1.35], [1.6, 3.0, -1.35], [-2.05, 4.1, -0.35], [2.05, 4.1, -0.35], [-1.95, 3.05, -0.25], [1.95, 3.05, -0.25], [-1.75, 4.85, -0.55], [1.75, 4.85, -0.55]].map(p => V3(...p));
  put(new ConvexGeometry(AP), PANEL, 0, 0, 0, { edge: 0.7 });
  for (const s of [-1, 1]) {                       // two triangular windows on the upper front facets
    const tri = [V3(s * 1.02, 4.52, 0.98), V3(s * 0.28, 4.62, 1.03), V3(s * 1.12, 4.0, 1.26)];
    const nrm = new THREE.Vector3().crossVectors(tri[1].clone().sub(tri[0]), tri[2].clone().sub(tri[0])).normalize(); if (nrm.z < 0) nrm.negate();
    const g = new THREE.BufferGeometry().setFromPoints(tri.map(p => p.clone().addScaledVector(nrm, 0.03))); g.setIndex([0, 1, 2]); g.computeVertexNormals();
    const w = new THREE.Mesh(g, WINDOW); lm.add(w); edges(w, lineMat(u, 1.6), 1);
  }
  put(new THREE.BoxGeometry(0.85, 0.85, 0.06), DARKP, 0, 3.45, 1.16, { rx: 0.08, edge: 1.0 });   // forward hatch
  put(new THREE.CylinderGeometry(0.46, 0.5, 0.45, 18), PANEL, 0, 5.45, -0.15, { edge: 0.8 });     // docking tunnel
  put(new THREE.BoxGeometry(2.3, 1.05, 0.9), BLACKFOIL, 0, 3.75, -1.95, { edge: 0.6 });          // aft equipment bay
  for (const [x, z] of [[-1.75, 0.95], [1.75, 0.95], [-1.75, -1.05], [1.75, -1.05]]) {           // RCS thruster quads
    put(new THREE.BoxGeometry(0.28, 0.28, 0.28), DARKP, x, 4.55, z, { edge: 0.8 });
    for (const [dx, dy, dz] of [[0, 1, 0], [0, -1, 0], [Math.sign(x), 0, 0], [0, 0, Math.sign(z)]]) { const n = put(new THREE.ConeGeometry(0.07, 0.22, 8, 1, true), DARKP, x + dx * 0.22, 4.55 + dy * 0.22, z + dz * 0.22); n.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(dx, dy, dz)); }
  }
  { // S-band high-gain dish on its boom (pointed at Earth), rendezvous radar dish, VHF rods
    const base = V3(1.35, 5.0, -0.65), tip = V3(1.95, 5.75, -0.95); cyl(base, tip, 0.04, STRUT);
    const pts = []; for (let k = 0; k <= 10; k++) { const r = 0.42 * k / 10; pts.push(new THREE.Vector2(r, r * r * 0.9)); }
    const dish = put(new THREE.LatheGeometry(pts, 28), PANEL, tip.x, tip.y, tip.z, { edge: 1.0 }); dish.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(0.45, 0.62, -0.64).normalize());
    const rr = put(new THREE.LatheGeometry(pts.map(p => p.clone().multiplyScalar(0.7)), 24), PANEL, 0, 5.35, 0.75, { edge: 1.0 }); rr.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(0, 0.5, 0.86).normalize());
    lm.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([V3(-1.4, 5.0, -1.1), V3(-1.75, 6.05, -1.3), V3(1.5, 3.2, -1.4), V3(2.1, 2.55, -1.9)]), lineMat(u, 1.5)));
  }
  lm.rotation.y = -0.5;                                // three-quarter view of the ladder side from the camera
  lm.updateMatrixWorld(true);
  // long shadows: every solid part flattened onto the ground along the sun direction
  { const Ls = SUN, h = 0.03, S = new THREE.Matrix4().set(1, -Ls.x / Ls.y, 0, Ls.x / Ls.y * h, 0, 0, 0, h, 0, -Ls.z / Ls.y, 1, Ls.z / Ls.y * h, 0, 0, 0, 1);
    const shMat = new THREE.MeshBasicMaterial({ color: 0x020202, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false, side: THREE.DoubleSide });
    for (const m of solids) { const sh = new THREE.Mesh(m.geometry, shMat); sh.matrixAutoUpdate = false; sh.matrix.multiplyMatrices(S, m.matrixWorld); sh.renderOrder = 1; scene.add(sh); } }
  const toW = v => v.clone().applyMatrix4(lm.matrixWorld);
  // Earth in the black sky (placed lower than its true height over Tranquillity so it shares the frame with the lander)
  const EARTH_DIR = V3(0.58, 0.40, -0.71).normalize(), ED = 2600, ER = 70;
  const earth = new THREE.Group(); earth.position.copy(EARTH_DIR.clone().multiplyScalar(ED)); scene.add(earth);
  { const segs = [];
    for (let la = -75; la <= 75; la += 15) for (let lo = 0; lo < 360; lo += 6) { const p = (a, b) => V3(Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)).multiplyScalar(ER); const A = la * Math.PI / 180; segs.push(p(A, lo * Math.PI / 180), p(A, (lo + 6) * Math.PI / 180)); }
    for (let lo = 0; lo < 360; lo += 20) for (let la = -90; la < 90; la += 6) { const p = (a, b) => V3(Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)).multiplyScalar(ER); const B = lo * Math.PI / 180; segs.push(p(la * Math.PI / 180, B), p((la + 6) * Math.PI / 180, B)); }
    const m = new THREE.ShaderMaterial({ uniforms: { sun: { value: SUN }, A: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 nn; void main(){ nn = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 sun; uniform float A; varying vec3 nn; void main(){ float l = smoothstep(-0.15, 0.4, dot(nn, sun)); gl_FragColor = vec4(vec3(0.55, 0.75, 1.0) * (0.12 + 0.75 * l) * A, 1.); }` });
    earth.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), m));
    const disc = new THREE.Mesh(new THREE.SphereGeometry(ER * 0.99, 48, 32), new THREE.ShaderMaterial({ uniforms: { sun: { value: SUN } },
      vertexShader: `varying vec3 nn; void main(){ nn = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 sun; varying vec3 nn; void main(){ float l = smoothstep(-0.1, 0.5, dot(nn, sun)); gl_FragColor = vec4(vec3(0.05, 0.09, 0.16) * l + vec3(0.004), 1.); }` }));
    earth.add(disc);
  }
  const camAt = (t, t0, t1) => {
    const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))), e = k * k * (3 - 2 * k);
    return { pos: V3(-11.5 + 2.5 * e, 1.25 + 0.45 * e, 13.5 - 2.5 * e), look: V3(3.0 + 1.0 * e, 3.6 + 0.5 * e, -4), fov: 42 };
  };
  return { scene, u, tvcam, earthPos: earth.position, ER, camAt, lmTag: toW(V3(0, 6.0, -0.2)), mesaPt: toW(mesaLocal.clone().add(V3(0, 0.15, 0.2))) };
}

// ---------------------------------------------------------------- the globe
const toVec = (lat, lon, r = 1) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return V3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)).multiplyScalar(r); };
export const STATIONS = { GDS: [35.43, -116.89], HSK: [-35.58, 148.98], PKS: [-33.0, 148.26] };
export function buildGlobe() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const RE = 100, SUBLUNAR = [-3, -154], SUBSOLAR = [20.5, 136.5];     // 02:54 UTC, 21 July 1969 (approximate, see FACTS.md)
  const moonDir = toVec(...SUBLUNAR), sunDir = toVec(...SUBSOLAR);
  const u = uni(moonDir.clone().negate(), sunDir); u.base.value = 0.25;
  const earth = new THREE.Group(); scene.add(earth);
  { const segs = [];
    for (let la = -75; la <= 75; la += 15) for (let lo = -180; lo < 180; lo += 4) segs.push(toVec(la, lo, RE), toVec(la, lo + 4, RE));
    for (let lo = -180; lo < 180; lo += 15) for (let la = -88; la < 88; la += 4) segs.push(toVec(la, lo, RE), toVec(la + 4, lo, RE));
    const m = new THREE.ShaderMaterial({ uniforms: { ...u, sunD: { value: sunDir } }, transparent: true, depthWrite: true, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 nn; varying vec3 wp; void main(){ nn = normalize(position); vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: SCAN + `uniform vec3 sunD; varying vec3 nn; varying vec3 wp; void main(){ float d = revealD(wp); if (d < 0.) discard;
        float l = smoothstep(-0.2, 0.3, dot(nn, sunD)); float facing = smoothstep(-0.05, 0.25, dot(nn, normalize(camP - wp)));
        gl_FragColor = vec4(ECHO * (0.12 + 0.45 * l) * facing * (1. + 1.5 * BI * exp(-d * d / 30.)), 1.); }` });
    earth.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), m));
    // coarse coastlines (schematic): Australia and the west coast of North America
    const AUS = [[-10.7, 142.5], [-12.5, 136.8], [-12.4, 130.9], [-14.5, 126.5], [-17.9, 122.2], [-20.3, 118.6], [-22.0, 114.1], [-26.0, 113.3], [-31.9, 115.8], [-34.4, 115.1], [-35.0, 117.9], [-33.9, 123.6], [-31.7, 131.0], [-32.0, 133.7], [-34.9, 135.9], [-35.6, 138.1], [-38.1, 141.0], [-38.8, 146.3], [-37.5, 149.9], [-33.9, 151.2], [-28.6, 153.6], [-24.9, 152.3], [-19.3, 146.8], [-16.9, 145.8], [-14.0, 143.6], [-10.7, 142.5]];
    const NAM = [[60, -146], [58.3, -134.4], [54.3, -130.3], [49.3, -123.1], [46.2, -124.0], [42, -124.2], [37.8, -122.5], [34.4, -119.7], [32.7, -117.2], [31.3, -113.5], [22.9, -109.9], [20.6, -105.2], [16.8, -99.9], [15.8, -93.0], [14.5, -91.0]];
    const NZ = [[-34.4, 172.7], [-37.5, 175.9], [-41.3, 174.8], [-46.6, 168.3], [-43.6, 172.7], [-41.3, 174.8]];
    const cl = []; for (const poly of [AUS, NAM, NZ]) for (let i = 0; i + 1 < poly.length; i++) { const a = poly[i], b = poly[i + 1]; for (let k = 0; k < 6; k++) cl.push(toVec(a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6, RE * 1.002), toVec(a[0] + (b[0] - a[0]) * (k + 1) / 6, a[1] + (b[1] - a[1]) * (k + 1) / 6, RE * 1.002)); }
    const cm = new THREE.ShaderMaterial({ uniforms: { ...u }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: SCAN + `varying vec3 wp; void main(){ float d = revealD(wp); if (d < 0.) discard; float facing = smoothstep(-0.02, 0.2, dot(normalize(wp), normalize(camP - wp))); gl_FragColor = vec4(ECHO * 0.75 * facing, 1.); }` });
    earth.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cl), cm));
    const occ = new THREE.Mesh(new THREE.SphereGeometry(RE * 0.995, 64, 48), new THREE.MeshBasicMaterial({ color: 0x020305 })); earth.add(occ);   // hides the far side
  }
  const MOON_D = 400, MOON_R = 27;
  const moonPos = moonDir.clone().multiplyScalar(MOON_D);
  { const segs = []; for (let la = -60; la <= 60; la += 30) for (let lo = 0; lo < 360; lo += 8) segs.push(toVec(la, lo, MOON_R).add(moonPos), toVec(la, lo + 8, MOON_R).add(moonPos));
    for (let lo = 0; lo < 360; lo += 30) for (let la = -84; la < 84; la += 8) segs.push(toVec(la, lo, MOON_R).add(moonPos), toVec(la + 8, lo, MOON_R).add(moonPos));
    const m = new THREE.ShaderMaterial({ uniforms: { sunD: { value: sunDir }, c: { value: moonPos } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 nn; uniform vec3 c; void main(){ vec4 w = modelMatrix*vec4(position,1.); nn = normalize(w.xyz - c); gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 sunD; varying vec3 nn; void main(){ float l = smoothstep(-0.2, 0.4, dot(nn, sunD)); gl_FragColor = vec4(vec3(0.95, 0.80, 0.60) * (0.10 + 0.5 * l), 1.); }` });
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), m));
    const occ = new THREE.Mesh(new THREE.SphereGeometry(MOON_R * 0.99, 32, 24), new THREE.MeshBasicMaterial({ color: 0x030303 })); occ.position.copy(moonPos); scene.add(occ);
  }
  const st = Object.fromEntries(Object.entries(STATIONS).map(([k, [la, lo]]) => [k, toVec(la, lo, RE * 1.004)]));
  // camera: off to the side of the Earth–Moon line, a slow drift around the Earth
  const side = new THREE.Vector3().crossVectors(moonDir, V3(0, 1, 0)).normalize();
  const camAt = (t, t0, t1) => {
    const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const mid = moonDir.clone().multiplyScalar(200);
    const dir = moonDir.clone().multiplyScalar(0.45).add(side.clone().multiplyScalar(-0.85)).add(V3(0, -0.18, 0)).normalize().applyAxisAngle(V3(0, 1, 0), -0.08 + 0.16 * k);
    const pos = mid.clone().addScaledVector(dir, 640 - 50 * k);
    const look = mid.clone().add(V3(0, -45, 0));
    return { pos, look, fov: 44 };
  };
  return { scene, u, st, moonPos, RE, camAt, moonDir };
}

// ---------------------------------------------------------------- the control room
export function buildRoom(rng) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const u = uni(V3(1, 0, 0.2), V3(-0.3, 0.6, 0.75)); u.base.value = 0.16;
  const L = lineMat(u, 0.9), Lb = lineMat(u, 1.4), dark = surfMat(u, { tone: 0.06, rim: 0.35 }), panel = surfMat(u, { tone: 0.10, rim: 0.4 });
  const add = (geo, mat, x, y, z, lk = L, ry = 0, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m); edges(m, lk); return m; };
  // floor grid and the walls' edges
  { const seg = []; for (let x = -6; x <= 6; x += 0.6) seg.push(V3(x, 0, -5), V3(x, 0, 3)); for (let z = -5; z <= 3; z += 0.6) seg.push(V3(-6, 0, z), V3(6, 0, z));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), lineMat(u, 0.35)));
    const w = [V3(-6, 0, -5), V3(6, 0, -5), V3(-6, 3.2, -5), V3(6, 3.2, -5), V3(-6, 0, -5), V3(-6, 3.2, -5), V3(6, 0, -5), V3(6, 3.2, -5), V3(6, 0, -5), V3(6, 0, 3), V3(6, 3.2, -5), V3(6, 3.2, 3), V3(-6, 0, -5), V3(-6, 0, 3), V3(-6, 3.2, -5), V3(-6, 3.2, 3)];
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(w), L)); }
  // the window on the back wall: the storm outside (grey, rain), mullions
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.5), new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, S: u.S, D: u.D },
    vertexShader: `varying vec2 vUv; varying vec3 wp; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); wp = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float time; uniform float S; uniform vec3 D; varying vec2 vUv; varying vec3 wp;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ if (S - dot(wp, D) < 0.) { gl_FragColor = vec4(0., 0., 0., 1.); return; }
        vec3 c = mix(vec3(0.10, 0.11, 0.125), vec3(0.20, 0.215, 0.235), vUv.y);
        vec2 q = vec2(vUv.x * 60. + vUv.y * 22., vUv.y * 6. + time * 9.); vec2 cell = floor(q); float r = h(cell);
        float streak = step(0.82, r) * smoothstep(0.0, 0.08, fract(q.y)) * (1. - smoothstep(0.3, 0.9, fract(q.y))) * (1. - smoothstep(0.02, 0.06, abs(fract(q.x) - 0.5)));
        c += vec3(0.25, 0.28, 0.32) * streak;
        gl_FragColor = vec4(c, 1.); }` }));
  win.position.set(-1.2, 1.95, -4.98); scene.add(win);
  { const m = []; for (let i = 0; i <= 4; i++) { const x = -4.3 + i * 1.55; m.push(V3(x, 1.2, -4.95), V3(x, 2.7, -4.95)); } m.push(V3(-4.3, 1.2, -4.95), V3(1.9, 1.2, -4.95), V3(-4.3, 2.7, -4.95), V3(1.9, 2.7, -4.95)); scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(m), Lb)); }
  // the control desk with its sloping panel, rows of switches, and the signal-strength meter on top
  add(new THREE.BoxGeometry(5.0, 0.75, 0.9), dark, -1.2, 0.375, -3.4);
  add(new THREE.BoxGeometry(5.0, 0.7, 0.12), panel, -1.2, 1.05, -3.62, L, 0, -0.45);
  { const sw = []; for (let r = 0; r < 3; r++) for (let i = 0; i < 26; i++) { const x = -3.5 + i * 0.18, y = 0.86 + r * 0.17, z = -3.52 - r * 0.075; sw.push(V3(x, y, z), V3(x + 0.07, y, z)); }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sw), Lb)); }
  const meter = add(new THREE.BoxGeometry(0.42, 0.32, 0.2), panel, -0.7, 1.58, -3.75, Lb);
  // a chair at the desk
  add(new THREE.BoxGeometry(0.5, 0.08, 0.5), dark, -0.9, 0.48, -2.5); add(new THREE.BoxGeometry(0.5, 0.6, 0.08), dark, -0.9, 0.82, -2.22);
  { const lg = []; for (const [x, z] of [[-1.1, -2.7], [-0.7, -2.7], [-1.1, -2.3], [-0.7, -2.3]]) lg.push(V3(x, 0, z), V3(x, 0.44, z)); scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lg), L)); }
  // the central support column (it blocked the driver's view of the TV)
  add(new THREE.CylinderGeometry(0.42, 0.42, 3.2, 20), dark, 1.6, 1.6, -2.4, L);
  // the 10-inch slow-scan TV monitor at the far end of the room
  const monG = new THREE.Group(); monG.position.set(4.7, 1.35, -3.3); monG.rotation.y = -0.55; scene.add(monG);
  { const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.4), panel); monG.add(body); edges(body, Lb);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.16, 0.5), dark); stand.position.y = -0.77; monG.add(stand); edges(stand, L); }
  const screenCorners = [V3(-0.17, 0.13, 0.201), V3(0.17, 0.13, 0.201), V3(0.17, -0.13, 0.201), V3(-0.17, -0.13, 0.201)];
  const camAt = (t, t0, tMove, t1) => {
    // hold on the desk and the meter, then (after the needle jumps) a fast track past the column to the monitor
    const k = Math.min(1, Math.max(0, (t - tMove) / (t1 - tMove))), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const h = Math.min(1, Math.max(0, (t - t0) / (tMove - t0)));
    monG.updateMatrixWorld(true);
    const monC = V3(0, 0, 0.2).applyMatrix4(monG.matrixWorld), monN = V3(0, 0, 1).transformDirection(monG.matrixWorld);
    const p0 = V3(-3.4 + 0.5 * h, 1.7, 0.8 - 0.4 * h), l0 = V3(-0.5 + 0.2 * h, 1.3, -3.7);
    const p1 = monC.clone().addScaledVector(monN, 0.62), l1 = monC;
    return { pos: p0.lerp(p1, e), look: l0.lerp(l1, e), fov: 46 - 6 * e };
  };
  return { scene, u, meter, monG, screenCorners, win, camAt };
}
