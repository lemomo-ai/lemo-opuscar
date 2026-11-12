// page.js — the printed page: paper, step numbers, parts call-outs, magnifier circles (the subtitles are drawn in film.js).
import { PAL, LW, roundRect } from './iso.js';

export const FONT = { num: '"Inter Manual"', zh: '"Noto Sans SC Manual"' };

let paperTex = null;
function makePaper(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // very fine fibres and a few specks: printed stock, not a texture effect
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 4 + r() * 16;
    g.strokeStyle = r() < .5 ? 'rgba(120,105,80,0.05)' : 'rgba(255,255,255,0.22)'; g.lineWidth = .6 + r() * .6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * .4); g.stroke();
  }
  for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(90,80,60,0.10)'; g.fillRect(r() * W, r() * H, 1 + r(), 1 + r()); }
  return c;
}
export function paper(g, W, H) { if (!paperTex || paperTex.width !== W) paperTex = makePaper(W, H); g.drawImage(paperTex, 0, 0); }

export function stepNum(g, n, x, y, size = 150) {
  g.save(); g.fillStyle = PAL.ink; g.font = `700 ${size}px ${FONT.num}`; g.textBaseline = 'alphabetic';
  g.fillText(String(n), x, y); g.restore();
}
// rounded call-out box listing parts: items [{n:'4×', draw:(g,x,y)=>{}}]
export function partsBox(g, x, y, w, h, items) {
  roundRect(g, x, y, w, h, 18, '#FFFFFF', LW);
  const cw = w / items.length;
  items.forEach((it, i) => {
    const cx = x + cw * i;
    g.save(); g.fillStyle = PAL.ink; g.font = `600 34px ${FONT.num}`; g.textBaseline = 'alphabetic'; g.fillText(it.n, cx + 26, y + h / 2 + 12); g.restore();
    it.draw(g, cx + cw * .66, y + h * .5);
  });
}
// magnifier: leader line from the spot to the circle, then the detail drawn inside a clip
export function magnifier(g, spot, cx, cy, r, drawInside, o = {}) {
  const dx = spot[0] - cx, dy = spot[1] - cy, d = Math.hypot(dx, dy), ex = cx + dx / d * r, ey = cy + dy / d * r;
  g.save(); g.strokeStyle = PAL.ink; g.lineWidth = LW * .7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(spot[0], spot[1]); g.lineTo(ex, ey); g.stroke();
  g.beginPath(); g.arc(spot[0], spot[1], o.spotR ?? 26, 0, Math.PI * 2); g.stroke();
  g.restore();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = '#FBF9F4'; g.fill(); g.clip();
  drawInside(g); g.restore();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.lineWidth = LW * 1.3; g.strokeStyle = PAL.ink; g.stroke(); g.restore();
}
