// Line-Art Cutaway 线稿剖面图解 · demo film WHERE IS YOUR PHONE'S ANTENNA? (52 s; shot list in ../DEMO.md).
// The model is built in code to the outline of a 150.5 × 70.8 × 8.9 mm phone (units: mm); the line art is traced live by normal / depth edge detection:
//   three line weights: outer silhouette heaviest, occlusion lines between layers medium, creases and small parts thinnest and lightest; the hand is a fourth weight (thinner, lighter "diagram" lines).
//   anti-flicker: 2× supersampling × 8 sub-pixel jitter passes accumulated (shutter 0.12 frame, anti-aliasing only, no motion smear).
// Page contract: the t in window.render(t) is seconds within the segment, segment = [from, to] of the whole film (?from=0&to=50). Internally everything is in whole-film seconds.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, lerp, seg, eio, eo, ei, ss, back, track, mulberry } from '/core/lib.js';

THREE.ColorManagement.enabled = false;
const Q = new URLSearchParams(location.search);
const TLJ = await (await fetch('timeline.json')).json();
const FILM = TLJ.end;
const FROM = +(Q.get('from') ?? 0), TO = +(Q.get('to') ?? FILM);
const SUBS = Q.get('subs') !== '0';            // ?subs=0: draw no subtitles (for the poster and gallery card)
const W = 150.5, D = 70.8, H = 8.9, R = 9.5, T = 1.8;
const PX = 1920, PY = 1080, SS = 2, JIT = +(Q.get('jit') || 8);
const PAPER = '#f6f5f0', INK = '#141414', GRAPH = '#5a5955', FAINT = '#8a8984', ACC = '#ff4d1a', ACC_GL = 0xff4d1a;
const SANS = '"Plex Sans", sans-serif', MONO = '"Plex Mono", monospace', ZH = '"Noto SC", sans-serif';

// ---------- Timeline (whole-film seconds; narration starts are in timeline.json, the beats below hit keywords in the narration) ----------
const K = {
  sweep: [0.0, 1.4], year: [0.5, 4.5],
  hand1: [2.4, 4.3], curl1: [3.1, 4.6], corner: [5.3, 8.45], bars1: [5.75, 7.95], barsDrop1: [7.35, 7.95],
  question: [8.0, 12.0], handOut: [9.9, 11.0],
  flood: [10.9, 11.8], answer: [12.15, 15.6], tipFlat: [12.9, 14.2],
  lift: 13.25, liftStep: 0.17, liftDur: 1.05,
  ping: 14.5, path: [14.55, 17.6],
  cRF: [14.8, 18.9], cCoax: [15.5, 18.95], cFeed: [16.7, 19.0], note: [14.6, 34.8],
  drop: [18.85, 19.75], slitLabel: [20.3, 22.85], dive: [18.9, 23.8],
  // the cut through the slit falls between the end of line 5 (23.63 s) and the start of line 6 (24.74 s)
  cut: 23.8, iris: [23.8, 24.55], mag: [24.6, 25.2], slitNote: [25.1, 34.8],
  pieces: [24.9, 34.8], rulerA: [27.2, 28.4], rulerB: [31.6, 32.2], rulersOut: 34.8,
  rejoin: [34.85, 35.9], standUp: [35.1, 36.3],
  hand2: [35.95, 36.85], curl2: [36.35, 37.2], bridge: [37.5, 41.5], drain: [39.4, 40.4], barsDrop2: [39.5, 40.1],
  topFlood: [42.7, 43.5], switchC: [42.85, 46.4], barsUp: [43.2, 43.8],
  endTitle: 46.75, trace: [48.25, 49.5], credit: 48.1,
};
const VO = Object.fromEntries(TLJ.subs.map(s => [s.id, s.vo]));

// ---------- Renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PX, PY, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(0xffffff, 0);
renderer.autoClear = false;

// ---------- Material: one shader, two modes (0 = greyscale tone, 1 = normal + linear depth) ----------
const U = { uMode: { value: 0 }, uTrace: { value: -1 } };
const CTL_B = { uPath: { value: 0 }, uUmax: { value: 0.78 } };    // bottom antenna: chip → coax → spring contact (uPath) + bottom U segment (uUmax)
const CTL_T = { uPath: { value: 0 }, uUmax: { value: 0.78 } };    // top antenna
const VS = `
#include <clipping_planes_pars_vertex>
attribute float aS; attribute float aR;
varying vec3 vN; varying vec3 vWN; varying vec2 vUv; varying float vVZ; varying vec3 vWP; varying float vS; varying float vR;
void main(){
  vec4 mvPosition = modelViewMatrix * vec4(position,1.);
  vN = normalize(normalMatrix*normal);
  vWN = normalize(mat3(modelMatrix)*normal);
  vUv = uv; vVZ = -mvPosition.z; vWP = (modelMatrix*vec4(position,1.)).xyz; vS = aS; vR = aR;
  gl_Position = projectionMatrix*mvPosition;
  #include <clipping_planes_vertex>
}`;
const FS = `
#include <clipping_planes_pars_fragment>
uniform float uMode; uniform vec3 uColor; uniform vec3 uColor0; uniform float uKind; uniform sampler2D uMap; uniform float uHasMap;
uniform float uPath; uniform float uUmax; uniform float uTrace;
varying vec3 vN; varying vec3 vWN; varying vec2 vUv; varying float vVZ; varying vec3 vWP; varying float vS; varying float vR;
float hatch(float period){ float h = mod(gl_FragCoord.x + gl_FragCoord.y, period); return smoothstep(0.6, 1.6, h) * (1. - smoothstep(2.6, 3.6, h)); }
void main(){
  #include <clipping_planes_fragment>
  if(uMode>0.5){
    vec3 n = normalize(vN); if(!gl_FrontFacing) n = vec3(0.,0.,1.);
    gl_FragColor = vec4(n, vVZ); return;
  }
  vec3 acc = vec3(1., .302, .102);
  vec3 col = uColor; bool lit = false; float head = 0.;
  if(uKind>2.5 && uKind<3.5){                     // antenna path: lit along the path parameter vS
    float pe = min(uPath, .78);
    bool a = vS < pe, b = vS >= .78 && vS < uUmax;
    lit = a || b;
    head = a ? smoothstep(.035, 0., pe - vS) * step(pe, .779) : (b ? smoothstep(.03, 0., uUmax - vS) * step(uUmax, .999) : 0.);
    col = lit ? mix(uColor, vec3(1.,.72,.55), head*.6) : uColor0;
  }
  if(vR > .5 && uTrace > -.5){                     // ending: an orange light runs once around the frame
    float d = vR - 1. - uTrace; d -= floor(d + .5);
    float k = smoothstep(.05, .015, abs(d));
    if(k > 0.){ col = mix(col, acc, k); lit = lit || k > .5; }
  }
  if(!gl_FrontFacing){                            // section faces: hatching; a lit path stays solid
    vec3 c = lit ? col : mix(vec3(.90), vec3(.34), hatch(10.));
    gl_FragColor = vec4(c,1.); return;
  }
  vec3 n = normalize(vWN);
  vec3 L = normalize(vec3(-.35,1.,.55));
  float d = max(dot(n,L),0.);
  float tone = .82 + .18*d + .03*n.y;
  if(uKind>0.5 && uKind<1.5){ float s=.5+.5*sin((vWP.x - vWP.z*1.4)*.045); col *= mix(.94,1.0,s); }
  if(uKind>3.5 && uKind<4.5 && !lit){ col = mix(vec3(.88), vec3(.56), hatch(10.)); tone = 1.; }   // plastic breaks: light grey hatching
  if(uHasMap>.5){ vec4 m=texture2D(uMap,vUv); col = mix(col, m.rgb, m.a); }
  if(lit) tone = .94 + .06*d;
  float alpha = 1.;
  if(uKind>4.5){ tone = .97 + .03*d; alpha = .5; }  // hand: nearly paper white, alpha 0.5 marks "this is the hand" so tracing uses a thinner, lighter weight
  gl_FragColor = vec4(col*min(tone,1.0), alpha);
}`;
function mat(hex, kind = 0, map = null, hex0 = null, ctl = CTL_B) {
  return new THREE.ShaderMaterial({
    uniforms: { uMode: U.uMode, uTrace: U.uTrace, uPath: ctl.uPath, uUmax: ctl.uUmax, uColor: { value: new THREE.Color(hex) }, uColor0: { value: new THREE.Color(hex0 ?? hex) }, uKind: { value: kind }, uMap: { value: map }, uHasMap: { value: map ? 1 : 0 } },
    vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide, clipping: true });
}
const M = {
  glass: mat(0xf6f6f3, 1), glassDim: mat(0xe8e8e4, 1), white: mat(0xfbfbf9), metal: mat(0xededea), metal2: mat(0xdcdcd8), metalR: mat(0xededea),
  board: mat(0xe9e9e5), pas: mat(0xbcbcb8), chip: mat(0x3e3e3d), mid: mat(0x9a9a97), dark: mat(0x555553),
  flex: mat(0xe0e0dc), plastic: mat(0xb0b0ac, 4), oled: mat(0x5a5a58),
  accB: mat(ACC_GL, 3, null, 0xd8d8d4), accF: mat(ACC_GL, 3, null, 0xededea), accT: mat(ACC_GL, 3, null, 0xededea, CTL_T),
  hand: mat(0xf9f8f4, 5),
};
const scene = new THREE.Scene();
const root = new THREE.Group(); scene.add(root);          // the whole phone (rotate this for lying flat ↔ standing up)
// ---------- Geometry helpers ----------
function rrPath(P, w, h, r, cx = 0, cy = 0) {
  const x = cx - w / 2, y = cy - h / 2; r = Math.min(r, w / 2, h / 2);
  P.moveTo(x + r, y); P.lineTo(x + w - r, y); P.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  P.lineTo(x + w, y + h - r); P.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  P.lineTo(x + r, y + h); P.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  P.lineTo(x, y + r); P.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI); return P;
}
const rr = (w, h, r, cx = 0, cy = 0) => rrPath(new THREE.Shape(), w, h, r, cx, cy);
const rrHole = (w, h, r, cx = 0, cy = 0) => rrPath(new THREE.Path(), w, h, r, cx, cy);
const circHole = (r, cx, cy) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };
// flat extrusion: shape (x, y) → world (x, -z), thickness along +Y
function slab(shape, depth, y0 = 0, seg = 18) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const cyl = (r, h, x, y, z, s = 20) => new THREE.CylinderGeometry(r, r, h, s).translate(x, y + h / 2, z);
function ring(r0, r1, h, x, y, z) { const s = new THREE.Shape(); s.absarc(0, 0, r1, 0, Math.PI * 2); const p = new THREE.Path(); p.absarc(0, 0, r0, 0, Math.PI * 2, true); s.holes.push(p); return slab(s, h, y, 48).translate(x, 0, z); }
function clean(g) { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aS', 'aR'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; }
function add(group, geos, m) {
  if (!geos.length) return;
  const gs = geos.map(clean);
  for (const k of ['aS', 'aR']) {
    if (gs.some(g => g.attributes[k])) gs.forEach(g => { if (!g.attributes[k]) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1)); });
    else gs.forEach(g => g.deleteAttribute(k));
  }
  const g = mergeGeometries(gs); const mesh = new THREE.Mesh(g, m); group.add(mesh); return mesh;
}
// parameter around the frame (0..1, by angle), written into aR = 1 + parameter (0 = not the frame)
const ringA = (x, z) => ((Math.atan2(z / (D / 2), x / (W / 2)) / (2 * Math.PI)) + 1) % 1;
const angDiff = (a, b) => { let d = a - b; d -= Math.round(d); return d; };
function withR(g) { const p = g.attributes.position, a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = 1 + ringA(p.getX(i), p.getZ(i)); g.setAttribute('aR', new THREE.BufferAttribute(a, 1)); return g; }
// write the path parameter aS into a geometry (per vertex)
function setS(g, fn) {
  const p = g.attributes.position, uv = g.attributes.uv, a = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i), uv ? uv.getX(i) : 0);
  g.setAttribute('aS', new THREE.BufferAttribute(a, 1)); return g;
}
// the U segment at one end of the mid-frame (x < xb); mirror it for the other end
function endCap(xb, t) {
  const s = new THREE.Shape(), r0 = R - t, cx = -W / 2 + R, cyT = D / 2 - R, cyB = -D / 2 + R;
  s.moveTo(xb, D / 2); s.lineTo(cx, D / 2); s.absarc(cx, cyT, R, Math.PI / 2, Math.PI); s.lineTo(-W / 2, cyB);
  s.absarc(cx, cyB, R, Math.PI, 1.5 * Math.PI); s.lineTo(xb, -D / 2); s.lineTo(xb, -D / 2 + t); s.lineTo(cx, -D / 2 + t);
  s.absarc(cx, cyB, r0, 1.5 * Math.PI, Math.PI, true); s.lineTo(-W / 2 + t, cyT); s.absarc(cx, cyT, r0, Math.PI, Math.PI / 2, true);
  s.lineTo(xb, D / 2 - t); s.lineTo(xb, D / 2); return s;
}
function flipWinding(g) {
  for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; if (!a) continue; const n = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) for (let j = 0; j < n; j++) { const t = arr[(i + 1) * n + j]; arr[(i + 1) * n + j] = arr[(i + 2) * n + j]; arr[(i + 2) * n + j] = t; } }
  return g;
}
// arc-length parameter along a polyline (0..1)
function polyParam(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1];
  return (x, z) => { let best = 1e9, bs = 0;
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const u = clamp(((x - ax) * dx + (z - az) * dz) / l2); const d = Math.hypot(ax + dx * u - x, az + dz * u - z); if (d < best) { best = d; bs = (L[i] + u * Math.sqrt(l2)) / tot; } }
    return bs; };
}

// ---------- Build the model ----------
const LAYERS = [];
function layer(name, base, idx) { const g = new THREE.Group(); g.name = name; root.add(g); const L = { g, base, idx, name }; LAYERS.push(L); return L; }
const rng = mulberry(20231004);

// 6 back cover (glass)
const Lback = layer('back', 0, 0);
{
  const g = Lback.g, th = 0.9;
  add(g, [slab(rr(W, D, R), th)], M.glass);
  const sh = rr(W - 3, D - 3, R - 1.5); sh.holes.push(rrHole(W - 5.4, D - 5.4, R - 2.7)); add(g, [slab(sh, 0.18, th)], M.metal2);
  add(g, [slab(rr(17, D - 0.6, 8, 0, 0), 2.2, -2.2).translate(48, 0, 0)], M.glassDim);
  add(g, [ring(4.2, 5.4, 0.35, 48, th, -21), ring(4.2, 5.4, 0.35, 48, th, -9), ring(1.0, 1.8, 0.3, 48, th, 1)], M.metal);
  add(g, [cyl(4.2, 0.08, 48, th, -21, 40), cyl(4.2, 0.08, 48, th, -9, 40)], M.glassDim);
  // inner graphite heat spreader + two foam pads
  add(g, [slab(rr(60, 44, 3, -14, 0), 0.08, th + 0.18)], M.flex);
  add(g, [box(10, 0.5, 6, -58, th, -22), box(10, 0.5, 6, -58, th, 22)], M.metal2);
}
// 5 wireless charging coil
const Lcoil = layer('coil', 0.9, 1);
{
  const g = Lcoil.g, cx = 2;
  add(g, [slab(rr(46, 46, 3), 0.2).translate(cx, 0, 0)], M.metal2);
  const rs = []; for (let i = 0; i < 12; i++) { const r0 = 7.5 + i * 1.05; rs.push(ring(r0, r0 + 0.7, 0.16, cx, 0.2, 0)); }
  add(g, rs, M.white);
  const nf = rr(54, 54, 4); nf.holes.push(rrHole(51, 51, 2.6)); add(g, [slab(nf, 0.14, 0.05).translate(cx, 0, 0)], M.flex);
  add(g, [box(24, 0.12, 5, cx + 36, 0.05, 6)], M.flex);
  add(g, [box(5, 0.5, 4, cx + 47, 0.17, 6)], M.mid);
}
// 4 battery
const Lbat = layer('battery', 1.3, 2);
let batTex;
{
  const g = Lbat.g, bw = 70, bd = 58, bh = 4.4, bx = -13;
  const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 1160;
  window.drawBat = () => { const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height); c.fillStyle = 'rgba(232,232,228,0.92)'; c.textBaseline = 'middle';
    c.save(); c.translate(cv.width / 2, cv.height / 2);
    c.font = `500 64px ${MONO}`; c.fillText('Li-ion POLYMER', -560, -160);
    c.font = `500 160px ${MONO}`; c.fillText('4575 mAh', -560, 10);
    c.font = `400 56px ${MONO}`; c.fillText('TYPICAL · MIN 4485 mAh', -560, 175);
    c.restore();
    c.strokeStyle = 'rgba(232,232,228,0.55)'; c.lineWidth = 5; c.strokeRect(60, 60, cv.width - 120, cv.height - 120);
    if (batTex) batTex.needsUpdate = true; };
  batTex = new THREE.CanvasTexture(cv); batTex.colorSpace = THREE.NoColorSpace; batTex.anisotropy = 8;
  const geo = new RoundedBoxGeometry(bw, bh, bd, 3, 1.4); geo.translate(bx, bh / 2, 0);
  g.add(new THREE.Mesh(geo, mat(0x4a4a49, 0)));
  const pl = new THREE.PlaneGeometry(bw - 6, bd - 6); pl.rotateX(-Math.PI / 2); pl.translate(bx, bh + 0.01, 0);
  const pmesh = new THREE.Mesh(pl, mat(0x4a4a49, 0, batTex)); pmesh.userData.noND = true; g.add(pmesh);
  add(g, [box(4, 0.1, 22, bx - bw / 2 - 1.5, 0.3, -12), box(4, 0.1, 22, bx - bw / 2 - 1.5, 0.3, 12)], M.white);
  add(g, [box(14, 0.15, 6, bx + bw / 2 + 5, 2.6, -20)], M.flex);
  add(g, [box(4.5, 0.7, 5, bx + bw / 2 + 11, 2.6, -20)], M.mid);
}
// 3 main board + sub-board + antenna path (coax, traces, feed spring contact)
const Lboard = layer('board', 1.6, 2);
const P = {};
{
  const g = Lboard.g, th = 0.8, top = th;
  const mb = rr(49, 62, 3, 48.5, 0); mb.holes.push(rrHole(13, 24, 3, 58, 13));
  add(g, [slab(mb, th)], M.board);
  add(g, [slab(rr(21, 60, 2.5, -62.5, 0), th)], M.board);
  // shield can: frame + lid + vent-hole array on the lid
  const shields = [
    { x: 38, z: 1, w: 17, d: 15, h: 1.3 }, { x: 40.5, z: 18.5, w: 12, d: 9, h: 1.15 },
    { x: 61.5, z: 20, w: 12, d: 13, h: 1.2 }, { x: 66, z: -6, w: 9, d: 8, h: 1.0 },
  ];
  const sg = [], sl = [], sd = [];
  for (const s of shields) {
    sg.push(box(s.w, s.h, s.d, s.x, top, s.z));
    sl.push(box(s.w - 1.6, 0.08, s.d - 1.6, s.x, top + s.h, s.z));
    const nx = Math.floor((s.w - 3) / 1.3), nz = Math.floor((s.d - 3) / 1.3);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if ((i + j) % 2 === 0 && !(i > 1 && i < nx - 2 && j > 1 && j < nz - 2)) sd.push(cyl(0.28, 0.1, s.x - (nx - 1) * 0.65 + i * 1.3, top + s.h, s.z - (nz - 1) * 0.65 + j * 1.3, 8));
  }
  add(g, sg, M.metal); add(g, sl, M.white); add(g, sd, M.dark);
  // board-to-board connector (with pins)
  const conDefs = [[9, 3.2, 31, -16], [3.2, 8, 71, 14.5], [7, 3.2, 47, 28], [3.2, 6, -54.5, -20], [3.2, 7, 26.5, -27]];
  add(g, conDefs.map(([w, d, x, z]) => box(w, 1.0, d, x, top, z)), M.mid);
  const pins = [];
  for (const [w, d, x, z] of conDefs) { const along = w > d ? w : d, n = Math.floor((along - 1.2) / 0.5);
    for (let i = 0; i < n; i++) { const o = -along / 2 + 0.6 + i * 0.5 + 0.25; pins.push(w > d ? box(0.18, 0.06, d - 1.0, x + o, top + 1.0, z) : box(w - 1.0, 0.06, 0.18, x, top + 1.0, z + o)); } }
  add(g, pins, M.dark);
  // camera module (sitting in the main-board cut-out) + flex cable
  add(g, [box(11.5, 5.4, 11.5, 58, -2.0, -19), box(11.5, 5.4, 10.5, 58, -2.0, -7.2)], M.metal);
  add(g, [cyl(3.6, 0.3, 58, 3.4, -19, 32), cyl(3.4, 0.3, 58, 3.4, -7.2, 32)], M.metal2);
  add(g, [box(6, 0.12, 9, 66, 3.0, -12.5)], M.flex);
  // screws
  const scr = [[26, -29], [26, 29.5], [71, 29], [71, -29], [-55, -28], [-55, 12]];
  add(g, scr.map(([x, z]) => cyl(1.15, 0.55, x, top, z, 24)), M.metal);
  add(g, scr.flatMap(([x, z]) => [box(1.5, 0.08, 0.3, x, top + 0.55, z), box(0.3, 0.08, 1.5, x, top + 0.55, z)]), M.dark);
  // sub-board: USB-C socket, speaker, microphone
  add(g, [box(7.5, 3.2, 9, -69, top, 0)], M.metal);
  add(g, [box(0.3, 2.2, 7.2, -72.8, top + 0.5, 0)], M.dark);
  add(g, [box(10, 3.0, 15, -63, top, -19), box(4, 1.1, 4, -58, top, 7)], M.metal2);
  add(g, [box(8, 0.1, 13, -63, top + 3.0, -19)], M.white);
  // main flex between main board and sub-board (along the -z side)
  add(g, [box(76, 0.12, 4.2, -14, 0.9, -31.6), box(4.2, 0.12, 6, 24, 0.9, -29.5), box(4.2, 0.12, 8, -52.5, 0.9, -28.5)], M.flex);
  // small components scattered at random (main board + sub-board), avoiding keep-out zones
  const reserved = shields.map(s => [s.x - s.w / 2 - .4, s.x + s.w / 2 + .4, s.z - s.d / 2 - .4, s.z + s.d / 2 + .4])
    .concat(conDefs.map(([w, d, x, z]) => [x - w / 2 - .4, x + w / 2 + .4, z - d / 2 - .4, z + d / 2 + .4]))
    .concat([[69, 73, 9, 20], [51, 65, -26, 0.5], [23, 35, 16, 32], [69, 74, 25, 32], [69, 74, -32, -25], [23, 29, -32, -26],
      [-74, -64, -5, 5], [-68.5, -57.5, -27, -11], [-60.5, -55.5, 4.5, 9.5], [-58, -52, -31, -25], [-58, -52, 9, 15],
      [-60, -52, 24, 31], [-73, -64, 26, 31], [-66, -54, 26.5, 29.5], [25, 34, -12, 30]]);
  const placed = [];
  const free = (a) => ![...reserved, ...placed].some(b => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2]);
  const pas = [], ic = [], ind = [], pads = [];
  const areas = [[24.6, 72.4, -30.4, 30.4, 560], [-72.4, -52.6, -29.4, 29.4, 220]];
  for (const [x0, x1, z0, z1, n] of areas) {
    let tries = 0, k = 0;
    while (k < n && tries < n * 30) {
      tries++;
      const r = rng(); let w, d, h, list;
      if (r < 0.78) { w = 0.6 + rng() * 0.7; d = w * (0.45 + rng() * 0.2); h = 0.32; list = pas; if (rng() < .5) [w, d] = [d, w]; }
      else if (r < 0.94) { w = 1.6 + rng() * 2.6; d = w * (0.7 + rng() * 0.5); h = 0.55; list = ic; }
      else { w = 1.8 + rng() * 1.2; d = w; h = 1.0; list = ind; }
      const x = x0 + w / 2 + rng() * (x1 - x0 - w), z = z0 + d / 2 + rng() * (z1 - z0 - d);
      const a = [x - w / 2 - .3, x + w / 2 + .3, z - d / 2 - .3, z + d / 2 + .3];
      if (!free(a)) continue;
      placed.push(a); list.push(box(w, h, d, x, top, z)); k++;
      if (list === ic && w > 2.6) pads.push(cyl(0.22, 0.05, x - w / 2 + 0.5, top + h, z - d / 2 + 0.5, 8));   // pin 1 marker
    }
  }
  add(g, pas, M.pas); add(g, ic, M.chip); add(g, ind, M.mid); add(g, pads, M.white);
  // test points, fiducials
  const tps = []; for (let i = 0; i < 26; i++) { const x = 25 + rng() * 47, z = -30 + rng() * 60; if (free([x - .6, x + .6, z - .6, z + .6])) { tps.push(ring(0.35, 0.6, 0.04, x, top, z)); placed.push([x - .6, x + .6, z - .6, z + .6]); } }
  add(g, tps, M.metal);

  // —— antenna path (accent colour, aS = position along the path 0..1): RF transceiver → board trace → coax socket → coax → sub-board trace → feed spring contact → mid-frame antenna segment
  const tr = (pts, s0, s1, w = 0.75) => { const f = polyParam(pts), gs = [];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const L = Math.hypot(bx - ax, bz - az);
      const m = box(L + w, 0.06, w, 0, 0, 0); m.rotateY(-Math.atan2(bz - az, bx - ax)); m.translate((ax + bx) / 2, top, (az + bz) / 2);
      gs.push(setS(m, (x, y, z) => lerp(s0, s1, f(x, z)))); }
    return gs; };
  const acc = [];
  acc.push(...tr([[34.5, 18.5], [27.5, 18.5], [27.5, 26]], 0.0, 0.14));
  acc.push(setS(box(3.0, 0.7, 3.0, 27.5, top, 27.5), () => 0.145), setS(cyl(0.9, 0.5, 27.5, top + 0.7, 27.5, 20), () => 0.155));
  const cpts = [[27.5, 1.9, 27.5], [25.5, 1.9, 30.2], [20, 1.4, 31.6], [0, 1.3, 31.9], [-30, 1.3, 31.9], [-48, 1.4, 31.6], [-54, 1.9, 30.2], [-56, 1.9, 28]].map(p => new THREE.Vector3(...p));
  const coax = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpts, false, 'catmullrom', 0.3), 200, 0.55, 14, false);
  acc.push(setS(coax, (x, y, z, u) => lerp(0.16, 0.62, u)));
  acc.push(setS(box(3.0, 0.7, 3.0, -56, top, 28), () => 0.625), setS(cyl(0.9, 0.5, -56, top + 0.7, 28, 20), () => 0.625));
  acc.push(...tr([[-57.5, 28], [-64, 28], [-68, 29.5]], 0.63, 0.70));
  acc.push(setS(box(2.6, 0.5, 2.2, -69, top, 29.6), () => 0.71));
  { const arm = box(3.6, 0.3, 1.4, 0, 0, 0); arm.rotateZ(0.55); arm.translate(-69, top + 1.3, 29.6); acc.push(setS(arm, (x) => lerp(0.715, 0.74, clamp((x + 70.5) / 3)))); }
  add(g, acc, M.accB);
  P.rf = [40.5, top + 1.15, 18.5]; P.feed = [-69, top + 2.2, 29.6]; P.coaxMid = [-10, 1.3, 31.9]; P.soc = [38, top + 1.3, 4];
  P.mbc = [27.5, top + 1.2, 27.5]; P.sbc = [-56, top + 1.2, 28]; P.cam = [58, 3.7, -13];
}
// 2 mid-frame (aluminium alloy) + mid-plate
const Lframe = layer('frame', 0.9, 3);
{
  const g = Lframe.g, bh = 6.5, xb = -W / 2 + 24, xb2 = W / 2 - 22;
  // bottom U segment (antenna segment): path parameter = distance along the frame from the feed point
  const cx = -W / 2 + R, cz = D / 2 - R, L1 = xb - cx, A = Math.PI / 2 * R, S = D - 2 * R;
  const perim = (x, z) => {
    if (x >= cx) return z > 0 ? (xb - x) : (L1 + 2 * A + S + (x - cx));
    if (z > cz) return L1 + Math.atan2(cx - x, z - cz) * R;
    if (z < -cz) return L1 + A + S + Math.atan2(-cz - z, cx - x) * R;
    return L1 + A + (cz - z);
  };
  const pf = perim(-69, D / 2 - T), maxd = Math.max(pf, 2 * L1 + 2 * A + S - pf);
  const uSeg = slab(endCap(xb - 0.5, T), bh);
  // endCap's +y shape edge is at world -z; mirror it to the +z side so the feed point lands on the side-button side
  uSeg.scale(1, 1, -1); flipWinding(uSeg);
  add(g, [withR(setS(uSeg, (x, y, z) => 0.78 + 0.22 * Math.abs(perim(x, z) - pf) / maxd)),
          setS(box(2.4, 2.2, 0.5, -69, 1.0, D / 2 - T - 0.25), () => 0.76)], M.accF);
  // top U segment (the other antenna, metal colour)
  { const s = endCap(-(xb2 + 0.5), T); const gg = slab(s, bh); gg.scale(-1, 1, 1); flipWinding(gg);
    const fa = ringA(69, D / 2 - T); let mx = 0; const p = gg.attributes.position;
    for (let i = 0; i < p.count; i++) mx = Math.max(mx, Math.abs(angDiff(ringA(p.getX(i), p.getZ(i)), fa)));
    add(g, [withR(setS(gg, (x, y, z) => 0.78 + 0.22 * Math.abs(angDiff(ringA(x, z), fa)) / mx)), setS(box(2.4, 2.2, 0.5, 69, 1.0, D / 2 - T - 0.25), () => 0.76)], M.accT); }
  const L = (xb2 - 0.5) - (xb + 0.5), cxs = (xb + xb2) / 2;
  add(g, [withR(box(L, bh, T, cxs, 0, D / 2 - T / 2)), withR(box(L, bh, T, cxs, 0, -D / 2 + T / 2))], M.metalR);
  // breaks (injection-moulded)
  const slit = (x, sz) => withR(box(1, bh - 0.3, T - 0.2, x, 0.15, sz * (D / 2 - T / 2 - 0.1)));   // inset 0.2 mm so the tracing can separate the slit
  add(g, [slit(xb, 1), slit(xb, -1), slit(xb2, 1), slit(xb2, -1)], M.plastic);
  P.slits = [[xb, 1], [xb, -1], [xb2, 1], [xb2, -1]];
  // mid-plate: cut-outs, speaker-hole array
  const mp = rr(W - 2 * T + 0.2, D - 2 * T + 0.2, R - T);
  mp.holes.push(rrHole(14, 25, 3, 57.5, 12.5), rrHole(36, 13, 3, -6, 10), rrHole(18, 10, 2.5, -36, -14), rrHole(14, 9, 2.5, 30, -16), rrHole(9, 22, 2.5, -58, 0),
    rrHole(22, 3, 1.5, -6, -6), rrHole(3, 16, 1.5, 12, -18));
  for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) mp.holes.push(circHole(0.7, -44 + i * 2.2, -24.5 + j * 2.2));
  add(g, [slab(mp, 0.6, 4.2, 14)], M.metal).userData.mid = true;
  // inner rim of the screen seat
  const lip = rr(W - 2 * T + 0.2, D - 2 * T + 0.2, R - T); lip.holes.push(rrHole(W - 2 * T - 2.2, D - 2 * T - 2.2, R - T - 1.2));
  add(g, [slab(lip, 0.5, 6.0, 24)], M.metal2).userData.mid = true;
  const rib = [box(0.6, 0.9, 50, -22, 4.8, 0), box(0.6, 0.9, 50, 16, 4.8, 0), box(46, 0.9, 0.6, 46, 4.8, 24), box(30, 0.9, 0.6, -50, 4.8, -24), box(0.6, 0.9, 20, -30, 4.8, 18)];
  add(g, rib, M.metal2).userData.mid = true;
  const boss = [[-66, 26], [-66, -26], [-44, 26], [-44, -26], [66, 26], [66, -26], [44, 28.5], [10, 28.5], [10, -28.5], [-20, 28.5], [-20, -28.5], [30, -28.5]];
  add(g, boss.map(([x, z]) => cyl(1.7, 1.3, x, 4.8, z, 24)), M.metal).userData.mid = true;
  add(g, boss.map(([x, z]) => cyl(0.75, 0.05, x, 6.1, z, 16)), M.dark).userData.mid = true;
  // side buttons (+Z side), SIM tray (-Z side), USB-C opening, speaker holes
  add(g, [slab(rr(9, 2.4, 1.2), 0.7, 0).rotateX(Math.PI / 2).translate(34, 3.2, D / 2 + 0.7), slab(rr(16, 2.4, 1.2), 0.7, 0).rotateX(Math.PI / 2).translate(14, 3.2, D / 2 + 0.7)], M.metal2);
  add(g, [box(15, 2.6, 0.12, -24, 1.9, -D / 2 - 0.02), cyl(0.45, 0.14, 0, 0, 0, 12).rotateX(Math.PI / 2).translate(-33.5, 3.2, -D / 2 - 0.05)], M.dark);
  add(g, [box(0.2, 3.0, 8.6, -W / 2 - 0.05, 1.8, 0)], M.dark);
  const hol = []; for (let i = 0; i < 5; i++) { hol.push(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 12).rotateZ(Math.PI / 2).translate(-W / 2 - 0.05, 3.3, -12 - i * 2)); hol.push(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 12).rotateZ(Math.PI / 2).translate(-W / 2 - 0.05, 3.3, 12 + i * 2)); }
  add(g, hol, M.dark);
  P.pad = [-69, 2.1, D / 2 - T - 0.5]; P.xb = xb; P.xb2 = xb2; P.uMid = [-W / 2 + 0.2, 4.0, -6];
}
// 1 display (cover glass + OLED + under-screen flex)
const Ldisp = layer('display', 7.4, 4);
{
  const g = Ldisp.g;
  add(g, [slab(rr(W, D, R), 1.5)], M.glass);
  add(g, [slab(rr(W - 3.6, D - 3.6, R - 1.8), 0.1, 1.5)], M.glassDim);
  add(g, [cyl(1.6, 0.14, W / 2 - 7.2, 1.5, 0, 28)], M.chip);
  add(g, [box(0.8, 0.12, 12, W / 2 - 2.6, 1.5, 0)], M.dark);                      // earpiece slit
  add(g, [slab(rr(W - 4.5, D - 4.5, R - 2.2), 0.35, -0.35)], M.oled);              // OLED panel (under the glass)
  add(g, [box(8, 0.15, 18, -W / 2 + 12, -0.5, -6), box(6, 0.6, 4, -W / 2 + 12, -1.0, -16)], M.flex);
}


// ---------- Hand (a diagrammatic hand as in a product manual: thin outline, light flat fill; built in phone-local coordinates, turns with the phone) ----------
// Each phalanx is a tapered frustum with a slightly larger ball at the joint, so tracing naturally draws a thin line at each knuckle, like knuckle segments; the distal phalanx gets a nail.
// The palm sits behind the back cover (y < 0), four fingers wrap round the edge from the +z side with fingertips resting on the screen edge; the thumb wraps the frame from the -z side. The wrist fades out of frame (faded along a screen direction at compositing).
const handG = new THREE.Group(); root.add(handG);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const Y_UP = new THREE.Vector3(0, 1, 0);
function bone(a, b, r0, r1, open = true) {                      // frustum a → b (radius r0 at a, r1 at b)
  const v = new THREE.Vector3().subVectors(b, a), L = v.length();
  const g = new THREE.CylinderGeometry(r1, r0, L, 18, 1, open);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y_UP, v.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return g;
}
const ball = (p, r) => new THREE.SphereGeometry(r, 18, 12).translate(p.x, p.y, p.z);
function nail(a, b, n, r) {                                     // nail on the back of the distal phalanx: a thin rounded plate
  const dir = new THREE.Vector3().subVectors(b, a).normalize(), side = new THREE.Vector3().crossVectors(dir, n).normalize();
  const sh = rr(r * 1.25, r * 1.55, r * 0.5);                   // width × length
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false, curveSegments: 8 });
  const m = new THREE.Matrix4().makeBasis(side, dir, n);
  const c = a.clone().lerp(b, 0.62).addScaledVector(n, r * 0.9);
  g.applyMatrix4(m); g.translate(c.x, c.y, c.z); return g;
}
// one finger: joint points p[0..3], radii r[0..3]; n = direction of the finger's back (nail facing out)
function crease(a, b, at, r) {                                  // a thin ridge round the knuckle: tracing draws the knuckle segments
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  const g = new THREE.TorusGeometry(r, Math.max(0.22, r * 0.06), 6, 28);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)); g.translate(at.x, at.y, at.z); return g;
}
function digit(gs, p, r, n) {
  for (let k = 0; k < 3; k++) gs.push(bone(p[k], p[k + 1], r[k], r[k + 1]));
  for (let k = 1; k < 3; k++) { gs.push(ball(p[k], r[k])); gs.push(crease(p[k - 1], p[k + 1], p[k], r[k] * 1.01)); }   // knuckles + segment lines
  const tip = ball(p[3], r[3]); const d = new THREE.Vector3().subVectors(p[3], p[2]).normalize();
  tip.translate(-p[3].x, -p[3].y, -p[3].z); tip.applyMatrix4(new THREE.Matrix4().makeScale(1 + 0.25 * Math.abs(d.x), 1 + 0.25 * Math.abs(d.y), 1 + 0.25 * Math.abs(d.z))); tip.translate(p[3].x, p[3].y, p[3].z);
  gs.push(tip);                                                     // fingertip slightly elongated, not a ball
  gs.push(nail(p[2], p[3], n, r[3]));
}
// direction of the distal phalanx's back: in the y-z plane, perpendicular to the distal phalanx, facing away from the phone (ref is a point in the phone)
function outward(a, b, ref) {
  const d = new THREE.Vector3().subVectors(b, a); const n = V3(0, d.z, -d.y).normalize();
  const m = a.clone().lerp(b, 0.5).sub(ref); if (n.dot(m) < 0) n.negate(); return n;
}
const FINGERS = [{ x: -37, s: 0.97, k: 0.0 }, { x: -50.5, s: 1.0, k: 0.4 }, { x: -63.5, s: 0.96, k: 0.8 }, { x: -76, s: 0.84, k: 1.4 }];
const palmGeo = new RoundedBoxGeometry(62, 11, 60, 4, 5).translate(-60, -12.5, 0);
function buildHand(curl, slide) {
  for (const m of handG.children) m.geometry.dispose();
  handG.clear();
  const gs = [palmGeo.clone()];
  const c = ss(curl);
  const lerpPts = (o, s) => o.map((v, k) => v.clone().lerp(s[k], c));
  FINGERS.forEach(({ x, s, k }) => {
    const e = D / 2;
    const open = [V3(x, -10, e - 9), V3(x, -11, e + 9 * s), V3(x, -12, e + 23 * s), V3(x, -12.5, e + 35 * s)];
    const shut = [V3(x, -10, e - 9), V3(x, -4.5, e + 6.6), V3(x, 8.0 - k, e + 6.4), V3(x, 13.2 - k * 0.6, e - 2.6 * s - k)];
    const p = lerpPts(open, shut);
    digit(gs, p, [4.8 * s, 4.3 * s, 3.85 * s, 3.45 * s], outward(p[2], p[3], V3(x, 4.45, D / 2 - 6)));
  });
  // thumb: starts at the heel of the palm, comes up along the -z side, pad pressing the frame, tip resting on the screen edge
  const e = -D / 2;
  const to = [V3(-72, -10, e + 10), V3(-60, -8, e - 4.5), V3(-45, 0.5, e - 6.4), V3(-34, 13.2, e + 1.0)];
  const tc = [V3(-72, -10, e + 10), V3(-60, -12, e - 9), V3(-48, -16, e - 19), V3(-38, -18, e - 28)];
  const tp = tc.map((v, k) => v.clone().lerp(to[k], c));
  digit(gs, tp, [6.0, 5.2, 4.6, 4.1], outward(tp[2], tp[3], V3(-40, 4.45, -D / 2 + 6)));
  gs.push(ball(V3(-70, -10, e + 9), 9.5).scale(1, 0.8, 1));                          // flesh at the base of the thumb
  gs.push(bone(V3(-88, -12.5, 0), V3(-140, -15, 0), 23, 25, false));                        // wrist (faded out at compositing)
  add(handG, gs, M.hand);
  handG.position.set(-slide, -slide * 0.25, 0);
}
// wrist fade: on screen, fade the 3D layer's alpha from A (heel of the palm) to B (out of frame)
const HAND_FADE = [[-80, -12, 0], [-108, -14, 0]];

// ---------- Scene state (everything at whole-film time t is computed here, so any frame renders on its own) ----------
const GAP = 27, SHIFT = 6;
function settle(u) { if (u <= 0) return 0; if (u >= 1) return 1; return eio(Math.min(1, u / 0.78)) + Math.sin(Math.PI * seg(u, 0.62, 1)) * 0.025; }
const ORDER = ['display', 'frame', 'board', 'battery', 'coil'];
const Q_UP = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, Math.PI / 2, 'XYZ'));
const Q_FLAT = new THREE.Quaternion();
function uprightAt(t) { return 1 - eio(seg(t, K.tipFlat[0], K.tipFlat[1])) + eio(seg(t, K.standUp[0], K.standUp[1])); }
function explodeOf(name, t) {
  const i = ORDER.indexOf(name); if (i < 0) return 0;
  const k = name === 'battery' ? 2 : Math.min(i, 3);
  const up = settle(seg(t, K.lift + k * K.liftStep, K.lift + k * K.liftStep + K.liftDur));
  const r0 = K.rejoin[0] + (4 - i) * 0.12;
  return up * (1 - eio(seg(t, r0, r0 + 0.75)));
}
function dropOf(name, t) {   // layers other than the mid-frame sink out of frame, and rise back when it closes up
  if (name === 'frame') return 0;
  const i = Math.max(0, ORDER.indexOf(name));
  const d = ei(seg(t, K.drop[0] + i * 0.07, K.drop[0] + i * 0.07 + 0.9));
  const back_ = eo(seg(t, K.rejoin[0] - 0.1 + i * 0.06, K.rejoin[0] + 0.7 + i * 0.06));
  return 260 * d * (1 - back_);
}
let STATE = {};
function setScene(t) {
  root.quaternion.copy(Q_FLAT).slerp(Q_UP, clamp(uprightAt(t)));
  root.updateMatrixWorld(true);
  for (const L of LAYERS) {
    const e = explodeOf(L.name, t), dr = dropOf(L.name, t);
    L.g.position.set(e * L.idx * SHIFT, L.base + e * L.idx * GAP - dr, 0);
    L.g.visible = dr < 250; L.e = e;
  }
  root.updateMatrixWorld(true);
  // path
  const flood = eo(seg(t, K.flood[0], K.flood[1])), drain = eio(seg(t, K.drain[0], K.drain[1]));
  CTL_B.uUmax.value = 0.78 + 0.225 * flood * (1 - drain);
  const a = seg(t, K.path[0], K.path[1]);
  CTL_B.uPath.value = t < K.path[0] ? 0 : 0.78 * (0.45 * a + 0.55 * ss(a));
  CTL_T.uUmax.value = 0.78 + 0.225 * eo(seg(t, K.topFlood[0], K.topFlood[1]));
  const tr = seg(t, K.trace[0], K.trace[1]);
  U.uTrace.value = tr > 0 && tr < 1 ? (0.5 + eio(tr) * 1.0) % 1 : -1;     // starts at the bottom and goes once round
  // hand
  const h1 = eo(seg(t, K.hand1[0], K.hand1[1])) * (1 - ei(seg(t, K.handOut[0], K.handOut[1])));
  const h2 = eo(seg(t, K.hand2[0], K.hand2[1]));
  const hv = Math.max(h1, h2);
  const curl = t < 20 ? seg(t, K.curl1[0], K.curl1[1]) * (1 - seg(t, K.handOut[0], K.handOut[0] + 0.5)) : seg(t, K.curl2[0], K.curl2[1]);
  handG.visible = hv > 0.001;
  if (handG.visible) buildHand(curl, (1 - hv) * 170);
  rebuildGuides(t);
  STATE = { t, upright: uprightAt(t) };
}

// ---------- Assembly dashes (tone layer only, not traced; grow over time, turn with the phone) ----------
const guides = new THREE.Group(); root.add(guides);
const GUIDE = 2;
const gMat = new THREE.LineDashedMaterial({ color: 0x8f8e8a, dashSize: 1.6, gapSize: 1.2 });
const gMatA = new THREE.LineDashedMaterial({ color: ACC_GL, dashSize: 1.2, gapSize: 0.9 });
function rebuildGuides(t) {
  for (const l of guides.children) l.geometry.dispose();
  guides.clear();
  const grow = eo(seg(t, K.lift + 0.1, K.lift + 1.6)) * (1 - seg(t, K.drop[0], K.drop[0] + 0.4));
  if (grow > 0) {
    const pts = [[-W / 2 + R * 0.3, D / 2 - R * 0.3], [W / 2 - R * 0.3, D / 2 - R * 0.3], [-W / 2 + R * 0.3, -D / 2 + R * 0.3], [W / 2 - R * 0.3, -D / 2 + R * 0.3], [26, -29], [26, 29.5], [71, 29], [-55, -28]];
    const topY = Ldisp.g.position.y + 9, ax = Ldisp.g.position.x;
    for (const [x, z] of pts) {
      const a = V3(x - 0.8, -4, z), b = V3(x + ax * (topY + 4) / (4 * GAP + 13), topY, z);
      const geo = new THREE.BufferGeometry().setFromPoints([a, a.clone().lerp(b, grow)]);
      const l = new THREE.Line(geo, gMat); l.computeLineDistances(); l.layers.set(GUIDE); guides.add(l);
    }
  }
  const pa = seg(CTL_B.uPath.value, 0.735, 0.775) * (1 - seg(t, K.drop[0], K.drop[0] + 0.3));
  if (pa > 0 && Lboard.g.visible) {
    const a = lp3(Lboard, P.feed), b = lp3(Lframe, P.pad);
    const geo = new THREE.BufferGeometry().setFromPoints([a, a.clone().lerp(b, pa)]);
    const l = new THREE.Line(geo, gMatA); l.computeLineDistances(); l.layers.set(GUIDE); guides.add(l);
  }
}
const lp3 = (L, p) => V3(...p).add(L.g.position);                         // layer coordinates → phone-local coordinates
const wp = (L, p) => V3(...p).applyMatrix4(L.g.matrixWorld);              // layer coordinates → world coordinates
const loc = (p) => V3(...p).applyMatrix4(root.matrixWorld);               // phone-local coordinates → world coordinates

// ---------- Post: tracing + downsampled accumulation ----------
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeo = new THREE.PlaneGeometry(2, 2);
const VQ = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const edgeMat = new THREE.ShaderMaterial({
  uniforms: { tC: { value: null }, tN: { value: null }, px: { value: new THREE.Vector2() }, rS: { value: 2.7 }, rO: { value: 1.7 }, rC: { value: 1.05 }, thD: { value: 0.0016 }, thO: { value: 0.012 }, thN: { value: 0.12 } },
  vertexShader: VQ,
  fragmentShader: `
  uniform sampler2D tC, tN; uniform vec2 px; uniform float rS, rO, rC, thD, thO, thN; varying vec2 vUv;
  float iz(vec4 s){ return s.a>0. ? 1./s.a : 0.; }
  void main(){
    vec4 c = texture2D(tC, vUv); vec4 n0 = texture2D(tN, vUv); float z0 = iz(n0); bool f0 = n0.a > 0.;
    float hf = abs(c.a - .5) < .2 ? 1. : 0.;
    float dS = 99.;
    for(int i=0;i<16;i++){
      float a = float(i)*0.392699; vec2 d = vec2(cos(a), sin(a));
      for(int k=1;k<=4;k++){ float r = float(k)*rS*0.3; vec2 o = vUv + d*px*r; vec4 s = texture2D(tN, o);
        if((s.a>0.) != f0){ dS = min(dS, r); }
        if(k<=2){ float ca = texture2D(tC, o).a; if(abs(ca - .5) < .2) hf = 1.; } }
    }
    float eS = hf > .5 ? 1. - smoothstep(rS*0.3, rS*0.62, dS) : 1. - smoothstep(rS*0.62, rS*1.12, dS);
    float eO = 0., eC = 0.;
    vec2 dirs[4]; dirs[0]=vec2(1.,0.); dirs[1]=vec2(0.,1.); dirs[2]=vec2(.7071,.7071); dirs[3]=vec2(.7071,-.7071);
    for(int i=0;i<4;i++){
      vec4 a = texture2D(tN, vUv + dirs[i]*px*rO), b = texture2D(tN, vUv - dirs[i]*px*rO);
      if(f0 && a.a>0. && b.a>0.){
        float za = iz(a), zb = iz(b), m = max(z0, max(za, zb));
        eO = max(eO, smoothstep(thO, thO*1.8, abs(za + zb - 2.*z0) / m));
      }
      vec4 a2 = texture2D(tN, vUv + dirs[i]*px*rC), b2 = texture2D(tN, vUv - dirs[i]*px*rC);
      if(f0 && a2.a>0. && b2.a>0.){
        float za = iz(a2), zb = iz(b2), m = max(z0, max(za, zb));
        eC = max(eC, smoothstep(thD, thD*2.2, abs(za + zb - 2.*z0) / m));
        eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, a2.xyz)));
        eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, b2.xyz)));
      }
    }
    vec3 inkS = vec3(.078), inkO = vec3(.11), inkC = vec3(.25);
    float wS = eS, wO = eO*.95, wC = eC*.78;
    if(hf > .5){ wO *= .8; wC *= .75; inkS = vec3(.30); inkO = vec3(.36); inkC = vec3(.52); }
    float e = max(wS, max(wO, wC));
    vec3 ink = wS >= max(wO, wC) ? inkS : (wO >= wC ? inkO : inkC);
    vec3 col = mix(c.rgb, ink, e);
    float al = max(c.a > .01 ? 1. : 0., e);
    gl_FragColor = vec4(col*al, al);
  }`, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
const downMat = new THREE.ShaderMaterial({
  uniforms: { tE: { value: null }, px: { value: new THREE.Vector2() }, w: { value: 1 } },
  vertexShader: VQ,
  fragmentShader: `
  uniform sampler2D tE; uniform vec2 px; uniform float w; varying vec2 vUv;
  void main(){
    vec4 s = texture2D(tE, vUv + px*vec2(.5,.5)) + texture2D(tE, vUv + px*vec2(-.5,.5)) + texture2D(tE, vUv + px*vec2(.5,-.5)) + texture2D(tE, vUv + px*vec2(-.5,-.5));
    gl_FragColor = s*.25*w;
  }`, depthTest: false, depthWrite: false, transparent: true,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
const copyMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: null }, circ: { value: new THREE.Vector3() }, size: { value: new THREE.Vector2() }, fadeA: { value: new THREE.Vector2() }, fadeB: { value: new THREE.Vector2() }, fadeOn: { value: 0 } }, vertexShader: VQ,
  fragmentShader: `uniform sampler2D tA; uniform vec3 circ; uniform vec2 size; uniform vec2 fadeA, fadeB; uniform float fadeOn; varying vec2 vUv;
  void main(){ vec4 s = texture2D(tA, vUv); s = vec4(min(s.rgb, vec3(s.a)), min(s.a, 1.));
    if(fadeOn > .5){ vec2 p = vec2(vUv.x, 1. - vUv.y)*size; vec2 ab = fadeB - fadeA; float u = dot(p - fadeA, ab) / dot(ab, ab); s *= 1. - smoothstep(0., 1., u); }
    if(circ.z > 0.){ float d = distance(vUv*size, circ.xy); if(d > circ.z) discard;
      vec3 paper = vec3(.965,.961,.941); gl_FragColor = vec4(s.rgb + paper*(1.-s.a), 1.); return; }
    gl_FragColor = s; }`,
  depthTest: false, depthWrite: false, blending: THREE.NoBlending });
const quad = new THREE.Mesh(quadGeo, edgeMat); const quadScene = new THREE.Scene(); quadScene.add(quad);
const RT = {};
function targets(key, w, h) {
  if (RT[key]) return RT[key];
  const lin = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  RT[key] = {
    c: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.UnsignedByteType, ...lin }),
    n: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }),
    e: new THREE.WebGLRenderTarget(w * SS, h * SS, { type: THREE.UnsignedByteType, ...lin }),
    a: new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, ...lin }),
  };
  return RT[key];
}
function pass(t, cam, opt, wgt) {
  renderer.clippingPlanes = opt.clip || [];
  U.uMode.value = 1; cam.layers.set(0);
  scene.traverse(o => { if (o.userData.noND) o.visible = false; });
  renderer.setRenderTarget(t.n); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  scene.traverse(o => { if (o.userData.noND) o.visible = true; });
  U.uMode.value = 0; cam.layers.set(0); if (opt.guides) cam.layers.enable(GUIDE);
  renderer.setRenderTarget(t.c); renderer.setClearColor(0xffffff, 0); renderer.clear(); renderer.render(scene, cam);
  renderer.clippingPlanes = [];
  quad.material = edgeMat; edgeMat.uniforms.tC.value = t.c.texture; edgeMat.uniforms.tN.value = t.n.texture;
  edgeMat.uniforms.px.value.set(1 / t.c.width, 1 / t.c.height);
  renderer.setRenderTarget(t.e); renderer.clear(); renderer.render(quadScene, quadCam);
  quad.material = downMat; downMat.uniforms.tE.value = t.e.texture; downMat.uniforms.px.value.set(1 / t.e.width, 1 / t.e.height); downMat.uniforms.w.value = wgt;
  renderer.setRenderTarget(t.a); renderer.render(quadScene, quadCam);
}
const JOFF = [[-0.125, -0.375], [0.375, -0.125], [0.125, 0.375], [-0.375, 0.125], [0, 0], [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25]];
const SHUTTER = 0.12 / 24;
// rect: screen pixels (origin top left); setup(dt, jitter) poses the scene and returns the camera
function renderView(key, rect, setup, opt = {}) {
  const t = targets(`${key}-${rect.w}x${rect.h}`, rect.w, rect.h);     // targets cached by size: as the magnifier grows it can't reuse a smaller target
  renderer.setRenderTarget(t.a); renderer.setClearColor(0x000000, 0); renderer.clear();
  for (let k = 0; k < JIT; k++) {
    const dt = JIT > 1 ? (k / (JIT - 1) - 0.5) * SHUTTER : 0;
    const r = setup(dt, JOFF[k % JOFF.length]);
    pass(t, r.cam, { ...opt, clip: r.clip || [] }, 1 / JIT);
  }
  quad.material = copyMat; copyMat.uniforms.tA.value = t.a.texture;
  copyMat.uniforms.fadeOn.value = 0;
  if (opt.handFade && handG.visible) {             // heel of the palm in screen coordinates (origin top left) → out-of-frame direction
    const a = proj(V3(...HAND_FADE[0]).applyMatrix4(handG.matrixWorld)), b = proj(V3(...HAND_FADE[1]).applyMatrix4(handG.matrixWorld));
    copyMat.uniforms.fadeA.value.set(a[0], a[1]); copyMat.uniforms.fadeB.value.set(b[0], b[1]); copyMat.uniforms.fadeOn.value = 1;
  }
  copyMat.uniforms.size.value.set(rect.w, rect.h); copyMat.uniforms.circ.value.set(rect.w / 2, rect.h / 2, opt.circle ? rect.w / 2 : 0);
  renderer.setRenderTarget(null); renderer.setViewport(rect.x, PY - rect.y - rect.h, rect.w, rect.h); renderer.setScissor(rect.x, PY - rect.y - rect.h, rect.w, rect.h); renderer.setScissorTest(true);
  renderer.render(quadScene, quadCam); renderer.setScissorTest(false); renderer.setViewport(0, 0, PX, PY);
}

// ---------- Camera: two tracks (A: 0–22.6 one continuous shot, including the dive into the slit; B: 22.6–50, transitioning out through the round hole in the slit) ----------
const mainCam = new THREE.PerspectiveCamera(18, PX / PY, 1, 4000);
const L_ = Math.log;
// [t, [az, el, ln(dist), target (phone-local) x, y, z, frame offset ox, oy]]
const CAM_A = track([
  [0.0, [24, 6, L_(900), 0, 4, 0, -330, -20]],
  [4.4, [32, 6, L_(830), -14, 4, 8, -400, -20]],
  [8.2, [40, 6, L_(730), -20, 4, 10, -440, -20]],
  [9.9, [42, 6, L_(715), -22, 4, 10, -440, -20]],
  [11.4, [60, -9, L_(450), -50, 4, 0, -150, -20]],
  [12.8, [64, -7, L_(470), -42, 4, 0, -130, -20]],
  [14.3, [-22, 25, L_(650), 10, 38, 0, -80, -20]],
  [15.6, [-27, 29, L_(700), 12, 58, 0, -70, -20]],
  [16.8, [-29, 30, L_(665), 0, 55, 8, -80, -20]],
  [18.0, [-31, 27, L_(640), -18, 52, 12, -80, -20]],
  [19.3, [-150, 18, L_(330), -30, 84, -30, -40, -10]],
  [21.2, [-178, 6, L_(80), -33.25, 85.1, -35.2, 0, 0]],
  [22.8, [-180, 2.5, L_(12), -33.25, 85.15, -35.2, 0, 0]],
  [23.8, [-180, 1, L_(1.2), -33.25, 85.15, -35.2, 0, 0]],
]);
const CAM_B = track([
  [23.8, [0, 87.5, L_(690), 22, 85, -6, -150, -150]],
  [27.5, [0, 87.5, L_(678), 22, 85, -6, -150, -150]],
  [34.8, [1, 87, L_(665), 22, 85, -6, -150, -150]],
  [36.4, [24, 8, L_(920), 0, 4, 0, -330, -20]],
  [37.9, [54, 9, L_(390), -54, 4, 30, -40, -40]],
  [40.8, [58, 7, L_(370), -54, 4, 30, -40, -40]],
  [42.8, [28, 12, L_(690), 32, 4, 8, -300, -20]],
  [46.1, [26, 10, L_(760), 16, 4, 4, -320, -20]],
  [48.1, [20, 8, L_(880), 0, 4, 0, -400, -20]],
  [50.4, [13, 7, L_(930), 0, 4, 0, -410, -20]],
  [52.0, [9, 6.5, L_(955), 0, 4, 0, -410, -20]],
]);
const tgtV = new THREE.Vector3();
function camAt(t, jit = [0, 0]) {
  const [az, el, ld, lx, ly, lz, ox, oy] = (t < K.cut ? CAM_A : CAM_B)(t);
  const dist = Math.exp(ld);
  tgtV.set(lx, ly, lz).applyMatrix4(root.matrixWorld);
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  mainCam.position.set(tgtV.x + Math.sin(a) * Math.cos(e) * dist, tgtV.y + Math.sin(e) * dist, tgtV.z + Math.cos(a) * Math.cos(e) * dist);
  mainCam.up.set(0, 1, 0); mainCam.lookAt(tgtV);
  mainCam.near = clamp(dist * 0.02, 0.15, 10); mainCam.far = 4000;
  mainCam.updateMatrixWorld();
  mainCam.setViewOffset(PX, PY, ox + jit[0], oy + jit[1], PX, PY); mainCam.updateProjectionMatrix();
  return mainCam;
}
// section plane (opening scan): keep phone-local x below c
const clipPlane = new THREE.Plane();
function sweepClip(t) {
  const c = lerp(-W / 2 - 2, W / 2 + 2, eio(seg(t, K.sweep[0], K.sweep[1])));
  clipPlane.set(V3(-1, 0, 0), c).applyMatrix4(root.matrixWorld); return c;
}

// ---------- 2D: paper, labels, subtitles ----------
const bg = document.getElementById('bg').getContext('2d');
const ov = document.getElementById('ov').getContext('2d');
function proj(v, cam = mainCam) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * PX, (1 - p.y) / 2 * PY, p.z]; }
function drawPaper() {
  bg.fillStyle = PAPER; bg.fillRect(0, 0, PX, PY);
  bg.strokeStyle = 'rgba(20,20,20,0.04)'; bg.lineWidth = 1;
  for (let x = 0; x <= PX; x += 40) { bg.beginPath(); bg.moveTo(x + .5, 0); bg.lineTo(x + .5, PY); bg.stroke(); }
  for (let y = 0; y <= PY; y += 40) { bg.beginPath(); bg.moveTo(0, y + .5); bg.lineTo(PX, y + .5); bg.stroke(); }
  bg.strokeStyle = 'rgba(20,20,20,0.15)';
  for (let x = 40; x < PX; x += 200) for (let y = 40; y < PY; y += 200) { bg.beginPath(); bg.moveTo(x - 5, y + .5); bg.lineTo(x + 6, y + .5); bg.moveTo(x + .5, y - 5); bg.lineTo(x + .5, y + 6); bg.stroke(); }
}
// entry: traced left to right; exit: wiped left to right (out = 0..1)
let CAPTURE = null;                 // window.TEXTS: records the text on screen in this frame (a whole text is reported from its first frame and no longer once its exit starts)
function wipeText(c, text, x, y, p, font, color, spacing = 0, out = 0) {
  if (p <= 0 || out >= 1) return 0;
  if (CAPTURE && out <= 0) { const px = +(/(\d+(?:\.\d+)?)px/.exec(font) || [0, 20])[1]; const w = textW(text, font, spacing); CAPTURE.push({ id: text, text, x0: Math.round(x), y0: Math.round(y - px), x1: Math.round(x + w), y1: Math.round(y + px * 0.3) }); }
  c.save(); c.font = font; c.fillStyle = color; c.textBaseline = 'alphabetic';
  if (spacing) c.letterSpacing = spacing + 'px';
  const w = c.measureText(text).width;
  const x0 = x - 4 + (w + 8) * eio(out), x1 = x - 4 + (w + 8) * eo(p);
  c.beginPath(); c.rect(x0, y - 200, Math.max(0, x1 - x0), 260); c.clip();
  c.fillText(text, x, y); c.restore(); return w;
}
function textW(text, font, spacing = 0) { ov.save(); ov.font = font; if (spacing) ov.letterSpacing = spacing + 'px'; const w = ov.measureText(text).width; ov.restore(); return w; }
function badge(c, x, y, label, p, accent = false, r = 15) {
  if (p <= 0) return;
  const s = back(p, 2.2);
  c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2);
  if (accent) { c.fillStyle = ACC; c.fill(); c.fillStyle = '#fff'; } else { c.fillStyle = PAPER; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; }
  c.font = `600 ${r * 1.08}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, 1); c.restore();
}
function dot(c, x, y, col = INK, r = 3.2) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
function polyGrow(c, pts, p) {
  if (p <= 0) return null;
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let rem = tot * clamp(p); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); let end = pts[0];
  for (let i = 1; i < pts.length && rem > 0; i++) { const u = Math.min(1, rem / L[i - 1]); end = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; c.lineTo(end[0], end[1]); rem -= L[i - 1]; }
  c.stroke(); return end;
}
// labels that follow a part: label placed beside the anchor at (dx, dy), a horizontal run + a leader to the anchor; shown within t0..t1, traced on entry, wiped on exit
function tag(c, t, [t0, t1], anchor, { dx, dy, name, spec, accent = false, bars = null }) {
  const u = t - t0; if (u <= 0 || t >= t1 + 0.45) return;
  const out = seg(t, t1, t1 + 0.4);
  const col = accent ? ACC : INK;
  const nameFont = `600 21px ${SANS}`;
  const nw = textW(name, nameFont, 1.4);
  const left = dx < 0;                      // when the label is left of the anchor, right-align the text to the bend
  const lx = anchor[0] + dx, ly = anchor[1] + dy;
  const tx = left ? lx - nw : lx + 12;
  c.save(); c.globalAlpha = 1 - out * 0.15;
  c.strokeStyle = col; c.lineWidth = 1.3;
  const knee = [left ? lx + 8 : lx, ly - 7];
  polyGrow(c, [anchor, knee, [left ? tx - 10 : tx + nw + 10, ly - 7]].slice(0, 2), seg(u, 0, 0.35) * (1 - out));
  if (seg(u, 0.05, 0.2) > 0 && out < 1) dot(c, anchor[0], anchor[1], col, 3.4 * back(seg(u, 0.02, 0.18), 2));
  wipeText(c, name, tx, ly, seg(u, 0.18, 0.5), nameFont, col, 1.4, out);
  if (spec) wipeText(c, spec, tx, ly + 25, seg(u, 0.3, 0.7), `400 15px ${MONO}`, GRAPH, 0, out);
  if (bars) drawBars(c, tx, ly + (spec ? 40 : 18), bars, seg(u, 0.25, 0.6) * (1 - out));
  c.restore();
}
// signal bars: n = current bar count (may be fractional; bars go hollow one by one as they drop)
function drawBars(c, x, y, n, p) {
  if (p <= 0) return;
  c.save(); c.globalAlpha *= p;
  c.font = `500 12px ${MONO}`; c.fillStyle = FAINT; c.letterSpacing = '2px'; c.fillText('SIGNAL', x, y + 22);
  for (let i = 0; i < 5; i++) {
    const h = 6 + i * 4, bx = x + 74 + i * 11, by = y + 24 - h;
    const f = clamp(n - i);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(bx + .5, by + .5, 7, h);
    if (f > 0) { c.fillStyle = INK; c.fillRect(bx + .5, by + .5 + h * (1 - f), 7, h * f); }
  }
  c.restore();
}
// radiation arcs: outward from the antenna segment, k = strength 0..1
function arcs(c, p, away, t, k) {
  if (k <= 0.01) return;
  const ang = Math.atan2(away[1], away[0]);
  c.save(); c.strokeStyle = ACC;
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 0.8 + i / 3) % 1);
    const r = 26 + ph * 90 * (0.35 + 0.65 * k);
    c.globalAlpha = k * (1 - ph) * 0.9; c.lineWidth = 2.2 * (1 - ph) + 0.6;
    c.beginPath(); c.arc(p[0], p[1], r, ang - 0.8, ang + 0.8); c.stroke();
  }
  c.restore();
}
// dimension line (two screen-space endpoints, offset off along the normal)
function dimLine(c, a, b, off, text, p = 1, al = 1, ticks = 0) {
  if (p <= 0 || al <= 0) return;
  c.save(); c.globalAlpha = al;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * off, ny = dx / L * off;
  const A = [a[0] + nx, a[1] + ny], Bp = [b[0] + nx, b[1] + ny];
  const q1 = seg(p, 0, 0.3), q2 = seg(p, 0.15, 0.8), q3 = seg(p, 0.6, 1);
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 1;
  if (off) { c.beginPath(); c.moveTo(a[0] + nx * 0.15, a[1] + ny * 0.15); c.lineTo(lerp(a[0] + nx * .15, A[0] + nx * .12, q1), lerp(a[1] + ny * .15, A[1] + ny * .12, q1));
    c.moveTo(b[0] + nx * 0.15, b[1] + ny * 0.15); c.lineTo(lerp(b[0] + nx * .15, Bp[0] + nx * .12, q1), lerp(b[1] + ny * .15, Bp[1] + ny * .12, q1)); c.stroke(); }
  const M0 = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2];
  c.lineWidth = 1.25; c.beginPath(); c.moveTo(lerp(M0[0], A[0], ss(q2)), lerp(M0[1], A[1], ss(q2))); c.lineTo(lerp(M0[0], Bp[0], ss(q2)), lerp(M0[1], Bp[1], ss(q2))); c.stroke();
  const ux = dx / L, uy = dy / L;
  if (ticks && q2 > 0) { c.lineWidth = 1; for (let i = 0; i <= ticks; i++) { const f = i / ticks; if (Math.abs(f - 0.5) > ss(q2) / 2 + 1e-6) continue; const P0 = [lerp(A[0], Bp[0], f), lerp(A[1], Bp[1], f)], hl = i % 5 === 0 ? 7 : 4; c.beginPath(); c.moveTo(P0[0] - uy * hl, P0[1] + ux * hl); c.lineTo(P0[0] + uy * hl, P0[1] - ux * hl); c.stroke(); } }
  if (q2 >= 1) for (const [P0, s] of [[A, 1], [Bp, -1]]) { c.beginPath(); c.moveTo(P0[0], P0[1]); c.lineTo(P0[0] + s * ux * 11 + uy * 3.5, P0[1] + s * uy * 11 - ux * 3.5); c.lineTo(P0[0] + s * ux * 11 - uy * 3.5, P0[1] + s * uy * 11 + ux * 3.5); c.closePath(); c.fill(); }
  if (q3 > 0 && text) {
    let ang = Math.atan2(dy, dx); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    c.translate(M0[0], M0[1]); c.rotate(ang);
    c.font = `500 18px ${MONO}`; const tw = c.measureText(text).width; c.fillStyle = PAPER; c.fillRect(-tw / 2 - 8, -12, tw + 16, 24);
    c.globalAlpha = al * ss(q3); c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 1);
  }
  c.restore();
}
// hatch pattern (the same as the plastic breaks), used for the "through the break" transition
function hatchFill(c, clipFn) {
  c.save(); c.beginPath(); clipFn(c); c.clip('evenodd');
  c.fillStyle = '#e0e0dc'; c.fillRect(0, 0, PX, PY);
  c.strokeStyle = '#8f8f8b'; c.lineWidth = 1.1;
  c.beginPath(); for (let k = -PY; k < PX + PY; k += 5) { c.moveTo(k, 0); c.lineTo(k - PY, PY); } c.stroke();
  c.restore();
}
// subtitles: bottom left, one Chinese line and one English line on a paper-coloured backing (clear of the subject: the main composition stays at y < 900)
function subtitles(c, t) {
  if (!SUBS) return;
  const s = TLJ.subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
  const a = Math.min(1, (t - s.t0) / 0.12, (s.t1 - t) / 0.12);
  const zf = `500 36px ${ZH}`, ef = `400 23px ${SANS}`;
  const w = Math.max(textW(s.zh, zf, 1), textW(s.en, ef, 0.3));
  c.save(); c.globalAlpha = clamp(a);
  c.fillStyle = 'rgba(246,245,240,0.88)'; c.fillRect(48, 942, w + 40, 108);
  c.fillStyle = INK; c.fillRect(48, 942, 3, 108);
  c.font = zf; c.letterSpacing = '1px'; c.fillStyle = INK; c.fillText(s.zh, 70, 990);
  c.font = ef; c.letterSpacing = '0.3px'; c.fillStyle = GRAPH; c.fillText(s.en, 71, 1028);
  c.restore();
}

// ---------- Each frame: 3D main view + close-up inset + 2D labels ----------
const pm = v => proj(v);
const pL = p => pm(loc(p));                              // phone-local coordinates → screen
const frameY = () => Lframe.g.position.y;
function overlay(t, c) {
  // —— S1 hook: year, section plane, corner label + signal bars, question
  wipeText(c, '2010', 112, 520, seg(t, K.year[0], K.year[0] + 0.5), `500 150px ${MONO}`, INK, -4, seg(t, K.year[1], K.year[1] + 0.45));
  if (t < K.year[1] + 0.5) { const p = seg(t, K.year[0] + 0.3, K.year[0] + 0.8) * (1 - seg(t, K.year[1], K.year[1] + 0.4)); if (p > 0) { c.fillStyle = INK; c.fillRect(118, 548, 340 * eo(p), 2); } }
  const sw = seg(t, K.sweep[0], K.sweep[1]);
  if (sw > 0 && sw < 1) {
    const x = lerp(-W / 2 - 2, W / 2 + 2, eio(sw)), al = Math.min(1, sw * 8, (1 - sw) * 8);
    const cs = [[x, -2, D / 2 + 4], [x, H + 2, D / 2 + 4], [x, H + 2, -D / 2 - 4], [x, -2, -D / 2 - 4]].map(pL);
    c.save(); c.globalAlpha = al; c.strokeStyle = '#8f8e8a'; c.lineWidth = 1; c.setLineDash([5, 4]);
    c.beginPath(); cs.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.setLineDash([]);
    c.font = `500 12px ${MONO}`; c.fillStyle = FAINT; c.letterSpacing = '2px'; c.fillText('SECTION', Math.max(cs[0][0], cs[3][0]) + 10, (cs[0][1] + cs[3][1]) / 2 + 4); c.restore();
  }
  const bars1 = 5 - 4 * eio(seg(t, K.barsDrop1[0], K.barsDrop1[1]));
  tag(c, t, K.corner, pL([-W / 2 + 14, H + 2, D / 2 + 7]), { dx: 120, dy: -60, name: 'BOTTOM CORNER', spec: 'where the hand closes', bars: bars1 });
  {
    const [q0, q1] = K.question, f = `600 64px ${SANS}`, out = seg(t, q1, q1 + 0.45);
    wipeText(c, 'WHERE IS YOUR', 110, 330, seg(t, q0, q0 + 0.5), f, INK, 0.5, out);
    const w1 = textW("PHONE'S ", f, 0.5);
    wipeText(c, "PHONE'S ", 110, 404, seg(t, q0 + 0.25, q0 + 0.6), f, INK, 0.5, out);
    wipeText(c, 'ANTENNA?', 110 + w1, 404, seg(t, q0 + 0.45, q0 + 0.9), f, ACC, 0.5, out);
    wipeText(c, '你手机的天线在哪', 114, 462, seg(t, q0 + 0.7, q0 + 1.1), `500 38px ${ZH}`, GRAPH, 3, out);
  }
  // —— S2 reveal: the frame is the antenna (the label follows the bottom U segment, also as the phone tips over and comes apart)
  {
    const anchor = pm(wp(Lframe, [-W / 2 + 0.6, 4.6, -12]));
    const [a0, a1] = K.answer, u = t - a0, out = seg(t, a1, a1 + 0.45);
    if (u > 0 && out < 1) {
      const x = 110, y = 300, f = `600 54px ${SANS}`;
      wipeText(c, 'THE EDGE', x, y, seg(u, 0, 0.4), f, INK, 0.5, out);
      const wi = textW('IS THE ', f, 0.5);
      wipeText(c, 'IS THE ', x, y + 64, seg(u, 0.15, 0.45), f, INK, 0.5, out);
      wipeText(c, 'ANTENNA.', x + wi, y + 64, seg(u, 0.3, 0.7), f, ACC, 0.5, out);
      wipeText(c, '边框就是天线', x + 4, y + 122, seg(u, 0.5, 0.9), `500 38px ${ZH}`, GRAPH, 3, out);
      c.save(); c.strokeStyle = ACC; c.lineWidth = 1.4;
      const sx = x + textW('ANTENNA.', f, 0.5) + wi + 18;
      polyGrow(c, [[sx, y + 46], [sx + 40, y + 46], anchor], seg(u, 0.4, 0.8) * (1 - out));
      if (u > 0.8 && out < 1) dot(c, anchor[0], anchor[1], ACC, 3.6);
      c.restore();
    }
  }
  if (t > K.flood[0] && t < K.tipFlat[0] + 0.3) {
    const p = pL([-W / 2 - 2, 4, 0]), cc = pL([0, 4, 0]);
    arcs(c, p, [p[0] - cc[0], p[1] - cc[1]], t, eo(seg(t, K.flood[0] + 0.4, K.flood[1] + 0.4)) * (1 - seg(t, K.tipFlat[0] - 0.2, K.tipFlat[0] + 0.3)));
  }
  // —— S3 apart: path labels follow the orange head
  const pg = seg(t, K.ping, K.ping + 0.7);
  if (pg > 0 && pg < 1) {
    const rf = pm(wp(Lboard, P.rf));
    c.save(); c.strokeStyle = ACC; c.lineWidth = 2 * (1 - pg) + 0.5; c.globalAlpha = 1 - pg;
    c.beginPath(); c.arc(rf[0], rf[1], 6 + 34 * eo(pg), 0, Math.PI * 2); c.stroke(); c.restore();
  }
  if (Lboard.g.visible) {
    tag(c, t, K.cRF, pm(wp(Lboard, [P.rf[0], P.rf[1], P.rf[2] + 4])), { dx: 120, dy: 96, name: 'RF CHIP', spec: 'where the signal starts', accent: true });
    tag(c, t, K.cCoax, pm(wp(Lboard, [-6, 1.3, 32.2])), { dx: 60, dy: 150, name: 'COAX CABLE', spec: 'thin shielded wire', accent: true });
    tag(c, t, K.cFeed, pm(wp(Lboard, [-69, 2.4, 29.6])), { dx: -140, dy: 120, name: 'FEED CLIP', accent: true });
  }
  {
    const [n0, n1] = K.note, p = seg(t, n0, n0 + 0.6), out = seg(t, n1, n1 + 0.4);
    const s = 'INTERNAL LAYOUT ILLUSTRATIVE  ·  OUTLINE 150.5 × 70.8 × 8.9 mm';
    wipeText(c, s, PX - 64 - textW(s, `400 12px ${MONO}`, 1.6), 60, p, `400 12px ${MONO}`, FAINT, 1.6, out);
  }
  // —— S4 breaks: named before diving into the slit
  tag(c, t, K.slitLabel, pm(wp(Lframe, [P.xb, 3.25, -D / 2 + 0.1])), { dx: -230, dy: -150, name: 'PLASTIC SLIT' });
  // —— S5 top view: magnifier, four segments, two rulers
  if (t >= K.cut && t < K.rulersOut + 0.6) shot5(t, c);
  // —— S6 / S7 hand grips, antenna switch
  const bars2 = 5 - 4 * eio(seg(t, K.barsDrop2[0], K.barsDrop2[1])) + 4 * eio(seg(t, K.barsUp[0], K.barsUp[1]));
  tag(c, t, K.bridge, pL([P.xb, H + 2, D / 2 + 10]), { dx: 190, dy: -90, name: 'HAND BRIDGES THE SLIT', spec: 'skin connects two antennas', bars: bars2 });
  tag(c, t, K.switchC, pL([W / 2 - 4, H + 2, D / 2 - 6]), { dx: -200, dy: -60, name: 'SWITCHED TO THE TOP ANTENNA', spec: 'the one the hand is not covering', accent: true, bars: Math.min(5, bars2) });
  if (t > K.standUp[1]) {
    const pb = pL([-W / 2 - 2, 4, 0]), pt = pL([W / 2 + 2, 4, 0]), cc = pL([0, 4, 0]);
    arcs(c, pb, [pb[0] - cc[0], pb[1] - cc[1]], t, seg(t, K.standUp[1], K.standUp[1] + 0.5) * (1 - eio(seg(t, K.drain[0] - 0.3, K.drain[1]))));
    arcs(c, pt, [pt[0] - cc[0], pt[1] - cc[1]], t, eo(seg(t, K.topFlood[0] + 0.2, K.topFlood[1] + 0.4)));
  }
  // —— S8 ending
  {
    const e0 = K.endTitle, u = t - e0;
    if (u > 0) {
      const x = 110, y = 360;
      wipeText(c, "YOU'RE NOT HOLDING IT WRONG.", x + 2, y, seg(u, 0, 0.45), `500 26px ${SANS}`, GRAPH, 1.5);
      const f = `600 64px ${SANS}`;
      wipeText(c, "YOU'RE HOLDING", x, y + 84, seg(u, 0.35, 0.8), f, INK, 0.5);
      wipeText(c, 'THE ANTENNA.', x, y + 158, seg(u, 0.6, 1.05), f, ACC, 0.5);
      wipeText(c, '你握着的，就是天线。', x + 4, y + 222, seg(u, 0.9, 1.3), `500 40px ${ZH}`, GRAPH, 3);
    }
  }
  // —— end credit: drawn as a drawing's title block (ink lines ruled cell by cell, text traced left to right)
  if (t >= K.credit) titleBlock(c, t - K.credit, 110, 650, true);
  if (!CAPTURE) subtitles(c, t);
}
function overlayTexts(T, c) { overlay(T, c); if (T >= K.mag[0] && T < K.rulersOut + 0.5) magnifier(T, c); }
// drawing title block: full = title / style / credit, three rows; otherwise only the credit row
function titleBlock(c, u, x, y, full) {
  const rows = full ? [
    ['TITLE', "WHERE IS YOUR PHONE'S ANTENNA?", '你手机的天线在哪'],
    ['STYLE', 'LINE-ART CUTAWAY', '线稿剖面图解'],
    ['BY', 'LemoLab × Claude Opus 5.5', ''],
  ] : [['BY', 'LemoLab × Claude Opus 5.5', '']];
  const RH = 62, LW = 104, WD = full ? 905 : 560, H_ = rows.length * RH;
  c.save(); c.strokeStyle = INK;
  const g = eo(seg(u, 0, 0.45));                           // heavy outer frame, thin inner cells: the same line-weight rules as the line art
  c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + WD * g, y); c.moveTo(x, y + H_); c.lineTo(x + WD * g, y + H_); c.stroke();
  const gv = eo(seg(u, 0.2, 0.55));
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + H_ * gv); c.moveTo(x + WD, y); c.lineTo(x + WD, y + H_ * gv); c.stroke();
  c.lineWidth = 1; c.beginPath(); c.moveTo(x + LW, y); c.lineTo(x + LW, y + H_ * gv);
  for (let i = 1; i < rows.length; i++) { c.moveTo(x, y + i * RH); c.lineTo(x + WD * eo(seg(u, 0.25 + i * 0.08, 0.6 + i * 0.08)), y + i * RH); }
  c.stroke(); c.restore();
  rows.forEach(([lab, en, zh], i) => {
    const by = y + i * RH + RH / 2, d = 0.35 + i * 0.22, sign = lab === 'BY';
    wipeText(c, lab, x + 18, by + 5, seg(u, d, d + 0.3), `500 13px ${MONO}`, FAINT, 2.4);
    const f = sign ? `600 30px ${SANS}` : `600 22px ${SANS}`, sp = sign ? 0.4 : 1.2;
    wipeText(c, en, x + LW + 22, by + (sign ? 11 : 8), seg(u, d + 0.1, d + 0.55), f, INK, sp);
    if (zh) wipeText(c, zh, x + LW + 22 + textW(en, f, sp) + 22, by + 12, seg(u, d + 0.35, d + 0.75), `500 34px ${ZH}`, GRAPH, 2);
  });
}
// top-view section: the mid-frame on its own
function shot5(t, c) {
  const fy = frameY(), out = seg(t, K.rulersOut, K.rulersOut + 0.4);
  const S = (x, z, y = 3.25) => pm(wp(Lframe, [x, y, z]));
  // small triangles at the four breaks + one line of explanation
  const sn = seg(t, K.slitNote[0], K.slitNote[0] + 0.6) * (1 - out);
  if (sn > 0) {
    c.save(); c.globalAlpha = sn; c.fillStyle = INK;
    for (const [x, s] of P.slits) { const p = S(x, s * (D / 2 + 5)); const dir = s > 0 ? 1 : -1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 6, p[1] + dir * 11); c.lineTo(p[0] + 6, p[1] + dir * 11); c.closePath(); c.fill(); }
    c.restore();
  }
  // four segment numbers: bottom ① is orange (the one being explained)
  const pc = seg(t, K.pieces[0], K.pieces[0] + 0.5);
  if (pc > 0 && out < 1) {
    const items = [[[-W / 2 - 12, 0], '1', true], [[W / 2 + 12, 0], '2', false], [[0, D / 2 + 13], '3', false], [[0, -D / 2 - 13], '4', false]];
    items.forEach(([[x, z], n, a], i) => { const p = S(x, z); badge(c, p[0], p[1], n, seg(t, K.pieces[0] + i * 0.18, K.pieces[0] + i * 0.18 + 0.3) * (1 - out), a, 14); });
    const s1 = '4 SLITS  →  4 SEPARATE ANTENNAS', f = `600 19px ${SANS}`;
    const p = [180, 640];
    wipeText(c, s1, p[0], p[1] - 4, seg(t, K.pieces[0] + 0.6, K.pieces[0] + 1.1), f, INK, 1.4, out);
    wipeText(c, 'slit count and positions here are illustrative', p[0], p[1] + 20, seg(t, K.pieces[0] + 0.8, K.pieces[0] + 1.3), `400 14px ${MONO}`, FAINT, 0, out);
  }
  // two ¼-wavelength rulers: same scale as the model (millimetres projected directly)
  const ruler = (r, len, z, label, spec, extra) => {
    const p = seg(t, r[0], r[1]) * (1 - out); if (p <= 0) return;
    const a = S(-W / 2, z, 3.25), b = S(-W / 2 + len, z, 3.25);
    dimLine(c, a, b, 0, '', p, 1, Math.round(len / 5));
    // a quarter sine: rising from 0 to the peak
    const q = seg(p, 0.3, 1); if (q > 0) {
      c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
      const n = 60, amp = 34;
      for (let i = 0; i <= n * q; i++) { const f = i / n; const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f) - 10 - amp * Math.sin(f * Math.PI / 2); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.restore();
    }
    wipeText(c, label, a[0] - 4 - textW(label, `600 26px ${MONO}`, 0) - 18, a[1] + 9, seg(p, 0.2, 0.6), `600 26px ${MONO}`, INK, 0, 0);
    wipeText(c, spec, b[0] + 18, a[1] + 7, seg(p, 0.6, 1), `500 20px ${MONO}`, INK, 0, 0);
    if (extra) wipeText(c, extra, b[0] + 18, a[1] + 30, seg(p, 0.7, 1), `400 14px ${MONO}`, FAINT, 0, 0);
  };
  ruler(K.rulerA, 107, -D / 2 - 62, '700 MHz', '¼ λ ≈ 107 mm', 'free-space quarter wavelength');
  ruler(K.rulerB, 21.4, -D / 2 - 30, '3.5 GHz', '¼ λ ≈ 21 mm', '');
}
// magnifier: the same model, a different camera position, cut across to show the break in section
const magCam = new THREE.PerspectiveCamera(26, 1, 0.5, 2000);
const magPlane = new THREE.Plane();
function magnifier(t, c) {
  const p = eo(seg(t, K.mag[0], K.mag[1])) * (1 - eio(seg(t, K.rulersOut, K.rulersOut + 0.4)));
  if (p <= 0) return;
  const slit = pm(wp(Lframe, [P.xb, 3.25, -D / 2]));
  const r = Math.max(10, Math.round(15 * p) * 10), cx = 330, cy = 360;   // radius rounded to 10 px, at most 15 sizes
  if (r < 4) return;
  if (!CAPTURE) renderView('mag', { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }, (dt, j) => {
    const tg = wp(Lframe, [P.xb, 3.0, -D / 2 + 1]);
    const a = (180 + 28) * Math.PI / 180, e = 52 * Math.PI / 180, dist = 40;
    magCam.position.set(tg.x + Math.sin(a) * Math.cos(e) * dist, tg.y + Math.sin(e) * dist, tg.z + Math.cos(a) * Math.cos(e) * dist);
    magCam.up.set(0, 1, 0); magCam.lookAt(tg); magCam.updateMatrixWorld();
    magCam.setViewOffset(2 * r, 2 * r, j[0], j[1], 2 * r, 2 * r); magCam.updateProjectionMatrix();
    magPlane.set(V3(0, -1, 0), wp(Lframe, [0, 3.6, 0]).y);
    return { cam: magCam, clip: [magPlane] };
  }, { circle: true });
  c.save(); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  // small circle on the main view + dashed line to the magnifier
  c.lineWidth = 1.3; c.beginPath(); c.arc(slit[0], slit[1], 16, 0, Math.PI * 2); c.stroke();
  const ang = Math.atan2(cy - slit[1], cx - slit[0]);
  c.setLineDash([5, 4]); c.beginPath(); c.moveTo(slit[0] + Math.cos(ang) * 16, slit[1] + Math.sin(ang) * 16); c.lineTo(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r); c.stroke(); c.setLineDash([]);
  c.restore();
  const lp = seg(t, K.mag[1], K.mag[1] + 0.5) * (1 - seg(t, K.rulersOut, K.rulersOut + 0.4));
  if (lp > 0) {
    wipeText(c, 'PLASTIC SLIT', cx - 150, cy + 150 + 44, lp, `600 21px ${SANS}`, INK, 1.4);
    wipeText(c, 'section: metal | plastic | metal', cx - 150, cy + 150 + 68, lp, `400 15px ${MONO}`, GRAPH);
  }
}

// ---------- Compositing ----------
function frameAt(T) {
  drawPaper();
  renderer.setRenderTarget(null); renderer.setClearColor(0xffffff, 0); renderer.clear();
  ov.clearRect(0, 0, PX, PY);
  renderView('main', { x: 0, y: 0, w: PX, h: PY }, (dt, j) => {
    const tt = clamp(T + dt, 0, FILM); setScene(tt);
    const clip = tt < K.sweep[1] + 0.05 ? (sweepClip(tt), [clipPlane]) : [];
    return { cam: camAt(tt, j), clip };
  }, { guides: true, handFade: true });
  setScene(T); camAt(T);
  overlay(T, ov);
  if (T >= K.mag[0] && T < K.rulersOut + 0.5) magnifier(T, ov);
  // "through the break": the frame fills with the plastic-break hatching, then a round hole opens at the break into the top view
  if (T > K.dive[1] - 0.35 && T < K.cut) {
    const k = seg(T, K.dive[1] - 0.35, K.cut);
    ov.save(); ov.globalAlpha = ss(k); hatchFill(ov, c => c.rect(0, 0, PX, PY)); ov.restore();
  }
  if (T >= K.cut && T < K.iris[1]) {
    const o = pm(wp(Lframe, [P.xb, 3.25, -D / 2])), r = 2300 * ei(seg(T, K.iris[0], K.iris[1])) + 2;
    hatchFill(ov, c => { c.rect(0, 0, PX, PY); c.moveTo(o[0] + r, o[1]); c.arc(o[0], o[1], r, 0, Math.PI * 2); });
    ov.save(); ov.strokeStyle = INK; ov.lineWidth = 2; ov.beginPath(); ov.arc(o[0], o[1], r, 0, Math.PI * 2); ov.stroke(); ov.restore();
  }
  if (T >= K.cut && T < K.iris[1]) subtitles(ov, T);
}

// ---------- Sound events (whole-film time minus the segment start) ----------
function buildEV() {
  const ev = [];
  const panAt = (t, f) => { setScene(t); camAt(t); return clamp(f()[0] / PX * 2 - 1, -1, 1); };
  ev.push({ t: K.sweep[0], type: 'sweep', d: K.sweep[1] - K.sweep[0], pan: 0.2, pan1: 0.4 });
  ev.push({ t: K.year[0], type: 'type', d: 0.5, pan: -0.7 });
  ev.push({ t: K.hand1[0], type: 'hand', d: K.curl1[1] - K.hand1[0], pan: 0.4 });
  ev.push({ t: K.corner[0], type: 'tick', pan: -0.2 });
  ev.push({ t: K.barsDrop1[0], type: 'barsdown', d: K.barsDrop1[1] - K.barsDrop1[0], pan: -0.2 });
  ev.push({ t: K.question[0], type: 'type', d: 1.1, pan: -0.6 });
  ev.push({ t: K.handOut[0], type: 'hand', d: K.handOut[1] - K.handOut[0], pan: 0.4, out: true });
  ev.push({ t: K.flood[0], type: 'flood', d: K.flood[1] - K.flood[0], pan: 0.3 });
  ev.push({ t: K.answer[0], type: 'type', d: 0.9, pan: -0.6 });
  ev.push({ t: K.tipFlat[0], type: 'tip', d: K.tipFlat[1] - K.tipFlat[0], pan: 0 });
  ORDER.forEach((n, i) => { const k = n === 'battery' ? 2 : Math.min(i, 3); if (n === 'battery') return; const t0 = K.lift + k * K.liftStep;
    ev.push({ t: t0, type: 'lift', d: K.liftDur * 0.78, pan: 0 }); ev.push({ t: t0 + K.liftDur * 0.78, type: 'seat', pan: 0.1 * (i - 2), v: 0.7 }); });
  ev.push({ t: K.ping, type: 'ping', pan: panAt(K.ping, () => pm(wp(Lboard, P.rf))) });
  ev.push({ t: K.path[0], type: 'zip', d: K.path[1] - K.path[0], pan: panAt(K.path[0], () => pm(wp(Lboard, P.rf))), pan1: panAt(K.path[1], () => pm(wp(Lboard, P.feed))) });
  for (const k of ['cRF', 'cCoax', 'cFeed']) ev.push({ t: K[k][0], type: 'tick', pan: 0.1, accent: true });
  ev.push({ t: K.drop[0], type: 'drop', d: 1.0, pan: 0 });
  ev.push({ t: K.slitLabel[0], type: 'tick', pan: -0.3 });
  ev.push({ t: K.dive[0] + 1.0, type: 'dive', d: K.cut - K.dive[0] - 1.0, pan: 0 });
  ev.push({ t: K.cut, type: 'iris', d: K.iris[1] - K.iris[0], pan: -0.3 });
  ev.push({ t: K.mag[0], type: 'glass', pan: -0.6 });
  for (let i = 0; i < 4; i++) ev.push({ t: K.pieces[0] + i * 0.18, type: 'tick', pan: [-0.5, 0.5, 0, 0][i], accent: i === 0 });
  ev.push({ t: K.rulerA[0], type: 'ruler', d: K.rulerA[1] - K.rulerA[0], pan: -0.3 });
  ev.push({ t: K.rulerB[0], type: 'ruler', d: K.rulerB[1] - K.rulerB[0], pan: -0.5 });
  ev.push({ t: K.rejoin[0], type: 'rejoin', d: K.standUp[1] - K.rejoin[0], pan: 0 });
  for (let i = 0; i < 4; i++) ev.push({ t: K.rejoin[0] + (4 - i) * 0.12 + 0.75, type: 'seat', pan: 0, v: 0.6 });
  ev.push({ t: K.hand2[0], type: 'hand', d: K.curl2[1] - K.hand2[0], pan: 0.4 });
  ev.push({ t: K.bridge[0], type: 'tick', pan: 0 });
  ev.push({ t: K.drain[0], type: 'drain', d: K.drain[1] - K.drain[0], pan: 0.2 });
  ev.push({ t: K.barsDrop2[0], type: 'barsdown', d: K.barsDrop2[1] - K.barsDrop2[0], pan: 0 });
  ev.push({ t: K.topFlood[0], type: 'switch', d: K.topFlood[1] - K.topFlood[0], pan: 0.3 });
  ev.push({ t: K.barsUp[0], type: 'barsup', d: K.barsUp[1] - K.barsUp[0], pan: 0 });
  ev.push({ t: K.switchC[0], type: 'tick', pan: 0, accent: true });
  ev.push({ t: K.endTitle, type: 'type', d: 1.3, pan: -0.6 });
  ev.push({ t: K.trace[0], type: 'trace', d: K.trace[1] - K.trace[0], pan: 0.3 });
  ev.push({ t: K.credit, type: 'ruler', d: 0.55, pan: -0.5 });                      // ink lines of the end title block
  ev.push({ t: K.credit + 0.35, type: 'type', d: 1.0, pan: -0.5 });
  return ev.filter(e => e.t >= FROM && e.t < TO).sort((a, b) => a.t - b.t).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4) }));
}

window.DUR = +(TO - FROM).toFixed(4);
// readcheck: runs only the 2D label layer (no 3D render) to collect on-screen text; subtitles go in the .srt, not here
window.TEXTS = (t) => { const T = FROM + t; CAPTURE = []; setScene(T); camAt(T); ov.clearRect(0, 0, PX, PY); overlayTexts(T, ov); const r = CAPTURE; CAPTURE = null; return r; };
window.render = (t) => frameAt(FROM + t);
const fontsToLoad = [`600 20px "Plex Sans"`, `400 20px "Plex Sans"`, `400 20px "Plex Mono"`, `500 20px "Plex Mono"`, `500 20px "Noto SC"`, `700 20px "Noto SC"`];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f, f.includes('Noto') ? '你手机的天线在哪边框就是握着' : 'AB')));
await document.fonts.ready;
window.drawBat(); window.EV = buildEV(); window.render(0); window.READY = true;
