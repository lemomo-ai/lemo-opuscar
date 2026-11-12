// Assembly-Line Diagram · shared drawing library (includes:
//   KS line-weight factor (ink lines thin by z^0.6 when the camera pulls out and thicken only slightly when it pushes in, so the picture always reads as one printed sheet), easing, keyframe interpolation)
// All vector: SVG generated in code. The print feel = each colour plate with its own misregistration (ink lines stay put) + a very faint paper texture.
// The palette uses semantic colour names; three colour schemes share the same drawing code (change PAL below to switch).

const PALS = {
  // A night-shift factory (used by the demo): deep indigo body cavity, teal instead of cobalt (reads apart from indigo), paper whitish, not yellowed
  A: {
    paper: '#F2ECE0', paperD: '#E3D9C7', shade: '#DCCFB8',
    ink: '#1D2030', ground: '#24345A', groundL: '#2F4270', groundD: '#1C2A4A',
    wall: '#FBF7EE', wallD: '#EFE7D7', wallS: '#E6DCC8',
    blush: '#EE9F87', blushD: '#C8735C', blushL: '#F8CBBA', blushK: '#6B3A33',
    red: '#E04A2F', redD: '#AC321F', redL: '#F59A80',
    sun: '#F3B23A', sunD: '#C98A1E', sunL: '#FAD98E',
    teal: '#2E8D87', tealD: '#1D625E', tealL: '#A3D5CE',
    cream: '#FFFBF3', skin: '#F2D3BE', bread: '#E9C48C', breadD: '#C99A5A',
  },
  // B daytime chart (Holmes-style white ground, high saturation): light flesh body cavity, no large dark areas
  B: {
    paper: '#F7F5EF', paperD: '#E6E2D8', shade: '#E3DED2',
    ink: '#17181F', ground: '#F4CDBE', groundL: '#EDBBA8', groundD: '#E7AF99',
    wall: '#FFFFFF', wallD: '#F1EEE8', wallS: '#E8E3DA',
    blush: '#E5826B', blushD: '#BF5E49', blushL: '#F6B8A6', blushK: '#5E2C26',
    red: '#E33A2B', redD: '#A9271B', redL: '#F78E7F',
    sun: '#FFC02E', sunD: '#D69410', sunL: '#FFE08A',
    teal: '#2F6BD0', tealD: '#1F4C98', tealL: '#A9C6F2',
    cream: '#FFFFFF', skin: '#F4D4C0', bread: '#EDC68A', breadD: '#C99A5A',
  },
  // C wine-red body cavity (closer to Kahn's warm tones): deep wine-red cavity
  C: {
    paper: '#F1E9DC', paperD: '#E1D5C2', shade: '#D9CAB2',
    ink: '#221A1E', ground: '#4A2632', groundL: '#5C3241', groundD: '#3B1E28',
    wall: '#FAF4EA', wallD: '#EEE3D2', wallS: '#E4D7C2',
    blush: '#E9A38C', blushD: '#C07760', blushL: '#F6CDBE', blushK: '#5E2C2A',
    red: '#D9472B', redD: '#A2321C', redL: '#F09A80',
    sun: '#EDA936', sunD: '#C2841C', sunL: '#F8D68E',
    teal: '#3A928B', tealD: '#26655F', tealL: '#A7D6CF',
    cream: '#FFF9EF', skin: '#F0D0BA', bread: '#E6BF86', breadD: '#C29457',
  },
};
const PAL = 'A';
const C = PALS[PAL];

// misregistration offset (px): each colour plate shifts as a whole in one direction; ink lines, paper and walls do not
const REG = { red: [1.6, 0.8], sun: [-1.2, 1.3], teal: [1.0, -1.2], blush: [-0.8, -0.6] };
const PLATE = {};
for (const k of Object.keys(C)) { const p = ['red', 'sun', 'teal', 'blush'].find(s => k.startsWith(s)); if (p && !PLATE[C[k]]) PLATE[C[k]] = p; }
const reg = f => REG[PLATE[f]] || [0, 0];

const S = []; let UID = 0; let KS = 1;   // KS: ink line-weight factor, set each frame from the camera distance
const out = s => S.push(s);
const tr = f => { const [x, y] = reg(f); return (x || y) ? ` transform="translate(${x} ${y})"` : ''; };
const f1 = v => (Math.round(v * 10) / 10);

// ---------- Basic shapes ----------
const R = (x, y, w, h, r = 0) => r ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z` : `M${x} ${y}h${w}v${h}h${-w}Z`;
const E = (cx, cy, rx, ry = rx) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const PL = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
function shape(d, fill, sw = 3, extra = '') {
  if (fill) out(`<path d="${d}" fill="${fill}"${tr(fill)} ${extra}/>`);
  if (sw) out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${f1(sw * KS * 100) / 100}" stroke-linejoin="round" stroke-linecap="round"/>`);
}
const fillOnly = (d, fill, extra = '') => out(`<path d="${d}" fill="${fill}"${tr(fill)} ${extra}/>`);
const line = (pts, w = 3, col = C.ink, extra = '') => out(`<path d="${PL(pts)}" fill="none" stroke="${col}" stroke-width="${f1(w * KS * 100) / 100}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`);
// lines of geometric width (conveyor belts, piston rods etc.: scale with the camera, ignore KS)
const gline = (pts, w, col = C.ink, extra = '') => out(`<path d="${PL(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`);
// Holmes-style flat drop shadow: the same shape offset to the lower right, a single light colour
const shadow = (d, dx = 18, dy = 14, col = C.shade) => out(`<path d="${d}" fill="${col}" transform="translate(${dx} ${dy})"/>`);

// ---------- Text ----------
const FONT = { en: 'BSD', sans: 'ARC', zh: 'XSans' };
const _cv = document.createElement('canvas').getContext('2d');
function tw(s, size, weight, fam) { _cv.font = `${weight} ${size}px ${fam}`; return _cv.measureText(s).width; }
function txt(x, y, s, size, o = {}) {
  if (typeof ZL !== 'undefined' && ZL < .2) return;   // small text is skipped when pulled out
  const fam = o.fam || FONT.en, w = o.w || 800, fill = o.fill || C.ink, anchor = o.anchor || 'start', ls = o.ls || 0;
  out(`<text x="${f1(x)}" y="${f1(y)}" font-family="${fam}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="alphabetic" letter-spacing="${ls}"${fill !== C.ink ? tr(fill) : ''}>${s}</text>`);
}

// ---------- Pipes: ink edge → colour → highlight strip (masked inside the pipe) ----------
function pipe(pts, w, col, colL, o = {}) {
  const d = o.d || PL(pts), id = 'pm' + (UID++), cap = o.cap || 'butt';
  out(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-300" y="-300" width="2600" height="1700"><path d="${d}" fill="none" stroke="#fff" stroke-width="${w - 3}" stroke-linejoin="round" stroke-linecap="${cap}"/></mask>`);
  out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${f1(w + 6 * KS)}" stroke-linejoin="round" stroke-linecap="${cap}"/>`);
  out(`<g${tr(col)}><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="${cap}"/>`);
  const k = w * 0.22;
  out(`<g mask="url(#${id})"><path d="${d}" fill="none" stroke="${colL}" stroke-width="${f1(w * 0.18)}" stroke-linejoin="round" transform="translate(${f1(-k)} ${f1(-k)})"/></g></g>`);
}
// rounded polyline → path d (each corner an arc of radius r)
function rpoly(pts, r = 30) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by), rr = Math.min(r, l1 / 2, l2 / 2);
    const p1 = [bx - (bx - ax) / l1 * rr, by - (by - ay) / l1 * rr], p2 = [bx + (cx - bx) / l2 * rr, by + (cy - by) / l2 * rr];
    d += `L${f1(p1[0])} ${f1(p1[1])}Q${bx} ${by} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  const L = pts[pts.length - 1]; return d + `L${L[0]} ${L[1]}`;
}
function flange(x, y, w, vertical, col = C.wallD) {
  const t = 12, L = w + 16;
  shape(vertical ? R(x - L / 2, y - t / 2, L, t, 2) : R(x - t / 2, y - L / 2, t, L, 2), col, 2.5);
}
function chev(x, y, rot, col = C.ink, k = 1, op = .85) { out(`<path d="M-10 -6L0 4L10 -6" transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`); }

// ---------- Kahn's number circles + room plaques (mainly English, plus one short Chinese line) ----------
function num(cx, cy, n, r = 22) {
  if (typeof ZL !== 'undefined' && ZL < .2) return;
  shape(E(cx, cy, r), C.sun, 2.8);
  txt(cx, cy + r * 0.42, n, r * 1.25, { fam: FONT.en, w: 900, anchor: 'middle' });
}
// plaque(x, y, 'CRUSHER', zh, {n, size}): zh = the short Chinese line; x,y = plaque top-left; returns the plaque width
function plaque(x, y, en, zh, o = {}) {
  if (typeof ZL !== 'undefined' && ZL < .2) return 0;
  const size = o.size || 34, zs = o.zs || 34, padX = size * 0.5;
  const we = tw(en, size, 800, FONT.en) + en.length * 1.2, wz = zh ? tw(zh, zs, 700, FONT.zh) : 0;
  const h = Math.max(size, zs) * 1.42, w = padX * 2 + we + (zh ? padX * 1.5 + wz : 0);
  let x0 = x;
  if (o.n) { num(x + 22, y + h / 2, o.n, 22); x0 = x + 52; }
  shadow(R(x0, y, w, h, 3), 6, 5, o.sh || C.shade);
  shape(R(x0, y, w, h, 3), o.bg || C.cream, 2.6);
  txt(x0 + padX, y + h / 2 + size * 0.36, en, size, { fam: FONT.en, w: 800, ls: 1.2 });
  if (zh) {
    const dx = x0 + padX + we + padX * 0.75;
    line([[dx, y + 9], [dx, y + h - 9]], 2, C.ink, 'opacity=".55"');
    txt(dx + padX * 0.75, y + h / 2 + zs * 0.36, zh, zs, { fam: FONT.zh, w: 700 });
  }
  return (x0 - x) + w;
}
// legend tag hanging on a pipe: colour swatch + text (the colour is the legend)
function tag(x, y, en, zh, col, o = {}) {
  if (typeof ZL !== 'undefined' && ZL < .2) return 0;
  const size = o.size || 30, zs = o.zs || 34, h = 52;
  const we = tw(en, size, 800, FONT.en) + en.length * 1.2, wz = tw(zh, zs, 700, FONT.zh);
  const w = 46 + we + 18 + wz + 18;
  shadow(R(x, y, w, h, 4), 6, 5);
  shape(R(x, y, w, h, 4), C.cream, 2.6);
  shape(R(x, y, 34, h, 4), col, 0); out(`<path d="M${x + 34} ${y}V${y + h}" stroke="${C.ink}" stroke-width="2.6"/>`);
  shape(R(x, y, w, h, 4), null, 2.6);
  txt(x + 46, y + h / 2 + size * 0.36, en, size, { fam: FONT.en, w: 800, ls: 1.2 });
  txt(x + 46 + we + 18, y + h / 2 + zs * 0.36, zh, zs, { fam: FONT.zh, w: 700 });
  return w;
}
// Holmes-style right-angle leader: solid dot → vertical → horizontal → text
function callout(px, py, ty, len, s, size = 40, o = {}) {
  out(`<circle cx="${px}" cy="${py}" r="6" fill="${C.ink}"/>`);
  const dir = o.left ? -1 : 1;
  line([[px, py], [px, ty], [px + dir * len, ty]], 3);
  txt(px + dir * (len + 14), ty + size * 0.34, s, size, { fam: FONT.en, w: 800, anchor: o.left ? 'end' : 'start', ls: 1 });
}

// ---------- Little worker: feet at (x,y), about 64·s tall. Angles 0=hanging down, 90=right, 180=up, -90=left ----------
function worker(x, y, o = {}) {
  if (typeof ZL !== 'undefined' && ZL < .2) return;   // workers are skipped when pulled out
  const s = o.s || 1, coat = o.coat || C.cream, lean = o.lean || 0, flip = o.flip ? -1 : 1;
  out(`<g transform="translate(${x} ${y}) rotate(${lean}) scale(${s * flip} ${s})">`);
  const arm = (side, a, b = 0, L1 = 13, L2 = 12) => {
    const sx = side * 8, sy = -47, r = Math.PI / 180;
    const ex = sx + Math.sin(a * r) * L1, ey = sy + Math.cos(a * r) * L1;
    const hx = ex + Math.sin((a + b) * r) * L2, hy = ey + Math.cos((a + b) * r) * L2;
    out(`<path d="M${sx} ${sy}L${f1(ex)} ${f1(ey)}L${f1(hx)} ${f1(hy)}" fill="none" stroke="${C.ink}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    out(`<path d="M${sx} ${sy}L${f1(ex)} ${f1(ey)}L${f1(hx)} ${f1(hy)}" fill="none" stroke="${coat}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    out(`<circle cx="${f1(hx)}" cy="${f1(hy)}" r="3.4" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.8"/>`);
    return [hx, hy];
  };
  const w = o.walk || 0;
  if (o.back !== undefined) arm(-1, o.back[0], o.back[1] || 0);
  if (o.sit) {
    out(`<path d="M-4 -24L14 -22L14 -2M4 -24L20 -22L20 -2" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else {
    out(`<path d="M-4 -24L${-6 - w} 0M4 -24L${6 + w} 0" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`);
    out(`<path d="M${-9 - w} 0h7M${3 + w} 0h7" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`);
  }
  shape('M-8 -51Q0 -54 8 -51L12 -21Q0 -18 -12 -21Z', coat, 2.2);
  if (coat === C.cream) out(`<path d="M0 -50V-22" stroke="${C.ink}" stroke-width="1.4"/>`);
  shape(E(0, -60, 7.6), C.skin, 2.2);
  if (o.cap) shape('M-8.6 -61Q-8.4 -71 0 -71Q8.4 -71 8.6 -61Z', o.cap, 2);
  let hand = null;
  if (o.front !== undefined) hand = arm(1, o.front[0], o.front[1] || 0);
  if (o.prop) o.prop(hand);
  out('</g>');
}
// gear
function gear(cx, cy, r, teeth, ang, col = C.sun) {
  let d = ''; const n = teeth * 2;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 + ang * Math.PI / 180; const rr = i % 2 ? r : r * 0.82; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr); }
  shape(d + 'Z', col, 2.6);
  shape(E(cx, cy, r * 0.42), C.wall, 2.4);
  shape(E(cx, cy, r * 0.12), C.ink, 0);
}
// gauge
function gauge(cx, cy, r, v) {
  shape(E(cx, cy, r), C.cream, 2.6);
  const a0 = -210, a1 = 30, a = (a0 + (a1 - a0) * v) * Math.PI / 180;
  out(`<path d="M${f1(cx + Math.cos(30 * Math.PI / 180) * r * .72)} ${f1(cy + Math.sin(30 * Math.PI / 180) * r * .72)}A${r * .72} ${r * .72} 0 0 0 ${f1(cx + Math.cos(-20 * Math.PI / 180) * r * .72)} ${f1(cy + Math.sin(-20 * Math.PI / 180) * r * .72)}" fill="none" stroke="${C.red}" stroke-width="${r * .18}"/>`);
  line([[cx, cy], [cx + Math.cos(a) * r * .7, cy + Math.sin(a) * r * .7]], 2.6);
  out(`<circle cx="${cx}" cy="${cy}" r="3" fill="${C.ink}"/>`);
}
// pendant lamp
function lamp(x, y0, y1, on = false) {
  line([[x, y0], [x, y1 - 12]], 2);
  if (on) out(`<path d="M${x - 16} ${y1}L${x - 90} ${y1 + 200}H${x + 90}L${x + 16} ${y1}Z" fill="${C.sunL}" opacity=".22"/>`);
  shape(`M${x - 18} ${y1}Q${x - 18} ${y1 - 14} ${x} ${y1 - 14}Q${x + 18} ${y1 - 14} ${x + 18} ${y1}Z`, C.sun, 2.4);
  shape(E(x, y1 + 2, 5), C.sunL, 1.8);
}
// floor slab: flesh-coloured slab + dark bottom edge + rivets
function slab(x, y, w, h) {
  shape(R(x, y, w, h), C.blush, 3);
  fillOnly(R(x + 2, y + h - 9, w - 4, 7), C.blushD);
  for (let xx = x + 16; xx < x + w; xx += 44) out(`<circle cx="${xx}" cy="${y + 10}" r="2.6" fill="${C.ink}"/>`);
}
// room: coloured frame + light wall + floor strip
function room(x, y, w, h, frame, o = {}) {
  shadow(R(x, y, w, h), 14, 10, o.sh || C.groundD);
  shape(R(x, y, w, h), frame, 3);
  shape(R(x + 14, y + 14, w - 28, h - 28), C.wall, 2.2);
  if (o.floor !== false) shape(R(x + 14, y + h - 14 - 22, w - 28, 22), C.wallD, 2.2);
  return { x: x + 14, y: y + 14, w: w - 28, h: h - 28, fl: y + h - 14 - 22 };
}
// conveyor (can tilt), rollers
function belt(a, b, k = 1) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  gline([a, b], 22 * k + 6 * KS, C.ink); gline([a, b], 18 * k, '#4A4D5C');
  for (let s = 8; s <= len - 6; s += 32 * k) { const t = s / len; out(`<circle cx="${f1(a[0] + (b[0] - a[0]) * t)}" cy="${f1(a[1] + (b[1] - a[1]) * t)}" r="${6.5 * k}" fill="${C.wallD}" stroke="${C.ink}" stroke-width="${f1(2 * KS)}"/>`); }
}
// A-frame stand
function trestle(x, ytop, yfl, spread = 26) {
  line([[x - spread, yfl], [x, ytop], [x + spread, yfl]], 5.5);
  line([[x - spread * .6, (ytop + yfl) / 2 + 8], [x + spread * .6, (ytop + yfl) / 2 + 8]], 3.5);
}

// ---------- The hero cargo: a sandwich (cut open from the side it is all layers: bread / ham / cheese / lettuce / bread) ----------
function sandwich(x, y, k = 1, o = {}) {   // x,y = bottom centre
  out(`<g transform="translate(${x} ${y}) scale(${k}) rotate(${o.rot || 0})">`);
  const W = 150;
  shadow(R(-W / 2, -88, W, 88, 8), 12, 9, o.sh || C.shade);
  // side of a bread slice: dark crust around a light crumb
  const slice = (y, h) => { shape(R(-W / 2, y, W, h, 7), C.breadD, 2.8); fillOnly(R(-W / 2 + 7, y + 5, W - 14, h - 10, 3), C.bread); for (const xx of [-48, -18, 14, 44]) out(`<circle cx="${xx}" cy="${y + h / 2}" r="2" fill="${C.breadD}" opacity=".7"/>`); };
  slice(-24, 24);                                                           // bottom slice
  shape(`M${-W / 2 - 6} -24Q${-W / 4} -38 0 -28Q${W / 4} -38 ${W / 2 + 6} -24Q${W / 4} -18 0 -24Q${-W / 4} -16 ${-W / 2 - 6} -24Z`, C.teal, 2.2); // lettuce
  shape(R(-W / 2 + 4, -42, W - 2, 15, 3), C.sun, 2.4);                     // cheese
  out(`<path d="M${W / 2 + 2} -35L${W / 2 + 11} -29L${W / 2 + 2} -27Z" fill="${C.sun}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`);
  shape(R(-W / 2 - 4, -58, W + 6, 17, 8), C.blushL, 2.4);                   // ham
  for (const xx of [-44, -10, 26, 52]) out(`<path d="M${xx} -53q6 4 12 0" fill="none" stroke="${C.blushD}" stroke-width="2.2" stroke-linecap="round"/>`);
  slice(-86, 28);                                                           // top slice
  // toothpick flag
  if (o.ticket) {   // a little ticket on the toothpick (timestamp)
    line([[6, -86], [6, -138]], 2.6);
    const w = tw(o.ticket, 30, 800, FONT.en) + 26;
    shadow(R(10, -170, w, 40, 3), 5, 4, o.sh || C.shade);
    shape(R(10, -170, w, 40, 3), C.cream, 2.4);
    fillOnly(R(10, -170, 8, 40), C.red); shape(R(10, -170, w, 40, 3), null, 2.4);
    txt(10 + 8 + (w - 8) / 2, -139, o.ticket, 30, { fam: FONT.en, w: 800, anchor: 'middle', ls: 1 });
  } else {
    line([[6, -86], [6, -124]], 2.6);
    shape(`M6 -124L44 -116L6 -106Z`, C.red, 2.2);
  }
  out('</g>');
}

// ---------- Easing / interpolation (same as core/lib.js) ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const ei = t => Math.pow(clamp(t), 3);
const backE = (t, s = 1.8) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const spring = (t, k = 7, z = .35) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const pulse = (t, a, d) => (t >= a && t < a + d) ? Math.sin(Math.PI * (t - a) / d) : 0;   // 0→1→0
function monotone(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  if (n === 1) return () => ys[0];
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], q = a * a + b * b;
    if (q > 9) { const k = 3 / Math.sqrt(q); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return t => {
    if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
// smooth segments: keys = [[t, v], ...], eio within each segment (holds on every keyframe)
function steps(keys, t, ease = eio) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i], [b, vb] = keys[i + 1];
    if (t < b) return lerp(va, vb, ease(seg(t, a, b)));
  }
  return keys[keys.length - 1][1];
}
