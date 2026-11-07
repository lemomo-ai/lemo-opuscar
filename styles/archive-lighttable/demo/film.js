// 《差两秒》 Two Seconds Short — Archive Light Table demo. render(t) for the whole film.
// One continuous camera over one light table. World units = pixels of the first-flight plate scan
// (5000 px = 7 in); every item sits on the table with a centre, a rotation and a scale (texture px -> world).
// Picture: one WebGL2 fragment shader (table, glass negatives, backlit paper, the loupe, the photograph spaces);
// marks, readouts, subtitles and the index on a 2D canvas above it.
import { HIT, DUR } from './timeline.js';

const W = 1920, H = 1080;
const ORANGE = '#ff5a1f', INK = '#15171a', PAPER = 'rgba(246,246,242,0.96)';

// ---------------- helpers ----------------
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = x => x * x * (3 - 2 * x);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eo = x => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, x) => a + (b - a) * x;
const lerp2 = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x)];
function track(keys) {                              // monotone cubic (Fritsch–Carlson), [t, v]
  const n = keys.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  for (let i = 0; i < n; i++) m.push(i === 0 || i === n - 1 ? 0 : (d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (t > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], u = (t - keys[i][0]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h * m[i + 1];
  };
}
const track2 = keys => { const x = track(keys.map(k => [k[0], k[1][0]])), y = track(keys.map(k => [k[0], k[1][1]])); return t => [x(t), y(t)]; };
const rot = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] - s * v[1], s * v[0] + c * v[1]]; };

// ---------------- the table ----------------
// c: centre (world), r: rotation (deg), k: world units per texture px, size: texture px
const IT = {
  tg:   { c: [-4950, -1650], r: -3.5, k: 1.6207, size: [3517, 2273] },   // telegram, 1903-12-17
  news: { c: [-2250, 3350], r: 4.0, k: 2.943, size: [972, 1536] },       // Dayton Herald, 1903-12-18
  p1:   { c: [2500, 1802], r: 0, k: 1, size: [5000, 3604] },             // first flight
  p2:   { c: [7850, 2950], r: 2.5, k: 1, size: [5000, 3617] },           // fourth flight
  p3:   { c: [7200, -2150], r: -5, k: 2, size: [2500, 1818] },           // 14 December
};
const toW = (it, p) => { const o = rot([(p[0] - it.size[0] / 2) * it.k, (p[1] - it.size[1] / 2) * it.k], it.r * Math.PI / 180); return [it.c[0] + o[0], it.c[1] + o[1]]; };
const toT = (it, w) => { const o = rot([w[0] - it.c[0], w[1] - it.c[1]], -it.r * Math.PI / 180); return [o[0] / it.k + it.size[0] / 2, o[1] / it.k + it.size[1] / 2]; };

// telegram text lines (texture px, after the mat trim): [x0, y0, x1, y1]
const TG_DATE = [77, 1160, 1080, 1245], TG_SUCC = [87, 1685, 3070, 1770], TG_57L = [87, 1985, 2800, 2070];
const TG_57 = [1772, 2027];
const NEWS_LINE = [652, 1326, 935, 1341], NEWS_57 = [846, 1333];
// plate 1 (first flight): horizon, the Flyer's ground line, layer boxes (from tools/prep.py, layers.json)
const P1_HZ = 1540, NF = (1880 - 1540) / (3604 - 1540), NW = (1890 - 1540) / (3604 - 1540);
const FLY = [1560, 1100, 4120, 1800], WIL = [4260, 1440, 4540, 1915];
// plate 2 (fourth flight): horizon, machine, the camera position (the start)
const P2_HZ = 1385, P2_MACH = [1515, 1408], P2_START = [2520, 3617];
const P2_K = 852 * (1410 - P2_HZ);               // ground plane: distance (ft) = K / (row - horizon); machine = 852 ft

// lens positions (world)
const L1W = toW(IT.tg, [1500, 1880]);
const L2W = [2840, 1500];
const L3W = toW(IT.p2, [2250, 2150]);
const LENS_RW = 1000, MAG = 2.5;

// ---------------- camera ----------------
const NEWS_LW = toW(IT.news, [800, 1338]);
const MID23 = [5400, 2100];
const TABLE_C = [1200, 900];
const CAM = [
  // t, centre, zoom, rotation (deg)
  [0.0, [L1W[0] + 1400, L1W[1] + 900], 0.20, -1.5],
  [HIT.drop1, [L1W[0] + 160, L1W[1] + 120], 0.285, 2.6],
  [HIT.dive1, L1W, 0.31, 3.5],
  [HIT.dive1 + 1.333, L1W, 1.5, 3.5],
  [HIT.rise1, L1W, 1.5, 3.5],
  [HIT.lift1, [L1W[0] + 200, L1W[1] + 1500], 0.34, 1.0],
  [HIT.newsLine - 0.667, [NEWS_LW[0] - 150, NEWS_LW[1] - 240], 0.52, -3.0],
  [HIT.ring57 + 0.9, [NEWS_LW[0] + 40, NEWS_LW[1] - 120], 0.66, -4.0],
  [HIT.drop2, [L2W[0] - 80, L2W[1] + 90], 0.30, -1.6],
  [HIT.dive2, L2W, 0.335, -1.0],
  [HIT.enter, L2W, 1.45, 0],
  [HIT.rise2, L2W, 1.45, 0],
  [HIT.rise2 + 1.0, [MID23[0], MID23[1]], 0.33, 0.8],
  [HIT.drop3, [L3W[0] + 80, L3W[1] - 60], 0.30, -2.0],
  [HIT.dive3, L3W, 0.31, -2.5],
  [HIT.measure, L3W, 1.45, -2.5],
  [HIT.rise3, L3W, 1.45, -2.5],
  [HIT.rise3 + 1.0, [L3W[0] - 600, L3W[1] - 300], 0.30, -1.5],
  [HIT.endCard + 1.4, TABLE_C, 0.094, 0],
  [DUR, [TABLE_C[0] + 120, TABLE_C[1]], 0.0915, 0],
];
const camC = track2(CAM.map(k => [k[0], k[1]]));
const camLZ = track(CAM.map(k => [k[0], Math.log(k[2])]));
const camR = track(CAM.map(k => [k[0], k[3]]));
const camAt = t => ({ c: camC(t), z: Math.exp(camLZ(t)), th: camR(t) * Math.PI / 180 });
function w2s(w, cam) { const d = rot([(w[0] - cam.c[0]) * cam.z, (w[1] - cam.c[1]) * cam.z], cam.th); return [W / 2 + d[0], H / 2 + d[1]]; }

// ---------------- the three dives ----------------
// each dive: where the loupe sits, when it lands / lifts, and the inside of the lens (scale S in px per world unit,
// centre ic in world) as tracks that start and end at the physical loupe (S = zoom × 2.5, ic = loupe centre)
const phys = (t, lw) => ({ S: camAt(t).z * MAG, ic: lw });
function dive(lw, tDrop, tLift, keysS, keysC) {
  const s0 = phys(tDrop, lw), s1 = phys(tLift, lw);
  return { lw, tDrop, tLift, S: track([[tDrop, s0.S], ...keysS, [tLift, s1.S]]), C: track2([[tDrop, lw], ...keysC, [tLift, lw]]) };
}
const TG57W = toW(IT.tg, TG_57);
const TGMID = toW(IT.tg, [1560, 1880]);
const D1 = dive(L1W, HIT.drop1, HIT.lift1,
  [[HIT.dive1, 0.78], [HIT.dive1 + 1.333, 0.405], [HIT.line57 - 0.2, 0.43], [HIT.pull57 + 0.5, 0.80], [HIT.rise1, 0.82]],
  [[HIT.dive1, L1W], [HIT.dive1 + 1.333, TGMID], [HIT.line57 - 0.2, [TGMID[0] + 420, TGMID[1] + 60]], [HIT.pull57 + 0.5, [TG57W[0] + 330, TG57W[1] + 40]], [HIT.rise1, [TG57W[0] + 330, TG57W[1] + 40]]]);
const D2 = dive(L2W, HIT.drop2, HIT.rise2 + 1.0,
  [[HIT.dive2, 0.84], [HIT.enter, 0.56], [HIT.rise2, 0.60]],
  [[HIT.dive2, L2W], [HIT.enter, [2880, 1590]], [HIT.rise2, [3000, 1600]]]);
const P2C0 = toW(IT.p2, [2150, 1675]), P2C1 = toW(IT.p2, [1800, 1560]), P2C2 = toW(IT.p2, [1660, 1500]);
const D3 = dive(L3W, HIT.drop3, HIT.rise3 + 1.0,
  [[HIT.dive3, 0.80], [HIT.measure, 0.62], [HIT.land852, 1.0], [HIT.land59, 1.3], [HIT.rise3, 1.36]],
  [[HIT.dive3, L3W], [HIT.measure, P2C0], [HIT.land852, P2C1], [HIT.land59, P2C2], [HIT.rise3, P2C2]]);
const DIVES = [D1, D2, D3];

function shot(t) {
  const cam = camAt(t);
  let dv = null; for (const d of DIVES) if (t >= d.tDrop - 0.4 && t <= d.tLift + 0.4) dv = d;
  const st = { cam, t, on: 0, A: 0, lift: 1, ls: [0, 0], R: 0, S: 1, ic: [0, 0], k: 0.16, mode: 0, enter: 0, sh: [0, 0], dz: 0, fly: [0, 0], wil: [0, 0], dev: 0, dive: dv };
  if (dv) {
    const inn = seg(t, dv.tDrop - 0.4, dv.tDrop), out = seg(t, dv.tLift, dv.tLift + 0.4);
    st.on = 1; st.A = eo(inn) * (1 - ss(out)); st.lift = 1 + 0.35 * (1 - eo(inn)) + 0.35 * eo(out);
    st.ls = w2s(dv.lw, cam); st.R = LENS_RW * cam.z * st.lift;
    const tt = clamp(t, dv.tDrop, dv.tLift);
    st.S = dv.S(tt) * (t < dv.tDrop ? st.lift : 1); st.ic = dv.C(tt);
    if (t < dv.tDrop || t > dv.tLift) st.S = cam.z * MAG * st.lift;
  }
  // per dive
  if (dv === D1) { st.k = 0.16 * (1 - ss(seg(t, HIT.dive1 + 0.3, HIT.dive1 + 1.2))) + 0.16 * ss(seg(t, HIT.rise1 + 0.3, HIT.lift1)); }
  if (dv === D2) {
    st.mode = 1;
    st.k = 0.16 * (1 - ss(seg(t, HIT.dive2 + 0.4, HIT.enter - 0.1))) + 0.16 * ss(seg(t, HIT.rise2 + 0.4, HIT.rise2 + 1.0));
    st.enter = ss(seg(t, HIT.dive2 + 0.5, HIT.enter)) * (1 - ss(seg(t, HIT.rise2, HIT.rise2 + 0.9)));
    const p = ss(seg(t, HIT.dive2 + 0.6, HIT.rise2 + 0.4));
    st.sh = [260 * p, -140 * p]; st.dz = 0.55 * p;
    const f = eio(seg(t, HIT.dive2 + 0.8, HIT.rise2 + 0.6));
    st.fly = [125 * f, -26 * f]; st.wil = [10 * f, 0];
  }
  if (dv === D3) {
    st.mode = 2;
    st.k = 0.16 * (1 - ss(seg(t, HIT.dive3 + 0.3, HIT.measure - 0.1))) + 0.16 * ss(seg(t, HIT.rise3 + 0.4, HIT.rise3 + 1.0));
    st.enter = ss(seg(t, HIT.dive3 + 0.4, HIT.measure)) * (1 - ss(seg(t, HIT.rise3, HIT.rise3 + 0.9)));
    st.dz = 0.6 * ss(seg(t, HIT.measure, HIT.rise3));
  }
  st.dev = t < HIT.develop ? 0 : (t < HIT.develop + 0.85 ? 1.25 * eio(seg(t, HIT.develop, HIT.develop + 0.8)) : 1.3);
  return st;
}

// inside the lens: world point (with its nearness n for the photograph spaces) -> screen
function int2s(w, n, st, nf) {
  const dn = n - nf, sc = 1 + st.dz * st.enter * dn;
  const q = [((w[0] - st.ic[0]) * sc + st.sh[0] * st.enter * dn) * st.S, ((w[1] - st.ic[1]) * sc + st.sh[1] * st.enter * dn) * st.S];
  const r = rot(q, st.cam.th); return [st.ls[0] + r[0], st.ls[1] + r[1]];
}
const n1 = p => Math.max(0, (p[1] - P1_HZ) / (3604 - P1_HZ));
const n2tex = p => clamp((p[1] - P2_HZ) / (3617 - P2_HZ), 0, 1);

// ---------------- WebGL ----------------
const cv = document.getElementById('gl');
const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
const ov = document.getElementById('ov').getContext('2d');
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D tP1, tP1m, tP1b, tFly, tWil, tP2, tP2m, tP3, tP3m, tTg, tNews;
uniform vec4 uTg, uNews, uP2, uP3;         // centre.xy, rotation (rad), world per texel
uniform vec2 uCam; uniform float uZ, uRot, uT, uLight;
uniform vec2 uLensC; uniform float uLensR, uLensOn, uLensA, uLift;
uniform vec2 uIntC; uniform float uS, uK, uDev, uEnter, uDz, uMode;
uniform vec2 uSh, uFly, uWil;
uniform vec3 uTgLit; uniform float uTgDim, uNewsLit, uNewsDim, uSceneDim;
out vec4 o;
const float NF = ${NF.toFixed(5)}, NW = ${NW.toFixed(5)};
const vec4 FLY = vec4(${FLY.join('.,')}.), WIL = vec4(${WIL.join('.,')}.);
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }
vec4 tg(sampler2D t, vec2 uv, float fpx){ vec2 sz = vec2(textureSize(t, 0)); vec2 f = vec2(fpx)/sz; return textureGrad(t, uv, vec2(f.x, 0.), vec2(0., f.y)); }
// world -> item texture uv (and the texel footprint)
vec2 itemUV(vec4 it, sampler2D t, vec2 w){ vec2 sz = vec2(textureSize(t, 0)); return (rot(w - it.xy, -it.z)/it.w + sz*0.5)/sz; }
bool inside(vec2 uv){ return uv.x > 0. && uv.y > 0. && uv.x < 1. && uv.y < 1.; }
float band(vec2 px, vec4 b, float p, float fe){                 // a text line lit left to right up to progress p
  float ex = smoothstep(b.x - 30., b.x + 10., px.x) * (1. - smoothstep(mix(b.x, b.z, p) - 10., mix(b.x, b.z, p) + 40., px.x));
  float ey = smoothstep(b.y - fe, b.y + fe*0.33, px.y) * (1. - smoothstep(b.w - fe*0.33, b.w + fe, px.y));
  return ex * ey * step(0.001, p);
}
vec3 lightTable(vec2 w){
  // the panel: x -8500..10900, y -4500..6300; a brushed aluminium frame, then the dark desk
  vec2 lo = vec2(-8500., -4500.), hi = vec2(10900., 6300.);
  vec2 d = min(w - lo, hi - w); float e = min(d.x, d.y);
  vec2 cd = (w - vec2(1400., 900.)) / vec2(14000., 9500.);
  float L = (1. - 0.14*dot(cd, cd)) + (vn(w*0.015) - 0.5)*0.010 + (vn(w*0.0021) - 0.5)*0.012;
  vec3 lit = vec3(0.968, 0.976, 0.986)*L*uLight + vec3(0.035, 0.037, 0.04)*(1. - uLight);
  vec3 frame = vec3(0.33, 0.34, 0.35) + 0.05*vn(vec2(w.x*0.002, w.y*0.4)) - 0.14*smoothstep(0., 260., e + 260.);
  vec3 desk = vec3(0.055, 0.058, 0.062) + 0.012*vn(w*0.003);
  return e > 0. ? lit : (e > -260. ? frame : desk);
}
vec3 paper(vec3 L, vec3 tex, float lit, float dim){
  vec3 base = L * tex * 1.02 + vec3(0.02)*(1. - uLight);
  vec3 ink = L * pow(tex, vec3(1.6)) * 1.18;
  return mix(base * mix(1., 0.62, dim), ink, lit);
}
vec3 negative(vec3 L, float pos, float m, float dev, vec3 col, vec2 lv){
  float T = 0.035 + 0.90*pow(clamp(1. - pos, 0., 1.), 1.25);
  vec3 neg = L*T*vec3(0.98, 0.93, 0.84);
  float pc = clamp((pos - lv.x)/(lv.y - lv.x), 0., 1.); pc = pow(pc, 1.12); pc = pc*pc*(3. - 2.*pc)*0.6 + pc*0.4;
  vec3 posc = mix(vec3(0.045, 0.040, 0.036), vec3(0.99, 0.982, 0.962), pc) * (0.25 + 0.75*uLight);
  return mix(col, mix(neg, posc, dev), m);
}
float nP1(vec2 p){ return max(0., (p.y - ${P1_HZ}.) / ${3604 - P1_HZ}.); }
float nP2(vec2 w){ vec2 sz = vec2(textureSize(tP2, 0)); vec2 px = itemUV(uP2, tP2, w)*sz; return clamp((px.y - ${P2_HZ}.)/${3617 - P2_HZ}., 0., 1.); }
vec2 parallax(vec2 pf, float mode){                    // flat world point -> source world point (photograph space)
  vec2 d = pf - uIntC, p = pf;
  float nf = mode < 1.5 ? NF : 0.01;
  for (int i=0;i<4;i++){ float n = (mode < 1.5 ? nP1(p) : nP2(p)) - nf; p = uIntC + (d - uSh*uEnter*n) / (1. + uDz*uEnter*n); }
  return p;
}
float speck(vec2 p, float cell, float thr){
  vec2 g = floor(p/cell), f = p/cell - g;
  if (h21(g) < thr) return 0.;
  vec2 c = vec2(.2) + .6*vec2(h21(g+3.1), h21(g+7.7)); float r = .05 + .12*h21(g+1.3);
  return smoothstep(r, r*.35, length(f - c));
}
vec3 scene(vec2 w, bool interior, float dev, float fp){
  vec3 L = lightTable(w), col = L;
  // telegram
  vec2 u = itemUV(uTg, tTg, w);
  if (inside(u)){
    vec2 px = u*vec2(textureSize(tTg, 0));
    float lit = max(band(px, vec4(${TG_DATE.join('.,')}.), uTgLit.x, 18.), max(band(px, vec4(${TG_SUCC.join('.,')}.), uTgLit.y, 18.), band(px, vec4(${TG_57L.join('.,')}.), uTgLit.z, 18.)));
    col = paper(L, tg(tTg, u, fp/uTg.w).rgb, lit, uTgDim);
  }
  u = itemUV(uNews, tNews, w);
  if (inside(u)){
    vec2 px = u*vec2(textureSize(tNews, 0));
    float lit = band(px, vec4(${NEWS_LINE.join('.,')}.), uNewsLit, 4.);
    vec3 nt = tg(tNews, u, fp/uNews.w).rrr * vec3(1.0, 0.975, 0.93);
    col = paper(L, nt, lit, uNewsDim);
  }
  u = itemUV(uP3, tP3, w);
  if (inside(u)) col = negative(L, tg(tP3, u, fp/uP3.w).r, tg(tP3m, u, fp/uP3.w).r, interior ? dev : 0., col, vec2(0.03, 0.97));
  // fourth flight
  vec2 w2 = (interior && uMode > 1.5) ? parallax(w, 2.) : w;
  u = itemUV(uP2, tP2, w2);
  if (inside(u)) col = negative(L, tg(tP2, u, fp).r, tg(tP2m, u, fp).r, interior ? dev : 0., col, vec2(0.2, 0.84));
  // first flight (world == texture px): in its photograph space it is three layers
  vec2 uv1 = w / vec2(5000., 3604.);
  if (inside(uv1)){
    float m = tg(tP1m, uv1, fp).r, pos;
    if (interior && uMode > 0.5 && uMode < 1.5){
      vec2 pb = parallax(w, 1.);
      pos = tg(tP1b, pb / vec2(5000., 3604.), fp).r;
      vec2 d = w - uIntC;
      vec2 pfl = w - uFly;                               // the Flyer sits on the focus plane
      vec2 fu = (pfl - FLY.xy) / (FLY.zw - FLY.xy);
      if (inside(fu)){ vec2 la = tg(tFly, fu, fp).ra; pos = pos*(1. - la.y) + la.x; }
      vec2 pw = uIntC + (d - uSh*uEnter*(NW - NF)) / (1. + uDz*uEnter*(NW - NF)) - uWil;
      vec2 wu = (pw - WIL.xy) / (WIL.zw - WIL.xy);
      if (inside(wu)){ vec2 la = tg(tWil, wu, fp).ra; pos = pos*(1. - la.y) + la.x; }
      if (uEnter > 0.){                                  // wind over the sand
        float n = nP1(pb);
        float hz = vn(pb*vec2(0.0016, 0.006) + vec2(-uT*0.55, 0.)) * vn(pb*0.0007 + vec2(-uT*0.2, 3.));
        pos += uEnter*0.06*(hz - 0.25)*smoothstep(0., 0.08, n)*(1. - n);
      }
    } else pos = tg(tP1, uv1, fp).r;
    col = negative(L, pos, m, interior ? dev : 0., col, vec2(0.03, 0.97));
  }
  // dust on the glass and paper, fixed to the table
  float dd = speck(w, 70., 0.955)*0.5 + speck(w + 31., 19., 0.975)*0.35;
  col *= 1. - dd*(interior ? (1. - uEnter) : 0.8)*0.6;
  return col;
}
void main(){
  vec2 s = vec2(gl_FragCoord.x, 1080. - gl_FragCoord.y);
  vec2 w = uCam + rot(s - vec2(960., 540.), -uRot) / uZ;
  vec2 dl = s - uLensC; float r = length(dl), rho = r / max(uLensR, 1.);
  vec3 table = scene(w, false, 0., 1. / uZ);
  vec3 col = table;
  if (uLensOn > .5){
    // soft shadow of a lifted loupe (room light from above-left)
    vec2 sd = s - (uLensC + vec2(26., 34.)*(uLift - 1.)*uLensR/120.);
    float sr = length(sd)/uLensR;
    vec3 under = table * (1. - 0.22*(uLift - 1.)/0.35*uLensA*smoothstep(1.55, 1.05, sr));
    vec3 lc;
    if (rho < 1.0){
      float dev = uDev >= 1.25 ? 1. : 1. - smoothstep(uDev - 0.14, uDev, rho);
      vec3 c3;
      for (int i=0;i<3;i++){
        float k = uK*(1. + float(i-1)*0.10);
        vec2 q = dl / (1. + k*rho*rho) * (1. - float(i-1)*0.004*uK/0.16);
        vec2 wi = uIntC + rot(q, -uRot) / uS;
        c3[i] = scene(wi, true, dev, 1. / uS)[i];
      }
      lc = c3;
      float front = (uDev > 0.01 && uDev < 1.15) ? exp(-pow((rho - uDev)/0.022, 2.)) : 0.;
      lc += vec3(1.0, 0.62, 0.36)*0.22*front*smoothstep(0.05, 0.35, uDev);
      lc *= 1. - 0.30*smoothstep(0.78, 1.0, rho)*(1. - uEnter);
      vec2 hp = dl/uLensR - vec2(-0.38, -0.46); lc += vec3(0.06)*exp(-dot(hp,hp)*7.)*(1. - uEnter);
      vec2 hp2 = dl/uLensR - vec2(0.42, 0.50); lc += vec3(0.025)*exp(-dot(hp2,hp2)*14.)*(1. - uEnter);
      lc *= 1. - uSceneDim;
    } else if (rho < 1.065){
      float u = (rho - 1.0)/0.065; vec2 nd = dl / max(r, 1.);
      float lit = max(0., dot(nd, normalize(vec2(-0.55, -0.83))));
      float bev = exp(-pow((u - 0.18)/0.09, 2.))*0.9 + exp(-pow((u - 0.85)/0.07, 2.))*0.5;
      lc = vec3(0.040, 0.042, 0.046) + vec3(0.62, 0.64, 0.66)*pow(lit, 5.)*bev + 0.05*bev + vn(vec2(atan(dl.y, dl.x)*180., u*4.))*0.02;
    } else if (rho < 1.30){
      float u = (rho - 1.065)/0.235;
      vec2 s2 = uLensC + dl*(0.955 + 0.045*u);
      vec2 w2 = uCam + rot(s2 - vec2(960., 540.), -uRot) / uZ;
      lc = scene(w2, false, 0., 1. / uZ)*0.93 + 0.035*uLight;
      lc *= 1. - 0.45*exp(-pow(u/0.05, 2.));
      lc += vec3(0.20, 0.21, 0.22)*exp(-pow((u - 0.93)/0.035, 2.))*uLight;
      lc *= 1. - 0.25*exp(-pow((u - 1.0)/0.015, 2.));
    } else {
      lc = under * (1. - (0.07*exp(-pow((rho - 1.31)/0.05, 2.)) + 0.03*exp(-pow((rho - 1.3)/0.25, 2.)))*(2. - uLift));
    }
    col = mix(under, lc, uLensA);
  }
  vec2 sv = (s - vec2(960., 540.)) / vec2(1100., 760.);
  col *= 1. - 0.10*dot(sv, sv);
  float g = h21(s + fract(uT*24.*0.6180339)*vec2(311.7, 217.3)) - 0.5;
  col += g*(0.018 + 0.016*uEnter);
  o = vec4(clamp(col, 0., 1.), 1.);
}`;
function shd(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, shd(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shd(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const aLoc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
const U = n => gl.getUniformLocation(prog, n);
function tex(unit, src, mip = true) {
  const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (mip && ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  return t;
}
const img = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('missing ' + src)); i.src = src; });
const itU = it => [it.c[0], it.c[1], it.r * Math.PI / 180, it.k];

// ---------------- overlay ----------------
let TXT = [];                                       // text registry for readcheck (id, text, box)
function text(c, id, s, x, y, font, color, opt = {}) {
  c.font = font; c.fillStyle = color; c.textBaseline = opt.base || 'alphabetic'; c.textAlign = opt.align || 'left';
  c.fillText(s, x, y);
  if (id && c.globalAlpha * (opt.alpha ?? 1) > 0.6) {
    const m = c.measureText(s), wdt = m.width, x0 = opt.align === 'right' ? x - wdt : opt.align === 'center' ? x - wdt / 2 : x;
    const tf = c.getTransform(), p0 = tf.transformPoint({ x: x0, y: y - m.actualBoundingBoxAscent }), p1 = tf.transformPoint({ x: x0 + wdt, y: y + m.actualBoundingBoxDescent });
    TXT.push({ id, text: opt.full || s, pass: !!opt.pass, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) });
  }
  c.textAlign = 'left';
}
function wipe(c, x, y, w, h, k, right = false) { c.beginPath(); right ? c.rect(x + w * (1 - k), y, w * k, h) : c.rect(x, y, w * k, h); c.clip(); }
function ring(c, p, r, k, lw = 2.2, col = ORANGE) {
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(p[0], p[1], r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke();
}
function dot(c, p, r = 3, col = ORANGE) { c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], r, 0, Math.PI * 2); c.fill(); }
function plate(c, x, y, w, h, a = 0.9) { c.fillStyle = `rgba(14,15,17,${0.74 * a})`; c.beginPath(); c.roundRect(x, y, w, h, 3); c.fill(); }

let CUES = [];
const NOSUBS = /nosubs=1/.test(location.search);       // posters and stills without the caption strip
function subtitles(c, t) {
  if (NOSUBS) return;
  for (const q of CUES) {
    if (t < q.t0 || t >= q.t1) continue;
    const a = Math.min(seg(t, q.t0, q.t0 + 0.12), 1 - seg(t, q.t1 - 0.12, q.t1));
    c.save(); c.globalAlpha = a;
    c.font = '500 36px SC'; const wz = c.measureText(q.zh).width; c.font = '400 27px PS'; const we = c.measureText(q.en).width;
    const wm = Math.max(wz, we) + 56, x0 = (W - wm) / 2, y0 = 942;
    plate(c, x0, y0, wm, 104, 1);
    c.fillStyle = ORANGE; c.fillRect(x0, y0, 3, 104);
    text(c, null, q.zh, W / 2, y0 + 46, '500 36px SC', 'rgba(250,250,247,0.98)', { align: 'center' });
    text(c, null, q.en, W / 2, y0 + 86, '400 27px PS', 'rgba(232,232,228,0.92)', { align: 'center' });
    c.restore();
  }
}

// world-anchored item tags, revealed when the camera first meets the item and kept to the end
const TAGS = [
  { id: 'tag1', it: IT.tg, at: [0, -120], t0: 0.9, no: '01', zh: '电报', id2: 'LC-USZ62-65459' },
  { id: 'tag2', it: IT.news, at: [0, -60], t0: 11.0, no: '02', zh: '代顿先驱报', id2: 'LC-USZ62-70686' },
  { id: 'tag3', it: IT.p1, at: [0, -170], t0: 13.8, no: '03', zh: '第一次飞行', id2: 'LC-DIG-ppprs-00626' },
  { id: 'tag4', it: IT.p2, at: [0, -170], t0: 23.6, no: '04', zh: '第四次飞行', id2: 'LC-DIG-ppprs-00629' },
  { id: 'tag5', it: IT.p3, at: [0, -100], t0: 23.4, no: '05', zh: '12 月 14 日试飞', id2: 'LC-DIG-ppprs-00610' },
];
function tableTags(c, t, st) {
  const cam = st.cam;
  for (const g of TAGS) {
    const a = eo(seg(t, g.t0, g.t0 + 0.5)) * (1 - seg(t, HIT.index + 0.2, HIT.index + 0.7));
    if (a <= 0) continue;
    const p = w2s(toW(g.it, [0, 0]).map((v, i) => v + rot(g.at, g.it.r * Math.PI / 180)[i] * 1), cam);
    c.save(); c.translate(p[0], p[1]); c.rotate(cam.th + g.it.r * Math.PI / 180);
    const sc = clamp(cam.z / 0.3, 0.45, 1.6); c.scale(sc, sc); c.globalAlpha = a;
    text(c, null, g.no, 0, 0, '500 22px PM', ORANGE);
    text(c, null, g.zh, 40, 0, '500 21px SC', INK);
    text(c, null, g.id2, 40 + c.measureText(g.zh).width + 16, 0, '400 17px PM', 'rgba(21,23,26,0.7)');
    c.restore();
  }
}

function overlay(t, st) {
  const c = ov; TXT = [];
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  if (t < 0.5) { subtitles(c, t); return; }
  const cam = st.cam, lensClip = () => { if (st.on && st.A > 0.5) { c.beginPath(); c.rect(0, 0, W, H); c.arc(st.ls[0], st.ls[1], st.R * 1.31, 0, Math.PI * 2, true); c.clip('evenodd'); } };

  // ---- table layer (hidden under the loupe)
  c.save(); lensClip(); tableTags(c, t, st);
  // persistent marks left by each dive
  const ringW = (it, p, r, t0) => { const k = eo(seg(t, t0, t0 + 0.45)); if (k <= 0) return; const s = w2s(toW(it, p), cam); ring(c, s, r * cam.z * it.k, k, 2.2); };
  if (t > HIT.lift1 && t < HIT.index + 0.6) ringW(IT.tg, TG_57, 70, HIT.lift1);
  if (t > HIT.ring57 && t < HIT.index + 0.6) ringW(IT.news, NEWS_57, 13, HIT.ring57);
  // crop marks on plate 1 while the loupe lands: the frame the photograph will open to
  const cm = seg(t, HIT.drop2 - 0.5, HIT.drop2 + 0.2) * (1 - seg(t, HIT.dive2 + 0.2, HIT.dive2 + 0.7));
  if (cm > 0) {
    c.save(); c.translate(W / 2, H / 2); c.rotate(cam.th); c.scale(cam.z, cam.z); c.translate(-cam.c[0], -cam.c[1]);
    const cr = [1400, 700, 4600, 2500], Lc = 260 * eio(cm);
    c.strokeStyle = ORANGE; c.lineWidth = 2.6 / cam.z; c.globalAlpha = Math.min(1, cm * 1.5);
    for (const [x, y, sx, sy] of [[cr[0], cr[1], 1, 1], [cr[2], cr[1], -1, 1], [cr[0], cr[3], 1, -1], [cr[2], cr[3], -1, -1]]) { c.beginPath(); c.moveTo(x + sx * Lc, y); c.lineTo(x, y); c.lineTo(x, y + sy * Lc); c.stroke(); }
    c.restore();
  }
  // the newspaper line, underlined while it is read
  const nl = seg(t, HIT.newsLine, HIT.newsLine + 0.6) * (1 - seg(t, HIT.drop2 - 0.6, HIT.drop2));
  const na = seg(t, HIT.newsLine - 0.75, HIT.newsLine - 0.3) * (1 - seg(t, HIT.drop2 - 0.45, HIT.drop2 - 0.1));
  if (na > 0) {
    const p = [1450, 330];                            // a caption block, held still while the camera works the clipping
    c.save(); c.globalAlpha = na; wipe(c, p[0] - 4, p[1] - 70, 400, 110, eo(Math.min(1, na * 1.5)));
    plate(c, p[0] - 4, p[1] - 62, 220, 96);
    text(c, 'news-lbl', '1903.12.18', p[0] + 14, p[1] - 30, '500 22px PM', ORANGE);
    text(c, 'news-lbl2', '代顿先驱报', p[0] + 14, p[1] + 12, '500 24px SC', 'rgba(250,250,247,0.97)');
    c.restore();
  }
  if (nl > 0) {
    const a = w2s(toW(IT.news, [NEWS_LINE[0], NEWS_LINE[3] + 3]), cam), b2 = w2s(toW(IT.news, [lerp(NEWS_LINE[0], NEWS_LINE[2], eo(nl)), NEWS_LINE[3] + 3]), cam);
    c.strokeStyle = ORANGE; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
  }
  c.restore();

  // ---- loupe readout (screen space, beside the loupe)
  if (st.on && st.A > 0.3 && st.dive === D2) {
    const la = seg(t, HIT.drop2 + 0.05, HIT.drop2 + 0.4) * (1 - ss(seg(t, HIT.dive2 + 0.3, HIT.dive2 + 0.7)));
    if (la > 0) {
      const ang = -0.98, r0 = st.R * 1.34, r1 = r0 + 70;
      const a = [st.ls[0] + Math.cos(ang) * r0, st.ls[1] + Math.sin(ang) * r0], b2 = [st.ls[0] + Math.cos(ang) * r1, st.ls[1] + Math.sin(ang) * r1];
      c.save(); c.globalAlpha = la; c.strokeStyle = ORANGE; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(b2[0] + 46, b2[1]); c.stroke();
      text(c, null, '×2.5', b2[0] + 58, b2[1] + 10, '500 30px PM', ORANGE);
      const d1 = seg(t, HIT.develop, HIT.develop + 0.3);
      c.globalAlpha = la * (1 - d1); text(c, null, '负像', b2[0] + 58, b2[1] + 44, '400 22px SC', PAPER);
      c.globalAlpha = la * d1; text(c, null, '负像 → 正像', b2[0] + 58, b2[1] + 44, '400 22px SC', PAPER);
      c.restore();
    }
  }

  // ---- dive 1: the telegram, read line by line; 57 lifts out
  if (st.dive === D1 && t > HIT.dive1 + 1.0) {
    const lines = [[TG_DATE, HIT.lineDate], [TG_SUCC, HIT.lineSuccess], [TG_57L, HIT.line57]];
    const fade = 1 - seg(t, HIT.rise1 + 0.1, HIT.rise1 + 0.5);
    c.save(); c.globalAlpha = fade;
    for (const [bx, t0] of lines) {
      const k = tgSweep(t, t0); if (k <= 0) continue;
      const a = int2s(toW(IT.tg, [bx[0], bx[3] + 10]), 0, st, 0), b2 = int2s(toW(IT.tg, [lerp(bx[0], bx[2], k), bx[3] + 10]), 0, st, 0);
      c.strokeStyle = ORANGE; c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    }
    c.restore();
  }
  const r57 = seg(t, HIT.pull57, HIT.pull57 + 0.45);
  const out57 = seg(t, HIT.lift1 + 0.65, HIT.lift1 + 1.05);
  if (r57 > 0 && out57 < 1) {
    let p57 = st.dive === D1 && t < HIT.rise1 + 0.6 ? int2s(TG57W, 0, st, 0) : w2s(TG57W, st.cam);
    c.save(); c.globalAlpha = 1 - out57;
    const rr = st.dive === D1 && t < HIT.rise1 ? 70 * IT.tg.k * st.S : 70 * IT.tg.k * st.cam.z;
    c.save(); c.globalAlpha *= 1 - seg(t, HIT.rise1 + 0.2, HIT.rise1 + 0.6); ring(c, p57, Math.max(rr, 18), eo(r57), 3); c.restore();
    // the reading: screen-anchored card at the right, joined to the ring by a leader
    const cx = 1240, cy = 300, k = eo(seg(t, HIT.pull57 + 0.15, HIT.pull57 + 0.6));
    c.strokeStyle = ORANGE; c.lineWidth = 2; c.beginPath(); c.moveTo(p57[0] + rr * 0.72, p57[1] - rr * 0.72);
    c.lineTo(lerp(p57[0] + rr * 0.72, cx - 20, k), lerp(p57[1] - rr * 0.72, cy + 70, k)); c.stroke();
    if (k > 0.3) {
      c.save(); wipe(c, cx - 24, cy - 80, 600, 260, eo(seg(k, 0.3, 1)));
      plate(c, cx - 20, cy - 70, 460, 210);
      text(c, 'r57-a', '电报 · 最长一次', cx + 12, cy - 28, '500 26px SC', 'rgba(250,250,247,0.95)');
      text(c, 'r57-b', '57', cx + 8, cy + 98, '500 118px PM', ORANGE);
      text(c, 'r57-c', '秒', cx + 160, cy + 96, '500 44px SC', 'rgba(250,250,247,0.95)');
      text(c, 'r57-d', 'longest 57 seconds', cx + 222, cy + 92, '400 20px PM', 'rgba(250,250,247,0.7)');
      c.restore();
    }
    c.restore();
  }

  // ---- dive 2: inside the first flight
  if (st.dive === D2 && st.enter > 0.5) {
    const flyA = photoP1([2330 + st.fly[0], 1250 + st.fly[1]], NF, st);
    annot(c, t, HIT.flyTitle, 'fly', flyA, 140, 'left', [
      ['600 64px SS', INK, '第一次飞行'],
      ['400 25px SC', INK, '12 秒 · 120 英尺 · 上午 10:35'],
    ], HIT.rise2 + 0.35);
    const wil = photoP1([4392 + st.wil[0], 1478], NW, st);
    annot(c, t, HIT.flyTitle + 0.6, 'wil', wil, 110, 'right', [
      ['500 28px SC', INK, '威尔伯·莱特'],
      ['400 19px PM', 'rgba(21,23,26,0.75)', 'Wilbur Wright'],
    ], HIT.rise2 + 0.35);
    const ca = seg(t, HIT.flyTitle + 0.4, HIT.flyTitle + 0.9) * (1 - seg(t, HIT.rise2 + 0.1, HIT.rise2 + 0.5));
    if (ca > 0) {
      c.save(); c.globalAlpha = ca; wipe(c, 60, 840, 900, 60, eo(ca));
      text(c, 'credit', '快门：John T. Daniels', 64, 878, '400 22px SC', 'rgba(21,23,26,0.85)');
      text(c, 'credit-id', 'LC-DIG-ppprs-00626', 64 + 250, 878, '400 19px PM', 'rgba(21,23,26,0.6)');
      c.restore();
    }
  }

  // ---- dive 3: measuring the fourth flight
  if (st.dive === D3 && t > HIT.measure - 0.2) measure(c, t, st);
  if (t > HIT.compare - 0.1 && t < HIT.index + 0.5) compare(c, t);

  // ---- index and end card
  if (t > HIT.index - 0.1) indexPanel(c, t, st);
  if (t > HIT.endCard - 0.1) endCard(c, t);
  subtitles(c, t);
}
const tgSweep = (t, t0) => eio(seg(t, t0, t0 + 1.2));
function photoP1(p, n, st) { return int2s(p, n, st, NF); }
function annot(c, t, t0, id, a, rise, align, lines, tOut) {
  const k = seg(t, t0, t0 + 0.45), out = seg(t, tOut, tOut + 0.3); if (k <= 0 || out >= 1) return;
  c.save(); c.globalAlpha = 1 - out;
  const pr = 9 * eo(seg(t, t0, t0 + 0.25)); ring(c, a, pr, 1, 2); dot(c, a, 3);
  const b = [a[0], a[1] - rise], lk = eo(seg(t, t0 + 0.08, t0 + 0.4));
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0], a[1] - pr); c.lineTo(a[0], lerp(a[1] - pr, b[1], lk)); c.stroke();
  if (lk >= 1) { c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + (align === 'left' ? 34 : -34) * eo(seg(t, t0 + 0.4, t0 + 0.6)), b[1]); c.stroke(); }
  const tk = eo(seg(t, t0 + 0.35, t0 + 0.85));
  if (tk > 0) {
    let y = b[1] - 16; const blocks = [];
    for (let i = lines.length - 1; i >= 0; i--) { const [f, col, s] = lines[i]; c.font = f; const sz = parseFloat(f.split(' ')[1]); blocks.push([f, col, s, y, c.measureText(s).width]); y -= (i > 0 ? parseFloat(lines[i - 1][0].split(' ')[1]) : sz) * 1.05 + 10; }
    const top = y, wmax = Math.max(...blocks.map(q => q[4]));
    c.beginPath(); align === 'left' ? c.rect(b[0] - 4, top - 30, (wmax + 10) * tk, b[1] - top + 30) : c.rect(b[0] + 4 - (wmax + 10) * tk, top - 30, (wmax + 10) * tk, b[1] - top + 30); c.clip();
    blocks.forEach(([f, col, s, yy, ww], j) => text(c, `${id}${j}`, s, align === 'left' ? b[0] : b[0] - ww, yy, f, col, { alpha: tk >= 1 ? 1 - out : 0 }));
  }
  c.restore();
}

// the fourth flight: a ruler laid on the ground plane from the start (the camera) to the machine
function measure(c, t, st) {
  const p2w = p => toW(IT.p2, p);
  const sp = p => int2s(p2w(p), n2tex(p), st, 0.01);
  const yAt = D => P2_HZ + P2_K / D;                         // row of a ground point D feet from the camera
  const xAt = y => lerp(P2_START[0], P2_MACH[0], (P2_START[1] - y) / (P2_START[1] - P2_MACH[1]));
  const prog = eio(seg(t, HIT.measure, HIT.land852));
  const D0 = P2_K / (P2_START[1] - P2_HZ), Dt = D0 * Math.pow(852 / D0, prog);   // grows in log distance: steady on screen
  const fadeOut = 1 - seg(t, HIT.compare - 0.3, HIT.compare + 0.2) * 0.45 - seg(t, HIT.rise3, HIT.rise3 + 0.4) * 0.55;
  const panelA = 1 - seg(t, HIT.rise3, HIT.rise3 + 0.4);
  c.save(); c.globalAlpha = fadeOut;
  // the line
  const N = 60, pts = [];
  for (let i = 0; i <= N; i++) { const D = D0 * Math.pow(Dt / D0, i / N), y = yAt(D); pts.push(sp([xAt(y), y])); }
  c.strokeStyle = ORANGE; c.lineWidth = 3; c.setLineDash([]); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
  // ticks every 100 ft, labels at 100, 200, 400
  for (let D = 100; D <= 800; D += 100) {
    if (D > Dt) break;
    const y = yAt(D), x = xAt(y), p = sp([x, y]), q = sp([x + 9000 / D, y]);
    const len = Math.max(6, Math.hypot(q[0] - p[0], q[1] - p[1]));
    c.strokeStyle = ORANGE; c.lineWidth = 2; c.beginPath(); c.moveTo(p[0] - len, p[1]); c.lineTo(p[0] + len, p[1]); c.stroke();
    if (D === 100 || D === 200 || D === 400) text(c, null, `${D}`, p[0] + len + 8, p[1] + 6, '500 18px PM', INK);
  }
  // start
  const s0 = sp([xAt(P2_START[1] - 60), P2_START[1] - 60]);
  if (s0[1] < H - 120) { dot(c, s0, 5); text(c, null, '起点', s0[0] + 14, s0[1] + 8, '500 22px SC', INK); }
  // landing
  const land = seg(t, HIT.land852, HIT.land852 + 0.4);
  const mp = sp(P2_MACH);
  if (land > 0) {
    ring(c, mp, 26 + 6 * (1 - land), eo(land), 2.5);
    const b = [mp[0] - 10, mp[1] - 150];
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(mp[0], mp[1] - 30); c.lineTo(mp[0], lerp(mp[1] - 30, b[1], eo(land))); c.stroke();
    if (land >= 1) { c.save(); c.globalAlpha = panelA; text(c, 'land', '落地点', mp[0] + 12, b[1] + 6, '500 26px SC', INK); c.restore(); }
  }
  // readouts: distance and time, counting together (top-left, over the sky)
  const ra = seg(t, HIT.measure - 0.1, HIT.measure + 0.3);
  if (ra > 0) {
    const ft = Math.round(prog >= 1 ? 852 : Dt), sec = Math.min(59, Math.floor(59 * eio(seg(t, HIT.measure, HIT.land59))));
    c.globalAlpha = panelA * ra; c.translate(1330, 0);
    plate(c, 96, 96, 470, 196);
    text(c, 'm-a', '第四次飞行 · 1903.12.17', 124, 140, '500 24px SC', 'rgba(250,250,247,0.95)', { full: '第四次飞行 · 1903.12.17' });
    text(c, null, String(ft).padStart(3, ' '), 124, 232, '500 74px PM', ORANGE);
    text(c, 'm-b', '英尺', 270, 230, '500 30px SC', 'rgba(250,250,247,0.95)');
    text(c, null, String(sec).padStart(2, '0'), 362, 232, '500 74px PM', ORANGE);
    text(c, 'm-c', '秒', 452, 230, '500 30px SC', 'rgba(250,250,247,0.95)');
    text(c, 'm-d', '透视刻度（示意）', 124, 272, '400 18px SC', 'rgba(250,250,247,0.6)');
    if (prog >= 1 && panelA > 0.6) TXT.push({ id: 'm-ft', text: '852', x0: 1454, y0: 176, x1: 1590, y1: 236 });
    if (t >= HIT.land59 && panelA > 0.6) TXT.push({ id: 'm-s', text: '59', x0: 1692, y0: 176, x1: 1780, y1: 236 });
  }
  c.restore();
}

// the verdict: both readings fully in frame and still for 2.67 s, then 57 is struck
let TG_IMG = null;
function compare(c, t) {
  const a = eo(seg(t, HIT.compare - 0.1, HIT.compare + 0.4)) * (1 - seg(t, HIT.index + 0.18, HIT.index + 0.45));
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  const y0 = 520, cw = 520, ch = 330, x1 = 70, x2 = x1 + cw + 30;
  // left: the telegram (a real crop of the scan)
  plate(c, x1, y0, cw, ch, 1.15);
  text(c, 'c1a', '电报 · 1903.12.17', x1 + 28, y0 + 46, '500 26px SC', 'rgba(250,250,247,0.95)');
  if (TG_IMG) { c.drawImage(TG_IMG, 1380, 1975, 1000, 120, x1 + 28, y0 + 70, cw - 56, (cw - 56) * 0.12); }
  text(c, 'c1b', '57', x1 + 28, y0 + 262, '500 120px PM', 'rgba(250,250,247,0.97)');
  text(c, 'c1c', '秒', x1 + 190, y0 + 258, '500 44px SC', 'rgba(250,250,247,0.95)');
  text(c, 'c1d', 'LC-USZ62-65459', x1 + 28, y0 + 306, '400 18px PM', 'rgba(250,250,247,0.6)');
  // right: the plate record
  plate(c, x2, y0, cw, ch, 1.15);
  text(c, 'c2a', '底片档案 · 第四次飞行', x2 + 28, y0 + 46, '500 26px SC', 'rgba(250,250,247,0.95)');
  text(c, 'c2e', '"852 feet covered in 59 seconds."', x2 + 28, y0 + 104, '400 21px PM', 'rgba(250,250,247,0.85)');
  text(c, 'c2b', '59', x2 + 28, y0 + 262, '500 120px PM', ORANGE);
  text(c, 'c2c', '秒', x2 + 190, y0 + 258, '500 44px SC', 'rgba(250,250,247,0.95)');
  text(c, 'c2d', 'LC-DIG-ppprs-00629', x2 + 28, y0 + 306, '400 18px PM', 'rgba(250,250,247,0.6)');
  // verdict
  const v = seg(t, HIT.verdict, HIT.verdict + 0.35);
  if (v > 0) {
    c.strokeStyle = ORANGE; c.lineWidth = 7; c.beginPath(); c.moveTo(x1 + 20, y0 + 222); c.lineTo(x1 + 20 + 190 * eo(v), y0 + 222 - 40 * eo(v)); c.stroke();
    const v2 = seg(t, HIT.verdict + 0.25, HIT.verdict + 0.6);
    if (v2 > 0) {
      c.globalAlpha = a * v2;
      c.fillStyle = ORANGE; c.beginPath(); c.roundRect(x1 + 280, y0 + 190, 210, 76, 4); c.fill();
      text(c, 'verdict', '差 2 秒', x1 + 305, y0 + 244, '600 46px SC', '#16171a');
    }
  }
  c.restore();
}

// the index: every item's tag flies from the table into one list
const ROWS = [
  ['01', '电报', '1903.12.17', '57 秒', 'LC-USZ62-65459', IT.tg, true],
  ['02', '代顿先驱报', '1903.12.18', '57 秒', 'LC-USZ62-70686', IT.news, true],
  ['03', '第一次飞行', '1903.12.17', '12 秒 · 120 英尺', 'LC-DIG-ppprs-00626', IT.p1, false],
  ['04', '第四次飞行', '1903.12.17', '59 秒 · 852 英尺', 'LC-DIG-ppprs-00629', IT.p2, false],
  ['05', '试飞受损', '1903.12.14', '—', 'LC-DIG-ppprs-00610', IT.p3, false],
];
function indexPanel(c, t, st) {
  const x0 = 1180, y0 = 120, rw = 660, rh = 96;
  const pa = eo(seg(t, HIT.index, HIT.index + 0.5));
  c.save(); c.globalAlpha = pa;
  const arrived = ROWS.reduce((acc, r, i) => acc + eio(seg(t, HIT.index + 0.2 + i * 0.15, HIT.index + 0.65 + i * 0.15)), 0);
  plate(c, x0 - 28, y0 - 30, rw + 56, 80 + arrived * rh + 20 * Math.min(1, arrived), 1.2);
  text(c, 'ix-h', '档案索引', x0, y0 + 20, '600 30px SS', 'rgba(250,250,247,0.97)');
  text(c, 'ix-h2', 'ARCHIVE INDEX · 5', x0 + 150, y0 + 18, '500 18px PM', ORANGE);
  c.restore();
  ROWS.forEach((r, i) => {
    const t0 = HIT.index + 0.2 + i * 0.15, k = eio(seg(t, t0, t0 + 0.45)); if (k <= 0) return;
    const from = w2s(toW(r[5], [0, 0]), st.cam), to = [x0, y0 + 70 + i * rh];
    const p = lerp2(from, to, k);
    c.save(); c.globalAlpha = Math.min(1, k * 2);
    c.strokeStyle = 'rgba(250,250,247,0.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, to[1] - 24); c.lineTo(x0 + rw, to[1] - 24); c.stroke();
    const done = k >= 1 ? 1 : 0;
    text(c, done ? `ix${i}a` : null, r[0], p[0], p[1] + 14, '500 22px PM', ORANGE);
    text(c, done ? `ix${i}b` : null, r[1], p[0] + 46, p[1] + 14, '500 26px SC', 'rgba(250,250,247,0.97)');
    text(c, done ? `ix${i}c` : null, r[2], p[0] + 236, p[1] + 14, '400 20px PM', 'rgba(250,250,247,0.75)');
    text(c, done ? `ix${i}d` : null, r[3], p[0] + rw, p[1] + 14, '500 24px SC', r[6] ? 'rgba(250,250,247,0.55)' : ORANGE, { align: 'right' });
    text(c, done ? `ix${i}e` : null, r[4], p[0] + 46, p[1] + 46, '400 17px PM', 'rgba(250,250,247,0.5)');
    if (r[6] && done) { const sk = eo(seg(t, t0 + 0.6, t0 + 0.9)); c.strokeStyle = ORANGE; c.lineWidth = 3; c.beginPath(); c.moveTo(p[0] + rw - 78, p[1] + 6); c.lineTo(p[0] + rw - 78 + 80 * sk, p[1] + 6); c.stroke(); }
    c.restore();
  });
}
function endCard(c, t) {
  const k = eo(seg(t, HIT.endCard, HIT.endCard + 0.6)); if (k <= 0) return;
  const x = 96, y = 700;
  c.save(); c.globalAlpha = k; wipe(c, x - 10, y - 90, 900, 296, k);
  plate(c, x - 28, y - 86, 760, 272, 1.15);
  text(c, 'end-a', '差两秒', x, y, '600 76px SS', 'rgba(250,250,247,0.98)');
  text(c, 'end-b', 'Two Seconds Short', x + 262, y - 6, '400 34px PS', 'rgba(250,250,247,0.9)');
  c.fillStyle = ORANGE; c.fillRect(x, y + 28, 680, 2);
  text(c, 'end-c', 'ARCHIVE LIGHT TABLE', x, y + 72, '500 22px PM', 'rgba(250,250,247,0.85)');
  text(c, 'end-c2', '档案灯台', x + 290, y + 72, '500 22px SC', 'rgba(250,250,247,0.85)');
  text(c, 'end-d', 'LemoLab × Claude Opus 5.5', x, y + 116, '400 22px PS', 'rgba(250,250,247,0.75)');
  text(c, 'end-e', 'Piano samples: “Salamander Grand Piano V3” by Alexander Holm, CC BY 3.0', x, y + 154, '400 18px PS', 'rgba(250,250,247,0.62)', { pass: true });   // licence credit (fine print)
  c.restore();
}

// ---------------- page contract ----------------
const UNI = {};
function setU(st, t) {
  const cam = st.cam;
  gl.uniform2f(U('uCam'), ...cam.c); gl.uniform1f(U('uZ'), cam.z); gl.uniform1f(U('uRot'), cam.th); gl.uniform1f(U('uT'), t);
  const fl = t < 0.17 ? 0.0 : t < 0.3 ? 0.55 : t < 0.42 ? 0.08 : t < 0.55 ? 0.8 : t < HIT.lightOn ? 0.45 : 1.0;
  gl.uniform1f(U('uLight'), fl);
  gl.uniform2f(U('uLensC'), ...st.ls); gl.uniform1f(U('uLensR'), st.R); gl.uniform1f(U('uLensOn'), st.on); gl.uniform1f(U('uLensA'), st.A); gl.uniform1f(U('uLift'), st.lift);
  gl.uniform2f(U('uIntC'), ...st.ic); gl.uniform1f(U('uS'), st.S); gl.uniform1f(U('uK'), st.k); gl.uniform1f(U('uDev'), st.dev);
  gl.uniform1f(U('uEnter'), st.enter); gl.uniform1f(U('uDz'), st.dz); gl.uniform1f(U('uMode'), st.mode);
  gl.uniform2f(U('uSh'), ...st.sh); gl.uniform2f(U('uFly'), ...st.fly); gl.uniform2f(U('uWil'), ...st.wil);
  gl.uniform3f(U('uTgLit'), tgSweep(t, HIT.lineDate), tgSweep(t, HIT.lineSuccess), tgSweep(t, HIT.line57));
  gl.uniform1f(U('uTgDim'), ss(seg(t, HIT.dive1 + 0.6, HIT.dive1 + 1.3)) * (1 - ss(seg(t, HIT.lift1 + 0.2, HIT.lift1 + 1.0))));
  gl.uniform1f(U('uNewsLit'), eio(seg(t, HIT.newsLine, HIT.newsLine + 0.6)));
  gl.uniform1f(U('uNewsDim'), ss(seg(t, HIT.newsLine - 0.3, HIT.newsLine + 0.3)) * (1 - ss(seg(t, HIT.drop2 - 1.0, HIT.drop2 - 0.3))));
  gl.uniform1f(U('uSceneDim'), 0.35 * ss(seg(t, HIT.compare - 0.2, HIT.compare + 0.4)) * (1 - ss(seg(t, HIT.rise3, HIT.rise3 + 0.5))));
}
window.DUR = DUR;
window.render = t => {
  const st = shot(t);
  gl.viewport(0, 0, W, H); setU(st, t);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  overlay(t, st);
  gl.finish();
};
window.TEXTS = t => { window.render(t); return TXT; };
window.SHOT = t => { const s = shot(t); return { ls: s.ls, R: s.R, S: s.S, ic: s.ic, z: s.cam.z, c: s.cam.c, on: s.on, A: s.A }; };
async function load() {
  for (const f of ['400 20px SC', '500 20px SC', '600 20px SS', '400 20px PM', '500 20px PM', '400 20px PS', '500 20px PS']) await document.fonts.load(f);
  const names = ['p1', 'p1_mask', 'p1_bg', 'p1_fly', 'p1_wil', 'p2', 'p2_mask', 'p3', 'p3_mask', 'tg', 'news'];
  const files = { p1: 'p1.jpg', p1_mask: 'p1_mask.png', p1_bg: 'p1_bg.jpg', p1_fly: 'p1_fly.png', p1_wil: 'p1_wil.png', p2: 'p2.jpg', p2_mask: 'p2_mask.png', p3: 'p3.jpg', p3_mask: 'p3_mask.png', tg: 'tg.jpg', news: 'news.jpg' };
  const ims = await Promise.all(names.map(n => img('assets/tex/' + files[n])));
  const samp = ['tP1', 'tP1m', 'tP1b', 'tFly', 'tWil', 'tP2', 'tP2m', 'tP3', 'tP3m', 'tTg', 'tNews'];
  ims.forEach((im, i) => { tex(i, im); gl.uniform1i(U(samp[i]), i); });
  TG_IMG = ims[9];
  gl.uniform4f(U('uTg'), ...itU(IT.tg)); gl.uniform4f(U('uNews'), ...itU(IT.news)); gl.uniform4f(U('uP2'), ...itU(IT.p2)); gl.uniform4f(U('uP3'), ...itU(IT.p3));
  try { const r = await fetch('out/cues.json'); if (r.ok) CUES = await r.json(); } catch {}
  window.SUBCHECK_CUES = CUES;
}
load().then(() => { window.render(0); window.READY = true; });
