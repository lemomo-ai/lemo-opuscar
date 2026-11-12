// The wind-line engine: thousands of streamlines of the instantaneous field, drawn as engraved ink, with ink strokes
// running along them at the local wind speed. Flicker-free by construction:
//   * seeds are fixed points of a jittered grid in world kilometres, one grid per level of detail (spacing 1024 km … 2 km);
//   * every line is integrated for a FIXED number of steps (no collision tests, no early stops), so its shape is a continuous
//     function of the field, and the field is a continuous function of t;
//   * near a calm point the step shrinks with the wind speed, so lines settle into the centre instead of jittering across it;
//   * a level fades in and out with its on-screen spacing (two neighbouring levels always add up to one), each line fades at both ends;
//   * the running strokes are a phase along the line's time-of-flight, compared with one global flow clock Φ(t).
// Nothing is carried from frame to frame: render(t) at any t, in any order, gives the same picture.
import { wind, heightAt } from './field.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hash3(i, j, k) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

// grade colours (GB/T 19201-2006 thresholds), from engraving ink to vermilion: the same ramp prints the legend
export const GRADES = [
  { v: 0, cn: '热带低压以下', en: 'below TD', col: [38, 44, 56] },
  { v: 10.8, cn: '热带低压', en: 'Tropical Depression', col: [44, 58, 74] },
  { v: 17.2, cn: '热带风暴', en: 'Tropical Storm', col: [62, 82, 92] },
  { v: 24.5, cn: '强热带风暴', en: 'Severe Tropical Storm', col: [112, 92, 58] },
  { v: 32.7, cn: '台风', en: 'Typhoon', col: [158, 104, 40] },
  { v: 41.5, cn: '强台风', en: 'Severe Typhoon', col: [196, 108, 38] },
  { v: 51.0, cn: '超强台风', en: 'Super Typhoon', col: [200, 58, 36] },
];
export const gradeOf = v => { let k = 0; for (let i = 0; i < GRADES.length; i++) if (v >= GRADES[i].v) k = i; return k; };

const LEVELS = [];
for (let l = 0; l < 10; l++) LEVELS.push(1024 / Math.pow(2, l));

export function drawWind(g, cam, S, o) {
  // o: { Phi, spc (target seed spacing px), HL (half length, in spacings), aBase, aDash, wBase, wDash, lift, ppkRef, bright, clip }
  const { project, ppkAt, footprint } = cam;
  const fp = footprint();
  const spc = o.spc, HL = o.HL, DIV = 7, NS = HL * DIV;
  const buckets = new Map();
  const bucket = (ci, aq, wq) => { const k = (ci * 64 + aq) * 64 + wq; let b = buckets.get(k); if (!b) { b = { ci, aq, wq, runs: [] }; buckets.set(k, b); } return b; };
  const px = new Float32Array(2 * NS + 1), py = new Float32Array(2 * NS + 1), pv = new Float32Array(2 * NS + 1), tof = new Float32Array(2 * NS + 1), ok = new Uint8Array(2 * NS + 1), wx = new Float32Array(2 * NS + 1), wy = new Float32Array(2 * NS + 1);
  let nLines = 0;
  const eyeK = S.eye * (o.eyeK ?? 1);
  for (let l = 0; l < LEVELS.length; l++) {
    const Sz = LEVELS[l];
    if (Sz * fp.ppkMax * 1.6 < spc * 0.5 || Sz * fp.ppkMin / 1.6 > spc * 2) continue;
    const m = HL * Sz * 1.2;
    const i0 = Math.floor((fp.x0 - m) / Sz), i1 = Math.ceil((fp.x1 + m) / Sz), j0 = Math.floor((fp.y0 - m) / Sz), j1 = Math.ceil((fp.y1 + m) / Sz);
    if ((i1 - i0) * (j1 - j0) > 600000) { console.warn('wind: level skipped', l, (i1 - i0) * (j1 - j0)); continue; }
    const h = Sz / DIV, P = 1.6 * Sz / 12, ph0 = 0;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const sx = (i + 0.15 + 0.7 * hash3(i, j, l)) * Sz, sy = (j + 0.15 + 0.7 * hash3(j, i, l + 31)) * Sz;
      const ppk = cam.ppkClamped(sx, sy);
      const sp = Sz * ppk, w = 1 - Math.abs(Math.log2(sp / spc)); if (w <= 0.02) continue;
      // quick reject: the seed's line can't reach the screen
      const q = project(sx, sy, 0);
      const reach = HL * sp * 3;
      if (q && (q[0] < -reach || q[0] > cam.W + reach || q[1] < -reach || q[1] > cam.H + reach)) continue;
      const zl = (o.lift || 0) * hash3(i + 7, j, l + 3);
      // integrate both ways from the seed (RK2, unit direction, step shrinks below 2.5 m/s)
      px[NS] = sx; py[NS] = sy; { const v = wind(sx, sy, S); pv[NS] = v[2]; }
      for (const dir of [1, -1]) {
        let x = sx, y = sy;
        for (let k = 1; k <= NS; k++) {
          let v = wind(x, y, S); let s1 = v[2] || 1e-6; const dx1 = v[0] / s1, dy1 = v[1] / s1;
          const hm = h * Math.min(1, s1 / 2.5);
          const mx = x + dir * dx1 * hm * 0.5, my = y + dir * dy1 * hm * 0.5;
          v = wind(mx, my, S); const s2 = v[2] || 1e-6;
          x += dir * v[0] / s2 * hm; y += dir * v[1] / s2 * hm;
          const idx = NS + dir * k; px[idx] = x; py[idx] = y; pv[idx] = wind(x, y, S)[2];
        }
      }
      // time of flight along the line (km per compressed m/s), zero at the seed
      tof[NS] = 0;
      for (let k = NS + 1; k <= 2 * NS; k++) { const d = Math.hypot(px[k] - px[k - 1], py[k] - py[k - 1]), v = 0.5 * (pv[k] + pv[k - 1]); tof[k] = tof[k - 1] + d / (12 * Math.pow(Math.max(v, 1) / 12, 0.6)); }
      for (let k = NS - 1; k >= 0; k--) { const d = Math.hypot(px[k] - px[k + 1], py[k] - py[k + 1]), v = 0.5 * (pv[k] + pv[k + 1]); tof[k] = tof[k + 1] - d / (12 * Math.pow(Math.max(v, 1) / 12, 0.6)); }
      // project
      for (let k = 0; k <= 2 * NS; k++) {
        const zz = zl + (o.terrainZ ? heightAt(px[k], py[k]) * o.terrainZ : 0);
        const p = project(px[k], py[k], zz); if (p) { wx[k] = p[0]; wy[k] = p[1]; ok[k] = 1; } else ok[k] = 0;
      }
      nLines++;
      const phase = hash3(i, j, l + 77), wsc = Math.sqrt(clamp(ppk / o.ppkRef, 0.25, 9));
      const wB = clamp(o.wBase * wsc, 0.35, 6), wD = clamp(o.wDash * wsc, 0.6, 9);
      let prevB = null, prevD = null;
      for (let k = 0; k < 2 * NS; k++) {
        if (!ok[k] || !ok[k + 1]) { prevB = prevD = null; continue; }
        const s = (k + 0.5) / (2 * NS), taper = Math.pow(Math.sin(Math.PI * s), 0.8);
        const mxw = 0.5 * (px[k] + px[k + 1]), myw = 0.5 * (py[k] + py[k + 1]);
        const r = Math.hypot(mxw - S.X, myw - S.Y) / S.sec / S.rmax;
        const eye = 1 - eyeK * (1 - sstep(0.5, 1.0, r));
        const vv = 0.5 * (pv[k] + pv[k + 1]), ci = gradeOf(vv);
        const a = w * taper * eye * (o.mask ? o.mask(mxw, myw) : 1);
        if (a < 0.01) { prevB = prevD = null; continue; }
        // base line
        const aq = clamp(Math.round(a * o.aBase * 40), 0, 63);
        if (aq > 0) {
          const wq = clamp(Math.round(wB * 6), 1, 63), b = bucket(ci, aq, wq);
          if (prevB === b) prevB.cur.push(wx[k + 1], wy[k + 1]);
          else { const run = [wx[k], wy[k], wx[k + 1], wy[k + 1]]; b.runs.push(run); b.cur = run; prevB = b; }
        } else prevB = null;
        // running stroke: comet with a bright head, phase along time-of-flight
        const tm = 0.5 * (tof[k] + tof[k + 1]);
        let f = ((tm - o.Phi) / P + phase) % 1; if (f < 0) f += 1;
        const D = 0.42;
        if (f < D) {
          const prof = Math.pow(f / D, 1.4) * sstep(0, 0.06, D - f) ;
          const ad = clamp(Math.round(a * prof * o.aDash * 40), 0, 63);
          if (ad > 0) {
            const wq = clamp(Math.round(wD * (0.55 + 0.45 * f / D) * 6), 1, 63), b = bucket(ci + 8, ad, wq);
            if (prevD === b) prevD.cur.push(wx[k + 1], wy[k + 1]);
            else { const run = [wx[k], wy[k], wx[k + 1], wy[k + 1]]; b.runs.push(run); b.cur = run; prevD = b; }
          } else prevD = null;
        } else prevD = null;
      }
    }
  }
  // draw: base lines first, then the running strokes; colour lifts toward the grade colour with o.bright
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const list = [...buckets.values()].sort((a, b) => (a.ci >= 8) - (b.ci >= 8) || a.aq - b.aq);
  for (const b of list) {
    const ci = b.ci % 8, c = GRADES[ci].col, k = ci <= 1 ? 0 : (o.bright ?? 1);
    const ink = [30, 36, 46], r = Math.round(ink[0] + (c[0] - ink[0]) * k), gg = Math.round(ink[1] + (c[1] - ink[1]) * k), bb = Math.round(ink[2] + (c[2] - ink[2]) * k);
    g.strokeStyle = `rgba(${r},${gg},${bb},${(b.aq / 40).toFixed(3)})`; g.lineWidth = b.wq / 6;
    g.beginPath();
    for (const run of b.runs) { g.moveTo(run[0], run[1]); for (let q = 2; q < run.length; q += 2) g.lineTo(run[q], run[q + 1]); }
    g.stroke();
  }
  g.restore();
  return nLines;
}
