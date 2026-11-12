// The film's simulation (deterministic, plain JS, also runs in node). Two things on top of the bare rules:
//   1. generation 1's speeds are spread evenly over 0.6–1.9 ("each born with its own speed": the whole ramp is on screen from the start);
//   2. every step of day 1 is recorded (position, heading, beans eaten, energy) and the picture interpolates this record frame by frame,
//      so where each Pip goes, whether it eats and whether it survives is computed by the rules, not placed.
// Rules: every day F beans are scattered and the Pips land at random; a Pip heads for the nearest bean within its sensing radius, otherwise wanders;
//      it spends k·speed² energy per second (k = 0.7 in the demo) and stops when it runs out; 0 beans → gone, 1 → lives to the next day, 2 → lives and leaves a copy (speed mutated).
export function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(.5); }

export const FILM_P = { A: 14, F: 230, N0: 160, sense: 3.2, eatR: .55, k: .7, T: 30, dt: .05, mut: .09, seed: 11, s0: .6, s1: 1.9 };

// run and record one day. pop: [{id, s}]; returns {steps, food, dt, end}
// steps[i] = Float32Array(n*5): x, z, heading, ate, energy
export function runDayRecorded(pop, r, P) {
  const { A, F, sense, eatR, k, T, dt } = P;
  const food = []; for (let i = 0; i < F; i++) food.push({ x: (r() * 2 - 1) * (A - 1), z: (r() * 2 - 1) * (A - 1), eatenAt: -1, by: -1 });
  for (const b of pop) { b.x = (r() * 2 - 1) * A; b.z = (r() * 2 - 1) * A; b.h = r() * Math.PI * 2; b.e = 1; b.ate = 0; b.eats = []; b.stopAt = -1; }
  const steps = [], n = pop.length;
  const rec = () => { const a = new Float32Array(n * 5); pop.forEach((b, i) => { a.set([b.x, b.z, b.h, b.ate, b.e], i * 5); }); steps.push(a); };
  rec();
  let t = 0;
  for (; t < T - 1e-9;) {
    let active = 0;
    for (const b of pop) {
      if (b.ate >= 2 || b.e <= 0) continue;
      active++;
      let best = -1, bd = sense * sense;
      for (let i = 0; i < food.length; i++) { const f = food[i]; if (f.eatenAt >= 0) continue; const d = (f.x - b.x) ** 2 + (f.z - b.z) ** 2; if (d < bd) { bd = d; best = i; } }
      if (best >= 0) b.h = Math.atan2(food[best].z - b.z, food[best].x - b.x);
      else { b.h += (r() - .5) * .5; if (Math.abs(b.x) > A - .5 || Math.abs(b.z) > A - .5) b.h = Math.atan2(-b.z, -b.x) + (r() - .5); }
      b.x += Math.cos(b.h) * b.s * dt; b.z += Math.sin(b.h) * b.s * dt;
      b.x = Math.max(-A, Math.min(A, b.x)); b.z = Math.max(-A, Math.min(A, b.z));
      b.e -= k * b.s * b.s * dt;
      if (best >= 0) { const f = food[best]; if ((f.x - b.x) ** 2 + (f.z - b.z) ** 2 < eatR * eatR) { f.eatenAt = t + dt; f.by = b.id; b.ate++; b.eats.push({ t: t + dt, food: best }); } }
      if (b.ate >= 2 || b.e <= 0) b.stopAt = t + dt;
    }
    t += dt; rec();
    if (!active) break;
  }
  return { steps, food, dt, end: t };
}

// run gens generations from generation 1. With record=true day 1 keeps its full trajectories
export function runFilmSim(gens = 1, over = {}, record = true) {
  const P = { ...FILM_P, ...over };
  const r = mulberry(P.seed);
  let pop = []; for (let i = 0; i < P.N0; i++) pop.push({ id: i, s: P.s0 + (P.s1 - P.s0) * r() });
  let nid = P.N0;
  const gensOut = [];
  let day1 = null;
  for (let g = 1; g <= gens; g++) {
    const res = runDayRecorded(pop, r, P);
    const next = [], births = [];
    for (const b of pop) {
      if (b.ate >= 1) next.push({ id: b.id, s: b.s, parent: -1 });
      if (b.ate >= 2) { const c = { id: nid++, s: Math.max(.3, b.s + gauss(r) * P.mut), parent: b.id }; next.push(c); births.push(c); }
    }
    // morning: where this generation landed on the board (used by the between-generation transitions)
    const morning = pop.map((b, i) => ({ id: b.id, s: b.s, x: res.steps[0][i * 5], z: res.steps[0][i * 5 + 1], ate: b.ate, parent: b.parent ?? -1 }));
    const info = { g, n: pop.length, speeds: pop.map(b => b.s), ate: [0, 1, 2].map(k => pop.filter(b => b.ate === k).length), next: next.length, end: res.end, morning };
    gensOut.push(info);
    if (g === 1 && record) day1 = { P, pop: pop.map(b => ({ id: b.id, s: b.s, ate: b.ate, eats: b.eats, stopAt: b.stopAt })), steps: res.steps, food: res.food, dt: res.dt, end: res.end, births };
    pop = next;
    if (!pop.length) break;
  }
  return { P, gens: gensOut, day1, last: pop };
}
