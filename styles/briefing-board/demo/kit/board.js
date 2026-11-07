// Engineering Briefing Board kit v3: one continuous whiteboard wall, filmed.
// A scene is data (scenes/*.json): the board, a camera built from overlapping eased moves,
// and elements that live on the board:
//   prints   cut-out photos mounted a few mm off the board (real shadows, parallax, weight)
//   tags / magnets / ruler / card   physical things pinned to the board
//   ink      marker lines, dimension lines, hatching and marker lettering drawn ON the board
//   stamp    a rubber-stamp impression
// render(t) is deterministic: no state is carried from one frame to the next.
// Only the subtitles are screen-space.

const W = 1920, H = 1080;
const KIT = new URL('.', import.meta.url).pathname;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const ei = t => Math.pow(clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const settle = (t, f = 9, k = 4.5) => t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(f * t);
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// Beta ease: velocity ∝ u^a (1-u)^b. a = b = 2 is smootherstep. Position, velocity and
// acceleration are all zero at both ends (a, b ≥ 2), so overlapping moves add up to a
// path whose speed and acceleration never jump. a < b: quick start, long settle (inertia);
// a > b: slow wind-up, firm arrival.
const easeLUT = new Map();
export function bease(u, a = 2, b = 2) {
  if (u <= 0) return 0; if (u >= 1) return 1;
  const key = a + ',' + b; let L = easeLUT.get(key);
  if (!L) { const n = 2048; L = new Float64Array(n + 1); let s = 0; L[0] = 0;
    for (let i = 1; i <= n; i++) { const m = (i - .5) / n; s += Math.pow(m, a) * Math.pow(1 - m, b); L[i] = s; }
    for (let i = 0; i <= n; i++) L[i] /= s; easeLUT.set(key, L); }
  const f = u * 2048, i = Math.floor(f); return lerp(L[i], L[Math.min(2048, i + 1)], f - i);
}

// ---------------------------------------------------------------- theme
export const THEME = {
  enamel: '#F3F1EB', wall: '#8F8B83', frame: '#B9BCBF',
  graphite: '#23272E', blue: '#1F4FC8', red: '#D33A21', grey: '#6C727B', water: '#5F86DA',
  paper: '#FBFAF6', shadow: '30,26,20',
  magnet: { red: ['#E04A2F', '#A82813'], graphite: ['#4A4F57', '#202328'], blue: ['#3463D6', '#1A3C99'], white: ['#FFFFFF', '#D6D4CE'] },
};
const INK = c => ({ graphite: THEME.graphite, ink: THEME.graphite, blue: THEME.blue, red: THEME.red, grey: THEME.grey, water: THEME.water })[c] || c || THEME.graphite;
export const FONT = { marker: 'LXGW Marker Gothic', sc: 'Noto Sans SC', sans: 'Archivo', mono: 'Plex Mono' };

// ---------------------------------------------------------------- assets
const objCache = new Map();
async function loadObject(id) {
  if (objCache.has(id)) return objCache.get(id);
  const meta = await (await fetch(`${KIT}objects/${id}.json`)).json();
  const img = new Image(); img.src = `${KIT}objects/${id}.png`; await img.decode();
  // shadow sprite: the silhouette, pre-blurred (drawn scaled it stays physical)
  const k = Math.min(1, 1000 / Math.max(img.width, img.height)), pad = 40;
  const sw = Math.ceil(img.width * k), sh = Math.ceil(img.height * k);
  const sil = document.createElement('canvas'); sil.width = sw + pad * 2; sil.height = sh + pad * 2;
  const sx = sil.getContext('2d'); sx.filter = 'blur(4px)'; sx.drawImage(img, pad, pad, sw, sh); sx.filter = 'none';
  sx.globalCompositeOperation = 'source-in'; sx.fillStyle = `rgb(${THEME.shadow})`; sx.fillRect(0, 0, sil.width, sil.height);
  const o = { id, meta, img, sil, k, pad }; objCache.set(id, o); return o;
}
export async function loadFonts(sample = '') {
  const s = sample + '0123456789,.米';
  await Promise.all([
    document.fonts.load(`400 100px "${FONT.marker}"`, s), document.fonts.load(`500 40px "${FONT.sc}"`, s),
    document.fonts.load(`700 40px "${FONT.sc}"`, s), document.fonts.load(`900 40px "${FONT.sc}"`, s),
    document.fonts.load(`500 30px ${FONT.sans}`, 'Abc'), document.fonts.load(`600 30px ${FONT.sans}`, 'Abc'),
    document.fonts.load(`500 30px "${FONT.mono}"`, 'Abc'), document.fonts.load(`600 30px "${FONT.mono}"`, 'Abc'),
  ]);
}

// ---------------------------------------------------------------- board texture (procedural, deterministic)
let BOARD = null;
function buildBoard(b) {
  const s = b.texScale || .45, bw = Math.ceil(b.w * s), bh = Math.ceil(b.h * s), r = mulberry(b.seed || 3);
  const c = document.createElement('canvas'); c.width = bw; c.height = bh; const x = c.getContext('2d');
  x.fillStyle = THEME.enamel; x.fillRect(0, 0, bw, bh);
  // low-frequency tonal drift of the enamel
  const lo = document.createElement('canvas'); lo.width = 64; lo.height = 36; const lx = lo.getContext('2d');
  const id = lx.createImageData(64, 36);
  for (let i = 0; i < id.data.length; i += 4) { const v = 243 + (r() - .5) * 5; id.data[i] = v; id.data[i + 1] = v - 1.5; id.data[i + 2] = v - 5.5; id.data[i + 3] = 255; }
  lx.putImageData(id, 0, 0); x.globalAlpha = .55; x.imageSmoothingQuality = 'high'; x.drawImage(lo, 0, 0, bw, bh); x.globalAlpha = 1;
  // ghosts: faint remains of earlier marker work, mostly wiped by eraser swipes
  const g = document.createElement('canvas'); g.width = bw; g.height = bh; const gx = g.getContext('2d');
  const cols = ['38,44,55', '31,79,200', '211,58,33'];
  for (let i = 0; i < (b.ghosts ?? 90); i++) {
    const X = r() * bw, Y = r() * bh, col = cols[r() < .65 ? 0 : r() < .6 ? 1 : 2];
    gx.save(); gx.translate(X, Y); gx.rotate((r() - .5) * .14); gx.globalAlpha = .03 + r() * .05;
    gx.strokeStyle = `rgb(${col})`; gx.lineCap = 'round'; gx.lineJoin = 'round';
    const kind = r();
    if (kind < .32) { gx.lineWidth = 8 * s; gx.beginPath(); gx.moveTo(0, 0); for (let j = 0; j < 5; j++) gx.lineTo((j + 1) * (40 + r() * 60) * s, (r() - .5) * 90 * s); gx.stroke(); }
    else if (kind < .7) { gx.lineWidth = 8 * s; gx.beginPath(); gx.moveTo(0, 0); gx.lineTo((200 + r() * 700) * s, (r() - .5) * 60 * s); gx.stroke(); }
    else if (kind < .86) { gx.lineWidth = 7 * s; gx.strokeRect(0, 0, (150 + r() * 400) * s, (80 + r() * 200) * s); }
    else { gx.lineWidth = 7 * s; gx.beginPath(); gx.arc(0, 0, (40 + r() * 140) * s, 0, Math.PI * 2); gx.stroke(); }
    gx.restore();
  }
  gx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 170; i++) {
    const X = r() * bw, Y = r() * bh, len = (300 + r() * 900) * s, wd = (90 + r() * 170) * s;
    gx.save(); gx.translate(X, Y); gx.rotate((r() - .5) * .5); gx.globalAlpha = .45 + r() * .5; gx.filter = `blur(${10 * s}px)`;
    gx.fillStyle = '#000'; gx.beginPath(); gx.ellipse(0, 0, len / 2, wd / 2, 0, 0, Math.PI * 2); gx.fill(); gx.restore();
  }
  x.filter = `blur(${1.6 * s}px)`; x.drawImage(g, 0, 0); x.filter = 'none';
  // eraser haze and smudges
  for (let i = 0; i < 55; i++) {
    const X = r() * bw, Y = r() * bh, len = (400 + r() * 1200) * s, wd = (60 + r() * 130) * s;
    x.save(); x.translate(X, Y); x.rotate((r() - .5) * .35); x.globalAlpha = .022 + r() * .03; x.filter = `blur(${18 * s}px)`;
    x.fillStyle = '#8a8f96'; x.beginPath(); x.ellipse(0, 0, len / 2, wd / 2, 0, 0, Math.PI * 2); x.fill(); x.restore();
  }
  // fine speckle
  const im = x.getImageData(0, 0, bw, bh), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
  BOARD = { c, s, w: b.w, h: b.h };
}

// ---------------------------------------------------------------- scene, camera, projection
let scene = null, objs = {}, els = [], byId = {};
const D0 = 1700;   // camera distance at zoom 1, in board px: sets how strong parallax is
export async function setScene(s) {
  if (s.extends) {
    const base = await (await fetch(s.extends)).json();
    s = { ...base, ...s, elements: [...base.elements, ...(s.elements || [])], subs: s.subs ?? [] };
  }
  scene = s; objs = {}; byId = {};
  for (const e of s.elements) { if (e.id) byId[e.id] = e; if (e.type === 'print') objs[e.id] = await loadObject(e.src); }
  for (const e of s.elements) if (e.type === 'stamp') e._tex = stampTexture(e);
  BOARD = null; buildBoard(s.board || { w: 6400, h: 3600 });
  els = s.elements;
  return s;
}
const D2R = Math.PI / 180;
// camera = base + sum of eased moves + impact shakes + a hand-held breath (a sum of slow sines,
// so it is smooth to every derivative)
export function camAt(t) {
  const C = scene.cam;
  let x = C.x, y = C.y, lz = Math.log(C.z), roll = C.roll || 0;
  for (const m of C.moves || []) {
    if (t <= m.t) continue;
    const u = bease(seg(t, m.t, m.t + m.d), m.a ?? 2, m.b ?? 2);
    x += (m.dx || 0) * u; y += (m.dy || 0) * u; lz += (m.dl || 0) * u; roll += (m.dr || 0) * u;
  }
  let dx = 0, dy = 0;
  for (const s of C.shakes || []) {
    const tau = t - s.t; if (tau <= 0 || tau > 1.5) continue;
    const on = 1 - Math.exp(-tau / .012), v = (s.amp || 6) * on * Math.exp(-(s.k || 7) * tau) * Math.sin(2 * Math.PI * (s.f || 9) * tau);
    dx += v * (s.dir ? s.dir[0] : 0); dy += v * (s.dir ? s.dir[1] : 1); roll += v * (s.roll || 0);
  }
  const hd = scene.hand ?? 1;
  const sn = (f, p) => Math.sin(2 * Math.PI * f * t + p);
  dx += hd * (2.4 * sn(.21, 1.3) + 1.1 * sn(.43, 4.1) + .45 * sn(.83, 2.2));
  dy += hd * (1.8 * sn(.17, 5.2) + .9 * sn(.37, .4) + .35 * sn(.91, 3.3));
  roll += hd * (.07 * sn(.13, 2.6) + .03 * sn(.29, 1.1));
  return { x, y, zoom: Math.exp(lz), roll, dx, dy, focus: C.focus ?? 0, ap: C.ap ?? 0 };
}
const Pz = (c, z) => { const Dist = D0 / c.zoom; return Dist / Math.max(20, Dist - z); };
function setT(x, c, z, k) {
  const s = c.zoom * Pz(c, z);
  x.setTransform(k, 0, 0, k, 0, 0);
  x.translate(W / 2 + c.dx, H / 2 + c.dy); x.rotate(c.roll * D2R); x.scale(s, s); x.translate(-c.x, -c.y);
}
export function toScreen(p, z, t, c = camAt(t)) {
  const s = c.zoom * Pz(c, z), a = c.roll * D2R, dx = (p[0] - c.x) * s, dy = (p[1] - c.y) * s;
  return [W / 2 + c.dx + dx * Math.cos(a) - dy * Math.sin(a), H / 2 + c.dy + dx * Math.sin(a) + dy * Math.cos(a)];
}
export function toWorld(sp, t, c = camAt(t)) {   // screen → board (z = 0)
  const s = c.zoom * Pz(c, 0), a = -c.roll * D2R, dx = sp[0] - W / 2 - c.dx, dy = sp[1] - H / 2 - c.dy;
  return [c.x + (dx * Math.cos(a) - dy * Math.sin(a)) / s, c.y + (dx * Math.sin(a) + dy * Math.cos(a)) / s];
}
const LIGHT = [.45, .8];   // shadow offset per unit height (window light from the upper left)

// ---------------------------------------------------------------- element state at t
function motion(e, t) {
  let [X, Y] = e.xy || [0, 0], z = e.z ?? 10, rot = e.rot || 0, a = 1, vis = true, sc = 1;
  for (const m of e.moves || []) {   // eased travel along the board, same maths as the camera
    if (t <= m.t) continue; const u = bease(seg(t, m.t, m.t + m.d), m.a ?? 2, m.b ?? 2);
    X += (m.dx || 0) * u; Y += (m.dy || 0) * u; rot += (m.dr || 0) * u;
  }
  for (const j of e.jolts || []) {   // knocked by an impact: a quick displacement that springs back
    const tau = t - j.t; if (tau <= 0 || tau > 1) continue;
    const k = Math.exp(-(j.k || 9) * tau) * Math.sin(Math.min(1, tau / .03) * Math.PI / 2) * Math.cos(tau * (j.f || 22));
    X += (j.dx || 0) * k; Y += (j.dy || 0) * k; rot += (j.dr || 0) * k;
  }
  const A = e.arrive;
  if (A) {
    const d = A.d || .6, u = seg(t, A.t, A.t + d);
    if (t < A.t) vis = false;
    else if (A.kind === 'drop') {   // lowered onto the board from the camera side: lands, a small bounce, settles
      const zl = A.lift || 300, land = A.land || .55;
      if (u < land) z = z + zl * (1 - Math.pow(u / land, 2));
      else { const v = (u - land) / (1 - land); z = z + Math.sin(v * Math.PI) * zl * .035 * (1 - v); }
      a = clamp(u * 7); rot += (1 - eo(u)) * (A.spin ?? 2);
    } else if (A.kind === 'swing') {   // tags: snap on, swing about the pin, settle
      a = clamp(u * 8); rot += (A.amp ?? 12) * Math.exp(-4 * u * d) * Math.cos(11 * u * d) * (u < 1 ? 1 : 0);
      z += (1 - eo(clamp(u * 3))) * 60;
    } else if (A.kind === 'snap') {    // magnets: fast, a tiny overshoot into the board
      z += (1 - settle(u * d, 22, 9)) * (A.lift || 80); a = clamp(u * 10);
    } else if (A.kind === 'slide') {
      const [fx, fy] = A.from || [-1500, 0], k = bease(u, A.ea ?? 2, A.eb ?? 3);
      X += fx * (1 - k); Y += fy * (1 - k); rot += (1 - k) * (A.spin ?? 0);
    } else if (A.kind === 'fade') { a = clamp(u); }
  }
  const L = e.leave;
  if (L && t > L.t) {
    const u = seg(t, L.t, L.t + (L.d || .35));
    if (L.kind === 'pop') { z += ei(u) * (L.lift || 900); a = 1 - clamp((u - .45) / .55); const [tx, ty] = L.to || [0, -120]; X += tx * eo(u); Y += ty * eo(u); rot += (L.spin ?? 25) * u; }
    else { const [tx, ty] = L.to || [0, 2600], k = eio(u); X += tx * k; Y += ty * k; rot += (L.spin ?? 6) * k; }
    if (u >= 1) vis = false;
  }
  return { X, Y, z, rot, a, vis, sc };
}

// ---------------------------------------------------------------- prints (cut-out photos)
function printRect(e) {
  const o = objs[e.id], ar = o.img.width / o.img.height;
  const w = e.w || (e.h ? e.h * ar : 1200), h = w / ar;
  return { o, w, h };
}
export function anchor(id, name) {
  const e = byId[id]; const { o, w, h } = printRect(e);
  const an = name ? o.meta.anchors[name] : [.5, .5]; const [X, Y] = e.xy;
  const ax = e.flip ? 1 - an[0] : an[0];
  return [X + (ax - .5) * w, Y + (an[1] - .5) * h];
}
function drawPrintShadow(x, e, m, c, k) {
  const { o, w, h } = printRect(e); const zz = m.z;
  setT(x, c, 0, k);
  x.translate(m.X + LIGHT[0] * zz, m.Y + LIGHT[1] * zz); x.rotate(m.rot * D2R); if (e.flip) x.scale(-1, 1);
  const sw = w * (o.sil.width / (o.img.width * o.k)), sh = h * (o.sil.height / (o.img.height * o.k));
  const blur = Math.max(0, (zz - 10) * .07) * c.zoom;
  x.globalAlpha = m.a * clamp(.36 - (zz - 10) * .0005, .1, .36) * (e.shadow ?? 1);
  if (blur > .6) x.filter = `blur(${Math.min(40, blur)}px)`;
  x.drawImage(o.sil, -sw / 2, -sh / 2, sw, sh);
  x.filter = 'none';
  x.globalAlpha = m.a * .2 * (e.shadow ?? 1) * clamp(1 - (zz - 10) / 40);
  x.drawImage(o.sil, -sw / 2 - LIGHT[0] * zz * .7, -sh / 2 - LIGHT[1] * zz * .7, sw, sh);
}
function drawPrint(x, e, m, c, k) {
  const { o, w, h } = printRect(e);
  setT(x, c, m.z, k);
  x.translate(m.X, m.Y); x.rotate(m.rot * D2R); if (e.flip) x.scale(-1, 1);
  x.globalAlpha = m.a; x.imageSmoothingQuality = 'high';
  x.drawImage(o.img, -w / 2, -h / 2, w, h);
}

// ---------------------------------------------------------------- tags, magnets, ruler, card
function magnet(x, X, Y, r, col) {
  const [hi, lo] = THEME.magnet[col] || THEME.magnet.red;
  const g = x.createRadialGradient(X - r * .35, Y - r * .4, r * .1, X, Y, r);
  g.addColorStop(0, hi); g.addColorStop(1, lo);
  x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = r * .05; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(X - r * .3, Y - r * .42, r * .38, r * .16, -.5, 0, Math.PI * 2); x.fill();
}
const mctx = document.createElement('canvas').getContext('2d');
const tagFont = s => `700 ${s}px "${FONT.sc}"`;
function tagGeom(e) {
  const s = e.size || 60; mctx.font = tagFont(s); mctx.letterSpacing = `${s * .06}px`;
  const tw = mctx.measureText(e.text).width; mctx.letterSpacing = '0px';
  const h = s * 1.75, mr = s * .42, w = tw + h * .45 + mr * 2 + s * .7;
  return { w, h, mr, off: [-h * .5, -h / 2] };
}
function drawTagShadow(x, e, m, c, k) {
  const { w, h, off } = tagGeom(e); setT(x, c, 0, k);
  x.translate(m.X + LIGHT[0] * m.z, m.Y + LIGHT[1] * m.z); x.rotate(m.rot * D2R);
  x.globalAlpha = m.a * .26; x.filter = `blur(${Math.max(1, m.z * .3 * c.zoom)}px)`;
  x.fillStyle = `rgb(${THEME.shadow})`; x.beginPath(); x.roundRect(off[0], off[1], w, h, h * .12); x.fill(); x.filter = 'none';
}
function drawTag(x, e, m, c, k, t) {
  const { w, h, mr, off } = tagGeom(e), s = e.size || 60; setT(x, c, m.z, k);
  x.translate(m.X, m.Y); x.rotate(m.rot * D2R); x.globalAlpha = m.a;
  x.fillStyle = e.paper || THEME.paper; x.beginPath(); x.roundRect(off[0], off[1], w, h, h * .12); x.fill();
  x.strokeStyle = 'rgba(30,30,30,.10)'; x.lineWidth = 2; x.stroke();
  const g = x.createLinearGradient(0, off[1], 0, off[1] + h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(0,0,0,.04)');
  x.fillStyle = g; x.fill();
  x.fillStyle = INK(e.color || 'graphite'); x.font = tagFont(s); x.letterSpacing = `${s * .06}px`;
  x.textAlign = 'left'; x.textBaseline = 'middle';
  const tx = off[0] + h * .5 + mr + s * .42; x.fillText(e.text, tx, off[1] + h * .53); x.letterSpacing = '0px';
  if (e.strike) {   // a marker strike through the label
    const p = seg(t, e.strike.t, e.strike.t + (e.strike.d || .25));
    if (p > 0) {
      const s0 = tx - s * .25, s1 = off[0] + w - s * .2; x.globalCompositeOperation = 'multiply';
      x.strokeStyle = INK(e.strike.color || 'red'); x.globalAlpha = m.a * .92; x.lineWidth = s * .16; x.lineCap = 'round';
      x.beginPath(); x.moveTo(s0, off[1] + h * .58); x.lineTo(s0 + (s1 - s0) * eo(p), off[1] + h * .58 - (s1 - s0) * .06 * eo(p)); x.stroke();
      x.globalCompositeOperation = 'source-over';
    }
  }
  if (e.magnet !== false) magnet(x, 0, 0, mr, e.magnetColor || 'graphite');
}
function drawMagnetShadow(x, e, m, c, k) {
  setT(x, c, 0, k); x.globalAlpha = m.a * .36; x.filter = `blur(${Math.max(1, m.z * .28 * c.zoom)}px)`;
  x.fillStyle = `rgb(${THEME.shadow})`; x.beginPath(); x.arc(m.X + LIGHT[0] * m.z, m.Y + LIGHT[1] * m.z, (e.r || 40) * 1.02, 0, Math.PI * 2); x.fill(); x.filter = 'none';
}
function drawMagnet(x, e, m, c, k) { setT(x, c, m.z, k); x.globalAlpha = m.a; magnet(x, m.X, m.Y, e.r || 40, e.color || 'graphite'); }

// steel ruler laid across two magnets: brushed steel, engraved graduations (no numerals)
function rulerGeom(e, m) {
  const [ax, ay] = e.from, [bx, by] = e.to, L = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
  return { L, ang, w: e.w || 80, cx: (ax + bx) / 2 + (m.X - (e.xy?.[0] ?? 0)), cy: (ay + by) / 2 + (m.Y - (e.xy?.[1] ?? 0)) };
}
function drawRulerShadow(x, e, m, c, k) {
  const g = rulerGeom(e, m); setT(x, c, 0, k);
  x.translate(g.cx + LIGHT[0] * m.z, g.cy + LIGHT[1] * m.z); x.rotate(g.ang + m.rot * D2R);
  x.globalAlpha = m.a * .3; x.filter = `blur(${Math.max(1, m.z * .25 * c.zoom)}px)`;
  x.fillStyle = `rgb(${THEME.shadow})`; x.fillRect(-g.L / 2, -g.w / 2, g.L, g.w); x.filter = 'none';
}
function drawRuler(x, e, m, c, k) {
  const g = rulerGeom(e, m); setT(x, c, m.z, k);
  x.translate(g.cx, g.cy); x.rotate(g.ang + m.rot * D2R); x.globalAlpha = m.a;
  const gr = x.createLinearGradient(0, -g.w / 2, 0, g.w / 2);
  gr.addColorStop(0, '#E9ECEE'); gr.addColorStop(.18, '#C5CACE'); gr.addColorStop(.55, '#AEB4B9'); gr.addColorStop(.85, '#C9CED2'); gr.addColorStop(1, '#8F959B');
  x.fillStyle = gr; x.fillRect(-g.L / 2, -g.w / 2, g.L, g.w);
  // brushed grain
  const r = mulberry(17); x.globalAlpha = m.a * .18;
  for (let i = 0; i < 60; i++) { x.fillStyle = r() < .5 ? '#fff' : '#6d737a'; x.fillRect(-g.L / 2, -g.w / 2 + r() * g.w, g.L, 1.2); }
  x.globalAlpha = m.a;
  // graduations: every 10 px, longer every 50, longest every 100
  x.fillStyle = '#30353b';
  for (let d = 10; d < g.L - 4; d += 10) { const n = Math.round(d / 10); const len = n % 10 === 0 ? g.w * .42 : n % 5 === 0 ? g.w * .3 : g.w * .18; x.fillRect(-g.L / 2 + d - 1, -g.w / 2, 2, len); }
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2; x.strokeRect(-g.L / 2, -g.w / 2, g.L, g.w);
  for (const end of [-1, 1]) magnet(x, end * (g.L / 2 - (e.inset ?? 70)), 0, e.magnetR || 34, e.magnetColor || 'graphite');
}

// printed card pinned by magnets (end card)
function drawCardShadow(x, e, m, c, k) {
  setT(x, c, 0, k); x.translate(m.X + LIGHT[0] * m.z, m.Y + LIGHT[1] * m.z); x.rotate(m.rot * D2R);
  x.globalAlpha = m.a * .3; x.filter = `blur(${Math.max(1, m.z * .4 * c.zoom)}px)`; x.fillStyle = `rgb(${THEME.shadow})`;
  x.fillRect(-e.w / 2, -e.h / 2, e.w, e.h); x.filter = 'none';
}
function cardLineFont(l) {
  return l.font === 'marker' ? `400 ${l.size}px "${FONT.marker}"` : l.font === 'mono' ? `${l.weight || 500} ${l.size}px "${FONT.mono}"`
    : l.font === 'sans' ? `${l.weight || 600} ${l.size}px ${FONT.sans}` : `${l.weight || 700} ${l.size}px "${FONT.sc}"`;
}
function drawCard(x, e, m, c, k) {
  setT(x, c, m.z, k); x.translate(m.X, m.Y); x.rotate(m.rot * D2R); x.globalAlpha = m.a;
  x.fillStyle = e.paper || THEME.paper; x.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  const g = x.createLinearGradient(0, -e.h / 2, 0, e.h / 2); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(0,0,0,.05)');
  x.fillStyle = g; x.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
  x.strokeStyle = 'rgba(30,30,30,.12)'; x.lineWidth = 2; x.strokeRect(-e.w / 2, -e.h / 2, e.w, e.h);
  for (const l of e.lines || []) {
    if (l.rule) { x.fillStyle = INK(l.color || 'red'); x.fillRect(-e.w / 2 + l.x, l.y, l.w, l.h || 6); continue; }
    x.fillStyle = INK(l.color || 'graphite'); x.font = cardLineFont(l); x.letterSpacing = `${l.track || 0}px`;
    x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(l.text, -e.w / 2 + l.x, l.y); x.letterSpacing = '0px';
  }
  for (const p of e.magnets || []) magnet(x, p[0], p[1], e.magnetR || 30, p[2] || 'graphite');
}
function cardLineBox(e, l, m) {
  mctx.font = cardLineFont(l); mctx.letterSpacing = `${l.track || 0}px`; const w = mctx.measureText(l.text).width; mctx.letterSpacing = '0px';
  const x0 = m.X - e.w / 2 + l.x;
  return [[x0, m.Y + l.y - l.size * .82], [x0 + w, m.Y + l.y + l.size * .2]];
}

// ---------------------------------------------------------------- stamp (rubber stamp impression)
function stampTexture(e) {
  const s = e.size || 160, txt = e.text || '否决';
  mctx.font = `900 ${s}px "${FONT.sc}"`; const tw = mctx.measureText(txt).width;
  const pw = Math.ceil(tw + s * .9), ph = Math.ceil(s * 1.55), pad = 12;
  const cv = document.createElement('canvas'); cv.width = pw + pad * 2; cv.height = ph + pad * 2; const x = cv.getContext('2d');
  x.translate(pad, pad); x.fillStyle = INK(e.color || 'red'); x.strokeStyle = INK(e.color || 'red');
  x.lineWidth = s * .09; x.beginPath(); x.roundRect(s * .06, s * .06, pw - s * .12, ph - s * .12, s * .12); x.stroke();
  x.lineWidth = s * .03; x.beginPath(); x.roundRect(s * .17, s * .17, pw - s * .34, ph - s * .34, s * .08); x.stroke();
  x.font = `900 ${s}px "${FONT.sc}"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, pw / 2, ph / 2 + s * .04);
  // rubber texture: pits and uneven inking
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-out'; const r = mulberry(e.seed || 99);
  for (let i = 0; i < 900; i++) { x.globalAlpha = .25 + r() * .6; x.beginPath(); x.arc(r() * cv.width, r() * cv.height, .6 + r() * 2.6, 0, Math.PI * 2); x.fill(); }
  for (let i = 0; i < 7; i++) { x.globalAlpha = .18 + r() * .2; x.filter = 'blur(10px)'; x.beginPath(); x.ellipse(r() * cv.width, r() * cv.height, 30 + r() * 80, 12 + r() * 30, r() * 3, 0, Math.PI * 2); x.fill(); }
  x.filter = 'none'; x.globalAlpha = 1;
  return { cv, w: cv.width, h: cv.height };
}
function drawStamp(x, e, t) {
  if (t < e.t) return; const u = seg(t, e.t, e.t + .07), T = e._tex;
  const sc = lerp(1.18, 1, eo(u)), [X, Y] = e.xy;
  x.save(); x.translate(X, Y); x.rotate((e.rot || 0) * D2R); x.scale(sc, sc);
  x.globalAlpha = clamp(u * 1.6) * (e.alpha ?? .9); x.drawImage(T.cv, -T.w / 2, -T.h / 2); x.restore();
}

// ---------------------------------------------------------------- ink on the board
function inkStroke(x, path, lw, color, alpha = .9) {
  x.strokeStyle = color; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
  const a0 = x.globalAlpha; x.globalAlpha = a0 * alpha; x.stroke(path);
  x.globalAlpha = a0 * .1; x.strokeStyle = '#fff'; x.lineWidth = lw * .42; x.stroke(path); x.globalAlpha = a0;
}
function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
function polyPath(P, p) {
  const L = polyLen(P);
  let need = L * clamp(p), d = 0; const path = new Path2D(); path.moveTo(...P[0]); let tip = P[0], ang = 0;
  for (let i = 1; i < P.length; i++) {
    const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); ang = Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0]);
    if (d + l >= need) { const u = l ? (need - d) / l : 0; tip = [lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u)]; path.lineTo(...tip); break; }
    path.lineTo(...P[i]); d += l; tip = P[i];
  }
  return { path, tip, ang, L };
}
const inkProg = (e, t) => e.t == null ? 1 : seg(t, e.t, e.t + (e.d || .5));
function pt(q) { return typeof q === 'string' ? anchor(...q.split('.')) : q; }
function arrowHead(x, tip, ang, lw, col) {
  x.save(); x.translate(...tip); x.rotate(ang); x.strokeStyle = col; x.lineWidth = lw * .9; x.lineCap = 'round'; x.lineJoin = 'round';
  const a0 = x.globalAlpha; x.globalAlpha = a0 * .9;
  x.beginPath(); x.moveTo(-lw * 3.4, -lw * 1.9); x.lineTo(0, 0); x.lineTo(-lw * 3.4, lw * 1.9); x.stroke(); x.globalAlpha = a0; x.restore();
}
// marker lettering with a real font, revealed glyph by glyph in writing direction, with a slight
// hand: per-glyph tilt, baseline wobble and size jitter (seeded, so every frame agrees)
function writeLayout(e) {
  if (e._lay) return e._lay;
  const s = e.size || 160; mctx.font = `400 ${s}px "${FONT.marker}"`;
  const tr = (e.track ?? .02) * s, r = mulberry(e.seed || hash(e.text.length + (e.size || 1)) * 1e6 | 0);
  let x = 0; const g = [];
  for (const ch of e.text) { const w = mctx.measureText(ch).width; g.push({ ch, x, w, rot: (r() - .5) * 3.2, dy: (r() - .5) * s * .05, sc: 1 + (r() - .5) * .05, sp: ch === ' ' }); x += w + tr; }
  e._lay = { g, width: x - tr, s }; return e._lay;
}
export function writeBox(e) {
  const { width, s } = writeLayout(e), [X, Y] = pt(e.xy), x0 = e.align === 'center' ? X - width / 2 : e.align === 'right' ? X - width : X;
  return [[x0, Y - s * .86], [x0 + width, Y + s * .16]];
}
function drawWrite(x, e, t) {
  const p = inkProg(e, t); if (p <= 0) return null;
  const { g, width, s } = writeLayout(e), [X, Y] = pt(e.xy), col = INK(e.color);
  const x0 = e.align === 'center' ? -width / 2 : e.align === 'right' ? -width : 0;
  const n = g.filter(q => !q.sp).length; let idx = 0, tip = null;
  x.save(); x.translate(X, Y); if (e.rot) x.rotate(e.rot * D2R);
  x.font = `400 ${s}px "${FONT.marker}"`; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  for (const q of g) {
    if (q.sp) continue;
    const ci = clamp(p * n - idx); idx++; if (ci <= 0) break;
    x.save(); x.translate(x0 + q.x + q.w / 2, q.dy); x.rotate(q.rot * D2R); x.scale(q.sc, q.sc); x.translate(-q.w / 2, 0);
    if (ci < 1) {   // diagonal wipe through the glyph box, top-left to bottom-right
      const e0 = -s * .2, e1 = q.w + s * .9, k = lerp(e0, e1, ci);
      x.beginPath(); x.moveTo(-s, -s * 1.2); x.lineTo(k + s * .5, -s * 1.2); x.lineTo(k - s * .35, s * .4); x.lineTo(-s, s * .4); x.closePath(); x.clip();
      tip = [X + x0 + q.x + Math.min(q.w, Math.max(0, k)), Y - s * .35 + Math.sin(ci * 9) * s * .18];
    }
    x.globalAlpha = .9; x.fillStyle = col; x.fillText(q.ch, 0, 0);
    x.globalAlpha = .22; x.strokeStyle = col; x.lineWidth = s * .022; x.lineJoin = 'round'; x.strokeText(q.ch, 0, 0);   // ink pools at the edges
    x.restore();
  }
  x.restore();
  return tip;
}
function inkBBox(e) {
  if (e._bb) return e._bb;
  let P = [];
  if (e.kind === 'line' || e.kind === 'hatch') P = e.kind === 'hatch' ? e.strokes.flatMap(s => s.points) : e.points.map(pt);
  else if (e.kind === 'dim') P = [pt(e.from), pt(e.to)];
  else if (e.kind === 'write') { const b = writeBox(e); P = b; }
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  e._bb = [Math.min(...xs) - 60, Math.min(...ys) - 60, Math.max(...xs) + 60, Math.max(...ys) + 60]; return e._bb;
}
function drawInkCore(x, e, t) {
  const p = inkProg(e, t); if (p <= 0 && e.kind !== 'hatch') return null;
  const col = INK(e.color), lw = e.lw || 12; let tip = null;
  if (e.kind === 'line') {
    const P = e.points.map(pt), r = polyPath(P, e.ease === 'linear' ? p : bease(p, e.ea ?? 2, e.eb ?? 2));
    x.save(); if (e.dash) x.setLineDash(e.dash); inkStroke(x, r.path, lw, col, e.alpha ?? .9); x.restore();
    if (e.arrow && p > .05) arrowHead(x, r.tip, r.ang, lw, col);
    tip = p < 1 ? r.tip : null;
  } else if (e.kind === 'hatch') {   // many short strokes, each with its own time
    for (const s of e.strokes) {
      const q = seg(t, s.t, s.t + (s.d || .12)); if (q <= 0) continue;
      const r = polyPath(s.points, eo(q)); inkStroke(x, r.path, s.lw || lw, INK(s.color || e.color), e.alpha ?? .75);
      if (q < 1) tip = r.tip;
    }
  } else if (e.kind === 'dim') {   // dimension: extension lines, line with arrowheads, drawn from A toward B
    const A = pt(e.from), B = pt(e.to), u = e.ease === 'linear' ? p : bease(p, e.ea ?? 2, e.eb ?? 2);
    for (const ex of e.ext || []) { const q = pt(ex); const P2 = new Path2D(); P2.moveTo(q[0], q[1]); P2.lineTo(q[0], q[2] ?? A[1] + 40); x.globalAlpha = clamp(p * 5); inkStroke(x, P2, lw * .4, INK(e.extColor || e.color), .6); x.globalAlpha = 1; }
    const r = polyPath([A, B], u); inkStroke(x, r.path, lw, col);
    const back = Math.atan2(A[1] - B[1], A[0] - B[0]);
    if (e.arrows !== false) { arrowHead(x, A, back, lw, col); if (u >= .999) arrowHead(x, B, back + Math.PI, lw, col); }
    else { const bar = q => { const P3 = new Path2D(); P3.moveTo(q[0], q[1] - lw * 2.6); P3.lineTo(q[0], q[1] + lw * 2.6); inkStroke(x, P3, lw, col); }; bar(A); if (u >= .999) bar(B); }
    tip = u < 1 ? r.tip : null;
  } else if (e.kind === 'write') {
    tip = drawWrite(x, e, t);
  } else if (e.kind === 'arc') {
    const [X, Y] = e.c, a0 = e.a0 * D2R, a1 = lerp(a0, e.a1 * D2R, bease(p, 2, 2.5));
    const path = new Path2D(); path.arc(X, Y, e.r, a0, a1, e.ccw); inkStroke(x, path, lw, col);
    tip = p < 1 ? [X + Math.cos(a1) * e.r, Y + Math.sin(a1) * e.r] : null;
  } else if (e.kind === 'ring') {   // a hand-drawn ring: a little more than one turn, slightly spiralling
    const [X, Y] = e.c, [rx, ry] = Array.isArray(e.r) ? e.r : [e.r, e.r], a0 = (e.start ?? -100) * D2R, turn = 1.07 * bease(p, 1.6, 2.4);
    const path = new Path2D(), n = Math.max(2, Math.ceil(72 * turn));
    for (let i = 0; i <= n; i++) { const u = i / n * turn, a = a0 + u * Math.PI * 2, g = 1 + (u - .5) * .06;
      const px = X + Math.cos(a) * rx * g, py = Y + Math.sin(a) * ry * g; i ? path.lineTo(px, py) : path.moveTo(px, py);
      if (i === n && p < 1) tip = [px, py]; }
    inkStroke(x, path, lw, col);
  } else if (e.kind === 'wake' && e.dir === 'side') {   // a side-view ship: a bow wave and a trail of short strokes on the water line
    const f = byId[e.follow], m = motion(f, t), { w } = printRect(f), k = clamp((t - e.t) / .4) * (e.out != null ? 1 - seg(t, e.out, e.out + .5) : 1);
    if (k <= 0) return null; const wl = e.y, sgn = e.sgn ?? 1, sx = m.X + sgn * w / 2;   // stern end
    x.globalAlpha = .7 * k;
    for (let i = 0; i < 6; i++) { const L0 = sx + sgn * (20 + i * 70 * k), P = new Path2D(); P.moveTo(L0, wl + 6 + i * 2); P.quadraticCurveTo(L0 + sgn * 25, wl + 2 + i * 3, L0 + sgn * 55, wl + 8 + i * 2.5); inkStroke(x, P, e.lw || 5, INK('water'), .8); }
    const bx = m.X - sgn * w / 2, B = new Path2D(); B.moveTo(bx - sgn * 10, wl - 6); B.quadraticCurveTo(bx - sgn * 40, wl + 4, bx - sgn * 70, wl + 8); inkStroke(x, B, e.lw || 5, INK('water'), .8);
    x.globalAlpha = 1;
  } else if (e.kind === 'wake') {   // two thin lines trailing the stern of a moving print
    const f = byId[e.follow], m = motion(f, t), { h } = printRect(f);
    const st = [m.X, m.Y - h / 2 + 8], k = clamp((t - e.t) / .6) * (e.out != null ? 1 - seg(t, e.out, e.out + .5) : 1);
    const len = (e.len || 380) * k; if (len < 4) return null;
    x.globalAlpha = .55;
    for (const sd of [-1, 1]) { const P = new Path2D(); P.moveTo(st[0] + sd * 18, st[1]); P.quadraticCurveTo(st[0] + sd * (36 + len * .12), st[1] - len * .55, st[0] + sd * (60 + len * .26), st[1] - len); inkStroke(x, P, e.lw || 6, INK('water'), .8); }
    x.globalAlpha = 1;
  }
  return tip;
}
function drawInk(x, e, t) {
  const E = e.erase, a0 = x.globalAlpha;
  if (e.out != null && t > e.out) x.globalAlpha = a0 * (1 - seg(t, e.out, e.out + (e.outD || .4)));
  if (!E || t <= E.t) { const tp = drawInkCore(x, e, t); x.globalAlpha = a0; return tp; }
  // eraser pass: a soft band sweeps across; behind it only a ghost and some haze remain
  const [bx0, by0, bx1, by1] = inkBBox(e), q = bease(seg(t, E.t, E.t + (E.d || .4)), 2, 2.4);
  const ex = lerp(bx0 - 120, bx1 + 120, q);
  x.save(); x.beginPath(); x.rect(ex, by0 - 400, 1e5, by1 - by0 + 800); x.clip(); drawInkCore(x, e, t); x.restore();
  x.save(); x.beginPath(); x.rect(-1e5, by0 - 400, ex + 1e5, by1 - by0 + 800); x.clip();
  x.globalAlpha = a0 * (E.ghost ?? .075); x.filter = 'blur(2px)'; drawInkCore(x, e, t); x.filter = 'none';
  x.globalAlpha = a0 * .05; x.fillStyle = '#7d838a'; x.fillRect(bx0 - 40, by0 + 10, Math.max(0, ex - bx0 + 40), by1 - by0 - 20);
  x.restore(); x.globalAlpha = a0;
  return null;
}

// ---------------------------------------------------------------- board, frame, wall, tray
function drawBoard(x, c, k) {
  setT(x, c, 0, k);
  const b = scene.board;
  x.fillStyle = THEME.wall; x.fillRect(-9000, -9000, b.w + 18000, b.h + 18000);
  // the frame stands off the wall: a soft shadow on the wall
  x.save(); x.filter = `blur(${Math.max(1, 26 * c.zoom)}px)`; x.fillStyle = 'rgba(40,36,30,.45)'; x.fillRect(-40, 10, b.w + 120, b.h + 120); x.restore();
  x.drawImage(BOARD.c, 0, 0, b.w, b.h);
  const f = 44, grad = (x0, y0, x1, y1) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#DADCDE'); g.addColorStop(.5, '#A9ADB2'); g.addColorStop(1, '#8B9095'); return g; };
  x.fillStyle = grad(0, -f, 0, 0); x.fillRect(-f, -f, b.w + 2 * f, f);
  x.fillStyle = grad(-f, 0, 0, 0); x.fillRect(-f, 0, f, b.h);
  x.fillStyle = grad(b.w + f, 0, b.w, 0); x.fillRect(b.w, 0, f, b.h);
  x.fillStyle = grad(0, b.h, 0, b.h + f); x.fillRect(-f, b.h, b.w + 2 * f, f);
  x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, b.w, 3); x.fillRect(0, 0, 3, b.h);   // inner lip
}
function drawTray(x, c, k) {   // marker tray along the bottom edge: sticks out toward the camera
  const b = scene.board, z = 70; setT(x, c, z, k);
  const y0 = b.h + 4, g = x.createLinearGradient(0, y0, 0, y0 + 120);
  g.addColorStop(0, '#E6E8EA'); g.addColorStop(.22, '#B6BABF'); g.addColorStop(.6, '#9AA0A5'); g.addColorStop(1, '#6C7176');
  x.fillStyle = g; x.fillRect(-60, y0, b.w + 120, 120);
  x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(-60, y0 + 5, b.w + 120, 4);
  // markers and an eraser lying in the tray
  for (const mk of scene.tray || []) {
    x.save(); x.translate(mk.x, y0 + 52); x.rotate((mk.rot || 0) * D2R);
    if (mk.kind === 'eraser') {
      x.fillStyle = '#2B2E33'; x.beginPath(); x.roundRect(-150, -34, 300, 48, 8); x.fill();
      x.fillStyle = '#5A5F66'; x.fillRect(-150, -34, 300, 10); x.fillStyle = '#D9D6CF'; x.fillRect(-146, 10, 292, 10);
    } else {
      const L = 330, r = 21, col = INK(mk.color);
      const bg = x.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, '#FAFAF8'); bg.addColorStop(.45, '#E5E5E2'); bg.addColorStop(1, '#9B9C9A');
      x.fillStyle = bg; x.beginPath(); x.roundRect(-L / 2, -r, L * .72, r * 2, r * .5); x.fill();
      const cg = x.createLinearGradient(0, -r, 0, r); cg.addColorStop(0, col); cg.addColorStop(1, '#111');
      x.fillStyle = cg; x.beginPath(); x.roundRect(-L / 2 + L * .7, -r * 1.08, L * .3, r * 2.16, r * .45); x.fill();
      x.fillStyle = col; x.fillRect(-L / 2 + L * .3, -r * .55, L * .22, r * 1.1);   // colour band on the barrel
      x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(-L / 2 + 6, -r * .62, L * .62, 3);
    }
    x.restore();
  }
}
function lightOverlay(x, c, k, t) {
  const L = scene.light || { x: -1800, y: -2400, r: 15000, min: .8 };
  x.setTransform(k, 0, 0, k, 0, 0);
  const [lx, ly] = toScreen([L.x, L.y], 0, t, c), R = L.r * c.zoom;
  const g = x.createRadialGradient(lx, ly, R * .15, lx, ly, R);
  const lo = Math.round(255 * (L.min ?? .8));
  g.addColorStop(0, 'rgb(255,253,248)'); g.addColorStop(.55, 'rgb(246,243,236)'); g.addColorStop(1, `rgb(${lo},${lo - 2},${lo - 8})`);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (const sb of scene.shade || []) {   // a soft band of shade (a passing cloud) crossing the wall, anchored to the world
    if (t < sb.t0 - .5 || t > sb.t1 + .5) continue;
    const u = bease(seg(t, sb.t0, sb.t1), 1.6, 1.6), xw = lerp(sb.x0, sb.x1, u), ang = (sb.ang ?? -18) * D2R;
    const p0 = toScreen([xw - sb.w, (sb.y ?? 0)], 0, t, c), p1 = toScreen([xw + sb.w, (sb.y ?? 0)], 0, t, c);
    const cx = (p0[0] + p1[0]) / 2, half = Math.abs(p1[0] - p0[0]) / 2, fade = Math.min(seg(t, sb.t0 - .5, sb.t0 + .3), 1 - seg(t, sb.t1 - .3, sb.t1 + .5));
    x.save(); x.translate(cx, H / 2); x.rotate(ang);
    const gg = x.createLinearGradient(-half, 0, half, 0), a = sb.amt * fade, col = q => { const v = Math.round(255 * (1 - a * q)); return `rgb(${v},${v},${Math.min(255, v + 2)})`; };
    gg.addColorStop(0, col(0)); gg.addColorStop(.3, col(.7)); gg.addColorStop(.5, col(1)); gg.addColorStop(.7, col(.7)); gg.addColorStop(1, col(0));
    x.fillStyle = gg; x.fillRect(-half, -H * 1.5, half * 2, H * 3); x.restore();
  }
  const v = x.createRadialGradient(W * .5, H * .47, H * .38, W * .5, H * .5, H * 1.08);
  v.addColorStop(0, 'rgb(255,255,255)'); v.addColorStop(1, 'rgb(208,205,199)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  // sheen: a soft window reflection that slides at a different rate than the board (it is a reflection)
  const sx = W * .6 - (c.x * c.zoom * .16) % (W * 2.4), sy = -(c.y * c.zoom * .1) % H;
  x.save(); x.translate(sx, sy + H * .4); x.rotate(-.42);
  const sg = x.createLinearGradient(-W * .33, 0, W * .33, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(255,255,255,${scene.sheen ?? .08})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sg; x.fillRect(-W * .33, -H * 2, W * .66, H * 4); x.restore();
}

// ---------------------------------------------------------------- frame composition
let layers = null;
function layer(i, sw, sh) {
  layers = layers || [];
  if (!layers[i] || layers[i].width !== sw || layers[i].height !== sh) { const c = document.createElement('canvas'); c.width = sw; c.height = sh; layers[i] = c; }
  const x = layers[i].getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, sw, sh); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over';
  return x;
}
const dofBlur = (c, z) => (c.ap || 0) * c.zoom * Math.abs(z - (c.focus ?? 0)) / 10;
const SHUTTER = 1 / 48;   // 180° at 24 fps
export function screenSpeed(t) {   // px the frame content moves during one shutter interval
  const c0 = camAt(t - SHUTTER / 2), c1 = camAt(t + SHUTTER / 2); let m = 0;
  for (const sp of [[W / 2, H / 2], [80, 80], [W - 80, H - 80], [80, H - 80], [W - 80, 80]]) {
    const w = toWorld(sp, 0, c0), q = toScreen(w, 0, 0, c1); m = Math.max(m, Math.hypot(q[0] - sp[0], q[1] - sp[1]));
  }
  return m;
}
let acc = null;
export function renderScene(canvas, t) {
  const sp = screenSpeed(t), mb = (scene.mb || []).find(r => t >= r.t0 && t <= r.t1);
  const n = Math.min(24, Math.max(sp > 2 ? Math.ceil(sp / 2) + 1 : 1, mb ? mb.n || 5 : 1));
  const sw = canvas.width, sh = canvas.height, k = Math.min(sw / W, sh / H);
  if (n > 1) {
    if (!acc || acc.width !== sw || acc.height !== sh) { acc = document.createElement('canvas'); acc.width = sw; acc.height = sh; }
    const ax = acc.getContext('2d'); ax.setTransform(1, 0, 0, 1, 0, 0); ax.clearRect(0, 0, sw, sh);
    for (let i = 0; i < n; i++) { renderCore(canvas, t + (i / (n - 1) - .5) * SHUTTER); ax.globalAlpha = 1 / (i + 1); ax.drawImage(canvas, 0, 0); }
    const out = canvas.getContext('2d'); out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.drawImage(acc, 0, 0);
  } else renderCore(canvas, t);
  drawSub(canvas.getContext('2d'), t, k);
}
function renderCore(canvas, t) {
  const sw = canvas.width, sh = canvas.height, k = Math.min(sw / W, sh / H);
  const c = camAt(t); const tips = [];
  // 0: board, ink (multiply), shadows
  const L0 = layer(0, sw, sh);
  drawBoard(L0, c, k);
  setT(L0, c, 0, k); L0.globalCompositeOperation = 'multiply';
  for (const e of els) if (e.type === 'ink' && !e.onPrint) { const tp = drawInk(L0, e, t); if (tp && e.tip !== false) tips.push([tp, e.color, e.lw || 12]); }
  L0.globalCompositeOperation = 'source-over';
  for (const e of els) {
    if (!['print', 'tag', 'magnet', 'ruler', 'card'].includes(e.type)) continue;
    const m = motion(e, t); if (!m.vis || m.a <= 0) continue;
    L0.save();
    if (e.type === 'print') drawPrintShadow(L0, e, m, c, k); else if (e.type === 'magnet') drawMagnetShadow(L0, e, m, c, k);
    else if (e.type === 'ruler') drawRulerShadow(L0, e, m, c, k); else if (e.type === 'card') drawCardShadow(L0, e, m, c, k); else drawTagShadow(L0, e, m, c, k);
    L0.restore();
  }
  setT(L0, c, 0, k);
  for (const [p, col, lw] of tips) { L0.fillStyle = INK(col); L0.globalAlpha = .95; L0.beginPath(); L0.arc(p[0], p[1], Math.max(6, lw * .62), 0, Math.PI * 2); L0.fill(); L0.globalAlpha = 1; }
  // 1: prints, then ink and stamps that sit on top of them
  const L1 = layer(1, sw, sh), L2 = layer(2, sw, sh);
  for (const e of els) { if (e.type !== 'print') continue; const m = motion(e, t); if (!m.vis || m.a <= 0) continue; L1.save(); drawPrint(L1, e, m, c, k); L1.restore(); }
  setT(L1, c, 10, k); L1.globalCompositeOperation = 'multiply';
  for (const e of els) { if (e.type === 'ink' && e.onPrint) drawInk(L1, e, t); else if (e.type === 'stamp') drawStamp(L1, e, t); }
  L1.globalCompositeOperation = 'source-over';
  // 2: ruler, tags, card, magnets (in list order)
  for (const e of els) {
    if (!['tag', 'magnet', 'ruler', 'card'].includes(e.type)) continue; const m = motion(e, t); if (!m.vis || m.a <= 0) continue;
    L2.save();
    if (e.type === 'magnet') drawMagnet(L2, e, m, c, k); else if (e.type === 'ruler') drawRuler(L2, e, m, c, k); else if (e.type === 'card') drawCard(L2, e, m, c, k); else drawTag(L2, e, m, c, k, t);
    L2.restore();
  }
  // 3: foreground (the tray)
  const L3 = layer(3, sw, sh); if (scene.board.tray !== false) drawTray(L3, c, k);
  const out = canvas.getContext('2d'); out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
  const comp = (cv, z) => { const b = dofBlur(c, z) * k; out.filter = b > .35 ? `blur(${b.toFixed(2)}px)` : 'none'; out.drawImage(cv, 0, 0); out.filter = 'none'; };
  comp(layers[0], 0); comp(layers[1], 10); comp(layers[2], 20); comp(layers[3], 70);
  lightOverlay(out, c, k, t);
}

// ---------------------------------------------------------------- subtitles: bilingual, one line per language
export const SUB = { zh: 42, en: 29, safe: 1500, gap: 10, padX: 30, padY: 15, bottom: 40 };
const subFontZh = () => `500 ${SUB.zh}px "${FONT.sc}"`, subFontEn = () => `500 ${SUB.en}px ${FONT.sans}`;
export function measureSub(s) {
  mctx.font = subFontZh(); const wz = mctx.measureText(s.zh).width;
  mctx.font = subFontEn(); const we = mctx.measureText(s.en).width;
  return { wz, we };
}
export function subBox(s) {
  const { wz, we } = measureSub(s), w = Math.max(wz, we) + SUB.padX * 2 + 10, h = SUB.padY * 2 + SUB.zh + SUB.gap + SUB.en;
  return { x: W / 2 - w / 2, y: H - SUB.bottom - h, w, h };
}
function drawSub(x, t, k) {
  const s = (scene.subs || []).find(q => t >= q.t0 && t < q.t1); if (!s) return;
  const a = Math.min(seg(t, s.t0, s.t0 + .1), 1 - seg(t, s.t1 - .1, s.t1));
  const b = subBox(s);
  x.setTransform(k, 0, 0, k, 0, 0); x.globalAlpha = a;
  x.save(); x.shadowColor = 'rgba(20,18,14,.18)'; x.shadowBlur = 14; x.shadowOffsetY = 3;
  x.fillStyle = 'rgba(251,250,246,.9)'; x.beginPath(); x.roundRect(b.x, b.y, b.w, b.h, 10); x.fill(); x.restore();
  x.globalAlpha = a; x.strokeStyle = 'rgba(30,30,30,.10)'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(b.x, b.y, b.w, b.h, 10); x.stroke();
  x.fillStyle = THEME.blue; x.fillRect(b.x + 12, b.y + SUB.padY + 4, 4, b.h - SUB.padY * 2 - 8);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.letterSpacing = '0px';
  x.font = subFontZh(); x.fillStyle = THEME.graphite; x.fillText(s.zh, W / 2 + 5, b.y + SUB.padY + SUB.zh * .9);
  x.font = subFontEn(); x.fillStyle = '#4A4F57'; x.fillText(s.en, W / 2 + 5, b.y + SUB.padY + SUB.zh + SUB.gap + SUB.en * .86);
  x.globalAlpha = 1;
}
export function subCheck() {   // every cue: each language must fit on one line inside the safe width
  return (scene.subs || []).map((s, i) => { const { wz, we } = measureSub(s); return { i, zh: s.zh, en: s.en, wz: Math.round(wz), we: Math.round(we), safe: SUB.safe, ok: wz < SUB.safe && we < SUB.safe && !/\n/.test(s.zh + s.en) }; });
}

// ---------------------------------------------------------------- readcheck + sound events
export function sceneTexts(t) {
  const out = [], c = camAt(t);
  const box = (id, text, pts, z, pass = false) => {
    const sp = pts.flatMap(p => [toScreen(p, z, t, c), toScreen([p[0], pts[1 - pts.indexOf(p)][1]], z, t, c)]);
    const xs = sp.map(p => p[0]), ys = sp.map(p => p[1]);
    out.push({ id, text, pass, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
  };
  for (const e of els) {
    if (e.type === 'tag' && e.text) {
      const m = motion(e, t); if (!m.vis || m.a < .5) continue; if (e.arrive && t < e.arrive.t + .25) continue;
      const { w, h, off } = tagGeom(e); box(e.id || e.text, e.text, [[m.X + off[0], m.Y + off[1]], [m.X + off[0] + w, m.Y + off[1] + h]], m.z);
    } else if (e.type === 'ink' && e.kind === 'write') {
      if (e.t != null && t < e.t) continue; if (e.out != null && t > e.out) continue; if (e.erase && t > e.erase.t) continue;
      box(e.id || e.text, e.text, writeBox(e), e.onPrint ? 10 : 0);
    } else if (e.type === 'stamp') {
      if (t < e.t) continue; const s = (e.size || 160); box(e.id || 'stamp', e.text, [[e.xy[0] - s, e.xy[1] - s * .6], [e.xy[0] + s, e.xy[1] + s * .6]], 0);
    } else if (e.type === 'card') {
      const m = motion(e, t); if (!m.vis) continue;
      (e.lines || []).forEach((l, i) => { if (l.text) box((e.id || 'card') + ':' + i, l.text, cardLineBox(e, l, m), m.z, l.pass_); });   // pass_: fine-print credits, not timed
    }
  }
  return out;
}
export function resCheck(t) {   // for every print in frame: photo pixels per screen pixel (must stay ≥ 1)
  const c = camAt(t), out = [];
  for (const e of els) {
    if (e.type !== 'print') continue; const m = motion(e, t); if (!m.vis || m.a <= 0) continue;
    const { o, w, h } = printRect(e), s = c.zoom * Pz(c, m.z);
    const pts = [[m.X - w / 2, m.Y - h / 2], [m.X + w / 2, m.Y + h / 2]].map(p => toScreen(p, m.z, t, c));
    const x0 = Math.min(pts[0][0], pts[1][0]), x1 = Math.max(pts[0][0], pts[1][0]), y0 = Math.min(pts[0][1], pts[1][1]), y1 = Math.max(pts[0][1], pts[1][1]);
    if (x1 < 0 || x0 > W || y1 < 0 || y0 > H) continue;
    let ratio = (o.img.naturalWidth / w) / s, note = '';
    const st = o.meta.stretch;
    if (st && st.region) {   // a stretched span has fewer real pixels across: count only if it is in frame
      const rx0 = x0 + (x1 - x0) * st.region[0], rx1 = x0 + (x1 - x0) * st.region[1];
      if (rx1 > 0 && rx0 < W) { ratio /= st.k; note = 'stretched span in frame'; }
    }
    out.push({ id: e.id, ratio, note });
  }
  return out;
}
export function sceneEvents() { return scene.ev || []; }
