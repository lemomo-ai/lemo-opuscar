// heroes.js: the guide, Orbi, as drawn in the style frames and the character sheet (needs flat.js). The film draws Orbi with orbi.js.
// Same flat rules as the rest of the frame: solid fills, one base colour + one shade step, no outlines, no gradients.
//
// hero(p, x, y, s, o) draws the guide (HEROES[HERO_DEFAULT]) with its body centre at x,y.
//   s     ≈ the character's height in px
//   o.view   'front' | 'side' (side faces right; flip to face left)
//   o.look   [lx, ly] in -1..1, where the face looks
//   o.expr   'calm' | 'happy' | 'wow' | 'wink'
//   o.aim    degrees: the zoom gesture (Orbi turns its lens-eye that way)
//   o.grip   { l, r, top } world points to hold (frame 2: the tape case); o.over() is drawn between body and hands
//   o.fly    Orbi: thruster flame on
//   o.sight  [x, y, r] world point (and ring radius): a dotted sun-yellow sight line from the guide's lens to the next-stop ring
//            (only for a guide whose eye is the lens, i.e. H.lens is defined)
//   o.rot, o.flip
const HERO_DEFAULT = 'orbi';
const HERO_KEY = (new URLSearchParams(location.search).get('hero') || HERO_DEFAULT).toLowerCase();
const HEROES = {};

const EXPR = { calm: ['open', 'open', 'smile'], happy: ['shut', 'shut', 'grin'], wow: ['wow', 'wow', 'o'], wink: ['open', 'shut', 'grin'] };

function eye(G, x, y, r, kind, col = C.night, glint = C.cream) {
  if (kind === 'shut') {
    el('path', { d: `M${r1(x - r * 1.05)},${r1(y + r * 0.4)}Q${r1(x)},${r1(y - r * 1.0)} ${r1(x + r * 1.05)},${r1(y + r * 0.4)}`, fill: 'none', stroke: col, 'stroke-width': r1(r * 0.62), 'stroke-linecap': 'round' }, G);
    return;
  }
  const k = kind === 'wow' ? 1.25 : 1;
  el('ellipse', { cx: r1(x), cy: r1(y), rx: r1(r * 0.86 * k), ry: r1(r * k), fill: col }, G);
  if (glint) el('circle', { cx: r1(x - r * 0.28 * k), cy: r1(y - r * 0.36 * k), r: r1(r * 0.34 * k), fill: glint }, G);
}
function mouth(G, x, y, w, kind, col = C.night, inner = C.coral) {
  if (kind === 'smile') el('path', { d: `M${r1(x - w / 2)},${r1(y)}Q${r1(x)},${r1(y + w * 0.5)} ${r1(x + w / 2)},${r1(y)}`, fill: 'none', stroke: col, 'stroke-width': r1(w * 0.2), 'stroke-linecap': 'round' }, G);
  else if (kind === 'grin') {
    const d = `M${r1(x - w / 2)},${r1(y)}Q${r1(x)},${r1(y + w * 1.0)} ${r1(x + w / 2)},${r1(y)}Z`;
    el('path', { d, fill: col, stroke: col, 'stroke-width': r1(w * 0.14), 'stroke-linejoin': 'round' }, G);
    el('ellipse', { cx: r1(x), cy: r1(y + w * 0.36), rx: r1(w * 0.2), ry: r1(w * 0.11), fill: inner }, g(G, { 'clip-path': clipOf('path', { d }) }));
  } else if (kind === 'o') el('ellipse', { cx: r1(x), cy: r1(y + w * 0.16), rx: r1(w * 0.2), ry: r1(w * 0.25), fill: col }, G);
}
// the magnifier: handle from the hand outwards along deg, glass at the end
function tear(G, cx, cy, r, tx, ty, fill, bend = 0) {
  const d = Math.hypot(tx - cx, ty - cy), a = Math.atan2(ty - cy, tx - cx), b = Math.acos(Math.min(0.999, r / d));
  const p1 = [cx + Math.cos(a + b) * r, cy + Math.sin(a + b) * r], p2 = [cx + Math.cos(a - b) * r, cy + Math.sin(a - b) * r];
  const nx = -Math.sin(a) * bend, ny = Math.cos(a) * bend;
  const m1 = [(p1[0] + tx) / 2 + nx, (p1[1] + ty) / 2 + ny], m2 = [(p2[0] + tx) / 2 + nx, (p2[1] + ty) / 2 + ny];
  const f = v => r1(v);
  return el('path', { d: `M${f(tx)},${f(ty)}Q${f(m2[0])},${f(m2[1])} ${f(p2[0])},${f(p2[1])}A${f(r)},${f(r)} 0 1 1 ${f(p1[0])},${f(p1[1])}Q${f(m1[0])},${f(m1[1])} ${f(tx)},${f(ty)}Z`, fill }, G);
}
const capsule = (G, x1, y1, x2, y2, w, col) => el('line', { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), stroke: col, 'stroke-width': r1(w), 'stroke-linecap': 'round' }, G);

function hero(p, x, y, s, o = {}) {
  const H = HEROES[HERO_KEY] || HEROES[HERO_DEFAULT];
  return heroAs(H, p, x, y, s, o);
}
function heroAs(H, p, x, y, s, o = {}) {
  const fs = o.flip ? -1 : 1, rot = o.rot || 0;
  const tf = `translate(${r1(x)},${r1(y)}) rotate(${rot}) scale(${fs},1)`;
  const toLocal = pt => { if (!pt) return null; const a = -rot * Math.PI / 180, dx = pt[0] - x, dy = pt[1] - y; return [(dx * Math.cos(a) - dy * Math.sin(a)) * fs, dx * Math.sin(a) + dy * Math.cos(a)]; };
  const grip = o.grip ? { l: toLocal(o.grip.l), r: toLocal(o.grip.r), top: toLocal(o.grip.top) } : null;
  const ctx = { s, u: v => v * s, look: o.look || [0, 0], ex: EXPR[o.expr || 'calm'], o, grip };
  if (o.sight && H.lens) { // sight line: lens -> next stop, drawn behind the guide, dots stop short of the ring
    const SG = g(p), [qx, qy] = H.lens(ctx), a = rot * Math.PI / 180;
    const wx = x + Math.cos(a) * qx * fs - Math.sin(a) * qy, wy = y + Math.sin(a) * qx * fs + Math.cos(a) * qy;
    const [tx, ty, tr] = o.sight, L = Math.hypot(tx - wx, ty - wy), d1 = L - tr - 22;
    for (let d = s * 0.3; d <= d1; d += 17) el('circle', { cx: r1(wx + (tx - wx) * d / L), cy: r1(wy + (ty - wy) * d / L), r: 3.4, fill: C.sun }, SG);
  }
  const G = g(p, { transform: tf });
  H.body(G, ctx);
  if (o.over) o.over();
  if (H.hands) H.hands(g(p, { transform: tf }), ctx);
  return G;
}

// ===================== B · Orbi, a tiny probe whose eye is a zoom lens =====================
HEROES.orbi = {
  name: 'Orbi', bottom: 0.36, k: 0.95, hold: [0, -0.74],
  lens: c => [c.u(c.look[0] * 0.06), c.u(0.02 + c.look[1] * 0.045)],
  body(G, c) {
    const { u, look: [lx, ly], ex, o } = c, side = o.view === 'side';
    const fx = u(lx * 0.06), fy = u(ly * 0.045);
    if (o.fly) { tear(G, 0, u(0.33), u(0.075), 0, u(0.62), C.coral); tear(G, 0, u(0.33), u(0.042), 0, u(0.5), C.sun); }
    el('rect', { x: u(-0.09), y: u(0.22), width: u(0.18), height: u(0.13), rx: u(0.045), fill: C.creamD }, G); // thruster
    const panel = (sx, x0, w) => {
      const Pg = g(G, { transform: `rotate(${sx * (o.tilt || 0)} ${u(sx * 0.3)} 0)` });
      capsule(Pg, u(sx * 0.28), 0, u(sx * (x0 + 0.02)), 0, u(0.04), C.mist);
      const xa = sx > 0 ? x0 : -x0 - w;
      el('rect', { x: u(xa), y: u(-0.12), width: u(w), height: u(0.23), rx: u(0.035), fill: C.blue }, Pg);
      el('rect', { x: u(xa), y: u(0.0), width: u(w), height: u(0.11), rx: u(0.035), fill: C.blueD }, Pg);
      el('rect', { x: u(xa), y: u(-0.005), width: u(w), height: u(0.04), fill: C.blueD }, Pg);
      for (const q of [1 / 3, 2 / 3]) el('rect', { x: u(xa + w * q - 0.008), y: u(-0.12), width: u(0.016), height: u(0.23), fill: C.blueD }, Pg);
    };
    if (!side) { panel(-1, 0.4, 0.27); panel(1, 0.4, 0.27); }
    else panel(-1, 0.4, 0.2);
    // antenna: a curl with a coral bead
    const ax = side ? -1 : 1;
    el('path', { d: `M${u(ax * 0.05)},${u(-0.29)}Q${u(ax * 0.06)},${u(-0.47)} ${u(ax * 0.2)},${u(-0.5)}`, fill: 'none', stroke: C.mist, 'stroke-width': u(0.032), 'stroke-linecap': 'round' }, G);
    el('circle', { cx: u(ax * 0.2), cy: u(-0.5), r: u(0.055), fill: C.coral }, G);
    shaded(G, 'circle', { cx: 0, cy: 0, r: u(0.32) }, C.sun, C.sunD, u(0.05), u(0.045));
    // one eye, so: wink = lid shut; happy = the cheek lid rises (a smiling eye); wow = wide iris
    const kind = ex[1] === 'shut' && ex[0] === 'open' ? 'shut' : ex[0] === 'shut' ? 'smile' : ex[0];
    if (!side) {
      const cx = fx, cy = u(0.02) + fy, R0 = u(0.2), R1 = u(0.158);
      el('circle', { cx, cy, r: R0, fill: C.cream }, G);
      el('circle', { cx, cy, r: R1, fill: C.night }, G);
      const L = g(G, { 'clip-path': clipOf('circle', { cx, cy, r: R1 }) });
      const ir = u(kind === 'wow' ? 0.118 : 0.098), ix = cx + fx * 0.5, iy = cy + fy * 0.5;
      el('circle', { cx: ix, cy: iy, r: ir, fill: C.blue }, L);
      el('circle', { cx: ix, cy: iy, r: ir * 0.46, fill: C.night }, L);
      el('circle', { cx: ix - ir * 0.42, cy: iy - ir * 0.46, r: ir * 0.32, fill: C.cream }, L);
      if (kind === 'shut') { // eyelid down, a ^ on it
        el('circle', { cx, cy, r: R1, fill: C.sunD }, L);
        eye(G, cx, cy + u(0.01), u(0.07), 'shut', C.night);
      } else if (kind === 'smile') { // smiling: the cheek lid rises over the bottom of the lens
        el('ellipse', { cx, cy: cy + u(0.19), rx: u(0.19), ry: u(0.15), fill: C.sunD }, L);
      }
      for (const sx of [-1, 1]) el('ellipse', { cx: cx + sx * u(0.235), cy: cy + u(0.12), rx: u(0.045), ry: u(0.028), fill: C.coral }, G);
    } else {
      // profile: the lens is a short barrel, cream ring + night glass seen edge-on
      el('rect', { x: u(0.2), y: u(-0.15), width: u(0.15), height: u(0.32), rx: u(0.05), fill: C.creamD }, G);
      el('rect', { x: u(0.2), y: u(-0.15), width: u(0.1), height: u(0.32), rx: u(0.04), fill: C.cream }, G);
      el('ellipse', { cx: u(0.35), cy: u(0.01), rx: u(0.04), ry: u(0.125), fill: C.night }, G);
      el('ellipse', { cx: u(0.36), cy: u(kind === 'wow' ? 0.01 : 0.02), rx: u(0.022), ry: u(kind === 'wow' ? 0.085 : 0.065), fill: C.blue }, G);
      el('ellipse', { cx: u(0.13), cy: u(0.2), rx: u(0.045), ry: u(0.028), fill: C.coral }, G);
    }
  },
  hands(G, c) {
    const { u, grip } = c;
    if (!grip || !grip.top) return;
    const [gx, gy] = grip.top;
    // a short arm from the belly down to the case, two coral claw fingers
    capsule(G, 0, u(0.3), gx, gy - u(0.05), u(0.045), C.mist);
    for (const sx of [-1, 1]) el('path', { d: `M${r1(gx)},${r1(gy - u(0.06))}Q${r1(gx + sx * u(0.09))},${r1(gy - u(0.04))} ${r1(gx + sx * u(0.07))},${r1(gy + u(0.03))}`, fill: 'none', stroke: C.coralD, 'stroke-width': u(0.04), 'stroke-linecap': 'round' }, G);
    el('circle', { cx: r1(gx), cy: r1(gy - u(0.06)), r: u(0.04), fill: C.coral }, G);
  },
};
