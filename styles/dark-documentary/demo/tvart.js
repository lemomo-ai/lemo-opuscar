// The picture on the TV: our own drawing of a moonwalker by the lander (not NASA footage).
// Drawn once, grayscale, at 960×720; the page rasterises it line by line like a slow-scan TV.
// Light comes low from the left (as on the Sea of Tranquillity that morning), so the suit is lit on its left
// and casts a long shadow to the right; the boots sit on a contact shadow so the figure stands on the ground.

const lerp = (a, b, k) => a + (b - a) * k;

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

// a suit part filled with a soft side light: lit on the left edge, shaded on the right
function litFill(c, x0, x1, light = 236, dark = 150) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgb(${light},${light},${light})`);
  g.addColorStop(0.55, `rgb(${lerp(light, dark, 0.35) | 0},${lerp(light, dark, 0.35) | 0},${lerp(light, dark, 0.35) | 0})`);
  g.addColorStop(1, `rgb(${dark},${dark},${dark})`);
  return g;
}

export function drawMoonPicture(cv, rng) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // ground: a gentle horizon, regolith brighter toward the camera, a few craters and footprints
  const hz = H * 0.40;
  const gr = c.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#5e5e5e'); gr.addColorStop(0.35, '#858585'); gr.addColorStop(1, '#a9a9a9');
  c.fillStyle = gr; c.beginPath(); c.moveTo(0, hz + 10); c.quadraticCurveTo(W * 0.5, hz - 8, W, hz + 6); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  const R = rng(11);
  for (let i = 0; i < 40; i++) {
    const y = hz + 30 + R() * (H - hz - 30), f = (y - hz) / (H - hz), x = R() * W, r = (6 + R() * 26) * (0.3 + f);
    c.fillStyle = `rgba(30,30,30,${0.22 + R() * 0.25})`; c.beginPath(); c.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(230,230,230,0.16)'; c.beginPath(); c.ellipse(x + r * 0.25, y - r * 0.06, r * 0.9, r * 0.22, 0, Math.PI, 0); c.fill();
  }
  // footprints trailing from the ladder to the figure
  for (let i = 0; i < 9; i++) {
    const k = i / 8, x = lerp(250, 560, k) + (i % 2 ? 10 : -10), y = lerp(560, 600, k) + (i % 2 ? 8 : 0);
    c.fillStyle = 'rgba(40,40,40,0.45)'; c.beginPath(); c.ellipse(x, y, 13 + k * 4, 5 + k, -0.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(30,30,30,0.35)'; c.lineWidth = 1; for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(x - 10, y + j * 2); c.lineTo(x + 10, y + j * 2); c.stroke(); }
  }
  // the lander's front leg, footpad and ladder at the left edge
  c.lineCap = 'round';
  c.strokeStyle = '#cfcfcf'; c.lineWidth = 12; c.beginPath(); c.moveTo(-20, 60); c.lineTo(178, 520); c.stroke();
  c.strokeStyle = '#9a9a9a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-20, 330); c.lineTo(150, 505); c.stroke();
  c.strokeStyle = '#bdbdbd'; c.lineWidth = 4; for (const off of [26, 56]) { c.beginPath(); c.moveTo(-20 + off, 40); c.lineTo(150 + off, 440); c.stroke(); }
  for (let i = 0; i < 8; i++) { const k = i / 8, x = lerp(0, 165, k), y = lerp(80, 470, k); c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + 36, y - 4); c.stroke(); }
  c.fillStyle = '#c4c4c4'; c.beginPath(); c.ellipse(186, 532, 62, 17, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#8a8a8a'; c.beginPath(); c.ellipse(186, 537, 62, 11, 0, 0, Math.PI); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.moveTo(150, 540); c.lineTo(500, 566); c.lineTo(520, 592); c.lineTo(130, 562); c.fill();

  // the moonwalker: standing three-quarter view, facing right, weight on the back foot, right arm a little forward
  const fx = 610, fy = 600, S = 300;          // feet on the ground at (fx, fy); figure height S px
  const P = (x, y) => [fx + x * S, fy + y * S];
  // long shadow on the ground, to the right (light from the left), and a dark contact patch under the boots
  c.fillStyle = 'rgba(0,0,0,0.62)';
  c.beginPath(); { const [a, b] = P(-0.10, 0.0); c.moveTo(a, b); }
  for (const [x, y] of [[0.22, -0.005], [1.15, 0.06], [1.42, 0.075], [1.5, 0.11], [1.36, 0.15], [1.05, 0.16], [0.12, 0.045], [-0.12, 0.025]]) { const [a, b] = P(x, y); c.lineTo(a, b); }
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.75)'; { const [a, b] = P(0.02, 0.008); c.beginPath(); c.ellipse(a, b, 0.20 * S, 0.028 * S, 0, 0, Math.PI * 2); c.fill(); }

  // backpack (PLSS) with the oxygen purge system on top: behind the body, so drawn first
  { const [x, y] = P(-0.31, -0.93); c.fillStyle = litFill(c, x, x + 0.19 * S, 226, 140); rr(c, x, y, 0.19 * S, 0.45 * S, 0.025 * S); c.fill();
    const [ox, oy] = P(-0.30, -1.0); c.fillStyle = litFill(c, ox, ox + 0.17 * S, 214, 132); rr(c, ox, oy, 0.17 * S, 0.075 * S, 0.02 * S); c.fill();
    c.strokeStyle = 'rgba(90,90,90,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, y + 0.22 * S); c.lineTo(x + 0.19 * S - 4, y + 0.22 * S); c.stroke(); }
  const leg = (hx, kx, ax, w, shade) => {
    const [a, b] = P(hx, -0.47), [k1, k2] = P(kx, -0.25), [f1, f2] = P(ax, -0.08);
    c.fillStyle = litFill(c, Math.min(a, k1, f1) - w * S / 2, Math.max(a, k1, f1) + w * S / 2, 232 - shade, 140 - shade);
    c.beginPath(); c.moveTo(a - w * S * 0.55, b); c.quadraticCurveTo(k1 - w * S * 0.62, k2, f1 - w * S * 0.5, f2); c.lineTo(f1 + w * S * 0.5, f2); c.quadraticCurveTo(k1 + w * S * 0.62, k2, a + w * S * 0.55, b); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,120,120,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(k1 - w * S * 0.45, k2 - 8); c.quadraticCurveTo(k1, k2 + 4, k1 + w * S * 0.45, k2 - 8); c.stroke();
    c.beginPath(); c.moveTo(k1 - w * S * 0.4, k2 + 10); c.quadraticCurveTo(k1, k2 + 18, k1 + w * S * 0.4, k2 + 10); c.stroke();
  };
  const boot = (x, len, shade) => {
    const [a, b] = P(x, 0);
    c.fillStyle = litFill(c, a, a + len * S, 222 - shade, 128 - shade);
    c.beginPath(); c.moveTo(a + 0.01 * S, b - 0.095 * S); c.lineTo(a + len * S * 0.55, b - 0.10 * S); c.quadraticCurveTo(a + len * S * 1.02, b - 0.08 * S, a + len * S, b - 0.015 * S); c.lineTo(a + len * S, b); c.lineTo(a - 0.005 * S, b); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,70,70,0.9)'; c.fillRect(a - 0.005 * S, b - 0.02 * S, len * S + 0.005 * S, 0.02 * S);
    c.strokeStyle = 'rgba(140,140,140,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(a + 0.02 * S, b - 0.06 * S); c.lineTo(a + len * S * 0.7, b - 0.065 * S); c.stroke();
  };
  const arm = (sx, sy, ex, ey, hx, hy, w, shade) => {
    const [a, b] = P(sx, sy), [e1, e2] = P(ex, ey), [h1, h2] = P(hx, hy);
    c.strokeStyle = `rgb(${226 - shade},${226 - shade},${226 - shade})`; c.lineWidth = w * S; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(a, b); c.lineTo(e1, e2); c.lineTo(h1, h2); c.stroke();
    c.strokeStyle = `rgba(110,110,110,0.5)`; c.lineWidth = 2; c.beginPath(); c.arc(e1, e2, w * S * 0.42, -0.4, 1.3); c.stroke();
    c.fillStyle = `rgb(${132 - shade / 2},${132 - shade / 2},${132 - shade / 2})`; c.beginPath(); c.ellipse(h1, h2 + 0.025 * S, 0.045 * S, 0.055 * S, 0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(90,90,90,0.9)`; c.fillRect(h1 - 0.04 * S, h2 - 0.015 * S, 0.08 * S, 0.018 * S);   // wrist ring
  };
  // back arm and back leg first (they sit behind the torso)
  arm(-0.12, -0.76, -0.19, -0.62, -0.185, -0.50, 0.09, 38);
  leg(-0.075, -0.085, -0.08, 0.13, 20); boot(-0.16, 0.20, 20);
  // torso: wide and round, the suit's folds
  { const [x, y] = P(-0.18, -0.83); c.fillStyle = litFill(c, x, x + 0.36 * S, 242, 152); rr(c, x, y, 0.36 * S, 0.40 * S, 0.08 * S); c.fill();
    c.strokeStyle = 'rgba(135,135,135,0.55)'; c.lineWidth = 2;
    for (const yy of [-0.60, -0.53]) { const [a, b] = P(-0.16, yy); c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + 0.16 * S, b + 7, a + 0.32 * S, b); c.stroke(); } }
  // front leg, a half step forward
  leg(0.065, 0.095, 0.105, 0.135, 0); boot(0.03, 0.21, 0);
  { const [a, b] = P(-0.18, -0.47); c.fillStyle = 'rgba(150,150,150,0.95)'; rr(c, a, b - 7, 0.36 * S, 14, 7); c.fill(); }   // waist ring
  // chest control unit (RCU) with its knobs
  { const [x, y] = P(-0.045, -0.745); c.fillStyle = litFill(c, x, x + 0.12 * S, 214, 126); rr(c, x, y, 0.12 * S, 0.085 * S, 6); c.fill();
    c.strokeStyle = 'rgba(95,95,95,0.8)'; c.lineWidth = 2; rr(c, x, y, 0.12 * S, 0.085 * S, 6); c.stroke();
    c.fillStyle = 'rgba(55,55,55,0.95)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 0.025 * S + i * 0.035 * S, y + 0.045 * S, 0.011 * S, 0, Math.PI * 2); c.fill(); } }
  // front arm reaching a little forward
  arm(0.13, -0.76, 0.22, -0.63, 0.26, -0.53, 0.095, 0);
  // helmet: the clear bubble over a white cap, the gold visor down (dark, with one bright reflection)
  { const [hx, hy] = P(0.035, -0.90), r = 0.105 * S;
    c.fillStyle = litFill(c, hx - r, hx + r, 242, 150); c.beginPath(); c.arc(hx, hy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.ellipse(hx + r * 0.25, hy + r * 0.05, r * 0.70, r * 0.66, -0.2, 0, Math.PI * 2); c.fill();
    const vg = c.createLinearGradient(hx - r * 0.3, hy - r * 0.5, hx + r * 0.6, hy + r * 0.5); vg.addColorStop(0, 'rgba(255,255,255,0.0)'); vg.addColorStop(0.45, 'rgba(255,255,255,0.35)'); vg.addColorStop(0.55, 'rgba(255,255,255,0.0)');
    c.fillStyle = vg; c.beginPath(); c.ellipse(hx + r * 0.25, hy + r * 0.05, r * 0.70, r * 0.66, -0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120,120,120,0.9)'; c.lineWidth = 4; c.beginPath(); c.ellipse(hx - r * 0.05, hy + r * 0.98, r * 0.72, r * 0.2, 0, 0, Math.PI); c.stroke();   // neck ring
  }
}
