// The plotter's program and its kinematics. plot.json (tools/make_plot.py) holds every stroke in plotting order (sheet mm, y down).
// Strokes tagged seg 'pre' were plotted before the film starts (black pen: frame, title, labels). The rest run as a program:
// pen changes at the rack, pen-up travel and pen-down ink, each with a trapezoidal velocity profile (real acceleration, real speed).
// plotState(P) → where the pen is and how much is drawn at plot time P (seconds of machine time).
export const PEN = { black: 0, brown: 1, grey: 2, red: 3 };
export const INK = ['rgba(22,22,28,0.94)', 'rgba(118,60,26,0.90)', 'rgba(104,102,98,0.70)', 'rgba(204,34,26,0.93)'];
export const NIB = [.30, .28, .20, .58];                  // line width per pen (mm)
export const RACK = k => [-24, 300 + k * 21];             // pen stall k (sheet mm), left of the sheet on the bed
export const HOME = [-24, 262];
const Z_UP = 3, Z_CARRY = 9;                              // holder height above the paper (mm): pen up while drawing, carrying to/from the rack
const VD = 90, AD = 1300, VU = 260, AU = 2600;           // pen-down / pen-up max speed (mm/s) and acceleration (mm/s²)
const T_DROP = .085, T_LIFT = .07, T_Z = .32, T_GRIP = .16;

// trapezoid: time for distance L, and distance covered at time τ
const tTrap = (L, v, a) => L <= 0 ? 0 : (L >= v * v / a ? L / v + v / a : 2 * Math.sqrt(L / a));
function sTrap(L, v, a, tau) {
  if (L <= 0) return 0;
  const T = tTrap(L, v, a); tau = Math.max(0, Math.min(T, tau));
  const ta = L >= v * v / a ? v / a : Math.sqrt(L / a), vp = a * ta;
  if (tau < ta) return .5 * a * tau * tau;
  if (tau > T - ta) { const r = T - tau; return L - .5 * a * r * r; }
  return .5 * a * ta * ta + vp * (tau - ta);
}
const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

export function buildProgram(D) {
  const S = D.strokes.map(s => ({ ...s, pts: Float32Array.from(s.pts) }));
  for (const s of S) { const p = s.pts; const cum = new Float32Array(p.length / 2); let L = 0;
    for (let j = 1; j < p.length / 2; j++) { L += Math.hypot(p[j * 2] - p[j * 2 - 2], p[j * 2 + 1] - p[j * 2 - 1]); cum[j] = L; }
    s.cum = cum; s.len = L; }
  const PRE = [], PROG = [];
  S.forEach((s, i) => (s.seg === 'pre' ? PRE : PROG).push(i));
  // ops: {t0, t1, type, ...}; nDone = number of PROG strokes completed before the op
  const ops = []; let t = 0, x = HOME[0] + 60, y = HOME[1] - 40, z = Z_CARRY, held = -1, nDone = 0;
  const push = o => { o.t0 = t; t += o.dur; o.t1 = t; o.nDone = nDone; o.held = held; ops.push(o); };
  const move = (x1, y1, z1, v = VU, a = AU) => { const L = Math.hypot(x1 - x, y1 - y); push({ type: 'move', x0: x, y0: y, z0: z, x1, y1, z1, L, v, a, dur: Math.max(.04, tTrap(L, v, a)) }); x = x1; y = y1; z = z1; };
  const zto = (z1, dur) => { push({ type: 'z', x0: x, y0: y, z0: z, z1, dur }); z = z1; };
  const grip = (pen, close) => { push({ type: 'grip', x0: x, y0: y, z0: z, pen, close, dur: T_GRIP }); held = close ? pen : -1; ops[ops.length - 1].heldAfter = held; };
  const marks = {};
  const mark = k => { if (!(k in marks)) marks[k] = t; };
  const swaps = [];   // {from, to, t0, tDrop (old pen released), tAt (over the new stall), tGrip (new pen clamped), t1}
  const swap = to => {
    const sw = { from: held, to, t0: t };
    if (held >= 0) { const [rx, ry] = RACK(held); if (z < Z_CARRY) zto(Z_CARRY, .2); move(rx, ry, Z_CARRY); zto(0, T_Z); grip(held, false); sw.tDrop = t; zto(Z_CARRY, T_Z); }
    const [rx, ry] = RACK(to); move(rx, ry, Z_CARRY); sw.tAt = t; zto(0, T_Z); grip(to, true); sw.tGrip = t; zto(Z_CARRY, T_Z); sw.t1 = t;
    swaps.push(sw);
  };
  for (let k = 0; k < PROG.length; k++) {
    const i = PROG[k], s = S[i];
    if (s.p !== held) swap(s.p);
    const sx = s.pts[0], sy = s.pts[1];
    mark(s.seg); if (s.lv && !(('lv' + s.lv) in marks)) marks['lv' + s.lv] = t; if (s.camp) marks['camp:' + s.seg + ':' + s.camp] = t;
    move(sx, sy, Z_UP);
    push({ type: 'drop', x0: x, y0: y, z0: Z_UP, z1: 0, dur: T_DROP, i, k });
    const v = s.seg === 'number' ? 125 : VD;
    push({ type: 'ink', i, k, L: s.len, v, a: AD, dur: Math.max(.02, tTrap(s.len, v, AD)) });
    x = s.pts[s.pts.length - 2]; y = s.pts[s.pts.length - 1];
    nDone = k + 1;
    push({ type: 'lift', x0: x, y0: y, z0: 0, z1: Z_UP, dur: T_LIFT, i, k });
    z = Z_UP;
    if (s.txt) marks['txtEnd:' + s.txt] = t;
    marks['end:' + s.seg] = t;
  }
  // put the last pen back and go home
  const park = { from: held, t0: t };
  { const [rx, ry] = RACK(held); zto(Z_CARRY, .2); move(rx, ry, Z_CARRY); zto(0, T_Z); grip(held, false); park.tDrop = t; zto(Z_CARRY, T_Z); move(HOME[0], HOME[1], Z_CARRY); park.t1 = t; }
  const T = t;
  const t0s = Float64Array.from(ops.map(o => o.t0));
  // first-op time of each PROG stroke (its pen-up travel), and ink start / end
  const inkStart = new Float64Array(PROG.length), inkEnd = new Float64Array(PROG.length);
  for (const o of ops) if (o.type === 'ink') { inkStart[o.k] = o.t0; inkEnd[o.k] = o.t1; }
  return { S, PRE, PROG, ops, t0s, T, marks, swaps, park, inkStart, inkEnd };
}

// pen point along a stroke at distance d (mm)
export function pointAt(s, d) {
  const c = s.cum, p = s.pts; let lo = 0, hi = c.length - 1;
  if (d <= 0) return [p[0], p[1], 0]; if (d >= s.len) return [p[p.length - 2], p[p.length - 1], c.length - 1];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= d) lo = m; else hi = m; }
  const f = (d - c[lo]) / Math.max(1e-9, c[hi] - c[lo]);
  return [p[lo * 2] + (p[hi * 2] - p[lo * 2]) * f, p[lo * 2 + 1] + (p[hi * 2 + 1] - p[lo * 2 + 1]) * f, lo];
}

// state at plot time P: { x, y, z (holder height mm), held, grip (0 open … 1 closed, while gripping), n (PROG strokes done), cur: {i, d} partial ink, v (mm/s), down }
export function plotState(G, P) {
  const { ops, t0s } = G;
  P = Math.max(0, Math.min(G.T, P));
  let lo = 0, hi = ops.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (t0s[m] <= P) lo = m; else hi = m - 1; }
  const o = ops[lo], tau = P - o.t0;
  const st = { n: o.nDone, held: o.held, grip: o.held >= 0 ? 1 : 0, cur: null, down: false, v: 0, op: o.type };
  if (o.type === 'move') {
    const s = sTrap(o.L, o.v, o.a, tau), f = o.L > 0 ? s / o.L : Math.min(1, tau / o.dur);
    st.x = o.x0 + (o.x1 - o.x0) * f; st.y = o.y0 + (o.y1 - o.y0) * f; st.z = o.z0 + (o.z1 - o.z0) * ss(Math.min(1, tau / o.dur));
    const s2 = sTrap(o.L, o.v, o.a, tau + .01); st.v = (s2 - s) / .01;
  } else if (o.type === 'z' || o.type === 'drop' || o.type === 'lift') {
    st.x = o.x0; st.y = o.y0; st.z = o.z0 + (o.z1 - o.z0) * ss(tau / o.dur); st.down = o.type === 'drop' && tau > o.dur * .8;
  } else if (o.type === 'grip') {
    st.x = o.x0; st.y = o.y0; st.z = o.z0; const f = ss(tau / o.dur);
    st.held = o.pen; st.grip = o.close ? f : 1 - f;
  } else {   // ink
    const s = G.S[o.i], d = sTrap(o.L, o.v, o.a, tau), [x, y] = pointAt(s, d);
    st.x = x; st.y = y; st.z = 0; st.down = true; st.cur = { i: o.i, d }; st.v = (sTrap(o.L, o.v, o.a, tau + .01) - d) / .01;
  }
  return st;
}

// ---------- drawing onto a 2D canvas (px per mm = k, window origin ox/oy in mm)
export function drawStroke(ctx, s, k, ox, oy, upto = Infinity) {
  const p = s.pts, w = NIB[s.p] * k;
  ctx.strokeStyle = INK[s.p]; ctx.fillStyle = INK[s.p]; ctx.lineWidth = w;
  const passes = s.dbl ? 2 : 1;
  for (let q = 0; q < passes; q++) {
    ctx.beginPath(); ctx.moveTo((p[0] - ox) * k, (p[1] - oy) * k);
    if (upto >= s.len) { for (let j = 2; j < p.length; j += 2) ctx.lineTo((p[j] - ox) * k, (p[j + 1] - oy) * k); }
    else { const [ex, ey, seg] = pointAt(s, upto); for (let j = 1; j <= seg; j++) ctx.lineTo((p[j * 2] - ox) * k, (p[j * 2 + 1] - oy) * k); ctx.lineTo((ex - ox) * k, (ey - oy) * k); }
    ctx.stroke();
  }
  // the pen rests a moment where it lands: a slightly wetter dot
  if (w > 1.2 && !s.txt) { ctx.beginPath(); ctx.arc((p[0] - ox) * k, (p[1] - oy) * k, w * .62, 0, 6.2832); ctx.fill(); }
}
export function strokeBox(s) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const p = s.pts; for (let j = 0; j < p.length; j += 2) { x0 = Math.min(x0, p[j]); x1 = Math.max(x1, p[j]); y0 = Math.min(y0, p[j + 1]); y1 = Math.max(y1, p[j + 1]); } return [x0, y0, x1, y1]; }
