// Textbook Doodle · paper, books and the desk. A page is printed once into a cached canvas (print never moves);
// the camera, the page turn and the light are what change.
//   PW × PH          page size in world units; a spread is two pages, gutter at x = 0, centred on (0, 0)
//   page(id, draw)   register a printed page: draw(ctx) in page coords (0..PW, 0..PH)
//   drawSpread(ctx, L, R, o)       two pages side by side (o.paper tint, o.light)
//   drawTurn(ctx, L, R, L2, R2, u) right page turning over to reveal the next spread (u 0..1)
//   drawDesk(ctx, x0, y0, x1, y1)  wood under everything
import { clamp, lerp, mulberry, vnoise, ss } from '/core/lib.js';

export const PW = 860, PH = 1180, SCALE = 1.5;
const pages = new Map();

function noiseTile(size, seed, fn) {
  const c = new OffscreenCanvas(size, size), g = c.getContext('2d'), im = g.createImageData(size, size), r = mulberry(seed);
  for (let i = 0; i < size * size; i++) { const v = fn(r, i % size, (i / size) | 0); im.data[4 * i] = v[0]; im.data[4 * i + 1] = v[1]; im.data[4 * i + 2] = v[2]; im.data[4 * i + 3] = v[3]; }
  g.putImageData(im, 0, 0); return c;
}
let FIBRE = null;
function fibre() {   // paper fibre: fine noise + sparse short fibres
  if (FIBRE) return FIBRE;
  FIBRE = noiseTile(256, 11, (r) => { const n = r(); const v = 238 + n * 17; return [v, v - 2, v - 7, 255]; });
  const g = FIBRE.getContext('2d'), r = mulberry(5);
  for (let i = 0; i < 260; i++) { const x = r() * 256, y = r() * 256, a = r() * Math.PI, l = 3 + r() * 9; g.strokeStyle = `rgba(150,140,120,${.05 + r() * .08})`; g.lineWidth = .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return FIBRE;
}

// paper: {tint:'#f3eedf', ruled:{gap, color, margin}, grid}
export function page(id, draw, paper = {}) { pages.set(id, { draw, paper, c: null }); }
export function pageCanvas(id) {
  const p = pages.get(id); if (!p) throw new Error('no page ' + id);
  if (p.c) return p.c;
  const c = new OffscreenCanvas(Math.round(PW * SCALE), Math.round(PH * SCALE)), g = c.getContext('2d');
  g.scale(SCALE, SCALE);
  g.fillStyle = p.paper.tint ?? '#f3eedf'; g.fillRect(0, 0, PW, PH);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(fibre(), 'repeat'); g.fillRect(0, 0, PW, PH);
  g.globalCompositeOperation = 'source-over';
  const r = mulberry(id.length * 97 + id.charCodeAt(0));   // one or two faint old stains
  for (let k = 0; k < 2; k++) { const x = r() * PW, y = r() * PH, rr = 40 + r() * 90, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(180,150,90,0.045)'); gr.addColorStop(1, 'rgba(180,150,90,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  if (p.paper.ruled) {               // exercise-book rules + margin line
    const R = p.paper.ruled; g.strokeStyle = R.color ?? 'rgba(90,140,160,.42)'; g.lineWidth = 1.3;
    for (let y = R.top ?? 150; y < PH - 60; y += R.gap ?? 56) { g.beginPath(); g.moveTo(30, y); g.lineTo(PW - 30, y); g.stroke(); }
    if (R.margin) { g.strokeStyle = 'rgba(200,80,80,.4)'; g.beginPath(); g.moveTo(R.margin, 40); g.lineTo(R.margin, PH - 40); g.stroke(); }
  }
  p.draw(g);
  p.c = c; return c;
}

// shading at the gutter and along the page's curve
function gutterShade(ctx, x, side, alpha = 1) {
  const w = 120, g = ctx.createLinearGradient(x, 0, x + side * w, 0);
  g.addColorStop(0, `rgba(60,45,25,${.32 * alpha})`); g.addColorStop(.25, `rgba(60,45,25,${.12 * alpha})`); g.addColorStop(1, 'rgba(60,45,25,0)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + side * w), -PH / 2, w, PH);
}
function pageEdges(ctx, x0, w) {        // page block thickness: a few thin lines on the outer edge
  ctx.save(); ctx.strokeStyle = 'rgba(120,105,80,.35)'; ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { const off = i * 2.2; ctx.beginPath(); ctx.moveTo(x0 + (w > 0 ? w + off : w - off), -PH / 2 + off); ctx.lineTo(x0 + (w > 0 ? w + off : w - off), PH / 2 + off); ctx.stroke(); }
  ctx.restore();
}

// what goes on top of the print (doodles, handwriting, the figure) is registered by the film: hook(ctx, id) draws in page coords
let HOOK = null;
export const onPage = fn => { HOOK = fn; };
export function drawPage(ctx, id, x, y) {
  ctx.drawImage(pageCanvas(id), x, y, PW, PH);
  if (HOOK) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip(); HOOK(ctx, id); ctx.restore(); }
}

// an open spread centred on world (0, 0); a null L / R leaves that side empty
export function drawSpread(ctx, L, R, o = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,10,.28)'; ctx.filter = 'blur(18px)'; ctx.fillRect(-PW - 10 + (L ? 0 : PW), -PH / 2 + 16, (L ? PW : 0) + (R ? PW : 0) + 20, PH + 8); ctx.filter = 'none';
  if (L) { pageEdges(ctx, 0, -PW); drawPage(ctx, L, -PW, -PH / 2); gutterShade(ctx, 0, -1); }
  if (R) { pageEdges(ctx, 0, PW); drawPage(ctx, R, 0, -PH / 2); gutterShade(ctx, 0, 1); }
  ctx.restore();
}

// page turn. dir = 1: the right page turns over to the left (forward), revealing the next spread; dir = -1: the left page turns back (backward / closing the book).
// from = [L, R], to = [L2, R2]; a null page means no paper on that side (a closed book has only the cover on the right)
export function drawTurn(ctx, from, to, u, dir = 1) {
  u = clamp(u, 0, 1); const th = ss(u) * Math.PI, c = Math.cos(th), lift = Math.sin(th);
  const [L, R] = from, [L2, R2] = to;
  const front = dir > 0 ? R : L, back = dir > 0 ? L2 : R2;
  dir > 0 ? drawSpread(ctx, L, R2) : drawSpread(ctx, L2, R);
  const sideFront = dir > 0 ? 1 : -1;                // the side the front face is on
  const id = c > 0 ? front : back, k = Math.abs(c), side = c > 0 ? sideFront : -sideFront;
  if (!id) return;
  ctx.save();
  ctx.fillStyle = `rgba(30,20,10,${.28 * lift})`; ctx.filter = 'blur(16px)';
  ctx.fillRect(side > 0 ? 0 : -PW * k - 30 * lift, -PH / 2 + 22, PW * k + 30 * lift, PH); ctx.filter = 'none';
  ctx.save(); ctx.transform(k, side * -lift * .04, 0, 1, 0, 0); drawPage(ctx, id, side > 0 ? 0 : -PW, -PH / 2); ctx.restore();
  const w = PW * k, g = ctx.createLinearGradient(0, 0, side * w, 0);
  g.addColorStop(0, `rgba(40,30,15,${.4 * (1 - k)})`); g.addColorStop(1, `rgba(255,250,235,${.22 * (1 - k)})`);
  ctx.fillStyle = g; ctx.fillRect(side > 0 ? 0 : -w, -PH / 2, w, PH);
  ctx.restore();
}

let WOOD = null;
// the desk: one non-repeating wooden top (6000×4000 world units, rendered at 1/2.5), horizontal planks, each with its own grain
const DESK = { w: 6000, h: 4000, k: 2.5, plank: 430 };
function wood() {
  if (WOOD) return WOOD;
  const W = DESK.w / DESK.k | 0, H = DESK.h / DESK.k | 0, c = new OffscreenCanvas(W, H), g = c.getContext('2d'), im = g.createImageData(W, H), r = mulberry(3);
  for (let y = 0; y < H; y++) {
    const wy = y * DESK.k, pi = Math.floor(wy / DESK.plank), py = wy - pi * DESK.plank, ps = pi * 17.3, tone = (vnoise(ps) - .5) * 14;
    for (let x = 0; x < W; x++) {
      const wx = x * DESK.k + vnoise(ps + 4) * 3000;                        // planks offset so the joints don't line up
      const warp = vnoise(wx / 900 + ps) * 5 + vnoise(wx / 230 + ps * 2) * .9;
      const grain = vnoise(py / 7 + warp + ps), fine = vnoise(py / 2.2 + warp * 3 + ps);
      const knot = .85 + .15 * vnoise(wx / 420 + py / 90 + ps);
      let d = (60 + grain * 34 + fine * 8 + tone + r() * 5) * knot;
      if (py < 3 || DESK.plank - py < 2) d *= .55;                            // joint between planks
      const i = 4 * (y * W + x); im.data[i] = d * 1.55; im.data[i + 1] = d * 1.04; im.data[i + 2] = d * .64; im.data[i + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0); return WOOD = c;
}
export function drawDesk(ctx, x0, y0, x1, y1) {
  ctx.save(); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.drawImage(wood(), -DESK.w / 2, -DESK.h / 2, DESK.w, DESK.h); ctx.restore();
}

// a cover: flat printed colour + the title
export function cover(id, o) {
  page(id, g => {
    g.fillStyle = o.bg; g.fillRect(0, 0, PW, PH);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(fibre(), 'repeat'); g.fillRect(0, 0, PW, PH); g.globalCompositeOperation = 'source-over';
    o.draw?.(g);
  }, { tint: o.bg });
}
