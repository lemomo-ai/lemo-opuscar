// render(t): pick the shot, draw it on the black emulsion, then the light pass: depth of field, halation, dust,
// flicker, a little weave, grain; then the bilingual subtitles. Everything steps on twos (15 drawings a second).
'use strict';
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const SC = mk(W, H), sctx = SC.getContext('2d');
const TMP = mk(W, H), tctx = TMP.getContext('2d');
const Q = new URLSearchParams(location.search);
// a part of the same timeline: ?from=a&to=b renders [a, b) (for checking one stretch)
const FROM = +(Q.get('from') || 0), TO = +(Q.get('to') || T.DUR);
window.DUR = TO - FROM;
let TL = null;

function shotAt(t){
  if (t < T.s3) return shot12;
  if (t < T.s4) return shot3;
  if (t < T.s5) return shot4;
  if (t < T.s6) return shot5;
  return shot678;
}
function applyDOF(d){
  tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.globalCompositeOperation = 'copy'; tctx.filter = `blur(${d.r}px)`; tctx.drawImage(SC, 0, 0); tctx.filter = 'none';
  tctx.globalCompositeOperation = 'destination-in';
  const g = tctx.createRadialGradient(d.x, d.y, d.band * .5, d.x, d.y, d.band * 1.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  tctx.fillStyle = g; tctx.fillRect(0, 0, W, H);
  tctx.globalCompositeOperation = 'source-over';
  sctx.drawImage(TMP, 0, 0);
}
// subtitles: Chinese line (marker hand) over the English line (Jost), lower left, cut in left to right
const SUBX = 96, SUBY = 936;
function subtitle(t){
  if (!TL) return [];
  const L = TL.lines.find(l => t >= l.c0 && t < l.c1); if (!L) return [];
  const zh = txtImg(L.zh, MARK, 42, CREAM), en = txtImg(L.en, JOST, 29, '#e6d8b8');
  const p = eo(seg(t, L.c0, L.c0 + .3)), out = 1 - seg(t, L.c1 - .18, L.c1);
  setG(ctx);
  ctx.save(); ctx.globalAlpha = out;
  ctx.beginPath(); ctx.rect(SUBX - 10, SUBY - 10, (Math.max(zh.width, en.width) + 20) * p, 160); ctx.clip();
  ctx.drawImage(zh, SUBX - 12, SUBY - 6); ctx.drawImage(en, SUBX - 12, SUBY + 52);
  ctx.restore();
  return [{ id: 'sub-' + L.id, text: L.zh + ' / ' + L.en, x0: SUBX, y0: SUBY, x1: SUBX + Math.max(zh.width, en.width) - 24, y1: SUBY + 52 + en.height * .9 }];
}
let lastTexts = [];
window.READY = false;
window.render = (t0) => {
  const t = t0 + FROM;
  const dn = Math.floor(t * 15 + 1e-6), tq = Math.max(0, dn / 15);
  setG(sctx);
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over'; sctx.filter = 'none';
  sctx.drawImage(EM[dn % 4], 0, 0);
  const res = shotAt(tq)(tq, dn) || {};
  setG(sctx);
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1;
  if (res.dof && res.dof.r > .3) applyDOF(res.dof);
  const wx = Math.sin(dn * 1.7) * .9, wy = Math.cos(dn * 1.3) * 1.1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(SC, wx, wy);
  ctx.save(); ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.save(); ctx.filter = 'blur(28px)'; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .2; ctx.drawImage(SC, wx, wy); ctx.restore();
  ctx.drawImage(DUST[dn % DUST.length], 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * 1.0);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${.05 * h1(dn * 3.3)})`; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(GRAIN[Math.floor(t * 30) % GRAIN.length], 0, 0);
  subtitle(t);                                   // subtitles follow the subtitle rule (≥ 1.8 s and ≥ line + 0.6 s, timeline.py), not readcheck
  lastTexts = res.texts || [];
  setG(sctx);
};
window.TEXTS = (t) => { window.render(t); return lastTexts.map(b => ({ id: b.id, text: b.text, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })); };

// ---------------- sound events (exported by core/render/events.mjs) ----------------
function buildEV(){
  const ev = [];
  ev.push({ t: .15, type: 'cut', dur: 1.0, pan0: -1, pan1: 1, v: 1 });             // the horizon
  ev.push({ t: T.zoom0, type: 'whoosh', dur: 1.6, v: .8 });
  let acc = 0; FSTR.forEach((s, k) => { const a = T.cut0 + (T.cut1 - T.cut0) * acc / FSTR_TOT; acc += FSTR_L[k]; const b = T.cut0 + (T.cut1 - T.cut0) * acc / FSTR_TOT; ev.push({ t: a, type: 'cut', dur: b - a, pan0: -.2, pan1: .1, v: .8 }); });
  for (let i = 0; i < 12; i++) ev.push({ t: T.rings0 + (T.rings1 - T.rings0) * i / 12, type: 'tick', i, v: .5 });
  ev.push({ t: T.blink, type: 'blink' });
  ev.push({ t: 9.0, type: 'flick', v: .5 });
  [10.95, 11.95, 13.15].forEach(t => ev.push({ t, type: 'flick', v: 1 }));
  ev.push({ t: T.tilt0, type: 'whoosh', dur: 1.1, v: .7 });
  ev.push({ t: 20.6, type: 'eye' });
  ev.push({ t: T.jaw0, type: 'jaw', dur: T.s5 - T.jaw0 });
  ev.push({ t: T.s5, type: 'cut', dur: .4, pan0: 0, pan1: 0, v: .9 });                 // the divider
  for (let i = 0; i < 12; i++) ev.push({ t: LIT(i), type: 'light', i });
  ev.push({ t: T.match0, type: 'match', dur: T.match1 - T.match0 });
  ev.push({ t: T.merge, type: 'whoosh', dur: .5, v: .6 });
  ev.push({ t: T.snap, type: 'snap' });
  ev.push({ t: T.snap + .35, type: 'leave', dur: T.s6 - T.snap - .35 });
  ev.push({ t: T.bite, type: 'bite' });
  ev.push({ t: T.pull0, type: 'pull', dur: T.pull1 - T.pull0 });
  ev.push({ t: T.dawn0, type: 'cut', dur: T.dawn1 - T.dawn0, pan0: -1, pan1: 1, v: 1 });
  ev.push({ t: T.sink0, type: 'sink', dur: T.sink1 - T.sink0 });
  [[0, .55], [.3, .3], [.45, .25], [.65, .4]].forEach(([d, l]) => ev.push({ t: T.card + d, type: 'cut', dur: l, pan0: 0, pan1: .5, v: .55 }));
  ev.push({ t: 50.5, type: 'last' }); ev.push({ t: 51.2, type: 'last' });
  return ev;
}

(async () => {
  for (let i = 0; i < 4; i++){ EM.push(makeEmulsion(9 + i * 17)); DUST.push(makeDust(55 + i * 13)); }
  for (let i = 0; i < 3; i++) GRAIN.push(makeGrain(7 + i));
  for (const [fam, url] of [['MARK', 'fonts/marker.woff2'], ['MONO', 'fonts/mono.woff2'], ['JOST', 'fonts/jost.woff2']]){ const f = new FontFace(fam, `url('${url}')`, fam === 'JOST' ? { weight: '100 900' } : {}); await f.load(); document.fonts.add(f); }
  TL = await (await fetch('timeline.json')).json();
  window.EV = buildEV();
  window.READY = true;
})();
