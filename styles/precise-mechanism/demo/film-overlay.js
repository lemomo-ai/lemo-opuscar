// The film's text layer. Rules (STYLE.md §4, "Three levels only"):
//   · one primary per shot: a headline, or the label of the part being explained (name 30 px ink + an 18 px line)
//   · secondary: what was already explained: name 22 px mid grey; its 18 px line greys, lingers, then goes
//   · tertiary: the figure line and the mono speed tags
//   · labels grow out of the part (leader → colour dot → text), are re-projected every frame, and are kept out of the subtitle band
//   · subtitles: bottom left, Chinese 34 px over English 22 px, never over the subject
const NS = 'http://www.w3.org/2000/svg';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = u => u * u * (3 - 2 * u);
const eo = u => 1 - Math.pow(1 - u, 3);
const back = u => { const s = 1.9; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
const mixHex = (a, b, k) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',') + ')';
};
const INK = '#25282D', MID = '#6F6A62', GREY = '#8C867D', SUBC = '#5E5A54';

export function makeOverlay({ PAL, GEO: G, scr, CUE, SHOTS, SUBS, STATE }) {
  const ov = document.getElementById('ov'), svg = document.getElementById('lines');
  const div = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; ov.appendChild(d); return d; };

  // ── figure line (tertiary), one per shot group
  const KICK = [
    [0, CUE.dialCut, 'Fig. 1 &nbsp;·&nbsp; A pocket watch &nbsp;·&nbsp; real time'],
    [CUE.dialCut, CUE.explode - .2, 'Fig. 2 &nbsp;·&nbsp; The movement, cut open &nbsp;·&nbsp; shown at 1/4 speed'],
    [CUE.explode - .2, CUE.closeup, 'Fig. 3 &nbsp;·&nbsp; Exploded by system'],
    [CUE.closeup, CUE.descend - 1.6, 'Fig. 4 &nbsp;·&nbsp; The escapement &nbsp;·&nbsp; 1/4 speed, then 1/40'],
    [CUE.descend - 1.6, 99, 'Fig. 5 &nbsp;·&nbsp; The whole watch'],
  ].map(([a, b, h]) => { const d = div('o kick fk', h); d.style.left = '112px'; d.style.top = '96px'; return { a, b, d }; });

  // ── headlines (primary while on, then secondary, then gone)
  const HEAD = [
    { id: 'q', on: CUE.question, back: 99, out: CUE.dialCut - .1, html: 'How does it<br>keep time?', cls: 't1' },
    { id: 'three', on: CUE.title, back: CUE.barrelCut + .3, out: CUE.train - .3, html: 'Three systems.', cls: 't1' },
    { id: 'ratio', on: CUE.ratio + .2, back: 99, out: CUE.explode - .3, cls: 'ratio',
      html: `<div class="big">4,800<span>×</span></div><div class="rl">from the barrel to the escape wheel</div><div class="rm">teaching movement &nbsp;64/8 · 64/8 · 60/8 · 60/6</div>` },
    { id: 'end', on: CUE.final, back: 99, out: 99, html: 'One tick<br>at a time.', cls: 't1' },
  ].map(h => { const d = div('o head ' + h.cls, h.html); d.style.left = '112px'; d.style.top = h.id === 'ratio' ? '560px' : '136px'; return { ...h, d }; });

  // ── part labels
  const lifted = k => STATE.lift(k);
  const LABELS = [
    // pin: where the label sits on screen in a shot (the leader runs from the part to it); otherwise anchor + off
    { id: 'power', name: 'Power', sub: '1 turn every 8 h', col: PAL.power, on: CUE.power + .35, back: CUE.train + .2, out: CUE.explode - .3,
      side: 'left', pin: t => t < 18.9 ? [400, 360] : null,
      at: () => scr(G.P2D(G.B, G.gB.ra - .15, G.deg(150)), 1.97 + lifted('power')), off: [-70, -30] },
    { id: 'trans', name: 'Gear train', sub: 'each step turns faster', col: PAL.trans, on: CUE.train + .3, back: CUE.reg + .2, out: CUE.explode - .3,
      side: 'right', pin: t => null,
      at: () => scr(G.P2D(G.C, 5.6, G.deg(-95)), G.L.hi + G.L.th + lifted('trans')), off: [30, -110] },
    { id: 'reg', name: 'Regulator', sub: '', col: PAL.reg, on: CUE.reg + .3, back: CUE.ratio + 1.2, out: CUE.explode - .3,
      side: t => t < 18.9 ? 'right' : 'above', pin: t => t < 18.9 ? [1380, 200] : null,
      at: () => scr(G.P2D(G.BAL, G.rimO, G.deg(-20)), G.yBal + .48 + lifted('reg')), off: [40, -110] },
    { id: 'fourth', name: 'Seconds wheel', sub: t => `${Math.round(1 + 59 * rush(t))} rpm &nbsp;<span class="was">normally 1</span>`, subText: 'normally 1 rpm', col: PAL.trans,
      on: CUE.rush0 + .5, back: 99, out: CUE.rush1 - .1, side: 'left', pin: () => [700, 420],
      at: () => scr(G.P2D(G.F, 4.6, G.deg(-60)), G.L.hi + G.L.th + lifted('trans')), off: [70, -60] },
    { id: 'escape', name: 'Escape wheel', sub: '½ tooth per beat', col: PAL.accent, accent: true, on: CUE.accent + .25, back: 99, out: CUE.closeup - .15, side: 'right', pin: t => [1560, 330],
      at: () => scr(G.P2D(G.E, G.ESC_R, G.deg(-40)), G.L.lo + G.L.th + lifted('reg')), off: [110, -70] },
    { id: 'balance', name: 'Balance', sub: '5 beats/s &nbsp;·&nbsp; 18,000/h', subText: '5 beats/s 18,000/h', col: PAL.reg, on: CUE.closeup + .8, back: 99, out: 37.3, side: 'right', pin: t => [1290, 800],
      at: () => scr(G.P2D(G.BAL, G.rimO, G.deg(-35)), G.yBal + .48), off: [90, -80] },
  ].map(l => {
    const dot = div('dot'); dot.style.background = l.col;
    const box = div('o co', `<div class="nm">${l.name}</div><div class="d">${typeof l.sub === 'string' ? l.sub : ''}</div>`);
    return { ...l, dot, box, nm: box.children[0], d: box.children[1] };
  });
  let rushFn = () => 0; const rush = t => rushFn(t);

  // ── speed tags in the 4,800× shot (tertiary data, all on screen together for the comparison)
  const TAGS = [            // the two ends of the train: 8 h ÷ 6 s = 4,800
    { at: () => scr(G.P2D(G.B, G.gB.ra + .2, G.deg(115)), 1.9), off: [-40, 70], t: 'barrel &nbsp;1 turn / 8 h' },
    { at: () => scr(G.P2D(G.E, G.ESC_R, G.deg(120)), 1.4), off: [10, 120], t: 'escape wheel &nbsp;1 turn / 6 s' },
].map((g, i) => ({ ...g, on: CUE.ratio + .6 + i * .35, out: CUE.explode - .3, d: div('o stag', g.t) }));

  // ── the credit: an engineering drawing's title block, ruled in ink, bottom left (where the subtitles were) once the narration ends
  const TB_ROWS = [
    ['Title', '<span class="v1">Three systems keep the time</span>', 'Three systems keep the time'],
    ['Style', '<span class="v2">Color-Coded Mechanism</span><span class="v2z">分色机械图解</span>', 'Color-Coded Mechanism 分色机械图解'],
    ['Drawn by', '<span class="v3">LemoLab × Claude Opus 5.5</span>', 'LemoLab × Claude Opus 5.5'],
  ];
  const tb = div('o tb', TB_ROWS.map(([k, v]) => `<div class="row"><i class="rule"></i><span class="k">${k}</span><span class="v">${v}</span></div>`).join('') + '<i class="rule end"></i>');
  const tbRows = [...tb.querySelectorAll('.row')], tbEnd = tb.querySelector('.rule.end');
  // ── subtitles
  const sub = div('o subs', '<div class="zh"></div><div class="en"></div>');
  const NOSUBS = new URLSearchParams(location.search).has('nosubs');      // ?nosubs: posters and gallery stills carry no subtitles
  const sZh = sub.children[0], sEn = sub.children[1];

  const cues = LABELS.map(l => ({ t: l.on, id: l.id })).concat(TB_ROWS.map((r, i) => ({ t: CUE.credit + i * .1, id: 'credit-' + i })));

  function labelState(t, l) {
    return { lead: eo(seg(t, l.on, l.on + .3)), pop: seg(t, l.on + .15, l.on + .42), txt: ss(seg(t, l.on + .22, l.on + .58)),
      back: ss(seg(t, l.back, l.back + .5)), out: ss(seg(t, l.out, l.out + .3)) };
  }

  function update(t, M) {
    // figure line
    for (const k of KICK) k.d.style.opacity = ss(seg(t, k.a, k.a + .4)) * (1 - ss(seg(t, k.b - .3, k.b)));
    // headlines
    for (const h of HEAD) {
      const on = ss(seg(t, h.on, h.on + .55)), bk = ss(seg(t, h.back, h.back + .5)), out = ss(seg(t, h.out, h.out + .4));
      h.d.style.display = t >= h.on && out < 1 ? 'block' : 'none';
      h.d.style.opacity = on * (1 - out);
      h.d.style.transform = `translateY(${(1 - on) * 14}px) scale(${1 - .15 * bk})`;
      h.d.style.color = mixHex(INK, GREY, bk);
    }
    // labels
    svg.innerHTML = '';
    for (const L of LABELS) {
      const st = labelState(t, L), vis = t >= L.on && st.out < 1;
      L.dot.style.display = L.box.style.display = vis ? 'block' : 'none';
      if (!vis) continue;
      const a = L.at(), side = typeof L.side === 'function' ? L.side(t) : L.side, pin = L.pin ? L.pin(t) : null;
      let tc = pin || [a[0] + L.off[0], a[1] + L.off[1]];
      const inFrame = ss(clamp(1 - (Math.max(-a[0], a[0] - 1920, -a[1], a[1] - 900, 0) - 160) / 160));   // a part leaving the frame takes its label with it
      if (inFrame <= 0) { L.dot.style.display = L.box.style.display = 'none'; continue; }
      tc = [clamp(tc[0], 140, 1780), clamp(tc[1], 150, 820)];               // never in the subtitle band, never off frame
      const v = [tc[0] - a[0], tc[1] - a[1]], len = Math.hypot(v[0], v[1]) || 1, u = [v[0] / len, v[1] / len];
      const end = [tc[0] - u[0] * 11, tc[1] - u[1] * 11];
      const p = [a[0] + (end[0] - a[0]) * st.lead, a[1] + (end[1] - a[1]) * st.lead];
      const op = (1 - .5 * st.back) * (1 - st.out) * inFrame;
      const ln = document.createElementNS(NS, 'path');
      ln.setAttribute('d', `M${a[0].toFixed(2)},${a[1].toFixed(2)} L${p[0].toFixed(2)},${p[1].toFixed(2)}`);
      for (const [k, val] of Object.entries({ fill: 'none', stroke: L.accent ? PAL.accent : INK, 'stroke-width': 1.25, 'stroke-linecap': 'round', opacity: op })) ln.setAttribute(k, val);
      svg.appendChild(ln);
      const ad = document.createElementNS(NS, 'circle');
      for (const [k, val] of Object.entries({ cx: a[0].toFixed(2), cy: a[1].toFixed(2), r: 3.4, fill: L.accent ? PAL.accent : INK, stroke: PAL.paper, 'stroke-width': 1.6, opacity: op })) ad.setAttribute(k, val);
      svg.appendChild(ad);
      const sc = st.pop > 0 ? back(st.pop) * (1 - .25 * st.back) : 0;
      L.dot.style.left = tc[0].toFixed(2) + 'px'; L.dot.style.top = tc[1].toFixed(2) + 'px';
      L.dot.style.transform = `scale(${sc})`; L.dot.style.opacity = (1 - st.out) * inFrame;
      const fs = 30 - 8 * st.back, half = fs * .55, slide = (1 - st.txt) * 12;
      const bx = L.box;
      bx.style.opacity = st.txt * (1 - st.out) * inFrame;
      L.nm.style.fontSize = fs.toFixed(2) + 'px';
      L.nm.style.fontWeight = String(Math.round(600 - 80 * st.back));
      L.nm.style.color = L.accent ? mixHex(PAL.accent, MID, st.back) : mixHex(INK, MID, st.back);
      if (typeof L.sub === 'function') L.d.innerHTML = L.sub(t);
      L.d.style.opacity = 1 - ss(seg(t, L.back + 1.25, L.back + 1.65));
      L.d.style.color = mixHex(SUBC, GREY, st.back);
      bx.style.left = bx.style.right = bx.style.top = bx.style.bottom = 'auto'; bx.style.textAlign = side === 'right' ? 'left' : 'right';
      if (side === 'left') { bx.style.right = (1920 - tc[0] + 20).toFixed(2) + 'px'; bx.style.top = (tc[1] - half).toFixed(2) + 'px'; bx.style.transform = `translateX(${-slide}px)`; }
      else if (side === 'right') { bx.style.left = (tc[0] + 20).toFixed(2) + 'px'; bx.style.top = (tc[1] - half).toFixed(2) + 'px'; bx.style.transform = `translateX(${slide}px)`; }
      else { bx.style.right = (1920 - tc[0] - 10).toFixed(2) + 'px'; bx.style.bottom = (1080 - tc[1] + 22).toFixed(2) + 'px'; bx.style.transform = `translateY(${slide}px)`; }
    }
    // speed tags
    for (const g of TAGS) {
      const o = ss(seg(t, g.on, g.on + .35)) * (1 - ss(seg(t, g.out, g.out + .3)));
      g.d.style.display = o > 0 ? 'block' : 'none'; if (!o) continue;
      const a = g.at(), p = [a[0] + g.off[0], a[1] + g.off[1]]; g.d.style.opacity = o;
      g.d.style.left = (p[0] - 8).toFixed(2) + 'px'; g.d.style.top = (p[1] - 2 + (1 - o) * 6).toFixed(2) + 'px';
      const ln = document.createElementNS(NS, 'path');
      ln.setAttribute('d', `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${p[0].toFixed(1)},${(p[1] - 6).toFixed(1)}`);
      for (const [k, val] of Object.entries({ fill: 'none', stroke: INK, 'stroke-width': 1.1, opacity: o * .7 })) ln.setAttribute(k, val);
      svg.appendChild(ln);
    }
    // title block: each rule draws from the left, then its row's text fades in
    const tOn = t >= CUE.credit;
    tb.style.display = tOn ? 'block' : 'none';
    if (tOn) {
      tbRows.forEach((r, i) => {
        const a = CUE.credit + i * .1, rule = eo(seg(t, a, a + .3)), txt = ss(seg(t, a + .08, a + .33));
        r.children[0].style.transform = `scaleX(${rule})`;
        r.children[1].style.opacity = r.children[2].style.opacity = txt;
        r.children[2].style.transform = `translateX(${(1 - txt) * 8}px)`;
      });
      tbEnd.style.transform = `scaleX(${eo(seg(t, CUE.credit + .45, CUE.credit + .75))})`;
    }
    // subtitles: a short fade, one cue at a time
    const s = SUBS.find(c => t >= c.t0 && t < c.t1);
    if (s && !NOSUBS) {
      if (sZh.textContent !== s.zh) { sZh.textContent = s.zh; sEn.textContent = s.en; }
      sub.style.opacity = ss(seg(t, s.t0, s.t0 + .15)) * (1 - ss(seg(t, s.t1 - .15, s.t1)));
      sub.style.display = 'block';
    } else sub.style.display = 'none';
  }

  function texts(t) {
    const out = [];
    const push = (id, el, text) => {
      if (!el || el.offsetParent === null) return;
      let o = 1; for (let e = el; e && e !== ov; e = e.parentElement) o *= +getComputedStyle(e).opacity;
      if (o < .5) return;
      const r = el.getBoundingClientRect(); out.push({ id, text, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    };
    for (const h of HEAD) {
      if (h.id === 'ratio') [...h.d.children].forEach((c, i) => push('ratio-' + i, c, c.textContent));
      else push('head-' + h.id, h.d, h.d.textContent);
    }
    for (const L of LABELS) { push(L.id + '-name', L.nm, L.name); push(L.id + '-d', L.d, L.subText || L.d.textContent); }
    // a bilingual row is read in either language, so each language is its own piece
    tbRows.forEach((r, i) => {
      const parts = [...r.children[2].children];
      if (parts.length > 1) parts.forEach((p, j) => push('credit-' + i + '-' + j, p, p.textContent));
      else push('credit-' + i, r.children[2], TB_ROWS[i][2]);
    });
    return out;
  }
  return { update, texts, cues, setRush: f => { rushFn = f; } };
}
