// End card: two colours only. The full Moon sinks behind the western horizon (it rose in the east in the first shot).
import * as THREE from 'three';
import { font } from './kit.js';
import { mulberry, seg, ss, lerp } from '/core/lib.js';
import { T, DUR } from './timeline.js';
import { END, END_TITLE, END_STYLE } from './texts.js';
import { fbm2 } from './noise.js';

export function buildEnd() {
  const W = 1920, H = 1080;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2); camera.position.z = 1;
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex })));
  // the Moon's face, once
  const MR = 150; const mc = document.createElement('canvas'); mc.width = mc.height = MR * 2; { const mg = mc.getContext('2d'); const id = mg.createImageData(MR * 2, MR * 2);
    for (let y = 0; y < MR * 2; y++) for (let x = 0; x < MR * 2; x++) { const dx = (x - MR) / MR, dy = (y - MR) / MR, r2 = dx * dx + dy * dy; const i = (y * MR * 2 + x) * 4; if (r2 > 1) { id.data[i + 3] = 0; continue; }
      const mare = Math.max(0, Math.min(1, (fbm2(dx * 2.2 + 3, dy * 2.2 + 1, 5) - 0.47) * 6)); const v = 255 * (0.95 - 0.45 * mare) * (1 - 0.18 * Math.pow(r2, 2)); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    mg.putImageData(id, 0, 0); }
  const HZ = 760, TX = 170;
  // the card: film title (English, then Chinese), the style's name, the credit. Every line is solid paper on the dark
  // sky, big enough that no stroke is thinner than one internal (960-wide) pixel, so the 1-bit pass keeps it whole.
  const LINES = [
    { id: 'titleen', text: END_TITLE.en, fam: 'news', size: 104, w: 600, y: 300 },
    { id: 'titlecn', text: END_TITLE.cn, fam: 'serif', size: 60, w: 700, y: 392 },
    { id: 'styleen', text: END_STYLE.en, fam: 'news', size: 44, w: 500, y: 500 },
    { id: 'stylecn', text: END_STYLE.cn, fam: 'serif', size: 40, w: 700, y: 500, after: 'styleen', gap: 30 },
    { id: 'end', text: END, fam: 'news', size: 54, w: 600, y: 640 },
  ];
  const place = () => { const xs = {}; for (const L of LINES) { font(g, L.fam, L.size, L.w); const wd = g.measureText(L.text).width; const x = L.after ? xs[L.after] + L.gap : TX; xs[L.id] = x + wd; L.x = x; L.wd = wd; } };
  function draw(t) {
    const grd = g.createLinearGradient(0, 0, 0, HZ); grd.addColorStop(0, '#0b0b0b'); grd.addColorStop(0.7, '#3a3a3a'); grd.addColorStop(1, '#6e6e6e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const my = lerp(HZ - 40, HZ + 120, ss(seg(t, T.END, DUR + 0.3)));
    g.drawImage(mc, 1340 - MR, my - MR);
    g.fillStyle = '#000'; g.fillRect(0, HZ, W, H - HZ);
    // hedgerow and the telescope, small, on the horizon
    const r = mulberry(5); g.beginPath(); g.moveTo(0, HZ + 2); for (let x = 0; x <= W; x += 24) g.lineTo(x, HZ - 4 - r() * 10 - (x > 300 && x < 520 ? 10 : 0)); g.lineTo(W, HZ + 2); g.fill();
    g.save(); g.translate(560, HZ - 6); g.beginPath(); g.ellipse(0, -46, 40, 16, -0.4, 0, Math.PI); g.fill(); g.lineWidth = 5; g.strokeStyle = '#000';
    g.beginPath(); g.moveTo(-34, 0); g.lineTo(-24, -44); g.lineTo(-14, 0); g.moveTo(14, 0); g.lineTo(24, -44); g.lineTo(34, 0); g.moveTo(0, -40); g.lineTo(-18, -78); g.stroke(); g.restore();
    place(); g.fillStyle = '#fff';
    for (const L of LINES) { font(g, L.fam, L.size, L.w); g.fillText(L.text, L.x, L.y); }
    g.fillRect(TX, 560, 120, 6);
    tex.needsUpdate = true;
  }
  function update(t) { draw(t); return { exp: 1.0, lo: 0.05, hi: 0.9, edge: false, screenT: true, gam: 1 }; }
  function texts(t, VW, VH) { place(); const k = VW / W; return LINES.map(L => ({ id: L.id, text: L.text, x0: L.x * k, y0: (L.y - L.size * 0.85) * k, x1: (L.x + L.wd) * k, y1: (L.y + L.size * 0.25) * k })); }
  return { scene, camera, update, texts };
}
