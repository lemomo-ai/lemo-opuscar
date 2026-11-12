// Shot 1: dusk, 4 Feb 1966, Cheshire. Frost on the grass in the foreground; the 76.2 m bowl of the Mark I telescope
// turning on its circular track towards the Moon, which has just risen in the east. Rack focus from the grass to the
// telescope, rise along the rim to the feed mast, push into the ring at its top (shape match to the oscilloscope).
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod } from './kit.js';
import { L_FLAT } from './pipe.js';
import { GLSL_NOISE } from './noise.js';
import { clamp, lerp, seg, ss, eio, ei, eo, monotone, mulberry } from '/core/lib.js';
import { T } from './timeline.js';

export const MOON_DIR = V(-0.5, 0.13, 1).normalize();
export function buildDusk() {
  const scene = new THREE.Scene();
  // ---------- sky: dusk gradient towards the east, the near-full Moon low on the horizon ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uM: { value: MOON_DIR }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: GLSL_NOISE + `uniform vec3 uM; uniform float uK; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float el = max(d.y, 0.0);
      float g = 0.018 + 0.30*exp(-el/0.11) + 0.08*exp(-el/0.35);
      float a = acos(clamp(dot(d,uM),-1.,1.));
      vec3 x = normalize(cross(uM, vec3(0,1,0))), y = cross(x, uM); vec2 p = vec2(dot(d,x), dot(d,y))/0.042;
      float mare = smoothstep(0.45, 0.62, fbm(p*2.2+3.0))*0.55;
      float disc = a < 0.042 ? 2.6*(1.0-mare)*(1.0-0.3*pow(a/0.042,4.0)) : 0.0;
      g += disc + 0.25*exp(-a*30.0) + 0.06*exp(-a*7.0);
      gl_FragColor = vec4(vec3(g*uK),1.); }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 64, 32), skyMat); sky.layers.set(L_FLAT); scene.add(sky);
  // ---------- ground, hedges, a farm on the horizon ----------
  const groundMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.16, 0.16, 0.16) });
  const gg = new THREE.PlaneGeometry(2400, 2400, 120, 120).rotateX(-Math.PI / 2); { const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const r = Math.hypot(x, z - 120); p.setY(i, r > 70 ? 0.6 * Math.sin(x * 0.01) * Math.sin(z * 0.013) * Math.min(1, (r - 70) / 200) : 0); } gg.computeVertexNormals(); }
  add(scene, gg, groundMat, { cast: false });
  const SIL = glow(0.0);
  { const r = mulberry(3); const N = 260; const pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const a = -1.2 + 2.4 * i / N; const R = 520; const x = Math.sin(a) * R, z = Math.cos(a) * R + 60; const h = 6 + 5 * r() + 4 * Math.sin(i * 0.37) + (r() < 0.08 ? 7 : 0); pos.push(x, -1, z, x, h, z); if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); add(scene, g, SIL, { cast: false, recv: false }); }
  { const farm = new THREE.Group(); farm.position.set(150, 0, 470); farm.rotation.y = 0.4; scene.add(farm);
    box(farm, 14, 7, 9, 0, 3.5, 0, SIL); const roof = add(farm, new THREE.CylinderGeometry(0, 8.5, 4, 4, 1).rotateY(Math.PI / 4), SIL); roof.scale.set(1.15, 1, 0.75); roof.position.y = 9; box(farm, 1.2, 3, 1.2, 4, 11, 0, SIL);
    box(farm, 1.4, 1.2, 0.3, -3, 3.6, -4.6, glow(1.6), { cast: false, flat: true }); }

  // ---------- the telescope: circular track, two towers, the bowl, the feed mast and its ring ----------
  const STEEL = grey(0.2, { r: 0.6 }), BOWL = grey(0.4, { r: 0.55, side: THREE.DoubleSide });
  const tel = new THREE.Group(); tel.position.set(-12, 0, 118); scene.add(tel);
  const trackR = 53.75;
  add(tel, new THREE.TorusGeometry(trackR, 0.35, 6, 160).rotateX(Math.PI / 2), STEEL).position.y = 0.3;
  add(tel, new THREE.TorusGeometry(trackR - 1.4, 0.35, 6, 160).rotateX(Math.PI / 2), STEEL).position.y = 0.3;
  const turn = new THREE.Group(); tel.add(turn);                 // rotates in azimuth on the track
  const AX_H = 50, BR = 38.1, F = 22.9;
  [-1, 1].forEach(s => {
    const x = s * (BR + 5);
    // A-frame tower: two raking legs, a vertical leg, three cross beams, the bogie on the track
    const top = V(x, AX_H, 0);
    rod(turn, V(x, 0.6, -16), top, 1.1, STEEL, 8); rod(turn, V(x, 0.6, 16), top, 1.1, STEEL, 8); rod(turn, V(x, 0.6, 0), top, 0.9, STEEL, 8);
    [14, 28, 40].forEach(h => { const w = 16 * (1 - h / AX_H); rod(turn, V(x, h, -w), V(x, h, w), 0.55, STEEL, 6); });
    rod(turn, V(x, 14, -12), V(x, 28, 0), 0.4, STEEL, 6); rod(turn, V(x, 14, 12), V(x, 28, 0), 0.4, STEEL, 6);
    box(turn, 4, 3, 36, x, 1.5, 0, STEEL);
    cyl(turn, 2.4, 2.4, 3, x - s * 1.0, AX_H, 0, STEEL, 20).rotation.z = Math.PI / 2;
  });
  rod(turn, V(-BR - 5, 1.2, -16), V(BR + 5, 1.2, -16), 0.6, STEEL, 6); rod(turn, V(-BR - 5, 1.2, 16), V(BR + 5, 1.2, 16), 0.6, STEEL, 6);
  const tilt = new THREE.Group(); tilt.position.y = AX_H; turn.add(tilt);   // rotates in elevation about x
  const bowlG = new THREE.Group(); tilt.add(bowlG); bowlG.position.y = -11;   // vertex below the axis
  { const NR = 30, NA = 96, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) { const r = BR * i / NR, y = r * r / (4 * F); for (let j = 0; j <= NA; j++) { const a = j / NA * Math.PI * 2; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add(bowlG, g, BOWL);
    const rimY = BR * BR / (4 * F);
    add(bowlG, new THREE.TorusGeometry(BR, 0.6, 8, 120).rotateX(Math.PI / 2), STEEL).position.y = rimY;
    add(bowlG, new THREE.TorusGeometry(BR * 0.62, 0.5, 8, 96).rotateX(Math.PI / 2), STEEL).position.y = Math.pow(BR * 0.62, 2) / (4 * F) - 1.2;
    for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; const pts = []; for (let i = 2; i <= 10; i++) { const r = BR * i / 10; pts.push(V(Math.cos(a) * r, r * r / (4 * F) - 1.4 - 1.2 * Math.sin(i / 10 * Math.PI), Math.sin(a) * r)); } add(bowlG, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.45, 5), STEEL); }
    // trunnions from the bowl to the bearings
    [-1, 1].forEach(s => rod(tilt, V(s * BR * 0.97, -11 + rimY * 0.9, 0), V(s * (BR + 4), 0, 0), 1.1, STEEL, 8));
  }
  // feed mast: a tapering lattice-free tower from the vertex to the focus, the feed cabin and the ring at its top
  const feedTop = F - 0.5;
  rod(bowlG, V(0, 0, 0), V(0, feedTop - 2, 0), 0.9, STEEL, 10); rod(bowlG, V(0, 0, 0), V(0, feedTop - 2, 0), 0.6, STEEL, 10);
  [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; rod(bowlG, V(Math.cos(a) * 12, 144 / (4 * F), Math.sin(a) * 12), V(0, feedTop - 6, 0), 0.25, STEEL, 6); });
  cyl(bowlG, 1.15, 1.0, 3.2, 0, feedTop - 1.2, 0, grey(0.32, { r: 0.5 }), 24);
  const RING_R = 1.55;
  const ring = add(bowlG, new THREE.TorusGeometry(RING_R, 0.2, 14, 64).rotateX(Math.PI / 2), grey(0.85, { r: 0.35 })); ring.position.y = feedTop + 0.6;
  const throat = add(bowlG, new THREE.CircleGeometry(RING_R - 0.15, 48).rotateX(-Math.PI / 2), grey(0.04)); throat.position.y = feedTop + 0.45;
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; rod(bowlG, V(Math.cos(a) * 1.0, feedTop + 0.4, Math.sin(a) * 1.0), V(Math.cos(a) * RING_R, feedTop + 0.6, Math.sin(a) * RING_R), 0.08, STEEL, 5); }
  // a control hut by the track
  { const hut = new THREE.Group(); hut.position.set(62, 0, -18); hut.rotation.y = 0.5; tel.add(hut); box(hut, 16, 5, 9, 0, 2.5, 0, grey(0.25)); box(hut, 2.2, 1.2, 0.3, -3, 3.0, 4.6, glow(1.4), { cast: false, flat: true }); box(hut, 2.2, 1.2, 0.3, 3, 3.0, 4.6, glow(1.4), { cast: false, flat: true }); }

  // ---------- frost on the grass, right at the lens ----------
  const grass = new THREE.Group(); scene.add(grass);
  const BLADE = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.28, 0.28, 0.28), side: THREE.DoubleSide });
  const ICE = glow(2.6);
  { const r = mulberry(17); const ice = [];
    for (let b = 0; b < 70; b++) {
      const x = (r() - 0.5) * 0.5, z = 0.14 + r() * 0.3; if (Math.abs(x) < 0.04 && z < 0.25) continue;
      const h = 0.05 + r() * 0.14, lean = (r() - 0.5) * 0.7, bend = 0.3 + r() * 0.6, w = 0.004 + r() * 0.003, yaw = r() * Math.PI;
      const N = 10, pos = [], idx = [];
      const P = s => V(Math.sin(lean) * s * h + bend * 0.15 * s * s * h, Math.cos(lean) * s * h * (1 - 0.25 * bend * s * s), 0);
      for (let i = 0; i <= N; i++) { const s = i / N, p = P(s), ww = w * (1 - s * 0.9); pos.push(p.x - ww * Math.cos(yaw), p.y, p.z - ww * Math.sin(yaw), p.x + ww * Math.cos(yaw), p.y, p.z + ww * Math.sin(yaw)); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = add(grass, g, BLADE, { cast: false }); m.position.set(x, 0, z);
      // a row of ice crystals along the edge of each blade
      const nI = 3 + Math.floor(r() * 7);
      for (let k = 0; k < nI; k++) { const s = 0.15 + 0.8 * k / nI + r() * 0.04; const p = P(s); const side = r() < 0.5 ? -1 : 1; const ww = w * (1 - s * 0.9);
        ice.push([x + p.x + side * ww * Math.cos(yaw), p.y, z + p.z + side * ww * Math.sin(yaw), 0.0012 + r() * 0.0016]); }
    }
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), ICE, ice.length); im.layers.set(L_FLAT); im.frustumCulled = false;
    const m4 = new THREE.Matrix4(); ice.forEach((c, i) => { m4.makeScale(c[3], c[3], c[3]); m4.setPosition(c[0], c[1], c[2]); im.setMatrixAt(i, m4); }); grass.add(im);
  }

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 0.55));
  const west = new THREE.DirectionalLight(0xffffff, 0.5); west.position.set(200, 30, -300); scene.add(west);

  // ---------- camera ----------
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.02, 4000);
  const az = t => 0.86 + 0.16 * seg(t, 0, 4);       // slowly turning towards the Moon
  const EL = 0.62;
  function pose(t) { turn.rotation.y = az(t); tilt.rotation.x = -EL; tel.updateMatrixWorld(true); }
  pose(0);
  const ringW = () => ring.getWorldPosition(new THREE.Vector3());
  const ringN = () => V(0, 1, 0).applyQuaternion(ring.getWorldQuaternion(new THREE.Quaternion())).normalize();
  // final framing: seen 0.5 rad off the ring's axis, from above, filling the frame like the scope bezel does
  function finalPose(t) {
    pose(t); const c = ringW(), n = ringN();
    const side = V(0, 1, 0).cross(n).normalize(); const dir = n.clone().applyAxisAngle(side, -0.5).normalize();
    const d = (RING_R + 0.2) * 2 / (1.26 * 2 * Math.tan(20 * Math.PI / 180));
    return { p: c.clone().addScaledVector(dir, d), tg: c.clone() };
  }
  const KB = 15, KH = 70, UE = ss, KT = 2.0;   // push: P2 = 15 ring-distances out on the axis, P1 = 70 m above the start, from 2.0 s (measured: turn ≤ 50 mrad per frame)
  function update(t) {
    pose(t);
    const fin = finalPose(t), rc = ringW();
    const rimTop = tilt.localToWorld(V(0, -11 + BR * BR / (4 * F), -BR * 0.7));
    const P0 = V(0.0, 0.075, 0), TG0 = V(-6, 22, 118);
    let p, tg, fov = 50;
    const u1 = eio(seg(t, 1.35, 2.75)), u2 = eio(seg(t, 2.6, 4.0));
    p = P0.clone().add(V(0.02 * Math.sin(t * 1.3), 0.004 * Math.sin(t * 2.1), 0.03 * t));
    tg = TG0.clone().lerp(rimTop, u1).lerp(rc, ss(seg(t, 2.2, 3.6)));   // long blend: the pan never dips
    p.lerp(V(-2, 9, 30), u1 * 0.6);
    fov = lerp(50, 40, u1);   // zooms one way only (50 → 40), no in-and-back-out bounce
    // the last push: a cubic Bézier that climbs early (P1 above the start) and comes down onto the ring along its final
    // viewing axis (P2 out on that axis), so the 90° tilt from "looking across" to "looking down" happens high and far
    // away, and the final half second is a straight dolly with no turn
    if (t > KT) { const ax = fin.p.clone().sub(rc); const P0 = p.clone(), P1 = P0.clone().add(V(0, KH, 0)), P2 = fin.p.clone().addScaledVector(ax, KB), P3 = fin.p;
      const u = UE(seg(t, KT, 4.0)), a = 1 - u;
      p = P0.multiplyScalar(a * a * a).addScaledVector(P1, 3 * a * a * u).addScaledVector(P2, 3 * a * u * u).addScaledVector(P3, u * u * u);
      tg.lerp(fin.tg, u2); fov = lerp(fov, 40, u2); }
    camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); camera.fov = fov; camera.near = t > 3.5 ? 0.5 : 0.02; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // rack focus: grass (0.22 m) → the telescope; no blur once the camera leaves the ground
    const fz = Math.exp(lerp(Math.log(0.22), Math.log(130), ss(seg(t, 0.45, 1.45))));
    const ap = t < 1.6 ? 2.6 : lerp(2.6, 0, seg(t, 1.6, 2.2));
    return { exp: 1.0, lo: 0.06, hi: 0.8, ap, focus: fz, maxCoc: 11, farEdge: 900, edgeK: 0.06, lineLum: 0.25 };
  }
  return { scene, camera, update };
}
