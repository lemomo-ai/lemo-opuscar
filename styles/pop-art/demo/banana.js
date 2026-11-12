// Banana, banana slice and banana plant, drawn into the pop print engine (page units, local transform).
import { T, ellipsePts } from './engine/pop.js';

// ---- the banana ----
// o: { L length, curve, girth, ink (plate densities), shade (plate densities added on the belly), hi (highlight 0..1),
//      stem (densities), stripes (densities or null), lw outline width, mis [dx,dy] misregistration of the colour plates }
export const VAR = {
  cavendish: { L: 420, curve: 0.46, girth: 0.24, ink: T.yellow, shade: { r: .34 }, stem: { y: .9, b: .55 } },
  gros: { L: 400, curve: 0.37, girth: 0.30, ink: T.yellow, shade: { r: .42 }, stem: { y: .9, b: .5 } },
  red: { L: 360, curve: 0.34, girth: 0.29, ink: { r: 1, b: .22 }, shade: { b: .7 }, stem: { y: .8, b: .6 } },
  blue: { L: 380, curve: 0.40, girth: 0.28, ink: { b: .42, y: .18 }, shade: { b: .75 }, stem: { y: .6, b: .7 } },
  plantain: { L: 500, curve: 0.31, girth: 0.25, ink: { y: 1, b: .55 }, shade: { b: .85, y: 1 }, stem: { r: .5, y: .8, b: .4 } },
  lady: { L: 250, curve: 0.46, girth: 0.34, ink: T.yellow, shade: { r: .55 }, stem: { y: .9, b: .5 } },
  pink: { L: 300, curve: 0.53, girth: 0.30, ink: { r: .48 }, shade: { r: .9 }, stem: { y: .8, b: .6 } },
  purple: { L: 380, curve: 0.43, girth: 0.27, ink: { r: .72, b: .9 }, shade: { r: 1, b: 1 }, stem: { y: .7, b: .7 } },
  striped: { L: 420, curve: 0.43, girth: 0.25, ink: { y: 1, b: .18 }, shade: { b: .5, y: 1 }, stripes: { y: 1, b: .75 }, stem: { y: .9, b: .6 } },
  orange: { L: 340, curve: 0.56, girth: 0.27, ink: { r: .62, y: 1 }, shade: { r: .9, y: 1 }, stem: { y: .8, b: .5 } },
  green: { L: 410, curve: 0.45, girth: 0.25, ink: { y: 1, b: .85 }, shade: { y: 1, b: 1 }, stem: { r: .5, y: .8, b: .5 } },
};

function geom(o) {
  const L = o.L, n = 40, pts = [], top = [], bot = [], ws = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n, x = (u - .5) * L, s = 2 * u - 1;
    const y = o.curve * L * .5 * (1 - s * s) - o.curve * L * .25;   // a smile: ends up, belly down
    const dy = o.curve * L * .5 * (-2 * s) * 2 / L;
    let nx = -dy, ny = 1; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;     // normal pointing down (belly)
    const w = o.girth * L * Math.pow(Math.sin(Math.PI * Math.min(1, u * .94 + .03)), .36) * (1 - .34 * Math.pow(u, 2.5)) * .5;
    pts.push([x, y, nx, ny]); ws.push(w);
    top.push([x - nx * w, y - ny * w]); bot.push([x + nx * w, y + ny * w]);
  }
  return { pts, top, bot, ws, n };
}

// outline polygons of a banana (for the giant mosaic): { body, belly }
export function bananaPolys(o) {
  const { pts, top, bot, ws, n } = geom(o);
  const body = top.concat(bot.slice().reverse());
  const belly = [];
  for (let k = 1; k < n; k++) { const p = pts[k]; belly.push([p[0] + p[2] * ws[k] * .12, p[1] + p[3] * ws[k] * .12]); }
  for (let k = n - 1; k >= 1; k--) belly.push(bot[k]);
  const back = [];
  for (let k = 7; k <= n - 9; k++) { const p = pts[k]; back.push([p[0] - p[2] * ws[k] * .55, p[1] - p[3] * ws[k] * .55]); }
  return { body, belly, back, tip: pts[0], end: pts[n], pre: pts[n - 3] };
}
// cheap banana for tiles that are only a few dozen pixels on screen
export function bananaLite(pop, o) {
  const { body } = bananaPolys(o);
  pop.fill(body, o.ink);
  pop.outline(body, o.lw || 9, { closed: true });
}

export function banana(pop, o) {
  o = { hi: 1, lw: 7, mis: [0, 0], ...o };
  const g = geom(o), { pts, top, bot, ws, n } = g;
  const body = top.concat(bot.slice().reverse());
  // stem (at u = 1), drawn first so the body covers its root
  const e = pts[n], e2 = pts[n - 3];
  const ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]) - .55;
  const sl = o.L * .13, sw = o.L * .045;
  const sx = e[0] - Math.cos(ang) * sl * .2, sy = e[1] - Math.sin(ang) * sl * .2;
  const cx = Math.cos(ang), cy = Math.sin(ang);
  const stem = [[sx - cy * sw, sy + cx * sw], [sx + cx * sl - cy * sw * .8, sy + cy * sl + cx * sw * .8],
    [sx + cx * sl + cy * sw * .8, sy + cy * sl - cx * sw * .8], [sx + cy * sw, sy - cx * sw]];
  const [mx, my] = o.mis;
  pop.save(); pop.translate(mx, my); pop.fill(stem, o.stem || { y: .9, b: .5 }); pop.restore();
  pop.outline(stem, o.lw * .8);
  const cap = [[stem[1][0], stem[1][1]], [stem[2][0], stem[2][1]]];
  pop.line(cap, o.lw * 1.6, { taper: 0 });
  // body (colour plates misregistered by `mis`, key line in place)
  pop.save(); pop.translate(mx, my);
  pop.fill(body, o.ink);
  if (o.stripes) for (let s = 0; s < 3; s++) {
    const off = -.55 + s * .55, st = [];
    for (let k = 4; k <= n - 3; k++) { const p = pts[k]; st.push([p[0] + p[2] * ws[k] * off, p[1] + p[3] * ws[k] * off]); }
    pop.fill(pop.ribbon(st, o.L * .03, { taper: .2 }), o.stripes);
  }
  // belly shade: Ben-Day dots added over the ink
  const sh = [];
  for (let k = 1; k < n; k++) { const p = pts[k]; sh.push([p[0] + p[2] * ws[k] * .12, p[1] + p[3] * ws[k] * .12]); }
  for (let k = n - 1; k >= 1; k--) sh.push(bot[k]);
  pop.over(sh, o.shade);
  // highlight: a paper-white sliver along the back
  if (o.hi > 0) {
    const hl = [];
    for (let k = 7; k <= n - 9; k++) { const p = pts[k]; hl.push([p[0] - p[2] * ws[k] * .55, p[1] - p[3] * ws[k] * .55]); }
    pop.fill(pop.ribbon(hl, o.L * .028 * o.hi, { taper: .45 }), T.white);
  }
  pop.restore();
  // ridge + outline + tip
  const ridge = []; for (let k = 3; k <= n - 4; k++) { const p = pts[k]; ridge.push([p[0] + p[2] * ws[k] * .1, p[1] + p[3] * ws[k] * .1]); }
  pop.line(ridge, o.lw * .45, { taper: .35 });
  pop.outline(body, o.lw, { closed: true });
  const t0 = pts[0];
  pop.black(ellipsePts(t0[0] + 3, t0[1] + 1, o.L * .022, o.L * .028, 18));
}

// ---- cross-section of a banana: rounded pentagon, cream flesh, a ring of tiny seed specks ----
export function slice(pop, R, { seeds = 1, lw = 10 } = {}) {
  const peel = [], flesh = [];
  for (let k = 0; k <= 60; k++) {
    const a = k / 60 * Math.PI * 2 - Math.PI / 2, r = 1 + .06 * Math.cos(5 * a);
    peel.push([Math.cos(a) * R * r, Math.sin(a) * R * r]);
    flesh.push([Math.cos(a) * R * .86 * r, Math.sin(a) * R * .86 * r]);
  }
  pop.fill(peel, T.yellow); pop.outline(peel, lw, { closed: true });
  pop.fill(flesh, { y: .2, r: .04 });
  pop.over(ellipsePts(R * .1, R * .12, R * .7, R * .66, 48), { y: .34, r: .08 });
  pop.outline(flesh, lw * .5, { closed: true });
  // the core: three soft lobes, and the specks that are all that is left of seeds
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 - Math.PI / 2;
    const lobe = ellipsePts(Math.cos(a) * R * .13, Math.sin(a) * R * .13, R * .16, R * .09, 30).map(([x, y]) => {
      const dx = x - Math.cos(a) * R * .13, dy = y - Math.sin(a) * R * .13;
      return [Math.cos(a) * R * .13 + dx * Math.cos(a) - dy * Math.sin(a), Math.sin(a) * R * .13 + dx * Math.sin(a) + dy * Math.cos(a)];
    });
    pop.fill(lobe, { y: .5, r: .1 });
  }
  if (seeds > 0) for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + .3, rr = R * (.26 + .03 * (i % 2));
    const s = R * .022 * Math.min(1, seeds * 9 - i);
    if (s > .5) pop.black(ellipsePts(Math.cos(a) * rr, Math.sin(a) * rr, s, s * 1.2, 12));
  }
}

// ---- a banana plant (pseudostem + leaves), growing g 0..1; base at (0,0) ----
export function plant(pop, { H = 520, g = 1, lw = 7, mis = [0, 0], leafInk = T.green, stemInk = { y: 1, b: .45 } } = {}) {
  if (g <= 0) return;
  const h = H * g, w = H * .075 * (.4 + .6 * g);
  const stem = [[-w, 0], [-w * .78, -h * .62], [-w * .5, -h * .66], [w * .5, -h * .66], [w * .78, -h * .62], [w, 0]];
  const leaves = [[-2.3, .95], [-1.45, 1.1], [-.35, .8], [.45, .85], [1.4, 1.15], [2.25, .9]];
  const top = [0, -h * .64];
  const leafPolys = leaves.map(([a, len]) => {
    const L = H * .55 * len * g, p = [], q = [], mid = [];
    const dir = Math.sign(a) || 1;
    // quadratic centreline: up and out, then the tip droops
    const c1 = [top[0] + Math.sin(a) * L * .5, top[1] - Math.cos(a) * L * .6 - L * .25];
    const e = [top[0] + Math.sin(a) * L, top[1] - Math.cos(a) * L * .9 + L * .45 * Math.sin(a) ** 2];
    for (let k = 0; k <= 22; k++) {
      const u = k / 22, v = 1 - u;
      const x = v * v * top[0] + 2 * v * u * c1[0] + u * u * e[0], y = v * v * top[1] + 2 * v * u * c1[1] + u * u * e[1];
      const tx = 2 * v * (c1[0] - top[0]) + 2 * u * (e[0] - c1[0]), ty = 2 * v * (c1[1] - top[1]) + 2 * u * (e[1] - c1[1]);
      const tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
      const ww = L * .27 * Math.pow(Math.sin(Math.PI * Math.min(1, .04 + u * .96)), .6) * (u < .12 ? u / .12 * .6 + .4 : 1);
      p.push([x + nx * ww, y + ny * ww]); q.push([x - nx * ww, y - ny * ww]); mid.push([x, y]);
    }
    return { poly: p.concat(q.slice().reverse()), mid, half: p.concat(mid.slice().reverse()) };
  });
  const [mx, my] = mis;
  // back leaves, stem, front leaves
  leafPolys.forEach((lp, i) => { if (i % 2) return; pop.save(); pop.translate(mx, my); pop.fill(lp.poly, leafInk); pop.over(lp.half, { b: 1 }); pop.restore(); pop.outline(lp.poly, lw * .8, { closed: true }); pop.line(lp.mid, lw * .4, { taper: .4 }); });
  pop.save(); pop.translate(mx, my); pop.fill(stem, stemInk); pop.over([[0, 0], [0, -h * .66], [w * .5, -h * .66], [w * .78, -h * .62], [w, 0]], { b: .8 }); pop.restore();
  pop.outline(stem, lw, { closed: true });
  leafPolys.forEach((lp, i) => { if (!(i % 2)) return; pop.save(); pop.translate(mx, my); pop.fill(lp.poly, leafInk); pop.over(lp.half, { b: 1 }); pop.restore(); pop.outline(lp.poly, lw * .8, { closed: true }); pop.line(lp.mid, lw * .4, { taper: .4 }); });
}
