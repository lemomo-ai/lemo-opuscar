// Shot 8, the morning after: a bundle of newspapers tied with twine on the frosted steps of a news kiosk; one take
// from the halftone dots of the front-page picture up over the roofs, to the telescope on the horizon and the full
// Moon setting in the west.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat, halftoneMat, paperCanvas, screenBox, font } from './kit.js';
import { L_FLAT } from './pipe.js';
import { GLSL_NOISE } from './noise.js';
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry } from '/core/lib.js';
import { T } from './timeline.js';
import { HEAD, NEWS_BODY, NEWS_SIDE } from './texts.js';

export const WEST_MOON = V(-1, 0.075, 0.2).normalize();
export function buildTown(ctx) {
  const { prints } = ctx;
  const scene = new THREE.Scene();
  const texts = [];
  // ---------- sky: dawn behind the camera, the west still dusky, the full Moon low over the horizon ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { uM: { value: WEST_MOON } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: GLSL_NOISE + `uniform vec3 uM; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float el = max(d.y, 0.0);
      float east = smoothstep(-0.2, 1.0, d.x);
      float g = 0.07 + 0.34*exp(-el/0.13) + 0.25*east*exp(-el/0.3);
      float a = acos(clamp(dot(d,uM),-1.,1.));
      vec3 x = normalize(cross(uM, vec3(0,1,0))), y = cross(x, uM); vec2 p = vec2(dot(d,x), dot(d,y))/0.04;
      float mare = smoothstep(0.45, 0.62, fbm(p*2.2+3.0))*0.5;
      g += a < 0.04 ? 1.9*(1.0-mare) : 0.0;
      g += 0.12*exp(-a*25.0);
      gl_FragColor = vec4(vec3(g),1.); }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), skyMat); sky.layers.set(L_FLAT); scene.add(sky);
  // ---------- ground, street, pavements ----------
  add(scene, new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), grey(0.2), { cast: false, screen: true }).position.y = -0.02;
  add(scene, new THREE.PlaneGeometry(260, 8).rotateX(-Math.PI / 2), grey(0.28), { cast: false, screen: true }).position.set(-80, 0, 0);
  [-1, 1].forEach(s => { add(scene, new THREE.PlaneGeometry(260, 2.2).rotateX(-Math.PI / 2), grey(0.45), { cast: false, screen: true }).position.set(-80, 0.12, s * 5.1); box(scene, 260, 0.13, 0.15, -80, 0.065, s * 4.0, grey(0.6)); });
  // terraced houses on both sides
  const BRICK = grey(0.36, { r: 0.85 }), SLATE = grey(0.22, { r: 0.6 }), WIN = grey(0.05, { r: 0.2 }), FRAME = grey(0.75);
  const r = mulberry(31);
  for (const s of [-1, 1]) for (let i = 0; i < 26; i++) {
    const x = 10 - i * 5.2 - (s > 0 ? 3.5 : 0), z = s * 10.5, h = 6.2 + (r() < 0.2 ? 1 : 0);
    if (s > 0 && x > -1 && x < 6) continue;          // the corner where the kiosk stands
    const hs = new THREE.Group(); hs.position.set(x, 0, z); scene.add(hs);
    box(hs, 5.1, h, 8, 0, h / 2, 0, BRICK);
    const roof = add(hs, new THREE.CylinderGeometry(0.01, 4.5, 3.0, 4, 1).rotateY(Math.PI / 4), SLATE, { screen: true }); roof.scale.set(0.82, 1, 1.26); roof.position.y = h + 1.5;
    const ch = box(hs, 0.9, 1.8, 1.2, 2.5, h + 2.4, 0, BRICK); [-0.2, 0.2].forEach(dz => cyl(hs, 0.13, 0.11, 0.45, 2.5, h + 3.5, dz, grey(0.5), 10));
    const fz = -s * 4.02;
    [[-1.3, 1.6], [1.2, 1.6], [-1.3, 4.6], [1.2, 4.6]].forEach(([wx, wy], k) => { const lit = (i * 7 + k * 3 + (s > 0 ? 1 : 0)) % 17 === 0; box(hs, 1.1, 1.4, 0.06, wx, wy, fz, lit ? glow(1.3) : WIN); box(hs, 1.25, 0.08, 0.12, wx, wy - 0.74, fz, FRAME); });
    box(hs, 0.95, 2.0, 0.08, 0.1 - 1.9 * 0, 1.0, fz, grey(0.12)); box(hs, 0.95, 2.0, 0.08, 0.1, 1.0, fz, grey(0.12));
  }
  // lamp posts along the street, still lit at dawn
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const x = 6 - i * 16 - (s > 0 ? 8 : 0), z = s * 4.4; rod(scene, V(x, 0, z), V(x, 4.2, z), 0.07, grey(0.12)); rod(scene, V(x, 4.2, z), V(x, 4.3, z - s * 0.6), 0.04, grey(0.12));
    add(scene, new THREE.SphereGeometry(0.16, 10, 8), glow(2.2), { cast: false, flat: true }).position.set(x, 4.15, z - s * 0.62);
  }
  // fields beyond the town and the telescope on the horizon
  { const SIL = glow(0.0);
    const tel = new THREE.Group(); tel.position.set(-1500, 0, 160); tel.scale.setScalar(1.0); scene.add(tel);
    const bg = new THREE.Group(); bg.position.y = 52; bg.rotation.set(0.62, 0, 0); tel.add(bg);
    { const pts = []; for (let i = 0; i <= 16; i++) { const r = 40 * i / 16; pts.push(new THREE.Vector2(r, r * r / 92)); } add(bg, new THREE.LatheGeometry(pts, 40), new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide }), { cast: false, recv: false }); rod(bg, V(0, 0, 0), V(0, 24, 0), 1.3, SIL, 6, { cast: false }); }
    [-1, 1].forEach(s => { rod(tel, V(0, 0, s * 46 - 14), V(0, 52, s * 44), 2.4, SIL, 6, { cast: false }); rod(tel, V(0, 0, s * 46 + 14), V(0, 52, s * 44), 2.4, SIL, 6, { cast: false }); });
    const N = 200, pos = [], idx = []; const rr = mulberry(9);
    for (let i = 0; i <= N; i++) { const z = -2000 + 4000 * i / N; const h = 8 + 6 * rr() + 5 * Math.sin(i * 0.3); pos.push(-1200, -1, z, -1200, h, z); if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); add(scene, g, SIL, { cast: false, recv: false }); }
  // the paper van, leaving down the street (tail lights)
  const van = new THREE.Group(); scene.add(van);
  { box(van, 4.2, 2.0, 1.9, 0, 1.25, 0, grey(0.14)); box(van, 1.2, 1.2, 1.9, -2.6, 0.95, 0, grey(0.14)); [-1.4, 1.4].forEach(x => [-0.85, 0.85].forEach(z => cyl(van, 0.36, 0.36, 0.25, x, 0.36, z, grey(0.04), 14).rotation.x = Math.PI / 2));
    [-0.7, 0.7].forEach(z => add(van, new THREE.BoxGeometry(0.06, 0.18, 0.22), glow(3), { cast: false, flat: true }).position.set(2.12, 0.9, z)); }

  // ---------- the kiosk, its steps, the frost ----------
  const K = new THREE.Group(); K.position.set(2.0, 0.12, 6.2); scene.add(K);
  const WOODK = grey(0.4, { r: 0.8 }), STONE = grey(0.55, { r: 0.9 });
  box(K, 2.6, 0.18, 1.5, 0, 0.09, -1.3, STONE); box(K, 2.6, 0.18, 1.15, 0, 0.27, -1.1, STONE);
  box(K, 2.62, 0.17, 0.02, 0, 0.09, -2.06, grey(0.2)); box(K, 2.62, 0.17, 0.02, 0, 0.27, -1.68, grey(0.2));
  box(K, 2.0, 0.5, 0.05, 0, 3.25, -0.6, grey(0.15)); box(K, 1.8, 0.36, 0.06, 0, 3.25, -0.62, grey(0.85));
  box(K, 2.4, 2.3, 1.7, 0, 0.36 + 1.15, 0.2, WOODK);
  for (let i = 0; i < 12; i++) box(K, 1.9, 0.11, 0.04, 0, 0.75 + i * 0.13, -0.67, grey(0.55));
  const aw = add(K, new THREE.BoxGeometry(2.9, 0.08, 1.2), grey(0.3)); aw.position.set(0, 2.75, -0.75); aw.rotation.x = -0.25;
  box(K, 2.6, 0.45, 0.06, 0, 2.95, -0.62, grey(0.82));
  { const fr = mulberry(41); const N = 1600; const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), glow(2.4), N); im.layers.set(L_FLAT); const m4 = new THREE.Matrix4();
    for (let i = 0; i < N; i++) { const s = 0.003 + fr() * 0.004; const st = fr(); let x = (fr() - 0.5) * 2.5, y, z; if (st < 0.35) { y = 0.181; z = -2.05 + fr() * 0.5; } else if (st < 0.65) { y = 0.361; z = -1.65 + fr() * 1.05; } else { y = 0.001 - 0.12; z = -2.05 - fr() * 2.4; x *= 1.8; } m4.makeScale(s, s * 0.5, s); m4.setPosition(x, y, z); im.setMatrixAt(i, m4); }
    K.add(im); }
  // ---------- the bundle on the top step ----------
  const BUN = new THREE.Group(); BUN.position.set(-0.3, 0.36, -1.25); BUN.rotation.y = Math.PI - 0.1; K.add(BUN);   // page top points at the kiosk
  const PGW = 0.4, PGH = 0.6, BT = 0.13;
  const edgeC = document.createElement('canvas'); edgeC.width = 64; edgeC.height = 256; { const g = edgeC.getContext('2d'); g.fillStyle = '#ddd'; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 4) { g.fillStyle = y % 8 ? '#999' : '#bbb'; g.fillRect(0, y, 64, 2); } }
  const edgeMat = new THREE.MeshLambertMaterial({ map: canvasTex(edgeC) });
  box(BUN, PGW, BT, PGH, 0, BT / 2, 0, edgeMat);
  const PCW = 1600, PCH = 2400, PX = PCW / PGW;                // canvas px per metre = 4000
  const photo = { x0: 80, y0: 470, w: 960, h: 1440 };
  const page = paperCanvas(PCW, PCH, (g, put) => {
    // body copy is drawn as a typeset texture (one bar per word, from the real sentences): at this scale it reads as grey columns, never as half-legible words
    const greek = (line, x, y, size, maxW) => { font(g, 'news', size, 500); let cx = x; for (const w of line.split(' ')) { const ww = g.measureText(w).width; if (cx + ww > x + maxW) break; g.fillRect(cx, y - size * 0.5, ww, size * 0.42); cx += ww + size * 0.32; } };
    put('hcn', HEAD.cn, PCW / 2, 205, 'serif', 132, { weight: 900, align: 'center' });
    put('hen', HEAD.en, PCW / 2, 335, 'anton', 92, { align: 'center' });
    g.fillRect(70, 380, PCW - 140, 8); g.fillRect(70, 396, PCW - 140, 3);
    greek('The first picture as it came off the receiver. Its proportions are a guess.', 80, photo.y0 + photo.h + 56, 30, 960);
    let y = 530; NEWS_SIDE.forEach(l => { if (!l) { y += 34; return; } const head = l === l.toUpperCase(); if (head) { put(null, l, 1090, y, 'news', 46, { weight: 700, fit: 420 }); y += 66; } else { greek(l, 1090, y, 32, 420); y += 44; } });
    g.fillRect(1065, 470, 3, 1440);
    for (let k = 0; k < 9; k++) { g.fillStyle = '#000'; for (let j = 0; j < 3; j++) g.fillRect(1090, 1200 + k * 72 + j * 20, 380 - (j === 2 ? 120 : 0), 8); }
    g.fillRect(70, 2010, PCW - 140, 3);
    NEWS_BODY.forEach((l, i) => greek(l, 80, 2062 + i * 36, 30, PCW - 160));
  });
  const pageMesh = add(BUN, new THREE.PlaneGeometry(PGW, PGH, 8, 8), printMat(canvasTex(page.canvas), { bias: 0.68, text: true })); pageMesh.rotation.x = -Math.PI / 2; pageMesh.position.y = BT + 0.0006;
  page.lines.forEach(l => texts.push({ id: l.id, text: l.text, mesh: pageMesh, corners: [[l.x0, l.y0], [l.x1, l.y0], [l.x1, l.y1], [l.x0, l.y1]].map(([x, y]) => V((x / PCW - 0.5) * PGW, (0.5 - y / PCH) * PGH, 0.001)) }));
  const phW = photo.w / PX, phH = photo.h / PX, phX = (photo.x0 + photo.w / 2) / PX - PGW / 2, phZ = (photo.y0 + photo.h / 2) / PX - PGH / 2;
  const ph = add(BUN, new THREE.PlaneGeometry(phW, phH), halftoneMat(prints.jGrayTex, 560, { e: 0.02 }), { cast: false }); ph.rotation.x = -Math.PI / 2; ph.position.set(phX, BT + 0.0012, phZ);
  // twine: one turn across between headline and picture, one along the right column, a knot
  const TW = grey(0.62, { r: 0.9 });
  const tz = -PGH / 2 + 435 / PX, tx = -PGW / 2 + 1562 / PX;
  rod(BUN, V(-PGW / 2 - 0.003, BT + 0.003, tz), V(PGW / 2 + 0.003, BT + 0.003, tz), 0.0032, TW, 6); [-1, 1].forEach(sd => rod(BUN, V(sd * (PGW / 2 + 0.003), BT + 0.003, tz), V(sd * (PGW / 2 + 0.003), 0, tz), 0.0032, TW, 6));
  rod(BUN, V(tx, BT + 0.004, -PGH / 2 - 0.003), V(tx, BT + 0.004, PGH / 2 + 0.003), 0.0032, TW, 6); [-1, 1].forEach(sd => rod(BUN, V(tx, BT + 0.004, sd * (PGH / 2 + 0.003)), V(tx, 0, sd * (PGH / 2 + 0.003)), 0.0032, TW, 6));
  add(BUN, new THREE.SphereGeometry(0.008, 10, 8), TW).position.set(tx, BT + 0.007, tz);
  rod(BUN, V(tx, BT + 0.007, tz), V(tx + 0.03, BT + 0.004, tz + 0.04), 0.0025, TW, 5); rod(BUN, V(tx, BT + 0.007, tz), V(tx + 0.045, BT + 0.004, tz - 0.01), 0.0025, TW, 5);

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 0.9));
  const dawn = new THREE.DirectionalLight(0xffffff, 1.6); dawn.position.set(60, 25, 25); dawn.target.position.set(0, 0, 4); dawn.castShadow = true; dawn.shadow.mapSize.set(4096, 4096);
  Object.assign(dawn.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); dawn.shadow.bias = -0.0006; dawn.shadow.normalBias = 0.02; scene.add(dawn, dawn.target);

  // ---------- camera: dots → page → bundle → steps → street → over the roofs, looking west ----------
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.002, 8000);
  scene.updateMatrixWorld(true);
  const pageAt = (u, v) => pageMesh.localToWorld(V((u - 0.5) * PGW, (0.5 - v) * PGH, 0));   // u,v in page (0..1 from top-left)
  const rockV = (photo.y0 + (prints.band.yc) * photo.h) / PCH, rockU = (photo.x0 + 0.48 * photo.w) / PCW;
  const westUp = V(-1, 0, 0).applyAxisAngle(V(0, 1, 0), 0).normalize();
  const pageUp = pageAt(0.5, 0).sub(pageAt(0.5, 1)).normalize();
  const t0 = T.H0, tR = t0 + 0.9, tA = t0 + 4.9, tB = t0 + 6.0;
  const FIN = { p: V(12, 15, 1.2), tg: V(-300, 9, -18) };
  const B0 = pageAt(0.5, 0.5);
  function update(t) {
    const vt = t - t0; van.position.set(-6 - 7.5 * vt - 0.6 * vt * vt, 0, -1.9);
    let p, tg, up, fov = 45;
    // distance from the page: exponential pull, slow while the headline is readable; tilting from overhead to 40°
    let d;
    // in log distance: starts from rest on the dots (C1 Hermite), reaches the steady pull rate at tR and keeps it past tA
    // (the rise over the roofs blends in from there), so the zoom never jumps or stalls
    const L0 = Math.log(0.018), L1 = Math.log(0.27), rate = (Math.log(1.45) - L1) / (tA - tR);
    if (t < tR) { const h = tR - t0, u = seg(t, t0, tR), u2 = u * u, u3 = u2 * u; d = Math.exp((2 * u3 - 3 * u2 + 1) * L0 + (-2 * u3 + 3 * u2) * L1 + (u3 - u2) * h * rate); }
    else d = Math.exp(L1 + rate * (t - tR));
    const phi = lerp(Math.PI / 2, 0.75, ss(seg(t, tR + 0.6, tA)));
    const k = ss(seg(t, t0 + 0.05, tR + 0.25));
    const u = lerp(rockU, 0.5, k), v = lerp(rockV, lerp(0.15, 0.32, ss(seg(t, tR, tA))), k);
    const c = pageAt(u, v).add(V(0, 0.35 * ss(seg(t, tR + 1.5, tA)), 0));
    const dir = V(0, Math.sin(phi), -Math.cos(phi));
    p = c.clone().addScaledVector(dir, d); tg = c.clone();
    up = phi > 1.5 ? V(0, 0, 1) : V(0, 1, 0).lerp(V(0, 0, 1), Math.max(0, (phi - 0.75) / (Math.PI / 2 - 0.75)) * 0.0).normalize();
    if (phi > 1.5) up = V(0, 0, 1); else up = V(0, 0, 1).lerp(V(0, 1, 0), clamp((1.5 - phi) / 0.3)).normalize();
    if (t > tA) {
      const w = eio(seg(t, tA, tB));
      const pp = V(lerp(p.x, FIN.p.x, w), lerp(p.y, FIN.p.y, Math.pow(w, 1.25)), lerp(p.z, FIN.p.z, 1 - Math.pow(1 - w, 2.2)));
      const look = tg.clone().sub(p).normalize().lerp(FIN.tg.clone().sub(FIN.p).normalize(), w).normalize();
      p = pp; tg = p.clone().add(look); up = V(0, 1, 0);
      fov = lerp(45, 30, w);
    }
    camera.position.copy(p); camera.up.copy(up); camera.lookAt(tg); camera.fov = fov;
    camera.near = t > tA ? lerp(0.05, 0.5, seg(t, tA, tB)) : Math.max(0.001, d * 0.1); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return { exp: 1.0, lo: 0.07, hi: 0.82, edgeK: 0.05, farEdge: 800 };
  }
  function textsAt(t, W, H) {
    const out = [];
    for (const x of texts) {
      const b = screenBox(x.mesh, x.corners, camera, W, H); if (!b) continue;
      if (b.y1 - b.y0 < 20 * H / 1080) continue;
      out.push({ id: x.id, text: x.text, ...b });
    }
    return out;
  }
  return { scene, camera, update, texts: textsAt };
}
