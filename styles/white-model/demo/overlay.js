// 2D layer over the model: readouts (left third), pins anchored to the model through the camera, the shadow range line,
// the bilingual subtitle strip, the identity label and the end card. Every text that must be read registers in TX (readcheck).
import { clamp, lerp, seg, ss, eo } from '/core/lib.js';

export const W = 1920, H = 1080;
const F = { sc3: '300 {}px SC', sc5: '500 {}px SC', num: '200 {}px IT', num4: '400 {}px IT', mono: '400 {}px PM' };
export const font = (k, px) => F[k].replace('{}', px);
export const SUB = { zh: ['sc5', 36], en: ['num4', 30], safe: 1500 };

export function makeOverlay(canvas) {
  const g = canvas.getContext('2d');
  let TX = [];
  const begin = () => { g.clearRect(0, 0, W, H); TX = []; };
  function txt(id, s, x, y, k, px, col, a = 1, o = {}) {
    if (a <= .001) return 0;
    g.save(); g.globalAlpha = a; g.font = font(k, px); g.fillStyle = col; g.textBaseline = 'alphabetic';
    if (o.ls) g.letterSpacing = o.ls + 'px';
    if (o.shadow) { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = o.shadow; }
    const w = g.measureText(s).width, xx = o.right ? x - w : o.center ? x - w / 2 : x;
    g.fillText(s, xx, y); g.restore();
    if (id && a > .98) TX.push({ id, text: s, pass: !!o.pass, x0: xx, y0: y - px * .9, x1: xx + w, y1: y + px * .25 });
    return w;
  }
  const width = (s, k, px, ls = 0) => { g.save(); g.font = font(k, px); g.letterSpacing = ls + 'px'; const w = g.measureText(s).width; g.restore(); return w; };
  const env = (t, t0, t1, fin = .35, fout = .3) => Math.min(eo(seg(t, t0, t0 + fin)), 1 - ss(seg(t, t1 - fout, t1)));

  // soft dark field behind the left-third readouts and the bottom subtitle strip
  function scrims(a, sub) {
    if (a > 0) {
      const gr = g.createRadialGradient(300, 600, 40, 300, 600, 640);
      gr.addColorStop(0, `rgba(4,5,8,${.6 * a})`); gr.addColorStop(.55, `rgba(4,5,8,${.36 * a})`); gr.addColorStop(1, 'rgba(4,5,8,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    if (sub > 0) {
      const g3 = g.createLinearGradient(0, H, 0, H - 210); g3.addColorStop(0, `rgba(4,5,8,${.62 * sub})`); g3.addColorStop(1, 'rgba(4,5,8,0)');
      g.fillStyle = g3; g.fillRect(0, H - 210, W, 210);
    }
  }

  // readout: index + layer name, one figure (+unit), one label, one source line, an optional legend
  function readout(t, t0, t1, o) {
    const a = env(t, t0, t1); if (a <= 0) return;
    const k = eo(seg(t, t0, t0 + .5)), dy = (1 - k) * 22, X = 96, Y = 560 + dy;
    g.save(); g.globalAlpha = a; g.fillStyle = o.col; g.fillRect(X, Y - 122, 46 * k + 2, 2); g.restore();
    txt(o.id + 'i', o.idx, X, Y - 136, 'mono', 20, 'rgba(235,238,242,.72)', a, { ls: 2 });
    txt(o.id + 'n', o.name, X + 64, Y - 135, 'sc5', 24, '#eef1f4', a, { ls: 3 });
    const w = txt(o.bigId === null ? null : o.id + 'b', o.big, X - 6, Y + 4, 'num', 128, '#ffffff', a, { shadow: 18 });
    if (o.unit) txt(o.bigId === null ? null : o.id + 'u', o.unit, X + w + 6, Y + 4, 'num', 60, '#ffffff', a, { shadow: 12 });
    if (o.label) txt(o.id + 'l', o.label, X, Y + 54, 'sc5', 32, '#f4f5f6', a, { shadow: 10 });
    if (o.note) txt(o.id + 's', o.note, X, Y + 92, 'sc3', 21, 'rgba(225,230,236,.78)', a, { ls: 1 });
    if (o.legend) o.legend(X, Y + 122, a);
  }

  // pin: a hairline from a point on the model up to a tag on a dark plate
  function pin(t, t0, t1, p, o) {
    const a = env(t, t0, t1, .3, .3); if (a <= 0 || !p) return;
    const [x, y] = p;
    const L = (o.len || 110) * eo(seg(t, t0, t0 + .45)), x2 = x + (o.dx || 0), y2 = y - L;
    g.save(); g.globalAlpha = a;
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = o.col || '#ffffff'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    g.fillStyle = o.col || '#ffffff'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    g.restore();
    const ta = a * seg(t, t0 + .15, t0 + .4), left = !!o.left;
    const lx = left ? x2 - 12 : x2 + 12;
    let w = width(o.text, 'sc5', 26); if (o.sub) w = Math.max(w, width(o.sub, 'sc5', 20));
    g.save(); g.globalAlpha = ta * .62; g.fillStyle = '#05060a'; g.fillRect(left ? lx - w - 10 : lx - 10, y2 - 20, w + 20, o.sub ? 66 : 38); g.restore();
    txt(o.id, o.text, lx, y2 + 8, 'sc5', 26, '#ffffff', ta, { shadow: 10, right: left });
    if (o.sub) txt(o.id + 's', o.sub, lx, y2 + 38, 'sc5', 20, 'rgba(240,242,245,.9)', ta, { shadow: 8, right: left });
  }

  // a measured line on the model: grows from A to B, ticks every `tick` of model length, reading at the tip
  function rangeLine(t, t0, t1, tOut, pts, o) {
    const a = 1 - ss(seg(t, tOut - .3, tOut)); if (t < t0 || a <= 0) return;
    const k = eo(seg(t, t0, t1));
    const n = pts.length - 1, m = Math.max(1, Math.round(n * k));
    g.save(); g.globalAlpha = a; g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; g.beginPath(); pts.slice(0, m + 1).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.strokeStyle = o.col; g.lineWidth = 2.4; g.beginPath(); pts.slice(0, m + 1).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    for (const i of o.ticks) if (i <= m) { const [x, y] = pts[i]; g.fillStyle = o.col; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    const [tx, ty] = pts[m]; g.fillStyle = '#fff'; g.beginPath(); g.arc(tx, ty, 5, 0, 7); g.fill();
    g.restore();
    return pts[m];
  }

  // subtitle strip: Chinese line above, English line below, both single lines centred at the bottom
  function subtitle(t, cue) {
    if (!cue) return;
    const a = Math.min(seg(t, cue.t0, cue.t0 + .12), 1 - seg(t, cue.t1 - .12, cue.t1)); if (a <= 0) return;
    txt(null, cue.zh, W / 2, H - 92, ...SUB.zh, '#ffffff', a, { center: true, shadow: 12 });
    txt(null, cue.en, W / 2, H - 46, ...SUB.en, 'rgba(236,240,244,.92)', a, { center: true, shadow: 10 });
  }

  // end card: over the white model, left-aligned block
  function endCard(t, t0, dur) {
    const a = Math.min(eo(seg(t, t0, t0 + .25)), 1); if (a <= 0) return;   // subtitles are checked by their .srt, the card here
    const k = eo(seg(t, t0, t0 + .9)), X = 120, Y = 470;
    const gr = g.createLinearGradient(0, 0, 1100, 0);
    gr.addColorStop(0, `rgba(6,7,10,${.7 * a})`); gr.addColorStop(.6, `rgba(6,7,10,${.42 * a})`); gr.addColorStop(1, 'rgba(6,7,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 1100, H);
    txt('end_zh', '被炸平的城市怎样长回来', X, Y, 'sc5', 64, '#ffffff', a, { ls: 4 });
    txt('end_en', 'How a Flattened City Grew Back', X, Y + 58, 'num', 40, 'rgba(240,243,246,.92)', a);
    g.save(); g.globalAlpha = a; g.fillStyle = '#ffa13d'; g.fillRect(X, Y + 96, 120 * k, 2); g.restore();
    txt('end_style', '白模投影 · PROJECTION ON WHITE MODEL', X, Y + 140, 'mono', 22, 'rgba(230,234,240,.85)', a, { ls: 2 });
    txt('end_data', '3DBAG · BAG · BGT · 鹿特丹市档案馆', X, Y + 176, 'sc3', 21, 'rgba(225,230,236,.7)', a, { ls: 1 });
    // licence credit (fine print)
    txt('end_lic', '3DBAG by 3DGI and the 3D geoinformation research group,', X, Y + 206, 'mono', 17, 'rgba(225,230,236,.72)', a, { pass: true });
    txt('end_lic2', 'TU Delft, CC BY 4.0', X, Y + 229, 'mono', 17, 'rgba(225,230,236,.72)', a, { pass: true });
    txt('end_sign', 'LemoLab × Claude Opus 5.5', X, Y + 280, 'num4', 26, '#ffffff', a);
  }

  return { g, begin, txt, width, env, scrims, readout, pin, rangeLine, subtitle, endCard, texts: () => TX };
}
