// The web-game ad kit: gold type, fire, light pillars, crit numbers, bronze panels, pop-ups, chat box, buttons.
// All canvas 2D and a pure function of time (same t, same frame).
import { clamp, lerp, eo, back, mulberry, vnoise } from '/core/lib.js';

export const BRUSH = "'MaShanZheng', 'NotoSerifSC', serif", SERIF = "'NotoSerifSC', serif", SANS = "'NotoSansSC', sans-serif";

// Reading-time record for window.TEXTS: every piece of text drawn this frame, with its box on screen.
// `scope` is set by the film (the scene name, or 'hud'); `mute` > 0 stops recording (crit numbers, per-character draws).
export const TX = { list: [], scope: '', mute: 0 };
export function note(ctx, text, x, y, size, w, align = 'center') {
  if (TX.mute || !text || !String(text).trim()) return;
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2, m = ctx.getTransform();
  const pts = [[x0, y - size * .9], [x0 + w, y - size * .9], [x0, y + size * .2], [x0 + w, y + size * .2]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  TX.list.push({ id: `${TX.scope}|${text}`, text: String(text), x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
}

// Pop in: appears `age` s ago, 0 → overshoot → 1. slam: drops from 2.6× to 1 in 0.2 s
export const pop = (age, from = .2, d = .22) => age < 0 ? 0 : age >= d ? 1 : lerp(from, 1, back(age / d, from > 1 ? .6 : 2.2));
export const slam = age => age < 0 ? 0 : age < .1 ? lerp(2.6, .92, eo(age / .1)) : age < .2 ? lerp(.92, 1, (age - .1) / .1) : 1;

// ───────── Gold type: black outline + copper rim + vertical metal gradient + orange glow
export function goldText(ctx, text, x, y, size, o = {}) {
  const font = o.font ?? BRUSH, w0 = o.weight ?? 400;
  ctx.save(); ctx.font = `${w0} ${size}px ${font}`; ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  note(ctx, text, x, y, size, ctx.measureText(text).width, o.align ?? 'center');
  const top = y - size * .85, bot = y + size * .12;
  if (o.glow !== 0) { ctx.shadowColor = o.glowColor ?? 'rgba(255,80,0,.95)'; ctx.shadowBlur = size * (o.glow ?? .45); }
  ctx.strokeStyle = o.outline ?? '#1a0700'; ctx.lineWidth = size * (o.ow ?? .2); ctx.strokeText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = o.rim ?? '#7a3500'; ctx.lineWidth = size * .09; ctx.strokeText(text, x, y);
  const g = ctx.createLinearGradient(0, top, 0, bot), C = o.colors ?? GOLDS;
  C.forEach(([s, c]) => g.addColorStop(s, c)); ctx.fillStyle = g; ctx.fillText(text, x, y);
  ctx.restore();
}
export const GOLDS = [[0, '#fffef0'], [.28, '#ffe680'], [.5, '#f7b000'], [.53, '#b55d00'], [.75, '#ffcf3d'], [1, '#7a3a00']];
export const REDS = [[0, '#fff0e0'], [.3, '#ff8060'], [.52, '#e01810'], [.55, '#8a0800'], [.8, '#ff4a2a'], [1, '#5a0500']];
export const SILVERS = [[0, '#ffffff'], [.4, '#d8e2ee'], [.52, '#8a98a8'], [.55, '#4a5662'], [.8, '#c8d4e2'], [1, '#3a4450']];
export function textW(ctx, text, size, font = BRUSH, weight = 400) { ctx.save(); ctx.font = `${weight} ${size}px ${font}`; const w = ctx.measureText(text).width; ctx.restore(); return w; }

// Fire: a row of particles burning upwards from (x0..x1, y). intensity 0..1
export function flames(ctx, x0, x1, y, h, t, intensity = 1, seed = 1) {
  if (intensity <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const n = Math.round((x1 - x0) / 9 * intensity), rnd = mulberry(seed * 977);
  for (let i = 0; i < n; i++) {
    const bx = x0 + rnd() * (x1 - x0), sp = .6 + rnd() * .8, ph = rnd(), life = (t * sp + ph) % 1;
    const yy = y - life * h * (.6 + rnd() * .6), xx = bx + Math.sin(t * 5 + i) * 10 * life + (vnoise(t * 2 + i) - .5) * 16 * life;
    const r = (1 - life) * h * .16 * (.6 + rnd() * .6) * intensity;
    if (r < .5) continue;
    const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r);
    g.addColorStop(0, `rgba(255,${200 - life * 120 | 0},${80 - life * 80 | 0},${.55 * (1 - life)})`); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, r, 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

// Embers drifting up over the whole frame
export function embers(ctx, W, H, t, n = 70, a = 1, seed = 3) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rnd = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x0 = rnd() * W, sp = 60 + rnd() * 140, ph = rnd() * H, s = 1 + rnd() * 3;
    const y = H - ((t * sp + ph) % (H + 40)), x = x0 + Math.sin(t * (1 + rnd()) + i) * 30;
    ctx.fillStyle = `rgba(255,${150 + rnd() * 90 | 0},60,${a * (.4 + rnd() * .5)})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

// Light pillar (the loot / level-up beam): ground ring + vertical beam + sparks rising. u: seconds since it appeared
export function pillar(ctx, x, y, h, color, u, o = {}) {
  if (u < 0) return; const life = o.life ?? 99; if (u > life + .5) return;
  const k = Math.min(eo(u / .18), 1 - clamp((u - life) / .5)), w = (o.w ?? 70) * (1 + .5 * Math.exp(-u * 6)), [r, g, b] = color;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createLinearGradient(x - w, 0, x + w, 0);
  gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(.35, `rgba(${r},${g},${b},${.35 * k})`); gr.addColorStop(.5, `rgba(255,255,240,${.75 * k})`);
  gr.addColorStop(.65, `rgba(${r},${g},${b},${.35 * k})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  const top = y - h * eo(u / .25);
  ctx.fillStyle = gr; ctx.fillRect(x - w, top, w * 2, y - top);
  const fade = ctx.createLinearGradient(0, top, 0, top + 160); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = fade; ctx.fillRect(x - w, top - 2, w * 2, 162); ctx.globalCompositeOperation = 'lighter';
  const ring = ctx.createRadialGradient(x, y, 0, x, y, w * 1.8); ring.addColorStop(0, `rgba(255,255,230,${.7 * k})`); ring.addColorStop(.4, `rgba(${r},${g},${b},${.5 * k})`); ring.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = ring; ctx.beginPath(); ctx.ellipse(x, y, w * 1.8, w * .55, 0, 0, 6.3); ctx.fill();
  const rnd = mulberry((x * 13 + y) | 0);
  for (let i = 0; i < 18; i++) { const sx = x + (rnd() - .5) * w * 1.4, sp = 120 + rnd() * 260, yy = y - ((u * sp + rnd() * h) % h); ctx.fillStyle = `rgba(255,255,220,${.8 * k})`; ctx.fillRect(sx, yy, 3, 8); }
  ctx.restore();
}

// Crit number: hits `age` s ago, punches in big, settles, floats up, fades at the end of `life`.
// A game effect, not reading text: it is not recorded for the reading-time check.
export function crit(ctx, text, x, y, age, size = 110, o = {}) {
  if (age < 0 || age > (o.life ?? 1.3)) return;
  const s = age < .07 ? lerp(2.2, 1, age / .07) : 1, a = 1 - clamp((age - (o.life ?? 1.3) + .35) / .35), dy = -age * (o.rise ?? 50);
  TX.mute++;
  ctx.save(); ctx.translate(x, y + dy); ctx.scale(s, s); ctx.rotate(o.rot ?? -.06);
  if (o.label) goldText(ctx, o.label, -textW(ctx, text, size, SERIF, 900) / 2 - size * .1, -size * .55, size * .42, { font: SERIF, weight: 900, colors: REDS, alpha: a, align: 'right' });
  goldText(ctx, text, 0, 0, size, { font: SERIF, weight: 900, colors: o.colors ?? REDS, alpha: a, ow: .14 });
  ctx.restore();
  TX.mute--;
}

// Bronze panel: dark ground, copper border, inner gold line, corner studs; `title` sits on a red tab
export function panel(ctx, x, y, w, h, o = {}) {
  ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top ?? '#2a1a0d'); g.addColorStop(1, o.bottom ?? '#0e0804');
  ctx.fillStyle = g; rr(ctx, x, y, w, h, 10); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 8; ctx.strokeStyle = '#4a2c12'; rr(ctx, x, y, w, h, 10); ctx.stroke();
  const gl = ctx.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, '#ffe9a0'); gl.addColorStop(.3, '#c8901e'); gl.addColorStop(.6, '#fff0b0'); gl.addColorStop(1, '#8a5a10');
  ctx.lineWidth = 3; ctx.strokeStyle = gl; rr(ctx, x + 7, y + 7, w - 14, h - 14, 6); ctx.stroke();
  for (const [cx, cy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) stud(ctx, cx, cy, 11);
  if (o.title) {
    const tw = Math.max(240, textW(ctx, o.title, 40, SERIF, 900) + 90), tx = x + w / 2 - tw / 2, ty = y - 30;
    const rg = ctx.createLinearGradient(0, ty, 0, ty + 60); rg.addColorStop(0, '#d8301c'); rg.addColorStop(1, '#6a0a04');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(tx - 20, ty + 30); ctx.lineTo(tx, ty); ctx.lineTo(tx + tw, ty); ctx.lineTo(tx + tw + 20, ty + 30); ctx.lineTo(tx + tw, ty + 60); ctx.lineTo(tx, ty + 60); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = gl; ctx.stroke();
    goldText(ctx, o.title, x + w / 2, ty + 44, 38, { font: SERIF, weight: 900, glow: 0, ow: .16 });   // no glow inside the tab, it would spill over the edge
  }
  ctx.restore();
}
export function stud(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); g.addColorStop(0, '#fff6c8'); g.addColorStop(.5, '#d8a030'); g.addColorStop(1, '#5a3608');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill();
}
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// Button: red pill with a gold rim (green or grey variants), pressed 0..1
export function button(ctx, text, x, y, w, h, o = {}) {
  const p = o.pressed ?? 0, glow = o.glow ?? 0;
  ctx.save(); ctx.translate(x, y + p * 4); ctx.scale(1 - p * .05, 1 - p * .05);
  if (glow) { ctx.shadowColor = `rgba(255,200,60,${glow})`; ctx.shadowBlur = 40 * glow; }
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2), C = o.green ? ['#7dff6a', '#1f9a1a', '#0a4a08'] : o.grey ? ['#8a8a8a', '#4a4a4a', '#222'] : ['#ff7a4a', '#d0200e', '#5a0600'];
  g.addColorStop(0, C[0]); g.addColorStop(.5, C[1]); g.addColorStop(1, C[2]);
  ctx.fillStyle = g; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 4; ctx.strokeStyle = '#ffd860'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(ctx, -w / 2 + 8, -h / 2 + 5, w - 16, h * .38, h * .2); ctx.fill();
  goldText(ctx, text, 0, h * .2, h * .5, { font: SERIF, weight: 900, glow: 0, colors: [[0, '#ffffff'], [.5, '#fff6c0'], [1, '#ffd040']], ow: .16 });
  ctx.restore();
}

// Pop-up dialog: title tab + body lines + buttons. u: seconds since it popped in; out: seconds since it left
export function dialog(ctx, cx, cy, w, h, title, body, buttons, u, o = {}) {
  if (u < 0) return; const s = o.slam ? slam(u) : pop(u), a = o.out != null ? 1 - clamp(o.out / .2) : 1;
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(s, s);
  panel(ctx, -w / 2, -h / 2, w, h, { title });
  body.forEach((ln, i) => {
    const y = -h / 2 + 100 + i * ((ln.size ?? 40) * 1.5);
    ctx.font = `700 ${ln.size ?? 40}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = ln.color ?? '#f3e6c0'; ctx.fillText(ln.text, 0, y);
    note(ctx, ln.text, 0, y, ln.size ?? 40, ctx.measureText(ln.text).width);
  });
  (buttons || []).forEach((b, i, B) => button(ctx, b.text, (i - (B.length - 1) / 2) * (w / B.length), h / 2 - 70, 220, 70, b));
  ctx.restore();
}

// Chat box: lines = [{t, ch, name, text}]; draws the latest lines with t ≤ now
const CH = { 世界: '#ffcf3a', 附近: '#e8e8e8', 系统: '#ff4a3a', 千里传音: '#5ad0ff', 行会: '#7dff6a' };
export function chatBox(ctx, x, y, w, h, lines, now, o = {}) {
  const vis = lines.filter(l => l.t <= now), rows = Math.floor((h - 20) / 44), show = vis.slice(-rows);
  ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = 'rgba(200,150,60,.6)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  show.forEach((l, i) => {
    const age = now - l.t, yy = y + h - 18 - (show.length - 1 - i) * 44 + (age < .12 ? (1 - age / .12) * 30 : 0);
    ctx.font = `700 30px ${SANS}`; ctx.textAlign = 'left'; let xx = x + 14;
    const tag = `[${l.ch}]`, full = tag + ' ' + (l.name ? l.name + '：' : '') + l.text;
    ctx.fillStyle = CH[l.ch] ?? '#fff'; ctx.fillText(tag, xx, yy); xx += ctx.measureText(tag).width + 8;
    if (l.name) { ctx.fillStyle = l.nameColor ?? '#7ad8ff'; ctx.fillText(l.name + '：', xx, yy); xx += ctx.measureText(l.name + '：').width; }
    ctx.fillStyle = l.color ?? (l.ch === '系统' ? '#ffd0c0' : '#ffffff'); ctx.fillText(l.text, xx, yy);
    note(ctx, full, x + 14, yy, 30, xx + ctx.measureText(l.text).width - x - 14, 'left');
    if (age < .25) { ctx.fillStyle = `rgba(255,220,120,${.35 * (1 - age / .25)})`; ctx.fillRect(x + 4, yy - 34, w - 8, 44); }
  });
  ctx.restore();
}

// Red seal stamp (square frame, slammed on)
export function seal(ctx, text, x, y, size, age, o = {}) {
  if (age < 0) return; const s = slam(age);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -.18); ctx.scale(s, s); ctx.globalAlpha = age < .05 ? .6 : .92;
  const c = o.color ?? '#e01a10'; ctx.strokeStyle = c; ctx.lineWidth = size * .08; const w = textW(ctx, text, size, SERIF, 900) + size * .5, h = size * 1.35;
  rr(ctx, -w / 2, -h / 2, w, h, size * .12); ctx.stroke(); ctx.lineWidth = size * .025; rr(ctx, -w / 2 + size * .12, -h / 2 + size * .12, w - size * .24, h - size * .24, size * .08); ctx.stroke();
  ctx.fillStyle = c; ctx.font = `900 ${size}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * .05);
  note(ctx, text, 0, size * .4, size, w - size * .5);
  ctx.restore();
}

// White flash on a hit
export function flash(ctx, W, H, age, a = .85, d = .18) { if (age < 0 || age > d) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${a * (1 - age / d)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// Radial rays (the ad's "burst")
export function burst(ctx, x, y, r0, r1, n, t, color = 'rgba(255,200,60,.35)') {
  ctx.save(); ctx.fillStyle = color; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + t * .4, da = Math.PI / n * .55; ctx.beginPath(); ctx.moveTo(x + Math.cos(a - da) * r0, y + Math.sin(a - da) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a + da) * r0, y + Math.sin(a + da) * r0); ctx.fill(); } ctx.restore();
}
