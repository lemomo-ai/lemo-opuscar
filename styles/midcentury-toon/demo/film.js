// "Meet Pip" — a product set-up guide in the mid-century cartoon style.
// Everything readable comes from content.json; the timeline is rebuilt from the number of steps and the voice durations,
// always on the 132 BPM grid. Scenes only call the engine (engine/*.js).
import { PAL, setClock, shape, plane, ink, rays, ellipse, rect, rrect, spline, move, xform, star, sparkle, text, fit, measure, arrow, dashed,
  paperFinish, kidney, boomerang, subpath, pointAt, plen, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, hash } from './engine/toon.js';
import { drawOwner, drawPip, drawDock, drawHand, armJoints } from './engine/chars.js';
import { icon } from './engine/icons.js';

const W = 1920, H = 1080;
export const BPM = 132, BEAT = 60 / BPM, BAR = BEAT * 4;
let C = null, D = {}, T = null, COL = null, EVS = [];

// ------------------------------------------------------------------ colour helpers
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const tint = (c, k) => mix(c, '#FFFFFF', k), shade = (c, k) => mix(c, '#2B2420', k);

// ------------------------------------------------------------------ timeline
export function setup(content, durs) {
  C = content; D = durs || {};
  const p = C.palette || {};
  COL = { paper: p.paper || PAL.paper, ink: p.ink || PAL.ink, product: p.product || PAL.teal, productD: p.productDark || PAL.tealD, accent: p.accent || PAL.coral,
    hook: p.hook || PAL.mustard, steps: p.steps || [PAL.blue, PAL.mustard, PAL.avocado, PAL.pink, PAL.plum], tip: p.tip || PAL.pink };
  const vd = k => D[k] ?? estimate(k);
  const S = []; let bar = 0;
  const add = (kind, bars, extra = {}) => { S.push({ kind, t0: bar * BAR, t1: (bar + bars) * BAR, bar0: bar, bars, ...extra }); bar += bars; };
  add('hook', 4);
  const n = C.steps.length;
  C.steps.forEach((s, i) => add('step', i === n - 1 ? 2 : Math.max(3, Math.ceil((vd('step' + i) + 1.6) / BAR)), { i, last: i === n - 1 }));
  add('payoff', 3); add('tip', 2); add('lockup', 3); add('end', 2);
  T = { S, dur: bar * BAR };
  // voice cues: each step's line opens half a beat before its iris (J-cut)
  const V = [];
  V.push({ id: 'hook', t: S[0].t0 + BAR + 0.16 });
  S.filter(s => s.kind === 'step').forEach(s => V.push({ id: 'step' + s.i, t: s.t0 - BEAT * 0.5 }));
  V.push({ id: 'tip', t: sec('tip').t0 + 0.08 });
  V.push({ id: 'outro', t: sec('lockup').t0 + BEAT + 0.08 });
  V.forEach(v => { v.dur = vd(v.id); v.text = lineOf(v.id); });
  T.V = V;
  PATH = null; buildEvents();
}
function lineOf(k) { return k === 'hook' ? C.hook.line : k === 'tip' ? C.tip.line : k === 'outro' ? C.outro.line : C.steps[+k.slice(4)].line; }
function estimate(k) { return lineOf(k).split(/\s+/).length / 2.9 + 0.2; }
const sec = kind => T.S.find(s => s.kind === kind);
export const DUR = () => T.dur;
export function section(t) { return T.S.find(s => t >= s.t0 && t < s.t1) || T.S[T.S.length - 1]; }
function subs() {
  return T.V.map(v => {
    const read = v.text.length / 12 + 1;
    return { t0: v.t, t1: v.t + Math.max(1.8, v.dur + 0.6, read), text: v.text };
  });
}
export function srtCues() { return subs().map(s => ({ t0: s.t0, t1: s.t1, text: s.text })); }
export function events() { return EVS; }
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(4), type, ...o });

// ------------------------------------------------------------------ helpers
function cam(ctx, cx, cy, z = 1, r = 0) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.rotate(r); ctx.translate(-cx, -cy); }
const w2s = (x, y, c) => { const dx = x - c.cx, dy = y - c.cy, co = Math.cos(c.r || 0), si = Math.sin(c.r || 0); return [W / 2 + c.z * (co * dx - si * dy), H / 2 + c.z * (si * dx + co * dy)]; };
function bg(ctx, col) { ctx.fillStyle = col; ctx.fillRect(-4000, -4000, 9920, 9080); }
const B = (s, b) => s.t0 + b * BEAT;          // absolute time of beat b in section s
const pop = (t, t0, d = 0.28) => back(seg(t, t0, t0 + d), 1.9);
function blinkAt(u, ts) { return ts.some(b => u > b && u < b + 0.13) ? 1 : 0; }
const colsOf = () => ({ product: COL.product, productD: COL.productD });

// 1950s caption card
function subtitle(ctx, t) {
  const cue = subs().find(s => t >= s.t0 && t < s.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + 0.16)), 1 - ss(seg(t, cue.t1 - 0.16, cue.t1)));
  const f = fit(ctx, cue.text, '500 {px}px Jost', 42, 1280, 1, 30);
  const w = measure(ctx, f.lines[0], f.font) + 120, h = 78, x = W / 2 - w / 2, y = H - 60 - h;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 10);
  shape(ctx, rrect(x, y, w, h, 12), { fill: COL.paper, line: 3.2, seed: 901, grain: 0.15, breaks: 0.08, off: [5, 5] });
  star(ctx, x + 30, y + h / 2, 14, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: t * 0.8 });
  star(ctx, x + w - 30, y + h / 2, 14, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: -t * 0.8 });
  text(ctx, f.lines[0], W / 2, y + h / 2 + f.px * 0.34, { font: f.font, fill: COL.ink, align: 'center' });
  ctx.restore();
}
// step header: ink numeral badge + slab title (slides in on twos)
function stepHeader(ctx, t, s, label, num) {
  const k = eo(seg(twos(t), s.t0 + 0.05, s.t0 + 0.4));
  if (k <= 0) return;
  ctx.save(); ctx.translate(-(1 - k) * 520, 0);
  shape(ctx, ellipse(128, 132, 54, 54, 40), { fill: COL.ink, line: 0, seed: 700, grain: 0.1, off: [0, 0] });
  if (typeof num === 'number') text(ctx, String(num), 128, 154, { font: '62px Slab', fill: COL.paper, align: 'center' });
  else star(ctx, 128, 132, 40, { n: 12, inner: 0.6, fill: COL.accent, off: [0, 0] }), text(ctx, num, 128, 141, { font: '24px Slab', fill: PAL.white, align: 'center' });
  const small = typeof num === 'number' ? `STEP ${num} OF ${C.steps.length}` : '';
  if (small) text(ctx, small, 206, 104, { font: '600 22px Jost', fill: COL.ink, track: 6 });
  const f = fit(ctx, label, '{px}px Slab', 64, 1100, 1, 40);
  text(ctx, f.lines[0], 204, small ? 170 : 156, { font: f.font, fill: COL.ink, plate: PAL.white, off: [4, 4] });
  ctx.restore();
}
// detail tag: paper card with an accent star, pops on its beat
function tag(ctx, t, t0, str, x, y, o = {}) {
  const k = pop(t, t0); if (k <= 0) return null;
  const f = fit(ctx, str, '500 {px}px Jost', o.px || 36, o.maxW || 620, 2, 24);
  const w = Math.max(...f.lines.map(l => measure(ctx, l, f.font))) + 96, h = 30 + f.lines.length * f.px * 1.2;
  const X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.translate(X + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(X + w / 2), -(y + h / 2));
  shape(ctx, rrect(X, y, w, h, 14), { fill: COL.paper, line: 3.6, seed: 710, grain: 0.15, off: [6, 5] });
  star(ctx, X + 38, y + h / 2, 17, { n: 8, inner: 0.42, fill: COL.accent, off: [0, 0], rot: t * 0.6 });
  f.lines.forEach((l, i) => text(ctx, l, X + 66, y + 15 + f.px * 0.92 + i * f.px * 1.2, { font: f.font, fill: COL.ink }));
  ctx.restore();
  return { x: X, y, w, h };
}
// frame-in-frame detail circle (the manual's magnifier call-out) with a leader line to its subject
function callout(ctx, t, t0, cx, cy, r, inner, bgc, leader) {
  const k = back(seg(t, t0, t0 + 0.32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) { const a = Math.atan2(leader[1] - cy, leader[0] - cx); dashed(ctx, [[cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)], leader], 4, 14, 10, -t * 40, COL.ink, clamp(k)); shape(ctx, ellipse(leader[0], leader[1], 9, 9, 12), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 }); }
  shape(ctx, ellipse(cx, cy, R + 16, R + 16, 72), { fill: COL.paper, line: 4.5, seed: 720, grain: 0.15, breaks: 0.05 });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.translate(cx, cy); ctx.scale(k, k); inner(ctx); ctx.restore();
  ink(ctx, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 721, breaks: 0.1 });
}
// the step stamp: a numbered medallion that lands on the outgoing scene's subject one beat before the cut
function medallionAt(ctx, t, tStamp, x, y, i, r = 104) {
  const k = pop(t, tStamp, 0.24); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.4);
  star(ctx, 0, 0, r * 1.2, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: i * 0.2 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: COL.steps[i % COL.steps.length], line: 5, seed: 730 + i, grain: 0.3 });
  text(ctx, String(i + 1), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px Slab`, fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}

// ------------------------------------------------------------------ HOOK: the box opens like stage curtains
const HOOK = { BX: 1040, FY: 820, BW: 440, BH: 320 };
function hookCam(u, dur) { return { cx: 1010, cy: 560, z: lerp(1.0, 1.07, ss(u / dur)), r: 0 }; }
function sceneHook(ctx, t, s) {
  const u = t - s.t0, { BX, FY, BW, BH } = HOOK;
  bg(ctx, COL.hook);
  ctx.save();
  const c = hookCam(u, s.t1 - s.t0); cam(ctx, c.cx, c.cy, c.z);
  plane(ctx, rect(-300, FY - 4, W + 600, 700), tint(COL.hook, 0.35), { grain: 0.3 });
  ink(ctx, [[120, FY - 4], [1820, FY - 6]], 4, { breaks: 0.35, seed: 5, taper: true });
  const sb = back(seg(u, 3 * BEAT - 0.05, 3 * BEAT + 0.32), 1.6);
  if (sb > 0) {
    rays(ctx, BX, FY - 170, 30, 1500 * clamp(sb), tint(COL.hook, 0.35), { rot: u * 0.06, alpha: 0.55 });
    const r = 330 * sb;
    shape(ctx, ellipse(BX, FY - 170, r, r, 80), { fill: COL.paper, line: 0, grain: 0.15, off: [0, 0] });
    ink(ctx, ellipse(BX, FY - 170, r + 22, r + 22, 80), 4, { closed: true, seed: 9, breaks: 0.4 });
    for (let i = 0; i < 6; i++) {
      const a = -2.05 + i * 0.44 + Math.sin(u * 1.3 + i) * 0.03, rr = r + 90 + (i % 2) * 50, k = back(seg(u, 3 * BEAT + 0.1 + i * 0.045, 3 * BEAT + 0.35 + i * 0.045));
      sparkle(ctx, BX + Math.cos(a) * rr, FY - 170 + Math.sin(a) * rr, (26 + (i % 3) * 12) * k, { fill: i % 2 ? COL.accent : PAL.white });
    }
  }
  const bw = 1 - eio(seg(u, 3 * BEAT - 0.18, 3 * BEAT));
  if (bw > 0.01) shape(ctx, [[BX - BW / 2, FY - BH * bw], [BX + BW / 2, FY - BH * bw], [BX + BW / 2, FY], [BX - BW / 2, FY]], { fill: PAL.kraftD, line: 4, seed: 20, grain: 0.35 });
  shape(ctx, [[BX - BW / 2 - 6, FY - 26], [BX + BW / 2 + 6, FY - 26], [BX + BW / 2, FY + 6], [BX - BW / 2, FY + 6]], { fill: PAL.kraft, line: 4, seed: 21, grain: 0.35,
    shade: [{ pts: rect(BX + BW / 2 - 70, FY - 30, 80, 40), color: PAL.kraftD }] });
  const hop = Math.sin(Math.PI * seg(u, 4 * BEAT - 0.02, 4 * BEAT + 0.34)) * 34;
  const land = seg(u, 4 * BEAT + 0.34, 4 * BEAT + 0.5);
  const hello = [10, 10.5].some(k => u >= k * BEAT && u < k * BEAT + 0.12);
  drawPip(ctx, BX, FY - 26 - hop, { s: 1.42, light: u > 4 * BEAT && !hello ? 1 : 0, brush: twos(u) * 5, colors: colsOf() });
  if (land > 0 && land < 1) for (let i = 0; i < 2; i++) sparkle(ctx, BX + (i ? 230 : -230), FY - 60, 30 * Math.sin(land * Math.PI), { fill: PAL.white });
  const fl = Math.sin(u * 9) * Math.exp(-u * 2.5) * 0.12;
  if (bw > 0.01) {
    const top = FY - BH * bw;
    shape(ctx, xform([[0, 0], [-BW / 2, 0], [-BW / 2 - 40, -110], [-20, -130]], BX - 2, top, -0.25 + fl), { fill: PAL.kraftL, line: 3.5, seed: 22, grain: 0.3 });
    shape(ctx, xform([[0, 0], [BW / 2, 0], [BW / 2 + 40, -110], [20, -130]], BX + 2, top, 0.25 - fl), { fill: PAL.kraftL, line: 3.5, seed: 23, grain: 0.3 });
  }
  const door = (side, th) => {
    const xh = BX + side * BW / 2, w = BW / 2, co = Math.cos(th), sn = Math.sin(th);
    const xe = xh - side * w * co, dh = BH * 0.08 * sn, outer = co > 0;
    const pts = [[xh, FY - BH], [xe, FY - BH - dh], [xe, FY + dh * 0.6], [xh, FY]];
    shape(ctx, pts, { fill: outer ? PAL.kraft : PAL.kraftL, line: 4, seed: 30 + side, grain: 0.35 });
    if (outer && co > 0.15) {
      ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
      ctx.translate(xh, 0); ctx.scale(co, 1); ctx.translate(-xh, 0);
      shape(ctx, ellipse(BX, FY - BH / 2, 120, 120, 48), { fill: COL.accent, line: 4, seed: 33, grain: 0.3 });
      text(ctx, (C.product || '').toUpperCase(), BX, FY - BH / 2 + 30, { font: '96px Slab', fill: PAL.white, align: 'center', maxW: 220 });
      ctx.restore();
    } else if (!outer) {
      for (let k = 1; k < 5; k++) { const xx = lerp(xh, xe, k / 5); ink(ctx, [[xx, FY - BH + 26 - dh * k / 5], [xx, FY - 20 + dh * 0.6 * k / 5]], 2.2, { seed: 34 + side * 7 + k, color: PAL.kraftD, breaks: 0.3 }); }
    }
  };
  door(-1, lerp(0.42, Math.PI * 0.8, back(seg(u, 0, BEAT), 1.3)));
  door(1, lerp(0.2, Math.PI * 0.8, back(seg(u, BEAT * 0.4, 2 * BEAT), 1.3)));
  // June: reaching (anticipation) -> one in-between -> ta-da on the downbeat of bar 2 -> arms settle (follow-through)
  const tu = twos(u);
  const wig = Math.floor(tu * 6) % 2 ? 0.08 : -0.04;
  const pose = tu >= 4 * BEAT + 1.3 ? { armB: { a1: 1.95, a2: 1.72 }, armF: { a1: -0.35, a2: -0.15 + (tu > 6 * BEAT && tu < 9 * BEAT ? wig : 0) }, face: tu > 12 * BEAT ? 'neutral' : 'happy', handB: 'open', handF: 'open' }
    : tu >= 4 * BEAT - 1 / 12 ? { armB: { a1: -2.25, a2: -2.05 }, armF: { a1: -0.9, a2: -1.1 }, face: 'happy', handB: 'open', handF: 'open' }
      : tu >= 4 * BEAT - 3 / 12 ? { armB: { a1: 2.95, a2: -2.7 }, armF: { a1: 0.05, a2: -0.45 }, face: 'wow', handB: 'open', handF: 'open' }
        : { armB: { a1: 2.5, a2: 2.9 }, armF: { a1: 2.2, a2: 2.75 }, face: 'wow', handB: 'open', handF: 'open' };
  drawOwner(ctx, { x: 1560, y: FY + 4, s: 1.04, dir: -1, view: 'q', blink: blinkAt(u, [3.3, 5.9]), ...pose }, u);
  ctx.restore();
  // lettering: layer 1 = product name, layer 2 = title
  const k1 = seg(u, 4 * BEAT, 4 * BEAT + 0.55);
  if (k1 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 130 + 760 * eo(k1), H); ctx.clip();
    text(ctx, C.hook.kicker, 130, 300, { font: '700 176px Oleo', fill: COL.ink, plate: PAL.white, off: [7, 7], rot: -0.06, maxW: 760 }); ctx.restore(); }
  const k2 = back(seg(u, 6 * BEAT, 6 * BEAT + 0.3)), k3 = back(seg(u, 8 * BEAT, 8 * BEAT + 0.3));
  if (k2 > 0) {
    const f = fit(ctx, C.title, '{px}px Slab', 66, 720, 2, 44);
    ctx.save(); ctx.translate(140, 400); ctx.scale(k2, k2);
    f.lines.forEach((l, i) => text(ctx, l, 0, i * f.px * 1.1, { font: f.font, fill: COL.ink, plate: COL.accent, off: [5, 4] }));
    ctx.restore();
    if (k3 > 0) {
      const y = 400 + f.lines.length * f.px * 1.1 + 12, st = C.subtitle.toUpperCase();
      ctx.save(); ctx.globalAlpha = clamp(k3); ctx.translate(140, y);
      shape(ctx, rrect(0, -40, measure(ctx, st, '600 32px Jost', 7) + 46, 58, 29), { fill: COL.ink, line: 0, grain: 0.1, off: [0, 0] });
      text(ctx, st, 23, 1, { font: '600 32px Jost', fill: COL.paper, track: 7 });
      ctx.restore();
    }
  }
  const fp = w2s(BX, FY - 26 - 56 * 1.42 - 20, c);
  medallionAt(ctx, t, B(s, s.bars * 4 - 1), fp[0], fp[1], 0);
  return { focus: fp };
}

// ------------------------------------------------------------------ STEPS
// A step = a wide shot (June doing it) + a frame-in-frame detail circle where the hands do the real action on the beat.
// Each action returns the screen point where the next step's medallion will land.
function sceneStep(ctx, t, s) {
  const st = C.steps[s.i], col = COL.steps[s.i % COL.steps.length];
  const act = { place: actPlace, tap: actTap, press: actPress }[st.action] || actShow;
  const r = act(ctx, t, s, st, col);
  stepHeader(ctx, t, s, st.title, s.i + 1);
  return r;
}
function floor(ctx, col, y, x0 = -2000, x1 = 4000) {
  plane(ctx, rect(x0, y, x1 - x0, 2000), shade(col, 0.16), { grain: 0.3 });
  ink(ctx, [[x0 + 2100, y], [x1 - 2100, y + 2]], 4, { breaks: 0.3, seed: 801 });
}
// -- step action: place (push the thing against a wall, then show the clearance)
function actPlace(ctx, t, s, st, col) {
  const u = t - s.t0, b = x => B(s, x);
  bg(ctx, col);
  const FY = 820, WX = 1345;
  // push: anticipation (pull back) b1.5-b2.5, push lands b3.5, follow-through recoil
  const pullK = ss(seg(t, b(1.6), b(2.4))), pushK = eo(seg(t, b(2.9), b(3.5))), rec = Math.sin(Math.PI * seg(t, b(3.5), b(3.9))) * 8;
  const dockX = 1180 - pullK * 24 + pushK * (WX - 64 - 1180 + 24) - rec;
  const c = { cx: lerp(960, 1120, ss(seg(t, s.t0, b(4)))), cy: 600, z: lerp(1.0, 1.1, ss(seg(t, s.t0, s.t1))) };
  ctx.save(); cam(ctx, c.cx, c.cy, c.z);
  floor(ctx, col, FY);
  // the wall: a lighter slab with a baseboard and an outlet
  plane(ctx, rect(WX, -1000, 2000, FY + 1000), tint(col, 0.45), { grain: 0.25 });
  ink(ctx, [[WX, -400], [WX, FY]], 5, { seed: 802 });
  shape(ctx, rect(WX, FY - 30, 2000, 30), { fill: COL.paper, line: 3.5, seed: 803, grain: 0.2 });
  const OX = WX + 90, OY = 660;
  shape(ctx, rrect(OX - 30, OY - 44, 60, 88, 10), { fill: COL.paper, line: 3.5, seed: 804 });
  [[-9, -14], [9, -14], [-9, 14], [9, 14]].forEach(([dx, dy], i) => shape(ctx, rrect(OX + dx - 3, OY + dy - 8, 6, 16, 2), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 }));
  // cord: dock -> outlet once plugged (b5)
  const plugged = t >= b(5);
  const cordEnd = plugged ? [OX, OY + 14] : [dockX + 120, FY - 10];
  ink(ctx, spline([[dockX + 50, FY - 20], [dockX + 100, FY - 4], [lerp(dockX + 110, OX - 30, 0.6), FY - 30], cordEnd], false, 8), 5, { seed: 805, taper: false });
  drawDock(ctx, dockX, FY, 0.9, 0, { light: plugged, face: COL.product });
  // June kneeling behind the dock; hands flat on its back, arms follow the dock
  const lift = ss(seg(t, b(4.4), b(5))) * 70;
  const reach = dockX - 58 - lift * 0.3, hy = FY - 92 - lift;
  const pose = kneelPose(1040, FY, 1.0, [reach, hy], [reach - 18, hy + 22], u, t >= b(3.5) && t < b(4.4) ? 'focus' : t >= b(4.4) ? 'happy' : 'neutral');
  drawOwner(ctx, pose, u);
  ctx.restore();
  // detail circle: close-up of the hands pushing (b2) -> flips to the front clearance diagram (b5)
  const CX = 1440, CY = 330, R = 250;
  const flip = seg(t, b(5), b(5.4)), sq = Math.abs(Math.cos(flip * Math.PI));
  callout(ctx, t, b(2), CX, CY, R, g => {
    g.save(); g.scale(Math.max(0.02, sq), 1);
    if (flip < 0.5) closePush(g, t, b, col, dockX); else clearance(g, t, b, col, st);
    g.restore();
  }, tint(col, 0.55), w2s(dockX, FY - 90, c));
  tag(ctx, t, b(4.5), st.detail, CX, CY + R - 20, { align: 'center', maxW: 520 });
  medallionAt(ctx, t, b(11), CX, CY, s.i + 1);
  return { focus: [CX, CY] };
}
function kneelPose(x, fy, s, handF, handB, u, face) {
  // arms solved (2-bone IK) so the flat hands sit on the given world points
  const pose = { x, y: fy, s, dir: 1, view: 'q', kneel: true, face, blink: blinkAt(u, [0.9, 3.6]), handF: 'flat', handB: 'flat' };
  const ik = (which, target) => {
    const sh = armJoints({ ...pose, armF: { a1: 0, a2: 0 }, armB: { a1: 0, a2: 0 } }, which).sh;
    const sx = x + sh[0] * s, sy = fy + (sh[1] + 150) * s;
    const dx = (target[0] - sx) / s, dy = (target[1] - sy) / s, d = Math.min(Math.hypot(dx, dy), 190), base = Math.atan2(dy, dx);
    const a = Math.acos(clamp((100 * 100 + d * d - 92 * 92) / (2 * 100 * d), -1, 1));
    const a1 = base - a, el = [Math.cos(a1) * 100, Math.sin(a1) * 100];
    const a2 = Math.atan2(dy * d / Math.hypot(dx, dy) - el[1], dx * d / Math.hypot(dx, dy) - el[0]);
    return { a1, a2 };
  };
  pose.armF = ik('F', handF); pose.armB = ik('B', handB);
  return pose;
}
function closePush(g, t, b, col, dockX) {
  // big hands flat on the dock, pushing it to the wall line
  const push = eo(seg(t, b(2.9), b(3.5))), pull = ss(seg(t, b(1.6), b(2.4))), rec = Math.sin(Math.PI * seg(t, b(3.5), b(3.9))) * 10;
  const x = -120 - pull * 30 + push * 150 - rec, lift = ss(seg(t, b(4.2), b(4.7))) * 40;
  plane(g, rect(-400, 90, 800, 400), shade(col, 0.16), { grain: 0.3 });
  plane(g, rect(150, -400, 400, 490), tint(col, 0.25), { grain: 0.25 });
  ink(g, [[150, -400], [150, 90]], 5, { seed: 811 }); ink(g, [[-400, 90], [400, 90]], 4, { seed: 812 });
  drawDock(g, x, 90, 1.7, 0, { face: COL.product, light: t >= b(5) });
  drawHand(g, x - 150, 0 - lift, 0.1, 'flat', 1, 2.3);
  drawHand(g, x - 160, 50 - lift, 0.05, 'flat', 1, 2.3);
  if (t > b(3.45) && t < b(3.9)) { const k = seg(t, b(3.45), b(3.9)); for (let i = 0; i < 3; i++) ink(g, [[160 + 14, -60 + i * 50], [160 + 14 + 30 * k + 10, -70 + i * 50 - 10 * k]], 4, { seed: 813 + i }); }
}
function clearance(g, t, b, col, st) {
  // front view: dock against the wall, two dimension arrows grow out on the beat
  plane(g, rect(-400, 100, 800, 400), shade(col, 0.16), { grain: 0.3 });
  plane(g, rect(-400, -400, 800, 500), tint(col, 0.35), { grain: 0.2 });
  ink(g, [[-400, 100], [400, 100]], 4, { seed: 821 });
  drawDock(g, 0, 100, 0.95, 0, { face: COL.product, light: true });
  const m = st.measure || '';
  [[-1, b(5.5)], [1, b(6)]].forEach(([sd, tt], i) => {
    const k = eo(seg(t, tt, tt + 0.3)); if (k <= 0) return;
    const x0 = sd * 70, x1 = sd * (70 + 110 * k);
    ink(g, [[x0, -150], [x0, -20]], 3, { seed: 822 + i, taper: false });
    if (k > 0.95) ink(g, [[sd * 180, -150], [sd * 180, -20]], 3, { seed: 824 + i, taper: false });
    arrow(g, [x0 + sd * 6, -100], [x1, -100], { u: 1, bend: 0, w: 5, head: 26, fill: COL.accent, bob: 0, seed: 826 + i });
    if (m && k > 0.6) text(g, m, sd * 125, -122, { font: '600 34px Jost', fill: COL.ink, align: 'center', alpha: seg(k, 0.6, 1) });
  });
}
// -- step action: tap (phone pairing)
function actTap(ctx, t, s, st, col) {
  const u = t - s.t0, b = x => B(s, x);
  bg(ctx, col);
  const FY = 900;
  const c = { cx: lerp(820, 900, ss(seg(t, s.t0, b(6)))) + ss(seg(t, b(6), b(9))) * 120, cy: 560, z: lerp(1.0, 1.12, ss(seg(t, s.t0, b(5)))) };
  ctx.save(); cam(ctx, c.cx, c.cy, c.z);
  floor(ctx, col, FY);
  // June holding the phone at chest height; free hand does the tapping gesture in sync with the close-up
  const tapPh = t >= b(3.6) && t < b(4) || t >= b(4.6) && t < b(5) ? 1 : 0;
  const pose = { x: 600, y: FY, s: 1.18, dir: 1, view: 'q', face: t < b(8) ? 'focus' : 'happy', look: [6, 8], blink: blinkAt(u, [1.2]),
    armF: { a1: 1.05, a2: -0.72 }, armB: { a1: 0.95, a2: -0.2 - tapPh * 0.25 }, handF: 'grip', handB: 'point', prop: { kind: 'phone', hand: 'F', behind: false, rot: -0.12 } };
  drawOwner(ctx, pose, u);
  const J = armJoints(pose, 'F'), ph = [600 + (J.ha[0] + 16) * 1.18, FY + (J.ha[1] - 30) * 1.18];
  // Pip across the room; wifi rings travel phone -> Pip on b6/b7/b8, Pip blinks as each arrives
  const PX = 1420, PY = FY + 6;
  const arrive = [6, 7, 8].map(k => b(k));
  const lit = arrive.some(a => t >= a + 0.3 && t < a + 0.3 + 0.18) || t >= b(8) + 0.5;
  drawPip(ctx, PX, PY, { s: 0.95, light: lit ? 1 : 0, colors: colsOf() });
  arrive.forEach((a, i) => {
    const k = seg(t, a, a + 0.42); if (k <= 0 || k >= 1) return;
    const cx = lerp(ph[0], PX, k), cy = lerp(ph[1], PY - 80, k) - Math.sin(k * Math.PI) * 80;
    const sc = 1 + k * 0.6;
    for (let j = 0; j < 3; j++) { const rr = (34 + j * 30) * sc; ink(ctx, move(ellipse(cx - 60, cy, rr, rr, 22, -0.75, 0.75), 4, 3), 13, { seed: 840 + j, color: COL.accent, taper: false }); ink(ctx, ellipse(cx - 60, cy, rr, rr, 22, -0.75, 0.75), 4, { seed: 845 + j, color: COL.ink, taper: false }); }
  });
  ctx.restore();
  // detail circle: the phone screen, big, with the index finger tapping twice
  const CX = 1340, CY = 330, R = 250;
  callout(ctx, t, b(2), CX, CY, R, g => phoneClose(g, t, b, st), tint(col, 0.5), w2s(ph[0], ph[1], c));
  tag(ctx, t, b(5), st.detail, CX, CY + R - 20, { align: 'center', maxW: 520 });
  const pipS = w2s(PX, PY - 80, c);
  medallionAt(ctx, t, b(11), pipS[0], pipS[1], s.i + 1);
  return { focus: pipS };
}
function phoneClose(g, t, b, st) {
  // phone body
  shape(g, rrect(-120, -210, 240, 440, 30), { fill: COL.ink, line: 0, seed: 850, grain: 0.1, off: [0, 0] });
  shape(g, rrect(-100, -180, 200, 360, 12), { fill: COL.paper, line: 0, seed: 851, grain: 0.1, off: [0, 0] });
  const page2 = t >= b(4.05), done = t >= b(8);
  text(g, (C.product || '').toUpperCase(), 0, -140, { font: '30px Slab', fill: COL.ink, align: 'center' });
  if (!page2) {
    const k = t >= b(3.95) && t < b(4.25) ? 0.9 : 1;
    shape(g, ellipse(0, -10, 70 * k, 70 * k, 40), { fill: COL.accent, line: 4, seed: 852 });
    text(g, '+', 0, 12, { font: '80px Slab', fill: PAL.white, align: 'center' });
  } else {
    // wifi list; second tap selects the home network (the detail)
    const sel = t >= b(4.95);
    ['Home', 'Guest'].forEach((n, i) => {
      const y = -80 + i * 70, on = sel && i === 0;
      shape(g, rrect(-86, y, 172, 54, 10), { fill: on ? COL.product : PAL.white, line: 3, seed: 853 + i, grain: 0.1 });
      for (let j = 0; j < 3; j++) ink(g, ellipse(-58, y + 38, 6 + j * 7, 6 + j * 7, 10, -2.4, -0.74), 3, { seed: 860 + j, color: on ? PAL.white : COL.ink, taper: false });
      text(g, n, -30, y + 36, { font: '500 26px Jost', fill: on ? PAL.white : COL.ink });
    });
    if (done) { const k = pop(t, b(8)); g.save(); g.translate(0, 110); g.scale(k, k); icon(g, 'check', 0, 0, 90, { main: COL.product }); g.restore(); }
  }
  // the finger: anticipation lift, tap, follow-through
  const tapAt = [b(4), b(5)], target = [[0, -10], [0, -53]];
  let fx = 150, fy = 150, press = 0;
  const cur = t < b(4.5) ? 0 : 1, tt = tapAt[cur];
  const pre = ss(seg(t, tt - 0.45, tt - 0.12)), down = seg(t, tt - 0.12, tt), up = ss(seg(t, tt + 0.05, tt + 0.35));
  const tg = target[cur];
  fx = lerp(150, tg[0] + 20, pre); fy = lerp(150, tg[1] + 70, pre) - pre * 20 + down * 20 * (1 - up) + up * 60;
  if (t > b(8.5)) { fx = 180; fy = 200; }
  drawHand(g, fx + 40, fy + 40, -2.25, 'point', 1, 2.4);
  if (t >= tt && t < tt + 0.3) { const k = seg(t, tt, tt + 0.3); ink(g, ellipse(tg[0], tg[1], 20 + k * 60, 20 + k * 60, 30), 4, { closed: true, color: COL.accent, alpha: 1 - k, seed: 870 }); }
}
// -- step action: press (the start button, hold for a beat-length second)
function actPress(ctx, t, s, st, col) {
  const u = t - s.t0, b = x => B(s, x);
  bg(ctx, col);
  const c = { cx: 960, cy: lerp(480, 545, ss(seg(t, s.t0, b(2.5)))), z: 1 };
  ctx.save(); cam(ctx, c.cx, c.cy, c.z);
  // a flat radial floor + rays for the close-up
  rays(ctx, 960, 760, 28, 1400, tint(col, 0.25), { rot: u * 0.05, alpha: 0.6 });
  const PX = 960, PY = 808, S = 2.3;
  const hover = Math.sin(u * 5) * 6;
  const tPress = b(5), pre = ss(seg(t, b(3.8), b(4.6))), down = eio(seg(t, b(4.75), tPress)), rel = ss(seg(t, B(s, 8) - 0.02, B(s, 8) + 0.18));
  const pressed = t >= tPress && t < B(s, 8) + 0.05;
  const btn = [PX - 6 * S, PY - (56 + 4) * S];
  drawPip(ctx, PX, PY, { s: S, light: t >= B(s, 8) ? 1 : 0, press: pressed ? 1 : 0, colors: colsOf() });
  // hold ring: fills over two beats while held
  const hk = seg(t, tPress, tPress + 2 * BEAT);
  if (hk > 0) {
    ink(ctx, ellipse(btn[0], btn[1], 120, 50, 60), 6, { closed: true, color: shade(COL.productD, 0.2), alpha: 0.35, seed: 880, taper: false });
    ink(ctx, ellipse(btn[0], btn[1], 120, 50, 60, -Math.PI / 2, -Math.PI / 2 + TAU * hk), 12, { color: COL.accent, taper: false, seed: 881 });
  }
  // finger from above: enters b1, hovers, anticipation lift, press, holds, lifts after the click
  const enter = eo(seg(t, b(1), b(2)));
  // wrist height: enters from upper right, hovers, lifts (anticipation), presses, holds, rebounds on release
  const fy = lerp(180, btn[1] - 140, enter) + (t < b(3.8) ? hover : 0) - pre * 50 + down * 90 * (1 - rel) + rel * -70;
  const relB = Math.sin(Math.PI * seg(t, B(s, 8) + 0.05, B(s, 8) + 0.4)) * Math.exp(-3 * seg(t, B(s, 8) + 0.05, B(s, 8) + 0.4));
  // wrist cocks back before the press (hand tilts up), snaps down on the press, springs back after release
  const wristA = Math.PI / 2 + 0.28 - pre * 0.45 + down * 0.45 * (1 - rel) - relB * 0.35;
  const Wr = [btn[0] + 12 + (1 - enter) * 420, fy - 60];
  const fa = -0.68 + pre * 0.08, el = [Wr[0] + Math.cos(fa) * 290, Wr[1] + Math.sin(fa) * 290];
  const ua = -0.1, sh = [el[0] + Math.cos(ua) * 1100, el[1] + Math.sin(ua) * 1100];
  const armP = spline([sh, [(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2], el, [(el[0] + Wr[0]) / 2, (el[1] + Wr[1]) / 2], Wr], false, 8);
  ink(ctx, armP, 72, { seed: 882, taper: false, wob: 0.04 });
  ink(ctx, move(armP, 5, 4), 56, { seed: 883, taper: false, color: PAL.coral, wob: 0.03 });
  // elbow crease + cuff at the wrist
  ink(ctx, [[el[0] - 16, el[1] + 18], [el[0] + 10, el[1] + 4]], 4, { seed: 885, color: PAL.coralD });
  const cd = [Math.cos(fa), Math.sin(fa)], cn = [-cd[1], cd[0]], cc = [Wr[0] + cd[0] * 26, Wr[1] + cd[1] * 26];
  ink(ctx, [[cc[0] + cn[0] * 30, cc[1] + cn[1] * 30], [cc[0] - cn[0] * 30, cc[1] - cn[1] * 30]], 5, { seed: 884, color: PAL.coralD, taper: false });
  drawHand(ctx, Wr[0], Wr[1], wristA, 'point', 1, 2.6);
  ctx.restore();
  const tg = tag(ctx, t, b(2), st.detail, 80, 240, { maxW: 520 });
  if (tg) { const k = clamp(seg(t, b(2), b(2.3))); ctx.save(); ctx.globalAlpha = k; icon(ctx, 'clock', tg.x + tg.w + 60, tg.y + tg.h / 2, 90, { main: COL.accent }); ctx.restore(); }
  return { focus: w2s(btn[0], btn[1], c), btn: w2s(btn[0], btn[1], c) };
}
// -- fallback for any other action: show the icon big, a hand points and taps it on the beat
function actShow(ctx, t, s, st, col) {
  const u = t - s.t0, b = x => B(s, x);
  bg(ctx, col);
  const FY = 860, c = { cx: lerp(880, 980, ss(seg(t, s.t0, s.t1))), cy: 560, z: 1.05 };
  ctx.save(); cam(ctx, c.cx, c.cy, c.z);
  floor(ctx, col, FY);
  const pose = { x: 620, y: FY, s: 1.15, dir: 1, view: 'q', face: t >= b(4) ? 'happy' : 'focus', armF: { a1: 0.5, a2: -0.3 }, handF: 'open', blink: blinkAt(u, [1.4]) };
  drawOwner(ctx, pose, u);
  const J = armJoints(pose, 'F'), hp = [620 + J.ha[0] * 1.15, FY + J.ha[1] * 1.15];
  icon(ctx, st.icon, hp[0] + 70, hp[1] - 50, 150, { main: COL.product, dark: COL.productD });
  ctx.restore();
  const CX = 1400, CY = 340, R = 240;
  callout(ctx, t, b(2), CX, CY, R, g => {
    const k = 1 + Math.max(0, Math.sin(Math.PI * seg(t, b(4), b(4.4)))) * 0.08;
    g.save(); g.scale(k, k); icon(g, st.icon, 0, 0, 300, { main: COL.product, dark: COL.productD }); g.restore();
    const pre = ss(seg(t, b(3.2), b(3.8))), down = seg(t, b(3.85), b(4)), up = ss(seg(t, b(4.1), b(4.5)));
    drawHand(g, 170 - pre * 60 + up * 40, 150 - pre * 40 + down * 20 + up * 40, -2.3, 'point', 1, 2.4);
  }, tint(col, 0.5), w2s(hp[0] + 70, hp[1] - 50, c));
  tag(ctx, t, b(4), st.detail, CX, CY + R - 20, { align: 'center', maxW: 520 });
  medallionAt(ctx, t, b(s.bars * 4 - 1), CX, CY, s.i + 1);
  return { focus: [CX, CY] };
}

// ------------------------------------------------------------------ PAYOFF: a real cleaning route that reads as an atomic-age print
let PATH = null;
function planOf() { return C.payoff.plan; }
function obstacles() {
  const P = planOf(), out = [];
  for (const it of P.items) {
    const m = 30;
    if (it.shape === 'sofa' || it.shape === 'kidney') out.push({ cx: it.x, cy: it.y, rx: it.s * 1.05 + m, ry: it.s * 0.52 + m });
    else if (it.shape === 'boomerang') out.push({ cx: it.x, cy: it.y, rx: it.s * 1.02 + m, ry: it.s * 0.55 + m });
    else if (it.shape === 'chair') out.push({ cx: it.x, cy: it.y, rx: 70 * it.s + m, ry: 66 * it.s + m });
    else if (it.shape === 'bed') out.push({ cx: it.x, cy: it.y, rx: it.s + m, ry: it.s * 0.6 + m });
    else if (it.shape === 'plant') out.push({ cx: it.x, cy: it.y, rx: it.s + m, ry: it.s + m });
    else if (it.shape === 'table') out.push({ cx: it.x, cy: it.y, rx: it.s * 1.72 + m, ry: it.s * 1.72 + m });
    else out.push({ cx: it.x, cy: it.y, rx: (it.s || 60) + m, ry: (it.s || 60) + m });
  }
  return out;
}
// potential-flow streamline: a horizontal lane at y0 bends around each obstacle ellipse and never enters it
function laneY(x, y0, obs) {
  let y = y0;
  for (const o of obs) {
    const X = (x - o.cx) / o.rx, Y0 = (y0 - o.cy) / o.ry;
    if (Math.abs(X) > 5 || Math.abs(Y0) > 3) continue;
    const sg = Y0 >= 0 ? 1 : -1, a = Math.abs(Y0);
    const f = Y => Y - Y / (X * X + Y * Y) - a;
    let lo = Math.sqrt(Math.max(0, 1 - X * X)) + 1e-4, hi = a + 2;
    if (f(lo) > 0) lo = 1e-4;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    y += (sg * (lo + hi) / 2 - Y0) * o.ry;
  }
  return y;
}
function buildPath() {
  if (PATH) return PATH;
  const P = planOf(), obs = obstacles(), pts = [], marks = {}, decor = [];
  const Z = P.zones, y0 = P.y0, y1 = P.y1, ins = 34, door = (P.y0 + P.y1) / 2;
  const push = (p) => pts.push(p);
  const lineTo = (x, y, n = 12) => { const a = pts[pts.length - 1]; for (let i = 1; i <= n; i++) push([lerp(a[0], x, i / n), lerp(a[1], y, i / n)]); };
  const cum = () => plen(pts);
  const loopAt = (cx, cy, r, dir) => { for (let j = 1; j <= 22; j++) { const a = Math.PI + dir * j / 22 * TAU; push([cx + r + Math.cos(a) * r, cy + Math.sin(a) * r * 1.0]); } };
  push([P.dock[0], P.dock[1] - 44]);
  Z.forEach((z, zi) => {
    const L = z.x0 + ins, R = z.x1 - ins, Tp = y0 + ins, Bt = y1 - ins;
    // enter the zone
    if (zi === 0) lineTo(P.dock[0], Bt, 6); else lineTo(L, door, 10);
    // 1. wall-follow: one loop round the zone (rounded corners)
    const start = pts[pts.length - 1].slice();
    const perim = zi === 0 ? [[L, Bt], [L, Tp], [R, Tp], [R, Bt], [start[0] + 30, Bt]] : [[L, Bt], [R, Bt], [R, Tp], [L, Tp], [L, door - 30]];
    perim.forEach(([x, y]) => lineTo(x, y, Math.ceil(Math.hypot(x - pts[pts.length - 1][0], y - pts[pts.length - 1][1]) / 10)));
    marks['perim' + zi] = cum();
    // 2. lanes: boustrophedon, bottom -> top, bending round furniture; every turn is a small loop (the print's motif)
    const narrow = z.x1 - z.x0 < 400, S = 82, n = narrow ? 0 : Math.max(3, Math.floor((Bt - Tp - 60) / S) | 1);
    const gap = (Bt - Tp - 60) / (n - 1);
    let first = true;
    if (narrow) { // a hall: two straight lanes up and down, a curl at the top turn
      const xa = L + (R - L) * 0.33, xb = L + (R - L) * 0.67, i0 = pts.length;
      lineTo(xa, door, 8); lineTo(xa, Tp + 44, 40);
      const cy = Tp + 44, r = (xb - xa) / 2;
      for (let j = 1; j <= 10; j++) { const a = Math.PI + j / 10 * Math.PI; push([xa + r + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]); }
      const ap = pts[pts.length - 1]; for (let j = 1; j <= 20; j++) { const ph = j / 20 * TAU; push([ap[0] - 11 + 11 * Math.cos(ph), ap[1] + 11 * Math.sin(ph)]); }
      lineTo(xb, Bt - 44, 50);
      for (let y = Tp + 110; y < Bt - 60; y += 120) decor.push({ x: (xa + xb) / 2, y, kind: (y / 120 | 0) % 2 ? 'star' : 'dot', idx: i0 + 8 + Math.round((y - Tp) / (Bt - Tp) * 40) });
    }
    for (let k = 0; k < n; k++) {
      const yk = Bt - 30 - k * gap, dir = k % 2 ? -1 : 1, xa = dir > 0 ? L + 40 : R - 40, xb = dir > 0 ? R - 40 : L + 40;
      const N = Math.ceil(Math.abs(xb - xa) / 8), lane = [];
      for (let i = 0; i <= N; i++) { const x = lerp(xa, xb, i / N); lane.push([x, clamp(laneY(x, yk, obs), Tp + 14, Bt - 14)]); }
      if (first) { if (zi > 0) lineTo(L, lane[0][1], 20); lineTo(lane[0][0], lane[0][1], 8); first = false; }
      const l0 = pts.length;
      lane.forEach(p => push(p));
      // decor sits in the gap above this lane (stars + dots), revealed when the lane is drawn
      if (k < n - 1) for (let x = L + 70 + (k % 2) * 64; x < R - 50; x += 128) {
        const yy = laneY(x, yk - gap / 2, obs);
        if (obs.some(o => ((x - o.cx) / o.rx) ** 2 + ((yy - o.cy) / o.ry) ** 2 < 1.25)) continue;
        decor.push({ x, y: yy, kind: ((x / 128 | 0) + k) % 2 ? 'star' : 'dot', idx: l0 + Math.round((dir > 0 ? (x - xa) : (xa - x)) / 8) });
      }
      if (k < n - 1) { // U-turn: rounded corners outward, a small curl halfway up (the print's motif)
        const [ex, ey] = pts[pts.length - 1], ny = clamp(laneY(ex, yk - gap, obs), Tp + 14, Bt - 14), r = Math.min((ey - ny) / 2, 34), ox = ex + dir * r, my = (ey + ny) / 2;
        for (let j = 1; j <= 8; j++) { const th = j / 8 * Math.PI / 2; push([ex + dir * r * Math.sin(th), ey - r + r * Math.cos(th)]); }
        lineTo(ox, my, 4);
        for (let j = 1; j <= 20; j++) { const ph = j / 20 * TAU; push([ox + dir * 12 - dir * 12 * Math.cos(ph), my - 12 * Math.sin(ph)]); }
        lineTo(ox, ny + r, 4);
        for (let j = 1; j <= 8; j++) { const th = j / 8 * Math.PI / 2; push([ex + dir * r * Math.cos(th), ny + r - r * Math.sin(th)]); }
      }
    }
    marks['zone' + zi] = cum();
    // leave for the next zone through the door
    if (zi < Z.length - 1) { const e = pts[pts.length - 1]; lineTo(R, e[1], 6); lineTo(R + 10, door, 12); lineTo(z.x1 + ins, door, 8); }
  });
  const homeFrom = pts.length - 1;
  // 3. home: straight back to the dock through the doors (drawn as a dotted return line)
  { const zl = Z[Z.length - 1], e = pts[pts.length - 1]; lineTo(e[0], y0 + ins, 6); lineTo(zl.x0 + ins, y0 + ins, 30); lineTo(zl.x0 + ins, door, 20); }
  lineTo(Z[Z.length - 1].x0 + 30, door, 20);
  lineTo(Z[0].x1 - 50, door, 20);
  lineTo(Z[0].x1 - 50, y1 - 62, 30);
  lineTo(P.dock[0], y1 - 62, 50);
  lineTo(P.dock[0], P.dock[1] - 44, 10);
  const tot = cum(), cumArr = [0]; for (let i = 1; i < pts.length; i++) cumArr.push(cumArr[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  decor.forEach(d => d.u = cumArr[Math.min(d.idx, cumArr.length - 1)] / tot);
  const M = {}; for (const k in marks) M[k] = marks[k] / tot;
  M.homeStart = cumArr[homeFrom] / tot;
  PATH = { pts, tot, M, decor, homeFrom };
  return PATH;
}
// progress along the path: zone by zone, each landing on its beat
function planProgress(t, s) {
  const P = buildPath(), M = P.M, nz = planOf().zones.length, b = x => B(s, x);
  const keys = [[s.t0 + 0.1, 0], [b(3.6), M.perim0]];
  const zoneBeats = [4, 6, 8, 9.5].slice(0, nz);
  for (let z = 0; z < nz; z++) {
    const st = b(zoneBeats[z]), en = st + (z === 0 ? 0.75 : 0.6);
    if (z > 0) keys.push([st, M['perim' + z] - (M['perim' + z] - M['zone' + (z - 1)]) * 1.0]);
    keys.push([en, M['zone' + z]]);
  }
  keys.push([b(10.3), M.homeStart], [b(11), 1]);
  // monotone piecewise: ease within each key pair
  if (t <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [ta, pa] = keys[i - 1], [tb, pb] = keys[i]; return lerp(pa, pb, eio(seg(t, ta, tb))); }
  return 1;
}
function drawItem(ctx, it) {
  const cut = (pts, fill, seed, sh = PAL.paperDD) => shape(ctx, pts, { fill, line: 4.2, seed, grain: 0.3, shade: [{ pts: move(pts, 12, 12), color: sh, alpha: 0.5 }] });
  if (it.shape === 'sofa') { const k = kidney(it.x, it.y, it.s, it.rot || 0); cut(k, it.color, 233);
    [-0.55, -0.18, 0.18, 0.55].forEach((f, i) => shape(ctx, ellipse(it.x + f * it.s * 1.35, it.y - it.s * 0.02 + Math.abs(f) * 10, it.s * 0.2, it.s * 0.14, 20), { fill: it.accent, line: 3, seed: 234 + i, grain: 0.25 })); }
  else if (it.shape === 'boomerang') cut(boomerang(it.x, it.y, it.s, it.rot || 0), it.color, 232, PAL.brown);
  else if (it.shape === 'chair') { const p = spline([[it.x - 64, it.y - 58], [it.x + 64, it.y - 64], [it.x + 72, it.y + 58], [it.x - 58, it.y + 66]], true, 6); cut(p, it.color, 240);
    shape(ctx, spline([[it.x - 36, it.y - 30], [it.x + 40, it.y - 34], [it.x + 44, it.y + 32], [it.x - 30, it.y + 38]], true, 6), { fill: it.accent, line: 3, seed: 241, grain: 0.25 }); }
  else if (it.shape === 'plant') { star(ctx, it.x, it.y, it.s, { n: 9, inner: 0.35, fill: it.color, line: 3.5, rot: 0.2 }); shape(ctx, ellipse(it.x, it.y, it.s * 0.33, it.s * 0.33, 16), { fill: PAL.brown, line: 3, seed: 243 }); }
  else if (it.shape === 'table') { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.785; shape(ctx, ellipse(it.x + Math.cos(a) * it.s * 1.35, it.y + Math.sin(a) * it.s * 1.35, it.s * 0.36, it.s * 0.36, 24), { fill: it.accent, line: 3.5, seed: 251 + i, grain: 0.3 }); }
    cut(ellipse(it.x, it.y, it.s, it.s, 56), it.color, 250); sparkle(ctx, it.x, it.y, it.s * 0.3, { fill: COL.accent }); }
  else if (it.shape === 'kidney') { const k = kidney(it.x, it.y, it.s, it.rot || 0); cut(k, it.color, 261, shade(it.color, 0.25)); if (it.accent) ink(ctx, kidney(it.x, it.y, it.s * 0.75, it.rot || 0), 3, { closed: true, color: it.accent, seed: 262, breaks: 0.4 }); }
  else if (it.shape === 'bed') { const e = ellipse(it.x, it.y, it.s, it.s * 0.6, 40); cut(e, it.color, 263, shade(it.color, 0.25));
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = it.s * 0.55 * Math.sqrt((i + 0.5) / 9); star(ctx, it.x + Math.cos(a) * r, it.y + Math.sin(a) * r * 0.6, 14, { n: 5, inner: 0.45, fill: i % 2 ? PAL.white : (it.accent || PAL.mustard), off: [0, 0] }); } }
  else cut(ellipse(it.x, it.y, it.s || 60, it.s || 60, 40), it.color || PAL.white, 260);
}
function drawPlan(ctx, t, prog, zoneShown) {
  const P = planOf(), y0 = P.y0, y1 = P.y1, Z = P.zones, x0 = Z[0].x0, x1 = Z[Z.length - 1].x1;
  Z.forEach((z, i) => {
    plane(ctx, rrect(z.x0 + (i ? 4 : 0), y0, z.x1 - z.x0 - (i < Z.length - 1 ? 4 : 0), y1 - y0, 22), z.color, { off: [6, 4] });
    if (z.checks) { ctx.save(); ctx.beginPath(); ctx.rect(z.x0 + 10, y0 + 4, z.x1 - z.x0 - 14, y1 - y0 - 8); ctx.clip(); ctx.globalAlpha = 0.2; ctx.fillStyle = PAL.white;
      for (let i2 = 0; i2 < 14; i2++) for (let j = 0; j < 20; j++) if ((i2 + j) % 2 === 0) ctx.fillRect(z.x0 + 10 + i2 * 44, y0 + 4 + j * 44, 44, 44); ctx.restore(); }
  });
  if (P.rug) { shape(ctx, ellipse(P.rug.x, P.rug.y, P.rug.rx, P.rug.ry, 64), { fill: P.rug.color, line: 0, seed: 230, grain: 0.3, alpha: 0.8 });
    ink(ctx, ellipse(P.rug.x, P.rug.y, P.rug.rx - 34, P.rug.ry - 26, 64), 3, { closed: true, seed: 231, color: shade(P.rug.color, 0.35), breaks: 0.45 }); }
  // walls (broken ink), doors between zones
  const door = (y0 + y1) / 2;
  ink(ctx, [[x0 - 10, y0 - 10], [x1 + 10, y0 - 10]], 7, { breaks: 0.18, seed: 201 });
  ink(ctx, [[x0 - 10, y1 + 10], [x1 + 10, y1 + 10]], 7, { breaks: 0.18, seed: 202 });
  ink(ctx, [[x0 - 10, y0 - 10], [x0 - 10, y1 + 10]], 7, { breaks: 0.15, seed: 203 });
  ink(ctx, [[x1 + 10, y0 - 10], [x1 + 10, y1 + 10]], 7, { breaks: 0.15, seed: 204 });
  Z.slice(1).forEach((z, i) => { ink(ctx, [[z.x0, y0 - 6], [z.x0, door - 150]], 6, { seed: 205 + i }); ink(ctx, [[z.x0, door + 150], [z.x0, y1 + 6]], 6, { seed: 207 + i }); });
  // the route
  const R = buildPath(), cut = Math.min(prog, R.M.homeStart), drawn = subpath(R.pts, cut / 1);
  ink(ctx, move(drawn, 5, 4), 9, { color: COL.accent, taper: false, wob: 0.1, seed: 210 });
  ink(ctx, drawn, 2.6, { color: COL.ink, taper: false, wob: 0.25, seed: 211, breaks: 0.05 });
  if (prog > R.M.homeStart) { const home = R.pts.slice(R.homeFrom); const hl = (prog - R.M.homeStart) / (1 - R.M.homeStart); dashed(ctx, home, 4, 6, 14, 0, COL.ink, hl); }
  for (const d of R.decor) {
    if (d.u > prog) continue;
    const k = back(clamp((prog - d.u) * R.tot / 120), 2.2);
    if (d.kind === 'star') sparkle(ctx, d.x, d.y, 17 * k, { fill: COL.ink, rot: 0 });
    else shape(ctx, ellipse(d.x, d.y, 8 * k, 8 * k, 12), { fill: PAL.mustard, line: 0, grain: 0.1, off: [2, 2] });
  }
  P.items.forEach(it => drawItem(ctx, it));
  // dock
  ctx.save(); ctx.translate(P.dock[0], P.dock[1]);
  shape(ctx, rrect(-70, -36, 140, 40, 10), { fill: PAL.white, line: 4, seed: 220 }); shape(ctx, rrect(-42, -28, 84, 16, 6), { fill: COL.product, line: 3, seed: 221 });
  ctx.restore();
  const h = pointAt(R.pts, Math.max(0.0008, prog));
  const ang = prog >= 0.999 ? -Math.PI / 2 : h.a;
  drawPip(ctx, h.x, h.y, { view: 'top', s: 0.44, ang, brush: twos(t) * 9, colors: colsOf() });
  return h;
}
function payoffCam(t, s) {
  const R = buildPath(), prog = planProgress(t, s), h = pointAt(R.pts, Math.max(0.0008, prog)), b = x => B(s, x);
  const zk = ss(seg(t, b(0.4), b(5.2)));
  const z = Math.exp(lerp(Math.log(2.6), Math.log(1.0), zk));
  return { prog, h, c: { cx: lerp(h.x, 960, zk), cy: lerp(h.y, 590, zk), z, r: lerp(-0.1, 0, zk) } };
}
function scenePayoff(ctx, t, s) {
  const { prog, c } = payoffCam(t, s), b = x => B(s, x);
  bg(ctx, COL.paper);
  ctx.save(); cam(ctx, c.cx, c.cy, c.z, c.r);
  drawPlan(ctx, t, prog);
  // room labels pop as each zone lands
  const P = planOf(); const zb = [4, 6, 8, 9.5];
  P.zones.forEach((z, i) => { const k = pop(t, b(zb[i])); if (k > 0) { ctx.save(); ctx.translate((z.x0 + z.x1) / 2, P.y1 + 54); ctx.scale(k, k);
    text(ctx, z.name.toUpperCase(), 0, 0, { font: '600 24px Jost', fill: COL.ink, track: 6, align: 'center', maxW: z.x1 - z.x0 - 20 }); ctx.restore(); } });
  ctx.restore();
  // caption + manual arrow to Pip
  const capA = ss(seg(t, b(4), b(4.6)));
  if (capA > 0) {
    const R = buildPath(), hh = pointAt(R.pts, Math.max(0.0008, prog)), hs = w2s(hh.x, hh.y, c);
    const f = fit(ctx, C.payoff.caption, '500 {px}px Jost', 36, 700, 1, 26);
    const bw = measure(ctx, f.lines[0], f.font) + 60, bh = 36 + f.px * 1.2, bx = 70, by = 40;
    ctx.save(); ctx.globalAlpha = capA;
    shape(ctx, rrect(bx, by, bw, bh, 14), { fill: COL.ink, line: 0, off: [0, 0], grain: 0.1 });
    text(ctx, f.lines[0], bx + 30, by + 18 + f.px * 0.92, { font: f.font, fill: COL.paper });
    const P2 = planOf(), edgeW = [clamp(hh.x, P2.zones[0].x0 + 60, P2.zones[P2.zones.length - 1].x1 - 60), P2.y0 - 18];
    const eS = w2s(edgeW[0], edgeW[1], c), from = [bx + bw - 30, by + bh + 8];
    const tx = clamp(eS[0], from[0] - 160, from[0] + 260), ty = Math.max(eS[1], from[1] + 40);
    if (ty - from[1] < 160) arrow(ctx, from, [tx, ty], { u: ss(seg(t, b(4.2), b(4.8))), bob: (t / BEAT) % 1, bend: -0.35, w: 5, head: 24, fill: COL.accent });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ TIP: a colour block slides in; the cable is just an ink line and peels off the page
function sceneTip(ctx, t, s) {
  const u = t - s.t0, b = x => B(s, x), col = COL.tip;
  bg(ctx, col);
  const FY = 860, c = { cx: lerp(1000, 1040, ss(seg(t, s.t0, s.t1))), cy: 640, z: lerp(1.28, 1.4, ss(seg(t, s.t0, s.t1))) };
  ctx.save(); cam(ctx, c.cx, c.cy, c.z);
  floor(ctx, col, FY);
  // the cable: a wiggly ink line on the floor; its colour cel is a pale shadow left behind when the line is lifted
  const cab = []; for (let i = 0; i <= 80; i++) { const v = i / 80; cab.push([860 + v * 330 + Math.sin(v * 16) * 16, FY + 30 + Math.sin(v * 7 + 1) * 14]); }
  const grab = t >= b(2), liftK = eio(seg(t, b(2.2), b(3.2)));
  const shadowA = 1 - seg(t, b(3.2), b(4.6));
  if (shadowA > 0) ink(ctx, move(cab, 6, 5), 9, { color: shade(col, 0.12), alpha: shadowA, taper: false, seed: 890 });
  // hand path: reach b1 (anticipation above), grip b2, lift b3, hold up b4+
  const pose = { x: 700, y: FY, s: 1.12, dir: 1, view: 'q', kneel: true, face: t >= b(4) ? 'wink' : 'focus', blink: 0, handB: 'open' };
  const hold = [960, FY - 300];
  const reachP = [860, FY + 20];
  const hand = t < b(1) ? [lerp(760, 880, eo(seg(t, s.t0, b(1)))), FY - 120] : t < b(2) ? [lerp(880, reachP[0], ss(seg(t, b(1.4), b(2)))), lerp(FY - 120, reachP[1], ss(seg(t, b(1.4), b(2))))] : [lerp(reachP[0], hold[0], liftK), lerp(reachP[1], hold[1], liftK)];
  const kp = kneelPose(700, FY, 1.12, hand, [640, FY - 20], u, pose.face);
  kp.handF = grab ? 'grip' : 'open'; kp.face = pose.face;
  // lifted cable hangs from the hand, peeling off from the grabbed end
  if (!grab) { ink(ctx, cab, 7, { taper: false, seed: 891 }); const e = cab[cab.length - 1]; shape(ctx, rrect(e[0], e[1] - 12, 34, 24, 6), { fill: PAL.white, line: 3.5, seed: 892 }); }
  else {
    const L = plen(cab), hangs = cab.map((p, i) => {
      const d = (i / 80) * L, peel = liftK * (L + 240) - d;   // how much of this point has come off the page
      if (peel <= 0) return p;
      const hx = hand[0] + 16, hy = hand[1] + 10, hangLen = Math.min(d, peel);
      const hp = [hx + Math.sin(d / 40 + u * 3) * 10, hy + hangLen * 0.7];
      const k = clamp(peel / 120);
      return [lerp(p[0], hp[0], k), lerp(p[1], hp[1], k)];
    });
    ink(ctx, hangs, 7, { taper: false, seed: 891 });
    const e = hangs[hangs.length - 1]; shape(ctx, rrect(e[0] - 13, e[1], 26, 34, 6), { fill: PAL.white, line: 3.5, seed: 892 });
  }
  drawOwner(ctx, kp, u);
  // Pip waits, blinks thanks on b5 and rolls on
  const roll = eo(seg(t, b(5), b(6))) * 80;
  drawPip(ctx, 1440 - roll, FY + 6, { s: 0.95, light: t >= b(5) && t < b(5.3) ? 0 : 1, brush: t >= b(5) ? twos(u) * 6 : 0, colors: colsOf() });
  ctx.restore();
  stepHeader(ctx, t, s, C.tip.text, (C.tip.label || 'Tip').toUpperCase());
}

// ------------------------------------------------------------------ LOCKUP: the poster
function medallion(ctx, i, cx, cy, R, k) {
  const st = C.steps[i], col = COL.steps[i % COL.steps.length];
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  star(ctx, 0, 0, R * 1.18, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: i * 0.2, grain: 0.1 });
  shape(ctx, ellipse(0, 0, R, R, 64), { fill: col, line: 4.5, seed: 300 + i, grain: 0.35 });
  icon(ctx, st.icon, 0, 6, R * 1.25, { main: COL.product, light: PAL.white, dark: COL.productD });
  shape(ctx, ellipse(-R * 0.74, -R * 0.74, R * 0.3, R * 0.3, 30), { fill: COL.ink, line: 0, seed: 310 + i, grain: 0.1, off: [0, 0] });
  text(ctx, String(i + 1), -R * 0.74, -R * 0.74 + R * 0.14, { font: `${Math.round(R * 0.4)}px Slab`, fill: COL.paper, align: 'center' });
  ctx.restore();
}
function sceneLockup(ctx, t, s) {
  const u = t - s.t0, b = x => B(s, x);
  bg(ctx, COL.paper);
  // a thin lace of the route along the bottom edge (low contrast)
  const BY = 1034;
  plane(ctx, rect(0, BY, W, H - BY), tint(COL.tip, 0.35), { grain: 0.25 });
  const lace = []; for (let x = -20; x <= W + 20; x += 6) lace.push([x, BY + 23 + Math.sin(x / 34) * 9]);
  ink(ctx, move(lace, 3, 3), 6, { color: tint(COL.accent, 0.35), taper: false, seed: 331 });
  for (let x = 30; x < W; x += 107) sparkle(ctx, x, BY + 24, 8, { fill: tint(COL.ink, 0.45) });
  ink(ctx, [[-10, BY], [W + 10, BY]], 3.5, { seed: 330, breaks: 0.12 });
  // title block slams on beat 4
  const kt = pop(t, b(3), 0.3);
  if (kt > 0) {
    ctx.save(); ctx.translate(W / 2, 200); ctx.scale(kt, kt); ctx.translate(-W / 2, -200);
    text(ctx, C.hook.kicker, W / 2, 124, { font: '700 76px Oleo', fill: COL.accent, align: 'center', rot: -0.03, maxW: 900 });
    const f = fit(ctx, C.title, '{px}px Slab', 76, 1400, 1, 50);
    text(ctx, f.lines[0], W / 2, 214, { font: f.font, fill: COL.ink, plate: COL.hook, off: [5, 4], align: 'center' });
    text(ctx, C.subtitle.toUpperCase(), W / 2, 272, { font: '600 30px Jost', fill: COL.ink, align: 'center', track: 9 });
    ctx.restore();
  }
  // steps land one per beat (their chords come back)
  const n = C.steps.length, span = Math.min(1500, 430 * n), R = n > 3 ? 88 : 104, cy = 440;
  for (let i = 0; i < n; i++) {
    const cx = W / 2 - span / 2 + span * (i + 0.5) / n, k = pop(t, s.t0 + i * BEAT * (n > 3 ? 0.75 : 1), 0.26);
    if (k <= 0) continue;
    if (i > 0) { const px = W / 2 - span / 2 + span * (i - 0.5) / n; arrow(ctx, [px + R + 28, cy - 24], [cx - R - 34, cy - 24], { u: eo(seg(t, s.t0 + i * BEAT, s.t0 + i * BEAT + 0.3)), bob: ((t / BEAT) + i * 0.5) % 1, bend: -0.3, w: 5, head: 26, fill: COL.accent, dashedShaft: true, seed: 340 + i }); }
    medallion(ctx, i, cx, cy, R, k);
    ctx.save(); ctx.globalAlpha = clamp(k);
    const tf = fit(ctx, C.steps[i].title, '600 {px}px Jost', 40, span / n - 40, 2, 26), ty = cy + R + 62;
    tf.lines.forEach((l, j) => text(ctx, l, cx, ty + j * tf.px * 1.1, { font: tf.font, fill: COL.ink, align: 'center' }));
    const df = fit(ctx, C.steps[i].detail || '', '400 {px}px Jost', 27, span / n - 70, 2, 20);
    df.lines.forEach((l, j) => text(ctx, l, cx, ty + (tf.lines.length - 1) * tf.px * 1.1 + 42 + j * df.px * 1.22, { font: df.font, fill: PAL.inkSoft, align: 'center' }));
    ctx.restore();
  }
  // tip ribbon + CTA
  const kr = pop(t, b(3.5), 0.3);
  if (kr > 0) {
    const tf = fit(ctx, C.tip.text, '500 {px}px Jost', 38, 860, 1, 26);
    const tw = measure(ctx, tf.lines[0], tf.font) + 240, tx = W / 2 - tw / 2, ty = 734, th = 88;
    ctx.save(); ctx.translate(W / 2, ty + th / 2); ctx.scale(kr, kr); ctx.translate(-W / 2, -(ty + th / 2));
    shape(ctx, [[tx - 34, ty], [tx + tw + 34, ty], [tx + tw + 6, ty + th / 2], [tx + tw + 34, ty + th], [tx - 34, ty + th], [tx - 6, ty + th / 2]], { fill: COL.tip, line: 4, seed: 350, off: [6, 5], grain: 0.25 });
    star(ctx, tx + 66, ty + th / 2, 50, { n: 12, inner: 0.64, fill: COL.accent, line: 3, off: [0, 0], rot: u * 0.3 });
    text(ctx, (C.tip.label || 'Tip').toUpperCase(), tx + 66, ty + th / 2 + 9, { font: '25px Slab', fill: PAL.white, align: 'center', maxW: 70 });
    text(ctx, tf.lines[0], tx + 134, ty + th / 2 + tf.px * 0.34, { font: tf.font, fill: COL.ink });
    icon(ctx, C.tip.icon, tx + tw - 44, ty + th / 2 + 4, 76, { main: COL.accent, light: PAL.white });
    ctx.restore();
  }
  const kc = pop(t, b(4), 0.3);
  if (kc > 0) {
    const cf = fit(ctx, C.outro.cta, '500 {px}px Jost', 28, 900, 1, 20), cw = measure(ctx, cf.lines[0], cf.font) + 60;
    ctx.save(); ctx.globalAlpha = clamp(kc);
    shape(ctx, rrect(W / 2 - cw / 2, 858, cw, 54, 27), { fill: COL.ink, line: 0, off: [0, 0], grain: 0.1 });
    text(ctx, cf.lines[0], W / 2, 894, { font: cf.font, fill: COL.paper, align: 'center' });
    ctx.restore();
  }
  // the cast, fully in frame: June presents from the left, Pip on its starburst at the right
  const kj = pop(t, b(4), 0.3);
  if (kj > 0) {
    const fs = n <= 3 ? 1 : 0.8;
    ctx.save(); ctx.translate(1680, 890); ctx.scale(kj, kj); ctx.translate(-1680, -890);
    rays(ctx, 1680, 860, 16, 128 * fs, COL.hook, { rot: u * 0.1, alpha: 0.9 });
    shape(ctx, ellipse(1680, 860, 96 * fs, 96 * fs, 48), { fill: PAL.white, line: 0, grain: 0.1, off: [0, 0] });
    drawPip(ctx, 1680, 912, { s: 0.56 * fs, light: 1, brush: twos(u) * 5, colors: colsOf() });
    sparkle(ctx, 1580, 760, 24, { fill: COL.accent }); sparkle(ctx, 1790, 770, 16, { fill: COL.ink });
    ctx.restore();
    const wave = Math.floor(twos(u) / (BEAT * 2)) % 2;
    ctx.save(); ctx.globalAlpha = clamp(kj);
    drawOwner(ctx, { x: 190, y: 1016, s: 0.66 * fs, dir: 1, view: 'q', face: 'wink', armF: wave ? { a1: -0.4, a2: -1.35 } : { a1: -0.25, a2: -1.1 }, armB: { a1: 1.86, a2: 1.7 }, handF: 'point', handB: 'open' }, u);
    ctx.restore();
  }
  return { pip: [1680, 880] };
}

// ------------------------------------------------------------------ END: iris-out onto Pip, the card lives in the circle
function sceneEnd(ctx, t, s) {
  const b = x => B(s, x), lk = sec('lockup');
  const close = eio(seg(t, s.t0, b(1.2)));
  if (close < 1) {
    sceneLockup(ctx, t, lk);
    const r = lerp(2300, 70, close);
    ctx.save(); ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); ctx.arc(1680, 880, r, 0, TAU, true); ctx.fill(); ctx.restore();
    ink(ctx, ellipse(1680, 880, r, r, 80), 5, { closed: true, color: COL.paper, seed: 950 });
    return;
  }
  bg(ctx, COL.ink);
  const k = back(seg(t, b(1.5), b(2.3)), 1.4), R = 450 * k;
  if (R <= 1) { shape(ctx, ellipse(1680, 880, 70 * (1 - seg(t, b(1.2), b(1.5))), 70 * (1 - seg(t, b(1.2), b(1.5))), 40), { fill: COL.paper, line: 0, off: [0, 0], grain: 0 }); return; }
  shape(ctx, ellipse(W / 2, H / 2, R, R, 90), { fill: COL.paper, line: 0, grain: 0.2, off: [0, 0] });
  ink(ctx, ellipse(W / 2, H / 2, R + 18, R + 18, 90), 4, { closed: true, color: COL.paper, seed: 951, breaks: 0.3 });
  const ka = seg(t, b(2.2), b(2.8));
  if (ka <= 0 && seg(t, b(1.9), b(2.4)) <= 0) return;
  ctx.save(); ctx.globalAlpha = ka;
  const F = C.film || {};
  text(ctx, F.name || C.hook.kicker, W / 2, 380, { font: '700 96px Oleo', fill: COL.ink, plate: COL.hook, off: [5, 4], align: 'center', maxW: 760 });
  text(ctx, (F.style || '').toUpperCase(), W / 2, 450, { font: '600 28px Jost', fill: COL.accent, align: 'center', track: 8 });
  ink(ctx, [[W / 2 - 150, 490], [W / 2 + 150, 490]], 3, { seed: 952, breaks: 0.2 });
  text(ctx, 'Lemo-Opuscar', W / 2, 560, { font: '44px Slab', fill: COL.ink, align: 'center' });
  text(ctx, 'LemoLab × Claude Opus 5.5', W / 2, 612, { font: '500 32px Jost', fill: COL.ink, align: 'center' });
  const cf = fit(ctx, F.credits || '', '400 {px}px Jost', 21, 620, 4, 16);
  ctx.globalAlpha = seg(t, b(1.9), b(2.4));   // the licence credits come in a little earlier, so they hold at least 2.5 s
  cf.lines.forEach((l, i) => text(ctx, l, W / 2, 668 + i * cf.px * 1.35, { font: cf.font, fill: PAL.inkSoft, align: 'center' }));
  ctx.globalAlpha = ka;
  drawPip(ctx, W / 2, 882, { view: 'top', s: 0.34, ang: -Math.PI / 2, colors: colsOf() });
  ctx.restore();
}

// ------------------------------------------------------------------ renderer + transitions
function drawSection(ctx, t, s) {
  ctx.save();
  let r = {};
  if (s.kind === 'hook') r = sceneHook(ctx, t, s);
  else if (s.kind === 'step') r = sceneStep(ctx, t, s);
  else if (s.kind === 'payoff') scenePayoff(ctx, t, s);
  else if (s.kind === 'tip') sceneTip(ctx, t, s);
  else if (s.kind === 'lockup') r = sceneLockup(ctx, t, s);
  else sceneEnd(ctx, t, s);
  ctx.restore();
  return r || {};
}
export function renderFilm(ctx, t, Q) {
  setClock(t);
  const S = T.S, idx = S.indexOf(section(t)), s = S[idx], nx = S[idx + 1], pv = S[idx - 1];
  ctx.save();
  // 1) iris through the step medallion: [next.t0 - 0.5 beat, next.t0 + 0.4 beat]
  const irisOut = nx && nx.kind === 'step' && t >= nx.t0 - BEAT * 0.5 ? nx : null;
  const irisIn = s.kind === 'step' && pv && t < s.t0 + BEAT * 0.4 ? s : null;
  const pressIris = s.kind === 'payoff' && t < s.t0 + 0.28;
  const blockIn = (s.kind === 'tip' && t < s.t0 + 0.3) || (s.kind === 'lockup' && t < s.t0 + 0.2);
  if (irisOut || irisIn) {
    const inc = irisOut || irisIn, prev = S[S.indexOf(inc) - 1];
    const k = eio(seg(t, inc.t0 - BEAT * 0.5, inc.t0 + BEAT * 0.4));
    const f = drawSection(ctx, Math.min(t, inc.t0 - 1e-3), prev).focus || [W / 2, H / 2];
    const cx = lerp(f[0], W / 2, k), cy = lerp(f[1], H / 2, k), r = lerp(104, 1250, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); drawSection(ctx, Math.max(t, inc.t0 + 1e-3), inc); ctx.restore();
    ink(ctx, ellipse(cx, cy, r, r, 90), 7, { closed: true, seed: 960 });
    if (k < 0.5) { ctx.save(); ctx.globalAlpha = 1 - k * 2; ctx.translate(cx, cy); ctx.scale(1 + k * 3, 1 + k * 3);
      text(ctx, String(inc.i + 1), 0, 104 * 0.38, { font: `${114}px Slab`, fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' }); ctx.restore(); }
  } else if (pressIris) {
    // the start button opens into the plan (circle to circle)
    const prev = pv, f = drawSection(ctx, prev.t1 - 1e-3, prev).btn || [W / 2, H / 2];
    const k = eio(seg(t, s.t0, s.t0 + 0.28));
    const cx = lerp(f[0], W / 2, k), cy = lerp(f[1], H / 2, k), r = lerp(40, 1250, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); drawSection(ctx, t, s); ctx.restore();
    ink(ctx, ellipse(cx, cy, r, r, 90), 7, { closed: true, seed: 961 });
  } else if (blockIn) {
    // colour block wipe: tip slides in from the right; the lockup paper rises from the bottom
    const d = s.kind === 'tip' ? 0.3 : 0.2, k = eio(seg(t, s.t0, s.t0 + d));
    drawSection(ctx, pv.t1 - 1e-3, pv);
    ctx.save(); ctx.beginPath();
    if (s.kind === 'tip') ctx.rect(W * (1 - k), 0, W, H); else ctx.rect(0, H * (1 - k), W, H);
    ctx.clip(); drawSection(ctx, t, s); ctx.restore();
    if (s.kind === 'tip') ink(ctx, [[W * (1 - k), -10], [W * (1 - k), H + 10]], 6, { seed: 962 }); else ink(ctx, [[-10, H * (1 - k)], [W + 10, H * (1 - k)]], 6, { seed: 963 });
  } else drawSection(ctx, t, s);
  ctx.restore();
  paperFinish(ctx, W, H, 1);
  if (!(Q && Q.has('nosubs'))) subtitle(ctx, t);
}

// ------------------------------------------------------------------ sound events (same times drive the pictures)
function buildEvents() {
  EVS = [];
  const S = T.S;
  T.V.forEach(v => ev(v.t, 'vo', { id: v.id }));
  const h = S[0]; const hb = x => B(h, x);
  ev(0.0, 'creak', { pan: -0.3 }); ev(hb(1) - 0.02, 'box_thump', { pan: -0.35, pitch: 0 }); ev(hb(2) - 0.02, 'box_thump', { pan: 0.35, pitch: 1 });
  ev(hb(3), 'box_fall', {}); ev(hb(4), 'ding', { gain: 0.8 }); ev(hb(4) + 0.34, 'plastic_land', {});
  ev(hb(6), 'wood_tick', {}); ev(hb(4) + 0.02, 'pen_write', { dur: 0.55 });
  S.forEach((s, k) => {
    const b = x => B(s, x);
    if (s.kind === 'step') {
      ev(s.t0 - BEAT, 'stamp', {}); ev(s.t0 - BEAT * 0.5, 'whoosh', { dur: 0.4 });
      ev(b(0.1), 'slide', { gain: 0.5 });
      const a = C.steps[s.i].action;
      if (a === 'place') { ev(b(2), 'pop', {}); ev(b(1.6), 'scrape', { dur: 0.35, gain: 0.5 }); ev(b(2.9), 'scrape', { dur: 0.6 }); ev(b(3.5), 'plastic_thock', {}); ev(b(4.5), 'pop', { gain: 0.6 }); ev(b(5), 'plug_click', {}); ev(b(5), 'flip', {}); ev(b(5.5), 'whistle', { pan: -0.5 }); ev(b(6), 'whistle', { pan: 0.5, up: 1 }); }
      else if (a === 'tap') { ev(b(2), 'pop', {}); ev(b(4), 'tap', {}); ev(b(5), 'tap', {}); ev(b(5), 'pop', { gain: 0.6 }); [6, 7, 8].forEach((x, i) => ev(b(x), 'beep', { n: i })); ev(b(8), 'stamp', { gain: 0.5 }); }
      else if (a === 'press') { ev(b(2), 'pop', { gain: 0.6 }); ev(b(1), 'whoosh', { dur: 0.3, gain: 0.4 }); ev(b(5), 'btn_soft', {}); ev(b(5), 'hold', { dur: 2 * BEAT }); }
      else { ev(b(2), 'pop', {}); ev(b(4), 'tap', {}); ev(b(4), 'pop', { gain: 0.6 }); }
    } else if (s.kind === 'payoff') {
      ev(s.t0, 'click_big', {}); ev(s.t0 - 0.2, 'motor', { dur: s.t1 - s.t0 + 0.6 });
      [4, 6, 8, 9.5].slice(0, planOf().zones.length).forEach((x, i) => ev(b(x), 'zone', { n: i }));
      ev(b(11), 'dock', {});
    } else if (s.kind === 'tip') {
      ev(s.t0, 'paper_swish', {}); ev(s.t0, 'stamp', {});
      ev(b(2), 'grab', {}); ev(b(2.2), 'peel', { dur: 1.0 }); ev(b(5), 'ding', { gain: 0.5 }); ev(b(5), 'roll', { dur: 0.45 });
    } else if (s.kind === 'lockup') {
      ev(s.t0, 'paper_swish', { gain: 0.6 });
      C.steps.forEach((_, i) => ev(s.t0 + i * BEAT * (C.steps.length > 3 ? 0.75 : 1), 'stamp', { gain: 0.8 }));
      ev(b(3), 'wood_block', {}); ev(b(3.5), 'paper_swish', { gain: 0.5 }); ev(b(4), 'pop', { gain: 0.6 });
    } else if (s.kind === 'end') { ev(s.t0, 'iris', { dur: BEAT * 1.2 }); ev(B(s, 1.5), 'pop', { gain: 0.5 }); }
  });
  EVS.sort((a, b) => a.t - b.t);
}
