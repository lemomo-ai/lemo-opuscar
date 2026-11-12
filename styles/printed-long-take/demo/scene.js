// Thirty-Three Cranes — Scratchboard Long Take. A three-dimensional winter valley rendered as a scratchboard print:
// one unbroken camera move from the steaming river to the air, then the feeding field and the board that keeps the count.
import * as THREE from 'three';
import { mulberry, clamp, lerp, ss, eio, seg, track, hash } from '/core/lib.js';
import { C, U, skyMat, GLSL_HASH } from './look.js';
import { buildWorld, WY, BRIDGE, RIVER } from './world.js';
import { POSE, craneAtlas, frostTreeAtlas, mistAtlas, sunCanvas } from './textures.js';
import { T, VO } from './timeline.js';
import { skyTypeCanvas, boardCanvas, boardPieces, PLATE_LINES, BOARD } from './props.js';
import { canvasTex } from './world.js';

const Q = new URLSearchParams(location.search);
const W_ = 1920, H_ = 1080, SS = 2;
window.DUR = T.DUR;

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W_, H_, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const rtA = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });
const rtB = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });

const scene = new THREE.Scene(); scene.background = C.ink;
const camera = new THREE.PerspectiveCamera(34, W_ / H_, .3, 9000);
const projScale = () => H_ * SS / (2 * Math.tan(camera.fov * Math.PI / 360));

// atlas preview (?atlas=crane|tree|mist|sun)
if (Q.get('atlas')) {
  const c = { crane: craneAtlas, tree: frostTreeAtlas, mist: mistAtlas, sun: sunCanvas }[Q.get('atlas')]();
  document.body.innerHTML = ''; document.body.style.background = '#8a8a80';
  c.style.cssText = 'width:100vw;height:100vh;object-fit:contain;display:block'; document.body.appendChild(c);
  window.render = () => {}; window.READY = true;
  await new Promise(() => {});
}

// the camera's path through the valley, keyed (time, [eye, target])
const CAM_A_KEYS = [
  [0, [-18, 44, 222, -6, 30, -280]],
  [2.6, [-12, 25, 160, -3, 14, -230]],
  [5.2, [-3, 6.5, 62, 4, 2.6, -40]],
  [6.6, [4.2, 1.4, 12, 11, 1.6, -27]],
  [7.3, [8.2, 1.1, -12, 12.6, 1.9, -27.3]],
  [7.7, [9.4, 1.1, -17.6, 12.7, 2.4, -27.3]],
  [9.9, [9.8, 1.1, -18.8, 12.7, 2.4, -27.3]],
  [10.6, [6.6, .8, -31, 12, .9, -52]],
  [11.6, [19, .55, -64, 120, 6, -110]],
  [12.4, [34, .4, -87, 180, 3.2, -118]],
  [13.6, [34.7, .4, -87.3, 180, 3.6, -119]],
  [15.0, [35.8, .4, -87.8, 180, 10, -121]],
  [16.2, [36.8, .4, -88.2, 180, 11.4, -122]],
  [17.0, [37.4, .7, -88.4, 180, 11.4, -122]],
  [17.8, [38.6, 2.2, -88.2, 180, 11.4, -122]],
  [18.4, [38.4, 5.5, -89.5, 180, 11.4, -122]],
  [18.95, [36.5, 9.5, -92, 180, 11.4, -122]],
];
const PATH_CLEAR = (() => { const f = track(CAM_A_KEYS), o = []; for (let t = 2; t < 19; t += .1) { const c = f(t); if (c[1] < 40) o.push([c[0], c[2], t > 9.9 && t < 13 ? 15 : c[1] > 12 ? 12 : 9]); } return o; })();
// the type must be loaded before any plate or board is drawn
const fontFace = await new FontFace('NotoSerifSC', 'url(./fonts/NotoSerifSC-700.woff2)', { weight: '700' }).load();
document.fonts.add(fontFace);
const W = buildWorld(scene, projScale(), PATH_CLEAR);

// ---------------------------------------------------------------- the print pass
const printMat = new THREE.ShaderMaterial({
  uniforms: {
    tA: { value: rtA.texture }, tB: { value: rtB.texture }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(W_, H_) },
    uPeel: { value: -1 }, uWhite: { value: 0 }, uFresh: { value: 0 }, tSub: { value: null }, uPaper: U.uPaper, uInk: U.uInk,
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: GLSL_HASH + `
    uniform sampler2D tA, tB, tSub; uniform float uT, uPeel, uWhite, uFresh; uniform vec2 uRes; uniform vec3 uPaper, uInk; varying vec2 vUv;
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
    vec3 freshInk(vec3 c, vec2 uv, float amt){
      // a print just pulled: the ink hasn't covered everywhere yet
      float dark = 1. - smoothstep(.2, .5, dot(c, vec3(.33)));
      float m = smoothstep(.6, .72, fbm(uv*vec2(260.,150.)+7.)) * amt;
      float sp = step(.82, h21(floor(uv*vec2(900.,500.))));
      return mix(c, uPaper*.9, dark*max(m*.8, sp*amt*.5));
    }
    void main(){
      vec2 uv = vUv;
      vec3 c = texture2D(tA, uv).rgb;
      if (uPeel >= 0.) {
        // the top sheet is peeled from the top-right corner; the fresh print lies under it
        vec2 asp = vec2(uRes.x/uRes.y, 1.);
        vec2 p = uv*asp, corner = asp, D = normalize(-asp);
        float diag = length(asp), s = uPeel*(diag+.15);
        float d = dot(p - corner, D);
        vec3 under = freshInk(texture2D(tB, uv).rgb, uv, uFresh);
        if (d < s) {
          c = under * (1. - .4*smoothstep(.1, 0., s - d));                       // shadow along the fold
        } else if (d < 2.*s) {
          vec2 pm = p - 2.*(d - s)*D;                                           // where this bit of the flap came from
          vec2 um = pm/asp;
          if (um.x <= 1. && um.y <= 1. && um.x >= 0. && um.y >= 0.) {
            float k = (d - s)/max(s, 1e-3);
            vec3 ghost = texture2D(tA, vec2(1.-um.x, um.y)).rgb;              // show-through, mirrored
            vec3 back = mix(uPaper, ghost, .13) * (.8 + .26*smoothstep(0., .5, k) - .1*smoothstep(.5, 1., k));
            back *= 1. + (fbm(um*vec2(500.,300.))-.5)*.05;
            c = back;
            // the flap's edge, a hard ink line
            float e = min(min(um.x, um.y), min(1.-um.x, 1.-um.y));
            c = mix(uInk, c, smoothstep(.0, .0025, e));
          } else {
            c *= 1. - .3*smoothstep(.05, 0., d - 2.*s + .02);                 // cast shadow of the flap
          }
        }
      } else if (uFresh > 0.) {
        c = freshInk(c, uv, uFresh);
      }
      float lum = dot(c, vec3(.299,.587,.114));
      float dark = 1. - smoothstep(.18, .55, lum);
      float tf = floor(uT*12.)/12.;
      float fib = fbm(uv*vec2(700.,420.));
      c *= 1. + (fib-.5)*.06*(1.-dark);
      float mot = fbm(uv*vec2(46.,26.) + 3.);
      c += dark*(mot-.5)*.05;
      float b = fbm(vec2(uv.x*4.2 + tf*.06, uv.y*2.2 - tf*.02) + 11.);
      b = smoothstep(.5, .78, b) * smoothstep(.62, 1., uv.y);
      c += dark*b*.09;
      // steam whiteout: the picture is eaten by horizontal paper cuts
      if (uWhite > 0.) {
        float row = floor(uv.y*120.), f = abs(fract(uv.y*120.)-.5);
        float r = h11(row*1.7), run = vn(vec2(uv.x*3. + r*20., row*.37));
        float w = smoothstep(.0, .25, uWhite*1.8 - r*.5 - run*.5 + (.5-f)*.3);
        c = mix(c, uPaper*(1. + (fib-.5)*.05), clamp(w, 0., 1.));
      }
      c *= 1. + (h11(tf*13.7)-.5)*.03;
      vec2 q = uv-.5; c *= 1. - dot(q,q)*.1;
      vec4 sb = texture2D(tSub, uv); c = mix(c, sb.rgb, sb.a);
      gl_FragColor = vec4(c, 1.);
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), printMat));

// ================================================================ cranes in the river
const RA = (() => {
  const R = mulberry(515), L = [];
  const put = (x, z, extra = {}) => L.push({ x, z, flip: R() < .5, s: 1.42 + R() * .16, sleep: R() < .5 ? POSE.SLEEP : POSE.SLEEP2, ...extra });
  // downstream of the bridge, in the narrow river
  for (let i = 0; i < 22; i++) {
    const u = .0, z = 26 + i * 6 + (R() - .5) * 5;
    const x = Math.sin(z * .021) * 3 + (R() - .5) * 9 - 2;
    put(x, z);
  }
  // the shallow pool east of the bend: the flock that wakes at dawn
  for (let i = 0; i < 34; i++) {
    const x = 60 + Math.pow(R(), 1.25) * 150, zc = -98 - (x - 50) * .1 - Math.max(0, x - 180) * .05;
    const hw = x < 80 ? 9 : 17;
    put(x, zc + (R() - .5) * hw * 1.5);
  }
  // a closer group in the middle distance
  for (let i = 0; i < 10; i++) put(62 + R() * 26, -101 - R() * 8 + (R() - .5) * 4);
  // a few asleep right in front of the camera, so the line about sleeping cranes has its birds
  for (const [x, z] of [[40.6, -89.4], [42.4, -91.6], [44.6, -88.6], [46.8, -92.4], [43.8, -94.6], [49.6, -90.2]]) put(x, z, { near: true, s: 1.55 });
  // the nearest pair, close to the camera, who will call
  put(53, -96.5, { pair: 1, flip: false, s: 1.55 }); put(56.6, -98.6, { pair: 2, flip: false, s: 1.5 });
  // two or three were awake all night
  L[20].awake = L[26].awake = L[9].awake = true;
  // wake order: north to south as seen from the camera facing east = left to right on screen
  const sorted = L.map((b, i) => [b.z, i]).sort((a, b) => a[0] - b[0]);
  sorted.forEach(([, i], k) => { L[i].wake = lerp(T.wake[0], T.wake[1] - .5, k / (sorted.length - 1)) + (R() - .5) * .35; });
  L.forEach(b => { if (b.pair) b.wake = T.wake[0] + .35 + b.pair * .15; b.rank = R(); });
  return L;
})();

function riverCranes(t) {
  const out = [];
  for (const b of RA) {
    const woke = b.awake || t > b.wake;
    let pose = b.sleep, crown = 0;
    if (woke) {
      const dt = b.awake ? 9 : t - b.wake;
      pose = dt < .22 ? POSE.HALF : (hash(b.rank * 99 + Math.floor((t + b.rank * 5) / 1.7)) < .3 ? POSE.ALERT2 : POSE.ALERT);
      crown = clamp(dt / .16);
      if (b.pair && t > T.pairCall && t < T.pairCall + 1.9) pose = b.pair === 1 ? POSE.CALLW : POSE.CALL;
    }
    if (t >= T.takeoff) continue;   // handled by the takeoff
    out.push({ x: b.x, y: WY - .22, z: b.z, s: b.s, flip: b.flip, pose, crown });
  }
  return out;
}

// ================================================================ the aerial flock (after the steam)
const FB = (() => {
  const R = mulberry(611), L = [];
  for (let i = 0; i < 40; i++) {
    const k = i / 39;
    L.push({ back: k * 42 + (R() - .5) * 6, side: (k - .5) * 30 + (R() - .5) * 10 + Math.sin(i * 1.3) * 4, up: (R() - .5) * 8, ph: R(), s: 2.2 + R() * .15 });
  }
  return L;
})();
const B0 = new THREE.Vector3(90, 140, 560), FIELD = new THREE.Vector3(-99, 0, -186);
const BDIR = FIELD.clone().sub(B0).setY(0).normalize();
const leaderB = t => B0.clone().addScaledVector(BDIR, (t - T.cutB) * 17).add(new THREE.Vector3(0, -(t - T.cutB) * 2.5, 0));
const wingPose = (ph) => { const k = Math.floor(((ph % 1) + 1) % 1 * 4); return [POSE.FLY_UP, POSE.FLY_MID, POSE.FLY_DOWN, POSE.FLY_MID][k]; };

function flockB(t) {
  const L = leaderB(t), side = new THREE.Vector3(-BDIR.z, 0, BDIR.x);
  return FB.map((b, i) => {
    const p = L.clone().addScaledVector(BDIR, -b.back).addScaledVector(side, b.side).add(new THREE.Vector3(0, b.up + Math.sin(t * 1.3 + i) * .6, 0));
    return { x: p.x, y: p.y, z: p.z, s: b.s, pose: wingPose(t * 1.7 + b.ph), crown: 1, dir: BDIR };
  });
}
// rotate a flying sprite so it points along its heading on screen
function screenRot(list) {
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (const c of list) {
    a.set(c.x, c.y, c.z).project(camera); b.set(c.x + c.dir.x, c.y + c.dir.y, c.z + c.dir.z).project(camera);
    const dx = (b.x - a.x) * W_, dy = (b.y - a.y) * H_;
    let r = Math.atan2(dy, dx);
    c.flip = false;
    c.rot = r;
  }
  return list;
}


// ================================================================ the feeding field
const FR = { x0: -144.5, x1: -53.5, z0: -218.5, z1: -153.5 };   // inside the fence, a metre clear of it
const DANCERS = [[-110.0, -156.6], [-108.2, -157.3]];
const FC = (() => {
  const R = mulberry(733), L = [];
  let tries = 0;
  while (L.length < 320 && tries++ < 20000) {
    const a = R() * Math.PI * 2, rr = Math.pow(R(), .75);
    const x = -99 + Math.cos(a) * rr * 40 + (R() - .5) * 4, z = -184 + Math.sin(a) * rr * 25;
    if (x < FR.x0 || x > FR.x1 || z < FR.z0 || z > FR.z1) continue;
    if (L.some(b => (b.x - x) ** 2 + (b.z - z) ** 2 < 1.5 * 1.5)) continue;          // no two birds in one place
    if (DANCERS.some(([dx, dz]) => (dx - x) ** 2 + (dz - z) ** 2 < 3.5 * 3.5)) continue;
    L.push({ x, z, flip: R() < .5, s: 1.4 + R() * .18, r: R() });
  }
  L.sort((p, q) => Math.hypot(p.x + 99, (p.z + 186) * 1.5) - Math.hypot(q.x + 99, (q.z + 186) * 1.5));
  return L;
})();
const ERA_N = [33, 90, 170, 320];
function fieldPose(i, t, r) {
  const k = Math.floor((t + r * 7) / (1.1 + r)), h = hash(i * 7.1 + k * 3.3);
  return h < .45 ? POSE.PECK : h < .7 ? POSE.WALK : h < .88 ? POSE.ALERT : POSE.ALERT2;
}
function fieldCranes(t, n, clearOf) {
  const out = [];
  for (let i = 0; i < Math.min(n, FC.length); i++) { const b = FC[i]; if (clearOf && Math.hypot(b.x - clearOf[0], b.z - clearOf[2]) < 9) continue; out.push({ x: b.x, y: 0, z: b.z, s: b.s, flip: b.flip, pose: fieldPose(i, t, b.r), crown: 1 }); }
  return out;
}
function setEra(era, t = 0) {
  W.fence.position.y = [-1.05, -.6, -.25, 0][era];
  W.corn.material.uniforms.uSpread.value = era === 0 ? lerp(.06, .32, ss(seg(t, T.corn[0], T.corn[1]))) : [.3, .5, .78, 1][era];
  W.tracks.material.uniforms.uTrack.value = [.1, .4, .75, 1][era];
  W.hut2.visible = era >= 2;
  W.hut1.position.y = [-.5, -.25, 0, 0][era];
  W.sign.visible = era === 3;
}

// ================================================================ landing (24 – 28.4): the bird we follow, and others coming in
const LAND = (() => {
  const R = mulberry(244), L = [];
  // the bird we follow: a long glide, then the flare
  L.push({ t0: 23.2, dur: 3.6, from: [-78, 26, -116], to: [-103, 0, -158.5], s: 1.55, lead: true });
  for (let i = 0; i < 26; i++) {
    const b = FC[120 + i * 3];
    const ang = -.6 + R() * 1.2, dist = 40 + R() * 40;
    L.push({ t0: 23.6 + R() * 3.8, dur: 2.4 + R() * 1.2, from: [b.x + Math.sin(ang) * dist, 16 + R() * 14, b.z + Math.cos(ang) * dist * .6 + 20], to: [b.x, 0, b.z], s: b.s, flip: R() < .5 });
  }
  return L;
})();
const leadAt = t => { const b = LAND[0], u = clamp((t - b.t0) / b.dur), e = 1 - Math.pow(1 - u, 2.2); return b.from.map((v, i) => lerp(v, b.to[i], i === 1 ? 1 - Math.pow(1 - u, 1.4) : e)); };
function landing(t) {
  const out = fieldCranes(t, 120 + Math.floor(clamp((t - 24) / 4) * 60));
  for (const b of LAND) {
    const u = (t - b.t0) / b.dur;
    if (u < 0) continue;
    if (u >= 1) { out.push({ x: b.to[0], y: 0, z: b.to[2], s: b.s, flip: b.flip, pose: u < 1.25 ? POSE.ALERT : POSE.WALK, crown: 1 }); continue; }
    const p = b.lead ? leadAt(t) : b.from.map((v, i) => lerp(v, b.to[i], i === 1 ? 1 - Math.pow(1 - u, 1.5) : 1 - Math.pow(1 - u, 2.2)));
    out.push({ x: p[0], y: p[1], z: p[2], s: b.s, flip: b.lead ? true : b.flip, pose: u > .85 ? POSE.ALERT : POSE.LAND, crown: 1 });
  }
  return out;
}
// the dancing pair: a leap with the wings thrown open, answered by a bow
function dancers(t) {
  const out = [];
  DANCERS.forEach(([x, z], i) => {
    const ph = ((t - T.dance[0]) / .95 + i * .5) % 1, up = ph < .5;
    const leap = up && i === 0 ? Math.sin(ph * 2 * Math.PI) * .7 : up && i === 1 ? Math.sin(ph * 2 * Math.PI) * .45 : 0;
    const pose = t < T.dance[0] + .2 ? POSE.ALERT : (up ? POSE.DANCE : (i === 0 ? POSE.BOW : POSE.ALERT));
    out.push({ x, y: Math.max(0, leap), z, s: 1.55, flip: i === 1, pose, crown: 1 });
  });
  return out;
}

// ================================================================ takeoff (17 – 19.75): run across the water, lift, pass over the camera
const HEADING = new THREE.Vector3(-1, 0, .06).normalize();
const takeOrder = (() => RA.map((b, i) => [b.pair ? -1 : b.near ? 999 : Math.hypot(b.x - 36, b.z + 88) + (b.x > 120 ? 30 : 0), i]).sort((a, b) => a[0] - b[0]))();
function takeoffPath(b, k, t) {
  const t0 = T.takeoff + k * .05, dt = t - t0;
  if (dt < 0) return null;
  const run = Math.min(dt, .75), d = 4.2 * run * run + Math.max(0, dt - .75) * 11;
  const climb = Math.max(0, dt - .6);
  // birds that start close to the camera turn north, away from the lens, and climb sooner
  const near = clamp((22 - Math.hypot(b.x - 36.8, b.z + 88.2)) / 12);
  const hx = lerp(HEADING.x, -.35, near), hz = lerp(HEADING.z, -.94, near);
  return { dt, x: b.x + hx * d, z: b.z + hz * d + Math.sin(dt * .9 + b.rank * 6) * climb * 1.5, y: WY - .12 + climb * climb * (1.9 + near * 2) + climb * 2.6, hx, hz };
}
function takeoff(t) {
  const stand = [], fly = [];
  takeOrder.forEach(([, i], k) => {
    const b = RA[i], p = takeoffPath(b, k, t);
    if (b.z > 0) return;                                  // the downstream birds lift off out of shot
    if (!p) { stand.push({ x: b.x, y: WY - .12, z: b.z, s: b.s, flip: true, pose: POSE.ALERT, crown: 1 }); return; }
    if (p.dt < .62) stand.push({ x: p.x, y: WY - .12 + Math.abs(Math.sin(p.dt * 22)) * .08, z: p.z, s: b.s, flip: true, pose: POSE.RUN, crown: 1 });
    else fly.push({ x: p.x, y: p.y + .9, z: p.z, s: 2.25, pose: wingPose((p.dt - .62) * 2.3 + b.rank), crown: 1, dir: new THREE.Vector3(p.hx, .2, p.hz) });
  });
  return { stand, fly };
}
// splashes: paper stabs thrown up by the running feet
const splashGeo = new THREE.BufferGeometry();
const SPL = 1600;
splashGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPL * 3), 3));
splashGeo.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(SPL), 1));
const splashes = new THREE.Points(splashGeo, new THREE.ShaderMaterial({
  uniforms: { uProj: { value: projScale() }, uPaper: U.uPaper },
  vertexShader: `attribute float aS; uniform float uProj; void main(){ vec4 mv = viewMatrix*vec4(position,1.); gl_PointSize = aS > 0. ? max(aS*uProj/-mv.z, 2.) : 0.; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uPaper; void main(){ vec2 q = abs(gl_PointCoord-.5); if (max(q.x, q.y*1.6) > .5) discard; gl_FragColor = vec4(uPaper,1.); }`,
}));
splashes.frustumCulled = false; scene.add(splashes);
function placeSplashes(t) {
  const P = splashGeo.attributes.position.array, S = splashGeo.attributes.aS.array; S.fill(0);
  let n = 0;
  if (t >= T.takeoff - .1 && t < T.cutB) takeOrder.forEach(([, i], k) => {
    const b = RA[i]; if (b.z > 0) return;
    for (let j = 0; j < 9 && n < SPL - 4; j++) {
      const ts = T.takeoff + k * .05 + j * .07, age = t - ts; if (age < 0 || age > .55) continue;
      const p = takeoffPath(b, k, ts); if (!p || p.dt > .62) continue;
      for (let m = 0; m < 4; m++) {
        const r1 = hash(i * 31 + j * 7 + m), r2 = hash(i * 17 + j * 3 + m * 5), r3 = hash(i + j * 13 + m * 11);
        P.set([p.x + (r1 - .5) * .6 + HEADING.x * -age * 1.5, WY + (1.5 + r2 * 2.2) * age - 4.9 * age * age, p.z + (r3 - .5) * .8], n * 3);
        S[n] = WY + (1.5 + r2 * 2.2) * age - 4.9 * age * age > WY ? .05 + r3 * .07 : 0; n++;
      }
    }
  });
  splashGeo.attributes.position.needsUpdate = splashGeo.attributes.aS.needsUpdate = true;
}

// ================================================================ the camera
const camA = track(CAM_A_KEYS);
// during the takeoff the camera keeps its eye on the leading birds as they come at it and pass overhead
function flockEye(t) {
  const pts = takeOrder.slice(0, 8).map(([, i], k) => takeoffPath(RA[i], k, t)).filter(Boolean);
  if (!pts.length) return null;
  const m = pts.reduce((a, p) => [a[0] + p.x, a[1] + p.y, a[2] + p.z], [0, 0, 0]).map(v => v / pts.length);
  return m;
}
function camAt(t) {
  const c = camA(t);
  if (t < T.takeoff) return c;
  const e = flockEye(t); if (!e) return c;
  const k = ss(seg(t, T.takeoff + .15, T.takeoff + .9));
  // aim a little ahead of the leaders, and never straight up
  const tx = lerp(c[3], e[0] - 6, k), ty = lerp(c[4], Math.min(e[1] + 2, c[1] + 14), k), tz = lerp(c[5], e[2] - 4, k);
  return [c[0], c[1], c[2], tx, ty, tz];
}
const fovA = t => t < 8.5 ? lerp(34, 22, ss(seg(t, 6.0, 7.6))) : t < 13 ? lerp(22, 28, ss(seg(t, 9.9, 11.8))) : lerp(28, 40, ss(seg(t, 16.4, 18.0)));
function camB(t) {
  const L = leaderB(t), side = new THREE.Vector3(-BDIR.z, 0, BDIR.x);
  const p = L.clone().addScaledVector(BDIR, -70).addScaledVector(side, 10).add(new THREE.Vector3(0, 14, 0));
  const l = L.clone().addScaledVector(BDIR, 220).addScaledVector(side, -30).add(new THREE.Vector3(0, -66 - ss(seg(t, T.tilt[0], T.tilt[1])) * 95, 0));
  return [p.x, p.y, p.z, l.x, l.y, l.z];
}
// following the bird down, then along the fence to the face of the board
const camCtail = track([
  [26.8, [-99.3, 3.8, -147.5, -106.5, .6, -170]],
  [27.6, [-104.6, 2.1, -145.2, -109.5, 1.1, -166]],
  [28.6, [-110.65, 1.62, -145.75, -112.75, 1.36, -153]],
]);
function camC(t) {
  if (t < T.landed) {
    const p = leadAt(t), u = seg(t, 24, T.landed);
    const off = [lerp(4.5, 3.2, u), lerp(1.4, 2.4, u), lerp(8, 9.5, u)];
    return [p[0] + off[0], p[1] + off[1], p[2] + off[2], p[0] - 1.8 - u * 2, p[1] - .4 - u * 1.4, p[2] - 6 - u * 10];
  }
  // hand over from following the bird to the tail move without a jolt
  const tail = camCtail(t);
  if (t < 27.2) { const f = camC(T.landed - 1e-3), k = ss(seg(t, T.landed, 27.2)); return f.map((v, i) => lerp(v, tail[i], k)); }
  return tail;
}
const camSign = t => [-110.65 - (t - 28.6) * .03, 1.62, -145.75 + (t - 28.6) * .02, -112.75, 1.36, -153];
const camPrint = [-99, 7.2, -159, -99, 1.0, -186];
const camVerdict = t => [-111.8 + (t - T.verdict[0]) * .01, 1.62, -145.5, -112.45, 1.32, -151];
const camEnd = track([
  [T.dance[0], camVerdict(T.dance[0])],
  [51.68, [-111.2, 1.7, -145.6, -107.2, 1.3, -157]],
  [52.4, [-109.6, 2.3, -146.6, -109.1, 1.2, -157]],
  [53.6, [-108.6, 3.6, -143.5, -105, 1.6, -168]],
  [56.4, [-92, 24, -86, -76, 60, -600]],
  [59.6, [-92.3, 24, -86.6, -76.3, 60, -601]],
]);
function shotAt(t) {
  if (t < T.cutB) return { k: 'A', c: camAt(t), fov: fovA(t) };
  if (t < T.cutC) return { k: 'B', c: camB(t), fov: 38 };
  if (t < T.sign1[0]) return { k: 'C', c: camC(t), fov: 36 };
  if (t < T.prints[0]) return { k: 'S', c: camSign(t), fov: 34 };
  if (t < T.prints[1]) return { k: 'P', c: camPrint, fov: 36 };
  if (t < T.dance[0]) return { k: 'V', c: camVerdict(t), fov: 34 };
  return { k: 'E', c: camEnd(t), fov: lerp(34, 38, ss(seg(t, 53.6, 56.4))) };
}

// ================================================================ light, sky, sun, moon, type in the sky
const sunDir = el => new THREE.Vector3(Math.cos(el) * .99, Math.sin(el), -Math.cos(el) * .21).normalize();
const DEG = Math.PI / 180;
const TITLE = skyTypeCanvas([
  { id: 'title-cn', text: '三十三只', px: 300, y: 300 },
  { id: 'title-en', text: 'Thirty-Three Cranes', px: 118, y: 480, x: 48 },
], 2400, 560);
const ENDC = skyTypeCanvas([
  { id: 'end-cn', text: '三十三只', px: 150, y: 170 },
  { id: 'end-en', text: 'Thirty-Three Cranes', px: 92, y: 300, x: 44 },
  { id: 'end-sign', text: 'LemoLab × Claude Opus 5.5', px: 112, y: 470, x: 44 },
], 2000, 540);
skyMat.uniforms.tType1.value = canvasTex(TITLE.c); skyMat.uniforms.uRect1.value.set(2 * DEG, 7.6 * DEG, 26 * DEG, (7.6 + 24 * 560 / 2400) * DEG);
skyMat.uniforms.tType2.value = canvasTex(ENDC.c); skyMat.uniforms.uRect2.value.set(2 * DEG, 11.4 * DEG, 29 * DEG, (11.4 + 27 * 540 / 2000) * DEG);
function setSky(t, shot) {
  const night = shot === 'A' ? 1 - ss(seg(t, T.dawn[0], T.dawn[0] + 3.5)) : 0;
  skyMat.uniforms.uFront.value = shot === 'A' ? lerp(-.02, .6, seg(t, T.dawn[0] + .2, T.takeoff + 2.6)) : 1.7;
  skyMat.uniforms.uStars.value = night;
  skyMat.uniforms.uDense.value = shot === 'A' ? ss(seg(t, 12.6, 17.0)) * .8 : 1;
  const [a0, a1, b0, b1] = T.title;
  skyMat.uniforms.uAmt1.value = t < b0 ? ss(seg(t, a0, a1)) : 1 - ss(seg(t, b0, b1));
  skyMat.uniforms.uAmt2.value = shot === 'E' ? ss(seg(t, T.end[0], T.end[0] + .7)) : 0;
  const elDeg = shot === 'A' ? lerp(-2.2, 2.0, ss(seg(t, 11.4, 16.0))) : 9;
  const sd = sunDir(elDeg * DEG);
  U.uSun.value.copy(sd);
  U.uWarm.value = shot === 'A' ? ss(seg(t, 11.4, 14.4)) : .15;
  const moonL = new THREE.Vector3(-0.92, 0.36, 0.3).normalize(), sunL = new THREE.Vector3(0.9, 0.32, -0.2).normalize();
  U.uL.value.copy(moonL).lerp(sunL, 1 - night).normalize();
  const md = new THREE.Vector3(-.36, .19, -.91).normalize();
  W.moon.position.copy(camera.position).addScaledVector(md, 7000); W.moon.lookAt(camera.position);
  W.moon.visible = night > .02; W.moon.material.opacity = night;
  W.sun.position.copy(camera.position).addScaledVector(sd, 7000); W.sun.lookAt(camera.position);
  W.sun.scale.setScalar(2.2);
  W.sun.visible = shot === 'A' && t > 10.6;
  W.sky.position.copy(camera.position);
  U.uCam.value.copy(camera.position);
}

// ================================================================ the steam
function placeMist(t) {
  const a = W.mist.geometry.attributes, L = W.mistList;
  for (let i = 0; i < L.length; i++) {
    const m = L[i], drift = t * .5 + m.ph * 3;
    const y = m.y + ((t * .12 + m.ph) % 1) * .8;
    a.aOff.array.set([m.x + Math.sin(drift * .3) * 1.5, y, m.z + Math.cos(drift * .2) * 1.2], i * 3);
    const breathe = .85 + .15 * Math.sin(t * .4 + m.ph * 6);
    a.aSize.array.set([m.w * breathe * (m.flip ? -1 : 1), m.h], i * 2);
    a.aTile.array.set([0, (3 - m.v) / 4, 1, .25], i * 4);
  }
  W.mist.geometry.instanceCount = L.length;
  a.aOff.needsUpdate = a.aSize.needsUpdate = a.aTile.needsUpdate = true;
}

// ================================================================ the board, re-cut as the film goes
let boardKey = '';
function boardState(t, shot) {
  if (shot === 'V' || shot === 'E') return {
    date: clamp((t - T.carveDate[0]) / (T.carveDate[1] - T.carveDate[0])),
    num: clamp((t - T.carveNum[0]) / (T.carveNum[1] - T.carveNum[0])),
    strike: clamp((t - T.strike) / .3), stamp: t >= T.stamp ? ss(clamp((t - T.stamp) / .1)) : 0,
  };
  return { date: 0, num: 0, strike: 0, stamp: 0 };
}
function updateBoard(st) {
  const key = [st.date, st.num, st.strike, st.stamp].map(v => v.toFixed(3)).join();
  if (key === boardKey) return;
  boardKey = key; boardCanvas(W.boardCanvas, st); W.boardTex.needsUpdate = true;
}

// ================================================================ subtitles: one bar per narration line, Chinese above English
const DURS = await (await fetch('./voice/zh/dur.json')).json();
const SUBS = VO.map(([id, at, cn, en], i) => {
  const next = VO[i + 1] ? VO[i + 1][1] : T.DUR;
  return { id, cn, en, a: at - .05, b: Math.min(at + DURS[id] + .45, next - .1) };
});
const subCanvas = document.createElement('canvas'); subCanvas.width = W_; subCanvas.height = H_;
const subTex = canvasTex(subCanvas, false);
const SUB = { cn: 42, en: 30, cnY: 960, enY: 1006 };   // bottom of the bar sits 54 px above the frame edge
let subKey = '', subBoxes = [];
function drawSub(sub, alpha) {
  const key = sub ? sub.id + alpha.toFixed(2) : '';
  if (key === subKey) return; subKey = key;
  const g = subCanvas.getContext('2d'); g.clearRect(0, 0, W_, H_); subBoxes = [];
  if (!sub || alpha <= 0) { subTex.needsUpdate = true; return; }
  g.globalAlpha = alpha;
  g.font = `700 ${SUB.cn}px 'NotoSerifSC', serif`; const wc = g.measureText(sub.cn).width;
  g.font = `500 ${SUB.en}px 'NotoSerifSC', serif`; const we = g.measureText(sub.en).width;
  const w = Math.max(wc, we) + 56, x0 = (W_ - w) / 2, y0 = SUB.cnY - SUB.cn - 16, y1 = SUB.enY + 20;
  g.fillStyle = 'rgba(22,23,27,0.62)'; g.beginPath(); g.roundRect(x0, y0, w, y1 - y0, 6); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ede5cd';
  g.font = `700 ${SUB.cn}px 'NotoSerifSC', serif`; g.fillText(sub.cn, W_ / 2, SUB.cnY);
  g.fillStyle = 'rgba(237,229,205,0.92)'; g.font = `500 ${SUB.en}px 'NotoSerifSC', serif`; g.fillText(sub.en, W_ / 2, SUB.enY);
  subBoxes = [{ id: 'sub-cn-' + sub.id, text: sub.cn, x0: (W_ - wc) / 2, y0: SUB.cnY - SUB.cn, x1: (W_ + wc) / 2, y1: SUB.cnY + 8 },
              { id: 'sub-en-' + sub.id, text: sub.en, x0: (W_ - we) / 2, y0: SUB.enY - SUB.en, x1: (W_ + we) / 2, y1: SUB.enY + 8 }];
  subTex.needsUpdate = true;
}
function placeSub(t) {
  const sub = SUBS.find(x => t >= x.a && t < x.b);
  drawSub(sub, sub ? Math.min(1, (t - sub.a) / .12, (sub.b - t) / .12) : 0);
}

// ================================================================ render
function applyCam(c, fov) {
  camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  W.crownMat.uniforms.uProj.value = projScale(); splashes.material.uniforms.uProj.value = projScale();
}
function stateFor(t, shot, era) {
  W.river1.constructor.cam = camera.position;
  let river = [], fly = [], field = [];
  if (shot.k === 'A') {
    if (t < T.takeoff) river = riverCranes(t);
    else { const r = takeoff(t); river = r.stand; fly = screenRot(r.fly); }
  } else if (shot.k === 'B') fly = screenRot(flockB(t));
  else if (shot.k === 'C') field = landing(t);
  else if (shot.k === 'P') field = fieldCranes(t, ERA_N[era], camPrint);
  else field = fieldCranes(t, 320).concat(shot.k === 'E' ? dancers(t) : dancers(T.dance[0]));
  W.river1.set(river); W.flyers.set(fly); W.field.set(field);
}
function draw(target) { renderer.setRenderTarget(target); renderer.render(scene, camera); }

let SHOT = null;
window.render = (t) => {
  const shot = SHOT = shotAt(t);
  if (Q.get('cam')) shot.c = Q.get('cam').split(',').map(Number);
  // the stamp lands: one frame of shake
  if (shot.k === 'V' && t >= T.stamp + .1 && t < T.stamp + .14) shot.c = shot.c.map((v, i) => i < 3 ? v + [.012, -.018, 0][i] : v);
  applyCam(shot.c, shot.fov);
  setSky(t, shot.k);
  placeMist(t); placeSplashes(t);
  W.river.children[0].material.uniforms.uT.value = t; W.river1.refl.material.uniforms.uT.value = t;
  updateBoard(boardState(t, shot.k));
  placeSub(t);
  // the red: never smaller than a few pixels; by day a little larger
  W.crownMat.uniforms.uMin.value = (shot.k === 'A' && t < 13 ? 3.5 : 5) * SS;
  W.crownMat.uniforms.uOn.value = 1; W.crownMat.uniforms.uShift.value.set(0, 0);
  let era = 3;
  printMat.uniforms.uPeel.value = -1; printMat.uniforms.uFresh.value = 0;
  if (shot.k === 'P') {
    const P = T.peels;
    era = t < P[0] ? 0 : t < P[1] ? 1 : t < P[2] ? 2 : 3;
    const pi = P.findIndex(x => t >= x && t < x + .3);
    // the red is a second plate: each new print arrives without it, and it is pressed on a beat later, a hair off register
    const lastPeel = P.filter(x => t >= x).pop();
    if (lastPeel !== undefined) {
      W.crownMat.uniforms.uOn.value = t >= lastPeel + .45 ? 1 : 0;
      W.crownMat.uniforms.uShift.value.set(1.6 * SS, -1.1 * SS);
    }
    if (pi >= 0) {
      const on = W.crownMat.uniforms.uOn.value; W.crownMat.uniforms.uOn.value = 0;
      setEra(pi + 1, t); stateFor(t, shot, pi + 1); draw(rtB);
      W.crownMat.uniforms.uOn.value = 1; W.crownMat.uniforms.uShift.value.set(pi ? 1.6 * SS : 0, pi ? -1.1 * SS : 0);
      printMat.uniforms.uPeel.value = eio((t - P[pi]) / .3); printMat.uniforms.uFresh.value = 1;
      era = pi;
    } else {
      const last = P.filter(x => t >= x + .3).pop();
      if (last !== undefined) printMat.uniforms.uFresh.value = 1 - ss(seg(t, last + .3, last + 1.0));
    }
  }
  setEra(era, t); stateFor(t, shot, era);
  draw(rtA);
  printMat.uniforms.uT.value = t; printMat.uniforms.tSub.value = subTex;
  printMat.uniforms.uWhite.value = shot.k === 'A' || shot.k === 'B' ? (t < T.cutB ? ss(seg(t, T.whiteIn, T.cutB)) : 1 - ss(seg(t, T.cutB, T.whiteOut))) : 0;
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};

// ================================================================ reading check: every line meant to be read, with its screen box
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight, p.z]; };
function boxOf(pts) {
  const s = pts.map(toScreen); if (s.some(p => p[2] > 1 || p[2] < -1)) return null;
  return { x0: Math.min(...s.map(p => p[0])), y0: Math.min(...s.map(p => p[1])), x1: Math.max(...s.map(p => p[0])), y1: Math.max(...s.map(p => p[1])) };
}
function skyBoxes(rect, boxes, amt, leaving) {
  if (amt <= 0 || leaving) return [];
  const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(1000).add(camera.position);
  return boxes.map(b => {
    const az0 = lerp(rect.x, rect.z, b.u0), az1 = lerp(rect.x, rect.z, b.u1), el1 = lerp(rect.y, rect.w, 1 - b.v0), el0 = lerp(rect.y, rect.w, 1 - b.v1);
    const bb = boxOf([dir(az0, el0), dir(az1, el0), dir(az0, el1), dir(az1, el1)]);
    return bb && { id: b.id, text: b.text, ...bb };
  }).filter(Boolean);
}
function meshBoxes(mesh, w, h, pieces) {   // pieces in fractions of the mesh's face
  mesh.updateMatrixWorld();
  return pieces.map(p => {
    const c = [[p.u0, p.v0], [p.u1, p.v0], [p.u0, p.v1], [p.u1, p.v1]].map(([u, v]) => mesh.localToWorld(new THREE.Vector3((u - .5) * w, (.5 - v) * h, 0)));
    const bb = boxOf(c); return bb && { id: p.id, text: p.text, ...bb };
  }).filter(Boolean);
}
window.TEXTS = (t) => {
  const out = [], k = SHOT?.k;
  if (Q.get('subs')) out.push(...subBoxes);   // the subtitle bar follows the speech (readcheck's contract leaves it out); ?subs=1 reports it
  out.push(...skyBoxes(skyMat.uniforms.uRect1.value, TITLE.boxes, skyMat.uniforms.uAmt1.value, t > T.title[2]));
  out.push(...skyBoxes(skyMat.uniforms.uRect2.value, ENDC.boxes, skyMat.uniforms.uAmt2.value, false));
  if (k === 'A' && t > 6.5 && t < 10.6) out.push(...meshBoxes(W.plate, W.plateRect.w, W.plateRect.h, PLATE_LINES));
  if (k === 'S' || k === 'V' || (k === 'C' && t > 28.1) || (k === "E" && t < T.dance[0] + .05)) {
    const st = boardState(t, k);
    out.push(...meshBoxes(W.boardFace, W.board.w, W.board.h, boardPieces(st).map(p => ({ ...p, u0: p.x0 / BOARD.W, u1: p.x1 / BOARD.W, v0: p.y0 / BOARD.H, v1: p.y1 / BOARD.H }))));
  }
  return out;
};

// ================================================================ events for the sound
window.EV = (() => {
  const E = [], add = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  add(0, 'start');
  add(T.title[0], 'carveTitle'); add(T.title[2], 'uncarveTitle');
  for (const t of [1.7, 3.4, 4.9, 6.2]) add(t, 'frostcrack');
  add(2.6, 'sleepcall');
  add(T.bridgeHold[0], 'bridgeHold'); add(T.underBridge + .05, 'underBridge'); add(T.underBridge + .6, 'outBridge');
  RA.forEach(b => { if (!b.awake && b.wake < T.takeoff && b.z < 0) add(b.wake, 'wake', { pan: clamp((b.z + 108) / 18, -1, 1) }); });
  add(T.pairCall, 'unison'); add(T.pairCall + 1.1, 'calls');
  add(T.takeoff, 'takeoff');
  add(T.whiteIn, 'steam'); add(T.cutB, 'air');
  add(T.cutC, 'descend'); add(T.landed, 'touchdown');
  LAND.slice(1).forEach(b => add(b.t0 + b.dur, 'land', { pan: clamp((b.to[0] + 99) / 40, -1, 1) }));
  add(T.sign1[0], 'board');
  add(T.prints[0], 'print0'); add(T.corn[0], 'corn');
  T.peels.forEach((t, i) => { add(t, 'peel', { i }); add(t + .45, 'redplate', { i }); });
  for (let i = 0; i < 6; i++) add(T.carveDate[0] + i * (T.carveDate[1] - T.carveDate[0]) / 6, 'knife', { i });
  for (let i = 0; i < 8; i++) add(T.carveNum[0] + i * (T.carveNum[1] - T.carveNum[0]) / 8, 'knife', { i: i + 6 });
  add(T.strike, 'strike'); add(T.stamp + .1, 'stamp');
  for (let i = 0; i < 5; i++) add(T.dance[0] + .2 + i * .95, 'danceflap');
  add(T.end[0], 'endcard');
  VO.forEach(([id, at]) => add(at, 'vo', { id }));
  return E.sort((a, b) => a.t - b.t);
})();

// ================================================================ the bridge, slowed: film time → the unslowed timeline
// Through WARP.a–WARP.b the picture runs at down to half speed (smooth in and out), so the pass under the bridge
// takes about 1.4 s; everything after it comes WARP.d later. Narration, subtitles and sound events move with it.
const WARP = { a: 9.95, b: 11.75, d: .4 };
const toOld = t => { if (t <= WARP.a) return t; if (t >= WARP.b) return t - WARP.d; const u = (t - WARP.a) / (WARP.b - WARP.a); return t - WARP.d * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI)); };
const toNew = x => { if (x <= WARP.a) return x; let lo = x, hi = x + WARP.d; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (toOld(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
window.DUR = +(T.DUR + WARP.d).toFixed(3);
{ const r = window.render, tx = window.TEXTS; window.render = t => r(toOld(t)); window.TEXTS = t => tx(toOld(t)); }
window.EV = window.EV.map(e => ({ ...e, t: +toNew(e.t).toFixed(3) }));
window.render(0);
window.READY = true;
