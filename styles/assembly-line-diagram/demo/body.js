// The Disassembly Line · the body world (a side cutaway of a running body)
// Coordinates: BL = body-local (the same set as the head group in style frame 2; the whole group is shifted right by BX0 in the world).
//       TL = torso-local = BL − (TOX, TOY); the floors keep the coordinates of style frame 1.
// Floors from the top: control room (brain) / crushers (mouth) → chest (pump = heart, bellows = lungs) → diaphragm → ⑤ warehouse (liver, the highest organ in the abdomen)
//   → ② acid drum (stomach) + ③ gatekeeper (pylorus) → ④ sorting line (small intestine) → pelvis: ⑥ furnace room (muscle) → legs.
// Sugar and amino acids go "up" from the small intestine through the portal vein into the liver (yellow and red pipes run upward); fat goes through the lymph (the teal pipe runs separately).

const BX0 = 60;
const TOX = 980, TOY = 2660;
const DOOR = [930, 548, 160, 120];
const MAIN = 'M1300 -60C1160 -40 1062 70 1052 190C1050 236 1036 262 1020 290C994 336 948 384 936 414C928 436 944 462 984 466C1004 470 1006 494 996 510C990 518 988 522 990 526L990 680C984 692 984 714 1004 724C992 746 994 774 1022 798C1050 822 1110 834 1170 838C1196 900 1208 1000 1214 1140C1220 1220 1180 1290 1130 1400C1080 1520 1060 1760 1070 2000C1080 2400 1050 2900 1080 3300C1100 3600 1150 3920 1300 4110C1500 4280 2000 4330 2420 4270C2820 4210 3010 4090 3020 3800C3030 3300 3000 2600 3000 2000C3000 1640 2920 1380 2640 1270C2380 1180 2130 1110 2090 900C2066 760 2130 600 2150 380C2170 100 2090 -190 1880 -300C1680 -400 1420 -300 1300 -60Z';
// limbs (centre line + width): drawn behind the torso, the parts that overlap it are covered by the torso
const LIMBS = {
  armB: { pts: [[2600, 1500], [3480, 1980], [3420, 2760]], w: 420, fist: [3410, 2820] },
  armF: { pts: [[2050, 1520], [880, 2200], [470, 1640]], w: 420, fist: [450, 1590] },
  legF: { pts: [[1750, 3880], [1080, 5140], [1380, 6640], [960, 6830]], w: [900, 640, 340] },
  legB: { pts: [[2560, 3880], [3180, 5640], [3560, 7280], [3250, 7460]], w: [900, 640, 340] },
};
const GROUND = 7640;
// pipeline path (BL): the light streak of the last shot travels along this line
const ROUTE = [[1000, 608], [1260, 626], [1500, 680], [1610, 760], [1610, 2540], [1900, 2610], [2290, 2650], [2440, 2690],
  [2590, 2770], [2590, 2990], [2480, 3060], [2200, 3100], [1340, 3100], [1230, 3080], [1230, 2280], [1700, 2280], [2350, 2240],
  [2885, 2140], [2885, 3480], [2700, 3600], [2380, 3760], [2380, 3990], [2750, 4500], [3160, 5640]];

// ---------- Small parts ----------
const cube = (x, y, s = 26) => { shape(R(x - s / 2, y - s, s, s, 3), C.sun, 2.4); fillOnly(R(x - s / 2 + 4, y - s + 4, 5, s - 10, 2), C.sunL); };
const bead = (x, y, r = 12) => { shape(E(x, y - r, r), C.red, 2.4); out(`<circle cx="${f1(x - r * .35)}" cy="${f1(y - r * 1.35)}" r="${f1(r * .28)}" fill="${C.redL}"/>`); };
function drop(x, y, r = 12) {
  const cy = y - r, tip = cy - 1.75 * r;
  shape(`M${f1(x)} ${f1(tip)}C${f1(x + r * .3)} ${f1(cy - r * 1.1)} ${f1(x + r)} ${f1(cy - r * .6)} ${f1(x + r)} ${f1(cy)}A${r} ${r} 0 0 1 ${f1(x - r)} ${f1(cy)}C${f1(x - r)} ${f1(cy - r * .6)} ${f1(x - r * .3)} ${f1(cy - r * 1.1)} ${f1(x)} ${f1(tip)}Z`, C.teal, 2.4);
  out(`<circle cx="${f1(x - r * .35)}" cy="${f1(cy - r * .1)}" r="${f1(r * .26)}" fill="${C.tealL}"/>`);
}
// a lump of paste (chyme): soft flesh-pink blob
function blob(x, y, k = 1, wob = 0) {
  const a = 1 + .08 * Math.sin(wob), b = 1 - .08 * Math.sin(wob);
  shape(`M${f1(x - 26 * k * a)} ${f1(y)}Q${f1(x - 30 * k * a)} ${f1(y - 26 * k * b)} ${f1(x - 8 * k)} ${f1(y - 24 * k * b)}Q${f1(x + 2 * k)} ${f1(y - 40 * k * b)} ${f1(x + 18 * k)} ${f1(y - 26 * k * b)}Q${f1(x + 34 * k * a)} ${f1(y - 20 * k)} ${f1(x + 28 * k * a)} ${f1(y)}Z`, C.blushD, 2.4);
  out(`<circle cx="${f1(x - 6 * k)}" cy="${f1(y - 14 * k)}" r="${f1(4 * k)}" fill="${C.blushL}"/>`);
}
// crumbs: small bits of bread, ham, cheese, lettuce
const BITS = [[C.bread, C.breadD], [C.blushL, C.blushD], [C.sun, C.sunD], [C.teal, C.tealD], [C.bread, C.breadD], [C.blushL, C.blushD]];
function crumb(x, y, i, s = 1) {
  const [f] = BITS[i % BITS.length], r = (9 + (i * 7) % 6) * s, a = (i * 47) % 360;
  shape(`M${f1(x - r)} ${f1(y)}L${f1(x - r * .4)} ${f1(y - r * 1.2)}L${f1(x + r)} ${f1(y - r * .7)}L${f1(x + r * .8)} ${f1(y)}Z`, f, 2.2, `transform="rotate(${a % 40 - 20} ${f1(x)} ${f1(y)})"`);
}
// number circle: on = 0 → outlined and hollow (not reached yet), 1 → solid ochre (lit), with a bounce the moment it lights
function numOn(cx, cy, n, on, pop = 0, r = 22) {
  if (ZL < .2) return;
  const k = 1 + .28 * pop;
  out(`<g transform="translate(${cx} ${cy}) scale(${f1(k * 100) / 100})">`);
  shape(E(0, 0, r), on > .5 ? C.sun : C.cream, 2.8);
  txt(0, r * 0.42, n, r * 1.25, { fam: FONT.en, w: 900, anchor: 'middle', fill: on > .5 ? C.ink : '#8A8F9F' });
  out('</g>');
}
// room plaque (with a number that can light up)
function plaqueN(x, y, en, zh, n, on, pop, size = 34) {
  const w = plaque(x + 52, y, en, zh, { size });
  const h = Math.max(size, 34) * 1.42;
  if (n) numOn(x + 22, y + h / 2, n, on, pop);
  return w + 52;
}
// moving conveyor: one spoke on each roller turns with ph
function belt2(a, b, k = 1, ph = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  gline([a, b], 22 * k + 6 * KS, C.ink); gline([a, b], 18 * k, '#4A4D5C');
  if (ZL < .2) return;
  const r = 6.5 * k;
  for (let s = 8; s <= len - 6; s += 32 * k) {
    const t = s / len, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    out(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${C.wallD}" stroke="${C.ink}" stroke-width="${f1(2 * KS)}"/>`);
    out(`<path d="M${f1(x - Math.cos(ph) * r * .7)} ${f1(y - Math.sin(ph) * r * .7)}L${f1(x + Math.cos(ph) * r * .7)} ${f1(y + Math.sin(ph) * r * .7)}" stroke="${C.ink}" stroke-width="${f1(1.6 * KS)}"/>`);
  }
}
// detail layer: fades out as the camera pulls back (ZL = current camera zoom)
function detail(lo, hi, fn) { const o = ss(seg(ZL, lo, hi)); if (o <= .01) return; if (o < .99) out(`<g opacity="${f1(o * 100) / 100}">`); fn(); if (o < .99) out('</g>'); }
// clip the picture to the inside of the outer frame (optional)
function inView(x0, y0, x1, y1) { return !(x1 < VB[0] || x0 > VB[2] || y1 < VB[1] || y0 > VB[3]); }

// ======================================================================
//                       Head: control room + crushers
// ======================================================================
function headInterior(t) {
  // ---- Upper floor: control room (brain) ----
  if (inView(BX0 + 1100, -320, BX0 + 2100, 400)) {
    const cr = room(1160, -170, 820, 538, C.teal);
    detail(.05, .09, () => {
      lamp(1450, cr.y, 120, t > 6.0 && t < 37.6 ? false : false); lamp(1730, cr.y, 120);
      // eyes = portholes; the lookout stands on a step stool with a telescope
      const ex = 1119, ey = 280;
      shape(E(ex, ey, 40), C.sun, 3); shape(E(ex, ey, 29), C.tealL, 2.4);
      out(`<path d="M${ex - 14} ${ey - 12}A20 20 0 0 1 ${ex + 6} ${ey - 20}" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round"/>`);
      for (let a = 0; a < 8; a++) { const r = a * Math.PI / 4; out(`<circle cx="${f1(ex + Math.cos(r) * 35)}" cy="${f1(ey + Math.sin(r) * 35)}" r="2.2" fill="${C.ink}"/>`); }
      shape(`M1176 ${cr.fl}L1184 300H1240L1248 ${cr.fl}Z`, C.wallD, 2.6);
      line([[1180, 320], [1244, 320]], 2.6);
      // telescope: raised at 6.2 s; snaps back to the porthole after the alarm at 37.9 s
      const up = ss(seg(t, 5.9, 6.4)) * (1 - ss(seg(t, 9.2, 9.8))) + ss(seg(t, 37.85, 38.1));
      const jolt = pulse(t, 37.7, .3) * 10;
      worker(1210, 300 - jolt, { s: 1.3, flip: true, lean: -6 + 10 * (1 - up), cap: C.red, back: [lerp(20, 150, up), lerp(0, 40, up)], front: [lerp(30, 150, up), lerp(10, 40, up)],
        prop: h => { if (!h || up < .3) return; shape(R(h[0] - 2, h[1] - 9, 16, 9, 2), C.ink, 0); shape(E(h[0] + 16, h[1] - 4, 5.5), C.ink, 0); } });
      // console: on the screen a sandwich icon walks toward the mouth door
      const x0 = 1470, x1 = 1900, top = 236;
      shadow(`M${x0} ${cr.fl}V${top + 30}L${x0 + 40} ${top}H${x1}V${cr.fl}Z`, 12, 8, C.wallS);
      shape(`M${x0} ${cr.fl}V${top + 30}L${x0 + 40} ${top}H${x1}V${cr.fl}Z`, C.wallD, 3);
      shape(R(x0 + 60, top - 140, 320, 120, 4), C.ink, 3);
      const alarm = t > 37.7 && t < 41;
      out(`<path d="M${x0 + 90} ${top - 50}H${x0 + 350}" stroke="${C.tealL}" stroke-width="2" stroke-dasharray="6 8" opacity=".7"/>`);
      if (t > 5.4 && t < 12.6) {
        const p = ss(seg(t, 5.6, 9.0));
        const ix = x0 + 110 + p * 200;
        shape(R(ix, top - 84, 46, 30, 8), C.sun, 2); out(`<path d="M${ix} ${top - 68}H${ix + 46}" stroke="${C.red}" stroke-width="5"/>`);
      } else if (alarm) {
        const on = Math.floor(t * 6) % 2;
        shape(R(x0 + 80, top - 126, 280, 92, 3), on ? C.red : C.redD, 0);
        txt(x0 + 220, top - 66, 'BUS!', 44, { fam: FONT.en, w: 900, anchor: 'middle', fill: C.cream });
      } else {
        for (let k = 0; k < 4; k++) out(`<path d="M${x0 + 96} ${top - 108 + k * 18}H${x0 + 96 + 60 + ((k * 73) % 140)}" stroke="${C.tealL}" stroke-width="3" opacity=".45"/>`);
      }
      gauge(x0 + 120, top + 44, 22, .35 + .1 * Math.sin(t * 2)); gauge(x0 + 186, top + 44, 22, .82 - .05 * Math.sin(t * 3));
      for (const [k, c] of [[0, C.red], [1, C.sun], [2, C.teal]]) shape(E(x0 + 250 + k * 30, top + 40, 9), c, 2.2);
      out(`<g transform="translate(${x0 + 330} ${top + 70}) rotate(${-28 + 40 * ss(seg(t, 37.8, 38.0))})">`); shape(R(-4, -70, 8, 70, 3), C.ink, 0); shape(E(0, -72, 10), C.red, 2.4); out(`</g>`);
      worker(x0 + 300, cr.fl, { s: 1.3, flip: true, cap: C.sun, back: [-140, 0], front: [-150 + 20 * Math.sin(t * 3), -10] });
      gear(1380, 250, 46, 12, t * 40, C.sun); gear(1332, 196, 26, 8, -t * 70 + 20, C.blush);
      // alarm bell (control room ceiling)
      if (alarm) { const sw = Math.sin(t * 60) * 8; shape(E(1600 + sw, -90, 22), C.red, 2.6); line([[1600, -150], [1600, -112]], 3); }
      plaque(1210, -150, 'CONTROL ROOM', '大脑', { size: 30 });
    });
  }
  // ---- Floor slab ----
  slab(980, 392, 1060, 34);
  // ---- Middle floor: crushers (mouth) ----
  if (inView(BX0 + 960, 400, BX0 + 1800, 860)) {
    const mr = room(1060, 446, 650, 392, C.sun);
    fillOnly(R(1056, DOOR[1] + 10, 22, DOOR[3] - 20), C.wall);
    line([[1060, DOOR[1] + 10], [1074, DOOR[1] + 10]], 2.6); line([[1060, DOOR[1] + DOOR[3] - 10], [1074, DOOR[1] + DOOR[3] - 10]], 2.6);
    // upper teeth: three stamps (on the drum hits)
    let dy = 0; for (const c of K.chomps) dy = Math.max(dy, 48 * pulse(t, c - .12, .3));
    for (const x of [1120, 1250]) { gline([[x, mr.y], [x, 520 + dy]], 10, C.ink); gline([[x, mr.y], [x, 520 + dy]], 4, '#5A5E70'); shape(R(x - 16, 500 + dy, 32, 22, 3), C.wallD, 2.4); }
    shadow(R(1090, 522 + dy, 236, 30, 12), 10, 8, C.wallS);
    shape(R(1090, 522 + dy, 236, 30, 12), C.blush, 3);
    for (let i = 0; i < 5; i++) { const x = 1100 + i * 44; shape(`M${x} ${548 + dy}H${x + 38}V${584 + dy}Q${x + 38} ${596 + dy} ${x + 26} ${596 + dy}H${x + 12}Q${x} ${596 + dy} ${x} ${584 + dy}Z`, C.cream, 2.6); }
    // tongue conveyor
    const T0 = [1340, 632], T1 = [1560, 720];
    pipe(null, 46, C.blush, C.blushL, { d: `M${T0[0]} ${T0[1]}Q1440 640 ${T1[0]} ${T1[1]}`, cap: 'round' });
    out(`<path d="M${T0[0] + 20} ${T0[1] + 2}Q1440 646 ${T1[0] - 12} ${T1[1] - 2}" fill="none" stroke="${C.blushD}" stroke-width="3" stroke-dasharray="14 12" stroke-dashoffset="${f1(-t * 60)}" opacity=".8"/>`);
    for (const x of [1360, 1480]) trestle(x, x < 1400 ? 660 : 694, mr.fl, 22);
    // saliva tank + sprinklers (on 10.0–11.8 s)
    const tx = 1480, ty = 470;
    shadow(R(tx, ty, 96, 84, 10), 10, 8, C.wallS);
    shape(R(tx, ty, 96, 84, 10), C.teal, 3); fillOnly(R(tx + 10, ty + 8, 10, 66, 5), C.tealL);
    pipe([[tx, 520], [1350, 520], [1350, 560]], 14, C.teal, C.tealL);
    pipe([[1350, 560], [1350, 572], [1470, 572]], 14, C.teal, C.tealL);
    const spray = ss(seg(t, 9.85, 10.05)) * (1 - ss(seg(t, 11.9, 12.2))) + (t < 9.0 ? 1 : 0) * .0;
    for (let x = 1368; x <= 1460; x += 23) {
      shape(`M${x - 5} 580H${x + 5}L${x + 3} 588H${x - 3}Z`, C.wallD, 1.8);
      if (spray > .02) for (let k = 0; k < 4; k++) { const yy = 596 + ((t * 120 + k * 13 + x) % 52); out(`<circle cx="${x + (k % 2 ? 4 : -3)}" cy="${f1(yy)}" r="${f1((3.2 - k * .4) * spray)}" fill="${C.tealL}" stroke="${C.tealD}" stroke-width="1.2"/>`); }
    }
    // platform + the worker turning the valve
    out(`<path d="M1590 610H1690" stroke="${C.ink}" stroke-width="8"/>`);
    for (const x of [1600, 1640, 1680]) line([[x, 610], [x, 574]], 2.6); line([[1594, 576], [1690, 576]], 2.6);
    line([[1600, 610], [1586, mr.fl]], 4); line([[1680, 610], [1694, mr.fl]], 4);
    const wheel = t * 0 + ss(seg(t, 9.75, 10.1)) * 180;
    out(`<g transform="rotate(${f1(wheel)} 1600 520)">`); shape(E(1600, 520, 17), null, 3.2); line([[1583, 520], [1617, 520]], 2.4); line([[1600, 503], [1600, 537]], 2.4); out('</g>');
    worker(1630, 610, { s: 1.25, flip: true, back: [160, 10], front: [150 + 20 * pulse(t, 9.75, .4), 20] });
    // hopper at the throat
    shape(`M1530 740H1690L1650 790H1570Z`, C.sunD, 3);
    // jaw conveyor (in through the mouth door) + lower teeth (in front of the conveyor)
    belt2([990, 640], [1310, 640], 1, -sandX(t) / 6.5);
    shape(R(1090, 666, 236, 28, 12), C.blush, 3);
    for (let i = 0; i < 5; i++) { const x = 1100 + i * 44; shape(`M${x} 668V634Q${x} 622 ${x + 12} 622H${x + 26}Q${x + 38} 622 ${x + 38} 634V668Z`, C.cream, 2.6); }
    // cargo: sandwich → flattened → crumbs → onto the tongue → down the throat
    mouthCargo(t);
    detail(.05, .09, () => {
      const on = t > K.chomps[0] ? 1 : 0;
      plaqueN(1058, 420, 'CRUSHER', '口腔', '1', on || t > 44 ? 1 : 0, pulse(t, K.chomps[0], .35));
    });
  }
  // chute from the throat down (all the way to the stomach)
  pipe([[1610, 786], [1610, 2560]], 78, C.sun, C.sunL);
  for (const y of [900, 1030, 1960, 2420]) flange(1610, y, 78, true, y > 1500 ? C.sunD : C.blushD);
  detail(.05, .09, () => { for (let y = 940; y < 2520; y += 120) { const yy = y + ((t * 160) % 120); if (yy < 2520) chev(1610, yy, 0, C.sunD, 1.4); } });
  slab(980, 852, 1060, 34);
}

// cargo in the mouth
function mouthCargo(t) {
  if (t < K.cut3 || t > 13.4) return;
  const cx = sandX(t), by = 626;
  const c1 = K.chomps[0], c2 = K.chomps[1], c3 = K.chomps[2];
  if (t < c3 + .05) {
    // sandwich between the teeth: a bit flatter with each bite
    let sq = 1; if (t > c1) sq = .78; if (t > c2) sq = .56;
    let cur = 1; for (const c of K.chomps) cur = Math.min(cur, 1 - .3 * pulse(t, c - .02, .2));
    const k = 1.12;
    if (cx > -500) {
      out(`<g transform="translate(${f1(cx - BX0)} ${by}) scale(1 ${f1(sq * cur * 100) / 100}) translate(${f1(-(cx - BX0))} ${-by})">`);
      sandwichAt(cx - BX0, by, k, 5, 0, t);
      out('</g>');
      if (t > c1) for (let i = 0; i < 6 + (t > c2 ? 5 : 0); i++) crumb(cx - BX0 - 70 + i * 26, by - 4 - (i % 3) * 6, i, .9);
    }
  } else {
    // crumbs: pile up under the teeth first, then slide along the tongue to the throat and drop into the chute
    const tg = K.tongue, n = 14;
    for (let i = 0; i < n; i++) {
      const d = i * .05, p = ss(seg(t, tg[0] + d, tg[1] + d * .5));
      // tongue curve M1340 632 Q1440 640 1560 720
      const u = p, x = (1 - u) * (1 - u) * 1300 + 2 * u * (1 - u) * 1440 + u * u * 1560 + (i % 4) * 8 - 12;
      const y = (1 - u) * (1 - u) * 622 + 2 * u * (1 - u) * 640 + u * u * 712 - 18 - (i % 3) * 8;
      const fall = seg(t, tg[1] + d * .5 + .02, tg[1] + d * .5 + .55);
      const fx = lerp(x, 1610 + ((i * 37) % 60) - 30, ss(fall)), fy = y + fall * fall * 1500;
      if (fy < 2560) crumb(fx, fy, i, 1);
    }
  }
}

// ======================================================================
//                       Chest: pump (heart) + bellows (lungs)
// ======================================================================
function chest(t) {
  if (!inView(BX0 + 1080, 1180, BX0 + 3000, 2000)) return;
  // pump room
  const pr = room(1150, 1300, 380, 420, C.red);
  // bellows room
  const lr = room(1720, 1270, 1100, 640, C.teal);
  detail(.05, .09, () => {
    // heart = twin-cylinder pump: two pistons moving up and down in turn
    for (let i = 0; i < 2; i++) {
      const x = pr.x + 90 + i * 170, ph = Math.sin(t * 7 + i * Math.PI);
      shape(R(x - 50, pr.y + 140, 100, 180, 8), C.red, 3); fillOnly(R(x - 40, pr.y + 150, 12, 150, 5), C.redL);
      gline([[x, pr.y + 40], [x, pr.y + 150 + ph * 20]], 12, C.ink); gline([[x, pr.y + 40], [x, pr.y + 150 + ph * 20]], 5, '#5A5E70');
      shape(R(x - 30, pr.y + 20, 60, 24, 4), C.wallD, 2.4);
    }
    gauge(pr.x + 170, pr.y + 100, 20, .5 + .3 * Math.sin(t * 7));
    // bellows: two accordion-like bellows, opening and closing
    for (let i = 0; i < 2; i++) {
      const x = lr.x + 200 + i * 520, br = .5 + .5 * Math.sin(t * 1.6 + i * .6), h = 230 + 90 * br, y1 = lr.fl, y0 = y1 - h;
      shadow(R(x - 150, y0, 300, h, 10), 12, 8, C.wallS);
      shape(R(x - 150, y0, 300, h, 10), C.blush, 3);
      for (let k = 1; k < 6; k++) { const yy = y0 + h * k / 6; line([[x - 150, yy], [x + 150, yy]], 2.2, C.blushD); }
      shape(R(x - 170, y0 - 22, 340, 26, 5), C.wallD, 2.6);
      pipe([[x, y0 - 22], [x, lr.y + 30]], 26, C.teal, C.tealL);
    }
    worker(lr.x + 470, lr.fl, { s: 1.25, cap: C.teal, back: [150 + 20 * Math.sin(t * 1.6), 0], front: [160 + 20 * Math.sin(t * 1.6), -10] });
    plaque(pr.x - 4, 1270, 'PUMP', '心脏', { size: 30 });
    plaque(lr.x + 60, 1240, 'BELLOWS', '肺', { size: 30 });
  });
}

// ======================================================================
//    Torso floors (TL coords): ⑤ warehouse · ② drum · ③ gatekeeper · ④ sorting line · ⑥ furnace room
// ======================================================================
const LANES = [452, 592, 730];
const XR = 1430;                        // left edge of the sorter
const XL = [330, 385, 440];             // left ends of the three lines
const PX = [270, 325, 380];             // the three outlet pipes
const SPOUT = 1610;                     // gatekeeper drop chute (TL x) = right above the sorter hopper
const LCOL = () => [[C.sun, C.sunL], [C.red, C.redL], [C.teal, C.tealL]];

function torso(t) {
  out(`<g transform="translate(${TOX} ${TOY})">`);
  // floor slabs: diaphragm, liver/stomach, stomach/small intestine, small intestine/pelvis
  slab(60, -752, 1960, 34); slab(60, -290, 1960, 34); slab(60, 238, 1960, 34); slab(60, 820, 1960, 34);
  // pipes drawn first (they run outside the rooms)
  pipesTorso(t);
  if (inViewT(700, -720, 1900, -280)) warehouse(t);
  if (inViewT(300, -260, 1900, 240)) stomachFloor(t);
  if (inViewT(150, 270, 1900, 830)) sortingFloor(t);
  if (inViewT(900, 840, 1960, 1460)) furnaceRoom(t);
  out('</g>');
}
const inViewT = (x0, y0, x1, y1) => inView(x0 + TOX + BX0, y0 + TOY, x1 + TOX + BX0, y1 + TOY);

// ---- Pipes: yellow (sugar) and red (amino acids) go up the portal vein into the warehouse; teal (fat) takes the lymph; the artery runs down the back to the furnace room ----
function pipesTorso(t) {
  // yellow pipe: left end of the sorting line → up through the front shaft of the stomach floor → turns into the warehouse on its floor
  pipe(null, 28, C.sun, C.sunL, { d: rpoly([[PX[0], LANES[0] - 4], [PX[0], -360], [PX[0], -400], [760, -400]], 34) });
  pipe(null, 28, C.red, C.redL, { d: rpoly([[PX[1], LANES[1] - 4], [PX[1], -340], [760, -340]], 34) });
  // teal pipe: down through the floor, back along the underside of the slab, then up the back (lymph → thoracic duct)
  pipe(null, 28, C.teal, C.tealL, { d: rpoly([[PX[2], LANES[2] - 4], [PX[2], 880], [1840, 880], [1840, 1440]], 34) });
  for (const [x, y] of [[PX[0], -120], [PX[1], -120], [PX[0], 120], [PX[1], 120]]) flange(x, y, 28, true);
  detail(.05, .09, () => {
    for (let y = 100; y > -380; y -= 140) { const yy = y - ((t * 120) % 140); chev(PX[0], yy, 180, C.sunD, 1); chev(PX[1], yy + 60, 180, C.redD, 1); }
    for (const x of [900, 1400]) chev(x, 880, -90, C.tealD, 1);
  });
  // artery (big red pipe): comes down from the top of the chest, runs down the back, into the furnace room
  pipe([[1905, -1500], [1905, 1000], [1830, 1000]], 44, C.red, C.redL);
  for (const y of [-900, -420, 120, 700]) flange(1905, y, 44, true, C.redD);
  // sugar cubes running in the artery (after shot 7)
  if (t > 40.4 && t < 47) {
    for (let i = 0; i < 12; i++) {
      const y = -560 + ((t - 40.4) * 900 + i * 130) % 1560;
      if (y > -540 && y < 990) cube(1905 + 8, y + 12, 22);
    }
  }
}

// ---------------- ⑤ Warehouse (liver) ----------------
// sugar cubes drop from the inlet in the left wall → short roller track → a worker stacks them on two rows of shelves; on the right: clock, alarm bell, funnel to the artery
function warehouse(t) {
  const wr = room(740, -706, 1090, 400, C.teal);
  const ff = seg(t, K.clockFF[0], K.clockFF[1]);
  const dark = ss(seg(t, K.clockFF[0], K.clockFF[1] - .2)) * (1 - ss(seg(t, K.alarm, K.alarm + .25)));
  const FL = wr.fl;
  detail(.05, .09, () => {
    lamp(1000, wr.y, -610); lamp(1420, wr.y, -610);
    // inlet: the yellow pipe comes in through the left wall, sugar cubes slide down a chute onto the rollers
    shape(R(wr.x - 6, -436, 44, 64, 4), C.ink, 0);
    shape(`M${wr.x + 36} -404L${wr.x + 120} -372V-360L${wr.x + 36} -390Z`, C.wallD, 2.4);
    belt2([wr.x + 110, FL - 40], [wr.x + 300, FL - 40], .7, -t * 5);
    for (const x of [wr.x + 130, wr.x + 280]) line([[x, FL - 30], [x, FL]], 4);
    const flow = t > 33.4 && t < K.clockFF[0] + .3;
    if (flow) for (let k = 0; k < 4; k++) { const p = ((t - 33.4) * .7 + k / 4) % 1; const x = lerp(wr.x + 60, wr.x + 290, p), y = p < .25 ? lerp(-392, FL - 52, p / .25) : FL - 52; cube(x, y + 0, 24); }
    // red barrel: amino acids go to the liver too (a second inlet)
    shape(R(wr.x - 6, -372, 30, 26, 3), C.ink, 0);
    shape(R(wr.x + 20, FL - 56, 66, 56, 6), C.red, 2.6); for (let k = 0; k < 3; k++) bead(wr.x + 36 + k * 17, FL - 46, 7);
    // two rows of shelves: filling up with sugar cubes (glycogen)
    const fill = t > 44 ? 1 : clamp((t - 32.6) / 4.2);
    let idx = 0;
    for (const [x0, x1] of [[wr.x + 340, wr.x + 640], [wr.x + 670, wr.x + 900]]) {
      for (let r = 0; r < 4; r++) {
        const sy = FL - 6 - r * 78;
        shape(R(x0, sy, x1 - x0, 9), C.wallD, 2.2);
        for (let x = x0 + 22; x < x1 - 10; x += 32) {
          idx++;
          const need = (r * .22 + ((idx * 37) % 10) * .018) * (x0 > wr.x + 400 ? 1.15 : 1);
          if (fill > need) cube(x, sy, 26);
        }
      }
      line([[x0 + 6, FL - 240], [x0 + 6, FL]], 3); line([[x1 - 6, FL - 240], [x1 - 6, FL]], 3);
    }
    // worker: stacks → dozes → jumps at the alarm → runs to the artery funnel carrying sugar cubes
    const run = seg(t, K.alarm + .3, K.alarm + 2.4);
    if (t < K.clockFF[0] + .3) {
      const cyc = (t * .9) % 1, wx = lerp(wr.x + 310, wr.x + 620, Math.sin(cyc * Math.PI));
      worker(wx, FL, { s: 1.3, coat: C.teal, cap: C.ink, walk: 6 * Math.sin(t * 12), back: [160, 10], front: [165, -10], prop: h => { if (h) cube(h[0] + 4, h[1] - 2, 24); } });
      worker(wr.x + 930 - 140, FL, { s: 1.25, coat: C.cream, cap: C.sun, flip: true, back: [150, 0], front: [140 + 30 * Math.sin(t * 4), -20], prop: h => { if (h && Math.sin(t * 4) > 0) cube(h[0] + 2, h[1] - 2, 24); } });
    } else if (t < K.alarm) {
      worker(wr.x + 690, FL, { s: 1.3, coat: C.teal, cap: C.ink, sit: true, lean: -12, back: [10, 0], front: [20, 10] });
      worker(wr.x + 330, FL, { s: 1.25, coat: C.cream, cap: C.sun, sit: true, lean: 10, back: [0, 0], front: [10, 0] });
      for (const [zx, ph] of [[wr.x + 720, 0], [wr.x + 360, .5]]) { const z = (t * 1.2 + ph) % 1; txt(zx + z * 30, -560 - z * 70, z > .5 ? 'Z' : 'z', 24 + z * 16, { fam: FONT.en, w: 900 }); }
    } else {
      const jump = pulse(t, K.alarm, .35) * 34;
      worker(lerp(wr.x + 700, 1690, ss(run)), FL - jump, { s: 1.3, coat: C.teal, cap: C.ink, walk: run > 0 && run < 1 ? 6 * Math.sin(t * 22) : 0, back: [170, 10], front: [170, -10], prop: h => { if (h) { cube(h[0] - 8, h[1] - 2, 24); cube(h[0] + 18, h[1] - 2, 24); } } });
      worker(lerp(wr.x + 340, 1650, ss(seg(t, K.alarm + .5, K.alarm + 2.7))), FL - pulse(t, K.alarm + .1, .35) * 30, { s: 1.25, coat: C.cream, cap: C.sun, walk: 6 * Math.sin(t * 22 + 1), back: [170, 10], front: [170, -10], prop: h => { if (h) cube(h[0] + 4, h[1] - 2, 24); } });
    }
    // artery funnel (right wall)
    shape(`M1700 ${FL - 120}H1800L1780 ${FL - 70}H1720Z`, C.redD, 2.8);
    pipe([[1750, FL - 70], [1750, FL + 10], [1905, FL + 10]], 22, C.red, C.redL);
    if (t > K.alarm + 2.0 && t < 44) for (let k = 0; k < 3; k++) { const p = ((t - K.alarm - 2.0) * 2.2 + k / 3) % 1; cube(lerp(1712, 1750, p), FL - 120 + p * 60, 22); }
    // clock: 1:15 → fast-forward to 6:30
    const cx = 1750, cy = -600;
    shape(E(cx, cy, 44), C.cream, 3);
    for (let a = 0; a < 12; a++) { const r = a * Math.PI / 6; line([[cx + Math.cos(r) * 34, cy + Math.sin(r) * 34], [cx + Math.cos(r) * 39, cy + Math.sin(r) * 39]], 2.2); }
    const hrs = lerp(1.25, 6.5, ss(ff));
    const ma = (hrs % 1) * 2 * Math.PI - Math.PI / 2, ha = (hrs / 12) * 2 * Math.PI - Math.PI / 2;
    line([[cx, cy], [cx + Math.cos(ma) * 32, cy + Math.sin(ma) * 32]], 3);
    line([[cx, cy], [cx + Math.cos(ha) * 22, cy + Math.sin(ha) * 22]], 4.5);
    out(`<circle cx="${cx}" cy="${cy}" r="4" fill="${C.ink}"/>`);
    const hh = Math.floor(hrs), mm = Math.floor((hrs % 1) * 60 / 5) * 5;
    const s = `${hh}:${String(mm).padStart(2, '0')} PM`;
    shape(R(cx - 64, cy + 56, 128, 40, 3), C.cream, 2.4); fillOnly(R(cx - 64, cy + 56, 8, 40), C.red); shape(R(cx - 64, cy + 56, 128, 40, 3), null, 2.4);
    txt(cx + 4, cy + 86, s, 28, { fam: FONT.en, w: 800, anchor: 'middle', ls: 1 });
    // alarm bell
    const ring = t > K.alarm && t < K.alarm + 3.2;
    const sw = ring ? Math.sin(t * 70) * 6 : 0, bx = 1600;
    line([[bx, wr.y], [bx, -650]], 3);
    shape(`M${bx - 26 + sw} -620A26 26 0 0 1 ${bx + 26 + sw} -620Z`, C.red, 2.6); shape(E(bx + sw, -616, 6), C.ink, 0);
    if (ring) for (const s2 of [-1, 1]) for (let k = 0; k < 3; k++) line([[bx + s2 * (40 + k * 4), -640 + k * 16], [bx + s2 * (58 + k * 4), -646 + k * 16]], 3);
  });
  if (dark > .01) fillOnly(R(wr.x, wr.y, wr.w, wr.h), C.ground, `opacity="${f1(dark * .24 * 100) / 100}"`);
  detail(.05, .09, () => {
    plaqueN(800, -732, 'WAREHOUSE', '肝', '5', t > K.n5 ? 1 : 0, pulse(t, K.n5, .35), 32);
  });
}

// ---------------- ② Drum (stomach) + ③ gatekeeper (pylorus) ----------------
function stomachFloor(t) {
  const st = room(360, -236, 900, 462, C.teal);
  const DX = 760, DY = 0, DL = 300, DR = 128, DA = 3;
  const spin = t > K.drumIn ? (t - K.drumIn) * 1.6 : 0;
  detail(.05, .09, () => {
    out(`<path d="M${-DL} ${-DR}H${DL}A40 ${DR} 0 0 1 ${DL} ${DR}H${-DL}Z" fill="${C.wallS}" transform="translate(${DX + 18} ${DY + 14}) rotate(${DA})"/>`);
  });
  out(`<g transform="translate(${DX} ${DY}) rotate(${DA})">`);
  const drum = `M${-DL} ${-DR}H${DL}A40 ${DR} 0 0 1 ${DL} ${DR}H${-DL}Z`;
  const cid = 'drum' + (UID++);
  out(`<clipPath id="${cid}"><path d="${drum}"/></clipPath>`);
  fillOnly(drum, C.blush);
  out(`<g clip-path="url(#${cid})"${tr(C.blushD)}>`);
  const off = (spin * 62) % 62;
  for (let k = -9; k < 9; k++) out(`<path d="M${f1(k * 62 - 40 + off)} ${-DR - 10}L${f1(k * 62 + 40 + off)} ${DR + 10}" stroke="${C.blushD}" stroke-width="20"/>`);
  out(`</g><g clip-path="url(#${cid})"${tr(C.blushL)}><path d="M${-DL} ${-DR + 26}H${DL + 60}" stroke="${C.blushL}" stroke-width="20"/></g>`);
  shape(drum, null, 3.4);
  for (const x of [-140, 140]) shape(`M${x - 13} ${-DR - 6}H${x + 13}V${DR + 6}H${x - 13}Z`, C.sun, 2.8);
  // inspection window: crumbs tumbling inside
  shape(E(0, 10, 40), C.sun, 3); shape(E(0, 10, 29), C.tealL, 2.4);
  if (ZL > .3) {
    const n = t > K.drumIn ? 6 : 0;
    const mush = ss(seg(t, K.drumIn + .5, 16.5));
    for (let i = 0; i < n; i++) { const a = spin * 2.4 + i * 1.05; const rr = 14 + (i % 2) * 4; const x = Math.cos(a) * rr, y = 10 + Math.sin(a) * rr;
      out(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(lerp(5, 7, mush))}" fill="${mush > .6 ? C.blushD : BITS[i][0]}" stroke="${C.ink}" stroke-width="1.4"/>`); }
  }
  // inlet (on top, joined to the throat chute)
  shape(R(630 - DX - 50, -DR - 30, 100, 34, 4), C.sunD, 2.8);
  out(`</g>`);
  detail(.05, .09, () => {
    for (const x of [600, 920]) { const y = DY + DR + 4 + (x - DX) * Math.tan(DA * Math.PI / 180); line([[x - 44, st.fl], [x, y], [x + 44, st.fl]], 6); shape(E(x, y + 4, 9), C.wallD, 2.2); }
    // acid rain: ceiling sprinklers shower the drum
    const acid = ss(seg(t, K.drumIn + .2, K.drumIn + .5));
    pipe([[420, -200], [1180, -200]], 14, C.teal, C.tealL);
    for (let x = 520; x <= 1080; x += 70) {
      shape(`M${x - 6} -192H${x + 6}L${x + 4} -182H${x - 4}Z`, C.wallD, 1.8);
      if (acid > .02) for (let k = 0; k < 3; k++) { const yy = -176 + ((t * 140 + k * 20 + x * .3) % 46); out(`<path d="M${x + (k - 1) * 5} ${f1(yy)}v8" stroke="${C.tealD}" stroke-width="2.4" stroke-linecap="round" opacity="${f1(acid)}"/>`); }
    }
    // gauges: hand moving (time compressed) + acidity
    gauge(470, -60, 26, .2 + .7 * ss(seg(t, K.drumIn, 17)));
    // winch worker
    worker(430, st.fl, { s: 1.25, coat: C.teal, cap: C.ink, back: [150 + 25 * Math.sin(spin * 3), 0], front: [150 + 25 * Math.sin(spin * 3 + 1), 10] });
    out(`<g transform="rotate(${f1(spin * 90)} 400 ${st.fl - 70})">`); shape(E(400, st.fl - 70, 22), C.sun, 2.6); line([[378, st.fl - 70], [422, st.fl - 70]], 3); line([[400, st.fl - 92], [400, st.fl - 48]], 3); out('</g>');
    plaqueN(400, -262, 'ACID DRUM', '胃', '2', t > K.n2 ? 1 : 0, pulse(t, K.n2, .35), 32);
  });
  // outlet pipe: from the drum's end through the wall to the gatekeeper
  pipe([[1060, 16], [1380, 16]], 40, C.blush, C.blushL);
  flange(1210, 16, 40, false, C.blushD);
  const gt = room(1290, -236, 540, 462, C.red);
  pipe([[1290, 16], [1380, 16]], 40, C.blush, C.blushL);
  // pylorus = round gate valve + measuring spoon
  const vx = 1400, vy = 16;
  const spoons = K.spoons;
  let tip = 0;   // spoon tip angle (0 flat → 1 tipped over)
  for (const s of spoons) tip = Math.max(tip, ss(seg(t, s, s + .18)) * (1 - ss(seg(t, s + .3, s + .6))));
  shape(E(vx, vy, 52), C.cream, 3);
  out(`<g transform="rotate(${f1(tip * 60 + (t > K.drumIn ? (t - K.drumIn) * 8 : 0))} ${vx} ${vy})">`);
  shape(E(vx, vy, 36), C.blushD, 2.6);
  for (let a = 0; a < 6; a++) { const r = a * Math.PI / 3 + .3; line([[vx, vy], [vx + Math.cos(r) * 36, vy + Math.sin(r) * 36]], 2.4); }
  out('</g>');
  shape(E(vx, vy, 9), C.ink, 0);
  pipe([[vx, vy + 52], [vx, vy + 76]], 22, C.blush, C.blushL);
  // spoon: handle pivot on the left, the bowl over the drop chute
  const SPX = SPOUT - 70, SPY = 100;
  out(`<g transform="translate(${SPX} ${SPY}) rotate(${f1(14 + tip * 62)})">`);
  line([[-140, 0], [20, 0]], 6);
  shape(`M20 -6Q20 30 56 30Q92 30 92 -6Z`, C.wallD, 2.8);
  // the lump in the spoon (there before tipping, leaves the moment it tips)
  const loaded = spoons.some(s => t > s - 1.2 && t < s + .12);
  if (loaded) shape(`M30 -6Q40 -22 56 -16Q74 -24 84 -6Z`, C.blushD, 2.4);
  out(`</g>`);
  shape(E(SPX - 140, SPY, 7), C.wallD, 2.2);
  // paste queueing at the valve
  if (t > 15.5 && t < 21.5) for (let k = 0; k < 3; k++) blob(vx - 80 - k * 46, vy + 34, .55, t * 3 + k);
  // drop chute
  shape(`M${SPOUT - 40} ${gt.fl - 6}H${SPOUT + 40}L${SPOUT + 20} ${gt.fl + 22}H${SPOUT - 20}Z`, C.sunD, 2.8);
  pipe([[SPOUT, gt.fl + 20], [SPOUT, 360]], 44, C.sun, C.sunL);
  // the lump that tips out: falls into the drop chute (the first spoonful falls in frame, the second follows it down a floor → match cut)
  for (const s of spoons) {
    const p = seg(t, s + .12, s + .5);
    if (p > 0 && p < 1) blob(SPOUT - 4, lerp(SPY + 30, gt.fl + 30, p * p), .62, t * 6);
  }
  // gatekeeper: raises the STOP sign ↔ pulls the spoon handle (comic beat)
  const stopUp = K.stops.some(([a, b]) => t > a && t < b) ? 1 : 0;
  let arm = 1;   // 1 = sign up, 0 = sign down, pulling the spoon
  for (const [a, b] of K.stops) { if (t > a - .12 && t < a) arm = Math.min(arm, seg(t, a - .12, a)); }
  arm = stopUp ? 1 : 0;
  const pullArm = tip;
  detail(.05, .09, () => {
    worker(1712, gt.fl, { s: 1.4, cap: C.red, flip: true, back: [lerp(40, 70, pullArm), lerp(20, 30, pullArm)], front: arm ? [175, 0] : [80, 10],
      prop: h => { if (!h || !arm) return; line([[h[0], h[1] + 4], [h[0], h[1] - 30]], 3); shape(E(h[0], h[1] - 48, 19), C.red, 2.4); line([[h[0] - 10, h[1] - 48], [h[0] + 10, h[1] - 48]], 5, C.cream); } });
    // guard booth
    shadow(R(1740, gt.fl - 104, 70, 104, 3), 10, 8, C.wallS);
    shape(R(1740, gt.fl - 104, 70, 104, 3), C.teal, 3);
    shape(R(1752, gt.fl - 90, 46, 34, 2), C.tealL, 2.4);
    shape(`M1732 ${gt.fl - 104}H1818L1806 ${gt.fl - 124}H1744Z`, C.red, 2.8);
    plaqueN(1300, -262, 'GATEKEEPER', '幽门', '3', t > K.n3 ? 1 : 0, pulse(t, K.n3, .35), 32);
  });
}

// ---------------- ④ Sorting line (small intestine) ----------------
function sortingFloor(t) {
  const H = room(190, 290, 1640, 520, C.sun);
  const go = t > K.n4 ? 1 : 0;                 // machine starts
  const L = K.lines;                            // the three legend tags flip down with narration line 7
  const RU = K.run;                             // the three lines start one by one with narration line 6
  const on = i => t > RU[i];
  const ph = t * 6;
  detail(.05, .09, () => { lamp(760, H.y, 352); lamp(1180, H.y, 352); });
  // drop chute (down through the slab from the gatekeeper floor) into the hopper
  pipe([[SPOUT, 226], [SPOUT, 352]], 44, C.sun, C.sunL);
  flange(SPOUT, 255, 44, true, C.sunD);
  // walkways of the three lines
  LANES.forEach((y, i) => { line([[XL[i] + 30, y + 14], [XR - 10, y + 14]], 4, C.ink, 'opacity=".5"'); });
  // ---- Sorter ----
  { const x0 = XR, x1 = 1660, y0 = 382;
    shadow(R(x0, y0, x1 - x0, H.fl - y0 + 22), 14, 0, C.wallS);
    shape(R(x0, y0, x1 - x0, H.fl - y0 + 22, 6), C.wallD, 3);
    shape(`M${x0 + 30} ${y0 + 2}L${x0} 340H${x1}L${x1 - 30} ${y0 + 2}Z`, C.blush, 3);
    LANES.forEach((y, i) => {
      shape(R(x0 - 4, y - 46, 60, 52, 4), C.ink, 0);
      const lit = on(i) ? 1 : 0;
      shape(E(x0 + 100, y - 20, 13), lit ? LCOL()[i][0] : C.wallS, 2.4);
      if (lit) out(`<circle cx="${x0 + 96}" cy="${y - 24}" r="4" fill="${LCOL()[i][1]}"/>`);
      line([[x0 + 130, y - 20], [x1 - 22, y - 20]], 3, C.ink, 'opacity=".35"');
    });
    detail(.05, .09, () => {
      gauge(x0 + 170, 430, 20, go ? .55 + .1 * Math.sin(t * 4) : .1);
      LCOL().forEach(([c], i) => {
        const bx = 1700 + i * 40, by = 470;
        shape(`M${bx - 8} ${by - 60}H${bx + 8}V${by - 36}Q${bx + 18} ${by - 26} ${bx + 18} ${by - 12}Q${bx + 18} ${by} ${bx} ${by}Q${bx - 18} ${by} ${bx - 18} ${by - 12}Q${bx - 18} ${by - 26} ${bx - 8} ${by - 36}Z`, C.cream, 2.4);
        fillOnly(`M${bx - 16} ${by - 16}Q${bx - 16} ${by - 2} ${bx} ${by - 2}Q${bx + 16} ${by - 2} ${bx + 16} ${by - 16}Z`, c);
      });
      shape(R(1680, 470, 140, 12, 2), C.wallD, 2.4);
      line([[1692, 482], [1716, 506]], 3); line([[1808, 482], [1784, 506]], 3);
      worker(1750, H.fl, { s: 1.25, coat: C.cream, cap: C.sun, back: [10, 0], front: [140 + 10 * Math.sin(t * 2), 10], prop: h => { if (h) { shape(R(h[0] - 2, h[1] - 30, 18, 30, 3), C.wallD, 2.2); } } });
      gauge(1756, 600, 22, .3 + .2 * go * Math.sin(t * 3)); gauge(1806, 600, 16, .7);
    });
  }
  // the lump caught in the hopper (where the match cut lands)
  { const p = seg(t, K.cut5 - .5, K.cut5 + .55);
    if (p > 0 && p < 1) blob(SPOUT - 4, lerp(250, 370, ss(p)), .62 + .1 * p, t * 6);
    else if (t >= K.cut5 + .55 && t < K.cut5 + 1.2) blob(SPOUT - 4, 370 + 40 * ss(seg(t, K.cut5 + .55, K.cut5 + 1.2)), .72 * (1 - seg(t, K.cut5 + .8, K.cut5 + 1.2)), t * 6);
  }
  // line 1: bread → stamping press → sugar cubes
  { const y = LANES[0], top = y - 11, run = on(0);
    const sp = run ? (t - RU[0]) : 0;
    worker(1120, y + 10, { s: 1.15, cap: C.sun, back: [150, 10], front: [160 - 30 * pulse(t % .5, 0, .5) * (run ? 1 : 0), -20] });
    belt2([XL[0], y], [XR, y], 0.8, run ? -sp * 8 : 0);
    // raw bread slices leave the sorter heading left
    for (let k = 0; k < 3; k++) { const x = 1360 - k * 130 - (run ? (sp * 90) % 130 : 0); if (x > 1060) { shape(R(x - 56, top - 30, 112, 30, 7), C.breadD, 2.6); fillOnly(R(x - 50, top - 25, 100, 20, 3), C.bread); } }
    const px = 1000, press = run ? Math.max(0, Math.sin(sp * Math.PI * 2 / .72)) : 0;
    line([[px - 80, top], [px - 80, y - 118]], 7); line([[px + 80, top], [px + 80, y - 118]], 7);
    shape(R(px - 96, y - 130, 192, 22, 3), C.sun, 3);
    gline([[px, y - 108], [px, top - 44 + press * 14]], 10, C.ink); gline([[px, y - 108], [px, top - 44 + press * 14]], 4, '#5A5E70');
    shape(R(px - 58, top - 46 + press * 14, 116, 20, 3), C.ink, 0);
    for (let k = 0; k < 4; k++) { const x = px - 52 + k * 26; shape(R(x, top - 22, 26, 22, 2), C.sunL, 2.2); }
    // sugar cubes heading left
    const shift = run ? (sp * 70) % 46 : 0, reach = run ? 870 - sp * 260 : 99999;
    for (let x = 870; x > XL[0] + 30; x -= 46) { const xx = x - shift; if (xx > Math.max(XL[0] + 26, reach) && xx < 900) cube(xx, top); }
  }
  // line 2: ham → unchaining machine → a string of beads → snipped → single amino acids
  { const y = LANES[1], top = y - 11, run = on(1);
    const sp = run ? (t - RU[1]) : 0;
    const snip = run ? pulse(sp % .6, 0, .3) : 0;
    worker(762, y + 10, { s: 1.4, cap: C.red, coat: C.cream, back: [120, -30], front: [100 + 12 * snip, -40],
      prop: h => { if (!h) return;
        out(`<g transform="translate(${f1(h[0] + 6)} ${f1(h[1] + 2)}) rotate(28)">`);
        line([[0, 0], [52, -10 + 8 * snip]], 6); line([[0, 0], [52, 10 - 8 * snip]], 6);
        shape(E(-8, -6, 7), C.red, 2.4); shape(E(-8, 6, 7), C.red, 2.4);
        out(`</g>`); } });
    belt2([XL[1], y], [XR, y], 0.8, run ? -sp * 8 : 0);
    for (let k = 0; k < 3; k++) { const x = 1370 - k * 130 - (run ? (sp * 90) % 130 : 0); if (x > 1180) { shape(R(x - 58, top - 20, 116, 20, 9), C.blushL, 2.6); for (const dx of [-30, 0, 30]) out(`<path d="M${f1(x + dx - 6)} ${top - 13}q6 4 12 0" fill="none" stroke="${C.blushD}" stroke-width="2.2" stroke-linecap="round"/>`); } }
    shape(R(1060, top - 92, 110, 92, 5), C.red, 3);
    shape(R(1072, top - 80, 86, 40, 3), C.redL, 2.4);
    shape(E(1115, top - 22, 12), C.wallD, 2.4);
    out(`<g transform="rotate(${f1(run ? sp * 300 : 0)} 1202 ${top - 60})">`); line([[1170, top - 60], [1202, top - 60], [1202, top - 92]], 4); shape(E(1202, top - 96, 7), C.ink, 0); out('</g>');
    worker(1230, y + 10, { s: 1.15, cap: C.ink, coat: C.teal, back: [-160, 0], front: [-170 + 20 * Math.sin(sp * 6), 10] });
    // bead chain (spat out to the left) + single beads heading left once snipped
    const shift = run ? (sp * 70) % 27 : 0;
    const chain = []; for (let x = 1044; x > 800; x -= 27) chain.push(x - shift);
    const chainVis = run ? chain.filter(x => x > 1044 - sp * 300) : [];
    if (chainVis.length) { line(chainVis.map(x => [x, top - 12]), 3); chainVis.forEach(x => bead(x, top, 11)); }
    const reach = run ? 700 - (sp - .8) * 260 : 99999;
    const sh2 = run ? (sp * 70) % 50 : 0;
    for (let x = 700; x > XL[1] + 30; x -= 50) { const xx = x - sh2; if (sp > .8 && xx > Math.max(XL[1] + 26, reach)) bead(xx, top, 12); }
  }
  // line 3: cheese → press rollers → oil drops (fatty acids)
  { const y = LANES[2], top = y - 11, run = on(2);
    const sp = run ? (t - RU[2]) : 0;
    belt2([XL[2], y], [XR, y], 0.8, run ? -sp * 8 : 0);
    for (let k = 0; k < 3; k++) { const x = 1380 - k * 126 - (run ? (sp * 90) % 126 : 0); if (x > 1200) { shape(`M${f1(x - 56)} ${top}V${top - 34}L${f1(x + 50)} ${top - 18}V${top}Z`, C.sunL, 2.6); for (const [a, b] of [[-30, -14], [-6, -8], [18, -12]]) shape(E(x + a, top + b, 5, 4), C.sunD, 0); } }
    const rx = 1090;
    shape(R(rx - 70, top - 110, 140, 16, 3), C.sun, 3);
    line([[rx - 60, top - 94], [rx - 60, top]], 6); line([[rx + 60, top - 94], [rx + 60, top]], 6);
    out(`<g transform="rotate(${f1(run ? -sp * 200 : 0)} ${rx} ${top - 44})">`);
    shape(E(rx, top - 44, 40), C.teal, 3); for (let a = 0; a < 6; a++) { const r = a * Math.PI / 3 + .4; line([[rx + Math.cos(r) * 14, top - 44 + Math.sin(r) * 14], [rx + Math.cos(r) * 34, top - 44 + Math.sin(r) * 34]], 2.6, C.tealD); }
    out('</g>');
    shape(E(rx, top - 44, 14), C.wallD, 2.4);
    fillOnly(R(rx - 6, top - 6, 130, 6), C.sunL); line([[rx - 6, top - 6], [rx + 124, top - 6]], 2.2);
    worker(1190, y + 10, { s: 1.15, cap: C.teal, back: [-150, -20], front: [-140 + 15 * Math.sin(sp * 5), -30] });
    shape(`M${rx - 40} ${top}Q${rx - 60} ${top - 8} ${rx - 80} ${top - 4}L${rx - 80} ${top}Z`, C.sunL, 2.2);
    const shift = run ? (sp * 70) % 44 : 0, reach = run ? 960 - sp * 260 : 99999;
    for (let x = 960; x > XL[2] + 30; x -= 44) { const xx = x - shift; if (xx > Math.max(XL[2] + 26, reach)) drop(xx, top, 11); }
  }
  // hoppers of the three outlet pipes (drawn at the line ends)
  LCOL().forEach(([c], i) => shape(`M${PX[i] - 30} ${LANES[i] - 36}H${PX[i] + 30}L${PX[i] + 16} ${LANES[i] - 4}H${PX[i] - 16}Z`, c === C.sun ? C.sunD : c === C.red ? C.redD : C.tealD, 2.6));
  // legend tags: flip down one by one with the narration (colour = destination)
  detail(.05, .09, () => {
    const tags = [['SUGAR', '糖', C.sun, 430], ['AMINO ACIDS', '氨基酸', C.red, 470], ['FATTY ACIDS', '脂肪酸', C.teal, 510]];
    tags.forEach(([en, zh, col, x], i) => {
      const p = t > 44 ? 1 : seg(t, L[i] + .25, L[i] + .75);
      if (p <= 0) return;
      const ty = LANES[i] - 112, s = backE(p, 2.2);
      out(`<g transform="translate(${x} ${ty}) scale(1 ${f1(clamp(s, 0, 1.2) * 100) / 100}) translate(${-x} ${-ty})">`);
      line([[x + 30, ty - 12], [x + 30, ty]], 2.4); line([[x + 140, ty - 12], [x + 140, ty]], 2.4);
      tag(x, ty, en, zh, col);
      out('</g>');
    });
    plaqueN(240, 262, 'SORTING LINE', '小肠', '4', t > K.n4 ? 1 : 0, pulse(t, K.n4, .35), 34);
  });
}

// ---------------- ⑥ Furnace room (muscle: mitochondria) ----------------
function furnaceRoom(t) {
  const fr = room(960, 880, 870, 560, C.red);
  const ig = K.ignite;
  const FL = fr.fl;
  detail(.05, .09, () => {
    lamp(1180, fr.y, 950); lamp(1640, fr.y, 950);
    // the artery arrives: a feed roller track joins at the top right, sugar cubes drop into the furnaces through three hoppers
    pipe([[1830, 990], [1790, 990], [1790, 1020]], 30, C.red, C.redL);
    belt2([1060, 1040], [1800, 1040], .7, -t * 6);
    for (const x of [1080, 1780]) line([[x, 1050], [x, 1100]], 4);
    const feed = t > 41.6 && t < 48;
    if (feed) for (let i = 0; i < 12; i++) { const p = ((t - 41.6) * .55 + i / 12) % 1; cube(lerp(1790, 1070, p), 1030, 20); }
    // three small furnaces (mitochondria): round plump body, one fold of inner membrane on the body, furnace door; the door glows on ignition
    for (let i = 0; i < 3; i++) {
      const x = 1110 + i * 250, y = FL, lit = ss(seg(t, ig[i], ig[i] + .25)), flick = .85 + .15 * Math.sin(t * 23 + i);
      const body = `M${x - 96} ${y}V${y - 190}Q${x - 96} ${y - 262} ${x} ${y - 262}Q${x + 96} ${y - 262} ${x + 96} ${y - 190}V${y}Z`;
      shadow(body, 12, 8, C.wallS);
      shape(body, C.red, 3);
      fillOnly(R(x - 80, y - 236, 14, 214, 7), C.redL);
      out(`<path d="M${x - 72} ${y - 168}q18 -28 36 0t36 0t36 0t36 0" fill="none" stroke="${C.redD}" stroke-width="${f1(3.4 * KS)}" stroke-linecap="round"/>`);
      // hopper on the furnace top (catches sugar cubes falling off the rollers)
      shape(`M${x - 30} ${y - 300}H${x + 30}L${x + 16} ${y - 262}H${x - 16}Z`, C.sunD, 2.6);
      line([[x, 1052], [x, y - 300]], 2.4, C.ink, 'opacity=".5"');
      if (feed && t > ig[i] - .3) { const p = ((t + i * .3) * 1.6) % 1; cube(x, lerp(1060, y - 270, p), 18); }
      // furnace door
      shape(R(x - 46, y - 112, 92, 82, 8), C.ink, 0);
      if (lit > .01) {
        fillOnly(R(x - 39, y - 105, 78, 68, 5), C.sun, `opacity="${f1(lit * flick)}"`);
        out(`<path d="M${x - 26} ${y - 38}Q${x - 20} ${y - 76} ${x} ${y - 92}Q${x + 6} ${y - 64} ${x + 14} ${y - 82}Q${x + 28} ${y - 56} ${x + 26} ${y - 38}Z" fill="${C.red}" opacity="${f1(lit)}"/>`);
        out(`<path d="M${x - 56} ${y - 24}L${x - 130} ${y + 12}H${x + 130}L${x + 56} ${y - 24}Z" fill="${C.sunL}" opacity="${f1(.32 * lit * flick)}"/>`);
        // ignition: a ring of short lines bursting outward
        const burst = pulse(t, ig[i], .35);
        if (burst > .02) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; line([[x + Math.cos(a) * (70 + 40 * burst), y - 70 + Math.sin(a) * (70 + 40 * burst)], [x + Math.cos(a) * (95 + 60 * burst), y - 70 + Math.sin(a) * (95 + 60 * burst)]], 4, C.sunD); }
      }
      // a small gauge per furnace: the needle jumps high after ignition
      gauge(x + 62, y - 150, 16, .1 + .75 * lit + .05 * Math.sin(t * 9 + i));
    }
    // worker: stands under the roller track and pulls the lever → ignition
    worker(1860 - 60, FL, { s: 1.25, flip: true, cap: C.red, back: [20, 0], front: [140 + 30 * pulse(t, ig[0] - .3, .5), -10] });
    // pistons: three connecting rods from under the furnaces down through the floor (the crankshaft that drives the knee)
    const stroke = t > ig[2] ? Math.sin((t - ig[2]) * 9) : 0;
    for (let i = 0; i < 3; i++) {
      const x = 1110 + i * 250, s = stroke * (i % 2 ? -1 : 1) * 22;
      gline([[x, FL + 22], [x, FL + 120 + s]], 14, C.ink); gline([[x, FL + 22], [x, FL + 120 + s]], 6, '#5A5E70');
    }
    plaqueN(1010, 854, 'FURNACES', '肌肉', '6', t > K.n6 ? 1 : 0, pulse(t, K.n6, .35), 32);
  });
}

// ======================================================================
//                                 Limbs
// ======================================================================
function limbPath(pts) { return 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L'); }
function limb(L, t) {
  const ws = Array.isArray(L.w) ? L.w : [L.w, L.w, L.w];
  // each segment drawn separately (different thicknesses), joined with round caps at the joints
  const segs = []; for (let i = 0; i < L.pts.length - 1; i++) segs.push([L.pts[i], L.pts[i + 1], ws[Math.min(i, ws.length - 1)]]);
  const st = (col, dw, extra = '') => segs.forEach(([a, b, w]) => out(`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${col}" stroke-width="${f1(w + dw)}" stroke-linecap="round" fill="none" ${extra}/>`));
  st(C.ink, 3.4 * KS);
  out(`<g${tr(C.blush)}>`); st(C.blush, -3.4 * KS); out('</g>');
  st(C.ink, -56); st(C.ground, -62);
  if (L.fist) { const [x, y] = L.fist; shape(E(x, y, 250), C.blush, 3.4); shape(E(x, y, 220), C.ground, 0); out(`<circle cx="${x}" cy="${y}" r="220" fill="none" stroke="${C.ink}" stroke-width="3"/>`); }
}
function limbInterior(name, t) {
  const L = LIMBS[name];
  if (name === 'legB' || name === 'legF') {
    // two pipes in the leg: artery (red) + vein (teal), running down to the foot
    const off = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [-dy / l * d, dx / l * d]; };
    const P = L.pts.slice(0, 3);
    const a = P.map((p, i) => { const o = off(P[Math.max(0, i - 1)], P[Math.min(2, Math.max(1, i))], 110); return [p[0] + o[0], p[1] + o[1]]; });
    const v = P.map((p, i) => { const o = off(P[Math.max(0, i - 1)], P[Math.min(2, Math.max(1, i))], -110); return [p[0] + o[0], p[1] + o[1]]; });
    pipe(null, 34, C.red, C.redL, { d: rpoly(a, 120) });
    pipe(null, 28, C.teal, C.tealL, { d: rpoly(v, 120) });
    // knee: crank wheel
    const [kx, ky] = L.pts[1];
    const ang = name === 'legB' && t > K.ignite[2] ? (t - K.ignite[2]) * 160 : 0;
    gear(kx, ky, 120, 14, ang, C.sun);
    if (name === 'legB') {
      // the three connecting rods from the furnace room, joined to the crankshaft
      const r = Math.PI / 180 * ang, px = kx + Math.cos(r) * 70, py = ky + Math.sin(r) * 70;
      for (let i = 0; i < 3; i++) {
        const sx = TOX + 1110 + i * 250, sy = TOY + 1420;
        gline([[sx, sy], [px + (i - 1) * 14, py]], 16, C.ink); gline([[sx, sy], [px + (i - 1) * 14, py]], 7, '#5A5E70');
      }
      out(`<circle cx="${f1(px)}" cy="${f1(py)}" r="16" fill="${C.red}" stroke="${C.ink}" stroke-width="${f1(3 * KS)}"/>`);
    }
  } else {
    const P = L.pts;
    pipe(null, 30, C.red, C.redL, { d: rpoly(P.map(p => [p[0] + 60, p[1]]), 100) });
    pipe(null, 24, C.teal, C.tealL, { d: rpoly(P.map(p => [p[0] - 60, p[1]]), 100) });
    gear(P[1][0], P[1][1], 90, 12, t * 20, C.sun);
  }
}

// ======================================================================
//                                 The whole body
// ======================================================================
function drawBody(t) {
  out(`<g transform="translate(${BX0} 0)">`);
  // flat drop shadow
  out(`<path d="${MAIN}" fill="${C.shade}" transform="translate(26 18)"/>`);
  const far = ZL < 1.6 || inView(0, 1300, 5000, 9000);
  if (far) {
    for (const n of ['armB', 'legB', 'legF', 'armF']) {
      const L = LIMBS[n]; const ws = Array.isArray(L.w) ? L.w : [L.w];
      out(`<path d="${limbPath(L.pts)}" stroke="${C.shade}" stroke-width="${Math.max(...ws)}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(26 18)"/>`);
    }
    for (const n of ['armB', 'legB', 'legF', 'armF']) { limb(LIMBS[n], t); limbInterior(n, t); }
  }
  fillOnly(MAIN, C.ground);
  out(`<clipPath id="mainclip"><path d="${MAIN}"/></clipPath>`);
  out(`<g clip-path="url(#mainclip)">`);
  // faint steel frame inside the body cavity
  for (const x of [1300, 1720, 2600]) out(`<path d="M${x} -400V4400" stroke="${C.groundL}" stroke-width="12"/>`);
  detail(.15, .3, () => { for (let y = 4000; y < 4300; y += 60) out(`<path d="M1000 ${y}H3100" stroke="${C.groundL}" stroke-width="2.4"/>`); });
  headInterior(t);
  chest(t);
  torso(t);
  out('</g>');
  // body wall: flesh-pink band + inner and outer ink lines; open at the mouth door
  out(`<mask id="wallm" maskUnits="userSpaceOnUse" x="-100" y="-1000" width="5000" height="10000"><rect x="-100" y="-1000" width="5000" height="10000" fill="#fff"/><path d="${R(DOOR[0], DOOR[1], DOOR[2], DOOR[3])}" fill="#000"/></mask>`);
  out(`<g clip-path="url(#mainclip)" mask="url(#wallm)">`);
  out(`<path d="${MAIN}" fill="none" stroke="${C.ink}" stroke-width="62"/>`);
  out(`<g${tr(C.blush)}><path d="${MAIN}" fill="none" stroke="${C.blush}" stroke-width="56"/></g>`);
  out(`<path d="${MAIN}" fill="none" stroke="${C.blushL}" stroke-width="10" transform="translate(5 -3)" opacity=".7"/>`);
  out(`</g>`);
  out(`<g mask="url(#wallm)"><path d="${MAIN}" fill="none" stroke="${C.ink}" stroke-width="${f1(3.4 * KS)}" stroke-linejoin="round"/></g>`);
  for (const y of [DOOR[1], DOOR[1] + DOOR[3]]) line([[988, y], [1021, y]], 3);
  // roller shutter of the mouth door: closed at the start, rolls up at 7.9 s
  const open = ss(seg(t, K.doorOpen, K.doorOpen + .5)) * (t < 44 ? 1 : 0);
  if (open < .99) {
    const h = (DOOR[3] - 6) * (1 - open);
    shape(R(DOOR[0] + 58, DOOR[1] + 3, 40, h), C.sunD, 2.4);
    detail(.3, .5, () => { for (let y = DOOR[1] + 3 + 12; y < DOOR[1] + 3 + h - 4; y += 14) line([[DOOR[0] + 60, y], [DOOR[0] + 96, y]], 1.8, C.ink, 'opacity=".6"'); });
  }
  // lower teeth in front of the conveyor (needed only while the conveyor enters the mouth in the first two shots)
  out('</g>');
}
