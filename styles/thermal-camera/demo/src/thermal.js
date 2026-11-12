// Thermal materials: every fragment writes the apparent temperature in °C (what a radiometric camera reads) into R.
import * as THREE from 'three';
import { NOISE, THERMO, LAYOUT, PHYS_GLSL } from './glsl.js';

// uniforms shared by every material in the film (picture and thermal)
export const U = {
  uTime: { value: 0 }, uAfter: { value: 0 }, uTout: { value: -6 },
  tWinPic: { value: null }, tWinTh: { value: null },
  uLeakRect: { value: new THREE.Vector4() }, uLeak: { value: 1 },
  uLamp: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uSnowT: { value: 0 }, uSpill: { value: 0.5 }, uRoomGain: { value: 1 },
};

export const THERM_VS = `
varying vec3 vW; varying vec3 vN; varying vec3 vL;
void main(){
  vec4 p=vec4(position,1.); vec3 n=normal;
  #ifdef USE_INSTANCING
  p=instanceMatrix*p; n=mat3(instanceMatrix)*n;
  #endif
  vL=p.xyz; vec4 w=modelMatrix*p; vW=w.xyz; vN=normalize(mat3(modelMatrix)*n);
  gl_Position=projectionMatrix*viewMatrix*w;
}`;
export const THERM_HEAD = NOISE + LAYOUT + PHYS_GLSL + THERMO + `
uniform float uTime, uAfter; uniform sampler2D tWinPic, tWinTh; uniform vec4 uLeakRect; uniform float uLeak;
varying vec3 vW; varying vec3 vN; varying vec3 vL;
vec3 NN(){ vec3 n=normalize(vN); return gl_FrontFacing? n : -n; }
vec3 VV(){ return normalize(cameraPosition-vW); }
`;

// Generic: T = base (+ after offset) + gradient + up to 6 gaussian hot spots + surface noise; emissivity eps.
export function TM(o = {}) {
  const hot = (o.hot || []).slice(0, 6); while (hot.length < 6) hot.push([0, 0, 0, 1, 0]);
  return new THREE.ShaderMaterial({
    vertexShader: THERM_VS, side: o.side ?? THREE.FrontSide,
    fragmentShader: THERM_HEAD + `
uniform float uBase, uBaseA, uEps, uNoise, uNs, uWorld, uTop, uTopA; uniform vec3 uGrad; uniform vec4 uHot[6]; uniform float uAmp[6];
void main(){
  vec3 P=mix(vL,vW,uWorld);
  float T=mix(uBase,uBaseA,uAfter)+dot(P,uGrad);
  for(int i=0;i<6;i++){ vec3 d=P-uHot[i].xyz; float r=uHot[i].w; T+=uAmp[i]*exp(-dot(d,d)/(r*r)); }
  vec3 N=NN();
  T+=mix(uTop,uTopA,uAfter)*smoothstep(.55,.9,N.y);
  T+=uNoise*(vn3(vW*uNs)-.5)+.4*uNoise*(vn3(vW*uNs*3.1)-.5);
  gl_FragColor=vec4(apparent(T,uEps,N,VV()),0.,0.,1.);
}`,
    uniforms: {
      ...U,
      uBase: { value: o.T ?? -6 }, uBaseA: { value: o.TA ?? o.T ?? -6 }, uEps: { value: o.eps ?? 0.93 },
      uNoise: { value: o.noise ?? 0.25 }, uNs: { value: o.ns ?? 3 }, uWorld: { value: o.world ? 1 : 0 },
      uTop: { value: o.top ?? 0 }, uTopA: { value: o.topA ?? o.top ?? 0 },
      uGrad: { value: new THREE.Vector3(...(o.grad || [0, 0, 0])) },
      uHot: { value: hot.map(h => new THREE.Vector4(h[0], h[1], h[2], h[3])) }, uAmp: { value: hot.map(h => h[4]) },
    },
  });
}
// custom thermal shader from a body `T=...; eps=...;` (vW, vL, N, V available); o.vhead/o.vbody/o.fhead add attributes and varyings
export function TMC(body, extraUniforms = {}, side = THREE.FrontSide, o = {}) {
  const vs = THERM_VS.replace('varying vec3 vW;', (o.vhead || '') + '\nvarying vec3 vW;').replace('vL=p.xyz;', 'vL=p.xyz;\n' + (o.vbody || ''));
  return new THREE.ShaderMaterial({
    vertexShader: vs, side,
    fragmentShader: THERM_HEAD + Object.keys(extraUniforms).map(k => extraUniforms[k].glsl.includes('[') ? `uniform ${extraUniforms[k].glsl};` : `uniform ${extraUniforms[k].glsl} ${k};`).join('\n') + '\n' + (o.fhead || '') + `
void main(){
  vec3 N=NN(); vec3 V=VV(); float T=-6.; float eps=.93;
  ${body}
  gl_FragColor=vec4(apparent(T,eps,N,V),0.,0.,1.);
}`,
    uniforms: { ...U, ...Object.fromEntries(Object.entries(extraUniforms).map(([k, v]) => [k, v.ref || { value: v.value }])) },
  });
}

// registry: every mesh carries a picture material and a thermal material
export const MESHES = [];
export function add(parent, geo, photo, therm, opt = {}) {
  const m = opt.instanced ? geo : new THREE.Mesh(geo, photo);
  if (opt.instanced) m.material = photo;
  m.userData.photo = photo; m.userData.therm = therm;
  m.castShadow = opt.cast ?? true; m.receiveShadow = opt.recv ?? true;
  if (opt.order !== undefined) m.renderOrder = opt.order;
  parent.add(m); MESHES.push(m); return m;
}
export function setPass(pass) {
  for (const m of MESHES) {
    const mat = pass === 'photo' ? m.userData.photo : m.userData.therm;
    m.visible = !!mat && m.userData.on !== false && (pass !== 'photo' || !m.userData.thermOnly) && (pass !== 'therm' || !m.userData.photoOnly);
    if (mat) m.material = mat;
  }
}
