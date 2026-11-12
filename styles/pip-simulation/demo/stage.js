// The stage: renderer, post, lights, the lab board, the 2D type layer
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePost } from './post.js';
import { PAL } from './blob.js';
import { PALETTE } from './palette.js';

export const W = 1920, H = 1080;
export function makeStage({ fov = 30, ssaa = 2, ao = false, bg = PALETTE.studio, fog = [30, 90] } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(ssaa); renderer.setSize(W, H);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = .94;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  document.getElementById('stage').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
  const camera = new THREE.PerspectiveCamera(fov, W / H, .1, 200);
  const post = makePost(renderer, scene, camera, W, H, { ssaa, ao, aoRadius: .5, aoScale: 2.2, aoAmt: .9 });
  post.bloom.strength = .0; post.bloom.threshold = 2;
  post.vig.uniforms.amt.value = .12; post.vig.uniforms.contrast.value = .06; post.vig.uniforms.sat.value = 1.04;
  post.dof.maxCoc = 0;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .42;
  // key light: front left, above, warm white, soft shadows
  const sun = new THREE.DirectionalLight(PALETTE.light.sun, 2.8);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.00015; sun.shadow.normalBias = .006;
  sun.shadow.radius = 7;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(PALETTE.light.sky, PALETTE.light.bounce, .4); scene.add(hemi);
  // rim light: from behind and above, grazing the Pips' outlines (the flock sheen depends on it)
  const rim = new THREE.DirectionalLight(PALETTE.light.rim, 1.3); rim.position.set(3, 6, -10); scene.add(rim);
  const setSun = (dir, target, span = 20) => {
    sun.position.copy(target).addScaledVector(new THREE.Vector3(...dir).normalize(), 40); sun.target.position.copy(target);
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 90 }); sun.shadow.camera.updateProjectionMatrix();
  };
  const ov = document.getElementById('ov'), g = ov.getContext('2d');
  return { renderer, scene, camera, post, sun, hemi, rim, setSun, ov, g };
}

// The lab board: a thick rounded slab with a matte, fine-grained printed grid paper. The grid is drawn in the shader (crisp at any distance)
export function makeBoard(scene, { w = 40, d = 40, x = 0, z = 0, thick = .35, color = PAL.board, minor = 1, major = 5, line = PALETTE.gridMinor, lineMaj = PALETTE.gridMajor, radius = 1.2, frameInk = true } = {}) {
  const geo = new RoundedBoxGeometry(w, thick, d, 6, Math.min(radius, thick * .49));
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0 });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uMinor = { value: minor }; sh.uniforms.uMajor = { value: major };
    sh.uniforms.uLine = { value: new THREE.Color(line) }; sh.uniforms.uEdge = { value: new THREE.Color(PALETTE.boardEdge) }; sh.uniforms.uLineMaj = { value: new THREE.Color(lineMaj) };
    sh.uniforms.uHalf = { value: new THREE.Vector2(w / 2 - .6, d / 2 - .6) }; sh.uniforms.uC = { value: new THREE.Vector2(x, z) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vW; uniform float uMinor, uMajor; uniform vec3 uLine, uLineMaj, uEdge; uniform vec2 uHalf, uC;
float gridL(vec2 p, float step, float wpx){ vec2 q = abs(fract(p / step + .5) - .5) * step; vec2 fw = fwidth(p); vec2 a = 1. - smoothstep(fw * (wpx - .5), fw * (wpx + .5), q); return max(a.x, a.y); }
float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec2 p = vW.xz - uC; vec2 e = uHalf - abs(p);
  float inside = step(0., min(e.x, e.y)) * step(-.005, vW.y);
  float fade = 1. - smoothstep(14., 40., length(vW - cameraPosition));
  float mn = gridL(p, uMinor, 1.0) * .45 * fade, mj = gridL(p, uMajor, 1.4) * .8 * fade;
  vec3 c = diffuseColor.rgb;
  c = mix(c, uLine, mn * inside);
  c = mix(c, uLineMaj, mj * inside);
  // board edge: a thin ink line
  float edge = 1. - smoothstep(0.015, 0.035, abs(min(e.x, e.y)));
  c = mix(c, uEdge, edge * ${frameInk ? '0.55' : '0.0'});
  // paper grain
  c *= 0.985 + 0.03 * hsh(floor(vW.xz * 90.));
  diffuseColor.rgb = c; }`);
  };
  mat.customProgramCacheKey = () => 'board' + w + d + minor + major + line + lineMaj + frameInk;
  const m = new THREE.Mesh(geo, mat); m.position.set(x, -thick / 2, z); m.receiveShadow = true; scene.add(m);
  return m;
}
// the floor under the board, background-coloured, catching shadows
export function makeFloor(scene, color, y = -.36) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; scene.add(m); return m;
}
// type and graphics printed on the board: a canvas-textured plane lying on the board (never a sign floating in the air)
export function decal(scene, { w, h, x, z, rot = 0, draw, px = 200, y = .002 }) {
  const c = document.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px);
  const g = c.getContext('2d'); g.scale(px, px); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y, z); m.receiveShadow = true; m.renderOrder = 1; scene.add(m);
  return m;
}
