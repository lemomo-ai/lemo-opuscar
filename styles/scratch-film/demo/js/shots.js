// The Night Climb — timeline and shots. Each shot takes t (already stepped to 15 drawings a second) and the drawing
// number dn, draws into G, and returns { texts: [...], dof, flash, split }.
// World shots use metres: x across, y = depth (surface at 0, down is +). Camera c = { x, y, s (px per metre) }.
'use strict';
const T = {
  s2: 5.6, zoom0: 4.85, zoom1: 6.45, cut0: 5.95, cut1: 8.3, dye0: 7.75, dye1: 8.95, rings0: 8.3, rings1: 8.95, blink: 9.45,
  s3: 10.0, s4: 14.3, tilt0: 18.9, tilt1: 20.0, jaw0: 22.0, s5: 23.3, lit0: 23.85, litStep: .25, match0: 27.6, match1: 29.7,
  merge: 31.0, snap: 31.45, s6: 32.4, bite: 35.0, s7: 36.5, pull0: 36.6, pull1: 43.4, s8: 45.6, dawn0: 45.75, dawn1: 46.95,
  sink0: 46.3, sink1: 49.0, card: 48.0, DUR: 52.0,
};
const LIT = i => T.lit0 + i * T.litStep;                       // photophore i switches on
const W2S = (c, x, y) => [960 + (x - c.x) * c.s, 540 + (y - c.y) * c.s];
const HERO = [40, 500];                                       // where the lanternfish starts (m)
const FISH_M = .08 / 1000;                                    // metres per local unit (8 cm fish)

// ---------------- text as cuts ----------------
const TXT = {};
function txtImg(str, font, px, col = CREAM, o = {}){
  const key = [str, font, px, col, o.hatch ? 1 : 0].join('|'); if (TXT[key]) return TXT[key];
  const c0 = mk(10, 10).getContext('2d'); c0.font = `${font.w || ''} ${px}px ${font.f}`;
  const tw = Math.ceil(c0.measureText(str).width) + 24, th = Math.ceil(px * 1.4);
  const c = mk(tw, th), g = c.getContext('2d');
  g.font = c0.font; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(str, 12, px * 1.08);
  const q = rng(str.length * 31 + px);
  g.globalCompositeOperation = 'destination-out';           // the needle skipped: thin gaps through the cut
  for (let i = 0; i < (o.hatch ? 0 : 14); i++){ g.globalAlpha = .25 + q() * .35; g.lineWidth = .6 + q() * 1.2; const y = q() * th; g.beginPath(); g.moveTo(0, y); g.lineTo(tw, y + (q() - .5) * 18); g.stroke(); }
  if (o.hatch){                                             // heavy title: the letters are filled by diagonal cuts
    g.globalAlpha = 1;
    for (let x = -th; x < tw + th; x += 7 + q() * 3){ g.lineWidth = 2 + q() * 1.6; g.beginPath(); g.moveTo(x, th + 4); g.lineTo(x + th * .55, -4); g.stroke(); }
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  return (TXT[key] = c);
}
const MONO = { f: 'MONO' }, MARK = { f: 'MARK' }, JOST = { f: 'JOST', w: 600 }, JOSTB = { f: 'JOST', w: 800 };
// draw a text image cut in from the left (prog 0..1); returns its screen box
function cutText(img, x, y, prog, dn, o = {}){
  if (prog <= 0) return null;
  const sc = o.sc ?? 1, w = img.width * sc, h = img.height * sc;
  const jx = (h1(dn * 1.3 + x) - .5) * .8, jy = (h1(dn * 2.1 + y) - .5) * .8;   // a small boil only: text must stay readable
  G.save(); G.globalAlpha = o.a ?? 1;
  G.beginPath(); G.rect(x - 4, y - 4, (w + 8) * clamp(prog, 0, 1), h + 8); G.clip();
  G.drawImage(img, x + jx, y + jy, w, h); G.restore();
  if (prog < 1 && o.tip !== false) tipSpark(x + w * prog, y + h * .62, dn, o.tipR ?? 40);
  return { x0: x, y0: y + h * .12, x1: x + w, y1: y + h * .95 };
}
// the hot point of a fresh cut: glow and chips thrown off (no tool shown, only the cut)
function tipSpark(x, y, dn, r = 50){
  glow(x, y, r * 2.2, 'rgba(255,240,200,1)', .8);
  disc(x, y, r * .12, '#ffffff', .95);
  const q = rng(dn * 13 + 5);
  for (let i = 0; i < 12; i++){ const a = -Math.PI * q() - .2, d = r * (.3 + q() * 1.6), s = 2 + q() * r * .12; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .8; G.globalAlpha = .85; G.fillStyle = q() < .7 ? CREAM : '#3a2a1c'; G.beginPath(); G.moveTo(px, py); G.lineTo(px + s, py + s * .3); G.lineTo(px + s * .2, py + s); G.closePath(); G.fill(); }
  G.globalAlpha = 1;
}

// ---------------- the sea ----------------
function specks(c, seed, n, x0, x1, y0, y1, o = {}){       // marine snow in world metres
  const q = rng(seed);
  for (let i = 0; i < n; i++){
    const x = lerp(x0, x1, q()), y = lerp(y0, y1, q()), sz = .4 + q() * 1.6, a = .15 + q() * .4;
    const p = W2S(c, x, y + (o.fall ?? 0) * (o.t ?? 0) * (.5 + q()));
    if (p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) continue;
    disc(p[0], p[1], Math.max(.6, Math.min(4, sz * (o.k ?? 1))), CREAM, a * (o.a ?? 1));
  }
}
function screenSnow(seed, n, vx, vy, t, o = {}){           // marine snow in screen space for tracking shots (parallax layers)
  const q = rng(seed);
  for (let i = 0; i < n; i++){
    const x0 = q() * (W + 200), y0 = q() * (H + 200), sz = (o.sz ?? 1.4) * (.5 + q()), a = (o.a ?? .45) * (.4 + q() * .6);
    const x = ((x0 + vx * t) % (W + 200) + (W + 200)) % (W + 200) - 100, y = ((y0 + vy * t + (o.dy || 0)) % (H + 200) + (H + 200)) % (H + 200) - 100;
    if (o.streak){ scratch([[x, y], [x - vx * .02, y - vy * .02]], { w: sz, a, tail: false, passes: 1, solid: true }); }
    else disc(x, y, sz, CREAM, a);
  }
}
// the depth ruler: a scratched line with ticks in world metres, and a marker with the current depth at screen y mY
function ruler(c, xw, step, o = {}){
  const top = W2S(c, xw, 0), bot = W2S(c, xw, 700);
  const x = top[0]; if (x < -50 || x > W + 50) return [];
  const y0 = Math.max(-20, top[1]), y1 = Math.min(o.ymax ?? 860, bot[1]);
  if (y1 <= y0) return [];
  rs(700 + (o.dn || 0) * 3);
  scratch([[x, y0], [x + 1, (y0 + y1) / 2], [x, y1]], { w: 3, a: .8 * (o.a ?? 1), tail: false });
  const out = [];
  for (let d = Math.ceil(Math.max(0, c.y - 600 / c.s) / step) * step; d <= 700; d += step){
    const p = W2S(c, xw, d); if (p[1] < -10 || p[1] > y1) continue;
    const major = Math.abs(d / (step * 2) - Math.round(d / (step * 2))) < 1e-6;
    scratch([[x, p[1]], [x + (major ? 34 : 18), p[1] + 1]], { w: major ? 3 : 2, a: .75 * (o.a ?? 1), tail: false, passes: 1 });
    if (o.labels && major && d > 0 && d % 100 === 0){ const im = txtImg(`${d} m`, MONO, 38, CREAM); const b = cutText(im, x + 44, p[1] - 30, 1, o.dn || 0, { a: .85 * (o.a ?? 1), tip: false }); if (b && (o.a ?? 1) > .9) out.push(Object.assign(b, { id: 'rule' + d, text: `${d} m` })); }
  }
  return out;
}
function depthMarker(x, y, depth, dn, a = 1){                // "you are here": a small cut arrow and the depth, fixed on screen
  rs(900 + dn);
  scratch([[x + 4, y], [x + 30, y - 12]], { w: 3, a, tail: false, passes: 1 }); scratch([[x + 4, y], [x + 30, y + 12]], { w: 3, a, tail: false, passes: 1 });
  const v = Math.round(depth / 10) * 10, im = txtImg(`${v} m`, MONO, 44, CREAM);
  const b = cutText(im, x + 40, y - 36, 1, dn, { a, tip: false });
  return b ? [Object.assign(b, { id: 'depth', text: '000 m' })] : [];
}
function surfaceLine(c, dn, a = 1, o = {}){                 // the sea's surface: several boiling passes, small waves
  const y = W2S(c, 0, 0)[1]; if (y < -40 || y > H + 40) return y;
  rs(300 + dn * 7);
  for (let k = 0; k < (o.passes ?? 3); k++){
    const P = []; for (let x = -40; x <= W + 40; x += 40){ const wx = (x - 960) / c.s + c.x; const amp = 7 * seg(Math.log(c.s), Math.log(20), Math.log(2000)) * (k ? .6 : 1); P.push([x, y + k * 5 + amp * Math.sin(x * .035 + wx * .02 + dn * .15 + k)]); }
    scratch(P, { w: k ? 2 : 3.5, a: (k ? .45 : .9) * a, tail: false });
  }
  return y;
}
function stars(dn, horizonY, a = 1, seed = 5){
  const q = rng(seed);
  for (let i = 0; i < 140; i++){
    const x = q() * W, y = q() * (horizonY - 30), b = q(), tw = .6 + .4 * Math.sin(dn * .7 + i);
    if (y < 0) continue;
    const al = a * (.35 + .65 * b) * tw * (1 - clamp((y - horizonY + 140) / 140, 0, 1) * .6);
    disc(x, y, .8 + b * 1.8, CREAM, al);
    if (b > .9){ rs(i * 9 + dn); scratch([[x - 9, y], [x + 9, y]], { w: 1.4, a: al * .8, tail: false, passes: 1 }); scratch([[x, y - 9], [x, y + 9]], { w: 1.4, a: al * .8, tail: false, passes: 1 }); }
  }
}
function moon(x, y, r, dn, a = 1){
  rs(500 + dn);
  glow(x, y, r * 3.2, 'rgba(255,200,28,1)', .22 * a);
  hatch(ringPts(x, y, r, r, 30), YEL, { gap: 6, a: .8 * a, ang: .5, lw: [1.4, 3.4] });
  hatch(ringPts(x - r * .25, y - r * .2, r * .55, r * .55, 20), CREAM, { gap: 7, a: .45 * a, ang: -.6, lw: [1, 2.4], passes: 1 });
  scratch(ringPts(x, y, r, r, 34), { w: 3.5, a, tail: false });
}
// the downwelling glow seen from below: concentric hatch, cream over blue
function glowAbove(cx, cy, rx, ry, dn, a = 1){
  rs(600 + dn * 5);
  glow(cx, cy, rx * 1.1, 'rgba(120,170,255,1)', .22 * a);
  for (let k = 0; k < 7; k++){
    const f = 1 - k * .12;
    hatch(ringPts(cx, cy, rx * f, ry * f, 36), k < 3 ? BLUE : CREAM, { gap: 12 - k, a: (.1 + .07 * k) * a, ang: .35 + k * .9, lw: [1, 2.6], passes: 1, over: 2 });
  }
  hatch(ringPts(cx, cy, rx * .2, ry * .2, 24), CREAM, { gap: 5, a: .4 * a, ang: -.2, lw: [1.2, 3], passes: 2 });
}

// ---------------- shot 1–2: sunset, the descent, the push into a point of light, the fish is cut ----------------
function cam12(t){
  const d = eio(seg(t, 2.2, 5.0));
  const y = lerp(-25, HERO[1], d), x = lerp(0, HERO[0], ss(seg(t, 2.5, 5.0)));
  const z = eio(seg(t, T.zoom0, T.zoom1));
  const s = elog(3, 11500, z);
  // the fish settles left of centre: a fixed offset in metres matters only when we are close
  return { x: x + .006 * z, y: y - .004 * z, s };            // locked from 6.45 s: nothing drifts into the cut at 10 s
}
const SUN = t => [70, lerp(-58, 8, ss(seg(t, 0, 2.9)))];
function fishStateS2(t){
  const st = { draw: seg(t, T.cut0, T.cut1), dye: eo(seg(t, T.dye0, T.dye1)), rings: seg(t, T.rings0, T.rings1), ph: 0, bend: 0, light: null };
  const sw = seg(t, 9.0, 9.4); st.bend = 30 * sw; st.ph = (t - 9) * 9;
  st.blink = Math.max(0, Math.sin(Math.PI * seg(t, T.blink, T.blink + .2)));
  return st;
}
function shot12(t, dn){
  const c = cam12(t), texts = [];
  const hz = surfaceLine(c, dn, 1, { passes: 0 });
  // the horizon is cut first, left to right
  const hp = eo(seg(t, .15, 1.15));
  if (hz > -40 && hz < H + 40){
    rs(30 + dn * 3);
    const P = []; for (let x = -30; x <= -30 + (W + 60) * hp; x += 30) P.push([x, hz + 1.5 * Math.sin(x * .02 + dn)]);
    if (P.length > 1) scratch(P, { w: 4, tail: false });
    if (P.length > 1 && hp > 0) for (let k = 1; k < 3; k++) scratch(P.map(p => [p[0], p[1] + k * 6]), { w: 2, a: .35, tail: false, passes: 1 });
    if (hp > 0 && hp < 1) tipSpark(P[P.length - 1][0], P[P.length - 1][1], dn, 46);
    // sky: the sun sinking into the cut
    const sp = SUN(t), sc = W2S(c, ...sp), r = 22 * c.s;
    if (sc[1] - r < hz){
      G.save(); G.beginPath(); G.rect(0, -2000, W, hz - 3 + 2000); G.clip();
      glow(sc[0], sc[1], r * 3.5, 'rgba(255,200,28,1)', .35 * hp);
      hatch(ringPts(sc[0], sc[1], r, r, 30), YEL, { gap: 6, a: .85 * hp, ang: .5, lw: [1.4, 3.4] });
      hatch(ringPts(sc[0], sc[1] + r * .35, r * .95, r * .62, 24), RED, { gap: 7, a: .55 * hp, ang: -.4, lw: [1.2, 3], passes: 1 });
      scratch(ringPts(sc[0], sc[1], r, r, 34), { w: 3.5, a: hp, tail: false });
      G.restore();
      // its broken reflection under the horizon
      const ra = hp * (1 - seg(sp[1], -10, 8));
      for (let i = 0; i < 9; i++){ const y = hz + 14 + i * 13, wdt = r * (1.1 - i * .09) * (.7 + .3 * h1(i + dn)); dye([[sc[0] - wdt, y], [sc[0] + wdt, y + 1]], { w: 6, col: YEL, n: 3, a: .7 * ra * (1 - i / 10) }); }
    }
    stars(dn, hz, seg(t, 1.6, 2.8) * (1 - seg(t, 3, 3.6)), 11);
  }
  // under water: light shafts thinning with depth
  const shaftA = seg(t, 1.8, 2.8);
  if (shaftA > 0 && c.s < 40){
    // drawn into their own layer, then faded with depth by a gradient mask (no steps)
    setG(tctx); tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, H);
    rs(80 + dn * 5);
    [[-150, .2, 7], [-40, .12, 10], [70, .16, 6], [160, .22, 12], [260, .14, 8]].forEach(([x0, lean, w0], i) => {
      const yb = 300, wb = w0 + yb * .1;
      const P = [W2S(c, x0 - w0, 0), W2S(c, x0 + w0, 0), W2S(c, x0 + lean * yb + wb, yb), W2S(c, x0 + lean * yb - wb, yb)];
      hatch(P, CREAM, { gap: 5, a: .5 * (.75 + .25 * h1(i * 7 + dn * .3)), ang: Math.PI / 2 - Math.atan(lean), lw: [.8, 2], passes: 1, over: 2 });
    });
    const g0 = W2S(c, 0, 0)[1], g1 = W2S(c, 0, 260)[1];
    const gr = tctx.createLinearGradient(0, g0, 0, g1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.globalCompositeOperation = 'destination-in'; tctx.fillStyle = gr; tctx.fillRect(0, 0, W, H); tctx.globalCompositeOperation = 'source-over';
    setG(sctx); sctx.save(); sctx.globalAlpha = shaftA * .55; sctx.drawImage(TMP, 0, 0); sctx.restore();
  }
  // marine snow and the ruler during the descent
  if (c.s < 60){
    specks(c, 41, 420, -400, 400, 5, 640, { a: seg(t, 2.2, 3) });
    const rA = seg(c.y, 25, 60) * (1 - seg(t, 4.9, 5.3));
    if (rA > 0){
      ruler(c, -250, 25, { dn, a: rA });
      const depth = clamp(c.y + (540 - 540) / c.s, 0, 500);
      if (rA > .02) texts.push(...depthMarker(W2S(c, -250, 0)[0] + 2, 540, Math.max(0, depth), dn, rA));
    }
  }
  // a point of light far below: the fish's eye catching the last light
  const gA = seg(t, 4.2, 4.8);
  const fishC = W2S(c, ...HERO), fs = c.s * FISH_M;
  const F = MAPF(fishC[0], fishC[1], fs, -.3);
  if (gA > 0 && fs < .05){ const e = F.m(...F_EYE); glow(e[0], e[1], 26, 'rgba(255,244,220,1)', gA * (.6 + .4 * Math.sin(dn))); disc(e[0], e[1], 2.4, CREAM, gA); }
  // fish scale specks: rushing past during the push
  if (c.s > 200){ const k = seg(Math.log(c.s), Math.log(200), Math.log(1500)); specks(c, 77, 260, HERO[0] - .25, HERO[0] + .25, HERO[1] - .15, HERO[1] + .15, { a: k * .9 * (1 - .6 * seg(t, 9.2, 10)), k: c.s / 3000 }); }
  let tip = null;
  if (fs >= .05){
    const st = fishStateS2(t);
    // before the outline exists, the first cut is the eye around the glint
    if (t < T.cut0){ const e = F.m(...F_EYE); glow(e[0], e[1], 60, 'rgba(255,244,220,1)', .7); disc(e[0], e[1], 4, CREAM, 1); }
    tip = drawFish(F, st, { rays: false });
    if (tip) tipSpark(tip[0], tip[1], dn, 46);
  }
  const near = seg(Math.log(c.s), Math.log(800), Math.log(6000)) * (1 - seg(t, 8.8, 9.6));
  return { texts, dof: near > .05 ? { x: fishC[0], y: fishC[1], band: 520, r: 5 * near, radial: true } : null };
}

// ---------------- shot 3: the climb (tracking alongside) ----------------
const FLICKS = [10.95, 11.95, 13.15];
const S2END = (() => { let P = null; return () => P || (P = (() => { const c = cam12(T.s3); const f = W2S(c, ...HERO); return { x: f[0], y: f[1], s: c.s * FISH_M, ang: -.3 }; })()); })();
function fishS3(t){
  const u = (t - T.s3) / (T.s4 - T.s3), p0 = S2END();
  const k = eio(seg(t, T.s3 + .4, T.s3 + 1.7));                // still at the cut; the climb starts after it
  const x = lerp(p0.x, lerp(860, 1060, u), k), y = lerp(p0.y, lerp(610, 470, u), k);
  // the tail keeps the beat it had in shot 2, then three strong flicks: anticipation, flick, recover
  let bend = lerp(30, 46, k), ph = (t - 9) * 9;
  FLICKS.forEach(f => { const d = t - f; if (d > -.2 && d < .45) { bend += 60 * Math.exp(-Math.pow((d - .05) / .14, 2)); ph += 4 * ss(seg(d, -.2, .3)); } });
  return { x, y, s: lerp(p0.s, .72, k), ang: lerp(p0.ang, -.36 + .03 * Math.sin(t * 3), k), st: { ph, bend, light: null, dye: 1, draw: 1 } };
}
function shot3(t, dn){
  const u = (t - T.s3) / (T.s4 - T.s3);
  // far layer: a jellyfish drifting, out of focus (drawn into its own layer, blurred)
  setG(tctx); tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, W, H);
  rs(1200 + dn);
  const inA = ss(seg(t, T.s3 + .2, T.s3 + 1.2));
  drawJelly(MAPF(1520 - 60 * u, 300 + 260 * u, .55, .25), t, TEAL);
  screenSnow(31, 70, -60, 220, t - T.s3, { sz: 3.2, a: .35 });
  setG(sctx); sctx.save(); sctx.filter = 'blur(5px)'; sctx.globalAlpha = .8 * inA; sctx.drawImage(TMP, 0, 0); sctx.restore();
  screenSnow(32, 160, -90, 330, t - T.s3, { sz: 1.3, a: .5 * inA });
  // the glow of the surface, still far above, starting to show
  const ga = seg(t, 12.2, 14.3);
  if (ga > 0) glowAbove(1300, -420, 1200, 520, dn, ga * .55);
  const f = fishS3(t);
  rs(1300 + dn * 3);
  drawFish(MAPF(f.x, f.y, f.s, f.ang), Object.assign({ ang: f.ang }, f.st), {});
  // near layer: a few big specks streaking past, soft
  setG(tctx); tctx.clearRect(0, 0, W, H); screenSnow(33, 14, -160, 620, t - T.s3, { sz: 5, a: .5 });
  setG(sctx); sctx.save(); sctx.filter = 'blur(4px)'; sctx.globalAlpha = inA; sctx.drawImage(TMP, 0, 0); sctx.restore();
  // the ruler on the left keeps counting
  const depth = lerp(480, 260, u);
  const c = { x: 0, y: depth, s: 6 };
  const texts = [];
  ruler(c, (110 - 960) / 6, 10, { dn, a: inA });
  texts.push(...depthMarker(112, 540, depth, dn, inA));
  return { texts };
}

// ---------------- shot 4: from below, the shadow; tilt down to the hunter ----------------
const TILT = 220;
function silS4(t){ const u = seg(t, T.s4, T.tilt1 + 1); return { x: lerp(980, 1110, u), y: lerp(330, 300, u), ang: lerp(-.1, -.2, u) }; }
function predState(t){
  const tilt = eio(seg(t, T.tilt0, T.tilt1));
  const rise = ss(seg(t, T.tilt1, T.s5));
  return { x: 900 + 20 * rise, y: 1130 - TILT * tilt - 60 * rise, ang: -1.32 - .06 * rise, jaw: .55 * eio(seg(t, T.jaw0, T.s5)), eye: seg(t, 20.6, 21.0) * (.7 + .3 * Math.sin(t * 9)), t };
}
function shot4(t, dn){
  const tilt = eio(seg(t, T.tilt0, T.tilt1)), dy = -TILT * tilt;
  glowAbove(980, -120 + dy, 1150, 560, dn);
  const s = silS4(t);
  rs(1400 + dn * 3);
  drawSilhouette(MAPF(s.x, s.y + dy, .62, s.ang), { ph: (t - T.s4) * 8, bend: 40, cover: [], light: [] });
  if (tilt > 0){
    const p = predState(t);
    rs(1500 + dn * 3);
    drawPredator(MAPF(p.x, p.y, .74, p.ang), p);
  }
  screenSnow(51, 90, 30, -40, t - T.s4, { sz: 1.3, a: .45, dy: dy });
  return { texts: [] };
}

// ---------------- shot 5: split — the belly lights (left) and the shadow vanishing from below (right) ----------------
const R5 = { glow: [1440, -60, 760, 470], sil: [1440, 330, .6, -.12], pred: [1500, 1170, .62, -1.45] };   // the hunter's view in the right half
const lightLevels = t => { const L = []; for (let i = 0; i < 12; i++){ const a = eo(seg(t, LIT(i), LIT(i) + .18)); L.push(a * (1 + .35 * seg(t, T.match0, T.match1))); } return L; };
function shot5(t, dn){
  if (t >= T.merge) return shot5b(t, dn);
  const L = lightLevels(t), texts = [];
  const cutP = eo(seg(t, T.s5, T.s5 + .4));
  // right half: what the hunter sees
  G.save(); G.beginPath(); G.rect(964, 0, W - 964, H); G.clip();
  const k = eio(seg(t, T.s5 + .6, T.s5 + 1.7)), s4 = silS4(T.s5), p4 = predState(T.s5);
  const gl = [lerp(980, R5.glow[0], k), lerp(-120 - TILT, R5.glow[1], k), lerp(1150, R5.glow[2], k), lerp(560, R5.glow[3], k)];
  glowAbove(gl[0], gl[1], gl[2], gl[3], dn);
  const m = seg(t, T.match0, T.match1);
  const cover = L.map((l, i) => Math.min(1, l) * .55 + .45 * m);
  rs(1600 + dn * 3);
  drawSilhouette(MAPF(lerp(s4.x, R5.sil[0], k), lerp(s4.y - TILT, R5.sil[1], k), lerp(.62, R5.sil[2], k), lerp(s4.ang, R5.sil[3], k)), { ph: (t - T.s4) * 8, bend: lerp(40, 30, k), cover, light: L, rim: 1 - m, dotA: 1 - .75 * m });
  // the hunter, looking up from below
  const p = { x: lerp(p4.x, R5.pred[0], k), y: lerp(p4.y, R5.pred[1], k), ang: lerp(p4.ang, R5.pred[3], k), jaw: .55, eye: .8, t };
  drawPredator(MAPF(p.x, p.y, lerp(.74, R5.pred[2], k), p.ang), p);
  G.restore();
  // left half: the fish's belly, close
  G.save(); G.beginPath(); G.rect(0, 0, 956, H * cutP + 2); G.clip();
  const ph = (t - T.s5) * 6;
  rs(1700 + dn * 3);
  drawFish(MAPF(400, 430, .96, -.06), { ph, bend: 18, light: L, dye: 1, draw: 1, ang: -.06 }, { rays: true });
  G.restore();
  // the divider: a cut from top to bottom
  rs(1800 + dn);
  const yb = H * cutP;
  scratch([[960, -10], [961, yb * .5], [960, yb]], { w: 4, tail: false });
  if (cutP < 1) tipSpark(960, yb, dn, 40);
  return { texts };
}
function shot5b(t, dn){                                       // back to one picture: the hunter bites on nothing, and leaves
  glowAbove(R5.glow[0], R5.glow[1], R5.glow[2], R5.glow[3], dn);
  const L = lightLevels(t);
  // the fish is still there, invisible against the glow: only its lights, faint
  rs(1900 + dn * 3);
  drawSilhouette(MAPF(R5.sil[0], R5.sil[1], R5.sil[2], R5.sil[3]), { ph: (t - T.s4) * 8, bend: 30, cover: L.map(() => 1), light: L, rim: 0, dotA: .25 });
  const sn = seg(t, T.snap - .1, T.snap + .02), leave = eio(seg(t, T.snap + .35, T.s6)), lunge = eo(seg(t, T.merge, T.snap - .05));
  const p = { x: lerp(R5.pred[0], 1440, lunge) - 220 * leave, y: lerp(R5.pred[1], 860, lunge) + 520 * leave, ang: R5.pred[3] - .45 * leave, jaw: t < T.snap - .1 ? lerp(.55, 1.25, lunge) : 1.25 * (1 - sn), eye: .8 * (1 - leave), t };
  rs(2000 + dn * 3);
  drawPredator(MAPF(p.x, p.y, lerp(R5.pred[2], .7, lunge), p.ang), p);
  screenSnow(52, 80, 20, -30, t, { sz: 1.3, a: .4 });
  return { texts: [], flash: 0 };
}

// ---------------- shots 6–8: the surface, the long pull back, dawn ----------------
// all in metres around the hero, who has reached the surface (hero at x 0, depth HY)
const HY = .062;
const SWARM = (() => {
  const q = rng(4242), A = [];
  const gs = () => { let u = 0; for (let k = 0; k < 4; k++) u += q(); return (u - 2) / .577; };      // ~gaussian
  const add = (n, box, kind) => { for (let i = 0; i < n; i++){ const x = box * .55 * gs(), y = box < 1 ? .015 + .075 * q() : Math.min(560, .02 + box * .32 * Math.abs(gs()) * (.4 + .6 * q())); A.push({ x, y, box, ph: q() * 6.28, rate: .6 + q() * 1.6, sz: .7 + q() * .7, k: kind ?? (q() < .86 ? 0 : 1), dv: .5 + q(), sink: 220 + q() * 260, ang: -.45 + q() * .5 }); } };
  // the school around the hero (drawn as fish when close): placed by hand, above and beside its path, smaller than it
  [[.13, .022], [.21, .04], [.3, .02], [.38, .05], [.47, .028], [-.27, .022], [-.36, .045], [-.46, .03], [.56, .045], [-.56, .02]].forEach(([x, y], i) =>
    A.push({ x, y, box: .5, ph: q() * 6.28, rate: .6 + q() * 1.6, sz: .62 + .12 * (i % 3), k: 0, dv: .5 + q(), sink: 220 + q() * 260, ang: -.2 + .12 * Math.sin(i * 2.3) }));
  [2, 8, 30, 120].forEach(b => add(260, b));
  add(700, 450);
  for (let i = 0; i < 2600; i++){ const y = 2 + 530 * Math.pow(q(), 2.2); A.push({ x: -800 + 1600 * q(), y, box: 4000, ph: q() * 6.28, rate: .6 + q() * 1.6, sz: .7 + q() * .7, k: q() < .86 ? 0 : 1, dv: .5 + q(), sink: 220 + q() * 260, ang: -.45 + q() * .5 }); }
  return A.filter(p => !(Math.abs(p.x) < .09 && Math.abs(p.y - HY) < .07));
})();
const COPE = (() => { const q = rng(77), A = []; for (let i = 0; i < 46; i++) A.push({ x: -.24 + q() * .5, y: .008 + q() * .2, sz: .0022 + q() * .0026, ph: q() * 6.28, ang: q() * 6.28 }); return A; })();
function cam678(t){
  if (t < T.s7){ const u = seg(t, T.s6, T.s7); const s = 7000 * (1 + .06 * u); return { x: .002 + .004 * u, y: (540 - 330) / s, s }; }
  const z = eio(seg(t, T.pull0, T.pull1));
  const s = elog(7000 * 1.06, 1.45, z) * (t > T.s8 ? (1 - .03 * seg(t, T.s8, T.DUR)) : 1);
  return { x: .006 * Math.pow(s / 7420, 1), y: (540 - 330) / s, s };
}
function heroS6(t){
  const u = seg(t, T.s6, T.bite);
  const x = lerp(-.13, .01, eo(u)), y = lerp(.085, HY, eo(u));
  const sq = Math.exp(-Math.pow((t - T.bite) / .1, 2));
  return { x, y, ang: lerp(-.5, -.12, eo(u)), mouth: seg(t, T.bite - .25, T.bite - .05) * (1 - seg(t, T.bite + .1, T.bite + .3)), sq };
}
function shot678(t, dn){
  const c = cam678(t), texts = [];
  const hz = W2S(c, 0, 0)[1];
  const dawn = seg(t, T.dawn0, T.DUR), dawnCut = eo(seg(t, T.dawn0, T.dawn1));
  // sky: stars and the moon (fixed on screen: they are at infinity)
  const starA = 1 - seg(t, T.dawn0 + .4, T.dawn0 + 2.6);
  if (hz > 0){
    G.save(); G.beginPath(); G.rect(0, 0, W, hz); G.clip();
    stars(dn, hz, starA, 7);
    moon(1530, 150, 62, dn, 1 - .7 * seg(t, T.dawn0, T.dawn0 + 3));
    // dawn: warm hatching grows over the horizon, the sun's rim rises on the left
    if (dawnCut > 0){
      const gh = 40 + 230 * ss(seg(t, T.dawn0 + .3, T.sink1));
      rs(3100 + dn * 3);
      [[1, .16, 14], [.7, .26, 11], [.42, .38, 8]].forEach(([f, al, gp]) => hatch([[-40, hz - gh * f], [W + 40, hz - gh * f * .45], [W + 40, hz], [-40, hz]], YEL, { gap: gp, a: al * dawnCut, ang: 0.02, lw: [1, 2.6], passes: 1, over: 2 }));
      hatch([[-40, hz - gh * .4], [W + 40, hz - gh * .2], [W + 40, hz], [-40, hz]], RED, { gap: 10, a: .4 * dawnCut, ang: -.03, lw: [1.2, 3], passes: 1 });
      const sr = 70, sy = hz + sr - 75 * ss(seg(t, T.dawn1, T.sink1));
      glow(330, sy, sr * 3.4, 'rgba(255,200,28,1)', .5 * dawnCut);
      hatch(ringPts(330, sy, sr, sr, 30), YEL, { gap: 6, a: .9 * dawnCut, ang: .5, lw: [1.4, 3.4] });
      scratch(ringPts(330, sy, sr, sr, 34), { w: 3.5, a: dawnCut, tail: false });
    }
    G.restore();
  }
  // under the surface: everything that glows
  const sinkU = ss(seg(t, T.sink0, T.sink1));
  const sinkA = 1 - .92 * seg(t, T.sink0 + .5, T.sink1 - .3);
  rs(3200 + dn * 7);
  const nearK = c.s > 300;
  // plankton near the surface
  if (c.s > 400){
    COPE.forEach((p, i) => {
      if (t > T.bite - .05 && i === 0) return;               // eaten
      const x = i === 0 ? .045 : p.x + .006 * Math.sin(t * .8 + p.ph), y = i === 0 ? .052 : p.y + .004 * Math.cos(t + p.ph);
      const sc = W2S(c, x, y); if (sc[0] < -80 || sc[0] > W + 80 || sc[1] < hz - 20 || sc[1] > H + 80) return;
      const s = p.sz / 100 * c.s;
      drawCopepod(MAPF(sc[0], sc[1], s, p.ang + .3 * Math.sin(t * 2 + p.ph)), { a: seg(Math.log(c.s), Math.log(400), Math.log(1500)), flick: Math.sin(t * 6 + p.ph) });
    });
  }
  // the others
  for (const p of SWARM){
    let y = p.y * (1 - .05 * seg(t, T.s7, T.s8) * p.dv) + p.sink * sinkU * p.dv;
    const sc = W2S(c, p.x, y);
    if (sc[0] < -60 || sc[0] > W + 60 || sc[1] < hz + 2 || sc[1] > H + 60) continue;
    const len = .08 * p.sz * c.s;
    const blink = .55 + .45 * Math.sin(dn * .4 * p.rate + p.ph);
    const lod = p.box >= 4000 ? seg(c.s, 40, 6) : seg(p.box * c.s, 120, 420) * (1 - seg(p.box * c.s, 5200, 12000));   // a level shows while it fits the frame
    if (lod <= .01) continue;
    const a = lod * sinkA * (p.y > 200 ? .7 : 1) * (1 - .6 * seg(y, 120, 500) * seg(t, T.sink0, T.sink1));
    if (p.k === 0 && len > 40){
      const st = { ph: t * 8 + p.ph, bend: 40, light: new Array(12).fill(.65 * blink), dye: 1, draw: 1, ang: p.ang };
      drawFish(MAPF(sc[0], sc[1], len / 1000, p.ang), st, { lineA: Math.min(1, a) * .85, dyeA: .75 });
      continue;
    }
    const col = p.k === 0 ? BLUE : TEAL, r = Math.max(1.6 + .9 * p.sz, Math.min(9, len * .06));
    glow(sc[0], sc[1], r * 6, p.k === 0 ? 'rgba(47,134,255,1)' : 'rgba(31,179,154,1)', .42 * a * blink);
    disc(sc[0], sc[1], r, col, .95 * a);
    disc(sc[0], sc[1], r * .38, CREAM, .75 * a * blink);
    // rising: a fine wake under some of the lights once the pull is wide; at dawn the wake is above (they sink)
    if (!nearK && c.s < 40 && p.y < 260 && p.ph < 2.2){
      const wl = 8 + 12 * p.dv, dir = sinkU > .02 ? -1 : 1;
      scratch([[sc[0], sc[1] + dir * r * 1.4], [sc[0] + .5, sc[1] + dir * (r + wl)]], { w: 1.1, col, a: .45 * a, tail: false, passes: 1 });
    }
  }
  // the hero
  if (c.s > 30){
    const h = t < T.s7 ? heroS6(t) : { x: .01, y: HY, ang: -.12, mouth: 0, sq: 0 };
    const sc = W2S(c, h.x, h.y), fs = c.s * FISH_M;
    const lightsOn = new Array(12).fill(.7);
    rs(3300 + dn * 3);
    if (fs > .04) drawFish(MAPF(sc[0], sc[1], fs * (1 + .04 * h.sq), h.ang), { ph: t * 9, bend: 36 + 30 * h.sq, light: lightsOn, dye: 1, draw: 1, mouth: h.mouth, ang: h.ang }, {});
  }
  // surface line on top of everything under it; the moon's broken path on it
  surfaceLine(c, dn, 1);
  if (hz > 0 && hz < H){
    const ma = 1 - .7 * seg(t, T.dawn0, T.dawn0 + 3);
    rs(3400 + dn);
    for (let i = 0; i < 8; i++){ const y = hz + 10 + i * 12, w = (60 - i * 5) * (.6 + .4 * h1(i + dn * .5)); dye([[1530 - w, y], [1530 + w, y + 1]], { w: 5, col: YEL, n: 3, a: .55 * ma * (1 - i / 9) }); }
    if (dawnCut > 0){ for (let i = 0; i < 8; i++){ const y = hz + 10 + i * 12, w = (90 - i * 8) * (.6 + .4 * h1(i * 3 + dn * .5)); dye([[330 - w, y], [330 + w, y + 1]], { w: 6, col: YEL, n: 3, a: .7 * dawnCut * (1 - i / 9) }); } }
  }
  // dawn: the horizon cut again, left to right, warm
  if (dawnCut > 0){
    rs(3500 + dn * 3);
    const x1 = -30 + (W + 60) * dawnCut, P = [];
    for (let x = -30; x <= x1; x += 30) P.push([x, hz - 2 + 1.5 * Math.sin(x * .02 + dn)]);
    if (P.length > 1){ scratch(P, { w: 6, col: '#ffe9a8', tail: false }); dye(P.map(p => [p[0], p[1] - 4]), { w: 10, col: YEL, n: 4, a: .7 }); }
    if (dawnCut < 1 && P.length) tipSpark(P[P.length - 1][0], P[P.length - 1][1], dn, 52);
  }
  // the ruler comes back for the scale (same marks as the descent)
  const rA = seg(t, 41.4, 42.4) * (1 - seg(t, T.dawn1, T.dawn1 + .8));
  if (rA > 0 && c.s < 3){ const xw = (150 - 960) / c.s + c.x; texts.push(...ruler(c, xw, 50, { dn, labels: true, a: rA })); }
  // the end card, cut into the dark water once the lights have gone down
  if (t >= T.card) texts.push(...endCard(t, dn));
  // one last light, near the card
  if (t > T.card + .8){ const b = Math.max(0, Math.sin(Math.PI * seg(t, 50.5, 50.9))) + Math.max(0, Math.sin(Math.PI * seg(t, 51.2, 51.6))); glow(760, 770, 60, 'rgba(47,134,255,1)', .25 + .5 * b); disc(760, 770, 5, BLUE, .9); disc(760, 770, 2.4, CREAM, .5 + .5 * b); }
  const near = c.s > 1500 ? 1 : 0;
  return { texts, dof: near && t < T.s7 + 1 ? { x: 960, y: 640, band: 640, r: 2.5, radial: true } : null };
}
function endCard(t, dn){
  const out = [], x = 900;
  const a1 = eo(seg(t, T.card, T.card + .55)), a2 = eo(seg(t, T.card + .3, T.card + .6)), a3 = eo(seg(t, T.card + .45, T.card + .7)), a4 = eo(seg(t, T.card + .65, T.card + 1.05));
  rs(4000 + dn);
  const ti = txtImg('THE NIGHT CLIMB', JOSTB, 84, CREAM, { hatch: true });
  let b = cutText(ti, x, 560, a1, dn, { tipR: 50 }); if (b) out.push(Object.assign(b, { id: 'title', text: 'THE NIGHT CLIMB' }));
  const zh = txtImg('夜里往上游', MARK, 50, CREAM);
  b = cutText(zh, x + 6, 676, a2, dn, { tipR: 32 }); if (b) out.push(Object.assign(b, { id: 'title-zh', text: '夜里往上游' }));
  const st = txtImg('Scratch Film · 胶片直刻', JOST, 30, '#d9c9a2');
  b = cutText(st, x + 8, 758, a3, dn, { tipR: 24 }); if (b) out.push(Object.assign(b, { id: 'style', text: 'Scratch Film · 胶片直刻' }));
  const cr = txtImg('LemoLab × Claude Opus 5.5', JOST, 34, CREAM);
  b = cutText(cr, x + 8, 812, a4, dn, { tipR: 28 });
  if (b){ out.push(Object.assign(b, { id: 'credit', text: 'LemoLab × Claude Opus 5.5' })); if (a4 > .3) dye([[x + 16, 866], [x + 16 + (cr.width - 16) * a4, 868]], { w: 6, col: RED, n: 3, a: .75 }); }
  return out;
}
