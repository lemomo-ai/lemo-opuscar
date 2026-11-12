// 8848.86 · a pen plotter draws Mount Qomolangma (Everest) at night in a survey institute's drafting room.
// render(t) depends on t only: WARP maps film time to machine time (real speed inside each stretch, jumps between them);
// plotState(machine time) gives the pen, the holder and how much ink is on the sheet. Going back in time redraws from scratch.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { makePost } from '/core/three/post.js';
import { buildProgram, plotState, drawStroke, strokeBox, RACK, HOME, INK } from './plot.js';
import { mulberry } from './rand.js';

const Q = new URLSearchParams(location.search);
const DUR = 49.9, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const s5 = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = x => { x = clamp(x); return 1 - (1 - x) ** 3; };
const lerp = (a, b, f) => a + (b - a) * f;

const D = await (await fetch('./plot.json')).json();
const G = buildProgram(D);
const { S, PRE, PROG } = G;
const SW = G.swaps;
const kOf = {}; PROG.forEach((i, k) => { kOf[i] = k; });
const firstK = seg => PROG.findIndex(i => S[i].seg === seg);
const inkK = k => G.inkStart[k];
const campInk = (seg, id) => { const k = PROG.findIndex(i => S[i].seg === seg && S[i].camp === id); return G.inkStart[k]; };
const lastBlockK = id => { const b = D.blocks.find(b => b.id === id); return kOf[b.s1 - 1]; };

// ---------- shots and the time map
const CUT = { s1: 0, s2: 4.0, s3: 11.0, s4a: 17.0, s4: 17.9, s5: 26.2, s6: 31.0, s7: 39.1, end: 46.1 };
const shotAt = t => t < CUT.s2 ? 1 : t < CUT.s3 ? 2 : t < CUT.s4a ? 3 : t < CUT.s4 ? 40 : t < CUT.s5 ? 4 : t < CUT.s6 ? 5 : t < CUT.s7 ? 6 : t < CUT.end ? 7 : 8;
const W_ = [];   // [t0, p0] stretches at real speed; P(t) = p0 + (t - t0)
const seg = (t0, p0) => W_.push([t0, p0]);
seg(0, .25);                                                     // the holder comes down on the brown pen
{ const pa = G.marks['lv7900'], pb = G.marks['end:contour'] - .45, n = 14;   // contours, a jump on every beat
  for (let k = 0; k < n; k++) seg(CUT.s2 + k * .5, lerp(pa, pb, (k / (n - 1)) ** 1.5)); }
seg(CUT.s3, SW[1].t0 - .35);                                     // brown back to the rack, grey out
{ const h0 = inkK(firstK('hatch')), h1 = G.marks['end:hatch'];
  seg(14.6, h0 - .1); [.006, .02, .045, .08].forEach((f, k) => seg(15.0 + k * .5, lerp(h0, h1, f))); }
seg(CUT.s4a, SW[2].tAt - .3);                                    // insert: the red pen
seg(CUT.s4, inkK(firstK('route')) - .3);                         // the route, real speed
seg(19.7, campInk('route', 'c1') - .75);
const T_TRI = 19.7 + (G.marks['end:tri'] - (campInk('route', 'c1') - .75));   // film time the summit triangle is done
seg(T_TRI + .15, G.marks['end:tri'] + 1.7);                      // jump: the carriage is already away north-east, the camps stand clear
seg(CUT.s5, inkK(firstK('profile')) - .7);                      // the profile
seg(28.4, campInk('profile', 'c2') - .3);
seg(CUT.s6, inkK(firstK('labels')) - .1);                        // the three heights, jumps, then a still frame
{ const a = inkK(firstK('labels')), b = G.inkEnd[lastBlockK('row2005_en')];
  [.18, .42, .66].forEach((f, k) => seg(31.5 + k * .45, lerp(a, b, f))); seg(32.85, b - .2); }
seg(33.4, G.marks['end:labels'] + .05);
seg(35.55, inkK(firstK('circle')) - .6);
seg(37.25, inkK(firstK('number')) - .1);                         // ring done: jump, the carriage is already at the number (out of this frame)
seg(40.9, G.inkEnd[PROG.length - 1] - 1.2);                      // the number, one more jump
const JUMPS = W_.slice(1).map(w => w[0]);
function warp(t) { let w = W_[0]; for (const x of W_) if (x[0] <= t) w = x; return w[1] + (t - w[0]); }
const isCut = t => [CUT.s2, CUT.s3, CUT.s4a, CUT.s4, CUT.s5, CUT.s6, CUT.s7, CUT.end].some(c => Math.abs(c - t) < 1e-6);

// ---------- relief lift (shot 3): contours stand up at true scale, summit first, then settle back on the paper
const liftAt = (t, lev) => { const d = (8800 - lev) / 4500 * .7; return ss((t - 11.25 - d) / 1.1) * (1 - s5((t - 14.0 - d * .4) / 1.0)); };

// ---------- sound events
const EV = [];
{ let prev = plotState(G, warp(0));
  for (let f = 1; f <= Math.round(DUR * FPS); f++) {
    const t = f / FPS, P = warp(t), st = plotState(G, P), jump = JUMPS.some(j => j > t - 1 / FPS && j <= t) ? 1 : 0;
    EV.push({ t: +t.toFixed(4), type: 'f', v: +(st.v || 0).toFixed(1), d: st.down ? 1 : 0, z: +st.z.toFixed(2), pen: st.held, shot: shotAt(t), jump, end: t >= CUT.end ? 1 : 0 });
    prev = st;
  }
  // discrete events from the machine program, mapped back to film time where that machine moment is on screen
  const film = P => { for (let i = 0; i < W_.length; i++) { const [t0, p0] = W_[i], t1 = i + 1 < W_.length ? W_[i + 1][0] : CUT.end; if (P >= p0 && P < p0 + (t1 - t0)) return t0 + (P - p0); } return null; };
  for (const o of G.ops) {
    if (o.type === 'grip') { const t = film(o.t1 - o.dur * .5); if (t !== null && t < CUT.end) EV.push({ t: +t.toFixed(4), type: o.close ? 'grip' : 'release', pen: o.pen }); }
    if (o.type === 'drop') { const t = film(o.t1); if (t !== null && t < CUT.end) EV.push({ t: +t.toFixed(4), type: 'tap', pen: S[o.i].p, seg: S[o.i].seg }); }
    if (o.type === 'lift') { const t = film(o.t0); if (t !== null && t < CUT.end) EV.push({ t: +t.toFixed(4), type: 'up', pen: S[o.i].p }); }
  }
  for (const id of ['base', 'mid', 'abc', 'c1', 'c2', 'c3']) for (const sg of ['route', 'profile']) { const t = film(campInk(sg, id)); if (t !== null) EV.push({ t: +t.toFixed(4), type: 'camp', seg: sg, id }); }
  for (const sg of ['route', 'profile']) { let k = -1; PROG.forEach((i, kk) => { if (S[i].seg === sg) k = kk; }); const t = film(G.inkEnd[k]); if (t !== null) EV.push({ t: +t.toFixed(4), type: 'summit', seg: sg }); }
  { const t = film(G.inkEnd[PROG.findIndex(i => S[i].seg === 'circle')]); EV.push({ t: +t.toFixed(4), type: 'ringDone' }); }
  { const t = film(inkK(firstK('circle'))); EV.push({ t: +t.toFixed(4), type: 'ring' }); }
  { const t = film(G.inkEnd[PROG.length - 1]); EV.push({ t: +t.toFixed(4), type: 'numberDone' }); }
  { const t = film(G.park.tDrop); if (t !== null) EV.push({ t: +t.toFixed(4), type: 'parked' }); }
  for (const j of JUMPS) if (!isCut(j)) EV.push({ t: j, type: 'jump', shot: shotAt(j) });
  for (const c of Object.values(CUT)) if (c > 0) EV.push({ t: c, type: 'cut', shot: shotAt(c + .001) });
  EV.push({ t: 11.25, type: 'liftUp' }, { t: 14.0, type: 'liftDown' });
  EV.sort((a, b) => a.t - b.t);
}
window.EV = EV; window.DUR = DUR;

// ---------- page
const W = innerWidth, H = innerHeight, SS = +(Q.get('ss') || 2);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false);
renderer.domElement.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:0;top:0`;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = Q.get('exp') ? +Q.get('exp') : .45;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const over = document.createElement('canvas'); over.width = W; over.height = H; over.style.cssText = `width:${W}px;height:${H}px;position:absolute;left:0;top:0`;
document.body.appendChild(over); const og = over.getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080b);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .22;
const camera = new THREE.PerspectiveCamera(36, W / H, .005, 30);
const aniso = renderer.capabilities.getMaxAnisotropy();
const rnd = mulberry(5);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wp = (sx, sy, h = 0) => V(sx / 1000 - .297, h / 1000, sy / 1000 - .21);   // sheet mm → world metres
const shadowAll = o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
const std = (color, roughness = .5, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

// ---------- drafting table (procedural wood) and the room
function woodCanvas(w, h, tone) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); const img = x.createImageData(w, h); const d = img.data;
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x0, y0) => { const i = Math.floor(x0), j = Math.floor(y0), f = x0 - i, g = y0 - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
    return (hash(i, j) * (1 - u) + hash(i + 1, j) * u) * (1 - v) + (hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u) * v; };
  const plank = h / 6, off = [0, .37, .71, .13, .52, .88, .29];
  for (let j = 0; j < h; j++) { const pl = Math.floor(j / plank), pj = (j % plank) / plank;
    for (let i = 0; i < w; i++) { const u = i / w * 2.4 + off[pl] * 5;
      const warp = vn(u * 1.3, pl * 7.1 + pj * 1.5) * 2.2 + vn(u * 4, pj * 3 + pl) * .4, g = pj * 14 + warp;
      const ring = Math.pow(.5 + .5 * Math.sin(g * 6.283 * .55), 4), fib = vn(u * 60, pj * 700 + pl * 50) * .6 + vn(u * 8, pj * 220 + pl * 20) * .4;
      let t = .6 + .09 * ring + .22 * (fib - .5) + .14 * (vn(u * 2, pl * 3 + pj) - .5); if (Math.min(pj, 1 - pj) < .003) t *= .45;
      const k = (j * w + i) * 4; d[k] = tone[0] + tone[3] * t; d[k + 1] = tone[1] + tone[4] * t; d[k + 2] = tone[2] + tone[5] * t; d[k + 3] = 255; } }
  x.putImageData(img, 0, 0); return cv;
}
const woodTex = new THREE.CanvasTexture(woodCanvas(2048, 1280, [34, 20, 12, 74, 44, 26])); woodTex.colorSpace = THREE.SRGBColorSpace; woodTex.anisotropy = aniso;
const TABLE_Y = -.024;
const table = new THREE.Mesh(new RoundedBoxGeometry(1.9, .04, 1.15, 2, .006), std(0xffffff, .5, 0, { map: woodTex }));
table.position.set(0, TABLE_Y - .02, -.05); table.receiveShadow = true; table.castShadow = true; scene.add(table);
for (const [x, z] of [[-.9, -.58], [.9, -.58], [-.9, .48], [.9, .48]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.05, .74, .05), std(0x1b1410, .6)); leg.position.set(x, TABLE_Y - .41, z); scene.add(leg); }
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), std(0x17130f, .9)); floor.rotation.x = -Math.PI / 2; floor.position.y = TABLE_Y - .78; floor.receiveShadow = true; scene.add(floor);
const wallMat = std(0x2a2824, .95);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMat); wall.position.set(0, .9, -1.35); scene.add(wall);
const wallL = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), wallMat); wallL.rotation.y = Math.PI / 2; wallL.position.set(-2.1, .9, 0); scene.add(wallL);
// window with blinds on the back wall: city night outside
const win = new THREE.Group(); scene.add(win); win.position.set(-.55, .62, -1.34);
{ const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .9), new THREE.MeshBasicMaterial({ color: 0x1a2c4a })); win.add(glow);
  const frameM = std(0x3a3833, .7);
  for (const [w, h, x, y] of [[1.06, .04, 0, .47], [1.06, .05, 0, -.47], [.04, .98, -.52, 0], [.04, .98, .52, 0], [.03, .9, 0, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04), frameM); b.position.set(x, y, .02); win.add(b); }
  const slat = std(0x8d8a82, .6);
  for (let k = 0; k < 26; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, .022, .004), slat); s.position.set(0, .43 - k * .034, .06); s.rotation.x = -.9; win.add(s); }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.15, .03, .14), frameM); sill.position.set(0, -.5, .07); win.add(sill); }
// plan chest (map drawers) on the right, with brass label holders
const chest = new THREE.Group(); scene.add(chest); chest.position.set(.95, TABLE_Y - .78, -1.05);
{ const body = new THREE.Mesh(new RoundedBoxGeometry(1.1, .82, .62, 2, .01), std(0x3f4a42, .55)); body.position.y = .41; chest.add(body);
  for (let k = 0; k < 6; k++) { const y = .1 + k * .12;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.04, .104, .01), std(0x46524a, .5)); fr.position.set(0, y, .312); chest.add(fr);
    const h = new THREE.Mesh(new THREE.BoxGeometry(.16, .014, .02), std(0xb08d4a, .35, .8)); h.position.set(0, y - .02, .32); chest.add(h);
    const lb = new THREE.Mesh(new THREE.BoxGeometry(.09, .04, .006), std(0xe8e0cc, .8)); lb.position.set(0, y + .022, .318); chest.add(lb); }
  for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .7, 20), std([0xe7dfcc, 0xd9cfb8, 0xeee6d2][k % 3], .8)); r.rotation.z = Math.PI / 2; r.rotation.y = (k - 2) * .06; r.position.set(-.05 + k * .02, .845 + (k % 2) * .03, -.1 + k * .06); chest.add(r); } }
shadowAll(chest);
// the south wall: shelves of map tubes and binders, only the lamp's spill reaches them
const shelf = new THREE.Group(); scene.add(shelf); shelf.position.set(.05, TABLE_Y - .78, 1.45);
{ const wallS = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallMat); wallS.rotation.y = Math.PI; wallS.position.set(0, 1.7, .25); shelf.add(wallS);
  const wood = std(0x3a2a1c, .7);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, .025, .32), wood); b.position.set(0, .5 + k * .38, 0); shelf.add(b); }
  for (const x of [-.8, .8]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(.025, 1.6, .32), wood); sd.position.set(x, 1.05, 0); shelf.add(sd); }
  const r2 = mulberry(31), cols = [0x2d3b52, 0x5a2a1c, 0x3c4a35, 0x6b5a3a, 0x1f2a2a, 0x7a6a50];
  for (let k = 0; k < 4; k++) { let x = -.76; const y = .5 + k * .38 + .0125;
    while (x < .74) { if (k % 2 === 0) { const w = .03 + r2() * .03, h = .22 + r2() * .1, bk = new THREE.Mesh(new THREE.BoxGeometry(w, h, .24), std(cols[Math.floor(r2() * cols.length)], .7)); bk.position.set(x + w / 2, y + h / 2, -.02); shelf.add(bk); x += w + .004; }
      else { const r = .03 + r2() * .012, tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 20), std([0xd9cfb8, 0xe7dfcc, 0x8a7a5a][Math.floor(r2() * 3)], .8)); tube.rotation.x = Math.PI / 2; tube.position.set(x + r, y + r, 0); shelf.add(tube); x += r * 2 + .006; } } } }
const spill = new THREE.PointLight(0xffb878, .5, 2.6, 2); spill.position.set(0, .35, .9); scene.add(spill);
// a surveyor's theodolite on its tripod in the corner
const theo = new THREE.Group(); scene.add(theo); theo.position.set(-1.25, TABLE_Y - .78, -.95);
{ const legM = std(0x8a6a3a, .5); for (let k = 0; k < 3; k++) { const a = k * 2.094 + .3, l = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, 1.42, 10), legM); l.position.set(Math.cos(a) * .2, .68, Math.sin(a) * .2); l.rotation.set(Math.sin(a) * .15, 0, -Math.cos(a) * .15); theo.add(l); }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .03, 24), std(0x2a2a2a, .4, .5)); head.position.y = 1.39; theo.add(head);
  const body = new THREE.Mesh(new RoundedBoxGeometry(.11, .16, .1, 3, .012), std(0xd8c23a, .45)); body.position.y = 1.49; theo.add(body);
  const tel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, .2, 20), std(0x1c1c1c, .35, .4)); tel.rotation.x = Math.PI / 2 - .12; tel.position.y = 1.55; theo.add(tel); }
shadowAll(theo);

// ---------- the plotter: bed, rails, beam, carriage with a Z holder and gripper, a rack of four pens
const alu = std(0xb9bdc2, .32, 1), steel = std(0xdfe3e8, .14, 1), black = std(0x141416, .42, .15), matte = std(0x0c0c0d, .75), rubber = std(0x080808, .9);
const bed = new THREE.Mesh(new RoundedBoxGeometry(.8, .022, .62, 2, .003), std(0xcfcfc9, .7)); bed.position.set(0, -.011, 0); bed.receiveShadow = true; bed.castShadow = true; scene.add(bed);
const bedEdge = new THREE.Mesh(new THREE.BoxGeometry(.81, .012, .63), alu); bedEdge.position.set(0, -.018, 0); scene.add(bedEdge);
const RX = .375, RZ0 = -.3, RZ1 = .3;
for (const s of [-1, 1]) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.03, .032, RZ1 - RZ0), alu); rail.position.set(s * RX, .016, 0); scene.add(rail);
  for (const yy of [.008, .024]) { const g = new THREE.Mesh(new THREE.BoxGeometry(.031, .003, RZ1 - RZ0 + .001), matte); g.position.set(s * RX, yy, 0); scene.add(g); }
  for (const zz of [RZ0 - .01, RZ1 + .01]) { const cap = new THREE.Mesh(new RoundedBoxGeometry(.04, .045, .02, 2, .003), black); cap.position.set(s * RX, .0225, zz); scene.add(cap); }
}
// control box at the front right corner with a small status window (no text on it)
const ctl = new THREE.Mesh(new RoundedBoxGeometry(.14, .045, .08, 2, .004), black); ctl.position.set(.31, .0225, -.37); scene.add(ctl);
const lcd = new THREE.Mesh(new THREE.PlaneGeometry(.06, .016), new THREE.MeshBasicMaterial({ color: 0x3b6e4f })); lcd.rotation.x = -Math.PI / 2 + .3; lcd.position.set(.29, .046, -.345); scene.add(lcd);
const led = new THREE.Mesh(new THREE.SphereGeometry(.0025, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7cff9a })); led.position.set(.355, .046, -.35); scene.add(led);
const beam = new THREE.Group(); scene.add(beam);
for (const s of [-1, 1]) {
  const blk = new THREE.Mesh(new RoundedBoxGeometry(.055, .1, .07, 3, .004), black); blk.position.set(s * RX, .082, 0); beam.add(blk);
  for (let k = 0; k < 4; k++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, .002, 12), steel); sc.rotation.x = Math.PI / 2; sc.position.set(s * RX + (k % 2 - .5) * .03, .06 + Math.floor(k / 2) * .045, .0355); beam.add(sc); }
}
const mot = new THREE.Mesh(new RoundedBoxGeometry(.044, .044, .044, 2, .003), matte); mot.position.set(RX, .155, 0); beam.add(mot);
for (const [y, z] of [[.098, -.012], [.128, -.012]]) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0055, RX * 2, 24), steel); rod.rotation.z = Math.PI / 2; rod.position.set(0, y, z); beam.add(rod); }
const belt = new THREE.Mesh(new THREE.BoxGeometry(RX * 2, .006, .0016), rubber); belt.position.set(0, .113, -.026); beam.add(belt);
const chain = new THREE.Group(); beam.add(chain);
const linkGeo = new RoundedBoxGeometry(.016, .012, .018, 2, .002); const LINKS = 64; const links = [];
for (let k = 0; k < LINKS; k++) { const m = new THREE.Mesh(linkGeo, black); m.castShadow = true; chain.add(m); links.push(m); }
const buildChain = cx => {
  const A = V(cx + .012, .165, -.018), B = V(RX - .03, .2, -.005), mid = V((A.x + B.x) / 2 + .03, .215, -.02);
  const curve = new THREE.CatmullRomCurve3([A, V(A.x + .03, .2, -.02), mid, V(B.x - .04, .225, -.012), B]);
  const L = curve.getLength(), n = Math.min(LINKS, Math.floor(L / .0165));
  for (let k = 0; k < LINKS; k++) { const m = links[k]; m.visible = k < n; if (!m.visible) continue; const t = k / n; m.position.copy(curve.getPointAt(t)); m.quaternion.setFromUnitVectors(V(1, 0, 0), curve.getTangentAt(t)); }
};
// carriage: rides the rods; the pen axis sits PEN_DZ in front of the beam
const PEN_DZ = .03;
const car = new THREE.Group(); beam.add(car);
{ const cb = new THREE.Mesh(new RoundedBoxGeometry(.07, .075, .045, 3, .005), black); cb.position.set(0, .112, -.004); car.add(cb);
  for (let k = 0; k < 4; k++) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .002, 12), steel); sc.rotation.x = Math.PI / 2; sc.position.set((k % 2 - .5) * .05, .095 + Math.floor(k / 2) * .035, .019); car.add(sc); }
  const servo = new THREE.Mesh(new RoundedBoxGeometry(.03, .022, .02, 2, .003), std(0x1d3f8a, .5)); servo.position.set(-.024, .158, .004); car.add(servo);
  const guide1 = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .09, 12), steel); guide1.position.set(-.012, .1, PEN_DZ - .012); car.add(guide1);
  const guide2 = guide1.clone(); guide2.position.x = .012; car.add(guide2);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(.05, .07, .008, 2, .002), black); plate.position.set(0, .112, .02); car.add(plate); }
// the Z holder: slides on the two guides, carries the gripper jaws
const holder = new THREE.Group(); car.add(holder);
{ const blk = new THREE.Mesh(new RoundedBoxGeometry(.04, .018, .028, 2, .003), alu); blk.position.set(0, .066, PEN_DZ - .006); holder.add(blk);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.0085, .002, 10, 32), alu); ring.rotation.x = Math.PI / 2; ring.position.set(0, .057, PEN_DZ); holder.add(ring);
  const spring = new THREE.Mesh(new THREE.TorusGeometry(.0035, .0008, 6, 16), steel); spring.position.set(.016, .075, PEN_DZ - .012); holder.add(spring); }
const jaws = [-1, 1].map(s => { const j = new THREE.Mesh(new RoundedBoxGeometry(.008, .014, .016, 2, .002), std(0x2a2a2c, .4, .3)); j.position.set(s * .01, .046, PEN_DZ); holder.add(j); return j; });
// pens: colour-coded barrels (black, brown, grey, red)
const PEN_COL = [0x1a1a1e, 0x6d3a1c, 0xa29f97, 0xc8261e];
const pens = PEN_COL.map(c => {
  const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color: c, roughness: .32, clearcoat: .6, clearcoatRoughness: .25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.0052, .0052, .085, 32), m); body.position.y = .061; g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.0056, .0056, .022, 32), m); cap.position.y = .111; g.add(cap);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.0056, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); top.position.y = .122; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.0054, .0054, .004, 32), std(0xe9e4d6, .5)); band.position.y = .093; g.add(band);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.0058, .0058, .012, 32), black); grip.position.y = .046; g.add(grip);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.0052, .0016, .014, 32), m); cone.position.y = .011; g.add(cone);
  const nib = new THREE.Mesh(new THREE.CylinderGeometry(.0011, .0006, .0045, 16), std(0xcfcfcf, .3, .7)); nib.position.y = .00225; g.add(nib);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.0006, 12, 8), m); tip.position.y = .0001; g.add(tip);
  scene.add(g); shadowAll(g); return g;
});
// rack: an aluminium bar with a rubber cup per stall, left of the sheet
const rack = new THREE.Group(); scene.add(rack);
{ const [x0, y0] = RACK(0), [, y3] = RACK(3); const c0 = wp(x0, (y0 + y3) / 2);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(.022, .006, (y3 - y0) / 1000 + .03, 2, .002), alu); bar.position.set(c0.x, .003, c0.z); rack.add(bar);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.03, .002, (y3 - y0) / 1000 + .04), black); foot.position.set(c0.x, .001, c0.z); rack.add(foot);
  for (let k = 0; k < 4; k++) { const p = wp(...RACK(k)); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.0072, .0062, .012, 24, 1, true), rubber); cup.position.set(p.x, .006, p.z); rack.add(cup);
    const capTop = new THREE.Mesh(new THREE.TorusGeometry(.0068, .0012, 8, 24), rubber); capTop.rotation.x = Math.PI / 2; capTop.position.set(p.x, .012, p.z); rack.add(capTop);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .001, 16), std(PEN_COL[k], .5)); dot.position.set(p.x + .013, .0062, p.z); rack.add(dot); } }
shadowAll(beam); shadowAll(rack);
// tape at the sheet corners
{ const tapeMat = std(0xe6d8b0, .8, 0, { transparent: true, opacity: .9 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const tp = new THREE.Mesh(new THREE.BoxGeometry(.05, .0004, .02), tapeMat); tp.position.set(sx * .297, .0011, sz * .21); tp.rotation.y = sx * sz * .78; scene.add(tp); } }
// desk props: a mug, a pencil, a field book, spare pens in a tray
const props = new THREE.Group(); scene.add(props);
{ const mugM = std(0xe8e2d6, .35); const mug = new THREE.Mesh(new THREE.CylinderGeometry(.04, .037, .095, 40, 1, true), mugM); mug.position.set(.62, TABLE_Y + .0475, -.38); props.add(mug);
  const mb = new THREE.Mesh(new THREE.CircleGeometry(.037, 32), mugM); mb.rotation.x = -Math.PI / 2; mb.position.set(.62, TABLE_Y + .002, -.38); props.add(mb);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(.037, 32), std(0x3a1d0c, .15)); tea.rotation.x = -Math.PI / 2; tea.position.set(.62, TABLE_Y + .08, -.38); props.add(tea);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.024, .006, 12, 24, Math.PI), mugM); handle.rotation.z = -Math.PI / 2; handle.position.set(.66, TABLE_Y + .05, -.38); props.add(handle);
  const book = new THREE.Mesh(new RoundedBoxGeometry(.13, .016, .19, 2, .004), std(0x5b2a17, .6)); book.position.set(.64, TABLE_Y + .008, .1); book.rotation.y = -.3; props.add(book);
  const band = new THREE.Mesh(new THREE.BoxGeometry(.006, .017, .191), std(0x111111, .6)); band.position.set(.69, TABLE_Y + .0085, .085); band.rotation.y = -.3; props.add(band);
  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(.0035, .0035, .17, 6), std(0x2c5b3a, .5)); pencil.rotation.set(0, .5, Math.PI / 2); pencil.position.set(.55, TABLE_Y + .0035, .3); props.add(pencil);
  const tray = new THREE.Mesh(new RoundedBoxGeometry(.06, .012, .16, 2, .003), black); tray.position.set(-.5, TABLE_Y + .006, .22); props.add(tray);
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .12, 16), new THREE.MeshPhysicalMaterial({ color: PEN_COL[k], roughness: .3, clearcoat: .6 })); p.rotation.x = Math.PI / 2; p.position.set(-.515 + k * .01, TABLE_Y + .016, .22); props.add(p); } }
shadowAll(props);
// architect's lamp clamped at the back left: the light of the scene
const lamp = new THREE.Group(); scene.add(lamp);
const LAMP_HEAD = V(-.31, .54, .2), LAMP_AIM = V(.02, 0, -.04);
{ const enamel = std(0x22352b, .38, .2);
  const base = V(-.68, TABLE_Y, .36), elbow = V(-.63, .44, .33);
  const clampB = new THREE.Mesh(new RoundedBoxGeometry(.05, .05, .05, 2, .004), enamel); clampB.position.copy(base).add(V(0, .025, 0)); lamp.add(clampB);
  const rod = (a, b, r) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), steel); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); lamp.add(m); };
  for (const o of [-.012, .012]) { rod(base.clone().add(V(o, .05, 0)), elbow.clone().add(V(o, 0, 0)), .004); rod(elbow.clone().add(V(o, 0, 0)), LAMP_HEAD.clone().add(V(o, .03, 0)), .0035); }
  const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .04, 16), enamel); knuckle.rotation.z = Math.PI / 2; knuckle.position.copy(elbow); lamp.add(knuckle);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(.03, .085, .12, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x22352b, roughness: .35, metalness: .2, side: THREE.DoubleSide }));
  shade.position.copy(LAMP_HEAD); shade.quaternion.setFromUnitVectors(V(0, -1, 0), LAMP_AIM.clone().sub(LAMP_HEAD).normalize()); lamp.add(shade);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(.029, .084, .118, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe2b8, side: THREE.BackSide })); inner.position.copy(shade.position); inner.quaternion.copy(shade.quaternion); lamp.add(inner);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.024, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); bulb.position.copy(LAMP_HEAD.clone().add(LAMP_AIM.clone().sub(LAMP_HEAD).normalize().multiplyScalar(.03))); lamp.add(bulb); }
shadowAll(lamp); lamp.traverse(m => { if (m.isMesh && m.material.isMeshBasicMaterial) m.castShadow = false; });
const key = new THREE.SpotLight(0xffc68e, Q.get('key') ? +Q.get('key') : 3, 3, .8, .8, 1.6);
key.position.copy(LAMP_HEAD.clone().add(LAMP_AIM.clone().sub(LAMP_HEAD).normalize().multiplyScalar(.05))); key.target.position.copy(LAMP_AIM);
key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0001; key.shadow.normalBias = .0015; key.shadow.radius = 3; key.shadow.camera.near = .05; key.shadow.camera.far = 2;
scene.add(key, key.target);
scene.add(new THREE.HemisphereLight(0xc9d4ff, 0x1a120a, .08));
const moon = new THREE.DirectionalLight(0x6f8fd0, .35); moon.position.set(-.6, 1.4, -2); scene.add(moon);
const bounce = new THREE.PointLight(0xffb070, .25, 1.6, 2); bounce.position.set(.1, .25, .3); scene.add(bounce);

// ---------- paper: a whole-sheet texture plus high-resolution patches for close shots
const grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 512;
{ const x = grainTile.getContext('2d'); const img = x.createImageData(512, 512); const d = img.data; const r2 = mulberry(17);
  for (let k = 0; k < d.length; k += 4) { const n = (r2() - .5) * 9; d[k] = 241 + n; d[k + 1] = 236 + n; d[k + 2] = 223 + n * .9; d[k + 3] = 255; }
  x.putImageData(img, 0, 0); x.globalAlpha = .07; x.strokeStyle = '#8a7a60'; x.lineWidth = .6;
  for (let k = 0; k < 900; k++) { const a = r2() * 6.28, l = 4 + r2() * 16, px = r2() * 512, py = r2() * 512; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .4) * l * .5, py + Math.sin(a + .4) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } }
const bumpTile = new THREE.CanvasTexture(grainTile); bumpTile.wrapS = bumpTile.wrapT = THREE.RepeatWrapping;
const SHW = D.sheet[0], SHH = D.sheet[1];
const BOX = S.map(strokeBox);
const preSet = new Set(PRE);
function makeSheet(x0, y0, w, h, k, lift) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  const ctx = cv.getContext('2d'); const pat = ctx.createPattern(grainTile, 'repeat');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const bump = bumpTile.clone(); bump.repeat.set(w / 40, h / 40); bump.needsUpdate = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w / 1000, h / 1000), new THREE.MeshStandardMaterial({ map: tex, roughness: .93, bumpMap: bump, bumpScale: .35 }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.copy(wp(x0 + w / 2, y0 + h / 2, lift)); mesh.receiveShadow = true; scene.add(mesh);
  const hit = i => { const b = BOX[i]; return b[2] >= x0 - 1 && b[0] <= x0 + w + 1 && b[3] >= y0 - 1 && b[1] <= y0 + h + 1; };
  const pre = PRE.filter(hit), prog = []; for (let k2 = 0; k2 < PROG.length; k2++) if (hit(PROG[k2])) prog.push(k2);
  const st = { cv, ctx, tex, mesh, x0, y0, w, h, k, n: -1, saved: null };
  const begin = () => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'multiply'; };
  st.reset = () => { ctx.fillStyle = pat; ctx.fillRect(0, 0, cv.width, cv.height); begin(); for (const i of pre) drawStroke(ctx, S[i], k, x0, y0); ctx.restore(); st.n = 0; };
  st.update = (pst, withPartial) => {
    let changed = false;
    if (st.n < 0 || pst.n < st.n) { st.reset(); changed = true; }
    if (pst.n > st.n) { begin(); let lo = 0, hi = prog.length; while (lo < hi) { const m = (lo + hi) >> 1; if (prog[m] < st.n) lo = m + 1; else hi = m; }
      for (let q = lo; q < prog.length && prog[q] < pst.n; q++) drawStroke(ctx, S[PROG[prog[q]]], k, x0, y0);
      ctx.restore(); st.n = pst.n; changed = true; }
    if (withPartial && pst.cur && pst.cur.d > 0 && hit(pst.cur.i)) {
      const b = BOX[pst.cur.i], m = 1.5, rx = Math.max(0, Math.floor((b[0] - m - x0) * k)), ry = Math.max(0, Math.floor((b[1] - m - y0) * k));
      const rw = Math.min(cv.width, Math.ceil((b[2] + m - x0) * k)) - rx, rh = Math.min(cv.height, Math.ceil((b[3] + m - y0) * k)) - ry;
      if (rw > 0 && rh > 0) { st.saved = { img: ctx.getImageData(rx, ry, rw, rh), rx, ry }; begin(); drawStroke(ctx, S[pst.cur.i], k, x0, y0, pst.cur.d); ctx.restore(); changed = true; }
    }
    if (changed) tex.needsUpdate = true;
  };
  st.restore = () => { if (st.saved) { ctx.putImageData(st.saved.img, st.saved.rx, st.saved.ry); st.saved = null; tex.needsUpdate = true; } };
  return st;
}
const base = makeSheet(0, 0, SHW, SHH, 6144 / SHW, .4);
const PATCH = {   // shot → window (mm) and resolution (px/mm)
  1: [130, 225, 95, 62, 36], 40: null, 4: [70, 28, 140, 138, 22], 41: [128, 186, 120, 102, 28], 6: [318, 74, 258, 92, 20], 7: [316, 308, 260, 70, 22],
};
const patches = {}; for (const [k, w] of Object.entries(PATCH)) if (w) { patches[k] = makeSheet(w[0], w[1], w[2], w[3], w[4], .6); patches[k].mesh.visible = false; }

// ---------- lifted contours (fat lines), with a shadow copy sheared onto the paper
const liftGroup = new THREE.Group(); scene.add(liftGroup);
const LMAT = new LineMaterial({ color: 0x5a2c12, linewidth: 1.6 * SS });
LMAT.resolution.set(W * SS, H * SS);
const LEVELS = {};
for (const c of D.lift) { (LEVELS[c.lv] ??= []).push(c); }
const LIFT = Object.entries(LEVELS).map(([lv, arr]) => {
  const pos = [];
  for (const c of arr) { const p = c.pts; for (let j = 3; j < p.length; j += 3) { const a = wp(p[j - 3], p[j - 2]), b = wp(p[j], p[j + 1]); pos.push(a.x, p[j - 1] / 1000, a.z, b.x, p[j + 2] / 1000, b.z); } }
  const g = new LineSegmentsGeometry(); g.setPositions(pos);
  const line = new LineSegments2(g, LMAT); line.position.y = .0006; line.frustumCulled = false; liftGroup.add(line);
  return { lv: +lv, line };
});

// ---------- post
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: true, aoRadius: .018, aoScale: 1.4 });
post.bloom.strength = .12; post.vig.uniforms.amt.value = .62; post.vig.uniforms.warm.value = .35; post.vig.uniforms.contrast.value = .14;

// ---------- cameras
const PS = t => { const st = plotState(G, warp(t)); return [st.x, st.y]; };
function penSmooth(t, half, n = 9, lo = -1e9, hi = 1e9) { let x = 0, y = 0, c = 0; for (let k = 0; k < n; k++) { const u = t + (k / (n - 1) - .5) * 2 * half; if (u < lo || u > hi) continue; const [px, py] = PS(u); x += px; y += py; c++; } return [x / c, y / c]; }
const segBounds = t => { let a = 0, b = DUR; for (const j of [...JUMPS, ...Object.values(CUT)]) { if (j <= t) a = Math.max(a, j); else b = Math.min(b, j); } return [a, b]; };
const look = (pos, at, fov, aper, focus, roll = 0) => ({ pos, look: at, fov, aper, focus: focus || at, roll });
function cameraAt(t) {
  const sh = shotAt(t);
  if (sh === 1) {   // at the rack: the holder comes down on the brown pen; then a pan with the carriage to where the first line starts
    const [a, b] = segBounds(t); const [px, py] = penSmooth(t, .3, 9, a, b);
    const f = ss((t - 1.0) / 1.5), g = ss((t - 2.0) / 1.6);
    const P = wp(px, py, lerp(lerp(48, 24, f), 3, g));
    const off = V(lerp(.13, .065, f), lerp(.07, .04, g), lerp(.12, .06, f)).applyAxisAngle(V(0, 1, 0), lerp(.12, -.2, ss(t / 4)));
    return look(P.clone().add(off), P, lerp(34, 27, g), lerp(1.0, 1.9, g), P.clone().add(V(0, lerp(.004, 0, g), 0)));
  }
  if (sh === 2) {   // from above, pulling back as the contours grow outward from the summit
    const u = (t - CUT.s2) / (CUT.s3 - CUT.s2), f = ss(u) * .85 + u * .15;
    const c = wp(lerp(D.summit[0] + 4, 160, f), lerp(D.summit[1] - 14, 206, f));
    const h = lerp(.4, .62, f), a = lerp(.3, .03, eo(u * 1.4));
    const pos = c.clone().add(V(Math.sin(a) * h * .25, h, lerp(.42, .08, f) * h));
    return look(pos, c, lerp(30, 36, f), .35, c);
  }
  if (sh === 3) {   // low from beyond the north edge: the contours stand up as the mountain, then lie down; the grey pen comes in
    const u = (t - CUT.s3) / (CUT.s4a - CUT.s3);
    const pos = wp(lerp(118, 236, s5(u)), lerp(-30, 0, u), lerp(84, 92, ss(u)));
    const at = wp(lerp(172, 186, u), 246, lerp(22, 4, ss((t - 14.0) / 1.8)));
    return look(pos, at, lerp(29, 25, u), .45, wp(lerp(176, 182, u), lerp(240, 236, ss((t - 14) / 2)), lerp(22, 2, ss((t - 14) / 1.5))));
  }
  if (sh === 40) {   // insert at the rack: the red pen
    const u = (t - CUT.s4a) / (CUT.s4 - CUT.s4a), p = wp(...RACK(3), 30);
    return look(p.clone().add(V(.075 - .01 * u, .03 + .004 * u, .05)), p.clone().add(V(0, -.012, 0)), 30, 2.2, p.clone().add(V(0, -.012, 0)));
  }
  if (sh === 4) {   // long lens on the red pen, then the camps under the summit
    const [a, b] = segBounds(t); const [px, py] = penSmooth(t, .4, 9, a, b);
    const g = ss((t - 19.75) / 1.0);
    const cx = lerp(px, 186, g), cy = lerp(py, 233, g);
    const P = wp(cx, cy), pos = P.clone().add(V(lerp(.03, .02, g), lerp(.2, .3, g), lerp(.15, .1, g)));
    return look(pos, P, lerp(17, 23, g), lerp(1.4, .9, g), wp(lerp(px, 186, g * .6), lerp(py, 236, g * .6)));
  }
  if (sh === 5) {   // from the south-east, panning with the pen between the profile and the map's summit
    const u = (t - CUT.s5) / (CUT.s6 - CUT.s5), [a, b] = segBounds(t);
    const [px, py] = penSmooth(t, .7, 11, a, b);
    const at = wp(lerp(clamp(px, 330, 520), 395, .35) , lerp(clamp(py, 200, 270), 236, .5));
    const pos = at.clone().add(V(lerp(.05, .02, u), .17, .21));
    return look(pos, at, 28, .6, wp(px, py));
  }
  if (sh === 6) {   // the summit-height inset, held still; a slow creep only
    const u = (t - CUT.s6) / (CUT.s7 - CUT.s6);
    const at = wp(447 + 2 * u, 93 - 1 * u);
    return look(at.clone().add(V(.008, .27 - .005 * u, .1 - .004 * u)), at, 30, .3, at);
  }
  // shot 7: on the pen writing the number, then out to the sheet and the whole table
  const [a, b] = segBounds(t); const [px, py] = penSmooth(Math.min(t, 42.1), .35, 9, Math.max(a, CUT.s7), Math.min(b, 42.1));
  const f1 = s5((t - 41.4) / 1.6), f2 = s5((t - 42.6) / 2.4);
  const n0 = wp(lerp(px, 448, ss((t - 40.9) / .6) * .5 + f1 * .5), lerp(py, 340, f1));
  const p0 = n0.clone().add(V(-.02, lerp(.14, .25, f1), lerp(.1, .2, f1)));
  const pos = p0.clone().lerp(V(.3, .5, .58), f2), at = n0.clone().lerp(V(-.08, .0, -.05), f2);
  return look(pos, at, lerp(lerp(24, 30, f1), 42, f2), lerp(1.2, .35, f1 + f2), at);
}

// ---------- text reporting (readcheck)
const BLK = Object.fromEntries(D.blocks.map(b => [b.id, b]));
const READ = { 4: ['c1_cn', 'c1_en', 'c1_alt', 'c2_cn', 'c2_en', 'c2_alt', 'c3_cn', 'c3_en', 'c3_alt', 'peak_cn', 'peak_en'],
  6: ['title_cn', 'title_en', 'in_cn', 'in_en', 'row2020_y', 'row2020', 'row2020_cn', 'row2020_en', 'row1975_y', 'row1975', 'row2005_y', 'row2005', 'row2005_cn', 'row2005_en'],
  7: ['number', 'cap_cn', 'cap_en'] };
const blockDone = (b, n) => { const last = b.s1 - 1; return preSet.has(last) || kOf[last] < n; };
const proj = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
let LAST = { t: 0, n: 0 };
function texts() {
  const t = LAST.t, sh = shotAt(t), out = [];
  if (sh === 8) { for (const e of D.end) { const r = endReveal(t, e); if (r >= 1) out.push({ id: e.id, text: e.text, x0: e.bbox[0] * W / 1920, y0: e.bbox[1] * H / 1080, x1: e.bbox[2] * W / 1920, y1: e.bbox[3] * H / 1080 }); } return out; }
  for (const id of READ[sh] || []) {
    const b = BLK[id]; if (!b || !blockDone(b, LAST.n)) continue;
    const [x0, y0, x1, y1] = b.bbox, c = [proj(wp(x0, y0)), proj(wp(x1, y0)), proj(wp(x0, y1)), proj(wp(x1, y1))];
    const bx0 = Math.min(...c.map(q => q[0])), bx1 = Math.max(...c.map(q => q[0])), by0 = Math.min(...c.map(q => q[1])), by1 = Math.max(...c.map(q => q[1]));
    if (by1 - by0 < (sh === 7 ? 7 : 12)) continue;
    if (sh === 7 && id.startsWith('cap') && t < 41.7) continue;   // glimpsed at the edge while the pen writes; read once the camera pulls back
    out.push({ id, text: b.text, x0: bx0, y0: by0, x1: bx1, y1: by1 });
  }
  return out;
}
window.TEXTS = () => texts();

// ---------- end card: the title plotted in paper-coloured line on the dark
const ENDT = [46.15, 46.32, 46.44, 46.55, 46.66];
const endLen = D.end.map(e => e.strokes.reduce((a, p) => { for (let j = 2; j < p.length; j += 2) a += Math.hypot(p[j] - p[j - 2], p[j + 1] - p[j - 1]); return a; }, 0));
function endReveal(t, e) { const i = D.end.indexOf(e); return clamp((t - ENDT[i]) / (i === 0 ? .4 : .24)); }
function drawEnd(t) {
  og.clearRect(0, 0, W, H);
  if (t < CUT.end) return;
  const s = W / 1920; og.fillStyle = '#0c0a08'; og.fillRect(0, 0, W, H);
  og.save(); og.scale(s, s); og.lineCap = 'round'; og.lineJoin = 'round';
  D.end.forEach((e, i) => {
    const r = endReveal(t, e); if (r <= 0) return; let budget = r * endLen[i];
    og.strokeStyle = i === 0 ? '#e8473a' : '#efe7d6'; og.lineWidth = i === 0 ? 4.2 : 2.4;
    for (const p of e.strokes) { if (budget <= 0) break; og.beginPath(); og.moveTo(p[0], p[1]);
      for (let j = 2; j < p.length; j += 2) { const l = Math.hypot(p[j] - p[j - 2], p[j + 1] - p[j - 1]); if (budget < l) { const f = budget / l; og.lineTo(p[j - 2] + (p[j] - p[j - 2]) * f, p[j - 1] + (p[j + 1] - p[j - 1]) * f); budget = 0; break; } og.lineTo(p[j], p[j + 1]); budget -= l; }
      og.stroke(); }
  });
  og.globalAlpha = clamp((t - 46.9) / .3) * .5; og.fillStyle = '#efe7d6'; for (let k = 0; k < 56; k++) og.fillRect(156 + k * 12, 818, 7, 2);
  og.restore();
}

// ---------- render
window.render = t => {
  t = clamp(t, 0, DUR);
  const sh = shotAt(t), P = warp(t), st = plotState(G, P);
  LAST = { t, n: st.n };
  drawEnd(t);
  if (sh === 8) { renderer.domElement.style.visibility = 'hidden'; return; }
  renderer.domElement.style.visibility = 'visible';
  base.update(st, true);
  const pkey = sh === 4 ? (t < 19.7 ? 4 : 41) : sh;
  for (const [k, p] of Object.entries(patches)) { const on = String(pkey) === k; p.mesh.visible = on; if (on) p.update(st, true); }
  // machine
  const z = st.z / 1000, px = st.x, py = st.y;
  const pw = wp(px, py);
  beam.position.z = pw.z - PEN_DZ; car.position.x = pw.x; holder.position.y = z; buildChain(pw.x);
  const g = st.grip; jaws[0].position.x = -.0066 - .004 * (1 - g); jaws[1].position.x = .0066 + .004 * (1 - g);
  pens.forEach((pn, k) => {
    if (k === st.held) pn.position.set(pw.x, z, pw.z);   // in the gripper (at a stall the holder is exactly over the cup)
    else { const r = wp(...RACK(k)); pn.position.set(r.x, 0, r.z); }
  });
  // relief
  let anyLift = false;
  for (const L of LIFT) { const f = sh === 3 ? liftAt(t, L.lv) : 0; L.line.visible = f > .002; if (f <= .002) continue; anyLift = true; L.line.scale.y = f; }
  liftGroup.visible = anyLift;
  led.material.color.setHex(st.down ? 0x7cff9a : 0x2f6f40);
  const cam = cameraAt(t);
  camera.position.copy(cam.pos); camera.fov = cam.fov; camera.up.set(0, 1, 0);
  if (cam.roll) camera.up.set(Math.sin(cam.roll), Math.cos(cam.roll), 0);
  camera.lookAt(cam.look); camera.updateProjectionMatrix();
  post.dof.aper = cam.aper; post.dof.maxCoc = 14; post.dof.focus = camera.position.distanceTo(cam.focus);
  post.composer.render();
  base.restore(); for (const p of Object.values(patches)) p.restore();
};
window.READY = true;
