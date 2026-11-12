// hand.js — a hand in close-up (a magnifier circle, or a shot where only the hands are in frame).
// rig.person() draws a hand as one small paddle, which is right at full-body scale and a lump at 4× or more. Here the hand is
// built like the rest of the engine, from hulls of spheres (orthographic: every sphere is a circle): a palm, a thumb in two
// pieces and four fingers, each a separate part, so the ink lines that separate them are what reads as fingers. No nails,
// knuckle creases or shading: one line weight, white skin, the sleeve in the wearer's shirt grey, running out of the frame.
//
//   import { hand } from './hand.js';
//   hand(v, { wrist: [0, 20, 0], dir: [1, 0, 0], palm: [0, -1, 0], side: 'r', pose: 'grip', r: 1.2,
//             sleeve: PAL.grey1, frame: { x: 0, y: 0, w: 1920, h: 1080 } });
//
// o.wrist   the wrist centre (world, cm); the fingertips are ≈ 18.5 cm from it along `dir` (real adult size, o.scale = 1).
//           Or place the hand by what it touches: o.tipAt (the index fingertip, for point / press) or o.palmAt (the palm centre)
// o.dir     forearm → fingers;  o.palm  the way the palm faces (what it touches or holds); both world directions
// o.side    'r' or 'l' (which side the thumb is on follows from it)
// o.pose    'relaxed' | 'flat' | 'point' | 'press' | 'grip' | 'pinch';  o.r  radius (cm) of what a 'grip' holds
// o.fingers [[mcp, pip, dip, splay], ×4 index→little] (degrees) and o.thumb {sp, ab, flex:[a, b]} override the pose
// o.sleeve  sleeve colour (null: bare forearm to the frame edge); o.cuff  cm from the wrist to the cuff (default 4)
// o.frame   the shot's screen rectangle {x, y, w, h} or a magnifier circle {cx, cy, r}: the sleeve runs on past its edge,
//           so the arm is cut by the frame and never ends inside it (default: 1920 × 1080)
// o.lw, o.bias (added to every part's depth), o.skin
// Returns { wrist, palm, tips: [thumb, index, middle, ring, little], F, N, T } (world points and the hand's own axes).
import { LW, add3, sub3, mul3, dot3, cross3, norm3, blob } from './iso.js';
import { rot } from './rig.js';

const D2R = Math.PI / 180;
// knuckle positions in the palm (along the fingers, toward the thumb), phalanx lengths, radii — index, middle, ring, little
const FING = [
  { f: 9.6, t: 2.85, L: [4.0, 2.4, 1.9], r: .88 },
  { f: 9.9, t: .95, L: [4.5, 2.8, 2.0], r: .9 },
  { f: 9.6, t: -.95, L: [4.2, 2.6, 1.9], r: .85 },
  { f: 8.9, t: -2.75, L: [3.3, 1.9, 1.7], r: .75 },
];
// [mcp, pip, dip, splay] per finger (degrees; splay + spreads toward the thumb), and the thumb: sp (in the palm plane, from the
// fingers toward the thumb side), ab (out of the palm plane, toward the palm side), flex (its two joints, curling across the palm)
const POSES = {
  relaxed: { f: [[18, 28, 14, 6], [20, 30, 15, 1], [24, 34, 17, -4], [28, 38, 20, -10]], th: { sp: 38, ab: 22, flex: [10, 15] } },
  flat: { f: [[2, 4, 2, 7], [2, 4, 2, 1], [2, 4, 2, -5], [3, 5, 3, -12]], th: { sp: 48, ab: 4, flex: [0, 6] } },
  point: { f: [[0, 6, 3, 3], [82, 98, 40, 0], [84, 100, 40, -3], [86, 100, 40, -6]], th: { sp: 18, ab: 42, flex: [28, 32] } },
  press: { f: [[14, 20, 10, 3], [70, 95, 40, 0], [74, 98, 40, -3], [78, 98, 40, -6]], th: { sp: 20, ab: 42, flex: [24, 30] } },
  grip: { f: [[55, 70, 40, 4], [57, 72, 40, 0], [59, 74, 42, -3], [62, 76, 44, -6]], th: { sp: 26, ab: 58, flex: [22, 26] } },
  pinch: { f: [[38, 46, 24, 4], [48, 62, 34, 0], [58, 76, 40, -4], [64, 82, 44, -8]], th: { sp: 34, ab: 52, flex: [16, 20] } },
};

export function hand(v, o) {
  const S = o.scale ?? 1, lw = o.lw ?? LW, skin = o.skin || '#FFFFFF', bias = o.bias || 0;
  const F = norm3(o.dir), N = norm3(sub3(o.palm, mul3(F, dot3(o.palm, F))));
  const T = norm3(o.side === 'l' ? cross3(N, F) : cross3(F, N));   // right hand, palm down, fingers ahead: thumb on the left
  const at = (f, t, n = 0) => add3(add3(mul3(F, f * S), mul3(T, t * S)), mul3(N, n * S));   // hand-local, wrist at 0
  const base = POSES[o.pose || 'relaxed'] || POSES.relaxed;
  let fp = o.fingers || base.f;
  if (o.pose === 'grip' && !o.fingers && o.r != null) {   // a thin handle closes the fist further, a thick one opens it
    const k = Math.max(.65, Math.min(1.35, 1.45 - o.r * .28));
    fp = fp.map(([a, b, c, s]) => [a * k, b * k, c * k, s]);
  }
  const th = { ...base.th, ...(o.thumb || {}) };
  const parts = [];   // [spheres, fill, depth point, depth nudge]

  // palm: the heel at the wrist, the knuckle row, the thumb's mound
  const palmC = at(5, 0, .2);
  parts.push([[[at(.5, 2.1, .2), 1.7 * S], [at(.5, -2.2, .2), 1.6 * S], [at(9.4, 2.85), 1.15 * S], [at(8.8, -2.85), 1.05 * S],
    [palmC, 2.0 * S], [at(3, 2.5, .7), 1.7 * S]], skin, palmC, 0]);
  // the four fingers, each from its knuckle: splay in the palm plane, then flex toward the palm at each joint
  const tips = [];
  FING.forEach((fg, i) => {
    const [a1, a2, a3, sp] = fp[i], d = rot(F, norm3(cross3(F, T)), sp * D2R), k = norm3(cross3(d, N)), r = fg.r * S;
    const J0 = at(fg.f, fg.t, -.15), d1 = rot(d, k, a1 * D2R), d2 = rot(d, k, (a1 + a2) * D2R), d3 = rot(d, k, (a1 + a2 + a3) * D2R);
    const J1 = add3(J0, mul3(d1, fg.L[0] * S)), J2 = add3(J1, mul3(d2, fg.L[1] * S)), J3 = add3(J2, mul3(d3, fg.L[2] * S));
    tips.push(J3);
    // a nearly straight finger is one part (no line across it); a bent one is two, so the bend reads
    if (a2 < 30) parts.push([[[J0, r * 1.05], [J1, r], [J2, r * .92], [J3, r * .8]], skin, mul3(add3(J0, J3), .5), 0]);
    else {
      parts.push([[[J0, r * 1.05], [J1, r]], skin, mul3(add3(J0, J1), .5), 0]);
      parts.push([[[J1, r * .98], [J2, r * .92], [J3, r * .8]], skin, mul3(add3(J1, J3), .5), .001]);
    }
  });
  // the thumb: out from its mound, then curling across the palm
  const B0 = at(2.2, 2.6, .9);
  let dt = rot(F, norm3(cross3(F, T)), th.sp * D2R);
  dt = rot(dt, norm3(cross3(dt, N)), th.ab * D2R);
  const kq = norm3(cross3(dt, norm3(sub3(N, T))));
  const B1 = add3(B0, mul3(dt, 3.4 * S)), e1 = rot(dt, kq, th.flex[0] * D2R), B2 = add3(B1, mul3(e1, 3.0 * S));
  const e2 = rot(dt, kq, (th.flex[0] + th.flex[1]) * D2R), B3 = add3(B2, mul3(e2, 2.6 * S));
  tips.unshift(B3);
  parts.push([[[B0, 1.5 * S], [B1, 1.15 * S]], skin, mul3(add3(B0, B1), .5), 0]);
  parts.push([[[B1, 1.1 * S], [B2, 1.0 * S], [B3, .85 * S]], skin, mul3(add3(B1, B3), .5), 0]);

  // where the hand goes: the wrist, or the point the index fingertip (o.tipAt) or the palm centre (o.palmAt) must touch
  const W = o.tipAt ? sub3(o.tipAt, tips[1]) : o.palmAt ? sub3(o.palmAt, palmC) : o.wrist;
  const mv = (p) => add3(p, W);
  // sleeve and forearm: from the wrist back along the arm until well past the frame's edge; both sorted at the cuff,
  // the sleeve just over the forearm, so the cuff is one clean line across the arm
  const back = mul3(F, -1), cuff = (o.cuff ?? 4) * S, far = exitLen(v, W, back, o.frame, 6 * S * v.s);
  const cuffP = add3(W, mul3(back, cuff)), farP = add3(W, mul3(back, far)), dc = v.depth(cuffP) + bias;
  blob(v, [[W, 2.4 * S], [cuffP, 2.9 * S]], skin, { lw, depth: dc - .01 });
  if (o.sleeve) blob(v, [[cuffP, 4.0 * S], [farP, 4.6 * S]], o.sleeve, { lw, depth: dc });
  else blob(v, [[cuffP, 2.9 * S], [farP, 3.6 * S]], skin, { lw, depth: dc - .02 });
  for (const [sph, fill, dp, nudge] of parts) blob(v, sph.map(([p, r]) => [mv(p), r]), fill, { lw, depth: v.depth(mv(dp)) + bias + nudge });
  return { wrist: W, palm: mv(palmC), tips: tips.map(mv), F, N, T };
}

// how far (cm) to run the arm back from `p` along `d` so it leaves the frame by `pad` px
function exitLen(v, p, d, fr, pad) {
  fr = fr || { x: 0, y: 0, w: 1920, h: 1080 };
  const a = v.P(p), b = v.P(add3(p, d)), dx = b[0] - a[0], dy = b[1] - a[1], sp = Math.hypot(dx, dy);
  if (sp < 1e-3) return 40;   // the arm points straight at the viewer: only its end shows
  let t;
  if (fr.r != null) {   // circle: solve |a + t·(dx, dy) − c| = r
    const ox = a[0] - fr.cx, oy = a[1] - fr.cy, A = dx * dx + dy * dy, B = 2 * (ox * dx + oy * dy), C = ox * ox + oy * oy - fr.r * fr.r;
    t = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
  } else {
    const tx = dx > 0 ? (fr.x + fr.w - a[0]) / dx : dx < 0 ? (fr.x - a[0]) / dx : Infinity;
    const ty = dy > 0 ? (fr.y + fr.h - a[1]) / dy : dy < 0 ? (fr.y - a[1]) / dy : Infinity;
    t = Math.min(tx, ty);
  }
  return Math.max(8, t + pad / sp);
}
