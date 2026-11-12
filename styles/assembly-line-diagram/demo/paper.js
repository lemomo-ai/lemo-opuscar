// The Disassembly Line · the paper (shots 1 and 2): an ordinary assembly line puts a sandwich "together" → gantry title sign → the mouth door
// World coords = picture coords of style frame 2 (head group shifted right by BX0 = 60). Conveyor centre line y = 640, ground y = 930.

const BELT_Y = 640, FLOOR = 930;
const HOP_Y = 150;                       // hopper rail
// horizontal position of the sandwich (world coords): steady 800/s → quadratic ease to a stop under the sign → wait → into the mouth
function sandX(t) {
  if (t <= 3.2) return -2700 + 800 * t;
  if (t <= 5.84) { const u = (t - 3.2) / 2.64; return -140 + 1056 * (1 - (1 - u) * (1 - u)); }
  if (t <= K.enter[0]) return 916;
  return lerp(916, 1268, eio(seg(t, K.enter[0], K.enter[1])));
}
// hopper positions: the sandwich is right under each one the moment its layer drops
const HOPPERS = () => K.drops.map(td => sandX(td - .16));

// ---------- Sandwich (drawn in layers, n = layers already placed, layer n may be falling) ----------
// layers (bottom up): 0 bottom slice · 1 lettuce · 2 cheese · 3 ham · 4 top slice
function sandLayer(i, W) {
  const slice = (y, h) => { shape(R(-W / 2, y, W, h, 7), C.breadD, 2.8); fillOnly(R(-W / 2 + 7, y + 5, W - 14, h - 10, 3), C.bread); for (const xx of [-48, -18, 14, 44]) out(`<circle cx="${xx}" cy="${y + h / 2}" r="2" fill="${C.breadD}" opacity=".7"/>`); };
  if (i === 0) slice(-24, 24);
  if (i === 1) shape(`M${-W / 2 - 6} -24Q${-W / 4} -38 0 -28Q${W / 4} -38 ${W / 2 + 6} -24Q${W / 4} -18 0 -24Q${-W / 4} -16 ${-W / 2 - 6} -24Z`, C.teal, 2.2);
  if (i === 2) { shape(R(-W / 2 + 4, -42, W - 2, 15, 3), C.sun, 2.4); out(`<path d="M${W / 2 + 2} -35L${W / 2 + 11} -29L${W / 2 + 2} -27Z" fill="${C.sun}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`); }
  if (i === 3) { shape(R(-W / 2 - 4, -58, W + 6, 17, 8), C.blushL, 2.4); for (const xx of [-44, -10, 26, 52]) out(`<path d="M${xx} -53q6 4 12 0" fill="none" stroke="${C.blushD}" stroke-width="2.2" stroke-linecap="round"/>`); }
  if (i === 4) slice(-86, 28);
}
// sandwichAt(x, y, k, n, fallP): when fallP ∈ (0,1) layer n is falling (0 = just left the hopper, 1 = landed)
function sandwichAt(x, y, k, n, fallP = 0, t = 0, o = {}) {
  const W = 150;
  out(`<g transform="translate(${f1(x)} ${f1(y)}) scale(${k})">`);
  const top = [0, -24, -28, -42, -58, -86][Math.min(n, 5)];
  if (n > 0) shadow(R(-W / 2, top, W, -top, 8), 12, 9, o.sh || C.shade);
  for (let i = 0; i < Math.min(n, 5); i++) sandLayer(i, W);
  if (fallP > 0 && fallP < 1 && n < 5) {
    const H = (BELT_Y - 14 - HOP_Y - 300) / k;
    out(`<g transform="translate(0 ${f1(-(1 - fallP) * (1 - fallP) * H)})">`); sandLayer(n, W); out('</g>');
  }
  if (n >= 5 && o.ticket) {
    const p = o.ticketP === undefined ? 1 : o.ticketP;
    const lift = (1 - eo(p)) * -60;
    out(`<g transform="translate(0 ${f1(lift)})" opacity="${f1(clamp(p * 3))}">`);
    line([[6, -86], [6, -138]], 2.6);
    const w = tw(o.ticket, 30, 800, FONT.en) + 26;
    shadow(R(10, -170, w, 40, 3), 5, 4, o.sh || C.shade);
    shape(R(10, -170, w, 40, 3), C.cream, 2.4);
    fillOnly(R(10, -170, 8, 40), C.red); shape(R(10, -170, w, 40, 3), null, 2.4);
    txt(10 + 8 + (w - 8) / 2, -139, o.ticket, 30, { fam: FONT.en, w: 800, anchor: 'middle', ls: 1 });
    out('</g>');
  }
  out('</g>');
}
function sandState(t) {
  let n = 0, f = 0;
  K.drops.forEach((td, i) => { if (t >= td) n = i + 1; else if (t > td - .34) { f = seg(t, td - .34, td); } });
  return { n, f };
}

// ---------- Hoppers: hanging from the rail, the layer to be placed visible in the window ----------
function hopper(x, i, t) {
  const td = K.drops[i];
  const y0 = HOP_Y + 40, y1 = y0 + 190;
  line([[x - 30, HOP_Y + 16], [x - 30, y0]], 3); line([[x + 30, HOP_Y + 16], [x + 30, y0]], 3);
  shadow(R(x - 80, y0, 160, 150, 6), 12, 9);
  shape(R(x - 80, y0, 160, 150, 6), [C.sun, C.teal, C.red, C.blush, C.sun][i], 3);
  shape(R(x - 58, y0 + 24, 116, 92, 4), C.wall, 2.4);
  // stock stacked in the window
  out(`<g transform="translate(${x} ${y0 + 112}) scale(.62)">`);
  for (let k = 0; k < 3; k++) { out(`<g transform="translate(0 ${-k * 36 + (i === 0 || i === 4 ? 24 : i === 1 ? 26 : i === 2 ? 40 : 56)})">`); sandLayer(i, 150); out('</g>'); }
  out('</g>');
  // funnel + drop gate (opens the moment it drops)
  const open = pulse(t, td - .45, .5);
  shape(`M${x - 80} ${y0 + 150}L${x - 34} ${y1}H${x + 34}L${x + 80} ${y0 + 150}Z`, C.wallD, 3);
  out(`<g transform="rotate(${f1(open * 50)} ${x - 34} ${y1})">`); shape(R(x - 34, y1 - 4, 34, 8, 2), C.ink, 0); out('</g>');
  out(`<g transform="rotate(${f1(-open * 50)} ${x + 34} ${y1})">`); shape(R(x, y1 - 4, 34, 8, 2), C.ink, 0); out('</g>');
  // platform + lever worker
  const px = x + 120, py = 470;
  shape(R(px - 10, py, 120, 12, 2), C.wallD, 2.4);
  line([[px, py + 12], [px, FLOOR]], 4); line([[px + 100, py + 12], [px + 100, FLOOR]], 4);
  for (let y = py + 50; y < FLOOR; y += 46) line([[px, y], [px + 100, y + 30]], 2.2, C.ink, 'opacity=".5"');
  const pull = pulse(t, td - .55, .6);
  line([[x + 70, y0 + 60], [px + 30, py - 60 + pull * 24]], 2.4);
  worker(px + 46, py, { s: 1.2, flip: true, cap: [C.sun, C.red, C.teal, C.sun, C.red][i], coat: i % 2 ? C.teal : C.cream, back: [20, 0], front: [140 - 40 * pull, -10 + 30 * pull] });
}

// ---------- Time clock: the last station sticks on the 12:30 ticket ----------
function timeClock(t) {
  const x = -280, y0 = 300;
  line([[x + 90, HOP_Y + 16], [x + 90, y0]], 3);
  shadow(R(x, y0, 180, 150, 6), 12, 9);
  shape(R(x, y0, 180, 150, 6), C.red, 3);
  const cx = x + 64, cy = y0 + 70;
  shape(E(cx, cy, 44), C.cream, 2.8);
  for (let a = 0; a < 12; a++) { const r = a * Math.PI / 6; line([[cx + Math.cos(r) * 34, cy + Math.sin(r) * 34], [cx + Math.cos(r) * 39, cy + Math.sin(r) * 39]], 2); }
  line([[cx, cy], [cx, cy + 32]], 3);                     // minute hand :30
  line([[cx, cy], [cx + 4, cy - 22]], 4.5);               // hour hand, half past 12
  out(`<circle cx="${cx}" cy="${cy}" r="3.5" fill="${C.ink}"/>`);
  shape(R(x + 126, y0 + 24, 36, 100, 4), C.wallD, 2.4);
  for (let k = 0; k < 4; k++) line([[x + 132, y0 + 40 + k * 22], [x + 156, y0 + 40 + k * 22]], 2.2, C.ink, 'opacity=".6"');
  // robot arm: reaches down to insert the ticket
  const p = pulse(t, K.ticket - .35, .7);
  const ax = x + 150, ay = y0 + 150;
  const ex = ax + 10, ey = ay + 40 + p * 70;
  line([[ax, ay], [ex, ey]], 8); line([[ax, ay], [ex, ey]], 3.4, C.wallD);
  shape(E(ax, ay, 9), C.ink, 0);
}

// ---------- Gantry sign (title): flips down, bounces and settles ----------
function gantry(t) {
  for (const x of [60, 840]) {
    shadow(R(x - 12, 150, 24, FLOOR - 150), 12, 0);
    shape(R(x - 12, 150, 24, FLOOR - 150, 2), C.sun, 3);
    fillOnly(R(x - 6, 158, 5, FLOOR - 166), C.sunL);
    shape(R(x - 26, FLOOR - 16, 52, 16, 2), C.wallD, 2.6);
  }
  for (let y = 200; y < FLOOR - 20; y += 34) line([[34, y], [48, y]], 3);
  line([[30, 180], [30, FLOOR - 16]], 3);
}
function titleSign(t) {
  // crossbeam
  shadow(R(30, 132, 852, 30), 12, 8);
  shape(R(30, 132, 852, 30, 2), C.sun, 3);
  fillOnly(R(36, 137, 840, 5), C.sunL);
  for (let x = 54; x < 870; x += 40) out(`<circle cx="${x}" cy="154" r="2.6" fill="${C.ink}"/>`);
  const wr = Math.sin(t * 9) * 25 * (t > 3.4 && t < 4.5 ? 1 : 0);
  worker(720, 132, { s: 1.15, sit: true, cap: C.red, back: [60, 30], front: [100 + wr, -40 - (t > K.sign ? 60 * ss(seg(t, K.sign + .7, K.sign + 1.0)) : 0)],
    prop: h => { if (!h) return; line([[h[0], h[1]], [h[0] + 14, h[1] + 16]], 4); shape(E(h[0] + 16, h[1] + 19, 5), null, 2.6); } });
  const BX = 104, BYt = 196, BW = 712, BH = 272;
  const p = t - K.sign;
  if (p < 0) {   // stowed: a thin board tucked under the crossbeam
    shape(R(BX, 166, BW, 14, 3), C.cream, 3);
    for (const x of [BX + 70, BX + BW - 70]) shape(E(x, 170, 4.2, 5), null, 2.2);
    return;
  }
  const s = clamp(1 - Math.exp(-6 * p) * Math.cos(11 * p), 0.05, 1.12);   // flips down, bounces twice
  const chainBot = 166 + (BYt - 166) * s;
  for (const x of [BX + 70, BX + BW - 70]) { for (let y = 166; y < chainBot; y += 12) shape(E(x, y + 6, 4.2, 6), null, 2.2); }
  out(`<g transform="translate(0 166) scale(1 ${f1(s * 1000) / 1000}) translate(0 -166)">`);
  shadow(R(BX, BYt, BW, BH, 6), 16, 12);
  shape(R(BX, BYt, BW, BH, 6), C.cream, 4);
  out(`<path d="${R(BX + 12, BYt + 12, BW - 24, BH - 24, 3)}" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity=".5"/>`);
  for (const [x, y] of [[BX + 22, BYt + 22], [BX + BW - 22, BYt + 22], [BX + 22, BYt + BH - 22], [BX + BW - 22, BYt + BH - 22]]) out(`<circle cx="${x}" cy="${y}" r="4" fill="${C.ink}"/>`);
  const L = BX + 46;
  const big = Math.min(150, 600 / (tw('DISASSEMBLY', 1, 900, FONT.en) || 1));
  shape(R(L, BYt + 34, 86, 34, 4), C.ink, 0);
  txt(L + 43, BYt + 60, 'THE', 26, { fam: FONT.sans, w: 800, fill: C.cream, anchor: 'middle', ls: 3 });
  txt(L + 102, BYt + 60, 'A FACTORY TOUR OF YOUR LUNCH', 22, { fam: FONT.sans, w: 600, ls: 2.4 });
  const B1 = BYt + 86 + big * 0.70;
  txt(L - 4, B1, 'DISASSEMBLY', big, { fam: FONT.en, w: 900, ls: 1 });
  const ls2 = big * 0.56, LINE_Y = B1 + 18 + ls2 * 0.70;
  const lw = tw('LINE', ls2, 900, FONT.en) + 6;
  txt(L - 2, LINE_Y, 'LINE', ls2, { fam: FONT.en, w: 900, fill: C.red, ls: 2 });
  { // arrow: once settled, "drawn" from left to right, pointing at the mouth door
    const ax = L + lw + 26, ay = LINE_Y - ls2 * 0.35, aw = (BX + BW - 46 - ax) * eo(seg(t, K.sign + .5, K.sign + 1.0));
    if (aw > 40) {
      const d = `M${ax} ${ay - 9}H${f1(ax + aw - 34)}V${ay - 24}L${f1(ax + aw)} ${ay}L${f1(ax + aw - 34)} ${ay + 24}V${ay + 9}H${ax}Z`;
      out(`<g${tr(C.red)}><path d="${d}" fill="${C.red}"/></g>`);
      out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`);
    }
  }
  out('</g>');
  // Chinese sub-sign: swings down half a beat later
  const q = t - K.signZh;
  if (q > 0) {
    const s2 = clamp(1 - Math.exp(-6 * q) * Math.cos(11 * q), 0.05, 1.15);
    const str = '拆解流水线　一份午饭怎么变成你的力气', zs = 34, w = tw(str, zs, 700, FONT.zh) + 48, x = BX + 24, y = BYt + BH + 26, h = 54;
    const top = BYt + BH - 2;
    for (const hx of [x + 40, x + w - 40]) line([[hx, top], [hx, top + (y + 4 - top) * s2]], 2.4);
    out(`<g transform="translate(0 ${top}) scale(1 ${f1(s2 * 1000) / 1000}) translate(0 ${-top})">`);
    shadow(R(x, y, w, h, 4), 8, 6);
    shape(R(x, y, w, h, 4), C.sun, 2.8);
    txt(x + 24, y + h / 2 + zs * 0.36, str, zs, { fam: FONT.zh, w: 700 });
    out('</g>');
  }
}


// ---------- Density for shot 1: side conveyor, crane, more busy workers, pendant lamps ----------
function lunchItem(x, y, i) {           // y = bottom edge
  const k = i % 5;
  if (k === 0) { shape(R(x - 46, y - 40, 92, 40, 6), C.teal, 2.4); shape(R(x - 50, y - 50, 100, 14, 5), C.red, 2.4); }                    // lunch box
  else if (k === 1) { for (const dx of [-26, 4]) { shape(R(x + dx - 12, y - 44, 26, 44, 4), C.red, 2.2); fillOnly(R(x + dx - 9, y - 30, 20, 10), C.cream); } } // two cans of soup
  else if (k === 2) { shape(`M${x - 52} ${y}V${y - 24}Q${x - 52} ${y - 44} ${x - 24} ${y - 44}H${x + 24}Q${x + 52} ${y - 44} ${x + 52} ${y - 24}V${y}Z`, C.breadD, 2.4); for (const dx of [-24, 0, 24]) line([[x + dx - 6, y - 36], [x + dx + 6, y - 30]], 2, C.ink, 'opacity=".5"'); } // baguette
  else if (k === 3) { gear(x, y - 26, 26, 9, 0, C.sun); }                                                                                 // parts
  else { shape(R(x - 40, y - 46, 80, 46, 3), C.wallD, 2.4); line([[x - 40, y - 23], [x + 40, y - 23]], 2); shape(R(x - 12, y - 52, 24, 10, 2), C.sun, 2); } // carton
}
function assemblyBack(t) {
  // pendant lamps
  for (const x of [-3120, -2350, -1600, -850]) { if (inView(x - 100, 0, x + 100, 600)) lamp(x, HOP_Y + 22, 470, true); }
  // side conveyor on the floor: runs the other way, carrying other lunch boxes and parts
  const by = 820;
  for (let x = -3400; x < -40; x += 260) trestle(x + 130, by + 12, FLOOR, 18);
  belt2([-3600, by], [-60, by], .8, t * 9);
  for (let i = 0; i < 16; i++) { const x = -3400 + ((i * 230 - t * 260) % 3680 + 3680) % 3680; if (x < -100 && inView(x - 60, by - 60, x + 60, by)) lunchItem(x, by - 10, i); }
  // crane shuttling along the rail: trolley + cable + hook + a crate of goods (swaying gently)
  for (const [x0, sp, ph, i] of [[-3300, 180, 0, 0], [-2100, -150, 1.3, 1], [-1150, 210, 2.2, 2]]) {
    const span = 900, x = x0 + span / 2 + Math.sin(t * sp / span * 2 + ph) * span / 2;
    if (!inView(x - 120, 0, x + 120, 700)) continue;
    shape(R(x - 34, HOP_Y - 14, 68, 26, 4), C.red, 2.6); shape(E(x - 18, HOP_Y + 12, 7), C.ink, 0); shape(E(x + 18, HOP_Y + 12, 7), C.ink, 0);
    const sw = Math.sin(t * 3 + i) * 6, len = 150 + 30 * Math.sin(t * 1.4 + i);
    line([[x, HOP_Y + 12], [x + sw, HOP_Y + 12 + len]], 2.6);
    out(`<path d="M${f1(x + sw - 8)} ${f1(HOP_Y + 12 + len)}q8 14 16 0" fill="none" stroke="${C.ink}" stroke-width="3"/>`);
    out(`<g transform="rotate(${f1(sw * .6)} ${f1(x + sw)} ${f1(HOP_Y + 20 + len)})">`); lunchItem(x + sw, HOP_Y + 74 + len, i * 2 + 4); out('</g>');
  }
}
function assemblyFront(t) {
  // on the floor: one watching the board, one sweeping, two carrying bread, one turning a valve
  const W1 = -2480; if (inView(W1 - 200, 600, W1 + 200, FLOOR)) {
    shape(R(W1 - 60, FLOOR - 120, 120, 120, 4), C.wallD, 2.6); gauge(W1 - 22, FLOOR - 80, 18, .5 + .3 * Math.sin(t * 3)); shape(E(W1 + 30, FLOOR - 80, 16), null, 3);
    out(`<g transform="rotate(${f1(t * 140)} ${W1 + 30} ${FLOOR - 80})">`); line([[W1 + 14, FLOOR - 80], [W1 + 46, FLOOR - 80]], 2.4); line([[W1 + 30, FLOOR - 96], [W1 + 30, FLOOR - 64]], 2.4); out('</g>');
    worker(W1 + 92, FLOOR, { s: 1.2, flip: true, cap: C.teal, back: [40, 0], front: [110 + 20 * Math.sin(t * 6), 20] });
  }
  const W2 = -1760; if (inView(W2 - 100, 600, W2 + 100, FLOOR)) worker(W2, FLOOR, { s: 1.2, cap: C.sun, back: [30, 40], front: [70, 50], prop: h => { if (h) { shape(R(h[0] - 4, h[1] - 18, 26, 32, 2), C.cream, 2); line([[h[0] + 2, h[1] - 8], [h[0] + 16, h[1] - 8]], 1.6); line([[h[0] + 2, h[1]], [h[0] + 16, h[1]]], 1.6); } } });
  { const x = -1300 + ((t * 70) % 300); if (inView(x - 100, 600, x + 100, FLOOR)) worker(x, FLOOR, { s: 1.2, cap: C.red, coat: C.teal, walk: 4 * Math.sin(t * 8), back: [20 + 25 * Math.sin(t * 6), 0], front: [30 + 25 * Math.sin(t * 6), 0], prop: h => { if (h) { line([[h[0], h[1]], [h[0] - 30, h[1] + 44]], 3); shape(R(h[0] - 46, h[1] + 40, 36, 10, 2), C.sun, 2); } } }); }
  { const x = -3050 + t * 160; if (inView(x - 200, 600, x + 200, FLOOR)) { for (const dx of [0, 150]) worker(x + dx, FLOOR, { s: 1.2, cap: dx ? C.sun : C.red, walk: 5 * Math.sin(t * 10 + dx), back: [170, 0], front: [170, 0] });
    shape(`M${x - 30} ${FLOOR - 112}V${FLOOR - 128}Q${x - 30} ${FLOOR - 142} ${x - 10} ${FLOOR - 142}H${x + 160}Q${x + 180} ${FLOOR - 142} ${x + 180} ${FLOOR - 128}V${FLOOR - 112}Z`, C.breadD, 2.4); } }
}

// ---------- The whole paper (ground, conveyor, hoppers, time clock, gantry, sandwich) ----------
function drawPaper(t) {
  if (t > 9.6) return;
  fillOnly(R(-3600, FLOOR, 4840, 12), C.paperD);
  line([[-3600, FLOOR], [1240, FLOOR]], 3);
  fillOnly(R(-3600, FLOOR - 4, 4700, 8), C.shade);
  // hopper rail
  shadow(R(-3500, HOP_Y, 3420, 22), 10, 8);
  shape(R(-3500, HOP_Y, 3420, 22, 2), C.sun, 3);
  for (let x = -3480; x < -100; x += 40) out(`<circle cx="${x}" cy="${HOP_Y + 11}" r="2.4" fill="${C.ink}"/>`);
  for (const x of [-3300, -2300, -1300, -400]) { line([[x, 0], [x, HOP_Y]], 3); }
  assemblyBack(t);
  HOPPERS().forEach((x, i) => { if (inView(x - 120, 0, x + 260, FLOOR)) hopper(x, i, t); });
  // sign at the head of the line: a plain "assembly line" (set against the later title "disassembly line")
  if (inView(-3500, 0, -2400, 400)) {
    for (const x of [-2960, -2660]) line([[x, -20], [x, 64]], 2.4);
    plaque(-3010, 64, 'ASSEMBLY LINE', '装配线', { size: 40, zs: 38 });
  }
  // stacked crates of raw material on the floor + a worker pushing a cart
  const crate = (x, n, lid) => { for (let k = 0; k < n; k++) { const y = FLOOR - 70 * (k + 1); shadow(R(x, y, 120, 70, 3), 8, 6); shape(R(x, y, 120, 70, 3), C.breadD, 2.6); line([[x + 8, y + 35], [x + 112, y + 35]], 2, C.ink, 'opacity=".45"'); fillOnly(R(x + 10, y + 8, 100, 10, 2), lid); } };
  crate(-3150, 3, C.sun); crate(-2210, 2, C.red); crate(-1290, 3, C.teal); crate(-560, 2, C.blush);
  { const cx = -2650 + ((t * 120) % 500); worker(cx, FLOOR, { s: 1.2, cap: C.red, coat: C.teal, walk: 5 * Math.sin(t * 10), lean: 8, back: [80, 0], front: [80, 0] });
    shape(R(cx + 20, FLOOR - 66, 110, 44, 3), C.wallD, 2.6); shape(E(cx + 40, FLOOR - 12, 11), C.ink, 0); shape(E(cx + 112, FLOOR - 12, 11), C.ink, 0);
    shape(R(cx + 32, FLOOR - 92, 86, 26, 5), C.bread, 2.2); }
  timeClock(t);
  gantry(t);
  // conveyor (the stretch outside the mouth door)
  for (let x = -3400; x < 900; x += 300) trestle(x, BELT_Y + 14, FLOOR, 30);
  for (const x of [170, 470, 740]) trestle(x, BELT_Y + 14, FLOOR, 30);
  assemblyFront(t);
  const ph = -sandXv(t) / 6.5;
  belt2([-3600, BELT_Y], [BX0 + 990, BELT_Y], 1, ph);
  // flag worker letting it through: waves the flag as the sign settles
  const wave = pulse(t, K.sign + .1, .9);
  worker(330, FLOOR, { s: 1.3, cap: C.sun, coat: C.teal, back: [20, 0], front: [130 + 40 * wave * Math.sin(t * 18), -10],
    prop: h => { if (!h) return; line([[h[0], h[1]], [h[0] + 4, h[1] - 46]], 3); shape(`M${h[0] + 4} ${h[1] - 46}L${h[0] + 40} ${h[1] - 38}L${h[0] + 4} ${h[1] - 28}Z`, C.red, 2.2); } });
  titleSign(t);
}
// conveyor roller angle follows the distance the sandwich has travelled
function sandXv(t) { return sandX(t); }

// the sandwich on the paper (drawn in front of the head; entering the mouth door, only the part inside the doorway remains)
function drawSandOutside(t) {
  if (t > K.cut3 + .05) return;
  const x = sandX(t), { n, f } = sandState(t);
  const tk = seg(t, K.ticket - .05, K.ticket + .25);
  out(`<clipPath id="doorclip"><path d="M-4000 -2000H${BX0 + 990}V4000H-4000Z"/><path d="${R(BX0 + 990, DOOR[1] + 2, 900, DOOR[3] - 4)}"/></clipPath>`);
  out(`<g clip-path="url(#doorclip)">`);
  sandwichAt(x, BELT_Y - 14, 1.12, n, f, t, { ticket: t > K.ticket - .05 ? '12:30' : null, ticketP: tk });
  out('</g>');
}
