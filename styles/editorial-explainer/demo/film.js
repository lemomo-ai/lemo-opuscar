// "Twenty-Three": the birthday problem, argued on one paper desk. Six clusters of paper lie on the same desk in a 3 × 2
// arrangement; the camera travels from one to the next and finally pulls out to all of them.
// Times come from lines.json (line starts, on the 100 bpm grid) and voices/dur.json; nothing else sets a time.
import { clamp, lerp, seg, eo, eio, ss, hash, TAU } from '/core/lib.js';
import { makeDesk, INK, PAPER, HI, COOL, GRAPH, GRAPHITE, q12, wob, ring, curve } from './desk.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const N = 23, PAIRS = []; for (let j = 1; j < N; j++) PAIRS.push([0, j]); for (let i = 1; i < N; i++) for (let j = i + 1; j < N; j++) PAIRS.push([i, j]);   // 253
const probInt = n => { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; };
const prob = n => { const a = Math.floor(n); return probInt(a) + (probInt(a + 1) - probInt(a)) * (n - a); };                                                        // P(a shared birthday among n)
const MATCH = [4, 15];                                                 // the pair that turns out to share a day
const CREDIT = 'ivishalanand × LemoLab × Claude Fable 5.2';

export function makeFilm(g, W, H, lines, dur) {
  const D = makeDesk(g, W, H), L = {}, U = {};
  lines.forEach(l => { L[l.id] = l.t; U[l.id] = dur[l.id]; });
  const at = (id, u) => L[id] + U[id] * u;

  const T = {
    cal: .1, hl: .1, ppl: L.l1 + .5, serif: L.l1 + 1.75, hiA: L.l1 + 2.3,
    whipB: L.l2 - .45, n183: L.l2 + .1, mini: L.l2 + .35, hatch: L.l2 + .9, half: at('l2', .62),
    strike: L.l3 - .75, whipC: L.l3 - .25, real: L.l3 + .1, n23: L.l3 + 1.2, hi23: L.l3 + 1.45, row: L.l3 + 1.9,
    whipD: L.l4 - .5, circle: L.l4 - .2, sDates: at('l4', .30), xDates: at('l4', .52), sPeople: at('l4', .66), hiPeople: at('l4', .86), fan1: at('l4', .62),
    counter: L.l5 - .35, fanAll: L.l5 + .2, land: L.l5 + 3.0, hi253: L.l5 + 3.1, pushD: L.l5 - .1, match: L.l6 + 1.5,
    whipE: L.l7 - .5, curve1: L.l7, fifty: L.l7 + 1.8, pushE: L.l8 - .3, curve2: L.l8 + .1, nn: L.l8 + 1.8,
    pull: L.l9 - .7, echo: L.l9 + .9, fin: L.l9 + 3.0, hiFin: L.l9 + 3.35, credit: L.l9 + 5.2,
  };
  const DUR = T.fin + 5.4;

  // ---- camera: shots [t0, blend-in seconds, pose at t0, pose at the next shot's t0]; pose = [cx, cy, scale, rotation] ----
  const SHOTS = [
    [0, 0, [955, 556, 1.02, .004], [1000, 540, 1.10, -.003]],
    [T.whipB, .5, [2960, 545, 1.0, -.004], [3015, 530, 1.07, .002]],
    [T.whipC, .45, [5000, 520, 1.0, .003], [5000, 545, 1.13, -.002]],
    [T.whipD, .6, [985, 1700, .98, -.003], [1005, 1700, 1.03, .001]],
    [T.pushD, .9, [1010, 1700, 1.03, .001], [1035, 1704, 1.08, .004]],
    [T.whipE, .5, [2950, 1690, 1.0, .003], [2990, 1684, 1.05, -.001]],
    [T.pushE, .8, [3150, 1650, 1.11, -.001], [3180, 1640, 1.15, -.004]],
    [T.pull, 2.0, [2980, 1120, .305, 0], [2980, 1120, .322, .006]],
  ];
  function pose(i, t) { const a = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR, u = (t - a[0]) / (t1 - a[0]); return a[2].map((v, k) => v + (a[3][k] - v) * u); }
  function camAt(t) {
    let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    const p = pose(i, t); if (!i || t >= SHOTS[i][0] + SHOTS[i][1]) return p;
    const q = pose(i - 1, t), u = eio((t - SHOTS[i][0]) / SHOTS[i][1]);
    return [lerp(q[0], p[0], u), lerp(q[1], p[1], u), Math.exp(lerp(Math.log(q[2]), Math.log(p[2]), u)), lerp(q[3], p[3], u)];
  }

  // ---- subtitles: a strip of label paper lying on free desk; the keyword is highlighted as it is spoken ----
  const SUBPOS = { l1: [600, 992], l2: [960, 1002], l3: [960, 1016], l4: [520, 996], l5: [520, 996], l6: [520, 996], l7: [960, 1012], l8: [960, 1016], l9: [960, 1000] };
  const CUES = [];
  lines.forEach((l, li) => {
    const tot = l.subs.reduce((s, x) => s + x[0].length, 0); let acc = 0;
    l.subs.forEach(([txt, key], k) => {
      const t0 = L[l.id] + U[l.id] * acc / tot, part = U[l.id] * txt.length / tot; acc += txt.length;
      const next = li + 1 < lines.length ? lines[li + 1].t - .03 : DUR, last = k === l.subs.length - 1, end = L[l.id] + U[l.id];
      CUES.push({ id: l.id + '_' + k, t0, t1: last ? Math.min(next, Math.max(end + .62, t0 + 1.9)) : t0 + part, text: txt, key, tk: t0 + part * Math.max(0, txt.indexOf(key) / txt.length), pos: SUBPOS[l.id] });
    });
  });
  function subtitle(t) {
    const c = CUES.find(c => t >= c.t0 && t < c.t1); if (!c) return;
    const o = { f: 'serif', size: 38, w: 600 }, w = D.width(c.text, o), f = Math.floor((q12(t) - c.t0) * 12 + 1e-6), up = [10, 3, 0][Math.min(Math.max(f, 0), 2)];
    D.screen(); g.save(); g.translate(c.pos[0], c.pos[1] + up); g.rotate((hash(c.t0) - .5) * .014);
    g.shadowColor = 'rgba(46,34,14,.34)'; g.shadowBlur = 14; g.shadowOffsetX = 5; g.shadowOffsetY = 8; g.fillStyle = PAPER; g.fillRect(-w / 2 - 30, -34, w + 60, 68); D.noShadow();
    const i = c.text.indexOf(c.key); if (i >= 0) D.highlight(-w / 2 + D.width(c.text.slice(0, i), o) - 4, -22, D.width(c.key, o) + 8, 44, seg(t, c.tk, c.tk + .28), 3 + c.t0);
    D.text(c.text, -w / 2, 13, o); g.restore();
  }

  // ---- A: the question (centre 960, 540) ----
  const calCell = (m, d) => [92 + d * 27, 78 + m * 45];
  function clusterA(t) {
    D.piece({ x: 40, y: 130, w: 1110, h: 800, rot: .012, z: 2, fill: '#D9CDB4', torn: [5, 5, 5, 5], seed: 11 });
    D.piece(D.enter({ x: 90, y: 200, w: 960, h: 640, rot: -.014, z: 10, fill: GRAPH, seed: 3 }, t, T.cal - .5, { dx: -500, rot: -.05 }), () => {
      D.text('365 DAYS', 40, 50, { f: 'mono', size: 22, ls: 3, id: 'a365', pass: true });
      const shown = Math.floor(365 * seg(q12(t), T.cal + .2, T.cal + 1.3)); let k = 0;
      for (let m = 0; m < 12; m++) {
        D.text(MONTHS[m], 36, 78 + m * 45 + 24, { f: 'mono', size: 15, color: '#5E6E7A' });
        for (let d = 0; d < MLEN[m]; d++, k++) { if (k >= shown) continue; const [x, y] = calCell(m, d); g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 22, 32); g.strokeStyle = 'rgba(124,147,166,.7)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, 21, 31); }
      }
      const [ex, ey] = calCell(7, 16);                                  // the echo: one day, two people
      D.highlight(ex - 3, ey - 2, 28, 36, seg(t, T.echo, T.echo + .3), 9);
      D.pencil(ring(ex + 11, ey + 16, 46, 40, 4), seg(t, T.echo + .25, T.echo + .7), { w: 5 });
    });
    D.piece(D.enter({ x: 1130, y: 150, w: 700, h: 420, rot: .02, z: 22, torn: [0, 6, 8, 0], seed: 5 }, t, T.hl - .5, { dx: 900, rot: .06 }), () => {
      const a = { f: 'head', size: 168, w: 800, st: 'extra-condensed' }, b = { f: 'head', size: 226, w: 900, st: 'extra-condensed' };
      a.size *= Math.min(1, 600 / D.width('HOW MANY', a)); b.size *= Math.min(1, 600 / D.width('PEOPLE', b));
      D.text('HOW MANY', 46, 178, { ...a, id: 'aHow' });
      D.text('PEOPLE', 46, 372, { ...b, id: 'aPeople' });
    });
    D.piece(D.enter({ x: 1170, y: 610, w: 640, h: 168, rot: -.024, z: 26, torn: [0, 0, 0, 5], seed: 6 }, t, T.serif, { dy: 500, rot: -.06 }), () => {
      const o = { f: 'serif', size: 48, w: 500, it: true };
      D.text('before two of them', 40, 70, { ...o, id: 'aBefore' });
      D.highlight(36, 92, D.width('share a birthday?', o) + 8, 50, seg(t, T.hiA, T.hiA + .4), 12);
      D.text('share a birthday?', 40, 130, { ...o, id: 'aShare' });
    });
    D.tape(1500, 612, 120, .05, 26);
    for (let i = 0; i < 6; i++) D.bust(i * 4 + 1, 1200 + i * 116, 962, 158, { z: 34, sc: D.pop(t, T.ppl + i * 2 / 12), rot: (hash(i * 5.1) - .5) * .14 });
  }

  // ---- B: the guess (centre 2980, 540) ----
  function clusterB(t) {
    D.piece({ x: 2110, y: 80, w: 1560, h: 830, rot: -.01, z: 2, fill: '#C9D3D8', torn: [6, 6, 6, 6], seed: 21 });
    D.piece(D.enter({ x: 2190, y: 140, w: 990, h: 480, rot: -.03, z: 20, torn: [8, 0, 8, 0], seed: 22 }, t, T.n183, { dy: -700, rot: .05 }), () => {
      D.text('IT FEELS LIKE', 64, 70, { f: 'mono', size: 24, ls: 4, id: 'bFeels' });
      D.text('183', 50, 430, { f: 'head', size: 430, w: 900, st: 'condensed', ls: -6, id: 'b183' });
      D.pencil(wob(40, 330, 950, 150, 5, 16), seg(t, T.strike, T.strike + .2), { w: 11 });           // crossed out before the answer
      D.pencil(wob(950, 240, 60, 400, 6, 16), seg(t, T.strike + .2, T.strike + .42), { w: 11 });
    });
    D.piece(D.enter({ x: 3250, y: 320, w: 560, h: 392, rot: .035, z: 16, fill: GRAPH, seed: 23 }, t, T.mini, { dx: 800, rot: .08 }), () => {
      D.text('183 OF 365', 30, 44, { f: 'mono', size: 20, ls: 2, id: 'bOf' });
      const hat = Math.floor(183 * seg(q12(t), T.hatch, T.hatch + 1.3)); let k = 0;
      for (let m = 0; m < 12; m++) for (let d = 0; d < MLEN[m]; d++, k++) {
        const x = 30 + d * 16, y = 64 + m * 26; g.fillStyle = k < hat ? COOL : '#FFFFFF'; g.fillRect(x, y, 13, 21);
        g.strokeStyle = 'rgba(124,147,166,.7)'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, 12, 20);
      }
    });
    const hp = seg(t, T.half, T.half + .5);
    if (hp > 0) {
      g.save(); D.world(8); g.translate(2330, 790); g.rotate(-.05); g.beginPath(); g.rect(-10, -80, 640 * hp, 120); g.clip();
      D.text('half the calendar?', 0, 0, { f: 'hand', size: 78, w: 600, color: '#2A2A2E', id: 'bHalf' }); g.restore();
      D.world(8); D.pencil(curve(2850, 770, 3060, 830, 3236, 690, 30), seg(t, T.half + .35, T.half + .8), { w: 4.5 });
    }
  }

  // ---- C: the answer (centre 5000, 540) ----
  function clusterC(t) {
    D.piece({ x: 4190, y: 50, w: 1620, h: 880, rot: .008, z: 2, fill: '#EFE9DC', torn: [5, 5, 5, 5], seed: 31 });
    const f = Math.floor((q12(t) - T.n23) * 12 + 1e-6), sc = f < 0 ? 0 : [1.2, 1.05, 1][Math.min(f, 2)];
    D.piece(D.enter({ x: 4420, y: 96, w: 1160, h: 620, rot: -.012, z: 18, torn: [0, 0, 9, 0], seed: 32 }, t, T.whipC - .3, { dy: -60 }), () => {
      if (t >= T.real) D.text('THE REAL ANSWER', 70, 82, { f: 'mono', size: 26, ls: 5, id: 'cReal' });
      if (sc > 0) {
        g.save(); g.translate(580, 330); g.scale(sc, sc);
        D.highlight(-420, -30, 840, 230, seg(t, T.hi23, T.hi23 + .45), 7);
        D.text('23', 0, 210, { f: 'head', size: 500, w: 900, align: 'center', ls: -8, id: 'c23' }); g.restore();
      }
    });
    D.tape(5000, 98, 150, -.03, 18);
    for (let i = 0; i < N; i++) D.bust(i, 4186 + i * 74, 900, 112, { z: 30, sc: D.pop(t, T.row + i / 12), rot: (hash(i * 9.7) - .5) * .12 });
  }

  // ---- D: the trick (centre 960, 1700) ----
  const CX = 1300, CY = 1690, RR = 330;
  const seat = i => { const a = -Math.PI / 2 + i * TAU / N; return [CX + Math.cos(a) * RR, CY + Math.sin(a) * RR]; };
  function pairCount(t) {
    const a = clamp(Math.floor((q12(t) - T.fan1) * 12 + 1e-6), 0, 22), u = seg(q12(t), T.fanAll, T.land);
    return t < T.fanAll ? a : Math.min(253, 22 + Math.round(231 * u * u));          // slow, then all at once
  }
  function clusterD(t) {
    D.piece({ x: 60, y: 1230, w: 1800, h: 940, rot: -.006, z: 2, fill: '#DCCFB6', torn: [5, 5, 5, 5], seed: 41 });
    D.piece({ x: 860, y: 1250, w: 880, h: 880, rot: .01, z: 8, seed: 45, torn: [0, 4, 0, 4] });
    const n = pairCount(t); D.world(10);
    for (let k = 0; k < n; k++) {
      const [i, j] = PAIRS[k], a = seat(i), b = seat(j);
      g.strokeStyle = k < 22 ? 'rgba(30,30,34,.62)' : 'rgba(30,30,34,.30)'; g.lineWidth = k < 22 ? 2.2 : 1.5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    const mp = seg(t, T.match, T.match + .35);
    if (mp > 0) { const a = seat(MATCH[0]), b = seat(MATCH[1]); D.pencil([a, [lerp(a[0], b[0], .5) + 4, lerp(a[1], b[1], .5) - 5], b], mp, { w: 15, color: HI, multiply: true }); D.pencil([a, b], mp, { w: 3 }); }
    for (let i = 0; i < N; i++) { const [x, y] = seat(i); D.bust(i, x, y + 46, 92, { z: 12, sc: D.pop(t, T.circle + (i * 7 % N) / 24), rot: (hash(i * 2.3) - .5) * .1 }); }
    if (mp > 0) {
      D.world(14); MATCH.forEach((m, k) => { const [x, y] = seat(m); D.pencil(ring(x, y - 4, 58, 62, 11 + k), seg(t, T.match + .2 + k * .2, T.match + .6 + k * .2), { w: 5 }); });
      const np = seg(t, T.match + .3, T.match + .6);
      if (np > 0) { g.save(); D.world(14); g.translate(1470, 2110); g.rotate(-.06); g.beginPath(); g.rect(-10, -70, 420 * np, 100); g.clip(); D.text('same day!', 0, 0, { f: 'hand', size: 76, w: 700, color: '#2A2A2E', id: 'dSame' }); g.restore(); }
    }
    D.piece(D.enter({ x: 200, y: 1620, w: 540, h: 112, rot: .018, z: 18, torn: [0, 5, 0, 0], seed: 43 }, t, T.sDates, { dx: -700, rot: -.05 }), () => {
      D.text('people × dates', 36, 74, { f: 'serif', size: 50, w: 500, id: 'dDates' });
      D.pencil(wob(24, 62, 470, 54, 8, 5), seg(t, T.xDates, T.xDates + .22), { w: 7 });
    });
    D.piece(D.enter({ x: 230, y: 1772, w: 590, h: 124, rot: -.014, z: 20, torn: [0, 0, 0, 5], seed: 44 }, t, T.sPeople, { dx: -700, rot: .05 }), () => {
      const o = { f: 'serif', size: 54, w: 700 };
      D.highlight(30, 34, D.width('people × people', o) + 12, 58, seg(t, T.hiPeople, T.hiPeople + .4), 14);
      D.text('people × people', 36, 80, { ...o, id: 'dPeople' });
    });
    D.piece(D.enter({ x: 180, y: 1290, w: 600, h: 262, rot: -.02, z: 22, torn: [0, 0, 7, 0], seed: 42 }, t, T.counter, { dx: -800, rot: -.06 }), () => {
      D.text('PAIRS', 42, 62, { f: 'mono', size: 26, ls: 5, id: 'dPairs' });
      const o = { f: 'head', size: 190, w: 800, st: 'condensed', ls: -3 };
      D.highlight(34, 100, D.width('253', o) + 16, 132, seg(t, T.hi253, T.hi253 + .4), 15);
      D.text(String(n), 42, 226, { ...o, id: 'dN', pass: n < 253 });
    });
  }

  // ---- E: the curve (centre 2980, 1700) ----
  const GX = n => 130 + n / 75 * 1130, GY = p => 640 - p * 520;
  function clusterE(t) {
    D.piece({ x: 2100, y: 1240, w: 1760, h: 920, rot: .007, z: 2, fill: '#CCD6DA', torn: [6, 6, 6, 6], seed: 51 });
    const n = t < T.curve2 ? lerp(1, 23, ss(seg(t, T.curve1, T.fifty))) : t < T.nn + .1 ? lerp(23, 57, ss(seg(t, T.curve2, T.nn))) : lerp(57, 75, eo(seg(t, T.nn + .1, T.nn + 1.4)));
    const card = { x: 2240, y: 1290, w: 1340, h: 760, rot: -.008, z: 14, fill: GRAPH, grid: 26, seed: 52 };
    D.piece(card, () => {
      D.text('CHANCE THAT TWO SHARE A BIRTHDAY', 70, 70, { f: 'mono', size: 24, ls: 3, id: 'eTitle' });
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(GX(0), GY(1.04)); g.lineTo(GX(0), GY(0)); g.lineTo(GX(76), GY(0)); g.stroke();
      for (let k = 10; k <= 70; k += 10) { g.beginPath(); g.moveTo(GX(k), GY(0)); g.lineTo(GX(k), GY(0) + 10); g.stroke(); D.text(String(k), GX(k), GY(0) + 38, { f: 'mono', size: 20, align: 'center' }); }
      D.text('PEOPLE IN THE ROOM', GX(75), GY(0) + 76, { f: 'mono', size: 18, ls: 2, align: 'right', color: '#5E6E7A' });
      [[0, '0'], [.5, '50%'], [1, '100%']].forEach(([p, s]) => D.text(s, GX(0) - 14, GY(p) + 7, { f: 'mono', size: 20, align: 'right' }));
      g.save(); g.setLineDash([12, 9]); g.strokeStyle = COOL; g.lineWidth = 3; g.beginPath(); g.moveTo(GX(0), GY(.5)); g.lineTo(GX(75), GY(.5)); g.stroke(); g.restore();
      if (t >= T.curve1) { const pts = []; for (let k = 1; k <= n + 1e-6; k += .5) pts.push([GX(k), GY(prob(k))]); pts.push([GX(n), GY(prob(n))]); D.pencil(pts, 1, { w: 6.5, color: 'rgba(22,22,22,.94)' }); }
      [[23, T.fifty, 16], [57, T.nn, 17]].forEach(([k, tk, sd]) => {
        if (t < tk) return; const x = GX(k), y = GY(prob(k));
        D.pencil(wob(x, y, x, GY(0), sd, 2), seg(t, tk, tk + .25), { w: 3, a: .8 });
        g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = HI; g.beginPath(); g.arc(x, y, 30 * eo(seg(t, tk, tk + .18)), 0, TAU); g.fill(); g.restore();
        g.fillStyle = INK; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill();
      });
    });
    [[T.fifty + .1, { x: 2800, y: 1700, w: 400, h: 196, rot: .02, z: 26, torn: [0, 5, 0, 0], seed: 53 }, '23 PEOPLE', '50.7%', 'e23', 600],
     [T.nn + .1, { x: 3290, y: 1478, w: 370, h: 196, rot: -.022, z: 26, torn: [0, 0, 5, 0], seed: 54 }, '57 PEOPLE', '99%', 'e57', -600]].forEach(([t0, o, a, b, id, dy]) => {
      D.piece(D.enter(o, t, t0, { dy, rot: .06 }), () => {
        D.text(a, 34, 52, { f: 'mono', size: 22, ls: 3, id: id + 'a' });
        const s = { f: 'head', size: 124, w: 800, st: 'condensed', ls: -2 };
        D.highlight(28, 78, D.width(b, s) + 12, 88, seg(t, t0 + .4, t0 + .75), 18 + o.seed);
        D.text(b, 34, 162, { ...s, id: id + 'b' });
      });
    });
  }

  // ---- F: the whole desk, and the line to take away (centre 2980, 1120) ----
  function clusterF(t) {
    const o = D.enter({ x: 1330, y: 700, w: 3300, h: 840, rot: -.012, z: 60, torn: [0, 14, 18, 0], seed: 61 }, t, T.fin - .34, { dy: -1900, rot: .03, dur: .34 });
    D.piece(o, () => {
      const s = { f: 'head', size: 560, w: 900, st: 'extra-condensed', ls: -4 }, a = 'COUNT THE ', b = 'PAIRS.';
      s.size *= Math.min(1, 2940 / D.width(a + b, s)); const wa = D.width(a, s), wb = D.width(b, s), x = (3300 - wa - wb) / 2;
      D.highlight(x + wa - 30, 600 - s.size * .62, wb + 70, s.size * .7, seg(t, T.hiFin, T.hiFin + .5), 19);
      D.text(a + b, x, 600, { ...s, id: 'fCount' });
    });
  }

  function render(t, opt = {}) {
    D.setCam(camAt(t)); D.ground();
    clusterA(t); if (t >= T.whipB - .1) clusterB(t); if (t >= T.whipC - .4) clusterC(t); if (t >= T.whipD - .1) clusterD(t); if (t >= T.whipE - .1) clusterE(t);
    clusterF(t); D.finish();
    if (t >= T.credit && !opt.poster) { D.screen(); g.globalAlpha = seg(t, T.credit, T.credit + .01); D.text(CREDIT, W / 2, H - 46, { f: 'mono', size: 21, ls: 2, align: 'center', color: '#3A3630', id: 'credit', pass: true }); g.globalAlpha = 1; }
    if (!opt.nosub) subtitle(t);
    D.screen();
  }

  // ---- sound and cue events, all from the same T ----
  function events() {
    const ev = [], e = (t, type, x = {}) => ev.push({ t: +t.toFixed(3), type, ...x });
    e(0, 'slap'); e(T.cal + .3, 'riffle', { d: 1.0 }); e(T.serif + .2, 'slide'); e(T.serif + .42, 'slap', { g: .7 }); e(T.hiA, 'marker', { d: .4 });
    for (let i = 0; i < 6; i++) e(T.ppl + i * 2 / 12, 'pop');
    [T.whipB, T.whipC, T.whipD, T.whipE].forEach((t, i) => e(t + .05, 'whoosh', { d: [.5, .45, .6, .5][i] }));
    e(T.n183 + .2, 'slide'); e(T.n183 + .42, 'slap'); e(T.mini + .42, 'slap', { g: .7 }); e(T.hatch, 'riffle', { d: 1.3 }); e(T.half, 'pencil', { d: .5 }); e(T.half + .35, 'pencil', { d: .45 });
    e(T.strike, 'scribble', { d: .2 }); e(T.strike + .2, 'scribble', { d: .22 });
    e(T.n23, 'thump'); e(T.hi23, 'marker', { d: .45 }); for (let i = 0; i < N; i += 2) e(T.row + i / 12, 'pop', { g: .6 });
    for (let i = 0; i < N; i += 3) e(T.circle + i / 24, 'pop', { g: .5 });
    e(T.sDates + .2, 'slide'); e(T.sDates + .42, 'slap', { g: .7 }); e(T.xDates, 'scribble', { d: .22 }); e(T.sPeople + .2, 'slide'); e(T.sPeople + .42, 'slap', { g: .7 }); e(T.hiPeople, 'marker', { d: .4 });
    for (let i = 0; i < 22; i++) e(T.fan1 + i / 12, 'tick', { g: .7 });
    e(T.counter + .2, 'slide'); e(T.counter + .42, 'slap'); for (let t = T.fanAll; t < T.land - .01; t += 1 / 12) e(t, 'tick', { g: .5 + .5 * seg(t, T.fanAll, T.land) });
    e(T.land, 'thump', { g: .8 }); e(T.hi253, 'marker', { d: .4 }); e(T.match, 'marker', { d: .35 }); e(T.match + .2, 'pencil', { d: .4 }); e(T.match + .4, 'pencil', { d: .4 }); e(T.match + .6, 'pencil', { d: .4 });
    e(T.curve1, 'pencil', { d: T.fifty - T.curve1 }); e(T.fifty, 'dot'); e(T.fifty + .3, 'slide'); e(T.fifty + .52, 'slap', { g: .7 }); e(T.fifty + .5, 'marker', { d: .35 });
    e(T.curve2, 'pencil', { d: T.nn - T.curve2 }); e(T.nn, 'dot'); e(T.nn + .3, 'slide'); e(T.nn + .52, 'slap', { g: .7 }); e(T.nn + .5, 'marker', { d: .35 });
    e(T.pull + .2, 'whoosh', { d: 1.8, g: .5 }); e(T.echo, 'marker', { d: .3, g: .6 }); e(T.fin - .3, 'whoosh', { d: .3 }); e(T.fin, 'slapBig'); e(T.hiFin, 'marker', { d: .5 });
    Object.entries({ start: 0, guess: L.l2, silence1: T.strike, answer: T.n23, trick: L.l4, fan: T.fanAll, land: T.land, match: T.match, curve: L.l7, fifty: T.fifty, ninetynine: T.nn, silence2: T.nn + 1.5, last: L.l9, final: T.fin, end: DUR }).forEach(([name, t]) => e(t, 'cue', { name }));
    CUES.forEach(c => e(c.t0, 'sub', { t1: +c.t1.toFixed(3), text: c.text }));
    return ev.sort((a, b) => a.t - b.t);
  }

  return { DUR, T, render, events, texts: t => { render(t); return D.texts(); } };
}
