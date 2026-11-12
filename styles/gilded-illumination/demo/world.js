'use strict';
// 借来的光 Borrowed Light: the one painted world (4800 × 2700 world units). Every shot is a part of this picture.
// Uses lib.js (pigments, leaf, leafCord, ink, white-lead dots, spirePts, tubePath, catmull, star8, camMatrix).

const WW = 4800, WH = 2700, BRD = 120;           // world size and border band
let PAINTC;
function makePaint() {   // ground ultramarine as paint: granular, deep, matte
  const s = 512, c = cnv(s, s), g = c.getContext('2d'); g.drawImage(GRAINC, 0, 0);
  const im = g.getImageData(0, 0, s, s), d = im.data, A = [20, 30, 98], B = [58, 82, 176];
  for (let i = 0; i < d.length; i += 4) { const v = d[i] / 255, u = clamp(v * 1.15 - .1); d[i] = lerp(A[0], B[0], u); d[i + 1] = lerp(A[1], B[1], u); d[i + 2] = lerp(A[2], B[2], u); }
  g.putImageData(im, 0, 0); return c;
}
function paint(g, path, fill, rim, rimW, lw = 2.4) {   // flat pigment: fill, inner darker band, ink line; covers gold behind it
  g.fillStyle = fill; g.fill(path); if (rim) rimShade(g, path, rim, rimW || 10);
  ink(g, path, lw); maskErase(g, path);
}

// ---------------------------------------------------------------- layout
const SUN = { x: 3720, y: 540, r: 250 };
const BS = { x: 0, y: 640, r: 74 };   // the first star (shot 1 opens inside its leaf); x set in buildWorld so a seam crosses it
const PATH_CTRL = [[520, 2338], [820, 2334], [1080, 2290], [1290, 2222], [1460, 2212], [1640, 2206], [1820, 2130], [1960, 2050], [2120, 2012], [2330, 1972], [2600, 1915],
  [2880, 1842], [3120, 1752], [3320, 1660], [3170, 1585], [3080, 1520], [3220, 1448], [3420, 1365], [3560, 1270], [3460, 1190], [3380, 1120], [3440, 1046]];
const GIRLS = [   // the places she was (feet); the last one is the girl herself on the summit
  { x: 610, y: 2337, dir: 1 }, { x: 1470, y: 2211, dir: 1 }, { x: 2140, y: 2008, dir: 1 }, { x: 3110, y: 1540, dir: -1 }, { x: 3440, y: 1048, dir: 1 }];
const PALE = { lil: ['#cbc1de', '#9a8fb7', '#efeaf7'], az: ['#abc7db', '#7599b5', '#dfecf4'], ro: ['#e6c6bd', '#b78c81', '#f7e5df'], ve: ['#acd0c0', '#76a291', '#ddefe7'] };
const MIDP = { ve: [VERDI, VERDI_D, '#9fd8c0'], ro: ['#d4877c', '#94503f', '#f4c4b6'], az: ['#5f93b8', '#38668a', '#b7d6ea'], li: [LILAC, LILAC_D, LILAC_L] };
let WD = null;
function cluster(out, R, cx, by, h, w, n, cols, o = {}) {   // one tall spire with smaller ones leaning off it: a clump, not a fence
  const items = [{ bx: cx, h, w, lean: (R() - .5) * .06, c: 0 }];
  for (let k = 1; k <= n; k++) { const sd = k % 2 ? -1 : 1, rank = Math.ceil(k / 2), off = w * (.42 + .3 * R()) * rank;
    items.push({ bx: cx + sd * off, h: h * (.26 + .3 * R()) / Math.pow(rank, .35), w: w * (.62 + .25 * R()), lean: sd * (.05 + .09 * R()), c: k, dy: 20 + R() * 50 * rank }); }
  items.sort((a, b) => b.h - a.h);   // tallest behind
  items.forEach(it => { const col = cols[(it.c + (o.shift || 0)) % cols.length], y = by + (it.dy || 0);
    out.push({ pts: spirePts(it.bx, y, it.w, it.h, it.lean, R), col: col[0], colD: col[1], top: col[2], bx: it.bx, by: y, w: it.w, h: it.h, pale: !!o.pale }); });
}
function mesa(R, bx, by, w, h, col) {   // a broad, flat-topped rock: breaks the rhythm of the spires
  const pts = [[bx - w / 2, by]], n = 3; for (let i = 1; i <= n; i++) { const y = by - h * i / n, x = bx - w / 2 + w * .09 * i + (R() - .5) * 20; pts.push([x - 18, y + 16], [x - 18, y], [x + 8, y]); }
  pts.push([bx + w * .12, by - h - 10], [bx + w * .28, by - h]);
  for (let i = n; i >= 1; i--) { const y = by - h * i / n, x = bx + w / 2 - w * .09 * i + (R() - .5) * 20; pts.push([x - 8, y], [x + 18, y], [x + 18, y + 16]); }
  pts.push([bx + w / 2, by]);
  return { pts, col: col[0], colD: col[1], top: col[2], bx, by, w, h, pale: true };
}
function buildWorld() {
  const R = mulberry(2024);
  BS.x = 1200 - rowOff(Math.floor(BS.y / LS)) + 2 * LS + 30;   // a vertical seam passes 30 units left of the star's centre
  // stars: raised gold, kept off the sun and the first star
  const stars = []; let guard = 0;
  while (stars.length < 105 && guard++ < 20000) {
    const x = BRD + 40 + R() * (WW - 2 * BRD - 80), y = BRD + 30 + Math.pow(R(), 1.3) * 1500;
    if (Math.hypot(x - SUN.x, y - SUN.y) < SUN.r + 220 || Math.hypot(x - BS.x, y - BS.y) < 200) continue;
    if (stars.some(s => Math.hypot(s.x - x, s.y - y) < 140)) continue;
    const big = R() < .2; stars.push({ x, y, r: big ? 30 + R() * 10 : 14 + R() * 12, rot: R() * .5, n: R() < .3 ? 6 : 8 });
  }
  const dots = []; for (let i = 0; i < 300; i++) { const x = BRD + R() * (WW - 2 * BRD), y = BRD + Math.pow(R(), 1.2) * 1650; if (Math.hypot(x - SUN.x, y - SUN.y) < SUN.r + 180) continue; dots.push([x, y, 3.2 + R() * 2.8]); }
  const wtri = []; for (let i = 0; i < 95; i++) { const x = BRD + R() * (WW - 2 * BRD), y = BRD + Math.pow(R(), 1.1) * 1650; if (Math.hypot(x - SUN.x, y - SUN.y) < SUN.r + 160) continue; wtri.push([x, y, 2.6 + R() * 1.6, R()]); }
  // three ranges: far and pale (small, behind), middle (stronger pigment), and the big rock at the left edge; gaps between clumps
  const far = [], mid = [];
  cluster(far, R, 760, 2010, 560, 240, 1, [PALE.lil, PALE.az]);
  far.push(mesa(R, 1330, 2010, 560, 170, PALE.az));
  cluster(far, R, 2000, 2010, 720, 250, 2, [PALE.ro, PALE.lil, PALE.az]);
  cluster(far, R, 4420, 2010, 520, 230, 2, [PALE.lil, PALE.az]);
  cluster(mid, R, 90, 2080, 1150, 360, 2, [MIDP.ve, MIDP.az, MIDP.li]);
  cluster(mid, R, 4700, 2080, 760, 300, 2, [MIDP.ro, MIDP.ve]);
  // the massif, right: side clumps behind, then the mountain itself as three stacked slabs (rose, never ochre)
  const massif = [];
  cluster(massif, R, 2760, 2440, 900, 330, 2, [MIDP.li, MIDP.ve]);
  cluster(massif, R, 4080, 2440, 1150, 400, 3, [MIDP.ve, MIDP.ro, MIDP.li]);
  const RS2 = mulberry(31);
  massif.push({ pts: spirePts(3470, 2440, 470, 1400, -.015, RS2), col: '#c98a86', colD: '#8a4d4b', top: '#f2c9c2', bx: 3470, by: 2440, w: 470, h: 1400 });
  massif.push({ pts: spirePts(3400, 2440, 760, 1250, .03, RS2), col: '#ddb0a2', colD: '#a06e60', top: '#f8ddd2', bx: 3400, by: 2440, w: 760, h: 1250 });
  massif.push({ pts: spirePts(3330, 2440, 1120, 1000, -.03, RS2), col: '#bd8a82', colD: '#7e4f48', top: '#ecc6bc', bx: 3330, by: 2440, w: 1120, h: 1000 });
  // clouds (scalloped): mountain band and sky
  const clouds = [[2760, 1650, 560, 1], [3190, 1565, 660, 1.1], [3900, 1470, 640, 1.1], [4470, 1720, 520, .9], [2150, 1380, 400, .8],
    [820, 560, 620, 1.05], [2300, 380, 520, .95], [1500, 1040, 420, .8], [620, 1905, 520, .9], [1600, 1915, 460, .85]].map(([x, y, w, s], i) => {
      const Rc = mulberry(100 + i); return { x, y, w, s, bumps: Array.from({ length: 9 }, () => .7 + Rc() * .6) }; });
  // orchard: round-crowned trees with gold fruit, cypresses
  const trees = [[1880, 2015, 100], [2050, 1985, 62, 1], [2300, 1948, 104], [2530, 1902, 58, 1], [2720, 1872, 80], [1720, 2262, 88], [2430, 2135, 96], [1560, 2050, 56, 1], [3700, 2300, 60, 1], [3760, 2360, 92], [4560, 2340, 86], [4680, 2300, 54, 1], [3070, 2220, 84], [3190, 2190, 54, 1], [1050, 2420, 70], [960, 2380, 46, 1]].map(([x, y, r, cyp], i) => {
    const Rt = mulberry(300 + i), fr = []; let gd = 0;
    while (fr.length < 9 && gd++ < 400) { const a = Rt() * TAU, rr = Math.sqrt(Rt()) * r * .78, fx = Math.cos(a) * rr, fy = Math.sin(a) * rr * .9; if (fr.some(f => Math.hypot(f[0] - fx, f[1] - fy) < 30)) continue; fr.push([fx, fy]); }
    return { x, y, r, th: r * 1.35, fruit: cyp ? [] : fr, seed: i, cyp: !!cyp };
  });
  const meadow = [[0, 1960], [380, 1985], [800, 2010], [1200, 2015], [1600, 2000], [2000, 1975], [2400, 1935], [2800, 1960], [3300, 2010], [3800, 1995], [4300, 1965], [4800, 1990]];
  const river = catmull([[60, 2050], [420, 2090], [820, 2150], [1160, 2200], [1460, 2262], [1650, 2380], [1760, 2520], [1830, 2700]], 8);
  const path = catmull(PATH_CTRL, 8);
  const shrines = [{ x: 2640, y: 1905 }, { x: 3290, y: 1452 }];
  WD = { stars, dots, wtri, far, mid, massif, clouds, trees, meadow, river, path, pathL: arclen(path), shrines };
}

// ---------------------------------------------------------------- sky, stars, sun
function drawSky(g) {
  if (!g.__paint) { g.__paint = g.createPattern(PAINTC, 'repeat'); g.__paint.setTransform(new DOMMatrix().scale(1.1)); }
  g.fillStyle = g.__paint; g.fillRect(-200, -200, WW + 400, WH + 400);
  const gr = g.createLinearGradient(0, 0, 0, 2000); gr.addColorStop(0, 'rgba(8,10,48,.4)'); gr.addColorStop(.7, 'rgba(20,30,100,.08)'); gr.addColorStop(1, 'rgba(80,110,200,.16)');
  g.fillStyle = gr; g.fillRect(-200, -200, WW + 400, 2400);
  for (const [x, y, r, rot] of WD.wtri) triad(g, x, y, r, .45, rot * TAU);   // white-lead dot stars between the gold ones
}
function drawStar(g, s) {
  const p = P2(q => star8(q, s.x, s.y, s.r, s.n === 6 ? .5 : .42, s.rot, s.n));
  g.save(); g.translate(3, 4); g.fillStyle = 'rgba(6,10,40,.55)'; g.fill(p); g.restore();   // raised (gesso) gold casts a small shadow
  leaf(g, p, [s.x - s.r, s.y - s.r, s.r * 2, s.r * 2], { lw: 1.8, rimW: 3 });
  if (s.r > 26) { g.fillStyle = 'rgba(92,48,4,.6)'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; g.beginPath(); g.arc(s.x + Math.cos(a) * s.r * .26, s.y + Math.sin(a) * s.r * .26, 1.6, 0, TAU); g.fill(); } }
  gpush(s.x, s.y, s.r * 3.2, .9);
}
function drawFirstStar(g) {   // the star the film opens inside: bigger, punched, with an incised ring
  const s = BS, p = P2(q => star8(q, s.x, s.y, s.r, .56, .12, 8));
  g.save(); g.translate(4, 5); g.fillStyle = 'rgba(6,10,40,.55)'; g.fill(p); g.restore();
  leaf(g, p, [s.x - s.r, s.y - s.r, s.r * 2, s.r * 2], { lw: 2.2, rimW: 4 });
  g.save(); g.clip(p);
  const punch = (r, n, d) => { for (let i = 0; i < n; i++) { const a = i / n * TAU, x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r;
    g.fillStyle = `rgba(92,48,4,${.66 + .2 * DIM})`; g.beginPath(); g.arc(x, y, d, 0, TAU); g.fill(); g.fillStyle = `rgba(255,246,200,${.45 * (1 - .6 * DIM)})`; g.beginPath(); g.arc(x - d * .35, y - d * .35, d * .38, 0, TAU); g.fill(); } };
  punch(24, 64, .62); punch(12, 34, .5); punch(31.5, 80, .42);
  g.strokeStyle = 'rgba(92,48,4,.55)'; g.lineWidth = .7; g.beginPath(); g.arc(s.x, s.y, 30, 0, TAU); g.stroke(); g.beginPath(); g.arc(s.x, s.y, 18, 0, TAU); g.stroke();
  g.restore();
  gpush(s.x, s.y, s.r * 3, 1);
}
function drawStars(g) {
  for (const s of WD.stars) drawStar(g, s);
  drawFirstStar(g);
  goldPat(g);
  for (const [x, y, r] of WD.dots) { const c = P2(q => q.arc(x, y, r, 0, TAU)); g.fillStyle = g.__gp; g.fill(c); g.fillStyle = `rgba(52,30,8,${.45 * DIM})`; g.fill(c); g.strokeStyle = 'rgba(42,26,16,.75)'; g.lineWidth = 1.2 * LWK; g.stroke(c); maskPath(g, c); }
}
function sunRayPath(S, k, wavy) {
  return P2(q => {
    const a = k / 24 * TAU, w = TAU / 24 * .36, r0 = S.r - 6, r1 = S.r + (k % 2 ? 80 : 122);
    if (!wavy || k % 2) { q.moveTo(S.x + Math.cos(a - w) * r0, S.y + Math.sin(a - w) * r0); q.lineTo(S.x + Math.cos(a) * r1, S.y + Math.sin(a) * r1); q.lineTo(S.x + Math.cos(a + w) * r0, S.y + Math.sin(a + w) * r0); q.closePath(); }
    else { const pts = [], back = [];
      for (let j = 0; j <= 10; j++) { const u = j / 10, rr = lerp(r0, r1, u), ww = w * (1 - u) * 1.05, off = Math.sin(u * Math.PI * 2.2) * .05 * (1 - u * .4); pts.push([a + off - ww, rr]); back.unshift([a + off + ww, rr]); }
      pts.concat(back).forEach(([an, rr], i) => i ? q.lineTo(S.x + Math.cos(an) * rr, S.y + Math.sin(an) * rr) : q.moveTo(S.x + Math.cos(an) * rr, S.y + Math.sin(an) * rr)); q.closePath(); }
  });
}
// sun: { dim: dark (1) → lit (0); rayDim(k): per ray; glory 0..1 (long thin painted rays); ring: {x, y, r} a lit region spreading over the disc }
function drawSun(g, o) {
  const S = SUN, dim = o.dim ?? DIM;
  if (o.glory > 0) {
    for (let k = 0; k < 48; k++) { const a = (k + .5) / 48 * TAU, r0 = S.r + 150, r1 = r0 + ((k % 2 ? 120 : 250) + 20 * Math.sin(k * 2.3)) * o.glory, w = .013;   // painted rays: thin tapered wedges of leaf
      const p = P2(q => { q.moveTo(S.x + Math.cos(a - w) * r0, S.y + Math.sin(a - w) * r0); q.lineTo(S.x + Math.cos(a) * r1, S.y + Math.sin(a) * r1); q.lineTo(S.x + Math.cos(a + w) * r0, S.y + Math.sin(a + w) * r0); q.closePath(); });
      const mx = S.x + Math.cos(a) * (r0 + r1) / 2, my = S.y + Math.sin(a) * (r0 + r1) / 2, hb = (r1 - r0) / 2 + 12;
      leaf(g, p, [mx - hb, my - hb, hb * 2, hb * 2], { lw: 1.1, rim: false, dim: .35 }); }
  }
  const disc = P2(q => q.arc(S.x, S.y, S.r, 0, TAU));
  g.save(); g.translate(8, 10); g.fillStyle = 'rgba(6,10,40,.5)'; for (let k = 0; k < 24; k++) g.fill(sunRayPath(S, k, true)); g.fill(disc); g.restore();
  for (let k = 0; k < 24; k++) { const p = sunRayPath(S, k, true), a = k / 24 * TAU, mx = S.x + Math.cos(a) * (S.r + 58), my = S.y + Math.sin(a) * (S.r + 58);
    leaf(g, p, [mx - 80, my - 80, 160, 160], { lw: 2.2, rimW: 5, dim: o.rayDim ? o.rayDim(k) : dim }); }
  // the disc: a vermilion ring with white pearls under the gold edge, then leaf
  const ring = P2(q => { q.arc(S.x, S.y, S.r + 16, 0, TAU); });
  g.fillStyle = VERM; g.fill(ring); rimShade(g, ring, VERM_D, 6); ink(g, ring, 2.4); maskErase(g, ring);
  pearls(g, S.x, S.y, S.r + 8.5, 72, 2.6, .9);
  const deco = (dd) => {
    g.save(); g.clip(disc);
    const punch = (r, n, d) => { for (let i = 0; i < n; i++) { const a = i / n * TAU, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r; g.fillStyle = `rgba(92,48,4,${.62 + .2 * dd})`; g.beginPath(); g.arc(x, y, d, 0, TAU); g.fill(); g.fillStyle = `rgba(255,246,200,${.5 * (1 - .7 * dd)})`; g.beginPath(); g.arc(x - d * .35, y - d * .35, d * .4, 0, TAU); g.fill(); } };
    punch(S.r - 22, 72, 3.6); punch(S.r - 48, 60, 2.6); punch(150, 44, 3); punch(84, 28, 2.6);
    g.strokeStyle = 'rgba(92,48,4,.55)'; g.lineWidth = 2; for (const r of [S.r - 64, 118]) { g.beginPath(); g.arc(S.x, S.y, r, 0, TAU); g.stroke(); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; const pet = P2(q => { q.moveTo(S.x, S.y); q.quadraticCurveTo(S.x + Math.cos(a - .32) * 70, S.y + Math.sin(a - .32) * 70, S.x + Math.cos(a) * 62, S.y + Math.sin(a) * 62); q.quadraticCurveTo(S.x + Math.cos(a + .32) * 70, S.y + Math.sin(a + .32) * 70, S.x, S.y); });
      g.strokeStyle = 'rgba(92,48,4,.6)'; g.lineWidth = 1.8; g.stroke(pet); }
    g.restore();
  };
  leaf(g, disc, [S.x - S.r, S.y - S.r, S.r * 2, S.r * 2], { lw: 2.8, rimW: 9, dim }); deco(dim);
  if (o.ring && o.ring.r > 0) {   // the lit leaf spreading from where the flame touched
    const rg = P2(q => q.arc(o.ring.x, o.ring.y, o.ring.r, 0, TAU));
    g.save(); g.clip(rg); leaf(g, disc, [S.x - S.r, S.y - S.r, S.r * 2, S.r * 2], { lw: 2.8, rimW: 9, dim: 0, nomask: true }); deco(0); g.restore();
  }
  gpush(S.x, S.y, S.r * 1.6, .7); for (let k = 0; k < 24; k += 2) { const a = k / 24 * TAU; gpush(S.x + Math.cos(a) * (S.r + 70), S.y + Math.sin(a) * (S.r + 70), 70, .8); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + .13; gpush(S.x + Math.cos(a) * (S.r - 22), S.y + Math.sin(a) * (S.r - 22), 46, .75); }
}

// ---------------------------------------------------------------- rock, ground, water, buildings
function drawSpire(g, S, o = {}) {
  const p = polyPath(S.pts, true);
  g.fillStyle = S.col; g.fill(p);
  g.save(); g.clip(p); const tip = S.pts.reduce((a, q) => q[1] < a[1] ? q : a, S.pts[0]);
  g.fillStyle = rgba(S.colD, S.pale ? .32 : .5); g.beginPath(); g.moveTo(tip[0] + S.w * .02, tip[1] - 5); g.lineTo(S.bx + S.w * .6, S.by + 5); g.lineTo(S.bx + S.w * .1, S.by + 5); g.closePath(); g.fill();
  g.strokeStyle = S.colD; g.lineWidth = Math.max(4, S.w * .03); g.stroke(p);
  const R = mulberry(Math.round(S.bx * 7 + S.h)); g.strokeStyle = rgba(S.colD, .55); g.lineWidth = 2.4;
  for (let i = 0; i < 5; i++) { const y = S.by - S.h * (.15 + R() * .7), x = S.bx + (R() - .5) * S.w * .5; g.beginPath(); g.moveTo(x - S.w * .15, y + 8); g.quadraticCurveTo(x, y - 6, x + S.w * .17, y + 4); g.stroke(); }
  g.restore();
  ink(g, p, S.pale ? 2.0 : 2.6, S.pale ? '#4a3a40' : INK);
  g.strokeStyle = 'rgba(255,252,238,.88)'; g.lineWidth = 2.4 * LWH; g.lineCap = 'round';
  let st = 0;
  for (let k = 1; k < S.pts.length - 1; k++) { const a = S.pts[k], b = S.pts[k + 1]; if (Math.abs(a[1] - b[1]) < .5 && Math.abs(a[0] - b[0]) > 2) { const d = Math.sign(b[0] - a[0]); g.beginPath(); g.moveTo(a[0] + d * 3, a[1] + 4); g.lineTo(b[0] - d * 3, b[1] + 4); g.stroke();
    if (!S.pale && (st++ % 2 === 0)) triad(g, (a[0] + b[0]) / 2, a[1] + 16, 2.6, .85, R() * TAU); } }
  g.strokeStyle = rgba(S.top, .92); g.lineWidth = 2.4 * LWH * 1.7; g.beginPath(); g.moveTo(tip[0] - S.w * .04, tip[1] + S.h * .05); g.lineTo(lerp(tip[0], S.bx - S.w * .3, .45), lerp(tip[1], S.by, .45)); g.stroke();
  if (!S.pale) for (let i = 0; i < 2; i++) triad(g, S.bx - S.w * (.12 + .1 * i), S.by - S.h * (.3 + .25 * i), 3, .8, R() * TAU);
  maskErase(g, p);
}
function topAt(x) { const m = WD.meadow; for (let i = 1; i < m.length; i++) if (x <= m[i][0]) return lerp(m[i - 1][1], m[i][1], (x - m[i - 1][0]) / (m[i][0] - m[i - 1][0])); return m[m.length - 1][1]; }
function drawMeadow(g) {
  const top = catmull(WD.meadow, 6), p = polyPath([...top, [WW + 200, WH + 200], [-200, WH + 200]], true);
  paint(g, p, VERD, VERD_D, 22, 2.8);
  const HUMPS = [[-200, 1250, 2440, 150, '#2a6136'], [2050, 3600, 2330, 170, '#326f3d'], [3300, 5000, 2250, 190, '#2a6136'], [1500, 2700, 2560, 120, '#2a6136'], [3000, 4900, 2520, 130, '#3a7a44'], [-200, 1700, 2620, 110, '#326f3d'],
    [600, 1500, 2060, 70, '#3a7a44'], [2300, 3000, 2010, 60, '#3a7a44']];
  for (const [x0, x1, yb, hh, col] of HUMPS) {
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([lerp(x0, x1, u), yb - hh * Math.pow(Math.sin(Math.PI * u), .7)]); }
    const hp = polyPath([...pts, [x1, WH + 200], [x0, WH + 200]], true); g.save(); g.clip(p); paint(g, hp, col, VERD_D, 18, 2.4); g.restore();
    hiLine(g, pts.slice(6, 20).map(q => [q[0], q[1] + 7]), 2.6, .6);
    pearlLine(g, pts.slice(21, 32).map(q => [q[0], q[1] + 12]), 26, 2.6, .7);
  }
  const R = mulberry(8);
  for (let i = 0; i < 460; i++) { const x = R() * WW, y = 2010 + R() * 700; if (y < topAt(x) + 20) continue;
    if (R() < .4) { g.strokeStyle = VERD_L; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - .5) * 10, y - 14, x + (R() - .5) * 8, y - 24); g.stroke(); continue; }
    if (R() < .35) { triad(g, x, y, 2.6, .85, R() * TAU); continue; }
    const c = [WHITE, VERM_L, ROSE, '#9ec1e6'][(R() * 4) | 0], r = 4.5 + R() * 3; g.fillStyle = c; for (let k = 0; k < 5; k++) { const an = k * 1.2566; g.beginPath(); g.arc(x + Math.cos(an) * r, y + Math.sin(an) * r, r * .6, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(42,26,16,.8)'; g.beginPath(); g.arc(x, y, r * .3, 0, TAU); g.fill(); }
}
function drawRiver(g) {
  const pts = WD.river, ws = pts.map((_, i) => lerp(90, 170, i / (pts.length - 1)));
  const p = tubePath(pts, ws, false, false);
  paint(g, p, LAPIS_L, LAPIS, 14, 2.6);
  g.save(); g.clip(p); g.strokeStyle = 'rgba(250,250,255,.85)'; g.lineWidth = 2.6 * LWH; g.lineCap = 'round';
  const L = arclen(pts); for (let s = 30; s < L[L.length - 1]; s += 46) { const q = alongPath(pts, L, s), off = ((s * 7) % 50) - 25; const nx = -Math.sin(q.a), ny = Math.cos(q.a);
    const x = q.x + nx * off, y = q.y + ny * off; g.beginPath(); g.moveTo(x - 12, y + 4); g.quadraticCurveTo(x - 6, y - 6, x, y + 2); g.quadraticCurveTo(x + 6, y - 6, x + 12, y + 4); g.stroke(); }
  g.restore();
}
function drawPath(g) {
  const pts = WD.path, ws = pts.map((_, i) => lerp(48, 26, i / (pts.length - 1)));
  const p = tubePath(pts, ws);
  paint(g, p, '#ece4d6', '#b9ab98', 7, 2.2);
  g.save(); g.clip(p); const R = mulberry(4); g.fillStyle = 'rgba(120,100,84,.5)';
  for (let s = 0; s < WD.pathL[WD.pathL.length - 1]; s += 22) { const q = alongPath(pts, WD.pathL, s); g.beginPath(); g.arc(q.x + (R() - .5) * 18, q.y + (R() - .5) * 10, 2.2 + R() * 2, 0, TAU); g.fill(); }
  g.restore();
}
function drawBridge(g) {
  const x0 = 1300, x1 = 1640, y = 2212, cx = 1462, cy = 2300, r = 112;
  const body = P2(q => { q.moveTo(x0 - 30, y + 70); q.lineTo(x0, y - 6); q.lineTo(x1, y - 10); q.lineTo(x1 + 30, y + 70); q.lineTo(cx + r, y + 70); q.arc(cx, cy, r, 0, Math.PI, true); q.closePath(); });
  paint(g, body, '#dcae9e', '#a26e60', 12, 2.6);
  g.save(); g.clip(body); g.strokeStyle = 'rgba(42,26,16,.45)'; g.lineWidth = 1.8;
  for (let k = 0; k <= 10; k++) { const a = Math.PI + k / 10 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r + 34), cy + Math.sin(a) * (r + 34)); g.stroke(); }
  g.restore(); hiLine(g, [[x0 + 6, y - 2], [x1 - 6, y - 6]], 2.2, .7);
  const par = P2(q => q.rect(x0 + 4, y - 44, x1 - x0 - 8, 38)); paint(g, par, '#e9c6b8', '#b07e70', 8, 2.2);
  for (let i = 0; i < 7; i++) { const bx = x0 + 34 + i * ((x1 - x0 - 68) / 6), by = y - 25, c = P2(q => q.arc(bx, by, 14, 0, TAU)); leaf(g, c, [bx - 14, by - 14, 28, 28], { lw: 1.8, rimW: 2.5 }); gpush(bx, by, 46, 1); }
}
function drawChapel(g) {
  const x = 330, b = 2348, wall = '#efd9cc', wallD = '#b99482';
  const tw = P2(q => q.rect(x - 70, b - 420, 112, 420)); paint(g, tw, wall, wallD, 12, 2.6);
  const troof = P2(q => { q.moveTo(x - 84, b - 418); q.lineTo(x - 14, b - 560); q.lineTo(x + 56, b - 418); q.closePath(); }); paint(g, troof, VERM, VERM_D, 10, 2.6);
  g.save(); g.clip(troof); g.strokeStyle = 'rgba(42,26,16,.4)'; g.lineWidth = 1.6; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - 84 + k * 10, b - 418 - k * 24); g.lineTo(x + 56 - k * 10, b - 418 - k * 24); g.stroke(); } g.restore();
  pearlLine(g, [[x - 80, b - 424], [x - 14, b - 554]], 14, 2.4, .85);
  const ball = P2(q => q.arc(x - 14, b - 574, 15, 0, TAU)); leaf(g, ball, [x - 29, b - 589, 30, 30], { lw: 1.8 }); gpush(x - 14, b - 574, 50);
  const bellw = P2(q => { q.moveTo(x - 44, b - 300); q.lineTo(x - 44, b - 352); q.arc(x - 14, b - 352, 30, Math.PI, 0); q.lineTo(x + 16, b - 300); q.closePath(); });
  g.fillStyle = ULTRA_D; g.fill(bellw); ink(g, bellw, 2.2); maskErase(g, bellw);
  const bell = P2(q => { q.moveTo(x - 30, b - 312); q.quadraticCurveTo(x - 28, b - 360, x - 14, b - 362); q.quadraticCurveTo(x, b - 360, x + 2, b - 312); q.closePath(); }); leaf(g, bell, [x - 30, b - 362, 32, 50], { lw: 1.6 }); gpush(x - 14, b - 335, 60);
  const nave = P2(q => q.rect(x + 40, b - 230, 300, 230)); paint(g, nave, '#ebc0b2', '#b07a6c', 12, 2.6);
  const roof = P2(q => { q.moveTo(x + 22, b - 228); q.lineTo(x + 190, b - 352); q.lineTo(x + 358, b - 228); q.closePath(); }); paint(g, roof, VERM, VERM_D, 10, 2.6);
  pearlLine(g, [[x + 34, b - 236], [x + 190, b - 344], [x + 346, b - 236]], 15, 2.4, .85);
  // the gold-ground pointed arch: a doorway of burnished leaf with a punched diaper, pearls round it
  const ax = x + 190, aw = 64, ah = 170;
  const arch = P2(q => { q.moveTo(ax - aw, b); q.lineTo(ax - aw, b - ah + 40); q.quadraticCurveTo(ax - aw, b - ah - 30, ax, b - ah - 54); q.quadraticCurveTo(ax + aw, b - ah - 30, ax + aw, b - ah + 40); q.lineTo(ax + aw, b); q.closePath(); });
  const archO = P2(q => { const e = 12; q.moveTo(ax - aw - e, b); q.lineTo(ax - aw - e, b - ah + 40); q.quadraticCurveTo(ax - aw - e, b - ah - 40, ax, b - ah - 68); q.quadraticCurveTo(ax + aw + e, b - ah - 40, ax + aw + e, b - ah + 40); q.lineTo(ax + aw + e, b); q.closePath(); });
  paint(g, archO, VERM, VERM_D, 4, 2.4);
  leaf(g, arch, [ax - aw, b - ah - 54, aw * 2, ah + 54], { lw: 2.6, rimW: 7 });
  g.save(); g.clip(arch); g.strokeStyle = 'rgba(100,54,6,.45)'; g.lineWidth = 1.3;
  for (let k = -12; k <= 12; k++) { g.beginPath(); g.moveTo(ax + k * 22, b); g.lineTo(ax + k * 22 + 260, b - 260); g.stroke(); g.beginPath(); g.moveTo(ax + k * 22, b); g.lineTo(ax + k * 22 - 260, b - 260); g.stroke(); }
  g.fillStyle = 'rgba(100,54,6,.6)'; for (let i = -6; i <= 6; i++) for (let j = 0; j < 12; j++) { g.beginPath(); g.arc(ax + i * 22, b - 11 - j * 22, 2.2, 0, TAU); g.fill(); }
  g.restore(); gpush(ax, b - 60, 130, 1.1); gpush(ax, b - 170, 90, 1);
  for (const wx of [x + 80, x + 300]) { const wn = P2(q => { q.moveTo(wx - 14, b - 120); q.lineTo(wx - 14, b - 160); q.arc(wx, b - 160, 14, Math.PI, 0); q.lineTo(wx + 14, b - 120); q.closePath(); }); g.fillStyle = ULTRA_D; g.fill(wn); ink(g, wn, 2.2); }
  for (const [hx, hw, hh, wallc, roofc] of [[x - 250, 150, 140, '#e9d6ea', VERDI], [x + 400, 120, 112, '#ebc8bc', AZUR]]) {
    const hb = P2(q => q.rect(hx, b - hh, hw, hh)); paint(g, hb, wallc, '#a88e9a', 10, 2.4);
    const hr = P2(q => { q.moveTo(hx - 14, b - hh + 2); q.lineTo(hx + hw / 2, b - hh - hw * .6); q.lineTo(hx + hw + 14, b - hh + 2); q.closePath(); }); paint(g, hr, roofc, mixHex(roofc, '#000000', .35), 9, 2.4);
    pearlLine(g, [[hx - 6, b - hh - 4], [hx + hw / 2, b - hh - hw * .6 + 6], [hx + hw + 6, b - hh - 4]], 14, 2.2, .8);
    const dr = P2(q => q.rect(hx + hw / 2 - 16, b - 54, 32, 54)); g.fillStyle = WOOD_D; g.fill(dr); ink(g, dr, 2);
  }
}
function drawTown(g) {
  const b = 2330;
  const wall = P2(q => q.rect(3880, b - 120, 520, 120)); paint(g, wall, '#e3b8a8', '#a8735c', 12, 2.6);
  g.save(); g.clip(wall); g.strokeStyle = 'rgba(42,26,16,.35)'; g.lineWidth = 1.6; for (let yy = b - 100; yy < b; yy += 26) { g.beginPath(); g.moveTo(3880, yy); g.lineTo(4400, yy); g.stroke(); } g.restore();
  for (let x = 3890; x < 4390; x += 40) { const cr = P2(q => q.rect(x, b - 146, 22, 26)); paint(g, cr, '#e3b8a8', '#a8735c', 5, 2.2); }
  const gate = P2(q => { q.moveTo(4110, b); q.lineTo(4110, b - 60); q.arc(4140, b - 60, 30, Math.PI, 0); q.lineTo(4170, b); q.closePath(); });
  leaf(g, gate, [4110, b - 90, 60, 90], { lw: 2.4, rimW: 5 }); gpush(4140, b - 45, 90, 1);
  for (const [tx, tw, th, roof] of [[3850, 110, 300, VERM], [4060, 90, 380, ULTRA], [4380, 110, 280, VERM]]) {
    const tb = P2(q => q.rect(tx, b - th, tw, th)); paint(g, tb, '#ecd6ca', '#b0907e', 11, 2.6);
    const wn = P2(q => { q.moveTo(tx + tw / 2 - 11, b - th + 110); q.lineTo(tx + tw / 2 - 11, b - th + 74); q.arc(tx + tw / 2, b - th + 74, 11, Math.PI, 0); q.lineTo(tx + tw / 2 + 11, b - th + 110); q.closePath(); }); g.fillStyle = ULTRA_D; g.fill(wn); ink(g, wn, 2);
    const cone = P2(q => { q.moveTo(tx - 14, b - th + 2); q.lineTo(tx + tw / 2, b - th - tw * 1.3); q.lineTo(tx + tw + 14, b - th + 2); q.closePath(); }); paint(g, cone, roof, roof === VERM ? VERM_D : ULTRA_D, 9, 2.6);
    pearlLine(g, [[tx - 4, b - th - 6], [tx + tw / 2, b - th - tw * 1.3 + 14]], 14, 2.2, .8);
    const fx = tx + tw / 2, fy = b - th - tw * 1.3 - 14, fin = P2(q => q.arc(fx, fy, 14, 0, TAU)); leaf(g, fin, [fx - 14, fy - 14, 28, 28], { lw: 1.8 }); gpush(fx, fy, 50);
  }
}
function drawShrine(g, S) {   // a wayside shrine: a post, a vermilion gable, a gold-ground panel with a punched rosette
  const { x, y } = S;
  const post = P2(q => q.rect(x - 9, y - 120, 18, 120)); paint(g, post, '#e9d6ca', '#a88e80', 4, 2.2);
  const box = P2(q => q.rect(x - 44, y - 210, 88, 96)); paint(g, box, '#ecc6b8', '#b07a6c', 6, 2.4);
  const pan = P2(q => { q.moveTo(x - 32, y - 122); q.lineTo(x - 32, y - 180); q.quadraticCurveTo(x - 32, y - 200, x, y - 206); q.quadraticCurveTo(x + 32, y - 200, x + 32, y - 180); q.lineTo(x + 32, y - 122); q.closePath(); });
  leaf(g, pan, [x - 32, y - 206, 64, 84], { lw: 2, rimW: 4 });
  g.fillStyle = 'rgba(100,54,6,.65)'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 14, y - 160 + Math.sin(a) * 14, 1.8, 0, TAU); g.fill(); }
  const gab = P2(q => { q.moveTo(x - 58, y - 206); q.lineTo(x, y - 262); q.lineTo(x + 58, y - 206); q.closePath(); }); paint(g, gab, VERM, VERM_D, 6, 2.4);
  pearlLine(g, [[x - 50, y - 212], [x, y - 254], [x + 50, y - 212]], 12, 2.2, .85);
  gpush(x, y - 160, 70, 1.1);
}
function drawTree(g, T, front) {
  const { x, y, r, th } = T, cy = y - th - r * .55;
  if (!front) { if (T.cyp) return;
    const tr = P2(q => { q.moveTo(x - 12, y); q.quadraticCurveTo(x - 8, y - th * .6, x - 18, cy + r * .4); q.lineTo(x + 16, cy + r * .4); q.quadraticCurveTo(x + 7, y - th * .6, x + 13, y); q.closePath(); });
    paint(g, tr, '#7a4a26', '#4f2c12', 6, 2.4); hiLine(g, [[x - 5, y - 10], [x - 4, y - th * .7]], 2, .55);
    return;
  }
  const R = mulberry(50 + T.seed);
  if (T.cyp) {
    const h = r * 5.2, top = y - h, cp = P2(q => { q.moveTo(x, top); q.bezierCurveTo(x + r * .9, top + h * .35, x + r * 1.0, y - h * .25, x + r * .35, y - 20); q.lineTo(x - r * .35, y - 20); q.bezierCurveTo(x - r * 1.0, y - h * .25, x - r * .9, top + h * .35, x, top); q.closePath(); });
    paint(g, cp, VERDI_D, '#163f33', r * .22, 2.6);
    g.save(); g.clip(cp); g.strokeStyle = VERDI; g.lineWidth = 2.6; for (let i = 1; i < 9; i++) { const yy = top + h * i / 9.5, ww = r * .7 * Math.sin(Math.PI * i / 9.5); g.beginPath(); g.moveTo(x - ww, yy + 10); g.quadraticCurveTo(x, yy - 8, x + ww, yy + 10); g.stroke(); } g.restore();
    hiLine(g, [[x - r * .25, top + h * .12], [x - r * .55, top + h * .45], [x - r * .5, y - h * .3]], 2.2, .6);
    for (let i = 0; i < 3; i++) triad(g, x - r * .1 + (R() - .5) * r * .5, top + h * (.25 + .2 * i), 2.4, .8, R() * TAU);
    return;
  }
  const pts = []; for (let k = 0; k < 64; k++) { const a = k / 64 * TAU, rr = r * (1 + .07 * Math.abs(Math.sin(a * 6))); pts.push([x + Math.cos(a) * rr, cy + Math.sin(a) * rr * .92]); }
  const cr = polyPath(pts, true);
  paint(g, cr, VERD, VERD_D, r * .2, 2.8);
  g.save(); g.clip(cr); g.strokeStyle = VERD_L; g.lineWidth = 2.6; g.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * r * .8, lx = x + Math.cos(a) * rr, ly = cy + Math.sin(a) * rr; g.beginPath(); g.arc(lx, ly, 10 + R() * 6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,252,238,.82)'; g.lineWidth = 2.6 * LWH; g.beginPath(); g.arc(x, cy, r * .82, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
  pearls(g, x, cy, r * .9, 9, 2.4, .85, Math.PI * 1.5, Math.PI * 1.95);
  for (let i = 0; i < 4; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * r * .6; triad(g, x + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.4, .8, R() * TAU); }
  for (const [fx, fy] of T.fruit) { const X = x + fx, Y = cy + fy, c = P2(q => q.arc(X, Y, 13, 0, TAU));
    g.fillStyle = 'rgba(20,40,20,.45)'; g.beginPath(); g.arc(X + 2.5, Y + 3, 13, 0, TAU); g.fill();
    leaf(g, c, [X - 13, Y - 13, 26, 26], { lw: 1.8, rimW: 2.5 }); gpush(X, Y, 44, 1); }
}
function drawCloud(g, c) {
  const n = 14, pts = []; for (let k = 0; k <= n; k++) { const u = k / n; pts.push([c.x - c.w / 2 + u * c.w, c.y - Math.sin(u * Math.PI) * 18 * c.s]); }
  const th = 70 * c.s, top = [], bot = [], C = catmull(pts, 4);
  for (let i = 0; i < C.length; i++) { const u = i / (C.length - 1), env = Math.sin(u * Math.PI), b = c.bumps[Math.floor(u * 8.999)], sc = Math.abs(Math.sin(u * Math.PI * 9)) * 22 * c.s * b;
    top.push([C[i][0], C[i][1] - th * env * .7 - sc * env]); bot.push([C[i][0], C[i][1] + th * env * .3]); }
  const p = polyPath(top.concat(bot.reverse()), true);
  g.fillStyle = '#eef0f8'; g.fill(p); rimShade(g, p, 'rgba(110,140,210,.65)', 16); ink(g, p, 2.4); maskErase(g, p);
  g.strokeStyle = 'rgba(80,110,190,.65)'; g.lineWidth = 2.6; for (let k = 1; k < 5; k++) { const i = Math.floor(k / 5 * (C.length - 1)); g.beginPath(); g.arc(C[i][0], C[i][1] - th * .12, th * .26, Math.PI * .1, Math.PI * 1.3); g.stroke(); }
  pearlLine(g, bot.slice(Math.floor(bot.length * .2), Math.floor(bot.length * .8)).map(q => [q[0], q[1] - 9]), 18 * c.s, 2.2, .7);
}

// ---------------------------------------------------------------- the girl (feet at 0,0; facing +x; ~250 units tall)
// layers 0..1: a = gold of the lamp, b = colour, c = ink and white lead (used when she is painted in, layer by layer)
// lift 0..1 raises the lamp from her side to above her head
function girlRig(lift) {
  const L = lift, hand = [lerp(44, 46, L), lerp(-122, -250, L)], tip = [lerp(80, 72, L), lerp(-156, -326, L)];
  return { hand, tip, lamp: [tip[0] + 4, tip[1] + 35], elbow: [lerp(28, 40, L), lerp(-140, -200, L)], hx: lerp(14, 0, L), hy: lerp(-210, -212, L), tilt: lerp(-.06, -.34, L) };
}
function drawGirl(g, G, o = {}) {
  const { x, y, dir } = G, s = o.sc ?? 1.1, lay = o.layers ?? 1, la = clamp(lay * 3), lb = clamp(lay * 3 - 1), lc = clamp(lay * 3 - 2);
  const lift = o.lift ?? (G.lift || 0), step = o.step ?? 0, bob = o.bob ?? 0;
  const rg = girlRig(lift), { hand, tip, lamp, elbow, hx, hy, tilt } = rg;
  g.save(); g.translate(x, y + bob); g.scale(dir * s, s);
  const cloak = P2(q => { q.moveTo(8, -186); q.bezierCurveTo(-14, -190, -34, -176, -42, -140); q.bezierCurveTo(-52, -92, -64, -40, -84 - step * 6, -6); q.bezierCurveTo(-64, 0, -46, -2, -32, -10);
    q.bezierCurveTo(-26, -60, -18, -120, -2, -160); q.closePath(); });
  const robe = P2(q => { q.moveTo(-10, -184); q.bezierCurveTo(4, -190, 18, -186, 22, -170); q.bezierCurveTo(28, -120, 38, -54, 50 + step * 7, -3); q.bezierCurveTo(22, 5, -20, 5, -52 - step * 5, -3); q.bezierCurveTo(-42, -56, -28, -124, -10, -184); q.closePath(); });
  const hairP = () => P2(q => { q.moveTo(12, -16); q.bezierCurveTo(4, -28, -18, -28, -24, -10); q.bezierCurveTo(-30, 6, -30, 24, -40, 40); q.bezierCurveTo(-30, 44, -20, 36, -14, 22); q.bezierCurveTo(-10, 12, -6, 2, -6, -6); q.bezierCurveTo(-2, -12, 8, -12, 16, -8); q.closePath(); });
  const arm = tubePath([[4, -170], elbow, hand], [17, 14, 12]);
  const face = P2(q => q.ellipse(hx, hy, 18, 21, tilt, 0, TAU)), hd = P2(q => q.arc(hand[0], hand[1], 7.5, 0, TAU));
  if (lb > 0) {
    g.save(); g.globalAlpha = lb;
    for (const sx of [-12, 12]) { const sh = P2(q => q.ellipse(sx + (sx > 0 ? step * 7 : -step * 5), 1, 13, 6, 0, 0, TAU)); g.fillStyle = INK; g.fill(sh); }
    g.fillStyle = VERM; g.fill(robe); rimShade(g, robe, VERM_D, 9); maskErase(g, robe);
    g.fillStyle = ULTRA; g.fill(cloak); rimShade(g, cloak, ULTRA_D, 8); maskErase(g, cloak);
    const neck = P2(q => q.rect(hx - 9, hy + 12, 14, 18)); g.fillStyle = '#efcdb0'; g.fill(neck); maskErase(g, neck);
    g.fillStyle = '#f4d8bd'; g.fill(face); rimShade(g, face, '#dcae8e', 3.5); maskErase(g, face);
    g.save(); g.translate(hx, hy); g.rotate(tilt); const hair = hairP(); g.fillStyle = '#b5713a'; g.fill(hair); rimShade(g, hair, '#7a4518', 5); maskErase(g, hair); g.restore();
    g.fillStyle = VERM_L; g.fill(arm); rimShade(g, arm, VERM_D, 5); maskErase(g, arm);
    const st = polyPath([[hand[0] - (tip[0] - hand[0]) * .3, hand[1] - (tip[1] - hand[1]) * .3], tip]); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 4 + 3.5 * LWK; g.stroke(st); g.strokeStyle = '#8a5a30'; g.lineWidth = 4; g.stroke(st);
    g.fillStyle = '#f4d8bd'; g.fill(hd); maskErase(g, hd);
    g.restore();
    if (lc > 0) { g.save(); g.globalAlpha = lc;
      [robe, cloak, face, arm, hd].forEach(p => ink(g, p, 2.4));
      g.save(); g.translate(hx, hy); g.rotate(tilt); ink(g, hairP(), 2.2);
      g.strokeStyle = '#7a4518'; g.lineWidth = 1.7; for (const k of [0, 1, 2]) { g.beginPath(); g.moveTo(-6 - k * 5, -20 + k * 2); g.bezierCurveTo(-16 - k * 4, -6, -18 - k * 4, 14, -26 - k * 4, 34); g.stroke(); }
      hiLine(g, [[-2, -22], [-14, -20], [-20, -10]], 2, .7);
      g.strokeStyle = '#5a3420'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(3, -7); g.quadraticCurveTo(8, -10, 13, -7); g.stroke();
      g.fillStyle = '#2f1d12'; g.beginPath(); g.ellipse(8, -1, 2.2, 2.8, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(15, -3); g.quadraticCurveTo(19, 5, 15, 7); g.stroke();
      g.strokeStyle = '#b5523e'; g.lineWidth = 1.9; g.beginPath(); g.moveTo(7, 12); g.quadraticCurveTo(10, 14, 13, 12); g.stroke();
      g.fillStyle = 'rgba(217,122,138,.4)'; g.beginPath(); g.arc(2, 6, 5, 0, TAU); g.fill();
      g.restore();
      hiLine(g, [[-6, -156], [-14, -100], [-26, -34], [-32, -8]], 2.2, .75); hiLine(g, [[10, -150], [16, -86], [24, -14]], 2, .6); hiLine(g, [[-6, -184], [-30, -160], [-40, -120]], 2.2, .7);
      g.strokeStyle = VERM_D; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-34, -64); g.quadraticCurveTo(-28, -32, -38, -6); g.stroke(); g.beginPath(); g.moveTo(26, -76); g.quadraticCurveTo(34, -40, 36, -6); g.stroke();
      g.strokeStyle = ULTRA_D; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-30, -150); g.quadraticCurveTo(-46, -90, -62, -16); g.stroke();
      // white-lead pearls: a row above the hem, the cloak's front edge, the cuff
      pearlLine(g, [[-46 - step * 4, -17], [-20, -12], [20, -12], [44 + step * 6, -17]], 9, 2.2, .9);
      pearlLine(g, [[-6, -164], [-20, -120], [-28, -60], [-34, -14]], 11, 2, .85);
      triad(g, -2, -134, 2, .9); triad(g, 6, -64, 2, .9);
      g.restore(); }
  }
  if (la > 0) { g.save(); g.globalAlpha = la;
    leafCord(g, P2(q => { q.moveTo(-50 - step * 5, -7); q.bezierCurveTo(-20, 0, 20, 0, 48 + step * 7, -7); }), 6.5, { ink: 2.4 });
    leafCord(g, P2(q => { q.moveTo(-24, -116); q.quadraticCurveTo(2, -110, 28, -118); }), 4.5, { ink: 2 });
    leafCord(g, P2(q => { q.moveTo(-4, -186); q.lineTo(8, -186); }), 5.5, { ink: 2 });
    g.restore(); }
  drawLantern(g, lamp[0], lamp[1], tip, la, o.flame ?? 1, o.t || 0);
  g.restore();
  if (la > 0) gpush(x, y - 8, 80, .8);
  const M = new DOMMatrix().translate(x, y + bob).scale(dir * s, s), q = new DOMPoint(lamp[0], lamp[1]).matrixTransform(M);
  return { lamp: [q.x, q.y] };
}
function drawAureole(g, G, sc, k) {   // a round gold glory behind her (as painters mark the holy or the chosen): vermilion ring, pearls, punched rays
  const cx = G.x, cy = G.y - 128 * sc, R = 118 * sc * eo(k); if (R < 2) return;
  const ring = P2(q => q.arc(cx, cy, R + 12 * sc, 0, TAU)), disc = P2(q => q.arc(cx, cy, R, 0, TAU));
  g.fillStyle = VERM; g.fill(ring); rimShade(g, ring, VERM_D, 5 * sc); ink(g, ring, 2.4); maskErase(g, ring);
  leaf(g, disc, [cx - R, cy - R, R * 2, R * 2], { lw: 2, rimW: 6 * sc, dim: .1 });
  g.save(); g.clip(disc); g.strokeStyle = 'rgba(100,54,6,.5)'; g.lineWidth = 2;
  for (let a = 0; a < 24; a++) { const an = a / 24 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(an) * R * .35, cy + Math.sin(an) * R * .35); g.lineTo(cx + Math.cos(an) * R * .92, cy + Math.sin(an) * R * .92); g.stroke(); }
  g.restore();
  pearls(g, cx, cy, R + 6 * sc, 28, 2.4 * sc, .9);
  gpush(cx, cy - R * .5, 120 * sc, 1.1);
}
function drawLantern(g, x, y, tip, la, flame, t) {
  if (la <= 0) return;
  g.save(); g.globalAlpha = la;
  g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.moveTo(tip[0], tip[1]); g.lineTo(x, y - 30); g.stroke();
  const glass = P2(q => { q.moveTo(x - 14, y - 22); q.lineTo(x + 14, y - 22); q.lineTo(x + 17, y + 14); q.lineTo(x - 17, y + 14); q.closePath(); });
  g.fillStyle = flame > 0 ? '#f3d28c' : '#3a3550'; g.fill(glass); maskErase(g, glass);
  if (flame > 0) {
    const f = Math.floor(t * 10) % 3, wob = [0, 1.5, -1.2][f], hgt = [0, 2, -1.5][f];
    const fl = (w, h, c) => { const p = P2(q => { q.moveTo(x, y + 9); q.bezierCurveTo(x - w, y + 6, x - w * .7, y - h * .5, x + wob, y - h - hgt); q.bezierCurveTo(x + w * .7, y - h * .5, x + w, y + 6, x, y + 9); }); g.fillStyle = c; g.fill(p); return p; };
    const p1 = fl(9, 20, VERM); g.strokeStyle = 'rgba(42,26,16,.7)'; g.lineWidth = 1.2; g.stroke(p1); fl(6, 13, OCHRE_L); fl(3, 7, WHITE);
  }
  ink(g, glass, 1.6);
  const cap = P2(q => { q.moveTo(x - 20, y - 22); q.quadraticCurveTo(x - 16, y - 40, x, y - 42); q.quadraticCurveTo(x + 16, y - 40, x + 20, y - 22); q.closePath(); });
  leaf(g, cap, [x - 20, y - 42, 40, 22], { lw: 1.6, rimW: 2.5 });
  const base = P2(q => q.rect(x - 20, y + 13, 40, 8)); leaf(g, base, [x - 20, y + 13, 40, 8], { lw: 1.6, rimW: 2 });
  for (const bx of [-15, 0, 15]) leafCord(g, polyPath([[x + bx * .9, y - 22], [x + bx * 1.08, y + 14]]), 3, { ink: 1.4 });
  goldPat(g); const ring = P2(q => q.arc(x, y - 46, 5, 0, TAU)); g.strokeStyle = g.__gp; g.lineWidth = 3; g.stroke(ring); g.strokeStyle = INK; g.lineWidth = 1; g.stroke(ring);
  g.restore();
}
// painted glory around the flame: thin gold rays (how a medieval painter draws light)
function drawLampGlory(g, L, a, t) {
  if (a <= 0) return;
  const [x, y] = L; goldPat(g); const zk = Math.min(1, 1.5 / Math.max(ZOOM, .01));
  for (let k = 0; k < 16; k++) { const an = k / 16 * TAU + .1, r0 = 44, r1 = r0 + ((k % 2 ? 40 : 84) * zk * (1 + .05 * Math.sin(t * 9 + k))) * a;
    const p = P2(q => { const w = .05; q.moveTo(x + Math.cos(an - w) * r0, y + Math.sin(an - w) * r0); q.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); q.lineTo(x + Math.cos(an + w) * r0, y + Math.sin(an + w) * r0); q.closePath(); });
    g.save(); g.fillStyle = g.__gp; g.fill(p); g.fillStyle = 'rgba(255,240,190,.3)'; g.fill(p); g.strokeStyle = 'rgba(42,26,16,.6)'; g.lineWidth = .8 * LWK; g.stroke(p); g.restore(); maskPath(g, p); }
}

// ---------------------------------------------------------------- the border (grows from the four corners; k 0..1)
function drawBorder(g, k = 1) {
  if (k <= 0) return;
  const b = BRD, segL = 300;
  g.save();
  const outer = P2(q => { q.rect(-10, -10, WW + 20, WH + 20); q.rect(b, b, WW - 2 * b, WH - 2 * b); });
  const clipG = P2(q => { const L = k * WW * .52, Lh = k * WH * .52; q.rect(-10, -10, L + 10, b + 10); q.rect(WW - L, -10, L + 10, b + 10); q.rect(-10, WH - b, L + 10, b + 10); q.rect(WW - L, WH - b, L + 10, b + 10);
    q.rect(-10, -10, b + 10, Lh + 10); q.rect(-10, WH - Lh, b + 10, Lh + 10); q.rect(WW - b, -10, b + 10, Lh + 10); q.rect(WW - b, WH - Lh, b + 10, Lh + 10); });
  g.clip(clipG); g.clip(outer, 'evenodd');
  const segs = [];
  for (let x = b; x < WW - b; x += segL) segs.push([x, 0, Math.min(segL, WW - b - x), b, 'h']), segs.push([x, WH - b, Math.min(segL, WW - b - x), b, 'h']);
  for (let y = b; y < WH - b; y += segL) segs.push([0, y, b, Math.min(segL, WH - b - y), 'v']), segs.push([WW - b, y, b, Math.min(segL, WH - b - y), 'v']);
  segs.forEach(([sx, sy, sw, sh, o]) => {
    const idx = o === 'h' ? Math.round((sx - b) / segL) : Math.round((sy - b) / segL), col = idx % 2 ? [VERM, VERM_D] : [ULTRA, ULTRA_D];
    const p = P2(q => q.rect(sx, sy, sw, sh)); g.fillStyle = col[0]; g.fill(p); rimShade(g, p, col[1], 12); maskErase(g, p);
    g.strokeStyle = 'rgba(255,252,238,.88)'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath();
    if (o === 'h') { const cy = sy + sh / 2; for (let x = sx + 20; x <= sx + sw - 20; x += 4) { const u = (x - sx) / 60 * TAU; const yy = cy + Math.sin(u) * 16; x === sx + 20 ? g.moveTo(x, yy) : g.lineTo(x, yy); } }
    else { const cx = sx + sw / 2; for (let y = sy + 20; y <= sy + sh - 20; y += 4) { const u = (y - sy) / 60 * TAU; const xx = cx + Math.sin(u) * 16; y === sy + 20 ? g.moveTo(xx, y) : g.lineTo(xx, y); } }
    g.stroke(); g.fillStyle = 'rgba(255,252,238,.9)';
    for (let j = 0; j < 10; j++) { const u = (j + .5) / 10; const dx = o === 'h' ? sx + sw * u : sx + sw / 2 + (j % 2 ? 30 : -30), dy = o === 'h' ? sy + sh / 2 + (j % 2 ? 30 : -30) : sy + sh * u; g.beginPath(); g.arc(dx, dy, 4.5, 0, TAU); g.fill(); }
    ink(g, p, 2.4);
  });
  for (let x = b; x <= WW - b; x += segL) for (const yy of [b / 2, WH - b / 2]) { const c = P2(q => star8(q, x, yy, 32, .45)); leaf(g, c, [x - 32, yy - 32, 64, 64], { lw: 2.2 }); gpush(x, yy, 80, .8); }
  for (let y = b; y <= WH - b; y += segL) for (const xx of [b / 2, WW - b / 2]) { const c = P2(q => star8(q, xx, y, 32, .45)); leaf(g, c, [xx - 32, y - 32, 64, 64], { lw: 2.2 }); gpush(xx, y, 80, .8); }
  for (const [cx, cy] of [[b / 2, b / 2], [WW - b / 2, b / 2], [b / 2, WH - b / 2], [WW - b / 2, WH - b / 2]]) {
    const sq = P2(q => q.rect(cx - b / 2, cy - b / 2, b, b)); leaf(g, sq, [cx - b / 2, cy - b / 2, b, b], { lw: 2.6, rimW: 8 });
    const qf = P2(q => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; q.moveTo(cx + Math.cos(a) * 22 + 20, cy + Math.sin(a) * 22); q.arc(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 20, 0, TAU); } });
    g.fillStyle = ULTRA; g.fill(qf); ink(g, qf, 2.2); maskErase(g, qf);
    const dot = P2(q => q.arc(cx, cy, 12, 0, TAU)); leaf(g, dot, [cx - 12, cy - 12, 24, 24], { lw: 1.8 }); gpush(cx, cy, 90, 1);
    pearls(g, cx, cy, 48, 16, 3, .9);
  }
  g.restore();
  const fil = (inset, w) => { const L = k * WW * .52, Lh = k * WH * .52; const p = new Path2D();
    const e = inset; p.moveTo(e, e + Lh); p.lineTo(e, e); p.lineTo(e + L, e); p.moveTo(WW - e - L, e); p.lineTo(WW - e, e); p.lineTo(WW - e, e + Lh);
    p.moveTo(WW - e, WH - e - Lh); p.lineTo(WW - e, WH - e); p.lineTo(WW - e - L, WH - e); p.moveTo(e + L, WH - e); p.lineTo(e, WH - e); p.lineTo(e, WH - e - Lh); leafCord(g, p, w, { ink: 3 }); };
  fil(8, 13); fil(b - 2, 11);
}

// ---------------------------------------------------------------- the end plaque in the lower border: frame, title in bole → gilded → flash, two lines
const PLQ = { x0: 1720, x1: 3400, y0: 2140, y1: 2640 };
function drawPlaque(g, t, T0) {
  const k = ss(seg(t, T0, T0 + .6)); if (k <= 0) return;
  const { x0, x1, y0, y1 } = PLQ, cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 * (.3 + .7 * eo(k)), cy = (y0 + y1) / 2, hh = (y1 - y0) / 2;
  const outer = P2(q => { const r = 40; q.moveTo(cx - hw + r, cy - hh); q.lineTo(cx + hw - r, cy - hh); q.arc(cx + hw - r, cy - hh + r, r, -Math.PI / 2, 0); q.lineTo(cx + hw, cy + hh - r); q.arc(cx + hw - r, cy + hh - r, r, 0, Math.PI / 2); q.lineTo(cx - hw + r, cy + hh); q.arc(cx - hw + r, cy + hh - r, r, Math.PI / 2, Math.PI); q.lineTo(cx - hw, cy - hh + r); q.arc(cx - hw + r, cy - hh + r, r, Math.PI, Math.PI * 1.5); q.closePath(); });
  g.save(); g.translate(8, 12); g.fillStyle = 'rgba(20,10,30,.35)'; g.fill(outer); g.restore();
  leaf(g, outer, [cx - hw, cy - hh, hw * 2, hh * 2], { lw: 3, rimW: 10 });
  const mid = P2(q => q.rect(cx - hw + 26, cy - hh + 26, hw * 2 - 52, hh * 2 - 52)); paint(g, mid, VERM, VERM_D, 8, 2.6);
  const inner = P2(q => q.rect(cx - hw + 44, cy - hh + 44, hw * 2 - 88, hh * 2 - 88));
  g.fillStyle = VELL; g.fill(inner); g.save(); g.clip(inner); g.globalAlpha = .45; g.fillStyle = g.__sp || (g.__sp = g.createPattern(SPKC, 'repeat')); g.fillRect(cx - hw, cy - hh, hw * 2, hh * 2); g.restore();
  rimShade(g, inner, '#cdb88c', 14); ink(g, inner, 2.4); maskErase(g, inner);
  pearlLine(g, [[cx - hw + 35, cy - hh + 35], [cx + hw - 35, cy - hh + 35]], 22, 3.2, .9);
  pearlLine(g, [[cx - hw + 35, cy + hh - 35], [cx + hw - 35, cy + hh - 35]], 22, 3.2, .9);
  if (k < 1) return;
  // title: first lettered in red bole, then the leaf is laid over it and burnished (a flash), then the two lines are written
  const tb = seg(t, T0 + .5, T0 + 1.1), tg = seg(t, T0 + 1.2, T0 + 1.7), tl = seg(t, T0 + .75, T0 + 1.45);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const ty = cy - 52, title = 'Borrowed Light';
  g.font = '128px Uncial'; const tw = g.measureText(title).width;
  if (tb > 0) { g.save(); g.beginPath(); g.rect(cx - tw / 2 - 10, ty - 130, (tw + 20) * eo(tb), 170); g.clip();
    g.fillStyle = BOLE; g.fillText(title, cx, ty); g.restore(); }
  if (tg > 0) {
    g.save(); g.beginPath(); g.rect(cx - tw / 2 - 10, ty - 130, (tw + 20) * eo(tg), 170); g.clip();
    goldPat(g); g.fillStyle = g.__gp; g.fillText(title, cx, ty);
    g.fillStyle = 'rgba(255,240,180,.18)'; g.fillText(title, cx, ty);
    g.lineWidth = 2.2 * LWK; g.strokeStyle = 'rgba(70,36,6,.9)'; g.strokeText(title, cx, ty);
    g.restore();
    if (MK) { MK.g.setTransform(MK.pre.multiply(g.getTransform())); MK.g.font = '128px Uncial'; MK.g.textAlign = 'center'; MK.g.textBaseline = 'alphabetic'; MK.g.fillStyle = '#fff';
      MK.g.save(); MK.g.beginPath(); MK.g.rect(cx - tw / 2 - 10, ty - 130, (tw + 20) * eo(tg), 170); MK.g.clip(); MK.g.fillText(title, cx, ty); MK.g.restore(); }
  }
  reg('title', title, g, cx - tw / 2, ty - 100, cx + tw / 2, ty + 20);
  if (tl > 0) {
    g.save(); g.beginPath(); g.rect(cx - hw, cy, hw * 2 * eo(tl), hh); g.clip();
    const l2a = '借来的光', l2b = '  ·  金箔彩绘  Gilded Illumination';
    g.font = '500 88px ZhSerif5'; const wa = g.measureText(l2a).width; g.font = '500 80px ZhSerif5'; const wb1 = g.measureText('  ·  金箔彩绘  ').width; g.font = 'italic 82px FellI'; const wb2 = g.measureText('Gilded Illumination').width;
    const tot = wa + wb1 + wb2, x = cx - tot / 2, y2 = cy + 64;
    g.textAlign = 'left'; g.fillStyle = '#4a2c16'; g.font = '500 88px ZhSerif5'; g.fillText(l2a, x, y2);
    g.font = '500 80px ZhSerif5'; g.fillStyle = '#6a4226'; g.fillText('  ·  金箔彩绘  ', x + wa, y2);
    g.font = 'italic 82px FellI'; g.fillText('Gilded Illumination', x + wa + wb1, y2);
    g.textAlign = 'center'; g.font = '74px Fell'; g.fillStyle = VERM_D; g.fillText('LemoLab × Claude Opus 5.5', cx, cy + 172);
    g.restore();
    reg('style', '借来的光 · 金箔彩绘 Gilded Illumination', g, x, y2 - 80, x + tot, y2 + 18);
    reg('credit', 'LemoLab × Claude Opus 5.5', g, cx - 470, cy + 112, cx + 470, cy + 190);
  }
}

// ---------------------------------------------------------------- whole world
// st: { dim, sun: {dim, rayDim, glory, ring}, girls: [{G, layers, flame, lift}], walker: {G, step, lift, bob}, border, plaque: T0, t }
function drawWorld(g, st) {
  DIM = st.dim; GP = [];
  drawSky(g); drawStars(g); drawSun(g, st.sun || { dim: st.dim, glory: 0 });
  for (const c of WD.clouds) if (c.y < 1200) drawCloud(g, c);
  for (const S of WD.far) drawSpire(g, S);
  for (const S of WD.mid) drawSpire(g, S);
  for (const S of WD.massif) drawSpire(g, S);
  drawMeadow(g); drawRiver(g); drawPath(g); drawBridge(g); drawChapel(g); drawTown(g);
  for (const S of WD.shrines) drawShrine(g, S);
  for (const c of WD.clouds) if (c.y >= 1200) drawCloud(g, c);
  const items = [];
  WD.trees.forEach(T => items.push({ y: T.y, f: () => { drawTree(g, T, false); drawTree(g, T, true); } }));
  const lamps = [];
  (st.girls || []).filter(o => o.layers > 0).forEach(o => items.push({ y: o.G.y + 1, f: () => { if (o.aur > 0) drawAureole(g, o.G, o.sc || 1.1, o.aur); const r = drawGirl(g, o.G, { layers: o.layers, flame: o.flame, lift: o.lift, sc: o.sc, t: st.t }); if (o.flame > 0 && o.layers > .34) lamps.push(r.lamp); } }));
  if (st.walker) items.push({ y: st.walker.G.y + 1, f: () => { const r = drawGirl(g, st.walker.G, { step: st.walker.step, lift: st.walker.lift, bob: st.walker.bob, flame: 1, t: st.t }); lamps.push(r.lamp); } });
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());
  drawBorder(g, st.border || 0);
  if (st.plaque != null) drawPlaque(g, st.t, st.plaque);
  return lamps;
}
