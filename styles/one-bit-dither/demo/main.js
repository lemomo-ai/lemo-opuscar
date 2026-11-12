// 《月亮的传真》 The Moon's Fax · 1-bit Dither demo. Page contract: window.READY, window.render(t), window.DUR, window.TEXTS(t), window.EV.
// render(t) depends only on t. Each set (scene) is built once; the shot table picks which set draws a frame, and two
// sets can be mixed with an ordered dissolve. The photographs on paper are rendered at load from the Moon set.
import * as THREE from 'three';
import { Pipe, Present, RW, RH } from './pipe.js';
import { DUR, T, STAMP1, STAMP2, RIM, CUTS, SYNC, PRINT, syncTicks } from './timeline.js';
import { buildMoon } from './moon.js';
import { makePrints } from './prints.js';
import { buildDusk } from './dusk.js';
import { buildRoom } from './room.js';
import { buildCuts } from './cuts.js';
import { buildDrum } from './drum.js';
import { buildBoard } from './board.js';
import { buildTown } from './town.js';
import { buildEnd } from './endcard.js';

const Q = new URLSearchParams(location.search);
window.DUR = DUR;
const W = innerWidth, H = innerHeight;
const INK = '#16161a', PAPER = '#e9e6d6';
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;

const pipe = new Pipe(renderer), present = new Present(renderer, INK, PAPER);
const rtA = pipe.target(), rtB = pipe.target();

await Promise.all(['700 40px SerifSC', '400 40px SerifSC', '900 40px SansSC', '40px HandSC', '40px HandEn', '40px TypeEn', '700 40px NewsEn', '400 40px NewsEn', '40px AntonEn'].map(f => document.fonts.load(f, '月A')));

// ---------- the Moon, and the photographs printed from it ----------
const moon = buildMoon();
const prints = makePrints(renderer, moon);
const ctx = { renderer, prints, moon };
const SETS = { moon, dusk: buildDusk(ctx), room: buildRoom(ctx), cuts: buildCuts(ctx), drum: buildDrum(ctx), board: buildBoard(ctx), town: buildTown(ctx), end: buildEnd(ctx) };

const SHOTS = [
  ['dusk', T.A0, T.B0], ['room', T.B0, T.C0], ['cuts', T.C0, CUTS[3]], ['drum', CUTS[3], T.E0], ['moon', T.E0, T.F0],
  ['room', T.F0, T.G0], ['board', T.G0, T.H0], ['town', T.H0, T.END], ['end', T.END, DUR + 1],
];
// transitions stay 1-bit: [from, to, set A, set B, mode, block]. mode 1 = block dissolve on the Moon's 32-px coarse grid
// (no fine checkerboard that reads as grey); mode 2 = fax scan, the print replaces the Moon line by line.
const DISSOLVES = [[T.E0 - 0.1, T.E0 + 0.1, 'drum', 'moon', 1, 32], [T.F0 - 0.3, T.F0 + 0.03, 'moon', 'room', 2, 0]];
const shotAt = t => SHOTS.find(s => t >= s[1] && t < s[2]) || SHOTS[SHOTS.length - 1];
const inverted = t => [STAMP1, STAMP2].some(s => t >= s && t < s + 1 / 30 + 1e-4);

let lastFrame = { set: null };
function draw(name, t, out) { const S = SETS[name]; const o = S.update(t) || {}; pipe.render(S.scene, S.camera, out, o); }
window.render = function (t) {
  t = Math.max(0, Math.min(DUR, +t || 0));
  if (Q.get('only')) { draw(Q.get('only'), t, rtA); present.draw(rtA, null, 0, false); lastFrame = { set: Q.get('only') }; return; }
  const d = DISSOLVES.find(x => t >= x[0] && t < x[1]);
  if (d) {
    draw(d[2], t, rtA); draw(d[3], t, rtB);
    const m = (t - d[0]) / (d[1] - d[0]); present.draw(rtA, rtB, m, inverted(t), d[4], d[5]);
    lastFrame = { set: m < 0.5 ? d[2] : d[3] };
  } else {
    const s = shotAt(t); draw(s[0], t, rtA); present.draw(rtA, null, 0, inverted(t)); lastFrame = { set: s[0] };
  }
};
// readable text on screen at t (1080p pixels), from whichever set is showing
window.TEXTS = t => { window.render(t); const S = SETS[lastFrame.set]; return S && S.texts ? S.texts(t, W, H) : []; };

// sound events
const EV = [];
syncTicks(T.B0 - 0.5, T.D0 - 0.01).forEach(x => EV.push({ t: +x.toFixed(3), type: 'sync' }));
CUTS.forEach((x, i) => EV.push({ t: +x.toFixed(3), type: 'cut', i }));
for (let i = 0; i < PRINT.rows; i++) { const tr = PRINT.t0 + i * PRINT.rowDur; if (tr >= T.D0 - 0.01) EV.push({ t: +tr.toFixed(3), type: 'row', i }); }
Object.values(SETS).forEach(S => S.events && S.events().forEach(e => EV.push(e)));
EV.push({ t: T.E0, type: 'through' }, { t: RIM, type: 'rim' }, { t: T.F0, type: 'paper' }, { t: STAMP1, type: 'stamp', i: 0 }, { t: STAMP2, type: 'stamp', i: 1 }, { t: T.H0, type: 'news' }, { t: T.END, type: 'end' });
for (const k in T) EV.push({ t: T[k], type: 'shot', name: k });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;

window.render(0); window.render(Q.get('t') ? +Q.get('t') : 0);
// debug: camera pose of the set on screen at t (for motion-smoothness checks)
window.CAM = t => { window.render(t); const c = SETS[lastFrame.set].camera; const e = c.matrixWorld.elements; return { set: lastFrame.set, p: [e[12], e[13], e[14]], f: [-e[8], -e[9], -e[10]], fov: c.fov || 0, pm: Array.from(c.projectionMatrix.elements.slice(0, 10)) }; };
window.READY = true;
if (Q.get('show')) { const c = Q.get('show').split('.').reduce((o, k) => o[k], prints); c.style.cssText = 'position:absolute;left:0;top:0;height:100vh;image-rendering:pixelated;z-index:9;background:#fff'; document.body.appendChild(c); }
