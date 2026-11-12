// The Disassembly Line · screen layer: work-order subtitles, porthole POV, full-line light streak + numbers, end plaque, speed lines
// All of these are drawn in 1920×1080 screen coordinates (not scaled by the camera), so font sizes are pixels in the final film.

// ---------- Work-order subtitles: pinned bottom left (bottom right in shots 2 and 8), cream ground, ink frame, the current station number at the left end ----------
function subtitles(t) {
  for (const s of TL.subs) {
    if (t < s.t0 - .01 || t > s.t1 + .01) continue;
    const pin = eo(seg(t, s.t0, s.t0 + .2)), pout = ei(seg(t, s.t1 - .14, s.t1));
    const right = s.t0 >= 45 || (s.t0 > 4.5 && s.t0 < 8.5);
    const zs = 34, es = 30;
    const wz = tw(s.zh, zs, 700, FONT.zh), we = tw(s.en, es, 600, FONT.sans) + s.en.length * .3;
    const stub = 72, pad = 24, w = stub + pad + Math.max(wz, we) + pad + 4, h = 116;
    const x = right ? 1920 - 56 - w : 56, y = 1080 - 40 - h + (1 - pin) * 34 + pout * 40;
    const op = Math.min(pin, 1 - pout);
    out(`<g data-sub="1" opacity="${f1(op * 100) / 100}">`);
    out(`<path d="${R(x, y, w, h, 4)}" fill="${C.ground}" opacity=".28" transform="translate(7 6)"/>`);
    shape(R(x, y, w, h, 4), C.cream, 2.8);
    // stub: colour = current station; number circle
    fillOnly(R(x + 2, y + 2, stub - 2, h - 4, 3), s.n ? C.sun : C.red);
    out(`<path d="M${x + stub} ${y + 8}V${y + h - 8}" stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="5 6"/>`);
    if (s.n) { shape(E(x + stub / 2, y + h / 2, 22), C.cream, 2.6); txt(x + stub / 2, y + h / 2 + 9.5, String(s.n), 28, { fam: FONT.en, w: 900, anchor: 'middle' }); }
    else { shape(E(x + stub / 2, y + h / 2, 22), C.cream, 2.6); line([[x + stub / 2, y + h / 2], [x + stub / 2, y + h / 2 - 13]], 3); line([[x + stub / 2, y + h / 2], [x + stub / 2 + 10, y + h / 2 + 4]], 3); }
    shape(R(x, y, w, h, 4), null, 2.8);
    txt(x + stub + pad, y + 48, s.zh, zs, { fam: FONT.zh, w: 700 });
    txt(x + stub + pad, y + 96, s.en, es, { fam: FONT.sans, w: 600 });
    out('</g>');
  }
}

// ---------- Porthole POV: a circular mask opens from the eye porthole, a bus pulls up in the street ----------
function pov(t, cam) {
  const [a0, a1, b0, b1] = K.iris;
  if (t < a0 || t > b1) return;
  const [px, py] = toScreen(cam, 1119 + BX0, 280);
  const r0 = 29 * cam.z, r1 = 470;
  const r = t < a1 ? lerp(r0, r1, ei(seg(t, a0, a1))) : t < b0 ? r1 : lerp(r1, r0, eo(seg(t, b0, b1)) ** .8);
  const cx = t < a1 ? lerp(px, 960, eio(seg(t, a0, a1))) : t < b0 ? 960 : lerp(960, px, eo(seg(t, b0, b1)));
  const cy = t < a1 ? lerp(py, 540, eio(seg(t, a0, a1))) : t < b0 ? 540 : lerp(540, py, eo(seg(t, b0, b1)));
  const id = 'pov' + (UID++);
  out(`<clipPath id="${id}"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/></clipPath>`);
  out(`<g clip-path="url(#${id})">`);
  const KS0 = KS; KS = 1;
  // the street at dusk (inside the porthole circle, composed around its centre 960,540): paper + a low sun + distant buildings (flat colour)
  out(`<g transform="translate(${f1(cx)} ${f1(cy)}) scale(.56) translate(-960 -600)">`);
  fillOnly(R(0, 0, 1920, 1080), C.paper);
  shape(E(1000, 560, 130), C.sunL, 0);
  for (const [x, w, h] of [[160, 200, 300], [400, 150, 420], [620, 240, 250], [1180, 200, 330], [1420, 180, 400], [1640, 200, 280]]) { fillOnly(R(x, 760 - h, w, h), C.paperD); for (let yy = 760 - h + 30; yy < 740; yy += 60) for (let xx = x + 24; xx < x + w - 30; xx += 54) fillOnly(R(xx, yy, 24, 30), C.wallS); }
  fillOnly(R(0, 760, 1920, 320), C.wallD); line([[0, 760], [1920, 760]], 3);
  fillOnly(R(0, 860, 1920, 18), C.shade); line([[0, 860], [1920, 860]], 3);
  // bus stop sign
  line([[1700, 860], [1700, 500]], 8); shape(E(1700, 460, 54), C.red, 3);
  txt(1700, 476, 'BUS', 40, { fam: FONT.en, w: 900, anchor: 'middle', fill: C.cream });
  // bus: drives in from the right, brakes and stops
  const p = seg(t, a0 + .1, b0 - .3), bx = lerp(2000, 300, 1 - Math.pow(1 - p, 3)) + Math.sin(clamp((p - .85) / .15) * Math.PI) * -18;
  bus(bx, 860, 1, t);
  out('</g></g>');
  KS = KS0;
  // porthole rim: a ring of ochre rivets (the feeling of looking out)
  out(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + 14)}" fill="none" stroke="${C.ink}" stroke-width="34"/>`);
  out(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + 14)}" fill="none" stroke="${C.sun}" stroke-width="26"/>`);
  const n = 24; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out(`<circle cx="${f1(cx + Math.cos(a) * (r + 14))}" cy="${f1(cy + Math.sin(a) * (r + 14))}" r="3.4" fill="${C.ink}"/>`); }
}
// a bus (side view, front facing left): bx = bottom-left corner of the front
function bus(bx, gy, k, t, o = {}) {
  out(`<g transform="translate(${f1(bx)} ${gy}) scale(${k})">`);
  const L = 1300, H = 420;
  shadow(R(0, -H - 30, L, H, 40), 18, 12);
  shape(R(0, -H - 30, L, H, 40), C.red, 4);
  fillOnly(R(10, -H - 18, L - 20, 14, 6), C.redL);
  fillOnly(R(0, -150, L, 46), C.cream); line([[0, -150], [L, -150]], 3); line([[0, -104], [L, -104]], 3);
  // windscreen + windows
  shape(`M14 ${-H - 4}H120V-176H14Z`, C.tealL, 3);
  for (let x = 160; x < L - 80; x += 170) { if (x > 780 && x < 960) continue; shape(R(x, -H + 6, 140, 170, 8), C.tealL, 3); out(`<path d="M${x + 16} ${-H + 30}L${x + 50} ${-H + 18}" stroke="${C.cream}" stroke-width="6" stroke-linecap="round"/>`); }
  // door (opens in shot 8)
  const op = o.door || 0;
  shape(R(800, -H + 6, 150, H - 40, 4), C.ink, 0);
  for (const s of [0, 1]) { const w = 75 * (1 - op * .8); const x = s ? 950 - w : 800; shape(R(x, -H + 6, w, H - 40, 4), C.tealL, 3); }
  // route sign
  shape(R(30, -H - 2, 80, 40, 4), C.ink, 0); txt(70, -H + 30, '6', 32, { fam: FONT.en, w: 900, anchor: 'middle', fill: C.sun });
  // wheels
  for (const x of [210, 1080]) { shape(E(x, -30, 74), C.ink, 0); shape(E(x, -30, 34), C.wallD, 3); out(`<circle cx="${x}" cy="-30" r="8" fill="${C.ink}"/>`); }
  shape(R(-10, -78, 40, 24, 6), C.sun, 2.6);
  out('</g>');
}

// ---------- Last shot: the whole line from mouth to feet lights up + the six numbers pop in one by one ----------
const STATIONS = [[1, 1], [2, 5], [3, 7], [4, 11], [5, 16], [6, 21]];
function finale(t, cam) {
  const [a, b] = K.light;
  if (t < a) return;
  const pts = ROUTE.map(([x, y]) => toScreen(cam, x + BX0, y));
  const lens = [0]; for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1], p = eio(seg(t, a, b)), shown = total * p;
  const d = 'M' + pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L');
  out(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(shown)} 99999"/>`);
  out(`<path d="${d}" fill="none" stroke="${C.sun}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f1(shown)} 99999"/>`);
  // once it has passed, a string of small lights keeps flowing forward along the line
  if (p > .05) out(`<path d="${d}" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 22" stroke-dashoffset="${f1(-t * 60)}" opacity=".9" style="clip-path:none" />`.replace('stroke-dasharray="2 22"', `stroke-dasharray="2 22"`));
  // head of the light streak
  if (p < 1) { let i = 1; while (i < lens.length - 1 && lens[i] < shown) i++; const u = (shown - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1]); const hx = lerp(pts[i - 1][0], pts[i][0], u), hy = lerp(pts[i - 1][1], pts[i][1], u); out(`<circle cx="${f1(hx)}" cy="${f1(hy)}" r="9" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`); }
  // numbers
  for (const [n, idx] of STATIONS) {
    const at = lens[idx] / total; const tt = lerp(a, b, at);
    const q = seg(t, tt - .02, tt + .3); if (q <= 0) continue;
    const [x, y] = pts[idx], s = backE(q, 2.4);
    out(`<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})">`);
    out(`<circle r="21" fill="${C.ground}" opacity=".35" transform="translate(4 4)"/>`);
    shape(E(0, 0, 19), C.sun, 3); txt(0, 8.5, String(n), 24, { fam: FONT.en, w: 900, anchor: 'middle' });
    out('</g>');
  }
}

// ---------- End plaque: lands on the ground line under the silhouette's feet ----------
function endCard(t, cam) {
  if (t < K.card - .02) return;
  const q = t - K.card, s = clamp(1 - Math.exp(-7 * q) * Math.cos(12 * q), 0, 1.1);
  const gy = RUN.GROUND;
  const w = 760, h = 232, x = 1920 - 96 - w, y = gy - 28 - h;
  const dy = (1 - s) * -160;
  out(`<g opacity="${f1(clamp(q * 8) * 100) / 100}" transform="translate(0 ${f1(dy)})">`);
  // two short posts standing on the ground
  for (const px of [x + 90, x + w - 90]) { shape(R(px - 9, y + h - 4, 18, 32 - dy, 2), C.sun, 2.6); }
  shadow(R(x, y, w, h, 6), 14, 10);
  shape(R(x, y, w, h, 6), C.cream, 4);
  out(`<path d="${R(x + 12, y + 12, w - 24, h - 24, 3)}" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity=".5"/>`);
  for (const [cx, cy] of [[x + 22, y + 22], [x + w - 22, y + 22], [x + 22, y + h - 22], [x + w - 22, y + h - 22]]) out(`<circle cx="${cx}" cy="${cy}" r="4.5" fill="${C.ink}"/>`);
  const L = x + 48;
  txt(L, y + 80, 'THE DISASSEMBLY LINE', 54, { fam: FONT.en, w: 900, ls: 1 });
  const tl = tw('THE DISASSEMBLY LINE', 54, 900, FONT.en) + 20 * 1;
  txt(L + tl + 22, y + 78, '拆解流水线', 34, { fam: FONT.zh, w: 700 });
  fillOnly(R(L, y + 98, w - 96, 4), C.red);
  txt(L, y + 146, 'Assembly-Line Diagram · 流水线图解', 30, { fam: FONT.sans, w: 600 });
  // credit: small black tag
  const cw = tw('LemoLab × Claude Opus 5.5', 30, 800, FONT.sans) + 36;
  shape(R(L, y + 164, cw, 46, 4), C.ink, 0);
  txt(L + 18, y + 197, 'LemoLab × Claude Opus 5.5', 30, { fam: FONT.sans, w: 800, fill: C.cream, ls: .5 });
  out('</g>');
}

// ---------- Speed lines (during whip pans) ----------
function speedLines(t, cam, dirY) {
  const v = Math.abs(dirY);
  if (v < .2) return;
  const op = clamp((v - .2) / .8) * .5;
  for (let i = 0; i < 22; i++) {
    const x = (hash(i * 3.1) * 1920), len = 120 + hash(i * 7.7) * 260, y = ((hash(i * 1.3) * 1400 + t * 2600 * Math.sign(-dirY)) % 1400 + 1400) % 1400 - 160;
    out(`<path d="M${f1(x)} ${f1(y)}v${f1(len)}" stroke="${C.cream}" stroke-width="${2 + (i % 3)}" stroke-linecap="round" opacity="${f1(op)}"/>`);
  }
}
