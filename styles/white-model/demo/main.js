// 《被炸平的城市怎样长回来》 How a Flattened City Grew Back — Projection-Mapped Model demo.
// Rotterdam centre at 1:1000 (3DBAG LOD1.3 + BAG construction years + BGT water). render(t) is a pure function of t:
// camera from keys, projection state from timeline.js, every number from data/stats.json (tools/prep.py).
import * as THREE from 'three';
import { clamp, lerp, seg, ss, eio, eo, ei, track } from '/core/lib.js';
import { makeStudio, PAL } from './studio.js';
import { makeOverlay, W, H, SUB, font } from './overlay.js';
import { T, GROW, CLOCK, VO, BEAT } from './timeline.js';

const DUR = T.dur; window.DUR = DUR;
const QS = new URLSearchParams(location.search);
const json = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
const [M, ST] = await Promise.all([json('data/model.json'), json('data/stats.json')]);
let CUES = []; try { CUES = await json('cues.json'); } catch { }

const S = makeStudio(W, H, M);
const { U, camera, post, renderer, house, sun, hemi, scene } = S;
const ZS = ST.zalm_shadow, SH = ZS.shaded;
const shadeOrder = new Map(SH.map((q, i) => [q.bi, i]));
const TL = new THREE.TextureLoader();
S.build(shadeOrder, await TL.loadAsync('data/water.png'), await TL.loadAsync('data/zshadow.png'));
const OV = makeOverlay(document.getElementById('ov'));

// ------------------------------------------------------------------ places on the model (x, z, height)
const Z = ST.marks.zalmhaven, SD = ST.marks.stadhuis;
const P = {
  hole: [0.0, -0.66, 0],                       // a ground point in the dark centre (no pre-1940 building around it)
  stadhuis: [SD.pos[0], SD.pos[1], SD.pos[2]],
  kvz: [0.42, 1.0, 0.03],                       // Wilhelminapier / Kop van Zuid, south bank
  zalm: [Z.pos[0], Z.pos[1], Z.pos[2]],
};
const proj3 = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); return v.z < 1 ? [(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H] : null; };
const at = p => proj3(p[0], p[2], p[1]);

// ------------------------------------------------------------------ sun (Rotterdam centre, 21 Dec 2025, CET)
const SUNT = ST.sun;
function sunAt(min) {
  for (let i = 0; i < SUNT.length - 1; i++) if (min <= SUNT[i + 1][0]) { const k = (min - SUNT[i][0]) / (SUNT[i + 1][0] - SUNT[i][0]); return [lerp(SUNT[i][1], SUNT[i + 1][1], k), lerp(SUNT[i][2], SUNT[i + 1][2], k)]; }
  return SUNT[SUNT.length - 1].slice(1);
}
const sunVec = (alt, az) => { const a = THREE.MathUtils.degToRad(alt), z = THREE.MathUtils.degToRad(az); return new THREE.Vector3(Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a)); };
const clockMin = t => lerp(CLOCK.m0, CLOCK.m1, eio(seg(t, CLOCK.t0, CLOCK.t1)));
// the noon shadow axis from the tower, along the ground, away from the sun
const noonV = sunVec(ST.sun_noon.alt, ST.sun_noon.az);
const shDir = new THREE.Vector2(-noonV.x, -noonV.z).normalize();
const shLen = ZS.theory_m / 1000;
const shPts = Array.from({ length: 79 }, (_, i) => { const d = shLen * i / 78; return [Z.pos[0] + shDir.x * d, Z.pos[1] + shDir.y * d]; });

// ------------------------------------------------------------------ camera: [t, [tx, ty, tz, azimuth°, elevation°, distance]]
// azimuth 0 = camera south of the target looking north, 90 = east of it looking west
const CAM = track([
  [0.0, [0.10, .018, -.70, 152, 7.0, .55]],
  [T.lamp, [0.04, .02, -.64, 142, 11, .72]],
  [T.date, [0.0, .0, -.52, 128, 36, 1.85]],
  [T.g1 - .4, [0.0, .0, -.5, 104, 40, 1.62]],
  [T.gEnd + .6, [0.06, .0, .18, 52, 36, 2.75]],
  [T.hgtTop, [-0.10, .05, .16, 34, 17, 1.95]],
  [T.sun + .6, [-0.18, .03, .02, 28, 24, 2.0]],
  [T.line0, [-0.24, .02, .10, 40, 27, 1.6]],
  [T.roofs1 + .8, [-0.25, .02, .02, 32, 31, 1.16]],
  [T.lights, [-0.22, .02, .0, 30, 35, 1.3]],
  [T.end + .8, [-0.08, .0, -.02, 38, 42, 2.5]],
  [DUR, [0.0, 0.0, -.05, 46, 44, 2.85]],
]);
const tgt = new THREE.Vector3();
function setCamera(t) {
  const [tx, ty, tz, az, el, d] = CAM(t);
  tgt.set(tx, ty, tz);
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  camera.position.set(tx + d * Math.sin(a) * Math.cos(e), ty + d * Math.sin(e), tz + d * Math.cos(a) * Math.cos(e));
  camera.fov = 30; camera.updateProjectionMatrix(); camera.lookAt(tgt); camera.updateMatrixWorld();
  post.dof.focus = d; post.dof.aper = lerp(5.5, 2.0, seg(d, .5, 2.2)); post.dof.maxCoc = 14;
}

// ------------------------------------------------------------------ projection state
const hgtFront = t => lerp(-.003, Z.pos[2] + .005, eo(seg(t, T.hgt0, T.hgtTop)) * .5 + ss(seg(t, T.hgt0, T.hgtTop)) * .5);
function setLight(t) {
  const off = ss(seg(t, T.lightsOut, T.lightsOut + .25));          // house lights cut fast
  const back = ss(seg(t, T.lights, T.lights + 1.0));                // and come back slower
  const houseK = lerp(1, .06, off) * (1 - back) + .5 * back;
  const sunIn = ss(seg(t, T.sun, T.sun + .7)) * (1 - ss(seg(t, T.lights, T.lights + .8)));
  house.intensity = 1.7 * houseK * (1 - sunIn); hemi.intensity = .25 * houseK + .02;
  scene.environmentIntensity = lerp(.06, .75, houseK);
  scene.backgroundIntensity = lerp(.5, 1, houseK);
  post.bloom.threshold = lerp(1.6, .85, Math.min(off, 1 - back));
  post.dof.aoAmt = QS.has('noao') ? 0 : .75 * (1 - ss(seg(t, T.lamp, T.lamp + 1)));   // GTAO only on the close opening (it bands on wide views)
  // projector: strikes at the lamp, goes dark for the silence, back (as the sun's shade) with the sun, off with the lights
  const strike = seg(t, T.lamp, T.lamp + .12), flick = t > T.lamp && t < T.lamp + .25 ? .75 + .25 * Math.sin((t - T.lamp) * 90) : 1;
  const onA = strike * flick * (1 - ss(seg(t, T.dark, T.dark + .35)));
  const onB = ss(seg(t, T.sun, T.sun + .5)) * (1 - ss(seg(t, T.lights, T.lights + .8)));
  U.uProj.value = Math.max(onA, onB);
  U.uNow.value = t;
  // 01 before 1940: a soft wash out from the projector axis
  U.uPreR.value = t < T.lamp ? -1 : lerp(0, 2.4, eo(seg(t, T.lamp, T.washEnd)));
  U.uPreRim.value = 1 - ss(seg(t, T.washEnd - .6, T.washEnd + .2));
  U.uPreDim.value = lerp(1, .5, ss(seg(t, T.g1, T.g1 + .8)));
  // 02 growth: four post-war layers
  U.uGrowOn.value = t >= T.g1 - .01 ? 1 : 0;
  for (const L of GROW) { U.uGT.value[L.band] = L.t; U.uGS.value[L.band] = L.spread; }
  // 03 height
  U.uHgtOn.value = t > T.hgt0 ? 1 : 0;
  U.uHgtF.value = hgtFront(t);
  U.uHgtBand.value = ss(seg(t, T.hgt0, T.hgt0 + .4)) * (1 - ss(seg(t, T.hgtTop - .1, T.hgtTop + .4)));
  // 04 sun
  U.uSunOn.value = t > T.dark + .3 ? 1 : 0;
  const [alt, az] = sunAt(clockMin(t)), sv = sunVec(alt, az);
  sun.position.copy(sv).multiplyScalar(5.5); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
  sun.intensity = 3.2 * sunIn; U.uSunMask.value = 1;
  house.target.position.set(0, 0, 0); house.target.updateMatrixWorld();
  // the roofs in the tower's shadow
  U.uRoofOn.value = t > T.roofs0 ? 1 - ss(seg(t, T.lights, T.lights + .8)) : 0;
  U.uZPos.value.set(Z.pos[0], Z.pos[1]);
  U.uZSOn.value = t > T.line0 ? 1 - ss(seg(t, T.lights, T.lights + .8)) : 0;
  U.uZSProg.value = (ZS.reach_m / 1000 + .02) * eo(seg(t, T.line0, T.lineEnd));
  U.uRoofT0.value = T.roofs0; U.uRoofDT.value = (T.roofs1 - T.roofs0) / Math.max(1, SH.length - 1);
}

// ------------------------------------------------------------------ overlay
const fmt = n => n.toLocaleString('en-US');
const B = ST.bands;
const cueAt = t => CUES.find(c => t >= c.t0 && t < c.t1);
const yearAt = t => {
  const K = [[T.g1, 1940], [T.g2, 1965], [T.g3, 1990], [T.g4, 2010], [T.gEnd + .3, 2025]];
  if (t <= K[0][0]) return 1940;
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) return Math.round(lerp(K[i][1], K[i + 1][1], seg(t, K[i][0], K[i + 1][0])));
  return 2025;
};
function drawOverlay(t) {
  const { txt, readout, pin, rangeLine, subtitle, endCard, scrims, g } = OV;
  OV.begin();
  const left = Math.max(OV.env(t, T.lamp + .6, T.dark + .2), OV.env(t, T.sun + .4, T.lights + .2));
  scrims(left, 1);
  // identity, top-left
  const ia = OV.env(t, .3, T.end - .2, .6, .4);
  txt('id1', '鹿特丹市中心 · 1:1000 白模', 96, 92, 'sc5', 24, '#f2f4f6', ia, { ls: 2, shadow: 10 });
  txt('id2', `${ST.centre_wgs[1].toFixed(3)}°N  ${ST.centre_wgs[0].toFixed(3)}°E  ·  3DBAG / BAG / BGT`, 96, 124, 'mono', 18, 'rgba(225,230,236,.66)', ia, { ls: 1 });

  // 01 before 1940
  readout(t, T.lamp + .9, T.g1 - .1, { id: 'r1', idx: '01', name: '战前', big: String(Math.round(ST.pre1940_area_share * 100)), unit: '%', col: PAL.amber,
    label: '1940 年以前建成', note: '按建筑占地面积 · BAG 建成年份',
    legend: (X, Y, a) => { g.save(); g.globalAlpha = a; g.fillStyle = PAL.amber; g.fillRect(X, Y, 64, 6); g.restore(); txt(null, `${fmt(B[0].n)} 栋`, X + 80, Y + 9, 'mono', 20, 'rgba(235,238,242,.8)', a); } });
  pin(t, T.date, T.g1 - .3, at(P.hole), { id: 'p_date', text: '1940.5.14  13:27', sub: '258 公顷城区成为废墟', len: 70, dx: 150 });
  pin(t, T.stadhuis, T.g1 - .3, at([P.stadhuis[0], P.stadhuis[1], P.stadhuis[2] + .002]), { id: 'p_sh', text: '市政厅 · 1920', sub: '轰炸中几乎完好', len: 170, dx: -40, left: true, col: PAL.amber });

  // 02 growth: a rolling year and the layers as they arrive
  readout(t, T.g1, T.hgt0 + .35, { id: 'r2', idx: '02', name: '长回来', big: String(yearAt(t)), bigId: null, col: PAL.bands[2],
    label: '按建成年代逐层点亮', note: null,
    legend: (X, Y, a) => {
      GROW.forEach((L, i) => {
        const b = B[L.band], ra = a * seg(t, L.t, L.t + .25); if (ra <= 0) return;
        const yy = Y - 34 + i * 34, lab = `${b.lo}–${b.hi >= 2100 ? 2025 : b.hi - 1}`;
        g.save(); g.globalAlpha = ra; g.fillStyle = PAL.bands[L.band]; g.fillRect(X, yy - 12, 28, 14); g.restore();
        txt('r2row' + i, lab, X + 44, yy, 'mono', 20, 'rgba(235,238,242,.9)', ra);
        txt('r2cnt' + i, `${fmt(b.n)} 栋`, X + 210, yy, 'mono', 20, 'rgba(235,238,242,.9)', ra);
      });
    } });
  pin(t, T.g3 + .2, T.hgt0, at(P.kvz), { id: 'p_kvz', text: 'Kop van Zuid', sub: '马斯河南岸', len: 120, dx: 30, col: PAL.bands[3] });

  // 03 height
  const o100 = B.reduce((s, b) => s + b.over100, 0), o100new = B[3].over100 + B[4].over100;
  readout(t, T.hgt0 + .1, T.dark + .35, { id: 'r3', idx: '03', name: '高度', big: String(o100new), unit: `/${o100}`, col: PAL.hgt[2],
    label: '百米高楼，1990 后建', note: '3DBAG 激光实测',
    legend: (X, Y, a) => {
      g.save(); g.globalAlpha = a; const gr = g.createLinearGradient(X, 0, X + 300, 0);
      [[0, PAL.hgt[0]], [.15, PAL.hgt[1]], [.4, PAL.hgt[2]], [1, PAL.hgt[3]]].forEach(([k, c]) => gr.addColorStop(k, c));
      g.fillStyle = gr; g.fillRect(X, Y, 300, 6); g.restore();
      txt(null, '0 m', X, Y + 32, 'mono', 20, 'rgba(230,234,240,.75)', a);
      txt(null, `${Math.round(ST.tallest[0].h)} m`, X + 300, Y + 32, 'mono', 20, 'rgba(230,234,240,.75)', a, { right: true });
    } });
  if (t > T.hgt0 && t < T.dark + .2) {    // the level's reading rides up the tallest tower
    const h = Math.min(hgtFront(t), P.zalm[2]), a = Math.min(seg(t, T.hgt0, T.hgt0 + .3), 1 - ss(seg(t, T.hgtTop + .2, T.hgtTop + .5)));
    const q = proj3(P.zalm[0], h, P.zalm[1]);
    if (q) { txt(null, `${Math.round(h * 1000)} m`, q[0] + 26, q[1] + 7, 'num4', 24, '#ffffff', a, { shadow: 10 }); g.save(); g.globalAlpha = a; g.fillStyle = '#fff'; g.fillRect(q[0] + 8, q[1] - 1, 12, 2); g.restore(); }
  }
  pin(t, T.hgt0 + .6, T.dark + .3, at([P.zalm[0], P.zalm[1], P.zalm[2] + .003]), { id: 'p_zalm', text: 'Zalmhaven I', sub: `屋面 ${Math.round(Z.h)} m`, len: 70, dx: -50, left: true });

  // 04 the winter sun and the shadow
  readout(t, T.sun + .3, T.roofs1 - .1, { id: 'r4', idx: '04', name: '冬至日照', big: ST.sun_noon.alt.toFixed(1), unit: '°', col: PAL.sun,
    label: '冬至正午太阳高度', note: '12 月 21 日 · 太阳位置按天文算法',
    legend: (X, Y, a) => {
      const m = clockMin(t), k = (m - 527) / (991 - 527);
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(X, Y + 1, 300, 2);
      g.fillStyle = PAL.sun; g.fillRect(X, Y, 300 * k, 4); g.beginPath(); g.arc(X + 300 * k, Y + 2, 5, 0, 7); g.fill(); g.restore();
      txt(null, `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`, X + 300 * k - 28, Y + 34, 'mono', 20, '#ffe2bd', a);
    } });
  const tipPts = shPts.map(([x, z]) => proj3(x, .0015, z));
  if (tipPts.every(Boolean)) {
    const tip = rangeLine(t, T.line0, T.lineEnd, T.lights + .2, tipPts, { col: PAL.sun, ticks: [10, 20, 30, 40, 50, 60, 70] });
    if (tip && t < T.lineEnd + .05) {
      const d = Math.round(ZS.theory_m * eo(seg(t, T.line0, T.lineEnd)));
      txt(null, `${d} m`, tip[0] + 16, tip[1] - 12, 'num4', 26, '#ffffff', 1, { shadow: 10 });
    }
  }
  pin(t, T.line0 - .3, T.lights + .2, at([P.zalm[0], P.zalm[1], P.zalm[2] + .003]), { id: 'p_zalm2', text: 'Zalmhaven I', sub: `${Z.year} 年建成`, len: 70, dx: 80, col: PAL.sun });
  pin(t, T.lineEnd, T.lights + .2, tipPts[78], { id: 'p_tip', text: `${Math.round(ZS.theory_m)} m`, sub: '冬至正午的影长', len: 90, dx: 30, col: PAL.sun });
  readout(t, T.roofs1, T.lights + .2, { id: 'r5', idx: '04', name: '冬至日照', big: String(ZS.shaded_roofs), unit: '', col: PAL.sun,
    label: '个屋顶落在它的影里', note: `其中 ${ZS.shaded_pre1940} 栋建于 1940 年以前`,
    legend: (X, Y, a) => { g.save(); g.globalAlpha = a; g.fillStyle = PAL.amber; g.fillRect(X, Y, 28, 6); g.fillStyle = PAL.roofNew; g.fillRect(X + 34, Y, 28, 6); g.restore(); } });

  // the roofs in the shadow: a mark on each as it lights (pre-1940 in amber)
  SH.forEach((q, i) => {
    const t0 = T.roofs0 + i * (T.roofs1 - T.roofs0) / Math.max(1, SH.length - 1), a = seg(t, t0, t0 + .15) * (1 - ss(seg(t, T.lights, T.lights + .5)));
    if (a <= 0) return;
    const p = proj3(q.pos[0], q.pos[2] + .001, q.pos[1]); if (!p) return;
    const pop = 1 + 1.2 * Math.exp(-(t - t0) / .12), col = q.year < 1940 ? PAL.amber : PAL.roofNew;
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.arc(p[0], p[1], 10 * pop, 0, 7); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill(); g.restore();
  });
  subtitle(t, cueAt(t));
  endCard(t, T.end, DUR - T.end);
}

// ------------------------------------------------------------------ events for the mix (window.EV) and checks
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
ev(T.lightsOut, 'relay'); ev(T.lamp, 'lamp'); ev(T.lamp, 'wash', { dur: T.washEnd - T.lamp });
ev(T.date - .45, 'suck', { dur: .45 }); ev(T.date, 'date'); ev(T.stadhuis, 'pin');
for (const L of GROW) {
  ev(L.t, 'layer', { band: L.band });
  // pops: the moments buildings of this layer switch on (rank = hash), thinned to at most 22 per layer
  const on = M.b.map(([y], i) => [y, i]).filter(([y]) => (L.band === 1 ? y >= 1940 && y < 1965 : L.band === 2 ? y >= 1965 && y < 1990 : L.band === 3 ? y >= 1990 && y < 2010 : y >= 2010))
    .map(([, i]) => { const x = Math.sin((i * 1.37 + .5) * 127.1 + 311.7) * 43758.5453; return L.t + (x - Math.floor(x)) * L.spread; }).sort((a, b) => a - b);
  const n = Math.min(22, on.length);
  for (let k = 0; k < n; k++) ev(on[Math.floor((k + .5) * on.length / n)], 'pop', { band: L.band });
}
ev(T.g3 + .2, 'pin'); ev(T.hgt0, 'climb', { dur: T.hgtTop - T.hgt0 }); ev(T.hgtTop, 'top'); ev(T.hgt0 + .6, 'pin');
ev(T.dark, 'dark'); ev(T.sun, 'sun'); ev(T.noon, 'noon');
ev(T.line0, 'line', { dur: T.lineEnd - T.line0 });
for (let i = 1; i <= 7; i++) {   // a tick every 100 m as the line grows (inverse of the ease-out)
  const k = i * 100 / ZS.theory_m; ev(T.line0 + (1 - Math.cbrt(1 - k)) * (T.lineEnd - T.line0), 'tick');
}
ev(T.lineEnd, 'lineEnd'); ev(T.line0 - .3, 'pin');
SH.forEach((q, i) => ev(T.roofs0 + i * (T.roofs1 - T.roofs0) / Math.max(1, SH.length - 1), 'roof', { pre: q.year < 1940 ? 1 : 0, i }));
ev(T.lights, 'lights'); ev(T.end, 'end');
EV.sort((a, b) => a.t - b.t);
window.EV = EV;

// ------------------------------------------------------------------ render
window.render = t => {
  setCamera(t); setLight(t);
  renderer.shadowMap.needsUpdate = true;
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = t => { window.render(t); return OV.texts(); };

await document.fonts.ready;
await Promise.all(['300 20px SC', '500 20px SC', '200 20px IT', '400 20px IT', '400 20px PM'].map(f => document.fonts.load(f, '鹿特丹0')));
// single-line subtitle check with the real fonts (tools/subcheck.mjs reads this)
{
  const c = document.createElement('canvas').getContext('2d'), m = (s, k) => { c.font = font(...SUB[k]); return Math.ceil(c.measureText(s).width); };
  const cues = CUES.map(q => { const wz = m(q.zh, 'zh'), we = m(q.en, 'en'); return { id: q.id, zh: q.zh, en: q.en, wz, we, ok: wz <= SUB.safe && we <= SUB.safe }; });
  window.SUBCHECK = { safe: SUB.safe, cues, ok: cues.every(q => q.ok) };
}
window.render(QS.has('t') ? +QS.get('t') : 0);
window.READY = true;
