// Whole-film timeline: performance, camera, subtitles, sound events. All times come from story.js
import { g, gMain, C, S, W, H, clear, piece, rough, roughC, rectP, circP, label, setG, silhouette } from './paper.js';
import { layout, drawLine } from './glyph.js';
import { agentSide, agentFront, courierSide, key, keyholeP, runPose, walkPose, coRunPose, AGENT_POSE, COURIER_POSE } from './chars.js';
import { drawTitle, drawGlyph, CUT_ANG } from './title.js';
import * as SC from './scenes.js';
import { cam, CAM, DIR, NRM, KH_SCREEN, RW } from './scenes.js';
import { subStrip } from './frames.js';
import { B, BEAT, BAR, DUR, HIT, T } from './story.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '/core/lib.js';

export { DUR };
const tw = t => Math.floor(t * 12 + 1e-6) / 12;       // on twos
const mix = (a, b, u) => a + (b - a) * u;
const blendPose = (a, b, u) => { const o = { ...a }; for (const k in b) if (typeof b[k] === 'number' && typeof a[k] === 'number') o[k] = mix(a[k], b[k], u); else if (u > .5) o[k] = b[k]; return o; };
const STEP = BEAT * 2;   // one run cycle = 2 beats (1 beat per step)

// ── narration subtitles ──
let LINES = [], DURS = {};
export function setLines(l, d) { LINES = l; DURS = d; }
export function subs() {
  return LINES.map(L => { const d = DURS[L.id]; return { t0: L.t, t1: L.t + Math.max(1.8, d + .6), text: L.text, id: L.id }; });
}
const DARK_SUB = { l2: true, l6: true };   // scenes with a paper-white ground use an ink-black strip
function drawSubs(t) {
  for (const s of subs()) {
    if (t < s.t0 || t >= s.t1) continue;
    const u = eo(seg(t, s.t0, s.t0 + .18));
    subStrip(s.text, { dark: DARK_SUB[s.id], dx: (1 - u) * -60, a: u });
  }
}

// ═══════════════ Scenes ═══════════════
function sOpen(t) {
  // 0 – split: red keyhole on black (cut open = grows out of a single slit)
  const u = tw(t);
  const grow = back(seg(u, .08, .5), 1.3);
  clear(C.ink); cam();
  const k = KH_SCREEN.h / 154;
  g.save(); g.translate(KH_SCREEN.x, KH_SCREEN.y); g.scale(k * Math.max(.02, grow), k);
  piece(roughC('khT', () => keyholeP(1), 301, .7, 6), C.red, { gap: 0, shadow: false });
  g.restore();
}
function drawGridScene(t) {
  const u = clamp((t - HIT.split) / (BEAT * 2.2));
  SC.gridField(u);
  // A LEMOLAB PICTURE slides in along family-B lines, landing on the beats
  const words = [['A', 120, -3, 430], ['LEMOLAB', 230, -1, 560], ['PICTURE', 230, 1, 800]];
  words.forEach(([w, size, j, x], i) => {
    const tl = T.words[i], p = eo(seg(t, tl - .22, tl));
    if (t < tl - .22) return;
    const L = layout(w, size, { track: .06 });
    const x1 = x + (1 - p) * 1400, y1 = SC.gridBY(j, x1 + L.width / 2) + 8 + size * .37;
    drawLine(L, x1, y1, { col: C.paper, seed: 80 + i * 7, jit: .8, amp: 1.4, shA: .4 });
  });
}
function sSplit(t) {
  // split: black frame + keyhole splits in two along the 30° cut line, the halves fly off to either side along the normal, revealing the red grid
  drawGridScene(t);
  const u = ei(seg(t, HIT.split, HIT.split + .32));
  if (u >= 1) return;
  const k = KH_SCREEN.h / 154, cx = KH_SCREEN.x, cy = KH_SCREEN.y + 40, big = 3000;
  for (const sd of [-1, 1]) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.translate(NRM[0] * sd * u * 1300, NRM[1] * sd * u * 1300);
    g.beginPath();
    g.moveTo(cx - DIR[0] * big, cy - DIR[1] * big); g.lineTo(cx + DIR[0] * big, cy + DIR[1] * big);
    g.lineTo(cx + DIR[0] * big + NRM[0] * big * sd, cy + DIR[1] * big + NRM[1] * big * sd); g.lineTo(cx - DIR[0] * big + NRM[0] * big * sd, cy - DIR[1] * big + NRM[1] * big * sd);
    g.closePath(); g.clip();
    g.fillStyle = C.ink; g.fillRect(-2000, -2000, 6000, 6000);
    g.translate(KH_SCREEN.x, KH_SCREEN.y); g.scale(k, k);
    piece(roughC('khT', () => keyholeP(1), 301, .7, 6), C.red, { gap: 0, shadow: false });
    g.restore();
  }
}
function sVelvet(t) {
  // blinds flip open (from T.blinds) → velvet key → glove snatches it at HIT.snatch → courier trench-coat wipe at T.wipe
  const u = tw(t);
  const snatched = u >= HIT.snatch;
  cam();
  SC.velvet({ key: !snatched, dent: snatched });
  // glove: enters from upper right along the diagonal
  const gin = eo(seg(u, HIT.snatch - .3, HIT.snatch)), gout = ei(seg(u, HIT.snatch + .12, HIT.snatch + .45));
  if (gin > 0 && gout < 1) {
    const d = (1 - gin) * 1100 + gout * 1300;
    const hx = 940 + DIR[0] * d + 40, hy = 600 + DIR[1] * d;
    glove(hx, hy, 3.4, CUT_ANG + Math.PI, snatched);
  }
  // blinds: the grid scene flips away in vertical strips
  if (t < T.blinds + .5) {
    const n = 12, sw = W / n;
    for (let i = 0; i < n; i++) {
      const p = ss(seg(t, T.blinds + i * .025, T.blinds + i * .025 + .22));
      if (p >= 1) continue;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(i * sw, 0, sw + 1, H); g.clip();
      g.translate(i * sw + sw / 2, 0); g.scale(1 - p, 1); g.translate(-(i * sw + sw / 2), 0);
      drawGridScene(t);
      g.restore();
    }
  }
}
function glove(x, y, s, rot, fist) {
  // black glove + sleeve (courier)
  import_sil(() => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    piece(rough([[-26, -400], [26, -400], [22, -10], [-22, -10]], 1300, 1.2, 10), C.ink);
    if (!fist) piece([[-20, -14], [22, -14], [26, 22], [16, 60], [8, 30], [2, 64], [-6, 30], [-14, 58], [-18, 26], [-30, 34], [-24, 4]], C.ink);
    else { piece(rough([[-22, -14], [22, -14], [26, 26], [-24, 30]], 1301, 1, 8), C.ink); g.save(); g.translate(0, 30); g.rotate(.2); key(0, 0, .9, 0); g.restore(); }
    g.restore();
  });
}
const import_sil = (fn) => silhouette(fn);

function sIntro(t) {
  const u = tw(t);
  cam(); SC.introSet();
  if (u < T.agentIn) return;
  let x, pose;
  if (u < T.skid) { const p = seg(u, T.agentIn, T.skid); x = mix(-250, 880, p); pose = runPose(((u - T.agentIn) / STEP * 1.5) % 1); }
  else if (u < T.lookBack) { const p = eo(seg(u, T.skid, T.lookBack)); x = mix(880, 990, p); pose = AGENT_POSE.skid; }
  else if (u < T.toCam) { x = 990; pose = AGENT_POSE.overShoulder; }
  else if (u < T.dash) { agentFront(990, 880, 1.0); return; }
  else { const p = ei(seg(u, T.dash, T.dash + .4)); x = mix(990, 2300, p); pose = runPose(((u - T.dash) / STEP * 1.5) % 1); }
  agentSide(x, 880, 1.0, pose);
}

// ── airport ──
function airCam(t) {
  const lay = SC.airLayout(), Ix = SC.airIx();
  const wide = { cx: lay.width / 2 + 60, cy: 560, s: 1920 / (lay.width + 260) };
  const close = { cx: Ix + 150, cy: 540, s: 1 };
  if (t < T.pushIn) return wide;
  if (t < T.hide) { const p = eio(seg(t, T.pushIn, T.hide - .05)); return { cx: mix(wide.cx, close.cx, p), cy: mix(wide.cy, close.cy, p), s: mix(wide.s, close.s, p) }; }
  if (t < T.walkOn + .2) return close;
  // follow the courier to the right
  const cx = Math.max(close.cx, courierAirX(t) - 250);
  return { cx: close.cx + (cx - close.cx) * ss(seg(t, T.walkOn + .2, T.walkOn + .9)), cy: 540, s: 1 };
}
const CO_V = 250;
function courierAirX(t) {
  const stop = SC.airIx() + 220;
  if (t < T.hide) return stop - CO_V * (T.hide - t);
  if (t < T.walkOn) return stop;
  return stop + CO_V * 1.15 * (t - T.walkOn);
}
function agentAirX(t) {
  const Ix = SC.airIx();
  if (t < T.hide) return Ix - 190 - 170 * (T.hide - t);
  if (t < T.walkOn + .25) return Ix + 36;
  return Ix + 36 + 260 * (t - T.walkOn - .25);
}
function sneak(p) { const r = runPose(p, { lean: .14, tie: .25 }); return blendPose(AGENT_POSE.stand, r, .45); }
function sAirport(t) {
  const u = tw(t), c = airCam(t);
  cam(c.cx, c.cy, c.s);
  const hiding = u >= T.hide && u < T.walkOn + .25;
  const cx = courierAirX(u), ax = agentAirX(u);
  const coPose = u < T.hide ? walkPose(((u - T.airport) / STEP) % 1) : u < T.unhide ? { ...COURIER_POSE.lookBack, key: .35 + .12 * Math.sin(u * 9) * Math.exp(-(u - T.hide) * 3) } : u < T.walkOn ? { ...COURIER_POSE.stand, key: .1 } : walkPose(((u - T.walkOn) / STEP) % 1);
  SC.airport({
    plane: () => {
      if (u < T.planeUp - .1) return;
      const p = seg(u, T.planeUp, T.train);
      const x0 = SC.airIx() + 200, px = x0 + p * 2300, py = 150 - p * 700 * p - p * 150;
      // contrail (long paper-white strip)
      piece(rough([[x0 - 400, 330], [px - 90, py + 6], [px - 90, py + 18], [x0 - 400, 346]], 1400, 1, 30), C.paper, { gap: 0, shadow: false });
      SC.plane(px, py, 1.6, -.22 - p * .1);
    },
    behindI: (Ix) => { if (hiding) agentSide(Ix + 36, SC.AIR.floor + 2, .86, { ...AGENT_POSE.flatten, tph: u * 7 }); },
    front: () => {
      if (!hiding) {
        const pose = u < T.hide ? sneak(((u - T.airport) / STEP) % 1) : sneak(((u - T.walkOn) / STEP) % 1);
        agentSide(ax, SC.AIR.floor + 2, .86, { ...pose, tph: u * 7 });
      }
      courierSide(cx, SC.AIR.floor + 26, .8, coPose);
    },
  });
}

// ── train ──
function trainCars() { return SC.trainLayout().cars; }
function warp(t) { return t < HIT.freeze ? t : t < T.resume ? HIT.freeze : t - (T.resume - HIT.freeze); }   // stop-time
function agentTrain(te) {
  const cars = trainCars(), top = SC.trainLayout().top;
  const j = [  // [take-off, landing, start x, landing x]
    [T.jump1 - .34, T.jump1, cars[0].x1 - 30, cars[1].x + 40],
    [T.jump2 - .34, T.jump2, cars[1].x1 - 20, cars[2].x + 40],
    [T.jump3, warp(T.land3), cars[2].x1 - 30, cars[3].x + 60],
  ];
  const runs = [[T.train, j[0][0], cars[0].x + 120, j[0][2]], [j[0][1], j[1][0], j[0][3], j[1][2]], [j[1][1], j[2][0], j[1][3], j[2][2]], [j[2][1], 99, j[2][3], j[2][3] + 900]];
  for (const [a, b, x0, x1] of runs) if (te >= a && te < b) { const p = (te - a) / (b - a); return { x: b > 50 ? x0 + (te - a) * 380 : mix(x0, x1, p), y: top, pose: runPose(((te - T.train) / STEP * 1.4) % 1) }; }
  for (const [a, b, x0, x1] of j) if (te >= a && te < b) { const p = (te - a) / (b - a); return { x: mix(x0, x1, p), y: top - Math.sin(p * Math.PI) * 150, pose: AGENT_POSE.leap }; }
  return { x: cars[0].x + 120, y: top, pose: runPose(0) };
}
function sTrain(t) {
  const u = tw(t), te = warp(u), tc = warp(t);
  const cars = trainCars(), L = SC.trainLayout();
  const a = agentTrain(te);
  // camera: wide first so the full credit line can be read, then push in on the agent and track him
  const wide = { cx: L.len / 2 + 120, cy: 560, s: .6 };
  const a2 = agentTrain(tc);
  const follow = { cx: a2.x + 260, cy: 520, s: .95 };
  const p = eio(seg(tc, T.zoomTrain, T.zoomTrain + .75));
  cam(mix(wide.cx, follow.cx, p), mix(wide.cy, follow.cy, p), mix(wide.s, follow.s, p));
  SC.train({
    t: te,
    front: () => {
      const cx = cars[3].x1 - 190, top = L.top;
      const look = u >= HIT.freeze && u < T.resume;
      courierSide(cx, top, .62, look ? { ...COURIER_POSE.lookBack, key: .5 } : { ...COURIER_POSE.stand, key: Math.sin(te * 6) * .25 - .1, flare: .1 + .05 * Math.sin(te * 20) });
      agentSide(a.x, a.y, .62, { ...a.pose, tph: te * 9 });
    },
  });
}
function sCasino(t) {
  const u = tw(t);
  const d = t - HIT.roulette;
  cam(960 + d * 4, 540, 1 + d * .02);
  const spin = d * 2.4, ball = -d * 7.5 + Math.PI * .3, ballR = .86 - .2 * ss(seg(d, 1.6, 2.6));
  SC.casino({
    spin, ball, ballR,
    front: () => {
      // the courier's glove puts the key down as a bet on one square
      const kIn = eo(seg(u, T.keyBet - .35, T.keyBet)), kOut = ei(seg(u, T.keyBet + .25, T.keyBet + .6));
      const kx = 1180, ky = 880;
      if (u >= T.keyBet) key(kx, ky, 1.2, .4);
      if (kIn > 0 && kOut < 1) glove(kx + 20, ky - 60 - (1 - kIn) * 700 - kOut * 800, 2.2, Math.PI, u < T.keyBet);
      // the agent's hand reaches in from frame left
      const ah = eo(seg(u, T.keyBet + .45, HIT.pupil - .05));
      if (ah > 0) agentHand(-300 + ah * 1200, 900, 2.4, -Math.PI / 2 - .12);
    },
  });
}
function agentHand(x, y, s, rot) {
  import_sil(() => {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    piece(rough([[-15, -500], [15, -500], [13, -8], [-13, -8]], 1310, 1.1, 10), C.ink);
    piece([[-10, -8], [11, -8], [10, 18], [3, 40], [-7, 22]], C.ink);
    piece([[-13, -14], [13, -14], [13, -6], [-13, -6]], C.paper);
    g.restore();
  });
}
function sPupil(t) {
  const u = tw(t);
  cam();
  SC.pupilShot(mix(84, 34, eo(seg(u, HIT.pupil + .04, HIT.pupil + .3))));
}
// ── rooftops ──
const RF_CO = (t) => Math.min(SC.RF.end - 60, 700 + 640 * (t - HIT.moon));
const RF_AG = (t) => Math.min(2080, 260 + 620 * (t - HIT.moon));
function rfCam(t) {
  const mid = (RF_CO(t) + RF_AG(t)) / 2;
  let cx = mid + 60;
  if (t > T.edge - .4) cx = mix(cx, 2230, ss(seg(t, T.edge - .4, T.toss)));
  return { cx, cy: 560, s: .82 };
}
function sRoof(t) {
  const u = tw(t), c = rfCam(t);
  cam(c.cx, c.cy, c.s);
  const moonR = mix(RW.r, 330, eo(seg(t, HIT.moon, HIT.moon + .35))), moonY = mix(RW.y, 430, eo(seg(t, HIT.moon, HIT.moon + .35)));
  SC.rooftop({
    moonR, moonY, moonX: 960,
    front: () => {
      const ly = SC.RF.ledge + 2;
      // courier
      if (u < T.toss + .3) {
        let pose, x = RF_CO(u);
        if (u < T.edge) pose = coRunPose(((u - HIT.moon) / STEP * 1.3) % 1);
        else if (u < T.cornered) pose = { ...COURIER_POSE.stand, lean: -.25, flare: .6, key: .9 };
        else if (u < T.toss) pose = { ...COURIER_POSE.lookBack, key: .5 };
        else pose = { ...COURIER_POSE.lookBack, shF: 2.6, elF: .2, noKey: true };
        courierSide(x, ly, .8, pose, { noKey: u >= T.toss });
      } else if (u < T.leap + .3) {
        // he jumps off the end of the dash (coat spread open)
        const p = seg(u, T.toss + .3, T.leap + .3);
        courierSide(SC.RF.end - 30 + p * 160, ly + p * p * 700, .8, { ...coRunPose(.2), flare: 1 }, { noKey: true });
      }
      // agent
      let apose, ax = RF_AG(u), ay = ly;
      if (u < T.leap) apose = u < T.cornered ? runPose(((u - HIT.moon) / STEP * 1.4) % 1) : blendPose(runPose(.25), AGENT_POSE.stand, seg(u, T.cornered, T.cornered + .3));
      else {
        const p = seg(u, T.leap, T.catch);
        const hang = u >= T.catch ? (u - T.catch) : 0;
        ax = mix(2080, 2190, eo(p)) + hang * 12; ay = ly - Math.sin(Math.min(1, p) * Math.PI / 2) * 150 + hang * hang * 20;
        apose = { ...AGENT_POSE.reach, tph: u * 8 };
      }
      const r = agentSide(ax, ay, .8, apose);
      // key
      if (u >= T.toss && u < T.catch) {
        const p = seg(u, T.toss, T.catch), kx = mix(SC.RF.end - 10, r.wrist[0], p), ky = mix(ly - 420, r.wrist[1], p) - Math.sin(p * Math.PI) * 150;
        key(kx, ky, .75, p * 9);
      } else if (u >= T.catch) key(r.wrist[0] + 2, r.wrist[1] - 8, .75, Math.PI + .1);
    },
  });
}
// ── fragments fly back → title ──
let roofSnap = null;
function snapRoof() {
  if (roofSnap) return roofSnap;
  roofSnap = document.createElement('canvas'); roofSnap.width = W; roofSnap.height = H;
  const c2 = roofSnap.getContext('2d');
  setG(c2); try { const t = HIT.title - BAR - .001; const c = rfCam(t); cam(c.cx, c.cy, c.s); SC.rooftop({}); } finally { setG(gMain); }
  return roofSnap;
}
function letterLand(i) { return T.shatter + BEAT * .75 + i * (BAR - BEAT * .9) / 14; }
function sShatter(t) {
  const G = SC.titleGeom();
  cam(); SC.titleBG();
  // title letters fly in along the diagonal, landing on sixteenth notes (settled = still in the split-into-halves state)
  drawTitle(G.x, G.y, SC.TT.H, {
    split: 40, cutX: G.cutX, cutY: G.cutY,
    each: (ll) => {
      const i = G.L.findIndex(l => l.seed === ll.seed), tl = letterLand(i), a = tl - .42;
      if (t < a) return { hide: true };
      const p = tw(t) >= tl ? 1 : eo(seg(tw(t), a, tl));
      const sd = i % 2 ? 1 : -1, d = (1 - p) * 1500 * sd;
      return { x: ll.x + DIR[0] * d, y: ll.y + DIR[1] * d, rot: ll.rot + (1 - p) * sd * 1.2 };
    },
  });
  // the rooftop image slides away in long strips parallel to the cut line (the North by Northwest grid coming apart)
  const snap = snapRoof(), p0 = t - T.shatter;
  const n = 11, wS = 260;
  for (let k = -n; k <= n; k++) {
    const sd = k % 2 ? 1 : -1, d = ei(clamp((p0 - Math.abs(k) * .02) / .75)) * 2600 * sd;
    if (Math.abs(d) >= 2599) continue;
    const ox = 960 + NRM[0] * k * wS, oy = 540 + NRM[1] * k * wS, big = 2400;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.beginPath();
    g.moveTo(ox - NRM[0] * wS / 2 - DIR[0] * big, oy - NRM[1] * wS / 2 - DIR[1] * big);
    g.lineTo(ox - NRM[0] * wS / 2 + DIR[0] * big, oy - NRM[1] * wS / 2 + DIR[1] * big);
    g.lineTo(ox + NRM[0] * wS / 2 + DIR[0] * big, oy + NRM[1] * wS / 2 + DIR[1] * big);
    g.lineTo(ox + NRM[0] * wS / 2 - DIR[0] * big, oy + NRM[1] * wS / 2 - DIR[1] * big);
    g.closePath();
    g.translate(DIR[0] * d, DIR[1] * d); g.clip(); g.drawImage(snap, 0, 0);
    g.restore();
  }
  // the agent drifts down with the key to the right of the title
  const q = ss(seg(t, T.shatter, T.title)), c = rfCam(T.shatter);
  const sx0 = (2190 + 12 - c.cx) * c.s + 960, sy0 = (SC.RF.ledge - 150 + 20 - c.cy) * c.s + 540;
  const bx = G.x + G.w + 100, by = G.y + G.h;
  const ax = mix(sx0, bx, q), ay = mix(sy0, by, q) - Math.sin(q * Math.PI) * 60, s = mix(.8 * .82, .62, q);
  const r = agentSide(ax, ay, s, blendPose(AGENT_POSE.reach, { ...AGENT_POSE.stand, shF: 2.75, elF: .15, head: -.3, eye: 'open' }, q));
  key(r.wrist[0] + 3, r.wrist[1] - 6, mix(.75 * .82, .62, q), Math.PI + .1);
}
function titleWorld(t, o = {}) {
  const G = SC.titleGeom();
  SC.titleBG();
  drawTitle(G.x, G.y, SC.TT.H, { split: o.split ?? 40, cutX: G.cutX, cutY: G.cutY, each: o.each });
  return G;
}
function sTitle(t) {
  const u = tw(t), G = SC.titleGeom();
  // 33.18 title settles → 35.0 push in on the keyhole (to the same composition as the opening)
  const kEnd = KH_SCREEN.h / (154 * G.kh);      // keyhole 560px tall
  const p = eio(seg(t, T.pushKey, T.keyIn + .35));
  // camera: put the keyhole centre on KH_SCREEN
  const s = mix(1, kEnd, p);
  const cxEnd = G.khx - (KH_SCREEN.x - 960) / kEnd, cyEnd = G.khy - (KH_SCREEN.y - 540) / kEnd;
  cam(mix(960, cxEnd, p), mix(540, cyEnd, p), s);
  const closeP = u >= T.click ? 1 : 0;
  const split = 40 * (1 - (u >= T.click ? eo(seg(t, T.click, T.click + .08)) : 0));
  titleWorld(t, { split });
  // agent (in the wide shot, on the right holding up the key)
  if (t < T.keyIn - .2) {
    const bx = G.x + G.w + 100, by = G.y + G.h;
    const r = agentSide(bx, by, .62, { ...AGENT_POSE.stand, shF: 2.75, elF: .15, head: -.3, eye: 'open' });
    if (t < T.pushKey + .6) key(r.wrist[0] + 3, r.wrist[1] - 6, .62, Math.PI + .1);
  }
  // close-up: a hand inserts the key upright into the keyhole (lined up at 36.818, exactly as the split closes)
  if (t >= T.pushKey + .6) {
    const a = T.pushKey + .6, b = T.click;
    const q = u >= b ? 1 : eo(seg(u, a, b));
    const d = (1 - q) * 520;
    const kx = G.khx + d * .55, ky = G.khy + d * .9;
    const rot = (1 - q) * .6;
    key(kx, ky, G.kh, rot, { line: 1.2 });
    const out = ei(seg(u, T.click + .05, T.silence - .02));
    if (out < 1) agentHand(kx - Math.sin(rot) * 150 * G.kh + out * 80, ky + 150 * G.kh + out * 420, G.kh * 1.3, Math.PI + rot);
  }
}
function sFinal(t) {
  const u = tw(t), G = SC.titleGeom();
  cam();
  titleWorld(t, { split: 0 });
  key(G.khx, G.khy, G.kh, 0, { line: 1.2 });
  const bx = G.x + G.w + 100, by = G.y + G.h;
  const tip = env2(u, T.hatTip, T.hatTip + .9);
  agentSide(bx, by, .62, { ...AGENT_POSE.stand, shF: mix(.05, 2.9, tip), elF: mix(.12, 1.9, tip), head: -.05 * tip, eye: 'open' });
}
function env2(t, a, b) { return Math.min(ss(seg(t, a, a + .25)), 1 - ss(seg(t, b - .25, b))); }
function sEnd(t) {
  const u = tw(t);
  cam(); clear(C.paper);
  const p = eo(seg(t, T.endCard, T.endCard + .4));
  // small title
  const G = SC.titleGeom();
  g.save(); g.translate(960, 330); g.scale(.46, .46); g.translate(-(G.x + G.w / 2), -(G.y + G.h / 2));
  drawTitle(G.x, G.y, SC.TT.H, { split: 0 });
  key(G.khx, G.khy, G.kh, 0, { line: 1.2 });
  g.restore();
  // red diagonal
  piece(rough([[0, 640], [1920, 610], [1920, 618], [0, 648]], 1500, .8, 30), C.red, { gap: 0, shadow: false });
  const L1 = layout('60s SPY TITLE SEQUENCE', 96, { track: .08 });
  drawLine(L1, 960 - L1.width / 2 + (1 - p) * 300, 770, { col: C.ink, seed: 91, jit: .8, amp: 1.3 });
  label('LemoLab × Claude Opus 5.5', 960, 858, '600 44px LSpartan', C.red, 'center', 1);
  label('a LemoLab picture  ·  music by the sampler  ·  cut from paper', 960, 912, '400 24px LSpartan', C.ink, 'center', 1);
  label('Drums: “MuldjordKit” by Lars Muldjord, CC BY 4.0', 960, 952, '400 22px LSpartan', C.ink, 'center', 1);   // licence credit (fine print)
  agentSide(1610, 940, .36, { ...AGENT_POSE.stand, shF: 2.9, elF: 1.9, eye: 'open' });
}

// ═══════════════ Dispatcher ═══════════════
export function renderFilm(t, opt = {}) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (t < HIT.split) sOpen(t);
  else if (t < T.blinds) { cam(); sSplit(t); }
  else if (t < T.wipe) sVelvet(t);
  else if (t < T.agentIn + .12) {   // trench-coat wipe: the new scene is on the left
    const p = seg(t, T.wipe, T.agentIn + .12), wx = mix(-500, 2600, p);
    sIntro(t);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(wx, 0, W, H); g.clip(); sVelvet(t); g.restore();
    cam(); courierSide(wx + 70, 1290, 1.95, { ...coRunPose(tw(t) * 1.6 % 1), flare: 1 });
  }
  else if (t < T.airport) sIntro(t);
  else if (t < T.train) sAirport(t);
  else if (t < T.wheel) sTrain(t);
  else if (t < T.roulette) { cam(); SC.wheelShot(t); }
  else if (t < HIT.pupil) sCasino(t);
  else if (t < HIT.moon) sPupil(t);
  else if (t < T.shatter) sRoof(t);
  else if (t < T.title) sShatter(t);
  else if (t < T.bongoEnd) sTitle(t);
  else if (t < T.endCard) sFinal(t);
  else sEnd(t);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (!opt.nosub) drawSubs(t);
}

// ═══════════════ Sound events (for mix.py) ═══════════════
export function events() {
  const E = [];
  const add = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  add(.04, 'tape_click'); add(.08, 'paper_cut', { g: .8 });
  add(HIT.split, 'scissor'); add(HIT.split + .05, 'paper_whoosh', { g: .9 });
  T.words.forEach((w, i) => { add(w - .2, 'paper_slide', { g: .5 }); add(w, 'card_slap', { g: .6 }); });
  add(T.blinds, 'blinds');
  add(HIT.snatch - .3, 'paper_whoosh', { g: .6 }); add(HIT.snatch, 'grab'); add(HIT.snatch + .02, 'key_jingle', { g: .8 });
  add(T.wipe, 'coat_whoosh');
  for (let t = T.agentIn; t < T.skid; t += BEAT / 1.5) add(t, 'step', { g: .5 });
  add(T.skid, 'skid'); add(T.lookBack, 'paper_flip', { g: .5 }); add(T.toCam, 'paper_flip', { g: .5 });
  for (let t = T.dash; t < T.dash + .4; t += BEAT / 1.5) add(t, 'step', { g: .5 });
  // airport
  for (let t = T.airport; t < T.hide; t += BEAT) add(t, 'step', { g: .35 });
  add(T.hide, 'card_slap', { g: .8 }); add(T.hide + .02, 'key_jingle', { g: .4 });
  for (let t = T.walkOn; t < T.train; t += BEAT) add(t, 'step', { g: .3 });
  add(T.planeUp, 'jet');
  // train
  add(T.jump1 - .34, 'paper_whoosh', { g: .4 }); add(T.jump1, 'land'); add(T.jump2 - .34, 'paper_whoosh', { g: .4 }); add(T.jump2, 'land');
  add(T.jump3, 'paper_whoosh', { g: .4 }); add(T.land3, 'land');
  add(T.train, 'train_bed', { d: HIT.freeze - T.train + .05 }); add(T.resume, 'train_bed', { d: T.roulette - T.resume });
  add(T.wheel, 'wheel_clank');
  // casino
  add(T.roulette, 'roulette', { d: HIT.pupil - T.roulette });
  add(T.keyBet, 'key_drop'); add(T.keyBet - .35, 'paper_whoosh', { g: .4 });
  add(HIT.pupil, 'pupil'); add(HIT.moon, 'wind', { d: T.shatter - HIT.moon });
  for (let t = HIT.moon; t < T.edge; t += BEAT / 1.3) add(t, 'step', { g: .35 });
  add(T.edge, 'skid'); add(T.toss, 'chain_snap'); add(T.toss + .02, 'key_jingle', { g: .7 });
  add(T.leap, 'paper_whoosh', { g: .7 }); add(T.catch, 'key_catch');
  add(T.shatter, 'shatter');
  for (let i = 0; i < 15; i++) add(letterLand(i), 'card_slap', { g: .45 + i * .02 });
  add(T.title, 'card_slap', { g: 1 });
  add(T.pushKey + .6, 'paper_slide', { g: .4 }); add(T.keyIn, 'key_slide'); add(T.click, 'lock_click');
  add(T.hatTip, 'paper_flip', { g: .4 });
  add(T.endCard, 'paper_whoosh', { g: .5 });
  return E;
}
