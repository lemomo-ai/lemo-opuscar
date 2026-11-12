// Textbook Doodle · the margin stick figure. Drawn fresh in ink every frame (a flipbook, not a puppet): poses blend with
// easing, the figure is re-inked on twos, and every limb boils with the rest of the doodles.
//   figure(ctx, pose, b)  pose: {x, y (hip), s (height unit, px), lean, armL:[a,b], armR, legL, legR, head, face, mouth, props, tool}
//   Angles: 0 = hanging straight down, +π/2 = pointing to +x (screen right), ±π = up. The second angle bends the lower limb.
//   POSES   named poses; blend(a, b, u) mixes two of them; at(keys, t) plays [{t, pose}] with ease in/out between keys.
import { lerp, clamp, ss } from '/core/lib.js';
import { Stroke, drawStroke, ellipse, line, poly } from './pen.js';

export const POSES = {
  stand:  { lean: 0, armL: [-.25, .1], armR: [.25, -.1], legL: [-.18, 0], legR: [.18, 0], head: 0 },
  cool:   { lean: -.08, armL: [-.5, -1.3], armR: [.55, 1.4], legL: [-.22, 0], legR: [.3, -.1], head: -.12 },   // hands on hips
  point:  { lean: .06, armL: [-.3, .1], armR: [1.75, .05], legL: [-.25, .05], legR: [.2, 0], head: .05 },
  pointUp:{ lean: .02, armL: [-.4, .2], armR: [2.7, .1], legL: [-.2, 0], legR: [.2, 0], head: -.15 },
  cheer:  { lean: 0, armL: [-2.5, -.2], armR: [2.5, .2], legL: [-.3, 0], legR: [.3, 0], head: -.2 },
  shrug:  { lean: 0, armL: [-.9, -1.9], armR: [.9, 1.9], legL: [-.15, 0], legR: [.15, 0], head: .15 },
  run1:   { lean: .3, armL: [-.9, 1.3], armR: [1.1, 1.2], legL: [-.7, .9], legR: [.75, .2], head: .1 },
  run2:   { lean: .3, armL: [1.0, 1.2], armR: [-.8, 1.3], legL: [.75, .2], legR: [-.7, .9], head: .1 },
  climb1: { lean: .05, armL: [2.8, 0], armR: [2.3, .5], legL: [-.1, -1.2], legR: [.3, 0], head: -.25 },
  climb2: { lean: .05, armL: [2.3, .5], armR: [2.8, 0], legL: [.3, 0], legR: [-.1, -1.2], head: -.25 },
  kick:   { lean: -.25, armL: [-1.2, .5], armR: [-.6, .8], legL: [-.15, 0], legR: [1.8, -.2], head: -.1 },
  hug:    { lean: .15, armL: [1.4, 1.1], armR: [1.6, 1.0], legL: [-.15, 0], legR: [.2, 0], head: .15 },
  sit:    { lean: -.05, armL: [.4, .9], armR: [.5, .8], legL: [1.5, -1.5], legR: [1.6, -1.5], head: .25 },
  lie:    { lean: -1.5, armL: [2.1, 0], armR: [2.4, 0], legL: [2.2, 0], legR: [2.3, 0], head: 0 },   // limbs along the body (angle = −1.5 × lean)
  sleep:  { lean: 0, armL: [-.07, .02], armR: [.07, -.02], legL: [-.05, 0], legR: [.05, 0], head: .1 },   // standing to attention; rotate 90° to lie down
  slump:  { lean: .35, armL: [-.05, .1], armR: [.1, -.1], legL: [-.15, .2], legR: [.15, .25], head: .6 },
  wave1:  { lean: 0, armL: [-.3, .1], armR: [2.3, .6], legL: [-.18, 0], legR: [.18, 0], head: .1 },
  wave2:  { lean: 0, armL: [-.3, .1], armR: [2.6, -.5], legL: [-.18, 0], legR: [.18, 0], head: .1 },
  dab:    { lean: -.15, armL: [-2.2, -.1], armR: [-1.3, -1.6], legL: [-.3, 0], legR: [.3, 0], head: .5 },
  bow:    { lean: .9, armL: [.2, 0], armR: [.3, 0], legL: [-.1, 0], legR: [.1, 0], head: .3 },
};
const KEYS = ['lean', 'head'], PAIRS = ['armL', 'armR', 'legL', 'legR'];

export function blend(a, b, u) {
  const o = { ...a };
  for (const k of KEYS) o[k] = lerp(a[k] ?? 0, b[k] ?? 0, u);
  for (const k of PAIRS) o[k] = [lerp(a[k][0], b[k][0], u), lerp(a[k][1], b[k][1], u)];
  return o;
}
// keys: [{t, p: 'name' | pose}]: ease in/out between keys, sampled at 12 fps (flipbook timing)
export function at(keys, t) {
  const tt = Math.floor(t * 12) / 12, P = k => typeof k.p === 'string' ? POSES[k.p] : k.p;
  if (tt <= keys[0].t) return P(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (tt < b.t) { const hold = a.hold ?? 0, u = clamp((tt - a.t - hold) / Math.max(1e-3, b.t - a.t - hold), 0, 1); return blend(P(a), P(b), ss(u)); }
  }
  return P(keys[keys.length - 1]);
}

const dir = (a) => [Math.sin(a), Math.cos(a)];

export function figure(ctx, f, b, k = 1) {
  const s = f.s ?? 100, seed = f.seed ?? 77, tool = f.tool ?? 'ball', w = (f.w ?? 3.6) * Math.max(.7, s / 100);
  const L = (pts, i) => drawStroke(ctx, new Stroke(pts.flat(), { tool, w, seed: seed + i, smooth: 1 }), null, b, k);
  const lean = f.lean ?? 0, hip = [f.x, f.y], up = [Math.sin(lean), -Math.cos(lean)];
  const neck = [hip[0] + up[0] * s * .62, hip[1] + up[1] * s * .62];
  const hr = s * .2, hc = [neck[0] + up[0] * (hr + s * .04) + Math.sin(f.head ?? 0) * s * .03, neck[1] + up[1] * (hr + s * .04)];
  const flip = f.flip ? -1 : 1;
  const limb = (from, ang, l1, l2, i) => {
    const a1 = lean * .5 + ang[0] * flip, d1 = dir(a1), mid = [from[0] + d1[0] * l1, from[1] + d1[1] * l1];
    const d2 = dir(a1 + ang[1] * flip), end = [mid[0] + d2[0] * l2, mid[1] + d2[1] * l2];
    L([from, mid, end], i); return end;
  };
  L([hip, neck], 1);                                                   // body
  const sh = [neck[0] + up[0] * -s * .06, neck[1] + up[1] * -s * .06];
  const hands = [limb(sh, f.armL, s * .32, s * .3, 2), limb(sh, f.armR, s * .32, s * .3, 3)];
  const feet = [limb(hip, f.legL, s * .36, s * .36, 4), limb(hip, f.legR, s * .36, s * .36, 5)];
  for (const st of ellipse(hc[0], hc[1], hr, hr * 1.05, { tool, w, seed: seed + 6, lap: .25 })) drawStroke(ctx, st, null, b, k);   // head
  face(ctx, f, hc, hr, b, k, tool, w, seed);
  props(ctx, f, hc, hr, hands, b, k, tool, w, seed);
  return { hc, hr, hands, feet, neck, hip };
}

function face(ctx, f, [x, y], r, b, k, tool, w, seed) {
  const fc = f.face ?? 'smile', dx = (f.flip ? -1 : 1) * r * .18, D = (pts, i, o = {}) => drawStroke(ctx, new Stroke(pts.flat(), { tool, w: w * .8, seed: seed + 20 + i, ...o }), null, b, k);
  const m = f.mouth ?? 0;
  if (fc === 'shock') { for (const st of ellipse(x + dx, y + r * .45, r * .16, r * (.12 + m * .1), { tool, w: w * .8, seed: seed + 30 })) drawStroke(ctx, st, null, b, k); D([[x + dx - r * .35, y - r * .15], [x + dx - r * .3, y - r * .05]], 1); D([[x + dx + r * .3, y - r * .15], [x + dx + r * .35, y - r * .05]], 2); return; }
  if (fc === 'cry') { D([[x + dx - r * .4, y - r * .1], [x + dx - r * .15, y - r * .05]], 1); D([[x + dx + r * .1, y - r * .05], [x + dx + r * .35, y - r * .1]], 2); D([[x + dx - r * .3, y + r * .05], [x + dx - r * .32, y + r * .5]], 3, { tool: 'ball', w: w * .6 }); D([[x + dx - r * .2, y + r * .55], [x + dx, y + r * .42], [x + dx + r * .2, y + r * .55]], 4); return; }
  if (!f.props?.glasses) { D([[x + dx - r * .3, y - r * .12], [x + dx - r * .28, y - r * .02]], 1); D([[x + dx + r * .28, y - r * .12], [x + dx + r * .3, y - r * .02]], 2); }
  if (m > .15) { for (const st of ellipse(x + dx, y + r * .42, r * .2, r * .08 + r * .16 * m, { tool, w: w * .8, seed: seed + 31 })) drawStroke(ctx, st, null, b, k); }
  else if (fc === 'grin' || fc === 'smile') D([[x + dx - r * .32, y + r * .3], [x + dx, y + r * (fc === 'grin' ? .58 : .48)], [x + dx + r * .32, y + r * .3]], 5, { smooth: 2 });
  else if (fc === 'flat') D([[x + dx - r * .28, y + r * .42], [x + dx + r * .28, y + r * .4]], 5);
  else if (fc === 'sad') D([[x + dx - r * .3, y + r * .55], [x + dx, y + r * .38], [x + dx + r * .3, y + r * .55]], 5, { smooth: 2 });
}

function props(ctx, f, [x, y], r, hands, b, k, tool, w, seed) {
  const P = f.props || {}, D = (pts, i, o = {}) => drawStroke(ctx, new Stroke(pts.flat(), { tool, w, seed: seed + 40 + i, ...o }), null, b, k);
  if (P.glasses) {                      // sunglasses: two inked lenses + the frame
    const dx = (f.flip ? -1 : 1) * r * .15, yy = y - r * .08;
    for (const [cx, i] of [[x + dx - r * .32, 0], [x + dx + r * .32, 1]]) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tool === 'black' ? '#1b1c22' : '#1f3a9e'; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.ellipse(cx, yy, r * .3, r * .2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(cx - r * .1, yy - r * .06, r * .07, r * .035, -.5, 0, 6.3); ctx.fill(); ctx.restore();
    }
    D([[x + dx - r * .62, yy - r * .05], [x + dx + r * .62, yy - r * .05]], 2, { w: w * .7 });
  }
  if (P.specs) { const dx = (f.flip ? -1 : 1) * r * .15; for (const [cx, i] of [[x + dx - r * .3, 3], [x + dx + r * .3, 4]]) for (const st of ellipse(cx, y - r * .08, r * .2, r * .17, { tool, w: w * .7, seed: seed + 50 + i, lap: .05 })) drawStroke(ctx, st, null, b, k); }
  if (P.cap) {                          // mortarboard
    const top = y - r * 1.05; D([[x - r * 1.1, top], [x, top - r * .35], [x + r * 1.1, top], [x, top + r * .3], [x - r * 1.1, top]], 5); D([[x + r * .9, top + .05 * r], [x + r * 1.0, top + r * .7]], 6);
  }
  if (P.hair) D([[x - r * .9, y - r * .5], [x - r * .5, y - r * 1.25], [x, y - r * 1.05], [x + r * .5, y - r * 1.3], [x + r * .95, y - r * .45]], 7, { smooth: 2 });
  if (P.bandage) { D([[x - r * .95, y - r * .55], [x + r * .95, y - r * .7]], 8, { tool: 'pencil', w: w * 2.2 }); D([[x + r * .55, y - r * .7], [x + r * .9, y - r * 1.0]], 9, { w: w * .7 }); }
  if (P.sweat) D([[x + r * 1.1, y - r * .6], [x + r * 1.05, y - r * .25]], 10, { w: w * .7 });
  if (P.book) { const [hx, hy] = hands[1]; D([[hx - 4, hy - r * .9], [hx + r * .8, hy - r * .8], [hx + r * .8, hy + r * .1], [hx - 4, hy], [hx - 4, hy - r * .9]], 11); }
  if (P.wrench) { const [hx, hy] = hands[1]; D([[hx, hy], [hx + r * 1.0, hy - r * 1.0]], 12, { w: w * 1.4 }); D([[hx + r * .8, hy - r * 1.4], [hx + r * 1.25, hy - r * 1.25], [hx + r * 1.4, hy - r * .8]], 13, { smooth: 1 }); }
  if (P.scarf) {                        // scarf: a red-pen loop round the neck, one tail hanging down
    D([[x - r * .85, y + r * 1.1], [x, y + r * 1.35], [x + r * .85, y + r * 1.1]], 15, { tool: 'red', w: w * 1.8, smooth: 2 });
    D([[x + r * .45, y + r * 1.25], [x + r * .6, y + r * 2.1]], 16, { tool: 'red', w: w * 1.6 });
  }
  if (P.santa) {                        // Santa hat: a red triangle flopping to one side + white brim + pompom
    const fl = f.flip ? -1 : 1, tip = [x + fl * r * 1.5, y - r * 1.9];
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#e8343a'; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.moveTo(x - r * 1.0, y - r * .55); ctx.quadraticCurveTo(x - r * .2, y - r * 2.3, tip[0], tip[1]); ctx.quadraticCurveTo(x + fl * r * .5, y - r * 1.1, x + r * 1.0, y - r * .55); ctx.closePath(); ctx.fill(); ctx.restore();
    D([[x - r * 1.05, y - r * .55], [x + r * 1.05, y - r * .6]], 17, { w: w * 1.5 });
    for (const st of ellipse(tip[0], tip[1], r * .25, r * .25, { tool, w, seed: seed + 61 })) drawStroke(ctx, st, null, b, k);
  }
  if (P.mic) { const [hx, hy] = hands[1]; D([[hx, hy], [hx + r * .1, hy - r * .7]], 14, { w: w * 1.3 }); for (const st of ellipse(hx + r * .12, hy - r * .85, r * .2, r * .22, { tool, w, seed: seed + 60 })) drawStroke(ctx, st, null, b, k); }
}
