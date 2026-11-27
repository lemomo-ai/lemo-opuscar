// Editorial Explainer engine: one paper desk seen from above, a multiplane camera, torn paper pieces with real shadows,
// halftone cut-outs, a highlighter that multiplies onto the paper, pencil marks drawn by progress, and a text register for readcheck.
// Everything is a pure function of the arguments: no state is carried between frames.
import { clamp, lerp, seg, eo, mulberry, hash, TAU } from '/core/lib.js';

export const INK = '#161616', PAPER = '#FBFAF6', DESK = '#E7E0D1', HI = '#FFDC2E', COOL = '#7C93A6', GRAPH = '#F3F0E7';
export const GRAPHITE = 'rgba(30,30,34,.84)';
export const q12 = t => Math.floor(t * 12 + 1e-6) / 12;          // pieces move on twos; the camera never does

const FAM = { head: 'Archivo', serif: "'Source Serif'", mono: "'Plex Mono'", hand: 'Caveat' };

function paperTile() {                                            // fibres and specks, drawn once, tiled in world space
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), R = mulberry(77);
  for (let i = 0; i < 9000; i++) { x.fillStyle = R() < .5 ? `rgba(60,45,20,${.03 + R() * .05})` : `rgba(255,255,255,${.05 + R() * .08})`; x.fillRect(R() * 512, R() * 512, 1 + R() * 1.2, 1 + R() * 1.2); }
  for (let i = 0; i < 90; i++) {
    const px = R() * 512, py = R() * 512, a = R() * TAU, l = 8 + R() * 22;
    x.strokeStyle = R() < .5 ? 'rgba(70,55,30,.07)' : 'rgba(255,255,255,.12)'; x.lineWidth = .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + (R() - .5) * 8, py + Math.sin(a) * l * .5 + (R() - .5) * 8, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}

const tornCache = new Map();
function tornPath(w, h, a, seed) {                                // a = tear amplitude per edge [top, right, bottom, left]; 0 = a knife cut
  const key = [w, h, a, seed].join(); if (tornCache.has(key)) return tornCache.get(key);
  const p = new Path2D(), R = mulberry(seed * 9973 + 7), pts = [];
  const edge = (x0, y0, x1, y1, amp, nx, ny) => {
    const n = amp ? Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 13)) : 1;
    for (let i = 0; i < n; i++) { const u = i / n, j = amp && i ? (R() - .5) * 2 * amp : 0; pts.push([lerp(x0, x1, u) + nx * j, lerp(y0, y1, u) + ny * j]); }
  };
  edge(0, 0, w, 0, a[0], 0, 1); edge(w, 0, w, h, a[1], 1, 0); edge(w, h, 0, h, a[2], 0, 1); edge(0, h, 0, 0, a[3], 1, 0);
  pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath();
  tornCache.set(key, p); return p;
}

// ---- pencil geometry: every generator returns a polyline; pencil() draws the first fraction of its length ----
export function wob(x0, y0, x1, y1, seed = 1, amp = 3) {          // a ruled-by-hand line
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / 46)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, j = (hash(seed * 13.7 + i * 3.1) - .5) * 2 * amp * Math.sin(u * Math.PI); pts.push([lerp(x0, x1, u) + nx * j, lerp(y0, y1, u) + ny * j]); }
  return pts;
}
export function ring(cx, cy, rx, ry, seed = 1) {                   // a circle drawn in one go: it overshoots and doesn't close exactly
  const pts = [], a0 = -2.1 + hash(seed) * .6;
  for (let i = 0; i <= 44; i++) { const u = i / 44, a = a0 + u * TAU * 1.09, k = 1 + .05 * Math.sin(u * 7 + seed) - u * .07; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
export function curve(x0, y0, cx, cy, x1, y1, head = 0) {          // a quadratic arrow; head = length of the two barbs
  const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, v = 1 - u; pts.push([v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1]); }
  if (head) { const a = Math.atan2(y1 - cy, x1 - cx); pts.push([x1 - Math.cos(a - .5) * head, y1 - Math.sin(a - .5) * head], [x1, y1], [x1 - Math.cos(a + .5) * head, y1 - Math.sin(a + .5) * head]); }
  return pts;
}

export function makeDesk(g, W, H) {
  const cam = { cx: W / 2, cy: H / 2, s: 1, r: 0 }, K = .0007;      // K: how much one unit of height enlarges a layer (the parallax)
  const pat = g.createPattern(paperTile(), 'repeat'), busts = [];
  let reg = [];

  const setCam = c => { cam.cx = c[0]; cam.cy = c[1]; cam.s = c[2]; cam.r = c[3] || 0; reg = []; };
  // the one world → screen function: every layer, shadow and text box goes through it
  function world(z = 0) { const k = cam.s * (1 + z * K); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(cam.r); g.scale(k, k); g.translate(-cam.cx, -cam.cy); }
  const screen = () => g.setTransform(1, 0, 0, 1, 0, 0);
  function shadow(z) { g.shadowColor = 'rgba(46,34,14,.32)'; g.shadowBlur = (4 + z * .5) * cam.s; g.shadowOffsetX = z * .28 * cam.s; g.shadowOffsetY = z * .42 * cam.s; }
  function noShadow() { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0; }
  const inView = (x, y, w, h, m = 200) => { const hw = W / 2 / cam.s + m, hh = H / 2 / cam.s + m; return x < cam.cx + hw && x + w > cam.cx - hw && y < cam.cy + hh && y + h > cam.cy - hh; };

  function ground() { world(0); g.fillStyle = DESK; g.fillRect(-3000, -3000, 12000, 9000); g.globalAlpha = .7; g.fillStyle = pat; g.fillRect(-3000, -3000, 12000, 9000); g.globalAlpha = 1; }

  // a paper piece: o = {x, y, w, h, rot, z, fill, torn, seed, grid, sc}; draw(g) paints its contents in the piece's own coordinates
  function piece(o, draw) {
    if (!o || !inView(o.x, o.y, o.w, o.h, 400)) return;
    g.save(); world(o.z); g.translate(o.x + o.w / 2, o.y + o.h / 2); g.rotate(o.rot || 0); if (o.sc) g.scale(o.sc, o.sc); g.translate(-o.w / 2, -o.h / 2);
    const p = tornPath(o.w, o.h, o.torn || [0, 0, 0, 0], o.seed || 1);
    shadow(o.z); g.fillStyle = o.fill || PAPER; g.fill(p); noShadow();
    g.clip(p);
    if (o.grid) {
      g.lineWidth = 1;
      for (let i = 0, x = 0; x <= o.w; x += o.grid, i++) { g.strokeStyle = `rgba(124,147,166,${i % 5 ? .22 : .42})`; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, o.h); g.stroke(); }
      for (let i = 0, y = 0; y <= o.h; y += o.grid, i++) { g.strokeStyle = `rgba(124,147,166,${i % 5 ? .22 : .42})`; g.beginPath(); g.moveTo(0, y); g.lineTo(o.w, y); g.stroke(); }
    }
    if (draw) draw(g);
    g.restore();
  }
  // a piece arriving: lifted, offset and turned, it lands on twos. Returns null before t0
  function enter(o, t, t0, from = {}) {
    const p = eo(seg(q12(t), t0, t0 + (from.dur || .42))); if (q12(t) < t0) return null;
    return { ...o, x: o.x + (from.dx || 0) * (1 - p), y: o.y + (from.dy || 0) * (1 - p), rot: (o.rot || 0) + (from.rot || 0) * (1 - p), z: o.z + 46 * (1 - p) };
  }

  // text in the current coordinates. o = {f: head|serif|mono|hand, size, w (weight), st (stretch), it, color, align, ls, id, pass}
  function setFont(o) { g.font = `${o.it ? 'italic ' : ''}${o.w || 500} ${o.size}px ${FAM[o.f || 'serif']}`; g.fontStretch = o.st || 'normal'; g.letterSpacing = (o.ls || 0) + 'px'; }
  function width(str, o) { setFont(o); return g.measureText(str).width; }
  function text(str, x, y, o) {
    setFont(o); g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = o.color || INK; g.fillText(str, x, y);
    if (o.id) { const w = g.measureText(str).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; note(o.id, o.txt || str, x0, y - o.size * .74, x0 + w, y + o.size * .08, o.pass); }
    g.letterSpacing = '0px'; g.fontStretch = 'normal';
  }
  function note(id, txt, x0, y0, x1, y1, pass) {
    const m = g.getTransform(), P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const e = { id, text: txt, x0: Math.min(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), x1: Math.max(...P.map(p => p[0])), y1: Math.max(...P.map(p => p[1])) };
    if (pass) e.pass = true; reg.push(e);
  }

  // highlighter: one pass of a chisel tip, left to right, multiplied onto whatever is under it. p = 0..1
  function highlight(x, y, w, hh, p, seed = 1, color = HI) {
    if (p <= 0) return; p = clamp(p);
    const R = mulberry(seed * 31 + 5), n = Math.max(2, Math.round(w / 24)), xe = x + w * p, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const xx = x + w * i / n, jt = (R() - .5) * hh * .12, jb = (R() - .5) * hh * .12, sl = (i / n) * hh * .07;
      if (xx <= xe) { top.push([xx, y + jt - sl]); bot.push([xx, y + hh + jb - sl]); }
    }
    const sl = p * hh * .07; top.push([xe + hh * .10, y - sl + hh * .08]); bot.push([xe + hh * .03, y + hh - sl]);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.globalAlpha = .92;
    g.beginPath(); g.moveTo(x - hh * .10, y + hh * .12); top.forEach(q => g.lineTo(q[0], q[1])); bot.reverse().forEach(q => g.lineTo(q[0], q[1])); g.lineTo(x - hh * .04, y + hh * .96); g.closePath(); g.fill();
    g.globalAlpha = .28; g.fillRect(x, y + hh * .58, (xe - x) * .96, hh * .16);          // the streak where the tip pressed harder
    g.restore();
  }
  // pencil: the first fraction p of a polyline, drawn twice a hair apart so it reads as graphite, not as a vector
  function pencil(pts, p, o = {}) {
    if (p <= 0 || pts.length < 2) return; p = clamp(p);
    let total = 0; const len = [0]; for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); len.push(total); }
    const stop = total * p;
    g.save(); g.lineCap = g.lineJoin = 'round'; if (o.multiply) g.globalCompositeOperation = 'multiply';
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = o.color || GRAPHITE; g.lineWidth = (o.w || 2.6) * (k ? .55 : 1); g.globalAlpha = (o.a || 1) * (k ? .45 : 1);
      g.beginPath(); g.moveTo(pts[0][0] + k * .9, pts[0][1] - k * .7);
      for (let i = 1; i < pts.length; i++) {
        if (len[i] <= stop) g.lineTo(pts[i][0] + k * .9, pts[i][1] - k * .7);
        else { const u = (stop - len[i - 1]) / (len[i] - len[i - 1]); g.lineTo(lerp(pts[i - 1][0], pts[i][0], u) + k * .9, lerp(pts[i - 1][1], pts[i][1], u) - k * .7); break; }
      }
      g.stroke();
    }
    g.restore();
  }

  // ---- halftone cut-outs: a bust per person, built once as a sprite (white cut margin + dots whose size is the tone) ----
  function dots(x, path, tone, pitch = 7) {
    x.save(); x.clip(path); x.fillStyle = '#F1EEE6'; x.fillRect(0, 0, 240, 280); x.fillStyle = INK;
    for (let u = -60; u < 80; u++) for (let v = -10; v < 80; v++) {
      const px = (u + v) * pitch * .7071, py = (v - u) * pitch * .7071; if (px < -8 || px > 248 || py < -8 || py > 288) continue;
      const k = clamp(tone * (.72 + .5 * (px + py) / 480)), r = pitch * .72 * Math.sqrt(k); if (r > .4) { x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
    }
    x.restore();
  }
  function makeBust(i) {
    const S = 2, c = document.createElement('canvas'); c.width = 240 * S; c.height = 280 * S; const x = c.getContext('2d'); x.scale(S, S);
    const v = i % 5, P = () => new Path2D(), parts = [];
    const sh = P(); sh.moveTo(26, 268); sh.bezierCurveTo(26, 204, 62, 176, 120, 176); sh.bezierCurveTo(178, 176, 214, 204, 214, 268); sh.closePath();
    const neck = P(); neck.rect(102, 138, 36, 46);
    const head = P(); head.ellipse(120, 100, 44, 50, 0, 0, TAU);
    const hair = P();
    if (v === 0) { hair.ellipse(120, 88, 49, 44, 0, Math.PI, TAU); hair.closePath(); }
    if (v === 1) hair.ellipse(120, 108, 57, 64, 0, 0, TAU);
    if (v === 2) { hair.ellipse(120, 86, 48, 42, 0, Math.PI, TAU); hair.closePath(); hair.moveTo(138, 36); hair.arc(120, 36, 18, 0, TAU); }
    if (v === 4) { hair.ellipse(104, 80, 44, 38, -.3, Math.PI * .9, TAU * 1.02); hair.closePath(); }
    const tHair = .95, tHead = .16 + .14 * hash(i * 7.3), tSh = .42 + .45 * hash(i * 3.7);
    if (v === 1) parts.push([hair, tHair]);
    parts.push([sh, tSh], [neck, tHead + .14], [head, tHead]);
    if (v !== 1 && v !== 3) parts.push([hair, tHair]);
    x.lineJoin = 'round'; x.strokeStyle = x.fillStyle = '#FFFFFF'; x.lineWidth = 20;
    parts.forEach(([p]) => { x.stroke(p); x.fill(p); });                       // the scissors' white margin
    parts.forEach(([p, tone]) => dots(x, p, tone));
    return c;
  }
  // draw person i: (x, y) is the bottom centre, hgt its height on the desk
  function bust(i, x, y, hgt, o = {}) {
    if (!inView(x - hgt, y - hgt, hgt * 2, hgt * 2)) return;
    const c = busts[i] || (busts[i] = makeBust(i)), w = hgt * 240 / 280, sc = o.sc == null ? 1 : o.sc; if (sc <= 0) return;
    g.save(); world(o.z || 30); g.translate(x, y); g.rotate(o.rot || 0); g.scale(sc, sc); shadow(o.z || 30); g.drawImage(c, -w / 2, -hgt, w, hgt); g.restore();
  }
  // a cut-out popping onto the desk on twos: too big, too small, right
  const pop = (t, t0) => { const f = Math.floor((q12(t) - t0) * 12 + 1e-6); return f < 0 ? 0 : [1.2, .94, 1][Math.min(f, 2)]; };

  function tape(x, y, w, rot, z = 20) { g.save(); world(z + 2); g.translate(x, y); g.rotate(rot); g.fillStyle = 'rgba(226,208,160,.78)'; g.fillRect(-w / 2, -17, w, 34); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-w / 2, -17, w, 8); g.restore(); }

  function finish() {                                               // screen space: the lamp's fall-off
    screen(); const v = g.createRadialGradient(W * .46, H * .44, H * .35, W * .5, H * .5, H * 1.05);
    v.addColorStop(0, 'rgba(60,45,20,0)'); v.addColorStop(1, 'rgba(60,45,20,.24)');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = v; g.fillRect(0, 0, W, H); g.restore();
  }

  return { cam, setCam, world, screen, shadow, noShadow, inView, ground, piece, enter, text, width, note, highlight, pencil, bust, pop, tape, finish, texts: () => reg };
}
