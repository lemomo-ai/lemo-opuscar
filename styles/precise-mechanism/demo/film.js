// Color-Coded Mechanism (分色机械图解) · the full film 《三套系统走时》 Three systems keep the time (52 s, one timeline: timeline.js).
// Same movement, palette, cel shading and outlines as the style frames (main.js), now a story:
//   a pocket watch ticks → its dial is cut open → the three systems are dyed in the order energy flows → the camera follows the
//   force through the gears → 4,800× → the systems are exploded, the free train races, the escapement drops back in and catches it
//   → the tick, slowed to 1/40 → pull out to the whole watch.
// Truth in motion: every wheel turns by its tooth ratio from the escape wheel (half a tooth per beat, 18 000 beats/h); the hands are
// driven by the same watch time; speed changes are a smooth speed curve whose integral is the watch's time.
// ?from=a&to=b renders that slice (DUR = b − a).
import * as THREE from 'three';
import { involute, clubWheel, windows, circle, hull, slab, spiralStrip } from './gears.js';
import { TRAIN, solve } from './physics.js';
import { makeOutline } from './film-outline.js';
import { makeOverlay } from './film-overlay.js';
import { FULL, SHOTS, VO, SPEED, TICK_ANCHOR, CUE, DYE, LAYER, LIFT_ORDER } from './timeline.js';

THREE.ColorManagement.enabled = false;
const QS = new URLSearchParams(location.search);
const FROM = parseFloat(QS.get('from') ?? '0'), TO = parseFloat(QS.get('to') ?? String(FULL));
const W = 1920, H = 1080, PR = 2, TAU = Math.PI * 2;
const deg = d => d * Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = u => u * u * (3 - 2 * u);
const eo = u => 1 - Math.pow(1 - u, 3);
const ei = u => u * u * u;

export const PAL = {
  paper: '#F3F0EA', neutral: '#DDD8CF', ink: '#25282D', grey: '#7A756D',
  power: '#E6B94F', trans: '#79B09F', reg: '#8A97D4', accent: '#E8472A',
  dial: '#FAF8F3', floor: '#E7E2D9',
};
const SPEC_S = 0.72;
const PHYS = solve(SPEC_S);

// ───────────────────────── renderer ─────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(W, H);
renderer.setClearColor(new THREE.Color(PAL.paper), 1);
renderer.localClippingEnabled = true;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, W / H, 1, 600);

// ───────────────────────── material: soft cel + dye front + section hatching ─────────────────────────
const LIGHT = new THREE.Vector3(-0.55, 1.0, 0.45).normalize();
const lightView = { value: new THREE.Vector3() };
const VS = `
  #include <clipping_planes_pars_vertex>
  varying vec3 vN; varying vec3 vW;
  void main(){
    vN = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }`;
const FS = `
  #include <clipping_planes_pars_fragment>
  uniform vec3 colA, colB, Ld, O; uniform float R, cut;
  uniform vec4 P1, P2;            // the two cut planes (normal, constant) in world space
  uniform vec3 hatchU;            // the barrel axis (world x, z)
  varying vec3 vN; varying vec3 vW;
  vec3 cel(vec3 col, float d){
    float lit = smoothstep(0.02, 0.30, d);
    float deep = smoothstep(-0.55, -0.05, d);
    vec3 shade = col * vec3(.80, .80, .86) * mix(.90, 1., deep);
    vec3 c = mix(shade, col, lit);
    return mix(c, min(col * 1.04 + .015, vec3(1.)), smoothstep(.85, .97, d) * .6);
  }
  void main(){
    #include <clipping_planes_fragment>
    float dd = distance(vW, O);
    float k = 1. - smoothstep(R - .05, R + .05, dd);                  // inside the front: the system colour
    float rim = smoothstep(R - .55, R - .04, dd) * k;                 // a pale wet edge just behind the front
    vec3 col = mix(colA, colB, k);
    col = mix(col, min(colB * 1.10 + .10, vec3(1.)), rim * .55);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) {
      if (cut > .5) {
        // section cap: find where the view ray meets the cut plane, hatch at 45° in that plane (world units, so it never swims)
        vec3 rd = normalize(vW - cameraPosition);
        float best = 1e9; vec3 hp = vW;
        for (int i = 0; i < 2; i++) {
          vec4 P = i == 0 ? P1 : P2; vec4 Q = i == 0 ? P2 : P1;
          float dn = dot(P.xyz, rd); if (abs(dn) < 1e-4) continue;
          float s = -(dot(P.xyz, cameraPosition) + P.w) / dn;
          vec3 p = cameraPosition + rd * s;
          if (s > 0. && dot(Q.xyz, p) + Q.w > -1e-3 && s < best) { best = s; hp = p; }
        }
        float u = length(hp.xz - hatchU.xz) + hp.y;           // both planes contain the barrel axis: radius + height
        float f = abs(fract(u / .21) - .5);
        float line = 1. - smoothstep(.13, .21, f);
        vec3 base = mix(col, vec3(1.), .18);
        gl_FragColor = vec4(mix(base, col * .55, line * .85), 1.);
        return;
      }
      n = -n;
    }
    gl_FragColor = vec4(cel(col, dot(n, Ld)), 1.);
  }`;

// two cut sets, each a pair of planes through an axis: A = the barrel cover, B = the case and dial
function cutSet() {
  const P1 = new THREE.Plane(), P2 = new THREE.Plane();
  return { planes: [P1, P2], P1, P2, u: { P1: { value: new THREE.Vector4() }, P2: { value: new THREE.Vector4() }, hatchU: { value: new THREE.Vector3() } },
    nm: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, clippingPlanes: [P1, P2], clipIntersection: true }) };
}
const CUT = { A: cutSet(), B: cutSet() };
function setWedge(cs, axis, centre, open) {       // remove the wedge of half-angle open/2 around world angle `centre` about the vertical axis at `axis`
  const { P1, P2, u } = cs;
  if (open < 1e-4) { P1.set(new THREE.Vector3(0, 1, 0), 1e4); P2.set(new THREE.Vector3(0, 1, 0), 1e4); }
  else {
    const a1 = centre - open / 2, a2 = centre + open / 2, c = new THREE.Vector3(axis[0], 0, axis[1]);
    P1.setFromNormalAndCoplanarPoint(new THREE.Vector3(-Math.cos(a1 + Math.PI / 2), 0, -Math.sin(a1 + Math.PI / 2)), c);
    P2.setFromNormalAndCoplanarPoint(new THREE.Vector3(-Math.cos(a2 - Math.PI / 2), 0, -Math.sin(a2 - Math.PI / 2)), c);
  }
  u.P1.value.set(P1.normal.x, P1.normal.y, P1.normal.z, P1.constant);
  u.P2.value.set(P2.normal.x, P2.normal.y, P2.normal.z, P2.constant);
  u.hatchU.value.set(axis[0], 0, axis[1]);
}
const dyeU = {};       // per dye group: { colA, colB, O, R }
function dyeGroup(g, hexB, hexA = PAL.neutral) {
  if (!dyeU[g]) dyeU[g] = { colA: { value: new THREE.Color(hexA) }, colB: { value: new THREE.Color(hexB || hexA) }, O: { value: new THREE.Vector3() }, R: { value: -1 } };
  return dyeU[g];
}
function material(g, hexB, clip, hexA) {
  const u = dyeGroup(g, hexB, hexA), cs = clip ? CUT[clip] : null;
  return new THREE.ShaderMaterial({
    uniforms: { ...u, Ld: lightView, cut: { value: cs ? 1 : 0 }, ...(cs ? cs.u : CUT.A.u) },
    vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide, clipping: !!cs,
    clippingPlanes: cs ? cs.planes : null, clipIntersection: true,
  });
}
const nMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });

// ───────────────────────── part registry ─────────────────────────
// sys: frame | power | trans | reg      g: dye group      arb: which arbor it turns with
const root = new THREE.Group(); scene.add(root);
const parts = [];
function add(geo, sys, y = 0, xz = [0, 0], rotY = 0, id = '', o = {}) {
  const m = new THREE.Mesh(geo); m.position.set(xz[0], y, xz[1]); m.rotation.y = rotY;
  m.userData = { sys, id, g: o.g || (sys === 'frame' ? 'frame' : id), arb: o.arb || null, rot0: rotY, clip: o.clip || '' };
  root.add(m); parts.push(m); return m;
}
const P2D = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const D2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const A2 = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const W2S = pts => pts.map(([x, z]) => [x, -z]);
const cyl = (r, h, n = 64) => { const g = new THREE.CylinderGeometry(r, r, h, n); g.translate(0, h / 2, 0); return g; };
const disc = (ro, ri, h) => slab(circle(ro, 160), ri ? [circle(ri, 160)] : [], h, 0);
const capsule = (a, b, r) => W2S(hull([[...a, r], [...b, r]], 40));

// ───────────────────────── layout (identical to the style frames) ─────────────────────────
const MOD = { bc: .24, ct: .18, tf: .16, fe: .13 };
const ctr = (m, z1, z2) => m * (z1 + z2) / 2;
const B = [-15.5, 0.6];
const C = P2D(B, ctr(MOD.bc, TRAIN.barrel, TRAIN.centerPinion), deg(-25));
const T = P2D(C, ctr(MOD.ct, TRAIN.center, TRAIN.thirdPinion), deg(20));
const F = P2D(T, ctr(MOD.tf, TRAIN.third, TRAIN.fourthPinion), deg(50));
const E = P2D(F, ctr(MOD.fe, TRAIN.fourth, TRAIN.escapePinion), deg(80));
const ESC_R = 2.45, ESC_ROOT = 1.85, SPAN = deg(30);
const mu = deg(20);
const dEP = ESC_R / Math.cos(SPAN);
const PIV = P2D(E, dEP, mu);
const BAL = P2D(PIV, 3.9, mu);
const L = { lo: 1.0, hi: 2.45, th: .36 };

const plateOutline = hull([[...B, 9.6], [...C, 4.2], [...T, 5.6], [...F, 4.6], [...E, 3.6], [...BAL, 6.0]], 96);
add(slab(W2S(plateOutline), [], 1.3, 0), 'frame', -1.3, [0, 0], 0, 'plate');

function meshPhase(cA, zA, wA, cB, zB) {
  const lam = A2(cA, cB), p = TAU / zA;
  let d = ((lam - wA) % p + p) % p; if (d > p / 2) d -= p;
  return lam + Math.PI - d * zA / zB + Math.PI / zB;
}
function wheel(z, m, at, y, phase, sys, id, arb, o = {}) {
  const g = involute(z, m, { steps: 5 });
  const holes = o.spokes ? windows(o.spokes, o.hub ?? 1, g.rf - (o.rim ?? .55), o.sw ?? .26, o.sp ?? .3) : [];
  return add(slab(g.pts, holes, o.h ?? L.th, 0), sys, y, at, -phase, id, { arb, g: o.g });
}
const pinion = (z, m, at, y0, y1, phase, sys, id, arb, g) => wheel(z, m, at, y0, phase, sys, id, arb, { h: y1 - y0, g });
const arbor = (at, y0, y1, sys, r = .28, g) => add(cyl(r, y1 - y0, 32), sys, y0, at, 0, 'arbor', { g });

// barrel: drum, teeth on the upper rim, a cover, the mainspring inside
const gB = involute(TRAIN.barrel, MOD.bc, { steps: 5 });
const wB = deg(4);
const rWall = gB.rf - .5;
const PW = { g: 'power' };
add(slab(gB.pts, [circle(rWall, 200)], .42, 0), 'power', 1.55, B, -wB, 'barrel', { ...PW, arb: 'B', clip: 'A' });
add(disc(gB.rf - .05, rWall, 1.3), 'power', .3, B, 0, 'barrel', { ...PW, clip: 'A' });
add(disc(rWall + .02, 0, .22), 'power', .3, B, 0, 'barrel', PW);
const rHub = 1.55;
add(disc(rWall - .02, rHub * .62 + .06, .28), 'power', 1.6, B, 0, 'barrel', { ...PW, clip: 'A' });     // the cover, set just below the teeth
add(cyl(rHub, 1.9), 'power', .3, B, 0, 'arbor', PW);
add(cyl(rHub * .62, .5), 'power', 2.2, B, 0, 'arbor', PW);
{
  const nC = 9, msT = .17, msP = .27, rIn = rHub + .14, rOut = rWall - .14;
  const k = SPEC_S * nC;
  const rOf = th => {
    const Tn = th / TAU;
    if (Tn < k) return rIn + Tn * msP;
    const r0 = rIn + k * msP, rw0 = rOut - (nC - k - 1) * msP;
    if (Tn < k + 1) { const u = Tn - k, s = u * u * (3 - 2 * u); return r0 + (rw0 - r0) * s; }
    return rw0 + (Tn - k - 1) * msP;
  };
  add(spiralStrip(rOf, nC, msT, 1.05, 120), 'power', .55, B, deg(30), 'spring', PW);
}

// gear train (phases exactly as in the frames)
const wCp = meshPhase(B, TRAIN.barrel, wB, C, TRAIN.centerPinion);
pinion(TRAIN.centerPinion, MOD.bc, C, 1.45, 2.5, wCp, 'trans', 'center', 'C');
const wC = deg(3);
wheel(TRAIN.center, MOD.ct, C, L.hi, wC, 'trans', 'center', 'C', { spokes: 4, hub: 1.0, rim: .6, sw: .32 });
arbor(C, 0, 3.15, 'trans', .28, 'center');
const wTp = meshPhase(C, TRAIN.center, wC, T, TRAIN.thirdPinion);
pinion(TRAIN.thirdPinion, MOD.ct, T, L.lo, L.hi + .5, wTp, 'trans', 'third', 'T');
const wT = deg(9);
wheel(TRAIN.third, MOD.tf, T, L.lo, wT, 'trans', 'third', 'T', { spokes: 4, hub: .9, rim: .55, sw: .3, sp: .9 });
arbor(T, 0, 3.15, 'trans', .28, 'third');
const wFp = meshPhase(T, TRAIN.third, wT, F, TRAIN.fourthPinion);
pinion(TRAIN.fourthPinion, MOD.tf, F, L.lo - .05, L.hi + .1, wFp, 'trans', 'fourth', 'F');
const wF = deg(14);
wheel(TRAIN.fourth, MOD.fe, F, L.hi, wF, 'trans', 'fourth', 'F', { spokes: 4, hub: .8, rim: .5, sw: .26, sp: .2 });
arbor(F, 0, 3.15, 'trans', .28, 'fourth');
const wEp = meshPhase(F, TRAIN.fourth, wF, E, TRAIN.escapePinion);
pinion(TRAIN.escapePinion, MOD.fe, E, L.lo, L.hi + .5, wEp, 'reg', 'escape', 'E');
const lamEP = A2(E, PIV), entryA = lamEP + SPAN, exitA = lamEP - SPAN;
add(slab(clubWheel(TRAIN.escape, ESC_R, ESC_ROOT), windows(5, .6, ESC_ROOT - .38, .18, .2), L.th, 0), 'reg', L.lo, E, -(entryA - deg(3)), 'escape', { arb: 'E' });
arbor(E, 0, 2.95, 'reg', .24, 'escape');

// pallet fork: built in world coordinates, then hung on a pivot group so it can rock
const forkPivot = new THREE.Group(); forkPivot.position.set(PIV[0], 0, PIV[1]); root.add(forkPivot);
const forkInner = new THREE.Group(); forkInner.position.set(-PIV[0], 0, -PIV[1]); forkPivot.add(forkInner);
const toFork = [];
{
  const yF = L.lo + .03, hF = .3, PL = (g, y, at = [0, 0], r = 0) => toFork.push(add(g, 'reg', y, at, r, 'pallet'));
  const s1 = P2D(E, ESC_R + .35, entryA), s2 = P2D(E, ESC_R + .35, exitA);
  const toBal = A2(PIV, BAL), hornBase = P2D(PIV, D2(PIV, BAL) - 1.1, toBal);
  PL(slab(capsule(PIV, s1, .26), [], hF, 0), yF);
  PL(slab(capsule(PIV, s2, .26), [], hF, 0), yF);
  PL(slab(capsule(PIV, hornBase, .22), [], hF, 0), yF);
  const nx = Math.cos(toBal + Math.PI / 2), nz = Math.sin(toBal + Math.PI / 2);
  for (const sgn of [-1, 1]) {
    const h0 = [hornBase[0] + sgn * .3 * nx, hornBase[1] + sgn * .3 * nz];
    PL(slab(capsule(h0, P2D(h0, .7, toBal + sgn * deg(12)), .14), [], hF, 0), yF);
  }
  PL(slab(W2S(circle(.5, 48, ...PIV)), [], hF + .04, 0), yF);
  for (const [a, lock] of [[entryA, .22], [exitA, -.04]]) {
    const g = new THREE.BoxGeometry(.8, .5, .26); g.translate(0, .25, 0);
    PL(g, L.lo - .06, P2D(E, ESC_R + .3 - lock, a), -a);
  }
  toFork.push(arbor(PIV, 0, 2.0, 'reg', .2, 'pallet'));
}
for (const m of toFork) { root.remove(m); forkInner.add(m); }

// balance: hung on its own pivot group; the hairspring is rebuilt every frame (inner end turns, outer end held)
const balPivot = new THREE.Group(); balPivot.position.set(BAL[0], 0, BAL[1]); root.add(balPivot);
const yBal = 3.25, rimO = 4.45, rimI = 3.95;
{
  const BG = { g: 'balance' }, mk = [];
  mk.push(add(slab(circle(rimO, 220), windows(3, .8, rimI, .24, deg(18)), .48, 0), 'reg', yBal, [0, 0], 0, 'balance', BG));
  mk.push(add(cyl(.75, .6), 'reg', yBal - .08, [0, 0], 0, 'balance', BG));
  mk.push(add(cyl(.17, 4.6), 'reg', .3, [0, 0], 0, 'balance', BG));
  mk.push(add(cyl(.7, .2), 'reg', L.lo + .05, [0, 0], 0, 'balance', BG));
  mk.push(add(cyl(.11, .4, 16), 'reg', L.lo - .1, P2D([0, 0], .5, A2(BAL, PIV)), 0, 'balance', BG));
  for (const m of mk) { root.remove(m); balPivot.add(m); }
}
const HAIR = { n: 6, r0: 1.0, pitch: .38, rot: deg(80) };
const hair = add(hairGeo(0), 'reg', yBal + .7, BAL, HAIR.rot, 'hair', { g: 'balance' });
function hairGeo(theta) {          // theta: balance angle (rad). Coil i of n turns by theta·(1 − u), u = 0 at the collet, 1 at the stud
  const nT = HAIR.n, steps = 110, N = nT * steps, th = .13, outer = [], inner = [];
  for (let i = 0; i <= N; i++) {
    const a = i / steps * TAU, u = i / N, r = HAIR.r0 + a / TAU * HAIR.pitch, a2 = a + theta * (1 - u);
    outer.push(new THREE.Vector2((r + th / 2) * Math.cos(a2), (r + th / 2) * Math.sin(a2)));
    inner.push(new THREE.Vector2((r - th / 2) * Math.cos(a2), (r - th / 2) * Math.sin(a2)));
  }
  const s = new THREE.Shape(outer.concat(inner.reverse()));
  const g = new THREE.ExtrudeGeometry(s, { depth: .16, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  return g;
}

// bridges (frame)
const cockFoot = P2D(BAL, 5.7, deg(-60));
const escFoot = P2D(E, 3.2, deg(165));
{
  const hBr = .5;
  add(slab(capsule(BAL, cockFoot, 1.0), [], .55, 0), 'frame', yBal + 1.25, [0, 0], 0, 'bridge');
  add(slab(W2S(circle(1.55, 64, ...cockFoot)), [], .5501, 0), 'frame', yBal + 1.25, [0, 0], 0, 'bridge');
  add(cyl(1.05, .14), 'frame', yBal + 1.8, BAL, 0, 'bridge');
  add(cyl(1.25, yBal + 1.25), 'frame', 0, cockFoot, 0, 'pillar');
  add(slab(capsule(escFoot, E, .75), [], .4, 0), 'frame', 2.95, [0, 0], 0, 'bridge');
  add(slab(capsule(E, PIV, .6), [], .4001, 0), 'frame', 2.95, [0, 0], 0, 'bridge');
  add(cyl(.85, 2.95), 'frame', 0, escFoot, 0, 'pillar');
  const bb = hull([[...P2D(B, 8.2, deg(-160)), 1.4], [...P2D(B, 7.0, deg(-105)), 1.1]], 48);
  add(slab(W2S(bb), [], hBr, 0), 'frame', 2.45, [0, 0], 0, 'bridge');
  add(cyl(1.0, 2.45), 'frame', 0, P2D(B, 7.75, deg(-132)), 0, 'pillar');
  for (const [p, y] of [[cockFoot, yBal + 1.8], [escFoot, 3.35], [P2D(B, 7.75, deg(-132)), 2.95]]) add(cyl(.42, .12), 'frame', y, p, 0, 'bridge');
}


// ───────────────────────── the watch: case, dial, hands (cut set B, centred on the centre wheel) ─────────────────────────
const caseG = new THREE.Group(); root.add(caseG);       // band, floor, crown, bow: drops away below
const dialG = new THREE.Group(); root.add(dialG);       // dial, markers, hands: lifts away above
const CASE = { c: C, rIn: 29.2, rOut: 31.0, y0: -3.4, y1: 7.2, dialY: 6.4, dialH: .35 };
const DIALTOP = CASE.dialY + CASE.dialH;
const toCase = [];
const CA = (geo, hex, y, xz, rotY, id, clip = 'B') => { const m = add(geo, 'case', y, xz, rotY, id, { g: 'fix' + hex, clip }); m.userData.hex = hex; toCase.push(m); return m; };
const ON_DIAL = new Set(['dial', 'marker', 'subdial', 'hand']);
const AT12 = deg(-90);                                   // 12 o'clock points away from the camera (−z)
const clockA = frac => AT12 + TAU * frac;                // world angle of a hand, clockwise seen from above
{
  CA(disc(CASE.rOut, CASE.rIn, CASE.y1 - CASE.y0), PAL.neutral, CASE.y0, C, 0, 'band');
  CA(disc(CASE.rIn + .01, 0, .4), PAL.floor, CASE.y0, C, 0, 'floor', '');
  CA(disc(CASE.rIn - .02, 0, CASE.dialH), PAL.dial, CASE.dialY, C, 0, 'dial');
  for (let k = 0; k < 12; k++) {                         // hour markers
    const a = clockA(k / 12), main = k % 3 === 0, len = main ? 3.0 : 2.2, w = main ? 1.0 : .5;
    const g = new THREE.BoxGeometry(len, .12, w); g.translate(0, .06, 0);
    CA(g, PAL.ink, DIALTOP, P2D(C, 27.2 - len / 2, a), -a, 'marker');
  }
  CA(disc(4.75, 4.55, .07), PAL.ink, DIALTOP, F, 0, 'subdial');              // small seconds at the fourth wheel
  for (let k = 0; k < 4; k++) { const a = clockA(k / 4), g = new THREE.BoxGeometry(.9, .07, .22); g.translate(0, .035, 0); CA(g, PAL.ink, DIALTOP, P2D(F, 3.7, a), -a, 'subdial'); }
  // crown, stem and bow at 12
  const cr = new THREE.CylinderGeometry(1.7, 1.7, 2.4, 40); cr.rotateZ(Math.PI / 2);
  const crown = CA(cr, PAL.neutral, 1.9, P2D(C, CASE.rOut + 1.9, AT12), -AT12, 'crown', '');
  const st = new THREE.CylinderGeometry(.8, .8, 1.4, 24); st.rotateZ(Math.PI / 2);
  CA(st, PAL.neutral, 1.9, P2D(C, CASE.rOut + .4, AT12), -AT12, 'crown', '');
  const bow = new THREE.TorusGeometry(4.0, .6, 18, 90); bow.rotateY(Math.PI / 2);
  CA(bow, PAL.neutral, 1.9, P2D(C, CASE.rOut + 3.1 + 4.0, AT12), -AT12 + Math.PI / 2, 'bow', '');
  void crown;
}
// hands: each on its own pivot group so it can turn
const handPivot = (at, y) => { const g = new THREE.Group(); g.position.set(at[0], y, at[1]); dialG.add(g); return g; };
const hourG = handPivot(C, DIALTOP + .06), minG = handPivot(C, DIALTOP + .18), secG = handPivot(F, DIALTOP + .1);
function hand(group, len, r0, r1, tail, h, hub) {
  const ms = [CA(slab(W2S(hull([[-tail, 0, r0 * .8], [0, 0, r0], [len, 0, r1]], 40)), [], h, 0), PAL.ink, 0, [0, 0], 0, 'hand')];
  if (hub) ms.push(CA(cyl(hub, h + .06, 40), PAL.ink, 0, [0, 0], 0, 'hand'));
  for (const m of ms) { root.remove(m); toCase.splice(toCase.indexOf(m), 1); group.add(m); }
}
hand(hourG, 13.5, .75, .4, 2.0, .1, 1.25);
hand(minG, 22.5, .55, .2, 2.6, .1, .95);
hand(secG, 4.1, .16, .1, 1.3, .08, .42);
for (const m of toCase) { root.remove(m); (ON_DIAL.has(m.userData.id) ? dialG : caseG).add(m); }

// materials: one per part (its dye group's uniforms are shared)
const SYSCOL = { frame: null, power: PAL.power, trans: PAL.trans, reg: PAL.reg };
for (const m of parts) {
  const { sys, g, clip } = m.userData;
  m.material = sys === 'case' ? material(g, m.userData.hex, clip, m.userData.hex) : material(g, SYSCOL[sys], clip);
  m.userData.nm = clip ? CUT[clip].nm : nMat;
}

// soft contact shadow (colour pass only)
{
  const xs = plateOutline.map(p => p[0]), zs = plateOutline.map(p => p[1]);
  const x0 = Math.min(...xs) - 8, x1 = Math.max(...xs) + 8, z0 = Math.min(...zs) - 8, z1 = Math.max(...zs) + 8, S = 20;
  const c = document.createElement('canvas'); c.width = (x1 - x0) * S; c.height = (z1 - z0) * S; const x = c.getContext('2d');
  x.filter = `blur(${1.6 * S}px)`; x.fillStyle = 'rgba(70,60,45,.20)';
  x.beginPath(); plateOutline.forEach(([px, pz], i) => x[i ? 'lineTo' : 'moveTo']((px - x0 + .4) * S, (pz - z0 + .9) * S)); x.closePath(); x.fill();
  const s = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.position.set((x0 + x1) / 2, -1.9, (z0 + z1) / 2); s.layers.set(1); scene.add(s);
}

// ───────────────────────── time: the speed curve, its integral (watch time), the free-running train ─────────────────────────
const DT = 1 / 1000, NS = Math.ceil((FULL + 1) / DT) + 2;
function speedAt(t) {
  if (t <= SPEED[0][0]) return SPEED[0][1];
  for (let i = 0; i < SPEED.length - 1; i++) {
    const [ta, va] = SPEED[i], [tb, vb] = SPEED[i + 1];
    if (t < tb) return va + (vb - va) * ss(seg(t, ta, tb));
  }
  return SPEED[SPEED.length - 1][1];
}
const PITCH_F = TAU / TRAIN.fourth;                      // after the rush the fourth wheel must have turned a whole number of teeth
const rushShape = t => t >= CUE.rush1 ? 0 : ss(seg(t, CUE.rush0, CUE.rush0 + 1.4)) * (1 - seg(t, CUE.rush1 - .12, CUE.rush1));
const WT = new Float64Array(NS), RT = new Float64Array(NS);
{
  let r = 0; for (let i = 0; i < NS - 1; i++) { WT[i + 1] = WT[i] + speedAt((i + .5) * DT) * DT; RT[i + 1] = (r += rushShape((i + .5) * DT) * DT); }
  const want = TAU * 1.0;                                 // peak: the seconds wheel at 1 turn per second (60× its normal speed)
  const n = Math.round(RT[NS - 1] * want / PITCH_F), k = n * PITCH_F / RT[NS - 1];
  for (let i = 0; i < NS; i++) RT[i] *= k;
}
const tab = (A, t) => { const x = clamp(t / DT, 0, NS - 1.001), i = Math.floor(x), f = x - i; return A[i] + (A[i + 1] - A[i]) * f; };
export const watchTime = t => tab(WT, t);
const rushAngle = t => tab(RT, t);
const rushRate = t => rushShape(t);

const A_BAL = deg(PHYS.A);
const HALF = TAU / TRAIN.escape / 2;
const FORK = deg(7), WIN = 0.09, BEAT_REAL = 0.2;
const W_ANCHOR = watchTime(TICK_ANCHOR);
const beatX = t => (watchTime(t) - W_ANCHOR) / BEAT_REAL;          // integer at every centre crossing; 0 at the climax tick
function motion(t) {
  const x = beatX(t), n = Math.round(x), d = x - n;
  const s = ss(clamp((d + WIN / 2) / WIN));
  const beats = n + s;
  const side = (((n % 2) + 2) % 2 === 0 ? 1 : -1);
  const theta = A_BAL * Math.sin(Math.PI * x);
  const fork = FORK * side * (2 * s - 1);
  const dE = -HALF * beats;
  const dF = -dE * TRAIN.escapePinion / TRAIN.fourth + rushAngle(t);
  const dT = -dF * TRAIN.fourthPinion / TRAIN.third;
  const dC = -dT * TRAIN.thirdPinion / TRAIN.center;
  const dB = -dC * TRAIN.centerPinion / TRAIN.barrel;
  return { x, theta, fork, beats, d: { E: dE, F: dF, T: dT, C: dC, B: dB } };
}

// explode: each system lifts on its own layer, bridges first; they land in reverse, the fork last (that landing is the lock)
const LAND = { frame: 0, power: CUE.rush1 - .6, trans: CUE.rush1 - .3, reg: CUE.rush1, bridge: CUE.rush1 + .35 };
const layerOf = m => m.userData.id === 'bridge' ? 'bridge' : m.userData.sys;
function lift(k, t) {
  if (!LAYER[k]) return 0;
  const up = ss(seg(t, CUE.explode + LIFT_ORDER[k], CUE.explode + LIFT_ORDER[k] + 1.1));
  const down = ei(seg(t, LAND[k] - .95, LAND[k]));
  return LAYER[k] * up * (1 - down);
}
// the case: lifts away after the dial is cut, comes back down at the end
function caseLift(t) {            // 0 = in place, 1 = gone (dial far above, case far below)
  if (t < CUE.descend) return ei(seg(t, CUE.lift, CUE.lift + 1.3));
  return 1 - eo(seg(t, CUE.descend, CUE.descend + 1.5));
}

// ───────────────────────── dye origins ─────────────────────────
const V3 = (xz, y) => new THREE.Vector3(xz[0], y, xz[1]);
const between = (a, ra, b) => P2D(a, ra, A2(a, b));
const ORIG = {
  barrelHub: V3(B, 2.4),
  meshBC: V3(between(B, gB.rp, C), 1.8),
  meshCT: V3(between(C, MOD.ct * TRAIN.center / 2, T), 2.6),
  meshTF: V3(between(T, MOD.tf * TRAIN.third / 2, F), 1.2),
  meshFE: V3(between(F, MOD.fe * TRAIN.fourth / 2, E), 2.6),
  meshEP: V3(P2D(E, ESC_R, lamEP), 1.2),
  pin: V3(P2D(BAL, .5, A2(BAL, PIV)), 1.0),
};
const DYE_R = { power: 11, center: 7.5, third: 6.5, fourth: 6, escape: 4, pallet: 5.5, balance: 6.5 };
for (const dz of DYE) dyeU[dz.g].O.value.copy(ORIG[dz.from]);
const COL_REG = new THREE.Color(PAL.reg), COL_ACC = new THREE.Color(PAL.accent);

// ───────────────────────── camera: three continuous moves, joined by a hard cut (18.4) and a match cut on the lock (33.0) ─────────────────────────
const box = new THREE.Box3().setFromObject(root.children.find(o => o.userData.id === 'plate'));
const MID = [(B[0] + BAL[0]) / 2 + 1, (B[1] + BAL[1]) / 2];
const mixP = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const K = (t, el, az, d, xz, y, ox = 0, oy = 0) => ({ t, el, az, d, x: xz[0], y, z: xz[1], ox, oy });
const CAMS = [
  [ // A: dial close-up → pull out → orbit while the dial is cut → crane down into the movement → skim along the train
    K(0, 60, -8, 25, F, DIALTOP, 0, 0),
    K(1.4, 55, -11, 112, mixP(F, C, .85), 4, -240, 0),
    K(3.0, 54, -12, 122, C, 4, -240, 0),
    K(6.6, 48, -16, 150, C, 3, -220, 0),
    K(9.6, 40, -24, 136, C, 3, -160, -10),
    K(11.4, 32, -38, 64, B, 2, -40, 0),
    K(13.8, 22, -48, 46, mixP(B, C, .4), 2.2, -40, 0),
    K(15.2, 12, -30, 38, C, 2.6, 0, 30),
    K(16.6, 11, -8, 38, F, 2.4, 0, 40),
    K(18.9, 17, 12, 48, mixP(E, BAL, .45), 2.6, 0, 50),
  ],
  [ // B: hard cut to the plate seen from above (4,800×) → crane out to the side for the explosion → follow the landing → push toward the escapement
    K(18.9, 64, -4, 104, MID, 1.5, -170, 10),
    K(23.4, 61, -8, 110, MID, 1.5, -170, 10),
    K(25.6, 22, -26, 104, mixP(MID, F, .25), 10.5, -330, 30),    // close on the stack, a slow orbit so the layers separate
    K(28.4, 20, -6, 98, mixP(MID, F, .35), 10.5, -330, 30),
    K(30.2, 32, -10, 112, MID, 3, -60, 0),
    K(33.0, 30, 0, 78, mixP(E, PIV, .5), 2, -40, 0),
  ],
  [ // C: match cut to the escapement → a slow orbit round it → push in through the slow-motion tick → pull out to the whole watch
    K(33.0, 30, -40, 30, mixP(E, PIV, .5), 1.6, -80, 0),
    K(37.2, 26, -14, 26, mixP(E, PIV, .5), 1.5, -40, 0),
    K(39.4, 24, -4, 21, mixP(PIV, E, .45), 1.4, -10, 0),
    K(42.2, 25, 0, 22, mixP(PIV, E, .45), 1.4, -10, 0),
    K(44.4, 40, -4, 110, C, 3, -150, 20),
    K(47.2, 52, -12, 226, C, 3, -270, 78),
    K(52.0, 53.5, -14, 233, C, 3, -270, 78),
  ],
];
const CAMKEYS = ['el', 'az', 'd', 'x', 'y', 'z', 'ox', 'oy'];
function hermite(keys, t) {
  const n = keys.length; let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], u = clamp((t - a.t) / (b.t - a.t)), h = b.t - a.t;
  const tan = (j, f) => (j === 0 || j === n - 1) ? 0 : (keys[j + 1][f] - keys[j - 1][f]) / (keys[j + 1].t - keys[j - 1].t);
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const o = {}; for (const f of CAMKEYS) o[f] = h00 * a[f] + h10 * h * tan(i, f) + h01 * b[f] + h11 * h * tan(i + 1, f);
  return o;
}
function camAt(t) {
  const keys = t < 18.9 ? CAMS[0] : t < 33.0 ? CAMS[1] : CAMS[2];
  const c = hermite(keys, t), el = deg(c.el), az = deg(c.az);
  camera.position.set(c.x + c.d * Math.cos(el) * Math.sin(az), c.y + c.d * Math.sin(el), c.z + c.d * Math.cos(el) * Math.cos(az));
  camera.lookAt(c.x, c.y, c.z);
  camera.setViewOffset(W, H, c.ox, c.oy, W, H);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  lightView.value.copy(LIGHT).transformDirection(camera.matrixWorldInverse);
}
const scr = (xz, y) => { const v = new THREE.Vector3(xz[0], y, xz[1]).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };

const post = makeOutline(renderer, scene, camera, W * PR, H * PR, PAL, parts);
const durs = await fetch('voice/dur.json').then(r => r.json());
const SUBS = VO.map((v, i) => {
  const end = v.t + durs[v.id], nxt = VO[i + 1] ? VO[i + 1].t - .15 : FULL;
  return { id: v.id, t0: v.t, t1: Math.min(nxt, Math.max(v.t + 1.8, end + .6)), en: v.en, zh: v.zh, vEnd: end };
});
const STATE = { lift: k => 0 };
const GEO = { B, C, T, F, E, PIV, BAL, gB, L, rimO, yBal, ESC_R, rWall, P2D, deg, DIALTOP, clockA };
const ov = makeOverlay({ PAL, GEO, scr, CUE, SHOTS, SUBS, STATE }); ov.setRush(rushRate);

// ───────────────────────── one frame ─────────────────────────
const basesY = new Map(); for (const m of parts) basesY.set(m, m.position.y);
function renderFull(t) {
  camAt(t);
  const M = motion(t);
  // explode offsets
  const off = { frame: 0, power: lift('power', t), trans: lift('trans', t), reg: lift('reg', t), bridge: lift('bridge', t) };
  STATE.lift = k => off[k] || 0;
  for (const m of parts) {
    if (m.parent !== root) continue;
    const k = layerOf(m); m.position.y = basesY.get(m) + (off[k] || 0);
    if (m.userData.arb) m.rotation.y = m.userData.rot0 - M.d[m.userData.arb];
  }
  forkPivot.position.y = off.reg; forkPivot.rotation.y = -M.fork;
  balPivot.position.y = off.reg; balPivot.rotation.y = -M.theta;
  hair.geometry.dispose(); hair.geometry = hairGeo(M.theta);
  // the watch
  const cl = caseLift(t);
  dialG.position.y = 75 * cl; caseG.position.y = -45 * cl; dialG.visible = caseG.visible = cl < .999;
  const W0 = watchTime(t), mins = 8 + 36 / 60 + W0 / 60;
  minG.rotation.y = -clockA(mins / 60); hourG.rotation.y = -clockA((10 + mins / 60) / 12);
  secG.rotation.y = -clockA(((36 + M.beats * BEAT_REAL) % 60 + 60) % 60 / 60);
  // dye, accent
  for (const dz of DYE) {
    const u = dyeU[dz.g], k = seg(t, dz.t0, dz.t0 + dz.dur);
    u.R.value = t < dz.t0 ? -1 : (k >= 1 ? 1e3 : DYE_R[dz.g] * eo(k) + .05);
  }
  const acc = ss(seg(t, CUE.accent, CUE.accent + .3)) * (1 - ss(seg(t, CUE.descend - 1.4, CUE.descend - .4)));
  dyeU.escape.colB.value.copy(COL_REG).lerp(COL_ACC, acc);
  // cuts
  setWedge(CUT.A, B, deg(100), deg(118) * ss(seg(t, CUE.barrelCut, CUE.barrelCut + .6)));
  setWedge(CUT.B, C, deg(96), deg(150) * ss(seg(t, CUE.dialCut, CUE.dialCut + .9)));
  post.render();
  ov.update(t, M);
}

window.DUR = TO - FROM;
window.render = t => renderFull(t + FROM);
window.TEXTS = t => { renderFull(t + FROM); return ov.texts(t + FROM); };

// sound and cue events (film seconds, shifted to the slice)
{
  const ev = [];
  let last = Math.floor(beatX(0));
  for (let t = 0; t < FULL; t += .001) {
    const f = Math.floor(beatX(t));
    if (f !== last) {
      last = f; camAt(t); const p = scr(BAL, yBal);
      const kind = t < CUE.lift ? 'dialtick' : Math.abs(t - CUE.tick) < .05 ? 'bigtick' : 'tick';
      ev.push({ t: +t.toFixed(3), type: kind, k: f, pan: +clamp(p[0] / W * 2 - 1, -1, 1).toFixed(3), rate: +speedAt(t).toFixed(3) });
    }
  }
  const at = (t, type, o = {}) => ev.push({ t, type, ...o });
  at(CUE.dialCut, 'cut', { which: 'dial' }); at(CUE.barrelCut, 'cut', { which: 'barrel' });
  at(CUE.lift, 'lift'); at(CUE.explode, 'explode'); at(CUE.descend, 'descend'); at(CUE.descend + 1.5, 'seat');
  for (const k of ['power', 'trans', 'reg', 'bridge']) at(LAND[k], k === 'reg' ? 'lock' : 'land', { layer: k });
  for (const dz of DYE) { camAt(dz.t0); const o = ORIG[dz.from]; const p = scr([o.x, o.z], o.y + lift(dz.sys, dz.t0)); at(dz.t0, 'dye', { g: dz.g, sys: dz.sys, pan: +clamp(p[0] / W * 2 - 1, -1, 1).toFixed(3) }); }
  for (const l of ov.cues) at(l.t, 'label', { id: l.id });
  at(CUE.ratio, 'ratio'); at(CUE.final, 'final');
  const rv = []; for (let t = 0; t < FULL; t += .02) rv.push(+rushRate(t).toFixed(4));
  ev.push({ t: 0, type: 'curve', name: 'rush', dt: .02, v: rv });
  for (const s of SUBS) ev.push({ t: s.t0, type: 'sub', id: s.id, t1: +s.t1.toFixed(3), vEnd: +s.vEnd.toFixed(3), en: s.en, zh: s.zh });
  ev.sort((a, b) => a.t - b.t);
  window.EV = ev.filter(e => e.type === 'curve' || (e.t >= FROM && e.t < TO)).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4) }));
}
document.fonts.ready.then(() => { window.READY = true; });
