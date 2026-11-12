// The Night Climb — the animals, drawn as needle lines and dye in their own local units, mapped anywhere by F.
// F = { m(x, y) → [sx, sy], s: px per local unit }. Lanternfish: 1000 units nose to tail (head at +x, y down).
'use strict';
const MAPF = (cx, cy, s, ang = 0, flipY = 1) => {
  const c = Math.cos(ang), si = Math.sin(ang);
  return { s, m: (x, y) => { y *= flipY; return [cx + (x * c - y * si) * s, cy + (x * si + y * c) * s]; } };
};
const polyLen = P => { let l = 0; for (let i = 1; i < P.length; i++) l += Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); return l; };
// first fraction u of a polyline (by length) and its end point
function partial(P, u){
  if (u >= 1) return P.slice();
  const L = polyLen(P) * Math.max(0, u), out = [P[0]]; let acc = 0;
  for (let i = 1; i < P.length; i++){
    const d = Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]);
    if (acc + d >= L){ const k = (L - acc) / (d || 1); out.push([lerp(P[i-1][0], P[i][0], k), lerp(P[i-1][1], P[i][1], k)]); return out; }
    out.push(P[i]); acc += d;
  }
  return out;
}
const ringPts = (cx, cy, rx, ry, n = 28, a0 = 0, a1 = 6.2832) => { const P = []; for (let i = 0; i <= n; i++){ const a = lerp(a0, a1, i / n); P.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return P; };

// ---------------- the lanternfish, side view ----------------
const F_TOP = [[500,4],[488,-40],[440,-82],[370,-112],[260,-128],[120,-124],[-40,-104],[-200,-70],[-320,-42],[-350,-38]];
const F_BOT = [[500,4],[492,30],[455,62],[380,98],[260,118],[120,120],[-40,102],[-200,66],[-320,40],[-350,36]];
const F_TAIL = [[-350,-38],[-420,-82],[-505,-128],[-478,-48],[-445,0],[-478,48],[-505,128],[-420,82],[-350,36]];
const F_OUT = F_TOP.concat(F_TAIL.slice(1), F_BOT.slice().reverse().slice(1));
const F_EYE = [388, -30], F_EYER = 54;
const FINS = {
  dorsal: [[110,-124],[60,-212],[-10,-214],[-90,-100]],
  adipose: [[-245,-62],[-262,-96],[-298,-90],[-312,-50]],
  anal: [[-50,102],[-110,176],[-220,150],[-262,58]],
  pect: [[300,46],[205,118],[150,126],[262,64]],
  pelv: [[90,120],[52,186],[18,178],[34,118]],
};
// photophores: 12 along the belly, a little inside the lower edge, head → tail
const PHOTO = (() => { const P = [], B = F_BOT; for (let i = 0; i < 12; i++){ const u = .16 + i / 11 * .78; const q = partial(B, u); const e = q[q.length - 1]; P.push([e[0], e[1] - 24 - 6 * Math.sin(i)]); } return P; })();
function fishBend(st){
  const A = st.bend ?? 0, ph = st.ph ?? 0;
  return p => { const x = p[0], y = p[1]; if (x > -40) return p; const k = Math.pow((-x - 40) / 470, 2); return [x + (st.sq || 0) * 0, y + A * k * Math.sin(ph - (-x) / 260)]; };
}
// the order the needle cuts the fish in (scratch-in): each [points, width, kind]
function fishStrokes(){
  return [
    [ringPts(F_EYE[0], F_EYE[1], F_EYER, F_EYER, 30, -1.2, 5.08), 8, 'eye'],
    [F_OUT, 9, 'out'],
    [[[322,-104],[300,-50],[298,10],[318,84]], 6, 'gill'],
    [[[498,20],[452,38],[404,34]], 6, 'mouth'],
    [FINS.dorsal, 6, 'fin'], [FINS.pect, 6, 'fin'], [FINS.pelv, 5, 'fin'], [FINS.anal, 6, 'fin'], [FINS.adipose, 5, 'fin'],
  ];
}
const FSTR = fishStrokes(), FSTR_L = FSTR.map(s => polyLen(s[0])), FSTR_TOT = FSTR_L.reduce((a, b) => a + b, 0);
// st: { ph, bend, mouth 0..1, draw 0..1 (scratch-in progress), dye 0..1, rings 0..1, light: [12 × 0..1], blink, dim }
// returns the needle tip (screen) while being cut, else null
function drawFish(F, st, o = {}){
  const bend = fishBend(st), s = F.s;
  const M = P => P.map(p => F.m(...bend(p)));
  const lw = u => Math.max(.8, u * s);
  const prog = st.draw ?? 1;
  let tip = null;
  const mo = st.mouth || 0;
  // body dye: teal hatching, swept in from the head
  if ((st.dye ?? 1) > 0){
    const sw = lerp(560, -560, st.dye ?? 1);
    G.save();
    const clipP = M([[sw, -320], [620, -320], [620, 320], [sw, 320]]);
    G.beginPath(); clipP.forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.closePath(); G.clip();
    const tiny = s * 1000 < 60;
    if (tiny) fillPoly(M(F_OUT), TEAL, .75);
    else {
      hatch(M(F_OUT), TEAL, { gap: clamp(s * 16, 2, 14), a: .8 * (o.dyeA ?? 1), ang: .9, lw: [Math.max(.8, s * 5), Math.max(1.2, s * 13)], passes: 2 });
      // darker back: a second, sparser pass of blue along the top half
      hatch(M([[480,-30],[400,-100],[200,-128],[-200,-70],[-340,-40],[-340,0],[0,-30],[300,-20]]), BLUE, { gap: clamp(s * 22, 2, 18), a: .45 * (o.dyeA ?? 1), ang: -.5, lw: [Math.max(.8, s * 4), Math.max(1, s * 9)], passes: 1 });
      Object.values(FINS).forEach(P => hatch(M(P), TEAL, { gap: clamp(s * 14, 2, 12), a: .45 * (o.dyeA ?? 1), ang: -.3, lw: [Math.max(.6, s * 3), Math.max(1, s * 7)], passes: 1 }));
    }
    G.restore();
  }
  // needle lines in cutting order
  let acc = 0;
  for (let k = 0; k < FSTR.length; k++){
    const [P, w, kind] = FSTR[k], L = FSTR_L[k];
    const u = clamp((prog * FSTR_TOT - acc) / L, 0, 1); acc += L;
    if (u <= 0) break;
    let Q = P;
    if (kind === 'mouth' && mo > 0) Q = [[498, 20 + 40 * mo], [452, 38 + 20 * mo], [404, 34]];
    const part = u < 1 ? partial(Q, u) : Q;
    const S = M(part);
    scratch(S, { w: lw(w) * (o.wk ?? 1), tail: false, a: o.lineA ?? 1 });
    if (u < 1) tip = S[S.length - 1];
    if (kind === 'fin' && u >= 1){ // fin rays
      const b0 = P[0], b1 = P[P.length - 1];
      for (let r = 1; r < 5; r++){ const f = r / 5, base = [lerp(b0[0], b1[0], f), lerp(b0[1], b1[1], f)]; const tipq = partial(P, f); const e = tipq[tipq.length - 1]; scratch(M([base, [lerp(base[0], e[0], .85), lerp(base[1], e[1], .85)]]), { w: lw(2.5), tail: false, passes: 1, a: .6 * (o.lineA ?? 1) }); }
    }
  }
  const done = prog >= 1;
  // eye: iris dye, pupil, glint
  if (prog > .02){
    const eA = clamp(prog * 8, 0, 1), bl = st.blink || 0;
    const ring = M(ringPts(F_EYE[0], F_EYE[1], F_EYER * .8, F_EYER * .8 * (1 - .9 * bl), 22));
    if (s * F_EYER > 4) hatch(ring, YEL, { gap: clamp(s * 6, 1.5, 6), a: .35 * eA, ang: .4, lw: [Math.max(.6, s * 2), Math.max(.8, s * 4)], passes: 1 });
    const pc = F.m(...bend([F_EYE[0] + 8, F_EYE[1] + 2]));
    disc(pc[0], pc[1], Math.max(.8, 26 * s * (1 - .9 * bl)), INK, .95 * eA);
    disc(pc[0] + 9 * s, pc[1] - 9 * s, Math.max(.6, 8 * s * (1 - bl)), CREAM, .95 * eA);
  }
  // lateral line: a dotted row of small cuts
  if (done && s * 1000 > 120){ for (let i = 0; i < 16; i++){ const x = lerp(290, -320, i / 15), y = lerp(-36, -2, i / 15) + 6 * Math.sin(i * 1.3); const S = M([[x, y], [x - 16, y + 1]]); scratch(S, { w: lw(3), tail: false, passes: 1, a: .55 }); } }
  // photophores: cut as rings, then lit one by one (blue dye + cream core + light thrown downward)
  const rings = st.rings ?? (done ? 1 : 0);
  PHOTO.forEach((p, i) => {
    const r0 = clamp(rings * 12 - i, 0, 1); if (r0 <= 0) return;
    const L = st.light ? st.light[i] : 0;
    const c = F.m(...bend(p)), R = Math.max(1, 15 * s);
    if (L > 0){
      glow(c[0], c[1], R * (4 + 5 * L), 'rgba(47,134,255,1)', .55 * L);
      disc(c[0], c[1], R * 1.15, BLUE, .9 * Math.min(1, L * 1.4));
      disc(c[0], c[1], R * .55, CREAM, Math.min(1, L * 1.6));
      if (o.rays && L > .2){ // the light points down
        for (let j = -1; j <= 1; j++){ const a = Math.PI / 2 + j * .22 + (st.ang || 0); const l = R * (6 + 6 * L); dye([[c[0], c[1] + R], [c[0] + Math.cos(a) * l, c[1] + R + Math.sin(a) * l]], { w: R * 1.2, col: BLUE, n: 4, a: .5 * L }); }
      }
    }
    if (s * 15 > 2) scratch(ringPts(c[0], c[1], R, R, 12).slice(0, Math.max(2, Math.round(13 * r0))), { w: Math.max(.8, 3.5 * s), tail: false, passes: 1, a: .85 });
  });
  return tip;
}
const fishPhotoScreen = (F, st, i) => F.m(...fishBend(st)(PHOTO[i]));

// ---------------- the lanternfish seen from below (ventral silhouette) ----------------
function ventralHalf(){ // half-width along the body, from snout (x 500) to tail (−500)
  const xs = [500, 470, 420, 340, 250, 120, -40, -200, -330, -360, -430, -500];
  const ws = [0, 34, 62, 80, 86, 84, 72, 46, 20, 16, 10, 6];
  return xs.map((x, i) => [x, ws[i]]);
}
const VH = ventralHalf();
function ventralOutline(ph, A){
  const off = x => x > -40 ? 0 : A * Math.pow((-x - 40) / 470, 2) * Math.sin(ph - (-x) / 260);
  const up = VH.map(([x, w]) => [x, -w + off(x)]), dn = VH.map(([x, w]) => [x, w + off(x)]).reverse();
  return { body: up.concat(dn), off };
}
// cover: 12 segments (head → tail) each 0..1 lit (1 = matched to the glow: the shadow is gone there)
function drawSilhouette(F, st){
  const { body, off } = ventralOutline(st.ph || 0, st.bend ?? 40);
  const fins = [[[300, -80], [200, -210], [140, -200], [220, -84]], [[300, 80], [200, 210], [140, 200], [220, 84]]];
  const tail = [[-430, off(-430)], [-520, -6 + off(-520)], [-520, 6 + off(-520)]];
  const S = body.map(p => F.m(...p));
  const cover = st.cover || [];
  // the dark shape, segment by segment
  G.save(); G.beginPath(); S.forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.closePath();
  fins.forEach(P => { const Q = P.map(p => F.m(...p)); Q.forEach((q, i) => i ? G.lineTo(q[0], q[1]) : G.moveTo(q[0], q[1])); G.closePath(); });
  G.clip();
  for (let k = 0; k < 12; k++){
    const x0 = lerp(560, -560, k / 12), x1 = lerp(560, -560, (k + 1) / 12) - 4;
    const a = 1 - clamp(cover[k] || 0, 0, 1);
    if (a <= .01) continue;
    fillPoly([F.m(x0, -260), F.m(x1, -260), F.m(x1, 260), F.m(x0, 260)], '#040303', a * (st.dark ?? 1));
  }
  G.restore();
  // rim of light around the edge (backlit), fading as it is matched
  const rimA = (st.rim ?? 1);
  if (rimA > .02){
    scratch(S.concat([S[0]]), { w: Math.max(1, 4 * F.s), tail: false, a: .55 * rimA, passes: 2 });
    fins.forEach(P => scratch(P.map(p => F.m(...p)), { w: Math.max(1, 3 * F.s), tail: false, a: .45 * rimA, passes: 1 }));
    scratch(tail.map(p => F.m(...p)), { w: Math.max(1, 3 * F.s), tail: false, a: .4 * rimA, passes: 1 });
  }
  // two rows of belly lights, as seen from below
  const L = st.light || [];
  for (let i = 0; i < 12; i++){
    const x = lerp(380, -300, i / 11), lv = L[i] || 0;
    if (lv <= 0) continue;
    for (const sd of [-1, 1]){
      const c = F.m(x, sd * (VH[Math.min(11, 2 + (i * 6 / 11 | 0))][1] * .45) + off(x));
      glow(c[0], c[1], 40 * F.s * (1 + lv), 'rgba(47,134,255,1)', .35 * lv * (st.dotA ?? 1));
      disc(c[0], c[1], Math.max(1, 10 * F.s), BLUE, .9 * lv * (st.dotA ?? 1));
      disc(c[0], c[1], Math.max(.7, 4.5 * F.s), CREAM, .9 * lv * (st.dotA ?? 1));
    }
  }
}

// ---------------- the hunter (a deep-sea dragonfish-like predator), side view, head at +x ----------------
const P_TOP = [[-1300,-26],[-1000,-44],[-700,-70],[-400,-96],[-140,-112],[40,-108],[170,-80],[290,-46]];
const P_UJAW = [[290,-46],[200,-22],[110,-8],[40,4]];
const P_BOT = [[40,70],[-120,96],[-420,86],[-760,56],[-1060,34],[-1300,22]];
const P_HINGE = [40, 6];
function predJaw(open){ // lower jaw rotated about the hinge
  const base = [[40,6],[150,18],[300,16],[312,30],[180,62],[40,70]];
  const a = .7 * open, c = Math.cos(a), s = Math.sin(a);
  return base.map(([x, y]) => { const dx = x - P_HINGE[0], dy = y - P_HINGE[1]; return [P_HINGE[0] + dx * c - dy * s, P_HINGE[1] + dx * s + dy * c]; });
}
function drawPredator(F, st){
  const s = F.s, M = P => P.map(p => F.m(...p)), lw = u => Math.max(.8, u * s);
  const jaw = predJaw(st.jaw || 0);
  const body = P_TOP.concat(P_UJAW.slice(1), [[40, 30]], P_BOT);
  // body dye: deep red hatching, darker toward the tail
  hatch(M(body), RED, { gap: clamp(s * 18, 2, 16), a: .62, ang: .5, lw: [Math.max(.8, s * 5), Math.max(1.2, s * 12)], passes: 2 });
  hatch(M(jaw), RED, { gap: clamp(s * 14, 2, 12), a: .55, ang: -.4, lw: [Math.max(.8, s * 4), Math.max(1, s * 9)], passes: 1 });
  // mouth inside: black
  if ((st.jaw || 0) > .05) fillPoly(M([[40, 6], [290, -40], ...jaw.slice(1, 3)]), '#070303', .95);
  // outline
  scratch(M(P_TOP.concat(P_UJAW.slice(1))), { w: lw(10), tail: false });
  scratch(M(jaw), { w: lw(9), tail: false });
  scratch(M(P_BOT), { w: lw(9), tail: false });
  scratch(M([[-1300, -26], [-1420, -110], [-1390, 0], [-1420, 110], [-1300, 22]]), { w: lw(8), tail: false });
  // fangs: upper jaw down, lower jaw up
  const rq = rng(77);
  for (let i = 0; i < 7; i++){ const u = .1 + i / 7 * .85, q = partial(P_UJAW, u); const b = q[q.length - 1]; const L = 30 + rq() * 55; scratch(M([b, [b[0] - 8, b[1] + L]]), { w: lw(6), tail: false, passes: 2 }); }
  for (let i = 0; i < 6; i++){ const u = .15 + i / 6 * .8, q = partial(jaw.slice(0, 3), u); const b = q[q.length - 1]; const L = 30 + rq() * 60; const a = .7 * (st.jaw || 0) - Math.PI / 2; scratch(M([b, [b[0] + Math.cos(a) * L * .3 + 6, b[1] + Math.sin(a) * L]]), { w: lw(6), tail: false, passes: 2 }); }
  // eye and the red light under it
  const e = F.m(110, -60), er = 30 * s;
  hatch(ringPts(e[0], e[1], er, er, 20), RED, { gap: clamp(s * 5, 1.5, 5), a: .8, lw: [Math.max(.6, s * 2), Math.max(.8, s * 4)], passes: 1 });
  scratch(ringPts(e[0], e[1], er, er, 22), { w: lw(6), tail: false });
  disc(e[0] + 6 * s, e[1] + 2 * s, Math.max(1, 11 * s), CREAM, .9 + .1 * (st.eye || 0));
  const c = F.m(190, -16);
  glow(c[0], c[1], 160 * s * (1 + (st.eye || 0)), 'rgba(255,50,32,1)', .35 + .35 * (st.eye || 0));
  hatch(ringPts(c[0], c[1], 34 * s, 20 * s, 16), RED, { gap: clamp(s * 5, 1.5, 5), a: .95, lw: [Math.max(.6, s * 2), Math.max(.8, s * 4)], passes: 2 });
  scratch(ringPts(c[0], c[1], 34 * s, 20 * s, 18), { w: lw(5), tail: false, passes: 1 });
  // gill and fin
  scratch(M([[-20, -100], [-50, -30], [-40, 50], [-10, 80]]), { w: lw(6), tail: false, passes: 1 });
  scratch(M([[-60, 40], [-200, 150], [-260, 140], [-120, 60]]), { w: lw(5), tail: false, passes: 1 });
  // the chin barbel with its lure
  const bt = st.t || 0;
  const bar = []; for (let i = 0; i <= 12; i++){ const u = i / 12; bar.push([60 - 420 * u, 70 + 300 * u + 40 * Math.sin(u * 4 + bt * 2)]); }
  scratch(M(bar), { w: lw(3), tail: false, passes: 1, a: .8 });
  const lb = F.m(...bar[12]); glow(lb[0], lb[1], 70 * s, 'rgba(255,244,220,1)', .5); disc(lb[0], lb[1], Math.max(1.2, 12 * s), CREAM, .95);
}

// ---------------- small things ----------------
function drawCopepod(F, o = {}){
  const s = F.s, M = P => P.map(p => F.m(...p));
  const body = [[50,0],[34,-17],[-6,-20],[-38,-12],[-52,0],[-38,12],[-6,20],[34,17]];
  if (s * 100 < 6){ const c = F.m(0, 0); disc(c[0], c[1], Math.max(1, 30 * s), GREEN, .8 * (o.a ?? 1)); return; }
  hatch(M(body), GREEN, { gap: clamp(s * 9, 1.5, 6), a: .85 * (o.a ?? 1), lw: [Math.max(.6, s * 3), Math.max(.8, s * 6)], passes: 1 });
  scratch(M(body.concat([body[0]])), { w: Math.max(.8, 4 * s), tail: false, passes: 1, a: o.a ?? 1 });
  const fl = o.flick || 0;
  scratch(M([[40,-8],[10,-60 - 10 * fl],[-50,-110]]), { w: Math.max(.6, 2.5 * s), tail: false, passes: 1, a: .8 * (o.a ?? 1) });
  scratch(M([[40,8],[10,60 + 10 * fl],[-50,110]]), { w: Math.max(.6, 2.5 * s), tail: false, passes: 1, a: .8 * (o.a ?? 1) });
  scratch(M([[-50,0],[-90,-14]]), { w: Math.max(.6, 2 * s), tail: false, passes: 1, a: .7 * (o.a ?? 1) });
  scratch(M([[-50,0],[-90,14]]), { w: Math.max(.6, 2 * s), tail: false, passes: 1, a: .7 * (o.a ?? 1) });
  const e = F.m(36, 0); disc(e[0], e[1], Math.max(.8, 5 * s), RED, .9 * (o.a ?? 1));
}
function drawJelly(F, t, col = TEAL){
  const s = F.s, M = P => P.map(p => F.m(...p));
  const pulse = .5 + .5 * Math.sin(t * 2.4);
  const rx = 100 * (1 + .08 * pulse), ry = 70 * (1 - .1 * pulse);
  const bell = ringPts(0, 0, rx, ry, 24, Math.PI, Math.PI * 2).concat([[rx, 8], [-rx, 8]]);
  hatch(M(bell), col, { gap: clamp(s * 10, 2, 8), a: .55, lw: [Math.max(.6, s * 3), Math.max(.8, s * 7)], passes: 1 });
  scratch(M(ringPts(0, 0, rx, ry, 24, Math.PI, Math.PI * 2)), { w: Math.max(.8, 5 * s), tail: false });
  scratch(M([[-rx, 4], [rx, 4]]), { w: Math.max(.8, 4 * s), tail: false, passes: 1 });
  for (let k = 0; k < 6; k++){ const x0 = lerp(-rx * .8, rx * .8, k / 5); const P = []; for (let i = 0; i <= 10; i++){ const u = i / 10; P.push([x0 + 18 * Math.sin(u * 5 + t * 2 + k), 8 + u * (220 + 40 * (k % 3))]); } scratch(M(P), { w: Math.max(.6, 2.5 * s), tail: false, passes: 1, a: .7 }); }
}
