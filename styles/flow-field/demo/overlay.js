// Print on the chart: text laid on the sea-level plane (follows the camera's perspective at that point),
// screen-facing tags pinned to a ground point by a leader, and the readable-text registry for window.TEXTS.
export const FONT = { zh: '"ZH", serif', en: '"NR", serif', it: '"NRI", serif', mono: '"MONO", monospace' };
export const INK = '#26221f', VERM = '#b8432a', PAPER = '#efe3c6';

export function makeOverlay(g, SS) {
  const REG = [];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function reg(id, text, x0, y0, x1, y1, a) { if (a >= 0.85) REG.push({ id, text, x0, y0, x1, y1 }); }
  // affine frame of the plane at (X, Y): local u = east km, v = south km, rotated by rot degrees (anticlockwise on the map)
  function plane(cam, X, Y, rot = 0) {
    const p0 = cam.project(X, Y, 0); if (!p0) return null;
    const c = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180);
    const pu = cam.project(X + c, Y + s, 0), pv = cam.project(X + s, Y - c, 0); if (!pu || !pv) return null;
    return { o: p0, a: [pu[0] - p0[0], pu[1] - p0[1]], b: [pv[0] - p0[0], pv[1] - p0[1]] };
  }
  function setPlane(P) { g.setTransform(SS * P.a[0], SS * P.a[1], SS * P.b[0], SS * P.b[1], SS * P.o[0], SS * P.o[1]); }
  const toScr = (P, u, v) => [P.o[0] + P.a[0] * u + P.b[0] * v, P.o[1] + P.a[1] * u + P.b[1] * v];
  function boxOf(P, x0, y0, x1, y1) {
    const c = [toScr(P, x0, y0), toScr(P, x1, y0), toScr(P, x0, y1), toScr(P, x1, y1)];
    return [Math.min(...c.map(p => p[0])), Math.min(...c.map(p => p[1])), Math.max(...c.map(p => p[0])), Math.max(...c.map(p => p[1]))];
  }
  // text in plane coordinates (km). opts: {font, size (km), align, color, alpha, id, track (letter spacing em), weight, base}
  function ptext(P, str, u, v, o) {
    const a = o.alpha ?? 1; if (a <= 0.003) return;
    g.save(); setPlane(P);
    g.font = `${o.weight || 400} ${o.size}px ${o.font}`; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.track || 0) * o.size + 'px';
    g.globalAlpha = a; g.fillStyle = o.color || INK;
    if (o.halo) { g.lineWidth = o.halo; g.strokeStyle = o.haloCol || 'rgba(238,226,198,0.9)'; g.lineJoin = 'round'; g.strokeText(str, u, v); }
    g.fillText(str, u, v);
    const w = g.measureText(str).width, x0 = o.align === 'center' ? u - w / 2 : o.align === 'right' ? u - w : u;
    g.restore();
    if (o.id != null) { const b = boxOf(P, x0, v - o.size * 0.86, x0 + w, v + o.size * 0.22); reg(o.id, str, ...b, a); }
  }
  // screen text (px) with registry
  function stext(str, x, y, o) {
    const a = o.alpha ?? 1; if (a <= 0.003) return 0;
    g.save(); g.setTransform(SS, 0, 0, SS, 0, 0);
    g.font = `${o.weight || 400} ${o.size}px ${o.font}`; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.track || 0) * o.size + 'px';
    g.globalAlpha = a;
    if (o.halo) { g.lineWidth = o.halo; g.strokeStyle = o.haloCol || 'rgba(238,226,198,0.92)'; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = o.color || INK; g.fillText(str, x, y);
    const w = g.measureText(str).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    g.restore();
    if (o.id != null) reg(o.id, str, x0, y - o.size * 0.86, x0 + w, y + o.size * 0.22, a);
    return w;
  }
  function measure(str, o) { g.save(); g.font = `${o.weight || 400} ${o.size}px ${o.font}`; if ('letterSpacing' in g) g.letterSpacing = (o.track || 0) * o.size + 'px'; const w = g.measureText(str).width; g.restore(); return w; }
  return { REG, reg, plane, setPlane, toScr, ptext, stext, measure, clear: () => { REG.length = 0; } };
}
