// Stick figure rig: fixed bone lengths, forward kinematics from joint angles, two-bone IK for planted feet and reaching hands.
// World units: y grows downward, the ground line is y = 0. A figure of height h stands with its head top at y = -h.
// Angles in degrees, measured from straight down; positive turns towards the way the figure faces (face = +1 right, -1 left).
export const INK = '#16151a', PAPER = '#f3efe6';
const R = Math.PI / 180;

export function proportions(h, build = {}) {
  const k = { thigh: .25, shin: .25, spine: .29, neck: .035, upper: .18, fore: .18, head: .095, ...build };
  return { h, thigh: k.thigh * h, shin: k.shin * h, spine: k.spine * h, neck: k.neck * h, upper: k.upper * h, fore: k.fore * h, head: k.head * h, w: h / 13 };
}

// two-bone IK: from root a to target t with bone lengths l1, l2; bend = +1 / -1 picks the side of the middle joint (in screen terms, relative to a→t)
export function ik2(a, t, l1, l2, bend) {
  let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy);
  const dm = Math.max(1e-3, Math.min(d, l1 + l2 - 1e-3));
  if (d < 1e-6) { dx = 0; dy = 1; d = 1; }
  const ux = dx / d, uy = dy / d;
  const x = (l1 * l1 - l2 * l2 + dm * dm) / (2 * dm), y = Math.sqrt(Math.max(0, l1 * l1 - x * x)) * bend;
  const mid = [a[0] + ux * x - uy * y, a[1] + uy * x + ux * y];
  const end = [a[0] + ux * dm, a[1] + uy * dm];
  return [mid, end];
}
const dirOf = (deg, face) => [Math.sin(deg * R) * face, Math.cos(deg * R)];

// Pose → joints. pose: { x, y (hips), face, sp (spine lean), hd (head tilt), aN/aF: [upper, elbow], lN/lF: [thigh, knee],
//   fN/fF: [x, y] world foot targets (IK, knee bends forward), hN/hF: [x, y] world hand targets (IK, elbow bends down/back) }
export function figure(P, pose) {
  const f = pose.face || 1, hip = [pose.x, pose.y];
  const sd = dirOf(180 - (pose.sp || 0), f);                      // spine points up, leaning forward by sp
  const neck = [hip[0] + sd[0] * P.spine, hip[1] + sd[1] * P.spine];
  const hdA = 180 - (pose.sp || 0) - (pose.hd || 0), hdd = dirOf(hdA, f);
  const head = [neck[0] + hdd[0] * (P.neck + P.head), neck[1] + hdd[1] * (P.neck + P.head)];
  const sh = [hip[0] + sd[0] * P.spine * .92, hip[1] + sd[1] * P.spine * .92];
  const limb = (root, ang, l1, l2, target, bendSign) => {
    if (target) { const [m, e] = ik2(root, target, l1, l2, bendSign); return [root, m, e]; }
    const d1 = dirOf(ang[0], f), m = [root[0] + d1[0] * l1, root[1] + d1[1] * l1];
    const d2 = dirOf(ang[0] + ang[1], f); return [root, m, [m[0] + d2[0] * l2, m[1] + d2[1] * l2]];
  };
  // knees bend forward (towards face), elbows bend down/back
  const kneeBend = t => (t[0] - hip[0]) * f >= 0 ? -f : -f;
  return {
    hip, neck, head, P, face: f,
    aF: limb(sh, pose.aF || [10, 20], P.upper, P.fore, pose.hF, f),
    aN: limb(sh, pose.aN || [-10, 20], P.upper, P.fore, pose.hN, f),
    lF: limb(hip, pose.lF || [-8, -10], P.thigh, P.shin, pose.fF, -f * (pose.kbF || 1)),
    lN: limb(hip, pose.lN || [8, -10], P.thigh, P.shin, pose.fN, -f * (pose.kbN || 1)),
  };
}

const NUM = ['x', 'y', 'sp', 'hd'];
const PAIRS = ['aN', 'aF', 'lN', 'lF', 'fN', 'fF', 'hN', 'hF'];
export function lerpPose(a, b, k) {
  const o = { face: k < .5 ? a.face : b.face, kbN: b.kbN ?? a.kbN, kbF: b.kbF ?? a.kbF };
  for (const n of NUM) o[n] = (a[n] ?? 0) + ((b[n] ?? 0) - (a[n] ?? 0)) * k;
  for (const n of PAIRS) {
    if (a[n] && b[n]) o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k];
    else if (b[n] && k > .5) o[n] = b[n]; else if (a[n] && k <= .5) o[n] = a[n];
  }
  return o;
}

export function mixCol(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = s => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t);
  return '#' + [16, 8, 0].map(s => c(s).toString(16).padStart(2, '0')).join('');
}

// draw: plain ink strokes, no outline; far limbs lightened. o: { ink, farMix, wk (width multiplier), alpha, only: ['aN', ...] }
export function drawFigure(g, J, o = {}) {
  const ink = o.ink || INK, w = J.P.w * (o.wk || 1);
  const far = mixCol(ink, PAPER, o.farMix ?? .16);
  const pl = (pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; if (o.alpha != null) g.globalAlpha = o.alpha;
  const parts = [['aF', far], ['lF', far], ['spine', ink], ['lN', ink], ['aN', ink]].filter(p => !o.only || o.only.includes(p[0]));
  for (const [name, col] of parts) {
    g.strokeStyle = col; g.lineWidth = w; pl(name === 'spine' ? [J.hip, J.neck] : J[name]);
    if (name === 'spine') { g.fillStyle = ink; g.beginPath(); g.arc(J.head[0], J.head[1], J.P.head, 0, 7); g.fill(); }
  }
  g.restore();
}

// contact shadow: a flat ellipse on the ground, smaller and lighter with height
export function shadow(g, J, col = '#000000') {
  const lowest = Math.max(J.lN[2][1], J.lF[2][1], J.hip[1] + J.P.thigh * .3);
  const hgt = Math.max(0, -lowest), k = Math.max(.25, 1 - hgt / (J.P.h * 1.2));
  g.save(); g.globalAlpha = .13 * k; g.fillStyle = col;
  g.beginPath(); g.ellipse((J.lN[2][0] + J.lF[2][0]) / 2, 2, J.P.h * .28 * k, J.P.h * .028 * k, 0, 0, 7); g.fill(); g.restore();
}

// a stroke drawn into being: polyline revealed along its length (0..1)
export function partial(pts, k) {
  if (k >= 1) return pts; if (k <= 0) return [pts[0], pts[0]];
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * k; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (rem >= seg[i - 1]) { out.push(pts[i]); rem -= seg[i - 1]; } else { const u = rem / seg[i - 1]; out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]); break; } }
  return out;
}
// draw a figure being drawn: spine, head, then each limb in order, k = 0..1
export function drawFigureDrawing(g, J, k, o = {}) {
  const order = ['spine', 'head', 'lF', 'lN', 'aF', 'aN'], n = order.length;
  const ink = o.ink || INK, w = J.P.w;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = w;
  order.forEach((name, i) => {
    const kk = Math.max(0, Math.min(1, k * n - i)); if (kk <= 0) return;
    if (name === 'head') { g.beginPath(); g.arc(J.head[0], J.head[1], J.P.head, -Math.PI / 2, -Math.PI / 2 + kk * Math.PI * 2); if (kk >= 1) g.fill(); else g.stroke(); return; }
    const pts = partial(name === 'spine' ? [J.hip, J.neck] : J[name], kk);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]); g.stroke();
  });
  g.restore();
}
