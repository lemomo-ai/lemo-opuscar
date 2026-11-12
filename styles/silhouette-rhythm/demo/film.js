// 慢半拍 Half a Beat — the whole film on one timeline. window.render(t), t in film seconds (0 .. 49).
// Silhouettes are drawn into three 2D layers (F = silhouettes, R = their reflections, X = water light: rings, droplets),
// then one fragment shader (sky.js) composites them over the sunset. Everything depends on t only.
(function () {
const W = innerWidth, H = innerHeight, K = H / 1080;
const DUR = 49.0, B = .5, PI = Math.PI, TAU = PI * 2;
window.DUR = DUR;
const G = document.getElementById('g'); G.width = W; G.height = H;
const O = document.getElementById('o'); O.width = W; O.height = H;
const octx = O.getContext('2d');
function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
const LF = layer(), LR = layer(), LX = layer();
const fctx = LF.getContext('2d'), rctx = LR.getContext('2d'), xctx = LX.getContext('2d');
const draw = SKY.make(G);
const SM = document.createElement('canvas');
const { hash, lerp } = SHAPES;

// ------------------------------------------------------------------ easing
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => 1 - Math.pow(1 - cl(x), 3);
const ein = x => Math.pow(cl(x), 3);
const lin = x => cl(x);
const eback = x => { x = cl(x); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const env = (t, a, b) => cl((t - a) / (b - a));
function seg(t, keys) { // [[t, v, ease?], ...]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va, e] = keys[i], [b, vb] = keys[i + 1];
    if (t <= b) return lerp(va, vb, (e || eio)((t - a) / (b - a)));
  }
  return keys[keys.length - 1][1];
}
function rng(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function beats(a, b, step) { const o = []; for (let t = a; t < b - 1e-6; t += (step || B)) o.push(+t.toFixed(4)); return o; }

// ------------------------------------------------------------------ camera
// cam: f (focal, in frame heights), hor (horizon, fraction of H), ch (camera height, m), cx (camera x), cz (camera z), yaw
function project(cam, x, y, z) {
  const zz = Math.max(.05, z - (cam.cz || 0)), fpx = cam.f * H;
  return [W / 2 + ((x - cam.cx) / zz - cam.yaw) * fpx, cam.hor * H + ((cam.ch - y) / zz) * fpx, fpx / zz];
}
function place(ctx, cam, x, y, z, s, face, refl, rot) {
  const p = project(cam, x, refl ? -y : y, z), sc = p[2] * s;
  const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), ys = refl ? sc : -sc;
  ctx.setTransform(sc * face * c, ys * sn, -sc * face * sn, ys * c, p[0], p[1]);
}
// draw a shape (local metres, y up) at world x,y,z into the silhouette layer and, mirrored, into the reflection layer
function both(cam, x, y, z, s, face, fn, rot, noRefl) {
  const wl = project(cam, x, 0, z)[1];
  for (const [ctx, refl] of [[fctx, false], [rctx, true]]) {
    if (refl && noRefl) continue;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
    if (refl) ctx.rect(-10, wl, W + 20, H - wl + 20); else ctx.rect(-10, -10, W + 20, wl + 10);
    ctx.clip(); ctx.beginPath();
    place(ctx, cam, x, y, z, s, face, refl, rot); fn(ctx); ctx.restore();
  }
}

// ------------------------------------------------------------------ standing / walking flamingo (shapes.flamingo)
const POSE = {
  up:     { neck: [.03, .24, .09, .44, .05, .60], hp: -.30, bt: .10, hipY: .80 },
  upB:    { neck: [.08, .22, .15, .40, .11, .55], hp: -.18, bt: .12, hipY: .80 },
  S:      { neck: [.20, .14, -.12, .24, .11, .42], hp: -.42, bt: .05, hipY: .78 },
  walk:   { neck: [.13, .18, .03, .36, .15, .48], hp: -.45, bt: .04, hipY: .79 },
  look:   { neck: [.14, .20, .26, .30, .32, .26], hp: -.70, bt: .04, hipY: .79 },
  peer:   { neck: [.12, .22, .02, .42, .17, .50], hp: -1.0, bt: .08, hipY: .80 },
  lookUp: { neck: [.00, .25, .02, .47, .02, .64], hp: .20, bt: .16, hipY: .82 },
  lookFar:{ neck: [.10, .22, .20, .40, .24, .50], hp: -.15, bt: .08, hipY: .80 },
  down:   { neck: [.22, .04, .34, -.12, .30, -.30], hp: -1.3, bt: -.12, hipY: .74 },
  crouch: { neck: [.16, .12, .22, .22, .34, .30], hp: -.35, bt: -.02, hipY: .66 },
  sit:    { neck: [.18, .06, .30, -.04, .32, -.20], hp: -1.1, bt: -.05, hipY: .14 },
  sitUp:  { neck: [.04, .22, .12, .36, .12, .48], hp: -.30, bt: .02, hipY: .14 },
  sitLook:{ neck: [.12, .18, .24, .22, .30, .16], hp: -.85, bt: .0, hipY: .14 },
  sitFar: { neck: [.06, .22, .16, .38, .20, .46], hp: -.12, bt: .03, hipY: .14 },
};
const PK = ['hp', 'bt', 'hipY'];
function mixPose(a, b, u) {
  const o = { neck: a.neck.map((v, i) => lerp(v, b.neck[i], u)) };
  for (const k of PK) o[k] = lerp(a[k], b[k], u);
  return o;
}
function poseAt(sched, t) { // [[t, name, dur?], ...], snappy ease-out-back into each pose
  let cur = POSE[sched[0][1]];
  for (let i = 1; i < sched.length; i++) {
    const [tk, name, d] = sched[i];
    if (t < tk) break;
    const u = (t - tk) / (d || .13);
    cur = u >= 1 ? POSE[name] : mixPose(cur, POSE[name], eback(u));
  }
  return cur;
}
function yawAt(sched, t, d) {
  let y = sched[0][1];
  for (let i = 1; i < sched.length; i++) {
    const [tk, v] = sched[i];
    if (t < tk) break;
    y = lerp(y, v, eout((t - tk) / (d || .11)));
  }
  return y;
}
const STANCE = [{ foot: [-.1, -.06], swing: 0 }, { foot: [.12, -.06], swing: 0 }];
const DEEP = [{ foot: [-.06, -.7], swing: 0 }, { foot: [.1, -.7], swing: 0 }];   // sitting: legs folded under the water
function juvP(P) { // the young bird: shorter neck, a little lower
  return Object.assign({}, P, { juv: 1, neck: P.neck.map(v => v * .84), hipY: P.hipY > .3 ? P.hipY * .97 : P.hipY });
}
function stand(cam, x, z, s, face, P, seed, extra) {
  const Q = Object.assign({ yaw: 0, legs: STANCE }, P, extra || {});
  both(cam, x, 0, z, s, face, ctx => SHAPES.flamingo(ctx, Q, seed));
}
function fly(cam, x, y, z, s, face, P, seed, rot, noRefl) { both(cam, x, y, z, s, face, ctx => SHAPES.flyer(ctx, P, seed), rot, noRefl); }

// walking gait (feet planted in the world)
const SW = .24;
function gait(b, ts, steps, dirAt, stride, lift, sw) {
  sw = sw || SW;
  let x = b.x0, feet = [b.x0 - .12, b.x0 + .12], k = 0;
  for (const tk0 of steps) {
    const tk = tk0 + (b.off || 0);
    if (tk > ts) break;
    const d = dirAt(tk);
    const nx = x + d * stride;
    let sl;
    if (d > 0) sl = feet[0] < feet[1] ? 0 : 1; else if (d < 0) sl = feet[0] > feet[1] ? 0 : 1; else sl = k % 2;
    const tgt = d ? nx + d * stride / 2 : nx + (sl ? .12 : -.12);
    const u = (ts - tk) / sw;
    k++;
    if (u >= 1) { x = nx; feet[sl] = tgt; continue; }
    const e = eio(u);
    const f2 = feet.slice(); f2[sl] = lerp(feet[sl], tgt, e);
    return { x: lerp(x, nx, e), feet: f2, sl, u, lift: lift * Math.pow(Math.sin(PI * u), .7) };
  }
  return { x, feet, sl: -1, u: 0, lift: 0 };
}
function stepEvents(b, steps, dirAt, stride, t1, sw) {
  sw = sw || SW;
  const ev = []; let x = b.x0, feet = [b.x0 - .12, b.x0 + .12], k = 0;
  for (const tk0 of steps) {
    const tk = tk0 + (b.off || 0); if (tk > t1) break;
    const d = dirAt(tk), nx = x + d * stride;
    let sl; if (d > 0) sl = feet[0] < feet[1] ? 0 : 1; else if (d < 0) sl = feet[0] > feet[1] ? 0 : 1; else sl = k % 2;
    const tgt = d ? nx + d * stride / 2 : nx + (sl ? .12 : -.12);
    ev.push({ t: tk + sw * .92, x: tgt, tl: tk + .03, xl: feet[sl], k }); x = nx; feet[sl] = tgt; k++;
  }
  return ev;
}
function walkBird(cam, b, g, pose, yaw, face, s, juv) {
  const sgn = face >= 0 ? 1 : -1;
  const P = Object.assign({}, juv ? juvP(pose) : pose, { yaw });
  P.hipY = P.hipY + (g.lift ? g.lift * .12 : 0) + (b.hop || 0);
  P.legs = [0, 1].map(i => {
    const fx = (g.feet[i] - g.x) * sgn / s;
    const sw = i === g.sl ? Math.sin(PI * g.u) : 0;
    return { foot: [fx, i === g.sl ? g.lift / s : -.06], swing: sw };
  });
  stand(cam, g.x, b.z, s, face, P, b.seed);
}

// ------------------------------------------------------------------ running + take-off (shapes.flyer with planted feet)
function vAt(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) if (t <= keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])); return keys[keys.length - 1][1]; }
function integrate(keys, t0, t1, x0) {
  const dt = .004, n = Math.ceil((t1 - t0) / dt) + 2, xs = new Float64Array(n);
  let x = x0; for (let i = 0; i < n; i++) { xs[i] = x; x += vAt(keys, t0 + i * dt) * dt; }
  return t => { if (t <= t0) return x0; const f = (t - t0) / dt, i = Math.min(n - 2, Math.floor(f)); return lerp(xs[i], xs[i + 1], Math.min(1, f - i)); };
}
// R: { x0, z, s (scale), juv, v: speed keys, t0, t1, steps: swing start times, sw, reach, lift (foot lift), hip (world hip height),
//      tLift (feet leave), climb: [[t, y], ...] extra height keys, seed }
function makeRunner(R) {
  R.X = integrate(R.v, R.t0, R.t1, R.x0);
  R.legLen = (R.juv ? .74 : .86) * R.s;
  const L = []; const pos = [R.x0 - .1 * R.s, R.x0 + .14 * R.s];
  R.steps.forEach((ts, k) => {
    const side = k % 2, tl = ts + R.sw;
    const to = R.X(tl) + R.reach * R.s + (R.jit ? (hash(k * 7 + R.seed) - .5) * R.jit : 0);
    L.push({ ts, tl, side, from: pos[side], to, k }); pos[side] = to;
  });
  R.land = L;
  return R;
}
function runnerState(R, t) {
  const x = R.X(t);
  const climb = R.climb ? seg(t, R.climb) : 0;
  const y = R.hip + .05 * R.s + climb;
  const f = [{ x: R.x0 - .1 * R.s, y: 0, sw: 0 }, { x: R.x0 + .14 * R.s, y: 0, sw: 0 }];
  for (const st of R.land) {
    if (t < st.ts) break;
    const u = (t - st.ts) / R.sw;
    if (u >= 1) f[st.side] = { x: st.to, y: 0, sw: 0 };
    else f[st.side] = { x: lerp(st.from, st.to, eio(u)), y: R.lift * R.s * Math.pow(Math.sin(PI * u), .7), sw: Math.sin(PI * u) };
  }
  const off = R.tLift == null ? 0 : ss((t - R.tLift) / .4);   // 0 = feet on the water, 1 = legs trailing
  return { x, y, f, off };
}
function runnerFeetLocal(R, st, P, face) {
  const k = R.juv ? .86 : 1, bt = P.bt || 0, hipL = [-.10 * k * Math.cos(bt) + .05 * Math.sin(bt), -.10 * k * Math.sin(bt) - .05 * Math.cos(bt)];
  const ll = R.juv ? .74 : .86, trailA = PI + .1 + bt;
  return st.f.map((f, i) => {
    let lx = (f.x - st.x) * face / R.s, ly = (f.y - .03 - st.y) / R.s;
    const tx = hipL[0] + Math.cos(trailA + (i ? .05 : -.04)) * ll * .98, ty = hipL[1] + Math.sin(trailA + (i ? .05 : -.04)) * ll * .98;
    // once airborne the feet are pulled in behind the body
    if (st.off > 0) { const dx = lx - hipL[0], dy = ly - hipL[1], d = Math.hypot(dx, dy); if (d > ll * .99) { lx = hipL[0] + dx / d * ll * .99; ly = hipL[1] + dy / d * ll * .99; } }
    return [lerp(lx, tx, st.off), lerp(ly, ty, st.off), st.off > .3 ? 1 : f.sw];
  });
}
function flapPhi(t, period, offset, mid, amp) { return mid + amp * Math.cos(TAU * (t - offset) / period); }
function drawRunner(cam, R, t, P, face, noRefl) {
  const st = runnerState(R, t);
  P = Object.assign({ juv: R.juv }, P);
  P.feet = runnerFeetLocal(R, st, P, face);
  fly(cam, st.x, st.y, R.z, R.s, face, P, R.seed, 0, noRefl);
  return st;
}

// ------------------------------------------------------------------ water light: rings, droplets, crowns
function ring(cam, x, z, r, al, lw) {
  if (al <= .003 || r <= 0) return;
  const p = project(cam, x, 0, z), rx = r * p[2], ry = Math.max(.5, rx * cam.ch / Math.max(.05, z - (cam.cz || 0)));
  if (p[0] + rx < -50 || p[0] - rx > W + 50 || p[1] - ry > H + 20 || p[1] + ry < cam.hor * H - 4) return;
  xctx.globalAlpha = cl(al); xctx.lineWidth = Math.max(1, lw * K);
  xctx.beginPath(); xctx.ellipse(p[0], p[1], rx, ry, 0, 0, TAU); xctx.stroke(); xctx.globalAlpha = 1;
  const g = Math.max(1.2, lw * 1.1 * K), d = Math.min(rx * .2, g * 1.3);
  rctx.save(); rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.globalAlpha = cl(al * .55); rctx.lineWidth = g; rctx.strokeStyle = '#000';
  rctx.beginPath(); rctx.ellipse(p[0], p[1] + d * .25, Math.max(.5, rx - d), Math.max(.4, ry - d * ry / Math.max(rx, 1)), 0, 0, TAU); rctx.stroke(); rctx.restore();
}
function ripple(cam, x, z, age, big) { // a fresh splash ring set, gone in ~1.8 s
  if (age < 0 || age > 1.8) return;
  for (let j = 0; j < (big ? 3 : 2); j++) {
    const a = age - j * .16; if (a <= 0) continue;
    const r = .04 + (big ? .55 : .38) * Math.pow(a, .6);
    ring(cam, x, z, r, Math.pow(1 - a / 1.8, 2) * (big ? .9 : .7) * (j ? .6 : 1), 2.2 * Math.min(1.6, 9 / Math.max(1, z - (cam.cz || 0))));
  }
}
function droplets(cam, x, z, age, seed, n, big, y0) {
  if (age < 0 || age > 1.0) return;
  for (let i = 0; i < n; i++) {
    const vx = (hash(seed * 31 + i) - .5) * (big ? 2.4 : 1.6), vy = 1.1 + hash(seed * 17 + i * 3) * (big ? 2.2 : 1.4), vz = (hash(seed * 7 + i) - .5) * .4;
    const y = (y0 || 0) + vy * age - 4.9 * age * age; if (y < 0) continue;
    const zz = z + vz * age, p = project(cam, x + vx * age, y, zz);
    const r = Math.max(.8 * K, (.006 + hash(i + seed) * .008) * p[2]);
    xctx.globalAlpha = .95; xctx.beginPath(); xctx.arc(p[0], p[1], r, 0, TAU); xctx.fill();
  }
  xctx.globalAlpha = 1;
}
function fallDrops(cam, x, y0, z, n, seed, spread, age) { // a string of drops falling from a point (toes, bill)
  for (let i = 0; i < n; i++) {
    const a = age * (.4 + hash(seed + i) * .8);
    const dx = (hash(seed * 3 + i) - .5) * spread, dz = (hash(seed * 7 + i) - .5) * spread * .6;
    const y = y0 - 4.9 * a * a - hash(i * 5 + seed) * .25; if (y < 0) continue;
    const p = project(cam, x + dx + (hash(i * 11 + seed) - .5) * .2 * spread, y, z + dz);
    const r = Math.max(.9 * K, (.007 + hash(i + seed) * .01) * p[2]);
    xctx.globalAlpha = .9; xctx.beginPath(); xctx.arc(p[0], p[1], r * .8, 0, TAU); xctx.fill();
    if (hash(i * 13 + seed) > .6) { xctx.globalAlpha = .35; xctx.fillRect(p[0] - r * .35, p[1] - r * 4, r * .7, r * 4); }
  }
  xctx.globalAlpha = 1;
}
function crown(cam, x, z, s, h0, seed) { // a ring of droplets thrown up from the water, frozen mid-air
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * TAU, r = (.10 + hash(i * 3 + seed) * .12) * s, h = (h0 || 0) + (.06 + hash(i * 7 + seed) * .24) * s * (.6 + .4 * Math.abs(Math.sin(a)));
    const p = project(cam, x + Math.cos(a) * r, h, z + Math.sin(a) * r * .8);
    const rr = Math.max(1 * K, (.006 + hash(i + seed) * .007) * p[2]);
    xctx.globalAlpha = .95; xctx.beginPath(); xctx.arc(p[0], p[1], rr, 0, TAU); xctx.fill();
  }
  xctx.globalAlpha = 1;
}
// lingering runway rings: they grow to a set size and fade slowly, so the flock's steps stay written on the water
function runwayRing(cam, x, z, age, glow, scale) {
  if (age < 0) return;
  const s = scale || 1;
  const r = (.06 + .5 * (1 - Math.exp(-age / .7))) * s;
  const al = (.5 * Math.exp(-age / 1.6) + .3 * Math.exp(-age / 40)) + glow * .9;
  const lw = (1.6 + glow * 2.2) * Math.min(1.8, 6 / Math.max(1.2, z - (cam.cz || 0))) + .6;
  ring(cam, x, z, r, al, lw);
  if (age < 1.6 || glow > .05) ring(cam, x, z, r * .58, al * .55, lw * .7);
}

// ------------------------------------------------------------------ the sky clock (story time = colour + sun height)
const skyPh = t => seg(t, [[0, 0], [10, .18], [18, .34], [22.5, .44], [29, .52], [36, .62, lin], [36.1, .74, eout], [39, .8], [44, .94], [49, 1]]);
const sunK = t => seg(t, [[0, 1.05], [10, .55], [18, .22], [24, .02], [32, -.18], [36, -.28, lin], [39, -.42], [44, -.66], [49, -.8]]);
function sunAt(t, u, R) { return { sun: [u, sunK(t) * R], sunR: R }; }
const MUSIC = [[0, 21.5], [28, 35.5], [39, 46.2]];
function pulseAt(t) { for (const [a, b] of MUSIC) if (t >= a && t < b) { const bt = ((t % B) + B) % B; return Math.exp(-bt / .12); } return 0; }

// ------------------------------------------------------------------ cast and timelines
const EV = window.EV = [];
const ev = (t, type, o) => EV.push(Object.assign({ t: +t.toFixed(4), type }, o || {}));

// ---------- shot 1 (0–4): five heads on the beat; a small head jumps up late between them
const S1A = [[-.72, 6.25, 3], [-.37, 6.05, 4], [-.02, 6.3, 5], [.38, 6.1, 6], [.73, 6.2, 7]];
const S1Y = { x: .19, z: 5.9, seed: 9 };
// adults: a flag every two beats (0, 1, 2, 3), a small bob on the beats between; 3.5 all look down at the young one
const S1A_POSE = [[-1, 'up'], [-.07, 'upB'], [.43, 'up', .2], [.93, 'upB'], [1.43, 'up', .2], [1.93, 'upB'], [2.43, 'up', .2], [2.93, 'upB'], [3.40, 'peer', .2]];
const S1A_YAW = x => [[-1, PI], [-.07, 0], [.93, PI], [1.93, 0], [2.93, PI], [3.40, x < S1Y.x ? PI : 0]];
// the young one is too short to be seen: it jumps. Each jump peaks on its (late) flag: 1.5 = a whole beat late, 2.25 and 3.25 = half a beat
const S1Y_HOPS = [[1.36, .42, .34], [2.11, .40, .3], [3.11, .42, .42], [3.62, .26, .3]];   // [start, height, hang time]
const S1Y_POSE = [[-1, 'up'], [1.43, 'upB'], [2.18, 'up'], [3.18, 'upB'], [3.30, 'S', .1], [3.66, 'up', .14]];
const S1Y_YAW = [[-1, 0], [1.43, PI], [2.18, 0], [3.18, PI], [3.31, .4], [3.68, 0]];
const s1hop = t => S1Y_HOPS.reduce((a, [t0, h, d]) => a + (t < t0 ? 0 : t < t0 + .12 ? h * eout((t - t0) / .12) : t < t0 + .12 + d ? h * (1 - .08 * env(t, t0 + .12, t0 + .12 + d)) : h * .92 * (1 - ein((t - t0 - .12 - d) / .16))), 0);
for (const tt of [0, 1, 2, 3]) ev(tt, 'flagA');
for (const tt of [.5, 1.5, 2.5]) ev(tt, 'bobA');
for (const [t0] of S1Y_HOPS) ev(t0, 'hop');
ev(1.5, 'flagY'); ev(2.25, 'flagY'); ev(3.25, 'flagY'); ev(3.3, 'bonk'); ev(3.5, 'stare'); ev(3.75, 'flagY', { soft: 1 });

// ---------- shot 2 (4–10): the march; the young one at the back, double steps; 8.0 the flock turns, it doesn't
const FLOCK2 = []; { const r = rng(77); const zs = [5.55, 6.2, 6.8, 7.4, 8.0, 8.6, 9.3, 10.0, 10.8, 11.6];
  zs.forEach((z, i) => FLOCK2.push({ x0: (i === 0 ? -1.42 : -1.3 + ((i * .37) % 1) * 3.0 + (r() - .5) * .45 + (z - 6) * .15), z, off: (r() - .5) * .04, sc: .94 + r() * .12, seed: 10 + i })); }
const YNG2 = { x0: -2.32, z: 5.3, off: 0, seed: 31 };
const S2_STEPS = beats(4.0, 10.0);
const s2dir = t => t < 7.99 ? 1 : -1;
const S2_POSE = [[-1, 'up'], [3.93, 'upB'], [4.43, 'up'], [4.93, 'upB'], [5.43, 'up'], [5.93, 'upB'], [6.43, 'up'], [6.93, 'upB'], [7.43, 'up'], [7.93, 'walk'], [9.0 - .07, 'S', .14], [9.5 - .07, 'upB', .12]];
const S2_YAW = [[-1, 0], [3.93, PI], [4.43, 0], [4.93, PI], [5.43, 0], [5.93, PI], [6.43, 0], [6.93, PI], [7.43, 0], [7.93, 0]];
function s2face(t) { const u = (t - 7.93) / .16; return u <= 0 ? 1 : u >= 1 ? -1 : Math.cos(PI * eio(u)); }
// young: steps every half beat (short legs), on until 8.24, bumps at 8.3, turns at 8.5, then hurries left
const Y2_STEPS = beats(4.0, 8.2, .25).concat(beats(8.75, 10.0, .25));
const y2dir = t => t < 8.24 ? 1 : t > 8.7 ? -1 : 0;
const Y2_POSE = [[-1, 'walk'], [4.18, 'upB'], [4.68, 'up'], [5.18, 'upB'], [5.68, 'up'], [6.18, 'upB'], [6.68, 'up'], [7.18, 'upB'], [7.68, 'up'], [8.28, 'S', .08], [8.62, 'walk', .14], [9.1, 'upB']];
const Y2_YAW = [[-1, 0], [4.18, PI], [4.68, 0], [5.18, PI], [5.68, 0], [6.18, PI], [6.68, 0], [7.18, PI], [7.68, 0]];
function y2face(t) { const u = (t - 8.48) / .16; return u <= 0 ? 1 : u >= 1 ? -1 : Math.cos(PI * eio(u)); }
const y2bump = t => -.24 * eout((t - 8.28) / .22) - .06 * Math.sin(PI * env(t, 8.28, 8.5));
const EVC = {};
function evFor(key, b, steps, dir, stride, t1, sw) { return EVC[key] || (EVC[key] = stepEvents(b, steps, dir, stride, t1, sw)); }
for (const b of FLOCK2) for (const e of evFor('2' + b.seed, b, S2_STEPS, s2dir, .3, 10)) if (e.t < 10) ev(e.t, 'splash', { z: b.z, v: .8 });
for (const e of evFor('y2', YNG2, Y2_STEPS, y2dir, .17, 10, .14)) if (e.t < 10) ev(e.t, 'splashY', { z: YNG2.z });
for (const tt of [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5]) ev(tt, 'flagA', { soft: 1 });
for (const tt of [4.75, 5.25, 5.75, 6.25, 6.75, 7.25, 7.75]) ev(tt, 'flagY', { soft: 1 });
ev(7.95, 'turn'); ev(8.3, 'bump'); ev(8.5, 'turnY'); ev(9.72, 'wipe');

// ---------- shot 3a (10–12): the line-up; 3b (12–14): the lead takes off; 3c (14–16.5): the rest, one every half beat; 3d (16.5–18): left behind
const LINE = []; for (let i = 0; i < 12; i++) LINE.push({ x: 3.05 - i * .5 + (hash(i + 3) - .5) * .06, z: 9.0 + (i % 3) * .35, seed: 50 + i, snap: 10.0 + Math.ceil(i / 3) * .5 - (i ? 0 : .5) });
const Y3 = { x: -3.05, z: 8.65, seed: 32 };
ev(10.0, 'lookUp');
for (const tt of [10.5, 11.0, 11.5]) ev(tt, 'snap');
for (const tt of [10.75, 11.25, 11.75]) ev(tt, 'flagY', { soft: 1 });

const LEAD = makeRunner({ x0: 0, z: 5.2, s: 1, juv: 0, t0: 11.84, t1: 15,
  v: [[11.84, 0], [12.1, .9], [13.3, 2.2], [13.6, 2.6], [15, 4.2]],
  steps: beats(11.84, 13.2, .25).concat(beats(13.21, 13.4, .125)), sw: .15, reach: .22, lift: .16, hip: .74,
  tLift: 13.42, climb: [[13.2, 0], [13.42, .04], [14.0, .55, x => Math.pow(x, 1.4)], [15, 1.6]], seed: 60 });
for (const l of LEAD.land) { ev(l.tl, 'splashRun', { z: LEAD.z, v: 1 }); }
for (const tt of [12.0, 12.5, 13.0, 13.5]) ev(tt, 'flapBig', { v: .5 + (tt - 12) * .3 });
ev(13.42, 'liftoff');

// 3c: the others run in a single file and leave the water one after another, every half beat, at x = 0
const TRAIN = [];
for (let i = 0; i < 8; i++) {
  const tl = 14.2 + i * .25, vR = 3.2;
  const R = makeRunner({ x0: -vR * (tl - 13.0), z: 9 + (i % 2) * .5, s: 1, juv: 0, t0: 13.0, t1: 17,
    v: [[13.0, vR], [tl, vR], [tl + .6, 4.2], [17, 5.4]],
    steps: beats(13.0 + (i % 4) * .03, tl - .05, .125), sw: .1, reach: .14, lift: .12, hip: .74,
    tLift: tl, climb: [[tl - .2, 0], [tl, .05], [tl + .9, 1.1, x => Math.pow(x, 1.3)], [17, 4.0]], seed: 70 + i });
  R.tl = tl; TRAIN.push(R);
  ev(tl, 'takeoff', { i, pan: -.3 + i * .09 });
}
for (const R of TRAIN) for (const l of R.land) if (l.tl > 14.0 && l.tl < 16.3) ev(l.tl, 'patter', { z: R.z });
ev(16.3, 'whip');
// 3d: the young one, eyes shut, still dancing to itself; it opens its eyes on an empty lake
const Y3D_POSE = [[-1, 'up'], [16.68, 'upB'], [17.18, 'up'], [17.42, 'lookFar', .1], [17.56, 'lookFar'], [17.72, 'crouch', .12]];
const Y3D_YAW = [[-1, 0], [16.68, PI], [17.18, 0], [17.42, 0], [17.55, PI], [17.68, 0]];
ev(16.75, 'flagY', { soft: 1 }); ev(17.25, 'flagY', { soft: 1 }); ev(17.45, 'look'); ev(17.58, 'look'); ev(17.75, 'gulp');

// ---------- shot 4 (18–22.5): the first run: feet and wings out of time; trips; freeze; splash
const Y4_STEPS = [17.86, 18.12, 18.40, 18.55, 18.90, 19.03, 19.30, 19.62, 19.78, 20.10, 20.27, 20.52, 20.81, 20.96];
const RUN1 = makeRunner({ x0: 0, z: 4.3, s: .8, juv: 1, t0: 17.86, t1: 23,
  v: [[17.86, 0], [18.2, .7], [19.6, 1.25], [21.2, 1.4], [21.3, 1.1]],
  steps: Y4_STEPS, sw: .15, reach: .2, lift: .2, hip: .5, jit: .06, seed: 33 });
const TRIP = 21.2, FZ1 = 21.5, FZ1E = 22.25, FZ1D = FZ1E - FZ1;
const ts4 = t => t < FZ1 ? t : t < FZ1E ? FZ1 : t - FZ1D;
for (const l of RUN1.land) if (l.tl < TRIP) ev(l.tl, 'splashY', { z: RUN1.z, run: 1 });
for (const tt of [18.3, 18.68, 19.21, 19.47, 19.94, 20.4, 20.69, 21.07]) ev(tt, 'flapSmall');
ev(TRIP, 'trip'); ev(FZ1, 'scratch'); ev(FZ1E + .13, 'plop');

// ---------- shot 6 (27–32): rings on the beat; 7 (32–36): count-in, then the run in time
for (const tt of [27.48, 27.7, 27.93]) ev(tt, 'drip');
ev(27.76, 'shake');
for (let i = 0; i < 8; i++) ev(28.0 + i * .5, 'ringBeat', { i });
for (const tt of [32.0, 32.5, 33.0, 33.5]) ev(tt, 'count');
const RUN2_LAND = beats(34.0, 35.8, .25);
const RUN2 = makeRunner({ x0: 0, z: 4.8, s: .8, juv: 1, t0: 33.85, t1: 40,
  v: [[33.85, 0], [34.1, .9], [35.4, 2.0], [35.9, 2.4], [40, 5]],
  steps: RUN2_LAND.map(t => t - .15), sw: .15, reach: .2, lift: .17, hip: .5,
  tLift: 35.86, climb: [[35.55, 0], [35.86, .06], [36.0, .16], [40, 4]], seed: 34 });
for (const l of RUN2.land) ev(l.tl, 'stepBeat', { k: l.k });
for (const tt of [34.0, 34.5, 35.0, 35.5]) ev(tt, 'flapBig', { v: .35 + (tt - 34) * .25, y: 1 });

// ---------- shot 8 (36–39): freeze; 9 (39–49): unfreeze, join the line, title
const FZ2 = 36.0, FZ2E = 39.0;
ev(FZ2, 'freeze'); ev(38.35, 'reverse'); ev(FZ2E, 'unfreeze');
for (let tt = 39.5; tt < 46.0; tt += .5) ev(tt, 'wingbeat', { v: tt < 42 ? .6 : .9 });
for (let tt = 39.0; tt < 40.6; tt += .25) ev(tt, 'wingbeatY', { near: 1 });
for (let tt = 41.0; tt < 42.3; tt += .25) ev(tt, 'wingbeatY');
const TITLE = { half: 42.5, a: 43.0, beat: 43.75, zh: 44.2, style: 44.6, credit: 45.0 };
ev(TITLE.half, 'word'); ev(TITLE.a, 'word'); ev(TITLE.beat, 'wordLate'); ev(TITLE.zh, 'wordZh'); ev(TITLE.style, 'line'); ev(TITLE.credit, 'line');
ev(46.0, 'end'); ev(46.25, 'flagY', { last: 1 });

// the flock in the sky for shot 8 (tail first, j = 0 .. 11); shot 9b has its own, lower line
const SKYF = []; for (let j = 0; j < 12; j++) SKYF.push({ x: 2.6 + j * 1.9 + Math.sin(j * 1.7) * .25, y: 4.4 + j * .16 + Math.sin(j * 2.3) * .12, z: 58 + j * 1.4, seed: 90 + j, ph: (hash(j) - .5) * .03 });
const LINE9 = []; for (let j = 0; j < 12; j++) LINE9.push({ x: j * 1.45 + Math.sin(j * 1.7) * .15, y: 1.15 + j * .03 + Math.sin(j * 2.3) * .06, z: 54 + j * .8, seed: 90 + j });
const FLY_V = 3.2;
const YF = { x: -.25, y: .66, z: 13 };

// ------------------------------------------------------------------ the shots
function clear() {
  for (const c of [fctx, rctx, xctx]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.strokeStyle = '#000'; c.filter = 'none'; }
  xctx.fillStyle = '#fff'; xctx.strokeStyle = '#fff';
}
function reeds(cam, t, n, zA, zB, seedBase, xs) {
  for (let i = 0; i < n; i++) {
    const x = xs(i), z = zA + hash(i + 3 + seedBase) * (zB - zA);
    const sway = Math.sin(t * 2.1 + i) * .3;
    for (const [ctx, refl] of [[fctx, false], [rctx, true]]) {
      ctx.save(); place(ctx, cam, x, 0, z, 1, 1, refl, 0);
      ctx.filter = `blur(${(5 * K).toFixed(1)}px)`;
      SHAPES.reeds(ctx, 5 + i + seedBase, sway, 9);
      ctx.restore();
    }
  }
}
function wiper(cam, t, ta, tb, xa, xb) { // a near flamingo walking across the lens: a black wipe
  if (t < ta || t > tb) return;
  const u = eio(env(t, ta, tb)), x = cam.cx + lerp(xa, xb, u), z = (cam.cz || 0) + .55;
  fctx.save(); place(fctx, cam, x, cam.ch - .92, z, 1.15, -1, false, 0); fctx.filter = `blur(${(9 * K).toFixed(1)}px)`;
  SHAPES.flamingo(fctx, Object.assign({ yaw: 0, legs: STANCE }, POSE.walk), 2); fctx.restore();
}

const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// ---- 1
shot(0, 4, t => {
  const f = lerp(7.2, 7.8, eio(t / 4)), fpx = f * H;
  const cam = { f, ch: .95, hor: (1078 * K + .11 / 6.2 * fpx) / H, cx: 0, cz: 0, yaw: 0 };
  // the young one first (behind the adults in the silhouette union it doesn't matter, it is one black shape)
  const P = juvP(poseAt(S1Y_POSE, t));
  P.hipY += s1hop(t);
  const bx = S1Y.x + (t > 3.25 && t < 3.6 ? .04 * Math.sin(PI * env(t, 3.25, 3.45)) : 0);
  stand(cam, bx, S1Y.z, .72, -1, P, S1Y.seed, { yaw: yawAt(S1Y_YAW, t), legs: [{ foot: [-.06, -.06 - s1hop(t) / .72], swing: 0 }, { foot: [.1, -.06 - s1hop(t) / .72], swing: 0 }] });
  const order = S1A.map((a, i) => ({ x: a[0], z: a[1], seed: a[2], i })).sort((a, b) => b.z - a.z);
  for (const a of order) {
    let Pa = Object.assign({}, poseAt(S1A_POSE, t));
    if (a.i === 3 && t > 3.3 && t < 3.6) Pa.hp += .3 * Math.sin(PI * env(t, 3.3, 3.5));   // startled by the bump
    stand(cam, a.x, a.z, 1, -1, Pa, a.seed, { yaw: yawAt(S1A_YAW(a.x), t) });
  }
  // the sun is still high: a big disc behind the necks
  const R = .037, cy = 600 * K, v = (cam.hor * H - cy) / fpx;
  return { cam, vs: 2.6, rays: 1, sun: [.012, v], sunR: R };
});
// ---- 2
shot(4, 10, t => {
  const cx = seg(t, [[4.0, -.9, x => x], [7.9, .55, eout], [8.25, .62, eio], [10.0, -.55]]);
  const cam = { f: lerp(1.85, 2.05, env(t, 4, 10)), ch: .30, hor: .60, cx, cz: 0, yaw: 0 };
  const order = FLOCK2.slice().sort((a, b) => b.z - a.z);
  for (const b of order) {
    const g = gait(b, t, S2_STEPS, s2dir, .3, .32);
    walkBird(cam, b, g, poseAt(S2_POSE.map(k => [k[0] + b.off, k[1], k[2]]), t), yawAt(S2_YAW.map(k => [k[0] + b.off, k[1]]), t), s2face(t - b.off), b.sc, 0);
    for (const e of evFor('2' + b.seed, b, S2_STEPS, s2dir, .3, 10)) { ripple(cam, e.x, b.z, t - e.t, false); droplets(cam, e.x, b.z, t - e.t, b.seed * 13 + e.k, 6, false); droplets(cam, e.xl, b.z, t - e.tl, b.seed * 29 + e.k, 3, false); }
  }
  // the young one (nearest, at the back): two steps per beat
  const g = gait(YNG2, t, Y2_STEPS, y2dir, .17, .2, .14);
  const bump = t > 8.28 ? y2bump(t) : 0;
  const gg = { x: g.x + bump, feet: g.feet.map(f => f + bump), sl: g.sl, u: g.u, lift: g.lift };
  const yb = Object.assign({}, YNG2, { hop: t > 8.28 && t < 8.55 ? .05 * Math.sin(PI * env(t, 8.28, 8.55)) : 0 });
  walkBird(cam, yb, gg, poseAt(Y2_POSE, t), yawAt(Y2_YAW, t), y2face(t), .72, 1);
  for (const e of evFor('y2', YNG2, Y2_STEPS, y2dir, .17, 10, .14)) { ripple(cam, e.x + (e.t > 8.28 ? y2bump(e.t) : 0), YNG2.z, t - e.t, false); droplets(cam, e.x, YNG2.z, t - e.t, 400 + e.k, 4, false); }
  reeds(cam, t, 7, 1.25, 1.75, 0, i => -3.6 + i * 1.4 + hash(i) * .6);
  wiper(cam, t, 9.72, 10.0, 1.2, .05);
  return Object.assign({ cam, vs: 1.4, rays: 1 }, sunAt(t, .03, .05));
});
// ---- 3a
shot(10, 12, t => {
  const cam = { f: lerp(1.9, 2.02, eio(env(t, 10, 12))), ch: .5, hor: .62, cx: 0, cz: 0, yaw: 0 };
  const order = LINE.map((b, i) => Object.assign({ i }, b)).sort((a, b) => b.z - a.z);
  for (const b of order) {
    const before = ['walk', 'S', 'down', 'upB'][b.i % 4];
    const sched = b.i === 0 ? [[-1, 'lookUp'], [11.0, 'up', .2]] : [[-1, before], [b.snap - .06, 'up', .14]];
    const face = b.i === 0 ? 1 : (t < b.snap - .06 ? (b.i % 3 === 1 ? -1 : 1) : 1);
    stand(cam, b.x, b.z, 1, face, poseAt(sched, t), b.seed, { yaw: 0 });
  }
  const P = juvP(poseAt([[-1, 'down'], [10.62, 'up', .2], [10.68, 'upB'], [11.18, 'up'], [11.68, 'upB']], t));
  stand(cam, Y3.x, Y3.z, .72, 1, P, Y3.seed, { yaw: yawAt([[-1, 0], [10.68, PI], [11.18, 0], [11.68, PI]], t, .18) });
  wiper(cam, t, 10.0, 10.28, .1, -1.3);
  return Object.assign({ cam, vs: 1.35, rays: 1 }, sunAt(t, .1, .05));
});
// ---- 3b
shot(12, 14, t => {
  const st0 = runnerState(LEAD, t);
  const p = ss(env(t, 12.0, 14.0));
  const cam = { f: 2.3, ch: lerp(.55, 1.15, ss(env(t, 13.2, 14))), hor: lerp(.60, .70, ss(env(t, 13.1, 14))), cx: st0.x + .54 - 1.3 * p, cz: 0, yaw: 0 };
  const prog = env(t, 12.0, 13.45);
  const P = { phi: flapPhi(t, .5, 12.0, lerp(-.15, .35, prog), lerp(.12, .95, prog)), sweep: lerp(1, .12, ss(env(t, 12.0, 12.45))),
    neckA: lerp(.62, .32, prog) - .22 * ss(env(t, 13.4, 14)), hp: -.28, bt: lerp(.2, .12, prog) };
  const st = drawRunner(cam, LEAD, t, P, 1);
  for (const l of LEAD.land) { ripple(cam, l.to, LEAD.z, t - l.tl, true); droplets(cam, l.to, LEAD.z, t - l.tl, 600 + l.k, 9, true); runwayRing(cam, l.to, LEAD.z, t - l.tl - .4, 0); }
  if (t > 13.42) fallDrops(cam, st.x - .4, st.y - .5, LEAD.z, 16, 7, .4, (t - 13.42) * .6);
  return Object.assign({ cam, vs: 1.5, rays: 1 }, sunAt(t, .14, .05));
});
// ---- 3c
shot(14, 16.5, t => {
  const whip = ein(env(t, 16.3, 16.5));
  const cam = { f: 1.5, ch: 1.0, hor: .56, cx: lerp(0, .9, ss(env(t, 14, 16.3))), cz: 0, yaw: -.6 * whip };
  // the lead, already up, leaving the top of the frame
  const lst = runnerState(LEAD, t);
  if (t < 15.2) fly(cam, lst.x - 1.5, lst.y + 2.2, 11, 1, 1, { phi: flapPhi(t, .5, 12, .3, .85), neckA: -.03, legA: PI + .05 }, LEAD.seed);
  for (let i = TRAIN.length - 1; i >= 0; i--) {
    const R = TRAIN[i];
    const prog = env(t, R.tl - 1.0, R.tl);
    const P = { phi: flapPhi(t, .5, 14.0, lerp(-.05, .32, prog), lerp(.3, .92, prog)), sweep: lerp(.6, .12, prog),
      neckA: lerp(.5, .08, ss(env(t, R.tl - .3, R.tl + .6))), hp: -.25, bt: lerp(.14, .04, ss(env(t, R.tl, R.tl + .8))) };
    drawRunner(cam, R, t, P, 1);
    for (const l of R.land) { if (t - l.tl > 4) continue; runwayRing(cam, l.to, R.z, t - l.tl, 0, .8); droplets(cam, l.to, R.z, t - l.tl, 700 + l.k + R.seed * 31, 4, false); }
  }
  return Object.assign({ cam, vs: 1.25, rays: 1, smear: whip }, sunAt(t, .12, .045));
});
// ---- 3d
shot(16.5, 18, t => {
  const land = 1 - eout(env(t, 16.5, 16.68));
  const cam = { f: 2.0, ch: .5, hor: .62, cx: 0, cz: 0, yaw: .1 * land * land };
  // what's left: the runway rings ahead, the flock already small in the sky
  for (let i = 0; i < 26; i++) runwayRing(cam, 1.2 + i * .55 + (i % 2 ? .05 : -.05), 7.5 + i * .55, 2.6 - i * .02, 0, .9);
  for (let j = 0; j < 12; j++) fly(cam, 30 + j * 2.4 + (t - 16.5) * 4, 16 + j * .5, 120 + j * 3, 1, 1, { phi: flapPhi(t, .5, j * .02, .3, .8), neckA: -.03, legA: PI + .05 }, 90 + j, 0, true);
  const P = juvP(poseAt(Y3D_POSE, t));
  stand(cam, -.95, 4.2, .72, 1, P, Y3.seed, { yaw: yawAt(Y3D_YAW, t, .08) });
  return Object.assign({ cam, vs: 1.4, rays: 1, smear: land * land }, sunAt(t, .15, .05));
});
// ---- 4
shot(18, 22.5, t => {
  const ts = ts4(t);
  const st0 = runnerState(RUN1, Math.min(ts, TRIP));
  const tumble = ss(env(ts, TRIP, FZ1)), fall = env(ts, FZ1, FZ1 + .2);
  const bx = st0.x + .55 * tumble + .2 * fall;
  const cam = { f: 2.1, ch: .45, hor: .60, cx: RUN1.X(Math.min(t, TRIP + .3)) + .35 + .05 * Math.sin(t * 9.1) * (t < TRIP ? 1 : 0), cz: 0, yaw: .003 * Math.sin(t * 13) * (t < FZ1 ? 1 : 0) };
  const flail = .55 * Math.sin(TAU * 3.1 * (ts - 18)) + .3 * Math.sin(TAU * 1.7 * ts + 1);
  if (ts < TRIP) {
    const P = { phi: -.05 + flail, sweep: .45 + .3 * Math.sin(ts * 7), neckA: .5 + .15 * Math.sin(ts * 11), hp: -.3, bt: .16 + .05 * Math.sin(ts * 9) };
    drawRunner(cam, RUN1, ts, P, 1);
  } else {
    // the trip: pitch forward over the planted foot, head first into the water
    const rot = -2.75 * tumble - .3 * fall;
    const y = lerp(st0.y, .44, tumble) - .36 * ein(fall);
    const P = { juv: 1, phi: lerp(-.05 + flail, 1.05, tumble), sweep: lerp(.45, .1, tumble), neckA: lerp(.5, .15, tumble), hp: -.2, bt: 0, legA: lerp(-1.9, -1.2, tumble), knee: .25 };
    fly(cam, bx, y, RUN1.z, RUN1.s, 1, P, RUN1.seed, rot);
    if (ts >= FZ1 - .06) crown(cam, bx + .42, RUN1.z, 1.1, 0, 12);
    ripple(cam, bx + .42, RUN1.z, ts - (FZ1 - .05), true);
    if (fall > 0) { ripple(cam, bx + .1, RUN1.z, ts - (FZ1 + .13), true); droplets(cam, bx + .1, RUN1.z, ts - (FZ1 + .13), 900, 16, true); }
  }
  for (const l of RUN1.land) if (l.tl < TRIP + .05) { ripple(cam, l.to, RUN1.z, ts - l.tl, false); droplets(cam, l.to, RUN1.z, ts - l.tl, 800 + l.k, 6, false); }
  return Object.assign({ cam, vs: 1.4, rays: 1, frozen: t >= FZ1 && t < FZ1E }, sunAt(t, .1, .05));
});
// ---- 5
shot(22.5, 27, t => {
  const u = eio(env(t, 22.5, 27));
  const cam = { f: lerp(1.25, 1.15, u), ch: lerp(2.4, 3.6, u), hor: lerp(.42, .40, u), cx: 0, cz: lerp(0, -4, u), yaw: 0 };
  const yx = -1.6, yz = 12;
  const age = t - (FZ1E + .13);
  for (let j = 0; j < 4; j++) { const a = age - j * .35; if (a > 0) ring(cam, yx, yz, .3 + 1.05 * Math.sqrt(a), .6 * Math.exp(-a / 3.2) * (j ? .6 : 1), 2); }
  // the runway: the flock's steps still on the water, fading, running off toward the sun
  for (let i = 0; i < 50; i++) { const z = yz + 1.0 + i * .7; ring(cam, -.125 * z + (i % 2 ? .1 : -.1) + .05, z, .55, .75 * (1 - i / 60) * (1 - .3 * env(t, 22.5, 27)), 2.8); }
  stand(cam, yx, yz, .72, 1, juvP(POSE.sit), Y3.seed, { legs: DEEP });
  for (let j = 0; j < 12; j++) fly(cam, -20 + j * 3.2 + (t - 22.5) * 8, 20 + j * .6, 230 + j * 4, 1, 1, { phi: flapPhi(t, .5, j * .03, .3, .8), neckA: -.03, legA: PI + .05 }, 90 + j, 0, true);
  return Object.assign({ cam, vs: 1.15, rays: .7 }, sunAt(t, -.12, .03));
});
// ---- 6a: close-up, the head comes up out of the water; two rings pass under it, on the beat
shot(27, 29, t => {
  const cam = { f: 3.6, ch: .45, hor: .52, cx: .12, cz: 0, yaw: 0 };
  const sched = [[-1, 'sit'], [27.12, 'sitUp', .4], [27.98, 'sitLook', .14], [28.48, 'sitLook'], [28.7, 'sitFar', .22]];
  const P = juvP(poseAt(sched, t));
  const shake = t > 27.72 && t < 27.96 ? (Math.floor((t - 27.72) / .06) % 2 ? PI : 0) : 0;
  const yaw = shake || (t > 28.55 ? 0 : 0);
  stand(cam, 0, 4.0, .72, 1, P, Y3.seed, { yaw, legs: DEEP });
  // drips from the bill, then the spray of the head shake
  for (const [td, i] of [[27.4, 0], [27.62, 1], [27.86, 2]]) { const a = t - td; if (a > 0 && a < .5) { const p = project(cam, .2, .42 - 4.9 * a * a, 3.95); if (p[1] < project(cam, 0, 0, 3.95)[1]) { xctx.beginPath(); xctx.arc(p[0], p[1], 3.2 * K, 0, TAU); xctx.fill(); } else ripple(cam, .2, 3.95, a - .28, false); } }
  droplets(cam, .22, 4.0, (t - 27.74) * .8, 950, 5, false, .4);
  // the rings from the runway reach it: 28.0 and 28.5, each one flashes as it passes under
  for (let i = 0; i < 2; i++) {
    const tp = 28.0 + i * .5, r = 2.6 + .9 * (t - tp), glow = Math.exp(-Math.max(0, t - tp) / .3) * (t >= tp ? 1 : 0);
    if (r > .2) ring(cam, -2.6, 4.05, r, .5 + glow * .5, 2.6 + glow * 4.5);
  }
  return Object.assign({ cam, vs: 2.0, rays: 1 }, sunAt(t, .19, .045));
});
// ---- 6b: the runway, seen from its first ring; a light runs along it, one ring per beat
shot(29, 32, t => {
  const cam = { f: 1.45, ch: .55, hor: .56, cx: 0, cz: lerp(0, .6, eio(env(t, 29, 32))), yaw: 0 };
  for (let i = 0; i < 60; i++) {
    const z = 2.6 + i * 1.15, x = .25 + (i % 2 ? .13 : -.13);
    const k = Math.floor(i / 2), tp = 29.0 + k * .5;
    const glow = k < 6 && t >= tp ? Math.exp(-(t - tp) / .3) : 0;
    const shimmer = k >= 6 && t >= 31.5 ? .2 * Math.exp(-(t - 31.5 - (k - 6) * .05) / .5) * (t > 31.5 + (k - 6) * .05 ? 1 : 0) : 0;
    runwayRing(cam, x, z, 6 + i * .003, glow + shimmer, .85 + i * .004);
  }
  for (let j = 0; j < 15; j++) fly(cam, 30 + j * 2.6 + (t - 29) * 3, 42 + j * .9 + Math.sin(j * 1.3) * .5, 150 + j * 6, 1, 1, { phi: flapPhi(t, .5, j * .02, .3, .8), neckA: -.03, legA: PI + .05 }, 80 + j, 0, true);
  const nod = [30.0, 30.5, 31.0, 31.5].reduce((a, tb) => a + (t > tb ? .06 * Math.exp(-(t - tb) / .12) : 0), 0);
  const P = juvP(POSE.lookFar); P.hp -= nod * 3;
  stand(cam, -.95, 3.4, .72, 1, P, Y3.seed, { yaw: .5 });
  return Object.assign({ cam, vs: 1.25, rays: .8 }, sunAt(t, .075, .03));
});
// ---- 7a: the count-in (the opening move, now on the beat)
shot(32, 34, t => {
  const cam = { f: lerp(2.0, 2.06, env(t, 32, 34)), ch: .48, hor: .60, cx: 0, cz: 0, yaw: 0 };
  const yx = -.9, yz = 4.6;
  for (let i = 0; i < 16; i++) runwayRing(cam, yx + .55 + i * .5 + (i % 2 ? .04 : -.04), yz + (i % 2 ? .1 : -.1), 18, 0, .8);
  const glow = [32.0, 32.5, 33.0, 33.5].reduce((a, tb) => a + (t >= tb ? Math.exp(-(t - tb) / .25) : 0), 0);
  runwayRing(cam, yx + .05, yz, 18, glow, .9);
  const sched = [[-1, 'up'], [31.93, 'upB'], [32.43, 'up'], [32.93, 'upB'], [33.43, 'up'], [33.62, 'crouch', .2]];
  const P = juvP(poseAt(sched, t));
  stand(cam, yx, yz, .72, 1, P, Y3.seed, { yaw: yawAt([[-1, 0], [31.93, PI], [32.43, 0], [32.93, PI], [33.43, 0]], t) });
  return Object.assign({ cam, vs: 1.4, rays: 1 }, sunAt(t, .22, .05));
});
// ---- 7b: the run, every step into a ring, on the beat
shot(34, 36, t => {
  const st0 = runnerState(RUN2, t);
  const p = ss(env(t, 34, 35.95));
  const cam = { f: lerp(2.1, 2.45, p), ch: lerp(.45, .32, p), hor: lerp(.60, .62, p), cx: st0.x + lerp(.55, -.3, p), cz: 0, yaw: 0 };
  for (const l of RUN2.land) {
    const glow = t >= l.tl ? Math.exp(-(t - l.tl) / .3) : 0;
    runwayRing(cam, l.to, RUN2.z, 18 + (t - 34) * .1, glow, .7);
    ripple(cam, l.to, RUN2.z, t - l.tl, true); droplets(cam, l.to, RUN2.z, t - l.tl, 1000 + l.k, 8, true);
  }
  for (let i = 1; i < 10; i++) runwayRing(cam, RUN2.land[RUN2.land.length - 1].to + i * .5, RUN2.z + (i % 2 ? .08 : -.08), 18, 0, .7);
  const prog = env(t, 34, 35.9);
  const P = { phi: flapPhi(t, .5, 34.0, lerp(-.15, .35, prog), lerp(.2, 1.0, prog)), sweep: lerp(1, .15, ss(env(t, 34, 34.5))), neckA: lerp(.6, .26, prog), hp: -.25, bt: lerp(.2, .22, prog) };
  const st = drawRunner(cam, RUN2, t, P, 1);
  if (t > 35.86) fallDrops(cam, st.x - .3, st.y - .4, RUN2.z, 14, 5, .3, (t - 35.86) * .6);
  return Object.assign({ cam, vs: 1.5, rays: 1 }, sunAt(t, .12, .05));
});
// ---- 8: the freeze (and 9a: it climbs out of the frame)
shot(36, 41, t => {
  const ts = t < FZ2E ? FZ2 : FZ2 + (t - FZ2E);   // subject time: stops at 36.0 for three seconds
  const d = lerp(-.35, .35, eio(env(t, FZ2, FZ2E)));
  const up = eio(env(t, FZ2E, 41));
  const cam = { f: lerp(lerp(5.0, 5.25, eio(env(t, FZ2, FZ2E))), 4.3, up), ch: lerp(.5, .9, up), hor: lerp(.64, .82, up), cx: d + 2.2 * up, cz: 0, yaw: -d / 13 * (1 - up) };
  for (let j = 11; j >= 0; j--) {
    const b = SKYF[j], dt = Math.max(0, ts - FZ2);
    fly(cam, b.x + FLY_V * dt, b.y, b.z, 1, 1, { phi: flapPhi(ts + b.ph * (ts > FZ2 ? 1 : 0), .5, 0, .28, .88), neckA: -.03, hp: -.15, legA: PI + .05 }, b.seed);
  }
  const a = Math.max(0, ts - FZ2);
  const yx = YF.x + 1.2 * a + .9 * a * a, yy = YF.y + .55 * a + .5 * a * a, yz = YF.z;
  const legBlend = ss(env(ts, 36.0, 36.7));
  const phiY = ts <= 36.0 ? 1.2 : flapPhi(ts, .25, 36.0, .3, .95);
  fly(cam, yx, yy, yz, .84, 1, { phi: phiY, sweep: lerp(.3, 0, legBlend), juv: 1, neckA: lerp(.24, .02, legBlend), hp: -.22, legA: lerp(-2.1, -PI - .06, legBlend), knee: lerp(.32, 0, legBlend), bt: lerp(.22, .05, legBlend) }, 7);
  const tw = 35.86, aw = ts - tw, fade = Math.exp(-Math.max(0, ts - 36.0) / 1.2);
  ring(cam, YF.x - .42, YF.z, .16 + .3 * aw, .95 * fade, 3);
  ring(cam, YF.x - .42, YF.z, .34 + .3 * aw, .6 * fade, 2.2);
  ring(cam, YF.x - 1.25, YF.z + .3, .55 + .3 * aw, .4 * fade, 2);
  if (ts <= 36.0) { crown(cam, YF.x - .42, YF.z, 1, 0, 3); fallDrops(cam, YF.x - .45, YF.y - .5, YF.z, 34, 3, .35, .22); fallDrops(cam, YF.x - .5, .3, YF.z, 26, 9, .9, .18); }
  else droplets(cam, YF.x - .45, YF.z, ts - 36.0 + .25, 1200, 26, true, .3);
  return Object.assign({ cam, vs: lerp(2.0, 1.8, up), rays: 1, frozen: t >= FZ2 && t < FZ2E }, sunAt(t, .03, .062));
});
// ---- 9b: the line, low over the water, crosses the last of the sun; the young one catches up and falls into step
const JOIN = 42.5;
shot(41, 49, t => {
  const ts = t;
  const cam = { f: 4.4, ch: .35, hor: .54, cx: 9.0 + FLY_V * (t - 41) * .8, cz: 0, yaw: 0 };
  for (let j = 11; j >= 0; j--) {
    const b = LINE9[j];
    fly(cam, b.x + 4 + FLY_V * (t - 41), b.y + .05 * Math.sin(t * .9 + j), b.z, 1, 1, { phi: flapPhi(t + (hash(j) - .5) * .02, .5, 0, .28, .88), neckA: -.03, hp: -.15, legA: PI + .05 }, b.seed);
  }
  // the young one comes in from the left, wings at double time, and takes the last place
  const slot = { x: LINE9[0].x + 4 - 1.45 + FLY_V * (t - 41), y: LINE9[0].y - .04, z: LINE9[0].z - .8 };
  const k = eout(env(t, 41, JOIN));
  const yx = slot.x - 4.2 * (1 - k), yy = slot.y - .45 * (1 - k) * (1 - k) + .22 * Math.sin(PI * k);
  const phiY = t < JOIN - .25 ? flapPhi(t, .25, 41, .3, .95) : flapPhi(t, .5, 0, .28, .88);
  fly(cam, yx, yy, slot.z, .84, 1, { phi: phiY, juv: 1, neckA: .0, hp: -.18, legA: -PI - .06, bt: .03 }, 7);
  return Object.assign({ cam, vs: 1.8, rays: 1 }, sunAt(t, .03, .05));
});

// ------------------------------------------------------------------ titles (only the end card)
const TX = 112, TY = 930;
function titleLayout() {
  octx.font = `400 ${136 * K}px Anton`;
  const wHalf = octx.measureText('HALF ').width, wA = octx.measureText('A ').width, wAll = octx.measureText('HALF A BEAT').width;
  return { wHalf, wA, wAll };
}
function drawWord(text, x, y, t0, t, font, late) {
  if (t < t0) return;
  const u = env(t, t0, t0 + .22), e = eback(u);
  octx.save(); octx.font = font; octx.fillStyle = '#FFF3E4'; octx.globalAlpha = cl(u * 1.6);
  octx.fillText(text, x, y - (1 - e) * 46 * K); octx.restore();
  // it lands on the water: a small ring under the word
  const a = t - t0 - .12;
  if (a > 0 && a < 1.4) {
    const w = octx.measureText(text).width;
    octx.save(); octx.strokeStyle = '#FFD9A8'; octx.globalAlpha = .55 * Math.pow(1 - a / 1.4, 2); octx.lineWidth = 1.6 * K;
    const rx = (w * .35 + 120 * K * Math.pow(a, .6)), ry = rx * .09;
    octx.beginPath(); octx.ellipse(x + w / 2, y + 26 * K, rx, ry, 0, 0, TAU); octx.stroke(); octx.restore();
  }
}
function drawTitle(t) {
  if (t < TITLE.half) return;
  const L = titleLayout(), f = `400 ${136 * K}px Anton`;
  const x = TX * K, y = TY * K;
  octx.textBaseline = 'alphabetic';
  octx.font = f;
  drawWord('HALF', x, y, TITLE.half, t, f);
  drawWord('A', x + L.wHalf, y, TITLE.a, t, f);
  drawWord('BEAT', x + L.wHalf + L.wA, y, TITLE.beat, t, f, true);
  drawWord('慢半拍', x + L.wAll + 44 * K, y - 4 * K, TITLE.zh, t, `900 ${64 * K}px SC9`);
  if (t >= TITLE.style) {
    const u = eout(env(t, TITLE.style, TITLE.style + .4));
    octx.save(); octx.globalAlpha = u; octx.fillStyle = '#FFF3E4';
    octx.font = `500 ${40 * K}px BarlowC`; const s1 = 'Silhouette Rhythm  ·  ', w1 = octx.measureText(s1).width, dx = -(1 - u) * 24 * K;
    octx.fillText(s1, x + 4 * K + dx, y + 62 * K);
    octx.font = `500 ${36 * K}px SC5`; octx.fillText('剪影律动', x + 4 * K + w1 + dx, y + 61 * K);
    octx.restore();
  }
  if (t >= TITLE.credit) {
    const u = eout(env(t, TITLE.credit, TITLE.credit + .4));
    octx.save(); octx.globalAlpha = u * .92; octx.fillStyle = '#FFF3E4'; octx.font = `500 ${32 * K}px BarlowC`;
    octx.fillText('LemoLab × Claude Opus 5.5', x + 4 * K - (1 - u) * 24 * K, y + 106 * K); octx.restore();
  }
}
window.TEXTS = t => {
  const out = []; if (t < TITLE.half) return out;
  const L = titleLayout(), x = TX * K, y = TY * K;
  out.push({ id: 'title', text: 'HALF A BEAT', x0: x, y0: y - 110 * K, x1: x + L.wAll, y1: y + 6 * K });
  if (t >= TITLE.zh) out.push({ id: 'zh', text: '慢半拍', x0: x + L.wAll + 44 * K, y0: y - 70 * K, x1: x + L.wAll + 44 * K + 200 * K, y1: y + 6 * K });
  if (t >= TITLE.style) out.push({ id: 'style', text: 'Silhouette Rhythm · 剪影律动', x0: x, y0: y + 28 * K, x1: x + 520 * K, y1: y + 74 * K });
  if (t >= TITLE.credit) out.push({ id: 'credit', text: 'LemoLab × Claude Opus 5.5', x0: x, y0: y + 80 * K, x1: x + 380 * K, y1: y + 116 * K });
  return out;
};

// ------------------------------------------------------------------ frame
window.render = function (t) {
  t = cl(t, 0, DUR - 1e-4);
  let S = SHOTS[0]; for (const s of SHOTS) if (t >= s.t0 && t < s.t1) S = s;
  clear();
  const r = S.fn(t);
  const cam = r.cam;
  const flash = t >= FZ2 && t < FZ2 + 1 ? Math.exp(-(t - FZ2) / .18) : 0;
  draw({ T: r.frozen ? (t < 30 ? FZ1 : FZ2) : t, hor: cam.hor * H, fpx: cam.f * H, yaw: cam.yaw, cx: cam.cx, ch: cam.ch, sun: r.sun, sunR: r.sunR,
    ph: skyPh(t), pulse: r.frozen ? 0 : pulseAt(t) * .7, flash, rays: r.rays, vs: r.vs }, [LF, LR, LX]);
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
  if (r.smear > .01) motionBlur(r.smear);
  drawTitle(t);
};
// whip-pan motion blur: a true horizontal blur at full resolution, sampled along the direction of motion.
// Two box passes (16 taps over the blur length, then 16 taps over one tap spacing) give a smooth kernel with no steps.
// Taps are averaged in place (alpha 1/(k+1)); a centre tap goes first so the frame edges stay opaque.
function motionBlur(amount) {
  const L = 280 * K * amount, n = 16;
  if (L < 1) return;
  if (SM.width !== W || SM.height !== H) { SM.width = W; SM.height = H; }
  const s = SM.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1; s.clearRect(0, 0, W, H); s.drawImage(G, 0, 0);
  for (let i = 0; i < n; i++) { s.globalAlpha = 1 / (i + 2); s.drawImage(G, -L / 2 + (i + .5) * L / n, 0); }
  s.globalAlpha = 1;
  const d = L / n;
  octx.globalAlpha = 1; octx.drawImage(SM, 0, 0);
  for (let i = 0; i < n; i++) { octx.globalAlpha = 1 / (i + 2); octx.drawImage(SM, -d / 2 + (i + .5) * d / n, 0); }
  octx.globalAlpha = 1;
}
Promise.all([document.fonts.load(`400 40px Anton`, 'HALF A BEAT'), document.fonts.load(`500 40px BarlowC`, 'Silhouette Rhythm LemoLab × Claude Opus 5.5'),
  document.fonts.load(`900 40px SC9`, '慢半拍'), document.fonts.load(`500 40px SC5`, '剪影律动')]).then(() => { window.render(0); window.READY = true; });
})();
