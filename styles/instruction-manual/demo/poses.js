// poses.js — the film's poses, each built so the body carries its weight and the hands do a job.
// All return a pose object for rig.person(); `at` is [x, z] in cm, `face` the hips' direction in degrees.
import { add3, mul3 } from './iso.js';

const D2R = Math.PI / 180;
// a world point from body-local (forward f, left l, height y)
export function lp(at, face, f, l, y) {
  const t = face * D2R, F = [Math.cos(t), 0, Math.sin(t)], L = [Math.sin(t), 0, -Math.cos(t)];
  return add3([at[0], y, at[1]], add3(mul3(F, f), mul3(L, l)));
}

// relaxed standing: weight on the left leg, the right knee soft and its foot turned out, the chest a little back over the hips
export const stand = (at, face, look, x = {}) => ({ at, face, look, hip: 3.2, feet: [[2, 11, 0, 6], [-5, -12, 0, 18]],
  knee: null, lean: 1, head: { pitch: 6 }, ...x });
// hands on hips (elbows out, back): looking at something that went wrong
export const handsOnHips = (at, face, look, x = {}) => stand(at, face, look, {
  hands: [(s) => add3(s.pelvis, add3(mul3(s.cL, 13 * s.S), mul3(s.cY, 10 * s.S))), (s) => add3(s.pelvis, add3(mul3(s.cL, -13 * s.S), mul3(s.cY, 10 * s.S)))],
  handDir: [null, null], elbow: [null, null], ...x });
// scratching the back of the head with the right hand, the left hand on the hip
export const scratch = (at, face, look, x = {}) => stand(at, face, look, {
  hip: -3, feet: [[0, 12, 0, 16], [3, -10, 0, 4]], side: -4,
  hands: [(s) => add3(s.pelvis, add3(mul3(s.cL, 13 * s.S), mul3(s.cY, 10 * s.S))),
    (s) => add3(s.headC, add3(add3(mul3(s.hL, -s.HR * .7), mul3(s.hU, s.HR * .2)), mul3(s.hF, -s.HR * .8)))],
  elbow: [null, null], elbowOut: true, head: { pitch: 4, roll: 9 }, ...x });
// reading a booklet held in both hands at the chest, head down to it
export const read = (at, face, look, x = {}) => stand(at, face, look, {
  hip: 2, lean: 6, hands: [(s) => s.up(28, 9, 33), (s) => s.up(28, -9, 33)], handDir: [null, null],
  elbow: [[0, -1, 0], [0, -1, 0]], head: { pitch: 34 }, ...x });
// sitting on the floor, leaning back on both hands, knees up: the laugh
export const sitLaugh = (at, face, look, k = 0, x = {}) => ({ at, face, look, crouch: 92 * (look === 'b' ? .94 : 1) - 13, pelvisF: 0,
  lean: -24 - 4 * Math.sin(k * 3), hip: 0, side: 0, feet: [[52, 15, 0, 14, 2], [46, -13, 0, -6, 2]], knee: [[0, 1, .2], [0, 1, -.2]],
  hands: [(s) => lp(at, face, -24, 22, 3), (s) => lp(at, face, -22, -21, 3)], handDir: [null, null], elbow: [[0, 0, 0], [0, 0, 0]].map((_, i) => lp([0, 0], face, -1, i ? -1 : 1, 0)),
  head: { pitch: -22 - 6 * Math.sin(k * 3 + .6), roll: 6 }, ...x });
// half-kneeling (checked against real half-kneeling: the down knee right under the hip, thigh vertical, shin and the top of the foot
// flat on the floor behind; the other foot flat in front, its knee bent about 90° with the shin vertical). The LEFT leg kneels and
// the right foot is planted; knee hints are body-local, so the pose holds at any heading. Thigh and shin keep their standing lengths,
// and the hips sit at the height those lengths give (knee on the floor + one thigh).
export const kneel = (at, face, look, x = {}) => {
  const S = look === 'b' ? .94 : 1, L = 41 * S, hipY = 6.5 + L - 1, pelvisY = hipY + 3 * S;
  const dir = (f, y) => { const p = lp([0, 0], face, f, 0, 0); return [p[0], y, p[2]]; };
  return { at, face, look, crouch: 92 * S - pelvisY, pelvisF: 0, hip: 0, side: 0, lean: 30,
    feet: [[-L * .97, 9, 0, 180, -1], [L * .93, -11, 0, 0]], knee: [dir(1, -1.2), dir(1, 1)], head: { pitch: 24 }, ...x };
};
// sitting cross-legged on the floor (pelvis ~14 cm up): knees open to the sides and low, thighs near flat, shins crossing in front;
// k = laugh phase: the chest folds forward and bobs, both hands on the stomach, the head tips back on each laugh
export const sitCross = (at, face, look, k = 0, x = {}) => {
  const S = look === 'b' ? .94 : 1, sh = Math.sin(k) * .5 + .5, out = (sd) => { const p = lp([0, 0], face, .35, sd, 0); return [p[0], .2, p[2]]; };
  return { at, face, look, crouch: 92 * S - 14, pelvisF: 0, hip: 0, side: 0, lean: 28 + 8 * sh,
    feet: [[30, -13, 0, 70], [25, 13, 0, 70]], knee: [out(1), out(-1)],
    hands: [(s) => s.up(17, 6, 13), (s) => s.up(17, -6, 11)], handDir: [null, null],
    elbow: [lp([0, 0], face, -.4, 1, -.2), lp([0, 0], face, -.4, -1, -.2)], head: { pitch: -16 - 10 * sh, roll: 4 }, ...x };
};
// leaning over a rail with both forearms on it
export const leanOn = (at, face, look, railY, x = {}) => ({ at, face, look, hip: 2.5, lean: 22, pelvisF: -4,
  feet: [[-6, 11, 0, 8], [-10, -11, 0, 14]], hands: [lp(at, face, 30, 11, railY + 3), lp(at, face, 30, -11, railY + 3)], handDir: [lp([0, 0], face, 1, -.2, -.3), lp([0, 0], face, 1, .2, -.3)],
  elbow: [[0, -1, 0], [0, -1, 0]], head: { pitch: 42 }, ...x });
