// Is faster better? 跑得快，就更好吗？ (52 s): window.render(t) draws the whole film by its own seconds.
// Every Pip's position, heading, beans eaten, energy, survival and children, and the head count and speeds of all 20 generations, come from one run of filmsim.js (seed 11, k = 0.7).
// Camera: S1 low close-up → S2 rise to overhead (the rules) → S3 hard cut to a low tracking shot of the fast one (slow motion, it runs dry) → focus pull to the slow one → S4 crane up, the first night is judged
//      → S5 20 generations from above (one diagonal wave across the board per morning) → S6 tilt down, the Pips walk into the histogram → hold.
import * as THREE from 'three';
import { makeStage, makeBoard, makeFloor, decal, W, H } from './stage.js';
import { Crowd, makeMats, geneColor } from './blob.js';
import { PALETTE } from './palette.js';
import { runFilmSim } from './filmsim.js';

export const DUR = 52;
export const GENS = 20;
// shot list
export const SHOTS = [
  { id: 'S1', t0: 0, t1: 4.6, name: 'Hook · close on one fast Pip, beans pop' },
  { id: 'S2', t0: 4.6, t1: 10, name: 'Rise to overhead · the rules' },
  { id: 'S3', t0: 10, t1: 19.4, name: 'Hard cut · tracking the sprinter, slow motion, focus to the slow one' },
  { id: 'S4', t0: 19.4, t1: 27, name: 'Crane up · day 1 judged' },
  { id: 'S5', t0: 27, t1: 37.5, name: 'Overhead, tilting and orbiting · 20 generations, one wave per morning; hard cut to a low close-up in generation 9' },
  { id: 'S6', t0: 37.5, t1: 50, name: 'Tilt down · Pips walk into the histogram, hold' },
];
// cue times (film seconds)
export const CUE = {
  title: .35, wake: .55, rise0: 4.6, rise1: 6.4, rules: 6.0, go: 10.0,
  pan0: 14.6, pan1: 15.7, crane0: 19.4, crane1: 21.8, verdict: 21.8, sweep: .9, settle: 23.3,
  top0: 27.0, top1: 28.3, gen0: 28.4, cu0: 32.0, cu1: 34.4, genB: 34.5, gen1: 37.3, hist0: 37.5, hist1: 39.9, walk0: 38.1, walk1: 43.4, endTitle: 44.8, still: 45.4, card0: 48.9, card1: 49.4,
};
// narration (English, Kokoro bm_george) and bilingual subtitles; t = start second, durations read from voice/dur.json
export const VO = [
  { id: 'v01', t: .4, en: '160 Pips. Each one is born with its own speed.', zh: '160 只小人，每只天生一个速度。' },
  { id: 'v02', t: 6.0, en: 'One bean keeps you alive. Two beans make a copy.', zh: '吃到一颗能活下来，吃到两颗多生一只。' },
  { id: 'v03', t: 10.65, en: 'The fast ones get there first.', zh: '跑得快的，先抢到豆子。' },
  { id: 'v04', t: 13.75, en: 'But speed burns energy, and they run dry.', zh: '可速度很耗体力，它们很快就跑不动了。' },
  { id: 'v05', t: 17.8, en: 'The slow ones just keep going.', zh: '慢的，一直在走。' },
  { id: 'v06', t: 22.0, en: 'By nightfall, the slow ones have left three times as many children.', zh: '天黑时，慢的留下的后代是快的三倍。' },
  { id: 'v07', t: 27.3, en: 'Now run it again. 20 generations.', zh: '再跑一次，跑 20 代。' },
  { id: 'v08', t: 31.4, en: 'Every morning, there is a little more blue on the board.', zh: '每天早上，台面上的蓝色都多一点。' },
  { id: 'v09', t: 38.0, en: 'The average speed falls from 1.25 to 0.73.', zh: '平均速度从 1.25 降到 0.73。' },
  { id: 'v10', t: 45.0, en: "Faster wasn't better. Under these rules, the slow ones win.", zh: '跑得快不一定更好。在这套规则下，慢的赢了。' },
];
// day 1: film time → simulation time keyframes (monotone cubic, continuous speed). The run starts in slow motion at 10.0 s, slowest (about 0.1×) as the fast one runs dry, then speeds up
const DAYKEYS = [[10.0, 0], [11.2, .38], [13.6, .62], [15.4, 1.3], [18.4, 2.65], [20.2, 4.05]];
const BOLT = 149, MOSS = 126;   // two Pips picked from the run: the fast 1.69 (first to eat, out of energy at 0.55 s) and the slow 0.72 (keeps going, eats two)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = u => u * u * (3 - 2 * u);
const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const eo = u => 1 - Math.pow(1 - u, 3);
const backOut = (u, k = 1.9) => 1 + (k + 1) * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const angLerp = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * u; };
const L = (a, b, u) => a + (b - a) * u;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// monotone cubic interpolation (Fritsch–Carlson)
function monotone(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 3 * (d[i - 1] + d[i]) / ((2 * d[i] + d[i - 1]) / d[i - 1] + (d[i] + 2 * d[i - 1]) / d[i] + 1e-9) / 3 * 3 / 3;
  for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] > 0) { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]); m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
  return x => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

export async function build(QS) {
  const durs = await (await fetch('voice/dur.json')).json();
  // ———————— 1. Simulation: the full day-1 trajectories + every generation's morning ————————
  const R = runFilmSim(GENS, {}, true), D = R.day1, P = D.P, dt = D.dt, NS = D.steps.length;
  const SC = .62, N = D.pop.length;
  const dayMap = monotone(DAYKEYS);
  const simT = t => t <= CUE.go ? 0 : Math.min(D.end, dayMap(t));
  const tFilm = st => { let lo = CUE.go, hi = DAYKEYS[DAYKEYS.length - 1][0]; if (st <= 0) return lo; if (st >= D.end) return hi; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (dayMap(mid) < st) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  const DAYEND = DAYKEYS[DAYKEYS.length - 1][0];
  const pips = D.pop.map((b, i) => {
    const x = new Float32Array(NS), z = new Float32Array(NS), dist = new Float32Array(NS), yaw = new Float32Array(NS), mov = new Float32Array(NS), ate = new Uint8Array(NS), en = new Float32Array(NS);
    for (let k = 0; k < NS; k++) { x[k] = D.steps[k][i * 5]; z[k] = D.steps[k][i * 5 + 1]; ate[k] = D.steps[k][i * 5 + 3]; en[k] = Math.max(0, D.steps[k][i * 5 + 4]); }
    const h0 = D.steps[0][i * 5 + 2];
    let y = Math.atan2(Math.cos(h0), Math.sin(h0)) + (hash(i + 40) - .5) * 1.2;
    const yaw0 = y; let m = 0;
    for (let k = 0; k < NS; k++) {
      const dx = k < NS - 1 ? x[k + 1] - x[k] : 0, dz = k < NS - 1 ? z[k + 1] - z[k] : 0, v = Math.hypot(dx, dz);
      if (k) dist[k] = dist[k - 1] + Math.hypot(x[k] - x[k - 1], z[k] - z[k - 1]);
      y = angLerp(y, v > 1e-5 ? Math.atan2(dx, dz) : y, k === 0 ? 1 : 1 - Math.exp(-dt / .07));
      yaw[k] = y;
      const mv = v > 1e-5 ? 1 : 0; m += (mv - m) * (1 - Math.exp(-dt / (mv > m ? .06 : .12))); mov[k] = m;
    }
    return { i, id: b.id, s: b.s, ate: b.ate, eats: b.eats, stopAt: b.stopAt, x, z, dist, yaw, yaw0, mov, ateK: ate, en, stride: .2 + .1 * b.s, color: geneColor(b.s), size: SC * (.96 + hash(b.id + 9) * .08), tilt: (hash(b.id + 5) - .5) * .08 };
  });
  const byId = new Map(pips.map(p => [p.id, p]));
  const bolt = byId.get(BOLT), moss = byId.get(MOSS);
  const at = (arr, f) => { const k = Math.min(NS - 2, Math.floor(f)), u = clamp(f - k, 0, 1); return arr[k] + (arr[k + 1] - arr[k]) * u; };
  const atYaw = (arr, f) => { const k = Math.min(NS - 2, Math.floor(f)), u = clamp(f - k, 0, 1); return angLerp(arr[k], arr[k + 1], u); };
  const posAt = (p, t) => { const f = simT(t) / dt; return [at(p.x, f), at(p.z, f)]; };
  const enAt = (p, t) => at(p.en, simT(t) / dt);
  const beans = D.food.map((f, i) => ({ ...f, i }));
  const kids = D.births.map(c => ({ id: c.id, s: c.s, par: byId.get(c.parent), color: geneColor(c.s), side: hash(c.id) < .5 ? -1 : 1 }));
  const kidsBySpeed = { slow: kids.filter(k => k.par.s < .9).length, fast: kids.filter(k => k.par.s > 1.5).length };
  const gens = R.gens;   // gens[g-1].morning: generation g's morning positions
  const meanOf = a => a.reduce((x, y) => x + y, 0) / a.length;
  const MEAN0 = meanOf(gens[0].speeds), MEANF = meanOf(gens[GENS - 1].speeds);
  window.SIMINFO = { kidsBySpeed, mean0: MEAN0, meanF: MEANF, nF: gens[GENS - 1].n, day1: gens[0].ate, next: gens[0].next };

  // ———————— 2. Stage ————————
  const S = makeStage({ fov: 30, fog: [30, 70], bg: PALETTE.haze });
  const { scene, camera, post, g } = S;
  const A = P.A + 1.2;
  makeBoard(scene, { w: A * 2, d: A * 2, thick: .5, radius: .5, minor: 1, major: 5 });
  makeFloor(scene, PALETTE.floor, -.5);
  const mats = makeMats('C');
  const crowd = new Crowd(scene, mats, 420);
  const beanMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 20, 14), mats.body, beans.length); beanMesh.castShadow = true; beanMesh.receiveShadow = true; beanMesh.frustumCulled = false;
  beans.forEach((b, i) => beanMesh.setColorAt(i, new THREE.Color(PALETTE.mint).offsetHSL(0, 0, (hash(i + 2) - .5) * .06)));
  scene.add(beanMesh);
  const fluff = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), mats.body, 1400); fluff.castShadow = false; fluff.receiveShadow = true; fluff.frustumCulled = false; scene.add(fluff);
  S.setSun([-.5, .9, .45], V(0, 0, 0), A + 1);
  const spent = new THREE.Color(PALETTE.spent), cf = new THREE.Color(PALETTE.fluff);

  // ———————— 3. Beans popping up, expression timelines, the verdict ————————
  beans.forEach(b => { b.popT = CUE.wake + Math.hypot(b.x - bolt.x[0], b.z - bolt.z[0]) / 26 * 1.0 + hash(b.i + 11) * .08; });
  for (const p of pips) {
    const tl = [[-1, 'sleepy']];
    p.wakeT = p === bolt ? CUE.wake + .2 : CUE.wake + .1 + Math.hypot(p.x[0] - bolt.x[0], p.z[0] - bolt.z[0]) / 26 * .9 + hash(p.id + 7) * .2;
    tl.push([p.wakeT, 'surprised']);
    tl.push([CUE.go - 1.6 + hash(p.id + 3) * .3, p.s > 1.4 ? 'determined' : 'neutral']);
    for (const e of p.eats) { tl.push([tFilm(e.t) - .28, 'eat']); tl.push([tFilm(e.t) + .12, 'happy']); }
    if (p.ate === 1 && p.stopAt > 0) tl.push([tFilm(p.stopAt) + .05, 'sleepy']);
    if (p.ate === 0 && p.stopAt > 0) tl.push([tFilm(p.stopAt) + .05, 'sad']);
    if (p.ate === 2) tl.push([tFilm(p.stopAt) + .4, 'happy']);
    tl.sort((a, b) => a[0] - b[0]);
    const out = [tl[0]];
    for (const e of tl.slice(1)) { if (e[0] - out[out.length - 1][0] < .16 && out.length > 1) out[out.length - 1] = [out[out.length - 1][0], e[1]]; else out.push(e); }
    p.tl = out;
    p.vT = CUE.verdict + (p.x[NS - 1] + P.A) / (2 * P.A) * CUE.sweep;
    if (p.ate >= 1) p.tl.push([p.vT + .05, 'happy']);
  }
  const exprAt = (p, t) => {
    let k = 0; while (k + 1 < p.tl.length && p.tl[k + 1][0] <= t) k++;
    let fk = 1; for (let j = 1; j < p.tl.length; j++) { const d = Math.abs(t - p.tl[j][0]); if (d < .075) fk = Math.min(fk, d / .075); }
    return { e: p.tl[k][1], fk };
  };

  // ———————— 4. Camera: every set-up is {look, dir (from the look point to the camera), dist, fov, shift}; set-ups are joined by spherical interpolation ————————
  const camForm = (look, dir, dist, fov, shift = 0, aper = 40) => ({ look, dir: dir.clone().normalize(), dist, fov, shift, aper });
  const blend = (a, b, u, uL = u) => {
    const q = new THREE.Quaternion().setFromUnitVectors(a.dir, b.dir), dir = a.dir.clone().applyQuaternion(new THREE.Quaternion().slerp(q, u));
    return { look: a.look.clone().lerp(b.look, uL), dir, dist: Math.exp(L(Math.log(a.dist), Math.log(b.dist), u)), fov: L(a.fov, b.fov, u), shift: L(a.shift, b.shift, u), aper: L(a.aper, b.aper, u) };
  };
  const pv = (p, t, y = .34) => { const [x, z] = posAt(p, t); return V(x, y, z); };
  // S1: low close-up on the fast one (Bolt). The azimuth is picked by code: no other Pip between it and the camera during 0–4.6 s
  let best = null;
  for (const az of [-2.4, -1.8, -1.2, -.6, 0, .6, 1.2, 1.8, 2.4, 3.0]) {
    const cx = bolt.x[0] + Math.sin(az) * 3.4, cz = bolt.z[0] + Math.cos(az) * 3.4; let bad = 0;
    for (const q of pips) { if (q === bolt) continue; const rx = q.x[0] - cx, rz = q.z[0] - cz, vx = bolt.x[0] - cx, vz = bolt.z[0] - cz, vl = Math.hypot(vx, vz), along = (rx * vx + rz * vz) / vl, lat = Math.abs(rx * vz - rz * vx) / vl;
      if (Math.hypot(rx, rz) < 1.1) bad += 3; else if (along > .2 && along < vl - .35 && lat < .5) bad += 1; else if (along > 0 && along < 2.4 && lat < along * .55 + .3) bad += .5; }
    const sc = -bad * 2 - Math.abs(az - .3) * .1; if (!best || sc > best.sc) best = { az, sc };
  }
  const AZ1 = best.az;
  bolt.yaw0 = AZ1 - .3;
  const camS1 = t => camForm(pv(bolt, 0).lerp(V(bolt.x[0] + Math.sin(AZ1) * 2, .3, bolt.z[0] + Math.cos(AZ1) * 2), .12), V(Math.sin(AZ1 + (seg(t, 0, 4.6) - .5) * .22), .3, Math.cos(AZ1 + (seg(t, 0, 4.6) - .5) * .22)), 3.4, 28, 230, 52);
  const topDir = az => V(Math.sin(az) * .045, 1, Math.cos(az) * .045);
  // overhead, screen-up = board −z; the look point sits to the right of Bolt so the board's left edge is in frame and the left third is clean floor for the type
  const TOP1C = V(-A + 4.0, 0, bolt.z[0] * .6);
  const camS2 = t => camForm(TOP1C.clone().add(V(.5 * seg(t, CUE.rise1, CUE.go), 0, -.5 * seg(t, CUE.rise1, CUE.go))), topDir(0), L(22, 20, ss(seg(t, CUE.rise1, CUE.go))), 34, 0, 8);
  // S3: hard cut to a low side tracking shot of Bolt; slow push to its face in slow motion; 14.6–15.7 focus and look move to Moss while pulling back; then follow Moss
  // the tracking azimuth is picked by code: during 10–19 s nothing blocks the line from the camera to Bolt or Moss, and nothing sits right in front of the lens
  let SIDE = null;
  { let bestS = null;
    for (let a = 0; a < 24; a++) {
      const az = a / 24 * Math.PI * 2, dir = V(Math.sin(az), .55, Math.cos(az)).normalize(); let bad = 0;
      for (let t = CUE.go; t <= CUE.crane0; t += .25) {
        const subj = t < (CUE.pan0 + CUE.pan1) / 2 ? bolt : moss, [sx, sz] = posAt(subj, t), d = subj === bolt ? 2.6 : 3.4;
        const cx = sx + dir.x * d, cz = sz + dir.z * d, vx = sx - cx, vz = sz - cz, vl = Math.hypot(vx, vz);
        for (const q of pips) { if (q === subj) continue; const [qx, qz] = posAt(q, t), rx = qx - cx, rz = qz - cz, along = (rx * vx + rz * vz) / vl, lat = Math.abs(rx * vz - rz * vx) / vl;
          if (Math.hypot(rx, rz) < 1.0) bad += 3; else if (along > 0 && along < vl - .3 && lat < (subj === bolt ? .85 : .55)) bad += subj === bolt ? 2 : 1; }
      }
      // and Bolt's face must be visible when it runs dry: the closer the camera direction is to its heading, the better
      let face = 0; for (let st = .1; st <= bolt.stopAt + .01; st += .05) { const fy = bolt.yaw[Math.min(NS - 1, Math.round(st / dt))]; face += Math.sin(fy) * dir.x + Math.cos(fy) * dir.z; }
      face /= Math.round((bolt.stopAt - .1) / .05) + 1;
      bad += (1 - face) * 25;
      if (!bestS || bad < bestS.bad) bestS = { bad, dir };
    }
    SIDE = bestS.dir; window.SIDEBAD = bestS.bad; window.SIDEDIR = bestS.dir.toArray(); }
  const camS3 = t => {
    const lb = pv(bolt, t, .3), lm = pv(moss, t, .3);
    const u = ss(seg(t, CUE.pan0, CUE.pan1));
    const look = lb.clone().lerp(lm, u);
    const dist = t < CUE.pan0 ? L(3.0, 2.3, ss(seg(t, 11.2, 13.6))) : L(2.3, 3.4, ss(seg(t, CUE.pan0, CUE.pan1 + .6)));
    return camForm(look, SIDE, dist, 30, 0, 62);
  };
  // S4: crane up to the wide (same azimuth); the picture shifts down to leave room for the big number
  const s3end = camS3(CUE.crane0), WD = s3end.dir.clone().setY(0).normalize();
  const WIDE = camForm(WD.clone().multiplyScalar(-2.0).setY(.2), WD.clone().setY(.44), 17.6, 36, 190, 12);
  // S5: the camera keeps moving during the fast-forward: first half tilts down from overhead and orbits (generations 2–9); after the close-up, the other side, still orbiting and tilting, into the histogram set-up
  const sph = (az, el) => V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const camS5 = t => {
    if (t < CUE.cu0) { const u = ss(seg(t, CUE.top1, CUE.cu0)); return camForm(V(L(-7.2, -4.5, u), 0, L(-.4, -.8, u)), sph(L(0, -.55, u), L(1.53, 1.08, u)), L(37, 31, u), 34, 0, 6); }
    const u = ss(seg(t, CUE.cu1, CUE.hist0 + .4)); return camForm(V(L(-3.5, -1.5, u), 0, L(.6, .4, u)), sph(L(.75, .25, u), L(1.0, .86, u)), L(30, 31.5, u), 34, 0, 8);
  };
  // close-up: generation 9's morning, one of the few fast Pips left, surrounded by slow ones (picked by code: speed > 1.5, near the centre, most slow neighbours)
  let CU = null;
  const camCU = t => { if (!CU) { const lay = LAY[JCUT]; let bestC = null;
      for (const [id, b] of lay) { if (b.s <= 1.5 || Math.hypot(b.x, b.z) > 9) continue; let slow = 0; for (const [id2, c] of lay) if (id2 !== id && c.s < 1.0 && Math.hypot(c.x - b.x, c.z - b.z) < 3) slow++; if (!bestC || slow > bestC.slow) bestC = { id, b, slow }; }
      let bestA = null; for (let a = 0; a < 16; a++) { const az = a / 16 * Math.PI * 2, d = sph(az, .32), cx = bestC.b.x + d.x * 3.2, cz = bestC.b.z + d.z * 3.2; let bad = 0;
        for (const [id2, c] of lay) { if (id2 === bestC.id) continue; const rx = c.x - cx, rz = c.z - cz, vx = bestC.b.x - cx, vz = bestC.b.z - cz, vl = Math.hypot(vx, vz), along = (rx * vx + rz * vz) / vl, lat = Math.abs(rx * vz - rz * vx) / vl;
          if (Math.hypot(rx, rz) < 1.0) bad += 3; else if (along > 0 && along < vl - .3 && lat < .7) bad += 2; else if (along > vl && along < vl + 5 && lat < 2) bad -= .3; }
        if (!bestA || bad < bestA.bad) bestA = { bad, az }; }
      CU = { ...bestC, az: bestA.az, fastLeft: gens[JCUT].speeds.filter(v => v > 1.5).length, fast0: gens[0].speeds.filter(v => v > 1.5).length }; window.CU = { id: CU.id, s: CU.b.s, slow: CU.slow, fastLeft: CU.fastLeft }; }
    const u = seg(t, CUE.cu0, CUE.cu1);
    return camForm(V(CU.b.x, .3, CU.b.z), sph(CU.az + .12 * u, .3), L(3.3, 2.7, ss(u)), 30, 0, 60);
  };
  // S6: tilt down onto the histogram printed on the board; then hold
  const HIST = t => camForm(V(0, 0, .2), V(0, 1.05, 1), L(33, 31.5, ss(seg(t, CUE.hist1, CUE.still))), 32, -20, 10);
  function cam(t) {
    if (t < CUE.rise0) return camS1(t);
    if (t < CUE.go) { const u = eio(seg(t, CUE.rise0, CUE.rise1)); return u >= 1 ? camS2(t) : blend(camS1(t), camS2(t), u, ss(seg(t, CUE.rise0, CUE.rise1 - .3))); }
    if (t < CUE.crane0) return camS3(t);
    if (t < CUE.top0) { const u = eio(seg(t, CUE.crane0, CUE.crane1)); return blend(camS3(t), WIDE, u, ss(seg(t, CUE.crane0, CUE.crane1))); }
    if (t < CUE.top1) { const u = eio(seg(t, CUE.top0, CUE.top1)); return blend(WIDE, camS5(CUE.top1), u); }
    if (t < CUE.cu0) return camS5(t);
    if (t < CUE.cu1) return camCU(t);                 // hard cut in, hard cut out
    if (t < CUE.hist0) return camS5(t);
    const u = eio(seg(t, CUE.hist0, CUE.hist1)); return blend(camS5(CUE.hist0), HIST(t), u, ss(seg(t, CUE.hist0, CUE.hist1 - .4)));
  }
  function applyCam(c) {
    camera.position.copy(c.look).addScaledVector(c.dir, c.dist); camera.fov = c.fov;
    camera.setViewOffset(W, H, 0, -c.shift, W, H); camera.updateProjectionMatrix(); camera.lookAt(c.look); camera.updateMatrixWorld();
  }
  const project = (x, y, z) => { const v = V(x, y, z).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };

  // ———————— 5. 20 generations: each morning's layout; between generations one diagonal wave across the board (the old sink, the new pop up) ————————
  // L[0] = end of day 1 (survivors where they stopped + newborns beside their parents), L[1..19] = mornings of generations 2..20, L[20] = histogram slots
  const kidPos = k => { const p = k.par, ang = p.yaw[NS - 1] + k.side * 1.9; return [p.x[NS - 1] + Math.sin(ang) * SC * 1.15, p.z[NS - 1] + Math.cos(ang) * SC * 1.15]; };
  const LAY = [];
  { const m = new Map(); for (const p of pips) if (p.ate >= 1) m.set(p.id, { x: p.x[NS - 1], z: p.z[NS - 1], s: p.s, yaw: p.yaw[NS - 1] }); for (const k of kids) { const [x, z] = kidPos(k); m.set(k.id, { x, z, s: k.s, yaw: k.par.yaw[NS - 1] + k.side * .7 }); } LAY.push(m); }
  for (let gi = 1; gi < GENS; gi++) { const m = new Map(); for (const b of gens[gi].morning) m.set(b.id, { x: b.x, z: b.z, s: b.s }); LAY.push(m); }
  // histogram: 0.2 per bin, 8 bins (≤0.5 … ≥1.7), 5 Pips per row
  const BIN0 = .4, BW = .2, NB = 8, PER = 5, PITCH = .64, BARW = PER * PITCH, GAP = .62, STEP = BARW + GAP, Z0 = 4.2;
  const binOf = s => clamp(Math.round((s - BIN0) / BW), 0, NB - 1);
  const bx = k => (k - (NB - 1) / 2) * STEP;
  const finalPop = gens[GENS - 1].morning;
  const bins = Array.from({ length: NB }, () => []);
  finalPop.forEach(b => bins[binOf(b.s)].push(b)); bins.forEach(l => l.sort((a, c) => a.s - c.s));
  const gen1Bins = new Array(NB).fill(0); gens[0].speeds.forEach(s => gen1Bins[binOf(s)]++);
  { const m = new Map(); bins.forEach((l, k) => l.forEach((b, j) => { const row = Math.floor(j / PER), col = j % PER; m.set(b.id, { x: bx(k) + (col - (PER - 1) / 2) * PITCH, z: Z0 - .5 - row * PITCH, s: b.s, row, k }); })); LAY.push(m); }
  // transition times
  const TR = [];
  // generations 2–9 (8 waves) at 28.4–31.9 s, about 0.44 s each; 32.0–34.4 hard cut to the close-up (held on generation 9); generations 10–20 (11 waves) at 34.5–37.3, about 0.25 s each
  const JCUT = 8;
  { let t = CUE.gen0; for (let j = 0; j < JCUT; j++) { TR.push({ t, d: .38 }); t += .44; }
    t = CUE.genB; const per = (CUE.gen1 - CUE.genB) / (GENS - 1 - JCUT); for (let j = JCUT; j < GENS - 1; j++) { TR.push({ t, d: per * .86 }); t += per; }
    TR.push({ t: CUE.walk0, d: CUE.walk1 - CUE.walk0, walk: true }); }
  window.TR_END = TR[GENS - 2].t + TR[GENS - 2].d;
  const genAt = t => { let g = 2; for (let j = 0; j < GENS - 1; j++) if (t >= TR[j].t + TR[j].d * .5) g = j + 2; return g; };
  const waveDir = j => { const a = 2.4 + j * 2.1; return [Math.cos(a), Math.sin(a)]; };
  function popLayout(t) {
    // returns [{id, x, z, s, sc, hop, yaw, expr}]
    let j = -1; for (let q = 0; q < TR.length; q++) if (t >= TR[q].t) j = q;
    if (j < 0) return [...LAY[0]].map(([id, b]) => ({ id, ...b, sc: 1, hop: 0, expr: 'happy' }));
    const tr = TR[j], A0 = LAY[j], B0 = LAY[j + 1], u = (t - tr.t) / tr.d, out = [];
    if (u >= 1) return [...B0].map(([id, b]) => ({ id, ...b, sc: 1, hop: 0, yaw: tr.walk ? (hash(id + 1) - .5) * .5 : hash(id + j) * 6.28, expr: tr.walk ? (b.s < .55 ? 'sleepy' : hash(id + 4) < .5 ? 'happy' : 'neutral') : 'neutral' }));
    if (tr.walk) {   // walking into the histogram: nearer slots first; hop phase follows distance
      for (const [id, b] of B0) {
        const a = A0.get(id) || b, ord = (b.row + (b.k % 2) * .5) / 14, w0 = ord * .55, w = seg(u, w0, w0 + .45), e = eio(w);
        const x = L(a.x, b.x, e), z = L(a.z, b.z, e), dist = Math.hypot(b.x - a.x, b.z - a.z);
        const moving = w > 0 && w < 1 ? 1 : 0, ph = dist * e / .32;
        out.push({ id, x, z, s: b.s, sc: 1, hop: moving * Math.abs(Math.sin(Math.PI * ph)) * .1, yaw: moving ? Math.atan2(b.x - a.x, b.z - a.z) : (hash(id + 1) - .5) * .5, expr: moving ? 'determined' : 'happy', moving });
      }
      return out;
    }
    const [dx, dz] = waveDir(j), off = (x, z) => ((x * dx + z * dz) / (A * 1.42) + 1) / 2;   // the wave sweeps from one corner of the board to the other
    for (const [id, a] of A0) {
      // when the wave front passes its old spot it sinks; when it passes its new spot it pops up: behind the front the new generation, ahead the old, only a thin seam between
      const b = B0.get(id), w0 = off(a.x, a.z) * .8, down = seg(u, w0, w0 + .12);
      if (!b) { if (down < 1) out.push({ id, ...a, sc: 1 - eo(down), hop: 0, yaw: hash(id + j) * 6.28, expr: 'sad' }); continue; }
      const w1 = off(b.x, b.z) * .8 + .06, up = seg(u, w1, w1 + .14);
      if (down < 1 && up <= 0) out.push({ id, ...a, sc: 1 - eo(down), hop: 0, yaw: hash(id + j) * 6.28, expr: 'neutral' });
      else if (up > 0) out.push({ id, ...b, sc: backOut(up, 2), hop: .08 * Math.sin(Math.PI * up), yaw: hash(id + j + 1) * 6.28, expr: 'happy' });
    }
    for (const [id, b] of B0) if (!A0.has(id)) { const w1 = off(b.x, b.z) * .8 + .06, up = seg(u, w1, w1 + .14); if (up > 0) out.push({ id, ...b, sc: backOut(up, 2.4), hop: .1 * Math.sin(Math.PI * up), yaw: hash(id + 2) * 6.28, expr: 'surprised' }); }
    return out;
  }
  // the histogram printed on the board: generation 20's bar grounds (light team colour) + generation 1's dashed outline + the axis; one decal that fades in as the camera tilts down
  const maxRows = Math.max(...bins.map(l => Math.ceil(l.length / PER)), ...gen1Bins.map(c => Math.ceil(c / PER)));
  const DW = NB * STEP + 2, DD = maxRows * PITCH + 3.2, dz0 = Z0 + 1.4;
  const histDecal = decal(scene, { w: DW, h: DD, x: 0, z: dz0 - DD / 2, px: 110, draw(c, w, h) {
    const X = x => x + w / 2, Y = z => h - (dz0 - z);
    bins.forEach((l, k) => { const rows = Math.ceil(l.length / PER); if (!rows) return;
      const tint = geneColor(BIN0 + k * BW).lerp(new THREE.Color(PALETTE.barPaper), .78); c.fillStyle = '#' + tint.getHexString(THREE.SRGBColorSpace);
      c.beginPath(); c.roundRect(X(bx(k) - BARW / 2 - .1), Y(Z0 - .5 - (rows - 1) * PITCH - .45), BARW + .2, (rows - 1) * PITCH + .45 + .4, .3); c.fill(); });
    c.strokeStyle = PALETTE.ink; c.globalAlpha = .7; c.lineWidth = .07; c.setLineDash([.22, .16]);
    gen1Bins.forEach((n, k) => { const rows = Math.ceil(n / PER); if (!rows) return; c.beginPath(); c.roundRect(X(bx(k) - BARW / 2 - .1), Y(Z0 - .5 - (rows - 1) * PITCH - .45), BARW + .2, (rows - 1) * PITCH + .45 + .4, .3); c.stroke(); });
    c.setLineDash([]); c.globalAlpha = .6; c.fillStyle = PALETTE.ink; c.fillRect(X(bx(0) - STEP / 2), Y(Z0 + .25) - .02, NB * STEP, .04);
    for (let k = 0; k < NB; k++) c.fillRect(X(bx(k)) - .02, Y(Z0 + .25), .04, .2);
    // mean speed markers: generation 1 (outlined triangle) and generation 20 (solid mint triangle)
    const mx = s => X(bx(0) + (s - BIN0) / BW * STEP);
    c.globalAlpha = .55; c.beginPath(); c.moveTo(mx(MEAN0), Y(Z0 + .55)); c.lineTo(mx(MEAN0) - .22, Y(Z0 + .95)); c.lineTo(mx(MEAN0) + .22, Y(Z0 + .95)); c.closePath(); c.lineWidth = .05; c.stroke();
    c.globalAlpha = 1; c.fillStyle = PALETTE.mint; c.beginPath(); c.moveTo(mx(MEANF), Y(Z0 + .55)); c.lineTo(mx(MEANF) - .26, Y(Z0 + 1.0)); c.lineTo(mx(MEANF) + .26, Y(Z0 + 1.0)); c.closePath(); c.fill();
  } });
  histDecal.material.opacity = 0; histDecal.visible = false;
  // the speed ramp (printed near the board edge in S2): slow → fast
  const rampDecal = decal(scene, { w: 12, h: 1.4, x: 0, z: 0, px: 160, draw(c, w, h) {
    const grd = c.createLinearGradient(1, 0, w - 1, 0); for (let i = 0; i <= 26; i++) { const v = .6 + i * .05; grd.addColorStop(i / 26, '#' + geneColor(v).getHexString(THREE.SRGBColorSpace)); }
    c.fillStyle = grd; c.beginPath(); c.roundRect(1, .5, w - 2, .22, .11); c.fill();
  } });
  rampDecal.visible = false;
  // end card: printed on the board (the empty board in front of the histogram, lower right), part of the lab bench like all other type.
  // Its position is found by casting the last shot's screen rectangle onto the board; the type is pre-stretched vertically (1 / perspective squash) so it reads at normal proportions from the camera.
  const STYLE_EN = 'Blob Simulation', STYLE_ZH = '小人模拟实验', SIGN = 'LemoLab \u00D7 Claude Opus 5.5';
  const creditDecal = (() => {
    applyCam(cam(CUE.still));
    const rc = new THREE.Raycaster(), pl = new THREE.Plane(V(0, 1, 0), 0), hit = (px, py) => { rc.setFromCamera(new THREE.Vector2(px / W * 2 - 1, -(py / H * 2 - 1)), camera); const p = V(0, 0, 0); rc.ray.intersectPlane(pl, p); return p; };
    const X0 = 1180, X1 = 1800, Y0 = 812, Y1 = 1036;
    const a = hit(X0, (Y0 + Y1) / 2), b = hit(X1, (Y0 + Y1) / 2), top = hit((X0 + X1) / 2, Y0), bot = hit((X0 + X1) / 2, Y1);
    const w = b.x - a.x, h = bot.z - top.z, kx = w / (X1 - X0), sv = (h / (Y1 - Y0)) / kx;
    const m = decal(scene, { w, h, x: (a.x + b.x) / 2, z: (top.z + bot.z) / 2, y: .004, px: 260, draw(c) {
      c.save(); c.scale(kx, kx * sv); c.textAlign = 'right'; c.fillStyle = PALETTE.ink; const R = X1 - X0;
      c.font = '600 44px Fredoka'; c.fillText('Is faster better?', R, 44);
      c.globalAlpha = .8; c.font = '500 34px "Noto Sans SC"'; c.fillText('跑得快，就更好吗？', R, 88);
      c.globalAlpha = 1; c.font = '500 34px "Noto Sans SC"'; c.fillText(STYLE_ZH, R, 140); const zw = c.measureText(STYLE_ZH).width;
      c.globalAlpha = .62; c.font = '600 22px Inter'; c.letterSpacing = '2px'; c.fillText(STYLE_EN.toUpperCase() + '  ·', R - zw - 12, 138); c.letterSpacing = '0px';
      c.globalAlpha = .3; c.fillRect(R - 400, 160, 400, 2);
      c.globalAlpha = 1; c.font = '600 30px Inter'; c.fillText(SIGN, R, 206);
      c.restore();
    } });
    m.material.opacity = 0; m.visible = false; return m;
  })();

  // each generation's wave front: a mint band sweeping the board (drawn on the board only)
  const waveMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, uniforms: { uCol: { value: new THREE.Color(PALETTE.mint) }, uA: { value: 0 }, uHalf: { value: A - .55 } },
    vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uA, uHalf; varying vec3 vW; varying vec2 vUv; void main(){ if (abs(vW.x) > uHalf || abs(vW.z) > uHalf) discard; float k = exp(-pow((vUv.y - .5) * 5., 2.)); gl_FragColor = vec4(uCol, uA * k); }' });
  const wave = new THREE.Mesh(new THREE.PlaneGeometry(90, 1.6), waveMat); wave.position.y = .012; wave.renderOrder = 4; wave.visible = false; scene.add(wave);
  function waveAt(t) {
    wave.visible = false; let j = -1; for (let q = 0; q < TR.length; q++) if (t >= TR[q].t) j = q;
    if (j < 0 || TR[j].walk || (t >= CUE.cu0 && t < CUE.cu1)) return;
    const u = (t - TR[j].t) / TR[j].d; if (u <= 0 || u >= 1.15) return;
    const [dx, dz] = waveDir(j), w = clamp(u / .8 + .05, 0, 1.1), p = (2 * w - 1) * A * 1.42;
    // lay the plane flat (long side along x, short along z), then turn it about y so the short side faces the wave
    wave.visible = true; wave.position.set(dx * p, .012, dz * p); wave.rotation.set(-Math.PI / 2, Math.atan2(dx, dz), 0, 'YXZ');
    waveMat.uniforms.uA.value = .85 * Math.sin(Math.PI * clamp(u / 1.15, 0, 1)) ** .5;
  }
  // ———————— 6. Verdict rings ————————
  const ringGeo = new THREE.RingGeometry(.86, 1, 64); ringGeo.rotateX(-Math.PI / 2);
  const mkRing = col => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.renderOrder = 3; m.visible = false; scene.add(m); return m; };
  const gones = pips.filter(p => p.ate === 0).map(p => ({ p, ring: mkRing(PALETTE.spent) }));
  kids.forEach(k => { k.ring = mkRing(PALETTE.mint); });
  const ringAt = (ring, x, z, t0, t) => { const u = seg(t, t0, t0 + .6); ring.visible = u > 0 && u < 1; if (!ring.visible) return; const r = SC * (.55 + .9 * eo(u)); ring.position.set(x, .006, z); ring.scale.set(r, 1, r); ring.material.opacity = .85 * Math.pow(1 - u, 1.3); };
  const RB = .54;
  function relax(pts) {
    for (let it = 0; it < 3; it++) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = b.x - a.x, dz = b.z - a.z, need = a.r + b.r;
      if (Math.abs(dx) > need || Math.abs(dz) > need) continue;
      const d = Math.hypot(dx, dz); if (d >= need) continue;
      const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0, push = (need - d) / 2;
      a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
    }
  }

  // ———————— 7. Sound events ————————
  const EV = [];
  const evAt = (t, type, x, z, extra = {}) => { applyCam(cam(t)); const [sx, , vz] = project(x, .3, z), d = camera.position.distanceTo(V(x, .3, z)), on = sx > -100 && sx < W + 100 && vz < 1; EV.push({ t: +t.toFixed(3), type, pan: +clamp(sx / W * 2 - 1, -1, 1).toFixed(3), g: +(on ? clamp(3.2 / d, 0, 1) : clamp(1.5 / d, 0, .3)).toFixed(3), ...extra }); };
  beans.forEach(b => evAt(b.popT, 'bean', b.x, b.z));
  for (const p of pips) {
    if (p === bolt) evAt(p.wakeT, 'wake', p.x[0], p.z[0], { hero: 1 });
    let prev = 0;
    for (let k = 1; k < NS; k++) { const ph = Math.floor(p.dist[k] / p.stride); if (ph > prev) { prev = ph; const t = tFilm(k * dt); evAt(t, 'step', p.x[k], p.z[k], { s: +p.s.toFixed(2), hero: p === bolt || p === moss ? 1 : 0, slow: +(1 / Math.max(.05, (dayMap(t + .01) - dayMap(t)) / .01)).toFixed(2) }); } }
    for (const e of p.eats) { const f = D.food[e.food]; evAt(tFilm(e.t), 'eat', f.x, f.z, { s: +p.s.toFixed(2), hero: p === bolt || p === moss ? 1 : 0 }); }
    if (p.stopAt > 0 && p.ate < 2) evAt(tFilm(p.stopAt), p.ate ? 'tired' : 'slump', p.x[NS - 1], p.z[NS - 1], { hero: p === bolt ? 1 : 0 });
    if (p.ate === 0) evAt(p.vT, 'gone', p.x[NS - 1], p.z[NS - 1], { s: +p.s.toFixed(2) });
  }
  kids.forEach(k => evAt(k.par.vT + .06, 'birth', k.par.x[NS - 1], k.par.z[NS - 1], { s: +k.s.toFixed(2) }));
  TR.forEach((tr, j) => { if (!tr.walk) EV.push({ t: +(tr.t + tr.d * .5).toFixed(3), type: 'gen', g: j + 2, mean: +meanOf(gens[j + 1].speeds).toFixed(3), d: +tr.d.toFixed(3) }); });
  // walking into the histogram: one event per Pip as it lands in its slot
  for (const [id, b] of LAY[GENS]) { const ord = (b.row + (b.k % 2) * .5) / 14, w0 = ord * .55; EV.push({ t: +(CUE.walk0 + (w0 + .45) * (CUE.walk1 - CUE.walk0)).toFixed(3), type: 'slot', s: +b.s.toFixed(2), pan: +clamp(bx(b.k) / 16, -1, 1).toFixed(2), g: .5 }); }
  for (const [k, v] of Object.entries(CUE)) EV.push({ t: v, type: 'cue', name: k });
  EV.push({ t: DAYEND, type: 'cue', name: 'dayEnd' });
  VO.forEach(v => EV.push({ t: v.t, type: 'vo', id: v.id, dur: durs[v.id] }));
  EV.sort((a, b) => a.t - b.t);
  window.EV = EV;

  // ———————— 8. Placing the Pips every frame ————————
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const puff = (x, z, u, seed, size = 1) => { if (u <= 0 || u >= 1) return; for (let k = 0; k < 4; k++) { const a = k * 1.57 + hash(seed + k) * 1.2, r = SC * (.25 + .5 * ss(u)) * size, rr = SC * .13 * Math.sin(Math.PI * u) * (1 - .15 * k) * size; m4.compose(v3.set(x + Math.cos(a) * r, rr * .9 + .02 + u * .12 * SC, z + Math.sin(a) * r), q4.identity(), s3.set(rr, rr * .85, rr)); fluff.setMatrixAt(fluff.count, m4); fluff.setColorAt(fluff.count++, cf); } };
  function stageDay(t) {
    const st = simT(t), f = st / dt;
    const pts = [];
    for (const p of pips) { if (p.ate === 0 && t >= p.vT + .42) { p._vis = false; continue; } p._vis = true; const sh = p.ate === 0 && t >= p.vT ? 1 - seg(t, p.vT + .1, p.vT + .42) : 1; pts.push(p._pt = { x: at(p.x, f), z: at(p.z, f), r: RB * p.size * sh }); }
    for (const k of kids) { const t0 = k.par.vT + .06; k._vis = t >= t0; if (!k._vis) continue; const u = seg(t, t0, t0 + .38), [kx, kz] = kidPos(k), p = k.par; pts.push(k._pt = { x: L(p.x[NS - 1], kx, ss(u)), z: L(p.z[NS - 1], kz, ss(u)), r: RB * SC * .86 * clamp(backOut(u, 2.2), 0, 1.1) }); }
    relax(pts);
    for (const p of pips) {
      if (!p._vis) continue;
      const x = p._pt.x, z = p._pt.z;
      const m = t < CUE.go ? 0 : at(p.mov, f), d = at(p.dist, f);
      let yaw = t < CUE.go ? angLerp(p.yaw0, p.yaw[1], ss(seg(t, CUE.go - .5, CUE.go))) : atYaw(p.yaw, f);
      // once Bolt has run dry it slowly turns round to face the camera (acting; the simulation is unchanged)
      if (p === bolt && SIDE) { const ts = tFilm(p.stopAt); yaw = angLerp(yaw, Math.atan2(SIDE.x, SIDE.z) - .25, ss(seg(t, ts + .15, ts + 1.1))); }
      const ph = d / p.stride;
      let hop = m * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 1.5) * .17 * SC, sq = 1 + m * .08 * Math.cos(2 * Math.PI * ph);
      let s = p.size, lean = m * (.12 + .1 * clamp(p.s - .8, 0, 1));
      sq *= 1 + .022 * (1 - m) * Math.sin(2 * Math.PI * (t * .85 + hash(p.id + 21)));
      sq *= 1 - .07 * Math.sin(Math.PI * seg(t, CUE.go - .3, CUE.go + .02));
      { const u = seg(t, p.wakeT, p.wakeT + .32); if (u > 0 && u < 1) { hop += Math.sin(Math.PI * u) * .1 * SC; sq *= 1 + .06 * Math.sin(Math.PI * u); } }
      for (const e of p.eats) { const u = seg(t, tFilm(e.t) - .02, tFilm(e.t) + .3); if (u > 0 && u < 1) { const b = Math.sin(Math.PI * u) * Math.exp(-u * 1.5); sq *= 1 - .1 * b; s *= 1 + .05 * b; } }
      // out of energy: slump and fade to warm grey (greyer with no bean); survivors 'refill' their colour at the verdict
      let col = p.color;
      if (p.stopAt > 0 && p.ate < 2) {
        const ts = tFilm(p.stopAt), gk = ss(seg(t, ts - .05, ts + (p === bolt ? 1.4 : .45))) * (1 - (p.ate >= 1 ? ss(seg(t, p.vT, p.vT + .35)) : 0));
        sq *= 1 - .06 * gk; if (gk > 0) col = p.color.clone().lerp(spent, (p.ate ? .55 : .78) * gk);
      }
      let { e: expr, fk } = exprAt(p, t);
      if (t >= p.vT) {
        const u = seg(t, p.vT, p.vT + .42);
        if (p.ate === 0) { sq *= 1 + .16 * Math.sin(Math.PI * seg(u, 0, .35)); s *= 1 - Math.pow(seg(u, .2, 1), 1.6); puff(x, z, seg(t, p.vT + .08, p.vT + .55), p.id); }
        else { const b = Math.sin(Math.PI * u); sq *= 1 - .09 * b; hop += .05 * SC * Math.sin(Math.PI * seg(t, p.vT + .12, p.vT + .4)); }
      }
      crowd.add({ x, z, yaw, s, color: col, expr, faceK: fk, lean, hop, squash: sq, tilt: p.tilt });
      if (m > .4 && p.s > 1.15) {
        const fr = ph - Math.floor(ph);
        if (fr < .5) { const bxx = Math.sin(yaw), bzz = Math.cos(yaw), back = fr * p.stride;
          for (let k = 0; k < 3; k++) { const r = SC * (.11 - k * .025) * Math.sin(Math.PI * fr / .5) * m; if (r <= .002) continue; const side = (hash(p.id * 7 + k + Math.floor(ph) * 3) - .5) * .5 * SC, bk = back + (.45 + k * .16) * SC;
            m4.compose(v3.set(x - bxx * bk + bzz * side, r * .9 + k * .012, z - bzz * bk - bxx * side), q4.identity(), s3.set(r, r * .85, r)); fluff.setMatrixAt(fluff.count, m4); fluff.setColorAt(fluff.count++, cf); } }
      }
    }
    for (const k of kids) {
      if (!k._vis) continue; const t0 = k.par.vT + .06, u = seg(t, t0, t0 + .38), y0 = k.par.yaw[NS - 1];
      const wob = Math.sin(seg(t, t0 + .3, t0 + .7) * Math.PI), expr = t < t0 + .45 ? 'surprised' : 'happy', fk = clamp(Math.abs(t - (t0 + .45)) / .075, 0, 1);
      crowd.add({ x: k._pt.x, z: k._pt.z, yaw: y0 + k.side * .7, s: Math.max(.001, SC * .86 * backOut(u, 2.2)), color: k.color, expr, faceK: fk, hop: .12 * SC * Math.sin(Math.PI * u), squash: 1 + .08 * wob, tilt: k.side * .06 });
    }
    for (const g0 of gones) ringAt(g0.ring, g0.p.x[NS - 1], g0.p.z[NS - 1], g0.p.vT + .05, t);
    for (const k of kids) ringAt(k.ring, k.par.x[NS - 1], k.par.z[NS - 1], k.par.vT + .06, t);
    // beans
    beans.forEach((b, i) => {
      let sc = backOut(seg(t, b.popT, b.popT + .28), 2.4), x = b.x, z = b.z, y = .08;
      if (b.eatenAt >= 0) { const te = tFilm(b.eatenAt), u = seg(t, te - .14, te + .04); if (u >= 1) sc = 0; else if (u > 0) { const eater = byId.get(b.by); const [ex, ez] = posAt(eater, t); x = L(b.x, ex, ss(u) * .55); z = L(b.z, ez, ss(u) * .55); y += .12 * Math.sin(Math.PI * u); sc *= 1 - ss(u); } }
      // from day 2 the beans sink into the board
      if (t > CUE.top0) sc *= 1 - ss(seg(t, CUE.top0, CUE.top0 + .6));
      m4.compose(v3.set(x, y * Math.min(1, sc), z), q4.setFromAxisAngle(V(0, 1, 0), hash(i) * 6), s3.set(sc, sc * .8, sc * 1.15)); beanMesh.setMatrixAt(i, m4);
    });
    beanMesh.instanceMatrix.needsUpdate = true;
    return { gone: gones.filter(g0 => t >= g0.p.vT).length, born: kids.filter(k => t >= k.par.vT + .06).length };
  }
  function stageGens(t) {
    for (const g0 of gones) g0.ring.visible = false; for (const k of kids) k.ring.visible = false;
    const list = popLayout(t), pts = list.map(o => ({ x: o.x, z: o.z, r: RB * SC * Math.max(.05, Math.min(1, o.sc)), o }));
    if (t < CUE.walk1 + .2) relax(pts);
    for (const p of pts) {
      const o = p.o, sz = SC * (.96 + hash(o.id + 9) * .08) * Math.max(.001, o.sc);
      if (CU && t >= CUE.cu0 && t < CUE.cu1) {   // in the close-up the fast one looks around and the slow ones turn to look at it
        const cam0 = Math.atan2(Math.sin(CU.az), Math.cos(CU.az));
        if (o.id === CU.id) { o.yaw = cam0 + .5 * Math.sin((t - CUE.cu0) * 2.6); o.expr = t < CUE.cu0 + 1.3 ? 'surprised' : 'sad'; }
        else if (Math.hypot(o.x - CU.b.x, o.z - CU.b.z) < 4) { o.yaw = Math.atan2(CU.b.x - o.x, CU.b.z - o.z) + (hash(o.id) - .5) * .4; o.expr = hash(o.id + 3) < .5 ? 'neutral' : 'happy'; }
      }
      const sq = 1 + .022 * Math.sin(2 * Math.PI * (Math.min(t, CUE.still) * .85 + hash(o.id + 21))) * (t < CUE.still ? 1 : 0);
      crowd.add({ x: p.x, z: p.z, yaw: o.yaw, s: sz, color: geneColor(o.s), expr: o.expr, hop: o.hop * SC * 2, squash: sq, lean: o.moving ? .14 : 0, tilt: (hash(o.id + 5) - .5) * .08 });
    }
    for (let i = 0; i < beans.length; i++) { m4.makeScale(0, 0, 0); beanMesh.setMatrixAt(i, m4); }
    beanMesh.instanceMatrix.needsUpdate = true;
    return { n: list.filter(o => o.sc > .5).length };
  }

  // ———————— 9. Type ————————
  const fadeIn = (t, t0, d = .4) => { const u = seg(t, t0, t0 + d); return { a: ss(u), dy: (1 - eo(u)) * 14 }; };
  const fadeOut = (t, t1, d = .3) => 1 - ss(seg(t, t1, t1 + d));
  // every text drawn while REC is set is recorded for window.TEXTS (the reading-time check); drawing is unchanged
  let REC = null;
  function text(str, x, y, font, alpha, ls = 0, align = 'left', col = PALETTE.ink) {
    if (alpha <= 0) return; g.font = font; g.letterSpacing = ls + 'px'; g.textAlign = align; g.globalAlpha = alpha; g.fillStyle = col; g.fillText(str, x, y);
    if (REC && alpha > .35) { const w = g.measureText(str).width, px = +font.match(/(\d+)px/)[1], x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      REC.push({ id: font + '|' + align + '|' + str, text: String(str), x0, y0: y - px, x1: x0 + w, y1: y + px * .3 }); }
    g.letterSpacing = '0px'; g.textAlign = 'left';
  }
  function beanDots(x, y, k, a) { for (let q = 0; q < 2; q++) { g.globalAlpha = a; g.beginPath(); g.arc(x + q * 22, y - 8, 7.5, 0, Math.PI * 2); if (q < k) { g.fillStyle = PALETTE.mint; g.fill(); } else { g.strokeStyle = PALETTE.ink; g.globalAlpha = a * .35; g.lineWidth = 1.6; g.stroke(); } } }
  const counts = t => { const f = Math.min(NS - 1, Math.round(simT(t) / dt)); const c = [0, 0, 0]; for (const p of pips) c[Math.min(2, p.ateK[f])]++; return c; };
  // bilingual subtitles: lower left on a paper-coloured rounded plate; Chinese 36 px above, English 24 px below
  const SUBS = VO.map((v, i) => { const need = Math.max(v.t + durs[v.id] + .6, v.t + 1.8), nx = VO[i + 1] ? VO[i + 1].t - .1 : DUR; return { ...v, t0: v.t, t1: Math.max(need, Math.min(need + .5, nx)) }; });
  window.SUBS = SUBS;
  function subtitle(t) {
    const s = SUBS.find(s => t >= s.t0 && t < s.t1); if (!s) return;
    const a = ss(seg(t, s.t0, s.t0 + .18)) * (1 - ss(seg(t, s.t1 - .18, s.t1)));
    g.font = '500 36px "Noto Sans SC"'; const w1 = g.measureText(s.zh).width; g.font = '500 25px Inter'; const w2 = g.measureText(s.en).width;
    const x = 120, y = H - 128, w = Math.max(w1, w2) + 48;
    g.globalAlpha = a * .86; g.fillStyle = PALETTE.board; g.beginPath(); g.roundRect(x - 24, y - 44, w, 100, 18); g.fill();
    text(s.zh, x, y, '500 36px "Noto Sans SC"', a);
    text(s.en, x, y + 38, '500 24px Inter', a * .9);
  }
  // the tag that travels with a Pip (beside its head, facing the camera): speed + energy bar
  function tag(p, t, label, a) {
    if (a <= 0) return; const [x, z] = posAt(p, t), [bx0, by0] = project(x, 0, z), [hx, hy] = project(x, .58, z), hp = Math.hypot(hx - bx0, hy - by0), e = enAt(p, t);
    const sx = hx + hp * .62, sy = hy + hp * .18;
    text(p.s.toFixed(2), sx - 4, sy - 34, '600 46px Fredoka', a);
    text(label, sx + 92, sy - 36, '600 15px Inter', a * .55, 2);
    g.globalAlpha = a * .25; g.fillStyle = PALETTE.ink; g.beginPath(); g.roundRect(sx - 2, sy - 20, 150, 9, 4.5); g.fill();
    g.globalAlpha = a; g.fillStyle = e > .05 ? PALETTE.mint : PALETTE.spent; g.beginPath(); g.roundRect(sx - 2, sy - 20, Math.max(9, 150 * e), 9, 4.5); g.fill();
    text('ENERGY', sx - 2, sy + 8, '600 13px Inter', a * .5, 2);
  }
  function overlay(t, st) {
    g.clearRect(0, 0, W, H); g.textBaseline = 'alphabetic';
    // S1 title: the opening frame puts the Pips in the lower half (hazy board above) and lays a faint board-coloured plate behind the title
    { const o = fadeOut(t, 4.3), f0 = fadeIn(t, CUE.title), f1 = fadeIn(t, CUE.title + .1), f2 = fadeIn(t, CUE.title + .3);
      const bg = g.createRadialGradient(360, 345, 40, 360, 345, 620); bg.addColorStop(0, 'rgba(236,230,218,.8)'); bg.addColorStop(.55, 'rgba(236,230,218,.55)'); bg.addColorStop(1, 'rgba(236,230,218,0)');
      g.save(); g.globalAlpha = f0.a * o; g.fillStyle = bg; g.scale(1, .55); g.fillRect(0, 0, 1100, 1000); g.restore();
      text('EXPERIMENT 01 · SPEED', 120, 118 + f0.dy, '600 17px Inter', .78 * f0.a * o, 2);
      text('Is faster better?', 116, 192 + f1.dy, '600 76px Fredoka', f1.a * o);
      text('跑得快，就一定更好吗？', 120, 252 + f2.dy, '500 38px "Noto Sans SC"', .86 * f2.a * o); }
    // S2 rules: all on the clean floor left of the board edge, top to bottom: head count → three rules → energy → colour ramp
    if (t > CUE.rules && t < CUE.go) {
      const o = fadeOut(t, CUE.go - .35, .3), X = 120;
      const f = fadeIn(t, CUE.rules);
      text('DAY 1 · MORNING', X, 118 + f.dy, '600 15px Inter', .55 * f.a * o, 2);
      text('160', X - 8, 250 + f.dy, '600 150px Fredoka', f.a * o);
      text('pips', X + 262, 250 + f.dy, '500 30px Inter', .7 * f.a * o);
      text('THE RULES', X, 336, '600 15px Inter', .55 * fadeIn(t, CUE.rules + .3).a * o, 2);
      [[0, 'no bean', 'gone'], [1, '1 bean', 'stays'], [2, '2 beans', 'one more']].forEach(([k, a, b], j) => {
        const fj = fadeIn(t, CUE.rules + .5 + j * .55), y = 388 + j * 52 + fj.dy, al = fj.a * o; if (al <= 0) return;
        beanDots(X + 11, y, k, al); text(a, X + 60, y, '500 27px Inter', .85 * al); text('→  ' + b, X + 200, y, '500 27px Inter', .6 * al);
      });
      const fr = fadeIn(t, 7.4); text('Running costs energy:', X, 580 + fr.dy, '500 24px Inter', .8 * fr.a * o); text('speed² every second', X, 614 + fr.dy, '500 24px Inter', .55 * fr.a * o);
      const fl = fadeIn(t, 7.9); if (fl.a > 0) { const gw = 360; const grd = g.createLinearGradient(X, 0, X + gw, 0); for (let i = 0; i <= 26; i++) grd.addColorStop(i / 26, '#' + geneColor(.6 + i * .05).getHexString(THREE.SRGBColorSpace)); g.globalAlpha = fl.a * o; g.fillStyle = grd; g.beginPath(); g.roundRect(X, 676 + fl.dy, gw, 12, 6); g.fill(); text('slow 0.6', X, 718 + fl.dy, '500 20px Inter', .7 * fl.a * o); text('1.9 fast', X + gw, 718 + fl.dy, '500 20px Inter', .7 * fl.a * o, 0, 'right'); text('COLOUR = SPEED', X, 660 + fl.dy, '600 15px Inter', .55 * fl.a * o, 2); }
    }
    // S3 tracking: a tag above the fast one and the slow one (speed + energy bar)
    if (t >= CUE.go && t < CUE.crane0 + .6) {
      const o = fadeOut(t, CUE.crane0, .5);
      applyCam(cam(t));
      tag(bolt, t, 'FAST', fadeIn(t, CUE.go + .25).a * o * (1 - .55 * ss(seg(t, CUE.pan0, CUE.pan1))));
      tag(moss, t, 'SLOW', fadeIn(t, CUE.pan0 + .4).a * o);
    }
    // S4 verdict: Day 1 + big head count + gone / born + children by parent speed
    if (t >= CUE.crane1 - .6 && t < CUE.top0 + .3) {
      const o = fadeOut(t, CUE.top0 - .1), f1 = fadeIn(t, CUE.crane1 - .6), f2 = fadeIn(t, CUE.crane1 - .45);
      text('DAY 1 · NIGHTFALL', 120, 118 + f1.dy, '600 15px Inter', .55 * f1.a * o, 2);
      const n = N - st.gone + st.born;
      g.font = '600 168px Fredoka'; const nw = g.measureText('199').width;
      text(String(n), 112, 300 + f2.dy, '600 168px Fredoka', f2.a * o);
      text('pips', 112 + nw + 18, 300 + f2.dy, '500 30px Inter', .7 * f2.a * o);
      const fv = fadeIn(t, CUE.verdict);
      if (fv.a > 0) { g.font = '600 30px Fredoka'; text(`−${st.gone} gone`, 118, 352 + fv.dy, '600 30px Fredoka', .55 * fv.a * o); const gw = g.measureText(`−${gones.length} gone`).width; text(`+${st.born} born`, 118 + gw + 34, 352 + fv.dy, '600 30px Fredoka', fv.a * o); }
      const ul = ss(seg(t, CUE.settle - .2, CUE.settle + .3)) * o; if (ul > 0) { g.globalAlpha = 1; g.fillStyle = PALETTE.mint; g.beginPath(); g.roundRect(118, 314 + f2.dy, (nw - 8) * ul, 7, 3.5); g.fill(); }
      // upper right: children by parent speed
      const fk = fadeIn(t, CUE.settle + .4);
      if (fk.a > 0) {
        text('CHILDREN, BY PARENT SPEED', W - 560, 118 + fk.dy, '600 15px Inter', .55 * fk.a * o, 2);
        const rows = [['slow', '< 0.9', kidsBySpeed.slow, PALETTE.team.cobalt], ['fast', '> 1.5', kidsBySpeed.fast, PALETTE.team.butter]];
        rows.forEach(([nm, rg, v, c], j) => { const y = 196 + j * 74 + fk.dy, al = fk.a * o; g.globalAlpha = al; g.fillStyle = c; g.beginPath(); g.arc(W - 548, y - 16, 12, 0, Math.PI * 2); g.fill(); text(nm, W - 522, y - 4, '500 28px Inter', .85 * al); text(rg, W - 440, y - 4, '500 22px Inter', .5 * al); text(String(v), W - 120, y, '600 64px Fredoka', al, 0, 'right'); });
      }
    }
    // S5 20 generations: a light plate on the left column (board colour fading to the right) with the big generation number, head count and mean speed, and below a large mean-speed chart:
    // each generation's dot drops into place on the beat its wave passes, and the line grows to the right
    const inCU = t >= CUE.cu0 && t < CUE.cu1;
    if (t >= CUE.top0 + .3 && t < CUE.hist0 + .8 && !inCU) {
      const o = fadeOut(t, CUE.hist0 + .2, .5), f = fadeIn(t, CUE.top0 + .3), gn = genAt(t), mean = meanOf(gens[gn - 1].speeds);
      const bg = g.createLinearGradient(0, 0, 700, 0); bg.addColorStop(0, 'rgba(236,230,218,.92)'); bg.addColorStop(.62, 'rgba(236,230,218,.78)'); bg.addColorStop(1, 'rgba(236,230,218,0)');
      g.globalAlpha = f.a * o; g.fillStyle = bg; g.fillRect(0, 0, 700, H);
      text('GENERATION', 120, 118 + f.dy, '600 15px Inter', .55 * f.a * o, 2);
      text(String(gn), 112, 290 + f.dy, '600 168px Fredoka', f.a * o);
      g.font = '600 168px Fredoka'; const gw = g.measureText(String(gn)).width;
      text(`of ${GENS}`, 112 + gw + 16, 290 + f.dy, '500 30px Inter', .6 * f.a * o);
      text(`${gens[gn - 1].n} pips  ·  mean speed ${mean.toFixed(2)}`, 120, 344 + f.dy, '500 28px Inter', .8 * f.a * o);
      const X0 = 190, Y0 = 790, CW = 440, CH = 330, yv = v => Y0 - (v - .65) / (1.3 - .65) * CH;
      text('MEAN SPEED, EACH MORNING', 120, 420 + f.dy, '600 15px Inter', .55 * f.a * o, 2);
      g.globalAlpha = .25 * f.a * o; g.fillStyle = PALETTE.ink; g.fillRect(X0 - 10, Y0 + 18, CW + 20, 2);
      for (const v of [1.25, 1.0, .75]) { g.globalAlpha = .1 * f.a * o; g.fillRect(X0 - 10, yv(v), CW + 20, 1.5); text(v.toFixed(2), X0 - 22, yv(v) + 7, '500 20px Inter', .55 * f.a * o, 0, 'right'); }
      let px = null, py = null;
      for (let k = 1; k <= gn; k++) {
        const v = meanOf(gens[k - 1].speeds), x = X0 + (k - 1) / (GENS - 1) * CW, tk = k <= 2 ? CUE.top0 : TR[k - 2].t + TR[k - 2].d * .5, du = seg(t, tk, tk + .22), y = yv(v) - (1 - backOut(du, 2.2)) * 40;
        if (px !== null) { g.globalAlpha = .4 * f.a * o; g.strokeStyle = PALETTE.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, py); g.lineTo(L(px, x, du), L(py, y, du)); g.stroke(); }
        g.globalAlpha = f.a * o * ss(du); g.fillStyle = '#' + geneColor(v).getHexString(THREE.SRGBColorSpace); g.beginPath(); g.arc(x, y, k === gn ? 13 : 8, 0, Math.PI * 2); g.fill(); px = x; py = yv(v);
      }
    }
    // close-up tag: this fast Pip, and how many fast ones this generation has left
    if (inCU && CU) {
      applyCam(cam(t)); const a = fadeIn(t, CUE.cu0 + .25).a * fadeOut(t, CUE.cu1 - .25, .2);
      const [bx0, by0] = project(CU.b.x, 0, CU.b.z), [hx, hy] = project(CU.b.x, .58, CU.b.z), hp = Math.hypot(hx - bx0, hy - by0), sx = hx + hp * .62, sy = hy + hp * .1;
      g.globalAlpha = .86 * a; g.fillStyle = PALETTE.board; g.beginPath(); g.roundRect(sx - 22, sy - 84, 330, 132, 18); g.fill();
      text(CU.b.s.toFixed(2), sx - 4, sy - 34, '600 46px Fredoka', a); text('FAST', sx + 98, sy - 36, '600 15px Inter', .55 * a, 2);
      text(`one of ${CU.fastLeft} fast pips left`, sx - 2, sy + 2, '500 24px Inter', .85 * a);
      text(`generation 1 had ${CU.fast0}`, sx - 2, sy + 34, '500 22px Inter', .6 * a);
    }
    // S6 histogram: the conclusion upper right; counts on the bars, bin labels, the two means
    if (t >= CUE.hist0 + .6) {
      const f = fadeIn(t, CUE.hist1 - .2), f2 = fadeIn(t, CUE.walk1 - .6);
      const RX = W - 120;
      text(`AFTER ${GENS} GENERATIONS · ONE PIP = ONE INDIVIDUAL`, RX, 118 + f.dy, '600 15px Inter', .55 * f.a, 2, 'right');
      text('mean speed', RX, 172 + f.dy, '500 26px Inter', .7 * f.a, 0, 'right');
      g.font = '600 120px Fredoka'; const wF = g.measureText(MEANF.toFixed(2)).width;
      text(MEANF.toFixed(2), RX, 296 + f2.dy, '600 120px Fredoka', f2.a, 0, 'right');
      text('→', RX - wF - 26, 282 + f2.dy, '500 64px Inter', .5 * f2.a, 0, 'right');
      text(MEAN0.toFixed(2), RX - wF - 112, 296 + f.dy, '600 120px Fredoka', .3 * f.a, 0, 'right');
      if (f2.a > 0) { g.globalAlpha = f2.a; g.fillStyle = PALETTE.mint; g.beginPath(); g.roundRect(RX - wF + 4, 312, (wF - 8) * ss(seg(t, CUE.walk1 - .3, CUE.walk1 + .3)), 7, 3.5); g.fill(); }
      text('跑完 20 代，平均速度变慢了', RX, 370 + f2.dy, '500 36px "Noto Sans SC"', .8 * f2.a, 0, 'right');
      applyCam(cam(t));
      const fl = fadeIn(t, CUE.hist1 - .3);
      for (let k = 0; k < NB; k++) {
        const [x, y] = project(bx(k), 0, Z0 + .9); text(k === 0 ? '≤0.5' : k === NB - 1 ? '≥1.7' : (BIN0 + k * BW).toFixed(1), x, y + 10, '600 22px Inter', .8 * fl.a, 0, 'center');
        const n = bins[k].length, rows = Math.ceil(n / PER), arrived = t >= CUE.walk1 - .2;
        if (rows && arrived) { const [tx, ty] = project(bx(k), .75, Z0 - .5 - (rows - 1) * PITCH - .3); text(String(n), tx, ty - 6, '600 28px Fredoka', .9 * ss(seg(t, CUE.walk1 - .2, CUE.walk1 + .3)), 0, 'center'); }
      }
      { const [x, y] = project(bx(0) - STEP / 2, 0, Z0 + .9); text('SPEED', x - 6, y + 46, '600 14px Inter', .5 * fl.a, 2); }
      { const fg = fadeIn(t, CUE.hist1); const k1 = gen1Bins.indexOf(Math.max(...gen1Bins)); const [x, y] = project(bx(k1) + BARW / 2 + .2, 0, Z0 - .5 - (Math.ceil(gen1Bins[k1] / PER) - 1) * PITCH - .5); text('- - generation 1', x + 8, y, '500 20px Inter', .65 * fg.a); }
      // end line, lower right (gives way at 48.4–48.8 to the end card printed on the board)
      const fe = fadeIn(t, CUE.endTitle + .2, .6), feo = fadeOut(t, CUE.card0 - .5, .4); fe.a *= feo;
      text('Rules in, results out.', W - 120, H - 132 + fe.dy, '600 56px Fredoka', fe.a, 0, 'right');
      text('规则写进去，结果跑出来。', W - 120, H - 80 + fe.dy, '500 36px "Noto Sans SC"', .8 * fe.a, 0, 'right');
    }
    { const keep = REC; REC = null; subtitle(t); REC = keep; }   // subtitles are checked through the .srt, not here
    g.globalAlpha = 1;
  }

  function render(t) {
    const c = cam(t); applyCam(c);
    post.dof.maxCoc = 9; post.dof.aper = c.aper; post.dof.focus = c.dist;
    const high = clamp((c.dist - 3) / 14, 0, 1);
    scene.fog.near = L(5, 26, high); scene.fog.far = L(22, 70, high);
    crowd.reset(); fluff.count = 0;
    rampDecal.visible = false;
    const histA = ss(seg(t, CUE.hist0 + .4, CUE.hist1)); histDecal.visible = histA > 0; histDecal.material.opacity = histA;
    { const u = ss(seg(t, CUE.card0, CUE.card1)); creditDecal.visible = u > 0; creditDecal.material.opacity = u; }
    const st = t < CUE.top0 + .5 ? stageDay(t) : stageGens(t);
    waveAt(t);
    crowd.done(); fluff.instanceMatrix.needsUpdate = true; if (fluff.instanceColor) fluff.instanceColor.needsUpdate = true;
    post.composer.render();
    overlay(t, st);
  }
  window.TEXTS = t => {
    REC = []; render(t); const out = REC; REC = null;
    if (t >= CUE.card1) out.push({ id: 'endcard', text: 'Is faster better? 跑得快，就更好吗？ BLOB SIMULATION · 小人模拟实验 LemoLab × Claude Opus 5.5', x0: 1180, y0: 812, x1: 1800, y1: 1036 });
    return out;
  };
  return { render, dur: DUR };
}
