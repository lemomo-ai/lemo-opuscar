// Sheets: model sheet, style frames, redraw sample (?scene=frames.xxx)
import { drawFigure, P0, runPose } from './engine/figure.js';
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { grey, setFrame, S as IS } from './engine/ink.js';
import { OTTO, GIRL, COP, SELLER, drawLoaf } from './chars.js';
import { pose, EXPR, loafInHands, halves, bouleInHands, bouleHalves } from './poses.js';
import { FONT_BODY, FONT_TITLE } from './engine/cards.js';

const W = 1920, H = 1080;
let RD = null, FP = null;
const rd = () => RD || (RD = new Redraw(W, H));
const fp = () => FP || (FP = new FilmPost(W, H));
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const label = (g, t, x, y, o = {}) => { g.save(); g.font = `${o.italic ? 'italic ' : ''}${o.w ?? 400} ${o.size ?? 22}px "${o.font ?? FONT_BODY}"`; g.fillStyle = o.color ?? '#2a2520'; g.textAlign = o.align ?? 'center'; if (o.spacing) g.letterSpacing = o.spacing + 'px'; g.fillText(t, x, y); g.restore(); };

export function modelSheet(g, t) {
  setFrame(0, { boil: 0 });
  const c = mk(), x = c.getContext('2d');
  x.fillStyle = grey(.93); x.fillRect(0, 0, W, H);
  // --- turnaround
  const s = 86, gy = 1000;
  x.fillStyle = grey(.84); x.fillRect(30, gy + 4, 1000, 3);
  [[0, 150], [40, 400], [90, 650], [180, 890]].forEach(([yaw, px]) => drawFigure(x, OTTO, { x: px, ground: gy, scale: s, yaw, pose: P0(), t: 0 }));
  // --- expressions (head + shoulders)
  const ex = [['deadpan', EXPR.deadpan, 8], ['proud', EXPR.proud, 30], ['alarmed', EXPR.alarm, -25], ['tender', EXPR.tender, 38]];
  ex.forEach(([n, e, yaw], i) => {
    const bx = 1060 + (i % 2) * 420, by = 40 + Math.floor(i / 2) * 250;
    x.save(); x.beginPath(); x.rect(bx, by, 400, 232); x.clip();
    x.fillStyle = grey(.9); x.fillRect(bx, by, 400, 232);
    const p = P0(); p.expr = e; if (n === 'proud') { p.nod = -.28; p.headTilt = -.05; } if (n === 'tender') { p.nod = .16; p.headTilt = .16; } if (n === 'alarmed') { p.nod = -.12; p.headTilt = -.04; }
    drawFigure(x, OTTO, { x: bx + 200, y: by + 118 + 2.98 * 158, scale: 158, yaw, pose: p, t: 0 });
    x.restore();
  });
  // --- key poses
  const ks = 39, ky = 1005;
  drawFigure(x, OTTO, { x: 1160, ground: ky, scale: ks, yaw: 20, pose: pose('lift'), t: 0, props: { between: bouleInHands() } });
  drawFigure(x, OTTO, { x: 1420, ground: ky - 6, scale: ks, yaw: 90, pose: pose('run'), t: .3 });
  drawFigure(x, OTTO, { x: 1625, ground: ky - 60, scale: ks, yaw: 70, pose: pose('hang'), t: 0 });
  x.fillStyle = grey(.35); x.fillRect(1575, ky - 60 - 7.5 * ks - 38, 120, 9);        // the rail he hangs from
  drawFigure(x, OTTO, { x: 1790, ground: ky, scale: ks, yaw: 60, pose: (() => { const k = pose('kneel'); k.aL.abd = .5; k.aR.abd = .5; return k; })(), t: 0, props: bouleHalves(.42) });
  
  // --- redraw → film tone
  const out = rd().render(c, { frame: 0 });
  const dev = fp().render(out, { frame: 2, strength: .12, sepia: .22, vignette: .35, burn: 0, scratches: 0 });
  g.drawImage(dev, 0, 0);
  // --- labels (crisp, on top)
  label(g, 'OTTO', 60, 70, { font: FONT_TITLE, w: 900, size: 54, align: 'left', color: '#1d1915' });
  label(g, 'apprentice baker · 17 · 7.5 heads · The Runaway Loaf — model sheet', 62, 104, { italic: true, size: 22, align: 'left' });
  ['front', 'three-quarter', 'profile', 'back'].forEach((n, i) => label(g, n, [150, 400, 650, 890][i], 1050, { italic: true, size: 20 }));
  ex.forEach(([n], i) => { g.fillStyle = 'rgba(236,231,221,.85)'; g.fillRect(1060 + (i % 2) * 420 + 150, 40 + Math.floor(i / 2) * 250 + 204, 100, 28); label(g, n, 1060 + (i % 2) * 420 + 200, 40 + Math.floor(i / 2) * 250 + 225, { italic: true, size: 19 }); });
  ['the lift (pride)', 'the sprint', 'hanging on', 'breaking bread'].forEach((n, i) => label(g, n, [1160, 1420, 1640, 1810][i], 1050, { italic: true, size: 18 }));
  // value palette (print densities)
  const pal = [['ink', .07], ['coat', .15], ['waistcoat', .24], ['trousers', .3], ['loaf', .48], ['skin', .8], ['shirt', .9], ['apron', .95]];
  pal.forEach(([n, v], i) => { const px = 62 + i * 112, py = 136; g.fillStyle = grey(v); g.fillRect(px, py, 100, 30); g.strokeStyle = '#2a2520'; g.lineWidth = 1; g.strokeRect(px, py, 100, 30); label(g, `${n} ${v.toFixed(2)}`, px + 50, py + 50, { size: 15 }); });
  label(g, 'values = print density · silver tone + 0.12 sepia (tender scenes 0.35)', 62, 212, { italic: true, size: 16, align: 'left' });
}

export function headsR(g, t, q) {
  setFrame(0, { boil: 0 });
  const c = mk(), x = c.getContext('2d');
  x.fillStyle = grey(.9); x.fillRect(0, 0, W, H);
  const sc = +(q.s || 240);
  const ch = q.ch === 'girl' ? GIRL : q.ch === 'cop' ? COP : q.ch === 'seller' ? SELLER : OTTO;
  const cols = [[0, EXPR.deadpan], [35, EXPR.proud], [-40, EXPR.alarm], [90, EXPR.tender], [60, EXPR.wink]];
  cols.forEach(([yaw, e], i) => {
    const bx = 30 + i * 376;
    x.save(); x.beginPath(); x.rect(bx, 20, 360, 1040); x.clip();
    const p = P0(); p.expr = e;
    drawFigure(x, ch, { x: bx + 180, y: 330 + 2.98 * sc, scale: sc, yaw, pose: p, t: 0 });
    const p2 = P0(); p2.expr = EXPR.deadpan;
    drawFigure(x, ch, { x: bx + 180, y: 820 + 2.98 * sc * .6, scale: sc * .6, yaw: -yaw, pose: p2, t: 0 });
    x.restore();
  });
  const out = q.raw ? c : rd().render(c, { frame: 0 });
  const dev = fp().render(out, { frame: 2, strength: .1, sepia: .2, vignette: .3, burn: 0, scratches: 0 });
  g.drawImage(dev, 0, 0);
}

// style frame 2 — the town chase panorama (market one-take, beat ~6.2)
import { drawMarket } from './scenes/market.js';
import { theatre, intertitle, iris } from './engine/cards.js';
const FW = 1440, FH = 1080;
let RD43 = null, FP43 = null;
export function frameMarket(g, t, q) {
  const lt = +(q.lt || 2.6);
  setFrame(lt, { boil: 1 });
  IS.sepLine = q.sep != null ? +q.sep : .5;
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, FW, FH);
  drawMarket(x, lt);
  RD43 = RD43 || new Redraw(FW, FH); FP43 = FP43 || new FilmPost(FW, FH);
  let out = c;
  if (q.raw) { const b = document.createElement('canvas'); b.width = FW; b.height = FH; const bx = b.getContext('2d'); bx.filter = `blur(${q.blur || 1.2}px)`; bx.drawImage(c, 0, 0); out = b; }
  else out = RD43.render(c, { frame: Math.round(lt * 24) });
  const dev = FP43.render(out, { frame: 37, strength: .8, sepia: .1, crank: 1.3 });
  theatre(g, W, H, { x: 240, y: 0, w: FW, h: FH }, FP43.mean);
  g.save(); g.beginPath(); g.roundRect(240, 0, FW, FH, 22); g.clip(); g.drawImage(dev, 240, 0); damage(g, 240, 0, FW, FH, 37, .8); g.restore();
}

// style frame 1 — intertitle card
export const CARDS = {
  title: { level: 1, lines: [{ text: 'The Runaway Loaf', font: 'Playfair Display SC', weight: 900, size: 112 }, { text: 'a photoplay in one reel', italic: true, size: 40, spacing: 2 }], gap: 1.35 },
  c1: { level: 1, lines: [{ text: 'The loaf', italic: true, size: 74 }, { text: 'had other plans.', italic: true, size: 74 }], gap: 1.3 },
  c2: { level: 0, shake: .35, lines: [{ text: 'STOP THAT', font: 'Playfair Display SC', weight: 900, size: 128 }, { text: 'BAKER!', font: 'Playfair Display SC', weight: 900, size: 150 }], gap: 1.12 },
  c3: { level: 2, lines: [{ text: '“Is it yours,', italic: true, size: 66 }, { text: 'mister?”', italic: true, size: 66 }], gap: 1.35 },
};
export function frameCard(g, t, q) {
  const spec = CARDS[q.card || 'c1'];
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
  intertitle(x, FW, FH, spec, +(q.ct || 1));
  FP43 = FP43 || new FilmPost(FW, FH);
  const dev = FP43.render(c, { frame: 91, strength: .6, sepia: .14, halation: 1.4 });
  theatre(g, W, H, { x: 240, y: 0, w: FW, h: FH }, FP43.mean);
  g.save(); g.beginPath(); g.roundRect(240, 0, FW, FH, 22); g.clip(); g.drawImage(dev, 240, 0); damage(g, 240, 0, FW, FH, 91, .6); g.restore();
}
// redraw sample: a real (CC0) video frame → silent-film drawing, before / after
export async function redrawSample(g, t, q) {
  const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'assets/redraw_src.jpg'; });
  RD43 = RD43 || new Redraw(FW, FH); FP43 = FP43 || new FilmPost(FW, FH);
  const out = RD43.render(img, { frame: 0, bilateral: 3, sigma: 1.25, p: 34, eps: .24, phi: 5, gamma: .88, washDark: .22, h1: .56, h2: .73, h3: .88, gap: 5 });
  const dev = FP43.render(out, { frame: 12, strength: .55, sepia: .14 });
  g.fillStyle = '#12100e'; g.fillRect(0, 0, W, H);
  const pw = 900, ph = 675, y0 = 150;
  g.drawImage(img, 40, y0, pw, ph);
  g.save(); g.beginPath(); g.roundRect(980, y0, pw, ph, 14); g.clip(); g.drawImage(dev, 980, y0, pw, ph); damage(g, 980, y0, pw, ph, 12, .55); g.restore();
  label(g, 'REDRAW MODE', W / 2, 78, { font: 'Playfair Display SC', w: 900, size: 44, color: '#ece5d5', spacing: 4 });
  label(g, 'input: a real video frame (CC0)', 40 + pw / 2, y0 + ph + 56, { italic: true, size: 26, color: '#cfc7b6' });
  label(g, 'output: ink lines (DoG) · five wash steps · boiling hatch · silver print + ageing', 980 + pw / 2, y0 + ph + 56, { italic: true, size: 26, color: '#cfc7b6' });
  label(g, 'source: "DiagonalCrosswalkYongeDundas.webm", Raysonho, CC0, Wikimedia Commons (cropped below the shop signs)', W / 2, H - 50, { size: 20, color: '#8f887a' });
  g.strokeStyle = '#cfc7b6'; g.lineWidth = 3; g.beginPath(); g.moveTo(944, y0 + ph / 2 - 18); g.lineTo(962, y0 + ph / 2); g.lineTo(944, y0 + ph / 2 + 18); g.stroke();
}

// the four intertitle designs on one sheet (style frame 1)
export function cardSheet(g, t, q) {
  g.fillStyle = '#0b0a09'; g.fillRect(0, 0, W, H);
  FP43 = FP43 || new FilmPost(FW, FH);
  const list = [['title', 'main title — Playfair Display SC'], ['c1', 'narration — Old Standard TT italic'], ['c2', 'a shout — heavy rule, the words shake'], ['c3', 'a whisper — the most ornate border']];
  list.forEach(([k, name], i) => {
    const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
    intertitle(x, FW, FH, CARDS[k], k === 'c2' ? .05 : 1);
    const dev = FP43.render(c, { frame: 91 + i * 7, strength: .6, sepia: .14, halation: 1.4 });
    const w = 672, h = 504, px = 240 + (i % 2) * (w + 36) - 30, py = 30 + Math.floor(i / 2) * (h + 36);
    g.save(); g.beginPath(); g.roundRect(px, py, w, h, 12); g.clip(); g.drawImage(dev, px, py, w, h); damage(g, px, py, w, h, 91 + i * 7, .5); g.restore();
    label(g, name, px + w / 2, py + h + 26, { italic: true, size: 18, color: '#b8b0a0' });
  });
}

// DEMO.md "Engine reference" minimal example — any shape in the silent-film manner, with "the one colour" kept through the print
import { drawShape, sparkPts, setFrame as setF } from './engine/ink.js';
export function oneColour(g, t) {
  setF(t, { boil: 1 });
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const x = c.getContext('2d');
  x.fillStyle = grey(.9); x.fillRect(0, 0, FW, FH);
  const sp = sparkPts(720, 460, 220, 260);
  drawShape(x, sp.star, { v: .6, shade: 12 });                          // tonal: the Redraw pass inks and hatches it
  drawShape(x, { pts: sp.tail, closed: false }, { line: 10 });
  const mask = document.createElement('canvas'); mask.width = FW; mask.height = FH; const m = mask.getContext('2d');
  drawShape(m, sp.star, { color: '#D97757' });                          // the colour mask: alpha = where the hue survives
  RD43 = RD43 || new Redraw(FW, FH); FP43 = FP43 || new FilmPost(FW, FH);
  const out = RD43.render(c, { frame: Math.round(t * 24) });
  const dev = FP43.render(out, { frame: Math.round(t * 24), strength: .6, sepia: .15 }, mask);
  theatre(g, W, H, { x: 240, y: 0, w: FW, h: FH }, .5);
  g.save(); g.beginPath(); g.roundRect(240, 0, FW, FH, 22); g.clip(); g.drawImage(dev, 240, 0); damage(g, 240, 0, FW, FH, Math.round(t * 24), .6); g.restore();
}
