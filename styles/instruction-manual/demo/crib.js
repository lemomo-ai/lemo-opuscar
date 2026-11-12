// crib.js — the film's one object: a slatted cot, built from parts. Dimensions in cm.
// x runs along the length (0..124), z across (0..66), y up. Every part can be offset (exploded) and recoloured (PAL.neu = the new part).
import { PAL, LW, box, prism, cyl, add3, sub3 } from './iso.js';

export const C = { L: 124, W: 66, H: 88, post: 5, slats: 11 };

// end panel: two posts and an arched board between them; x0 is the post's low x
export function endPanel(v, x0, off = [0, 0, 0], pal = PAL.part, o = {}) {
  const xf = o.xf || ((p) => p), O = (p) => xf(add3(p, off)), lw = o.lw ?? LW;
  // posts are tall and thin: sort them by their nearest corner so rails that butt into them stay behind
  for (const z of [0, C.W - 5]) {
    const a = add3([x0, 0, z], off), b = add3([x0 + 5, C.H, z + 5], off);
    const d = Math.max(...[0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k) => v.depth(xf([[a, b][i][0], [a, b][j][1], [a, b][k][2]]))))));   // nearest corner
    box(v, a, b, pal, { lw, depth: d, xf });
    cyl(v, O([x0 + 2.5, C.H, z + 2.5]), O([x0 + 2.5, C.H + 2.4, z + 2.5]), 2.1, pal, { lw, depth: d + .01 });
  }
  // the arched board: its two big faces are x0+4 and x0+1; the one turned toward the viewer is drawn as the face
  const N = 24, mk = (xx) => { const f = [O([xx, 20, 5]), O([xx, 20, C.W - 5])]; for (let i = 0; i <= N; i++) { const z = C.W - 5 - (C.W - 10) * i / N; f.push(O([xx, 72 + 9 * Math.sin(Math.PI * i / N), z])); } return f; };
  let fa = mk(x0 + 4), fb = mk(x0 + 1);
  const md = (f) => f.reduce((a, p) => a + v.depth(p), 0) / f.length;
  if (md(fb) > md(fa)) [fa, fb] = [fb, fa];
  const back = [fb[0][0] - fa[0][0], fb[0][1] - fa[0][1], fb[0][2] - fa[0][2]];
  prism(v, fa, back, pal, { lw, sharp: [0, 1, 2, N + 2], front: pal.x, side: pal.top });
}
// side panel: top rail, bottom rail, round slats; z0 is the rail's low z
export function sidePanel(v, z0, off = [0, 0, 0], pal = PAL.part, o = {}) {
  const xf = o.xf || ((p) => p), O = (p) => xf(add3(p, off)), lw = o.lw ?? LW, x0 = 5, x1 = C.L - 5, n = o.slats ?? C.slats;
  // the slats stand on the bottom rail and end under the top rail: sort the rails just outside the slats' depth range
  const ds = [];
  for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / (n + 1), a = O([x, 29, z0 + 1.5]), b = O([x, 76, z0 + 1.5]); ds.push(v.depth(a), v.depth(b)); cyl(v, a, b, 1.25, pal, { lw }); }
  const bx = (p) => xf(add3(p, off));
  box(v, [x0, 23, z0], [x1, 29, z0 + 3], pal, { lw, xf: bx, depth: Math.min(...ds) - .05 });
  box(v, [x0, 76, z0], [x1, 82, z0 + 3], pal, { lw, xf: bx, depth: Math.max(...ds) + .05 });
}
// mattress base board: it lies on the two bottom rails (their tops are at y 29), spanning between the posts
export const BASE_Y = 29;
export function base(v, off = [0, 0, 0], pal = PAL.part, o = {}) {
  const xf = o.xf || ((p) => p);
  box(v, add3([5, BASE_Y, 2.5], off), add3([C.L - 5, BASE_Y + 2, C.W - 2.5], off), pal, { lw: o.lw ?? LW, bias: o.bias ?? -40, xf });
}
// bolt along -x (head toward +x): tip at p
export function bolt(v, p, pal = PAL.metal, o = {}) {
  const lw = o.lw ?? LW * .8, len = o.len ?? 6;
  cyl(v, p, add3(p, [len, 0, 0]), .5, pal, { lw });
  cyl(v, add3(p, [len, 0, 0]), add3(p, [len + 1.1, 0, 0]), 1.25, pal, { lw, bias: .01 });
}

// ---------------- the one bed model ----------------
// Every picture of the bed in the film is drawn from this function and a state (see the assembly table in DEMO.md):
//   endR  right end panel (x 119–124), the first part to stand          · endL  left end panel (x 0–5): false | 'up' | 'flipped'
//   back  back rail (z 1–4)  · front  front rail (z 61.5–64.5)  · base  base board on the bottom rails  · mattress  on the board
// Rails sit between the posts, in line with them, and are bolted through the posts from outside (bolts at y 26 and 79).
// Only the right end's outer face (+x) is turned to us, so only its bolt heads are drawn.
// ov[part] = { off, pal, xf, skip } overrides one part (exploded, new = yellow, moving); st.off moves the whole bed.
export const flipL = (p) => { const c = [2.5, (C.H + 2.4) / 2, C.W / 2]; return [2 * c[0] - p[0], 2 * c[1] - p[1], p[2]]; };   // 180° about z through the left end
// mattress: lies on the base board (top of the board 31 cm), 10 cm thick, a little inside the rails
export const MAT_Y = BASE_Y + 2, MAT_T = 10;
export const MAT = { top: '#FFFFFF', z: '#F1EEE7', x: '#E4E0D6' };
export function mattress(v, off = [0, 0, 0], pal = MAT, o = {}) {
  const xf = o.xf || ((p) => p), lw = o.lw ?? LW;
  box(v, add3([6, MAT_Y, 3.5], off), add3([C.L - 6, MAT_Y + MAT_T, C.W - 3.5], off), pal, { lw, bias: o.bias ?? 0, xf,
    after: (g) => {   // the piping round the top edge: one thin line just below it, on the two faces turned to us
      g.save(); g.strokeStyle = '#1E1D1B'; g.lineWidth = lw * .45; g.lineCap = 'round';
      const y = MAT_Y + MAT_T - 2.2, P = (q) => v.P(xf(add3(q, off)));
      for (const [a, b] of [[[6, y, C.W - 3.5], [C.L - 6, y, C.W - 3.5]], [[C.L - 6, y, 3.5], [C.L - 6, y, C.W - 3.5]]]) { const p = P(a), q = P(b); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
      g.restore();
    } });
}
// The bed is painted in three groups, far to near, each depth-sorted inside: (A) left end + back rail, (B) base board, mattress
// and whatever lies on it (o.inner), (C) front rail + right end + bolt heads. Big flat parts (board, mattress) never fight the
// slats this way. Pass g to flush each group; people always stand outside the bed on our side, so they are drawn after it.
export function crib(v, st, ov = {}, g = null, o = {}) {
  const g0 = st.off || [0, 0, 0], O = (k) => add3(g0, ov[k]?.off || [0, 0, 0]), P = (k, d = PAL.part) => ov[k]?.pal || d, lw = st.lw;
  const X = (k, base_) => { const f = ov[k]?.xf; return f ? (p) => f(base_ ? base_(p) : p) : base_; };
  const flush = () => { if (g) v.flush(g); };
  // (A)
  if (st.endL && !ov.endL?.skip) {
    const off = O('endL'), inner = st.endL === 'flipped' ? (p) => add3(flipL(sub3(p, off)), off) : null;
    endPanel(v, 0, off, P('endL'), { lw, xf: X('endL', inner) });
  }
  if (st.back && !ov.back?.skip) sidePanel(v, 1, O('back'), P('back'), { lw, xf: X('back') });
  flush();
  // (B)
  if (st.base && !ov.base?.skip) base(v, O('base'), P('base'), { lw, xf: X('base'), bias: g ? 0 : -40 });
  if (st.mattress && !ov.mattress?.skip) mattress(v, O('mattress'), P('mattress', MAT), { lw, xf: X('mattress'), bias: g ? 0 : -30 });
  if (o.inner) o.inner(v);
  flush();
  // (C)
  if (st.front && !ov.front?.skip) sidePanel(v, C.W - 4.5, O('front'), P('front'), { lw, xf: X('front') });
  if (st.endR && !ov.endR?.skip) endPanel(v, C.L - 5, O('endR'), P('endR'), { lw, xf: X('endR') });
  if (st.endR) for (const [rail, z] of [['back', 2.5], ['front', C.W - 2.5]]) if (st[rail] && !ov[rail]?.off && !ov[rail]?.noHeads && !ov[rail]?.skip)
    for (const y of [26, 79]) { const p = add3(g0, [C.L, y, z]); cyl(v, p, add3(p, [.7, 0, 0]), 1.05, PAL.metal, { lw: (lw ?? LW) * .8, bias: 1 }); }
  flush();
}
export const S = {   // the bed after each step
  1: {}, 2: { endR: 1 }, 3: { endR: 1, back: 1 }, 4: { endR: 1, back: 1 }, 5: { endR: 1, back: 1, front: 1 },
  6: { endR: 1, back: 1, front: 1, base: 1, mattress: 1 }, 7: { endR: 1, back: 1, front: 1, base: 1, mattress: 1, endL: 'flipped' },
  8: { endR: 1, back: 1, front: 1, base: 1, mattress: 1, endL: 'up' }, 9: { endR: 1, back: 1, front: 1, base: 1, mattress: 1, endL: 'up' },
  10: { endR: 1, back: 1, front: 1, base: 1, mattress: 1, endL: 'up' },
};
