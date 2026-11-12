// THE DISASSEMBLY LINE · full-film timeline (52.0 s of story time, 1920×1080; the film is 54.9 s, see STORY() below)
// The film is one single world (the paper + a cutaway of a running body); the camera pushes, tracks, follows and passes through it:
//   ① 0–4.4 tracking with the cargo: the assembly line puts the sandwich together   ② 4.4–9.0 hanging title settles → push into the mouth door (through a shape)
//   ③ 9.0–12.35 crushers   ↓ 12.35–13.3 plunge down the chute (floor slabs sweep past)   ④ 13.3–20.9 drum → track to the gatekeeper
//   ⑤ 20.9–33.0 match cut: the same lump drops into the sorter → pull out to the whole floor, three lines start one by one, hold
//   ⑥ 33.0–37.7 colour follow: only the yellow pipe, up into the warehouse, clock fast-forwards   ⑦ 37.7–44.75 alarm → porthole POV → plunge down the artery → furnaces ignite
//   ⑧ 44.75–52.0 big pull-out: the whole person running, the full line lights up, end plaque

let TL, K;
let ZL = 1, VB = [0, 0, 1920, 1080];
window.DUR = 54.9;   // set from cues.json in boot()

// ---------- Camera ----------
const W = (x, y) => [x + BX0, y];                      // BL → world
const T2W = (x, y) => [x + TOX + BX0, y + TOY];         // TL → world
function toScreen(cam, x, y) { return [960 + (x - cam.x) * cam.z, 540 + (y - cam.y) * cam.z]; }
const mix3 = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) });

function camera(t) {
  // ① tracking with the cargo → ② title composition
  if (t < K.cut3) {
    const follow = { x: sandX(t) + 180, y: 520, z: lerp(1.06, 1.0, ss(seg(t, 0, 4.4))) };
    const title = { x: 960, y: 540, z: 1 + .03 * ss(seg(t, 5.2, 8.3)) };
    let c = mix3(follow, title, eio(seg(t, 3.0, 5.0)));
    // push into the mouth door: through a shape
    const p = seg(t, 8.3, K.cut3);
    if (p > 0) { const door = { x: BX0 + 1074, y: 608, z: 9 }; const e = ei(p); c = { x: lerp(c.x, door.x, eo(p)), y: lerp(c.y, door.y, eo(p)), z: Math.exp(lerp(Math.log(c.z), Math.log(door.z), e)) }; }
    return c;
  }
  // ③ crushers
  const mouth = { x: BX0 + 1420, y: 630, z: 1.0 };
  if (t < K.tilt[0]) return { x: mouth.x, y: mouth.y, z: lerp(1.55, 1.72, eo(seg(t, K.cut3, 10.4))) + .03 * ss(seg(t, 10.4, 12.3)) };
  // ↓ plunge to the stomach
  const drumV = { x: T2W(860, 0)[0], y: T2W(0, 10)[1], z: 1.2 };
  if (t < K.tilt[1]) { const u = eio(seg(t, K.tilt[0], K.tilt[1])); return { x: lerp(mouth.x, drumV.x, u), y: lerp(mouth.y, drumV.y, u), z: Math.exp(lerp(Math.log(1.75), Math.log(1.2), u)) }; }
  // ④ drum → track to the gatekeeper → follow the spoonful down
  const gateV = { x: T2W(1500, 0)[0], y: T2W(0, 10)[1], z: 1.32 };
  if (t < K.cut5) {
    let c = mix3({ ...drumV, z: 1.2 + .03 * seg(t, 13.3, 15.9) }, gateV, eio(seg(t, K.panGate[0], K.panGate[1])));
    const f = ss(seg(t, K.spoons[1] + .1, K.cut5));
    c.y += f * 150; c.x += f * 60;
    return c;
  }
  // ⑤ match cut: the same lump drops into the hopper → pull out to the whole floor → hold
  const hop = { x: T2W(SPOUT, 0)[0], y: T2W(0, 300)[1], z: 2.0 };
  const sortV = { x: T2W(1010, 0)[0], y: T2W(0, 548)[1], z: 1.12 };
  if (t < K.follow[0]) {
    if (t < 21.55) return { x: hop.x, y: lerp(hop.y, hop.y + 60, ss(seg(t, K.cut5, 21.55))), z: 2.0 };
    const u = eio(seg(t, 21.55, 22.9));
    const c = mix3({ x: hop.x, y: hop.y + 60, z: 2.0 }, sortV, u);
    c.z *= 1 + .045 * ss(seg(t, 22.9, 30.2));
    return c;
  }
  // ⑥ colour follow: one sugar cube up the yellow pipe into the warehouse
  const whV = { x: T2W(1270, 0)[0], y: T2W(0, -500)[1], z: 1.38 };
  if (t < K.alarm) {
    const keys = [[33.0, [T2W(860, 0)[0], T2W(0, 470)[1], 1.17]], [33.55, [T2W(600, 0)[0], T2W(0, 380)[1], 1.3]], [34.05, [T2W(640, 0)[0], T2W(0, -120)[1], 1.3]], [34.7, [whV.x, whV.y, whV.z]]];
    const fx = monotone(keys.map(k => [k[0], k[1][0]])), fy = monotone(keys.map(k => [k[0], k[1][1]])), fz = monotone(keys.map(k => [k[0], k[1][2]]));
    const c = { x: fx(t), y: fy(t), z: fz(t) };
    // during the fast-forward, a very slow push in on the clock and the dozing worker
    const q = ss(seg(t, K.clockFF[0], K.alarm));
    c.x += q * 120; c.y -= q * 30; c.z *= 1 + .06 * q;
    if (t > 34.7 && t < K.clockFF[0]) c.z *= 1 + .02 * ss(seg(t, 34.7, K.clockFF[0]));
    return c;
  }
  // ⑦ alarm (warehouse) → control room → porthole POV → back to the warehouse → plunge down the artery → furnace room
  const shake = (a, d, amp) => pulse(t, a, d) * amp * Math.sin(t * 90);
  if (t < K.cutCtrl) return { x: whV.x + 120 + shake(K.alarm, .35, 10), y: whV.y - 30, z: whV.z * 1.06 };
  const ctrl = { x: W(1320, 0)[0], y: 210, z: 1.7 };
  if (t < K.cutWh) return { x: ctrl.x, y: ctrl.y + shake(K.cutCtrl, .3, 6), z: ctrl.z * (1 + .04 * ss(seg(t, K.cutCtrl, K.iris[0]))) };
  const whRun = { x: T2W(1500, 0)[0], y: T2W(0, -470)[1], z: 1.3 };
  const furn = { x: T2W(1395, 0)[0], y: T2W(0, 1150)[1], z: 1.3 };
  if (t < K.whip[0]) return { x: lerp(whRun.x, whRun.x + 160, ss(seg(t, K.cutWh, K.whip[0]))), y: whRun.y, z: whRun.z };
  if (t < K.whip[1]) {
    const u = eio(seg(t, K.whip[0], K.whip[1]));
    // first line up with the artery to the right, then rush down along it, finally landing in the furnace room
    const art = T2W(1905, 0)[0];
    const x = u < .35 ? lerp(whRun.x + 160, art - 200, ss(u / .35)) : lerp(art - 200, furn.x, ss((u - .35) / .65));
    return { x, y: lerp(whRun.y, furn.y, u), z: lerp(1.3, 1.3, u) };
  }
  if (t < K.pull[0]) return { x: furn.x, y: furn.y, z: furn.z * (1 + .05 * ss(seg(t, K.whip[1], K.pull[0]))) };
  // ⑧ big pull-out: anchored on the furnace room, logarithmic zoom
  const z0 = furn.z * 1.05, z1 = 0.118;
  const A = [furn.x, furn.y];
  const P1 = [RUN.HX + 10, 610];                        // the furnace room ends up on the hip of the diagram figure, for a clean dissolve
  const u = eio(seg(t, K.pull[0], K.pull[1]));
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), u)) * (1 - .06 * ss(seg(t, K.pull[1], 46.6)));
  const P = [lerp(960, P1[0], u), lerp(540, P1[1], u)];
  return { x: A[0] - (P[0] - 960) / z, y: A[1] - (P[1] - 540) / z, z };
}

// ---------- One frame ----------
function world(t, cam) {
  ZL = cam.z;
  KS = cam.z < 1 ? Math.pow(cam.z, -0.6) : Math.pow(cam.z, -0.75);
  const m = 200 / cam.z;
  VB = [cam.x - 960 / cam.z - m, cam.y - 540 / cam.z - m, cam.x + 960 / cam.z + m, cam.y + 540 / cam.z + m];
  out(`<g transform="translate(960 540) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})">`);
  if (t < 9.6) drawPaperBack(t);
  drawBody(t);
  if (t < 9.6) { drawPaper(t); drawSandOutside(t); }
  out('</g>');
}
// ground line, speed lines behind, the bus (last shot only)
function finaleWorld(t) {
  const gy = GROUND;
  fillOnly(R(-20000, gy, 40000, 120), C.paperD);
  out(`<path d="M-20000 ${gy}H20000" stroke="${C.ink}" stroke-width="${f1(3 * KS)}"/>`);
  bus(-6451 + 2600 * 0 , gy, 5, t, { door: ss(seg(t, K.busDoor, K.busDoor + .8)) });
  // running speed lines (Holmes style): behind the figure
  for (const [y, x0, l] of [[1900, 3500, 1600], [3000, 3400, 2200], [4500, 3500, 1500], [6200, 4000, 1300]]) {
    const q = ss(seg(t, 46.2, 47.4)); if (q > .01) out(`<path d="M${x0 + BX0} ${y}H${f1(x0 + BX0 + l * q)}" stroke="${C.ink}" stroke-width="${f1(7 * KS)}" stroke-linecap="round"/>`);
  }
}
function drawPaperBack(t) { /* background layer of the paper: empty in the demo */ }

function frame(t) {
  S.length = 0; UID = 0;
  out(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">`);
  out(`<rect width="1920" height="1080" fill="${C.paper}"/>`);
  const cam = camera(t);
  // plunges / whip pans: directional blur by the camera's on-screen speed (one render, no ghosting) + speed lines
  const fast = (t > K.tilt[0] && t < K.tilt[1]) || (t > K.whip[0] && t < K.whip[1]);
  const wop = 1 - ss(seg(t, K.dissolve[0], K.dissolve[1]));      // ending: the world cutaway dissolves into the diagram figure
  if (wop > .001) {
    if (wop < .999) out(`<g opacity="${f1(wop * 1000) / 1000}">`);
    if (fast) {
      const dt = 1 / 48, a = camera(t - dt), b = camera(t + dt);
      const vx = (b.x - a.x) * cam.z / 2, vy = (b.y - a.y) * cam.z / 2;
      const sx = Math.min(26, Math.abs(vx) * .35), sy = Math.min(26, Math.abs(vy) * .35);
      out(`<defs><filter id="mb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f1(sx)} ${f1(sy)}"/></filter></defs>`);
      out(`<g filter="url(#mb)">`); world(t, cam); out('</g>');
      speedLines(t, cam, vy / 60);
    } else world(t, cam);
    if (wop < .999) out('</g>');
  }
  KS = 1; ZL = 1;
  pov(t, cam);
  if (t > 45.9) { KS = 1; runnerScene(t); endCard(t, cam); }
  subtitles(t);
  out('</svg>');
  return S.join('\n');
}

// ---------- Paper texture (generated once, laid on top) ----------
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
  const g = cv.getContext('2d'), im = g.createImageData(1920, 1080), d = im.data;
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < d.length; i += 4) { const v = 255 - rnd() * 34; d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 5; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  // fibres: very faint long horizontal streaks
  g.globalAlpha = .05; g.strokeStyle = '#6B5A40';
  for (let i = 0; i < 900; i++) { const x = rnd() * 1920, y = rnd() * 1080, l = 20 + rnd() * 80; g.lineWidth = .6 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd() - .5) * 4); g.stroke(); }
  cv.id = 'grain'; document.body.appendChild(cv);
}

// film time → story time: cues.json "stretch" slows story [at, at+story] down over film [at, at+story+add]
// (speed dips smoothly from 1 to about 0.02 and back), so the title signs hold longer without a cut. Same formula as tools/warp.py.
function STORY(f) {
  const s = K.stretch, L = s.story + s.add;
  if (f <= s.at) return f;
  if (f >= s.at + L) return f - s.add;
  const u = f - s.at;
  return s.at + u - (s.add / L) * (u - L / (2 * Math.PI) * Math.sin(2 * Math.PI * u / L));
}

async function boot() {
  TL = await (await fetch('timeline.json')).json();
  K = await (await fetch('cues.json')).json();
  window.DUR = K.storyDur + K.stretch.add + K.tail;      // film length: the title hold is stretched, the last frame held longer
  await Promise.all([
    document.fonts.load('900 40px BSD', 'A'), document.fonts.load('800 40px BSD', 'A'), document.fonts.load('700 40px BSD', 'A'),
    document.fonts.load('800 40px ARC', 'A'), document.fonts.load('600 40px ARC', 'A'),
    document.fonts.load('700 40px XSans', '拆'), document.fonts.load('900 40px XSans', '拆'), document.fonts.load('500 40px XSans', '拆'),
  ]);
  await document.fonts.ready;
  makeGrain();
  window.render = t => { document.getElementById('stage').innerHTML = frame(Math.min(STORY(t), K.storyDur - .001)); };
  // readcheck (core/render/readcheck.mjs): every piece of text on screen and its screen box; the work-order subtitles do not count (their timing comes from the .srt).
  // reports only visible text: cumulative opacity ≥ 0.5, on-screen glyph height ≥ 14 px, intersecting the frame.
  window.TEXTS = t => {
    window.render(t);
    const res = [];
    for (const el of document.querySelectorAll('#stage text')) {
      if (el.closest('[data-sub]')) continue;
      let op = 1;
      for (let n = el; n && n.id !== 'stage'; n = n.parentElement) { const o = n.getAttribute('opacity'); if (o != null) op *= +o; }
      if (op < .5) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 14 || r.right <= 0 || r.bottom <= 0 || r.left >= 1920 || r.top >= 1080) continue;
      const s = el.textContent.trim(); if (!s) continue;
      res.push({ id: s, text: s, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    }
    return res;
  };
  window.render(0);
  window.READY = true;
}
boot();
