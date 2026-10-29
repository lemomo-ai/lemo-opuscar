// The Butterfly (《蝴蝶》): first person, the camera is her. She wakes on a hillside -> flies over the wheat and the village -> lands on
// one flower in her husband's garden. What she is stays unseen until the last shot cuts to his eyes: a butterfly on that flower
// flies away, and the page prints what he says. The clues (chrysanthemums before a stone, her straw hat by the door, a photo on
// the windowsill) are only passed: no stop, no push-in, no pointing.
// 3D only computes shapes (engine/npr.js); every drawing is made on the spot by engine/crayon.js, a new one 12 times a second.
import * as THREE from 'three';
import { makeComp } from './engine/gl.js';
import * as C from './engine/crayon.js';
import { makeNPR, snap, shapes, silhouette, region, mesh, REG, REGM, RW, RH } from './engine/npr.js';
import { clamp, lerp, seg, eo, eio, hash } from '/core/lib.js';

export const DUR = 64.5;   // the theme's first half (bars 19-22) + second half (23-26, recorder and music box together) + the music box running down

// The crayon box: 12 crayons (a village garden)
const P = { line: '#2c2f6b', sky: '#8cc3e8', white: '#ffffff', grass: '#6cb24a', olive: '#8a8f3a', lemon: '#f2d43a', caramel: '#d9932f', earth: '#8a5a35', brick: '#c8452f', rose: '#ec8a9a', cream: '#f4c49a', plum: '#8a4f8c' };
const PAPER = [0.957, 0.937, 0.890];

// ───────── regions (one drawing recipe each)
const R = {
  sky: region({ col: P.sky, p: .45, ang: .12, gap: 14, w: 14, ow: 0, cross: 1 }),
  cloud: region({ col: P.white, p: 0, nofill: 1, ow: 7 }),
  ground: region({ col: P.grass, p: .5, ang: .08, gap: 13, w: 13, ow: 0 }),
  hill: region({ col: P.grass, p: .72, ang: .2, gap: 11, w: 13, ow: 8, shade: 1 }),
  far: region({ col: P.olive, p: .6, ang: .3, gap: 12, w: 13, ow: 7 }),
  path: region({ col: P.caramel, p: .5, ang: .05, gap: 11, w: 12, ow: 6 }),
  wheat: region({ col: P.lemon, p: .8, ang: 1.35, gap: 9, w: 11, ow: 7, shade: 1 }),
  wild: region({ col: P.rose, p: .9, ang: .5, gap: 5, w: 7, ow: 4 }),
  wild2: region({ col: P.lemon, p: .95, ang: .5, gap: 5, w: 7, ow: 4 }),
  wild3: region({ col: P.white, p: 0, nofill: 1, ow: 4 }),
  stem: region({ col: P.olive, p: .95, ang: 1.5, gap: 4, w: 6, ow: 0 }),
  stone: region({ col: P.white, p: 0, nofill: 1, ow: 8 }),
  mum: region({ col: P.lemon, p: .95, ang: .7, gap: 5, w: 7, ow: 5 }),
  mum2: region({ col: P.white, p: 0, nofill: 1, ow: 5 }),
  wall: region({ col: P.white, p: .3, ang: 1.45, gap: 11, w: 12, ow: 8, shade: 1 }),
  roof: region({ col: P.brick, p: .85, ang: .55, gap: 9, w: 11, ow: 8, shade: 1 }),
  door: region({ col: P.earth, p: .9, ang: 1.5, gap: 8, w: 10, ow: 7 }),
  hole: region({ col: P.line, p: .85, ang: .6, gap: 7, w: 9, ow: 7 }),
  win: region({ col: P.sky, p: .75, ang: .8, gap: 8, w: 10, ow: 7 }),
  trunk: region({ col: P.earth, p: .9, ang: 1.5, gap: 8, w: 10, ow: 8 }),
  crown: region({ col: P.olive, p: .82, ang: .9, gap: 10, w: 12, ow: 8, shade: 1 }),
  crown2: region({ col: P.grass, p: .8, ang: .7, gap: 10, w: 12, ow: 8, shade: 1 }),
  wood: region({ col: P.earth, p: .85, ang: .3, gap: 7, w: 9, ow: 6 }),
  rope: region({ col: P.line, p: .9, ang: 0, gap: 4, w: 5, ow: 3 }),
  cloth1: region({ col: P.rose, p: .85, ang: .6, gap: 7, w: 9, ow: 6 }),
  cloth2: region({ col: P.sky, p: .85, ang: -.5, gap: 7, w: 9, ow: 6 }),
  cloth3: region({ col: P.lemon, p: .9, ang: .9, gap: 7, w: 9, ow: 6 }),
  yard: region({ col: P.caramel, p: .42, ang: .1, gap: 12, w: 13, ow: 6 }),
  bed: region({ col: P.earth, p: .7, ang: .15, gap: 9, w: 11, ow: 6 }),
  fence: region({ col: P.earth, p: .8, ang: 1.5, gap: 6, w: 8, ow: 6 }),
  leaf: region({ col: P.grass, p: .9, ang: .8, gap: 6, w: 8, ow: 5 }),
  petal: region({ col: P.rose, p: .92, ang: .5, gap: 6, w: 8, ow: 6, shade: 1 }),
  petal2: region({ col: P.rose, p: .8, ang: -.4, gap: 6, w: 8, ow: 6, shade: 1 }),
  heart: region({ col: P.lemon, p: .95, ang: .3, gap: 4, w: 6, ow: 5 }),
  hat: region({ col: P.lemon, p: .7, ang: .2, gap: 7, w: 9, ow: 6, shade: 1 }),
  band: region({ col: P.rose, p: .9, ang: .2, gap: 4, w: 6, ow: 5 }),
  photo: region({ col: P.cream, p: .6, ang: .4, gap: 4, w: 6, ow: 5 }),
  // him (ch group)
  shirt: region({ col: P.white, p: .35, ang: .7, gap: 8, w: 10, ow: 10, grp: 'ch', shade: 1 }),
  pants: region({ col: P.line, p: .62, ang: .3, gap: 7, w: 9, ow: 10, grp: 'ch', shade: 1 }),
  shoe: region({ col: P.earth, p: .9, ang: .4, gap: 6, w: 8, ow: 9, grp: 'ch' }),
  skin: region({ col: P.cream, p: .72, ang: .5, gap: 7, w: 9, ow: 10, grp: 'ch' }),
  hair: region({ col: P.white, p: .2, ang: 1.0, gap: 7, w: 9, ow: 9, grp: 'ch' }),
  ladle: region({ col: P.caramel, p: .9, ang: .5, gap: 6, w: 8, ow: 8, grp: 'ch', shade: 1 }),
  tin: region({ col: P.sky, p: .55, ang: 1.4, gap: 7, w: 9, ow: 8, grp: 'ch', shade: 1 }),
  // nearest the camera: the flowers she wakes and lands on (fg group)
  petalF: region({ col: P.rose, p: .92, ang: .5, gap: 8, w: 10, ow: 9, grp: 'fg', shade: 1 }),
  petalF2: region({ col: P.rose, p: .8, ang: -.4, gap: 8, w: 10, ow: 9, grp: 'fg', shade: 1 }),
  heartF: region({ col: P.lemon, p: .95, ang: .3, gap: 6, w: 8, ow: 8, grp: 'fg' }),
  // the butterfly (seen at last, through his eyes)
  wingA: region({ col: P.lemon, p: .92, ang: .9, gap: 6, w: 8, ow: 7, grp: 'fg', shade: 1 }),
  wingB: region({ col: P.lemon, p: .85, ang: -.6, gap: 6, w: 8, ow: 7, grp: 'fg', shade: 1 }),
  wingT: region({ col: P.earth, p: .95, ang: .3, gap: 5, w: 7, ow: 0, grp: 'fg' }),
  body: region({ col: P.line, p: .9, ang: 1.2, gap: 4, w: 6, ow: 5, grp: 'fg' }),
};

let comp, N, scene, cam, LY, man, fly, FLYPTS;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (a, b, h, n = 20) => new THREE.CylinderGeometry(a, b, h, n);
const sph = (r, ...a) => new THREE.SphereGeometry(r, 24, 16, ...a);
const put = (m, x, y, z, parent = scene) => { m.position.set(x, y, z); parent.add(m); return m; };
const grp = (x, y, z, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

// ───────── terrain: the hill (a squashed sphere) behind the village
const HC = [0, -28, 24], HR = 30, HK = 1.4;   // the slope ends near z = 9, short of the wheat, so the flight never passes inside it
const hillY = (x, z) => { const q = ((x - HC[0]) / HK) ** 2 + ((z - HC[2]) / HK) ** 2; return Math.max(0, HC[1] + HR * Math.sqrt(Math.max(0, 1 - q / (HR * HR)))); };
const F0 = [-2.2, 0, 24.4]; F0[1] = hillY(F0[0], F0[2]) + .24;   // the wild flower she wakes on (its head)
const START = [F0[0] - .17, F0[1] + .13, F0[2]];   // her: a little above and behind the flower head, facing +x
const STONE = [F0[0] + 2.9, 0, F0[2] - 1.85]; STONE[1] = hillY(STONE[0], STONE[2]);   // ahead and to the left: out of frame while she wakes, slides past on the left as she turns after take-off
// the garden: at the far end of the village
const GX = 2, GZ = -70;
const ROW = Array.from({ length: 13 }, (_, i) => GX - 3 + i * .5), HERS = 7;   // the row of flowers she planted; she lands on the 8th (just one of the row)
const FZ = GZ + 3, FH = .62;   // the row stands a little inside the fence, flower heads at 0.62

function gable(w, d, h, reg, parent) {   // gable roof: a triangular prism
  const r = put(mesh(new THREE.CylinderGeometry(1, 1, d, 3, 1), reg), 0, 0, 0, parent); r.rotation.x = Math.PI / 2; r.rotation.y = Math.PI / 2;
  r.scale.set(h / 1.5 * 1.0, 1, w / 1.732 * 1.04); return r;
}
function house(x, z, ry, w = 5, d = 3.6, h = 2.6, parent = scene) {   // white walls, red tiles: a child's house, gable front and one slanted side
  const g = grp(x, 0, z, parent); g.rotation.y = ry;
  put(mesh(box(w, h, d), R.wall), 0, h / 2, 0, g);
  const roof = grp(0, h + .55, 0, g); const r = put(mesh(new THREE.CylinderGeometry(1, 1, w + .5, 3, 1), R.roof), 0, 0, 0, roof);
  r.rotation.z = Math.PI / 2; r.rotation.x = -Math.PI / 2; r.scale.set(1.15, 1, d / 1.6);
  put(mesh(box(.9, 1.7, .06), R.door), -w * .18, .85, d / 2 + .02, g);
  for (const sx of [w * .22]) put(mesh(box(.8, .7, .06), R.win), sx, 1.5, d / 2 + .02, g);
  return g;
}
function tree(x, z, s = 1, reg = R.crown) {
  put(mesh(cyl(.16 * s, .22 * s, 2.6 * s, 10), R.trunk), x, 1.3 * s, z);
  for (const [dx, dy, dz, r] of [[0, 3.1, 0, 1.2], [-.8, 2.6, .2, .85], [.85, 2.7, -.1, .9], [.1, 3.9, -.2, .85]]) put(mesh(sph(r * s), reg), x + dx * s, dy * s, z + dz * s);
}
function flower(x, z, h, petalReg, heartReg, parent = scene, k = 1) {   // a child's flower: one stem, two leaves, five petals
  const g = grp(x, 0, z, parent);
  put(mesh(cyl(.012 * k, .014 * k, h, 6), R.stem), 0, h / 2, 0, g);
  for (const s of [-1, 1]) { const l = put(mesh(sph(.05 * k), R.leaf), s * .045 * k, h * .45 + s * .04, 0, g); l.scale.set(1.3, .45, .7); l.rotation.z = s * .5; }
  const head = grp(0, h, 0, g); head.rotation.x = -.35;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = put(mesh(sph(.052 * k), i % 2 ? petalReg + 1 : petalReg), Math.cos(a) * .06 * k, 0, Math.sin(a) * .06 * k, head); p.scale.set(1, .32, 1); }
  put(mesh(sph(.032 * k), heartReg), 0, .012 * k, 0, head).scale.set(1, .6, 1);
  return g;
}

function build() {
  FLYPTS = []; for (let t = WAKE; t < LAND; t += .25) FLYPTS.push(cr(FLY, t)[0]);
  scene = new THREE.Scene();
  put(mesh(sph(230), R.sky, THREE.BackSide), 0, 0, -20);
  for (const [x, y, z, k] of [[-40, 34, -150, 8], [30, 42, -170, 10], [70, 30, -110, 6], [-80, 40, -90, 7], [10, 50, -60, 6], [-20, 30, 90, 7], [40, 36, 70, 6]])
    { const cg = grp(x, y, z); (build.clouds ||= []).push([cg, x]); for (let i = 0; i < 4; i++) put(mesh(sph(k * (1 - .15 * (i % 2))), R.cloud), (i - 1.5) * k * 1.1, (i % 2) * k * .45, 0, cg); }
  put(mesh(box(500, .02, 500), R.ground), 0, -.01, -20);
  // far hills: a ring of squashed spheres
  for (const [x, z, r, h] of [[-90, -160, 50, 16], [-20, -190, 60, 22], [70, -170, 55, 18], [140, -120, 50, 14], [-150, -100, 45, 12]]) { const m = put(mesh(sph(1), R.far), x, -2, z); m.scale.set(r, h, r * .6); }
  // the hill
  const hm = put(mesh(new THREE.SphereGeometry(HR, 64, 32), R.hill), HC[0], HC[1], HC[2]); hm.scale.set(HK, 1, HK);
  // wild flowers on the slope (where she wakes)
  for (let i = 0; i < 700; i++) {
    const h = k => hash(i * 5.13 + k * 2.71 + .3);
    const rr = .35 + 9 * Math.pow(h(1), 1.15), aa = h(2) * 6.283, x = START[0] + Math.cos(aa) * rr * 1.3, z = START[2] + Math.sin(aa) * rr; if (Math.hypot(x - STONE[0], z - STONE[2]) < .7) continue;
    const y = hillY(x, z), near = Math.hypot(x - START[0], z - START[2]);
    if (near < .25) continue;
    const reg = [R.wild, R.wild2, R.wild3][Math.floor(h(3) * 3)], r = .04 + .05 * h(4), sh = .14 + .14 * h(5);
    const wg = grp(x, y, z); (build.wild ||= []).push([wg, h(6) * 6.28, .7 + .6 * h(7)]);
    put(mesh(cyl(.007, .007, sh, 4), R.stem), 0, sh / 2, 0, wg);
    put(mesh(sph(r), reg), 0, sh, 0, wg).scale.set(1, .45, 1);
  }
  build.start = flower(F0[0], F0[2], F0[1] - hillY(F0[0], F0[2]), R.petalF, R.heartF, grp(0, hillY(F0[0], F0[2]), 0), 1.3); build.start.position.set(F0[0], 0, F0[2]);
  // the stone and the chrysanthemums: passed, never stopped at
  const sg = grp(STONE[0], STONE[1], STONE[2]); sg.rotation.y = -.53;   // its face turned toward where she flies in from
  put(mesh(box(.4, .5, .12), R.stone), 0, .25, 0, sg); put(mesh(cyl(.2, .2, .12, 24), R.stone), 0, .5, 0, sg).rotation.x = Math.PI / 2;   // round top
  for (let i = 0; i < 11; i++) { const a = i * 2.4, r = .03 + .05 * (i / 11); put(mesh(sph(.055), i % 3 ? R.mum : R.mum2), Math.cos(a) * r, .06 + (i % 3) * .035, .17 + Math.sin(a) * r * .6, sg); }   // a bunch of chrysanthemums leaning on the stone
  // the path down the hill
  const pth = put(mesh(box(1.1, .02, 30), R.path), -.5, .01, 0); pth.rotation.y = .05;
  // wheat fields on both sides of the path
  for (const [x0, x1, z0, z1] of [[-30, -1.4, 8, -4], [.4, 26, 9, -3], [-26, -1.4, -5.5, -15], [.4, 30, -4.5, -16]]) {
    const w = x1 - x0, d = z0 - z1; put(mesh(box(w, .9, d), R.wheat), (x0 + x1) / 2, .45, (z0 + z1) / 2);
  }
  // the village: white walls, red tiles
  for (let i = 0; i < 16; i++) {
    const h = k => hash(i * 9.17 + k * 3.3 + .7);
    const x = (i % 2 ? 1 : -1) * (4 + 18 * h(1)), z = -20 - 38 * h(2);
    if (Math.abs(x - GX) < 9 && z < -58) continue;
    if (FLYPTS.some(([px, , pz]) => Math.hypot(px - x, pz - z) < 7)) continue;
    house(x, z, (h(3) - .5) * .7, 4 + 2 * h(4), 3.2 + h(5), 2.4 + .6 * h(6));
  }
  for (const [x, z, s, r] of [[-4.6, -32, 1.25, R.crown], [9, -24, .9, R.crown2], [-14, -42, 1, R.crown2], [13, -50, 1.1, R.crown], [-8, -58, .9, R.crown], [8, -62, .8, R.crown2]]) tree(x, z, s, r);
  // a bench under the big tree
  put(mesh(box(1.6, .08, .4), R.wood), -3.2, .45, -30.9); for (const s of [-1, 1]) put(mesh(box(.08, .45, .35), R.wood), -3.2 + s * .7, .22, -30.9);
  // a washing line
  for (const x of [2.5, 7.5]) put(mesh(cyl(.05, .05, 2.2, 6), R.wood), x, 1.1, -38);
  put(mesh(box(5, .025, .025), R.rope), 5, 2.0, -38);
  build.clothes = [[3.3, R.cloth1, .7, .9], [4.6, R.cloth2, .9, .6], [5.8, R.cloth3, .6, .75], [6.8, R.cloth1, .5, .5]].map(([x, reg, w, h]) => {
    const g = grp(x, 2.0, -38); put(mesh(box(w, h, .03), reg), 0, -h / 2, 0, g); return g;
  });
  buildGarden();
  buildMan();
  buildFly();
  cam = new THREE.PerspectiveCamera(56, 16 / 9, .008, 400); scene.add(cam);

}

// ───────── the garden: a low bamboo fence, the row of flowers she planted, the old house, her straw hat on a nail by the door, a photo of the two of them on the windowsill
function buildGarden() {
  put(mesh(box(13, .02, 11), R.yard), GX, .005, GZ - 1.5);
  put(mesh(box(7, .06, .5), R.bed), GX, .03, FZ);
  for (let x = GX - 6.4; x <= GX + 6.4; x += .26) put(mesh(box(.05, .75 + .08 * hash(x * 3.1), .05), R.fence), x, .38, GZ + 4);
  for (const y of [.25, .55]) put(mesh(box(12.9, .04, .04), R.fence), GX, y, GZ + 4);
  build.row = ROW.map((x, i) => i === HERS ? flower(x, FZ, FH, R.petalF, R.heartF) : flower(x, FZ + (hash(i) - .5) * .08, FH + (hash(i * 2.3) - .5) * .1, R.petal, R.heart));
  const h = house(GX + .5, GZ - 5.2, 0, 7, 4, 2.8);
  // the door stands open (a dark doorway)
  const dw = put(mesh(box(.86, 1.66, .02), R.hole), -7 * .18, .83, 2.035, h); dw.visible = true;
  // the straw hat on a nail by the door (flowered band)
  const hat = grp(-7 * .18 - .95, 1.75, 2.06, h); hat.rotation.x = Math.PI / 2 - .25;
  put(mesh(cyl(.26, .26, .015, 28), R.hat), 0, 0, 0, hat);
  put(mesh(sph(.13, 0, Math.PI * 2, 0, Math.PI / 2), R.hat), 0, .005, 0, hat);
  put(mesh(cyl(.133, .133, .035, 24), R.band), 0, .02, 0, hat);
  // the photo on the windowsill
  const ph = grp(7 * .22, 1.17, 2.07, h); put(mesh(box(.2, .26, .02), R.wood), 0, .13, 0, ph); put(mesh(box(.15, .2, .01), R.photo), 0, .13, .012, ph); ph.rotation.x = -.1;
  tree(GX - 5.2, GZ - 3, .85, R.crown2);
}

// ───────── him: a child's proportions for a grown-up; white shirt, dark trousers, white hair. A ladle in his right hand, a tin bucket in his left
function buildMan() {
  man = { g: grp(GX - 1.2, 0, FZ - 1.25) };
  const g = man.g;
  man.legs = [-1, 1].map(s => {
    const hip = grp(s * .1, .78, 0, g);
    put(mesh(cyl(.07, .065, .72), R.pants), 0, -.36, 0, hip);
    put(mesh(new THREE.CapsuleGeometry(.065, .13, 6, 12), R.shoe), 0, -.72, .05, hip).rotation.x = Math.PI / 2;
    return hip;
  });
  const up = man.up = grp(0, .78, 0, g);
  put(mesh(cyl(.21, .25, .6), R.shirt), 0, .32, 0, up);
  put(mesh(cyl(.05, .05, .12), R.skin), 0, .66, 0, up);
  const arm = (s) => {
    const sh = grp(s * .27, .56, 0, up);
    put(mesh(cyl(.075, .07, .2), R.shirt), 0, -.08, 0, sh);
    put(mesh(cyl(.048, .045, .4), R.skin), 0, -.33, 0, sh);
    put(mesh(sph(.06), R.skin), 0, -.55, 0, sh);
    return sh;
  };
  man.armR = arm(-1); man.armL = arm(1);   // he faces +z, so his right hand is on the -x side
  const la = man.ladle = grp(0, -.56, 0, man.armR);   // a long-handled water ladle: a bamboo handle reaching forward from the hand
  put(mesh(cyl(.016, .016, .86, 8), R.ladle), 0, -.43, 0, la);
  const bowl = grp(0, -.88, 0, la); man.bowl = bowl;
  put(mesh(sph(.09, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), R.ladle, THREE.DoubleSide), 0, 0, 0, bowl);
  // the tin bucket hangs from his left hand
  const bk = man.bucket = grp(0, -.6, 0, man.armL);
  put(mesh(cyl(.16, .13, .3, 20, 1, true), R.tin, THREE.DoubleSide), 0, -.2, 0, bk);
  put(mesh(new THREE.TorusGeometry(.15, .008, 6, 20, Math.PI), R.tin), 0, -.05, 0, bk).rotation.y = Math.PI / 2;
  const head = man.head = grp(0, .7, 0, up);
  put(mesh(sph(.19), R.skin), 0, .2, 0, head);
  const hair = put(mesh(sph(.2, 0, Math.PI * 2, 0, Math.PI * .4), R.hair), 0, .21, -.03, head); hair.rotation.x = -.45;
  for (const s of [-1, 1]) put(mesh(sph(.045), R.skin), s * .19, .19, 0, head).scale.set(.5, 1, 1);
}

const FLYK = 1.5, HISFOV = 27;   // his view: staring, so a narrower field of view
// ───────── the butterfly, seen only at the end through his eyes: a body, a forewing and a hindwing on each side, dark wing tips
function buildFly() {
  fly = { g: grp(0, 0, 0), side: [] }; fly.g.scale.setScalar(FLYK);   // bigger than a real one (a child's drawing)
  const shape = pts => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.scale(.36, 1, .36); return g; };
  const fore = shape([[0, .012], [.05, .05], [.13, .085], [.2, .09], [.235, .06], [.21, .015], [.13, -.02], [.04, -.02], [0, -.008]]);
  const tip = shape([[.15, .083], [.2, .09], [.235, .06], [.218, .028], [.175, .055]]);
  const hind = shape([[0, -.01], [.07, -.025], [.14, -.04], [.165, -.08], [.13, -.125], [.07, -.13], [.025, -.09], [0, -.04]]);
  const b = put(mesh(new THREE.CapsuleGeometry(.0045, .03, 4, 8), R.body), 0, 0, 0, fly.g); b.rotation.x = Math.PI / 2;
  for (const s of [1, -1]) {
    const g = grp(.003 * s, 0, 0, fly.g); g.scale.x = s;
    put(mesh(fore, R.wingA, THREE.DoubleSide), 0, .0006, 0, g);
    put(mesh(tip, R.wingT, THREE.DoubleSide), 0, .0014, 0, g);
    put(mesh(tip, R.wingT, THREE.DoubleSide), 0, -.0002, 0, g);
    put(mesh(hind, R.wingB, THREE.DoubleSide), 0, 0, 0, g);
    fly.side.push(g);
  }
}

export async function init() {
  comp = makeComp(document.getElementById('gl'));
  N = makeNPR();
  build();
  const L = () => C.layer();
  LY = { bg: [L(), L()], ch: [L(), L()], fg: [L(), L()], tx: L(), sil: document.createElement('canvas'), knock: L() };
  LY.sil.width = RW; LY.sil.height = RH;
  try { await document.fonts.load('120px "LongCang"', LINE); await document.fonts.load('60px "Patrick Hand"', LINE_EN); } catch (e) { }
}

// ───────── timeline
const BAR = 3 * 60 / 78;   // the score is 3/4 at 78 BPM (tools/score.py): take-off, the cut, the flight away and the words land on bar lines
const WAKE = 3 * BAR, OVER = 32.5, LAND = 34.2;
const CUT = 19 * BAR, UP = 20 * BAR, SAY = 23 * BAR;   // cut to his eyes; the butterfly takes off; his words
const LINE = '等我哦。', LINE_EN = 'Wait for me.';
// Her route: [time, position, look-at]. Waking and on the flower only the gaze moves (slow, few moves, holds longer than moves); the flight is one smooth curve
const ST = START, SY = START[1];
const FLY = [
  [WAKE, ST, [ST[0] + 8, SY - 1.0, ST[2] + 2.4]],
  [8.6, [ST[0] + .8, SY + .4, ST[2] + .15], [ST[0] + 6, SY - .6, ST[2] - .5]],
  [10.2, [ST[0] + 3.4, SY + .9, ST[2] - .8], [ST[0] + 6.4, SY - 1.2, ST[2] - 6.5]],   // the turn: the stone slides past on the left, the village swings in from the left
  [12.0, [2.2, SY + .6, 19.5], [-1, .4, 8]],                                                    // turned, facing the village below
  [14.6, [.6, 1.5, 12], [0, .5, 2]],
  [17.4, [-.3, 1.25, 2.5], [-.6, .6, -8]],                                                       // skimming the wheat
  [20.2, [-.8, 1.5, -8.5], [-1.5, 2.5, -20]],
  [23.0, [-1.6, 3.6, -21], [-3, 2.2, -30]],                                                     // over the roofs
  [25.6, [1.0, 3.4, -24.4], [-3.2, 1.1, -30.9]],                                                // the bench under the big tree, a little slower
  [28.2, [1.2, 3.9, -31.2], [5, 1.7, -38.5]],                                                    // the washing line (seen from six or seven metres)
  [30.6, [2.6, 3.6, -52], [GX, 1.5, GZ]],
  [OVER, [GX + .3, 1.5, GZ + 6.5], [GX + .5, .6, FZ]],                                          // the fence
  [LAND, [ROW[HERS], FH + .075, FZ + .07], [GX - 1.1, .62, FZ - .5]],
];
// After landing only the gaze moves. It looks at him, a moving target, so it follows with a lag (follow) instead of locking onto his face
const GAZE = () => {
  const f = man.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .1, 0));
  return [
    [LAND, [GX - 1.1, .62, FZ - .5]],   // he waters the first flowers, on the left
    [35.0, [GX - 1.1, .62, FZ - .5]],
    [37.9, [f.x, f.y - .15, f.z]],     // slowly up to him: he reaches this flower, looks down at it a while without pouring, waters the next ones, then looks back at it
    [CUT, [f.x, f.y - .15, f.z]],
  ];
};
// Follow: two-stage exponential smoothing, stepped from t0 up to t (recomputed from the start every frame, so frames can render in parallel and out of order)
function follow(target, t0, t, tau = .38) {
  const dt = 1 / 24, K = u => 1 - Math.exp(-dt / (typeof tau === 'function' ? tau(u) : tau));
  let a = target(t0).slice(), b = a.slice();
  for (let u = t0 + dt; u <= t + 1e-6; u += dt) { const T = target(u), k = K(u); a = a.map((v, i) => v + (T[i] - v) * k); b = b.map((v, i) => v + (a[i] - v) * k); }
  return b;
}
// The flower she lands on sways in the wind and she sways with it (the sway grows in over 1.5 s after landing)
const wind = t => .03 * Math.sin(t * 1.1) + .012 * Math.sin(t * 2.3 + 1);
const sway = t => wind(t) * clamp((t - LAND) / 1.5);
function flowerHead(t) {
  const fg = build.row[HERS]; fg.rotation.z = sway(t); fg.rotation.x = .4 * sway(t + 1.7);
  fg.updateMatrixWorld(true); return fg.children[3].getWorldPosition(new THREE.Vector3());
}
// The butterfly in his eyes: rests on the flower opening and closing slowly, takes off at UP, flies away toward the village and the hill
function flyAt(t) {
  const h = flowerHead(t).add(new THREE.Vector3(0, .045, 0)), u0 = Math.max(0, t - UP), u = u0 - 1.2 * (1 - Math.exp(-u0 / 1.2));   // take-off accelerates gently
  return [h.x + .55 * u + .3 * Math.sin(2.1 * u), h.y + 1.05 * u + .18 * Math.sin(3.3 * u) * Math.min(1, u), h.z + 2.4 * u * (1 + .08 * u)];
}
const camOnFlower = t => { const h = flowerHead(t); return [h.x, h.y + .075, h.z + .07]; };
function dirTarget(u) {   // where she looks: along the route in flight, at him after landing
  let p, l;
  if (u < LAND) [p, l] = cr(FLY, u);
  else { p = camOnFlower(u); manPose(u); man.g.updateMatrixWorld(true); l = ease(GAZE(), u); }
  const v = [l[0] - p[0], l[1] - p[1], l[2] - p[2]], k = 1 / Math.hypot(...v); return v.map(x => x * k);
}
const EYE = () => [ROW[9] + .27, 1.6, FZ - 1.6];   // his eyes: standing behind the 10th flower

function cr(keys, t) {   // time-based Hermite spline: position and look pass every key with continuous velocity; zero velocity at the first and last keys (take-off and landing start and end at rest)
  const n = keys.length; if (t <= keys[0][0]) return keys[0].slice(1); if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const t1 = keys[i][0], t2 = keys[i + 1][0], dt = t2 - t1, u = (t - t1) / dt;
  const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
  const m = (j, c, a) => (j <= 0 || j >= n - 1) ? 0 : (keys[j + 1][c][a] - keys[j - 1][c][a]) / (keys[j + 1][0] - keys[j - 1][0]);
  return [1, 2].map(c => [0, 1, 2].map(a => h00 * keys[i][c][a] + h10 * dt * m(i, c, a) + h01 * keys[i + 1][c][a] + h11 * dt * m(i + 1, c, a)));
}
function ease(keys, t) {   // gaze: segment by segment, easing in and out
  let L = keys[keys.length - 1][1];
  for (let i = 0; i < keys.length - 1; i++) { const [ta, a] = keys[i], [tb, b] = keys[i + 1]; if (t < tb) { const k = eio(seg(t, ta, tb)); L = a.map((v, j) => lerp(v, b[j], k)); break; } }
  return L;
}

// Him: watering down the row. [time, behind which flower, action]  actions: pour / hover (at her flower, no pouring) / look (done, looks back at it)
const WORK = [[0, 3, 'pour'], [36.2, 4, 'pour'], [37.4, 5, 'pour'], [38.4, HERS, 'hover'], [40.1, 8, 'pour'], [41.3, 9, 'pour'], [42.5, 9, 'look']];
const MZ = FZ - 1.6;   // he stands 1.6 m behind the row; the long ladle reaches over
function manPose(t) {
  const g = man.g; let w = WORK[0]; for (const k of WORK) if (t >= k[0]) w = k;
  const i = WORK.indexOf(w), prev = WORK[Math.max(0, i - 1)];
  const walk = clamp((t - w[0]) / .5), fromX = ROW[prev[1]] + .27, toX = ROW[w[1]] + .27;
  g.position.x = lerp(fromX, toX, eio(walk)); g.position.z = MZ; g.rotation.y = 0;
  const stepping = walk < 1 && fromX !== toX, st = Math.floor(t * 4) % 2;
  man.legs.forEach((h, j) => { h.rotation.x = stepping ? ((j === st) ? .3 : -.25) : 0; });
  man.up.rotation.x = .4; man.head.rotation.set(.3, 0, 0); man.armL.rotation.set(0, 0, -.12);
  const a = t - w[0]; let tilt = 0;   // how far the ladle tips forward (0 = mouth up)
  man.pouring = null;
  if (w[2] === 'pour') {   // reach, tip, the water falls
    man.armR.rotation.set(-1.55, 0, .08); tilt = a > .45 && a < 1.15 ? 1.1 : .15;
    if (tilt > 1) man.pouring = true;
  } else if (w[2] === 'hover') {   // at her flower the ladle comes back; he looks down at it a while and doesn't pour
    man.armR.rotation.set(-.7, 0, .1); tilt = 0;
    const k = eio(seg(a, .2, .9)); man.head.rotation.x = lerp(.3, .62, k); man.up.rotation.x = lerp(.4, .3, k);
  } else {   // done: he straightens up and looks back at that flower
    const k = eio(seg(a, .1, 1.0));
    man.armR.rotation.set(lerp(-1.55, -.35, eio(seg(a, 0, .5))), 0, .06);
    man.up.rotation.x = lerp(.4, .12, k); man.head.rotation.set(lerp(.3, .42, k), lerp(0, -.5, k), 0);
  }
  // the ladle keeps its mouth up whatever the arm does (tipping forward when pouring)
  g.updateMatrixWorld(true);
  const pq = man.bowl.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  man.bowl.quaternion.copy(pq.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, g.rotation.y, 0, 'YXZ'))));
}

function pose(t) {
  // washing on the line sways in the wind
  build.clothes.forEach((g, i) => { g.rotation.x = .18 * Math.sin(t * 2.1 + i * 1.3); });
  manPose(t);
  let pos, look;
  // wind: the wild flowers on the slope, the clouds
  for (const [g, ph, k] of build.wild) { g.rotation.z = .09 * k * Math.sin(t * 1.3 + ph); g.rotation.x = .05 * k * Math.sin(t * .9 + ph * 1.7); }
  for (const [g, x0] of build.clouds) { g.position.x = x0 + t * .35; g.visible = t < CUT; }   // in his eyes only a strip of sky is coloured; uncoloured cloud outlines on blank paper would look unfinished
  if (t < WAKE) {   // waking: the flower sways in the wind and she sways with it
    // the sway settles smoothly by take-off; camera = start + the head's offset from its rest position (exactly the start at rest, so take-off doesn't jump)
    const sf = build.start, r = 1 - eio(clamp((t - WAKE + 2.2) / 2.2)), head = () => { sf.updateMatrixWorld(true); return sf.children[3].getWorldPosition(new THREE.Vector3()); };
    sf.rotation.set(0, 0, 0); const h0 = head();
    sf.rotation.z = 1.6 * wind(t) * r; sf.rotation.x = .7 * wind(t + 1.7) * r; const h = head();
    pos = [ST[0] + h.x - h0.x, ST[1] + h.y - h0.y, ST[2] + h.z - h0.z];
    // gaze: the flowers in front, up to the slope below (a little right), then slowly round to where she will fly
    look = ease([[0, [ST[0] + 1.2, SY - .32, ST[2] + .3]], [.9, [ST[0] + 1.2, SY - .32, ST[2] + .3]], [3.6, [ST[0] + 6, SY - .7, ST[2] + 6]], [WAKE, [ST[0] + 8, SY - 1.0, ST[2] + 2.4]]], t);
  } else if (t < LAND) {
    pos = cr(FLY, t)[0];
    // the gaze lags too, so turns never snap. The direction is smoothed, not the look-at point (smoothing a near point whips the camera)
    const d = follow(dirTarget, WAKE, t, u => u < LAND ? .3 : .38);
    const fl = Math.sin(t * 5.3) * .035 + Math.sin(t * 2.2) * .05;   // a butterfly's bobbing flight
    pos = [pos[0], Math.max(pos[1] + fl * clamp((LAND - t) / 1.2) * clamp((t - WAKE) / .8), hillY(pos[0], pos[2]) + lerp(SY - hillY(ST[0], ST[2]), .45, eio((t - WAKE) / 1.6))), pos[2]];   // never into the hill (clearance eases from the flower height to .45, so take-off doesn't pop)
    look = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]];
  } else if (t < CUT) {   // on the flower: swaying with it, the gaze following him with a lag (the same follow as in flight, so the landing is continuous)
    pos = camOnFlower(t);
    const d = follow(dirTarget, WAKE, t, u => u < LAND ? .3 : .38);
    manPose(t); look = [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]];
  } else {   // his eyes: on that flower, a butterfly resting on it; it takes off and his gaze follows it up
    pos = EYE();
    look = follow(u => { const f = flyAt(u); return u < UP + .3 ? [f[0], f[1] - .05, f[2]] : f; }, CUT, t, .32);
  }
  cam.position.set(...pos); cam.lookAt(...look);
  // the butterfly exists only in his view; he himself is hidden
  const his = t >= CUT; man.g.visible = !his; fly.g.visible = his;
  const fov = his ? HISFOV : 56; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (his) {
    const f = flyAt(t); fly.g.position.set(...f); fly.g.rotation.set(0, .9, 0);   // side-on to him: the closed wings face him
    const a = t < UP ? lerp(.8, 1.45, (.5 + .5 * Math.sin((t - CUT) * 1.2 + .4)) ** 2) : [1.2, lerp(.5, -.35, clamp((t - UP) / .6))][Math.floor(t * 12) % 2];   // resting: slow open and close; flying: two drawings alternate (for the first .6 s the downstroke stays above level, clear of the petals)
    fly.side[0].rotation.z = a; fly.side[1].rotation.z = -a;
  }
}

// His face: projected from the 3D head, eyes dotted and mouth drawn in crayon; white eyebrows
function face(L, S) {
  const head = man.head; if (Math.abs(man.g.rotation.y) > .6) return;
  const pr = v => { const q = v.clone().applyMatrix4(head.matrixWorld).project(cam); return [(q.x * .5 + .5) * 1920, (.5 - q.y * .5) * 1080, q.z]; };
  const c = pr(new THREE.Vector3(0, .2, 0)), top = pr(new THREE.Vector3(0, .39, 0));
  const r = Math.hypot(top[0] - c[0], top[1] - c[1]); if (r < 5 || c[2] > 1) return;
  const e = (dx, dy) => pr(new THREE.Vector3(dx, .2 + dy, .18));
  const seen = ([x, y]) => { const i = Math.floor(y / 2) * RW + Math.floor(x / 2); return x >= 0 && y >= 0 && x < 1920 && y < 1080 && S.id[i] === R.skin; };
  for (const s of [-1, 1]) {
    const [x, y] = e(s * .068, .015); if (!seen([x, y])) continue;
    C.dab(L, x, y, r * .085, { col: P.line, p: .97, seed: 31 + s, gap: 3, w: 4 });
    const [bx, by] = e(s * .07, .07);
    C.line(L, [[bx - r * .1, by + r * .01], [bx + r * .1, by - r * .01]], { col: P.line, w: Math.max(3, r * .03), p: .6, seed: 71 + s, closed: false });
    const [cx, cy] = e(s * .11, -.05);
    C.dab(L, cx, cy, r * .1, { col: P.rose, p: .55, seed: 51 + s, sq: .7 });
  }
  const [mx, my] = e(0, -.075); if (!seen([mx, my])) return;
  C.line(L, C.ellipse(mx, my - r * .03, r * .08, r * .04, 12, .4, Math.PI - .4), { col: P.line, w: Math.max(3, r * .03), p: .9, seed: 61 });
}

function farFly(L, t) {
  if (!fly.g.visible) return;
  const P3 = new THREE.Vector3(...flyAt(t)).project(cam); if (P3.z > 1) return;
  const x = (P3.x * .5 + .5) * 1920, y = (.5 - P3.y * .5) * 1080;
  const d = cam.position.distanceTo(fly.g.position), span = .085 * FLYK / d / Math.tan(cam.fov / 2 * Math.PI / 180) * 540;
  if (span > 34) return;   // still big enough for the 3D model to draw
  if (d > 55) { fly.g.visible = false; return; }   // gone
  fly.g.visible = false;
  const up = Math.floor(t * 12) % 2 === 0, r = Math.max(9, span * .45);
  for (const s of [-1, 1]) {
    const cx = x + s * r * .9, cy = y + (up ? -r * .5 : r * .25);
    C.dab(L, cx, cy, r, { col: P.lemon, p: .95, seed: 990 + s, gap: 3, w: 4, sq: up ? 1.2 : .7 });
    C.line(L, C.ellipse(cx, cy, r, r * (up ? 1.2 : .7), 14), { col: P.line, w: Math.max(3, r * .35), p: .9, seed: 995 + s, closed: true });
  }
}

// His words: printed on the page in a handwriting face, written in one character at a time on the blank paper between the sky and
// the roofs, to the right (the butterfly fades out near the centre of the frame and must stay clear). The English line follows, smaller.
const WX = 1450, WY = 520, EN_AT = SAY + 1.4, EN_Y = 628;
function words(t) {
  const k = clamp((t - SAY) / 1.1); if (k <= 0) return false;
  C.clear(LY.tx); C.text(LY.tx, LINE, WX, WY, { font: 'LongCang', size: 132, col: P.line, reveal: Math.floor(k * 12) / 12, seed: 5 });
  const e = clamp((t - EN_AT) / .9); if (e > 0) C.text(LY.tx, LINE_EN, WX, EN_Y, { font: 'Patrick Hand', size: 58, col: P.line, reveal: Math.floor(e * 12) / 12, seed: 9 });
  return true;
}
// Reading check (core/render/readcheck.mjs): the full text and its box from the frame each line starts to be written
export function texts(t) {
  const out = [];
  if (t >= SAY) out.push({ id: 'zh', text: LINE, x0: WX - 270, y0: WY - 120, x1: WX + 270, y1: WY + 30 });
  if (t >= EN_AT) out.push({ id: 'en', text: LINE_EN, x0: WX - 170, y0: EN_Y - 50, x1: WX + 170, y1: EN_Y + 16 });
  return out;
}
// The sky in his eyes: only a strip along the top is coloured, its lower edge ragged; below it the paper stays blank for the words
const SKYBAND = Array.from({ length: 25 }, (_, i) => [i * 80, 330 + 26 * Math.sin(i * 1.7) + 14 * Math.sin(i * 4.1)]);

// Water: a few blue crayon lines from the ladle's lip to the roots
function water(L, t) {
  if (!man.pouring) return;
  const lip = man.bowl.localToWorld(new THREE.Vector3(0, 0, .09)), P3 = new THREE.Vector3();
  const pr = (x, y, z) => { P3.set(x, y, z).project(cam); return P3.z < 1 ? [(P3.x * .5 + .5) * 1920, (.5 - P3.y * .5) * 1080] : null; };
  for (let i = 0; i < 4; i++) {
    const ph = ((t * 3 + i / 4) % 1), y0 = lip.y - ph * .25, y1 = Math.max(.05, y0 - .22);
    const dx = (i - 1.5) * .012, a = pr(lip.x + dx, y0, lip.z), b = pr(lip.x + dx * 1.6, y1, lip.z + .02);
    if (a && b) C.line(L, [a, b], { col: P.sky, w: 6, p: .95, seed: 900 + i, closed: false });
  }
}

const _v = new THREE.Vector3();
function anc(r) { const m = REGM[r]?.[0]; if (!m) return undefined; m.getWorldPosition(_v).project(cam); return [(_v.x * .5 + .5) * 1920, (.5 - _v.y * .5) * 1080]; }
function openLines(rings) {   // no outline along the frame edge
  const out = [];
  for (const r of rings) {
    let cur = []; const on = ([x, y]) => x > 3 && x < 1917 && y > 3 && y < 1077;
    for (const p of r) { if (on(p)) cur.push(p); else { if (cur.length > 3) out.push(cur); cur = []; } }
    if (cur.length > 3) out.push(cur);
    if (out.length && r.every(on)) { out.pop(); out.push([...r, r[0]]); }
  }
  return out;
}

export function frame(t) {
  const step = Math.floor(t * 12 + 1e-6), tq = step / 12;   // 12 drawings a second
  C.BOIL.step = step; C.BOIL.amp = 0;
  pose(tq);
  scene.updateMatrixWorld(true);
  const S = snap(N, scene, cam), SH = shapes(S);
  for (const k of ['bg', 'ch', 'fg']) LY[k].forEach(C.clear);
  const order = Object.keys(SH).map(Number).sort((a, b) => SH[b].n - SH[a].n);
  for (const r of order) {
    const g = REG[r], s = SH[r]; if (!g || !s.rings.length) continue;
    const [F, Ln] = LY[g.grp];
    const p = g.p * (1.05 - .25 * s.shade), anchor = anc(r);
    const band = r === R.sky && tq >= CUT;
    const sky = q => C.fill(F, s.rings, { col: g.col, p: p * q, ang: g.ang, gap: g.gap, w: g.w, over: g.over, seed: r * 7.3, anchor, hand: 1, cross: g.cross, crossP: .55 });
    const clipBand = below => { F.g.save(); F.g.beginPath(); F.g.moveTo(0, below ? 1080 : 0); SKYBAND.forEach(([x, y]) => F.g.lineTo(x, y)); F.g.lineTo(1920, below ? 1080 : 0); F.g.closePath(); F.g.clip(); };
    if (band) {   // in the two seconds before the words the lower sky's crayon thins out to blank paper (blank from the start would read as a mistake)
      clipBand(false); sky(1); F.g.restore();
      const fade = 1 - eio(clamp((tq - SAY + 2) / 1.7)); if (fade > .02) { clipBand(true); sky(fade); F.g.restore(); }
    } else if (!g.nofill) sky(1);
    if (s.dark.length) C.fill(F, s.dark, { col: g.col, p: Math.min(1, g.p + .15), ang: g.ang + 1.1, gap: g.gap * .8, w: g.w * .9, over: 3, seed: r * 7.3 + 50, anchor });
    if (g.ow) openLines(s.rings).forEach((l, i) => C.line(Ln, l, { col: P.line, w: g.ow, p: .92, seed: r * 13 + i, closed: false, taper: .08 }));
  }
  face(LY.ch[1], S);
  water(LY.ch[1], tq);
  farFly(LY.fg[1], tq);
  comp.paperCam(0, 0, 1);
  comp.begin(PAPER, [0, 0]);
  const knock = regs => { const g = LY.knock.g; C.clear(LY.knock); g.imageSmoothingEnabled = true; g.drawImage(silhouette(S, regs, LY.sil), 0, 0, 1920, 1080); comp.knock(LY.knock.c, PAPER, [0, 0]); };
  const grpRegs = k => new Set(REG.filter(g => g && g.grp === k).map(g => g.id));
  comp.crayon(LY.bg[0].c, { goff: [0, 0] }); comp.crayon(LY.bg[1].c, { goff: [0, 0] });
  knock(grpRegs('ch')); comp.crayon(LY.ch[0].c, { goff: [0, 0] }); comp.crayon(LY.ch[1].c, { goff: [0, 0] });
  knock(grpRegs('fg')); comp.crayon(LY.fg[0].c, { goff: [0, 0] }); comp.crayon(LY.fg[1].c, { goff: [0, 0] });
  if (words(tq)) comp.crayon(LY.tx.c, { goff: [0, 0] });
  comp.finish({ vig: .28, emb: .55, poff: [0, 0] });
}
