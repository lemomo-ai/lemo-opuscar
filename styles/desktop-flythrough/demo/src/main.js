// Tabletop App Flythrough — 叮之前 / Before the Ding. One take over a dotted paper mat on an oak desk, with voice-over and subtitles. Page contract: render(t), DUR, EV, TEXTS.
import * as THREE from 'three';
import { makeWorld } from './world.js';
import { makePost } from './post.js';
import { makeRig } from './camera.js';
import { makeSubs } from './captions.js';
import { KEYS, SHAKES } from './shots.js';
import * as F from './film.js';

const FPS = 30, SHUTTER = .3;   // light motion blur: only fast camera moves streak, and only a little
const Q = new URLSearchParams(location.search);
window.DUR = F.DUR;
await Promise.all([document.fonts.load('500 20px PM'), document.fonts.load('600 20px PM'), document.fonts.load('700 40px IS'), document.fonts.load('600 40px IS'), document.fonts.load('700 40px SC', F.GLYPHS)]);

const world = makeWorld({ mat: F.MAT, haze: '#e6e3e0' }), { renderer, scene, camera, sun, SUNDIR } = world;
const ev = [];
const ctx = { world, subj: {}, ev, camera };
const update = F.build(ctx);
const rig = makeRig(ctx, camera, KEYS, SHAKES);
const caps = makeSubs(F.VO, F.END);
const post = makePost(renderer, scene, camera, 1920, 1080);
post.grade.uniforms.amt.value = .12; post.grade.uniforms.warm.value = .04; post.grade.uniforms.lift.value.set(0, 0, 0); post.grade.uniforms.contrast.value = .1; post.grade.uniforms.sat.value = 1.1;
post.bloom.strength = .12; post.bloom.threshold = 1.1;

function applyAt(t, jx, jy) {
  update(t);
  const { tg, d } = rig.apply(t, jx, jy);
  sun.target.position.copy(tg); sun.position.copy(tg).addScaledVector(SUNDIR, 4);
  const hs = Math.min(4, Math.max(.35, d * 1.1));
  Object.assign(sun.shadow.camera, { left: -hs, right: hs, top: hs, bottom: -hs, near: .1, far: 10 }); sun.shadow.camera.updateProjectionMatrix();
  const fp = tg.clone().applyMatrix4(camera.matrixWorldInverse); post.dof.focus = Math.max(.05, -fp.z) * 1.25; post.dof.aper = 2.0; post.dof.maxCoc = 5;   // the focus plane sits a little behind the subject: subject and midground stay sharp, only the far background softens
  renderer.toneMappingExposure = 1 + 1.6 * ctx.fx.flash;
}
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
let TC = 0;
post.accum.N = +(Q.get('n') || 20);
// the shutter adapts to the camera's speed: a streak never exceeds ~8 px, so even a whip keeps its subject legible
let SH = SHUTTER;
const probe = new THREE.Vector3(), q0 = new THREE.Quaternion(), p0 = new THREE.Vector3();
function shutterAt(t) {
  const h = .02; applyAt(t - h, 0, 0); q0.copy(camera.quaternion); p0.copy(camera.position); const d0 = rig.target(t - h).distanceTo(p0);
  applyAt(t + h, 0, 0); const ang = q0.angleTo(camera.quaternion) + camera.position.distanceTo(p0) / Math.max(.05, d0);
  const pxPerSec = ang / (2 * h) * 1080 / (camera.fov * Math.PI / 180);
  return Math.max(.02, Math.min(SHUTTER, 8 * FPS / Math.max(1, pxPerSec)));
}
post.accum.setSub = (i, n) => applyAt(TC + ((i + .5) / n - .5) * SH / FPS, halton(i + 1, 2) - .5, halton(i + 1, 3) - .5);

window.render = t => { TC = t; SH = shutterAt(t); caps.render(t); post.composer.render(); };
// what the viewer is meant to read: the captions (DOM) plus the in-world text listed in ctx.read, projected to screen boxes
const proj = new THREE.Vector3();
window.TEXTS = t => {
  caps.render(t); const out = caps.texts(t);
  applyAt(t, 0, 0); camera.updateMatrixWorld();
  for (const [id, text, t0, t1, corners] of ctx.read) {
    if (t < t0 || t >= t1) continue;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
    for (const p of corners()) { proj.copy(p).project(camera); if (proj.z > 1) behind = true; const x = (proj.x + 1) / 2 * 1920, y = (1 - proj.y) / 2 * 1080; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (!behind) out.push({ id, text, x0, y0, x1, y1 });
  }
  return out;
};
window.EV = ev;
applyAt(0, 0, 0); renderer.compile(scene, camera);
window.READY = true;
window.DBG = (t, names = []) => { applyAt(t, 0, 0); const r = { cam: camera.position.toArray().map(v => +v.toFixed(3)), tg: rig.target(t).toArray().map(v => +v.toFixed(3)) }; for (const n of names) r[n] = ctx.subj[n](t).toArray().map(v => +v.toFixed(3)); return r; };
