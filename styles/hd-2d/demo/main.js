// The Lampbearer — 2.5D Pixel Art style demo
import * as THREE from 'three';
import { makePost } from './post_ts.js';   // local copy, adds a tilt-shift term (enabled with ?tilt=1)
import { DUR, SHOTS, shotAt } from './story.js';
import { buildHarbor } from './harbor.js';
import { buildForest } from './forest.js';
import { buildCliff } from './cliff.js';
import { drawOverlay, overlayReady } from './ui.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 2);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(32, W / H, .3, 2000);
const ONLY = Q.get('only');   // debug: build only one scene
const sets = {};
if (!ONLY || ONLY === 'harbor') sets.harbor = buildHarbor();
if (!ONLY || ONLY === 'forest') sets.forest = buildForest();
if (!ONLY || ONLY === 'cliff') sets.cliff = buildCliff();
const SET_OF = { harborWide: 'harbor', pier: 'harbor', harborEnd: 'harbor', title: 'harbor', forest: 'forest', cliff: 'cliff', lamp: 'cliff' };
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
post.bloom.strength = .55; post.bloom.radius = .75; post.bloom.threshold = .85;
const V = post.vig.uniforms; V.amt.value = .62; V.warm.value = .1; V.contrast.value = .2; V.sat.value = 1.05;
if (Q.has('nobloom')) post.bloom.enabled = false;
if (Q.has('nodof')) post.dof.maxCoc = 0;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
await overlayReady();

// —— Tilt-shift: the sharp band follows Wren's screen height; wide shots with no character use a fixed position ——
const TILT = Q.has('tilt'), TILT_C = { harborWide: .34, harborEnd: .36, title: .36 };
const _v = new THREE.Vector3();
function tiltCenter(S, shot) {
  if (TILT_C[shot.id] != null) return TILT_C[shot.id];
  let w = null; S.scene.traverse(o => { if (o.userData.char === 'wren' && o.visible) w = o; });
  if (!w) return .45;
  camera.updateMatrixWorld(); S.scene.updateMatrixWorld(); w.getWorldPosition(_v); _v.y += .7; _v.project(camera);
  return Math.min(.8, Math.max(.2, _v.y * .5 + .5));
}
window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t), sid = SET_OF[shot.id];
  if (sid && sets[sid]) {
    const S = sets[sid]; post.dof.scene = S.scene; if (post.dof.ao) post.dof.ao.scene = S.scene;
    // each scene can override these defaults in update
    post.vig.uniforms.fade.value = 1; post.bloom.strength = .55; post.bloom.threshold = .85; renderer.toneMappingExposure = 1.15;
    V.warm.value = .1; V.sat.value = 1.05; V.amt.value = .62;
    S.update(t, shot, camera, post, renderer);
    if (TILT) { post.dof.tiltAmt = 17; post.dof.tiltC = tiltCenter(S, shot); post.dof.tiltW = .075; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 24); V.sat.value *= 1.16; V.contrast.value = .28; }
    if (Q.has('nodof')) post.dof.maxCoc = 0;
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, shot);
};
window.READY = true;
