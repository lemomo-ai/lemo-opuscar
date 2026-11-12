// scenes.js: the film after 10 s (shots 6–17 in DEMO.md), the scale ribbon, subtitles. Needs flat.js, heroes.js, orbi.js, film.js.
// Every scene is a pure function of film time t. Scenes nest inside each other (a ring, a lens, the skin) by drawing into a clipped
// group: inG(parent, fn) points flat.js's el()/g() at that group while fn runs.

const TL = { dive: 10.0, solar: 12.0, earth: 17.0, cloud: 25.9, hand: 26.9, skin: 33.6, blood: 35.0, lens: 40.9, virus: 42.2, fin: 45.8, end: 52.0 };
function inG(parent, fn) { const s0 = svg; svg = parent; try { return fn(); } finally { svg = s0; } }
const circleClip = (p, x, y, r) => g(p, { 'clip-path': clipOf('circle', { cx: r1(x), cy: r1(y), r: r1(Math.max(0.5, r)) }) });
const mapC = (cam, p) => [(p[0] - cam.C[0]) * cam.z + S0[0], (p[1] - cam.C[1]) * cam.z + S0[1]];
const camTf = cam => `translate(${S0[0]},${S0[1]}) scale(${cam.z.toFixed(5)}) translate(${(-cam.C[0]).toFixed(3)},${(-cam.C[1]).toFixed(3)})`;
const kf2 = (t, keys) => [kf(t, keys.map(k => [k[0], k[1]])), kf(t, keys.map(k => [k[0], k[2]]))];
const expEase = (t, a, b, K) => Math.exp(Math.log(K) * ei(seg(t, a, b)));   // zoom factor 1 → K, accelerating

// ---------- subtitles: one Chinese line over one English line, bottom left, a sun tick on the left ----------
const VO = [   // film seconds; dur = measured length of the voice clip (vo/dur.json); the cue stays up for max(1.8, dur + 0.6)
  { id: 'v1', t: 2.4, dur: 3.81, cn: '这是我们的银河系，宽约十万光年。', en: 'This is our galaxy. 100,000 light-years across.' },
  { id: 'v3', t: 12.2, dur: 4.282, cn: '太阳的光，要走八分多钟才到地球。', en: "The Sun's light takes more than 8 minutes to reach the Earth." },
  { id: 'v4a', t: 17.6, dur: 2.362, cn: '把地球缩成一个篮球，', en: 'Shrink the Earth to a basketball,' },
  { id: 'v4b', t: 20.6, dur: 4.653, cn: '空间站离它的表面还不到一厘米。', en: 'and the Space Station flies less than a centimetre above it.' },
  { id: 'v5a', t: 26.9, dur: 3.082, cn: '前面为了让你看清，Orbi 一直画得很大。', en: 'We drew Orbi big, so you could see it.' },
  { id: 'v5b', t: 30.6, dur: 3.236, cn: '这才是它真实的大小：一颗葡萄那么大。', en: 'This is its true size: about one grape.' },
  { id: 'v6a', t: 34.45, dur: 3.248, cn: '接下来，Orbi 跟着我们一起缩小，钻进你的血里。', en: 'Now Orbi shrinks with us, into your blood.' },
  { id: 'v6b', t: 38.7, dur: 1.716, cn: '这里有些细胞，会捕猎。', en: 'Some cells here hunt.' },
  { id: 'v7', t: 41.05, dur: 4.329, cn: '现在 Orbi 和病毒一样小：比一根头发细大约一千倍。', en: 'Now Orbi is virus-sized: a thousand times thinner than a hair.' },
  { id: 'v8', t: 46.04, dur: 4.762, cn: '从银河到病毒，每次缩小十倍，一共缩了二十八次。', en: 'From galaxy to virus: 10 times smaller, 28 times over.' },
];
VO.forEach((v, i) => { v.t1 = v.t + Math.max(1.8, v.dur + 0.6); if (VO[i + 1]) v.t1 = Math.min(v.t1, VO[i + 1].t); });
function subtitles(p, t) {
  const v = VO.find(q => t >= q.t && t < q.t1); if (!v) return;
  const k = eo(seg(t, v.t, v.t + 0.16)), G = g(p, { 'clip-path': clipOf('rect', { x: 80, y: 950, width: 1100, height: 120 }) });
  const dy = 14 * (1 - k);
  if (t >= CLOUD_CUT && t < TL.blood) {   // over the bright sky and skin the lines sit on a flat night plate
    const w = Math.max(measure(v.cn, { 'font-size': 36, 'font-weight': 700, 'font-family': 'Jost,NotoSC', 'letter-spacing': 1 }), measure(v.en, { 'font-size': 26, 'font-weight': 500 }));
    el('rect', { x: 78, y: r1(962 + dy), width: r1(w + 70), height: 104, rx: 18, fill: C.night }, G);
  }
  el('rect', { x: 96, y: r1(978 + dy), width: 5, height: 74, rx: 2.5, fill: C.sun }, G);
  text(G, 122, r1(1010 + dy), v.cn, { 'data-noread': 1, 'font-size': 36, 'font-weight': 700, fill: C.cream, 'font-family': 'Jost,NotoSC', 'letter-spacing': 1 });
  text(G, 123, r1(1046 + dy), v.en, { 'data-noread': 1, 'font-size': 26, 'font-weight': 500, fill: C.mist });
}

// ---------- field of view: from the galaxy camera before 10 s, then one log track (metres) through every stop ----------
const LY = 9.4607e15;
const STOPS6 = [
  { e: 21.24, name: 'galaxy', glyph: 'galaxy', read: '185,000 ly' },
  { e: 11.68, name: 'solar system', glyph: 'solar', read: '480 million km' },
  { e: 7.75, name: 'Earth', glyph: 'earth', read: '56,000 km' },
  { e: -0.4, name: 'you', glyph: 'hand', read: '40 cm' },
  { e: -4.32, name: 'blood', glyph: 'cell', read: '48 µm' },
  { e: -6.3, name: 'virus', glyph: 'virus', read: '0.5 µm' },
];
const E_TRACK = [[10.0, null], [12.0, 11.34], [13.4, 11.35], [15.8, 11.68], [16.2, 11.68], [18.2, 7.75], [25.9, 7.75], [26.9, -0.4 + Math.log10(1 / 3.2)], [28.7, -0.4 - Math.log10(3.0)], [30.2, -0.4], [33.2, -0.4], [35.0, -4.32], [40.9, -4.32], [42.2, -6.3], [50, -6.3]];
function eAt(t) {
  if (t < 10) return Math.log10(fovLy(t) * LY);
  const keys = E_TRACK.map(k => [k[0], k[1] == null ? Math.log10(fovLy(10) * LY) : k[1]]);
  return kf(t, keys);
}
function fmtM(m) {
  const sig = v => v >= 100 ? Math.round(v).toLocaleString('en-US') : v >= 10 ? v.toFixed(1).replace(/\.0$/, '') : v.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
  if (m >= 1e15) { const v = m / LY; return [v >= 10000 ? (Math.round(v / 1000) * 1000).toLocaleString('en-US') : sig(v), 'light-years']; }
  if (m >= 1e9) return [sig(m / 1e9), 'million km'];
  if (m >= 1e4) { const v = m / 1e3; return [v >= 10000 ? (Math.round(v / 1000) * 1000).toLocaleString('en-US') : sig(v), 'km']; }
  if (m >= 1) return [sig(m), 'm'];
  if (m >= 0.01) return [sig(m * 100), 'cm'];
  if (m >= 1e-3) return [sig(m * 1000), 'mm'];
  if (m >= 1e-7) return [sig(m * 1e6), 'µm'];
  return [sig(m * 1e9), 'nm'];
}

// ---------- the scale ribbon: corner instrument for the whole film, centre-stage summary at the end ----------
function stopGlyph(G, kind, x, y, k, lit) {
  const c = (a, dim) => lit ? a : dim;
  if (kind === 'galaxy') {
    el('ellipse', { cx: r1(x), cy: r1(y), rx: r1(13 * k), ry: r1(6 * k), fill: c(C.blue, C.n3), transform: `rotate(-18 ${r1(x)} ${r1(y)})` }, G);
    el('circle', { cx: r1(x), cy: r1(y), r: r1(4 * k), fill: c(C.cream, C.mist) }, G);
  } else if (kind === 'solar') {
    el('circle', { cx: r1(x), cy: r1(y), r: r1(11 * k), fill: 'none', stroke: c(C.mist, C.n3), 'stroke-width': r1(2 * k) }, G);
    el('circle', { cx: r1(x), cy: r1(y), r: r1(4.5 * k), fill: c(C.sun, C.mist) }, G);
    el('circle', { cx: r1(x + 7.8 * k), cy: r1(y - 7.8 * k), r: r1(2.8 * k), fill: c(C.blue, C.mist) }, G);
  } else if (kind === 'earth') {
    el('circle', { cx: r1(x), cy: r1(y), r: r1(11 * k), fill: c(C.blue, C.n3) }, G);
    el('ellipse', { cx: r1(x - 3 * k), cy: r1(y - 3 * k), rx: r1(5 * k), ry: r1(4 * k), fill: c(C.mint, C.mist) }, G);
  } else if (kind === 'hand') {
    el('rect', { x: r1(x - 6 * k), y: r1(y - 2 * k), width: r1(12 * k), height: r1(12 * k), rx: r1(4 * k), fill: c(C.cream, C.mist) }, G);
    el('rect', { x: r1(x - 14 * k), y: r1(y - 2 * k), width: r1(12 * k), height: r1(5 * k), rx: r1(2.5 * k), fill: c(C.cream, C.mist) }, G);
    el('circle', { cx: r1(x), cy: r1(y - 8 * k), r: r1(4.5 * k), fill: c(C.coral, C.n3) }, G);
  } else if (kind === 'cell') {
    el('circle', { cx: r1(x), cy: r1(y), r: r1(11 * k), fill: c(C.mint, C.n3) }, G);
    el('circle', { cx: r1(x + 3 * k), cy: r1(y - 2 * k), r: r1(4.5 * k), fill: c(C.blue, C.mist) }, G);
  } else {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; el('circle', { cx: r1(x + Math.cos(a) * 10 * k), cy: r1(y + Math.sin(a) * 10 * k), r: r1(2.2 * k), fill: c(C.coral, C.mist) }, G); }
    el('circle', { cx: r1(x), cy: r1(y), r: r1(7.5 * k), fill: c(C.cream, C.mist) }, G);
  }
}
const STOP_T = [4.72, 11.95, 18.1, 26.85, 34.95, 42.15];
function ribbonLayout(t) {   // corner → centre stage during the finale
  const k = eio(seg(t, TL.fin, TL.fin + 0.8));
  return { x0: lerp(1220, 200, k), L: lerp(580, 1520, k), y: lerp(1000, 690, k), gk: lerp(1, 2.3, k), fin: k };
}
function ribbon(p, t) {
  if (t < 3.75) return;
  const Lo = ribbonLayout(t), { x0, L, y, gk } = Lo, pos = e => x0 + (25 - e) / 35 * L;
  const G = g(p), e = eAt(t), finOn = t >= TL.fin;
  if (t >= CLOUD_CUT && t < TL.blood) el('rect', { x: x0 - 26, y: 842, width: L + 52, height: 222, rx: 18, fill: C.night }, G);
  // readout (the corner instrument); in the finale it wipes away
  const kOut = 1 - eio(seg(t, TL.fin, TL.fin + 0.35));
  if (kOut > 0) {
    wipeText(G, x0, 872, 'FIELD OF VIEW', { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3 }, eo(seg(t, 3.75, 4.05)) * kOut, 22);
    if (t >= 4.05) {
      const kc = eo(seg(t, 4.05, 4.75)), m = Math.pow(10, t < 4.75 ? Math.log10(fovLy(t) * LY) * kc + 15.97 * (1 - kc) : e);
      const [num, unit] = t < 4.75 ? [fmt(m / LY), 'light-years'] : fmtM(m);
      const sh = 1 - spr(t, 4.05, 18, 9);
      const NG = g(G, { 'clip-path': clipOf('rect', { x: x0 - 10, y: 870, width: r1(600 * kOut), height: 70 }) });
      text(NG, x0, r1(926 + 50 * sh), `${num}<tspan font-size="30" font-weight="500" fill="${C.mist}" dx="10">${unit}</tspan>`, { 'data-noread': 1, 'font-size': 52, 'font-weight': 600, fill: C.cream });
    }
  }
  const kt = eo(seg(t, 3.85, 4.4));
  const th = lerp(10, 12, Lo.fin);
  if (kt > 0) el('rect', { x: r1(x0), y: r1(y - th / 2), width: r1(Math.max(10, L * kt)), height: r1(th), rx: r1(th / 2), fill: C.n3 }, G);
  // progress: the yellow bar until the finale; there the dots stream along the track and then become the bar
  if (!finOn) {
    const kp = eo(seg(t, 4.35, 4.8));
    if (kp > 0) el('rect', { x: r1(x0), y: r1(y - 5), width: r1(Math.max(10, (pos(e) - x0) * kp)), height: 10, rx: 5, fill: C.sun }, G);
  }
  const xg = pos(STOPS6[0].e), xv = pos(STOPS6[5].e);
  const front = finOn ? lerp(xg, xv, eio(seg(t, 46.6, 48.4))) : 0;
  if (finOn) {
    const kb = eo(seg(t, 48.35, 48.75));
    if (t >= 46.6) for (let x = xg; x <= front + 0.01; x += 17 * gk / 2.3) {
      const pop = backE(clamp((front - x) / 60), 2.2); if (pop <= 0.02) continue;
      el('circle', { cx: r1(x), cy: r1(y), r: r1(4.2 * pop), fill: C.sun }, G);
    }
    if (kb > 0) el('rect', { x: r1(x0), y: r1(y - th / 2), width: r1(Math.max(th, (xv - x0) * kb)), height: r1(th), rx: r1(th / 2), fill: C.sun }, G);
  }
  for (let ex = 25; ex >= -10; ex--) if (ex % 5 === 0) {
    const x = pos(ex); if (x > x0 + L * kt) continue;
    const ta = 3.85 + (x - x0) / L * 0.55, kk = backE(seg(t, ta, ta + 0.15)), h = (ex % 10 === 0 ? 12 : 7) * kk * lerp(1, 1.3, Lo.fin);
    el('rect', { x: r1(x - 1.5), y: r1(y + 12 * lerp(1, 1.6, Lo.fin)), width: 3, height: r1(Math.max(0.1, h)), rx: 1.5, fill: C.n3 }, G);
  }
  const lab = (1 - Lo.fin);
  if (lab > 0.01) {
    const LB = g(G, { 'clip-path': clipOf('rect', { x: x0 - 40, y: y + 20, width: r1(L * kt + 80), height: 40 }) });
    for (const [ex, lb] of [[20, '10' + sup('20', 16)], [10, '10' + sup('10', 16)], [0, '1 m'], [-10, '10' + sup('−10', 16)]])
      if (lab > 0.5) text(LB, pos(ex), y + 46, lb, { 'font-size': 16, 'font-weight': 500, fill: C.mist, 'text-anchor': 'middle' });
  }
  // the current stop: the last one the field of view has reached
  let cur = 0; STOPS6.forEach((s, i) => { if (e <= s.e + 0.05) cur = i; });
  STOPS6.forEach((st, i) => {
    const x = pos(st.e), cy = y - 34 * lerp(1, 0, Lo.fin), ta = 3.85 + (x - x0) / L * 0.55; if (t < ta) return;
    let k = (i === cur ? 1 : 0.78) * backE(seg(t, ta, ta + 0.22), 2) * gk;
    let lit = i <= cur;
    if (finOn) { const tp = 46.6 + 1.8 * (x - xg) / Math.max(1, xv - xg); lit = t >= tp; k = gk * (lit ? 1 + 0.35 * wob(t, tp, 14, 6) : 0.85); }
    // the finale's virus stop is the shrunken virus itself (drawn by the scene), so leave it out here
    if (!(finOn && i === 5)) stopGlyph(G, st.glyph, x, cy, k, lit);
    if (!finOn) {
      if (i === cur && t >= 4.72) { const tc = STOP_T[i]; const kr = backE(seg(t, tc, tc + 0.25), 2.2); el('circle', { cx: r1(x), cy, r: r1(21 * Math.max(0.01, kr)), fill: 'none', stroke: C.sun, 'stroke-width': 3 }, G); }
      el('rect', { x: r1(x - 1.5), y: y - 16, width: 3, height: 8, rx: 1.5, fill: i === cur ? C.sun : C.n3 }, G);
    } else {
      const tp = 46.6 + 1.8 * (x - xg) / Math.max(1, xv - xg), kl = eo(seg(t, tp, tp + 0.3));
      if (kl > 0) {
        const LG = g(G, { 'clip-path': clipOf('rect', { x: r1(x - 120), y: r1(y + 30), width: 240, height: 90 }) });
        const up = 20 * (1 - kl);
        text(LG, r1(x), r1(y + 70 + up), st.name, { 'font-size': 24, 'font-weight': 600, fill: C.cream, 'text-anchor': 'middle' });
        text(LG, r1(x), r1(y + 100 + up), st.read, { 'font-size': 20, 'font-weight': 500, fill: C.mist, 'text-anchor': 'middle' });
      }
    }
  });
  return { pos, y, gk };
}

// ---------- generic next-stop ring (spring lock, dashed halo, leader, two-line label) ----------
function ringAt(p, t, t0, x, y, r, label, lx, ly, anchor = 'end', tOut = 1e9) {
  if (t < t0 || t >= tOut) return;
  const rr = r + (r * 2.6) * (1 - spr(t, t0, 15, 8.5));
  el('circle', { cx: r1(x), cy: r1(y), r: r1(rr), fill: 'none', stroke: C.sun, 'stroke-width': 4 }, p);
  const ko = eo(seg(t, t0 + 0.08, t0 + 0.32));
  if (ko > 0) el('circle', { cx: r1(x), cy: r1(y), r: r1(rr + 13 * ko), fill: 'none', stroke: C.sun, 'stroke-width': 2.5, 'stroke-dasharray': '3 9', 'stroke-dashoffset': r1(-(t - t0) * 9), 'stroke-linecap': 'round' }, p);
  const a = Math.atan2(ly - y, lx - x), x1 = x + Math.cos(a) * (r + 22), y1 = y + Math.sin(a) * (r + 22);
  const ex = lx + (anchor === 'end' ? -30 : anchor === 'start' ? 30 : 0), ey = ly > y ? ly - 46 : ly + 30;
  const kl = eio(seg(t, t0 + 0.32, t0 + 0.62));
  if (kl > 0) el('path', { d: `M${r1(x1)},${r1(y1)}L${r1(lerp(x1, ex, kl))},${r1(lerp(y1, ey, kl))}`, stroke: C.sun, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, p);
  wipeText(p, lx, ly - 18, 'NEXT STOP', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3, 'text-anchor': anchor }, eo(seg(t, t0 + 0.5, t0 + 0.75)), 22);
  wipeText(p, lx, ly + 14, label, { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': anchor }, eo(seg(t, t0 + 0.6, t0 + 0.9)), 36);
}
// a dotted sight line fired from A toward B (screen points), stopping `gap` short of B
function dotsAB(p, t, t0, t1, A, B, gap, o = {}) {
  if (t < t0) return;
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]), d0 = o.d0 || 40, d1 = len - gap, sp = o.sp || 17, rr = o.r || 3.4;
  if (d1 <= d0) return;
  const front = lerp(d0, d1, eio(seg(t, t0, t1)) * 0.85 + seg(t, t0, t1) * 0.15);
  const m = t > t1 ? 14 * (t - t1) - 14 * 0.35 * (1 - Math.exp(-(t - t1) / 0.35)) : 0, off = m % sp;
  for (let d = d0 + off - sp; d <= Math.min(front, d1) + 0.01; d += sp) {
    if (d < d0) continue;
    const k = Math.min(backE(clamp((front - d) / 55), 2.2), clamp((d - d0) / sp + (off === 0 ? 1 : 0)), clamp((d1 - d) / sp + 0.02));
    if (k <= 0.02) continue;
    el('circle', { cx: r1(A[0] + (B[0] - A[0]) * d / len), cy: r1(A[1] + (B[1] - A[1]) * d / len), r: r1(rr * k), fill: o.fill || C.sun }, p);
  }
}
function starField(p, seed, n, cam, f = 0.18) {
  const z = Math.pow(cam.z, f), C2 = [S0[0] + (cam.C[0] - S0[0]) * f, S0[1] + (cam.C[1] - S0[1]) * f];
  const G = g(p, { transform: camTf({ z, C: C2 }) }), R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = -300 + R() * (W + 600), y = -200 + R() * (H + 400), k = R(), rr = k < 0.7 ? 1.4 + R() * 1.4 : 2.6 + R() * 2;
    el('circle', { cx: r1(x), cy: r1(y), r: r1(rr), fill: k < 0.55 ? C.mist : k < 0.85 ? C.cream : C.sun }, G);
  }
}
function headline(p, t, t0, x, y, small, big, tOut = 1e9, anchor = 'start') {
  if (t < t0 || t >= tOut + 0.4) return;
  const ko = 1 - eio(seg(t, tOut, tOut + 0.35));
  wipeText(p, x, y, small, { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': anchor }, eo(seg(t, t0, t0 + 0.3)) * ko, 22);
  const k = spr(t, t0 + 0.12, 15, 7.5);
  const G = g(p, { 'clip-path': clipOf('rect', { x: anchor === 'end' ? x - 900 : x - 10, y: y + 6, width: 910, height: r1(110 * ko) }) });
  text(G, x, r1(y + 92 + 100 * (1 - k)), big, { 'font-size': 96, 'font-weight': 700, fill: C.cream, 'letter-spacing': -1, 'text-anchor': anchor });
}

// =================== shot 6 · dive through the ring (10.0–12.0) ===================
const SOL = { AU: 600, sunS: [420, 600] };
function dive(t) {
  const p = seg(t, TL.dive, TL.solar), K = expEase(t, TL.dive, TL.solar, 50);
  const Q = layerOf(camAt(10), LAYER.galaxy).at(SUN);   // the Sun on screen when the dive starts
  const c = [lerp(Q[0], SOL.sunS[0], eio(p)), lerp(Q[1], SOL.sunS[1], eio(p))];
  // the galaxy, frozen at 10 s, blown up about the Sun as we fall into the ring
  const wrap = `translate(${r1(c[0])},${r1(c[1])}) scale(${K.toFixed(4)}) translate(${r1(-Q[0])},${r1(-Q[1])})`;
  const G = g(null, { transform: wrap });
  inG(G, () => shotsOpen(10, { worldOnly: true }));
  const R = 26 * K;
  // inside the ring: the solar system, growing from a point to full frame
  const IN = circleClip(null, c[0], c[1], R - 2);
  el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: r1(R), fill: C.night }, IN);
  const m = R / (26 * 50);
  inG(g(IN, { transform: `translate(${r1(c[0])},${r1(c[1])}) scale(${m.toFixed(5)}) translate(${-SOL.sunS[0]},${-SOL.sunS[1]})` }), () => solar(TL.solar, true));
  if (R < 1300) {
    el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: r1(R), fill: 'none', stroke: C.sun, 'stroke-width': r1(4 + 6 * p) });
    el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: r1(R + 13 + 20 * p), fill: 'none', stroke: C.sun, 'stroke-width': 2.5, 'stroke-dasharray': '3 9', 'stroke-dashoffset': r1(-(t - 7.3) * 9), 'stroke-linecap': 'round' });
  }
  // the sight line and the label let go as we fall in
  const O = guideOrbi(t), A = orbiLens(O.x, O.y, O.s, O.P);
  if (t < 10.6) dotsAB(g(), t, 6.25, 7.2, A, c, R + 22, { d0: 0.3 * O.s, r: 3.4 * (1 - eio(seg(t, 10.1, 10.6))) });
  const kl = 1 - eio(seg(t, 10.0, 10.25));
  if (kl > 0) { const lx = Q[0] + (RING_LABEL[0] - SUN[0]), ly = Q[1] + (RING_LABEL[1] - SUN[1]);
    wipeText(null, lx, ly - 18, 'NEXT STOP', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3, 'text-anchor': 'end' }, kl, 22);
    wipeText(null, lx, ly + 14, 'Our Sun', { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': 'end' }, kl, 36); }
  title(g(), t);
}

// =================== shots 7–8 · the Solar System: light walks to Earth (12.0–17.0) ===================
const PLANETS = [[0.387, -40, C.mist, 3.5], [0.723, 145, C.cream, 4.5], [1.0, -6, C.blue, 6.5], [1.524, 205, C.coral, 4.5]];
const EARTH_W = [SOL.AU * Math.cos(-6 * Math.PI / 180), SOL.AU * Math.sin(-6 * Math.PI / 180)];
function solarCam(t) {
  const z0 = kf(t, [[12, 2.2], [13.4, 2.15], [15.8, 1.0]]);
  const [cx, cy] = kf2(t, [[12, -(SOL.sunS[0] - 960) / 2.2, -(SOL.sunS[1] - 540) / 2.2], [13.4, 262, -30], [15.8, 580, -60]]);
  let cam = { z: z0, C: [cx, cy] };
  if (t > 16.2) {   // push into Earth, Earth keeps its place on screen
    const Es = mapC(cam, EARTH_W), K = expEase(t, 16.2, 17.0, 30);
    cam = { z: z0 * K, C: [EARTH_W[0] - (Es[0] - S0[0]) / (z0 * K), EARTH_W[1] - (Es[1] - S0[1]) / (z0 * K)] };
  }
  return cam;
}
const LIGHT = { t0: 12.6, t1: 15.6 };
function solar(t, frozen) {
  el('rect', { width: W, height: H, fill: C.night });
  const cam = solarCam(t);
  starField(null, 41, 210, cam, 0.12);
  const Sn = mapC(cam, [0, 0]), Es = mapC(cam, EARTH_W), Kp = cam.z / Math.max(1e-3, solarCam(Math.min(t, 16.2)).z);
  // the Sun: true size (radius 0.00465 AU), with two flat halo rings so it can be found
  halo(g(), Sn[0], Sn[1], 70, 130);
  el('circle', { cx: r1(Sn[0]), cy: r1(Sn[1]), r: r1(Math.max(3.2, 0.00465 * SOL.AU * cam.z)), fill: C.sun });
  el('circle', { cx: r1(Sn[0]), cy: r1(Sn[1]), r: r1(Math.max(1.6, 0.0023 * SOL.AU * cam.z)), fill: C.cream });
  // orbits (true radii) and planet markers (markers, not to scale)
  for (const [a, deg, col, r] of PLANETS) {
    el('circle', { cx: r1(Sn[0]), cy: r1(Sn[1]), r: r1(a * SOL.AU * cam.z), fill: 'none', stroke: C.n3, 'stroke-width': 2.5 });
    const P = mapC(cam, [a * SOL.AU * Math.cos(deg * Math.PI / 180), a * SOL.AU * Math.sin(deg * Math.PI / 180)]);
    if (a === 1.0) continue;
    el('circle', { cx: r1(P[0]), cy: r1(P[1]), r, fill: col });
  }
  // the light: Orbi's dots become sunlight, walking at one constant speed from the Sun to Earth
  const LG = g(), L = Math.hypot(EARTH_W[0], EARTH_W[1]), f = clamp((t - LIGHT.t0) / (LIGHT.t1 - LIGHT.t0)) * L;
  if (t >= LIGHT.t0) for (let d = 9; d <= f; d += 16) {
    const w = [EARTH_W[0] * d / L, EARTH_W[1] * d / L], s = mapC(cam, w), k = Math.min(1, (f - d) / 30 + 0.2);
    el('circle', { cx: r1(s[0]), cy: r1(s[1]), r: r1(3.6 * Math.min(1, k)), fill: C.sun }, LG);
  }
  // Earth marker: grows into a disc as we push in (the shape that becomes the next scene)
  const hit = ebump(t, LIGHT.t1, LIGHT.t1 + 0.12, LIGHT.t1 + 0.2, LIGHT.t1 + 0.5);
  const er = 7 * (1 + 0.5 * hit) * Math.pow(Kp, 0.985);
  el('circle', { cx: r1(Es[0]), cy: r1(Es[1]), r: r1(er), fill: C.blue });
  if (frozen) return;
  // labels
  const kS = eo(seg(t, 12.5, 12.85)) * (1 - eio(seg(t, 16.1, 16.3)));
  if (kS > 0) {
    el('path', { d: `M${r1(Sn[0] + 10)},${r1(Sn[1] - 12)}L${r1(Sn[0] + 60)},${r1(Sn[1] - 90)}`, stroke: C.sun, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    wipeText(svg, Sn[0] + 70, Sn[1] - 112, 'THE SUN', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3 }, kS, 22);
    wipeText(svg, Sn[0] + 70, Sn[1] - 80, 'at true size', { 'font-size': 28, 'font-weight': 600, fill: C.cream }, kS, 36);
  }
  ringAt(g(), t, 15.65, Es[0], Es[1], 22, 'Earth', Es[0] + 40, Es[1] + 150, 'start', 16.25);
  // the clock: light travel time, ticking up while the light walks (500 s in 3 s)
  const ts = Math.round(clamp((t - LIGHT.t0) / (LIGHT.t1 - LIGHT.t0)) * 500), mm = Math.floor(ts / 60), ss = String(ts % 60).padStart(2, '0');
  if (t >= 12.5) {
    const ko = 1 - eio(seg(t, 16.15, 16.4));
    const H1 = g(null, { 'clip-path': clipOf('rect', { x: 100, y: 120, width: 700, height: r1(240 * ko) }) });
    wipeText(H1, 120, 170, 'SUNLIGHT · SUN TO EARTH', { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3 }, eo(seg(t, 12.5, 12.8)), 22);
    const k = spr(t, 12.55, 15, 7.5);
    text(H1, 116, r1(296 + 120 * (1 - k)), `${mm}:${ss}`, { 'data-noread': 1, 'font-size': 132, 'font-weight': 700, fill: C.cream, 'letter-spacing': -2 });
    const kx = eo(seg(t, 12.7, 13.0));
    if (kx > 0) wipeText(H1, 120 + measure(`${mm}:${ss}`, { 'font-size': 132, 'font-weight': 700, 'letter-spacing': -2 }) + 18, 296, 'min : s', { 'font-size': 28, 'font-weight': 500, fill: C.mist }, kx, 36);
    const ku = eo(seg(t, LIGHT.t1, LIGHT.t1 + 0.3));
    if (ku > 0) el('rect', { x: 120, y: 322, width: r1(300 * ku), height: 8, rx: 4, fill: C.sun }, H1);
  }
}

// =================== shots 9–10 · Earth and its orbits at true scale (17.0–25.9) ===================
const EA = { x: 250, y: 600, k: 0.034 }; EA.R = 6371 * EA.k;
const ringR = h => (6371 + h) * EA.k;
const YOU = [EA.x - 66, EA.y - 66];
function earthCam(t) {
  const Es = mapC(solarCam(17.0), EARTH_W), r0 = 7 * 30 * 0.985;   // the disc at the cut
  const z0 = r0 / EA.R, C0 = [EA.x - (Es[0] - S0[0]) / z0, EA.y - (Es[1] - S0[1]) / z0];
  const k = eio(seg(t, 17.0, 18.3));
  let cam = { z: lerp(z0, 1, k), C: [lerp(C0[0], 960, k), lerp(C0[1], 540, k)] };
  if (t > 25.9) {   // fall toward "you": zoom about the ring on the land
    const Ys = mapC(cam, YOU), K = expEase(t, 25.9, 26.9, 90);
    cam = { z: cam.z * K, C: [YOU[0] - (Ys[0] - S0[0]) / (cam.z * K), YOU[1] - (Ys[1] - S0[1]) / (cam.z * K)] };
  }
  return cam;
}
function earthLand(G, dark, grow) {
  const { x: ex, y: ey, R: ER } = EA;
  el('circle', { cx: ex, cy: ey, r: ER, fill: dark ? C.blueD : C.blue }, G);
  const Lc = dark ? C.mintD : C.mint, Cl = dark ? C.creamD : C.cream, R = rng(5);
  for (const [cx, cy, rr, n] of [[-70, -60, 96, 9], [40, -150, 52, 7], [95, 70, 80, 8], [-110, 120, 46, 6], [150, -40, 36, 6]]) {
    const pts = polar(ex + cx, ey + cy, n, a => rr * (0.78 + 0.32 * R()) * grow);
    el('path', { d: blobPath(pts), fill: Lc }, G);
  }
  for (const [cx, cy, w] of [[-20, -118, 120], [60, 20, 150], [-120, 40, 90], [20, 150, 110]]) el('rect', { x: r1(ex + cx - w * grow / 2), y: ey + cy - 9, width: r1(w * grow), height: 18, rx: 9, fill: Cl }, G);
}
const TAPE = { t0: 18.7, t1: 19.5, s0: 19.35, s1: 20.2 };
function earth(t) {
  el('rect', { width: W, height: H, fill: C.night });
  const cam = earthCam(t), { x: ex, y: ey, R: ER, k } = EA;
  starField(null, 23, 200, cam, 0.12);
  const Wd = g(null, { transform: camTf(cam) });
  halo(Wd, ex, ey, ER + 46, ER + 100);
  // orbit lines draw on; masked under the labels and the inset
  const mid = 'm' + (uid++), mask = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 12000, height: 12000 }, defs);
  el('rect', { x: -4000, y: -4000, width: 12000, height: 12000, fill: '#fff' }, mask);
  for (const [x, y, w, h] of [[1056, 622, 230, 100], [1574, 622, 250, 100], [430, 140, 340, 330]]) el('rect', { x, y, width: w, height: h, rx: 24, fill: '#000' }, mask);
  const orb = g(Wd, { mask: `url(#${mid})` });
  for (const [h, col, a0] of [[20200, C.mint, 17.6], [35786, C.sun, 17.8]]) {
    const r = ringR(h), c = 2 * Math.PI * r, kd = eio(seg(t, a0, a0 + 1.0));
    if (kd > 0) el('circle', { cx: ex, cy: ey, r: r1(r), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': `${r1(c * kd)} ${r1(c)}`, transform: `rotate(${-90 + (h > 30000 ? 40 : 0)} ${ex} ${ey})` }, orb);
  }
  const grow = backE(seg(t, 17.0, 17.4), 1.6);
  twoTone(Wd, 'circle', { cx: ex, cy: ey, r: ER }, ER * 0.2, ER * 0.16, (G, dark) => earthLand(G, dark, Math.max(0.01, grow)));
  // basketball seams, drawn on while the narration says it
  const kb = eio(seg(t, 18.9, 19.4)) * (1 - eio(seg(t, 23.6, 24.0)));
  if (kb > 0) {
    const BG = g(Wd, { 'clip-path': clipOf('circle', { cx: ex, cy: ey, r: ER }) });
    const seams = [`M${ex},${ey - ER}L${ex},${ey + ER}`, `M${ex - ER},${ey}L${ex + ER},${ey}`,
      `M${ex - ER * 0.62},${ey - ER * 0.8}Q${ex - ER * 0.2},${ey} ${ex - ER * 0.62},${ey + ER * 0.8}`, `M${ex + ER * 0.62},${ey - ER * 0.8}Q${ex + ER * 0.2},${ey} ${ex + ER * 0.62},${ey + ER * 0.8}`];
    for (const d of seams) el('path', { d, fill: 'none', stroke: C.night, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': `${r1(600 * kb)} 900` }, BG);
  }
  const ki = eio(seg(t, 17.5, 18.0));
  if (ki > 0) el('circle', { cx: ex, cy: ey, r: r1(ringR(400)), fill: 'none', stroke: C.coral, 'stroke-width': 3, 'stroke-dasharray': `${r1(2 * Math.PI * ringR(400) * ki)} 2000`, transform: `rotate(-120 ${ex} ${ey})` }, Wd);
  const on = (h, deg) => [ex + ringR(h) * Math.cos(deg * Math.PI / 180), ey + ringR(h) * Math.sin(deg * Math.PI / 180)];
  const ISS = on(400, -36 + (t - 17) * 2.2);
  const ks = backE(seg(t, 18.0, 18.3), 2);
  if (ks > 0) { satellite(Wd, r1(ISS[0]), r1(ISS[1]), 26 * ks, -36 + (t - 17) * 2.2 + 90); const [gx, gy] = on(20200, 9); satellite(Wd, r1(gx), r1(gy), 46 * backE(seg(t, 18.2, 18.5), 2), 18); }
  // the tape: dots from Orbi's lens to the ground, then a solid tape pulled out along them
  const O = earthOrbi(t), case0 = [O.x - 0.25 * O.s, O.y + 0.74 * O.s];   // left edge of the tape case on screen
  const T = g(), tx0 = mapC(cam, [ex + ER, ey]), tx1 = case0;
  if (t < 25.9) {
    if (t < TAPE.s1 + 0.3) dotsAB(T, t, TAPE.t0, TAPE.t1, [tx1[0], ey], [tx0[0], ey], 4, { d0: 6 });
    const kt = eio(seg(t, TAPE.s0, TAPE.s1)) * (1 - eio(seg(t, 25.3, 25.75)));
    if (kt > 0) {
      const xa = lerp(tx1[0], tx0[0], kt);
      el('rect', { x: r1(xa), y: ey - 10, width: r1(tx1[0] - xa), height: 20, rx: 4, fill: C.sun }, T);
      el('rect', { x: r1(xa), y: ey + 4, width: r1(tx1[0] - xa), height: 6, rx: 3, fill: C.sunD }, T);
      for (let km = 1000; km < 35786; km += 1000) { const x = tx0[0] + km * k; if (x < xa) continue; el('rect', { x: r1(x - 1.25), y: ey - 10, width: 2.5, height: km % 5000 === 0 ? 12 : 6, fill: C.night }, T); }
      for (const [h, col, name, val] of [[400, C.coral, '', ''], [20200, C.mint, 'GPS', '20,200 km'], [35786, C.sun, 'Geostationary', '35,786 km']]) {
        const x = tx0[0] + h * k; if (x < xa - 1) continue;
        const kp = backE(clamp((x - xa) / 80), 2);
        el('circle', { cx: r1(x), cy: ey, r: r1(13 * kp), fill: C.night }, T); el('circle', { cx: r1(x), cy: ey, r: r1(8 * kp), fill: col }, T);
        if (name) { wipeText(T, x, 662, name, { 'font-size': 30, 'font-weight': 600, fill: C.cream, 'text-anchor': 'middle' }, kp, 36); wipeText(T, x, 698, val, { 'font-size': 26, 'font-weight': 500, fill: col, 'text-anchor': 'middle' }, kp, 32); }
      }
    }
  }
  // the inset: Orbi's lens as a magnifier on the Space Station, ×6
  const kI = backE(seg(t, 21.3, 21.75), 1.4) * (1 - eio(seg(t, 25.4, 25.75)));
  if (kI > 0.01 && t < 25.9) {
    const Is = mapC(cam, ISS), IC = [lerp(Is[0], 600, kI), lerp(Is[1], 300, kI)], IR = 150 * kI, M = 6;
    el('path', { d: `M${r1(Is[0])},${r1(Is[1])}L${r1(IC[0] + (Is[0] - IC[0]) * IR / Math.hypot(Is[0] - IC[0], Is[1] - IC[1]))},${r1(IC[1] + (Is[1] - IC[1]) * IR / Math.hypot(Is[0] - IC[0], Is[1] - IC[1]))}`, stroke: C.cream, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    el('circle', { cx: r1(IC[0]), cy: r1(IC[1]), r: r1(IR + 8), fill: C.cream });
    const IG = circleClip(null, IC[0], IC[1], IR);
    el('circle', { cx: r1(IC[0]), cy: r1(IC[1]), r: r1(IR), fill: C.night }, IG);
    const ang = Math.atan2(ISS[1] - ey, ISS[0] - ex), nx = Math.cos(ang), ny = Math.sin(ang);
    const ctr = [IC[0] - nx * (ringR(400) * M) , IC[1] - ny * (ringR(400) * M)];   // Earth centre in inset space
    el('circle', { cx: r1(ctr[0] + nx * 0), cy: r1(ctr[1]), r: r1(ER * M), fill: C.blue }, IG);
    el('circle', { cx: r1(ctr[0]), cy: r1(ctr[1]), r: r1(ER * M - 26), fill: C.blueD }, IG);
    el('circle', { cx: r1(ctr[0]), cy: r1(ctr[1]), r: r1(ringR(400) * M), fill: 'none', stroke: C.coral, 'stroke-width': 4 }, IG);
    satellite(IG, r1(IC[0]), r1(IC[1]), 44, ang * 180 / Math.PI + 90);
    // a bracket for the gap
    const g0 = [IC[0] - nx * 400 * k * M, IC[1] - ny * 400 * k * M], tx = -ny, ty = nx, off = 60;
    el('path', { d: `M${r1(g0[0] + tx * off)},${r1(g0[1] + ty * off)}L${r1(IC[0] + tx * off)},${r1(IC[1] + ty * off)}`, stroke: C.sun, 'stroke-width': 4, 'stroke-linecap': 'round' }, IG);
    const kT = eo(seg(t, 21.9, 22.2));
    wipeText(svg, IC[0] + 175, IC[1] - 30, 'SPACE STATION', { 'font-size': 16, 'font-weight': 600, fill: C.coral, 'letter-spacing': 3 }, kT, 22);
    wipeText(svg, IC[0] + 175, IC[1] + 6, '400 km up', { 'font-size': 34, 'font-weight': 600, fill: C.cream }, kT, 40);
    wipeText(svg, IC[0] + 175, IC[1] + 48, 'on a basketball Earth: < 1 cm', { 'font-size': 26, 'font-weight': 600, fill: C.sun }, eo(seg(t, 23.0, 23.4)), 34);
  }
  ringAt(g(), t, 24.5, ...mapC(cam, YOU), 22, 'You', 92, 300, 'start', 25.95);
}
function earthOrbi(t) {
  // Orbi brings the tape case and parks at the geostationary end; screen space
  const geo = [EA.x + ringR(35786) + 64, EA.y];
  const x = kf(t, [[16.2, 1250], [17.0, 1500], [18.4, geo[0]], [25.9, geo[0]], [26.6, 960]]), y = kf(t, [[16.2, 830], [17.0, 760], [18.4, geo[1] - 0.74 * 152], [25.9, geo[1] - 0.74 * 152], [26.6, 420]]);
  return { x: x + 2 * Math.sin(t * 2.6), y: y + 4 * Math.sin(t * 2.83 + 1), s: 152 };
}

// =================== shot 11 · down through the clouds (25.9–27.6) ===================
const CLOUD_BANKS = [   // [t, pills: [x, y, w, h] in bank units], cull when the bank has passed the camera
  [25.95, [[-520, -220, 300, 56], [380, -260, 260, 50], [-300, 260, 360, 60], [460, 200, 280, 56]]],
  [26.15, [[-640, 40, 420, 70], [520, -40, 380, 66], [80, -330, 300, 54]]],
  [26.25, [[-60, 30, 520, 260], [-700, -280, 300, 60], [640, 300, 340, 60]]],   // this one covers the frame: the cut hides behind it
  [26.6, [[-560, -180, 360, 64], [520, 240, 420, 70], [300, -320, 260, 50]]],
  [26.85, [[-620, 260, 380, 64], [560, -260, 360, 60]]],
];
function cloudBank(p, t, i) {
  const [t0, pills] = CLOUD_BANKS[i], s = 0.12 * Math.exp(4.6 * (t - t0));
  if (t < t0 || s > 14) return;
  for (const [x, y, w, h] of pills) {
    const cx = S0[0] + x * s, cy = S0[1] + y * s, ww = w * s, hh = h * s;
    if (cx + ww / 2 < -50 || cx - ww / 2 > W + 50 || cy + hh / 2 < -50 || cy - hh / 2 > H + 50) continue;
    shaded(p, 'rect', { x: r1(cx - ww / 2), y: r1(cy - hh / 2), width: r1(ww), height: r1(hh), rx: r1(hh / 2) }, C.cream, C.creamD, 0, r1(hh * 0.18));
  }
}
const CLOUD_CUT = 26.25 + Math.log(14 / 0.12) / 4.6;   // when the covering bank passes: earth → hand

// =================== shots 12–13 · your hand; Orbi at true size (26.9–33.6) ===================
const HD = { pxmm: 4.8, tip: [880, 450], fw: 86 };   // field of view 40 cm at zoom 1
const ORBI_HAND = { x: 905, s: 150 }; ORBI_HAND.yLand = HD.tip[1] - HD.fw / 2 - 0.36 * ORBI_HAND.s + 4;
const GRAPE = [1070, HD.tip[1] - HD.fw / 2 - 47, 48];
const SKIN = [985, 470];
function handCam(t) {
  const z = kf(t, [[26.9, 3.2], [28.7, 3.0], [30.2, 1.0], [33.0, 1.0]]);
  const oy = handOrbiY(t);
  const cx = kf(t, [[26.9, ORBI_HAND.x], [28.7, ORBI_HAND.x], [30.2, 960]]), cy = kf(t, [[28.6, oy + 30], [28.7, oy + 30], [30.2, 540]]);
  let cam = { z, C: [cx, t < 28.6 ? oy + 30 : cy] };
  if (t > 33.1) { const Ss = mapC(cam, SKIN), K = expEase(t, 33.1, 34.0, 26); cam = { z: z * K, C: [SKIN[0] - (Ss[0] - S0[0]) / (z * K), SKIN[1] - (Ss[1] - S0[1]) / (z * K)] }; }
  return cam;
}
function handOrbiY(t) { return lerp(-420, ORBI_HAND.yLand, eo(seg(t, 26.9, 28.45))); }
function hand(t) {
  el('rect', { width: W, height: H, fill: C.blue });
  const cam = handCam(t);
  // sky: far cloud pills drifting slowly, light parallax
  const SKY = g(null, { transform: camTf({ z: Math.pow(cam.z, 0.25), C: [S0[0] + (cam.C[0] - S0[0]) * 0.25 + (t - 27) * 6, S0[1] + (cam.C[1] - S0[1]) * 0.25] }) });
  for (const [x, y, w] of [[260, 190, 260], [1480, 140, 220], [620, 860, 300], [1700, 420, 180], [180, 620, 160]]) shaded(SKY, 'rect', { x, y, width: w, height: 40, rx: 20 }, '#7FA2FF', '#6C93FF', 0, 7);
  const Wd = g(null, { transform: camTf(cam) });
  // the hand: a right hand pointing left, seen from the thumb side. Index finger out; middle, ring and little finger curled
  // under it (three rolls, knuckles rounded toward the tip); the thumb lies along them; back of the hand, wrist, sleeve.
  // About 4.8 px/mm: index 1.8 cm wide and ~9 cm from knuckle to tip, hand 8 cm deep.
  const [tx, ty] = HD.tip, fw = HD.fw, by = ty + fw / 2;
  shaded(Wd, 'rect', { x: 1700, y: 452, width: 420, height: 336, rx: 40 }, C.coral, C.coralD, 0, 26);             // sleeve
  shaded(Wd, 'rect', { x: 1610, y: 466, width: 150, height: 308, rx: 44 }, C.cream, C.creamD, 0, 20);             // wrist
  shaded(Wd, 'rect', { x: 1300, y: ty - fw / 2, width: 400, height: 385, rx: 120 }, C.cream, C.creamD, 16, 22);  // back of the hand
  for (const [x0, y0, h] of [[1222, by + 4, 78], [1238, by + 86, 76], [1270, by + 166, 68]])                       // curled fingers
    shaded(Wd, 'rect', { x: x0, y: y0, width: 1450 - x0, height: h, rx: h / 2 }, C.cream, C.creamD, 0, 12);
  shaded(Wd, 'rect', { x: tx - fw / 2, y: ty - fw / 2, width: 1420 - tx + fw / 2, height: fw, rx: fw / 2 }, C.cream, C.creamD, 0, 14);   // index
  for (const xx of [1045, 1185]) el('path', { d: `M${xx},${by - 8}Q${xx + 7},${by - 20} ${xx},${by - 32}`, fill: 'none', stroke: C.creamD, 'stroke-width': 4, 'stroke-linecap': 'round' }, Wd);   // joint creases
  shaded(Wd, 'rect', { x: 1296, y: by + 20, width: 318, height: 74, rx: 37 }, C.cream, C.creamD, 0, 12);          // thumb
  el('rect', { x: 1306, y: by + 30, width: 34, height: 28, rx: 11, fill: C.creamD }, Wd);                        // thumbnail
  // the grape, same size as Orbi
  const kg = backE(seg(t, 30.1, 30.45), 2);
  if (kg > 0) {
    const [gx, gy, gr] = GRAPE;
    shaded(Wd, 'circle', { cx: gx, cy: gy + gr * (1 - kg), r: r1(gr * kg) }, C.mint, C.mintD, gr * 0.16 * kg, gr * 0.14 * kg);
    el('circle', { cx: r1(gx - gr * 0.35 * kg), cy: r1(gy - gr * 0.35 * kg + gr * (1 - kg)), r: r1(gr * 0.14 * kg), fill: '#8FEAD0' }, Wd);
    el('path', { d: `M${gx},${r1(gy - gr * kg + gr * (1 - kg))}q4,-18 16,-24`, fill: 'none', stroke: C.mintD, 'stroke-width': 5, 'stroke-linecap': 'round' }, Wd);
  }
  // Orbi, true size: 2 cm body
  const O = handOrbi(t);
  orbi(Wd, O.x, O.y, ORBI_HAND.s, O.P);
  // labels and the size bracket (screen space, measured from the world)
  const kL = eo(seg(t, 30.0, 30.35)) * (1 - eio(seg(t, 33.0, 33.3)));
  if (kL > 0) {
    const top = mapC(cam, [O.x, O.y - 0.32 * ORBI_HAND.s]), bot = mapC(cam, [O.x, O.y + 0.32 * ORBI_HAND.s]), bx = mapC(cam, [O.x - 0.75 * ORBI_HAND.s, 0])[0];
    el('path', { d: `M${r1(bx + 10)},${r1(top[1])}H${r1(bx)}V${r1(lerp(top[1], bot[1], kL))}H${r1(bx + 10 * kL)}`, fill: 'none', stroke: C.sun, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    wipeText(svg, bx - 18, (top[1] + bot[1]) / 2 - 6, 'ORBI, TRUE SIZE', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3, 'text-anchor': 'end' }, kL, 22);
    wipeText(svg, bx - 18, (top[1] + bot[1]) / 2 + 34, '2 cm', { 'font-size': 40, 'font-weight': 700, fill: C.cream, 'text-anchor': 'end' }, kL, 46);
  }
  const kG = eo(seg(t, 30.15, 30.5)) * (1 - eio(seg(t, 33.0, 33.3)));
  if (kG > 0) { const gp = mapC(cam, [GRAPE[0], GRAPE[1] - GRAPE[2]]); el('path', { d: `M${r1(gp[0] + 14)},${r1(gp[1] - 10)}L${r1(gp[0] + 50)},${r1(gp[1] - 70)}`, stroke: C.cream, 'stroke-width': 2.5, 'stroke-linecap': 'round' }); wipeText(svg, gp[0] + 58, gp[1] - 80, 'a grape, 2 cm', { 'font-size': 28, 'font-weight': 600, fill: C.cream }, kG, 36); }
  // next stop: into the skin, with a short sight line from the lens
  const Ls = mapC(cam, orbiLens(O.x, O.y, ORBI_HAND.s, O.P)), Ks = mapC(cam, SKIN);
  if (t < 33.4) dotsAB(g(), t, 32.25, 32.6, Ls, Ks, 30, { d0: 30, sp: 15 });
  ringAt(g(), t, 32.5, Ks[0], Ks[1], 20, 'Into your blood', Ks[0] + 30, Ks[1] + 160, 'start', 33.35);
  return cam;
}
function handOrbi(t) {
  const land = 28.45, P = {};
  const y = handOrbiY(t) + (t > land ? 0 : 4 * Math.sin(t * 3)) - 22 * wob(t, 30.85, 12, 5) * (t > 30.85 ? 1 : 0);
  P.look = [kf(t, [[27, 0], [28.9, 0], [29.2, -0.7], [29.6, 0.6], [30.0, 0], [31.5, 0], [31.8, 0.85], [32.15, 0.85], [32.3, 0.5]]), kf(t, [[27, 0.4], [28.5, 0.2], [29.0, 0], [29.9, 0], [30.15, 0.9], [30.6, 0.9], [30.8, 0], [31.8, 0], [32.15, 0.1], [32.3, 0.8]])];
  P.flame = 0.9 * (1 - eio(seg(t, land - 0.1, land + 0.15)));
  P.flick = t * 2 * Math.PI * 7;
  P.sq = 0.14 * wob(t, land, 16, 7) * (t > land ? 1 : 0) - 0.08 * (t < land ? 1 : 0) * eio(seg(t, 27.5, 28.2));
  P.tilt = 14 * (t < land ? 1 : 0) - 20 * wob(t, 30.85, 18, 3.2) - 6 * wob(t, land, 14, 6);
  P.ant = 18 * wob(t, land, 13, 4) + 8 * Math.sin(t * 2.8) - 16 * wob(t, 30.85, 11, 4);
  P.smile = eio(seg(t, 30.75, 30.9)) * (1 - eio(seg(t, 31.9, 32.05)));
  P.lid = Math.max(blink(t, 29.9), 0);
  P.wide = ebump(t, 29.6, 29.7, 29.75, 29.95);
  P.rot = 3 * Math.sin(t * 1.3);
  return { x: ORBI_HAND.x, y, P };
}

// =================== shot 14 · through the skin (33.6–35.0): layers open as circles ===================
const SKIN_LAYERS = [[33.8, C.creamD], [33.95, C.coral], [34.1, C.coralD], [34.25, C.night]];
function skin(t) {
  const cam = hand(t), Ks = mapC(cam, SKIN);
  let last = null;
  for (const [t0, col] of SKIN_LAYERS) {
    if (t < t0) break;
    const r = 18 * Math.exp(7.2 * (t - t0));
    el('circle', { cx: r1(Ks[0]), cy: r1(Ks[1]), r: r1(Math.min(r, 3000)), fill: col });
    last = [t0, r];
  }
  if (last && last[0] === 34.25) {   // inside the last circle: the blood, growing in
    const r = last[1], IN = circleClip(null, Ks[0], Ks[1], r - 1), m = Math.min(1, 0.35 + 0.65 * r / 1300);
    const cc = [lerp(Ks[0], S0[0], eio(seg(t, 34.25, 35.0))), lerp(Ks[1], S0[1], eio(seg(t, 34.25, 35.0)))];
    inG(g(IN, { transform: `translate(${r1(cc[0])},${r1(cc[1])}) scale(${m.toFixed(4)}) translate(${-S0[0]},${-S0[1]})` }), () => blood(Math.max(t, TL.blood), true));
  }
}

// =================== shots 15–16 · a drop of blood; a cell that hunts (35.0–40.9) ===================
const MAC = { x: 1270, y: 500, R: 320 };
const gauss = (a, c, w) => Math.exp(-Math.pow(((a - c + Math.PI * 3) % (Math.PI * 2) - Math.PI) / w, 2));
function macOutline(t, close, lean) {
  const cupA = Math.PI - 0.25 * lean, w0 = 0.2;
  return polar(MAC.x, MAC.y, 120, a => MAC.R * (1 + 0.035 * Math.sin(3 * a + 1 + t * 0.9) + 0.025 * Math.sin(7 * a - t * 1.3)
    - 0.42 * (1 - close) * gauss(a, cupA, w0) + (0.2 + 0.06 * close) * gauss(a, cupA - 0.38 * (1 - 0.75 * close), 0.13) + (0.2 + 0.06 * close) * gauss(a, cupA + 0.38 * (1 - 0.75 * close), 0.13)
    + 0.08 * gauss(a, -0.9, 0.2) + 0.07 * gauss(a, 0.75, 0.18) + 0.06 * gauss(a, 2.2, 0.2) + 0.1 * lean * gauss(a, Math.PI * 1.22, 0.3)));
}
function bloodOrbi(t) {
  const P = {}, scare = ebump(t, 38.85, 38.95, 39.5, 39.9);
  const x = kf(t, [[35.4, -200], [36.6, 470], [38.85, 470], [39.0, 420], [39.9, 440], [40.9, 470]]) + 2.5 * Math.sin(t * 40) * bump(t, 38.9, 38.95, 39.3, 39.5);
  const y = kf(t, [[35.4, 200], [36.6, 310], [38.85, 310], [39.0, 270], [39.9, 300]]) + 5 * Math.sin(t * 2.7);
  P.look = [kf(t, [[36, 0.7], [37.5, 0.9], [38.2, 0.4], [38.8, 0.9], [39.6, 0.9], [39.9, 0.6], [40.2, 1.0]]), kf(t, [[36, 0.3], [37.5, 0.4], [38.2, 0.6], [38.8, 0.3], [40.0, 0.3], [40.2, -0.15]])];
  P.wide = scare; P.tilt = -8 - 26 * scare + 10 * (t < 36.6 ? 1 : 0); P.sq = -0.08 * scare;
  P.ant = 20 * wob(t, 38.9, 16, 4) + 6 * Math.sin(t * 2.7);
  P.lid = blink(t, 39.95); P.smile = 0.6 * eio(seg(t, 40.05, 40.2));
  P.flame = 0.7 + 0.3 * scare; P.flick = t * 2 * Math.PI * 7; P.rot = 8 * (t < 36.6 ? 1 : 0) - 6 * scare;
  P.zoom = spr(t, 40.55, 17, 6.5);
  return { x, y, s: 220, P };
}
const BAC = t => {   // the bacterium's path: swims to the cup, is swallowed
  const p = eio(seg(t, 35.2, 39.35)), x = lerp(320, MAC.x - MAC.R * 0.86, p) + 10 * Math.sin(t * 3), y = lerp(560, MAC.y + 10, p) + 16 * Math.sin(t * 2.2);
  const q = eio(seg(t, 39.35, 40.3));
  return [lerp(x, MAC.x + 110, q), lerp(y, MAC.y + 150, q), lerp(4, 28, q), q];
};
function blood(t, frozen) {
  el('rect', { width: W, height: H, fill: C.night });
  const z = 1 + 0.04 * eio(seg(t, 35.0, 40.6)), cam = { z, C: [960 + 20 * (z - 1) * 10, 540] };
  const Wd = g(null, { transform: camTf(cam) }), Rr = rng(31);
  for (let i = 0; i < 70; i++) { const x = Rr() * W, y = Rr() * H, r = 2 + Rr() * 5, c = Rr() < 0.7 ? C.n3 : C.mist; el('circle', { cx: r1(x + 8 * Math.sin(t * 0.5 + i)), cy: r1(y), r: r1(r), fill: c }, Wd); }
  // red blood cells drift across, slowly tumbling (a squash in x stands for the turn)
  for (const [x0, y0, r, sp, ph] of [[-30, 760, 150, 18, 0], [880, -40, 130, 14, 1.3]]) {
    const x = x0 + sp * (t - 35), sx = 0.82 + 0.18 * Math.cos(t * 0.6 + ph), G = g(Wd, { transform: `translate(${r1(x)},${y0}) scale(${sx.toFixed(3)},1) translate(${-x},${-y0})` });
    rbc(G, r1(x), y0, r);
  }
  bacterium(Wd, 210 + 10 * Math.sin(t), 300, 100, 30, -24 + 6 * Math.sin(t * 2), { dim: true });
  halo(Wd, MAC.x, MAC.y, MAC.R + 50, MAC.R + 110);
  const close = eio(seg(t, 39.4, 40.2)), lean = ebump(t, 38.7, 38.95, 39.2, 39.5);
  const d = blobPath(macOutline(t, close, lean));
  const [bx, by, brot, q] = BAC(t);
  const cell = g(Wd);
  if (q < 0.5) bacterium(cell, bx, by, 140, 40, brot);
  twoTone(cell, 'path', { d }, 30, 26, (G, dark) => el('path', { d, fill: dark ? C.mintD : C.mint }, G));
  const nuc = blobPath(polar(MAC.x + 90, MAC.y - 100, 14, a => 115 * (1 + 0.18 * Math.cos(2 * a) - 0.28 * gauss(a, 2.3, 0.35))));
  shaded(cell, 'path', { d: nuc }, C.blue, C.blueD, 16, 14);
  const vR = rng(9);
  for (let i = 0; i < 22; i++) { const a = vR() * Math.PI * 2, r = 60 + vR() * 210, x = MAC.x + Math.cos(a) * r, y = MAC.y + Math.sin(a) * r * 0.9;
    if (Math.hypot(x - (MAC.x + 90), y - (MAC.y - 100)) < 150 || Math.hypot(x - (MAC.x + 110), y - (MAC.y + 150)) < 115 || Math.hypot(x - MAC.x + 150, y - MAC.y + 100) < 90 || Math.hypot(x - MAC.x + MAC.R * 0.7, y - MAC.y) < 90) continue;
    el('circle', { cx: r1(x), cy: r1(y), r: r1(5 + vR() * 8), fill: vR() < 0.65 ? C.mintD : C.cream }, cell); }
  // phagosome forms once the cup closes
  const kph = backE(seg(t, 39.8, 40.2), 1.8);
  if (kph > 0) { el('circle', { cx: MAC.x + 110, cy: MAC.y + 150, r: r1(74 * kph), fill: C.mintD }, cell); el('circle', { cx: MAC.x + 110, cy: MAC.y + 150, r: r1(62 * kph), fill: C.n3 }, cell); }
  if (q >= 0.5) bacterium(cell, bx, by, lerp(140, 92, q), lerp(40, 30, q), brot, { tails: q < 0.8 });
  // face: eyes follow the bacterium, swing to Orbi on "hunt", shut happily after the meal
  const O = bloodOrbi(t), tgt = lean > 0.3 ? [O.x, O.y] : [bx, by];
  const ang = Math.atan2(tgt[1] - (MAC.y - 112), tgt[0] - (MAC.x - 116)), ex = 6 * Math.cos(ang), ey = 6 * Math.sin(ang);
  const shut = eio(seg(t, 40.15, 40.3));
  for (const xx of [MAC.x - 150, MAC.x - 82]) {
    if (shut > 0.5) eye(cell, xx, MAC.y - 108, 16, 'shut', C.night);
    else { el('ellipse', { cx: r1(xx + ex), cy: r1(MAC.y - 112 + ey), rx: 13, ry: r1(17 * (1 + 0.15 * lean)), fill: C.night }, cell); el('circle', { cx: r1(xx + ex - 4), cy: r1(MAC.y - 118 + ey), r: 5, fill: C.cream }, cell); }
  }
  el('path', { d: `M${MAC.x - 140},${MAC.y - 66}Q${MAC.x - 116},${MAC.y - 52 + 10 * lean} ${MAC.x - 92},${MAC.y - 66}`, fill: 'none', stroke: C.night, 'stroke-width': 6, 'stroke-linecap': 'round' }, cell);
  if (frozen) return;
  // labels
  const lab = (t0, x, y, s1, s2, anchor = 'start', tOut = 40.75) => { const k = eo(seg(t, t0, t0 + 0.3)) * (1 - eio(seg(t, tOut, tOut + 0.25)));
    if (k > 0) { wipeText(svg, x, y, s1, { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': anchor }, k, 22); wipeText(svg, x, y + 34, s2, { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': anchor }, k, 36); } };
  lab(35.6, 150, 820 - 0, 'RED BLOOD CELL', '7.5 µm across');
  lab(36.3, 1840, 160, 'WHITE BLOOD CELL', 'a macrophage', 'end');
  // Orbi; at the end its lens finds the virus
  const VP = [1720, 190];
  if (t < 40.95) dotsAB(g(), t, 40.3, 40.7, orbiLens(O.x, O.y, O.s, O.P), VP, 46, { d0: 0.3 * O.s });
  const VG = g();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; el('line', { x1: VP[0], y1: VP[1], x2: r1(VP[0] + Math.cos(a) * 7), y2: r1(VP[1] + Math.sin(a) * 7), stroke: C.cream, 'stroke-width': 2, 'stroke-linecap': 'round' }, VG); }
  el('circle', { cx: VP[0], cy: VP[1], r: 4, fill: C.cream }, VG);
  ringAt(VG, t, 40.35, VP[0], VP[1], 24, 'A virus, 0.1 µm', 1800, 340, 'end');
  if (t < TL.lens) orbi(g(), O.x, O.y, O.s, O.P);
}

// =================== shot 17 · into Orbi's lens (40.9–42.2) ===================
function lens(t) {
  blood(t);
  const O0 = bloodOrbi(TL.lens), p = seg(t, TL.lens, TL.virus - 0.15), K = Math.exp(Math.log(34) * (0.5 * ei(p) + 0.5 * eio(p)));
  const L0 = orbiLens(O0.x, O0.y, O0.s, { ...O0.P, look: [0, 0] });
  const c = [lerp(L0[0], S0[0], eio(p)), lerp(L0[1], S0[1], eio(p))];
  const P = { ...O0.P, look: [0, 0], zoom: 1, smile: 0, lid: 0, wide: 0, rot: 0 };
  const s = O0.s * K, x = c[0] - (L0[0] - O0.x) * K, y = c[1] - (L0[1] - O0.y) * K;
  orbi(g(), x, y, s, P);
  const R1 = 0.158 * s;   // lens glass radius: the virus world opens inside it
  const IN = circleClip(null, c[0], c[1], R1);
  const m = Math.min(1, R1 / 1150);
  inG(g(IN, { transform: `translate(${r1(c[0])},${r1(c[1])}) scale(${m.toFixed(4)}) translate(${-S0[0]},${-S0[1]})` }), () => virus(Math.max(t, TL.virus), true));
}

// =================== shots 18–19 · a virus; Orbi lands on it and looks back (42.2–45.8) ===================
const VIR = { x: 1100, y: 560, R: 192 };
function virusShape(p, x, y, R, rot) {
  for (let i = 0; i < 16; i++) {
    const a = rot + i / 16 * Math.PI * 2; if (Math.abs(((a + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) < 0.32 || Math.abs(((a + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - 2 * Math.PI) < 0.32) continue;
    capsule(p, x + Math.cos(a) * R * 0.92, y + Math.sin(a) * R * 0.92, x + Math.cos(a) * R * 1.22, y + Math.sin(a) * R * 1.22, R * 0.07, C.mist);
    el('circle', { cx: r1(x + Math.cos(a) * R * 1.27), cy: r1(y + Math.sin(a) * R * 1.27), r: r1(R * 0.1), fill: C.coral }, p);
  }
  shaded(p, 'circle', { cx: r1(x), cy: r1(y), r: r1(R) }, C.cream, C.creamD, R * 0.13, R * 0.12);
  const Rv = rng(77);
  for (let i = 0; i < 9; i++) { const a = Rv() * 6.28, rr = Rv() * R * 0.7; el('circle', { cx: r1(x + Math.cos(a) * rr), cy: r1(y + Math.sin(a) * rr), r: r1(R * (0.05 + Rv() * 0.04)), fill: C.creamD }, p); }
}
function virusBg(p, t) { const R = rng(55); for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H, r = 2 + R() * 4; el('circle', { cx: r1(x + 6 * Math.sin(t * 0.7 + i)), cy: r1(y + 5 * Math.cos(t * 0.6 + i)), r: r1(r), fill: R() < 0.75 ? C.n3 : C.mist }, p); } }
const virusCam = t => { const z = 1 + 0.05 * eio(seg(t, 42.2, 45.8)); return { z, C: [VIR.x - (VIR.x - 960) / z, 540] }; };
function virusOrbi(t) {
  const P = {}, land = 43.7, top = VIR.y - VIR.R - 0.36 * 180 + 6;
  const x = kf(t, [[42.3, -150], [43.7, VIR.x]]), y = kf(t, [[42.3, 380], [43.2, 230], [43.7, top]]) + (t < land ? 5 * Math.sin(t * 3) : 0);
  P.look = [kf(t, [[42.4, 1], [43.6, 0.3], [44.0, 0], [44.3, -0.8], [44.7, 0.8], [45.1, 0], [45.8, 0]]), kf(t, [[42.4, 0.2], [43.6, 0.8], [44.0, 0.5], [44.3, 0.2], [45.1, -0.1]])];
  P.flame = 0.9 * (1 - eio(seg(t, land - 0.1, land + 0.1))); P.flick = t * 2 * Math.PI * 7;
  P.sq = 0.14 * wob(t, land, 16, 7) * (t > land ? 1 : 0);
  P.tilt = 12 * (t < land ? 1 : 0) - 14 * wob(t, 45.15, 16, 3.4);
  P.ant = 16 * wob(t, land, 13, 4) + 6 * Math.sin(t * 2.4);
  P.smile = 0.85 * eio(seg(t, 45.1, 45.25)); P.lid = blink(t, 44.85); P.rot = 10 * (t < 43.5 ? 1 : 0);
  return { x, y, s: 180, P };
}
function virus(t, frozen) {
  el('rect', { width: W, height: H, fill: C.night });
  const cam = virusCam(t);
  const Wd = g(null, { transform: camTf(cam) });
  virusBg(Wd, t);
  // a hair: 80 µm wide, so at this scale only its edge fits on screen
  const hx = 1720 + (t > TL.fin ? 900 * eio(seg(t, TL.fin, TL.fin + 0.6)) : 0);
  const HG = g(Wd);
  shaded(HG, 'rect', { x: hx, y: -200, width: 2000, height: 1600, rx: 40 }, C.creamD, '#E2C9A6', 0, 0);
  for (let yy = -100; yy < 1300; yy += 150) el('path', { d: `M${hx},${yy}Q${hx + 120},${yy + 50} ${hx + 400},${yy + 30}`, fill: 'none', stroke: C.cream, 'stroke-width': 6, 'stroke-linecap': 'round' }, HG);
  halo(Wd, VIR.x, VIR.y, VIR.R + 70, VIR.R + 130);
  if (!frozen || true) virusShape(Wd, VIR.x, VIR.y, VIR.R, 0.15 + t * 0.05);
  if (frozen) return;
  const kv = eo(seg(t, 42.9, 43.2)) * (1 - eio(seg(t, TL.fin, TL.fin + 0.3)));
  if (kv > 0) { const a = mapC(cam, [VIR.x - VIR.R * 0.7, VIR.y + VIR.R * 0.7]); el('path', { d: `M${r1(a[0])},${r1(a[1])}L${r1(a[0] - 120)},${r1(a[1] + 90)}`, stroke: C.cream, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    wipeText(svg, a[0] - 130, a[1] + 110, 'A VIRUS', { 'font-size': 16, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'text-anchor': 'end' }, kv, 22);
    wipeText(svg, a[0] - 130, a[1] + 146, '0.1 µm across', { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': 'end' }, kv, 36); }
  const kh = eo(seg(t, 43.3, 43.6)) * (1 - eio(seg(t, TL.fin, TL.fin + 0.3)));
  if (kh > 0) { const hs = mapC(cam, [hx, 0])[0]; wipeText(svg, hs - 24, 180, 'A HAIR →', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3, 'text-anchor': 'end' }, kh, 22);
    wipeText(svg, hs - 24, 216, '80 µm wide', { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': 'end' }, kh, 36); }
  const O = virusOrbi(t);
  const Os = mapC(cam, [O.x, O.y]);
  if (t >= 42.3) orbi(g(), Os[0], Os[1], O.s * cam.z, O.P);
}

// =================== shot 20 · finale: the whole way down on one ribbon (45.8–50.0) ===================
function finale(t) {
  const L = ribbonLayout(t), pos = e => L.x0 + (25 - e) / 35 * L.L;
  const iconC = [pos(STOPS6[5].e), L.y], k = eio(seg(t, TL.fin, TL.fin + 0.8));
  const vc = virusCam(TL.fin), c0 = mapC(vc, [VIR.x, VIR.y]);
  // the virus scene shrinks into the last stop of the ribbon (shape match)
  const m = Math.exp(lerp(Math.log(vc.z), Math.log(7.5 * L.gk / VIR.R), k)), c = [lerp(c0[0], iconC[0], k), lerp(c0[1], iconC[1], k)];
  el('rect', { width: W, height: H, fill: C.night });
  const ks = eo(seg(t, TL.fin + 0.2, TL.fin + 0.9));
  if (ks > 0) { const R = rng(61), G = g(); for (let i = 0; i < 200; i++) { const x = R() * W, y = R() * H, q = R(), rr = (q < 0.7 ? 1.4 + R() * 1.4 : 2.6 + R() * 2) * ks; if ((y > 230 && y < 520 && x < 1300) || (y > 830 && y < 985 && x > 1230 && x < 1740)) continue; el('circle', { cx: r1(x), cy: r1(y), r: r1(rr), fill: q < 0.55 ? C.mist : q < 0.85 ? C.cream : C.sun }, G); } }
  const VG = g(null, { transform: `translate(${r1(c[0])},${r1(c[1])}) scale(${m.toFixed(5)}) translate(${-VIR.x},${-VIR.y})` });
  inG(VG, () => {
    virusBg(g(), t);
    const hx = 1720 + 900 * eio(seg(t, TL.fin, TL.fin + 0.6));
    if (k < 0.99) shaded(g(), 'rect', { x: hx, y: -200, width: 2000, height: 1600, rx: 40 }, C.creamD, '#E2C9A6', 0, 0);
    halo(g(), VIR.x, VIR.y, VIR.R + 70, VIR.R + 130);
    virusShape(g(), VIR.x, VIR.y, VIR.R, 0.15 + t * 0.05);
  });
  // Orbi rides the virus down onto the ribbon, then hops and winks
  const O = virusOrbi(TL.fin), s = Math.exp(lerp(Math.log(180 * vc.z), Math.log(120), k));
  const topY = c[1] - VIR.R * m - 0.36 * s + 6 * m, hop = Math.sin(Math.PI * seg(t, 48.75, 49.15));
  const P = { ...O.P, look: [kf(t, [[45.8, 0], [46.6, -0.9], [48.4, -0.2], [48.7, 0]]), kf(t, [[45.8, -0.1], [46.6, 0.3], [48.7, 0]])],
    smile: eio(seg(t, 49.15, 49.3)), lid: Math.max(blink(t, 49.3), blink(t, 51.2)), flame: 0.7 * ebump(t, 48.7, 48.8, 49.0, 49.2), tilt: -20 * wob(t, 49.15, 16, 3.2),
    sq: 0.12 * wob(t, 49.15, 16, 7) - 0.08 * ebump(t, 48.6, 48.72, 48.72, 48.8), ant: 18 * wob(t, 49.15, 12, 4) + 6 * Math.sin(t * 2.4), rot: 0, flick: t * 44 };
  orbi(g(), c[0], topY - 70 * hop, s, P);
  // the line that sums it up
  if (t >= 46.3) {
    const kt = spr(t, 46.3, 15, 7.5), G = g(null, { 'clip-path': clipOf('rect', { x: 180, y: 260, width: 1400, height: 190 }) });
    text(G, 196, r1(420 + 170 * (1 - kt)), '28 powers of ten', { 'font-size': 132, 'font-weight': 700, fill: C.cream, 'letter-spacing': -2 });
    wipeText(svg, 202, 494, '从银河到病毒，二十八个数量级', { 'font-size': 40, 'font-weight': 700, fill: C.sun, 'font-family': 'NotoSC', 'letter-spacing': 2 }, eio(seg(t, 46.7, 47.2)), 48);
  }
  signOff(g(), t, SIGN_T, 1720, 872);
}
const SIGN_T = 49.1;   // fully written by 49.48 s, held to the end (2.5 s)

// ---------- sign-off: the film's own label grammar (mist caps + cream line + sun line), wiped in line by line ----------
const SIGN = 'LemoLab × Claude Opus 5.5';
function signOff(p, t, t0, x, y, full = true) {
  if (t < t0) return;
  const A = { 'text-anchor': full ? 'end' : 'start' };
  if (full) {
    wipeText(p, x, y, 'THE LONG WAY DOWN · 一路往下缩', { ...A, 'font-size': 18, 'font-weight': 600, fill: C.mist, 'letter-spacing': 3, 'font-family': 'Jost,NotoSC' }, eo(seg(t, t0, t0 + 0.2)), 24);
    wipeText(p, x, y + 40, 'Scale Zoom Explainer · 扁平尺度漫游', { ...A, 'font-size': 28, 'font-weight': 600, fill: C.cream, 'font-family': 'Jost,NotoSC' }, eo(seg(t, t0 + 0.08, t0 + 0.28)), 36);
  }
  const ys = full ? y + 88 : y;
  wipeText(p, x, ys, SIGN, { ...A, 'font-size': 32, 'font-weight': 700, fill: C.sun, 'letter-spacing': 0.5 }, eo(seg(t, t0 + (full ? 0.16 : 0), t0 + (full ? 0.38 : 0.2))), 40);
}

// =================== dispatch ===================
function filmAll(t) {
  if (t < TL.dive) shotsOpen(t);
  else if (t < TL.solar) dive(t);
  else if (t < TL.earth) solar(t);
  else if (t < CLOUD_CUT) earth(t);
  else if (t < TL.skin) hand(t);
  else if (t < TL.blood) skin(t);
  else if (t < TL.lens) blood(t);
  else if (t < TL.virus) lens(t);
  else if (t < TL.fin) virus(t);
  else finale(t);
  // Orbi in screen space, for the scenes that don't draw it themselves
  if (t >= TL.dive && t < CLOUD_CUT) { const O = guideOrbi(t); if (O) orbi(g(), O.x, O.y, O.s, O.P); }
  if (t >= TL.cloud && t < 27.6) { for (let i = 0; i < CLOUD_BANKS.length; i++) cloudBank(g(), t, i); }
  ribbon(g(), t);
  subtitles(g(), t);
}
// Orbi from the dive to the clouds: one track in screen space
function guideOrbi(t) {
  const O10 = orbiPose(10), cam10 = camAt(10), p10 = layerOf(cam10, 1).at([O10.x, O10.y]);
  const P = { flick: t * 2 * Math.PI * 7 };
  if (t < TL.earth) {
    // dive and the light ride
    const lf = clamp((t - LIGHT.t0) / (LIGHT.t1 - LIGHT.t0)), cam = solarCam(t), Lw = Math.hypot(EARTH_W[0], EARTH_W[1]);
    const fr = mapC(cam, [EARTH_W[0] * lf * 0.97, EARTH_W[1] * lf * 0.97]);
    const ride = [clamp(fr[0] - 70, 420, 1500), fr[1] + 150];
    const x = t < 12.6 ? lerp(p10[0], 470, eio(seg(t, 10, 12.4))) : lerp(470, ride[0], eio(seg(t, 12.6, 13.2)));
    const y = t < 12.6 ? lerp(p10[1], 760, eio(seg(t, 10, 12.4))) : lerp(760, ride[1], eio(seg(t, 12.6, 13.2)));
    const x2 = t > 16.2 ? lerp(x, 1250, eio(seg(t, 16.2, 17.0))) : x, y2 = t > 16.2 ? lerp(y, 830, eio(seg(t, 16.2, 17.0))) : y;
    const s = lerp(O10.s, 230, eio(seg(t, 10, 12)));
    P.look = [kf(t, [[10, 0.8], [10.6, 0.5], [12.6, 0.9], [15.6, 0.9], [15.9, 1.0], [16.4, 0.3]]), kf(t, [[10, -0.6], [10.6, -0.4], [12.6, -0.3], [15.6, -0.3], [16.4, -0.5]])];
    P.tilt = 16 * eio(seg(t, 10, 10.4)) - 22 * wob(t, LIGHT.t1, 18, 3.4);
    P.flame = 1.0; P.rot = kf(t, [[10, -10], [10.6, 12], [12.6, 8], [15.6, 8], [15.9, -4], [16.4, 6]]);
    P.wide = ebump(t, 15.6, 15.7, 15.9, 16.2); P.smile = 0.8 * ebump(t, 13.3, 13.5, 15.2, 15.4);
    P.ant = -14 * wob(t, 10, 8, 3) + 18 * wob(t, LIGHT.t1, 12, 4) + 6 * Math.sin(t * 2.6);
    P.sq = -0.06 * ebump(t, 10, 10.3, 11.6, 12);
    return { x: x2 + 3 * Math.sin(t * 1.9), y: y2 + 5 * Math.sin(t * 2.83), s, P };
  }
  // Earth: carry the case, park, look at the inset, then dive toward "you"
  const E = earthOrbi(t);
  P.hold = eio(seg(t, 17.2, 17.6)) * (1 - eio(seg(t, 25.9, 26.1)));
  P.look = [kf(t, [[17, 0.2], [18.4, -0.9], [21.4, -0.9], [21.7, -1], [24.4, -1], [24.7, -0.9]]), kf(t, [[17, 0], [18.4, 0.2], [21.4, 0.2], [21.7, -0.5], [24.4, -0.5], [24.7, -0.2]])];
  P.smile = ebump(t, 19.4, 19.55, 20.4, 20.6); P.wide = ebump(t, 21.5, 21.6, 22.2, 22.5);
  P.tilt = -6 - 16 * wob(t, 19.45, 16, 3.4) + 20 * eio(seg(t, 25.9, 26.2));
  P.flame = 0.35 + 0.65 * eio(seg(t, 25.8, 26.0)) + 0.4 * (t < 18.4 ? 1 : 0); P.rot = kf(t, [[17, 6], [18.4, 0], [25.9, 0], [26.4, 18]]);
  P.ant = 14 * wob(t, 18.4, 12, 4) + 6 * Math.sin(t * 2.6) - 18 * wob(t, 25.9, 9, 3);
  P.lid = blink(t, 23.9); P.zoom = 0.8 * ebump(t, 21.2, 21.4, 23.0, 23.4);
  P.sq = 0.1 * wob(t, 18.4, 16, 7);
  return { x: E.x, y: E.y, s: lerp(230, 152, eio(seg(t, 17.0, 18.0))) * lerp(1, 1.2, eio(seg(t, 25.9, 26.5))), P };
}

// ---------- sound and cue events after 10 s ----------
function moreEvents() {
  const ev = [], pan = x => clamp((x - W / 2) / (W / 2), -1, 1);
  VO.forEach(v => ev.push({ t: v.t, type: 'vo', id: v.id, dur: v.dur, t1: +v.t1.toFixed(3), cn: v.cn, en: v.en }));
  ev.push({ t: 10.0, type: 'dive', d: 2.0 }); ev.push({ t: 10.0, type: 'wipe', d: 0.4, pan: -0.5 });
  ev.push({ t: 12.0, type: 'arrive', pan: -0.4 });
  ev.push({ t: 12.5, type: 'word', i: 0, pan: -0.6 });
  ev.push({ t: LIGHT.t0, type: 'light', d: LIGHT.t1 - LIGHT.t0 });
  ev.push({ t: LIGHT.t1, type: 'hit', pan: 0.1 });
  ev.push({ t: 15.65, type: 'lock', pan: 0.1 });
  ev.push({ t: 16.2, type: 'push', d: 0.8 });
  ev.push({ t: 17.0, type: 'cut', pan: 0.0 });
  ev.push({ t: 17.6, type: 'draw', d: 1.0, pan: 0.2 }); ev.push({ t: 18.0, type: 'tick', pan: -0.4 }); ev.push({ t: 18.2, type: 'tick', pan: 0.2 });
  ev.push({ t: 18.4, type: 'land', pan: 0.8 });
  ev.push({ t: TAPE.t0, type: 'fire', pan: 0.8 });
  for (let i = 0; i < 14; i++) ev.push({ t: TAPE.t0 + 0.8 * Math.pow(i / 14, 0.9), type: 'dot', i, n: 14, pan: 0.8 - 1.2 * i / 14 });
  ev.push({ t: TAPE.s0, type: 'tape', d: TAPE.s1 - TAPE.s0, pan: 0.2 });
  ev.push({ t: 18.95, type: 'bounce', pan: -0.7 }); ev.push({ t: 19.35, type: 'bounce', pan: -0.7, v: 0.6 });
  ev.push({ t: 21.3, type: 'zoom', pan: 0.7 }); ev.push({ t: 21.4, type: 'pop', pan: -0.3 });
  ev.push({ t: 21.9, type: 'wipe', d: 0.4, pan: -0.2 }); ev.push({ t: 23.0, type: 'wipe', d: 0.4, pan: -0.2 });
  ev.push({ t: 24.5, type: 'lock', pan: -0.8 });
  ev.push({ t: 25.9, type: 'fall', d: 1.7 });
  for (let i = 0; i < CLOUD_BANKS.length; i++) ev.push({ t: CLOUD_BANKS[i][0] + 0.7, type: 'cloud', i, pan: i % 2 ? 0.4 : -0.4 });
  ev.push({ t: 28.45, type: 'land', pan: -0.1, v: 1.2 });
  ev.push({ t: 29.6, type: 'servo', d: 0.25, pitch: 0.8, pan: -0.1 }); ev.push({ t: 29.9, type: 'blink', pan: -0.1 });
  ev.push({ t: 30.0, type: 'wipe', d: 0.35, pan: -0.3 });
  ev.push({ t: 30.85, type: 'joy', pan: -0.1 });
  ev.push({ t: 30.1, type: 'grape', pan: 0.15 }); ev.push({ t: 30.15, type: 'wipe', d: 0.35, pan: 0.2 });
  ev.push({ t: 32.25, type: 'fire', pan: 0 }); ev.push({ t: 32.5, type: 'lock', pan: 0.05 });
  ev.push({ t: 33.1, type: 'push', d: 0.9 });
  SKIN_LAYERS.forEach(([t0], i) => ev.push({ t: t0, type: 'skin', i }));
  ev.push({ t: 34.25, type: 'heart' });
  ev.push({ t: 35.6, type: 'wipe', d: 0.3, pan: -0.8 }); ev.push({ t: 36.3, type: 'wipe', d: 0.3, pan: 0.9 });
  ev.push({ t: 38.7, type: 'hunt', pan: 0.3 }); ev.push({ t: 38.9, type: 'scare', pan: -0.5 });
  ev.push({ t: 39.4, type: 'gulp', pan: 0.2 }); ev.push({ t: 39.95, type: 'blink', pan: -0.5 });
  ev.push({ t: 40.3, type: 'fire', pan: -0.4 }); ev.push({ t: 40.35, type: 'lock', pan: 0.8 });
  ev.push({ t: 40.55, type: 'zoom', pan: -0.5 }); ev.push({ t: 40.9, type: 'lensdive', d: 1.3 });
  ev.push({ t: 42.2, type: 'reveal' });
  ev.push({ t: 43.7, type: 'land', pan: 0.15 }); ev.push({ t: 42.9, type: 'wipe', d: 0.3, pan: -0.3 }); ev.push({ t: 43.9, type: 'wipe', d: 0.3, pan: 0.7 });
  ev.push({ t: 44.85, type: 'blink', pan: 0.15 });
  ev.push({ t: TL.fin, type: 'shrink', d: 0.8 });
  for (let i = 0; i < 6; i++) { const f = (STOPS6[0].e - STOPS6[i].e) / (STOPS6[0].e - STOPS6[5].e); ev.push({ t: +(46.6 + 1.8 * f).toFixed(3), type: 'stop', i, pan: -0.8 + 1.6 * f }); }
  ev.push({ t: 48.35, type: 'fill', pan: 0.5 }); ev.push({ t: 48.75, type: 'hop', pan: 0.6 }); ev.push({ t: 49.15, type: 'land', pan: 0.6 }); ev.push({ t: 49.3, type: 'blink', pan: 0.6 });
  return ev;
}
