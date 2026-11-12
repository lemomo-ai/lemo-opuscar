// The newspaper's picture receiver: a paper-wrapped drum on a lead-screw machine. Cut ④ watches it spin up from the
// side; the macro shot locks onto the paper and follows the line being printed (one line per sixteenth note), then
// pushes into the biggest rock through the print's own dots.
import * as THREE from 'three';
import { V, grey, add, box, cyl, rod } from './kit.js';
import { clamp, lerp, seg, ss, eio, ei } from '/core/lib.js';
import { T, CUTS, PRINT } from './timeline.js';
import { JDOTS } from './prints.js';

const RD = 0.09, IMG_H = 0.18, IMG_W = 0.12, DPHI = IMG_W / RD;
export function buildDrum(ctx) {
  const { prints, moon } = ctx;
  const scene = new THREE.Scene();
  const METAL = grey(0.55, { r: 0.35, m: 0.0 }), DARKM = grey(0.16, { r: 0.5 }), BODY = grey(0.32, { r: 0.6 }), BRIGHT = grey(0.85, { r: 0.3 });
  const mach = new THREE.Group(); scene.add(mach);
  // base, end plates, front panel
  box(mach, 0.56, 0.07, 0.34, 0, -0.155, 0, BODY);
  box(mach, 0.56, 0.02, 0.34, 0, -0.115, 0, DARKM);
  [-1, 1].forEach(s => { box(mach, 0.022, 0.25, 0.24, s * 0.18, -0.01, 0, BODY); cyl(mach, 0.03, 0.03, 0.03, s * 0.168, 0, 0, METAL, 24).rotation.z = Math.PI / 2; });
  // lead screw and the carriage with its stylus arm (top-back of the drum)
  const screw = rod(mach, V(-0.19, 0.115, -0.045), V(0.19, 0.115, -0.045), 0.006, METAL, 10);
  for (let i = 0; i < 40; i++) { const x = -0.18 + i * 0.009; const r = add(mach, new THREE.TorusGeometry(0.0062, 0.0012, 4, 12).rotateY(Math.PI / 2), METAL); r.position.set(x, 0.115, -0.045); }
  rod(mach, V(-0.19, 0.145, -0.07), V(0.19, 0.145, -0.07), 0.005, METAL, 8);
  const carriage = new THREE.Group(); mach.add(carriage);
  box(carriage, 0.04, 0.045, 0.05, 0, 0.13, -0.055, DARKM);
  box(carriage, 0.008, 0.008, 0.05, 0, 0.1, -0.02, METAL);
  const lamp = box(carriage, 0.012, 0.012, 0.012, 0, 0.093, 0.0, new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2, 2) }), { cast: false, flat: true });
  // motor and belt at the right
  cyl(mach, 0.045, 0.045, 0.09, 0.26, -0.07, 0, DARKM, 28).rotation.z = Math.PI / 2;
  cyl(mach, 0.05, 0.05, 0.012, 0.215, -0.07, 0, METAL, 28).rotation.z = Math.PI / 2;
  // front panel: dial with needle, two knobs, a toggle
  const panel = box(mach, 0.5, 0.06, 0.012, 0, -0.155, 0.176, DARKM);
  { const d = add(mach, new THREE.CylinderGeometry(0.026, 0.026, 0.006, 32).rotateX(Math.PI / 2), BRIGHT); d.position.set(-0.12, -0.155, 0.184);
    rod(mach, V(-0.12, -0.162, 0.188), V(-0.105, -0.142, 0.188), 0.0015, DARKM, 4);
    [0.02, 0.08].forEach(x => cyl(mach, 0.012, 0.012, 0.014, x, -0.155, 0.188, METAL, 16).rotation.x = Math.PI / 2);
    box(mach, 0.006, 0.02, 0.006, 0.15, -0.15, 0.188, METAL); }

  // drum: metal cylinder, the paper wrap, the clamp bar; spins about x
  const drum = new THREE.Group(); mach.add(drum);
  cyl(drum, RD - 0.002, RD - 0.002, 0.33, 0, 0, 0, METAL, 64).rotation.z = Math.PI / 2;
  [-1, 1].forEach(s => { const r = add(drum, new THREE.TorusGeometry(RD, 0.004, 8, 64).rotateY(Math.PI / 2), METAL); r.position.x = s * 0.163; });
  // paper: image space uv (0..1 inside the picture), margins outside; φ = 0 faces +z
  const PH0 = -1.45, PH1 = 1.45, X0 = -0.14, X1 = 0.14, NU = 140, NV = 120; const pos = [], uv = [], idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const ph = lerp(PH0, PH1, i / NU), x = lerp(X0, X1, j / NV);
    pos.push(x, -RD * Math.sin(ph), RD * Math.cos(ph)); uv.push((ph + DPHI / 2) / DPHI, (x + IMG_H / 2) / IMG_H);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); pg.setIndex(idx); pg.computeVertexNormals();
  const tex = prints.jod.tex;
  const U = { uTS: { value: new THREE.Vector2(...JDOTS) }, uProg: { value: 0 }, uRows: { value: PRINT.rows } };
  const paper = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide });
  paper.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = 'uniform vec2 uTS; uniform float uProg, uRows;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 q = vMapUv; float inside = step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);
      float tv = texture2D(map, clamp(q, 0.001, 0.999)).r;
      vec2 fw = fwidth(q*uTS); float tp = max(max(fw.x, fw.y), 1e-4); float w = clamp(tp*0.55, 0.02, 0.5);
      float v = mix(smoothstep(0.5-w, 0.5+w, tv), tv, smoothstep(0.45, 0.95, tp));
      float rf = (1.0-q.y)*uRows; float row = floor(rf); float cur = floor(uProg);
      float printed = row < cur ? 1.0 : (row == cur && q.x < fract(uProg) ? 1.0 : 0.0);
      v = mix(1.0, v, inside*printed);
      // the stylus: a short black bar on the line being written, and a thin guide tick at both margins
      float onRow = step(abs(rf - cur - 0.5), 1.6) * step(uProg, uRows - 0.001);
      v *= 1.0 - onRow*step(abs(q.x - fract(uProg)), 0.009)*step(-0.02, q.x)*step(q.x, 1.02);
      v *= 1.0 - onRow*(step(-0.06, q.x)*step(q.x, -0.035) + step(1.035, q.x)*step(q.x, 1.06));
      diffuseColor *= vec4(vec3(v), 1.0);`);
  };
  paper.customProgramCacheKey = () => 'drumpaper';
  const paperMesh = add(drum, pg, paper);
  box(drum, 0.3, 0.008, 0.016, 0, 0, -RD - 0.003, DARKM).position.set(0, -RD * Math.sin(Math.PI), RD * Math.cos(Math.PI) - 0.002);

  // lights
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(0.2, 0.6, 1.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -0.4, right: 0.4, top: 0.4, bottom: -0.4, near: 0.1, far: 3 }); key.shadow.bias = -0.0005;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-1, 0.2, 0.4); scene.add(fill);
  const bounce = new THREE.HemisphereLight(0xffffff, 0x222222, 0.25); scene.add(bounce);
  // backdrop (room, dark)
  const back = add(scene, new THREE.PlaneGeometry(4, 2), grey(0.12)); back.position.set(0, 0.3, -0.9);
  const desk = add(scene, new THREE.PlaneGeometry(4, 3).rotateX(-Math.PI / 2), grey(0.28)); desk.position.y = -0.19;

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.001, 20);
  const t4 = CUTS[3];
  // R in the picture (image space)
  const rp = moon.R.position.clone().add(V(0, 0.08, 0)).project(moon.photoCam); const xR = (rp.x + 1) / 2, yR = (1 - rp.y) / 2;
  const prog = t => clamp((t - PRINT.t0) / PRINT.rowDur, 0, PRINT.rows);
  const axialOf = r => IMG_H / 2 - (r / PRINT.rows) * IMG_H;
  const tPush = T.D0 + 5.9;
  function update(t) {
    U.uProg.value = prog(t);
    if (t < T.D0) {
      // cut ④: from the side, the drum spins up (blank paper, clamp bar sweeping)
      const tau = Math.max(0, t - t4 - 0.12); drum.rotation.x = -(0.3 + 2 * Math.PI * 0.5 * 3.2 * tau * tau);
      carriage.visible = true; carriage.position.x = 0.12; lamp.visible = true;
      camera.up.set(0, 1, 0); camera.fov = 34; camera.position.set(0.5 + 0.03 * (t - t4), 0.2, 0.42); camera.lookAt(0.02, -0.01, 0); camera.updateProjectionMatrix();
      U.uProg.value = 0;
      return { exp: 1.1, lo: 0.08, hi: 0.85, edgeK: 0.03, ap: 0 };
    }
    drum.rotation.x = 0; carriage.visible = false;
    // macro: locked to the paper, image upright (drum axis runs up the screen), following the line being printed
    const p = U.uProg.value; const ax = axialOf(Math.min(p, PRINT.rows - 6) + 0.5);
    let C = V(ax, 0, RD), dist = 0.135 + 0.01 * Math.sin((t - T.D0) * 0.9), side = 0.004 * Math.sin((t - T.D0) * 0.7);
    let aim = V(ax, -RD * Math.sin(side / RD), RD * Math.cos(side / RD));
    if (t > tPush) {
      const u = eio(seg(t, tPush, T.E0 + 0.05));
      const ph = (xR - 0.035 - 0.5) * DPHI, axR = IMG_H / 2 - yR * IMG_H;
      const tgt0 = 0; const tgt = V(axR + 0.006, -RD * Math.sin(ph), RD * Math.cos(ph));
      aim.lerp(tgt, ss(seg(t, tPush, tPush + 0.8)));
      dist = Math.exp(lerp(Math.log(dist), Math.log(0.0042), Math.pow(u, 1.35)));
    }
    const n = V(0, aim.y, aim.z).normalize();
    camera.position.copy(aim).addScaledVector(n, dist);
    camera.up.set(1, 0, 0); camera.lookAt(aim); camera.fov = 40; camera.near = Math.max(0.0003, dist * 0.2); camera.updateProjectionMatrix();
    return { exp: 1.15, lo: 0.06, hi: 0.8, edgeK: 0.03, ap: 40 * dist * 1.0, focus: dist, maxCoc: 9, edge: dist > 0.03 };
  }
  function texts() { return []; }
  return { scene, camera, update, texts, xR, yR };
}
