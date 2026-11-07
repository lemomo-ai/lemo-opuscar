// "Clawd Moves In" timeline: VO word anchors, camera, Clawd's performance, cursor, UI state, sound events
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '../../../core/lib.js';
import { WIN, TERM, LOGO } from './ui.js';
import * as CW from './clawd.js';

export const BPM = 100, B = 60 / BPM;            // 0.6 s per beat; section cuts all land on beats
export const DUR = 59.4;
export const VO = { v01: 2.3, v02: 3.5, v03: 6.2, v04: 10.9, v05: 13.5, v06: 16.1, v07: 20.3, v08: 22.9, v09: 28.1, v10: 30.5, v11: 32.8,
  v12: 36.5, v13: 38.2, v14: 43.0, v15: 45.8, v16: 50.8, v17: 52.42 };
const LINES = {}; let WORDS = {};
const nrm = s => s.toLowerCase().replace(/[^a-z0-9@]/g, '');
// start time of the n-th matching word in a line (whisper timestamps; a first word at -0.6 is an artefact of the padded silence, treated as 0)
export const W = (id, word, n = 0) => { const ws = WORDS[id] || []; let k = 0;
  for (const [w, a] of ws) if (nrm(w) === nrm(word) && k++ === n) return VO[id] + Math.max(0, a);
  throw new Error(`word ${word} not in ${id}`); };
export const WE = (id, word, n = 0) => { const ws = WORDS[id] || []; let k = 0;
  for (const [w, , b] of ws) if (nrm(w) === nrm(word) && k++ === n) return VO[id] + b;
  throw new Error(`word ${word} not in ${id}`); };

// ───────── events (sound-effect / score cues)
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });

// ───────── typing: human-hand rhythm (deterministic jitter), returns i→time
function typing(t0, text, cps = 14, seed = 1, kind = 'key') {
  const T = []; let t = t0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], r = hash(seed * 31 + i * 7.3);
    t += (1 / cps) * (.55 + r * .9) + (ch === ' ' ? .03 : 0) + (',.'.includes(text[i - 1] || '') ? .12 : 0);
    T.push(t); ev(t, kind, { v: .6 + r * .4, sp: ch === ' ' ? 1 : 0 });
  }
  return T;
}
const typed = (T, text, t) => { let n = 0; while (n < T.length && T[n] <= t) n++; return text.slice(0, n); };

// ───────── camera: a single-take "screen-recorder" camera; moves may overlap (a later move starts from the earlier one's current value, continuously)
const EASE = { eio, ss, eo, whip: x => { x = clamp(x); return x < .5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; },
  spring: x => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(x * 9.5) * (1 - x) - (x >= 1 ? 0 : 0); } };
const CAM0 = [960, 540, 1.5], MOVES = [];
const cam = (t0, d, to, e = 'eio') => MOVES.push({ t0, d, to, e });
export function camAt(t) {
  let v = CAM0.slice(); v[2] = Math.log(v[2]);
  for (const m of MOVES) { if (t <= m.t0) break; const p = EASE[m.e]((t - m.t0) / m.d);
    v = [lerp(v[0], m.to[0], p), lerp(v[1], m.to[1], p), lerp(v[2], Math.log(m.to[2]), p)]; }
  // very slight drift, like the micro-movement of a hand on a trackpad (screen-recorder auto-follow does this too)
  return [v[0] + Math.sin(t * .7) * 1.2, v[1] + Math.sin(t * .53 + 1) * .9, Math.exp(v[2])];
}

// ───────── actor: Clawd
class Actor {
  constructor(px = 7) { this.px = px; this.segs = []; this.jumps = []; this.fx = []; }
  add(s) { this.segs.push(s); return this; }
  stand(t0, t1, at, o = {}) { return this.add({ k: 'stand', t0, t1, at, ...o }); }
  walk(t0, t1, from, to, o = {}) { for (let t = t0 + .06; t < t1; t += .11) ev(t, 'step', { v: .5 }); return this.add({ k: 'walk', t0, t1, from, to, ...o }); }
  jump(t0, t1, from, to, h = 120, o = {}) { this.jumps.push({ t0, t1 }); ev(t0 - .02, 'jump', { d: t1 - t0 }); ev(t1, 'land', { v: o.big ? 1 : .6 }); return this.add({ k: 'jump', t0, t1, from, to, h, ...o }); }
  hide(t0, t1) { return this.add({ k: 'hide', t0, t1 }); }
  seg(t) { let s = null; for (const x of this.segs) { if (x.t0 <= t && t < x.t1) return x; if (x.t0 <= t) s = x; } return s; }
  // current foot position and pose
  eval(t, A, ctx) {
    const s = this.seg(t); if (!s || s.k === 'hide') return null;
    const px = s.px || this.px; let pos, legs = 'stand', flip = s.flip || false, sq = 0, rot = 0, arms = 'down', eyes = 'n';
    const P = f => typeof f === 'function' ? f(A, t) : f;
    if (s.k === 'stand') { pos = P(s.at); }
    if (s.k === 'walk') { const a = P(s.from), b = P(s.to); if (!a || !b) return null; const p = (s.ease || ss)(seg(t, s.t0, s.t1));
      pos = { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) }; legs = Math.floor(t * 9) % 2 ? 'walkA' : 'walkB'; flip = b.x < a.x; }
    if (s.k === 'jump') { const a = P(s.from), b = P(s.to); if (!a || !b) return null; const p = seg(t, s.t0, s.t1);
      const ap = Math.min(a.y, b.y) - s.h; // apex height: parabola through a and b with apex ap
      const x = lerp(a.x, b.x, p);
      // solve y for u∈[0,1]: back-solve the quadratic Bézier control point so the peak ≈ ap
      const cy = 2 * ap - (a.y + b.y) / 2; const y = (1 - p) ** 2 * a.y + 2 * (1 - p) * p * cy + p * p * b.y;
      pos = { x, y }; legs = 'tuck'; flip = b.x < a.x - 2 ? true : b.x > a.x + 2 ? false : flip;
      sq = p < .5 ? -.22 * (1 - p * 2) : -.12 * (p * 2 - 1); if (s.flipRot) rot = p * Math.PI * 2 * (b.x < a.x ? -1 : 1); arms = 'up'; }
    if (!pos) return null;
    // wind-up before the jump, squash on landing
    for (const j of this.jumps) {
      if (t >= j.t0 - .14 && t < j.t0) sq = Math.max(sq, .28 * ss(seg(t, j.t0 - .14, j.t0)));
      if (t >= j.t1 && t < j.t1 + .22) { const k = seg(t, j.t1, j.t1 + .22); sq = .34 * (1 - k) * Math.cos(k * 7); }
    }
    // light bob on the beat while standing (breathes in sync with the score)
    if (s.k === 'stand' && !s.still) { const bp = ((t % B) + B) % B; if (bp < .12) sq += .07 * Math.sin(bp / .12 * Math.PI); }
    // blink
    const bl = Math.floor(t / 2.9), bt = t - bl * 2.9 - hash(bl * 3.7 + this.px) * 2;
    if (bt > 0 && bt < .1) eyes = 'blink';
    if (s.eyes) { const e = typeof s.eyes === 'function' ? s.eyes(t, A, ctx) : s.eyes; if (e && !(eyes === 'blink' && (e === 'n' || e === 'l' || e === 'r'))) eyes = e; }
    if (s.arms) arms = typeof s.arms === 'function' ? s.arms(t) : s.arms;
    if (s.legs) legs = s.legs;
    if (s.sq) sq += s.sq(t);
    const x = Math.round(pos.x / (px / 2)) * (px / 2);
    return { x, y: pos.y, px, flip, sq, rot, legs, arms, eyes, op: s.op ? s.op(t) : 1, shadow: s.k === 'jump' ? 0 : 1 };
  }
}

// ───────── cursor
class Cursor {
  constructor() { this.moves = []; this.clicks = []; this.vis = []; }
  show(t0, t1) { this.vis.push([t0, t1]); return this; }
  move(t0, t1, to, arc = 40) { this.moves.push({ t0, t1, to, arc }); return this; }
  click(t) { this.clicks.push(t); ev(t, 'click'); return this; }
  eval(t, A) {
    let op = 0; for (const [a, b] of this.vis) op = Math.max(op, Math.min(seg(t, a, a + .15), 1 - seg(t, b - .2, b)));
    if (op <= 0) return null;
    let p = null, prev = null;
    for (const m of this.moves) { const to = m.to(A, t); if (!to) continue;
      if (t < m.t0) break;
      if (!prev) { p = to; prev = to; continue; }
      const k = seg(t, m.t0, m.t1), e = eio(k); const from = prev;
      const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy) || 1;
      p = { x: lerp(from.x, to.x, e) - dy / L * m.arc * Math.sin(Math.PI * e), y: lerp(from.y, to.y, e) + dx / L * m.arc * Math.sin(Math.PI * e), sp: Math.abs(Math.sin(Math.PI * k)) * L / (m.t1 - m.t0) };
      prev = k >= 1 ? to : from; if (k < 1) break; }
    if (!p) return null;
    let sc = 1, ring = 0; for (const c of this.clicks) { if (t >= c && t < c + .1) sc = .82; if (t >= c && t < c + .45) ring = seg(t, c, c + .45); }
    return { ...p, op, sc, ring };
  }
}

// ───────── anchor shortcuts
// when an element is temporarily absent, reuse its last position (frames render sequentially)
const at = (key, fx = .5, fy = 0, dx = 0, dy = 0) => { let last = null; return A => { const p = A(key, fx, fy); if (p) last = { x: p.x + dx, y: p.y + dy }; return last; }; };
const pt = (x, y) => () => ({ x, y });

// ───────── build the timeline
export const SUBS = [], T = {};
let C, C2, CUR;          // main Clawd, clone, cursor
let TY = {};             // typing time table
export function build(words) {
  WORDS = words; EV.length = 0; MOVES.length = 0;
  C = new Actor(7); C2 = new Actor(6); CUR = new Cursor();
  // subtitles: text inside {} is emphasis
  const cap = { v01: 'Meet {Clawd}.', v02: 'It used to live in your terminal.', v03: 'Now it lives right inside the {Claude app}.', v04: 'Just say what you want, in plain words.',
    v05: 'Point at a file with the {@} sign,', v06: 'and Claude reads your project {before} it touches a thing.', v07: 'Not sure yet? Switch to {Plan} mode.',
    v08: 'You get a clear plan, and nothing changes until you say go.', v09: 'Every edit shows up as a {diff}.', v10: 'Click any line, leave a note,', v11: 'and Claude {revises} it.',
    v12: 'Then it checks its own work.', v13: 'It runs your app in the {preview}, and clicks through it, just like you would.', v14: 'Got more to do? Start another {session}.', v15: 'They work {side by side}.' };
  const dur = words.__dur;
  for (const [id, t] of Object.entries(VO)) { ev(t, 'vo', { id }); if (cap[id]) SUBS.push({ id, t0: t - .05, t1: t + dur[id] + .25, text: cap[id] }); }

  // ═════ A. cold open: terminal → Clawd incarnates → jumps into the Claude app (0–10.2)
  TY.term = typing(.45, 'claude', 9, 3, 'tkey'); ev(1.35, 'tenter');
  T.logo = [1.55, 1.7, 1.85]; T.logo.forEach((x, i) => ev(x, 'blip', { n: i }));
  T.blink = W('v01', 'Claude') + .05; ev(T.blink, 'blink');
  T.shiver = W('v02', 'terminal') - .2; T.morph0 = WE('v02', 'terminal') - .05; T.morph1 = T.morph0 + .55; ev(T.morph0, 'morph');
  T.land0 = T.morph1 + .22;
  cam(0, 2.2, [900, 520, 1.62], 'ss');
  cam(2.2, 2.6, [720, 500, 2.5], 'eio');                    // push in to the logo
  cam(T.morph0 - .1, .8, [700, 440, 2.05], 'eio');           // follow the incarnation as it floats up
  T.win0 = W('v03', 'inside') - .1; T.win1 = T.win0 + .75; ev(T.win0, 'winopen');
  cam(W('v03', 'now') + .1, 1.5, [960, 540, 1.0], 'eio');    // pull out to reveal desktop and window
  T.jump0 = 7.62; T.land1 = 8.4;                              // 8.4 = beat 14, lands on the downbeat
  ev(T.land1, 'hit');
  T.title = 8.18;
  cam(8.4, 1.6, [960, 530, 1.05], 'ss');
  const logoTop = pt(LOGO.x + 9 * LOGO.qw, TERM.y);
  C.hide(0, T.morph1)
   .jump(T.morph1, T.land0, pt(LOGO.x + 9 * LOGO.qw, TERM.y - 70), logoTop, 10)
   .stand(T.land0, T.jump0, logoTop, { eyes: t => t < T.land0 + .5 ? 'wide' : t < W('v03', 'now') + .3 ? 'l' : t < T.win0 + .2 ? 'r' : 'u' })
   .jump(T.jump0, T.land1, logoTop, at('title', .8, 0, 0, 22), 230, { big: true, px: 9 })
   .stand(T.land1, 10.35, at('title', .8, 0, 0, 22), { px: 9, eyes: t => t < T.land1 + .6 ? 'happy' : 'n' });

  // ═════ B. 01 Just say it（10.2–19.2）
  T.wipe1 = 10.2;
  cam(10.4, .1, [830, 830, 1.62], 'eio');                    // change camera position under cover of the transition
  T.click1 = 11.25; CUR.show(10.95, 11.7).move(10.95, 10.95, pt(1500, 1020)).move(10.95, 11.2, at('pb', .3, .45)).click(T.click1);
  const p1 = 'Add a dark mode toggle to ', p2 = 'Hea';
  TY.p1 = typing(11.45, p1, 15, 5); T.atKey = W('v05', 'at', 1) - .02; ev(T.atKey, 'key', { v: 1 }); ev(T.atKey + .06, 'pop');
  TY.p2 = typing(T.atKey + .18, p2, 11, 9); T.atPick = TY.p2[2] + .32; ev(T.atPick, 'enter'); ev(T.atPick + .02, 'chip');
  cam(11.6, 3.4, [930, 820, 1.62], 'ss');
  T.sendMove = T.atPick + .2; T.send = T.sendMove + .42;
  CUR.show(T.sendMove - .05, T.send + .5).move(T.sendMove - .05, T.sendMove - .05, at('pb', .6, .6)).move(T.sendMove, T.send - .05, at('send', .5, .5), 30).click(T.send);
  ev(T.send + .02, 'send');
  cam(T.send - .15, .5, [1000, 600, 1.08], 'eio');
  T.files = T.send + .55; ev(T.files, 'pane'); ev(T.files - .1, 'whoosh', { d: 1 });
  cam(T.files, .42, [1120, 430, 1.4], 'whip');
  C.stand(10.35, T.atKey + .1, at('caret', 0, 0, 44, 0), { eyes: 'd' })
   .jump(T.atKey + .1, T.atKey + .42, at('caret', 0, 0, 44, 0), at('atpop', .82, 0), 60)
   .stand(T.atKey + .42, T.atPick + .02, at('atpop', .82, 0), { eyes: 'd' })
   .jump(T.atPick + .02, T.atPick + .3, at('atpop', .82, 0, 0, 0), at('caret', 0, 0, 60, 0), 20)
   .stand(T.atPick + .3, T.send, at('caret', 0, 0, 60, 0), { eyes: 'r' })
   .stand(T.send, T.files + .1, at('umsg', .82, 0), { still: true, eyes: 'u' });
  // runs down the file tree line by line (4× speed)
  const rows = ['App', 'Header', 'Timer', 'theme', 'main', 'pkg']; T.rows = [];
  let tj = T.files + .1, from = at('umsg', .82, 0);
  rows.forEach((r, i) => { const to = at('f-' + r, .56, 0), d = i === 0 ? .42 : .26; C.jump(tj, tj + d, from, to, i === 0 ? 110 : 26); T.rows.push(tj + d);
    C.stand(tj + d, tj + d + .06, to, { still: true, eyes: 'd' }); from = to; tj += d + .06; ev(tj - .05, 'read', { i }); });
  T.readEnd = tj;
  C.stand(T.readEnd, 19.4, at('f-pkg', .56, 0), { eyes: t => t < W('v06', 'touches') ? 'l' : 'happy', arms: t => t > W('v06', 'touches') + .1 ? 'up' : 'down' });
  cam(T.files + .5, 1.6, [1120, 470, 1.4], 'ss');
  cam(W('v06', 'before') - .1, .9, [1130, 470, 1.08], 'eio');

  // ═════ C. 02 Plan first（19.2–27.0）
  T.wipe2 = 19.2;
  cam(19.4, .1, [700, 790, 1.55], 'eio');
  T.menu = W('v07', 'switch') - .12; ev(T.menu - .05, 'key', { v: 1 }); ev(T.menu, 'pop');
  T.hl = [T.menu + .28, W('v07', 'plan') - .05]; T.hl.forEach(x => ev(x, 'tick'));
  T.planSel = W('v07', 'mode') + .05; ev(T.planSel, 'enter'); T.menuX = T.planSel + .18;
  T.plan = VO.v08 - .15; ev(T.plan, 'pane'); ev(T.plan - .08, 'whoosh', { d: 1 });
  T.items = [W('v08', 'get') - .05, W('v08', 'clear'), W('v08', 'plan') + .25, W('v08', 'and') + .2]; T.items.forEach(x => ev(x, 'write'));
  T.spot = W('v08', 'nothing') + .05; T.spotEnd = W('v08', 'until') + .35;
  cam(T.plan, .45, [1140, 400, 1.45], 'whip');
  cam(T.spot - .1, .8, [1200, 330, 1.85], 'eio'); cam(T.spotEnd, .5, [1140, 400, 1.45], 'eio');
  T.go = W('v08', 'go'); T.goMenu = T.go - .5;
  cam(T.spotEnd + .2, .35, [700, 800, 1.4], 'whip'); ev(T.spotEnd + .18, 'whoosh', { d: -1 });
  CUR.show(T.goMenu - .35, T.go + .45).move(T.goMenu - .35, T.goMenu - .35, pt(900, 1000)).move(T.goMenu - .3, T.goMenu - .04, at('mode', .5, .5), 20).click(T.goMenu)
    .move(T.goMenu + .12, T.go - .04, at('mi-1', .3, .5), 10).click(T.go);
  ev(T.goMenu + .02, 'pop'); ev(T.go + .02, 'enter');
  C.stand(20.0, T.menu + .12, at('pb', .52, 0), { eyes: 'l' })
   .jump(T.menu + .12, T.menu + .45, at('pb', .52, 0), at('menu', .72, 0), 70)
   .stand(T.menu + .45, T.menuX + .02, at('menu', .72, 0), { eyes: 'd' })
   .jump(T.menuX + .02, T.menuX + .3, at('menu', .72, 0), at('pb', .3, 0), 30)
   .stand(T.menuX + .3, T.plan + .1, at('pb', .3, 0), { eyes: 'u', arms: 'tuck' });
  // writing the plan: walks along the end of each item's text (pixel pencil)
  C.jump(T.plan + .1, T.items[0] - .02, at('pb', .3, 0), at('pl-0', 0, 0, 6, 0), 160, { px: 4 });
  T.items.forEach((ti, i) => { C.walk(ti, ti + .42, at('pl-' + i, 0, 0, 6, 0), at('pl-' + i, 1, 0, 30, 0), { px: 4, pencil: true, ease: x => x, eyes: 'd' });
    if (i < 3) C.jump(ti + .42, T.items[i + 1], at('pl-' + i, 1, 0, 30, 0), at('pl-' + (i + 1), 0, 0, 6, 0), 16, { px: 4 }); });
  C.jump(T.items[3] + .42, T.spot + .35, at('pl-3', 1, 0, 30, 0), at('nfc', .5, 0), 60, { px: 4 })
   .stand(T.spot + .35, T.go, at('nfc', .5, 0), { px: 4, eyes: t => t < T.spotEnd ? 'happy' : 'l', arms: t => t > T.go - .6 ? 'wave' : 'down' })
   .walk(T.go + .1, T.go + .55, at('nfc', .5, 0), at('pane', 1.1, 0, 0, 30), { px: 4, dash: true })
   .hide(T.go + .55, 29.0);
  ev(T.go + .1, 'dash');

  // ═════ D. 03 Review every change（27.0–35.4）
  T.wipe3 = 27.0;
  cam(27.2, .1, [760, 390, 1.75], 'eio');
  T.edits = [W('v09', 'every') + .1, W('v09', 'edit') + .25, W('v09', 'shows') + .25]; T.edits.forEach(x => ev(x, 'tool'));
  T.stat = W('v09', 'diff') - .02; ev(T.stat, 'pop'); ev(T.stat + .05, 'count');
  T.review = T.stat + .55; CUR.show(T.stat + .1, T.review + .3).move(T.stat + .1, T.stat + .1, pt(1000, 700)).move(T.stat + .12, T.review - .04, at('stat', .88, .55), 25).click(T.review);
  T.diff = T.review + .12; ev(T.diff, 'pane'); ev(T.diff - .05, 'whoosh', { d: 1 });
  cam(T.diff, .42, [1180, 420, 1.5], 'whip');
  T.line = W('v10', 'line') - .1; T.cmOpen = T.line + .12; ev(T.cmOpen, 'pop');
  CUR.show(T.diff + .25, T.line + .4).move(T.diff + .25, T.diff + .25, pt(1250, 700)).move(T.diff + .28, T.line - .04, at('l6', .45, .5), 30).click(T.line);
  const cmt = 'Use the system theme when nothing is saved.';
  TY.cm = typing(W('v10', 'leave') - .15, cmt, 30, 13);
  T.cmSend = TY.cm[TY.cm.length - 1] + .18; ev(T.cmSend, 'key', { v: 1 }); ev(T.cmSend + .03, 'send');
  T.rev = W('v11', 'revises') - .05; T.revEnd = T.rev + .75; for (let t = T.rev; t < T.revEnd; t += .045) ev(t, 'rkey', { v: .35 });
  ev(T.revEnd + .05, 'tool');
  cam(T.rev - .3, .6, [1200, 440, 1.6], 'eio');
  T.pet = WE('v11', 'it') + .75; CUR.show(T.pet - .6, T.pet + .5).move(T.pet - .6, T.pet - .6, pt(1700, 700)).move(T.pet - .55, T.pet - .03, A => { const c = C.eval(T.pet - .05, A); return c && { x: c.x + 4, y: c.y - c.px * 10 - 2 }; }, 20).click(T.pet);
  ev(T.pet + .05, 'boing');
  C.jump(T.stat - .5, T.stat, pt(900, 120), at('stat', .22, 0), 20, { px: 6 })
   .stand(T.stat, T.diff + .05, at('stat', .22, 0), { px: 6, eyes: 'happy', arms: 'up' })
   .jump(T.diff + .05, T.diff + .5, at('stat', .22, 0), at('l1', .86, 0), 120, { px: 5 })
   .stand(T.diff + .5, T.cmOpen + .3, at('l1', .86, 0), { px: 5, eyes: t => t < T.line ? 'l' : 'd' })
   .jump(T.cmOpen + .3, T.cmOpen + .6, at('l1', .86, 0), at('cm', .86, 0), 30, { px: 5 })
   .stand(T.cmOpen + .6, T.rev - .25, at('cm', .86, 0), { px: 5, eyes: t => t < T.cmSend ? 'l' : 'wide' })
   .jump(T.rev - .25, T.rev, at('cm', .86, 0), at('n0', .8, 0), 40, { px: 5 })
   .stand(T.rev, T.pet - .05, at('n0', .8, 0), { px: 5, eyes: t => t < T.revEnd ? 'd' : 'happy' })
   .stand(T.pet - .05, 35.6, at('n0', .8, 0), { px: 5, eyes: t => t < T.pet + .5 ? 'shut' : 'happy', sq: t => t > T.pet && t < T.pet + .3 ? .3 * (1 - seg(t, T.pet, T.pet + .3)) : 0 });

  // ═════ E. 04 It checks its own work（35.4–43）
  T.wipe4 = 35.4;
  cam(35.6, .1, [950, 520, 1.12], 'eio');
  T.prev = VO.v12 - .1; ev(T.prev, 'pane'); T.load0 = T.prev + .4; T.load1 = T.load0 + .9; ev(T.load1, 'tool');
  T.toolsE = [T.prev + .1, W('v13', 'clicks') + .2, W('v13', 'like') + .1];
  T.stomp = 40.2; ev(T.stomp, 'stomp');
  cam(W('v13', 'runs'), 1.8, [1560, 330, 1.8], 'eio');
  cam(T.stomp + .45, 2.4, [960, 540, 1.0], 'eio');
  T.dark1 = T.stomp + 1.5; ev(T.stomp + .04, 'darkon'); T.shot = T.stomp + 1.3; ev(T.shot, 'shutter');
  C.hide(35.6, T.prev + .3)
   .jump(T.prev + .3, T.prev + .75, pt(1600, 100), at('url', .12, 0), 20, { px: 5 })
   .stand(T.prev + .75, W('v13', 'runs') + .2, at('url', .12, 0), { px: 5, eyes: t => t < T.load1 ? 'd' : 'r' })
   .walk(W('v13', 'runs') + .2, T.stomp - .45, at('url', .12, 0), at('toggle', .5, 0, 0, -18 - 10), { px: 5, eyes: 'r' })
   .stand(T.stomp - .45, T.stomp - .3, at('toggle', .5, 0, 0, -28), { px: 5, eyes: 'd', still: true })
   .jump(T.stomp - .3, T.stomp, at('toggle', .5, 0, 0, -28), at('toggle', .5, 0), 50, { px: 5, big: true })
   .stand(T.stomp, 43.15, at('toggle', .5, 0), { px: 5, eyes: t => t < T.stomp + .5 ? 'wide' : 'happy', arms: t => t > T.stomp + .9 ? 'up' : 'down' });

  // ═════ F. parallel sessions (43–49.2)
  T.paneX = 43.2; ev(T.paneX, 'whoosh', { d: -1 });
  T.cmdN = W('v14', 'start') - .4; ev(T.cmdN, 'key', { v: 1 }); ev(T.cmdN + .05, 'pop');
  T.split = 45.0; ev(T.split - .1, 'split'); ev(T.split + .15, 'mitosis');
  T.optClick = T.split - .25; CUR.show(T.cmdN + .1, T.split + .3).move(T.cmdN + .1, T.cmdN + .1, pt(700, 700)).move(T.cmdN + .15, T.optClick - .03, at('s-1', .5, .5), 30).click(T.optClick);
  T.side = W('v15', 'side') - .02; T.merged = 48.3; ev(T.merged, 'merge'); T.pass = 47.7; ev(T.pass, 'tool');
  for (let i = 0; i < 6; i++) ev(45.9 + i * .3, 'tick');
  cam(T.paneX, .9, [960, 600, 1.0], 'eio');
  cam(T.split + .3, 3.5, [960, 590, 1.03], 'ss');
  C.jump(43.15, 43.7, at('toggle', .5, 0), at('pb', .5, 0), 120, { px: 5 })
   .stand(43.7, T.split + .15, at('pb', .5, 0), { px: 6, eyes: t => t < T.cmdN ? 'n' : 'l' })
   .walk(T.split + .15, T.split + .8, at('pb', .5, 0), at('ci-1', .6, 0), { px: 6 })
   .stand(T.split + .8, 49.4, at('ci-1', .6, 0), { px: 6, eyes: t => t < T.side ? 'd' : t < T.side + .9 ? 'r' : 'happy',
     arms: t => (t > T.side && t < T.side + .9) || (t > T.merged && t < T.merged + .6) ? 'wave' : 'down', sq: t => t > T.merged && t < T.merged + .25 ? .25 : 0 });
  C2.hide(0, T.split + .15)
   .walk(T.split + .15, T.split + .8, at('pb', .5, 0), at('term-2', .7, 0), { eyes: 'r' })
   .stand(T.split + .8, 49.4, at('term-2', .7, 0), { flip: true, eyes: t => t < T.side ? 'd' : t < T.side + .9 ? 'l' : 'happy', arms: t => t > T.side && t < T.side + .9 ? 'wave' : 'down' });

  // ═════ G. ending (49.2–59.4)
  T.out = 49.3; ev(T.out, 'whoosh', { d: 0 });
  T.meet = 50.25; ev(T.meet, 'merge2');
  C.jump(49.4, T.meet, at('ci-1', .6, 0), pt(960, 470), 160, { px: 6 })
   .jump(T.meet, VO.v16 + .15, pt(960, 470), at('e-title', .5, 0, 0, 20), 30, { px: 8 });
  C2.jump(49.4, T.meet, at('term-2', .7, 0), pt(960, 470), 160).hide(T.meet, 99);
  T.w = [W('v17', 'say'), W('v17', 'plan'), W('v17', 'review'), W('v17', 'ship')]; T.w[0] = Math.max(T.w[0], VO.v17 + .02);
  T.w.forEach((x, i) => ev(x, 'word', { i }));
  let wf = at('e-title', .5, 0, 0, 20);
  C.stand(VO.v16 + .15, T.w[0] - .32, wf, { px: 8, eyes: 'd' });
  T.w.forEach((x, i) => { const to = at('ew-' + i, .5, 0, 0, 8); C.jump((i ? T.w[i - 1] : T.w[0] - .32) + (i ? .06 : 0), x, wf, to, i ? 60 : 50, { px: 7, big: i === 3 }); C.stand(x, i < 3 ? x + .06 : 99, to, { px: 7, eyes: i === 3 ? t => t < x + .8 ? 'wide' : 'happy' : 'n', arms: i === 3 ? (t => t > 56.2 && t < 57.4 ? 'wave' : 'down') : undefined }); wf = to; });
  T.light = T.w[3]; ev(T.light + .04, 'lighton');
  CH.forEach(([t0]) => ev(t0, 'wipe'));
  T.card = T.light + 1.2; T.fade = DUR - .6;
  cam(T.light + .3, DUR - T.light, [960, 560, 1.06], 'ss');   // very slow push-in at the end so even the still frame breathes
  ev(55.2, 'final');
  return { C, C2, CUR };
}

// ───────── per frame: UI state
const CH = [[10.2, '01', 'Just say it'], [19.2, '02', 'Plan first'], [27.0, '03', 'Review every change'], [35.4, '04', 'It checks its own work']];
export function frame(t) {
  const F = { t, hud: {}, fx: [], actors: [C, C2], cursor: CUR };
  F.cam = camAt(t);
  // ── desktop and terminal
  const termOp = 1 - seg(t, T.win0 + .35, T.win1);
  F.desk = { term: termOp > 0 ? { op: termOp, typed: typed(TY.term, 'claude', t), caret: t < 1.35 ? Math.floor(t * 2.2) % 2 === 0 : false,
    logo: t < T.logo[0] ? 0 : t < T.logo[1] ? .34 : t < T.logo[2] ? .67 : 1, info: seg(t, 1.6, 2.2), gone: t >= T.morph0 + .02, hint: seg(t, 2.1, 2.5),
    blink: t > T.blink && t < T.blink + .16, jit: t > T.shiver && t < T.morph0 ? .6 + 1.6 * seg(t, T.shiver, T.morph0) : 0 } : null };
  // ── incarnation: logo quadrant pixels → Clawd square pixels
  if (t >= T.morph0 && t < T.morph1 + .02) {
    const p = seg(t, T.morph0, T.morph1), dst = CW.pixels({ x: LOGO.x + 9 * LOGO.qw, y: TERM.y - 70, px: 7 }); let h = '';
    dst.forEach((d, i) => { const c = Math.round((d.x - (LOGO.x + 9 * LOGO.qw)) / 7 + 9 - .5), r = Math.round((d.y - (TERM.y - 70)) / 7 + 10 - .5), q = r >> 1;
      const sx = LOGO.x + c * LOGO.qw, sy = LOGO.y + q * LOGO.qh + (r & 1) * LOGO.qh / 2;
      const k = eio(clamp((p - hash(i * 1.7) * .35) / .65)), ax = Math.sin(k * Math.PI) * (hash(i * 3.1) - .5) * 60, ay = -Math.sin(k * Math.PI) * 40 * hash(i * 5.3);
      const x = lerp(sx, d.x - 3.5, k) + ax, y = lerp(sy, d.y - 3.5, k) + ay, w = lerp(LOGO.qw, 7, k), hh = lerp(LOGO.qh / 2, 7, k);
      const col = d.v === 2 ? (k > .6 ? CW.EYE : '#1F1D1A') : CW.CLAY;
      h += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w + .4}px;height:${hh + .4}px;background:${col}"></div>`; });
    F.fx.push(() => h);
  }
  // ── app window
  if (t >= T.win0) {
    const wp = seg(t, T.win0, T.win1), e = back(wp, 1.2);
    const A = F.app = { sessions: [{ name: 'Dark mode toggle', on: 1, run: t > T.send && t < T.merged }], msgs: [], prompt: { mode: 'Manual' }, winSt: {} };
    if (wp < 1) A.winSt = { op: Math.min(1, wp * 10), tf: `translate(${(1 - e) * 260}px,${(1 - e) * 160}px) scale(${.12 + .88 * e})` };
    // title (Clawd lands on it)
    if (t >= T.title && t < T.wipe1 + .4) A.title = { p: seg(t, T.title, T.title + .5), sub: seg(t, 8.9, 9.3) };
    appState(A, t);
    if (t >= T.out) { const k = eio(seg(t, T.out, T.out + .9)); A.winSt = { op: 1 - k, tf: `scale(${1 - .12 * k})` }; }
    if (t >= T.out + .9) F.app = null;
  }
  // ── end card (world layer)
  if (t >= T.out) F.extra = endCard(t);
  // ── light/dark
  const r0 = seg(t, T.stomp, T.dark1), r1 = seg(t, T.light, T.light + 1.0);
  if (t < T.stomp) F.dark = { base: 'L' };
  else if (t < T.dark1) F.dark = { base: 'L', over: 'D', at: F.revealAt = 'toggle', r: 3200 * ei(r0) ** .8 + 20 };
  else if (t < T.light) F.dark = { base: 'D' };
  else if (t < T.light + 1.0) F.dark = { base: 'D', over: 'L', at: 'ew-3', r: 2600 * eo(r1) + 10 };
  else F.dark = { base: 'L' };
  // ── HUD
  hud(F, t);
  return F;
}

function appState(A, t) {
  const P = A.prompt;
  // B: input
  if (t < T.send + .05) {
    P.focus = t > T.click1; P.caret = t > T.click1 && (t < TY.p1[0] || Math.floor(t * 2.4) % 2 === 0 || (t > TY.p1[0] && t < T.atPick));
    let s = typed(TY.p1, 'Add a dark mode toggle to ', t);
    if (t >= T.atKey) s += t >= T.atPick ? '<span class="at">@Header.tsx</span> ' : '<span class="at">@' + typed(TY.p2, 'Hea', t) + '</span>';
    P.text = s; P.sendDim = !s;
    if (t >= T.atKey && t < T.atPick + .6) { const k = t < T.atPick ? seg(t, T.atKey + .04, T.atKey + .3) : 1 - seg(t, T.atPick, T.atPick + .15);
      const n = t < TY.p2[0] ? 3 : t < TY.p2[1] ? 3 : 2; P.at = { p: Math.max(.0001, back(k)), x: 268, y: 92, hl: 0, n }; }
  }
  const u = { k: 'u', id: 'umsg', html: 'Add a dark mode toggle to <span class="at">@Header.tsx</span>' };
  if (t >= T.send && t < T.wipe2 + .4) {
    const k = seg(t, T.send, T.send + .55), e = back(k, 1.1); u.tf = `translate(${(1 - e) * -40}px,${(1 - e) * 560}px)`; u.op = Math.min(1, k * 4);
    A.msgs.push(u);
    const tools = [['read', 'Read', 'src/components/Header.tsx', 1], ['read', 'Read', 'src/styles/theme.ts', 3], ['search', 'Search', '"color" · 14 results', 2], ['read', 'Read', '4 more files', 5]];
    tools.forEach(([ic, v, a, r], i) => { const t0 = T.rows[r] - .1; if (t > t0) A.msgs.push({ k: 'tool', icon: ic, verb: v, arg: a, spin: t < t0 + .35, done: t >= t0 + .35, op: seg(t, t0, t0 + .15) }); });
    if (t > T.readEnd) A.msgs.push({ k: 't', html: 'Colors live in <code>theme.ts</code>, and the header has room for a button.', p: seg(t, T.readEnd, T.readEnd + 1.1) });
    if (t >= T.files) A.pane = { type: 'Files', w: 520 * back(seg(t, T.files, T.files + .45), 1.3), lit: litRows(t) };
    A.blurChat = t > T.files + .3 && t < W('v06', 'before') ? 3 * seg(t, T.files + .3, T.files + .7) * (1 - seg(t, W('v06', 'before') - .5, W('v06', 'before'))) : 0;
    P.sendDim = true;
  }
  // C：Plan
  if (t >= T.wipe2 + .4 && t < T.wipe3 + .4) {
    A.msgs.push(u, { k: 'tool', icon: 'read', verb: 'Read', arg: '6 files', done: true }, { k: 't', html: 'Colors live in <code>theme.ts</code>, and the header has room for a button.' });
    if (t > T.menu) P.menu = { p: t < T.menuX ? back(seg(t, T.menu, T.menu + .25)) : 1 - seg(t, T.menuX, T.menuX + .15), hl: t < T.hl[0] ? 0 : t < T.hl[1] ? 1 : 2, sel: t < T.planSel ? 0 : 2 };
    P.mode = t < T.planSel ? 'Manual' : 'Plan';
    if (t > T.goMenu) { P.menu = { p: t < T.go ? back(seg(t, T.goMenu, T.goMenu + .2)) : 1 - seg(t, T.go + .05, T.go + .2), hl: t < T.go - .3 ? 2 : 1, sel: t < T.go ? 2 : 1 }; P.mode = t < T.go ? 'Plan' : 'Accept edits'; }
    if (t > T.plan - .3) A.msgs.push({ k: 't', html: "Here's the plan. I haven't changed any files.", p: seg(t, T.plan - .3, T.plan + .5) });
    if (t > T.go + .15) A.msgs.push({ k: 't', html: 'Plan approved. Building it now…', p: seg(t, T.go + .15, T.go + .6) });
    if (t >= T.plan) A.pane = { type: 'Plan', w: 760 * back(seg(t, T.plan, T.plan + .45), 1.3), items: T.items.map(x => seg(t, x, x + .42)), meta: seg(t, T.plan + .2, T.plan + .5) };
    A.dim = t > T.spot && t < T.spotEnd + .3;
  }
  // D：Diff
  if (t >= T.wipe3 + .4 && t < T.wipe4 + .4) {
    P.mode = 'Accept edits';
    A.msgs.push({ k: 't', html: 'Plan approved. Building it now…' });
    const ed = [['theme.ts', 12, 1], ['Header.tsx', 10, 2], ['App.tsx', 2, 0]];
    ed.forEach(([f, a, d], i) => { const t0 = T.edits[i]; if (t > t0) A.msgs.push({ k: 'tool', icon: 'edit', verb: 'Edit', arg: 'src/' + f, extra: ` <span class="d">+${a}</span>${d ? ` <span class="m">−${d}</span>` : ''}`, spin: t < t0 + .3, done: t >= t0 + .3, op: seg(t, t0, t0 + .12) }); });
    if (t > T.stat) { const k = seg(t, T.stat, T.stat + .6); A.msgs.push({ k: 'gap', h: 60 }, { k: 'stat', id: 'stat', files: 3, add: Math.round(24 * eo(k)), del: Math.round(3 * eo(k)), op: seg(t, T.stat, T.stat + .1), tf: `scale(${.9 + .1 * back(seg(t, T.stat, T.stat + .3))})`, hot: t > T.review - .3 && t < T.review + .3 }); }
    if (t > T.revEnd) A.msgs.push({ k: 'tool', icon: 'edit', verb: 'Edit', arg: 'src/styles/theme.ts', extra: ' · addressed 1 comment', done: true, op: seg(t, T.revEnd, T.revEnd + .15) });
    if (t >= T.diff) {
      const cmP = t < T.cmSend ? back(seg(t, T.cmOpen, T.cmOpen + .3)) : 1 - .55 * eo(seg(t, T.cmSend, T.cmSend + .25));
      const txt = typed(TY.cm, 'Use the system theme when nothing is saved.', t);
      A.pane = { type: 'Diff', w: 900 * back(seg(t, T.diff, T.diff + .45), 1.3), vis: Math.floor(seg(t, T.diff + .15, T.diff + .6) * 8.99), hov: t > T.line - .3 && t < T.line, sel: t >= T.line && t < T.rev,
        cm: t > T.cmOpen ? { h: cmP, text: txt, caret: t < T.cmSend && Math.floor(t * 2.4) % 2 === 0, sent: t >= T.cmSend } : null, rev: seg(t, T.rev, T.revEnd),
        files: [['theme.ts', t > T.revEnd ? 14 : 12, 1], ['Header.tsx', 10, 2], ['App.tsx', 2, 0]] };
    }
  }
  // E：Preview
  if (t >= T.wipe4 + .4) {
    P.mode = 'Accept edits';
    const te = [['run', 'Preview', 'npm run dev · localhost:5173', T.toolsE[0], T.load1], ['click', 'Click', 'button[aria-label="Toggle dark mode"]', T.stomp - .5, T.stomp], ['shot', 'Screenshot', 'contrast OK · choice survives reload', T.shot - .1, T.shot + .3]];
    te.forEach(([ic, v, a, t0, t1]) => { if (t > t0) A.msgs.push({ k: 'tool', icon: ic, verb: v, arg: a, spin: t < t1, done: t >= t1, op: seg(t, t0, t0 + .12) }); });
    if (t > T.shot + .5) A.msgs.push({ k: 't', html: 'Verified in the preview: the toggle works.', p: seg(t, T.shot + .5, T.shot + 1.2) });
    if (t >= T.prev && t < T.paneX + .7) A.pane = { type: 'Preview', w: 860 * (t < T.paneX ? back(seg(t, T.prev, T.prev + .45), 1.3) : 1 - eio(seg(t, T.paneX, T.paneX + .6))), load: seg(t, T.load0, T.load1) * 1 + seg(t, T.load1, T.load1 + .35) * .5, sun: t >= T.stomp };
  }
  // F: split screen
  if (t >= T.cmdN) {
    A.sessions.push({ name: 'Fix flaky timer test', run: 1, on: t > T.optClick, p: back(seg(t, T.cmdN + .05, T.cmdN + .35)) });
    A.newHot = t > T.cmdN - .05 && t < T.cmdN + .25;
  }
  if (t >= T.split - .05) {
    const k = back(seg(t, T.split - .05, T.split + .45), 1.1), full = WIN.w - 262;
    A.cols = [{ id: 1, title: 'Dark mode toggle', w: full - full / 2 * k, msgs: [{ k: 'u', html: 'Now open a pull request' }, { k: 'tool', icon: 'pr', verb: 'PR #42', arg: 'Add dark mode toggle', done: t > 45.4, spin: t <= 45.4 }],
        ci: { n: Math.max(0, Math.min(6, Math.floor((t - 45.9) / .3) + 1)), auto: t > 46.0, merged: t > T.merged } },
      { id: 2, title: 'Fix flaky timer test', border: true, msgs: [{ k: 'u', html: 'The timer test fails one run in ten. Find out why.' }, { k: 'tool', icon: 'run', verb: 'Run', arg: 'npm test -- --repeat 50', spin: t < T.pass, done: t >= T.pass }],
        term: { n: Math.floor(54 * seg(t, T.split + .4, T.pass)) } }];
    A.cols[0].badge = t > T.merged ? ' <span class="merged">Merged</span>' : '';
  }
}
function litRows(t) {
  const L = {}; ['App', 'Header', 'Timer', 'theme', 'main', 'pkg'].forEach((r, i) => { const a = T.rows[i]; if (t >= a) L[r] = ['Header', 'theme'].includes(r) ? (t > a + .3 ? 2 : 1) : (t < a + .35 ? 1 : 0); });
  return L;
}
function endCard(t) {
  const k = seg(t, VO.v16 - .1, VO.v16 + .5), words = ['Say it.', 'Plan it.', 'Review it.', 'Ship it.'];
  let h = `<div class="end" data-a="e-wrap" style="top:300px"><span data-a="e-title" style="display:inline-block;font-family:News;font-size:132px;font-weight:340;letter-spacing:-.025em;color:var(--ink);opacity:${k};transform:translateY(${(1 - eo(k)) * 30}px)">Claude Code</span></div>`;
  h += `<div class="end" style="top:596px;font-family:News;font-size:64px;font-weight:360;letter-spacing:-.01em">${words.map((w, i) => { const p = seg(t, T.w[i] - .08, T.w[i] + .12);
    return `<span data-a="ew-${i}" style="display:inline-block;margin:0 14px;opacity:${p};transform:translateY(${(1 - back(p)) * 18}px);${i === 3 ? 'color:var(--clay2);font-style:italic' : 'color:var(--ink)'}">${w}</span>`; }).join('')}</div>`;
  const c = seg(t, T.card, T.card + .6), d = seg(t, T.card + .8, T.card + 1.4);
  h += `<div class="end" style="top:716px;font-size:26px;font-weight:500;color:var(--mute);opacity:${c}">Claude Code · in the Claude app</div>`;
  h += `<div class="end" style="top:966px;font-size:15px;line-height:1.6;color:var(--faint);opacity:${d}">LemoLab × Claude Opus 5.5 · Unofficial fan film · Voice: Kokoro · Fonts: Inter, Newsreader, JetBrains Mono (OFL)<br>Piano: Salamander Grand Piano V3, Alexander Holm (CC BY 3.0) · Drums: MuldjordKit, Lars Muldjord (CC BY 4.0) · Samples: Versilian Studios, Karoryfer (CC0)</div>`;
  return h;
}
function hud(F, t) {
  const H = F.hud, dark = F.dark.base === 'D' && !F.dark.over;
  H.dark = dark || (F.dark.over === 'D' && F.dark.r > 1500);
  // subtitles
  const s = SUBS.find(x => t >= x.t0 && t < x.t1);
  if (s) H.cap = { text: s.text, op: Math.min(seg(t, s.t0, s.t0 + .12), 1 - seg(t, s.t1 - .15, s.t1)), y: (1 - eo(seg(t, s.t0, s.t0 + .2))) * 10 };
  // chapter transitions and chapter tags
  for (const [t0, no, nm] of CH) {
    if (t >= t0 && t < t0 + .85) H.wipe = { p: (t - t0) / .85, no, nm };
    if (t >= t0 + .6 && t < t0 + 7.8) H.chap = { no, nm, op: Math.min(seg(t, t0 + .6, t0 + .9), 1 - seg(t, t0 + 7.5, t0 + 7.8)) };
  }
  if (t >= 43.2 && t < 49.2) H.chap = { no: '05', nm: 'Side by side', op: Math.min(seg(t, 43.2, 43.5), 1 - seg(t, 48.9, 49.2)) };
  // keystroke HUD
  const KC = [[T.atKey - .1, ['@'], 'mention a file', [T.atKey]], [T.menu - .35, ['⇧', '⌘', 'M'], 'permission mode', [T.menu - .05]], [T.cmSend - .45, ['⌘', '↵'], 'send comments', [T.cmSend]],
    [T.cmdN - .35, ['⌘', 'N'], 'new session', [T.cmdN]], [T.optClick - .3, ['⌥', 'click'], 'split view', [T.optClick]]];
  for (const [t0, keys, label, press] of KC) if (t >= t0 && t < t0 + 1.5) { const nxt = KC.find(k => k[0] > t0); if (nxt && t >= nxt[0]) continue;
    H.keys = { keys, label, op: Math.min(seg(t, t0, t0 + .15), 1 - seg(t, t0 + 1.25, t0 + 1.5)), dn: press.some(p => t >= p && t < p + .18), y: (1 - back(seg(t, t0, t0 + .3))) * 20 }; }
  // 4× fast-forward label
  if (t > T.rows[0] - .1 && t < T.readEnd + .1) H.ramp = { op: Math.min(seg(t, T.rows[0] - .1, T.rows[0]), 1 - seg(t, T.readEnd - .1, T.readEnd + .1)), blink: Math.floor(t * 4) % 2 };
  // spotlight: No files changed
  if (t > T.spot - .1 && t < T.spotEnd + .3) H.spot = { key: 'nfc', op: Math.min(seg(t, T.spot - .1, T.spot + .2), 1 - seg(t, T.spotEnd, T.spotEnd + .3)) };
  // screenshot flash + toast
  if (t > T.shot && t < T.shot + .3) H.flash = .5 * (1 - seg(t, T.shot, T.shot + .3));
  if (t > T.shot + .05 && t < T.shot + 1.8) H.toast = { key: 'pane', text: '▣  Screenshot · contrast OK', op: Math.min(seg(t, T.shot + .05, T.shot + .2), 1 - seg(t, T.shot + 1.5, T.shot + 1.8)) };
  if (t > T.fade) H.fade = seg(t, T.fade, DUR);
}
