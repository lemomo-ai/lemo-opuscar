// Silhouette shapes, drawn in local metres with y up (the caller sets the canvas transform).
// Everything is filled in one colour; only the alpha union matters (the shader paints it black).
window.SHAPES = (function () {
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 57), hash(i + 1 + seed * 57), u); }

  // closed Catmull-Rom through points -> path
  function closedSpline(ctx, pts) {
    const n = pts.length;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath(); ctx.fill(); ctx.beginPath();
  }
  function bez(p0, p1, p2, p3, t) {
    const m = 1 - t;
    return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
            m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
  }
  // tube along a cubic bezier with a width profile; jag adds feather roughness
  function tube(ctx, p0, p1, p2, p3, wf, N, jag, seed) {
    const L = [], Rr = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = bez(p0, p1, p2, p3, Math.max(0, t - .01)), b = bez(p0, p1, p2, p3, Math.min(1, t + .01)), c = bez(p0, p1, p2, p3, t);
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = wf(t) / 2;
      const j1 = jag ? (vnoise(t * 90, seed) - .5) * jag : 0, j2 = jag ? (vnoise(t * 97 + 9, seed + 3) - .5) * jag : 0;
      L.push([c[0] - dy * (w + j1), c[1] + dx * (w + j1)]); Rr.push([c[0] + dy * (w + j2), c[1] - dx * (w + j2)]);
    }
    ctx.moveTo(L[0][0], L[0][1]);
    for (const p of L) ctx.lineTo(p[0], p[1]);
    for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath(); ctx.fill(); ctx.beginPath();
  }
  const ss = x => x * x * (3 - 2 * x);
  function rot(p, a, o) { const c = Math.cos(a), s = Math.sin(a); return [o[0] + p[0] * c - p[1] * s, o[1] + p[0] * s + p[1] * c]; }

  // ---------------------------------------------------------------- flamingo
  // pose: hipY, bt (body tilt), neck [c1x,c1y,c2x,c2y,hx,hy] rel. to shoulder, hp (head pitch), yaw,
  // wing 0..1, legs [{hip:[x,y]? , foot:[x,y], swing:0..1}] (feet in bird-local metres)
  const BODY = [[.25, .13], [.19, .23], [.05, .28], [-.10, .265], [-.24, .21], [-.33, .13], [-.40, .045], [-.36, .005], [-.24, -.025], [-.08, -.05], [.08, -.035], [.20, .04]];
  const L1 = .42, L2 = .44;
  function legJoint(hip, foot, swing) {
    const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
    let d = Math.hypot(dx, dy); d = Math.min(d, L1 + L2 - 1e-4);
    const a = Math.atan2(dy, dx);
    const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const off = Math.acos(Math.max(-1, Math.min(1, cosA)));
    // stance: joint behind (bird "backward knee"); swing: joint ahead
    const sgn = swing > .12 ? 1 : -1;
    const ang = a + off * sgn;
    return [hip[0] + Math.cos(ang) * L1, hip[1] + Math.sin(ang) * L1];
  }
  function flamingo(ctx, P, seed) {
    const hip = [0, P.hipY];
    const bt = P.bt;
    ctx.beginPath();
    // body
    closedSpline(ctx, BODY.map(p => rot(p, bt, hip)));
    if (P.juv) fluffEdge(ctx, BODY.map(p => rot(p, bt, hip)), seed, .013);
    // tail plumes: soft drooping lobes under the rear
    for (let i = 0; i < 3; i++) {
      const p = [-.26 - i * .03, .06], q = [-.43 - i * .025, -.01 - i * .022], r = [-.34 - i * .02, .10];
      const A = rot(p, bt, hip), Q = rot(q, bt, hip), Rr = rot(r, bt, hip);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(Q[0] + .04, Q[1] - .01, Q[0], Q[1]); ctx.quadraticCurveTo(Q[0] - .03, Q[1] + .02, Rr[0], Rr[1]); ctx.closePath(); ctx.fill(); ctx.beginPath();
    }
    // neck
    const S = rot([.19, .16], bt, hip);
    const nk = P.neck;
    const H = [S[0] + nk[4], S[1] + nk[5]];
    tube(ctx, rot([.05, .14], bt, hip), [S[0] + nk[0], S[1] + nk[1]], [S[0] + nk[2], S[1] + nk[3]], H,
      t => (t < .14 ? lerp(.12, .05, ss(t / .14)) : lerp(.05, .03, Math.pow((t - .14) / .86, .7))) * (P.juv ? 1.25 : 1), 48, P.juv ? .004 : .0025, seed);
    // head + bill
    head(ctx, H, P.hp, P.yaw, P.headTilt || 0, P.juv);
    // wings
    if (P.wing > .02) {
      const w = P.wing;
      wing(ctx, rot([-.02, .21], bt, hip), w, 1, seed, lerp(Math.PI + .1, 2.5, w) + bt * .4);
      wing(ctx, rot([.06, .22], bt, hip), w, .9, seed + 1, lerp(Math.PI + .05, .78, w) + bt * .4);
    }
    ctx.fill('nonzero');
    // legs
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const lg of P.legs) {
      const hp = rot([-.02, .0], bt, hip);
      const k = legJoint(hp, lg.foot, lg.swing);
      ctx.beginPath(); ctx.lineWidth = .036; ctx.moveTo(hp[0], hp[1]); ctx.lineTo(k[0], k[1]); ctx.stroke();
      ctx.beginPath(); ctx.lineWidth = .026; ctx.moveTo(k[0], k[1]); ctx.lineTo(lg.foot[0], lg.foot[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(k[0], k[1], .024, 0, TAU); ctx.fill();
      if (lg.foot[1] > .015) { // lifted foot: toes curled, hanging down/back along the lower leg
        const dx = lg.foot[0] - k[0], dy = lg.foot[1] - k[1], l = Math.hypot(dx, dy) || 1;
        const ux = dx / l, uy = dy / l;
        ctx.beginPath(); ctx.moveTo(lg.foot[0] - uy * .02, lg.foot[1] + ux * .02);
        ctx.lineTo(lg.foot[0] + ux * .10 - uy * .03, lg.foot[1] + uy * .10 + ux * .03);
        ctx.lineTo(lg.foot[0] + ux * .085 + uy * .035, lg.foot[1] + uy * .085 - ux * .035);
        ctx.lineTo(lg.foot[0] + uy * .02, lg.foot[1] - ux * .02); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.fill();
      }
    }
  }
  // head frame: x forward, y up, origin where the neck meets the head. Big bill, bent down half way.
  const HEAD = [[-.030, .004], [-.022, .026], [.0, .037], [.026, .036], [.05, .030], [.078, .026], [.100, .018], [.114, .0], [.122, -.030], [.120, -.058], [.111, -.068], [.103, -.060], [.099, -.040], [.090, -.020], [.072, -.016], [.050, -.020], [.028, -.026], [.004, -.026], [-.022, -.016]];
  function head(ctx, H, hp, yaw, tilt, juv) {
    const c = Math.cos(yaw), ac = Math.abs(c), s = Math.abs(Math.sin(yaw));
    const HS = juv ? 1.08 : 1.2;
    const pts = HEAD.map(p0 => {
      const p = [p0[0] * HS, p0[1] * HS]; if (juv && p0[0] > .09) { p[0] = .09 * HS + (p0[0] - .09) * HS * .7; p[1] = p[1] * .75 + .006; } let x = p[0];
      x = x < .02 ? x * (.75 + .25 * ac) * Math.sign(c || 1) : (.02 * (.75 + .25 * ac) + (x - .02) * ac) * Math.sign(c || 1);
      return rot([x, p[1]], (hp + tilt) * Math.sign(c || 1), H);
    });
    ctx.beginPath(); closedSpline(ctx, pts); ctx.fill(); ctx.beginPath();
    if (s > .3) { // seen from the front: the bent bill hangs as a narrow blade
      const w = .016 * s, xx = .03 * c;
      const a = rot([xx - w, .02], hp, H), b = rot([xx + w, .02], hp, H), d = rot([xx + w * .5, -.075], hp, H), e = rot([xx - w * .5, -.075], hp, H);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.fill(); ctx.beginPath();
    }
  }
  // wing: root at o, x along the span, y toward the leading edge. Arm + hand + separated primaries ("fingers").
  function wing(ctx, o, open, scale, seed, ang) {
    const sp = .92 * scale * (.45 + .55 * open);   // root..wrist..fingertips
    const ch = .78 * scale;
    const fan = .25 + .75 * open;
    const P = (x, y) => rot([x * sp, y * ch], ang, o);
    // arm + hand
    const arm = [[0, .07], [.18, .115], [.36, .12], [.52, .095], [.60, .06], [.62, -.02], [.56, -.085], [.46, -.12], [.36, -.135], [.30, -.115], [.24, -.135], [.18, -.12], [.12, -.135], [.06, -.12], [0, -.08]];
    ctx.beginPath(); const p0 = P(arm[0][0], arm[0][1]); ctx.moveTo(p0[0], p0[1]);
    for (const q of arm) { const p = P(q[0], q[1]); ctx.lineTo(p[0], p[1]); }
    ctx.closePath(); ctx.fill(); ctx.beginPath();
    // primaries: slender lancets fanning from the hand
    const NF = 6;
    for (let i = 0; i < NF; i++) {
      const f = i / (NF - 1);
      const base = [.52 + .07 * (1 - f), .05 - .15 * f];
      const a = (.06 - .40 * f) * fan - .04;              // leading feather points outward, trailing ones swept back
      const len = (.44 - .14 * f) * (1 + .06 * Math.sin(seed + i * 2.3));
      const w = .03;
      const dx = Math.cos(a), dy = Math.sin(a);
      const tip = [base[0] + dx * len, base[1] + dy * len * 1.0];
      const m1 = [base[0] + dx * len * .5 - dy * w, base[1] + dy * len * .5 + dx * w];
      const m2 = [base[0] + dx * len * .5 + dy * w, base[1] + dy * len * .5 - dx * w];
      const A = P(base[0] - dy * w * .8, base[1] + dx * w * .8), B = P(m1[0], m1[1]), C = P(tip[0], tip[1]), D = P(m2[0], m2[1]), E = P(base[0] + dy * w * .8, base[1] - dx * w * .8);
      ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(B[0], B[1], C[0], C[1]); ctx.quadraticCurveTo(D[0], D[1], E[0], E[1]); ctx.closePath(); ctx.fill(); ctx.beginPath();
    }
  }

  // ---------------------------------------------------------------- gull (seabird far away), local size ~1
  function gull(ctx, ph) {
    const a = Math.sin(ph) * .55;
    ctx.beginPath();
    ctx.ellipse(0, 0, .26, .06, 0, 0, TAU); ctx.fill(); ctx.beginPath();
    for (const sd of [-1, 1]) {
      const w1 = [sd * .45, .12 + a * .45], w2 = [sd * .95, -.05 + a * 1.0];
      ctx.moveTo(sd * .06, .03);
      ctx.quadraticCurveTo(w1[0] * .7, w1[1] + .1, w1[0], w1[1]);
      ctx.quadraticCurveTo(w2[0] * .8, w2[1] + .08, w2[0], w2[1]);
      ctx.quadraticCurveTo(w2[0] * .7, w2[1] - .02, w1[0], w1[1] - .07);
      ctx.quadraticCurveTo(w1[0] * .5, w1[1] - .08, sd * .06, -.03);
      ctx.closePath(); ctx.fill(); ctx.beginPath();
    }
    ctx.fill();
  }

  // ---------------------------------------------------------------- palm on a little islet
  function palm(ctx, seed, sway, h) {
    h = h || 7;
    ctx.beginPath();
    // islet
    ctx.moveTo(-3.2, 0); ctx.quadraticCurveTo(-1.5, .55, 0, .6); ctx.quadraticCurveTo(1.8, .5, 3.6, 0); ctx.closePath(); ctx.fill(); ctx.beginPath();
    // trunk: curved, tapered, ringed
    const top = [1.4 + sway * .15, h];
    const p0 = [0, .3], p1 = [.2, h * .45], p2 = [.9, h * .8];
    tube(ctx, p0, p1, p2, top, t => lerp(.42, .2, t) * (1 + .12 * Math.pow(Math.abs(Math.sin(t * 46)), 6)), 60, 0, seed);
    ctx.fill();
    // fronds
    const NF = 11;
    for (let i = 0; i < NF; i++) {
      const base = lerp(-.25, Math.PI + .25, i / (NF - 1)) + (hash(i + seed) - .5) * .25;
      const len = 2.6 + hash(i * 3 + seed) * 1.1;
      const droop = .9 + hash(i * 7 + seed) * .7 + Math.abs(Math.cos(base)) * .5;
      frond(ctx, top, base + sway * .12 * Math.cos(base), len, droop, seed + i);
    }
    ctx.beginPath(); ctx.ellipse(top[0], top[1] - .1, .35, .3, 0, 0, TAU); ctx.fill();
  }
  function frond(ctx, o, a, len, droop, seed) {
    const N = 30, spine = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      spine.push([o[0] + Math.cos(a) * len * t, o[1] + Math.sin(a) * len * t - droop * len * .5 * t * t]);
    }
    ctx.beginPath(); ctx.lineWidth = .06; ctx.lineCap = 'round';
    ctx.moveTo(spine[0][0], spine[0][1]); for (const p of spine) ctx.lineTo(p[0], p[1]); ctx.stroke();
    ctx.beginPath();
    for (let i = 3; i < N; i++) {
      const t = i / N, p = spine[i], q = spine[i + 1];
      let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const ll = (.85 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + .1) * (.85 + .3 * hash(i * 3.1 + seed));
      for (const sd of [-1, 1]) {
        const nx = -dy * sd, ny = dx * sd;
        const tipx = p[0] + nx * ll * .55 + dx * ll * .35, tipy = p[1] + ny * ll * .55 + dy * ll * .35 - ll * .62;
        const mx = p[0] + nx * ll * .35 + dx * ll * .1, my = p[1] + ny * ll * .35 + dy * ll * .1 - ll * .12;
        ctx.moveTo(p[0] - dx * .03, p[1] - dy * .03);
        ctx.quadraticCurveTo(mx, my + .03, tipx, tipy);
        ctx.quadraticCurveTo(mx + dx * .05, my - .02, p[0] + dx * .06, p[1] + dy * .06);
        ctx.closePath(); ctx.fill(); ctx.beginPath();
      }
    }
  }

  // ---------------------------------------------------------------- reeds / cattails (foreground)
  function reeds(ctx, seed, sway, n) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (hash(i + seed) - .5) * 1.1, hgt = .14 + hash(i * 5 + seed) * .36, lean = (hash(i * 9 + seed) - .5) * .5 + sway * .2;
      tube(ctx, [x, -.05], [x + lean * .2, hgt * .4], [x + lean * .6, hgt * .8], [x + lean, hgt], t => lerp(.022, .004, t), 14, 0, seed);
      if (hash(i * 13 + seed) > .8) { const tx = x + lean * .92, ty = hgt * .9; ctx.moveTo(tx + .03, ty); ctx.ellipse(tx, ty, .016, .06, -lean * .4, 0, TAU); ctx.fill(); ctx.beginPath(); }
    }
    ctx.fill();
  }

  // ---------------------------------------------------------------- sailboat (far), local metres
  function boat(ctx) {
    ctx.beginPath();
    ctx.moveTo(-4, .6); ctx.lineTo(4.2, .6); ctx.lineTo(3.2, -.1); ctx.lineTo(-3.4, -.1); ctx.closePath(); ctx.fill(); ctx.beginPath();
    ctx.moveTo(0, .6); ctx.lineTo(0.15, .6); ctx.lineTo(.15, 11); ctx.lineTo(0, 11); ctx.closePath(); ctx.fill(); ctx.beginPath();
    ctx.moveTo(.3, 10.4); ctx.quadraticCurveTo(3.4, 5, 3.6, 1.1); ctx.lineTo(.3, 1.1); ctx.closePath(); ctx.fill(); ctx.beginPath();
    ctx.moveTo(-.2, 9.6); ctx.lineTo(-.2, 1.4); ctx.quadraticCurveTo(-2.4, 2.5, -3.1, 1.4); ctx.closePath(); ctx.fill(); ctx.beginPath();
    ctx.fill();
  }

  // ---------------------------------------------------------------- flamingo in flight / take-off (side view, facing +x)
  // P: phi (wing elevation, rad, + up), sweep (0..1), legA (leg angle from the hip: PI = straight back, -PI/2 = hanging down),
  // knee (0..1 bend), neckA (neck angle above horizontal), hp (head pitch), juv (0/1), bt (body tilt), run (0..1 legs running)
  const WING = [[0, .10], [.22, .135], [.44, .125], [.62, .095], [.80, .055], [.93, .02], [1.0, -.015],
    [.965, -.05], [.935, -.035], [.925, -.085], [.885, -.07], [.865, -.12], [.82, -.10], [.79, -.15], [.745, -.13], [.72, -.17],
    [.62, -.18], [.54, -.165], [.47, -.19], [.39, -.175], [.31, -.2], [.22, -.185], [.13, -.2], [.04, -.17], [0, -.12]];
  function flyWing(ctx, o, phi, side, L, sweep, fwd) {
    // span direction projected to the screen: up/down by phi; a little depth term so a level wing still shows
    const sx = -(.18 + .25 * sweep), sy = Math.sin(phi) + side * Math.cos(phi) * .22;
    const sl = Math.hypot(sx, sy) || 1;
    const fs = Math.max(.22, Math.min(1, sl));             // foreshortening
    const ux = sx / sl * fs, uy = sy / sl * fs;             // span vector (screen, scaled)
    const cx = fwd[0], cy = fwd[1];                         // chord (leading edge) direction
    const pts = WING.map(([x, y]) => [o[0] + (ux * x) * L + cx * y * L * .9, o[1] + (uy * x) * L + cy * y * L * .9]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); ctx.closePath(); ctx.fill(); ctx.beginPath();
  }
  const BODYF = [[.27, .055], [.19, .105], [.05, .13], [-.10, .12], [-.24, .085], [-.33, .035], [-.36, -.005], [-.29, -.045], [-.15, -.075], [.02, -.085], [.16, -.065], [.26, -.02]];
  function flyer(ctx, P, seed) {
    const juv = P.juv || 0, bt = P.bt || 0, O = [0, 0];
    const k = juv ? .86 : 1;
    ctx.beginPath();
    closedSpline(ctx, BODYF.map(p => rot([p[0] * k, p[1] * (juv ? 1.12 : 1)], bt, O)));
    if (juv) fluffEdge(ctx, BODYF.map(p => rot([p[0] * k, p[1] * 1.12], bt, O)), seed, .012);
    // neck: nearly straight, slight sag in the middle
    const nL = juv ? .46 : .64, na = (P.neckA || 0) + bt;
    const S = rot([.20 * k, .04], bt, O);
    const dir = [Math.cos(na), Math.sin(na)], nrm = [-dir[1], dir[0]];
    const sag = (juv ? .02 : .035) * (1 - Math.abs(Math.sin(na)));
    const H = [S[0] + dir[0] * nL, S[1] + dir[1] * nL];
    tube(ctx, rot([.08 * k, .03], bt, O), [S[0] + dir[0] * nL * .33 - nrm[0] * sag, S[1] + dir[1] * nL * .33 - nrm[1] * sag],
      [S[0] + dir[0] * nL * .66 - nrm[0] * sag, S[1] + dir[1] * nL * .66 - nrm[1] * sag], H,
      t => t < .12 ? lerp(juv ? .11 : .10, juv ? .055 : .045, ss(t / .12)) : lerp(juv ? .055 : .045, juv ? .036 : .028, (t - .12) / .88), 40, juv ? .004 : .002, seed);
    head(ctx, H, (P.hp || -.15) + na, 0, 0, juv);
    // tail: short wedge
    const T0 = rot([-.30 * k, .03], bt, O), T1 = rot([-.42 * k, -.005], bt, O), T2 = rot([-.30 * k, -.04], bt, O);
    ctx.moveTo(T0[0], T0[1]); ctx.lineTo(T1[0], T1[1]); ctx.lineTo(T2[0], T2[1]); ctx.closePath(); ctx.fill(); ctx.beginPath();
    // wings: far first (a touch higher on screen, shorter), then near
    const phi = P.phi || 0, sw = P.sweep || 0, L = juv ? .78 : .98;
    const root = rot([.0, .07], bt, O), fwd = [Math.cos(bt), Math.sin(bt)];
    flyWing(ctx, [root[0] - .04, root[1] + .01], phi * .78 - .1, -1, L * .9, sw + .35, fwd);
    flyWing(ctx, root, phi, 1, L, sw, fwd);
    ctx.fill();
    // legs
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const hipP = rot([-.10 * k, -.05], bt, O), la = P.legA == null ? Math.PI : P.legA;
    const l1 = (juv ? .36 : .42), l2 = (juv ? .38 : .44);
    for (let i = 0; i < 2; i++) {
      let kx, ky, fx, fy;
      if (P.feet) { // running: feet planted in the world (given in bird-local metres), knees by two-bone IK
        const ft = P.feet[i], dx = ft[0] - hipP[0], dy = ft[1] - hipP[1];
        let d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1e-4);
        const a = Math.atan2(dy, dx), off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
        const ang = a + off * (ft[2] > .12 ? 1 : -1);
        kx = hipP[0] + Math.cos(ang) * l1; ky = hipP[1] + Math.sin(ang) * l1;
        const a2 = Math.atan2(ft[1] - ky, ft[0] - kx);
        fx = kx + Math.cos(a2) * l2; fy = ky + Math.sin(a2) * l2;
      } else {
        const a = la + (i ? .07 : -.05) + (P.run ? Math.sin(P.run + i * Math.PI) * .5 : 0);
        const kb = (P.knee || 0) * (i ? 1.15 : .85);
        kx = hipP[0] + Math.cos(a) * l1; ky = hipP[1] + Math.sin(a) * l1;
        fx = kx + Math.cos(a + kb) * l2; fy = ky + Math.sin(a + kb) * l2;
      }
      ctx.beginPath(); ctx.lineWidth = juv ? .034 : .032; ctx.moveTo(hipP[0], hipP[1]); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.beginPath(); ctx.lineWidth = juv ? .026 : .024; ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.beginPath(); ctx.arc(kx, ky, .021, 0, TAU); ctx.fill();
      // webbed foot: a small paddle continuing the lower leg
      const ul = Math.hypot(fx - kx, fy - ky) || 1, ux = (fx - kx) / ul, uy = (fy - ky) / ul;
      ctx.beginPath(); ctx.moveTo(fx - uy * .012, fy + ux * .012); ctx.quadraticCurveTo(fx + ux * .03 - uy * .03, fy + uy * .03 + ux * .03, fx + ux * .065 - uy * .012, fy + uy * .065 + ux * .012); ctx.quadraticCurveTo(fx + ux * .075, fy + uy * .075, fx + ux * .065 + uy * .014, fy + uy * .065 - ux * .014); ctx.quadraticCurveTo(fx + ux * .03 + uy * .028, fy + uy * .03 - ux * .028, fx + uy * .012, fy - ux * .012); ctx.closePath(); ctx.fill();
    }
    ctx.beginPath();
  }
  // a downy, ragged edge along a closed outline (the young bird)
  function fluffEdge(ctx, pts, seed, amp) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      for (let j = 0; j < 7; j++) {
        const t = j / 7, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
        const r = amp * (.5 + .9 * hash(seed + i * 7 + j));
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill(); ctx.beginPath();
  }


  return { flamingo, flyer, fluffEdge, gull, palm, reeds, boat, hash, vnoise, lerp };
})();
