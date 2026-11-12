// Pop Art print engine — core
// Three drawing layers, printed by one WebGL2 pass:
//   plates : RGB = density of the RED / YELLOW / BLUE plates (1 = solid, 0.05–0.95 = Ben-Day dots, 0 = paper)
//   line   : the BLACK key plate (alpha = ink)
//   spot   : "the one colour" escape hatch — pixels here keep their own RGB (printed unscreened, under black)
// All coordinates are PAGE units; the camera maps page → screen. Ben-Day dots live on a 45° grid in page space,
// so pushing the camera in makes the dots bigger on screen (Lichtenstein scale), pulling out shrinks them to a tint.

export const INK = {
  red: [0xE4, 0x23, 0x2B], yellow: [0xFF, 0xD2, 0x1F], blue: [0x1E, 0x62, 0xB0],
  black: [0x14, 0x14, 0x14], paper: [0xF8, 0xF2, 0xE2],
};
// plate densities presets  {r, y, b}
export const T = {
  paper: { r: 0, y: 0, b: 0 }, white: { r: 0, y: 0, b: 0 },
  red: { r: 1 }, yellow: { y: 1 }, blue: { b: 1 },
  orange: { r: .55, y: 1 }, green: { y: 1, b: .6 }, purple: { r: .7, b: 1 },
  skin: { r: .34 }, skinShade: { r: .55 }, blush: { r: .5 },
  sky: { b: .32 }, shadow: { b: .45 }, pale: { b: .18 }, sun: { y: .55 }, dusk: { r: .45, y: 1 },
};
export const dens = (o) => `rgb(${Math.round((o.r || 0) * 255)},${Math.round((o.y || 0) * 255)},${Math.round((o.b || 0) * 255)})`;

// ---------- SVG path → Path2D + sampled polylines ----------
const pathCache = new Map();
export function parsePath(d) {
  if (pathCache.has(d)) return pathCache.get(d);
  const toks = d.match(/[MmLlHhVvCcSsQqZz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const subs = []; let cur = null, i = 0, cmd = 'M', x = 0, y = 0, sx = 0, sy = 0, lcx = 0, lcy = 0, lastC = '';
  const num = () => parseFloat(toks[i++]);
  const push = (px, py) => cur.pts.push([px, py]);
  const bez = (x0, y0, x1, y1, x2, y2, x3, y3) => {
    const n = Math.max(6, Math.min(40, Math.ceil((Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2)) / 4)));
    for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; push(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); }
  };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'M') { const nx = num() + ox, ny = num() + oy; cur = { pts: [[nx, ny]], closed: false }; subs.push(cur); x = sx = nx; y = sy = ny; cmd = rel ? 'l' : 'L'; lastC = 'M'; }
    else if (C === 'L') { x = num() + ox; y = num() + oy; push(x, y); lastC = 'L'; }
    else if (C === 'H') { x = num() + ox; push(x, y); lastC = 'L'; }
    else if (C === 'V') { y = num() + oy; push(x, y); lastC = 'L'; }
    else if (C === 'C') { const a = num() + ox, b = num() + oy, c = num() + ox, e = num() + oy, f = num() + ox, g = num() + oy; bez(x, y, a, b, c, e, f, g); lcx = c; lcy = e; x = f; y = g; lastC = 'C'; }
    else if (C === 'S') { const a = lastC === 'C' ? 2 * x - lcx : x, b = lastC === 'C' ? 2 * y - lcy : y; const c = num() + ox, e = num() + oy, f = num() + ox, g = num() + oy; bez(x, y, a, b, c, e, f, g); lcx = c; lcy = e; x = f; y = g; lastC = 'C'; }
    else if (C === 'Q') { const a = num() + ox, b = num() + oy, f = num() + ox, g = num() + oy; bez(x, y, x + 2 / 3 * (a - x), y + 2 / 3 * (b - y), f + 2 / 3 * (a - f), g + 2 / 3 * (b - g), f, g); x = f; y = g; lastC = 'Q'; }
    else if (C === 'Z') { if (cur) cur.closed = true; x = sx; y = sy; lastC = 'Z'; }
    else i++;
  }
  const out = { subs, p2d: new Path2D(d) };
  pathCache.set(d, out);
  return out;
}
// shape → Path2D. Accepts: svg string | Path2D | [[x,y],...] polygon | {pts, closed}
export function toPath(s) {
  if (typeof s === 'string') return parsePath(s).p2d;
  if (s instanceof Path2D) return s;
  const p = new Path2D(); const pts = s.pts || s;
  pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p;
}
export function toSubs(s) {
  if (typeof s === 'string') return parsePath(s).subs;
  if (Array.isArray(s)) return [{ pts: s, closed: false }];
  if (s.pts) return [s];
  return [];
}
// helpers to build shapes procedurally
export const ellipsePts = (cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) => { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
export const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

// ---------- the engine ----------
export function createPop(out, { W = 1920, H = 1080 } = {}) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const cP = mk(), cL = mk(), cS = mk();
  const P = cP.getContext('2d'), L = cL.getContext('2d'), S = cS.getContext('2d');
  const ctxs = [P, L, S];
  let cam = { x: 0, y: 0, zoom: 1, rot: 0 };
  let camM = new DOMMatrix();
  const pop = { W, H, P, L, S, INK, T, lineK: .4, lineMul: 1 };

  // ----- transform stack (applied to all three layers) -----
  pop.save = () => ctxs.forEach(c => c.save());
  pop.restore = () => ctxs.forEach(c => c.restore());
  pop.translate = (x, y) => ctxs.forEach(c => c.translate(x, y));
  pop.rotate = a => ctxs.forEach(c => c.rotate(a));
  pop.scale = (a, b = a) => ctxs.forEach(c => c.scale(a, b));
  pop.transform = (...m) => ctxs.forEach(c => c.transform(...m));
  pop.clip = s => { const p = toPath(s); ctxs.forEach(c => c.clip(p)); };
  pop.alpha = a => ctxs.forEach(c => c.globalAlpha = a);
  // local scale relative to page (for line-width compensation)
  pop.localScale = () => { const m = L.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / cam.zoom; };

  pop.begin = (c, { desk = '#1d2330' } = {}) => {
    cam = Object.assign({ x: 0, y: 0, zoom: 1, rot: 0 }, c);
    ctxs.forEach(k => { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.globalCompositeOperation = 'source-over'; });
    pop.reads = [];
    P.fillStyle = '#000'; P.fillRect(0, 0, W, H);
    L.clearRect(0, 0, W, H);
    S.clearRect(0, 0, W, H);
    if (desk) { S.fillStyle = desk; S.fillRect(0, 0, W, H); }
    camM = new DOMMatrix().translate(W / 2, H / 2).rotate(cam.rot * 180 / Math.PI).scale(cam.zoom).translate(-cam.x, -cam.y);
    ctxs.forEach(k => k.setTransform(camM));
  };
  pop.cam = () => cam;
  pop.toScreen = (x, y) => { const p = camM.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; };
  // current local point → page coords (for anchoring effects to a drawn feature)
  pop.localToPage = (x, y) => { const m = camM.inverse().multiply(L.getTransform()); const p = m.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; };

  // ----- fills -----
  // opaque fill with plate densities; also knocks out black + spot below
  pop.fill = (s, ink = T.white) => {
    const p = toPath(s);
    P.fillStyle = typeof ink === 'string' ? ink : dens(ink); P.fill(p);
    L.save(); L.globalCompositeOperation = 'destination-out'; L.fill(p); L.restore();
    S.save(); S.globalCompositeOperation = 'destination-out'; S.fill(p); S.restore();
  };
  // add ink to plates only where already painted? (overprint a tone onto existing plates: lighten = max per channel)
  pop.over = (s, ink) => { const p = toPath(s); P.save(); P.globalCompositeOperation = 'lighten'; P.fillStyle = dens(ink); P.fill(p); P.restore(); };
  // remove a plate's ink (e.g. highlight) : darken with complementary
  pop.knock = s => pop.fill(s, T.white);
  pop.black = s => { const p = toPath(s); L.fillStyle = '#000'; L.fill(p); S.save(); S.globalCompositeOperation = 'destination-out'; S.fill(p); S.restore(); };
  pop.spot = (s, css) => { const p = toPath(s); S.fillStyle = css; S.fill(p); L.save(); L.globalCompositeOperation = 'destination-out'; L.fill(p); L.restore(); };
  // translucent tint over everything except the black plate (page-turn shading, cast shadows)
  pop.shade = (s, css) => { const p = toPath(s); S.fillStyle = css; S.fill(p); };
  // erase black only (e.g. white highlight on black hair)
  pop.unblack = s => { const p = toPath(s); L.save(); L.globalCompositeOperation = 'destination-out'; L.fill(p); L.restore(); };

  // ----- ink lines: variable-width brush -----
  // w: width in page units (at local scale 1). opts: taper (0..0.5 of length), tmin (end width factor), weight (thicker on the shadow side), closed
  pop.line = (s, w = 3, o = {}) => {
    const ls = pop.localScale() || 1;
    const wl = w * pop.lineMul / ls * Math.pow(ls, pop.lineK);
    for (const sub of toSubs(s)) strokeVar(L, sub.pts, wl, { closed: o.closed ?? sub.closed, ...o });
  };
  function strokeVar(g, pts, w, o) {
    const n = pts.length; if (n < 2) return;
    const closed = !!o.closed, taper = o.taper ?? .22, tmin = o.tmin ?? .25, weight = o.weight ?? .35;
    const lx = -.6, ly = -.8;   // light from upper-left (lines get heavier on the lower-right side)
    // cumulative length
    const cl = [0]; for (let k = 1; k < n; k++) cl.push(cl[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const len = cl[n - 1] || 1;
    const Lp = [], Rp = [];
    for (let k = 0; k < n; k++) {
      const a = pts[closed ? (k - 1 + n) % n : Math.max(0, k - 1)], b = pts[closed ? (k + 1) % n : Math.min(n - 1, k + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;
      const u = cl[k] / len;
      let f = 1;
      if (!closed && taper > 0) { const e = Math.min(u, 1 - u) / taper; f = tmin + (1 - tmin) * Math.sqrt(Math.min(1, e)); }
      const side = (nx * -lx + ny * -ly);   // normal facing away from light
      const ww = w * f * (1 + weight * side * (o.wdir ?? 1)) * (o.wfn ? o.wfn(u) : 1) * .5;
      Lp.push([pts[k][0] + nx * ww, pts[k][1] + ny * ww]); Rp.push([pts[k][0] - nx * ww, pts[k][1] - ny * ww]);
    }
    g.beginPath();
    if (closed) {
      Lp.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath();
      for (let k = n - 1; k >= 0; k--) k === n - 1 ? g.moveTo(Rp[k][0], Rp[k][1]) : g.lineTo(Rp[k][0], Rp[k][1]); g.closePath();
      g.fillStyle = '#000'; g.fill('evenodd');
      // evenodd between outer and inner ribbons can fail for self-overlaps; add round joins
      return;
    }
    Lp.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    for (let k = n - 1; k >= 0; k--) g.lineTo(Rp[k][0], Rp[k][1]);
    g.closePath(); g.fillStyle = '#000'; g.fill();
    // round caps
    const cap = (k) => { const r = Math.hypot(Lp[k][0] - Rp[k][0], Lp[k][1] - Rp[k][1]) / 2; if (r > .05) { g.beginPath(); g.arc(pts[k][0], pts[k][1], r, 0, 7); g.fill(); } };
    cap(0); cap(n - 1);
  }
  pop.strokeVar = strokeVar;
  // ribbon polygon (tapered brush stroke) you can fill with any plate ink:  pop.fill(pop.ribbon(pts, w), T.blue)
  pop.ribbon = (s, w = 6, o = {}) => {
    const sub = toSubs(s)[0]; const pts = sub.pts; const n = pts.length; if (n < 2) return [];
    const taper = o.taper ?? .5, tmin = o.tmin ?? .05;
    const cl = [0]; for (let k = 1; k < n; k++) cl.push(cl[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const len = cl[n - 1] || 1, Lp = [], Rp = [];
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const u = cl[k] / len, e = Math.min(u, 1 - u) / Math.max(1e-3, taper);
      const ww = w * .5 * (tmin + (1 - tmin) * Math.sqrt(Math.min(1, e))) * (o.wfn ? o.wfn(u) : 1);
      Lp.push([pts[k][0] - ty * ww, pts[k][1] + tx * ww]); Rp.push([pts[k][0] + ty * ww, pts[k][1] - tx * ww]);
    }
    return Lp.concat(Rp.reverse());
  };
  // uniform-ish closed outline convenience
  pop.outline = (s, w = 3, o = {}) => pop.line(s, w, { taper: 0, ...o });
  // fill + outline in one
  pop.shape = (s, ink, w = 3, o = {}) => { pop.fill(s, ink); if (w > 0) pop.outline(s, w, o); };

  // ----- text -----
  pop.text = (str, x, y, o = {}) => {
    if (o.read) pop.readBox(o.read, str, x, y, o);
    const size = o.size || 60, font = `${o.weight || ''} ${size}px ${o.font || 'Anton'}`;
    const lines = String(str).split('\n'), lh = size * (o.lh || 1.08);
    const all = (fn) => lines.forEach((ln, k) => fn(ln, x, y + (k - (lines.length - 1) / 2) * lh));
    ctxs.forEach(c => { c.save(); c.font = font; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; if (o.letter) c.letterSpacing = o.letter + 'px'; });
    if (o.rot || o.skew) ctxs.forEach(c => { c.translate(x, y); c.rotate(o.rot || 0); if (o.skew) c.transform(1, 0, o.skew, 1, 0, 0); c.translate(-x, -y); });
    if (o.shadow) { // extruded drop in a plate colour
      const { dx = 6, dy = 6, ink = T.red, steps = 6 } = o.shadow;
      P.fillStyle = dens(ink);
      for (let k = steps; k >= 1; k--) all((ln, xx, yy) => { P.fillText(ln, xx + dx * k / steps, yy + dy * k / steps); L.save(); L.globalCompositeOperation = 'destination-out'; L.fillText(ln, xx + dx * k / steps, yy + dy * k / steps); L.restore(); });
      if (o.shadowLine) { L.lineWidth = o.shadowLine; L.lineJoin = 'round'; L.strokeStyle = '#000'; all((ln, xx, yy) => L.strokeText(ln, xx + dx, yy + dy)); }
    }
    if (o.outline) { L.lineWidth = o.outline; L.lineJoin = 'round'; L.strokeStyle = '#000'; all((ln, xx, yy) => L.strokeText(ln, xx, yy)); }
    if (o.fill) { // coloured letters on plates, knocking the black
      P.fillStyle = dens(o.fill);
      all((ln, xx, yy) => { P.fillText(ln, xx, yy); L.save(); L.globalCompositeOperation = 'destination-out'; L.fillText(ln, xx, yy); L.restore(); });
      if (o.inline) { L.lineWidth = o.inline; L.strokeStyle = '#000'; all((ln, xx, yy) => L.strokeText(ln, xx, yy)); }
    } else if (o.spot) { S.fillStyle = o.spot; all((ln, xx, yy) => S.fillText(ln, xx, yy)); }
    else { L.fillStyle = '#000'; all((ln, xx, yy) => L.fillText(ln, xx, yy)); }
    ctxs.forEach(c => c.restore());
  };
  // readable texts for the reading-time check (window.TEXTS): screen boxes of every text drawn with o.read
  pop.reads = [];
  pop.readBox = (id, str, x, y, o = {}) => {
    const size = o.size || 60, lines = String(str).split('\n'), lh = size * (o.lh || 1.08), w = pop.measure(str, o), h = lh * lines.length;
    const al = o.align || 'center', x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2, y0 = y - h / 2;
    const m = L.getTransform(), c = [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]].map(([a, b]) => m.transformPoint(new DOMPoint(a, b)));
    pop.reads.push({ id, text: String(str).replace(/\n/g, ' '), x0: Math.min(...c.map(p => p.x)), y0: Math.min(...c.map(p => p.y)), x1: Math.max(...c.map(p => p.x)), y1: Math.max(...c.map(p => p.y)) });
  };
  pop.measure = (str, o = {}) => { L.save(); L.font = `${o.weight || ''} ${o.size || 60}px ${o.font || 'Anton'}`; if (o.letter) L.letterSpacing = o.letter + 'px'; const w = Math.max(...String(str).split('\n').map(s => L.measureText(s).width)); L.restore(); return w; };

  // ----- print (WebGL2) -----
  const gl = out.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const vs = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `#version 300 es
  precision highp float;
  uniform sampler2D uP, uL, uS; uniform vec2 uR; uniform mat3 uInv; uniform float uZoom, uCell, uGain, uAdd, uSeed, uAge, uRough;
  uniform vec2 uOff0, uOff1, uOff2; uniform vec4 uMask; uniform float uPaperK; uniform vec3 cR, cY, cB, cK, cPaper;
  out vec4 o;
  float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  vec2 toPage(vec2 s){ return (uInv * vec3(s, 1.)).xy; }
  float plate(int k, vec2 frag, vec2 off, vec2 shift){
    vec2 sp = frag - off;
    vec2 uv = sp / uR;
    vec4 tx = texture(uP, uv);
    float d = k == 0 ? tx.r : (k == 1 ? tx.g : tx.b);
    if (d < .02) return 0.;
    vec2 pp = toPage(sp);
    // ink unevenness (page space, fixed to paper)
    float nz = vn(pp * .02 + uSeed) * .6 + vn(pp * .09 + uSeed * 1.7) * .4;
    if (d > .965) return clamp(1. - uRough * smoothstep(.72, .98, nz) * .5, 0., 1.);
    d = clamp(d * uGain + uAdd, 0., 1.);
    const float c45 = .70710678;
    vec2 q = mat2(c45, -c45, c45, c45) * pp / uCell + shift;
    // true round Ben-Day dots: circles on the lattice (d<=.5), round holes at the lattice corners (d>.5)
    float jit = (vn(pp * 1.1 + uSeed) - .5) * .035;
    vec2 g1 = fract(q) - .5, g2 = fract(q + .5) - .5;
    float dc = length(g1) + jit, dk = length(g2) + jit;
    float fw = max(fwidth(q.x) + fwidth(q.y), 1e-4) * .55;
    float cov;
    if (d <= .5) { float r = sqrt(d / 3.14159265); cov = 1. - smoothstep(r - fw, r + fw, dc); }
    else { float r = sqrt((1. - d) / 3.14159265); cov = smoothstep(r - fw, r + fw, dk); }
    float cellPx = uCell * uZoom;
    return mix(d, cov, smoothstep(2.2, 4.5, cellPx));
  }
  void main(){
    vec2 frag = gl_FragCoord.xy; frag.y = uR.y - frag.y;   // top-left origin like canvas
    vec2 pp = toPage(frag);
    vec3 paper = cPaper;
    float fib = vn(pp * .35 + 3.1) * .55 + vn(pp * 1.7 + 7.7) * .3 + h21(floor(pp * 3.)) * .15;
    paper *= 1. - .035 * fib - uAge * (.05 + .06 * vn(pp * .004 + 1.3));
    paper = mix(paper, paper * vec3(1., .96, .86), uAge * .6);
    float r = plate(0, frag, uOff0, vec2(0., 0.));
    float y = plate(1, frag, uOff1, vec2(.5, .0));
    float b = plate(2, frag, uOff2, vec2(.5, .5));
    r *= uMask.x; y *= uMask.y; b *= uMask.z;
    vec3 col = paper * mix(vec3(1.), cR, r) * mix(vec3(1.), cY, y) * mix(vec3(1.), cB, b);
    vec2 uv = frag / uR;
    vec4 sp = texture(uS, uv);
    col = mix(col, sp.rgb / max(sp.a, 1e-4), sp.a);
    float k = texture(uL, uv).a;
    float kn = 1. - uRough * .04 * smoothstep(.8, .98, vn(pp * .05 + 9.) );
    col = mix(col, cK, k * kn * uMask.w);
    o = vec4(col, 1.);
  }`;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const tex = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const tP = tex(0), tL = tex(1), tS = tex(2);
  gl.uniform1i(U('uP'), 0); gl.uniform1i(U('uL'), 1); gl.uniform1i(U('uS'), 2);
  const c3 = a => a.map(v => v / 255);
  gl.uniform3fv(U('cR'), c3(INK.red)); gl.uniform3fv(U('cY'), c3(INK.yellow)); gl.uniform3fv(U('cB'), c3(INK.blue)); gl.uniform3fv(U('cK'), c3(INK.black)); gl.uniform3fv(U('cPaper'), c3(INK.paper));
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  // fx: {cell (page units), gain, add, off:[[x,y]x3] in PAGE units (scaled by zoom, clamped), seed, age, rough}
  pop.present = (fx = {}) => {
    gl.viewport(0, 0, W, H);
    const up = (u, t, c) => { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); };
    up(0, tP, cP); up(1, tL, cL); up(2, tS, cS);
    const inv = camM.inverse();
    gl.uniformMatrix3fv(U('uInv'), false, [inv.a, inv.b, 0, inv.c, inv.d, 0, inv.e, inv.f, 1]);
    gl.uniform2f(U('uR'), W, H);
    gl.uniform1f(U('uZoom'), cam.zoom);
    gl.uniform1f(U('uCell'), fx.cell ?? 5.6);
    gl.uniform1f(U('uGain'), fx.gain ?? 1);
    gl.uniform1f(U('uAdd'), fx.add ?? 0);
    gl.uniform1f(U('uSeed'), fx.seed ?? 1);
    gl.uniform1f(U('uAge'), fx.age ?? .12);
    gl.uniform1f(U('uRough'), fx.rough ?? .12);
    const offs = fx.off || [[0, 0], [1.2, -.8], [-1, 1]];
    const maxPx = fx.offMax ?? 7;
    ['uOff0', 'uOff1', 'uOff2'].forEach((n, k) => {
      let [ox, oy] = offs[k]; ox *= cam.zoom; oy *= cam.zoom;
      const m = Math.hypot(ox, oy); if (m > maxPx) { ox *= maxPx / m; oy *= maxPx / m; }
      gl.uniform2f(U(n), ox, oy);
    });
    const mk = fx.mask || [1, 1, 1, 1]; gl.uniform4f(U('uMask'), mk[0], mk[1], mk[2], mk[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  return pop;
}
