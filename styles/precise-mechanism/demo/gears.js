// 2D profiles for the movement: involute wheels and pinions, club-tooth escape wheel, spoke windows, convex "bridge" hulls, spirals.
// Every outline is a list of [x, y] in millimetres, counter-clockwise, tooth 0 centred on angle 0.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const inv = a => Math.tan(a) - a;

// Involute spur gear. m = module (mm), z = teeth, pa = pressure angle.
export function involute(z, m, o = {}) {
  const pa = (o.pa ?? 20) * Math.PI / 180, ha = o.add ?? 1, hf = o.ded ?? 1.25, back = o.backlash ?? .04;
  const rp = m * z / 2, rb = rp * Math.cos(pa), ra = rp + ha * m, rf = rp - hf * m;
  const psi = Math.PI / (2 * z) - back / z;                       // half tooth angle at the pitch circle
  const flankAng = r => psi + inv(pa) - inv(Math.acos(Math.min(1, rb / r)));
  const r0 = Math.max(rb, rf), N = o.steps ?? 7;
  let rTip = ra;
  if (flankAng(ra) < .002) { let lo = r0, hi = ra; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; flankAng(mid) > .002 ? lo = mid : hi = mid; } rTip = lo; }  // pointed tooth: cut the tip
  const pts = [];
  for (let i = 0; i < z; i++) {
    const c = i * TAU / z;
    const P = (r, a) => pts.push([r * Math.cos(a), r * Math.sin(a)]);
    if (r0 > rf) P(rf, c - flankAng(r0));
    for (let k = 0; k <= N; k++) { const r = r0 + (rTip - r0) * (k / N) ** 1.4; P(r, c - flankAng(r)); }
    const aT = flankAng(rTip); P(rTip, c);
    for (let k = N; k >= 0; k--) { const r = r0 + (rTip - r0) * (k / N) ** 1.4; P(r, c + flankAng(r)); }
    if (r0 > rf) P(rf, c + flankAng(r0));
    // root arc to the next tooth
    const a1 = c + flankAng(r0), a2 = c + TAU / z - flankAng(r0);
    for (let k = 1; k < 4; k++) P(rf, a1 + (a2 - a1) * k / 4);
    void aT;
  }
  return { pts, rp, ra, rf, rb, z, m };
}

// Swiss club-tooth escape wheel (the teeth lean forward; each tip carries a short impulse face)
export function clubWheel(z, rTip, rRoot) {
  const pts = [], p = TAU / z;
  for (let i = 0; i < z; i++) {
    const a = i * p;
    const P = (r, ang) => pts.push([r * Math.cos(ang), r * Math.sin(ang)]);
    // back of tooth: a gentle curve from the root up to the heel of the club
    P(rRoot, a - .52 * p);
    for (let k = 1; k <= 5; k++) { const u = k / 5; P(rRoot + (rTip - .16 - rRoot) * u, a - .52 * p + .40 * p * u ** .7); }
    P(rTip - .06, a - .08 * p);              // impulse face (club)
    P(rTip, a + .04 * p);                    // locking corner
    // leading (locking) face: nearly radial, raked forward
    for (let k = 1; k <= 4; k++) { const u = k / 4; P(rTip - (rTip - rRoot) * u, a + .04 * p - .10 * p * u); }
    for (let k = 1; k < 3; k++) P(rRoot, a - .06 * p + (.42 * p) * k / 3);
  }
  return pts;
}

// spoke windows between rHub and rRim, n spokes of half-width w; corners rounded with Chaikin
export function windows(n, rHub, rRim, w, phase = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = phase + i * TAU / n, a1 = a0 + TAU / n;
    const poly = [];
    const ao = Math.asin(w / rRim), ai = Math.asin(Math.min(.95, w / rHub));
    const M = 40;
    for (let k = 0; k <= M; k++) { const a = a0 + ao + (a1 - ao - a0 - ao) * k / M; poly.push([rRim * Math.cos(a), rRim * Math.sin(a)]); }
    for (let k = 0; k <= 12; k++) { const a = a1 - ai - (a1 - ai - a0 - ai) * k / 12; poly.push([rHub * Math.cos(a), rHub * Math.sin(a)]); }
    out.push(chaikin(poly, 3));
  }
  return out;
}

export function chaikin(p, it = 2) {
  for (let n = 0; n < it; n++) {
    const q = [];
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
    p = q;
  }
  return p;
}

export const circle = (r, n = 96, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i * TAU / n), cy + r * Math.sin(i * TAU / n)]);

// convex hull of a set of circles [[x, y, r], ...] -> a rounded bridge outline
export function hull(circles, n = 72) {
  const P = [];
  for (const [x, y, r] of circles) for (let i = 0; i < n; i++) P.push([x + r * Math.cos(i * TAU / n), y + r * Math.sin(i * TAU / n)]);
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

const toV = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
const area = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const ccw = p => area(p) < 0 ? p.slice().reverse() : p;
const cw = p => area(p) > 0 ? p.slice().reverse() : p;

// outline + holes -> extruded geometry lying in the XZ plane, thickness along +Y from 0 to h.
// Shape angle θ becomes world angle −θ (see main.js: rotation.y = −ω puts tooth 0 at world angle ω).
export function slab(outline, holes, h, bevel = .03) {
  const s = new THREE.Shape(toV(ccw(outline)));
  for (const hpts of holes || []) s.holes.push(new THREE.Path(toV(cw(hpts))));
  const b = Math.min(bevel, h * .3);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b * .8, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, b);
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// spiral strip (mainspring / hairspring): r(θ) supplied, strip thickness th, height h
export function spiralStrip(rOf, turns, th, h, steps = 160) {
  const N = Math.ceil(turns * steps), outer = [], inner = [];
  for (let i = 0; i <= N; i++) {
    const th0 = i / steps * TAU, r = rOf(th0);
    outer.push([(r + th / 2) * Math.cos(th0), (r + th / 2) * Math.sin(th0)]);
    inner.push([(r - th / 2) * Math.cos(th0), (r - th / 2) * Math.sin(th0)]);
  }
  const poly = outer.concat(inner.reverse());
  const s = new THREE.Shape(toV(ccw(poly)));
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}
