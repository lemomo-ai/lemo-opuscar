// Why We Have Seasons · the printed pages. The textbook is made up: no real publisher or textbook page.
// Print is only the setting: the question, the orbit figure. Everything that explains is the student's ink (film.js).
import { page, PW, PH } from './engine/book.js';
import { printText, printPara, SANS } from './engine/hand.js';

const INKP = '#26262a', GREY = '#77757a', SPOT = '#2f5d8a';   // print black, grey, one spot colour (the textbook's heading blue)
const L = (g, pts, w = 1.4, c = INKP, dash) => { g.strokeStyle = c; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); g.setLineDash([]); };
function header(g, chap, title, n, side) {
  printText(g, chap, side === 'L' ? 70 : PW - 70, 62, { size: 17, color: GREY, align: side === 'L' ? 'left' : 'right' });
  L(g, [[60, 76], [PW - 60, 76]], 1, 'rgba(40,40,45,.5)');
  printText(g, String(n), side === 'L' ? 70 : PW - 70, PH - 48, { size: 18, color: GREY, align: side === 'L' ? 'left' : 'right' });
  if (title) printText(g, title, 70, 150, { size: 38, weight: 700, color: SPOT, font: SANS });
}
function box(g, x, y, w, h, label) {   // the textbook's small blue box
  g.fillStyle = 'rgba(47,93,138,.08)'; g.fillRect(x, y, w, h); L(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], 1.2, SPOT);
  g.fillStyle = SPOT; g.fillRect(x, y - 2, 110, 34); printText(g, label, x + 55, y + 23, { size: 20, weight: 700, font: SANS, color: '#fff', align: 'center' });
}

// left page: the question. The wrong answer, the flashlight test and the final answer go in the blank space below
export const Q = { x: 60, y: 380, w: PW - 120, h: 130 };
export const PRINTED = [];   // printed lines the story needs read (for window.TEXTS); the running text is page texture
page('geoL', g => {
  header(g, '第一章　地球的运动', '1.3　地球公转与四季', 18, 'L');
  printPara(g, '地球绕太阳公转的轨道是一个近似正圆的椭圆。公转的同时，地球的自转轴（地轴）保持倾斜，并且在公转中指向基本不变。', 70, 220, PW - 140, { size: 23, indent: true });
  box(g, Q.x, Q.y, Q.w, Q.h, '思考');
  printText(g, '为什么夏天热、冬天冷？', Q.x + 40, Q.y + 92, { size: 32, font: SANS, weight: 500, color: INKP });
  PRINTED.push({ id: 'geoL', text: '为什么夏天热、冬天冷？', x: Q.x + 40, y: Q.y + 92, size: 32, face: SANS, weight: 500, t0: 0 });
});

// right page: the printed orbit figure (only the orbit, the sun and two labels; the Earth is the student's)
export const ORB = { cx: 430, cy: 420, rx: 320, ry: 150, sx: 390, sy: 420 };
export const ORBIT = a => [ORB.cx + ORB.rx * Math.cos(a), ORB.cy + ORB.ry * Math.sin(a)];   // a = π: left (December solstice, the perihelion side)
page('geoR', g => {
  header(g, '高中地理　必修第一册', null, 19, 'R');
  const P = []; for (let i = 0; i <= 120; i++) P.push(ORBIT(i / 120 * Math.PI * 2)); L(g, P, 1.4, INKP, [10, 7]);
  const { sx, sy } = ORB;                                                          // the sun: a small printed disc + rays
  g.fillStyle = 'rgba(38,38,42,.85)'; g.beginPath(); g.arc(sx, sy, 26, 0, 6.3); g.fill();
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; L(g, [[sx + 34 * Math.cos(a), sy + 34 * Math.sin(a)], [sx + 48 * Math.cos(a), sy + 48 * Math.sin(a)]], 1.6); }
  printText(g, '太阳', sx + 58, sy + 8, { size: 21 });
  const [lx, ly] = ORBIT(Math.PI), [rx, ry] = ORBIT(0);
  printText(g, '近日点（1 月初）', lx + 10, ly - 46, { size: 20, color: INKP });
  PRINTED.push({ id: 'geoR', text: '近日点（1 月初）', x: lx + 10, y: ly - 46, size: 20, face: "'NotoSerifSC'", t0: 0 });
  printText(g, '远日点（7 月初）', rx - 10, ry - 46, { size: 20, color: INKP, align: 'right' });
  for (const a of [Math.PI * .73, Math.PI * 1.73]) {                              // small arrows for the direction of revolution
    const [ax, ay] = ORBIT(a), [bx, by] = ORBIT(a + .08), d = Math.atan2(by - ay, bx - ax);
    L(g, [[bx - 14 * Math.cos(d - .5), by - 14 * Math.sin(d - .5)], [bx, by], [bx - 14 * Math.cos(d + .5), by - 14 * Math.sin(d + .5)]], 1.6);
  }
  printText(g, '图 1-12　地球公转示意图（未按比例）', 70, 112, { size: 18, color: GREY });
  L(g, [[60, 700], [PW - 60, 700]], .8, 'rgba(40,40,45,.35)');
});
