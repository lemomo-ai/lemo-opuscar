// 叮之前 / Before the Ding — the Lemo-Opuscar library demo of Tabletop App Flythrough. One take over a dotted paper mat on a light oak desk.
// You send a friend a cat photo. It doesn't fly straight there: it is shrunk (step 1), parked on the chat app's server (stop 2),
// the server sends a notification (step 3), and only then does the friend's phone fetch it (blurry first on a slow connection).
// The voice-over clock is in vo.js; every action below is cued to its words.
import * as THREE from 'three';
import { card, dotPatch, pill, rbox } from './world.js';
import { makeMonster } from './voxel.js';
import * as K from './cards.js';
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, V, arc, pop, beatBounce, squash, hops } from './anim.js';
import { VO, DUR as VDUR, CREDIT_T } from './vo.js';

export const DUR = VDUR;
export const END = { credit: VDUR - 2.95 };   // the sign-off lands after the closing title has dropped
export { VO };
const C = K.COL, TOP = .005, YAX = V(0, 1, 0);

// ── timeline (film seconds; cued to the words of the voice-over) ──
export const T = {
  catPop: 1.0, send: 2.0, ding0: 2.25, rewind: 5.3, straight: [4.9, 5.6], cross: 5.75, route: [6.0, 7.2], straightOut: [7.3, 7.8],
  jump1: [8.25, 8.75], badge1: 9.2, press: 10.5, counter: [11.0, 14.6], compare: 15.6,
  hopsS: [[17.3, 17.75], [17.9, 18.4], [18.6, 19.4]], badge2: 19.0, drawerOut: 22.7, catIn: [23.1, 23.5], drawerIn: [23.6, 24.0], lit: 24.1,
  bellRise: 26.4, badge3: 26.5, bellFly: [28.3, 29.0], taps: [29.05, 29.3], banner: 30.6, ring: 33.5, bellGone: 35.0,
  notif: 35.2, fetch: [36.2, 37.3], drawerOut2: [37.3, 37.6], hopsB: [[37.65, 38.15], [38.25, 38.75], [38.85, 39.45]],
  weak: 40.2, blur: 40.3, intoBubble: [42.85, 43.2], sharp: 43.3,
  routeLit: [46.2, 47.8], tag300: VO[12].t1 - 1.7, album: VO[13].t0 + .2, tag42: VO[13].t0 + .86, finale: CREDIT_T,
};
// every Chinese glyph the page draws (font subset + loading)
export const GLYPHS = '叮之前你给朋友发了张猫的一声对面马上就收到可这照片并没有直接飞过去按下送那刻第步是压小原图太大传得慢软件会先把它悄悄缩体积看着却差不多接来二站服务器也聊天云端中转存放在儿等取三才轮通知拍手机嘿有找时候响后真正回所以网瞬间变清楚背其实场无接力只版而一直都里小林相册新输入消息干嘛早给看我家刚拍';

// ── the desk ──
export const MAT = [3.0, 1.8];
export const CARDS = {
  phoneA: { c: V(-.95, 0, .12), w: .30, h: .56, yaw: .05 },
  compress: { c: V(-.38, 0, -.36), w: .46, h: .32, yaw: -.04 },
  phoneB: { c: V(.88, 0, .12), w: .30, h: .56, yaw: -.05 },
};
export const at = (n, u, v, y = TOP) => { const d = CARDS[n]; return V(u / 1000 - d.w / 2, y, v / 1000 - d.h / 2).applyAxisAngle(YAX, d.yaw).add(d.c); };
const onPaper = p => V(p.x, 0, p.z);
const SERVER = { c: V(.22, 0, -.42), yaw: .08, w: .32, d: .24, slab: .05, step: .056 };
const SRV_TOP = 4 * SERVER.step - .006;
const srvAt = (x, y, z) => V(x, y, z).applyAxisAngle(YAX, SERVER.yaw).add(SERVER.c);

// ── pixel art: the cat photo (16×16 with a white border) and its compressed copy (2×2 blocks → 8×8), the bell ──
const CAT = [
  'WWWWWWWWWWWWWWWW', 'WBBBBBBBBBBBBBBW', 'WBBOBBBBBBBBOBBW', 'WBBOOBBBBBBOOBBW', 'WBBOOOOOOOOOOBBW', 'WBOOOOOOOOOOOOBW',
  'WBOOKKOOOOKKOOBW', 'WBOOKKOOOOKKOOBW', 'WBOOOOOPPOOOOOBW', 'WBOOMMMMMMMMOOBW', 'WBBOOMMMMMMOOBBW', 'WBBBOOOOOOOOBBBW',
  'WGGGGOOOOOOGGGGW', 'WGGGGGGGGGGGGGGW', 'WWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWW'];
const PAL = { W: '#fbfcff', B: '#bcd3f2', O: '#f0913a', K: '#0d0d0d', P: '#f2a3b3', M: '#fff3e2', G: '#8cc77a' };
const SMALL = []; for (let j = 0; j < 16; j += 2) { let r = ''; for (let i = 0; i < 16; i += 2) { const b = [CAT[j][i], CAT[j][i + 1], CAT[j + 1][i], CAT[j + 1][i + 1]]; if (b.includes('K')) r += 'K'; else { const n = {}; b.forEach(c => n[c] = (n[c] || 0) + 1); r += Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]; } } SMALL.push(r); }
const toArt = (rows, pal) => { const cells = []; rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') cells.push([i, j, pal[ch]]); })); return { w: rows[0].length, h: rows.length, cells }; };
const BELL = ['....y....', '...YYY...', '..YYYYY..', '..YYYYY..', '.YYYYYYY.', '.YYYYYYY.', 'YYYYYYYYY', '....D....'];
const CROSS = ['G...G', '.G.G.', '..G..', '.G.G.', 'G...G'];
// print a pixel grid onto a canvas (optionally blurred)
function pix(c, rows, x, y, s, blur = 0) { c.save(); if (blur) c.filter = `blur(${blur}px)`; rows.forEach((r, j) => [...r].forEach((ch, i) => { c.fillStyle = PAL[ch]; c.fillRect(x + i * s, y + j * s, s + .6, s + .6); })); c.restore(); }

// ── phone screens (300 × 560 canvas px; the top of the screen points away from the camera) ──
function phone(c, st, me) {
  const w = 300, h = 560, other = me === 'A' ? '小林' : '你';
  c.clearRect(0, 0, w, h);
  c.fillStyle = C.ink; K.rr(c, 0, 0, w, h, 36); c.fill();
  c.fillStyle = '#f6f8fc'; K.rr(c, 11, 11, w - 22, h - 22, 27); c.fill();
  c.fillStyle = C.ink; K.rr(c, w / 2 - 36, 20, 72, 14, 7); c.fill();
  // status bar: time, signal, battery
  K.txt(c, '08:30', 30, 30, { size: 17, wt: 600 });
  const bars = st.weak ? 1 : 4; for (let i = 0; i < 4; i++) { c.fillStyle = i < bars ? (st.weak ? C.red : C.ink) : '#c9cfdb'; c.fillRect(214 + i * 7, 36 - (i + 1) * 4, 5, (i + 1) * 4); }
  c.strokeStyle = C.ink; c.lineWidth = 2; K.rr(c, 246, 24, 26, 13, 3); c.stroke(); c.fillStyle = C.ink; c.fillRect(249, 27, 18, 7);
  if (st.album) {
    K.txt(c, '相册', 30, 78, { size: 28, wt: 800, font: K.CJK });
    pix(c, CAT, 30, 108, 15);
    for (let i = 0; i < 3; i++) { c.fillStyle = ['#dfe6f2', '#efe3d2', '#dbe9dd'][i]; K.rr(c, 30 + i * 82, 368, 74, 74, 8); c.fill(); }
    for (let i = 0; i < 3; i++) { c.fillStyle = ['#e9e3f0', '#dfeaf2', '#f1e6dc'][i]; K.rr(c, 30 + i * 82, 450, 74, 74, 8); c.fill(); }
    return;
  }
  // header: back arrow, avatar, name
  K.txt(c, '‹', 26, 76, { size: 34, wt: 600, col: C.accent });
  c.fillStyle = me === 'A' ? '#f2c14e' : '#7aa2ff'; c.beginPath(); c.arc(70, 76, 17, 0, 7); c.fill();
  K.txt(c, other, 98, 77, { size: 26, wt: 800, font: K.CJK });
  c.fillStyle = C.line; c.fillRect(20, 104, w - 40, 2);
  // bubbles: an earlier exchange, then the photo
  const bub = (txt, mine, y) => { c.font = `700 22px ${K.CJK}`; const tw = c.measureText(txt).width + 28; const x = mine ? w - 24 - tw : 24; c.fillStyle = mine ? C.accent : '#e5e9f2'; K.rr(c, x, y, tw, 42, 16); c.fill(); K.txt(c, txt, x + 14, y + 22, { size: 22, wt: 700, font: K.CJK, col: mine ? '#fff' : C.ink }); };
  bub('早，在干嘛？', me === 'B', 124);
  bub('给你看我家猫', me === 'A', 178);
  if (st.img) {   // the photo bubble: mine on the right (A), theirs on the left (B)
    const mine = me === 'A', s = mine ? 8.5 : 17, rows = mine ? CAT : SMALL, size = rows.length * s, x = mine ? w - 30 - size : 30, y = 236;
    c.fillStyle = mine ? C.accent : '#e5e9f2'; K.rr(c, x - 8, y - 8, size + 16, size + 16, 16); c.fill();
    if (st.img === 'loading') { c.fillStyle = '#d3d9e6'; c.fillRect(x, y, size, size); c.strokeStyle = C.accent; c.lineWidth = 6; c.beginPath(); c.arc(x + size / 2, y + size / 2, 22, -1.57, -1.57 + 6.28 * (st.load || 0)); c.stroke(); }
    else pix(c, rows, x, y, s, st.img === 'blur' ? 9 : 0);
  }
  // input bar (with the photo attached before it is sent, on A)
  c.fillStyle = '#e9edf5'; K.rr(c, 22, h - 84, w - 112, 50, 25); c.fill();
  if (st.attach) pix(c, CAT, 32, h - 78, 2.4); else K.txt(c, '输入消息', 42, h - 58, { size: 20, wt: 600, font: K.CJK, col: '#98a1b3' });
  c.fillStyle = st.press ? '#1d3fcc' : C.accent; K.rr(c, w - 82, h - 84, 60, 50, 25); c.fill();
  K.txt(c, '发送', w - 52, h - 58, { size: 20, wt: 800, font: K.CJK, col: '#fff', align: 'center' });
  // notification banner over the top of the screen
  if (st.banner > 0) {
    const y = -70 + 104 * st.banner;
    c.fillStyle = 'rgba(23,28,46,.94)'; K.rr(c, 18, y, w - 36, 80, 18); c.fill();
    c.fillStyle = C.accent; K.rr(c, 32, y + 16, 48, 48, 12); c.fill(); K.txt(c, '✓', 56, y + 41, { size: 26, wt: 800, col: '#fff', align: 'center' });
    K.txt(c, '你', 94, y + 27, { size: 22, wt: 800, font: K.CJK, col: '#fff' }); K.txt(c, '新照片', 94, y + 57, { size: 22, wt: 700, font: K.CJK, col: '#c8d2ea' });
  }
}

function drawCompress(c, st) {
  K.cardBase(c, 460, 320, 'shrink', '压小', { headH: 92 });
  pix(c, CAT, 34, 116, 7);                              // the original, printed
  K.txt(c, '原图', 34, 248, { size: 22, wt: 800, font: K.CJK }); K.txt(c, '4.2 MB', 34, 284, { size: 26, wt: 600 });
  K.txt(c, '→', 200, 170, { size: 40, wt: 600, col: C.mute, align: 'center' });
  if (st.cmp) K.txt(c, '≈', 200, 214, { size: 34, wt: 600, col: C.accent, align: 'center' });
  c.save(); c.setLineDash([8, 7]); c.strokeStyle = '#c2c9d8'; c.lineWidth = 2.5; K.rr(c, 252, 108, 176, 128, 14); c.stroke(); c.restore();
  K.txt(c, '压缩后', 252, 248, { size: 22, wt: 800, font: K.CJK, col: C.accent });
  if (st.kb) K.txt(c, st.kb, 252, 284, { size: 26, wt: 600, col: C.accent });
}

export function build(ctx) {
  const { world, ev } = ctx, scene = world.scene;
  ctx.fx = { flash: 0 };
  const mat = (col, r = .5, extra = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: r, ...extra });

  // cards
  const cv = {}, cd = {}, state = {};
  // canvases at 3.4× so screen and card text stays crisp in full-frame close-ups
  const mk = (n, draw, init, thick) => { const d = CARDS[n], [c, x] = K.canvas(d.w * 1000, d.h * 1000, 3.4); cv[n] = x; draw(x, init); state[n] = JSON.stringify(init); const g = card(world, c, d.w, d.h, thick); g.position.copy(d.c); g.rotation.y = d.yaw; scene.add(g); cd[n] = g; };
  const re = (n, draw, st) => { const k = JSON.stringify(st); if (k === state[n]) return; state[n] = k; draw(cv[n], st); cd[n].userData.redraw(); };
  const drawA = (c, st) => phone(c, st, 'A'), drawB = (c, st) => phone(c, st, 'B');
  mk('phoneA', drawA, { attach: 1 }, .009); mk('phoneB', drawB, {}, .009); mk('compress', drawCompress, {});
  const PH = .009;

  // name plates on the paper below each phone
  const plates = [];   // shown only in the wide shots (close shots would crop them at the frame edge)
  const plate = (zh, en, p, yaw) => { const [c, x] = K.canvas(300, 84, 2); K.txt(x, zh, 4, 28, { size: 30, wt: 800, font: K.CJK }); K.txt(x, en, 6, 66, { size: 18, wt: 600, col: C.mute, ls: 3 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.3, .084), new THREE.MeshStandardMaterial({ map: world.tex(c), transparent: true, roughness: .9 })); m.rotation.set(-Math.PI / 2, 0, yaw); m.position.copy(p); m.position.y = .0004; scene.add(m); plates.push(m); };
  plate('你的手机', 'YOUR PHONE', at('phoneA', 150, 640, 0), -CARDS.phoneA.yaw);
  plate('小林的手机', "XIAOLIN'S PHONE", at('phoneB', 150, 640, 0), -CARDS.phoneB.yaw);

  // the server: four slabs with windows, a drawer in the second slab, a printed top
  const srv = new THREE.Group(); srv.position.copy(SERVER.c); srv.rotation.y = SERVER.yaw; scene.add(srv);
  const win = [];
  for (let k = 0; k < 4; k++) {
    const y = SERVER.slab / 2 + k * SERVER.step;
    const slab = new THREE.Mesh(rbox(SERVER.w, SERVER.slab, SERVER.d, .008), mat(C.card, .7)); slab.position.y = y; slab.castShadow = slab.receiveShadow = true; srv.add(slab);
    const [c, x] = K.canvas(320, 50, 2), tex = world.tex(c);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SERVER.w, SERVER.slab), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 })); face.position.set(0, y, SERVER.d / 2 + .0006); srv.add(face);
    win.push({ x, tex, face, state: '' });
  }
  const drawer = new THREE.Group(); srv.add(drawer);
  { const tray = new THREE.Mesh(rbox(.12, .036, .1, .004), mat('#dfe5f1', .6)); tray.position.y = SERVER.slab / 2 + SERVER.step; tray.castShadow = tray.receiveShadow = true; drawer.add(tray);
    const front = new THREE.Mesh(rbox(.13, .042, .006, .003), mat(C.accent, .45)); front.position.set(0, SERVER.slab / 2 + SERVER.step, .05); front.castShadow = true; drawer.add(front); }
  { const [c, x] = K.canvas(320, 240, 3.4); K.cardBase(x, 320, 240, 'server', '服务器', { headH: 92, tagSize: 20, cnSize: 30 }); K.txt(x, '云端中转站', 28, 160, { size: 34, wt: 800, font: K.CJK, col: C.accent });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(SERVER.w, SERVER.d), new THREE.MeshStandardMaterial({ map: world.tex(c), transparent: true, roughness: .8 })); top.rotation.x = -Math.PI / 2; top.position.y = 4 * SERVER.step - .0055; srv.add(top); }
  const drawWin = (lit, phase) => win.forEach((w, k) => {
    const key = lit + ':' + phase; if (w.state === key) return; w.state = key; w.x.clearRect(0, 0, 320, 50);
    for (let i = 0; i < 8; i++) { const on = (i * 3 + k * 5 + phase) % 7 < 2; w.x.fillStyle = lit && k === 1 && i === 3 ? C.accent : on ? '#ffe7b0' : '#cfd6e6'; K.rr(w.x, 22 + i * 36, 16, 24, 18, 4); w.x.fill(); }
    w.tex.needsUpdate = true; w.face.material.emissiveIntensity = .18;
  });

  // title tent card by your phone
  const tent = new THREE.Group(); scene.add(tent);
  const TENT = { w: .16, h: .058, lean: .2 };
  { const [c, x] = K.canvas(640, 232, 1); x.fillStyle = C.card; x.fillRect(0, 0, 640, 232); K.grain(x, 640, 232, 9, 3000); x.fillStyle = C.accent; x.fillRect(0, 0, 16, 232);
    K.txt(x, '叮之前', 56, 96, { size: 104, wt: 800, font: K.CJK, ls: 12 }); K.txt(x, 'BEFORE THE DING', 60, 184, { size: 38, wt: 600, col: C.accent, ls: 8 });
    const face = new THREE.MeshStandardMaterial({ map: world.tex(c), roughness: .8 }), plain = new THREE.MeshStandardMaterial({ color: C.card, roughness: .85 });
    const f = new THREE.Mesh(new THREE.BoxGeometry(TENT.w, TENT.h, .0012), [plain, plain, plain, plain, face, plain]), b = new THREE.Mesh(new THREE.BoxGeometry(TENT.w, TENT.h, .0012), plain);
    const dz = Math.sin(TENT.lean) * TENT.h / 2, hy = Math.cos(TENT.lean) * TENT.h / 2;
    f.position.set(0, hy, dz); f.rotation.x = -TENT.lean; b.position.set(0, hy, -dz); b.rotation.x = TENT.lean; f.castShadow = b.castShadow = f.receiveShadow = true; tent.add(f, b);
    tent.position.set(-.62, 0, .34); tent.rotation.y = .3; }

  // desk props (background / foreground layers): a pen, a sticky-note pad, a mug, earbuds, a paper clip
  {
    const pen = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.0065, .0065, .15, 20), mat('#2a3042', .35)); body.rotation.z = Math.PI / 2; pen.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.0065, .02, 20), mat('#c9ccd4', .3, { metalness: .6 })); tip.rotation.z = -Math.PI / 2; tip.position.x = .085; pen.add(tip);
    const clip = new THREE.Mesh(rbox(.05, .002, .004, .001), mat('#c9ccd4', .3, { metalness: .6 })); clip.position.set(-.04, .007, 0); pen.add(clip);
    pen.position.set(-1.32, .0065, .5); pen.rotation.y = .7; pen.traverse(o => o.castShadow = true); scene.add(pen);
    for (let i = 0; i < 4; i++) { const n = new THREE.Mesh(rbox(.11, .0016, .11, .002), mat(i === 3 ? '#f4d27a' : '#f2c14e', .85)); n.position.set(-.86, .0008 + i * .0016, -.66); n.rotation.y = .25 + i * .03; n.castShadow = n.receiveShadow = true; scene.add(n); }
    const mug = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.052, .048, .1, 40, 1, true), mat('#f3efe7', .45, { side: THREE.DoubleSide })); cup.position.y = .05; mug.add(cup);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(.048, 40), mat('#f3efe7', .45)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = .002; mug.add(bottom);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(.049, 40), mat('#6b4a32', .25)); coffee.rotation.x = -Math.PI / 2; coffee.position.y = .085; mug.add(coffee);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.026, .007, 12, 24, Math.PI), mat('#f3efe7', .45)); handle.rotation.z = -Math.PI / 2; handle.position.set(.052, .05, 0); mug.add(handle);
    mug.position.set(.72, 0, -.7); mug.rotation.y = 2.4; mug.traverse(o => o.castShadow = o.receiveShadow = true); scene.add(mug);
    const bud = x => { const g = new THREE.Group(); const head = new THREE.Mesh(new THREE.SphereGeometry(.012, 20, 14), mat('#fbfbfb', .3)); head.scale.set(1, .8, 1); head.position.y = .01; g.add(head);
      const stem = new THREE.Mesh(new THREE.CapsuleGeometry(.0045, .03, 6, 12), mat('#fbfbfb', .3)); stem.rotation.z = Math.PI / 2; stem.position.set(.022, .006, 0); g.add(stem); g.position.copy(x); g.traverse(o => o.castShadow = true); scene.add(g); return g; };
    const b1 = bud(V(1.18, 0, .52)), b2 = bud(V(1.25, 0, .6)); b1.rotation.y = .6; b2.rotation.y = 2.2;
    const wire = new THREE.CatmullRomCurve3([V(1.2, .004, .52), V(1.28, .003, .45), V(1.36, .003, .52), V(1.3, .003, .64), V(1.24, .004, .6)]);
    const wm = new THREE.Mesh(new THREE.TubeGeometry(wire, 60, .0018, 6), mat('#fbfbfb', .35)); wm.castShadow = true; scene.add(wm);
    const er = new THREE.Mesh(rbox(.05, .014, .022, .004), mat('#f0a7b3', .7)); er.position.set(.6, .007, .66); er.rotation.y = .5; er.castShadow = true; scene.add(er);   // an eraser
  }

  // soft window light on the desk (warm, additive, under the cards)
  { const [c, x] = K.canvas(512, 512, 1); x.filter = 'blur(26px)'; x.fillStyle = 'rgba(255,236,205,1)';
    for (const [a, b] of [[60, 60], [270, 60], [60, 270], [270, 270]]) x.fillRect(a, b, 180, 180); x.filter = 'none';
    const lm = new THREE.MeshBasicMaterial({ map: world.tex(c), transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    for (const [px, pz, s, r] of [[-.15, .32, 1.1, .5], [1.05, -.45, .8, .5]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * .8), lm); m.rotation.set(-Math.PI / 2, 0, r); m.position.set(px, .0003, pz); m.renderOrder = 1; scene.add(m); } }

  // the route: cobalt dots through the stops; the straight line it does NOT take (grey, crossed out)
  const ROUTE = [at('phoneA', 150, 40, 0), V(-.68, 0, -.2), at('compress', 230, 330, 0), at('compress', 460, 200, 0), V(-.02, 0, -.3), srvAt(-.1, 0, .14), srvAt(.1, 0, .14), V(.56, 0, -.2), at('phoneB', 150, 40, 0)];
  const route = new THREE.CatmullRomCurve3(ROUTE.map(p => V(p.x, .0016, p.z)));
  const NR = 110, rp = [...Array(NR)].map((_, k) => route.getPointAt((k + .5) / NR));
  const under = (x, z, pad = .012) => Object.values(CARDS).some(d => { const q = V(x - d.c.x, 0, z - d.c.z).applyAxisAngle(YAX, -d.yaw); return Math.abs(q.x) < d.w / 2 + pad && Math.abs(q.z) < d.h / 2 + pad; })
    || (() => { const q = V(x - SERVER.c.x, 0, z - SERVER.c.z).applyAxisAngle(YAX, -SERVER.yaw); return Math.abs(q.x) < SERVER.w / 2 + .01 && Math.abs(q.z) < SERVER.d / 2 + .01; })();
  const routeIdx = rp.map((p, k) => under(p.x, p.z) ? -1 : k).filter(k => k >= 0);
  const dotGeo = new THREE.CylinderGeometry(.0068, .0068, .0026, 18);
  const routeMesh = new THREE.InstancedMesh(dotGeo, new THREE.MeshStandardMaterial({ color: C.accent, roughness: .45, emissive: C.accent, emissiveIntensity: 0 }), routeIdx.length); routeMesh.castShadow = true; scene.add(routeMesh);
  const sA = at('phoneA', 300, 300, 0), sB = at('phoneB', 0, 300, 0);
  const straight = new THREE.InstancedMesh(rbox(.032, .0022, .009, .002), mat('#aab2c3', .6), 26); scene.add(straight);
  const grayX = makeMonster(toArt(CROSS, { G: '#8f98ad' }), .009, 'x', .6); scene.add(grayX.root);
  const bellTrail = new THREE.InstancedMesh(new THREE.SphereGeometry(.0055, 12, 8), new THREE.MeshStandardMaterial({ color: C.mustard, roughness: .4, emissive: C.mustard, emissiveIntensity: .25 }), 30); scene.add(bellTrail);

  // dot ripples around the impacts
  const RIP = [{ t: T.ding0, x: CARDS.phoneB.c.x, z: CARDS.phoneB.c.z, amp: .012, speed: .7 }, { t: T.press, x: CARDS.compress.c.x, z: CARDS.compress.c.z, amp: .014, speed: .8 }, { t: T.ring, x: CARDS.phoneB.c.x, z: CARDS.phoneB.c.z, amp: .016, speed: .8 }];
  // impact rings: a thin cobalt ring spreads over the paper from the phone (ding, ring) and the compress card (press)
  const rings = RIP.map(r => { const m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 96), new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, depthWrite: false, fog: false })); m.rotation.x = -Math.PI / 2; m.position.set(r.x, .0006, r.z); m.renderOrder = 2; scene.add(m); return { m, r }; });

  // the press that shrinks the photo
  const press = new THREE.Group(); scene.add(press);
  { const plateM = new THREE.Mesh(rbox(.15, .03, .15, .008), mat(C.ink, .4)); plateM.castShadow = true; press.add(plateM);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .6, 16), mat('#aab2c3', .3, { metalness: .5 })); rod.position.y = .31; press.add(rod); }

  // step badges (camera-facing pills): 1 压小, 2 服务器, 3 通知
  const badges = [['1  压小', at('compress', 400, 60, .06), T.badge1], ['2  服务器', srvAt(.12, .3, 0), T.badge2], ['3  通知', srvAt(-.14, .36, .02), T.badge3]].map(([s, p, t0]) => { const m = pill(world, s, { h: .036, size: 44, font: K.SANS, wt: 800 }); m.renderOrder = 3; return { m, p, t0 }; });
  const slow = pill(world, '网慢', { h: .03, size: 40, bg: C.ink, font: K.SANS, wt: 800 });
  const tag300 = pill(world, '300 KB', { h: .03, size: 40, bg: C.accent }), tag42 = pill(world, '4.2 MB', { h: .03, size: 40, bg: C.ink });

  // cast
  const catBig = makeMonster(toArt(CAT, PAL), .0062, 'cat', .9), catSmall = makeMonster(toArt(SMALL, PAL), .0074, 'cat8', .9), bell = makeMonster(toArt(BELL, { Y: C.mustard, y: '#e0a93a', D: '#a8744a' }), .0068, 'bell');
  for (const m of [catBig, catSmall, bell]) scene.add(m.root);

  // places
  const PL = {
    catA: at('phoneA', 150, 330, PH), catCmp: at('compress', 340, 205, TOP), catCmpBig: at('compress', 250, 205, TOP),
    srvTop: srvAt(.11, SRV_TOP, -.095), drawerIn: srvAt(0, SERVER.slab / 2 + SERVER.step + .018, 0), drawerOut: srvAt(0, SERVER.slab / 2 + SERVER.step + .018, .13),
    bellUp: srvAt(-.06, SRV_TOP + .1, .02), bellB: at('phoneB', 150, 60, PH + .05), waitB: at('phoneB', 252, 335, PH), bubbleB: at('phoneB', 98, 302, PH),
  };
  const srvHop = [PL.catCmp, V(-.08, 0, -.32), V(.06, 0, -.24), PL.srvTop];
  const backHop = [PL.drawerOut.clone().setY(0), V(.47, 0, -.18), V(.66, 0, -.04), PL.waitB];
  const catSmallHops = [
    ...T.hopsS.map(([a, b], i) => ({ t0: a, t1: b, from: srvHop[i], to: srvHop[i + 1], h: i === 2 ? .3 : .07 })),
    { t0: T.catIn[0], t1: T.catIn[1], from: PL.srvTop, to: PL.drawerOut, h: .06 },
    ...T.hopsB.map(([a, b], i) => ({ t0: a, t1: b, from: i ? backHop[i] : PL.drawerOut, to: backHop[i + 1], h: i ? .07 : .09 })),
    { t0: T.intoBubble[0], t1: T.intoBubble[1], from: PL.waitB, to: PL.bubbleB, h: .06 },
  ];

  // ── text in the world meant to be read: [id, text, t0, t1, corners()] ──
  const uv = (n, u0, v0, u1, v1, y = TOP) => () => [at(n, u0, v0, y), at(n, u1, v0, y), at(n, u0, v1, y), at(n, u1, v1, y)];
  const tentBox = (y0, y1) => () => { const f = tent.children[0]; f.updateMatrixWorld(); return [[-.5, y0], [.5, y0], [-.5, y1], [.5, y1]].map(([x, y]) => V(x * TENT.w, (.5 - y) * TENT.h, .0007).applyMatrix4(f.matrixWorld)); };
  const pillBox = m => () => { m.updateMatrixWorld(); const hw = m.w / 2, hh = m.geometry.parameters.height / 2; return [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].map(([x, y]) => V(x, y, 0).applyMatrix4(m.matrixWorld)); };
  ctx.read = [
    ['title-zh', '叮之前', 0, 4.4, tentBox(.12, .58)],
    ['title-en', 'BEFORE THE DING', 0, 4.4, tentBox(.66, .9)],
    ['orig', '原图 4.2 MB', T.counter[1], 17.2, uv('compress', 30, 232, 160, 300, PH)],
    ['comp', '压缩后 300 KB', T.counter[1], 17.2, uv('compress', 250, 232, 380, 300, PH)],
    ['srv', '服务器 云端中转站', 20.3, 26.0, () => [srvAt(-.15, SRV_TOP, -.1), srvAt(.15, SRV_TOP, -.1), srvAt(-.15, SRV_TOP, .08), srvAt(.15, SRV_TOP, .08)]],
    ['banner', '你 新照片', T.banner + .3, T.notif + .5, uv('phoneB', 18, 34, 282, 114, PH)],
    ['slow', '网慢', T.weak + .2, T.sharp, pillBox(slow)],
    ['t300', '300 KB', T.tag300 + .2, VO[13].t0 + .05, pillBox(tag300)],
    ['t42', '4.2 MB', T.tag42 + .2, CREDIT_T - .14, pillBox(tag42)],
  ];

  // ── sound events ──
  ev.push({ t: T.catPop, type: 'pop', k: 0, big: 1 }, { t: T.send, type: 'send' }, { t: T.ding0, type: 'ding' }, { t: T.rewind, type: 'rewind' },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ t: T.straight[0] + i * .125, type: 'dash', k: i })), { t: T.cross, type: 'nope' },
    ...[...Array(10)].map((_, i) => ({ t: T.route[0] + i * .125, type: 'dot', k: i })),
    { t: T.jump1[0], type: 'jump' }, { t: T.jump1[1], type: 'land', v: .7 }, { t: T.badge1, type: 'badge', k: 0 },
    { t: T.press - .25, type: 'drop' }, { t: T.press, type: 'press' }, { t: T.press + .3, type: 'pop', k: 2 },
    ...[...Array(8)].map((_, i) => ({ t: T.counter[0] + i * .45, type: 'tickdown', k: i })), { t: T.compare, type: 'badge', k: 1 },
    ...T.hopsS.flatMap(([a, b], i) => [{ t: a, type: i === 2 ? 'jump' : 'hop' }, { t: b, type: 'land', v: i === 2 ? .7 : .4 }]), { t: T.badge2, type: 'badge', k: 1 },
    { t: T.drawerOut, type: 'drawer' }, { t: T.catIn[1], type: 'land', v: .35 }, { t: T.drawerIn[0], type: 'drawer' }, { t: T.lit, type: 'lit' },
    { t: T.bellRise, type: 'pop', k: 4 }, { t: T.badge3, type: 'badge', k: 2 }, { t: T.bellFly[0], type: 'fly' }, ...T.taps.map(t => ({ t, type: 'tap' })), { t: T.banner, type: 'banner' },
    { t: T.ring, type: 'ring' }, { t: T.notif, type: 'badge', k: 3 }, { t: T.fetch[0], type: 'fetch' }, { t: T.drawerOut2[0], type: 'drawer' },
    ...T.hopsB.flatMap(([a, b]) => [{ t: a, type: 'hop' }, { t: b, type: 'land', v: .4 }]), { t: T.weak, type: 'weak' },
    { t: T.intoBubble[0], type: 'hop' }, { t: T.sharp, type: 'sharp' },
    ...[...Array(8)].map((_, i) => ({ t: T.routeLit[0] + i * .2, type: 'dot', k: i })), { t: T.tag300, type: 'badge', k: 1 }, { t: T.tag42, type: 'badge', k: 0 }, { t: END.credit, type: 'credit' });

  // subjects for the camera
  const mid = (m, k = .5) => () => m.root.position.clone().add(V(0, m.height * k, 0));
  Object.assign(ctx.subj, {
    A: () => at('phoneA', 150, 300, .02), Atent: () => at('phoneA', 230, 330, .03).lerp(tent.position.clone().setY(.03), .35), Aup: () => at('phoneA', 150, 200, .02), Aalbum: () => at('phoneA', 150, 250, .02),
    B: () => at('phoneB', 150, 300, .02), Btop: () => at('phoneB', 150, 215, .02), Bbubble: () => at('phoneB', 120, 290, .02),
    cmp: () => at('compress', 230, 190, .02), cmpWide: () => at('compress', 230, 170, .02), srv: () => srvAt(0, .12, 0), srvTop: () => srvAt(0, .2, 0),
    cat: () => (catBig.root.visible ? catBig : catSmall).root.position.clone().add(V(0, .03, 0)), bell: mid(bell), wide: () => V(-.04, 0, .02), wide2: () => V(-.12, 0, .02), final: () => V(-.04, 0, .0),
    leg2: () => V(.5, 0, -.02),
  });

  ev.push(...[...Array(7)].map((_, k) => ({ t: 22.9 + k * .18, type: 'dot', k })), ...[0, 1, 2, 3].map(k => ({ t: T.finale + .55 + k * .14 + .45, type: 'land', v: .35 })),
    { t: T.finale + .55 + .7, type: 'pop', k: 0 }, { t: T.finale + .55 + .82, type: 'pop', k: 2 }, { t: T.finale + .55 + .3, type: 'drop' }, { t: T.finale + .55 + .55, type: 'titleLand' });
  // ── more life at every stop ──
  // pixels squeezed out by the press: 28 little cubes in the photo's colours burst out and roll away (the data that compression throws away)
  const DEB = [...Array(28)].map((_, k) => { const a = k / 28 * Math.PI * 2 + hash(k) * .4, sp = .18 + hash(k * 3.1) * .22; return { dir: V(Math.cos(a), 0, Math.sin(a) * .7), sp, up: .35 + hash(k * 7.7) * .45, col: Object.values(PAL)[k % 7] }; });
  const debris = new THREE.InstancedMesh(rbox(.0062, .0062, .0062, .0012), new THREE.MeshStandardMaterial({ roughness: .5 }), DEB.length); debris.castShadow = true; scene.add(debris);
  DEB.forEach((d, k) => debris.setColorAt(k, new THREE.Color(d.col)));
  // data packets: little cobalt cubes hop into the server while the photo is stored, and run along the route to B during the fetch
  const PK = 14, packets = new THREE.InstancedMesh(rbox(.02, .02, .02, .004), new THREE.MeshStandardMaterial({ color: C.mustard, roughness: .4, emissive: C.mustard, emissiveIntensity: .2 }), PK); packets.castShadow = true; scene.add(packets);
  // an antenna on the server with a blinking light
  const ant = new THREE.Group(); srv.add(ant);
  { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .07, 10), mat('#aab2c3', .3, { metalness: .5 })); rod.position.set(.12, 4 * SERVER.step + .035, -.08); ant.add(rod);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.008, 16, 12), new THREE.MeshStandardMaterial({ color: C.accent, emissive: C.accent, emissiveIntensity: 0 })); lamp.position.set(.12, 4 * SERVER.step + .072, -.08); ant.add(lamp); ant.userData.lamp = lamp; }
  // vibration marks either side of B on the ring: short voxel arcs
  const vib = [-1, 1].flatMap(sd => [0, 1].map(n => { const m = new THREE.Mesh(new THREE.TorusGeometry(.04 + n * .022, .0035, 8, 24, 1.2), mat(C.accent, .4)); m.rotation.set(-Math.PI / 2, 0, sd > 0 ? -.6 : Math.PI - .6); m.position.copy(at('phoneB', sd > 0 ? 330 : -30, 280, .01)); scene.add(m); return { m, sd, n }; }));
  // the end: two cats come back for a bow, the original on your phone and the copy on the friend's
  const bowBig = makeMonster(toArt(CAT, PAL), .0062, 'bowBig', .9), bowSmall = makeMonster(toArt(SMALL, PAL), .0074, 'bowSmall', .9); scene.add(bowBig.root, bowSmall.root);
  const stations = [cd.phoneA, cd.compress, srv, cd.phoneB];
  // the closing title: a big paper card in the empty middle of the desk (same print as the opening tent), dropped after the hops
  const BIG = { w: .78, h: .34, c: V(-.03, 0, .33), yaw: .03 };
  const bigTitle = new THREE.Group(); scene.add(bigTitle);
  { const [c, x] = K.canvas(780, 340, 3); x.fillStyle = C.card; K.rr(x, 0, 0, 780, 340, 22); x.fill(); K.grain(x, 780, 340, 13, 6000);
    x.fillStyle = C.accent; x.fillRect(0, 0, 20, 340);
    K.txt(x, '叮之前', 64, 150, { size: 168, wt: 800, font: K.CJK, ls: 24 }); K.txt(x, 'BEFORE THE DING', 70, 276, { size: 50, wt: 600, col: C.accent, ls: 12 });
    const g = card(world, c, BIG.w, BIG.h, .007); bigTitle.add(g); bigTitle.position.copy(BIG.c); bigTitle.rotation.y = BIG.yaw; }
  const bigAt = (u, v, y = .0075) => V(u / 1000 - BIG.w / 2, y, v / 1000 - BIG.h / 2).applyAxisAngle(YAX, BIG.yaw).add(BIG.c);
  ctx.read.push(['big-zh', '叮之前', END.credit - .1, VDUR + 1, () => [bigAt(60, 64), bigAt(600, 64), bigAt(60, 236), bigAt(600, 236)]],
    ['big-en', 'BEFORE THE DING', END.credit - .1, VDUR + 1, () => [bigAt(66, 250), bigAt(700, 250), bigAt(66, 302), bigAt(700, 302)]]);

  // ── per frame ──
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  return t => {
    // phone A: compose with the photo attached → sent (bubble) → album at the end
    const pressA = t > T.send - .05 && t < T.send + .2;
    re('phoneA', drawA, t >= T.album ? { album: 1 } : { attach: t < T.send + .1 ? 1 : 0, press: pressA ? 1 : 0, img: t >= T.send + .15 ? 'sharp' : 0 });
    // phone B: the instant the viewer imagines (2.3–5.3), rewound; then banner, loading, blurry, sharp
    let bs = {};
    if (t >= T.ding0 && t < T.rewind) bs = { banner: Math.min(1, eo(seg(t, T.ding0, T.ding0 + .25))), img: 'sharp' };
    else if (t >= T.rewind && t < T.rewind + .3) bs = { banner: 1 - seg(t, T.rewind, T.rewind + .3) };
    else if (t >= T.banner) {
      const banner = t < T.notif + .8 ? Math.min(1, eo(seg(t, T.banner, T.banner + .25))) * (1 - seg(t, T.notif + .5, T.notif + .8)) : 0;
      const img = t < T.fetch[0] ? 0 : t < T.blur ? 'loading' : t < T.sharp ? 'blur' : 'sharp';
      bs = { banner: Math.round(banner * 12) / 12, img, load: Math.round(seg(t, T.fetch[0], T.blur + 2.6) * 16) / 16 * .7, weak: t >= T.weak && t < T.sharp + .4 ? 1 : 0 };
    }
    re('phoneB', drawB, bs);
    re('compress', drawCompress, { kb: t < T.press + .4 ? '' : (() => { const p = eo(seg(t, T.counter[0], T.counter[1])); const kb = Math.round((4200 - 3900 * p) / 50) * 50; return kb >= 1000 ? (kb / 1000).toFixed(1) + ' MB' : kb + ' KB'; })(), cmp: t >= T.compare ? 1 : 0 });

    // tent; name plates in the wide shots only
    tent.visible = true;
    { const a = Math.max(seg(t, 4.9, 5.4) * (1 - seg(t, 7.5, 7.8)), seg(t, 45.4, 45.9) * (1 - seg(t, 48.4, 48.6)), seg(t, CREDIT_T + .3, CREDIT_T + .8)); plates.forEach(m => { m.visible = a > .01; m.material.opacity = a; }); }
    // straight line + grey cross (4.9–7.8)
    { const fade = 1 - ss(seg(t, ...T.straightOut));
      for (let k = 0; k < 26; k++) { const p = sA.clone().lerp(sB, (k + .5) / 26), on = seg(t, T.straight[0] + k * .026, T.straight[0] + k * .026 + .1) * fade; q.setFromAxisAngle(YAX, -Math.atan2(sB.z - sA.z, sB.x - sA.x)); m4.compose(p.setY(.0012), q, V(1, 1, 1).multiplyScalar(Math.max(1e-4, on))); straight.setMatrixAt(k, m4); }
      straight.instanceMatrix.needsUpdate = true;
      const P0 = back(seg(t, T.cross, T.cross + .25), 2.2); grayX.set({ pos: sA.clone().lerp(sB, .5).setY(.002), hinge: 0, e: 1, scale: Math.max(.001, P0 * fade), vis: t >= T.cross && fade > .01 }); }
    // route dots: drawn 6.0–7.2, lit in a wave at 46.2–47.8 and during the fetch (36.2–37.3, from B back to the server)
    routeIdx.forEach((k, j) => {
      const s = back(seg(t, T.route[0] + j / routeIdx.length * (T.route[1] - T.route[0]), T.route[0] + j / routeIdx.length * (T.route[1] - T.route[0]) + .15), 2);
      m4.compose(rp[k], q.identity(), V(1, 1, 1).multiplyScalar(Math.max(1e-4, s))); routeMesh.setMatrixAt(j, m4);
    });
    routeMesh.instanceMatrix.needsUpdate = true;
    routeMesh.material.emissiveIntensity = .5 * (Math.max(0, 1 - Math.abs(t - (T.fetch[0] + T.fetch[1]) / 2) / .9) + Math.max(0, 1 - Math.abs(t - (T.routeLit[0] + T.routeLit[1]) / 2) / 1.2));
    // badges and tags
    for (const b of badges) { const p = back(seg(t, b.t0, b.t0 + .25), 2.2); b.m.visible = t >= b.t0 && t < b.t0 + 3.4; b.m.scale.setScalar(Math.max(.001, p * (1 - ss(seg(t, b.t0 + 3.1, b.t0 + 3.4))))); b.m.position.copy(b.p); b.m.face(ctx.camera); }
    { const p = back(seg(t, T.weak, T.weak + .25), 2.2); slow.visible = t >= T.weak && t < T.sharp + .3; slow.scale.setScalar(Math.max(.001, p * (1 - ss(seg(t, T.sharp, T.sharp + .3))))); slow.position.copy(at('phoneB', 236, 214, .03)); slow.face(ctx.camera); }
    { const p = back(seg(t, T.tag300, T.tag300 + .25), 2.2); tag300.visible = t >= T.tag300 && t < VO[13].t0 + .2; tag300.scale.setScalar(Math.max(.001, p)); tag300.position.copy(at('phoneB', 232, 250, .03)); tag300.face(ctx.camera); }
    { const p = back(seg(t, T.tag42, T.tag42 + .25), 2.2); tag42.visible = t >= T.tag42 && t < CREDIT_T - .04; tag42.scale.setScalar(Math.max(.001, p)); tag42.position.copy(at('phoneA', 222, 128, .03)); tag42.face(ctx.camera); }
    // server: windows flicker on 8ths, the drawer slides
    drawWin(t >= T.lit ? 1 : 0, Math.floor(t * 4) % 7);
    { const out1 = ss(seg(t, T.drawerOut, T.drawerOut + .35)) * (1 - ss(seg(t, ...T.drawerIn))), out2 = ss(seg(t, ...T.drawerOut2)) * (1 - ss(seg(t, T.hopsB[0][1] + .1, T.hopsB[0][1] + .5)));
      drawer.position.z = .13 * Math.max(out1, out2); }
    // the press: drops on the big cat at T.press, lifts again
    { const down = ei(seg(t, T.press - .25, T.press)), up = eo(seg(t, T.press + .25, T.press + .7));
      press.visible = t > T.press - .6 && t < T.press + 1.0; press.position.copy(PL.catCmpBig).add(V(0, .055 + .5 * (1 - down) + .5 * up, 0)); }
    // big cat: sticker on A's screen → pops → leaps to the compress card → squashed by the press → gone
    {
      const P0 = pop(t, T.catPop, .45, .05), send = t > T.send - .1 && t < T.send + .25 ? -.15 * Math.sin(Math.PI * seg(t, T.send - .1, T.send + .25)) : 0;
      const h = hops(t, [{ t0: T.jump1[0], t1: T.jump1[1], from: PL.catA, to: PL.catCmpBig, h: .2 }], PL.catA);
      const squashed = t > T.press - .02 ? 1 - .82 * eo(seg(t, T.press - .02, T.press + .06)) : 1;
      const wait = t > T.catPop + .5 && t < T.jump1[0] ? beatBounce(t, T.catPop + .5, T.jump1[0] - .1, .012) : { y: 0, sq: 1 };
      const pos = h.pos.clone(); pos.y += P0.y + wait.y;
      catBig.set({ pos, vis: t < T.press + .12, e: P0.e, hinge: P0.hinge, sq: Math.max(.12, squash(t, h.lands, h.takeoffs, h.air) * P0.sq * wait.sq * (1 + send) * squashed), yaw: t > T.jump1[1] ? .15 : .1 });
    }
    // small cat: pops out of the press, hops to the server, into the drawer, back out, along the route to B, into the photo bubble
    {
      const P0 = pop(t, T.press + .3, .35, .05), h = hops(t, catSmallHops, PL.catCmp);
      let pos = h.pos.clone(); pos.y += P0.y;
      const inDrawer = t >= T.catIn[1] && t < T.hopsB[0][0];
      if (inDrawer) pos = srvAt(0, SERVER.slab / 2 + SERVER.step + .018, drawer.position.z);
      const hidden = inDrawer && drawer.position.z < .05;
      const flat = ss(seg(t, T.intoBubble[1] - .05, T.intoBubble[1] + .1));
      const idle = t > T.hopsB[2][1] && t < T.intoBubble[0] ? beatBounce(t, T.hopsB[2][1] + .1, T.intoBubble[0] - .05, .012) : t > T.press + .8 && t < T.hopsS[0][0] ? beatBounce(t, T.press + .8, T.hopsS[0][0] - .1, .01) : t > T.hopsS[2][1] + .2 && t < T.catIn[0] ? beatBounce(t, T.hopsS[2][1] + .2, T.catIn[0] - .05, .012) : { y: 0, sq: 1 };
      pos.y += idle.y;
      const dir = h.dir && h.air !== null ? clamp(Math.atan2(h.dir.x, h.dir.z) * .35, -.5, .5) : .1;
      catSmall.set({ pos, vis: t >= T.press + .3 && !hidden && t < T.sharp + .05, e: Math.min(P0.e, 1 - .9 * flat), hinge: Math.min(P0.hinge, 1 - flat), sq: squash(t, h.lands, h.takeoffs, h.air) * P0.sq * idle.sq, yaw: dir });
    }
    // the bell: rises from the server, flies to B leaving a trail, taps twice, swings on the ring, leaves
    {
      const P0 = pop(t, T.bellRise, .4, .05);
      let pos = PL.srvTop.clone().lerp(PL.bellUp, eo(seg(t, T.bellRise, T.bellRise + .5)));
      pos.y += .008 * Math.sin(t * 6) * seg(t, T.bellRise + .5, T.bellFly[0]);
      const f = seg(t, ...T.bellFly);
      if (t >= T.bellFly[0]) { pos = PL.bellUp.clone().lerp(PL.bellB, eio(f)); pos.y += .22 * arc(f); }
      for (const tp of T.taps) { const d = t - tp; if (d > 0 && d < .2) pos.y -= .03 * Math.sin(Math.PI * d / .2); }
      if (t > T.bellFly[1]) pos.y += .006 * Math.sin(t * 5);
      const swing = t > T.ring && t < T.ring + 1.2 ? .5 * Math.sin((t - T.ring) * 22) * Math.exp(-(t - T.ring) * 2.5) : 0;
      const gone = ss(seg(t, T.bellGone, T.bellGone + .3));
      bell.set({ pos, vis: t >= T.bellRise && gone < 1, e: P0.e, hinge: P0.hinge, sq: P0.sq, tiltZ: swing + (f > 0 && f < 1 ? .3 * Math.sin(f * Math.PI) : 0), scale: 1 - gone });
      for (let k = 0; k < 30; k++) { const u = (k + .5) / 30, p = PL.bellUp.clone().lerp(PL.bellB, eio(u)); p.y += .22 * arc(u); const on = t >= T.bellFly[0] + u * .7 && t < T.ring + 1.0 ? 1 - ss(seg(t, T.ring + .6, T.ring + 1.0)) : 0; m4.compose(p, q.identity(), V(1, 1, 1).multiplyScalar(Math.max(1e-4, on * (.6 + .4 * u)))); bellTrail.setMatrixAt(k, m4); }
      bellTrail.instanceMatrix.needsUpdate = true;
    }
    // phone B jolts on the ding and on the ring
    { let j = 0; for (const tr of [T.ding0, T.ring]) { const d = t - tr; if (d > 0 && d < .3) j += .003 * Math.sin(d * 60) * (1 - d / .3); } cd.phoneB.position.x = CARDS.phoneB.c.x + j; }
    // cats blink every couple of seconds (and squint under the press)
    { const bl = (t % 2.3) < .12 || (t > T.press - .05 && t < T.press + .15); catBig.blink(bl); catSmall.blink((t + .7) % 2.1 < .12); }
    // debris from the press
    { const m4d = new THREE.Matrix4(), qd = new THREE.Quaternion();
      DEB.forEach((d, k) => { const dt = t - T.press; if (dt < 0 || dt > 2.2) { m4d.compose(V(0, -1, 0), qd, V(1e-4, 1e-4, 1e-4)); debris.setMatrixAt(k, m4d); return; }
        const fl = Math.min(dt, .5), p = PL.catCmpBig.clone().addScaledVector(d.dir, d.sp * fl + .05 * Math.max(0, dt - .5) * d.sp); p.y += .02 + d.up * fl - 1.6 * fl * fl; p.y = Math.max(TOP + .003, p.y);
        qd.setFromEuler(new THREE.Euler(dt * 6 * hash(k), dt * 4, 0)); const sc = 1 - ss(seg(dt, 1.6, 2.2)); m4d.compose(p, qd, V(sc, sc, sc).addScalar(1e-4)); debris.setMatrixAt(k, m4d); });
      debris.instanceMatrix.needsUpdate = true; }
    // packets: hop into the server's windows (22.9–24.2), run along the route to B in the fetch (36.2–39.6)
    { const m4p = new THREE.Matrix4(), qp = new THREE.Quaternion();
      for (let k = 0; k < PK; k++) {
        let p = null, s = 0;
        const a0 = 22.9 + k * .09; if (t > a0 && t < a0 + .55) { const u = seg(t, a0, a0 + .45); p = srvAt(-.12 + (k % 7) * .04, .02 + arc(u) * .12 + u * (SERVER.slab / 2 + (k % 4) * SERVER.step - .02), .2 - u * .08); s = 1 - ss(seg(t, a0 + .4, a0 + .55)); }
        const b0 = T.fetch[0] + k * .2; if (t > b0 && t < b0 + 2.6) { const u = seg(t, b0, b0 + 2.4), j = Math.floor((1 - u) * (routeIdx.length - 1)); p = rp[routeIdx[Math.max(0, j)]].clone(); p.y += .012 + .02 * Math.abs(Math.sin(u * 30)); s = Math.min(seg(t, b0, b0 + .1), 1 - seg(t, b0 + 2.4, b0 + 2.6)); }
        m4p.compose(p || V(0, -1, 0), qp, V(1, 1, 1).multiplyScalar(Math.max(1e-4, p ? s : 0))); packets.setMatrixAt(k, m4p);
      }
      packets.instanceMatrix.needsUpdate = true; }
    // antenna lamp blinks on the beat while the server holds the photo; vibration marks on the ring
    ant.userData.lamp.material.emissiveIntensity = t > T.lit && Math.floor(t * 2) % 2 === 0 ? 1.2 : .1;
    vib.forEach(({ m, sd, n }) => { const d = t - T.ring - n * .08; const on = d > 0 && d < .9; m.visible = on; if (on) { m.scale.setScalar(.8 + .5 * d); m.material.opacity = 1; m.position.copy(at('phoneB', sd > 0 ? 330 + d * 40 : -30 - d * 40, 280, .01)); } });
    // the finale: every station hops once, left to right, then the two cats pop up and bow
    { const F0 = T.finale + .55;
      stations.forEach((g, k) => { const d = t - (F0 + k * .14); const y = d > 0 && d < .45 ? .03 * arc(d / .45) : 0; g.position.y = (g === srv ? 0 : 0) + y; });
      const pb = pop(t, F0 + .7, .4, .06), ps = pop(t, F0 + .82, .4, .05), bb = beatBounce(t, F0 + 1.2, DUR, .012), bs = beatBounce(t, F0 + 1.2, DUR, .012, .25);
      bowBig.set({ pos: at('phoneA', 150, 230, PH).add(V(0, pb.y + bb.y, 0)), vis: t >= F0 + .7, e: pb.e, hinge: pb.hinge, sq: pb.sq * bb.sq, yaw: .25 });
      bowSmall.set({ pos: at('phoneB', 150, 300, PH).add(V(0, ps.y + bs.y, 0)), vis: t >= F0 + .82, e: ps.e, hinge: ps.hinge, sq: ps.sq * bs.sq, yaw: -.25 });
      bowBig.blink((t + .3) % 1.9 < .12); bowSmall.blink((t + 1.1) % 1.7 < .12);
      // the big title drops from above, squashes a little and settles; the small opening tent folds away as it lands
      const td = F0 + .3, land = td + .25, p = seg(t, td, land), d = t - land;
      bigTitle.visible = t >= td; bigTitle.position.y = (1 - ei(p)) * .6 + (d > 0 && d < .35 ? .012 * Math.sin(Math.PI * d / .35) * (1 - d / .35) : 0);
      const sq = d > 0 && d < .2 ? 1 - .25 * Math.sin(Math.PI * d / .2) : 1; bigTitle.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      tent.scale.setScalar(Math.max(.001, 1 - ss(seg(t, land, land + .3))));
      if (t > F0 - .2) routeMesh.material.emissiveIntensity = Math.max(routeMesh.material.emissiveIntensity, .45 * (1 - Math.abs(t - F0 - .5) / 1.0)); }
    rings.forEach(({ m, r }) => { const d = t - r.t, on = d > 0 && d < 1.1; m.visible = on; if (on) { const s = .2 + d * .55; m.scale.setScalar(s); m.material.opacity = .55 * (1 - d / 1.1); } });
  };
}
