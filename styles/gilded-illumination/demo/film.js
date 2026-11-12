'use strict';
// 借来的光 Borrowed Light: one timeline. 8 shots written on a 51.8 s story clock, shown on a 46.8 s film clock (WK below).
// Light: radial (a lamp, the sun), bands (a raking sweep) and rings (light spreading from a touch). It reaches only gold,
// computed per pixel per leaf square (each square has its own tilt), see glintPass.

// The film clock (what the viewer sees, 0–46.8 s) is mapped onto the story clock that the shots are written in.
// Faster walk, a short summit, the touch as the hardest beat, a longer final hold.
const WK = [[0, 0], [5.4, 6.0], [11.6, 12.6], [16.4, 18.4], [19.6, 22.65], [22.0, 25.625], [24.4, 28.0], [28.6, 33.2], [30.7, 35.4], [31.5, 36.6], [33.7, 39.2], [38.7, 44.2], [41.0, 46.0], [46.8, 51.8]];
const WARP = monotone(WK);
function INV(to) { let a = 0, b = WK[WK.length - 1][0]; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (WARP(m) < to) a = m; else b = m; } return (a + b) / 2; }
const DUR = 46.8, SDUR = 51.8;
const SHOTS = [[0, 1], [6.0, 2], [12.6, 3], [18.4, 4], [28.0, 5], [33.2, 6], [39.2, 7], [46.0, 8]];
const shotOf = t => SHOTS.reduce((a, s) => t >= s[0] ? s[1] : a, 1);
// [start, end (text complete until), 中文, English]  (voice start = start; end ≥ voice length + 0.6 s)
const SUBS = [   // film clock
  [0.6, 4.85, '在这个画出来的世界里，会发光的都是金子。', 'In the painted world, everything that shines is gold.'],
  [5.5, 8.65, '可金子自己不会发光。', 'But gold has no light of its own.'],
  [8.85, 11.95, '有一天夜里，连太阳也熄了。', 'One night, even the sun went out.'],
  [12.15, 16.15, '于是一个女孩提起最后一盏灯，开始往山上走。', 'So a girl took the last lamp, and began to climb.'],
  [16.6, 20.75, '她走到哪里，哪里的金子就想起了怎么发光。', 'Wherever she passed, the gold remembered how to shine.'],
  [20.9, 24.1, '她一走过，金子又睡着了。', 'Behind her, it fell asleep again.'],
  [24.5, 28.5, '到了山顶，太阳只是一片冰冷的金箔。', 'At the top, the sun was only a cold disc of leaf.'],
  [28.75, 31.2, '她举起了灯。', 'And she lifted her lamp.'],
  [34.0, 37.15, '金子不留自己的光。', 'Gold keeps no light of its own.'],
  [37.3, 40.6, '它只把得到的，还回去。', 'It only gives back what it is given.']];
const PLAQUE_T0 = 46.25;   // story clock (film 41.25)

let FR, FRg, MC, MCg, OCC, OCCg, OCCd = null;
function resetCtx(g) { if (g.reset) g.reset(); g.__gp = g.__sp = g.__paint = g.__gf = g.__gff = null; }

// ---------------------------------------------------------------- light
function lightAt(lights, x, y) {
  let v = 0; for (const L of lights) {
    if (L.type === 'r') { const d = Math.hypot(x - L.x, y - L.y) / L.r; if (d < 1) v += L.a * Math.pow(1 - d, 1.4); }
    else if (L.type === 'b') { const d = ((x - L.x) * L.nx + (y - L.y) * L.ny) / L.w; v += L.a * Math.exp(-d * d); }
    else if (L.type === 'o') { const d = (Math.hypot(x - L.x, y - L.y) - L.rad) / L.w; v += L.a * Math.exp(-d * d); }
  } return v;
}
// per pixel: where the mask says gold, find the leaf square (world grid, or a screen grid for leaf drawn in screen space),
// its tilt, and add light: squares facing the light flash, the others stay darker. The leaf's own texture is brightened
// (multiplied), so a lit square still shows its mottle and seams instead of turning into flat yellow.
const SCR_LS = .6;   // screen leaf: 1 px = 1 unit
function glintPass(M, lights, amb) {
  if (!lights.length && amb <= 0) { if (GWD) GWD.fill(0); return; }
  const md = MCg.getImageData(0, 0, W, H).data, img = ctx.getImageData(0, 0, W, H), fd = img.data;
  if (!GW) { GW = cnv(W / 4, H / 4); GWg = GW.getContext('2d'); GWD = new Float32Array(W / 4 * H / 4); GWI = GWg.createImageData(W / 4, H / 4); }
  GWD.fill(0); const QW = W / 4;
  const inv = M.inverse(), ia = inv.a, ib = inv.b, ic = inv.c, id = inv.d, ie = inv.e, iff = inv.f;
  const Ls = lights.map(L => ({ ...L, r2: L.r ? L.r * L.r : 0 }));
  let ci = 1e9, cj = 1e9, nx = 1, ny = 0, th = 0, fam = 0, tone = 0, ox = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4, A = md[p + 3]; if (A < 6) continue;
      const wx = ia * x + ic * y + ie, wy = ib * x + id * y + iff, scr = md[p + 1] < 128;
      const fx = scr ? x / SCR_LS : wx, fy = scr ? y / SCR_LS : wy;
      const j = Math.floor(fy / LS), ro = rowOff(j), i = Math.floor((fx + ro) / LS), gk = scr ? .6 : 1;
      if (i !== ci || j !== cj) { ci = i; cj = j; ox = ro; th = leafTilt(i, j); nx = Math.cos(th); ny = Math.sin(th); const fa = .5 + .5 * Math.cos(th - .9); fam = fa * fa * fa * fa; tone = leafTone(i, j); }
      // the leaf is not flat: each square is a little cupped along its tilt
      const lu = (fx + ox) / LS - i - .5, lv = fy / LS - j - .5, cup = 1 + .55 * (lu * nx + lv * ny);
      let R = amb * (.55 + .55 * fam);
      for (let k = 0; k < Ls.length; k++) { const L = Ls[k];
        if (L.type === 'r') { const dx = wx - L.x, dy = wy - L.y, d2 = dx * dx + dy * dy; if (d2 >= L.r2) continue; const d = Math.sqrt(d2), v = L.a * Math.pow(1 - d / L.r, 1.4);
          let f = .5 + .5 * (dx * nx + dy * ny) / (d + 1e-3); f *= f; R += v * (.5 + .75 * f); }
        else if (L.type === 'b') { const dd = ((wx - L.x) * L.nx + (wy - L.y) * L.ny) / L.w; if (dd > 3 || dd < -3) continue; const v = L.a * Math.exp(-dd * dd);
          let f = .5 + .5 * Math.cos(dd * 1.9 + th); f *= f; R += v * (.45 + .8 * f); }
        else { const dx = wx - L.x, dy = wy - L.y, dd = (Math.sqrt(dx * dx + dy * dy) - L.rad) / L.w; if (dd > 3 || dd < -3) continue; const v = L.a * Math.exp(-dd * dd);
          let f = .5 + .5 * Math.cos(dd * 2.2 + th); f *= f; R += v * (.5 + .8 * f); }
      }
      if (R < .004) continue;
      const k = A / 255 * Math.min(R * cup * gk, 2.2) * (.9 + .2 * tone);
      if (k > .6) GWD[(y >> 2) * QW + (x >> 2)] += (k - .6);
      const f = .82 * (1 - Math.exp(-1.15 * k)), r0 = fd[p], g0 = fd[p + 1], b0 = fd[p + 2];
      fd[p] = Math.min(255, r0 * (1 + .5 * k) + (250 - r0) * f); fd[p + 1] = Math.min(232, g0 * (1 + .45 * k) + (204 - g0) * f); fd[p + 2] = Math.min(150, b0 * (1 + .2 * k) + (96 - b0) * f);
    }
  }
  ctx.putImageData(img, 0, 0);
}
let GW, GWg, GWD, GWI;
function glowPass(gain) {   // a soft halo around the brightest gold (the eye's bloom), from the quarter-size light record
  if (!GWD) return; const n = GWD.length, d = GWI.data;
  for (let i = 0; i < n; i++) { const v = Math.min(1, GWD[i] / 16 * gain); d[i * 4] = 255; d[i * 4 + 1] = 196; d[i * 4 + 2] = 110; d[i * 4 + 3] = 255 * v * v; }
  GWg.putImageData(GWI, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(10px)'; ctx.globalAlpha = .55; ctx.drawImage(GW, 0, 0, W, H);
  ctx.filter = 'blur(36px)'; ctx.globalAlpha = .55; ctx.drawImage(GW, 0, 0, W, H);
  ctx.restore();
}
function hidden(M, x, y) { if (!OCCd) return false; const q = new DOMPoint(x, y).matrixTransform(M), X = Math.round(q.x), Y = Math.round(q.y); if (X < 0 || Y < 0 || X >= W || Y >= H) return false; return OCCd[(Y * W + X) * 4 + 3] > 100; }
function flashes(M, lights) {   // four-point flashes where the light is strongest on a piece of gold
  ctx.setTransform(M); ctx.globalCompositeOperation = 'lighter'; const z = Math.hypot(M.a, M.b);
  for (const p of GP) {
    const v = lightAt(lights, p.x, p.y) * p.k; if (v < .55 || hidden(M, p.x, p.y)) continue; const a = clamp((v - .55) * 1.4), r = Math.min(p.r * (.4 + .45 * a), 160 / z);
    const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * .5); rg.addColorStop(0, `rgba(255,246,215,${.4 * a})`); rg.addColorStop(1, 'rgba(255,232,160,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p.x, p.y, r * .5, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,250,232,${.8 * a})`;
    for (const an of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) { const rr = an % (Math.PI / 2) ? r * .45 : r; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(an + .2); ctx.beginPath(); ctx.moveTo(-rr, 0); ctx.quadraticCurveTo(0, -rr * .06, rr, 0); ctx.quadraticCurveTo(0, rr * .06, -rr, 0); ctx.fill(); ctx.restore(); }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- subtitles: a vellum speech scroll across the foot of the picture
function subAt(t) {   // the scroll stays open across a short gap; returns {s, open, prev}
  let cur = null, idx = -1; SUBS.forEach((s, i) => { if (t >= s[0] - .25 && t < s[1] + .35) { cur = s; idx = i; } });
  if (!cur) return null;
  const prev = SUBS[idx - 1], next = SUBS[idx + 1];
  const joinedIn = prev && cur[0] - prev[1] < .9, joinedOut = next && next[0] - cur[1] < .9;
  const open = (joinedIn ? 1 : eo(seg(t, cur[0] - .25, cur[0] + .1))) * (joinedOut ? 1 : 1 - ss(seg(t, cur[1] + .05, cur[1] + .35)));
  return { s: cur, open, prev: joinedIn ? prev : null };
}
let BANDW = 0;   // one width for every line: the widest line of the film
function bandWidth(g) { if (!BANDW) SUBS.forEach(s => { g.font = '500 36px ZhSerif5'; const wz = g.measureText(s[2]).width; g.font = 'italic 32px FellI'; BANDW = Math.max(BANDW, wz, g.measureText(s[3]).width); }); return BANDW; }
const SHOTF = () => [null, shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot7];
function girlBoxes(t) {   // screen boxes of every visible her at film time t
  const ts = WARP(t), S = SHOTF()[shotOf(ts)](ts), M = camMatrix(S.c), out = [], st = S.st;
  const list = [...(st.girls || []).filter(o => o.layers > 0).map(o => ({ G: o.G, sc: o.sc || 1.1, aur: o.aur || 0 })), ...(st.walker ? [{ G: st.walker.G, sc: 1.1, aur: 0 }] : [])];
  for (const o of list) { const r = o.aur > 0 ? 135 * o.sc : 0, h = 300 * o.sc;
    out.push(screenBox(M, o.G.x - Math.max(110 * o.sc, r), o.G.y - Math.max(h, 128 * o.sc + r), o.G.x + Math.max(110 * o.sc, r), o.G.y + 10)); }
  return out;
}
function drawBanderole(g, t) {
  const A = subAt(t); if (!A || A.open <= 0) return;
  const s = A.s, open = A.open;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const cx = W / 2, cy = 966, hw = (bandWidth(g) / 2 + 70) * open, h = 104;
  for (const sd of [-1, 1]) { const ex = cx + sd * hw; const tail = P2(q => { q.moveTo(ex - sd * 6, cy - h / 2 + 22); q.lineTo(ex + sd * 62, cy - h / 2 + 34); q.lineTo(ex + sd * 38, cy + 4); q.lineTo(ex + sd * 70, cy + h / 2 + 22); q.lineTo(ex - sd * 6, cy + h / 2 - 6); q.closePath(); });
    g.fillStyle = '#d8c69c'; g.fill(tail); rimShade(g, tail, '#a8926a', 8); g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(tail);
    const fold = P2(q => { q.moveTo(ex - sd * 3, cy + h / 2 - 6); q.lineTo(ex - sd * 3, cy + h / 2 + 14); q.lineTo(ex + sd * 24, cy + h / 2 + 2); q.closePath(); }); g.fillStyle = '#8a7552'; g.fill(fold); g.lineWidth = 2; g.stroke(fold); }
  const band = P2(q => { q.moveTo(cx - hw, cy - h / 2); q.bezierCurveTo(cx - hw * .4, cy - h / 2 - 10, cx + hw * .4, cy - h / 2 + 9, cx + hw, cy - h / 2); q.lineTo(cx + hw, cy + h / 2);
    q.bezierCurveTo(cx + hw * .4, cy + h / 2 + 9, cx - hw * .4, cy + h / 2 - 10, cx - hw, cy + h / 2); q.closePath(); });
  g.fillStyle = VELL; g.fill(band); g.save(); g.clip(band); g.globalAlpha = .5; g.fillStyle = g.__sp || (g.__sp = g.createPattern(SPKC, 'repeat')); g.fillRect(cx - hw, cy - h, hw * 2, h * 2); g.restore();
  rimShade(g, band, '#c9b386', 9); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(band);
  g.strokeStyle = 'rgba(255,252,238,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - hw + 12, cy - h / 2 + 7); g.lineTo(cx + hw - 12, cy - h / 2 + 6); g.stroke();
  const write = (S, wipe, alpha) => { g.save(); g.globalAlpha = alpha * clamp((open - .2) / .3); g.clip(band); g.beginPath(); g.rect(cx - hw, 0, hw * 2 * wipe, H); g.clip();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '500 36px ZhSerif5'; g.fillStyle = '#4a2c16'; g.fillText(S[2], cx, cy - 6);
    g.font = 'italic 32px FellI'; g.fillStyle = '#5c3a1e'; g.fillText(S[3], cx, cy + 34); g.restore(); };
  if (A.prev && t < s[0]) write(A.prev, 1, 1 - ss(seg(t, s[0] - .25, s[0] - .02)));   // the old line leaves before the new one is written
  if (t >= s[0]) write(s, eo(seg(t, s[0], s[0] + .55)), 1);
}

// ---------------------------------------------------------------- the walk: arclength on the path over film time
let SW;   // monotone s(t)
function sAtX(x, ymin = 0, ymax = 1e9) { let bi = -1, bd = 1e18; WD.path.forEach((p, i) => { if (p[1] < ymin || p[1] > ymax) return; const d = Math.abs(p[0] - x); if (d < bd) { bd = d; bi = i; } }); return WD.pathL[bi]; }
function sNear(x, y) { let bi = 0, bd = 1e18; WD.path.forEach((p, j) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; bi = j; } }); return WD.pathL[bi]; }
function buildWalk() {
  const sEnd = WD.pathL[WD.pathL.length - 1];
  // three stretches, each continuous; the jumps between them are hidden by the rock wipe (22.65) and the cloud wipe (25.625)
  const A = monotone([[15.9, sNear(GIRLS[0].x, GIRLS[0].y)], [16.6, sNear(GIRLS[0].x, GIRLS[0].y) + 90], [20.0, sNear(1470, 2211)], [22.65, sAtX(2010, 1900, 2100)]]);
  const B = monotone([[22.65, sNear(3300, 1652)], [24.3, sNear(GIRLS[3].x, GIRLS[3].y)], [25.625, sNear(3240, 1440)]]);
  const C = monotone([[25.625, sNear(3545, 1282)], [27.2, sNear(3420, 1150)], [28.6, sEnd - 30], [29.3, sEnd]]);
  SW = t => t < 22.65 ? A(t) : t < 25.625 ? B(t) : C(t);
}
function walkerAt(t, lift = 0) {
  const s = SW(t), q = alongPath(WD.path, WD.pathL, s), moving = t > 15.9 && t < 29.3;
  const dir = Math.cos(q.a) >= 0 ? 1 : -1;
  return { G: { x: q.x, y: q.y + 2, dir }, step: moving ? Math.sin(t * 5.4) : 0, bob: moving ? -Math.abs(Math.sin(t * 5.4)) * 3 : 0, lift };
}

// ---------------------------------------------------------------- screen-space pieces of the painting (drawn into the frame before night)
let QF = null, ROCK = null, BIGC = null;
function buildOverlays() {
  // the near rock: a stepped pillar wider than the frame (so the cut under it is hidden), with two spires leaning off it
  const R = mulberry(77), Lf = [], Rf = [], n = 7, y0 = 1500, y1 = -500, hw = 1520;
  for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), xl = -hw + (R() - .5) * 120 + i * 30, xr = hw + (R() - .5) * 120 - i * 30;
    if (i > 0 && i < n) { const r1 = 60 + R() * 90, r2 = 60 + R() * 90; Lf.push([xl - r1, y + 70], [xl - r1, y], [xl + r1 * .3, y]); Rf.push([xr + r2, y + 70], [xr + r2, y], [xr - r2 * .3, y]); }
    else { Lf.push([xl, y]); Rf.push([xr, y]); } }
  ROCK = [{ pts: spirePts(-1750, 1500, 1000, 1500, -.12, R), col: MIDP.az[0], colD: MIDP.az[1], top: MIDP.az[2], bx: -1750, by: 1500, w: 1000, h: 1500 },
    { pts: spirePts(1800, 1500, 900, 1250, .13, R), col: MIDP.li[0], colD: MIDP.li[1], top: MIDP.li[2], bx: 1800, by: 1500, w: 900, h: 1250 },
    { pts: Lf.concat(Rf.reverse()), col: MIDP.ve[0], colD: MIDP.ve[1], top: MIDP.ve[2], bx: 0, by: 1500, w: 3040, h: 2000 }];
  const top = [], bot = [], nc = 26;
  for (let i = 0; i <= nc; i++) { const u = i / nc, x = -400 + u * 2720; top.push([x, -1000 - Math.abs(Math.sin(u * Math.PI * 7)) * 130 - 40 * Math.sin(u * 9)]); bot.push([x, 1000 + Math.abs(Math.sin(u * Math.PI * 6 + .7)) * 120]); }
  BIGC = { top, bot };
}
let OV, OVg, OM, OMg;
function quatrefoil(cx, cy, Lx, Ly, R) {   // the outer outline of four lobes (right, bottom, left, top)
  const C = [[cx + Lx, cy], [cx, cy + Ly], [cx - Lx, cy], [cx, cy - Ly]], P = [];
  for (let i = 0; i < 4; i++) { const A = C[i], B = C[(i + 1) % 4], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy), h = Math.sqrt(Math.max(0, R * R - d * d / 4));
    const p1 = [mx - dy / d * h, my + dx / d * h], p2 = [mx + dy / d * h, my - dx / d * h]; P.push(Math.hypot(p1[0] - cx, p1[1] - cy) > Math.hypot(p2[0] - cx, p2[1] - cy) ? p1 : p2); }
  return P2(q => { for (let i = 0; i < 4; i++) { const c = C[i], a0 = Math.atan2(P[(i + 3) % 4][1] - c[1], P[(i + 3) % 4][0] - c[0]), a1 = Math.atan2(P[i][1] - c[1], P[i][0] - c[0]); q.arc(c[0], c[1], R, a0, a1, false); } q.closePath(); });
}
function drawQuatrefoil(g, s, dimv) {   // the gold-ground roundel around the close-up: scale s about the screen centre
  if (!OV) { OV = cnv(W, H); OVg = OV.getContext('2d'); OM = cnv(W, H); OMg = OM.getContext('2d'); }
  const cx = W / 2, cy = H / 2, Lx = 250 * s, Ly = 205 * s, Rl = 300 * s, qf = e => quatrefoil(cx, cy, Lx, Ly, Rl + e * s);
  const open = qf(0), e3 = qf(10), e2 = qf(36), e1 = qf(46), all = P2(q => q.rect(-50, -50, W + 100, H + 100));
  const o = OVg; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H); o.__gp = null;
  const saveMK = MK; MK = null;
  // gold ground with a punched diaper of lozenges and rosettes
  leaf(o, all, [-50, -50, W + 100, H + 100], { dim: dimv, line: false, rim: false, nomask: true, scale: SCR_LS });
  o.strokeStyle = 'rgba(100,54,6,.42)'; o.lineWidth = 1.4; const step = 64 * s;
  for (let k = -40; k <= 40; k++) { o.beginPath(); o.moveTo(cx + k * step, -60); o.lineTo(cx + k * step + 1300, 1240); o.stroke(); o.beginPath(); o.moveTo(cx + k * step, -60); o.lineTo(cx + k * step - 1300, 1240); o.stroke(); }
  o.fillStyle = 'rgba(100,54,6,.6)';
  for (let i = -20; i <= 20; i++) for (let j = -12; j <= 12; j++) { const x = cx + i * step, y = cy + j * step; if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    for (let a = 0; a < 6; a++) { o.beginPath(); o.arc(x + Math.cos(a * TAU / 6) * 7 * s, y + Math.sin(a * TAU / 6) * 7 * s, 1.9 * s, 0, TAU); o.fill(); } o.beginPath(); o.arc(x, y, 2.2 * s, 0, TAU); o.fill(); }
  // outer gold fillet sits on the ground; the vermilion band with pearls; inner gold fillet
  o.save(); o.translate(6 * s, 8 * s); o.fillStyle = 'rgba(40,20,4,.35)'; o.fill(e1); o.restore();
  o.fillStyle = VERM; o.fill(e2); rimShade(o, e2, VERM_D, 10 * s);
  o.save(); o.clip(e3); leaf(o, all, [-50, -50, W + 100, H + 100], { dim: dimv, line: false, rim: false, nomask: true, scale: SCR_LS }); o.restore();
  const band = new Path2D(); band.addPath(e2); band.addPath(e3);
  o.save(); o.clip(band, 'evenodd');
  for (let i = 0; i < 4; i++) { const c = [[cx + Lx, cy], [cx, cy + Ly], [cx - Lx, cy], [cx, cy - Ly]][i]; pearls(o, c[0], c[1], Rl + 23 * s, 40, 3.6 * s, .92); }
  o.restore();
  for (const p of [e1, e2, e3]) { o.strokeStyle = INK; o.lineWidth = 3.4; o.lineJoin = 'round'; o.stroke(p); }
  // cut the window
  o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; o.fill(open); o.globalCompositeOperation = 'source-over';
  o.strokeStyle = INK; o.lineWidth = 4; o.stroke(open);
  MK = saveMK;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(OV, 0, 0); g.restore();
  // the light mask: outside the window it is this frame's leaf (screen grid), the band and ink stay matte
  const m = OMg; m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H);
  m.fillStyle = '#f00'; m.fillRect(0, 0, W, H); m.globalCompositeOperation = 'destination-out'; m.fill(e2); m.globalCompositeOperation = 'source-over'; m.fill(e3);
  m.globalCompositeOperation = 'destination-out'; m.fill(open); m.globalCompositeOperation = 'source-over';
  if (MK) { MK.g.save(); MK.g.setTransform(1, 0, 0, 1, 0, 0);
    const out = new Path2D(); out.addPath(all); out.addPath(open); MK.g.globalCompositeOperation = 'destination-out'; MK.g.fill(out, 'evenodd');
    MK.g.globalCompositeOperation = 'source-over'; MK.g.drawImage(OM, 0, 0); MK.g.restore(); }
}
function drawRockWipe(g, u) {   // a near spire clump crossing the frame right → left (u 0..1)
  g.save(); g.translate(lerp(3500, -1580, u), 0);
  for (const S of ROCK) drawSpire(g, S);
  OCCg.setTransform(g.getTransform()); OCCg.fillStyle = '#000'; for (const S of ROCK) OCCg.fill(polyPath(S.pts, true));
  g.restore();
}
function drawCloudWipe(g, u) {   // a bank of scalloped cloud passing down the frame as the camera rises (u 0..1)
  const oy = lerp(-1300, 2380, u), { top, bot } = BIGC;
  g.save(); g.translate(0, oy);
  const tp = catmull(top, 6), bp = catmull(bot, 6), p = polyPath(tp.concat(bp.slice().reverse()), true);
  g.fillStyle = '#eef0f8'; g.fill(p); rimShade(g, p, 'rgba(110,140,210,.7)', 60); ink(g, p, 2.6); maskErase(g, p);
  OCCg.setTransform(g.getTransform()); OCCg.fillStyle = '#000'; OCCg.fill(p);
  g.strokeStyle = 'rgba(80,110,190,.6)'; g.lineWidth = 5;
  for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) { const x = -200 + k * 380 + (r % 2) * 190, y = -760 + r * 250; g.beginPath(); g.arc(x, y, 70, Math.PI * .1, Math.PI * 1.3); g.stroke(); }
  pearlLine(g, tp.slice(4, tp.length - 4).map(q => [q[0], q[1] + 40]), 34, 3.2, .8);
  g.restore();
}

// ---------------------------------------------------------------- shots: each returns camera c, world state st, night, lights(lamps), amb, overlay
const CAM1_END = { x: 2400, y: 1320, z: .5, r: 0 };
function shot1(t) {
  const u = seg(t, .6, 6.0), e = eio(u), z = Math.exp(lerp(Math.log(26), Math.log(CAM1_END.z), e)), r = lerp(-.32, 0, eo2(u));
  const fin = [W / 2 + (BS.x - CAM1_END.x) * CAM1_END.z, H / 2 + (BS.y - CAM1_END.y) * CAM1_END.z];
  const ps = [lerp(W / 2, fin[0], e), lerp(H / 2, fin[1], e)], dx = (ps[0] - W / 2) / z, dy = (ps[1] - H / 2) / z;
  const c = { x: BS.x - (Math.cos(-r) * dx - Math.sin(-r) * dy), y: BS.y - (Math.sin(-r) * dx + Math.cos(-r) * dy), z, r };
  return { c, st: { dim: 1, sun: { dim: .8, glory: 0 }, t }, night: lerp(.82, 1, e), amb: lerp(.32, .3, e), lights: () => [{ type: 'b', x: SUN.x + 42, y: SUN.y + 42, nx: .7, ny: -.7, w: 90, a: .85 * ss(seg(t, 2.5, 4.5)) },
    { type: 'b', x: BS.x + .9 * lerp(-34, 46, seg(t, 0, 3.4)), y: BS.y + .44 * lerp(-34, 46, seg(t, 0, 3.4)), nx: .9, ny: .44, w: 16, a: 1.7 * (1 - ss(seg(t, 2.6, 3.6))) }] };
}
const cam2 = track([[6.0, [CAM1_END.x, CAM1_END.y, Math.log(.5)]], [8.6, [2750, 1150, Math.log(.66)]], [10.4, [3350, 800, Math.log(1.15)]], [12.6, [SUN.x, SUN.y + 10, Math.log(2.5)]]]);
function shot2(t) {
  const [x, y, lz] = cam2(t), c = { x, y, z: Math.exp(lz), r: lerp(0, .04, seg(t, 9, 12.6)) };
  const g1 = seg(t, 7.2, 8.7), g2 = seg(t, 10.0, 11.9);
  const lights = () => {
    const L = [];
    if (g1 > 0 && g1 < 1) L.push({ type: 'r', x: lerp(BS.x - 420, BS.x + 420, g1), y: lerp(BS.y + 60, BS.y - 60, g1), r: 300, a: .95 * Math.sin(Math.PI * g1) });
    if (g2 < 1) L.push({ type: 'b', x: SUN.x + .7 * lerp(-60, 420, ss(g2)), y: SUN.y - .7 * lerp(-60, 420, ss(g2)), nx: .7, ny: -.7, w: 90, a: .85 * (1 - ss(seg(t, 10.9, 11.9))) });
    return L;
  };
  return { c, st: { dim: 1, sun: { dim: lerp(.8, 1, ss(g2)), glory: 0 }, t }, night: 1, amb: lerp(.38, .2, seg(t, 6, 12.6)), lights };
}
const camIn3 = track([[12.6, [0, 0, Math.log(3.6)]], [13.4, [0, 0, Math.log(3.4)]], [16.0, [1, 0, Math.log(1.3)]], [16.3, [1, 0, Math.log(1.3)]]]);
function lift3(t) { return .15 + .3 * ss(seg(t, 14.4, 15.0)) - .45 * ss(seg(t, 15.5, 16.0)); }
function shot3(t) {
  const lift = lift3(t), standing = t < 15.9;
  const w = standing ? { G: { ...GIRLS[0] }, step: 0, bob: 0, lift } : walkerAt(t, 0);
  const L0 = girlRig(lift).lamp, lamp = [GIRLS[0].x + L0[0] * 1.1, GIRLS[0].y + L0[1] * 1.1];
  const [k, , lz] = camIn3(t);
  let c = { x: lerp(lamp[0], 780, k), y: lerp(lamp[1] + 70, 2120, k), z: Math.exp(lz), r: 0 };
  const pu = seg(t, 16.2, 18.4);
  if (pu > 0) { const c4 = cam4(18.4), e = eio(pu); c = { x: lerp(c.x, c4.x, e), y: lerp(c.y, c4.y, e), z: Math.exp(lerp(Math.log(c.z), Math.log(c4.z), e)), r: lerp(0, c4.r, e) }; }
  const qs = 1 + Math.pow(eio(seg(t, 16.3, 18.3)), 1.4) * 3.4;
  return { c, st: { dim: 1, sun: { dim: 1, glory: 0 }, walker: w, t }, night: 1, amb: .22, lamp: 1, lights: L => L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 600, a: 1.25 })),
    overlay: g => { if (qs < 4.3) drawQuatrefoil(g, qs, 1); } };
}
function cam4(t) {
  const w = walkerAt(t);
  if (t < 22.65) return { x: w.G.x + 470, y: w.G.y - 270, z: 1.15, r: -.02 };
  if (t < 25.63) return { x: w.G.x + 40 - (t - 22.65) * 20, y: w.G.y - 190, z: 1.3, r: -.1 };
  return { x: w.G.x + lerp(30, -60, seg(t, 25.63, 28)), y: w.G.y - lerp(250, 300, seg(t, 25.63, 28)), z: lerp(1.2, 1.05, seg(t, 25.63, 28)), r: lerp(-.06, 0, seg(t, 25.63, 28)) };
}
function shot4(t) {
  const w = walkerAt(t), c = cam4(t);
  return { c, st: { dim: 1, sun: { dim: 1, glory: 0 }, walker: w, t }, night: 1, amb: .24, lamp: 1, lights: L => L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 660, a: 1.3 })),
    overlay: g => { const ur = seg(t, 22.15, 23.15), uc = seg(t, 25.1, 26.15); if (ur > 0 && ur < 1) drawRockWipe(g, eio(ur)); if (uc > 0 && uc < 1) drawCloudWipe(g, ss(uc)); } };
}
function shot5(t) {
  const u = seg(t, 28, 33.2), c = { x: lerp(3615, 3600, u), y: lerp(790, 760, u), z: lerp(1.0, 1.1, eio(u)), r: lerp(-.035, -.05, u) };
  const w = walkerAt(t, 0);
  return { c, st: { dim: 1, sun: { dim: 1, glory: 0 }, walker: w, t }, night: 1, amb: .16, lamp: .8, lights: L => L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 430, a: .95 })) };
}
const TOUCH = 35.4, CUT6 = 36.6;
function contactPt() { const lp = girlRig(1).lamp, lx = GIRLS[4].x + lp[0] * 1.1, ly = GIRLS[4].y + lp[1] * 1.1, a = Math.atan2(ly - SUN.y, lx - SUN.x); return { x: SUN.x + Math.cos(a) * SUN.r, y: SUN.y + Math.sin(a) * SUN.r, a, lx, ly }; }
function sunState(t) {
  const C = contactPt();
  if (t < TOUCH) return { dim: 1, glory: 0 };
  const rr = eo(seg(t, TOUCH, CUT6 + .1)) * 540, sw = seg(t, TOUCH + .15, CUT6 + .3);
  const rayDim = k => { let d = (k / 24 * TAU - C.a) % TAU; if (d < 0) d += TAU; return 1 - ss((sw * TAU - d) / .5); };
  return { dim: 1, ring: { x: C.x, y: C.y, r: rr }, rayDim, glory: ss(seg(t, CUT6, CUT6 + 1.2)), C };
}
function shot6(t) {
  const lift = ss(seg(t, 33.4, 34.9)) * .7 + .3, C = contactPt();
  const w = { G: { ...GIRLS[4] }, step: 0, bob: 0, lift };
  if (t < CUT6) {
    const u = seg(t, 33.2, 35.2), c = { x: lerp(3740, 3760, u), y: lerp(870, 752, eio(u)), z: lerp(2.3, 2.55, u), r: -.05 };
    const S = sunState(t);
    return { c, st: { dim: 1, sun: S, walker: w, t }, night: 1, amb: .3, lamp: 1,
      lights: L => [...L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 360, a: .95 })), ...(t >= TOUCH ? [{ type: 'o', x: C.x, y: C.y, rad: eo(seg(t, TOUCH, CUT6 + .1)) * 540, w: 44, a: 1.35 }, { type: 'o', x: C.x, y: C.y, rad: eo(seg(t, TOUCH + .2, CUT6 + .3)) * 540, w: 30, a: .6 }, { type: 'r', x: C.x, y: C.y, r: 200, a: .5 }] : [])] };
  }
  // wide: the sun burns, a band of light leaves it and crosses the night sky right → left; the night lifts
  const u = seg(t, CUT6, 39.2), c = { x: lerp(3050, 2350, eio(u)), y: lerp(1080, 1120, u), z: lerp(.62, .58, u), r: 0 };
  const day = ss(seg(t, 36.7, 38.6)), S = sunState(t), bx = lerp(SUN.x - 200, -600, ss(seg(t, 36.8, 39.0)));
  return { c, st: { dim: lerp(1, .15, day), sun: { dim: 0, rayDim: () => 0, glory: S.glory }, walker: w, t }, night: 1 - day, amb: lerp(.3, .7, day), lamp: .6,
    lights: L => [{ type: 'r', x: SUN.x, y: SUN.y, r: 900, a: .42 }, { type: 'b', x: bx, y: 900, nx: -.9, ny: .44, w: 260, a: 1.1 * (1 - ss(seg(t, 38.7, 39.2))) }, ...L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 300, a: .6 }))] };
}
const cam7 = track([[39.2, [3400, 930, Math.log(2.0)]], [40.6, [3220, 1340, Math.log(1.45)]], [41.6, [2850, 1700, Math.log(.98)]], [42.6, [2420, 1750, Math.log(.64)]], [43.4, [2400, 1500, Math.log(.47)]], [44.2, [WW / 2, WH / 2, Math.log(.4)]]]);
const PAINT = [43.1, 42.2, 41.3, 40.4, null];   // when each earlier "her" starts being painted (index = GIRLS index)
function shot7(t) {
  const [x, y, lz] = cam7(t), c = { x, y, z: Math.exp(lz), r: 0 };
  // the band travels down from the summit along the path, reaching each place as she is painted there, then leaves the picture
  const keys = [[39.3, sNear(GIRLS[4].x, GIRLS[4].y) + 120], [40.4, sNear(GIRLS[3].x, GIRLS[3].y)], [41.3, sNear(GIRLS[2].x, GIRLS[2].y)], [42.2, sNear(GIRLS[1].x, GIRLS[1].y)], [43.1, sNear(GIRLS[0].x, GIRLS[0].y)], [44.4, -500]];
  const bp = monotone(keys)(clamp(t, 39.3, 44.4)), bq = alongPath(WD.path, WD.pathL, clamp(bp, 0, WD.pathL[WD.pathL.length - 1]));
  const bx = bq.x + (bp < 0 ? bp * .9 : 0), by = bq.y - (bp < 0 ? bp * .3 : 0), ba = 1 - ss(seg(t, 43.8, 44.6));
  const sc = 1.1 + .55 * ss(seg(t, 40.4, 44.2));
  const girls = GIRLS.map((G, i) => ({ G, layers: i === 4 ? 1 : clamp((t - PAINT[i]) / .9), flame: 1, lift: i === 4 ? 1 : 0, sc,
    aur: i === 4 ? ss(seg(t, 39.4, 40.2)) : ss(seg(t, PAINT[i] + .1, PAINT[i] + .8)) }));
  const pulse = (i, t0) => Math.sin(Math.PI * seg(t, t0 + i * .32, t0 + i * .32 + .7));
  const pulses = GIRLS.map((G, i) => ({ type: 'r', x: G.x, y: G.y - 128 * sc, r: 340, a: 1.5 * (pulse(i, 44.5) + pulse(i, 49.3)) })).filter(L => L.a > .01);
  const end = t >= 46.0, sweep = seg(t, 44.6, SDUR);
  return { c, st: { dim: .12, sun: { dim: 0, rayDim: () => 0, glory: 1 }, girls, t, border: ss(seg(t, 43.4, 45.4)), plaque: PLAQUE_T0 }, night: 0, amb: .8, lamp: .35,
    lights: L => [{ type: 'r', x: SUN.x, y: SUN.y, r: 900, a: .45 }, { type: 'b', x: bx, y: by, nx: -.83, ny: .56, w: 230, a: .95 * ba },
      ...(t > 44.6 ? [{ type: 'b', x: lerp(-400, 5200, sweep), y: 1350, nx: 1, ny: -.25, w: 360, a: .55 * Math.sin(Math.PI * sweep) }] : []),
      ...(end ? [{ type: 'r', x: 2500, y: 2330, r: 900, a: 1.1 * Math.sin(Math.PI * seg(t, PLAQUE_T0 + 1.55, PLAQUE_T0 + 2.4)) }] : []),
      ...pulses, ...girls.filter(o => o.aur > 0).map(o => ({ type: 'r', x: o.G.x, y: o.G.y - 128 * sc, r: 260, a: .8 * o.aur })),
      ...L.map(p => ({ type: 'r', x: p[0], y: p[1], r: 220, a: .6 }))] };
}

function render(tf) {
  tf = clamp(tf, 0, DUR - 1e-4); TX = []; const t = WARP(tf);
  const sh = shotOf(t), S = [null, shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot7][sh](t);
  resetCtx(FRg); MCg.setTransform(1, 0, 0, 1, 0, 0); MCg.clearRect(0, 0, W, H);
  MK = { g: MCg, pre: new DOMMatrix(), col: '#fff' };
  const M = camMatrix(S.c); setZoom(S.c.z); FRg.setTransform(M);
  const lamps = drawWorld(FRg, S.st);
  for (const L of lamps) drawLampGlory(FRg, L, 1, t);
  OCCd = null;
  if (S.overlay) { OCCg.setTransform(1, 0, 0, 1, 0, 0); OCCg.clearRect(0, 0, W, H); FRg.setTransform(1, 0, 0, 1, 0, 0); setZoom(1); S.overlay(FRg); setZoom(S.c.z); FRg.setTransform(M);
    OCCg.setTransform(1, 0, 0, 1, 0, 0); OCCd = OCCg.getImageData(0, 0, W, H).data; }
  FRg.setTransform(1, 0, 0, 1, 0, 0); FRg.save(); FRg.globalCompositeOperation = 'multiply'; FRg.globalAlpha = .14; const gp = FRg.createPattern(GRAINC, 'repeat'); FRg.fillStyle = gp; FRg.fillRect(0, 0, W, H); FRg.restore();
  MK = null;
  const day = S.day || 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(FR, 0, 0);
  if (S.night > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = S.night; ctx.fillStyle = 'rgb(150,158,206)'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  // the lamp warms what is near it (a soft pool, under the gold's own light)
  ctx.setTransform(M); ctx.globalCompositeOperation = 'screen';
  for (const L of lamps) { if (hidden(M, L[0], L[1])) continue; const rr = 420; const rg = ctx.createRadialGradient(L[0], L[1], 0, L[0], L[1], rr); rg.addColorStop(0, `rgba(255,190,110,${.32 * (S.lamp || 0)})`); rg.addColorStop(.4, `rgba(220,150,80,${.12 * (S.lamp || 0)})`); rg.addColorStop(1, 'rgba(200,140,80,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(L[0], L[1], rr, 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lights = S.lights(lamps);
  glintPass(M, lights, S.amb || 0);
  glowPass(.6);
  flashes(M, lights);
  ctx.setTransform(M); ctx.globalCompositeOperation = 'lighter';
  for (const L of lamps) { if (hidden(M, L[0], L[1])) continue; const rr = 90; const rg = ctx.createRadialGradient(L[0], L[1], 0, L[0], L[1], rr); rg.addColorStop(0, 'rgba(255,220,150,.5)'); rg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(L[0], L[1], rr, 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(W * .5, H * .45, H * .42, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(${S.night > .5 ? '10,12,40,.4' : '40,20,5,.24'})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawBanderole(ctx, tf);
}

// ---------------------------------------------------------------- sound cues (window.EV)
function buildEvents() {
  const ev = [];
  const E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  E(0.05, 'bell_far'); E(7.6, 'star_glint'); E(10.2, 'band_out'); E(12.6, 'cut_lamp'); E(14.5, 'lamp_lift'); E(16.3, 'push_frame');
  E(15.9, 'walk_start'); E(22.15, 'rock_wipe'); E(25.1, 'cloud_wipe'); E(28.0, 'summit'); E(32.0, 'silence'); E(33.2, 'close'); E(33.6, 'lift');
  E(TOUCH, 'touch'); E(CUT6, 'cut_wide'); E(39.2, 'band_down'); E(43.4, 'border'); E(45.3, 'border_full');
  E(PLAQUE_T0, 'plaque'); E(PLAQUE_T0 + .5, 'bole'); E(PLAQUE_T0 + 1.2, 'gild'); E(PLAQUE_T0 + 1.95, 'title_flash'); E(PLAQUE_T0 + .75, 'write');
  for (let i = 3; i >= 0; i--) E(PAINT[i], 'paint', { i });
  // fruit and other gold lit by her lamp on the climb: the first frame each piece comes inside the lamp's reach
  const pieces = [];
  WD.trees.forEach(T => T.fruit.forEach(([fx, fy]) => pieces.push([T.x + fx, T.y - T.th - T.r * .55 + fy])));
  for (let i = 0; i < 7; i++) pieces.push([1300 + 34 + i * ((340 - 68) / 6), 2187]);
  WD.shrines.forEach(s => pieces.push([s.x, s.y - 160]));
  const on = new Set(); let n = 0;
  for (let t = 16.0; t < 28.0; t += 1 / 60) {
    const w = walkerAt(t), lp = girlRig(0).lamp, lx = w.G.x + lp[0] * 1.1 * w.G.dir, ly = w.G.y + lp[1] * 1.1;
    pieces.forEach((p, k) => { if (!on.has(k) && Math.hypot(p[0] - lx, p[1] - ly) < 230) { on.add(k); if (!(t > 22.1 && t < 23.2) && !(t > 25.0 && t < 26.2)) E(t, 'gold_lit', { n: n++ }); } });
  }
  // the stars lit by the band in the wide shot, right to left
  WD.stars.forEach(s => { for (let t = 36.8; t < 39.0; t += 1 / 30) { const bx = lerp(SUN.x - 200, -600, ss(seg(t, 36.8, 39.0))), d = ((s.x - bx) * -.9 + (s.y - 900) * .44) / 260; if (Math.abs(d) < .3 && s.r > 24) { E(t, 'star', { x: s.x }); break; } } });
  SUBS.forEach((s, i) => E(s[0], 'vo', { i }));
  ev.forEach(e => { if (e.type !== 'vo') e.t = +INV(e.t).toFixed(3); });
  return ev.sort((a, b) => a.t - b.t);
}

(async () => {
  await Promise.all(['128px Uncial', '500 40px ZhSerif5', '40px Fell', 'italic 40px FellI', '600 40px Grenze'].map(f => document.fonts.load(f, f.includes('Zh') ? '金借来的光箔彩绘' : 'a')));
  GOLDC = makeGold(); GOLDF = makeGoldFine(512, 3, 1); GOLDFF = makeGoldFine(1024, 9, 1.6); SPKC = makeSpk(); GRAINC = makeGrain(); PAINTC = makePaint();
  buildWorld(); buildWalk(); buildOverlays();
  FR = cnv(W, H); FRg = FR.getContext('2d'); OCC = cnv(W, H); OCCg = OCC.getContext('2d', { willReadFrequently: true }); MC = cnv(W, H); MCg = MC.getContext('2d', { willReadFrequently: true });
  window.DUR = DUR; window.render = render; window.EV = buildEvents();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  window.SUBS = SUBS;
  render(Q.get('t') ? +Q.get('t') : 20.5); window.READY = true;
})();
