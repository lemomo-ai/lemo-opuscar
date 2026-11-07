// Character model sheet + look translation sheet + style frames
import { P, K, setCtx, part, line, dot, circ, ell, rrect, outlined } from './toon.js';
import { drawDot, drawTick } from './chars.js';
import { drawStage, TV } from './stage.js';
import { fuse, command, stamp, subtitle, lifeIcon } from './hud.js';
import { canvas } from './glpass.js';
import * as CRY from './g_crayon.js';
import * as INK from './g_ink.js';
import * as AS from './g_ascii.js';
import * as RS from './g_riso.js';
import * as PX from './g_pixel.js';
import * as BL from './g_blue.js';
import * as SWS from './g_swiss.js';
import * as BOSS from './g_boss.js';
const TAU = Math.PI * 2;

function sheetBg(g, title, sub) {
  g.fillStyle = '#f1ecff'; g.fillRect(0, 0, 1920, 1080);
  g.save(); g.strokeStyle = 'rgba(107,43,217,.08)'; g.lineWidth = 1;
  for (let x = 0; x < 1920; x += 40) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, 1080); g.stroke(); }
  for (let y = 0; y < 1080; y += 40) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(1920, y + .5); g.stroke(); }
  g.restore();
  g.fillStyle = P.deep; g.fillRect(0, 0, 1920, 64);
  outlined(g, title, 36, 46, { font: '40px Titan', align: 'left', lw: 0, fill: P.gold });
  outlined(g, sub, 1884, 44, { font: '26px Lilita', align: 'right', lw: 0, fill: '#cbb8ff' });
}
function lab(g, t, x, y, o = {}) { outlined(g, t, x, y, { font: `${o.size || 24}px Lilita`, align: o.align || 'center', lw: 0, fill: o.col || P.deep }); }
function swatch(g, x, y, col, name) { K.s = 1; part(rrect(x, y, 40, 40, 10), col, null, { lw: 4 }); lab(g, name, x + 50, y + 18, { align: 'left', size: 17 }); lab(g, col, x + 50, y + 38, { align: 'left', size: 15, col: '#6b5a99' }); }

// ───────── Model sheet: CADET DOT (top) + COACH TICK (bottom)─────────
export function modelSheet(g, t) {
  setCtx(g); K.s = 1;
  sheetBg(g, 'FIVE-SECOND ASTRONAUT · MODEL SHEET', 'home style: 7px ink outline · flat fill · one hard shadow (lower-right)');
  // panels
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(20, 80, 1880, 480); g.fillRect(20, 575, 1880, 490);
  outlined(g, 'CADET DOT', 40, 122, { font: '44px Titan', align: 'left', lw: 8, fill: P.orange });
  lab(g, 'trainee no. 05 · 2.3 heads · silhouette marks: bubble helmet, spring antenna + orange ball, "05"', 330, 118, { align: 'left', size: 22 });
  // turnaround
  const vs = [['front', 'FRONT'], ['q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']];
  vs.forEach(([v, n], i) => { drawDot(110 + i * 160, 515, 1.08, { view: v, face: 'neutral' }); lab(g, n, 110 + i * 160, 548); });
  // expressions (head close-ups)
  const fx = [['determined', 'DETERMINED'], ['ah', 'AH... AH...'], ['sneeze', 'ACHOO'], ['panic', 'PANIC'], ['proud', 'PROUD']];
  fx.forEach(([f, n], i) => {
    const x = 800 + i * 138, y = 330;
    g.save(); g.beginPath(); g.roundRect(x - 66, y - 190, 132, 176, 18); g.fillStyle = '#e6dcff'; g.fill(); g.clip();
    drawDot(x, y + 178 * 1.05 - 60, 1.05, { face: f, ant: f === 'sneeze' ? .6 : 0 }); g.restore();
    lab(g, n, x, y + 20, { size: 20 });
  });
  // key poses
  const ps = [['pump', 'PUMP!', { pose: 'pump', face: 'determined', view: 'q' }], ['bonk', 'SALUTE (fail)', { arms: { a: [-.15, .2], b: [4, -300, 1] }, face: 'panic', ant: .9 }], ['salute', 'SALUTE (final)', { pose: 'salute', face: 'proud' }]];
  ps.forEach(([k, n, o], i) => { drawDot(1535 + i * 140 - 70, 515, .88, o); });
  { const bx = 1535 + 36 * .88, by = 515 - 300 * .88; g.save(); g.strokeStyle = P.ink; g.lineWidth = 4; for (let i = 0; i < 5; i++) { const a = -2.4 + i * .35; g.beginPath(); g.moveTo(bx + Math.cos(a) * 24, by + Math.sin(a) * 24); g.lineTo(bx + Math.cos(a) * 44, by + Math.sin(a) * 44); g.stroke(); } g.restore(); }
  lab(g, 'KEY POSES', 1560, 118 + 0, { size: 24 });
  lab(g, 'pump · salute fail · salute final', 1560, 548, { size: 18 });
  // palette (Dot)
  [[P.suit, 'suit'], [P.orange, 'orange'], [P.cyan, 'collar'], [P.skin, 'skin'], [P.hair, 'hair']].forEach(([c, n], i) => swatch(g, 730 + i * 138, 390, c, n));
  lab(g, 'the face lives inside the glass; the antenna ball is her mood meter', 1075, 470, { size: 19 });
  lab(g, '(it boings on every action)', 1075, 496, { size: 19 });

  outlined(g, 'COACH TICK', 40, 618, { font: '44px Titan', align: 'left', lw: 8, fill: P.mag });
  lab(g, 'host · stopwatch head (dial = face, red second hand = pointer/nose) · slaps his own crown button to start every game', 350, 614, { align: 'left', size: 22 });
  const tv = [['front', 'FRONT'], ['q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']];
  tv.forEach(([v, n], i) => { drawTick(110 + i * 165, 1032, .78, { view: v, face: 'grin' }); lab(g, n, 110 + i * 165, 1058); });
  const te = [['grin', 'GRIN'], ['shout', 'SHOUT'], ['facepalm', 'FACEPALM'], ['serious', 'ONE LIFE LEFT']];
  te.forEach(([f, n], i) => {
    const x = 810 + i * 160, y = 836;
    g.save(); g.beginPath(); g.roundRect(x - 74, y - 196, 148, 196, 18); g.fillStyle = '#ffe0f0'; g.fill(); g.clip();
    drawTick(x, y - 92 + 330 * .6, .6, { face: f, hand: f === 'shout' ? .9 : 0, pose: f === 'facepalm' ? 'facepalm' : 'idle' }); g.restore();
    lab(g, n, x, y + 24, { size: 20 });
  });
  [[P.gold, 'case'], [P.dial, 'dial'], [P.mag, 'jacket'], [P.cyan, 'lapel'], [P.red, 'second hand']].forEach(([c, n], i) => swatch(g, 730 + i * 138, 890, c, n));
  const tp = [['slap', { pose: 'slap', face: 'grin', press: 1 }], ['shout', { pose: 'shout', face: 'shout', hand: 2.2 }], ['facepalm', { pose: 'facepalm', face: 'facepalm' }]];
  tp.forEach(([k, o], i) => drawTick(1500 + i * 150, 1032, .6, { view: 'front', ...o }));
  lab(g, 'KEY POSES', 1650, 618, { size: 24 });
  lab(g, 'crown slap = "next game" · mic shout · facepalm', 1650, 1058, { size: 18 });
}

// ───────── Look translation sheet: the same Dot drawn in 8 looks ─────────
export function styleSheet(g, t) {
  setCtx(g); K.s = 1;
  sheetBg(g, 'CADET DOT · STYLE TRANSLATION', 'keep 3 marks: round helmet · antenna ball · "05" — the rest follows each style');
  const tiles = []; const TW = 460, TH = 486;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) tiles.push([20 + c * (TW + 13), 78 + r * (TH + 10)]);
  const clip = (i, fn) => { const [x, y] = tiles[i]; g.save(); g.beginPath(); g.roundRect(x, y, TW, TH, 18); g.clip(); fn(x, y); g.restore(); };
  const name = (i, n, sub) => { const [x, y] = tiles[i]; K.s = 1; part(rrect(x + 12, y + TH - 62, TW - 24, 50, 14), P.deep, null, { lw: 0.1, stroke: false }); outlined(g, n, x + 30, y + TH - 28, { font: '28px Titan', align: 'left', lw: 0, fill: P.gold }); outlined(g, sub, x + TW - 28, y + TH - 30, { font: '19px Lilita', align: 'right', lw: 0, fill: '#d8ccff' }); };
  // 0 home (stage)
  clip(0, (x, y) => { g.fillStyle = P.deep; g.fillRect(x, y, TW, TH); g.fillStyle = '#3d168f'; for (let i = 0; i < 12; i += 2) { g.beginPath(); g.moveTo(x + TW / 2, y + 200); g.arc(x + TW / 2, y + 200, 700, i / 12 * TAU, (i + 1) / 12 * TAU); g.fill(); } drawDot(x + TW / 2, y + 400, 1.1, { face: 'proud', view: 'q' }); });
  name(0, 'HOME', 'stage · flat toon');
  // 1 crayon
  CRY.clearCrayon(0); { const [x, y] = tiles[1]; CRY.cadetCrayon(x + TW / 2, y + 408, .98, { face: 'yay' }); } const crOut = canvas()[0];
  clip(1, () => CRY.print(g)); name(1, 'CRAYON', 'G1 · PUMP!');
  // 2 ink wash
  INK.clearInk(); let ball; { const [x, y] = tiles[2]; const d = INK.cadetInk(x + TW / 2, y + 210, 118, { face: 'ah', seed: 5 }); ball = d.ball; }
  clip(2, (x, y) => { INK.print(g); INK.vermilion(g, ball[0], ball[1], ball[2] * 1.3, 2); INK.seal(g, x + TW - 60, y + 90, 60); }); name(2, 'INK WASH', "G2 · DON'T SNEEZE!");
  // 3 ASCII
  AS.clearAscii(); { const [x, y] = tiles[3]; AS.drawArt(AS.DOT_ART, (x + 70) / AS.CW, (y + 4) / AS.CH, 1.0); }
  clip(3, () => AS.print(g)); name(3, 'ASCII CRT', 'G3 · STRAP IN!');
  // 4 risograph
  RS.clearRiso(); { const [x, y] = tiles[4]; RS.shape(gg => gg.rect(x, y, TW, TH), 0, .3, 0); RS.shape(RS.C_(x + 360, y + 130, 110), 0, 0, .8); RS.withHalo(h => RS.cadetRiso(h, x + TW / 2 - 10, y + 420, 1.28), 7); }
  clip(4, () => RS.print(g)); name(4, 'RISOGRAPH', 'G4 · CATCH!');
  // 5 pixel
  clip(5, (x, y) => { PX.fill(PX.C.space); for (let i = 0; i < 60; i++) PX.pset((i * 37) % 240, (i * 53) % 90, i % 3 ? PX.C.indigo : PX.C.white); for (let i = 0; i < 240; i++) PX.pset(i, 51 + Math.round(Math.sin(i * .2)), PX.C.gray); PX.cadetPix(60, 50, 'win'); PX.present(g, x + TW / 2 - 60 * 8, y + 400 - 50 * 8, 8); }); name(5, 'PIXEL', 'G5 · DODGE!');
  // 6 blueprint
  clip(6, (x, y) => { g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, TW, TH); g.clip(); g.translate(-x, -y); BL.paper(g); g.restore(); BL.cadetBlue(g, x + TW / 2, y + 400, 1.08, { labels: false }); BL.label(g, 'CADET NO. 05 · FRONT', x + 24, y + 30, 24); }); name(6, 'BLUEPRINT', 'G6 · ZIP!');
  // 7 Swiss
  clip(7, (x, y) => { g.fillStyle = SWS.SW.page; g.fillRect(x, y, TW, TH); g.strokeStyle = SWS.SW.grid; for (let i = 0; i < 6; i++) g.strokeRect(x + 24 + i * 70 + .5, y + 20.5, 58, 390); SWS.text(g, 'salute.', x + 24, y + 96, 72, 800); SWS.cadetSwiss(g, x + 300, y + 390, 24, { arm: 1.35 }); }); name(7, 'SWISS', 'G7 · SALUTE!');
}

// ───────── Style frames ─────────
const [scr, sx] = canvas();
export function styleFrame(g, n, t) {
  setCtx(g); K.s = 1;
  if (n === 1) {   // stage + title: the TV shows the crayon pump game just cleared
    CRY.scenePump(sx, 3.3); setCtx(g);
    drawStage(g, 1.3, { lives: 3, stage: 2, title: 1, sub: true, screen: scr, tick: { pose: 'present', face: 'grin', view: 'q', hand: .5 } });
    stamp(g, true, TV.cx + 300, TV.cy + 150, 1, .9);
    subtitle(g, 'Welcome to Five-Second Camp!', 1, 3);
    return;
  }
  if (n === 2) {   // ink wash: ACHOO!
    INK.sceneSneeze(g, 2.9, { step: false }); setCtx(g);
    command(g, "DON'T SNEEZE!", 2.9);
    fuse(g, 2.9 / 4, 8, 2.9);
    return;
  }
  if (n === 3) {   // pixel: DODGE! (command word just slammed in)
    PX.DODGE_HITS; PX.sceneDodge(g, .86, { step: false });
    command(g, 'DODGE!', .4, .64);
    fuse(g, .86 / 2.571, 6, .86);
    return;
  }
  if (n === 4) {   // Boss: blueprint return capsule under an ink-wash parachute
    BOSS.descentFrame(g, 0); setCtx(g);
    command(g, 'LAND IT!', 5);
    fuse(g, .78, 32, 3, { boss: true });
    return;
  }
}
export function f1(g, t) { styleFrame(g, 1, t); }
export function f2(g, t) { styleFrame(g, 2, t); }
export function f3(g, t) { styleFrame(g, 3, t); }
export function f4(g, t) { styleFrame(g, 4, t); }
