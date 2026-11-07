// ============================================================
// "AI 进化节拍" (AI Evolution Beat) — rhythm-game style, 140 BPM
// Every "hit" is registered through ev(); the renderer exports events.json, and the music script places SFX/voices from it
// ============================================================
const K = {
  ol: '#1B1B1B', white: '#FFFFFF', cream: '#FFF6E5', yellow: '#FFD23F', orange: '#FF8C42', red: '#FF5A5F',
  pink: '#FF8FB1', purple: '#6B4FBB', purpleD: '#46318F', teal: '#3FB8AF', tealD: '#2B8F88', blue: '#4D7CFE',
  navy: '#26264A', sky: '#8ED1FC', green: '#5BD68A', wood: '#C98A52', woodD: '#8E5530', gray: '#C3CAD9',
  skin: '#FFD1A8', gpt: '#19B388', claude: '#D97757', gem1: '#4E7CF6', gem2: '#9B6CF0', llama: '#F4E9D8',
  seek: '#5A78E8', dblue: '#2B59C3', chalk: '#2F5D50', lime: '#C6F16D',
};
F.round = "'Fredoka', 'Noto Sans SC'";
const OW = 8;
const SO = { stroke: K.ol, 'stroke-width': OW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

const BPM = 140, B = 60 / BPM, BARL = 4 * B;
const at = (bar, beat = 0) => (bar * 4 + beat) * B;
const END_BAR = 61;
window.DUR = at(END_BAR);

// ---------------- Event registry ----------------
const EV = [];
const PUNCH = [];
function ev(t, s, o = {}) { EV.push({ t: +t.toFixed(4), s, ...o }); }
function punch(t, a = 0.018) { PUNCH.push([t, a]); }
window.EV = EV;

// Beat helpers
const frac = (t) => ((t / B) % 1 + 1) % 1;
const hopY = (t, h = 40) => { const f = frac(t); return -h * 4 * f * (1 - f); };
// Squash value for being "hit" once at t0
const hitSq = (t, t0, amt = 0.2) => (t >= t0 && t < t0 + 0.35) ? 1 - amt * Math.exp(-(t - t0) * 14) * Math.cos((t - t0) * 30) : 1;
const near = (t, t0, a = 0.05, b = 0.22) => t >= t0 - a && t < t0 + b;
function gtext(parent, s, x, y, size, o = {}) {
  return txt(parent, s, { x, y, 'font-size': size, 'font-family': o.family || F.sans, 'font-weight': o.weight || 900, fill: o.fill || K.white,
    stroke: o.stroke || K.ol, 'stroke-width': o.sw ?? size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': o.anchor || 'middle' });
}

// ---------------- Shared visuals ----------------
function stripes(parent, col, w = 60, angle = -30) {
  const g = el('g', { transform: `rotate(${angle} 960 540)` }, parent);
  let d = '';
  for (let x = -1400; x < 3400; x += w * 2) d += `M${x} -1400 h${w} v3900 h${-w} Z`;
  el('path', { d, fill: col }, g);
  return g;
}
function dots(parent, col, step = 70, r = 10) {
  let d = '';
  for (let y = 0; y < 1180; y += step) for (let x = ((y / step) % 2) * step / 2; x < 2000; x += step) d += `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  return el('path', { d, fill: col }, parent);
}
function raysEl(parent, n, col) {
  const g = el('g', {}, parent);
  for (let i = 0; i < n; i += 2) {
    const a = i / n * Math.PI * 2, da = Math.PI / n;
    el('path', { d: `M0 0 L${Math.cos(a - da) * 1600} ${Math.sin(a - da) * 1600} L${Math.cos(a + da) * 1600} ${Math.sin(a + da) * 1600} Z`, fill: col }, g);
  }
  return g;
}
function starPath(n, r1, r2) {
  let d = '';
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }
  return d + 'Z';
}
// Hit effect (starburst + ring); returns a per-frame update function
function burst(parent, x, y, t0, col = K.yellow, size = 1) {
  const g = el('g', {}, parent);
  const ring = el('circle', { cx: 0, cy: 0, r: 50, fill: 'none', stroke: K.white, 'stroke-width': 10 }, g);
  el('path', { d: starPath(8, 70, 28), fill: col, ...SO, 'stroke-width': 6 }, g);
  const lines = el('g', { stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; el('line', { x1: Math.cos(a) * 90, y1: Math.sin(a) * 90, x2: Math.cos(a) * 130, y2: Math.sin(a) * 130 }, lines); }
  op(g, 0);
  return (t) => {
    const p = (t - t0) / 0.3;
    if (p < 0 || p > 1) { op(g, 0); return; }
    op(g, 1 - p * p);
    tf(g, x, y, size * (0.55 + 0.7 * E.out(p)), p * 30);
    ring.setAttribute('r', 50 + 60 * p); ring.setAttribute('stroke-width', 10 * (1 - p));
  };
}
function judge(parent, word, x, y, t0, col = K.pink, dur = 1.0) {
  const g = el('g', {}, parent);
  gtext(g, word, 0, 0, 120, { family: F.round, weight: 700, fill: col, sw: 18 });
  op(g, 0);
  return (t) => {
    if (t < t0 || t > t0 + dur) { op(g, 0); return; }
    op(g, 1 - seg(t, t0 + dur - 0.2, t0 + dur));
    tf(g, x, y - 20 * E.out(seg(t, t0, t0 + dur)), E.back(seg(t, t0, t0 + 0.25)), -6);
  };
}
// Year banner
function banner(parent, year, name, sub, col) {
  const g = el('g', {}, parent);
  const yw = measure(year, 64, F.round, 700), nw = measure(name, 54, F.sans, 900), sw = measure(sub, 34, F.sans, 900);
  const W = Math.max(yw + 26 + nw, sw) + 64, H = 158;
  el('rect', { x: 10, y: 10, width: W, height: H, rx: 24, fill: K.ol }, g);
  el('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: col, ...SO, 'stroke-width': 7 }, g);
  gtext(g, year, 32, 74, 64, { family: F.round, weight: 700, anchor: 'start', sw: 12 });
  gtext(g, name, 32 + yw + 26, 72, 54, { anchor: 'start', sw: 12 });
  txt(g, sub, { x: 34, y: 128, 'font-size': 34, 'font-family': F.sans, 'font-weight': 900, fill: K.ol });
  return { g };
}
function bannerAnim(b, t, t0, t1, x = 56, y = 44) {
  if (t < t0 || t >= t1) { op(b.g, 0); return; }
  op(b.g, 1);
  const pin = E.back(seg(t, t0, t0 + 0.35)), pout = E.in(seg(t, t1 - 0.2, t1));
  tf(b.g, lerp(-900, x, pin), y - 260 * pout, 1, lerp(-6, -1.5, pin));
}

// ---------------- Characters ----------------
// Bean-shaped model character (origin = centre of the feet)
function bean(parent, o) {
  const { color, belly = null, antenna = K.white, name = null, kind = 'bot', tagCol = K.ol } = o;
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  const mkArm = (sx) => { const a = el('g', {}, body); el('rect', { x: -14, y: -4, width: 28, height: 70, rx: 14, fill: color, ...SO }, a); el('circle', { cx: 0, cy: 70, r: 17, fill: K.white, ...SO, 'stroke-width': 6 }, a); return a; };
  const armL = mkArm(-1), armR = mkArm(1);
  for (const x of [-34, 34]) el('ellipse', { cx: x, cy: -8, rx: 30, ry: 15, fill: color, ...SO }, body);
  if (kind === 'llama') {
    for (const sx of [-1, 1]) el('path', { d: `M ${sx * 30} -160 C ${sx * 34} -230 ${sx * 60} -250 ${sx * 64} -210 C ${sx * 66} -180 ${sx * 56} -160 ${sx * 50} -150 Z`, fill: color, ...SO }, body);
  }
  el('path', { d: 'M -80 -20 C -88 -112 -52 -172 0 -172 C 52 -172 88 -112 80 -20 C 72 -2 -72 -2 -80 -20 Z', fill: color, ...SO }, body);
  if (belly) el('ellipse', { cx: 0, cy: -48, rx: 44, ry: 32, fill: belly }, body);
  if (kind === 'llama') {
    for (const [x, y, r] of [[-22, -168, 20], [0, -176, 22], [22, -168, 20]]) el('circle', { cx: x, cy: y, r, fill: K.white, ...SO, 'stroke-width': 6 }, body);
  } else if (antenna) {
    el('line', { x1: 0, y1: -172, x2: 0, y2: -214, stroke: K.ol, 'stroke-width': 7 }, body);
    el('circle', { cx: 0, cy: -220, r: 15, fill: antenna, ...SO, 'stroke-width': 6 }, body);
  }
  const eyes = el('g', {}, body);
  for (const x of [-28, 28]) { el('ellipse', { cx: x, cy: -112, rx: 11, ry: 16, fill: K.ol }, eyes); el('circle', { cx: x + 4, cy: -118, r: 4, fill: K.white }, eyes); }
  const eyesX = el('path', { d: 'M -40 -124 L -16 -100 M -16 -124 L -40 -100 M 16 -124 L 40 -100 M 40 -124 L 16 -100', stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, body);
  const eyesUp = el('path', { d: 'M -40 -108 Q -28 -124 -16 -108 M 16 -108 Q 28 -124 40 -108', stroke: K.ol, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, body);
  for (const x of [-54, 54]) el('ellipse', { cx: x, cy: -86, rx: 14, ry: 8, fill: K.pink, opacity: .85 }, body);
  const mC = el('path', { d: 'M -14 -82 Q 0 -70 14 -82', fill: 'none', stroke: K.ol, 'stroke-width': 6, 'stroke-linecap': 'round' }, body);
  const mO = el('g', {}, body);
  el('ellipse', { cx: 0, cy: -76, rx: 17, ry: 19, fill: K.ol }, mO);
  el('ellipse', { cx: 0, cy: -66, rx: 10, ry: 7, fill: K.red }, mO);
  let tag = null;
  if (name) {
    tag = el('g', {}, g);
    const w = measure(name, 34, F.round, 700) + 36;
    el('rect', { x: -w / 2, y: 16, width: w, height: 50, rx: 25, fill: tagCol, stroke: K.white, 'stroke-width': 4 }, tag);
    txt(tag, name, { x: 0, y: 52, 'font-size': 34, 'font-family': F.round, 'font-weight': 700, fill: K.white, 'text-anchor': 'middle' });
  }
  const c = { g, body, armL, armR, eyes, eyesX, eyesUp, mC, mO, tag };
  pose(c, {});
  return c;
}
// hey: 0..1 hands raised; open: mouth open; sq: squash; face: 'x' | 'up'
function pose(c, { hey = 0, open = false, sq = 1, lean = 0, face = null, blink = false, armsL = null, armsR = null }) {
  const aL = armsL ?? lerp(18, 158, hey), aR = armsR ?? lerp(18, 158, hey);
  c.armL.setAttribute('transform', `translate(-72 -98) rotate(${aL})`);
  c.armR.setAttribute('transform', `translate(72 -98) rotate(${-aR})`);
  c.body.setAttribute('transform', `rotate(${lean}) scale(${(1 / Math.sqrt(sq)).toFixed(3)} ${sq.toFixed(3)})`);
  show(c.mO, open); show(c.mC, !open);
  show(c.eyes, !face && !blink); show(c.eyesX, face === 'x'); show(c.eyesUp, face === 'up' || (blink && !face));
}
// Twins (Gemini): two small beans
function twins(parent) {
  const g = el('g', {}, parent);
  const a = el('g', { transform: 'translate(-52 0) scale(0.72)' }, g), b = el('g', { transform: 'translate(52 0) scale(0.72)' }, g);
  const c1 = bean(a, { color: K.gem1, antenna: K.yellow }), c2 = bean(b, { color: K.gem2, antenna: K.yellow });
  const tag = el('g', {}, g);
  const w = measure('Gemini', 34, F.round, 700) + 36;
  el('rect', { x: -w / 2, y: 16, width: w, height: 50, rx: 25, fill: K.ol, stroke: K.white, 'stroke-width': 4 }, tag);
  txt(tag, 'Gemini', { x: 0, y: 52, 'font-size': 34, 'font-family': F.round, 'font-weight': 700, fill: K.white, 'text-anchor': 'middle' });
  return { g, c1, c2, tag, twin: true };
}
function poseAny(c, o) { if (c.twin) { pose(c.c1, o); pose(c.c2, { ...o, lean: -(o.lean || 0) }); } else pose(c, o); }
const CAST = {
  gpt: (p) => bean(p, { color: K.gpt, belly: '#8BE3C4', antenna: K.white, name: 'GPT' }),
  claude: (p) => bean(p, { color: K.claude, belly: '#F6D3BE', antenna: K.cream, name: 'Claude' }),
  gemini: (p) => twins(p),
  llama: (p) => bean(p, { color: K.llama, belly: K.white, kind: 'llama', name: 'Llama' }),
  deepseek: (p) => bean(p, { color: K.seek, belly: '#C9D6FF', name: 'DeepSeek' }),
};
function smallBot(parent, col) { return bean(parent, { color: col, antenna: K.yellow }); }

// Human chess player (origin = feet)
function human(parent) {
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  el('path', { d: 'M -86 0 C -96 -100 -64 -160 0 -160 C 64 -160 96 -100 86 0 Z', fill: '#6C8EF5', ...SO }, body);
  el('path', { d: 'M -30 -160 L 0 -110 L 30 -160', fill: K.white, ...SO, 'stroke-width': 6 }, body);
  const head = el('g', {}, body);
  el('circle', { cx: 0, cy: -232, r: 76, fill: K.skin, ...SO }, head);
  el('path', { d: 'M -78 -236 C -84 -320 84 -320 78 -236 C 50 -270 -40 -276 -78 -236 Z', fill: K.ol }, head);
  const glasses = el('g', { fill: 'none', stroke: K.ol, 'stroke-width': 6 }, head);
  el('circle', { cx: -28, cy: -232, r: 20 }, glasses); el('circle', { cx: 28, cy: -232, r: 20 }, glasses); el('line', { x1: -8, y1: -232, x2: 8, y2: -232 }, glasses);
  const eyes = el('g', {}, head);
  for (const x of [-28, 28]) el('circle', { cx: x, cy: -232, r: 7, fill: K.ol }, eyes);
  const mC = el('path', { d: 'M -14 -196 Q 0 -188 14 -196', fill: 'none', stroke: K.ol, 'stroke-width': 6, 'stroke-linecap': 'round' }, head);
  const mO = el('ellipse', { cx: 0, cy: -190, rx: 14, ry: 18, fill: K.ol }, head);
  const sweat = el('path', { d: 'M 70 -280 q -14 22 0 30 q 14 -8 0 -30 Z', fill: K.sky, ...SO, 'stroke-width': 4 }, head);
  const arm = el('g', {}, g);
  const aO = el('line', { stroke: K.ol, 'stroke-width': 44, 'stroke-linecap': 'round' }, arm);
  const aI = el('line', { stroke: '#6C8EF5', 'stroke-width': 30, 'stroke-linecap': 'round' }, arm);
  const hand = el('circle', { r: 22, fill: K.skin, ...SO, 'stroke-width': 6 }, arm);
  return { g, body, head, eyes, mC, mO, sweat, arm: { aO, aI, hand } };
}
function setArm(a, x1, y1, x2, y2) {
  for (const l of [a.aO, a.aI]) { l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); }
  a.hand.setAttribute('cx', x2); a.hand.setAttribute('cy', y2);
}
function robotDB(parent) {
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  el('rect', { x: -100, y: -200, width: 200, height: 200, rx: 26, fill: K.dblue, ...SO }, body);
  const lights = [0, 1, 2].map(i => el('circle', { cx: -40 + i * 40, cy: -120, r: 12, fill: K.yellow, ...SO, 'stroke-width': 5 }, body));
  el('rect', { x: -60, y: -70, width: 120, height: 34, rx: 8, fill: '#1E3F8F', ...SO, 'stroke-width': 5 }, body);
  const head = el('g', {}, body);
  el('rect', { x: -120, y: -380, width: 240, height: 170, rx: 28, fill: '#DDE3EE', ...SO }, head);
  el('rect', { x: -96, y: -360, width: 192, height: 126, rx: 16, fill: '#16233F', ...SO, 'stroke-width': 5 }, head);
  const face = el('g', { fill: K.lime }, head);
  el('rect', { x: -60, y: -330, width: 30, height: 30 }, face); el('rect', { x: 30, y: -330, width: 30, height: 30 }, face);
  const mouth = el('rect', { x: -40, y: -276, width: 80, height: 12 }, face);
  el('line', { x1: 0, y1: -380, x2: 0, y2: -420, stroke: K.ol, 'stroke-width': 7 }, head);
  const bulb = el('circle', { cx: 0, cy: -428, r: 14, fill: K.red, ...SO, 'stroke-width': 6 }, head);
  const arm = el('g', {}, g);
  const aO = el('line', { stroke: K.ol, 'stroke-width': 40, 'stroke-linecap': 'round' }, arm);
  const aI = el('line', { stroke: K.gray, 'stroke-width': 26, 'stroke-linecap': 'round' }, arm);
  const hand = el('circle', { r: 24, fill: K.dblue, ...SO, 'stroke-width': 6 }, arm);
  return { g, body, lights, bulb, mouth, arm: { aO, aI, hand } };
}
function robotAG(parent) {
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  el('path', { d: 'M -80 0 C -90 -80 -60 -150 0 -150 C 60 -150 90 -80 80 0 Z', fill: K.white, ...SO }, body);
  el('rect', { x: -44, y: -100, width: 88, height: 20, rx: 10, fill: K.blue }, body);
  const head = el('g', {}, body);
  el('circle', { cx: 0, cy: -270, r: 118, fill: K.white, ...SO }, head);
  el('circle', { cx: 0, cy: -262, r: 58, fill: K.ol }, head);
  const pupil = el('circle', { cx: 12, cy: -276, r: 16, fill: K.white }, head);
  el('path', { d: 'M -100 -330 Q 0 -410 100 -330', fill: 'none', stroke: K.blue, 'stroke-width': 14, 'stroke-linecap': 'round' }, head);
  const arm = el('g', {}, g);
  const aO = el('line', { stroke: K.ol, 'stroke-width': 40, 'stroke-linecap': 'round' }, arm);
  const aI = el('line', { stroke: K.white, 'stroke-width': 26, 'stroke-linecap': 'round' }, arm);
  const hand = el('circle', { r: 24, fill: K.white, ...SO, 'stroke-width': 6 }, arm);
  return { g, body, pupil, arm: { aO, aI, hand } };
}
function robotT(parent) {
  // Transformer boxing robot (origin = feet)
  const g = el('g', {}, parent);
  const body = el('g', {}, g);
  for (const x of [-50, 50]) el('rect', { x: x - 26, y: -60, width: 52, height: 64, rx: 12, fill: K.gray, ...SO }, body);
  el('rect', { x: -120, y: -300, width: 240, height: 250, rx: 36, fill: K.yellow, ...SO }, body);
  el('rect', { x: -70, y: -220, width: 140, height: 90, rx: 14, fill: K.ol }, body);
  txt(body, '注意力', { x: 0, y: -160, 'font-size': 36, 'font-family': F.sans, 'font-weight': 900, fill: K.lime, 'text-anchor': 'middle' });
  const head = el('g', {}, body);
  el('rect', { x: -100, y: -470, width: 200, height: 160, rx: 40, fill: K.yellow, ...SO }, head);
  el('rect', { x: -76, y: -430, width: 152, height: 60, rx: 30, fill: K.ol }, head);
  const visor = el('g', { fill: '#5CF2FF' }, head);
  el('circle', { cx: -34, cy: -400, r: 14 }, visor); el('circle', { cx: 34, cy: -400, r: 14 }, visor);
  el('path', { d: 'M -20 -345 Q 0 -332 20 -345', fill: 'none', stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, head);
  el('line', { x1: 0, y1: -470, x2: 0, y2: -510, stroke: K.ol, 'stroke-width': 7 }, head);
  el('circle', { cx: 0, cy: -516, r: 14, fill: K.red, ...SO, 'stroke-width': 6 }, head);
  const mkGlove = () => { const gl = el('g', {}, g); el('path', { d: 'M -46 -40 C -70 -40 -76 40 -40 46 L 40 46 C 70 40 70 -40 40 -46 Z', fill: K.red, ...SO }, gl); el('path', { d: 'M -20 -40 C -40 -20 -40 10 -20 20', fill: 'none', stroke: K.ol, 'stroke-width': 6 }, gl); return gl; };
  const armB = el('g', {}, g);
  const aO = el('line', { stroke: K.ol, 'stroke-width': 42, 'stroke-linecap': 'round' }, armB);
  const aI = el('line', { stroke: K.gray, 'stroke-width': 28, 'stroke-linecap': 'round' }, armB);
  const glove = mkGlove();
  const glove2 = mkGlove();
  return { g, body, visor, arm: { aO, aI }, glove, glove2 };
}

// ---------------- Chessboard (perspective quad) ----------------
const BQ = { tl: [700, 600], tr: [1220, 600], br: [1330, 770], bl: [590, 770] };
function quad(u, v) {
  const top = [lerp(BQ.tl[0], BQ.tr[0], u), lerp(BQ.tl[1], BQ.tr[1], u)];
  const bot = [lerp(BQ.bl[0], BQ.br[0], u), lerp(BQ.bl[1], BQ.br[1], u)];
  return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)];
}
function quadPoly(u0, v0, u1, v1) { return [quad(u0, v0), quad(u1, v0), quad(u1, v1), quad(u0, v1)].map(p => p.map(n => n.toFixed(1)).join(',')).join(' '); }
function pawn(parent, col, king = false) {
  const g = el('g', {}, parent);
  const h = king ? 1.35 : 1;
  el('path', { d: `M -26 0 L 26 0 L 20 -14 L 10 -18 C 16 ${-40 * h} 10 ${-52 * h} 0 ${-52 * h} C -10 ${-52 * h} -16 ${-40 * h} -10 -18 L -20 -14 Z`, fill: col, ...SO, 'stroke-width': 5 }, g);
  el('circle', { cx: 0, cy: -58 * h, r: 13, fill: col, ...SO, 'stroke-width': 5 }, g);
  if (king) el('path', { d: `M 0 ${-92} L 0 ${-72} M -9 ${-84} L 9 ${-84}`, stroke: K.ol, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  return g;
}

// ============================================================
// 舞台 (Stage; assemble.py finds the end of the character block by this "// 舞台" line, so the Chinese prefix stays)
// ============================================================
const world = document.getElementById('world');
const cam = document.getElementById('cam');
const flash = document.getElementById('flash');
const fade = document.getElementById('fade');
const scenes = [];
function scene(t0, t1, build) {
  const g = el('g', {}, world);
  const s = { g, t0, t1, fx: [] };
  s.update = build(g, s);
  scenes.push(s);
  return s;
}

// Level title card
function card(bar0, num, name, years, col, col2, icon) {
  scene(at(bar0), at(bar0 + 2), (g) => {
    bg(g, col);
    stripes(g, col2, 70, -25);
    const panel = el('g', {}, g);
    el('rect', { x: -620 + 14, y: -250 + 14, width: 1240, height: 500, rx: 50, fill: K.ol }, panel);
    el('rect', { x: -620, y: -250, width: 1240, height: 500, rx: 50, fill: K.cream, ...SO, 'stroke-width': 10 }, panel);
    const tagw = measure(num, 52, F.round, 700) + 60;
    el('rect', { x: -tagw / 2, y: -290, width: tagw, height: 80, rx: 40, fill: col, ...SO }, panel);
    gtext(panel, num, 0, -232, 52, { family: F.round, weight: 700, sw: 10 });
    const ic = el('g', { transform: 'translate(-450 40)' }, panel); icon(ic);
    const nsz = Math.min(150, 150 * 700 / measure(name, 150, F.sans, 900));
    txt(panel, name, { x: 150, y: 50, 'font-size': nsz, 'font-family': F.sans, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
    txt(panel, years, { x: 150, y: 150, 'font-size': 56, 'font-family': F.round, 'font-weight': 700, fill: col, 'text-anchor': 'middle', stroke: K.ol, 'stroke-width': 5, 'paint-order': 'stroke' });
    const t0 = at(bar0), t1 = at(bar0 + 2);
    ev(t0, 'whoosh'); ev(t0 + 0.02, 'card');
    return (t) => {
      const pin = E.back(seg(t, t0, t0 + 0.4)), pout = E.in(seg(t, t1 - 0.28, t1));
      tf(panel, lerp(2600, 960, pin) - 2000 * pout, 560 + Math.sin(t * 4) * 4, 1 + 0.02 * Math.exp(-frac(t) * 6), lerp(8, -2, pin));
      ic.setAttribute('transform', `translate(-450 ${40 + hopY(t, 26)}) rotate(${Math.sin(t / B * Math.PI) * 6})`);
    };
  });
}

function buildAll() {
  // ================= Title bar 0–3 =================
  scene(at(0), at(4), (g, s) => {
    bg(g, K.yellow);
    const rays = raysEl(g, 28, '#FFE37A');
    dots(g, 'rgba(255,255,255,0.25)', 90, 12);
    const cast = ['llama', 'gemini', 'gpt', 'claude', 'deepseek'].map((k, i) => {
      const w = el('g', {}, g); const c = CAST[k](w);
      return { w, c, x: 480 + i * 290, k };
    });
    const dbw = el('g', {}, g); const db = robotDB(dbw);
    const title = chars(g, 'AI 进化节拍', { x: 960, y: 400, size: 200, family: F.sans, fill: K.white, anchor: 'middle', stroke: K.ol, sw: 26, ls: 6 });
    const sub = chars(g, 'RHYTHM OF AI · 1997 → 2026', { x: 960, y: 530, size: 64, family: F.round, weight: 700, fill: K.ol, anchor: 'middle', ls: 2 });
    const nums = ['1', '2', '3', '4'].map(n => { const ng = el('g', {}, g); gtext(ng, n, 0, 110, 340, { family: F.round, weight: 700, fill: K.red, sw: 36 }); return ng; });
    ev(at(0), 'slam'); punch(at(0), 0.03);
    title.items.forEach((_, i) => i && ev(at(0) + 0.1 + i * 0.07, 'pop', { f: 500 + i * 60 }));
    ev(at(1), 'v:title');
    for (let i = 0; i < 4; i++) { ev(at(3, i), `v:count${i + 1}`); punch(at(3, i), 0.02); }
    return (t) => {
      rays.setAttribute('transform', `translate(960 560) rotate(${t * 12})`);
      charsPop(title, t, at(0), 0.07, 0.35, 120);
      if (t > at(0, 3)) title.items.forEach((it, i) => { const y = hopY(t + i * 0.05, 14); tf(it.g, it.x, it.y + y); });
      charsPop(sub, t, at(0, 2), 0.02, 0.3, 30);
      const counting = t >= at(3);
      cast.forEach((c, i) => {
        const inP = E.back(seg(t, at(1) + i * B * 0.5, at(1) + i * B * 0.5 + 0.35));
        const y = 990 + (1 - inP) * 500;
        tf(c.w, c.x, y + (inP >= 1 ? hopY(t, 34) : 0), 0.92);
        poseAny(c.c, { hey: counting ? 1 : (frac(t) < 0.3 ? 0.4 : 0), open: frac(t) < 0.25, sq: 1 - 0.12 * Math.exp(-frac(t) * 16) });
      });
      op(dbw, t > at(2) ? 1 : 0);
      tf(dbw, 150, 1040 + (1 - E.back(seg(t, at(2), at(2) + 0.35))) * 500 + hopY(t, 20), 0.62);
      op(title.g, counting ? 1 - seg(t, at(3), at(3) + 0.15) : 1);
      op(sub.g, counting ? 1 - seg(t, at(3), at(3) + 0.15) : 1);
      nums.forEach((n, i) => {
        const t0 = at(3, i);
        op(n, t >= t0 && t < t0 + B ? 1 : 0);
        tf(n, 960, 400, E.back(seg(t, t0, t0 + 0.15)) * (1 + 0.15 * Math.exp(-(t - t0) * 10)), (i % 2 ? 6 : -6));
      });
    };
  });

  // ================= Level 1: Human vs Machine (人机棋局) bar 4–13 =================
  card(4, 'GAME 1', '人机棋局', '1997 – 2016', K.orange, '#FF9E5E', (p) => { const w = el('g', { transform: 'scale(2.2)' }, p); pawn(w, K.white, true); });
  scene(at(6), at(14), (g, s) => {
    bg(g, '#FFB870');
    stripes(g, '#FFA85A', 50, -20);
    el('rect', { x: 0, y: 880, width: 1920, height: 200, fill: '#E08A4A' }, g);
    el('line', { x1: 0, y1: 880, x2: 1920, y2: 880, stroke: K.ol, 'stroke-width': OW }, g);
    // Table and board
    el('polygon', { points: `560,590 1360,590 1400,790 520,790`, fill: K.woodD, ...SO }, g);
    el('rect', { x: 520, y: 790, width: 880, height: 40, fill: K.wood, ...SO }, g);
    for (const x of [570, 1330]) el('rect', { x, y: 830, width: 30, height: 120, fill: K.woodD, ...SO }, g);
    const chessB = el('g', {}, g), goB = el('g', {}, g);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) el('polygon', { points: quadPoly(i / 8, j / 8, (i + 1) / 8, (j + 1) / 8), fill: (i + j) % 2 ? '#B07A4F' : '#F6DDB5' }, chessB);
    el('polygon', { points: quadPoly(0, 0, 1, 1), fill: 'none', ...SO }, chessB);
    el('polygon', { points: quadPoly(0, 0, 1, 1), fill: '#E8B764', ...SO }, goB);
    for (let i = 0; i < 9; i++) {
      const a = quad(0.06 + i * 0.11, 0.06), b = quad(0.06 + i * 0.11, 0.94), c = quad(0.06, 0.06 + i * 0.11), d = quad(0.94, 0.06 + i * 0.11);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: K.ol, 'stroke-width': 3 }, goB);
      el('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1], stroke: K.ol, 'stroke-width': 3 }, goB);
    }
    const piecesG = el('g', {}, g);
    const hw = el('g', {}, g); const hu = human(hw);
    const dbw = el('g', {}, g); const db = robotDB(dbw);
    const agw = el('g', {}, g); const ag = robotAG(agw);
    const fxG = el('g', {}, g);
    // Move list: [bar, beat, who(h/a), u, v, special]
    const chessMoves = [[6, 0, 'h', 3, 5], [6, 2, 'a', 4, 2], [7, 0, 'h', 2, 5], [7, 2, 'a', 5, 2], [8, 0, 'h', 4, 4], [8, 2, 'a', 3, 3], [9, 0, 'h', 1, 6], [9, 1, 'a', 6, 3], [9, 2, 'a', 5, 5, 'mate']];
    const goMoves = [];
    const r = rng(8);
    for (let bar = 10; bar <= 12; bar++) for (let bt = 0; bt < 4; bt++) goMoves.push([bar, bt, bt % 2 ? 'a' : 'h', 1 + Math.floor(r() * 7), 1 + Math.floor(r() * 7)]);
    goMoves.push([13, 0, 'a', 4, 3, 'move37']);
    const moves = [];
    for (const m of chessMoves) {
      const [bar, bt, who, i, j, sp] = m; const t0 = at(bar, bt);
      const [x, y] = quad((i + 0.5) / 8, (j + 0.5) / 8);
      const pg = el('g', {}, piecesG);
      pawn(pg, who === 'h' ? K.white : '#3A3A3A', sp === 'mate');
      moves.push({ t0, who, x, y, pg, kind: 'chess', sp });
      ev(t0, who === 'h' ? 'tock' : 'bleep'); punch(t0, who === 'h' ? 0.01 : 0.016);
      s.fx.push(burst(fxG, x, y - 30, t0, who === 'h' ? K.white : K.yellow, 0.6));
    }
    for (const m of goMoves) {
      const [bar, bt, who, i, j, sp] = m; const t0 = at(bar, bt);
      const [x, y] = quad(0.06 + i * 0.11, 0.06 + j * 0.11);
      const pg = el('g', {}, piecesG);
      el('ellipse', { cx: 0, cy: 0, rx: 24, ry: 15, fill: sp ? K.yellow : (who === 'h' ? K.white : '#2A2A2A'), ...SO, 'stroke-width': 5 }, pg);
      moves.push({ t0, who, x, y, pg, kind: 'go', sp });
      ev(t0, sp ? 'bigslam' : 'stone'); punch(t0, sp ? 0.05 : 0.01);
      s.fx.push(burst(fxG, x, y - 10, t0, sp ? K.yellow : K.white, sp ? 1.6 : 0.5));
    }
    ev(at(9, 2), 'v:gameover'); ev(at(13, 0), 'v:move37'); ev(at(10, 0), 'poof');
    ev(at(13, 2), 'v:whoa');
    const b1 = banner(g, '1997', '深蓝', '击败国际象棋世界冠军', K.dblue);
    const b2 = banner(g, '2016', 'AlphaGo', '4 : 1 战胜李世石', K.purple);
    const m37 = el('g', {}, g);
    gtext(m37, '第 37 手！', 0, 0, 120, { fill: K.yellow, sw: 20 });
    const poofG = el('g', {}, g);
    for (let i = 0; i < 7; i++) el('circle', { cx: Math.cos(i) * 90, cy: Math.sin(i * 1.7) * 70, r: 70, fill: K.white, ...SO, 'stroke-width': 6 }, poofG);
    s.fx.push(judge(g, 'Perfect!', 960, 300, at(13, 3), K.pink, 0.9));
    const HS = [520, 760], RS = [1420, 720];
    return (t) => {
      const goMode = t >= at(10);
      show(chessB, !goMode); show(goB, goMode);
      moves.forEach(m => {
        const vis = t >= m.t0 && (m.kind === 'go' ? goMode : !goMode);
        show(m.pg, vis);
        if (!vis) return;
        let rot = 0;
        if (m.sp === 'mate' && t > at(9, 3)) rot = -80 * E.out(seg(t, at(9, 3), at(9, 3) + 0.3));
        const sc = E.back(seg(t, m.t0, m.t0 + 0.18)) * hitSq(t, m.t0, 0.25);
        tf(m.pg, m.x, m.y, sc * (m.sp === 'move37' ? 1.4 : 1), rot);
      });
      // Arm: find this player's most recent / next move
      const armFor = (who) => {
        let best = null;
        for (const m of moves) if (m.who === who && t >= m.t0 - 0.2 && t < m.t0 + 0.3) best = m;
        return best;
      };
      const hm = armFor('h'), am = armFor('a');
      const reach = (m) => m ? (t < m.t0 ? E.out(seg(t, m.t0 - 0.2, m.t0)) : 1 - E.io(seg(t, m.t0 + 0.05, m.t0 + 0.3))) : 0;
      const hr = reach(hm), ar = reach(am);
      const hx = hm ? hm.x : 640, hy = hm ? hm.y - 20 : 700;
      setArm(hu.arm, HS[0] - 420, HS[1] - 930, lerp(HS[0] + 70, hx, hr) - 420, lerp(HS[1] + 80, hy, hr) - 930);
      const ax = am ? am.x : 1280, ay = am ? am.y - 20 : 700;
      setArm((goMode ? ag : db).arm, RS[0] - 1500, RS[1] - 930, lerp(RS[0] - 70, ax, ar) - 1500, lerp(RS[1] + 80, ay, ar) - 930);
      // Human: more and more flustered
      const panic = t > at(9, 2) && t < at(10) || t > at(13);
      show(hu.mO, panic); show(hu.mC, !panic);
      op(hu.sweat, t > at(8) ? 1 : 0);
      hu.sweat.setAttribute('transform', `translate(0 ${(t * 60) % 24})`);
      tf(hw, 420, 930 + hopY(t, 10), 1);
      hu.body.setAttribute('transform', `translate(0 0) scale(1 ${hitSq(t, hm ? hm.t0 : -9, 0.06)}) rotate(${panic ? Math.sin(t * 30) * 3 : 0})`);
      // Robot
      show(dbw, !goMode); show(agw, goMode);
      const botY = 930 + hopY(t, 12);
      tf(dbw, 1500, botY, 1); tf(agw, 1500, botY, 1, 0);
      db.lights.forEach((l, i) => l.setAttribute('fill', Math.floor(t / B) % 3 === i ? K.lime : K.yellow));
      db.mouth.setAttribute('height', near(t, at(9, 2), 0, 0.6) ? 36 : 12);
      ag.pupil.setAttribute('cx', 12 + Math.sin(t * 3) * 10);
      // Smoke when players swap
      const pp = seg(t, at(10) - 0.12, at(10) + 0.3);
      op(poofG, pp > 0 && pp < 1 ? 1 - pp : 0); tf(poofG, 1500, 700, 0.6 + pp);
      bannerAnim(b1, t, at(6), at(10));
      bannerAnim(b2, t, at(10), at(14));
      op(m37, t >= at(13) ? 1 : 0); tf(m37, 1350, 430, E.back(seg(t, at(13), at(13) + 0.2)), -5);
      s.fx.forEach(f => f(t));
    };
  });

  // ================= Level 2: Transformer factory bar 14–23 =================
  card(14, 'GAME 2', '注意力工厂', '2017 – 2020', K.teal, '#56C7BF', (p) => { const w = el('g', { transform: 'scale(1.7)' }, p); el('path', { d: 'M -46 -40 C -70 -40 -76 40 -40 46 L 40 46 C 70 40 70 -40 40 -46 Z', fill: K.red, ...SO }, w); });
  scene(at(16), at(24), (g, s) => {
    bg(g, K.teal);
    const gears = [[260, 620, 170], [1760, 300, 130], [1640, 760, 90]].map(([x, y, r]) => {
      const gg = el('g', {}, g);
      el('path', { d: starPath(12, r, r * 0.82), fill: K.tealD }, gg);
      el('circle', { cx: 0, cy: 0, r: r * 0.35, fill: K.teal }, gg);
      return { gg, x, y };
    });
    el('rect', { x: 0, y: 850, width: 1920, height: 230, fill: '#2F6F75' }, g);
    el('rect', { x: 0, y: 840, width: 1920, height: 40, fill: '#555', ...SO }, g);
    const rollers = el('g', {}, g);
    for (let x = 20; x < 1960; x += 80) el('circle', { cx: x, cy: 860, r: 12, fill: K.gray, ...SO, 'stroke-width': 4 }, rollers);
    // "Sentence shelf" at the top
    el('rect', { x: 170, y: 490, width: 1180, height: 26, rx: 13, fill: K.tealD, ...SO, 'stroke-width': 6 }, g);
    const arcsG = el('g', {}, g);
    const wordsG = el('g', {}, g);
    const rbw = el('g', {}, g); const rb = robotT(rbw);
    const fxG = el('g', {}, g);
    const sentences = [['猫', '坐在', '垫子', '上'], ['注意力', '就是', '你的', '全部']];
    const slotX = [330, 610, 890, 1170];
    const words = [];
    sentences.forEach((sen, si) => sen.forEach((w, k) => {
      const t0 = at(16 + si * 2 + Math.floor(k / 2), (k % 2) * 2);
      const wg = el('g', {}, wordsG);
      const ww = Math.max(150, measure(w, 60, F.sans, 900) + 50);
      el('rect', { x: -ww / 2 + 7, y: -52 + 7, width: ww, height: 104, rx: 22, fill: K.ol }, wg);
      el('rect', { x: -ww / 2, y: -52, width: ww, height: 104, rx: 22, fill: [K.cream, K.pink, K.lime, K.sky][k], ...SO }, wg);
      txt(wg, w, { x: 0, y: 21, 'font-size': 60, 'font-family': F.sans, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
      words.push({ wg, t0, si, k, sx: slotX[k] });
      ev(t0 - B * 0.5, 'swish'); ev(t0, 'punch'); punch(t0, 0.03);
      s.fx.push(burst(fxG, 1010, 560, t0, K.yellow, 1));
    }));
    // Attention links: each new word connects to every word before it
    const arcs = [];
    words.forEach(w => words.filter(o => o.si === w.si && o.k < w.k).forEach(o => {
      const x1 = w.sx, x2 = o.sx, mid = (x1 + x2) / 2, h = 60 + Math.abs(x1 - x2) * 0.28;
      const p = el('path', { d: `M ${x1} 360 Q ${mid} ${360 - h} ${x2} 360`, fill: 'none', stroke: [K.yellow, K.pink, K.white][(w.k + o.k) % 3], 'stroke-width': 6 + ((w.k * 7 + o.k * 3) % 5) * 3, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, arcsG);
      arcs.push({ p, t0: w.t0 + 0.3, si: w.si });
    }));
    ev(at(16), 'v:attention'); ev(at(18), 'v:attention');
    // Pumping up: GPT box
    const boxG = el('g', {}, g);
    const boxIn = el('g', {}, boxG);
    el('rect', { x: -130, y: -220, width: 260, height: 220, rx: 40, fill: K.gpt, ...SO }, boxIn);
    for (const x of [-44, 44]) el('ellipse', { cx: x, cy: -130, rx: 13, ry: 19, fill: K.ol }, boxIn);
    el('path', { d: 'M -24 -80 Q 0 -60 24 -80', fill: 'none', stroke: K.ol, 'stroke-width': 7, 'stroke-linecap': 'round' }, boxIn);
    for (const x of [-80, 80]) el('ellipse', { cx: x, cy: -100, rx: 16, ry: 9, fill: K.pink }, boxIn);
    const boxLbl = gtext(boxIn, 'GPT-1', 0, -168, 44, { family: F.round, weight: 700, sw: 9 });
    const param = gtext(g, '', 0, 0, 64, { fill: K.yellow, sw: 12 });
    const pump = el('g', {}, g);
    el('rect', { x: -30, y: -200, width: 60, height: 200, rx: 10, fill: K.red, ...SO }, pump);
    const plunger = el('g', {}, pump);
    el('rect', { x: -8, y: -300, width: 16, height: 110, fill: K.gray, ...SO, 'stroke-width': 5 }, plunger);
    el('rect', { x: -70, y: -320, width: 140, height: 30, rx: 15, fill: K.ol }, plunger);
    el('path', { d: 'M 30 -30 C 120 -20 160 -60 200 -80', fill: 'none', stroke: K.ol, 'stroke-width': 12, 'stroke-linecap': 'round' }, pump);
    const pumps = [[20, 0, 0.9], [20, 2, 1.05], [21, 0, 1.3], [21, 2, 1.5], [22, 0, 1.85], [22, 2, 2.15], [23, 0, 2.6], [23, 1, 3.0], [23, 2, 3.6]].map(([bar, bt, sc]) => ({ t0: at(bar, bt), sc }));
    pumps.forEach(p => { ev(p.t0, 'pump'); punch(p.t0, 0.02); });
    ev(at(20), 'v:gpt1'); ev(at(21), 'v:gpt2'); ev(at(22), 'v:gpt3');
    const x1500 = el('g', {}, g); gtext(x1500, '× 1500', 0, 0, 170, { family: F.round, weight: 700, fill: K.red, sw: 24 });
    ev(at(23, 3), 'slam'); punch(at(23, 3), 0.04);
    const b1 = banner(g, '2017', 'Transformer', '论文《Attention Is All You Need》', K.purple);
    const b2 = banner(g, '2018–2020', 'GPT 越吹越大', '参数量涨了约 1500 倍', K.red);
    s.fx.push(judge(g, 'Perfect!', 1450, 250, at(19, 2) + 0.3, K.yellow, 0.9));
    const PX = 1000, PY = 560;
    return (t) => {
      gears.forEach((ge, i) => { const k = Math.floor(t / B) + E.out(Math.min(1, frac(t) * 4)); tf(ge.gg, ge.x, ge.y, 1, k * 15 * (i % 2 ? -1 : 1)); });
      rollers.setAttribute('transform', `translate(${-((t * 200) % 80)} 0)`);
      const pumpMode = t >= at(20);
      // Robot and fist
      let pm = null; for (const w of words) if (t >= w.t0 - 0.12 && t < w.t0 + 0.25) pm = w;
      const pr = pm ? (t < pm.t0 ? E.in(seg(t, pm.t0 - 0.08, pm.t0)) : 1 - E.io(seg(t, pm.t0 + 0.04, pm.t0 + 0.25))) : 0;
      tf(rbw, 1360, 900 + hopY(t, 12), 1);
      rb.body.setAttribute('transform', `scale(1 ${hitSq(t, pm ? pm.t0 : -9, 0.05)})`);
      const sx = 1260, sy = 700;
      const gx = lerp(1210, PX + 70, pr), gy = lerp(680, PY, pr);
      setArm({ aO: rb.arm.aO, aI: rb.arm.aI, hand: { setAttribute() {} } }, sx - 1360, sy - 900, gx - 1360, gy - 900);
      tf(rb.glove, gx - 1360, gy - 900, 1 + 0.15 * pr, 0);
      tf(rb.glove2, 1440 - 1360, 690 - 900 + Math.sin(t * 8) * 6, 0.9);
      show(rb.glove, !pumpMode); show(rb.arm.aO, !pumpMode); show(rb.arm.aI, !pumpMode);
      // Word blocks fly in → get punched → go up on the shelf
      words.forEach(w => {
        const t0 = w.t0;
        const cleared = t >= at(18) - 0.15 && w.si === 0;
        if (t < t0 - B * 0.8 || pumpMode) { op(w.wg, 0); return; }
        op(w.wg, cleared ? 1 - seg(t, at(18) - 0.15, at(18)) : 1);
        let x, y, rot = 0, sc = 1;
        if (t < t0) { const p = seg(t, t0 - B * 0.8, t0); x = lerp(-150, PX - 10, p); y = PY + 200 - Math.sin(p * Math.PI) * 260 - 200 * p; rot = p * 360; }
        else { const p = E.out(seg(t, t0, t0 + 0.3)); x = lerp(PX - 10, w.sx, p); y = lerp(PY, 420, p) - Math.sin(p * Math.PI) * 120; sc = hitSq(t, t0, 0.3); rot = (1 - p) * -30; }
        if (cleared) y -= 300 * seg(t, at(18) - 0.15, at(18));
        tf(w.wg, x, y, sc, rot);
      });
      arcs.forEach(a => {
        const vis = !pumpMode && t >= a.t0 && !(a.si === 0 && t >= at(18) - 0.15);
        op(a.p, vis ? 0.9 : 0);
        a.p.setAttribute('stroke-dashoffset', 1 - E.out(seg(t, a.t0, a.t0 + 0.25)));
      });
      // Pumping up
      show(boxG, pumpMode); show(pump, pumpMode); show(param, pumpMode);
      if (pumpMode) {
        let sc = 0.7, last = null;
        for (const p of pumps) if (t >= p.t0) { sc = p.sc; last = p; }
        const prevSc = pumps[pumps.indexOf(last) - 1]?.sc ?? 0.7;
        const ss = last ? lerp(prevSc, sc, E.elastic(seg(t, last.t0, last.t0 + 0.4))) : E.back(seg(t, at(20) - 0.2, at(20))) * 0.7;
        tf(boxG, 640, 845, ss);
        boxLbl.textContent = t >= at(22) ? 'GPT-3' : t >= at(21) ? 'GPT-2' : 'GPT-1';
        param.textContent = t >= at(22) ? '1750 亿参数' : t >= at(21) ? '15 亿参数' : '1.17 亿参数';
        const bb = seg(t, at(23), at(23) + 0.2);
        tf(param, 1000, 330 - 30 * Math.exp(-frac(t) * 8), 1.3, -3); op(param, 1 - bb);
        let down = 0; for (const p of pumps) if (t >= p.t0 - 0.12 && t < p.t0 + 0.25) down = t < p.t0 ? E.in(seg(t, p.t0 - 0.12, p.t0)) : 1 - E.out(seg(t, p.t0, p.t0 + 0.25));
        tf(pump, 1150, 850); plunger.setAttribute('transform', `translate(0 ${down * 90})`);
      }
      op(x1500, t >= at(23, 3) ? 1 : 0); tf(x1500, 1250, 450, E.back(seg(t, at(23, 3), at(23, 3) + 0.2)), -8);
      bannerAnim(b1, t, at(16), at(20));
      bannerAnim(b2, t, at(20), at(24));
      s.fx.forEach(f => f(t));
    };
  });

  // ================= Level 3: Chat choir (聊天合唱团) bar 24–33 =================
  card(24, 'GAME 3', '聊天合唱团', '2022 – 2023', K.purple, '#7C62C9', (p) => {
    const w = el('g', { transform: 'scale(2.2)' }, p);
    el('rect', { x: -18, y: -60, width: 36, height: 70, rx: 18, fill: K.gray, ...SO }, w); el('line', { x1: 0, y1: 10, x2: 0, y2: 50, stroke: K.ol, 'stroke-width': 8 }, w);
  });
  scene(at(26), at(34), (g, s) => {
    bg(g, K.purple);
    const spots = el('g', {}, g);
    const spotEls = [450, 770, 1090, 1410].map(x => el('path', { d: `M ${x - 40} -20 L ${x + 40} -20 L ${x + 170} 900 L ${x - 170} 900 Z`, fill: 'rgba(255,255,240,0.16)' }, spots));
    for (const sx of [-1, 1]) {
      const cx = sx < 0 ? 0 : 1920;
      let d = `M ${cx} 0 L ${cx + sx * 260} 0 `;
      for (let y = 0; y <= 900; y += 150) d += `Q ${cx + sx * 200} ${y + 75} ${cx + sx * 250} ${y + 150} `;
      d += `L ${cx} 900 Z`;
      el('path', { d, fill: K.red, ...SO }, g);
    }
    el('path', { d: 'M 0 0 L 1920 0 L 1920 90 Q 1760 150 1600 90 Q 1440 150 1280 90 Q 1120 150 960 90 Q 800 150 640 90 Q 480 150 320 90 Q 160 150 0 90 Z', fill: K.red, ...SO }, g);
    el('rect', { x: 0, y: 860, width: 1920, height: 220, fill: K.purpleD }, g);
    el('line', { x1: 0, y1: 860, x2: 1920, y2: 860, stroke: K.ol, 'stroke-width': OW }, g);
    const castG = el('g', {}, g);
    const X = { llama: 450, gemini: 770, gpt: 1090, claude: 1410 };
    const order = ['llama', 'gemini', 'gpt', 'claude'];
    const cast = {};
    order.forEach(k => { const w = el('g', {}, castG); cast[k] = { w, c: CAST[k](w) }; });
    const land = { gpt: at(26) - 0.3, llama: at(30, 0), claude: at(30, 2), gemini: at(31, 0) };
    const dates = { llama: '2023.2', claude: '2023.3', gemini: '2023.12' };
    const dateEls = {};
    for (const k of ['llama', 'claude', 'gemini']) { dateEls[k] = el('g', {}, g); gtext(dateEls[k], dates[k], 0, 0, 50, { family: F.round, weight: 700, fill: K.yellow, sw: 10 }); ev(land[k], 'land'); punch(land[k], 0.025); }
    // Rain of small models
    const botsG = el('g', {}, g);
    const bots = []; const r = rng(21);
    const botCols = [K.yellow, K.pink, K.lime, K.sky, K.orange, K.gray, '#FF6FD8', '#7DF9FF'];
    for (let i = 0; i < 12; i++) {
      const t0 = at(32) + i * B / 2;
      const w = el('g', {}, botsG); const c = smallBot(w, botCols[i % botCols.length]);
      bots.push({ w, c, t0, x: 200 + ((i * 523) % 1500), y: 950 + (i % 3) * 40 });
      ev(t0, 'pip', { f: 700 + (i % 6) * 110 });
    }
    // Audience
    const aud = el('g', {}, g);
    const heads = [];
    for (let i = 0; i < 16; i++) { const h = el('g', {}, aud); el('circle', { cx: 0, cy: 0, r: 58, fill: '#2B1F55' }, h); el('rect', { x: -70, y: 30, width: 140, height: 120, rx: 50, fill: '#2B1F55' }, h); heads.push({ h, x: 60 + i * 125, ph: i % 2 }); }
    // User counter
    const counter = el('g', {}, g);
    el('rect', { x: -250, y: -60, width: 500, height: 120, rx: 26, fill: K.ol, stroke: K.white, 'stroke-width': 5 }, counter);
    txt(counter, '用户', { x: -220, y: 18, 'font-size': 40, 'font-family': F.sans, 'font-weight': 900, fill: K.white });
    const cnt = txt(counter, '0', { x: 225, y: 22, 'font-size': 60, 'font-family': F.round, 'font-weight': 700, fill: K.lime, 'text-anchor': 'end' });
    // Call-and-response table
    const lead = [], echo = [], all = [];
    for (let bar = 26; bar <= 29; bar++) { lead.push(at(bar, 0), at(bar, 1)); echo.push(at(bar, 2), at(bar, 3)); }
    all.push(at(31, 2), at(31, 3), at(32, 0), at(32, 2), at(33, 0), at(33, 1), at(33, 2), at(33, 3));
    lead.forEach(t0 => { ev(t0, 'v:hey'); punch(t0, 0.015); });
    echo.forEach(t0 => { ev(t0, 'v:crowd'); punch(t0, 0.02); });
    all.forEach((t0, i) => { ev(t0, i === all.length - 1 ? 'v:heyBig' : 'v:heyAll'); punch(t0, i === all.length - 1 ? 0.05 : 0.02); });
    const b1 = banner(g, '2022.11', 'ChatGPT', '5 天用户破百万', K.gpt);
    const b2 = banner(g, '2023', '百模大战', '谁都想上台唱两句', K.red);
    const conf = []; const r2 = rng(4);
    for (let i = 0; i < 60; i++) conf.push({ el: el('rect', { x: -10, y: -6, width: 20, height: 12, fill: [K.yellow, K.pink, K.lime, K.sky, K.white][i % 5] }, g), x: r2() * 1920, vy: 300 + r2() * 500, vr: (r2() - .5) * 900, d: r2() * 0.3 });
    s.fx.push(judge(g, 'Perfect!', 960, 330, at(33, 3), K.yellow, 0.8));
    const isIn = (arr, t, w = 0.25) => arr.some(t0 => t >= t0 - 0.03 && t < t0 + w);
    return (t) => {
      const lh = isIn(lead, t), eh = isIn(echo, t), ah = isIn(all, t);
      order.forEach(k => {
        const { w, c } = cast[k];
        const l0 = land[k];
        if (t < l0 - 0.35) { op(w, 0); return; }
        op(w, 1);
        const fall = t < l0 ? E.in(seg(t, l0 - 0.35, l0)) : 1;
        const y = lerp(-400, 860, fall);
        const sq = hitSq(t, l0, 0.3) * (1 - 0.1 * Math.exp(-frac(t) * 14));
        const x = k === 'gpt' && t < at(30) ? 960 : X[k];
        tf(w, x, y + (fall >= 1 ? hopY(t, 18) : 0), 1.4);
        const hey = (k === 'gpt' && lh) || ah || (k !== 'gpt' && t >= at(30) && t < at(31, 2) && t >= l0 && eh && false);
        poseAny(c, { hey: hey ? 1 : 0, open: hey, sq: hey ? 1.08 : sq, lean: hey ? 0 : Math.sin(t / B * Math.PI) * 4 });
      });
      spotEls.forEach((sp, i) => { op(sp, i === 2 || t >= at(30) ? 1 : 0.15); sp.setAttribute('transform', i === 2 && t < at(30) ? 'translate(-130 0)' : ''); });
      heads.forEach(h => tf(h.h, h.x, 1040 - (eh || ah ? 60 * Math.exp(-frac(t) * 5) : 0) - (h.ph ? 10 : 0)));
      for (const k of ['llama', 'claude', 'gemini']) {
        const l0 = land[k];
        op(dateEls[k], t >= l0 && t < l0 + 2.2 ? 1 - seg(t, l0 + 1.9, l0 + 2.2) : 0);
        tf(dateEls[k], X[k], 440 - 30 * E.out(seg(t, l0, l0 + 0.4)), E.back(seg(t, l0, l0 + 0.2)));
      }
      bots.forEach(b => {
        if (t < b.t0 - 0.3) { op(b.w, 0); return; }
        op(b.w, 1);
        const fall = t < b.t0 ? E.in(seg(t, b.t0 - 0.3, b.t0)) : 1;
        tf(b.w, b.x, lerp(-200, b.y, fall) + (fall >= 1 ? hopY(t, 14) : 0), 0.45);
        pose(b.c, { hey: ah ? 1 : 0, open: ah, sq: hitSq(t, b.t0, 0.3) });
      });
      // Counter: jumps up a step with every audience response
      const n = echo.filter(t0 => t >= t0).length;
      const target = Math.round(1000000 * Math.pow(n / 8, 2));
      cnt.textContent = (n >= 8 ? 1000000 : target).toLocaleString('en-US');
      tf(counter, 1580, 190, t < at(30) ? E.back(seg(t, at(26), at(26) + 0.3)) : 1 - seg(t, at(30), at(30) + 0.2), 2);
      cnt.setAttribute('fill', n >= 8 ? K.yellow : K.lime);
      conf.forEach(c => {
        const tt = t - at(33, 3) - c.d;
        if (tt < 0) { op(c.el, 0); return; }
        op(c.el, 1); tf(c.el, c.x + Math.sin(tt * 4 + c.x) * 40, -40 + c.vy * tt, 1, c.vr * tt, Math.cos(tt * 10 + c.x));
      });
      bannerAnim(b1, t, at(26), at(30));
      bannerAnim(b2, t, at(30), at(34));
      s.fx.forEach(f => f(t));
    };
  });

  // ================= Level 4: Think it over & price war (想一想 · 价格战) bar 34–43 =================
  card(34, 'GAME 4', '想一想 · 价格战', '2024 – 2025', K.blue, '#6B93FF', (p) => {
    const w = el('g', { transform: 'scale(2.2)' }, p);
    el('circle', { cx: 0, cy: -20, r: 40, fill: K.yellow, ...SO }, w); el('rect', { x: -18, y: 16, width: 36, height: 30, rx: 6, fill: K.gray, ...SO }, w);
  });
  scene(at(36), at(40), (g, s) => {
    bg(g, K.sky);
    dots(g, 'rgba(255,255,255,0.35)', 80, 10);
    const board = el('g', {}, g);
    el('rect', { x: 460, y: 60, width: 1000, height: 230, rx: 16, fill: K.woodD, ...SO }, board);
    el('rect', { x: 480, y: 80, width: 960, height: 190, rx: 10, fill: K.chalk }, board);
    txt(board, '9.11 和 9.9，哪个大？', { x: 960, y: 200, 'font-size': 76, 'font-family': F.cute, fill: K.white, 'text-anchor': 'middle' });
    const X = [560, 960, 1360], cols = [K.pink, K.lime, K.orange];   // generic bots: no record says which models answered 9.11
    const cast = X.map((x, i) => { const w = el('g', {}, g); return { w, c: smallBot(w, cols[i]), x }; });
    const desks = el('g', {}, g);
    X.forEach(x => { el('rect', { x: x - 170, y: 820, width: 340, height: 60, rx: 10, fill: K.wood, ...SO }, desks); el('rect', { x: x - 150, y: 880, width: 300, height: 200, fill: K.woodD, ...SO }, desks); });
    const bubbles = X.map(x => {
      const bg2 = el('g', {}, g);
      el('circle', { cx: -90, cy: 150, r: 14, fill: K.white, ...SO, 'stroke-width': 5 }, bg2);
      el('circle', { cx: -60, cy: 110, r: 22, fill: K.white, ...SO, 'stroke-width': 5 }, bg2);
      el('path', { d: 'M -120 40 C -150 -20 -80 -70 -30 -50 C 0 -90 80 -80 90 -40 C 150 -40 150 40 100 50 C 90 90 -80 100 -120 40 Z', fill: K.white, ...SO, 'stroke-width': 6 }, bg2);
      const ds = [0, 1, 2].map(i => el('circle', { cx: -50 + i * 50, cy: 0, r: 16, fill: K.ol }, bg2));
      const bulb = el('g', {}, bg2);
      el('circle', { cx: 0, cy: -6, r: 38, fill: K.yellow, ...SO, 'stroke-width': 6 }, bulb); el('rect', { x: -16, y: 28, width: 32, height: 22, rx: 5, fill: K.gray, ...SO, 'stroke-width': 5 }, bulb);
      const wrong = el('g', {}, bg2); gtext(wrong, '9.11！', 0, 18, 58, { family: F.round, weight: 700, fill: K.red, sw: 9 });
      const right = el('g', {}, bg2); gtext(right, '9.9 ✓', 0, 18, 58, { family: F.round, weight: 700, fill: K.green, sw: 9 });
      return { g: bg2, ds, bulb, wrong, right, x };
    });
    const fxG = el('g', {}, g);
    // Beats: bar36 blurts out an answer (wrong), bar37 keeps thinking, bar38 works it out (right), bar39 celebrates
    for (const bar of [36, 37, 38]) for (let b = 0; b < 3; b++) ev(at(bar, b), 'tick');
    ev(at(36, 3), 'buzz'); ev(at(36, 3), 'v:wrong');
    ev(at(37, 3), 'tick');
    ev(at(38, 3), 'ding'); ev(at(38, 3), 'v:aha'); punch(at(38, 3), 0.03);
    for (let b = 0; b < 4; b++) { ev(at(39, b), 'pop', { f: 800 + b * 120 }); punch(at(39, b), 0.015); }
    X.forEach(x => s.fx.push(burst(fxG, x, 360, at(38, 3), K.yellow, 1)));
    const cross = el('g', {}, g); gtext(cross, '✗', 0, 0, 260, { fill: K.red, sw: 26 });
    const b1 = banner(g, '2024', '推理模型', '学会先想，再回答', K.orange);
    s.fx.push(judge(g, 'Perfect!', 960, 480, at(39, 3), K.pink, 0.7));
    return (t) => {
      const bar = Math.floor(t / BARL), bt = Math.floor(frac(t / 4 * 4 / 1) * 0) ;
      const beatIdx = Math.floor((t / B)) - bar * 4;
      cast.forEach((c, i) => {
        tf(c.w, c.x, 830 + hopY(t, 8), 1.0);
        const cheer = t >= at(38, 3);
        const wrong = t >= at(36, 3) && t < at(37);
        poseAny(c.c, { hey: cheer ? 1 : (beatIdx < 3 ? 0.15 : 0.5), open: cheer || wrong, face: wrong ? 'x' : (t < at(38, 3) && beatIdx < 3 ? 'up' : null), sq: hitSq(t, at(38, 3), 0.2), lean: cheer ? Math.sin(t / B * Math.PI) * 8 : Math.sin(t * 2 + i) * 3 });
      });
      bubbles.forEach(b => {
        tf(b.g, b.x + 140, 470, 1);
        const inBar = t < at(39);
        const n = beatIdx < 3 ? beatIdx + 1 : 3;
        const answering = beatIdx === 3 && (bar === 36 || bar === 38);
        b.ds.forEach((d, i) => { show(d, inBar && !answering && i < n); d.setAttribute('transform', `translate(0 ${-10 * Math.exp(-frac(t) * 10)})`); });
        show(b.bulb, t >= at(38, 3));
        b.bulb.setAttribute('transform', `translate(0 ${-150 + (t >= at(39) ? hopY(t, 20) : 0)}) scale(${E.back(seg(t, at(38, 3), at(38, 3) + 0.2))})`);
        show(b.wrong, bar === 36 && beatIdx === 3);
        show(b.right, bar === 38 && beatIdx === 3 || t >= at(39));
        if (t >= at(39)) b.right.setAttribute('transform', 'translate(0 30)');
        else b.right.removeAttribute('transform');
      });
      op(cross, t >= at(36, 3) && t < at(37) ? 1 : 0); tf(cross, 960, 640, E.back(seg(t, at(36, 3), at(36, 3) + 0.15)));
      bannerAnim(b1, t, at(36), at(40), 56, 330);
      s.fx.forEach(f => f(t));
    };
  });
  scene(at(40), at(44), (g, s) => {
    bg(g, K.red);
    stripes(g, '#FF7074', 60, -30);
    el('rect', { x: 0, y: 880, width: 1920, height: 200, fill: '#C8383D' }, g);
    el('line', { x1: 0, y1: 880, x2: 1920, y2: 880, stroke: K.ol, 'stroke-width': OW }, g);
    // Price tags
    const sign = el('g', {}, g);
    el('rect', { x: -16, y: -260, width: 32, height: 260, fill: K.gray, ...SO }, sign);
    const signBoard = el('g', {}, sign);
    el('rect', { x: -200, y: -470, width: 400, height: 230, rx: 26, fill: K.white, ...SO }, signBoard);
    txt(signBoard, '每百万 token 输出', { x: 0, y: -420, 'font-size': 30, 'font-family': F.sans, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
    gtext(signBoard, '$60', 0, -300, 120, { family: F.round, weight: 700, fill: K.ol, stroke: K.white, sw: 0 });
    txt(signBoard, 'o1', { x: 0, y: -256, 'font-size': 30, 'font-family': F.round, 'font-weight': 700, fill: '#888', 'text-anchor': 'middle' });
    const cracks = el('path', { d: 'M -160 -450 L -80 -360 L -120 -300 L -40 -250 M 150 -460 L 90 -380 L 130 -320', fill: 'none', stroke: K.ol, 'stroke-width': 6 }, signBoard);
    const sign2 = el('g', {}, g);
    el('rect', { x: -16, y: -200, width: 32, height: 200, fill: K.gray, ...SO }, sign2);
    el('rect', { x: -170, y: -380, width: 340, height: 200, rx: 26, fill: K.lime, ...SO }, sign2);
    txt(sign2, 'DeepSeek-R1', { x: 0, y: -330, 'font-size': 32, 'font-family': F.round, 'font-weight': 700, fill: K.ol, 'text-anchor': 'middle' });
    gtext(sign2, '$2.19', 0, -225, 100, { family: F.round, weight: 700, fill: K.ol, stroke: K.lime, sw: 0 });
    const ww = el('g', {}, g); const wh = CAST.deepseek(ww);
    const hammer = el('g', {}, g);
    el('rect', { x: -12, y: -330, width: 24, height: 330, rx: 10, fill: K.woodD, ...SO }, hammer);
    el('rect', { x: -90, y: -420, width: 180, height: 110, rx: 22, fill: K.gray, ...SO }, hammer);
    const others = ['gpt', 'claude', 'gemini'].map((k, i) => { const w = el('g', {}, g); return { w, c: CAST[k](w), x: 1480 + i * 150 }; });
    const fxG = el('g', {}, g);
    const slams = [at(40, 2), at(41, 0), at(41, 2), at(42, 0)];
    slams.forEach((t0, i) => { ev(t0, 'hammer'); punch(t0, i === 3 ? 0.05 : 0.03); s.fx.push(burst(fxG, 560, 460, t0, K.yellow, i === 3 ? 1.6 : 1)); });
    ev(at(40, 0), 'land'); ev(at(42, 2), 'v:whoa'); ev(at(43, 0), 'slam'); punch(at(43, 0), 0.04);
    ev(at(42, 0), 'v:cheaper');
    const ratio = el('g', {}, g); gtext(ratio, '≈ 1/27', 0, 0, 170, { family: F.round, weight: 700, fill: K.yellow, sw: 24 });
    const b1 = banner(g, '2025.1', 'DeepSeek-R1', '开源，输出价约为 o1 的 1/27', K.seek);
    s.fx.push(judge(g, 'Perfect!', 1560, 330, at(43, 2), K.yellow, 0.8));
    return (t) => {
      const squash = slams.filter(t0 => t >= t0).length;
      const flat = t >= at(42);
      const sgY = 880;
      const ssq = lerp(1, 0.55, squash / 4) * hitSq(t, slams[Math.max(0, squash - 1)] ?? -9, 0.2);
      tf(sign, 560, sgY, 1);
      signBoard.setAttribute('transform', `translate(0 ${-(-470 + 240) * (1 - ssq) * 0}) scale(1 ${flat ? 0.18 : ssq}) `);
      signBoard.setAttribute('transform', `translate(0 ${(1 - (flat ? 0.18 : ssq)) * -240}) scale(1 ${flat ? 0.18 : ssq})`);
      op(cracks, squash >= 1 ? 1 : 0);
      op(sign2, t >= at(42) ? 1 : 0);
      tf(sign2, 900, sgY + (1 - E.back(seg(t, at(42), at(42) + 0.3))) * 400, 1, Math.sin(t * 6) * 2);
      // Whale + hammer
      tf(ww, 1150, lerp(-300, 880, E.in(seg(t, at(40) - 0.3, at(40)))) + hopY(t, 10), 1.1);
      let hr = 0; // 0 raised, 1 slammed down
      let nextS = slams.find(t0 => t < t0 + 0.25);
      if (nextS !== undefined) hr = t < nextS ? E.in(seg(t, nextS - 0.16, nextS)) : 1 - E.out(seg(t, nextS + 0.05, nextS + 0.25));
      const ang = lerp(20, -58, hr);
      hammer.setAttribute('transform', `translate(1070 700) rotate(${ang})`);
      op(hammer, t >= at(40) - 0.05 && t < at(42, 2) ? 1 : 0);
      pose(wh, { hey: t >= at(42, 2) ? 1 : 0.2, open: hr > 0.8 || t >= at(42, 2), sq: hitSq(t, at(40), 0.3) });
      others.forEach((o, i) => {
        tf(o.w, o.x, 880 + hopY(t + i * 0.1, 8), 0.6);
        const shock = t >= at(42, 2);
        poseAny(o.c, { hey: shock ? 0.7 : 0, open: shock, face: shock ? 'x' : null, sq: hitSq(t, at(42, 2), 0.25) });
      });
      op(ratio, t >= at(43) ? 1 : 0); tf(ratio, 1000, 330, E.back(seg(t, at(43), at(43) + 0.2)), -6);
      bannerAnim(b1, t, at(40), at(44));
      s.fx.forEach(f => f(t));
    };
  });

  // ================= Remix bar 44–52 =================
  scene(at(44), at(45), (g) => {
    bg(g, K.ol);
    const rays = raysEl(g, 24, '#333');
    const tt = chars(g, 'REMIX!', { x: 960, y: 620, size: 300, family: F.round, weight: 700, fill: K.yellow, anchor: 'middle', stroke: K.red, sw: 30, ls: 10 });
    ev(at(44), 'v:remix'); ev(at(44), 'slam'); punch(at(44), 0.04);
    return (t) => { rays.setAttribute('transform', `translate(960 560) rotate(${t * 40})`); charsPop(tt, t, at(44), 0.04, 0.25, 120); };
  });
  scene(at(45), at(53), (g, s) => {
    const BG = [K.orange, K.teal, K.purple, K.sky, '#FFB870', K.red, K.yellow, K.navy];
    const bgR = bg(g, BG[0]);
    const pat = dots(g, 'rgba(255,255,255,0.18)', 80, 12);
    const labels = ['2025 · 智能体', '多模态', '大合唱', '想一想', '人机对弈', '价格战', '一起跳', '2026 · ？'];
    const lbl = el('g', {}, g);
    const lblT = gtext(lbl, '', 0, 0, 90, { family: F.sans, sw: 16 });
    const parts = labels.map(() => el('g', {}, g));
    const fxG = el('g', {}, g);
    // 0 Agents: Claude typing code
    const p0 = parts[0];
    const cw = el('g', {}, p0); const cl = CAST.claude(cw);
    const lap = el('g', {}, p0);
    el('rect', { x: -300, y: -330, width: 600, height: 360, rx: 24, fill: K.ol }, lap);
    el('rect', { x: -276, y: -306, width: 552, height: 312, rx: 12, fill: '#1E2A44' }, lap);
    el('path', { d: 'M -360 30 L 360 30 L 320 80 L -320 80 Z', fill: K.gray, ...SO }, lap);
    const codeLines = [0, 1, 2, 3, 4, 5, 6].map(i => el('rect', { x: -250, y: -286 + i * 40, width: 0, height: 20, rx: 10, fill: [K.lime, K.pink, K.sky, K.yellow][i % 4] }, lap));
    for (let i = 0; i < 8; i++) { ev(at(45) + i * B / 2, 'clack'); }
    // 1 Multimodal: boxing icon
    const p1 = parts[1];
    const rw = el('g', {}, p1); const rb = robotT(rw);
    const icons = ['🖼', '♪', '▶', '👁'];
    const iconEls = icons.map((ic, i) => { const w = el('g', {}, p1); el('rect', { x: -70, y: -70, width: 140, height: 140, rx: 30, fill: [K.pink, K.yellow, K.lime, K.sky][i], ...SO }, w); gtext(w, ic, 0, 30, 80, { sw: 0, fill: K.ol, family: F.round }); return w; });
    for (let i = 0; i < 4; i++) { ev(at(46, i), 'punch'); punch(at(46, i), 0.025); s.fx.push(burst(fxG, 900, 560, at(46, i), K.yellow, 0.9)); }
    // 2 Big chorus: five characters say Hey in turn
    const p2 = parts[2];
    const five = ['llama', 'gemini', 'gpt', 'claude', 'deepseek'].map((k, i) => { const w = el('g', {}, p2); return { w, c: CAST[k](w), x: 360 + i * 300 }; });
    for (let i = 0; i < 4; i++) { ev(at(47, i), i === 3 ? 'v:heyAll' : 'v:hey'); punch(at(47, i), 0.02); }
    // 3 Think it over
    const p3 = parts[3];
    const tw = el('g', {}, p3); const tc = CAST.gpt(tw);
    const tb = el('g', {}, p3);
    el('path', { d: 'M -150 50 C -190 -30 -100 -90 -40 -66 C 0 -120 100 -110 116 -56 C 190 -56 190 50 130 64 C 116 116 -100 130 -150 50 Z', fill: K.white, ...SO }, tb);
    const tds = [0, 1, 2].map(i => el('circle', { cx: -60 + i * 60, cy: 0, r: 20, fill: K.ol }, tb));
    const tbulb = el('g', {}, tb); el('circle', { cx: 0, cy: -6, r: 50, fill: K.yellow, ...SO }, tbulb);
    for (let i = 0; i < 3; i++) ev(at(48, i), 'tick');
    ev(at(48, 3), 'ding'); ev(at(48, 3), 'v:aha'); s.fx.push(burst(fxG, 1160, 330, at(48, 3), K.yellow, 1.1));
    // 4 Human vs machine (simplified)
    const p4 = parts[4];
    const bd = el('g', {}, p4);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) el('rect', { x: -330 + i * 110, y: -220 + j * 110, width: 110, height: 110, fill: (i + j) % 2 ? '#B07A4F' : '#F6DDB5' }, bd);
    el('rect', { x: -330, y: -220, width: 660, height: 440, fill: 'none', ...SO }, bd);
    const rmxP = [[-220, -110, 'h'], [110, 0, 'a'], [-110, 110, 'h'], [220, -110, 'a']].map(([x, y, w], i) => { const pg = el('g', {}, bd); pawn(pg, w === 'h' ? K.white : '#3A3A3A'); return { pg, x, y: y + 40, w }; });
    for (let i = 0; i < 4; i++) { ev(at(49, i), i % 2 ? 'bleep' : 'tock'); punch(at(49, i), 0.015); }
    // 5 Price war
    const p5 = parts[5];
    const whw = el('g', {}, p5); const wh2 = CAST.deepseek(whw);
    const hm = el('g', {}, p5);
    el('rect', { x: -12, y: -300, width: 24, height: 300, rx: 10, fill: K.woodD, ...SO }, hm);
    el('rect', { x: -80, y: -380, width: 160, height: 100, rx: 20, fill: K.gray, ...SO }, hm);
    const price = el('g', {}, p5);
    el('rect', { x: -180, y: -100, width: 360, height: 200, rx: 26, fill: K.white, ...SO }, price);
    const priceT = gtext(price, '$60', 0, 40, 110, { family: F.round, weight: 700, fill: K.ol, stroke: K.white, sw: 0 });
    for (const b of [0, 2]) { ev(at(50, b), 'hammer'); punch(at(50, b), 0.03); s.fx.push(burst(fxG, 600, 520, at(50, b), K.yellow, 1)); }
    // 6 Dance together
    const p6 = parts[6];
    const six = ['llama', 'gemini', 'gpt', 'claude', 'deepseek'].map((k, i) => { const w = el('g', {}, p6); return { w, c: CAST[k](w), x: 360 + i * 300 }; });
    for (let i = 0; i < 4; i++) { ev(at(51, i), 'pop', { f: 600 + i * 150 }); punch(at(51, i), 0.02); }
    // 7 2026 · ？
    const p7 = parts[7];
    const q = el('g', {}, p7); gtext(q, '?', 0, 120, 420, { family: F.round, weight: 700, fill: K.yellow, sw: 40 });
    const seven = ['llama', 'gemini', 'gpt', 'claude', 'deepseek'].map((k, i) => { const w = el('g', {}, p7); return { w, c: CAST[k](w), x: 360 + i * 300 }; });
    for (let i = 0; i < 3; i++) { ev(at(52, i), 'kickhit'); punch(at(52, i), 0.03); }
    ev(at(52, 3), 'v:next'); ev(at(52, 3), 'slam'); punch(at(52, 3), 0.05);
    for (let b = 45; b < 53; b++) ev(at(b), 'cut');
    return (t) => {
      const idx = clamp(Math.floor((t - at(45)) / BARL), 0, 7);
      const t0 = at(45 + idx);
      const k = Math.floor((t - t0) / B);
      bgR.setAttribute('fill', BG[idx]);
      parts.forEach((p, i) => show(p, i === idx));
      lblT.textContent = labels[idx];
      tf(lbl, 960, 150, E.back(seg(t, t0, t0 + 0.2)) * (1 + 0.05 * Math.exp(-frac(t) * 8)), idx % 2 ? 3 : -3);
      pat.setAttribute('transform', `translate(${(t * 80) % 80} ${(t * 40) % 80})`);
      if (idx === 0) {
        tf(cw, 600, 930 + hopY(t, 10), 1.5); pose(cl, { hey: 0.35 + 0.25 * Math.sin(t * 40), open: frac(t * 2) < 0.4, lean: 6 });
        tf(lap, 1150, 820, 1);
        codeLines.forEach((c, i) => c.setAttribute('width', clamp(((t - t0) / (B / 2)) - i, 0, 1) * (200 + (i * 97) % 300)));
      }
      if (idx === 1) {
        tf(rw, 1350, 900 + hopY(t, 12), 1);
        const hitK = Math.min(3, k);
        const pr = 1 - E.io(seg(t, at(46, hitK) + 0.03, at(46, hitK) + 0.22));
        const gx = lerp(1210, 970, t >= at(46, hitK) ? pr : 0);
        setArm({ aO: rb.arm.aO, aI: rb.arm.aI, hand: { setAttribute() {} } }, 1260 - 1350, 700 - 900, gx - 1350, 620 - 900);
        tf(rb.glove, gx - 1350, 620 - 900, 1); tf(rb.glove2, 1440 - 1350, 690 - 900, 0.9);
        iconEls.forEach((ic, i) => {
          const ti = at(46, i);
          if (t < ti - B * 0.6) { op(ic, 0); return; }
          op(ic, 1);
          if (t < ti) { const p = seg(t, ti - B * 0.6, ti); tf(ic, lerp(-100, 880, p), 620 - Math.sin(p * Math.PI) * 200, 1, p * 360); }
          else { const p = E.out(seg(t, ti, ti + 0.3)); tf(ic, lerp(880, 200 + i * 200, p), lerp(620, 330, p), hitSq(t, ti, 0.3), 0); }
        });
      }
      if (idx === 2 || idx === 6 || idx === 7) {
        const arr = idx === 2 ? five : idx === 6 ? six : seven;
        arr.forEach((c, i) => {
          tf(c.w, c.x, 930 + hopY(t + (idx === 6 ? 0 : i * 0.04), idx === 6 ? 60 : 16), 1.3);
          let hey = 0;
          if (idx === 2) hey = (k === 3 || i % 4 === k || (k === 0 && i === 4)) && frac(t) < 0.6 ? 1 : 0;
          if (idx === 6) hey = (k % 2 === 0) === (i % 2 === 0) ? 1 : 0.1;
          if (idx === 7) hey = t >= at(52, 3) ? 1 : 0;
          poseAny(c.c, { hey, open: hey > 0.5, sq: 1 - 0.14 * Math.exp(-frac(t) * 14), lean: idx === 6 ? (k % 2 ? 10 : -10) : 0, face: idx === 7 && t >= at(52, 3) ? 'up' : null });
        });
      }
      if (idx === 3) {
        tf(tw, 760, 950 + hopY(t, 8), 1.6);
        poseAny(tc, { hey: k === 3 ? 1 : 0.15, open: k === 3, face: k < 3 ? 'up' : null });
        tf(tb, 1160, 330);
        tds.forEach((d, i) => show(d, k < 3 && i <= k));
        show(tbulb, k === 3); tbulb.setAttribute('transform', `scale(${E.back(seg(t, at(48, 3), at(48, 3) + 0.2))})`);
      }
      if (idx === 4) {
        tf(bd, 960, 640, 1.35, 0);
        rmxP.forEach((p, i) => { show(p.pg, k >= i); tf(p.pg, p.x, p.y, E.back(seg(t, at(49, i), at(49, i) + 0.15)) * hitSq(t, at(49, i), 0.25)); });
      }
      if (idx === 5) {
        tf(whw, 1250, 900 + hopY(t, 10), 1.1);
        const nx = [at(50, 0), at(50, 2)].find(x => t < x + 0.25) ?? at(50, 2);
        const hr = t < nx ? E.in(seg(t, nx - 0.16, nx)) : 1 - E.out(seg(t, nx + 0.05, nx + 0.25));
        hm.setAttribute('transform', `translate(1160 720) rotate(${lerp(20, -60, hr)})`);
        pose(wh2, { hey: 0.3, open: hr > 0.8 });
        const nHit = [at(50, 0), at(50, 2)].filter(x => t >= x).length;
        priceT.textContent = ['$60', '$15', '$2.19'][nHit];
        tf(price, 620, 560, hitSq(t, nHit ? [at(50, 0), at(50, 2)][nHit - 1] : -9, 0.3));
      }
      if (idx === 7) {
        const qk = Math.min(k, 2);
        tf(q, 960, 420, (t >= at(52, 3) ? 1.3 : 1) * (1 + 0.25 * Math.exp(-(t - at(52, qk)) * 10)), qk % 2 ? 6 : -6);
      }
      s.fx.forEach(f => f(t));
    };
  });

  // ================= Results bar 53–60 =================
  scene(at(53), at(END_BAR), (g, s) => {
    bg(g, K.navy);
    const rays = raysEl(g, 30, '#30305A');
    const head = el('g', {}, g);
    gtext(head, 'AI 进化史 · 评价', 960, 150, 84, { fill: K.white, sw: 0 });
    const lines = ['· 下棋：早就赢了人类。', '· 说话：越来越像个人。', '· 价格：越来越便宜。'];
    const lineEls = lines.map((l, i) => txt(g, '', { x: 480, y: 330 + i * 100, 'font-size': 64, 'font-family': F.sans, 'font-weight': 900, fill: K.white }));
    lines.forEach((l, i) => { for (let c = 0; c < [...l].length; c++) if (c % 2 === 0) ev(at(53 + i) + c * B / 4, 'type'); });
    const sup = el('g', {}, g);
    el('path', { d: starPath(12, 230, 170), fill: K.yellow, ...SO, 'stroke-width': 10 }, sup);
    gtext(sup, 'Encore!', 0, 36, 100, { family: F.round, weight: 700, fill: K.red, sw: 20 });
    ev(at(56), 'fanfare'); ev(at(56), 'v:superb'); punch(at(56), 0.05);
    s.fx.push(burst(g, 1500, 520, at(56), K.yellow, 2.2));
    const load = el('g', {}, g);
    txt(load, '下一个模型：训练中', { x: 0, y: 0, 'font-size': 52, 'font-family': F.sans, 'font-weight': 900, fill: K.white });
    el('rect', { x: 0, y: 30, width: 900, height: 44, rx: 22, fill: 'none', stroke: K.white, 'stroke-width': 5 }, load);
    const bar = el('rect', { x: 8, y: 38, width: 0, height: 28, rx: 14, fill: K.lime }, load);
    const pct = txt(load, '0%', { x: 920, y: 66, 'font-size': 44, 'font-family': F.round, 'font-weight': 700, fill: K.lime });
    for (let b = 0; b < 8; b++) ev(at(57) + b * B, 'blip', { f: 900 + b * 60 });
    const credit = el('g', {}, g);
    el('rect', { x: -700, y: -130, width: 1400, height: 260, rx: 40, fill: K.cream, ...SO }, credit);
    txt(credit, '本片由 Claude Opus 5.5 全程代码生成', { x: 0, y: -18, 'font-size': 60, 'font-family': F.sans, 'font-weight': 900, fill: K.ol, 'text-anchor': 'middle' });
    txt(credit, '（它也在这条时间线上）', { x: 0, y: 68, 'font-size': 48, 'font-family': F.sans, 'font-weight': 900, fill: K.claude, 'text-anchor': 'middle' });
    ev(at(59), 'end');
    const castG = el('g', {}, g);
    const cast = ['llama', 'gemini', 'gpt', 'claude', 'deepseek'].map((k, i) => { const w = el('g', {}, castG); return { w, c: CAST[k](w), x: 180 + i * 185 }; });
    return (t) => {
      rays.setAttribute('transform', `translate(960 560) rotate(${t * 8})`);
      op(head, seg(t, at(53), at(53) + 0.2));
      lineEls.forEach((le, i) => {
        const arr = [...lines[i]];
        const n = clamp(Math.floor((t - at(53 + i)) / (B / 4)) + 1, 0, arr.length);
        le.textContent = arr.slice(0, n).join('');
      });
      op(sup, t >= at(56) ? 1 : 0);
      tf(sup, 1500, 520, E.back(seg(t, at(56), at(56) + 0.3)) * (1 + 0.03 * Math.sin(t * 6)), -10 + Math.sin(t * 2) * 3);
      const lp = seg(t, at(57), at(59) - B);
      const pv = Math.min(99, Math.floor(E.out(lp) * 99));
      bar.setAttribute('width', 884 * pv / 100);
      pct.textContent = `${pv}%`;
      op(pct, pv >= 99 ? (Math.floor(t / B) % 2 ? 1 : 0.3) : 1);
      op(load, t >= at(57) ? 1 : 0); tf(load, 480, 760);
      const cr = t >= at(59);
      op(credit, cr ? 1 : 0);
      tf(credit, 960, 560, E.back(seg(t, at(59), at(59) + 0.35)), -1.5);
      [...lineEls, sup, load, head].forEach(e => { if (cr) op(e, 1 - seg(t, at(59), at(59) + 0.2)); });
      cast.forEach((c, i) => {
        tf(c.w, c.x, 1010 + hopY(t + i * 0.08, 14), 0.62);
        poseAny(c.c, { hey: t >= at(56) && t < at(57) ? 1 : 0.2, open: frac(t) < 0.3, sq: 1 - 0.12 * Math.exp(-frac(t) * 14) });
      });
      s.fx.forEach(f => f(t));
    };
  });
}

// ============================================================
// Render
// ============================================================
function render(t) {
  for (const s of scenes) { const on = t >= s.t0 && t < s.t1; show(s.g, on); if (on) s.update(t); }
  // Camera punch: zoom in slightly on every hit
  let z = 1;
  for (const [t0, a] of PUNCH) if (t >= t0 && t < t0 + 0.18) z += a * Math.pow(1 - (t - t0) / 0.18, 2);
  cam.setAttribute('transform', `translate(${(960 * (1 - z)).toFixed(2)} ${(540 * (1 - z)).toFixed(2)}) scale(${z.toFixed(4)})`);
  // White flash on cuts
  let fl = 0;
  for (const c of [at(4), at(14), at(24), at(34), at(44), at(45), at(53), at(59)]) if (t >= c && t < c + 0.1) fl = Math.max(fl, 0.6 * (1 - (t - c) / 0.1));
  if (t >= at(13) && t < at(13) + 0.15) fl = Math.max(fl, 0.8 * (1 - (t - at(13)) / 0.15));
  op(flash, fl);
  op(fade, seg(t, at(END_BAR) - 0.8, at(END_BAR)));
}

async function init() {
  document.getElementById('paper').style.display = 'none';
  document.getElementById('fx').style.display = 'none';
  const all = document.documentElement.innerHTML;
  const fams = ['900 50px "Noto Sans SC"', '400 50px "ZCOOL KuaiLe"', '700 50px "Fredoka"', '600 50px "Fredoka"', '900 50px "Noto Serif SC"'];
  const sample = all.replace(/[\x00-\x2f]/g, '') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:：。，！？～·—「」（）+–→✓✗×≈$%?';
  await Promise.all(fams.map(f => document.fonts.load(f, sample)));
  await document.fonts.ready;
  buildAll();
  EV.sort((a, b) => a.t - b.t);
  const all2 = document.getElementById('stage').textContent;
  await Promise.all(fams.map(f => document.fonts.load(f, all2)));
  await document.fonts.ready;
  const q = new URLSearchParams(location.search);
  render(parseFloat(q.get('t') || '0'));
  window.READY = true;
}
window.render = render;
init();
