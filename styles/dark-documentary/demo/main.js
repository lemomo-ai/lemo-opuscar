// Radar Sweep Documentary demo · "Catching the Moon" (52 s on one timeline: 50 s of story + the end card)
// A world that is black until a scan light passes: terrain and the Parkes 64 m radio telescope light up, then settle into
// contour, range-ring and wireframe echoes. A clear night while it tracks Apollo 11 to the Moon; a second scan rewrites it into
// the stormy midday of 21 July 1969; the Moon, the Earth–Moon path and the control room (scenes2.js); the TV picture (tvart.js);
// the whole dish in the wind; the end card.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { drawMoonPicture } from './tvart.js';
import { buildMoon, buildGlobe, buildRoom } from './scenes2.js';

const W = 1920, H = 1080, PR = 2;
const Q = new URLSearchParams(location.search);

// ================= timeline (whole film, seconds) =================
const BPM = 96, BEAT = 60 / BPM;
const FILM_DUR = 52;          // 50 s of story + the credit card held to 52 s
const STORY_END = 50;         // camera moves and the dish's tracking were timed on the 50 s cut; keep them
const SIGN = Q.get('sign') === '1';   // ?t0=&t1=&sign=1: a short cut with the signature line over its last 2.5 s
// narration (English, Kokoro bm_lewis) + bilingual subtitles; t = when the line starts on the film timeline
const VO = [
  { id: 'v1', t: 1.2, en: 'For three days, the dish at Parkes had tracked Apollo 11 to the Moon, under clear skies.', zh: '三天来，帕克斯的天线在晴空下一路跟踪阿波罗11号飞向月球。' },
  { id: 'v2', t: 9.2, en: 'Then, on the day of the moonwalk, a storm came in.', zh: '可到了月面行走那天，一场风暴压了过来。' },
  { id: 'v3', t: 13.5, en: 'The dish lay tipped to its limit, waiting for the Moon to rise.', zh: '天线放倒到极限，等着月亮升起。' },
  { id: 'v4', t: 18.6, en: 'Two gusts, over 110 km an hour, slammed it against its gears.', zh: '两阵每小时超过110公里的阵风，把它狠狠撞回齿轮上。' },
  { id: 'v6', t: 27.6, en: 'At 12:54, the camera on the Moon switched on.', zh: '12点54分，月面上的摄像机打开了。' },
  { id: 'v7', t: 32.1, en: 'The first step reached the world through Honeysuckle Creek, near Canberra.', zh: '第一步传到全世界，走的是堪培拉附近的金银花溪站。' },
  { id: 'v8', t: 37.4, en: 'Minutes later, the Moon rose into the main beam, and Houston switched to Parkes.', zh: '几分钟后，月亮升进主波束，休斯敦切到了帕克斯。' },
  { id: 'v10', t: 43.8, en: 'For the rest of the walk, the dish held on, outside its safety limits.', zh: '此后整个月面行走，这面天线一直在安全极限之外坚持。' },
];
const T = {
  ign: 0.2, sweep0: 0.25, sweepBeats: 8,
  title: 4.2, cn: 4.6, mono: 5.0,
  day: 9.0,                       // the day rescan starts (same camera)
  dayLabel: 9.2,
  c2: 13.4,                       // wipe → side shot
  tip0: 14.0, tip1: 16.9,         // dish tips from its tracking pose to the 29°38′ limit
  c3a: 18.5, g1: 19.8, c3b: 21.6, g2: 22.8, c3c: 24.2,
  c4: 27.6, tvOn: 30.45, cG: 31.7, track: 32.0, replay0: 33.3, replay1: 36.9,
  c5: 37.4, mainBeam: 40.1, roomMove: 40.15, c5tv: 40.7, sw: 41.5,
  collapse: 45.0, c6: 45.35, ping: 45.7, sign: 48.0, fade: 50.6,
};
const SHOTS = [
  { id: 'S1', t0: 0, t1: T.c2 }, { id: 'S2', t0: T.c2, t1: T.c3a }, { id: 'S3a', t0: T.c3a, t1: T.c3b },
  { id: 'S3b', t0: T.c3b, t1: T.c3c }, { id: 'S3c', t0: T.c3c, t1: T.c4 }, { id: 'M', t0: T.c4, t1: T.cG },
  { id: 'G', t0: T.cG, t1: T.c5 }, { id: 'R', t0: T.c5, t1: T.c5tv }, { id: 'TV', t0: T.c5tv, t1: T.c6 }, { id: 'S6', t0: T.c6, t1: FILM_DUR + 1 },
];
const WIPES = [{ t: T.c2, d: 0.5 }, { t: T.c4, d: 0.55 }, { t: T.cG, d: 0.5 }];   // scan wipes between two live views
// a cut of the film: ?t0=&t1= (build.sh: 0–10 s for demo.mp4, 0–50 s for demo-full.mp4)
const CUT0 = Number(Q.get('t0') || 0), CUT1 = Number(Q.get('t1') || FILM_DUR);
window.DUR = CUT1 - CUT0;

// ================= helpers =================
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => x * x * (3 - 2 * x);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, k) => a + (b - a) * k;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const D2R = Math.PI / 180;
const wob = (t, f, s) => Math.sin(t * f + s) * 0.6 + Math.sin(t * f * 2.31 + s * 1.7) * 0.3 + Math.sin(t * f * 4.7 + s * 0.3) * 0.1;

// ================= renderers: two views (the second only during scan wipes) =================
function mkRenderer(el) {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(PR); r.setSize(W, H); r.toneMapping = THREE.NoToneMapping;
  document.getElementById(el).appendChild(r.domElement); return r;
}
const renderer = mkRenderer('stage'), renderer2 = mkRenderer('stage2');
const stage2 = document.getElementById('stage2');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);

// ================= the opening camera (also defines the scan geometry) =================
const cam0 = new THREE.PerspectiveCamera(36, W / H, 1, 30000);
const CAM0 = V3(-62, 11, 196), LOOK0 = V3(58, 38, 0);
cam0.position.copy(CAM0); cam0.lookAt(LOOK0); cam0.updateMatrixWorld(); cam0.updateProjectionMatrix();
const FWD = LOOK0.clone().sub(CAM0).normalize();
const camAt = t => CAM0.clone().addScaledVector(FWD, 2.0 * (t - 1.2 * (1 - Math.exp(-t / 1.2)))).add(V3(0, 0.12 * t, 0));
const rayGroundC = (cam, px, py) => { const v = V3((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize(); const k = -cam.position.y / v.y; return cam.position.clone().addScaledVector(v, k); };
const fwd0 = new THREE.Vector3().setFromMatrixColumn(cam0.matrixWorld, 2).negate().setY(0).normalize();
const rgt0 = new THREE.Vector3().setFromMatrixColumn(cam0.matrixWorld, 0).setY(0).normalize();
const scanDir = new THREE.Vector2(rgt0.x + 0.35 * fwd0.x, rgt0.z + 0.35 * fwd0.z).normalize();
const sAt = p => p.x * scanDir.x + p.z * scanDir.y;
const sCorner = [rayGroundC(cam0, 0, 1080), rayGroundC(cam0, 1920, 1080)].map(sAt);
const S_DISH = sAt(V3(0, 0, 0)) - 26;
const S_LEFT = Math.min(sCorner[0], S_DISH - 45);
const S_RIGHT = sCorner[1] + 160;
const S_FAR = sAt(CAM0.clone().addScaledVector(fwd0, 3600).addScaledVector(rgt0, -0.62 * 3600)) - 40;

const U = {
  S: { value: S_FAR }, SP: { value: -1e6 }, D: { value: scanDir }, BI: { value: 0 }, RL: { value: 0 }, AMB: { value: 0 }, CB: { value: 1 },
  DAYA: { value: 0 }, GLINT: { value: 0 },
  L: { value: V3(-0.55, 0.62, 0.56).normalize() },
  tel: { value: new THREE.Vector2(0, 0) },
  camPos: { value: new THREE.Vector3() },
  PR_: { value: 0 }, PA: { value: 0 },
};
const SCAN_GLSL = /* glsl */`
  uniform float S; uniform float SP; uniform vec2 D; uniform float BI; uniform float RL; uniform float AMB; uniform float DAYA; uniform float GLINT;
  uniform vec3 L; uniform vec2 tel; uniform vec3 camPos;
  uniform float PR_; uniform float PA;
  // two scans: the current one, and behind its front the previous one keeps aging
  float scanD(vec3 wp){ float x = dot(wp.xz, D); float d = S - x; return d > 0. ? d : SP - x; }
  float beamD(vec3 wp){ return S - dot(wp.xz, D); }
  float beamF(float d, float w){ return exp(-(d*d)/(w*w)); }
  float glowF(float d, float len){ return d > 0. ? exp(-d/len) : 0.; }
  float pingF(vec3 wp, float w){ float r = length(wp.xz - tel); float x = (r - PR_) / w; return PA * exp(-x*x) ; }
  float pingTrail(vec3 wp){ float r = length(wp.xz - tel); float x = PR_ - r; return x > 0. ? PA * exp(-x / 160.) : 0.; }
  const vec3 ECHO = vec3(0.70, 0.86, 1.0);
`;
const LINE_AA = `float lineAA(float v, float px){ float f = abs(fract(v - .5) - .5); return 1. - smoothstep(0., px, f / max(fwidth(v), 1e-5)); }`;

// ================= terrain =================
function heightAt(x, z) {
  const r = Math.hypot(x, z);
  let h = (fbm(x * 0.004 + 3.1, z * 0.004 - 1.7, 6) - 0.5) * 9.0;
  h += (fbm(x * 0.022 + 8.3, z * 0.022 + 2.9, 4) - 0.5) * 2.2;
  h += (fbm(x * 0.0016 - 5.0, z * 0.0016 + 9.0, 5) - 0.45) * 26.0;
  const far = THREE.MathUtils.smoothstep(r, 700, 2600);
  const ridge = 1 - Math.abs(fbm(x * 0.0011 + 11, z * 0.0011 - 4, 5) * 2 - 1);
  h += far * (ridge * ridge * 210 + fbm(x * 0.003, z * 0.003, 4) * 50);
  h *= THREE.MathUtils.smoothstep(r, 45, 160) * 0.6 + 0.1;
  h -= (1 - THREE.MathUtils.smoothstep(Math.hypot(x - CAM0.x, z - CAM0.z), 0, 260)) * 1.5;
  h += (vnoise(x * 0.35, z * 0.35) - 0.5) * 0.35;
  return h;
}
{
  const g = new THREE.PlaneGeometry(9000, 9000, 900, 900); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    const k = v => Math.sign(v) * Math.pow(Math.abs(v) / 4500, 1.8) * 4500;
    x = k(x); z = k(z);
    p.setXYZ(i, x, heightAt(x, z), z);
  }
  g.computeVertexNormals();
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec3 wp; varying vec3 nrm; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; nrm=normal; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN_GLSL + LINE_AA + /* glsl */`
      varying vec3 wp; varying vec3 nrm;
      void main(){
        vec3 n = normalize(nrm);
        float d = scanD(wp), db = beamD(wp);
        float dist = length(wp - camPos);
        float fw = fwidth(dot(wp.xz, D));
        float beam = beamF(db, max(0.35, fw * 0.9)) * BI;
        float halo = beamF(db, max(5., fw * 3.)) * BI;
        float glow = glowF(d, 120.);
        float trail = glowF(d, 520.);
        float lam = clamp(dot(n, L), 0., 1.);
        float graze = pow(1. - clamp(n.y, 0., 1.), 0.6);
        float cfade = 1. - smoothstep(0.35, 1.2, fwidth(wp.y / 1.0));
        float cont = lineAA(wp.y / 1.0, 0.9) * cfade;
        float rr = length(wp.xz - tel);
        float ring = lineAA(rr / 100., 1.0) * (1. - smoothstep(0.08, 0.5, fwidth(rr / 100.)));
        float grid = lineAA(wp.x / 25., 0.6) + lineAA(wp.z / 25., 0.6);
        grid *= (1. - smoothstep(0.1, 0.6, fwidth(wp.x / 25.) + fwidth(wp.z / 25.))) * 0.35;
        float sv = dot(wp.xz, D) / 7.;
        float ghost = lineAA(sv, 0.8) * (1. - smoothstep(0.15, 0.7, fwidth(sv)));
        float pg = pingF(wp, max(9., fw * 4.)), pt = pingTrail(wp);
        float amb = AMB * (1. + DAYA * 1.2);
        vec3 col = vec3(0.004, 0.005, 0.007) * (0.4 + lam) * amb;
        col += vec3(0.030, 0.034, 0.040) * (0.35 + 0.65 * lam) * DAYA;          // overcast daylight on the ground
        col += ECHO * ghost * glowF(d, 60.) * 0.35;
        col += ECHO * (0.05 + lam * 0.45 + graze * 0.35) * (beam * 1.6 + halo * 0.3 + glow * 0.38 + trail * 0.02 + pg * 0.5);
        col += vec3(1.0) * beam * 0.55;
        col += ECHO * cont * (beam * 0.5 + glow * 0.45 + trail * 0.10 + pg * 0.35 + DAYA * 0.025);
        col += ECHO * ring * (beam + glow * 0.7 + trail * 0.28 + pg * 1.2 + pt * 0.9 + DAYA * 0.06) * 0.9;
        col += ECHO * grid * (glow * 0.10 + trail * 0.025 + pg * 0.25);
        float fog = 1. - exp(-dist / mix(2600., 1500., DAYA));
        col = mix(col, mix(vec3(0.010, 0.012, 0.016) * AMB, vec3(0.100, 0.110, 0.125), DAYA), fog * 0.85);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  scene.add(new THREE.Mesh(g, m));
}

// ================= telescope materials =================
function surfMat({ base = 0.02, gain = 1, panel = false, side = THREE.FrontSide, glint = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: U, side,
    vertexShader: `varying vec3 wp; varying vec3 nrm; varying vec2 vUv; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; nrm=normalize(mat3(modelMatrix)*normal); vUv=uv; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN_GLSL + LINE_AA + /* glsl */`
      varying vec3 wp; varying vec3 nrm; varying vec2 vUv;
      void main(){
        vec3 n = normalize(nrm); if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(camPos - wp);
        float d = scanD(wp), db = beamD(wp);
        float beam = beamF(db, 1.6) * BI, halo = beamF(db, 10.) * BI;
        float glow = glowF(d, 70.), trail = glowF(d, 400.);
        float pg = pingF(wp, 8.);
        float lam = clamp(dot(n, L), 0., 1.);
        float rim = pow(1. - clamp(dot(n, V), 0., 1.), 3.);
        vec3 col = vec3(${base.toFixed(3)}) * (0.25 + lam) * 0.25 * AMB * (1. + DAYA);
        col += ECHO * (0.08 + lam * 0.85 + rim * 0.35) * (beam * 1.4 + halo * 0.4 + glow * 0.55 + trail * 0.07 + pg * 0.6) * ${gain.toFixed(2)};
        col += vec3(1.) * beam * 0.4;
        col += vec3(0.50, 0.70, 1.0) * rim * RL * (0.55 + DAYA * 0.25);
        col += vec3(0.040, 0.046, 0.056) * (0.3 + lam) * DAYA;                 // overcast daylight on the steel
        ${panel ? `
        float pl = max(lineAA(vUv.x * 48., 0.8), lineAA(vUv.y * 9., 0.8));
        col += ECHO * pl * (beam * 0.8 + glow * 0.45 + trail * 0.26 + pg * 0.5 + DAYA * RL * 0.22) * 0.55;` : ''}
        ${glint ? `col += vec3(1.0, 0.78, 0.52) * GLINT * (0.35 + rim);` : ''}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}
const lineMat = (k = 1) => new THREE.ShaderMaterial({
  uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: SCAN_GLSL + `varying vec3 wp; void main(){ float d = scanD(wp), db = beamD(wp);
    float a = beamF(db, 2.) * 1.2 * BI + glowF(d, 90.) * 0.55 + glowF(d, 600.) * 0.24 + pingF(wp, 8.) * 0.8 + RL * (0.17 + DAYA * 0.05);
    gl_FragColor = vec4(ECHO * a * ${k.toFixed(2)}, 1.); }`,
});
const ghostMat = () => new THREE.ShaderMaterial({
  uniforms: { gA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float gA; void main(){ gl_FragColor = vec4(vec3(0.70, 0.86, 1.0) * gA, 1.); }`,
});
const addEdges = (mesh, k = 1, thr = 25) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thr), lineMat(k)); e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale); mesh.parent.add(e); return e; };

// ================= Parkes / Murriyang, 64 m (simplified) =================
const tel = new THREE.Group(); scene.add(tel);
const concrete = surfMat({ base: 0.04, gain: 0.5 });
const steel = surfMat({ base: 0.05, gain: 0.8 });
function part(geo, mat, x, y, z, parent = tel, edges = 1, thr = 25) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); if (edges) addEdges(m, edges, thr); return m; }
part(new THREE.CylinderGeometry(6.2, 6.8, 13, 40, 1), concrete, 0, 6.5, 0, tel, 0.5);
part(new THREE.CylinderGeometry(7.6, 7.6, 1.2, 40, 1), steel, 0, 13.6, 0, tel, 0.6);
part(new THREE.BoxGeometry(22, 4.2, 15), concrete, 2, 2.1, 22, tel, 0.6);
part(new THREE.BoxGeometry(8, 2.8, 6), concrete, 26, 1.4, 30, tel, 0.5);
const azG = new THREE.Group(); tel.add(azG);
part(new THREE.BoxGeometry(9, 7, 13), steel, 0, 17.6, 0, azG, 0.8);
{ const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 14, 16), steel); axle.position.set(0, 24, 0); axle.rotation.z = Math.PI / 2; azG.add(axle); }
// elevation drive: a toothed gear sector on each side of the hub and a pinion on the gear house (the "zenith axis gears")
const gearLines = [];
{
  const segs = [], R0 = 7.2, teeth = 64;
  for (const sx of [-5.6, 5.6]) {
    for (let i = 0; i < teeth; i++) {
      const a0 = -1.25 + 2.5 * i / teeth, a1 = -1.25 + 2.5 * (i + 0.5) / teeth, a2 = -1.25 + 2.5 * (i + 1) / teeth;
      const r1 = R0, r2 = R0 + 0.45;
      const P = (r, a) => [sx, Math.cos(a) * r - 1.5, Math.sin(a) * r];
      segs.push(...P(r1, a0), ...P(r2, a0), ...P(r2, a0), ...P(r2, a1), ...P(r2, a1), ...P(r1, a1), ...P(r1, a1), ...P(r1, a2));
      segs.push(...P(R0 - 1.4, a0), ...P(R0 - 1.4, a2));
      if (i % 8 === 0) segs.push(...P(R0 - 1.4, a0), sx, -1.5, 0);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  gearLines.push(g);
}
const PIV = V3(0, 24, 0);
const F = 26.6, RD = 32, V0 = 3.2;
const zAt = r => V0 + r * r / (4 * F);
const dish = new THREE.Group(); dish.position.copy(PIV); dish.rotation.order = 'YXZ'; tel.add(dish);
// the gear sector turns with the dish in elevation only: its own group (rotation.x = tilt, y = phi)
const gearG = new THREE.Group(); gearG.position.copy(PIV); gearG.rotation.order = 'YXZ'; tel.add(gearG);
gearG.add(new THREE.LineSegments(gearLines[0], lineMat(1.1)));
for (const sx of [-5.6, 5.6]) {            // pinions (fixed to the gear house, so they live in azG)
  const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 18), steel); p.rotation.z = Math.PI / 2; p.position.set(sx, 24 - 1.5 - 8.4 + 0.2, 0); azG.add(p); addEdges(p, 1.0, 20);
}
const dishLineGeos = [];
{
  const pts = []; for (let i = 0; i <= 40; i++) { const r = 0.6 + (RD - 0.6) * (i / 40); pts.push(new THREE.Vector2(r, zAt(r))); }
  dish.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 192), surfMat({ base: 0.09, panel: true, side: THREE.DoubleSide })));
  const segA = [];
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const rs = [3, 10, 18, 25, RD];
    for (let j = 0; j < rs.length - 1; j++) {
      const r0 = rs[j], r1 = rs[j + 1], back0 = 1.2 + (RD - r0) * 0.11, back1 = 1.2 + (RD - r1) * 0.11;
      segA.push(c * r0, zAt(r0) - back0, s * r0, c * r1, zAt(r1) - back1, s * r1);
      segA.push(c * r1, zAt(r1) - back1, s * r1, c * r1, zAt(r1), s * r1);
      segA.push(c * r0, zAt(r0) - back0, s * r0, c * r1, zAt(r1), s * r1);
    }
    segA.push(c * 3, zAt(3) - 4.4, s * 3, 0, -1.5, 0);
  }
  for (const r of [10, 18, 25]) for (let k = 0; k < 24; k++) {
    const a0 = k / 24 * Math.PI * 2, a1 = (k + 1) / 24 * Math.PI * 2, b = 1.2 + (RD - r) * 0.11;
    segA.push(Math.cos(a0) * r, zAt(r) - b, Math.sin(a0) * r, Math.cos(a1) * r, zAt(r) - b, Math.sin(a1) * r);
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(segA, 3));
  dish.add(new THREE.LineSegments(lg, lineMat(0.9)));
  const rim = []; for (let k = 0; k < 192; k++) { const a0 = k / 192 * Math.PI * 2, a1 = (k + 1) / 192 * Math.PI * 2; rim.push(Math.cos(a0) * RD, zAt(RD), Math.sin(a0) * RD, Math.cos(a1) * RD, zAt(RD), Math.sin(a1) * RD); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rim, 3));
  dish.add(new THREE.LineSegments(rg, lineMat(1.4)));
  const gs = [...rim];
  for (let k = 0; k < 24; k += 2) { const a = k / 24 * Math.PI * 2; for (let i = 0; i < 8; i++) { const r0 = 3 + (RD - 3) * i / 8, r1 = 3 + (RD - 3) * (i + 1) / 8; gs.push(Math.cos(a) * r0, zAt(r0), Math.sin(a) * r0, Math.cos(a) * r1, zAt(r1), Math.sin(a) * r1); } }
  for (const r of [12, 22]) for (let k = 0; k < 96; k++) { const a0 = k / 96 * Math.PI * 2, a1 = (k + 1) / 96 * Math.PI * 2; gs.push(Math.cos(a0) * r, zAt(r), Math.sin(a0) * r, Math.cos(a1) * r, zAt(r), Math.sin(a1) * r); }
  const focus = [0, V0 + F, 0];
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5, r = 17; gs.push(Math.cos(a) * r, zAt(r), Math.sin(a) * r, ...focus); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gs, 3)); dishLineGeos.push(gg);
  part(new THREE.CylinderGeometry(4.5, 2.4, 6, 24, 1), steel, 0, 0.6, 0, dish, 0.7);
  const fv = V3(...focus);
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.5, r = 17, foot = V3(Math.cos(a) * r, zAt(r), Math.sin(a) * r);
    const len = foot.distanceTo(fv), mid = foot.clone().add(fv).multiplyScalar(0.5);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, len, 8), steel);
    leg.position.copy(mid); leg.quaternion.setFromUnitVectors(V3(0, 1, 0), fv.clone().sub(foot).normalize());
    dish.add(leg); addEdges(leg, 0.5, 40);
  }
  part(new THREE.CylinderGeometry(2.0, 2.4, 4.4, 24, 1), surfMat({ base: 0.05, gain: 0.8, glint: true }), 0, V0 + F + 1.4, 0, dish, 1.0);
}
const GHOSTS = [];
for (let i = 0; i < 7; i++) { const m = ghostMat(); const l = new THREE.LineSegments(dishLineGeos[0], m); l.position.copy(PIV); l.rotation.order = 'YXZ'; l.frustumCulled = false; tel.add(l); GHOSTS.push(l); }

// ================= dish pose =================
const camR0 = new THREE.Vector3().setFromMatrixColumn(cam0.matrixWorld, 0), camB0 = new THREE.Vector3().setFromMatrixColumn(cam0.matrixWorld, 2);
const H1 = new THREE.Vector3().addScaledVector(camR0, 0.95).addScaledVector(camB0, 0.16).setY(0).normalize();
const PHI1 = Math.atan2(H1.x, H1.z);
const EL_LIMIT = 29 + 38 / 60;                        // the telescope's own horizon: 29°38′ above the true horizon
const AIMH = V3(Math.sin(PHI1), 0, Math.cos(PHI1)), SIDE = V3(Math.cos(PHI1), 0, -Math.sin(PHI1));
const gustK = (t, tg) => { const x = t - tg; return x < 0 ? 0 : Math.exp(-x * 3.0) * Math.abs(Math.sin(x * 17)) * (1 - Math.exp(-x * 40)); };
const gustEnv = t => Math.exp(-Math.pow((t - T.g1 + 0.15) / 0.5, 2)) * 0.8 + Math.exp(-Math.pow((t - T.g2 + 0.15) / 0.5, 2)) + Math.exp(-Math.pow((t - 47.3) / 0.7, 2)) * 0.45;
const storm = t => seg(t, T.day, T.day + 2.5) * (1 - 0.35 * seg(t, T.c4, T.c4 + 3));
function poseAt(t) {
  let el, phi;
  if (t < T.tip0) { el = 51 + 1.2 * seg(t, 0, T.tip0); phi = PHI1 + 0.52 + 0.04 * seg(t, 0, T.tip0); }     // tracking the spacecraft
  else {
    const k = seg(t, T.tip0, T.tip1);
    let e = eio(k) - Math.sin(Math.PI * seg(t, T.tip0, T.tip0 + 0.5)) * 0.03;
    el = lerp(52.2, EL_LIMIT, clamp(e, -0.05, 1));
    const after = t - T.tip1; if (after > 0) el += -0.7 * Math.exp(-after * 3.2) * Math.sin(after * 19);
    phi = lerp(PHI1 + 0.56, PHI1, ss(seg(t, T.tip0 - 0.2, T.tip1 - 0.2)));
  }
  // the wind: slammed back against the zenith-axis gears, then rattling; light buffeting through the storm
  el += 1.5 * gustK(t, T.g1) + 2.2 * gustK(t, T.g2);
  phi += (0.35 * gustK(t, T.g1 + 0.03) + 0.5 * gustK(t, T.g2 + 0.03)) * D2R * Math.sin(t * 23);
  el += storm(t) * 0.14 * wob(t, 6.3, 1.1);
  phi += storm(t) * 0.05 * D2R * wob(t, 5.1, 2.3);
  const s6 = seg(t, T.c6, T.c6 + 0.8);                 // the last shot: the dish visibly working against the wind
  el += s6 * (0.55 * wob(t, 4.1, 0.3) + 0.9 * gustK(t, 47.3)); phi += s6 * 0.22 * D2R * wob(t, 3.3, 1.7);
  el += 1.1 * ss(seg(t, T.c4, STORY_END));             // tracking the rising Moon
  return { phi, el };
}
function applyPose(obj, p) { obj.rotation.set((90 - p.el) * D2R, p.phi, 0); }
const aimOf = p => V3(Math.sin(p.phi) * Math.cos(p.el * D2R), Math.sin(p.el * D2R), Math.cos(p.phi) * Math.cos(p.el * D2R));
const FOCUS_W = new THREE.Vector3();
// the Moon (as the radio telescope sees it): rising toward the dish's horizon; the off-axis receiver sits 1.2° below the main beam
const moonEl = t => lerp(28.05, EL_LIMIT, ss(seg(t, T.c4 - 1, T.mainBeam)));
const moonDir = t => aimOf({ phi: PHI1 + 0.004, el: moonEl(t) });

// ================= sky: night (milky way + stars) and day (storm cloud deck) =================
const SKY = { x: { value: -2 }, a: { value: 0 }, dx: { value: -3 }, time: { value: 0 } };
const starDir = V3(0.55, 0.42, -0.72).normalize();
const bandU = V3(1.0, 0.02, -0.55).normalize();
const bandN = new THREE.Vector3().crossVectors(starDir, bandU).normalize();
// night shows where the night scan has passed and the day scan has not yet arrived
const SKY_REVEAL = `uniform float skyX; uniform float skyA; uniform float dayX;
  float reveal(float nx){ return skyA * (1. - smoothstep(skyX - 0.55, skyX, nx)); }
  float dayM(float nx){ return 1. - smoothstep(dayX - 0.25, dayX, nx); }`;
const WINDDIR = camR0.clone().setY(0).normalize().negate();     // the wind blows right → left in the opening frame
let skyMesh, starPts;
{
  const g = new THREE.SphereGeometry(20000, 64, 32);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { N: { value: bandN }, C: { value: starDir.clone().lerp(bandU, 0.35).normalize() }, skyX: SKY.x, skyA: SKY.a, dayX: SKY.dx, time: SKY.time, wind: { value: new THREE.Vector2(WINDDIR.x, WINDDIR.z) } },
    vertexShader: `varying vec3 vd; varying vec4 cp; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; cp = gl_Position; }`,
    fragmentShader: SKY_REVEAL + /* glsl */`
      varying vec3 vd; varying vec4 cp; uniform vec3 N; uniform vec3 C; uniform float time; uniform vec2 wind;
      float h(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fb(vec3 p){ float s=0., a=.5; for(int i=0;i<6;i++){ s+=a*n3(p); p*=2.07; a*=.5; } return s; }
      vec3 night(vec3 d){
        vec3 col = vec3(0.004, 0.006, 0.010);
        col += vec3(0.030, 0.034, 0.042) * exp(-max(d.y, 0.) * 16.);
        float b = dot(d, N);
        float wv = 0.20 + 0.06 * (fb(d * 3.) - .5);
        float band = exp(-b * b / (wv * wv)), core = exp(-b * b / (0.06 * 0.06));
        float mw = band * (0.25 + 0.75 * fb(d * 7. + 2.)) + core * pow(fb(d * 16. + 7.), 2.2) * 1.2;
        mw *= 1. - 0.85 * smoothstep(0.42, 0.68, fb(d * 9. + vec3(4.,1.,8.))) * exp(-b*b/(0.075*0.075));
        float bulge = pow(max(dot(d, C), 0.), 18.);
        col += mix(vec3(0.55, 0.62, 0.78), vec3(0.85, 0.74, 0.62), clamp(bulge * 1.5 + core * 0.25, 0., 1.)) * mw * (0.13 + bulge * 0.16);
        return col * (smoothstep(-0.03, 0.06, d.y) * 0.9 + 0.1);
      }
      vec3 storm(vec3 d){
        // an overcast midday: a low, layered cloud deck lit from above, slowly rolling with the wind; brighter toward the horizon
        float y = max(d.y, 0.012);
        vec2 uv = d.xz / (y + 0.10) * 0.45;
        vec2 drift = -wind * time * 0.05;
        vec2 q = vec2(fb(vec3(uv * 0.6 + drift, time * 0.03)), fb(vec3(uv * 0.6 + drift + 5.2, time * 0.03)));
        float c = fb(vec3(uv * 1.1 + drift * 1.3 + q * 1.6, time * 0.04));
        float c2 = fb(vec3(uv * 3.2 + drift * 1.8 + 3.1, time * 0.07));
        float dens = smoothstep(0.25, 0.85, c * 0.8 + c2 * 0.3);
        vec3 dark = vec3(0.062, 0.070, 0.082), light = vec3(0.230, 0.246, 0.268), haze = vec3(0.165, 0.180, 0.200);
        vec3 col = mix(light, dark, dens);
        col = mix(col, haze, exp(-y * 4.0) * 0.55);
        col *= 0.78 + 0.32 * exp(-y * 1.5);
        float rain = fb(vec3(d.x * 30. - wind.x * time * 1.5, d.y * 2. + time * 0.8, d.z * 30.));
        col *= 0.9 + 0.18 * rain;
        return col * (smoothstep(-0.03, 0.04, d.y) * 0.8 + 0.2);
      }
      void main(){
        vec3 d = normalize(vd);
        float nx = cp.x / cp.w;
        float dm = dayM(nx);
        vec3 col = night(d) * reveal(nx) * (1. - dm) + storm(d) * dm;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  skyMesh = new THREE.Mesh(g, m); skyMesh.renderOrder = -2; skyMesh.frustumCulled = false; scene.add(skyMesh);
}
{
  const R = rng(19690721);
  const n = 90000, pos = new Float32Array(n * 3), mag = new Float32Array(n), tint = new Float32Array(n);
  const t1 = new THREE.Vector3().crossVectors(bandN, V3(0, 1, 0)).normalize(), t2 = new THREE.Vector3().crossVectors(bandN, t1);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (i < n * 0.55) {
      const a = R() * Math.PI * 2, gg = (R() + R() + R() - 1.5) * 0.17;
      v.copy(t1).multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)).addScaledVector(bandN, gg).normalize();
    } else { const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); v.set(s * Math.cos(a), u, s * Math.sin(a)); }
    pos.set([v.x * 15000, v.y * 15000, v.z * 15000], i * 3);
    mag[i] = Math.pow(R(), 9.0); tint[i] = R();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('mag', new THREE.BufferAttribute(mag, 1)); g.setAttribute('tint', new THREE.BufferAttribute(tint, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { skyX: SKY.x, skyA: SKY.a, dayX: SKY.dx },
    vertexShader: SKY_REVEAL + `attribute float mag; attribute float tint; varying float vm; varying float vt; varying float vh; varying float vr;
      void main(){ vm = mag; vt = tint; vh = normalize(position).y;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); float nx = gl_Position.x / gl_Position.w; vr = reveal(nx) * (1. - dayM(nx));
        gl_PointSize = (1.45 + mag * 6.0) * ${PR.toFixed(1)}; }`,
    fragmentShader: `varying float vm; varying float vt; varying float vh; varying float vr;
      void main(){ if (vr < 0.002) discard; vec2 c = gl_PointCoord - .5; float r = length(c) * 2.;
        float core = exp(-r * r * 7.), halo = exp(-r * 4.) * vm * 0.5;
        vec3 col = mix(vec3(0.75, 0.84, 1.0), vec3(1.0, 0.9, 0.78), vt);
        float b = (0.075 + vm * 1.5) * smoothstep(-0.01, 0.05, vh) * vr;
        gl_FragColor = vec4(col * (core + halo) * b, 1.); }`,
  });
  starPts = new THREE.Points(g, m); starPts.frustumCulled = false; starPts.renderOrder = -1; scene.add(starPts);
}

// ================= wind & rain: streak echoes that wrap around the camera =================
const WIND = { off: { value: new THREE.Vector3() }, vdir: { value: new THREE.Vector3() }, len: { value: 2 }, center: { value: new THREE.Vector3() }, A: { value: 0 } };
const BOX = 320;
{
  const n = 14000, R = rng(7021969);
  const seed = new Float32Array(n * 2 * 3), end = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const a = R(), b = R(), c = R(); for (let e = 0; e < 2; e++) { seed.set([a, b, c], (i * 2 + e) * 3); end[i * 2 + e] = e; } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(seed, 3)); g.setAttribute('endp', new THREE.BufferAttribute(end, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...WIND, camPos: U.camPos }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float endp; uniform vec3 off; uniform vec3 vdir; uniform float len; uniform vec3 center; varying float va;
      void main(){
        vec3 p = center + (fract(position + off / ${BOX}.0) - 0.5) * ${BOX}.0;
        p -= vdir * len * endp * (0.6 + position.y * 0.8);
        float dist = length(p - cameraPosition);
        va = smoothstep(2., 10., dist) * exp(-dist / 140.) * (1. - endp * 0.7);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform float A; varying float va; void main(){ gl_FragColor = vec4(vec3(0.62, 0.76, 0.92) * va * A, 1.); }`,
  });
  const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false; scene.add(ls);
}
const windSpeed = t => 17 + 9 * storm(t) + 16 * gustEnv(t);                               // m/s, for the streaks (illustrative)
const windInt = t => { let s = 0; const n = 200; for (let i = 0; i < n; i++) { const x = t * (i + 0.5) / n; s += windSpeed(x); } return s * t / n; };

// ================= the light curtain above the beam =================
const curtain = (() => {
  const g = new THREE.PlaneGeometry(9000, 600, 1, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.); wp=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: SCAN_GLSL + `uniform float CB; varying vec3 wp; void main(){
      float dist = length(wp - camPos);
      float a = exp(-max(wp.y, 0.) / 60.) * 0.05 + exp(-max(wp.y, 0.) / 6.) * 0.05;
      a *= smoothstep(150., 600., dist) * exp(-dist / 3000.) * BI * CB;
      gl_FragColor = vec4(ECHO * a, 1.); }`,
  });
  const c = new THREE.Mesh(g, m); c.position.y = 300; scene.add(c); return c;
})();

// ================= post (one chain per renderer) =================
function mkChain(r) {
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.5, 30000);
  const composer = new EffectComposer(r, new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setPixelRatio(PR); composer.setSize(W, H);
  const pass = new RenderPass(scene, camera); composer.addPass(pass);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.5, 0.6));
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, fade: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float fade;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
        vec2 q = vUv - .5; c *= 1. - dot(q, q) * 0.85;
        c = c / (1. + c * 0.25);
        c *= fade;
        c += (h(gl_FragCoord.xy) - .5) * (1.0 / 255.);
        gl_FragColor = vec4(max(c, 0.), 1.); }`,
  });
  composer.addPass(grade);
  return { r, camera, composer, grade, pass };
}
const VA = mkChain(renderer), VB = mkChain(renderer2);
const MOON = buildMoon(rng), GLOBE = buildGlobe(), ROOM = buildRoom(rng);
const sceneOf = shot => shot === 'M' ? MOON.scene : shot === 'G' ? GLOBE.scene : shot === 'R' ? ROOM.scene : scene;

// ================= cameras per shot =================
const camR1 = (() => { const v = SIDE.clone(); return v; })();
// pick the side from which the dish's aim points to screen-right
function sideSign(posDir) { const fwd = posDir.clone().negate(); const right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)); return right.dot(AIMH) > 0 ? 1 : -1; }
const SS = sideSign(SIDE) ;
function shake(t, amp, f = 9) { return [amp * wob(t, f, 0.7), amp * wob(t, f * 1.13, 2.9)]; }
function camSpec(id, t) {
  const p = poseAt(t), aim = aimOf(p);
  dish.rotation.set((90 - p.el) * D2R, p.phi, 0); dish.updateMatrixWorld(true);
  const focus = V3(0, V0 + F + 1.4, 0).applyMatrix4(dish.matrixWorld);
  switch (id) {
    case 'S1': { const pos = camAt(t); return { pos, look: pos.clone().addScaledVector(FWD, 100), fov: 36 }; }
    case 'S2': {
      const k = ss(seg(t, T.c2 - 0.6, T.c3a));
      const a = lerp(-0.18, 0.10, k), dir = SIDE.clone().multiplyScalar(SS).applyAxisAngle(V3(0, 1, 0), a);
      const pos = PIV.clone().addScaledVector(dir, 112).addScaledVector(AIMH, 30); pos.y = 9 + 3 * k;
      return { pos, look: PIV.clone().add(V3(0, 5, 0)).addScaledVector(AIMH, 6), fov: 40 };
    }
    case 'S3a': {
      const k = seg(t, T.c3a, T.c3b);
      const pos = focus.clone().addScaledVector(SIDE, SS * (30 - 4 * k)).addScaledVector(aim, -6).add(V3(0, -3, 0));
      const look = focus.clone().addScaledVector(aim, -12);
      return { pos, look, fov: 42, shake: 0.0035 + 0.02 * gustEnv(t) + 0.004 * storm(t) };
    }
    case 'S3b': {
      const k = seg(t, T.c3b, T.c3c);
      const pos = PIV.clone().addScaledVector(AIMH, -128 + 8 * k).addScaledVector(SIDE, SS * 70); pos.y = 6.5;
      return { pos, look: PIV.clone().add(V3(0, 9, 0)).addScaledVector(AIMH, 12), fov: 44, shake: 0.002 + 0.03 * gustEnv(t) };
    }
    case 'S3c': {
      const k = seg(t, T.c3c, T.c4);
      const c = V3(0, 15, 0);
      const pos = c.clone().addScaledVector(SIDE, SS * (19 - 3 * k)).addScaledVector(AIMH, -7).add(V3(0, 4, 0));
      return { pos, look: c.clone().add(V3(0, 2.5, 0)), fov: 42, shake: 0.002 };
    }
    case 'M': return MOON.camAt(t, T.c4 - 0.3, T.cG + 0.3);
    case 'G': return GLOBE.camAt(t, T.cG - 0.3, T.c5);
    case 'R': return ROOM.camAt(t, T.c5, T.roomMove, T.c5tv);
    case 'TV': return ROOM.camAt(T.c5tv - 0.001, T.c5, T.roomMove, T.c5tv);
    case 'S6': {
      const k = eio(seg(t, T.c6, STORY_END - 0.2));
      const near = PIV.clone().addScaledVector(AIMH, -70).addScaledVector(SIDE, -SS * 64).add(V3(0, -12, 0));
      const far = PIV.clone().addScaledVector(AIMH, -205).addScaledVector(SIDE, -SS * 155).add(V3(0, 16, 0));
      const pos = near.lerp(far, k);
      return { pos, look: PIV.clone().add(V3(0, lerp(14, 4, k), 0)).addScaledVector(AIMH, lerp(30, 12, k)).addScaledVector(SIDE, SS * lerp(0, 40, k)), fov: lerp(46, 38, k), shake: 0.0015 * (1 - k) };
    }
  }
}
function setCam(cam, spec, t) {
  cam.fov = spec.fov; cam.position.copy(spec.pos); cam.lookAt(spec.look); cam.updateProjectionMatrix();
  if (spec.shake) { const [a, b] = shake(t, spec.shake, 11); cam.rotateY(a); cam.rotateX(b); }
  cam.updateMatrixWorld();
}
const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];

// ================= scans =================
function nightS(t) {
  const b = (t - T.sweep0) / BEAT;
  if (b <= 0) return S_FAR;
  if (b >= T.sweepBeats) return S_RIGHT + (b - T.sweepBeats) * BEAT * 30;
  const k = Math.floor(b), f = b - k;
  const p = 0.4 * b + 0.6 * (k + eo(clamp(f / 0.7)));
  const P0 = 0.45, P1 = 1.68, P2 = T.sweepBeats;
  if (p < P0) return lerp(S_FAR, S_LEFT, eio(p / P0));
  if (p < P1) return lerp(S_LEFT, S_DISH, (p - P0) / (P1 - P0));
  return lerp(S_DISH, S_RIGHT, (p - P1) / (P2 - P1));
}
const lin = (t0, s0, v) => t => s0 + v * Math.max(0, t - t0) * (1 - 0.35 * Math.exp(-Math.max(0, t - t0) * 3));
let S6_START = 0;
const SWEEPS = [
  { t0: T.sweep0, S: nightS, bi: t => seg(t, T.ign, T.ign + 0.18) * (1 - 0.55 * seg(t, 5.6, 7.2)) },
  { t0: T.day, S: lin(T.day, S_FAR + 650, 900), bi: t => 1 - 0.6 * seg(t, T.day + 2, T.day + 4) },
  { t0: T.c3a + 0.2, S: lin(T.c3a + 0.2, S_FAR - 200, 900), bi: t => 1 - 0.6 * seg(t, T.c3a + 2.5, T.c3a + 4) },
  { t0: T.c4 + 0.4, S: lin(T.c4 + 0.4, S_FAR - 200, 700), bi: t => 0.8 - 0.5 * seg(t, T.c4 + 3, T.c4 + 5) },
  { t0: T.c6, S: t => S6_START + 210 * Math.max(0, t - T.c6), bi: t => seg(t, T.c6, T.c6 + 0.1) * (1 - 0.5 * seg(t, T.c6 + 3, T.c6 + 5)) },
];
function scanState(t) {
  let i = 0; for (let k = 0; k < SWEEPS.length; k++) if (t >= SWEEPS[k].t0) i = k;
  const cur = SWEEPS[i], prev = i > 0 ? SWEEPS[i - 1] : null;
  return { S: cur.S(t), SP: prev ? prev.S(t) : -1e6, BI: cur.bi(t), idx: i };
}

// ================= overlay =================
const ov = document.getElementById('ov'); ov.width = W * PR; ov.height = H * PR;
const g2 = ov.getContext('2d'); g2.scale(PR, PR);
const SANS = '"Plex", sans-serif', MONO = '"JBM", monospace', CJK = '"NotoSC", sans-serif';
let CAM = VA.camera;
const proj = v => { const p = v.clone().project(CAM); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };
const projDir = d => proj(CAM.position.clone().addScaledVector(d, 9000));
const age = (p, len) => { const d = U.S.value - sAt(p); return d < 0 ? (U.SP.value - sAt(p) > 0 ? Math.exp(-(U.SP.value - sAt(p)) / len) : 0) : Math.exp(-d / len); };
function spaced(txt, x, y, sp) { for (const ch of txt) { g2.fillText(ch, x, y); x += g2.measureText(ch).width + sp; } return x; }
function spacedW(txt, sp) { let w = 0; for (const ch of txt) w += g2.measureText(ch).width + sp; return w - sp; }
const C = { hi: [238, 242, 246], mid: [196, 206, 216], lo: [150, 162, 176], echo: [190, 220, 255], moon: [242, 196, 141], red: [255, 140, 120] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
function quiet(x, y, w, h, a = 0.8) {
  a *= 1 - 0.75 * U.DAYA.value;            // on the grey storm sky a dark patch would show; keep it for the night only
  if (a <= 0) return;
  const cx = x + w / 2, cy = y + h / 2; g2.save(); g2.translate(cx, cy); g2.scale(w * 0.62, h * 0.75);
  const gr = g2.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(0,0,0,${a.toFixed(3)})`); gr.addColorStop(0.6, `rgba(0,0,0,${(a * 0.8).toFixed(3)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g2.fillStyle = gr; g2.beginPath(); g2.arc(0, 0, 1, 0, Math.PI * 2); g2.fill(); g2.restore();
}
// text written by a scanning bar: the clip grows left → right and a 1 px bright edge leads
function scanWrite(txt, x, y, font, sp, col, a, k, edgeH) {
  if (k <= 0) return 0;
  g2.font = font; const w = spacedW(txt, sp);
  const xe = x - 4 + (w + 8) * eo(clamp(k));
  g2.save(); g2.beginPath(); g2.rect(x - 6, y - edgeH * 1.1, xe - x + 6, edgeH * 1.6); g2.clip();
  g2.fillStyle = rgba(col, a); spaced(txt, x, y, sp); g2.restore();
  if (k < 1) { const ea = Math.sin(Math.PI * clamp(k)) * 0.9; g2.fillStyle = rgba([235, 245, 255], ea * Math.min(1, a * 1.3)); g2.fillRect(xe, y - edgeH * 1.05, 1.2, edgeH * 1.45); }
  return w;
}
let TEXTS_NOW = [];
const pushText = (id, text, x0, y0, x1, y1) => TEXTS_NOW.push({ id, text, x0, y0, x1, y1 });
// a block of lines that writes on, holds and (optionally) is erased by a scan
function block(id, t, t0, t1, x, y, lines, { out = 0.25 } = {}) {
  if (t < t0 || t > t1 + out) return;
  const a = 1 - seg(t, t1, t1 + out);
  let yy = y, maxw = 0, full = true;
  for (const [i, L] of lines.entries()) {
    const k = seg(t, t0 + (L.delay ?? i * 0.18), t0 + (L.delay ?? i * 0.18) + (L.dur ?? 0.45));
    if (k < 1) full = false;
    yy += L.dy ?? 0;
    const w = scanWrite(L.text, x, yy, L.font, L.sp ?? 1.2, L.col ?? C.mid, (L.a ?? 0.9) * a, k, L.eh ?? 14);
    maxw = Math.max(maxw, w);
  }
  if (a >= 1) { let y2 = y; for (const [i, L] of lines.entries()) { y2 += L.dy ?? 0; const k = seg(t, t0 + (L.delay ?? i * 0.18), t0 + (L.delay ?? i * 0.18) + (L.dur ?? 0.45)); if (k >= 1) pushText(`${id}-${i}`, L.text, x, y2 - 30, x + maxw, y2 + 6); } }
}

// fixed echo blips (returns from rocks)
const blips = []; { const r = rng(7); for (let i = 0; i < 140; i++) { const x = -380 + r() * 1200, z = -700 + r() * 900; if (Math.hypot(x, z) < 50) continue; blips.push({ p: V3(x, heightAt(x, z) + 0.3, z), s: r() }); } }
const TAGS = [[1500, 850]].map(([x, y]) => { const p = rayGroundC(cam0, x, y); p.y = heightAt(p.x, p.z) + 0.5; return { p, txt: `R ${(Math.hypot(p.x, p.z) / 1000).toFixed(2)} km` }; });
let T_REVEAL = 1.1;

// ---------- subtitles (burned in; bilingual; bottom-left, a hairline ties the two lines) ----------
let VODUR = {};
function subtitle(t) {
  for (const v of VO) {
    const d = VODUR[v.id] || 3; const t0 = v.t - 0.15, t1 = v.t + d + 0.45;
    if (t < t0 || t > t1) continue;
    const a = seg(t, t0, t0 + 0.18) * (1 - seg(t, t1 - 0.2, t1));
    const x = 132, yz = 976, ye = 1018;
    quiet(x - 30, yz - 44, 1100, 90, 0.55 * a);
    g2.strokeStyle = rgba(C.echo, 0.55 * a); g2.lineWidth = 1; g2.beginPath(); g2.moveTo(x - 18, yz - 30); g2.lineTo(x - 18, ye + 6); g2.stroke();
    g2.font = `300 34px ${CJK}`; g2.fillStyle = rgba([236, 240, 245], 0.96 * a); spaced(v.zh, x, yz, 2);
    g2.font = `300 23px ${SANS}`; g2.fillStyle = rgba([170, 184, 198], 0.95 * a); spaced(v.en, x, ye, 0.6);
  }
}

// ---------- shot overlays ----------
function ovS1(t) {
  // echo blips & range tags (night)
  for (const b of blips) {
    const a = age(b.p, 240) * (1 - seg(t, T.day, T.day + 1)); if (a < 0.02) continue;
    const [x, y, z] = proj(b.p); if (z > 1 || x < 0 || x > W || y < 0 || y > H) continue;
    const r = 0.7 + b.s * 1.0;
    g2.fillStyle = rgba(C.echo, a * (0.18 + b.s * 0.45)); g2.beginPath(); g2.ellipse(x, y, r * 1.2, r * 0.6, 0, 0, Math.PI * 2); g2.fill();
  }
  const dayEdge = dayBeamX(t);                                 // the day scan erases the night labels as it passes
  g2.save(); if (dayEdge > -1) { g2.beginPath(); g2.rect(dayEdge, 0, W - dayEdge, H); g2.clip(); }
  for (const tg of TAGS) {
    const a0 = age(tg.p, 330); if (a0 < 0.03) continue;
    const a = Math.max(a0, 0.55); const [x, y] = proj(tg.p);
    g2.strokeStyle = rgba(C.echo, a * 0.75); g2.lineWidth = 0.8;
    g2.beginPath(); g2.moveTo(x - 5, y); g2.lineTo(x + 5, y); g2.moveTo(x, y - 5); g2.lineTo(x, y + 5); g2.moveTo(x, y - 7); g2.lineTo(x, y - 26); g2.stroke();
    g2.font = `300 11px ${MONO}`; g2.fillStyle = rgba(C.echo, a * 0.85); spaced(tg.txt, x + 6, y - 30, 1.2);
  }
  if (U.BI.value > 0.01 && t < T.day) {   // scan readout riding the beam
    const onBeam = k => { const q = V3(scanDir.x * U.S.value - scanDir.y * k, 0, scanDir.y * U.S.value + scanDir.x * k); q.y = heightAt(q.x, q.z); return q; };
    let p1 = null; for (let k = -600; k <= 600; k += 4) { const q = proj(onBeam(k)); if (q[2] < 1 && q[1] < 1046 && q[1] > 860 && (!p1 || q[1] > p1[1])) p1 = q; }
    if (p1 && p1[1] < 900) p1 = null;
    if (p1) { g2.font = `300 11px ${MONO}`; g2.fillStyle = rgba([220, 235, 250], 0.8 * U.BI.value); spaced('SCAN 012.2°', p1[0] + 16, p1[1] - 4, 1.4); }
  }
  {   // telescope tag
    const a0 = age(V3(-20, 0, 10), 300);
    if (a0 > 0.01 && t > T_REVEAL) {
      const a = Math.max(a0, 0.8) * seg(t, T_REVEAL + 0.1, T_REVEAL + 0.5);
      const [x, y] = proj(V3(0, 9, 4)); const lx = x - 300, ly = y + 40;
      g2.strokeStyle = rgba(C.mid, a * 0.5); g2.lineWidth = 0.8;
      g2.beginPath(); g2.moveTo(x - 30, y + 10); g2.lineTo(lx + 230, ly - 18); g2.lineTo(lx, ly - 18); g2.stroke();
      g2.font = `300 13px ${MONO}`; g2.fillStyle = rgba(C.hi, a * 0.9); const w1 = spaced('MURRIYANG', lx, ly + 2, 2.2);
      g2.font = `300 12px ${MONO}`; g2.fillStyle = rgba(C.mid, a * 0.92); const w2 = spaced('PARKES RADIO TELESCOPE · Ø 64 m', lx, ly + 22, 1.3);
      if (a > 0.6 && t < T.day) pushText('teltag', 'MURRIYANG / PARKES RADIO TELESCOPE · Ø 64 m', lx, ly - 12, Math.max(w1, w2), ly + 25);
    }
  }
  // title block (night): written by the scan bar, erased by the day scan
  {
    const X = 96, Y = 178;
    const k1 = seg(t, T.title, T.title + 0.7);
    if (k1 > 0) { quiet(X - 10, Y - 58, 580, 120, 0.7 * seg(t, T.title, T.title + 0.4)); const w = scanWrite('Catching the Moon', X, Y, `200 64px ${SANS}`, 1.5, C.hi, 0.95, k1, 50); if (k1 >= 1 && t < T.day) pushText('title', 'Catching the Moon', X, Y - 52, X + w, Y + 14); }
    const k2 = seg(t, T.cn, T.cn + 0.5);
    if (k2 > 0) { const w = scanWrite('狂风里接住登月直播', X + 2, Y + 50, `300 34px ${CJK}`, 6, C.mid, 0.9, k2, 28); if (k2 >= 1 && t < T.day) pushText('cn', '狂风里接住登月直播', X, Y + 20, X + 2 + w, Y + 58); }
    const k3 = seg(t, T.mono, T.mono + 0.5);
    if (k3 > 0) {
      quiet(X - 6, Y + 84, 420, 60, 0.8 * k3);
      g2.strokeStyle = rgba(C.mid, 0.4 * k3); g2.lineWidth = 0.8; g2.beginPath(); g2.moveTo(X + 2, Y + 80); g2.lineTo(X + 2 + 46 * eo(k3), Y + 80); g2.stroke();
      const w1 = scanWrite('17–20 JUL 1969 · CRUISE TO THE MOON', X + 2, Y + 110, `300 14px ${MONO}`, 1.6, C.mid, 0.9, k3, 12);
      const k4 = seg(t, T.mono + 0.15, T.mono + 0.65);
      const w2 = scanWrite('PARKES, NSW · 32°59′S 148°15′E', X + 2, Y + 134, `300 12px ${MONO}`, 1.6, C.mid, 0.85, k4, 10);
      if (k3 >= 1 && t < T.day) pushText('mono', '17–20 JUL 1969 · CRUISE TO THE MOON', X, Y + 98, X + 2 + w1, Y + 114);
      if (k4 >= 1 && t < T.day) pushText('coord', 'PARKES, NSW · 32°59′S 148°15′E', X, Y + 124, X + 2 + w2, Y + 138);
    }
  }
  g2.restore();
  if (dayEdge > -1 && dayEdge < W) {     // the day scan's bright edge, top to bottom
    const gr = g2.createLinearGradient(dayEdge - 40, 0, dayEdge + 2, 0); gr.addColorStop(0, 'rgba(180,215,255,0)'); gr.addColorStop(1, 'rgba(200,225,255,0.10)');
    g2.fillStyle = gr; g2.fillRect(dayEdge - 40, 0, 42, H);
    g2.fillStyle = 'rgba(225,238,255,0.55)'; g2.fillRect(dayEdge, 0, 1.2, H);
  }
  // day label: written only where the day scan has already passed
  g2.save(); if (t >= T.day && dayEdge < W) { g2.beginPath(); g2.rect(0, 0, Math.max(0, dayEdge), H); g2.clip(); }
  block('day', t, T.dayLabel, T.c2 + 0.25, 96, 196, [
    { text: '登月当天', font: `300 40px ${CJK}`, sp: 8, col: C.hi, eh: 32 },
    { text: '21 JUL 1969 · STORM', font: `300 14px ${MONO}`, sp: 1.8, dy: 44, col: C.mid },
  ], { out: 0.01 });
  g2.restore();
}
let dayBeamCache = null;
function dayBeamX(t) {
  if (t < T.day) return -2;
  const S = SWEEPS[1].S(t);
  // where the day scan crosses the middle band of the frame
  const q1 = V3(scanDir.x * S - scanDir.y * 300, 0, scanDir.y * S + scanDir.x * 300), q2 = V3(scanDir.x * S + scanDir.y * 300, 0, scanDir.y * S - scanDir.x * 300);
  const c = [q1, q2].map(v => proj(v)).filter(p => p[2] < 1);
  if (!c.length) return W + 10;
  const a = c[0], b = c[1] || c[0];
  const x = (a[0] + b[0]) / 2;
  return clamp(x, -1, W + 10);
}

function ovS2(t) {
  // the elevation gauge, large: horizontal through the axle, an arc to the dish axis, live readout → limit
  const p = poseAt(t), [px, py] = proj(PIV), aim = aimOf(p);
  const [ax, ay] = proj(PIV.clone().addScaledVector(aim, 40));
  const hz = proj(PIV.clone().add(V3(Math.sin(p.phi), 0, Math.cos(p.phi)).multiplyScalar(40)));
  const sa = Math.atan2(ay - py, ax - px), ha = Math.atan2(hz[1] - py, hz[0] - px);
  const k = seg(t, T.c2 + 0.3, T.c2 + 0.8), R0 = 150;
  if (k > 0) {
    g2.strokeStyle = rgba(C.mid, 0.4 * k); g2.lineWidth = 1; g2.setLineDash([3, 5]);
    g2.beginPath(); g2.moveTo(px, py); g2.lineTo(px + Math.cos(ha) * 520, py + Math.sin(ha) * 520); g2.stroke(); g2.setLineDash([]);
    g2.strokeStyle = rgba(C.hi, 0.75 * k); g2.lineWidth = 1.2;
    g2.beginPath(); g2.arc(px, py, R0, Math.min(sa, ha), Math.max(sa, ha)); g2.stroke();
    for (let d = 30; d <= 60; d += 10) { const a = ha - d * D2R * Math.sign(ha - sa || 1) * -1; }
    const lx = px + Math.cos(ha) * 540 + 14, ly = py + Math.sin(ha) * 540 + 6;
    const locked = t > T.tip1 + 0.1;
    quiet(lx - 20, ly - 70, 460, 130, 0.7 * k);
    g2.font = `200 56px ${SANS}`; g2.fillStyle = rgba(locked ? C.hi : C.mid, 0.95 * k);
    spaced(locked ? '29°38′' : `${p.el.toFixed(1)}°`, lx, ly, 1);
    g2.font = `300 14px ${MONO}`; g2.fillStyle = rgba(C.mid, 0.9 * k);
    spaced('ELEVATION', lx + 2, ly - 52, 2.2);
    const c2 = seg(t, T.c2 + 0.5, T.c2 + 1.0);
    if (c2 > 0) {
      scanWrite('LIMIT 29°38′ · THE DISH’S OWN HORIZON', lx + 2, ly + 30, `300 14px ${MONO}`, 1.6, locked ? C.hi : C.mid, 0.9, c2, 12);
      if (c2 >= 1) pushText('limit', 'LIMIT 29°38′ · THE DISH’S OWN HORIZON', lx, ly + 18, lx + 380, ly + 34);
    }
  }
  block('moonwait', t, 15.1, T.c3a - 0.05, 96, 150, [
    { text: 'WAITING FOR THE MOON', font: `300 15px ${MONO}`, sp: 2.4, col: C.hi },
  ]);
}

// wind strip chart: an unscaled trace (illustrative) with the 110 km/h line; two spikes cross it at the gusts
function windChart(t, x, y, w, h, a) {
  if (a <= 0) return;
  quiet(x - 30, y - 50, w + 60, h + 100, 0.6 * a);
  g2.font = `300 14px ${MONO}`; g2.fillStyle = rgba(C.hi, 0.9 * a); spaced('WIND', x, y - 18, 2.4);
  g2.fillStyle = rgba(C.mid, 0.85 * a); spaced('ANEMOMETER TRACE', x + 78, y - 18, 1.4);
  const yl = y + h * 0.3;                                       // the 110 km/h line
  g2.strokeStyle = rgba(C.red, 0.7 * a); g2.lineWidth = 1; g2.setLineDash([4, 4]); g2.beginPath(); g2.moveTo(x, yl); g2.lineTo(x + w, yl); g2.stroke(); g2.setLineDash([]);
  g2.font = `300 13px ${MONO}`; g2.fillStyle = rgba(C.red, 0.95 * a); spaced('110 km/h', x + w + 10, yl + 4, 1.2);
  g2.strokeStyle = rgba(C.lo, 0.4 * a); g2.beginPath(); g2.moveTo(x, y + h); g2.lineTo(x + w, y + h); g2.stroke();
  // the trace scrolls: the right edge is "now"
  const span = 6.0, now = t;
  const val = s => { const base = 0.32 + 0.22 * storm(s) + 0.05 * wob(s, 3.1, 0.4) + 0.03 * wob(s, 9.7, 1.9); return base + 0.62 * gustEnv(s); };
  g2.strokeStyle = rgba(C.echo, 0.95 * a); g2.lineWidth = 1.4; g2.beginPath();
  for (let i = 0; i <= 240; i++) { const s = now - span + span * i / 240; const v = val(s); const px = x + w * i / 240, py = y + h - v * h; i ? g2.lineTo(px, py) : g2.moveTo(px, py); }
  g2.stroke();
  for (const [tg, lab] of [[T.g1, 'GUST 1'], [T.g2, 'GUST 2']]) {
    if (now < tg - 0.1 || now > tg + span) continue;
    const px = x + w * (1 - (now - tg) / span), b = seg(now, tg - 0.1, tg + 0.15);
    g2.strokeStyle = rgba(C.red, 0.8 * a * b); g2.beginPath(); g2.moveTo(px, y - 4); g2.lineTo(px, yl - 4); g2.stroke();
    g2.font = `300 13px ${MONO}`; g2.fillStyle = rgba(C.red, a * b); spaced(`${lab} > 110 km/h`, px + 8, y + 4, 1.2);
  }
}
function ovS3(t, id) {
  const a = seg(t, T.c3a + 0.2, T.c3a + 0.6) * (1 - seg(t, T.c3c - 0.15, T.c3c));
  windChart(t, 130, 170, 560, 220, a);
  if (t > T.g1 + 0.1 && t < T.c3c) pushText('chart', 'WIND / 110 km/h', 130, 140, 800, 400);
  if (id === 'S3b') {   // the wind alarm (as recorded in the control room)
    const on = (Math.floor((t - T.c3b) * 4) % 2 === 0) ? 1 : 0.35;
    const k = seg(t, T.c3b + 0.02, T.c3b + 0.2);
    g2.fillStyle = rgba(C.red, 0.9 * k * on); g2.beginPath(); g2.arc(1424, 158, 5, 0, Math.PI * 2); g2.fill();
    g2.font = `300 15px ${MONO}`; g2.fillStyle = rgba(C.red, 0.95 * k); spaced('WIND ALARM', 1442, 164, 2.6);
    if (k >= 1) pushText('alarm', 'WIND ALARM', 1420, 150, 1700, 170);
    // flash on the slam
    const f = Math.exp(-Math.max(0, t - T.g2) * 6) * (t > T.g2 ? 1 : 0);
    if (f > 0.01) { g2.fillStyle = `rgba(200,225,255,${(0.10 * f).toFixed(3)})`; g2.fillRect(0, 0, W, H); }
  }
}
function ovS3c(t) {
  // the comparison panel: what the dish was considered safe for vs the gusts. Whole in frame, held ≥ 2.5 s.
  const k = seg(t, T.c3c, T.c3c + 0.3);
  g2.fillStyle = `rgba(0,0,0,${(0.62 * k).toFixed(3)})`; g2.fillRect(0, 0, W, H);
  const x = 210, y = 360, UNIT = 108;
  block('force', t, T.c3c + 0.02, FILM_DUR, x, y, [{ text: 'WIND FORCE ON THE DISH', font: `300 16px ${MONO}`, sp: 2.4, col: C.hi, dur: 0.25 }], { out: 0.01 });
  const kb = seg(t, T.c3c + 0.1, T.c3c + 0.4);
  block('safe', t, T.c3c + 0.05, FILM_DUR, x, y + 60, [{ text: 'CONSIDERED SAFE', font: `300 14px ${MONO}`, sp: 1.6, col: C.mid, dur: 0.2 }], { out: 0.01 });
  g2.fillStyle = rgba(C.echo, 0.85 * k); g2.fillRect(x, y + 74, UNIT * eo(kb), 14);
  block('gusts', t, T.c3c + 0.1, FILM_DUR, x, y + 140, [{ text: 'THE GUSTS, 21 JULY', font: `300 14px ${MONO}`, sp: 1.6, col: C.mid, dur: 0.2 }], { out: 0.01 });
  const kb2 = seg(t, T.c3c + 0.2, T.c3c + 0.75);
  for (let i = 0; i < 10; i++) { const kk = clamp(kb2 * 10 - i); g2.fillStyle = rgba(i === 0 ? C.echo : C.red, 0.9 * k); g2.fillRect(x + i * (UNIT + 4), y + 154, UNIT * eo(kk), 14); }
  block('x10', t, T.c3c + 0.25, FILM_DUR, x + 1170, y + 150, [{ text: '×10', font: `200 150px ${SANS}`, sp: 2, col: C.hi, eh: 120, dur: 0.3 }], { out: 0.01 });
  block('x10cn', t, T.c3c + 0.3, FILM_DUR, x + 1178, y + 210, [{ text: '十倍风力', font: `300 38px ${CJK}`, sp: 8, col: C.hi, eh: 30, dur: 0.3 }], { out: 0.01 });
}
const SRC = [[0, 'GDS'], [99, 'HSK'], [282, 'GDS'], [336, 'HSK'], [409, 'GDS'], [531, 'PKS']];   // seconds after 12:54:00
function sourceTrack(t, x, y, w, k, a) {
  if (k <= 0 || a <= 0) return;
  const SPAN = 600, tx = s => x + w * s / SPAN;
  quiet(x - 30, y - 60, w + 80, 140, 0.65 * a);
  g2.font = `300 16px ${MONO}`; g2.fillStyle = rgba(C.hi, 0.97 * a); spaced('PICTURE THE WORLD SAW', x, y - 30, 2.4);
  const upto = SPAN * k;
  for (let i = 0; i < SRC.length; i++) {
    const [s0, name] = SRC[i], s1 = i + 1 < SRC.length ? SRC[i + 1][0] : SPAN;
    if (name === 'PKS') continue;                        // revealed later, on the TV
    if (s0 > upto) break;
    const e = Math.min(s1, upto);
    const col = name === 'HSK' ? C.hi : C.lo;
    g2.fillStyle = rgba(col, (name === 'HSK' ? 0.9 : 0.5) * a); g2.fillRect(tx(s0), y, tx(e) - tx(s0) - 2, 10);
    g2.font = `300 14px ${MONO}`; g2.fillStyle = rgba(col, 0.95 * a); if (e - s0 > 40) spaced(name, tx(s0) + 2, y + 32, 1.4);
  }
  // first step marker
  if (upto > 140) {
    const fx = tx(140);
    g2.strokeStyle = rgba(C.moon, 0.9 * a); g2.lineWidth = 1; g2.beginPath(); g2.moveTo(fx, y - 8); g2.lineTo(fx, y + 52); g2.stroke();
    g2.font = `300 15px ${MONO}`; g2.fillStyle = rgba(C.moon, a); spaced('12:56:20 FIRST STEP · VIA HSK', fx + 8, y + 68, 1.5);
  }
  // the cursor waits at 13:02:51
  if (upto > 520) { const cx = tx(531); const bl = Math.floor(t * 3) % 2 ? 0.9 : 0.25; g2.fillStyle = rgba(C.moon, bl * a); g2.fillRect(cx, y - 4, 2, 18); g2.font = `300 14px ${MONO}`; g2.fillStyle = rgba(C.hi, 0.95 * a); spaced('13:02:51 ?', cx + 8, y + 32, 1.4); }
  if (k >= 1 && a >= 1) { pushText('track0', 'PICTURE THE WORLD SAW', x, y - 44, x + 300, y - 26); pushText('track1', 'GDS HSK GDS HSK GDS', x, y + 18, x + w, y + 34); pushText('track2', '12:56:20 FIRST STEP · VIA HSK', x, y + 54, x + 400, y + 70); pushText('track3', '13:02:51 ?', x + w * 531 / 600, y + 18, x + w, y + 34); }
}

// ---------- the three new spaces ----------
const projA = (v, cam = CAM) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };
function leaderTag(id, t, t0, pt, dx, dy, title, sub, col = C.hi) {
  const k = seg(t, t0, t0 + 0.4); if (k <= 0) return;
  const [x, y] = projA(pt), lx = x + dx, ly = y + dy;
  g2.strokeStyle = rgba(col, 0.6 * k); g2.lineWidth = 1; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(lx, ly); g2.lineTo(lx + (dx >= 0 ? 40 : -40), ly); g2.stroke();
  g2.fillStyle = rgba(col, 0.9 * k); g2.beginPath(); g2.arc(x, y, 3, 0, Math.PI * 2); g2.fill();
  const tx = dx >= 0 ? lx + 48 : lx - 48;
  g2.font = `300 16px ${MONO}`; const w = spacedW(title, 2); const x0 = dx >= 0 ? tx : tx - w;
  scanWrite(title, x0, ly + 6, `300 16px ${MONO}`, 2, col, 0.97, k, 13);
  if (sub) { const k2 = seg(t, t0 + 0.2, t0 + 0.6); g2.font = `300 14px ${MONO}`; const w2 = spacedW(sub, 1.4); scanWrite(sub, dx >= 0 ? tx : tx - w2, ly + 28, `300 14px ${MONO}`, 1.4, C.mid, 0.92, k2, 11); if (k2 >= 1) pushText(id + '-s', sub, tx - 400, ly + 14, tx + 400, ly + 32); }
  if (k >= 1) pushText(id, title, x0, ly - 8, x0 + w, ly + 10);
}
function tvOnBlock(t) {
  block('tvon', t, T.tvOn + 0.05, T.cG + 2.6, 120, 150, [
    { text: '12:54:00 AEST', font: `200 52px ${SANS}`, sp: 1, col: C.hi, eh: 40 },
    { text: 'TV ON · THE CAMERA ON THE MOON', font: `300 16px ${MONO}`, sp: 1.8, dy: 38, col: C.moon },
  ]);
}
function ovM(t) {
  block('moonloc', t, T.c4 + 0.3, T.cG + 0.05, 1330, 140, [
    { text: '月面', font: `300 40px ${CJK}`, sp: 8, col: C.hi, eh: 32 },
    { text: 'SEA OF TRANQUILLITY', font: `300 16px ${MONO}`, sp: 2.2, dy: 40, col: C.mid },
  ], { out: 0.01 });
  leaderTag('lm', t, T.c4 + 0.8, MOON.lmTag, -150, -70, 'LUNAR MODULE EAGLE', null);
  const on = seg(t, T.tvOn - 0.1, T.tvOn + 0.2);
  leaderTag('tvcam', t, T.c4 + 1.3, MOON.mesaPt, -170, 90, 'TV CAMERA', null, on > 0 ? C.moon : C.hi);
  leaderTag('earth', t, T.c4 + 0.6, MOON.earthPos.clone().add(V3(-MOON.ER * 0.7, -MOON.ER * 0.7, 0)), -90, 60, 'EARTH', null);
  tvOnBlock(t);
  if (t > T.tvOn) {   // the signal leaves the Moon: a warm line with a waveform riding up to Earth
    const s = seg(t, T.tvOn, T.tvOn + 0.7);
    const [x0, y0] = projA(MOON.mesaPt), [x1, y1] = projA(MOON.earthPos);
    g2.save(); g2.globalCompositeOperation = 'lighter';
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    g2.strokeStyle = rgba(C.moon, 0.35 * s); g2.lineWidth = 1.2; g2.beginPath(); g2.moveTo(x0, y0); g2.lineTo(x0 + dx * s, y0 + dy * s); g2.stroke();
    for (let i = 0; i < 120; i++) { const q = i / 120; if (q > s) break; const a = 0.2 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(q * 60 - t * 12), 6); g2.fillStyle = rgba([255, 228, 196], a); g2.fillRect(x0 + dx * q - 1, y0 + dy * q - 1, 2, 2); }
    g2.beginPath(); const c0 = 0.55;
    for (let i = -120; i <= 120; i++) { const q = i / 120, env = Math.exp(-q * q * 7), amp = env * 20 * Math.sin(q * 110 + t * 14); const x = x0 + dx * c0 + ux * q * 80 + nx * amp, y = y0 + dy * c0 + uy * q * 80 + ny * amp; i === -120 ? g2.moveTo(x, y) : g2.lineTo(x, y); }
    g2.strokeStyle = rgba([255, 236, 210], 0.8 * seg(t, T.tvOn + 0.3, T.tvOn + 0.7)); g2.lineWidth = 1.2; g2.stroke();
    g2.restore();
  }
}
function ovG(t) {
  tvOnBlock(t);
  block('schem', t, T.cG + 0.2, T.c5, 1440, 128, [{ text: 'SCHEMATIC · NOT TO SCALE', font: `300 14px ${MONO}`, sp: 1.6, col: C.lo }], { out: 0.01 });
  const [mx, my] = projA(GLOBE.moonPos);
  // which station's picture the world is seeing, replayed along the track
  const v = 531 * seg(t, T.replay0, T.replay1);
  let active = null; if (t >= T.replay0) for (let i = 0; i < SRC.length - 1; i++) if (v >= SRC[i][0]) active = SRC[i][1];
  const kb = seg(t, T.cG + 0.4, T.cG + 1.2);
  g2.save(); g2.globalCompositeOperation = 'lighter';
  for (const k of ['GDS', 'HSK', 'PKS']) {
    const [sx, sy] = projA(GLOBE.st[k]);
    const on = active === k, col = k === 'PKS' ? C.moon : C.echo;
    g2.strokeStyle = rgba(col, (on ? 0.9 : k === 'PKS' ? 0.32 : 0.28) * kb); g2.lineWidth = on ? 1.8 : 1; if (k === 'PKS') g2.setLineDash([4, 6]);
    g2.beginPath(); g2.moveTo(mx, my); g2.lineTo(mx + (sx - mx) * kb, my + (sy - my) * kb); g2.stroke(); g2.setLineDash([]);
    if (on) { const q = (t * 1.4) % 1; g2.fillStyle = rgba([255, 240, 220], 0.9); g2.beginPath(); g2.arc(mx + (sx - mx) * q, my + (sy - my) * q, 2.4, 0, Math.PI * 2); g2.fill(); }
  }
  g2.restore();
  const dx = 1;
  leaderTag('gds', t, T.cG + 0.6, GLOBE.st.GDS, 120, -60, 'GDS · GOLDSTONE', 'CALIFORNIA');
  leaderTag('hsk', t, T.cG + 0.8, GLOBE.st.HSK, -150, 70, 'HSK · HONEYSUCKLE CREEK', 'NEAR CANBERRA');
  leaderTag('pks', t, T.cG + 1.0, GLOBE.st.PKS, -190, -70, 'PKS · PARKES', 'OFF-AXIS ONLY: MOON STILL LOW', C.moon);
  leaderTag('moon', t, T.cG + 0.5, GLOBE.moonPos.clone().add(V3(0, 30, 0)), 60, -40, 'MOON', '≈ 384 000 km · 1.3 s');
  sourceTrack(t, 840, 800, 960, seg(t, T.track, T.track + 1.0), 1 - seg(t, T.c5 - 0.05, T.c5));
  if (t >= T.replay0) {   // the replay cursor on the track
    const x = 840 + 960 * v / 600;
    g2.fillStyle = rgba(C.hi, 0.95); g2.fillRect(x - 1, 790, 2, 30);
  }
}
function ovR(t) {
  block('room', t, T.c5, T.c5tv + 0.05, 120, 150, [
    { text: '帕克斯控制室', font: `300 40px ${CJK}`, sp: 8, col: C.hi, eh: 32 },
    { text: 'PARKES CONTROL ROOM', font: `300 16px ${MONO}`, sp: 2.2, dy: 40, col: C.mid },
  ], { out: 0.01 });
  // the signal-strength meter: a voltmeter on top of the panel; the needle jumps when the Moon enters the main beam
  ROOM.meter.updateMatrixWorld(true);
  const c = V3(0, 0, 0.101).applyMatrix4(ROOM.meter.matrixWorld), e = V3(0.17, 0, 0.101).applyMatrix4(ROOM.meter.matrixWorld);
  const [cx, cy, cz] = projA(c), [ex, ey] = projA(e), r = Math.hypot(ex - cx, ey - cy);
  if (cz < 1 && r > 8) {
    const k = seg(t, T.c5 + 0.4, T.c5 + 0.8);
    const jump = seg(t, T.mainBeam, T.mainBeam + 0.25), settle = Math.exp(-Math.max(0, t - T.mainBeam - 0.25) * 6) * Math.sin(Math.max(0, t - T.mainBeam - 0.25) * 30) * 0.05;
    const lv = clamp(0.30 + 0.03 * wob(t, 7.0, 1.2) + 0.56 * eo(jump) + settle);
    const a0 = Math.PI * 1.15, a1 = Math.PI * 1.85, ang = lerp(a0, a1, lv), by = cy + r * 0.45;
    g2.strokeStyle = rgba(C.hi, 0.85 * k); g2.lineWidth = 1.2; g2.beginPath(); g2.arc(cx, by, r * 0.9, a0, a1); g2.stroke();
    for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10), r1 = r * 0.9, r2 = r * (i % 5 ? 0.82 : 0.76); g2.beginPath(); g2.moveTo(cx + Math.cos(a) * r1, by + Math.sin(a) * r1); g2.lineTo(cx + Math.cos(a) * r2, by + Math.sin(a) * r2); g2.stroke(); }
    g2.strokeStyle = rgba(jump > 0 ? C.moon : C.hi, k); g2.lineWidth = 2; g2.beginPath(); g2.moveTo(cx, by); g2.lineTo(cx + Math.cos(ang) * r * 0.86, by + Math.sin(ang) * r * 0.86); g2.stroke();
    if (jump > 0) { const gr = g2.createRadialGradient(cx, by, 0, cx, by, r * 1.4); gr.addColorStop(0, rgba(C.moon, 0.18 * jump)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = gr; g2.beginPath(); g2.arc(cx, by, r * 1.4, 0, Math.PI * 2); g2.fill(); }
    const kl = seg(t, T.c5 + 0.05, T.c5 + 0.45) * (1 - seg(t, T.roomMove + 0.3, T.roomMove + 0.42));
    scanWrite('SIGNAL STRENGTH', cx - r - 10, by + r * 0.55 + 24, `300 16px ${MONO}`, 2, C.hi, 0.97, kl, 13);
    if (kl >= 1) pushText('meter', 'SIGNAL STRENGTH', cx - r - 10, by + r * 0.55 + 10, cx + r + 100, by + r * 0.55 + 28);
  }
  // the monitor's picture (what Parkes itself was receiving), drawn on the screen in perspective
  ROOM.monG.updateMatrixWorld(true);
  const q = ROOM.screenCorners.map(v => projA(v.clone().applyMatrix4(ROOM.monG.matrixWorld)));
  if (q.every(p => p[2] < 1)) {
    const [p0, p1, , p3] = q;
    g2.save();
    g2.setTransform(PR * (p1[0] - p0[0]) / TVW, PR * (p1[1] - p0[1]) / TVW, PR * (p3[0] - p0[0]) / TVH, PR * (p3[1] - p0[1]) / TVH, PR * p0[0], PR * p0[1]);
    const clean = seg(t, T.mainBeam, T.mainBeam + 0.3);
    g2.globalAlpha = lerp(0.45, 0.9, clean); g2.drawImage(tvImg, 0, 0);
    g2.globalAlpha = lerp(0.35, 0.08, clean); g2.globalCompositeOperation = 'lighter'; g2.drawImage(noiseCv[Math.floor(t * 24) % 4], 0, 0, TVW, TVH);
    g2.globalCompositeOperation = 'source-over'; g2.globalAlpha = 1;
    g2.fillStyle = 'rgba(150,180,215,0.10)'; g2.fillRect(0, 0, TVW, TVH);
    g2.restore(); g2.setTransform(PR, 0, 0, PR, 0, 0);
  }
}
// ---------- the TV (match cut from the bowl's rim, raster written by the scan) ----------
const TVW = 960, TVH = 720;
const tvImg = document.createElement('canvas'); tvImg.width = TVW; tvImg.height = TVH;
drawMoonPicture(tvImg, rng);
const noiseCv = [0, 1, 2, 3].map(i => { const cv = document.createElement('canvas'); cv.width = TVW / 2; cv.height = TVH / 2; const c = cv.getContext('2d'); const id = c.createImageData(cv.width, cv.height); const R = rng(100 + i); for (let p = 0; p < id.data.length; p += 4) { const v = R() * 255; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255; } c.putImageData(id, 0, 0); return cv; });
let TV_RECT = null;   // where the control-room monitor's screen sits on screen at the cut
function drawTV(t) {
  const X = 480, Y = 96, TW = 960, TH = 720;
  const kI = eio(seg(t, T.c5tv, T.c5tv + 0.55));
  g2.fillStyle = '#000'; g2.fillRect(0, 0, W, H);
  const r0 = TV_RECT || { x: W / 2 - 200, y: H / 2 - 150, w: 400, h: 300 };
  // match cut: the control-room monitor's screen grows into the picture the world saw
  const cx = lerp(r0.x + r0.w / 2, X + TW / 2, kI), cy = lerp(r0.y + r0.h / 2, Y + TH / 2, kI);
  const hw = lerp(r0.w / 2, TW / 2, kI), hh = lerp(r0.h / 2, TH / 2, kI), rr = lerp(4, 18, kI);
  // CRT collapse into a vertical line (→ the next shot's scan beam)
  const kc = seg(t, T.collapse, T.collapse + 0.32);
  const sx = 1 - eo(kc) * 0.998;
  g2.save(); g2.translate(cx, cy); g2.scale(sx, 1);
  g2.beginPath(); g2.roundRect(-hw, -hh, hw * 2, hh * 2, rr); g2.clip();
  const clean = seg(t, T.sw, T.sw + 0.12);
  // raster: the scan writes the picture top → bottom, then refreshes
  const rows = 180, rowH = (hh * 2) / rows, filled = clamp(seg(t, T.c5tv + 0.1, T.c5tv + 0.8)) * rows;
  g2.imageSmoothingEnabled = true;
  g2.globalAlpha = 1;
  g2.filter = 'none';
  const jit = (1 - clean) * 3;
  for (let i = 0; i < rows; i++) {
    if (i > filled) break;
    const sy = i / rows * TVH, sh = TVH / rows;
    const off = jit * Math.sin(i * 0.7 + Math.floor(t * 24) * 1.3);
    g2.globalAlpha = lerp(0.62, 1, clean);
    g2.drawImage(tvImg, 0, sy, TVW, sh, -hw + off, -hh + i * rowH, hw * 2, rowH * 0.78);
  }
  g2.globalAlpha = lerp(0.28, 0.05, clean) * (1 - kc);
  g2.globalCompositeOperation = 'lighter';
  g2.drawImage(noiseCv[Math.floor(t * 24) % 4], -hw, -hh, hw * 2, hh * 2);
  g2.globalCompositeOperation = 'source-over'; g2.globalAlpha = 1;
  // the refresh bar (the scan) and a ghost (pre-switch)
  const bar = ((t * 0.9) % 1) * hh * 2 - hh;
  const bg = g2.createLinearGradient(0, bar - 40, 0, bar); bg.addColorStop(0, 'rgba(210,230,255,0)'); bg.addColorStop(1, 'rgba(210,230,255,0.12)');
  g2.fillStyle = bg; g2.fillRect(-hw, bar - 40, hw * 2, 40);
  if (filled < rows) { const yb = -hh + filled * rowH; g2.fillStyle = 'rgba(235,245,255,0.9)'; g2.fillRect(-hw, yb, hw * 2, 1.5); }
  // tint: cool grey; brightened as it collapses
  g2.fillStyle = `rgba(150,180,215,${(0.10).toFixed(3)})`; g2.globalCompositeOperation = 'multiply'; g2.fillRect(-hw, -hh, hw * 2, hh * 2); g2.globalCompositeOperation = 'source-over';
  if (kc > 0) { g2.fillStyle = `rgba(230,240,255,${(0.9 * kc).toFixed(3)})`; g2.fillRect(-hw, -hh, hw * 2, hh * 2); }
  g2.restore();
  // frame + readouts (only once the monitor is open, not during the collapse)
  const ka = seg(t, T.c5tv + 0.45, T.c5tv + 0.8) * (1 - seg(t, T.collapse - 0.15, T.collapse));
  if (ka > 0) {
    g2.strokeStyle = rgba(C.mid, 0.5 * ka); g2.lineWidth = 1; g2.beginPath(); g2.roundRect(X - 10, Y - 10, TW + 20, TH + 20, 24); g2.stroke();
    // the source switch, as an instrument: HSK → PKS, the arrow and PKS light up at 13:02:51
    const on = seg(t, T.sw, T.sw + 0.25);
    // a dark plate under the readouts so the picture (the ladder) never runs through the type
    g2.fillStyle = `rgba(4,6,9,${(0.82 * ka).toFixed(3)})`; g2.beginPath(); g2.roundRect(X + 2, Y + 8, 400, 158, 10); g2.fill();
    g2.strokeStyle = rgba(C.mid, 0.25 * ka); g2.lineWidth = 1; g2.beginPath(); g2.roundRect(X + 2, Y + 8, 400, 158, 10); g2.stroke();
    g2.font = `300 14px ${MONO}`; g2.fillStyle = rgba(C.mid, 0.9 * ka); spaced('SOURCE', X + 24, Y + 40, 2.4);
    g2.font = `300 26px ${MONO}`;
    let xx = X + 24; g2.fillStyle = rgba(C.hi, (1 - 0.55 * on) * ka); xx = spaced('HSK', xx, Y + 76, 2);
    g2.fillStyle = rgba(on > 0 ? C.moon : C.lo, (0.5 + 0.5 * on) * ka); xx = spaced('  →  ', xx, Y + 76, 2);
    g2.fillStyle = rgba(on > 0 ? C.moon : C.lo, (0.45 + 0.55 * on) * ka); xx = spaced('PKS', xx, Y + 76, 2);
    if (ka >= 1) pushText('src', 'SOURCE HSK → PKS', X + 24, Y + 20, xx, Y + 82);
    if (on > 0) {
      g2.strokeStyle = rgba(C.moon, 0.9 * on); g2.lineWidth = 1.2; g2.beginPath(); g2.moveTo(X + 24, Y + 90); g2.lineTo(X + 24 + (xx - X - 24) * eo(on), Y + 90); g2.stroke();
      const k2 = seg(t, T.sw + 0.1, T.sw + 0.5);
      scanWrite('13:02:51 AEST', X + 24, Y + 122, `300 18px ${MONO}`, 1.6, C.hi, 0.95, k2, 16);
      if (k2 >= 1 && ka >= 1) pushText('swt', '13:02:51 AEST', X + 24, Y + 104, X + 240, Y + 126);
      const k3 = seg(t, T.sw + 0.35, T.sw + 0.8);
      scanWrite('PARKES · MAIN BEAM', X + 24, Y + 148, `300 14px ${MONO}`, 1.6, C.moon, 0.95, k3, 12);
      if (k3 >= 1 && ka >= 1) pushText('swt2', 'PARKES · MAIN BEAM', X + 24, Y + 134, X + 300, Y + 152);
    }
  }
  if (kc > 0) {   // the bright line left behind
    const lx = cx; g2.fillStyle = `rgba(235,245,255,${(0.9 * (1 - seg(t, T.c6, T.c6 + 0.25))).toFixed(3)})`; g2.fillRect(lx - 1, 0, 2, H);
  }
}
function ovS6(t) {
  // the line from the TV becomes the scan beam: a bright edge riding the beam's screen position for a moment
  const k = seg(t, T.c6 + 0.4, T.c6 + 1.0);
  const X = 120, Y = 200;
  block('walk', t, T.c6 + 0.25, FILM_DUR, X, Y, [
    { text: '2 h 31 min', font: `200 92px ${SANS}`, sp: 1, col: C.hi, eh: 70, dur: 0.6 },
    { text: 'THE MOONWALK, HATCH TO HATCH', font: `300 14px ${MONO}`, sp: 1.6, dy: 42, col: C.mid, delay: 0.3 },
  ], { out: 0.01 });
  block('watch', t, T.ping + 0.2, FILM_DUR, X, Y + 140, [
    { text: '约 6 亿人在看', font: `300 40px ${CJK}`, sp: 6, col: C.hi, eh: 32 },
    { text: '≈ 600 MILLION PEOPLE WATCHING', font: `300 14px ${MONO}`, sp: 1.6, dy: 40, col: C.moon, delay: 0.3 },
  ], { out: 0.01 });
}

// rain, as the camera sees it: three depth layers of streaks blown slantwise (screen space, deterministic in t)
const RAIN = [0, 1, 2].map(L => { const R = rng(31 + L); return Array.from({ length: [260, 150, 70][L] }, () => [R(), R(), R()]); });
function rain2D(t, shot) {
  const A = U.DAYA.value * (0.55 + 0.45 * storm(t) + 0.9 * gustEnv(t)) * (shot === 'S4' || shot === 'S5' ? 0.55 : shot === 'S3c' ? 0.35 : 1) * (t < T.c2 + 0.3 ? clamp((dayBeamX(t) + 1) / W) : 1);
  if (A <= 0.01) return;
  const slant = 0.62 + 0.25 * gustEnv(t), near = shot === 'S3a' || shot === 'S3b' ? 1.35 : 1;
  const dx = -slant, dy = 1, n = Math.hypot(dx, dy);
  g2.save(); g2.lineCap = 'round';
  const right = t < T.c2 + 0.3 ? Math.max(0, dayBeamX(t)) : W;
  g2.beginPath(); g2.rect(0, 0, right, H); g2.clip();
  for (let L = 0; L < 3; L++) {
    const len = [16, 30, 52][L] * near, spd = [900, 1500, 2400][L] * near, a = [0.16, 0.24, 0.32][L] * A, lw = [1.0, 1.3, 1.7][L];
    g2.strokeStyle = `rgba(205,222,242,${clamp(a).toFixed(3)})`; g2.lineWidth = lw; g2.beginPath();
    for (const [u, v, w] of RAIN[L]) {
      const travel = (t * spd * (0.85 + 0.3 * w));
      const x = ((u * (W + 600) + travel * dx / n) % (W + 600) + (W + 600)) % (W + 600) - 300;
      const y = ((v * (H + 200) + travel * dy / n) % (H + 200) + (H + 200)) % (H + 200) - 100;
      g2.moveTo(x, y); g2.lineTo(x - dx / n * len, y - dy / n * len);
    }
    g2.stroke();
  }
  g2.restore();
}
function drawOverlay(t, shot) {
  g2.clearRect(0, 0, W, H);
  TEXTS_NOW = [];
  g2.textBaseline = 'alphabetic';
  if (shot === 'TV') drawTV(t);
  else {
    if (!['M', 'G', 'R'].includes(shot)) rain2D(t, shot);
    if (t < T.c2 + 0.3) ovS1(t);
    if (shot === 'S2') ovS2(t);
    if (shot === 'S3a' || shot === 'S3b') ovS3(t, shot);
    if (shot === 'S3c') { ovS3c(t); }
    if (shot === 'M') ovM(t);
    if (shot === 'G') ovG(t);
    if (shot === 'R') ovR(t);
    if (shot === 'S6') { ovS6(t); if (t < T.c6 + 0.3) drawTV(t); }
  }
  // corner ticks
  const a = seg(t, 0.5, 1.5) * (shot === 'TV' ? 0 : 1);
  g2.strokeStyle = rgba([200, 210, 220], 0.2 * a); g2.lineWidth = 0.8;
  for (const [x, y, sx2, sy2] of [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]]) { g2.beginPath(); g2.moveTo(x, y + sy2 * 16); g2.lineTo(x, y); g2.lineTo(x + sx2 * 16, y); g2.stroke(); }
  subtitle(t);
  // the end: everything sinks back into black
  const f = seg(t, T.fade, FILM_DUR - 0.25);
  if (f > 0) { g2.fillStyle = `rgba(0,0,0,${(f * f).toFixed(3)})`; g2.fillRect(0, 0, W, H); }
  // credit card: written by the scan bar like every other reading, bottom right (clear of the dish and the subtitles); it stays on the black
  if (t >= T.sign) credit(t, T.sign, true);
  if (SIGN && t >= CUT1 - 2.5 && t < T.sign) credit(t, CUT1 - 2.5, false);
}
function credit(t, t0, full) {
  const X = 1236, a = 1;
  let y = full ? 872 : 1000;
  if (full) {
    const k1 = seg(t, t0, t0 + 0.5);
    const w1 = scanWrite('Catching the Moon', X, y, `200 40px ${SANS}`, 1.2, C.hi, 0.96, k1, 32);
    if (k1 >= 1) pushText('cr-title', 'Catching the Moon', X, y - 34, X + w1, y + 8);
    const k2 = seg(t, t0 + 0.25, t0 + 0.65), k3 = seg(t, t0 + 0.4, t0 + 0.8);
    const w2 = scanWrite('雷达扫描纪录片', X + 2, y + 50, `300 34px ${CJK}`, 6, C.mid, 0.95, k2, 28);
    const w3 = scanWrite('RADAR SWEEP DOCUMENTARY', X + 2 + w2 + 20, y + 47, `300 15px ${MONO}`, 2.2, C.mid, 0.95, k3, 12);
    if (k2 >= 1) pushText('cr-style-cn', '雷达扫描纪录片', X, y + 18, X + 2 + w2, y + 56);
    if (k3 >= 1) pushText('cr-style-en', 'RADAR SWEEP DOCUMENTARY', X + 22 + w2, y + 33, X + 22 + w2 + w3, y + 50);
    y += 104;
  }
  const kl = seg(t, t0 + (full ? 0.3 : 0), t0 + (full ? 0.6 : 0.3));
  g2.strokeStyle = rgba(C.echo, 0.7 * kl); g2.lineWidth = 1; g2.beginPath(); g2.moveTo(X + 2, y - 36); g2.lineTo(X + 2 + 56 * eo(kl), y - 36); g2.stroke();
  const ks = seg(t, t0 + (full ? 0.4 : 0.1), t0 + (full ? 0.8 : 0.6));
  const ws = scanWrite('LemoLab × Claude Opus 5.5', X + 2, y, `300 28px ${SANS}`, 1.4, C.hi, 0.97 * a, ks, 22);
  if (ks >= 1) pushText('cr-sign', 'LemoLab × Claude Opus 5.5', X, y - 24, X + 2 + ws, y + 8);
}

// ================= world state =================
function setWorld(t) {
  const sc = scanState(t);
  U.S.value = sc.S; U.SP.value = sc.SP; U.BI.value = sc.BI;
  U.AMB.value = seg(t, T.ign, T.ign + 2.0);
  U.CB.value = 1 + 2.0 * (1 - seg(t, 1.2, 2.8)) * seg(t, T.ign, T.ign + 0.25) * (sc.idx === 0 ? 1 : 0);
  U.RL.value = seg(t, T_REVEAL - 0.05, T_REVEAL + 0.9);
  const day = t >= T.day ? 1 : 0;
  U.DAYA.value = seg(t, T.day, T.day + 1.5);
  U.GLINT.value = seg(t, T.mainBeam - 0.05, T.mainBeam + 0.25) * (1 - 0.6 * seg(t, T.mainBeam + 0.5, T.c5tv));
  SKY.a.value = seg(t, T.ign, T.ign + 1.2);
  SKY.time.value = t;
  curtain.position.set(scanDir.x * U.S.value, 300, scanDir.y * U.S.value); curtain.rotation.y = Math.atan2(scanDir.x, scanDir.y);
  const p = poseAt(t); applyPose(dish, p); applyPose(gearG, { phi: p.phi, el: p.el }); azG.rotation.y = p.phi;
  // motion echoes (tip and gusts)
  const moving = seg(t, T.tip0, T.tip0 + 0.4) * (1 - seg(t, T.tip1 + 0.1, T.tip1 + 0.9)) + clamp(gustEnv(t) * 1.6);
  GHOSTS.forEach((gh, i) => {
    const lag = 0.11 * (i + 1); const pp = poseAt(t - lag); applyPose(gh, pp);
    const sep = Math.abs(pp.el - p.el) / 3 + Math.abs(pp.phi - p.phi) / D2R / 2;
    gh.material.uniforms.gA.value = clamp(moving) * 0.24 * Math.pow(0.72, i) * clamp(sep);
    gh.visible = gh.material.uniforms.gA.value > 0.002;
  });
  dish.updateMatrixWorld(true); FOCUS_W.set(0, V0 + F + 3.4, 0).applyMatrix4(dish.matrixWorld);
  // radial pings: a small one when the dish settles at the limit, the big one at the end
  const pings = [[T.tip1, 1.1, 0.9, 1600], [T.ping, 3.4, 1.9, 3000]];
  U.PR_.value = 0; U.PA.value = 0;
  for (const [tp, amp, tau, R] of pings) { const k = t - tp; if (k > 0 && k < 6) { U.PR_.value = R * (1 - Math.exp(-k / tau)); U.PA.value = Math.exp(-k / (tau * 1.2)) * amp * seg(k, 0, 0.05); } }
  // scans in the three new spaces
  MOON.u.S.value = -30 + 55 * eo(seg(t, T.c4 - 0.25, T.c4 + 1.6)) + 30 * seg(t, T.c4 + 1.6, T.cG); MOON.u.BI.value = 1 - seg(t, T.c4 + 1.4, T.c4 + 2.0);
  GLOBE.u.S.value = -520 + 680 * eo(seg(t, T.cG - 0.25, T.cG + 0.7)); GLOBE.u.BI.value = 1 - seg(t, T.cG + 1.0, T.cG + 1.6);
  ROOM.u.S.value = -8 + 16 * eo(seg(t, T.c5, T.c5 + 1.1)); ROOM.u.BI.value = 1 - seg(t, T.c5 + 0.9, T.c5 + 1.4);
  ROOM.win.material.uniforms.time.value = t;
  // wind streaks
  WIND.A.value = U.DAYA.value * (0.45 + 0.55 * storm(t) + 0.8 * gustEnv(t));
  const ws = windSpeed(t);
  WIND.vdir.value.copy(WINDDIR).multiplyScalar(ws).add(V3(0, -9, 0)).normalize();
  WIND.len.value = 1.2 + ws * 0.09;
  WIND.off.value.copy(WINDDIR).multiplyScalar(windInt(t)).add(V3(0, -9 * t, 0));
}
function renderView(V, shot, t) {
  const spec = camSpec(shot, t);
  setCam(V.camera, spec, t);
  U.camPos.value.copy(V.camera.position);
  skyMesh.position.copy(V.camera.position); starPts.position.copy(V.camera.position);
  WIND.center.value.copy(V.camera.position);
  // sky masks: night only exists in the opening view, revealed behind the night scan and erased by the day scan
  if (shot === 'S1') {
    CAM = V.camera;
    const q = V3(scanDir.x * U.S.value + scanDir.y * 1800, 0, scanDir.y * U.S.value - scanDir.x * 1800);
    const q2 = V3(scanDir.x * U.S.value - scanDir.y * 1800, 0, scanDir.y * U.S.value + scanDir.x * 1800);
    const nightS_ = nightS(t);
    const qa = V3(scanDir.x * nightS_ + scanDir.y * 1800, 0, scanDir.y * nightS_ - scanDir.x * 1800), qb = V3(scanDir.x * nightS_ - scanDir.y * 1800, 0, scanDir.y * nightS_ + scanDir.x * 1800);
    const c = [qa, qb].map(v => v.clone().project(V.camera)).filter(p => p.z < 1).sort((a, b) => b.y - a.y);
    const nx = c.length ? c[0].x : -2;
    SKY.x.value = t < T.ign ? -2 : Math.max(nx + 0.15, -1.6) + seg(t, 5.0, 7.5) * 2.2;
    SKY.dx.value = t < T.day ? -3 : (dayBeamX(t) / W) * 2 - 1;
  } else { SKY.x.value = 3; SKY.dx.value = 3; }
  V.grade.uniforms.fade.value = shot === 'S3c' ? 0.32 : shot === 'R' ? 1.3 : 1;
  for (const X of [MOON, GLOBE, ROOM]) X.u.camP.value.copy(V.camera.position);
  V.pass.scene = sceneOf(shot);
  V.composer.render();
}

// ================= events for the mixer =================
{
  for (let t = T.sweep0; t < 6; t += 0.005) if (nightS(t) >= S_DISH) { T_REVEAL = +t.toFixed(3); break; }
  const EV = [{ t: T.ign, type: 'ignite' }];
  for (let k = 0; k < T.sweepBeats; k++) EV.push({ t: T.sweep0 + k * BEAT, type: 'ping', k, pan: +(-0.75 + 1.35 * k / (T.sweepBeats - 1)).toFixed(2) });
  EV.push({ t: T_REVEAL, type: 'reveal', pan: -0.35 });
  EV.push({ t: 4.6, type: 'sky' });
  EV.push({ t: T.day, type: 'dayscan' });
  EV.push({ t: T.c2, type: 'wipe' }, { t: T.c4, type: 'wipe' });
  EV.push({ t: T.tip0, type: 'motor', d: T.tip1 - T.tip0 });
  EV.push({ t: T.tip1, type: 'lock', pan: 0.2 });
  EV.push({ t: T.c3a + 0.2, type: 'sweep' }, { t: T.c4 + 0.4, type: 'sweep' });
  EV.push({ t: T.g1, type: 'gust', k: 1 }, { t: T.g2, type: 'gust', k: 2 });
  EV.push({ t: T.c3b, type: 'alarm', d: T.c3c - T.c3b });
  EV.push({ t: T.c3c, type: 'panel' });
  EV.push({ t: T.tvOn, type: 'tvon' });
  EV.push({ t: T.track, type: 'track' });
  EV.push({ t: T.mainBeam, type: 'mainbeam' });
  EV.push({ t: T.roomMove, type: 'whip' }, { t: T.c4, type: 'moon' }, { t: T.cG, type: 'globe' }, { t: T.c5, type: 'room' });
  EV.push({ t: T.c5tv, type: 'tvcut' });
  EV.push({ t: T.sw, type: 'switch' });
  EV.push({ t: T.collapse, type: 'collapse' });
  EV.push({ t: T.ping, type: 'finalping' });
  EV.push({ t: T.c5, type: 'cut' }, { t: T.c3a, type: 'cut' }, { t: T.c3b, type: 'cut' });
  for (const v of VO) EV.push({ t: v.t, type: 'vo', id: v.id, en: v.en, zh: v.zh });
  window.EV = EV.filter(e => e.t >= CUT0 && e.t < CUT1).map(e => ({ ...e, t: +(e.t - CUT0).toFixed(3) }));
}

// ================= render =================
function renderFilm(t) {
  const shot = shotAt(t).id;
  setWorld(t);
  if (shot === 'S6' && !S6_START) {
    // the beam starts where the TV's line was: the ground under the frame centre in the S6 opening view
    const spec = camSpec('S6', T.c6); setCam(VA.camera, spec, T.c6);
    S6_START = sAt(rayGroundC(VA.camera, W / 2, 940)); setWorld(t);
  }
  const wipe = WIPES.find(w => t >= w.t - w.d / 2 && t < w.t + w.d / 2);
  if (shot === 'TV') { VA.r.clear(); stage2.style.display = 'none'; }
  else if (wipe) {
    const before = shotAt(wipe.t - 0.001).id, after = shotAt(wipe.t + 0.001).id;
    renderView(VB, before, t);
    renderView(VA, after, t); CAM = VA.camera;
    // the outgoing view sits on top and is wiped away left → right by a bright scan edge
    const x = eio(seg(t, wipe.t - wipe.d / 2, wipe.t + wipe.d / 2)) * W;
    stage2.style.display = 'block'; stage2.style.clipPath = `inset(0 0 0 ${x.toFixed(1)}px)`;
    WIPE_X = x;
  } else {
    renderView(VA, shot, t); CAM = VA.camera; stage2.style.display = 'none'; WIPE_X = -1;
  }
  if (shot === 'R' || shot === 'TV') {
    // remember where the monitor's screen sits on screen at the cut (match cut into the TV)
    const spec = ROOM.camAt(T.c5tv - 0.001, T.c5, T.roomMove, T.c5tv); const cam = new THREE.PerspectiveCamera(spec.fov, W / H, 0.05, 1000); setCam(cam, spec, 0);
    ROOM.monG.updateMatrixWorld(true);
    const pts = ROOM.screenCorners.map(c => { const q = c.clone().applyMatrix4(ROOM.monG.matrixWorld).project(cam); return [(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]; });
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    TV_RECT = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  drawOverlay(t, shot);
  if (WIPE_X >= 0) { g2.fillStyle = 'rgba(225,238,255,0.85)'; g2.fillRect(WIPE_X - 0.6, 0, 1.4, H); const gr = g2.createLinearGradient(WIPE_X - 60, 0, WIPE_X, 0); gr.addColorStop(0, 'rgba(180,215,255,0)'); gr.addColorStop(1, 'rgba(200,225,255,0.12)'); g2.fillStyle = gr; g2.fillRect(WIPE_X - 60, 0, 60, H); }
}
let WIPE_X = -1;
window.render = t => renderFilm(t + CUT0);
window.TEXTS = () => TEXTS_NOW.map(o => ({ ...o }));

try { VODUR = await (await fetch('vo/wav/dur.json')).json(); } catch (e) { VODUR = {}; }
await Promise.all([
  document.fonts.load(`200 64px "Plex"`, 'Catching'), document.fonts.load(`300 23px "Plex"`, 'For'), document.fonts.load(`300 14px "JBM"`, '0123'),
  document.fonts.load(`300 34px "NotoSC"`, '狂风里接住登月直播'),
]).catch(() => {});
window.render(0);
window.READY = true;
