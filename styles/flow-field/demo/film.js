// 摩羯过琼州 · Typhoon Yagi over Qiongzhou — the 52 s narrated film. render(t) depends on t only.
// Film time t (52 s) plays the 49 s story clock ("old" time in the code: TAU_KEYS, SHOTS, story.js T) through M(t) from timeline.js.
import { makeStorm, setTerrain, buildTerrainGrid, toXY, toLL, wind } from './field.js';
import { makeChartGL } from './chartgl.js';
import { makeCam } from './camera.js';
import { drawWind, GRADES, gradeOf } from './wind.js';
import { TRACK } from './track.js';
import { makeOverlay, FONT, INK, VERM } from './overlay.js';
import { drawStory, prepStory, storyEvents, drawCaptions, drawSign } from './story.js';
import { TL } from './timeline.js';
import { SCS } from './scs.js';

const W = 1920, H = 1080, DUR = TL.dur, OLD_DUR = 49.0;
const Q = new URLSearchParams(location.search);
// a cut of the same timeline: ?from=a&to=b (the 10 s demo is from=0&to=10); ?sign=1 prints the sign-off in its last 2.5 s
const FROM = +(Q.get('from') || 0), TO = +(Q.get('to') || DUR), SIGN = Q.get('sign') === '1';
const NOCAP = Q.get('nocap') === '1';   // stills without captions (the poster)
window.DUR = TO - FROM;
const SS = (innerWidth || 1920) / 1920;
const cv = document.getElementById('c'); cv.width = Math.round(W * SS); cv.height = Math.round(H * SS);
const g = cv.getContext('2d');
const PI = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = x => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const storm = makeStorm(TRACK);
const XY = (lon, lat) => toXY(lon, lat);

// ---------------------------------------------------------------- story time τ (hours since 2024-09-01 00 UTC) against film time
// monotone cubic through keys, so the storm never jumps or runs backwards
const TAU_KEYS = [[0, 22], [4.5, 40], [8.6, 96], [14.0, 100], [18.4, 125.2], [26.0, 126.6], [29.2, 128.33], [33.6, 131.2], [36.0, 134.33], [39.6, 141], [41.4, 151.5], [43.2, 160], [45.4, 166], [49, 168]];
function monoKeys(K) {
  const n = K.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return t => {
    if (t <= K[0][0]) return K[0][1]; if (t >= K[n - 1][0]) return K[n - 1][1];
    let i = 0; while (t > K[i + 1][0]) i++;
    const h = K[i + 1][0] - K[i][0], u = (t - K[i][0]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * K[i][1] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * K[i + 1][1] + (u3 - u2) * h * m[i + 1];
  };
}
const tauOf = monoKeys(TAU_KEYS);
const M = monoKeys(TL.anchors);                       // film time -> old chart time
const MT = []; for (let k = 0; k <= DUR * 200; k++) MT.push(M(k / 200));
const Minv = o => { let i = 0; while (i < MT.length - 1 && MT[i + 1] < o) i++; const a = MT[i], b = MT[Math.min(MT.length - 1, i + 1)]; return (i + (b > a ? clamp((o - a) / (b - a), 0, 1) : 0)) / 200; };

// ---------------------------------------------------------------- camera: shots as functions, blended across the joins
const P = (lon, lat) => XY(lon, lat);
const SHOTS = [
  // 1 · calm sea, high oblique, looking east toward Luzon; slow push
  { t0: 0, t1: 5.2, f: t => { const u = ease(t / 4.9), a = P(116.2, 16.2), b = P(118.9, 17.0); return { tx: lerp(a[0], b[0], u), ty: lerp(a[1], b[1], u), dist: lerp(1500, 1050, u), tilt: lerp(56, 50, u), head: lerp(78, 72, u), fov: 34 }; } },
  // 2 · the storm forms: orbit round the eye, coming down
  { t0: 4.7, t1: 11.6, f: t => { const S = storm(tauOf(t)), u = ease((t - 4.5) / 7.1); return { tx: S.X, ty: S.Y, dist: lerp(820, 330, easeOut((t - 4.5) / 6)), tilt: lerp(48, 34, u), head: lerp(66, -48, u), fov: 34 }; } },
  // 3 · pull up to the region; the track draws in
  { t0: 11.2, t1: 18.6, f: t => { const S = storm(tauOf(t)), u = ease((t - 11.2) / 4.0), v = ease((t - 14) / 4.6), c = P(118.6, 16.4), e = P(113.2, 17.4);
      const cx = lerp(c[0], e[0], v), cy = lerp(c[1], e[1], v);
      return { tx: lerp(S.X, cx, u), ty: lerp(S.Y, cy, u), dist: lerp(330, lerp(3100, 2500, v), u), tilt: lerp(34, lerp(14, 10, v), u), head: lerp(-48, 0, u), fov: 34 }; } },
  // 4 · verdict: settle over Hainan, the grade table in frame, locked with a slow creep
  { t0: 18.2, t1: 26.2, f: t => { const u = ease((t - 18.2) / 1.6), a = P(113.2, 17.4), b = P(112.75, 18.35), cr = (t - 19.8) * 0.004;
      return { tx: lerp(a[0], b[0], u), ty: lerp(a[1], b[1], u), dist: lerp(2500, 1300, u) * (1 - cr), tilt: lerp(10, 4, u), head: 0, fov: 34 }; } },
  // 5 · landfall: down to the coast, low over the sea, looking south-west across the eye at Wenchang
  { t0: 25.8, t1: 33.8, f: t => { const S = storm(tauOf(t)), u = ease((t - 25.8) / 2.9), v = ease((t - 28.4) / 5.4), w = P(110.93, 19.97);
      const tx = lerp(S.X, w[0], 0.35), ty = lerp(S.Y, w[1], 0.35);
      const b0 = P(112.75, 18.35), d0 = 1300 * (1 - 6.0 * 0.004);
      return { tx: lerp(b0[0], tx, u), ty: lerp(b0[1], ty, u), dist: Math.exp(lerp(Math.log(d0), Math.log(175), u)) * (1 - 0.12 * v), tilt: lerp(4, 66, u), head: lerp(0, -118, u) - 34 * v, fov: 34 + 6 * u, lift: 6 * u }; } },
  // 6 · through the strait: top-down, following the eye west
  { t0: 33.4, t1: 39.8, f: t => { const S = storm(tauOf(t)), u = ease((t - 33.4) / 2.4); return { tx: S.X - 20, ty: S.Y + 10, dist: lerp(154, 560, u), tilt: lerp(66, 16, u), head: lerp(-152, -92 + (t - 35) * 2, u), fov: lerp(40, 34, u), lift: lerp(6, 0, u) }; } },
  // 7 · into the Gulf and ashore in Viet Nam: stay with the eye while it fills, north coming up
  { t0: 39.4, t1: 43.4, f: t => { const S = storm(tauOf(t)), u = ease((t - 39.4) / 3.6);
      return { tx: S.X - 20 + 30 * u, ty: S.Y + 10 - 40 * u, dist: lerp(560, 700, u), tilt: lerp(16, 12, u), head: lerp(-81, 0, u), fov: 34 }; } },
  // 8 · pull back to the whole track and hold for the end card
  { t0: 42.9, t1: 49.0, f: t => { const S = storm(tauOf(t)), u = ease((t - 42.9) / 2.4), c = P(115.6, 15.6);   // the South China Sea down to ~7°N clear of the captions; the 南海诸岛 inset (story.js) shows the rest
      return { tx: lerp(S.X + 10, c[0], u), ty: lerp(S.Y - 30, c[1], u), dist: Math.exp(lerp(Math.log(700), Math.log(3500), u)), tilt: lerp(12, 6, u), head: 0, fov: 34 }; } },
];
const BLEND = 0.35;
function camParams(t) {
  let A = null;
  for (let i = 0; i < SHOTS.length; i++) {
    const s = SHOTS[i]; if (t < s.t0 || t > s.t1) continue;
    const p = s.f(t); p.lift = p.lift || 0;
    if (!A) { A = p; continue; }
    // overlap window: blend from the earlier shot to the later one
    const k = sstep(s.t0, SHOTS[i - 1].t1, t);
    for (const key in p) A[key] = lerp(A[key], p[key], k);
  }
  return A || SHOTS[SHOTS.length - 1].f(t);
}
const camOld = t => makeCam(camParams(t), W, H);
const camAt = t => camOld(M(t));

// ---------------------------------------------------------------- flow clock Φ(t): strokes run ~95 px/s at 12 m/s on screen
const PHI = [], PHI_DT = 1 / 120;
function buildPhi() { let s = 0; for (let k = 0; k * PHI_DT <= DUR + 0.1; k++) { PHI.push(s); const t = (k + 0.5) * PHI_DT, c = camAt(Math.min(t, DUR)); s += PHI_DT * 95 / (c.ppkRef * 12); } }
const phiAt = t => { const f = clamp(t, 0, DUR) / PHI_DT, i = Math.floor(f); return lerp(PHI[i], PHI[Math.min(PHI.length - 1, i + 1)], f - i); };

// ---------------------------------------------------------------- chart vectors
let CH = null, GLC = null, FIBRE = null;
const OV = makeOverlay(g, SS);
const CTX = { g, OV, W, H, SS, DUR: OLD_DUR, storm, tauOf, camAt: camOld, TRACK };          // story.js works in old time
const CTXN = { g, OV, W, H, SS, DUR, storm, tauOf: t => tauOf(M(t)), camAt, TRACK };      // film time, for the wind sound
window.TEXTS = () => OV.REG.slice();
function polyXY(arr) { const o = new Float32Array(arr.length); for (let i = 0; i < arr.length; i += 2) { const p = toXY(arr[i], arr[i + 1]); o[i] = p[0]; o[i + 1] = p[1]; } return o; }
function prepChart(chart) {
  const box = chart.coastHiBox, inBox = (lo, la, m) => lo > box[0] + m && lo < box[2] - m && la > box[1] + m && la < box[3] - m;
  const coast = [];
  for (const L of chart.coast) {       // the 2' coast, broken inside the 1' box
    let cur = [];
    for (let i = 0; i < L.length; i += 2) { if (inBox(L[i], L[i + 1], 0.02)) { if (cur.length > 2) coast.push(cur); cur = []; } else cur.push(L[i], L[i + 1]); }
    if (cur.length > 2) coast.push(cur);
  }
  for (const L of chart.coastHi) {
    let cur = [];
    for (let i = 0; i < L.length; i += 2) { if (!inBox(L[i], L[i + 1], 0.0)) { if (cur.length > 2) coast.push(cur); cur = []; } else cur.push(L[i], L[i + 1]); }
    if (cur.length > 2) coast.push(cur);
  }
  const depth = {}; for (const k in chart.depth) depth[k] = chart.depth[k].map(polyXY);
  const relief = {}; for (const k in chart.relief) relief[k] = chart.relief[k].map(polyXY);
  return { coast: coast.map(polyXY), depth, relief, dashes: SCS.dashes.map(L => polyXY(L.flat())), rings: SCS.rings.map(L => polyXY([...L, L[0]].flat())), islands: SCS.islands.map(([lo, la, k]) => [...toXY(lo, la), k]) };
}
function strokePoly(cam, pts, z = 0, close = false) {
  let pen = false;
  for (let i = 0; i < pts.length; i += 2) {
    const p = cam.project(pts[i], pts[i + 1], z);
    if (!p) { pen = false; continue; }
    if (!pen) { g.moveTo(p[0], p[1]); pen = true; } else g.lineTo(p[0], p[1]);
  }
}
function drawChartVectors(t, cam) {
  const ppk = cam.ppkRef;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  // graticule: 1° (fine) and 5° (heavier)
  const fp = cam.footprint(), [lo0, la0] = toLL(fp.x0, fp.y0), [lo1, la1] = toLL(fp.x1, fp.y1);
  const step = ppk * 111 < 60 ? 5 : 1;
  for (let lo = Math.ceil(lo0 / step) * step; lo <= lo1; lo += step) {
    g.beginPath(); const a = toXY(lo, Math.max(la0, 2)), b = toXY(lo, Math.min(la1, 30)); const pts = []; for (let k = 0; k <= 40; k++) pts.push(lerp(a[0], b[0], k / 40), lerp(a[1], b[1], k / 40));
    strokePoly(cam, pts); g.strokeStyle = lo % 5 === 0 ? 'rgba(70,64,58,0.30)' : 'rgba(70,64,58,0.16)'; g.lineWidth = lo % 5 === 0 ? 1.1 : 0.8; g.stroke();
  }
  for (let la = Math.ceil(la0 / step) * step; la <= la1; la += step) {
    g.beginPath(); const a = toXY(Math.max(lo0, 98), la), b = toXY(Math.min(lo1, 135), la); const pts = []; for (let k = 0; k <= 40; k++) pts.push(lerp(a[0], b[0], k / 40), lerp(a[1], b[1], k / 40));
    strokePoly(cam, pts); g.strokeStyle = la % 5 === 0 ? 'rgba(70,64,58,0.30)' : 'rgba(70,64,58,0.16)'; g.lineWidth = la % 5 === 0 ? 1.1 : 0.8; g.stroke();
  }
  // depth contours: fine dotted
  g.setLineDash([1.2, 3.2]);
  for (const k of ['-200', '-1000', '-2000', '-4000']) {
    g.beginPath(); for (const L of CH.depth[k]) strokePoly(cam, L);
    g.strokeStyle = 'rgba(64,84,92,0.34)'; g.lineWidth = 0.9; g.stroke();
  }
  g.setLineDash([]);
  // land relief (Hainan, 1' grid)
  for (const k of ['250', '600', '1000']) {
    g.beginPath(); for (const L of CH.relief[k]) strokePoly(cam, L);
    g.strokeStyle = 'rgba(92,66,44,0.32)'; g.lineWidth = 0.8; g.stroke();
  }
  // coast: a double line, as engraved charts print it
  g.beginPath(); for (const L of CH.coast) strokePoly(cam, L);
  g.strokeStyle = 'rgba(52,62,70,0.22)'; g.lineWidth = 5.0; g.stroke();
  g.strokeStyle = 'rgba(32,30,30,0.86)'; g.lineWidth = clamp(1.0 + ppk * 0.6, 1.1, 2.2); g.stroke();
  // South China Sea islands and reefs, the Diaoyu Islands, and the dashed line (scs.js; sources in tools/make_scs.py)
  g.lineCap = 'butt';
  g.beginPath(); for (const L of CH.dashes) strokePoly(cam, L);
  g.strokeStyle = 'rgba(52,62,70,0.22)'; g.lineWidth = 5.0; g.stroke();
  g.strokeStyle = 'rgba(32,30,30,0.88)'; g.lineWidth = clamp(2.0 + ppk * 0.6, 2.2, 3.0); g.stroke();
  g.lineCap = 'round';
  for (const R of CH.rings) {
    const c = cam.project(R[0], R[1], 0); if (!c) continue;
    const big = cam.ppkAt(R[0], R[1]) * 14 > 9;          // a reef ring when it is big enough to read, else a small dotted circle
    g.beginPath(); if (big) strokePoly(cam, R); else g.arc(c[0], c[1], 3.2, 0, PI * 2);
    g.setLineDash([1.6, 1.8]); g.strokeStyle = 'rgba(32,30,30,0.85)'; g.lineWidth = 1.2; g.stroke(); g.setLineDash([]);
  }
  g.restore();
}

function buildFibre() {
  FIBRE = document.createElement('canvas'); FIBRE.width = W; FIBRE.height = H;
  const fg = FIBRE.getContext('2d'), im = fg.createImageData(W, H), d = im.data, r = mulberry(3);
  const NN = 256, NT = new Float32Array(NN * NN); for (let i = 0; i < NT.length; i++) NT[i] = r();
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = NT[(yi & 255) * NN + (xi & 255)], b = NT[(yi & 255) * NN + ((xi + 1) & 255)], c = NT[((yi + 1) & 255) * NN + (xi & 255)], e = NT[((yi + 1) & 255) * NN + ((xi + 1) & 255)], u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, n = (vn(x * 0.012, y * 0.012) - 0.5) * 18 + (vn(x * 0.35, y * 0.05) - 0.5) * 12 + (r() - 0.5) * 12;
    d[i] = d[i + 1] = d[i + 2] = clamp(128 + n, 0, 255); d[i + 3] = 255;
  }
  fg.putImageData(im, 0, 0);
}

// ---------------------------------------------------------------- frame
window.render = function (tc) {
  const t = clamp(tc + FROM, 0, DUR), to = M(t);
  const cam = camAt(t), τ = tauOf(to), S = storm(τ);
  g.setTransform(SS, 0, 0, SS, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  GLC.draw(cam, {});
  g.drawImage(GLC.canvas, 0, 0, W, H);
  drawChartVectors(t, cam);
  drawWind(g, cam, S, { Phi: phiAt(t), lift: cam.lift, spc: 36, HL: 4, aBase: 0.62, aDash: 1.0, wBase: 1.0, wDash: 2.2, ppkRef: cam.ppkRef, bright: 1 });
  // far haze: the ground fades into paper toward the horizon on low cameras
  { const y0 = cam.rowAt(cam.dist * 2.0), y1 = cam.rowAt(cam.dist * 3.6);
    if (y1 > 1) { const hz = g.createLinearGradient(0, Math.min(y1, y0 - 1), 0, y0); hz.addColorStop(0, 'rgba(236,224,196,1)'); hz.addColorStop(1, 'rgba(236,224,196,0)');
      g.fillStyle = hz; g.fillRect(0, 0, W, y0); g.fillStyle = 'rgb(236,224,196)'; g.fillRect(0, 0, W, Math.min(y1, y0 - 1)); } }
  // islands and reefs above the lines (a paper halo keeps them legible at map scale)
  for (const [X, Y, k] of CH.islands) {
    const p = cam.project(X, Y, 0); if (!p) continue; const r = clamp(1.6 * cam.ppkAt(X, Y), 3.0, 6.5);
    g.beginPath(); g.arc(p[0], p[1], r + 2.6, 0, PI * 2); g.fillStyle = 'rgba(238,226,198,0.85)'; g.fill();
    g.beginPath(); g.arc(p[0], p[1], r, 0, PI * 2);
    if (k) { g.setLineDash([1.6, 1.6]); g.strokeStyle = 'rgba(32,30,30,0.9)'; g.lineWidth = 1.3; g.stroke(); g.setLineDash([]); }
    else { g.fillStyle = 'rgb(176,148,106)'; g.fill(); g.strokeStyle = 'rgba(32,30,30,0.95)'; g.lineWidth = 1.2; g.stroke(); }
  }
  OV.clear();
  drawStory(to, cam, S, τ, CTX);
  if (!NOCAP) drawCaptions(t, CTX, TL.cues);
  if (SIGN) drawSign(t - FROM, TO - FROM, CTX);
  // paper fibre and vignette in screen space
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.7; g.drawImage(FIBRE, 0, 0, W, H); g.globalAlpha = 1;
  g.globalCompositeOperation = 'multiply';
  const vg = g.createRadialGradient(960, 540, 380, 960, 540, 1200); vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, 'rgba(206,188,160,1)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  if (Q.get('dbg')) { g.fillStyle = '#000'; g.font = '20px monospace'; g.fillText(`t=${t.toFixed(2)} old=${to.toFixed(2)} τ=${τ.toFixed(1)} v=${S.vmax.toFixed(1)} rm=${S.rmax.toFixed(0)}`, 20, 30); }
};

(async function () {
  const t0 = performance.now();
  const fonts = [['ZH', 'fonts/zh.ttf', '200 900'], ['NR', 'fonts/news.ttf', '200 800'], ['NRI', 'fonts/news-it.ttf', '200 800'], ['MONO', 'fonts/mono.ttf', '500']];
  for (const [n, u, w] of fonts) { try { const f = new FontFace(n, `url(${u})`, { weight: w }); await f.load(); document.fonts.add(f); } catch (e) { console.warn('font ' + n + ' ' + e); } }
  const chart = await (await fetch('raw/chart.json')).json();
  const grids = setTerrain(chart);
  const a = toXY(97, 6), b = toXY(132, 27);
  buildTerrainGrid(a[0], a[1], b[0], b[1], 4);
  CH = prepChart(chart);
  GLC = makeChartGL(W, H, SS, grids);
  CTX.INSET = await (await fetch('raw/inset.json')).json();   // the 南海诸岛 inset (tools/prep_inset.py)
  buildFibre(); buildPhi(); prepStory(CTX);
  // events: the story's cues in old time, mapped to film time; the wind under the camera sampled in film time
  const evOld = storyEvents(CTX).filter(e => e.type !== 'w').map(e => ({ ...e, t: +Minv(e.t).toFixed(3) }));
  const evW = storyEvents(CTXN).filter(e => e.type === 'w');
  const evVo = TL.cues.map(c => ({ t: c.t0, type: 'vo', id: c.id }));
  window.EV = [...evOld, ...evW, ...evVo].filter(e => e.t >= FROM && e.t <= TO).map(e => ({ ...e, t: +(e.t - FROM).toFixed(3) })).sort((a, b) => a.t - b.t);
  console.log('build ms', Math.round(performance.now() - t0));
  window.render(+(Q.get('t') || 0));
  window.READY = true;
})();
