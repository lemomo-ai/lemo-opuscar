// The Last Night Train — shots 2–6. Each build(E) → { S, update(t), post(), grade() }, t = film seconds.
// Every shot has its own colour ladder, its own camera move; the train is the same paper train in all of them.
import * as THREE from 'three';
import { sheet, skyPanel, moon, setMoon, text } from './paper.js';
import { stage, aim } from './stage.js';
import { mulberry, lerp, clamp, TAU, ss, seg, eio, eo, ei, back } from './lib.js';
import { PAPER, BASE, tint, cut, peaks, firs, car } from './world.js';

const L = .043, HC = .015, NCAR = 8;
const SERIF = '"Cormorant"';

export function glowDisc(r, col = '#ffd590') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.ShaderMaterial({ uniforms: { col: { value: new THREE.Color(col) }, k: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 col; uniform float k; void main(){ float r = length(vUv - .5) * 2.; gl_FragColor = vec4(col * k * (pow(max(0., 1. - r), 3.) * .9 + pow(max(0., 1. - r * 4.), 2.) * .8), 1.); }' }));
  m.renderOrder = 12; m.userData.set = k => { m.material.uniforms.k.value = k; }; return m;
}
// the paper train: engine + 7 carriages; set(xHead, yOf, lit[i] 0..1)
export function train(S, U, z, scale = 1, col = '#151d3c') {
  const Ls = L * scale, Hs = HC * scale, cars = [];
  for (let i = 0; i < NCAR; i++) {
    const loco = i === 0;
    const m = S.add(sheet({ U, w: Ls * 1.5, h: Hs * 1.4, ay: -Hs * .5, z, trans: .12, glow: 2.6, glowCol: '#ffc46a', ppm: 9000 / scale * 1.2, glowRes: 1,
      draw: x => { x.fillStyle = PAPER; x.translate(0, -Hs * .5); car(x, null, Ls, Hs, loco); }, glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-1, -1, 2, 2); g.translate(0, -Hs * .5); car(null, g, Ls, Hs, loco); } }));
    tint(m, col); cars.push(m);
  }
  const head = S.add(glowDisc(.025 * scale));
  return {
    cars, head, L: Ls,
    set(xh, yOf, lit, headK = 1, bob = 0) {
      for (let i = 0; i < NCAR; i++) {
        const xi = xh - i * (Ls + .0025 * scale) - (i ? Ls * .12 : 0), a = Math.atan2(yOf(xi + .001) - yOf(xi - .001), .002);
        cars[i].position.set(xi, yOf(xi) - .0022 * scale + bob * Math.abs(Math.sin(xi * 900)), z); cars[i].rotation.z = a;
        cars[i].material.userData.u.uGlowLit.value = typeof lit === 'function' ? lit(i) : lit;
      }
      const a = Math.atan2(yOf(xh + .001) - yOf(xh - .001), .002);
      head.position.set(xh + Math.cos(a) * Ls * .68, yOf(xh) + .0055 * scale, z + .001); head.userData.set(headK);
      U.uBeamO.value.set(xh + Math.cos(a) * Ls * .7, yOf(xh) + .006 * scale, 1.3 * headK); U.uBeamD.value.set(a - .05, .1, .09 * scale);
    },
  };
}
export function fir(x, u, base, h) { const w = h * .32; x.beginPath(); x.moveTo(u, base + h);
  for (let k = 0; k < 4; k++) { const t1 = (k + 1) / 4; x.lineTo(u + w * (.35 + .65 * t1), base + h * (1 - t1)); x.lineTo(u + w * .3 * (1 - t1) + w * .12, base + h * (1 - t1) + h * .04); }
  x.lineTo(u + h * .025, base - .01); x.lineTo(u - h * .025, base - .01);
  for (let k = 3; k >= 0; k--) { const t1 = (k + 1) / 4; x.lineTo(u - w * .3 * (1 - t1) - w * .12, base + h * (1 - t1) + h * .04); x.lineTo(u - w * (.35 + .65 * t1), base + h * (1 - t1)); }
  x.closePath(); x.fill(); }
const sky = (S, z, stops, stars = 260) => S.add(skyPanel({ w: 1.0, h: .5, z, stops, stars, starMinY: -.02 }));
export function band(x, x0, x1, f, bottom = -.3) { x.beginPath(); x.moveTo(x0, bottom); for (let u = x0; u <= x1 + .001; u += .002) x.lineTo(u, f(u)); x.lineTo(x1, bottom); x.closePath(); x.fill(); }
export function haltSign(U, name, x, y, z) {   // a small name board on two posts, cream paper with dark letters
  return sheet({ U, w: .034, h: .02, x, y, z, trans: .3, shadow: false, ppm: 16000, finish: { rim: 0, under: 0 }, draw: c => {
    c.fillStyle = '#0e1532'; c.fillRect(-.012, -.01, .0012, .012); c.fillRect(.0108, -.01, .0012, .012);
    c.fillStyle = '#d8c8a0'; c.fillRect(-.015, .0, .03, .0075); text(c, name, 0, .0037, .0042, SERIF, { fill: '#1a1a2a', weight: 700 }); } });
}
export function lampPost(U, x, y, z, h = .036) {   // a lamp post; its lantern glows
  return sheet({ U, w: .02, h: h + .01, x, y: y + h / 2, z, trans: .06, glow: 2.4, glowCol: '#ffc070', ppm: 12000, draw: c => { c.fillStyle = PAPER; c.translate(0, -h / 2);
      c.fillRect(-.0009, 0, .0018, h); c.fillRect(-.004, h - .001, .008, .0016); c.beginPath(); c.moveTo(-.0028, h - .0015); c.lineTo(.0028, h - .0015); c.lineTo(.0022, h - .0075); c.lineTo(-.0022, h - .0075); c.closePath(); c.fill();
      c.save(); c.fillStyle = '#c8a070'; c.fillRect(-.0016, h - .0072, .0032, .0046); c.restore(); },
    glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-.01, -.5, .02, 1); g.translate(0, -h / 2); g.fillStyle = '#fff'; g.fillRect(-.0016, h - .0072, .0032, .0046); } });
}

// ——————————————— S2 · alongside the train through the snowy forest: pines rush past in front, halts with lit houses on the slope ———————————————
const S2Y = x => -.006 + .012 * Math.sin(x * 2.6 - .4);   // the line rises and falls gently through the forest
export function s2(E) {
  const H = E.H;
  const S = stage({ light: [0, .03, -.1], lightR: .12, lightCol: '#b8c8f0', key: 1.0, keyCol: '#c8d4ff', amb: .2, ambCol: '#5a6ca8', floor: .32, keyPos: [-.05, .3, .3], keyTarget: [0, -.03, -.09], keyAngle: 1.0 });
  const { U } = S;
  const skyM = sky(S, -.142, [[0, '#060b22'], [.45, '#0c1838'], [.8, '#192a54'], [1, '#283a6a']]);
  const W = 3.2, CX = W / 2 - .4;
  const far = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.128, trans: .85, ppm: 1800, draw: x => { x.fillStyle = PAPER; const R = mulberry(3), list = []; for (let u = -1.6; u < 1.6; u += .07 + R() * .05) list.push([u, .06 + R() * .07, .05 + R() * .03]); peaks(x, { x0: -1.6, x1: 1.6, base: .01, seed: 7, list }); } }));
  const ridge = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.112, trans: .5, ppm: 2400, draw: x => { x.fillStyle = PAPER; firs(x, { x0: -1.6, x1: 1.6, base: .0, h: .026, gap: .007, seed: 4, roll: .012 }); } }));
  // the snow slope behind the line, with a small lit house at every halt
  const HALTS = [[.42, 'ELM HALT'], [.8, 'STONE HALT'], [1.18, 'MILL HALT']];
  const slope = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.095, trans: .55, glow: 2.4, glowCol: '#ffbe68', ppm: 2600, glowRes: 1,
    draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.4, 2.8, u => S2Y(u) + .02 + .008 * Math.sin(u * 11));
      for (const [hx] of HALTS) { const by = S2Y(hx + .03) + .016; x.fillRect(hx + .01, by, .036, .02); x.beginPath(); x.moveTo(hx + .006, by + .02); x.lineTo(hx + .028, by + .033); x.lineTo(hx + .05, by + .02); x.closePath(); x.fill(); x.fillRect(hx + .036, by + .024, .004, .01);
        x.save(); x.fillStyle = '#c8a070'; x.fillRect(hx + .016, by + .005, .007, .008); x.fillRect(hx + .031, by + .005, .007, .008); x.restore(); } },
    glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-1.6, -.2, 3.2, .4); g.translate(-CX, 0); g.fillStyle = '#fff'; for (const [hx] of HALTS) { const by = S2Y(hx + .03) + .016; g.fillRect(hx + .016, by + .005, .007, .008); g.fillRect(hx + .031, by + .005, .007, .008); } } }));
  const embank = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.08, trans: .12, ppm: 2400, draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.4, 2.8, u => S2Y(u) - .004);
    cut(x, () => { x.lineWidth = .0006; for (let i = 0; i < 400; i++) { const u = -.4 + i * .008; x.beginPath(); x.moveTo(u, S2Y(u) - .0085); x.lineTo(u + .004, S2Y(u + .004) - .0085); x.stroke(); } }); } }));
  const halts = HALTS.map(([hx, name]) => { const lp = S.add(lampPost(U, hx, S2Y(hx) - .006, -.0772, .045)); const sg = S.add(haltSign(U, name, hx - .062, S2Y(hx - .062) - .028, -.0771)); const ln = S.add(glowDisc(.012, '#ffc878')); return { lp, sg, ln, hx }; });
  const near = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.06, trans: .45, ppm: 2400, draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.4, 2.8, u => -.06 + .01 * Math.sin(u * 7)); firs(x, { x0: -.4, x1: 2.8, base: -.06, h: .045, gap: .04, seed: 9, roll: .01 }); } }));
  // the foreground pines: tall, close to the lens, they sweep across the frame and sell the speed
  const fg = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.028, trans: .04, ppm: 2400, shadow: false, draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.4, 2.8, u => -.105 + .01 * Math.sin(u * 5));
    const R = mulberry(41); for (let u = -.3; u < 2.8; u += .07 + R() * .1) fir(x, u, -.1, .1 + R() * .07); } }));
  const snow = S.add(sheet({ U, w: .6, h: .36, z: -.015, trans: .3, shadow: false, recv: false, ppm: 3000, finish: { grain: false, rim: 0, under: 0 }, draw: x => { x.fillStyle = PAPER; const R = mulberry(19); for (let i = 0; i < 180; i++) { x.beginPath(); x.arc((R() - .5) * .6, (R() - .5) * .36, .0005 + R() * .0009, 0, TAU); x.fill(); } } }));
  const tr = train(S, U, -.0785);
  tint(far, '#62769f'); tint(ridge, '#2c4070'); tint(slope, '#44588e'); tint(embank, '#23315c'); tint(near, '#34467c'); tint(fg, '#050a1e'); tint(snow, '#c8d4ee', .9);
  halts.forEach(h => tint(h.lp, '#0c1330'));
  return {
    S,
    update(t) {
      const k = t - E.T0, v = .135;
      const xh = .12 + v * k;
      tr.set(xh, S2Y, 1, 1, .0003);
      for (const h of halts) { h.ln.position.set(h.hx, S2Y(h.hx) - .006 + .045 - .0048, -.0768); h.ln.userData.set(.45); }
      const cx = xh - .13, up = eio(seg(k, 0, 8.2)), cz = lerp(.3, .26, up);
      snow.position.set(cx + .04 + .02 * Math.sin(t), .18 - ((t * .014) % .36), -.015); skyM.position.x = cx;
      aim(S.cam, [cx, lerp(-.03, .05, up), cz, cx + .012, lerp(-.012, .004, up), -.08], t, { hand: .0007 });
      this._f = cz + .079;
    },
    post() { return { focus: this._f, aper: 14, maxCoc: 14, bloom: { strength: .3, radius: .5, threshold: 1.15 } }; },
    grade() { return { expo: 1.0, vig: .45, sat: 1.04, contrast: .12, lift: [0, .004, .02], gain: [1, 1, 1] }; },
  };
}

// ——————————————— S3 · the tunnel: the train is swallowed, light by light; then true dark ———————————————
export function s3(E) {
  const H = E.H;
  const S = stage({ light: [.1, .02, -.1], lightR: .12, lightCol: '#a8b8e8', key: .9, keyCol: '#c0ccf8', amb: .18, ambCol: '#4a5a98', floor: .28, keyPos: [-.05, .3, .3], keyTarget: [0, -.03, -.09], keyAngle: 1.0 });
  const { U } = S;
  sky(S, -.142, [[0, '#050a1e'], [.5, '#0b1636'], [1, '#1a2a56']], 200);
  const far = S.add(sheet({ U, w: .9, h: .36, z: -.126, trans: .8, ppm: 3000, draw: x => { x.fillStyle = PAPER; peaks(x, { x0: -.45, x1: .45, base: .0, seed: 11, list: [[-.3, .08, .07], [-.15, .11, .08], [.0, .07, .06], [.18, .1, .08], [.34, .07, .06]] }); } }));
  // the cliff face with the portal: a stone arch; inside is black paper (the dark of the tunnel)
  const PX = .13, PW = .05, PH = .045;
  const inside = S.add(sheet({ U, w: .12, h: .1, x: PX, y: .0, z: -.0805, trans: 0, draw: x => { x.fillStyle = '#020308'; x.fillRect(-.06, -.05, .12, .1); } }));
  const cliff = S.add(sheet({ U, w: .9, h: .36, z: -.077, trans: .25, ppm: 5000, draw: x => { x.fillStyle = PAPER;
    band(x, PX - .06, .45, u => .16 - .02 * Math.sin(u * 20), -.3); band(x, -.45, .45, () => -.009);
    cut(x, () => { x.beginPath(); x.moveTo(PX - PW / 2, -.006); x.lineTo(PX - PW / 2, PH - PW / 2 - .006); x.arc(PX, PH - PW / 2 - .006, PW / 2, Math.PI, 0, true); x.lineTo(PX + PW / 2, -.006); x.closePath(); x.fill();
      x.lineWidth = .0008; for (let i = 0; i < 9; i++) { const a = Math.PI * (i + .5) / 9; x.beginPath(); x.moveTo(PX + Math.cos(a) * (PW / 2 + .002), PH - PW / 2 - .006 + Math.sin(a) * (PW / 2 + .002)); x.lineTo(PX + Math.cos(a) * (PW / 2 + .009), PH - PW / 2 - .006 + Math.sin(a) * (PW / 2 + .009)); x.stroke(); }
      for (let r = 0; r < 14; r++) for (let c = 0; c < 6; c++) { const yy = .06 + r * .008, xx = PX - .05 + c * .022 + (r % 2) * .011; if (yy < .15) { x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + .015, yy); x.stroke(); } } }); } }));
  const tr = train(S, U, -.0785);
  const snowBank = S.add(sheet({ U, w: .9, h: .36, z: -.05, trans: .1, ppm: 3000, draw: x => { x.fillStyle = PAPER; firs(x, { x0: -.45, x1: PX - .07, base: -.07, h: .06, gap: .028, seed: 21, roll: .012 }); band(x, -.45, .45, u => -.06 + .006 * Math.sin(u * 12)); } }));
  tint(far, '#6a7cae'); tint(cliff, '#26335f'); tint(snowBank, '#0b1230');
  return {
    S,
    update(t) {
      // the train comes in from the left and runs into the portal; the cliff (in front) hides every carriage that has gone in
      const xh = lerp(-.12, .46, (t - E.T0) / (H.portal + .9 - E.T0));
      tr.set(xh, () => -.006, 1, 1, .0003);
      tr.cars.forEach(m => { m.visible = m.position.x < PX - .004; });
      if (xh > PX - .01) { tr.head.userData.set(0); U.uBeamO.value.z = 0; }
      // camera: a slow push toward the portal, the last light goes in, then the frame goes to black
      const k = eio(seg(t, E.T0, H.dark[0]));
      aim(S.cam, [lerp(.0, .1, k), lerp(.02, .01, k), lerp(.38, .24, k), lerp(.02, .12, k), lerp(.01, .012, k), -.08], t, { hand: .0006 });
      this._t = t;
    },
    post() { return { focus: S.cam.position.z + .079, aper: 12, maxCoc: 12, bloom: { strength: .3, radius: .5, threshold: 1.15 } }; },
    grade() { const t = this._t; return { expo: 1.0, vig: .5, sat: 1.04, contrast: .12, lift: [0, .004, .02], gain: [1, 1, 1], fade: 1 - ss(seg(t, H.portal, H.dark[0])) }; },
  };
}

// ——————————————— S4 · out of the tunnel: the river valley; the town on the hill behind the bridge lights its windows as the train passes ———————————————
export function s4(E) {
  const H = E.H;
  const S = stage({ light: [0, .03, -.1], lightR: .12, lightCol: '#a8d0d8', key: 1.0, keyCol: '#c8e4ee', amb: .22, ambCol: '#4a7a88', floor: .3, keyPos: [-.05, .3, .3], keyTarget: [0, -.03, -.09], keyAngle: 1.0 });
  const { U } = S;
  const skyM = sky(S, -.142, [[0, '#04131c'], [.45, '#0a2330'], [.8, '#163a48'], [1, '#235060']], 240);
  const mn = S.add(moon({ x: .0, y: .078, z: -.138, r: .009, gain: 1.4, halo: 5, haloGain: .15 })); setMoon(mn, 1);
  const W = 1.8, CX = .35;
  const hills = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.128, trans: .85, ppm: 2400, draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.6, 1.3, u => .05 + .02 * Math.sin(u * 7 + 1) + .012 * Math.sin(u * 19)); } }));
  // the town on its hill: houses climb the slope above the bridge, each with one or two windows
  const HILL = u => .012 + .022 * Math.sin(u * 4.1 + .6) + .01 * Math.sin(u * 9);
  const WINS = [];
  { const R = mulberry(31); for (let hx = -.5; hx < 1.2; hx += .026 + R() * .022) { const w = .016 + R() * .008, h = .012 + R() * .01, by = HILL(hx) - .004 + (R() - .5) * .006; WINS.push({ hx, w, h, by, wins: [[hx - w * .2, by + h * .4], ...(R() < .5 ? [[hx + w * .22, by + h * .4]] : [])] }); } }
  const town = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.11, trans: .35, glow: 2.4, glowCol: '#ffbe68', ppm: 3200, glowRes: 1,
    draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.6, 1.3, u => HILL(u) - .002);
      for (const hh of WINS) { x.fillRect(hh.hx - hh.w / 2, hh.by, hh.w, hh.h); x.beginPath(); x.moveTo(hh.hx - hh.w * .62, hh.by + hh.h); x.lineTo(hh.hx, hh.by + hh.h + hh.w * .5); x.lineTo(hh.hx + hh.w * .62, hh.by + hh.h); x.closePath(); x.fill();
        x.save(); x.fillStyle = '#c8a070'; for (const [wx, wy] of hh.wins) x.fillRect(wx - .0018, wy, .0036, .0042); x.restore(); } },
    glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-.9, -.2, 1.8, .4); g.translate(-CX, 0); g.fillStyle = '#fff'; for (const hh of WINS) for (const [wx, wy] of hh.wins) g.fillRect(wx - .0018, wy, .0036, .0042); } }));
  // the river: flat water with small cut ripples, and warm paper flakes for the reflections (they appear under each lit window)
  const river = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.098, trans: .35, ppm: 3000, draw: x => { x.fillStyle = PAPER; x.translate(-CX, 0); band(x, -.6, 1.3, () => -.012);
      cut(x, () => { x.lineWidth = .0005; const R = mulberry(5); for (let i = 0; i < 300; i++) { const u = -.6 + R() * 1.9, y = -.016 - R() * .07; x.beginPath(); x.arc(u, y, .008, Math.PI * 1.2, Math.PI * 1.8); x.stroke(); } }); } }));
  const flakes = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.0965, trans: .3, glow: 2.0, glowCol: '#ffc878', ppm: 3000, shadow: false, recv: false, glowRes: 1,
    draw: x => { x.fillStyle = '#c8a070'; x.translate(-CX, 0); const R = mulberry(8); for (const hh of WINS) for (const [wx] of hh.wins) for (let k = 0; k < 3; k++) { const fx = wx + (R() - .5) * .004, fy = -.03 - k * .012 - R() * .006, w = .003 + R() * .003; x.beginPath(); x.moveTo(fx - w, fy); x.lineTo(fx - w * .3, fy + .0012); x.lineTo(fx + w, fy + .0004); x.lineTo(fx + w * .4, fy - .001); x.closePath(); x.fill(); } },
    glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-.9, -.2, 1.8, .4); g.fillStyle = '#fff'; g.translate(-CX, 0); const R = mulberry(8); for (const hh of WINS) for (const [wx] of hh.wins) for (let k = 0; k < 3; k++) { const fx = wx + (R() - .5) * .004, fy = -.03 - k * .012 - R() * .006, w = .003 + R() * .003; g.beginPath(); g.moveTo(fx - w, fy); g.lineTo(fx - w * .3, fy + .0012); g.lineTo(fx + w, fy + .0004); g.lineTo(fx + w * .4, fy - .001); g.closePath(); g.fill(); } } }));
  // a low bridge: deck and piers only (no truss in front of the town), the train above the water
  const BY = -.008;
  const bridge = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.08, trans: .1, ppm: 5000, draw: x => { x.fillStyle = PAPER; x.strokeStyle = PAPER; x.translate(-CX, 0);
    x.fillRect(-.6, BY - .007, 1.9, .005); x.lineWidth = .0007; x.beginPath(); for (let u = -.6; u < 1.3; u += .012) { x.moveTo(u, BY - .002); x.lineTo(u, BY - .007); } x.stroke();
    for (let u = -.55; u < 1.3; u += .16) { x.fillRect(u - .005, -.2, .01, .2 + BY - .007); x.beginPath(); x.ellipse(u + .08, BY - .02, .07, .012, 0, Math.PI, 0, true); x.lineTo(u + .15, BY - .007); x.lineTo(u + .01, BY - .007); x.closePath(); x.fill(); } } }));
  const tr = train(S, U, -.0785);
  const reeds = S.add(sheet({ U, w: W, h: .4, x: CX, z: -.04, trans: .06, ppm: 2400, draw: x => { x.fillStyle = PAPER; x.strokeStyle = PAPER; x.translate(-CX, 0); band(x, -.6, 1.3, u => -.1 + .006 * Math.sin(u * 9));
    x.lineCap = 'round'; const R = mulberry(4); for (let i = 0; i < 300; i++) { const u = -.6 + R() * 1.9, h = .015 + R() * .035; x.lineWidth = .0012; x.beginPath(); x.moveTo(u, -.1); x.quadraticCurveTo(u + .004, -.1 + h * .6, u + .008 * (R() - .3), -.1 + h); x.stroke(); } } }));
  tint(hills, '#5f8c94'); tint(town, '#2c5260'); tint(river, '#163440'); tint(bridge, '#0e2028'); tint(reeds, '#06141a'); tr.cars.forEach(m => tint(m, '#0f1d26'));
  const flash = S.add(glowDisc(.035, '#ffe6b0'));
  return {
    S,
    update(t) {
      const k = t - E.T0, xh = -.15 + .12 * k;
      tr.set(xh, () => BY, 1, 1, .0003);
      // the town's windows come on behind the train: lit where x < (train tail + a little), dark ahead
      const front = xh - .14;
      town.material.userData.u.uGR.value.set(front - 2, .0, 2, 1);
      flakes.material.userData.u.uGR.value.set(front - 2, -.05, 2, 1);
      flakes.position.x = CX + .0015 * Math.sin(t * 1.3); flakes.position.y = .0006 * Math.sin(t * 2.1);
      flash.position.set(-.15, .0, -.079); flash.userData.set(.6 * Math.exp(-k * 4));
      const cx = xh - .07, cz = lerp(.37, .33, eio(seg(k, 0, 8.5))), cy = lerp(.0, .016, eio(seg(k, 0, 8.5)));
      skyM.position.x = cx; mn.position.set(cx + .06, cy + .072, -.138);
      aim(S.cam, [cx, cy, cz, cx + .03, cy - .006, -.09], t, { hand: .0006 });
      this._f = cz + .079; this._k = k;
    },
    post() { return { focus: this._f, aper: 12, maxCoc: 12, bloom: { strength: .32, radius: .5, threshold: 1.1 } }; },
    grade() { return { expo: 1.0 + .2 * Math.exp(-this._k * 4), vig: .45, sat: 1.04, contrast: .12, lift: [0, .008, .014], gain: [1, 1, 1] }; },
  };
}

// ——————————————— S5 · the sea cliffs: crane down past thin clouds to the train on the curve of the cliff edge ———————————————
export function s5(E) {
  const H = E.H;
  const S = stage({ light: [.0, .02, -.1], lightR: .15, lightCol: '#b0b0e8', key: 1.0, keyCol: '#d0d0ff', amb: .2, ambCol: '#5a5aa0', floor: .3, keyPos: [-.05, .3, .3], keyTarget: [0, -.03, -.09], keyAngle: 1.0 });
  const { U } = S;
  sky(S, -.142, [[0, '#070a26'], [.5, '#151a48'], [.8, '#2c2c66'], [.92, '#5a4a7a'], [1, '#7a6488']], 300);
  const clouds = S.add(sheet({ U, w: .9, h: .36, z: -.136, trans: .9, ppm: 2400, shadow: false, draw: x => { x.fillStyle = PAPER; const R = mulberry(12);
    for (let i = 0; i < 6; i++) { const cx = -.4 + i * .16 + R() * .05, cy = .05 + R() * .08, w = .08 + R() * .07; x.beginPath(); x.ellipse(cx, cy, w, .004 + R() * .003, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(cx + w * .3, cy + .003, w * .5, .003, 0, 0, TAU); x.fill(); } } }));
  const HZ = .035;
  // a far headland with one small light, then three seas: far waves small, near waves big
  const head = S.add(sheet({ U, w: .9, h: .36, z: -.125, trans: .6, glow: 2.2, glowCol: '#ffc878', ppm: 3000, draw: x => { x.fillStyle = PAPER; band(x, .12, .45, u => HZ + .018 * Math.min(1, (u - .12) / .08) + .004 * Math.sin(u * 40)); x.save(); x.fillStyle = '#c8a070'; x.fillRect(.25, HZ + .019, .0025, .0025); x.restore(); },
    glowDraw: g => { g.fillStyle = '#000'; g.fillRect(-.45, -.18, .9, .36); g.fillStyle = '#fff'; g.fillRect(.25, HZ + .019, .0025, .0025); } }));
  const sea = [0, 1, 2].map(i => S.add(sheet({ U, w: .9, h: .36, z: -.12 + i * .012, trans: .7 - i * .2, ppm: 3000, draw: x => { x.fillStyle = PAPER; const A = [.0015, .003, .006][i], F = [70, 40, 22][i], Y = HZ - [0, .016, .036][i];
    band(x, -.45, .45, u => Y + A * Math.sin(u * F + i * 2) + A * .5 * Math.sin(u * F * 2.3 + i));
    cut(x, () => { x.lineWidth = [.0005, .0008, .0012][i]; const R = mulberry(i + 3), r = [.004, .008, .014][i]; for (let k = 0; k < [160, 90, 50][i]; k++) { const u = -.45 + R() * .9, y = Y - .004 - R() * .02 * (i + 1); x.beginPath(); x.arc(u, y, r, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } }); } })));
  const YC = u => -.02 + .03 * Math.cos((u - .02) * 3.2);   // the cliff edge: the line arcs over a headland
  const cliff = S.add(sheet({ U, w: .9, h: .36, z: -.077, trans: .2, ppm: 4000, draw: x => { x.fillStyle = PAPER; band(x, -.45, .45, u => YC(u) - .004);
    cut(x, () => { x.lineWidth = .0006; for (let i = 0; i < 6; i++) { x.beginPath(); for (let u = -.45; u <= .45; u += .01) { const y = YC(u) - .02 - i * .015 - .004 * Math.sin(u * 30 + i); u > -.45 ? x.lineTo(u, y) : x.moveTo(u, y); } x.stroke(); } }); } }));
  const tr = train(S, U, -.0785);
  // the foreground: a dark rock headland on the left and grass on the cliff top, close to the lens
  const rocks = S.add(sheet({ U, w: .9, h: .36, z: -.035, trans: .04, ppm: 3000, shadow: false, draw: x => { x.fillStyle = PAPER;
    x.beginPath(); x.moveTo(-.45, -.18); x.lineTo(-.45, .02); x.lineTo(-.38, .028); x.lineTo(-.31, .01); x.lineTo(-.27, -.02); x.lineTo(-.22, -.06); x.lineTo(-.17, -.09); x.lineTo(-.1, -.11); x.lineTo(.45, -.115); x.lineTo(.45, -.18); x.closePath(); x.fill();
    x.lineCap = 'round'; x.strokeStyle = PAPER; const R = mulberry(6); for (let i = 0; i < 120; i++) { const u = -.1 + R() * .55, h = .006 + R() * .014; x.lineWidth = .0012; x.beginPath(); x.moveTo(u, -.113); x.lineTo(u + .004 * (R() - .5), -.113 + h); x.stroke(); } } }));
  tint(clouds, '#6a5c8e', .8); tint(head, '#3a3a76'); sea.forEach((m, i) => tint(m, ['#7272b0', '#4c4c8e', '#2e2e68'][i])); tint(cliff, '#262a58'); tint(rocks, '#04061a'); tr.cars.forEach(m => tint(m, '#11142e'));
  return {
    S,
    update(t) {
      const k = t - E.T0, xh = -.2 + .085 * k - .004 * k * k;   // slowing down
      tr.set(xh, YC, 1, 1, .0003);
      sea.forEach((m, i) => { m.position.x = .004 * Math.sin(t * (.6 + i * .2) + i) * (i + 1); });
      clouds.position.x = .002 * k;
      head.material.userData.u.uGlowLit.value = .6 + .4 * (Math.sin(t * 2.2) > .7 ? 1 : 0);
      const c = eio(seg(k, 0, 4.4));
      aim(S.cam, [lerp(-.03, .0, c), lerp(.06, .002, c), lerp(.38, .32, c), lerp(-.03, .01, c), lerp(.07, -.004, c), -.09], t, { hand: .0006 });
      this._f = S.cam.position.z + .079;
    },
    post() { return { focus: this._f, aper: 12, maxCoc: 12, bloom: { strength: .3, radius: .5, threshold: 1.15 } }; },
    grade() { return { expo: 1.0, vig: .45, sat: 1.04, contrast: .12, lift: [.006, .002, .02], gain: [1, 1, 1] }; },
  };
}

// ——————————————— S6 · the terminus by the sea: close along the carriages as the windows go out, the last one holds a beat; then only the station light ———————————————
export function s6(E) {
  const H = E.H;
  const LX = .235, LY = -.012;   // the station lamp on the platform, right of the engine
  const S = stage({ light: [LX, LY + .05, -.076], lightR: .07, lightCol: '#ffbe70', key: .9, keyCol: '#c8c8ff', amb: .22, ambCol: '#5a5aa0', floor: .1, keyPos: [-.08, .3, .3], keyTarget: [0, -.03, -.09], keyAngle: 1.0 });
  const { U } = S;
  sky(S, -.142, [[0, '#080b2a'], [.5, '#181e52'], [.78, '#33336e'], [.9, '#6a5684'], [1, '#9a7890']], 260);
  const hills = S.add(sheet({ U, w: .9, h: .36, z: -.13, trans: .7, ppm: 2400, draw: x => { x.fillStyle = PAPER; band(x, -.45, .45, u => .028 + .012 * Math.sin(u * 6 + 1) + .006 * Math.sin(u * 17)); } }));
  const sea = S.add(sheet({ U, w: .9, h: .36, z: -.12, trans: .7, ppm: 3000, draw: x => { x.fillStyle = PAPER; band(x, -.45, .45, u => .022 + .0012 * Math.sin(u * 70)); cut(x, () => { x.lineWidth = .0006; const R = mulberry(9); for (let k = 0; k < 160; k++) { const u = -.45 + R() * .9, y = .016 - R() * .05; x.beginPath(); x.arc(u, y, .006, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } }); } }));
  // a low sea wall behind the track: it takes the train's shadow
  const BY = -.008, STOP = .15;
  const wall = S.add(sheet({ U, w: .9, h: .36, z: -.0835, trans: .2, ppm: 4000, draw: x => { x.fillStyle = PAPER; x.fillRect(-.45, -.2, .9, .2 + BY + .006); cut(x, () => { x.lineWidth = .0006; for (let r = 0; r < 8; r++) for (let c = 0; c < 40; c++) { const yy = BY - .003 - r * .007, xx = -.45 + c * .024 + (r % 2) * .012; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + .02, yy); x.stroke(); } }); } }));
  const tr = train(S, U, -.0785);
  // the platform in front, the canopy over it (scalloped valance, posts), a railing, the name board under the canopy on the left
  const plat = S.add(sheet({ U, w: .9, h: .36, z: -.0735, trans: .12, ppm: 4500, draw: x => { x.fillStyle = PAPER; x.fillRect(-.45, -.2, .9, .2 + LY);
    cut(x, () => { x.fillRect(-.45, LY - .005, .9, .0012); x.lineWidth = .0005; for (let c = 0; c < 60; c++) { const xx = -.45 + c * .016; x.beginPath(); x.moveTo(xx, LY - .009); x.lineTo(xx, LY - .03); x.stroke(); } });
    for (let u = -.3; u <= .2; u += .1) x.fillRect(u - .0013, LY, .0026, .052);                          // canopy posts
    x.fillRect(-.33, LY + .052, .56, .006);                                                               // canopy beam
    x.beginPath(); x.moveTo(-.34, LY + .058); x.lineTo(-.02, LY + .074); x.lineTo(.24, LY + .058); x.closePath(); x.fill();   // roof
    for (let u = -.33; u < .23; u += .012) { x.beginPath(); x.arc(u + .006, LY + .052, .006, Math.PI, 0, true); x.fill(); }   // scalloped valance
    x.fillRect(-.45, LY + .012, .9, .0012); for (let u = -.45; u < .45; u += .008) x.fillRect(u, LY, .0008, .012);   // railing
  } }));
  const board = S.add(sheet({ U, w: .05, h: .03, x: -.2, y: LY + .036, z: -.0732, trans: .3, shadow: false, ppm: 14000, finish: { rim: 0, under: 0 }, draw: c => {
    c.fillStyle = '#0e1532'; c.fillRect(-.012, .006, .0008, .01); c.fillRect(.0112, .006, .0008, .01);
    c.fillStyle = '#d8c8a0'; c.fillRect(-.018, -.006, .036, .012); text(c, 'SEA END', 0, .0, .0062, SERIF, { fill: '#1a1a2a', weight: 700 }); } }));
  const lamp = S.add(lampPost(U, LX, LY, -.073, .05));
  const lampGlow = S.add(glowDisc(.02, '#ffc878'));
  const pool = S.add(glowDisc(.07, '#ffb860')); pool.scale.set(1, .22, 1);
  const front = S.add(sheet({ U, w: .9, h: .36, z: -.045, trans: .04, ppm: 3000, shadow: false, draw: x => { x.fillStyle = PAPER; band(x, -.45, .45, u => -.1 + .004 * Math.sin(u * 20)); x.fillRect(.3, -.2, .006, .17); x.fillRect(-.36, -.2, .006, .15); } }));
  // the end card: a paper ticket that drops from above on a thread. Main panel (left of the perforation): a small route line,
  // the title in English then Chinese, a rule, the style name, the credit; the stub carries only the red stamp.
  const TW = .15, TH = .066, PERF = TW / 2 - .034, MX = (-TW / 2 + PERF) / 2;
  const ticket = S.add(sheet({ U, w: TW, h: TH + .2, ax: 0, ay: .1 + TH / 2, z: -.0715, trans: .45, shadow: false, recv: false, ppm: 14000, finish: { rim: .4, under: .15 }, draw: c => {
    c.save(); c.translate(0, -.1);
    c.fillStyle = '#5a4a3a'; c.fillRect(-.0004, TH / 2, .0008, .2);
    c.fillStyle = '#f2e0b6'; c.fillRect(-TW / 2, -TH / 2, TW, TH);
    c.strokeStyle = '#c9ae7e'; c.lineWidth = .0006; c.strokeRect(-TW / 2 + .003, -TH / 2 + .003, TW - .006, TH - .006);
    c.globalCompositeOperation = 'destination-out';
    for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { c.beginPath(); c.arc(sx * TW / 2, sy * TH / 2, .005, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(-TW / 2 + .0085, TH / 2 - .011, .0026, 0, TAU); c.fill();
    for (let y = -TH / 2 + .004; y < TH / 2 - .003; y += .0042) { c.beginPath(); c.arc(PERF, y, .0007, 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    const ink = '#22170f', soft = '#5a3e2a';
    const run = (str, font, size, weight) => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = `${weight} ${size * 1000}px ${font}`; const w = c.measureText(str).width * .001; c.restore(); return w; };
    text(c, 'FROM  PINE HALT   →   TO  SEA END', MX, .0235, .0036, SERIF, { fill: soft, weight: 600 });
    text(c, 'The Last Night Train', MX, .0125, .0098, SERIF, { fill: ink, weight: 700 });
    text(c, '末班夜车', MX, .0, .0066, '"NotoSerifSC"', { fill: ink, weight: 600 });
    c.fillStyle = '#b89a6a'; c.fillRect(MX - .03, -.0072, .06, .0005);
    { const a = '纸雕灯影', b = 'Paper-cut Lightbox', sa = .0042, sb = .0046, gap = .003, wa = run(a, '"NotoSerifSC"', sa, 500), wb = run(b, SERIF, sb, 600), x0 = MX - (wa + gap + wb) / 2;
      text(c, a, x0, -.0118, sa, '"NotoSerifSC"', { fill: soft, weight: 500, align: 'left' }); text(c, b, x0 + wa + gap, -.0118, sb, SERIF, { fill: soft, weight: 600, align: 'left' }); }
    text(c, 'LemoLab × Claude Opus 5.5', MX, -.0212, .0062, SERIF, { fill: ink, weight: 700 });
    text(c, 'Piano: “Salamander Grand Piano V3”, Alexander Holm, CC BY 3.0', MX, -.0266, .0035, SERIF, { fill: soft, weight: 600 });   // licence credit (fine print)
    c.save(); c.translate((PERF + TW / 2) / 2, 0); c.rotate(-.22); c.strokeStyle = '#b3302a'; c.lineWidth = .0013; c.beginPath(); c.arc(0, 0, .0105, 0, TAU); c.stroke();
    c.lineWidth = .0006; c.beginPath(); c.arc(0, 0, .0085, 0, TAU); c.stroke();
    text(c, '车', 0, .0006, .0092, '"NotoSerifSC"', { fill: '#b3302a', weight: 700 }); c.restore();
    c.restore(); } }));
  ticket.material.color.setScalar(1.18);
  tint(hills, '#5a5088'); tint(sea, '#6a6aaa'); tint(wall, '#2e3266'); tint(plat, '#151a40'); tint(lamp, '#0c1030'); tint(front, '#04061a'); tr.cars.forEach(m => tint(m, '#10142e'));
  const carX = i => STOP - i * (L + .0025) - (i ? L * .12 : 0);
  return {
    S,
    update(t) {
      const k = clamp((t - E.T0) / (H.stop - E.T0)), xh = lerp(STOP - .065, STOP, 1 - (1 - k) * (1 - k));
      const lit = i => 1 - ss(seg(t, H.off[i], H.off[i] + .18));
      tr.set(xh, () => BY, lit, 1 - ss(seg(t, H.off[0] - .3, H.off[0])), t < H.stop ? .0003 : 0);
      const fl = 1 + .04 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
      lampGlow.position.set(LX, LY + .05 - .0048, -.0726); lampGlow.userData.set(.55 * fl);
      pool.position.set(LX - .02, LY + .001, -.0728); pool.userData.set(.8 * fl);
      U.uLit.value = .9 * fl;
      // the ticket drops on its thread, overshoots and swings to rest
      const d = seg(t, H.card, H.card + 1.1), sw = Math.max(0, t - H.card - .7);
      ticket.visible = t > H.card;
      ticket.position.set(-.03, lerp(.46, .3, Math.min(1, back(d, 1.1))), -.0715); ticket.rotation.z = .06 * Math.exp(-sw * 1.6) * Math.sin(sw * 5.5);
      // camera: wide on the arrival → close along the carriages, following the windows going out → a beat on the last window → pull back to the lamp and the sea
      const iF = clamp((t - H.off[0]) / (H.off[6] - H.off[0]) * 6, 0, 6) + seg(t, H.off[6] + .2, H.off[7] - .2);
      const followX = lerp(carX(0), carX(7), iF / 7);
      const a = eio(seg(t, H.stop - .2, H.off[0] + .1)), b = eio(seg(t, H.off[7] + .4, 49.6));
      const p = [lerp(lerp(.06, followX + .02, a), .05, b), lerp(lerp(.006, .004, a), .014, b), lerp(lerp(.33, .2, a), .42, b), lerp(lerp(.06, followX, a), .05, b), lerp(lerp(.0, .002, a), .014, b), -.08];
      aim(S.cam, p, t, { hand: .0005 });
      this._f = p[2] + .079;
    },
    post() { return { focus: this._f, aper: 12, maxCoc: 12, bloom: { strength: .3, radius: .5, threshold: 1.15 } }; },
    grade() { return { expo: 1.0, vig: .45, sat: 1.04, contrast: .12, lift: [.006, .002, .02], gain: [1, 1, 1] }; },
  };
}
