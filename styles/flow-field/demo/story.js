// Everything printed or pinned on the chart, by film time: title block, place names, the storm's tag, the best track,
// the grade table (verdict), landfall tags, the intensity curve and the end card. Also the sound events (window.EV).
import { toXY, toLL, wind } from './field.js';
import { GRADES, gradeOf } from './wind.js';
import { FONT, INK, VERM } from './overlay.js';
import { SCS } from './scs.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = x => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const win = (t, a, b, f = 0.4) => sstep(a, a + f, t) * (1 - sstep(b - f, b, t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ---- key times (film seconds)
export const T = {
  titleIn: -1, titleOut: 4.4,
  tagRoll0: 4.7, tagLand: 8.6, tagOut: 13.9,
  track0: 11.9, track1: 13.9,
  table0: 18.7, tableFull: 19.85, pointer0: 22.6, pointer1: 23.45, tableOut: 26.0,
  land1: 29.2, land2: 36.0, beibu: 37.4, land3: 41.4,
  curve0: 44.5, curve1: 45.3,     // the curve prints once the pull-back has settled (clear of the captions)
  card: 44.75, end: 49.0,
};
const BJT = s => { const [m, d, h] = s.split('-'); return { m: +m, d: +d, h: +h }; };

let PATH = null, REC = [], ANCH = {};
export function prepStory(C) {
  prepInset(C.INSET);
  const { storm, tauOf, camAt, TRACK } = C;
  PATH = []; for (let τ = 0; τ <= 168.001; τ += 0.5) { const S = storm(τ); PATH.push([τ, S.X, S.Y]); }
  // when the drawn track reaches each record (film time), from a fine scan of τd(t)
  REC = TRACK.map(r => ({ τ: r[0], lat: r[1], lon: r[2], pc: r[3], v: r[4], grade: r[5], bjt: BJT(r[6]), xy: toXY(r[2], r[1]), t: null }));
  for (let k = 0; k <= 49 * 240; k++) { const t = k / 240, d = trackTau(t, tauOf); for (const r of REC) if (r.t === null && d !== null && d >= r.τ - 1e-6) r.t = t; }
  // the title block is printed where the push-in leaves it in view
  const c = camAt(3.9); ANCH.title = c.ray(130, 700); ANCH.titleK = 1 / c.ppkAt(ANCH.title[0], ANCH.title[1]);
  ANCH.titleRot = -c.head;
}
function trackTau(t, tauOf) {
  if (t < T.track0) return null;
  const τ = tauOf(t); if (t >= T.track1) return τ;
  return lerp(0, τ, ease((t - T.track0) / (T.track1 - T.track0)));
}

// ---------------------------------------------------------------- pieces
function typhoonSymbol(g, x, y, r, col, a, lw = 2.4) {
  g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  for (const s of [1, -1]) {   // two arms trailing clockwise outward (anticlockwise rotation, northern hemisphere)
    g.beginPath(); g.moveTo(x, y - s * r); g.bezierCurveTo(x + s * r * 0.9, y - s * r * 1.15, x + s * r * 1.7, y - s * r * 0.9, x + s * r * 1.9, y - s * r * 0.05); g.stroke();
  }
  g.restore();
}
function pin(C, cam, lon, lat, lines, o) {   // a ground point with a tick and a label beside it
  const { g, OV } = C, a = o.alpha; if (a <= 0.003) return;
  const [X, Y] = toXY(lon, lat), p = cam.project(X, Y, 0); if (!p) return;
  g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = a; g.strokeStyle = INK; g.fillStyle = INK;
  g.lineWidth = 1.6; g.beginPath(); g.arc(p[0], p[1], 4.5, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(p[0], p[1], 1.6, 0, Math.PI * 2); g.fill();
  const dx = o.dx ?? 14, dy = o.dy ?? -10;
  if (o.leader) { g.lineWidth = 1.1; g.beginPath(); g.moveTo(p[0] + Math.sign(dx) * 6, p[1] + Math.sign(dy) * 4); g.lineTo(p[0] + dx - Math.sign(dx) * 4, p[1] + dy + 6); g.stroke(); }
  g.restore();
  let y = p[1] + dy;
  for (const L of lines) {
    OV.stext(L.s, p[0] + dx, y, { font: L.f, size: L.z, color: L.c || INK, alpha: a, id: L.id, align: dx < 0 ? 'right' : 'left', halo: 4, weight: L.w, track: L.tr });
    y += L.lh || L.z * 1.15;
  }
}

// the storm's tag: rolling through the records while the storm intensifies, then landing on one record
function stormTag(C, cam, S, t, τ) {
  const { g, OV } = C, a = win(t, T.tagRoll0, T.tagOut, 0.35); if (a <= 0) return;
  const p = cam.project(S.X, S.Y, 0); if (!p) return;
  let r = REC[0]; for (const q of REC) if (q.τ <= τ + 1e-6) r = q;
  if (t >= T.tagLand) r = REC.find(q => q.τ === 96);
  const landed = t >= T.tagLand, gi = gradeOf(r.v), gr = GRADES[gi];
  const ox = p[0] + 150, oy = p[1] - 210;
  g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = a; g.strokeStyle = INK; g.lineWidth = 1.3;
  const er = Math.max(18, S.rmax * cam.ppkAt(S.X, S.Y) * 0.9);
  g.beginPath(); g.moveTo(p[0] + er * 0.7, p[1] - er * 0.7); g.lineTo(ox - 24, oy + 106); g.lineTo(ox + 330, oy + 106); g.stroke();
  g.restore();
  const al = landed ? a : a * 0.9, ID = landed ? 'tag' : null;
  const date = `9月${r.bjt.d}日 ${String(r.bjt.h).padStart(2, '0')}时`, dEn = `${r.bjt.d} Sep, ${String(r.bjt.h).padStart(2, '0')}:00 Beijing time`;
  OV.stext(date, ox, oy - 4, { font: FONT.zh, size: 36, weight: 600, alpha: al, id: ID && 'tag-d', halo: 5 });
  OV.stext(dEn, ox, oy + 30, { font: FONT.it, size: 25, alpha: al, id: ID && 'tag-de', halo: 5 });
  OV.stext(`${r.v} m/s · ${r.pc} hPa`, ox, oy + 88, { font: FONT.mono, size: 38, color: rgb(gi >= 3 ? gr.col : [38, 44, 56]), alpha: al, id: ID && 'tag-v', halo: 5 });
  OV.stext(gr.cn, ox, oy + 150, { font: FONT.zh, size: 36, weight: 600, color: rgb(gi >= 3 ? gr.col : [38, 44, 56]), alpha: al, id: ID && 'tag-g', halo: 5 });
  OV.stext(gr.en, ox, oy + 182, { font: FONT.it, size: 26, alpha: al, id: ID && 'tag-ge', halo: 5 });
}

function drawTrack(C, cam, t, τ) {
  const { g, OV, tauOf } = C, d = trackTau(t, tauOf); if (d === null) return;
  const lab = win(t, T.track0, 26.2, 0.4) + sstep(39.6, 40.4, t);   // dates hide while the camera is low
  g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0);
  // the travelled path: dashed ink
  g.beginPath(); let pen = false;
  for (const [pτ, X, Y] of PATH) {
    if (pτ > d + 0.5) break;
    let x = X, y = Y; if (pτ > d) { const S = C.storm(d); x = S.X; y = S.Y; }
    const p = cam.project(x, y, 0); if (!p) { pen = false; continue; }
    if (!pen) { g.moveTo(p[0], p[1]); pen = true; } else g.lineTo(p[0], p[1]);
  }
  g.setLineDash([9, 6]); g.lineWidth = 2.2; g.strokeStyle = 'rgba(34,30,28,0.85)'; g.lineCap = 'butt'; g.stroke(); g.setLineDash([]);
  // 6-hourly records (3-hourly near landfall): dots in the grade colour
  for (const r of REC) {
    if (r.t === null || t < r.t) continue;
    const p = cam.project(r.xy[0], r.xy[1], 0); if (!p) continue;
    const k = sstep(r.t, r.t + 0.18, t), gi = gradeOf(r.v), rad = (3.2 + 0.55 * gi) * k;
    g.beginPath(); g.arc(p[0], p[1], rad + 1.6, 0, Math.PI * 2); g.fillStyle = 'rgba(236,224,196,0.95)'; g.fill();
    g.beginPath(); g.arc(p[0], p[1], rad, 0, Math.PI * 2); g.fillStyle = rgb(gi <= 1 ? [44, 58, 74] : GRADES[gi].col); g.fill();
  }
  g.restore();
  // a date at each 08:00 Beijing-time record
  for (const r of REC) {
    if (r.t === null || t < r.t + 0.05 || r.bjt.h !== 8) continue;
    const p = cam.project(r.xy[0], r.xy[1], 0); if (!p) continue;
    const a = lab * sstep(r.t, r.t + 0.3, t); if (a <= 0) continue;
    OV.stext(`09-0${r.bjt.d}`, p[0], p[1] + 34, { font: FONT.mono, size: 21, align: 'center', alpha: Math.min(1, a), id: 'day' + r.bjt.d, halo: 4, color: '#3a332c' });
  }
}

// cartouche frame on the plane
function frame(C, P, w, h, a) {
  const { g, OV } = C;
  g.save(); OV.setPlane(P); g.globalAlpha = a;
  g.fillStyle = 'rgb(238,228,204)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(34,30,28,0.9)'; g.lineWidth = 2.2 / Math.hypot(...P.a); g.strokeRect(0, 0, w, h);
  const i = 6 / Math.hypot(...P.a) * 1.2; g.lineWidth = 0.9 / Math.hypot(...P.a); g.strokeRect(i, i, w - 2 * i, h - 2 * i);
  g.restore();
}

// verdict: the national grade table, the storm's reading, the pointer
const TABLE = { lon: 113.75, lat: 21.3, w: 540, h: 590 };
function gradeTable(C, cam, t) {
  const { g, OV } = C, a = win(t, T.table0, T.tableOut, 0.45); if (a <= 0) return;
  const [X, Y] = toXY(TABLE.lon, TABLE.lat), P = OV.plane(cam, X, Y, 0); if (!P) return;
  frame(C, P, TABLE.w, TABLE.h, a);
  const ink = { color: INK };
  OV.ptext(P, '热带气旋等级', 26, 50, { font: FONT.zh, size: 31, weight: 700, alpha: a, id: 'tb-t' });
  OV.ptext(P, 'Tropical cyclone grades', 26, 80, { font: FONT.it, size: 19, alpha: a, id: 'tb-te' });
  OV.ptext(P, 'GB/T 19201-2006', TABLE.w - 26, 48, { font: FONT.mono, size: 14, align: 'right', alpha: a, id: 'tb-s', color: '#4a4038' });
  const rows = [6, 5, 4, 3, 2, 1], R0 = 102, RH = 56;
  const rng = { 1: '10.8–17.1', 2: '17.2–24.4', 3: '24.5–32.6', 4: '32.7–41.4', 5: '41.5–50.9', 6: '≥ 51.0' };
  const verdict = sstep(T.pointer1 - 0.05, T.pointer1 + 0.25, t);
  rows.forEach((gi, k) => {
    const rt = T.table0 + 0.25 + k * 0.14, ra = a * sstep(rt, rt + 0.3, t), y = R0 + k * RH;
    if (ra <= 0) return;
    g.save(); OV.setPlane(P); g.globalAlpha = ra;
    g.fillStyle = rgb(gi <= 1 ? [44, 58, 74] : GRADES[gi].col); g.fillRect(26, y + 4, 14, RH - 8);
    if (gi === 6 && verdict > 0) { g.globalAlpha = ra * verdict; g.fillStyle = 'rgba(184,67,42,0.16)'; g.fillRect(48, y + 2, TABLE.w - 66, RH - 4); g.strokeStyle = VERM; g.lineWidth = 2.4 / Math.hypot(...P.a); g.strokeRect(48, y + 2, TABLE.w - 66, RH - 4); }
    g.strokeStyle = 'rgba(34,30,28,0.25)'; g.globalAlpha = ra; g.lineWidth = 0.8 / Math.hypot(...P.a); g.beginPath(); g.moveTo(48, y + RH); g.lineTo(TABLE.w - 18, y + RH); g.stroke();
    g.restore();
    const col = gi === 6 && verdict > 0.5 ? VERM : INK;
    OV.ptext(P, GRADES[gi].cn, 60, y + 28, { font: FONT.zh, size: 26, weight: 600, alpha: ra, id: 'tb-c' + gi, color: col });
    OV.ptext(P, GRADES[gi].en, 60, y + 49, { font: FONT.it, size: 17, alpha: ra, id: 'tb-e' + gi, color: col });
    OV.ptext(P, rng[gi] + ' m/s', TABLE.w - 26, y + 36, { font: FONT.mono, size: 19, align: 'right', alpha: ra, id: 'tb-r' + gi, color: col });
  });
  // the reading at landfall (CMA bulletin)
  const la = a * sstep(T.table0 + 1.0, T.table0 + 1.3, t), y0 = R0 + 6 * RH + 26;
  OV.ptext(P, '登陆时 · 9月6日16时20分 · 文昌', 26, y0 + 26, { font: FONT.zh, size: 26, weight: 600, alpha: la, id: 'tb-l' });
  OV.ptext(P, 'At landfall · 16:20, 6 Sep · Wenchang, Hainan', 26, y0 + 52, { font: FONT.it, size: 16.5, alpha: la, id: 'tb-le' });
  OV.ptext(P, '62 m/s · 17级以上 · 915 hPa', 26, y0 + 94, { font: FONT.mono, size: 26, alpha: la, id: 'tb-v', color: VERM });
  // pointer: travels up the scale to 62 m/s after the hold
  const pv = 62 * ease((t - T.pointer0) / (T.pointer1 - T.pointer0));
  if (t >= T.pointer0 - 0.01) {
    const rowOf = v => { const th = [10.8, 17.2, 24.5, 32.7, 41.5, 51.0, 70]; let gi = 1; for (let i = 1; i <= 6; i++) if (v >= th[i - 1]) gi = i; const f = clamp((v - th[gi - 1]) / (th[gi] - th[gi - 1]), 0, 1); return R0 + (6 - gi) * RH + RH * (1 - f); };
    const y = pv < 10.8 ? R0 + 6 * RH : rowOf(pv);
    g.save(); OV.setPlane(P); g.globalAlpha = a; g.fillStyle = VERM;
    g.beginPath(); g.moveTo(22, y); g.lineTo(8, y - 7); g.lineTo(8, y + 7); g.closePath(); g.fill();
    g.strokeStyle = VERM; g.lineWidth = 1.4 / Math.hypot(...P.a); g.beginPath(); g.moveTo(22, y); g.lineTo(44, y); g.stroke();
    g.restore();
  }
}

// the intensity curve at the end: a cartouche top right, over the open Pacific (the South China Sea stays in view)
const CURVE = { x: 1452, y: 92, w: 440, h: 380 };
function intensityCurve(C, cam, t) {
  const { g, OV } = C, a = sstep(T.curve0, T.curve0 + 0.5, t); if (a <= 0) return;
  const P = { o: [CURVE.x, CURVE.y], a: [1, 0], b: [0, 1] };
  frame(C, P, CURVE.w, CURVE.h, a);
  const px0 = 62, px1 = CURVE.w - 26, py0 = 116, py1 = CURVE.h - 62, vx = τ => lerp(px0, px1, τ / 168), vy = v => lerp(py1, py0, v / 70);
  OV.ptext(P, '近中心最大风速', 24, 50, { font: FONT.zh, size: 34, weight: 700, alpha: a, id: 'cv-t' });
  OV.ptext(P, 'Maximum wind near the centre, m/s', 24, 82, { font: FONT.it, size: 21, alpha: a, id: 'cv-te' });
  g.save(); OV.setPlane(P); g.globalAlpha = a;
  const th = [10.8, 17.2, 24.5, 32.7, 41.5, 51.0, 70];
  for (let gi = 1; gi <= 6; gi++) { g.fillStyle = rgb(gi <= 1 ? [44, 58, 74] : GRADES[gi].col, 0.10 + 0.02 * gi); g.fillRect(px0, vy(th[gi]), px1 - px0, vy(th[gi - 1]) - vy(th[gi])); }
  g.strokeStyle = 'rgba(34,30,28,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke();
  for (let d = 0; d <= 7; d++) { g.beginPath(); g.moveTo(vx(d * 24), py1); g.lineTo(vx(d * 24), py1 + 7); g.stroke(); }
  // the curve, drawn in from the left
  const k = ease((t - T.curve0 - 0.2) / (T.curve1 - T.curve0 - 0.2)), τe = 168 * k;
  g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath();
  for (let τ = 0; τ <= τe; τ += 0.5) { const v = C.storm(τ).vmax; τ === 0 ? g.moveTo(vx(τ), vy(v)) : g.lineTo(vx(τ), vy(v)); }
  g.stroke();
  for (const τl of [128.33, 134.33, 151.5]) { if (τl > τe) continue; const v = C.storm(τl).vmax; g.fillStyle = VERM; g.beginPath(); g.arc(vx(τl), vy(v), 5.5, 0, Math.PI * 2); g.fill(); }
  g.restore();
  // the pen on the curve and a ring on the map travel together: the same hour, two drawings
  { const ra = a * (1 - sstep(T.curve1 + 0.1, T.curve1 + 0.6, t)); const Sx = C.storm(Math.min(τe, 167.5)), q = cam.project(Sx.X, Sx.Y, 0);
    if (ra > 0.01 && q && τe > 0.5) { g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = ra; g.strokeStyle = VERM; g.lineWidth = 2.6;
      g.beginPath(); g.arc(q[0], q[1], 15, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(q[0], q[1], 4, 0, Math.PI * 2); g.fillStyle = VERM; g.fill(); g.restore(); } }
  for (const d of [0, 2, 4, 6]) OV.ptext(P, `09-0${d + 1}`, vx(d * 24), py1 + 32, { font: FONT.mono, size: 18, align: 'center', alpha: a, id: 'cv-d' + d, color: '#3a332c' });
  for (const v of [20, 40, 60]) OV.ptext(P, String(v), px0 - 10, vy(v) + 7, { font: FONT.mono, size: 18, align: 'right', alpha: a, id: 'cv-y' + v, color: '#3a332c' });
}

// end card: the chart's title block
export function titleBlock(C, x, y, a, full) {
  const { g, OV } = C, w = 540, h = full ? 262 : 92;
  const P = { o: [x, y], a: [1, 0], b: [0, 1] };
  frame(C, P, w, h, a);
  if (full) {
    const r = k => a;
    OV.stext('摩羯过琼州', x + 30, y + 62, { font: FONT.zh, size: 42, weight: 700, alpha: r(0), id: 'end-t', track: 0.06 });
    OV.stext('Typhoon Yagi over Qiongzhou', x + 30, y + 100, { font: FONT.it, size: 28, alpha: r(0), id: 'end-te' });
    g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = r(1); g.strokeStyle = 'rgba(34,30,28,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 30, y + 124); g.lineTo(x + w - 30, y + 124); g.stroke(); g.restore();
    const wz = OV.stext('流场风线', x + 30, y + 170, { font: FONT.zh, size: 34, weight: 600, alpha: r(1), id: 'end-s' });
    OV.stext('Flow-field Wind Lines', x + 30 + wz + 14, y + 168, { font: FONT.it, size: 27, alpha: r(1), id: 'end-se', color: '#3a332c' });
    OV.stext('LemoLab × Claude Opus 5.5', x + 30, y + 228, { font: FONT.en, size: 34, weight: 500, alpha: r(2), id: 'end-c' });
  } else OV.stext('LemoLab × Claude Opus 5.5', x + w / 2, y + 58, { font: FONT.en, size: 32, weight: 500, align: 'center', alpha: a, id: 'end-c' });
}
function endCard(C, cam, t) {
  const a = sstep(T.card, T.card + 0.2, t); if (a <= 0) return;
  titleBlock(C, 48, 760, a, true);
}
// the 10 s cut's sign-off: the same title block, one line, in its last 2.5 s
export function drawSign(t, dur, C) {
  const a = sstep(dur - 2.5, dur - 2.2, t); if (a <= 0) return;
  titleBlock(C, 48, 950, a, false);
}
// bilingual captions: printed at the foot of the chart on a soft paper wash, Chinese over English
export function drawCaptions(t, C, cues) {
  const { g, OV } = C;
  for (const c of cues) {
    const a = win(t, c.t0, c.t1, 0.18); if (a <= 0) continue;
    const oz = { font: FONT.zh, size: 38, weight: 600 }, oe = { font: FONT.it, size: 29 };
    const w = Math.max(OV.measure(c.zh, oz), OV.measure(c.en, oe));
    g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = a;
    g.translate(960, 982); g.scale((w / 2 + 150) / 90, 1);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 90); gr.addColorStop(0, 'rgba(240,229,203,0.93)'); gr.addColorStop(0.55, 'rgba(240,229,203,0.82)'); gr.addColorStop(1, 'rgba(240,229,203,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 90, 0, Math.PI * 2); g.fill(); g.restore();
    OV.stext(c.zh, 960, 970, { ...oz, align: 'center', alpha: a, color: INK });
    OV.stext(c.en, 960, 1014, { ...oe, align: 'center', alpha: a, color: '#3a332c' });
  }
}

// South China Sea island groups: standard Chinese names, pinyin English; pinned beside each group, per shot
const GROUP_EN = { '西沙群岛': 'Xisha Islands', '南沙群岛': 'Nansha Islands', '中沙群岛': 'Zhongsha Islands', '东沙群岛': 'Dongsha Islands', '黄岩岛': 'Huangyan Dao' };
function groupLabels(C, cam, t) {
  const { OV } = C;
  // [name, window a, window b, dx, dy, align] — shot 3 (the region), shot 4 (over Hainan), shot 8 (the whole track);
  // every name sits clear of the dashed line (Xisha to the north-east of its group, Huangyan Dao below and west of the reef)
  const L = [
    ['西沙群岛', 12.9, 18.4, 22, -26, 'left'], ['东沙群岛', 12.9, 18.3, 18, 8, 'left'], ['中沙群岛', 12.9, 18.3, -12, 44, 'right'], ['黄岩岛', 12.9, 18.3, -30, 48, 'center'],
    ['西沙群岛', 18.4, 26.0, -18, -30, 'right'],
    ['西沙群岛', 44.6, 99, 22, -26, 'left'], ['东沙群岛', 44.6, 99, 18, 8, 'left'], ['中沙群岛', 44.6, 99, -12, 44, 'right'], ['黄岩岛', 44.6, 99, -30, 48, 'center'], ['南沙群岛', 44.6, 99, 40, -22, 'left'],
  ];
  for (const [n, a0, a1, dx, dy, al] of L) {
    const a = win(t, a0, a1, 0.35); if (a <= 0) continue;
    const [lo, la] = SCS.groups[n], [X, Y] = toXY(lo, la), p = cam.project(X, Y, 0); if (!p) continue;
    OV.stext(n, p[0] + dx, p[1] + dy, { font: FONT.zh, size: 34, weight: 600, align: al, alpha: a * 0.95, id: 'grp-' + n + a0, color: '#3d4a52', halo: 5 });
    OV.stext(GROUP_EN[n], p[0] + dx, p[1] + dy + 27, { font: FONT.it, size: 23, align: al, alpha: a * 0.95, id: 'grpe-' + n + a0, color: '#3d4a52', halo: 4 });
  }
}

// The 南海诸岛 inset, as on published maps of China: the whole South China Sea at a small scale, 2–23°N, 105–122°E, with
// the dashed line, all four island groups and Zengmu Ansha. Printed as a cartouche wherever the main view shows the sea
// but not its southern part: the region shot (3) and the closing map (8).
const IN = { lo0: 105, lo1: 122, la0: 2, la1: 23, w: 290, pad: 12, head: 64 };
const mercY = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360)) * 180 / Math.PI;
let INSET_LAND = null;
function insetGeom() {
  const mw = IN.w - 2 * IN.pad, k = mw / (IN.lo1 - IN.lo0), mh = Math.round((mercY(IN.la1) - mercY(IN.la0)) * k);
  return { mw, mh, k, h: IN.head + mh + IN.pad };
}
function prepInset(D) {
  const { mw, mh, k } = insetGeom(), c = document.createElement('canvas'); c.width = mw; c.height = mh;
  const x = c.getContext('2d'), im = x.createImageData(mw, mh), d = im.data;
  const at = (i, j) => (i < 0 || j < 0 || i >= D.nx || j >= D.ny) ? 0 : +D.land[j * D.nx + i];
  for (let py = 0; py < mh; py++) {
    const my = mercY(IN.la1) - (py + 0.5) / k, lat = (2 * Math.atan(Math.exp(my * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
    for (let px = 0; px < mw; px++) {
      const lon = IN.lo0 + (px + 0.5) / k, fi = (lon - D.lon0) / D.dlon, fj = (lat - D.lat0) / D.dlat, i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
      const m = (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
      const o = (py * mw + px) * 4; d[o] = 176; d[o + 1] = 150; d[o + 2] = 110; d[o + 3] = Math.round(clamp((m - 0.25) * 2, 0, 1) * 150);
    }
  }
  x.putImageData(im, 0, 0); INSET_LAND = c;
}
function southSeaInset(C, x0, y0, a) {
  if (a <= 0.003 || !INSET_LAND) return;
  const { g, OV } = C, { mw, mh, k, h } = insetGeom(), mx = x0 + IN.pad, my = y0 + IN.head;
  const P = { o: [x0, y0], a: [1, 0], b: [0, 1] };
  frame(C, P, IN.w, h, a);
  const X = lon => mx + (lon - IN.lo0) * k, Y = lat => my + (mercY(IN.la1) - mercY(lat)) * k;
  g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = a;
  g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
  g.fillStyle = 'rgba(214,220,214,0.35)'; g.fillRect(mx, my, mw, mh);                    // the sea: a faint cool tint
  g.drawImage(INSET_LAND, mx, my);
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(32,30,30,0.8)'; g.lineWidth = 0.9; g.beginPath();
  for (const L of C.INSET.coast) for (let i = 0; i < L.length; i += 2) { const px = X(L[i]), py = Y(L[i + 1]); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
  g.lineCap = 'butt'; g.strokeStyle = 'rgba(26,24,24,0.95)'; g.lineWidth = 2.0;               // the dashed line, each dash one ink stroke
  for (const L of SCS.dashes) { g.beginPath(); L.forEach(([lo, la], i) => i ? g.lineTo(X(lo), Y(la)) : g.moveTo(X(lo), Y(la))); g.stroke(); }
  g.fillStyle = 'rgba(26,24,24,0.95)';
  for (const [lo, la, kd] of SCS.islands) { if (kd) continue; g.beginPath(); g.arc(X(lo), Y(la), 1.5, 0, Math.PI * 2); g.fill(); }
  g.setLineDash([1.2, 1.2]); g.lineWidth = 1;
  for (const [lo, la, kd] of SCS.islands) { if (!kd) continue; g.beginPath(); g.arc(X(lo), Y(la), 2.2, 0, Math.PI * 2); g.stroke(); }
  for (const R of SCS.rings) { const [lo, la] = R[0]; g.beginPath(); g.arc(X(lo), Y(la), 2.2, 0, Math.PI * 2); g.stroke(); }
  g.setLineDash([]);
  g.restore();
  g.save(); g.setTransform(C.SS, 0, 0, C.SS, 0, 0); g.globalAlpha = a; g.strokeStyle = 'rgba(34,30,28,0.55)'; g.lineWidth = 1; g.strokeRect(mx, my, mw, mh); g.restore();
  OV.stext('南海诸岛', x0 + IN.pad, y0 + 38, { font: FONT.zh, size: 34, weight: 700, alpha: a, id: 'inset-t' });
  OV.stext('South China Sea Islands', x0 + IN.pad, y0 + 58, { font: FONT.it, size: 18, alpha: a, id: 'inset-te', color: '#3a332c' });
  const [zl, za] = SCS.groups['曾母暗沙'];
  OV.stext('曾母暗沙', X(zl) - 7, Y(za) - 5, { font: FONT.zh, size: 22, weight: 600, align: 'right', alpha: a, id: 'inset-z', color: '#3d4a52', halo: 4 });
}

// ---------------------------------------------------------------- the frame's print layer
export function drawStory(t, cam, S, τ, C) {
  const { g, OV } = C;
  // title block (shot 1), printed on the sea and turned to face the camera
  { const a = win(t, T.titleIn, T.titleOut, 0.5);
    if (a > 0) {
      const k = ANCH.titleK * 2.5, P = OV.plane(cam, ANCH.title[0], ANCH.title[1], ANCH.titleRot);
      if (P) {
        OV.ptext(P, '摩羯过琼州', 0, 0, { font: FONT.zh, size: 52 * k, weight: 700, alpha: a, id: 'ti-1', track: 0.08, halo: 6 * k });
        OV.ptext(P, 'Typhoon Yagi over Qiongzhou', 0, 44 * k, { font: FONT.it, size: 32 * k, alpha: a, id: 'ti-2', halo: 5 * k });
        OV.ptext(P, '2024年9月 · 中国气象局最佳路径', 0, 90 * k, { font: FONT.zh, size: 24 * k, alpha: a, id: 'ti-3', halo: 5 * k, color: '#3a332c' });
        OV.ptext(P, 'September 2024 · CMA best track', 0, 122 * k, { font: FONT.it, size: 24 * k, alpha: a, id: 'ti-4', halo: 5 * k, color: '#3a332c' });
      }
    } }
  // sea names printed on the plane
  const sea = (lon, lat, zh, en, size, a, id, rot = 0) => {
    if (a <= 0) return; const [X, Y] = toXY(lon, lat), P = OV.plane(cam, X, Y, rot); if (!P) return;
    OV.ptext(P, zh, 0, 0, { font: FONT.zh, size, align: 'center', alpha: a * 0.9, id: id && id + 'z', track: 0.6, color: '#3d4a52' });
    OV.ptext(P, en, 0, size * 1.2, { font: FONT.it, size: size * 0.78, align: 'center', alpha: a * 0.9, id: id && id + 'e', track: 0.12, color: '#3d4a52' });
  };
  sea(114.6, 13.2, '南 海', 'South China Sea', 64, win(t, 13.2, 26.0) , 'scs');
  sea(108.0, 19.9, '北部湾', 'Beibu Gulf', 30, win(t, T.beibu, 41.6), 'bb', 90);
  sea(110.45, 20.13, '琼州海峡', 'Qiongzhou Strait', 9.5, win(t, 33.9, 36.2), 'qz', 90);
  groupLabels(C, cam, t);
  southSeaInset(C, 1610, 36, win(t, 13.7, 17.25, 0.35));      // shot 3: top right, over the open Pacific, until Taiwan arrives there
  southSeaInset(C, 1598, 548, win(t, 44.6, 99, 0.35));       // shot 8: bottom right, clear of the curve, the title block and the captions
  // the track and the storm symbol
  drawTrack(C, cam, t, τ);
  { const a = win(t, 11.6, 26.0, 0.5) + win(t, 40.6, 49.6, 0.6); const p = cam.project(S.X, S.Y, 0);
    if (a > 0 && p) typhoonSymbol(g, p[0] * 1, p[1], 11, VERM, a); }
  stormTag(C, cam, S, t, τ);
  // places
  pin(C, cam, 121.0, 16.4, [{ s: '吕宋岛', f: FONT.zh, z: 34, id: 'luz-z', w: 600 }, { s: 'Luzon', f: FONT.it, z: 26, id: 'luz-e' }], { alpha: win(t, 0.3, 4.9), dx: 16, dy: -16 });
  pin(C, cam, 110.93, 19.97, [{ s: '文昌', f: FONT.zh, z: 34, id: 'wc-z', w: 600 }, { s: 'Wenchang', f: FONT.it, z: 26, id: 'wc-e' }], { alpha: win(t, 19.4, 35.0), dx: -18, dy: -22, leader: true });
  pin(C, cam, 110.33, 20.03, [{ s: '海口', f: FONT.zh, z: 34, id: 'hk-z', w: 600 }, { s: 'Haikou', f: FONT.it, z: 26, id: 'hk-e' }], { alpha: win(t, 26.6, 34.7), dx: -16, dy: -22 });
  pin(C, cam, 109.75, 19.0, [{ s: '海南岛', f: FONT.zh, z: 34, id: 'hn-z', w: 600 }, { s: 'Hainan', f: FONT.it, z: 26, id: 'hn-e' }], { alpha: win(t, 19.4, 26.0), dx: -40, dy: 20 });
  pin(C, cam, 110.1, 20.25, [{ s: '徐闻', f: FONT.zh, z: 34, id: 'xw-z', w: 600 }, { s: 'Xuwen', f: FONT.it, z: 26, id: 'xw-e' }], { alpha: win(t, 34.6, 39.0), dx: -18, dy: -26 });
  // landfall tags
  const lf = (lon, lat, a, lines, dx, dy) => pin(C, cam, lon, lat, lines, { alpha: a, dx, dy, leader: true });
  lf(110.93, 19.97, win(t, T.land1, 34.4, 0.3), [{ s: '9月6日16时20分 登陆', f: FONT.zh, z: 36, w: 700, id: 'l1-z', c: VERM }, { s: 'Landfall · 16:20, 6 Sep', f: FONT.it, z: 27, id: 'l1-e' }], 40, 54);
  lf(110.1, 20.25, win(t, T.land2 - 0.6, 39.6, 0.3), [{ s: '22时20分 再次登陆', f: FONT.zh, z: 36, w: 700, id: 'l2-z', c: VERM }, { s: 'Second landfall · 22:20', f: FONT.it, z: 27, id: 'l2-e' }], 34, -118);
  lf(107.2, 21.05, sstep(T.land3, T.land3 + 0.3, t), [{ s: '9月7日15时30分 登陆越南', f: FONT.zh, z: 36, w: 700, id: 'l3-z', c: VERM }, { s: 'Landfall in Vietnam · 15:30, 7 Sep', f: FONT.it, z: 27, id: 'l3-e' }], 30, -110);
  gradeTable(C, cam, t);
  intensityCurve(C, cam, t);
  endCard(C, cam, t);
}

// ---------------------------------------------------------------- sound events
export function storyEvents(C) {
  const ev = [];
  for (const r of REC) if (r.t !== null && r.t > T.track0) ev.push({ t: +r.t.toFixed(3), type: 'tick', g: gradeOf(r.v) });
  // rolling tag: one tick per record passed while rolling
  let last = null;
  for (let k = Math.round(T.tagRoll0 * 120); k <= Math.round(T.tagLand * 120); k++) {
    const t = k / 120, τ = C.tauOf(t); let r = REC[0]; for (const q of REC) if (q.τ <= τ + 1e-6) r = q;
    if (r !== last) { if (last) ev.push({ t: +t.toFixed(3), type: 'roll', g: gradeOf(r.v) }); last = r; }
  }
  ev.push({ t: T.tagLand, type: 'land' });
  for (let k = 0; k < 6; k++) ev.push({ t: +(T.table0 + 0.25 + k * 0.14).toFixed(3), type: 'row', k });
  ev.push({ t: T.pointer0, type: 'pointer0' }, { t: T.pointer1, type: 'verdict' });
  ev.push({ t: T.land1, type: 'landfall', k: 1 }, { t: T.land2, type: 'landfall', k: 2 }, { t: T.land3, type: 'landfall', k: 3 });
  ev.push({ t: T.curve0, type: 'curve' }, { t: T.card, type: 'card' });
  ev.push({ t: 4.5, type: 'cut' }, { t: 11.3, type: 'rise' }, { t: 18.4, type: 'settle' }, { t: 26.0, type: 'dive' }, { t: 33.6, type: 'cut' }, { t: 39.6, type: 'turn' }, { t: 43.0, type: 'rise' });
  // wind under the camera, every 0.1 s: mean and max speed over a 5×3 grid of ground points, and where the strongest is
  for (let k = 0; k <= C.DUR * 10; k++) {
    const t = k / 10, cam = C.camAt(t), S = C.storm(C.tauOf(t));
    let sum = 0, n = 0, mx = 0, px = 0, pw = 0;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
      const sx = C.W * (0.1 + 0.2 * i), sy = C.H * (0.2 + 0.3 * j), gp = cam.ray(sx, sy); if (!gp) continue;
      const v = wind(gp[0], gp[1], S)[2]; sum += v; n++; mx = Math.max(mx, v); px += v * v * (sx / C.W * 2 - 1); pw += v * v;
    }
    ev.push({ t, type: 'w', v: +(sum / Math.max(1, n)).toFixed(2), vmax: +mx.toFixed(2), pan: +(px / Math.max(1e-6, pw)).toFixed(2), ppk: +cam.ppkRef.toFixed(4) });
  }
  return ev.sort((a, b) => a.t - b.t);
}
