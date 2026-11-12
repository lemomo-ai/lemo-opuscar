// 《量出来的蓝》 Measured Blue · Under the Microscope demo
// One continuous camera from the glass slide down to one nucleus and back. Every pixel of glass and tissue is the
// real whole-slide scan (Ventana-1.bif, CC0); every number is computed from the file (tools/plates.py, nucleus.py).
import { clamp, lerp, seg, ss, eio, eo } from '/core/lib.js';
import { T, VO, DUR, BEAT } from './timeline.js';

const W = 1920, H = 1080, M = 64;
window.DUR = DUR;
const j = async f => (await fetch(f)).json();
const P = await j('assets/plates/plates.json');
const NU = await j('assets/plates/nucleus.json');
let CUES = []; try { CUES = await j('cues.json'); } catch (e) { CUES = []; }
const MPP = P.mpp0;
const N = [NU.cx, NU.cy];
const RA = P.rois.A, RB = P.rois.B;
const KS = P.slide_reg.k, OX = P.slide_reg.origin[0], OY = P.slide_reg.origin[1];
const photo = (x, y) => [(x - OX) * KS, (y - OY) * KS];          // slide-photo px -> world (level-0 px)

const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('missing ' + src)); im.src = src; });
const IM = {};
await Promise.all([...P.plates.map(async p => { IM[p.name] = await loadImg(p.file); }),
  (async () => { IM.roiA = await loadImg(RA.overlay.file); })(), (async () => { IM.roiB = await loadImg(RB.overlay.file); })()]);
await Promise.all(Object.values(IM).map(im => im.decode()));
await Promise.all(['300 40px BC', '400 40px BC', '400 20px PM', '500 20px PM', '400 20px SC', '500 20px SC', '600 20px SS']
  .map(f => document.fonts.load(f, '量视野0µm×')));

// ------------------------------------------------------------------ canvases
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const base = mk(W + 2 * M, H + 2 * M), bx = base.getContext('2d');
const tmp = mk(W, H), tx = tmp.getContext('2d');
const snap = mk(W, H), sx = snap.getContext('2d');
for (const c of [ctx, bx, tx, sx]) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; }

// ------------------------------------------------------------------ camera: similarity keys, spiral interpolation
// screen z = a * w + b with complex a = k e^{i roll}; between two keys the camera follows M^u (a log spiral about the
// fixed point of the two frames), so every push is a true dive towards one point and the roll is part of it.
const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const cdiv = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
const csub = (p, q) => [p[0] - q[0], p[1] - q[1]], cadd = (p, q) => [p[0] + q[0], p[1] + q[1]];
function key(t, p, s, fovUm, rollDeg, ease = 'eio') {
  const k = W * MPP / fovUm, th = rollDeg * Math.PI / 180;
  const a = [k * Math.cos(th), k * Math.sin(th)];
  return { t, a, b: csub(s, cmul(a, p)), lk: Math.log(k), th, ease };
}
const mid = [(RA.center[0] + RB.center[0]) / 2, (RA.center[1] + RB.center[1]) / 2];
const TC = P.tissue.center;
const OPEN = photo(630, 1520);
const ENDP = photo(630, 1481);
const ROLL_M = 18.5;                                               // A-B reads left -> right
const KEYS = [
  key(T.open, OPEN, [960, 540], 68000, 90, 'lin'),
  key(T.push, OPEN, [960, 540], 63500, 88.5),
  key(T.tissue, TC, [960, 405], 9200, 25.4, 'lin'),
  key(T.toA, TC, [960, 405], 8550, 26.4),
  key(T.circA, RA.center, [1090, 470], 2700, ROLL_M, 'lin'),
  key(T.truck, RA.center, [1090, 470], 2600, ROLL_M + 0.8),
  key(T.circB, RB.center, [830, 470], 2700, ROLL_M, 'lin'),
  key(T.both, RB.center, [830, 470], 2600, ROLL_M + 0.8),
  key(T.both + 1.0, mid, [960, 540], 3950, ROLL_M, 'lin'),
  key(T.dive, mid, [960, 540], 3780, ROLL_M + 0.6),
  key(T.land, N, [840, 560], 345, 34, 'lin'),
  key(T.pull, N, [840, 560], 318, 35.2),
  key(T.card, ENDP, [1450, 470], 46000, 96, 'lin'),
  key(DUR, ENDP, [1450, 470], 44600, 97),
];
const EASE = { lin: u => u, eio: u => eio(u) };
function camAt(t) {
  let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
  const k1 = KEYS[i], k2 = KEYS[i + 1];
  const u = EASE[k1.ease](clamp((t - k1.t) / (k2.t - k1.t), 0, 1));
  const A = cdiv(k2.a, k1.a), B = csub(k2.b, cmul(A, k1.b));
  const lA = k2.lk - k1.lk, tA = k2.th - k1.th;                    // log|A|, arg A (continuous: the roll path we asked for)
  const Au = [Math.exp(lA * u) * Math.cos(tA * u), Math.exp(lA * u) * Math.sin(tA * u)];
  let a, b;
  if (Math.hypot(A[0] - 1, A[1]) < 1e-9) { a = k1.a; b = cadd(k1.b, [B[0] * u, B[1] * u]); }
  else {
    const zs = cdiv(B, csub([1, 0], A));                           // fixed point
    a = cmul(Au, k1.a); b = cadd(cmul(Au, csub(k1.b, zs)), zs);
  }
  return { a, b, k: Math.hypot(a[0], a[1]), th: Math.atan2(a[1], a[0]) };
}
const toS = (c, p) => cadd(cmul(c.a, p), c.b);
const toW = (c, q) => cdiv(csub(q, c.b), c.a);
const fovOf = c => W * MPP / c.k;

// ------------------------------------------------------------------ plates and "objective" (pyramid level) changes
const PL = Object.fromEntries(P.plates.map(p => [p.name, p]));
const ORDER = ['a8', 'a4', 'a2', 'c1', 'c05', 'c025'];
const MAG = { a8: P.mags[5], a4: P.mags[4], a2: P.mags[3], c1: P.mags[2], c05: P.mags[1], c025: P.mags[0] };
const FULL = 1.45, NONE = 2.2;                                     // plate px per screen px: full / gone
function covers(c, p, inset) {
  const x0 = p.x + inset, y0 = p.y + inset, x1 = p.x + p.w * p.s - inset, y1 = p.y + p.h * p.s - inset;
  for (const q of [[-M, -M], [W + M, -M], [-M, H + M], [W + M, H + M]]) {
    const w = toW(c, q); if (w[0] < x0 || w[0] > x1 || w[1] < y0 || w[1] > y1) return false;
  }
  return true;
}
function plateAlpha(c, name) {
  const p = PL[name], r = 1 / (c.k * p.s);
  let al = 1 - ss(seg(r, FULL, NONE));
  if (name === 'a8') al = 1;
  if ((name === 'c05' || name === 'c025') && !covers(c, p, 0)) al = 0;
  return al;
}
function activeLevel(c) {                                          // the finest level drawn at full strength
  let best = null;
  for (const n of ORDER) if (1 / (c.k * PL[n].s) <= FULL && plateAlpha(c, n) >= 1) best = n;
  return best && fovOf(c) < 30000 ? best : 'slide';
}
// objective events: when the active level changes (sampled at 1/96 s)
const OBJ = [];
{ let prev = activeLevel(camAt(0));
  for (let t = 1 / 96; t < DUR; t += 1 / 96) {
    const lv = activeLevel(camAt(t));
    if (lv !== prev) { OBJ.push({ t: +t.toFixed(4), from: prev, to: lv, up: ORDER.indexOf(lv) > ORDER.indexOf(prev) }); prev = lv; }
  } }
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));

function focus(t) {
  let g = 10 * (1 - eo(seg(t, 0.05, 0.95)));                       // rack in
  for (const e of OBJ) g += (t > T.pull ? 1.4 : 2.4) * pulse(t, e.t + 0.03, 0.075);
  const soft = 2.4 * ss(seg(t, T.land - 0.45, T.land - 0.1)) * (t < T.land + 1.0 ? 1 : 0);
  const front = lerp(-300, W + 520, eio(seg(t, T.land - 0.1, T.land + 0.95)));
  return { g, soft, front };
}

// ------------------------------------------------------------------ the specimen
const SR = P.slide_rect_world, GLASS = `rgb(${P.glass_rgb.map(Math.round)})`;
function drawSpecimen(c, t) {
  bx.setTransform(1, 0, 0, 1, 0, 0);
  // the bench: graphite, a slow pool of light
  const lx = lerp(560, 1500, ss(seg(t, 0, 3.2))) + M, ly = 300 + M;
  const g = bx.createRadialGradient(lx, ly, 60, lx, ly, 1500);
  g.addColorStop(0, '#2a3036'); g.addColorStop(0.55, '#15191c'); g.addColorStop(1, '#0b0d0f');
  bx.fillStyle = g; bx.fillRect(0, 0, base.width, base.height);
  const fov = fovOf(c);
  const sl = PL.slide;
  const set = () => bx.setTransform(c.a[0], c.a[1], -c.a[1], c.a[0], c.b[0] + M, c.b[1] + M);
  if (fov > 22000) {                                               // a soft shadow lifts the glass off the bench
    bx.save(); bx.setTransform(c.a[0], c.a[1], -c.a[1], c.a[0], c.b[0] + M + 6, c.b[1] + M + 16);
    bx.filter = `blur(${(2000 * c.k).toFixed(1)}px) brightness(0)`; bx.globalAlpha = 0.55 * ss(seg(fov, 22000, 30000));
    bx.drawImage(IM.slide, sl.x, sl.y, sl.w * sl.s, sl.h * sl.s); bx.restore();
  }
  set();
  bx.drawImage(IM.slide, sl.x, sl.y, sl.w * sl.s, sl.h * sl.s);
  // below ~30 mm field the photo is upsampled: the cover glass becomes clean glass (its dust leaves the focal plane)
  const fg = ss(seg(fov, 34000, 21000));
  if (fg > 0) { bx.globalAlpha = fg; bx.fillStyle = GLASS; bx.fillRect(SR[0] + 1500, SR[1] + 1500, SR[2] - SR[0] - 3000, SR[3] - SR[1] - 3000); bx.globalAlpha = 1; }
  // the scan, finest plate last
  const al = Object.fromEntries(ORDER.map(n => [n, plateAlpha(c, n)]));
  let start = 0;
  for (let i = ORDER.length - 1; i >= 0; i--) {
    const n = ORDER[i];
    if (al[n] >= 1 && (n[0] === 'c' || covers(c, PL[n], 300 / MPP))) { start = i; break; }
  }
  for (let i = start; i < ORDER.length; i++) {
    const n = ORDER[i], p = PL[n]; if (al[n] <= 0.002) continue;
    bx.globalAlpha = al[n]; bx.drawImage(IM[n], p.x, p.y, p.w * p.s, p.h * p.s);
  }
  bx.globalAlpha = 1;
  // counted collagen: revealed behind the scan front, then kept as a trace of the septa
  for (const [R, im, key0] of [[RA, IM.roiA, 'A'], [RB, IM.roiB, 'B']]) {
    const st = roiState(t, key0); if (st.alpha <= 0.002) continue;
    const o = R.overlay, cx = R.center[0], cy = R.center[1], rad = R.diam_um / 2 / MPP;
    bx.save(); set();
    bx.beginPath(); bx.arc(cx, cy, rad, 0, 2 * Math.PI); bx.clip();
    if (st.front < 1) {                                            // half-plane left of the scan line (screen x)
      const ux = Math.cos(c.th), uy = -Math.sin(c.th), d = (st.front * 2 - 1) * rad;
      const px = cx + ux * d, py = cy + uy * d, L = rad * 3;
      bx.beginPath(); bx.moveTo(px - uy * L, py + ux * L); bx.lineTo(px + uy * L, py - ux * L);
      bx.lineTo(px + uy * L - ux * L, py - ux * L - uy * L); bx.lineTo(px - uy * L - ux * L, py + ux * L - uy * L); bx.closePath(); bx.clip();
    }
    bx.globalAlpha = st.alpha; bx.drawImage(im, o.x, o.y, o.w * o.s, o.h * o.s);
    bx.restore();
  }
  bx.setTransform(1, 0, 0, 1, 0, 0);
}

function composite(c, t) {
  const { g, soft, front } = focus(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = (g + soft) > 0.25 ? `blur(${(g + soft).toFixed(2)}px)` : 'none';
  ctx.drawImage(base, -M, -M);
  ctx.filter = 'none';
  if (soft > 0.25) {
    tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, H);
    tx.filter = g > 0.25 ? `blur(${g.toFixed(2)}px)` : 'none'; tx.drawImage(base, -M, -M); tx.filter = 'none';
    tx.globalCompositeOperation = 'destination-in';
    const ang = 12 * Math.PI / 180, dx = Math.cos(ang), dy = Math.sin(ang), band = 240;
    const gr = tx.createLinearGradient(front - dx * band, H / 2 - dy * band, front + dx * band, H / 2 + dy * band);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    tx.fillStyle = gr; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp, 0, 0);
  }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.15);
  vg.addColorStop(0, 'rgba(20,14,18,0)'); vg.addColorStop(1, 'rgba(20,14,18,0.18)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  sx.drawImage(cv, 0, 0);                                          // for the frosted panels
}

// ------------------------------------------------------------------ measuring state
function roiState(t, k) {
  const c0 = k === 'A' ? T.circA : T.circB, s0 = k === 'A' ? T.scanA : T.scanB, s1 = (k === 'A' ? T.landA : T.landB) - 0.2;
  const front = clamp((t - s0) / (s1 - s0), 0, 1);
  let alpha = front > 0 ? lerp(0.95, 0.55, ss(seg(t, s1, s1 + 0.8))) : 0;
  alpha *= 1 - ss(seg(t, T.dive + 0.2, T.dive + 1.1));
  if (k === 'A') alpha *= 1;
  return { alpha, front: t < s0 ? 0 : front, drawn: ss(seg(t, c0, c0 + 0.35)) };
}
function shareAt(t, k) {
  const R = k === 'A' ? RA : RB, s0 = k === 'A' ? T.scanA : T.scanB, s1 = (k === 'A' ? T.landA : T.landB) - 0.2;
  const f = clamp((t - s0) / (s1 - s0), 0, 1), cum = R.cum, x = f * (cum.length - 1), i = Math.floor(x);
  if (f >= 1) return R.share * 100;
  return 100 * lerp(cum[i], cum[Math.min(i + 1, cum.length - 1)], x - i);
}

// ------------------------------------------------------------------ drawing kit
const MINT = 'rgb(120,240,205)', MINT_D = 'rgb(0,122,99)', INK = 'rgb(24,27,31)', WHITE_T = 'rgb(248,247,244)';
let TX = [];                                                       // texts on screen this frame (readcheck)
function reg(id, text, x0, y0, x1, y1) { TX.push({ id, text, x0, y0, x1, y1 }); }
function text(s, x, y, font, color, { align = 'left', alpha = 1, halo = null, id = null, full = null } = {}) {
  if (alpha <= 0.003) return 0;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (halo) { ctx.shadowColor = halo; ctx.shadowBlur = 8; }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  if (halo) { ctx.shadowBlur = 0; ctx.fillText(s, x, y); }
  const m = ctx.measureText(s), w = m.width; ctx.restore();
  if (id && alpha > 0.5) {
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    reg(id, full ?? s, x0, y - m.actualBoundingBoxAscent, x0 + w, y + m.actualBoundingBoxDescent);
  }
  return w;
}
function line(pts, color, halo, w = 1.6, alpha = 1) {
  if (alpha <= 0.003) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  if (halo) { ctx.strokeStyle = halo; ctx.lineWidth = w + 3; ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); ctx.restore();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function panel(x, y, w, h, alpha = 1, r = 14) {                     // frosted dark glass
  if (alpha <= 0.003) return;
  ctx.save(); ctx.globalAlpha = alpha;
  rr(ctx, x, y, w, h, r); ctx.clip();
  ctx.filter = 'blur(18px)'; ctx.drawImage(snap, 0, 0); ctx.filter = 'none';
  ctx.fillStyle = 'rgba(12,14,17,0.74)'; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha * 0.9; rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}
const fmtLen = v => v >= 1000 ? `${v / 1000} mm` : `${v} µm`;
const fmtFov = um => um >= 1000 ? `${(um / 1000).toFixed(um >= 10000 ? 1 : 2)} mm` : `${Math.round(um)} µm`;
const NICE = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
const niceFor = fov => NICE.find(v => v / (fov / W) <= 250);

// ------------------------------------------------------------------ instruments
function instruments(c, t) {
  const a = ss(seg(t, 0.3, 0.9)) * (1 - ss(seg(t, T.card - 0.2, T.card + 0.4)));
  if (a <= 0.003) return;
  const fov = fovOf(c), upp = fov / W;
  const v = niceFor(fov);
  let ts = t; while (ts > 0 && niceFor(fovOf(camAt(ts - 1 / 96))) === v) ts -= 1 / 96;
  const vPrev = ts > 0 ? niceFor(fovOf(camAt(ts - 1 / 96))) : v;
  const sw = ss(seg(t, ts, ts + 0.18));
  const L = lerp(vPrev / upp, v / upp, sw);
  const x0 = 56, y0 = 884, pw = 360, ph = 140;
  panel(x0, y0, pw, ph, a);
  const xb = x0 + 26, yb = y0 + 78;
  line([[xb, yb - 10], [xb, yb], [xb + L, yb], [xb + L, yb - 10]], WHITE_T, null, 2, a);
  line([[xb + L / 2, yb], [xb + L / 2, yb - 5]], WHITE_T, null, 1.3, a);
  if (vPrev !== v && sw < 1) text(fmtLen(vPrev), xb, y0 + 54 - 14 * sw, '300 40px BC', WHITE_T, { alpha: a * (1 - sw) * (1 - sw) });
  text(fmtLen(v), xb, y0 + 54 + (vPrev !== v ? 14 * (1 - sw) : 0), '300 40px BC', WHITE_T, { alpha: a * (vPrev !== v ? sw : 1) });
  text('视野', xb, y0 + 116, '400 20px SC', 'rgba(248,247,244,0.7)', { alpha: a });
  text(fmtFov(fov), xb + 46, y0 + 116, '400 20px PM', WHITE_T, { alpha: a });
  // magnification of the pyramid level on screen (TIFF ImageDescription "mag=")
  const lv = activeLevel(c); let last = null; for (const e of OBJ) if (e.t <= t) last = e;
  const flash = last ? 1 - ss(seg(t, last.t, last.t + 0.6)) : 0;
  const lab = lv === 'slide' ? '玻片照片' : `等效 ${MAG[lv]}×`;
  const col = flash > 0 ? `rgb(${[248, 247, 244].map((x, i) => Math.round(lerp(x, [120, 240, 205][i], flash))).join(',')})` : WHITE_T;
  const lw = text(lab, x0 + pw - 24, y0 + 116, lv === 'slide' ? '400 20px SC' : '500 20px PM', col, { align: 'right', alpha: a });
  // the nosepiece: a small turret that turns a quarter on every change, so the click has something to belong to
  let turns = 0; for (const e of OBJ) if (e.t <= t) turns += (e.up ? 1 : -1) * (e.t > T.pull ? 0.5 : 1) * eo(seg(t, e.t, e.t + 0.28));
  const ix = x0 + pw - 24 - lw - 22, iy = y0 + 109, ang = turns * Math.PI / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(ix, iy, 9, 0, 2 * Math.PI); ctx.stroke();
  for (let i = 0; i < 4; i++) { const q = ang + i * Math.PI / 2; ctx.beginPath(); ctx.arc(ix + Math.cos(q) * 5.5, iy + Math.sin(q) * 5.5, i === 0 ? 2.6 : 1.6, 0, 2 * Math.PI); ctx.fill(); }
  ctx.restore();
  if (flash > 0 && lv !== 'slide') {                               // the new magnification, said once, large, above the panel
    const fa = a * Math.min(1, flash * 2.2) * (t < T.pull ? 1 : 0);
    const dy = 10 * (1 - ss(seg(t, last.t, last.t + 0.2)));
    ctx.save(); ctx.font = '400 40px BC'; const fw = ctx.measureText(`${MAG[lv]}×`).width; ctx.restore();
    panel(x0, y0 - 66 + dy, fw + 40, 54, fa, 12);
    text(`${MAG[lv]}×`, x0 + 20, y0 - 24 + dy, '400 40px BC', MINT, { alpha: fa });
  }
  // source, top right
  const ca = a;
  ctx.save(); ctx.font = '400 20px PM'; const cw = Math.ceil(ctx.measureText('全切片扫描 Ventana DP 200 · PathAI · CC0').width) + 44; ctx.restore();
  panel(W - 56 - cw, 40, cw, 46, ca, 12);
  text('全切片扫描 Ventana DP 200 · PathAI · CC0', W - 56 - cw / 2, 70, '400 20px PM', 'rgba(248,247,244,0.82)', { align: 'center', alpha: ca });
}

// ------------------------------------------------------------------ subtitles (one zh line, one en line, never wrapped)
const SUBF = { zh: '500 34px SC', en: '400 30px BC' };
function subtitles(t) {
  const cue = CUES.find(q => t >= q.t0 - 0.12 && t < q.t1 + 0.12); if (!cue) return;
  const a = ss(seg(t, cue.t0 - 0.12, cue.t0 + 0.06)) * (1 - ss(seg(t, cue.t1 - 0.06, cue.t1 + 0.08)));
  ctx.save(); ctx.font = SUBF.zh; const wz = ctx.measureText(cue.zh).width; ctx.font = SUBF.en; const we = ctx.measureText(cue.en).width; ctx.restore();
  const w = Math.max(wz, we) + 64, x = W / 2 + 40 - w / 2;
  panel(x, 940, w, 104, a * a, 14);
  text(cue.zh, W / 2 + 40, 984, SUBF.zh, WHITE_T, { align: 'center', alpha: a });
  text(cue.en, W / 2 + 40, 1024, SUBF.en, 'rgba(248,247,244,0.86)', { align: 'center', alpha: a });
}
window.SUBCHECK = (() => {
  const c = document.createElement('canvas').getContext('2d'), safe = 960;
  const cues = CUES.map(q => { c.font = SUBF.zh; const wz = Math.round(c.measureText(q.zh).width); c.font = SUBF.en; const we = Math.round(c.measureText(q.en).width);
    return { id: q.id, zh: q.zh, en: q.en, wz, we, ok: wz <= safe && we <= safe && !/\n/.test(q.zh + q.en) }; });
  return { safe, cues, ok: cues.every(q => q.ok) };
})();

// ------------------------------------------------------------------ opening: the slide as the eye sees it
const TS = P.tissue;
function opening(c, t) {
  const a = ss(seg(t, 0.6, 0.95)) * (1 - ss(seg(t, 4.0, 4.35)));
  if (a <= 0.003) return;
  const tip = toS(c, TS.center);
  const el = [tip[0] - 80, tip[1] - 120], end = [el[0] - 64, el[1]];
  const g = eo(seg(t, 0.6, 1.0));
  line([[tip[0] - 12, tip[1] - 22], [lerp(tip[0] - 12, el[0], g), lerp(tip[1] - 22, el[1], g)], [lerp(el[0], end[0], g), el[1]]], INK, 'rgba(255,253,250,0.8)', 1.6, a);
  const ta = a * ss(seg(t, 0.8, 1.05));
  text('一片人肝组织', end[0] - 12, end[1] + 10, '500 30px SC', INK, { align: 'right', alpha: ta, halo: 'rgba(255,253,250,0.85)', id: 'op1' });
  text('三色染色', end[0] - 12, end[1] + 40, '400 21px SC', 'rgba(24,27,31,0.72)', { align: 'right', alpha: ta, halo: 'rgba(255,253,250,0.85)', id: 'op2' });
}

// ------------------------------------------------------------------ the dimension line on the tissue
function dimension(c, t) {
  const a = ss(seg(t, T.tissue, T.tissue + 0.3)) * (1 - ss(seg(t, T.toA - 0.1, T.toA + 0.25)));
  if (a <= 0.003) return;
  const off = TS.n1 + 700;
  const P0 = [TS.center[0] + TS.axis[0] * TS.a0 + TS.normal[0] * off, TS.center[1] + TS.axis[1] * TS.a0 + TS.normal[1] * off];
  const P1 = [TS.center[0] + TS.axis[0] * TS.a1 + TS.normal[0] * off, TS.center[1] + TS.axis[1] * TS.a1 + TS.normal[1] * off];
  let s0 = toS(c, P0), s1 = toS(c, P1);
  if (s0[0] > s1[0]) [s0, s1] = [s1, s0];
  const mid2 = [(s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2];
  const grow = eo(seg(t, T.tissue + 0.05, T.tissue + 0.7));
  const e0 = [lerp(mid2[0], s0[0], grow), lerp(mid2[1], s0[1], grow)], e1 = [lerp(mid2[0], s1[0], grow), lerp(mid2[1], s1[1], grow)];
  const ang = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
  let nx = -Math.sin(ang), ny = Math.cos(ang);
  const tc = toS(c, TS.center); if ((mid2[0] - tc[0]) * nx + (mid2[1] - tc[1]) * ny < 0) { nx = -nx; ny = -ny; }   // away from the tissue
  const halo = 'rgba(255,253,250,0.85)';
  const tick = p => [[p[0] - nx * 14, p[1] - ny * 14], [p[0] + nx * 7, p[1] + ny * 7]];
  line([e0, e1], INK, halo, 1.6, a);
  if (grow > 0.98) { line(tick(e0), INK, halo, 1.6, a); line(tick(e1), INK, halo, 1.6, a); }
  const ta = a * ss(seg(t, T.tissue + 0.55, T.tissue + 0.85));
  ctx.save(); ctx.translate(mid2[0] + nx * 18, mid2[1] + ny * 18); ctx.rotate(ang);
  const flip = ny < 0 ? -1 : 1;
  text((TS.length_um / 1000).toFixed(2) + ' mm', 0, flip > 0 ? 46 : -14, '400 50px BC', MINT_D, { align: 'center', alpha: ta, halo });
  text('人肝组织 · 三色染色', 0, flip > 0 ? 82 : -70, '500 24px SC', INK, { align: 'center', alpha: ta, halo });
  ctx.restore();
  if (ta > 0.5) {                                                  // readcheck boxes (axis-aligned around the rotated text)
    const cx0 = mid2[0] + nx * 60, cy0 = mid2[1] + ny * 60;
    reg('dim', (TS.length_um / 1000).toFixed(2) + ' mm', cx0 - 90, cy0 - 50, cx0 + 90, cy0 + 50);
    reg('dimlab', '人肝组织 · 三色染色', cx0 - 140, cy0 - 60, cx0 + 140, cy0 + 70);
  }
}

// ------------------------------------------------------------------ the two measuring circles
function circle(c, t, k) {
  const R = k === 'A' ? RA : RB, st = roiState(t, k);
  const show = st.drawn * (1 - ss(seg(t, T.dive + 0.1, T.dive + 0.6)));
  if (show <= 0.003) return;
  const s = toS(c, R.center), rad = R.diam_um / 2 / MPP * c.k;
  const halo = 'rgba(10,8,10,0.55)';
  ctx.save(); ctx.globalAlpha = show; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(s[0], s[1], rad, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * st.drawn);
  ctx.strokeStyle = halo; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = WHITE_T; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 4; i++) {                                    // cardinal ticks
    const an = i * Math.PI / 2; if (st.drawn < (i + 1) / 4) continue;
    const p0 = [s[0] + Math.cos(an) * rad, s[1] + Math.sin(an) * rad], p1 = [s[0] + Math.cos(an) * (rad + 12), s[1] + Math.sin(an) * (rad + 12)];
    ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.strokeStyle = WHITE_T; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
  // the scan front
  const s0 = k === 'A' ? T.scanA : T.scanB, s1 = (k === 'A' ? T.landA : T.landB) - 0.2;
  if (t > s0 && t < s1 + 0.15) {
    const f = clamp((t - s0) / (s1 - s0), 0, 1), x = s[0] - rad + 2 * rad * f;
    const h = Math.sqrt(Math.max(0, rad * rad - (x - s[0]) ** 2));
    const fa = 1 - ss(seg(t, s1, s1 + 0.15));
    ctx.save(); ctx.globalAlpha = fa; ctx.shadowColor = MINT; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(x, s[1] - h); ctx.lineTo(x, s[1] + h); ctx.strokeStyle = MINT; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
  }
  // circle label
  text(`${k} · 直径 1 mm`, s[0], s[1] - rad - 22, '500 22px SC', WHITE_T, { align: 'center', alpha: show * ss(seg(t, (k === 'A' ? T.circA : T.circB) + 0.2, (k === 'A' ? T.circA : T.circB) + 0.5)), halo: 'rgba(10,8,10,0.75)', id: 'lab' + k });
  // the reading: a frosted panel beside the circle (A on its left, B on its right)
  const ra = ss(seg(t, s0 - 0.05, s0 + 0.25)) * (1 - ss(seg(t, T.dive - 0.1, T.dive + 0.3)));
  if (ra <= 0.003) return;
  const pw = 300, ph = 150, side = k === 'A' ? -1 : 1;
  const px = side < 0 ? s[0] - rad - 44 - pw : s[0] + rad + 44, py = s[1] - ph / 2 - 10;
  const lx0 = side < 0 ? s[0] - rad - 6 : s[0] + rad + 6, lx1 = side < 0 ? px + pw : px;
  line([[lx0, s[1] - 10], [lx1, s[1] - 10]], WHITE_T, 'rgba(10,8,10,0.45)', 1.4, ra);
  panel(px, py, pw, ph, ra);
  const land = k === 'A' ? T.landA : T.landB;
  const v = shareAt(t, k), done = t >= land - 0.2;
  const pop = done ? 1 + 0.06 * Math.exp(-(t - land + 0.2) * 9) * Math.sin((t - land + 0.2) * 30) : 1;
  text('胶原（蓝）占组织面积', px + 22, py + 38, '500 22px SC', 'rgba(248,247,244,0.85)', { alpha: ra, id: 'rl' + k });
  ctx.save(); ctx.translate(px + 22, py + 104); ctx.scale(pop, pop);
  text(v.toFixed(1) + '%', 0, 0, '400 72px BC', done ? MINT : 'rgba(120,240,205,0.6)', { alpha: ra });
  ctx.restore();
  if (ra > 0.5) reg('rv' + k, (R.share * 100).toFixed(1) + '%', px + 22, py + 50, px + 200, py + 108);
  text(`${R.blue_px.toLocaleString('en-US')} / ${R.tissue_px.toLocaleString('en-US')} px`, px + 22, py + 136, '400 20px PM', 'rgba(248,247,244,0.62)', { alpha: ra * ss(seg(t, land - 0.2, land + 0.2)), id: 'rp' + k });
}

// ------------------------------------------------------------------ the comparison
function verdict(t) {
  const a = ss(seg(t, T.verdict, T.verdict + 0.3)) * (1 - ss(seg(t, T.dive + 0.25, T.dive + 0.6)));
  if (a <= 0.003) return;
  const ratio = (RB.share / RA.share).toFixed(1), dist = (P.ab_dist_um / 1000).toFixed(2);
  const l1 = `B 的蓝色占比是 A 的 ${ratio} 倍`, l2 = `相隔 ${dist} mm · 同一切片 · 同一染色`;
  ctx.save(); ctx.font = '500 34px SC'; const w1 = ctx.measureText(l1).width; ctx.restore();
  const pw = Math.max(w1, 440) + 64, px = W / 2 - pw / 2, py = 54;
  const y = 12 * (1 - eo(seg(t, T.verdict, T.verdict + 0.35)));
  panel(px, py + y, pw, 104, a);
  text(l1, W / 2, py + y + 48, '500 34px SC', WHITE_T, { align: 'center', alpha: a, id: 'v1' });
  text(l2, W / 2, py + y + 84, '400 21px SC', 'rgba(248,247,244,0.7)', { align: 'center', alpha: a, id: 'v2' });
}

// ------------------------------------------------------------------ the nucleus
function nucleus(c, t) {
  const a = 1 - ss(seg(t, T.pull - 0.05, T.pull + 0.3));
  if (t < T.ring || a <= 0.003) return;
  const s = toS(c, N), r = NU.r_px * c.k;
  const draw = eio(seg(t, T.ring, T.ring + 0.5));
  ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(s[0], s[1], r + 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * draw);
  ctx.strokeStyle = 'rgba(10,6,8,0.5)'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = MINT; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.restore();
  const ta = a * ss(seg(t, T.ring + 0.3, T.ring + 0.6));
  for (const sg of [-1, 1]) line([[s[0] + sg * (r + 8), s[1]], [s[0] + sg * (r + 20), s[1]]], MINT, 'rgba(10,6,8,0.45)', 2, ta);
  const g = eo(seg(t, T.ring + 0.25, T.ring + 0.6));
  const p0 = [s[0] - (r + 8) * 0.7, s[1] - (r + 8) * 0.7], el = [p0[0] - 80 * g, p0[1] - 110 * g], end = [el[0] - 50 * g, el[1]];
  line([p0, el, end], WHITE_T, 'rgba(10,8,10,0.45)', 1.5, ta);
  const ra = a * ss(seg(t, T.ring - 0.1, T.ring + 0.12));
  const pw = 300, ph = 150, px = end[0] - pw, py = end[1] - ph / 2;
  panel(px, py, pw, ph, ra);
  text('肝细胞核', px + 22, py + 38, '500 22px SC', 'rgba(248,247,244,0.85)', { alpha: ra, id: 'nl' });
  text(`${NU.d_um.toFixed(1)} µm`, px + 22, py + 104, '400 72px BC', MINT, { alpha: ra, id: 'nv' });
  text('核膜外缘拟合', px + 22, py + 136, '400 20px SC', 'rgba(248,247,244,0.62)', { alpha: ra, id: 'nm' });
}

// ------------------------------------------------------------------ end card: written on the glass
function card(c, t) {
  const a = ss(seg(t, T.card + 0.1, T.card + 0.8));
  if (a <= 0.003) return;
  const x = 150, y = 300, ink = INK, halo = 'rgba(255,253,250,0.8)';
  const u = eo(seg(t, T.card + 0.1, T.card + 0.9));
  text('量出来的蓝', x, y + 20 * (1 - u), '600 92px SS', ink, { alpha: a, halo, id: 'c1' });
  text('Measured Blue', x + 4, y + 66 + 14 * (1 - u), '300 46px BC', 'rgba(24,27,31,0.78)', { alpha: a * ss(seg(t, T.card + 0.3, T.card + 0.9)), id: 'c2' });
  const rl = eo(seg(t, T.card + 0.5, T.card + 1.2));
  line([[x + 4, y + 104], [x + 4 + 520 * rl, y + 104]], 'rgba(24,27,31,0.55)', null, 1.4, a);
  const b = a * ss(seg(t, T.card + 0.35, T.card + 0.75));
  text('MICROSCOPE STORY · 显微叙事', x + 4, y + 146, '500 22px PM', 'rgba(24,27,31,0.8)', { alpha: b, id: 'c3' });
  text('LemoLab × Claude Opus 5.5', x + 4, y + 184, '400 24px BC', 'rgba(24,27,31,0.8)', { alpha: b, id: 'c4' });
  text('数据：Ventana-1 · PathAI · CC0', x + 4, y + 220, '400 20px SC', 'rgba(24,27,31,0.6)', { alpha: b, id: 'c5' });
}

// ------------------------------------------------------------------ sound and cue events (mix.py reads these)
window.EV = [
  ...OBJ.map(e => ({ t: e.t, type: 'objective', up: e.up, mag: e.to === 'slide' ? 0 : +MAG[e.to] })),
  { t: T.open, type: 'open' }, { t: T.push, type: 'push' }, { t: T.tissue, type: 'dimension' },
  { t: T.circA, type: 'circle' }, { t: T.scanA, type: 'scan', dur: T.landA - 0.2 - T.scanA }, { t: T.landA, type: 'land', v: RA.share },
  { t: T.truck, type: 'truck' }, { t: T.circB, type: 'circle' }, { t: T.scanB, type: 'scan', dur: T.landB - 0.2 - T.scanB }, { t: T.landB, type: 'land', v: RB.share },
  { t: T.both, type: 'both' }, { t: T.verdict, type: 'verdict' }, { t: T.dive, type: 'dive' },
  { t: T.land - 0.1, type: 'sweep', dur: 1.05 }, { t: T.ring, type: 'ring' }, { t: T.landN, type: 'landN' },
  { t: T.pull, type: 'pull' }, { t: T.card, type: 'card' },
].sort((p, q) => p.t - q.t);
window.TEXTS = t => { window.render(t); return TX; };

window.render = t => {
  TX = [];
  const c = camAt(t);
  drawSpecimen(c, t);
  composite(c, t);
  opening(c, t);
  dimension(c, t);
  circle(c, t, 'A'); circle(c, t, 'B');
  verdict(t);
  nucleus(c, t);
  card(c, t);
  instruments(c, t);
  subtitles(t);
};
window.CAM = { camAt, fovOf, OBJ, KEYS };
window.render(0);
window.READY = true;
