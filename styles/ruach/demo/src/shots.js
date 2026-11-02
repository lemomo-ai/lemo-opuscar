// Shots: each is build(E) → { scene, cam, update(t), post(), grade() }. E = { w, h, ss }
import * as THREE from 'three';
import { plane, light, glow, rays, fitAt, toScreen, ppmAt, viewAt, range, ridge, cloud, tree, poly } from './ruach.js';
import { robed, walker } from './figure.js';
import { seg, ss, eio, lerp, mulberry } from './lib.js';

// Keys: blue/violet night (A) and gold/green presence (B), one ladder per depth
const NIGHT = {
  sky0: '#201f45', sky1: '#29284f', sky2: '#35315c', sky3: '#433b68',
  cS: '#2a2850', cU: '#37335e', cL: '#302d57',
  farL: '#4b4572', farS: '#3f3a64', midL: '#373256', midS: '#2c2848',
  hL: '#29253f', hL2: '#2e2a47', hS: '#201c34', cave: '#0e0b1a',
  nearL: '#19162a', nearS: '#120f21', fg: '#0b0916',
  robe: '#1b1830', robeS: '#131126', mantle: '#221e3b', mantleS: '#18152d', skin: '#1e1a33', skinS: '#151226', hair: '#100d20',
  trunk: '#130f24', leaf: '#1a1730', leafL: '#211d3a',
};
const GOLD = {
  sky0: '#7e8fbe', sky1: '#b9b3c4', sky2: '#e6c993', sky3: '#f5e2b4',
  cS: '#a996b4', cU: '#ffe0a0', cL: '#f1d7b1',
  farL: '#ecd09c', farS: '#b39fa6', midL: '#d6a777', midS: '#8a7189',
  hL: '#c08758', hL2: '#d49a63', hS: '#5d4565', cave: '#1c1222',
  nearL: '#7d5040', nearS: '#3a2838', fg: '#130c18',
  robe: '#c9b28c', robeS: '#7a6670', mantle: '#8a4c34', mantleS: '#4e2e30', skin: '#b07a52', skinS: '#6a4436', hair: '#2a1a1e',
  trunk: '#3a2a2c', leaf: '#4c6a4e', leafL: '#8fb070',
};

// Mount Horeb: a small figure at a cave mouth, the light breaking through a cloud bank (1 Kings 19)
export function horeb(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0a1a');
  const cam = new THREE.PerspectiveCamera(30, E.w / E.h, .1, 200);
  const vert = E.h > E.w;
  const camAt = t => vert ? [-2.2 + t * .04, 3.6, 30 - t * .12] : [0.6 + t * .05, 4.0, 16 - t * .14];
  const look = vert ? [-1.2, 8.4, -30] : [0.6, 4.6, -30];
  cam.position.set(...camAt(0)); cam.lookAt(...look); cam.updateMatrixWorld();
  const L = light({ col: '#FFE7A3', r: .38, soft: .07 }); L.uRes.value.set(E.w * E.ss, E.h * E.ss);
  const SRC = vert ? [3, 24, -55] : [15.5, 15.5, -55];
  const P = (z, k = 1) => ppmAt(cam, z, E.h, E.ss, k * (vert ? 1.8 : 1));
  const add = o => { const m = plane({ L, A: NIGHT, B: GOLD, ppm: P(o.z, o.k), ...o }); scene.add(m); return m; };

  // sky: stepped flat bands (the light is the only soft thing)
  const [sw, sh] = viewAt(cam, -60, 1.5);
  add({ z: -60, w: sw, h: sh, y: 4.6, k: .35, softK: 5, draw(x, C) {
    const bands = [[1, 'sky0'], [.62, 'sky1'], [.5, 'sky2'], [.43, 'sky3']];
    for (const [top, c] of bands) { x.fillStyle = C[c]; x.fillRect(-sw / 2, -sh / 2, sw, sh * top); }
  } });
  // the source: core and halo, then rays, behind the clouds
  const g = glow(L, { core: .018, spread: .1 }); fitAt(g, cam, -56); scene.add(g);
  const r = rays(L, { n: 11, len: 1.2, seed: 4 }); fitAt(r, cam, -52.5); scene.add(r);
  // cloud bank with a gap where the light breaks through
  add({ z: -50, w: sw * .9, h: 30, y: 16, k: .5, lag: -.05, glow: .22, draw(x, C) {
    cloud(x, { x0: -sw * .45, x1: SRC[0] - 8, y: 1, dy: 3, w: 5, h: 2.4, n: 10, shade: 'cS', under: 'cU', lit: 'cL', seed: 3 }, C);
    cloud(x, { x0: SRC[0] + 8, x1: sw * .45, y: 2, dy: 2, w: 5, h: 2.4, n: 5, shade: 'cS', under: 'cU', lit: 'cL', seed: 8 }, C);
    cloud(x, { x0: -sw * .4, x1: sw * .45, y: 9, dy: 2, w: 8, h: 3, n: 9, shade: 'cS', under: 'cU', lit: 'cL', seed: 11 }, C);
  } });
  // far range, hazed
  add({ z: -40, w: 120, h: 30, y: -10, k: .6, lag: .05, glow: .18, haze: .12, hazeCol: '#c9b8d8', draw(x, C) {
    const pk = ridge(-60, 60, { step: 6, lo: 9, hi: 16, vlo: 5, vhi: 8, seed: 21 });
    range(x, { x0: -60, x1: 60, base: -15, peaks: pk, dir: 1, lit: 'farL', shade: 'farS', seed: 2 }, C);
  } });
  // mid ridges
  add({ z: -24, w: 90, h: 24, y: -10, lag: .14, glow: .2, haze: .05, hazeCol: '#c9b8d8', draw(x, C) {
    const pk = ridge(-45, 45, { step: 5, lo: 7, hi: 11, vlo: 3.5, vhi: 6, seed: 5 });
    range(x, { x0: -45, x1: 45, base: -12, peaks: pk, dir: 1, lit: 'midL', shade: 'midS', seed: 6, facets: true }, C);
  } });
  // Horeb: one great faceted mountain on the left, the cave mouth on a ledge
  add({ z: -12, w: 44, h: 26, x: -8, y: 0, lag: .28, glow: .12, draw(x, C) {
    x.save(); x.translate(8, 0);
    range(x, { x0: -30, x1: 10, base: -13, peaks: [[-24, 1], [-19, 4], [-16.5, 3.2], [-12.2, 8.4], [-10.6, 7.3], [-8.8, 9.8], [-6.0, 6.0], [-3.8, 3.6], [-1.4, 2.4], [2, -.6], [6, -2.6], [10, -3.4]], dir: 1, lit: 'hL', lit2: 'hL2', shade: 'hS', seed: 9, facets: true }, C);
    poly(x, [[-6.9, .75], [-6.6, 1.95], [-6.0, 2.35], [-5.4, 1.9], [-5.2, .75]], C.cave);   // the cave mouth
    poly(x, [[-7.8, .78], [-2.6, .78], [-2.1, .45], [-8.1, .35]], C.hL2);                 // the ledge
    x.restore();
  } });
  // Elijah at the cave mouth, turned toward the light
  const fig = add({ z: -11.6, w: .7, h: 1.2, x: -4.2, y: .76, ax: 0, ay: -.55, lag: .3, k: 1.4, draw(x, C) { x.translate(0, -.55); robed(x, C, { dir: 1 }); } });
  // near ground: rock shelves and one broom tree
  add({ z: -4, w: 44, h: 14, y: -2.4, lag: .42, draw(x, C) {
    range(x, { x0: -22, x1: 22, base: -7, peaks: [[-20, 4.9], [-17, 3.6], [-12.5, 4.4], [-9, 3.0], [-5.5, 3.5], [-1.5, 2.2], [2.5, 3.1], [5, 2.5], [8.5, 3.6], [12, 2.6], [16, 4.0], [21, 3]], dir: 1, lit: 'nearL', shade: 'nearS', seed: 13 }, C);
    tree(x, { cx: 6.6, by: 2.8, h: 3.2, lit: 'leafL', shade: 'leaf', trunk: 'trunk', seed: 3 }, C);
  } });
  // foreground frame: dark rocks that never take the light
  add({ z: 6, w: 30, h: 12, y: -2, fix: 0, draw(x, C) {
    poly(x, [[-5.5, -6], [-5.5, 4.6], [-4.4, 4.9], [-3.3, 4.1], [-2.6, 3.3], [-2.1, -6]], C.fg);
    poly(x, [[6.5, -6], [6.5, 3.6], [5.4, 4.0], [4.5, 3.2], [4.0, -6]], C.fg);
  } });

  const planes = []; scene.traverse(o => o.userData.U && planes.push(o));
  return {
    scene, cam,
    update(t) {
      const p = camAt(t); cam.position.set(...p); cam.lookAt(...look); cam.updateMatrixWorld();
      const s = toScreen(cam, SRC); L.uO.value.set(s[0], s[1]);
      L.uLk.value = ss(seg(t, .4, 1.4));
      L.uR.value = lerp(0, 2.2, eio(seg(t, 1.0, 5.0)));
      r.material.uniforms.uK.value = .8 * ss(seg(t, .9, 2.2)) * (1 - .25 * ss(seg(t, 4, 6)));
      r.material.uniforms.uSweep.value = .25 - t * .03;
      g.material.uniforms.uK.value = .62 * ss(seg(t, .3, 1.3));
      fig.rotation.z = Math.sin(t * .6) * .004;
    },
    post: () => ({ focus: cam.position.z + 11.6, aper: new URLSearchParams(location.search).has('nodof') ? 0 : .9, maxCoc: 10, bloom: { strength: .45, radius: .7, threshold: .95 } }),
    grade: () => ({ vig: .3, contrast: .08, lift: [.0, .004, .016], gain: [1.02, 1, .96] }),
  };
}

// —— After the Fire (the demo film): one hillside in three keys ——
const RED = {
  burnt: true, ember: '#ff5a32',
  sky0: '#140406', sky1: '#1f0609', sky2: '#2e090d', sky3: '#4a1012',
  cS: '#1c0508', cU: '#3a0c10', cL: '#25070a',
  farL: '#3c0f13', farS: '#2c0a0e', midL: '#240709', midS: '#190506',
  nearL: '#140405', nearS: '#0e0304', fg: '#070102',
  trunk: '#0a0203', trunkL: '#1a0507', leaf: '#000', leafL: '#000',
  robe: '#000', robeS: '#000', mantle: '#000', mantleS: '#000', skin: '#000', hair: '#000',
};
const ASH = {
  ...NIGHT, burnt: true, ember: null,
  farL: '#4b4572', farS: '#3f3a64', midL: '#353052', midS: '#2a2645', nearL: '#211d36', nearS: '#18152a',
  trunk: '#1a1730', trunkL: '#26223f', leaf: '#2c3a3a', leafL: '#3a4a44',
  robe: '#1d1a33', robeS: '#141228', mantle: '#2a2546', mantleS: '#1d1a33', skin: '#221e38', hair: '#120f24',
};
const GREEN = {
  ...GOLD, burnt: false,
  farL: '#e9cf9c', farS: '#b6a2a8', midL: '#a9bf7c', midS: '#5f7d5c', nearL: '#7f9c56', nearS: '#3f5944', fg: '#130c18',
  trunk: '#4a3226', trunkL: '#6e4a32', leaf: '#4f8158', leafL: '#a8c97c',
  robe: '#3c4a5c', robeS: '#28323f', mantle: '#c4643c', mantleS: '#7c3a2a', skin: '#a86e48', hair: '#2a1a1e',
};

// trees: charred spikes with ember tips in a burnt key, angular canopies otherwise
function grove(x, C, list) {
  for (const [cx, by, h, seed] of list) {
    if (C.burnt) {
      const R = mulberry(seed);
      poly(x, [[cx - h * .03, by], [cx + h * .03, by], [cx + h * .012, by + h * .92], [cx - h * .004, by + h]], C.trunk);
      poly(x, [[cx + h * .005, by], [cx + h * .03, by], [cx + h * .012, by + h * .9]], C.trunkL);
      for (let i = 0; i < 3; i++) {   // broken branches
        const y = by + h * (.35 + i * .18 + R() * .06), d = R() < .5 ? -1 : 1, l = h * (.12 + R() * .1);
        poly(x, [[cx, y], [cx + d * l, y + l * .7], [cx + d * l * .95, y + l * .78], [cx, y + h * .03]], C.trunk);
      }
      if (C.ember) for (let i = 0; i < 4; i++) { const ey = by + h * R() * .7; x.fillStyle = C.ember; x.fillRect(cx - h * .015, ey, h * .03, h * .012); }
    } else tree(x, { cx, by, h, lit: 'leafL', shade: 'leaf', trunk: 'trunk', seed, wr: .42, lobes: 6 }, C);
  }
}
const GROVE_MID = [], GROVE_NEAR = [];
{ const R = mulberry(77); for (let i = 0; i < 34; i++) if (Math.abs(-36 + i * 2.15 - 9.5) > 3.6) GROVE_MID.push([-36 + i * 2.15 + R() * 1.2, 0, 3.4 + R() * 2.2, 100 + i]);
  for (const [cx, h] of [[-12.5, 7.4], [-10.2, 5.6], [10.6, 6.2], [13.2, 7.6]]) GROVE_NEAR.push([cx, 0, h, 200 + cx * 10 | 0]); }

export function forest(E, mode) {
  const crest = wx => { for (let i = 0; i < NEAR_PK.length - 1; i++) { const [a, ya] = NEAR_PK[i], [b, yb] = NEAR_PK[i + 1]; if (wx <= b) return -5 + lerp(ya, yb, (wx - a) / (b - a)); } return 0; };   // feet on the near crest (plane y −5)
  const NEAR_PK = [[-22, 8.4], [-15, 7.6], [-9, 7.4], [-3, 6.4], [2, 5.9], [7, 5.0], [13, 4.6], [22, 4.1]];
  const ember = mode === 'ember';
  const scene = new THREE.Scene(); scene.background = new THREE.Color(ember ? '#070102' : '#0b0a1a');
  const cam = new THREE.PerspectiveCamera(30, E.w / E.h, .1, 200);
  const vert = E.h > E.w;
  const camAt = ember ? t => [-3 + t * .32, 3.2, 18] : t => vert ? [1.5, 3.4, 30 + .25 * Math.min(t, 6) - .45 * Math.max(0, t - 7)] : [0, 3.2, 18 + .18 * Math.min(t, 6) - .3 * Math.max(0, t - 7)];
  const look = t => ember ? [-3 + t * .32, 4.2, -30] : vert ? [1.5, 5.0, -30] : [0, 2.6, -30];
  cam.position.set(...camAt(0)); cam.lookAt(...look(0)); cam.updateMatrixWorld();
  const L = light({ col: ember ? '#FF3B2E' : '#FFE7A3', r: ember ? .16 : .36, soft: .16 }); L.uRes.value.set(E.w * E.ss, E.h * E.ss);
  const SRC = t => ember ? [-8, -1.5, -45] : vert ? [6, 2.5 + .25 * Math.max(0, t - 7), -55] : [13, 2.5 + .25 * Math.max(0, t - 7), -55];
  const A = ember ? RED : ASH, B = ember ? RED : GREEN;
  const P = (z, k = 1) => ppmAt(cam, z, E.h, E.ss, k * (vert ? 1.8 : 1));
  const add = o => { const m = plane({ L, A, B, ppm: P(o.z, o.k), fix: ember ? 0 : undefined, ...o }); scene.add(m); return m; };

  const [sw, sh] = viewAt(cam, -60, 1.6);
  add({ z: -60, w: sw, h: sh, y: 4, k: .35, softK: 5, draw(x, C) {
    for (const [top, c] of [[1, 'sky0'], [.64, 'sky1'], [.53, 'sky2'], [.47, 'sky3']]) { x.fillStyle = C[c]; x.fillRect(-sw / 2, -sh / 2, sw, sh * top); }
  } });
  const g = glow(L, { core: ember ? .004 : .022, spread: ember ? .09 : .11 }); fitAt(g, cam, -56); scene.add(g);
  const r = rays(L, { n: 12, len: 1.3, seed: 6 }); fitAt(r, cam, -52.5); scene.add(r);
  add({ z: -50, w: sw * .9, h: 30, y: 17, k: .5, lag: -.05, glow: .2, draw(x, C) {
    cloud(x, { x0: -sw * .42, x1: sw * .42, y: 2, dy: 3, w: 6, h: 2, n: 11, shade: 'cS', under: 'cU', lit: 'cL', seed: 31 }, C);
  } });
  add({ z: -40, w: 130, h: 30, y: -9, k: .6, lag: .04, glow: .18, haze: ember ? 0 : .1, hazeCol: '#c9b8d8', draw(x, C) {
    range(x, { x0: -65, x1: 65, base: -15, peaks: ridge(-65, 65, { step: 7, lo: 12, hi: 16, vlo: 9.5, vhi: 11.5, seed: 41 }), dir: -1, lit: 'farL', shade: 'farS', seed: 4 }, C);
  } });
  add({ z: -22, w: 90, h: 36, y: -6.4, lag: .16, glow: .1, draw(x, C) {
    const pk = [[-45, 7.5], [-30, 8.6], [-18, 8.0], [-6, 9.4], [6, 8.2], [18, 8.9], [30, 7.8], [45, 8.4]];
    range(x, { x0: -45, x1: 45, base: -11, peaks: pk, dir: -1, lit: 'midL', shade: 'midS', seed: 8 }, C);
    x.save(); x.translate(0, 0); grove(x, C, GROVE_MID.map(([cx, , h, s]) => [cx, 8.2 + .5 * Math.sin(cx * .4) - .3, h, s])); x.restore();
  } });
  add({ z: -8, w: 44, h: 32, y: -5, lag: .32, draw(x, C) {
    range(x, { x0: -22, x1: 22, base: -8, peaks: NEAR_PK, dir: -1, lit: 'nearL', shade: 'nearS', seed: 12 }, C);
    grove(x, C, GROVE_NEAR.map(([cx, , h, s]) => [cx, crest(cx) + 5 - .3, h, s]));
  } });
  // the walker: three pose sheets, one visible at a time
  const fig = {};
  for (const pose of ['walkA', 'walkB', 'kneel']) { fig[pose] = ember ? null : add({ z: -7.9, w: .7, h: 1.2, x: 0, y: -.2, ax: 0, ay: -.5, lag: .34, k: 2.6, draw(x, C) { x.translate(0, -.5); walker(x, C, pose); } }); fig[pose]?.scale.setScalar(1.7); }
  add({ z: 7, w: 24, h: 10, y: -1.5, fix: 0, draw(x, C) {
    poly(x, [[-8, -5], [-8, 1.6], [-6.4, 1.9], [-5.2, 1.3], [-4.4, .6], [-3.6, -5]], C.fg);
    poly(x, [[8, -5], [8, .9], [6.6, 1.3], [5.4, .5], [4.8, -5]], C.fg);
    poly(x, [[-3.6, -.2], [1.2, .25], [1.4, .05], [-3.5, -.55]], C.fg);   // a fallen trunk
    for (const [gx, gh] of [[-4.6, .9], [-4.2, .6], [4.6, .7], [5.1, 1.0], [2.0, .4]]) poly(x, [[gx - .05, -.4], [gx, -.4 + gh], [gx + .05, -.4]], C.fg);
  } });

  const KNEEL_X = 1.4;
  return {
    scene, cam,
    update(t) {
      cam.position.set(...camAt(t)); cam.lookAt(...look(t)); cam.updateMatrixWorld();
      const s = toScreen(cam, SRC(t)); L.uO.value.set(s[0], s[1]);
      if (ember) {
        L.uLk.value = 1; g.material.uniforms.uK.value = .55 + .08 * Math.sin(t * 3.1) * Math.sin(t * 1.7); r.material.uniforms.uK.value = 0; L.uR.value = 0;
      } else {
        g.material.uniforms.uK.value = .6 * ss(seg(t, 7.2, 8.4));
        L.uLk.value = ss(seg(t, 7.4, 8.6));
        r.material.uniforms.uK.value = .75 * ss(seg(t, 7.8, 9.4)); r.material.uniforms.uSweep.value = .3 - t * .025;
        L.uR.value = lerp(0, 2.4, eio(seg(t, 7.8, 13.2)));
        // walk in from the left, stop, kneel
        const wx = lerp(-4.2, KNEEL_X, ss(seg(t, 0, 6.6))), step = Math.floor(t * 4) % 2, kneel = t > 9.6;
        for (const k in fig) { fig[k].visible = kneel ? k === 'kneel' : (t < 6.6 ? k === (step ? 'walkB' : 'walkA') : k === 'walkA'); fig[k].position.set(wx, crest(wx) + (t < 6.6 && step ? .02 : 0), -7.9); }
      }
    },
    post: () => ({ focus: cam.position.z + 8, aper: .7, maxCoc: 9, bloom: { strength: ember ? .6 : .45, radius: .7, threshold: ember ? .5 : .95 } }),
    grade: () => ember ? { vig: .45, contrast: .12, lift: [.01, 0, 0], gain: [1.05, .98, .95] } : { vig: .3, contrast: .08, lift: [0, .004, .016], gain: [1.02, 1, .96] },
  };
}
