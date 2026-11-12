// sheet.js: the character sheet of the film's guide, Orbi (index.html?f=options -> options-1.png). Needs flat.js and heroes.js.
const GUIDE = { en: 'A tiny probe, its eye is a zoom lens', zh: '小探测器，眼睛就是变焦镜头' };

function sheet() {
  el('rect', { width: W, height: H, fill: C.night });
  const bg = g();
  stars(bg, 41, 120, inBoxes([[60, 40, 1000, 200], [70, 260, 1790, 780]]));
  const H0 = HEROES.orbi;
  text(g(), 80, 120, H0.name, { 'font-size': 72, 'font-weight': 700, fill: C.cream, 'letter-spacing': -1 });
  text(g(), 84, 172, GUIDE.en, { 'font-size': 26, 'font-weight': 500, fill: C.mist });
  text(g(), 84, 216, GUIDE.zh, { 'font-size': 26, 'font-weight': 700, fill: C.sun, 'font-family': 'NotoSC', 'letter-spacing': 1 });
  text(g(), 1840, 120, 'CHARACTER SHEET · THE GUIDE', { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': 'end' });
  const P = g(), y0 = 270, x0 = 80, w = 1760, h = 760;
  el('rect', { x: x0, y: y0, width: w, height: h, rx: 34, fill: C.n2 }, P);
  // front, on a hard-edged halo
  const cx = x0 + 330, cy = y0 + 350;
  el('circle', { cx, cy, r: 230, fill: C.n3 }, P);
  heroAs(H0, g(), cx, cy + 8, 380 * H0.k, { view: 'front', expr: 'calm', look: [0, 0.2], fly: true });
  text(P, cx, y0 + 690, 'FRONT', { 'font-size': 15, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': 'middle' });
  // side + happy + one action, on one shelf
  const row = y0 + 470, xs = [x0 + 860, x0 + 1160, x0 + 1460], sm = 210 * H0.k;
  el('rect', { x: x0 + 700, y: row + 120, width: 960, height: 4, rx: 2, fill: C.n3 }, P);
  heroAs(H0, g(), xs[0] + 20, row, sm, { view: 'side', expr: 'calm' });
  heroAs(H0, g(), xs[1], row, sm, { view: 'front', expr: 'happy', tilt: 10 });
  heroAs(H0, g(), xs[2], row - 20, sm, { view: 'front', expr: 'wow', look: [0.7, -0.5], fly: true, rot: 12, tilt: -14 });
  xs.forEach((x, j) => text(P, x, y0 + 690, ['SIDE', 'HAPPY', 'ZOOM'][j], { 'font-size': 15, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': 'middle' }));
}
