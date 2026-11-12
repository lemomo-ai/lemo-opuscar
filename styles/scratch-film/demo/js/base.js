// The Night Climb — base: maths and the scratched marks (needle lines, dye, hatching), shared by every scratch-film page: no film props (perforations, frame lines) are drawn.
// Every mark is drawn in screen space from projected points, so one engine draws a 1 mm eye at 500 px/mm and a whole
// workbench at 2 px/mm. Widths come from the world (mm × px/mm); the hand's tremble (boil) is in screen pixels.
'use strict';
const W = 1920, H = 1080;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const ei = x => Math.pow(clamp(x, 0, 1), 3);
const eio = x => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const elog = (a, b, u) => Math.exp(lerp(Math.log(a), Math.log(b), u));
function h1(n){ const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
let R = rng(1);
const rr = (a, b) => a + (b - a) * R();
const rs = seed => { R = rng(seed); };

const CREAM = '#fff4dc', BLUE = '#2f86ff', RED = '#ff3220', YEL = '#ffc81c', GREEN = '#46d65a', TEAL = '#1fb39a', INK = '#030202';

let G = null;                            // the context being drawn into
const setG = g => { G = g; };

// ---------------- vectors & the line camera ----------------
const v3 = (x, y, z) => [x, y, z];
const vsub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const vmul = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const vcross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const vnorm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const vlerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// camera from position, look-at target, roll (rad), focal length in px; screen offset ox/oy for split screens
function cam(pos, tgt, roll = 0, f = 1500, ox = 960, oy = 540, upw = [0, 0, 1]){
  const fw = vnorm(vsub(tgt, pos));
  let rt = vcross(fw, upw); if (Math.hypot(...rt) < 1e-6) rt = [1, 0, 0]; rt = vnorm(rt);
  let up = vcross(rt, fw);
  const c = Math.cos(roll), s = Math.sin(roll);
  const r2 = vadd(vmul(rt, c), vmul(up, s)), u2 = vadd(vmul(up, c), vmul(rt, -s));
  return { pos, fw, rt: r2, up: u2, f, ox, oy, near: Math.max(.3, .05 * Math.hypot(...vsub(tgt, pos))) };
}
// orbit helper: camera at distance d from target, elevation el (rad above the plane), azimuth az (rad, 0 = from −Y)
function orbit(tgt, d, el, az, roll = 0, f = 1500){
  const p = [tgt[0] + d * Math.cos(el) * Math.sin(az), tgt[1] - d * Math.cos(el) * Math.cos(az), tgt[2] + d * Math.sin(el)];
  return cam(p, tgt, roll, f);
}
function pr(C, p){
  const d = vsub(p, C.pos), z = vdot(d, C.fw);
  if (z < C.near) return null;
  const k = C.f / z;
  return [C.ox + vdot(d, C.rt) * k, C.oy - vdot(d, C.up) * k, k];
}
// project a 3D polyline, clipping against the near plane; returns screen points (with scale in [2])
function prl(C, P){
  const out = [];
  let prev = null, pz = 0;
  for (const p of P){
    const z = vdot(vsub(p, C.pos), C.fw);
    if (prev){
      if ((pz < C.near) !== (z < C.near)){
        const t = (C.near - pz) / (z - pz); const q = vlerp(prev, p, t); const s = pr(C, vadd(q, vmul(C.fw, 1e-3)));
        if (s) out.push(s);
      }
    }
    if (z >= C.near) out.push(pr(C, p));
    prev = p; pz = z;
  }
  return out;
}
const scaleAt = (C, p) => { const s = pr(C, p); return s ? s[2] : 0; };

// ---------------- splines & marks ----------------
function spline(P, step = 4){
  if (P.length < 2) return P.slice();
  if (P.length === 2){ const d = Math.hypot(P[1][0]-P[0][0], P[1][1]-P[0][1]), n = Math.max(1, Math.min(200, Math.ceil(d / step))); const out = []; for (let k = 0; k <= n; k++) out.push([lerp(P[0][0], P[1][0], k/n), lerp(P[0][1], P[1][1], k/n)]); return out; }
  const out = [];
  for (let i = 0; i < P.length - 1; i++){
    const p0 = P[Math.max(0, i-1)], p1 = P[i], p2 = P[i+1], p3 = P[Math.min(P.length-1, i+2)];
    const d = Math.hypot(p2[0]-p1[0], p2[1]-p1[1]); const n = Math.max(1, Math.min(200, Math.ceil(d / step)));
    for (let k = 0; k < n; k++){
      const t = k/n, t2 = t*t, t3 = t2*t;
      out.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);
    }
  }
  out.push(P[P.length-1]); return out;
}
function onScreen(P, m = 200){ let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of P){ if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return x1 > -m && x0 < W + m && y1 > -m && y0 < H + m; }
// A needle line: near-parallel passes, uneven width, skips, chipped edges, an overshoot tail. w in px.
function scratch(P, o = {}){
  if (P.length < 2 || !onScreen(P)) return;
  let w = o.w ?? 3, A = o.a ?? 1;
  if (w < .7){ A *= w / .7; w = .7; }
  const passes = o.passes ?? (w > 1.6 ? 3 : 2), col = o.col ?? CREAM, jit = o.jit ?? clamp(w * .7, .25, 5);
  const pts = spline(P, Math.max(2, Math.min(6, w * 1.5)));
  G.strokeStyle = col; G.fillStyle = col; G.lineCap = 'round';
  for (let ps = 0; ps < passes; ps++){
    const off = (ps === 0 ? 0 : rr(-1, 1)) * jit, drift = rr(-1, 1) * jit * .6, ph = R() * 100;
    let skip = 0;
    G.globalAlpha = A * (ps === 0 ? .95 : .5 + R() * .4);
    for (let i = 1; i < pts.length; i++){
      const a = pts[i-1], b = pts[i];
      const dx = b[0]-a[0], dy = b[1]-a[1]; const l = Math.hypot(dx, dy) || 1; const nx = -dy/l, ny = dx/l;
      const u = i / pts.length;
      const oo = off + drift * Math.sin(u*6 + ph) + (R() - .5) * jit * .35;
      if (skip > 0){ skip--; continue; }
      if (!o.solid && R() < .012){ skip = 1 + (R()*4|0); continue; }
      const ww = w * (ps === 0 ? 1 : .45) * (.55 + R()*.75) * (o.even ? 1 : (.65 + .35*Math.sin(u*Math.PI)));
      G.lineWidth = Math.max(.6, ww);
      G.beginPath(); G.moveTo(a[0]+nx*oo, a[1]+ny*oo); G.lineTo(b[0]+nx*oo, b[1]+ny*oo); G.stroke();
      if (w > 2.5 && R() < (w > 12 ? .012 : .03)){
        const s = rr(.5, 1.1) * Math.min(w, 7), sd = R() < .5 ? -1 : 1;
        G.beginPath(); G.moveTo(b[0]+nx*oo, b[1]+ny*oo);
        G.lineTo(b[0]+nx*(oo+sd*s*1.3)+dx/l*s, b[1]+ny*(oo+sd*s*1.3)+dy/l*s);
        G.lineTo(b[0]+dx/l*s*2, b[1]+dy/l*s*2); G.closePath(); G.fill();
      }
    }
  }
  if (o.tail !== false && R() < .55 && pts.length > 6){
    const e = pts[pts.length-1], d = pts[pts.length-6];
    const dx = e[0]-d[0], dy = e[1]-d[1], l = Math.hypot(dx, dy) || 1, k = rr(4, 14) * Math.min(4, w);
    G.globalAlpha = .7 * A; G.lineWidth = Math.max(.6, w * .3);
    G.beginPath(); G.moveTo(e[0], e[1]); G.lineTo(e[0]+dx/l*k+rr(-2,2), e[1]+dy/l*k+rr(-2,2)); G.stroke();
  }
  G.globalAlpha = 1;
}
// transparent dye laid with a brush: streaky bristles along a path. w = band width px.
function dye(P, o = {}){
  if (P.length < 2 || !onScreen(P)) return;
  const w = o.w ?? 18, col = o.col, n = o.n ?? 8, a0 = o.a ?? .55, lw0 = o.lw ?? Math.max(1, w / n * 1.3);
  const pts = spline(P, 3);
  G.strokeStyle = col; G.lineCap = 'round'; G.lineJoin = 'round';
  for (let k = 0; k < n; k++){
    const off = (n > 1 ? (k/(n-1) - .5) : 0) * w + rr(-1, 1) * w * .12;
    G.lineWidth = lw0 * rr(.6, 1.4); G.globalAlpha = a0 * rr(.4, 1);
    const start = R() * .08, end = 1 - R() * .1;
    G.beginPath(); let first = true;
    for (let i = 1; i < pts.length; i++){
      const u = i / pts.length; if (u < start || u > end) continue;
      const a = pts[i-1], b = pts[i]; const dx = b[0]-a[0], dy = b[1]-a[1]; const l = Math.hypot(dx, dy) || 1;
      const taper = Math.sin(Math.PI * clamp((u-start)/(end-start), 0, 1));
      const oo = off * (.4 + .6*taper);
      const x = b[0] - dy/l*oo, y = b[1] + dx/l*oo;
      if (first){ G.moveTo(x, y); first = false; } else G.lineTo(x, y);
    }
    G.stroke();
  }
  G.globalAlpha = 1;
}
// fill a polygon by back-and-forth hatching that overshoots the edge (dye or scratched light)
function clipRect(P, x0 = -60, y0 = -60, x1 = W + 60, y1 = H + 60){
  const edge = (P, inside, inter) => { const out = []; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length]; const ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(inter(a, b)); } return out; };
  const ix = (x) => (a, b) => { const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + (b[1] - a[1]) * t]; };
  const iy = (y) => (a, b) => { const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y]; };
  P = edge(P, p => p[0] >= x0, ix(x0)); if (P.length < 3) return P;
  P = edge(P, p => p[0] <= x1, ix(x1)); if (P.length < 3) return P;
  P = edge(P, p => p[1] >= y0, iy(y0)); if (P.length < 3) return P;
  return edge(P, p => p[1] <= y1, iy(y1));
}
function hatch(p, col, o = {}){
  if (p.length < 3 || !onScreen(p)) return;
  p = clipRect(p); if (p.length < 3) return;
  const ang = o.ang ?? rr(-.6, .6), gap = o.gap ?? 8, a = o.a ?? .6, lw = o.lw ?? [1.2, 3.4];
  let cx = 0, cy = 0; p.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= p.length; cy /= p.length;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const proj = p.map(q => { const x = q[0]-cx, y = q[1]-cy; return [x*ca + y*sa, -x*sa + y*ca]; });
  let dmin = 1e9, dmax = -1e9; proj.forEach(q => { dmin = Math.min(dmin, q[1]); dmax = Math.max(dmax, q[1]); });
  if (dmax - dmin > 6000) return;
  const span = d => { let lo = 1e9, hi = -1e9, c = 0; for (let i = 0; i < proj.length; i++){ const A = proj[i], B = proj[(i+1)%proj.length]; if ((A[1]-d)*(B[1]-d) <= 0 && A[1] !== B[1]){ const x = A[0]+(d-A[1])/(B[1]-A[1])*(B[0]-A[0]); lo = Math.min(lo, x); hi = Math.max(hi, x); c++; } } return c < 2 ? null : [lo, hi]; };
  const toXY = (t, d) => [cx + t*ca - d*sa, cy + t*sa + d*ca];
  const ov = o.over ?? Math.min(14, gap * 1.6);
  G.strokeStyle = col; G.lineJoin = 'round'; G.lineCap = 'round';
  for (let pass = 0; pass < (o.passes ?? 2); pass++){
    const zz = []; let flip = pass % 2;
    for (let d = dmin + gap*R(); d < dmax; d += gap*rr(.6, 1.4)){
      const s = span(d); if (!s) continue;
      const t0 = s[0] - rr(0, ov), t1 = s[1] + rr(0, ov);
      if (flip){ zz.push(toXY(t1, d+rr(-1,1))); zz.push(toXY(t0, d+rr(-1,1))); }
      else     { zz.push(toXY(t0, d+rr(-1,1))); zz.push(toXY(t1, d+rr(-1,1))); }
      flip ^= 1;
    }
    for (let b = 0; b < (o.strands ?? 2); b++){
      const oo = rr(-2, 2);
      G.lineWidth = rr(lw[0], lw[1]); G.globalAlpha = a * rr(.45, .9);
      G.beginPath(); zz.forEach((q, i) => i ? G.lineTo(q[0]+oo, q[1]-oo) : G.moveTo(q[0]+oo, q[1]-oo)); G.stroke();
    }
  }
  G.globalAlpha = 1;
}
function fillPoly(P, col, a = 1){ if (P.length < 3 || P.some(q => q[0] !== q[0])) return; G.globalAlpha = a; G.fillStyle = col; G.beginPath(); P.forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.closePath(); G.fill(); G.globalAlpha = 1; }
function fillPolys(list, col, a = 1){ G.globalAlpha = a; G.fillStyle = col; G.beginPath(); for (const P of list){ if (P.length < 3) continue; P.forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.closePath(); } G.fill(); G.globalAlpha = 1; }
function disc(x, y, r, col, a = 1){ G.globalAlpha = a; G.fillStyle = col; G.beginPath(); G.arc(x, y, Math.max(.3, r), 0, 7); G.fill(); G.globalAlpha = 1; }
function glow(x, y, r, col, a = 1){ const g = G.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); G.globalAlpha = a; G.fillStyle = g; G.fillRect(x - r, y - r, 2*r, 2*r); G.globalAlpha = 1; }
// circle in 3D (centre, axis vectors a, b) → points
function circ3(c, a, b, n = 36, a0 = 0, a1 = Math.PI * 2){ const P = []; for (let i = 0; i <= n; i++){ const t = a0 + (a1 - a0) * i / n; P.push(vadd(c, vadd(vmul(a, Math.cos(t)), vmul(b, Math.sin(t))))); } return P; }
const rect3 = (c, a, b) => [vadd(c, vadd(vmul(a, -1), vmul(b, -1))), vadd(c, vadd(a, vmul(b, -1))), vadd(c, vadd(a, b)), vadd(c, vadd(vmul(a, -1), b))];
// straight edges stay straight under the spline: subdivide every segment
function densify(P, n = 6){ if (P.length < 2) return P; const out = []; for (let i = 0; i < P.length - 1; i++){ for (let k = 0; k < n; k++) out.push(vlerp(P[i], P[i+1], k / n)); } out.push(P[P.length-1]); return out; }
// 3D convenience: needle line through world points; w in mm
const medScale = S => { const a = S.filter(q => q[0] > -200 && q[0] < W + 200 && q[1] > -200 && q[1] < H + 200).map(q => q[2]).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
function sline(C, P, wmm, o = {}){ const S = prl(C, P.length < 6 ? densify(P) : P); if (S.length < 2) return; const sc = medScale(S); scratch(S, Object.assign({}, o, { w: Math.min(80, (o.wpx ?? 0) + wmm * sc) })); }
function spoly(C, P, col, o = {}){ const S = prl(C, densify(P.concat([P[0]]), 8)); if (S.length < 3) return null; if (o.fill) fillPoly(S, o.fill, o.fa ?? 1); if (o.hatch) hatch(S, o.hatch, o.h || {}); if (o.w) { const sc = medScale(S); scratch(S, Object.assign({ tail: false, col }, o.lo || {}, { w: Math.min(80, o.w * sc + (o.wpx ?? 0)) })); } return S; }

// ---------------- images laid on world planes (tape, writing, counter digits) ----------------
// draw canvas img so that its top-left lands at world o, its width runs along ax (world vector), height along ay
function planeImg(C, img, o, ax, ay, a = 1){
  const p0 = pr(C, o), p1 = pr(C, vadd(o, ax)), p2 = pr(C, vadd(o, ay)), p3_ = pr(C, vadd(o, vadd(ax, ay)));
  if (!p0 || !p1 || !p2 || !p3_) return null;
  const xs_ = [p0[0], p1[0], p2[0], p3_[0]], ys_ = [p0[1], p1[1], p2[1], p3_[1]];
  if (Math.max(...xs_) < -50 || Math.min(...xs_) > W + 50 || Math.max(...ys_) < -50 || Math.min(...ys_) > H + 50) return null;
  if (Math.min(...xs_) < -2500 || Math.max(...xs_) > W + 2500 || Math.min(...ys_) < -2500 || Math.max(...ys_) > H + 2500) return null;
  if (Math.max(p0[2], p1[2], p2[2], p3_[2]) > 3 * Math.min(p0[2], p1[2], p2[2], p3_[2])) return null;
  G.save(); G.globalAlpha = a;
  G.setTransform((p1[0]-p0[0])/img.width, (p1[1]-p0[1])/img.width, (p2[0]-p0[0])/img.height, (p2[1]-p0[1])/img.height, p0[0], p0[1]);
  G.drawImage(img, 0, 0); G.restore();
  const p3 = pr(C, vadd(o, vadd(ax, ay)));
  const xs = [p0[0], p1[0], p2[0], p3 ? p3[0] : p0[0]], ys = [p0[1], p1[1], p2[1], p3 ? p3[1] : p0[1]];
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), h: Math.hypot(p2[0]-p0[0], p2[1]-p0[1]) };
}
// hand lettering: a marker font, every letter set a little off its line and turned, ink thicker at the starts
const LET = {};
function lettering(text, o = {}){
  const key = text + '|' + (o.col || '') + '|' + (o.var || 0) + '|' + (o.font || 'M');
  if (LET[key]) return LET[key];
  const px = 120, font = o.font === 'mono' ? `${px}px MONO` : `${px}px MARK`;
  const c0 = mk(10, 10).getContext('2d'); c0.font = font;
  const chars = [...text]; const ws = chars.map(ch => c0.measureText(ch).width * (ch === ' ' ? .7 : 1));
  const tw = ws.reduce((a, b) => a + b, 0) + 40, th = px * 1.45;
  const c = mk(Math.ceil(tw), Math.ceil(th)), g = c.getContext('2d');
  const q = rng(77 + (o.var || 0) * 131 + text.length * 7);
  g.font = font; g.textBaseline = 'alphabetic';
  let x = 20;
  chars.forEach((ch, i) => {
    const rot = (q() - .5) * (o.rot ?? .09), dy = (q() - .5) * (o.dy ?? 10), sc = 1 + (q() - .5) * .08;
    g.save(); g.translate(x + ws[i] / 2, px * 1.08 + dy); g.rotate(rot); g.scale(sc, sc);
    g.fillStyle = o.col || INK; g.strokeStyle = o.col || INK; g.lineWidth = o.bold ?? 5; g.lineJoin = 'round';
    g.fillText(ch, -ws[i] / 2, 0); g.strokeText(ch, -ws[i] / 2, 0);
    g.restore(); x += ws[i] * (o.track ?? 1);
  });
  if (o.texture !== false){                      // marker streaks: thin gaps where the felt tip skipped
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 120; i++){ g.globalAlpha = .1 + q() * .25; g.lineWidth = 1 + q() * 2.5; const yy = q() * th; g.beginPath(); g.moveTo(0, yy); g.lineTo(tw, yy + (q() - .5) * 30); g.stroke(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  return (LET[key] = c);
}
// masking tape: cream paper, fibres, torn ends; drawn as bright scratched hatching like everything light in this film
const TAPES = {};
function tapeImg(w, h, v){
  const key = w + 'x' + h + ':' + v; if (TAPES[key]) return TAPES[key];
  const c = mk(w, h), g = c.getContext('2d'), q = rng(900 + v * 17 + w);
  const P = []; const n = 14;
  for (let i = 0; i <= n; i++) P.push([6 + q() * 10, i / n * h]);
  const Q = []; for (let i = n; i >= 0; i--) Q.push([w - 6 - q() * 10, i / n * h]);
  g.beginPath(); P.concat(Q).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  g.fillStyle = '#d9c9a2'; g.fill(); g.save(); g.clip();
  g.strokeStyle = '#fff4dc'; g.lineCap = 'round';
  for (let d = -h; d < w + h; d += 3 + q() * 4){ g.globalAlpha = .25 + q() * .5; g.lineWidth = 1 + q() * 3; g.beginPath(); g.moveTo(d, -5); g.lineTo(d + h * .5 + (q() - .5) * 8, h + 5); g.stroke(); }
  g.strokeStyle = '#b8a47a'; for (let i = 0; i < 60; i++){ g.globalAlpha = .25; g.lineWidth = 1; const x = q() * w, y = q() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + q() * 40, y + (q() - .5) * 4); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(60,40,10,.25)');
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.restore();
  return (TAPES[key] = c);
}

// ---------------- the meta film: emulsion, dust, grain ----------------
const EM = [], DUST = [], GRAIN = [];
function makeEmulsion(seed){
  const c = mk(W, H), g = c.getContext('2d'); const r = rng(seed);
  g.fillStyle = '#050403'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 200; i++){
    const x = r()*W, y = r()*H, rad = 40 + r()*240;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); const tone = r() < .5 ? '32,22,16' : '14,16,24';
    gr.addColorStop(0, `rgba(${tone},${.16 + r()*.18})`); gr.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad*2, rad*2);
  }
  return c;
}
function makeDust(seed){
  const c = mk(W, H), g = c.getContext('2d'); const r = rng(seed);
  for (let i = 0; i < 520; i++){ const x = r()*W, y = r()*H, s = (r() < .9 ? .8 : 2.2) * (.6 + r()); g.globalAlpha = .2 + r()*.6; g.fillStyle = r() < .85 ? CREAM : (r() < .5 ? YEL : BLUE); g.fillRect(x, y, s, s); }
  g.strokeStyle = CREAM;
  for (let i = 0; i < 0; i++){ const x = r()*W; g.globalAlpha = .1 + r()*.22; g.lineWidth = .6 + r()*1.1; g.beginPath(); let y = r()*300; g.moveTo(x, y); const y2 = y + H*(.3 + r()*.8); for (let yy = y; yy < y2; yy += 20) g.lineTo(x + Math.sin(yy*.003 + i)*6, yy); g.stroke(); }
  for (let i = 0; i < 70; i++){ const x = r()*W, y = r()*H, a = r()*6.28, l = 8 + r()*50; g.globalAlpha = .15 + r()*.35; g.lineWidth = .5 + r()*.9; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a+.3)*l*.5, y + Math.sin(a+.3)*l*.5, x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke(); }
  // a few dark specks (dirt on the print)
  for (let i = 0; i < 40; i++){ g.globalAlpha = .5; g.fillStyle = '#000'; const x = r()*W, y = r()*H; g.beginPath(); g.ellipse(x, y, 1 + r()*4, 1 + r()*3, r()*3, 0, 7); g.fill(); }
  return c;
}
function makeGrain(seed){
  const c = mk(W, H), g = c.getContext('2d'); const r = rng(seed);
  for (let i = 0; i < 26000; i++){ g.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.1)'; g.fillRect(r()*W, r()*H, 1.5, 1.5); }
  return c;
}
