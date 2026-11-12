// The numbers on screen. Every readout is computed here from the slider value s (state of wind, 0..1).
// A teaching movement: round tooth counts, true ratios. SI units inside.

export const TRAIN = {            // [wheel teeth, next pinion leaves], barrel -> escape
  barrel: 64, centerPinion: 8,
  center: 64, thirdPinion: 8,
  third: 60, fourthPinion: 8,
  fourth: 60, escapePinion: 6,
  escape: 15,
};
// barrel -> escape wheel = 64/8 · 64/8 · 60/8 · 60/6 = 8 · 8 · 7.5 · 10 = 4800
export const RATIO = (TRAIN.barrel / TRAIN.centerPinion) * (TRAIN.center / TRAIN.thirdPinion) * (TRAIN.third / TRAIN.fourthPinion) * (TRAIN.fourth / TRAIN.escapePinion);

export const SPEC = {
  f0: 2.5,              // balance frequency, Hz (18 000 beats per hour)
  I: 10e-10,            // balance moment of inertia, kg·m² (10 mg·cm²)
  Mfull: 11.0e-3,       // mainspring torque fully wound, N·m
  Mkeep: 0.45,          // torque fraction left at the end of the useful run (linear in between)
  eta: 0.25,            // efficiency barrel -> balance
  Q: 120,               // quality factor of the balance
  A0: 300,              // amplitude the watch was regulated at, degrees
  Kiso: -30,            // isochronism: s/day per unit (A0/A − 1); low amplitude loses
  turns: 5,             // useful barrel turns
};

export function solve(s, S = SPEC) {
  const k = S.I * (2 * Math.PI * S.f0) ** 2;                    // hairspring stiffness, N·m/rad
  const M = S.Mfull * (S.Mkeep + (1 - S.Mkeep) * s);             // barrel torque
  const W = S.eta * M / RATIO * (2 * Math.PI / (2 * TRAIN.escape));   // energy per beat
  const A = Math.sqrt(2 * S.Q * W / (Math.PI * k)) * 180 / Math.PI;    // amplitude, degrees
  const rate = S.Kiso * (S.A0 / A - 1);                          // s/day
  const fourthRpm = 1;                                           // seconds wheel
  const escapeRpm = fourthRpm * TRAIN.fourth / TRAIN.escapePinion;     // 10 rpm
  const thirdMin = TRAIN.third / TRAIN.fourthPinion;             // minutes per third-wheel turn (7.5)
  const centerHours = 1;                                         // centre wheel: 1 turn per hour
  const barrelHours = RATIO / (escapeRpm * 60);                  // 8 h per barrel turn
  const reserve = s * S.turns * barrelHours;                     // hours left
  const bph = Math.round(S.f0 * 2 * 3600);
  return { s, k, M, W, A, rate, reserve, bph, escapeRpm, thirdMin, centerHours, barrelHours };
}
