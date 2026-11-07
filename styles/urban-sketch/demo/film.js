// Where the Wind Went —— main timeline: camera, the hat, character performance, colour arrival, sound events
import { clamp, lerp, ss, TAU, rng, n2, fbm, hex, mix3, INK, PAPER, rgba, rough, arrivalField, sampleField, compositor, figure, drawPrims, hat, bike, penStroke, drawPen, dab, handwrite, ellipse, R3, LEAF } from './engine.js';
import { buildWorld, W, H, depthS, FIG_H, LAMP, BRIDGE, CROWNS, ORIGIN, inPage } from './world.js';
import { LOOK, sit, run, walk, stand, cycle, dive, prone, wave, mixPose } from './poses.js';
const { V } = R3;

export const BPM = 150, BEAT = 60 / BPM, BAR = BEAT * 3;
const DUR = 33.4;   // the picture holds the end card 1 s past the score (32.4 s), so the last colophon line stays 2.5 s
const q = new URLSearchParams(location.search);
await Promise.all([document.fonts.load('80px Caveat'), document.fonts.load('80px "Reenie Beanie"')]);

// ---------------- Helpers ----------------
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), ei = t => Math.pow(clamp(t), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
// Catmull-Rom over time (non-uniform)
function curve(keys) {
  const n = keys.length, T = keys.map(k => k[0]);
  const m = keys.map((k, i) => { if (k[3]) return k[3]; const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)]; const dt = b[0] - a[0] || 1; return [(b[1][0] - a[1][0]) / dt, (b[1][1] - a[1][1]) / dt]; });
  return t => {
    if (t <= T[0]) return keys[0][1].slice(); if (t >= T[n - 1]) return keys[n - 1][1].slice();
    let i = 0; while (t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], u = (t - T[i]) / h, u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return [0, 1].map(j => h00 * keys[i][1][j] + h10 * h * m[i][j] + h01 * keys[i + 1][1][j] + h11 * h * m[i + 1][j]);
  };
}
const Sof = y => FIG_H * depthS(y);

// ---------------- World ----------------
const world = buildWorld();

// ---------------- Character positions ----------------
const HER = { x: 3040, y: 2415, yaw: -.1 }, HIM0 = { x: 2870, y: 2420 };
HER.S = Sof(HER.y);
function herPose(t) {
  const blow = ss(seg(t, 4.7, 5.7)) * (1 - ss(seg(t, 7.5, 9))) + .25 * ss(seg(t, 24.2, 25));
  let p = sit({ side: -.12 + .04 * ss(seg(t, 5.4, 5.8)), headSide: -.12 * (1 - ss(seg(t, 5.4, 5.8))), hairBlow: blow * (1 + .15 * Math.sin(t * 9)) });
  // raises a hand to hold the hat — half a beat too late
  const reach = ss(seg(t, 5.55, 6.02)) * (1 - ss(seg(t, 6.9, 7.6)));
  if (reach > 0) p.handR = [lerp(.08, .05, reach), lerp(.2, .6, reach), lerp(.28, -.01, reach)], p.elbR = V(1, -.2, .3);
  // turns her head to watch the hat fly off
  const look = ss(seg(t, 6.05, 6.7));
  p.headYaw = lerp(0, -.95, look) * (1 - .6 * ss(seg(t, 9, 11))) + -.4 * ss(seg(t, 22, 23));
  p.nod = -.25 * look * (1 - ss(seg(t, 8, 9)));
  // ending: waves
  const wv = ss(seg(t, 26.2, 26.8));
  if (wv > 0) { p.handR = [lerp(.08, .16, wv), lerp(.2, .82 + .04 * Math.sin((t - 26.2) * 9), wv), lerp(.28, .06, wv)]; p.elbR = V(1, 0, 0); p.side = lerp(p.side, .05, wv); p.headYaw = .35 * wv; }
  return p;
}
// Him: sits → looks up → gets up → runs (footsteps on the beat) → misses the grab → runs to the street lamp → jumps → runs out of frame → sprints along the pond → dives → catches → gets up and raises the hat
const runPath = curve([[6.9, [2860, 2410]], [8.25, [2330, 2330]], [8.9, [2170, 2305]], [11.2, [1250, 2255]], [11.9, [1210, 2250]], [13.2, [1500, 2330]], [22.6, [3300, 2470]], [23.55, [3730, 2492]], [24.0, [3880, 2500]]]);
function him(t) {
  const P = { x: HIM0.x, y: HIM0.y, yaw: .12 };
  let pose;
  if (t < 6.45) {
    pose = sit({ side: .06, headYaw: -.25 * (1 - ss(seg(t, 5.9, 6.2))) - .6 * ss(seg(t, 6.05, 6.35)), nod: -.3 * ss(seg(t, 6.05, 6.35)), lean: -.05 + .15 * ss(seg(t, 6.2, 6.45)) });
  } else if (t < 6.95) {           // getting up: lean forward in anticipation → stand → turn to face left
    const u = seg(t, 6.45, 6.95);
    const s0 = sit({ side: .06, lean: .1, headYaw: -.6 }), st = run(0, .3, { headYaw: -.2 });
    st.hipY = .5;
    pose = mixPose(s0, st, eo(u)); P.yaw = lerp(.12, -Math.PI / 2, ss(seg(u, .2, 1)));
    const e = eo(u); pose.footL = [lerp(s0.footL[0], -.08, e), .03, lerp(s0.footL[2], .02, e)]; pose.footR = [lerp(s0.footR[0], .08, e), .03, lerp(s0.footR[2], -.03, e)];
    pose.handL = pose.handR = undefined;
    P.y = HIM0.y - 6 * Math.sin(u * Math.PI);
  } else if (t < 13.3) {
    const [x, y] = runPath(t); P.x = x; P.y = y; P.yaw = -Math.PI / 2 + .25;
    const ph = (t - 6.95) * TAU / (BEAT * 2);        // one cycle every two beats: one step per beat
    const k = ss(seg(t, 6.95, 7.3));
    pose = run(ph, k, { headYaw: .15, nod: -.2 });
    if (t > 8.2 && t < 8.95) {       // missed grab: reaches for the bouncing hat, stumbles
      const u = seg(t, 8.2, 8.95);
      pose.handR = V(.1, lerp(.45, .3, u), .42); pose.elbR = V(1, 0, 0); pose.lean = .5 * Math.sin(u * Math.PI) + .3; pose.nod = -.4;
    }
    if (t > 11.15 && t < 12.1) {     // jumps on the spot under the street lamp to grab it
      const u = seg(t, 11.15, 12.1), jump = Math.max(0, Math.sin(clamp((u - .15) / .6) * Math.PI));
      pose = mixPose(pose, stand({ headYaw: 0 }), ss(seg(u, 0, .15)) * (1 - ss(seg(u, .85, 1))));
      pose.handR = V(.08, lerp(.8, 1.18, jump), .12); pose.elbR = V(1, 0, 0); pose.nod = .45 * jump; pose.headYaw = -.3;
      P.y -= jump * 70; P.yaw = lerp(-Math.PI / 2 + .25, -2.4, ss(seg(u, 0, .2)));
    }
  } else if (t < 23.55) {
    const [x, y] = runPath(t); P.x = x; P.y = y; P.yaw = Math.PI / 2 - .15;
    pose = run((t - 6.95) * TAU / (BEAT * 2), 1, { headYaw: -.3, nod: .15 });
  } else if (t < 24.02) {          // dive
    const u = seg(t, 23.55, 24.0); const [x, y] = runPath(t); P.x = x; P.y = y - Math.sin(u * Math.PI) * 50; P.yaw = Math.PI / 2 - .1;
    pose = dive(u);
  } else if (t < 25.5) {           // lying on the bank, hand holding up the hat
    P.x = 3880; P.y = 2500; P.yaw = Math.PI / 2 - .1; pose = prone(ss(seg(t, 24.6, 25.4)));
  } else {                        // gets up → stands → raises the hat and waves
    P.x = 3880; P.y = 2500;
    const u = seg(t, 25.5, 26.3), e = eio(u);
    const up = { hipY: lerp(.09, .52, e), lean: lerp(1.45, 0, e), nod: lerp(-.6, 0, e), footL: V(-.07, .03, lerp(-.62, 0, ss(u * 1.3))), footR: V(.07, .03, lerp(-.58, .03, ss(u * 1.2))),
      handR: V(.12, lerp(.1, .55, e), lerp(.75, .12, e)), handL: V(-.14, lerp(.06, .45, e), lerp(.6, .05, e)), elbL: V(-1, 0, 0), elbR: V(1, 0, 0) };
    P.yaw = lerp(Math.PI / 2 - .1, Math.PI * .82, ss(seg(t, 25.8, 26.5)));
    pose = t > 26.3 ? mixPose(stand(), wave((t - 26.3) * 7), ss(seg(t, 26.3, 26.7))) : up;
  }
  P.S = Sof(P.y);
  return { pose, place: P };
}
// Every one of his steps (for the sound effects)
const STEPS = [];
for (let k = 0; ; k++) { const t = 6.95 + k * BEAT + BEAT * .5; if (t > 23.5) break; if ((t > 8.25 && t < 8.9) || (t > 11.2 && t < 12.1) || (t > 13.3 && t < 22.4)) continue; STEPS.push(+t.toFixed(3)); }

// ---------------- The hat ----------------
const herAt6 = figure(LOOK.her, herPose(5.999), { ...HER }, {}).head;
const catchPt = (() => { const h = him(24.0); return figure(LOOK.him, h.pose, h.place, {}).hand.R; })();
const HAT_R = 72;
const hatOnHead = (h, t) => [h.c[0] - 3, h.c[1] - h.r * .62];
const hatPath = curve([
  [6.0, hatOnHead(herAt6)], [6.5, [2965, 1965]], [7.1, [2770, 1880]], [7.8, [2510, 1990]], [8.4, [2280, 2200], [-380, 0]], [9.0, [2030, 2010]], [9.6, [1790, 1945]],
  [10.2, [1490, 1760]], [10.8, [1265, 1575]], [11.1, [1160, 1595]], [11.4, [1000, 1480]], [11.7, [1080, 1330]], [12.0, [1260, 1350]],
  [12.6, [1440, 1310]], [13.2, [1720, 1215]], [13.8, [1930, 1130]], [14.4, [2150, 1030]], [15.0, [2330, 900]], [15.6, [2450, 790]],
  [16.8, [2565, 610]], [18.0, [2700, 440]], [19.2, [2775, 335], [30, -20]], [20.4, [2790, 322]], [21.6, [2800, 332]],
  [21.95, [2860, 430]], [22.4, [3080, 790]], [22.9, [3420, 1300]], [23.4, [3800, 1900]], [23.8, [4120, 2300]], [24.0, catchPt]]);
function hatState(t, herHead, himHand) {
  if (t < 6.0) {
    const c = hatOnHead(herHead, t), fl = ss(seg(t, 4.8, 6.0));
    return { c, rot: [.12 + fl * .12 * Math.sin(t * 23), 0, -.08 + fl * .1 * Math.sin(t * 17 + 1)], r: HAT_R };
  }
  if (t >= 24.0 && himHand) { const c = [himHand[0] + 4, himHand[1] - 14]; return { c, rot: [.35 + .1 * Math.sin(t * 3), t * .5, .2], r: HAT_R }; }
  const c = hatPath(t), c2 = hatPath(t + .02), vx = (c2[0] - c[0]) / .02, vy = (c2[1] - c[1]) / .02;
  let rx = .5 + .9 * Math.sin(t * 2.3) + vy * .0006, ry = (t - 6) * 2.6, rz = clamp(vx * -.0012, -.8, .8) + .3 * Math.sin(t * 1.7);
  const hang = ss(seg(t, 19.0, 19.5)) * (1 - ss(seg(t, 21.5, 21.8)));
  ry = lerp(ry, 19.2 * 2.6 + (t - 19.2) * .9, hang); rx = lerp(rx, .25 + .08 * Math.sin(t * 1.3), hang); rz = lerp(rz, .1, hang);
  if (t > 21.6) { const f = ss(seg(t, 21.6, 22)); rx += f * (t - 21.6) * 5; }
  const bounce = Math.exp(-Math.pow((t - 8.4) / .08, 2));   // squashes once on touching the ground
  return { c: [c[0], c[1] + bounce * 6], rot: [rx, ry, rz], r: HAT_R * (1 + bounce * .06), sq: bounce };
}

// ---------------- Other people (frozen as line drawings until the colour reaches them)----------------
const extras = [
  { id: 'cycA', look: 'cyclA', bike: hex('#3f6a8a'), x0: 1700, y0: 1945, dir: [1, -.33], speed: 170, yaw: .95 },
  { id: 'cycB', look: 'cyclB', bike: hex('#b0453a'), x0: 1560, y0: 2010, dir: [1, -.33], speed: 185, yaw: .95, ph0: 1.3 },
  { id: 'jog', look: 'jog', x0: 1480, y0: 2000, dir: [-1, .26], speed: 150, yaw: -1.95, type: 'jog' },
  { id: 'walkA', look: 'walkA', x0: 520, y0: 2255, dir: [1, -.2], speed: 55, yaw: Math.PI / 2 - .3, type: 'walk' },
  { id: 'walkB', look: 'walkB', x0: 590, y0: 2262, dir: [1, -.2], speed: 55, yaw: Math.PI / 2 - .3, type: 'walk', ph0: 2 },
  { id: 'picA', look: 'picA', x0: 1960, y0: 2405, type: 'sit', yaw: 2.3, watch: 1 },
  { id: 'picB', look: 'picB', x0: 1830, y0: 2395, type: 'sit', yaw: 2.0, watch: 1 },
  { id: 'picC', look: 'picC', x0: 3330, y0: 2060, type: 'sit', yaw: -2.2 },
  { id: 'picD', look: 'walkB', x0: 3420, y0: 2070, type: 'sit', yaw: -2.6 },
];

// ---------------- Colour arrival field ----------------
const src = [];
src.push({ x: 2960, y: 2330, t: 6.0, v: 520, R: 430, sy: 1.4 });
for (let t = 6.0; t <= 24.0; t += .04) {
  const [x, y] = hatPath(t);
  const R = t < 12 ? 360 : t < 15.6 ? 520 : t < 21.6 ? 760 : 400;
  const sky = t >= 15.3 && t < 21.7;
  src.push({ x, y: y + (t < 12 ? 120 : 0), t: t + .12, v: 900, R, mask: sky ? (px, py) => py < 1480 && !world.insideBuilding(px, py) : (px, py) => py > 1480 || !world.insideBuilding(px, py) });
}
[12.0, 13.2, 14.4].forEach((tb, k) => { const c = CROWNS['beat' + k]; src.push({ x: c.x, y: c.y, t: tb, v: 1500, R: c.r }); });
src.push({ x: LAMP.x, y: 1800, t: 10.85, v: 1300, R: 460, sy: .5 });
src.push(...world.bSources.map(b => ({ ...b, hard: 1, noise: .3 })));
src.push({ x: 2650, y: 700, t: 16.0, v: 1100, R: 2300, mask: (px, py) => py < 1480 && !world.insideBuilding(px, py) });
src.push({ x: catchPt[0], y: 2640, t: 24.02, v: 650, R: 800, sy: 2 });
src.push({ x: catchPt[0], y: 2560, t: 24.3, v: 1300, R: 1e5 });
const GW = 640, GH = 360;
const arr = q.get('full') ? new Float32Array(GW * GH).fill(0) : arrivalField(W, H, GW, GH, src, { amp: 240 });
const T = (x, y) => sampleField(arr, W, H, GW, GH, x, y);
window.__ARR = arr;

// ---------------- Camera ----------------
// Designed moves (eased) + a spring that follows the hat (with a sense of lag), blended with per-section weights
const followT = t => { const c = hatPath(t), c2 = hatPath(t + .15); const vx = c2[0] - c[0], vy = c2[1] - c[1]; return [c[0] + vx * .9 - 40, c[1] + vy * .6 + 70]; };
const SPR = []; { let p = followT(6.0), v = [0, 0]; const dt = 1 / 240; for (let t = 6.0; t <= 24.5; t += dt) { const k = t > 21.6 ? 70 : 28, d = 2 * Math.sqrt(k); const g = followT(t); for (let j = 0; j < 2; j++) { const a = k * (g[j] - p[j]) - d * v[j]; v[j] += a * dt; p[j] += v[j] * dt; } SPR.push([p[0], p[1]]); } }
const spring = t => SPR[clamp(Math.round((t - 6.0) * 240), 0, SPR.length - 1)];
function camera(t) {
  let c;
  const A = [2978, 2250, 1.72], A2 = [2968, 2242, 1.82], B = [2760, 2040, .8], C = [2850, 2095, 1.0];
  if (t < 2.4) c = A.map((v, i) => lerp(v, A2[i], ss(t / 2.4)));
  else if (t < 4.7) c = A2.map((v, i) => lerp(v, B[i], eio(seg(t, 2.4, 4.6))));
  else if (t < 6.0) c = B.map((v, i) => lerp(v, C[i], ss(seg(t, 4.7, 6.0))));
  else if (t < 10.8) { const s = spring(t), w = ss(seg(t, 6.0, 6.9)); c = [lerp(C[0], s[0], w), lerp(C[1], s[1], w), lerp(1.0, 1.06, seg(t, 6, 10.8))]; }
  else if (t < 12.0) { const s = spring(t), u = ss(seg(t, 10.8, 11.3)) * (1 - ss(seg(t, 11.7, 12.0))); c = [lerp(s[0], 1180, u * .7), lerp(s[1], 1560, u * .6), lerp(1.06, 1.28, u)]; }
  else if (t < 15.6) { const s = spring(t); c = [s[0] + 40, s[1] + 60, lerp(1.06, .82, eio(seg(t, 12, 15.6)))]; }
  else if (t < 19.2) { const s = spring(15.6), u = eio(seg(t, 15.6, 18.6)), u2 = ss(seg(t, 18.4, 19.2)); c = [lerp(s[0] + 40, 2700, u), lerp(s[1] + 60, 780, u), lerp(.82, .56, u)]; c = [lerp(c[0], 2745, u2), lerp(c[1], 520, u2), lerp(c[2], .74, u2)]; }
  else if (t < 21.6) { const h = hatPath(t), u = eio(seg(t, 19.2, 21.6)); c = [lerp(2745, h[0] - 40, u), lerp(520, h[1] + 45, u), lerp(.74, 1.75, u)]; }
  else if (t < 24.0) { const s = spring(t), h = hatPath(21.6), u = ss(seg(t, 21.6, 22.1)); c = [lerp(h[0] - 40, s[0], u), lerp(h[1] + 45, s[1] + 40, u), lerp(1.75, .92, eo(seg(t, 21.6, 22.2))) + .25 * ss(seg(t, 23.4, 24))]; }
  else if (t < 25.2) { const s = spring(24.0), u = eo(seg(t, 24.0, 24.18)); c = [lerp(s[0], 4150, u), lerp(s[1] + 40, 2395, u), lerp(1.17, 1.45, u)]; }
  else if (t < 29.8) { const u = eio(seg(t, 25.2, 29.4)); c = [lerp(4150, W / 2, u), lerp(2395, H / 2, u), lerp(1.5, 1920 / W, eo(seg(t, 25.2, 29.4)) * .35 + u * .65)]; }
  else { const u = eio(seg(t, 29.8, 30.9)); c = [lerp(W / 2, 1320, u), lerp(H / 2, 2830, u), lerp(1920 / W, .8, u)]; }
  const rot = t > 21.6 && t < 24 ? .025 * Math.sin((t - 21.6) * 2.2) * (1 - ss(seg(t, 23.4, 24))) : 0;
  let shake = [0, 0]; if (t > 24 && t < 24.35) { const k = (1 - seg(t, 24, 24.35)) * 5; shake = [Math.sin(t * 91) * k, Math.cos(t * 77) * k]; }
  return { cx: c[0] + shake[0], cy: c[1] + shake[1], z: c[2], rot };
}

// ---------------- Picture ----------------
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
const glc = document.createElement('canvas'); glc.width = 1920; glc.height = 1080;
const comp = compositor(glc, { ...world, arr, gw: GW, gh: GH });
// Paper grain (multiplied over everything on top, figures included)
const tooth = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512); const R = rng(77);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const v = n2(i * .35, j * .35, 3) * .6 + n2(i * .09, j * .09, 5) * .4; const g = 255 - Math.max(0, (v - .55)) * 55 - (R() < .004 ? 25 : 0); const k = (j * 512 + i) * 4; im.data[k] = g; im.data[k + 1] = g * .995; im.data[k + 2] = g * .985; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return c; })();
const toothPat = ctx.createPattern(tooth, 'repeat');

const boilOf = t => Math.floor(t * 12);
const inkIn = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
// "Being drawn" for dynamic objects: primitives appear one after another in order
function inkProgress(prims, t, t0, t1) {
  const inks = prims.filter(p => p.k === 'ink'), n = inks.length; const u = inkIn(t, t0, t1);
  const map = new Map(); inks.forEach((p, i) => map.set(p, clamp(u * n - i * .75)));
  return p => map.get(p) ?? 1;
}
// Clip for the colour bloom: a noisy circle growing from the centre
const bloomClip = (cx, cy, R, seed) => ctx2 => { ctx2.beginPath(); const n = 24; for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = R * (.8 + .4 * n2(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y); } ctx2.closePath(); };

function drawFigure(prims, t, o) { drawPrims(ctx, prims, o); }
function colorAt(x, y, t) { return clamp((t - T(x, y) - .05) / .45); }

// Figure shadows
function shadow(x, y, S, a = .3, col = hex('#6f8a55'), long = 0) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.ellipse(x + S * lerp(.08, .32, long), y + S * lerp(.005, .01, long), S * lerp(.17, .55, long), S * lerp(.035, .05, long), 0, 0, TAU); ctx.fill(); ctx.restore(); }

function drawExtra(e, t) {
  const Ta = T(e.x0, e.y0), u = Math.max(0, t - Ta), ramp = u < .6 ? u * u / 1.2 : u - .3;   // frozen → starts moving
  const d = Math.hypot(e.x0 - ORIGIN[0], (e.y0 - ORIGIN[1]) * 1.3), tInk = 2.3 + d / 1500;
  if (t < tInk) return;
  const x = e.x0 + (e.dir?.[0] ?? 0) * (e.speed ?? 0) * ramp, y = e.y0 + (e.dir?.[1] ?? 0) * (e.speed ?? 0) * ramp, S = Sof(y);
  if (y < 1790 || x < -300 || x > W + 300) return;
  const place = { x, y, S, yaw: e.yaw }, col = clamp((t - Ta - .05) / .45), fade = clamp((y - 1790) / 60);
  if (fade < 1) { ctx.save(); ctx.globalAlpha = fade; }
  const opts = { seed: e.id.length * 100 + (e.x0 | 0), boil: col > 0 ? boilOf(t) : 0 };
  let prims = [];
  if (e.bike) { const ph = (e.ph0 ?? 0) + ramp * 7; prims = [...bike(place, ph * 1.2, e.bike, { seed: opts.seed }), ...figure(LOOK[e.look], cycle(ph), place, opts)]; }
  else if (e.type === 'jog') prims = figure(LOOK[e.look], run((e.ph0 ?? 0) + ramp * 9, .7), place, opts);
  else if (e.type === 'walk') prims = figure(LOOK[e.look], walk((e.ph0 ?? 0) + ramp * 6), place, opts);
  else if (e.type === 'sit') {
    const hp = hatPath(clamp(t, 6, 24)), look = e.watch ? clamp(Math.atan2(hp[0] - x, 300) * .8, -1.2, 1.2) : .3 * Math.sin(t * .7 + e.x0);
    prims = figure(LOOK[e.look], sit({ headYaw: col > 0 ? look - (e.yaw - Math.PI) * .3 : 0, side: .05 }), place, opts);
  } else if (e.type === 'row') {
    const ph = ramp * 3.2, s = Math.sin(ph);
    const boat = [[x - S * .5, y - S * .04], [x - S * .42, y + S * .06], [x + S * .4, y + S * .06], [x + S * .55, y - S * .06]];
    drawPrims(ctx, [{ k: 'knock', poly: boat }, { k: 'wash', poly: boat, col: hex('#9a6a4a'), a: .6 }, { k: 'ink', st: penStroke([...boat], { w: 2, wob: .6, seed: 5, smooth: false }) }], { color: col });
    const oar = [[x + S * .05, y - S * .25], [x - S * .45 * s - S * .1, y + S * .1]];
    prims = [...figure(LOOK[e.look], { ...sit({}), hipY: .12, handL: V(-.12, .35, .2 + s * .12), handR: V(.12, .35, .2 + s * .12), lean: -.2 + s * .25 }, { ...place, y: y - S * .02 }, opts), { k: 'ink', st: penStroke(oar, { w: 2.2, wob: .4, seed: 9, smooth: false }) }];
    for (let k = 0; k < 3; k++) { const rr = ((ramp * .6 + k / 3) % 1); if (col > 0) { ctx.save(); ctx.strokeStyle = rgba(INK, .5 * (1 - rr)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x - S * .5, y + S * .07, S * (.1 + rr * .5), S * (.02 + rr * .07), 0, 0, Math.PI); ctx.stroke(); ctx.restore(); } }
  }
  if (e.type !== 'row') shadow(x, y, S, .3 * col);
  const inkP = inkProgress(prims, t, tInk, tInk + .35);
  drawPrims(ctx, prims, { color: col, ink: inkP, clip: col < 1 ? bloomClip(x, y - S * .45, S * 1.1 * eo(col), opts.seed) : null });
  if (fade < 1) ctx.restore();
}

// Wind strokes: behind the hat, one "~@"-shaped wind line per beat, drawn on and then erased from the tail
function windCurls(t) {
  if (t < 5.6 || t > 24.2) return;
  for (let k = -3; k < 50; k++) {
    const tk = 6.0 + k * BEAT; const age = t - tk; if (age < 0 || age > 1.3 || tk > 23.9) continue;
    if (tk > 20.2 && tk < 21.6) continue;                   // silent section: no wind
    const base = tk < 6 ? [3150 + (tk - 6) * -420, 2060 + (tk - 6) * 30] : hatPath(tk - .15), nx = tk < 6 ? [base[0] - 30, base[1]] : hatPath(tk - .05);
    let dx = nx[0] - base[0], dy = nx[1] - base[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const side = k % 2 ? 1 : -1, sz = 30 + 14 * n2(k, 1), L = sz * 4.2;
    const ox = base[0] - dx * 70 - dy * side * (60 + 20 * n2(k, 4)), oy = base[1] - dy * 70 + dx * side * (60 + 20 * n2(k, 4));
    const pts = [];
    for (let i = 0; i <= 18; i++) { const u = i / 18, along = -L + u * L, wv = Math.sin(u * Math.PI * 1.5) * sz * .25 * side; pts.push([ox + dx * along - dy * wv, oy + dy * along + dx * wv]); }
    for (let i = 1; i <= 22; i++) { const a = i / 22 * TAU * 1.15, r = sz * .5 * (1 - i / 22 * .6); const cx = ox - dy * side * sz * .5, cy = oy + dx * side * sz * .5; const ang = Math.atan2(-dx * side, -dy * side) * 0 + a; const lx = Math.sin(a) * r, ly = -Math.cos(a) * r; pts.push([cx + dx * lx - dy * side * ly * -1, cy + dy * lx + dx * side * ly * -1]); }
    const st = penStroke(pts, { w: 2.1, wob: .6, seed: 300 + k, over: 1 });
    drawPen(ctx, st, eo(age / .4), INK, .8, ei(clamp((age - .55) / .75)));
  }
}
// Gust: a few long wind lines sweeping in from the right at 4.6–6.2 s (the wind is "drawn" before the hat)
function gust(t) {
  if (t < 4.5 || t > 6.6) return;
  for (let k = 0; k < 5; k++) {
    const t0 = 4.6 + k * .28, age = t - t0; if (age < 0 || age > 1.2) continue;
    const y0 = 1820 + k * 55 + 25 * n2(k, 2), x1 = 3560 - k * 40, x0 = x1 - 900;
    const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(x1, x0, u), y = y0 + Math.sin(u * 5 + k) * 14 - u * 30; pts.push([x, y]); }
    const cx = x0 + 10, cy = y0 - 30; for (let i = 1; i <= 16; i++) { const a = i / 16 * TAU * .95, r = 34 * (1 - i / 16 * .55); pts.push([cx - Math.sin(a) * r, cy + 30 - 30 * 0 - Math.cos(a) * r + r * 0]); }
    drawPen(ctx, penStroke(pts, { w: 2.2, wob: .7, seed: 600 + k, over: 2 }), eo(age / .5), INK, .75, ei(clamp((age - .5) / .7)));
  }
}
// Leaves picked up by the wind (wash dab + one ink stroke)
function leaves(t) {
  if (t < 6.1 || t > 16.5) return;
  for (let i = 0; i < 12; i++) {
    const lag = .25 + i * .09, tt = t - lag; if (tt < 6.0) continue;
    const c = hatPath(tt), ox = Math.sin(tt * 3.1 + i) * (40 + i * 6), oy = Math.cos(tt * 2.3 + i * 2) * (30 + i * 5) + i * 6;
    const x = c[0] + ox, y = c[1] + oy, a = t * 5 + i, sz = 9 + (i % 3) * 3;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; dab(ctx, x, y, sz, a, [LEAF.light, LEAF.mid, LEAF.sun][i % 3], .75, i + boilOf(t) * 3); ctx.restore();
    drawPen(ctx, penStroke([[x - Math.cos(a) * sz, y - Math.sin(a) * sz], [x + Math.cos(a) * sz * 1.2, y + Math.sin(a) * sz * 1.2]], { w: 1.4, wob: .3, seed: i, over: 0 }), 1, INK, .7);
  }
}
// Ripples where something skims the pond
function ripples(t) {
  if (t < 24.0 || t > 28) return;
  for (let k = 0; k < 4; k++) { const a = t - 24.0 - k * .22; if (a < 0) continue; const r = 20 + a * 140, al = clamp(1 - a / 2.2) * .8;
    ctx.save(); ctx.strokeStyle = rgba(INK, al); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(catchPt[0] + 10, 2610, r, r * .22, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
}

// Handwriting: opening annotation, title, credit
const NOTE = 'Sun. 3:40 pm — windy';
function notes(t) {
  handwrite(ctx, NOTE, 2640, 2010, 46, eo(seg(t, 1.55, 2.35)), { font: '"Reenie Beanie"', col: INK, alpha: .9, rot: -.03 });
  handwrite(ctx, 'Where the wind went.', 250, 2660, 190, seg(t, 28.2, 29.5), { font: 'Caveat', weight: 500, col: INK });
  const ex = 275, ey = 2870;   // small colophon text below the title (left-aligned, in the same column as the title)
  handwrite(ctx, 'Urban Sketch \u00b7 Pen & Wash  \u2014  a Lemo-Opuscar style', ex, ey, 74, seg(t, 29.6, 30.2), { font: 'Caveat', alpha: .88 });
  handwrite(ctx, 'LemoLab \u00d7 Claude Opus 5.5', ex, ey + 100, 92, seg(t, 29.9, 30.4), { font: 'Caveat', weight: 600 });
  handwrite(ctx, 'music & sound: original, played on CC0 samples (VSCO 2 CE \u00b7 VCSL \u00b7 Karoryfer)   \u00b7   fonts: Caveat, Reenie Beanie (OFL)', ex, ey + 180, 48, seg(t, 30.2, 30.9), { font: 'Caveat', alpha: .78 });
}

window.DUR = DUR;
window.render = t => {
  const cam = camera(t);
  comp(cam, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(glc, 0, 0);
  // world coordinates
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot);
  ctx.setTransform(cam.z * c, cam.z * s, -cam.z * s, cam.z * c, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy));
  // figures from far to near by depth (y)
  const hs = him(t), herP = herPose(t), herPrims = figure(LOOK.her, herP, { ...HER }, { seed: 50, boil: boilOf(t) });
  const himPrims = figure(LOOK.him, hs.pose, hs.place, { seed: 70, boil: boilOf(t) });
  const hst = hatState(t, herPrims.head, t >= 24.0 ? himPrims.hand.R : null);
  const coupleCol = colorAt(2960, 2300, t);
  const items = [];
  for (const e of extras) items.push({ y: e.y0, draw: () => drawExtra(e, t) });
  items.push({ y: HER.y, draw: () => {
    shadow(HER.x, HER.y, HER.S * 1.4, .32 * coupleCol);
    drawPrims(ctx, herPrims, { color: coupleCol, ink: inkProgress(herPrims, t, .12, 1.15), clip: coupleCol < 1 ? bloomClip(2960, 2280, 420 * eo(coupleCol), 3) : null });
  } });
  items.push({ y: hs.place.y + .5, draw: () => {
    const cc = coupleCol;
    const lying = t > 23.9 ? clamp(1 - seg(t, 25.5, 26.1)) : 0;
    shadow(hs.place.x, hs.place.y, hs.place.S * (t < 6.5 ? 1.4 : 1), .3 * cc, undefined, lying);
    drawPrims(ctx, himPrims, { color: cc, ink: inkProgress(himPrims, t, .55, 1.6), clip: cc < 1 ? bloomClip(2960, 2280, 420 * eo(cc), 3) : null });
  } });
  items.sort((a, b) => a.y - b.y);
  gust(t);
  for (const it of items) it.draw();
  // wind, leaves, hat (the hat is always in front)
  windCurls(t); leaves(t); ripples(t);
  const hatPrims = hat(hst.c, hst.r, hst.rot, { seed: 9 + (t > 6 ? boilOf(t) * 7 : 0) });
  const hatCol = clamp((t - 1.75) / .35);
  if (t > 6.05 && t < 24.0) { const halo = rough(ellipse(hst.c[0], hst.c[1] - hst.r * .1, hst.r * 1.12, hst.r * .86, 20), hst.r * .12, boilOf(t)); drawPrims(ctx, [{ k: 'knock', poly: halo, a: .32 }], {}); }
  if (t > 1.05) drawPrims(ctx, hatPrims, { color: hatCol, ink: inkProgress(hatPrims, t, 1.05, 1.5), clip: hatCol < 1 ? bloomClip(hst.c[0], hst.c[1], hst.r * 1.4 * eo(hatCol), 9) : null });
  notes(t);
  // paper grain
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat;
  ctx.setTransform(cam.z * c * .8, cam.z * s * .8, -cam.z * s * .8, cam.z * c * .8, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy));
  const iz = 1 / (cam.z * .8); ctx.fillRect((cam.cx - 1300 / cam.z) / .8, (cam.cy - 800 / cam.z) / .8, 2600 * iz, 1600 * iz); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ---------------- Sound events ----------------
const EV = [];
EV.push({ t: 1.8, type: 'hatColor' }, { t: 4.4, type: 'windIn' }, { t: 4.6, type: 'gust' }, { t: 6.0, type: 'hatLift' }, { t: 8.4, type: 'bounce' }, { t: 8.45, type: 'miss' }, { t: 9.55, type: 'bell' }, { t: 9.95, type: 'bell' },
  { t: 11.55, type: 'jump' }, { t: 10.8, type: 'lampSpin' }, { t: 12.0, type: 'tree' }, { t: 13.2, type: 'tree' }, { t: 14.4, type: 'tree' }, { t: 19.2, type: 'apex' }, { t: 20.4, type: 'silence' },
  { t: 21.6, type: 'fall' }, { t: 23.55, type: 'dive' }, { t: 24.0, type: 'catch' }, { t: 24.02, type: 'splash' }, { t: 28.2, type: 'writeTitle', d: 1.3 }, { t: 29.6, type: 'writeCredits', d: 1.3 }, { t: 1.55, type: 'writeNote', d: .8 });
for (const st of STEPS) EV.push({ t: st, type: 'step', surf: st > 22 ? 'stone' : 'grass' });
window.EV = EV;
// Hat trajectory (for sound: tumbling loudness follows speed, panning follows screen position)
window.TRACK = () => { const out = []; for (let t = 0; t <= DUR; t += .02) { const c = t < 6 ? hatOnHead(herAt6) : t >= 24 ? catchPt : hatPath(t), c2 = t < 6 ? c : hatPath(Math.min(24, t + .02)); const cam = camera(t); const sx = (c[0] - cam.cx) * cam.z / 960; out.push([+t.toFixed(2), Math.round(Math.hypot(c2[0] - c[0], c2[1] - c[1]) / .02 * cam.z), +clamp(sx, -1, 1).toFixed(3)]); } return out; };
window.STROKES = world.strokes;
window.READY = true;
