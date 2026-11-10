// Crayon stroke engine (Canvas2D, from styles/crayon-book/demo; fill takes multi-ring regions and a hand scribble): draws into pressure layers (RGB = colour, A = pressure); gl.js decides where the wax sticks to the paper tooth.
// World -> screen through CAM; line widths are in screen pixels (every frame is a fresh drawing, so the crayon width barely follows the zoom).
// BOIL.step = floor(t*12): the jitter seed changes every 2 frames (at 24 fps) = the lines boil.
import { clamp, lerp, hash, vnoise } from '/core/lib.js';
export const W = 1920, H = 1080;
export const CAM = { x: 960, y: 540, s: 1 };
export const BOIL = { step: 0, amp: 1 };
export const WMUL = { k: 1 };   // global line-width multiplier (for big close-ups on a model sheet)

export function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round'; return { c, g }; }
export function clear(L) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); }

export const sx = x => (x - CAM.x) * CAM.s + W / 2;
export const sy = y => (y - CAM.y) * CAM.s + H / 2;
export const ws = w => w * Math.pow(CAM.s, 0.45) * WMUL.k;   // screen line width: follows the zoom slightly
const n1 = (seed, x) => vnoise(x + seed * 17.31) * 2 - 1;

// World polyline -> screen, resampled by screen distance
function toScreen(pts) { return pts.map(p => [sx(p[0]), sy(p[1])]); }
function resample(sp, step = 3.5, closed = false) {
  const q = closed ? [...sp, sp[0]] : sp; const out = [q[0].slice()]; const L = [0]; let acc = 0, total = 0;
  for (let i = 1; i < q.length; i++) {
    const [ax, ay] = q[i - 1], [bx, by] = q[i]; const d = Math.hypot(bx - ax, by - ay); if (d < 1e-6) continue;
    let pos = step - acc;
    while (pos <= d) { const u = pos / d; out.push([ax + (bx - ax) * u, ay + (by - ay) * u]); total += step; L.push(total); pos += step; }
    acc = d - (pos - step);
  }
  const last = q[q.length - 1]; const lp = out[out.length - 1]; const rem = Math.hypot(last[0] - lp[0], last[1] - lp[1]);
  if (rem > 0.3) { out.push(last.slice()); total += rem; L.push(total); }
  return { p: out, L, total };
}

// --- crayon line ---
// o: col, w (screen px), p (pressure 0-1), seed, wob (hand wobble), boil, taper (end taper ratio), draw (writing progress 0-1), streak (number of streaks)
export function line(L, pts, o = {}) {
  const g = L.g;
  const col = o.col || "#2d3263", w = ws(o.w ?? 6), p = o.p ?? 0.8, seed = o.seed ?? 1, wob = o.wob ?? 1, boil = o.boil ?? 1;
  const draw = o.draw ?? 1; if (draw <= 0) return;
  const sp = toScreen(pts); const R = resample(sp, 3, o.closed);
  let n = R.p.length; if (n < 2) return;
  const lim = R.total * draw;
  const st = BOIL.step, ba = BOIL.amp * boil;
  const jx = (hash(seed * 3.1 + st * 7.7) - .5) * 1.6 * ba, jy = (hash(seed * 5.3 + st * 3.9) - .5) * 1.6 * ba;
  const P = [], Wd = [];
  const taper = o.taper ?? 0.25, tl = Math.min(R.total * taper, 28);
  for (let i = 0; i < n; i++) {
    const s = R.L[i]; if (s > lim) break;
    const a = R.p[Math.max(0, i - 1)], b = R.p[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tn = Math.hypot(tx, ty) || 1; tx /= tn; ty /= tn;
    const off = n1(seed, s / 85) * 1.7 * wob + n1(seed + st * 1.37 + 11, s / 38) * 0.9 * ba;
    P.push([R.p[i][0] - ty * off + jx, R.p[i][1] + tx * off + jy, -ty, tx]);
    const e0 = o.closed ? 1 : clamp(s / (tl + 1e-3)), e1 = o.closed ? 1 : clamp((Math.min(lim, R.total) - s) / (tl + 1e-3));
    Wd.push(w * (0.82 + 0.3 * n1(seed + 3, s / 55)) * (0.45 + 0.55 * Math.min(e0, e1)));
  }
  if (P.length < 2) return;
  g.fillStyle = col; g.strokeStyle = col;
  // main band
  ribbon(g, P, Wd, 1); g.globalAlpha = p * 0.5; g.fill();
  // core (lighter where the crayon lifts at the ends)
  ribbon(g, P, Wd, 0.5); g.globalAlpha = p * 0.34; g.fill();
  // streaks
  const ns = o.streak ?? 2;
  for (let k = 0; k < ns; k++) {
    const side = (hash(seed + k * 9.1) - .5) * 0.9;
    g.beginPath();
    for (let i = 0; i < P.length; i++) { const q = P[i]; const d = side * Wd[i]; const x = q[0] + q[2] * d, y = q[1] + q[3] * d; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.lineWidth = Math.max(1, w * 0.22); g.globalAlpha = p * 0.3; g.stroke();
  }
  g.globalAlpha = 1;
}
function ribbon(g, P, Wd, k) {
  g.beginPath();
  for (let i = 0; i < P.length; i++) { const q = P[i], d = Wd[i] * 0.5 * k; i ? g.lineTo(q[0] + q[2] * d, q[1] + q[3] * d) : g.moveTo(q[0] + q[2] * d, q[1] + q[3] * d); }
  for (let i = P.length - 1; i >= 0; i--) { const q = P[i], d = Wd[i] * 0.5 * k; g.lineTo(q[0] - q[2] * d, q[1] - q[3] * d); }
  g.closePath();
}

// --- colouring: back-and-forth zig-zag hatching that overshoots the outline ---
// o: col, p, ang (hatching angle), gap (row spacing px), w (crayon width px), over (overshoot px), seed, draw (colouring progress), boil, cross (second, crossing pass)
export function fill(L, poly, o = {}) {
  const g = L.g;
  const col = o.col || '#f6c945', p = o.p ?? 0.62, seed = o.seed ?? 1, boil = o.boil ?? 1;
  const st = BOIL.step, ba = BOIL.amp * boil;
  const ang = (o.ang ?? 0.62) + (hash(seed + st * 1.9) - .5) * 0.035 * ba;
  const gap = ws(o.gap ?? 10.5), w = ws(o.w ?? 11), over = ws(o.over ?? 7);
  const draw = o.draw ?? 1; if (draw <= 0) return;
  // poly is one ring or several (regions projected from 3D often have holes): scanlines take crossings over all rings, even-odd
  const rings = Array.isArray(poly[0][0]) ? poly : [poly];
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const rps = rings.map(r => toScreen(r).map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]));   // rotate so the hatching is horizontal
  let y0 = Infinity, y1 = -Infinity; for (const rp of rps) for (const q of rp) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  // Row positions: with an anchor (a fixed screen point of the object) rows are counted from it, so row k is always the same row (same jitter, same pressure)
  // and the hatching travels with the object when the camera moves instead of being recoloured every drawing; without one, rows count from the region's top
  const base = o.anchor ? -o.anchor[0] * sa + o.anchor[1] * ca : y0 + gap * (0.35 + 0.3 * hash(seed + st * 0.7 * ba));
  const rows = []; let kr = Math.floor((y0 - base) / gap) - 1;
  for (;;) {
    const y = base + kr * gap + (hash(seed * 1.3 + kr * 3.7) - .5) * gap * (o.hand ? .8 : .35), r = kr++;
    if (y < y0) continue; if (y >= y1) break;
    const xs = [];
    for (const rp of rps) for (let i = 0; i < rp.length; i++) {
      const a = rp[i], b = rp[(i + 1) % rp.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((a, b) => a - b);
    const spans = []; for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
    rows.push({ y, spans, r });
  }
  if (o.hand) { scribble(g, rows, o, { col, p, seed, gap, w, over, ca, sa, base }); if (o.cross && draw > .6) fill(L, poly, { ...o, draw: (draw - .6) / .4, cross: false, patch: .5, ang: (o.ang ?? 0.62) + (o.crossAng ?? 1.25), seed: seed + 101, p: p * (o.crossP ?? 0.6) }); return; }
  // join into zig-zag strokes: neighbouring rows whose spans overlap are connected
  const strokes = []; let curS = null, prev = null, dir = 1;
  for (const row of rows) {
    if (row.spans.length !== 1) { curS = null; prev = null; for (const s of row.spans) strokes.push([[s, row.y, row.r]]); continue; }
    const s = row.spans[0];
    if (curS && prev && s[0] < prev[1] && s[1] > prev[0]) curS.push([s, row.y, row.r]);
    else { curS = [[s, row.y, row.r]]; strokes.push(curS); }
    prev = s;
  }
  // total length, for the colouring progress
  const paths = strokes.map((S, si) => {
    const pts = [];
    S.forEach(([s, yy, rr], k) => {
      const len = s[1] - s[0];
      const oA = over * (hash(seed + rr * 5.1 + 0.3) * 1.1 - 0.15) - Math.min(0, len * 0) , oB = over * (hash(seed + rr * 2.3 + 0.7) * 1.1 - 0.15);
      const yj = (hash(seed + rr * 1.7 + st * 0.31 * ba) - .5) * gap * 0.35 * Math.max(ba, .3);
      const a = [s[0] - oA, yy + yj], b = [s[1] + oB, yy + yj + (hash(seed + rr) - .5) * gap * 0.6];
      if ((k + si) % 2 === 0) pts.push(a, b); else pts.push(b, a);
    });
    return pts.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca]);
  });
  let total = 0; const lens = paths.map(pp => { let l = 0; for (let i = 1; i < pp.length; i++) l += Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]); total += l; return l; });
  let budget = total * draw;
  g.strokeStyle = col; g.lineWidth = w;
  for (let k = 0; k < paths.length && budget > 0; k++) {
    const pp = paths[k];
    const cut = cutPath(pp, budget); budget -= lens[k];
    // every pass has its own pressure: the back-and-forth reads stroke by stroke
    for (let i = 1; i < cut.length; i++) {
      const pr = p * (0.72 + 0.42 * hash(seed * 0.37 + k * 13.1 + i * 0.71));
      g.beginPath(); g.moveTo(cut[i - 1][0], cut[i - 1][1]); g.lineTo(cut[i][0], cut[i][1]);
      g.globalAlpha = pr * 0.62; g.lineWidth = w; g.stroke();
      g.globalAlpha = pr * 0.3; g.lineWidth = w * 0.42; g.stroke();
    }
  }
  g.globalAlpha = 1;
  if (o.cross) fill(L, poly, { ...o, cross: false, ang: (o.ang ?? 0.62) + (o.crossAng ?? 1.25), seed: seed + 101, p: p * (o.crossP ?? 0.7) });
}
// A child's colouring hand (o.hand 0-1): each stroke bows and leans a little, row spacing loosens and tightens, a row is skipped now and then, a long row breaks into several strokes that overlap or leave a gap at the joins,
// heavier in the middle of a stroke than at its ends. Every random value comes from the row number r and the anchor, so one object is coloured the same in every drawing and travels with it.
// o.patch: this pass colours only some rows (a touch-up pass, in patches)
function scribble(g, rows, o, { col, p, seed, gap, w, over, ca, sa, base }) {
  const hand = o.hand, patch = o.patch ?? 0, draw = o.draw ?? 1;
  const ax = o.anchor ? o.anchor[0] * ca + o.anchor[1] * sa : 0;
  // colouring in progress (draw < 1): row by row, odd rows left to right, even rows right to left, the current row half done
  const nr = rows.length, upto = draw * nr;
  let ri = -1;
  const back = ([x, y]) => [x * ca - y * sa, x * sa + y * ca];
  g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const { y, spans, r } of rows) {
    ri++; const fr = upto - ri; if (fr <= 0) break;
    let cx0 = -Infinity, cx1 = Infinity;
    if (fr < 1) { const lo = Math.min(...spans.map(q => q[0])) - over, hi = Math.max(...spans.map(q => q[1])) + over; if (ri % 2) cx0 = hi - (hi - lo) * fr; else cx1 = lo + (hi - lo) * fr; }
    const H = k => hash(seed * 1.91 + r * 7.13 + k);
    if (H(1) < .07 * hand) continue;   // a skipped row
    if (patch && vnoise(r * .23 + seed) < patch) continue;   // touch-up pass: in patches
    const extra = H(2) < .12 * hand ? [0, .45] : [0];   // now and then an extra row
    for (const dy of extra) for (const [s0, s1] of spans) {
      const x0 = s0 - over * (H(3) * 1.1 - .15), x1 = s1 + over * (H(4) * 1.1 - .15);
      // the row breaks into strokes: break points are placed from the anchor, so they travel with the object
      const Ls = (170 + 260 * H(5)) * (o.len ?? 1);
      let m = Math.floor((x0 - ax) / Ls);
      for (;;) {
        const Hm = k => hash(seed * 2.71 + r * 5.3 + m * 11.7 + k);
        let a = ax + m * Ls - Hm(1) * 22, b = ax + (m + 1) * Ls + (Hm(2) - .35) * 26;   // joins: mostly a small overlap, sometimes a gap
        m++;
        if (a > x1) break; a = Math.max(a, x0, cx0); b = Math.min(b, x1, cx1); if (b - a < 6) continue;
        const tilt = (Hm(3) - .5) * .17 * hand, bow = (Hm(4) - .5) * gap * 1.5 * hand, yy = y + dy * gap + (Hm(5) - .5) * gap * .5 * hand;
        const n = Math.max(2, Math.ceil((b - a) / 16)), xm = (a + b) / 2, pts = [];
        for (let i = 0; i <= n; i++) {
          const u = i / n, x = a + (b - a) * u;
          const off = tilt * (x - xm) + bow * 4 * u * (1 - u) + (vnoise((x - ax) / 70 + r * 3.1 + seed) - .5) * gap * .45 * hand;
          pts.push(back([x, yy + off]));
        }
        const pr0 = p * (.62 + .5 * Hm(6)), ww = w * (.82 + .32 * Hm(7));
        for (let i = 1; i < pts.length; i++) {
          const u = i / pts.length, pr = pr0 * (.7 + .3 * Math.sin(Math.PI * u));
          g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]);
          g.globalAlpha = Math.min(1, pr) * .62; g.lineWidth = ww; g.stroke();
          g.globalAlpha = Math.min(1, pr) * .3; g.lineWidth = ww * .42; g.stroke();
        }
      }
    }
  }
  g.globalAlpha = 1;
}
function cutPath(pp, len) {
  const out = [pp[0]]; let acc = 0;
  for (let i = 1; i < pp.length; i++) {
    const d = Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
    if (acc + d >= len) { const u = (len - acc) / d; out.push([lerp(pp[i - 1][0], pp[i][0], u), lerp(pp[i - 1][1], pp[i][1], u)]); return out; }
    acc += d; out.push(pp[i]);
  }
  return out;
}

// --- solid soft colouring: small areas (cheeks, pupils) in circular scribbles ---
export function dab(L, x, y, r, o = {}) {
  fill(L, handCircle(x, y, r, o.seed ?? 1, 0, 20).map(([px, py]) => [px, y + (py - y) * (o.sq ?? 1)]), { col: o.col || '#ee8ea4', p: o.p ?? 0.7, gap: o.gap ?? 4.5, w: o.w ?? 6, over: o.over ?? 1.5, seed: o.seed ?? 1, ang: o.ang ?? 0.5, boil: o.boil ?? 1 });
}

// --- shape helpers (world coordinates) ---
export function ellipse(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2, rot = 0) {
  const out = []; const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
}
// hand-drawn circle: ends slightly offset, a little skewed
export function handCircle(cx, cy, r, seed = 1, over = 0.12, n = 56) {
  const out = []; const a0 = hash(seed) * 6.28;
  for (let i = 0; i <= n; i++) { const u = i / n; const a = a0 + u * Math.PI * 2 * (1 + over); const rr = r * (1 + 0.035 * Math.sin(a * 2 + seed) + (u > 1 - over ? 0.04 * (u - (1 - over)) / over : 0)); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return out;
}
// cubic Bezier chain: [p0, c1, c2, p1, c3, c4, p2, ...]
export function bez(c, n = 16) {
  const out = [c[0]];
  for (let i = 0; i + 3 < c.length; i += 3) {
    const [a, b, d, e] = [c[i], c[i + 1], c[i + 2], c[i + 3]];
    for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; out.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * d[0] + t * t * t * e[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * d[1] + t * t * t * e[1]]); }
  }
  return out;
}
// smooth closed curve (Catmull-Rom)
export function smooth(pts, n = 8, closed = true) {
  const out = []; const m = pts.length; const N = closed ? m : m - 1;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    const P0 = closed || i > 0 ? p0 : p1, P3 = closed || i + 2 < m ? p3 : p2;
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-P0[0] + p2[0]) * t + (2 * P0[0] - 5 * p1[0] + 4 * p2[0] - P3[0]) * t2 + (-P0[0] + 3 * p1[0] - 3 * p2[0] + P3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-P0[1] + p2[1]) * t + (2 * P0[1] - 5 * p1[1] + 4 * p2[1] - P3[1]) * t2 + (-P0[1] + 3 * p1[1] - 3 * p2[1] + P3[1]) * t3)]); }
  }
  if (!closed) out.push(pts[m - 1]); else out.push(out[0]);
  return out;
}
// transform: translate, rotate, scale a set of points
export function xf(pts, { x = 0, y = 0, r = 0, s = 1, sx: kx = 1, sy: ky = 1, ox = 0, oy = 0 } = {}) {
  const c = Math.cos(r), sn = Math.sin(r);
  return pts.map(([px, py]) => { const X = (px - ox) * s * kx, Y = (py - oy) * s * ky; return [x + ox + X * c - Y * sn, y + oy + X * sn + Y * c]; });
}

// --- crayon type (subtitles, titles): glyphs filled, jittered every 2 frames ---
export function text(L, str, x, y, o = {}) {
  const g = L.g, st = BOIL.step, seed = o.seed ?? 7, ba = BOIL.amp * (o.boil ?? 1);
  const size = o.size ?? 56; const font = o.font ?? 'Patrick Hand';
  g.save();
  g.font = `${o.weight ?? 400} ${size}px "${font}"`; g.textBaseline = 'alphabetic';
  const chars = [...str]; const widths = chars.map(c => g.measureText(c).width); const tw = widths.reduce((a, b) => a + b, 0) + (o.track ?? 0) * (chars.length - 1);
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2;
  const reveal = o.reveal ?? 1;   // 0-1, written character by character
  const nShow = reveal * chars.length;
  g.fillStyle = o.col || '#2b2f5e';
  chars.forEach((ch, i) => {
    const vis = clamp(nShow - i); if (vis <= 0) { cx += widths[i] + (o.track ?? 0); return; }
    const jx = (hash(seed + i * 3.3 + st * 1.1) - .5) * 1.4 * ba, jy = (hash(seed + i * 7.1 + st * 2.3) - .5) * 1.4 * ba;
    const rot = (hash(seed + i * 1.9) - .5) * 0.07 + (hash(seed + i + st * .7) - .5) * 0.02 * ba;
    const by = (hash(seed + i * 5.5) - .5) * size * 0.05;
    g.save(); g.translate(cx + widths[i] / 2 + jx, y + by + jy); g.rotate(rot);
    g.globalAlpha = (o.p ?? 1) * vis;
    g.fillText(ch, -widths[i] / 2, 0);
    if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.col || '#2b2f5e'; g.globalAlpha = (o.p ?? 1) * vis * 0.6; g.strokeText(ch, -widths[i] / 2, 0); }
    g.restore();
    cx += widths[i] + (o.track ?? 0);
  });
  g.restore();
  return tw;
}
