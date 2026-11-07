// Gate stills: component kit, model sheet, style frames.
import * as D from './engine/deco.js';
import * as T from './engine/type.js';
import * as B from './engine/bulbs.js';
const { C } = D;

function label(g, txt, x, y, size = 17) {
  g.save(); g.font = `600 ${size}px Josefin`; if ('letterSpacing' in g) g.letterSpacing = '4px'; g.fillStyle = C.gold1; g.textAlign = 'left'; g.fillText(txt, x, y); g.restore();
}
function panel(g, x, y, w, h, title) {
  g.save(); g.fillStyle = 'rgba(255,230,170,.025)'; g.fillRect(x, y, w, h); g.restore();
  D.gline(g, D.rectPts(x, y, w, h), { w: 1, alpha: .5 });
  label(g, title, x + 16, y + 28);
}

export function kit(g) {
  D.ground(g, 1920, 1080, { top: '#0e0c09', bot: '#050403', vig: .4 });
  T.goldText(g, 'ART DECO · COMPONENT KIT', 960, 62, { size: 40, font: 'Limelight', track: 8 });
  label(g, 'engine/deco.js · engine/type.js · engine/bulbs.js · engine/cam.js', 960 - 330, 94, 15);
  // 1 title bar
  panel(g, 30, 115, 1000, 345, '01 · TITLE BAR   titleBar(g, text, cx, cy, {p, out, sub})');
  T.titleBar(g, 'MIDNIGHT', 530, 240, { p: 1, size: 62, sub: 'AT THE STARLIGHT HOTEL', subSize: 21, sheen: .45 });
  [.2, .4, .62, .85].forEach((p, i) => { T.titleBar(g, 'STARLIGHT', 150 + i * 243, 395, { p, size: 21, wings: false, sheen: .5, pad: 14 }); label(g, 'p = ' + p, 118 + i * 243, 445, 13); });
  // 2 numerals
  panel(g, 1045, 115, 845, 345, '02 · NUMERALS & YEARS   yearBadge · floorMedallion · decoDigits · clockFace · dial'.slice(0, 22));
  T.yearBadge(g, '1930', 1140, 285, 62);
  T.floorMedallion(g, '30', 1370, 285, 58, { sub: 'KITCHEN' });
  T.decoDigits(g, '11:59', 1580, 310, 60);
  T.clockFace(g, 1790, 280, 74, { h: 11, m: 59, s: 50 });
  T.dial(g, 1460, 440, 58, .72, { labels: ['L', '5', '10', '15', '20', '25', 'R'] });
  T.decoDigits(g, '1931', 1210, 430, 34, { rules: false });
  T.decoDigits(g, 'No. 30', 1700, 430, 30, { rules: false, font: 'Poiret' });
  // 3 radial backgrounds
  panel(g, 30, 475, 470, 300, '03 · RADIAL GROUNDS   sunburst()');
  g.save(); g.beginPath(); g.rect(31, 510, 468, 264); g.clip();
  D.sunburst(g, 150, 770, { rays: 60, r0: 30, r1: 400, a0: Math.PI, a1: D.TAU, mode: 'both', colorA: 'rgba(201,162,75,.16)', w: 2 });
  D.sunburst(g, 385, 640, { rays: 48, r0: 10, r1: 150, mode: 'lines', w: 1.8 });
  D.glow(g, 385, 640, 90, '#ffcf7a', .35);
  g.restore();
  // 4 arch frames
  panel(g, 515, 475, 520, 300, '04 · ARCH FRAMES   archFrame()');
  D.archFrame(g, 650, 760, 200, 230, { rings: 3, gap: 12, steps: 3, crown: 'round' });
  D.archFrame(g, 900, 760, 190, 230, { rings: 2, gap: 12, steps: 4, crown: 'point', fill: '#0c3a2f' });
  // 5 patterns
  panel(g, 1050, 475, 840, 300, '05 · PATTERNS   fishScale · chevrons · fan · speedLines');
  D.fishScale(g, 1070, 515, 250, 240, 22, { stroke: 'rgba(201,162,75,.8)', fillA: '#0e0c09', fillB: '#1a140b' });
  D.chevrons(g, 1340, 1600, 540, { n: 8, h: 26, rows: 5, gap: 16 });
  D.speedLines(g, 1600, 700, 0, { n: 6, len: 250, spread: 60, w: 5, seed: 4 });
  D.fan(g, 1690, 755, 95, { ribs: 11, fill: '#0c3a2f' });
  D.fan(g, 1815, 755, 60, { ribs: 9, fill: '#4a0c17', open: .7 });
  // 6 bulb sign
  panel(g, 30, 790, 1100, 270, '06 · BULB MARQUEE   buildSign(text) + drawSign(g, sign, x, y, s, {lit})');
  const sign = B.buildSign('LEMO-OPUSCAR', { size: 200, spacing: 17 });
  const s = 1040 / sign.w;
  B.drawSign(g, sign, 60, 830, s, { lit: (li, bi, gi) => li < 6 ? (gi % 5 === 0 ? 1.3 : 1) : li === 6 ? (bi < 6 ? 1 : 0) : 0 });
  // 7 subtitle + one colour
  panel(g, 1145, 790, 745, 270, '07 · SUBTITLE CARD · ANY SHAPE / THE ONE COLOUR');
  T.subtitleCard(g, 'All they need now is the song.', { cx: 1470, cy: 870, size: 30, speaker: 'radio' });
  T.subtitleCard(g, 'Out of order?!', { cx: 1330, cy: 975, size: 30, speaker: 'boy' });
  D.drawShape(g, D.starPts(1740, 972, 44, .26), { color: '#D97757', halo: .5, trail: { ang: .12, len: 200, spread: 30, w: 7, x: 1712, y: 975 } });
  label(g, 'drawShape(pts, {color:"#D97757"})', 1560, 1045, 12);
}

export default {};

import * as CH from './chars.js';
export function charTest(g) {
  D.ground(g, 1920, 1080, { top: '#231a12', bot: '#0b0806', vig: .2 });
  const s = 3.4, by = 560;
  CH.drawPip(g, { x: 180, y: by, s, view: 'front', face: 'neutral', ...CH.FRONT_POSES.stand, letter: 'N' });
  CH.drawPip(g, { x: 420, y: by, s, view: 'q', face: 'neutral', ...CH.FRONT_POSES.stand, letter: 'N' });
  CH.drawPip(g, { x: 660, y: by, s, view: 'side', face: 'neutral', ...CH.POSES.stand, letter: 'N' });
  CH.drawPip(g, { x: 900, y: by, s, view: 'back', ...CH.FRONT_POSES.stand, letter: 'N' });
  const names = ['neutral', 'panic', 'determined', 'calm', 'joy', 'awe'];
  names.forEach((f, i) => CH.drawPip(g, { x: 1120 + (i % 3) * 260, y: 380 + Math.floor(i / 3) * 420 + 170, s: 5.5, view: 'q', face: f, ...CH.FRONT_POSES.stand }));
  CH.drawPip(g, { x: 170, y: 960, s: 2.6, view: 'side', face: 'determined', ...CH.POSES.run1, letter: 'N' });
  CH.drawPip(g, { x: 380, y: 960, s: 2.6, view: 'side', face: 'calm', ...CH.POSES.kick, letter: 'F' });
  CH.drawPip(g, { x: 600, y: 960, s: 2.6, view: 'side', face: 'effort', ...CH.POSES.windup, letter: 'N' });
  CH.drawPip(g, { x: 820, y: 960, s: 2.6, view: 'front', face: 'panic', armsOver: true, armN: [2.5, 1.28], armF: [2.5, 1.28] });
}
export function headTest(g) {
  D.ground(g, 1920, 1080, { top: '#231a12', bot: '#0b0806', vig: .2 });
  ['neutral', 'panic', 'determined', 'calm'].forEach((f, i) => CH.drawPipHead(g, 250 + i * 470, 330, 13, 'q', f));
  CH.drawPipHead(g, 250, 820, 13, 'front', 'joy');
  CH.drawPipHead(g, 720, 820, 13, 'side', 'neutral');
  CH.drawPipHead(g, 1190, 820, 13, 'side', 'awe');
  CH.drawPipHead(g, 1660, 820, 13, 'back', 'neutral');
}
import { drawLobby } from './scenes/lobby.js';
export function frameLobby(g, t, q = {}) {
  drawLobby(g, {
    t, dial: 0, clock: { h: 11, m: 57, s: 5 },
    pip: (g, cam) => {
      const X = -.55, Z = 3.3, f = cam.P(X, 0, Z), s = cam.scaleAt(X, 0, Z) * CH.PIP_M / CH.PIP_H;
      // contact shadow
      g.save(); g.translate(f[0], f[1]); g.scale(1, .22); D.glow(g, 0, 0, s * 40, '#000000', .8); g.restore();
      CH.drawPip(g, { x: f[0], y: f[1] - s * CH.PIP_SOLE, s, view: 'back', ...CH.FRONT_POSES.stand, armN: [.25, .5], armF: [.12, .1], letter: 'N', cap: { rot: -.05 } });
    },
  });
}
import { drawRoof } from './scenes/roof.js';
export function frameRoof(g, t, q = {}) {
  const nLit = +(q.n ?? 9);
  drawRoof(g, {
    t: 2,
    lit: (li, bi, gi) => li < nLit ? (li === nLit - 1 ? 1.25 : 1) : 0,
    pip: (g, cam, rig) => {
      const le = rig.S.letters[10], u = (le.x + le.w * .5) * rig.k;
      const p = rig.at(u, 0, -.8), f = cam.P(...p), s = cam.scaleAt(...p) * CH.PIP_M / CH.PIP_H;
      D.glow(g, f[0] - s * 30, f[1] - s * 70, s * 90, '#ffcf7a', .25);
      CH.drawPip(g, { x: f[0], y: f[1] - s * CH.PIP_SOLE, s, view: 'q', dir: -1, face: 'awe', ...CH.FRONT_POSES.stand, armN: [.2, .3], armF: [.25, .4], headTilt: .12 });
    },
  });
}
export function signTest(g) {
  D.ground(g, 1920, 1080, { top: '#111', bot: '#050403', vig: 0 });
  const S = B.buildSign('GRAHS', { font: 'Poiret', size: 240, spacing: 17, track: .16 });
  const s = 1700 / S.w;
  B.drawSign(g, S, 100, 200, s, { lit: (li, bi) => li % 2 ? 1 : 0 });
  S.letters.forEach(le => le.chains.forEach((c, ci) => { g.beginPath(); c.forEach(([x, y], i) => i ? g.lineTo(100 + x * s, 200 + y * s) : g.moveTo(100 + x * s, 200 + y * s)); g.strokeStyle = `hsl(${ci * 70},90%,60%)`; g.lineWidth = 2; g.stroke(); }));
}
function sheetFrame(g) {
  D.ground(g, 1920, 1080, { top: '#100d09', bot: '#060504', vig: .35 });
  D.gline(g, D.rectPts(18, 18, 1884, 1044), { w: 2 }); D.gline(g, D.rectPts(28, 28, 1864, 1024), { w: .9 });
  for (const [x, y, a] of [[28, 28, 0], [1892, 28, Math.PI / 2], [1892, 1052, Math.PI], [28, 1052, -Math.PI / 2]]) D.fan(g, x, y, 34, { a0: a, a1: a + Math.PI / 2, ribs: 4, fill: '#1d6b57', ring: .25 });
}
function swatch(g, x, y, col, name) {
  g.fillStyle = col; g.fillRect(x, y, 58, 40); D.gline(g, D.rectPts(x, y, 58, 40), { w: 1 });
  g.save(); g.font = '600 13px Josefin'; g.fillStyle = C.ivoryD; g.textAlign = 'left'; g.fillText(name, x, y + 58); g.fillText(col.toUpperCase(), x, y + 74); g.restore();
}
function silhouette(g, draw) {
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; const h = cv.getContext('2d');
  draw(h); h.globalCompositeOperation = 'source-in'; h.fillStyle = '#050403'; h.fillRect(0, 0, 1920, 1080);
  g.save(); g.shadowColor = 'rgba(243,217,139,.9)'; g.shadowBlur = 3; g.drawImage(cv, 0, 0); g.restore();
}
export function modelSheet(g) {
  sheetFrame(g);
  T.titleBar(g, 'PIP', 215, 96, { p: 1, size: 62, sub: 'BELLBOY · AGE 14', subSize: 15, sheen: .45, wings: false, pad: 40 });
  label(g, 'MODEL SHEET · MIDNIGHT AT THE STARLIGHT HOTEL · art-deco', 450, 88, 16);
  label(g, 'Erté / Cassandre / Lempicka: 7 heads · faceted lacquer planes · gold rim on the lit edge · almond or arc eyes · one-stroke nose', 450, 116, 13);
  const by = 530, s = 2.9, sole = by + 67 * s;
  D.gline(g, [[60, sole + 6], [1110, sole + 6]], { w: 1.4 });
  for (let k = 0; k <= 7; k++) { const y = sole - k * 21.1 * s; D.gline(g, [[64, y], [84, y]], { w: 1 }); g.save(); g.font = '600 12px Josefin'; g.fillStyle = C.gold1; g.fillText(k + 'H', 90, y + 4); g.restore(); }
  const views = [['front', 'FRONT', CH.FRONT_POSES.stand], ['q', '3/4', CH.FRONT_POSES.stand], ['side', 'PROFILE', CH.POSES.stand], ['back', 'BACK', CH.FRONT_POSES.stand]];
  views.forEach(([v, name, pose], i) => {
    const x = 240 + i * 245;
    CH.drawFigure(g, { x, y: by, s, view: v, face: 'neutral', ...pose, letter: 'N' });
    label(g, name, x - 30, sole + 34, 15);
  });
  label(g, 'SILHOUETTE MARKS: tilted pillbox + chin strap · V of brass buttons · the sealed letter, always in hand', 60, 190, 13);
  const ex = [['panic', 'PANIC · “Out of order?!”'], ['worry', 'WORRY · the clock'], ['determined', 'DETERMINED · the stairs'], ['calm', 'CALM · the cap catch'], ['effort', 'EFFORT · the throw'], ['awe', 'AWE · the sign lights']];
  ex.forEach(([f, name], i) => {
    const cx = 1260 + (i % 3) * 215, cy = 245 + Math.floor(i / 3) * 255;
    g.save(); g.beginPath(); g.arc(cx, cy, 90, 0, D.TAU); const gg = g.createRadialGradient(cx, cy - 30, 10, cx, cy, 90); gg.addColorStop(0, '#2a2016'); gg.addColorStop(1, '#0a0806'); g.fillStyle = gg; g.fill(); g.restore();
    D.gline(g, D.arcPts(cx, cy, 90, 0, D.TAU, 80), { w: 1.4 });
    g.save(); g.beginPath(); g.arc(cx, cy, 89, 0, D.TAU); g.clip();
    CH.drawPipHead(g, cx, cy + 16, 6.2, i % 2 ? 'front' : 'q', f, { dir: i === 4 ? -1 : 1, tilt: f === 'awe' ? -.12 : f === 'worry' ? .08 : 0 });
    g.restore();
    g.save(); g.font = '600 13px Josefin'; if ('letterSpacing' in g) g.letterSpacing = '2px'; g.fillStyle = C.gold2; g.textAlign = 'center'; g.fillText(name, cx, cy + 118); g.restore();
  });
  const py = 1000, ps = 1.55;
  label(g, 'KEY POSES · emotion is carried by the body first', 1160, 770, 14);
  const kp = [['run1', 'determined', 'SPRINT', 'side'], ['fix', 'determined', 'FIXES CAP', 'front'], ['slide', 'calm', 'SLIDE', 'side'], ['windup', 'effort', 'WIND-UP', 'side'], ['panic', 'panic', 'PANIC', 'front'], ['cheer', 'joy', 'CHEER', 'front']];
  kp.forEach(([pn, f, name, v], i) => {
    const x = 1200 + i * 128;
    const pose = v === 'front' ? CH.FRONT_POSES[pn] : CH.POSES[pn];
    CH.drawFigure(g, { x, y: py - 67 * ps - (pn === 'slide' ? -22 : 0), s: ps, view: v, face: f, ...pose, letter: ['panic', 'cheer', 'fix'].includes(pn) ? null : 'N' });
    g.save(); g.font = '600 11px Josefin'; if ('letterSpacing' in g) g.letterSpacing = '2px'; g.fillStyle = C.gold1; g.textAlign = 'center'; g.fillText(name, x, py + 30); g.restore();
  });
  label(g, 'PROP · THE LETTER', 60, 873, 13); label(g, 'gold wax seal · treble clef = it holds the song', 60, 1035, 11);
  CH.envelope(g, 200, 955, 11, -.08);
  const pal = [['#8e1b2e', 'jacket'], ['#d4485c', 'jacket lit'], ['#2b2233', 'trousers'], ['#eab88c', 'skin'], ['#a8684a', 'skin shade'], ['#0b0807', 'hair'], ['#c9a24b', 'gold'], ['#f3d98b', 'gold lit']];
  pal.forEach(([c, n], i) => swatch(g, 400 + i * 88, 895, c, n));
  label(g, 'PALETTE', 400, 873, 13);
  label(g, 'SILHOUETTE CHECK', 60, 232, 13);
  silhouette(g, h => { [['run1', 'side'], ['fix', 'front'], ['slide', 'side'], ['windup', 'side'], ['panic', 'front']].forEach(([pn, v], i) => CH.drawFigure(h, { x: 330 + i * 115, y: 262, s: .78, view: v, face: 'neutral', ...(v === 'front' ? CH.FRONT_POSES[pn] : CH.POSES[pn]), letter: 'N' })); });
}
import { stairShot } from './shots_stairs.js';
export function stairTest(g, t) { stairShot(g, t); }
import { streetShot, pullShot } from './shots_out.js';
import * as SL from './shots_lobby.js';
import * as SR from './shots_roof.js';
import * as SK from './shots_kitchen.js';
import * as SM from './shots_misc.js';
export function shotTest(g, t, q) { const m = { street: streetShot, pull: pullShot, stair: stairShot, wide: SL.lobbyWide, button: SL.lobbyButton, face: SL.lobbyFace, run: SR.roofRun, clock: SR.towerClock, throw: SR.roofThrow, fall: SR.letterFall, catch: SR.theCatch, band: SR.bandleader, signs: SR.signLights, last: SR.lastLetter, kitchen: SK.kitchenShot, title: SM.titleShot, env: SM.envelopeInsert, ball: SM.ballroomShot, dial: SM.endDial, card: SM.endCard }; m[q.shot](g, t); }
// STYLE.md §10 minimal example (the one colour): ?scene=frames.oneColour
export function oneColour(g, t) {
  g.fillStyle = D.C.black; g.fillRect(0, 0, 1920, 1080);
  D.sunburst(g, 960, 540, { rays: 72, r1: 1400, mode: 'wedges' });
  D.drawShape(g, D.starPts(960, 440, 120, .22), { color: '#D97757', halo: 1, trail: { ang: Math.PI, len: 420, n: 4 } });
  const sign = B.buildSign('LEMO', { size: 260, spacing: 20 });
  B.drawSign(g, sign, 560, 700, 1, { lit: B.litSequence(t, [0, .5, 1, 1.5], { chaseFrom: 2.5 }), color: '#D97757' });
}
