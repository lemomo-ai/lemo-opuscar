// 《安检口的夜班》 Night Shift at Lane 3 — every frame from the screening console of an international departures lane.
// render(t) depends on t only. Layout in 1920x1080 design pixels; CAM2 is the camera outside the screen.
import { THREE, V, makeEngine, clamp, lerp, seg, eio, eo, ei, ss, back, mulberry } from './xr.js';
import * as P from './props.js';
import { crabBox, crab } from './crab.js';

const DUR_IN = 49.7;   // story time; the film's time is warped below so verdicts hold longer and still frames get shorter
// [story start, story end, film duration]: stretch or squeeze holds where nothing moves
const WARP = [[7.5, 8.5, 0], [10.45, 10.5, 0.55], [12.5, 13.6, 0.7], [16.6, 17.5, 3.38], [22.45, 23.0, 2.7], [23.0, 24.73, 1.2], [24.9, 26.0, 0.75], [26.35, 27.9, 1.05], [31.0, 32.0, 1.4], [32.95, 33.5, 3.65], [37.5, 38.7, 0.5], [41.0, 44.7, 1.95], [44.7, 46.7, 0.8]];   // [7.5, 8.5, 0] drops the books from the montage
const KN = (() => { const k = [[0, 0]]; let off = 0; for (const [a, b, d] of WARP) { k.push([a + off, a]); off += d - (b - a); k.push([b + off, b]); } k.push([DUR_IN + off, DUR_IN]); return k; })();
const DUR = +KN[KN.length - 1][0].toFixed(3); window.DUR = DUR;
function story(t) { for (let i = 1; i < KN.length; i++) if (t <= KN[i][0]) { const [t0, s0] = KN[i - 1], [t1, s1] = KN[i]; return t1 > t0 ? s0 + (s1 - s0) * (t - t0) / (t1 - t0) : s1; } return DUR_IN; }
function filmT(s) { for (let i = 1; i < KN.length; i++) if (s <= KN[i][1]) { const [t0, s0] = KN[i - 1], [t1, s1] = KN[i]; return s1 > s0 ? t0 + (t1 - t0) * (s - s0) / (s1 - s0) : t1; } return DUR; }
const W = innerWidth, H = innerHeight, S = W / 1920;
const E = makeEngine(W, H);
const out = document.getElementById('out'); out.width = W; out.height = H; const g = out.getContext('2d');
const tmpC = document.createElement('canvas'); tmpC.width = W; tmpC.height = H; const tg = tmpC.getContext('2d');
const bgC = document.createElement('canvas'); bgC.width = Math.round(W / 2); bgC.height = Math.round(H / 2); const bg = bgC.getContext('2d');

// ---------------- timeline ----------------
const T = { mont: 4.5, pb: 10.5, wat: 17.5, crab: 23.0, ct: 26.0, dawn: 33.5, sum: 38.7, stop: 44.7, end: 46.7 };
const MONT = ['laptop', 'umbrella', 'sneakers', 'books', 'thermos', 'traymisc'];
const PB = { mark: 11.4, zoom0: 11.7, zoom1: 12.6, panel: 12.5, photo: 12.75, formula: 13.0, gauge: 13.25, land: 13.6, verdict: 16.15 };
const WA = { stop: 18.3, mark: 18.25, meas: 18.35, panel: 18.45, all: 18.8, verdict: 21.3, rescan0: 21.85, rescan1: 22.4 };
const CR = { os: 25.2, ctKey: 25.85, push: 27.9, tw1: 28.35, tw2: 28.68, settle: 29.7, tags: 29.75, rule: 29.85, verdict: 32.55 };
const DW = { scanEnd: 34.55, tag: 34.75, pull0: 35.2, pull1: 37.5, lights: 36.8 };
const SU = { rows: [39.05, 39.5, 39.95, 40.4, 40.85] };
const ST = { belt0: 44.9, belt1: 45.8, dim0: 45.5, dim1: 46.3 };

// clock (seconds after midnight; the night runs past 24 h) and the bag counter
const CLK = [[0, 79199.55], [4.5, hms(22, 3, 12)], [5.5, hms(22, 21, 40)], [6.5, hms(22, 38, 5)], [7.5, hms(22, 52, 31)], [8.5, hms(23, 9, 14)], [9.5, hms(23, 26, 50)],
  [10.5, hms(23, 47, 20)], [17.5, hms(24, 26, 3)], [23.0, hms(27, 12, 4)], [33.5, hms(29, 52, 10)], [38.7, hms(29, 59, 54)]];
function hms(h, m, s) { return h * 3600 + m * 60 + s; }
function clockAt(t) { let k = CLK[0]; for (const c of CLK) if (t >= c[0]) k = c; return k[1] + (t - k[0]); }
function clockStr(t, sec = true) { const s = Math.floor(clockAt(t)) % 86400; const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` + (sec ? `:${String(x).padStart(2, '0')}` : ''); }
const BAGS = [[0, 0], [3.9, 1], [4.5, 46], [4.9, 47], [5.5, 102], [5.95, 103], [6.5, 167], [6.9, 168], [7.5, 235], [7.9, 236], [8.5, 300], [8.9, 301], [9.5, 346], [9.9, 347],
  [10.5, 351], [11.38, 352], [17.5, 418], [18.2, 419], [23.0, 811], [24.73, 812], [33.5, 1283], [34.55, 1284]];
function bagsAt(t) { let v = 0; for (const [a, b] of BAGS) if (t >= a) v = b; return v; }
function rateAt(t) { return t < T.crab ? 236 : t < T.dawn ? 18 : 41; }

// ---------------- the props ----------------
const IT = { suitcase: P.suitcase(), laptop: P.laptop(), umbrella: P.umbrella(), sneakers: P.sneakers(), books: P.books(), thermos: P.thermos(),
  traymisc: P.trayMisc(), backpack: P.backpack(), tote: P.tote(), lunch: P.lunch() };
const CB = crabBox(); IT.crabbox = CB.it;
for (const k in IT) E.scene.add(IT[k]);
const HL = { suitcase: 0.31, laptop: 0.3, umbrella: 0.47, sneakers: 0.3, books: 0.3, thermos: 0.3, traymisc: 0.3, backpack: 0.22, tote: 0.21, lunch: 0.3, crabbox: 0.17 };
const PBG = IT.backpack.getObjectByName('powerbank'), BOT = IT.tote.getObjectByName('bottle');
// framing for the leg that moves: look from the side of the leg, from outside the box
const TW = (() => { IT.crabbox.position.set(0, 0, 0); CB.twitch(0); IT.crabbox.updateMatrixWorld(true);
  const r0 = CB.leg.root.getWorldPosition(new THREE.Vector3()), k = CB.leg.j2.getWorldPosition(new THREE.Vector3()), tip = CB.leg.j3.getWorldPosition(new THREE.Vector3());
  const d = k.clone().sub(r0); d.y = 0; d.normalize(); let p = V(-d.z, 0, d.x); const out = k.clone(); out.y = 0; if (p.dot(out) < 0) p.negate();
  p.add(d.clone().multiplyScalar(0.35)).normalize();
  CB.twitch(1); IT.crabbox.updateMatrixWorld(true); const kick = CB.leg.j3.getWorldPosition(new THREE.Vector3()).add(CB.leg.j3.localToWorld(V(0.016, 0, 0)).sub(CB.leg.j3.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5)); CB.twitch(0); IT.crabbox.updateMatrixWorld(true);
  const mid = tip.clone().lerp(kick, 0.5);
  const body = CB.legCrab.g.getWorldPosition(new THREE.Vector3());
  const front = CB.legCrab.g.localToWorld(V(0, 0, 0.065));   // where its claws are
  return { az: Math.atan2(p.x, p.z), focus: body.clone().add(mid).add(front).multiplyScalar(1 / 3), rest: tip, kick, mid }; })();
const crabBoxMeshes = CB.it.children.filter(o => o !== CB.filler && !CB.crabs.some(c => c.g === o));

// ---------------- views ----------------
const MON = [36, 26, 1848, 996], SCR = [62, 50, 1796, 940];
const MAIN = [80, 108, 1392, 632], SIDE = [80, 752, 1392, 214];
const RC = 1492, RW = 348;
const HALFW = 0.70, HALFH = HALFW * MAIN[3] / MAIN[2], CD = 3.1, YREF = 0.08;
const XC = -HALFW + 0.8 * 2 * HALFW;   // the scan curtain, world x (u = 0.8)
const SIDE_HH = HALFW * SIDE[3] / SIDE[2], SIDE_CY = 0.104;
const mainV = E.makeView(10, 1.3), sideV = E.makeView(4, 1.2), ctV = E.makeView(30, 1.0), iconV = E.makeView(10, 1.5);
mainV.up.set(0, 0, -1); iconV.up.set(0, 0, -1);
function setTop(v, fx, fz, Z) { const hh = HALFH / Z; v.cam.position.set(fx, YREF + CD, fz + 1e-4); v.look.set(fx, YREF, fz); v.fov = 2 * Math.atan(hh / CD) * 180 / Math.PI; }
function setSide(v) { v.cam.position.set(0, SIDE_CY, CD); v.look.set(0, SIDE_CY, 0); v.up.set(0, 1, 0); v.fov = 2 * Math.atan(SIDE_HH / CD) * 180 / Math.PI; }
setSide(sideV);
function topToU(Zs, x, y, z) { const k = CD / (CD + YREF - y); return [0.5 + (x - Zs.fx) * k * Zs.Z / (2 * HALFW), 0.5 + (z - Zs.fz) * k * Zs.Z / (2 * HALFH)]; }
function topToD(Zs, x, y, z) { const [u, v] = topToU(Zs, x, y, z); return [MAIN[0] + u * MAIN[2], MAIN[1] + v * MAIN[3]]; }

// ---------------- 2D helpers ----------------
let CAM2 = { x: 960, y: 540, z: 1 };
const toScr = (x, y) => [((x - CAM2.x) * CAM2.z + 960) * S, ((y - CAM2.y) * CAM2.z + 540) * S];
const rectScr = r => { const [a, b] = toScr(r[0], r[1]); return [a, b, r[2] * CAM2.z * S, r[3] * CAM2.z * S]; };
function camT() { g.setTransform(S * CAM2.z, 0, 0, S * CAM2.z, (960 - CAM2.x * CAM2.z) * S, (540 - CAM2.y * CAM2.z) * S); }
function idT() { g.setTransform(1, 0, 0, 1, 0, 0); }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const FONT = { m: 'Plex', s: 'SC' };
function font(size, w = 400, fam = 'Plex') { g.font = `${w} ${size}px ${fam}, SC`; }
function txt(s, x, y, size, color = 'rgba(190,215,255,0.85)', align = 'left', w = 400, fam = 'Plex') { font(size, w, fam); g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, x, y); return g.measureText(s).width; }
function line(x0, y0, x1, y1, c = 'rgba(120,170,255,0.35)', lw = 1) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function brackets(x, y, w, h, len, col, lw) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, sx, sy]) => { g.moveTo(a + sx * len, b); g.lineTo(a, b); g.lineTo(a, b + sy * len); }); g.stroke(); }
const C = { org: '#ff8a1a', mix: '#6bdc2e', met: '#2f7dff', amber: 'rgba(255,178,58,0.98)', red: 'rgba(255,74,64,0.98)', green: 'rgba(96,232,140,0.98)', ui: 'rgba(170,200,245,0.82)', uiDim: 'rgba(150,180,230,0.55)', white: 'rgba(238,245,255,0.97)' };
// texts the viewer must read, for readcheck (device pixels)
let TX = [];
function reg(id, text, x0, y0, x1, y1) { const m = g.getTransform(); const a = m.transformPoint(new DOMPoint(x0, y0)), b = m.transformPoint(new DOMPoint(x1, y1)); TX.push({ id, text, x0: a.x, y0: a.y, x1: b.x, y1: b.y }); }
// a two-line label (Chinese above, English below) in design coords; returns its width
function bi(cn, en, x, y, sCn, sEn, col, colEn, align = 'left', id) {
  const w1 = txt(cn, x, y, sCn, col, align, 700, 'SC'); const w2 = en ? txt(en, x, y + sCn * 0.62 + sEn * 0.78, sEn, colEn || col, align, 500) : 0;
  const w = Math.max(w1, w2); if (id) { const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; reg(id, cn + (en ? ' / ' + en : ''), x0, y - sCn * 0.6, x0 + w, y + sCn * 0.62 + sEn * 1.3); }
  return w;
}

// ---------------- state per shot ----------------
function shotAt(t) {
  if (t < T.mont) return 's1'; if (t < T.pb) return 'mont'; if (t < T.wat) return 'pb'; if (t < T.crab) return 'wat';
  if (t < T.ct) return 'crab'; if (t < T.dawn) return 'ct'; if (t < T.sum) return 'dawn'; if (t < T.stop) return 'sum'; return 'stop';
}
const decel = (x0, v, u, d) => x0 - v * (u - u * u / (2 * d));   // decelerate to rest over d seconds
function beltItems(t) {   // [{name, x, z}] and the curtain and zoom state of the main view
  const sh = shotAt(t); const L = [];
  if (sh === 's1') { const x = t < 3.9 ? 0.75 + (1.2 - t) * 0.24 : decel(0.102, 0.24, Math.min(t - 3.9, 0.5), 0.5); L.push({ n: 'suitcase', x, z: 0 }); }
  else if (sh === 'mont') { const i = Math.min(5, Math.floor(t - T.mont)), T0 = T.mont + i, n = MONT[i]; const xe = n === 'umbrella' ? -0.12 : 0.0; L.push({ n, x: xe + 0.55 * Math.pow(1 - seg(t, T0, T0 + 0.95), 3), z: 0 }); }
  else if (sh === 'pb') { const x = t < 11.38 ? 0.634 - 0.5 * (t - 10.5) : decel(0.194, 0.5, Math.min(t - 11.38, 0.22), 0.22); L.push({ n: 'backpack', x, z: 0.0 }); }
  else if (sh === 'wat') { const x = t < 18.2 ? 0.63 - 0.6 * (t - 17.5) : decel(0.21, 0.6, Math.min(t - 18.2, 0.15), 0.15); L.push({ n: 'tote', x, z: 0.0 }); }
  else if (sh === 'crab' || sh === 'ct') { const x = t < 24.73 ? 0.59 - 0.2 * (t - 23.0) : decel(0.244, 0.2, Math.min(t - 24.73, 0.2), 0.2); L.push({ n: 'crabbox', x, z: 0.0 }); }
  else { const x = t < 34.55 ? 0.75 - 0.6 * (t - 33.5) : decel(0.12, 0.6, Math.min(t - 34.55, 0.2), 0.2); L.push({ n: 'lunch', x, z: 0.0 }); }
  return L;
}
function zoomAt(t) {
  if (t >= PB.zoom0 && t < T.wat) { const k = eio(seg(t, PB.zoom0, PB.zoom1)); const p = pbWorld(); return { Z: lerp(1, 2.9, k), fx: lerp(0, p.x + 0.105, k), fz: lerp(0, p.z + 0.03, k) }; }
  if (t >= WA.stop && t < T.crab) { const k = eio(seg(t, WA.stop, WA.stop + 0.5)); const p = botWorld(); return { Z: lerp(1, 1.55, k), fx: lerp(0, p.x + 0.11, k), fz: lerp(0, 0.0, k) }; }
  return { Z: 1, fx: 0, fz: 0 };
}
const _w = new THREE.Vector3();
function placeItems(L) { for (const it of L) { const o = IT[it.n]; o.position.set(it.x, 0, it.z); o.updateMatrixWorld(true); } }
function pbWorld() { IT.backpack.position.set(beltItems(13).find(i => i.n === 'backpack').x, 0, 0); IT.backpack.updateMatrixWorld(true); return PBG.getWorldPosition(new THREE.Vector3()); }
function botWorld() { IT.tote.position.set(beltItems(20).find(i => i.n === 'tote').x, 0, 0); IT.tote.updateMatrixWorld(true); return BOT.getWorldPosition(new THREE.Vector3()); }

function cam2(t) {
  const sh = shotAt(t);
  const K = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });
  if (sh === 's1') return K({ x: 880, y: 400, z: 0.72 }, { x: 1010, y: 520, z: 1.04 }, eio(t / 4.5));
  if (sh === 'mont') {
    const i = Math.min(5, Math.floor(t - T.mont)), k = seg(t, T.mont + i, T.mont + i + 1);
    const F = [[{ x: 800, y: 440, z: 1.3 }, { x: 790, y: 436, z: 1.34 }], [{ x: 720, y: 440, z: 1.32 }, { x: 680, y: 436, z: 1.36 }], [{ x: 800, y: 420, z: 1.6 }, { x: 770, y: 418, z: 1.64 }],
      [{ x: 820, y: 430, z: 1.7 }, { x: 790, y: 430, z: 1.74 }], [{ x: 790, y: 420, z: 2.0 }, { x: 800, y: 425, z: 2.06 }], [{ x: 900, y: 470, z: 1.6 }, { x: 880, y: 466, z: 1.66 }]][i];
    return K(F[0], F[1], k);
  }
  if (sh === 'pb') return K({ x: 960, y: 540, z: 1.0 }, { x: 975, y: 432, z: 1.22 }, eio(seg(t, 11.55, 12.6)));
  if (sh === 'wat') return K({ x: 930, y: 470, z: 1.14 }, { x: 912, y: 462, z: 1.16 }, eo(seg(t, T.wat, WA.all)));
  if (sh === 'crab') return K({ x: 800, y: 300, z: 0.74 }, { x: 830, y: 430, z: 1.26 }, eio(seg(t, T.crab, 25.4)));
  if (sh === 'dawn') { if (t < DW.pull0) return K({ x: 900, y: 470, z: 1.12 }, { x: 905, y: 470, z: 1.15 }, seg(t, T.dawn, DW.pull0)); return K({ x: 905, y: 470, z: 1.15 }, { x: 960, y: 210, z: 0.5 }, eio(seg(t, DW.pull0, DW.pull1))); }
  if (sh === 'sum') return K({ x: 960, y: 210, z: 0.5 }, { x: 790, y: 430, z: 1.2 }, eio(seg(t, T.sum, T.sum + 0.85)));   // continues the dawn pull-back: push back into the screen
  if (t < T.end) return K({ x: 790, y: 430, z: 1.2 }, { x: 930, y: 470, z: 0.84 }, eio(seg(t, T.stop, T.stop + 0.6)));   // pull back out to the booth as the belt stops
  return { x: 930, y: 470, z: lerp(0.84, 0.98, eio(seg(t, T.end, T.end + 2.2))) };
}

// ---------------- the night outside (background, parallax and depth of field) ----------------
const dawnAt = t => ss(seg(t, 33.7, 38.5)) * (t < T.stop ? 1 : 1);
const NIGHT = { top: [3, 6, 12], hor: [14, 22, 38] }, DAWN = { top: [44, 62, 96], hor: [232, 178, 132] };
function mixc(a, b, k, al = 1) { return `rgba(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))},${al})`; }
const RNG = mulberry(77); const STARS = Array.from({ length: 70 }, () => [RNG() * 4000 - 1000, -RNG() * 900 - 40, RNG()]);
function drawBackground(t) {
  const bz = 0.32 + CAM2.z * 0.5, bx = 960 + (CAM2.x - 960) * 0.45, by = 540 + (CAM2.y - 540) * 0.45;
  const q = 0.5;   // the bg canvas is half resolution
  const tb = (x, y) => [((x - bx) * bz + 960) * S * q, ((y - by) * bz + 540) * S * q];
  const dk = dawnAt(t);
  bg.setTransform(1, 0, 0, 1, 0, 0);
  const [, hy] = tb(0, 0);
  const sky = bg.createLinearGradient(0, hy - 700 * bz * S * q, 0, hy);
  sky.addColorStop(0, mixc(NIGHT.top, DAWN.top, dk)); sky.addColorStop(0.75, mixc([8, 14, 26], [120, 132, 156], dk)); sky.addColorStop(1, mixc(NIGHT.hor, DAWN.hor, dk));
  bg.fillStyle = sky; bg.fillRect(0, 0, bgC.width, bgC.height);
  for (const [x, y, b] of STARS) { const [sx, sy] = tb(x, y); bg.fillStyle = `rgba(200,215,255,${(0.25 + 0.5 * b) * (1 - dk)})`; bg.fillRect(sx, sy, 1.2, 1.2); }
  // ground: dark apron below the horizon
  const gnd = bg.createLinearGradient(0, hy, 0, bgC.height); gnd.addColorStop(0, mixc([10, 12, 18], [44, 46, 54], dk)); gnd.addColorStop(1, mixc([3, 4, 6], [16, 17, 20], dk));
  bg.fillStyle = gnd; bg.fillRect(0, hy, bgC.width, bgC.height - hy);
  // ground-plane perspective: lateral X, depth Z (m); camera 22 m up
  const f = 900, hcam = 22, VPX = 1250;
  const gp = (X, Zd) => tb(VPX + f * X / Zd, f * hcam / Zd);
  // runway edge lights and centreline; they go out one after another at dawn
  const offK = i => 1 - seg(t, DW.lights + i * 0.045, DW.lights + i * 0.045 + 0.12);
  for (let i = 0; i < 40; i++) {
    const Zd = 180 + i * 60; const on = offK(39 - i);
    for (const e of [-22, 22]) { const X = -260 + Zd * 0.55 + e; const [sx, sy] = gp(X, Zd); const r = Math.max(0.8, 1400 / Zd) * bz * S * q; glowDot(sx, sy, r, [255, 240, 200], 0.9 * on); }
    if (i % 2 === 0) { const [sx, sy] = gp(-260 + Zd * 0.55, Zd); glowDot(sx, sy, Math.max(0.6, 900 / Zd) * bz * S * q, [230, 240, 255], 0.6 * on); }
  }
  // taxiway (blue) closer in
  for (let i = 0; i < 30; i++) { const Zd = 90 + i * 25; for (const e of [-11, 11]) { const [sx, sy] = gp(-90 - Zd * 0.15 + e, Zd); glowDot(sx, sy, Math.max(0.8, 700 / Zd) * bz * S * q, [90, 140, 255], 0.75 * (1 - 0.7 * dk)); } }
  // apron floodlight poles (sodium)
  for (const [X, Zd] of [[-160, 140], [-20, 210], [160, 170], [330, 260], [-330, 300]]) { const [sx, sy] = gp(X, Zd); const [, sy0] = gp(X, Zd); const ph = 30 * f / Zd * bz * S * q; glowDot(sx, sy - ph, 6 * bz * S * q * 160 / Zd + 2, [255, 176, 96], 0.85 * (1 - 0.6 * dk), 3.5); bg.fillStyle = 'rgba(0,0,0,0.5)'; bg.fillRect(sx - 0.6, sy - ph, 1.2, ph); }
  // a parked aircraft and its blinking beacon; a jet bridge
  {
    const [ax, ay] = gp(-120, 110); const s = 900 / 110 * bz * S * q;
    bg.fillStyle = mixc([8, 10, 14], [44, 46, 52], dk);
    bg.beginPath(); bg.ellipse(ax, ay - 3.2 * s, 22 * s, 2.2 * s, 0, 0, 7); bg.fill();
    bg.beginPath(); bg.moveTo(ax + 15 * s, ay - 4 * s); bg.lineTo(ax + 19 * s, ay - 11 * s); bg.lineTo(ax + 22 * s, ay - 11 * s); bg.lineTo(ax + 21 * s, ay - 4 * s); bg.fill();
    bg.fillRect(ax - 30 * s, ay - 4.2 * s, 9 * s, 1.6 * s);
    const bl = (t * 1.1) % 1 < 0.12 ? 1 : 0.08; glowDot(ax - 2 * s, ay - 5.6 * s, 2.2 * s * 0.3 + 1.5, [255, 40, 40], bl, 4);
    glowDot(ax + 21 * s, ay - 11.2 * s, 1.4, [255, 255, 255], (t * 0.9 + 0.4) % 1 < 0.06 ? 1 : 0, 3);
  }
  // a departure rolling along the runway at the start of the shift
  if (t < 6) { const Zd = lerp(1700, 500, t / 6); const X = -260 + Zd * 0.55; const [sx, sy] = gp(X, Zd); glowDot(sx, sy - 6, 3.2 * bz * S * q * 600 / Zd + 2, [255, 250, 235], 1.0, 6); glowDot(sx + 4, sy - 7, 1.6, [255, 50, 50], (t * 1.3) % 1 < 0.15 ? 1 : 0.1, 3); }
  // 03:12: one aircraft taxiing slowly past, nav lights and a taxi light
  if (t > 22.6 && t < 26.4) {
    const u = (t - 22.6) / 3.8; const Zd = 150; const X = lerp(-330, 260, u); const [ax, ay] = gp(X, Zd); const s = 900 / Zd * bz * S * q;
    bg.fillStyle = 'rgba(10,12,16,0.95)'; bg.beginPath(); bg.ellipse(ax, ay - 3 * s, 20 * s, 2 * s, 0, 0, 7); bg.fill();
    bg.beginPath(); bg.moveTo(ax - 14 * s, ay - 4 * s); bg.lineTo(ax - 18 * s, ay - 10 * s); bg.lineTo(ax - 20 * s, ay - 10 * s); bg.lineTo(ax - 19 * s, ay - 4 * s); bg.fill();
    glowDot(ax + 19 * s, ay - 3 * s, 2.2, [255, 250, 230], 1.0, 7);
    glowDot(ax - 2 * s, ay - 2 * s, 1.4, [255, 40, 40], 0.9, 4); glowDot(ax + 2 * s, ay - 1.5 * s, 1.4, [60, 255, 120], 0.9, 4);
    glowDot(ax - 19 * s, ay - 10.2 * s, 1.4, [255, 255, 255], (t * 1.2) % 1 < 0.08 ? 1 : 0, 4);
    glowDot(ax, ay - 5.4 * s, 1.6, [255, 40, 40], (t * 1.1 + 0.5) % 1 < 0.12 ? 1 : 0.1, 4);
  }
  // control tower silhouette with obstruction light
  { const [tx, ty] = gp(420, 520); const s = 900 / 520 * bz * S * q; bg.fillStyle = mixc([6, 8, 12], [52, 54, 60], dk); bg.fillRect(tx - 2.2 * s, ty - 46 * s, 4.4 * s, 46 * s); bg.beginPath(); bg.moveTo(tx - 7 * s, ty - 46 * s); bg.lineTo(tx + 7 * s, ty - 46 * s); bg.lineTo(tx + 5 * s, ty - 54 * s); bg.lineTo(tx - 5 * s, ty - 54 * s); bg.fill(); glowDot(tx, ty - 56 * s, 2, [255, 60, 50], 0.9, 3); }
  // the terminal glass: mullions and a transom, faint reflections of the room
  bg.fillStyle = 'rgba(2,3,5,0.75)';
  for (let k = -6; k <= 8; k++) { const [mx] = tb(k * 620 - 200, 0); bg.fillRect(mx - 5 * bz * S * q, 0, 10 * bz * S * q, bgC.height); }
  { const [, ty] = tb(0, -520); bg.fillRect(0, ty - 4 * bz * S * q, bgC.width, 8 * bz * S * q); }
  // draw to the frame with depth of field
  idT(); g.save(); g.filter = `blur(${Math.max(1.5, 7 * (CAM2.z - 0.3)) * S}px)`; g.drawImage(bgC, 0, 0, W, H); g.restore();
}
function glowDot(x, y, r, c, a, halo = 5) {
  if (a <= 0.01) return;
  const gr = bg.createRadialGradient(x, y, 0, x, y, r * halo); gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.55 * a})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  bg.fillStyle = gr; bg.beginPath(); bg.arc(x, y, r * halo, 0, 7); bg.fill();
  bg.fillStyle = `rgba(255,255,255,${0.9 * a})`; bg.beginPath(); bg.arc(x, y, Math.max(0.5, r * 0.5), 0, 7); bg.fill();
}

// ---------------- the booth: machine exit and rollers, desk, keyboard ----------------
const KEYS = [['STOP', 0], ['◀', 0], ['▶', 0], ['OS', 1], ['MS', 0], ['HI', 0], ['Z+', 1], ['Z−', 0], ['MARK', 1], ['CT', 1], ['B/W', 0], ['INV', 0]];
function keyLit(name, t) {
  if (name === 'MARK') return (t > PB.mark && t < PB.mark + 0.5) || (t > WA.mark && t < WA.mark + 0.5);
  if (name === 'Z+') return (t > PB.zoom0 && t < PB.zoom1) || (t > WA.stop && t < WA.stop + 0.5);
  if (name === 'OS') return t > CR.os && t < T.ct;
  if (name === 'CT') return t > CR.ctKey && t < T.ct + 0.3;
  if (name === 'STOP') return t > ST.belt0 && t < ST.belt1 + 0.6;
  return false;
}
function rollerSpeed(t) { return t < ST.belt0 ? 0.2 : 0.2 * Math.max(0, 1 - (t - ST.belt0) / (ST.belt1 - ST.belt0)); }
function rollerPhase(t) { if (t < ST.belt0) return 0.2 * t; const d = ST.belt1 - ST.belt0, u = Math.min(t - ST.belt0, d); return 0.2 * ST.belt0 + 0.2 * (u - u * u / (2 * d)); }
function drawBooth(t, glow) {
  camT();
  const dk = dawnAt(t);
  // machine housing at the left, its exit tunnel and the roller table
  const mx0 = -1300, mx1 = -60;
  let gr = g.createLinearGradient(0, 300, 0, 1120); gr.addColorStop(0, '#15181d'); gr.addColorStop(1, '#0a0b0e');
  g.fillStyle = gr; rr(mx0, 330, mx1 - mx0, 800, 18); g.fill();
  g.fillStyle = '#050608'; rr(-1120, 640, 820, 380, 10); g.fill();
  // lead curtain strips at the tunnel mouth, swaying a little when the belt runs
  const sp = rollerSpeed(t);
  for (let i = 0; i < 22; i++) { const x = -1105 + i * 37; const sw = Math.sin(t * 3.1 + i * 0.7) * 4 * (sp / 0.2); g.fillStyle = `rgba(${40 + (i % 3) * 6},${44 + (i % 3) * 6},${50 + (i % 3) * 6},0.92)`; g.beginPath(); g.moveTo(x, 646); g.lineTo(x + 33, 646); g.lineTo(x + 33 + sw, 1000); g.lineTo(x + sw, 1000); g.fill(); }
  // amber X-RAY ON lamp and a plate
  const xon = t < ST.belt1;
  g.fillStyle = xon ? 'rgba(255,170,40,0.95)' : 'rgba(80,60,30,0.6)'; g.beginPath(); g.arc(-200, 420, 16, 0, 7); g.fill();
  if (xon) { const hg = g.createRadialGradient(-200, 420, 0, -200, 420, 120); hg.addColorStop(0, 'rgba(255,170,40,0.35)'); hg.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = hg; g.fillRect(-320, 300, 240, 240); }
  txt('X-RAY ON', -170, 421, 22, xon ? 'rgba(255,190,90,0.9)' : 'rgba(120,110,90,0.6)', 'left', 500);
  txt('XR-6040 DV', -1240, 380, 20, 'rgba(160,170,190,0.45)', 'left', 500);
  // roller table coming out of the tunnel towards us
  g.fillStyle = '#0d0f12'; g.fillRect(-1300, 1000, 1240, 150);
  const ph = rollerPhase(t);
  for (let i = -2; i < 26; i++) { const x = -1300 + ((i * 52 - ph * 1600) % 1352 + 1352) % 1352; g.fillStyle = 'rgba(120,130,145,0.18)'; g.fillRect(x, 1008, 40, 6); g.fillStyle = 'rgba(30,34,40,0.9)'; g.fillRect(x, 1014, 40, 110); g.fillStyle = 'rgba(160,170,185,0.10)'; g.fillRect(x + 4, 1016, 6, 104); }
  // desk under the monitor, lit by the screen
  gr = g.createLinearGradient(0, 1020, 0, 1900); gr.addColorStop(0, '#16181c'); gr.addColorStop(1, '#060708'); g.fillStyle = gr; g.fillRect(-1400, 1020, 4800, 900);
  const sg = g.createRadialGradient(960, 1030, 0, 960, 1030, 900); sg.addColorStop(0, `rgba(${glow[0]},${glow[1]},${glow[2]},0.22)`); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(-100, 1020, 2100, 900);
  // the operator keyboard
  g.fillStyle = '#101216'; g.beginPath(); g.moveTo(420, 1090); g.lineTo(1500, 1090); g.lineTo(1600, 1330); g.lineTo(320, 1330); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2; g.stroke();
  KEYS.forEach(([k], i) => {
    const row = Math.floor(i / 6), col = i % 6; const y = 1125 + row * 92; const sc = 1 + row * 0.08; const x0 = 960 - 6 * 140 * sc / 2 + col * 140 * sc;
    const lit = keyLit(k, t);
    g.fillStyle = lit ? 'rgba(60,70,84,1)' : 'rgba(30,33,38,1)'; rr(x0 + 10, y, 120 * sc, 66, 8); g.fill();
    g.fillStyle = lit ? (k === 'STOP' ? 'rgba(255,80,70,1)' : 'rgba(120,220,255,1)') : 'rgba(70,80,90,0.7)'; g.beginPath(); g.arc(x0 + 26, y + 14, 5, 0, 7); g.fill();
    txt(k, x0 + 10 + 60 * sc, y + 38, 24, lit ? 'rgba(220,240,255,0.95)' : 'rgba(150,160,175,0.6)', 'center', 500);
  });
  // monitor stand
  g.fillStyle = '#0c0d10'; g.fillRect(860, 1020, 200, 60);
  // dawn light from the windows spilling on the desk
  if (dk > 0) { g.fillStyle = `rgba(255,200,150,${0.06 * dk})`; g.fillRect(-1400, 1020, 4800, 900); }
}

// ---------------- monitor ----------------
function drawMonitor() {
  camT();
  const [mx, my, mw, mh] = MON;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 40 * S;
  rr(mx, my, mw, mh, 16); const bz = g.createLinearGradient(0, my, 0, my + mh); bz.addColorStop(0, '#1b1e23'); bz.addColorStop(1, '#0c0d10'); g.fillStyle = bz; g.fill(); g.restore();
  rr(mx + 1, my + 1, mw - 2, mh - 2, 15); g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1.5; g.stroke();
  const [sx, sy, sw, sh] = SCR; rr(sx, sy, sw, sh, 4); g.fillStyle = '#03070c'; g.fill();
}
function panel(x, y, w, h, title, a = 1) {
  const ga = g.globalAlpha; g.globalAlpha = ga * a; rr(x, y, w, h, 4); g.fillStyle = 'rgba(12,22,38,0.6)'; g.fill(); g.strokeStyle = 'rgba(110,160,255,0.26)'; g.lineWidth = 1.2; g.stroke();
  if (title) txt(title, x + 12, y + 16, 16, 'rgba(160,190,240,0.7)', 'left', 500);
  g.globalAlpha = ga;
}
// panels light up one after another at power-on
const bootA = (t, k) => { const u = t - k + 0.3; if (u <= 0) return 0; if (u > 0.25) return 1; return (Math.floor(u * 60) % 2 ? 0.4 : 1) * clamp(u / 0.12); };

function drawChrome(t, st) {
  camT();
  const dim = st.dim;
  g.globalAlpha = dim;
  // top bar
  const a0 = bootA(t, 0.0);
  g.globalAlpha = dim * a0;
  txt('LANE 03', 92, 80, 22, 'rgba(210,228,255,0.95)', 'left', 500);
  txt('INTL DEPARTURES', 200, 80, 20, C.ui, 'left', 500);
  txt('DUAL-VIEW · 160 kV', 430, 80, 20, C.uiDim);
  txt(`BELT ${st.belt.toFixed(2)} m/s`, 680, 80, 20, C.uiDim);
  txt(`RATE ${rateAt(t)}/h`, 900, 80, 20, C.uiDim);
  txt(st.mode, MAIN[0] + MAIN[2] - 8, 80, 20, st.modeCol || C.ui, 'right', 500);
  // view frames and labels
  g.globalAlpha = dim * bootA(t, 0.1);
  rr(MAIN[0], MAIN[1], MAIN[2], MAIN[3], 2); g.strokeStyle = 'rgba(120,170,255,0.35)'; g.lineWidth = 1.2; g.stroke();
  txt('TOP', MAIN[0] + 10, MAIN[1] + 18, 16, C.uiDim, 'left', 500);
  g.globalAlpha = dim * bootA(t, 0.2);
  rr(SIDE[0], SIDE[1], SIDE[2], SIDE[3], 2); g.stroke();
  txt('SIDE', SIDE[0] + 10, SIDE[1] + 18, 16, C.uiDim, 'left', 500);
  // image stamp (each image carries its bag number and time)
  g.globalAlpha = dim * bootA(t, 0.15);
  if (st.bagShown > 0 && !st.hideStamp) txt(`BAG ${String(st.bagShown).padStart(4, '0')}  ${clockStr(t)}`, MAIN[0] + MAIN[2] - 12, MAIN[1] + 20, 18, 'rgba(200,220,255,0.75)', 'right', 500);
  txt(`ZOOM ${st.zoom.toFixed(1)}×`, MAIN[0] + 12, MAIN[1] + MAIN[3] - 18, 16, C.uiDim, 'left', 500);
  // scan curtain markers
  if (st.split <= 1 && st.split >= 0 && st.scanning) { const x = MAIN[0] + st.split * MAIN[2]; g.fillStyle = 'rgba(150,210,255,0.95)'; g.beginPath(); g.moveTo(x - 8, MAIN[1] - 2); g.lineTo(x + 8, MAIN[1] - 2); g.lineTo(x, MAIN[1] + 10); g.fill(); g.beginPath(); g.moveTo(x - 8, SIDE[1] + SIDE[3] + 2); g.lineTo(x + 8, SIDE[1] + SIDE[3] + 2); g.lineTo(x, SIDE[1] + SIDE[3] - 10); g.fill(); }
  // right column: clock, counter, materials, keys, status
  g.globalAlpha = dim * bootA(t, 0.25);
  panel(RC, 108, RW, 128, 'LOCAL TIME');
  txt(clockStr(t, false), RC + 16, 172, 64, 'rgba(225,238,255,0.97)', 'left', 500);
  txt(':' + clockStr(t).slice(6), RC + 206, 182, 30, 'rgba(170,200,245,0.8)', 'left', 500);
  txt('SHIFT 22:00–06:00', RC + 16, 216, 16, C.uiDim, 'left', 500);
  g.globalAlpha = dim * bootA(t, 0.35);
  panel(RC, 246, RW, 108, 'BAGS SCREENED');
  const bags = bagsAt(t);
  txt(String(bags).padStart(4, '0'), RC + 16, 306, 58, 'rgba(225,238,255,0.97)', 'left', 500);
  if (st.bagFlash > 0) { g.fillStyle = `rgba(150,210,255,${0.25 * st.bagFlash})`; rr(RC + 2, 248, RW - 4, 104, 3); g.fill(); }
  g.globalAlpha = dim * bootA(t, 0.45);
  panel(RC, 364, RW, 252, 'MATERIAL');
  const leg = [[C.org, 'ORGANIC', 'Zeff < 10'], [C.mix, 'MIXED', 'Zeff 10–18'], [C.met, 'METAL', 'Zeff > 18'], ['#000000', 'OPAQUE', 'nothing through']];
  leg.forEach(([c, a, b], i) => {
    const y = 396 + i * 54; const dimO = (i === 0 && st.strip > 0) ? 0.25 : 1;
    g.globalAlpha = dim * bootA(t, 0.45) * dimO;
    g.fillStyle = c; if (i < 3) { g.shadowColor = c; g.shadowBlur = 10 * S; } g.fillRect(RC + 14, y, 34, 34); g.shadowBlur = 0;
    if (i === 3) { g.strokeStyle = 'rgba(120,170,255,0.7)'; g.lineWidth = 1.5; g.strokeRect(RC + 14, y, 34, 34); }
    txt(a, RC + 62, y + 9, 21, 'rgba(225,238,255,0.95)', 'left', 500);
    txt(b, RC + 62, y + 29, 15, 'rgba(160,190,240,0.75)', 'left', 400);
  });
  g.globalAlpha = dim * bootA(t, 0.55);
  panel(RC, 626, RW, 100, 'FUNCTION');
  ['OS', 'MS', 'HI', 'Z+', 'CT'].forEach((k, i) => { const lit = keyLit(k, t) || (k === 'OS' && st.strip > 0); const x = RC + 16 + i * 66; g.fillStyle = lit ? 'rgba(120,220,255,0.95)' : 'rgba(80,100,130,0.6)'; g.beginPath(); g.arc(x + 8, 680, 6, 0, 7); g.fill(); txt(k, x + 20, 681, 18, lit ? 'rgba(220,240,255,0.95)' : C.uiDim, 'left', 500); });
  g.globalAlpha = dim * bootA(t, 0.65);
  panel(RC, 736, RW, 230, 'STATUS');
  const [stw, stc, sub] = st.status;
  const blink = st.warn ? (Math.floor(t * 4) % 2 ? 0.45 : 1) : 1;
  if (st.statusFill) { g.fillStyle = st.statusFill; rr(RC + 2, 738, RW - 4, 226, 3); g.fill(); }
  g.globalAlpha = dim * blink; g.fillStyle = stc; g.beginPath(); g.arc(RC + 26, 800, 9, 0, 7); g.fill(); g.globalAlpha = dim;
  txt(stw, RC + 46, 801, 32, stc, 'left', 500);
  if (sub) txt(sub, RC + 16, 880, 19, 'rgba(210,225,250,0.9)', 'left', 500);
  g.globalAlpha = dim * bootA(t, 0.1);
  txt('OPERATOR 07', SCR[0] + SCR[2] - 14, 978, 15, 'rgba(150,175,220,0.5)', 'right', 500);
  g.globalAlpha = 1;
}
function statusAt(t) {
  // [word, colour, detail]: the machine speaks English
  const SCAN = 'rgba(120,190,255,0.95)';
  if (t < 0.7) return ['SELF TEST', SCAN, 'detector · source'];
  if (t < T.pb) return ['SCANNING', SCAN, ''];
  if (t < PB.verdict) return t < 11.3 ? ['SCANNING', SCAN, ''] : ['REVIEW', C.amber, '1 battery pack'];
  if (t < T.wat) return ['CLEAR', C.green, 'power bank 74 Wh'];
  if (t < WA.verdict) return t < 18.25 ? ['SCANNING', SCAN, ''] : ['REVIEW', C.amber, '1 liquid'];
  if (t < WA.rescan1) return ['BAG CHECK', C.red, 'remove liquid'];
  if (t < T.crab) return ['CLEAR', C.green, 'rescan clear'];
  if (t < CR.os) return t < 24.85 ? ['SCANNING', SCAN, ''] : ['REVIEW', C.amber, '6 organic masses'];
  if (t < T.dawn) return ['UNCLEAR', C.amber, 'to CT'];
  if (t < T.sum) return t < 34.55 ? ['SCANNING', SCAN, ''] : ['CLEAR', C.green, 'lunch jar'];
  if (t < ST.dim0) return ['HANDOVER', SCAN, ''];
  return ['STANDBY', 'rgba(120,150,200,0.8)', ''];
}

// ---------------- verdict panels and labels (design coords, on the screen) ----------------
function verdictBox(x, y, w, h, a) { g.globalAlpha = a; rr(x, y, w, h, 6); g.fillStyle = 'rgba(5,12,24,0.88)'; g.fill(); g.strokeStyle = 'rgba(120,170,255,0.45)'; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1; }
function stamp(x, y, ok, k, cn, en, w = 520, id) {
  if (k <= 0) return;
  const s = lerp(1.25, 1, eo(k * 1.6)); const col = ok ? C.green : C.red;
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, k * 3);
  rr(0, -46, w, 92, 6); g.fillStyle = ok ? 'rgba(20,70,40,0.92)' : 'rgba(90,18,16,0.92)'; g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
  g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath();
  if (ok) { g.moveTo(26, 0); g.lineTo(44, 20); g.lineTo(76, -22); } else { g.moveTo(28, -20); g.lineTo(70, 22); g.moveTo(70, -20); g.lineTo(28, 22); }
  g.stroke(); g.lineCap = 'butt';
  txt(cn, 104, -12, 36, 'rgba(240,250,255,0.98)', 'left', 700, 'SC');
  txt(en, 104, 24, 20, ok ? 'rgba(170,240,195,0.95)' : 'rgba(255,190,180,0.95)', 'left', 500);
  g.restore();
  if (id && k > 0.5) reg(id, cn + ' / ' + en, x, y - 46, x + w, y + 46);
}
function markBox(x0, y0, x1, y1, k, col, lw = 3) {   // the operator drags a box: grows from the top-left corner
  if (k <= 0) return; const e = eo(k); const x = x0, y = y0, w = (x1 - x0) * e, h = (y1 - y0) * e;
  const ga = g.globalAlpha; brackets(x, y, w, h, 22, col, lw); g.globalAlpha = ga * 0.5; g.setLineDash([6, 6]); g.strokeStyle = col; g.lineWidth = 1; g.strokeRect(x, y, w, h); g.setLineDash([]); g.globalAlpha = ga;
}
function leader(ax, ay, bx, by, k, col) { if (k <= 0) return; const e = eo(k); g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, bx, e), lerp(ay, by, e)); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(ax, ay, 5, 0, 7); g.fill(); }

function pbOverlay(t, Zs) {
  // box on the brick
  const p = PBG.getWorldPosition(new THREE.Vector3());
  const a = topToD(Zs, p.x - 0.082, 0.14, p.z - 0.05), b = topToD(Zs, p.x + 0.082, 0.14, p.z + 0.05);
  markBox(a[0], a[1], b[0], b[1], seg(t, PB.mark, PB.mark + 0.3), C.amber);
  if (t > PB.mark + 0.2 && t < PB.panel + 0.3) { g.globalAlpha = 1 - seg(t, PB.panel, PB.panel + 0.3); bi('电池', 'BATTERY', a[0], a[1] - 58, 34, 18, C.amber, C.amber, 'left'); g.globalAlpha = 1; }
  if (t < PB.panel) return;
  // the panel on the right of the image
  const X0 = 904, Y0 = 116, PW = 556, PH = 616; const ap = eo(seg(t, PB.panel, PB.panel + 0.25));
  verdictBox(X0, Y0, PW, PH, ap);
  leader(b[0], (a[1] + b[1]) / 2, X0, Y0 + 60, seg(t, PB.panel, PB.panel + 0.3), C.amber);
  if (ap < 0.5) return;
  bi('充电宝', 'POWER BANK · LITHIUM-ION', X0 + 24, Y0 + 38, 36, 18, 'rgba(240,248,255,0.98)', C.ui, 'left', 'pb-h');
  // the label as photographed at the bag-check table
  const kp = eo(seg(t, PB.photo, PB.photo + 0.3));
  if (kp > 0) {
    const lx = X0 + 24, ly = Y0 + 92, lw = PW - 48, lh = 118; g.save(); g.globalAlpha = kp; g.translate(0, (1 - kp) * 20);
    rr(lx, ly, lw, lh, 6); const lg = g.createLinearGradient(lx, ly, lx + PW, ly + lh); lg.addColorStop(0, '#c3c8cd'); lg.addColorStop(1, '#a1a7ad'); g.fillStyle = lg; g.fill();
    const nr = mulberry(5); g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 260; i++) g.fillRect(lx + nr() * lw, ly + nr() * lh, 2, 2);
    txt('Li-ion Power Bank', lx + 18, ly + 22, 17, 'rgba(30,34,40,0.9)', 'left', 500);
    txt('20000mAh', lx + 18, ly + 62, 38, 'rgba(18,20,24,0.95)', 'left', 500);
    txt('3.7V', lx + 250, ly + 62, 38, 'rgba(18,20,24,0.95)', 'left', 500);
    txt('74Wh', lx + 370, ly + 62, 38, 'rgba(18,20,24,0.95)', 'left', 500);
    txt('Input 5V 2A   Output 5V 2.1A', lx + 18, ly + 98, 15, 'rgba(30,34,40,0.8)', 'left', 400);
    g.restore();
    txt('LABEL · PHOTO AT BAG CHECK', X0 + PW - 26, ly + lh + 16, 15, C.uiDim, 'right', 500);
    if (kp > 0.9) reg('pb-label', '20000mAh 3.7V 74Wh', lx, ly, lx + lw, ly + lh);
  }
  // formula
  const kf = seg(t, PB.formula, PB.formula + 0.35);
  if (kf > 0) {
    const s = '20000 mAh ÷ 1000 × 3.7 V = 74 Wh'; const n = Math.ceil(s.length * kf);
    txt(s.slice(0, n), X0 + 24, Y0 + 262, 26, 'rgba(235,245,255,0.98)', 'left', 500);
    if (kf >= 1) reg('pb-f', s, X0 + 24, Y0 + 246, X0 + PW - 24, Y0 + 278);
  }
  // gauge 0–200 Wh with the two lines at 100 and 160
  const kg = seg(t, PB.gauge, PB.gauge + 0.3);
  if (kg > 0) {
    const gx = X0 + 24, gy = Y0 + 352, gw = PW - 48, gh = 24; const ux = v => gx + gw * v / 200;
    g.save(); g.beginPath(); g.rect(gx - 30, gy - 60, gw * eo(kg) + 60, 260); g.clip();
    g.fillStyle = 'rgba(70,200,120,0.85)'; g.fillRect(gx, gy, ux(100) - gx, gh);
    g.fillStyle = 'rgba(255,176,50,0.9)'; g.fillRect(ux(100), gy, ux(160) - ux(100), gh);
    g.fillStyle = 'rgba(240,70,60,0.9)'; g.fillRect(ux(160), gy, ux(200) - ux(160), gh);
    for (const v of [0, 100, 160, 200]) line(ux(v), gy - 6, ux(v), gy + gh + 6, 'rgba(230,240,255,0.9)', 2);
    txt('100 Wh', ux(100), gy - 20, 21, 'rgba(235,245,255,0.97)', 'center', 500); txt('160 Wh', ux(160), gy - 20, 21, 'rgba(235,245,255,0.97)', 'center', 500);
    const lid = kg >= 1 ? 'pb-z' : null;
    bi('随身带', 'cabin bag', gx, gy + gh + 36, 34, 18, 'rgba(150,240,180,0.98)', 'rgba(150,240,180,0.8)', 'left', lid && lid + '1');
    bi('航司批准', 'approval', ux(100) + 5, gy + gh + 36, 34, 18, 'rgba(255,205,120,0.98)', 'rgba(255,205,120,0.8)', 'left', lid && lid + '2');
    bi('禁止', 'banned', ux(160) + 8, gy + gh + 36, 34, 18, 'rgba(255,150,140,0.98)', 'rgba(255,150,140,0.8)', 'left', lid && lid + '3');
    g.restore();
    // the 74 Wh marker slides in and lands
    const km = seg(t, PB.gauge + 0.15, PB.land); if (km > 0) {
      const v = lerp(0, 74, back(km, 1.2)); const mxp = ux(v);
      g.fillStyle = 'rgba(255,255,255,0.98)'; g.beginPath(); g.moveTo(mxp, gy - 2); g.lineTo(mxp - 12, gy - 24); g.lineTo(mxp + 12, gy - 24); g.fill();
      line(mxp, gy - 2, mxp, gy + gh + 2, 'rgba(255,255,255,0.98)', 4);
      txt(`${Math.round(v)} Wh`, mxp - 18, gy - 26, 26, 'rgba(255,255,255,0.99)', 'right', 500);
    }
  }
  // verdict
  stamp(X0 + 24, Y0 + 556, true, seg(t, PB.verdict, PB.verdict + 0.4), '可以随身带', 'OK IN CABIN BAG', PW - 48, 'pb-v');
}

function bottleOverlay(t, Zs, removed) {
  const p = BOT.getWorldPosition(new THREE.Vector3());
  // the bottle lies along x: 0.195 m long, 0.065 m across
  const L0 = topToD(Zs, p.x - 0.105, 0.075, p.z), L1 = topToD(Zs, p.x + 0.1, 0.075, p.z);
  const T0 = topToD(Zs, p.x - 0.03, 0.075, p.z - 0.0325), T1 = topToD(Zs, p.x - 0.03, 0.075, p.z + 0.0325);
  const a = topToD(Zs, p.x - 0.115, 0.075, p.z - 0.05), b = topToD(Zs, p.x + 0.11, 0.075, p.z + 0.05);
  if (!removed) {
    markBox(a[0], a[1], b[0], b[1], seg(t, WA.mark, WA.mark + 0.3), C.amber);
    // measuring: length and diameter
    const km = seg(t, WA.meas, WA.meas + 0.35);
    if (km > 0) {
      const e = eo(km); const yl = T0[1] - 34; const Y = 'rgba(255,230,160,0.98)';
      line(L0[0], yl, lerp(L0[0], L1[0], e), yl, Y, 2.5); line(L0[0], yl - 10, L0[0], yl + 10, Y, 2.5);
      if (e > 0.98) { line(L1[0], yl - 10, L1[0], yl + 10, Y, 2.5); txt('21 cm', (L0[0] + L1[0]) / 2, yl - 22, 26, Y, 'center', 500); }
      const xd = L0[0] - 30; line(xd, T0[1], xd, lerp(T0[1], T1[1], e), Y, 2.5);
      if (e > 0.98) { line(xd - 8, T0[1], xd + 8, T0[1], Y, 2.5); line(xd - 8, T1[1], xd + 8, T1[1], Y, 2.5); txt('Ø 6.5 cm', xd - 14, (T0[1] + T1[1]) / 2, 24, Y, 'right', 500); }
    }
    // a 100 mL container drawn beside it at the same scale, for comparison
    const kc = seg(t, WA.panel, WA.panel + 0.3);
    if (kc > 0) {
      const s = (L1[0] - L0[0]) / 0.205; const cw = 0.115 * s, ch = 0.04 * s; const cx = L0[0], cy = T1[1] + 30;
      g.globalAlpha = eo(kc); g.setLineDash([7, 6]); g.strokeStyle = 'rgba(150,240,180,0.95)'; g.lineWidth = 2.5; rr(cx, cy, cw, ch, ch * 0.4); g.stroke(); g.setLineDash([]);
      txt('100 mL', cx + cw + 14, cy + ch / 2, 26, 'rgba(150,240,180,0.98)', 'left', 500); g.globalAlpha = 1;
    }
    const ks = seg(t, WA.verdict, WA.verdict + 0.25); if (ks > 0) { g.strokeStyle = C.red; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], b[1]); g.lineTo(lerp(a[0], b[0], eo(ks)), lerp(b[1], a[1], eo(ks))); g.stroke(); g.lineCap = 'butt'; }
  } else {
    g.save(); g.setLineDash([10, 8]); g.strokeStyle = C.red; g.lineWidth = 3; rr(L0[0], T0[1], L1[0] - L0[0], T1[1] - T0[1], 18); g.stroke(); g.restore();
    bi('已取出', 'REMOVED', L0[0], T1[1] + 42, 34, 18, C.red, C.red, 'left', 'wa-rm');
  }
  // panel
  const X0 = 930, Y0 = 150, PW = 530; const ap = eo(seg(t, WA.panel, WA.panel + 0.25));
  if (ap <= 0) return;
  verdictBox(X0, Y0, PW, 386, ap);
  if (!removed) leader(b[0], a[1] + 10, X0, Y0 + 50, seg(t, WA.panel, WA.panel + 0.3), C.amber);
  if (ap < 0.5) return;
  bi('液体 · 一瓶水', 'LIQUID · ONE BOTTLE', X0 + 24, Y0 + 40, 34, 18, 'rgba(240,248,255,0.98)', C.ui, 'left', 'wa-h');
  bi('容器约 500 mL', 'container ≈ 500 mL', X0 + 24, Y0 + 124, 40, 20, 'rgba(255,230,160,0.98)', 'rgba(255,220,150,0.85)', 'left', 'wa-n');
  bi('国际航班：单个容器 ≤ 100 mL', 'INTERNATIONAL: EACH CONTAINER ≤ 100 mL', X0 + 24, Y0 + 206, 34, 17, 'rgba(225,238,255,0.97)', C.ui, 'left', 'wa-r');
  stamp(X0 + 24, Y0 + 322, false, seg(t, WA.verdict, WA.verdict + 0.4), '不能随身带', 'NOT IN CABIN BAG', PW - 48, 'wa-v');
}

// ---------------- frames ----------------
function glowColour(t) { const sh = shotAt(t); return sh === 'crab' || sh === 'ct' ? [90, 120, 200] : [110, 140, 210]; }
function monitorFrame(t) {
  const sh = shotAt(t); CAM2 = cam2(t);
  const L = beltItems(t); placeItems(L);
  const Zs = zoomAt(t);
  const items = L.map(i => IT[i.n]);
  if (sh === 'crab' || sh === 'ct') { CB.filler.visible = true; crabBoxMeshes.forEach(m => m.visible = true); CB.twitch(0); }
  BOT.visible = !(t > WA.rescan0 && sh === 'wat');
  // main view state
  let strip = 0, front = -1;
  if (sh === 'crab' && t > CR.os) { strip = 1; front = lerp(-0.05, 1.05, eio(seg(t, CR.os, CR.os + 0.5))); }
  let hot = null;
  if (sh === 'pb' && t > PB.mark + 0.1) { const p = PBG.getWorldPosition(new THREE.Vector3()); const [u0, v0] = topToU(Zs, p.x - 0.082, 0.14, p.z - 0.05), [u1, v1] = topToU(Zs, p.x + 0.082, 0.14, p.z + 0.05); hot = [u0, v0, (u1 - u0) * seg(t, PB.mark + 0.1, PB.mark + 0.4), v1 - v0]; }
  const dim = sh === 'stop' ? lerp(1, 0.0, ss(seg(t, ST.dim0, ST.dim1))) : 1;
  const chromeDim = lerp(0.35, 1, dim);
  const boot = t < 1.0 ? clamp((t + 0.15) / 0.25) : 1;
  E.renderer.setRenderTarget(null); E.renderer.setClearColor(0x000000, 1); E.renderer.clear();
  setTop(mainV, Zs.fx, Zs.fz, Zs.Z);
  const ms = rectScr(MAIN), sd = rectScr(SIDE);
  const beltPh = (rollerPhase(t) / (2 * HALFW)) * Zs.Z;
  const scanning = sh === 's1' || (sh === 'mont' && t - Math.floor(t - T.mont) - T.mont < 0.6) || (sh === 'pb' && t < 11.45) || (sh === 'wat' && t < 18.25) || (sh === 'crab' && t < 24.8) || (sh === 'dawn' && t < 34.6);
  const common = { split: scanning ? 0.8 : 2, strip, front, belt: beltPh, beltK: 35 / Zs.Z * 1, dim: dim * boot };
  // rescan: the new image (no bottle) replaces the old one behind a sweep
  if (sh === 'wat' && t > WA.rescan0) {
    BOT.visible = true; if (E.renderView(mainV, ms, items)) E.drawView(mainV, { ...common });
    BOT.visible = false;
    const su = lerp(1.02, -0.02, eio(seg(t, WA.rescan0, WA.rescan1)));
    if (E.renderView(mainV, ms, items)) E.drawView(mainV, { ...common, split: 2, clipFrom: su });
    var sweepU = t < WA.rescan1 ? su : null;
  } else if (E.renderView(mainV, ms, items)) E.drawView(mainV, { ...common, hot });
  if (E.renderView(sideV, sd, items)) E.drawView(sideV, { ...common, side: true, beltK: 0 });
  // ---- 2D ----
  idT(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  drawBackground(t);   // always: a push or pull through z ≈ 1.08 must not pop the window in or out
  drawBooth(t, glowColour(t));
  drawMonitor();
  // the X-ray images
  idT();
  for (const v of [mainV, sideV]) if (v.vis) { const [x, y, w, h] = v.vis; g.drawImage(E.glc, x, y, w, h, x, y, w, h); }
  // bloom of the screen image
  g.save(); g.globalCompositeOperation = 'lighter'; const sr = rectScr(SCR); g.beginPath(); g.rect(sr[0], sr[1], sr[2], sr[3]); g.clip();
  g.filter = `blur(${8 * S * CAM2.z}px)`; g.globalAlpha = 0.32;
  for (const v of [mainV, sideV]) if (v.vis) { const [x, y, w, h] = v.vis; g.drawImage(E.glc, x, y, w, h, x, y, w, h); }
  g.filter = `blur(${26 * S * CAM2.z}px)`; g.globalAlpha = 0.2;
  for (const v of [mainV, sideV]) if (v.vis) { const [x, y, w, h] = v.vis; g.drawImage(E.glc, x, y, w, h, x, y, w, h); }
  g.restore();
  // sweep line of the rescan
  if (typeof sweepU === 'number' && sweepU !== null) { camT(); const x = MAIN[0] + sweepU * MAIN[2]; const gl = g.createLinearGradient(x - 30, 0, x + 30, 0); gl.addColorStop(0, 'rgba(150,210,255,0)'); gl.addColorStop(0.5, 'rgba(180,225,255,0.9)'); gl.addColorStop(1, 'rgba(150,210,255,0)'); g.fillStyle = gl; g.fillRect(x - 30, MAIN[1], 60, MAIN[3]); }
  // chrome
  const stArr = statusAt(t);
  const st = {
    dim: chromeDim, belt: (sh === 'pb' && t > 11.6) || (sh === 'wat' && t > WA.stop && t < WA.rescan0) || (sh === 'crab' && t > 24.93) || (sh === 'stop') ? (sh === 'stop' ? rollerSpeed(t) : 0) : 0.2,
    mode: strip > 0 ? 'ORGANIC STRIP' : 'DUAL-ENERGY COLOUR', modeCol: strip > 0 ? 'rgba(255,190,90,0.95)' : null,
    zoom: Zs.Z, split: 0.8, scanning, strip, status: [stArr[0], stArr[1], stArr[2]], warn: stArr[1] === C.amber,
    statusFill: stArr[1] === C.green ? 'rgba(40,140,80,0.16)' : stArr[1] === C.red ? 'rgba(160,40,30,0.2)' : null,
    bagShown: Math.max(1, bagsAt(t) + (scanning ? 1 : 0)), bagFlash: 0, hideStamp: (sh === 'pb' && t > PB.panel) || (sh === 'wat' && t > WA.panel)
  };
  for (const [a] of BAGS) if (t >= a && t < a + 0.3 && a > 0) st.bagFlash = 1 - (t - a) / 0.3;
  if (t < 1.0) drawBoot(t);
  drawChrome(t, st);
  // overlays
  camT(); g.save(); rr(MAIN[0], MAIN[1], MAIN[2], MAIN[3], 2); g.clip();
  if (sh === 'pb') pbOverlay(t, Zs);
  if (sh === 'wat') bottleOverlay(t, Zs, t > WA.rescan1 - 0.15);
  if (sh === 'crab' && t > 24.9) {
    const p = IT.crabbox.position; const a = topToD(Zs, p.x - 0.175, 0.15, -0.13), b = topToD(Zs, p.x + 0.175, 0.15, 0.13);
    markBox(a[0], a[1], b[0], b[1], seg(t, 24.9, 25.15), C.amber);
    if (t > 25.1) { bi('不明有机物 × 6', 'UNKNOWN ORGANIC MASSES × 6', a[0], b[1] + 40, 34, 18, C.amber, C.amber, 'left'); }
  }
  if (sh === 'dawn' && t > DW.tag) {
    const p = IT.lunch.position; const a = topToD(Zs, p.x - 0.04, 0.12, 0.0); const k = seg(t, DW.tag, DW.tag + 0.35);
    leader(a[0], a[1], a[0] + 180, a[1] - 150, k, C.green);
    if (k >= 1) { const w = bi('早饭', 'BREAKFAST', a[0] + 196, a[1] - 160, 44, 22, 'rgba(160,245,190,0.99)', 'rgba(160,245,190,0.85)', 'left', 'bf'); }
  }
  if (sh === 'sum' || sh === 'stop') summary(t);
  g.restore();
  if (sh === 'stop') endCard(t);
  // glass, scanlines, vignette
  camT(); g.save(); rr(SCR[0], SCR[1], SCR[2], SCR[3], 4); g.clip();
  g.fillStyle = 'rgba(0,0,0,0.13)'; for (let y = SCR[1]; y < SCR[1] + SCR[3]; y += 3) g.fillRect(SCR[0], y, SCR[2], 1);
  const gl2 = g.createLinearGradient(SCR[0], SCR[1], SCR[0] + SCR[2] * 0.6, SCR[1] + SCR[3]); gl2.addColorStop(0, 'rgba(255,255,255,0.045)'); gl2.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gl2; g.fillRect(SCR[0], SCR[1], SCR[2], SCR[3]);
  if (dawnAt(t) > 0) { const rg = g.createLinearGradient(SCR[0], SCR[1], SCR[0] + SCR[2], SCR[1]); rg.addColorStop(0, `rgba(255,210,170,${0.05 * dawnAt(t)})`); rg.addColorStop(1, 'rgba(255,210,170,0)'); g.fillStyle = rg; g.fillRect(SCR[0], SCR[1], SCR[2], SCR[3]); }
  g.restore();
  idT(); const vg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
function drawBoot(t) {   // power-on self test: an air-calibration bar sweeps the views, lines of text type out
  camT();
  const k = seg(t, -0.3, 0.75); const x = MAIN[0] + MAIN[2] * eo(k);
  g.save(); rr(MAIN[0], MAIN[1], MAIN[2], SIDE[1] + SIDE[3] - MAIN[1], 2); g.clip();
  const gr = g.createLinearGradient(x - 220, 0, x + 6, 0); gr.addColorStop(0, 'rgba(120,180,255,0)'); gr.addColorStop(0.9, 'rgba(160,210,255,0.35)'); gr.addColorStop(1, 'rgba(220,240,255,0.95)');
  g.fillStyle = gr; g.fillRect(x - 220, MAIN[1], 226, SIDE[1] + SIDE[3] - MAIN[1]);
  g.restore();
  const lines = ['SELF TEST', 'X-RAY SOURCE 160 kV ....... OK', 'DETECTOR ARRAY 2 × 1280 .. OK', 'AIR CALIBRATION .......... OK', 'BELT ...................... OK'];
  lines.forEach((s, i) => { const a = clamp((t + 0.3 - i * 0.1) / 0.08) * (1 - seg(t, 0.8, 1.0)); if (a > 0) { g.globalAlpha = a; txt(s, MAIN[0] + 40, MAIN[1] + 70 + i * 34, 22, 'rgba(170,215,255,0.95)', 'left', 500); } });
  g.globalAlpha = 1;
}

// ---------------- summary, stop, end card ----------------
const ICON = {};
function summary(t) {
  const X0 = 150, Y0 = 140, PW = 1250, rows = [
    ['suitcase', '行李', 'bags screened', '1,284'], ['backpack', '开包检查', 'bags opened', '37'], ['pb', '充电宝', 'power banks', '412'], ['bottle', '液体', 'liquids taken out', '29'], ['crab', '螃蟹', 'crabs', '6']];
  const a = eo(seg(t, T.sum + 0.1, T.sum + 0.7)) * (t > ST.dim0 ? 1 - ss(seg(t, ST.dim0, ST.dim0 + 0.6)) : 1);
  if (a <= 0) return;
  g.globalAlpha = a; rr(MAIN[0], MAIN[1], MAIN[2], MAIN[3], 2); g.fillStyle = 'rgba(2,6,12,0.82)'; g.fill(); g.globalAlpha = 1;
  g.globalAlpha = a;
  bi('交班汇总', 'SHIFT SUMMARY · LANE 03 · 22:00–06:00', X0, Y0 + 20, 40, 20, 'rgba(240,248,255,0.98)', C.ui, 'left', 'sum-h');
  line(X0, Y0 + 74, X0 + PW - 60, Y0 + 74, 'rgba(120,170,255,0.4)', 1.5);
  rows.forEach(([ic, cn, en, n], i) => {
    const k = seg(t, SU.rows[i], SU.rows[i] + 0.25); if (k <= 0) return;
    const y = Y0 + 128 + i * 96; g.globalAlpha = a;
    const rx = X0 - 10 + (PW - 40) * eo(k); g.save(); g.beginPath(); g.rect(X0 - 10, y - 48, rx - X0 + 10, 96); g.clip();
    const icn = ICON[ic]; if (icn) g.drawImage(icn, X0, y - 40, 120, 80);
    bi(cn, en, X0 + 150, y - 10, 34, 18, 'rgba(235,245,255,0.98)', C.ui, 'left', 'sum-' + i);
    txt(n, X0 + PW - 70, y + 4, 60, i === 4 ? 'rgba(255,190,110,0.99)' : 'rgba(235,245,255,0.98)', 'right', 500);
    line(X0 + 150, y + 44, X0 + PW - 60, y + 44, 'rgba(120,170,255,0.18)', 1);
    g.restore();
    if (k < 1) line(rx, y - 44, rx, y + 44, `rgba(170,220,255,${0.8 * a})`, 2);   // the reveal line, like the scan curtain
  });
  g.globalAlpha = 1;
}
function endCard(t) {
  const k = seg(t, T.end, T.end + 0.6); if (k <= 0) return;
  camT(); const x = 150, y = 300;
  g.globalAlpha = eo(k);
  txt('安检口的夜班', x, y, 76, 'rgba(240,246,255,0.98)', 'left', 700, 'SC');
  txt('Night Shift at Lane 3', x, y + 76, 36, 'rgba(190,212,250,0.9)', 'left', 500);
  line(x, y + 126, x + 520, y + 126, 'rgba(120,170,255,0.5)', 1.5);
  txt('安检 X 光', x, y + 170, 38, 'rgba(255,170,80,0.95)', 'left', 700, 'SC');
  txt('SECURITY X-RAY', x, y + 210, 22, 'rgba(255,170,80,0.85)', 'left', 500);
  txt('LemoLab × Claude Opus 5.5', x, y + 278, 32, 'rgba(225,236,255,0.95)', 'left', 500);
  reg('end1', '安检口的夜班', x, y - 40, x + 460, y + 40); reg('end2', 'Night Shift at Lane 3', x, y + 56, x + 470, y + 96);
  reg('end3', '安检 X 光', x, y + 148, x + 190, y + 192); reg('end4', 'SECURITY X-RAY', x, y + 198, x + 200, y + 224); reg('end5', 'LemoLab × Claude Opus 5.5', x, y + 258, x + 500, y + 298);
  g.globalAlpha = 1;
}

// ---------------- CT ----------------
function ctFrame(t) {
  CAM2 = { x: 960, y: 540, z: 1 };
  IT.crabbox.position.set(0, 0, 0);
  CB.filler.visible = false; crabBoxMeshes.forEach(m => m.visible = false);
  // the leg: two kicks, with a ghost of the earlier pose (CT motion artefact)
  const kick = (u) => u < 0 ? 0 : u < 0.09 ? ss(u / 0.09) : Math.max(0, 1 - (u - 0.09) / 0.2) * (1 - (u - 0.09) / 0.2 > 0 ? 1 : 0);
  const k1 = kick(t - CR.tw1), k2 = kick(t - CR.tw2) * 0.8; const kk = Math.max(k1, k2);
  const kg = kick(t - CR.tw1 - 0.07) + 0.8 * kick(t - CR.tw2 - 0.07);
  CB.twitch(kk, (t > CR.tw1 && t < CR.tw2 + 0.45) ? Math.max(kg, 0.001) : null);
  IT.crabbox.updateMatrixWorld(true);
  // orbit ~190°, falling from overhead to a low three-quarter view; it pushes in and slows down beside the crab whose leg came loose
  const leg = CB.legCrab.g.getWorldPosition(new THREE.Vector3());
  const box = V(0, 0.06, 0);
  const azT = TW.az;
  const az = t < CR.push ? lerp(azT - 1.75, azT, eio(seg(t, T.ct, CR.push))) : t < 28.95 ? lerp(azT, azT + 0.12, seg(t, CR.push, 28.95)) : lerp(azT + 0.12, azT + 1.6, eio(seg(t, 28.95, CR.settle)));
  const el = t < CR.push ? lerp(1.3, 1.0, eio(seg(t, T.ct, CR.push))) : t < 28.95 ? lerp(1.0, 0.96, seg(t, CR.push, 28.95)) : lerp(0.96, 0.55, eio(seg(t, 28.95, CR.settle)));
  const push = ss(seg(t, 26.8, CR.push)) * (1 - ss(seg(t, 28.95, CR.settle)));
  const settle = ss(seg(t, 28.95, CR.settle));
  const r = lerp(lerp(0.56, 0.5, settle), 0.29, push);
  const look = box.clone().lerp(TW.focus, push).add(V(Math.cos(az), 0, -Math.sin(az)).multiplyScalar(0.07 * settle));
  ctV.cam.position.set(look.x + r * Math.sin(az) * Math.cos(el), look.y + r * Math.sin(el), look.z + r * Math.cos(az) * Math.cos(el));
  ctV.look.copy(look); ctV.up.set(0, 1, 0); ctV.fov = 30;
  E.renderer.setRenderTarget(null); E.renderer.setClearColor(0x000000, 1); E.renderer.clear();
  const noise = 0.5 * Math.pow(Math.max(0, 1 - seg(t, T.ct, T.ct + 0.55)), 1.5);   // the reconstruction settles out of noise (kept dim: no white flash on the tear)
  E.renderView(ctV, [0, 0, W, H], [IT.crabbox]); E.colMat.uniforms.uTime.value = t;
  E.drawView(ctV, { mode: 1, gain: 0.72, noise });
  // 2D
  idT(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
  const bgr = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7); bgr.addColorStop(0, '#08142a'); bgr.addColorStop(1, '#02050a'); g.fillStyle = bgr; g.fillRect(0, 0, W, H);
  // reconstruction field: rings and a floor grid that turns with the orbit
  camT();
  g.strokeStyle = 'rgba(90,140,230,0.09)'; g.lineWidth = 1;
  for (let i = 1; i < 10; i++) { g.beginPath(); g.arc(960, 540, i * 95, 0, 7); g.stroke(); }
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2 + az * 0.5; line(960 + Math.cos(a) * 150, 540 + Math.sin(a) * 150, 960 + Math.cos(a) * 1000, 540 + Math.sin(a) * 1000, 'rgba(90,140,230,0.045)', 1); }
  idT(); g.globalCompositeOperation = 'lighter'; g.drawImage(E.glc, 0, 0);
  g.save(); g.filter = `blur(${10 * S}px)`; g.globalAlpha = 0.42; g.drawImage(E.glc, 0, 0); g.filter = `blur(${34 * S}px)`; g.globalAlpha = 0.26; g.drawImage(E.glc, 0, 0); g.restore();
  g.globalCompositeOperation = 'source-over';
  // HUD
  camT(); const M = 56;
  brackets(M, M, 1920 - 2 * M, 1080 - 2 * M, 44, 'rgba(150,200,255,0.55)', 2);
  txt(`CT RECONSTRUCTION · BAG 0812 · ${clockStr(t)}`, M + 26, M + 33, 20, 'rgba(200,225,255,0.9)', 'left', 500);
  txt(`ANGLE ${String(Math.round((((az - TW.az + 1.75) * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0')}°   SLICE ${String(64 + Math.floor((t - T.ct) * 29)).padStart(3, '0')}/512`, 1920 - M - 26, M + 33, 20, 'rgba(170,200,245,0.85)', 'right', 500);
  txt('FILLER REMOVED', 1920 - M - 26, M + 64, 18, 'rgba(150,180,230,0.7)', 'right', 500);
  if (t > CR.tw1 + 0.12 && t < CR.verdict - 0.1) {   // the machine flags the motion artefact
    const blink = t < CR.tw1 + 0.6 ? (Math.floor(t * 8) % 2 ? 0.5 : 1) : 1;
    g.globalAlpha = blink; rr(M + 22, M + 58, 300, 90, 4); g.fillStyle = 'rgba(60,40,8,0.75)'; g.fill(); g.strokeStyle = C.amber; g.lineWidth = 2; g.stroke();
    bi('检测到运动', 'MOTION DETECTED', M + 42, M + 90, 34, 18, C.amber, C.amber, 'left', 'moved'); g.globalAlpha = 1;
  }
  // the motion box on the leg
  const pr = p => { const q = p.clone().project(ctV.cam); return [(q.x * 0.5 + 0.5) * 1920, (0.5 - q.y * 0.5) * 1080]; };
  if (t > CR.tw1 + 0.05 && t < CR.settle) {
    const [ax, ay] = pr(TW.rest), [bx, by] = pr(TW.kick);
    const x0 = Math.min(ax, bx) - 70, x1 = Math.max(ax, bx) + 70, y0 = Math.min(ay, by) - 70, y1 = Math.max(ay, by) + 70;
    const kb = seg(t, CR.tw1 + 0.05, CR.tw1 + 0.25); g.globalAlpha = 1 - seg(t, 28.95, 29.25); markBox(x0, y0, x1, y1, kb, C.amber, 3);
    g.globalAlpha = 1;
  }
  // the six crabs counted, then the rule and the verdict
  if (t > CR.tags) {
    CB.crabs.forEach((c, i) => {
      const p = c.g.getWorldPosition(new THREE.Vector3()).add(V(0, 0.04, 0)); p.project(ctV.cam);
      const x = (p.x * 0.5 + 0.5) * 1920, y = (0.5 - p.y * 0.5) * 1080; const kc = seg(t, CR.tags + i * 0.06, CR.tags + i * 0.06 + 0.2);
      if (kc <= 0) return; g.globalAlpha = eo(kc); g.fillStyle = 'rgba(255,178,58,0.95)'; g.beginPath(); g.arc(x, y, 20 * back(kc), 0, 7); g.fill();
      txt(String(i + 1), x, y + 1, 24, 'rgba(20,12,0,0.95)', 'center', 500); g.globalAlpha = 1;
    });
    const X0 = 1150, Y0 = 640, PW = 700; const ap = eo(seg(t, CR.tags, CR.tags + 0.25));
    verdictBox(X0, Y0, PW, 336, ap);
    if (ap > 0.5) {
      bi('活蟹 × 6 · 已捆扎', 'LIVE CRABS × 6 · TIED', X0 + 26, Y0 + 44, 38, 20, 'rgba(255,214,150,0.99)', 'rgba(255,214,150,0.85)', 'left', 'cr-h');
      if (t > CR.rule) bi('活体海鲜不能随身带进客舱', 'LIVE SEAFOOD MAY NOT GO IN CABIN BAGS', X0 + 26, Y0 + 136, 34, 18, 'rgba(225,238,255,0.97)', C.ui, 'left', 'cr-r');
      stamp(X0 + 26, Y0 + 262, false, seg(t, CR.verdict, CR.verdict + 0.4), '不能带进客舱', 'NOT IN THE CABIN', PW - 52, 'cr-v');
    }
  }
  idT();
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
}

function glitch(t, tc) {
  const d = Math.abs(t - tc); if (d > 0.12) return;
  const amt = 1 - d / 0.12; const r = mulberry(Math.floor(t * 30) + 7);
  tg.globalCompositeOperation = 'copy'; tg.drawImage(out, 0, 0);
  idT();
  for (let i = 0; i < 14; i++) { const y = r() * H, h = (6 + r() * 60) * S, dx = (r() - 0.5) * 160 * S * amt; g.drawImage(tmpC, 0, y, W, h, dx, y, W, h); }
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18 * amt; g.drawImage(tmpC, 12 * S * amt, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = `rgba(160,210,255,${0.15 * amt})`; g.fillRect(0, r() * H, W, 3 * S);
}
// cuts between bags: the next picture comes in behind a scan line moving right to left (the belt's direction)
const snapC = document.createElement('canvas'); snapC.width = W; snapC.height = H; const snapG = snapC.getContext('2d');
function sweepOver(u) {   // u 0..1: the outgoing frame (snapC) stays left of the line
  const x = W * (1 - u); idT();
  g.save(); g.beginPath(); g.rect(0, 0, x, H); g.clip(); g.drawImage(snapC, 0, 0); g.restore();
  const bw = 90 * S; const gr = g.createLinearGradient(x - bw, 0, x + bw * 0.5, 0);
  gr.addColorStop(0, 'rgba(150,210,255,0)'); gr.addColorStop(0.62, 'rgba(160,215,255,0.12)'); gr.addColorStop(0.66, 'rgba(225,242,255,0.9)'); gr.addColorStop(0.7, 'rgba(160,215,255,0.12)'); gr.addColorStop(1, 'rgba(150,210,255,0)');
  g.fillStyle = gr; g.fillRect(x - bw, 0, bw * 1.5, H);
}

// ---------------- icons for the summary (rendered once) ----------------
function makeIcons() {
  const list = { suitcase: [IT.suitcase, 0.34], backpack: [IT.backpack, 0.26], crab: [null, 0.06] };
  const iconItems = { pb: (() => { const it = P.backpack(); E.scene.add(it); return [it, 0.1, 'powerbank']; })(), bottle: (() => { const it = P.tote(); E.scene.add(it); return [it, 0.13, 'bottle']; })() };
  const mk = (name, it, half, focusName) => {
    const c = document.createElement('canvas'); c.width = 240; c.height = 160;
    it.position.set(0, 0, 0); it.updateMatrixWorld(true);
    let fx = 0, fz = 0; if (focusName) { const o = it.getObjectByName(focusName); const p = o.getWorldPosition(new THREE.Vector3()); fx = p.x; fz = p.z; it.traverse(m => { if (m.isMesh && !isDesc(m, o)) m.visible = false; }); }
    iconV.cam.position.set(fx, YREF + CD, fz + 1e-4); iconV.look.set(fx, YREF, fz); iconV.fov = 2 * Math.atan(half * 0.667 / CD) * 180 / Math.PI;
    E.renderer.setRenderTarget(null); E.renderer.setClearColor(0x000000, 1); E.renderer.clear();
    if (E.renderView(iconV, [0, 0, 240, 160], [it])) E.drawView(iconV, { split: 2 });
    c.getContext('2d').drawImage(E.glc, 0, 0, 240, 160, 0, 0, 240, 160); ICON[name] = c;
    if (focusName) it.traverse(m => { if (m.isMesh) m.visible = true; });
  };
  const isDesc = (m, o) => { for (let p = m; p; p = p.parent) if (p === o) return true; return false; };
  mk('suitcase', IT.suitcase, 0.34); mk('backpack', IT.backpack, 0.26);
  mk('pb', iconItems.pb[0], 0.1, 'powerbank'); mk('bottle', iconItems.bottle[0], 0.13, 'bottle');
  // a single crab
  const ci = new THREE.Group(); ci.userData.mats = []; E.scene.add(ci);
  { const c = CB.crabs[0]; const prevParent = c.g.parent; const pos = c.g.position.clone(), rot = c.g.rotation.clone();
    const it = IT.crabbox; it.position.set(0, 0, 0); it.updateMatrixWorld(true); const p = c.g.getWorldPosition(new THREE.Vector3());
    CB.filler.visible = false; crabBoxMeshes.forEach(m => m.visible = false); CB.crabs.forEach(o => o.g.visible = o === c);
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 160;
    iconV.cam.position.set(p.x, YREF + CD, p.z + 1e-4); iconV.look.set(p.x, YREF, p.z); iconV.fov = 2 * Math.atan(0.06 / CD) * 180 / Math.PI;
    E.renderer.setRenderTarget(null); E.renderer.clear(); if (E.renderView(iconV, [0, 0, 240, 160], [it])) E.drawView(iconV, { split: 2 });
    cv.getContext('2d').drawImage(E.glc, 0, 0, 240, 160, 0, 0, 240, 160); ICON.crab = cv;
    CB.filler.visible = true; crabBoxMeshes.forEach(m => m.visible = true); CB.crabs.forEach(o => o.g.visible = true); }
  E.scene.remove(iconItems.pb[0]); E.scene.remove(iconItems.bottle[0]);
}

// ---------------- sound events ----------------
const EV = [];
const ev = (t, type, o = {}) => { if (WARP.some(([a, b, d]) => d === 0 && t >= a && t < b)) return; const f = filmT(t); if (o.d) o.d = +(filmT(t + o.d) - f).toFixed(3); EV.push({ t: +f.toFixed(3), type, ...o }); };
ev(0, 'boot'); ev(0.45, 'clock'); ev(0.3, 'beltStart');
ev(1.2, 'scan', { d: 2.7 }); ev(3.9, 'scanEnd');
MONT.forEach((n, i) => { ev(T.mont + i, 'cut', { item: n }); ev(T.mont + i, 'scan', { d: 0.4 }); ev(T.mont + i + 0.4, 'scanEnd'); });
ev(T.pb, 'cut'); ev(10.5, 'scan', { d: 0.88 }); ev(11.3, 'alarm'); ev(PB.mark, 'mark'); ev(11.6, 'beltStop'); ev(PB.zoom0, 'zoom', { d: PB.zoom1 - PB.zoom0 }); ev(PB.panel, 'panel'); ev(PB.photo, 'photo');
ev(PB.formula, 'type', { d: 0.35 }); ev(PB.gauge, 'gauge'); ev(PB.land, 'land'); ev(PB.verdict, 'ok');
ev(T.wat, 'cut'); ev(17.5, 'scan', { d: 0.7 }); ev(18.2, 'alarm'); ev(WA.mark, 'mark'); ev(WA.stop, 'beltStop'); ev(WA.meas, 'measure', { d: 0.35 }); ev(WA.panel, 'panel'); ev(WA.verdict, 'no'); ev(WA.rescan0, 'rescan', { d: WA.rescan1 - WA.rescan0 });
ev(T.crab, 'cut'); ev(23.0, 'scan', { d: 1.73 }); ev(24.9, 'alarm'); ev(24.93, 'beltStop'); ev(24.9, 'mark'); ev(CR.os, 'os', { d: 0.5 }); ev(CR.ctKey, 'key'); ev(T.ct, 'glitch'); ev(T.ct, 'gantry', { d: T.dawn - T.ct });
ev(CR.tw1, 'twitch'); ev(CR.tw2, 'twitch'); ev(CR.tw1 + 0.1, 'moved'); ev(CR.tags, 'count'); ev(CR.rule, 'panel'); ev(CR.verdict, 'no');
ev(T.dawn, 'glitch'); ev(33.5, 'scan', { d: 1.05 }); ev(DW.tag, 'tag'); ev(DW.pull0, 'pull', { d: DW.pull1 - DW.pull0 }); ev(DW.lights, 'lightsOff', { d: 1.8 });
ev(T.sum, 'cut'); SU.rows.forEach((r, i) => ev(r, 'beep', { i }));
ev(T.stop, 'cut'); ev(ST.belt0, 'beltStop', { d: ST.belt1 - ST.belt0, last: true }); ev(ST.dim0, 'powerDown'); ev(T.end, 'end');
// ---------------- the operator's voice and the subtitles (film time) ----------------
// Each clip is one sentence (voice/lines.json, Kokoro af_heart); its start in film time. Lengths are in voice/out/dur.json.
const VO = [['v01a', 0.55], ['v01b', 2.75], ['v02a', 4.70], ['v02b', 6.10], ['v03', 8.08], ['v04a', 11.50], ['v04b', 12.85], ['v05', 15.55],
  ['v06a', 20.30], ['v07a', 23.25], ['v07b', 24.80], ['v08a', 26.80], ['v08b', 28.35], ['v09a', 31.40], ['v09b', 32.75], ['v10', 35.60],
  ['v11a', 39.45], ['v11b', 40.95], ['v12', 43.00], ['v13', 45.70]];
// one Chinese line and one English line per cue, never wrapped; each cue >= 1.8 s and >= its spoken length + 0.6 s
const SUBS = [
  [0.40, 4.60, '我从来看不见旅客，只看见他们装了什么。', 'I never see the passengers. Only what they pack.'],
  [4.62, 8.02, '蓝色是金属，橙色是有机物。', 'Blue is metal. Orange is organic.'],
  [8.05, 10.85, '黑色，是射线穿不透。', 'Black: nothing gets through.'],
  [11.40, 15.10, '一个充电宝，74 瓦时。', 'A power bank. 74 watt-hours.'],
  [15.45, 19.06, '不到 100，可以随身带。', 'Under 100, it stays in the bag.'],
  [20.20, 22.75, '500 毫升。', '500 milliliters.'],
  [23.15, 26.50, '瓶子留下，包上飞机。', 'The bottle stays. The bag flies.'],
  [26.72, 30.12, '凌晨三点。六团东西。', '3 a.m. Six of something.'],
  [31.30, 35.50, '活螃蟹。捆好了，还有一只在蹬腿。', 'Live crabs. Tied up, and one still kicking.'],
  [35.55, 38.90, '活的海鲜，不能带进客舱。', "Live seafood can't fly in the cabin."],
  [39.40, 42.90, '5:52。不知是谁的早饭。', "5:52. Someone's breakfast."],
  [42.95, 45.55, '今晚 1,200 多个包。', 'Over 1,200 bags tonight.'],
  [45.60, 48.90, '每一个，我都从里到外看过。', 'I know every one of them inside out.']];
for (const [id, t] of VO) EV.push({ t, type: 'vo', id });
for (const [t0, t1, zh, en] of SUBS) EV.push({ t: t0, type: 'sub', t1, zh, en });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
// subtitles: the operator's log, bottom left in frame space (never on the judged object, never moves with the camera)
function subtitles(tf) {
  const GAP = 0.6;   // cues closer than this share one plate: it never blinks off between them
  let i = SUBS.findIndex(([t0, t1]) => tf >= t0 && tf < t1); let a = 1, plateW = null, cue = null;
  const meas = c => { font(36, 500, 'SC'); const w1 = g.measureText(c[2]).width; font(24, 400); return Math.max(w1, g.measureText(c[3]).width) + 48; };
  idT(); g.save(); g.scale(S, S);
  if (i < 0) {   // in a gap: keep the plate if the gap is short, morphing its width
    const j = SUBS.findIndex(([t0]) => t0 > tf); const p = j > 0 ? SUBS[j - 1] : null, n = j >= 0 ? SUBS[j] : null;
    if (p && n && n[0] - p[1] < GAP) { const k = eio(seg(tf, p[1], n[0])); plateW = lerp(meas(p), meas(n), k); cue = null; }
    else { g.restore(); return; }
  } else {
    cue = SUBS[i]; const [t0, t1] = cue; const prev = SUBS[i - 1], next = SUBS[i + 1];
    const joinIn = prev && t0 - prev[1] < GAP, joinOut = next && next[0] - t1 < GAP;
    const ain = joinIn ? 1 : Math.min(1, (tf - t0) / 0.12), aout = joinOut ? 1 : Math.min(1, (t1 - tf) / 0.12);
    a = Math.min(ain, aout); plateW = meas(cue);
  }
  const x = 96, h = 98, y = 1080 - 44 - h;
  g.globalAlpha = a; rr(x, y, plateW, h, 4); g.fillStyle = 'rgba(3,8,16,0.84)'; g.fill();
  g.fillStyle = 'rgba(232,242,255,0.9)'; g.fillRect(x, y + 14, 3, h - 28);
  if (cue) {
    const [t0, t1, zh, en] = cue; g.globalAlpha = a * Math.min(1, (tf - t0) / 0.12, (t1 - tf) / 0.12);
    txt(zh, x + 26, y + 34, 36, 'rgba(242,247,255,0.98)', 'left', 500, 'SC');
    txt(en, x + 26, y + 74, 24, 'rgba(184,208,246,0.94)', 'left', 400);
  }
  g.restore();
}

// ---------------- entry ----------------
function frameAt(t) {
  E.colMat.uniforms.uTime.value = t;
  if (shotAt(t) === 'ct') ctFrame(t); else monitorFrame(t);
  glitch(t, T.ct);   // into CT: a short, dim digital tear; out of CT the scan sweep does the work (a frozen torn frame would look broken)
}
// film-time cuts that get the scan sweep, with its length: the montage on the beat (short), the judged bags longer,
// the jump to 03:12 longest; out of CT a short tear, then the sweep back to the console. Into CT stays a (dim) digital tear; dawn → summary → stop are camera moves.
const SWEEPS = (() => { const L = []; const add = (s, d) => { const f = +filmT(s).toFixed(3); if (!L.some(x => Math.abs(x[0] - f) < 0.01)) L.push([f, d]); };
  for (let i = 0; i < MONT.length; i++) if (!WARP.some(([a, b, d]) => d === 0 && T.mont + i >= a && T.mont + i < b)) add(T.mont + i, i === 0 ? 0.3 : 0.22);
  add(T.pb, 0.4); add(T.wat, 0.45); add(T.crab, 0.55); add(T.dawn, 0.5); return L; })();
window.render = function (tf) {
  tf = Math.max(0, Math.min(DUR, +tf || 0)); TX = [];
  const sw = SWEEPS.find(([tc, d]) => tf >= tc && tf < tc + d);
  if (sw) { frameAt(story(sw[0] - 0.02)); snapG.globalCompositeOperation = 'copy'; snapG.drawImage(out, 0, 0); TX = []; }
  frameAt(story(tf));
  if (sw) sweepOver(eio((tf - sw[0]) / sw[1]));
  subtitles(tf);
};
window.TEXTS = function (t) { window.render(t); return TX.map(o => ({ id: o.id, text: o.text, x0: Math.max(0, o.x0), y0: Math.max(0, o.y0), x1: Math.min(W, o.x1), y1: Math.min(H, o.y1) })); };

await document.fonts.load('500 20px Plex'); await document.fonts.load('400 20px Plex');
await document.fonts.load('500 20px SC'); await document.fonts.load('700 20px SC');
makeIcons();
window.render(0);
window.READY = true;
