// ---------- timeline ----------
const DUR = 113.6; window.DUR = DUR;
const VO = [ // id, start, duration, English, Chinese
  ['v01', 3.8, 5.9, 'Australia is the driest inhabited continent. To understand its plants, follow the rain.', '澳大利亚是最干旱的有人居住的大陆。想读懂它的植物，就跟着雨走。'],
  ['v02', 11.8, 4.25, 'At the red centre, less than 250 millimetres falls in a year.', '在红色中心，一年的降雨不到 250 毫米。'],
  ['v03', 17.2, 4.46, 'Spinifex curls into spiky hummocks. They cover about a fifth of the land.', '三齿稃（spinifex）卷成带刺的草丘，覆盖约五分之一的国土。'],
  ['v04', 23.6, 7.42, 'A little more rain, and the acacias arrive. Mulga tilts its branches upward, funnelling every drop down to its roots.', '雨多一点，金合欢就来了。穆加树把枝条斜斜举起，把每一滴雨引到根部。'],
  ['v05', 34.3, 6.26, 'Then come the eucalypts. More than 800 species, making up three quarters of Australia’s forests.', '接着是桉树。八百多个物种，占澳洲森林的四分之三。'],
  ['v06', 41.8, 1.71, 'Fire is part of the rhythm here.', '在这里，火是节奏的一部分。'],
  ['v07', 47.2, 4.55, 'Within weeks, blackened trunks sprout again, from buds hidden deep beneath the bark.', '几周之内，烧黑的树干重新发芽——芽就藏在树皮深处。'],
  ['v08', 53.4, 6.8, 'In the wet mountains, mountain ash, one of the tallest flowering plants on Earth, reaches for a hundred metres.', '在湿润的山区，王桉——地球上最高的开花植物之一——向着一百米伸展。'],
  ['v09', 61.5, 6.26, 'And where the rain barely stops: rainforest. Layer upon layer, on less than one percent of the land.', '而在雨几乎不停的地方：雨林。层层叠叠，只占国土的不到百分之一。'],
  ['v10', 75.0, 4.5, 'But this walk, from desert to rainforest, is also a walk back in time.', '但这段从沙漠到雨林的路，也是一段回到过去的路。'],
  ['v11', 80.8, 4.06, 'Fifty million years ago, rainforest spread across much of Australia.', '五千万年前，雨林铺满了澳洲的大部分土地。'],
  ['v12', 86.4, 7.3, 'As the continent drifted north and dried, the green retreated to the edges, and tough, fire-ready bush claimed the heart.', '大陆向北漂移、日渐干旱，绿色退到边缘，耐旱、与火共生的灌丛占据了腹地。'],
  ['v13', 97.3, 3.39, 'Dry at the heart. Green at the edge. And still changing.', '干燥的心，绿色的边。而它仍在变化。'],
];
window.VO = VO;

const LAY = {
  far: { par: .25, gy: 640, sc: .38, alpha: .5 },
  mid: { par: .55, gy: 690, sc: .62, alpha: .78 },
  main: { par: 1, gy: 745, sc: 1, alpha: 1 },
  fg: { par: 1.55, gy: 1115, sc: 1.75, alpha: .95 },
};
const ZONES = [['desert', -1600, 2500], ['mulga', 2500, 4700], ['wood', 4700, 7300], ['wet', 7300, 8700], ['rain', 8700, 13000]];
const zoneOf = wx => { for (const z of ZONES) if (wx < z[2]) return z[0]; return 'rain'; };
const zoneJit = (wx, w = 240) => zoneOf(wx + rnd(-w, w));
const camXf = monotone([[0, 700], [10.3, 700], [16, 1400], [22, 2150], [28, 3400], [33, 4100], [37, 4750], [41, 5500], [45, 5850], [51, 6350], [54, 7300], [58.5, 7550], [61.2, 8250], [66, 9300], [73, 9800]]);
const camYf = t => 980 * (eio(seg(t, 54.2, 57.8)) - eio(seg(t, 58.4, 60.9)));
const REV = t => lerp(-300, 1650, eio(seg(t, 10.2, 13.4)));
const RAINK = [[-1600, 150], [700, 160], [2500, 250], [4700, 500], [7300, 900], [8700, 1800], [9400, 2800], [10200, 3600], [13000, 4000]];
function rainAt(wx) { for (let i = 0; i < RAINK.length - 1; i++) { const [a, ra] = RAINK[i], [b, rb] = RAINK[i + 1]; if (wx <= b) return Math.exp(lerp(Math.log(ra), Math.log(rb), clamp((wx - a) / (b - a)))); } return 4000; }
const FIRE = { x0: 5650, x1: 6900 };
const fireT0 = x => 41.6 + (x - FIRE.x0) / (FIRE.x1 - FIRE.x0) * 3.0;
const regrowT0 = x => 47.4 + (x - FIRE.x0) / (FIRE.x1 - FIRE.x0) * 1.6;

// ---------- world ----------
const PL = { far: [], mid: [], main: [], fg: [] };
const HERO = {};
function add(lay, wx, gen, sc, o = {}) {
  const L = LAY[lay], g = gen(sc * L.sc, ...(o.args || []));
  const pl = Object.assign({ lay, wx, xl: wx * L.par, dy: o.dy ?? rnd(0, lay === 'main' ? 30 : 10), g, st: g.S, span: o.span ?? 380, sway: o.sway ?? 0, ph: rnd(0, 6.28) }, o.extra || {});
  if (!pl.st.length) return pl;
  pl.spr = sprite(pl.st);
  PL[lay].push(pl);
  return pl;
}
function build() {
  // main layer: hero plants placed first
  HERO.spin = add('main', 1450, spinifex, 1.7, { dy: 16 });
  HERO.oak1 = add('main', 880, desertOak, 1.25, { dy: 4, sway: .012 });
  HERO.oak2 = add('main', 2230, desertOak, 1.1, { dy: 2, sway: .012 });
  HERO.mulga = add('main', 3500, mulga, 1.55, { dy: 12, sway: .01 });
  HERO.koala = add('main', 4960, gum, 1.12, { dy: 8, sway: .006 });
  HERO.ash = add('main', 7560, ash, 1, { dy: 6 });
  HERO.emer = add('main', 9420, rfTree, 1.05, { dy: 2, args: [{ emergent: true }] });
  const heroX = [1450, 880, 2230, 3500, 4960, 7560];
  const nearHero = (wx, d) => heroX.some(h => Math.abs(h - wx) < d);
  for (let wx = -1300; wx < 12000;) {
    const z = zoneJit(wx);
    if (z === 'desert') { if (!nearHero(wx, 110)) add('main', wx, rnd() < .16 ? desertOak : spinifex, rnd(.6, 1.2), { sway: .01 }); wx += rnd(120, 250); }
    else if (z === 'mulga') { if (!nearHero(wx, 120)) { const r = rnd(); add('main', wx, r < .45 ? mulga : r < .75 ? saltbush : r < .87 ? wattle : spinifex, rnd(.75, 1.15), { sway: .01 }); } wx += rnd(120, 220); }
    else if (z === 'wood') { if (!nearHero(wx, 140)) add('main', wx, gum, rnd(.85, 1.2), { sway: .006 }); for (let k = 0; k < 4; k++) add('main', wx + rnd(20, 240), tussock, rnd(.8, 1.2), { sway: .03 }); wx += rnd(220, 330); }
    else if (z === 'wet') { if (!nearHero(wx, 120)) { if (rnd() < .5) add('main', wx, ash, rnd(.85, 1), { dy: rnd(0, 10) }); } add('main', wx + rnd(30, 120), treeFern, rnd(.8, 1.15), { sway: .01 }); add('main', wx + rnd(0, 150), groundFern, rnd(.9, 1.3), { sway: .02 }); wx += rnd(130, 190); }
    else {
      const r = rnd();
      if (Math.abs(wx - 9420) > 110) add('main', wx, r < .6 ? rfTree : r < .8 ? fanPalm : treeFern, rnd(.85, 1.15), { sway: .006, dy: rnd(0, 14) });
      if (rnd() < .55) add('main', wx + rnd(-60, 60), vine, rnd(.9, 1.1), { dy: 0 });
      add('main', wx + rnd(-40, 80), shrub, rnd(.8, 1.3), { sway: .01, dy: rnd(16, 28) });
      add('main', wx + rnd(0, 120), groundFern, rnd(.9, 1.4), { sway: .02, dy: rnd(22, 34) });
      if (rnd() < .5) add('main', wx + rnd(0, 120), fanPalm, rnd(.7, .95), { dy: rnd(18, 30), sway: .01 });
      wx += rnd(70, 110);
    }
  }
  // fire-zone plants: record burnt/resprouting state
  for (const pl of PL.main) if (pl.wx > FIRE.x0 && pl.wx < FIRE.x1) {
    pl.fire = { ft: fireT0(pl.wx), rg: regrowT0(pl.wx) };
    pl.burnt = sprite(pl.g.woody || pl.st, '#2a2320');
    if (pl.g.shoots) pl.shoots = pl.g.shoots;
    else pl.shoots = tussock(rnd(.6, .8), ['#8fbf5a', '#7fb24f', '#9fcb62'], 10).S;
  }
  // midground
  for (let wx = -1300; wx < 12500;) {
    const z = zoneJit(wx, 300);
    if (z === 'desert') { add('mid', wx, rnd() < .25 ? desertOak : spinifex, rnd(.5, .9)); wx += rnd(220, 420); }
    else if (z === 'mulga') { add('mid', wx, rnd() < .7 ? mulga : saltbush, rnd(.6, .9)); wx += rnd(110, 190); }
    else if (z === 'wood') { add('mid', wx, gum, rnd(.55, .8), { args: [.9] }); if (rnd() < .6) add('mid', wx + 60, tussock, .8); wx += rnd(130, 210); }
    else if (z === 'wet') { if (rnd() < .6) add('mid', wx, ash, rnd(.5, .6)); add('mid', wx + rnd(0, 80), treeFern, rnd(.7, .9)); wx += rnd(110, 170); }
    else { add('mid', wx, rnd() < .8 ? rfTree : fanPalm, rnd(.7, .95), { args: [{ noButt: true }] }); add('mid', wx + rnd(0, 60), shrub, rnd(.8, 1.1)); wx += rnd(60, 100); }
  }
  // background
  HERO.uluru = add('far', 2540, uluru, 1, { dy: 0, extra: { alpha: .92, cxFade: [3700, 4700] } });
  for (let wx = 2600; wx < 13000;) {
    const z = zoneJit(wx, 300);
    const cols = z === 'mulga' ? COL.mulga : z === 'wood' ? COL.gum : z === 'wet' ? COL.ash : COL.rain;
    if (z !== 'desert') add('far', wx, farTree, rnd(.8, 1.2), { args: [cols, z === 'wet' ? 1.8 : 1], dy: rnd(-40, 0) + ridgeFar(wx) });
    wx += z === 'mulga' ? rnd(260, 520) : z === 'wood' ? rnd(160, 300) : rnd(110, 190);
  }
  // foreground
  for (let wx = -800; wx < 12500;) {
    const z = zoneJit(wx, 200);
    const gen = z === 'desert' ? spinifex : z === 'mulga' ? saltbush : z === 'wood' ? tussock : z === 'wet' ? groundFern : groundFern;
    add('fg', wx, gen, rnd(.8, 1.2), { sway: .02, dy: rnd(0, 40) });
    wx += z === 'rain' ? rnd(300, 500) : rnd(600, 1000);
  }
  for (const k in PL) PL[k].sort((a, b) => a.dy - b.dy);
  // clouds in the sky
  for (let wx = 4200; wx < 13000;) {
    const z = zoneOf(wx);
    CLOUDS.push({ wx, xl: wx * .2, y: rnd(130, 360), g: cloud(rnd(.7, 1.2), z === 'rain' || z === 'wet' ? '#9aa9ae' : '#b6c0c0') });
    wx += z === 'rain' || z === 'wet' ? rnd(350, 650) : rnd(900, 1600);
  }
  for (const c of CLOUDS) c.spr = sprite(c.g.S);
  buildStrips();
  buildHorizon();
}
const CLOUDS = [];

// far/mid ridge profiles (height relative to each layer's horizon, negative is up)
function ampAt(wx, table) { // smooth transition between zones
  let v = 0, wsum = 0;
  for (const [name, a, b] of ZONES) { const c = (a + b) / 2, half = (b - a) / 2 + 300; const w = clamp(1 - Math.abs(wx - c) / half) ** 2; v += w * table[name]; wsum += w; }
  return v / (wsum || 1);
}
const FAR_AMP = { desert: 14, mulga: 55, wood: 45, wet: 190, rain: 110 };
const MID_AMP = { desert: 8, mulga: 22, wood: 26, wet: 55, rain: 40 };
const ridgeFar = wx => -ampAt(wx, FAR_AMP) * (fbm(wx / 900) * .75 + fbm(wx / 260 + 9) * .35);
const ridgeMid = wx => -ampAt(wx, MID_AMP) * (fbm(wx / 600 + 3) * .8 + fbm(wx / 180 + 5) * .3);
const ZCOL = {
  far: { desert: '#dcae8e', mulga: '#c89b8c', wood: '#bdb99c', wet: '#9fb1b8', rain: '#9ab19f' },
  far2: { desert: '#e6c6ab', mulga: '#d9b8ab', wood: '#d3cfb6', wet: '#bfcbcf', rain: '#bccbbe' },
  mid: { desert: '#dba47e', mulga: '#d0ae80', wood: '#cbc28f', wet: '#98aa8a', rain: '#6f8d6d' },
  ground: { desert: '#dda27a', mulga: '#dbb584', wood: '#dccb92', wet: '#a7b48e', rain: '#6e8b69' },
  sky: { desert: '#f0d6b8', mulga: '#efdcc6', wood: '#ece2cd', wet: '#dfe3dc', rain: '#dbe3d8' },
};
function zoneGrad(c, par, table, x0) {
  const WX0 = -1600, WX1 = 13000, g = c.createLinearGradient((WX0 * par) - x0, 0, (WX1 * par) - x0, 0);
  for (const [name, a, b] of ZONES) { const m = ((Math.max(a, WX0) + Math.min(b, WX1)) / 2 - WX0) / (WX1 - WX0); g.addColorStop(clamp(m), table[name]); }
  return g;
}
const STRIP = {};
function mkStrip(par, yTop, yBot, wx0 = -1600) {
  const x0 = wx0 * par - 1000, x1 = 13000 * par + 1000, cv = document.createElement('canvas');
  cv.width = Math.ceil(x1 - x0); cv.height = yBot - yTop;
  const c = cv.getContext('2d'); c.translate(-x0, -yTop);
  return { cv, c, x0, yTop, par };
}
function washPoly(c, pts, fill, a, passes = 3, jit = 5) {
  for (let p = 0; p < passes; p++) {
    c.beginPath(); pts.forEach(([x, y], i) => { const yy = y + (i % 3 === 0 ? rnd(-jit, jit) : 0); i ? c.lineTo(x, yy) : c.moveTo(x, yy); });
    c.closePath(); c.globalAlpha = a / passes * 1.6; c.fillStyle = fill; c.fill();
  }
  c.globalAlpha = 1;
}
function buildStrips() {
  // background: two layers of hills
  const F = STRIP.far = mkStrip(.25, 150, 1500, -6000), gF = LAY.far.gy;
  for (const [band, dy, a] of [['far2', -40, .5], ['far', 0, .62]]) {
    const pts = []; for (let wx = -6000; wx <= 13000; wx += 16) { pts.push([wx * .25, gF + dy + ridgeFar(wx + (band === 'far2' ? 3000 : 0)) * (band === 'far2' ? 1.3 : 1)]); }
    pts.push([13000 * .25, 1500], [-6000 * .25, 1500]);
    washPoly(F.c, pts, zoneGrad(F.c, .25, ZCOL[band], 0), a);
  }
  // midground ground
  const M = STRIP.mid = mkStrip(.55, 200, 1500, -4000), gM = LAY.mid.gy;
  { const pts = []; for (let wx = -4000; wx <= 13000; wx += 12) pts.push([wx * .55, gM + ridgeMid(wx)]); pts.push([13000 * .55, 1500], [-4000 * .55, 1500]); washPoly(M.c, pts, zoneGrad(M.c, .55, ZCOL.mid, 0), .5); }
  // forest wall behind the rainforest: layer upon layer of canopy
  for (const [col, lift, a] of [['#8fab92', 250, .45], ['#5f8a68', 170, .5]]) {
    const pts = [];
    for (let wx = 7900; wx <= 13000; wx += 14) { const k = ss(seg(wx, 8200, 9000)); pts.push([wx * .55, gM - k * (lift + fbm(wx / 140 + lift) * 90 + Math.abs(Math.sin(wx / 55 + lift)) * 26)]); }
    pts.push([13000 * .55, gM + 10], [7900 * .55, gM + 10]); washPoly(M.c, pts, col, a, 3, 3);
  }
  for (let wx = 8300; wx < 13000; wx += rnd(10, 22)) { const k = ss(seg(wx, 8300, 9000)); if (rnd() > k) continue; const y = gM - rnd(20, 230) * k; drawS(M.c, mk(qcurve(wx * .55, y, wx * .55 + rnd(8, 16), y + rnd(-4, 4), 2, 4), rnd(7, 12), pick(COL.rain), { prof: 'leaf', nb: 0, a: .45 })); }
  // main-layer ground
  const G = STRIP.ground = mkStrip(1, 735, 1080), gG = LAY.main.gy;
  { const pts = []; for (let wx = -1600; wx <= 13000; wx += 20) pts.push([wx, gG + 2 + Math.sin(wx / 300) * 2]); pts.push([13000, 1080], [-1600, 1080]);
    const grad = zoneGrad(G.c, 1, ZCOL.ground, 0); washPoly(G.c, pts, grad, .5);
    const v = G.c.createLinearGradient(0, gG, 0, 1080); v.addColorStop(0, 'rgba(241,233,218,0)'); v.addColorStop(1, 'rgba(241,233,218,.55)'); G.c.fillStyle = v; G.c.fillRect(-1600, gG, 14600, 1080 - gG); }
  // ground texture: sand ripples / grass / leaf litter
  for (let wx = -1500; wx < 12900;) {
    const z = zoneOf(wx), y = rnd(gG + 20, 1060);
    if (z === 'desert') { const L = rnd(80, 220); drawS(G.c, mk(qcurve(wx, y, wx + L, y + rnd(-6, 6), rnd(-10, 10), 10), rnd(2, 3.5), '#c07e57', { prof: 'leaf', nb: 0, a: .45 })); wx += rnd(20, 70); }
    else if (z === 'mulga') { drawS(G.c, mk(qcurve(wx, y, wx + rnd(20, 60), y, rnd(-4, 4), 5), rnd(2, 3), '#b98f5f', { prof: 'leaf', nb: 0, a: .4 })); wx += rnd(25, 70); }
    else if (z === 'wood') { for (let k = 0; k < 3; k++) drawS(G.c, mk(polar(wx + k * 4, y, -Math.PI / 2 + rnd(-.4, .4), rnd(10, 22), 2, 4), 2, pick(COL.gold), { prof: 'tip', nb: 0, a: .6 })); wx += rnd(14, 40); }
    else if (z === 'wet') { drawS(G.c, mk(qcurve(wx, y, wx + rnd(10, 25), y + rnd(-3, 3), 2, 4), rnd(4, 7), pick(['#7f9268', '#6f835c', '#94a37c']), { prof: 'leaf', nb: 0, a: .5 })); wx += rnd(12, 34); }
    else { drawS(G.c, mk(qcurve(wx, y, wx + rnd(8, 20), y + rnd(-4, 4), 2, 4), rnd(5, 8), pick(['#3f6b4f', '#56805a', '#2f5a45', '#6b8f5e']), { prof: 'leaf', nb: 0, a: .55 })); wx += rnd(8, 22); }
  }
}
const HORIZ = [];
function buildHorizon() {
  for (let wx = -1600; wx < 13000; wx += 620) {
    const pts = qcurve(wx, LAY.main.gy + rnd(-2, 2), wx + 660, LAY.main.gy + rnd(-2, 2), rnd(-3, 3), 24);
    const z = zoneOf(wx + 300);
    HORIZ.push({ wx, s: mk(pts, 5.2, z === 'desert' ? '#6e3a24' : z === 'mulga' ? '#5b3b27' : INK2, { prof: 'even', nb: 5, a: .88, rough: .3 }) });
  }
}

// ---------- drawing: landscape ----------
const lx = (l, xl, cx) => 960 + xl - cx * LAY[l].par;
function drawStripAt(S, cx, cy, reveal) {
  const X = 960 - cx * S.par + S.x0, Y = S.yTop + cy * S.par;
  ctx.save();
  if (reveal < 1) { // reveal along the brush edge
    const R = lerp(-150, 2100, reveal); ctx.beginPath(); ctx.moveTo(-10, -10);
    for (let y = -10; y <= 1090; y += 40) ctx.lineTo(R + (vnoise(y * .02) - .5) * 160, y);
    ctx.lineTo(-10, 1090); ctx.closePath(); ctx.clip();
  }
  ctx.drawImage(S.cv, Math.round(X), Math.round(Y));
  ctx.restore();
}
function plantP(pl, t, sx) {
  let p = clamp((REV(t) - sx) / (pl.span * Math.max(.55, LAY[pl.lay].par)));
  if (pl.burst !== undefined) p = Math.max(p, clamp((t - pl.burst) / .9));
  if (pl.fire && t > 40.5) p = 1;
  return p;
}
function drawPlants(lay, t, cx, cy, hook) {
  const L = LAY[lay];
  for (const pl of PL[lay]) {
    const X = lx(lay, pl.xl, cx), Y = L.gy + pl.dy + cy * L.par;
    if (X + pl.spr.x1 < -60 || X + pl.spr.x0 > W + 60) continue;
    const p = plantP(pl, t, X); if (p <= 0) continue;
    const sk = pl.sway ? pl.sway * Math.sin(t * 1.15 + pl.ph) + pl.sway * .4 * Math.sin(t * 2.7 + pl.ph * 2) : 0;
    ctx.setTransform(1, 0, sk, 1, X, Y); ctx.globalAlpha = (pl.alpha ?? L.alpha) * (pl.cxFade ? 1 - ss(seg(cx, pl.cxFade[0], pl.cxFade[1])) : 1); if (ctx.globalAlpha <= 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; continue; }
    if (pl.fire && t > pl.fire.ft + .2) {
      const c = seg(t, pl.fire.ft + .2, pl.fire.ft + 1.5);
      if (c < 1) { ctx.globalAlpha = L.alpha * (1 - c); ctx.drawImage(pl.spr.cv, pl.spr.x0, pl.spr.y0); }
      ctx.globalAlpha = L.alpha * c * (pl.g.woody ? 1 : .55); ctx.drawImage(pl.burnt.cv, pl.burnt.x0, pl.burnt.y0);
      ctx.globalAlpha = 1;
      if (t > pl.fire.rg) drawList(ctx, pl.shoots, seg(t, pl.fire.rg, pl.fire.rg + 2.4));
    } else if (p >= 1) ctx.drawImage(pl.spr.cv, pl.spr.x0, pl.spr.y0);
    else drawList(ctx, pl.st, p);
    if (hook) hook(pl, X, Y, sk, p);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  }
}
const zoneW = (cx, name) => { const [, a, b] = ZONES.find(z => z[0] === name); return clamp(1 - Math.max(a - cx, cx - b, 0) / 500); };
function mixZone(cx, table) {
  let r = 0, g = 0, b = 0, s = 0;
  for (const [name] of ZONES) { const w = zoneW(cx, name); if (!w) continue; const c = hex2rgb(table[name]); r += c[0] * w; g += c[1] * w; b += c[2] * w; s += w; }
  return '#' + [r, g, b].map(v => Math.round(v / s).toString(16).padStart(2, '0')).join('');
}
function drawSky(t, cx, cy) {
  const a = ss(seg(t, 10, 13.5));
  if (a > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, LAY.main.gy + cy);
    g.addColorStop(0, rgba(PAPER, 0)); g.addColorStop(1, rgba(mixZone(cx, ZCOL.sky), .9 * a));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, LAY.main.gy + cy);
  }
  // vermilion sun: like a seal stamp
  const sa = ss(seg(t, 1.6, 2.1)) * (1 - .75 * ss(seg(cx, 3800, 6000))) * (1 - ss(seg(cx, 6600, 7400)));
  if (sa > 0) {
    const pop = 1 + .12 * (1 - eo(seg(t, 1.6, 2.2)));
    withSeed(77, () => {
      ctx.save(); ctx.translate(1480 - cx * .02, 250 + cy * .1); ctx.scale(pop, pop);
      ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = rgba('#cf4f2c', .82 * sa); ctx.fill();
      for (let i = 0; i < 7; i++) { const y = -46 + i * 15; drawS(ctx, mk(qcurve(-Math.sqrt(58 * 58 - y * y) + 4, y, Math.sqrt(58 * 58 - y * y) - 4, y + rnd(-2, 2), 0, 8), 6, '#b8401f', { prof: 'even', nb: 3, a: .35 }), 1, null, sa); }
      ctx.restore();
    });
  }
  for (const c of CLOUDS) {
    const X = 960 + c.xl - cx * .2, Y = c.y + cy * .15;
    if (X + c.spr.x1 < 0 || X + c.spr.x0 > W) continue;
    const ca = ss(seg(cx, c.wx - 1900, c.wx - 1000)) * (1 - ss(seg(cx, c.wx + 2600, c.wx + 3600))); if (ca <= 0) continue;
    ctx.globalAlpha = ca; ctx.drawImage(c.spr.cv, X + c.spr.x0, Y + c.spr.y0); ctx.globalAlpha = 1;
  }
}
function drawHorizon(t, cx, cy) {
  const sweep = lerp(-100, 2050, eio(seg(t, .5, 2.8)));
  for (const h of HORIZ) {
    const X = 960 + h.wx - cx; if (X > W || X + 700 < 0) continue;
    ctx.setTransform(1, 0, 0, 1, 960 - cx, cy);
    drawS(ctx, h.s, clamp((sweep - X) / 660));
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function mistBand(y0, y1, a, col = PAPER) {
  if (a <= 0) return; const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
}

// ---------- animals ----------
const BEAT0 = 11.865, BEAT = .5805;
function roo(X, Y, s, ph, seed) {
  const air = ph < .62, h = air ? Math.sin(Math.PI * ph / .62) : 0, lift = h * 40 * s;
  const crouch = air ? 0 : Math.sin(Math.PI * (ph - .62) / .38);
  withSeed(seed, () => {
    ctx.save(); ctx.translate(X, Y - lift); ctx.rotate(-.12 * h + .05 * crouch); ctx.scale(s, s);
    const R1 = '#a8532f', R2 = '#7f3b22', S = [];
    S.push(mk(qcurve(-8, -34 + crouch * 4, 24, -74 + crouch * 6, 10, 8), 34, R1, { prof: 'tip', nb: 5 }));
    S.push(mk(qcurve(22, -78 + crouch * 6, 44, -82 + crouch * 6, -3, 5), 13, R1, { prof: 'tip', nb: 0 }));
    S.push(mk(qcurve(24, -84 + crouch * 6, 19, -99 + crouch * 6, 2, 4), 5, R1, { prof: 'tip', nb: 0 }));
    S.push(mk(qcurve(29, -84 + crouch * 6, 28, -100 + crouch * 6, -2, 4), 5, R2, { prof: 'tip', nb: 0 }));
    S.push(mk(qcurve(20, -64, 31, -52 + h * 4, 4, 4), 4.5, R2, { prof: 'tip', nb: 0 }));
    S.push(mk(qcurve(-6, -38, 6, -16, -6, 5), 17, R1, { prof: 'tip', nb: 3 }));
    const fx = lerp(30, -26, h), fy = lerp(-1, -6, h);
    S.push(mk(qcurve(2, -10, fx, fy, 0, 4), 6.5, R2, { prof: 'tip', nb: 0 }));
    S.push(mk(qcurve(-12, -32, -64, lerp(-2, -26, h), lerp(-10, 6, h), 8), 12, R1, { prof: 'tip', nb: 3 }));
    for (const st of S) drawS(ctx, st);
    ctx.beginPath(); ctx.arc(33, -84 + crouch * 6, 1.8, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
  });
}
function cassowary(X, Y, s, t) {
  const ph = t * 2.2;
  withSeed(91, () => {
    ctx.save(); ctx.translate(X, Y); ctx.scale(-s, s); // facing left
    const bob = Math.abs(Math.sin(ph)) * 3;
    for (const k of [0, 1]) { const a = Math.sin(ph + k * Math.PI) * .35; drawS(ctx, mk(qcurve(k * 6, -44 - bob, k * 6 + Math.sin(a) * 40, 0, 4, 5), 5, '#5f5a50', { prof: 'even', nb: 0 })); }
    drawS(ctx, mk(qcurve(-34, -58 - bob, 22, -66 - bob, -22, 9), 34, '#1f1b19', { prof: 'leaf', nb: 0 }));
    for (let k = 0; k < 11; k++) { const u = k / 10, x = lerp(-36, 20, u), y = -62 - bob - Math.sin(Math.PI * u) * 20; drawS(ctx, mk(qcurve(x, y, x - 6 - u * 4, y + 26 + Math.sin(Math.PI * u) * 12, -3, 5), 7, '#1f1b19', { prof: 'tip', nb: 0, a: .9 })); }
    drawS(ctx, mk(qcurve(20, -76 - bob, 30, -108 - bob, 4, 6), 9, '#3a78b8', { prof: 'even', nb: 0 }));
    drawS(ctx, mk(qcurve(29, -108 - bob, 42, -110 - bob, 0, 4), 9, '#3a78b8', { prof: 'tip', nb: 0 }));
    drawS(ctx, mk(qcurve(29, -112 - bob, 28, -126 - bob, -3, 4), 8, '#8a7458', { prof: 'tip', nb: 0 }));
    drawS(ctx, mk(qcurve(25, -92 - bob, 23, -80 - bob, 2, 4), 5, '#c8352a', { prof: 'tip', nb: 0 }));
    drawS(ctx, mk(qcurve(41, -110 - bob, 49, -108 - bob, 0, 3), 3, INK, { prof: 'tip', nb: 0 }));
    ctx.restore();
  });
}
function koala(X, Y, s, a, t) {
  withSeed(55, () => {
    ctx.save(); ctx.translate(X, Y); ctx.scale(s, s); ctx.globalAlpha = a; ctx.rotate(.06 * Math.sin(t * .9));
    drawS(ctx, mk(qcurve(0, 0, 2, -30, 3, 6), 32, '#8e8a85', { prof: 'leaf', nb: 5 }));
    for (const ex of [-17, 17]) { drawS(ctx, mk(qcurve(ex - 3, -48, ex + 3, -50, 0, 3), 17, '#9c9893', { prof: 'leaf', nb: 3 })); drawS(ctx, mk(qcurve(ex - 1, -48, ex + 2, -49, 0, 3), 8, '#dcd6cc', { prof: 'leaf', nb: 0 })); }
    drawS(ctx, mk(qcurve(-12, -40, 13, -40, -3, 6), 25, '#95918c', { prof: 'leaf', nb: 3 }));
    drawS(ctx, mk(qcurve(1, -42, 1, -34, 0, 3), 8, '#2a2522', { prof: 'leaf', nb: 0 }));
    const blink = (t % 3.1) < .12 ? .2 : 1;
    for (const ex of [-7, 9]) { ctx.beginPath(); ctx.ellipse(ex, -45, 1.8, 1.8 * blink, 0, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
    drawS(ctx, mk(qcurve(-10, -18, 12, -22, 4, 4), 5, '#77736e', { prof: 'even', nb: 0 }));
    ctx.restore();
  });
}
function budgies(t) {
  if (t < 25.2 || t > 33) return;
  for (let i = 0; i < 16; i++) {
    const X = 2150 - 330 * (t - 25.2) + (hash(i) - .5) * 260 + Math.sin(t * 1.7 + i) * 10, Y = 270 + 45 * Math.sin(t * 1.2) + (hash(i + 9) - .5) * 110 + Math.sin(t * 2.3 + i * 2) * 8;
    if (X < -30 || X > W + 30) continue;
    const f = Math.sin(t * 19 + i * 1.7), s = 1.2 + hash(i + 3) * .5;
    ctx.save(); ctx.translate(X, Y); ctx.scale(s, s);
    ctx.strokeStyle = rgba('#4f8a3a', .9); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-9, -f * 7); ctx.quadraticCurveTo(-4, -3, 0, 0); ctx.quadraticCurveTo(4, -3, 9, -f * 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 1, 5, 2.6, 0, 0, 7); ctx.fillStyle = rgba('#6fae4a', .95); ctx.fill();
    ctx.beginPath(); ctx.arc(-4.5, 0, 2.2, 0, 7); ctx.fillStyle = rgba('#e3c64a', .95); ctx.fill();
    ctx.restore();
  }
}
// flames: a few tapering warm strokes
function flame(X, Y, h, t, i) {
  if (h < 2) return;
  withSeed(300 + i, () => {
    for (const [col, wf, hf, a] of [['#d9542a', 1, 1, .78], ['#ee8a35', .62, .78, .85], ['#f7c75c', .3, .5, .9]]) {
      const pts = []; for (let k = 0; k <= 8; k++) { const s = k / 8, y = -h * hf * s; pts.push([Math.sin(s * 3 + t * 9 + i) * h * .16 * s + Math.sin(t * 17 + i * 3) * 2 * s, y]); }
      const st = mk(pts.map(([x, y]) => [X + x, Y + y]), h * .34 * wf, col, { prof: 'tip', nb: 0, a });
      drawS(ctx, st);
    }
  });
}
function drawFire(t, cx, cy) {
  if (t < 41.4 || t > 49.5) return;
  const gy = LAY.main.gy + cy;
  // smoke
  for (let k = 0; k < 26; k++) {
    const x = FIRE.x0 + hash(k) * (FIRE.x1 - FIRE.x0), ft = fireT0(x), age = t - ft - .3; if (age < 0 || age > 6) continue;
    const X = 960 + x - cx + age * 34, Y = gy - 80 - age * (80 + hash(k + 4) * 50), r = 90 + age * 60;
    const a = .065 * Math.sin(Math.PI * age / 6);
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rgba('#7a736c', a)); g.addColorStop(1, rgba('#7a736c', 0));
    ctx.fillStyle = g; ctx.fillRect(X - r, Y - r, 2 * r, 2 * r);
  }
  for (let x = FIRE.x0, i = 0; x < FIRE.x1; x += 34, i++) {
    const xx = x + (hash(i * 3.3) - .5) * 20, ft = fireT0(xx), I = ss(seg(t, ft, ft + .4)) * (1 - ss(seg(t, ft + 1.7, ft + 2.6)));
    if (I <= 0) continue; const X = 960 + xx - cx; if (X < -80 || X > W + 80) continue;
    flame(X, gy + 20 + hash(i) * 14, (48 + hash(i + 1) * 50) * I * (.8 + .2 * Math.sin(t * 7 + i)), t, i);
  }
  for (const pl of PL.main) if (pl.fire && pl.g.woody) {
    const I = ss(seg(t, pl.fire.ft + .3, pl.fire.ft + .7)) * (1 - ss(seg(t, pl.fire.ft + 1.3, pl.fire.ft + 2.1)));
    if (I <= 0) continue; const X = 960 + pl.xl - cx, Y = gy + pl.dy;
    for (let k = 0; k < 3; k++) flame(X + (k - 1) * 22 + pl.g.fork[0] * .5, Y + pl.g.fork[1] * (.2 + k * .15), 90 * I, t, 50 + k + pl.wx);
  }
}
function drawAsh(t, cx, cy) {
  const front = FIRE.x0 + (FIRE.x1 - FIRE.x0) * seg(t, 41.8, 44.8);
  const a = .36 * ss(seg(t, 42.2, 44.5)) * (1 - .7 * ss(seg(t, 47.6, 51.5)));
  if (a <= 0 || t > 60) return;
  const gy = LAY.main.gy + cy, X0 = 960 + FIRE.x0 - cx, X1 = 960 + front - cx, gr = .24 * ss(seg(t, 48, 51.5));
  const band = (col, al, y0, y1) => {
    const g = ctx.createLinearGradient(X0 - 220, 0, X1 + 120, 0), w = X1 - X0 + 340;
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(clamp(300 / w), rgba(col, al)); g.addColorStop(clamp(1 - 180 / w), rgba(col, al)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(X0 - 220, y0, w, y1 - y0);
  };
  for (let k = 0; k < 24; k++) { const y0 = gy + k * 14; band('#3f3833', a * (1 - k / 26), y0, y0 + 14.5); }
  if (gr > 0) for (let k = 0; k < 10; k++) { const y0 = gy + k * 12; band('#8fbf5a', gr * (1 - k / 10), y0, y0 + 12.5); }
}
function drawRain(t, cx) {
  const I = ss(seg(cx, 7000, 8300)) * .55 + ss(seg(cx, 8600, 9400)) * .45;
  if (I <= 0 || t > 74) return;
  ctx.strokeStyle = rgba('#7d93a0', .32); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath();
  const N = Math.round(170 * I);
  for (let i = 0; i < N; i++) {
    const x = ((hash(i) * 2300 - t * 120) % 2300 + 2300) % 2300 - 150, y = ((hash(i + .37) * 1250 + t * (900 + hash(i + 2) * 300)) % 1250) - 100;
    ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 26 + hash(i + 5) * 14);
  }
  ctx.stroke();
}

// ---------- annotations (handwritten) ----------
function hand(txt, x, y, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `${o.w || 500} ${o.size || 30}px Caveat`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.beginPath(); ctx.rect(x0 - 6, y - 40, (w + 12) * eo(p), 80); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 12; ctx.fillStyle = rgba(o.col || INK, (o.a ?? .9)); ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
}
function leader(x0, y0, x1, y1, p, bend = 20, a = .75) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3, 0, 7); ctx.fillStyle = rgba(INK, a); ctx.fill(); }
}
const fade2 = (t, a, b, fi = .5, fo = .5) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));
function note(t, t0, t1, ax, ay, lx_, ly_, txt, o = {}) {
  const f = 1 - ss(seg(t, t1 - .5, t1)); if (t < t0 || f <= 0) return;
  ctx.globalAlpha = f;
  leader(lx_ + (o.lead ?? 0), ly_ + 18, ax, ay, seg(t, t0, t0 + .6), o.bend ?? 18);
  hand(txt, lx_, ly_, seg(t, t0 + .3, t0 + 1.3), o);
  ctx.globalAlpha = 1;
}
const scr = (pl, lxx, lyy, t) => [lx(pl.lay, pl.xl, camXf(t)) + lxx, LAY[pl.lay].gy + pl.dy + camYf(t) * LAY[pl.lay].par + lyy];

function drawNotes(t) {
  // spinifex
  { const [x, y] = scr(HERO.spin, 20, -70, t); note(t, 18.0, 22.8, x, y, x + 70, y - 150, 'spinifex  ·  Triodia'); }
  { const [x, y] = scr(HERO.uluru, 0, -52, t); note(t, 13.6, 21.0, x, y, x - 30, y - 90, 'Uluru', { size: 26, bend: 8 }); }
  { const [x, y] = scr(HERO.mulga, 40, -150, t); note(t, 27.4, 33.2, x, y, x + 110, y - 150, 'branches up, rain runs down'); }
  { const [x, y] = scr(HERO.koala, HERO.koala.g.fork[0] + 14, HERO.koala.g.fork[1] - 60, t); note(t, 36.2, 41.2, x, y, x + 120, y - 120, 'gum tree  ·  Eucalyptus'); }
  { const pl = PL.main.find(p => p.fire && p.g.woody && p.wx > 6050); if (pl) { const [x, y] = scr(pl, pl.g.fork[0] * .5, pl.g.fork[1] * .5, t); note(t, 49.0, 52.2, x, y, x + 90, y - 170, 'epicormic shoots'); } }
  { const [x, y] = scr(HERO.ash, 90, 0, t); note(t, 52.6, 55.0, x + 4, y - 16, x + 70, y - 110, 'a person, for scale', { size: 26 }); }
  { const [x, y] = scr(HERO.ash, 10, -1000, t); note(t, 55.2, 59.0, x + 14, y, x + 150, y - 60, 'mountain ash  ·  Eucalyptus regnans'); }
  // rainforest layers
  if (t > 63.6 && t < 70.4) {
    const f = 1 - ss(seg(t, 69.8, 70.4)); ctx.globalAlpha = f;
    const X = 92, lv = [['emergent', 262, 64.0], ['canopy', 410, 64.7], ['understorey', 590, 65.4], ['forest floor', 712, 66.1]];
    const lp = seg(t, 63.6, 64.6); ctx.strokeStyle = rgba(INK, .7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X, 230); ctx.lineTo(X, lerp(230, 745, eo(lp))); ctx.stroke();
    for (const [txt, y, t0] of lv) { const q = seg(t, t0, t0 + .5); if (q <= 0) continue; ctx.beginPath(); ctx.moveTo(X - 8, y); ctx.lineTo(X + 8 * eo(q), y); ctx.stroke(); hand(txt, X + 18, y, seg(t, t0, t0 + 1), { size: 30 }); }
    ctx.globalAlpha = 1;
  }
  // dimension line for the mountain ash
  if (t > 54.3 && t < 59.4) {
    const f = 1 - ss(seg(t, 58.9, 59.4)), [x, y] = scr(HERO.ash, 150, 0, t), topY = y + HERO.ash.g.top;
    const drawTo = Math.max(topY, lerp(y, topY, eo(seg(t, 54.3, 57.6))));
    ctx.globalAlpha = f; ctx.strokeStyle = rgba(INK, .7); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, drawTo); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); if (drawTo <= topY + 1) { ctx.moveTo(x - 10, topY); ctx.lineTo(x + 10, topY); } ctx.stroke();
    const labY = clamp((y + drawTo) / 2, 140, 900);
    hand('≈ 100 m', x + 20, labY, seg(t, 55.6, 56.6), { size: 40, w: 600 });
    ctx.globalAlpha = 1;
  }
}
function tinyHuman(X, Y) {
  ctx.save(); ctx.translate(X, Y); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -25, 3.4, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(0, -9); ctx.moveTo(0, -9); ctx.lineTo(-3, 0); ctx.moveTo(0, -9); ctx.lineTo(3, 0); ctx.moveTo(0, -18); ctx.lineTo(-4, -12); ctx.moveTo(0, -18); ctx.lineTo(4, -13); ctx.stroke();
  ctx.restore();
}
function mulgaRain(t, pl, X, Y) {
  if (t < 26.4 || t > 34) return;
  const g = pl.g, vis = 1 - ss(seg(t, 33, 34));
  // cloud
  ctx.save(); ctx.setTransform(1, 0, 0, 1, X, Y);
  const ca = ss(seg(t, 26.4, 27.2)) * (1 - ss(seg(t, 31.5, 33)));
  if (!pl.cloud) pl.cloud = withSeed(12, () => sprite(cloud(.8, '#8fa2aa').S));
  ctx.globalAlpha = ca; ctx.drawImage(pl.cloud.cv, pl.cloud.x0, pl.cloud.y0 - 330); ctx.globalAlpha = 1;
  // moist soil + taproot
  const wet = seg(t, 28.2, 32.5);
  if (wet > 0) { ctx.beginPath(); ctx.ellipse(0, 10, 18 + 60 * eo(wet), 8 + 14 * eo(wet), 0, 0, 7); ctx.fillStyle = rgba('#5a8fb0', .22 * vis); ctx.fill(); }
  const rp = seg(t, 29, 31.6);
  if (rp > 0) { ctx.setLineDash([7, 6]); ctx.strokeStyle = rgba(INK2, .6 * vis); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(8, 60, -4, 6 + 150 * eo(rp)); ctx.stroke(); ctx.setLineDash([]); }
  for (let i = 0; i < 14; i++) {
    const s0 = 27.1 + i * .36, st = g.stems[i % g.stems.length], top = st[st.length - 1];
    const fall = seg(t, s0, s0 + .45), slide = seg(t, s0 + .45, s0 + 1.35);
    if (fall <= 0 || slide >= 1) continue;
    let x, y;
    if (fall < 1) { x = top[0] + 4; y = lerp(-330, top[1], ei(fall)); }
    else { const k = (st.length - 1) * (1 - slide), k0 = Math.floor(k), f = k - k0, a = st[k0], b = st[Math.min(k0 + 1, st.length - 1)]; x = lerp(a[0], b[0], f); y = lerp(a[1], b[1], f) - 3; }
    ctx.beginPath(); ctx.ellipse(x, y, 3.6, 5.2, 0, 0, 7); ctx.fillStyle = rgba('#3f7fa8', .9 * vis); ctx.fill();
  }
  ctx.restore();
}

function drawLandscape(t) {
  const cx = camXf(t), cy = camYf(t);
  drawSky(t, cx, cy);
  drawStripAt(STRIP.far, cx, cy, seg(t, 10.6, 13.6));
  drawPlants('far', t, cx, cy);
  const mist = ss(seg(cx, 7000, 7800));
  mistBand(520 + cy * .3, 720 + cy * .3, .55 * mist);
  drawStripAt(STRIP.mid, cx, cy, seg(t, 10.4, 13.4));
  drawPlants('mid', t, cx, cy);
  mistBand(600 + cy * .6, 780 + cy * .6, .35 * mist);
  drawStripAt(STRIP.ground, cx, cy, seg(t, 10.2, 13.2));
  drawHorizon(t, cx, cy);
  drawAsh(t, cx, cy);
  drawPlants('main', t, cx, cy, (pl, X, Y, sk, p) => {
    if (pl === HERO.mulga) mulgaRain(t, pl, X, Y);
    if (pl === HERO.koala && p >= 1 && t > 35 && t < 44) { const [fx, fy] = pl.g.fork; ctx.setTransform(1, 0, sk, 1, X, Y); koala(fx + 6, fy + 22, 1.25, ss(seg(t, 35.2, 36.2)), t); }
    if (pl === HERO.ash) { ctx.setTransform(1, 0, 0, 1, X, Y); tinyHuman(90, 0); }
  });
  // kangaroo: landings hit the music's beats
  if (t > 13.5 && t < 31) {
    const ph = (((t - BEAT0) / (BEAT * 2)) % 1 + 1) % 1;
    for (const [off, s, sd, d] of [[0, 1.3, 5, 0], [-170, .95, 6, .25]]) {
      const wx = 1350 + 160 * (t - 14) + off, X = 960 + wx - cx; if (X < -100 || X > W + 100) continue;
      const a = ss(seg(t, 13.5, 14.5)); ctx.globalAlpha = a; roo(X, LAY.main.gy + 26 + d * 10, s, (ph + d) % 1, sd); ctx.globalAlpha = 1;
    }
  }
  if (t > 61 && t < 74) { const wx = 9760 - 45 * (t - 61), X = 960 + wx - cx; cassowary(X, LAY.main.gy + 30 + cy, 1.4, t); }
  drawFire(t, cx, cy);
  budgies(t);
  drawPlants('fg', t, cx, cy);
  drawRain(t, cx);
  // warm firelight
  const fl = ss(seg(t, 41.8, 43)) * (1 - ss(seg(t, 45.5, 47.2)));
  if (fl > 0) { ctx.fillStyle = rgba('#e07a3a', .07 * fl); ctx.fillRect(0, 0, W, H); }
}
