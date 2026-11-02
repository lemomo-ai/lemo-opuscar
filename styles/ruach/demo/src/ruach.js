// Ruach engine: flat angular planes in depth, each drawn twice (key A and key B), switched by a light front that
// spreads in screen space from the source; analytic glow, rays and haze. Units are metres, y up.
import * as THREE from 'three';
import { mulberry, TAU, clamp } from './lib.js';

export function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// Metric canvas, origin at the centre, y up. draw(x, P, k): P = palette (role → colour), k = pixels per metre
export function paint(w, h, draw, P, ppm) {
  const c = cv(w * ppm, h * ppm), x = c.getContext('2d');
  x.setTransform(ppm, 0, 0, -ppm, c.width / 2, c.height / 2);
  draw(x, P, ppm);
  x.setTransform(1, 0, 0, 1, 0, 0);
  mottle(c, ppm);
  return c;
}
// A very light flat-colour mottle on fills so large planes don't read as vector (only where there is paint)
const MOT = (() => {
  const n = 256, c = cv(n, n), x = c.getContext('2d'), R = mulberry(9), img = x.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const v = R() < .5 ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = R() * 9; }
  x.putImageData(img, 0, 0); return c;
})();
function mottle(c) { const x = c.getContext('2d'); x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = x.createPattern(MOT, 'repeat'); x.fillRect(0, 0, c.width, c.height); x.restore(); }

export function tex(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}

// —— Shapes: two flat faces, never a gradient ——
export function poly(x, pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); }
// Hairline highlight on the lit edge of a near shape
export function edge(x, pts, col, k, w = 1.5) { x.strokeStyle = col; x.lineWidth = w / k; x.lineJoin = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }

// A range: peaks [[x, y], …] over a base line. Each peak gets a lit face on the light side (dir = −1 light from the left,
// +1 from the right) split by a facet line from the summit to a foot point. Returns the outline.
export function range(x, o, P) {
  const { x0, x1, base, peaks, dir = 1 } = o, R = mulberry(o.seed || 1);
  const rg = [[x0, base], ...peaks, [x1, base]];
  poly(x, rg, P[o.shade]);
  // each summit lights the slope facing the light, down to the next valley, cut by a facet line from the summit to a foot point
  for (let i = 1; i < rg.length - 1; i++) {
    const [px, py] = rg[i]; if (!(py > rg[i - 1][1] && py > rg[i + 1][1])) continue;
    const s = dir, face = [[px, py]]; let j = i + s;
    while (j > 0 && j < rg.length - 1 && rg[j + s][1] < rg[j][1]) { face.push(rg[j]); j += s; }
    face.push(rg[j]);
    const fx = px - s * (py - base) * (.08 + R() * .2);
    face.push([rg[j][0], base], [fx, base]);
    poly(x, face, P[o.lit]);
    if (o.facets) poly(x, [[px, py], [px + s * (py - base) * .12, base + (py - base) * .35], [fx + s * (py - base) * .1, base], [fx, base]], P[o.lit2 || o.lit]);
  }
  return rg;
}
// A jagged ridge line: alternating summits and valleys with jitter. Returns [[x, y], …] for range()
export function ridge(x0, x1, o) {
  const R = mulberry(o.seed || 1), pts = []; let x = x0 + R() * o.step * .5, up = true;
  while (x < x1) { pts.push([x, up ? o.lo + (o.hi - o.lo) * (.35 + .65 * R()) : o.vlo + (o.vhi - o.vlo) * R()]); x += o.step * (.5 + R() * .8); up = !up; }
  return pts;
}
// Angular cloud bank: a row of flat lobes with a lit underside band
export function cloud(x, o, P) {
  const R = mulberry(o.seed || 3);
  for (let i = 0; i < o.n; i++) {
    const cx = o.x0 + (o.x1 - o.x0) * (i + R() * .6) / o.n, cy = o.y + (R() - .5) * o.dy, w = o.w * (.6 + R() * .7), h = o.h * (.5 + R() * .6);
    const top = [[cx - w, cy], [cx - w * .7, cy + h * .5], [cx - w * .25, cy + h * (.8 + R() * .3)], [cx + w * .2, cy + h * (.7 + R() * .4)], [cx + w * .65, cy + h * .45], [cx + w, cy]];
    poly(x, [...top, [cx + w * .8, cy - h * .25], [cx - w * .85, cy - h * .25]], P[o.shade]);
    poly(x, [[cx - w * .85, cy - h * .25], [cx + w * .8, cy - h * .25], [cx + w, cy], [cx - w, cy]], P[o.under]);
    poly(x, top.slice(0, 4).concat([[cx + w * .2, cy + h * .2], [cx - w * .6, cy + h * .1]]), P[o.lit]);
  }
}
// Tree: an angular canopy of lobes over a trunk, lit side toward the light
export function tree(x, o, P) {
  const { cx, by, h, dir = 1 } = o, R = mulberry(o.seed || 5), w = h * (o.wr || .55);
  poly(x, [[cx - h * .04, by], [cx - h * .02, by + h * .5], [cx + h * .02, by + h * .5], [cx + h * .04, by]], P[o.trunk]);
  for (let i = 0; i < (o.lobes || 7); i++) {
    const a = R() * TAU, r = w * (.35 + R() * .3), lx = cx + Math.cos(a) * w * .4, ly = by + h * .62 + Math.sin(a) * h * .18;
    const pts = []; for (let j = 0; j < 6; j++) { const t = j / 6 * TAU + R() * .4; pts.push([lx + Math.cos(t) * r, ly + Math.sin(t) * r * .7]); }
    poly(x, pts, P[o.shade]);
    poly(x, [pts[dir > 0 ? 0 : 3], pts[dir > 0 ? 1 : 4], pts[dir > 0 ? 2 : 5], [lx, ly]], P[o.lit]);
  }
}

// —— Light: one source, its screen position drives every plane ——
// L: shared uniforms. uO = source in screen uv, uR = light front radius (screen heights), uSoft = front softness,
// uLCol = light colour, uLR = glow radius, uRes = render target size
export function light(o = {}) {
  return {
    uO: { value: new THREE.Vector2(.7, .75) }, uR: { value: 0 }, uSoft: { value: o.soft ?? .18 },
    uLCol: { value: new THREE.Color(o.col || '#FFE7A3') }, uLR: { value: o.r ?? .35 }, uLk: { value: 0 },
    uRes: { value: new THREE.Vector2(1920, 1080) },
  };
}
const PLANE_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const PLANE_FS = `
  varying vec2 vUv; uniform sampler2D tA, tB; uniform vec2 uO, uRes; uniform float uR, uSoft, uSoftK, uLag, uLR, uLk, uGlow, uHaze, uFix;
  uniform vec3 uLCol, uHazeCol;
  void main(){
    vec4 a = texture2D(tA, vUv), b = texture2D(tB, vUv);
    vec2 p = gl_FragCoord.xy / uRes; vec2 d = p - uO; d.x *= uRes.x / uRes.y; float r = length(d);
    float f = uFix >= 0. ? uFix : 1. - smoothstep(uR - uLag - uSoft * uSoftK, uR - uLag, r);
    float al = mix(a.a, b.a, f); if (al < .01) discard;   // each key may have its own shapes (a burnt trunk, a green tree)
    vec3 c = mix(a.rgb * a.a, b.rgb * b.a, f) / al;
    c = mix(c, uHazeCol * mix(.55, 1., f), uHaze);   // atmospheric lift on far planes
    c += uLCol * (uGlow * uLk * f * exp(-r * r / (uLR * uLR)));
    gl_FragColor = vec4(c, al);
  }`;

// One plane. o: { w, h, z, x, y, ax, ay, draw, A, B (palettes), L, lag, glow, haze, hazeA, hazeB, ppm }
// The mesh origin is the anchor (ax, ay), which makes pivots easy for figures.
export function plane(o) {
  const ppm = Math.min(o.ppm || 200, 8000 / Math.max(o.w, o.h));   // GPU texture limit (8192 in headless Chrome)
  const ca = paint(o.w, o.h, o.draw, o.A, ppm), cb = o.B ? paint(o.w, o.h, o.draw, o.B, ppm) : ca;
  const U = {
    tA: { value: tex(ca) }, tB: { value: cb === ca ? null : tex(cb) }, uLag: { value: o.lag ?? 0 }, uSoftK: { value: o.softK ?? 1 }, uGlow: { value: o.glow ?? 0 },
    uHaze: { value: o.haze ?? 0 }, uHazeCol: { value: new THREE.Color(o.hazeCol || '#ffffff') }, uFix: { value: o.fix ?? -1 },
  };
  if (!U.tB.value) U.tB.value = U.tA.value;
  const m = new THREE.ShaderMaterial({ uniforms: { ...o.L, ...U }, vertexShader: PLANE_VS, fragmentShader: PLANE_FS, transparent: true, depthWrite: true });
  const geo = new THREE.PlaneGeometry(o.w, o.h); geo.translate(-(o.ax || 0), -(o.ay || 0), 0);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set((o.x || 0) + (o.ax || 0), (o.y || 0) + (o.ay || 0), o.z || 0);
  mesh.userData.U = U;
  return mesh;
}
// Pixels per metre for a plane at depth z so that it renders at ~1 texel per output pixel (with supersampling)
export function ppmAt(cam, z, H = 1080, ss = 2, k = 1) {
  const d = cam.position.z - z, vis = 2 * Math.tan(cam.fov * Math.PI / 360) * d;
  return Math.min(H * ss * k / vis, 1e5);
}
// Size of the view at depth z (metres), with a margin
export function viewAt(cam, z, m = 1.3) {
  const d = cam.position.z - z, h = 2 * Math.tan(cam.fov * Math.PI / 360) * d;
  return [h * cam.aspect * m, h * m];
}

// Analytic glow around the source (no texture square): additive, in screen space
export function glow(L, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { ...L, uK: { value: 0 }, uCore: { value: o.core ?? .025 }, uSpread: { value: o.spread ?? .22 } },
    transparent: true, depthWrite: false, depthTest: o.depthTest ?? true, blending: THREE.AdditiveBlending,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec2 uO, uRes; uniform vec3 uLCol; uniform float uK, uCore, uSpread;
      void main(){ vec2 d = gl_FragCoord.xy / uRes - uO; d.x *= uRes.x / uRes.y; float r = length(d);
        float a = 6. * smoothstep(uCore * 1.15, uCore * .85, r) + 1.2 * exp(-r * r / (uSpread * uSpread)) + .35 * exp(-r / (uSpread * 2.2));
        gl_FragColor = vec4(uLCol * a * uK, 1.); }`,
  }));
  m.renderOrder = 5; return m;
}
// Rays from the source: soft additive wedges whose set slowly turns; uK = strength, uSweep = angle offset
export function rays(L, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { ...L, uK: { value: 0 }, uSweep: { value: 0 }, uN: { value: o.n ?? 9 }, uLen: { value: o.len ?? 1.1 }, uSeed: { value: o.seed ?? 3 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec2 uO, uRes; uniform vec3 uLCol; uniform float uK, uSweep, uN, uLen, uSeed;
      float h(float n){ return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }
      void main(){ vec2 d = gl_FragCoord.xy / uRes - uO; d.x *= uRes.x / uRes.y; float r = length(d);
        float a = atan(d.y, d.x) + uSweep; float s = a / 6.2831853 * uN * 2.; float i = floor(s), f = fract(s);
        float on = step(.45, h(i)); float w = .18 + .3 * h(i + 7.);
        float wedge = on * smoothstep(0., w, f) * smoothstep(1., 1. - w, f) * (.5 + .5 * h(i + 3.));
        float fall = smoothstep(.02, .12, r) * exp(-r / uLen);
        gl_FragColor = vec4(uLCol * wedge * fall * uK * .55, 1.); }`,
  }));
  m.renderOrder = 4; return m;
}
// Fit a screen-space effect plane to the view at depth z
export function fitAt(mesh, cam, z) { const [w, h] = viewAt(cam, z, 1.6); mesh.scale.set(w / 2, h / 2, 1); mesh.position.set(cam.position.x, cam.position.y, z); }

// Project a world point to screen uv (0..1, y up)
export function toScreen(cam, p) { const v = new THREE.Vector3(...p).project(cam); return [(v.x + 1) / 2, (v.y + 1) / 2]; }

export function dispose(scene) {
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) { for (const u of Object.values(m.uniforms || {})) u.value?.isTexture && u.value.dispose(); m.dispose(); }
  });
}
export { clamp };
