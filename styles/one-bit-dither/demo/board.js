// Shot 7, the verdict: the two prints of the same rock pinned side by side on a cork board, each rock boxed; a thread
// at the height of the true rock runs across both. Held still, then two black stamps land on the Jodrell Bank print.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat, paperCanvas, screenBox } from './kit.js';
import { clamp, lerp, seg, ss, eo, mulberry } from '/core/lib.js';
import { T, STAMP1, STAMP2 } from './timeline.js';
import { BOARD } from './texts.js';

export function buildBoard(ctx) {
  const { prints, moon } = ctx;
  const scene = new THREE.Scene();
  const texts = [];
  const reg = (mesh, cw, ch, pw, ph, l, when) => texts.push({ id: l.id, text: l.text, mesh, when, corners: [[l.x0, l.y0], [l.x1, l.y0], [l.x1, l.y1], [l.x0, l.y1]].map(([x, y]) => V((x / cw - 0.5) * pw, (0.5 - y / ch) * ph, 0.001)) });
  // wall and cork
  add(scene, new THREE.PlaneGeometry(6, 4), grey(0.42)).position.set(0, 0, -0.03);
  const corkC = document.createElement('canvas'); corkC.width = 1024; corkC.height = 680; { const g = corkC.getContext('2d'); const r = mulberry(21); g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, 1024, 680); for (let i = 0; i < 26000; i++) { const v = 70 + r() * 80; g.fillStyle = `rgb(${v},${v},${v})`; const s = 1 + r() * 3; g.fillRect(r() * 1024, r() * 680, s, s); } }
  const BW = 1.3, BH = 0.86;
  add(scene, new THREE.PlaneGeometry(BW, BH), new THREE.MeshLambertMaterial({ map: canvasTex(corkC) })).position.z = 0.0;
  const FR = grey(0.28, { r: 0.6 });
  box(scene, BW + 0.08, 0.04, 0.03, 0, BH / 2 + 0.02, 0.012, FR); box(scene, BW + 0.08, 0.04, 0.03, 0, -BH / 2 - 0.02, 0.012, FR);
  box(scene, 0.04, BH + 0.08, 0.03, -BW / 2 - 0.02, 0, 0.012, FR); box(scene, 0.04, BH + 0.08, 0.03, BW / 2 + 0.02, 0, 0.012, FR);
  // R's box inside the enlargements (normalised to the crop)
  const C = prints.crop; const bx0 = (C.rb.x0 - C.x0) / C.w, bx1 = (C.rb.x1 - C.x0) / C.w, by0 = (C.rb.y0 - C.y0) / C.h, by1 = (C.rb.y1 - C.y0) / C.h;
  const PWd = 0.26, JH = PWd * 1.5, OH = PWd * 0.75, BORD = 0.014;
  const baseY = -0.02;                       // board height of the rock's base in both prints
  const jTop = baseY + by1 * JH, oTop = baseY + by1 * OH;
  function pinned(tex, w, h, cx, top, curl, rot) {
    const g = new THREE.Group(); g.position.set(cx, top - h / 2, 0.006); g.rotation.z = rot; scene.add(g);
    const bend = geo => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, curl * (Math.pow(x / w * 2, 2) + 0.6 * Math.pow(Math.max(0, -y / h * 2), 3))); } geo.computeVertexNormals(); return geo; };
    add(g, bend(new THREE.PlaneGeometry(w + 2 * BORD, h + 2 * BORD, 16, 16)), grey(0.94, { side: THREE.DoubleSide, e: 0.02 })).position.z = -0.0006;
    add(g, bend(new THREE.PlaneGeometry(w, h, 16, 16)), printMat(tex, { e: 0.02 }));
    [[-1, 1], [1, 1]].forEach(([sx, sy]) => { const pin = new THREE.Group(); g.add(pin); pin.position.set(sx * (w / 2 + BORD * 0.4), sy * (h / 2 + BORD * 0.4), 0.004); cyl(pin, 0.009, 0.007, 0.012, 0, 0, 0.006, grey(0.1, { r: 0.3 }), 16).rotation.x = Math.PI / 2; add(pin, new THREE.SphereGeometry(0.0085, 12, 8), grey(0.15, { r: 0.25 })).position.z = 0.014; });
    return g;
  }
  const LX = -0.2, RX = 0.22;
  const jg = pinned(prints.jodCrop.tex, PWd, JH, LX, jTop, 0.004, -0.012);
  const og = pinned(prints.offCrop.tex, PWd, OH, RX, oTop, 0.003, 0.01);
  // the boxes around the rock: double line (white inside black) so they read on dark and light ground
  function rbox(g, w, h) {
    const x0 = (bx0 - 0.5) * w - 0.006, x1 = (bx1 - 0.5) * w + 0.006, y0 = (0.5 - by0) * h + 0.006, y1 = (0.5 - by1) * h - 0.004;
    const seg4 = (r, m, z) => { rod(g, V(x0, y0, z), V(x1, y0, z), r, m, 4, { cast: false }); rod(g, V(x1, y0, z), V(x1, y1, z), r, m, 4, { cast: false }); rod(g, V(x1, y1, z), V(x0, y1, z), r, m, 4, { cast: false }); rod(g, V(x0, y1, z), V(x0, y0, z), r, m, 4, { cast: false }); };
    seg4(0.0028, grey(0.02), 0.0012); seg4(0.0012, glow(1.6), 0.0032);
    return { x0, x1, y0, y1 };
  }
  rbox(jg, PWd, JH); rbox(og, PWd, OH);
  // the thread at the true rock's height, pinned across both prints
  const thY = oTop - by0 * OH + 0.004;
  rod(scene, V(LX - PWd / 2 - 0.05, thY, 0.016), V(RX + PWd / 2 + 0.05, thY, 0.016), 0.0016, grey(0.02), 6);
  [LX - PWd / 2 - 0.05, RX + PWd / 2 + 0.05].forEach(x => add(scene, new THREE.SphereGeometry(0.008, 12, 8), grey(0.1)).position.set(x, thY, 0.018));
  // labels
  function label(t, cx, y, w, rot, id) {
    const h = w * 0.3, CW = 1600, CH = Math.round(CW * 0.3);
    const L = paperCanvas(CW, CH, (g, put) => { put(id + 'cn', t.cn, 70, 200, 'sans', 136, { weight: 900 }); put(id + 'en', t.en, 70, 400, 'type', 100, { stroke: 0.05 }); });
    const m = add(scene, new THREE.PlaneGeometry(w, h, 8, 4), printMat(canvasTex(L.canvas), { bias: 0.7, text: true })); m.position.set(cx, y, 0.009); m.rotation.z = rot;
    add(scene, new THREE.SphereGeometry(0.007, 10, 8), grey(0.12)).position.set(cx - w / 2 + 0.014, y + h / 2 - 0.012, 0.016);
    L.lines.forEach(l => reg(m, CW, CH, w, h, l, t => true));
  }
  const labY = baseY - 0.035 - Math.max((1 - by1) * JH, (1 - by1) * OH) - 0.07;
  label(BOARD.left, LX - 0.02, labY, 0.36, 0.015, 'L'); label(BOARD.right, RX + 0.02, labY, 0.36, -0.01, 'R');
  // stamps: a black square, words knocked out in paper
  function stamp(t, cx, cy, rot, id, when) {
    const w = 0.19, h = 0.114, CW = 1000, CH = 600;
    const S = paperCanvas(CW, CH, (g, put) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); g.strokeStyle = '#fff'; g.lineWidth = 16; g.strokeRect(34, 34, CW - 68, CH - 68);
      put(id + 'cn', t.cn, CW / 2, 300, 'sans', 205, { weight: 900, color: '#fff', align: 'center' }); put(id + 'en', t.en, CW / 2, 492, 'sans', 112, { weight: 900, color: '#fff', align: 'center' });
      const r = mulberry(id.length * 7); g.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { const x = r() * CW, y = r() < 0.5 ? r() * 60 : CH - r() * 60; g.fillRect(x, y, 2 + r() * 5, 2 + r() * 5); }   // dry ink at the edges
    });
    const m = add(scene, new THREE.PlaneGeometry(w, h), printMat(canvasTex(S.canvas), { bias: 0.3, text: true }), { cast: false }); m.position.set(cx, cy, 0.022); m.rotation.z = rot;
    S.lines.forEach(l => reg(m, CW, CH, w, h, l, when));
    return m;
  }
  const s1 = stamp(BOARD.stamp1, LX - 0.06, baseY - 0.06, -0.08, 's1', t => t >= STAMP1);
  const s2 = stamp(BOARD.stamp2, LX + 0.05, jTop - 0.06, 0.06, 's2', t => t >= STAMP2);
  // light: window from the left at dawn
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-1.5, 0.9, 1.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 6 }); key.shadow.bias = -0.0004; scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.55));
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 20);
  const midY = (Math.max(jTop, oTop) + labY - 0.06) / 2;
  const cx = -0.04;
  function update(t) {
    const pop = (ts, m) => { m.visible = t >= ts; const k = clamp((t - ts) / 0.07); m.scale.setScalar(1 + 0.12 * (1 - k)); };
    pop(STAMP1, s1); pop(STAMP2, s2);
    const yaw = 0.26; const d = 0.96;
    camera.position.set(cx + Math.sin(yaw) * d, midY + 0.02, Math.cos(yaw) * d); camera.up.set(0, 1, 0); camera.lookAt(cx, midY, 0); camera.fov = 40; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return { exp: 1.0, lo: 0.08, hi: 0.8, edgeK: 0.03 };
  }
  function textsAt(t, W, H) {
    const out = [];
    for (const x of texts) { if (!x.when(t)) continue; const b = screenBox(x.mesh, x.corners, camera, W, H); if (b) out.push({ id: x.id, text: x.text, ...b }); }
    return out;
  }
  return { scene, camera, update, texts: textsAt, rbox: { bx0, bx1, by0, by1 } };
}
