// Characters: front-facing game portraits, thick black outline, flat fill with one layer of shading.
// Origin between the feet; at s = 1 a figure is about 460 px tall.
// xd (小兄弟, the newbie) is the lead: a plain cloth tunic, bare hands. dr (大R, the big spender) is dressed in gold.
// p4 is the warrior in the ad itself.
import { lerp } from '/core/lib.js';
import { note } from './fx.js';

const INK = '#0a0604';
export const LOOKS = {
  p4: { hair: '#d8d8d8', cap: '#b01818', shirt: '#f2f2f2', pants: '#141414', chain: true, blade: 'dao', skin: '#e8b88e' },
  xd: { hair: '#1a1410', shirt: '#b8a07a', pants: '#5a4a36', skin: '#efc39a' },
  dr: { hair: '#1a1410', shirt: '#e0a828', pants: '#6a1010', chain: true, gold: true, shades: true, blade: 'dao', skin: '#ecc29a' },
};

function limb(ctx, pts, w, color) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, c] of [[w + 8, INK], [w, color]]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
}
function blob(ctx, draw, fill, lw = 5) { ctx.beginPath(); draw(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }

// Weapon held at (x, y), pointing along `ang` (radians, 0 = right)
export function weapon(ctx, kind, x, y, ang, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const L = kind === 'dao' ? 330 : 280;
  limb(ctx, [[-34, 0], [18, 0]], 14, '#3a1a0a');                                                                      // grip
  ctx.fillStyle = '#c01810'; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-60, 30, -50, 70); ctx.quadraticCurveTo(-40, 30, -30, 4); ctx.fill();   // red tassel
  blob(ctx, () => { ctx.ellipse(22, 0, 12, 30, 0, 0, 6.3); }, '#e0a828', 4);                                             // guard
  const g = ctx.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#c8d4e0'); g.addColorStop(.55, '#6a7888'); g.addColorStop(1, '#a8b4c4');
  blob(ctx, () => {
    ctx.moveTo(32, -14);
    if (kind === 'dao') { ctx.lineTo(L * .7, -22); ctx.quadraticCurveTo(L, -26, L + 10, -48); ctx.quadraticCurveTo(L * .95, 18, L * .6, 22); ctx.lineTo(32, 14); }
    else { ctx.lineTo(L, -10); ctx.lineTo(L + 30, 0); ctx.lineTo(L, 10); ctx.lineTo(32, 10); }
    ctx.closePath();
  }, g, 4);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(L * .8, -12); ctx.stroke();
  if (kind === 'dao') { ctx.fillStyle = '#e0a828'; ctx.beginPath(); ctx.moveTo(50, -10); ctx.lineTo(110, -14); ctx.lineTo(110, 8); ctx.lineTo(50, 8); ctx.fill(); }   // gold inlay on the back of the blade
  ctx.restore();
}

// pose: idle | slash | flex; beat: 0..1 phase within the beat (bob and nod); talk: mouth open 0..1; sad: a frown
export function hero(ctx, x, y, s, look, o = {}) {
  const L = typeof look === 'string' ? LOOKS[look] : look, pose = o.pose ?? 'idle', beat = o.beat ?? 0, flip = o.flip ? -1 : 1;
  const bob = -Math.abs(Math.sin(beat * Math.PI)) * 6, nod = Math.sin(beat * Math.PI * 2) * .04;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s);
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 4, 110, 22, 0, 0, 6.3); ctx.fill(); }
  ctx.translate(0, bob);
  const sk = L.skin;
  // legs and white sneakers
  limb(ctx, [[-28, -205], [-32, -100], [-36, -14]], 50, L.pants); limb(ctx, [[28, -205], [32, -100], [38, -14]], 50, L.pants);
  for (const sx of [-1, 1]) blob(ctx, () => ctx.ellipse(sx * 42, -6, 38, 16, 0, 0, 6.3), '#f4f4f4', 5);
  // body
  blob(ctx, () => { ctx.moveTo(-74, -338); ctx.lineTo(74, -338); ctx.lineTo(60, -196); ctx.lineTo(-60, -196); ctx.closePath(); }, L.shirt, 5);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(-60, -330, 40, 130);
  if (L.gold) { ctx.fillStyle = '#e0b030'; ctx.fillRect(-60, -220, 120, 14); }
  // neck and chain
  blob(ctx, () => ctx.rect(-16, -362, 32, 28), sk, 4);
  if (L.chain) { const c = L.gold ? '#ffd040' : '#e8eef4'; for (let i = 0; i <= 14; i++) { const u = i / 14, cx = lerp(-34, 34, u), cy = -340 + Math.sin(u * Math.PI) * 42; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, 6.3); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.3); ctx.fill(); } }
  // left arm (screen left), hanging
  limb(ctx, [[-66, -326], [-90, -262], [-88, -196]], 30, sk);
  ctx.fillStyle = L.shirt; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(-70, -318, 26, 22, -.4, 0, 6.3); ctx.fill(); ctx.stroke();
  // head
  ctx.save(); ctx.translate(0, -400); ctx.rotate(nod);
  blob(ctx, () => ctx.ellipse(0, 0, 44, 54, 0, 0, 6.3), sk, 5);
  ctx.fillStyle = 'rgba(160,80,40,.18)'; ctx.beginPath(); ctx.ellipse(16, 10, 22, 34, 0, 0, 6.3); ctx.fill();
  // messy hair: sides and fringe
  ctx.fillStyle = L.hair; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-52, -22);
  for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI, r = i % 2 ? 50 : 64; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * .8 - 14); }
  ctx.lineTo(52, -22); ctx.lineTo(56, 20); ctx.lineTo(46, 4); ctx.lineTo(40, -14); ctx.lineTo(-40, -14); ctx.lineTo(-46, 4); ctx.lineTo(-56, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!L.cap) { ctx.beginPath(); for (let i = 0; i < 5; i++) { const x0 = -36 + i * 18; ctx.moveTo(x0, -20); ctx.lineTo(x0 + 10, 2 + (i % 2) * 6); ctx.lineTo(x0 + 18, -20); } ctx.fill(); ctx.stroke(); }
  if (L.cap) {
    blob(ctx, () => { ctx.ellipse(0, -30, 50, 34, 0, Math.PI, 0); ctx.lineTo(50, -24); ctx.lineTo(-50, -24); ctx.closePath(); }, L.cap, 5);
    blob(ctx, () => ctx.ellipse(6, -24, 60, 12, 0, 0, Math.PI), L.cap, 5);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -46); ctx.quadraticCurveTo(-2, -58, 6, -46); ctx.quadraticCurveTo(14, -36, 22, -50); ctx.stroke();   // one white script stroke on the cap (no brand)
  }
  if (L.shades) { ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.moveTo(-46, -4); ctx.lineTo(46, -4); ctx.lineTo(42, 16); ctx.quadraticCurveTo(24, 26, 6, 14); ctx.lineTo(-6, 14); ctx.quadraticCurveTo(-24, 26, -42, 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-36, -1, 18, 4); ctx.fillRect(14, -1, 18, 4); }
  else { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-17, 4, 5, 6, 0, 0, 6.3); ctx.ellipse(17, 4, 5, 6, 0, 0, 6.3); ctx.fill(); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, -10); ctx.lineTo(-8, -6); ctx.moveTo(26, -10); ctx.lineTo(8, -6); ctx.stroke(); }
  const talk = o.talk ?? 0; ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.ellipse(0, 32, 12 + talk * 4, 3 + talk * 10, 0, 0, 6.3); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  if (o.sad) { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 44, 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  ctx.restore();
  // right arm (screen right) and weapon
  if (pose === 'slash') { limb(ctx, [[66, -326], [110, -380], [100, -440]], 30, sk); if (L.blade) weapon(ctx, L.blade, 100, -444, -1.75); limb(ctx, [[-66, -326], [-20, -380], [70, -430]], 30, sk); }
  else if (pose === 'flex') { limb(ctx, [[66, -326], [130, -320], [128, -400]], 34, sk); blob(ctx, () => ctx.arc(128, -408, 20, 0, 6.3), sk, 4); }
  else { limb(ctx, [[66, -326], [92, -262], [100, -204]], 30, sk); if (L.blade) weapon(ctx, L.blade, 100, -204, o.bladeAng ?? .95); }
  ctx.fillStyle = L.shirt; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(70, -318, 26, 22, .4, 0, 6.3); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Name above a head (green by default). y is above the head
export function nameplate(ctx, x, y, name, o = {}) {
  ctx.save(); ctx.textAlign = 'center'; ctx.font = `700 ${o.size ?? 30}px 'NotoSansSC', sans-serif`; ctx.lineJoin = 'round';
  ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(name, x, y); ctx.fillStyle = o.color ?? '#9dff7a'; ctx.fillText(name, x, y);
  note(ctx, name, x, y, o.size ?? 30, ctx.measureText(name).width);
  ctx.restore();
}
