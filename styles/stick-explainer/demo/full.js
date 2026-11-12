// Stick-figure Explainer demo «Six Hands Away» · 52 s film (?scene=full[&from=&to=]): 50 s story + end card.
// One timeline, five shots (DEMO.md, "Shots"). The camera moves through four "worlds" that share coordinates where two shots meet:
//   W1  S1 hook (a chain from you to a stranger)  →  pull back  →  S2 four chains carry letters (1967)
//   W3  push into "you"  →  S3 rings of people, each ring 2.5× the last (a fractal pull-back), the count passes Earth
//   W4  dive through your red head  →  S4 three chains, 6 → 4.74 → 3.57
//   W5  the last chain bends onto a globe and grows around it until it closes: everyone holding hands
// Signature, escalating: two hands join into one curve → a chain → closed rings → the whole Earth.
// Uses the figure rig, springs and helpers from index.html (same page).
(function () {
if (SCENE !== 'full') return;

const QF = new URLSearchParams(location.search);
const FROM = +(QF.get('from') ?? 0), TO = +(QF.get('to') ?? 52);
const FILM_DUR = 52;                                                  // 50 s story + the end card held on the globe

// ---------------- voice-over and subtitles (voice/lines.json, durations from voice/dur.json) ----------------
const VO = [
  ['v01', .80, 4.270, '你和地球上任何一个陌生人之间，隔着几个人？', 'How many people stand between you and any stranger on Earth?'],
  ['v02', 6.90, 1.974, '只隔六次握手，人们这么说。', 'Just 6 handshakes, they say.'],
  ['v03', 10.20, 4.308, '1967 年，心理学家米尔格拉姆做了实验。', 'In 1967, Stanley Milgram tested it.'],
  ['v04', 15.11, 3.652, '信只能在互相认识的人之间传递。', 'Letters could only pass between people who knew each other.'],
  ['v05', 19.36, 3.644, '送到的那些信，中间大约经过了五个人。', 'The ones that arrived went through about 5 people.'],
  ['v06', 23.70, 3.604, '为什么这么少？每个人都认识很多人。', 'Why so few? Everyone knows a lot of people.'],
  ['v07', 27.90, 4.111, '假如你认识 100 人，往外两步就是 1 万人。', 'Say you know 100. Two steps out, that’s 10,000.'],
  ['v08', 32.61, 3.704, '往外五步，就比地球上的人还多。', 'Five steps out: more people than live on Earth.'],
  ['v09', 37.70, 5.562, '到了网上，链条变短了：4.74 步，后来 3.57 步。', 'Online, it shrank: 4.74, then 3.57.'],
  ['v10', 44.70, 4.350, '那个陌生人？多半是朋友的朋友的朋友。', 'And the stranger? Probably a friend of a friend of a friend.'],
];
const SUBS = VO.map(([id, t, d, zh, en]) => ({ id, t0: +(t - .25).toFixed(3), t1: +(t + d + .35).toFixed(3), zh, en }));
window.SUBS = SUBS; window.VO = VO.map(([id, t, d]) => ({ id, t, d }));

// ---------------- small helpers ----------------
const TAU = Math.PI * 2;
const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, k) => [a[0] * k, a[1] * k],
  len: a => Math.hypot(a[0], a[1]), norm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; } };
const eo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerpZ = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));        // zoom is interpolated in log space
function idle(seed, t) {
  const p = rest(), ph = seed * 1.93 + .4;
  p.hx += .004 * Math.sin(t * 1.25 + ph); p.lean += .012 * Math.sin(t * 1.05 + ph * 1.3);
  p.hy += .004 * (.5 + .5 * Math.sin(t * 2.1 + ph)); p.la -= .03 * Math.sin(t * 1.5 + ph); p.ra += .03 * Math.sin(t * 1.5 + ph + .7);
  p.head += .05 * Math.sin(t * .7 + ph * 2.1);
  return p;
}
// elbow of a two-bone arm, bent towards `down` (the figure's feet side)
function elbowD(Sh, Hn, L1, L2, down) {
  let dx = Hn[0] - Sh[0], dy = Hn[1] - Sh[1], d = Math.hypot(dx, dy) || 1e-6;
  if (d >= L1 + L2) return [Sh[0] + dx * L1 / (L1 + L2), Sh[1] + dy * L1 / (L1 + L2)];
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let nx = -dy / d, ny = dx / d; if (nx * down[0] + ny * down[1] < 0) { nx = -nx; ny = -ny; }
  return [Sh[0] + a * dx / d + nx * h, Sh[1] + a * dy / d + ny * h];
}

// ---------------- entities ----------------
// A person: {x, y (feet), rot (0 = upright; radial on rings), S, appear, col(T), fill(T), pose(T), lws?}
// Joints are computed in the person's own frame and mapped to the world.
function wJ(e, T) {
  const sc = popS(T - e.appear); if (sc <= .01) return null;
  const S = e.S * sc, p = e.pose(T), j = joints({ x: 0, gy: 0, S }, p);
  const c = Math.cos(e.rot || 0), s = Math.sin(e.rot || 0), M = q => [e.x + c * q[0] - s * q[1], e.y + s * q[0] + c * q[1]];
  return { S, sc, p, Sh: M(j.Sh), aL: [M(j.aL[0]), M(j.aL[1])], aR: [M(j.aR[0]), M(j.aR[1])], head: M(j.Hd), down: [-s, c] };
}
// A handshake between a (its right hand) and b (its left hand):
// {a, b, c: clasp time, rel?: release time, sag(T): how far the joined hands hang below the shoulders (× S; negative = lifted),
//  over: [{t0, t1, f0?, f1?, rev?}] red runs along the joined arms (t0→t1), fading back to ink between f0 and f1}
function linkGeoW(L, T, A, B) {
  const c = L.c;
  let r = seg(T, c - .3, c); r = r < .3 ? -.10 * Math.sin(Math.PI * r / .3) : ss((r - .3) / .7);
  if (L.rel != null) r = Math.min(r, 1 - ss(seg(T, L.rel, L.rel + .32)));
  const joined = T >= c && (L.rel == null || T < L.rel);
  const down = V.norm(V.add(A.down, B.down)), S = (A.S + B.S) / 2;
  const tc = T - c, bounce = tc > 0 && joined ? .045 * Math.exp(-tc * 6) * Math.sin(tc * 21) : 0;
  const mid = V.mul(V.add(A.Sh, B.Sh), .5), Pc = V.add(mid, V.mul(down, ((L.sag ? L.sag(T) : .17) + bounce) * S));
  const hi = L2D(A.aR[1], Pc, r), hj = L2D(B.aL[1], Pc, r);
  const Ei = elbowD(A.Sh, hi, GEO.upper * A.S, GEO.fore * A.S, down), Ej = elbowD(B.Sh, hj, GEO.upper * B.S, GEO.fore * B.S, down);
  let Qi = ctrl(A.Sh, Ei, hi, FIGS.A.k), Qj = ctrl(B.Sh, Ej, hj, FIGS.A.k);
  const jw = joined ? ss(seg(T, c, c + .14)) : 0;
  if (jw > 0) {
    const d = V.norm(V.sub(Qj, Qi)), li = V.len(V.sub(Pc, Qi)), lj = V.len(V.sub(Qj, Pc));
    Qi = L2D(Qi, V.sub(Pc, V.mul(d, li)), jw); Qj = L2D(Qj, V.add(Pc, V.mul(d, lj)), jw);
  }
  return { Si: A.Sh, Qi, hi, Sj: B.Sh, Qj, hj, Pc, joined };
}
const engaged = (L, T) => T >= L.c - .3 && (L.rel == null || T < L.rel + .32);
function lwOf(e, J) { return Math.max(1.2, FIGS.A.w * (e.lws ?? clamp(Math.sqrt(J.S / 380), .6, 1.05)) * clamp(J.sc * 1.6)); }
function pathOf(G) { return quadPts(G.Si, G.Qi, G.hi).concat(quadPts(G.hj, G.Qj, G.Sj).slice(1)); }

// draw a group: links first (behind), red runs on top of them, then people (minus the arms that are holding hands)
function drawGroup(P, Ls, T, o = {}) {
  const J = P.map(e => wJ(e, T)), alpha = o.alpha ?? 1;
  if (alpha <= 0) return { J, G: [] };
  g.save(); g.globalAlpha = alpha;
  const G = [];
  for (const L of Ls) {
    const A = J[L.a], B = J[L.b];
    if (!A || !B || !engaged(L, T)) continue;
    const geo = linkGeoW(L, T, A, B); G.push([L, geo]);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = P[L.a].col(T); g.lineWidth = lwOf(P[L.a], A);
    g.beginPath(); g.moveTo(geo.Si[0], geo.Si[1]); g.quadraticCurveTo(geo.Qi[0], geo.Qi[1], geo.hi[0], geo.hi[1]); g.stroke();
    g.strokeStyle = P[L.b].col(T); g.lineWidth = lwOf(P[L.b], B);
    g.beginPath(); g.moveTo(geo.hj[0], geo.hj[1]); g.quadraticCurveTo(geo.Qj[0], geo.Qj[1], geo.Sj[0], geo.Sj[1]); g.stroke();
  }
  for (const [L, geo] of G) {
    if (!geo.joined || !L.over) continue;
    const pts = pathOf(geo), len = polyLen(pts);
    for (const ov of L.over) {
      const f = seg(T, ov.t0, ov.t1); if (f <= 0) continue;
      const vis = 1 - seg(T, ov.f0 ?? 1e9, ov.f1 ?? 1e9 + 1); if (vis <= 0) continue;
      g.strokeStyle = mix(C.ink, C.sig, vis); g.lineWidth = lwOf(P[L.a], J[L.a]) + .6;
      strokePoly(ov.rev ? pts.slice().reverse() : pts, f * len);
    }
  }
  P.forEach((e, i) => {
    const j = J[i]; if (!j) return;
    let noL = false, noR = false;
    for (const L of Ls) { if (!engaged(L, T) || !J[L.a] || !J[L.b]) continue; if (L.a === i) noR = true; if (L.b === i) noL = true; }
    g.save(); g.translate(e.x, e.y); g.rotate(e.rot || 0);
    figure({ x: 0, gy: 0, S: j.S, col: e.col(T), fill: e.fill(T), lwk: clamp(j.sc * 1.6), lws: e.lws, noL, noR }, j.p);
    g.restore();
  });
  g.restore();
  return { J, G };
}
// a point at fraction u along a joined link (for the envelope)
function alongLink(geo, u) {
  const pts = pathOf(geo), len = polyLen(pts); let L = 0, target = u * len;
  for (let i = 1; i < pts.length; i++) { const s = V.len(V.sub(pts[i], pts[i - 1]));
    if (L + s >= target) { const k = (target - L) / s; return [L2D(pts[i - 1], pts[i], k), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
    L += s; }
  return [pts[pts.length - 1], 0];
}
function envelope(x, y, w, ang, grey) {
  const h = w * .68;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = w * .075;
  g.fillStyle = grey ? C.tint : C.paper; g.strokeStyle = grey ? C.mute : C.ink;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, w * .08); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-w / 2 + w * .06, -h / 2 + h * .1); g.lineTo(0, h * .08); g.lineTo(w / 2 - w * .06, -h / 2 + h * .1); g.stroke();
  g.restore();
}

// ---------------- HUD text: slides up into place, leaves by fading ----------------
function hud(s, x, y, o, tin, tout = 1e9, dy = 16) {
  const a = eo(seg(T_NOW, tin, tin + .38)) * (1 - seg(T_NOW, tout, tout + .3));
  if (a <= 0) return;
  text(s, x, y + dy * (1 - eo(seg(T_NOW, tin, tin + .45))), { ...o, a });
}
let T_NOW = 0;

// =============================== W1: S1 + S2 ===============================
const S0 = 360;
const ROWS_GY = [-1080, -460, 160, 780], ROWS_DX = [-60, 40, -20, 0];
// row 3 = the S1 chain (you → stranger); rows 0–2 pop in during the pull-back
const R3 = { xs: S1.xs, gy: 780 };
// letters (S2): start time per row, failing link (0 = arrives)
const LET = [{ s: 12.0, fail: 2 }, { s: 11.85, fail: 4 }, { s: 12.25, fail: 5 }, { s: 12.6, fail: 0 }];
const HOP = .62, MOVE = .38;                                          // per handshake: travel .38 s, then .24 s in someone's hand
const letAt = (r, k) => LET[r].s + (k - 1) * HOP;                    // envelope leaves person k-1 along link k
const ARRIVE = letAt(3, 6) + MOVE;                                   // ≈ 16.08
const COUNT5 = 21.2;                                                  // "about five people": the five in between light up
function s1Full(i, t) {
  const p = s1Target(i, Math.min(t, 9.9));
  if (t > 9.9) {                                                     // after the hook: arms back down, idle
    const q = idle(i + 30, t), u = ss(seg(t, 9.9, 10.5));
    for (const k of KEYS) if (k in q) p[k] = lerp(p[k], q[k], u);
  }
  // envelope passes: a small dip when it lands in this person's hand
  for (let k = 1; k <= 6; k++) { const ta = letAt(3, k) + MOVE; if (i === k) { p.hy += .02 * bell(t, ta - .05, ta + .3); p.head += .06 * bell(t, ta - .05, ta + .4); } }
  if (i === 6) { const h = Math.sin(Math.PI * seg(t, ARRIVE + .02, ARRIVE + .26)); if (h > 0) { p.lfy = p.rfy = .05 * h; p.hy -= .05 * h; } }
  return p;
}
let SIM1 = null;
const W1P = [], W1L = [];                                             // per row: people and links
ROWS_GY.forEach((gy, r) => {
  const P = [], Ls = [];
  for (let i = 0; i < 7; i++) {
    const x = (r === 3 ? S1.xs[i] : S1.xs[i] + ROWS_DX[r]);
    const appear = r === 3 ? S1.appear[i] : 9.85 + r * .14 + i * .045;
    const e = { x, y: gy, rot: 0, S: S0, appear };
    if (r === 3) {
      e.pose = T => SIM1.at(Math.min(T, 24.4))[i];
      if (i === 0) { e.col = () => C.sig; e.fill = () => C.sig; }
      else if (i === 6) { e.col = T => T < 10.2 ? mix(C.ink, C.sig, ss(seg(T, S1.P1 - .02, S1.P1 + .1))) : mix(C.sig, C.ink, ss(seg(T, 10.2, 10.7))) ;
        e.fill = T => T < 10.2 ? mix(C.paper, C.sig, ss(seg(T, S1.P1 - .02, S1.P1 + .1))) : T < ARRIVE ? mix(C.sig, C.paper, ss(seg(T, 10.2, 10.7))) : mix(C.paper, C.sig, ss(seg(T, ARRIVE, ARRIVE + .12))); }
      else { const t0 = COUNT5 + .12 * (i - 1); e.col = T => mix(C.ink, C.sig, ss(seg(T, t0, t0 + .15)) * (1 - ss(seg(T, 22.6, 23.1)))); e.fill = () => C.paper; }
    } else {
      e.pose = T => {
        const p = idle(r * 7 + i, T);
        for (let k = 1; k <= 6; k++) { const ta = letAt(r, k) + MOVE; if (i === k && (!LET[r].fail || k < LET[r].fail)) p.hy += .02 * bell(T, ta - .05, ta + .3); }
        if (LET[r].fail) {                                          // the one who let go looks down at the dropped letter
          const ft = letAt(r, LET[r].fail) + MOVE * .5, who = LET[r].fail - 1;
          if (i === who) { const u = ss(seg(T, ft + .1, ft + .5)); p.head += .35 * u; p.lean += .08 * u; p.hy += .015 * u; }
        }
        return p;
      };
      e.col = () => C.ink; e.fill = () => C.paper;
    }
    P.push(e);
  }
  for (let k = 1; k <= 6; k++) {
    const L = { a: k - 1, b: k };
    if (r === 3) {
      L.c = S1.clasp[k - 1];
      L.sag = T => { const lifted = lerp(.17, -.085, popS(T - S1.liftAt(k), 19, .5)); return T < 9.9 ? lifted : lerp(lifted, .17, eio(seg(T, 9.9, 10.6))); };
      L.over = [{ t0: S1.pulseAt(k - 1), t1: S1.pulseAt(k), f0: 10.1, f1: 10.7 }, { t0: letAt(3, k), t1: letAt(3, k) + MOVE }];
    } else {
      L.c = 10.2 + r * .14 + k * .07;
      L.sag = T => .17 + .01 * Math.sin(T * 1.3 + k + r);
      if (LET[r].fail === k) L.rel = letAt(r, k) + MOVE * .5;
      L.over = [{ t0: letAt(r, k), t1: letAt(r, k) + (LET[r].fail === k ? MOVE * .5 : MOVE) }];
      if (LET[r].fail && k > LET[r].fail) L.over = [];
    }
    Ls.push(L);
  }
  W1P.push(P); W1L.push(Ls);
});
function drawW1(T) {
  const lineDraw = eio(seg(T, 0, .85));
  // system lines (row 3 draws in at the start; the others with their row)
  ROWS_GY.forEach((gy, r) => {
    const x0 = W1P[r][0].x - 160, x1 = W1P[r][6].x + 160, ly = gy + 40;
    const u = r === 3 ? lineDraw : eio(seg(T, 9.85 + r * .14, 10.6 + r * .14));
    if (u <= 0) return;
    g.save(); g.lineCap = 'round'; g.strokeStyle = C.tint; g.lineWidth = LW; g.beginPath(); g.moveTo(x0, ly); g.lineTo(lerp(x0, x1, u), ly); g.stroke(); g.restore();
    // nodes between people: grow at each handshake, red when the red has passed
    for (let k = 1; k <= 6; k++) {
      const L = W1L[r][k - 1], x = (W1P[r][k - 1].x + W1P[r][k].x) / 2, on = popS(T - L.c, 20, .5); if (on <= 0) continue;
      let red = 0;
      if (r === 3) red = ss(seg(T, S1.pulseAt(k - .5) - .02, S1.pulseAt(k - .5) + .08)) * (1 - ss(seg(T, 10.1, 10.7)));
      const tl = letAt(r, k) + MOVE * .5, ok = !LET[r].fail || k < LET[r].fail;
      if (ok) red = Math.max(red, ss(seg(T, tl - .02, tl + .08)));
      g.beginPath(); g.arc(x, ly, (8.5 + 4 * (r === 3 ? bell(T, S1.pulseAt(k - .5) - .02, S1.pulseAt(k - .5) + .3) : 0)) * on, 0, TAU);
      g.fillStyle = mix(C.tint, C.sig, red); g.fill();
      if (r === 3) { const tp = S1.pulseAt(k - .5), na = ss(seg(T, tp, tp + .18)) * (1 - ss(seg(T, 9.7, 10.05)));
        if (na > 0) text(String(k), x, ly + 58 + 10 * (1 - ss(seg(T, tp, tp + .18))), { size: 32, w: 600, col: C.sig, align: 'center', a: na }); }
    }
  });
  // names at the two ends of the hook chain (world space; they leave before the pull-back makes them small)
  const nameA = (t0) => ss(seg(T, t0 + .25, t0 + .6)) * (1 - ss(seg(T, 9.6, 9.95)));
  const ya = nameA(S1.appear[0]), sa = nameA(S1.appear[6]);
  text('YOU', R3.xs[0] - 96, R3.gy - 150, { size: 22, w: 600, col: C.mute, align: 'right', track: 3, a: ya });
  text('你', R3.xs[0] - 96, R3.gy - 104, { size: 34, w: 400, font: ZH, col: C.mute, align: 'right', a: ya });
  text('A STRANGER', R3.xs[6] + 96, R3.gy - 150, { size: 22, w: 600, col: C.mute, align: 'left', track: 3, a: sa });
  text('陌生人', R3.xs[6] + 96, R3.gy - 104, { size: 34, w: 400, font: ZH, col: C.mute, align: 'left', a: sa });
  // people + hands; non-focus people fade towards paper when the camera pushes into "you" (focus shift)
  // focus shift before S3: everyone but "you" fades out, "you" lets go and stays
  const dim = ss(seg(T, 22.9, 23.7));
  const groups = W1P.map((P, r) => drawGroup(P, W1L[r], T, { alpha: 1 - dim }));
  if (dim > 0) {
    const e = W1P[3][0], j = groups[3].J[0];
    g.save(); g.globalAlpha = dim; g.translate(e.x, e.y); figure({ x: 0, gy: 0, S: j.S, col: C.sig, fill: C.sig }, j.p); g.restore();
  }
  // envelopes
  LET.forEach((Lt, r) => {
    const G = groups[r].G, P = W1P[r];
    if (T < Lt.s - .4 || T > 23.6) return;
    const W_ = 86, J = groups[r].J;
    let pos = null, ang = 0, grey = false;
    const kNow = clamp(Math.floor((T - Lt.s) / HOP) + 1, 1, 6), local = T - letAt(r, kNow);
    const chest = i => J[i] ? [J[i].Sh[0], J[i].Sh[1] + J[i].S * .2] : null;     // held in front of the body
    const geoOf = k => { const it = G.find(([L]) => L.b === k); return it ? it[1] : null; };
    if (T < Lt.s) pos = chest(0);
    else if (Lt.fail && T >= letAt(r, Lt.fail) + MOVE * .5) {         // dropped: falls to the line, greys out
      const ft = letAt(r, Lt.fail) + MOVE * .5, x = (P[Lt.fail - 1].x + P[Lt.fail].x) / 2;
      const y0 = ROWS_GY[r] - S0 * .5, y1 = ROWS_GY[r] + 40 - W_ * .34 - 4, u = clamp((T - ft) / .5);
      pos = [x + 30 * u, lerp(y0, y1, u * u)]; ang = .5 * u + .3 * Math.sin(u * 7) * (1 - u); grey = T > ft + .45;
    } else if (local < MOVE && !(T >= ARRIVE && !Lt.fail)) {         // hand to hand: chest → the joined hands → the next chest
      const geo = geoOf(kNow), A = chest(kNow - 1), B = chest(kNow);
      if (geo && A && B) { const u = eio(local / MOVE), ctl = (Lt.fail === kNow) ? geo.Pc : V.add(geo.Pc, [0, -30]);
        pos = qpt(A, ctl, B, Lt.fail === kNow ? Math.min(u, .5) : u); const d = qder(A, ctl, B, u); ang = Math.atan2(d[1], d[0]) * .3; }
    } else pos = chest(T >= ARRIVE && !Lt.fail ? 6 : kNow);
    if (pos) envelope(pos[0], pos[1], W_, ang, grey);
  });
  // "about five people": numbers over the five in between, on the arriving chain
  for (let i = 1; i <= 5; i++) {
    const t0 = COUNT5 + .12 * (i - 1), a = ss(seg(T, t0, t0 + .16)) * (1 - ss(seg(T, 23.0, 23.4)));
    if (a > 0) text(String(i), W1P[3][i].x, R3.gy - S0 * 1.08 + 20 * (1 - eo(seg(T, t0, t0 + .3))), { size: 92, w: 600, col: C.sig, align: 'center', a });
  }
}
// W1 camera: S1 still → pull back to the four chains → slow drift → push into "you"
const CAM2 = { x: 1446, y: -166, z: .37 };
const YOU1 = [S1.xs[0], R3.gy - S0 * .5];
function camW1(T) {
  if (T < 9.65) return { x: 960, y: 540, z: 1 };
  if (T < 11.7) { const u = eio(seg(T, 9.65, 11.7)); return { x: lerp(960, CAM2.x, u), y: lerp(540, CAM2.y, u), z: lerpZ(1, CAM2.z, u) }; }
  const drift = seg(T, 11.7, 22.8);
  const base = { x: CAM2.x - 30 * drift, y: CAM2.y + 25 * drift, z: CAM2.z * (1 + .012 * drift) };
  if (T < 22.8) return base;
  const u = eio(seg(T, 22.8, 24.0));
  return { x: lerp(base.x, YOU1[0], u), y: lerp(base.y, YOU1[1], u), z: lerpZ(base.z, 1.25, u) };
}

// =============================== W3: S3 rings ===============================
const GR = 2.5, RING_N = 16, R1 = 430, SR1 = 300;
const C3 = YOU1.slice();                                              // ring centre = your body
const RING_T = [24.75, 29.45, 33.3, 33.9, 34.55];               // outer rings pop in once the camera has nearly framed them                      // each ring starts forming
const ZR = k => 390 / ((R1 + SR1) * Math.pow(GR, k));                 // zoom that frames ring k (0-based)
const RINGS = RING_T.map((A, k) => {
  const R = R1 * Math.pow(GR, k), S = SR1 * Math.pow(GR, k), P = [], Ls = [], red = k === 4;
  const sweep = k < 2 ? .55 : .42;
  for (let i = 0; i < RING_N; i++) {
    const th = TAU * i / RING_N + (k % 2 ? Math.PI / RING_N : 0);
    P.push({ x: C3[0] + R * Math.sin(th), y: C3[1] - R * Math.cos(th), rot: th, S, lws: S / 360 * .97, appear: A + sweep * i / RING_N,
      pose: T => idle(k * 20 + i, T), col: () => red ? C.sig : C.ink, fill: () => C.paper });
  }
  const close = A + .25 + sweep + .08;
  for (let i = 0; i < RING_N; i++) {
    const L = { a: i, b: (i + 1) % RING_N, c: i === RING_N - 1 ? close : A + .25 + sweep * (i + 1) / RING_N, sag: T => .17 };
    // when the ring closes, a red flash runs round it from the closing pair
    const ord = (RING_N - 1 - i + RING_N) % RING_N, half = RING_N / 2;
    const dd = Math.min(ord, RING_N - ord), t0 = close + .02 + dd * .035;
    L.over = red ? [] : [{ t0, t1: t0 + .05, f0: close + .75, f1: close + 1.2, rev: ord > half }];
    Ls.push(L);
  }
  return { R, S, P, Ls, A, close };
});
const YOU3 = { x: S1.xs[0], y: R3.gy, rot: 0, S: S0, appear: -1, pose: T => T < 24.4 ? SIM1.at(T)[0] : idle(30, T), col: () => C.sig, fill: () => C.sig };
function drawW3(T) {
  const away = 1 - ss(seg(T, 37.42, 37.6));                           // the rings step aside as we dive into your head
  for (let k = RINGS.length - 1; k >= 0; k--) drawGroup(RINGS[k].P, RINGS[k].Ls, T, { alpha: away });
  drawGroup([YOU3], [], T);
}
const YOU3_HEAD = [S1.xs[0], R3.gy - S0 * (GEO.hipH + GEO.spine + GEO.headR)];
function camW3(T) {
  const off = (800 - 960);                                            // keep the rings left of centre: the count lives on the right
  let z;
  if (T < 25.4) z = lerpZ(1.25, ZR(0), eio(seg(T, 24.0, 25.4)));
  else if (T < 29.35) z = ZR(0);
  else if (T < 32.9) z = lerpZ(ZR(0), ZR(1), eio(seg(T, 29.35, 30.5)));
  else if (T < 33.5) z = lerpZ(ZR(1), ZR(2), eio(seg(T, 32.9, 33.5)));
  else if (T < 34.1) z = lerpZ(ZR(2), ZR(3), eio(seg(T, 33.5, 34.1)));
  else z = lerpZ(ZR(3), ZR(4), eio(seg(T, 34.1, 34.85)));
  z *= 1 + .035 * seg(T, 34.85, 37.15);                                // a slow push while the count holds
  const u0 = eio(seg(T, 24.0, 25.4));
  let cx = lerp(YOU1[0], C3[0] - off / z, u0), cy = lerp(YOU1[1], C3[1] + 20 / z, u0);
  if (T > 37.15) {                                                    // dive into your red head: the head glides to the centre while we zoom
    const u = seg(T, 37.15, 37.75), zz = lerpZ(z, 75, u * u * u);
    const s0 = [(YOU3_HEAD[0] - cx) * z + 960, (YOU3_HEAD[1] - cy) * z + 540], sc_ = L2D(s0, [960, 540], eio(Math.min(1, u * 1.6)));
    return { x: YOU3_HEAD[0] - (sc_[0] - 960) / zz, y: YOU3_HEAD[1] - (sc_[1] - 540) / zz, z: zz };
  }
  return { x: cx, y: cy, z };
}

// =============================== W4: S4 three chains ===============================
const U4 = 118, S4S = 170, X4 = 560;
const ROW4 = [
  { gy: 360, steps: 6.0, start: 37.5, year: '1967', sub: 'letters, hand to hand', val: '≈6' },
  { gy: 590, steps: 4.74, start: 38.95, year: '2011', sub: 'Facebook · 721 million people', val: '4.74' },
  { gy: 820, steps: 3.57, start: 40.3, year: '2016', sub: 'Facebook · 1.6 billion people', val: '3.57' },
];
ROW4.forEach((R, r) => {
  const n = Math.ceil(R.steps) + 1, xs = [];
  for (let i = 0; i < n; i++) xs.push(X4 + U4 * Math.min(i, R.steps));
  const step = r === 0 ? .075 : .1;
  R.done = R.start + .12 + step * (n - 1) + .2;                      // last handshake
  R.pulse = [R.done + .05, R.done + .05 + .07 * (n - 1)];
  R.P = xs.map((x, i) => ({ x, y: R.gy, rot: 0, S: S4S, appear: i === 0 ? R.start - (r === 0 ? .5 : 0) : R.start + .12 + step * (i - 1),
    pose: T => { const p = idle(r * 9 + i + 50, T); if (i === n - 1) { const h = Math.sin(Math.PI * seg(T, R.pulse[1], R.pulse[1] + .22)); if (h > 0) { p.lfy = p.rfy = .05 * h; p.hy -= .05 * h; } } return p; },
    col: i === 0 ? () => C.sig : i === n - 1 ? T => mix(C.ink, C.sig, ss(seg(T, R.pulse[1] - .02, R.pulse[1] + .1))) : () => C.ink,
    fill: i === 0 ? () => C.sig : i === n - 1 ? T => mix(C.paper, C.sig, ss(seg(T, R.pulse[1] - .02, R.pulse[1] + .1))) : () => C.paper }));
  R.Ls = [];
  for (let k = 1; k < n; k++) {
    const c = R.start + .12 + step * (k - 1) + .2, pt = R.pulse[0] + (R.pulse[1] - R.pulse[0]) * (k - 1) / (n - 1), pt1 = R.pulse[0] + (R.pulse[1] - R.pulse[0]) * k / (n - 1);
    R.Ls.push({ a: k - 1, b: k, c, sag: T => .17, over: [{ t0: pt, t1: pt1 }] });
  }
  R.xEnd = xs[n - 1];
});
const BEND = [44.55, 45.55];                                          // the last chain bends onto the globe
function drawW4(T) {
  const fade = 1 - ss(seg(T, 44.3, 44.8));
  ROW4.forEach((R, r) => {
    const a = r === 2 ? 1 : fade; if (a <= 0) return;
    // a thin base line under each chain = its length
    const lu = eio(seg(T, R.start, R.done + .1));
    if (r < 2 || T < BEND[0]) { g.save(); g.globalAlpha = a; g.strokeStyle = C.tint; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(X4 - 40, R.gy + 24); g.lineTo(lerp(X4 - 40, R.xEnd + 40, lu), R.gy + 24); g.stroke(); g.restore(); }
    if (r < 2 || T < BEND[0]) drawGroup(R.P, R.Ls, T, { alpha: a });
  });
}
function hudW4(T) {
  const out = 44.3;
  hud('AVERAGE STEPS BETWEEN ANY TWO PEOPLE', 124, 118, { size: 22, w: 500, col: C.mute, track: 3 }, 38.4, out);
  ROW4.forEach((R, r) => {
    const tin = R.start + .1;
    hud(R.year, 124, R.gy - 52, { size: 64, w: 600, col: C.ink, track: -1 }, tin, out);
    hud(R.sub, 126, R.gy - 12, { size: 24, w: 500, col: C.mute }, tin + .08, out);
    const vin = R.pulse[1] - .05;
    hud(R.val, R.xEnd + 92, R.gy - 40, { size: 76, w: 600, col: r === 2 ? C.sig : C.ink, track: -1 }, vin, out);
    hud('steps', R.xEnd + 96, R.gy - 4, { size: 24, w: 500, col: C.mute, track: 1 }, vin + .1, out);
  });
  hud('Travers & Milgram 1969  ·  Backstrom et al. 2012  ·  Facebook Research 2016', 1800, 912, { size: 18, w: 500, col: C.mute, align: 'right', track: .5 }, 38.6, out);
}
const R4H = [X4, ROW4[0].gy - S4S * (GEO.hipH + GEO.spine + GEO.headR)];
function camW4(T) {
  if (T < 38.55) { const u = seg(T, 37.75, 38.55); return { x: lerp(R4H[0], 960, eio(u)), y: lerp(R4H[1], 540, eio(u)), z: lerpZ(150, 1, eo(u)) }; }
  return { x: 960, y: 540 + 8 * seg(T, 38.55, 44.4), z: 1 + .025 * seg(T, 38.55, 44.4) };
}

// =============================== W5: S5 the globe ===============================
const R5row = ROW4[2], NR5 = R5row.P.length;                         // 5 people: you … stranger (3.57 steps)
const XC5 = (X4 + R5row.xEnd) / 2, GLOBE_R = 751, G5 = [XC5, R5row.gy + GLOBE_R];
const SIDE = 17, DTH = (TAU - (R5row.xEnd - X4) / GLOBE_R) / (2 * SIDE + 1);
const GROW0 = 45.5, GSTEP = .075, CLOSE5 = GROW0 + (SIDE - 1) * GSTEP + .32;   // ≈ 47.02
const PULSE5 = [CLOSE5 + .05, CLOSE5 + .95], LIFT5 = 48.05;
const W5P = [], W5L = [];
(function buildGlobe() {
  // the chain from S4 (bends from its straight line onto the arc)
  const th0 = (X4 - XC5) / GLOBE_R, th1 = (R5row.xEnd - XC5) / GLOBE_R;
  const order = [];                                                   // clockwise order of everyone on the globe
  R5row.P.forEach((e, i) => order.push({ src: e, th: (e.x - XC5) / GLOBE_R, i }));
  for (let j = 1; j <= SIDE; j++) order.push({ th: th1 + j * DTH, j, side: 1 });
  for (let j = SIDE; j >= 1; j--) order.push({ th: th0 - j * DTH + TAU, j, side: -1 });
  order.forEach((o, n) => {
    const th = o.th, onArc = [G5[0] + GLOBE_R * Math.sin(th), G5[1] - GLOBE_R * Math.cos(th)];
    const e = { S: S4S, pose: T => idle(n + 80, T) };
    if (o.src) {
      const line = [o.src.x, o.src.y];
      Object.defineProperty(e, 'x', { get: () => lerp(line[0], onArc[0], eio(seg(T_NOW, BEND[0], BEND[1]))) });
      Object.defineProperty(e, 'y', { get: () => lerp(line[1], onArc[1], eio(seg(T_NOW, BEND[0], BEND[1]))) });
      Object.defineProperty(e, 'rot', { get: () => th * eio(seg(T_NOW, BEND[0], BEND[1])) });
      e.appear = o.src.appear; e.col = o.src.col; e.fill = o.src.fill; e.pose = o.src.pose; e.you = o.i === 0;
    } else {
      e.x = onArc[0]; e.y = onArc[1]; e.rot = th; e.appear = GROW0 + (o.j - 1) * GSTEP;
      e.col = () => C.ink; e.fill = () => C.paper;
    }
    // lines thicken as the camera pulls back to the whole globe, so the crowd still reads
    const lw0 = clamp(Math.sqrt(S4S / 380), .6, 1.05);
    Object.defineProperty(e, 'lws', { get: () => lerp(lw0, 1.2, eio(seg(T_NOW, 45.7, 47.2))) });
    e.th = th; W5P.push(e);
  });
  const N = W5P.length, you = 0;
  for (let n = 0; n < N; n++) {
    const a = n, b = (n + 1) % N;
    // order: chain 0..4 (you … stranger), then the clockwise side, then the anticlockwise side back to you
    const CL = NR5 - 1 + SIDE, last = N - 1;                          // CL = the bottom handshake that closes the circle
    let c;
    if (n < NR5 - 1) c = R5row.Ls[n].c;
    else if (n === CL) c = CLOSE5;
    else if (n < CL) c = GROW0 + (n - (NR5 - 1)) * GSTEP + .18;         // growing clockwise from the stranger
    else c = GROW0 + (last - n) * GSTEP + .18;                        // growing anticlockwise from you
    // red runs from you both ways round the globe
    const cw = n <= CL, d = cw ? n : last - n, step = (PULSE5[1] - PULSE5[0]) / (CL + 1);
    const t0 = PULSE5[0] + d * step, t1 = t0 + step;
    const over = n < NR5 - 1 ? [...R5row.Ls[n].over.map(o => ({ ...o })), { t0, t1 }] : [{ t0, t1, rev: !cw }];
    const lt = LIFT5 + .022 * d;
    W5L.push({ a, b, c, sag: T => lerp(.17, -.085, popS(T - lt, 19, .5)), over });
  }
})();
function drawW5(T) {
  // the globe: the chain's base line becomes the globe's outline, then the globe fills when the circle closes
  const bend = eio(seg(T, BEND[0], BEND[1]));
  const grown = clamp((T - GROW0) / (CLOSE5 - GROW0));
  const th0 = (X4 - XC5) / GLOBE_R - .12, th1 = (R5row.xEnd - XC5) / GLOBE_R + .12;
  const span = lerp(0, Math.PI - th1, grown);
  g.save(); g.lineCap = 'round';
  const fill = ss(seg(T, CLOSE5, CLOSE5 + .5));
  if (fill > 0) { g.fillStyle = mix(C.paper, '#E9E4DA', fill); g.beginPath(); g.arc(G5[0], G5[1], (GLOBE_R - 24) * lerp(.94, 1, eo(seg(T, CLOSE5, CLOSE5 + .6))), 0, TAU); g.fill(); }
  g.strokeStyle = C.tint; g.lineWidth = 5;
  if (bend < 1) {                                                      // straight base line bending into an arc
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const x = lerp(X4 - 40, R5row.xEnd + 40, i / 40), th = (x - XC5) / GLOBE_R;
      const L = [x, R5row.gy + 24], A = [G5[0] + (GLOBE_R - 24) * Math.sin(th), G5[1] - (GLOBE_R - 24) * Math.cos(th)], p = L2D(L, A, bend);
      i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    g.stroke();
  } else {
    g.beginPath(); g.arc(G5[0], G5[1], GLOBE_R - 24, th0 - span - Math.PI / 2, th1 + span - Math.PI / 2); g.stroke();
  }
  g.restore();
  drawGroup(W5P, W5L, T);
}
function camW5(T) {
  const zG = 440 / (GLOBE_R + S4S);
  const c4 = camW4(Math.min(T, 44.4));
  const chainC = [XC5, R5row.gy - S4S * .5];
  if (T < 45.65) { const u = eio(seg(T, 44.4, 45.65)); return { x: lerp(c4.x, chainC[0], u), y: lerp(c4.y, chainC[1], u), z: lerpZ(c4.z, 1.35, u) }; }
  const u = eio(seg(T, 45.65, 47.3));
  const end = { x: G5[0], y: G5[1] + (540 - 492) / zG, z: zG };
  const z = lerpZ(1.35, end.z, u) * (1 + .03 * Math.max(0, T - 47.3) / 2.7);   // the slow push keeps going under the end card
  return { x: lerp(chainC[0], end.x, u), y: lerp(chainC[1], end.y, u), z };
}

// =============================== HUD per shot ===============================
function hudS1(T) {
  const out = 9.62;
  hud('EP. 05   ·   NETWORKS', 124, 118, { size: 22, w: 500, col: C.mute, track: 3 }, .3, out, 10);
  hud('How many hands between', 116, 214, { size: 84, w: 600, track: -2 }, .95, out);
  g.save(); g.font = '600 84px Jost'; g.letterSpacing = '-2px'; const wy = g.measureText('you and ').width; g.restore();
  hud('you and ', 116, 308, { size: 84, w: 600, track: -2 }, 1.1, out);
  hud('anyone?', 116 + wy, 308, { size: 84, w: 600, track: -2, col: C.sig }, 1.1, out);
  hud('Six, they say.', 1800, 308, { size: 84, w: 600, track: -2, col: C.sig, align: 'right' }, S1.P1, out);
}
function hudS2(T) {
  const out = 23.3;
  hud('1967   ·   THE LETTER TEST', 124, 118, { size: 22, w: 500, col: C.mute, track: 3 }, 10.6, out);
  hud('FROM', 500, 470, { size: 20, w: 600, col: C.mute, align: 'right', track: 3 }, 11.5, out);
  hud('Nebraska', 500, 512, { size: 40, w: 600, col: C.ink, align: 'right', track: -.5 }, 11.6, out);
  hud('TO', 1068, 470, { size: 20, w: 600, col: C.mute, track: 3 }, 11.7, out);
  hud('Boston', 1066, 512, { size: 40, w: 600, col: C.ink, track: -.5 }, 11.8, out);
  hud('a letter, passed only to', 1068, 556, { size: 22, w: 500, col: C.mute }, 15.3, out);
  hud('someone you know', 1068, 584, { size: 22, w: 500, col: C.mute }, 15.4, out);
  // verdict column
  const x = 1330;
  hud('64', x - 6, 330, { size: 150, w: 600, col: C.sig, track: -4 }, 19.55, out, 22);
  g.save(); g.font = '600 150px Jost'; g.letterSpacing = '-4px'; const w64 = g.measureText('64').width; g.restore();
  hud('/ 296', x + w64 + 6, 330, { size: 56, w: 500, col: C.mute }, 19.7, out);
  hud('letters arrived', x, 380, { size: 32, w: 500, col: C.ink }, 19.8, out);
  hud('296 封信，送到 64 封', x, 428, { size: 34, w: 400, font: ZH, col: C.mute }, 19.9, out);
  hud('5.2', x - 6, 620, { size: 150, w: 600, col: C.ink, track: -4 }, 20.3, out, 22);
  hud('people in between,', x, 670, { size: 32, w: 500, col: C.ink }, 20.4, out);
  hud('on average', x, 708, { size: 32, w: 500, col: C.ink }, 20.45, out);
  hud('中间平均 5.2 人', x, 756, { size: 34, w: 400, font: ZH, col: C.mute }, 20.45, out);
  hud('Travers & Milgram 1969', x, 812, { size: 18, w: 500, col: C.mute, track: .5 }, 20.5, out);
}
const COUNT = [['1', '100', 28.4], ['2', '10,000', 30.84], ['3', '1,000,000', 33.35], ['4', '100,000,000', 33.95], ['5', '10,000,000,000', 34.6]];
function hudS3(T) {
  const out = 37.6;
  hud('Why so few?', 116, 214, { size: 84, w: 600, track: -2 }, 23.95, 28.0);
  hud('STEPS OUT', 1310, 250, { size: 20, w: 600, col: C.mute, track: 3 }, 28.2, out);
  hud('PEOPLE', 1800, 250, { size: 20, w: 600, col: C.mute, track: 3, align: 'right' }, 28.2, out);
  COUNT.forEach(([k, n, t], i) => {
    const y = 318 + i * 74, last = i === 4;
    hud(k, 1312, y, { size: 44, w: 600, col: last ? C.sig : C.mute }, t, out, 0);
    hud(n, 1800, y, { size: last ? 52 : 44, w: 600, col: last ? C.sig : C.ink, align: 'right', track: -.5 }, t, out, 0);
  });
  // the comparison: a rule, then Earth
  const ru = eo(seg(T, 34.6, 35.0)) * (1 - seg(T, out, out + .3));
  if (ru > 0) { g.save(); g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(1312, 680); g.lineTo(lerp(1312, 1800, ru), 680); g.stroke(); g.restore(); }
  hud('Earth', 1312, 740, { size: 44, w: 600, col: C.ink }, 34.7, out, 0);
  hud('8,200,000,000', 1800, 740, { size: 44, w: 600, col: C.ink, align: 'right', track: -.5 }, 34.7, out, 0);
  hud('illustrative · ignores overlap · UN 2024', 1312, 790, { size: 18, w: 500, col: C.mute, track: .5 }, 28.6, out);
}
// slides in from the right as the number is said ("count" rows): a little horizontal slide for the numbers
function hudS5(T) {
  const t0 = 46.95, up = 46 * eio(seg(T, 48.65, 49.25));                // the title makes room for the end card
  const a = eo(seg(T, t0, t0 + .5)), b = eo(seg(T, t0 + .12, t0 + .62)), c = eo(seg(T, t0 + .1, t0 + .6));
  text('Closer than', 960, 470 - up + 18 * (1 - a), { size: 92, w: 600, track: -2.5, align: 'center', a });
  text('you think.', 960, 566 - up + 18 * (1 - b), { size: 92, w: 600, track: -2.5, align: 'center', col: C.sig, a: b });
  text('比你想的更近', 960, 628 - up + 12 * (1 - c), { size: 36, w: 400, font: ZH, col: C.mute, align: 'center', a: c });
  // end card, written on the globe under the title: film, style, credit
  const d = eo(seg(T, 48.75, 49.2));
  if (d > 0) { g.save(); g.strokeStyle = C.tint; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(960 - 28 * d, 626); g.lineTo(960 + 28 * d, 626); g.stroke(); g.restore(); }
  const pair = (en, zh, y, eo_, t) => {
    const k = eo(seg(T, t, t + .4)); if (k <= 0) return;
    g.save(); g.font = `${eo_.w} ${eo_.size}px Jost`; g.letterSpacing = (eo_.track || 0) + 'px'; const we = g.measureText(en).width;
    g.font = `400 34px ${ZH}`; g.letterSpacing = '0px'; const wz = zh ? g.measureText(zh).width : 0; g.restore();
    const gap = zh ? 16 : 0, x0 = 960 - (we + gap + wz) / 2, dy = 12 * (1 - k);
    text(en, x0, y + dy, { ...eo_, a: k });
    if (zh) text(zh, x0 + we + gap, y + dy, { size: 34, w: 400, font: ZH, col: C.mute, a: k });
  };
  pair('Six Hands Away', '隔着几只手', 676, { size: 30, w: 600, col: C.ink, track: -.5 }, 48.8);
  pair('Stick-figure Explainer', '火柴人讲解', 722, { size: 26, w: 500, col: C.mute }, 48.9);
  pair('LemoLab × Claude Opus 5.5', '', 772, { size: 30, w: 600, col: C.ink, track: .5 }, 49.0);
}

// subtitles: bottom-left, one Chinese line and one English line, no box (the paper is clean); never over the subject
function drawSubs(T) {
  const s = SUBS.find(s => T >= s.t0 && T < s.t1); if (!s) return;
  const a = ss(seg(T, s.t0, s.t0 + .12)) * (1 - ss(seg(T, s.t1 - .12, s.t1)));
  const keep = TXT; TXT = null;                                      // subtitles are checked from the .srt, not by readcheck
  g.save(); g.fillStyle = C.sig; g.globalAlpha = a; g.fillRect(124, 965, 4, 70); g.restore();
  text(s.zh, 146, 994, { size: 36, w: 500, font: ZH, col: C.ink, a });
  text(s.en, 147, 1032, { size: 25, w: 500, col: C.mute, a });
  TXT = keep;
}

// =============================== timeline ===============================
// which world, and its camera, at film second T
function worldAt(T) { return T < 24.0 ? 1 : T < 37.75 ? 3 : T < 44.4 ? 4 : 5; }
function render(T) {
  T_NOW = T;
  paper();
  const w = worldAt(T), cam = w === 1 ? camW1(T) : w === 3 ? camW3(T) : w === 4 ? camW4(T) : camW5(T);
  g.save(); g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z);
  if (w === 1) drawW1(T); else if (w === 3) drawW3(T); else if (w === 4) drawW4(T); else { if (T < BEND[1] + .2) drawW4(T); drawW5(T); }
  g.restore();
  if (T < 10.2) hudS1(T);
  if (T >= 10.3 && T < 23.5) hudS2(T);
  if (T >= 23.9 && T < 37.95) hudS3(T);
  if (T >= 38.2 && T < 44.8) hudW4(T);
  if (T >= 46.9) hudS5(T);
  drawSubs(T);
}

// ---------------- sound events (film seconds; mix_full.py reads them) ----------------
function events() {
  const E = [];
  E.push({ t: 0, type: 'line', d: .85 });
  S1.appear.forEach((a, i) => E.push({ t: a, type: 'pop', pan: (S1.xs[i] - 960) / 960 }));
  S1.clasp.forEach((c, k) => { E.push({ t: c - .3, type: 'reach', pan: (S1.linkX(k + 1) - 960) / 960 }); E.push({ t: c, type: 'clasp', k: k + 1, pan: (S1.linkX(k + 1) - 960) / 960 }); });
  for (let k = 1; k <= 6; k++) E.push({ t: S1.pulseAt(k - .5), type: 'node', k, pan: (S1.linkX(k) - 960) / 960 });
  E.push({ t: S1.P0, type: 'pulse', d: S1.P1 - S1.P0 }); E.push({ t: S1.P1, type: 'arrive', pan: .6 }); E.push({ t: S1.LIFT, type: 'lift' });
  E.push({ t: 9.65, type: 'pullback', d: 2.05 });
  for (let r = 0; r < 3; r++) E.push({ t: 10.2 + r * .14, type: 'zip', d: .5, pan: -.2 + r * .2 });
  LET.forEach((L, r) => {
    for (let k = 1; k <= 6; k++) {
      if (L.fail && k > L.fail) break;
      const ta = letAt(r, k);
      if (L.fail === k) { E.push({ t: ta + MOVE * .5, type: 'drop', pan: -.3 + .2 * k / 6 }); break; }
      E.push({ t: ta + MOVE, type: 'hand', r, k, pan: -.4 + .8 * k / 6 });
    }
  });
  E.push({ t: ARRIVE, type: 'arrive2' });
  for (let i = 1; i <= 5; i++) E.push({ t: COUNT5 + .12 * (i - 1), type: 'count', k: i });
  E.push({ t: 22.8, type: 'pushin', d: 1.2 });
  RINGS.forEach((R, k) => { E.push({ t: R.A, type: 'ring', k, d: R.close - R.A }); E.push({ t: R.close, type: 'ringclose', k }); });
  COUNT.forEach(([k, n, t]) => E.push({ t, type: 'tally', k: +k }));
  E.push({ t: 34.7, type: 'earth' });
  E.push({ t: 37.15, type: 'dive', d: .6 }); E.push({ t: 37.75, type: 'redout' });
  ROW4.forEach((R, r) => { R.Ls.forEach((L, k) => E.push({ t: L.c, type: 'clasp4', r, k })); E.push({ t: R.pulse[0], type: 'pulse4', d: R.pulse[1] - R.pulse[0], r }); E.push({ t: R.pulse[1], type: 'val', r }); });
  E.push({ t: BEND[0], type: 'bend', d: BEND[1] - BEND[0] });
  for (let j = 1; j <= SIDE; j++) E.push({ t: GROW0 + (j - 1) * GSTEP + .18, type: 'grow', j });
  E.push({ t: CLOSE5, type: 'close' }); E.push({ t: PULSE5[0], type: 'pulse5', d: PULSE5[1] - PULSE5[0] }); E.push({ t: LIFT5, type: 'lift5' });
  E.push({ t: 46.95, type: 'title' }); E.push({ t: 49.0, type: 'sign' });
  VO.forEach(([id, t, d]) => E.push({ t, type: 'vo', id, d }));
  SUBS.forEach(su => E.push({ t: su.t0, type: 'sub', t1: su.t1, zh: su.zh, en: su.en }));
  return E.sort((a, b) => a.t - b.t);
}

// ---------------- page contract ----------------
SIM1 = simulate(7, s1Full, -1.5, 24.5);
window.DUR = TO - FROM;
window.render = t => render(FROM + t);
window.EV = events().filter(e => e.t >= FROM - 1e-6 && e.t <= TO + 1e-6).map(e => ({ ...e, t: e.t - FROM }));
window.TEXTS = t => { TXT = []; window.render(t); const o = TXT; TXT = null; return o.filter(o => o.x1 > 0 && o.x0 < W && o.y1 > 0 && o.y0 < H); };
FONTS_READY.then(() => { window.render(0); window.READY = true; });
})();
