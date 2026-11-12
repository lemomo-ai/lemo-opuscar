// The camera's own screen: colour scale, spot meters, area box, isotherm, hot-spot tracker, time stamp; world-anchored
// bilingual labels; the before/after report; the end card. Every piece of text to read is registered for window.TEXTS.
import * as THREE from 'three';
import { IRON_STOPS } from './glsl.js';
import { SENSOR } from './post.js';
import { LEAKY, B, yF, WINDOWS } from './layout.js';
import { clamp, lerp, seg, ss, sst, eo3, eio, hash1 } from './util.js';
import { CARS } from './street.js';

export function makeHud(cv, W, H) {
  const M = (window.__M = {});
  const g = cv.getContext('2d'); const S = W / 1920;
  let TX = [];
  const reg = (id, text, x0, y0, x1, y1) => TX.push({ id, text, x0, y0, x1, y1 });
  function ironCss(v) {
    v = clamp(v, 0, 1); for (let i = 1; i < IRON_STOPS.length; i++) if (v <= IRON_STOPS[i][0]) { const a = IRON_STOPS[i - 1], b = IRON_STOPS[i], f = (v - a[0]) / (b[0] - a[0]); return `rgb(${a[1].map((c, k) => Math.round(c + (b[1][k] - c) * f)).join(',')})`; }
    return 'rgb(255,250,219)';
  }
  // text with a dark halo; returns width
  function txt(s, x, y, size, o = {}) {
    g.font = `${o.w || 500} ${size * S}px ${o.font || 'Plex'}`; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'middle';
    g.globalAlpha = o.a ?? 1;
    if (o.halo !== false) { g.lineJoin = 'round'; g.lineWidth = (o.hw || 5) * S; g.strokeStyle = o.haloC || 'rgba(8,4,20,0.55)'; g.strokeText(s, x, y); }
    g.fillStyle = o.color || '#fff'; g.fillText(s, x, y);
    const w = g.measureText(s).width; g.globalAlpha = 1; return w;
  }
  const measure = (s, size, font = 'Plex', w = 500) => { g.font = `${w} ${size * S}px ${font}`; return g.measureText(s).width; };
  // register a text drawn with txt (left/centre/right aligned, middle baseline)
  function regTxt(id, s, x, y, size, o = {}, a = 1) {
    if (a < .999) return;
    const w = measure(s, size, o.font || 'Plex', o.w || 500); const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    reg(id, s, x0, y - size * S * .6, x0 + w, y + size * S * .6);
  }
  function T2(id, s, x, y, size, o = {}) { const a = o.a ?? 1; txt(s, x, y, size, o); regTxt(id, s, x, y, size, o, a); }
  // ------------------------------------------------------------------ measurements from the sensor buffer
  let sb = null;
  function sensorAt(px, py, r = 1) {   // px, py: canvas pixels (y down)
    const sx = Math.round(px / W * SENSOR.w), sy = Math.round((1 - py / H) * SENSOR.h); let s = 0, n = 0;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const xx = clamp(sx + i, 0, SENSOR.w - 1), yy = clamp(sy + j, 0, SENSOR.h - 1); s += sb[(yy * SENSOR.w + xx) * 4]; n++; }
    return s / n;
  }
  function boxStat(x0, y0, x1, y1) {  // canvas rect -> {avg, max, maxAt}
    const a = { s: 0, n: 0, max: -1e9, mx: 0, my: 0 };
    const sx0 = Math.max(0, Math.floor(x0 / W * SENSOR.w)), sx1 = Math.min(SENSOR.w - 1, Math.ceil(x1 / W * SENSOR.w));
    const sy0 = Math.max(0, Math.floor((1 - y1 / H) * SENSOR.h)), sy1 = Math.min(SENSOR.h - 1, Math.ceil((1 - y0 / H) * SENSOR.h));
    for (let y = sy0; y <= sy1; y++) for (let x = sx0; x <= sx1; x++) { const v = sb[(y * SENSOR.w + x) * 4]; a.s += v; a.n++; if (v > a.max) { a.max = v; a.mx = x; a.my = y; } }
    return { avg: a.s / Math.max(1, a.n), max: a.max, maxAt: [(a.mx + .5) / SENSOR.w * W, (1 - (a.my + .5) / SENSOR.h) * H] };
  }
  // displayed reading: measured value with the meter's own ±0.1 refresh jitter (6 Hz)
  const jit = (t, id) => (hash1(Math.floor(t * 6) * 7.3 + id * 13.1) - .5) * .22;
  const fmt = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
  // ------------------------------------------------------------------ primitives
  function cross(x, y, k, big = 1) {
    const r = 14 * S * big, grow = 1 + 2.2 * (1 - k) ** 2, a = Math.min(1, k * 3);
    g.save(); g.globalAlpha = a; g.lineWidth = 2 * S;
    const d = () => { const R = r * grow; g.beginPath(); g.arc(x, y, r * .55, 0, 7); g.moveTo(x - R * 1.6, y); g.lineTo(x - R * .9, y); g.moveTo(x + R * .9, y); g.lineTo(x + R * 1.6, y); g.moveTo(x, y - R * 1.6); g.lineTo(x, y - R * .9); g.moveTo(x, y + R * .9); g.lineTo(x, y + R * 1.6); g.stroke(); };
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.save(); g.translate(1.4 * S, 1.4 * S); d(); g.restore(); g.strokeStyle = '#fff'; d();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 1.8 * S, 0, 7); g.fill(); g.restore();
  }
  // a reading with a two-line name: value, Chinese, English
  function reading(id, x, y, val, cn, en, k, o = {}) {
    if (k <= .15) return;
    const a = Math.min(1, (k - .15) * 4);
    const dx = (o.left ? -1 : 1) * 30 * S, al = o.left ? 'right' : 'left';
    const vs = o.vsize || 34;
    if (o.nominal !== undefined && k >= 1) val = o.nominal + jit(o.t ?? 0, o.jid ?? 0);
    const vtxt = fmt(val) + ' °C';
    txt(vtxt, x + dx, y - 6 * S, vs, { align: al, a, font: 'Plex', w: 500 });
    if (a > .999) regTxt(id + '-v', fmt(o.nominal ?? val) + ' °C', x + dx, y - 6 * S, vs, { align: al });
    if (cn) T2(id + '-cn', cn, x + dx, y + 30 * S, 26, { align: al, a, font: 'SC', w: 500 });
    if (en) T2(id + '-en', en, x + dx, y + 58 * S, 21, { align: al, a, font: 'Inter', w: 500, color: 'rgba(255,255,255,.9)' });
  }
  // a label with a leader line to a world point
  function label(id, ax, ay, lx, ly, cn, en, k, o = {}) {
    if (k <= 0) return;
    const a = Math.min(1, k * 2.5);
    g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4 * S; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lx, ly); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 1.8 * S; const p = eo3(Math.min(1, k * 1.6)); g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, lx, p), lerp(ay, ly, p)); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ax, ay, 4 * S, 0, 7); g.fill(); g.restore();
    const al = o.align || (lx >= ax ? 'left' : 'right'); const dx = (al === 'left' ? 8 : -8) * S;
    T2(id + '-cn', cn, lx + dx, ly - 16 * S, o.cs || 28, { align: al, a, font: 'SC' });
    T2(id + '-en', en, lx + dx, ly + 16 * S, o.es || 22, { align: al, a, font: 'Inter', color: 'rgba(255,255,255,.92)' });
    if (o.val !== undefined) T2(id + '-v', fmt(o.val) + ' °C', lx + dx, ly + 46 * S, 26, { align: al, a, font: 'Plex' });
  }
  function boxFrame(x0, y0, x1, y1, a, col = '#fff') {
    g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 4 * S; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    g.strokeStyle = col; g.lineWidth = 2 * S; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    const c = 14 * S; g.lineWidth = 4 * S;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * c); g.lineTo(x, y); g.lineTo(x + sx * c, y); g.stroke(); }
    g.restore();
  }
  // colour scale on the right edge
  function scale(lo, hi, a, idp = 'sc') {
    if (a <= 0) return;
    const bx = 1838 * S, y0 = 170 * S, y1 = 880 * S, bw = 18 * S;
    g.save(); g.globalAlpha = a;
    for (let y = y0; y < y1; y++) { g.fillStyle = ironCss(1 - (y - y0) / (y1 - y0)); g.fillRect(bx, y, bw, 1.3); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2 * S; g.strokeRect(bx, y0, bw, y1 - y0);
    const step = (hi - lo) > 30 ? 10 : (hi - lo) > 14 ? 2 : 1;
    for (let v = Math.ceil(lo); v <= hi; v++) { if (v % step) continue; const y = y1 - (v - lo) / (hi - lo) * (y1 - y0); const maj = v % (step * 5) === 0; g.strokeStyle = '#fff'; g.lineWidth = 1.3 * S; g.beginPath(); g.moveTo(bx - (maj ? 11 : 5) * S, y); g.lineTo(bx, y); g.stroke(); }
    g.restore();
    T2(idp + '-hi', fmt(hi).replace('.0', ''), bx + bw / 2, y0 - 26 * S, 24, { align: 'center', a });
    T2(idp + '-lo', fmt(lo).replace('.0', ''), bx + bw / 2, y1 + 26 * S, 24, { align: 'center', a });
    txt('°C', bx + bw / 2, y0 - 58 * S, 20, { align: 'center', a, w: 400 });
  }
  function scalePointer(lo, hi, v, a) {
    const bx = 1838 * S, y0 = 170 * S, y1 = 880 * S, bw = 18 * S; const y = y1 - clamp((v - lo) / (hi - lo), 0, 1) * (y1 - y0);
    g.save(); g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx + bw + 3 * S, y); g.lineTo(bx + bw + 14 * S, y - 7 * S); g.lineTo(bx + bw + 14 * S, y + 7 * S); g.closePath(); g.fill(); g.restore();
  }
  function stamp(id, s, a, x = 46, y = 1028) { T2(id, s, x * S, y * S, 22, { a, font: 'Plex', w: 400, color: 'rgba(255,255,255,.92)' }); }
  // the thermal half-plane as a clip path (for split screens)
  function clipTherm(sp) {
    if (!Array.isArray(sp)) return;
    const [A, B] = sp; const d = new THREE.Vector2().subVectors(B, A).normalize(); const n = new THREE.Vector2(d.y, -d.x);
    // polygon: big quad on the + side, in canvas coordinates (y flipped)
    const P = (v) => [v.x, H - v.y]; const L = 1e4;
    const a1 = A.clone().addScaledVector(d, -L), b1 = A.clone().addScaledVector(d, L), c1 = b1.clone().addScaledVector(n, L), d1 = a1.clone().addScaledVector(n, L);
    g.beginPath(); [a1, b1, c1, d1].forEach((v, i) => { const [x, y] = P(v); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.clip();
  }
  const thermFrac = (sp) => sp === 'therm' ? 1 : sp === 'photo' ? 0 : null;

  // ------------------------------------------------------------------ per-shot content
  const PROJ = new THREE.Vector3();
  function P(cam, v) { PROJ.copy(v).project(cam); return [(PROJ.x * .5 + .5) * W, (1 - (PROJ.y * .5 + .5)) * H, PROJ.z < 1]; }
  const leakTop = new THREE.Vector3((LEAKY.x0 + LEAKY.x1) / 2 - .2, LEAKY.y1 - .05, -0.08);
  const wallPt = new THREE.Vector3(-2.75, yF(3) + 1.3, 0.0);
  // tracker anchors in the world (not the per-frame argmax of the noisy sensor buffer, which snaps to 3 px sensor cells
  // and flips between equally hot spots): the hottest point of the leak, measured from the buffer over 13.0-15.7 s and
  // unprojected onto the facade; the cat's left eye surface, in head space (cat.js places the eyes at x ±.0235)
  const LEAK_HOT = new THREE.Vector3(-2.330, 8.427, 0);
  const EYE_HOT = new THREE.Vector3(.0235, .011, .057);

  function draw(t, C) {
    TX = []; sb = C.post.sbuf; const cam = C.camera; const sp = C.sp;
    g.clearRect(0, 0, W, H);
    if (t >= 45.5) { endCard(t); return; }
    const tf = thermFrac(sp);
    // where is the thermal side, for anything screen-fixed
    let thermRight = true;
    if (Array.isArray(sp)) { const [A, Bp] = sp; const d = new THREE.Vector2().subVectors(Bp, A).normalize(); thermRight = d.y > 0; }
    g.save(); clipTherm(sp);
    const scaleA = sp === 'photo' ? 0 : 1;
    if (!C.dual && !(t >= C.T.s7 && t < C.T.s8cut)) scale(C.lo, C.hi, scaleA * (t < 2 ? sst(t, 1.0, 1.6) : 1), 'sc' + Math.round(C.lo) + Math.round(C.hi));
    // ---- S1/S2 frontal: spot meters on the window head and the wall, the slab-band label, the time stamp
    if (t < C.T.s3 + .4) {
      const k1 = seg(t, 5.0, 5.55), k2 = seg(t, 5.9, 6.45), out = 1 - seg(t, 10.2, 10.5);
      const [x1, y1] = P(cam, leakTop), [x2, y2] = P(cam, wallPt);
      M.sp1 = sensorAt(x1, y1, 1); M.sp2 = sensorAt(x2, y2, 2);
      if (k1 > 0) { cross(x1, y1, Math.min(1, k1 * 2.2) * out); reading('sp1', x1, y1, lerp(-6, STATE.sp1, eo3(k1)) + jit(t, 1) * (k1 >= 1), '窗缝上沿', 'Window head', k1 * out, { nominal: STATE.sp1, t, jid: 1 }); }
      if (k2 > 0) { cross(x2, y2, Math.min(1, k2 * 2.2) * out); reading('sp2', x2, y2, lerp(-6, STATE.sp2, eo3(k2)) + jit(t, 2) * (k2 >= 1), '外墙', 'Brick wall', k2 * out, { left: true, nominal: STATE.sp2, t, jid: 2 }); }
      // slab thermal bridge label
      const kb = seg(t, 6.5, 7.0) * out;
      if (kb > 0) { const a = new THREE.Vector3(4.6, yF(3) - .06, 1.31); const [ax, ay] = P(cam, a); label('slab', ax, ay, ax - 170 * S, ay - 110 * S, '楼板热桥', 'Slab thermal bridge', kb); }
    }
    // ---- S3: isotherm and the leak box
    if (t >= 10.5 && t < C.T.s4) {
      const ki = seg(t, 10.65, 11.0);
      g.save(); g.globalAlpha = ki; g.fillStyle = '#2bd14a'; g.fillRect(46 * S, 52 * S, 22 * S, 22 * S); g.restore();
      T2('iso', 'Isotherm > 8.0 °C', 80 * S, 63 * S, 24, { a: ki, color: '#b5ffbf' });
      const kb = seg(t, 12.75, 13.2);
      if (kb > 0) {
        const [a0x, a0y] = P(cam, new THREE.Vector3(LEAKY.x0 - .15, LEAKY.y0 + .3, 0)), [a1x, a1y] = P(cam, new THREE.Vector3(LEAKY.x1 + .15, LEAKY.y1 + .75, 0));
        const x0 = Math.min(a0x, a1x), x1 = Math.max(a0x, a1x), y0 = Math.min(a0y, a1y), y1 = Math.max(a0y, a1y);
        boxFrame(lerp((x0 + x1) / 2, x0, eo3(kb)), lerp((y0 + y1) / 2, y0, eo3(kb)), lerp((x0 + x1) / 2, x1, eo3(kb)), lerp((y0 + y1) / 2, y1, eo3(kb)), Math.min(1, kb * 3));
        const st = boxStat(x0, y0, x1, y1); M.leak = st.max;
        if (kb > .3) {
          const k = seg(t, 13.0, 13.4);
          const [lhx, lhy] = P(cam, LEAK_HOT); M.leakAt = [lhx, lhy]; cross(lhx, lhy, Math.min(1, k * 2), .8);
          const lx = x1 + 26 * S, ly = y0 + 40 * S;
          T2('leak-cn', '漏风', lx, ly, 40, { a: k, font: 'SC', w: 700 });
          T2('leak-en', 'Air leak', lx, ly + 42 * S, 26, { a: k, font: 'Inter' });
          txt('Max ' + fmt((STATE.leak ?? st.max) + jit(t, 3)) + ' °C', lx, ly + 86 * S, 30, { a: k });
          if (k >= 1) regTxt('leak-v', 'Max ' + fmt(STATE.leak ?? st.max) + ' °C', lx, ly + 86 * S, 30, {});
        }
      }
    }
    // ---- S4: veins in the wall
    if (t >= C.T.s4 && t < C.T.s5) {
      const kL = seg(t, 17.55, 18.1), kN = seg(t, 18.9, 19.4);
      const riser = new THREE.Vector3(2.59, yF(2) + 2.15, 0), niche = new THREE.Vector3(1.6, yF(1) + .45, 0);
      const [rx, ry] = P(cam, riser), [nx, ny] = P(cam, niche);
      label('riser', rx, ry, rx + 120 * S, ry - 110 * S, '暖气立管', 'Heating riser', kL);
      label('niche', nx, ny, nx + 150 * S, ny + 70 * S, '暖气片背后', 'Behind the radiator', kN);
      const ks = seg(t, 17.3, 17.5);
      if (ks > 0) T2('span', 'Span 10 °C', 1838 * S + 9 * S, 950 * S, 22, { align: 'right', a: ks * (1 - seg(t, 22.3, 22.6)) });
    }
    // ---- S5: bonnet, cat, the hot-spot tracker jumping to the eye
    if (t >= 24.6 && t < C.T.s6) {
      const hero = CARS.find(c => c.hero);
      const hood = new THREE.Vector3(hero.x + 1.75, .9, hero.z - .05);
      const catW = new THREE.Vector3(); C.cat.group.getWorldPosition(catW);
      const camRight = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0); const catBody = catW.clone().addScaledVector(camRight, .14).add(new THREE.Vector3(0, .07, 0));
      const k1 = seg(t, 25.35, 25.9), k2 = seg(t, 25.85, 26.4);
      const [hx, hy] = P(cam, hood), [cx, cy] = P(cam, catBody); M.hood = sensorAt(hx, hy, 2); M.cat = sensorAt(cx, cy, 2);
      if (k1 > 0) { cross(hx, hy, Math.min(1, k1 * 2.2)); reading('hood', hx, hy, lerp(-7, STATE.hood, eo3(k1)) + jit(t, 4) * (k1 >= 1), '车盖', 'Bonnet', k1, { left: true, nominal: STATE.hood, t, jid: 4 }); }
      if (k2 > 0) { cross(cx, cy, Math.min(1, k2 * 2.2)); reading('cat', cx, cy, lerp(-7, STATE.cat, eo3(k2)) + jit(t, 5) * (k2 >= 1), '猫', 'Cat', k2, { nominal: STATE.cat, t, jid: 5 }); }
      const P5 = C.catPose(t);
      if (t >= 26.6 && t < 28.85) {
        const [bx0, by0] = [cx - 260 * S, cy - 260 * S];
        const hw = new THREE.Vector3(); C.cat.head.getWorldPosition(hw); const [hx2, hy2] = P(cam, hw);
        const st = boxStat(hx2 - 110 * S, hy2 - 110 * S, hx2 + 110 * S, hy2 + 110 * S);
        const ka = seg(t, 26.6, 26.7); M.eye = st.max;
        const [mx, my] = P(cam, C.cat.head.localToWorld(EYE_HOT.clone())); M.eyeAt = [mx, my];
        g.save(); g.globalAlpha = ka; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3 * S;
        g.beginPath(); g.moveTo(mx, my - 6 * S); g.lineTo(mx - 9 * S, my - 22 * S); g.lineTo(mx + 9 * S, my - 22 * S); g.closePath(); g.stroke(); g.fill(); g.restore();
        txt('Max ' + fmt((STATE.eye ?? st.max) + jit(t, 6)) + ' °C', mx, my - 44 * S, 28, { align: 'center', a: ka });
        if (ka >= 1) regTxt('max', 'Max ' + fmt(STATE.eye ?? st.max) + ' °C', mx, my - 44 * S, 28, { align: 'center' });
        T2('eye-cn', '眼睛', mx, my - 112 * S, 26, { align: 'center', a: ka, font: 'SC' });
        T2('eye-en', 'Eyes', mx, my - 82 * S, 21, { align: 'center', a: ka, font: 'Inter' });
      }
    }
    // ---- S6: the roof
    if (t >= C.T.s6 && t < C.T.s7) {
      const kp = seg(t, 31.1, 31.6), kf = seg(t, 32.4, 32.9);
      const patch = new THREE.Vector3(-8.8, B.ROOF + .05, -4.2), flue = new THREE.Vector3(3.7, B.ROOF + 2.25, -3.6);
      const [px, py] = P(cam, patch), [fx, fy] = P(cam, flue); M.patch = sensorAt(px, py, 2); M.flue = boxStat(fx - 50 * S, fy - 90 * S, fx + 50 * S, fy + 50 * S).max;
      if (kp > 0) { label('patch', px, py, px + 170 * S, py + 130 * S, '保温层缺失', 'Missing insulation', kp, { val: STATE.patch ?? M.patch }); }
      if (kf > 0) { label('flue', fx, fy, fx - 230 * S, fy - 110 * S, '排烟道', 'Flue', kf, { val: STATE.flue ?? M.flue }); }
    }
    // time stamp (the survey night) bottom left
    if (t < C.T.s7 && sp !== 'photo') stamp('date1', '2024-12-19  22:41', 1);
    g.restore();
    // ---- S7: the report
    if (t >= C.T.s7 && t < C.T.s8cut) report(t, C);
  }

  function report(t, C) {
    const cam = C.camera; const div = C.divX >= 0 ? C.divX : 1;
    const halves = [];
    const wl = div * W;
    if (C.dual) { halves.push({ x0: 0, x1: wl, after: 0 }); halves.push({ x0: wl, x1: W, after: 1 }); }
    else halves.push({ x0: 0, x1: W, after: 0 });
    const kLab = seg(t, 37.35, 37.8), kV = seg(t, 40.4, 40.75);
    for (const h of halves) {
      const w = h.x1 - h.x0; if (w < 40) continue;
      // project with this half's own aspect
      const c2 = cam.clone(); c2.aspect = w / H; c2.updateProjectionMatrix();
      const Pq = (v) => { PROJ.copy(v).project(c2); return [h.x0 + (PROJ.x * .5 + .5) * w, (1 - (PROJ.y * .5 + .5)) * H]; };
      const a = h.after ? kLab : (C.dual ? kLab : 0);
      g.save(); g.beginPath(); g.rect(h.x0, 0, w, H); g.clip();
      const ox = h.x0 + 44 * S;
      const kd = C.dual ? (h.after ? sst(t, 36.9, 37.3) : 1) : sst(t, 35.4, 35.8);
      T2('rp-cn' + h.after, h.after ? '改造后' : '改造前', ox, 70 * S, 40, { font: 'SC', w: 700, a: kd });
      T2('rp-en' + h.after, h.after ? 'After retrofit' : 'Before retrofit', ox, 114 * S, 26, { font: 'Inter', a: kd });
      T2('rp-d' + h.after, h.after ? '2025-12-17  22:37' : '2024-12-19  22:41', ox, 152 * S, 22, { a: kd, w: 400 });
      if (C.dual && a > 0) {
        // facade box, its average in the right column of the header
        const [bx0, by0] = Pq(new THREE.Vector3(-9.6, B.PAR - .4, 0)), [bx1, by1] = Pq(new THREE.Vector3(9.6, 1.0, 0));
        boxFrame(bx0, by0, bx1, by1, a * .9);
        const stt = boxStat(bx0, by0, bx1, by1);
        M['avg' + h.after] = stt.avg; const avg = STATE['avg' + h.after] ?? stt.avg;
        const cx2 = h.x0 + 300 * S;
        T2('fa-cn' + h.after, '外墙平均', cx2, 70 * S, 30, { font: 'SC', a });
        T2('fa-en' + h.after, 'Facade average', cx2, 106 * S, 21, { font: 'Inter', a });
        T2('fa-v' + h.after, fmt(avg) + ' °C', cx2, 146 * S, 34, { a });
        // the leaking window: the hottest point in a small box round its head
        const [g0x, g0y] = Pq(new THREE.Vector3(LEAKY.x0 - .1, LEAKY.y1 + .7, 0)), [g1x, g1y] = Pq(new THREE.Vector3(LEAKY.x1 + .1, LEAKY.y1 - .3, 0));
        boxFrame(g0x, g0y, g1x, g1y, a);
        const gs = boxStat(g0x, g0y, g1x, g1y);
        M['gap' + h.after] = gs.max; const sv = STATE['gap' + h.after] ?? gs.max;
        T2('gap-v' + h.after, 'Max ' + fmt(sv) + ' °C', g1x + 16 * S, g0y + 10 * S, 28, { a });
        T2('gap-cn' + h.after, '窗缝', g1x + 16 * S, g0y + 44 * S, 24, { font: 'SC', a });
        T2('gap-en' + h.after, 'Window gap', g1x + 16 * S, g0y + 70 * S, 20, { font: 'Inter', a });
        // heat loss estimate under the building
        const hy = by1 + 62 * S;
        T2('hl-cn' + h.after, '热损失估算', bx0, hy, 28, { font: 'SC', a });
        T2('hl-en' + h.after, 'Estimated heat loss', bx0, hy + 32 * S, 21, { font: 'Inter', a });
        T2('hl-v' + h.after, h.after ? '73 kW' : '187 kW', bx0 + 236 * S, hy + 14 * S, 40, { a, w: 500 });
        if (h.after && kV > 0) {
          const vx = bx0 + 400 * S, vy = hy + 16 * S;
          g.save(); g.globalAlpha = Math.min(1, kV * 2); const sc = lerp(1.25, 1, eo3(kV));
          g.translate(vx, vy); g.scale(sc, sc);
          g.fillStyle = 'rgba(10,30,20,.72)'; g.strokeStyle = '#7dffa0'; g.lineWidth = 3 * S;
          const bw = 300 * S, bh = 118 * S; g.fillRect(0, -bh / 2, bw, bh); g.strokeRect(0, -bh / 2, bw, bh); g.restore();
          T2('vd-cn', '热损失 −61 %', vx + 22 * S, vy - 18 * S, 38, { font: 'SC', w: 700, a: Math.min(1, kV * 2), color: '#c9ffd6' });
          T2('vd-en', 'Heat loss −61 %', vx + 22 * S, vy + 28 * S, 24, { font: 'Inter', a: Math.min(1, kV * 2), color: '#c9ffd6' });
        }
      }
      g.restore();
    }
    // a shared colour scale for both halves
    scale(-9, 7, 1, 'scR');
  }

  function endCard(t) {
    const a = seg(t, 45.5, 45.62);
    const x = 96 * S, y = 150 * S;
    T2('end1', '冬夜，一栋楼的体温', x, y, 60, { font: 'SC', w: 700, a, hw: 7 });
    T2('end2', 'A Building on a Winter Night', x, y + 62 * S, 32, { font: 'Inter', a });
    T2('end3', '热成像', x, y + 130 * S, 28, { font: 'SC', a, color: 'rgba(255,255,255,.88)' });
    T2('end4', 'Thermal Camera', x, y + 164 * S, 22, { font: 'Inter', a, color: 'rgba(255,255,255,.85)' });
    T2('end5', 'LemoLab × Claude Opus 5.5', x, y + 226 * S, 26, { font: 'Inter', a, color: 'rgba(255,255,255,.95)' });
  }
  return { draw, texts: () => TX.map(o => ({ ...o })) };
}
// readings as measured from the thermal buffer (median over each hold, tools/measure.mjs); the meters show these with their ±0.1 refresh jitter
export const STATE = { sp1: 5.1, sp2: -4.7, leak: 17.5, hood: 10.5, cat: 15.0, eye: 34.4, patch: -2.4, flue: 22.4, avg0: -4.6, avg1: -5.8, gap0: 9.4, gap1: -1.6 };
