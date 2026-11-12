// The Moon, 3 Feb 1966, Oceanus Procellarum: a cratered regolith plain under a 7° sun, a 58 cm spherical lander with
// four petals and four whip antennas. The same set renders the paper photograph (photo camera, at load) and the
// fly-through. Units: metres; the lander stands at the origin; the glide runs along +z.
import * as THREE from 'three';
import { V, grey, add, cyl, rod } from './kit.js';
import { L_FLAT } from './pipe.js';
import { n2, fbm2, GLSL_NOISE } from './noise.js';
import { mulberry, clamp, lerp, seg, ss, eio, monotone } from '/core/lib.js';
import { T, RIM } from './timeline.js';

const EL = 7 * Math.PI / 180;
const SAZ = 100 * Math.PI / 180;   // sun bearing: 100° to the right of the glide, slightly behind
export const SUN = V(-Math.sin(SAZ) * Math.cos(EL), Math.sin(EL), Math.cos(SAZ) * Math.cos(EL)).normalize();
const RM = 1737400;

// ---------------- terrain height ----------------
const CR = [];
{
  const r = mulberry(9);
  const put = (n, rmin, rmax, dmin, dmax, keep) => { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = dmin + Math.pow(r(), 0.7) * (dmax - dmin); const x = Math.cos(a) * d, z = Math.sin(a) * d; const rad = rmin * Math.pow(rmax / rmin, Math.pow(r(), 1.6)); if (keep && keep(x, z, rad)) continue; CR.push({ x, z, r: rad, d: rad * (0.12 + r() * 0.1) }); } };
  const clear = (x, z, rad) => Math.hypot(x, z) < 3.2 + rad || (Math.abs(x) < 1.2 + rad && z < 0 && z > -6.5 - rad);
  put(70, 0.25, 1.6, 2, 26, clear);
  put(60, 1.5, 9, 20, 260, null);
  put(26, 12, 60, 120, 1500, null);
  CR.push({ x: 6.5, z: -9.5, r: 3.2, d: 0.5 }, { x: -9, z: 6, r: 4.0, d: 0.6 }, { x: 3.5, z: -2.5, r: 0.7, d: 0.1 }, { x: -2.6, z: -6.2, r: 1.1, d: 0.16 });
}
export function hgt(x, z) {
  let h = 0.05 * (fbm2(x * 0.18, z * 0.18, 4) - 0.5) + 0.9 * (fbm2(x * 0.006 + 3, z * 0.006 - 2, 4) - 0.5) + 0.012 * (n2(x * 2.1, z * 2.1) - 0.5);
  for (const c of CR) {
    const dx = x - c.x, dz = z - c.z, q = (dx * dx + dz * dz) / (c.r * c.r); if (q > 4.5) continue;
    const p = Math.sqrt(q);
    h += p < 1 ? -c.d * (1 - q) * 0.95 + c.d * 0.22 * Math.exp(-Math.pow((p - 1) / 0.28, 2)) : c.d * 0.22 * Math.exp(-Math.pow((p - 1) / 0.28, 2) * (p > 1 ? 0.45 : 1));
  }
  const r2 = x * x + z * z; return h - r2 / (2 * RM);
}

function rockGeo(seed, detail = 3, o = {}) {
  const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position; const r = mulberry(seed);
  const ox = r() * 50, oy = r() * 50, oz = r() * 50;
  for (let i = 0; i < p.count; i++) {
    const v = V(p.getX(i), p.getY(i), p.getZ(i));
    let k = 1 + 0.32 * (n2(v.x * 1.3 + ox, v.y * 1.3 + oz) + n2(v.z * 1.3 + oy, v.x * 1.1) - 1) + 0.09 * (n2(v.x * 4 + oy, v.z * 4 + ox) - 0.5) + 0.03 * (n2(v.y * 9, v.z * 9 + oz) - 0.5);
    if (o.peak) k += o.peak * Math.exp(-Math.pow((v.x - o.px) / 0.55, 2) - Math.pow(v.z / 0.8, 2)) * Math.max(0, v.y);
    v.multiplyScalar(k); v.y = Math.max(v.y, -0.25);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}

export function buildMoon() {
  const scene = new THREE.Scene();
  // ---------- terrain: polar grid, dense at the lander, 1.5 km to the horizon ----------
  const NR = 175, NA = 900, a0 = 0.55, b0 = 0.0505;
  const pos = new Float32Array((NR + 1) * NA * 3); const idx = [];
  let k = 0;
  for (let i = 0; i <= NR; i++) {
    const rr = a0 * (Math.exp(b0 * i) - 1);
    for (let j = 0; j < NA; j++) { const a = j / NA * Math.PI * 2; const x = Math.cos(a) * rr, z = Math.sin(a) * rr; pos[k++] = x; pos[k++] = hgt(x, z); pos[k++] = z; }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
  const soil = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.5, 0.5), roughness: 1, metalness: 0 });
  soil.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vWP2;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP2 = (modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = 'varying vec3 vWP2;\n' + GLSL_NOISE + `
      float bh(vec2 q){ return fbm(q*7.0)*0.010 + fbm(q*1.4+5.)*0.045 + n2(q*31.)*0.0025; }
` + sh.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
      { float dc = length(vWP2 - cameraPosition); float fd = smoothstep(40.0, 3.0, dc);
        if (fd > 0.0) { vec2 q = vWP2.xz; float e = 0.012; float h0 = bh(q);
          vec3 g = vec3(-(bh(q+vec2(e,0.))-h0)/e, 0.0, -(bh(q+vec2(0.,e))-h0)/e)*fd*1.6;
          vec3 nw = inverseTransformDirection(normal, viewMatrix); nw = normalize(nw + g);
          normal = normalize((viewMatrix*vec4(nw,0.)).xyz); } }`);
  };
  const ground = add(scene, tg, soil, { cast: true, recv: true });

  // ---------- rocks ----------
  const ROCK = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.58, 0.58, 0.58), roughness: 1, flatShading: false });
  const rocks = [];
  const place = (geo, x, z, sx, sy, sz, ry, sink = 0.28) => { const m = add(scene, geo, ROCK); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.position.set(x, hgt(x, z) + sy * (0.25 - sink), z); rocks.push(m); return m; };
  // hero rock R (the one in every photograph): a rounded boulder with a shoulder on its left
  const RG = rockGeo(41, 4, { peak: 0.35, px: -0.25 });
  const R = place(RG, 0.05, -4.6, 0.56, 0.34, 0.44, 0.4, 0.15);
  // the two rocks whose shadows cross the glide
  place(rockGeo(7, 3), -1.25, -3.1, 0.17, 0.2, 0.15, 1.2, 0.2);
  place(rockGeo(12, 3), -0.95, -2.0, 0.13, 0.16, 0.12, 0.3, 0.2);
  // companions for the photograph
  place(rockGeo(19, 3), -1.4, -5.6, 0.22, 0.14, 0.2, 2.0);
  place(rockGeo(23, 3), 1.6, -6.4, 0.16, 0.12, 0.18, 0.7);
  place(rockGeo(29, 3), 2.3, -3.6, 0.1, 0.09, 0.11, 1.1);
  place(rockGeo(31, 3), -0.6, -7.8, 0.3, 0.2, 0.26, 0.2);
  place(rockGeo(37, 3), 1.0, -9.5, 0.35, 0.22, 0.3, 1.7);
  place(rockGeo(43, 3), 2.0, 1.6, 0.16, 0.12, 0.14, 0.9);
  place(rockGeo(47, 3), -2.1, 1.2, 0.2, 0.15, 0.18, 2.4);
  place(rockGeo(53, 3), 1.9, -1.1, 0.11, 0.1, 0.12, 0.2);
  // field rocks (instanced) and pebbles
  const geos = [0, 1, 2, 3, 4, 5].map(i => rockGeo(100 + i, 2));
  const rr = mulberry(77);
  const ok = (x, z, s) => !(Math.hypot(x, z) < 2.6 + s || (Math.abs(x - 0.1) < 0.55 + s && z < -1.0 && z > -5.0) || (Math.abs(x) < 1.6 && z > 0.4 && z < 2.6));
  geos.forEach((g, gi) => {
    const N = gi < 3 ? 70 : 140; const im = new THREE.InstancedMesh(g, ROCK, N); im.castShadow = im.receiveShadow = true; scene.add(im);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let n = 0, guard = 0;
    while (n < N && guard++ < 5000) {
      const big = gi < 3; const a = rr() * Math.PI * 2, d = big ? 3 + Math.pow(rr(), 0.8) * 60 : 0.6 + Math.pow(rr(), 1.3) * 14;
      const x = Math.cos(a) * d, z = Math.sin(a) * d; const s = big ? 0.05 + Math.pow(rr(), 3.2) * 0.4 : 0.012 + Math.pow(rr(), 2.5) * 0.06;
      if (!ok(x, z, s)) continue;
      e.set(rr() * 0.4, rr() * 6.28, rr() * 0.4); q.setFromEuler(e); const sy = s * (0.6 + rr() * 0.5);
      m4.compose(V(x, hgt(x, z) + sy * 0.0, z), q, V(s * (0.8 + rr() * 0.5), sy, s * (0.8 + rr() * 0.5))); im.setMatrixAt(n++, m4);
    }
    im.count = n;
  });

  // ---------- Luna 9 automatic station ----------
  const lander = new THREE.Group(); scene.add(lander); lander.position.set(0, hgt(0, 0), 0);
  const SHELL = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.8, 0.8, 0.8), roughness: 0.45, metalness: 0.0 });
  const DARK = grey(0.18, { r: 0.6 });
  const RC = 0.29;
  { const s = add(lander, new THREE.SphereGeometry(RC, 48, 32), SHELL); s.position.y = 0.33; }
  // equator band and the camera turret on top
  { const b = add(lander, new THREE.TorusGeometry(RC + 0.005, 0.012, 8, 64).rotateX(Math.PI / 2), DARK); b.position.y = 0.33; }
  cyl(lander, 0.05, 0.05, 0.16, 0, 0.33 + RC + 0.05, 0, SHELL, 20);
  cyl(lander, 0.065, 0.05, 0.05, 0, 0.33 + RC + 0.15, 0, DARK, 20);
  { const m = add(lander, new THREE.SphereGeometry(0.045, 16, 10), SHELL); m.position.set(0, 0.33 + RC + 0.2, 0); }
  // four petals lying open on the ground: shallow cupped leaves hinged at the base, radiating out
  { const sh = new THREE.Shape(); sh.moveTo(0, -0.1); sh.bezierCurveTo(0.2, -0.12, 0.24, 0.3, 0.0, 0.5); sh.bezierCurveTo(-0.24, 0.3, -0.2, -0.12, 0, -0.1);
    const lg = new THREE.ShapeGeometry(sh, 24); const p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.09 * Math.pow(x / 0.2, 2) + 0.03 * y); }
    lg.computeVertexNormals();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4; const g = new THREE.Group(); lander.add(g);
      g.position.set(Math.cos(a) * 0.17, 0.05, Math.sin(a) * 0.17); g.rotation.y = -a + Math.PI / 2;
      const pm = add(g, lg, SHELL); pm.rotation.x = -Math.PI / 2 + 0.1;
      const rim = add(g, new THREE.TorusGeometry(0.2, 0.008, 6, 32, Math.PI).rotateX(Math.PI / 2), DARK); rim.scale.set(1, 1, 1.25); rim.position.set(0, 0.05, 0.22); rim.visible = false;
    } }
  // four whip antennas
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2; const b = V(Math.cos(a) * 0.2, 0.52, Math.sin(a) * 0.2);
    rod(lander, b, b.clone().add(V(Math.cos(a) * 0.36, 0.62, Math.sin(a) * 0.36)), 0.007, DARK, 6);
  }

  // ---------- sky: black, the sun low in the east ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uS: { value: SUN } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uS; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float a = acos(clamp(dot(d,uS),-1.,1.));
      float c = (a < 0.011 ? 6.0 : 0.0) + 1.6*exp(-a*45.0) + 0.3*exp(-a*13.0);
      gl_FragColor = vec4(vec3(c),1.); }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 64, 32), skyMat); sky.layers.set(L_FLAT); scene.add(sky);

  // ---------- light ----------
  const key = new THREE.DirectionalLight(0xffffff, 8);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
  key.target.position.set(-0.3, 0, -1.8); key.position.copy(key.target.position).addScaledVector(SUN, 100);
  Object.assign(key.shadow.camera, { left: -26, right: 26, top: 4.6, bottom: -4.2, near: 68, far: 132 });
  key.shadow.bias = -0.0012; key.shadow.normalBias = 0.035;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.0));

  // ---------- cameras ----------
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.015, 9000);
  const photo = { pos: V(0.0, 2.0 + lander.position.y, 1.6), pitch: -10 * Math.PI / 180, fov: 30, aspect: 4 / 3 };
  const photoCam = new THREE.PerspectiveCamera(photo.fov, photo.aspect, 0.05, 9000);
  const pdir = V(0, Math.sin(photo.pitch), -Math.cos(photo.pitch));
  photoCam.position.copy(photo.pos); photoCam.lookAt(photo.pos.clone().add(pdir)); photoCam.updateMatrixWorld(); photoCam.updateProjectionMatrix();
  // R's row in the photograph (0 = top)
  const rc = R.position.clone().add(V(0, 0.1, 0)).project(photoCam); const yR = (1 - rc.y) / 2;
  const band = { yc: clamp(yR, 0.1875, 0.8125) }; band.y0 = band.yc - 0.1875; band.y1 = band.yc + 0.1875;

  // ---------- camera move ----------
  // One continuous move, no stops: the glide eases out while the orbit eases in (they overlap 0.7 s, so the camera turns
  // the corner instead of halting); the orbit is a single Hermite curve that slows, but never stops, at the rim light;
  // it lands on the photo pose with zero velocity as the fax scan starts (F0 − 0.3), and holds while the print scans in.
  const Lc = V(0, lander.position.y + 0.33, 0);
  const tE = T.E0, tO0 = tE + 2.1, tO1 = tE + 4.9, tArr = T.F0 - 0.3;   // lands still; the fax scan runs F0−0.3 → F0
  const glide0 = monotone([[tE, -4.3], [tE + 0.6, -3.85], [tO0, -1.62]]);
  const gx0 = monotone([[tE, 0.18], [tE + 1.0, 0.05], [tO0, 0.0]]);
  // ease-out warp of the last 0.8 s of the glide: same path, velocity → 0 at tO0, no time shift before that
  const GA = 0.8, warpEnd = t => { const s = tO0 - t; if (s >= GA) return t; if (s <= 0) return tO0; return tO0 - (2 * s * s / GA - s * s * s / (GA * GA)); };
  const glide = t => glide0(warpEnd(t)), gx = t => gx0(warpEnd(t));
  const herm = keys => t => {   // keys: [t, value, slope]
    if (t <= keys[0][0]) return keys[0][1]; const L = keys[keys.length - 1]; if (t >= L[0]) return L[1];
    let i = 0; while (t > keys[i + 1][0]) i++;
    const [t0, y0, m0] = keys[i], [t1, y1, m1] = keys[i + 1], h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m1;
  };
  const tOs = tO0 - 0.7, tMid = RIM + 0.25;
  const az = herm([[tOs, -Math.PI / 2, 0], [tMid, SAZ - Math.PI / 2, 0.16], [tArr, Math.PI / 2, 0]]);
  const orbitR = herm([[tOs, 1.62, 0], [tMid, 1.5, 0], [tArr, 1.6, 0]]);
  const orbitY = herm([[tOs, 0.3, 0], [tO0 + 1.2, 0.27, -0.02], [tMid, 0.17, 0.02], [tArr, 2.0, 0]]);
  const look = (t, tg) => { const u = eio(seg(t, tMid - 0.2, tArr)); return tg.lerp(photo.pos.clone().add(pdir.clone().multiplyScalar(6)), u); };
  function glidePose(t) {
    const z = glide(t), x = gx(t); const p = V(x, hgt(x, z) + 0.3 + 0.04 * Math.sin((Math.min(t, tO0) - tE) * 2.2), z);
    const tg = p.clone().add(V(0.05, 0.12, 1.0)); tg.lerp(Lc, ss(seg(t, tO0 - 0.9, tO0)));
    return { p, tg };
  }
  function orbitPose(t) {
    const a = az(t), r = orbitR(t), y = orbitY(t);
    return { p: V(Math.cos(a) * r, lander.position.y + y, Math.sin(a) * r), tg: look(t, Lc.clone()) };
  }
  function pose(t) {
    t = Math.min(t, tArr);
    if (t >= tArr) return { p: photo.pos.clone(), tg: photo.pos.clone().add(pdir.clone().multiplyScalar(6)) };
    if (t <= tOs) return glidePose(t);
    const w = ss(seg(t, tOs, tO0 + 0.1));
    if (w >= 1) return orbitPose(t);
    const g = glidePose(t), o = orbitPose(t);
    return { p: g.p.lerp(o.p, w), tg: g.tg.lerp(o.tg, w) };
  }
  function update(t) {
    const { p, tg } = pose(t);
    camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); camera.updateMatrixWorld();
    // projection: normal 16:9, morphing into the photo's band (anamorphic: the band is drawn twice as tall)
    const n = camera.near, fv = 46 * Math.PI / 180;
    const top0 = n * Math.tan(fv / 2), right0 = top0 * 16 / 9;
    const tf = n * Math.tan(photo.fov * Math.PI / 360), rf = tf * photo.aspect;
    const pt = tf * (1 - 2 * band.y0), pb = tf * (1 - 2 * band.y1);
    const u = eio(seg(t, tArr - 1.1, tArr));
    camera.projectionMatrix.makePerspective(lerp(-right0, -rf, u), lerp(right0, rf, u), lerp(top0, pt, u), lerp(-top0, pb, u), n, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    // coarse → fine in whole octaves (32, 16, 8, 4, 2, 1): each step splits every cell into four, so the picture resolves
    // like a progressive scan instead of re-gridding (and jumping) every frame
    const cell = t < tE + 0.75 ? 2 ** Math.max(0, Math.min(5, Math.round(lerp(5.4, -0.4, seg(t, tE - 0.05, tE + 0.75))))) : 1;
    lander.visible = true;
    return { exp: 1.0, lo: 0.05, hi: 0.86, cell, farEdge: 3500, edgeK: 0.06, lineLum: 0.28 };
  }
  // the photograph: same world, seen from the photo camera, the station itself not in view
  function shootPhoto(pipe, out) { lander.visible = false; pipe.render(scene, photoCam, out, { exp: 1.0, lo: 0.05, hi: 0.86, edge: false }); lander.visible = true; }
  // R's bounding box in the photograph (normalised, 0 = top-left)
  function rBox() {
    photoCam.updateMatrixWorld(); R.updateMatrixWorld(true);
    const pos = R.geometry.attributes.position; let x0 = 1, x1 = 0, y0 = 1, y1 = 0; const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(R.matrixWorld); if (v.y < hgt(v.x, v.z) - 0.01) continue; v.project(photoCam); const x = (v.x + 1) / 2, y = (1 - v.y) / 2; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, y0, y1 };
  }
  return { scene, camera, update, shootPhoto, band, yR, R, lander, photoCam, rBox };
}
