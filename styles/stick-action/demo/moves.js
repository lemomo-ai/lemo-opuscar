// Pose library and keyframe tracks. Every builder takes the figure's proportions P, a hip x, a facing (+1 right / -1 left)
// and returns a full pose with planted feet as world targets (fN near, fF far); airborne poses give leg angles and are
// normalised to foot targets by forward kinematics, so every key interpolates the same way (fixed bone lengths, no pops).
import { figure, lerpPose } from './stick.js';

const legs = P => P.thigh + P.shin;
const sc = P => P.h / 300;

export const POSE = {
  upright: (P, x, f) => ({ x, y: -legs(P) * .98, face: f, sp: 2, hd: 0, aN: [10, 12], aF: [-8, 14], fN: [x + f * 26 * sc(P), 0], fF: [x - f * 26 * sc(P), 0] }),
  stance: (P, x, f, low = 0) => ({ x, y: -legs(P) * .84 + low, face: f, sp: 12, hd: -4, aN: [55, 95], aF: [35, 115], fN: [x + f * 72 * sc(P), 0], fF: [x - f * 88 * sc(P), 0] }),
  guardTall: (P, x, f) => ({ x, y: -legs(P) * .9, face: f, sp: 2, hd: -2, aN: [78, 30], aF: [20, 100], fN: [x + f * 60 * sc(P), 0], fF: [x - f * 70 * sc(P), 0] }),
  chamber: (P, x, f) => ({ ...POSE.stance(P, x, f), sp: 8, aN: [15, 125], aF: [45, 110] }),
  punch: (P, x, f) => ({ ...POSE.stance(P, x + f * 22 * sc(P), f), sp: 22, hd: -8, aN: [92, -4], aF: [30, 118], fN: [x + f * 95 * sc(P), 0], fF: [x - f * 88 * sc(P), 0] }),
  punchF: (P, x, f) => ({ ...POSE.stance(P, x + f * 22 * sc(P), f), sp: 26, hd: -8, aN: [40, 110], aF: [94, -4], fN: [x + f * 95 * sc(P), 0], fF: [x - f * 88 * sc(P), 0] }),
  block: (P, x, f) => ({ ...POSE.stance(P, x, f), sp: -4, hd: 4, aN: [62, 104], aF: [40, 120] }),
  crouch: (P, x, f) => ({ x, y: -legs(P) * .55, face: f, sp: 38, hd: -20, aN: [70, 90], aF: [40, 110], fN: [x + f * 95 * sc(P), 0], fF: [x - f * 95 * sc(P), 0] }),
  kickHigh: (P, x, f) => ({ x, y: -legs(P) * .92, face: f, sp: -30, hd: 20, aN: [-30, 50], aF: [80, 50], fF: [x - f * 25 * sc(P), 0], lN: [100, 0] }),
  kickLow: (P, x, f) => ({ x, y: -legs(P) * .6, face: f, sp: -10, hd: 10, aN: [40, 90], aF: [-40, 40], fF: [x - f * 40 * sc(P), 0], fN: [x + f * 200 * sc(P), -8] }),
  spinChamber: (P, x, f) => ({ x, y: -legs(P) * .86, face: -f, sp: 15, hd: -30, aN: [40, 100], aF: [60, 90], fN: [x + f * 40 * sc(P), 0], fF: [x - f * 60 * sc(P), 0] }),
  backKick: (P, x, f) => ({ x, y: -legs(P) * .86, face: -f, sp: 55, hd: -60, aN: [40, 60], aF: [120, 30], fF: [x + f * 40 * sc(P), 0], lN: [-92, 0] }),
  jump: (P, x, f, h) => ({ x, y: -legs(P) * .8 - h, face: f, sp: 10, hd: -4, aN: [70, 80], aF: [40, 110], lN: [70, -110], lF: [10, -100] }),
  hitBack: (P, x, f) => ({ x, y: -legs(P) * .88, face: f, sp: -28, hd: 28, aN: [150, -30], aF: [170, -20], fN: [x + f * 50 * sc(P), 0], fF: [x - f * 100 * sc(P), 0] }),
  fold: (P, x, f, y) => ({ x, y: y ?? -legs(P) * .8, face: f, sp: 62, hd: -10, aN: [150, -20], aF: [165, -30], lN: [-15, -55], lF: [-40, -30] }),
  tumble: (P, x, f, y, rot) => ({ x, y, face: f, sp: rot, hd: 20, aN: [rot + 140, -30], aF: [rot + 170, -20], lN: [rot - 20, -40], lF: [rot - 50, -20] }),
  dash: (P, x, f, ph = 0) => ({ x, y: -legs(P) * .8, face: f, sp: 42, hd: -30, aN: [-70, 25], aF: [-60, 30], lN: [ph ? -40 : 70, ph ? -80 : -60], lF: [ph ? 70 : -40, ph ? -60 : -80] }),
  slide: (P, x, f) => ({ ...POSE.stance(P, x, f, 30), sp: 20, aN: [70, 70], aF: [10, 40] }),
  iai: (P, x, f) => ({ x, y: -legs(P) * .62, face: f, sp: 30, hd: -22, aN: [-40, 120], aF: [-30, 110], fN: [x + f * 120 * sc(P), 0], fF: [x - f * 115 * sc(P), 0] }),
  passed: (P, x, f) => ({ x, y: -legs(P) * .66, face: f, sp: 24, hd: -10, aN: [100, 0], aF: [-50, 30], fN: [x + f * 130 * sc(P), 0], fF: [x - f * 120 * sc(P), 0] }),
  kneel: (P, x, f) => ({ x, y: -P.thigh * 1.02, face: f, sp: 20, hd: -18, aN: [40, 30], aF: [10, 20], fN: [x + f * 70 * sc(P), 0], lF: [0, -90] }),
  lying: (P, x, f) => ({ x, y: -P.w * .7, face: f, sp: -88, hd: -2, aN: [-60, 20], aF: [-100, 10], fN: [x + f * 140 * sc(P), 0], fF: [x + f * 170 * sc(P), -2] }),
  sitUp: (P, x, f) => ({ x, y: -P.w * .7, face: f, sp: -30, hd: 0, aN: [90, 0], aF: [-40, 30], fN: [x + f * 120 * sc(P), 0], fF: [x + f * 160 * sc(P), 0] }),
  offer: (P, x, f) => ({ ...POSE.upright(P, x, f), sp: 18, hd: -14, aN: [62, 8], aF: [-6, 14], fN: [x + f * 40 * sc(P), 0], fF: [x - f * 40 * sc(P), 0] }),
  hang: (P, ex, f, k = 0) => ({ x: ex - f * (34 - k * .3), y: P.spine + P.upper * .55 + 20 - k, face: f, sp: 8 + k * .1, hd: -10, hN: [ex + f * 30, -2], hF: [ex + f * 16, -2], lN: [10, -14], lF: [-6, -10] }),
  step: (P, x, f, lift) => ({ ...POSE.upright(P, x, f), sp: 6, aN: [lift ? -20 : 20, 20], aF: [lift ? 20 : -20, 20], ...(lift ? { lN: [40, -60] } : {}) }),
};

// key: [t, pose, ease]. Ease of a key shapes the segment that ARRIVES at it: 'o' snap (ease-out), 'io', 'i' (ease-in, falls), 'l' linear, 'h' hold then jump
const E = { o: k => 1 - Math.pow(1 - k, 3), io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, i: k => k * k, l: k => k, h: k => (k < 1 ? 0 : 1), s: k => k * k * (3 - 2 * k) };
// normalise: every key gets world foot targets (FK for airborne legs), so feet always interpolate as points
export function track(P, keys) {
  const K = keys.map(([t, p, e]) => {
    const J = figure(P, p), q = { ...p };
    if (!q.fN) q.fN = J.lN[2]; if (!q.fF) q.fF = J.lF[2];
    delete q.lN; delete q.lF;
    return [t, q, e || 'io'];
  });
  return t => {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const [t0, a] = K[i - 1], [t1, b, e] = K[i]; return lerpPose(a, b, E[e]((t - t0) / (t1 - t0))); }
    return K[K.length - 1][1];
  };
}
