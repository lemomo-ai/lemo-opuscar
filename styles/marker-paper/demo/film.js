// 马克笔白纸速写 Marker on Paper · «How Far Can You See?» — the whole film on one timeline (52 s; DEMO.md has the shot list).
// window.render(t) takes seconds of the WHOLE film. ?t0=&t1= cut a stretch out of it (build.sh). ?nosubs=1 hides subtitles.
//
// Three sheets of paper. Each element = one pen action [t0, t1] holding strokes and/or laid-out letters, drawn in
// registration order. Each sheet is built three times (boil 0/1/2) with the same seeds; time is held on twos
// (12 drawings a second). The camera moves over the paper: strokes and letters are drawn THROUGH the camera
// (crisp at any zoom), the paper texture is drawn through it too, then the ink is laid on the paper.
// Transitions: a push through the right-angle mark into sheet ② (match cut), a peel from ② to ③.
import { clamp, lerp, mulberry, TAU } from '/core/lib.js';
import { W, H, Ink, Stroke, line, poly, curve, arc, circle, arrow, arrow2, dashed, makePaper, composeOn, paperCanvas, reseed, setBoil, setGlyphs } from './pen.js';

const Q = new URLSearchParams(location.search);
const FILM = 52.0;
const T0 = +(Q.get('t0') || 0), T1 = +(Q.get('t1') || FILM), SUBS = !Q.has('nosubs');
const cv = document.getElementById('c'), X = cv.getContext('2d');
const K = 'black', RD = 'red', BL = 'blue';
const ink = new Ink();
const eio = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eo = t => 1 - Math.pow(1 - clamp(t), 3), ei = t => Math.pow(clamp(t), 2.6);

// ───────── narration (whole-film start times; durations come from vo/dur.json) — DEMO.md has the script
const VO = [
  { id: 'v01', t: 0.30, en: 'Stand on a beach, and look out to sea.', zh: '站在海边，望向大海。' },
  { id: 'v02', t: 3.95, en: 'How far away is the horizon?', zh: '地平线离你有多远？' },
  { id: 'v03', t: 7.45, en: 'Blue is what we know. Red is what we want.', zh: '蓝色是已知的，红色是要求的。' },
  { id: 'v05', t: 13.20, en: 'Your line of sight just grazes the Earth, at a right angle.', zh: '视线刚好擦过地球，和半径成直角。' },
  { id: 'v07', t: 19.70, en: 'h² is tiny, so we drop it.', zh: 'h² 小到可以忽略，划掉它。' },
  { id: 'v08', t: 23.40, en: 'From 1.6 m up: about 4.5 km.', zh: '眼高 1.6 米：大约 4.5 公里。' },
  { id: 'v09', t: 29.90, en: 'Now, climb 100 times higher.', zh: '现在，爬高 100 倍。' },
  { id: 'v10', t: 33.15, en: 'You see only 10 times farther.', zh: '你只能多看远 10 倍。' },
  { id: 'v11', t: 37.20, en: 'From a plane, 10 km up: about 357 km.', zh: '从 10 公里高的飞机上看：大约 357 公里。' },
  { id: 'v12', t: 44.05, en: 'The view grows only with the square root of your height.', zh: '视野只随高度的平方根增长。' },
];
// music grid: 100 bpm, beat 0.6 s, bar 2.4 s (mix.py)
const CUE = { question: 10.2, push: 11.6, cut: 12.35, drop: 21.8, answer: 27.6, peel: 29.0, reveal: 36.2, plane: 39.4, rule: 46.2, sign: 48.35 };

// ───────── facts (CREDITS): everything on the sheets is computed from these
const R_KM = 6371, H1 = 1.6, H2 = 160, H3 = 10000;
const dKm = hM => Math.sqrt(2 * R_KM * hM / 1000);               // d ≈ √(2Rh): 4.52, 45.2, 357.0 km
const fmt1 = x => (Math.round(x * 10) / 10).toString();

// ───────── sheets
const SHEETS = [];
let CUR = null, B = 0, NI = 0;
const lenOf = it => it.T ? it.T.L : it.len;
function E(t0, t1, kind, items) {
  items = [items].flat(4);
  if (B === 0) {
    const xs = items.map(it => it.T ? it.T.x + (it.T.w / 2) * (it.T.align === 'right' ? -1 : it.T.align === 'center' ? 0 : 1) : (it.start[0] + it.end[0]) / 2);
    CUR.EL.push({ t0, t1, kind, color: items[0].T ? items[0].T.color : items[0].color, x: xs.reduce((a, b) => a + b, 0) / xs.length });
  }
  CUR.BUILD[B][NI++] = items;
}
const T = (s, x, y, o = {}) => { const L = ink.layout(s, x, y, { font: 'Kalam', ...o }); L.align = o.align; return { T: L }; };
const ZH = (s, x, y, o = {}) => T(s, x, y, { font: 'LXGW', weight: 400, track: 2, ...o });
// a line of mixed colours, written left to right: [[text, colour], ...]
function TL(parts, x, y, o = {}) {
  const out = []; let cx = x;
  for (const [s, col] of parts) { const t = T(s, cx, y, { ...o, color: col }); out.push(t); cx += t.T.w; }
  out.right = cx; return out;
}
const V = (a, b) => [b[0] - a[0], b[1] - a[1]];
const nrm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const P = (o, u, s) => [o[0] + u[0] * s, o[1] + u[1] * s];
function pageNo(n, t) {
  E(t, t + .2, 'line', circle(1806, 104, 34, { w: 5, a0: -2.6, lap: .3 }));
  E(t + .21, t + .28, 'write', T(String(n), 1806, 124, { size: 52, align: 'center', jit: .3 }));
}
function figure(foot, up, s = 1) {
  const rt = [-up[1], up[0]];
  const at = (u, v) => [foot[0] + rt[0] * u * s + up[0] * v * s, foot[1] + rt[1] * u * s + up[1] * v * s];
  const w = 8.5 * Math.sqrt(s), out = [];
  const hip = at(0, 78), neck = at(2, 150), head = at(4, 178);
  out.push(line(...at(-24, 0), ...hip, { w, bow: .03 }), line(...hip, ...at(22, 0), { w, bow: .03 }));
  out.push(line(...hip, ...neck, { w, bow: .02 }));
  out.push(circle(...head, 25 * s, { w, a0: 2.4, lap: .25 }));
  out.push(curve([neck, at(-14, 118), at(-20, 92)], { w }));
  out.push(curve([neck, at(26, 150), at(30, 184)], { w }));
  out.push(line(...at(18, 188), ...at(46, 186), { w: w * .9, bow: 0 }));
  out.push(new Stroke([...at(16, 180), ...at(17.5, 180.5)], { w: 7 * Math.sqrt(s), jitter: 0, pool: 0 }));
  return { strokes: out, eye: at(17, 180) };
}
function sheet(def) { SHEETS.push({ EL: [], BUILD: [[], [], []], ...def }); }

// ═════════ sheet ①  0–12.35: the question. Black draws the beach, the question is written as it is asked,
//            blue marks what we know, red lands on what we want. Ends with a push into the right-angle mark.
const G1 = {};
sheet({
  id: 1, a: 0, b: 12.35, seed: 8,
  build() {
    reseed(101);
    const R = 1600, C = [980, 2360];
    const onE = a => [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
    const aR = -Math.PI / 2 + Math.asin(950 / R), aL2 = -Math.PI / 2 - Math.asin(975 / R);
    E(0.15, 0.95, 'line', arc(C[0], C[1], R, aL2, aR, { w: 10, wav: 600, jitter: .6 }));
    const Rh = mulberry(5), gs = [];
    for (let a = aL2 + .012; a < aR - .01; a += .0178 + Rh() * .004) {
      const p = onE(a), u = [Math.cos(a), Math.sin(a)], t = [-u[1], u[0]], l = 18 + Rh() * 12;
      gs.push(line(...P(p, u, -12), ...P(P(p, u, -12 - l), t, -l * .55), { w: 3.6, jitter: .2, pool: .4, bow: .02 }));
    }
    E(0.85, 1.55, 'hatch', gs);
    const aF = -Math.PI / 2 - Math.asin(470 / R), up = [Math.cos(aF), Math.sin(aF)], foot = onE(aF);
    const fig = figure(foot, up, 1.45);
    E(1.30, 1.90, 'line', fig.strokes);
    const Ey = fig.eye, hpx = Math.hypot(...V(C, Ey)) - R;
    const aE = Math.atan2(Ey[1] - C[1], Ey[0] - C[0]), aT = aE + Math.acos(R / (R + hpx)), Tp = onE(aT);
    const sight = nrm(V(Ey, Tp)), dPx = Math.hypot(...V(Ey, Tp));
    E(1.95, 2.25, 'line', line(...P(Ey, sight, 14), ...P(Tp, sight, -4), { w: 6, bow: .003, jitter: .5, over: 0 }));
    E(2.25, 2.42, 'dash', dashed([P(Tp, sight, 10), P(Tp, sight, 640)], { w: 5, dash: 22, gap: 15 }));
    const sc = 1.05, drop = 48 * sc;
    const aS = aT + Math.sqrt(2 * R * drop) / R, S0 = onE(aS), su = [Math.cos(aS), Math.sin(aS)], st = [-su[1], su[0]];
    const sh = (u, v) => [S0[0] + st[0] * u * sc + su[0] * v * sc, S0[1] + st[1] * u * sc + su[1] * v * sc];
    E(2.45, 2.80, 'line', [
      curve([sh(-60, 30), sh(-44, 6), sh(0, 2), sh(44, 6), sh(64, 30)], { w: 6.5, jitter: .3 }),
      line(...sh(-64, 30), ...sh(68, 30), { w: 6.5, bow: 0, over: 0 }),
      line(...sh(0, 30), ...sh(0, 156), { w: 6.5, bow: 0 }),
      poly([sh(7, 150), sh(7, 42), sh(60, 44), sh(7, 150)], { w: 6, jitter: .3 }),
      poly([sh(-7, 138), sh(-7, 42), sh(-46, 44), sh(-7, 138)], { w: 6, jitter: .3 })]);
    const inw = nrm(V(Tp, C)), back = [-sight[0], -sight[1]], q = 28;
    E(2.85, 2.95, 'line', poly([P(Tp, back, q), P(P(Tp, back, q), inw, q), P(Tp, inw, q)], { w: 4.5, jitter: .2, pool: 0 }));
    Object.assign(G1, { Tp, sight, inw, q, mark: P(P(Tp, back, q * .5), inw, q * .5) });

    // the question is written while it is asked (v02)
    E(3.85, 4.80, 'write', T('How far away is', 122, 196, { size: 112 }));
    const t2 = T('the horizon?', 122, 318, { size: 112 });
    E(4.85, 5.55, 'write', t2);
    E(5.60, 5.76, 'line', line(118, 346, 122 + t2.T.w - 22, 340, { w: 7, bow: .02, over: 0 }));
    E(5.80, 6.20, 'write', ZH('地平线有多远？', 128, 420, { size: 46 }));
    pageNo(1, 6.25);

    // blue = what we know (v03 «Blue is what we know»)
    const bt = [-up[1], up[0]], bA = P(foot, bt, -78), bB = P(bA, up, hpx);
    E(7.45, 7.70, 'line', arrow2(...P(bA, up, 6), ...P(bB, up, -6), { color: BL, w: 6, head: 20, spread: 2.5 }));
    E(7.75, 8.15, 'write', T(`h = ${H1} m`, Math.min(bA[0], bB[0]) - 30, (bA[1] + bB[1]) / 2 + 16, { size: 52, color: BL, align: 'right' }));
    const fu = nrm(V(foot, C));
    E(8.20, 8.38, 'dash', dashed([P(foot, fu, 34), P(foot, fu, 250)], { color: BL, w: 5.5, dash: 24, gap: 15 }));
    E(8.40, 8.58, 'dash', dashed([P(Tp, inw, 40), P(Tp, inw, 250)], { color: BL, w: 5.5, dash: 24, gap: 15 }));
    E(8.62, 9.05, 'write', T(`R = ${R_KM.toLocaleString('en-US')} km`, 935, 925, { size: 52, color: BL, align: 'center' }));
    // red = what we want (v03 «Red is what we want»)
    const nU = [sight[1], -sight[0]];
    const m0 = P(P(Ey, sight, 46), nU, 50), m1 = P(P(Tp, sight, -20), nU, 50);
    E(9.13, 9.50, 'line', arrow2(...m0, ...m1, { color: RD, w: 7, head: 24, spread: 2.55, bow: .004 }));
    const mid = P(P(Ey, sight, dPx * .52), nU, 118);
    E(9.55, 10.15, 'write', T('d = ?', mid[0], mid[1] + 10, { size: 96, color: RD, align: 'center', rot: Math.atan2(sight[1], sight[0]) * .7 }));
  },
  cam() {
    return [
      [0.00, 700, 690, 1.5], [0.95, 1258, 700, 1.5], [1.40, 700, 690, 1.5], [2.30, 1000, 700, 1.5], [2.75, 1258, 720, 1.5],
      [3.20, 1258, 720, 1.5], [3.95, 960, 540, 1.0],                      // pull back as the question is written
      [8.10, 960, 540, 1.0], [9.20, 640, 762, 1.7], [10.40, 640, 762, 1.7],    // lean in on h, R and d: title and page number wholly out of frame
      [11.60, 960, 540, 1.0, 0, 'eio'],
      [12.35, G1.mark[0], G1.mark[1], 7.0, 0, 'ei'],                       // push through the right-angle mark
    ];
  },
});

// ═════════ sheet ②  12.35–29.8: look closer. Arrives through the same right-angle mark (match cut), pulls out,
//            the triangle is drawn, the camera follows the pen into the algebra, pushes in on the red answer.
const G2 = {};
sheet({
  id: 2, a: 12.35, b: 29.8, seed: 15,
  build() {
    reseed(202);
    // geometry in a frame turned like sheet ①'s line of sight, so the right-angle mark matches on the cut
    const phi = Math.atan2(G1.sight[1], G1.sight[0]);
    const u = [Math.cos(phi), Math.sin(phi)], v = [-u[1], u[0]];          // u: along the sight line, v: towards the centre
    const Tt = [770, 650], Rp = 760, dp = 600;
    const O = P(Tt, v, Rp), Ee = P(Tt, u, -dp);
    const OE = Math.hypot(...V(O, Ee)), Ft = P(O, nrm(V(O, Ee)), Rp), hp = OE - Rp;
    const q2 = 64;
    const mk = [P(Tt, u, -q2), P(P(Tt, u, -q2), v, q2), P(Tt, v, q2)];
    // the mark is already there when we arrive
    E(12.0, 12.01, 'line', poly(mk, { w: 10, jitter: .2, pool: 0 }));
    Object.assign(G2, { Tt, phi, q2, mark: P(P(Tt, u, -q2 * .5), v, q2 * .5) });
    const aT = Math.atan2(Tt[1] - O[1], Tt[0] - O[0]);
    E(13.25, 13.80, 'line', arc(O[0], O[1], Rp, aT - .80, aT + .30, { w: 10, wav: 600, jitter: .6 }));
    const up = nrm(V(O, Ft)), fs = hp / 180, fig = figure(P(Ft, [-up[1], up[0]], -17 * fs), up, fs);   // the eye sits on the line O–E
    E(13.80, 14.20, 'line', fig.strokes);
    const E2 = fig.eye;
    // the line of sight is d, the thing we want: red
    E(14.30, 14.80, 'line', line(...P(E2, nrm(V(E2, Tt)), 12), ...Tt, { color: RD, w: 7, bow: .003, jitter: .4, over: 0 }));
    E(15.00, 15.55, 'write', T('Look closer', 122, 180, { size: 92 }));
    E(15.60, 15.85, 'write', ZH('凑近看', 128, 252, { size: 44 }));
    pageNo(2, 15.9);
    // «at a right angle»: the pen goes over the mark again (it darkens where the ink doubles)
    E(16.60, 16.80, 'line', poly(mk.map(p => P(p, [1, 1], 1.5)), { w: 9, jitter: .25, pool: 0 }));
    // blue: the radius to the tangent point, and the radius under the viewer with h on top
    E(16.90, 17.20, 'line', line(...O.map((c, i) => lerp(c, Tt[i], .02)), ...P(Tt, v, 6), { color: BL, w: 6.5, bow: .004, over: 0 }));
    const mR = P(P(Tt, v, Rp * .38), u, 34);
    E(17.22, 17.40, 'write', T('R', mR[0], mR[1], { size: 60, color: BL }));
    E(17.45, 17.70, 'dash', dashed([O.map((c, i) => lerp(c, Ft[i], .02)), P(Ft, up, -8)], { color: BL, w: 5.5, dash: 24, gap: 15 }));
    const lR = P(lerp2(O, Ft, .62), [-up[1], up[0]], -40);
    E(17.72, 17.86, 'write', T('R', lR[0], lR[1], { size: 60, color: BL, align: 'right' }));
    const hA = P(Ft, [-up[1], up[0]], -54), hB = P(hA, up, hp);
    E(17.88, 18.05, 'line', arrow2(...P(hA, up, 6), ...P(hB, up, -6), { color: BL, w: 5.5, head: 16, spread: 2.5 }));
    E(18.06, 18.18, 'write', T('h', (hA[0] + hB[0]) / 2 - 22, (hA[1] + hB[1]) / 2 + 16, { size: 56, color: BL, align: 'right' }));
    const dL = P(lerp2(E2, Tt, .5), v, -34);
    E(18.20, 18.32, 'write', T('d', dL[0], dL[1], { size: 64, color: RD }));

    // the algebra, written in colour: same quantity, same colour as in the drawing
    const ex = 1060, sz = 70;
    E(18.40, 19.60, 'write', TL([['(', K], ['R', BL], [' + ', K], ['h', BL], [')² = ', K], ['R', BL], ['² + ', K], ['d', RD], ['²', K]], ex, 370, { size: sz }));
    const e2a = TL([['d', RD], ['² = 2', K], ['Rh', BL], [' + ', K]], ex, 480, { size: sz });
    const e2b = T('h²', e2a.right, 480, { size: sz, color: BL });
    E(19.75, 20.90, 'write', [...e2a, e2b]);
    // «so we drop it»: scribbled out with the black marker, then a small note
    const hx = e2b.T.x, hw = e2b.T.w, zz = [];
    for (let i = 0; i <= 15; i++) zz.push([hx - 8 + (hw + 16) * (i / 15) + (i % 2 ? 9 : -9), 480 - 50 + (i % 2) * 54 + Math.sin(i * 1.7) * 4]);
    E(21.80, 22.15, 'line', curve(zz, { w: 6.5, jitter: .3, pool: .6, smooth: 1 }));       // a quick back-and-forth scribble
    E(22.14, 22.42, 'write', T('tiny', hx - 4, 412, { size: 40, weight: 400, rot: -.08 }));
    E(22.60, 23.30, 'write', TL([['d ≈ √(2', RD], ['Rh', RD], [')', RD]], ex, 595, { size: 84 }));
    E(23.60, 25.00, 'write', TL([['= √(2 × ', K], ['6,371 km', BL], [' × ', K], ['0.0016 km', BL], [')', K]], ex + 28, 690, { size: 50 }));
    const ans = T(`≈ ${fmt1(dKm(H1))} km`, ex + 28, 810, { size: 112, color: RD });
    E(26.00, 26.80, 'write', ans);
    const aw = ans.T.w;
    E(26.85, 27.10, 'line', [line(ex + 30, 834, ex + 28 + aw, 830, { color: RD, w: 6, bow: .01, over: 0 }), line(ex + 50, 852, ex + 18 + aw, 850, { color: RD, w: 5.5, bow: .01, over: 0 })]);
    E(27.60, 28.10, 'line', circle(ex + 28 + aw / 2, 782, aw / 2 + 56, { color: RD, w: 7, ry: 96, a0: -2.7, lap: .35 }));
  },
  cam() {
    // arrive: the sheet-② mark sits where sheet ①'s mark filled the screen, at the same size and turn
    const z1 = 7.0, s1 = 28 * z1, z2 = s1 / G2.q2;
    return [
      [12.35, G2.mark[0], G2.mark[1], z2], [13.25, 960, 540, 1.0, 0, 'eo'],
      [19.80, 960, 540, 1.0], [20.70, 1280, 540, 1.5, 0, 'eio'],               // follow the pen into the algebra (title wholly out)
      [23.40, 1280, 560, 1.5], [25.60, 1280, 600, 1.5],
      [26.20, 1280, 600, 1.5], [27.40, 1300, 620, 1.62, 0, 'eio'],              // push in on the answer
      [29.80, 1300, 620, 1.62],
    ];
  },
});
function lerp2(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }

// ═════════ sheet ③  29.0–49.0: the contrast. Close on the beach and the tower (×100 higher → ×10 farther),
//            pull back to reveal the plane's red line running across the whole sheet; the rule, circled, last.
const G3 = {};
sheet({
  id: 3, a: 29.0, b: FILM, seed: 22,
  build() {
    reseed(303);
    E(29.85, 30.75, 'write', T('What if you climb?', 122, 182, { size: 96 }));
    E(30.80, 31.15, 'write', ZH('爬高一点呢？', 128, 258, { size: 44 }));
    pageNo(3, 31.2);
    const rows = [480, 650, 820], x0 = 700, k = 1150 / dKm(H3);         // bars to scale: px per km
    const lab = 330;
    // row 1: you
    const f1 = figure([200, rows[0] + 6], [0, -1], .5);
    E(31.90, 32.20, 'line', f1.strokes);
    E(32.20, 32.50, 'write', T(`${H1} m`, lab, rows[0], { size: 54, color: BL }));
    const b1 = dKm(H1) * k, bh = 18;
    E(32.55, 32.62, 'line', line(x0, rows[0] - 16, x0 + b1, rows[0] - 16, { color: RD, w: bh, jitter: 0, bow: 0, over: 0 }));
    E(32.62, 32.92, 'write', T(`${fmt1(dKm(H1))} km`, x0 + b1 + 30, rows[0], { size: 50, color: RD }));
    // row 2: a tower, 100× higher
    const tx = 200, tb = rows[1] + 8, tt = rows[1] - 120;
    E(32.95, 33.40, 'line', [line(tx - 34, tb, tx - 8, tt, { w: 6.5 }), line(tx + 34, tb, tx + 8, tt, { w: 6.5 }),
      line(tx - 26, tb - 30, tx + 28, tb - 62, { w: 4.5 }), line(tx + 26, tb - 30, tx - 24, tb - 62, { w: 4.5 }),
      line(tx - 18, tb - 70, tx + 18, tb - 94, { w: 4.5 }), line(tx + 18, tb - 70, tx - 16, tb - 94, { w: 4.5 }),
      line(tx - 14, tt, tx + 14, tt, { w: 6.5, over: 4 }), line(tx, tt, tx + 1, tt - 26, { w: 5 }), line(tx - 46, tb, tx + 48, tb, { w: 6.5, over: 0 })]);
    E(33.45, 33.80, 'write', T(`${H2} m`, lab, rows[1], { size: 54, color: BL }));
    E(33.85, 34.20, 'line', arrow(560, rows[0] - 6, 566, rows[1] - 52, { color: BL, w: 5, head: 16, via: [610, (rows[0] + rows[1]) / 2 - 24] }));
    E(34.20, 34.40, 'write', T('×100', 600, (rows[0] + rows[1]) / 2 - 4, { size: 40, color: BL }));
    const b2 = dKm(H2) * k;
    E(34.45, 34.70, 'line', line(x0, rows[1] - 16, x0 + b2, rows[1] - 16, { color: RD, w: bh, jitter: .2, bow: 0, over: 0 }));
    E(34.72, 35.00, 'write', T(`${Math.round(dKm(H2))} km`, x0 + b2 + 30, rows[1], { size: 50, color: RD }));
    E(35.05, 35.40, 'line', arrow(x0 + 240, rows[0] - 22, x0 + 335, rows[1] - 60, { color: RD, w: 5, head: 16, via: [x0 + 330, (rows[0] + rows[1]) / 2 - 30] }));   // starts past the «4.5 km» label
    E(35.40, 35.60, 'write', T('×10', x0 + 352, (rows[0] + rows[1]) / 2 - 4, { size: 40, color: RD }));
    // row 3: a plane, 10 km up — the red line runs across the whole sheet
    const px = 205, py = rows[2] - 26;
    E(37.40, 37.90, 'line', [curve([[px - 70, py + 6], [px - 40, py - 6], [px + 40, py - 8], [px + 72, py + 2], [px + 40, py + 12], [px - 50, py + 14], [px - 70, py + 6]], { w: 6 }),
      poly([[px - 8, py + 2], [px - 30, py + 44], [px - 6, py + 44], [px + 22, py + 6]], { w: 5.5, jitter: .3 }),
      poly([[px - 4, py - 4], [px - 22, py - 36], [px - 4, py - 36], [px + 16, py - 6]], { w: 5.5, jitter: .3 }),
      poly([[px - 62, py + 2], [px - 74, py - 22], [px - 60, py - 22], [px - 44, py - 2]], { w: 5, jitter: .3 })]);
    E(38.30, 38.70, 'write', T('10 km', lab, rows[2], { size: 54, color: BL }));
    const b3 = dKm(H3) * k;
    E(39.40, 40.60, 'line', line(x0, rows[2] - 16, x0 + b3, rows[2] - 18, { color: RD, w: bh, jitter: .4, bow: .002, over: 0 }));
    E(40.70, 41.30, 'write', T(`≈ ${Math.round(dKm(H3))} km`, x0 + b3, rows[2] - 50, { size: 60, color: RD, align: 'right' }));
    E(41.50, 41.90, 'write', T('bars drawn to scale', x0, rows[2] + 52, { size: 34, weight: 400 }));
    // the rule (v12), top right, circled — the last red stroke of the film
    const rx = 1180, ry = 236;
    const rule = TL([['d ≈ √(2', RD], ['Rh', RD], [')', RD]], rx, ry, { size: 88 });
    E(44.25, 45.05, 'write', rule);
    const rw = rule.right - rx;
    E(46.20, 46.80, 'line', circle(rx + rw / 2, ry - 30, rw / 2 + 60, { color: RD, w: 7, ry: 82, a0: -2.8, lap: .35 }));
    E(46.82, 47.20, 'write', ZH('高四倍，远两倍', rx + 40, ry + 96, { size: 40, color: RD }));
    // end card, written in the empty corner of the last sheet once the camera is back on the whole page:
    // the film, the style, and the signature — black marker, the sheet's own hand
    const cx0 = 1410;
    E(47.62, 47.66, 'line', line(cx0, 858, cx0 + 200, 856, { w: 4.5, bow: .02, over: 0 }));
    E(47.66, 47.86, 'write', T('How far can you see?', cx0, 902, { size: 40 }));
    E(47.86, 47.98, 'write', ZH('你能看多远？', cx0 + 2, 944, { size: 34 }));
    const st = T('Marker on Paper', cx0, 992, { size: 30, weight: 400 });
    E(47.98, 48.15, 'write', [st, ZH('马克笔白纸速写', cx0 + st.T.w + 16, 992, { size: 34 })]);
    E(48.15, 48.35, 'write', T('LemoLab × Claude Opus 5.5', cx0, 1040, { size: 34 }));
  },
  cam() {
    return [
      [29.80, 960, 540, 1.0], [33.55, 960, 540, 1.0], [34.25, 580, 600, 1.8, 0, 'eio'],    // close on the beach and the tower
      [35.80, 640, 600, 1.8], [37.20, 960, 540, 1.0, 0, 'eio'],                           // pull back: the empty line waiting
      [43.90, 960, 540, 1.0], [44.70, 1440, 320, 2.0, 0, 'eio'],                          // push in on the rule: the title wholly out (left)
      [46.85, 1440, 320, 2.0], [47.60, 960, 540, 1.0, 0, 'eio'], [FILM, 960, 540, 1.0],    // last: the whole sheet
    ];
  },
});

// ───────── camera: keys [t, cx, cy, zoom, rot, ease]; zoom eases in log space; rot only on the match cut
let CAMS = [];
function camAt(S, t) {
  const k = S.keys;
  if (t <= k[0][0]) return k[0];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const a = k[i - 1], b = k[i], ef = { eio, eo, ei }[b[5] || 'eio'], u = ef((t - a[0]) / (b[0] - a[0]));
    return [t, lerp(a[1], b[1], u), lerp(a[2], b[2], u), Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u)), lerp(a[4] || 0, b[4] || 0, u)];
  }
  return k[k.length - 1];
}
function matrix([, cx, cy, z, r = 0]) {
  if (z >= 1 && !r) { const hw = W / 2 / z, hh = H / 2 / z; cx = clamp(cx, hw, W - hw); cy = clamp(cy, hh, H - hh); }
  const a = z * Math.cos(r), b = z * Math.sin(r), c = -b, d = a;
  return [a, b, c, d, W / 2 - (a * cx + c * cy), H / 2 - (b * cx + d * cy)];
}

// ───────── draw one sheet at one moment into an ImageData
const LIFT = 22;
const pcv = document.createElement('canvas'); pcv.width = W; pcv.height = H;
const px = pcv.getContext('2d', { willReadFrequently: true });
function drawSheet(S, t, out) {
  const f = Math.floor(t * 12 + 1e-6), tq = f / 12, boil = f % 3;
  const M = matrix(camAt(S, t));                              // the camera moves smoothly; the drawing is on twos
  ink.clear(); ink.setCamera(M);
  S.EL.forEach((e, i) => {
    const p = clamp((tq - e.t0) / (e.t1 - e.t0));
    if (p <= 0) return;
    const items = S.BUILD[boil][i], lens = items.map(lenOf), tot = lens.reduce((a, b) => a + b, 0) + LIFT * (items.length - 1);
    let left = p >= 1 ? Infinity : p * tot;
    for (let k = 0; k < items.length && left > 0; k++) {
      const it = items[k];
      if (it.T) ink.write(it.T, left); else ink.stroke(it, left);
      left -= lens[k] + LIFT;
    }
  });
  px.setTransform(1, 0, 0, 1, 0, 0); px.fillStyle = '#f8f7f3'; px.fillRect(0, 0, W, H);
  px.setTransform(...M); px.imageSmoothingQuality = 'high'; px.drawImage(S.paperC, 0, 0); px.setTransform(1, 0, 0, 1, 0, 0);
  composeOn(px.getImageData(0, 0, W, H).data, ink, out);
  return out;
}

// ───────── the peel: the corner lifts, a fold line sweeps from bottom-right to top-left, the sheet is pulled away
const imA = X.createImageData(W, H), imB = X.createImageData(W, H);
const cA = document.createElement('canvas'); cA.width = W; cA.height = H;
const cB = document.createElement('canvas'); cB.width = W; cB.height = H;
const PEEL = { a: 29.0, b: 29.8 };
function peelFrame(t, SA, SB) {
  const u = eio((t - PEEL.a) / (PEEL.b - PEEL.a));
  drawSheet(SA, Math.min(t, PEEL.a), imA); cA.getContext('2d').putImageData(imA, 0, 0);
  drawSheet(SB, t, imB); cB.getContext('2d').putImageData(imB, 0, 0);
  const n = nrm([-W, -H]), BR = [W, H], diag = Math.hypot(W, H), s = lerp(-20, diag + 260, u);
  const F = P(BR, n, s), tv = [-n[1], n[0]];                    // a point on the fold line, and its direction
  const half = (sign) => { X.beginPath(); const L = 4000; const a = P(F, tv, -L), b = P(F, tv, L); X.moveTo(...a); X.lineTo(...b); X.lineTo(...P(b, n, sign * L)); X.lineTo(...P(a, n, sign * L)); X.closePath(); };
  X.drawImage(cB, 0, 0);
  // a light shadow on the next sheet along the fold
  X.save(); half(-1); X.clip();
  let g = X.createLinearGradient(...F, ...P(F, n, -46)); g.addColorStop(0, 'rgba(70,63,51,.14)'); g.addColorStop(1, 'rgba(70,63,51,0)');
  X.fillStyle = g; X.fillRect(0, 0, W, H); X.restore();
  // the rest of the top sheet
  X.save(); half(1); X.clip(); X.drawImage(cA, 0, 0); X.restore();
  // the flap: the folded corner reflected over the fold line, a little foreshortened (lifted), back of the paper
  const refl = p => { const d = (p[0] - F[0]) * n[0] + (p[1] - F[1]) * n[1]; return P(p, n, -2 * d * .86); };
  const corners = [[0, 0], [W, 0], [W, H], [0, H]], poly2 = [];
  for (let i = 0; i < 4; i++) {                                 // the part of the sheet on the corner side of the fold
    const p = corners[i], q = corners[(i + 1) % 4], dp = (p[0] - F[0]) * n[0] + (p[1] - F[1]) * n[1], dq = (q[0] - F[0]) * n[0] + (q[1] - F[1]) * n[1];
    if (dp < 0) poly2.push(p);
    if ((dp < 0) !== (dq < 0)) { const r = dp / (dp - dq); poly2.push([lerp(p[0], q[0], r), lerp(p[1], q[1], r)]); }
  }
  if (poly2.length > 2) {
    const fl = poly2.map(refl);
    X.save(); X.beginPath(); fl.forEach((p, i) => i ? X.lineTo(...p) : X.moveTo(...p)); X.closePath();
    // its shade on the top sheet, kept narrow and pale
    X.save(); X.shadowColor = 'rgba(60,52,40,.16)'; X.shadowBlur = 18; X.shadowOffsetX = -4; X.shadowOffsetY = -3;
    const g2 = X.createLinearGradient(...F, ...P(F, n, 520)); g2.addColorStop(0, '#e2e0d9'); g2.addColorStop(.35, '#efede8'); g2.addColorStop(1, '#f7f6f2');
    X.fillStyle = g2; X.fill(); X.restore();
    X.strokeStyle = 'rgba(150,142,128,.35)'; X.lineWidth = 1; X.stroke(); X.restore();
  }
}

// ───────── subtitles: a torn slip of the same paper laid over the bottom of the sheet; Chinese over English
let DURS = {};
function cues() {
  const c = VO.map(v => ({ ...v, t0: v.t, t1: v.t + Math.max(1.8, (DURS[v.id] || 2) + .6) }));
  for (let i = 0; i < c.length - 1; i++) c[i].t1 = Math.min(c[i].t1, c[i + 1].t0 - .05);
  return c;
}
let CUES = [];
function drawSub(t) {
  const c = CUES.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const al = Math.min(1, (t - c.t0) / .12, (c.t1 - t) / .12);
  X.save(); X.globalAlpha = clamp(al);
  X.font = '400 38px "LXGW"'; const wz = X.measureText(c.zh).width;
  X.font = '400 31px "Kalam"'; const we = X.measureText(c.en).width;
  const w = Math.max(wz, we) + 64, x0 = (W - w) / 2, y0 = 948, y1 = 1058, R = mulberry(c.id.charCodeAt(2) * 31 + 7);
  X.beginPath(); X.moveTo(x0, y0); X.lineTo(x0 + w, y0);
  for (let y = y0; y <= y1; y += 7) X.lineTo(x0 + w + (R() - .5) * 7, y);      // torn ends
  X.lineTo(x0, y1);
  for (let y = y1; y >= y0; y -= 7) X.lineTo(x0 + (R() - .5) * 7, y);
  X.closePath();
  X.fillStyle = 'rgba(251,250,247,.96)'; X.fill();
  X.strokeStyle = 'rgba(70,63,51,.16)'; X.lineWidth = 1; X.stroke();
  X.fillStyle = '#1B1C20'; X.textAlign = 'center';
  X.font = '400 38px "LXGW"'; X.fillText(c.zh, W / 2, 994);
  X.globalAlpha *= .78; X.font = '400 31px "Kalam"'; X.fillText(c.en, W / 2, 1036);
  X.restore();
}

const IM = X.createImageData(W, H);
function renderFilm(t) {
  if (t >= PEEL.a && t < PEEL.b) peelFrame(t, SHEETS[1], SHEETS[2]);
  else {
    const S = t < SHEETS[0].b ? SHEETS[0] : t < PEEL.a ? SHEETS[1] : SHEETS[2];
    drawSheet(S, t, IM); X.putImageData(IM, 0, 0);
  }
  if (SUBS) drawSub(t);
}

async function boot() {
  const fonts = [
    new FontFace('Kalam', 'url(fonts/Kalam-Bold.ttf)', { weight: '700' }),
    new FontFace('Kalam', 'url(fonts/Kalam-Regular.ttf)', { weight: '400' }),
    new FontFace('LXGW', 'url(fonts/LXGWMarkerGothic-film.ttf)', { weight: '400' }),
  ];
  for (const f of fonts) { await f.load(); document.fonts.add(f); }
  setGlyphs(await (await fetch('glyphs.json')).json());
  try { DURS = await (await fetch('vo/dur.json')).json(); } catch { }
  CUES = cues();
  for (const S of SHEETS) {
    CUR = S;
    for (B = 0; B < 3; B++) { NI = 0; setBoil(B); S.build(); }
    setBoil(0);
    S.keys = S.cam();
    S.paperC = paperCanvas(makePaper(S.seed));
  }
  window.DUR = T1 - T0;
  window.render = t => renderFilm(t + T0);
  const ev = [];
  for (const S of SHEETS) S.EL.forEach((e, i) => {
    const items = S.BUILD[0][i], lens = items.map(lenOf), tot = lens.reduce((a, b) => a + b, 0) + LIFT * (items.length - 1);
    let acc = 0;
    items.forEach((it, k) => {
      const a = e.t0 + (e.t1 - e.t0) * acc / tot, b = e.t0 + (e.t1 - e.t0) * (acc + lens[k]) / tot;
      const segs = it.T ? it.T.gl.map(g => ({ t: a + (b - a) * g.L0 / it.T.L, d: (b - a) * g.len / it.T.L * .9, v: g.len / Math.max(1e-3, (b - a) * g.len / it.T.L) })) : [{ t: a, d: b - a, v: lens[k] / Math.max(1e-3, b - a) }];
      if (e.t1 - e.t0 > .02) for (const g of segs) ev.push({ t: +(g.t - T0).toFixed(4), d: +g.d.toFixed(4), type: e.kind, col: e.color, v: Math.round(g.v), pan: +clamp(e.x / W * 2 - 1, -1, 1).toFixed(3), sheet: S.id });
      acc += lens[k] + LIFT;
    });
  });
  ev.push({ t: PEEL.a - T0, type: 'peel', d: PEEL.b - PEEL.a });
  for (const [k, v] of Object.entries(CUE)) ev.push({ t: v - T0, type: 'cue', name: k });
  for (const v of VO) ev.push({ t: v.t - T0, type: 'vo', id: v.id });
  window.EV = ev.filter(e => e.t > -1e-6 && e.t < window.DUR).sort((a, b) => a.t - b.t);
  window.SUBS_CUES = CUES.map(c => ({ t0: c.t0, t1: c.t1, text: `${c.zh}\n${c.en}` }));
  // reading-time check (core/render/readcheck.mjs): every line written on the sheet, full text from its first stroke,
  // with its box on screen through the camera. Subtitles are checked by the .srt.
  window.TEXTS = t => {
    t += T0;
    const S = t >= PEEL.a && t < PEEL.b ? SHEETS[1] : t < SHEETS[0].b ? SHEETS[0] : t < PEEL.a ? SHEETS[1] : SHEETS[2];
    const M = matrix(camAt(S, t)), out = [];
    S.EL.forEach((e, i) => {
      if (e.kind !== 'write' || t < e.t0) return;
      const its = S.BUILD[0][i].filter(it => it.T); if (!its.length) return;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const { T: L } of its) {
        const ax = L.align === 'right' ? -L.w : L.align === 'center' ? -L.w / 2 : 0;
        for (const [px, py] of [[ax, -L.size * .8], [ax + L.w, -L.size * .8], [ax, L.size * .25], [ax + L.w, L.size * .25]]) {
          const c = Math.cos(L.rotAll), s = Math.sin(L.rotAll), wx = L.x + px * c - py * s, wy = L.y + px * s + py * c;
          const sx = M[0] * wx + M[2] * wy + M[4], sy = M[1] * wx + M[3] * wy + M[5];
          x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
        }
      }
      out.push({ id: `s${S.id}-${i}`, text: its.map(it => it.T.str).join(''), x0, y0, x1, y1 });
    });
    return out;
  };
  window.READY = true;
}
boot();
