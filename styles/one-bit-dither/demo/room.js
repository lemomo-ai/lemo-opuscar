// The observatory control room. Night (shot 2): oscilloscope, chart recorder, duty log with a clipped card, cold tea,
// an empty chair. Dawn (shot 6): the facsimile prints hang on a line across the window, time runs through one move,
// the official print has arrived on the desk.
import * as THREE from 'three';
import { V, grey, glow, add, box, cyl, rod, canvasTex, printMat, paperCanvas, screenBox } from './kit.js';
import { L_FLAT } from './pipe.js';
import { clamp, lerp, seg, ss, eio, eo, monotone, mulberry } from '/core/lib.js';
import { T, SYNC } from './timeline.js';
import { LOG_OLD, LOG_NEW, CARD, OFFICIAL_TAG, PHOTO_EDGE } from './texts.js';
import { JDOTS, ODOTS } from './prints.js';

const DESK_Y = 0.76;
export function buildRoom(ctx) {
  const { prints } = ctx;
  const scene = new THREE.Scene();
  const texts = [];                    // {id, text, mesh, corners[4], minPx, when(t)}
  const regText = (mesh, cw, ch, pw, ph, line, when, minPx = 22) => {
    const c = [[line.x0, line.y0], [line.x1, line.y0], [line.x1, line.y1], [line.x0, line.y1]].map(([x, y]) => V((x / cw - 0.5) * pw, (0.5 - y / ch) * ph, 0.001));
    texts.push({ id: line.id, text: line.text, mesh, corners: c, when, minPx });
  };
  const WALL = grey(0.5), FLOOR = grey(0.3), WOOD = grey(0.3, { r: 0.7 }), DARK = grey(0.14, { r: 0.5 }), MET = grey(0.5, { r: 0.35 }), CREAM = grey(0.78, { r: 0.6 });
  // ---------- architecture ----------
  add(scene, new THREE.PlaneGeometry(8, 6).rotateX(-Math.PI / 2), FLOOR).position.set(0.5, 0, 0);
  { // back wall with a window hole (x 0.7..2.3, y 1.0..2.2)
    const s = new THREE.Shape(); s.moveTo(-2, 0); s.lineTo(3.5, 0); s.lineTo(3.5, 2.7); s.lineTo(-2, 2.7); s.lineTo(-2, 0);
    const h = new THREE.Path(); h.moveTo(0.7, 1.0); h.lineTo(0.7, 2.2); h.lineTo(2.3, 2.2); h.lineTo(2.3, 1.0); h.lineTo(0.7, 1.0); s.holes.push(h);
    add(scene, new THREE.ShapeGeometry(s), WALL).position.z = -0.62;
    add(scene, new THREE.PlaneGeometry(6, 2.7).rotateY(Math.PI / 2), WALL).position.set(-1.7, 1.35, 1.5);
    box(scene, 5.5, 0.12, 0.03, 0.75, 0.06, -0.6, DARK);   // skirting
    // window frame, sill, muntins
    const FR = grey(0.7, { r: 0.6 });
    box(scene, 1.7, 0.06, 0.1, 1.5, 0.97, -0.56, FR); box(scene, 1.7, 0.06, 0.08, 1.5, 2.23, -0.6, FR);
    [0.7, 2.3].forEach(x => box(scene, 0.06, 1.3, 0.08, x, 1.6, -0.6, FR));
    [1.233, 1.767].forEach(x => box(scene, 0.03, 1.2, 0.05, x, 1.6, -0.62, FR));
    box(scene, 1.6, 0.03, 0.05, 1.5, 1.6, -0.62, FR);
  }
  // sky outside (time-lapse from night to a pale dawn) and the telescope far away on the horizon
  const skyU = { uK: { value: 0 } };
  const skyMat = new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform float uK; varying vec2 vUv; void main(){ float g = mix(0.012, 0.9, uK) * mix(1.25, 0.55, vUv.y) + uK*0.25*smoothstep(0.35,0.0,vUv.y); gl_FragColor = vec4(vec3(g),1.); }' });
  const sky = add(scene, new THREE.PlaneGeometry(6, 3), skyMat, { cast: false, recv: false, flat: true }); sky.position.set(1.5, 1.5, -3.5);
  { // distant fields and the telescope silhouette through the window
    const SIL = glow(0.0);
    const hill = add(scene, new THREE.PlaneGeometry(8, 0.9), SIL, { cast: false, recv: false }); hill.position.set(1.5, 0.75, -3.3);
    const tel = new THREE.Group(); tel.position.set(1.85, 1.15, -3.2); scene.add(tel);
    const bowl = add(tel, new THREE.SphereGeometry(0.42, 32, 12, 0, Math.PI * 2, 0, 0.75), SIL, { cast: false }); bowl.rotation.x = Math.PI + 0.5; bowl.position.y = 0.36;
    [-0.33, 0.33].forEach(x => { rod(tel, V(x, -0.05, 0), V(x * 0.95, 0.38, 0), 0.025, SIL, 6, { cast: false }); rod(tel, V(x - 0.12, -0.05, 0), V(x * 0.95, 0.38, 0), 0.02, SIL, 6, { cast: false }); });
    rod(tel, V(0, 0.2, 0.05), V(0, 0.62, 0.32), 0.012, SIL, 6, { cast: false });
  }
  // ---------- desk ----------
  box(scene, 2.95, 0.04, 0.8, 0.22, DESK_Y - 0.02, -0.17, WOOD);
  box(scene, 2.95, 0.7, 0.03, 0.22, DESK_Y - 0.4, -0.56, DARK);
  [-1.2, 1.64].forEach(x => box(scene, 0.42, 0.72, 0.76, x, 0.38, -0.17, grey(0.38)));
  // ---------- oscilloscope ----------
  const scope = new THREE.Group(); scope.position.set(-0.85, DESK_Y, -0.22); scope.rotation.y = 0.32; scene.add(scope);
  box(scope, 0.34, 0.3, 0.42, 0, 0.15, 0, grey(0.22, { r: 0.5 }));
  box(scope, 0.3, 0.26, 0.012, 0, 0.15, 0.212, grey(0.3, { r: 0.45 }));
  const SCR_Y = 0.17, SCR_R = 0.082;
  const scrC = document.createElement('canvas'); scrC.width = scrC.height = 512; const scrTex = canvasTex(scrC, { mip: false });
  const screen = add(scope, new THREE.CircleGeometry(SCR_R, 64), new THREE.MeshBasicMaterial({ map: scrTex }), { cast: false, recv: false, flat: true }); screen.position.set(-0.03, SCR_Y, 0.2195);
  const bez = add(scope, new THREE.TorusGeometry(SCR_R + 0.008, 0.009, 12, 64), MET); bez.position.set(-0.03, SCR_Y, 0.223);
  const bez2 = add(scope, new THREE.TorusGeometry(SCR_R + 0.022, 0.005, 10, 64), DARK); bez2.position.set(-0.03, SCR_Y, 0.221);
  [[0.115, 0.24], [0.115, 0.17], [0.115, 0.1], [-0.03, 0.05], [0.05, 0.05]].forEach(([x, y]) => { const k = cyl(scope, 0.016, 0.016, 0.02, x, y, 0.225, grey(0.75, { r: 0.4 }), 20); k.rotation.x = Math.PI / 2; box(scope, 0.004, 0.012, 0.004, x, y + 0.008, 0.236, DARK); });
  function drawScope(t) {
    const g = scrC.getContext('2d'); g.fillStyle = '#060606'; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(120,120,120,1)'; g.lineWidth = 3;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 128, 40); g.lineTo(i * 128, 472); g.stroke(); g.beginPath(); g.moveTo(40, i * 128); g.lineTo(472, i * 128); g.stroke(); }
    // the trace: a facsimile line — sync pulse, then the picture tone, sweeping once per sync
    for (let k = 3; k >= 0; k--) {
      const tt = t - k * 0.035; const ph = ((tt - T.C0) / SYNC % 1 + 1) % 1;
      g.strokeStyle = k ? `rgba(255,255,255,${0.35 - k * 0.08})` : '#fff'; g.lineWidth = k ? 7 : 9; g.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = i / 160, line = Math.floor((tt - T.C0) / SYNC);
        const sync = x < 0.06 ? -1 : 0;
        const r = mulberry(line * 977 + Math.floor(x * 40));
        const tone = 0.55 * Math.sin(x * 21 + line) * Math.sin(x * 7.3 + line * 2.1) + 0.25 * (r() - 0.5);
        const y = 256 - 150 * (sync ? -0.9 : tone) * (x < ph ? 1 : 0.25);
        i ? g.lineTo(40 + x * 432, y) : g.moveTo(40 + x * 432, y);
      }
      g.stroke();
    }
    scrTex.needsUpdate = true;
  }
  // ---------- chart recorder ----------
  const rec = new THREE.Group(); rec.position.set(-0.36, DESK_Y, -0.2); rec.rotation.y = 0.12; scene.add(rec);
  box(rec, 0.3, 0.2, 0.3, 0, 0.1, 0, grey(0.6, { r: 0.5 }));
  box(rec, 0.26, 0.05, 0.012, 0, 0.17, 0.152, DARK);
  const chC = document.createElement('canvas'); chC.width = 512; chC.height = 768; const chTex = canvasTex(chC);
  const chart = add(rec, new THREE.PlaneGeometry(0.2, 0.3), printMat(chTex, { e: 0.05 }), { cast: false }); chart.rotation.x = -1.15; chart.position.set(0, 0.17, 0.27);
  const pen = new THREE.Group(); rec.add(pen); pen.position.set(0, 0.2, 0.2);
  rod(pen, V(0, 0, 0), V(0, -0.02, 0.07), 0.003, MET, 6); box(pen, 0.012, 0.018, 0.012, 0, -0.022, 0.075, DARK);
  const sawAt = tt => { const ph = ((tt - T.C0) / SYNC % 1 + 1) % 1; return ph < 0.85 ? ph / 0.85 : 1 - (ph - 0.85) / 0.15; };
  function drawChart(t) {
    const g = chC.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 768);
    g.strokeStyle = '#000'; g.lineWidth = 2;
    for (let x = 64; x < 512; x += 96) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 768); g.stroke(); }
    const sc = 140;  // px per second of paper
    for (let y = 768 - ((t * sc) % 96); y > -96; y -= 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.lineWidth = 6; g.beginPath();
    for (let y = 0; y <= 768; y += 3) { const tt = t - (768 - y) / sc; const x = 70 + 370 * sawAt(tt); y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); chTex.needsUpdate = true;
    pen.position.x = (70 + 370 * sawAt(t)) / 512 * 0.2 - 0.1;
  }
  // ---------- duty log ----------
  const log = new THREE.Group(); log.position.set(0.17, DESK_Y + 0.012, -0.03); log.rotation.y = -0.1; scene.add(log);
  box(log, 0.47, 0.012, 0.33, 0, -0.006, 0, DARK);
  const PW = 0.225, PH = 0.31, CW = 1400, CH = Math.round(1400 * PH / PW);
  const pageGeo = (side) => { const g = new THREE.PlaneGeometry(PW, PH, 24, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + PW / 2; const u = side > 0 ? x / PW : 1 - x / PW; p.setZ(i, 0.012 * Math.sin(Math.min(1, u * 3) * Math.PI / 2) - 0.004 * u); } g.computeVertexNormals(); return g; };
  const leftPage = paperCanvas(CW, CH, (g, put) => {
    g.strokeStyle = '#000'; g.lineWidth = 3; for (let y = 230; y < CH - 60; y += 118) { g.beginPath(); g.moveTo(80, y); g.lineTo(CW - 60, y); g.stroke(); }
    put(null, 'DUTY LOG · MARK I', 90, 150, 'type', 64);
    put(null, '3 Feb', 90, 330, 'handEn', 72); put(null, 'Luna 9 down at 18:45 UT. Signal back after.', 90, 448, 'handEn', 58);
    put(null, 'Tone changed at 18:58. Taped all of it.', 90, 566, 'handEn', 58);
    put(null, 'Night quiet. Bowl parked at zenith.', 90, 684, 'handEn', 58);
  });
  const rightPage = paperCanvas(CW, CH, (g, put) => {
    g.strokeStyle = '#000'; g.lineWidth = 3; for (let y = 230; y < CH - 60; y += 118) { g.beginPath(); g.moveTo(80, y); g.lineTo(CW - 60, y); g.stroke(); }
    let y = 330; LOG_OLD.forEach(([tm, s]) => { put(null, tm, 90, y, 'handEn', 60, { stroke: 0.05 }); put(null, s, 290, y, 'handEn', 58, { stroke: 0.05 }); y += 118; });
    put('logcn', LOG_NEW.cn, 70, y + 110, 'hand', 98, { stroke: 0.08 }); put('logen', LOG_NEW.en, 90, y + 270, 'handEn', 112, { stroke: 0.06 });
    g.lineWidth = 7; g.beginPath(); g.moveTo(90, y + 290); g.lineTo(1100, y + 280); g.stroke();
  });
  const lp = add(log, pageGeo(-1), printMat(canvasTex(leftPage.canvas))); lp.rotation.x = -Math.PI / 2; lp.position.x = -PW / 2 - 0.004;
  const rpg = add(log, pageGeo(1), printMat(canvasTex(rightPage.canvas), { bias: 0.72, text: true })); rpg.rotation.x = -Math.PI / 2; rpg.position.x = PW / 2 + 0.004;
  rightPage.lines.forEach(l => regText(rpg, CW, CH, PW, PH, l, t => t < T.C0));
  // pencil
  { const pc = rod(log, V(-0.05, 0.008, 0.2), V(0.12, 0.008, 0.215), 0.0045, grey(0.65), 6); rod(log, V(0.12, 0.008, 0.215), V(0.135, 0.008, 0.216), 0.002, DARK, 6); }
  // ---------- the card, clipped to the right page ----------
  const card = new THREE.Group(); card.position.set(0.37, DESK_Y + 0.03, 0.085); card.rotation.y = 0.12; scene.add(card);
  const KW = 0.2, KH = 0.125, KCW = 1400, KCH = Math.round(1400 * KH / KW);
  const cardC = paperCanvas(KCW, KCH, (g, put) => {
    g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.moveTo(60, 150); g.lineTo(KCW - 60, 150); g.stroke();
    put('cardcn', CARD.cn, 80, 450, 'hand', 150, { stroke: 0.07 }); put('carden', CARD.en, 80, 700, 'handEn', 92, { stroke: 0.07 });
  });
  const cg = new THREE.PlaneGeometry(KW, KH, 20, 8); { const p = cg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.006 * Math.pow((y + KH / 2) / KH, 2) + 0.004 * Math.pow(x / KW * 2, 2)); } cg.computeVertexNormals(); }
  const cm = add(card, cg, printMat(canvasTex(cardC.canvas), { bias: 0.72, text: true })); cm.rotation.x = -Math.PI / 2 + 0.03;
  cardC.lines.forEach(l => regText(cm, KCW, KCH, KW, KH, l, t => t < T.C0));
  { // paperclip over the card's top-left corner
    const pts = [[0, 0], [0.0, 0.045], [0.012, 0.05], [0.024, 0.045], [0.024, 0.006], [0.014, 0.002], [0.006, 0.006], [0.006, 0.036]].map(([x, z]) => V(-KW / 2 + 0.03 + x, 0.006, -KH / 2 - 0.012 + z));
    add(card, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0012, 6), grey(0.8, { r: 0.25 }));
  }
  // ---------- tea, chair, speaker, lamp ----------
  { const cup = new THREE.Group(); cup.position.set(0.66, DESK_Y, -0.12); scene.add(cup);
    add(cup, new THREE.LatheGeometry([[0, 0], [0.03, 0.002], [0.036, 0.02], [0.042, 0.07], [0.04, 0.072], [0.034, 0.02], [0, 0.012]].map(p => new THREE.Vector2(p[0], p[1])), 32), CREAM);
    add(cup, new THREE.CylinderGeometry(0.075, 0.06, 0.008, 40), CREAM).position.y = 0.002;
    const h = add(cup, new THREE.TorusGeometry(0.018, 0.005, 8, 20, Math.PI * 1.2), CREAM); h.position.set(0.045, 0.045, 0); h.rotation.z = -Math.PI * 0.6;
    const tea = add(cup, new THREE.CircleGeometry(0.036, 32).rotateX(-Math.PI / 2), grey(0.1)); tea.position.y = 0.058; }
  const chair = new THREE.Group(); chair.position.set(-0.5, 0, 0.62); chair.rotation.y = 0.5; scene.add(chair);
  { const LEATHER = grey(0.2, { r: 0.55 });
    box(chair, 0.46, 0.07, 0.44, 0, 0.47, 0, LEATHER);
    const bk = add(chair, new THREE.CylinderGeometry(0.4, 0.4, 0.36, 24, 1, true, -0.55, 1.1), LEATHER); bk.position.set(0, 0.74, -0.02); bk.scale.set(1, 1, 0.6); bk.rotation.y = Math.PI;
    rod(chair, V(0, 0.44, 0), V(0, 0.12, 0), 0.025, MET);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; rod(chair, V(0, 0.1, 0), V(Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3), 0.018, MET); add(chair, new THREE.SphereGeometry(0.025, 10, 8), DARK).position.set(Math.cos(a) * 0.3, 0.025, Math.sin(a) * 0.3); } }
  { const sp = new THREE.Group(); sp.position.set(-0.4, 1.42, -0.5); scene.add(sp); box(sp, 0.32, 0.22, 0.16, 0, 0, 0, WOOD); box(sp, 0.36, 0.02, 0.22, 0, -0.12, 0.0, DARK);
    for (let i = 0; i < 7; i++) box(sp, 0.24, 0.008, 0.004, 0, -0.07 + i * 0.022, 0.081, DARK); }
  const lampG = new THREE.Group(); lampG.position.set(0.92, DESK_Y, -0.38); scene.add(lampG);
  { cyl(lampG, 0.07, 0.08, 0.025, 0, 0.012, 0, DARK, 24); rod(lampG, V(0, 0.02, 0), V(-0.08, 0.36, 0.08), 0.008, MET); rod(lampG, V(-0.08, 0.36, 0.08), V(-0.3, 0.42, 0.3), 0.008, MET);
    const shade = add(lampG, new THREE.ConeGeometry(0.07, 0.11, 24, 1, true), DARK); shade.position.set(-0.32, 0.38, 0.33); shade.rotation.set(0.6, 0, -0.5);
    add(lampG, new THREE.SphereGeometry(0.022, 12, 8), glow(3), { cast: false, flat: true }).position.set(-0.33, 0.345, 0.35); }
  // ---------- the receiver (now on the desk by the window) ----------
  { const rv = new THREE.Group(); rv.position.set(1.12, DESK_Y, -0.33); rv.rotation.y = -0.12; scene.add(rv);
    box(rv, 0.5, 0.07, 0.32, 0, 0.035, 0, grey(0.32)); [-1, 1].forEach(s => box(rv, 0.02, 0.24, 0.22, s * 0.17, 0.17, 0, grey(0.32)));
    const d = cyl(rv, 0.085, 0.085, 0.31, 0, 0.17, 0, grey(0.85, { r: 0.4 }), 40); d.rotation.z = Math.PI / 2; box(rv, 0.3, 0.008, 0.012, 0, 0.255, -0.02, DARK); }

  // ---------- the clothesline and the prints ----------
  const LINE_Z = -0.4, LINE_Y = 1.66;
  const sag = x => LINE_Y - 0.05 * (1 - Math.pow((x - 1.5) / 0.95, 2));
  { const pts = []; for (let i = 0; i <= 30; i++) { const x = lerp(0.55, 2.45, i / 30); pts.push(V(x, sag(x), LINE_Z)); } add(scene, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0025, 5), grey(0.75));
    [0.55, 2.45].forEach(x => box(scene, 0.02, 0.05, 0.25, x, LINE_Y, -0.5, MET)); }
  const IW = 0.12, IH = 0.18, BORD = 0.012;
  const edgeC = paperCanvas(1600, 60, (g, put) => put(null, PHOTO_EDGE, 20, 46, 'type', 40));
  const edgeTex = canvasTex(edgeC.canvas);
  const PEG = grey(0.55, { r: 0.8 });
  function hangPrint(dots, x, curl, seed) {
    const g = new THREE.Group(); scene.add(g); const top = sag(x);
    g.position.set(x, top - 0.012 - IH / 2 - BORD, LINE_Z + 0.004);
    const back = new THREE.PlaneGeometry(IW + 2 * BORD, IH + 2 * BORD + 0.012, 12, 16); { const p = back.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, curl * Math.pow((IH / 2 - y) / IH, 2)); } back.computeVertexNormals(); }
    const bm = add(g, back, grey(0.92, { side: THREE.DoubleSide, e: 0.02 })); bm.position.set(0, -0.004, -0.0008);
    const img = new THREE.PlaneGeometry(IW, IH, 12, 16); { const p = img.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, curl * Math.pow((IH / 2 - y) / IH, 2)); } img.computeVertexNormals(); }
    const im = add(g, img, printMat(dots.tex, { e: 0.03 }));
    const eg = add(g, new THREE.PlaneGeometry(IW, 0.0045), printMat(edgeTex)); eg.position.set(0, -IH / 2 - 0.007, curl * 1.0 + 0.0005);
    [-0.035, 0.035].forEach(dx => { const pg = new THREE.Group(); g.add(pg); pg.position.set(dx, IH / 2 + BORD + 0.006, 0.004); box(pg, 0.012, 0.055, 0.008, 0, 0, 0, PEG); box(pg, 0.013, 0.004, 0.01, 0, 0.004, 0, MET); });
    return { g, im, x, base: g.position.clone(), seed };
  }
  const hung = [hangPrint(prints.others[1], 0.86, 0.012, 1), hangPrint(prints.others[0], 1.26, 0.008, 2), hangPrint(prints.others[2], 1.66, 0.014, 3), hangPrint(prints.jod, 2.06, 0.0, 4)];
  const P4 = hung[3];
  // ---------- the official print on the desk, with its typed tag ----------
  const off = new THREE.Group(); off.position.set(1.4, DESK_Y + 0.15, 0.05); off.rotation.set(1.18, 0.3, 0, 'YXZ'); scene.add(off);
  const OW = 0.24, OH = 0.18;
  { const bg = new THREE.PlaneGeometry(OW + 0.024, OH + 0.12, 16, 12); { const p = bg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, 0.01 * Math.pow(x / OW * 2, 4)); } bg.computeVertexNormals(); }
    const b = add(off, bg, grey(0.93, { side: THREE.DoubleSide, e: 0.03 })); b.rotation.x = -Math.PI / 2; b.position.z = -0.03;
    const ig = new THREE.PlaneGeometry(OW, OH, 16, 12); { const p = ig.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, 0.01 * Math.pow(x / OW * 2, 4) + 0.0006); } ig.computeVertexNormals(); }
    const m = add(off, ig, printMat(prints.off.tex, { e: 0.03 })); m.rotation.x = -Math.PI / 2; }
  const TW = 0.24, TH = 0.09, TCW = 1600, TCH = 600;
  const tagC = paperCanvas(TCW, TCH, (g, put) => { put('offcn', OFFICIAL_TAG.cn, 800, 250, 'sans', 190, { weight: 900, align: 'center', fit: 1500 }); put('offen', OFFICIAL_TAG.en, 800, 520, 'anton', 150, { align: 'center', fit: 1500 }); });
  const tagG = new THREE.PlaneGeometry(TW, TH, 24, 2); { const p = tagG.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.01 * Math.pow(p.getX(i) / OW * 2, 4) + 0.0004); tagG.computeVertexNormals(); }
  const tag = add(off, tagG, printMat(canvasTex(tagC.canvas), { bias: 0.7, text: true })); tag.rotation.x = -Math.PI / 2; tag.rotation.z = 0.0; tag.position.set(0, 0.0016, -OH / 2 - 0.05);
  tagC.lines.forEach(l => regText(tag, TCW, TCH, TW, TH, l, t => t >= T.F0, 22));

  // ---------- wall clock (hands race through the night in shot 6) ----------
  const clock = new THREE.Group(); clock.position.set(0.42, 1.98, -0.6); scene.add(clock);
  add(clock, new THREE.CylinderGeometry(0.13, 0.13, 0.03, 48).rotateX(Math.PI / 2), grey(0.9, { e: 0.03 })).position.z = 0.015;
  add(clock, new THREE.TorusGeometry(0.13, 0.012, 8, 48), DARK).position.z = 0.03;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(clock, 0.006, i % 3 ? 0.014 : 0.026, 0.004, Math.sin(a) * 0.11, Math.cos(a) * 0.11, 0.032, DARK).rotation.z = -a; }
  const hHand = new THREE.Group(), mHand = new THREE.Group(); clock.add(hHand, mHand); hHand.position.z = mHand.position.z = 0.036;
  box(hHand, 0.012, 0.065, 0.003, 0, 0.03, 0, DARK); box(mHand, 0.007, 0.1, 0.003, 0, 0.045, 0.002, DARK);
  const pend = new THREE.Group(); pend.position.set(0.42, 1.84, -0.585); scene.add(pend);
  box(scene, 0.12, 0.3, 0.025, 0.42, 1.72, -0.6, WOOD);
  rod(pend, V(0, 0, 0), V(0, -0.2, 0), 0.003, MET); add(pend, new THREE.CylinderGeometry(0.025, 0.025, 0.006, 24).rotateX(Math.PI / 2), MET).position.y = -0.2;

  // ---------- lights ----------
  const lampLight = new THREE.SpotLight(0xffffff, 4.5, 4, 0.9, 0.6, 1.2); lampLight.position.set(0.59, DESK_Y + 0.36, -0.03); lampLight.target.position.set(0.3, DESK_Y, 0.0);
  lampLight.castShadow = true; lampLight.shadow.mapSize.set(2048, 2048); lampLight.shadow.bias = -0.0004; scene.add(lampLight, lampLight.target);
  const ceil = new THREE.HemisphereLight(0xffffff, 0x333333, 0.35); scene.add(ceil);
  const scopeFill = new THREE.PointLight(0xffffff, 0.5, 1.2, 1.5); scopeFill.position.set(-0.65, 1.0, 0.25); scene.add(scopeFill);
  const day = new THREE.DirectionalLight(0xffffff, 0); day.position.set(1.0, 2.6, -4); day.target.position.set(1.2, 1.0, 0.5); day.castShadow = true; day.shadow.mapSize.set(2048, 2048);
  Object.assign(day.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 1, far: 10 }); scene.add(day, day.target);
  const printFill = new THREE.PointLight(0xffffff, 0, 3, 1.2); printFill.position.set(1.7, 1.75, 0.9); scene.add(printFill);
  const offFill = new THREE.SpotLight(0xffffff, 0, 2.5, 0.5, 0.6, 1.0); offFill.position.set(1.9, 1.5, 0.9); offFill.target.position.set(1.4, DESK_Y + 0.15, 0.05); scene.add(offFill, offFill.target);

  // ---------- cameras ----------
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.01, 40);
  // B: match on the scope screen (seen from above, 3/4), pull back, track right along the desk, hold on log + card
  const scrW = new THREE.Vector3(); const scrN = new THREE.Vector3();
  scope.updateMatrixWorld(true); screen.getWorldPosition(scrW); scrN.set(0, 0, 1).applyQuaternion(scope.quaternion);
  const viewDir = scrN.clone().multiplyScalar(-1).applyAxisAngle(new THREE.Vector3(1, 0, 0).applyQuaternion(scope.quaternion), 0.5).normalize(); // 0.5 rad from above
  const startPos = scrW.clone().addScaledVector(viewDir, -0.24);
  const B_KEYS = [
    [T.B0, startPos, scrW.clone()],
    [T.B0 + 1.0, scrW.clone().addScaledVector(viewDir, -0.62).add(V(0.05, 0.02, 0.05)), scrW.clone().add(V(0.12, -0.08, 0))],
    [T.B0 + 1.9, V(-0.42, 1.22, 0.42), V(-0.38, DESK_Y + 0.12, -0.18)],
    [T.B0 + 2.6, V(0.02, 1.12, 0.4), V(0.12, DESK_Y + 0.02, -0.04)],
    [T.B0 + 3.1, V(0.33, 1.04, 0.3), V(0.32, DESK_Y + 0.01, -0.0)],
    [T.C0, V(0.345, 1.025, 0.285), V(0.325, DESK_Y + 0.01, 0.0)],
  ];
  const bp = [0, 1, 2].map(i => monotone(B_KEYS.map(k => [k[0], k[1].getComponent(i)])));
  const bt = [0, 1, 2].map(i => monotone(B_KEYS.map(k => [k[0], k[2].getComponent(i)])));
  // F: start exactly on the band of the newest print (it fills the frame as the Moon did), pull back, track left, settle
  const band = prints.band;
  P4.g.updateMatrixWorld(true);
  const bandY = IH / 2 - band.yc * IH;
  const fovF = 40, dF = (IW / 2) / Math.tan(Math.atan(Math.tan(fovF * Math.PI / 360) * 16 / 9));
  const f0 = P4.g.localToWorld(V(0, bandY, 0)), f0p = P4.g.localToWorld(V(0, bandY, dF));
  const F_KEYS = [
    [T.F0, f0p, f0],
    // the pull off the print is the closest the camera gets to anything: an extra key at 2.5× the distance keeps the
    // first half second to ~6 % shrink per frame (it was a 20 %-per-frame crash pull that re-dithered the whole frame)
    [T.F0 + 0.5, f0.clone().addScaledVector(f0p.clone().sub(f0), 2.5), f0.clone()],
    [T.F0 + 1.0, V(2.08, 1.5, 0.38), V(1.9, 1.42, -0.4)],
    [T.F0 + 1.5, V(1.86, 1.3, 0.95), V(1.45, 1.12, -0.2)],
    [T.F0 + 2.9, V(1.67, 1.13, 0.68), V(1.36, 1.1, -0.2)],
    [T.G0, V(1.665, 1.128, 0.675), V(1.36, 1.1, -0.2)],
  ];
  const fp = [0, 1, 2].map(i => monotone(F_KEYS.map(k => [k[0], k[1].getComponent(i)])));
  const ft = [0, 1, 2].map(i => monotone(F_KEYS.map(k => [k[0], k[2].getComponent(i)])));

  // ease-in warp for the first `a` seconds after a cut: velocity starts at zero (the shot before lands still), path and
  // timing after `a` unchanged. w(s) = 2s²/a − s³/a²: w(0) = 0, w'(0) = 0, w(a) = a, w'(a) = 1.
  const easeIn = (t, t0, a) => { const s = t - t0; if (s <= 0) return t0; if (s >= a) return t; return t0 + 2 * s * s / a - s * s * s / (a * a); };
  const night = t => t < T.F0 ? 0 : ss(seg(t, T.F0 + 0.5, T.F0 + 3.4));
  function update(t) {
    const isF = t >= T.F0 - 0.4;   // the print is shown from the fax scan on (it starts 0.3 s before F0)
    drawScope(t); drawChart(isF ? T.C0 - 0.4 : t);
    const k = night(t); skyU.uK.value = k;
    day.intensity = 2.4 * k; printFill.intensity = isF ? 1.2 : 0; offFill.intensity = isF ? 3 : 0; ceil.intensity = 0.3 + 0.35 * k;
    lampLight.intensity = isF ? lerp(3.5, 1.5, k) : 4.5;
    off.visible = isF;
    hung.forEach((h, i) => { h.g.visible = isF; const s = isF ? Math.max(0, t - T.F0) : 0; h.g.rotation.z = (i === 3 ? 0.006 * Math.sin(s * 2.1) * ss(seg(t, T.F0 + 0.4, T.F0 + 1.4)) : 0.03 * Math.sin(s * 1.7 + h.seed)); h.g.rotation.y = i === 3 ? 0 : 0.12 * Math.sin(s * 1.1 + h.seed * 2); });
    // clock: hands race from 1 a.m. to 7 a.m. through shot 6; pendulum swings faster
    const hrs = isF ? lerp(1.1, 7.3, ss(seg(t, T.F0 + 0.3, T.F0 + 3.6))) : 23.2 + (t - T.B0) / 3600;
    hHand.rotation.z = -hrs / 12 * Math.PI * 2; mHand.rotation.z = -hrs * Math.PI * 2;
    pend.rotation.z = 0.18 * Math.sin((isF ? (t - T.F0) * (6 + 14 * k) : t * Math.PI * 2 / 1.0));
    let p, tg;
    if (!isF) { const tt = easeIn(t, T.B0, 0.5); p = V(...bp.map(f => f(tt))); tg = V(...bt.map(f => f(tt))); }
    else { const tt = easeIn(Math.max(t, T.F0), T.F0, 0.5); p = V(...fp.map(f => f(tt))); tg = V(...ft.map(f => f(tt))); }
    camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); camera.fov = isF ? lerp(fovF, 47, ss(seg(t, T.F0 + 0.6, T.F0 + 2.6))) : 40; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // focus: B racks along the desk; F on the print, then the desk
    const focus = p.distanceTo(tg);
    return { exp: isF ? lerp(1.0, 0.9, k) : 1.0, lo: 0.08, hi: 0.82, edgeK: 0.04, ap: isF ? (t < T.F0 + 0.6 ? 0 : 1.2) : (t < T.B0 + 0.8 ? 0 : 1.4), focus, maxCoc: 6 };
  }
  function textsAt(t, W, H) {
    const out = [];
    for (const x of texts) {
      if (!x.when(t)) continue;
      const b = screenBox(x.mesh, x.corners, camera, W, H); if (!b) continue;
      if ((b.y1 - b.y0) < x.minPx * H / 1080) continue;
      out.push({ id: x.id, text: x.text, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
    }
    return out;
  }
  return { scene, camera, update, texts: textsAt };
}
