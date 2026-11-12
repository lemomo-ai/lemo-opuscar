// Color-Coded Mechanism (分色机械图解) style frames: an anatomy-plate watch movement.
// One colour per subsystem (power, gear train, regulator), everything else a light neutral, one accent for the part being explained.
// Shading: a soft two-tone cel ramp (no reflections, no cast shadows); outlines: depth + normal edges in a darker shade of each part's own colour.
// ?f=1 overview + colour key · ?f=2 exploded by system · ?f=3 parameter demo (?s= wind 0..1)
import * as THREE from 'three';
import { involute, clubWheel, windows, circle, hull, slab, spiralStrip } from './gears.js';
import { TRAIN, RATIO, solve } from './physics.js';
import { makeOutline } from './outline.js';
import { overlay } from './overlay.js';

THREE.ColorManagement.enabled = false;                 // colours are written exactly as their hex values
const QS = new URLSearchParams(location.search);
const FRAME = +(QS.get('f') || 1);
const SLIDER = parseFloat(QS.get('s') ?? '0.72');
const TOP = QS.has('top');
const W = 1920, H = 1080, PR = 2, TAU = Math.PI * 2;
const deg = d => d * Math.PI / 180;

export const PAL = {
  paper: '#F3F0EA', neutral: '#DDD8CF', ink: '#25282D', grey: '#7A756D',
  power: '#E6B94F', trans: '#79B09F', reg: '#8A97D4', accent: '#E8472A',
};

// ───────────────────────── renderer ─────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(W, H);
renderer.setClearColor(new THREE.Color(PAL.paper), 1);
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, W / H, 20, 400);

// ───────────────────────── material: soft cel ─────────────────────────
const LIGHT = new THREE.Vector3(-0.55, 1.0, 0.45).normalize();     // world direction toward the light: upper left, a little in front
const lightView = new THREE.Vector3();
const celVS = `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const celFS = `uniform vec3 col; uniform vec3 Ld; varying vec3 vN;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float d = dot(n, Ld);
    float lit = smoothstep(0.02, 0.30, d);                       // soft cel step: lit / shade
    float deep = smoothstep(-0.55, -0.05, d);                    // a third, darker tone for faces turned right away
    vec3 shade = col * vec3(.80, .80, .86) * mix(.90, 1., deep);  // shade leans slightly cool
    vec3 c = mix(shade, col, lit);
    c = mix(c, min(col * 1.04 + .015, vec3(1.)), smoothstep(.85, .97, d) * .6);   // a whisper of extra light on faces square to the lamp
    gl_FragColor = vec4(c, 1.);
  }`;
const mats = new Map();
function cel(hex) {
  if (!mats.has(hex)) mats.set(hex, new THREE.ShaderMaterial({ uniforms: { col: { value: new THREE.Color(hex) }, Ld: { value: lightView } }, vertexShader: celVS, fragmentShader: celFS, side: THREE.DoubleSide }));
  return mats.get(hex);
}
const flat = hex => new THREE.MeshBasicMaterial({ color: hex });

// ───────────────────────── part registry ─────────────────────────
// sys: frame | power | trans | reg      id: a name for the accent / labels
const root = new THREE.Group(); scene.add(root);
const parts = [];
function add(geo, sys, y = 0, xz = [0, 0], rotY = 0, id = '') {
  const m = new THREE.Mesh(geo, cel(PAL.neutral)); m.position.set(xz[0], y, xz[1]); m.rotation.y = rotY;
  m.userData = { sys, id }; root.add(m); parts.push(m); return m;
}
const P2 = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const D2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const A2 = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const W2S = pts => pts.map(([x, z]) => [x, -z]);                  // world (x, z) -> shape (x, y)
const cyl = (r, h, n = 64) => { const g = new THREE.CylinderGeometry(r, r, h, n); g.translate(0, h / 2, 0); return g; };
const disc = (ro, ri, h) => slab(circle(ro, 160), ri ? [circle(ri, 160)] : [], h, 0);
const capsule = (a, b, r) => W2S(hull([[...a, r], [...b, r]], 40));

// ───────────────────────── layout: true centre distances ─────────────────────────
const MOD = { bc: .24, ct: .18, tf: .16, fe: .13 };
const ctr = (m, z1, z2) => m * (z1 + z2) / 2;
const B = [-15.5, 0.6];
const C = P2(B, ctr(MOD.bc, TRAIN.barrel, TRAIN.centerPinion), deg(-25));
const T = P2(C, ctr(MOD.ct, TRAIN.center, TRAIN.thirdPinion), deg(20));
const F = P2(T, ctr(MOD.tf, TRAIN.third, TRAIN.fourthPinion), deg(50));
const E = P2(F, ctr(MOD.fe, TRAIN.fourth, TRAIN.escapePinion), deg(80));
const ESC_R = 2.45, ESC_ROOT = 1.85, SPAN = deg(30);              // pallets span 2.5 pitches of a 15-tooth wheel
const mu = deg(20);
const dEP = ESC_R / Math.cos(SPAN);
const PIV = P2(E, dEP, mu);
const BAL = P2(PIV, 3.9, mu);
const L = { lo: 1.0, hi: 2.45, th: .36 };

// ───────────────────────── main plate and frame ─────────────────────────
const plateOutline = hull([[...B, 9.6], [...C, 4.2], [...T, 5.6], [...F, 4.6], [...E, 3.6], [...BAL, 6.0]], 96);
add(slab(W2S(plateOutline), [], 1.3, 0), 'frame', -1.3, [0, 0], 0, 'plate');

// ───────────────────────── gear train ─────────────────────────
function meshPhase(cA, zA, wA, cB, zB) {     // phase of the driven pinion so its gap faces the driver's tooth
  const lam = A2(cA, cB), p = TAU / zA;
  let d = ((lam - wA) % p + p) % p; if (d > p / 2) d -= p;
  return lam + Math.PI - d * zA / zB + Math.PI / zB;
}
const geoCache = {};
function wheel(z, m, at, y, phase, sys, id, o = {}) {
  const g = involute(z, m, { steps: 5 });
  const holes = o.spokes ? windows(o.spokes, o.hub ?? 1, g.rf - (o.rim ?? .55), o.sw ?? .26, o.sp ?? .3) : [];
  const mesh = add(slab(g.pts, holes, o.h ?? L.th, 0), sys, y, at, -phase, id);
  mesh.userData.spin = { at, z };
  return mesh;
}
const pinion = (z, m, at, y0, y1, phase, sys, id) => wheel(z, m, at, y0, phase, sys, id, { h: y1 - y0 });
const arbor = (at, y0, y1, sys, r = .28) => add(cyl(r, y1 - y0, 32), sys, y0, at);

// barrel: open drum, teeth on its upper rim, mainspring inside
const gB = involute(TRAIN.barrel, MOD.bc, { steps: 5 });
const wB = deg(4);
const rWall = gB.rf - .5;
add(slab(gB.pts, [circle(rWall, 200)], .42, 0), 'power', 1.55, B, -wB, 'barrel');
add(disc(gB.rf - .05, rWall, 1.3), 'power', .3, B, 0, 'barrel');
add(disc(rWall + .02, 0, .22), 'power', .3, B, 0, 'barrel');
const rHub = 1.55;
add(cyl(rHub, 1.9), 'power', .3, B, 0, 'arbor');
add(cyl(rHub * .62, .5), 'power', 2.2, B, 0, 'arbor');
{ // mainspring: wound coils pack round the arbor, the rest lie against the wall, one coil crosses the gap
  const nC = 9, msT = .17, msP = .27, rIn = rHub + .14, rOut = rWall - .14;
  const k = SLIDER * nC;
  const rOf = th => {
    const Tn = th / TAU;
    if (Tn < k) return rIn + Tn * msP;
    const r0 = rIn + k * msP, rw0 = rOut - (nC - k - 1) * msP;
    if (Tn < k + 1) { const u = Tn - k, s = u * u * (3 - 2 * u); return r0 + (rw0 - r0) * s; }
    return rw0 + (Tn - k - 1) * msP;
  };
  add(spiralStrip(rOf, nC, msT, 1.05, 120), 'power', .55, B, deg(30), 'spring');
}

// centre wheel: 8-leaf pinion on the barrel teeth, wheel above the barrel
const wCp = meshPhase(B, TRAIN.barrel, wB, C, TRAIN.centerPinion);
pinion(TRAIN.centerPinion, MOD.bc, C, 1.45, 2.5, wCp, 'trans', 'center');
const wC = deg(3);
wheel(TRAIN.center, MOD.ct, C, L.hi, wC, 'trans', 'center', { spokes: 4, hub: 1.0, rim: .6, sw: .32 });
arbor(C, 0, 3.15, 'trans');
// third wheel (low), pinion up to the centre wheel
const wTp = meshPhase(C, TRAIN.center, wC, T, TRAIN.thirdPinion);
pinion(TRAIN.thirdPinion, MOD.ct, T, L.lo, L.hi + .5, wTp, 'trans', 'third');
const wT = deg(9);
wheel(TRAIN.third, MOD.tf, T, L.lo, wT, 'trans', 'third', { spokes: 4, hub: .9, rim: .55, sw: .3, sp: .9 });
arbor(T, 0, 3.15, 'trans');
// fourth (seconds) wheel (high), pinion down to the third wheel
const wFp = meshPhase(T, TRAIN.third, wT, F, TRAIN.fourthPinion);
pinion(TRAIN.fourthPinion, MOD.tf, F, L.lo - .05, L.hi + .1, wFp, 'trans', 'fourth');
const wF = deg(14);
wheel(TRAIN.fourth, MOD.fe, F, L.hi, wF, 'trans', 'fourth', { spokes: 4, hub: .8, rim: .5, sw: .26, sp: .2 });
arbor(F, 0, 3.15, 'trans');
// escape pinion up to the fourth wheel, escape wheel low
const wEp = meshPhase(F, TRAIN.fourth, wF, E, TRAIN.escapePinion);
pinion(TRAIN.escapePinion, MOD.fe, E, L.lo, L.hi + .5, wEp, 'reg', 'escape');
const lamEP = A2(E, PIV), entryA = lamEP + SPAN, exitA = lamEP - SPAN;
{
  const g = slab(clubWheel(TRAIN.escape, ESC_R, ESC_ROOT), windows(5, .6, ESC_ROOT - .38, .18, .2), L.th, 0);
  add(g, 'reg', L.lo, E, -(entryA - deg(3)), 'escape');
}
arbor(E, 0, 2.95, 'reg', .24);

// ───────────────────────── pallet fork ─────────────────────────
{
  const yF = L.lo + .03, hF = .3;
  const s1 = P2(E, ESC_R + .35, entryA), s2 = P2(E, ESC_R + .35, exitA);
  const toBal = A2(PIV, BAL), hornBase = P2(PIV, D2(PIV, BAL) - 1.1, toBal);
  add(slab(capsule(PIV, s1, .26), [], hF, 0), 'reg', yF, [0, 0], 0, 'pallet');
  add(slab(capsule(PIV, s2, .26), [], hF, 0), 'reg', yF, [0, 0], 0, 'pallet');
  add(slab(capsule(PIV, hornBase, .22), [], hF, 0), 'reg', yF, [0, 0], 0, 'pallet');
  const nx = Math.cos(toBal + Math.PI / 2), nz = Math.sin(toBal + Math.PI / 2);
  for (const sgn of [-1, 1]) {
    const h0 = [hornBase[0] + sgn * .3 * nx, hornBase[1] + sgn * .3 * nz];
    add(slab(capsule(h0, P2(h0, .7, toBal + sgn * deg(12)), .14), [], hF, 0), 'reg', yF, [0, 0], 0, 'pallet');
  }
  add(slab(W2S(circle(.5, 48, ...PIV)), [], hF + .04, 0), 'reg', yF, [0, 0], 0, 'pallet');
  for (const [a, lock] of [[entryA, .22], [exitA, -.04]]) {     // pallet stones, radial to the escape wheel
    const g = new THREE.BoxGeometry(.8, .5, .26); g.translate(0, .25, 0);
    add(g, 'reg', L.lo - .06, P2(E, ESC_R + .3 - lock, a), -a, 'pallet');
  }
  arbor(PIV, 0, 2.0, 'reg', .2);
}

// ───────────────────────── balance and hairspring ─────────────────────────
const yBal = 3.25, rimO = 4.45, rimI = 3.95;
{
  add(slab(circle(rimO, 220), windows(3, .8, rimI, .24, deg(18)), .48, 0), 'reg', yBal, BAL, 0, 'balance');
  add(cyl(.75, .6), 'reg', yBal - .08, BAL, 0, 'balance');
  add(cyl(.17, 4.6), 'reg', .3, BAL, 0, 'balance');
  add(cyl(.7, .2), 'reg', L.lo + .05, BAL, 0, 'balance');              // roller
  add(cyl(.11, .4, 16), 'reg', L.lo - .1, P2(BAL, .5, A2(BAL, PIV)), 0, 'balance');   // impulse pin
  const nH = 6, r0 = 1.0, pitch = .38;
  add(spiralStrip(th => r0 + th / TAU * pitch, nH, .13, .16, 110), 'reg', yBal + .7, BAL, deg(80), 'hair');
}

// ───────────────────────── bridges (frame) ─────────────────────────
const hBr = .5;
const cockFoot = P2(BAL, 5.7, deg(-60));
const escFoot = P2(E, 3.2, deg(165));
const bridges = [];
if (FRAME !== 3) {
  // balance cock on its own pillar
  bridges.push(add(slab(capsule(BAL, cockFoot, 1.0), [], .55, 0), 'frame', yBal + 1.25, [0, 0], 0, 'bridge'));
  bridges.push(add(slab(W2S(circle(1.55, 64, ...cockFoot)), [], .5501, 0), 'frame', yBal + 1.25, [0, 0], 0, 'bridge'));
  bridges.push(add(cyl(1.05, .14), 'frame', yBal + 1.8, BAL, 0, 'bridge'));
  add(cyl(1.25, yBal + 1.25), 'frame', 0, cockFoot, 0, 'pillar');
  // escapement bridge over the escape wheel and the pallet arbor
  bridges.push(add(slab(capsule(escFoot, E, .75), [], .4, 0), 'frame', 2.95, [0, 0], 0, 'bridge'));
  bridges.push(add(slab(capsule(E, PIV, .6), [], .4001, 0), 'frame', 2.95, [0, 0], 0, 'bridge'));
  add(cyl(.85, 2.95), 'frame', 0, escFoot, 0, 'pillar');
  // barrel bridge: a crescent that leaves the spring in view
  const bb = hull([[...P2(B, 8.2, deg(-160)), 1.4], [...P2(B, 7.0, deg(-105)), 1.1]], 48);
  bridges.push(add(slab(W2S(bb), [], hBr, 0), 'frame', 2.45, [0, 0], 0, 'bridge'));
  add(cyl(1.0, 2.45), 'frame', 0, P2(B, 7.75, deg(-132)), 0, 'pillar');
  for (const [p, y] of [[cockFoot, yBal + 1.8], [escFoot, 3.35], [P2(B, 7.75, deg(-132)), 2.95]]) bridges.push(add(cyl(.42, .12), 'frame', y, p, 0, 'bridge'));
}

// ───────────────────────── per-frame colouring and explode ─────────────────────────
const SYS = { frame: PAL.neutral, power: PAL.power, trans: PAL.trans, reg: PAL.reg };
const ACCENT = { 1: '', 2: 'escape', 3: 'spring' }[FRAME];
const FOCUS = FRAME === 3 ? new Set(['spring', 'balance', 'hair']) : null;     // frame 3: only the cause and the effect keep colour
for (const m of parts) {
  const { sys, id } = m.userData;
  let hex = SYS[sys];
  if (FOCUS && !FOCUS.has(id)) hex = PAL.neutral;
  if (FOCUS && id === 'barrel') hex = '#EBD9AE';                                  // the drum stays a pale tint of its system
  if (ACCENT && id === ACCENT) hex = PAL.accent;
  if (sys === 'frame' && id === 'plate') hex = FRAME === 3 ? '#E6E1D8' : PAL.neutral;
  m.material = cel(hex);
}
export const LAYER = { frame: 0, power: 7.5, trans: 14, reg: 20.5, bridge: 27 };
if (FRAME === 2) for (const m of parts) {
  const k = m.userData.id === 'bridge' ? 'bridge' : m.userData.sys;
  m.position.y += LAYER[k] || 0;
}

// dashed axes through every arbor (exploded frame): thin ink dashes, depth-tested so parts hide them
const AXES = [B, C, T, F, E, PIV, BAL];
if (FRAME === 2) {
  const ink = flat(PAL.ink);
  for (const p of AXES) {
    for (let y = -.5; y < LAYER.bridge + 4; y += .9) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .45, 8), ink); d.position.set(p[0], y, p[1]); d.layers.set(1); scene.add(d);
    }
  }
}

// soft contact shadow: the plate outline, blurred (colour pass only)
{
  const xs = plateOutline.map(p => p[0]), zs = plateOutline.map(p => p[1]);
  const x0 = Math.min(...xs) - 8, x1 = Math.max(...xs) + 8, z0 = Math.min(...zs) - 8, z1 = Math.max(...zs) + 8, S = 20;
  const c = document.createElement('canvas'); c.width = (x1 - x0) * S; c.height = (z1 - z0) * S; const x = c.getContext('2d');
  x.filter = `blur(${1.6 * S}px)`; x.fillStyle = 'rgba(70,60,45,.20)';
  x.beginPath(); plateOutline.forEach(([px, pz], i) => x[i ? 'lineTo' : 'moveTo']((px - x0 + .4) * S, (pz - z0 + .9) * S)); x.closePath(); x.fill();
  const s = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.position.set((x0 + x1) / 2, -1.9, (z0 + z1) / 2); s.layers.set(1); scene.add(s);
}

// ───────────────────────── camera ─────────────────────────
const box = new THREE.Box3().setFromObject(root);
const mid = box.getCenter(new THREE.Vector3());
const CAM = {
  1: { el: 34, az: -16, d: 112, ox: -150, oy: 30, tgt: [mid.x, 0, mid.z] },
  2: { el: 30, az: -14, d: 150, ox: 40, oy: 20, tgt: [mid.x, LAYER.trans, mid.z] },
  3: { el: 60, az: -6, d: 122, ox: 200, oy: 40, tgt: [mid.x, 1.5, mid.z] },
}[FRAME];
for (const k of ['el', 'az', 'd', 'ox', 'oy']) if (QS.has(k)) CAM[k] = +QS.get(k);
const TGT = new THREE.Vector3(...CAM.tgt);
if (TOP) { camera.position.set(mid.x, 160, mid.z + .001); camera.lookAt(mid.x, 0, mid.z); }
else {
  const el = deg(CAM.el), az = deg(CAM.az);
  camera.position.set(TGT.x + CAM.d * Math.cos(el) * Math.sin(az), TGT.y + CAM.d * Math.sin(el), TGT.z + CAM.d * Math.cos(el) * Math.cos(az));
  camera.lookAt(TGT);
}
camera.setViewOffset(W, H, CAM.ox, CAM.oy, W, H);
camera.updateProjectionMatrix(); camera.updateMatrixWorld();
lightView.copy(LIGHT).transformDirection(camera.matrixWorldInverse);

const post = makeOutline(renderer, scene, camera, W * PR, H * PR, PAL);

// ───────────────────────── render ─────────────────────────
const scr = (xz, y) => { const v = new THREE.Vector3(xz[0], y, xz[1]).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
const GEO = { B, C, T, F, E, PIV, BAL, rWall, rimO, yBal, gB, L, LAYER, cockFoot, AXES, ESC_R, mid, rHub, plateOutline };
let drawn = false;
window.render = () => {
  post.render();
  if (!drawn && !TOP && !QS.has('noui')) { overlay(FRAME, { scr, PAL, GEO, PHYS: solve(SLIDER), solve, SLIDER, TRAIN, RATIO, P2, deg }); drawn = true; }
};
window.DUR = 1;
console.log('layout', JSON.stringify({ B, C, T, F, E, PIV, BAL,
  check: { TB: D2(T, B), FC: D2(F, C), ET: D2(E, T), needTB: gB.ra + 4.8 + .3, needFC: 5.76 + .18 + 3.9 + .13 + .3, needET: 4.8 + .16 + ESC_R + .3, balF: D2(BAL, F) } }));
document.fonts.ready.then(() => { window.READY = true; });
