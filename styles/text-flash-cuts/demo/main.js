// "Behind You": Text Flash Cuts (the title-card grammar of early-2000s TV anime) library demo, 46.2 s, 30 fps, 150 BPM (12 frames per beat).
// 11 generated images (character, eye, hands, letter, mouth corner) + code: architectural geometry, title cards, dialogue rails, rain, umbrella, phone, window grid, inversion, editing.
import { clamp, lerp, seg, ss, eio, eo, ei, hash, TAU } from '/core/lib.js';

const W = 1920, H = 1080, FPS = 30, BEAT = 12;
const RED = '#d4162b', BLK = '#0a0a0c', WHT = '#f2efe8', INK = '#1b1b1f', GRY = '#8d8a84', PALE = '#d8d4cc', DK = '#26262a';
const SERIF = '"SerifSC"', SANS = '"SansSC"', CORM = '"Corm"';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const OUT = document.getElementById('out'), go = OUT.getContext('2d');
const S = mk(W, H), g0 = S.getContext('2d');
const IMG = {}, TXT = [];
const fs = f => f / FPS;                                   // frames → seconds

// ───────── Timeline (single source of truth, in frames): [f0, f1, shot function, params] ─────────
const SNAP = 1092;                                          // the frame of the sharp head turn
const SH = [
  // cold open
  [0, 3, shotTunnel, { burst: 1 }],
  [3, 9, shotCard, { txt: '别', bg: RED, fg: BLK, size: 980, x: 820, y: 960 }],
  [9, 15, shotCard, { txt: '回', bg: BLK, fg: RED, size: 980, x: 120, y: 1000 }],
  [15, 21, shotCard, { txt: '头', bg: WHT, fg: BLK, size: 980, x: 560, y: 940 }],
  [21, 99, shotStairsOpen, {}],
  [99, 132, shotHerTease, {}],
  [132, 144, shotSlit, {}],
  // Episode 1, "The Letter"
  [144, 162, shotChapter, { ch: '信', num: '第一话', en: 'EPISODE 1 · THE LETTER', bg: WHT, fg: BLK, acc: RED, lay: 0 }],
  [162, 204, shotLockers, {}],
  [204, 210, shotBoyEye, {}],
  [210, 300, shotLetter, {}],
  [300, 306, shotCard, { txt: '十三', bg: BLK, fg: RED, size: 620, x: 700, y: 820 }],
  [306, 384, shotWhoWrote, {}],
  // Episode 2, "Rain"
  [384, 402, shotChapter, { ch: '雨', num: '第二话', en: 'EPISODE 2 · RAIN', bg: BLK, fg: WHT, acc: RED, lay: 1 }],
  [402, 450, shotRain, { her: 1, z0: 1, z1: 1.12 }],
  [450, 462, shotPhone, {}],
  [462, 552, shotCall, { rail: 1 }],
  [552, 558, shotCall, { gone: 1 }],
  [558, 570, shotHand, {}],
  [570, 600, shotRain, { umbrella: 1, z0: 1.05, z1: 1.2 }],
  [600, 606, shotCard, { txt: '身', bg: RED, fg: BLK, size: 980, x: 40, y: 960 }],
  [606, 612, shotRain, { z0: 1.3, z1: 1.32, inv: 1 }],
  [612, 618, shotCard, { txt: '后', bg: BLK, fg: WHT, size: 980, x: 900, y: 1000 }],
  [618, 624, shotTunnel, { red: 1, sp: 14 }],
  // Episode 3, "Windows"
  [624, 642, shotChapter, { ch: '窗', num: '第三话', en: 'EPISODE 3 · WINDOWS', bg: RED, fg: BLK, acc: WHT, lay: 2 }],
  [642, 690, shotWindowWall, {}],
  [690, 780, shotFaces, {}],
  [780, 786, shotBoyEye, { inv: 1 }],
  [786, 816, shotTunnel, { red: 1, sp: 7 }],
  // Episode 4, "The Stairs"
  [816, 834, shotChapter, { ch: '阶', num: '第四话', en: 'EPISODE 4 · THE STAIRS', bg: WHT, fg: RED, acc: BLK, lay: 3 }],
  [834, 918, shotClimb, {}],
  [918, 927, shotCard, { txt: '十', bg: WHT, fg: BLK, size: 900, x: 980, y: 900 }],
  [927, 933, shotStairs, { z0: 1.5, z1: 1.55 }],
  [933, 939, shotCard, { txt: '十一', bg: BLK, fg: WHT, size: 700, x: 80, y: 820 }],
  [939, 943, shotStairs, { z0: 1.75, z1: 1.8 }],
  [943, 947, shotCard, { txt: '十二', bg: RED, fg: BLK, size: 700, x: 560, y: 860 }],
  [947, 950, shotStairs, { z0: 2.0, z1: 2.05 }],
  [950, 953, shotStairs, { z0: 2.15, z1: 2.2, inv: 1 }],
  [953, 956, shotTunnel, { red: 1, sp: 20 }],
  [956, 959, shotStairs, { z0: 2.35, z1: 2.4 }],
  [959, 962, shotCard, { txt: '十二', bg: WHT, fg: RED, size: 700, x: 520, y: 860 }],
  [962, 966, shotTunnel, { sp: 24 }],
  [966, 1044, shotHerTop, {}],
  [1044, 1056, shotCard, { txt: '十三', bg: WHT, fg: RED, size: 760, x: 260, y: 860 }],
  // the head turn
  [1056, 1176, shotTurn, {}],
  [1176, 1200, shotEye, {}],
  [1200, 1224, shotMouth, {}],
  [1224, 1236, shotSlit, { long: 1 }],
  [1236, 1400, shotSlate, {}],
];
const DUR = 1386 / FPS; window.DUR = DUR;
// frame-level red/black swaps (independent of shots)
const FLIPS = [[21, 23], [250, 252], [558, 560], [780, 786], [SNAP + 4, SNAP + 6], [1185, 1187], [1190, 1191], [1222, 1224]];

// sound events (mix.py reads events.json); sec = section start, for aligning the score
const EV = [];
const ev = (f, type, o = {}) => EV.push({ t: fs(f), type, ...o });
ev(0, 'sec', { name: 'cold' }); ev(144, 'sec', { name: 'ch1' }); ev(384, 'sec', { name: 'ch2' }); ev(624, 'sec', { name: 'ch3' });
ev(816, 'sec', { name: 'ch4' }); ev(1044, 'sec', { name: 'silence' }); ev(SNAP, 'sec', { name: 'snap' }); ev(1236, 'sec', { name: 'slate' }); ev(1386, 'sec', { name: 'end' });
ev(0, 'rush'); ev(3, 'hit', { p: 1 }); ev(9, 'hit', { p: 1.12 }); ev(15, 'hit', { p: 1.26 }); ev(21, 'boom');
ev(99, 'cut'); ev(108, 'suck'); ev(132, 'tick'); ev(138, 'tick');
ev(144, 'chapter', { p: 1 }); ev(186, 'locker'); ev(204, 'sting'); ev(210, 'paper'); ev(250, 'blip'); ev(300, 'hit', { p: 1.4 });
ev(306, 'rail'); ev(330, 'cut'); ev(354, 'cut');
ev(378, 'rainin'); ev(384, 'chapter', { p: .9 }); ev(444, 'buzz'); ev(450, 'cut'); ev(462, 'rail');
for (let k = 1; k <= 7; k++) ev(462 + k * BEAT, 'step', { k });
ev(552, 'gap'); ev(558, 'sting', { big: 1 }); ev(570, 'umbrella'); ev(600, 'hit', { p: 1.5 }); ev(606, 'blip'); ev(612, 'hit', { p: 1.7 }); ev(618, 'rush');
ev(624, 'chapter', { p: 1.1 }); ev(642, 'cut');
for (let i = 0; i < 9; i++) ev(690 + i * 3, 'pane', { i });
ev(735, 'clack'); ev(780, 'sting'); ev(786, 'rush');
ev(816, 'chapter', { p: 1.2 }); ev(834, 'rail');
for (let k = 0; k < 7; k++) ev(834 + k * BEAT, 'climb', { k });
ev(918, 'hit', { p: 1.5 }); ev(933, 'hit', { p: 1.68 }); ev(943, 'hit', { p: 1.88 }); ev(950, 'blip'); ev(953, 'rush'); ev(959, 'hit', { p: 2.1 });
ev(966, 'rail'); ev(1044, 'boom'); ev(1062, 'tick'); ev(1080, 'tick'); ev(SNAP - 2, 'pre'); ev(SNAP + 4, 'snap');
ev(1176, 'heart'); ev(1185, 'blip'); ev(1200, 'cut'); ev(1224, 'heart'); ev(1236, 'slate');
window.EV = EV.sort((a, b) => a.t - b.t);

// ───────── Helpers ─────────
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
function jitter(t, amp, seed = 1) { const f = Math.round(t * FPS); return [(hash(f * 7.1 + seed) - .5) * 2 * amp, (hash(f * 3.3 + seed * 5) - .5) * 2 * amp]; }
function cam(g, z, cx = W / 2, cy = H / 2, dx = 0, dy = 0) { g.translate(W / 2 + dx, H / 2 + dy); g.scale(z, z); g.translate(-cx, -cy); }
// map a rect under the current transform to a screen box (the readability check needs screen coordinates)
function sbox(g, x0, y0, x1, y1) {
  const m = g.getTransform(), P = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  return { x0: Math.min(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), x1: Math.max(...P.map(p => p[0])), y1: Math.max(...P.map(p => p[1])) };
}
function text(g, s, x, y, font, col, id, align = 'left') {
  g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y);
  if (id) { const m = g.measureText(s); const x0 = align === 'left' ? x : align === 'right' ? x - m.width : x - m.width / 2; TXT.push({ id, text: s, ...sbox(g, x0, y - m.actualBoundingBoxAscent, x0 + m.width, y + m.actualBoundingBoxDescent) }); }
}
// vertical text: full stop and comma move to the top-right of the cell (vertical punctuation position)
function vtext(g, s, x, y, size, font, col, id, lead = 1.0) {
  g.font = `900 ${size}px ${font}`; g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const cs = [...s];
  cs.forEach((ch, i) => {
    const by = y + i * size * lead + size * .86;
    if ('。，、'.includes(ch)) g.fillText(ch, x + size * .55, by - size * .55); else g.fillText(ch, x, by);
  });
  if (id) TXT.push({ id, text: s, ...sbox(g, x, y, x + size, y + cs.length * size * lead) });
}
function drawImg(g, im, x, y, s, ax = .5, ay = .5) { g.drawImage(im, x - im.width * s * ax, y - im.height * s * ay, im.width * s, im.height * s); }
function cover(g, im) { const s = Math.max(W / im.width, H / im.height); drawImg(g, im, W / 2, H / 2, s); return s; }
function silOf(im, col) { const c = mk(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
const fl = lt => Math.floor(lt * FPS + 1e-6);                // frame index within the shot

// ───────── Dialogue rails: him = black rail on the left, white text; her = red rail on the right, black text. Slams in over 3 frames; counts as "on screen" only once full ─────────
function rail(g, lt, side, cn, en, id, o = {}) {
  const w = o.w || 560, k = eo(seg(lt, 0, fs(3)));
  const x0 = side < 0 ? -w * (1 - k) : W - w * k;
  const bg = side < 0 ? BLK : RED, fg = side < 0 ? WHT : BLK, enc = side < 0 ? GRY : BLK;
  g.fillStyle = bg; g.fillRect(x0, 0, w, H);
  if (side > 0) { g.fillStyle = BLK; g.fillRect(x0, 0, 10, H); } else { g.fillStyle = RED; g.fillRect(x0 + w - 10, 0, 10, H); }
  const n = [...cn].length, size = o.size || (n > 5 ? 136 : 150), th = n * size;
  const tx = x0 + w / 2 - size / 2 + (side < 0 ? 30 : -30), ty = (H - th) / 2 - 50;
  const f = fl(lt), sc = f < 2 ? 1.05 : 1, [jx, jy] = jitter(lt + (side + 3) * 10, f < 3 ? 8 : 1.2, n);
  g.save(); g.translate(tx + size / 2 + jx, ty + th / 2 + jy); g.scale(sc, sc); g.translate(-tx - size / 2, -ty - th / 2);
  vtext(g, cn, tx, ty, size, SERIF, fg, k >= 1 ? id : null);
  g.restore();
  text(g, side < 0 ? '他' : '她', side < 0 ? x0 + 36 : x0 + w - 76, 92, `900 40px ${SANS}`, side < 0 ? RED : WHT, k >= 1 ? id + 'who' : null);
  text(g, en, x0 + w / 2, H - 64, `italic 600 40px ${CORM}`, enc, k >= 1 ? id + 'en' : null, 'center');
}

// ───────── Shot: window-frame tunnel (one-point perspective, rushing forward) ─────────
function shotTunnel(g, t, lt, o) {
  const red = o.red, white = o.white;
  const bg = red ? RED : white ? WHT : BLK;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const sp = o.sp || (o.burst ? 30 : 4.2), N = 16, ph = (lt * sp) % 1;
  g.save(); g.translate(o.cx || W / 2, H / 2);
  for (let i = N; i >= 0; i--) {
    const z = i + 1 - ph, k = 1 / (z * .32 + .08); if (z <= .05) continue;
    const z2 = z + 1, k2 = 1 / (z2 * .32 + .08);
    const hw = 160 * k, hh = 90 * k, hw2 = 160 * k2, hh2 = 90 * k2, idx = N - i;
    for (const sgn of [-1, 1]) {
      const on = (idx + (sgn > 0 ? 1 : 0)) % 2 === 0;
      g.fillStyle = red ? (on ? BLK : WHT) : white ? (on ? BLK : PALE) : (on ? RED : WHT);
      const a = .18, b = .82, X = u => sgn * lerp(hw, hw2, u), Y = u => lerp(hh, hh2, u);
      poly(g, [[X(a), -Y(a) * .55], [X(b), -Y(b) * .55], [X(b), Y(b) * .7], [X(a), Y(a) * .7]]); g.fill();
    }
    g.strokeStyle = red || white ? BLK : RED; g.lineWidth = Math.max(1, 5 * k); g.strokeRect(-hw, -hh, hw * 2, hh * 2);
  }
  g.strokeStyle = red || white ? BLK : RED; g.lineWidth = 2;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(sx * 30, sy * 17); g.lineTo(sx * 2400, sy * 1350); g.stroke(); }
  if (o.fig) drawImg(g, IMG.boyFsil, 0, 40, .07, .5, .5);
  g.restore();
  if (o.burst) { const f = fl(lt); g.fillStyle = WHT; g.fillRect(0, H / 2 - 2 - f * 60, W, 4 + f * 120); }
}

// ───────── Shot: full-screen text card (for flash cuts, not in the readability check) ─────────
function shotCard(g, t, lt, o) {
  const f = fl(lt), inv = o.inv;
  g.fillStyle = inv ? o.fg : o.bg; g.fillRect(0, 0, W, H);
  const sc = f === 0 ? 1.08 : f === 1 ? 1.02 : 1, [jx, jy] = jitter(t, f < 2 ? 14 : 3, o.size);
  g.save(); g.translate(o.x + jx, o.y + jy); g.scale(sc, sc);
  text(g, o.txt, 0, 0, `900 ${o.size}px ${SERIF}`, inv ? o.bg : o.fg, null);
  g.restore();
  if (o.rule) { g.fillStyle = inv ? o.bg : o.fg; g.fillRect(0, o.y + 70, W * .78 * eo(seg(lt, 0, .1)), 14); }
}

// ───────── Shot: chapter title card (four layouts, one per episode) ─────────
function shotChapter(g, t, lt, o) {
  const f = fl(lt);
  g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
  const sc = f === 0 ? 1.1 : f === 1 ? 1.03 : 1 + lt * .04, [jx, jy] = jitter(t, f < 2 ? 12 : 1.5, 3);
  const L = [[260, 900, 1180, 160, 1270, 580], [1000, 930, 380, 150, 470, 560], [140, 900, 1100, 160, 1190, 580], [900, 900, 300, 150, 390, 560]][o.lay];
  const [cx, cy, nx, ny, ex, ey] = L;
  // a colour bar cuts in from the side
  g.fillStyle = o.acc; const bw = W * eo(seg(lt, 0, fs(5)));
  if (o.lay % 2 === 0) g.fillRect(0, 960, bw, 26); else g.fillRect(W - bw, 120, bw, 26);
  g.save(); g.translate(cx + jx, cy + jy); g.scale(sc, sc); text(g, o.ch, 0, 0, `900 820px ${SERIF}`, o.fg, null); g.restore();
  g.save(); g.translate(nx, ny); vtext(g, o.num, 0, 0, 64, SANS, o.acc, null); g.restore();
  text(g, o.en, ex, ey, `italic 600 40px ${CORM}`, o.bg === BLK ? GRY : o.fg === RED ? GRY : o.fg, null);
}

// ───────── Giant geometric staircase (one-point perspective, extreme symmetry); she stands in the white door at the top (back silhouette) ─────────
function stairsAt(g, lt, z, o = {}) {
  g.fillStyle = WHT; g.fillRect(0, 0, W, H);
  g.save(); cam(g, z, 960, lerp(520, 300, seg(z, 1, 2.6)), o.dx || 0, o.dy || 0);
  const VY = 330, K = 34, r = .87;
  g.fillStyle = BLK; g.fillRect(-1600, -1600, W + 3200, H + 3200);
  const wx = p => 1180 * p + 70, wt = p => VY - 640 * p - 40, wb = p => VY + 380 * p;
  for (let k = 0; k < K - 4; k++) {
    const pa = Math.pow(r, k), pb = Math.pow(r, k + .7);
    const wave = ((lt * 14 - k) % 18 + 18) % 18 < 1.5;
    g.fillStyle = wave ? RED : (k % 3) !== 1 ? WHT : DK;
    for (const s of [-1, 1]) { poly(g, [[960 + s * wx(pa), wt(pa)], [960 + s * wx(pb), wt(pb)], [960 + s * wx(pb), wb(pb)], [960 + s * wx(pa), wb(pa)]]); g.fill(); }
  }
  g.fillStyle = WHT; g.fillRect(960 - 90, VY - 260, 180, 300);
  for (let k = K; k >= 0; k--) {
    const p = Math.pow(r, k), p2 = Math.pow(r, k + 1);
    const y = VY + 760 * p, y2 = VY + 760 * p2, rh = (y - y2) * .42, hw = 1180 * p + 70, hw2 = 1180 * p2 + 70;
    const climb = ((lt * 22 - k) % 30 + 30) % 30 < 1.2;
    g.fillStyle = climb ? RED : BLK; poly(g, [[960 - hw, y], [960 + hw, y], [960 + hw, y - rh], [960 - hw, y - rh]]); g.fill();
    g.fillStyle = WHT; poly(g, [[960 - hw, y - rh], [960 + hw, y - rh], [960 + hw2, y2], [960 - hw2, y2]]); g.fill();
  }
  g.strokeStyle = RED; g.lineWidth = 10;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(960 + s * 1300, 1180); g.lineTo(960 + s * 80, VY - 40); g.stroke(); }
  drawImg(g, IMG.herBackSil, 960, VY + 4, 132 / 1640, .5, 1);      // her: a small back view in the doorway
  g.restore();
}
function shotStairs(g, t, lt, o) { stairsAt(g, lt, lerp(o.z0, o.z1, eo(lt / .3))); }

// cold open: fast push up the stairs + red vertical band on the left, "Don't look back."
function shotStairsOpen(g, t, lt) {
  stairsAt(g, lt, 1 + eo(lt / 2.5) * .3, { dx: 140 });
  const k = eo(seg(lt, 0, fs(3)));
  g.fillStyle = RED; g.fillRect(150, -H + k * H, 380, H);
  g.fillStyle = BLK; g.fillRect(150, 0, 380, 10 * k);
  const f = fl(lt), [jx, jy] = jitter(t, f < 3 ? 10 : 1, 4);
  g.save(); g.translate(jx, jy);
  vtext(g, '别回头。', 262, 190, 170, SERIF, BLK, k >= 1 ? 'open' : null);
  g.restore();
  text(g, 'Don’t look back.', 340, 1010, `italic 600 42px ${CORM}`, BLK, k >= 1 ? 'openEN' : null, 'center');
}

// cold open: her back (in colour) against the right edge, head starting to turn; cut away before the face shows
const HB = { pivot: [460, 292], head: [[300, 0], [660, 0], [660, 282], [560, 286], [470, 296], [380, 286], [280, 282]] };
function shotHerTease(g, t, lt) {
  g.fillStyle = WHT; g.fillRect(0, 0, W, H);
  const band = eo(seg(lt, 0, .15));
  g.fillStyle = RED; g.fillRect(1010, -H + band * H, 210, H);
  g.fillStyle = BLK; g.fillRect(0, 1040, W * eo(seg(lt, .05, .6)), 6);
  const z = 1 + lt * .05, s = 1.18;
  g.save(); cam(g, z, 960, 540);
  const x = 1640, y = -10, rot = -.16 * ei(seg(lt, .55, 1.2));
  const ox = x - 470 * s, oy = y;                            // top-left of the image
  g.save(); g.translate(ox, oy); g.scale(s, s);
  g.drawImage(IMG.herBackBody, 0, 0);
  g.translate(HB.pivot[0], HB.pivot[1]); g.rotate(rot); g.translate(-HB.pivot[0], -HB.pivot[1]);
  g.drawImage(IMG.herBackHead, 0, 0);
  g.restore(); g.restore();
  g.save(); g.translate(120, 120); vtext(g, '零', 0, 0, 52, SANS, RED, null); g.restore();
}

// a thin red slit (the transition, not a fade to black)
function shotSlit(g, t, lt, o) {
  g.fillStyle = BLK; g.fillRect(0, 0, W, H);
  const k = eo(lt / (o.long ? .4 : .3));
  g.fillStyle = RED; g.fillRect(W / 2 - W / 2 * k, H / 2 - 3, W * k, 6);
  if (!o.long && fl(lt) >= 6) { g.fillRect(W / 2 - 3, H / 2 - 200 * k, 6, 400 * k); }
}

// ───────── Episode 1: wall of shoe lockers, a red door springs open ─────────
function shotLockers(g, t, lt) {
  g.fillStyle = WHT; g.fillRect(0, 0, W, H);
  const C = 11, R = 4, dw = 172, dh = 240, gap = 14, X0 = (W - C * (dw + gap)) / 2, Y0 = 40;
  const tc = 7, tr = 1, tx = X0 + tc * (dw + gap) + dw / 2, ty = Y0 + tr * (dh + gap) + dh / 2;
  const z = 1 + eio(seg(lt, 0, 1.3)) * .85;
  g.save(); cam(g, z, lerp(960, tx, eio(seg(lt, 0, 1.2))), lerp(540, ty, eio(seg(lt, 0, 1.2))));
  g.fillStyle = BLK; g.fillRect(X0 - 30, Y0 - 30, C * (dw + gap) + 46, R * (dh + gap) + 46);
  const open = seg(lt, .75, .75 + fs(4)), ang = open >= 1 ? 1.25 + Math.sin((lt - .88) * 30) * .06 * Math.exp(-(lt - .88) * 8) : ei(open) * 1.25;
  for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) {
    const x = X0 + i * (dw + gap), y = Y0 + j * (dh + gap), tgt = i === tc && j === tr;
    if (tgt) {
      g.fillStyle = BLK; g.fillRect(x, y, dw, dh);
      // inside the locker: white letter + red dot
      g.save(); g.translate(x + dw / 2, y + dh * .62); g.rotate(-.08); g.fillStyle = WHT; g.fillRect(-60, -40, 120, 80); g.fillStyle = RED; g.fillRect(-10, -8, 20, 16); g.restore();
      const cw = dw * Math.cos(ang), bulge = 24 * Math.sin(ang);
      g.fillStyle = RED; poly(g, [[x, y], [x + cw, y - bulge], [x + cw, y + dh + bulge], [x, y + dh]]); g.fill();
      g.fillStyle = BLK; for (let v = 0; v < 3; v++) poly(g, [[x + cw * .2, y + 26 + v * 16], [x + cw * .8, y + 26 + v * 16 - bulge * .6], [x + cw * .8, y + 32 + v * 16 - bulge * .6], [x + cw * .2, y + 32 + v * 16]]), g.fill();
    } else {
      const lit = hash(i * 13.1 + j * 7.7) < .08 && Math.floor(lt * 10) % 3 === (i + j) % 3;
      g.fillStyle = lit ? DK : PALE; g.fillRect(x, y, dw, dh);
      g.fillStyle = BLK; for (let v = 0; v < 3; v++) g.fillRect(x + dw * .2, y + 26 + v * 16, dw * .6, 6);
      g.fillRect(x + dw - 30, y + dh / 2 - 20, 8, 40);
      text(g, String(i + j * C + 1).padStart(2, '0'), x + 14, y + dh - 16, `900 22px ${SANS}`, GRY, null);
    }
  }
  g.restore();
}

// his eyes (insert frames)
function shotBoyEye(g, t, lt, o) {
  const [jx, jy] = jitter(t, 12, 8), z = 1.12 + lt * .4;
  g.save(); cam(g, z, 960 + 40, 420, jx, jy); cover(g, IMG.boyEye); g.restore();
}

// ───────── Both hands holding the letter: the line is on the paper ─────────
function shotLetter(g, t, lt) {
  const k = W / IMG.letter.width;
  const z = 1 + eo(lt / 3) * .16, [jx, jy] = jitter(t, 1.6, 2);
  g.fillStyle = BLK; g.fillRect(0, 0, W, H);
  g.save(); cam(g, z, 957, 520, jx, jy); g.translate(960, 540); g.rotate(Math.sin(lt * 9) * .004); g.translate(-960, -540);
  g.drawImage(IMG.letter, 0, 0, W, IMG.letter.height * k);
  const f = fl(lt), sc = f < 2 ? 1.06 : 1;
  g.save(); g.translate(957, 470); g.scale(sc, sc); g.translate(-957, -470);
  vtext(g, '第十三级台阶。', 912, 175, 92, SERIF, BLK, 'letter');
  g.restore();
  text(g, 'The thirteenth step.', 957, 872, `italic 600 34px ${CORM}`, GRY, 'letterEN', 'center');
  // a red light sweeps across the paper
  const sw = ((lt - .4) / 1.2) % 1;
  if (lt > .4) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = RED; g.globalAlpha = .55; const sx = lerp(400, 1600, sw); poly(g, [[sx, 0], [sx + 90, 0], [sx - 210, H], [sx - 300, H]]); g.fill(); g.restore(); }
  g.restore();
}

// ───────── "Who wrote this?": black rail on the left + three quick cuts on the right ─────────
function shotWhoWrote(g, t, lt) {
  const f = fl(lt);
  if (f < 24) {                                         // him: medium shot, looking around
    g.fillStyle = WHT; g.fillRect(0, 0, W, H);
    g.fillStyle = RED; g.fillRect(1500 - f * 6, 0, 120, H);
    const s = .9, [jx] = jitter(t, f < 3 ? 10 : 0, 6);
    drawImg(g, IMG.boyF, 1260 - f * 3 + jx, 600, s);
  } else if (f < 48) {                                  // one-point corridor, a small silhouette at the far end
    shotTunnel(g, t, lt - fs(24), { white: 1, sp: 1.2, cx: 1240, fig: 1 });
  } else {                                              // extreme close-up of the eyes
    g.fillStyle = BLK; g.fillRect(0, 0, W, H);
    const z = 3.5 + (lt - 1.6) * .3, [jx, jy] = jitter(t, f < 51 ? 9 : 1, 7);
    g.save(); g.translate(1240 + jx, 500 + jy); g.scale(z, z); g.translate(-790, -262); g.drawImage(IMG.boyF, 0, 0); g.restore();
    g.fillStyle = RED; g.fillRect(560, 840, W, 18);
  }
  rail(g, lt, -1, '谁写的？', 'Who wrote this?', 'who');
}

// ───────── Episode 2: long street on a rainy night (one-point perspective), a red umbrella far off ─────────
function rainLines(g, t, n, col, a = .55, len = 90) {
  const f = Math.round(t * FPS);
  g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = 2.5; g.beginPath();
  for (let i = 0; i < n; i++) {
    const x = hash(i * 1.37 + f * .71) * (W + 400) - 200, y = hash(i * 2.11 + f * 1.13) * (H + 200) - 100, l = len * (.5 + hash(i * 3.3));
    g.moveTo(x, y); g.lineTo(x - l * .28, y + l);
  }
  g.stroke(); g.globalAlpha = 1;
}
function street(g, lt, o = {}) {
  const HY = 470, cx = o.cx || 960;
  g.fillStyle = BLK; g.fillRect(-400, -400, W + 800, H + 800);
  g.fillStyle = INK; poly(g, [[cx - 40, HY], [cx + 40, HY], [cx + 2400, H + 400], [cx - 2400, H + 400]]); g.fill();
  // reflections on the road: vertical strips, jittering over time
  for (let i = -6; i <= 6; i++) {
    const xx = cx + i * 18, w = 6 + Math.abs(i) * 1.5;
    g.fillStyle = i % 3 === 0 ? RED : DK; g.globalAlpha = .7;
    g.fillRect(xx + Math.sin(lt * 9 + i) * 3 + i * 40, HY + 40, w, H);
  }
  g.globalAlpha = 1;
  // street lamps: two rows, scaled by depth
  for (let k = 10; k >= 0; k--) {
    const p = Math.pow(.72, k), x = 820 * p + 30, top = HY - 560 * p, base = HY + 420 * p;
    const flick = k === 3 && Math.floor(lt * 7.5) % 4 === 1;
    for (const s of [-1, 1]) {
      g.fillStyle = PALE; g.fillRect(cx + s * x - 4 * p, top, 9 * p + 1, base - top);
      g.fillStyle = flick ? DK : WHT; g.fillRect(cx + s * x - (s > 0 ? 70 : 0) * p - 10 * p, top - 14 * p, 90 * p, 18 * p);
      if (!flick) { g.fillStyle = DK; g.globalAlpha = .9; poly(g, [[cx + s * x - 60 * p, base], [cx + s * x + 60 * p, base], [cx + s * x + 140 * p, base + 40 * p], [cx + s * x - 140 * p, base + 40 * p]]); g.fill(); g.globalAlpha = 1; }
    }
  }
  g.fillStyle = RED; g.fillRect(cx - 1, HY - 2, 2, 4);
}
function fallenUmbrella(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.scale(s, s * .42);
  g.fillStyle = RED; g.beginPath();
  for (let i = 0; i <= 16; i++) { const a = rot + i / 16 * TAU, r = i % 2 ? 180 : 200; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.fill(); g.strokeStyle = BLK; g.lineWidth = 6;
  for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 200, Math.sin(a) * 200); g.stroke(); }
  g.restore();
  g.strokeStyle = BLK; g.lineWidth = 10 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 240 * s * Math.cos(rot * .3 + .5), y + 60 * s); g.stroke();
}
function shotRain(g, t, lt, o) {
  const z = lerp(o.z0, o.z1, eo(lt / 1.8));
  g.save(); cam(g, z, 960, 480);
  street(g, lt);
  if (o.her) drawImg(g, IMG.herUmb, 960, 540, 190 / 1640, .5, 1);
  if (o.umbrella) fallenUmbrella(g, 960, 820, 1.35, lt * .8 + .3);
  g.restore();
  rainLines(g, t, 260, WHT, .5);
  if (o.inv) flipRB();
}

// phone "Unknown caller": slams in, vibrates
function shotPhone(g, t, lt) {
  g.fillStyle = RED; g.fillRect(0, 0, W, H);
  const f = fl(lt), [jx, jy] = jitter(t, 12, 3);
  for (let i = 0; i < 3; i++) { g.strokeStyle = BLK; g.lineWidth = 8; const r = 300 + ((f * 30 + i * 90) % 270); g.beginPath(); g.arc(1100, 540, r, -.6, .6); g.stroke(); g.beginPath(); g.arc(820, 540, r, Math.PI - .6, Math.PI + .6); g.stroke(); }
  g.save(); g.translate(960 + jx, 540 + jy); g.rotate(-.12); g.scale(f === 0 ? 1.1 : 1, f === 0 ? 1.1 : 1);
  g.fillStyle = BLK; g.beginPath(); g.roundRect(-210, -420, 420, 840, 46); g.fill();
  g.fillStyle = WHT; g.fillRect(-180, -360, 360, 700);
  vtext(g, '未知来电', -60, -300, 120, SERIF, RED, null);
  text(g, 'UNKNOWN CALLER', 0, 300, `italic 600 34px ${CORM}`, BLK, null, 'center');
  g.restore();
}

// split-screen call: him on the left with the phone, her a step closer on the street behind him each beat; her line on the red rail on the right
function shotCall(g, t, lt, o) {
  const f = fl(lt), L = 1360;
  g.save(); g.beginPath(); g.rect(0, 0, o.gone ? W : L, H); g.clip();
  g.save(); g.translate(-120, 0); street(g, lt + 2, { cx: 1000 }); g.restore();
  if (!o.gone) {
    const k = Math.min(7, Math.floor(f / BEAT)), hgt = 160 * Math.pow(1.38, k), fx = 880 + k * 34, fy = Math.max(520 + k * 62, 300 + .78 * hgt);
    drawImg(g, IMG.herUmb, fx, fy, hgt / 1640, .5, 1);
  }
  rainLines(g, t, 180, WHT, .45);
  const br = 1 + Math.sin(lt * 5) * .006, [jx, jy] = jitter(t, 1.2, 9);
  g.save(); g.translate(470 + jx, 560 + jy); g.scale(.98 * br, .98 * br); g.translate(-627, -627); g.drawImage(IMG.boyP, 0, 0);
  // water drops sliding down his hair
  g.fillStyle = WHT; for (let i = 0; i < 6; i++) { const yy = 300 + ((lt * 260 + i * 140) % 520); g.fillRect(380 + i * 70, yy, 6, 18); }
  g.restore();
  g.restore();
  if (o.rail) rail(g, lt, 1, '我在你身后。', 'I’m right behind you.', 'behind');
}

// a hand lands on his shoulder
function shotHand(g, t, lt) {
  g.fillStyle = RED; g.fillRect(0, 0, W, H);
  const f = fl(lt), s = (f === 0 ? 1.12 : f === 1 ? 1.04 : 1) * 1.6, [jx, jy] = jitter(t, f < 2 ? 14 : 2, 5);
  g.fillStyle = BLK; g.fillRect(0, 760, W, 14);
  drawImg(g, IMG.herHand, 960 + jx, 560 + jy, s * W / IMG.herHand.width / 1.6);
}

// ───────── Episode 3: the classroom window wall pans sideways, panes going dark one by one ─────────
function shotWindowWall(g, t, lt) {
  g.fillStyle = WHT; g.fillRect(0, 0, W, H);
  const dx = -lt * 260, C = 14, R = 3, cw = 230, ch = 270, X0 = 60 + dx, Y0 = 70;
  const n = lt * 16;                                     // number of panes already dark
  for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) {
    const x = X0 + i * cw, y = Y0 + j * ch, id = i * R + j, off = hash(id * 5.1) * 42 < n, her = i === 6 && j === 1;
    g.fillStyle = BLK; g.fillRect(x + 8, y + 8, cw - 16, ch - 16);
    g.fillStyle = her ? RED : off ? INK : PALE; g.fillRect(x + 22, y + 22, cw - 44, ch - 44);
    if (her) { g.save(); g.beginPath(); g.rect(x + 22, y + 22, cw - 44, ch - 44); g.clip(); drawImg(g, IMG.herFsil, x + cw / 2, y + ch + 10, .22, .5, 1); g.restore(); }
    g.fillStyle = BLK; g.fillRect(x + cw / 2 - 5, y + 22, 10, ch - 44); g.fillRect(x + 22, y + ch / 2 - 5, cw - 44, 10);
  }
  g.fillStyle = RED; g.fillRect(0, Y0 + R * ch + 24, W, 12);
  drawImg(g, IMG.boyFsil, 300 - lt * 40, H + 40, .42, .5, 1);       // him: small silhouette in the foreground, watching the window wall
}

// 3×3 panes, one of her in each; they appear one by one, then all nine heads tilt together
const HF = { face: [625, 470], eyeL: [510, 420], eyeR: [735, 420], mouth: [612, 548], neck: [625, 700] };
function shotFaces(g, t, lt) {
  const f = fl(lt);
  g.fillStyle = BLK; g.fillRect(0, 0, W, H);
  const PW = 430, PH = 330, X0 = 40, Y0 = 40;
  const V = [ // [centre, scale, flip, silhouette]
    [HF.face, .62, 0, 0], [HF.eyeR, 1.7, 0, 0], [HF.mouth, 1.5, 0, 0],
    [HF.face, .62, 1, 0], [HF.face, .45, 0, 1], [HF.eyeL, 1.7, 0, 0],
    [HF.face, .62, 0, 2], [HF.eyeL, 2.4, 0, 0], [HF.face, .62, 0, 0]];
  for (let i = 0; i < 9; i++) {
    if (f < i * 3) continue;
    const c = i % 3, r = Math.floor(i / 3), x = X0 + c * (PW + 10), y = Y0 + r * (PH + 10);
    const [ctr, s, flip, sil] = V[i];
    const pf = f - i * 3, sc = pf === 0 ? 1.12 : pf === 1 ? 1.03 : 1;
    const td = f - 45 - i, tilt = td < 0 ? 0 : -.34 * (1 - Math.exp(-td * .5) * Math.cos(td * .7));
    g.save(); g.beginPath(); g.rect(x, y, PW, PH); g.clip();
    g.fillStyle = sil === 1 ? RED : sil === 2 ? WHT : (i % 2 ? PALE : WHT); g.fillRect(x, y, PW, PH);
    g.translate(x + PW / 2, y + PH / 2); g.scale(sc, sc);
    if (flip) g.rotate(Math.PI);
    g.translate(0, PH * .6); g.rotate(tilt); g.translate(0, -PH * .6);
    g.scale(s, s); g.translate(-ctr[0], -ctr[1]);
    g.drawImage(sil === 1 ? IMG.herFsil : IMG.herF, 0, 0);
    g.restore();
    g.strokeStyle = WHT; g.lineWidth = 10; g.strokeRect(x, y, PW, PH);
  }
  // one pane flips to red on the beat
  if (f >= 54 && Math.floor((f - 54) / 6) % 2 === 0) {
    const i = Math.floor((f - 54) / 12) % 9, c = i % 3, r = Math.floor(i / 3);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = RED; g.fillRect(X0 + c * (PW + 10), Y0 + r * (PH + 10), PW, PH); g.restore();
  }
  rail(g, lt - fs(3), 1, '你没有回头。', 'You never looked back.', 'never', { w: 560 });
}

// ───────── Episode 4: stairs, the camera jumps up one step per beat, his silhouette climbing in the foreground ─────────
function shotClimb(g, t, lt) {
  const f = fl(lt), b = Math.floor(f / BEAT), fr = (f % BEAT) / BEAT;
  const z = 1.0 + .08 * (b + eo(seg(fr, 0, .3)));
  stairsAt(g, lt, z, { dx: 280 });
  const bob = Math.sin(fr * Math.PI) * -26;
  drawImg(g, IMG.boyFsil, 1420, H + 330 + bob, .72, .5, 1);
  rail(g, lt, -1, '你到底是谁？', 'Who are you?', 'whoareyou');
  text(g, String(b + 4).padStart(2, '0'), 1840, 120, `900 46px ${SANS}`, RED, null, 'right');
}

// low angle: she stands at the top with her back turned, white light in the door; red rail on the right, "One more step."
function shotHerTop(g, t, lt) {
  const f = fl(lt), L = 1360, b = Math.floor(f / BEAT);
  g.save(); g.beginPath(); g.rect(0, 0, L, H); g.clip();
  const z = 1 + lt * .03, dy = lt * 14;
  g.save(); cam(g, z, 680, 540, 0, dy);
  g.fillStyle = BLK; g.fillRect(-200, -200, L + 400, H + 400);
  g.fillStyle = b % 2 ? WHT : PALE; g.fillRect(250, -60, 780, 860);          // the light in the door, brighter and darker on each beat
  // stair nosings (looking up, converging upward)
  for (let k = 0; k < 9; k++) {
    const y = 1080 - k * k * 6 - k * 40, w = 1500 - k * 70, lit = (b + 9 - k) % 9 === 0;
    g.fillStyle = lit ? RED : k % 2 ? WHT : PALE; g.fillRect(680 - w / 2, y, w, 14 - k);
  }
  g.fillStyle = RED; g.fillRect(150, 0, 12, H); g.fillRect(1198, 0, 12, H);
  // her: back view in colour, hair swaying slightly
  const s = .85, ox = 640 - 470 * s, oy = 20;
  g.save(); g.translate(ox, oy); g.scale(s, s); g.drawImage(IMG.herBackBody, 0, 0);
  g.translate(HB.pivot[0], HB.pivot[1]); g.rotate(Math.sin(lt * 2.2) * .02); g.translate(-HB.pivot[0], -HB.pivot[1]); g.drawImage(IMG.herBackHead, 0, 0); g.restore();
  g.restore(); g.restore();
  rail(g, lt, 1, '再上一级。', 'One more step.', 'onemore');
}

// ───────── The head turn: the signature head tilt (char_lookback character image, head and body on separate layers) ─────────
const PIVOT = [418, 422];
const HEADPOLY = [[0, 0], [813, 0], [813, 592], [588, 592], [508, 462], [468, 437], [368, 410], [288, 407], [0, 407]];
const COLLAR = [[268, 412], [330, 402], [488, 452], [568, 502], [608, 562], [598, 610], [218, 610], [218, 500]];
const BACK_ROT = -0.62;
function layers(img, col, poly0 = HEADPOLY, collar = COLLAR) {
  const w = img.width, h = img.height;
  const head = mk(w, h), hg = head.getContext('2d');
  poly(hg, poly0); hg.clip(); hg.drawImage(img, 0, 0);
  const body = mk(w, h), bg = body.getContext('2d');
  bg.drawImage(img, 0, 0); bg.globalCompositeOperation = 'destination-out'; poly(bg, poly0); bg.fill();
  if (collar) { bg.globalCompositeOperation = 'destination-over'; bg.fillStyle = '#0d0d10'; poly(bg, collar); bg.fill(); }
  const out = { head, body };
  if (col) for (const k of ['head', 'body']) { const c = out[k], x = c.getContext('2d'); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, w, h); }
  return out;
}
function drawChar(g, x, y, s, rot, sil) {
  const L = sil ? IMG.sil : IMG.col;
  g.save(); g.translate(x, y); g.scale(s, s); g.translate(-PIVOT[0], -PIVOT[1]);
  g.drawImage(L.body, 0, 0);
  g.translate(PIVOT[0], PIVOT[1]); g.rotate(rot); g.translate(-PIVOT[0], -PIVOT[1]);
  g.drawImage(L.head, 0, 0); g.restore();
}
function headSmear(g, x, y, s, r0, r1, n = 3) {
  for (let i = 1; i <= n; i++) {
    const r = lerp(r0, r1, i / (n + 1));
    g.save(); g.globalAlpha = .28; g.translate(x, y); g.scale(s, s); g.rotate(r); g.translate(-PIVOT[0], -PIVOT[1]); g.drawImage(IMG.sil.head, 0, 0); g.restore();
  }
}
function shotTurn(g, t, lt) {
  const ts = t - fs(SNAP);
  g.fillStyle = WHT; g.fillRect(0, 0, W, H);
  const band = eo(seg(lt, 0, .18));
  g.fillStyle = RED; g.fillRect(800, -H + band * H, 700, H);
  g.fillStyle = BLK;
  const st = ss(seg(lt, .05, .6));
  g.beginPath(); g.moveTo(0, H);
  for (let k = 0; k < 9; k++) { const x = k * 76, y = H - (k + 1) * 110 * st; g.lineTo(x, y); g.lineTo(x + 76, y); }
  g.lineTo(684, H); g.closePath(); g.fill();
  g.fillStyle = RED; g.fillRect(0, 1036, 684 * st, 14);
  let rot;
  if (ts < -.06) rot = BACK_ROT + Math.sin(lt * 3) * .015;
  else if (ts < 0) rot = BACK_ROT - .06 * seg(ts, -.06, 0);
  else if (ts < .12) rot = lerp(BACK_ROT - .06, .1, ei(ts / .12) * .6 + ts / .12 * .4);
  else rot = .1 * Math.exp(-(ts - .12) * 9) * Math.cos((ts - .12) * 26);
  const colored = ts >= .12;
  const z = 1 + (colored ? eio(seg(ts, .12, 1.4)) * .1 : lt * .025);
  const [jx, jy] = ts > .12 && ts < .3 ? jitter(t, 12, 5) : [0, 0];
  g.save(); cam(g, z, 1190, 300, jx, jy);
  const X = 1180, Y = 432, Sc = 1.02;
  if (!colored) { if (ts >= 0) headSmear(g, X, Y, Sc, BACK_ROT, rot, 3); drawChar(g, X, Y, Sc, rot, 1); }
  else {
    drawChar(g, X, Y, Sc, rot, 0);
    const gl = seg(ts, .45, .75);
    if (gl > 0 && gl < 1) {
      const ex = X + (478 - PIVOT[0]) * Sc, ey = Y + (240 - PIVOT[1]) * Sc, rr = Math.sin(gl * Math.PI) * 70;
      g.fillStyle = WHT; poly(g, [[ex - rr, ey], [ex, ey - rr * .12], [ex + rr, ey], [ex, ey + rr * .12]]); g.fill();
      poly(g, [[ex, ey - rr * .6], [ex + rr * .08, ey], [ex, ey + rr * .6], [ex - rr * .08, ey]]); g.fill();
    }
  }
  g.restore();
  if (ts >= fs(4)) rail(g, ts - fs(4), 1, '轮到你了。', 'Your turn.', 'yourturn', { w: 300, size: 118 });
}

// red-eye close-up: the pupil jolts, his small silhouette reflected in the iris
function shotEye(g, t, lt) {
  const im = IMG.eye, k = W / im.width, cx = 860 * k, cy = 440 * k;
  const z = 1 + eo(lt / .8) * .22, [jx, jy] = jitter(t, lt < .1 ? 10 : 1.5, 9);
  g.save(); cam(g, z, cx, cy, jx, jy);
  g.drawImage(im, 0, 0, W, im.height * k);
  const pulse = lt > .3 ? 1 + .06 * Math.exp(-(lt - .3) * 6) : 1;
  if (pulse > 1.001) { g.save(); g.beginPath(); g.ellipse(cx, cy, 300 * k, 300 * k, 0, 0, TAU); g.clip(); g.translate(cx, cy); g.scale(pulse, pulse); g.translate(-cx, -cy); g.drawImage(im, 0, 0, W, im.height * k); g.restore(); }
  g.save(); g.globalAlpha = .6 * seg(lt, .1, .25); g.translate(cx + 130 * k, cy + 40 * k); g.scale(-1, 1);
  drawImg(g, IMG.boyFwht, 0, 0, .16, .5, .5); g.restore();
  g.restore();
}

// mouth-corner close-up: a red block slides in from the left
function shotMouth(g, t, lt) {
  g.fillStyle = BLK; g.fillRect(0, 0, W, H);
  const z = 1.3 + lt * .15, [jx, jy] = jitter(t, fl(lt) < 2 ? 8 : 1, 11);
  g.save(); cam(g, z, 800, 380, 260 + jx, jy); cover(g, IMG.herMouth); g.restore();
  const k = eo(seg(lt, 0, fs(4)));
  g.fillStyle = RED; g.fillRect(0, 0, 520 * k, H);
  g.fillStyle = BLK; g.fillRect(520 * k - 12, 0, 12, H);
}

// ───────── End card ─────────
function shotSlate(g, t, lt) {
  const f = fl(lt), flash = f < 2;
  g.fillStyle = flash ? WHT : BLK; g.fillRect(0, 0, W, H);
  const fg = flash ? BLK : WHT;
  g.save(); g.translate(170, 540); g.scale(1 + lt * .006, 1 + lt * .006); g.translate(-170, -540);
  const sc = f === 0 ? 1.06 : f === 1 ? 1.02 : 1;
  g.save(); g.translate(170, 440); g.scale(sc, sc); text(g, '身后', 0, 0, `900 300px ${SERIF}`, fg, 'title'); g.restore();
  g.fillStyle = RED; g.fillRect(170 + 620, 168, 50, 16);
  text(g, 'BEHIND YOU', 178, 520, `italic 600 52px ${CORM}`, flash ? BLK : GRY, 'titleEN');
  if (lt >= .15) text(g, '有些问题，回头才有答案。', 172, 640, `900 54px ${SERIF}`, fg, 'tag');
  if (lt >= .2) text(g, 'Some answers wait behind you.', 174, 702, `italic 600 42px ${CORM}`, GRY, 'tagEN');
  g.fillStyle = flash ? BLK : PALE; g.fillRect(170, 770, 900 * eo(seg(lt, .3, 1.0)), 2);
  if (lt >= .5) {
    text(g, '文字闪切', 172, 850, `900 40px ${SANS}`, WHT, 'style');
    text(g, 'Text Flash Cuts', 352, 850, `italic 600 42px ${CORM}`, WHT, 'styleEN');
  }
  if (lt >= .6) {
    text(g, 'LemoLab × Claude Opus 5.5', 174, 912, `italic 600 38px ${CORM}`, WHT, 'sign');
    text(g, 'Samples: Versilian Studios (CC0)', 174, 962, `italic 600 30px ${CORM}`, GRY, 'credit');
  }
  g.restore();
  // right side: a narrow red strip slowly drops + her small silhouette standing under it
  const h = eo(seg(lt, .1, 3.6)) * 820;
  g.fillStyle = RED; g.fillRect(1640, 0, 22, h);
  g.fillStyle = WHT; g.fillRect(1640, h - 2, 22, 4);
  if (lt > .4) { g.globalAlpha = seg(lt, .4, .7); drawImg(g, IMG.herBackSilW, 1651, 1000, 150 / 1640, .5, 1); g.globalAlpha = 1; }
}

// ───────── Composite: red/black swap (grayscale → high contrast → invert → multiply red: white→black, black→red) ─────────
const TMP = mk(W, H), gt = TMP.getContext('2d');
function flipRB() {
  gt.globalCompositeOperation = 'source-over';
  gt.filter = 'grayscale(1) contrast(5) invert(1)'; gt.drawImage(S, 0, 0); gt.filter = 'none';
  gt.globalCompositeOperation = 'multiply'; gt.fillStyle = RED; gt.fillRect(0, 0, W, H); gt.globalCompositeOperation = 'source-over';
  g0.setTransform(1, 0, 0, 1, 0, 0); g0.drawImage(TMP, 0, 0);
}

function draw(t) {
  TXT.length = 0;
  const g = g0; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  const fn0 = t * FPS;
  const sh = SH.find(s => fn0 >= s[0] - 1e-6 && fn0 < s[1] - 1e-6) || SH[SH.length - 1];
  const [f0, , fn, o] = sh;
  g.save(); fn(g, t, t - fs(f0), o); g.restore();
  if (o.inv && fn === shotStairs) flipRB();
  if (FLIPS.some(([a, b]) => fn0 >= a - 1e-6 && fn0 < b - 1e-6)) flipRB();
}
window.render = t => { draw(t); go.drawImage(S, 0, 0); };
window.TEXTS = t => { draw(t); return TXT.slice(); };

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('missing ' + src)); i.src = src; });
(async () => {
  await Promise.all([`900 300px ${SERIF}`, `900 50px ${SANS}`, `italic 600 40px ${CORM}`].map(f => document.fonts.load(f, '身后别回头第十三级台阶谁写的我在你身后没有到底是再上一轮了Some')));
  const names = ['char.png', 'eye.jpg', 'boy_front.png', 'boy_phone.png', 'boy_eye.jpg', 'letter_hands.jpg', 'her_back.png', 'her_front.png', 'her_umbrella.png', 'her_hand.png', 'her_mouth.jpg'];
  const [ch, eye, boyF, boyP, boyEye, letter, herBack, herF, herUmb, herHand, herMouth] = await Promise.all(names.map(n => loadImg('assets/' + n)));
  Object.assign(IMG, { eye, boyF, boyP, boyEye, letter, herF, herUmb, herHand, herMouth });
  IMG.col = layers(ch); IMG.sil = layers(ch, BLK);
  IMG.boyFsil = silOf(boyF, BLK); IMG.boyFwht = silOf(boyF, WHT); IMG.herFsil = silOf(herF, BLK);
  IMG.herBackSil = silOf(herBack, BLK); IMG.herBackSilW = silOf(herBack, WHT);
  const hb = layers(herBack, null, HB.head, null); IMG.herBackHead = hb.head; IMG.herBackBody = hb.body;
  window.render(0);
  window.READY = true;
})();
