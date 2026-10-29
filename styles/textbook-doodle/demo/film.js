// Why We Have Seasons (为什么会有四季) · Textbook Doodle demo, 39 s. One geography textbook on a desk, seen from above. The print
// only asks. One margin stick figure answers: he highlights the question, writes a wrong answer with a pen taller than himself,
// gets crossed out, carries a globe round the sun, switches on flashlights, stands on both hemispheres, ends up upside down in
// Australia in a Santa hat, and writes the real answer. He is the only character, on screen from the first frame to the last.
// All timing comes from timeline.json (120 BPM, one bar = 2 s), which the score reads too. The cues, and the section times
// below, are written on a 30 s grid; `holds` then insert reading time ([grid time, seconds]: every cue at or after that time
// moves later) so each line stays on screen long enough to read, and `tail` holds the last frame.
import { Q, ORB, ORBIT, PRINTED } from './pages.js';
import { PW, PH, drawSpread, drawDesk, onPage } from './engine/book.js';
import * as P from './engine/pen.js';
import { writeText, measure } from './engine/hand.js';
import { figure, POSES } from './engine/stick.js';
import { clamp, lerp, seg, eio } from '/core/lib.js';

export let DUR = 30;
export const EV = [];
let C;
export const warp = (holds, t) => t + holds.reduce((a, [p, d]) => a + (t >= p ? d : 0), 0);
export async function init() {
  const T = await (await fetch('timeline.json')).json(), w = t => warp(T.holds, t);
  C = Object.fromEntries(Object.entries(T.cues).map(([k, v]) => [k, Array.isArray(v) ? v.map(w) : w(v)]));
  DUR = w(T.grid) + T.tail;
  build();
}

let NOW = 0, BOIL = 0;
const DRAW = {};                                    // pageId → [(ctx, t, b) => …], drawn in page coords
const on = (id, f) => (DRAW[id] ||= []).push(f);
onPage((ctx, id) => { for (const f of DRAW[id] || []) f(ctx, NOW, BOIL); });
const ev = (t, type, hit = 'kick') => EV.push({ t, type, on: hit });
const RED = '#d3262b';

// one mark: drawn at pen speed over [t0, t0 + dur], then it stays on the paper
function ink(id, strokes, t0, dur) { const m = P.mark(strokes, t0, dur); on(id, (ctx, t, b) => P.drawMark(ctx, m, t, b)); return m; }
const WORDS = [];                                    // every line meant to be read, for window.TEXTS (core/render/readcheck.mjs)
function write(id, text, x, y, size, t0, dur, o = {}) { WORDS.push({ id, text, x, y, size, t0, font: 'hand' }); on(id, (ctx, t, b) => writeText(ctx, text, x, y, { size, t0, dur, ...o }, t, b)); }
const sample = (f, n = 60) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const circ = (x, y, r, o = {}) => new P.Stroke(sample(u => [x + r * Math.cos(u * 6.5 - 2), y + r * Math.sin(u * 6.5 - 2)], 48).flat(), { tool: 'ball', w: 3.4, ...o });
// a highlighter patch: a polygon, multiplied
function hlFill(ctx, pts, a = .55, col = P.INK.hl) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = col;
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
}

// the Earth: a circle + the sunward half in highlighter + the axis (north pole tilted 23.5° to the left, never changing) + the equator
const TILT = 23.5 * Math.PI / 180, AX = [-Math.sin(TILT), -Math.cos(TILT)];
function earth(ctx, x, y, r, sunAng, b, o = {}) {
  const u = o.u ?? 1, seed = o.seed ?? 200;
  if (u > .3) { const pts = sample(k => [x + r * Math.cos(sunAng - Math.PI / 2 + k * Math.PI), y + r * Math.sin(sunAng - Math.PI / 2 + k * Math.PI)], 24); hlFill(ctx, pts, .5 * (o.a ?? 1) * clamp((u - .3) / .3)); }
  P.drawStroke(ctx, circ(x, y, r, { seed, alpha: .92 * (o.a ?? 1) }), circ(x, y, r).len * clamp(u / .5), b);
  if (u > .6) {
    const L = r * 1.55, k = clamp((u - .6) / .3);
    P.drawStroke(ctx, new P.Stroke([x - AX[0] * L, y - AX[1] * L, x + AX[0] * L, y + AX[1] * L], { tool: o.axisTool ?? 'ball', w: 3, seed: seed + 1, alpha: .92 * (o.a ?? 1) }), 2 * L * k, b);
    P.drawStroke(ctx, new P.Stroke([x + AX[1] * r * .98, y - AX[0] * r * .98, x - AX[1] * r * .98, y + AX[0] * r * .98], { tool: 'ball', w: 1.8, seed: seed + 2, alpha: .6 * (o.a ?? 1) }), null, b);   // equator
    if (k >= 1 && r > 30) writeText(ctx, 'N', x + AX[0] * (L + 22) - 10, y + AX[1] * (L + 22) + 8, { size: r * .55, t0: -1, dur: 0, alpha: .9 * (o.a ?? 1) }, NOW, b);
  }
}

// ───────────────────────── the book and the camera
const WL = (x, y) => [x - PW, y - PH / 2], WR = (x, y) => [x, y - PH / 2];   // page coords → world coords
const CAM = [];
const cam = (t, x, y, z, dur = 0, ease = eio) => CAM.push({ t, x, y, z, dur, ease });
function camAt(t) {
  let a = CAM[0]; if (t <= a.t) return a;
  for (let i = 1; i < CAM.length; i++) {
    const b = CAM[i]; if (t < b.t) { const u = b.dur ? b.ease(clamp((t - (b.t - b.dur)) / b.dur)) : 0; return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) }; }
    a = b;
  }
  return a;
}
const KICKS = [];
function kick(t) { let z = 0; for (const [k, a] of KICKS) { const d = t - k; if (d >= 0 && d < .5) z += a * .035 * Math.exp(-d * 9); } return z; }

function build() {
  cam(0, -430, -110, 1.4);
  cam(C.near - .1, 260, -200, 1.5, .7);
  cam(C.earth, 430, -170, 1.5, 1.2);
  cam(C.axis - .3, 430, -170, 1.4, 1.0);
  cam(C.flash, -430, 320, 1.4, .6);
  cam(C.june - .1, -430, 320, 1.4); cam(C.june + .3, 430, 320, 1.4, .8);
  cam(C.santa - .1, 650, 350, 2.2, .9); cam(C.answer - 1, 650, 350, 2.2);
  cam(C.answer, -430, 40, 1.35, .75);
  cam(C.end + .1, 0, -10, .9, 1.0);
  [C.cross, C.near, ...C.stations, C.answer].forEach(k => KICKS.push([k, 1]));
  question(); orbit(); flashlight(); hemispheres(); answer(); heroTrack();
}

// ───────────────────────── 0–6 s: the question, an obvious answer, crossed out in red
const WRONG = { text: '离太阳近？', x: 80, y: 625, size: 58 }, RIGHT = { text: '是地轴倾斜！', x: 452, y: 630, size: 56 };
function question() {
  ink('geoL', P.hl(Q.x + 36, Q.x + 400, Q.y + 82, { w: 34 }), C.q, .5);
  write('geoL', WRONG.text, WRONG.x, WRONG.y, WRONG.size, C.wrong, .9);
  ink('geoL', [...P.line(66, 580, 390, 642, { tool: 'red', w: 5 }), ...P.line(66, 642, 390, 580, { tool: 'red', w: 5 })], C.cross, .3);
  const [lx, ly] = ORBIT(Math.PI);
  ink('geoR', P.ellipse(lx + 95, ly - 54, 120, 34, { tool: 'red', w: 4, lap: .3 }), C.near, .3);
  write('geoR', '1月最近，', 590, 140, 44, C.near + .25, .45, { color: RED });
  write('geoR', '却是冬天！', 590, 192, 44, C.near + .7, .45, { color: RED });
  ev(C.q, 'hl', 'hat'); ev(C.wrong, 'write', 'hat'); ev(C.cross, 'cross', 'snare'); ev(C.near, 'near');
}

// ───────────────────────── 6–16 s: a globe with a tilted axis, carried round the sun by the figure
const ST = [Math.PI, Math.PI / 2, 0, -Math.PI / 2, -Math.PI];          // December → March → June → September → December (counter-clockwise on screen)
const MONTH = ['12月', '3月', '6月', '9月'], RO = 44;
let T_ORB;
const angAt = t => { for (let i = 1; i < T_ORB.length; i++) if (t < T_ORB[i]) return lerp(ST[i - 1], ST[i], eio(seg(t, T_ORB[i] - .45, T_ORB[i]))); return ST[4]; };
const southEnd = a => { const [x, y] = ORBIT(a), L = RO * 1.55; return [x - AX[0] * L, y - AX[1] * L]; };   // the south end of the axis = where the figure holds it
function orbit() {
  const T = T_ORB = [C.earth, ...C.stations], R = RO;
  const sunAng = (x, y) => Math.atan2(ORB.sy - y, ORB.sx - x);
  on('geoR', (ctx, t, b) => {
    if (t < C.earth) return;
    for (let i = 0; i < 4; i++) if (t >= T[i] + .45) { const [x, y] = ORBIT(ST[i]); if (!(i === 0 && t < T[4])) earth(ctx, x, y, R, sunAng(x, y), b, { a: .35, seed: 210 + i * 3 }); }   // a faint copy stays at each station passed
    const a = angAt(t), [x, y] = ORBIT(a);
    earth(ctx, x, y, R, sunAng(x, y), b, { u: clamp((t - C.earth) / .8), seed: 200 });
    if (t >= C.axis) for (let i = 0; i < 4; i++) {                    // red pen: the axis is parallel at all four stations
      const [ex, ey] = ORBIT(ST[i]), L = R * 1.9;
      P.drawStroke(ctx, new P.Stroke([ex - AX[0] * L * .2, ey - AX[1] * L * .2, ex + AX[0] * L, ey + AX[1] * L], { tool: 'red', w: 4, seed: 240 + i, over: 6 }), 300 * clamp((t - C.axis - i * .12) / .25), b);
    }
  });
  const LAB = [[-60, 92], [58, 40], [-90, 92], [58, -36]];
  T.forEach((k, i) => { if (i < 4) { const [x, y] = ORBIT(ST[i]); write('geoR', MONTH[i], x + LAB[i][0], y + LAB[i][1], 40, k + .1, .35); } });
  write('geoR', '地轴方向不变', 452, 505, 34, C.axis + .2, .6, { color: RED });
  ev(C.earth, 'earth', 'hat'); C.stations.forEach(k => ev(k, 'station')); ev(C.axis, 'axis', 'snare');
}

// ───────────────────────── 16–22 s: the flashlight test. One torch: pointing straight down, a small dense spot; the figure hangs on its tail and tips it, the spot stretches and fades
const GY = 1000, TL = { x: 230, y: 860 }, TILT1 = 1.1, HW = 45;
const tAng = t => TILT1 * eio(seg(t, C.beamB - .5, C.beamB));
const torchAt = (ang, u) => [TL.x - Math.sin(ang) * u, TL.y - Math.cos(ang) * u];   // u back along the body (the lens is the pivot)
function torch(ctx, x, y, ang, b, seed, lit) {   // the torch: a small tube pointing along ang (0 = straight down)
  const d = [Math.sin(ang), Math.cos(ang)], n = [d[1], -d[0]], p = (u, v) => [x - d[0] * u + n[0] * v, y - d[1] * u + n[1] * v];
  P.drawStroke(ctx, new P.Stroke([...p(0, -40), ...p(0, 40), ...p(36, 26), ...p(110, 26), ...p(110, -26), ...p(36, -26), ...p(0, -40)].flat(), { tool: 'ball', w: 3.2, seed }), null, b);
  P.drawStroke(ctx, new P.Stroke([...p(62, -9), ...p(62, 9), ...p(78, 9), ...p(78, -9), ...p(62, -9)].flat(), { tool: lit ? 'red' : 'ball', w: 2.4, seed: seed + 9 }), null, b);
}
function beam(ang, u = 1) {                         // the beam quad + the span it lights on the ground
  const d = [Math.sin(ang), Math.cos(ang)], n = [d[1], -d[0]];
  const hit = v => { const sx = TL.x + n[0] * v, sy = TL.y + n[1] * v, s = (GY - sy) / d[1]; return [sx + d[0] * s * u, sy + d[1] * s * u]; };
  const a0 = hit(-HW), a1 = hit(HW);
  return { poly: [[TL.x - n[0] * HW, TL.y - n[1] * HW], a0, a1, [TL.x + n[0] * HW, TL.y + n[1] * HW]], x0: Math.min(a0[0], a1[0]), x1: Math.max(a0[0], a1[0]) };
}
function flashlight() {
  ink('geoL', P.line(70, GY, 800, GY + 4, { w: 3.4 }), C.flash, .35);
  const bracket = (ctx, x0, x1, b, k) => { P.drawStroke(ctx, new P.Stroke([x0, GY + 34, x1, GY + 34], { tool: 'ball', w: 2.2, seed: 310 + k }), null, b); for (const xx of [x0, x1]) P.drawStroke(ctx, new P.Stroke([xx, GY + 24, xx, GY + 44], { tool: 'ball', w: 2.2, seed: 312 + k + xx }), null, b); };
  const patch = (ctx, x0, x1, a, col) => hlFill(ctx, [[x0, GY - 14], [x1, GY - 14], [x1, GY + 14], [x0, GY + 14]], a, col);
  on('geoL', (ctx, t, b) => {
    if (t < C.flash + .2) return;
    const ang = tAng(t), lit = t >= C.beamA, A = beam(0);
    if (t >= C.beamA + .2 && ang > .08) patch(ctx, A.x0, A.x1, .9, '#ffb21e');           // the straight-down spot stays on the paper in highlighter
    if (t >= C.beamA + .4) bracket(ctx, A.x0, A.x1, b, 0);
    if (lit) {
      const u = clamp((t - C.beamA) / .2), B = beam(ang, u), k = ang / TILT1;
      hlFill(ctx, B.poly, .22);
      if (u >= 1) patch(ctx, B.x0, B.x1, lerp(.9, .38, k), k < .5 ? '#ffb21e' : P.INK.hl);   // the more slanted, the paler and longer
      if (t >= C.beamB + .4) bracket(ctx, B.x0, B.x1, b, 1);
    }
    torch(ctx, TL.x, TL.y, ang, b, 300, lit);
  });
  write('geoL', '直射：集中 → 热', 80, 1092, 40, C.lab1, .6);
  write('geoL', '斜射：摊开 → 冷', 420, 1092, 40, C.lab2, .6);
  ev(C.flash, 'flash', 'hat'); ev(C.beamA, 'beamA'); ev(C.beamB, 'beamB'); ev(C.people, 'people', 'snare');
}

// ───────────────────────── 22–28 s: in June the north leans toward the sun, in December away; the south is the reverse
const EJ = { x: 220, y: 830, sun: Math.PI }, ED = { x: 640, y: 830, sun: 0 }, RH = 70;
function hemispheres() {
  on('geoR', (ctx, t, b) => {
    for (const [E, t0, seed] of [[EJ, C.june, 400], [ED, C.dec, 410]]) {
      if (t < t0) continue;
      earth(ctx, E.x, E.y, RH, E.sun, b, { u: clamp((t - t0) / .7), seed });
      const dir = Math.cos(E.sun), k = clamp((t - t0 - .4) / .4);   // sunlight: three parallel arrows from the sun's side
      if (k > 0) for (let i = -1; i <= 1; i++) { const yy = E.y + i * 40, x0 = E.x + dir * (RH + 90), x1 = E.x + dir * (RH + 16); for (const s of P.arrow(x0, yy, lerp(x0, x1, k), yy, { tool: 'red', w: 3, head: 12, seed: seed + 5 + i })) P.drawStroke(ctx, s, null, b); }
    }
  });
  write('geoR', '6月：北半球 夏', 90, 1040, 36, C.june + .7, .7);
  write('geoR', '12月：北半球 冬', 500, 1040, 36, C.dec + .7, .7);
  write('geoR', '南半球：冬', 90, 1086, 36, C.south, .5, { color: RED });
  write('geoR', '南半球：夏', 500, 1086, 36, C.south + .4, .5, { color: RED });
  write('geoR', '澳洲的圣诞在夏天', 470, 1132, 36, C.santa + .2, .8, { color: RED });
  ev(C.june, 'june'); ev(C.dec, 'dec'); ev(C.south, 'south', 'snare'); ev(C.santa, 'santa');
}

// ───────────────────────── 28–30 s: back to the question, the real answer, a tick
function answer() {
  write('geoL', RIGHT.text, RIGHT.x, RIGHT.y, RIGHT.size, C.answer, .7, { bold: 2 });
  ink('geoL', P.rect(436, 562, 372, 92, { w: 3.6 }), C.answer + .7, .3);
  ink('geoL', P.check(740, 540, 96, { w: 6 }), C.tick, .2);
  ev(C.answer, 'answer'); ev(C.tick, 'tick', 'snare'); ev(C.end, 'end');
}

// ───────────────────────── the figure: the only character. One track; each segment gives his feet (world coords), pose and props
const S = 60, FY = S * .72, OFF = S * .9;                                  // height unit, hip to feet, distance from the pen tip
const UP2 = { armL: [-2.95, .05], armR: [2.95, -.05] };                    // both hands over the head
const STAR = { lean: 0, armL: [-1.5, -.1], armR: [1.5, .1], legL: [-.4, 0], legR: [.4, 0], head: 0 };   // star pose
const PDOWN = { lean: .1, armL: [-.4, .2], armR: [.55, .15], legL: [-.2, 0], legR: [.2, 0], head: .35 };
const run = t => Math.floor(t * 8) % 2 ? POSES.run1 : POSES.run2;
const jit = t => Math.floor(t * 12) % 2 ? 1.6 : -1.6;                    // shivering
const arc = (a, b, u, h) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 4 * h * u * (1 - u)];
const TRACK = [];
const seg_ = (t0, t1, f) => TRACK.push({ t0, t1, f });
const WIDTH = {};                                                          // width of a handwritten line (measured on the canvas)
function heroTrack() {
  const hlTip = u => WL(lerp(Q.x + 36, Q.x + 400, u), Q.y + 84);
  const box = Q.y + Q.h;                                                   // standing on the bottom edge of the question box
  // 0–2: drags a highlighter bigger than himself along the question
  seg_(-1, C.q, () => { const [x, y] = hlTip(0); return { p: [x + OFF, WL(0, box)[1]], pose: POSES.stand, pen: { tip: [x, y], kind: 'hl' }, face: 'smile' }; });
  seg_(C.q, C.q + .5, (u, t) => { const [x, y] = hlTip(u); return { p: [x + OFF, WL(0, box)[1]], pose: run(t), pen: { tip: [x, y], kind: 'hl' }, face: 'grin' }; });
  seg_(C.q + .5, C.q + .75, () => ({ p: [hlTip(1)[0] + OFF, WL(0, box)[1]], pose: POSES.cool, face: 'grin' }));
  const wStart = WL(WRONG.x + OFF, WRONG.y + 30);
  seg_(C.q + .75, C.wrong - .1, u => ({ p: arc([hlTip(1)[0] + OFF, WL(0, box)[1]], wStart, u, 90), pose: u < .8 ? POSES.cheer : POSES.stand, flip: true }));
  // 2–3: hugs a giant ballpoint and writes 「离太阳近？」, very sure
  const pen = (R, t0, dur) => (u, t) => { const k = clamp((t - t0) / dur), [x, y] = WL(R.x + (WIDTH[R.text] ?? R.size * [...R.text].length * .9) * k, R.y - 16); return { p: [x + OFF, WL(0, R.y + 30)[1]], pose: POSES.hug, flip: true, pen: { tip: [x, y], kind: 'ball' }, face: 'flat' }; };
  seg_(C.wrong - .1, C.wrong + 1, pen(WRONG, C.wrong, .9));
  const wEnd = () => [WL(WRONG.x + (WIDTH[WRONG.text] ?? 270) + OFF, 0)[0], wStart[1]];
  seg_(C.wrong + 1, C.cross - .05, u => ({ p: wEnd(), pose: POSES.cool, face: 'grin', props: { glasses: u > .3 } }));
  // 4: the red cross lands, he jumps, runs to the right page to see 「近日点」
  seg_(C.cross - .05, C.cross + .3, u => ({ p: arc(wEnd(), wEnd(), u, 60), pose: POSES.shrug, face: 'shock', mouth: .6 }));
  const nearTop = WR(ORBIT(Math.PI)[0] + 95, ORBIT(Math.PI)[1] - 88);
  seg_(C.cross + .3, C.near - .05, (u, t) => ({ p: arc(wEnd(), nearTop, u, 160), pose: run(t) }));
  seg_(C.near - .05, C.near + .35, () => ({ p: nearTop, pose: PDOWN, face: 'shock', mouth: .5 }));
  seg_(C.near + .35, C.earth - .1, (u, t) => ({ p: [nearTop[0] + jit(t), nearTop[1]], pose: POSES.hug, face: 'sad', props: { scarf: true }, shiver: true }));
  // 6.5–16: the Earth is drawn, he grabs the south end of its axis and carries the globe round the sun
  const holdAt = a => { const [sx, sy] = southEnd(a); return WR(sx - 2, sy + S * 1.16 + FY - 2); };
  seg_(C.earth - .1, C.earth + .45, () => ({ p: nearTop, pose: POSES.pointUp, flip: true, face: 'smile' }));
  seg_(C.earth + .45, C.earth + .8, u => ({ p: arc(nearTop, holdAt(Math.PI), u, 70), pose: POSES.cheer }));
  seg_(C.earth + .8, C.flash - .6, (u, t) => {
    const a = angAt(t), a2 = angAt(t + .05), moving = Math.abs(a2 - a) > 1e-4, p = holdAt(a);
    const flip = holdAt(a2)[0] - p[0] < 0, legs = moving ? run(t) : POSES.stand;
    return { p, pose: { ...legs, lean: moving ? .15 : 0, ...UP2, head: -.2 }, flip, face: t > C.axis ? 'grin' : 'smile', mouth: t > C.axis && t < C.axis + .6 ? .4 : 0 };
  });
  // 15.4–16.2: puts the globe down, runs to the bottom of the left page
  const fl0 = WL(150, GY);
  seg_(C.flash - .6, C.flash + .25, (u, t) => ({ p: arc(holdAt(-Math.PI), fl0, u, 140), pose: run(t), flip: true }));
  const sw = WL(...torchAt(0, 70)), side = [sw[0] + 26 + S * .6, sw[1] + S * .56 + FY];   // where his feet are when his outstretched hand hits the switch
  const offA = [side[0], WL(0, GY)[1]], spotA = WL(TL.x, GY);
  seg_(C.flash + .25, C.beamA - .3, (u, t) => ({ p: [lerp(fl0[0], offA[0], u), fl0[1]], pose: run(t) }));
  // 17: jumps at the switch, lands in the small bright spot, sweats and fans himself
  seg_(C.beamA - .3, C.beamA - .2, () => ({ p: offA, pose: { ...POSES.stand, legL: [-.4, .8], legR: [.4, -.8] }, flip: true }));
  seg_(C.beamA - .2, C.beamA, u => ({ p: [offA[0], lerp(offA[1], side[1], eio(u))], pose: POSES.point, flip: true, face: 'grin' }));   // up, click
  seg_(C.beamA, C.beamA + .25, u => ({ p: [lerp(offA[0], spotA[0], u), lerp(side[1], spotA[1], u * u)], pose: POSES.cheer, face: 'shock', mouth: .4 }));
  seg_(C.beamA + .25, C.beamB - .7, (u, t) => ({ p: spotA, pose: Math.floor(t * 8) % 2 ? POSES.wave1 : POSES.wave2, face: 'flat', mouth: .5, props: { sweat: true } }));
  // 18: jumps up and hangs on the tail, his weight tips the torch; drops, walks into the long pale spot and shivers
  const hang = ang => { const [bx, by] = torchAt(ang, 104); return WL(bx - 30, by + S * 1.16 + FY); };   // hanging left of the tail, his weight pulls it to the left
  const DANGLE = { ...UP2, lean: 0, legL: [-.15, .5], legR: [.25, .3], head: -.2 };
  seg_(C.beamB - .7, C.beamB - .5, u => ({ p: arc(spotA, hang(0), u, 40), pose: POSES.cheer }));
  seg_(C.beamB - .5, C.beamB + .15, (u, t) => ({ p: hang(tAng(t)), pose: DANGLE, face: t < C.beamB ? 'grin' : 'shock', mouth: t < C.beamB ? .4 : .3 }));
  const drop = [hang(TILT1)[0], WL(0, GY)[1]];
  seg_(C.beamB + .15, C.beamB + .35, u => ({ p: [drop[0], lerp(hang(TILT1)[1], drop[1], u * u)], pose: POSES.stand }));
  const cold = WL(TL.x + Math.tan(TILT1) * (GY - TL.y), GY);
  seg_(C.beamB + .35, C.beamB + .8, (u, t) => ({ p: [lerp(drop[0], cold[0], u), cold[1]], pose: run(t) }));
  seg_(C.beamB + .8, C.people, (u, t) => ({ p: [cold[0] + jit(t), cold[1]], pose: POSES.hug, face: 'sad', props: { scarf: true }, shiver: true }));
  // 21–22.3: runs to the right page, lands on the June Earth's north pole
  const topJ = WR(EJ.x + 6, EJ.y - RH), topD = WR(ED.x + 6, ED.y - RH);
  seg_(C.people, C.june + .3, (u, t) => ({ p: arc(cold, topJ, u, 220), pose: run(t) }));
  seg_(C.june + .3, C.dec, (u, t) => ({ p: topJ, pose: Math.floor(t * 8) % 2 ? POSES.wave1 : POSES.wave2, face: 'grin', props: { glasses: true, sweat: true } }));
  // 23: hops onto the December Earth, northern hemisphere: freezing
  seg_(C.dec, C.dec + .5, u => ({ p: arc(topJ, topD, u, 110), pose: POSES.cheer }));
  seg_(C.dec + .5, C.south, (u, t) => ({ p: [topD[0] + jit(t), topD[1]], pose: POSES.hug, face: 'sad', props: { scarf: true }, shiver: true }));
  // 25–27: walks round the surface to the sunlit southern half and stands upside down: Australia. Santa hat + sunglasses
  const AUS = 1.35, surf = th => [WR(ED.x, ED.y)[0] + RH * Math.cos(th), WR(ED.x, ED.y)[1] + RH * Math.sin(th)];
  seg_(C.south, C.santa - .1, (u, t) => { const th = lerp(-Math.PI / 2, AUS, eio(u)); return { p: surf(th), rot: th + Math.PI / 2, pose: run(t), face: 'smile', props: { scarf: u < .5 } }; });
  seg_(C.santa - .1, C.answer - 1, (u, t) => ({ p: surf(AUS), rot: AUS + Math.PI / 2, pose: t < C.santa ? POSES.stand : Math.floor(t * 6) % 2 ? STAR : { ...STAR, armR: [2.5, .3] }, face: 'grin', mouth: t >= C.santa ? .5 : 0, props: { santa: t >= C.santa } }));
  // 27–28: somersaults back to the question on the left page
  const aStart = WL(RIGHT.x + OFF, RIGHT.y + 30);
  seg_(C.answer - 1, C.answer, u => ({ p: arc(surf(AUS), aStart, u, 240), rot: lerp(AUS + Math.PI / 2, Math.PI * 2, u), pose: POSES.cheer, props: { santa: u < .5 } }));
  // 28–30: writes the answer with the giant pen, jumps onto the box, tick, sunglasses on
  seg_(C.answer, C.answer + .75, pen(RIGHT, C.answer, .7));
  const aEnd = () => [WL(RIGHT.x + (WIDTH[RIGHT.text] ?? 310) + OFF, 0)[0], aStart[1]], boxTop = WL(600, 562);
  seg_(C.answer + .75, C.tick, u => ({ p: arc(aEnd(), boxTop, u, 70), pose: POSES.cheer, flip: true }));
  seg_(C.tick, 99, (u, t) => ({ p: boxTop, pose: t < C.end - .2 ? POSES.cheer : POSES.cool, face: 'grin', props: { glasses: t >= C.end - .2 } }));
}

// window.TEXTS: each readable line with its screen box (the camera transform of render(), applied to the line's corners)
export function texts(ctx, t, Wd, H) {
  const c = camAt(t), z = c.z * (1 + kick(t)) * H / 1080, cr = Math.cos(-.02), sr = Math.sin(-.02);
  const scr = (x, y) => { const dx = x - c.x, dy = y - c.y; return [Wd / 2 + z * (cr * dx - sr * dy), H / 2 + z * (sr * dx + cr * dy)]; };
  const out = [];
  for (const w of [...PRINTED, ...WORDS]) {
    if (t < w.t0) continue;
    const width = w.font === 'hand' ? measure(ctx, w.text, w.size) : (ctx.font = `${w.weight ?? 400} ${w.size}px ${w.face}`, ctx.measureText(w.text).width);
    const [ox, oy] = w.id === 'geoL' ? WL(w.x, w.y) : WR(w.x, w.y), P = [[ox, oy - w.size], [ox + width, oy - w.size], [ox, oy + w.size * .25], [ox + width, oy + w.size * .25]].map(([x, y]) => scr(x, y));
    out.push({ id: w.text, text: w.text, x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), y1: Math.max(...P.map(p => p[1])) });
  }
  return out;
}

function heroAt(t) {
  for (const s of TRACK) if (t >= s.t0 && t < s.t1) return s.f(clamp((t - s.t0) / (s.t1 - s.t0)), t);
  return null;
}
function drawPen(ctx, { tip, kind }, b) {   // a pen taller than the figure: tip on the paper, barrel leaning against him
  const [x, y] = tip, len = 135, ang = -1.0, d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]], w = kind === 'hl' ? 13 : 8;
  const q = (u, v) => [x + d[0] * u + n[0] * v, y + d[1] * u + n[1] * v];
  if (kind === 'hl') hlFill(ctx, [q(14, -w), q(len, -w), q(len, w), q(14, w)], .8);
  P.drawStroke(ctx, new P.Stroke([...q(0, 0), ...q(14, -w), ...q(len, -w), ...q(len, w), ...q(14, w), ...q(0, 0)].flat(), { tool: 'ball', w: 2.8, seed: 520 }), null, b);
  P.drawStroke(ctx, new P.Stroke([...q(len - 26, -w), ...q(len - 26, w)].flat(), { tool: 'ball', w: 2.4, seed: 521 }), null, b);
}
function drawHero(ctx, t, b) {
  for (const R of [WRONG, RIGHT]) if (WIDTH[R.text] == null) { const n = [...R.text].length; WIDTH[R.text] = measure(ctx, R.text, R.size) - .04 * R.size * (n - 1); }
  const h = heroAt(t); if (!h) return;
  if (h.pen) drawPen(ctx, h.pen, b);
  const pose = { ...h.pose }; if (h.flip) pose.lean = -(pose.lean ?? 0);
  ctx.save(); ctx.translate(h.p[0], h.p[1]); if (h.rot) ctx.rotate(h.rot);
  figure(ctx, { s: S, x: 0, y: -FY, ...pose, flip: h.flip, face: h.face ?? 'smile', mouth: h.mouth ?? 0, props: h.props, seed: 501 }, b);
  if (h.shiver) for (const sx of [-1, 1]) P.drawStroke(ctx, new P.Stroke([sx * 40, -78, sx * 47, -68, sx * 40, -58, sx * 47, -48], { tool: 'ball', w: 2, seed: 530 + sx }), null, b);
  ctx.restore();
}

export function render(ctx, t, Wd, H) {
  NOW = t; BOIL = Math.floor(t * 12);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const c = camAt(t), z = c.z * (1 + kick(t)) * H / 1080;
  ctx.translate(Wd / 2, H / 2); ctx.scale(z, z); ctx.rotate(-.02); ctx.translate(-c.x, -c.y);
  const hw = Wd / 2 / z + 400, hh = H / 2 / z + 400;
  drawDesk(ctx, c.x - hw, c.y - hh, c.x + hw, c.y + hh);
  drawSpread(ctx, 'geoL', 'geoR');
  drawHero(ctx, t, BOIL);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(Wd * .3, H * .2, H * .2, Wd * .5, H * .5, H * 1.1);
  g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(40,25,10,.38)'); ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, H);
}
