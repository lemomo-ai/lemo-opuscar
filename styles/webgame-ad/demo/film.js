// Web Game Ad · demo 「买你这一下」 (What Your Tap Costs). The whole film is one sum: what they pay to acquire you must be
// less than what you will top up later. Each fix raises the next problem (most people don't pay → servers empty out → new
// players cost money → the ad has to be tacky). The picture follows the voice; every time comes from timeline.json
// (tools/timeline.py lays it out from the voice). Figures and sources: FACTS.md. Company names are partly masked (mosaicText).
import { clamp, lerp, eo, eio, mulberry, hash } from '/core/lib.js';
import * as F from './engine/fx.js';
import { hero, nameplate, LOOKS, weapon } from './engine/hero.js';
import * as P from './engine/props.js';

export let DUR = 56; export const EV = [];
let TL, CUE, LINES, SUBS;
const FPS = 24, snap = t => Math.round(t * FPS) / FPS, W = 1920, H = 1080;
const Q = 60 / 128;

export async function init() {
  TL = await (await fetch('timeline.json')).json();
  DUR = TL.dur; CUE = TL.cues; LINES = TL.lines; SUBS = TL.subs; build();
}

// ───────────────────────── Hits: shake, white flash, events table
const SHAKE = [], FLASH = [];
const ev = (t, type, on) => { EV.push({ t: snap(t), type, on }); return snap(t); };
function hit(t, amp = 1, type = 'hit', flash = 0) { t = ev(t, type, 'cue'); SHAKE.push([t, amp]); if (flash) FLASH.push([t, flash]); return t; }
function shake(t) {
  let x = 0, y = 0, z = 0;
  for (const [t0, a] of SHAKE) { const d = t - t0; if (d < 0 || d > .5) continue; const e = Math.exp(-d * 10) * a; x += Math.sin(d * 70) * e * 20; y += Math.cos(d * 57) * e * 14; z += e * .04; }
  return { x, y, z };
}
const beatPhase = t => (t / Q) % 1;
const charT = (id, sub) => { const l = LINES.find(l => l.id === id), k = l.text.indexOf(sub); return l.chars.slice(k).find(c => c[1] != null)[1]; };

let S = [], SN = {}, TILT = [], AD2 = .75;
function build() {
  const D = { ad, click, pullback, scale, payers, firstpay, rank, case1, kill, dead, spikes, merge, newbuy, bars: barsChart, loop, sieve, star, close, buzz, final, card };
  S = TL.scenes.map(sc => ({ t0: sc.t0, draw: D[sc.name], name: sc.name }));
  S.forEach((s, i) => { s.t1 = S[i + 1]?.t0 ?? 999; SN[s.name] = s; ev(s.t0, 'cut', 'scene'); });
  for (const [t, a, f] of TL.hits) hit(t, a, 'hit', f);
  EV.sort((a, b) => a.t - b.t);
  AD2 = charT('ad', '就');
  // The scale: positive = your top-ups weigh more (profit), negative = buying you weighs more (loss)
  TILT = [[CUE.ineq, 0], [CUE.one, -.32], [CUE.more, -.18], [CUE.press, -.08], [CUE.rankUp, .08], [CUE.n469, .3], [CUE.empty, -.3], [CUE.again, .2],
    [CUE.buy, -.25], [CUE.payback, .22], [CUE.waste, -.15], [CUE.stay, .32]];
}
function tiltAt(t) { let v = 0; for (const [t0, x] of TILT) { if (t < t0) break; const prev = v; v = lerp(prev, x, eo((t - t0) / .35)); } return v + Math.sin(t * 3) * .01; }
// ───────────────────────── Small parts
function cam(ctx, z, fx = W / 2, fy = H / 2) { ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy); }
// Slammed claim: lands `age` s ago; (x, y) is the middle of the baseline
function claim(ctx, text, x, y, size, age, o = {}) {
  if (age < 0) return; const s = o.pop ? F.pop(age, .3, .16) : F.slam(age);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); F.goldText(ctx, text, 0, 0, size, { glow: .35, ...o }); ctx.restore();
}
const num = (ctx, text, x, y, size, age, o = {}) => claim(ctx, text, x, y, size, age, { font: F.SERIF, weight: 900, ow: .14, ...o });
function label(ctx, text, x, y, size, o = {}) {
  ctx.save(); ctx.font = `${o.weight ?? 700} ${size}px ${o.font ?? F.SERIF}`; ctx.textAlign = o.align ?? 'center'; ctx.lineJoin = 'round';
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  F.note(ctx, text, x, y, size, ctx.measureText(text).width, o.align ?? 'center');
  ctx.lineWidth = size * .16; ctx.strokeStyle = 'rgba(10,4,0,.9)'; ctx.strokeText(text, x, y); ctx.fillStyle = o.color ?? '#f3e6c0'; ctx.fillText(text, x, y); ctx.restore();
}
const appear = (u, a, d = .15) => eo((u - a) / d);

// Masked name: a hidden character is drawn in gold, shrunk to a few cells and blown up again (mosaic); cached
const MOS = new Map();
function mosaicText(ctx, text, x, y, size, hide, o = {}) {
  const font = o.font ?? F.SERIF, wt = o.weight ?? 900, chars = [...text];
  ctx.save(); ctx.font = `${wt} ${size}px ${font}`; const ws = chars.map(c => ctx.measureText(c).width); ctx.restore();
  const tot = ws.reduce((a, b) => a + b, 0); let cx = x - (o.align === 'left' ? 0 : tot / 2);
  F.note(ctx, chars.map((c, i) => hide.includes(i) ? '▒' : c).join(''), cx, y, size, tot, 'left'); F.TX.mute++;
  chars.forEach((c, i) => {
    if (!hide.includes(i)) F.goldText(ctx, c, cx, y, size, { glow: .25, ...o, font, weight: wt, align: 'left' });
    else {
      const key = `${c}|${size}|${font}|${wt}`; let m = MOS.get(key);
      if (!m) {
        const pad = size * .12, w = Math.ceil(ws[i] + pad * 2), h = Math.ceil(size * 1.2);
        const big = document.createElement('canvas'); big.width = w; big.height = h;
        const bc = big.getContext('2d'); bc.fillStyle = '#5a4a3a'; bc.fillRect(0, 0, w, h);
        F.goldText(bc, c, pad, size * .98, size, { font, weight: wt, align: 'left', glow: 0, colors: F.SILVERS });
        const n = 5, sm = document.createElement('canvas'); sm.width = n; sm.height = Math.max(4, Math.round(n * h / w));
        sm.getContext('2d').drawImage(big, 0, 0, sm.width, sm.height);
        m = { sm, w, h, pad }; MOS.set(key, m);
      }
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(m.sm, cx - m.pad, y - size * .98, m.w, m.h);
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.strokeRect(cx - m.pad, y - size * .98, m.w, m.h); ctx.restore();
    }
    cx += ws[i];
  });
  F.TX.mute--;
}

// Price tag: drops in on a string from above, swings a few times and settles
function priceTag(ctx, ax, ay, len, l1, l2, age, o = {}) {
  if (age < 0) return;
  const drop = eo(age / .16), ang = (o.swing ?? .45) * Math.exp(-age * 2.6) * Math.sin(age * 8 + .3), s = o.s ?? 1;
  ctx.save(); ctx.translate(ax, ay - (1 - drop) * 700); ctx.rotate(ang);
  ctx.strokeStyle = '#e8dcb8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
  ctx.translate(0, len); ctx.scale(s, s); const w = o.w ?? 440, h = o.h ?? 250;
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f0402a'); g.addColorStop(1, '#8a0a04');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(w / 2, 56); ctx.lineTo(w / 2, h); ctx.lineTo(-w / 2, h); ctx.lineTo(-w / 2, 56); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#2a0802'; ctx.beginPath(); ctx.arc(0, 34, 13, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 3; ctx.stroke();
  label(ctx, l1, 0, 112, 44, { weight: 900, color: '#fff2d8' });
  F.goldText(ctx, l2, 0, h - 32, o.big ?? 104, { font: F.SERIF, weight: 900, glow: .2, ow: .14 });
  ctx.restore();
}

// Phone (landscape): `inner` draws a 1920×1080 frame, scaled into the screen
const PH = { x: 960, y: 850, w: 720, h: 405 };
function phone(ctx, inner, o = {}) {
  const { x, y, w, h } = PH, b = 26;
  ctx.save(); ctx.translate(o.dx ?? 0, 0); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.translate(-x, -y);
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 40; ctx.fillStyle = '#0c0d10'; F.rr(ctx, x - w / 2 - b, y - h / 2 - b * .7, w + 2 * b, h + 1.4 * b, 40); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#4a4e56'; ctx.lineWidth = 5; ctx.stroke();
  ctx.save(); F.rr(ctx, x - w / 2, y - h / 2, w, h, 14); ctx.clip(); ctx.translate(x - w / 2, y - h / 2); ctx.scale(w / W, h / H); inner(ctx); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x - w / 2 + 260, y - h / 2); ctx.lineTo(x - w / 2 + 60, y + h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.fill();
  ctx.restore();
}
// The newbie holding the phone (half figure), lit by the screen. light: the screen's colour
function bust(ctx, t, inner, o = {}) {
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0c0e16'); bg.addColorStop(1, '#040408'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const [r, g, b] = o.light ?? [255, 90, 40], k = o.lit ?? 1;
  if (k > 0) { const gl = ctx.createRadialGradient(PH.x, PH.y - 120, 50, PH.x, PH.y - 120, 900); gl.addColorStop(0, `rgba(${r},${g},${b},${.32 * k})`); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); }
  hero(ctx, 960, 1340, 2.1, 'xd', { shadow: false, sad: o.sad, beat: o.beat ?? 0 });
  if (k > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = ctx.createRadialGradient(960, 600, 20, 960, 560, 260); fl.addColorStop(0, `rgba(${r},${g},${b},${.22 * k})`); fl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = fl; ctx.fillRect(600, 300, 720, 520); ctx.restore(); }
  phone(ctx, inner, o);
  for (const sx of [-1, 1]) { ctx.save(); ctx.translate(PH.x + sx * 340 + (o.dx ?? 0), PH.y + 170); ctx.rotate(sx * -.5); ctx.fillStyle = '#efc39a'; ctx.strokeStyle = '#0a0604'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, 34, 60, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.restore(); }
}

// One Legend ad (1920×1080): fire, rays, gold type, a warrior mid-swing, the 立即试玩 (Play now) button
function adFrame(ctx, t, t0, o = {}) {
  const u = t - t0;
  P.adBG(ctx, W, H, t); F.embers(ctx, W, H, t, 80, 1); P.fireWall(ctx, W, H, t, 1);
  F.burst(ctx, 700, 460, 140, 1500, 26, t, 'rgba(255,190,70,.12)');
  const sl = u >= 0 && u < .3; hero(ctx, 1460, 1000, 1.45, 'p4', { pose: sl ? 'slash' : 'idle', beat: beatPhase(t) });
  if (u >= 0 && u < .35) slash(ctx, 1000, 820, 1800, 180, u);
  const [a, b] = o.lines ?? ['是兄弟', '就来砍我'];
  claim(ctx, a, 700, 400, 240, u + (o.held ? 9 : 0), { colors: F.GOLDS });
  claim(ctx, b, 700, 660, 210, u - (o.second ?? Q * 2) + (o.held ? 9 : 0), { colors: F.REDS });
  F.crit(ctx, '999', 1640, 330, u - .05, 140, { label: '暴击', life: 1.6 });
  const p = 1 + .06 * Math.sin(t * Math.PI * 2 * 128 / 60 / 2);
  ctx.save(); ctx.translate(1600, 960); ctx.scale(p, p); F.button(ctx, o.btn ?? '立即试玩', 0, 0, 320, 96, { glow: .9, pressed: o.pressed ?? 0, grey: o.grey }); ctx.restore();
}
function slash(ctx, x0, y0, x1, y1, a) {
  if (a < 0 || a > .35) return; const u = eo(a / .12), f = 1 - clamp((a - .12) / .23);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const [lw, c] of [[60, `rgba(255,120,30,${.35 * f})`], [24, `rgba(255,220,120,${.8 * f})`], [8, `rgba(255,255,255,${f})`]]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, u), lerp(y0, y1, u)); ctx.stroke(); }
  ctx.restore();
}
function grey(ctx, k) { if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(0,0,0,${.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
const frozenAd = ctx => { adFrame(ctx, CUE.freeze, 0, { held: true, pressed: 1 }); grey(ctx, 1); };

// A simple pawn figure, for crowds, the sieve and the server tiles
function pawn(ctx, x, y, s, c) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = c; ctx.strokeStyle = '#0a0604'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -40, 13, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-16, -26, 0, -26); ctx.quadraticCurveTo(16, -26, 18, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }

// Chart ground: stone wall
function chartBG(ctx, t) { P.stoneBG(ctx, W, H, t, '#1e120c'); }
function axes(ctx, x0, y0, x1, y1) { ctx.save(); ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.restore(); }
function badge(ctx, text, x, y, rot = .1, size = 40) {
  const w = F.textW(ctx, text, size, F.SERIF, 900) + 60;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const g = ctx.createLinearGradient(0, -size, 0, size); g.addColorStop(0, '#ffe680'); g.addColorStop(.5, '#e0a010'); g.addColorStop(1, '#8a5000');
  ctx.fillStyle = g; F.rr(ctx, -w / 2, -size * .8, w, size * 1.6, 12); ctx.fill(); ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 4; ctx.stroke();
  F.goldText(ctx, text, 0, size * .36, size, { font: F.SERIF, weight: 900, colors: F.REDS, glow: 0, outline: '#fff6d0', ow: .14, rim: '#fff6d0' }); ctx.restore();
}


// The scale: (x, y) is the pivot; positive tilt = right pan (your top-ups) goes down
function balance(ctx, x, y, s, tilt, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const gl = ctx.createLinearGradient(-20, 0, 20, 0); gl.addColorStop(0, '#8a5a10'); gl.addColorStop(.5, '#ffe080'); gl.addColorStop(1, '#8a5a10');
  ctx.fillStyle = gl; ctx.fillRect(-7, 0, 14, 150); ctx.beginPath(); ctx.moveTo(-60, 160); ctx.lineTo(60, 160); ctx.lineTo(36, 140); ctx.lineTo(-36, 140); ctx.closePath(); ctx.fill();
  const L = 150, a = tilt * .6, ex = Math.cos(a) * L, ey = Math.sin(a) * L;
  ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-ex, -ey); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.3); ctx.fill();
  [[-ex, -ey, o.l1 ?? '买你', o.l2 ?? '¥200', '#ff8a6a'], [ex, ey, o.r1 ?? '你充', o.r2 ?? '¥？', '#9dff7a']].forEach(([px, py, a1, a2, c]) => {
    ctx.strokeStyle = 'rgba(255,230,160,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 52, py + 70); ctx.moveTo(px, py); ctx.lineTo(px + 52, py + 70); ctx.stroke();
    ctx.fillStyle = '#5a3608'; ctx.beginPath(); ctx.ellipse(px, py + 72, 70, 16, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 4; ctx.stroke();
    label(ctx, a1, px, py + 50, 30, { color: c, weight: 900 }); F.goldText(ctx, a2, px, py + 128, 44, { font: F.SERIF, weight: 900, glow: 0, ow: .16 });
  });
  ctx.restore();
}

// ───────────────────────── The ad · the tap · pull back: it was on his phone, and a price tag drops in
function ad(ctx, t, u) { adFrame(ctx, t, 0, { second: AD2 }); }
function click(ctx, t, u) {
  const fr = CUE.freeze, tap = CUE.tap, held = t >= fr;
  adFrame(ctx, held ? fr : t, 0, { held: true, pressed: t >= tap ? clamp(1 - (t - tap) / .25) * .6 + (held ? .4 : 0) : 0 });
  if (t >= tap) { const a = t - tap; ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.9 * Math.exp(-a * 3)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(1600, 960, 40 + a * 300, 0, 6.3); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(1600, 960, 46, 0, 6.3); ctx.fill(); ctx.restore(); }
  if (held) grey(ctx, eo((t - fr) / .12));
}
function pullback(ctx, t, u) {
  const e = eio(u / .6), z = lerp(W / PH.w, 1, e);
  ctx.save(); ctx.translate(W / 2, lerp(H / 2, PH.y, e)); ctx.scale(z, z); ctx.translate(-PH.x, -PH.y);
  bust(ctx, t, frozenAd, { lit: .7 });
  ctx.restore();
  priceTag(ctx, 1560, 0, 200, '买你这一下', '¥200', t - CUE.tag200);
}
// One sum: the scale
function scale(ctx, t, u) {
  P.stoneBG(ctx, W, H, t, '#20120c'); F.embers(ctx, W, H, t, 30, .5);
  const a = t - CUE.scaleIn + .25, s = a > 0 ? F.pop(a, .4, .25) * 2.1 : 0;
  if (s > 0) balance(ctx, 960, 360, s, Math.sin(t * 2.4) * .12 * Math.exp(-Math.max(0, t - CUE.ineq) * 3));
  num(ctx, '¥200  ＜  ¥？', 960, 250, 120, t - CUE.ineq, { colors: F.GOLDS });
}
// ① One in ten pays; make that one pay more
function payers(ctx, t, u) {
  P.plaza(ctx, W, H, t, 0); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, W, H);
  const one = t - CUE.one, more = t - CUE.more, G = 6;
  for (let i = 0; i < 10; i++) {
    const x = 285 + i * 150, a = appear(u, i * .04, .12); if (a <= 0) continue;
    const gold = i === G && one > 0, sc = gold && more > 0 ? lerp(2.6, 4.2, eo(more / .25)) : 2.6;
    if (gold) F.pillar(ctx, x, 860, 700, [255, 200, 60], one, { w: 70 });
    ctx.save(); ctx.globalAlpha = a; pawn(ctx, x, 860, sc, gold ? '#ffd04a' : one > 0 ? '#6a6a6a' : '#c8b8a0'); ctx.restore();
  }
  if (one > 0) { ctx.save(); ctx.globalAlpha = appear(one, .1); label(ctx, '会充钱', 285 + G * 150, 930, 44, { color: '#ffd04a', weight: 900 }); label(ctx, '某款传奇：付费率约 10%', 960, 300, 52, { weight: 900 }); ctx.restore(); }
  if (more > 0) [[-150, 560], [140, 520], [0, 470]].forEach(([dx, y], k) => { const a = more - .12 - k * .1; if (a < 0) return; P.ingot(ctx, 285 + G * 150 + dx, y - Math.min(a, .4) * 60, F.pop(a) * 1.1); });
}
// First top-up ¥6, get the Dragon Slayer blade
function firstpay(ctx, t, u) {
  P.plaza(ctx, W, H, t, 0); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
  const pay = CUE.press, got = t >= pay;
  hero(ctx, 1480, 1000, 1.1, got ? { ...LOOKS.xd, blade: 'dao' } : 'xd', { beat: beatPhase(t), pose: got && t - pay < .4 ? 'flex' : 'idle' });
  nameplate(ctx, 1480, 1000 - 1.1 * 500, '小兄弟 Lv.1', { size: 40 });
  if (got) F.pillar(ctx, 1480, 1000, 1000, [255, 120, 40], t - pay, { w: 130, life: 1 });
  const out = got ? t - pay - .1 : null;
  F.dialog(ctx, 720, 480, 940, 640, '首充特惠', [{ text: '首充 6 元', size: 92, color: '#ffd04a' }, { text: '', size: 40 }, { text: '', size: 40 }, { text: '送 屠龙宝刀', size: 56 }], [{ text: '立即充值', glow: .8, pressed: t >= pay - .05 ? 1 : 0 }], u, { out });
  if (!got || out < .2) { const a = got ? 1 - clamp(out / .2) : appear(u, 0); ctx.save(); ctx.globalAlpha = a; weapon(ctx, 'dao', 560, 440, -.12, 1.0); ctx.restore(); }
  F.crit(ctx, '屠龙到手', 1480, 380, t - pay - .05, 80, { colors: F.GOLDS, life: 1.2 });
}
// Leaderboard: the big spenders pay more and more
const RANK = [['1', '龙城霸主', 'VIP15', '#ffd04a'], ['2', '一刀秒你', 'VIP14', '#ffd04a'], ['3', '沙城老大', 'VIP13', '#ffd04a'], ['4', '烈焰战神', 'VIP9', '#e8e8e8'], ['5', '夜行刀客', 'VIP7', '#e8e8e8'], ['…', '', '', '#888'], ['9999', '小兄弟', 'VIP0', '#ff6a4a']];
function rank(ctx, t, u) {
  P.stoneBG(ctx, W, H, t, '#22140c');
  F.panel(ctx, 120, 170, 900, 800, { title: '充值排行', alpha: appear(u, 0) });
  const k = t - CUE.rankUp;
  RANK.forEach(([r, n, v, c], i) => {
    const a = appear(u, i * .04, .1); if (a <= 0) return; const y = 290 + i * 96;
    ctx.save(); ctx.globalAlpha = a;
    if (i < 3 && k > 0) { ctx.fillStyle = `rgba(255,200,60,${.18 + .1 * Math.sin(t * 12)})`; F.rr(ctx, 160, y - 62, 820, 86, 10); ctx.fill(); }
    label(ctx, r, 220, y, 48, { color: c, weight: 900 }); label(ctx, n, 300, y, 50, { align: 'left', color: c }); label(ctx, v, 940, y, 42, { align: 'right', color: i < 3 ? '#ffd04a' : c, weight: 900 });
    ctx.restore();
    if (i < 3 && k > 0) F.crit(ctx, '+' + ['50000', '30000', '20000'][i], 1000, y - 30, k - i * .08, 40, { colors: F.GOLDS, life: 1, rot: 0 });
  });
  num(ctx, '约 5%', 1450, 450, 200, k, { colors: F.GOLDS });
  if (k > 0) { ctx.save(); ctx.globalAlpha = appear(k, .05); label(ctx, '的传奇玩家', 1450, 560, 60, { weight: 900 }); ctx.restore(); }
  claim(ctx, '每月充 2000+', 1450, 730, 120, k - .12, { colors: F.REDS });
}
// Public case card: company name masked; rows = [label, figure, time it lands]
function caseCard(ctx, t, u, names, rows) {
  P.stoneBG(ctx, W, H, t, '#20140c');
  const a = appear(u, 0, .12);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(960, 540); ctx.scale(F.pop(u, .7, .18), F.pop(u, .7, .18)); ctx.translate(-960, -540);
  F.panel(ctx, 230, 170, 1460, 760, { title: '公开案例' });
  names.forEach(([n, hide, size], i) => mosaicText(ctx, n, 960, 320 + i * 110, size, hide));
  rows.forEach(([k, v, at], i) => {
    const age = t - at, y = 320 + names.length * 110 + 70 + i * 170; if (age < 0) return;
    ctx.save(); ctx.globalAlpha = appear(age, 0, .08); label(ctx, k, 330, y, 54, { align: 'left', color: '#e8d8b0' }); ctx.restore();
    const s = F.slam(age); ctx.save(); ctx.translate(1600, y + 10); ctx.scale(s, s); F.goldText(ctx, v, 0, 0, 130, { font: F.SERIF, weight: 900, align: 'right', ow: .14, glow: .3 }); ctx.restore();
  });
  ctx.restore();
}
function case1(ctx, t, u) { caseCard(ctx, t, u, [['贪玩游戏', [1], 110]], [['付费玩家月均充值（2023）', '¥469', CUE.n469], ['是全国游戏均值的（2021）', '10.9 倍', CUE.n469 + .45]]); }
// The big spender cuts down the newbie; free players watch
function kill(ctx, t, u) {
  P.plaza(ctx, W, H, t, 0);
  const sl = t - CUE.slash, fall = sl - .25, dead = fall > 0, w = t - CUE.watch;
  if (w > 0) for (let i = 0; i < 11; i++) { const x = 180 + i * 156, b = Math.abs(Math.sin(t * 9 + i)) * 10; ctx.save(); ctx.globalAlpha = appear(w, i * .03, .1); pawn(ctx, x, 640 - b, 1.7, '#8a8a8a'); ctx.restore(); }
  hero(ctx, 650, 990, 1.35, 'dr', { pose: sl >= 0 && sl < .3 ? 'slash' : w > 0 ? 'flex' : 'idle', beat: beatPhase(t) });
  nameplate(ctx, 650, 990 - 1.35 * 500, 'VIP15 · 龙城霸主', { size: 40, color: '#ffd04a' });
  F.pillar(ctx, 650, 990, 900, [255, 200, 60], u, { w: 90, life: 3 });
  ctx.save(); ctx.translate(1300, 990); ctx.rotate(dead ? -Math.PI / 2 * eo(fall / .2) : 0); hero(ctx, 0, 0, 1.05, 'xd', { sad: true, shadow: !dead }); ctx.restore();
  if (dead) { ctx.save(); ctx.globalAlpha = appear(fall, .1); label(ctx, '你已死亡', 1300, 880, 50, { color: '#ff5a4a', weight: 900 }); ctx.restore(); }
  else nameplate(ctx, 1300, 990 - 1.05 * 500, '小兄弟', { size: 38 });
  slash(ctx, 820, 760, 1420, 640, sl);
  F.crit(ctx, '-99999', 1330, 520, sl - .1, 130, { life: 1.4 });
  claim(ctx, '免费玩家 = 大R的观众', 960, 220, 104, w);
}
// ② Two weeks later, everyone's gone
function dead(ctx, t, u) {
  P.plaza(ctx, W, H, t, 0); ctx.fillStyle = 'rgba(0,4,20,.6)'; ctx.fillRect(0, 0, W, H);
  hero(ctx, 1200, 960, .9, { ...LOOKS.xd, blade: 'dao' }, { sad: true });
  nameplate(ctx, 1200, 960 - .9 * 500, '小兄弟 Lv.35', { size: 34 });
  claim(ctx, '两周后', 960, 260, 110, u, { pop: true });
  F.chatBox(ctx, 40, 700, 760, 200, [{ t: SN.dead.t0 + .2, ch: '系统', text: '本服当前在线：37 人' }, { t: CUE.empty, ch: '附近', name: '小兄弟', text: '有人吗', nameColor: '#ffd04a' }], t);
}
// New servers: one revenue spike per server (illustrative)
function spikes(ctx, t, u) {
  chartBG(ctx, t);
  const x0 = 200, y0 = 900, x1 = 1740, top = 430, span = SN.spikes.t1 - SN.spikes.t0, rev = x0 + (x1 - x0) * clamp(u / (span * .92));
  axes(ctx, x0, y0, x1, top - 60); label(ctx, '时间 →', x1, y0 + 60, 40, { align: 'right', color: '#c8a870' }); label(ctx, '单服收入', x0 + 20, top - 80, 40, { align: 'left', color: '#c8a870' });
  const pk = k => x0 + 60 + k * 175, f = x => { let v = 0; for (let k = 0; k < 9; k++) { const d = x - pk(k); if (d >= 0) v += Math.exp(-d / 55) * (1 - Math.exp(-d / 6)) * (.9 - k * .03); } return v; };
  ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y0);
  for (let x = x0; x <= rev; x += 4) ctx.lineTo(x, y0 - f(x) * (y0 - top));
  ctx.lineTo(rev, y0); ctx.closePath(); const g = ctx.createLinearGradient(0, top, 0, y0); g.addColorStop(0, 'rgba(255,90,40,.7)'); g.addColorStop(1, 'rgba(255,90,40,.05)'); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); for (let x = x0; x <= rev; x += 4) ctx.lineTo(x, y0 - f(x) * (y0 - top)); ctx.strokeStyle = '#ffd04a'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  const peak = k => { let m = 0, mx = pk(k); for (let x = pk(k); x < pk(k) + 40; x += 1) { const v = f(x); if (v > m) { m = v; mx = x; } } return [mx, y0 - m * (y0 - top)]; };
  let last = 0; for (let k = 0; k < 9; k++) if (pk(k) + 20 < rev) { last = k; const [px, py] = peak(k); label(ctx, `${k + 1}服`, px + 40, py - 20, 36, { color: '#ffe8b0', weight: 900 }); }
  const [hx, hy] = peak(last), hop = Math.abs(Math.sin(t * 12)) * 20;
  hero(ctx, hx, hy - 60 - hop, .22, { ...LOOKS.xd, blade: 'dao' }, { shadow: false });
  badge(ctx, '示意', 1640, 420, .06, 34);
  const c = t - CUE.again - .2;
  if (c > 0) { ctx.save(); ctx.globalAlpha = appear(c, 0, .12); F.panel(ctx, 640, 180, 820, 200, {}); mosaicText(ctx, '恺英网络《蓝月传奇》', 1050, 262, 52, [1, 6]); label(ctx, '开服数连续 18 个月第一（2017 年报）', 1050, 340, 40, { color: '#ffe8b0', weight: 900 }); ctx.restore(); }
}
// Server merge
function merge(ctx, t, u) {
  P.stoneBG(ctx, W, H, t, '#1c120c');
  const m = eio((t - CUE.merge + .14) / .14), done = t >= CUE.merge;
  ctx.save(); ctx.globalAlpha = appear(u, 0); ctx.fillStyle = 'rgba(120,0,0,.75)'; ctx.fillRect(0, 170, W, 90); label(ctx, '【系统公告】1–4服 今晚 24:00 合服', 960, 232, 50, { color: '#ffd0c0', weight: 900 }); ctx.restore();
  const P4 = [[-330, -160], [330, -160], [-330, 160], [330, 160]];
  if (!done) P4.forEach(([dx, dy], i) => {
    const x = 960 + dx * (1 - m), y = 640 + dy * (1 - m), a = appear(u, i * .05, .1); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; F.panel(ctx, x - 270, y - 130, 540, 260, {}); label(ctx, `${i + 1}服`, x, y - 40, 60, { weight: 900, color: '#ffd04a' });
    for (let k = 0; k < 2 + i % 2; k++) pawn(ctx, x - 60 + k * 60, y + 100, 1.2, '#b8a07a'); ctx.restore();
  });
  else {
    F.panel(ctx, 960 - 420, 640 - 190, 840, 380, {}); label(ctx, '1–4服', 960, 570, 64, { weight: 900, color: '#ffd04a' });
    for (let k = 0; k < 10; k++) pawn(ctx, 960 - 270 + k * 60, 760, 1.2, k === 4 ? '#ffd04a' : '#b8a07a');
    claim(ctx, '合服', 960, 425, 140, t - CUE.merge, { colors: F.REDS });
  }
}
// ③ New servers need new players: a price tag over every newcomer
function newbuy(ctx, t, u) {
  P.plaza(ctx, W, H, t, 0); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = appear(u, 0); F.panel(ctx, 560, 200, 800, 130, {}); F.goldText(ctx, '新区88服 · 火爆开启', 960, 292, 64, { font: F.SERIF, weight: 900, glow: .3 }); ctx.restore();
  for (let i = 0; i < 5; i++) {
    const x = lerp(-150 - i * 230, 1450 - i * 240, eo(u / 1.4)), y = 900;
    pawn(ctx, x, y, 3, '#c8b8a0');
    priceTag(ctx, x, 380, 260 + (i % 2) * 40, '新人', '¥200', t - CUE.buy - i * .07, { s: .42, swing: .3, big: 90 });
  }
}
// 60–80 % of revenue goes to promotion
const SALES = [['2019', 79.6], ['2020', 66.7], ['2021', 67.1], ['2022', 63.8], ['2023', 59.6]];
function barsChart(ctx, t, u) {
  chartBG(ctx, t);
  mosaicText(ctx, '贪玩游戏', 640, 300, 72, [1]); label(ctx, '销售费用占收入', 1080, 300, 58, { weight: 900 });
  const x0 = 300, y0 = 880, h100 = 520; axes(ctx, x0, y0, 1500, y0 - h100 - 20);
  ctx.save(); ctx.setLineDash([12, 12]); ctx.strokeStyle = 'rgba(200,168,112,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0 - h100 * .5); ctx.lineTo(1500, y0 - h100 * .5); ctx.stroke(); ctx.restore(); label(ctx, '50%', x0 - 20, y0 - h100 * .5 + 14, 36, { align: 'right', color: '#c8a870' });
  SALES.forEach(([y, v], i) => {
    const age = u - .1 - i * .14, x = 410 + i * 230, hh = h100 * v / 100 * eo(age / .18); if (age < 0) return;
    const g = ctx.createLinearGradient(0, y0 - hh, 0, y0); g.addColorStop(0, '#ffd04a'); g.addColorStop(1, '#a0400a'); ctx.fillStyle = g; ctx.fillRect(x - 70, y0 - hh, 140, hh); ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 4; ctx.strokeRect(x - 70, y0 - hh, 140, hh);
    num(ctx, `${v}%`, x, y0 - hh - 20, 50, age - .08, { pop: true, glow: .2 }); label(ctx, y, x, y0 + 50, 40, { color: '#e8d8b0' });
  });
  priceTag(ctx, 1650, 250, 170, '下一个你', '¥200', t - CUE.nextYou, { s: .7, swing: .35 });
}
// If it pays back, the loop keeps turning
function loop(ctx, t, u) {
  chartBG(ctx, t);
  const cx = 960, cy = 560, r = 270, N = ['买量', '开新服', '充值', '回本'];
  const ph = (u * (1 + u * .8) * .7) % 1;
  ctx.save(); ctx.strokeStyle = '#c8901e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.stroke(); ctx.restore();
  N.forEach((n, i) => { const a = -Math.PI / 2 + i * Math.PI / 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; const s = F.pop(u - i * .06); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); F.button(ctx, n, 0, 0, 250, 92, { green: i === 3 }); ctx.restore();
    const am = a + Math.PI / 4, ax = cx + Math.cos(am) * r, ay = cy + Math.sin(am) * r; ctx.save(); ctx.translate(ax, ay); ctx.rotate(am + Math.PI / 2); ctx.fillStyle = '#ffd04a'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-14, -22); ctx.lineTo(-14, 22); ctx.closePath(); ctx.fill(); ctx.restore(); });
  const a = -Math.PI / 2 + ph * 6.283; P.ingot(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, .9);
  F.seal(ctx, '约 40 天回本', 1520, 760, 64, t - CUE.payback - .3);
  label(ctx, '某款传奇 · 只算买量成本', 1520, 880, 34, { color: '#c8a870' });
}
// ④ Players are expensive → the ad is tacky on purpose: the sieve
function sieve(ctx, t, u) {
  P.stoneBG(ctx, W, H, t, '#140c08');
  const bandY = 560, tu = t - CUE.tu, sw = t - CUE.swipe, st = t - CUE.stay, wa = t - CUE.waste;
  const pulse = tu > 0 && tu < .6 ? 1 + .05 * Math.sin(tu * 40) : 1;
  ctx.save(); ctx.translate(960, bandY); ctx.scale(pulse, pulse); ctx.translate(-960, -bandY);
  const g = ctx.createLinearGradient(260, 0, 1660, 0); ['#e01a10', '#20c020', '#ffd020', '#e01a10', '#20c020'].forEach((c, i) => g.addColorStop(i / 4, c));
  ctx.fillStyle = g; ctx.fillRect(260, bandY - 60, 1400, 120); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 6; ctx.strokeRect(260, bandY - 60, 1400, 120);
  F.goldText(ctx, '大红大绿 · 一刀999 · 是兄弟就来', 960, bandY + 26, 64, { font: F.SERIF, weight: 900, glow: 0 }); ctx.restore();
  const rnd = mulberry(24);
  for (let i = 0; i < 30; i++) {
    const x0 = 320 + rnd() * 1280, ph = rnd(), keep = i % 8 === 3;
    let x = x0, y = lerp(160, 420, clamp((u - ph * .8) / 1.2)), c = '#c8b8a0';
    if (tu > 0) y = lerp(420, 760, eo((tu - ph * .25) / .35));
    if (!keep && sw > 0) { x = x0 + (x0 < 960 ? -1 : 1) * 1000 * eo((sw - ph * .15) / .35); c = '#6a6a6a'; }
    if (keep && st > 0) { c = '#ffd04a'; y = lerp(760, 860, eo(st / .2)); }
    ctx.save(); ctx.globalAlpha = clamp((u - ph * .8) / .12); pawn(ctx, x, y, 1.7, c);
    if (!keep && wa > 0 && tu < 0) { ctx.globalAlpha *= appear(wa, ph * .2, .1); label(ctx, '¥200', x, y - 90, 26, { color: '#ff6a4a', weight: 900 }); }
    ctx.restore();
  }
  if (sw > 0) { ctx.save(); ctx.globalAlpha = appear(sw, 0); label(ctx, '嫌土的，划走', 380, 720, 54, { color: '#aaaaaa', weight: 900 }); ctx.restore(); }
  if (st > 0) { ctx.save(); ctx.globalAlpha = appear(st, 0); label(ctx, '留下的，会充钱', 1500, 720, 54, { color: '#ffd04a', weight: 900 }); ctx.restore(); }
}
// Celebrity endorser: an empty gold frame
function star(ctx, t, u) {
  P.stoneBG(ctx, W, H, t, '#140c08');
  const sp = ctx.createRadialGradient(560, 120, 20, 560, 520, 600); sp.addColorStop(0, 'rgba(255,240,200,.35)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(560, 520); ctx.scale(F.pop(u, .7), F.pop(u, .7));
  const gl = ctx.createLinearGradient(-230, -300, 230, 300); gl.addColorStop(0, '#fff0a0'); gl.addColorStop(.4, '#c8901e'); gl.addColorStop(.7, '#ffe080'); gl.addColorStop(1, '#8a5a10');
  ctx.fillStyle = gl; F.rr(ctx, -250, -320, 500, 640, 30); ctx.fill(); ctx.fillStyle = '#120a06'; F.rr(ctx, -210, -280, 420, 560, 20); ctx.fill();
  ctx.fillStyle = '#2a201a'; ctx.beginPath(); ctx.arc(0, -60, 90, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(-170, 280); ctx.quadraticCurveTo(-160, 60, 0, 60); ctx.quadraticCurveTo(160, 60, 170, 280); ctx.fill();
  label(ctx, '?', 0, -30, 110, { color: '#6a5a4a', weight: 900 }); label(ctx, '代言人', 0, 250, 50, { color: '#c8a870', weight: 900 });
  ctx.restore();
  const k = t - CUE.pct06;
  ctx.save(); ctx.globalAlpha = appear(u, .2); label(ctx, '代言费占投放预算', 1340, 400, 60, { weight: 900 }); ctx.restore();
  num(ctx, '0.4–0.6%', 1340, 620, 190, k, { colors: F.GOLDS });
}
// He closes it · another one pops up · it isn't made for everyone
function close(ctx, t, u) {
  const off = t >= CUE.close;
  bust(ctx, t, off ? (c => { c.fillStyle = '#020203'; c.fillRect(0, 0, W, H); }) : frozenAd, { lit: off ? 0 : .7 });
  if (!off) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.5 + .5 * Math.sin(u * 14)})`; ctx.lineWidth = 4; const bx = PH.x + PH.w / 2 - 40, by = PH.y - PH.h / 2 + 40; ctx.beginPath(); ctx.arc(bx, by, 22, 0, 6.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - 10, by - 10); ctx.lineTo(bx + 10, by + 10); ctx.moveTo(bx + 10, by - 10); ctx.lineTo(bx - 10, by + 10); ctx.stroke(); ctx.restore(); }
}
function buzz(ctx, t, u) {
  const rot = Math.sin(u * 70) * .025 * Math.exp(-u * 3);
  const inner = c => { c.fillStyle = '#020203'; c.fillRect(0, 0, W, H); const s = F.pop(u, .2, .2); c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); adFrame(c, t, CUE.buzz, { second: .45 }); c.restore(); };
  bust(ctx, t, inner, { lit: appear(u, 0, .1), rot });
}
function final(ctx, t, u) {
  P.adBG(ctx, W, H, t, { c0: '#4a1006', rays: .05 }); F.embers(ctx, W, H, t, 60, .7); P.fireWall(ctx, W, H, t, .5 * appear(t - CUE.you, 0, .3));
  claim(ctx, '它不是做给所有人看的', 960, 330, 110, t - CUE.notAll, { colors: F.GOLDS });
  if (t > CUE.you) F.burst(ctx, 960, 560, 100, 1400, 26, t, 'rgba(255,200,80,.12)');
  claim(ctx, '是做给会充钱的你', 960, 600, 170, t - CUE.you, { colors: F.REDS, glow: .5 });
  if (t > CUE.you + .3) {
    const no = t >= CUE.no, p = no ? F.slam(t - CUE.no) : 1 + .06 * Math.sin(t * Math.PI * 2 * 128 / 60 / 2) * appear(t - CUE.you, .3);
    ctx.save(); ctx.translate(960, 800); ctx.scale(p, p); F.button(ctx, no ? '不了' : '立即试玩', 0, 0, 340, 104, { glow: no ? 0 : .9, grey: no }); ctx.restore();
  }
}
// End card: title, style, sign-off, then where the numbers come from; held long enough to read, then fades to black
function card(ctx, t, u) {
  P.adBG(ctx, W, H, t, { c0: '#3a0c06', rays: .04 }); F.embers(ctx, W, H, t, 40, .5);
  claim(ctx, '买你这一下', 960, 300, 130, u, { pop: true, font: F.SERIF, weight: 900, glow: .3 });
  const fo = clamp((t - (DUR - .45)) / .45);
  const ln = (text, y, size, a, o = {}) => {   // reported to TEXTS only while it is more than half visible
    const al = appear(u, a, .3), hide = al < .5 || fo > .5; ctx.save(); ctx.globalAlpha = al; if (hide) F.TX.mute++; label(ctx, text, 960, y, size, o); if (hide) F.TX.mute--; ctx.restore();
  };
  ln('What Your Tap Costs', 385, 44, .15, { font: F.SANS, weight: 500 });
  ln('传奇页游广告 · WEB GAME AD', 520, 40, .3, { color: '#ffd860' });
  ln('LemoLab × Claude Opus 5.5', 600, 44, .3, { font: F.SANS, weight: 700 });
  ln('数据：公司年报 / 招股书 · 媒体报道', 820, 32, .5, { font: F.SANS, weight: 500, color: '#d8c8a8' });
  ln('第三方估算：DataEye · 伽马数据 · 券商研报', 870, 32, .5, { font: F.SANS, weight: 500, color: '#d8c8a8' });
  ln('公司名部分打码 · 估算与示意均已标注', 920, 28, .5, { font: F.SANS, weight: 500, color: '#a89878' });
  if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
}

// ───────────────────────── Always on: the question tab (top left), source line, the scale (top right), subtitles (bottom)
const SECTIONS = [['payers', 'kill', '① 大部分人不充钱'], ['dead', 'merge', '② 人走光了'], ['newbuy', 'loop', '③ 新服要新人'], ['sieve', 'star', '④ 买人太贵']];
const SRC = {
  pullback: '传奇类手游 iOS 获客成本：2021.11–2022.5 长期 ¥150 以上，峰值超 ¥200（据 DataEye 估算）', payers: '某款传奇，2021 年案例', rank: '伽马数据 传奇玩家调查',
  case1: '该公司年度披露；10.9 倍为 2021 年券商研报', spikes: '曲线为示意 · 该公司 2017 年报', newbuy: '获客成本同上（据 DataEye 估算）', bars: '该公司招股书、年报：销售及分销开支 ÷ 收入',
  loop: '某款传奇，2023 年案例', sieve: '运营研究社 分析', star: '某游戏品牌负责人，2020 年公开分享',
};
const idx = n => S.findIndex(s => s.name === n);
function overlay(ctx, t, i) {
  const sec = SECTIONS.find(([a, b]) => i >= idx(a) && i <= idx(b));
  if (sec) {
    const a = appear(t - SN[sec[0]].t0, 0, .2), w = F.textW(ctx, sec[2], 40, F.SERIF, 900) + 70;
    ctx.save(); ctx.globalAlpha = a; const g = ctx.createLinearGradient(0, 30, 0, 96); g.addColorStop(0, '#d8301c'); g.addColorStop(1, '#6a0a04');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(30 + w, 30); ctx.lineTo(30 + w + 26, 63); ctx.lineTo(30 + w, 96); ctx.lineTo(30, 96); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 3; ctx.stroke();
    F.goldText(ctx, sec[2], 60, 79, 40, { font: F.SERIF, weight: 900, align: 'left', glow: 0, ow: .16 }); ctx.restore();
  }
  const src = SRC[S[i].name];
  if (src) { ctx.save(); ctx.globalAlpha = appear(t - S[i].t0, .2, .2); label(ctx, '资料：' + src, 30, sec ? 136 : 50, 24, { align: 'left', color: '#d8c8a8', weight: 500, font: F.SANS }); ctx.restore(); }
  // The scale: centre stage in the 'one sum' scene, then shrinks to the top right corner until he closes the game
  const h0 = SN.payers.t0, h1 = CUE.close;
  if (t >= h0 && t < h1) { const k = eio((t - h0) / .4), out = 1 - clamp((t - h1 + .3) / .3); ctx.save(); ctx.globalAlpha = out; balance(ctx, lerp(960, 1710, k), lerp(360, 56, k), lerp(2.1, .8, k), tiltAt(t)); ctx.restore(); }
  if (!NOSUBS) caption(ctx, t);
}
// Bilingual subtitles (timeline.json subs: one Chinese line, one English line per cue). The Chinese pops in character by
// character with the voice, in the style's gold; the English sits under it, whole. Not part of the reading-time check.
const NOSUBS = typeof location !== 'undefined' && new URLSearchParams(location.search).has('nosubs');   // ?nosubs: picture only (poster, gallery frame)
function caption(ctx, t) {
  const cur = SUBS.find(q => t >= q.t0 && t < q.t1); if (!cur) return;
  const line = LINES.find(l => l.id === cur.id), size = 52, font = F.SANS;
  F.TX.mute++;
  ctx.save(); ctx.font = `900 ${size}px ${font}`;
  const ws = line.chars.map(([c]) => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); ctx.restore();
  const y = 990, ye = 1046; let x = W / 2 - tot / 2;
  ctx.save(); const g = ctx.createLinearGradient(0, y - 80, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,.8)'); ctx.fillStyle = g; ctx.fillRect(0, y - 90, W, H - y + 90); ctx.restore();
  let last = line.t0;
  line.chars.forEach(([c, tc], k) => {
    const at = tc ?? last; last = at;
    const a = t - at + .04; if (a >= 0) { const s = F.pop(a, .5, .1); ctx.save(); ctx.translate(x + ws[k] / 2, y); ctx.scale(s, s); F.goldText(ctx, c, 0, 0, size, { font, weight: 900, glow: .15, ow: .18 }); ctx.restore(); }
    x += ws[k];
  });
  ctx.save(); ctx.globalAlpha = clamp((t - cur.t0) / .12); ctx.font = `500 34px ${font}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,4,0,.9)'; ctx.strokeText(cur.en, W / 2, ye); ctx.fillStyle = '#f3e6c0'; ctx.fillText(cur.en, W / 2, ye); ctx.restore();
  F.TX.mute--;
}

// Every piece of text the last render(t) drew, with its box on screen, for core/render/readcheck.mjs
// (subtitles and crit numbers are left out: the .srt sets the subtitles' hold, crit numbers are game effects)
// Game UI copy is texture, not reading: the ad's slogans and buttons, nameplates, rank rows, server tags, chat and system
// lines repeat the genre and never carry a fact, so they are left out too. Every claim, number and source is reported.
const UI = /^(是兄弟|就来砍我|立即试玩|立即充值|首充特惠|首充 6 元|送 屠龙宝刀|充值排行|你已死亡|不了|合服|…|\d+|VIP\d+|\d+(–\d+)?服|小兄弟( Lv\.\d+)?|龙城霸主|一刀秒你|沙城老大|烈焰战神|夜行刀客|VIP15 · 龙城霸主)$|^[[【]|^新区/;
export const texts = () => F.TX.list.filter(b => !UI.test(b.text));

// ───────────────────────── Render
export function render(ctx, t, cw, ch) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  const k = Math.min(cw / W, ch / H); ctx.setTransform(k, 0, 0, k, (cw - W * k) / 2, (ch - H * k) / 2);
  const sh = shake(t), i = Math.max(0, S.findLastIndex(s => t >= s.t0)), sc = S[i];
  ctx.save(); ctx.translate(W / 2 + sh.x, H / 2 + sh.y); ctx.scale(1 + sh.z, 1 + sh.z); ctx.translate(-W / 2, -H / 2);
  F.TX.list.length = 0; F.TX.scope = sc.name;
  sc.draw(ctx, t, t - sc.t0);
  ctx.restore();
  F.TX.scope = 'hud';
  overlay(ctx, t, i);
  for (const [t0, a] of FLASH) F.flash(ctx, W, H, t - t0, a);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
