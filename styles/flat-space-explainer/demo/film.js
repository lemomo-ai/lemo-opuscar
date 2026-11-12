// film.js: the whole film on one timeline (shot list in DEMO.md). index.html without ?f= calls film(t) with t in film seconds.
// This file holds 0–10 s (the galaxy: camera, parallax, Orbi's first performance, title, first sight line); scenes.js holds the rest.
// ?from=a&to=b renders the slice [a, b] of the film (build.sh uses 0–52): window.DUR = b − a and render(t) shows film time a + t.
const FILM_DUR = 52;
const QS = new URLSearchParams(location.search);
const FROM = +(QS.get('from') || 0), TO = QS.get('to') != null ? +QS.get('to') : FILM_DUR;
const S0 = [W / 2, H / 2];
const BEAT = 0.625;                       // 96 bpm, a bar = 2.5 s

// ---------- easing (all pure functions of t) ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eo = k => 1 - Math.pow(1 - clamp(k), 3);
const ei = k => Math.pow(clamp(k), 3);
const backE = (k, s = 1.4) => { k = clamp(k) - 1; return 1 + k * k * ((s + 1) * k + s); };
// spring step: 0 before t0, settles to 1 with one soft overshoot
const spr = (t, t0, w = 16, d = 8) => { const x = t - t0; return x <= 0 ? 0 : 1 - Math.exp(-d * x) * (Math.cos(w * x) + (d / w) * Math.sin(w * x)); };
// a decaying wobble after t0 (follow-through)
const wob = (t, t0, w = 12, d = 5) => { const x = t - t0; return x <= 0 ? 0 : Math.exp(-d * x) * Math.sin(w * x); };
// up, hold, down
const bump = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
const ebump = (t, a, b, c, d) => eio(seg(t, a, b)) * (1 - eio(seg(t, c, d)));
// piecewise track [[t, v], …], eased in and out between keys
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
    return lerp(v0, v1, eio((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}
const blink = (t, t0) => eio(seg(t, t0, t0 + 0.07)) * (1 - eio(seg(t, t0 + 0.11, t0 + 0.22)));

// ---------- the world of shots 1–5 is frame 1 (1920×1080 at zoom 1) ----------
const ORBI = { x: 470, y: 780, s: 290 * 0.95 };
const L0 = orbiLens(ORBI.x, ORBI.y, ORBI.s, { rot: -6, look: [0, 0] });   // lens at rest: the cold open is centred on it
const GAL = { x: 1230, y: 470, R: 560, tilt: -16, sq: 0.5, seed: 7 };
const SUN = (() => {   // our Sun on the galaxy's arm, the same point frame 1 rings (same maths as galaxy().at)
  const b = 0.29, r0 = GAL.R * 0.085, tt = Math.log(0.56 / 0.085) / b, ph = Math.PI, off = 10;
  const r = r0 * Math.exp(b * tt), a = tt + ph;
  const nx = Math.cos(a) * b - Math.sin(a), ny = Math.sin(a) * b + Math.cos(a), nl = Math.hypot(nx, ny);
  const x = Math.cos(a) * r - ny / nl * off, y = (Math.sin(a) * r + nx / nl * off) * GAL.sq, A = GAL.tilt * Math.PI / 180;
  return [GAL.x + Math.cos(A) * x - Math.sin(A) * y, GAL.y + Math.sin(A) * x + Math.cos(A) * y];
})();
const LAYER = { stars: 0.18, far: 0.42, galaxy: 0.75, orbi: 1 };   // parallax: how much of the camera zoom each layer takes

// ---------- camera: screen = (p − C)·z + S0, one function for everything ----------
function camAt(t) {
  const Z0 = 7.0, Z1 = 7.0 * 1.06;
  if (t < 1.25) { const z = Z0 * (1 + 0.06 * eio(t / 1.25)); return { z, C: L0 }; }
  if (t < 2.9) {   // pull back in log space with a small overshoot, the lens glides from screen centre to its place
    // starts from rest (no pop on the first frame), ends with a 2% overshoot that settles
    const p = seg(t, 1.25, 2.9), q = eio(p) + 0.09 * Math.sin(Math.PI * p) * p * p, z = Math.exp(Math.log(Z1) * (1 - q));
    const k = eio(p), SL = [lerp(S0[0], L0[0], k), lerp(S0[1], L0[1], k)];
    return { z, C: [L0[0] - (SL[0] - S0[0]) / z, L0[1] - (SL[1] - S0[1]) / z] };
  }
  const Q1 = [1150, 520];   // a slow drift in toward the galaxy
  const z1 = 1 + 0.025 * eio(seg(t, 2.9, 7.5));
  const C1 = [Q1[0] - (Q1[0] - S0[0]) / z1, Q1[1] - (Q1[1] - S0[1]) / z1];
  if (t < 7.5) return { z: z1, C: C1 };
  // from the lock on: ease into a push toward the ring (it keeps going into shot 6, the dive)
  const Q2 = [(SUN[0] - C1[0]) * z1 + S0[0], (SUN[1] - C1[1]) * z1 + S0[1]];   // the Sun on screen at 7.5 (galaxy layer ≈ world at zoom ~1)
  const k = 1 + 0.045 * Math.pow(seg(t, 7.5, 10.5), 2);
  const z = z1 * k;
  return { z, C: [C1[0] + (S0[0] - Q2[0]) * (1 - k) / z, C1[1] + (S0[1] - Q2[1]) * (1 - k) / z] };
}
function layerOf(cam, f) {
  const z = Math.pow(cam.z, f), C = [S0[0] + (cam.C[0] - S0[0]) * f, S0[1] + (cam.C[1] - S0[1]) * f];
  return {
    z, tf: `translate(${S0[0]},${S0[1]}) scale(${z.toFixed(5)}) translate(${(-C[0]).toFixed(3)},${(-C[1]).toFixed(3)})`,
    at: p => [(p[0] - C[0]) * z + S0[0], (p[1] - C[1]) * z + S0[1]],
  };
}
const fovLy = t => 185000 / Math.pow(camAt(t).z, LAYER.galaxy);

// ---------- Orbi's performance ----------
function orbiPose(t) {
  const P = {};
  P.look = [
    kf(t, [[0, -0.35], [0.28, -0.35], [0.42, 0.4], [0.56, 0.4], [0.8, 0], [2.45, 0], [2.7, -0.3], [4.35, -0.3], [4.65, 0.8], [8.1, 0.8], [8.3, 0.35], [9.0, 0.35], [9.25, 0.8]]),
    kf(t, [[0, 0], [0.42, -0.1], [0.8, 0], [2.45, 0], [2.7, -0.9], [4.35, -0.9], [4.65, -0.6], [8.1, -0.6], [8.3, -0.15], [9.0, -0.15], [9.25, -0.6]]),
  ];
  P.lid = Math.max(blink(t, 0.56), blink(t, 9.38));
  // zoom: focus in the cold open, let go during the pull-back, then the real zoom before firing
  P.zoom = spr(t, 0.85, 18, 7) * (1 - eio(seg(t, 1.35, 1.95)))
         + spr(t, 5.56, 17, 6.5) * (1 - 0.65 * eio(seg(t, 7.65, 8.15)));
  P.wide = ebump(t, 7.42, 7.56, 7.75, 8.05);
  P.smile = eio(seg(t, 8.06, 8.2)) * (1 - eio(seg(t, 9.0, 9.2)));
  // nods as the title words land (beats 2.5, 2.8125, 3.125, 3.4375)
  let nod = 0; for (const w of [2.5, 2.8125, 3.125, 3.4375]) nod += wob(t, w + 0.03, 22, 9);
  // anticipation (5.0–5.5): squash and sweep the panels back; release at 5.56: stretch, panels snap forward
  const ant = eio(seg(t, 5.0, 5.5)) * (1 - spr(t, 5.56, 20, 8));
  const rel = wob(t, 5.56, 18, 7);
  // the hop of joy: crouch 8.0–8.12, up 8.12–8.62 (lands), settle
  const crouch = ebump(t, 8.0, 8.12, 8.12, 8.2), hopP = seg(t, 8.12, 8.62), land = wob(t, 8.62, 20, 9);
  const hopY = hopP > 0 && hopP < 1 ? Math.sin(Math.PI * hopP) : 0;
  P.sq = 0.12 * ant - 0.1 * rel + 0.035 * nod + 0.1 * crouch - 0.09 * (hopP > 0 && hopP < 0.5 ? Math.sin(Math.PI * hopP * 2) : 0) + 0.07 * Math.max(0, land);
  P.rot = kf(t, [[0, -6], [2.45, -6], [2.7, -3], [4.35, -3], [4.7, -10]]) + 2.5 * nod + 5 * ant - 3 * rel;
  P.tilt = -8 + 18 * ant - 12 * rel - 18 * wob(t, 8.12, 20, 3.2) - 6 * crouch;
  P.flame = 0.75 * eio(seg(t, 1.5, 2.2)) + 0.35 * rel + 0.6 * ebump(t, 8.08, 8.14, 8.3, 8.55) + 0.25 * wob(t, 6.25, 10, 6);
  P.flick = t * 2 * Math.PI * 7;
  // position: idle float, anticipation pull-back, recoil when it fires, the hop
  const recoil = clamp((t - 6.25) / 0.05) * (t > 6.3 ? Math.exp(-6 * (t - 6.3)) : 1) * (t > 6.25 ? 1 : 0);
  const x = ORBI.x + 3 * Math.sin(2 * Math.PI * 0.3 * t) - 12 * ant + 6 * rel - 10 * recoil;
  const y = ORBI.y + 6 * Math.sin(2 * Math.PI * 0.45 * t + 0.5) + 8 * ant - 4 * rel + 6 * recoil + 3 * nod - 30 * hopY + 6 * crouch;
  // antenna follow-through: lags the body's vertical speed, plus kicks
  const vy = 6 * 2 * Math.PI * 0.45 * Math.cos(2 * Math.PI * 0.45 * t + 0.5);
  P.ant = -0.25 * vy + 16 * rel + 22 * wob(t, 6.25, 14, 5) - 26 * wob(t, 8.12, 11, 4) + 14 * wob(t, 8.62, 13, 5) - 8 * nod;
  return { x, y, s: ORBI.s, P };
}

// ---------- text helpers: measured once, wiped or risen in with clip rects (no fades) ----------
const MEAS = {};
function measure(str, a) {
  const key = str + JSON.stringify(a);
  if (MEAS[key] == null) { const tx = el('text', { x: 0, y: -999, ...a }); tx.textContent = str; MEAS[key] = tx.getComputedTextLength(); tx.remove(); }
  return MEAS[key];
}
function wipeText(p, x, y, str, a, k, h = 60) {   // left-to-right wipe; a['text-anchor'] respected
  if (k <= 0) return;
  const w = measure(str, a), x0 = a['text-anchor'] === 'end' ? x - w : a['text-anchor'] === 'middle' ? x - w / 2 : x;
  const G = g(p, { 'clip-path': clipOf('rect', { x: r1(x0 - 8), y: r1(y - h), width: r1((w + 16) * clamp(k)), height: r1(h * 1.45) }) });
  return text(G, x, y, str, a);
}

// ---------- title (screen space) ----------
function title(p, t) {
  const A = { 'font-size': 132, 'font-weight': 700, fill: C.cream, 'letter-spacing': -2 };
  const lines = [{ y: 268, words: ['The', 'Long'], at: [2.5, 2.8125] }, { y: 392, words: ['Way', 'Down'], at: [3.125, 3.4375] }];
  for (const L of lines) {
    const G = g(p, { 'clip-path': clipOf('rect', { x: 90, y: L.y - 150, width: 760, height: 190 }) });
    const full = L.words.join(' ');
    L.words.forEach((wd, i) => {
      const t0 = L.at[i]; if (t < t0) return;
      const x = 116 + (i === 0 ? 0 : measure(full, A) - measure(wd, A));
      const k = spr(t, t0, 15, 7.5), out = eio(seg(t, 10.0 + (L.y > 300 ? 0.08 : 0) + i * 0.05, 10.32 + (L.y > 300 ? 0.08 : 0) + i * 0.05));
      text(G, r1(x), r1(L.y + 165 * (1 - k) + 175 * out), wd, A);
    });
  }
  const ko = 1 - eio(seg(t, 10.0, 10.3));
  wipeText(p, 122, 458, '28 powers of ten, from a galaxy to a virus', { 'font-size': 32, 'font-weight': 500, fill: C.mist }, eo(seg(t, 3.75, 4.3)) * ko, 40);
  wipeText(p, 122, 516, '从银河一路缩到一个病毒', { 'font-size': 34, 'font-weight': 700, fill: C.sun, 'font-family': 'NotoSC', 'letter-spacing': 2 }, eio(seg(t, 4.0, 4.55)) * ko, 42);
}

const fmt = v => (v >= 10000 ? Math.round(v / 1000) * 1000 : Math.round(v)).toLocaleString('en-US');

// ---------- next-stop ring: locks on at 7.3–7.8, then the leader and label wipe in ----------
const RING_LABEL = [880, 690];   // frame 1: label offset is kept relative to the Sun
function lockRing(p, t, sx, sy) {
  if (t < 7.3) return;
  const r = 26 + 70 * (1 - spr(t, 7.3, 15, 8.5));
  el('circle', { cx: r1(sx), cy: r1(sy), r: r1(r), fill: 'none', stroke: C.sun, 'stroke-width': 4 }, p);
  const ko = eo(seg(t, 7.38, 7.62));
  if (ko > 0) el('circle', { cx: r1(sx), cy: r1(sy), r: r1(r + 13 * ko), fill: 'none', stroke: C.sun, 'stroke-width': 2.5, 'stroke-dasharray': '3 9', 'stroke-dashoffset': r1(-(t - 7.3) * 9), 'stroke-linecap': 'round' }, p);
  const lx = sx + (RING_LABEL[0] - SUN[0]), ly = sy + (RING_LABEL[1] - SUN[1]);
  const a = Math.atan2(ly - sy, lx - sx), x1 = sx + Math.cos(a) * 48, y1 = sy + Math.sin(a) * 48, ex = lx - 30, ey = ly - 46;
  const kl = eio(seg(t, 7.62, 7.92));
  if (kl > 0) el('path', { d: `M${r1(x1)},${r1(y1)}L${r1(lerp(x1, ex, kl))},${r1(lerp(y1, ey, kl))}`, stroke: C.sun, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, p);
  wipeText(p, lx, ly - 18, 'NEXT STOP', { 'font-size': 16, 'font-weight': 600, fill: C.sun, 'letter-spacing': 3, 'text-anchor': 'end' }, eo(seg(t, 7.8, 8.05)), 22);
  wipeText(p, lx, ly + 14, 'Our Sun', { 'font-size': 28, 'font-weight': 600, fill: C.cream, 'text-anchor': 'end' }, eo(seg(t, 7.9, 8.2)), 36);
}

// ---------- the sight line: dots fired from the lens, one by one, stopping short of the ring ----------
const DOT = { gap: 17, r: 3.4, t0: 6.25, t1: 7.2 };
function sightGeom(t) {
  const cam = camAt(t), O = orbiPose(t), Lo = layerOf(cam, LAYER.orbi), Lg = layerOf(cam, LAYER.galaxy);
  const lw = orbiLens(O.x, O.y, O.s, O.P), A = Lo.at(lw), B = Lg.at(SUN);
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  return { A, B, len, d0: O.s * Lo.z * 0.3, d1: len - 26 - 22 };
}
function sight(p, t) {
  if (t < DOT.t0) return;
  const { A, B, len, d0, d1 } = sightGeom(t);
  const front = lerp(d0, d1, eio(seg(t, DOT.t0, DOT.t1)) * 0.85 + seg(t, DOT.t0, DOT.t1) * 0.15);
  const m = t > 7.2 ? 14 * (t - 7.2) - 14 * 0.35 * (1 - Math.exp(-(t - 7.2) / 0.35)) : 0, off = m % DOT.gap;
  for (let d = d0 + off - DOT.gap; d <= Math.min(front, d1) + 0.01; d += DOT.gap) {
    if (d < d0) continue;
    const pop = backE(clamp((front - d) / 55), 2.2), grow = clamp((d - d0) / DOT.gap + (off === 0 ? 1 : 0)), fade = clamp((d1 - d) / DOT.gap + 0.02);
    const k = Math.min(pop, grow, fade); if (k <= 0.02) continue;
    el('circle', { cx: r1(A[0] + (B[0] - A[0]) * d / len), cy: r1(A[1] + (B[1] - A[1]) * d / len), r: r1(DOT.r * k), fill: C.sun }, p);
  }
}

// ---------- shots 1–5 ----------
function shotsOpen(t, o = {}) {
  el('rect', { width: W, height: H, fill: C.night });
  const cam = camAt(t);
  // stars: frame 1's field, plus a margin so pull-back overshoot never shows an empty edge; sparkles breathe slowly
  const Ls = layerOf(cam, LAYER.stars), SG = g(null, { transform: Ls.tf });
  stars(SG, 11, 230, inBoxes([[110, 150, 650, 380], [1210, 870, 600, 190], [330, 620, 400, 300], [700, 600, 190, 110]]));
  const Rm = rng(12);
  for (let i = 0; i < 120; i++) {
    const x = -320 + Rm() * (W + 640), y = -240 + Rm() * (H + 480), k = Rm(), rr = k < 0.7 ? 1.4 + Rm() * 1.4 : 2.6 + Rm() * 2;
    if (x > 0 && x < W && y > 0 && y < H) continue;
    el('circle', { cx: r1(x), cy: r1(y), r: r1(rr), fill: k < 0.55 ? C.mist : k < 0.85 ? C.cream : C.sun }, SG);
  }
  const Lf = layerOf(cam, LAYER.far), FG = g(null, { transform: Lf.tf });
  tinyGalaxy(FG, 1720, 760, 26, 24); tinyGalaxy(FG, 880, 140, 18, -30); tinyGalaxy(FG, 140, 760, 14, 10);
  const Lg = layerOf(cam, LAYER.galaxy);
  galaxy(g(null, { transform: Lg.tf }), GAL.x, GAL.y, GAL.R, GAL.tilt, GAL.sq, GAL.seed);
  // four-point sparkles ride the star layer but sit above the galaxy's halo (parallax would slide some under it); they breathe slowly
  const SP = g(null, { transform: Ls.tf }), tw = (i, sz) => sz * (1 + 0.16 * Math.sin(t * 2 * Math.PI * 0.32 + i * 2.1));
  [[300, 610, 14], [1010, 110, 18], [1820, 260, 12], [880, 980, 12], [160, 140, 10], [1600, 860, 16]].forEach(([x, y, sz], i) => sparkle(SP, x, y, tw(i, sz), C.cream));
  [[820, 250, 11], [1700, 120, 9], [420, 990, 9]].forEach(([x, y, sz], i) => sparkle(SP, x, y, tw(i + 6, sz), C.sun));
  // the Sun marker stays one size on screen; it pulses when the dots reach it
  const [sx, sy] = Lg.at(SUN), ui = g();
  const pulse = 1 + 0.5 * ebump(t, 7.1, 7.25, 7.3, 7.6);
  el('circle', { cx: r1(sx), cy: r1(sy), r: r1(7 * pulse), fill: C.sun }, ui);
  el('circle', { cx: r1(sx), cy: r1(sy), r: r1(3.5 * pulse), fill: C.cream }, ui);
  if (o.worldOnly) return;
  lockRing(ui, t, sx, sy);
  title(g(), t);
  sight(g(), t);
  const O = orbiPose(t), Lo = layerOf(cam, LAYER.orbi);
  orbi(g(null, { transform: Lo.tf }), O.x, O.y, O.s, O.P);
}

function film(t) { filmAll(t); }

// ---------- sound and cue events (film seconds; build.sh exports the slice) ----------
function filmEvents() {
  const ev = [], pan = x => clamp((x - W / 2) / (W / 2), -1, 1);
  const O = t => layerOf(camAt(t), 1).at([orbiPose(t).x, orbiPose(t).y]);
  ev.push({ t: 0.3, type: 'servo', d: 0.25, pitch: 0.7, pan: 0 });            // iris scans
  ev.push({ t: 0.56, type: 'blink', pan: 0 });
  ev.push({ t: 0.85, type: 'servo', d: 0.2, pitch: 1.0, pan: 0 });            // focus: barrel out
  ev.push({ t: 1.03, type: 'focus', pan: 0 });
  ev.push({ t: 1.25, type: 'pull', d: 1.6, pan: 0 });
  [2.5, 2.8125, 3.125, 3.4375].forEach((t, i) => ev.push({ t: t + 0.04, type: 'word', i, pan: -0.55 }));
  ev.push({ t: 3.75, type: 'wipe', d: 0.55, pan: -0.55 }); ev.push({ t: 4.0, type: 'wipe', d: 0.55, pan: -0.55 });
  for (let i = 0; i < 8; i++) ev.push({ t: 3.85 + i * 0.07, type: 'tick', pan: 0.45 + i * 0.05 });   // track and stops pop in
  for (let i = 0; i < 12; i++) ev.push({ t: 4.05 + 0.7 * Math.pow(i / 12, 1.6), type: 'count', pan: 0.4 });
  ev.push({ t: 4.72, type: 'ringtick', pan: 0.4 });
  ev.push({ t: 4.4, type: 'servo', d: 0.3, pitch: 0.8, pan: pan(O(4.4)[0]) });   // turns to the galaxy
  ev.push({ t: 5.0, type: 'flap', pan: pan(O(5)[0]) });
  ev.push({ t: 5.5, type: 'servo', d: 0.12, pitch: 1.3, pan: pan(O(5.5)[0]) });
  ev.push({ t: 5.56, type: 'zoom', pan: pan(O(5.56)[0]) });
  ev.push({ t: 6.25, type: 'fire', pan: pan(O(6.25)[0]) });
  // one pip per dot, at the moment it pops out (same front curve as sight())
  const g0 = sightGeom(6.7), N = Math.floor((g0.d1 - g0.d0) / DOT.gap) + 1;
  for (let i = 0; i < N; i++) {
    const d = g0.d0 + i * DOT.gap; let lo = DOT.t0, hi = DOT.t1;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2, q = sightGeom(m), f = lerp(q.d0, q.d1, eio(seg(m, DOT.t0, DOT.t1)) * 0.85 + seg(m, DOT.t0, DOT.t1) * 0.15); if (f < d) lo = m; else hi = m; }
    const x = lerp(g0.A[0], g0.B[0], d / g0.len);
    ev.push({ t: +lo.toFixed(4), type: 'dot', i, n: N, pan: pan(x) });
  }
  ev.push({ t: 7.3, type: 'lock', pan: pan(SUN[0]) });
  ev.push({ t: 7.8, type: 'wipe', d: 0.4, pan: pan(SUN[0] - 200) });
  ev.push({ t: 8.0, type: 'hop', pan: pan(O(8)[0]) });
  ev.push({ t: 8.12, type: 'flap', pan: pan(O(8.12)[0]) });
  ev.push({ t: 8.62, type: 'land', pan: pan(O(8.62)[0]) });
  ev.push({ t: 9.38, type: 'blink', pan: pan(O(9.38)[0]) });
  return ev.concat(moreEvents()).sort((a, b) => a.t - b.t);
}
