// Character model sheet: index.html?sheet=1 (the whole sheet is also made of paper cut-outs + four paper colours)
import { g, C, S, clear, piece, rough, roughC, rectP, circP, label, smooth } from './paper.js';
import { layout, drawLine } from './glyph.js';
import { agentSide, agentFront, courierSide, courierFront, key, keyholeP, runPose, walkPose, coRunPose, AGENT_POSE, COURIER_POSE } from './chars.js';

const LBL = (s, x, y, size = 20, col = C.ink, al = 'center') => label(s, x, y, `600 ${size}px LSpartan`, col, al, 2.5);
function card(x, y, w, h, col, seed) { piece(roughC('card' + seed, () => rectP(x, y, w, h), seed, 1.6, 12), col, { gap: 0, shA: .25 }); }
function groundTick(x, y, w = 150) { piece(rough([[x - w / 2, y + 2], [x + w / 2, y + 2], [x + w / 2 - 6, y + 7], [x - w / 2 + 6, y + 7]], x * 3, .8, 10), C.paperD, { gap: 0, shadow: false }); }

export function modelSheet(t, Q) {
  clear(C.paper);
  // ── title ──
  const tl = layout('THE AGENT  &  THE COURIER', 96, { track: .03 });
  drawLine(tl, 56, 118, { col: C.ink, seed: 3, jit: 1.2, amp: 1.2 });
  LBL('MODEL SHEET', 56 + tl.width + 40, 112, 26, C.red, 'left');
  label('“The Velvet Cipher” · 60s Spy Title Sequence · cut-paper silhouettes · four inks · always in profile on screen, moves on twos', 58, 156, '400 21px LSpartan', C.ink);
  // red diagonal (the grid motif)
  for (let i = 0; i < 3; i++) piece(rough([[1560 + i * 26, 40], [1574 + i * 26, 40], [1474 + i * 26, 180], [1460 + i * 26, 180]], 900 + i, .8, 10), C.red, { gap: 0, shadow: false });

  // ── A. agent turnaround ──
  const gy = 590, sc = .6;
  LBL('THE AGENT', 60, 210, 22, C.red, 'left');
  agentFront(130, gy, sc);
  agentSide(290, gy, sc, AGENT_POSE.stand);
  agentFront(450, gy, sc, true);
  [['FRONT', 130], ['SIDE', 290], ['BACK', 450]].forEach(([s, x]) => { groundTick(x, gy); LBL(s, x, gy + 40, 18); });
  // height ruler: 7 heads tall
  const hu = 540 * sc / 7.2;
  for (let k = 0; k <= 7; k++) { const yy = gy - k * hu * 1.0; piece([[536, yy - 1], [k % 2 ? 546 : 554, yy - 1], [k % 2 ? 546 : 554, yy + 1], [536, yy + 1]], C.ink, { gap: 0, shadow: false }); }
  piece([[535, gy - 7 * hu], [537, gy - 7 * hu], [537, gy], [535, gy]], C.ink, { gap: 0, shadow: false });
  label('7 heads', 552, gy - 3.5 * hu, '500 15px LSpartan', C.ink);
  label('red tie =', 552, gy - 5.4 * hu, '500 15px LSpartan', C.red); label('his only colour', 552, gy - 5.4 * hu + 18, '500 15px LSpartan', C.red);

  // ── B. running ──
  LBL('KEY POSE 1 · RUN', 700, 210, 22, C.red, 'left');
  label('8 drawings on twos · 1 step = 1 beat @132 · tie streams back', 700, 236, '400 16px LSpartan', C.ink);
  for (let i = 0; i < 4; i++) { const x = 760 + i * 145; agentSide(x, gy, .56, runPose(i / 8 + .06)); }
  groundTick(980, gy, 580);
  ['CONTACT', 'DOWN', 'PASS', 'UP'].forEach((s, i) => LBL(s, 770 + i * 145, gy + 40, 15));

  // ── C. against the wall (I-letter pillar) ──
  const gy2 = 1000;
  LBL('KEY POSE 2 · FLATTEN', 60, 680, 22, C.red, 'left');
  label('back to the pillar, belly in — the red tie gives him away', 60, 705, '400 16px LSpartan', C.ink);
  agentSide(130, gy2, .5, AGENT_POSE.flatten);
  groundTick(130, gy2, 120); LBL('SUCKED IN', 130, gy2 + 40, 15);
  // card: mustard-yellow ground, the I pillar in front of him, only the hat brim, nose tip and shoe tips showing
  const cx = 240, cw = 300;
  card(cx, 728, cw, 290, C.mus, 77);
  S.bg = C.mus;
  g.save(); g.beginPath(); g.rect(cx + 6, 732, cw - 12, 282); g.clip();
  piece(rough([[cx, 980], [cx + cw, 980], [cx + cw, 1030], [cx, 1030]], 78, 1, 12), C.ink, { gap: 0, shadow: false });
  agentSide(cx + 150 + 14, 980, .48, AGENT_POSE.flatten);
  const il = layout('I', 440, {});
  drawLine(il, cx + 150 - (il.letters[0].x0 + il.letters[0].x1) / 2 - 2, 986, { col: C.ink, seed: 12, jit: 0, amp: 1.4, shA: .45 });
  g.restore();
  S.bg = C.paper;
  LBL('BEHIND THE “I”', cx + cw / 2, gy2 + 40, 15);

  // ── D. turning ──
  LBL('KEY POSE 3 · TURN', 640, 680, 22, C.red, 'left');
  label('skid → over the shoulder → to camera (3 drawings, held on twos)', 640, 705, '400 16px LSpartan', C.ink);
  agentSide(700, gy2, .5, AGENT_POSE.skid);
  agentSide(880, gy2, .5, AGENT_POSE.overShoulder);
  agentFront(1050, gy2, .5);
  groundTick(875, gy2, 480);
  ['SKID', 'LOOK BACK', 'TO CAMERA'].forEach((s, i) => LBL(s, 700 + i * 175, gy2 + 40, 15));
  // arrow
  for (const x of [790, 968]) piece([[x - 14, gy2 - 140], [x + 8, gy2 - 140], [x + 8, gy2 - 148], [x + 22, gy2 - 136], [x + 8, gy2 - 124], [x + 8, gy2 - 132], [x - 14, gy2 - 132]], C.red, { gap: 0, shadow: false });

  // ── E. courier ──
  LBL('THE COURIER', 1330, 210, 22, C.red, 'left');
  label('1.2× taller · wide flat brim · A-line coat', 1330, 236, '400 15px LSpartan', C.ink);
  label('red lining shows only when he runs · key chained to his wrist', 1330, 256, '400 15px LSpartan', C.ink);
  const cs = .5;
  courierSide(1390, gy, cs, COURIER_POSE.stand);
  courierSide(1540, gy, cs, walkPose(.18));
  courierSide(1730, gy, cs, coRunPose(.3));
  groundTick(1590, gy, 520);
  ['STAND', 'WALK', 'RUN'].forEach((s, i) => LBL(s, [1390, 1540, 1720][i], gy + 40, 15));

  // ── F. key = I ──
  LBL('THE KEY = THE “I” OF CIPHER', 1250, 680, 22, C.red, 'left');
  label('brass key on a black backing · its outline fills the keyhole', 1250, 705, '400 16px LSpartan', C.ink);
  key(1310, 790, 1.3, 0);
  // keyhole (red)
  g.save(); g.translate(1470, 790); g.scale(1.3, 1.3);
  piece(roughC('kh1', () => keyholeP(1), 301, .7, 6), C.red, { gap: 0 });
  g.restore();
  // inserted: red hole in the ink-black letter block + key
  card(1560, 740, 120, 250, C.ink, 302);
  g.save(); g.translate(1620, 790); g.scale(1.3, 1.3);
  piece(roughC('kh1', () => keyholeP(1), 301, .7, 6), C.red, { gap: 0, shadow: false });
  g.restore();
  S.bg = C.red; key(1620, 790, 1.3 * .93, 0, { line: 0 }); S.bg = C.paper;
  ['KEY', 'KEYHOLE', 'FITTED'].forEach((s, i) => LBL(s, [1310, 1470, 1620][i], gy2 + 40, 15));
  piece([[1375, 870], [1405, 870], [1405, 862], [1420, 874], [1405, 886], [1405, 878], [1375, 878]], C.ink, { gap: 0, shadow: false });
  label('+', 1527, 885, '700 34px LSpartan', C.ink, 'center');

  // ── G. palette ──
  LBL('FOUR INKS', 1720, 680, 22, C.red, 'left');
  const sw = [['INK', C.ink, '#1b1714'], ['PAPER', C.paper, '#efe4c9'], ['SIGNAL', C.red, '#d23a22'], ['MUSTARD', C.mus, '#e2a52a']];
  sw.forEach(([n, c, h], i) => {
    const x = 1720 + (i % 2) * 100, y = 730 + Math.floor(i / 2) * 140;
    piece(roughC('sw' + i, () => rectP(x, y, 80, 80), 400 + i, 1.2, 10), c, { gap: 0, shA: .3 });
    if (c === C.paper) piece(roughC('swo', () => rectP(x, y, 80, 80), 400 + i, 1.2, 10).map(p => p), c, { gap: 0 });
    label(n, x + 40, y + 102, '600 14px LSpartan', C.ink, 'center');
    label(h, x + 40, y + 120, '400 13px LSpartan', C.ink, 'center');
  });

  // crop crosses (the registration marks of title-sequence printing)
  const cross = (x, y) => { piece([[x - 14, y - 1], [x + 14, y - 1], [x + 14, y + 1], [x - 14, y + 1]], C.ink, { gap: 0, shadow: false }); piece([[x - 1, y - 14], [x + 1, y - 14], [x + 1, y + 14], [x - 1, y + 14]], C.ink, { gap: 0, shadow: false }); };
  cross(1890, 30); cross(30, 1050); cross(1890, 1050);
}
