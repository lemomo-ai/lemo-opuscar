// Turning stroke data into chalk strokes: the teacher's hard-chalk kai (pressed starts, pressed corners, sharp
// 撇, footed 捺, quick hooks), the child's wobbly even-width hand, and single-line English from an OFL SVG font.
// Every function returns Stroke[] with t0/t1 already set; `clock` is a running time cursor.
import { clamp, lerp } from '/core/lib.js';
import { Stroke, smoothKeepCorners, rng, n1 } from './chalk.js';
import { HZ } from './hz.js';

const sst = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const g2 = (x, k) => Math.exp(-(x / k) * (x / k));

export function parseStroke(str) {
  const [type, ...ps] = str.trim().split(/\s+/);
  return { type, pts: ps.map(p => p.split(',').map(Number)) };
}

// width along the stroke for the teacher's hand: a pressed start (起笔顿), pressed turns (折处顿), 撇 ending in a point (撇出锋), 捺 with a foot (捺有脚), hooks lifted quickly (钩快提)
function profile(type, anchors, wu) {
  const cum = [0]; for (let i = 1; i < anchors.length; i++) cum.push(cum[i - 1] + Math.hypot(anchors[i][0] - anchors[i - 1][0], anchors[i][1] - anchors[i - 1][1]));
  const tot = cum[cum.length - 1] || 1, corners = [];
  for (let i = 1; i < anchors.length - 1; i++) {
    const a = Math.atan2(anchors[i][1] - anchors[i - 1][1], anchors[i][0] - anchors[i - 1][0]), b = Math.atan2(anchors[i + 1][1] - anchors[i][1], anchors[i + 1][0] - anchors[i][0]);
    let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > .8) corners.push(cum[i] / tot);
  }
  const end = type[type.length - 1], start = type[0], hook = end === 'g' && anchors.length > 2 ? cum[anchors.length - 2] / tot : null;
  return (s, L) => {
    const u = s / L; let m = 1;
    if (start === 'n') m *= .5 + .5 * sst(0, .55, u);
    else if (start === 'd') m *= .5 + .5 * sst(0, .7, u);
    else m *= 1 + .24 * g2(s, wu * 1.7);
    for (const c of corners) if (c !== hook) m *= 1 + .17 * g2(s - c * L, wu * 1.4);
    if (end === 'g') { const hs = hook * L; m *= 1 + .2 * g2(s - hs, wu * 1.2); if (s > hs) m *= lerp(1.05, .3, sst(0, 1, (s - hs) / Math.max(1, L - hs))); }
    else if (end === 'p') m *= 1 - .72 * Math.pow(sst(.28, 1, u), 1.1);
    else if (end === 't') m *= 1.08 - .86 * sst(.12, 1, u);
    else if (end === 'x') m *= 1 - .78 * sst(.62, 1, u);
    else if (end === 'n') m *= u < .8 ? 1 + .5 * sst(.25, .8, u) : 1.5 - 1.2 * sst(.8, 1, u);
    else if (end === 'd') m *= 1 + .3 * sst(.45, .95, u);
    else m *= 1 + .12 * g2(L - s, wu * 1.6);
    return m;
  };
}

// 提按: the chalk presses at the start, lightens through the middle, and either settles (blunt ends) or lifts (points)
function pressureFor(type) {
  const end = type[type.length - 1];
  return (s, L) => { const u = s / L;
    let p = 1.07 - .2 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * .9;
    if ('ptx'.includes(end)) p *= 1 - .22 * sst(.55, 1, u); else if (end !== 'g') p *= 1 + .06 * sst(.8, 1, u);
    return p; };
}

// a Chinese character. o: { hand: 'teacher' | 'child', color, w (half width as a fraction of size), seed,
//   rot (deg), speed (size units per second), gap (s between strokes), only: [stroke indices], colors: {i: color} }
export function writeChar(ch, cx, cy, size, clock, o = {}) {
  const data = HZ[ch]; if (!data) throw new Error('no stroke data for ' + ch);
  const child = o.hand === 'child', R = rng((o.seed ?? 1) * 7919 + ch.codePointAt(0)), out = [];
  const rotC = ((o.rot ?? 0) + (child ? (R() - .5) * 12 : (R() - .5) * 1.4)) * Math.PI / 180;
  const sc = size / 100 * (child ? .9 + R() * .2 : 1), dy = child ? (R() - .5) * size * .1 : 0;
  const wu = size * (o.w ?? (child ? .034 : size < 150 ? .038 : .03));       // small writing a little bolder so it reads at 1080p
  let t = clock;
  data.forEach((str, si) => {
    const { type, pts } = parseStroke(str);
    // per-stroke hand: teacher's horizontals rise a little to the right; the child's strokes drift and tilt
    const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const rs = (type[0] === 'h' && !child ? -2.6 : 0) * Math.PI / 180 + (child ? (R() - .5) * .16 : (R() - .5) * .025);
    const jx = (R() - .5) * (child ? 5 : .9), jy = (R() - .5) * (child ? 5 : .9), stretch = child ? .9 + R() * .22 : 1;
    if (o.only && !o.only.includes(si)) return;            // (after the random draws, so a part matches the whole)
    const P = pts.map(([x, y]) => {
      let X = mx + ((x - mx) * Math.cos(rs) - (y - my) * Math.sin(rs)) * stretch + jx, Y = my + ((x - mx) * Math.sin(rs) + (y - my) * Math.cos(rs)) * stretch + jy;
      X = (X - 50) * sc; Y = (Y - 50) * sc + dy;
      return [cx + X * Math.cos(rotC) - Y * Math.sin(rotC), cy + X * Math.sin(rotC) + Y * Math.cos(rotC)];
    });
    if (!child && /\p{Script=Han}/u.test(ch)) {
      // a real hand: straight strokes bow very slightly, horizontals arch; 横/竖/折 enter with a short pressed tick from the upper left
      if (P.length === 2) {
        const [a0, a1] = P, dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        const bow = (type[0] === 'h' ? -.018 : (R() - .5) * .024) * L;
        P.splice(1, 0, [(a0[0] + a1[0]) / 2 + nx * bow * Math.sign(ny || 1), (a0[1] + a1[1]) / 2 + ny * bow * Math.sign(ny || 1)]);
      }
      if ('hsz'.includes(type[0]) && type !== 'd') {
        const a0 = P[0], a1 = P[1], dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, k = wu * 1.15;
        // tick comes from 50° to the upper left of the stroke's direction
        const rot = a => [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a)];
        const A = rot(-2.3), B = rot(2.3), [tx, ty] = A[0] + A[1] < B[0] + B[1] ? A : B;   // whichever side is up-left
        P.unshift([a0[0] + tx * k, a0[1] + ty * k]);
      }
    }
    const line = smoothKeepCorners(P, 46, 8);
    const wfn = child ? ((s, L) => (1 + .1 * g2(s, wu * 1.5)) * (1 - .25 * sst(.85, 1, s / L))) : profile(type, P, wu);
    const st = new Stroke(line, {
      kind: 'write', w: wu, color: (o.colors && o.colors[si]) || o.color || (child ? 'kid' : 'white'), wfn, taper: 0, land: .3,
      wob: child ? size * .009 : size * .0025, wav: size * (child ? .35 : .6), skip: child ? .14 : .08, press: child ? .98 : 1.12, clean: child ? 1 : .6,
      endSpecks: true, specks: child ? .6 : 1, seed: (o.seed ?? 1) * 31 + si * 7.7 + ch.codePointAt(0) % 97, R: o.R,
      pfn: child ? null : pressureFor(type),
    });
    const len = st.len, spd = (o.speed ?? 3.4) * size;
    const d = clamp(.02 + len / spd, size < 150 ? .03 : .04, .5) * (type === 'd' ? .8 : 1);
    if (out.length) { const pe = out[out.length - 1].end; t += (o.gap ?? (size < 150 ? .008 : .015)) + Math.hypot(st.start[0] - pe[0], st.start[1] - pe[1]) / (spd * 3); }
    st.t0 = t; st.t1 = t + d; t += d; st.ch = ch; st.si = si;
    out.push(st);
  });
  out.end = t;
  return out;
}

// a run of characters left to right (Chinese, or Latin through the SVG font), baseline-free: cy is the CJK centre line
export function writeLine(text, x, cy, size, clock, o = {}) {
  const out = []; let t = clock, X = x; const R = rng((o.seed ?? 3) * 131);
  for (const ch of [...text]) {
    if (ch === ' ') { X += size * (o.space ?? .38); continue; }
    if (HZ[ch]) {
      const k = o.hand === 'child' ? .92 + R() * .2 : 1, sz = size * k * (('？·'.includes(ch)) ? .8 : /[0-9]/.test(ch) ? .9 : 1);
      const adv = size * (o.track ?? 1.04) * (ch === '·' ? .5 : ch === '？' ? .78 : /[0-9]/.test(ch) ? .58 : 1) * (o.hand === 'child' ? .94 + R() * .14 : 1);
      const s = writeChar(ch, X + adv * (ch === '？' ? (o.hand === 'child' ? .08 : .3) : .5), cy, sz, t, { ...o, seed: (o.seed ?? 1) + out.length });   // ？ sits close to its sentence
      out.push(...s); t = s.end + (o.cgap ?? .02); X += adv;
    } else {
      const s = writeLatin(ch, X, cy + size * .3, size * (o.latinScale ?? .62), t, o);
      out.push(...s); t = s.end; X = s.x;
    }
  }
  out.end = t; out.x = X;
  return out;
}

// ───────── single-line Latin from an SVG font (EMS family, OFL)
const FONTS = {};
export async function loadSvgFont(url, name = 'main') {
  const txt = await (await fetch(url)).text(), doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
  const ff = doc.querySelector('font-face'), upm = +ff.getAttribute('units-per-em') || 1000, def = +doc.querySelector('font').getAttribute('horiz-adv-x') || 500;
  const G = {};
  for (const g of doc.querySelectorAll('glyph')) {
    const u = g.getAttribute('unicode'); if (!u || [...u].length !== 1) continue;
    G[u] = { adv: +(g.getAttribute('horiz-adv-x') || def), paths: pathToPolys(g.getAttribute('d') || '') };
  }
  return (FONTS[name] = { G, upm, cap: +(ff.getAttribute('cap-height') || 700) });
}
function pathToPolys(d) {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], out = []; let i = 0, cmd = '', x = 0, y = 0, cur = null, sx = 0, sy = 0;
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'M') { x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); sx = x; sy = y; cur = [[x, y]]; out.push(cur); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { x = num() + (rel ? x : 0); y = num() + (rel ? y : 0); cur.push([x, y]); }
    else if (C === 'H') { x = num() + (rel ? x : 0); cur.push([x, y]); }
    else if (C === 'V') { y = num() + (rel ? y : 0); cur.push([x, y]); }
    else if (C === 'C' || C === 'Q') {
      const n = C === 'C' ? 3 : 2, p = []; for (let k = 0; k < n; k++) { p.push([num() + (rel ? x : 0), num() + (rel ? y : 0)]); }
      const P0 = [x, y];
      for (let k = 1; k <= 10; k++) {
        const t = k / 10, u = 1 - t;
        if (n === 3) cur.push([u * u * u * P0[0] + 3 * u * u * t * p[0][0] + 3 * u * t * t * p[1][0] + t * t * t * p[2][0], u * u * u * P0[1] + 3 * u * u * t * p[0][1] + 3 * u * t * t * p[1][1] + t * t * t * p[2][1]]);
        else cur.push([u * u * P0[0] + 2 * u * t * p[0][0] + t * t * p[1][0], u * u * P0[1] + 2 * u * t * p[0][1] + t * t * p[1][1]]);
      }
      [x, y] = p[n - 1];
    }
    else if (C === 'Z') { cur && cur.push([sx, sy]); x = sx; y = sy; }
    else i++;
  }
  return out.filter(p => p.length > 1);
}
// one Latin string: baseline at by, cap height `cap`; returns strokes and the end x
export function writeLatin(text, x, by, cap, clock, o = {}) {
  const F = FONTS[o.font || (o.hand === 'child' && FONTS.child ? 'child' : 'main')], k = cap / F.cap, out = [], R = rng((o.seed ?? 5) * 17 + text.length);
  const child = o.hand === 'child', slant = (o.slant ?? (child ? .06 : .1)), wu = cap * (o.lw ?? (child ? .075 : .068));
  let X = x, t = clock;
  for (const ch of [...text]) {
    const g = F.G[ch]; if (!g) { X += 300 * k; continue; }
    const dy = child ? (R() - .5) * cap * .12 : 0, sk = child ? .92 + R() * .16 : 1;
    for (const poly of g.paths) {
      const P = poly.map(([px, py]) => { const yy = py * sk; return [X + (px + yy * slant) * k, by - yy * k + dy]; });
      const st = new Stroke(P, { kind: 'write', w: wu, color: o.color || (child ? 'kid' : 'white'), taper: .12, taperLen: .2, land: .6,
        wob: child ? cap * .02 : cap * .006, wav: cap * 1.4, skip: .15, press: child ? .85 : 1, endSpecks: true, specks: .5, seed: (o.seed ?? 5) * 13 + out.length * 3.1, R: o.R });
      const d = clamp(.025 + st.len / (cap * (o.lspeed ?? 40)), .025, .25);
      if (out.length) t += .008;
      st.t0 = t; st.t1 = t + d; t += d; out.push(st);
    }
    X += g.adv * k * (child ? .95 + R() * .12 : 1) * (o.ltrack ?? 1);
  }
  out.end = t; out.x = X;
  return out;
}
export const latinWidth = (text, cap, font = 'main') => { const F = FONTS[font], k = cap / F.cap; return [...text].reduce((a, c) => a + (F.G[c]?.adv ?? 300) * k, 0); };
