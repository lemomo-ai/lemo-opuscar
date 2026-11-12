// Film copy of outline.js: the normal/depth pass swaps each part to its own normal material (so the cut barrel is clipped there too).
// Illustration outlines. Pass 1: colour (MSAA). Pass 2: view normals + depth (layer 0 only, so the contact shadow and
// the dashed axes never get outlined). Composite: a pixel on the near side of a depth step, or on a crease, is drawn in a
// darker shade of its own colour, so each part is ringed in its own hue rather than in black.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const fs = `
  #include <packing>
  varying vec2 vUv;
  uniform sampler2D tCol, tN, tD; uniform vec2 px; uniform float near, far, rD, rN, kD; uniform vec3 ink;
  float lz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tD, uv).x, near, far); }
  vec3 nn(vec2 uv){ return texture2D(tN, uv).xyz * 2. - 1.; }
  void main(){
    vec3 col = texture2D(tCol, vUv).rgb;
    float zc = lz(vUv);
    if (zc > far * .98) { gl_FragColor = vec4(col, 1.); return; }
    vec3 nc = nn(vUv);
    float e = 0.;
    vec2 dirs[4]; dirs[0] = vec2(1., 0.); dirs[1] = vec2(0., 1.); dirs[2] = vec2(.7071, .7071); dirs[3] = vec2(.7071, -.7071);
    float thr = kD * zc;
    for (int i = 0; i < 4; i++) {
      vec2 o = dirs[i] * px * rD;
      float za = lz(vUv + o), zb = lz(vUv - o);
      float lap = za + zb - 2. * zc;                       // > 0 only on the near side of a step
      e = max(e, smoothstep(thr, thr * 2.2, lap));
      vec2 on = dirs[i] * px * rN;
      float dn = max(1. - dot(nc, nn(vUv + on)), 1. - dot(nc, nn(vUv - on)));
      float zn = abs(lz(vUv + on) - zc);
      e = max(e, smoothstep(.30, .55, dn) * (1. - smoothstep(thr, thr * 3., zn)) * .85);
    }
    vec3 line = mix(col * .52, ink, .28);
    gl_FragColor = vec4(mix(col, line, e), 1.);
  }`;

export function makeOutline(renderer, scene, camera, w, h, PAL, parts) {
  const rtC = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
  const rtN = new THREE.WebGLRenderTarget(w, h, { depthTexture: new THREE.DepthTexture(w, h, THREE.FloatType) });
  const q = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tCol: { value: rtC.texture }, tN: { value: rtN.texture }, tD: { value: rtN.depthTexture }, px: { value: new THREE.Vector2(1 / w, 1 / h) },
      near: { value: camera.near }, far: { value: camera.far }, rD: { value: 2.6 }, rN: { value: 1.6 }, kD: { value: .0022 }, ink: { value: new THREE.Color(PAL.ink) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: fs, depthTest: false, depthWrite: false,
  }));
  const qs = new URLSearchParams(location.search);
  if (qs.has('rD')) q.material.uniforms.rD.value = +qs.get('rD');
  if (qs.has('kD')) q.material.uniforms.kD.value = +qs.get('kD');
  return {
    render() {
      camera.layers.enableAll();
      renderer.setRenderTarget(rtC); renderer.clear(); renderer.render(scene, camera);
      camera.layers.set(0);
      const bg = renderer.getClearColor(new THREE.Color()), a = renderer.getClearAlpha();
      for (const m of parts) { m.userData.cm = m.material; m.material = m.userData.nm; }
      renderer.setClearColor(0x8080ff, 1);
      renderer.setRenderTarget(rtN); renderer.clear(); renderer.render(scene, camera);
      for (const m of parts) m.material = m.userData.cm;
      renderer.setClearColor(bg, a);
      camera.layers.enableAll();
      renderer.setRenderTarget(null); q.render(renderer);
    },
  };
}
