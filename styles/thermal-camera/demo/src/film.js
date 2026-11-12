// 冬夜，一栋楼的体温 · A Building on a Winter Night — main: scene, timeline, cameras, passes, window.render(t)
import * as THREE from 'three';
import { B, WINDOWS, LEAKY, makeWinTex, fillWinTex, yF } from './layout.js';
import { U, MESHES, setPass } from './thermal.js';
import { nightEnv } from './photo.js';
import { buildBuilding } from './building.js';
import { buildStreet, CARS, LAMPS, LAMP_H } from './street.js';
import { buildCat, catPose } from './cat.js';
import { makePost, SENSOR } from './post.js';
import { makeHud } from './hud.js';
import { clamp, lerp, seg, ss, sst, eo3, eio, eio2, keys, hash1 } from './util.js';

export const DUR = 49.0;
window.DUR = DUR;
const Q = new URLSearchParams(location.search);
const W = innerWidth, H = innerHeight;
const glc = document.getElementById('gl'), ovc = document.getElementById('ov');
ovc.width = W; ovc.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = true;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const env = nightEnv(renderer);
scene.environment = env; scene.environmentIntensity = 0.35;
scene.background = null;

// ---------------------------------------------------------------- world
const winTex = makeWinTex(); U.tWinPic.value = winTex.pic; U.tWinTh.value = winTex.th;
U.uLeakRect.value.set(LEAKY.x0, LEAKY.y0, LEAKY.x1, LEAKY.y1);
const bld = buildBuilding(scene);
const st = buildStreet(scene, env);
LAMPS.forEach((L, i) => U.uLamp.value[i].set(L.x, LAMP_H + .05, L.z + 1.38));
bld.entranceLights.forEach((l, i) => U.uLamp.value[2 + i].copy(l.position));
const hemi = new THREE.HemisphereLight(0x4a5270, 0x18181c, 1.3); scene.add(hemi);
const fillL = new THREE.DirectionalLight(0x8090b0, 0.06); fillL.position.set(10, 30, 60); scene.add(fillL);
// the street lamps on the camera's side of the road, out of frame: a low warm wash up the facade
const wash = new THREE.SpotLight(0xffa860, 420, 90, .55, .9, 2); wash.position.set(-4, 3.2, 40); wash.target.position.set(0, 1.5, 0); scene.add(wash, wash.target);
const wash2 = new THREE.SpotLight(0xffb070, 260, 90, .5, .9, 2); wash2.position.set(22, 3.2, 34); wash2.target.position.set(8, 1.0, 0); scene.add(wash2, wash2.target);
// the cat on the hero car's bonnet
const heroIdx = CARS.findIndex(c => c.hero), hero = st.cars[heroIdx];
const catTilt = new THREE.Group(); catTilt.position.set(1.5, .886, -.05); catTilt.rotation.z = -.08; hero.group.add(catTilt);
const cat = buildCat(catTilt);
cat.group.rotation.y = 2.3;   // head toward the street, where the camera comes from
hero.group.updateMatrixWorld(true);
export const CAT_HEAD = () => { const v = new THREE.Vector3(); cat.group.children[0].children.find(c => c.isGroup)?.getWorldPosition(v); return v; };

// ---------------------------------------------------------------- timeline
export const T = {
  s1: 0, s2: 4.6, s3: 10.2, s4: 16.2, s5: 22.6, s6: 29.6, s7: 35.2, split: 36.6, verdict: 40.4, s8: 43.4, s8cut: 44.0, endHold: 45.5,
};
const leakC = new THREE.Vector3((LEAKY.x0 + LEAKY.x1) / 2, (LEAKY.y0 + LEAKY.y1) / 2, 0);
function shotCam(t) {
  // returns {pos, look, fov, aper, focus}
  if (t < T.s2) {                          // S1: frontal from across the road, slow push while the scan line passes
    const k = ss(seg(t, 0, T.s2));
    return { pos: new THREE.Vector3(lerp(.6, .1, k), lerp(1.7, 2.0, k), lerp(29.5, 26.6, k)), look: new THREE.Vector3(lerp(.3, .1, k), lerp(8.4, 8.5, k), 0), fov: 46, aper: 0 };
  }
  if (t < T.s3) {                          // S2: crane up and push in toward the third floor
    const k = eio2(seg(t, T.s2, T.s3)) * .85 + .15 * seg(t, T.s2, T.s3);
    const pos = new THREE.Vector3(lerp(.1, -1.0, k), lerp(2.0, 6.4, k), lerp(26.6, 17.6, k));
    const look = new THREE.Vector3(lerp(.1, -1.4, k), lerp(8.5, 8.7, k), 0);
    return { pos, look, fov: lerp(46, 38, k), aper: 0 };
  }
  if (t < T.s4) {                          // S3: zoom in on the leaking window, then hold with a slow creep
    const k = eio(seg(t, T.s3, 13.2)), k2 = ss(seg(t, 13.2, T.s4));
    const pos = new THREE.Vector3(lerp(-1.0, -1.2, k), lerp(6.4, 6.9, k), lerp(17.6, 12.8, k) - .3 * k2);
    const look = new THREE.Vector3(lerp(-1.4, leakC.x, k), lerp(8.7, 8.55, k), 0);
    return { pos, look, fov: lerp(38, 16, k) - .6 * k2, aper: 0 };
  }
  if (t < T.s5) {                          // S4: lateral truck along floors 1-3
    const k = seg(t, T.s4, T.s5); const kk = .15 * ss(k) + .85 * k;
    const pos = new THREE.Vector3(lerp(-9.5, 5.5, kk), 4.6, 11.2);
    const look = new THREE.Vector3(lerp(-8.6, 6.4, kk), 6.3, 0);
    return { pos, look, fov: 36, aper: 0 };
  }
  if (t < T.s6) {                          // S5: down the row of cars, settle high over the bonnet on the cat
    const k = eio(seg(t, T.s5, 25.7)), k2 = ss(seg(t, 25.7, T.s6));
    const catW = new THREE.Vector3(); cat.group.getWorldPosition(catW);
    const pos = new THREE.Vector3(lerp(19.8, 13.85, k) - .12 * k2, lerp(2.6, 1.86, k) - .05 * k2, lerp(16.2, 9.55, k) - .14 * k2);
    const look = new THREE.Vector3(lerp(9.0, catW.x - .02, k), lerp(1.0, catW.y + .08, k), lerp(6.5, catW.z - .04, k));
    return { pos, look, fov: lerp(46, 17.5, k) - 1.0 * k2, aper: lerp(3, 7, k), focusAt: catW };
  }
  if (t < T.s7) {                          // S6: crane up the facade and over the parapet, tilt down to the roof
    const k = eio(seg(t, T.s6, 33.6)), k2 = ss(seg(t, 33.6, T.s7));
    const pos = new THREE.Vector3(lerp(-6.0, -1.6, k) + .5 * k2, lerp(11.0, 28.4, k) + .4 * k2, lerp(13.5, 1.2, k) - .3 * k2);
    const look = new THREE.Vector3(lerp(-5.4, -1.8, k) + .4 * k2, lerp(14.2, 17.25, k), lerp(0, -5.7, k));
    return { pos, look, fov: lerp(48, 50, k), aper: 0 };
  }
  if (t < T.s8cut) {                       // S7: the report view, locked
    const k = eio(seg(t, T.s7, T.split));
    return { pos: new THREE.Vector3(0, 8.9, lerp(35, 38.5, k)), look: new THREE.Vector3(0, 8.7, 0), fov: 40, aper: 0, report: true };
  }
  // S8: back at the bonnet, the cat a year on; scan to visible and pull back to the renovated building
  const k = eio(seg(t, 44.2, 45.4));
  const catW = new THREE.Vector3(); cat.group.getWorldPosition(catW);
  const pos = new THREE.Vector3(lerp(13.7, 17.0, k), lerp(1.75, 1.5, k), lerp(9.5, 15.2, k));
  const look = new THREE.Vector3(lerp(catW.x, 7.2, k), lerp(catW.y + .08, 5.9, k), lerp(catW.z, 0, k));
  return { pos, look, fov: lerp(20, 54, k), aper: lerp(7, 2.5, k), focusAt: catW };
}
// is this moment in the renovated year?
const afterAt = t => t >= T.s8 ? 1 : 0;
// window lights
function litFn(t, after) {
  return w => {
    if (!after) return w.litBefore;
    let l = w.litAfter;
    if (t >= T.s8cut) {
      // a few more lights come on, and a stairwell lights floor by floor (someone coming home)
      if (!l && w.k !== 'S' && w.seed > .62 && w.seed < .74) l = sst(t, 44.6 + (w.seed - .62) * 14, 44.75 + (w.seed - .62) * 14);
      if (w.k === 'S' && w.u === 2) { const on = 45.0 + w.f * .75; l = .55 * sst(t, on, on + .08) * (1 - sst(t, on + 3.2, on + 3.3)); }
    }
    return l;
  };
}

// ---------------------------------------------------------------- passes
const post = makePost(renderer, W, H);
const hud = makeHud(ovc, W, H);
const FU = post.final.m.uniforms;
const projGL = (v) => { const p = v.clone().project(camera); return new THREE.Vector2((p.x * .5 + .5) * W, (p.y * .5 + .5) * H); };

// thermal display range per shot (level / span), isotherm
function rangeAt(t) {
  if (t < T.s4) return [-9, 7];
  if (t < 17.4) return [-9, 7];
  if (t < T.s5) return [-8, 2];
  if (t < T.s6) return [-10, 36];
  if (t < T.s7) return [-12, 6];
  if (t < T.s8cut) return [-9, 7];
  return [-10, 36];
}
// split line per moment, in GL pixels (y up): [A, B]; thermal on the side dot(px-A, n) > 0 with n = perp(B-A)
function splitAt(t) {
  const V = (x, y) => new THREE.Vector2(x, y);
  if (t < T.s2) {                      // S1: vertical line from the left to the right; thermal on its left
    const k = eio2(seg(t, .05, 2.7)); const x = lerp(.035, 1.08, k) * W;
    return [V(x + .05 * W, H), V(x - .05 * W, 0), Math.min(1, seg(t, 0, 2.7) * 3) * (1 - seg(t, 2.5, 2.8))];
  }
  if (t < T.s4) return 'therm';
  if (t < T.s5) {                      // S4: fixed vertical split, visible left, thermal right
    const x = lerp(1.06, .47, eo3(seg(t, T.s4, T.s4 + .55))) * W;
    return [V(x, 0), V(x, H), 0];
  }
  if (t < T.s6) {
    if (t < 24.0) return 'photo';
    const k = eio2(seg(t, 24.0, 25.2)); const x = lerp(1.05, -.06, k) * W;
    return [V(x - .04 * W, 0), V(x + .04 * W, H), (1 - seg(t, 25.0, 25.25))];
  }
  if (t < T.s8cut) return 'therm';
  if (t < 44.15) return 'therm';
  const k = eio2(seg(t, 44.15, 45.2)); const x = lerp(-.06, 1.06, k) * W;
  return [V(x + .04 * W, 0), V(x - .04 * W, H), (1 - seg(t, 45.0, 45.25))];
}

// ---------------------------------------------------------------- render
let lastFrame = -1;
function renderWorld(pass, after, vp) {
  U.uAfter.value = after;
  for (const k in bld.frameMeshes) bld.frameMeshes[k].userData.on = (bld.frameMeshes[k].userData.state === 'after') === !!after;
  setPass(pass);
  st.snow.visible = pass === 'photo';
  st.skyM.position.copy(camera.position);
  if (pass === 'photo') {
    renderer.setRenderTarget(post.rtPhoto); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  } else {
    const sh = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; const envB = scene.environment; scene.environment = null;
    const rt = post.rtThermMS;
    if (vp) { rt.viewport.set(vp[0], 0, vp[1], post.TH); rt.scissor.set(vp[0], 0, vp[1], post.TH); rt.scissorTest = true; }
    else { rt.viewport.set(0, 0, post.TW, post.TH); rt.scissorTest = false; }
    renderer.setRenderTarget(rt); renderer.setClearColor(new THREE.Color(-20, 0, 0), 1);
    if (!vp || vp[0] === 0) renderer.clear();
    renderer.render(scene, camera);
    rt.viewport.set(0, 0, post.TW, post.TH); rt.scissorTest = false;
    renderer.shadowMap.enabled = sh; scene.environment = envB;
  }
}
const STATE = {};
window.render = function (t) {
  t = clamp(+t || 0, 0, DUR);
  const frame = Math.floor(t * 30 + 1e-4);
  U.uTime.value = t;
  const after = afterAt(t);
  fillWinTex(winTex, litFn(t, after), after);
  
  // camera
  let c = shotCam(t);
  if (Q.get('catcam')) { const cw = new THREE.Vector3(); cat.group.getWorldPosition(cw); const a = +(Q.get('catcam')); c = { pos: cw.clone().add(new THREE.Vector3(Math.sin(a) * 1.1, .55, Math.cos(a) * 1.1)), look: cw.clone().add(new THREE.Vector3(0, .08, 0)), fov: 30, aper: 0 }; }
  camera.position.copy(c.pos); camera.fov = c.fov; camera.aspect = W / H; camera.updateProjectionMatrix(); camera.lookAt(c.look); camera.updateMatrixWorld(true);
  cat.update(t, 0, camera.position);
  for (const m of bld.plumes) { m.quaternion.copy(camera.quaternion); }
  scene.updateMatrixWorld(true);
  // which passes
  let sp = splitAt(t);
  if (Q.get('mode') === 'photo') sp = 'photo'; else if (Q.get('mode') === 'therm') sp = 'therm';
  const photoOnly = sp === 'photo', thermOnly = sp === 'therm';
  FU.uPhotoOnly.value = photoOnly ? 1 : 0; FU.uThermOnly.value = thermOnly ? 1 : 0;
  if (Array.isArray(sp)) { FU.uA.value.copy(sp[0]); FU.uB.value.copy(sp[1]); FU.uSplitGlow.value = sp[2]; } else FU.uSplitGlow.value = 0;
  // focus
  FU.uFocus.value = c.focusAt ? camera.position.distanceTo(c.focusAt) : 30; FU.uAper.value = c.aper || 0;
  FU.uNear.value = camera.near; FU.uFar.value = camera.far;
  FU.uFrame.value = frame;
  // the report: two viewports, before | after
  const dual = c.report && t >= T.split && t < T.s8cut;
  const divX = dual ? (t < T.s8 ? lerp(1, .5, eio(seg(t, T.split, T.split + .75))) : lerp(.5, 0, eio(seg(t, T.s8, T.s8cut - .05)))) : -1;
  if (!thermOnly) { renderWorld('photo', after); post.bloom(); }
  if (!photoOnly) {
    if (dual) {
      const wl = Math.round(divX * post.TW);
      // left: before (camera frustum shifted so the building stays centred in the left part)
      if (wl > 2) { camera.aspect = wl / post.TH; camera.updateProjectionMatrix(); renderWorld('therm', 0, [0, wl]); }
      if (post.TW - wl > 2) { camera.aspect = (post.TW - wl) / post.TH; camera.updateProjectionMatrix(); renderWorld('therm', 1, [wl, post.TW - wl]); }
      camera.aspect = W / H; camera.updateProjectionMatrix();
    } else renderWorld('therm', after);
    post.sense(frame, 1);
  }
  const [lo, hi] = rangeAt(t);
  FU.uLo.value = lo; FU.uHi.value = hi;
  FU.uIso.value = 8; FU.uIsoOn.value = (t >= 10.65 && t < T.s4) ? 1 : 0;
  FU.uMsx.value = dual || c.report ? 0 : .55;
  FU.uExpo.value = 1.0; FU.uBloom.value = .9;
  FU.uDiv.value = dual ? divX * W : -1;
  FU.uFlash.value = 0;
  post.composite();
  hud.draw(t, { camera, post, sp, lo, hi, dual, divX, after, c, cat, catPose, projGL, T, W, H });
};
window.TEXTS = function (t) { window.render(t); return hud.texts(); };
// sound events (film time): the score and the foley are placed from these (node core/render/events.mjs)
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0.05, 'scan', { d: 2.65, dir: 1 }); ev(4.6, 'crane', { d: 5.6 });
ev(5.0, 'lock'); ev(5.9, 'lock'); ev(6.7, 'label'); ev(8.2, 'nuc');
ev(10.2, 'zoom', { d: 3.0 }); ev(10.65, 'alarm'); ev(12.75, 'box'); ev(13.0, 'lock');
ev(T.s4, 'cut'); ev(T.s4, 'scan', { d: .55, dir: -1 }); ev(17.3, 'span'); ev(17.3, 'flow', { d: 5.3 }); ev(17.55, 'label'); ev(18.9, 'label'); ev(20.6, 'nuc');
ev(T.s5, 'cut'); ev(24.0, 'scan', { d: 1.2, dir: -1 }); ev(24.75, 'ear'); ev(25.35, 'lock'); ev(25.85, 'lock'); ev(26.3, 'stir'); ev(26.72, 'max'); ev(26.95, 'meow'); ev(28.6, 'settle', { d: .9 }); ev(29.3, 'ear');
ev(T.s6, 'cut'); ev(T.s6, 'crane', { d: 4.0 }); ev(31.1, 'label'); ev(32.4, 'label'); ev(33.9, 'nuc');
ev(T.s7, 'cut'); ev(T.split, 'scan', { d: .75, dir: -1 }); ev(37.35, 'label'); ev(T.verdict, 'verdict');
ev(T.s8, 'whoosh', { d: .6 }); ev(T.s8cut, 'cut'); ev(44.15, 'scan', { d: 1.05, dir: 1 }); ev(45.5, 'end');
window.EV = EV;

await document.fonts.load('500 20px Plex'); await document.fonts.load('400 20px Plex'); await document.fonts.load('500 20px SC'); await document.fonts.load('700 20px SC'); await document.fonts.load('500 20px Inter');
window.render(+(Q.get('t') || 0));
window.READY = true;
