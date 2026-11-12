// 2D overlay: narration subtitles, character speech bubbles (typewriter), chapter banners, action-rating words, end card
import { BUB, CHAPTERS, CREDITS, TITLE_CN, DUR, voCues } from './story.js';
import { clamp, seg, back, ss, eo, lerp, TAU, mulberry } from './lib.js';

const INK = '#3a2a24';
export const CPS = 30;   // bubble typing speed (characters/second)

function wrap(x, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

export function drawSubs(x, t, dur) {
  // a line split into parts (story.js VO_SPLIT) fades in with its first part, cuts between parts and fades out after its last
  for (const { t0, t1, en, zh, first, last } of voCues(dur)) {
    const a = Math.min(first ? seg(t, t0 - .15, t0 + .15) : +(t >= t0), last ? 1 - seg(t, t1 + .25, t1 + .55) : +(t < t1));
    if (a <= 0) continue;
    x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.font = '500 40px Fredoka'; const lines = wrap(x, en, 1720);
    let y = 1080 - 70 - (lines.length - 1) * 48;
    x.lineJoin = 'round';
    const out = (s, yy, font, lw) => { x.font = font; x.lineWidth = lw; x.strokeStyle = 'rgba(28,18,12,.78)'; x.strokeText(s, 960, yy); x.fillStyle = '#fffaf0'; x.fillText(s, 960, yy); };
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 16;
    for (const l of lines) { out(l, y - 44, '500 40px Fredoka', 8); y += 48; }
    x.shadowBlur = 0;
    out(zh, y - 40 + 4, '32px "ZCOOL KuaiLe"', 7);
    x.restore();
  }
}

// Bubble: anchor=[sx,sy] = screen position of the top of the speaker's head
export function drawBubbles(x, t, anchors) {
  for (const [who, t0, t1, en, zh] of BUB) {
    if (t < t0 - .05 || t > t1 + .25) continue;
    const an = anchors[who]; if (!an) continue;
    const kin = back(seg(t, t0, t0 + .22), 2.2), kout = 1 - ss(seg(t, t1, t1 + .2)), k = kin * kout;
    if (k <= 0) continue;
    const n = Math.floor(clamp((t - t0 - .12) * CPS, 0, en.length));
    x.save(); x.font = '600 46px Fredoka';
    const tw = Math.max(x.measureText(en).width, 260), bw = tw + 90, bh = 150;
    let bx = clamp(an[0] - bw * .35, 40, 1880 - bw), by = clamp(an[1] - bh - 70, 30, 700);
    const tx = clamp(an[0], bx + 50, bx + bw - 50);
    x.translate(tx, by + bh); x.scale(k, k); x.translate(-tx, -(by + bh));
    x.globalAlpha = clamp(kout * 1.5);
    // shadow
    x.fillStyle = 'rgba(40,25,15,.22)'; x.beginPath(); x.roundRect(bx + 8, by + 12, bw, bh, 44); x.fill();
    // tail + body
    x.beginPath(); x.roundRect(bx, by, bw, bh, 44);
    x.moveTo(tx - 26, by + bh - 2); x.lineTo(lerp(tx, an[0], .7), Math.min(an[1] - 16, by + bh + 58)); x.lineTo(tx + 20, by + bh - 2);
    x.fillStyle = '#fffdf8'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.lineJoin = 'round';
    x.beginPath(); x.roundRect(bx, by, bw, bh, 44); x.stroke();
    x.beginPath(); x.moveTo(tx - 26, by + bh); x.lineTo(lerp(tx, an[0], .7), Math.min(an[1] - 16, by + bh + 58)); x.lineTo(tx + 20, by + bh); x.stroke();
    x.fillStyle = '#fffdf8'; x.fillRect(tx - 22, by + bh - 8, 40, 9);
    // text
    x.fillStyle = '#241814'; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillText(en.slice(0, n), bx + 45, by + 68);
    const za = seg(t, t0 + .12 + en.length / CPS, t0 + .4 + en.length / CPS);
    x.globalAlpha *= za; x.font = '32px "ZCOOL KuaiLe"'; x.fillStyle = '#7a5e4c'; x.fillText(zh, bx + 47, by + 118);
    // next-page arrow
    if (za > .5) { const yy = by + bh - 34 + Math.sin(t * 9) * 5; x.beginPath(); x.moveTo(bx + bw - 52, yy); x.lineTo(bx + bw - 30, yy); x.lineTo(bx + bw - 41, yy + 13); x.closePath(); x.fillStyle = '#e8413a'; x.fill(); }
    x.restore();
  }
}
// Times of the typing sound effects
export function blipTimes() {
  const ev = [];
  for (const [who, t0, t1, en] of BUB) for (let i = 0; i < en.length; i++) { const ch = en[i]; if (/[A-Za-z!?']/.test(ch) && i % 2 === 0) ev.push({ t: t0 + .12 + i / CPS, type: 'blip', who }); }
  return ev;
}

export function drawChapter(x, t) {
  for (const [t0, t1, a, b, zh] of CHAPTERS) {
    if (t < t0 || t > t1 + .6) continue;
    const kin = seg(t, t0, t0 + .7), kout = seg(t, t1, t1 + .5);
    const drop = (1 - back(kin, 1.4)) * -320 - ss(kout) * 420, sw = Math.sin((t - t0) * 3.2) * .03 * (1 - kin * .6) * (1 - kout);
    x.save(); x.translate(960, 150 + drop); x.rotate(sw);
    // hanging cord
    x.strokeStyle = '#6b5a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-300, -40); x.lineTo(-300, -400); x.moveTo(300, -40); x.lineTo(300, -400); x.stroke();
    // cardboard sign
    x.font = '84px "Lilita One"'; const w = Math.max(640, x.measureText(b).width + 160);
    x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.roundRect(-w / 2 + 10, -40 + 14, w, 190, 20); x.fill();
    x.fillStyle = '#fffaf0'; x.beginPath(); x.roundRect(-w / 2 - 10, -52, w + 20, 214, 26); x.fill();
    x.fillStyle = '#f4e6c8'; x.beginPath(); x.roundRect(-w / 2, -40, w, 190, 20); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    // ribbon
    x.fillStyle = '#d8423a'; x.beginPath(); x.moveTo(-170, -70); x.lineTo(170, -70); x.lineTo(150, -32); x.lineTo(170, 6); x.lineTo(-170, 6); x.lineTo(-150, -32); x.closePath(); x.fill(); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '38px "Lilita One"'; x.fillStyle = '#fff4d6'; x.fillText(a, 0, -30);
    x.font = '84px "Lilita One"'; x.lineWidth = 12; x.strokeStyle = INK; x.lineJoin = 'round'; x.strokeText(b, 0, 58); x.fillStyle = '#ffcf3f'; x.fillText(b, 0, 58);
    x.font = '34px "ZCOOL KuaiLe"'; x.fillStyle = '#6b4a36'; x.fillText(zh, 0, 122);
    x.restore();
  }
}

// Action ratings: NICE! GREAT!
export function drawAction(x, t, list) {
  for (const { t0, text, p, col } of list) {
    if (t < t0 || t > t0 + 1.2 || !p) continue;
    const k = back(seg(t, t0, t0 + .18), 2.5), fo = 1 - seg(t, t0 + .85, t0 + 1.2);
    x.save(); x.translate(p[0], p[1] - 40 - seg(t, t0, t0 + 1.2) * 50); x.rotate(-.12); x.scale(k, k); x.globalAlpha = fo;
    // star burst
    const R = mulberry(Math.round(t0 * 10));
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + R() * .3, r0 = 90, r1 = 150 + R() * 60 * eo(seg(t, t0, t0 + .4)); x.strokeStyle = i % 2 ? '#ffe35a' : '#ffffff'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * .6); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * .6); x.stroke(); }
    x.font = 'italic 120px "Lilita One"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 30; x.strokeStyle = '#fffaf0'; x.strokeText(text, 0, 0);
    x.lineWidth = 12; x.strokeStyle = INK; x.strokeText(text, 0, 0);
    const g = x.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); x.fillStyle = g; x.fillText(text, 0, 0);
    x.restore();
  }
}
export function drawBang(x, t, t0, p) {
  if (!p || t < t0 || t > t0 + 1.1) return;
  const k = back(seg(t, t0, t0 + .15), 3), fo = 1 - seg(t, t0 + .9, t0 + 1.1);
  x.save(); x.translate(p[0] + 10, p[1] - 30); x.scale(k, k); x.globalAlpha = fo;
  x.font = '130px "Lilita One"'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
  x.lineWidth = 26; x.strokeStyle = '#fffaf0'; x.strokeText('!', 0, 0); x.lineWidth = 10; x.strokeStyle = INK; x.strokeText('!', 0, 0); x.fillStyle = '#ff4b3a'; x.fillText('!', 0, 0);
  x.restore();
}

export function drawEnd(x, t) {
  const T0 = 123.4;
  if (t < T0) return;
  const k = seg(t, T0, T0 + .8), k2 = back(seg(t, T0 + 1.6, T0 + 2.0), 2.4), k3 = seg(t, 127.6, 128.6), fo = 1 - seg(t, DUR - 1.2, DUR - .2);
  x.save(); x.globalAlpha = fo; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.save(); x.globalAlpha *= k; x.translate(0, (1 - eo(k)) * 30);
  x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 24;
  x.font = '96px "Lilita One"'; x.lineWidth = 14; x.strokeStyle = INK; x.strokeText("The Little Sprite's Adventure", 960, 170); x.fillStyle = '#ffd24a'; x.fillText("The Little Sprite's Adventure", 960, 170);
  x.shadowBlur = 0; x.font = '50px "ZCOOL KuaiLe"'; x.lineWidth = 9; x.strokeStyle = 'rgba(30,20,14,.8)'; x.strokeText(TITLE_CN, 960, 262); x.fillStyle = '#fffaf0'; x.fillText(TITLE_CN, 960, 262);
  x.restore();
  if (k2 > 0) { x.save(); x.translate(960, 350); x.scale(k2, k2); x.rotate(-.05); x.font = 'italic 64px "IM Fell English"'; x.lineWidth = 8; x.strokeStyle = 'rgba(30,20,14,.7)'; x.strokeText('The End?', 0, 0); x.fillStyle = '#fffaf0'; x.fillText('The End?', 0, 0); x.restore(); }
  if (k3 > 0) {
    // LemoLab credit: below The End?, dark outline (the background is the cream page), fades in together with the asset credits
    x.save(); x.globalAlpha = fo * k3; x.font = '600 36px Fredoka'; x.lineWidth = 7; x.strokeStyle = 'rgba(30,20,14,.75)';
    x.strokeText('LemoLab × Claude Opus 5.5', 960, 430); x.fillStyle = '#fffaf0'; x.fillText('LemoLab × Claude Opus 5.5', 960, 430); x.restore();
    x.globalAlpha = fo * k3; x.font = '26px Fredoka'; x.fillStyle = 'rgba(255,248,235,.92)'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10;
    CREDITS.forEach((l, i) => { x.font = i === 2 ? '22px "ZCOOL KuaiLe", Fredoka' : '22px Fredoka'; x.fillText(l, 960, 960 + i * 38); });
  }
  x.restore();
}
