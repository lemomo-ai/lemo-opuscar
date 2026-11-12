// X-ray engine: thickness accumulation (three.js) + dual-energy colouriser.
// Every mesh is drawn double-sided, additive, no depth: back faces add +distance, front faces -distance,
// times density, into one of three channels (R organic, G inorganic, B metal). The sum per pixel is the
// path length through each material class. The colouriser turns that into the dual-energy image.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eio = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const eo = k => 1 - Math.pow(1 - clamp(k), 3);
export const ei = k => { k = clamp(k); return k * k * k; };
export const ss = k => { k = clamp(k); return k * k * (3 - 2 * k); };
export const back = (k, s = 1.70158) => { k = clamp(k) - 1; return k * k * ((s + 1) * k + s) + 1; };

// material classes: [organic, inorganic, metal] weights. Mixtures land between the hues, as on a real machine.
export const ORG = [1, 0, 0], INO = [0, 1, 0], MET = [0, 0, 1];
export const ALU = [0, .62, .38];      // aluminium, Z = 13: green-blue
export const PVC = [.4, .6, 0];        // chlorine-bearing plastic: orange-green
export const GLASS = [.12, .88, 0];
export const CELL = [0, .3, .7];       // lithium cells: steel can, copper and aluminium foil
export const PCB = [.35, .45, .2];     // glass-fibre board with copper
export const SHELL = [.45, .55, 0];    // crab shell: chitin with calcium carbonate
export const EGG = [.2, .8, 0];        // egg shell: calcium carbonate

const xVS = `
varying vec3 vV;
void main(){
  vec4 p = vec4(position,1.0);
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  #endif
  vec4 v = viewMatrix * modelMatrix * p; vV = v.xyz;
  gl_Position = projectionMatrix * v;
}`;
const xFS = `
uniform vec3 uCls; uniform float uDen; uniform float uRef; uniform float uWeave; uniform float uLump; uniform vec3 uOrg; uniform float uScale;
varying vec3 vV;
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
void main(){
  float d = length(vV) - uRef;
  float s = gl_FrontFacing ? -1.0 : 1.0;
  vec2 q = (gl_FragCoord.xy - uOrg.xy) / uScale;        // millimetres on the object, anchored to it
  float m = 1.0;
  if(uWeave>0.0){
    vec2 r = mat2(0.866,0.5,-0.5,0.866)*q;
    float wv = 0.5+0.5*sin(r.x*2.4)*sin(r.y*2.4);
    float fib = n2(q*vec2(0.1,1.1)+uOrg.z)*0.6 + n2(q*0.06+uOrg.z)*0.6;
    m = mix(1.0, 0.55+0.6*wv*fib+0.25*fib, uWeave);
  }
  if(uLump>0.0){ m *= mix(1.0, 0.3+1.4*n2(q*0.025+uOrg.z)*n2(q*0.07+3.1+uOrg.z), uLump); }
  gl_FragColor = vec4(uCls * (s * d * uDen * m), 1.0);
}`;

// ---------- prop building ----------
export const ctx = { item: null, anchor: null };
export function item(name) { const g = new THREE.Group(); g.name = name; g.userData.mats = []; g.visible = false; ctx.item = g; ctx.anchor = g; return g; }
export function X(geo, cls, den, parent, o = {}) {
  const mt = new THREE.ShaderMaterial({
    vertexShader: xVS, fragmentShader: xFS, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    uniforms: { uCls: { value: new THREE.Vector3(...cls) }, uDen: { value: den }, uRef: { value: 0 }, uWeave: { value: o.weave || 0 }, uLump: { value: o.lump || 0 }, uOrg: { value: new THREE.Vector3(0, 0, o.seed || 0) }, uScale: { value: 1 } }
  });
  const rec = { m: mt, anchor: o.anchor || ctx.anchor || parent, den };
  (ctx.item ? ctx.item.userData.mats : []).push(rec);
  const mesh = geo.isInstancedMesh ? geo : new THREE.Mesh(geo, mt); if (geo.isInstancedMesh) geo.material = mt;
  mesh.frustumCulled = false; parent.add(mesh); mesh.userData.rec = rec; return mesh;
}
// hollow solid: outer minus inner (walls get their real thickness)
export function shell(geoOut, geoIn, cls, den, parent, o = {}) { return [X(geoOut, cls, den, parent, o), X(geoIn, cls, -den, parent, o)]; }
export function rbox(w, h, d, r, seg = 4) { return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)); }
export function boxShell(w, h, d, r, t, cls, den, parent, o = {}) {
  return shell(rbox(w, h, d, r), rbox(w - 2 * t, h - 2 * t, d - 2 * t, Math.max(0.0005, r - t)), cls, den, parent, o);
}
export function cylShell(r, len, t, cls, den, parent, seg = 40, o = {}) {
  return shell(new THREE.CylinderGeometry(r, r, len, seg), new THREE.CylinderGeometry(r - t, r - t, len - 2 * t, seg), cls, den, parent, o);
}
export function tube(points, r, cls, den, parent, seg = 200, closed = false, rs = 8, o = {}) {
  const c = new THREE.CatmullRomCurve3(points, closed);
  const geo = new THREE.TubeGeometry(c, seg, r, rs, closed);
  if (!closed) capTube(geo, seg, rs, c);   // an open tube is not a closed solid: its ends would read as holes
  return X(geo, cls, den, parent, o);
}
// close both ends of a TubeGeometry with fans whose faces point out along the curve
export function capTube(geo, seg, rs, curve) {
  const P = geo.attributes.position, n0 = P.count; const pos = Array.from(P.array); const idx = Array.from(geo.index.array);
  const ring = i => Array.from({ length: rs + 1 }, (_, j) => i * (rs + 1) + j);
  const v = k => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  [[0, curve.getTangentAt(0).negate()], [seg, curve.getTangentAt(1)]].forEach(([i, out], e) => {
    const R = ring(i); const cpos = R.slice(0, rs).reduce((a, k) => a.add(v(k)), new THREE.Vector3()).multiplyScalar(1 / rs);
    const ci = n0 + e; pos.push(cpos.x, cpos.y, cpos.z);
    for (let j = 0; j < rs; j++) {
      const a = R[j], b = R[j + 1]; const nrm = v(a).sub(cpos).cross(v(b).sub(cpos));
      if (nrm.dot(out) >= 0) idx.push(ci, a, b); else idx.push(ci, b, a);
    }
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.deleteAttribute('normal'); geo.deleteAttribute('uv'); geo.setIndex(idx);
}
export function lathe(prof, cls, den, parent, seg = 40, o = {}) { return X(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), seg), cls, den, parent, o); }
// a key / blade shape extruded flat (lying in xz)
export function flat(shape, th, cls, den, parent, o = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false, curveSegments: 16 }).rotateX(Math.PI / 2).translate(0, th, 0);
  return X(g, cls, den, parent, o);
}
export function instanced(geo, mats, cls, den, parent, o = {}) {
  const im = new THREE.InstancedMesh(geo, null, mats.length); mats.forEach((m, i) => im.setMatrixAt(i, m));
  return X(im, cls, den, parent, o);
}
export function spring(r, len, turns, wr, cls, den, parent) {
  const pts = []; const n = turns * 24; for (let i = 0; i <= n; i++) { const a = i / 24 * Math.PI * 2; pts.push(V(Math.cos(a) * r, -len / 2 + len * i / n, Math.sin(a) * r)); }
  return tube(pts, wr, cls, den, parent, n * 3, false, 5);
}

// ---------- renderer & views ----------
export function makeEngine(W, H) {
  const glc = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.autoClear = false;
  const floatBlend = renderer.extensions.has('EXT_float_blend');
  const TYPE = floatBlend ? THREE.FloatType : THREE.HalfFloatType;
  const scene = new THREE.Scene();

  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const colMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    uniforms: {
      tT: { value: null }, uUvS: { value: new THREE.Vector2(1, 1) }, uPx: { value: new THREE.Vector2() }, uSub: { value: new THREE.Vector4(0, 0, 1, 1) },
      uMode: { value: 0 }, uGain: { value: 1 }, uSplit: { value: 2 }, uStrip: { value: 0 }, uFront: { value: -1 }, uNoise: { value: 0 }, uTime: { value: 0 },
      uBelt: { value: 0 }, uBeltK: { value: 30 }, uDim: { value: 1 }, uSide: { value: 0 }, uGhost: { value: 1 }, uHot: { value: new THREE.Vector4(0, 0, 0, 0) }
    },
    fragmentShader: `
uniform sampler2D tT; uniform vec2 uUvS; uniform vec2 uPx; uniform vec4 uSub; uniform float uMode; uniform float uGain; uniform float uSplit; uniform float uStrip; uniform float uFront;
uniform float uNoise; uniform float uTime; uniform float uBelt; uniform float uBeltK; uniform float uDim; uniform float uSide; uniform float uGhost; uniform vec4 uHot;
varying vec2 vUv;
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec2 full(vec2 uv){ return vec2(uSub.x + uv.x*uSub.z, uSub.y + (1.0-uv.y)*uSub.w); }
float strip(vec2 uv){ return uStrip * (1.0 - smoothstep(uFront-0.025, uFront+0.025, full(uv).y)); }
vec2 att(vec2 uv){ vec3 t = max(texture2D(tT, uv*uUvS).rgb, 0.0);
  t.r *= 1.0 - 0.94*strip(uv);
  float AH = 11.0*t.r + 30.0*t.g + 150.0*t.b;
  float AL = 1.45*11.0*t.r + 2.2*30.0*t.g + 3.1*150.0*t.b;
  return vec2(AH, AL)*uGain; }
vec3 hue(float r){
  float k = clamp((r-1.45)/(3.1-1.45),0.,1.);
  vec3 o=vec3(1.0,0.52,0.1), gr=vec3(0.45,0.92,0.2), b=vec3(0.18,0.48,1.0);
  return k<0.42 ? mix(o,gr,smoothstep(0.02,0.42,k)) : mix(gr,b,smoothstep(0.45,0.82,k));
}
void main(){
  vec2 uv = vUv;
  if(uNoise>0.0){ float row = floor(uv.y*90.0); float j = (h2(vec2(row, floor(uTime*30.0)))-0.5)*0.08*uNoise*step(0.6,h2(vec2(row*1.7,floor(uTime*30.0)))); uv.x += j; }
  vec2 a = att(uv); float AH=a.x;
  float r = AH>1e-4 ? a.y/a.x : 1.45;
  float ex = att(uv+vec2(uPx.x,0)).x - att(uv-vec2(uPx.x,0)).x;
  float ey = att(uv+vec2(0,uPx.y)).x - att(uv-vec2(0,uPx.y)).x;
  float e = clamp(sqrt(ex*ex+ey*ey)*0.55, 0.0, 1.0);
  vec3 c = hue(r);
  vec2 F = full(uv);
  vec3 col;
  if(uMode<0.5){
    // screen image: navy belt; material occludes it; brightness rises with thickness, then falls to black
    float occ = 1.0-exp(-AH*3.5);
    float L = (1.0-exp(-AH*1.7)) * exp(-max(AH-1.3,0.0)*0.62);
    vec3 bg = vec3(0.030,0.058,0.100);
    float stripe = uSide>0.5 ? smoothstep(0.955,0.965,F.y)*(1.0-smoothstep(0.975,0.99,F.y)) : 0.5+0.5*sin((F.x+uBelt)*uBeltK*6.2832);
    bg += vec3(0.005,0.009,0.014)*stripe;
    if(uSide<0.5) bg *= 0.55 + 0.45*smoothstep(0.0,0.05,F.y)*smoothstep(1.0,0.95,F.y);
    vec3 img = bg*(1.0-occ) + c*L*0.92 + c*e*0.55*(0.35+0.65*occ);
    // not yet scanned: grey ghost
    float dx = F.x - uSplit;
    vec3 ghost = bg*(1.0-occ*0.35) + vec3(0.55,0.63,0.75)*((1.0-exp(-AH*1.4))*0.32 + e*0.6)*uGhost;
    col = dx > 0.0 ? ghost : img;
    float px = dx / (uPx.x*uSub.z);
    float on = step(-0.5, uSplit) * step(uSplit, 1.0);
    col += vec3(0.55,0.85,1.0) * (exp(-abs(px)/2.0)*1.1 + exp(-abs(px)/30.0)*0.18) * on;
    if(dx < 0.0) col += c * L * 0.7 * exp(dx / (uPx.x*uSub.z*70.0)) * on;   // fresh columns flare as they leave the curtain
    // operator highlight box: brighten inside, dim outside
    if(uHot.z>0.0){ float inside = step(uHot.x,F.x)*step(F.x,uHot.x+uHot.z)*step(uHot.y,F.y)*step(F.y,uHot.y+uHot.w); col *= mix(1.0, mix(0.55,1.12,inside), clamp(uHot.z*40.0,0.0,1.0)); }
    col += (h2(floor(F*vec2(1400.0,700.0)) + floor(uTime*30.0)*7.3)-0.5)*0.022;
  } else {
    // CT volume: glowing, additive over the dark reconstruction field
    float b = 1.0-exp(-AH);
    col = c*(0.08+1.0*pow(b,0.8))*step(0.004,AH) + c*e*0.8;
  }
  if(uNoise>0.0){ float n = h2(floor(uv*vec2(320.0,180.0)) + floor(uTime*30.0)*13.1); col = mix(col, vec3(0.35,0.5,0.8)*n*0.32, clamp(uNoise,0.0,1.0)*0.85); }
  gl_FragColor = vec4(max(col,0.0)*uDim, 1.0);
}`
  });
  const qScene = new THREE.Scene(); qScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), colMat));

  const _v = new THREE.Vector3();
  function makeView(fov, ss = 1.25) {
    const cam = new THREE.PerspectiveCamera(fov, 1, 0.01, 30);
    const rt = new THREE.WebGLRenderTarget(Math.ceil(W * ss), Math.ceil(H * ss), { type: TYPE, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    return { cam, look: V(0, 0, 0), up: V(0, 1, 0), fov, ss, rt, rtW: 1, rtH: 1, sr: [0, 0, 1, 1], vis: null };
  }
  // render the thickness pass of `items` for view v, whose full image occupies device rect sr = [x, y, w, h]
  function renderView(v, sr, items) {
    const [x, y, w, h] = sr;
    const vx0 = Math.max(0, Math.floor(x)), vy0 = Math.max(0, Math.floor(y)), vx1 = Math.min(W, Math.ceil(x + w)), vy1 = Math.min(H, Math.ceil(y + h));
    if (vx1 - vx0 < 2 || vy1 - vy0 < 2) { v.vis = null; return false; }
    v.sr = sr; v.vis = [vx0, vy0, vx1 - vx0, vy1 - vy0];
    const ssn = Math.min(v.ss, 1.6);
    v.rtW = Math.min(v.rt.width, Math.round(v.vis[2] * ssn)); v.rtH = Math.min(v.rt.height, Math.round(v.vis[3] * ssn));
    const c = v.cam; c.fov = v.fov; c.aspect = w / h; c.up.copy(v.up); c.position.copy(c.position); c.lookAt(v.look);
    c.setViewOffset(w, h, vx0 - x, vy0 - y, v.vis[2], v.vis[3]); c.updateProjectionMatrix(); c.updateMatrixWorld();
    const ref = c.position.distanceTo(v.look);
    const pxPerM = (v.rtH / v.vis[3]) * h / (2 * ref * Math.tan(c.fov * Math.PI / 360));
    scene.children.forEach(o => o.visible = false);
    for (const it of items) {
      it.visible = true; it.updateMatrixWorld(true);
      for (const { m, anchor } of it.userData.mats) {
        m.uniforms.uRef.value = ref; m.uniforms.uScale.value = pxPerM / 1000;
        anchor.getWorldPosition(_v); _v.project(c);
        m.uniforms.uOrg.value.x = (_v.x * 0.5 + 0.5) * v.rtW; m.uniforms.uOrg.value.y = (_v.y * 0.5 + 0.5) * v.rtH;
      }
    }
    v.rt.viewport.set(0, 0, v.rtW, v.rtH); v.rt.scissor.set(0, 0, v.rtW, v.rtH); v.rt.scissorTest = true; renderer.setRenderTarget(v.rt);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(scene, c);
    v.rt.scissorTest = false;
    return true;
  }
  function drawView(v, o = {}) {   // colourise v onto the default framebuffer at its visible device rect
    if (!v.vis) return;
    const u = colMat.uniforms;
    u.tT.value = v.rt.texture; u.uUvS.value.set(v.rtW / v.rt.width, v.rtH / v.rt.height); u.uPx.value.set(1 / v.rtW, 1 / v.rtH);
    const [x, y, w, h] = v.sr, [vx, vy, vw, vh] = v.vis;
    // vUv.y = 0 at the bottom of the visible rect; full-view coords have y = 0 at the top
    u.uSub.value.set((vx - x) / w, (vy - y) / h, vw / w, vh / h);
    u.uMode.value = o.mode || 0; u.uGain.value = o.gain || 1; u.uSplit.value = o.split ?? 2; u.uStrip.value = o.strip || 0; u.uFront.value = o.front ?? -1;
    u.uNoise.value = o.noise || 0; u.uBelt.value = o.belt || 0; u.uBeltK.value = o.beltK || 30; u.uDim.value = o.dim ?? 1; u.uSide.value = o.side ? 1 : 0; u.uGhost.value = o.ghost ?? 1;
    const hb = o.hot || [0, 0, 0, 0]; u.uHot.value.set(hb[0], hb[1], hb[2], hb[3]);
    colMat.blending = o.additive ? THREE.AdditiveBlending : THREE.NoBlending; colMat.needsUpdate = true;
    renderer.setRenderTarget(null);
    renderer.setViewport(vx, H - vy - vh, vw, vh);
    if (o.clipFrom != null) { const cx = Math.max(vx, Math.round(x + o.clipFrom * w)); if (cx >= vx + vw) { renderer.setViewport(0, 0, W, H); return; } renderer.setScissor(cx, H - vy - vh, vx + vw - cx, vh); renderer.setScissorTest(true); }
    renderer.render(qScene, quadCam);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
  }
  return { renderer, scene, glc, colMat, makeView, renderView, drawView, floatBlend };
}
