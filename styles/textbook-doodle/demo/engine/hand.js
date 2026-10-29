// Textbook Doodle · handwriting and print.
//   writeText(ctx, text, x, y, o, t)  handwritten line, revealed character by character (o.times = [{t0,t1}] per character, or o.t0/o.dur)
//   printText(ctx, text, x, y, o)     printed type (Song/Sans), never moves, never boils
// Handwriting = Long Cang filled in ballpoint blue, each character turned and lifted a little (seeded), wiped in left→right
// over its own writing time; it boils with the doodles on twos.
import { clamp, hash, vnoise } from '/core/lib.js';
import { INK } from './pen.js';

export const HAND = "'LongCang'", SERIF = "'NotoSerifSC'", SANS = "'NotoSansSC'";

export function measure(ctx, text, size, font = HAND) { ctx.font = `${size}px ${font}`; return ctx.measureText(text).width; }

// o: {size, color, align:'left'|'center', times, t0, dur, seed, tilt, wobble, bold (passes), alpha, spacing}
export function writeText(ctx, text, x, y, o, t, b = 0) {
  const size = o.size ?? 48, chars = [...text], n = chars.length, seed = o.seed ?? hash(text.length * 13.7) * 1000;
  ctx.font = `${size}px ${o.font ?? HAND}`; ctx.textBaseline = 'alphabetic';
  const sp = o.spacing ?? -.04 * size, ws = chars.map(c => ctx.measureText(c).width + sp), W = ws.reduce((a, w) => a + w, 0) - sp;
  let cx = o.align === 'center' ? x - W / 2 : o.align === 'right' ? x - W : x;
  const tilt = o.tilt ?? 0;
  ctx.save(); ctx.globalCompositeOperation = o.blend ?? 'multiply'; ctx.fillStyle = o.color ?? INK.ball;
  for (let i = 0; i < n; i++) {
    const tm = o.times ? o.times[i] : { t0: (o.t0 ?? -1e9) + (o.dur ?? 0) * i / n, t1: (o.t0 ?? -1e9) + (o.dur ?? 0) * (i + 1) / n };
    const u = tm.t1 > tm.t0 ? clamp((t - tm.t0) / Math.min(tm.t1 - tm.t0, .22), 0, 1) : (t >= tm.t0 ? 1 : 0);   // one character takes at most 0.22 s
    if (u > 0 && chars[i].trim()) {
      const r = hash(seed + i * 3.1), wob = o.wobble ?? 1;
      const dx = (vnoise(b * .9 + i * 1.7 + seed) - .5) * 1.2 * wob, dy = (r - .5) * size * .08 * wob + (vnoise(b * 1.3 + i + seed * 2) - .5) * 1.2 * wob;
      const rot = ((hash(seed + i * 7.7) - .5) * .09 * wob) + tilt;
      ctx.save(); ctx.translate(cx + ws[i] / 2 + dx, y + dy); ctx.rotate(rot);
      if (u < 1) { ctx.beginPath(); ctx.rect(-ws[i] / 2 - 2, -size * 1.1, (ws[i] + 4) * u, size * 1.5); ctx.clip(); }
      ctx.globalAlpha = o.alpha ?? .93;
      for (let p = 0; p < (o.bold ?? 1); p++) ctx.fillText(chars[i], -ws[i] / 2 + p * .9, p * .5);
      ctx.restore();
    }
    cx += ws[i];
  }
  ctx.restore();
  return W;
}

// o: {size, font, weight, color, align, alpha, spacing}
export function printText(ctx, text, x, y, o = {}) {
  ctx.save(); ctx.font = `${o.weight ?? 400} ${o.size ?? 22}px ${o.font ?? SERIF}`; ctx.fillStyle = o.color ?? '#26262a';
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = o.baseline ?? 'alphabetic'; ctx.globalAlpha = o.alpha ?? .92;
  if (o.spacing) ctx.letterSpacing = `${o.spacing}px`;
  ctx.fillText(text, x, y); ctx.restore();
}

// a printed paragraph: wrapped to width (Chinese breaks between any two characters); returns the y of the last line
export function printPara(ctx, text, x, y, w, o = {}) {
  const size = o.size ?? 22, lh = o.lh ?? size * 1.75; ctx.font = `${o.weight ?? 400} ${size}px ${o.font ?? SERIF}`;
  let line = o.indent ? '　　' : '', yy = y;
  const NOHEAD = '，。、：；！？”’）》…';   // kinsoku: these marks never start a line, they squeeze onto the previous one
  for (const c of text) {
    if (ctx.measureText(line + c).width > w && !NOHEAD.includes(c)) { printText(ctx, line, x, yy, o); line = ''; yy += lh; }
    line += c;
  }
  if (line) printText(ctx, line, x, yy, o);
  return yy;
}
