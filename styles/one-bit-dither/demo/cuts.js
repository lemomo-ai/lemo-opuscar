// Shot 3, cuts ①–③ (④ is the drum, in drum.js): a car's headlights sweep the frosted car park (seen from above,
// through a frosted window); the crate stencilled PICTURE RECEIVER, lid open; a plug goes into the wall and the
// indicator's ring of dots lights. One cut per signal sync.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat, paperCanvas } from './kit.js';
import { L_FLAT } from './pipe.js';
import { clamp, lerp, seg, ss, eio, eo, mulberry } from '/core/lib.js';
import { CUTS, SYNC } from './timeline.js';
import { CRATE } from './texts.js';

export function buildCuts() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.01, 200);
  // =============== ① the car park at night, from an upstairs window ===============
  const A = new THREE.Group(); scene.add(A);
  { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); const r = mulberry(5);
    g.fillStyle = '#404040'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 9000; i++) { const v = 40 + r() * 70; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 4); }
    g.fillStyle = '#d8d8d8'; for (let i = 0; i < 6; i++) g.fillRect(120 + i * 150, 80, 12, 330);
    const lot = add(A, new THREE.PlaneGeometry(24, 24).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: canvasTex(c) }), { cast: false }); }
  // frost glitter on the gravel (catches the beams)
  { const r = mulberry(8); const N = 1400; const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x000000 }), N); const m4 = new THREE.Matrix4();
    for (let i = 0; i < N; i++) { const s = 0.012 + r() * 0.02; m4.makeScale(s, s * 0.4, s); m4.setPosition((r() - 0.5) * 20, 0.005, (r() - 0.5) * 20); im.setMatrixAt(i, m4); } A.add(im); }
  box(A, 24, 0.9, 0.4, 0, 0.45, -6.5, grey(0.35));                                      // low wall
  const car = new THREE.Group(); A.add(car);
  { const BODY = grey(0.1, { r: 0.35 });
    box(car, 1.65, 0.62, 4.1, 0, 0.5, 0, BODY); const cab = box(car, 1.45, 0.52, 2.0, 0, 1.06, -0.25, BODY);
    box(car, 1.5, 0.04, 2.05, 0, 1.33, -0.25, grey(0.55, { r: 0.3 })); box(car, 1.55, 0.03, 1.2, 0, 0.82, 1.4, grey(0.4, { r: 0.3 }));
    [[-0.78, 1.3], [0.78, 1.3], [-0.78, -1.3], [0.78, -1.3]].forEach(([x, z]) => cyl(car, 0.32, 0.32, 0.22, x, 0.32, z, grey(0.05), 20).rotation.z = Math.PI / 2);
    [-0.55, 0.55].forEach(x => { const h = add(car, new THREE.CircleGeometry(0.13, 20), glow(4), { cast: false, flat: true }); h.position.set(x, 0.62, 2.06); }); }
  const beams = [-0.55, 0.55].map(x => { const s = new THREE.SpotLight(0xffffff, 60, 26, 0.42, 0.5, 1.4); s.position.set(x, 0.62, 2.1); s.target.position.set(x * 1.4, 0, 9); car.add(s, s.target); return s; });
  // the window: frame and frost (cut-out texture) right at the lens
  const frost = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 576; const g = c.getContext('2d'); const r = mulberry(13);
    g.clearRect(0, 0, 1024, 576); g.strokeStyle = '#fff'; g.lineCap = 'round';
    const fern = (x, y, a, len, w, d) => { if (d > 5 || len < 6) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      const n = 3 + Math.floor(r() * 3); for (let i = 1; i <= n; i++) { const f = i / (n + 1); const bx = x + (x2 - x) * f, by = y + (y2 - y) * f; fern(bx, by, a + 1.0 + r() * 0.3, len * 0.42, w * 0.7, d + 1); fern(bx, by, a - 1.0 - r() * 0.3, len * 0.42, w * 0.7, d + 1); }
      fern(x2, y2, a + (r() - 0.5) * 0.4, len * 0.7, w * 0.8, d + 1); };
    for (let i = 0; i < 70; i++) { const e = r(); let x, y, a; if (e < 0.25) { x = r() * 1024; y = 576; a = -Math.PI / 2; } else if (e < 0.5) { x = r() * 1024; y = 0; a = Math.PI / 2; } else if (e < 0.75) { x = 0; y = r() * 576; a = 0; } else { x = 1024; y = r() * 576; a = Math.PI; } fern(x, y, a + (r() - 0.5) * 0.9, 30 + r() * 75, 4, 0); }
    return canvasTex(c); })();
  const frostMat = new THREE.MeshBasicMaterial({ map: frost, alphaTest: 0.4, transparent: false, color: new THREE.Color(0.55, 0.55, 0.55) });
  const frostP = add(A, new THREE.PlaneGeometry(1.6, 0.9), frostMat, { cast: false, flat: true });
  const camA = { p: V(1.6, 6.4, -6.5), tg: V(1.2, 0, 2.6) };
  { const d = camA.tg.clone().sub(camA.p).normalize(); frostP.position.copy(camA.p).addScaledVector(d, 0.5); frostP.lookAt(camA.p);
    const bar = new THREE.Group(); bar.position.copy(frostP.position); bar.quaternion.copy(frostP.quaternion); A.add(bar);
    box(bar, 0.025, 1.0, 0.02, 0.33, 0, 0.01, grey(0.03)); box(bar, 1.8, 0.022, 0.02, 0, -0.29, 0.01, grey(0.03)); }
  // a lamp post at the far corner of the car park
  { const post = new THREE.Group(); post.position.set(5.5, 0, 4.5); A.add(post); rod(post, V(0, 0, 0), V(0, 4.2, 0), 0.06, grey(0.2)); rod(post, V(0, 4.2, 0), V(-0.7, 4.3, 0), 0.04, grey(0.2));
    add(post, new THREE.SphereGeometry(0.12, 12, 8), glow(3), { cast: false, flat: true }).position.set(-0.75, 4.15, 0);
    const pl = new THREE.PointLight(0xffffff, 26, 14, 1.6); pl.position.set(5.5 - 0.75, 4.0, 4.5); A.add(pl); }
  // =============== ② the crate ===============
  const B = new THREE.Group(); B.position.set(60, 0, 0); scene.add(B);
  { const floor = add(B, new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), grey(0.22), { cast: false, screen: true });
    const wall = add(B, new THREE.PlaneGeometry(10, 4), grey(0.3), { screen: true }); wall.position.set(0, 2, -1.2); }
  const crateC = paperCanvas(2000, 1300, (g, put) => {
    const r = mulberry(4); g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 2000, 1300);
    for (let i = 0; i < 6; i++) { const v = 190 + r() * 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, i * 217 + 6, 2000, 205); g.fillStyle = '#222'; g.fillRect(0, i * 217, 2000, 6); }
    g.fillStyle = '#555'; g.fillRect(0, 0, 70, 1300); g.fillRect(1930, 0, 70, 1300); g.fillRect(0, 0, 2000, 60); g.fillRect(0, 1240, 2000, 60);
    // stencil: letters with the bridges a stencil leaves
    const st = (text, x, y, fam, size, w) => { put(null, text, x, y, fam, size, { weight: w, align: 'center' }); g.fillStyle = '#c8c8c8'; };
    st(CRATE.cn, 1000, 560, 'sans', 330, 900); st(CRATE.en, 1000, 900, 'anton', 250, 400);
    put(null, CRATE.small, 1000, 1110, 'type', 70, { align: 'center' });
    g.lineWidth = 14; g.strokeStyle = '#111'; g.beginPath(); g.moveTo(1000, 1170); g.lineTo(1000, 1000); g.lineTo(950, 1050); g.moveTo(1000, 1000); g.lineTo(1050, 1050); g.stroke();
  });
  const crate = new THREE.Group(); crate.position.set(0, 0, 0); crate.rotation.y = -0.22; B.add(crate);
  const CW = 1.0, CH = 0.65, CD = 0.7;
  const WOODL = grey(0.62, { r: 0.8 });
  const side = add(crate, new THREE.PlaneGeometry(CW, CH), printMat(canvasTex(crateC.canvas), { side: THREE.FrontSide })); side.position.set(0, CH / 2, CD / 2 + 0.001);
  box(crate, CW, CH, CD, 0, CH / 2, 0, WOODL);
  [-1, 1].forEach(s => box(crate, 0.05, CH, 0.05, s * (CW / 2 - 0.02), CH / 2, CD / 2 + 0.01, grey(0.4)));
  const lid = new THREE.Group(); lid.position.set(0, CH, -CD / 2); crate.add(lid); box(lid, CW + 0.02, 0.03, CD, 0, 0.015, CD / 2, WOODL); lid.rotation.x = -1.95;
  { const r = mulberry(6); for (let i = 0; i < 40; i++) { const a = V((r() - 0.5) * 0.9, CH - 0.02 + r() * 0.06, (r() - 0.5) * 0.6); rod(crate, a, a.clone().add(V((r() - 0.5) * 0.2, 0.02 + r() * 0.08, (r() - 0.5) * 0.2)), 0.003, grey(0.8), 4, { cast: false }); }
    box(crate, CW - 0.06, 0.02, CD - 0.06, 0, CH - 0.02, 0, grey(0.75)); }
  const bulbL = new THREE.SpotLight(0xffffff, 18, 6, 0.9, 0.5, 1.2); bulbL.position.set(60.4, 2.2, 1.6); bulbL.target.position.set(60, 0.3, 0); bulbL.castShadow = true; scene.add(bulbL, bulbL.target);
  // =============== ③ the plug, the socket, the ring of dots ===============
  const Cg = new THREE.Group(); Cg.position.set(-60, 1, 0); scene.add(Cg);
  { const wall = add(Cg, new THREE.PlaneGeometry(2, 1.2), grey(0.4)); wall.position.z = -0.001; }
  const BAKE = grey(0.82, { r: 0.35 });
  const plate = box(Cg, 0.16, 0.1, 0.012, 0, 0, 0.006, BAKE);
  const holes = [[-0.025, 0.012], [0.025, 0.012], [0, -0.018]];
  holes.forEach(([x, y]) => { const h = add(Cg, new THREE.CircleGeometry(0.0055, 16), grey(0.02)); h.position.set(x - 0.03, y, 0.0125); });
  const sw = box(Cg, 0.016, 0.026, 0.01, 0.045, 0.012, 0.017, BAKE); sw.rotation.x = 0.25;
  const ind = add(Cg, new THREE.CylinderGeometry(0.021, 0.022, 0.006, 32).rotateX(Math.PI / 2), grey(0.05, { r: 0.3 })); ind.position.set(0.045, -0.025, 0.013);
  const DOTS = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const d = add(Cg, new THREE.CircleGeometry(0.0022, 10), glow(0.06), { cast: false, flat: true }); d.position.set(0.045 + Math.cos(a) * 0.0145, -0.025 + Math.sin(a) * 0.0145, 0.0163); DOTS.push(d); }
  const core = add(Cg, new THREE.CircleGeometry(0.006, 20), glow(0.05), { cast: false, flat: true }); core.position.set(0.045, -0.025, 0.0164);
  const plug = new THREE.Group(); Cg.add(plug);
  { box(plug, 0.07, 0.07, 0.045, -0.03, -0.002, 0.0225, grey(0.12, { r: 0.4 }));
    holes.forEach(([x, y]) => rod(plug, V(x - 0.03, y, -0.025), V(x - 0.03, y, 0.0), 0.0045, grey(0.75, { r: 0.25 }), 10));
    const cab = []; for (let i = 0; i <= 10; i++) { const s = i / 10; cab.push(V(-0.03 + 0.02 * s, -0.002 - 0.25 * s * s, 0.045 + 0.12 * s)); }
    add(plug, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cab), 30, 0.008, 8), grey(0.1)); }
  const plugL = new THREE.SpotLight(0xffffff, 3, 2, 0.8, 0.6, 1.2); plugL.position.set(-59.7, 1.3, 0.5); plugL.target.position.set(-60, 1, 0); plugL.castShadow = true; scene.add(plugL, plugL.target);

  function update(t) {
    const k = t < CUTS[1] ? 0 : t < CUTS[2] ? 1 : 2;
    if (k === 0) {
      const u = seg(t, CUTS[0], CUTS[1]);
      // the car swings in through the gate: headlights sweep across the frost
      const e = eo(u); car.position.set(lerp(-4.5, 2.6, e), 0, lerp(7.2, 3.2, e) - 1.2 * Math.sin(e * Math.PI)); car.rotation.y = lerp(1.35, 2.5, e);
      beams.forEach(b => b.intensity = 60);
      camera.position.copy(camA.p).add(V(0.02 * u, 0, 0)); camera.up.set(0, 1, 0); camera.lookAt(camA.tg); camera.fov = 45; camera.near = 0.05; camera.updateProjectionMatrix();
      return { exp: 1.0, lo: 0.06, hi: 0.75, edge: true, farEdge: 60 };
    }
    beams.forEach(b => b.intensity = 0);
    if (k === 1) {
      const u = seg(t, CUTS[1], CUTS[2]);
      camera.position.set(60.25 + 0.06 * u, 0.42, 1.55 - 0.08 * u); camera.up.set(0, 1, 0); camera.lookAt(60.05, 0.36, 0); camera.fov = 42; camera.near = 0.05; camera.updateProjectionMatrix();
      return { exp: 1.0, lo: 0.08, hi: 0.8, edgeK: 0.04 };
    }
    const u = seg(t, CUTS[2], CUTS[3]);
    const pin = Math.max(0, 0.06 * (1 - eo(seg(u, 0.0, 0.42))));
    plug.position.set(0, 0, pin);
    const on = u > 0.45; const lit = clamp((u - 0.45) / 0.3) * 12;
    DOTS.forEach((d, i) => d.material = i < lit ? glowOn : glowOff); core.material = on ? glowOn : glowOff;
    camera.position.set(-60 + 0.115, 0.975, 0.105 - 0.008 * u); camera.up.set(0, 1, 0); camera.lookAt(-60 + 0.004, 0.996, 0.018); camera.fov = 38; camera.near = 0.005; camera.updateProjectionMatrix();
    return { exp: 1.0, lo: 0.08, hi: 0.8, edgeK: 0.03 };
  }
  const glowOn = glow(3), glowOff = glow(0.06);
  return { scene, camera, update };
}
