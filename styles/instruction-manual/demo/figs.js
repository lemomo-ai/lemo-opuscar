// figs.js — turnaround sheet for the two people (?f=figs): eight headings each, then the film's working poses;
// and the close-up hands sheet (?f=hands, handSheet below).
// The floor arrow under every figure points where the hips face, so the head, the bun and the feet can be checked against it.
import { PAL, makeView, planeArrow } from './iso.js';
import { person } from './rig.js';
import { stand, handsOnHips, scratch, read, sitLaugh, kneel, leanOn, sitCross, lp } from './poses.js';
import { paper, FONT, magnifier } from './page.js';
import { cyl, box, rotAbout } from './iso.js';
import { hand } from './hand.js';

const NAMES = { 45: 'front', 0: '3/4 front', 90: '3/4 front', 135: 'side', 315: 'side', 180: '3/4 back', 270: '3/4 back', 225: 'back' };
function label(g, x, y, t) { g.save(); g.fillStyle = PAL.ink; g.font = `500 20px ${FONT.num}`; g.textAlign = 'center'; g.fillText(t, x, y); g.restore(); }
export function figs(g, W, H) {
  paper(g, W, H);
  const order = [45, 90, 135, 180, 225, 270, 315, 0];
  ['b', 'a'].forEach((lk, r) => order.forEach((f, i) => {
    const cx = 130 + i * 236, cy = 300 + r * 330, v = makeView({ cx, cy, s: 1.55 });
    planeArrow(v, [0, 0, 0], [Math.cos(f * Math.PI / 180), 0, Math.sin(f * Math.PI / 180)], [-Math.sin(f * Math.PI / 180), 0, Math.cos(f * Math.PI / 180)], 34, 5, { layer: -1, halo: 0, fill: '#CFCBC2' });
    person(v, stand([0, 0], f, lk)); v.flush(g);
    label(g, cx, cy + 36, `${f}° · ${NAMES[f]}`);
  }));
  // working poses
  const P = [
    ['read', (v) => person(v, read([0, 0], 0, 'b'))],
    ['look over', (v) => person(v, stand([0, 0], 90, 'a', { lookAt: [40, 60, 60], hip: -2 }))],
    ['hands on hips', (v) => person(v, handsOnHips([0, 0], 0, 'a', { head: { pitch: 18 } }))],
    ['scratch head', (v) => person(v, scratch([0, 0], 90, 'b'))],
    ['half-kneel', (v) => person(v, kneel([0, 0], 180, 'b', { hands: [lp([0, 0], 180, 40, 8, 30), lp([0, 0], 180, 34, -10, 49)] }))],
    ['laugh (cross-legged)', (v) => person(v, sitCross([0, 0], 315, 'a', .4))],
    ['lean on rail', (v) => person(v, leanOn([0, 0], 0, 'b', 82))],
    ['walk', (v) => person(v, { at: [0, 0], face: 0, look: 'a', feet: [[13, 10, 2, 4], [-11, -10, 0, 4]], lean: 4, head: { pitch: 8 } })],
  ];
  P.forEach(([n, fn], i) => { const cx = 130 + i * 236, cy = 980, v = makeView({ cx, cy, s: 1.55 }); fn(v); v.flush(g); label(g, cx, cy + 36, n); });
}

// ---------- hands in close-up (?f=hands): hand.js's poses from the back and from the palm side, then four close-up shots ----------
// Every tile is a frame of its own (the arm is cut by its edge, as in a shot); check a new hand pose here before using it.
function tile(g, x, y, w, h, draw) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); draw({ x, y, w, h }); g.restore();
  g.save(); g.lineWidth = 1.5; g.strokeStyle = PAL.ink; g.strokeRect(x, y, w, h); g.restore();
}
export function handSheet(g, W, H) {
  paper(g, W, H);
  const poses = ['relaxed', 'flat', 'point', 'press', 'grip', 'pinch'], tw = 290, th = 230, x0 = 45, gap = 20;
  const views = [   // seen from above, back of the hand toward us; then the palm toward us
    { dir: [.35, .25, -1], palm: [.1, -1, -.25], side: 'r', name: 'back' },
    { dir: [-.25, .35, -1], palm: [.62, .5, .6], side: 'l', name: 'palm' },
  ];
  views.forEach((vw, r) => poses.forEach((ps, i) => {
    const x = x0 + i * (tw + gap), y = 30 + r * (th + 46);
    tile(g, x, y, tw, th, (fr) => {
      const v = makeView({ cx: x + tw / 2, cy: y + th / 2 + 10, s: 8.6 }), F = vw.dir.map((c) => c / Math.hypot(...vw.dir));
      if (ps === 'grip') cyl(v, [-14, 8.5 + F[1] * 15, 6], [14, 8.5 + F[1] * 15, 6], 1.3, PAL.metal);
      hand(v, { wrist: F.map((c) => -c * 9), dir: vw.dir, palm: vw.palm, side: vw.side, pose: ps, r: 1.3, sleeve: r ? PAL.grey1 : '#FFFFFF', frame: fr });
      v.flush(g);
    });
    label(g, x + tw / 2, y + th + 30, `${ps} · ${vw.name}`);
  }));
  const sw = 420, sh = 470, sy = 580;
  // 1: a finger presses a button on a white box; the arm comes in from the top edge
  tile(g, x0, sy, sw, sh, (fr) => {
    const v = makeView({ cx: x0 + sw / 2 - 10, cy: sy + sh / 2 + 80, s: 6.5 });
    box(v, [-20, 0, -20], [20, 14, 20]); box(v, [-4, 14, -4], [4, 16, 4], PAL.neu);
    hand(v, { tipAt: [0, 16.6, 0], dir: [.1, -.75, -.65], palm: [.3, .55, -.75], side: 'r', pose: 'press', sleeve: PAL.grey1, frame: fr });
    v.flush(g);
  });
  label(g, x0 + sw / 2, sy + sh + 30, 'press a button (o.tipAt)');
  // 2: one hand steadies a jar, the other tips its lid open (the lid is cyl() moved by o.xf, the same rotAbout as a box)
  tile(g, x0 + sw + gap, sy, sw, sh, (fr) => {
    const v = makeView({ cx: x0 + sw * 1.5 + gap - 20, cy: sy + sh / 2 + 10, s: 6 });
    cyl(v, [0, 0, 0], [0, 22, 0], 9, PAL.part);
    const xf = rotAbout([0, 22, -9], [1, 0, 0], -38 * Math.PI / 180);
    hand(v, { palmAt: [-2, 10, 11.2], dir: [.25, .1, -1], palm: [0, 0, -1], side: 'l', pose: 'grip', r: 8, sleeve: PAL.grey1, frame: fr });
    cyl(v, [0, 22, 0], [0, 25, 0], 9.6, PAL.neu, { xf });
    hand(v, { tipAt: xf([5, 25.5, 9.4]), dir: [-.35, -.8, -.45], palm: [-.6, -.1, .75], side: 'r', pose: 'pinch', sleeve: PAL.grey1, frame: fr });
    v.flush(g);
  });
  label(g, x0 + sw * 1.5 + gap, sy + sh + 30, 'steady the jar, tip the lid')
;
  // 3: a magnifier: the hand turns a hex key (the arm is cut by the circle)
  tile(g, x0 + 2 * (sw + gap), sy, sw, sh, () => {
    const cx = x0 + 2.5 * sw + 2 * gap, cy = sy + sh / 2;
    magnifier(g, [cx - 150, cy + 170], cx + 20, cy - 10, 170, (g) => {
      const v = makeView({ cx: cx + 20, cy: cy - 10, s: 9 });
      box(v, [-30, -20, -3], [-1, 20, 3]);
      cyl(v, [-1, 0, 0], [3, 0, 0], .45, PAL.metal); cyl(v, [3, 0, 0], [3, 11, 0], .45, PAL.metal);
      hand(v, { wrist: [10, 4, 12], dir: [-.45, .5, -.75], palm: [-.7, -.2, .4], side: 'r', pose: 'grip', r: .5, sleeve: '#FFFFFF', frame: { cx: cx + 20, cy: cy - 10, r: 170 } });
      v.flush(g);
    });
  });
  label(g, x0 + 2.5 * sw + 2 * gap, sy + sh + 30, 'magnifier: turn the key');
  // 4: o.xf on cyl() and box(): the same rotation tips both lids by the same angle
  tile(g, x0 + 3 * (sw + gap), sy, sw, sh, () => {
    [0, 25, 50].forEach((a, i) => {
      const v = makeView({ cx: x0 + 3 * (sw + gap) + 85 + i * 125, cy: sy + 230, s: 3.2 }), xf = rotAbout([0, 20, -9], [1, 0, 0], -a * Math.PI / 180);
      cyl(v, [0, 0, 0], [0, 20, 0], 9, PAL.part); cyl(v, [0, 20, 0], [0, 23, 0], 9.6, PAL.neu, { xf });
      v.flush(g);
      const b = makeView({ cx: x0 + 3 * (sw + gap) + 85 + i * 125, cy: sy + 400, s: 3.2 }), xb = rotAbout([0, 20, -9], [1, 0, 0], -a * Math.PI / 180);
      box(b, [-9, 0, -9], [9, 20, 9]); box(b, [-9.5, 20, -9.5], [9.5, 23, 9.5], PAL.neu, { xf: xb });
      b.flush(g);
      label(g, x0 + 3 * (sw + gap) + 85 + i * 125, sy + 455, `${a}°`);
    });
  });
  label(g, x0 + 3.5 * sw + 3 * gap, sy + sh + 30, 'o.xf: cyl() and box()');
}
