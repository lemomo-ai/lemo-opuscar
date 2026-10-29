// 3D -> this frame's shapes: the scene is rendered to an image nobody sees (R = region id, G = light, B = depth),
// then every region's outline rings are traced from it. The lines and colouring on screen are drawn by crayon.js from those rings each frame; the 3D render itself never reaches the screen.
import * as THREE from 'three';

export const RW = 960, RH = 540, K = 2;   // the analysis image is half the film's size; ring coordinates times K go back to 1920x1080

const VS = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const FS = `uniform float uReg; uniform vec3 uL; varying vec3 vN;
void main(){ float d = max(dot(normalize(vN), uL), 0.); gl_FragColor = vec4(uReg / 255., .25 + .75 * d, gl_FragCoord.z, 1.); }`;
const LIGHT = new THREE.Vector3(-.45, .8, .55).normalize();

// One drawing recipe per region: col colour, p pressure, ang hatching angle, ow outline width (0 = no outline), grp layer group (bg / ch / fg), shade adds a pass on the dark side
export const REG = [null];
export function region(o) { REG.push({ ang: .6, p: .8, ow: 6, grp: 'bg', gap: 10, w: 11, over: 6, ...o, id: REG.length }); return REG.length - 1; }
export function mat(reg, side = THREE.FrontSide) { return new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, side, uniforms: { uReg: { value: reg }, uL: { value: LIGHT } } }); }
export const REGM = {};   // region -> its meshes (the first one anchors the hatching)
export function mesh(geo, reg, side) { const m = new THREE.Mesh(geo, mat(reg, side)); (REGM[reg] ||= []).push(m); return m; }

export function makeNPR() {
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(RW, RH, false); r.setClearColor(0x000000, 0);
  const rt = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const buf = new Uint8Array(RW * RH * 4);
  return { r, rt, buf };
}

// Render once; returns { id: Uint8Array(RW*RH) (flipped upright), sh: light }
export function snap(N, scene, camera) {
  N.r.setRenderTarget(N.rt); N.r.clear(); N.r.render(scene, camera);
  N.r.readRenderTargetPixels(N.rt, 0, 0, RW, RH, N.buf); N.r.setRenderTarget(null);
  const id = new Uint8Array(RW * RH), sh = new Uint8Array(RW * RH);
  for (let y = 0; y < RH; y++) { const sy = (RH - 1 - y) * RW, dy = y * RW; for (let x = 0; x < RW; x++) { const s = (sy + x) * 4; id[dy + x] = N.buf[s]; sh[dy + x] = N.buf[s + 1]; } }
  return { id, sh };
}

// Marching squares: mask(x, y) -> a set of closed rings (analysis-image coordinates)
function trace(mask, x0, y0, x1, y1) {
  const W = x1 - x0 + 2, H = y1 - y0 + 2;   // pad one ring of zeros around
  const at = (x, y) => (x < x0 || y < y0 || x > x1 || y > y1) ? 0 : mask(x, y);
  // edge midpoints: horizontal edges (x+.5, y), vertical edges (x, y+.5); keyed in doubled coordinates
  const key = (X, Y) => (X + 4) * 65536 + (Y + 4);   // the padding reaches -0.5: offset so the key never goes negative
  const adj = new Map();
  const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) {
    const a = at(x, y), b = at(x + 1, y), c = at(x + 1, y + 1), d = at(x, y + 1);
    const cs = a | b << 1 | c << 2 | d << 3; if (cs === 0 || cs === 15) continue;
    const T = key(2 * x + 1, 2 * y), R = key(2 * x + 2, 2 * y + 1), B = key(2 * x + 1, 2 * y + 2), L = key(2 * x, 2 * y + 1);
    switch (cs) {
      case 1: case 14: link(L, T); break;
      case 2: case 13: link(T, R); break;
      case 3: case 12: link(L, R); break;
      case 4: case 11: link(R, B); break;
      case 6: case 9: link(T, B); break;
      case 7: case 8: link(L, B); break;
      case 5: link(L, T); link(R, B); break;
      case 10: link(T, R); link(L, B); break;
    }
  }
  const seen = new Set(), loops = [];
  for (const [k0] of adj) {
    if (seen.has(k0)) continue;
    const loop = []; let prev = -1, cur = k0;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur); loop.push([((cur / 65536 | 0) - 4) / 2, (cur % 65536 - 4) / 2]);
      const nb = adj.get(cur); const nx = nb.find(n => n !== prev && !seen.has(n)); prev = cur; cur = nx;
    }
    if (loop.length > 6) loops.push(loop);
  }
  return loops;
}
function rdp(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    let dm = 0, im = -1; for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > dm) { dm = d; im = i; } }
    if (dm > eps) { keep[im] = 1; st.push([a, im], [im, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function chaikin(p, n = 2) { for (let k = 0; k < n; k++) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } p = q; } return p; }
// Cut long edges before smoothing: Chaikin cuts corners at 1/4 of each edge, so one edge as wide as the screen would lose a big piece
function dense(p, m) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / m); for (let k = 0; k < n; k++) q.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return q; }
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };

// Every region's rings + dark-side rings for one frame: { reg: { rings, dark, n, shade } }, in film coordinates
export function shapes(S, { minArea = 40, darkBelow = 120 } = {}) {
  const { id, sh } = S, box = new Map();
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const r = id[y * RW + x]; if (!r) continue;
    let b = box.get(r); if (!b) box.set(r, b = { x0: x, y0: y, x1: x, y1: y, n: 0, s: 0 });
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y; b.n++; b.s += sh[y * RW + x];
  }
  const out = {};
  // points on the frame edge are pushed outside it first, so the rounded corners land off screen and the colouring fills the corners
  const out_ = ([x, y]) => [x < .5 ? -14 : x > RW - 1.5 ? RW + 14 : x, y < .5 ? -14 : y > RH - 1.5 ? RH + 14 : y];
  const fix = loops => loops.map(l => chaikin(dense(rdp(l, .7).map(out_), 8))).filter(l => area(l) >= minArea).map(l => l.map(([x, y]) => [x * K, y * K]));
  for (const [r, b] of box) {
    const rings = fix(trace((x, y) => id[y * RW + x] === r ? 1 : 0, b.x0, b.y0, b.x1, b.y1));
    const dark = REG[r]?.shade ? fix(trace((x, y) => id[y * RW + x] === r && sh[y * RW + x] < darkBelow ? 1 : 0, b.x0, b.y0, b.x1, b.y1)) : [];
    out[r] = { rings, dark, n: b.n, shade: b.s / b.n / 255, box: b };
  }
  return out;
}

// Silhouette of a set of regions (for gl.knock: a child draws the front thing first and colours around it)
export function silhouette(S, regs, cv) {
  const g = cv.getContext('2d'); const im = g.createImageData(RW, RH);
  for (let i = 0; i < RW * RH; i++) if (regs.has(S.id[i])) im.data[i * 4 + 3] = 255;
  g.putImageData(im, 0, 0);
  return cv;
}
