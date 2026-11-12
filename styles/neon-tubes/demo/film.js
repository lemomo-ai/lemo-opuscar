// 《夜宵》 Midnight Snack · neon tube MV, 48 s. render(t) depends on t only.
// A neon cat goes after the goldfish of the 金鱼 sign, cracks its bowl, and carries the fading fish home to the goblet of its own 冰室 sign.
// Canvas 2D draws every tube's cross-section profile, gas colour and emission, the painted / built surfaces and the self-lit things;
// gl.js shades the tubes as glass cylinders, lights the facade with the blurred emission and adds the wet street, puddles and rain.
// The cat and the fish move like a real animated neon sign: one bent tube per pose, switched on the beat grid, no in-betweens.
import { clamp, lerp, seg, ss, eio, eo, hsh, track, at, sub, cumlen, tubeFromStrokes } from './lib.js';
import { buildStreet, BUILDINGS, FRONTS, UPPER, AC, GAS, CLEAR, artTube, GOBLET, BOWL, BOARD_TOP as BT } from './world.js';
import { makeGL } from './gl.js';

const W = innerWidth, H = innerHeight, S = W / 1920;
const DUR = 48.0; window.DUR = DUR;
const G = await (await fetch('glyphs.json')).json();
const A = await (await fetch('art.json')).json();
const ff = [new FontFace('NotoSC', 'url(fonts/NotoSansSC-sub.ttf)', { weight: '100 900' }), new FontFace('Barlow', 'url(fonts/BarlowCondensed-Bold.ttf)', { weight: '700' })];
for (const f of ff) { await f.load(); document.fonts.add(f); }

const F = 1.3 * W;                      // focal length, px
const BEAT = 0.5;                       // 120 BPM, bar lines on even seconds
const CS = 1.7;                         // cat scale: art units -> metres (sitting height about 0.95 m)
const FS = { bowl: 1.55, cup: 1.35, mouth: CS * 0.85 };
const ST = buildStreet(G, A);
const SIGN = Object.fromEntries(ST.signs.map(s => [s.id, s]));

// ================================================================== timeline
export const T = {
  eye: 0.25, fill0: 0.6, fill1: 1.35, home: 1.6, want: 3.25, whip0: 3.75, whip1: 4.0, gold: 4.0, match: 7.0, leap: 8.0,
  clock: 8.5, swat: 9.0, spin1: 10.0, rain0: 9.6, box: 10.5, arrow: 11.0, fling: 11.875, kara: 12.5, alley: 14.5, shop: 15.5,
  crack: 18.5, drain: [19.0, 20.0, 21.0], level: [19.5, 20.5], bowlDie: 21.5, goldOff: 22.0, flat: 22.0, back: 22.5, look: 23.0,
  hush: 23.5, dive: 24.0, grab: 24.25, fall: 24.75, street: 26.0, chorus: 26.0, wide: 28.5, low2: 30.5, bigDrop: 31.0, climb: 31.5,
  cup: 33.0, release: 33.25, revive: 34.0, close: 37.5, rainStop: 37.5,
  offs: { kara: 38.0, deco: 38.25, hotel: 38.5, arrow: 39.0, clock: 39.5, pharm: 39.5, shi: 40.0, straw: 40.5 },
  curl: 40.5, sleep: 41.5, tilt: 42.4, hold: 42.95, lastDrip: 43.3, card: 44.0, peek: 46.5,
};

// ================================================================== power
function strike(t, t0, sd = 0) {          // neon strike: two flashes, then a ramp to full
  const d = t - t0; if (d < 0) return 0;
  const j = hsh(sd) * 0.03;
  if (d < 0.05 + j) return 1.0; if (d < 0.12 + j) return 0.0; if (d < 0.17 + j) return 0.7; if (d < 0.23 + j) return 0.08;
  return Math.min(1, 0.6 + (d - 0.23 - j) * 5);
}
function offAt(t, t1) { const d = t - t1; return d < 0 ? 1 : d < 0.04 ? 0.25 : d < 0.07 ? 0.7 : 0; }
const hum = (t, sd) => 1 - 0.03 * hsh(Math.floor(t * 30) * 1.7 + sd);
const mixc = (a, b, w) => [lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w)];
const ON = {      // circuit -> [on time, argon warm-up?, off time]
  'ice.cup': [1.6, 1, 99], 'ice.water': [1.75, 1, 99], 'ice.cubes': [1.85, 0, 99], 'ice.straw': [1.95, 0, T.offs.straw], 'ice.bing': [2.05, 0, 99], 'ice.shi': [2.17, 0, T.offs.shi], 'ice.en': [2.3, 1, T.offs.shi],
  'gold.bowl': [4.0, 0, 99], 'gold.zh': [4.02, 0, 99], 'gold.en': [4.08, 1, 99], 'gold.water0': [4.05, 1, 99], 'gold.water1': [T.level[0], 1, 99], 'gold.water2': [T.level[1], 1, 99],
  'gold.bub0': [4.1, 0, T.crack + 0.25], 'gold.bub1': [4.1, 0, T.crack + 0.25], 'gold.bub2': [4.1, 0, T.crack + 0.25], 'gold.peb': [4.15, 0, 99], 'gold.weed': [4.18, 0, 99],
  'clock.ring': [T.clock, 1, T.offs.clock],
  'pharm.cross': [9.7, 0, T.offs.pharm], 'pharm.cross2': [9.78, 0, T.offs.pharm], 'pharm.zh': [9.86, 0, T.offs.pharm], 'pharm.en': [9.94, 0, T.offs.pharm],
  'hotel.zh': [T.box, 0, T.offs.hotel], 'hotel.en': [T.box + 0.12, 0, T.offs.hotel],
  'hotel.arR': [T.arrow, 0, T.street], 'hotel.arL': [T.street, 0, T.offs.arrow],
  'kara.micA': [12.25, 0, T.offs.kara], 'kara.micB': [12.31, 1, T.offs.kara], 'kara.ge': [12.75, 0, T.offs.kara], 'kara.ting': [13.0, 0, T.offs.kara], 'kara.en': [13.25, 0, T.offs.kara],
};
for (let k = 0; k < 3; k++) ON['hotel.ar' + k] = [T.arrow + k * 0.0625, 0, T.offs.arrow];
for (let i = 0; i < 3; i++) { ON['deco.' + i] = [13.25 + i * 0.25, 0, T.offs.deco + i * 0.08]; ON['deco.' + i + 'b'] = [13.31 + i * 0.25, 0, T.offs.deco + i * 0.08]; }
const SIGN_X = { pharm: 2.0, ice: 7.0, clock: 9.28, hotel: 12.0, kara: 16.5, deco: 16.7, gold: 23.5 };
const fl = (t, sd, a = 0.28) => hsh(Math.floor(t * 24) * 3.7 + sd) > a ? 1 : 0.15;     // a failing tube's flicker

function circuit(name, t) {
  const o = ON[name]; if (!o) return { p: 0, fill: 1 };
  let p = strike(t, o[0], name.length * 3.1 + o[0]), col = null, fill = 1;
  if (o[1]) {           // argon + mercury: starts as a dim violet, mercury vapour warms to full blue in about a second
    const w = seg(t, o[0], o[0] + 1.1); p *= 0.35 + 0.65 * w;
    col = mixc([0.55, 0.3, 0.85], GAS.argon, w);
  }
  p *= offAt(t, o[2]);
  const sid = name.split('.')[0];
  // the goldfish shop after the crack: water drains a level at a time, each line dying a section at a time; its sign fails too
  if (name.startsWith('gold.water')) {
    const i = +name.slice(-1), d0 = T.drain[i];
    if (t >= d0) { const k = Math.floor((t - d0) / 0.125); fill = [1, 0.72, 0.45, 0.2][k] ?? 0; p *= fill > 0 ? fl(t, i * 7) : 0; }
  }
  if ((name === 'gold.zh' || name === 'gold.en' || name === 'gold.peb' || name === 'gold.weed') && t >= T.crack) {
    p *= t < T.goldOff - 0.5 ? (hsh(Math.floor(t * 12) + name.length) > 0.12 ? 1 : 0.4) : t < T.goldOff ? fl(t, name.length, 0.5) : 0;
  }
  // bubbles chase upward in 8ths
  if (name.startsWith('gold.bub')) { const i = +name.slice(-1), ph = Math.floor((t - 4.0) / 0.25) % 4; p *= ph === 3 ? 0.15 : ph >= i ? 1 : 0.15; }
  // chorus: a chase wave follows the running cat down the street; the microphone, frames and arrow swap circuits on the beat
  if (t >= T.chorus && t < T.cup) {
    const n = Math.floor((t - T.chorus) / BEAT), tw = (t - T.chorus) % BEAT;
    const sx = SIGN_X[sid] ?? null;
    if (sx !== null && sid !== 'gold' && !(sid === 'ice' && /cup|water|cubes/.test(name))) {
      const tp = catPassTime(sx);
      if (tp !== null && t >= tp && t < tp + 0.2) p *= (t - tp) < 0.07 ? 0.1 : 1.0;
      if (Math.abs(tw - 0.04 - ((SIGN_X[sid] ?? 0) / 25) * 0.25) < 0.03) p *= 0.25;
    }
    if (name === 'kara.micA') p *= n % 2 ? 0 : 1; if (name === 'kara.micB') p *= n % 2 ? 1 : 0;
    if (/^deco\.\d$/.test(name)) p *= n % 2 ? 0 : 1; if (/^deco\.\db$/.test(name)) p *= n % 2 ? 1 : 0;
    if (name === 'pharm.cross2') p *= Math.floor((t - T.chorus) / (BEAT / 2)) % 2 ? 0.1 : 1;
  }
  // hotel arrow: chases right (16ths) carrying the cat; from the chorus on it chases left, toward home
  if (/^hotel\.ar\d$/.test(name) && t > T.arrow + 0.2) {
    const k = +name.slice(-1), ph = Math.floor((t - T.arrow) / (BEAT / 4)) % 5, kk = t < T.street ? k : 2 - k;
    p *= ph === 4 ? 0 : (kk <= ph ? 1 : 0);
  }
  return { p: clamp(p * hum(t, name.length * 7.3)), fill, col };
}

// ================================================================== the cat: one bent tube per pose, switched on the beat
const CK = [];
const K_ = (t, pose, x, y, face, o = {}) => CK.push({ t, pose, x, y, face, z: o.z ?? 0.05, mv: o.mv ?? 0, fish: !!o.fish, eyeOff: !!o.eyeOff });
function jump(t0, x0, y0, x1, y1, apex, face, n, o = {}) {       // push, n flight frames on a parabola, land; one frame per 8th
  const dt = o.dt ?? 0.125;
  K_(t0, o.push ?? 'leap_push', x0, y0, face, { ...o, z: o.z0 ?? 0.05, mv: 1 });
  for (let i = 1; i <= n; i++) {
    const u = i / (n + 1), x = lerp(x0, x1, u), y = lerp(y0, y1, u) + apex * 4 * u * (1 - u);
    const pose = i === n && n > 1 ? (o.late ?? 'leap_land') : (o.fly ?? 'leap_fly');
    K_(t0 + i * dt, pose, x, y + (pose === 'leap_fly' ? 0.26 : 0), face, { ...o, z: lerp(o.z0 ?? 0.05, o.z1 ?? 0.05, u), mv: 1 });
  }
  K_(t0 + (n + 1) * dt, o.land ?? 'land', x1, y1, face, { ...o, z: o.z1 ?? 0.05, mv: 1 });
}
function run(t0, t1, x0, x1, y, face, o = {}) {
  const dt = 0.125, n = Math.round((t1 - t0) / dt);
  for (let i = 0; i < n; i++) K_(t0 + i * dt, 'run_' + (1 + (i + (o.ph ?? 0)) % 4), lerp(x0, x1, i / n), y, face, { ...o, mv: 1 });
}
// crack point on the bowl (40 degrees up its right side) and where the pouncing cat must be for its paw to hit it
const CRACK = [BOWL[0] + 0.5 * Math.cos(0.7), BOWL[1] + 0.5 * Math.sin(0.7)];
const POUNCE = [CRACK[0] + 0.31 * CS, CRACK[1] + 0.2 * CS];
{
  // 1 home: glass, the eye strikes, the light fills the outline; yawn, stretch, sit up
  K_(0, 'loaf_open', 6.9, BT.ice, 1);
  K_(2.25, 'yawn', 6.9, BT.ice, 1); K_(2.75, 'stretch', 6.95, BT.ice, 1); K_(T.want, 'sit_alert', 7.3, BT.ice, 1);
  // 2-3 the round eye (match cut on the bowl), the eye narrows, the hunting crouch, the wiggle
  K_(T.match, 'sit_wide', 7.3, BT.ice, 1); K_(7.25, 'sit_slit', 7.3, BT.ice, 1);
  ['crouch_a', 'crouch_b', 'crouch_a', 'crouch_b'].forEach((p, i) => K_(7.375 + i * 0.125, p, 7.25, BT.ice, 1, { mv: i > 0 ? 0 : 1 }));
  // 4 down the street: onto the clock, a swat that spins five hours away, the hotel box, the arrow conveyor, the karaoke board, the alley leap
  jump(7.875, 7.35, BT.ice, 9.1, 4.08, 0.75, 1, 4);
  K_(8.75, 'clock_reach', 9.08, 4.08, 1); K_(T.swat, 'clock_swat', 9.08, 4.08, 1); K_(9.25, 'land', 9.12, 4.08, 1); K_(9.5, 'sit_alert', 9.12, 4.08, 1);
  jump(10.0, 9.2, 4.08, 11.78, 5.05, 0.55, 1, 3, { z0: 0.05, z1: 2.05 });
  jump(10.75, 11.82, 5.05, 11.5, 2.45, 0.12, 1, 1, { z0: 2.05, z1: 0.05, late: 'leap_land', fly: 'leap_land' });
  run(11.0, 11.875, 11.5, 12.85, 2.45, 1);
  jump(11.875, 12.95, 2.45, 15.9, BT.kara, 1.25, 1, 4);
  run(12.5, 13.875, 15.9, 18.7, BT.kara, 1);
  ['crouch_a', 'crouch_b', 'crouch_a', 'crouch_b', 'crouch_a'].forEach((p, i) => K_(13.875 + i * 0.125, p, 18.75, BT.kara, 1));
  jump(T.alley, 18.8, BT.kara, 23.3, BT.gold, 0.95, 1, 6);
  // 5 the goldfish: turn round, peer, a paw into the bowl twice, wiggle, pounce, recoil; ears flat, half a step back, look; dive and take the fish
  K_(15.75, 'land', 23.38, BT.gold, -1); K_(16.0, 'lie_peer', 23.33, BT.gold, -1);
  K_(16.5, 'lie_reach', 23.3, BT.gold, -1); K_(17.0, 'lie_peer', 23.33, BT.gold, -1); K_(17.5, 'lie_reach', 23.3, BT.gold, -1);
  ['wiggle_a', 'wiggle_b', 'wiggle_a', 'wiggle_b'].forEach((p, i) => K_(18.0 + i * 0.125, p, 23.45, BT.gold, -1));
  K_(T.crack, 'pounce', POUNCE[0], POUNCE[1], -1, { mv: 1 });
  K_(18.75, 'recoil', 23.55, BT.gold, -1, { mv: 1 });
  K_(T.flat, 'ears_flat', 23.55, BT.gold, -1); K_(T.back, 'ears_flat', 23.72, BT.gold, -1); K_(T.look, 'look_down', 23.6, BT.gold, -1);
  K_(T.dive, 'dive', 22.78, 4.11, -1, { mv: 1 }); K_(T.grab, 'carry_up', 22.8, 4.47, -1, { fish: 1, mv: 1 }); K_(24.5, 'carry_stand', 22.42, 4.45, -1, { fish: 1 });
  // 6 the run home (chorus): down to the street, along the base of the wall, over the alley, up the 冰室 facade
  K_(T.fall, 'leap_push', 22.3, 4.45, -1, { fish: 1, mv: 1 });
  [[25.0, 22.0, 4.0], [25.25, 21.9, 3.0], [25.5, 21.95, 1.9], [25.75, 22.0, 0.85]].forEach(([t, x, y]) => K_(t, 'drop_fall', x, y, -1, { fish: 1, mv: 1 }));
  K_(T.street, 'land', 22.0, 0.02, -1, { fish: 1, mv: 1 });
  run(26.125, 26.5, 21.75, 21.15, 0.02, -1, { fish: 1 });
  jump(26.5, 21.05, 0.02, 18.6, 0.02, 0.9, -1, 5, { fish: 1 });
  run(27.25, T.climb, 18.45, 6.95, 0.02, -1, { fish: 1 });
  K_(T.climb, 'crouch_a', 6.85, 0.02, -1, { fish: 1, mv: 1 });
  K_(31.625, 'climb', 6.75, 0.85, -1, { fish: 1, mv: 1 }); K_(31.875, 'land', 6.62, 2.7, -1, { fish: 1, mv: 1 });
  K_(32.125, 'climb', 6.5, 3.35, -1, { fish: 1, mv: 1 }); K_(32.375, 'land', 6.42, BT.ice, -1, { fish: 1, mv: 1 });
  K_(32.625, 'leap_push', 6.3, BT.ice, -1, { fish: 1, mv: 1 }); K_(32.75, 'leap_land', 6.18, 4.7, -1, { fish: 1, mv: 1 });
  // 7 the goblet: set the fish down in the water; it goes out, then strikes again
  K_(T.cup, 'sit_down', 6.02, GOBLET[1], -1, { fish: 1, mv: 1 }); K_(T.release, 'sit_drop', 6.02, GOBLET[1], -1);
  K_(T.revive, 'sit_watch', 6.02, GOBLET[1], -1); K_(35.5, 'sit_happy', 6.02, GOBLET[1], -1);
  // 8-9 closing time: curl up beside the goblet, the eye goes out; one eye strikes open again at the end
  K_(T.curl, 'curl_peek', 6.3, BT.ice, -1, { mv: 1 }); K_(T.sleep, 'curl', 6.3, BT.ice, -1, { eyeOff: 1 }); K_(T.peek, 'curl_peek', 6.3, BT.ice, -1);
}
CK.sort((a, b) => a.t - b.t);
const keyAt = t => { let i = 0; while (i + 1 < CK.length && CK[i + 1].t <= t) i++; return i; };
const catCache = new Map();
function catTubes(i) {
  if (catCache.has(i)) return catCache.get(i);
  const k = CK[i], P = A.cat[k.pose], o = { flip: k.face < 0, z: k.z };
  const r = { outline: artTube(P.outline, CS, k.x, k.y, 'cat', { ...o, D: 0.017 }), eye: artTube(P.eye, CS, k.x, k.y, 'cat.eye', { ...o, D: 0.012, ties: false }),
    tail: P.tail ? artTube(P.tail, CS, k.x, k.y, 'cat', { ...o, D: 0.015 }) : null, whisk: P.whisk.map(w => artTube(w, CS, k.x, k.y, 'cat', { ...o, D: 0.009, ties: false })),
    anchor: [k.x + P.anchor[0] * CS * k.face, k.y + P.anchor[1] * CS], headA: P.headA };
  catCache.set(i, r); return r;
}
// when the running cat passes x (for the chorus chase wave)
const PASS = CK.filter(k => k.t >= T.street && k.t < T.climb && k.y < 0.5);
function catPassTime(x) { for (const k of PASS) if (k.x <= x) return k.t; return null; }
function catX(t) { const k = CK[keyAt(t)]; return k.x; }

// ================================================================== the goldfish
const FK = [];
const F_ = (t, where, pose, x, y, face, o = {}) => FK.push({ t, where, pose, x, y, face, rot: o.rot ?? 0 });
{
  const path = [[0, 22.6, 3.78, 1], [4.5, 22.68, 3.82, 1], [5.0, 22.76, 3.8, 1], [5.5, 22.82, 3.76, 1], [6.0, 22.8, 3.74, -1], [6.5, 22.72, 3.76, -1],
    [8.0, 22.62, 3.8, -1], [10.0, 22.6, 3.78, 1], [12.0, 22.78, 3.74, 1], [14.0, 22.85, 3.78, -1], [15.5, 22.75, 3.8, -1], [16.0, 22.7, 3.78, -1]];
  for (let t = 0; t < 16.5; t += 0.5) {
    let j = 0; while (j + 1 < path.length && path[j + 1][0] <= t) j++;
    const a = path[j], b = path[Math.min(j + 1, path.length - 1)], u = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0;
    F_(t, 'bowl', (Math.round(t / 0.5) % 2) ? 'swim_b' : 'swim_a', lerp(a[1], b[1], u), lerp(a[2], b[2], u), a[3]);
  }
  F_(16.6, 'bowl', 'dart', 22.46, 3.72, -1); F_(17.0, 'bowl', 'swim_b', 22.48, 3.7, -1);
  F_(17.6, 'bowl', 'dart_b', 22.95, 3.72, 1); F_(18.0, 'bowl', 'swim_a', 22.92, 3.7, 1);
  F_(T.crack, 'bowl', 'dart', 22.55, 3.66, -1); F_(19.0, 'bowl', 'swim_a', 22.6, 3.62, -1); F_(19.5, 'bowl', 'swim_b', 22.7, 3.6, 1);
  F_(20.0, 'bowl', 'rest', 22.72, 3.6, 1);
  [['flop_a', 20.5], ['flop_b', 21.0], ['flop_a', 21.5], ['flop_b', 22.0], ['rest', 22.5], ['flop_a', 23.0], ['rest', 23.5]].forEach(([p, t], i) => F_(t, 'bowl', p, 22.72 + (i % 2) * 0.02, 3.6, 1));
  F_(T.grab, 'mouth', 'carry', 0, 0, -1);
  F_(T.release, 'cup', 'sink', 5.5, 4.46, -1, { rot: 0.4 }); F_(33.375, 'cup', 'sink', 5.49, 4.36, -1, { rot: 0.6 }); F_(33.5, 'cup', 'sink', 5.48, 4.28, -1, { rot: 0.5 });
  F_(33.75, 'cup', 'rest', 5.48, 4.24, -1);
  const loop = [[5.42, 4.3, -1], [5.33, 4.33, -1], [5.37, 4.36, 1], [5.52, 4.34, 1], [5.63, 4.3, 1], [5.6, 4.28, -1], [5.5, 4.3, -1]];
  for (let t = 34.5, i = 0; t < DUR; t += 0.5, i++) {
    if (t >= T.peek && t < T.peek + 1.0) continue;
    const [x, y, f] = loop[i % loop.length]; F_(t, 'cup', (i % 2) ? 'swim_b' : 'swim_a', x, y, f);
  }
  F_(T.peek, 'cup', 'dart', 5.36, 4.36, -1); F_(T.peek + 0.5, 'cup', 'rest', 5.35, 4.37, -1);
}
FK.sort((a, b) => a.t - b.t);
const fkAt = t => { let i = 0; while (i + 1 < FK.length && FK[i + 1].t <= t) i++; return FK[i]; };
const DIM = [0.8, 0.6, 0.45, 0.33, 0.24, 0.17, 0.13];
function fishState(t) {
  let p = 1, col = [1.0, 0.16, 0.02];
  if (t < 4.0) p = 0; else if (t < 4.5) p = strike(t, 4.0, 5);
  if (t >= 20.5 && t < T.release) {          // a little darker every beat, then pale and flickering in the cat's mouth
    const k = Math.min(DIM.length - 1, Math.floor((t - 20.5) / BEAT));
    p = (t < T.grab ? DIM[k] : 0.22) * (hsh(Math.floor(t * 20) * 1.3) > 0.2 ? 1 : 0.45);
    col = mixc(col, [0.62, 0.1, 0.07], seg(t, 20.5, 24.0));
  }
  if (t >= T.release) p = t < 33.375 ? 0.3 : 0;
  if (t >= T.revive) p = strike(t, T.revive, 11);
  return { p, col };
}

// ================================================================== cameras: [t, lx, ly, ln K, eye height]
const L = Math.log;
const EYE0 = [6.9 + 0.2 * CS, BT.ice + 0.078 * CS];
// match cut: the round eye lands where the round bowl was (same screen point, same radius); eye height = subject height so the 5 cm stand-off adds no parallax
const MATCH = (() => {
  const eye = [7.3 + 0.13 * CS, BT.ice + 0.43 * CS], K = 0.3 * 0.5 * 420 / (0.021 * CS), Kz = F / (F / K - 0.05);
  const bowlSx = 960 + (BOWL[0] - 23.35) * 420, bowlSy = 540 - (BOWL[1] - 3.9) * 420;
  return { K, lx: eye[0] - (bowlSx - 960) / Kz, ly: eye[1] + (bowlSy - 540) / K, E: eye[1] };
})();
const SHOTS = [
  { t0: 0, t1: T.match, keys: [[0, EYE0[0] - 0.01, EYE0[1] - 0.01, L(3600), EYE0[1]], [0.45, EYE0[0] - 0.01, EYE0[1] - 0.01, L(3300), EYE0[1]], [1.1, 7.15, 4.5, L(1300), 4.5],
    [2.4, 7.05, 4.2, L(420), 4.4], [3.3, 7.12, 4.28, L(395), 4.4], [T.whip0, 7.2, 4.28, L(385), 4.4], [T.whip1, 23.6, 3.86, L(330), 4.4], [T.match, 23.35, 3.9, L(420), 4.4]] },
  { t0: T.match, t1: T.leap, keys: [[T.match, MATCH.lx, MATCH.ly, L(MATCH.K), MATCH.E], [7.25, MATCH.lx, MATCH.ly, L(MATCH.K * 0.9), MATCH.E],
    [7.5, 7.55, 4.78, L(620), 4.6], [T.leap, 7.75, 4.75, L(560), 4.6]] },
  { t0: T.leap, t1: T.shop, keys: [[T.leap, 8.1, 4.45, L(340), 4.0], [8.5, 8.95, 4.25, L(340), 4.0], [9.75, 9.5, 4.25, L(330), 4.0], [10.5, 11.0, 4.75, L(300), 4.0],
    [11.0, 11.6, 3.75, L(300), 3.6], [11.9, 12.5, 3.4, L(300), 3.6], [12.5, 14.3, 4.05, L(300), 4.0], [13.9, 17.6, 4.5, L(300), 4.0], [14.5, 18.9, 4.75, L(290), 4.0],
    [15.0, 21.2, 4.85, L(300), 4.0], [15.25, 22.6, 4.5, L(330), 4.0], [T.shop, 23.0, 4.15, L(400), 4.0]] },
  { t0: T.shop, t1: T.street, keys: [[T.shop, 23.0, 4.1, L(400), 1.6], [16.0, 23.05, 3.98, L(430), 1.6], [T.flat, 23.05, 3.98, L(430), 1.6], [T.hush, 23.25, 4.22, L(610), 1.6], [T.dive, 23.2, 4.3, L(600), 1.6], [24.4, 22.85, 4.55, L(540), 1.6],
    [T.fall, 22.7, 4.45, L(520), 1.6], [25.5, 22.2, 2.3, L(420), 0.9], [T.street, 21.3, 0.42, L(330), 0.3]] },
  { t0: T.street, t1: T.wide, keys: [[T.street, 21.3, 0.42, L(330), 0.3], [27.25, 18.9, 0.42, L(330), 0.3], [T.wide, 14.9, 0.42, L(330), 0.3]] },
  { t0: T.wide, t1: T.low2, keys: [[T.wide, 12.4, 2.4, L(112), 1.0], [T.low2, 11.2, 2.4, L(114), 1.0]] },
  { t0: T.low2, t1: T.card, keys: [[T.low2, 9.6, 0.42, L(330), 0.3], [T.climb, 7.6, 0.42, L(330), 0.3], [32.25, 6.7, 2.4, L(330), 1.0], [T.cup, 6.25, 4.3, L(370), 1.6],
    [33.5, 6.05, 4.3, L(380), 1.6], [T.close, 6.0, 4.3, L(380), 1.6], [38.75, 10.2, 3.0, L(112), 1.6], [39.9, 10.0, 3.0, L(114), 1.6], [41.3, 5.8, 4.4, L(430), 1.6],
    [T.tilt, 5.75, 4.42, L(440), 1.6], [T.hold, 5.7, 20 / 280 - 4.3, L(280), 0.16], [T.card, 5.7, 20 / 280 - 4.3, L(280), 0.16]] },
  { t0: T.card, t1: DUR + 1, keys: [[T.card, 6.75, 3.02, L(255), 1.6], [DUR, 6.75, 3.02, L(255), 1.6]] },
].map(s => ({ ...s, f: track(s.keys) }));
function cam(t) {
  const si = SHOTS.findIndex(s => t >= s.t0 && t < s.t1), s = SHOTS[si < 0 ? SHOTS.length - 1 : si];
  let [lx, ly, lk, E] = s.f(t);
  if (si === 2 || si === 3) { lx += 0.01 * Math.sin(t * 1.3); ly += 0.008 * Math.sin(t * 1.7 + 1); }       // a hand-held breath on the long shots
  const K = Math.exp(lk) * S;
  return { mode: 0, shot: si, lx, ly, K, E, D: F / K };
}

// ================================================================== layers
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const TOP = 2 * H, CHT = H + TOP;         // layers reach two screen heights above the frame: a low camera mirrors signs far above it
const EW = W >> 1, EH = CHT >> 1;
const C = { prof: mkc(W, CHT), tcol: mkc(W, CHT), ovl: mkc(W, CHT), add: mkc(W, CHT), emit: mkc(EW, EH), rain: mkc(W, H) };
const X = Object.fromEntries(Object.entries(C).map(([k, c]) => [k, c.getContext('2d')]));
const rgb = (c, m = 1) => `rgb(${Math.round(clamp(c[0] * m) * 255)},${Math.round(clamp(c[1] * m) * 255)},${Math.round(clamp(c[2] * m) * 255)})`;
function tfStreet(c, z) {
  const d = c.D - z; if (d < 0.15) return null;
  const Kz = F / d;
  return { m: [Kz, 0, 0, -Kz, W / 2 - c.lx * Kz, TOP + H / 2 + c.K * (c.ly - c.E) + Kz * c.E], K: Kz };
}
function setT(ctx, tf) { const m = tf.m; ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); }
function wtext(ctx, str, x, y, size, font) { ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = font.replace('#', '100px'); ctx.fillText(str, 0, 0); ctx.restore(); }
function setE(tf) { const m = tf.m; X.emit.setTransform(m[0] / 2, m[1] / 2, m[2] / 2, m[3] / 2, m[4] / 2, m[5] / 2); }
function proj(tf, x, y) { const m = tf.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5] - TOP]; }   // -> screen px

// ---------------------------------------------------------------- tube drawing
const MAT = { clear: 0, coat: 85, paint: 170, metal: 255 };
function bands(ctx, path, D, K, mat, vmax = 1) {
  const N = clamp(Math.round(D * K / 2.2), 2, 28);
  for (let i = 0; i < N; i++) {
    const f = 1 - i / N, r = 1 - (i + 0.5) / N, h = Math.sqrt(Math.max(0, 1 - r * r)) * vmax;
    ctx.strokeStyle = `rgb(${Math.round((0.1 + 0.9 * h) * 255)},${mat},0)`;
    ctx.lineWidth = Math.max(D * f, (i ? 0.6 : 1.3) / K); ctx.stroke(path);
  }
}
function dome(ctx, x, y, R, K, mat) {
  const N = clamp(Math.round(R * 2 * K / 2.2), 2, 24);
  for (let i = 0; i < N; i++) {
    const f = 1 - i / N, r = 1 - (i + 0.5) / N, h = Math.sqrt(Math.max(0, 1 - r * r));
    ctx.fillStyle = `rgb(${Math.round((0.1 + 0.9 * h) * 255)},${mat},0)`;
    ctx.beginPath(); ctx.arc(x, y, Math.max(R * f, 0.7 / K), 0, 6.2832); ctx.fill();
  }
}
// pass 0: painted ranges (behind), pass 1: lit strokes, ties, electrode caps. st.fill lights the tube from its start; st.from from its end
function drawTube(Tb, tf, st, pass, opt = {}) {
  const K = tf.K, D = Tb.D, P = X.prof, Cc = X.tcol, E = X.emit;
  const p = st.p, col = st.col || Tb.col, lit0 = st.from ? Tb.len * (1 - st.fill) : 0, lit1 = st.from ? Tb.len : Tb.len * st.fill;
  setT(P, tf); setT(Cc, tf); setE(tf);
  P.lineCap = Cc.lineCap = E.lineCap = 'round'; P.lineJoin = Cc.lineJoin = E.lineJoin = 'round';
  for (const g of Tb.paths) {
    if (g.paint !== (pass === 0)) continue;
    const mat = g.paint ? MAT.paint : Tb.coat ? MAT.coat : MAT.clear;
    bands(P, g.path, D, K, mat);
    Cc.setLineDash([]); Cc.strokeStyle = '#000'; Cc.lineWidth = D + 1 / K; Cc.stroke(g.path);
    if (g.paint) continue;
    const a = Math.max(g.a, lit0), b = Math.min(g.b, lit1);
    if (b <= a || p < 0.003) continue;
    const dash = (a > g.a || b < g.b) ? [0, a - g.a, b - a, 1e4] : [];
    Cc.setLineDash(dash); Cc.strokeStyle = rgb(col, p); Cc.lineWidth = D + 0.5 / K; Cc.stroke(g.path);
    E.setLineDash(dash); E.globalAlpha = p;
    E.strokeStyle = rgb(col, 0.55); E.lineWidth = Math.max(D * 1.9, 2.4 / K); E.stroke(g.path);
    E.strokeStyle = rgb(col); E.lineWidth = Math.max(D * 0.8, 1.2 / K); E.stroke(g.path);
    E.globalAlpha = 1;
  }
  Cc.setLineDash([]); E.setLineDash([]);
  if (pass === 1) {
    if (Tb.ties && !opt.noTies) {
      P.strokeStyle = `rgb(150,255,0)`; P.lineWidth = Math.max(D * 0.11, 0.7 / K); P.lineCap = 'butt';
      P.beginPath();
      for (const [x, y, tx, ty] of Tb.tiesAt) { P.moveTo(x - ty * D * 0.62, y + tx * D * 0.62); P.lineTo(x + ty * D * 0.62, y - tx * D * 0.62); }
      P.stroke(); P.lineCap = 'round';
    }
    if (Tb.ends) [Tb.pts[0], Tb.pts[Tb.pts.length - 1]].forEach((q, i) => {
      if (!Tb.caps[i]) return;
      const cr = D * (D < 0.013 ? 0.62 : 0.78); dome(P, q[0], q[1], cr, K, MAT.paint);
      Cc.fillStyle = '#000'; Cc.beginPath(); Cc.arc(q[0], q[1], cr * 1.02, 0, 6.2832); Cc.fill();
    });
  }
}

// ---------------------------------------------------------------- the bowl, cracked: two halves, each going dark from the break toward its electrode
const BOWLT = ST.bowl;
const BROKEN = (() => {
  let bi = 0, bd = 1e9; BOWLT.pts.forEach(([x, y], i) => { const d = Math.hypot(x - CRACK[0], y - CRACK[1]); if (d < bd) { bd = d; bi = i; } });
  const sc = BOWLT.cum[bi], gap = 0.035;
  const left = sub(BOWLT.pts, BOWLT.cum, 0, sc - gap), right = sub(BOWLT.pts, BOWLT.cum, sc + gap, BOWLT.len).reverse();
  const mk = P => tubeFromStrokes([P], { col: GAS.white, coat: true, circ: 'gold.bowl', D: 0.017, fil: 0.004, z: 0.05, caps: [true, false] });
  return [mk(left), mk(right)];
})();
const SHARDS = [0, 1, 2, 3].map(i => ({ a: hsh(i * 3.1) * 6.28, v: [0.5 + hsh(i * 5.7) * 0.9, 0.4 + hsh(i * 2.3) * 0.8], len: 0.02 + hsh(i * 9.1) * 0.025, spin: (hsh(i * 4.4) - 0.5) * 18 }));
function bowlState(t) {
  if (t < T.crack) return null;
  let p = fl(t, 3, 0.3) * 0.9, col = mixc(GAS.white, GAS.leak, seg(t, T.crack + 0.1, T.crack + 0.5));
  const k = Math.floor((t - T.bowlDie) / 0.25), fill = t < T.bowlDie ? 1 : [0.7, 0.42, 0.18][k] ?? 0;
  if (fill <= 0) p = 0;
  return { p: p * hum(t, 9), col, fill };
}

// ---------------------------------------------------------------- street furniture
function rect(ctx, x0, y0, x1, y1) { ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
const CARD = [['夜宵', 2.0, 0.36, '900 # NotoSC'], ['MIDNIGHT SNACK', 1.71, 0.2, '700 # Barlow'], ['霓虹灯管  NEON TUBES', 1.44, 0.15, '700 # NotoSC'], ['LemoLab × Claude Opus 5.5', 1.16, 0.18, '700 # Barlow']];
const CARD_X = 5.25;
function drawFacade(c, t) {
  const tf = tfStreet(c, 0); if (!tf) return;
  const O = X.ovl, Ad = X.add; setT(O, tf); setT(Ad, tf); setE(tf);
  const vx0 = c.lx - W / 2 / tf.K - 1, vx1 = c.lx + W / 2 / tf.K + 1;
  const vis = (a, b) => b > vx0 && a < vx1;
  const closed = t >= T.offs.straw;
  for (const [x0, y0, x1, y1, kind, lc, grp] of FRONTS) {
    if (!vis(x0, x1)) continue;
    const shut = kind === 'shutter' || (closed && grp !== 'hotel');
    O.fillStyle = '#26262a'; rect(O, x0 - 0.06, y0 - 0.02, x1 + 0.06, y1 + 0.06);
    if (kind !== 'shutter') { O.fillStyle = '#3a3a3e'; rect(O, x0 - 0.1, 2.42, x1 + 0.1, 2.68); O.fillStyle = '#2a2a2e'; rect(O, x0 - 0.1, 2.42, x1 + 0.1, 2.45); }
    if (shut) {
      const top = kind === 'shutter' ? y1 : 2.42;
      O.fillStyle = '#5a5a5c'; rect(O, x0, 0, x1, top);
      for (let y = 0.04; y < top; y += 0.075) { O.fillStyle = 'rgba(20,20,22,0.55)'; rect(O, x0, y, x1, y + 0.012); O.fillStyle = 'rgba(160,160,165,0.25)'; rect(O, x0, y + 0.014, x1, y + 0.022); }
      O.fillStyle = '#3c3c3e'; rect(O, x0, 0, x1, 0.06);
      O.fillStyle = 'rgba(40,30,25,0.35)'; for (let k = 0; k < 6; k++) { const xx = x0 + (x1 - x0) * hsh(k + x0); if (grp === 'ice' && xx > CARD_X - 0.1 && xx < 8.2) continue; rect(O, xx, 0, xx + 0.03, 0.4 + hsh(k * 3 + x0) * 1.2); }
      continue;
    }
    O.fillStyle = '#050608'; rect(O, x0, y0, x1, y1);
    O.fillStyle = '#2c2c30';
    if (kind === 'win') { const n = Math.max(1, Math.round((x1 - x0) / 1.3)); for (let k = 1; k < n; k++) { const xx = x0 + (x1 - x0) * k / n; rect(O, xx - 0.03, y0, xx + 0.03, y1); } rect(O, x0, y0 + (y1 - y0) * 0.78, x1, y0 + (y1 - y0) * 0.78 + 0.04); }
    else { rect(O, x0 + 0.04, 1.0, x1 - 0.04, 1.06); }
    if (lc && lc[0] + lc[1] + lc[2] > 0) {
      const on = 0.55 * (1 - seg(t, T.offs.shi - 0.1, T.offs.shi)) * (grp === 'gold' ? 1 - 0.7 * seg(t, T.goldOff, T.goldOff + 0.3) : 1);
      if (on > 0) {
        const gr = Ad.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, rgb(lc, 0.42 * on)); gr.addColorStop(0.25, rgb(lc, 0.2 * on)); gr.addColorStop(0.7, rgb(lc, 0.1 * on)); gr.addColorStop(1, rgb(lc, 0.05 * on));
        Ad.fillStyle = gr; rect(Ad, x0 + 0.02, y0 + 0.02, x1 - 0.02, y1 - 0.02);
        for (let xx = x0 + 0.35; xx < x1 - 0.2; xx += 0.9) { const lg = Ad.createRadialGradient(xx, y1 - 0.12, 0, xx, y1 - 0.12, 0.5); lg.addColorStop(0, rgb(lc, 1.6 * on)); lg.addColorStop(0.15, rgb(lc, 0.5 * on)); lg.addColorStop(1, rgb(lc, 0)); Ad.fillStyle = lg; rect(Ad, xx - 0.5, y1 - 0.62, xx + 0.5, y1 - 0.02); }
        Ad.fillStyle = '#000';
        if (grp === 'pharm' && kind === 'win') { for (let y = 0.7; y < 2.2; y += 0.42) rect(Ad, x0 + 0.05, y, x1 - 0.05, y + 0.04); }
        if (grp === 'ice' && kind === 'win') { rect(Ad, x0, 0.35, x1, 1.0); for (const cx of [5.6, 6.6, 7.6]) rect(Ad, cx - 0.04, 1.0, cx + 0.04, 1.25); }
        if (grp === 'gold' && kind === 'win') {          // a wall of lit aquarium tanks inside the goldfish shop
          for (const [ax, ay] of [[21.6, 0.6], [22.6, 0.6], [23.6, 0.6], [21.6, 1.35], [22.6, 1.35], [23.6, 1.35]]) {
            Ad.fillStyle = rgb([0.1, 0.35, 0.4], on * 1.4); rect(Ad, ax, ay, ax + 0.8, ay + 0.55); Ad.fillStyle = '#000'; rect(Ad, ax - 0.04, ay - 0.06, ax + 0.84, ay); rect(Ad, ax - 0.04, ay + 0.55, ax + 0.84, ay + 0.59);
          }
        }
        setE(tf); X.emit.globalCompositeOperation = 'lighter'; X.emit.fillStyle = rgb(lc, 0.25 * on); rect(X.emit, x0, y0, x1, y1);
      }
    }
    O.fillStyle = 'rgba(120,130,150,0.06)'; O.beginPath(); O.moveTo(x0 + 0.2, y0); O.lineTo(x0 + 0.6, y0); O.lineTo(x0 + 1.1, y1); O.lineTo(x0 + 0.7, y1); O.fill();
  }
  for (const [x0, y0, x1, y1, lit, i] of UPPER) {
    if (!vis(x0, x1)) continue;
    O.fillStyle = '#323034'; rect(O, x0 - 0.08, y0 - 0.1, x1 + 0.08, y1 + 0.06);
    O.fillStyle = '#07080b'; rect(O, x0, y0, x1, y1);
    O.fillStyle = '#2a2a2e'; rect(O, (x0 + x1) / 2 - 0.025, y0, (x0 + x1) / 2 + 0.025, y1); rect(O, x0, y0 + 0.62, x1, y0 + 0.66);
    O.fillStyle = 'rgba(40,40,45,0.9)'; rect(O, x0 - 0.1, y0 - 0.25, x1 + 0.1, y0 - 0.22);
    const onT = 9.7 + hsh(i * 5.1) * 0.6, offT = 38.2 + hsh(i * 3.3) * 2.2;
    if (lit && t >= onT && t < offT && t < T.card) {
      const gr = Ad.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgb(lit, 0.18)); gr.addColorStop(1, rgb(lit, 0.32));
      Ad.fillStyle = gr; rect(Ad, x0 + 0.03, y0 + 0.03, x1 - 0.03, y1 - 0.03);
      Ad.fillStyle = '#000'; rect(Ad, x0 + 0.03, y0 + 0.03, x0 + 0.03 + (x1 - x0) * 0.28, y1 - 0.03);
      X.emit.fillStyle = rgb(lit, 0.18); rect(X.emit, x0, y0, x1, y1);
    }
  }
  for (const [x, y] of AC) {
    if (!vis(x - 1, x + 1)) continue;
    O.fillStyle = '#8a8a86'; rect(O, x - 0.4, y - 0.28, x + 0.4, y + 0.28);
    O.fillStyle = '#5a5a58'; O.beginPath(); O.arc(x + 0.12, y, 0.2, 0, 6.3); O.fill();
    O.strokeStyle = '#3a3a38'; O.lineWidth = 0.012; for (let k = -3; k <= 3; k++) { O.beginPath(); O.moveTo(x + 0.12 + k * 0.05, y - 0.2); O.lineTo(x + 0.12 + k * 0.05, y + 0.2); O.stroke(); }
    O.fillStyle = '#4a4a48'; rect(O, x - 0.44, y - 0.36, x - 0.4, y - 0.28); rect(O, x + 0.4, y - 0.36, x + 0.44, y - 0.28);
  }
  O.fillStyle = '#3a3836';
  for (const x of [-0.42, 4.47, 10.32, 13.78, 19.52, 20.98]) { if (vis(x, x)) { rect(O, x - 0.05, 0, x + 0.05, 8.2); O.fillStyle = '#2a2826'; for (let y = 0.6; y < 8; y += 1.2) rect(O, x - 0.07, y, x + 0.07, y + 0.05); O.fillStyle = '#3a3836'; } }
  for (const sg of ST.signs) {
    for (const b of [sg.backer, sg.backer2]) {
      if (!b || b.hang || !vis(b.x0, b.x1)) continue;
      O.fillStyle = b.trim; rect(O, b.x0 - 0.035, b.y0 - 0.035, b.x1 + 0.035, b.y1 + 0.035);
      O.fillStyle = b.col; rect(O, b.x0, b.y0, b.x1, b.y1);
      O.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 5; k++) { const xx = b.x0 + (b.x1 - b.x0) * hsh(k * 2.1 + b.x0); rect(O, xx, b.y0, xx + 0.012, b.y0 + (b.y1 - b.y0) * (0.3 + 0.5 * hsh(k + b.y0))); }
      O.fillStyle = 'rgba(200,200,200,0.35)'; for (const [rx, ry] of [[b.x0 + 0.05, b.y0 + 0.05], [b.x1 - 0.05, b.y0 + 0.05], [b.x0 + 0.05, b.y1 - 0.05], [b.x1 - 0.05, b.y1 - 0.05]]) { O.beginPath(); O.arc(rx, ry, 0.012, 0, 6.3); O.fill(); }
    }
    if (sg.xf && vis(sg.xf[0] - 0.3, sg.xf[0] + 0.3)) {
      const [x, y] = sg.xf; O.fillStyle = '#4c4e50'; rect(O, x - 0.13, y - 0.2, x + 0.13, y + 0.2); O.fillStyle = '#2c2e30'; rect(O, x - 0.13, y + 0.16, x + 0.13, y + 0.2);
      O.strokeStyle = '#121212'; O.lineWidth = 0.02; O.beginPath(); O.moveTo(x, y + 0.2); O.lineTo(x, y + 0.45); O.stroke();
    }
    if (sg.clock && vis(sg.clock[0] - 0.5, sg.clock[0] + 0.5)) drawClock(O, sg.clock, t);
  }
  if (t >= T.card) {              // stencilled title on the café shutter, lit by the goblet above (end card)
    O.fillStyle = 'rgba(236,232,222,0.94)'; O.textBaseline = 'alphabetic';
    for (const [str, y, sz, f] of CARD) wtext(O, str, CARD_X, y, sz, f);
  }
}
const clockHM = t => {      // minutes after midnight on the neon clock: 18:05; one swat spins it to 23:40; it creeps on and rolls to 2:00 at closing
  if (t < T.swat) return 18 * 60 + 5;
  if (t < T.spin1) return lerp(18 * 60 + 5, 23 * 60 + 40, eio(seg(t, T.swat + 0.05, T.spin1)));
  if (t < T.close) return lerp(23 * 60 + 40, 25 * 60 + 52, seg(t, T.spin1, T.close));
  return lerp(25 * 60 + 52, 26 * 60, eio(seg(t, T.close, T.close + 0.6)));
};
function drawClock(O, [x, y, r], t) {
  O.fillStyle = '#d8d2c2'; O.beginPath(); O.arc(x, y, r, 0, 6.2832); O.fill();
  O.fillStyle = '#b8b2a2'; O.beginPath(); O.arc(x, y, r * 0.96, 0, 6.2832); O.fill();
  O.fillStyle = '#d6d0c0'; O.beginPath(); O.arc(x, y, r * 0.93, 0, 6.2832); O.fill();
  O.strokeStyle = '#1a1a1a';
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; O.lineWidth = k % 3 ? 0.012 : 0.026; O.beginPath(); O.moveTo(x + Math.sin(a) * r * 0.78, y + Math.cos(a) * r * 0.78); O.lineTo(x + Math.sin(a) * r * 0.9, y + Math.cos(a) * r * 0.9); O.stroke(); }
  const m = clockHM(t), ah = (m / 60 % 12) / 12 * 2 * Math.PI, am = (m % 60) / 60 * 2 * Math.PI;
  O.lineCap = 'round'; O.strokeStyle = '#141414';
  O.lineWidth = 0.032; O.beginPath(); O.moveTo(x, y); O.lineTo(x + Math.sin(ah) * r * 0.5, y + Math.cos(ah) * r * 0.5); O.stroke();
  O.lineWidth = 0.02; O.beginPath(); O.moveTo(x, y); O.lineTo(x + Math.sin(am) * r * 0.78, y + Math.cos(am) * r * 0.78); O.stroke();
  O.fillStyle = '#141414'; O.beginPath(); O.arc(x, y, 0.025, 0, 6.3); O.fill(); O.lineCap = 'butt';
}
function drawOccluder(c, z, fn) {
  const tf = tfStreet(c, z); if (!tf) return null;
  setT(X.prof, tf); setT(X.tcol, tf); setE(tf);
  fn(tf);
  return tf;
}
function hangingBox(c) {
  const b = SIGN.hotel.backer, z = SIGN.hotel.z;
  drawOccluder(c, z, () => {
    X.prof.fillStyle = `rgb(${Math.round(0.32 * 255)},${MAT.paint},0)`; rect(X.prof, b.x0, b.y0, b.x1, b.y1);
    X.prof.strokeStyle = `rgb(${Math.round(0.6 * 255)},${MAT.metal},0)`; X.prof.lineWidth = 0.03; X.prof.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    X.prof.lineWidth = 0.02; X.prof.beginPath(); X.prof.moveTo(b.x0 + 0.12, b.y1); X.prof.lineTo(b.x0 + 0.12, 5.9); X.prof.moveTo(b.x1 - 0.12, b.y1); X.prof.lineTo(b.x1 - 0.12, 5.9); X.prof.stroke();
    X.tcol.fillStyle = '#000'; rect(X.tcol, b.x0 - 0.02, b.y0 - 0.02, b.x1 + 0.02, b.y1 + 0.02);
    X.emit.globalCompositeOperation = 'destination-out'; X.emit.fillStyle = 'rgba(0,0,0,0.92)'; rect(X.emit, b.x0, b.y0, b.x1, b.y1); X.emit.globalCompositeOperation = 'lighter';
  });
}
function cables(c) {
  for (const [z, ys] of [[4.6, [6.55, 6.85]], [7.5, [7.4]]]) {
    drawOccluder(c, z, tf => {
      const x0 = c.lx - W / 2 / tf.K - 1, x1 = c.lx + W / 2 / tf.K + 1;
      for (const y of ys) {
        X.prof.strokeStyle = `rgb(${Math.round(0.55 * 255)},${MAT.paint},0)`; X.prof.lineWidth = Math.max(0.014, 1.2 / tf.K);
        X.prof.beginPath();
        for (let x = Math.floor(x0); x <= x1; x += 0.25) { const u = ((x % 9) + 9) % 9 / 9; const yy = y - 0.35 * 4 * u * (1 - u); x === Math.floor(x0) ? X.prof.moveTo(x, yy) : X.prof.lineTo(x, yy); }
        X.prof.stroke();
      }
    });
  }
}
// a white-blue spark with a few streaks (electrode at the first frame; the crack)
function spark(c, [ex, ey], age, life, R = 0.02, n = 14) {
  const tf = tfStreet(c, 0.05); if (!tf || age < 0 || age > life) return;
  const a = 1 - age / life;
  setT(X.add, tf); X.add.globalCompositeOperation = 'lighter';
  const g = X.add.createRadialGradient(ex, ey, 0, ex, ey, R); g.addColorStop(0, `rgba(235,245,255,${a})`); g.addColorStop(0.4, `rgba(170,190,255,${0.5 * a})`); g.addColorStop(1, 'rgba(100,120,255,0)');
  X.add.fillStyle = g; X.add.beginPath(); X.add.arc(ex, ey, R, 0, 6.3); X.add.fill();
  X.add.strokeStyle = `rgba(255,240,210,${a})`; X.add.lineWidth = Math.max(0.0012, 1 / tf.K); X.add.lineCap = 'round';
  for (let i = 0; i < n; i++) { const an = hsh(i * 3.1 + ex) * 6.28, v = (0.3 + hsh(i * 7.7) * 0.5) * R / 0.02, dt = age + 0.02, x = ex + Math.cos(an) * v * dt, y = ey + Math.sin(an) * v * dt - 4.9 * dt * dt; X.add.beginPath(); X.add.moveTo(x, y); X.add.lineTo(x - Math.cos(an) * 0.4 * R, y - Math.sin(an) * 0.4 * R); X.add.stroke(); }
  setE(tf); X.emit.fillStyle = `rgba(200,220,255,${a})`; X.emit.beginPath(); X.emit.arc(ex, ey, R * 0.6, 0, 6.3); X.emit.fill();
  X.add.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- rain
const NR = 2400;
const RAIN = Array.from({ length: NR }, (_, i) => [lerp(-6, 30, hsh(i * 1.13)), lerp(0.05, 14, Math.pow(hsh(i * 2.71 + 5), 0.9)), hsh(i * 3.97 + 1) * 6, 6.5 + hsh(i * 5.3) * 2.0]);
const rainAmt = t => t < T.rain0 ? 0 : t < T.rainStop ? seg(t, T.rain0, T.rain0 + 1.4) : t < T.card ? 1 - 0.92 * seg(t, T.rainStop, T.rainStop + 1.2) : 0;
function drawRain(c, t) {
  const R = X.rain; R.setTransform(1, 0, 0, 1, 0, 0); R.clearRect(0, 0, W, H);
  const amt = rainAmt(t); if (amt <= 0) return;
  const c0 = H / 2 + c.K * (c.ly - c.E);
  R.lineCap = 'round';
  const buckets = [[], [], []], n = Math.floor(NR * amt);
  for (let i = 0; i < n; i++) {
    const [x, z, y0, v] = RAIN[i];
    const dist = c.D - z; if (dist < 0.15) continue;
    const y = 5.8 - ((y0 + v * t) % 6);
    if (y < -0.05) continue;
    const kd = F / dist;
    const sx = W / 2 + (x - c.lx) * kd; if (sx < -20 || sx > W + 20) continue;
    const sy = c0 - (y - c.E) * kd, len = v * 0.018 * kd;
    if (sy < -len || sy - len > H) continue;
    const wpx = 0.0025 * kd, b = wpx < 1.6 ? 0 : wpx < 5 ? 1 : 2;
    buckets[b].push(sx, sy - len, sx, sy);
  }
  const al = [0.42, 0.22, 0.1];
  buckets.forEach((B, bi) => {
    if (!B.length) return;
    R.strokeStyle = `rgba(255,255,255,${al[bi]})`; R.lineWidth = bi === 0 ? Math.max(S, 0.6) : bi === 1 ? 3 * S + 1 : 7 * S + 2;
    R.beginPath(); for (let i = 0; i < B.length; i += 4) { R.moveTo(B[i], B[i + 1]); R.lineTo(B[i + 2], B[i + 3]); } R.stroke();
  });
}

// ================================================================== frame
const cvs = document.getElementById('c'); cvs.width = W; cvs.height = H;
const gl = makeGL(cvs, W, H, TOP);
const bldU = new Float32Array(32), bldC = new Float32Array(24);
BUILDINGS.forEach(([b, c], i) => { bldU.set(b, i * 4); bldC.set(c, i * 3); });
function streetLights(t) { const pw = new Map(); for (const tb of ST.all) if (!pw.has(tb.circ)) pw.set(tb.circ, circuit(tb.circ, t)); return pw; }
function clearLayers() {
  for (const k of ['prof', 'tcol', 'add']) { const x = X[k]; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, W, CHT); }
  X.ovl.setTransform(1, 0, 0, 1, 0, 0); X.ovl.clearRect(0, 0, W, CHT);
  X.emit.setTransform(1, 0, 0, 1, 0, 0); X.emit.globalCompositeOperation = 'source-over'; X.emit.fillStyle = '#000'; X.emit.fillRect(0, 0, EW, EH); X.emit.globalCompositeOperation = 'lighter';
}
const fishCache = new Map();
function fishTubes(pose, x, y, face, rot, s) {
  const key = [pose, x.toFixed(3), y.toFixed(3), face, rot.toFixed(2), s].join('|');
  if (fishCache.has(key)) return fishCache.get(key);
  const P = A.fish[pose], co = Math.cos(rot), si = Math.sin(rot);
  const tr = tb => ({ ...tb, p: tb.p.map(([u, v]) => [u * co - v * si, u * si + v * co]) });
  const o = { flip: face < 0, ties: false };
  const r = [artTube(tr(P.outline), s, x, y, 'fish', { ...o, D: 0.019, ties: true }), artTube(tr(P.eye), s, x, y, 'fish', { ...o, D: 0.012 }), artTube(tr(P.gill), s, x, y, 'fish', { ...o, D: 0.012 })];
  if (fishCache.size > 400) fishCache.clear();
  fishCache.set(key, r); return r;
}
function drawFish(c, t) {
  const f = fkAt(t), st = fishState(t);
  let x = f.x, y = f.y, face = f.face, rot = f.rot, s = FS[f.where] ?? FS.bowl, z = 0.05;
  if (f.where === 'mouth') {
    const ki = keyAt(t), k = CK[ki], ct = catTubes(ki); if (!k.fish) return;
    x = ct.anchor[0] + 0.012 * k.face; y = ct.anchor[1] - 0.075; face = k.face; z = k.z; rot = 0.25 * Math.sin(ct.headA);
  }
  const tf = tfStreet(c, z); if (!tf) return;
  for (const pass of [0, 1]) for (const tb of fishTubes(f.pose, x, y, face, rot, s)) drawTube(tb, tf, { p: st.p * hum(t, 4.4), fill: 1, col: st.col }, pass);
}
function drawCat(c, t) {
  const ki = keyAt(t), k = CK[ki], ct = catTubes(ki);
  const tf = tfStreet(c, k.z); if (!tf) return;
  const h = hum(t, 5.1);
  // afterglow on jumps only: the previous frame's outline, faint, for two frames (runs have none, so one cat never reads as two)
  if (k.mv && ki > 0 && t - k.t < 0.067 && /^(leap|drop|climb|pounce)/.test(CK[ki - 1].pose)) {
    const pk = CK[ki - 1], pt = catTubes(ki - 1), ptf = tfStreet(c, pk.z);
    if (ptf) for (const pass of [0, 1]) drawTube(pt.outline, ptf, { p: 0.08 * (1 - (t - k.t) / 0.067), fill: 1 }, pass, { noTies: true });
  }
  // the wake: before the eye strikes the cat is cold milky glass; light then runs nose to tail through the outline
  const wake = t < T.home;
  const pOut = wake ? (t < T.fill0 ? 0 : 1) : 1;
  const fillOut = wake ? (t < T.fill0 ? 1 : ss(seg(t, T.fill0, T.fill1))) : 1;
  const pEye = k.eyeOff ? 0 : t < 1.0 ? strike(t, T.eye, 2) : (t >= T.peek && t < T.peek + 0.3) ? strike(t, T.peek, 6) : 1;
  const pRest = wake ? (t < T.fill1 - 0.05 ? 0 : strike(t, T.fill1 - 0.05, 3)) : 1;
  for (const pass of [0, 1]) {
    drawTube(ct.outline, tf, { p: pOut * h, fill: fillOut }, pass);
    if (ct.tail) drawTube(ct.tail, tf, { p: pRest * h, fill: 1 }, pass);
    for (const w of ct.whisk) drawTube(w, tf, { p: pRest * h, fill: 1 }, pass, { noTies: true });
    drawTube(ct.eye, tf, { p: pEye * h, fill: 1 }, pass, { noTies: true });
  }
}
function drawStreet(c, t) {
  drawFacade(c, t);
  X.emit.globalCompositeOperation = 'lighter';
  const pw = streetLights(t), bs = bowlState(t);
  const groups = [ST.all.filter(x => x.z < 1), ST.all.filter(x => x.z >= 1)];
  for (const [gi, list] of groups.entries()) {
    if (gi === 1) { drawFish(c, t); hangingBox(c); }
    const tf = tfStreet(c, list[0]?.z ?? 0.05); if (!tf) continue;
    const vx0 = c.lx - W / 2 / tf.K - 0.5, vx1 = c.lx + W / 2 / tf.K + 0.5;
    const vy0 = c.ly - 1.5 * H / tf.K - 1, vy1 = c.ly + (TOP + H) / tf.K + 1;
    const inView = tb => tb.bb[2] > vx0 && tb.bb[0] < vx1 && tb.bb[3] > vy0 && tb.bb[1] < vy1;
    for (const pass of [0, 1]) for (const tb of list) {
      if (!inView(tb)) continue;
      if (tb === BOWLT && bs) { for (const half of BROKEN) drawTube(half, tf, { p: bs.p, fill: bs.fill, col: bs.col }, pass); continue; }
      if (tb.circ === 'gold.bowl' && bs) { drawTube(tb, tf, { p: bs.p, fill: bs.fill > 0.3 ? 1 : 0, col: bs.col }, pass); continue; }
      drawTube(tb, tf, pw.get(tb.circ), pass);
    }
  }
  drawCat(c, t);
  // the crack: a white flash at the paw, the tube broken open, glass chips falling
  spark(c, EL, t, 0.22, 0.02);
  spark(c, CRACK, t - T.crack, 0.32, 0.05, 18);
  if (t >= T.crack && t < T.crack + 0.9) {
    const tf = tfStreet(c, 0.05);
    if (tf) for (const s of SHARDS) {
      const a = t - T.crack, x = CRACK[0] + s.v[0] * a * 0.35, y = CRACK[1] + s.v[1] * a * 0.35 - 4.9 * a * a, an = s.a + s.spin * a;
      const tb = tubeFromStrokes([[[x - Math.cos(an) * s.len, y - Math.sin(an) * s.len], [x + Math.cos(an) * s.len, y + Math.sin(an) * s.len]]], { D: 0.012, z: 0.05, ties: false, ends: false, col: GAS.white, coat: false });
      for (const pass of [0, 1]) drawTube(tb, tf, { p: 0, fill: 1 }, pass);
    }
  }
  // the splash where the fish goes into the goblet: a crown of small white tubes, two frames
  if (t >= T.release && t < T.release + 0.24) {
    const tf = tfStreet(c, 0.05), fr = t < T.release + 0.12 ? 0 : 1;
    if (tf) for (let i = 0; i < 7; i++) {
      const an = Math.PI * (0.12 + 0.76 * i / 6), r0 = 0.05 + fr * 0.05, r1 = 0.1 + fr * 0.08, cx = 5.5, cy = GOBLET[1] - 0.13;
      const tb = tubeFromStrokes([[[cx + Math.cos(an) * r0 * 1.4, cy + Math.sin(an) * r0], [cx + Math.cos(an) * r1 * 1.4, cy + Math.sin(an) * r1]]], { D: 0.011, z: 0.05, ties: false, ends: false, col: GAS.white, coat: true });
      for (const pass of [0, 1]) drawTube(tb, tf, { p: fr ? 0.6 : 1, fill: 1 }, pass);
    }
  }
  cables(c);
}
const EL = (() => { const P = A.cat.loaf_open.outline.p; const q = P[P.length - 1]; return [6.9 + q[0] * CS, BT.ice + q[1] * CS]; })();     // the electrode that fires first

// the floor point where the mirror image of (x, y) on the wall lands for camera c (to aim a drop at a reflection)
function mirrorFloor(c, x, y) {
  const sy = H / 2 + c.K * c.ly + c.K * y, c0 = H / 2 + c.K * (c.ly - c.E), tf = c.E / ((sy - c0) / F);
  const sx = W / 2 + (x - c.lx) * c.K;
  return [c.lx + (sx - W / 2) / F * tf, c.D - tf];
}
const BIGDROP = (() => { const k = CK[keyAt(T.bigDrop)]; return mirrorFloor(cam(T.bigDrop), k.x - 0.2, 0.35); })();
const LASTDROP = mirrorFloor(cam(T.hold + 0.5), GOBLET[0] + 0.05, GOBLET[1] - 0.2), PUD2 = mirrorFloor(cam(T.hold + 0.5), GOBLET[0], GOBLET[1] - 0.25);
function uniformsFor(c, t) {
  const u = { mode: 0, K: c.K, t, F, gain: 2.5, envC: [0.1, 0.11, 0.14], bld: bldU, bldC, exposure: 1, lift: [0, 0, 0], vig: 0.55, bloomGain: 1, lightGain: 1.35, tubeD: 0.015,
    drop: [0, 0, -9, 0], floorAmb: [0.008, 0.01, 0.016], pud1: [16.0, 0.9, 6.0, 0.8], pud2: [0, -99, 1, 1], wet: 0, rain: 0, calm: 0 };
  u.A = [1 / c.K, 0, 0, -1 / c.K]; u.B = [c.lx - W / 2 / c.K, c.ly + (TOP + H / 2) / c.K]; u.lx = c.lx; u.ly = c.ly; u.E = c.E;
  u.amb = t >= T.close ? [0.02, 0.022, 0.036] : [0.014, 0.016, 0.03];
  u.wet = t < T.rain0 ? 0.1 : lerp(0.1, 1, seg(t, T.rain0, 12.5));
  if (c.E < 0.6) u.wet += 0.38;                              // down at the water the whole street is one sheet of rain water
  u.rain = rainAmt(t);
  if (t >= T.close) u.rain = Math.max(u.rain, 0.1);
  u.drop = t >= T.close ? [LASTDROP[0], LASTDROP[1], T.lastDrip, 2.2] : [BIGDROP[0], BIGDROP[1], T.bigDrop, 1.1];
  if (t >= T.close) u.dropS = 0.07;
  if (t >= T.tilt) { u.pud2 = [PUD2[0], PUD2[1], 0.1, 0.1]; const f = seg(t, T.offs.straw, T.hold); u.lightGain = 1.6 + 1.6 * f; u.amb = [0.026, 0.028, 0.045]; u.floorAmb = [0.03, 0.032, 0.048]; u.wet = 0.6; u.bloomGain = 1 + 0.5 * f; }
  if (t >= T.card) { u.amb = [0.56, 0.38, 0.34]; u.vig = 0.6; u.lightGain = 2.0; u.wet = 1; u.rain = 0; }
  if (t >= T.crack && t < T.crack + 0.12) { u.exposure = 1.18; u.bloomGain = 1.6; }
  return u;
}
function motion(c, cp) {
  if (c.shot !== cp.shot) return { mT: [0, 0], mS: 0, mR: 0 };
  return { mT: [(c.lx - cp.lx) * cp.K, -(c.ly - cp.ly) * cp.K], mS: 1 - cp.K / c.K, mR: 0 };
}
function render(t) {
  t = clamp(t, 0, DUR);
  const c = cam(t), cp = cam(Math.max(0, t - 0.5 / 30));
  clearLayers();
  drawStreet(c, t);
  drawRain(c, t);
  const u = uniformsFor(c, t);
  Object.assign(u, motion(c, cp));
  gl.frame(C, u);
}
window.render = render;

// ================================================================== readable text (readcheck) and sound cues
function boxStreet(c, bb, z) {
  const tf = tfStreet(c, z); if (!tf) return null;
  const a = proj(tf, bb[0], bb[3]), b = proj(tf, bb[2], bb[1]);
  return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] };
}
window.TEXTS = t => {
  const c = cam(t), out = [];
  const push = (id, sg, which, z = 0.05) => { const b = boxStreet(c, sg[which].bb, z); if (b) out.push({ id, text: sg[which].text, ...b }); };
  if (t >= 4.4 && t < T.match) { push('gold.zh', SIGN.gold, 'zh'); push('gold.en', SIGN.gold, 'en'); }
  if (t >= T.cup && t < T.close) { push('ice.zh', SIGN.ice, 'zh'); push('ice.en', SIGN.ice, 'en'); }
  if (t >= T.card) {
    const tf = tfStreet(c, 0), ctx = X.ovl;
    CARD.forEach(([str, y, sz, f], i) => { ctx.font = f.replace('#', '100px'); const w = ctx.measureText(str).width * sz / 100; const a = proj(tf, CARD_X, y + sz * 0.85), b = proj(tf, CARD_X + w, y - sz * 0.15); out.push({ id: 'card' + i, text: str, x0: a[0], y0: a[1], x1: b[0], y1: b[1] }); });
  }
  return out;
};
function evList() {
  const ev = [];
  const panX = (t, x, z = 0.05) => { const c = cam(t), tf = tfStreet(c, z); return tf ? clamp((proj(tf, x, 0)[0] / W) * 2 - 1, -1, 1) : 0; };
  const seen = new Set();
  for (const tb of ST.all) {
    const o = ON[tb.circ]; if (!o || seen.has(tb.circ)) continue; seen.add(tb.circ);
    const cx = (tb.bb[0] + tb.bb[2]) / 2;
    ev.push({ t: o[0], type: 'strike', circ: tb.circ, gas: tb.gas, pan: panX(o[0], cx, tb.z) });
    if (o[2] < DUR) ev.push({ t: o[2], type: 'off', circ: tb.circ, pan: panX(o[2], cx, tb.z) });
  }
  ev.push({ t: T.eye, type: 'spark' }, { t: T.eye, type: 'strike', circ: 'cat.eye', gas: 'pink', pan: 0 }, { t: T.fill0, type: 'fill', dur: T.fill1 - T.fill0 }, { t: 4.0, type: 'strike', circ: 'fish', gas: 'neon', pan: 0.3 });
  ev.push({ t: 0.25, type: 'purr', dur: 3.2 }, { t: 35.5, type: 'purr', dur: 5.0 });
  CK.forEach((k, i) => {
    if (!k.mv || i === 0) return;
    const land = k.pose === 'land' || k.pose === 'recoil';
    ev.push({ t: k.t, type: land ? 'land' : 'step', pose: k.pose, wet: k.y < 0.5 && k.t > T.street, pan: panX(k.t, k.x, k.z) });
  });
  ev.push({ t: T.swat, type: 'swat', pan: panX(T.swat, 9.4) }, { t: T.swat + 0.05, type: 'spin', dur: T.spin1 - T.swat - 0.05 }, { t: T.rain0, type: 'rain' });
  ev.push({ t: T.crack, type: 'crack', pan: panX(T.crack, CRACK[0]) }, { t: T.crack + 0.1, type: 'leak', pan: panX(T.crack, CRACK[0]) });
  T.drain.forEach((d, i) => ev.push({ t: d, type: 'drain', i }));
  T.level.forEach(d => ev.push({ t: d, type: 'glug' }));
  FK.forEach(f => { if (f.pose.startsWith('flop')) ev.push({ t: f.t, type: 'flop', pan: panX(f.t, f.x) }); });
  ev.push({ t: T.bowlDie, type: 'die', dur: 0.75 }, { t: T.goldOff - 0.5, type: 'fizz', dur: 0.5 });
  ev.push({ t: T.hush, type: 'hush' }, { t: T.dive, type: 'dive' }, { t: T.grab, type: 'grab' }, { t: T.street, type: 'chorus' }, { t: T.bigDrop, type: 'drop' });
  ev.push({ t: T.release, type: 'splash' }, { t: T.revive, type: 'revive' }, { t: T.close, type: 'close' }, { t: T.sleep, type: 'sleep' }, { t: T.lastDrip, type: 'lastdrop' }, { t: T.card, type: 'card' }, { t: T.peek, type: 'peek' });
  return ev.sort((a, b) => a.t - b.t);
}
window.EV = evList();
window.T = T;
render(0);
window.READY = true;
