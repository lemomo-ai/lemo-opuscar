// Picture-pass helpers: patch MeshStandardMaterial with procedural albedo / roughness / bump / emissive, and snow on top faces.
import * as THREE from 'three';
import { NOISE, LAYOUT } from './glsl.js';
import { U } from './thermal.js';
import { mulberry } from './util.js';

let KEY = 0;
export const SNOW_GLSL = `
const vec3 SNOWC=vec3(.80,.85,.93);
// fraction of snow on a surface: up-facing, broken at the edges by noise
float snowMask(vec3 wp, vec3 wn, float thr, float cover){
  float up=smoothstep(thr,thr+.18,wn.y);
  float n=fbm2(wp.xz*5.3+wp.y*1.7);
  return up*smoothstep(.0,.25,cover+n-.55);
}`;
// o: {uniforms, head, albedo, rough, metal, bump, emis, vert}
export function patch(mat, o = {}) {
  const key = o.key || ('p' + (KEY++));
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, o.uniforms || {});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying vec3 vLP;\n' + (o.vhead || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vbegin || ''))
      .replace('#include <project_vertex>', `#include <project_vertex>
  { vec4 _wp=vec4(transformed,1.);
    #ifdef USE_INSTANCING
    _wp=instanceMatrix*_wp; vWN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);
    #else
    vWN=normalize(mat3(modelMatrix)*objectNormal);
    #endif
    vLP=transformed; _wp=modelMatrix*_wp; vWP=_wp.xyz; }
  ${o.vert || ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying vec3 vLP;\nuniform float uTime, uAfter; uniform sampler2D tWinPic, tWinTh; uniform vec3 uLamp[5];\n' + NOISE + LAYOUT + SNOW_GLSL + (o.head || '') + '\nfloat gHgt=0.; float gRough=-1.; float gMetal=-1.; vec3 gEmis=vec3(0.);\n')
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + (o.albedo || ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif(gRough>=0.) roughnessFactor=gRough;\n' + (o.rough || ''))
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nif(gMetal>=0.) metalnessFactor=gMetal;\n' + (o.metal || ''))
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + (o.bump ? `{
  float _h=gHgt*${o.bump};
  vec2 dH=vec2(dFdx(_h),dFdy(_h)); vec3 sp=-vViewPosition;
  vec3 sx=dFdx(sp), sy=dFdy(sp); vec3 R1=cross(sy,normal), R2=cross(normal,sx); float det=dot(sx,R1)*faceDirection;
  vec3 gr=sign(det)*(dH.x*R1+dH.y*R2); normal=normalize(abs(det)*normal-gr); }` : ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=gEmis;\n' + (o.emis || ''));
  };
  return mat;
}
// a standard material with snow on the top faces (cover 0..1, thr = min normal.y)
export function snowy(params, o = {}) {
  const m = o.physical ? new THREE.MeshPhysicalMaterial(params) : new THREE.MeshStandardMaterial(params);
  const thr = (o.thr ?? 0.55).toFixed(3), cover = (o.cover ?? 0.8).toFixed(3);
  return patch(m, {
    head: o.head || '',
    albedo: `${o.albedo || ''}
  { float sm=snowMask(vWP,vWN,${thr},${cover})${o.mask ? '*(' + o.mask + ')' : ''};
    diffuseColor.rgb=mix(diffuseColor.rgb,SNOWC*(.92+.16*vn2(vWP.xz*40.)),sm); gRough=mix(gRough<0.?roughness:gRough,.78,sm); gMetal=mix(gMetal<0.?metalness:gMetal,0.,sm); }`,
  });
}

// night environment for reflections: overcast sky lit orange by the city, dark street, lamp glows
export function nightEnv(renderer) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#05070d'); gr.addColorStop(0.55, '#0e1220'); gr.addColorStop(0.9, '#2b2228'); gr.addColorStop(1, '#3a2a24');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
  gr = g.createLinearGradient(0, 256, 0, 512); gr.addColorStop(0, '#1a1716'); gr.addColorStop(0.2, '#0c0c0e'); gr.addColorStop(1, '#060608');
  g.fillStyle = gr; g.fillRect(0, 256, 1024, 256);
  // distant lit windows on the horizon
  const r = (s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(7);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < .6 ? 'rgba(255,190,120,0.8)' : 'rgba(200,220,255,0.6)'; g.fillRect(r() * 1024, 236 + r() * 22, 2, 2); }
  for (let i = 0; i < 4; i++) { const x = 100 + i * 250, y = 160; const rg = g.createRadialGradient(x, y, 0, x, y, 40); rg.addColorStop(0, 'rgba(255,190,110,1)'); rg.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = rg; g.fillRect(x - 40, y - 40, 80, 80); }
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(t).texture; pm.dispose();
  return env;
}

// canvas text plate (house numbers, unit signs)
export function plateTex(lines, w, h, bg = '#1f4f9a', fg = '#f1f4f8', font = 'NotoSC') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = h * 0.05; g.strokeRect(h * 0.08, h * 0.08, w - h * 0.16, h - h * 0.16);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((L, i) => { g.font = `500 ${L.size}px ${font}`; g.fillText(L.text, w / 2, L.y); });
  // weathering
  const rr = mulberry(w * 7 + h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(30,20,10,${rr() * 0.06})`; g.fillRect(rr() * w, rr() * h, 3, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
