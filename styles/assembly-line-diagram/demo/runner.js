// The Disassembly Line · the running figure at the end
// When the world cutaway pulls out to the full body, it dissolves into this "diagram": human proportions (head about 1/7 of height), a narrower torso, the six workshops shrunk to diagram rooms;
// legs and arms move in a running cycle (continuous phase φ, period 0.62 s), the whole figure always inside the frame; numbers are led out to a column on the right of the body.
// Coordinates: screen pixels. R(local) → screen: origin at the hip joint, multiplied by s and moved to (HX, HY); the torso also leans forward about the hip by LEAN.

const RUN = { HX: 720, HY: 560, LEAN: -9, PERIOD: .62, GROUND: 952 };
const RUN_NAMES = ['CRUSHER', 'ACID DRUM', 'GATEKEEPER', 'SORTING LINE', 'WAREHOUSE', 'FURNACES'];
const deg = Math.PI / 180;
const dirA = a => [-Math.sin(a * deg), Math.cos(a * deg)];          // angle (0 = down, positive = forward/left) → direction
const rotP = (p, a) => [p[0] * Math.cos(a * deg) - p[1] * Math.sin(a * deg), p[0] * Math.sin(a * deg) + p[1] * Math.cos(a * deg)];

// ---------------- Running cycle (ground-based: the stance foot is pinned to the ground, not two sine swings) ----------------
// Period P = 0.62 s, two steps; each leg is on the ground for 32% of the period, the two flight phases 18% each.
// The camera follows the figure: the ground moves back (to the right) at V (local units/s); the stance foot's toe is pinned to the ground and moves back with it → no sliding against the ground.
// Foot strike is 25 ahead of the point below the hip (centre of mass); swing foot: push-off → back kick (heel near the buttock) → knee drives forward → shin reaches forward → paws back to land.
// The knee is solved by two-bone IK, taking the forward solution, so it always bends forward. When the end plaque lands it freezes in flight (near leg forward, far leg kicked back).
const CYC = { P: .62, duty: .32, V: 605, Hm: 386, A: 13, L1: 200, L2: 192, FOOT: 62 };
const runT0 = () => K.card - .91 * CYC.P;                     // puts K.card at phase 0.91 (flight, near leg forward)
const runPhase = t => ((((t - runT0()) / CYC.P) % 1) + 1) % 1;
const hipH = ph => CYC.Hm - CYC.A * Math.cos(4 * Math.PI * (ph - CYC.duty / 2));   // lowest at mid-stance, highest in flight
function ik(A, L1 = CYC.L1, L2 = CYC.L2) {
  let d = Math.hypot(A[0], A[1]); d = Math.min(d, L1 + L2 - .5);
  const th = Math.atan2(A[1], A[0]), b = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k1 = [Math.cos(th + b) * L1, Math.sin(th + b) * L1], k2 = [Math.cos(th - b) * L1, Math.sin(th - b) * L1];
  return k1[0] < k2[0] ? k1 : k2;                              // knee forward (smaller x)
}
function hermite(keys, u) {                                     // keys: [[u, [x,y], [mx,my]?], ...]
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [u0, p0] = keys[i], [u1, p1] = keys[i + 1], h = u1 - u0, x = clamp((u - u0) / h);
  const tan = j => keys[j][2] || [(keys[j + 1][1][0] - keys[j - 1][1][0]) / (keys[j + 1][0] - keys[j - 1][0]), (keys[j + 1][1][1] - keys[j - 1][1][1]) / (keys[j + 1][0] - keys[j - 1][0])];
  const m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * x ** 3 - 3 * x * x + 1, h10 = x ** 3 - 2 * x * x + x, h01 = -2 * x ** 3 + 3 * x * x, h11 = x ** 3 - x * x;
  return [0, 1].map(c => h00 * p0[c] + h10 * h * m0[c] + h01 * p1[c] + h11 * h * m1[c]);
}
const angOf = v => Math.atan2(v[1], v[0]);
const vecA = (a, l) => [Math.cos(a) * l, Math.sin(a) * l];
// one leg: pl = this leg's own phase (0 = foot strike), returns hip-local coords (hip = (0,0), y down, ground y = Hcur)
function legState(pl, Hcur) {
  const { duty, P, V, FOOT } = CYC;
  const H0 = hipH(0), Hd = hipH(duty);
  const toeTD = -25 - FOOT, toeTO = toeTD + V * duty * P;      // toe x at strike and at push-off
  let A, T, stance = pl < duty;
  if (stance) {
    const p = pl / duty, toeX = toeTD + V * pl * P;             // toe pinned to the ground, moving back with it
    const lift = ss(seg(p, .55, 1)) * 42 * deg;                 // late stance: heel lifts, rotating about the toe
    T = [toeX, Hcur - 5];
    A = [T[0] + Math.cos(lift) * FOOT, T[1] - 13 - Math.sin(lift) * FOOT];
  } else {
    const u = (pl - duty) / (1 - duty), sw = (1 - duty) * P;
    const liftE = 42 * deg, A0 = [toeTO + Math.cos(liftE) * FOOT, Hd - 5 - 13 - Math.sin(liftE) * FOOT], A1 = [-25, H0 - 18];
    A = hermite([[0, A0, [V * sw, -170]], [.22, [150, 232]], [.45, [62, 178]], [.7, [-78, 232]], [.88, [-96, 318]], [1, A1, [V * sw * .9, 70]]], u);
    // foot: still at the tiptoe angle as it leaves the ground, slowly turning to "toe forward, slightly down"; flattens before landing
    const Kn = ik(A), shin = angOf([A[0] - Kn[0], A[1] - Kn[1]]);
    const aSwing = shin + 75 * deg, aTO = Math.PI - liftE * -1 + 0, aTD = angOf([-FOOT, 13]);
    const a0 = angOf([toeTO - A0[0], Hd - 5 - A0[1]]);
    let a = aSwing;
    if (u < .2) a = lerp(a0, aSwing, ss(u / .2));
    if (u > .82) a = lerp(aSwing, aTD, ss((u - .82) / .18));
    T = [A[0] + Math.cos(a) * FOOT, A[1] + Math.sin(a) * FOOT];
  }
  const Kn = ik(A);
  return { H: [0, 0], K: Kn, A, T, stance };
}
function armPose(ph, near) {
  const sw = Math.cos(2 * Math.PI * (ph - .95)) * (near ? -1 : 1);
  const ua = 38 * sw + 6, fa = ua + 82 + 10 * sw;
  const E1 = [dirA(ua)[0] * 118, dirA(ua)[1] * 118];
  return { S: [0, 0], E: E1, W: [E1[0] + dirA(fa)[0] * 104, E1[1] + dirA(fa)[1] * 104] };
}
// a whole pose: J = screen position of the hip joint; the ground is at RUN.GROUND
function runnerPose(t, s) {
  const ph = runPhase(t), Hc = hipH(ph);
  const legN = legState(ph, Hc), legF = legState((ph + .5) % 1, Hc);
  const J = [RUN.HX, RUN.GROUND - Hc * s];
  const X = p => [J[0] + p[0] * s, J[1] + p[1] * s];
  const O = [J[0], J[1] - 16 * s];                              // torso origin (the hip joint is at torso-local (0,16))
  const shL = rotP([4, -292], RUN.LEAN);
  return { ph, s, J, O, X, Hc, shL, legN, legF, armN: armPose(ph, true), armF: armPose(ph, false) };
}

// limbs: ink edge → flesh-pink band → inner ink line → indigo (the same four layers as the body world)
function limbS(pts, w, s, far = false) {
  const d = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
  const st = (col, ww) => out(`<path d="${d}" stroke="${col}" stroke-width="${f1(ww)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
  const band = far ? C.blushD : C.blush, fill = far ? '#18233E' : C.ground;      // far-side arm and leg: one shade darker
  st(C.ink, w * s + 3); out(`<g${tr(band)}>`); st(band, w * s - 3); out('</g>'); st(C.ink, w * s - 15 * s); st(fill, w * s - 18 * s);
}
function fistS(p, s, far = false) { shape(E(p[0], p[1], 24 * s), far ? C.blushD : C.blush, 2.6); shape(E(p[0], p[1], 15 * s), far ? '#18233E' : C.ground, 2); }

// torso + head (torso-local coords, hip = (0,0), not leaning)
const TORSO = 'M-62 44C-92 10 -104 -90 -100 -170C-98 -236 -92 -282 -60 -306C-36 -322 -20 -326 -6 -326L22 -326C58 -322 86 -300 94 -260C104 -200 100 -100 90 -30C84 18 64 46 30 54C0 60 -36 58 -62 44Z';
const HEAD = 'M-30 -330L-30 -352C-62 -352 -88 -372 -96 -398C-104 -400 -112 -404 -110 -412C-104 -420 -100 -428 -100 -440C-100 -486 -66 -516 -22 -516C26 -516 58 -484 58 -440C58 -400 34 -368 6 -356L6 -330Z';

function miniRoom(x, y, w, h, frame, fn) {
  shape(R(x, y, w, h, 1.5), frame, 1.6);
  shape(R(x + 3.5, y + 3.5, w - 7, h - 7, 1), C.wall, 1.2);
  if (fn) fn(x + 3.5, y + 3.5, w - 7, h - 7);
}
// diagram workshops inside the torso
function runnerStations(t) {
  // chest: pump + bellows (tiny)
  miniRoom(-86, -296, 44, 50, C.red, (x, y, w, h) => { for (let i = 0; i < 2; i++) shape(R(x + 5 + i * 17, y + 16, 12, h - 20, 2), C.red, 1.2); });
  miniRoom(-20, -300, 100, 54, C.teal, (x, y, w, h) => { for (let i = 0; i < 2; i++) { const br = .5 + .5 * Math.sin(t * 1.6 + i); shape(R(x + 8 + i * 46, y + h - 26 - 8 * br, 36, 26 + 8 * br, 2), C.blush, 1.2); } });
  slabS(-96, -240, 192);
  // ⑤ warehouse (liver)
  miniRoom(-80, -232, 124, 54, C.teal, (x, y, w, h) => { for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) shape(R(x + 6 + k * 14, y + h - 12 - r * 13, 10, 10, 1), C.sun, .9); });
  slabS(-96, -172, 192);
  // ② drum + ③ gatekeeper
  miniRoom(-82, -166, 104, 58, C.teal, (x, y, w, h) => { out(`<g transform="rotate(4 ${x + w / 2} ${y + h / 2})">`); shape(R(x + 8, y + 12, w - 22, h - 26, 10), C.blush, 1.4); for (let k = 0; k < 5; k++) line([[x + 16 + k * 14 + (t * 12) % 14, y + 13], [x + 22 + k * 14 + (t * 12) % 14, y + h - 15]], 2.4, C.blushD); out('</g>'); });
  miniRoom(26, -166, 62, 58, C.red, (x, y, w, h) => { shape(E(x + 18, y + 22, 9), C.cream, 1.2); line([[x + w - 14, y + h - 30], [x + w - 14, y + h - 6]], 1.6); shape(E(x + w - 14, y + h - 34, 6), C.red, 1.2); });
  slabS(-96, -102, 192);
  // ④ sorting line (three coloured lines)
  miniRoom(-86, -96, 176, 66, C.sun, (x, y, w, h) => {
    [C.sun, C.red, C.teal].forEach((c, i) => { const yy = y + 14 + i * 16; line([[x + 8, yy + 4], [x + w - 30, yy + 4]], 2.6, '#4A4D5C'); for (let k = 0; k < 7; k++) { const xx = x + 10 + ((k * 18 - t * 30) % 126 + 126) % 126; shape(R(xx, yy - 3, 6, 6, 1), c, .8); } });
    shape(R(x + w - 26, y + 6, 20, h - 12, 2), C.wallD, 1.2);
  });
  slabS(-96, -24, 192);
}
function slabS(x, y, w) { shape(R(x, y, w, 6), C.blush, 1.4); }

// ⑥ furnaces in the leg (turning with the thigh): L is in hip-local coords
function thighFurnace(L, X, s, t) {
  const p = [lerp(L.H[0], L.K[0], .5), lerp(L.H[1], L.K[1], .5)];
  const q = X(p), ang = angOf([L.K[0] - L.H[0], L.K[1] - L.H[1]]) / deg - 90;
  out(`<g transform="translate(${f1(q[0])} ${f1(q[1])}) rotate(${f1(ang)}) scale(${f1(s * 100) / 100})">`);
  shape(R(-22, -34, 44, 68, 2), C.red, 1.6); shape(R(-18, -30, 36, 60, 1), C.wall, 1.2);
  for (let i = 0; i < 3; i++) { const y = -20 + i * 19; shape(R(-11, y, 22, 14, 3), C.red, 1); fillOnly(R(-7, y + 4, 14, 7, 1), C.sun, `opacity="${f1(.7 + .3 * Math.sin(t * 20 + i))}"`); }
  out('</g>');
  return q;
}

// the whole figure (t = time after the freeze)
function runner(t, s, op) {
  const P = runnerPose(t, s), X = P.X;
  out(`<g opacity="${f1(op * 100) / 100}">`);
  const legPts = L => [L.H, L.K, L.A, L.T].map(X);
  const shS = [P.O[0] + P.shL[0] * s, P.O[1] + P.shL[1] * s];
  const armPts = A => [A.S, A.E, A.W].map(q => [shS[0] + q[0] * s, shS[1] + q[1] * s]);
  // shadow on the ground: a flat ellipse under the stance foot, smaller in flight
  for (const L of [P.legN, P.legF]) { const T = X(L.T); const h = RUN.GROUND - T[1]; const k = clamp(1 - h / 160); if (k > .05) out(`<ellipse cx="${f1(T[0] + 26 * s)}" cy="${RUN.GROUND + 4}" rx="${f1(54 * s * k)}" ry="${f1(7 * k)}" fill="${C.shade}"/>`); }
  // far-side arm and leg (one shade darker, behind the torso)
  const aF = armPts(P.armF); limbS(aF, 34, s, true); fistS(aF[2], s, true);
  const aN = armPts(P.armN); limbS(aN, 34, s); fistS(aN[2], s);      // the near arm is also drawn behind the torso, so it does not cover the workshops inside
  const lF = legPts(P.legF); limbS(lF.slice(0, 3), 60, s, true); limbS(lF.slice(2), 34, s, true);
  // torso + head (leaning forward)
  out(`<g transform="translate(${f1(P.O[0])} ${f1(P.O[1])}) scale(${f1(s * 1000) / 1000}) rotate(${RUN.LEAN})">`);
  out(`<path d="${TORSO}" fill="${C.shade}" transform="translate(12 9)"/><path d="${HEAD}" fill="${C.shade}" transform="translate(12 9)"/>`);
  for (const d of [HEAD, TORSO]) fillOnly(d, C.ground);
  const cid = 'rclip' + (UID++);
  out(`<clipPath id="${cid}"><path d="${TORSO}"/><path d="${HEAD}"/></clipPath>`);
  out(`<g clip-path="url(#${cid})">`);
  miniRoom(-62, -496, 100, 62, C.teal, (x, y, w, h) => { shape(R(x + 40, y + 8, 46, 24, 2), C.ink, 0); shape(E(x + 18, y + h - 20, 9), C.sun, 1.2); });
  miniRoom(-88, -424, 74, 56, C.sun, (x, y, w, h) => { for (let i = 0; i < 4; i++) { shape(R(x + 6 + i * 14, y + 10, 11, 12, 2), C.cream, 1); shape(R(x + 6 + i * 14, y + h - 22, 11, 12, 2), C.cream, 1); } });
  line([[-24, -368], [-24, -170]], 9, C.sunD); line([[-24, -368], [-24, -170]], 5, C.sun);
  line([[74, -300], [74, 30]], 7, C.redD); line([[74, -300], [74, 30]], 4, C.red);
  runnerStations(t);
  out('</g>');
  out(`<g clip-path="url(#${cid})"><g${tr(C.blush)}>`);
  for (const d of [HEAD, TORSO]) out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="17"/>`);
  for (const d of [HEAD, TORSO]) out(`<path d="${d}" fill="none" stroke="${C.blush}" stroke-width="13"/>`);
  out('</g></g>');
  for (const d of [HEAD, TORSO]) out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${f1(2.6 / s)}" stroke-linejoin="round"/>`);
  out(`<circle cx="-84" cy="-428" r="5" fill="${C.ink}"/>`);
  out('</g>');
  // near leg (with the ⑥ furnaces), near arm (in front of everything)
  const lN = legPts(P.legN); limbS(lN.slice(0, 3), 60, s); limbS(lN.slice(2), 34, s);
  out(`<path d="M${lN.slice(0, 3).map(p => f1(p[0] + 10 * s) + ' ' + f1(p[1])).join('L')}" stroke="${C.red}" stroke-width="${f1(5 * s)}" fill="none" stroke-linejoin="round"/>`);
  const f6 = thighFurnace(P.legN, X, s, t);
  out('</g>');
  const T = q => { const r = rotP(q, RUN.LEAN); return [P.O[0] + r[0] * s, P.O[1] + r[1] * s]; };
  return { P, st: [T([-50, -396]), T([-30, -137]), T([57, -137]), T([0, -63]), T([-18, -205]), f6],
    route: [T([-88, -396]), T([-50, -396]), T([-24, -368]), T([-24, -137]), T([-30, -137]), T([57, -137]), T([57, -63]), T([0, -63]), T([-70, -63]), T([-70, -205]), T([-18, -205]), T([74, -205]), T([74, 20]), f6],
    idx: [1, 4, 5, 7, 10, 13] };
}

// the whole ending (screen layer): ground, bus, speed lines, figure, light streak, number leaders
function runnerScene(t0) {
  const d = ss(seg(t0, K.dissolve[0], K.dissolve[1]));
  if (d <= 0) return;
  const t = Math.min(t0, K.card);                             // the whole picture freezes the moment the plaque lands
  const s = lerp(1.25, 1.0, eio(seg(t, K.dissolve[0], K.settle)));
  const vS = CYC.V * s;                                       // screen speed of the ground moving back
  out(`<g opacity="${f1(d * 100) / 100}">`);
  fillOnly(R(0, RUN.GROUND, 1920, 128), C.paperD);
  line([[0, RUN.GROUND], [1920, RUN.GROUND]], 3);
  // ground seams: move back with the ground (the stance foot moves at the same speed, so the foot does not slide)
  const off = ((t * vS) % 150 + 150) % 150;
  for (let x = -150 + off; x < 1950; x += 150) line([[x, RUN.GROUND + 14], [x - 16, RUN.GROUND + 44]], 2.4, C.ink, 'opacity=".35"');
  // bus: ahead (on the left) driving slowly forward, the figure gaining on it; at 48.6 s it stops and opens its door, and since the camera follows the figure, the bus quickly "comes to meet" it
  const bxEnd = -400, tS = K.busDoor;
  const rel = u => u < tS ? 70 : lerp(70, vS, ss((u - tS) / .4));     // bus speed to the right relative to the frame
  let bx = bxEnd; for (let u = t; u < K.card; u += .01) bx -= rel(u) * Math.min(.01, K.card - u);
  bus(bx, RUN.GROUND, .62, t, { door: ss(seg(t, tS, tS + .6)) });
  out('</g>');
  // speed lines (behind), flowing back with the ground
  const q = ss(seg(t, K.dissolve[1], K.dissolve[1] + .8));
  for (const [y, x0, l] of [[560, 870, 110], [660, 900, 150], [760, 880, 120]]) {
    const xx = x0 + ((t * vS * .5 + y) % 80);
    if (q > .01) line([[xx, y], [xx + l * q, y]], 4, C.ink, `opacity="${f1(d * .7)}"`);
  }
  // little puffs of dust kicked up at push-off
  for (const [lo, far] of [[0, false], [.5, true]]) {
    const ph = runPhase(t), age = (((ph - lo - CYC.duty) % 1) + 1) % 1 * CYC.P;
    if (age < .35 && t > K.dissolve[1]) { const toeX = RUN.HX + (-25 - CYC.FOOT + CYC.V * CYC.duty * CYC.P) * s + vS * age;
      for (let k = 0; k < 3; k++) out(`<circle cx="${f1(toeX + 14 + k * 16 + age * 60)}" cy="${f1(RUN.GROUND - 8 - k * 5 - age * 30)}" r="${f1((6 + 18 * age) * (1 - k * .2))}" fill="${C.paperD}" stroke="${C.ink}" stroke-width="1.6" opacity="${f1((1 - age / .35) * .8 * d)}"/>`); }
  }
  const info = runner(t, s, d);
  // light streak: mouth → furnaces above the knee, reaching each station exactly at its K.stations time
  const pts = info.route, lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const keys = [[K.light[0], 0], ...K.stations.map((ts, i) => [ts, lens[info.idx[i]]])];
  let shown = 0;
  for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0]) shown = lerp(keys[i][1], keys[i + 1][1], ss(seg(t, keys[i][0], keys[i + 1][0])));
  if (t >= keys[keys.length - 1][0]) shown = lens[lens.length - 1];
  if (t > K.light[0]) {
    const dd = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
    out(`<path d="${dd}" fill="none" stroke="${C.ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(shown)} 99999"/>`);
    out(`<path d="${dd}" fill="none" stroke="${C.sun}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(shown)} 99999"/>`);
    if (shown > 30) out(`<path d="${dd}" fill="none" stroke="${C.cream}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2 18" stroke-dashoffset="${f1(-t * 50)}" opacity=".9" clip-path="none"/>`);
  }
  // numbers: leaders drawn out to a column on the right (ordered by station height, no crossings)
  const order = [0, 4, 1, 2, 3, 5];                      // 1 crushers, 5 warehouse, 2 drum, 3 gatekeeper, 4 sorting line, 6 furnaces
  const CX = 1010, Y0 = 118, DY = 74;
  order.forEach((i, row) => {
    const q2 = seg(t, K.stations[i] - .02, K.stations[i] + .32); if (q2 <= 0) return;
    const [sx, sy] = info.st[i], by = Y0 + row * DY, bx = CX;
    const L = eo(q2);
    const mx = 900, ex = lerp(sx, mx, L), ey = sy;
    out(`<circle cx="${f1(sx)}" cy="${f1(sy)}" r="5" fill="${C.ink}"/>`);
    line([[sx, sy], [ex, ey]], 2.4);
    if (L > .99) line([[mx, sy], [bx - 26, by]], 2.4);
    const b = backE(seg(t, K.stations[i] + .12, K.stations[i] + .42), 2.2);
    if (b > 0) {
      out(`<g transform="translate(${bx} ${by}) scale(${f1(b * 100) / 100})">`);
      out(`<circle r="23" fill="${C.ground}" opacity=".3" transform="translate(4 4)"/>`);
      shape(E(0, 0, 21), C.sun, 3); txt(0, 9.5, String(i + 1), 27, { fam: FONT.en, w: 900, anchor: 'middle' });
      out('</g>');
      const tq = seg(t, K.stations[i] + .25, K.stations[i] + .5);
      if (tq > 0) txt(bx + 36, by + 11, RUN_NAMES[i], 32, { fam: FONT.en, w: 800, ls: 1.2, fill: C.ink });
    }
  });
}
