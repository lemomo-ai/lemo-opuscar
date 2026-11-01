// Last Stroke — Stickman Action demo. Two rivals drawn on one sheet fight until one stroke decides it, then help each other up.
import { proportions, figure, drawFigure, drawFigureDrawing, shadow, partial, INK, PAPER } from './stick.js';
import { paperCanvas, ground, smear, sparks, speedRadial, speedH, dust, shockwave, aura, rgba } from './fx.js';
import { applyCam } from './cam.js';
import { POSE as Q, track } from './moves.js';

const W = 1920, H = 1080, DUR = 57.5;
const RED = '#e8343a', BLUE = '#1fb5e8', DESK = '#2f2a27';
const SHEET = { x0: -1500, x1: 1500, y0: -1300, y1: 1000 };
// on-screen words (tools/fonts.py subsets the CJK font from this file)
const TEXT = { title: 'LAST STROKE', titleCn: '最后一笔', style: 'STICKMAN ACTION · 火柴人动作', credit: 'khubaib-ctrl × LemoLab × Claude Opus 5.5' };

const qs = new URLSearchParams(location.search);
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
const g = cv.getContext('2d');
await document.fonts.load('400 120px Anton', 'LAST STROKE'); await document.fonts.load('900 80px SC', TEXT.titleCn + TEXT.style); await document.fonts.load('600 40px BSC', TEXT.credit);
const PAPERC = paperCanvas(W, H);
const PR = proportions(290, { spine: .3 }), PB = proportions(320, { thigh: .26, shin: .26, upper: .19, fore: .19 });

// —— timeline (140 BPM; one beat = 0.4286 s) ——
const T = { title: 6.857, titleOut: 11.0, dash: 11.14, hit1: 17.14, hit2: 18.14, offPage: 19.6, grip: 20.9, cut2: 25.71, power: 27.4, clash: 33.0, slowEnd: 34.8, last: 35.7, pass: 41.2, fall: 43.6, offer: 48.6, grab: 49.0, pull: 50.5, end: 51.4 };
const charge = (P, x, f) => ({ ...Q.stance(P, x, f, 34), sp: 18, hd: -14, aN: [-35, 50], aF: [-45, 60] });

const R = track(PR, [
  [0, Q.upright(PR, -440, 1)], [5.3, Q.upright(PR, -440, 1)], [5.9, Q.stance(PR, -440, 1)], [8.5, Q.stance(PR, -440, 1, 6)], [11.0, Q.stance(PR, -440, 1)],
  [T.dash, Q.stance(PR, -440, 1, 22)], [11.35, Q.dash(PR, -430, 1, 0), 'o'], [11.55, Q.dash(PR, -290, 1, 1), 'l'], [11.72, Q.chamber(PR, -190, 1), 'o'],
  [11.82, Q.punch(PR, -190, 1), 'o'], [12.0, Q.stance(PR, -190, 1)],
  [12.15, Q.block(PR, -190, 1), 'o'], [12.4, Q.block(PR, -195, 1)],
  [12.55, Q.stance(PR, -200, 1)], [12.68, Q.kickHigh(PR, -200, 1), 'o'], [12.9, Q.stance(PR, -200, 1)],
  [13.02, Q.stance(PR, -200, 1, 28)], [13.25, Q.jump(PR, -195, 1, 120), 'o'], [13.45, Q.jump(PR, -190, 1, 40), 'i'], [13.52, Q.stance(PR, -190, 1, 34), 'i'],
  [13.62, Q.punch(PR, -185, 1), 'o'], [13.85, Q.stance(PR, -205, 1)],
  [13.92, Q.chamber(PR, -205, 1)], [14.0, Q.punch(PR, -205, 1), 'o'], [14.1, Q.chamber(PR, -205, 1)], [14.2, Q.punchF(PR, -205, 1), 'o'], [14.3, Q.chamber(PR, -205, 1)], [14.4, Q.punch(PR, -205, 1), 'o'], [14.6, Q.stance(PR, -205, 1)],
  [15.0, Q.punch(PR, -180, 1), 'o'], [16.2, Q.punch(PR, -176, 1), 's'], [16.45, Q.stance(PR, -310, 1), 'o'],
  [16.7, Q.chamber(PR, -310, 1)], [16.95, { ...Q.chamber(PR, -320, 1), y: Q.chamber(PR, -320, 1).y + 18 }], [17.1, Q.punch(PR, -60, 1), 'o'],
  [17.16, Q.fold(PR, -45, 1), 'o'], [17.31, Q.fold(PR, -45, 1)], [17.8, Q.hitBack(PR, -260, 1), 'o'], [18.1, Q.hitBack(PR, -262, 1)],
  [18.2, Q.tumble(PR, -340, 1, -300, -40), 'o'], [18.7, Q.tumble(PR, -860, 1, -470, -130), 'l'], [19.2, Q.tumble(PR, -1360, 1, -360, -220), 'l'], [19.6, Q.tumble(PR, -1720, 1, -60, -280), 'i'],
  [T.grip, Q.hang(PR, -1500, 1, 0), 'h'], [21.8, Q.hang(PR, -1500, 1, 0)], [22.1, Q.hang(PR, -1500, 1, -14), 'io'], [22.7, Q.hang(PR, -1500, 1, 150), 'o'], [23.0, Q.hang(PR, -1500, 1, 175)],
  [23.4, Q.kneel(PR, -1430, 1), 'io'], [24.0, Q.upright(PR, -1400, 1), 'io'], [24.6, Q.stance(PR, -1400, 1)],
  [24.9, Q.dash(PR, -1250, 1, 0), 'o'], [25.25, Q.dash(PR, -900, 1, 1), 'l'], [25.6, Q.dash(PR, -560, 1, 0), 'l'],
  [T.cut2, Q.dash(PR, -500, 1, 1), 'h'], [25.95, Q.slide(PR, -320, 1), 'o'], [26.5, Q.stance(PR, -320, 1)],
  [T.power, Q.stance(PR, -320, 1)], [29.5, charge(PR, -320, 1), 'io'], [32.45, charge(PR, -320, 1)],
  [32.75, Q.dash(PR, -170, 1, 0), 'o'], [T.clash, Q.punch(PR, -112, 1), 'o'], [T.slowEnd, Q.punch(PR, -140, 1), 'l'],
  [35.2, Q.slide(PR, -480, 1), 'o'], [35.7, Q.stance(PR, -520, 1)], [36.4, Q.stance(PR, -520, 1)], [37.6, Q.iai(PR, -520, 1), 'io'], [41.1, Q.iai(PR, -520, 1)],
  [T.pass, Q.dash(PR, -40, 1, 0), 'o'], [41.32, Q.passed(PR, 480, 1), 'o'], [T.fall + .3, Q.passed(PR, 480, 1)], [44.3, Q.kneel(PR, 480, 1), 'io'], [45.6, Q.kneel(PR, 480, 1)],
  [46.3, Q.upright(PR, 480, 1), 'io'], [46.45, Q.upright(PR, 480, -1), 'h'],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [46.65 + i * .24, Q.step(PR, 480 - (i + 1) * 92, -1, i % 2 === 0), 'l']),
  [T.offer, Q.offer(PR, -300, -1), 'io'], [49.2, Q.offer(PR, -300, -1)], [50.0, { ...Q.upright(PR, -290, -1), sp: -6, aN: [70, 6] }, 'io'], [50.6, { ...Q.upright(PR, -290, -1), aN: [55, 10] }], [DUR, { ...Q.upright(PR, -290, -1), aN: [55, 10] }],
]);
const B = track(PB, [
  [0, Q.upright(PB, 460, -1)], [5.5, Q.upright(PB, 460, -1)], [6.1, Q.guardTall(PB, 460, -1)], [11.0, Q.guardTall(PB, 460, -1)],
  [T.dash, Q.stance(PB, 460, -1, 16)], [11.35, Q.dash(PB, 460, -1, 0), 'o'], [11.55, Q.dash(PB, 300, -1, 1), 'l'], [11.74, Q.block(PB, 190, -1), 'o'], [12.0, Q.stance(PB, 190, -1)],
  [12.12, Q.chamber(PB, 190, -1)], [12.23, Q.punch(PB, 190, -1), 'o'], [12.42, Q.stance(PB, 190, -1)],
  [12.62, Q.crouch(PB, 195, -1), 'o'], [12.85, Q.stance(PB, 195, -1)],
  [13.0, Q.crouch(PB, 195, -1)], [13.12, Q.kickLow(PB, 195, -1), 'o'], [13.4, Q.stance(PB, 200, -1)],
  [13.58, Q.block(PB, 200, -1), 'o'], [13.85, Q.stance(PB, 215, -1)],
  [13.98, Q.block(PB, 212, -1), 'o'], [14.1, Q.guardTall(PB, 212, -1)], [14.18, Q.block(PB, 212, -1), 'o'], [14.3, Q.guardTall(PB, 212, -1)], [14.38, Q.block(PB, 212, -1), 'o'], [14.6, Q.stance(PB, 210, -1)],
  [15.0, Q.punch(PB, 172, -1), 'o'], [16.2, Q.punch(PB, 176, -1), 's'], [16.45, Q.stance(PB, 300, -1), 'o'],
  [17.0, Q.stance(PB, 260, -1)], [T.hit1, Q.kickHigh(PB, 150, -1), 'o'], [17.31, Q.kickHigh(PB, 150, -1)], [17.6, Q.stance(PB, 170, -1)],
  [17.95, Q.spinChamber(PB, -60, -1), 'io'], [T.hit2, Q.backKick(PB, -100, -1), 'o'], [18.45, Q.backKick(PB, -100, -1)], [18.95, Q.stance(PB, -100, -1)],
  [25.6, Q.stance(PB, -100, -1)], [T.cut2, Q.guardTall(PB, 300, -1), 'h'],
  [T.power, Q.guardTall(PB, 300, -1)], [29.5, charge(PB, 300, -1), 'io'], [32.45, charge(PB, 300, -1)],
  [32.75, Q.dash(PB, 150, -1, 0), 'o'], [T.clash, Q.punch(PB, 112, -1), 'o'], [T.slowEnd, Q.punch(PB, 140, -1), 'l'],
  [35.2, Q.slide(PB, 480, -1), 'o'], [35.7, Q.stance(PB, 520, -1)], [36.4, Q.stance(PB, 520, -1)], [37.6, Q.iai(PB, 520, -1), 'io'], [41.1, Q.iai(PB, 520, -1)],
  [T.pass, Q.dash(PB, 40, -1, 0), 'o'], [41.32, Q.passed(PB, -480, -1), 'o'], [T.fall, Q.passed(PB, -480, -1)],
  [T.fall + .15, Q.hitBack(PB, -480, -1), 'o'], [44.0, Q.fold(PB, -500, 1, -150), 'i'], [44.4, Q.lying(PB, -540, 1), 'i'], [T.grab, Q.lying(PB, -540, 1)],
  [49.4, { ...Q.sitUp(PB, -540, 1), aN: [80, 4] }, 'io'], [50.2, Q.upright(PB, -500, 1), 'io'], [50.6, { ...Q.upright(PB, -500, 1), aN: [55, 10] }], [DUR, { ...Q.upright(PB, -500, 1), aN: [55, 10] }],
]);

// camera keys: [t, {x, y, z, rot}, ease]
const CAM = [
  [0, { x: 0, y: -205, z: 1.25, rot: 0 }], [11.0, { x: 0, y: -210, z: 1.38, rot: 0 }, 'l'],
  [11.7, { x: 0, y: -190, z: 1.45, rot: 0 }, 'io'], [17.1, { x: 0, y: -190, z: 1.45, rot: 0 }],
  [17.16, { x: -40, y: -210, z: 1.8, rot: -3 }, 'o'], [17.7, { x: -60, y: -190, z: 1.45, rot: 0 }, 'io'], [18.1, { x: -120, y: -190, z: 1.4, rot: 0 }],
  [19.0, { x: -1000, y: -230, z: 1.15, rot: 0 }, 'io'], [19.7, { x: -1420, y: -70, z: 1.9, rot: 0 }, 'io'], [22.4, { x: -1420, y: -80, z: 1.95, rot: 0 }, 'l'], [24.0, { x: -1400, y: -150, z: 1.6, rot: 0 }, 'io'], [24.6, { x: -1380, y: -160, z: 1.55, rot: 0 }],
  [25.6, { x: -760, y: -180, z: 1.2, rot: 0 }, 'i'], [T.cut2, { x: 0, y: -170, z: 1.3, rot: 0 }, 'h'], [27.3, { x: 0, y: -170, z: 1.3, rot: 0 }],
  [T.power, { x: 0, y: -240, z: 1.5, rot: 3 }, 'h'], [32.4, { x: 0, y: -215, z: 1.8, rot: 6 }, 'l'],
  [32.95, { x: 0, y: -260, z: 1.55, rot: 6 }, 'io'], [33.06, { x: 0, y: -220, z: 1.95, rot: 9 }, 'o'], [T.slowEnd, { x: 0, y: -220, z: 2.05, rot: 9 }, 'l'], [35.4, { x: 0, y: -190, z: 1.15, rot: 0 }, 'o'],
  [35.7, { x: 0, y: -180, z: 1.02, rot: 0 }, 'io'], [41.1, { x: 0, y: -175, z: 1.12, rot: 0 }, 'l'], [41.16, { x: 0, y: -175, z: 1.02, rot: 0 }, 'o'],
  [44.8, { x: 0, y: -175, z: 1.02, rot: 0 }], [46.4, { x: 220, y: -190, z: 1.25, rot: 0 }, 'io'], [T.offer, { x: -330, y: -190, z: 1.35, rot: 0 }, 'io'],
  [T.pull, { x: -350, y: -200, z: 1.45, rot: 0 }, 'l'], [53.4, { x: 0, y: -150, z: .33, rot: 0 }, 'io'], [DUR, { x: 0, y: -150, z: .32, rot: 0 }],
];
const EASE = { o: k => 1 - Math.pow(1 - k, 3), io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, i: k => k * k, l: k => k, h: k => (k < 1 ? 0 : 1) };
function camAt(t) {
  if (t <= CAM[0][0]) return { ...CAM[0][1] };
  for (let i = 1; i < CAM.length; i++) if (t < CAM[i][0]) {
    const [t0, a] = CAM[i - 1], [t1, b, e] = CAM[i], k = EASE[e || 'io']((t - t0) / (t1 - t0));
    const o = {}; for (const n of ['x', 'y', 'z', 'rot']) o[n] = a[n] + (b[n] - a[n]) * k; return o;
  }
  return { ...CAM[CAM.length - 1][1] };
}

// FX clock: runs at 20 % inside the slow-motion window, so sparks and rings slow down with the figures
const SLOW = [T.clash, T.slowEnd, .2];
const fxT = t => t < SLOW[0] ? t : t < SLOW[1] ? SLOW[0] + (t - SLOW[0]) * SLOW[2] : SLOW[0] + (SLOW[1] - SLOW[0]) * SLOW[2] + (t - SLOW[1]);
const fxAge = (t, t0) => fxT(t) - fxT(t0);

// —— actions: one list drives the effects and the sound (window.EV); hit points are read from the attacker's limb ——
const ACT = [
  ['block', 11.82, 'R', 'aN'], ['block', 12.23, 'B', 'aN'], ['whoosh', 12.66, 'R', 'lN'], ['whoosh', 13.1, 'B', 'lN'],
  ['land', 13.52, 'R'], ['block', 13.62, 'R', 'aN'], ['block', 14.0, 'R', 'aN'], ['block', 14.2, 'R', 'aF'], ['block', 14.4, 'R', 'aN'],
  ['lock', 15.0, 'R', 'aN'], ['hop', 16.45, 'R'], ['hop', 16.45, 'B'],
  ['hit', T.hit1, 'B', 'lN'], ['hit', T.hit2, 'B', 'lN'],
  ['grip', T.grip, 'R'], ['scrape', 22.6, 'R'], ['step', 24.0, 'R'], ['skid', 25.95, 'R'],
  ['dash', 32.75, 'R'], ['dash', 32.75, 'B'], ['clash', T.clash, 'R', 'aN'], ['snap', T.slowEnd, 'R'], ['skid', 35.2, 'R'], ['skid', 35.2, 'B'],
  ['pass', T.pass, 'R'], ['cut', T.fall, 'B'], ['thud', 44.4, 'B'], ['knee', 44.3, 'R'],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ['step', 46.65 + i * .24, 'R']), ['clap', T.grab, 'R'],
];
const FIG = { R: { P: PR, tr: R, col: RED }, B: { P: PB, tr: B, col: BLUE } };
const jointsAt = (who, t) => figure(FIG[who].P, FIG[who].tr(t));
const hitPoint = (who, part, t) => { const J = jointsAt(who, t); return part ? J[part][2] : J.hip; };

function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.drawImage(PAPERC, 0, 0);
  const cam = camAt(t);
  let shake = 0;
  for (const [t0, a, d] of [[T.hit1, 26, .35], [T.hit2, 20, .35], [T.clash, 10, 1.9], [T.slowEnd, 26, .4], [44.4, 8, .25]]) if (t >= t0 && t < t0 + d) shake = Math.max(shake, a * (1 - (t - t0) / d));
  if (t >= 15.0 && t < 16.2) shake = Math.max(shake, 3);
  cam.shake = shake;
  g.save(); applyCam(g, W, H, cam, t);
  // the desk around the sheet, and the sheet's edge shadow
  const S = SHEET, big = 20000;
  g.fillStyle = DESK;
  g.fillRect(-big, -big, big * 2, S.y0 + big); g.fillRect(-big, S.y1, big * 2, big); g.fillRect(-big, S.y0, S.x0 + big, S.y1 - S.y0); g.fillRect(S.x1, S.y0, big, S.y1 - S.y0);
  g.strokeStyle = rgba('#000000', .35); g.lineWidth = 10; g.strokeRect(S.x0 - 5, S.y0 - 5, S.x1 - S.x0 + 10, S.y1 - S.y0 + 10);
  g.save(); g.beginPath(); g.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); g.clip();   // ink lives only on the paper
  // ground line: draws itself at the start; the crack opens at the clash (in slow motion) and stays
  const gk = Math.min(1, Math.max(0, (t - .3) / 2.1));
  if (gk < 1) { g.strokeStyle = INK; g.lineWidth = PR.w * .8; g.lineCap = 'round'; const p = partial([[S.x0 + 2, 0], [S.x1 - 2, 0]], 1 - Math.pow(1 - gk, 2)); g.beginPath(); g.moveTo(p[0][0], 0); g.lineTo(p[1][0], 0); g.stroke(); }
  else ground(g, S.x0 + 2, S.x1 - 2, PR.w * .8, t >= T.clash ? [{ x: 0, k: Math.min(1, fxAge(t, T.clash) / .3) * .9, seed: 3 }] : []);
  // scuffs left where the fight touched the paper (kept to the end)
  for (const [t0, x] of [[13.52, -190], [25.95, -330], [35.2, -480], [35.2, 480], [41.32, 480], [41.32, -480], [44.4, -540]]) if (t >= t0) { g.fillStyle = rgba('#5a5048', .1); g.beginPath(); g.ellipse(x, 6, 90, 9, 0, 0, 7); g.fill(); }
  // figures: being drawn, then alive
  const Jr = jointsAt('R', t), Jb = jointsAt('B', t);
  const drawK = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const kR = drawK(2.4, 4.0), kB = drawK(3.6, 5.2);
  const auraAmt = t < 27.6 ? 0 : t < 32.4 ? (t - 27.6) / 4.8 : t < T.slowEnd ? 1 : Math.max(0, 1 - (t - T.slowEnd) / 1.6);
  if (kB >= 1) shadow(g, Jb); if (kR >= 1) shadow(g, Jr);
  if (auraAmt > 0) { aura(g, Jr, RED, fxT(t), auraAmt, 3); aura(g, Jb, BLUE, fxT(t), auraAmt, 8); }
  const order = (t >= T.pass && t < 46) || t >= 47 ? ['R', 'B'] : ['B', 'R'];
  for (const who of order) {
    const F = FIG[who], J = who === 'R' ? Jr : Jb, k = who === 'R' ? kR : kB;
    if (k <= 0) continue;
    if (k < 1) { drawFigureDrawing(g, J, k); continue; }
    // smears for limbs moving faster than a third of the figure per frame
    const J1 = jointsAt(who, t - 1 / 24), fast = [];
    for (const p of ['aN', 'aF', 'lN', 'lF']) if (Math.hypot(J[p][2][0] - J1[p][2][0], J[p][2][1] - J1[p][2][1]) > F.P.h / 3) fast.push(p);
    if (fast.length) smear(g, [1, 2, 3, 4].map(i => jointsAt(who, t - i / 96)), fast, F.col, F.P.w);
    drawFigure(g, J);
  }
  // effects
  for (const [kind, t0, who, part] of ACT) {
    const age = fxAge(t, t0); if (age < 0 || age > 1.2) continue;
    if ((kind === 'hit' && t0 === T.hit1 || kind === 'clash') && t < t0 + 2 / 24) continue;   // drawn after the inversion instead
    const F = FIG[who];
    if (kind === 'block' || kind === 'lock') { const p = hitPoint(who, part, t0); sparks(g, p[0] + 10 * F.tr(t0).face, p[1], age, F.col, Math.round(t0 * 100), 10, .7); }
    if (kind === 'hit') { const p = hitPoint(who, part, t0); sparks(g, p[0], p[1], age, F.col, Math.round(t0 * 100), 18, 1.2); }
    if (kind === 'clash') {
      const a = hitPoint('R', 'aN', t0), b = hitPoint('B', 'aN', t0), p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      shockwave(g, p[0], p[1], age * .5, RED, { r: 640 }); shockwave(g, p[0], p[1], age * .5 - .05, BLUE, { r: 480 });
      sparks(g, p[0], p[1], age * .45, RED, 21, 14, 1.4); sparks(g, p[0], p[1], age * .45, BLUE, 22, 14, 1.4);
    }
    if (kind === 'snap') for (const w of ['R', 'B']) { const Jw = jointsAt(w, t0); dust(g, Jw.lF[2][0], age, w === 'R' ? 40 : 41, { dir: -FIG[w].tr(t0).face, size: 1.3, n: 9 }); }
    if (['land', 'hop', 'skid', 'dash', 'thud'].includes(kind)) {
      const J = jointsAt(who, t0), x = (J.lN[2][0] + J.lF[2][0]) / 2, f = F.tr(t0).face;
      dust(g, kind === 'thud' ? J.hip[0] : x, age, Math.round(t0 * 10), { dir: kind === 'skid' || kind === 'dash' ? -f : 0, size: kind === 'thud' ? 1.2 : .9, n: kind === 'land' || kind === 'thud' ? 8 : 5 });
    }
    if (kind === 'cut') { const p = jointsAt('B', t0).neck; sparks(g, p[0], p[1] + 40, age, RED, 77, 20, 1.3); }
  }
  g.restore(); g.restore();
  // screen-space punctuation
  const fr = Math.round(t * 24);
  if (t >= 11.25 && t < 11.7) speedH(g, W, H, '#b8ad98', fr, { n: 30, a: .55, hmax: 3 });
  if (t >= 24.85 && t < 25.65) speedH(g, W, H, '#b8ad98', fr, { n: 34, a: .6, hmax: 3 });
  if (t >= 32.6 && t < T.clash) speedRadial(g, W, H, W / 2, H / 2, '#b8ad98', fr, { n: 70, a: .5, r0: 420 });
  if (t >= T.pass - .1 && t < T.pass + .2) speedH(g, W, H, INK, fr, { n: 60, a: .6, hmax: 5 });
  // impact frames: 2 frames inverted, radial lines
  for (const [t0, c] of [[T.hit1, W / 2 - 40], [T.clash, W / 2]]) if (t >= t0 && t < t0 + 2 / 24) {
    g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.restore();
    speedRadial(g, W, H, c, H / 2 - 20, PAPER, fr + 3, { n: 120, a: .85, r0: 280 });
    g.save(); applyCam(g, W, H, cam, t);
    if (t0 === T.hit1) { const p = hitPoint('B', 'lN', t0); sparks(g, p[0], p[1], fxAge(t, t0), BLUE, Math.round(t0 * 100), 18, 1.2); }
    else { const a = hitPoint('R', 'aN', t0), b = hitPoint('B', 'aN', t0), p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; sparks(g, p[0], p[1], fxAge(t, t0) * .45, RED, 21, 14, 1.4); sparks(g, p[0], p[1], fxAge(t, t0) * .45, BLUE, 22, 14, 1.4); }
    g.restore();
  }
  // the pass-through flash: two frames of bare paper
  if (t >= T.pass && t < T.pass + 2 / 24) { g.fillStyle = PAPER; g.fillRect(0, 0, W, H); }
  // titles
  if (t >= T.title && t < T.titleOut + .3) title(t - T.title, t >= T.titleOut ? (t - T.titleOut) / .3 : 0, 400);
  if (t >= T.end) { title(t - T.end, 0, 330, true); endLines(t - T.end - .4); }
}

function title(lt, out, y, small) {
  const s = (small ? .78 : 1) * (lt < 3 / 24 ? 1.3 - .3 * lt * 8 : 1);
  g.save(); g.translate(W / 2, y - out * 600); g.scale(s, s); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '400 190px Anton'; const w = g.measureText(TEXT.title).width;
  if (lt < 1 / 24) { g.fillStyle = rgba(INK, .35); g.fillText(TEXT.title, 14, 14); }
  g.fillStyle = RED; g.fillRect(-w / 2 - 20, 20, w / 2 + 20, 34); g.fillStyle = BLUE; g.fillRect(0, 20, w / 2 + 20, 34);
  g.lineJoin = 'round'; g.strokeStyle = PAPER; g.lineWidth = 16; g.strokeText(TEXT.title, 0, 0);
  g.fillStyle = INK; g.fillText(TEXT.title, 0, 0);
  g.font = '900 72px SC'; g.strokeText(TEXT.titleCn, 0, 140); g.fillText(TEXT.titleCn, 0, 140);
  g.restore();
}
function endLines(lt) {
  if (lt < 0) return;
  g.save(); g.globalAlpha = Math.min(1, lt / .4); g.textAlign = 'center'; g.fillStyle = PAPER;
  g.font = '900 34px SC'; g.fillText(TEXT.style, W / 2, H - 150);
  g.font = '600 34px BSC'; g.fillText(TEXT.credit, W / 2, H - 100);
  g.restore();
}

// every text the viewer must read
window.TEXTS = t => {
  const out = [];
  if (t >= T.title + .15 && t < T.titleOut) out.push({ id: 'title', text: TEXT.title + ' ' + TEXT.titleCn, x0: 560, y0: 220, x1: 1360, y1: 560 });
  if (t >= T.end + .2) out.push({ id: 'endtitle', text: TEXT.title + ' ' + TEXT.titleCn, x0: 600, y0: 180, x1: 1320, y1: 460 });
  if (t >= T.end + .8) out.push({ id: 'endstyle', text: TEXT.style, x0: 600, y0: 890, x1: 1320, y1: 940 }, { id: 'endcredit', text: TEXT.credit, x0: 560, y0: 945, x1: 1360, y1: 995 });
  return out;
};

// sound events for mix.py
window.EV = (() => {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  for (const [a, b] of [[.3, 2.4], [2.4, 4.0], [3.6, 5.2]]) add('pen', a, { d: b - a });
  add('title', T.title); add('titleout', T.titleOut);
  for (const [kind, t0, who] of ACT) add(kind, t0, { who });
  // a swish for every fast limb move, pitched by speed
  for (const who of ['R', 'B']) {
    let last = -1;
    for (let t = 5.5; t < DUR; t += 1 / 24) {
      const J = jointsAt(who, t), J1 = jointsAt(who, t - 1 / 24); let v = 0;
      for (const p of ['aN', 'aF', 'lN', 'lF']) v = Math.max(v, Math.hypot(J[p][2][0] - J1[p][2][0], J[p][2][1] - J1[p][2][1]));
      if (v > FIG[who].P.h / 3 && t - last > .18) { add('swish', t - 1 / 24, { who, v: +Math.min(2, v / FIG[who].P.h).toFixed(2) }); last = t; }
    }
  }
  add('fall', T.offPage); add('impactframe', T.hit1); add('impactframe', T.clash); add('flash', T.pass);
  return ev.sort((a, b) => a.t - b.t);
})();
window.DUR = DUR; window.render = render;
render(parseFloat(qs.get('t') ?? '13'));
window.READY = true;
