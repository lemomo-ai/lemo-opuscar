// 《没弄反》 Not Swapped: the whole film as data. Layout of both boards, every stroke with its time, the sliding
// panel, the drying wet band, the one wipe, the camera, the texts for readcheck and the sound events.
// Units: world = the board's slate (x 0…6400, y 0…1700). Front-panel things are stored in panel-local units
// (layer 'FL'); the panel's offset slideX(t) moves them. Back-board things are in world units (layer 'BK').
import { clamp, lerp, ss, eio, eo } from '/core/lib.js';
import { Stroke, catmull, n1, rng } from './chalk.js';
import { writeChar, writeLine, writeLatin, latinWidth } from './hand.js';
import { HZ } from './hz.js';
const HZ_COUNT = c => HZ[c].map((_, i) => i);
import { writeForm } from './ancient.js';
import { PW } from './stage.js';

export const G1 = { x: 1150, y: 800, size: 620 }, G2 = { x: 2200, y: 800, size: 620 };   // painted grids on FL
export const SMALL = [{ x: 560, y: 1330, size: 300 }];                                      // one painted small grid on the back board
const CH = 520;                                                                              // big characters
// voice-over (vo/, edge-tts zh-CN-XiaoxiaoNeural +15%): lengths from vo/dur.json; the picture is timed to the voice
export const VO = { n1: 3.146, n2: 4.553, n3: 6.725, n4: 3.617, n5: 2.28, n6: 2.41, n7: 6.623, n8: 4.102, n9: 1.307 };
// subtitles: the voice as said (Chinese) and a free English translation, one line each
export const SUB = {
  n1: [['网上有个说法：射和矮，这两个字弄反了。', 'People online say the characters 射 and 矮 got swapped.']],
  n2: [['射字左边是身，右边是寸。', '射 is 身 (body) plus 寸 (inch).'], ['身高一寸，那不就是矮吗？', 'One inch tall: isn\u2019t that short?']],
  n3: [['矮字左边是矢，矢就是箭；', 'On the left of 矮 is 矢, an arrow;'], ['右边是委，有放下的意思。', 'on the right is 委, to let go.'], ['把箭放出去，那不就是射吗？', 'Letting an arrow go: isn\u2019t that shooting?']],
  n4: [['其实，射最早画的是一张弓，弓上搭着一支箭。', 'In fact, the oldest 射 is a bow with an arrow on it.']],
  n5: [['后来又加了一只手，在拉弓弦。', 'Later a hand was added, pulling the string.']],
  n6: [['弓慢慢写成了身，手写成了寸。', 'The bow slowly became 身, and the hand became 寸.']],
  n7: [['那矮里为什么有支箭？', 'Why is there an arrow in 矮?'], ['古人拿箭当尺子，用来量长短。', 'People once used arrows as rulers to measure length.'], ['所以短字里，也有这支箭。', 'That is why 短 (short) has one too.']],
  n8: [['射，是拉弓放箭；', '射 means drawing a bow and shooting;'], ['矮，就是个子短，委只管读音。', '矮 means short, and 委 only gives the sound.']],
  n9: [['所以，没弄反。', 'So they were never swapped.']],
};
const isCJK = c => /[\p{Script=Han}]/u.test(c);
export const needOf = txt => { let a = 0, b = 0; for (const c of txt) { if (/\s/.test(c)) continue; isCJK(c) ? a++ : b++; } return Math.max(1.5, a / 4.5 + b / 15 + 1.5); };

export function build(W = 1920, H = 1080) {
  const S = [], TX = [], EV = [], SUBS = [];
  const add = (arr, layer, phase = 'pre') => { arr.forEach(s => { s.layer = layer; s.phase = phase; S.push(s); }); return arr; };
  const text = (id, txt, layer, strokes, t1 = 1e9, pad = 6) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of strokes) for (const [x, y] of s.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    TX.push({ id, text: txt, layer, box: [x0 - pad, y0 - pad, x1 + pad, y1 + pad], t0: strokes[0].t0, t1 });
  };
  const line = (pts, o, t0, dur) => { const s = new Stroke(o.smooth ? catmull(pts, 10) : pts, { kind: 'write', taper: .2, taperLen: .2, land: .6, skip: .14, endSpecks: true, specks: .6, ...o }); s.t0 = t0; s.t1 = t0 + dur; return s; };
  const centred = (txt, cx, cy, size, t, o = {}) => { const w = writeLine(txt, 0, 0, size, 0, o).x; return writeLine(txt, cx - w / 2, cy, size, t, o); };
  const centredLatin = (txt, cx, by, cap, t, o = {}) => writeLatin(txt, cx - latinWidth(txt, cap) / 2, by, cap, t, o);
  // a voice line and its subtitle: the subtitle stays up for its reading time; returns the earliest start of the next line
  const vo = (id, t) => {
    EV.push({ t, type: 'vo', id });
    const parts = SUB[id], zh = parts.map(p => p[0]).join(''), en = parts.map(p => p[1]).join(' '), end = t + VO[id], t0 = t - .08;
    const t1 = end + .3;                                                            // next line may start 0.35 s after this one ends
    // one subtitle per sentence, timed by its share of the spoken characters (a pause counts as half a character)
    const w = parts.map(p => [...p[0]].reduce((a, c) => a + (isCJK(c) ? 1 : /[，。；？：]/.test(c) ? .5 : 0), 0)), W0 = w.reduce((a, b) => a + b, 0);
    let acc = 0;
    parts.forEach((p, k) => {
      const a = k ? t + VO[id] * acc / W0 : t0; acc += w[k];
      const b = k === parts.length - 1 ? Math.max(end + .3, a + 1.0) : t + VO[id] * acc / W0;
      SUBS.push({ id: id + (parts.length > 1 ? '-' + (k + 1) : ''), t0: a, t1: b, zh: p[0], en: p[1], vend: end });
      EV.push({ t: +a.toFixed(3), type: 'sub', t1: +b.toFixed(3), zh: p[0], en: p[1] });     // for the .srt
    });
    T[id] = end; return t1 + .05;
  };
  const T = {};

  // ───────── already on the board before the film starts (front panel, top right): the date, the child's question
  const date = add(writeLine('10月28日 星期三', 2660, 104, 66, -20, { seed: 2, latinScale: .7, speed: 60 }), 'FL');
  text('date', '10月28日 星期三', 'FL', date);
  const kidZh = add(writeLine('射和矮弄反了吗？', 2330, 262, 104, -19, { hand: 'child', seed: 7, speed: 60 }), 'FL');
  text('kid-zh', '射和矮弄反了吗？', 'FL', kidZh);

  // ───────── S1 · title at the top of the lesson; the wet streak dries; the two characters go into their grids
  const ti = add(writeLine('汉字的故事', 1000, 252, 124, .05, { seed: 4, speed: 22 }), 'FL');
  const tie = add(writeLatin('The Story of Chinese Characters', 1012, 400, 46, ti.end + .04, { seed: 5, lspeed: 200 }), 'FL');
  text('title', '汉字的故事', 'FL', ti); text('title-en', 'The Story of Chinese Characters', 'FL', tie);
  EV.push({ t: .05, type: 'title' });
  T.title = tie.end; T.dry = ti.end + .45;
  const wet = { x0: 1690, y0: 160, y1: 430, xEnd: 2280, t0: ti.end - .35, t1: T.dry + .45, bx0: 1700 };
  let next = vo('n1', 2.1);
  const she = add(writeChar('射', G1.x, G1.y, CH, 2.8, { seed: 11, speed: 9, gap: .01 }), 'FL');
  const ai = add(writeChar('矮', G2.x, G2.y, CH, she.end + .1, { seed: 21, speed: 11, gap: .01 }), 'FL');
  T.s2 = Math.max(next, ai.end + .3, T.dry - .3 + 3.2, tie[0].t0 + 3.4);   // the question frame holds until the title and the child's question are read

  // ───────── S2 · 射 close: 身 | 寸, then widen while 一寸高？ is written
  next = vo('n2', T.s2 + .05);
  const L1 = 921, M1 = 1176, R1 = 1395;
  let t = T.s2 + .45;
  add([line([[L1 + 8, 1132], [M1 - 14, 1128]], { w: 8, color: 'white' }, t, .22)], 'FL');
  const lShen = add(writeChar('身', (L1 + M1) / 2, 1212, 100, t + .25, { seed: 12, speed: 40 }), 'FL'); t = T.s2 + 1.45;
  add([line([[M1 + 14, 1128], [R1 - 6, 1124]], { w: 8, color: 'white' }, t, .2)], 'FL');
  const lCun = add(writeChar('寸', (M1 + R1) / 2, 1212, 100, t + .22, { seed: 13, speed: 40 }), 'FL');
  text('lab-shen', '身', 'FL', lShen); text('lab-cun', '寸', 'FL', lCun);
  T.wide = T.s2 + 2.15;
  const q1 = add(centred('一寸高？', G1.x, 1345, 100, T.wide + .25, { seed: 14, speed: 50 }), 'FL'); t = q1.end + .06;
  const q1e = add(centredLatin('An inch tall?', G1.x, 1462, 50, t, { seed: 15, lspeed: 110 }), 'FL');

  // ───────── S3 · 矮: 矢 (an arrow) | 委, 放箭？, the crossed arrows; hold; the panel slides
  T.s3 = next; next = vo('n3', T.s3);
  const L2 = 1971, M2 = 2187, R2 = 2454;
  t = T.s3 + .2;
  add([line([[L2 + 6, 1132], [M2 - 14, 1129]], { w: 8, color: 'white' }, t, .2)], 'FL');
  const lShi = add(writeChar('矢', (L2 + M2) / 2, 1212, 100, t + .22, { seed: 22, speed: 40 }), 'FL');
  t = T.s3 + 2.1;
  add([line([[M2 + 14, 1129], [R2 - 6, 1125]], { w: 8, color: 'white' }, t, .2)], 'FL');
  const lWei = add(writeChar('委', (M2 + R2) / 2, 1212, 100, t + .22, { seed: 23, speed: 40 }), 'FL');
  text('lab-shi', '矢', 'FL', lShi); text('lab-wei', '委', 'FL', lWei);
  const q2 = add(centred('放箭？', G2.x, 1345, 100, T.s3 + 3.25, { seed: 24, speed: 50 }), 'FL'); t = q2.end + .06;
  const q2e = add(centredLatin('Let an arrow fly?', G2.x, 1462, 50, t, { seed: 25, lspeed: 110 }), 'FL');
  t = T.s3 + 4.9;
  const A1 = [[1536, 580], [1640, 740], [1700, 870], [1792, 1030]], A2 = [[1796, 580], [1700, 730], [1620, 890], [1534, 1030]];
  const arr1 = line(A1, { w: 9, color: 'white', smooth: true, taper: .05 }, t, .3), arr2 = line(A2, { w: 9, color: 'white', smooth: true, taper: .05 }, t + .2, .3);
  const head = (p, q, t0) => { const a = Math.atan2(p[1] - q[1], p[0] - q[0]), L = 50; return line([[p[0] + Math.cos(a + 2.6) * L, p[1] + Math.sin(a + 2.6) * L], p, [p[0] + Math.cos(a - 2.6) * L, p[1] + Math.sin(a - 2.6) * L]], { w: 9, color: 'white', taper: .1 }, t0, .14); };
  const h1 = head(arr1.end, arr1.at(arr1.len - 30), t + .31), h2 = head(arr2.end, arr2.at(arr2.len - 30), t + .51);
  add([arr1, arr2, h1, h2], 'FL');
  T.s4 = Math.max(T.n3 + .05, q2e[0].t0 + 2.5);

  // ───────── S4 · the front panel slides away, the back board, the timeline
  T.slide0 = T.s4; T.slide1 = T.s4 + .9; T.whip = T.slide0 + .72; T.s5 = T.whip + .28;
  EV.push({ t: T.slide0, type: 'slide', d: .9 }, { t: T.whip, type: 'whip' });
  t = T.whip + .08;                                              // the timeline is already being drawn as the whip lands
  const TLY = 905;
  add([line([[230, TLY], [1400, TLY - 3], [2400, TLY - 6], [3060, TLY - 8]], { w: 8, color: 'white', smooth: true, taper: .05 }, t, .5)], 'BK');
  add([line([[262, TLY - 34], [258, TLY + 34]], { w: 8, color: 'white' }, t - .02, .1)], 'BK');

  // ───────── S5 · one character across three thousand years, paced by the voice
  const FX = [560, 1240, 1920, 2600], FY = 600, FS = 430;
  const forms = [], names = [['甲骨文', 'oracle bone'], ['金文', 'bronze'], ['小篆', 'seal'], ['楷书', 'today']];
  T.s5a = T.whip + .3;
  next = vo('n4', Math.max(T.slide0 + .3, next));
  const starts = [T.s5a + .05, 0, 0, 0];
  starts[1] = T.n4 - .4;                                         // bronze: bow and arrow first; its hand lands as the voice says 一只手
  T.n5s = next; next = vo('n5', next); starts[2] = next - .7;
  T.n6s = next; next = vo('n6', next); starts[3] = T.n6s + .3;
  ['oracle', 'bronze', 'seal', 'kai'].forEach((k, i) => {
    t = starts[i];
    add([line([[FX[i], TLY - 26], [FX[i], TLY + 26]], { w: 8, color: 'white' }, t, .1)], 'BK');
    const f = add(writeForm(k, FX[i], FY, k === 'kai' ? FS * .96 : FS, t + .1, { seed: 40 + i, speed: k === 'kai' ? 22 : 9, handAt: k === 'bronze' ? T.n5s + .6 : null }), 'BK');
    forms.push(f); t = Math.max(...f.filter(x => !x.hand).map(x => x.t1)) + .05;   // the name follows the bow and arrow, not the late hand
    const nz = add(centred(names[i][0], FX[i], 1002, 84, t, { seed: 50 + i, speed: 70 }), 'BK');
    const ne = add(centredLatin(names[i][1], FX[i], 1100, 44, nz.end + .03, { seed: 60 + i, lspeed: 120 }), 'BK');
    text('form-zh-' + i, names[i][0], 'BK', nz); text('form-en-' + i, names[i][1], 'BK', ne);
    if (i === 3) { T.kl = ne.end; T.kf = f.end; }
  });
  EV.push({ t: forms[0][1].t1, type: 'twang' }, { t: forms[1][forms[1].length - 1].t1, type: 'twang2' });
  t = T.kf + .05;
  const ex = add(centred('身←弓 · 寸←手', FX[3], 1215, 84, t, { seed: 70, speed: 80, cgap: .02 }), 'BK');
  const exe = add(centred('body ← bow · inch ← hand', FX[3], 1300, 54, ex[0].t0 + .35, { seed: 71, lspeed: 120, latinScale: .74, space: .3, speed: 80 }), 'BK');
  text('ex-zh', '身←弓 · 寸←手', 'BK', ex); text('ex-en', 'body ← bow · inch ← hand', 'BK', exe);
  T.ex = Math.max(ex.end, exe.end); T.s6 = Math.max(ex[0].t0 + 2.7, exe[0].t0 + 2.85);   // the question of n7 starts over this frame (a J-cut)

  // ───────── S6 · 短: its 矢 in orange; an arrow used as a ruler; 以矢为正; the orange line leaves for 矮
  const g = SMALL[0];
  next = vo('n7', next); T.s6 = Math.max(T.s6, T.n7 - VO.n7 + 1.0);
  t = T.s6 + .12;
  const duan = add(writeChar('短', g.x, g.y, 250, t, { seed: 83, speed: 16, gap: .01, colors: { 0: 'orange', 1: 'orange', 2: 'orange', 3: 'orange', 4: 'orange' }, R: 3 }), 'BK');
  text('duan', '短', 'BK', duan);
  const yz = add(writeLine('以矢为正', 800, 1300, 104, duan.end - .3, { seed: 90, speed: 60 }), 'BK');
  const yze = add(writeLatin('the arrow is the ruler', 806, 1418, 44, yz.end + .05, { seed: 91, lspeed: 120 }), 'BK');
  text('yz-zh', '以矢为正', 'BK', yz); text('yz-en', 'the arrow is the ruler', 'BK', yze);
  // the arrow as a ruler: an orange arrow laid along a white line, the line ticked off in arrow lengths ("古人拿箭当尺子")
  t = Math.max(duan.end + .1, T.n7 - VO.n7 + 1.7);                // as the voice says 古人拿箭当尺子
  const RY = 1520, RX = 820, AL = 300;
  const ruler = [
    line([[RX, RY + 50], [RX + 2 * AL + 10, RY + 48]], { w: 7, color: 'white' }, t, 0.24),
    line([[RX, RY + 22], [RX, RY + 80]], { w: 7, color: 'white' }, t + 0.24, 0.06),
    line([[RX + AL, RY + 24], [RX + AL, RY + 76]], { w: 7, color: 'white' }, t + 0.32, 0.06),
    line([[RX + 2 * AL, RY + 22], [RX + 2 * AL, RY + 80]], { w: 7, color: 'white' }, t + 0.39, 0.06),
    line([[RX + 6, RY], [RX + AL - 8, RY]], { w: 8, color: 'orange' }, t + 0.52, 0.18),                       // shaft
    line([[RX + AL - 34, RY - 18], [RX + AL - 8, RY], [RX + AL - 34, RY + 18]], { w: 8, color: 'orange', taper: .1 }, t + 0.70, 0.10),   // head
    line([[RX + 30, RY - 16], [RX + 8, RY], [RX + 30, RY + 16]], { w: 7, color: 'orange', taper: .1 }, t + 0.81, 0.08),
    line([[RX + 52, RY - 16], [RX + 30, RY], [RX + 52, RY + 16]], { w: 7, color: 'orange', taper: .1 }, t + 0.90, 0.08),
    line([[RX + AL + 6, RY], [RX + 2 * AL - 8, RY]], { w: 8, color: 'orange' }, t + 1.05, 0.18),               // laid again: two arrows long
    line([[RX + 2 * AL - 34, RY - 18], [RX + 2 * AL - 8, RY], [RX + 2 * AL - 34, RY + 18]], { w: 8, color: 'orange', taper: .1 }, t + 1.23, 0.10),
  ];
  add(ruler, 'BK'); EV.push({ t: t + .24, type: 'tick' }, { t: t + 1.23, type: 'tick' });
  T.thread = Math.max(T.n7 - 2.3, ruler[ruler.length - 1].t1 + .2, yze[0].t0 + 2.8);
  const lab = [(L2 + M2) / 2 + PW, 1212];
  const TH = [[500, 1440], [506, 1600], [700, 1640], [1600, 1636], [2600, 1630], [3200, 1626], [4000, 1630], [4600, 1624], [4770, 1570], [4800, 1330], [4900, 1236], [4990, 1210],
    [lab[0] - 40, lab[1] - 92], [lab[0] + 60, lab[1] - 80], [lab[0] + 96, lab[1] + 10], [lab[0] + 40, lab[1] + 86], [lab[0] - 70, lab[1] + 74], [lab[0] - 98, lab[1] - 10], [lab[0] - 40, lab[1] - 92]];
  const thread = line(TH, { w: 9, color: 'orange', smooth: true, taper: .04, wob: 1.2 }, T.thread, 1.6);
  thread.ease = u => u;                                          // even speed: half of it is seen leaving, half arriving
  thread.layer = 'WORLD'; thread.phase = 'pre'; S.push(thread);
  T.threadEnd = T.thread + 1.6; T.threadCut = T.thread + .6;
  EV.push({ t: T.thread, type: 'thread', d: 1.6 });

  // ───────── S8 · the one wipe, the right readings, the answer
  T.s8 = T.threadCut; T.wipe0 = Math.max(T.threadEnd + .1, T.n7 + .05); T.wipe1 = T.wipe0 + .75;
  EV.push({ t: T.wipe0, type: 'wipe', d: .75 });
  const WP = [[860, 1412], [1350, 1420], [1590, 1240], [1650, 860], [1666, 500], [1690, 860], [1760, 1240], [2010, 1420], [2500, 1408]];
  const wipe = { t0: T.wipe0, t1: T.wipe1, w: 360, path: catmull(WP, 12) };
  [q1, q1e, q2, q2e, [arr1, arr2, h1, h2]].forEach(a => a.forEach(s => s.wiped = true));
  t = T.wipe1 + .1;
  next = vo('n8', Math.max(next, T.wipe0 - .45));
  const r1 = add(centred('弓 + 手', G1.x, 1345, 100, t, { seed: 31, speed: 90 }), 'FL', 'post'); t = r1.end + .05;
  const r1e = add(centredLatin('bow + hand', G1.x, 1462, 50, t, { seed: 32, lspeed: 110 }), 'FL', 'post'); t = Math.max(r1e.end + .1, T.n8 - 2.2);
  const r2 = add(centred('矢 + 委', G2.x, 1345, 100, t, { seed: 33, speed: 90 }), 'FL', 'post'); t = r2.end + .05;
  const r2e = add(centred('arrow → length · wei → sound', G2.x + 40, 1450, 56, t, { seed: 34, lspeed: 120, latinScale: .74, space: .3, speed: 80 }), 'FL', 'post'); t = r2e.end;
  text('r1', '弓 + 手', 'FL', r1); text('r1e', 'bow + hand', 'FL', r1e); text('r2', '矢 + 委', 'FL', r2); text('r2e', 'arrow → length · wei → sound', 'FL', r2e);
  T.verdict = T.n8 + 1.45;                                      // the verdict waits 1.5 s after the readings are said (same frame: the readings stay)
  next = vo('n9', T.verdict + .05); t = T.verdict;
  const ans = add(writeLine('没弄反', 2620, 560, 124, t, { seed: 35, speed: 40 }), 'FL', 'post'); t = ans.end + .08;
  const tick = add(writeChar('✓', 3090, 540, 140, t, { seed: 37, speed: 60 }), 'FL', 'post'); t = tick.end + .05;
  const anse = add(writeLatin('Not swapped', 2630, 706, 50, t, { seed: 36, lspeed: 90 }), 'FL', 'post'); t = anse.end;
  text('ans', '没弄反', 'FL', ans); text('anse', 'Not swapped', 'FL', anse);
  EV.push({ t: tick.end, type: 'tap', big: 1 });
  T.s9 = Math.max(t + .3, anse[0].t0 + 2.25); T.wall = T.s9 + 1.0;
  T.endc = T.wall + 1.2;
  EV.push({ t: T.s9 + .3, type: 'bell' });
  const wipedIds = { q1: [q1, '一寸高？'], q1e: [q1e, 'An inch tall?'], q2: [q2, '放箭？'], q2e: [q2e, 'Let an arrow fly?'] };
  for (const [id, [st, txt]] of Object.entries(wipedIds)) text(id, txt, 'FL', st, T.wipe0 + .3);

  // ───────── end card · the front panel slides back; on the clean panel behind it, the sign-off is written
  T.back0 = T.endc; T.back1 = T.endc + .85;
  EV.push({ t: T.back0, type: 'slide', d: .85 });
  const e1 = add(centred('汉字的故事', 4800, 740, 200, T.back0 + .2, { seed: 98, speed: 170 }), 'FR');
  const e1e = add(centredLatin('The Story of Chinese Characters', 4800, 990, 70, T.back0 + .7, { seed: 99, lspeed: 420 }), 'FR');
  const c2 = add(centredLatin('LemoLab × Claude Opus 5.5', 4800, 1240, 80, T.back0 + .45, { seed: 97, lspeed: 240 }), 'FR');
  // licence credit for the chalk recording: already on the clean panel when it slides back (t < 0: drawn whole, never heard)
  const cr = add(centredLatin('Chalk sound: “WWS Chalk” by Work With Sounds / La Fonderie, CC BY 4.0', 4800, 1400, 30, -3, { seed: 96, lspeed: 4000 }), 'FR');
  cr.forEach(s => { s.t0 = -3; s.t1 = -2; });
  text('end-title', '汉字的故事', 'FR', e1); text('end-title-en', 'The Story of Chinese Characters', 'FR', e1e); text('end-credit', 'LemoLab × Claude Opus 5.5', 'FR', c2);
  T.DUR = +Math.max(c2[0].t0 + 3.0, e1e[0].t0 + needOf('The Story of Chinese Characters') + .05).toFixed(2);

  // ───────── the sliding panel: away at S4, back at the end card
  const slideX = tt => PW * (eio(clamp((tt - T.slide0) / (T.slide1 - T.slide0))) - eio(clamp((tt - T.back0) / (T.back1 - T.back0))));

  // ───────── camera: keys [t, cx, cy, s] in world units, eased between keys; each shot cuts to its own keys
  const QF = { cx: 1800, cy: 901, s: .58 };                 // the question / verdict frame (panel-local), clear of the subtitle bar
  const shots = [
    { t0: 0, keys: [[0, 1360, 300, 1.5], [ti.end - .05, 1400, 310, 1.42], [T.dry, QF.cx, QF.cy, QF.s], [T.s2, QF.cx + 10, QF.cy, QF.s]] },
    { t0: T.s2, keys: [[T.s2, 1100, 925, 1.15], [T.wide, 1110, 925, 1.15], [T.wide + .8, QF.cx, QF.cy, QF.s], [T.s4, QF.cx, QF.cy, QF.s]] },
    { t0: T.whip, blur: 3, keys: [[T.whip, 1500, 760, .86], [T.whip + .3, 900, 728, .9], [T.s5a, 900, 728, .9]] },
    { t0: T.s5a + .001, keys: [[T.s5a, 900, 728, .9], [T.s5a + 1.3, 790, 775, 1.15], [starts[2] + .12, 830, 775, 1.15], [starts[2] + .8, 1580, 775, 1.15], [starts[3], 1640, 775, 1.15], [starts[3] + .7, 2250, 775, 1.15], [T.kf + .15, 2260, 776, 1.15], [T.kf + 1.0, 2540, 929, .88], [T.s6, 2550, 930, .885]] },
    { t0: T.s6, keys: [[T.s6, 850, 1440, 1.0], [T.threadCut, 870, 1444, 1.0]] },
    { t0: T.s8, keys: [[T.s8, QF.cx + PW, QF.cy, QF.s], [T.s9, QF.cx + PW, QF.cy, QF.s]] },
    { t0: T.s9, keys: [[T.s9, QF.cx + PW, QF.cy, QF.s], [T.s9 + .5, 5150, 840, .46], [T.wall, 3200, 860, .284], [T.endc, 3200, 862, .283]] },
    { t0: T.endc, keys: [[T.endc, 4800, 1000, .8], [T.DUR, 4800, 996, .81]] },
  ];
  shots.forEach((s, i) => s.t1 = i + 1 < shots.length ? shots[i + 1].t0 : 1e9);
  const camAt = tt => {
    let i = 0; while (i + 1 < shots.length && tt >= shots[i + 1].t0) i++;
    const sh = shots[i], K = sh.keys;
    let k = 0; while (k + 1 < K.length - 1 && tt > K[k + 1][0]) k++;
    const a = K[k], b = K[Math.min(K.length - 1, k + 1)], u = b[0] > a[0] ? eio(clamp((tt - a[0]) / (b[0] - a[0]))) : 1;
    let cx = lerp(a[1], b[1], u), cy = lerp(a[2], b[2], u), s = lerp(a[3], b[3], u);
    if (sh.follow) {
      const gg = Array.isArray(sh.follow) ? sh.follow : [sh.follow], f = front(gg, tt - .15);
      if (f) {
        const fx = f[0] + (gg[0].layer === 'FL' ? slideX(tt) : 0), k2 = sh.followK ?? .5, w = followWeight(gg, tt);
        cx = lerp(cx, lerp(cx, fx, k2), w); cy = lerp(cy, lerp(cy, f[1], k2 * .6), w);
      }
    }
    return { cx, cy, s, shot: i };
  };
  // chalk events for the sound: every stroke, with its length, colour and where it sits across the frame
  for (const st of S) {
    if (st.t1 <= 0 || st.t0 >= T.DUR) continue;
    const c = camAt((st.t0 + st.t1) / 2), p = st.at(st.len / 2), x = p[0] + (st.layer === 'FL' ? slideX(st.t0) : st.layer === 'FR' ? PW : 0);
    const sx = (x - c.cx) * c.s / W * 2;
    if (Math.abs(sx) > 1.3) continue;                          // off screen: not heard
    EV.push({ t: +st.t0.toFixed(3), type: 'chalk', d: +(st.t1 - st.t0).toFixed(3), len: Math.round(st.len * c.s), color: st.color, pan: +clamp(sx * .6, -.7, .7).toFixed(2), big: st.w > 12 ? 1 : 0 });
  }
  EV.sort((a, b) => a.t - b.t);
  return { S, TX, EV, SUBS, T, wet, wipe, slideX, camAt, shots, DUR: T.DUR, G1, G2, SMALL, FX, FY };
}

// where the writing is now inside a group of strokes (null outside the group's time)
function front(group, t) {
  const g = Array.isArray(group) ? group : [group];
  if (!g.length || t < g[0].t0 - .3 || t > g[g.length - 1].t1 + .3) return null;
  for (let i = 0; i < g.length; i++) {
    const s = g[i]; if (t <= s.t1) { if (t < s.t0) { const p = g[i - 1]; return p ? lerpP(p.end, s.start, (t - p.t1) / Math.max(.01, s.t0 - p.t1)) : s.start; } return s.at(s.prog(t) * s.len); }
  }
  return g[g.length - 1].end;
}
const lerpP = (a, b, u) => [lerp(a[0], b[0], ss(u)), lerp(a[1], b[1], ss(u))];
function followWeight(group, t) {
  const g = Array.isArray(group) ? group : [group], a = g[0].t0, b = g[g.length - 1].t1;
  return ss((t - a + .3) / .5) * (1 - ss((t - b) / .6));
}
