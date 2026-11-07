// 七十二个座位 · Seventy-Two Seats — library demo for "Isometric Picture-book Explainer" (narrated cut).
// One world, built once: the apron and stand B12, a 12-row 3+3 regional jet (its roof a paper flap), a 7.5 m jet bridge,
// and the gate inside the terminal (floor at 2.3 m, cut away above). Fourteen shots, one per narration line; everything is a function of t.
import { C, W, H, TOPS, LEGS, iso, tri, mix, hex, css, TAU, clamp, lerp, seg, ss, eo, eio, ei, hash,
  onPlane, quad, fillPoly, rect, tracePath, font, phraseLayout, phraseWorld, floorType, phraseBox, drawPerson, drawSeated, subtitles, subtitleBox } from './kit.js';
import { PL, rowY, SEATX, AISLE, DOORY, BR, nose, cabinBack, cabinFront, lid, cabinClosed, aft, wing, bridgeBack, bridgeFront, xAt } from './plane.js';
import { apron, bagTrain, GZ, WALLX, LANES, LANE_Y, LANE1X, chairPos, gateWindow, gateFloor, lanes, groupSign, counter, gateChair, squares, sqPos,
  DOOR_SIGN, COUNTER_SCREEN, SIGN } from './places.js';

// ---------- narration (vo2/*.wav, edge-tts Xiaoxiao +25%) and the shot timeline built from it ----------
export const VO_TEXT = [
  ['每次登机，为什么总要排那么久？', 'Why does boarding always take so long?'],
  ['让后排乘客先上，听起来很合理，后排坐好了，就不会挡着前排的路。', 'Back rows first sounds sensible: once they sit down, they are out of everyone’s way.'],
  ['可机舱里只有一条过道，窄得只够一个人走。', 'But the cabin has one aisle, just wide enough for one person.'],
  ['只要前面有一个人停下来放箱子，后面所有人都得干等着。', 'When one person stops to stow a bag, everyone behind has to wait.'],
  ['因为叫的都是相邻那几排，大家全挤在同一个地方，只能一个接一个来。', 'They were called for the same few rows, so they crowd one spot and go one by one.'],
  ['全部坐满，足足用了六分五十四秒。', 'Filling every seat took a full 6 minutes 54 seconds.'],
  ['那如果换个顺序呢？', 'What if we change the order?'],
  ['让靠窗的人先上，而且前后两个人之间，刚好隔开一排。', 'Window seats first, and each person sits one row apart from the next in line.'],
  ['这样一来，六个人就能同时在六个不同的排数放箱子，谁也不挡谁的路。', 'Now six people stow bags in six different rows at once, and nobody blocks anybody.'],
  ['结果全部坐满，只花了三分三十六秒。', 'Every seat was filled in just 3 minutes 36 seconds.'],
  ['足足快了三分多钟，时间缩短了将近一半。', 'More than three minutes faster: nearly half the time.'],
  ['这是2012年，研究人员找来七十二名乘客做过的真实测试。', 'This was a real test, run in 2012 with 72 passengers.'],
  ['原来登机慢，根本不是因为人多，而是把所有人都堵在了同一段过道上。', 'Boarding is slow not because of crowds, but because everyone is stuck in the same stretch of aisle.'],
];
const VO_DUR = [2.168, 4.68, 3.028, 3.859, 5.12, 2.527, 1.187, 3.784, 4.719, 2.64, 2.883, 4.374, 4.671];
const G = .2;   // breath before and after each line

// the weave (Steffen order): 12 waves of 6, each wave stops at every other row at once
const WAVES = [];
{
  const even = [12, 10, 8, 6, 4, 2], odd = [11, 9, 7, 5, 3, 1], by = (s, rows) => rows.map(r => [r, s]);
  for (const [a, b] of [['A', 'F'], ['B', 'E'], ['C', 'D']]) WAVES.push(by(a, even), by(b, even), by(a, odd), by(b, odd));
}
const ORDER2 = WAVES.flat();

export const S = [], VO = [];      // shots [t0, t1]; narration starts
const T = {};
{
  let t = 0;
  const shot = (len) => { S.push([t, t + len]); t += len; return S[S.length - 1]; };
  const say = (i, at) => { VO[i] = at; return at + VO_DUR[i]; };
  // 1 opening: title on the stand
  say(0, .45); shot(3.4);
  // 2 gate: back rows first
  { const t0 = t; const e = say(1, t0 + .3); shot(e + G - t0); }
  // 3 bridge → flap → cabin
  { const t0 = t; const e = say(2, t0 + G); shot(e + G - t0); }
  // 4 one person stops, everyone waits
  { const t0 = t; const e = say(3, t0 + G); shot(e + G - t0); }
  // 5 the called rows crowd one stretch
  { const t0 = t; const e = say(4, t0 + G); shot(e + G - t0); }
  // 6 time-lapse to 6:54 (the number held ≥ 2.5 s)
  { const t0 = t; const v = t0 + G; const e = say(5, v); shot(Math.max(e + G, v + .55 + 2.5) - t0); }
  // 7 rewind, then the new order lights up seat by seat
  { const t0 = t; say(6, t0 + .3); shot(2.55); }
  // 8 the line on numbered squares
  { const t0 = t; const e = say(7, t0 + G); shot(e + G - t0); }
  // 9 the weave (length set by the choreography below)
  { const t0 = t; T.WV0 = t0; say(8, t0 + G); }
}
const WT = []; {
  const w0 = T.WV0 + .35, w1 = w0 + 1.3, w2 = w1 + .8, w3 = w2 + 1.0;
  WT.push({ w0, w1, w2, w3, fast: false });
  WAVES.slice(1).forEach((w, j) => { const f0 = w3 - .05 + j * .28; WT.push({ w0: f0, w1: f0 + .12, w2: f0 + .16, w3: f0 + .36, fast: true }); });
}
export const WV_END = WT[WT.length - 1].w3;
{
  let t = Math.max(WV_END + .2, VO[8] + VO_DUR[8] + G); S.push([T.WV0, t]);
  const shot = (len) => { S.push([t, t + len]); t += len; };
  const say = (i, at) => { VO[i] = at; return at + VO_DUR[i]; };
  // 10 3:36
  { const t0 = t; const v = t0 + G; const e = say(9, v); shot(Math.max(e + G, v + .3 + 2.5) - t0); }
  // 11 the two time bars
  { const t0 = t; const e = say(10, t0 + .75); shot(Math.max(e + G, t0 + .35 + .9 + 2.5 + 1.3) - t0); }
  // 12 the test: 72 passengers in formation
  { const t0 = t; const e = say(11, t0 + .45); shot(e + G - t0); }
  // 13 back in the aisle: the same stretch
  { const t0 = t; const e = say(12, t0 + G); shot(e + G - t0); }
  // 14 end card
  shot(3.12);
}
export const DUR = +S[S.length - 1][1].toFixed(2);
const sh = i => S[i - 1];                       // shot i (1-based) → [t0, t1]
const inShot = (t, i) => t >= sh(i)[0] && t < sh(i)[1];
const CUES = VO_TEXT.map(([cn, en], i) => ({ cn, en, t0: VO[i] - .05, t1: VO[i] + VO_DUR[i] + .12 }));
CUES.forEach((c, i) => { if (CUES[i + 1]) c.t1 = Math.min(c.t1, CUES[i + 1].t0 - .1); });

// sub-timings
Object.assign(T, {
  TITLE: .35,
  MOVE0: sh(2)[0], MOVE1: sh(2)[0] + 1.2, CHIME: sh(2)[0] + .3, SIGN: sh(2)[0] + .45, STAND0: sh(2)[0] + .5, FT1: sh(2)[0] + 1.0,
  LID0: sh(3)[0] + .35, LID1: sh(3)[0] + 2.9, WIDE: sh(3)[0] + 1.25, SETTLE: sh(3)[0] + 1.9, RISE1: sh(3)[0] + 2.9, FT2: sh(3)[0] + .3,
  FT3: sh(4)[0] + .5, FT5a: sh(5)[0] + .45, FAST0: sh(6)[0], FAST1: sh(6)[0] + 1.1, FT4: VO[5] + .55,
  REW0: sh(7)[0], LIGHT0: sh(7)[0] + .75, FT7: sh(7)[0] + .1, FT8: VO[7] + .1, FT9: sh(9)[0] + 1.2, FT10: sh(10)[0] + .05,
  BARS0: sh(11)[0] + .35, BRACKET: sh(11)[0] + .35 + .9 + 2.5, FORM0: sh(12)[0] + .2, FT12: sh(12)[0] + 1.1, BAND: sh(13)[0] + .3, END0: sh(14)[0] + .15,
});

// ---------- the 72 passengers ----------
export const PAX = [];
{
  let i = 0;
  for (let r = 1; r <= 12; r++) for (const s of 'ABCDEF') {
    const hsh = hash(i * 3.17 + 1.3), h2 = hash(i * 7.91 + 4.2);
    PAX.push({ i, row: r, seat: s, h: 1.6 + h2 * .2, top: TOPS[Math.floor(hash(i * 5.3 + .7) * 4)], legs: LEGS[Math.floor(h2 * 4)], hairLong: hsh > .62 ? 1 : 0,
      bagc: ['#5E6660', '#6E6252', '#4F5A66', '#7A6E62'][Math.floor(hash(i * 2.1) * 4)] });
    i++;
  }
  const front = PAX.filter(p => p.row >= 9).sort((a, b) => hash(a.i * 13.7 + 2) - hash(b.i * 13.7 + 2));
  const rest = PAX.filter(p => p.row < 9).sort((a, b) => hash(a.i * 9.1 + 5) - hash(b.i * 9.1 + 5));
  front.forEach((p, k) => p.chair = k); rest.forEach((p, k) => p.chair = 24 + k);
}
const paxBySeat = (r, s) => PAX[(r - 1) * 6 + 'ABCDEF'.indexOf(s)];
const SPEED = 1.5, STRIDE = .72, GAPM = .75;

// ---------- the queue path and the first boarding (rows 9–12 first), simulated once at load ----------
const QP = [[LANE1X, 18], [LANE1X, -.35], [WALLX, DOORY], [BR.x0, DOORY], [0, DOORY], [0, rowY(12) + .4]];
const QL = [0]; for (let i = 1; i < QP.length; i++) QL.push(QL[i - 1] + Math.hypot(QP[i][0] - QP[i - 1][0], QP[i][1] - QP[i - 1][1]));
const S_AISLE = QL[4];
const sRow = r => S_AISLE + (rowY(r) - DOORY);
function qAt(s) {
  s = clamp(s, -50, QL[QL.length - 1]);
  if (s < 0) return { x: QP[0][0], y: QP[0][1] - s, z: GZ };
  for (let i = 1; i < QP.length; i++) if (s <= QL[i] || i === QP.length - 1) { const f = (s - QL[i - 1]) / (QL[i] - QL[i - 1] || 1); const x = lerp(QP[i - 1][0], QP[i][0], f), y = lerp(QP[i - 1][1], QP[i][1], f); return { x, y, z: x < BR.x0 - .05 ? PL.FLOOR : GZ }; }
}
const RUN1 = PAX.filter(p => p.row >= 9).sort((a, b) => a.chair - b.chair).map((p, q) => {
  const c = chairPos(p.chair), ts = T.STAND0 + q * .3, walk = (c.x - LANE1X) / SPEED;
  return { p, c, q, ts, tw: ts + .35, tq: ts + .35 + walk, sJoin: QP[0][1] - c.y };
});
const SIM_DT = 1 / 30, SIM_T0 = T.STAND0, SIM_END = 40;
const SIM = (() => {
  const st = RUN1.map(() => ({ s: null, mode: 'gate', t0: 0 })), frames = [];
  for (let t = SIM_T0; t <= SIM_END; t += SIM_DT) {
    RUN1.forEach((o, k) => {
      const Sx = st[k];
      if (Sx.mode === 'gate' && t >= o.tq) { Sx.mode = 'walk'; Sx.s = o.sJoin; }
      if (Sx.mode === 'walk') {
        const target = sRow(o.p.row); let lim = target;
        for (let j = k - 1; j >= 0; j--) if (st[j].mode === 'walk' || st[j].mode === 'stow' || (st[j].mode === 'sit' && t - st[j].t0 < .5)) { lim = Math.min(lim, st[j].s - GAPM); break; }   // a sitter blocks until out of the aisle
        Sx.s = Math.min(Sx.s + SPEED * SIM_DT, Math.max(Sx.s, lim));
        if (Sx.s >= target - 1e-6) { Sx.mode = 'stow'; Sx.t0 = t; }
      } else if (Sx.mode === 'stow' && t - Sx.t0 > 1.7) { Sx.mode = 'sit'; Sx.t0 = t; }
    });
    frames.push(st.map(x => ({ s: x.s, mode: x.mode, t0: x.t0 })));
  }
  return frames;
})();
const simAt = ts => {
  const f = clamp((ts - SIM_T0) / SIM_DT, 0, SIM.length - 1.001), i = Math.floor(f), u = f - i, A = SIM[i], B = SIM[i + 1];
  return A.map((x, k) => (x.s == null || B[k].s == null ? x : { ...x, s: lerp(x.s, B[k].s, u) }));
};
// film time → simulation time, per shot: the gate runs live; the bridge shot jumps to the head of the line at the aircraft door;
// the jammed shots look a few minutes in, slowed
const LEAD_DOOR = (() => { for (let ts = SIM_T0; ts < SIM_END; ts += SIM_DT) { const s = simAt(ts)[0].s; if (s != null && s >= QL[3] - 1.4) return ts; } return 13; })();
function simT(t) {
  if (t < sh(3)[0]) return t;
  if (t < sh(4)[0]) return LEAD_DOOR + (t - sh(3)[0]);
  if (t < sh(7)[0]) return 26.6 + (t - sh(5)[0]) * .5;
  if (inShot(t, 13)) return 27.2 + (t - sh(13)[0]) * .3;
  return 30;
}
const FILL = (() => {
  const f = simAt(simT(T.FAST0 - .01)), seatedNow = new Set();
  RUN1.forEach((o, k) => { if (f[k].mode === 'sit') seatedNow.add(o.p.i); });
  const grp = p => p.row >= 9 ? 0 : p.row <= 4 ? 1 : 2;
  const order = PAX.slice().sort((a, b) => (seatedNow.has(b.i) - seatedNow.has(a.i)) || grp(a) - grp(b) || hash(a.i * 4.4) - hash(b.i * 4.4));
  return { rank: new Map(order.map((p, k) => [p.i, k])), nPre: seatedNow.size, seatedNow };
})();

// ---------- camera ----------
const KEY = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u)) });
const CAM = {
  openA: { x: -4.4, y: -14.8, z: .4, k: 58 }, openB: { x: -4.0, y: -14.2, z: .4, k: 62 },
  gateA: { x: 14.0, y: 2.6, z: 3.7, k: 72 }, gateB: { x: 13.0, y: 1.4, z: 3.6, k: 76 },
  wide: { x: 1.0, y: 3.4, z: 2.9, k: 76 }, cabin: { x: 1.6, y: 3.5, z: 2.15, k: 86 },
  stopA: { x: 2.1, y: rowY(6.9), z: 2.3, k: 106 }, stopB: { x: 2.1, y: rowY(7.2), z: 2.3, k: 111 },
  jamA: { x: 1.6, y: 3.6, z: 2.15, k: 88 }, jamB: { x: 1.4, y: 3.1, z: 2.15, k: 92 },
  gate2A: { x: 13.6, y: 3.4, z: 3.6, k: 70 }, gate2B: { x: 13.1, y: 2.6, z: 3.5, k: 74 },
  weaveA: { x: .5, y: 5.4, z: 2.6, k: 94 }, weaveB: { x: .5, y: 4.3, z: 2.6, k: 92 }, fullB: { x: 1.4, y: 3.1, z: 2.15, k: 92 },
  barsA: { x: -6.8, y: -20.6, z: 0, k: 54 }, barsB: { x: -6.6, y: -20.9, z: 0, k: 58 },
  formA: { x: -9.8, y: -16.4, z: .8, k: 60 }, formB: { x: -9.6, y: -16.6, z: .8, k: 63 },
  callA: { x: 1.6, y: 3.6, z: 2.15, k: 88 }, callB: { x: 1.4, y: 3.1, z: 2.15, k: 92 },
  endA: { x: -6.0, y: -14.6, z: .3, k: 54 }, endB: { x: -5.9, y: -14.8, z: .3, k: 56 },
};
const leadPos = ts => { const x = simAt(ts)[0]; return x.s == null ? { x: LANE1X, y: 1 } : qAt(x.s); };
export function camAt(t) {
  const u = i => seg(t, sh(i)[0], sh(i)[1]);
  if (t < sh(2)[0]) return KEY(CAM.openA, CAM.openB, ss(u(1)));
  if (t < sh(3)[0]) return t < T.MOVE1 ? KEY(CAM.openB, CAM.gateA, eio(seg(t, T.MOVE0, T.MOVE1))) : KEY(CAM.gateA, CAM.gateB, ss(seg(t, T.MOVE1, sh(3)[0] + .3)));
  if (t < sh(4)[0]) {
    const L = leadPos(simT(sh(3)[0])), f = { x: L.x + 1.4, y: L.y + 1.2, z: GZ, k: 76 };
    return t < T.SETTLE ? KEY(f, CAM.wide, eio(seg(t, sh(3)[0] + .15, T.WIDE))) : KEY(CAM.wide, CAM.cabin, eio(seg(t, T.SETTLE, T.RISE1)));
  }
  if (t < sh(5)[0]) return KEY(CAM.stopA, CAM.stopB, ss(u(4)));
  if (t < sh(6)[0]) return KEY(CAM.jamA, CAM.jamB, ss(u(5)));
  if (t < sh(8)[0]) return CAM.jamB;
  if (t < sh(9)[0]) return KEY(CAM.gate2A, CAM.gate2B, ss(u(8)));
  if (t < sh(10)[0]) return KEY(CAM.weaveA, CAM.weaveB, ss(u(9)));
  if (t < sh(11)[0]) return KEY(CAM.weaveB, CAM.fullB, ss(u(10)));
  if (t < sh(12)[0]) return t < sh(11)[0] + .55 ? KEY(CAM.fullB, CAM.barsA, eio(seg(t, sh(11)[0], sh(11)[0] + .55))) : KEY(CAM.barsA, CAM.barsB, ss(seg(t, sh(11)[0] + .55, sh(11)[1])));
  if (t < sh(13)[0]) return t < sh(12)[0] + .8 ? KEY(CAM.barsB, CAM.formA, eio(seg(t, sh(12)[0], sh(12)[0] + .8))) : KEY(CAM.formA, CAM.formB, ss(seg(t, sh(12)[0] + .8, sh(12)[1])));
  if (t < sh(14)[0]) return KEY(CAM.callA, CAM.callB, ss(u(13)));
  return KEY(CAM.endA, CAM.endB, ss(u(14)));
}

// ---------- people ----------
function seated(p, x, y, u = 1, a = 1) { globalThis.__POS?.push({ i: p.i, k: 's', x, y, a }); iso.bill(x, y + .02, PL.FLOOR, gg => { gg.globalAlpha *= a; drawSeated(gg, p); }, { layer: 1, r: 2 }); }
// step back into the row's legroom, walk sideways to the seat, then sit (a short cross-fade, never sinking or floating)
function seatIn(p, r, s, u, a = 1) {
  const sx = SEATX[s], y = rowY(r), back = ss(seg(u, 0, .2)), go = ss(seg(u, .15, .7)), sit = ss(seg(u, .68, .95));
  if (sit < 1) { const x = lerp(0, sx * .92, go); standing(p, { x, y: y - .36 * back, z: PL.FLOOR }, { walking: go > 0 && go < 1, phase: x * 8 }, a * (1 - sit)); }
  if (sit > 0) seated(p, sx, y, 1, a * sit);
}
// stowing: lift the case overhead (0–.3), carry it up and over onto the open bin of that side (.3–.7), lower it in (.7–.9)
let CASES = [];
function stowState(p, row, seat, u) {
  const lift = ss(seg(u, 0, .3)) * (1 - ss(seg(u, .8, .95)));
  if (u > .3 && u < .92) {
    const side = 'ABC'.includes(seat) ? -1 : 1, xb = side < 0 ? -PL.RX + .03 + .19 : xAt(PL.CUTN) - .135, ztop = (side < 0 ? PL.CUTF : PL.CUTN) + .24;
    const m = ss(seg(u, .3, .7)), d = ss(seg(u, .7, .92)), arc = Math.sin(Math.PI * m) * .25;
    CASES.push({ x: lerp(0, xb, m), y: rowY(row) - .05, z: lerp(PL.FLOOR + 2.0, ztop + .12, m) + arc - d * .2, a: 1 - d, c: p.bagc });
  }
  return { lift, caseUp: u <= .3 };
}
function drawCases(g) { for (const c of CASES) { g.save(); g.globalAlpha *= c.a; iso.boxNow(c.x - .2, c.y - .16, c.z, .4, .32, .22, tri(c.c || '#5E6660', .25, .2)); g.restore(); } CASES = []; }
function standing(p, pos, pose = {}, a = 1, mark = 0) {
  globalThis.__POS?.push({ i: p.i, k: 'w', x: pos.x, y: pos.y, a });   // read by tools/motion_check.mjs
  iso.bill(pos.x, pos.y, pos.z ?? PL.FLOOR, gg => {
    gg.globalAlpha *= a; drawPerson(gg, p, pose);
    if (mark > 0) { // a small persimmon marker over the person who stopped
      gg.globalAlpha *= mark; gg.fillStyle = C.accent; const y = -p.h - .42 - (pose.lift ? .18 : 0);
      gg.beginPath(); gg.moveTo(-.13, y - .2); gg.lineTo(.13, y - .2); gg.lineTo(0, y); gg.closePath(); gg.fill();
    }
  }, { layer: 1, r: 2 });
}
function gatePeople1(t) {
  for (const p of PAX) {
    const c = chairPos(p.chair), o = RUN1.find(o => o.p === p);
    if (o && t >= o.ts) {
      if (t >= o.tq) continue;
      const up = ss(seg(t, o.ts, o.tw)), d = Math.max(0, (t - o.tw) * SPEED);
      standing(p, { x: c.x - .25 * up - d, y: c.y, z: GZ }, { walking: d > 0, phase: d / STRIDE * Math.PI, bag: 1 });
      continue;
    }
    iso.bill(c.x - .02, c.y, GZ, gg => drawSeated(gg, p), { layer: 1, r: 2 });
  }
}
function queuePeople(ts, region, a = 1) {
  const f = simAt(ts);
  RUN1.forEach((o, k) => {
    const X = f[k]; if (X.s == null || X.mode === 'gate') return;
    const p = o.p, pos = qAt(X.s), reg = pos.x >= WALLX ? 'gate' : pos.x >= BR.x0 - .05 ? 'bridge' : 'cabin';
    if (reg !== region) return;
    if (X.mode === 'sit') { seatIn(p, p.row, p.seat, seg(ts, X.t0, X.t0 + 1.2), a); return; }
    const walking = X.mode === 'walk' && (k === 0 || f[k - 1].s == null || X.s < sRow(p.row) - .01) && (k === 0 || f[k - 1].mode !== 'stow' || f[k - 1].s - X.s > GAPM + .05);
    const st = X.mode === 'stow' ? stowState(p, p.row, p.seat, seg(ts, X.t0, X.t0 + 1.7)) : { lift: 0, caseUp: true };
    standing(p, pos, { walking, phase: X.s / STRIDE * Math.PI, bag: X.mode === 'walk' ? 1 : 0, lift: st.lift, caseUp: st.caseUp }, a);
  });
}
const binOpenSim = ts => { const f = simAt(ts), m = new Map(); RUN1.forEach((o, k) => { const X = f[k]; if (X.mode === 'stow') { const u = seg(ts, X.t0, X.t0 + 1.7); m.set(o.p.row * 2 + ('DEF'.includes(o.p.seat) ? 1 : 0), ss(seg(u, .15, .3)) * (1 - ss(seg(u, .88, 1)))); } }); return (r, side) => m.get(r * 2 + (side > 0 ? 1 : 0)) || 0; };

// ---------- cabin furniture ----------
const SEAT_T = tri(C.green, .22, .2);
function seats(glow) {
  for (let r = 1; r <= 12; r++) for (const s of 'ABCDEF') {
    const x = SEATX[s], y = rowY(r), F = PL.FLOOR, gl = glow ? glow(r, s) : 0;
    const T3 = gl > 0 ? tri(hex(mix(C.green, C.accent, gl * .6)), .22, .2) : SEAT_T;
    iso.box(x - .21, y - .22, F + .34, .42, .46, .1, T3, { bias: -.39 });
    iso.box(x - .21, y + .24, F + .36, .42, .1, .44, T3, { bias: -.58, faceColor: { 0: gl > 0 ? hex(mix('#F3ECDF', C.accentLt, gl)) : '#F3ECDF', 3: '#F3ECDF' } });
  }
}
function bins(open, full) {
  const binBox = (x0, w, y0, y1, z, side, rows, bias) => iso.box(x0, y0, z, w, y1 - y0, .24, tri('#EEE8DC', .3, .18), { bias, decal: I => {
    const g = I.g, zz = z + .24;
    g.save(); g.strokeStyle = 'rgba(140,125,100,.35)'; g.lineWidth = 1;
    for (const r of rows) { if (r === 12) continue; const y = rowY(r) + .405; if (y <= y0 || y >= y1) continue; g.beginPath(); g.moveTo(...I.P(x0, y, zz)); g.lineTo(...I.P(x0 + w, y, zz)); g.lineTo(...I.P(x0 + w, y, z)); g.stroke(); }
    g.restore();
    for (const r of rows) {
      const op = open?.(r, side) || 0; if (op <= 0) continue;
      const y = rowY(r), hx = side < 0 ? x0 : x0 + w, ang = op * 1.95;
      fillPoly(g, quad(rect(x0 + .04, x0 + w - .04, y - .36, y + .36), zz + .002), '#5A5F59');
      if (full?.(r, side)) fillPoly(g, quad(rect(x0 + .06, x0 + w - .06, y - .3, y + .3), zz + .004), '#7A6E62');
      const ex = -side * Math.cos(ang) * w, ez = Math.sin(ang) * w;
      fillPoly(g, [I.P(hx, y - .4, zz), I.P(hx, y + .4, zz), I.P(hx - ex, y + .4, zz + ez), I.P(hx - ex, y - .4, zz + ez)], '#F7F2E8');
    }
  } });
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  binBox(-PL.RX + .03, .38, rowY(1) - .45, rowY(12) + .45, PL.CUTF, -1, all, -10);
  const w = .27, x0 = xAt(PL.CUTN) - w;
  for (const r of all) binBox(x0, w, rowY(r) - .405, rowY(r) + .405, PL.CUTN, 1, [r], -(PL.CUTN + .12 - PL.FLOOR));
}

// ---------- floor type: only the narration's key words and numbers ----------
const PH = {
  title: { x: -3.6, y: -11.4, z: 0, t0: T.TITLE, t1: sh(2)[0] + 1.0, step: .13, scale: 1.6, lines: [[['七十二个', 'B'], ['座位', 'A']], [['SEVENTY-TWO SEATS', 'en']]], dv: 1.55, indent: .1 },
  ft1: { x: WALLX + 6.6, y: -1.0, z: GZ, t0: T.FT1, t1: sh(3)[0] + .6, step: .15, lines: [[['后', 'A'], ['排先上', 'B']]] },
  ft2: { x: 2.75, y: 6.2, z: 0, t0: T.FT2, t1: sh(4)[0], step: .13, lines: [[['只有', 's'], ['一条过道', 'B']]] },
  ft3: { x: 2.6, y: 6.4, z: 0, t0: T.FT3, t1: sh(5)[0], step: .14, lines: [[['一人', 'B'], ['停', 'A'], [' 后面全等', 's']]] },
  ft5: { x: 2.6, y: 6.0, z: 0, t0: T.FT5a, t1: sh(6)[0], step: .14, lines: [[['挤在', 's'], ['同一处', 'B']]] },
  ft4: { x: 2.75, y: 5.2, z: 0, t0: T.FT4, t1: sh(7)[0] + .2, step: .14, lines: [[['6:54', 'n'], ['  全部坐满', 's']]] },
  ft7: { x: 2.75, y: 5.6, z: 0, t0: T.FT7, t1: sh(8)[0], step: .12, lines: [[['换个', 's'], ['顺序', 'A']]] },
  ft8: { x: WALLX + 6.6, y: -1.0, z: GZ, t0: T.FT8, t1: sh(9)[0], step: .14, lines: [[['靠', 'B'], ['窗', 'A'], ['先上', 'B']], [['隔开一排', 's']]], dv: 1.7, indent: .25 },
  ft9: { x: 2.3, y: 5.7, z: 0, t0: T.FT9, t1: sh(10)[0], step: .14, scale: .85, lines: [[['六', 'A'], ['排同时放', 'B']]] },
  ft10: { x: 2.75, y: 5.2, z: 0, t0: T.FT10, t1: sh(11)[0] + .4, step: .14, lines: [[['3:36', 'na'], ['  全部坐满', 's']]] },
  b1: { x: -6.33, y: -28.8, z: 0, t0: T.BARS0 + .55, t1: sh(12)[0] + .7, step: .12, scale: 1.3, lines: [[['6:54', 'n']]] },
  b2: { x: -3.33, y: -22.1, z: 0, t0: T.BARS0 + .9, t1: sh(12)[0] + .7, step: .12, scale: 1.3, lines: [[['3:36', 'na']]] },
  b3: { x: -1.55, y: -20.0, z: 0, t0: T.BRACKET + .15, t1: sh(12)[0] + .7, step: .1, scale: 1, lines: [[['快了三分多钟', 's']]] },
  ft12: { x: -6.2, y: -12.6, z: 0, t0: T.FT12, t1: sh(13)[0], step: .12, scale: 1.25, lines: [[['2012', 'n'], [' · 72 名乘客', 's']]] },
  ft13: { x: 2.3, y: 5.7, z: 0, t0: T.BAND + .2, t1: sh(14)[0], step: .14, scale: .85, lines: [[['同', 'A'], ['一段过道', 'B']]] },
  end: { x: -3.2, y: -11.0, z: 0, t0: T.END0, t1: 99, step: .16, scale: 1.25, lines: [[['LemoLab', 'e'], [' × ', 'e'], ['Claude', 'e'], [' Opus', 'e'], [' 5.5', 'e']]] },
  // licence credit (fine print, not timed by readcheck): fades in under the sign-off as the shot opens, so it holds to the end (≥ 2.5 s)
  endcr: { x: -3.2 + 1.25 * 1.25, y: -11.0, z: 0, t0: T.END0 - .1, t1: 99, step: .05, lineGap: 0, scale: 1.25, dv: 1.0, indent: 0, pass: true,
    lines: [[['Piano samples: “Salamander Grand Piano V3”', 'en']], [['by Alexander Holm, CC BY 3.0', 'en']]] },
};
const LAY = {}; for (const k in PH) LAY[k] = phraseLayout(PH[k]);
const typeAt = (g, t, Q, keys) => { if (!Q.has('notype')) for (const k of keys) floorType(g, t, PH[k], LAY[k]); };

// ---------- the world ----------
const planeDy = t => t < 3.0 ? 14 * (1 - eo(seg(t, 0, 3.0))) : 0;
const bridgeX0 = t => lerp(4.6, BR.x0, eio(seg(t, 2.7, 3.4)));
function withDy(dy, fn) { const c = iso.cam; iso.cam = { ...c, y: c.y - dy }; fn(); iso.cam = c; }
// the gate: first order (lanes, called rows), second order (one line on numbered squares), or empty
function gateLayer(g, t, Q) {
  const phase = t < sh(7)[0] ? 1 : t < sh(9)[0] ? 2 : 3;
  gateFloor(g);
  lanes(g, { lit: phase === 1 ? 0 : -1, litA: phase === 1 ? ss(seg(t, T.SIGN, T.SIGN + .3)) : 0, a: phase === 2 ? 0 : phase === 3 ? .7 : 1 });
  if (phase === 2) squares(g, ORDER2.map(([r, s], k) => k < 6 && inShot(t, 8) ? `${r}${s}` : ''));
  typeAt(g, t, Q, phase === 1 ? ['ft1'] : phase === 2 ? ['ft8'] : []);
  counter(g);
  for (let i = 0; i < 72; i++) { const c = chairPos(i); gateChair(c.x, c.y); }
  if (phase === 1 && t < sh(3)[0]) LANES.forEach((L, i) => groupSign(g, i, i === 0 ? ss(seg(t, T.SIGN, T.SIGN + .3)) : 0));
  if (phase === 1) { const ts = simT(t); gatePeople1(ts); queuePeople(ts, 'gate'); }   // one clock for the whole gate
  if (phase === 2) ORDER2.forEach(([r, s], k) => { const q = sqPos(k); standing(paxBySeat(r, s), { x: q.x - q.dx * .2, y: q.y - q.dy * .2, z: GZ }, { bag: 1 }); });
  iso.flush();
}
function planeExterior(g, t) { withDy(planeDy(t), () => { wing(g, -1); nose(g, null); cabinClosed(g); aft(g); wing(g, 1); }); }
function exterior(g, t, Q, o = {}) {
  iso.g = g; iso.cam = o.cam || camAt(t);
  apron(g);
  typeAt(g, t, Q, o.type || []);
  o.marks?.(g);
  bagTrain(g, -18.4, -14.6);
  o.crowd?.();
  iso.flush();
  planeExterior(g, t);
  const x0 = bridgeX0(t); bridgeBack(g, x0); bridgeFront(g, x0);
  gateWindow(g, { a: 1, h: o.glassH ?? 4.6, sign: o.sign ?? true });
  gateLayer(g, t, Q);
}
function cabinScene(g, t, Q, o = {}) {
  iso.g = g; iso.cam = o.cam || camAt(t);
  apron(g, { stand: false });
  typeAt(g, t, Q, o.type || []);
  wing(g, -1);
  nose(g, o.timer);
  cabinBack(g, { decal: o.floorDecal });
  seats(o.glow); bins(o.binOpen, o.binFull);
  o.people?.();
  iso.flush();
  drawCases(g);
  cabinFront(g);
  aft(g);
  wing(g, 1);
  bridgeBack(g);
  o.bridgePeople?.(); iso.flush();
  bridgeFront(g);
  const gl = o.glass ?? { a: 1, h: 1.1 }; if (gl.a > 0) gateWindow(g, gl);
  gateLayer(g, t, Q);
  if (o.lid) lid(g, o.lid);
}
const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function lidOpen(t, a, b) {
  if (t < a) return { a: 1, rot: 0, dx: 0, dy: 0, dz: 0 };
  if (t >= b) return null;
  const m = a + (b - a) * .48, h = a + (b - a) * .64, flip = eio(seg(t, a, m)), go = ei(seg(t, h, b));
  return { a: 1, rot: 2.75 * flip, dx: -4 * go, dy: -2.5 * go, dz: .25 * Math.sin(Math.PI * seg(t, a, m)) + 10 * go };
}
const floorTint = (y0, y1, col, a) => g2 => { g2.save(); g2.globalAlpha = a; fillPoly(g2, quad(rect(-xAt(PL.FLOOR) + .05, xAt(PL.FLOOR) - .05, y0, y1), PL.FLOOR + .002), col); g2.restore(); };
const aisleBand = (y0, y1, a) => g2 => { if (a <= 0) return; g2.save(); g2.globalAlpha = a; fillPoly(g2, quad(rect(-AISLE + .02, AISLE - .02, y0, y1), PL.FLOOR + .003), C.accent); g2.restore(); };

// ---------- the fourteen shots ----------
function shot1(g, t, Q) { exterior(g, t, Q, { type: ['title'], sign: false }); }
function shot2(g, t, Q) { exterior(g, t, Q, { type: ['title'], sign: t >= T.MOVE1 - .3 }); }
function shot3(g, t, Q) {
  const ts = simT(t);
  cabinScene(g, t, Q, {
    type: ['ft2'], timer: { s: '0:00' }, lid: lidOpen(t, T.LID0, T.LID1), glass: t < T.SETTLE ? { a: 1 - ss(seg(t, sh(3)[0], sh(3)[0] + .5)), h: 4.6 } : { a: ss(seg(t, T.SETTLE, T.RISE1)), h: 1.1 },
    floorDecal: g2 => aisleBand(DOORY + .5, lerp(DOORY + .5, rowY(12) + .3, eo(seg(t, T.SETTLE - .2, T.SETTLE + .8))), .45 * ss(seg(t, T.SETTLE - .2, T.SETTLE + .2)))(g2),
    people: () => queuePeople(ts, 'cabin'), bridgePeople: () => queuePeople(ts, 'bridge'),
  });
}
function shot4(g, t, Q) { // one person stops to stow a bag (marked), the line behind stops
  const u = t - sh(4)[0], P9 = RUN1.map(o => o.p), yS = rowY(9);
  const su = seg(u, .4, 3.8), stop = ss(seg(u, 0, .5)), bside = 'ABC'.includes(P9[0].seat) ? -1 : 1;
  cabinScene(g, t, Q, {
    type: ['ft3'], timer: { s: fmt(72 + u * 4), hot: false }, binOpen: (r, s) => r === 9 && s === bside ? ss(seg(su, .15, .3)) * (1 - ss(seg(su, .9, 1))) : 0,
    people: () => {
      const st = stowState(P9[0], 9, P9[0].seat, su);
      standing(P9[0], { x: 0, y: yS, z: PL.FLOOR }, { bag: su > 0 ? 0 : 1, lift: st.lift, caseUp: st.caseUp }, 1, ss(seg(u, .3, .6)));
      for (let k = 1; k < 9; k++) standing(P9[k], qAt(sRow(9) - .75 * k - (1 - stop) * .5), { bag: 1, walking: stop < 1, phase: (u + k) * 3 });
      [[10, 'A'], [12, 'F'], [11, 'C'], [12, 'D']].forEach(([r, s]) => seated(paxBySeat(r, s), SEATX[s], rowY(r)));
    },
    bridgePeople: () => { for (let k = 9; k < 14; k++) standing(P9[k], qAt(sRow(9) - .75 * k - (1 - stop) * .5), { bag: 1, walking: stop < 1, phase: (u + k) * 3 }); },
  });
}
function shot5(g, t, Q) { // the rows called first all crowd the back stretch of the aisle
  const ts = simT(t), a = ss(seg(t, sh(5)[0] + .3, sh(5)[0] + .9));
  cabinScene(g, t, Q, {
    type: ['ft5'], timer: { s: fmt(221 + (t - sh(5)[0]) * 6) }, binOpen: binOpenSim(ts),
    floorDecal: floorTint(rowY(9) - .45, rowY(12) + .5, C.accentLt, .55 * a),
    people: () => queuePeople(ts, 'cabin'), bridgePeople: () => queuePeople(ts, 'bridge'),
  });
}
function shot6(g, t, Q) { // time-lapse: rows 9–12, then 1–4, then 5–8 fill; the timer stops on 6:54
  const ts = simT(sh(6)[0] - .01), fu = seg(t, T.FAST0, T.FAST1), simA = 1 - ss(seg(t, T.FAST0, T.FAST0 + .3));
  const tm = fmt(lerp(221 + (sh(6)[0] - sh(5)[0]) * 6, 414, ei(fu) * .3 + eo(fu) * .7));
  cabinScene(g, t, Q, {
    type: ['ft4'], timer: { s: tm, hot: t >= T.FAST1 },
    people: () => {
      if (simA > 0) queuePeople(ts, 'cabin', simA);
      for (const p of PAX) {
        if (FILL.seatedNow.has(p.i)) { seated(p, SEATX[p.seat], rowY(p.row)); continue; }
        const k = FILL.rank.get(p.i) - FILL.nPre, n = 72 - FILL.nPre, tf = T.FAST0 + .1 + k / n * .9, v = ss(seg(t, tf, tf + .12));
        if (v > 0) seated(p, SEATX[p.seat], rowY(p.row), v, v);
      }
    },
    bridgePeople: () => { if (simA > 0) queuePeople(ts, 'bridge', simA); },
  });
}
function shot7(g, t, Q) { // rewind to an empty cabin, then the new order lights up seat by seat
  const ru = seg(t, T.REW0, T.REW0 + .6);
  const lit = (r, s) => { const k = ORDER2.findIndex(([rr, ss2]) => rr === r && ss2 === s), tl = T.LIGHT0 + k * (1.45 / 72); return ss(seg(t, tl, tl + .12)); };
  cabinScene(g, t, Q, {
    type: ['ft7'], timer: { s: fmt(414 * (1 - ru)) }, glow: lit,
    people: () => { for (const p of PAX) { const tr = T.REW0 + (1 - FILL.rank.get(p.i) / 72) * .5, v = 1 - ss(seg(t, tr, tr + .1)); if (v > 0) seated(p, SEATX[p.seat], rowY(p.row), v, v); } },
  });
}
function shot8(g, t, Q) { exterior(g, t, Q, { type: [] }); }
function shot9(g, t, Q) {
  const people = [], arrows = [], open = new Map();
  WAVES.forEach((w, k) => {
    const X = WT[k];
    w.forEach(([r, s]) => {
      const p = paxBySeat(r, s), side = 'ABC'.includes(s) ? -1 : 1, key = r * 2 + (side > 0 ? 1 : 0);
      if (t >= X.w3) { people.push(() => seated(p, SEATX[s], rowY(r))); return; }
      if (X.fast) { // time-lapse: the arrow branches into the six rows and the six passengers settle into their seats
        if (t < X.w0 - .12) return;
        const a = ss(seg(t, X.w1, X.w3)); if (a > 0) people.push(() => seated(p, SEATX[s], rowY(r), 1, a));
        arrows.push({ r, side, s, grow: ss(seg(t, X.w0 - .12, X.w1)), branch: ss(seg(t, X.w0, X.w1 + .06)), fade: 1 - ss(seg(t, X.w2, X.w3 + .15)) });
        return;
      }
      // wave 1 walks in for real (≈ 2.2 m/s at most), stops at every other row at once, stows, sits
      const D = rowY(12) - rowY(8.5), e = ss(seg(t, X.w0, X.w1)), y = rowY(r) - D * (1 - e);
      if (t < X.w2) {
        const u = seg(t, X.w1, X.w2), st = t >= X.w1 ? stowState(p, r, s, u) : { lift: 0, caseUp: true };
        const pos = y >= DOORY ? { x: 0, y, z: PL.FLOOR } : qAt(sRow(r) - D * (1 - e));
        people.push(() => standing(p, pos, { walking: t < X.w1, phase: (y + 20) / STRIDE * Math.PI, bag: t < X.w1 ? 1 : 0, lift: st.lift, caseUp: st.caseUp }));
        if (t >= X.w1) open.set(key, ss(seg(u, .15, .3)) * (1 - ss(seg(u, .88, 1))));
      } else { const u = seg(t, X.w2, X.w3); people.push(() => seatIn(p, r, s, u)); }
      arrows.push({ r, side, s, grow: ss(seg(t, X.w0 - .15, X.w1)), branch: ss(seg(t, X.w1 - .1, X.w1 + .25)), fade: 1 - ss(seg(t, X.w2, X.w3 + .1)) });
    });
  });
  cabinScene(g, t, Q, {
    type: ['ft9'], timer: { s: fmt(216 * seg(t, T.WV0 + .3, WV_END)), hot: t >= WV_END }, binOpen: (r, side) => open.get(r * 2 + (side > 0 ? 1 : 0)) || 0,
    floorDecal: g2 => weaveArrows(g2, arrows), people: () => people.forEach(f => f()), lid: lidOpen(t, T.WV0 - .05, T.WV0 + 1.0),
  });
}
function weaveArrows(g, arrows) {
  const z = PL.FLOOR + .004;
  let far = -1, a = 0; for (const A of arrows) if (A.fade > 0 && A.grow > 0) { far = Math.max(far, lerp(DOORY + .4, rowY(A.r), A.grow)); a = Math.max(a, A.fade); }
  if (far < 0) return;
  g.save(); g.globalAlpha = a * .92; const hw = .09;
  fillPoly(g, quad(rect(-hw, hw, DOORY + .4, far), z), C.accent);
  for (const A of arrows) {
    if (A.branch <= 0 || A.fade <= 0) continue;
    g.globalAlpha = A.fade * .92;
    const y = rowY(A.r) - .02, x1 = A.side * lerp(.05, Math.abs(SEATX[A.s]) - .1, A.branch), hl = .18 * A.side;
    fillPoly(g, quad([[0, y - hw], [x1 - hl, y - hw], [x1 - hl, y - .2], [x1, y], [x1 - hl, y + .2], [x1 - hl, y + hw], [0, y + hw]], z), C.accent);
  }
  g.restore();
}
function shot10(g, t, Q) {
  cabinScene(g, t, Q, { type: ['ft10'], timer: { s: '3:36', hot: true }, people: () => PAX.forEach(p => seated(p, SEATX[p.seat], rowY(p.row))) });
}
// 11: two bars painted on the concrete, lengths in proportion to 414 s and 216 s; the missing stretch of the short bar is marked
const BAR = { y0: -14.4, k: 13.8 / 414, x1: -6.9, x2: -3.9, w: .8 };
function bars(g, t) {
  const L1 = 414 * BAR.k, L2 = 216 * BAR.k, g1 = eo(seg(t, T.BARS0, T.BARS0 + .55)), g2 = eo(seg(t, T.BARS0 + .35, T.BARS0 + .9));
  const strip = (x, L, col, a = 1) => fillPoly(g, quad(rect(x - BAR.w, x, BAR.y0 - L, BAR.y0), .002), col, a);
  if (g1 > 0) strip(BAR.x1, L1 * g1, C.ink, .9);
  if (g2 > 0) strip(BAR.x2, L2 * g2, C.accent);
  miniCabin(g, BAR.x1 - 1.95, BAR.y0 + 3.9, true, ss(seg(t, T.BARS0 - .1, T.BARS0 + .3)));
  miniCabin(g, BAR.x2 - 1.95, BAR.y0 + 3.9, false, ss(seg(t, T.BARS0 + .2, T.BARS0 + .6)));
  const p = eo(seg(t, T.BRACKET, T.BRACKET + .6)); if (p <= 0) return;
  // the time saved: a dashed persimmon bracket alongside the short bar, from its end to where the long bar ends
  const ya = BAR.y0 - L2, yb = ya - (L1 - L2) * p, x = BAR.x2 + .95;
  g.save(); g.strokeStyle = C.accent; g.lineWidth = 3.5; g.lineCap = 'round';
  g.setLineDash([10, 8]); g.beginPath(); g.moveTo(...iso.P(x, ya, .003)); g.lineTo(...iso.P(x, yb, .003)); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(...iso.P(x - .35, ya, .003)); g.lineTo(...iso.P(x + .35, ya, .003));
  if (p > .98) { g.moveTo(...iso.P(x - .35, yb, .003)); g.lineTo(...iso.P(x + .35, yb, .003)); }
  g.stroke(); g.restore();
}
function miniCabin(g, x, y, queued, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  onPlane(g, x, y, .002, 'xy', g2 => {
    g2.strokeStyle = C.ink; g2.lineWidth = .1; g2.beginPath(); g2.roundRect(0, 0, 3.4, 1.8, .8); g2.stroke();
    g2.fillStyle = C.ink;
    for (let i = 0; i < 6; i++) for (const v of [.28, .5, 1.3, 1.52]) g2.fillRect(.55 + i * .4, v - .08, .24, .15);
    if (queued) for (let i = 0; i < 6; i++) { g2.beginPath(); g2.arc(.67 + i * .4, .9, .13, 0, TAU); g2.fill(); }
  });
  g.restore();
}
function shot11(g, t, Q) { exterior(g, t, Q, { type: ['b1', 'b2'], marks: g2 => bars(g2, t), glassH: 1.1 }); }
// 12: the test itself — 72 passengers standing on the concrete in the cabin's own layout, 12 rows of 3 + 3
const FORM = { x0: -14.6, y0: -12.2, dx: .62, dy: .95, gap: .7 };
function formation(t) {
  const u0 = T.FORM0;
  for (let r = 1; r <= 12; r++) for (const s of 'ABCDEF') {
    const c = 'ABCDEF'.indexOf(s), x = FORM.x0 + c * FORM.dx + (c >= 3 ? FORM.gap : 0), y = FORM.y0 - (12 - r) * FORM.dy;
    const ta = u0 + (12 - r) * .06 + c * .015, a = ss(seg(t, ta, ta + .25));
    if (a > 0) standing(paxBySeat(r, s), { x, y, z: 0 }, { bag: 0 }, a);
  }
}
function shot12(g, t, Q) { // the bars fade as the camera pans to the formation
  const fade = 1 - ss(seg(t, sh(12)[0], sh(12)[0] + .7));
  exterior(g, t, Q, { type: ['ft12'], crowd: () => formation(t), glassH: 1.1, marks: g2 => { if (fade > 0) { g2.save(); g2.globalAlpha = fade; bars(g2, t); for (const k of ['b1', 'b2']) floorType(g2, t, PH[k], LAY[k], fade); g2.restore(); } } });
}
function shot13(g, t, Q) { // back in the aisle: the jammed stretch lit in persimmon
  const ts = simT(t), a = ss(seg(t, T.BAND, T.BAND + .5));
  cabinScene(g, t, Q, {
    type: ['ft13'], timer: { s: '4:12' }, binOpen: binOpenSim(ts),
    floorDecal: aisleBand(DOORY + .4, rowY(9) + .3, .8 * a), people: () => queuePeople(ts, 'cabin'), bridgePeople: () => queuePeople(ts, 'bridge'),
  });
}
function shot14(g, t, Q) { exterior(g, t, Q, { type: ['end', 'endcr'], glassH: 1.1 }); }
const SHOTS = [shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot8, shot9, shot10, shot11, shot12, shot13, shot14];

// ======================================================================
export function render(g, t, Q) {
  g.setTransform(1, 0, 0, 1, 0, 0); CASES = [];
  let i = S.findIndex(([a, b]) => t >= a && t < b); if (i < 0) i = S.length - 1;
  SHOTS[i](g, t, Q);
  if (!Q.has('nosub')) subtitles(g, t, CUES);
}

// ---------- readcheck: the world text meant to be read (the subtitle cues follow the narration and go to the .srt) ----------
function planeBox(x, y, z, plane, u0, u1, v0, v1) {
  const P = (u, v) => plane === 'yz' ? iso.P(x, y - u, z - v) : iso.P(x + v, y - u, z);
  const pts = [P(u0, v0), P(u1, v0), P(u0, v1), P(u1, v1)];
  return { x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) };
}
const KEYS = [['title'], ['title', 'ft1'], ['ft2'], ['ft3'], ['ft5'], ['ft4'], ['ft4', 'ft7'], ['ft8'], ['ft9'], ['ft10'], ['b1', 'b2'], ['ft12'], ['ft13'], ['end', 'endcr']];
export function texts(t) {
  const out = []; iso.cam = camAt(t);
  let i = S.findIndex(([a, b]) => t >= a && t < b); if (i < 0) i = S.length - 1;
  for (const k of KEYS[i]) {
    const P = PH[k], L = LAY[k]; if (t < L[0].tc || t >= P.t1) continue;
    for (const li of [...new Set(L.map(c => c.li))]) out.push({ id: `${k}.${li}`, text: L.filter(c => c.li === li).map(c => c.ch).join(''), pass: !!P.pass, ...phraseBox(P, L, li) });
  }
  if (i === 1 && t >= T.MOVE1) {
    const D = DOOR_SIGN; out.push({ id: 'doorSign', text: 'B12 登机口 GATE', ...planeBox(D.x, D.y, D.z, 'yz', 0, D.w, -D.h, 0) });
    if (t >= T.SIGN) { const s = SIGN(0); out.push({ id: 'sign0', text: '9–12 排 ROWS 9–12', ...planeBox(s.x + .035, s.y + .64, GZ + 1.75, 'yz', 0, 1.3, 0, .62) }); }
  }
  if (i === 7) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let k = 0; k < 6; k++) { const q = sqPos(k), b = planeBox(q.x + .62, q.y + .2, GZ, 'xy', 0, .75, -.34, 0); x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); }
    out.push({ id: 'squares', text: ORDER2.slice(0, 6).map(([r, s]) => `${r}${s}`).join(' '), x0, y0, x1, y1 });
  }
  return out;
}
export const CUE_LIST = CUES;
export const subtitleBoxes = g => CUES.map(c => subtitleBox(g, c));

// ---------- sound cues (events.json) ----------
export function events() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  E(0, 'timeline', { T: { ...T, WV_END, DUR }, S, VO, VO_DUR });
  E(0, 'taxi'); E(2.8, 'brake'); E(2.7, 'bridge_move'); E(3.4, 'dock');
  E(T.MOVE0, 'swish'); E(T.CHIME, 'chime'); E(T.SIGN, 'sign');
  for (const o of RUN1) if (o.ts < sh(3)[0]) E(o.ts, 'stand', { q: o.q });
  E(T.LID0, 'lid_open'); E(T.LID0 + 1.2, 'lid_rest'); E(T.SETTLE - .1, 'aisle_light');
  E(sh(4)[0] + .5, 'stop_mark'); E(sh(4)[0] + 1.0, 'bin_slap');
  E(T.FAST0, 'fast'); E(T.FAST1, 'stop', { tm: '6:54' });
  E(T.REW0, 'rewind'); E(T.LIGHT0, 'lights');
  E(sh(8)[0], 'chime'); E(T.WV0 - .05, 'lid_open');
  WT.forEach((X, k) => { E(X.w1, 'wave', { k, fast: X.fast }); E(X.w2, 'bins_shut', { k }); E(X.w3, 'seated', { k }); });
  E(WV_END, 'stop', { tm: '3:36' });
  E(sh(11)[0], 'pull'); E(T.BARS0, 'bar'); E(T.BARS0 + .35, 'bar'); E(T.BRACKET, 'bracket');
  E(sh(12)[0], 'swish'); E(T.FORM0, 'crowd'); E(sh(13)[0], 'cut_in'); E(T.BAND, 'band');
  for (const k of Object.keys(PH)) LAY[k].forEach((c, i) => E(c.tc, 'char', { p: k, i, big: c.size >= 1.4, acc: c.col === C.accent }));
  CUES.forEach((c, i) => E(VO[i], 'vo', { id: `V${String(i + 1).padStart(2, '0')}`, dur: VO_DUR[i] }));
  return ev.sort((a, b) => a.t - b.t);
}
export const TIMES = T, SHOT_LIST = S;
