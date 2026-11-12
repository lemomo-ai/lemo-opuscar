// The Same Banana 同一根香蕉 — Pop Art demo: a screen-print film. One timeline (timeline.json), render(t) is pure.
// ?sign10=1 adds the sign-off label in 7.5–10 s; ?from=a&to=b renders a span of the same timeline; ?nosubs=1 hides the subtitles.
import { createPop, T, rectPts, ellipsePts, toPath, dens } from './engine/pop.js';
import { banana, bananaLite, bananaPolys, slice, plant, VAR } from './banana.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '/core/lib.js';

const pop = createPop(document.getElementById('c'));
const Q = new URLSearchParams(location.search);
const TL = await (await fetch('timeline.json')).json();
const SH = TL.shots, LN = TL.lines;
const SIGN10 = Q.get('sign10') === '1';       // the 10 s cut: sign-off label in its last 2.5 s
await Promise.all(['40px Anton', '40px Archivo', '40px NotoSC'].map(f => document.fonts.load(f)));
window.DUR = TL.dur;
const W = 1920, H = 1080, TS = 600;
const part = id => { for (const L of LN) for (const p of L.parts) if (p.id === id) return p; };
const h2 = (i, j, k = 0) => hash(i * 17.13 + j * 91.7 + k * 7.31);

// ---------------------------------------------------------------- events (sound) ----
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });

// ---------------------------------------------------------------- the wall ----
// stamp order: rings around the first print, accelerating like a press finding its rhythm
const ORDER = [];
for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) if (i || j) ORDER.push([i, j]);
ORDER.sort((a, b) => (Math.max(Math.abs(a[0]), Math.abs(a[1])) - Math.max(Math.abs(b[0]), Math.abs(b[1]))) || (Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])));
const STAMP = new Map();
ORDER.forEach(([i, j], n) => { const ta = SH.s2 + 1.0 + 2.6 * Math.pow((n + 1) / ORDER.length, .6); STAMP.set(i + ',' + j, ta); if (n < 40 || n % 3 == 0) ev(ta, 'stamp', { pan: clamp(i / 6, -1, 1) * .7, v: n < 8 ? 1 : .6 }); });
const stampT = (i, j) => (i || j) ? (STAMP.get(i + ',' + j) ?? SH.s2 + 3.6 + h2(i, j) * .3) : -1;

// the giant banana the varied tiles add up to (S10)
const GIANT = { L: 13000, curve: .46, girth: .24, x: 2900, y: -250, rot: -.28 };
const GP = bananaPolys(GIANT);
const gctx = new OffscreenCanvas(4, 4).getContext('2d');
const gm = new DOMMatrix().translate(GIANT.x, GIANT.y).rotate(GIANT.rot * 180 / Math.PI);
const toPath2 = (pts) => { const p = new Path2D(); pts.forEach((q, k) => { const r = gm.transformPoint(new DOMPoint(q[0], q[1])); k ? p.lineTo(r.x, r.y) : p.moveTo(r.x, r.y); }); p.closePath(); return p; };
const G_BODY = toPath2(GP.body), G_BELLY = toPath2(GP.belly), G_BACK = toPath2(GP.back.concat(GP.back.slice().reverse().map(([x, y]) => [x, y - 200])));
const gStem = (() => { const e = GP.end, e2 = GP.pre; const a = Math.atan2(e[1] - e2[1], e[0] - e2[0]) - .55; const sl = GIANT.L * .13, sw = GIANT.L * .045; const sx = e[0] - Math.cos(a) * sl * .2, sy = e[1] - Math.sin(a) * sl * .2, cx = Math.cos(a), cy = Math.sin(a); return [[sx - cy * sw, sy + cx * sw], [sx + cx * sl - cy * sw * .8, sy + cy * sl + cx * sw * .8], [sx + cx * sl + cy * sw * .8, sy + cy * sl - cx * sw * .8], [sx + cy * sw, sy - cx * sw]]; })();
const G_STEM = toPath2(gStem);
const gInk = (x, y) => {
  if (gctx.isPointInPath(G_STEM, x, y)) return { y: 1, b: .7 };
  if (!gctx.isPointInPath(G_BODY, x, y)) return T.blue;
  if (gctx.isPointInPath(G_BELLY, x, y)) return { r: .62, y: 1 };
  return T.yellow;
};
// cells whose ground belongs to the giant, and the cell edges between inside and outside (the giant's key line)
const G_IN = (i, j) => gInk(i * TS, j * TS) !== T.blue;
const G_EDGES = (() => {
  const E = [], h = TS / 2;
  for (let j = -16; j <= 16; j++) for (let i = -26; i <= 26; i++) {
    if (!G_IN(i, j)) continue;
    const x = i * TS, y = j * TS;
    if (!G_IN(i - 1, j)) E.push([x - h, y - h, x - h, y + h]);
    if (!G_IN(i + 1, j)) E.push([x + h, y - h, x + h, y + h]);
    if (!G_IN(i, j - 1)) E.push([x - h, y - h, x + h, y - h]);
    if (!G_IN(i, j + 1)) E.push([x - h, y + h, x + h, y + h]);
  }
  // drawn in order round the giant, starting at its tip
  const a0 = Math.atan2(GP.tip[1], GP.tip[0]) + GIANT.rot;
  const ang = e => { const a = Math.atan2((e[1] + e[3]) / 2 - GIANT.y, (e[0] + e[2]) / 2 - GIANT.x) - a0; return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); };
  return E.sort((a, b) => ang(a) - ang(b));
})();
const VK = ['red', 'blue', 'plantain', 'lady', 'pink', 'purple', 'striped', 'orange', 'green', 'gros', 'cavendish'];
const tileVar = (i, j) => {
  const k = (i === 0 && j === 0) ? 'red' : VK[Math.floor(h2(i, j, 3) * VK.length)];
  return { k, rot: -.38 + (h2(i, j, 4) - .5) * 1.1, flipY: h2(i, j, 5) < .3 };
};
const flipT = (i, j) => (i === 0 && j === 0) ? SH.s9 : SH.s9 + .38 + Math.hypot(i, j * 1.15) * .13 + h2(i, j, 6) * .09;
{ // flip sounds: the first one alone, then the wave (thinned)
  ev(SH.s9, 'flip', { v: 1.2 });
  const fl = []; for (let j = -10; j <= 10; j++) for (let i = -19; i <= 19; i++) if (i || j) fl.push(flipT(i, j));
  fl.sort((a, b) => a - b); let last = -1;
  for (const t of fl) if (t - last > .045 && t < SH.s9 + 3.2) { ev(t, 'flip', { v: .5 }); last = t; }
}

function cloneTile(i, j, o = {}) {
  const mis = [(h2(i, j, 1) - .5) * 14, (h2(i, j, 2) - .5) * 10];
  const ap = o.appear ?? 1;
  if (ap <= 0) return;
  pop.save(); pop.translate(i * TS, j * TS);
  if (ap < 1) { const s = 1 + .14 * (1 - eo(ap)); pop.scale(s); }
  const bigMis = ap < 1 ? (1 - eo(ap)) * 60 : 0;
  pop.fill(rectPts(-TS / 2, -TS / 2, TS, TS), T.blue);
  pop.save(); pop.translate(mis[0] * .6 + bigMis, mis[1] * .6 - bigMis * .5); pop.fill(ellipsePts(0, 0, 238, 238, 72), T.white); pop.restore();
  pop.save(); pop.rotate(-.38); pop.translate(10, 30); pop.scale(1.12);
  if (o.lite) bananaLite(pop, { ...VAR.cavendish, lw: 12 });
  else banana(pop, { ...VAR.cavendish, mis: [mis[0] - bigMis, mis[1] + bigMis * .7], lw: 7.5 });
  pop.restore();
  pop.restore();
}
function varTile(i, j, o = {}) {
  const v = tileVar(i, j), V = VAR[v.k];
  const cx = i * TS, cy = j * TS;
  pop.save(); pop.translate(cx, cy);
  pop.fill(rectPts(-TS / 2, -TS / 2, TS, TS), gInk(cx, cy));
  pop.fill(ellipsePts(0, 0, 226, 226, 56), T.white);
  pop.rotate(v.rot); const s = 470 / V.L; pop.scale(s, v.flipY ? -s : s);
  if (o.lite) bananaLite(pop, { ...V, lw: 12 / s }); else banana(pop, { ...V, lw: 7.5 / s, mis: [(h2(i, j, 7) - .5) * 12, (h2(i, j, 8) - .5) * 10] });
  pop.restore();
}
function wallTile(i, j, t, lite) {
  if (t < SH.s9 || t < flipT(i, j)) { cloneTile(i, j, { appear: t < SH.s2 + 4 ? seg(t, stampT(i, j), stampT(i, j) + .14) : 1, lite }); return 'clone'; }
  const p = seg(t, flipT(i, j), flipT(i, j) + .3);
  if (p >= 1) { varTile(i, j, { lite }); return 'var'; }
  const sx = Math.abs(Math.cos(p * Math.PI));
  pop.save(); pop.translate(i * TS, j * TS); pop.scale(Math.max(.02, sx), 1); pop.translate(-i * TS, -j * TS);
  if (p < .5) cloneTile(i, j, { lite }); else varTile(i, j, { lite });
  pop.restore(); return 'flip';
}
function drawWall(t, cam, rot) {
  const hw = W / 2 / cam.zoom + TS, hh = H / 2 / cam.zoom + TS;
  const i0 = Math.floor((cam.x - hw) / TS), i1 = Math.ceil((cam.x + hw) / TS);
  const j0 = Math.floor((cam.y - hh) / TS), j1 = Math.ceil((cam.y + hh) / TS);
  const lite = cam.zoom < .16;
  pop.fill(rectPts(cam.x - hw - 2000, cam.y - hh - 2000, hw * 2 + 4000, hh * 2 + 4000), T.white);
  const late = [];
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (t >= SH.s9 && t >= flipT(i, j)) { late.push([i, j]); continue; }
    wallTile(i, j, t, lite);
  }
  if (rot) rot(i0, i1, j0, j1);                     // the rot dots sit on the clones only
  for (const [i, j] of late) wallTile(i, j, t, lite);
}

// ---------------------------------------------------------------- type ----
const ink = { paper: T.white, red: T.red, yellow: T.yellow, blue: T.blue };
const screen = (fn) => { pop.save(); [pop.P, pop.L, pop.S].forEach(c => c.setTransform(1, 0, 0, 1, 0, 0)); fn(); pop.restore(); };
// a headline printed plate by plate: colour lands first (from an offset), then the black key snaps on
function printType(str, x, y, o, p) {
  if (p <= 0) return;
  const e = eo(seg(p, 0, .7));
  const dx = (o.fromX ?? 90) * (1 - e), dy = (o.fromY ?? -40) * (1 - e);
  const base = { size: o.size, font: o.font || 'Anton', align: o.align || 'left', letter: o.letter, rot: o.rot || 0 };
  if (o.drop) pop.text(str, x + o.drop[0] - dx * .6, y + o.drop[1] - dy * .6, { ...base, fill: o.dropInk || T.red });
  pop.text(str, x + dx, y + dy, { ...base, fill: o.ink || T.yellow });
  if (p > .45 && o.outline !== 0) pop.text(str, x, y, { ...base, outline: o.outline ?? Math.max(3, o.size * .045), spot: 'rgba(0,0,0,0)', read: 'type:' + str });
}
// a paper label with a red offset plate: the film's caption block. lines: [{s, size, font, ink}]
function label(x, y, lines, p, o = {}) {
  if (p <= 0) return;
  const padX = o.padX ?? 34, padY = o.padY ?? 24, gap = o.gap ?? 10;
  const ws = lines.map(l => pop.measure(l.s, { size: l.size, font: l.font || 'Anton', letter: l.letter }));
  const w = Math.max(...ws) + padX * 2, h = lines.reduce((a, l) => a + l.size * (l.lh ?? 1.12), 0) + gap * (lines.length - 1) + padY * 2;
  const e = eo(seg(p, 0, .55)), k = o.instant ? Math.max(.01, seg(p, 0, .65)) : seg(p, .35, 1);
  const ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  pop.save(); pop.translate(ax + w / 2, y + h / 2); pop.rotate(o.rot || 0); pop.translate(-(ax + w / 2), -(y + h / 2));
  const off = o.shadow ?? 12;
  const sx = (1 - e) * -70, sy = (1 - e) * 30;
  pop.fill(rectPts(ax + off + sx, y + off + sy, w, h), o.shadowInk || T.red);
  pop.fill(rectPts(ax + (1 - e) * 50, y - (1 - e) * 26, w, h), o.bg || T.white);
  if (p > .3 || o.instant) pop.outline(rectPts(ax, y, w, h), o.lw ?? 5);
  let yy = y + padY;
  lines.forEach((l, n) => {
    const lh = l.size * (l.lh ?? 1.12);
    const lx = o.align === 'center' ? ax + w / 2 : ax + padX;
    if (k > 0) {
      const ke = o.instant ? eo(k) : eo(seg(k, n * .12, n * .12 + .5));
      pop.text(l.s, lx + (1 - ke) * 26, yy + lh / 2 + 1, { size: l.size, font: l.font || 'Anton', align: o.align === 'center' ? 'center' : 'left', letter: l.letter, read: 'label:' + l.s, ...(l.ink ? { fill: l.ink } : {}) });
    }
    yy += lh + gap;
  });
  pop.restore();
}
const lab = (t, t0, t1) => t < t0 || t > t1 + .36 ? 0 : seg(t, t0, t0 + .5);
// label exit: slide off quickly (handled by caller through x offset)
const exitX = (t, t1) => t > t1 ? -ei(seg(t, t1, t1 + .35)) * 1400 : 0;

// subtitles: a paper strip, Chinese over English, bottom centre
function subtitle(t) {
  const L = LN.find(L => t >= L.c0 && t < L.c1); if (!L) return;
  const p = seg(t, L.c0, L.c0 + .14);
  const zs = 40, es = 28;
  const wz = pop.measure(L.zh, { size: zs, font: 'NotoSC' }), we = pop.measure(L.en, { size: es, font: 'Archivo' });
  const w = Math.max(wz, we) + 64, h = 108, x = W / 2 - w / 2, y = 948;
  pop.fill(rectPts(x + 9, y + 9, w, h), T.red);
  pop.fill(rectPts(x, y, w, h), T.white);
  pop.outline(rectPts(x, y, w, h), 4);
  pop.alpha(1);
  pop.text(L.zh, W / 2, y + 36 + (1 - p) * 6, { size: zs, font: 'NotoSC' });
  pop.text(L.en, W / 2, y + 80 + (1 - p) * 6, { size: es, font: 'Archivo' });
}

// ---------------------------------------------------------------- shots ----
function present(fx = {}) { pop.present({ cell: 5.6, ...fx }); }

// S1 + S2 + S3 head: the poster, the copies, the wall
function shotWall(t) {
  // camera: from deep in the belly dots → the single print → the wall → (s3) dive into the disc
  let cam;
  const a = seg(t, 0, SH.s2 - .2), b = seg(t, SH.s2 - .2, SH.s3), c = seg(t, SH.s3, SH.s3 + .38);
  const z1 = Math.exp(lerp(Math.log(18), Math.log(1.45), eio(a)));
  if (t < SH.s2 - .2) cam = { x: lerp(-30, 330, eio(a)), y: lerp(122, 0, eio(a)), zoom: z1, rot: lerp(.55, 0, eo(a)) };
  else if (t < SH.s3) cam = { x: lerp(330, 0, eio(b)), y: 0, zoom: Math.exp(lerp(Math.log(1.45), Math.log(.37), eio(b))), rot: lerp(0, -.035, eio(b)) };
  else cam = { x: lerp(0, -20, ei(c)), y: lerp(0, -40, ei(c)), zoom: Math.exp(lerp(Math.log(.37), Math.log(2.3), ei(c))), rot: -.035 };
  pop.begin(cam, { desk: null });
  drawWall(t, cam);
  // S1 words, printed on the sheet beside the first print (the copies stamp over them)
  const pw = seg(t, 1.25, 1.9);
  pop.save();
  printType('THE SAME', 350, -100, { size: 120, ink: T.yellow, drop: [9, 9], fromX: 140, fromY: -50 }, pw);
  printType('BANANA.', 350, 25, { size: 120, ink: T.red, drop: [9, 9], dropInk: T.blue, fromX: -120, fromY: 40 }, seg(t, 1.45, 2.1));
  if (t > 1.9) pop.text('同一根香蕉', 354, 128, { size: 50, font: 'NotoSC', fill: T.blue, align: 'left', read: 'type:同一根香蕉' });
  pop.restore();
  // redraw the copies that land on top of the words (tiles 1,0 and 1,-1 …)
  for (const [i, j] of [[1, 0], [1, -1], [1, 1]]) if (t >= stampT(i, j)) cloneTile(i, j, { appear: seg(t, stampT(i, j), stampT(i, j) + .14) });
  // S2 label, in page space so the dive carries it away
  screen(() => label(96 + exitX(t, SH.s3 - .05), 80, [{ s: 'ONE PLANT. COPIED.', size: 104, ink: T.red }, { s: '同一株，复制', size: 48, font: 'NotoSC' }], lab(t, 6.1, SH.s3 - .05), { rot: -.03 }));
  present({ cell: 5.6 });
}
ev(.12, 'pull', { d: 3.8 }); ev(1.25, 'print'); ev(1.45, 'print', { v: .7 });
ev(6.1, 'print', { v: 1.1 }); ev(SH.s3, 'dive', { d: .4 });

// S3 slice + S4 plants (one long strip: a red print, then a yellow field)
function shotStrip(t) {
  const c0 = SH.s3 + .38;
  const a = seg(t, c0, c0 + .9), pan = seg(t, SH.s4, SH.s5 - .25);
  const sliceX = -330, sliceY = -40, R = 380;
  const zA = lerp(1.3, 1, back(a, 1.2));
  const cam = { x: lerp(sliceX * .9, 0, eo(a)) + 3050 * eio(pan), y: lerp(sliceY, 0, eo(a)), zoom: zA, rot: 0 };
  pop.begin(cam, { desk: null });
  pop.fill(rectPts(-1400, -800, 1400 + 760, 1600), T.red);
  pop.fill(rectPts(760, -800, 4600, 1600), T.yellow);
  pop.line([[760, -800], [760, 800]], 10, { taper: 0 });
  // the slice, slowly turning
  pop.save(); pop.translate(sliceX, sliceY); pop.rotate(t * .06); slice(pop, R, { seeds: seg(t, c0, c0 + .3) }); pop.restore();
  // rings around the seed specks: "no seeds"
  const ringT = part('v03_a').t + 1.15;
  for (let i = 0; i < 9; i++) {
    const p = seg(t, ringT + i * .07, ringT + i * .07 + .25); if (p <= 0) continue;
    const a2 = i / 9 * Math.PI * 2 + .3 + t * .06, rr = R * (.26 + .03 * (i % 2));
    pop.save(); pop.translate(sliceX + Math.cos(a2) * rr, sliceY + Math.sin(a2) * rr);
    pop.line(ellipsePts(0, 0, 22 + 18 * (1 - eo(p)), 22 + 18 * (1 - eo(p)), 24), 4, { taper: 0 });
    pop.restore();
  }
  printType('NO', 150, -230, { size: 250, ink: T.yellow, drop: [12, 12], dropInk: T.blue }, seg(t, part('v03_a').t + .2, part('v03_a').t + .7));
  printType('SEEDS.', 150, 15, { size: 250, ink: T.yellow, drop: [12, 12], dropInk: T.blue, fromX: -110 }, seg(t, part('v03_a').t + .4, part('v03_a').t + .9));
  if (t > part('v03_a').t + .8) pop.text('没有种子', 156, 200, { size: 60, font: 'NotoSC', fill: T.white, align: 'left', read: 'type:没有种子' });
  // ground + plants
  pop.fill(rectPts(760, 290, 4600, 600), { r: .55, y: .9, b: .35 });
  pop.line([[760, 290], [5400, 290]], 8, { taper: 0 });
  const t0 = part('v03_b').t - .1;
  for (let k = 0; k < 6; k++) {
    const x = 1250 + k * 560;
    const tg = t0 + k * .55;
    const g = k === 0 ? 1 : lerp(.16, 1, eo(seg(t, tg, tg + .5)));
    const sprout = k === 0 ? 1 : seg(t, tg - .35, tg - .05);
    if (sprout <= 0) continue;
    // the root runner from the previous plant
    if (k > 0) {
      const xs = x - 560, run = []; for (let u = 0; u <= 1.0001; u += .05) run.push([xs + 30 + u * (530 * eo(sprout)), 318 + Math.sin(u * Math.PI) * 26]);
      pop.line(run, 9, { taper: .2 });
    }
    const mis = k === 0 ? [4, -3] : [(1 - eo(seg(t, tg, tg + .3))) * 40 + 4, (1 - eo(seg(t, tg, tg + .3))) * -20 - 3];
    pop.save(); pop.translate(x, 290); plant(pop, { H: 600, g: g * eo(sprout) + .001, mis }); pop.restore();
    if (k > 0 && t > tg) pop.text('COPY ' + String(k).padStart(2, '0'), x, 372, { size: 46, font: 'Anton', fill: T.white, outline: 0 });
    if (k === 0) pop.text('ORIGINAL', x, 372, { size: 46, font: 'Anton', fill: T.white });
  }
  present({ cell: 5.6 });
}
ev(SH.s3 + .38, 'cut'); ev(part('v03_a').t + .2, 'print'); ev(part('v03_a').t + .4, 'print', { v: .8 });
for (let i = 0; i < 9; i++) ev(part('v03_a').t + 1.15 + i * .07, 'tick', { v: .5 });
ev(SH.s4, 'pan', { d: 2.8 });
for (let k = 1; k < 6; k++) ev(part('v03_b').t - .1 + k * .55, 'grow', { pan: -.3 + k * .15 });

// GM row world: five old prints of the Gros Michel
const GX = k => k * 640;
function gmTile(k, t, rot) {
  pop.save(); pop.translate(GX(k), 0);
  pop.fill(rectPts(-300, -300, 600, 600), T.red);
  pop.fill(ellipsePts(0, -10, 236, 236, 72), { y: .38 });
  pop.save(); pop.rotate(-.3); pop.translate(0, 26); pop.scale(1.12); banana(pop, { ...VAR.gros, mis: [8 + k, -6], lw: 8 }); pop.restore();
  pop.text('GROS MICHEL', 0, 248, { size: 44, font: 'Archivo', fill: T.white, letter: 3 });
  if (rot > 0) {   // rot dots climbing from the soil: the deeper, the bigger the dots
    const front = 300 - rot * 760;
    for (let b = 0; b < 34; b++) {
      const y0 = -300 + b * 600 / 34, y1 = y0 + 600 / 34 + 1, ym = (y0 + y1) / 2;
      const d = clamp((ym - front) / 330) * .96; if (d <= .01) continue;
      pop.over(rectPts(-300, y0, 600, y1 - y0), { r: d, b: d * .92 });
    }
  }
  pop.line(rectPts(-300, -300, 600, 600), 6, { taper: 0, closed: true });
  pop.restore();
}
const rotK = (k, t) => seg(t, SH.s6 + .8 + k * .5, SH.s6 + .8 + k * .5 + 2.3);

// S5: 1950s sheet with a hole in the 0 → the old print;  S6: the row rots;  S7 head: push into the last one
function shotGM(t) {
  let cam;
  if (t < SH.s6) cam = { x: GX(2), y: 0, zoom: lerp(1.62, 1.86, seg(t, SH.s5, SH.s6)), rot: 0 };
  else if (t < SH.s7) { const a = eio(seg(t, SH.s6, SH.s6 + 1.6)); cam = { x: GX(2), y: lerp(0, 40, a), zoom: Math.exp(lerp(Math.log(1.86), Math.log(.56), a)), rot: lerp(0, .02, a) }; }
  else { const a = eio(seg(t, SH.s7, SH.s7 + .7)); cam = { x: lerp(GX(2), GX(4), a), y: lerp(40, 0, a), zoom: Math.exp(lerp(Math.log(.56), Math.log(3.4), a)), rot: lerp(.02, 0, a) }; }
  pop.begin(cam, { desk: null });
  pop.fill(rectPts(-2000, -1500, 7000, 3000), T.white);
  for (let k = 0; k < 5; k++) gmTile(k, t, rotK(k, t));
  // the 1950s sheet (screen space), with the counter of its 0 cut out
  const z = Math.exp(lerp(0, Math.log(34), ei(seg(t, SH.s5 + 1.5, SH.s5 + 2.75))));
  if (z < 33) screen(() => {
    const ox = 1180, oy = 470, slam = 1 + .25 * (1 - eo(seg(t, SH.s5, SH.s5 + .16)));
    const m = new DOMMatrix().translate(ox, oy).scale(z * slam).translate(-ox, -oy);
    [pop.P, pop.L, pop.S].forEach(c => c.setTransform(m));
    const mc = pop.L; mc.save(); mc.font = '520px Anton'; mc.textBaseline = 'middle'; const mm = mc.measureText('0'); mc.restore();
    const gh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent, gw = mm.width * .9, gcy = oy + 4 + (mm.actualBoundingBoxDescent - mm.actualBoundingBoxAscent) / 2;
    const cw = gw * .42, ch = gh - gw * .58;
    const hole = (x, y, w, h) => { const p = new Path2D(); p.roundRect(x - w / 2, y - h / 2, w, h, w / 2); return p; };
    const sheet = new Path2D(); sheet.rect(-4000, -4000, 9920, 9080); sheet.addPath(hole(ox, gcy, cw, ch));
    const paint = (p2, inkD, rule) => {
      pop.P.fillStyle = dens(inkD); pop.P.fill(p2, rule);
      pop.L.save(); pop.L.globalCompositeOperation = 'destination-out'; pop.L.fill(p2, rule); pop.L.restore();
      pop.S.save(); pop.S.globalCompositeOperation = 'destination-out'; pop.S.fill(p2, rule); pop.S.restore();
    };
    paint(sheet, T.yellow, 'evenodd');
    // red offset plate of the 0 ring, then the black ring
    const ring = new Path2D(); ring.addPath(hole(ox + 16, gcy + 16, gw, gh)); ring.addPath(hole(ox + 16, gcy + 16, cw, ch));
    pop.P.fillStyle = dens(T.red); pop.P.fill(ring, 'evenodd');
    const ringK = new Path2D(); ringK.addPath(hole(ox, gcy, gw, gh)); ringK.addPath(hole(ox, gcy, cw, ch));
    pop.L.fillStyle = '#000'; pop.L.fill(ringK, 'evenodd');
    pop.readBox('type:1950s', '1950s', ox, gcy, { size: 520, font: 'Anton' });
    pop.text('195', ox - gw / 2 - 12, oy + 4, { size: 520, font: 'Anton', align: 'right', shadow: { dx: 16, dy: 16, ink: T.red, steps: 1 } });
    pop.text('s', ox + gw / 2 + 12, oy + 4, { size: 520, font: 'Anton', align: 'left', shadow: { dx: 16, dy: 16, ink: T.red, steps: 1 } });
  });
  // labels (screen space)
  screen(() => {
    const t1 = part('v04_b').t - .5;
    label(110 + exitX(t, SH.s6 + 1.4), 640, [{ s: 'GROS MICHEL', size: 108, font: 'Archivo' }, { s: '大麦克 · THE OLD BANANA', size: 44, font: 'Archivo, NotoSC' }], lab(t, t1, SH.s6 + 1.4), { rot: -.03 });
    label(110 + exitX(t, SH.s7 - .2), 90, [{ s: 'PANAMA DISEASE', size: 104, ink: T.red }, { s: '巴拿马病', size: 48, font: 'NotoSC' }], lab(t, SH.s6 + 1.2, SH.s7 - .2), { rot: .02 });
  });
  const age = .42;
  present({ cell: 5.6, age, off: [[0, 0], [2.2, -1.4], [-1.6, 2]], offMax: 8 });
}
ev(SH.s5, 'slam'); ev(SH.s5 + 1.5, 'dive', { d: 1.25 }); ev(part('v04_b').t - .5, 'print');
ev(SH.s6, 'pull', { d: 1.6 }); ev(SH.s6 + 1.2, 'print'); ev(SH.s6 + .8, 'rot', { d: 4.8 }); ev(SH.s7, 'dive', { d: .7 });

// S7: the flip to Cavendish (same frame size), plates printed one by one, then the wall again
const FLIP = SH.s7 + .7;
function shotCav(t) {
  const a = eio(seg(t, FLIP + 1.25, FLIP + 2.3));
  const b = eio(seg(t, SH.s8, SH.s8 + 1.5)), c = seg(t, SH.s8 + 1.5, SH.hush);
  let cam;
  if (t < SH.s8) cam = { x: 0, y: 0, zoom: Math.exp(lerp(Math.log(3.4), Math.log(1.75), a)), rot: 0 };
  else cam = { x: lerp(0, 300, b), y: lerp(0, 150, b), zoom: Math.exp(lerp(Math.log(1.75), Math.log(.43), b)) * (1 + .12 * ss(c)), rot: lerp(0, .03, b) };
  const p = seg(t, FLIP, FLIP + .36);
  pop.begin(cam, { desk: null });
  // rot front: red dots crossing the wall from the left (TR4)
  const fr = lerp(-2700, 4200, ss(seg(t, SH.s8 + .7, SH.hush - .8)));
  const rot = t > SH.s8 + 1.0 ? (i0, i1, j0, j1) => {
    const x0 = (i0 - .5) * TS, x1 = (i1 + .5) * TS, y0 = (j0 - .5) * TS, y1 = (j1 + .5) * TS;
    const step = 90;
    for (let x = Math.max(x0, fr - 2600); x < Math.min(x1, fr); x += step) {
      const d = clamp((fr - x) / 2400) * .9; if (d < .02) continue;
      pop.over(rectPts(x, y0, step + 1, y1 - y0), { r: d, b: d * .8 });
    }
    if (x0 < fr - 2600) pop.over(rectPts(x0, y0, Math.min(x1, fr - 2600) - x0, y1 - y0), { r: .9, b: .72 });
  } : null;
  if (p < 1) {
    const sx = Math.abs(Math.cos(p * Math.PI));
    pop.save(); pop.scale(Math.max(.02, sx), 1);
    if (p < .5) { pop.translate(-GX(4), 0); gmTile(4, t, 1); }
    else cloneTile(0, 0);
    pop.restore();
  } else drawWall(t, cam, rot);
  // the RESISTANT stamp on the first print (page space): the rot will cover it later
  const st = seg(t, part('v06_a').t + 2.75, part('v06_a').t + 2.9);
  if (st > 0) {
    pop.save(); pop.translate(150, -190); pop.rotate(-.2); const s = 1 + .5 * (1 - eo(st)); pop.scale(s);
    pop.fill(pop.ribbon([[-150, 0], [150, 0]], 112, { taper: 0, tmin: 1 }), T.white);
    pop.text('RESISTANT', 0, -10, { size: 74, font: 'Anton', fill: T.red, read: 'stamp:RESISTANT' });
    pop.text('抗病', 0, 34, { size: 30, font: 'NotoSC', fill: T.red, read: 'stamp:抗病' });
    pop.line(rectPts(-150, -56, 300, 112), 6, { taper: 0, closed: true });
    pop.restore();
  }
  screen(() => {
    label(96 + exitX(t, SH.s8 + .2), 90, [{ s: 'CAVENDISH', size: 124 }, { s: '香芽蕉', size: 48, font: 'NotoSC' }], lab(t, FLIP + .9, SH.s8 + .2), { rot: -.025, shadowInk: T.blue });
    const t7 = part('v07_a').t + 1.2;
    label(96 + exitX(t, part('v08_a').t - .15), 80, [{ s: 'TROPICAL RACE 4', size: 112, ink: T.red }, { s: '热带 4 号小种', size: 48, font: 'Archivo, NotoSC' }], lab(t, t7, part('v08_a').t - .15), { rot: .02 });
    label(96, 80, [{ s: '2019 → COLOMBIA', size: 112, ink: T.red }, { s: '哥伦比亚', size: 48, font: 'NotoSC' }], lab(t, part('v08_a').t + .1, 99), { rot: -.02 });
  });
  // plates arrive one by one after the flip: yellow, red, blue, black
  const pl = k => t >= FLIP + .18 + k * .13 ? 1 : 0;
  const mask = t < FLIP + .18 ? [1, 1, 1, 1] : [pl(0), pl(1), pl(2), pl(3)];
  const settle = seg(t, FLIP + .18, FLIP + .9);
  present({ cell: 5.6, mask, off: [[0, 0], [lerp(30, 1.2, eo(settle)), lerp(-22, -.8, eo(settle))], [lerp(-26, -1, eo(settle)), lerp(18, 1, eo(settle))]], offMax: 40 });
}
ev(FLIP, 'flip', { v: 1.3 }); for (let k = 1; k < 4; k++) ev(FLIP + .18 + k * .13, 'plate', { k });
ev(FLIP + .9, 'print'); ev(part('v06_a').t + 2.75, 'stampbig');
ev(SH.s8, 'pull', { d: 1.5 }); ev(SH.s8 + 1.0, 'rot', { d: SH.hush - SH.s8 - 1.3 });
ev(part('v07_a').t + 1.2, 'print'); ev(part('v08_a').t + .1, 'print');

// S9 + S10: the wave of colour, then the giant
function shotMany(t) {
  const a = eio(seg(t, SH.s9 + .25, SH.s10)), b = eio(seg(t, SH.s10, SH.card + .4));
  const z0 = .43 * 1.12;
  const cam = t < SH.s10
    ? { x: lerp(300, 600, a), y: lerp(150, 100, a), zoom: Math.exp(lerp(Math.log(z0), Math.log(.19), a)), rot: lerp(.03, 0, a) }
    : { x: lerp(600, 0, b), y: lerp(100, 0, b), zoom: Math.exp(lerp(Math.log(.19), Math.log(.0855), b)), rot: 0 };
  pop.begin(cam, { desk: null });
  // the rot stays on the clones that have not flipped yet
  const fr = 4200;
  drawWall(t, cam, (i0, i1, j0, j1) => {
    const x0 = (i0 - .5) * TS, x1 = (i1 + .5) * TS, y0 = (j0 - .5) * TS, y1 = (j1 + .5) * TS;
    for (let x = Math.max(x0, fr - 2600); x < Math.min(x1, fr); x += 90) {
      const d = clamp((fr - x) / 2400) * .9; if (d < .02) continue;
      pop.over(rectPts(x, y0, 91, y1 - y0), { r: d, b: d * .8 });
    }
    // beyond the front the wall is fully dark
    if (x0 < fr - 2600) pop.over(rectPts(x0, y0, Math.min(x1, fr - 2600) - x0, y1 - y0), { r: .9, b: .72 });
  });
  // the giant's key line draws itself round the mosaic, along the cell edges (so it sits exactly on the coloured cells)
  const g = seg(t, SH.s10 + 1.1, SH.s10 + 2.7);
  if (g > 0) {
    const m = Math.max(1, Math.floor(G_EDGES.length * eio(g))), hw = 60;
    for (let q = 0; q < m; q++) {
      const [x0, y0, x1, y1] = G_EDGES[q];
      pop.black(rectPts(Math.min(x0, x1) - hw, Math.min(y0, y1) - hw, Math.abs(x1 - x0) + hw * 2, Math.abs(y1 - y0) + hw * 2));
    }
  }
  screen(() => {
    label(96 + exitX(t, SH.s10 + .45), 80, [{ s: '1,000+', size: 190, ink: T.red, lh: 1.02 }, { s: 'KINDS OF BANANA', size: 64 }, { s: '一千多种香蕉', size: 50, font: 'NotoSC' }], lab(t, part('v09_a').t + .4, SH.s10 + .45), { rot: -.03, shadowInk: T.blue, instant: true });
    // the end card: title, style, sign-off
    const cp = seg(t, SH.card, SH.card + .6);
    if (cp > 0) label(92, 74, [{ s: 'MANY BANANAS', size: 132, ink: T.red, lh: 1.02 }, { s: '不止一种香蕉', size: 56, font: 'NotoSC' },
      { s: 'POP ART · 波普艺术', size: 38, font: 'Archivo, NotoSC', ink: T.blue }, { s: 'LemoLab × Claude Opus 5.5', size: 34, font: 'Archivo' }], cp, { rot: -.025, padX: 40, padY: 28, gap: 12, instant: true });
  });
  present({ cell: 5.6 });
}
ev(part('v09_a').t + .4, 'print'); ev(SH.s10, 'pull', { d: 3.4 }); ev(SH.s10 + 1.1, 'draw', { d: 1.6 }); ev(SH.card, 'print', { v: 1.2 }); ev(SH.card + .5, 'end');

// ---------------------------------------------------------------- render ----
window.EV = EV.sort((a, b) => a.t - b.t);
window.render = (t) => {
  if (t < SH.s3 + .38) shotWall(t);
  else if (t < SH.s5) shotStrip(t);
  else if (t < FLIP + .36 * .5) shotGM(t);
  else if (t < SH.s9) shotCav(t);
  else shotMany(t);
  // subtitles + 10 s sign-off, on top, screen space (a second print pass would cost a frame: draw into the same plates)
};
// subtitles are printed in the same pass: wrap present()
const _present = pop.present;
pop.present = (fx) => {
  const t = window.__t ?? 0;
  screen(() => {
    if (!Q.has('nosubs')) subtitle(t);                 // ?nosubs=1: poster and gallery frames without the subtitle slip
    if (SIGN10 && t >= 7.5) label(1868, 52, [{ s: 'LemoLab × Claude Opus 5.5', size: 30, font: 'Archivo' }, { s: 'POP ART · 波普艺术', size: 30, font: 'Archivo, NotoSC', ink: T.red }], seg(t, 7.5, 8.0), { align: 'right', padX: 24, padY: 14, gap: 6, shadow: 8, lw: 4 });
  });
  _present(fx);
};
const _render = window.render;
const FROM = +(Q.get('from') ?? 0), TO = Q.has('to') ? +Q.get('to') : TL.dur;   // render a span of the one timeline (the 10 s cut)
window.DUR = TO - FROM;
window.render = (t) => { t += FROM; window.__t = t; _render(t); };
// every readable text on screen at t (labels, headlines, stamps; not the subtitles, not the decorative tile captions)
window.TEXTS = () => pop.reads.slice();
window.READY = true;
