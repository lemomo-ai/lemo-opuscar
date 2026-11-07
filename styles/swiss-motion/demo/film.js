// Five Rules for a Poster —— timeline and drawing. Every coordinate is on the grid; every motion is snap (precise ease) or lin (linear).
// The only exception: the red circle's escape (linear, no snap, leaves the grid).
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1920, H = 1080, DUR = 44;
export const C = {
  page: '#EAE9E5', paper: '#FFFFFF', ink: '#111111', red: '#E30613',
  grid: '#CFCEC9', pgrid: '#E2E1DC', bass: '#CFCEC9', mute: '#77766F', col: '#E2E1DC', wall: '#DFDED9',
};
// ---------- frame grid: 12 columns, margin 96, gutter 24 ----------
const FM = 96, FG = 24, FC = 122;
export const fx = i => FM + i * (FC + FG);
// ---------- poster (local coordinates): 706×1008; 7 columns × 91 = the 7 notes of A Dorian; 16 rows × 40 = 16 eighth notes ----------
export const PW = 706, PH = 1008, PM = 35, PMX = 34.5, CW = 91, RH = 40, NC = 7;
export const px = c => PMX + c * CW, py = r => PM + r * RH;
const SCORE_B = py(16);

// ---------- key moments ----------
export const T = {
  run: 18.0, circleIn: 20.0, hes: 23.5, pageOut: 24.5, fly0: 24.5, pause: [25.0, 25.25], land: 26.0,
  reflow: 26.125, txtFinal: 27.125, gridOff: 27.5, rot: 30.0, rotD: 1.5 * BEAT, labels: 30.5,
  sweep: 32.0, wall: 37.0, wallD: 1.0, cut: 39.0, home: 40.0,
};

let S = null, WORDS = {}, LINES = [];
export function setScore(s) { S = s; buildUnits(); }
export function setWords(w) { WORDS = w || {}; }
// subtitles = a line of typesetting within the layout. The first line is set small (lead-in), the rest large (statements)
const LAYOUT = { l1: [7.8, 'page'], l2: [11.8, 'page'], l3: [15.8, 'page'], l4: [19.85, 'page'], l4b: [22.15, 'page', 1], l5: [99, 'page'], l5b: [27.4, 'center'], l6: [39.95, 'wall'] };
export function setLines(lines, dur) {
  LINES = lines.map(L => {
    const i = L.text.indexOf('. '), [end, pos, soft] = LAYOUT[L.id];
    const small = L.id === 'l5b' ? '' : L.text.slice(0, i + 1), big = L.id === 'l5b' ? L.text : L.text.slice(i + 2);
    return { id: L.id, t: L.t, dur: dur[L.id], end, pos, soft, small, big, text: L.text };
  });
}
export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.end, L.id === 'l5' ? 24.5 : L.end), text: L.text }));

// ======================================================================
function font(g, weight, size, fam = 'Archivo') {
  g.font = `${weight} ${size}px ${fam}`;
  g.letterSpacing = size >= 90 && fam === 'Archivo' ? `${(-size * 0.022).toFixed(1)}px` : '0px';
}
const textW = (g, s) => g.measureText(s).width;
// a run of text that snaps in from below the baseline (p: 0→1 enters; q: 0→1 flips away upward)
function revealText(g, s, x, y, size, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = textW(g, s) + size * .1;
  g.save(); g.beginPath(); g.rect(x - 2, y - size * 1.02, w + 4, size * 1.30); g.clip();
  g.fillText(s, x, y + (1 - p) * size * 1.05 - q * size * 1.3);
  g.restore();
}
function wordTimes(L) {
  const n = (L.small ? L.small.split(' ').length : 0) + L.big.split(' ').length, w = WORDS[L.id];
  if (w && w.length === n) return w.map(x => L.t + x);
  return Array.from({ length: n }, (_, i) => L.t + i * .26);
}
function drawLine(g, L, t, x, ySmall, yBig, bigSize = 76) {
  if (t < L.t - .1 || t > L.end + .2) return;
  const ts = wordTimes(L), sm = L.small ? L.small.split(' ') : [], bg = L.big.split(' ');
  const q = snap(t, L.end, E8);
  let i = 0, cx = x;
  font(g, 500, 30); g.fillStyle = C.mute;
  for (const wd of sm) { revealText(g, wd, cx, ySmall, 30, snap(t, ts[i] + E16, E16), q); cx += textW(g, wd + ' '); i++; }
  cx = x; font(g, L.soft ? 400 : 700, bigSize); g.fillStyle = C.ink;
  for (const wd of bg) { revealText(g, wd, cx, yBig, bigSize, snap(t, ts[i] + E16, E16), q); cx += textW(g, wd + ' '); i++; }
}

// ======================================================================
// poster text blocks: A messy (three typefaces) → B unified Archivo → C white space tightened → D flush left → E final
const TX = [
  { A: ['Neue Musik', 'Fraktur', 400, 118, 200], B: ['neue musik', 800, 112], C: [104, 800, 790], E: [PMX, 861, 150, 800], split: [PMX, 973] },
  { A: ['Grosses Konzert', 'DMSerif', 400, 62, 300], B: ['grosses konzert', 300, 62], cut: 14.0 },
  { A: ['!! nicht verpassen !!', 'Archivo', 800, 40, 370], B: ['!! nicht verpassen !!', 900, 40], cut: 12.5 },
  { A: ['Konzert 1961', 'DMSerif', 400, 58, 452], B: ['konzert 1961', 600, 58], C: [32, 600, 842], E: [px(3), 64, 32, 700] },
  { A: ['Freitag 17. März 1961 · 20.15 Uhr', 'Archivo', 400, 28, 520], B: ['freitag 17. märz 1961 · 20.15 uhr', 400, 28], C: [20, 400, 888], E: [px(3), 104, 20, 500] },
  { A: ['im Kleinen Saal', 'Fraktur', 400, 54, 600], B: ['kleiner saal', 700, 54], C: [20, 400, 914], E: [px(3), 130, 20, 500] },
  { A: ['mit Pauken und Trompeten', 'DMSerif', 400, 42, 680], B: ['mit pauken und trompeten', 500, 42], cut: 13.0 },
  { A: ['Werke von Marti, Brunner, Weiss', 'Archivo', 400, 24, 748], B: ['werke von marti, brunner, weiss', 400, 24], C: [20, 400, 940], E: [px(3), 156, 20, 400] },
  { A: ['Eintritt Fr. 3.–', 'DMSerif', 400, 36, 820], B: ['eintritt fr. 3.–', 600, 36], C: [20, 400, 966], E: [px(3), 182, 20, 400] },
  { A: ['— Nur ein Abend —', 'Fraktur', 400, 44, 900], B: ['nur ein abend', 800, 44], cut: 13.5 },
];
const T_TXT_IN = 8.0, T_FONT = 10.0, T_COMPACT = 15.0, T_ALIGN = 16.0;
const TXC = TX.filter(z => z.C);
function drawPosterText(g, t) {
  if (t < T_TXT_IN) return;
  TX.forEach((d, i) => {
    const pin = snap(t, T_TXT_IN + i * E16 + E16, E16);
    if (pin <= 0) return;
    const useB = t >= T_FONT;
    let text = useB ? d.B[0] : d.A[0], fam = useB ? 'Archivo' : d.A[1], wt = useB ? d.B[1] : d.A[2];
    let size = useB ? d.B[2] : d.A[3], y = d.A[4], collapse = 1, xl = null;
    if (d.cut) { if (t > d.cut + E8) return; collapse = 1 - snap(t, d.cut + E8, E8); }
    if (d.C) {
      const kc = TXC.indexOf(d), pc = snap(t, T_COMPACT + kc * E16 * .5, E8 * 2);
      size = lerp(size, d.C[0], pc); y = lerp(y, d.C[2], pc); if (pc > .5) wt = d.C[1];
      font(g, wt, size, fam);
      xl = lerp(PW / 2 - textW(g, text) / 2, PMX, snap(t, T_ALIGN, E8 * 2));
      const pf = snap(t, T.txtFinal + kc * E16, E8);
      if (pf > 0) { xl = lerp(xl, d.E[0], pf); y = lerp(y, d.E[1], pf); size = lerp(size, d.E[2], pf); if (pf > .5) wt = d.E[3]; }
    }
    font(g, wt, size, fam); g.fillStyle = C.ink;
    if (d.split && t >= T.txtFinal - E8) {      // title split into two lines: musik drops to the second line
      const pf = snap(t, T.txtFinal, E8), w1 = text.split(' ')[0];
      const x2 = lerp(xl + textW(g, w1 + ' '), d.split[0], pf), y2 = lerp(y, d.split[1], snap(t, T.txtFinal + E16, E8));
      g.fillText(w1, xl, y); g.fillText(text.slice(w1.length + 1), x2, y2);
      return;
    }
    const w = textW(g, text), x0 = xl ?? (PW / 2 - w / 2);
    g.save();
    if (collapse < 1) { const m = y - size * .35; g.translate(0, m); g.scale(1, Math.max(.001, collapse)); g.translate(0, -m); }
    g.beginPath(); g.rect(x0 - 10, y - size * 1.1, w + 20, size * 1.45 * pin); g.clip();
    g.fillText(text, x0, y);
    g.restore();
    if (d.cut && t > d.cut - E16 && t < d.cut + E8) {   // knife line
      g.fillStyle = C.ink; g.fillRect(PMX - 10, y - size * .35 - 1, (PW - 2 * PMX + 20) * lin(t, d.cut - E16, d.cut), 2);
    }
  });
}

// ======================================================================
// score units: 16 one-cell black blocks, from a rigid staircase → the final phrase (adjacent cells merge into long bars; the first bleeds off the top, the last bleeds off the right)
let UNITS = [];
function buildUnits() {
  const slots = [];
  S.final.lead.forEach(([c, r, l], bi) => { for (let j = 0; j < l; j++) slots.push({ c, r: r + j, first: j === 0, last: j === l - 1, bar: bi }); });
  slots.sort((a, b) => a.r - b.r || a.c - b.c);
  const [fcx, fcy] = circleFinalCenter();
  UNITS = S.stiff.lead.map(([c, r], k) => ({ s: { c, r }, f: slots[k] }));
  UNITS.map((u, k) => [k, Math.hypot(px(u.s.c) + CW / 2 - fcx, py(u.s.r) + RH / 2 - fcy)]).sort((a, b) => a[1] - b[1]).forEach(([k], rank) => UNITS[k].rank = rank);
}
function rectOf(c, r, first = true, last = true, bar = -1) {
  let x0 = px(c) + 4, x1 = px(c) + CW - 4, y0 = first ? py(r) + 3 : py(r) - 1, y1 = last ? py(r + 1) - 3 : py(r + 1) + 1;
  const bl = S.final.bleed && S.final.bleed[bar];
  if (bl === 'top' && first) y0 = -2;
  if (bl === 'right') x1 = PW + 2;
  return [x0, y0, x1 - x0, y1 - y0];
}
const barOn = (bar, row) => { const b = S.final.lead[bar]; return row >= b[1] && row < b[1] + b[2]; };
function drawUnits(g, t, playRow) {
  for (let k = 0; k < UNITS.length; k++) {
    const u = UNITS[k], pin = snap(t, T.run + k * E16 + E16, E16);
    if (pin <= 0) continue;
    let R = rectOf(u.s.c, u.s.r);
    const pf = snap(t, T.reflow + Math.floor(u.rank / 2) * E16, E8);
    if (pf > 0) { const F = rectOf(u.f.c, u.f.r, u.f.first, u.f.last, u.f.bar); R = R.map((v, j) => lerp(v, F[j], pf)); }
    g.fillStyle = playRow != null && barOn(u.f.bar, playRow) ? C.red : C.ink;
    g.fillRect(R[0], R[1], R[2], R[3] * pin);
  }
}
function drawBass(g, t) {
  const p0 = lin(t, 16.0, 17.0);
  if (p0 <= 0) return;
  [[0, 0, 8], [0, 8, 4], [0, 12, 4]].forEach(([c, r, l], i) => {
    const [fc, fr, fl] = S.final.bass[i], q = snap(t, T.reflow + E8 + i * E8, E8);
    const cc = lerp(c, fc, q), rr = lerp(r, fr, q), ll = lerp(l, fl, q);
    const y0 = py(rr), y1 = Math.min(py(rr + ll), PM + (SCORE_B - PM) * p0);
    if (y1 > y0) { g.fillStyle = C.bass; g.fillRect(px(cc), y0, CW, y1 - y0); }
  });
}

// ======================================================================
// red circle: rigid position = top-right cell (2-column diameter); final = bottom left, 4-column diameter, bleeding off the left, overlapped by the title
const D0 = () => CW * S.circleDiameterCols.stiff, D1 = () => CW * S.circleDiameterCols.final;
function circleFinalCenter() { const [c, r] = S.final.circle, d = CW * S.circleDiameterCols.final; return [px(c) + d / 2, py(r) + d / 2]; }
export function flight(t) { return lin(t, T.fly0, T.pause[0]) * .4 + lin(t, T.pause[1], T.land) * .6; }
export function circleState(t) {   // → [left, top, d] (poster-local pixels)
  const [c0, r0] = S.stiff.circle, [c1, r1] = S.final.circle, d0 = D0(), d1 = D1();
  let x0 = px(c0) + .25 * CW * (snap(t, T.hes, E16) - snap(t, T.hes + .375, E16)), y0 = py(r0);
  y0 = lerp(-d0 - 4, y0, snap(t, T.circleIn, BEAT));     // entrance: drops from the poster's top edge down its own column
  const a = flight(t), d = lerp(d0, d1, a);
  const cx = lerp(x0 + d0 / 2, px(c1) + d1 / 2, a), cy = lerp(y0 + d0 / 2, py(r1) + d1 / 2, a);
  return [cx - d / 2, cy - d / 2, d];
}
function drawCircle(g, t, pulse) {
  if (t < T.circleIn - BEAT) return;
  const [l, tp, d] = circleState(t), cx = l + d / 2, cy = tp + d / 2;
  if (t > T.fly0 && t < T.gridOff + E8) {      // the empty cell and track left behind after it leaves (1.5 px red line)
    const [c0, r0] = S.stiff.circle, d0 = D0(), gx = px(c0) + d0 / 2, gy = py(r0) + d0 / 2;
    const k = 1 - snap(t, T.gridOff + E8, E8);
    g.strokeStyle = C.red; g.lineWidth = 1.5;
    g.beginPath(); g.arc(gx, gy, d0 / 2 * k, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(lerp(gx, cx, 1 - k), lerp(gy, cy, 1 - k)); g.lineTo(cx, cy); g.stroke();
  }
  g.fillStyle = C.red; g.beginPath(); g.arc(cx, cy, d / 2, 0, Math.PI * 2); g.fill();
  if (pulse > 0 && pulse < 1) {    // hit by the playhead: a ring of red line spreads outward
    g.strokeStyle = C.red; g.lineWidth = 6 * (1 - pulse);
    g.beginPath(); g.arc(cx, cy, d / 2 + 70 * E(pulse), 0, Math.PI * 2); g.stroke();
  }
}

// ======================================================================
// poster grid lines
function gridState(t) {
  const v = [], h = [];
  const off1 = seg(t, 20.0, 20.5), on2 = seg(t, 24.0, 24.5), off2 = seg(t, T.gridOff, T.gridOff + .5), off3 = seg(t, 36.0, 36.4);
  for (let c = 0; c <= NC; c++) {
    const p1 = lin(t, 4.0 + c * E8, 4.0 + c * E8 + E8), p3 = lin(t, T.rot + c * E16 * .5, T.rot + c * E16 * .5 + E8);
    v.push(t < 22 ? p1 * (1 - off1) : t < 29 ? on2 * (1 - off2) : p3 * (1 - off3));
  }
  for (let r = 0; r <= 16; r++) {
    const p1 = lin(t, 5.625 + r * E16, 5.625 + r * E16 + E8), p3 = lin(t, T.rot + .125 + r * E16 * .25, T.rot + .125 + r * E16 * .25 + E8);
    h.push(t < 22 ? p1 * (1 - off1) : t < 29 ? on2 * (1 - off2) : p3 * (1 - off3));
  }
  const ext = t < 29 ? E(on2) * (1 - E(off2)) : E(seg(t, T.rot, T.rot + .5)) * (1 - E(off3));
  return { v, h, ext };
}
function drawPosterGrid(g, t, G, stroke) {
  g.strokeStyle = stroke; g.lineWidth = 1; g.beginPath();
  const bOff = seg(t, 20.0, 20.5);
  if (t < 22) for (let k = 0; k <= 10; k++) {
    const p = lin(t, 7.0 + k * E16 * .5, 7.0 + k * E16 * .5 + E8) * (1 - bOff), y = 713 + k * 26 + .5;
    if (p > 0) { g.moveTo(PMX, y); g.lineTo(PMX + (PW - 2 * PMX) * p, y); }
  }
  G.v.forEach((p, c) => { if (p > 0) { g.moveTo(px(c) + .5, PM); g.lineTo(px(c) + .5, PM + (SCORE_B - PM) * p); } });
  G.h.forEach((p, r) => { if (p > 0) { g.moveTo(PMX, py(r) + .5); g.lineTo(PMX + (PW - 2 * PMX) * p, py(r) + .5); } });
  g.stroke();
}
function drawGridExt(g, G) {       // grid extends beyond the poster to fill the frame
  if (G.ext <= 0) return;
  const L = 2600 * G.ext;
  g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath();
  for (let c = 0; c <= NC; c++) { g.moveTo(px(c) + .5, 0); g.lineTo(px(c) + .5, -L); g.moveTo(px(c) + .5, PH); g.lineTo(px(c) + .5, PH + L); }
  for (let r = 0; r <= 16; r++) { g.moveTo(0, py(r) + .5); g.lineTo(-L, py(r) + .5); g.moveTo(PW, py(r) + .5); g.lineTo(PW + L, py(r) + .5); }
  g.stroke();
}

// ======================================================================
// camera: poster centre, zoom, rotation
const SPREAD = [1471, 540, 1, 0];
const CAM = track([
  [0, SPREAD],
  [T.pageOut, [860, 540, 1, 0], BEAT],
  [T.rot, [960, 540, 1.34, -Math.PI / 2], T.rotD],
  [T.wall, [960, 452, 0.42, 0], T.wallD],
  [T.home, SPREAD, BEAT],
]);
export function posterMatrix(t) {
  const [cx, cy, s, r] = CAM(t);
  return new DOMMatrix().translate(cx, cy).rotate(r * 180 / Math.PI).scale(s).translate(-PW / 2, -PH / 2);
}

// ======================================================================
// left page: giant numeral, rule annotation, annotation lines, bar counter
const RULES = [[4.0, '1', 'Grid'], [8.0, '2', 'Typeface'], [12.0, '3', 'Space'], [16.0, '4', 'Alignment'], [22.0, '5', 'Exception']];
let NUM_SIZE = 980, NUM_ASC = 0.72;
export function measureNumeral(g) { font(g, 700, 100); NUM_ASC = g.measureText('4').actualBoundingBoxAscent / 100; NUM_SIZE = Math.round(700 / NUM_ASC); }
function drawNumeral(g, t) {
  const base = 1044, h = NUM_SIZE * NUM_ASC;
  for (let i = 0; i < RULES.length; i++) {
    const [tr, n] = RULES[i], tn = RULES[i + 1] ? RULES[i + 1][0] : 99;
    if (t < tr || t > tn + .01) continue;
    const up = steps(t, tr, tr + BEAT, 4), down = snap(t, tn, E8 * 2);
    g.save(); g.beginPath(); g.rect(0, base - h - 40, 1100, h + 40); g.clip();
    font(g, 700, NUM_SIZE); g.fillStyle = C.ink;
    const lsb = -g.measureText(n).actualBoundingBoxLeft;       // optical left alignment
    g.fillText(n, fx(0) - lsb, base + (1 - up) * (h + 40) + down * (h + 40));
    g.restore();
  }
}
const NOTES = [
  ['Columns 7', 'Rows 16', 'Module 91 × 40'],
  ['Family Archivo', 'Weights 400–800', 'Voices 1'],
  ['Lines removed 4', 'White space 62 %', ''],
  ['Axis flush left', 'Every edge on a line', ''],
  ['Exceptions 1', '', ''],
];
function drawRuleNotes(g, t) {
  const ri = RULES.findLastIndex(r => t >= r[0]); if (ri < 0) return;
  const tr = RULES[ri][0], tn = RULES[ri + 1] ? RULES[ri + 1][0] : 99, q = snap(t, tn, E8);
  font(g, 500, 19); g.fillStyle = C.ink;
  NOTES[ri].forEach((s, i) => { if (s) revealText(g, s, fx(4), 992 + i * 26, 19, snap(t, tr + BEAT + i * E16, E16), q); });
  g.fillRect(fx(4), 962, FC * 2 + FG, 1);
}
function captionRow(g, x, p, q, a, b, c) {
  g.fillStyle = C.ink; g.fillRect(fx(0) + x, 36, (fx(5) + FC - fx(0)) * p * (1 - q), 1);
  font(g, 500, 19);
  revealText(g, a, fx(0) + x, 66, 19, p, q); revealText(g, b, fx(2) + x, 66, 19, p, q); revealText(g, c, fx(4) + x, 66, 19, p, q);
}
function drawCaptions(g, t) {
  if (t < 2.0 || t > T.rot + .1) return;
  const p = snap(t, 2.0 + E8, E8), q = snap(t, T.rot - T.rotD + E8, E8);
  const ri = RULES.findLastIndex(r => t >= r[0]);
  if (ri < 0) captionRow(g, 0, p, q, 'A programme in five steps', '1961', '♩ = 120');
  else captionRow(g, 0, p, q, 'Five Rules for a Poster', `Rule 0${RULES[ri][1]} / 05`, RULES[ri][2]);
}
function drawBarCounter(g, t, pageX) {
  if (t < 4) return;
  const bar = Math.floor(t / BAR) + 1, beat = Math.floor((t % BAR) / BEAT) + 1;
  font(g, 500, 18); g.fillStyle = C.mute; g.fillText('♩ = 120', fx(6) + pageX, 1016);
  g.fillStyle = C.ink; font(g, 600, 18); g.fillText(`bar ${String(bar).padStart(2, '0')}.${beat}`, fx(6) + pageX, 1044);
}

// ======================================================================
// opening: red line + grid columns + title
function drawOpening(g, t) {
  if (t > 8.3) return;
  const Y = 300;
  for (let c = 0; c < 12; c++) {     // grid columns: grow up and down at once from the red line (one column per sixteenth note); retract when rule one ends
    const p = snap(t, .5 + c * E16 + E16, E16) * (1 - snap(t, 8.0 + (11 - c) * E16 * .25, E8));
    if (p > 0) { g.fillStyle = C.col; g.fillRect(fx(c), Y - Y * p, FC, Y * p + (H - Y) * p); }
  }
  if (t > 4.2) return;
  const pr = lin(t, 0, .5), pout = snap(t, 4.0, E8 * 2);
  if (pr > 0 && pout < 1) { g.fillStyle = C.red; g.fillRect(W * pout, Y, W * (pr - pout), 3); }
  const q = snap(t, 3.875 + E8, E8);
  font(g, 700, 120); g.fillStyle = C.ink;
  let x = fx(0); ['Five', 'Rules'].forEach((w, i) => { revealText(g, w, x, 168, 120, snap(t, 2.0 + i * E8 + E16, E16), q); x += textW(g, w + ' '); });
  x = fx(0); ['for', 'a', 'Poster'].forEach((w, i) => { revealText(g, w, x, 276, 120, snap(t, 2.5 + i * E8 + E16, E16), q); x += textW(g, w + ' '); });
}

// ======================================================================
// poster wall: the same system, each poster breaks a different rule (the rebel elements are all red)
const GAP = 80, SLOT = PW + GAP;
const VAR = [
  { k: -2, head: ['klang'], sub: 'konzert 1962', lead: [[0, 2, 2], [1, 4, 1], [2, 5, 3], [4, 8, 2], [5, 10, 1], [6, 11, 3]], bass: [[0, 0, 8], [4, 8, 8]], circ: [4, 1], rebel: 'typeface', label: 'breaks rule 2 · typeface' },
  { k: -1, head: ['takt'], sub: 'konzert 1963', lead: [[0, 0, 1], [1, 1, 1], [2, 2, 4], [3, 6, 1], [4, 7, 1], [5, 8, 4], [6, 12, 2]], bass: [[0, 0, 16]], circ: null, rebel: 'space', label: 'breaks rule 3 · space' },
  { k: 0, label: 'breaks rule 1 · grid', ours: true },
  { k: 1, head: ['stille'], sub: 'konzert 1964', lead: [[0, 0, 6], [3, 8, 1], [6, 12, 4]], bass: [[0, 6, 6]], circ: [4, 2], rebel: 'align', label: 'breaks rule 4 · alignment' },
  { k: 2, head: ['puls'], sub: 'konzert 1965', lead: [[0, 1, 2], [2, 3, 2], [1, 6, 3], [4, 7, 2], [3, 10, 3], [6, 12, 2]], bass: [[2, 0, 8], [5, 8, 8]], circ: [0, 11], rebel: 'all', label: 'breaks all five' },
];
function drawVariant(g, v) {
  g.save(); g.translate(v.k * SLOT, 0);
  g.fillStyle = C.paper; g.fillRect(0, 0, PW, PH);
  g.beginPath(); g.rect(0, 0, PW, PH); g.clip();
  const chaos = v.rebel === 'all';
  v.bass.forEach(([c, r, l]) => { g.fillStyle = C.bass; g.fillRect(px(c), py(r), CW, l * RH); });
  if (v.rebel === 'space') { g.fillStyle = C.red; g.fillRect(px(3), py(0), PW - px(3) + 2, py(8) - py(0)); }   // the white space is filled
  v.lead.forEach(([c, r, l], i) => {
    g.save();
    if (chaos) { g.translate(px(c) + CW / 2, py(r)); g.rotate((i % 2 ? .35 : -.25)); g.translate(-(px(c) + CW / 2), -py(r)); }
    g.fillStyle = C.ink; g.fillRect(px(c) + 4, py(r) + 3, CW - 8, l * RH - 6);
    g.restore();
  });
  if (v.circ) {
    const d = 2 * CW, [c, r] = v.circ;
    g.fillStyle = chaos ? C.red : C.ink;
    const ox = chaos ? 57 : 0, oy = chaos ? 23 : 0;
    g.beginPath(); g.arc(px(c) + d / 2 + ox, py(r) + d / 2 + oy, d / 2, 0, Math.PI * 2); g.fill();
  }
  // title
  const head = v.head[0];
  if (v.rebel === 'typeface') { font(g, 400, 190, 'Fraktur'); g.fillStyle = C.red; g.fillText('Klang', PMX, 960); }
  else if (chaos) {
    font(g, 400, 150, 'DMSerif'); g.fillStyle = C.ink; g.save(); g.translate(PW / 2, 900); g.rotate(-.12); g.textAlign = 'center'; g.fillText('Puls!', 0, 0); g.restore();
    font(g, 400, 60, 'Fraktur'); g.textAlign = 'center'; g.fillText('Konzert 1965', PW / 2, 990); g.textAlign = 'left';
  } else if (v.rebel === 'align') { font(g, 800, 170); g.fillStyle = C.red; g.fillText(head, PW - PMX - textW(g, head) + 6, 973); }   // title not flush left
  else { font(g, 800, 170); g.fillStyle = C.ink; g.fillText(head, PMX, 973); }
  // info block
  const info = [v.sub, 'freitag · 20.15 uhr', 'kleiner saal', 'eintritt fr. 3.–'];
  if (!chaos) info.forEach((s, i) => {
    font(g, i ? 500 : 700, i ? 20 : 32);
    let x = px(3), y = i ? 78 + i * 26 : 64;
    g.fillStyle = C.ink;
    g.fillText(s, x, y);
  });
  else { font(g, 700, 34, 'DMSerif'); g.fillStyle = C.ink; g.textAlign = 'center'; g.fillText('freitag 20.15 uhr', PW / 2 + 60, 120); g.textAlign = 'left'; }
  g.restore();
}
// the wall labels
function drawWallLabels(g, t, M) {
  if (t < T.wall || t > T.cut + .01) return;
  VAR.forEach((v, i) => {
    const q = M.transformPoint(new DOMPoint(v.k * SLOT, PH + 60));
    font(g, v.ours ? 700 : 500, 22); g.fillStyle = v.ours ? C.red : C.ink;
    revealText(g, v.label, q.x, q.y + 20, 22, snap(t, T.wall + E8 + i * E16, E16), snap(t, T.cut, E8));
  });
}

// ======================================================================
// end card
function drawEndCard(g, t, opt = {}) {
  if (t < T.cut) return;
  if (t < T.home - E8) return;
  const p = snap(t, T.home + E8, E8);
  if (opt.poster) {      // poster: the film title as main headline
    captionRow(g, 0, 1, 0, 'Swiss Motion Graphics', 'A Lemo-Opuscar film', 'LemoLab \u00d7 Claude Opus 5.5');
    font(g, 700, 120); g.fillStyle = C.ink; g.fillText('Five Rules', fx(0), 168); g.fillText('for a Poster', fx(0), 276);
    font(g, 500, 19); ['Typeface Archivo', 'Score A dorian \u00b7 120 bpm', 'Grid 7 \u00d7 16'].forEach((s, i) => g.fillText(s, fx(4), 992 + i * 26));
    g.fillRect(fx(4), 962, FC * 2 + FG, 1);
    return;
  }
  captionRow(g, 0, p, 0, 'Five Rules for a Poster', 'A Lemo-Opuscar film', '2026');
  font(g, 700, 120); g.fillStyle = C.ink;
  let x = fx(0); ['Swiss', 'Motion'].forEach((w, i) => { revealText(g, w, x, 168, 120, snap(t, T.home + E8 + i * E8, E16)); x += textW(g, w + ' '); });
  x = fx(0); revealText(g, 'Graphics', x, 276, 120, snap(t, T.home + E8 + 2 * E8, E16));
  font(g, 600, 36); revealText(g, 'LemoLab × Claude Opus 5.5', fx(0), 372, 36, snap(t, T.home + BEAT * 2, E16));
  font(g, 500, 19); g.fillStyle = C.ink;
  // the last two lines are the licence credit for the drum samples (fine print); the list comes in early enough to hold ≥ 2.5 s
  ['Typeface Archivo', 'Score A dorian · 120 bpm', 'Voice Kokoro af_sarah', 'Drums MuldjordKit', 'Lars Muldjord · CC BY 4.0'].forEach((s, i) => revealText(g, s, fx(4), 940 + i * 26, 19, snap(t, T.home + BEAT * 1.5 + i * E16, E16)));
  g.fillRect(fx(4), 910, (FC * 2 + FG) * snap(t, T.home + BEAT * 1.5, E8), 1);
}

// ======================================================================
// main render
export function renderFilm(g, t, opt = {}) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';
  drawOpening(g, t);

  const pageX = -1200 * snap(t, T.pageOut, BEAT);
  if (pageX > -1190) {
    g.save(); g.translate(pageX, 0);
    drawNumeral(g, t); drawRuleNotes(g, t);
    for (const L of LINES) if (L.pos === 'page') drawLine(g, L, t, fx(0), 168, 252);
    g.restore();
    drawBarCounter(g, t, pageX);
  }
  drawCaptions(g, t);
  if (t >= T.home - BEAT) { g.fillStyle = C.red; g.fillRect(0, lerp(452, 300, snap(t, T.home, BEAT)), W, 3); }   // the red line drops to the title line (behind the poster)

  if (t >= 3.5 - E8) {
    const M = posterMatrix(t);
    g.setTransform(M);
    // poster wall (appears only on the pull-out; cut away by the red line at 39.0)
    if (t > 36.0 && t < T.home) {
      const cutX = lin(t, T.cut, T.cut + .5) * W;
      {   // wall panels: cut away where the red line passes (left to right in screen space)
        const a = M.transformPoint(new DOMPoint(-2 * SLOT - 120, -110)), b = M.transformPoint(new DOMPoint(2 * SLOT + PW + 120, PH + 110));
        const x0 = Math.max(Math.min(a.x, b.x), t > T.cut ? cutX : -1e9), x1 = Math.max(a.x, b.x);
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (Math.abs(M.b) < 1e-6 && x1 > x0) { g.fillStyle = C.wall; g.fillRect(x0, Math.min(a.y, b.y), x1 - x0, Math.abs(b.y - a.y)); }
        else if (Math.abs(M.b) >= 1e-6) { g.setTransform(M); g.fillStyle = C.wall; g.fillRect(-2 * SLOT - 120, -110, 4 * SLOT + PW + 240, PH + 220); }
        g.setTransform(M);
      }
      for (const v of VAR) {
        if (v.ours) continue;
        const sx = M.transformPoint(new DOMPoint(v.k * SLOT + PW / 2, PH / 2)).x;
        const tc = T.cut + .5 * clamp(sx / W), k = 1 - snap(t, tc + E8, E8);
        if (k <= 0) continue;
        g.save(); g.translate(0, PH / 2); g.scale(1, k); g.translate(0, -PH / 2); drawVariant(g, v); g.restore();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = C.red; if (t > T.cut && t < T.home - BEAT) g.fillRect(0, 452, cutX, 3);
      g.setTransform(M);
    }
    const G = gridState(t);
    drawGridExt(g, G);
    const pin = snap(t, 3.5, E8);
    g.fillStyle = C.paper; g.fillRect(0, 0, PW, PH * pin);
    g.save(); g.beginPath(); g.rect(0, 0, PW, PH * pin); g.clip();
    drawPosterGrid(g, t, G, t < 21 ? '#C9C8C2' : C.pgrid);
    drawBass(g, t);
    const playRow = (t >= T.sweep && t < T.sweep + 4) ? (t - T.sweep) / E8 : null;
    drawUnits(g, t, playRow);
    const cr = S.final.circle[1];
    drawCircle(g, t, playRow != null ? seg(playRow, cr, cr + 4) : 0);
    drawPosterText(g, t);
    g.restore();
    // playhead: drawn vertically at 31.75, sweeps linearly 32–36, retracts at 36
    const ph = seg(t, T.sweep - BEAT / 2, T.sweep) * (1 - seg(t, T.sweep + 4, T.sweep + 4 + E8));
    if (ph > 0) {
      const row = clamp((t - T.sweep) / E8, 0, 16);
      g.fillStyle = C.red; g.fillRect(-24, py(row) - 2, (PW + 48) * ph, 4);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawScoreLabels(g, t, M);
    drawWallLabels(g, t, M);
  }
  drawHUD(g, t);
  drawEndCard(g, t, opt);
  if (!opt.nosub) for (const L of LINES) {
    if (L.pos === 'center') drawLine(g, L, t, fx(0), 780, 848);
    if (L.pos === 'wall') drawLine(g, L, t, fx(0), 928, 1004);
  }
}

// note names and bar numbers after the rotation reveal (upright text, drawn in screen coordinates)
function drawScoreLabels(g, t, M) {
  const q = snap(t, 36.0 + E8, E8);
  if (t < T.labels || q >= 1) return;
  const used = new Set(S.final.lead.map(n => n[0]));
  font(g, 700, 26);
  for (let c = 0; c < NC; c++) {
    const pt = M.transformPoint(new DOMPoint(px(c) + CW / 2, -22));
    g.fillStyle = used.has(c) ? C.ink : C.mute;
    revealText(g, S.cols[c], pt.x - textW(g, S.cols[c]) - 6, pt.y + 9, 26, snap(t, T.labels + E16 + c * E16 * .5, E16), q);
  }
  font(g, 600, 22);
  [0, 8].forEach((r, i) => {
    const pt = M.transformPoint(new DOMPoint(PW + 16, py(r)));
    g.fillStyle = C.ink; revealText(g, `bar ${i + 1}`, pt.x, pt.y - 10, 22, snap(t, T.labels + BEAT + i * E8, E16), q);
  });
}
// coordinate readout during the escape (close to the poster's right edge)
function drawHUD(g, t) {
  const p = snap(t, T.fly0, E8) * (1 - snap(t, T.gridOff + E8, E8));
  if (p <= 0) return;
  const [l, tp] = circleState(t), c = (l - PMX) / CW, r = (tp - PM) / RH;
  const on = t < T.fly0 + .01, x = 1290;
  font(g, 500, 26); g.fillStyle = C.mute;
  revealText(g, 'col', x, 500, 26, p); revealText(g, 'row', x, 540, 26, p);
  font(g, 700, 26); g.fillStyle = C.ink;
  revealText(g, (c < 0 ? '−' : '') + Math.abs(c).toFixed(2), x + 80, 500, 26, p); revealText(g, r.toFixed(2), x + 80, 540, 26, p);
  g.fillStyle = on ? C.ink : C.red; font(g, 700, 26);
  revealText(g, on ? 'on grid' : 'off grid', x, 596, 26, p);
  g.fillStyle = C.ink; g.fillRect(x, 460, 240 * p, 1);
}

// ======================================================================
// sound events (foley), exported by events.mjs for mix.py
export function buildEvents() {
  const ev = [], add = (t, type, o = {}) => ev.push({ t: +t.toFixed(4), type, ...o });
  add(0, 'knife', { g: 1 });
  for (let c = 0; c < 12; c++) add(.5 + c * E16 + E16 * .5, 'rule', { g: .5 });
  [2.0, 2.25, 2.5, 2.75, 3.0].forEach(t => add(t, 'clack', { g: .9 }));
  add(3.5, 'paper', { g: 1 });
  RULES.forEach(([tr]) => { for (let i = 1; i <= 4; i++) add(tr + i * BEAT / 4, 'thunk', { g: .45 + .15 * (i === 4) }); });
  for (let c = 0; c <= NC; c++) add(4.0 + c * E8 + E8, 'rule', { g: .7 });
  for (let r = 0; r <= 16; r++) add(5.625 + r * E16 + E8, 'rule', { g: .45 });
  for (let i = 0; i < TX.length; i++) add(T_TXT_IN + i * E16 + E16, 'clack', { g: .7 });
  add(T_FONT, 'clackBig', { g: 1 });
  TX.forEach(d => { if (d.cut) add(d.cut, 'knife', { g: .8 }); });
  TXC.forEach((d, k) => add(T_COMPACT + k * E16 * .5, 'slide', { g: .5 }));
  add(T_ALIGN, 'clackBig', { g: .9 }); add(16.0, 'slide', { g: .7 });
  for (let k = 0; k < 16; k++) add(T.run + k * E16 + E16, 'snap', { g: .5 });
  add(T.circleIn, 'thump', { g: 1 });
  add(T.hes + E16, 'tick', { g: .7 }); add(T.hes + .375 + E16, 'tick', { g: .6 });
  add(24.0, 'slide', { g: 1 });
  add(T.land, 'thump', { g: 1.1 });
  for (let i = 0; i < 8; i++) add(T.reflow + i * E16, 'snap', { g: .6 });
  TXC.forEach((d, k) => add(T.txtFinal + k * E16, 'clack', { g: .6 }));
  add(T.rot - T.rotD, 'swish', { g: 1, d: T.rotD });
  for (let c = 0; c < NC; c++) add(T.labels + E16 + c * E16 * .5, 'tick', { g: .35 });
  add(T.sweep - BEAT / 2, 'rule', { g: .8 });
  add(36.0, 'swish', { g: .8, d: 1.0 });
  add(T.cut, 'knife', { g: 1.1 });
  add(T.home - BEAT, 'swish', { g: .6, d: BEAT });
  for (let i = 0; i < 4; i++) add(T.home + E8 + i * E8, 'clack', { g: .7 });
  LINES.forEach(L => add(L.t, 'voice', { id: L.id }));
  return ev.sort((a, b) => a.t - b.t);
}
