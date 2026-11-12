// HTML/SVG layer: labels, the colour key, the slider and the chart. Every anchor is a 3D point projected to the screen.
const NS = 'http://www.w3.org/2000/svg';

export function overlay(f, X) {
  const { scr, PAL, GEO: G, PHYS, solve, SLIDER, TRAIN, RATIO, P2, deg } = X;
  const svg = document.getElementById('lines'), ov = document.getElementById('ov');
  const el = (tag, at, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); parent.appendChild(e); return e; };
  const div = (cls, html, x, y, st = {}) => { const d = document.createElement('div'); d.className = 'o ' + cls; d.innerHTML = html; d.style.left = x + 'px'; d.style.top = y + 'px'; Object.assign(d.style, st); ov.appendChild(d); return d; };
  const path = pts => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  const line = (pts, o = {}) => el('path', { d: path(pts), fill: 'none', stroke: o.c || PAL.ink, 'stroke-width': o.w || 1.25, 'stroke-dasharray': o.dash || 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.op ?? 1 });
  const dot = (p, c = PAL.ink, r = 3.4) => el('circle', { cx: p[0], cy: p[1], r, fill: c, stroke: PAL.paper, 'stroke-width': 1.6 });
  const head = (p, q, c = PAL.ink, w = 1.4, s = 9) => {      // open arrowhead at q, pointing along p -> q
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    line([[q[0] - s * Math.cos(a - .42), q[1] - s * Math.sin(a - .42)], q, [q[0] - s * Math.cos(a + .42), q[1] - s * Math.sin(a + .42)]], { c, w });
  };
  const sw = c => `<span class="sw" style="background:${c}"></span>`;
  const lab = (x, y, en, zh, d, o = {}) => div('lab' + (o.r ? ' r' : ''), `<div class="en" style="${o.c ? 'color:' + o.c : ''}">${o.sw ? sw(o.sw) : ''}${o.num ? `<span class="num">${o.num}</span>` : ''}${en}<span class="zh">${zh}</span></div>${d ? `<div class="d"${o.ind ? ' style="padding-left:23px"' : ''}>${d}</div>` : ''}`, x, y, o.r ? { left: 'auto', right: (1920 - x) + 'px' } : {});
  const arc3 = (c, r, y, a0, a1, n = 90) => Array.from({ length: n + 1 }, (_, i) => scr(P2(c, r, a0 + (a1 - a0) * i / n), y));
  const fmt = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

  // ─────────────── frame 1: the whole movement + colour key ───────────────
  if (f === 1) {
    div('', `<div class="kick">Fig. 1 &nbsp;·&nbsp; A mechanical watch, opened</div>
      <div class="t1" style="margin-top:26px">Three systems<br>keep the time.</div>
      <div class="zh zhl">动力、传动、调速：一块机械表里的三套系统</div>`, 112, 112);
    const key = [
      ['01', PAL.power, 'Power', '动力', 'A coiled mainspring stores the energy'],
      ['02', PAL.trans, 'Gear train', '传动', `Four wheel pairs gear it up ${RATIO.toLocaleString('en-US')}×`],
      ['03', PAL.reg, 'Regulator', '调速', 'Lets it out in even beats, five a second'],
    ];
    const y0 = 668, dy = 80;
    key.forEach(([n, c, en, zh, d], i) => lab(112, y0 + i * dy, en, zh, d, { sw: c, num: n, ind: true }));
    lab(112, y0 + 3 * dy + 4, '<span style="font-weight:500;font-size:17px">Frame</span>', '机板', 'Plate and bridges hold every arbor', { sw: PAL.neutral, ind: true });
    for (let i = 0; i < 2; i++) {                 // flow: power -> train -> regulator, down the swatches
      const x = 118.5, a = y0 + i * dy + 22, b = y0 + (i + 1) * dy - 6;
      line([[x, a], [x, b]], { c: '#B5AFA5', w: 1.2 }); head([x, a], [x, b], '#B5AFA5', 1.2, 5);
    }
    // numbered tags on the movement
    const tags = [
      ['01', PAL.power, scr(P2(G.B, G.gB.ra - .15, deg(172)), 1.97), [-70, -64]],
      ['02', PAL.trans, scr(P2(G.C, 5.6, deg(-95)), G.L.hi + G.L.th), [0, -92]],
      ['03', PAL.reg, scr(P2(G.BAL, G.rimO, deg(-20)), G.yBal + .48), [96, -70]],
    ];
    for (const [n, c, a, [dx, dy2]] of tags) {
      const t = [a[0] + dx, a[1] + dy2];
      const len = Math.hypot(dx, dy2), u = [dx / len, dy2 / len];
      line([a, [t[0] - u[0] * 15, t[1] - u[1] * 15]], { w: 1.2 }); dot(a);
      const d = document.createElement('div'); d.className = 'tag'; d.style.left = t[0] + 'px'; d.style.top = t[1] + 'px'; d.style.background = c; d.textContent = n; ov.appendChild(d);
    }
  }

  // ─────────────── frame 2: exploded by system ───────────────
  if (f === 2) {
    const Ly = G.LAYER;
    div('', `<div class="kick">Fig. 2 &nbsp;·&nbsp; Exploded by system</div>
      <div class="t2" style="margin-top:22px">One layer,<br>one system.</div>
      <div class="zh" style="font-size:18px;margin-top:14px">按系统拆开，一层一种颜色</div>`, 112, 112);
    const R = 1500;    // right label column
    const rows = [
      ['Bridges', '夹板', 'Hold every arbor from above', PAL.neutral, scr(G.cockFoot, G.yBal + 1.8 + Ly.bridge)],
      ['Regulator', '调速', 'Pallet fork and balance wheel', PAL.reg, scr(P2(G.BAL, G.rimO, deg(-10)), G.yBal + .48 + Ly.reg)],
      ['Gear train', '传动', 'Centre, third and seconds wheels', PAL.trans, scr(P2(G.F, 4.0, deg(-5)), G.L.hi + G.L.th + Ly.trans)],
      ['Power', '动力', 'Barrel, mainspring inside', PAL.power, scr(P2(G.B, G.gB.ra, deg(15)), 1.97 + Ly.power)],
      ['Main plate', '底板', 'Every arbor starts here', PAL.neutral, null],
    ];
    { // plate anchor: the right-most point of its front edge
      let best = null; for (const p of G.plateOutline) { const s = scr(p, 0); if (!best || s[0] > best[0]) best = s; }
      rows[4][4] = [best[0] - 30, best[1] + 6];
    }
    rows[3][4] = scr(P2(G.B, G.gB.ra, deg(178)), 1.97 + Ly.power);
    for (const [en, zh, d, c, a] of rows) {
      const y = a[1];
      if (en === 'Power') { line([a, [470, y]], { w: 1.1, op: .8 }); dot(a); lab(450, y - 11, en, zh, d, { sw: c, r: true }); continue; }
      line([a, [R - 22, y]], { w: 1.1, op: .8 }); dot(a);
      lab(R, y - 11, en, zh, d, { sw: c });
    }
    // the accent: the escape wheel, called out on the left
    const a = scr(P2(G.E, G.ESC_R + .1, deg(200)), G.L.lo + G.L.th + Ly.reg);
    const lx = 360, ly = a[1] - 64;
    line([a, [a[0] - 60, ly + 11], [lx + 300, ly + 11]], { c: PAL.accent, w: 1.4 }); dot(a, PAL.accent, 4);
    lab(lx + 290, ly, 'Escape wheel', '擒纵轮', `${TRAIN.escape} teeth. It lets the whole train<br>move one tooth at a time.`, { r: true, c: PAL.accent });
  }

  // ─────────────── frame 3: the parameter ───────────────
  if (f === 3) {
    const X0 = 1404;
    div('', `<div class="kick">Fig. 3 &nbsp;·&nbsp; Drag the wind</div>
      <div class="t2" style="margin-top:22px">More wind, wider swing.<br>Same beat.</div>
      <div class="zh" style="font-size:18px;margin-top:14px">上得越紧，摆幅越大；节拍不变</div>`, X0, 118);
    // readouts
    const rows = [
      ['Amplitude', '摆幅', `<span style="color:${PAL.reg}">${PHYS.A.toFixed(0)}</span><u>°</u>`, 'how far the balance swings'],
      ['Rate', '日差', `${fmt(PHYS.rate)}<u>s/day</u>`, 'vs. regulated at 300°'],
      ['Beat', '节拍', `${PHYS.bph.toLocaleString('en-US').replace(',', ' ')}<u>/h</u>`, 'set by the balance, not the spring'],
    ];
    rows.forEach(([k, zh, v, n], i) => div('ro', `<div><div class="k">${k}<span class="zh">${zh}</span></div><div class="note">${n}</div></div><div class="v">${v}</div>`, X0, 318 + i * 76));
    // chart: amplitude against wind
    const cx = X0, cy = 600, cw = 400, ch = 220, A0 = 220, A1 = 360;
    const X = s => cx + s * cw, Y = A => cy + ch - (A - A0) / (A1 - A0) * ch;
    const g = el('g', {});
    for (const A of [240, 300, 360]) {
      el('line', { x1: cx, x2: cx + cw, y1: Y(A), y2: Y(A), stroke: A === 300 ? '#B9B3A9' : '#E0DBD2', 'stroke-width': 1, 'stroke-dasharray': A === 300 ? '4 4' : 'none' }, g);
      div('mono', `${A}°`, cx + cw + 10, Y(A) - 7, { fontSize: '12px', color: '#8C867D' });
    }
    el('line', { x1: cx, x2: cx + cw, y1: cy + ch, y2: cy + ch, stroke: '#25282D', 'stroke-width': 1.1 }, g);
    for (const s of [0, .5, 1]) div('mono', `${s * 100}%`, X(s) - (s === 1 ? 30 : s ? 14 : 0), cy + ch + 10, { fontSize: '12px', color: '#8C867D' });
    const curve = Array.from({ length: 81 }, (_, i) => { const s = i / 80; return [X(s), Y(solve(s).A)]; });
    line(curve, { c: PAL.reg, w: 2.6 });
    const pt = [X(SLIDER), Y(PHYS.A)];
    line([[pt[0], cy + ch], pt], { c: PAL.accent, w: 1.2, dash: '3 4' });
    el('circle', { cx: pt[0], cy: pt[1], r: 6.5, fill: PAL.accent, stroke: PAL.paper, 'stroke-width': 2.5 });
    div('', `<span style="font:500 15px Inter;color:#25282D">Amplitude vs. wind</span><span class="zh" style="font-size:13px;margin-left:8px">摆幅随上弦变化</span>`, cx, cy - 32, {});
    div('', 'regulated', cx + 6, Y(300) - 20, { font: '400 12px "Inter"', color: '#8C867D' });

    // the balance: amplitude arc, with the range ticks for an empty and a full spring
    const rest = Math.atan2(G.PIV[1] - G.BAL[1], G.PIV[0] - G.BAL[0]);
    const rA = G.rimO + 1.0, yA = G.yBal + .5, aEnd = rest + deg(PHYS.A);
    const arc = arc3(G.BAL, rA, yA, rest, aEnd, 160);
    line(arc, { c: PAL.reg, w: 2.6 }); head(arc[arc.length - 4], arc[arc.length - 1], PAL.reg, 2.6, 11);
    for (const s of [0, 1]) {
      const a = rest + deg(solve(s).A), p = scr(P2(G.BAL, rA - .45, a), yA), q = scr(P2(G.BAL, rA + .45, a), yA);
      line([p, q], { c: PAL.reg, w: 1.6, op: .7 });
    }
    const mid = scr(P2(G.BAL, rA + 2.1, rest + deg(PHYS.A * .66)), yA);
    div('mono', `${PHYS.A.toFixed(0)}°`, mid[0] - 22, mid[1] - 12, { fontSize: '20px', color: PAL.reg });

    // gear train: every wheel turns at a speed fixed by the tooth counts
    const spin = [
      [G.C, 6.6, G.L.hi + G.L.th, '1 rev / h', deg(-150)],
      [G.T, 5.5, G.L.lo + G.L.th, '7.5 min', deg(-75)],
      [G.F, 4.6, G.L.hi + G.L.th, '1 min', deg(-60)],
      [G.E, 3.1, G.L.lo + G.L.th, '6 s', deg(140)],
    ];
    for (const [c, r, y, t, a0] of spin) {
      const pts = arc3(c, r, y, a0, a0 + deg(55), 40);
      line(pts, { w: 1.3, op: .85 }); head(pts[pts.length - 3], pts[pts.length - 1], PAL.ink, 1.3, 8);
      const lp = scr(P2(c, r + 1.4, a0 + deg(27)), y);
      div('mono', t, lp[0] - 30, lp[1] - 8, { fontSize: '13px', color: '#5E5A54', width: '60px', textAlign: 'center' });
    }

    // the slider, right under the barrel, wired to the spring
    const sp = scr(P2(G.B, G.rHub + .4 + SLIDER * 9 * .27 * .55, deg(100)), 1.6);
    const tw = 420, ty = 930, tx = Math.round(sp[0] - SLIDER * tw), kx = tx + SLIDER * tw;
    line([[kx, ty - 15], sp], { c: PAL.accent, w: 1.4 });
    dot(sp, PAL.accent, 4.2);
    div('', `<span style="font:600 19px Inter">Mainspring wind</span><span class="zh" style="font-size:15px;margin-left:9px">上弦</span>`, tx, ty - 62);
    div('mono', `${Math.round(SLIDER * 100)}%`, tx + tw - 62, ty - 66, { fontSize: '24px', color: PAL.accent, width: '62px', textAlign: 'right' });
    el('rect', { x: tx, y: ty - 3, width: tw, height: 6, rx: 3, fill: '#DCD7CE' });
    el('rect', { x: tx, y: ty - 3, width: SLIDER * tw, height: 6, rx: 3, fill: PAL.accent });
    el('circle', { cx: kx, cy: ty, r: 13, fill: '#FFFFFF', stroke: PAL.accent, 'stroke-width': 3 });
    div('mono', `torque ${(PHYS.M * 1000).toFixed(2)} mN·m &nbsp;&nbsp; reserve ${PHYS.reserve.toFixed(0)} h`, tx, ty + 26, { fontSize: '13px', color: '#8C867D' });
  }
}
