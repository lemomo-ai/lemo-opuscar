// kit.js: drawing parts for Manga Panels (Canvas 2D): panels, screentone, line tone, focus lines, speed lines, sound-effect lettering, white outline (shiro-fuchi), focus box, caption boxes, speech balloons, camera.
// Every part is deterministic (seeded random), so any frame can be rendered on its own.
export const W = 1920, H = 1080;
export const PAPER = '#F3F0E8', INK = '#121212', ACC = '#F03C1E';
export const cv = document.getElementById('out');
export const X = cv.getContext('2d');

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const eo = t => 1 - Math.pow(1 - t, 3);
export const ei = t => t * t * t;
export const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const back = (t, s = 2.2) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const hash = n => rng(n * 7919 + 13)();
export const boil = (t, fps = 12) => Math.floor(t * fps);     // line "boil": redrawn fps times per second

// ── Assets ──
export const IMG = {};
export function load(n) { return new Promise(r => { const im = new Image(); im.onload = () => { IMG[n] = im; r(); }; im.onerror = () => { console.warn('missing', n); r(); }; im.src = `img/${n}.png`; }); }

// white outline (shiro-fuchi): when a figure / product overlaps the panel border (breaking the frame) it gets a ring of paper white + a thin ink line, precomposited
export function halo(im, r = 12) {
  const c = document.createElement('canvas'); c.width = im.width + r * 2; c.height = im.height + r * 2;
  const g = c.getContext('2d');
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.drawImage(im, r + Math.cos(a) * r, r + Math.sin(a) * r); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = PAPER; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over'; g.drawImage(im, r, r);
  const o = document.createElement('canvas'); o.width = c.width + 6; o.height = c.height + 6;
  const h = o.getContext('2d');
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; h.drawImage(c, 3 + Math.cos(a) * 3, 3 + Math.sin(a) * 3); }
  h.globalCompositeOperation = 'source-in'; h.fillStyle = INK; h.fillRect(0, 0, o.width, o.height);
  h.globalCompositeOperation = 'source-over'; h.drawImage(c, 3, 3);
  o.pad = r + 3; o.src0 = im; return o;
}

// ── Screentone (code-generated tone sheets), cached by key ──
const TONES = {};
export function tone(key, w, h, fn, cell = 9, ang = 45) {
  if (TONES[key]) return TONES[key];
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const g = c.getContext('2d'); g.fillStyle = INK;
  const a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(w, h);
  for (let i = -R / cell; i < R / cell; i++) for (let j = -R / cell; j < R / cell; j++) {
    const px = w / 2 + (i * ca - j * sa) * cell, py = h / 2 + (i * sa + j * ca) * cell;
    if (px < -cell || py < -cell || px > w + cell || py > h + cell) continue;
    const v = clamp(fn(px / w, py / h), 0, 1); if (v < .03) continue;
    const r = cell * Math.sqrt(v / Math.PI) * 1.05;
    g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
  }
  TONES[key] = c; return c;
}
// line tone (parallel-line screentone)
export function lineTone(key, w, h, fn, gap = 7, ang = -20) {
  if (TONES[key]) return TONES[key];
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const g = c.getContext('2d'); g.strokeStyle = INK;
  const a = ang * Math.PI / 180, R = Math.hypot(w, h);
  g.translate(w / 2, h / 2); g.rotate(a);
  for (let y = -R; y < R; y += gap) for (let x = -R; x < R; x += 24) {
    const ux = (x * Math.cos(a) - y * Math.sin(a)) / w + .5, uy = (x * Math.sin(a) + y * Math.cos(a)) / h + .5;
    const v = clamp(fn(ux, uy), 0, 1); if (v < .03) continue;
    g.lineWidth = v * gap * .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24.5, y); g.stroke();
  }
  TONES[key] = c; return c;
}

// ── Paper texture ──
let GRAIN;
export function makeGrain() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d'); const d = g.createImageData(512, 512); const r = rng(5);
  for (let i = 0; i < d.data.length; i += 4) { const v = 200 + r() * 55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); GRAIN = X.createPattern(c, 'repeat');
}
export function grain() { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalCompositeOperation = 'multiply'; X.globalAlpha = .1; X.fillStyle = GRAIN; X.fillRect(0, 0, W, H); X.restore(); }

// ── Text registry (window.TEXTS for readcheck): boxes mapped to screen coords under the current transform ──
export const TX = [];
export function reg(id, text, x0, y0, x1, y1) {
  const m = X.getTransform();
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  TX.push({ id, text, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
}

// ── Polygons / panels ──
export function path(pts) { X.beginPath(); X.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) X.lineTo(pts[i][0], pts[i][1]); X.closePath(); }
export function bbox(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
// a panel: not drawn while t < tin; from tin it "inks in" (wipes open) along dir over 0.1 s, content slamming in from dir; o.dash = dashed border (blank panel)
export function panel(t, pts, tin, dir, draw, o = {}) {
  if (t < tin) return;
  const k = eo(seg(t, tin, tin + .1)), k2 = seg(t, tin, tin + .22);
  const [x0, y0, x1, y1] = bbox(pts), w = x1 - x0, h = y1 - y0;
  X.save();
  path(pts); X.clip();
  X.beginPath();
  if (dir === 'L') X.rect(x1 - w * k - 2, y0 - 2, w * k + 4, h + 4);
  else if (dir === 'R') X.rect(x0 - 2, y0 - 2, w * k + 4, h + 4);
  else if (dir === 'D') X.rect(x0 - 2, y0 - 2, w + 4, h * k + 4);
  else X.rect(x0 - 2, y1 - h * k - 2, w + 4, h * k + 4);
  X.clip();
  X.fillStyle = o.bg || PAPER; X.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  const sl = (1 - eo(k2)) * (o.slam ?? 60);
  X.save(); X.translate(dir === 'L' ? sl : dir === 'R' ? -sl : 0, dir === 'D' ? -sl : dir === 'U' ? sl : 0);
  draw(x0, y0, w, h, t - tin);
  X.restore();
  X.restore();
  if (k > .02 && !o.noLine) {
    X.save(); path(pts); X.lineJoin = 'miter'; X.lineWidth = o.lw || 7; X.strokeStyle = o.line || INK;
    if (o.dash) { X.setLineDash(o.dash); X.lineDashOffset = o.dashOff || 0; }
    X.stroke(); X.restore();
  }
}
export function frame(pts, lw = 7, col = INK) { X.save(); path(pts); X.lineJoin = 'miter'; X.lineWidth = lw; X.strokeStyle = col; X.stroke(); X.restore(); }

// image: placed with its relative point (u, v) at (ax, ay), scaled to "display height hgt" (halo versions subtract the outer ring automatically)
export function put(n, u, v, ax, ay, hgt, rot = 0, o = {}) {
  const im = typeof n === 'string' ? IMG[n] : n; if (!im) return;
  const src = im.src0 || im, pad = im.pad || 0;
  const s = hgt / src.height;
  X.save(); if (o.a != null) X.globalAlpha = o.a;
  X.translate(ax, ay); X.rotate(rot); X.scale(s * (o.flip ? -1 : 1), s);
  X.drawImage(im, -u * src.width - pad, -v * src.height - pad);
  X.restore();
}
// image filling a box (cover), with optional focus point (fu, fv) and extra scale / offset
export function cover(n, x0, y0, w, h, o = {}) {
  const im = IMG[n]; if (!im) return;
  const s = Math.max(w / im.width, h / im.height) * (o.z || 1);
  const iw = im.width * s, ih = im.height * s;
  const fu = o.fu ?? .5, fv = o.fv ?? .5;
  let x = x0 + w / 2 - iw * fu + (o.dx || 0), y = y0 + h / 2 - ih * fv + (o.dy || 0);
  x = clamp(x, x0 + w - iw, x0); y = clamp(y, y0 + h - ih, y0);
  X.drawImage(im, x, y, iw, ih);
}

// where the image's relative point (u, v) lands on the page after cover()
export function coverPt(n, x0, y0, w, h, o, u, v) {
  const im = IMG[n]; if (!im) return [x0 + w / 2, y0 + h / 2];
  const s = Math.max(w / im.width, h / im.height) * (o.z || 1), iw = im.width * s, ih = im.height * s;
  const x = clamp(x0 + w / 2 - iw * (o.fu ?? .5) + (o.dx || 0), x0 + w - iw, x0), y = clamp(y0 + h / 2 - ih * (o.fv ?? .5) + (o.dy || 0), y0 + h - ih, y0);
  return [x + u * iw, y + v * ih];
}

// ── Focus lines / burst (uni-flash) / speed lines ──
export function focus(cx, cy, rx, ry, n, seed, col = INK, wmax = 9, rout = 1700) {
  const r = rng(seed); X.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, k = .85 + r() * .55, w = (r() ** 2) * wmax + .8;
    const ix = cx + Math.cos(a) * rx * k, iy = cy + Math.sin(a) * ry * k;
    const ox = cx + Math.cos(a) * rout, oy = cy + Math.sin(a) * rout;
    const px = -Math.sin(a) * w, py = Math.cos(a) * w;
    X.beginPath(); X.moveTo(ix, iy); X.lineTo(ox + px, oy + py); X.lineTo(ox - px, oy - py); X.closePath(); X.fill();
  }
}
export function speed(x0, y0, w, h, ang, n, seed, t, v = 2400, col = INK, wmax = 4) {
  const r = rng(seed); X.save(); X.fillStyle = col;
  X.translate(x0 + w / 2, y0 + h / 2); X.rotate(ang);
  const L = Math.hypot(w, h);
  for (let i = 0; i < n; i++) {
    const y = (r() - .5) * L, len = 200 + r() * 700, ww = r() * wmax + .6;
    const x = ((r() * L * 2 + t * v * (.7 + r() * .6)) % (L * 2)) - L;
    X.beginPath(); X.moveTo(x - len / 2, y); X.lineTo(x, y - ww); X.lineTo(x + len / 2, y); X.lineTo(x, y + ww); X.closePath(); X.fill();
  }
  X.restore();
}
// concentric effect lines (heartbeat / impact): rings of broken arcs
export function rings(cx, cy, r0, n, gap, seed, col = INK, lw = 4) {
  const r = rng(seed); X.save(); X.strokeStyle = col; X.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const R = r0 + i * gap; X.lineWidth = lw * (1 - i / n * .6);
    for (let a = r() * .5; a < Math.PI * 2; a += .35 + r() * .5) { X.beginPath(); X.arc(cx, cy, R, a, a + .2 + r() * .35); X.stroke(); }
  }
  X.restore();
}
// corner sparkle (white star, inked edge)
export function star(x, y, R, rot = 0, col = PAPER, edge = INK) {
  X.save(); X.translate(x, y); X.rotate(rot);
  X.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = i % 2 ? R * .16 : R; X.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  X.closePath(); X.fillStyle = col; X.fill(); if (edge) { X.lineWidth = Math.max(1.5, R * .06); X.strokeStyle = edge; X.stroke(); }
  X.restore();
}

// ── Sound-effect lettering: per-glyph rotation and offset, triple stroke; glyphs scale up and bounce back when slammed in; 12 jitters per second (boil) ──
// o.font: typeface (default Dela); o.path: layout direction; o.frozen: stop boiling
export function sfx(t, txt, x, y, size, tin, o = {}) {
  if (t < tin) return null;
  const chars = [...txt], r = rng(o.seed || 1), jit = rng((o.frozen ? 0 : boil(t)) * 7 + (o.seed || 1));
  const rot = o.rot || 0, sp = o.sp ?? .82, dirX = Math.cos(rot + (o.path || 0)), dirY = Math.sin(rot + (o.path || 0));
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  X.save(); X.textAlign = 'center'; X.textBaseline = 'middle'; X.lineJoin = 'round';
  let pos = 0;
  chars.forEach((c, i) => {
    if (c === ' ') { pos += o.spaceW ?? .55; return; }
    const ti = tin + i * (o.stag ?? .03); const p = pos; pos += 1;
    const cx = x + dirX * p * size * sp, cy = y + dirY * p * size * sp;
    bx0 = Math.min(bx0, cx - size * .55); bx1 = Math.max(bx1, cx + size * .55); by0 = Math.min(by0, cy - size * .6); by1 = Math.max(by1, cy + size * .6);
    if (t < ti) return;
    const k = seg(t, ti, ti + .13), s = lerp(o.from ?? 1.9, 1, back(k, 1.6)) * (o.sc ? o.sc[i] || 1 : (.88 + r() * .3));
    const lr = (r() - .5) * (o.wob ?? .38) + rot, ox = (r() - .5) * size * .12, oy = (r() - .5) * size * .18;
    const jx = (jit() - .5) * 3, jy = (jit() - .5) * 3;
    const small = /[ッィャュ]/.test(c) ? .62 : /ョ/.test(c) ? .8 : 1;
    const fs = size * s * small;
    X.save();
    X.translate(cx + ox + jx, cy + oy + jy + (small < 1 ? size * .18 : 0));
    X.rotate(lr); X.font = o.font ? o.font.replace('$', fs) : `${fs}px Dela`;
    X.strokeStyle = o.outer || INK; X.lineWidth = fs * (o.ow ?? .34); X.strokeText(c, 0, 0);
    X.strokeStyle = o.rim || PAPER; X.lineWidth = fs * (o.rw ?? .27); X.strokeText(c, 0, 0);
    X.fillStyle = o.fill || INK; X.fillText(c, 0, 0);
    X.restore();
  });
  X.restore();
  return [bx0, by0, bx1, by1];
}
// plain text (brand / specs / colophon), optional white stroke, slams in; registered in TEXTS
export function text(t, s, x, y, size, tin, o = {}) {
  if (t < tin) return;
  const k = seg(t, tin, tin + (o.dur || .14));
  const sc = o.noPop ? 1 : lerp(1.45, 1, back(k, 1.4));
  X.save(); X.translate(x, y); X.rotate(o.rot || 0); X.scale(sc, sc);
  X.globalAlpha = o.noPop ? eo(k) : 1;
  X.font = `${o.w || 900} ${size}px ${o.f || 'SansSC'}`; X.textAlign = o.align || 'left'; X.textBaseline = 'alphabetic';
  X.letterSpacing = (o.ls || 0) + 'px';
  if (o.rim) { X.lineJoin = 'round'; X.strokeStyle = o.rim; X.lineWidth = o.rimW || size * .2; X.strokeText(s, 0, 0); }
  X.fillStyle = o.col || INK; X.fillText(s, 0, 0);
  if (o.id && k >= 1) {
    const wd = X.measureText(s).width, ax = o.align === 'center' ? -wd / 2 : o.align === 'right' ? -wd : 0;
    reg(o.id, s, ax, -size * .9, ax + wd, size * .22);
  }
  X.letterSpacing = '0px';
  X.restore();
}
// focus box (accent colour): four corner brackets
export function afBox(cx, cy, w, h, col = ACC, lw = 7) {
  const c = Math.min(w, h) * .28; X.save(); X.strokeStyle = col; X.lineWidth = lw; X.lineCap = 'square';
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * w / 2, y = cy + sy * h / 2;
    X.beginPath(); X.moveTo(x - sx * c, y); X.lineTo(x, y); X.lineTo(x, y - sy * c); X.stroke();
  }
  X.restore();
}

// ── Lyrics: vertical caption box (verse / pre-chorus): space = new column, right column read first; glyphs ink in one by one ──
export function narration(t, id, txt, t0, t1, xr, y, o = {}) {
  if (t < t0 - .03 || t > t1) return;
  const size = o.size || 58, cols = txt.split(' '), colW = size * 1.18, pad = size * .42;
  const maxN = Math.max(...cols.map(c => [...c].length));
  const w = cols.length * colW - (colW - size) + pad * 2, h = maxN * size * 1.06 + pad * 2;
  const k = back(seg(t, t0 - .03, t0 + .12), 1.6);
  X.save(); X.translate(xr - w / 2, y + h / 2); X.scale(lerp(.7, 1, k), lerp(.7, 1, k)); X.rotate(o.rot || 0); X.translate(-w / 2, -h / 2);
  X.fillStyle = INK; X.fillRect(9, 9, w, h);
  X.fillStyle = PAPER; X.fillRect(0, 0, w, h);
  X.lineWidth = 5; X.strokeStyle = INK; X.strokeRect(0, 0, w, h);
  X.font = `900 ${size}px SerifSC`; X.fillStyle = INK; X.textAlign = 'center'; X.textBaseline = 'middle';
  const total = [...txt.replace(/ /g, '')].length, rev = Math.min(.8, (t1 - t0) * .35);
  let n = 0;
  cols.forEach((c, ci) => {
    [...c].forEach((ch, i) => {
      const ti = t0 + n / total * rev; n++;
      if (t < ti) return;
      const kk = eo(seg(t, ti, ti + .08));
      X.globalAlpha = kk;
      X.fillText(ch, w - pad - size / 2 - ci * colW, pad + size * .53 + i * size * 1.06 + (1 - kk) * -10);
    });
  });
  X.globalAlpha = 1;
  reg(id, txt, 0, 0, w, h);
  X.restore();
}
// ── Lyrics: hand lettering (kaki-moji) for the chorus, shouted: big bold glyphs slam in one by one, triple stroke ──
export function shout(t, id, txt, t0, t1, x, y, size, o = {}) {
  if (t < t0 - .03 || t > t1) return;
  const n = [...txt.replace(/ /g, '')].length, stag = o.stag ?? Math.min(.11, (t1 - t0) * .3 / n);
  const bb = sfx(t, txt, x, y, size, t0 - .03, { font: '900 $px SansSC', stag, sp: o.sp ?? 1.02, rot: o.rot || 0, path: o.path || 0, seed: o.seed || 3, wob: o.wob ?? .16, from: 1.6, ow: .3, rw: .22, frozen: o.frozen, spaceW: .45 });
  if (bb) { X.save(); reg(id, txt, ...bb); X.restore(); }
}
// ── Speech balloon (vertical, right column read first) ──
export function balloon(t, id, txt, t0, t1, cx, cy, rx, ry, tail, o = {}) {
  if (t < t0 - .03 || t > t1) return;
  const k = back(seg(t, t0 - .03, t0 + .14), 1.5);
  X.save(); X.translate(cx, cy); X.scale(k, k);
  X.beginPath(); X.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  X.moveTo(tail[0], tail[1]); X.lineTo(tail[2], tail[3]); X.lineTo(tail[4], tail[5]);
  X.fillStyle = PAPER; X.fill(); X.lineWidth = 6; X.strokeStyle = INK; X.stroke();
  X.beginPath(); X.ellipse(0, 0, rx - 3, ry - 3, 0, 0, Math.PI * 2); X.fill();
  const size = o.size || 64, cols = txt.split(' '), colW = size * 1.2;
  X.font = `900 ${size}px SerifSC`; X.fillStyle = INK; X.textAlign = 'center'; X.textBaseline = 'middle';
  const maxN = Math.max(...cols.map(c => [...c].length));
  cols.forEach((c, ci) => {
    const xx = (cols.length - 1) / 2 * colW - ci * colW;
    [...c].forEach((ch, i) => {
      const yy = -(maxN - 1) / 2 * size * 1.06 + i * size * 1.06;
      X.fillText(ch === '，' ? '︐' : ch, xx, yy);
    });
  });
  reg(id, txt, -rx * .8, -ry * .8, rx * .8, ry * .8);
  X.restore();
}

// ── Camera: beat shake (exponential decay) + push / pull / pan ──
export const HITS = [];
export function shake(t) {
  let x = 0, y = 0;
  for (const [h, a] of HITS) { if (t < h || t > h + .5) continue; const e = Math.exp(-(t - h) / .07) * a; const r = rng(Math.floor(t * 60) + Math.floor(h * 1000)); x += (r() - .5) * 2 * e; y += (r() - .5) * 2 * e; }
  return [x, y];
}
export function cam(t, cx, cy, z, rot, fn) {
  const [sx, sy] = shake(t);
  X.save(); X.translate(W / 2 + sx, H / 2 + sy); X.rotate(rot); X.scale(z, z); X.translate(-cx, -cy); fn(); X.restore();
}
// impact frame (2 frames): white focus lines on black / black focus lines on white
export function flash(t, at, inv) {
  if (t < at || t >= at + 2 / 30) return false;
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.fillStyle = inv ? PAPER : INK; X.fillRect(0, 0, W, H);
  focus(W / 2, H / 2, 260, 170, 300, Math.floor(at * 10), inv ? INK : PAPER, 10, 1500);
  return true;
}
