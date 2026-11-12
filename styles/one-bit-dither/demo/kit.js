// Shared building blocks: grey materials, primitive helpers, printed-paper materials, canvas text, dithering.
import * as THREE from 'three';
import { L_FLAT, L_SCREEN } from './pipe.js';
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const grey = (v, o = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v), roughness: o.r ?? 0.9, metalness: o.m ?? 0, side: o.side ?? THREE.FrontSide, map: o.map || null, emissive: new THREE.Color(o.e ?? 0, o.e ?? 0, o.e ?? 0), flatShading: !!o.flat });
export const glow = v => new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v) });
export function add(parent, geo, mat, o = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true; if (o.flat) m.layers.set(L_FLAT); if (o.screen) m.layers.set(L_SCREEN); parent.add(m); return m; }
export function box(parent, w, h, d, x, y, z, mat, o) { const m = add(parent, new THREE.BoxGeometry(w, h, d), mat, o); m.position.set(x, y, z); return m; }
export function cyl(parent, r0, r1, h, x, y, z, mat, seg = 20, o) { const m = add(parent, new THREE.CylinderGeometry(r1, r0, h, seg), mat, o); m.position.set(x, y, z); return m; }
export function rod(parent, a, b, r, mat, seg = 8, o) {
  const d = new THREE.Vector3().subVectors(b, a); const L = d.length();
  const m = add(parent, new THREE.CylinderGeometry(r, r, L, seg), mat, o); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
export function canvasTex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  t.generateMipmaps = o.mip ?? true; t.minFilter = o.nearest ? THREE.NearestFilter : (t.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter);
  t.magFilter = o.nearest ? THREE.NearestFilter : THREE.LinearFilter; if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t;
}

// Printed paper: the map holds ink (0) and paper (1). When a texel covers more than ~2 screen pixels the bilinear
// value is thresholded, so magnified print reads as crisp dots and letters; when minified the mip-mapped tone passes
// through and the surface dither takes over (no moiré, no shimmer).
const SHARP = `
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  { vec2 fw = fwidth(vMapUv*uTS); float tp = max(max(fw.x, fw.y), 1e-4);
    float w = clamp(tp*0.55, 0.02, 0.5);
    float s = smoothstep(BIAS-w, BIAS+w, sampledDiffuseColor.r);
    float v = mix(s, sampledDiffuseColor.r, smoothstep(FADE0, FADE1, tp));
    PRINT_HOOK
    sampledDiffuseColor.rgb = vec3(v); }
  diffuseColor *= sampledDiffuseColor;`;
export function printMat(tex, o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: tex, color: new THREE.Color(o.c ?? 1, o.c ?? 1, o.c ?? 1), side: o.side ?? THREE.DoubleSide, emissive: new THREE.Color(o.e ?? 0, o.e ?? 0, o.e ?? 0) });
  const U = { uTS: { value: new THREE.Vector2(tex.image.width, tex.image.height) }, ...(o.uniforms || {}) };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = 'uniform vec2 uTS;\n' + (o.decl || '') + sh.fragmentShader.replace('#include <map_fragment>', SHARP.replace('PRINT_HOOK', o.hook || '').replaceAll('BIAS', (o.bias ?? 0.5).toFixed(3)).replace('FADE0', (o.text ? 1.6 : 0.45).toFixed(2)).replace('FADE1', (o.text ? 3.2 : 0.95).toFixed(2)));
  };
  m.customProgramCacheKey = () => 'print' + (o.key || '') + (o.bias ?? 0.5) + (o.text ? 't' : '');
  return m;
}
// Newspaper halftone: the map holds the continuous-tone photo; ink dots on a 45° screen, sized by tone. Large cells
// are drawn as hard dots, cells smaller than ~3 px fall back to the tone (the surface dither then takes over).
export function halftoneMat(tex, cells, o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: new THREE.Color(o.e ?? 0, o.e ?? 0, o.e ?? 0) });
  const asp = tex.image.width / tex.image.height;
  const U = { uCells: { value: cells }, uAsp: { value: asp } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = 'uniform float uCells, uAsp;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 P = vec2(vMapUv.x*uAsp, vMapUv.y)*uCells;          // uCells = screen cells per photo height
      mat2 R = mat2(0.7071,0.7071,-0.7071,0.7071);
      vec2 q = R*P; vec2 cell = floor(q)+0.5; vec2 f = q-cell;
      vec2 Pc = transpose(R)*cell/uCells;
      float toneC = texture2D(map, clamp(vec2(Pc.x/uAsp, Pc.y), 0., 1.)).r;
      float tone = texture2D(map, vMapUv).r;
      float r = sqrt(clamp(1.0-toneC, 0., 1.))*0.62;
      float d = length(f); float aa = max(fwidth(d), 1e-4);
      float hard = smoothstep(r-aa, r+aa, d);
      float cellPx = 1.0/max(max(fwidth(q.x), fwidth(q.y)), 1e-5);
      float v = mix(tone, hard, smoothstep(2.6, 4.2, cellPx));
      diffuseColor *= vec4(vec3(v), 1.0);`);
  };
  m.customProgramCacheKey = () => 'halftone';
  return m;
}

// ---------- canvas text ----------
export const FONTS = { serif: 'SerifSC', sans: 'SansSC', hand: 'HandSC', handEn: 'HandEn', type: 'TypeEn', news: 'NewsEn', anton: 'AntonEn' };
export function font(g, fam, size, weight = 400) { g.font = `${weight} ${size}px ${FONTS[fam] || fam}`; }
// Paper canvas with lines of text; returns {canvas, tex, lines:[{id,text,x0,y0,x1,y1}]} (rects in canvas px)
export function paperCanvas(w, h, draw, bg = '#fff') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.textBaseline = 'alphabetic';
  const lines = [];
  const put = (id, text, x, y, fam, size, o = {}) => {
    font(g, fam, size, o.weight ?? 400); g.fillStyle = o.color ?? '#000';
    if (o.fit) { const w0 = g.measureText(text).width; if (w0 > o.fit) { size = Math.floor(size * o.fit / w0); font(g, fam, size, o.weight ?? 400); } }
    const wd = g.measureText(text).width; const x0 = o.align === 'center' ? x - wd / 2 : o.align === 'right' ? x - wd : x;
    g.save(); if (o.stroke) { g.strokeStyle = o.color ?? '#000'; g.lineWidth = size * o.stroke; g.lineJoin = 'round'; }
    if (o.rot) { g.translate(x0, y); g.rotate(o.rot); g.fillText(text, 0, 0); if (o.stroke) g.strokeText(text, 0, 0); } else { g.fillText(text, x0, y); if (o.stroke) g.strokeText(text, x0, y); } g.restore();
    if (id) lines.push({ id, text, x0, y0: y - size * 0.92, x1: x0 + wd, y1: y + size * 0.22, size });
    return wd;
  };
  draw(g, put);
  return { canvas: c, g, lines };
}

// ---------- dithering for prints ----------
// Atkinson error diffusion: gray (0 ink .. 1 paper) Float32Array w*h → Uint8Array of 0/255
export function atkinson(gray, w, h) {
  const a = Float32Array.from(gray), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, o = a[i] < 0.5 ? 0 : 1, e = (a[i] - o) / 8; out[i] = o * 255;
    if (x + 1 < w) a[i + 1] += e; if (x + 2 < w) a[i + 2] += e;
    if (y + 1 < h) { if (x > 0) a[i + w - 1] += e; a[i + w] += e; if (x + 1 < w) a[i + w + 1] += e; }
    if (y + 2 < h) a[i + 2 * w] += e;
  }
  return out;
}
// resample a gray image (canvas) to w×h and return Float32 gray
export function grayOf(src, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, o = new Float32Array(w * h); for (let i = 0; i < w * h; i++) o[i] = d[i * 4] / 255; return o;
}
export function bitsCanvas(bits, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const id = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = bits[i]; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
// project a mesh-local rectangle (4 corners) to viewport pixels; returns box or null if behind camera
const _v = new THREE.Vector3();
export function screenBox(obj, corners, camera, W, H) {
  obj.updateWorldMatrix(true, false);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of corners) {
    _v.copy(p).applyMatrix4(obj.matrixWorld); const cz = _v.clone().applyMatrix4(camera.matrixWorldInverse).z; if (cz > -camera.near) return null;
    _v.project(camera); const x = (_v.x + 1) / 2 * W, y = (1 - _v.y) / 2 * H;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}
