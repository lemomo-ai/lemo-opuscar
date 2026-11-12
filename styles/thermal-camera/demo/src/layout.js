// The building: one six-storey brick-and-concrete block of three stair units, facade on z = 0 facing +z (the street).
// Everything here is plain data, shared by the picture code, the thermal model and the overlay.
import * as THREE from 'three';
import { mulberry } from './util.js';

export const B = { X0: -19.8, UW: 13.2, NU: 3, NF: 6, FH: 2.8, PL: 0.45, DEPTH: 10.8 };
B.X1 = B.X0 + B.UW * B.NU;            // 19.8
B.ROOF = B.PL + B.FH * B.NF;           // 17.25 roof slab top
B.PAR = B.ROOF + 0.9;                  // 18.15 parapet top
export const yF = f => B.PL + B.FH * f;
// bays inside one unit (x from the unit's left edge): A = enclosed balcony, B = room window, S = stairwell
export const BAYS = [
  { k: 'A', x0: 0.45, x1: 3.75 }, { k: 'B', x0: 4.25, x1: 5.75 }, { k: 'S', x0: 6.0, x1: 7.2 },
  { k: 'B', x0: 7.45, x1: 8.95 }, { k: 'A', x0: 9.45, x1: 12.75 }];
export const BALC_D = 1.25;            // balcony depth

// ---- physics (see FACTS.md): steady-state exterior surface temperatures, °C ----
export const PHYS = (() => {
  const Tout = -6, Tin = 20, Rse = 0.04, sky = 0.6, dT = Tin - Tout;
  const se = (U, tin = Tin) => Tout + (tin - Tout) * U * Rse - sky;
  const Rbrick = 0.11 + 0.02 / 0.81 + 0.24 / 0.81 + 0.04;                 // exposed 240 brick, plaster inside
  const Ubrick = 1 / Rbrick, Ueps = 1 / (Rbrick + 0.08 / (0.039 * 1.2) + 0.006);
  const Ubeam = 1 / (0.11 + 0.02 / 0.81 + 0.24 / 1.74 + 0.04);
  const niche = (R) => Tout + (35 - Tout) / R * Rse - sky;               // wall behind a radiator, inner face ~35 °C
  return {
    Tout, Tin, Rse, Ubrick, Ueps, Ubeam,
    wall: se(Ubrick), wallAfter: se(Ueps), beam: se(Ubeam) + 0.9, beamAfter: se(Ueps) + 0.08,
    niche: niche(0.02 / 0.81 + 0.12 / 0.81 + 0.04), nicheAfter: niche(0.02 / 0.81 + 0.12 / 0.81 + 0.04 + 0.08 / (0.039 * 1.2)),
    glass1: se(5.8), glass2: se(3.0), glassNew: se(2.7), glassStair: se(5.8, 10), glassBalc: se(5.8, 12),
    stairWall: se(Ubrick, 10), leak: 13.5,
  };
})();

// ---- windows ----
const R = mulberry(20241219);
const pick = (r, arr) => { let s = 0; for (const [v, w] of arr) { s += w; if (r < s) return v; } return arr[arr.length - 1][0]; };
export const WINDOWS = [];
for (let u = 0; u < B.NU; u++) for (let b = 0; b < 5; b++) {
  const bay = BAYS[b]; const ux = B.X0 + u * B.UW;
  for (let f = 0; f < B.NF; f++) {
    if (bay.k === 'S' && f > 4) continue;
    const w = { id: WINDOWS.length, u, b, f, k: bay.k, col: u * 5 + b, x0: ux + bay.x0, x1: ux + bay.x1, seed: R() };
    if (bay.k === 'B') { w.y0 = yF(f) + 0.9; w.y1 = yF(f) + 2.4; }
    else if (bay.k === 'S') { w.y0 = yF(f) + 2.35; w.y1 = yF(f) + 3.35; }
    else { w.y0 = yF(f) + 1.0; w.y1 = yF(f) + 2.68; }
    w.row = bay.k === 'S' ? 8 + f : f;
    w.apt = bay.k === 'S' ? -1 : (b < 2 ? 0 : 1);
    w.style = bay.k === 'S' ? 'steel' : bay.k === 'B' ? pick(R(), [['steel', .4], ['alu', .25], ['pvc', .2], ['wood', .15]]) : pick(R(), [['alu', .6], ['pvc', .25], ['steel', .15]]);
    w.lightKind = pick(R(), [[0, .55], [1, .33], [0.5, .12]]);   // 0 warm, 0.5 neutral, 1 cool
    w.curtain = bay.k === 'S' ? 0 : pick(R(), [[0.85, .45], [0.3, .3], [0.0, .25]]);
    w.litBefore = bay.k === 'S' ? (R() < .3 ? 0.55 : 0) : (R() < .5 ? 1 : 0);
    w.litAfter = bay.k === 'S' ? (R() < .35 ? 0.55 : 0) : (R() < .55 ? 1 : 0);
    w.leak = (w.style === 'steel' || w.style === 'wood') && bay.k === 'B' && R() < .25 ? 0.18 + R() * .15 : 0;
    w.tv = R() < .12 ? 1 : 0;
    w.cage = (f <= 1 && bay.k !== 'S' && R() < .75) ? 1 : 0;
    WINDOWS.push(w);
  }
}
// the window that leaks: unit 2 (middle), third floor, left room
export const LEAKY = WINDOWS.find(w => w.u === 1 && w.f === 2 && w.b === 1);
Object.assign(LEAKY, { style: 'steel', leak: 1, litBefore: 1, curtain: 0.85, lightKind: 0, cage: 0 });
// an empty flat (heating valves shut): unit 1, fifth floor, right side
for (const w of WINDOWS) if (w.u === 0 && w.f === 4 && w.apt === 1) { w.litBefore = 0; w.tin = 11; }
for (const w of WINDOWS) {
  if (w.tin === undefined) w.tin = w.k === 'S' ? 10 : 18.5 + 4 * w.seed;
  // the flat behind the cat's car keeps a warm light at the end
  if (w.u === 2 && w.f === 0 && w.k === 'B') { w.litAfter = 1; w.lightKind = 0; }
}
export const winAt = (u, f, b) => WINDOWS.find(w => w.u === u && w.f === f && w.b === b);

// ---- per-window data textures (16 x 16): picture (lit, light colour, curtain, seed) and thermal (indoor °C, glass °C, leak, style) ----
const STYLE_ID = { steel: 0, alu: 1, pvc: 2, wood: 3 };
export function makeWinTex() {
  const pic = new THREE.DataTexture(new Float32Array(16 * 16 * 4), 16, 16, THREE.RGBAFormat, THREE.FloatType);
  const th = new THREE.DataTexture(new Float32Array(16 * 16 * 4), 16, 16, THREE.RGBAFormat, THREE.FloatType);
  for (const t of [pic, th]) { t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; }
  return { pic, th };
}
export function glassT(w, after) {
  if (after) return w.k === 'S' ? PHYS.glassNew + 0.5 : w.k === 'A' ? PHYS.glassNew + 0.3 : PHYS.glassNew;
  if (w.k === 'S') return PHYS.glassStair;
  if (w.k === 'A') return (w.style === 'pvc') ? PHYS.glass2 + 0.4 : PHYS.glassBalc;
  return (w.style === 'pvc' || w.style === 'wood') ? PHYS.glass2 + (w.tin - 20) * 0.1 : PHYS.glass1 + (w.tin - 20) * 0.2;
}
// lit: function(w) -> 0..1.2 ; after: retrofit state
export function fillWinTex(tex, lit, after) {
  const P = tex.pic.image.data, T = tex.th.image.data;
  for (const w of WINDOWS) {
    const i = (w.row * 16 + w.col) * 4;
    P[i] = lit(w); P[i + 1] = w.lightKind; P[i + 2] = w.curtain; P[i + 3] = w.seed;
    T[i] = w.tin; T[i + 1] = glassT(w, after); T[i + 2] = after ? 0 : w.leak; T[i + 3] = after ? 2 : STYLE_ID[w.style];
  }
  tex.pic.needsUpdate = true; tex.th.needsUpdate = true;
}
export { STYLE_ID };
