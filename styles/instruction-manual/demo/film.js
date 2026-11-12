// film.js — "Step Ten", the whole film on one long instruction sheet.
// Ten steps sit on one page in a snake (row 1: 1→4, row 2: 5←8, row 3: 9→10, then the footer). The camera only pans,
// zooms and cuts over that page; the drawing angle never changes (true isometric, 45°). window.render(t) draws second t.
import { PAL, makeView, setLW, LW, setGhost, setFillOverride, box, cyl, blob, poly3, dashed3, dashed, planeArrow, turnArrow, arrow2, cross, tick,
  roundRect, clickMark, add3, sub3, mul3, norm3, cross3, rotAbout, shape, path } from './iso.js';
import { person, mixPose, rot } from './rig.js';
import { stand, handsOnHips, scratch, read, kneel, leanOn, sitCross, lp } from './poses.js';
import { C, endPanel, sidePanel, base, bolt, crib, S as ST, flipL, BASE_Y, mattress, MAT_Y, MAT_T } from './crib.js';
import { FONT, magnifier } from './page.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = (t) => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = (t) => 1 - Math.pow(1 - clamp(t), 3);
const ei = (t) => Math.pow(clamp(t), 3);
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const W = 1920, H = 1080;

export let TL = null;
export async function loadTimeline() { TL = await (await fetch('timeline.json')).json(); return TL; }
const word = (id, i) => TL.words[id][i][1];

// ---------------- the page ----------------
const CW = 2000, CH = 1150, GX = 240, GY = 380;
const SLOT = { 1: [0, 0], 2: [1, 0], 3: [2, 0], 4: [3, 0], 5: [3, 1], 6: [2, 1], 7: [1, 1], 8: [0, 1], 9: [0, 2], 10: [1, 2] };
const cellO = (k) => [SLOT[k][0] * (CW + GX), SLOT[k][1] * (CH + GY)];
const FOOT = [2 * (CW + GX), 2 * (CH + GY)];
const PAGE = { w: 4 * CW + 3 * GX, h: 3 * CH + 2 * GY };
const pc = (k, x, y) => { const [ox, oy] = cellO(k); return [ox + x, oy + y]; };

// ---------------- times (s) ----------------
export const T = {};
function times() {
  Object.assign(T, {
    land: .62, num1: 4.6, lid: 1.55, parts: 2.2, people: 6.5, callout: 7.7, point: 8.5,
    whip: 10.0, whipEnd: 10.7, push: 14.2, portal: 15.0, walk0: 15.5, walk1: 17.5,
    pan5: 17.75, pan5End: 18.75, bolts: 18.85, mag: 19.55, turn0: 20.3, turn1: 21.5, click: word('e', 5) + .32, dive: 22.25, cut7: 23.2,
    pull7: 25.3, x7: word('f', 9) + .04,
    beat1: 28.8, beat2: word('g', 2) + .42, beat3: word('g', 4) + .3, flipLand: 32.05, s9: 32.5, s9End: 33.1, s10: 37.0, s10End: 37.6,
    num10: 37.85, grow0: 38.05, grow1: 40.85, fill: 41.15, push10: 41.0, out0: 44.6, out1: 47.1, title: 46.5, card: 47.3,
  });
  T.dur = TL.dur;
}

// ---------------- camera ----------------
// keys: {t, c:[x,y], z}. Between keys the zoom runs in log space and the centre moves so a point being zoomed into
// stays where it is on screen until the end (w ∝ 1/z), which is how a camera pushing into a detail feels.
function camLerp(a, b, k) {
  const z = a.z * Math.pow(b.z / a.z, k);
  let w = k;
  if (Math.abs(Math.log(b.z / a.z)) > .05) w = (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return { x: lerp(a.c[0], b.c[0], w), y: lerp(a.c[1], b.c[1], w), z };
}
let KEYS = null, PORTAL = null;
const BOX4 = { x: 1270, y: 470, w: 600, h: 330 };               // do / don't box in step 4 (cell coords)
const MAIN4 = { ax: 800, ay: 360, s: 2.8, zc: 205 };           // step 4's main drawing
const MINI4 = () => ({ ax: BOX4.x + BOX4.w / 2 + 128, ay: BOX4.y + 196, s: 1.0 });
const MAG5 = { ax: 640, ay: 560, s: 4.0, mx: 1480, my: 390, r: 250, zs: 15, bx: -80, by: 10 };
function buildKeys() {
  const K = (t, c, z, e = eio) => ({ t, c, z, e });
  const m4 = MINI4(), boxC = pc(4, BOX4.x + BOX4.w / 2, BOX4.y + BOX4.h / 2 + 10);
  const tickC = pc(4, BOX4.x + BOX4.w * .75, BOX4.y + BOX4.h / 2);
  // portal: the ✓ half fills the frame at z = zP; the main drawing replaces it at the same screen transform
  const zP = 7.4, camP = { c: tickC, z: zP };
  const pA = pc(4, m4.ax, m4.ay), sA = [(pA[0] - camP.c[0]) * zP + W / 2, (pA[1] - camP.c[1]) * zP + H / 2];
  const v0 = makeView({ cx: 0, cy: 0, s: 1 }), off = v0.P([0, 0, MAIN4.zc]);
  const mainA = pc(4, MAIN4.ax + MAIN4.s * off[0], MAIN4.ay + MAIN4.s * off[1]);   // where the zc=0 pair would sit in the main drawing
  const z2 = zP * MINI4().s / MAIN4.s, c2 = [mainA[0] - (sA[0] - W / 2) / z2, mainA[1] - (sA[1] - H / 2) / z2];
  PORTAL = { zP, z2, c2 };
  // dive into the step-5 magnifier: the bolt head inside it
  const boltIn = pc(5, MAG5.mx + MAG5.bx, MAG5.my + MAG5.by);
  // match cut: the knob of the upside-down end, on the floor in step 7
  const v7 = makeView({ cx: 0, cy: 0, s: S7.s }), kn = v7.P(knob7()), knobP = pc(7, S7.ax + kn[0], S7.ay + kn[1]);
  const sitP = v7.P([LAUGH.at[0], 60, LAUGH.at[1]]), laughC = pc(7, S7.ax + sitP[0] - 30, S7.ay + sitP[1] + 85);
  const zK = 7.6 * 1.05 * MAG5.zs / (2.1 * S7.s);
  KEYS = [
    K(0, pc(1, 470, 880), 2.15), K(1.6, pc(1, 480, 860), 2.05, ss), K(6.3, pc(1, 780, 590), 1.06),
    K(6.4, pc(1, 790, 590), 1.06, ss), K(8.3, pc(1, 960, 600), 1.0), K(T.whip, pc(1, 990, 600), .99, ss),
    K(T.whipEnd, boxC, 2.1), K(T.push, boxC, 2.16, ss),
    K(T.portal, tickC, zP, ei),
    // (after the portal the camera is re-based on the main drawing: see cam())
    K(T.portal + 1e-3, c2, z2, ss), K(16.3, pc(4, 760, 560), 1.0), K(T.pan5, pc(4, 720, 580), .97, ss),
    K(T.pan5End, pc(5, 980, 560), 1.0), K(T.dive, pc(5, 990, 560), 1.04, ss),
    K(T.cut7 - 1e-3, boltIn, 7.6, ei),
    K(T.cut7, knobP, zK, ss), K(T.pull7, pc(7, 960, 600), 1.0, eo), K(T.beat1 - 1e-3, pc(7, 950, 600), 1.04, ss),
    K(T.beat1, pc(7, 960, 560), .95, ss), K(T.beat2 - 1e-3, pc(7, 950, 560), .99, ss),
    K(T.beat2, laughC, 2.0, ss), K(T.beat3 - 1e-3, [laughC[0] - 10, laughC[1]], 2.08, ss),
    K(T.beat3, pc(8, 820, 560), 1.58, ss), K(T.s9 - 1e-3, pc(8, 820, 565), 1.64, ss),
    K(T.s9End, pc(9, 1000, 600), .95, eio), K(T.s10, pc(9, 1000, 600), 1.1, ss),
    K(T.s10End, pc(10, 980, 575), 1.0, eio), K(T.push10, pc(10, 980, 575), 1.0, ss), K(T.out0, pc(10, 1000, 565), 1.09, ss),
    K(T.out1, [PAGE.w / 2, PAGE.h / 2 + 40], Math.min(W / (PAGE.w + 560), H / (PAGE.h + 440)), eio),
    K(T.dur, [PAGE.w / 2, PAGE.h / 2 + 40], Math.min(W / (PAGE.w + 560), H / (PAGE.h + 440)) * 1.035, ss),
  ];
}
export function cam(t) {
  let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  if (t <= a.t) return { x: a.c[0], y: a.c[1], z: a.z };
  const k = b.e(seg(t, a.t, b.t));
  return camLerp(a, b, k);
}

// ---------------- cell context ----------------
function ctx(k, cm) {
  const [ox, oy] = k === 'foot' ? FOOT : cellO(k), z = cm.z;
  const Tf = (x, y) => [(ox + x - cm.x) * z + W / 2, (oy + y - cm.y) * z + H / 2];
  return { k, ox, oy, z, T: Tf, V: (x, y, s) => { const p = Tf(x, y); return makeView({ cx: p[0], cy: p[1], s: s * z }); } };
}
const lwFor = (z) => clamp(2.6 * Math.pow(z, .55), .7, 6.5);
const NEU = (t) => (t < 44 ? PAL.neu : PAL.part);   // every new part is white again by the time the whole page is seen
function mixPal(a, b, k) {   // flat colours only: blend two palettes
  const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)), o = {};
  for (const key of ['top', 'z', 'x']) { const p = h(a[key]), q = h(b[key]); o[key] = '#' + p.map((v, i) => Math.round(v + (q[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
  return o;
}
// window.TEXTS(t) for core/render/readcheck.mjs: every printed word on the page drawn in the last render(t), with its screen box.
// Only records; it changes nothing in the picture. Subtitles are left out (their hold is set by the .srt).
let TXT = new Map(), REC = true;
function note(g, id, text, x, y) {
  if (!REC || g.globalAlpha < .5) return;
  const m = g.measureText(text), w = m.width, a = m.actualBoundingBoxAscent || 0, d = m.actualBoundingBoxDescent || 0;
  TXT.set(id, { id, text, x0: x, y0: y - a, x1: x + w, y1: y + d });
}
export const texts = () => [...TXT.values()];
function stepNum(g, c, n, x = 96, y = 214, o = {}) {
  const [sx, sy] = c.T(x, y), z = c.z, k = o.k ?? 1;
  if (k <= 0) return;
  g.save(); g.fillStyle = PAL.ink; g.font = `700 ${150 * z}px ${FONT.num}`; g.textBaseline = 'alphabetic';
  if (k < 1) { const s = 1 + .35 * (1 - eo(k)); g.globalAlpha = clamp(k * 3); g.translate(sx + 45 * z, sy - 55 * z); g.scale(s, s); g.translate(-sx - 45 * z, -sy + 55 * z); }
  g.fillText(String(n), sx, sy); note(g, 'step' + n, String(n), sx, sy); g.restore();
}
function rrect(g, c, x, y, w, h, r, fill, k = 1) {
  if (k <= 0) return; const [sx, sy] = c.T(x, y), z = c.z;
  g.save(); if (k < 1) { const s = .85 + .15 * back(k); g.globalAlpha = clamp(k * 2.5); g.translate(sx + w * z / 2, sy + h * z / 2); g.scale(s, s); g.translate(-sx - w * z / 2, -sy - h * z / 2); }
  roundRect(g, sx, sy, w * z, h * z, r * z, fill, LW); g.restore();
}
function label(g, c, txt, x, y, size = 34, k = 1, weight = 600) {
  if (k <= 0) return; const [sx, sy] = c.T(x, y);
  g.save(); g.globalAlpha = clamp(k); g.fillStyle = PAL.ink; g.font = `${weight} ${size * c.z}px ${FONT.num}`; g.fillText(txt, sx, sy); note(g, c.k + ':' + txt + ':' + x + ',' + y, txt, sx, sy); g.restore();
}


// A whole drawing appears in two passes over the same frame: first its complete line art (fills painted as paper) fades in,
// then the coloured drawing fades in over it. At no moment is a part drawn floating or half-built.
let LAY = null;
function appear(g, t0, fn, dLine = .45, dFill = .5) {
  const a = seg(SUBT, t0, t0 + dLine), b = seg(SUBT, t0 + dLine * .8, t0 + dLine * .8 + dFill);
  if (a <= 0) return;
  if (b >= 1) { fn(g); return; }
  if (!LAY) { LAY = document.createElement('canvas'); LAY.width = W; LAY.height = H; }
  const lg = LAY.getContext('2d');
  lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H); setFillOverride(PAL.paper); fn(lg); setFillOverride(null);
  g.save(); g.globalAlpha = ss(a); g.drawImage(LAY, 0, 0); g.restore();
  if (b > 0) { lg.clearRect(0, 0, W, H); fn(lg); g.save(); g.globalAlpha = ss(b); g.drawImage(LAY, 0, 0); g.restore(); }
}
let SUBT = 0;

// ---------------- small drawings ----------------
function boltIcon(v, p) { bolt(v, p, PAL.metal, { lw: LW * .9, len: 7 }); }
function keyIcon(v, p, lw = LW * .9) { cyl(v, p, add3(p, [3.6, 0, 0]), .34, PAL.metal, { lw }); cyl(v, add3(p, [3.6, 0, 0]), add3(p, [3.6, 0, 9]), .34, PAL.metal, { lw }); }
function moonIcon(g, x, y, r) {
  // a crescent: the outer circle minus a circle shifted up and right, filled white and inked
  const ox = r * .48, oy = -r * .3, R2 = r * .84, d = Math.hypot(ox, oy);
  const th = Math.acos(clamp((r * r + d * d - R2 * R2) / (2 * r * d), -1, 1)), b0 = Math.atan2(oy, ox);
  const P = [x + r * Math.cos(b0 + th), y + r * Math.sin(b0 + th)], Q = [x + r * Math.cos(b0 - th), y + r * Math.sin(b0 - th)];
  const ang = (p) => Math.atan2(p[1] - (y + oy), p[0] - (x + ox));
  g.save(); g.beginPath(); g.arc(x, y, r, b0 + th, b0 - th + Math.PI * 2); g.arc(x + ox, y + oy, R2, ang(Q), ang(P), true); g.closePath();
  g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = LW; g.strokeStyle = PAL.ink; g.lineJoin = 'round'; g.stroke(); g.restore();
}
function booklet(v, sk, open = 1) {
  // an open booklet held by both palms, tilted up toward the reader's face
  const c = mul3(add3(sk.arms[0].palm, sk.arms[1].palm), .5), L = norm3(sub3(sk.arms[0].palm, sk.arms[1].palm));
  const Dn = norm3(add3(mul3(sk.cF, .55), mul3(sk.cY, .83))), N = cross3(L, Dn);
  const P = (a, b, h = 0) => add3(c, add3(add3(mul3(L, a), mul3(Dn, b)), mul3(N, h)));
  const pg = (s) => [P(0, -11, 0), P(s * 16 * open + 0, -11, 1.5 * open), P(s * 16 * open, 11, 1.5 * open), P(0, 11, 0)];
  const d = v.depth(c) + 6;
  poly3(v, pg(1), '#FFFFFF', { depth: d }); poly3(v, pg(-1), '#FFFFFF', { depth: d + .01 });
  // a few printed lines on the pages
  v.add(d + .02, (g) => { g.save(); g.strokeStyle = PAL.grey2; g.lineWidth = Math.max(.6, LW * .45); for (const s of [1, -1]) for (let i = 0; i < 3; i++) { const a = v.P(P(s * 4, -6 + i * 5, .6)), b = v.P(P(s * 12, -6 + i * 5, 1.2)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } g.restore(); });
}

// ---------------- step 1: the flat box, the parts, two people ----------------
// The box holds every part, lying flat in a stack (bottom to top: mattress, base board, two rails, two end panels; the bolts and
// the key in a small bag on the rails, beside the end panels). Top first, each part lifts out of its own place, turns upright on the
// way and lands on its spot in the inventory; its dotted line runs exactly along that flight, from where it lay to where it lands.
const BOXW = { x: 120, z: 70, y: 31 };
const PARTS1 = {   // name: [count, landing (cell coords), scale, label position]
  end: ['2×', [600, 360], 2.7, [400, 400]], rail: ['2×', [980, 330], 2.5, [770, 330]], base: ['1×', [1010, 600], 2.5, [790, 650]],
  mattress: ['1×', [1060, 800], 2.4, [830, 850]], bolt: ['8×', [1360, 250], 6.5, [1230, 262]], key: ['1×', [1360, 430], 6.5, [1230, 440]],
};
// local centre c of each part as drawPart draws it, the axis and angle that lay it flat, and its centre wc in the box at layer yl
const LIE = {
  end: { c: [2.5, 46, 0], ax: [0, 0, 1], a: -Math.PI / 2, wc: (yl) => [50, yl + 2.5, 35] },
  rail: { c: [0, 29.5, 1.5], ax: [1, 0, 0], a: Math.PI / 2, wc: (yl) => [60, yl + 1.5, 34.5] },
  base: { c: [0, 0, 0], wc: (yl) => [60, yl + 1, 35] },
  mattress: { c: [0, MAT_T / 2, 0], wc: (yl) => [60, yl + MAT_T / 2, 35] },
  bolt: { c: [0, 0, 0], wc: () => [106, 21.6, 13] },
  key: { c: [0, 0, 0], wc: () => [107, 21.6, 25] },
};
const INST = [   // one entry per part in the box, in the order they come out
  { name: 'end', t: 2.2, yl: 24 }, { name: 'end', t: 2.34, yl: 19 }, { name: 'bolt', t: 2.62 }, { name: 'key', t: 2.8 },
  { name: 'rail', t: 3.05, yl: 16 }, { name: 'rail', t: 3.19, yl: 13 }, { name: 'base', t: 3.5, yl: 11 }, { name: 'mattress', t: 3.9, yl: 1 },
];
const FLY = .85;
function drawPart(v, name, pal = PAL.part, xf = null) {
  const o = xf ? { xf } : {};
  if (name === 'end') endPanel(v, 0, [0, 0, -33], pal, o);
  if (name === 'rail') sidePanel(v, 0, [-62, -23, 0], pal, o);
  if (name === 'base') base(v, [-62, -30, -33], pal, { bias: 0, ...o });
  if (name === 'mattress') mattress(v, [-62, -MAT_Y, -33], undefined, o);
  if (name === 'bolt') bolt(v, [-4, 0, 0], PAL.metal, { len: 7, lw: LW });
  if (name === 'key') keyIcon(v, [-2, 0, -4.5], LW);
}
const V1 = makeView({ cx: 0, cy: 0, s: 1 });
function lyingXf(name, wc, ang) {   // part-local → its pose turned by ang toward flat, centred on wc
  const L = LIE[name], r = L.ax ? rotAbout(L.c, L.ax, ang) : (p) => p;
  return (p) => add3(sub3(r(p), L.c), wc);
}
function step1(g, c, t) {
  const bk = seg(t, .12, T.land);
  const drop = bk < 1 ? 160 * (1 - bk * bk) : 9 * Math.max(0, Math.sin(seg(t, T.land, T.land + .28) * Math.PI)) * (1 - seg(t, T.land, T.land + .28));
  const boxA = [400, 860];
  if (t > .12) {
    const v = c.V(boxA[0], boxA[1] - drop, 2.4), th = 1.1, X = BOXW.x, Z = BOXW.z, Y = BOXW.y;
    const ang = -118 * D2R * eio(seg(t, T.lid, T.lid + .55)), open = ang < -55 * D2R;
    const lid = () => box(v, [0, Y, 0], [X, Y + 1.2, Z], PAL.part, { xf: rotAbout([0, Y, 0], [1, 0, 0], ang) });
    // far walls and the floor of the box (and the lid once it is folded back), then the stack, layer by layer, then the near walls
    box(v, [0, 0, 0], [X, 1, Z]); box(v, [0, 0, 0], [X, Y, th]); box(v, [0, 0, 0], [th, Y, Z]); if (open) lid(); v.flush(g);
    const bagGone = t >= INST.find((i) => i.name === 'key').t;
    for (const it of [...INST].reverse()) {
      if (t >= it.t) continue;
      const L = LIE[it.name], wc = L.wc(it.yl);
      if (it.name === 'bolt' || it.name === 'key') continue;
      drawPart(v, it.name, PAL.part, lyingXf(it.name, wc, L.a || 0)); v.flush(g);
    }
    if (!bagGone) {   // the little bag of bolts with the key on it
      box(v, [99, 19, 4], [115, 21, 34], { top: '#FBF9F4', z: '#F1EEE7', x: '#E4E0D6' }, { bias: 0 }); v.flush(g);
      for (const nm of ['bolt', 'key']) { const it = INST.find((i) => i.name === nm); if (t < it.t) { drawPart(v, nm, PAL.part, lyingXf(nm, LIE[nm].wc(), 0)); } }
      v.flush(g);
    }
    box(v, [X - th, 0, 0], [X, Y, Z]); box(v, [0, 0, Z - th], [X, Y, Z]);
    // a printed pictogram on the box side: the crib's outline, so the box says what is inside
    v.add(2e5, (g) => {
      const q = (x, y) => v.P([X, y, x]); g.save(); g.strokeStyle = PAL.ink; g.lineWidth = LW * .6; g.lineJoin = 'round';
      const pts = [[18, 8], [18, 23], [52, 23], [52, 8]]; g.beginPath(); pts.forEach((p, i) => { const s = q(p[0], p[1]); i ? g.lineTo(...s) : g.moveTo(...s); }); g.stroke();
      for (let i = 0; i < 6; i++) { const a = q(22 + i * 5.5, 10), b = q(22 + i * 5.5, 21); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
      g.restore();
    });
    if (!open) lid();
    v.flush(g);
  }
  // each part flies out along its own dotted line and lands on its spot
  const lineFade = 1 - seg(t, 5.7, 6.3);
  const landed = {};
  for (const it of INST) {
    const k = seg(t, it.t, it.t + FLY); if (k <= 0) continue;
    const [n, to, sc] = PARTS1[it.name], L = LIE[it.name], e = eio(k);
    const from = add3([boxA[0], boxA[1], 0], mul3(V1.P(L.wc(it.yl)), 2.4)).slice(0, 2);
    const pos = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)], s_ = lerp(2.4, sc, e);
    if (lineFade > 0) { g.save(); g.globalAlpha = lineFade; dashed(g, c.T(...from), c.T(...pos), { lw: Math.max(1, LW * .8), dash: [2 * c.z ** .5, 9 * c.z ** .5] }); g.restore(); }
    const cc = V1.P(L.c), v = c.V(pos[0] - s_ * cc[0], pos[1] - s_ * cc[1], s_);
    drawPart(v, it.name, PAL.part, L.ax ? rotAbout(L.c, L.ax, L.a * (1 - e)) : null); v.flush(g);
    landed[it.name] = Math.max(landed[it.name] ?? 0, 0) + (k >= 1 ? 1 : 0);
  }
  for (const [nm, [n, , , lpos]] of Object.entries(PARTS1)) {
    const last = Math.max(...INST.filter((i) => i.name === nm).map((i) => i.t));
    label(g, c, n, lpos[0], lpos[1], 40, seg(t, last + FLY - .15, last + FLY + .1));
  }
  stepNum(g, c, 1, 96, 214, { k: seg(t, T.num1, T.num1 + .25) });
  // two people, drawn in line by line; she reads the booklet, he looks over her shoulder and points at the parts
  if (t > T.people) {
    const bk_ = read([0, 0], 150, 'b', { head: { pitch: 30 + 4 * Math.sin(t * 1.3) } });
    const pt = seg(t, T.point, T.point + .5);
    const aPose = stand([30, -40], 165, 'a', { hip: -3, lean: 8 + 4 * pt, lookAt: pt > .5 ? lp([0, 0], 150, 60, 0, 40) : [-14, 120, 6], head: { pitch: 6 } });
    if (pt > 0) {
      const sh = lp([30, -40], 165, 0, -15, 140), dir = norm3(sub3([-260, 60, -40], sh));
      aPose.hands = [null, add3(sh, mul3(dir, 50 * eo(pt) + 6))]; aPose.handDir = [null, dir]; aPose.elbow = [null, [0, -.2, 1]];
    }
    appear(g, T.people, (gg) => { const v = c.V(1450, 900, 2.55); person(v, aPose); const skB = person(v, bk_); booklet(v, skB, 1); v.flush(gg); }, .6, .6);
    // "2×" people: the manual's own way of saying it takes two
    const k = seg(t, T.callout, T.callout + .35);
    if (k > 0) {
      rrect(g, c, 1500, 110, 290, 150, 18, '#FFFFFF', k);
      if (k >= 1) {
        label(g, c, '2×', 1525, 200, 40, 1);
        const m = c.V(1675, 232, .52); person(m, stand([0, 0], 40, 'a', { lw: LW * .7 })); person(m, stand([36, -22], 40, 'b', { lw: LW * .7 })); m.flush(g);
      }
    }
  }
}

// ---------------- steps 2, 3, 6: seen in passing and on the whole page ----------------
// Every bed below is crib(v, ST[k]) — the state after step k — plus the part this step adds, drawn where it comes from.
function partsBoxIcons(g, c, items, x = 300, w = 0) {   // a parts call-out: [[count, draw(view)]]
  const bw = w || 40 + items.length * 190; rrect(g, c, x, 92, bw, 150, 18, '#FFFFFF');
  items.forEach(([n, fn, ax, ay, sc], i) => { label(g, c, n, x + 26 + i * 190, 186, 40); const m = c.V(x + 26 + i * 190 + (ax ?? 120), ay ?? 220, sc ?? .95); fn(m); m.flush(g); });
}
const iconEnd = (m) => endPanel(m, 0, [0, 0, -33], PAL.part, { lw: LW * .8 });
const iconRail = (m) => sidePanel(m, 0, [-62, -50, 0], PAL.part, { lw: LW * .8 });
const iconBase = (m) => base(m, [-62, -30, -33], PAL.part, { lw: LW * .8, bias: 0 });
const iconMat = (m) => mattress(m, [-62, -MAT_Y - 5, -33], undefined, { lw: LW * .8 });
const iconBolt = (m) => bolt(m, [-3, 0, 0], PAL.metal, { len: 7, lw: LW * .9 });
function step2(g, c, t) {
  // the right end stands up first; the bed's footprint is dotted on the floor
  const v = c.V(700, 620, 3.7);
  // the dotted footprint is exactly the finished bed's: posts at the four corners of x 0–124, z 0–66
  const f = [[0, 0, 0], [C.L, 0, 0], [C.L, 0, C.W], [0, 0, C.W]];
  for (let i = 0; i < 4; i++) dashed3(v, f[i], f[(i + 1) % 4], { layer: -1 });
  crib(v, ST[2], { endR: { pal: NEU(t) } }, g);
  v.flush(g); stepNum(g, c, 2);
  partsBoxIcons(g, c, [['1×', iconEnd]]);
}
function step3(g, c, t) {
  // the back rail goes into the right end's two back holes, then two bolts through the post from outside
  const v = c.V(700, 640, 3.7), dx = -34;
  planeArrow(v, [C.L * .5 - 26, 0, -22], [1, 0, 0], [0, 0, 1], 40, 9, { layer: -1 });
  crib(v, { endR: 1, back: 1 }, { back: { off: [dx, 0, 0], pal: NEU(t) } }, g);
  for (const y of [26, 79]) {
    dashed3(v, [C.L - 5 + dx, y, 2.5], [C.L - 5, y, 2.5], { layer: 2 });
    dashed3(v, [C.L, y, 2.5], [C.L + 22, y, 2.5], { layer: 2 }); bolt(v, [C.L + 22, y, 2.5], PAL.metal, { len: 7, lw: LW * .85 });
  }
  v.flush(g); stepNum(g, c, 3);
  partsBoxIcons(g, c, [['1×', iconRail, 120, 196, .8], ['2×', iconBolt, 110, 168, 9]]);
}
function step6(g, c, t) {
  // the base board slides in from the open left side onto the two bottom rails; then the mattress is laid on it
  const v = c.V(760, 640, 3.7), dx = -78, up = 58;
  planeArrow(v, [-70, 0, C.W + 22], [1, 0, 0], [0, 0, 1], 44, 10, { layer: -1 });
  crib(v, ST[6], { base: { off: [dx, 0, 0], pal: NEU(t) }, mattress: { off: [0, up, 0], pal: t < 44 ? PAL.neu : undefined } }, g);
  for (const z of [2.5, C.W - 2.5]) dashed3(v, [5 + dx, BASE_Y + 1, z], [5, BASE_Y + 1, z], { layer: 2 });
  for (const [x, z] of [[6, 3.5], [C.L - 6, 3.5], [C.L - 6, C.W - 3.5], [6, C.W - 3.5]]) dashed3(v, [x, MAT_Y + up, z], [x, MAT_Y, z], { layer: 2 });
  planeArrow(v, [C.L / 2, MAT_Y + MAT_T + up + 46, C.W / 2], [0, -1, 0], [1, 0, 0], 30, 10, { layer: 3 });
  v.flush(g); stepNum(g, c, 6);
  partsBoxIcons(g, c, [['1×', iconBase, 120, 196, .75], ['1×', iconMat, 120, 196, .72]]);
}

// ---------------- step 4: never lift alone ----------------
function pairPose(zc, ry, ph, wk) {   // two people carry the rail (top at 82 + ry) between them; ph = walking phase, wk = 0..1 walking amount
  const top = 82 + ry, sw = (i) => Math.sin(ph * Math.PI * 2 + i * Math.PI) * 7 * wk, lf = (i) => Math.max(0, Math.cos(ph * Math.PI * 2 + i * Math.PI)) * 5 * wk;
  const a = { at: [-26, zc + 1], face: -4, look: 'a', crouch: 9, lean: 7, hip: 2, twist: -6,
    feet: [[-6, 12 + sw(0), lf(0), 12], [6, -12 + sw(1), lf(1), 4]], knee: null,
    hands: [[2, top + 1.2, zc - 4.5], [2, top + 1.2, zc + 3.5]], handDir: [[1, -.3, .1], [1, -.3, -.1]], elbow: [[-.3, -1, -.6], [-.3, -1, .6]],
    lookAt: [C.L + 20, 140, zc - 8] };
  const b = { at: [C.L + 24, zc - 3], face: 172, look: 'b', crouch: 9, lean: 8, hip: -2, twist: 5,
    feet: [[-5, 12 - sw(0), lf(1), 8], [7, -12 - sw(1), lf(0), 6]],
    hands: [[C.L - 2, top + 1.2, zc + 4], [C.L - 2, top + 1.2, zc - 4]], handDir: [[-1, -.3, -.1], [-1, -.3, .1]], elbow: [[.3, -1, .6], [.3, -1, -.6]],
    lookAt: [-20, 150, zc + 6] };
  return { a, b };
}
function drawPair(v, zc, ry, ph, wk, pal, lw) {
  sidePanel(v, zc - 1.5, [0, ry, 0], pal, { lw: lw * .95 });
  const { a, b } = pairPose(zc, ry, ph, wk); person(v, { ...a, lw }); person(v, { ...b, lw });
}
function step4Main(g, c, t, grow) {
  const v = c.V(MAIN4.ax, MAIN4.ay, MAIN4.s);
  const wk = seg(t, T.walk0, T.walk0 + .3) * (1 - seg(t, T.walk1 - .3, T.walk1)), zc = MAIN4.zc - 62 * ss(seg(t, T.walk0, T.walk1));
  const ph = (t - T.walk0) * 1.25;
  const drawFrame = (gg) => { const vc = c.V(MAIN4.ax, MAIN4.ay, MAIN4.s); crib(vc, ST[3], {}, gg); };
  if (grow < 1) appear(g, T.portal + .05, drawFrame, .35, .4); else drawFrame(g);
  drawPair(v, zc, 12, ph, wk, NEU(t), LW);
  const gk = seg(t, T.portal + .7, T.portal + 1.3);
  if (gk > 0) {
    for (const y of [26 + 12, 79 + 12]) dashed3(v, [C.L - 5, y, zc], [C.L - 5, y - 12, C.W - 3], { p: gk, layer: -1 });   // its right end goes to the right end's front holes
  }
  v.flush(g);
  const ak = seg(t, T.portal + 1.0, T.portal + 1.4);
  if (ak > 0) { const va = c.V(MAIN4.ax, MAIN4.ay, MAIN4.s); va.grow = ak; planeArrow(va, [C.L * .5 - 14, 82 + 12 + 40, zc - 14], [0, 0, -1], [1, 0, 0], 58, 13); va.flush(g); }
}
function step4Box(g, c, t, o = {}) {
  const { x: bx, y: by, w: bw, h: bh } = BOX4, z = c.z;
  const [sx, sy] = c.T(bx, by);
  roundRect(g, sx, sy, bw * z, bh * z, 22 * z, '#FFFFFF', LW);
  g.save(); g.strokeStyle = PAL.ink; g.lineWidth = LW * .8; g.beginPath(); g.moveTo(sx + bw * z / 2, sy + 28 * z); g.lineTo(sx + bw * z / 2, sy + (bh - 28) * z); g.stroke(); g.restore();
  const lwS = LW * .9;
  { // ✗ one person, the far end dragging on the floor
    g.save(); g.beginPath(); g.roundRect(sx + 2, sy + 2, bw * z / 2 - 4, bh * z - 4, 20 * z); g.clip();
    const w = c.V(bx + 118, by + 214, 1.12), ang = -24 * D2R, xf = rotAbout([C.L - 5, 0, 0], [0, 0, 1], ang);
    const jig = Math.sin(t * 9) * .6;
    sidePanel(w, 0, [0, -22, 0], NEU(t), { lw: lwS * .95, xf });
    const hT = xf([5, 82 - 22, 1.5]);
    person(w, { at: [-22, 4], face: 2, crouch: 16, lean: 34, hip: -3, twist: 4, feet: [[-16, 12, 0, -12], [12, -11, 0, 6]], knee: [[1, .2, -.3], [1, .2, .3]],
      hands: [add3(hT, [-2, 1 + jig, -3.5]), add3(hT, [-2, 1 + jig, 4.5])], handDir: [[1, .4, .3], [1, .4, -.3]], look: 'a', lw: lwS, head: { pitch: 10, roll: -6 } });
    w.flush(g);
    const p = w.P([C.L - 3, 0, 1.5]);
    g.save(); g.strokeStyle = PAL.ink; g.lineWidth = Math.max(1.2, LW * .9); g.lineCap = 'round';
    for (const k of [0, 1, 2]) { g.beginPath(); g.moveTo(p[0] + (14 + k * 9) * z, p[1] + (10 - k * 9) * z); g.lineTo(p[0] + (30 + k * 9) * z, p[1] + (1 - k * 9) * z); g.stroke(); }
    g.restore(); g.restore();
    cross(g, sx + 46 * z, sy + 48 * z, 34 * z, 7 * Math.min(1.6, z ** .5));
  }
  { // ✓ two people
    g.save(); g.beginPath(); g.roundRect(sx + bw * z / 2 + 2, sy + 2, bw * z / 2 - 4, bh * z - 4, 20 * z); g.clip();
    const m = MINI4(), w = c.V(m.ax, m.ay, m.s); drawPair(w, 0, 12, 0, 0, NEU(t), lwS); w.flush(g); g.restore();
    tick(g, sx + (bw / 2 + 46) * z, sy + 48 * z, 36 * z, 7 * Math.min(1.6, z ** .5));
  }
}
function step4(g, c, t) {
  // before the portal the main drawing is the printed one; after it, it is the one the camera fell into
  const grow = t < T.portal ? 1 : seg(t, T.portal + .05, T.portal + .8);
  step4Main(g, c, t < T.portal ? T.walk0 - 1 : t, grow);
  step4Box(g, c, t);
  stepNum(g, c, 4);
}

// ---------------- step 5: turn until it clicks ----------------
const keyAng = (t) => (12 + 118 * eio(seg(t, T.turn0, T.turn1)) + 6 * seg(t, T.click - .05, T.click + .04)) * D2R;
function keyFrame(pv, phi) { const a = [0, Math.cos(phi), Math.sin(phi)], b = cross3([1, 0, 0], a); return { a, b, at: (x, y, z) => add3(pv, add3(add3([x, 0, 0], mul3(a, y)), mul3(b, z))) }; }
function step5(g, c, t) {
  const yel = 1 - seg(t, T.click, T.click + .5), railPal = t >= 44 ? PAL.part : mixPal(PAL.part, PAL.neu, yel);
  const v = c.V(MAG5.ax, MAG5.ay, MAG5.s), YB = 26, zk = C.W - 2.5;
  crib(v, ST[5], { front: { pal: railPal, noHeads: true } }, g);   // the left side is still open: he holds the rail's free end
  // bolts fly in along their dotted guides
  for (const [i, y] of [[0, YB], [1, 79]]) {
    const k = eio(seg(t, T.bolts + i * .25, T.bolts + i * .25 + .45)), x = C.L - 6 + 34 * (1 - k);
    dashed3(v, [C.L, y, zk], [C.L + 30, y, zk], { layer: -1 });
    bolt(v, [x, y, zk], PAL.metal, { len: 7, lw: LW * .85 });
  }
  // the key and the hand that turns it
  const phi = keyAng(t), kx = C.L + 4.2, piv = [kx, YB, zk], F = keyFrame(piv, phi), grip = F.at(0, 9, 0);
  if (t > T.bolts + .5) { cyl(v, [C.L + .6, YB, zk], piv, .4, PAL.metal, { lw: LW * .8, bias: 3 }); cyl(v, piv, F.at(0, 12.5, 0), .4, PAL.metal, { lw: LW * .8, bias: 3 }); }
  // she half-kneels just outside the right end, beside the bolt so it stays in sight: the near (left) knee down, the far foot planted;
  // her left hand moves from her thigh to the key once the bolts are in, her right forearm rests on the front knee
  const reach = ss(seg(t, T.bolts + .25, T.bolts + .7)), KA = [C.L + 41, C.W - 10];
  const rest = lp(KA, 180, 30, 6, 44), handL = reach >= 1 ? grip : [lerp(rest[0], grip[0], reach), lerp(rest[1], grip[1], reach), lerp(rest[2], grip[2], reach)];
  person(v, kneel(KA, 180, 'b', { twist: 8, hands: [handL, lp(KA, 180, 34, -10, 49)], handDir: [null, lp([0, 0], 180, .3, -.2, -1)],
    elbow: [lp([0, 0], 180, -.3, 1, -1), lp([0, 0], 180, -.2, -1, -.4)], lookAt: [C.L + 2, YB + 4, zk] }));
  // he stands at the front-left corner, feet staggered, and holds the free end of the rail level while she works
  person(v, { at: [11, C.W + 26], face: -52, look: 'a', crouch: 3, lean: 16, hip: 2.5, feet: [[5, 11, 0, 6], [-9, -11, 0, 16]],
    hands: [[14, 83, C.W - 2.5], [38, 83, C.W - 2.5]], handDir: [[.3, -.3, -1], [.3, -.3, -1]], elbow: [[-.6, -1, .3], [.6, -1, .3]], lookAt: [C.L, 40, C.W] });
  v.flush(g);
  // the magnifier on the lower bolt
  const mk = seg(t, T.mag, T.mag + .5);
  if (mk > 0) {
    const spot = v.P([C.L + .6, YB, zk]), [mx, my] = c.T(MAG5.mx, MAG5.my), r = MAG5.r * c.z * back(mk, 1.3);
    const lead = seg(t, T.mag, T.mag + .2);
    magnifier(g, spot, mx, my, Math.max(1, r), (g) => {
      const zs = MAG5.zs * c.z, z0 = makeView({ cx: 0, cy: 0, s: zs }), b = z0.P([C.L + .35, YB, zk]);
      const vz = makeView({ cx: mx + MAG5.bx * c.z - b[0], cy: my + MAG5.by * c.z - b[1], s: zs });
      box(vz, [C.L - 5, 0, C.W - 5], [C.L, 52, C.W], PAL.part);
      box(vz, [C.L - 44, 23, C.W - 4.5], [C.L - 5, 29, C.W - 1.5], railPal);
      cyl(vz, [C.L - 30, 29, C.W - 3], [C.L - 30, 60, C.W - 3], 1.25, railPal); cyl(vz, [C.L - 20.5, 29, C.W - 3], [C.L - 20.5, 60, C.W - 3], 1.25, railPal);
      cyl(vz, [C.L, YB, zk], [C.L + .7, YB, zk], 1.05, PAL.metal, { bias: 2 });
      cyl(vz, [C.L + .4, YB, zk], piv, .38, PAL.metal, { lw: LW * .9, bias: 3 }); cyl(vz, piv, F.at(0, 12.5, 0), .38, PAL.metal, { lw: LW * .9, bias: 3 });
      // the hand grips the long arm and turns with it: knuckles across the front, thumb over the index finger, the wrist following
      const H3 = (x, y, z) => F.at(x, y, z), skin = '#FFFFFF', far = keyFrame(piv, phi * .55 + .25).at(23, 18, -12);
      blob(vz, [[H3(5.4, 7.2, -.6), 2.7], [far, 3.3]], skin, { depth: 9e4 });
      blob(vz, [[H3(3.5, 9.4, .1), 2.1], [H3(3.5, 4.4, .1), 1.9], [H3(5, 7, -.6), 2.5]], skin, { depth: 9.05e4 });
      [[9.6, .98], [7.55, .98], [5.5, .95], [3.6, .85]].forEach(([y, r_], i) => blob(vz, [[H3(3.2, y, .9), r_], [H3(-.5, y - .15, 1.9), r_ * .96], [H3(-1.25, y - .2, .7), r_ * .88]], skin, { depth: 9.1e4 + (3 - i) * 10 }));
      blob(vz, [[H3(3.6, 10.8, .2), 1.05], [H3(.6, 11.5, 1.4), .95]], skin, { depth: 9.2e4 });
      vz.flush(g);
      const ak = seg(t, T.turn0, T.turn0 + .4);
      if (ak > 0) { const tv = makeView({ cx: vz.cx, cy: vz.cy, s: zs }); tv.grow = ak; turnArrow(tv, piv, [1, 0, 0], [0, 1, 0], 9.5, -.15, 1.75, 14 * c.z ** .6, { tail: .45 }); tv.flush(g); }
      const ck = seg(t, T.click, T.click + .35);
      if (ck > 0 && ck < 1) { const cp = vz.P([C.L + .5, YB, zk]); g.save(); g.globalAlpha = 1 - ss(seg(ck, .6, 1)); clickMark(g, cp[0] - 14 * c.z, cp[1] + 12 * c.z, 24 * c.z * (1 + .3 * eo(ck)), Math.PI * .8, 3.2 * c.z ** .5); g.restore(); }
      else if (ck >= 1 && t < 44) { const cp = vz.P([C.L + .5, YB, zk]); clickMark(g, cp[0] - 14 * c.z, cp[1] + 12 * c.z, 24 * c.z, Math.PI * .8, 3.2 * c.z ** .5); }
    }, { spotR: 22 * c.z ** .6, lead });
  }
  stepNum(g, c, 5);
  rrect(g, c, 290, 92, 330, 140, 18, '#FFFFFF');
  label(g, c, '2×', 316, 176, 34); label(g, c, '1×', 480, 176, 34);
  const bi = c.V(415, 168, 9); bolt(bi, [-3, 0, 0], PAL.metal, { len: 7, lw: LW * .9 }); bi.flush(g);
  const ki = c.V(552, 150, 8.5); keyIcon(ki, [-1.5, 0, -4.5], LW * .9); ki.flush(g);
}

// ---------------- step 7: one end upside down ----------------
const S7 = { ax: 820, ay: 640, s: 3.6 };
const PA7 = [-60, 67], PB7 = [-50, 160];   // both stand off the bed's left front corner, wholly outside its footprint
const LAUGH = { at: [-62, 64], face: 315 };
const flip7 = flipL;   // the LEFT end goes on last, at step 7 — upside down
function knob7() { return flip7([2.5, C.H + 1.6, C.W - 2.5]); }
function step7(g, c, t) {
  const v = c.V(S7.ax, S7.ay, S7.s);
  const lift = 62 * eio(seg(t, T.beat1 + .1, T.beat1 + .9));
  crib(v, ST[7], { endL: { skip: lift > 0 } }, g);
  const pv = v;
  // the two of them: puzzled, then hands on hips and a scratch of the head, then one of them sits down laughing
  const r = ss(seg(t, T.x7 - .5, T.x7 + .1)), target = [2.5, 45, C.W / 2];
  const laughing = t >= T.beat2, k = (t - T.beat2) * 9;
  // they stand off the left front corner, outside the bed, both turned toward the wrong end
  const PA = PA7, PB = PB7;
  let skA = null;
  if (!laughing) {
    skA = person(pv, mixPose(stand(PA, -10, 'a', { lookAt: target }), handsOnHips(PA, -10, 'a', { lookAt: target, lean: 4 }), r));
    person(pv, mixPose(stand(PB, -36, 'b', { lookAt: target, hip: -3 }), scratch(PB, -36, 'b', { lookAt: target }), r));
  } else {
    // he sits down cross-legged on the floor and folds forward laughing, both hands on his stomach; she bends over laughing, hands on her knees
    const sh = Math.sin(k) * .5 + .5, L = LAUGH, out = (sd) => lp([0, 0], L.face, .2, sd, .5);
    skA = person(pv, sitCross(L.at, L.face, 'a', k));
    person(pv, { at: PB, face: -36, look: 'b', crouch: 10, lean: 34 + 6 * Math.sin(k + 1), hip: -2, feet: [[2, 13, 0, 12], [-4, -13, 0, 10]],
      hands: [lp(PB, -36, 24, 13, 50), lp(PB, -36, 24, -13, 50)], handDir: [null, null], elbow: [lp([0, 0], -36, -1, 1, 0), lp([0, 0], -36, -1, -1, 0)],
      head: { pitch: -6, roll: -8 } });
  }
  pv.flush(g);
  if (lift > 0) {   // the wrong end, taken away: only its dotted outline is left, lifted up out of the posts
    setGhost(1); const vg = c.V(S7.ax, S7.ay, S7.s); endPanel(vg, 0, [0, 0, 0], PAL.part, { xf: (p) => add3(flip7(p), [0, lift, 0]) }); vg.flush(g); setGhost(0);
    const k = seg(t, T.beat1 + .15, T.beat1 + .55);   // a big up arrow beside it: pull it out
    const fa = 1 - seg(t, T.beat2 - .12, T.beat2);
    if (k > 0 && fa > 0) { g.save(); g.globalAlpha = fa; const p0 = v.P([-26, 20, 30]), p1 = v.P([-26, 20 + 105 * eo(k), 30]); arrow2(g, [p0, p1], 26 * c.z ** .6, { tail: .5 }); g.restore(); }
  }
  if (laughing && t < 44) {   // "ha": three short strokes beside the laughing head, flicking
    const h = pv.P(skA.headC);
    g.save(); g.strokeStyle = PAL.ink; g.lineCap = 'round'; g.lineWidth = LW * 1.1;
    for (const [i, a] of [[0, -2.5], [1, -1.9], [2, -1.3]]) { const on = Math.sin(k * .8 + i * 1.3) > -.2; if (!on) continue; const r0 = 52 * c.z, r1 = 76 * c.z;
      g.beginPath(); g.moveTo(h[0] + Math.cos(a) * r0, h[1] + Math.sin(a) * r0); g.lineTo(h[0] + Math.cos(a) * r1, h[1] + Math.sin(a) * r1); g.stroke(); }
    g.restore();
  }
  // the red cross, stamped
  const xk = seg(t, T.x7, T.x7 + .12) * (1 - seg(t, T.beat2 - .15, T.beat2));
  if (xk > 0) { const p = v.P([2.5, 46, C.W / 2 + 6]); const s = 1 + .4 * (1 - Math.min(1, seg(t, T.x7, T.x7 + .12))); g.save(); g.globalAlpha = xk > 0 && t > T.beat2 - .15 ? xk : 1; cross(g, p[0], p[1], 78 * c.z * s, 12 * Math.min(2.2, c.z ** .6)); g.restore(); }
  stepNum(g, c, 7);
}

// ---------------- step 8: turn it over ----------------
function step8(g, c, t) {
  const v = c.V(860, 640, 3.0);
  const k = eio(seg(t, T.beat3 + .05, T.flipLand - .2)), drop = 1 - ei(seg(t, T.flipLand - .25, T.flipLand));
  const settled = t >= T.flipLand, pal = t >= 44 ? PAL.part : mixPal(PAL.neu, PAL.part, seg(t, T.flipLand + .1, T.flipLand + .6));
  const up = 70 * drop, ang = Math.PI * (1 - k);
  const xf = (p) => add3(rotAbout([2.5, (C.H + 2.4) / 2, C.W / 2], [0, 0, 1], ang)(p), [0, up, 0]);   // the left end, turned the right way up
  crib(v, ST[8], { endL: { xf, pal } }, g);
  // the 180° arrow around the panel, on the page from the start
  const av = c.V(860, 640, 3.0);
  turnArrow(av, [1, (C.H + 2.4) / 2 + 70, C.W / 2], [0, 0, 1], [-1, 0, 0], 62, -1.25, 1.75, 22 * c.z ** .55, { tail: .4 });
  av.flush(g);
  const tk = seg(t, T.flipLand + .05, T.flipLand + .25);
  if (tk > 0) { const p = v.P([-26, 125, C.W]); tick(g, p[0], p[1], 72 * c.z * (1 + .3 * (1 - tk)), 12 * Math.min(2.2, c.z ** .6)); }
  stepNum(g, c, 8);
}

// ---------------- step 9: wait ----------------
function room(v, o = {}) {
  const X0 = -50, X1 = 230, Z0 = -50, Z1 = 190, HW = 200, wall = '#FBF9F4';
  poly3(v, [[X0, 0, Z0], [X1, 0, Z0], [X1, 0, Z1], [X0, 0, Z1]], '#EAE5DA', { depth: -1.1e5, lw: 0 });
  poly3(v, [[X0, 0, Z0], [X0, HW, Z0], [X0, HW, Z1], [X0, 0, Z1]], wall, { depth: -1e5 });
  poly3(v, [[X0, 0, Z0], [X1, 0, Z0], [X1, HW, Z0], [X0, HW, Z0]], wall, { depth: -1e5 + 1 });
  // window on the back wall
  const wx0 = 60, wx1 = 150, wy0 = 95, wy1 = 175;
  poly3(v, [[wx0, wy0, Z0], [wx1, wy0, Z0], [wx1, wy1, Z0], [wx0, wy1, Z0]], '#FFFFFF', { depth: -1e5 + 2 });
  v.add(-1e5 + 3, (g) => { g.save(); g.strokeStyle = PAL.ink; g.lineWidth = LW * .8; const a = v.P([(wx0 + wx1) / 2, wy0, Z0]), b = v.P([(wx0 + wx1) / 2, wy1, Z0]), c_ = v.P([wx0, (wy0 + wy1) / 2, Z0]), d = v.P([wx1, (wy0 + wy1) / 2, Z0]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.moveTo(...c_); g.lineTo(...d); g.stroke(); g.restore(); });
  // rug
  poly3(v, [[20, 0, 120], [180, 0, 120], [180, 0, 175], [20, 0, 175]], PAL.grey1, { depth: -7e4 });
  return { wx0, wx1, wy0, wy1, Z0 };
}
const sweeps9 = () => { const out = []; let t = 33.25, p = .78; for (let i = 0; i < 9; i++) { out.push(t); t += p; p *= .82; } return out; };
function step9(g, c, t) {
  const v = c.V(1000, 600, 2.9), R = room(v);
  // the window's light on the floor, carried across the room once a month
  const sw = sweeps9(), lastS = sw[sw.length - 1];
  let i = sw.findIndex((s, j) => t >= s && t < (sw[j + 1] ?? lastS + .5));
  const ph = i >= 0 ? seg(t, sw[i], sw[i + 1] ?? lastS + .45) : (t >= lastS + .45 ? .55 : -1);
  if (ph >= 0 && (t < 44 || true)) {
    const dx = lerp(-1.3, 1.3, ph), dz = 1.25, f = (x, y) => [x - dx * y, 0, R.Z0 + dz * y];
    const pts = [f(R.wx0, R.wy0), f(R.wx1, R.wy0), f(R.wx1, R.wy1), f(R.wx0, R.wy1)];
    const p2 = pts.map(v.P);
    v.add(-8e4, (g) => { g.save(); g.globalAlpha = Math.sin(Math.PI * clamp(ph)) ** .6; path(g, p2); g.fillStyle = '#FFFFFF'; g.fill(); g.restore(); });
  }
  crib(v, { ...ST[9], off: [40, 0, 40] }, {}, g);
  v.flush(g);
  stepNum(g, c, 9);
  rrect(g, c, 300, 92, 250, 150, 18, '#FFFFFF');
  label(g, c, '9×', 326, 186, 40);
  const [mx, my] = c.T(470, 166); moonIcon(g, mx, my, 34 * c.z);
}

// ---------------- step 10: not in the manual ----------------
function step10(g, c, t) {
  stepNum(g, c, 10, 96, 214, { k: seg(t, T.num10, T.num10 + .25) });
  // the finished bed appears as one drawing (line art first, then colour), the swaddle's outline with it;
  // then the two of them, the same way; the swaddle is filled yellow last. Nothing is ever drawn floating or half-built.
  if (t < T.grow0) return;
  const baby = [54, MAT_Y + MAT_T + 6.5, 33];   // lying on the mattress
  const fk = ss(seg(t, T.fill, T.fill + .45));
  appear(g, T.grow0, (gg) => {
    const v = c.V(860, 650, 4.4);
    crib(v, ST[10], {}, gg, { inner: (vi) => {   // the swaddle (≈ 50 cm) and the little head, on the mattress
      const sw = [[add3(baby, [-11, 0, 2]), 7.6], [add3(baby, [3, .5, 0]), 8.6], [add3(baby, [16, 0, -1]), 7.2]];
      blob(vi, sw, fk > 0 ? mixPal({ top: '#FFFFFF', z: '#FFFFFF', x: '#FFFFFF' }, { top: PAL.neu.z, z: PAL.neu.z, x: PAL.neu.z }, fk).top : '#FFFFFF', { depth: vi.depth(baby) + 2 });
      blob(vi, [[add3(baby, [-21, 1, 3]), 5.4]], '#FFFFFF', { depth: vi.depth(baby) + 2.1 });
    } });
  }, .75, .7);
  if (t < T.grow0 + 1.2) return;
  // the two of them at the foot of the bed, seen from behind, leaning on the end board; his right arm across her back,
  // the hand on her far shoulder: from this side nothing stands in front of it
  const B = leanOn([C.L + 26, 56], 180, 'b', 82, { lookAt: baby, hip: 2, lean: 18, hands: [[C.L - 1, 84, 58], [C.L - 1, 84, 42]] });
  const skB = (() => { const tmp = makeView({ cx: 0, cy: 0, s: 1 }); return person(tmp, B); })();
  appear(g, T.grow0 + 1.2, (gg) => {
    const pv = c.V(860, 650, 4.4);
    person(pv, B);
    person(pv, leanOn([C.L + 31, 18], 180, 'a', 82, { lookAt: baby, lean: 14, twist: -14, head: { roll: -10 },
      hands: [add3(skB.sh[0], [4, 5, 2]), [C.L - 1, 85, 12]], handDir: [[-.3, -.6, .6], null], elbow: [[1, .2, .1], [0, -1, -.3]] }));
    pv.flush(gg);
  }, .65, .75);
}

// ---------------- the footer: the end card printed on the page ----------------
function footer(g, cm, t) {
  const c = ctx('foot', cm), w = 2 * CW + GX;
  const tk = seg(t, T.title, T.title + .5), ck = seg(t, T.card, T.card + .35);
  if (tk <= 0) return;
  g.save(); g.globalAlpha = tk;
  const [x0, y0] = c.T(150, 0), [x1] = c.T(w - 150, 0);
  g.strokeStyle = PAL.ink; g.lineWidth = Math.max(1.2, LW); g.beginPath(); g.moveTo(x0, c.T(0, 120)[1]); g.lineTo(x1, c.T(0, 120)[1]); g.stroke();
  g.fillStyle = PAL.ink; g.textBaseline = 'alphabetic';
  let p = c.T(150, 470); g.font = `700 ${330 * c.z}px ${FONT.num}`; g.fillText('Step Ten', p[0], p[1]); note(g, 'title-en', 'Step Ten', p[0], p[1]);
  const tw = g.measureText('Step Ten').width;
  p = c.T(150, 470); g.font = `500 ${220 * c.z}px ${FONT.zh}`; g.fillText('第十步', p[0] + tw + 70 * c.z, p[1]); note(g, 'title-zh', '第十步', p[0] + tw + 70 * c.z, p[1]);
  g.restore();
  if (ck > 0) {
    g.save(); g.globalAlpha = ck; g.fillStyle = PAL.ink;
    let p = c.T(150, 760); g.font = `500 ${175 * c.z}px ${FONT.num}`; g.fillText('Instruction Manual Art', p[0], p[1]); note(g, 'style-en', 'Instruction Manual Art', p[0], p[1]);
    const w1 = g.measureText('Instruction Manual Art').width; g.font = `500 ${175 * c.z}px ${FONT.zh}`; g.fillText('说明书插画', p[0] + w1 + 60 * c.z, p[1]); note(g, 'style-zh', '说明书插画', p[0] + w1 + 60 * c.z, p[1]);
    p = c.T(150, 1010); g.font = `600 ${165 * c.z}px ${FONT.num}`; g.fillText('LemoLab × Claude Opus 5.5', p[0], p[1]); note(g, 'signoff', 'LemoLab × Claude Opus 5.5', p[0], p[1]);
    g.restore();
  }
}
// dotted path from step to step (the snake), and the paper
function connectors(g, cm) {
  const z = cm.z, S = (x, y) => [(x - cm.x) * z + W / 2, (y - cm.y) * z + H / 2];
  const lw = Math.max(1, lwFor(z) * .8), dash = [2 * Math.max(.5, z ** .5), 10 * Math.max(.5, z ** .5)];
  for (let k = 1; k < 10; k++) {
    const [a, b] = [cellO(k), cellO(k + 1)];
    let p, q;
    if (a[1] === b[1]) { const dir = Math.sign(b[0] - a[0]); p = [a[0] + (dir > 0 ? CW - 60 : 60), a[1] + CH / 2]; q = [b[0] + (dir > 0 ? 60 : CW - 60), b[1] + CH / 2]; }
    else { p = [a[0] + CW / 2, a[1] + CH - 40]; q = [b[0] + CW / 2, b[1] + 40]; }
    dashed(g, S(...p), S(...q), { lw, dash });
  }
}
let paperTex = null;
function paper(g, cm) {
  if (!paperTex) {
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N; const pg = cv.getContext('2d');
    pg.fillStyle = PAL.paper; pg.fillRect(0, 0, N, N); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 760; i++) { const x = r() * N, y = r() * N, a = r() * Math.PI, l = 4 + r() * 16; pg.strokeStyle = r() < .5 ? 'rgba(120,105,80,0.05)' : 'rgba(255,255,255,0.22)'; pg.lineWidth = .6 + r() * .6;
      for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { pg.beginPath(); pg.moveTo(x + ox, y + oy); pg.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l * .4); pg.stroke(); } }
    for (let i = 0; i < 80; i++) { pg.fillStyle = 'rgba(90,80,60,0.10)'; pg.fillRect(r() * N, r() * N, 1 + r(), 1 + r()); }
    paperTex = pg.createPattern(cv, 'repeat');
  }
  // the fibres travel with the page when the camera pans (they keep their size: it is printed stock, not a picture of it)
  const ox = ((-cm.x * cm.z) % 1024 + 1024) % 1024, oy = ((-cm.y * cm.z) % 1024 + 1024) % 1024;
  g.save(); g.translate(ox, oy); g.fillStyle = paperTex; g.fillRect(-ox, -oy, W, H); g.restore();
}

// ---------------- subtitles ----------------
function subtitles(g, t) {
  for (const s of TL.subs) {
    if (t < s.t0 || t >= s.t1) continue;
    const a = Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .12, s.t1)), x = 128, y = H - 132;
    g.save(); g.globalAlpha = a;
    // a soft paper bed behind the words so they read over any drawing (same colour as the page: no visible box)
    g.font = `500 38px ${FONT.zh}`; const w1 = g.measureText(s.zh).width; g.font = `500 32px ${FONT.num}`; const w2 = g.measureText(s.en).width;
    g.fillStyle = 'rgba(244,241,234,0.86)'; g.beginPath(); g.roundRect(x - 40, y - 52, Math.max(w1, w2) + 70, 124, 10); g.fill();
    g.fillStyle = PAL.ink; g.font = `500 38px ${FONT.zh}`; g.fillText(s.zh, x, y);
    g.globalAlpha = a * .78; g.font = `500 32px ${FONT.num}`; g.fillText(s.en, x, y + 47);
    g.globalAlpha = a; g.fillStyle = PAL.neu.z; g.fillRect(x - 26, y - 30, 8, 86);
    g.restore();
  }
}

// ---------------- the frame ----------------
const STEP = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5, 6: step6, 7: step7, 8: step8, 9: step9, 10: step10 };
function drawPage(g, t, cm) {
  paper(g, cm);
  if (t >= T.portal && t < T.portal + .5) {   // just through the ✓ cell: its white is still around us, fading into the page
    g.save(); g.globalAlpha = 1 - ss(seg(t, T.portal, T.portal + .5)); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H); g.restore();
  }
  setLW(lwFor(cm.z));
  connectors(g, cm);
  const vis = (k) => { const [ox, oy] = cellO(k), m = 300; const x0 = (ox - m - cm.x) * cm.z + W / 2, x1 = (ox + CW + m - cm.x) * cm.z + W / 2, y0 = (oy - m - cm.y) * cm.z + H / 2, y1 = (oy + CH + m - cm.y) * cm.z + H / 2; return x1 > 0 && x0 < W && y1 > 0 && y0 < H; };
  for (let k = 1; k <= 10; k++) if (vis(k)) STEP[k](g, ctx(k, cm), t);
  footer(g, cm, t);
}
function frame(g, t) {
  SUBT = t;
  const cm = cam(t);
  // the portal: before it, step 4's ✓ half holds a small copy of the main drawing; at T.portal the camera is re-based
  drawPage(g, t, cm);
}

let SUB = null;
export function setup() { times(); buildKeys(); }
export function render(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); TXT = new Map();
  // motion blur on fast camera moves. A pan is a translation, so one frame smeared along the camera's path is exact;
  // a zoom is sampled as sub-frames across half a frame's shutter.
  const dt = 1 / 30, a = cam(t - dt * .25), b = cam(t + dt * .25);
  const dx = (b.x - a.x) * b.z, dy = (b.y - a.y) * b.z, dz = Math.abs(Math.log(b.z / a.z)) * 1100;
  const cut = [T.portal, T.cut7, T.beat1, T.beat2, T.beat3].some((c) => Math.abs(t - c) < dt * .3);
  if (!SUB) { SUB = document.createElement('canvas'); SUB.width = W; SUB.height = H; }
  const sg = SUB.getContext('2d');
  if (!cut && dz > 10) {
    const n = Math.min(16, Math.ceil(dz / 5));
    for (let i = 0; i < n; i++) { REC = i === n >> 1; sg.setTransform(1, 0, 0, 1, 0, 0); frame(sg, t + dt * .5 * ((i + .5) / n - .5)); g.globalAlpha = 1 / (i + 1); g.drawImage(SUB, 0, 0); }
    REC = true;
    g.globalAlpha = 1;
  } else if (!cut && Math.hypot(dx, dy) > 6) {
    const n = Math.min(48, Math.ceil(Math.hypot(dx, dy) / 2.5));
    sg.setTransform(1, 0, 0, 1, 0, 0); frame(sg, t);
    g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { const k = (i + .5) / n - .5; g.globalAlpha = 1 / (i + 1); g.drawImage(SUB, -dx * k, -dy * k); }
    g.globalAlpha = 1;
  } else frame(g, t);
  subtitles(g, t);
}

// sound cues for mix.py (events.mjs exports them)
export function events() {
  const E = [];
  E.push({ t: T.land, type: 'land' }, { t: T.num1, type: 'print' }, { t: T.lid, type: 'lid' });
  INST.forEach((p) => E.push({ t: p.t, type: 'rise', d: FLY, name: p.name }, { t: p.t + FLY, type: 'settle', name: p.name }));
  E.push({ t: T.people, type: 'draw', d: 1.3 }, { t: T.callout, type: 'pop' }, { t: T.whip, type: 'whip', d: .7 }, { t: T.push, type: 'push', d: .8 },
    { t: T.portal, type: 'portal' }, { t: T.portal + .05, type: 'draw', d: .75 });
  for (let i = 0; i < 6; i++) E.push({ t: T.walk0 + .1 + i * .4, type: 'step' });
  E.push({ t: T.pan5, type: 'slide', d: 1.0 }, { t: T.bolts, type: 'bolt' }, { t: T.bolts + .25, type: 'bolt' }, { t: T.mag, type: 'mag' });
  for (let i = 0; i < 6; i++) E.push({ t: T.turn0 + .1 + i * .22, type: 'ratchet' });
  E.push({ t: T.click, type: 'click' }, { t: T.dive, type: 'dive', d: T.cut7 - T.dive }, { t: T.cut7, type: 'cut' }, { t: T.x7, type: 'stamp' },
    { t: T.beat1, type: 'lift' }, { t: T.beat2, type: 'laugh' }, { t: T.beat3, type: 'flip', d: T.flipLand - T.beat3 }, { t: T.flipLand, type: 'land2' },
    { t: T.flipLand + .1, type: 'tick' }, { t: T.s9, type: 'slide', d: T.s9End - T.s9 });
  sweeps9().forEach((s) => E.push({ t: s, type: 'month' }));
  E.push({ t: T.s10, type: 'slide', d: T.s10End - T.s10 }, { t: T.num10, type: 'print' }, { t: T.grow0, type: 'draw', d: T.grow1 - T.grow0 }, { t: T.fill, type: 'fill' },
    { t: T.out0, type: 'out', d: T.out1 - T.out0 }, { t: T.title, type: 'print' }, { t: T.card, type: 'card' });
  for (const [k, v] of Object.entries(TL.vo)) E.push({ t: v[0], type: 'vo', id: k });
  return E.sort((a, b) => a.t - b.t);
}
