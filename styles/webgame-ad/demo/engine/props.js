// Sets and props: the ad backdrop, a wall of fire, the town square at night, a stone wall, a gold ingot.
import { clamp, mulberry } from '/core/lib.js';
import { flames } from './fx.js';

const INK = '#0a0604';
function blob(ctx, draw, fill, lw = 5) { ctx.beginPath(); draw(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }

// Ad backdrop: dark red radial ground + slowly turning rays
export function adBG(ctx, W, H, t, o = {}) {
  const g = ctx.createRadialGradient(W / 2, H * .45, 50, W / 2, H * .5, W * .8);
  g.addColorStop(0, o.c0 ?? '#7a1a08'); g.addColorStop(.45, o.c1 ?? '#3a0804'); g.addColorStop(1, '#0a0202'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,120,40,${o.rays ?? .07})`;
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283 + t * .15; ctx.beginPath(); ctx.moveTo(W / 2, H * .45); ctx.lineTo(W / 2 + Math.cos(a - .06) * 2400, H * .45 + Math.sin(a - .06) * 2400); ctx.lineTo(W / 2 + Math.cos(a + .06) * 2400, H * .45 + Math.sin(a + .06) * 2400); ctx.fill(); }
  ctx.restore();
}

// A wall of fire along the bottom edge, k 0..1
export function fireWall(ctx, W, H, t, k) { if (k <= 0) return; flames(ctx, -40, W + 40, H + 30, 420 * k, t, k, 7); flames(ctx, -40, W + 40, H + 10, 260 * k, t * 1.3, k, 11); }

// Town square at night: city wall with torches in the distance, flagstones in perspective in front.
// cx is a sideways camera move in world units.
export const HORIZON = 470;
export function plaza(ctx, W, H, t, cx = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON); sky.addColorStop(0, '#0a0410'); sky.addColorStop(1, '#4a1008'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HORIZON + 2);
  ctx.fillStyle = 'rgba(255,230,190,.9)'; ctx.beginPath(); ctx.arc(1500 - cx * .05, 150, 46, 0, 6.3); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,150,.12)'; ctx.beginPath(); ctx.arc(1500 - cx * .05, 150, 90, 0, 6.3); ctx.fill();
  // city wall with battlements
  const wy = HORIZON - 150, off = -cx * .35;
  ctx.fillStyle = '#1e1410'; ctx.fillRect(0, wy, W, 150);
  for (let x = ((off % 120) + 120) % 120 - 120; x < W + 120; x += 120) { ctx.fillRect(x, wy - 34, 70, 36); }
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2;
  for (let r = 0; r < 5; r++) { const yy = wy + r * 30; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); for (let x = ((off + r * 40) % 80 + 80) % 80 - 80; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 30); ctx.stroke(); } }
  // gate
  const gx = W / 2 + off; ctx.fillStyle = '#0a0604'; ctx.beginPath(); ctx.moveTo(gx - 90, HORIZON); ctx.lineTo(gx - 90, wy + 30); ctx.arc(gx, wy + 30, 90, Math.PI, 0); ctx.lineTo(gx + 90, HORIZON); ctx.fill();
  // torches
  for (let i = -3; i <= 3; i++) { const tx = W / 2 + i * 330 + off; if (tx < -100 || tx > W + 100) continue; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(tx - 6, wy + 20, 12, 70); const fg = ctx.createRadialGradient(tx, wy + 10, 0, tx, wy + 10, 150); fg.addColorStop(0, 'rgba(255,170,60,.45)'); fg.addColorStop(1, 'rgba(255,90,0,0)'); ctx.fillStyle = fg; ctx.fillRect(tx - 150, wy - 140, 300, 300); flames(ctx, tx - 14, tx + 14, wy + 22, 80, t, 1, i + 20); }
  // flagstones: rows spaced in perspective, seams converging on the vanishing point
  const fl = ctx.createLinearGradient(0, HORIZON, 0, H); fl.addColorStop(0, '#2a1c14'); fl.addColorStop(1, '#4a3424'); ctx.fillStyle = fl; ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;
  for (let k = 1; k < 16; k++) { const y = HORIZON + (H - HORIZON) * Math.pow(k / 15, 1.8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let k = -24; k <= 24; k++) { const xb = W / 2 + (k * 200) - cx % 200, xt = W / 2 + (xb - W / 2) * .12; ctx.beginPath(); ctx.moveTo(xt, HORIZON); ctx.lineTo(xb, H); ctx.stroke(); }
  const glow = ctx.createRadialGradient(W / 2, H * .85, 50, W / 2, H * .85, 900); glow.addColorStop(0, 'rgba(255,140,60,.18)'); glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glow; ctx.fillRect(0, HORIZON, W, H - HORIZON);
}

// Stone wall: the ground behind panel and chart scenes
export function stoneBG(ctx, W, H, t, tint = '#2a1610') {
  ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);
  const rnd = mulberry(5); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
  for (let r = 0; r < 14; r++) { const y = r * 80; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (r % 2) * 90; x < W; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 80); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${rnd() * .03})`; ctx.fillRect(x, y, 180, 80); } }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// Gold ingot (元宝)
export function ingot(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -40, 0, 30); g.addColorStop(0, '#fff6b0'); g.addColorStop(.5, '#f0b020'); g.addColorStop(1, '#8a5000');
  blob(ctx, () => { ctx.moveTo(-60, -30); ctx.quadraticCurveTo(-40, 0, -30, 20); ctx.lineTo(30, 20); ctx.quadraticCurveTo(40, 0, 60, -30); ctx.quadraticCurveTo(0, -10, -60, -30); }, g, 3);
  blob(ctx, () => ctx.ellipse(0, -18, 22, 16, 0, 0, 6.3), '#ffe060', 3);
  ctx.restore();
}
