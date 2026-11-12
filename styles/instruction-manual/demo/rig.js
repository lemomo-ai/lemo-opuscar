// rig.js — the manual's people: faceless, true-to-life proportions (≈7 heads), every limb a tapered capsule.
// In an orthographic view a sphere is always a circle, so a limb is the hull of two circles and a torso the hull of a few:
// the figure turns correctly at any angle, and lines only appear where one part overlaps another.
//
// What keeps them from looking like figurines:
//  · the body is two layers: the pelvis carries the weight (it can shift over one foot, drop into a crouch or sit on the floor),
//    the chest leans, bends sideways and twists on top of it, so a pose has a centre of gravity instead of standing on a pin;
//  · the head has its own frame (yaw, pitch, roll, or lookAt a point), and the hair region, the bun and the nose are all placed
//    in that 3D frame: the bun sits high on the back of the skull and turns, tilts and hides behind the head with it;
//  · elbows and knees take hints, so hands can hold a rail, steady a post, turn a key, rest on a hip, scratch a head.
import { PAL, LW, add3, sub3, mul3, dot3, cross3, len3, norm3, blob, getGrow, getFillOverride } from './iso.js';

const D2R = Math.PI / 180;
export const LOOKS = {
  a: { shirt: '#FFFFFF', pants: PAL.grey2, shoes: PAL.grey3, hair: PAL.grey3, skin: '#FFFFFF', bun: false, scale: 1 },
  b: { shirt: PAL.grey1, pants: PAL.grey3, shoes: '#3E3C39', hair: '#3E3C39', skin: '#FFFFFF', bun: true, scale: .94 },
};

export function rot(p, k, a) {   // Rodrigues: rotate vector p around unit axis k
  const c = Math.cos(a), s = Math.sin(a);
  return add3(add3(mul3(p, c), mul3(cross3(k, p), s)), mul3(k, dot3(k, p) * (1 - c)));
}
export function ik(A, C, a, b, hint) {   // two-bone: returns the middle joint, bent toward `hint`
  const d = sub3(C, A); let L = len3(d); const u = norm3(d);
  L = Math.min(L, (a + b) * .999); L = Math.max(L, Math.abs(a - b) * 1.01 + .01);
  const ca = (a * a + L * L - b * b) / (2 * a * L), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
  const p = norm3(sub3(hint, mul3(u, dot3(hint, u))));
  return add3(A, add3(mul3(u, a * ca), mul3(p, a * sa)));
}

// pose fields (all optional except at):
//  at:[x,z], y0, face:deg (0 = +x, 90 = +z) — where the person stands and which way the hips point
//  crouch:cm (pelvis drop), pelvisF:cm (pelvis forward), hip:cm (pelvis over the left (+) or right (−) foot), hipRoll:deg
//  lean:deg forward, side:deg (+ bends to the right), twist:deg (+ turns the chest to the left)
//  head:{yaw, pitch (+ looks down), roll} relative to the chest, or lookAt:[x,y,z] (world)
//  feet:[[f, l, lift, toeDeg], …] local to `at`/`face`; knee:[dir|null, dir|null] world hints
//  hands:[p | (sk) => p | null, …] world WRIST targets, not the palm: the hand is drawn on past the point, its palm centre
//    4.3·S cm further along handDir and its fingertips 8.2·S cm (S = the look's scale), so to put a palm on a rail aim the
//    wrist ≈ 4 cm short of it; elbow:[dir|null, …] world hints; handDir:[dir|null, …] the hand's direction from the wrist
//    (default: along the forearm). At full-body scale the hand is one paddle; a close-up of hands uses hand.js instead
//  look:'a'|'b', lw
export function person(v, P) {
  const lk = typeof P.look === 'string' ? LOOKS[P.look] : (P.look || LOOKS.a), S = P.scale ?? lk.scale ?? 1;
  const th = (P.face || 0) * D2R, F = [Math.cos(th), 0, Math.sin(th)], Lf = [Math.sin(th), 0, -Math.cos(th)], Y = [0, 1, 0];
  const R0 = [P.at[0], P.y0 || 0, P.at[1]];
  const loc = (f, l, y) => add3(R0, add3(add3(mul3(F, f), mul3(Lf, l)), mul3(Y, y)));
  const pelvis = loc(P.pelvisF || 0, P.hip || 0, 92 * S - (P.crouch || 0));
  const hipRoll = (P.hipRoll ?? -(P.hip || 0) * 1.1) * D2R;            // the pelvis drops on the free-leg side
  const lean = (P.lean || 0) * D2R, side = (P.side ?? (P.hip || 0) * .9) * D2R, twist = (P.twist || 0) * D2R;
  const rotU = (p) => rot(rot(rot(p, Y, twist), F, side), Lf, lean);   // the chest's frame on top of the pelvis
  const cF = rotU(F), cL = rotU(Lf), cY = rotU(Y);
  const up = (f, l, y) => add3(pelvis, add3(add3(mul3(cF, f * S), mul3(cL, l * S)), mul3(cY, y * S)));
  const pL = rot(Lf, F, hipRoll), pY = rot(Y, F, hipRoll);
  const hipP = (l, y) => add3(pelvis, add3(mul3(pL, l * S), mul3(pY, y * S)));

  // head frame: from the chest, then yaw / pitch / roll — or turned to look at a point
  const neck0 = up(0, 0, 51), neckTop = up(1, 0, 58);
  let hy = (P.head?.yaw || 0) * D2R, hp = (P.head?.pitch || 0) * D2R;
  if (P.lookAt) {
    const d = norm3(sub3(P.lookAt, add3(neckTop, mul3(cY, 10 * S))));
    hy = Math.atan2(dot3(d, cL), dot3(d, cF)); hp = -Math.asin(Math.max(-1, Math.min(1, dot3(d, cY))));
    hy = Math.max(-80 * D2R, Math.min(80 * D2R, hy)); hp = Math.max(-35 * D2R, Math.min(60 * D2R, hp));
    hy += (P.head?.yaw || 0) * D2R; hp += (P.head?.pitch || 0) * D2R;
  }
  let hF = rot(cF, cY, hy), hL = rot(cL, cY, hy), hU = cY;
  hF = rot(hF, hL, hp); hU = rot(hU, hL, hp);
  const hr = (P.head?.roll || 0) * D2R; hU = rot(hU, hF, hr); hL = rot(hL, hF, hr);
  const HR = 12.6 * S, headC = add3(neckTop, add3(mul3(hU, 9.6 * S), mul3(hF, 1.2 * S)));
  const sk = { pelvis, up, cF, cL, cY, headC, hF, hU, hL, HR, F, Lf, S };
  sk.sh = [up(0, 15, 47.5), up(0, -15, 47.5)];

  // legs
  const feet = P.feet || [[1, 10], [1, -10]];
  const legs = [0, 1].map((i) => {
    const side_ = i ? -1 : 1, hip = hipP(8.2 * side_, -3);
    const ff = feet[i], ankle = loc(ff[0], ff[1], 8 + (ff[2] || 0));
    const hint = P.knee?.[i] || add3(F, mul3(Lf, side_ * .18));
    const knee = ik(hip, ankle, 41 * S, 41 * S, hint);
    const ta = (ff[3] || 0) * D2R, fd = [Math.cos(th + ta * (i ? -1 : 1)), 0, Math.sin(th + ta * (i ? -1 : 1))];
    const toeUp = ff[4] || 0;   // tip the foot (kneeling: the toes stay on the floor, the heel lifts)
    const toe = add3(ankle, add3(mul3(fd, 14.5 * S), [0, -4.5 + toeUp, 0])), heel = add3(ankle, add3(mul3(fd, -3), [0, -3.5 - toeUp * .2, 0]));
    return { hip, knee, ankle, heel, toe };
  });
  sk.legs = legs;
  // arms
  const hands = P.hands || [null, null];
  const arms = [0, 1].map((i) => {
    const side_ = i ? -1 : 1, Sh = sk.sh[i];
    let H = hands[i]; if (typeof H === 'function') H = H(sk);
    if (!H) H = add3(Sh, add3(add3(mul3(cL, 7 * side_ * S), mul3(cY, -51 * S)), mul3(cF, 3 * S)));   // hanging, a little away from the body
    const hint = P.elbow?.[i] || (P.elbowOut && i === 1 ? add3(add3(mul3(cL, -1), mul3(cY, .15)), mul3(cF, .2)) : add3(add3(mul3(cL, side_ * .8), mul3(cY, -.5)), mul3(cF, -.6)));
    const E = ik(Sh, H, 28 * S, 26 * S, hint);
    const d = sub3(H, E), L = len3(d), W = L > 26 * S ? add3(E, mul3(norm3(d), 26 * S)) : H;
    const hdir = P.handDir?.[i] ? norm3(P.handDir[i]) : norm3(sub3(W, E));
    // W is the wrist (= the hands[] target when it is in reach); the hand runs on from it: palm centre 4.3·S, fingertips 8.2·S
    return { S: Sh, E, W, palm: add3(W, mul3(hdir, 4.3 * S)), tip: add3(W, mul3(hdir, 8.2 * S)) };
  });
  sk.arms = arms;

  const lw = P.lw ?? LW, o = (d) => ({ depth: v.depth(d), lw });
  // legs and shoes: the leg farther from us is one shade darker, so two legs that overlap (kneeling, sitting) never merge
  const farI = v.depth(legs[0].knee) + v.depth(legs[0].hip) < v.depth(legs[1].knee) + v.depth(legs[1].hip) ? 0 : 1;
  legs.forEach((L, i) => {
    const col = i === farI ? shade(lk.pants, .84) : lk.pants;
    blob(v, [[L.hip, 9 * S], [L.knee, 6.8 * S]], col, o(mul3(add3(L.knee, L.hip), .5)));
    blob(v, [[L.knee, 6.8 * S], [L.ankle, 5.2 * S]], col, o(mul3(add3(L.knee, L.ankle), .5)));
    blob(v, [[L.heel, 4.5 * S], [L.toe, 3.7 * S], [add3(L.ankle, [0, -1, 0]), 4.9 * S]], lk.shoes, { ...o(L.ankle), depth: v.depth(L.toe) });
  });
  // torso: hips (trousers) under the shirt, both sorted at the chest so the shirt always covers the waistband
  const tc = up(0, 0, 25);
  blob(v, [[hipP(7, 0), 9.6 * S], [hipP(-7, 0), 9.6 * S], [up(0, 0, 7), 9.8 * S]], lk.pants, o(tc));
  blob(v, [[up(0, 14.5, 48.5), 7.2 * S], [up(0, -14.5, 48.5), 7.2 * S], [up(1.5, 0, 36), 12.2 * S], [up(.5, 0, 21), 10 * S],
    [up(0, 5.5, 10), 9.6 * S], [up(0, -5.5, 10), 9.6 * S]], lk.shirt, { ...o(tc), bias: .01 });
  blob(v, [[neck0, 5.2 * S], [add3(headC, mul3(hU, -8 * S)), 4.8 * S]], lk.skin, { ...o(neck0), depth: v.depth(tc) + .02 });
  // arms
  for (const A of arms) {
    blob(v, [[A.S, 6.4 * S], [A.E, 5.2 * S]], lk.shirt, o(mul3(add3(A.S, A.E), .5)));
    blob(v, [[A.E, 5 * S], [A.W, 3.9 * S]], lk.shirt, o(mul3(add3(A.E, A.W), .5)));
    blob(v, [[A.W, 3.7 * S], [A.palm, 4.5 * S], [A.tip, 3.4 * S]], lk.skin, { ...o(A.palm), bias: .05 });
  }
  // head: nose (only its tip shows past the skull), the bun (in front of or behind the skull, by depth), skull + hair region
  const dH = v.depth(headC);
  // (no nose: a manual's people are faceless; which way the head points is read from the hairline and the bun)
  if (lk.bun) {
    // the bun sits high on the back of the skull; seen from behind it lies inside the head's outline, so a coil line
    // (a short arc on the bun's face, offset toward the crown) tells it from a flat spot
    const bd = norm3(add3(mul3(hF, -.46), mul3(hU, .89))), bc = add3(headC, mul3(bd, HR * 1.0)), br = HR * .42;
    const front = dot3(bd, v.eye) > 0;
    blob(v, [[bc, br]], lk.hair, { ...o(bc), depth: dH + (front ? .2 : -.2), after: (g, cs) => {
      if (!front) return;
      const [x, y, r] = cs[0], k = Math.min(1, dot3(bd, v.eye) * 1.6);
      g.save(); g.globalAlpha *= k; g.strokeStyle = PAL.ink; g.lineWidth = lw * .75; g.lineCap = 'round';
      const a0 = Math.atan2(-(v.P(add3(bc, hU))[1] - y), v.P(add3(bc, hU))[0] - x);
      g.beginPath(); g.arc(x, y, r * .52, -a0 - 2.2, -a0 + .6); g.stroke(); g.restore();
    } });
  }
  const hc = v.P(headC), hrPx = HR * v.s;
  const hairImg = hairMask(v, hF, hU, hrPx, lk, lw);
  v.add(dH, (g) => {
    const gr = getGrow(); g.save(); if (gr < 1) g.globalAlpha *= Math.min(1, gr * 1.5);
    const fo = getFillOverride();
    g.beginPath(); g.arc(hc[0], hc[1], hrPx, 0, Math.PI * 2); g.fillStyle = fo || lk.skin; g.fill();
    if (!fo) g.drawImage(hairImg, hc[0] - hairImg.R, hc[1] - hairImg.R, hairImg.R * 2, hairImg.R * 2);
    g.beginPath(); g.arc(hc[0], hc[1], hrPx, 0, Math.PI * 2); g.lineWidth = lw; g.strokeStyle = PAL.ink; g.stroke();
    g.restore();
  });
  return sk;
}

// Hair is a region on the head sphere: the back of the skull (n·f < c1) plus the crown (n·u > c2), both in the head's own frame,
// so it follows a nod or a tilt as well as a turn. Rasterised at 3× and scaled down, with the hairline inked where the region changes.
const hairCache = new Map();
function hairMask(v, f, u, r, lk, lw) {
  const q = (x) => Math.round(x * 60) / 60, fq = f.map(q), uq = u.map(q), rq = Math.round(r * 4) / 4, lq = Math.round(lw * 10) / 10;
  const SS = 3, R = Math.ceil(rq + lq + 1), N = R * 2 * SS, key = [fq, uq, rq, lk.hair, lk.bun, lq, v.ca, v.se].join();
  if (hairCache.has(key)) return hairCache.get(key);
  if (hairCache.size > 400) hairCache.clear();
  const c = document.createElement('canvas'); c.width = c.height = N; c.R = R;
  const g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data;
  const right = [v.ca, 0, -v.sa], upv = [-v.sa * v.se, v.ce, -v.ca * v.se], eye = v.eye;
  const c1 = lk.bun ? -.08 : -.26, c2 = lk.bun ? .5 : .6;
  const H = new Float32Array(N * N).fill(-9), rp = rq * SS;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + .5 - N / 2) / rp, y = (j + .5 - N / 2) / rp, s2 = 1 - x * x - y * y; if (s2 < 0) continue;
    const z = Math.sqrt(s2), n0 = x * right[0] - y * upv[0] + z * eye[0], n1 = x * right[1] - y * upv[1] + z * eye[1], n2 = x * right[2] - y * upv[2] + z * eye[2];
    const a = c1 - (n0 * fq[0] + n1 * fq[1] + n2 * fq[2]), b = (n0 * uq[0] + n1 * uq[1] + n2 * uq[2]) - c2, m = Math.max(a, b);
    H[j * N + i] = m + Math.log(Math.exp(7 * (a - m)) + Math.exp(7 * (b - m))) / 7;   // soft union: a rounded hairline
  }
  const ink = hexRGB(PAL.ink), hair = hexRGB(lk.hair), half = lq * SS / 2;
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
    const h = H[j * N + i]; if (h === -9) continue;
    const gx = (H[j * N + i + 1] - H[j * N + i - 1]) / 2, gy = (H[(j + 1) * N + i] - H[(j - 1) * N + i]) / 2, gm = Math.hypot(gx, gy);
    const far = H[j * N + i + 1] === -9 || H[j * N + i - 1] === -9 || H[(j + 1) * N + i] === -9 || H[(j - 1) * N + i] === -9;
    const dist = !far && gm > 1e-6 ? Math.abs(h) / gm : 99, k = (j * N + i) * 4;
    if (dist < half) { d[k] = ink[0]; d[k + 1] = ink[1]; d[k + 2] = ink[2]; d[k + 3] = 255; }
    else if (h > 0) { d[k] = hair[0]; d[k + 1] = hair[1]; d[k + 2] = hair[2]; d[k + 3] = 255; }
  }
  g.putImageData(im, 0, 0); hairCache.set(key, c); return c;
}
function shade(h, k) { return '#' + hexRGB(h).map((c) => Math.round(c * k).toString(16).padStart(2, '0')).join(''); }
function hexRGB(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }

// ---------- pose helpers ----------
// linear blend of two poses: numbers and arrays blend, everything else switches at the midpoint
export function mixPose(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  const m = (x, y) => {
    if (typeof x === 'number' && typeof y === 'number') return x + (y - x) * t;
    if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) return x.map((xi, i) => m(xi, y[i]));
    if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x)) { const o = {}; for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) o[k] = k in x && k in y ? m(x[k], y[k]) : (t < .5 ? x[k] : y[k]); return o; }
    return t < .5 ? x : y;
  };
  return m(a, b);
}
// walking feet for a phase (one cycle = two steps), local to the body: [[f, l, lift, toe], …]
export function walkFeet(ph, stride = 22, w = 10) {
  const out = [];
  for (const i of [0, 1]) {
    const p = ph * Math.PI * 2 + i * Math.PI, f = Math.sin(p) * stride / 2, lift = Math.max(0, Math.cos(p)) * 7;
    out.push([f, (i ? -1 : 1) * w, lift, 4]);
  }
  return out;
}
