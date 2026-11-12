// "KOMA ONE · Thirty Panels a Second": Manga Panels library demo (a music video). Fictional brand, fictional product, fictional characters.
// The whole edit grid comes from beats.json (BPM, first-beat offset, the bar of every cut, start and end of every lyric line). To change the song, change only beats.json.
// Picture: Canvas 2D. Generated images (img/*.png, screentoned by tools/prep.py) + code-drawn panels, screentone, focus lines, speed lines, sound effects, lyric lettering.
import {
  W, H, PAPER, INK, ACC, X, clamp, lerp, seg, eo, ei, eio, back, rng, hash, boil, IMG, load, halo, tone, lineTone, makeGrain, grain,
  TX, reg, path, bbox, panel, frame, put, cover, coverPt, focus, speed, rings, star, sfx, text, afBox, narration, shout, balloon, HITS, cam, flash
} from './kit.js';

let BJ, B, OFF;
const bar = n => OFF + n * 4 * B;
const T = id => bar(BJ.cuts[id]);
const LN = id => BJ.lines.find(l => l.id === id);
// how long a lyric stays on the page: until 0.1 s after the next line starts (two lines overlap for 3 frames, in different places); when the next line is a sound effect (the shutter click) or this line is a balloon, until the next line starts
function until(id) {
  const i = BJ.lines.findIndex(l => l.id === id), l = BJ.lines[i], nx = BJ.lines[i + 1];
  if (!nx) return l.t1 + 1;
  return Math.max(l.t1, nx.t0 + (nx.kind === 'sfx' || l.kind === 'balloon' ? 0 : .1));
}
// lyric layer (drawn above the impact frames, like subtitles, so cuts never interrupt it): lettering and position for each line. All timings come from beats.json
const LY = {
  v1: { xr: 1880, y: 50 }, v2: { xr: 330, y: 40 }, v3: { xr: 1120, y: 30 }, v4: { xr: 1880, y: 40 }, p1: { xr: 330, y: 40 },
  c1: { x: 150, y: 900, size: 190, o: { rot: -.05, seed: 71 } },
  c2: { x: 140, y: 170, size: 128, o: { rot: .03, seed: 83 } },
  c3: { x: 150, y: 930, size: 150, o: { rot: -.04, seed: 89 } },
  c4: { x: 300, y: 150, size: 118, o: { path: Math.PI / 2, sp: 1.0, seed: 101, rot: 0, wob: .1 } },
  c5: { x: 1050, y: 980, size: 150, o: { rot: -.03, seed: 251 } },
};
function lyrics(t) {
  for (const l of BJ.lines) {
    const u = until(l.id); if (t < l.t0 - .03 || t > u) continue;
    if (l.kind === 'box') narration(t, l.id, l.text, l.t0, u, LY[l.id].xr, LY[l.id].y);
    else if (l.kind === 'shout') { const c = LY[l.id], o = { ...c.o }; if (l.id === 'c2') o.frozen = t >= T('c2') + 3 * B; shout(t, l.id, l.text, l.t0, u, c.x, c.y, c.size, o); }
    else if (l.kind === 'balloon') {
      // one line split into two joined speech balloons (right one read first): the first half appears as the line starts, the second 0.6 s later
      const [a, b] = l.text.split(' ');
      balloon(t, l.id + 'a', a, l.t0, u, 1640, 330, 118, 210, [-90, 150, -200, 250, -40, 200], { size: 66 });
      balloon(t, l.id + 'b', b, l.t0 + .6, u, 1470, 690, 104, 160, [-70, 120, -180, 200, -30, 150], { size: 66 });
    }
  }
}
// key points in the generated images (relative coords u, v), filled in from the generated results
const A = {
  key:   { u: .5, v: .5, hgt: 1000 },      // title-page figure: anchor = image centre
  run:   { u: .5, v: .5 },
  ready: { u: .5, v: .5 },
  aim:   { u: .5, v: .5, lens: [.27, .51] },
  smile: { u: .5, v: .5, face: [.55, .35] },
  crowd: { her: [.49, .41] },
  over:  { birds: [[.2, .5], [.38, .56], [.33, .44]], fu: .42 },
  finger:{ btn: [.36, .50] },          // shutter button (centre of the speed dial)
  pig:   { u: .5, v: .5 },
  jump:  { u: 718 / 1733, v: 380 / 1012 },
};

// ════════ Intro 1: the shutter blades open, a street corner at dusk in the viewfinder ════════
function S_intro(t) {
  const lt = t - T('intro'), bb = lt / B;
  X.fillStyle = INK; X.fillRect(0, 0, W, H);
  let r = 640 * back(seg(lt, 0, .16), 1.25);
  r *= 1 - .85 * Math.sin(Math.PI * seg(bb, 2, 2.3));          // blink the shutter again on beat 2
  r *= 1 - ei(seg(bb, 3.3, 3.95));                               // close before beat 4
  const n = 7, rot = lt * .5 + (1 - r / 640) * .9;
  const pts = []; for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  cam(t, 0, 0, 1 + lt * .025, 0, () => {
    if (r > 2) {
      X.save(); path(pts); X.clip();
      if (IMG.city) X.drawImage(IMG.city, -1150 - lt * 30, -660, 2300, 2300 * IMG.city.height / IMG.city.width);
      // focus box hunting: jumps to the sidewalk on beat 1, to the crossing at 1.5, locks before beat 2
      const P = [[-260, 120], [120, 60], [10, 20]];
      const i = bb < 1 ? 0 : bb < 1.5 ? 1 : 2, k = eo(seg(bb % .5, 0, .25));
      if (bb > .4) afBox(P[i][0], P[i][1], lerp(360, 220, k), lerp(260, 160, k), ACC, 7);
      X.restore();
      // blade edges: thin paper-white lines extending from each vertex along the edge
      X.save(); X.strokeStyle = 'rgba(243,240,232,.32)'; X.lineWidth = 2.5;
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; X.beginPath(); X.moveTo(a[0], a[1]); X.lineTo(a[0] - dx / L * 1600, a[1] - dy / L * 1600); X.stroke(); }
      X.beginPath(); X.arc(0, 0, 700, 0, Math.PI * 2); X.lineWidth = 3; X.stroke();
      X.restore();
    }
  });
  sfx(t, 'パシャッ', 240, 190, 150, T('intro') + .01, { seed: 3, rot: -.16, sp: .78 });
  if (bb > 2) sfx(t, 'パシャッ', 1500, 900, 110, T('intro') + 2 * B, { seed: 5, rot: .12, sp: .78 });
}

// ════════ Intro 2: one panel per beat, four panels slammed in a row ════════
const yb = x => -40 - .017 * x, yt = x => yb(x) + 26;
const G4 = [
  [[-108, -520], [940, -520], [940, yb(940)], [-96, yb(-96)]],
  [[-940, -520], [-132, -520], [-120, yb(-120)], [-940, yb(-940)]],
  [[232, yt(232)], [940, yt(940)], [940, 520], [206, 520]],
  [[-940, yt(-940)], [208, yt(208)], [182, 520], [-940, 520]],
];
function S_page4(t) {
  const t0 = T('page4'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const push = ei(seg(bb, 3.3, 4));
  const eyeX = -380, eyeY = 330;
  cam(t, lerp(0, eyeX, push), lerp(0, eyeY, push), lerp(.97, 1.02, seg(bb, 0, 3.3)) + push * 2.6, lerp(.012, -.01, seg(bb, 0, 4)), () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, G4[0], t0, 'L', (x0, y0, w, h, l) => {
      cover('city', x0, y0, w, h, { z: 1.15, fu: .5, fv: .58, dx: -l * 50 });
      speed(x0, y0, w, h, 0, 30, 11, l, 2400, PAPER, 2.5);
    }, { slam: 80 });
    panel(t, G4[1], t0 + B, 'L', (x0, y0, w, h, l) => {
      cover('feet', x0, y0, w, h, { z: 1.05 + l * .05, fu: .5, fv: .55 });
    }, { slam: 80 });
    panel(t, G4[2], t0 + 2 * B, 'D', (x0, y0, w, h, l) => {
      X.drawImage(tone('p4c', w, h, (u, v) => .05 + .5 * Math.hypot(u - .5, v - .5) ** 1.3, 9), x0, y0);
      focus(x0 + w * .45, y0 + h * .5, 230, 170, 120, 31 + boil(t, 10), INK, 6, 900);
      if (IMG.shootcam) put('shootcam', .5, .5, x0 + w * .46, y0 + h * .52, h * 1.15 * (1 + l * .04), -.04);
    }, { slam: 70 });
    panel(t, G4[3], t0 + 3 * B, 'L', (x0, y0, w, h, l) => {
      if (IMG.eye) { const iw = w + 120, ih = IMG.eye.height * iw / IMG.eye.width; X.drawImage(IMG.eye, x0 - 60 - l * 30, y0 + h / 2 - ih * .46, iw, ih); }
      speed(x0, y0, w, h, 0, 24, 41, l, 1600, PAPER, 2);
    }, { slam: 70 });
    sfx(t, 'ザワッ', 560, -400, 120, t0 + .02, { seed: 7, rot: -.1 });
    sfx(t, 'バシャッ', -880, -380, 118, t0 + B + .02, { seed: 9, rot: .08, sp: .78 });
    sfx(t, 'チャキッ', 560, 420, 100, t0 + 2 * B + .02, { seed: 11, rot: -.14, sp: .8 });
    sfx(t, 'ギンッ', -880, 120, 104, t0 + 3 * B + .02, { seed: 13, rot: .1, sp: .8 });
  });
}

// ════════ Intro 3–4: title page (chapter opener), the figure breaks the frame; on the last beat it splits along the diagonal gutter ════════
const TF = [[-120, -500], [900, -500], [900, 500], [-170, 500]];
function drawTitle(t) {
  const t0 = T('title'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
  panel(t, TF, t0, 'D', (x0, y0, w, h, l) => {
    X.drawImage(tone('ttl', w, h, (u, v) => .06 + .62 * (v ** 1.6) * (1 - .6 * Math.abs(u - .5)), 9), x0, y0);
    speed(x0, y0, w, h, -.32, 34, 101, l, 1700, INK, 3);
    focus(x0 + w * .55, y0 + h * .3, 300, 260, 70, 105 + boil(t, 8), INK, 3, 900);
  }, { slam: 80 });
  // figure: drawn over the panel borders (breaking the frame), shoe tips over the bottom border
  if (t >= t0 && IMG.keyH) {
    const k = eo(seg(lt, 0, .3));
    const sway = Math.sin(lt * 2.2) * .008;
    put(IMG.keyH, A.key.u, A.key.v, 400 + (1 - k) * 60, 40 + (1 - k) * 40 + Math.sin(lt * 3) * 4, A.key.hgt * lerp(.92, 1, k), sway);
  }
  // scraps of paper in the wind (white, inked edges), drifting right to left
  if (t >= t0) { const r = rng(55); for (let i = 0; i < 14; i++) { const x = 1000 - ((r() * 2000 + lt * (500 + r() * 400)) % 2000), y = -500 + r() * 1000 + Math.sin(lt * 3 + i) * 30; X.save(); X.translate(x, y); X.rotate(lt * (2 + r() * 3) + i); X.fillStyle = PAPER; X.strokeStyle = INK; X.lineWidth = 2.5; X.fillRect(-9, -6, 18, 12); X.strokeRect(-9, -6, 18, 12); X.restore(); } }
  // chapter box: vertical "Panel 1" + "the decisive moment"
  if (t >= t0 + .5 * B) {
    const k = back(seg(t, t0 + .5 * B, t0 + .5 * B + .16), 1.5);
    X.save(); X.translate(-790, -60); X.scale(k, k);
    X.fillStyle = INK; X.fillRect(-92, -420, 184, 860);
    X.fillStyle = PAPER; X.fillRect(-84, -412, 168, 844);
    X.fillStyle = INK; X.fillRect(-84, -412, 168, 150);
    X.font = '900 42px SerifSC'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillStyle = PAPER;
    X.fillText('第', 0, -381); X.font = '800 46px Barlow'; X.fillText('1', -2, -337); X.font = '900 42px SerifSC'; X.fillText('格', 0, -293);
    reg('chap1', '第1格', -84, -412, 84, -262);
    X.fillStyle = INK; X.font = '900 112px SerifSC';
    [...'决定性瞬间'].forEach((c, i) => X.fillText(c, 0, -180 + i * 120));
    reg('chap2', '决定性瞬间', -84, -250, 84, 420);
    X.restore();
  }
  // title
  text(t, 'KOMA ONE', -640, 330, 116, t0 + B, { f: 'Dela', w: 400, rim: PAPER, rimW: 18, id: 'ttlname', rot: -.02 });
  if (t > t0 + B) { const k = eo(seg(t, t0 + B, t0 + B + .2)); X.fillStyle = ACC; X.fillRect(-636, 356, 700 * k, 14); }
  text(t, 'PANEL 1', -634, 420, 44, t0 + 1.5 * B, { f: 'Barlow', w: 800, ls: 6, id: 'ttlen' });
}
function S_title(t) {
  const lt = t - T('title');
  cam(t, lerp(0, 30, seg(lt, 0, 3)), 0, lerp(1, 1.05, eio(seg(lt, 0, 3.2))), lerp(-.01, .008, seg(lt, 0, 3)), () => drawTitle(t));
}
// the title page splits in two along the diagonal gutter and slides away, revealing the first verse page
function titleSplit(t) {
  const k = eio(seg(t, T('v1'), T('v1') + .34)); if (k >= 1) return;
  const tt = T('v1') - .001;
  const A0 = [[1010, -20], [0, -20], [0, 1100], [860, 1100]], A1 = [[1010, -20], [1940, -20], [1940, 1100], [860, 1100]];
  for (const [poly, dx, dy] of [[A0, -1300 * k, 220 * k], [A1, 1300 * k, -220 * k]]) {
    X.save(); X.translate(dx, dy); path(poly); X.clip();
    cam(tt, 30, 0, 1.05, .008, () => drawTitle(tt));
    X.restore();
    X.save(); X.translate(dx, dy); X.beginPath(); X.moveTo(1010, -20); X.lineTo(860, 1100); X.lineWidth = 8; X.strokeStyle = INK; X.stroke(); X.restore();
  }
}

// ════════ Verse 1, "street corner, the light runs": a streak of light runs through the street panel → pan to a tall panel, she sprints out of the frame ════════
const VA = [[-640, -520], [1300, -520], [1300, 520], [-600, 520]];
const VB = [[-1900, -520], [-664, -520], [-624, 520], [-1900, 520]];
function S_v1(t) {
  const t0 = T('v1'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const pan = eio(seg(bb, 3.6, 4.3));
  cam(t, lerp(330 - lt * 40, -1180, pan), 0, lerp(1, .98, pan), 0, () => {
    X.fillStyle = PAPER; X.fillRect(-2400, -900, 4000, 1800);
    panel(t, VA, t0, 'L', (x0, y0, w, h, l) => {
      cover('city', x0, y0, w, h, { z: 1.0, fu: .5, fv: .55, dx: -l * 30 });
      // the light runs: a paper-white wedge of light sweeps across the crossing from right to left, with lit speed lines and star glints
      const lx = lerp(x0 + w * 1.05, x0 + w * .05, eio(seg(l, 0, 5 * B)));
      X.save(); X.fillStyle = PAPER;
      X.beginPath(); X.moveTo(lx - 60, y0); X.lineTo(lx + 130, y0); X.lineTo(lx + 330, y0 + h); X.lineTo(lx + 40, y0 + h); X.closePath(); X.fill();
      X.restore();
      X.save(); X.beginPath(); X.rect(lx - 400, y0, 1000, h); X.clip(); speed(lx - 400, y0, 1000, h, 0, 40, 23, l, 3200, PAPER, 3); X.restore();
      star(lx + 120, y0 + h * .55, 120 + 20 * Math.sin(l * 20), l * 2);
      star(lx + 40, y0 + h * .3, 50, -l * 3);
    }, { slam: 80 });
    panel(t, VB, t0 + 4 * B, 'L', (x0, y0, w, h, l) => {
      X.drawImage(lineTone('vb', w, h, (u, v) => .2 + .3 * v, 8, -8), x0, y0);
      speed(x0, y0, w, h, 0, 60, 33, l, 3000, INK, 4);
    }, { slam: 90 });
    if (t >= t0 + 4 * B && IMG.runH) {
      const l = t - t0 - 4 * B, k = eo(seg(l, 0, .2));
      const bob = Math.abs(Math.sin(l * Math.PI * 2 / B)) * -22;
      put(IMG.runH, A.run.u, A.run.v, lerp(-1260, -1450, k) - l * 70, 40 + bob, 680, -.03 + Math.sin(l * 2 * Math.PI / B) * .015);
    }
    sfx(t, 'キラッ', 520, -390, 110, t0 + .05, { seed: 17, rot: -.12, sp: .8 });
    for (const [b, x, y] of [[4, -800, 380], [5, -1020, 300], [6, -1240, 400], [7, -1460, 320]]) if (bb >= b && bb < b + 1.6) sfx(t, 'タッ', x, y, 96, t0 + b * B, { seed: 19 + b, rot: .1, sp: .7 });
  });
  titleSplit(t);
}

// ════════ Verse 2, "the crowd changes in a second": three panels with the same composition, the crowd blurring more in each, only she stays sharp ════════
const CR = [
  [[-940, -520], [940, -520], [940, -196], [-940, -176]],
  [[-940, -152], [940, -172], [940, 152], [-940, 172]],
  [[-940, 196], [940, 176], [940, 520], [-940, 520]],
];
function crowdIn(x0, y0, w, h, l) {
  const im = IMG.crowd; if (!im) return [0, 0, 1];
  const s = w * 1.05 / im.width, ih = im.height * s;
  const hx = x0 + w / 2, hy = y0 + h / 2;
  const ix = hx - A.crowd.her[0] * im.width * s, iy = hy - A.crowd.her[1] * im.height * s;
  X.drawImage(im, ix - l * 10, iy, im.width * s, ih);
  return [hx - l * 10, hy, s];
}
function S_v2(t) {
  const t0 = T('v2'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const push = ei(seg(bb, 6, 8));
  cam(t, 0, lerp(-30, 40, seg(bb, 0, 6)) + push * 320, lerp(.98, 1.02, seg(bb, 0, 6)) + push * 2.2, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, CR[0], t0, 'L', (x0, y0, w, h, l) => { crowdIn(x0, y0, w, h, l); }, { slam: 60 });
    panel(t, CR[1], t0 + 2 * B, 'L', (x0, y0, w, h, l) => {
      const [hx, hy] = crowdIn(x0, y0, w, h, l);
      // the crowd blurs into speed lines: an ellipse around her stays clear
      X.save(); X.beginPath(); X.rect(x0, y0, w, h); X.ellipse(hx, hy, 200, 170, 0, 0, Math.PI * 2); X.clip('evenodd');
      speed(x0, y0, w, h, 0, 300, 51, l, 2600, PAPER, 9); speed(x0, y0, w, h, 0, 160, 52, l, -2600, INK, 5);
      X.restore();
    }, { slam: 60 });
    panel(t, CR[2], t0 + 4 * B, 'L', (x0, y0, w, h, l) => {
      // third panel: the whole crowd wiped out in white knockout (shironuki), only she remains
      speed(x0, y0, w, h, 0, 70, 61, l, 2200, INK, 2);
      X.save(); X.beginPath(); X.ellipse(x0 + w / 2, y0 + h / 2, 190, 150, 0, 0, Math.PI * 2); X.clip(); crowdIn(x0, y0, w, h, 0); X.restore();
      X.save(); X.beginPath(); X.ellipse(x0 + w / 2, y0 + h / 2, 190, 150, 0, 0, Math.PI * 2); X.lineWidth = 3; X.setLineDash([6, 8]); X.strokeStyle = INK; X.stroke(); X.restore();
    }, { slam: 60 });
    sfx(t, 'ザワザワ', 620, -470, 92, t0 + .05, { seed: 23, rot: .08, sp: .8 });
    sfx(t, 'シーン', 760, 240, 110, t0 + 4 * B + .1, { seed: 29, rot: 0, path: Math.PI / 2, sp: .95, stag: .08, from: 1.2 });
  });
}

// ════════ Verse 3, "raise it, don't blink": three build-up panels, camera held low → raised → the eye ════════
const Q1 = [[40, -520], [940, -520], [940, 130], [70, 150]];
const Q2 = [[-940, -520], [16, -520], [46, 152], [-940, 170]];
const Q3 = [[-940, 194], [940, 154], [940, 520], [-940, 520]];
function S_v3(t) {
  const t0 = T('v3'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const into = ei(seg(bb, 6.4, 8));
  const eyeX = -940 + 1960 * .585 - 30, eyeY = 340;
  cam(t, lerp(0, eyeX, eio(into)), lerp(lerp(0, 120, eio(seg(bb, 4, 6))), eyeY, eio(into)), lerp(1, 1.12, eio(seg(bb, 4, 6))) + into * 3.2, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, Q1, t0, 'L', (x0, y0, w, h, l) => {
      X.drawImage(tone('q1', w, h, (u, v) => .05 + .45 * (1 - v) ** 1.5, 8), x0, y0);
      focus(x0 + w * .5, y0 + h * .4, 260, 220, 90, 71 + boil(t, 10), INK, 4, 900);
      const flick = [0, .035, -.03, .02][Math.min(3, Math.floor(l / (B / 2)))] || 0;
      if (IMG.ready) put('ready', A.ready.u, A.ready.v, x0 + w * .5, y0 + h * .55, h * 1.12, flick);
    }, { slam: 70 });
    panel(t, Q2, t0 + 2 * B, 'L', (x0, y0, w, h, l) => {
      X.drawImage(lineTone('q2', w, h, (u, v) => .15 + .3 * u, 7, 30), x0, y0);
      const up = eo(seg(l, 0, .3));
      // curved action line of the raise
      X.save(); X.strokeStyle = INK; X.lineCap = 'round';
      for (let i = 0; i < 6; i++) { X.lineWidth = 6 - i * .7; X.beginPath(); X.arc(x0 + w * .55, y0 + h * .95, 300 + i * 26, Math.PI * 1.15, Math.PI * lerp(1.2, 1.55, up)); X.stroke(); }
      X.restore();
      if (IMG.shoot) put('shoot', .5, .5, x0 + w * .52, y0 + h * .5 + (1 - up) * 140, h * 1.2, (1 - up) * .08);
    }, { slam: 70 });
    panel(t, Q3, t0 + 4 * B, 'L', (x0, y0, w, h, l) => {
      if (IMG.eye) { const iw = w + 40, ih = IMG.eye.height * iw / IMG.eye.width; X.drawImage(IMG.eye, x0 - 20, y0 + h / 2 - ih * .46, iw, ih); }
      X.save(); X.globalAlpha = .9; focus(x0 + w * .585, y0 + h * .5, 360, 160, 110, 81 + boil(t, 12), INK, 3, 1200); X.restore();
      // a bead of sweat slides down
      const sy = y0 + 40 + eo(seg(l, .2, 1.4)) * 90, sx = x0 + w * .78;
      X.save(); X.fillStyle = PAPER; X.strokeStyle = INK; X.lineWidth = 4;
      X.beginPath(); X.moveTo(sx, sy - 26); X.quadraticCurveTo(sx + 16, sy, sx, sy + 14); X.quadraticCurveTo(sx - 16, sy, sx, sy - 26); X.fill(); X.stroke(); X.restore();
    }, { slam: 80 });
    sfx(t, 'キョロ', 760, -440, 82, t0 + .05, { seed: 31, rot: .1, sp: .8 });
    if (bb > 1) sfx(t, 'キョロ', 120, -60, 70, t0 + B, { seed: 33, rot: -.1, sp: .8 });
    sfx(t, 'スッ', -820, -420, 96, t0 + 2 * B + .05, { seed: 35, rot: -.15, sp: .8 });
    sfx(t, 'ジッ', 760, 300, 120, t0 + 4 * B + .05, { seed: 37, rot: .08, sp: .8 });
  });
}

// ════════ Verse 4, "the next panel is now": over-the-shoulder panel + one blank dashed panel; on the "now" beat it fills with pigeons ════════
const R1 = [[-60, -520], [940, -520], [940, 520], [-120, 520]];
const R2 = [[-940, -400], [-112, -420], [-160, 400], [-940, 420]];
function feathers(x0, y0, w, h, l, seed, n = 16) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w + Math.sin(l * 2 + i) * 40, y = y0 + r() * h * .5 + l * (60 + r() * 90);
    X.save(); X.translate(x, y); X.rotate(Math.sin(l * 3 + i * 1.7) * .8);
    X.beginPath(); X.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2); X.fillStyle = PAPER; X.fill(); X.lineWidth = 2.5; X.strokeStyle = INK; X.stroke();
    X.beginPath(); X.moveTo(-20, 0); X.lineTo(18, 0); X.stroke(); X.restore();
  }
}
function birdsPanel(x0, y0, w, h, l, o = {}) {
  X.drawImage(tone('sky' + Math.round(w), w, h, (u, v) => .04 + .5 * Math.hypot(u - .5, v - .7) ** 1.2, 9), x0, y0);
  focus(x0 + w * .5, y0 + h * .55, w * .2, h * .2, 110, (o.seed || 91) + (o.frozen ? 0 : boil(l, 10)), INK, 4, 1400);
  if (IMG.pig) put('pig', A.pig.u, A.pig.v, x0 + w * .5 - l * 40, y0 + h * .5 - l * 90, h * (o.zoom || 1.15) * (1 + l * .06));
  feathers(x0, y0, w, h, l, o.seed || 91);
}
function S_v4(t) {
  const t0 = T('v4'), lt = t - t0, bb = lt / B, now = t0 + 6 * B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const pan = eio(seg(bb, 2.4, 3.6));
  cam(t, lerp(380, -40, pan), 0, lerp(1.12, 1.0, pan), 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, R1, t0, 'L', (x0, y0, w, h, l) => {
      const co = { z: 1.04 + l * .015, fu: A.over.fu, fv: .5 };
      cover('over', x0, y0, w, h, co);
      const P = A.over.birds, i = Math.min(2, Math.floor(l / (B * 1.5))), k = eo(seg(l % (B * 1.5), 0, .15));
      const [px, py] = coverPt('over', x0, y0, w, h, co, P[i][0], P[i][1]);
      afBox(px, py, lerp(220, 130, k), lerp(170, 100, k), ACC, 6);
    }, { slam: 70 });
    // blank panel: dashed border, waiting for the next panel
    if (t >= t0 + 2 * B && t < now) panel(t, R2, t0 + 2 * B, 'L', () => {}, { dash: [22, 14], dashOff: -lt * 60, lw: 5, slam: 0 });
    if (t >= t0 + 2 * B && t < now) { X.save(); X.font = '900 120px SerifSC'; X.fillStyle = INK; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText('…', -540, 0); X.restore(); }
    panel(t, R2, now, 'U', (x0, y0, w, h, l) => birdsPanel(x0, y0, w, h, l), { slam: 110 });
    if (t >= now) sfx(t, 'バサバサッ', -900, -300, 104, now + .02, { seed: 41, rot: .2, sp: .78, stag: .05 });
    if (t >= now && t < now + .18) { X.fillStyle = `rgba(243,240,232,${(1 - seg(t, now, now + .18)) * .9})`; X.fillRect(-1300, -900, 2600, 1800); }
  });
}

// ════════ Pre-chorus, "focus, 0.02 seconds": time stops. Screentone fades, lines stop boiling, the vermilion focus box locks onto one pigeon for 0.02 s ════════
const PF = [[-920, -500], [920, -500], [920, 500], [-920, 500]];
function S_p1(t) {
  const t0 = T('p1'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const lockB = 2.5, lk = t0 + lockB * B;
  const tgt = [-336, 67];                       // the locked pigeon (page coords, converted from the pig anchor and nudged)
  cam(t, lerp(0, tgt[0] * .3, seg(lt, 0, 3)), lerp(0, tgt[1] * .3, seg(lt, 0, 3)), lerp(1, 1.12, eio(seg(lt, 0, 3))), 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, PF, t0, 'L', (x0, y0, w, h, l) => {
      // background screentone fades from the outside in: time stops
      const fade = eo(seg(bb, 0, 2.5));
      X.save(); X.beginPath(); X.rect(x0, y0, w, h); X.ellipse(tgt[0], tgt[1], 60 + fade * 1500, 50 + fade * 1100, 0, 0, Math.PI * 2); X.clip('evenodd');
      X.drawImage(tone('pf', w, h, (u, v) => .1 + .5 * Math.hypot(u - .6, v - .4), 9), x0, y0);
      focus(tgt[0], tgt[1], 300, 220, 140, 121, INK, 4, 1600);
      X.restore();
      // the flock almost frozen (very slow drift)
      if (IMG.pig) put('pig', A.pig.u, A.pig.v, x0 + w * .5 - l * 6, y0 + h * .5 - l * 10, h * 1.35);
      // speed lines pulled back
      const rk = 1 - eo(seg(bb, 0, 1.5));
      if (rk > 0) { X.save(); X.globalAlpha = rk; speed(x0, y0, w, h, -1.2, 50, 131, 0, 0, INK, 3); X.restore(); }
    }, { slam: 40 });
    // focus box: hunts in half-beat jumps, locks on beat 3
    const hunt = [[-768, -108], [552, -337], [-600, 378], [168, -297], tgt];
    if (bb > .3) {
      const i = t < lk ? Math.min(3, Math.floor((bb - .3) / .5)) : 4;
      const k = t < lk ? eo(seg((bb - .3) % .5, 0, .2)) : eo(seg(t, lk, lk + .06));
      const [px, py] = hunt[i], big = t < lk ? 1 : .62;
      afBox(px, py, lerp(320, 220, k) * big, lerp(250, 170, k) * big, ACC, t < lk ? 6 : 9);
      if (t >= lk) {
        X.save(); X.strokeStyle = ACC; X.lineWidth = 3; X.beginPath(); X.moveTo(px + 90, py - 70); X.lineTo(px + 180, py - 150); X.lineTo(px + 360, py - 150); X.stroke(); X.restore();
        text(t, '0.02s', px + 190, py - 166, 64, lk + .02, { f: 'Barlow', w: 800, id: 'af002' });
        text(t, 'AF LOCK', px + 194, py - 112, 30, lk + .06, { f: 'Barlow', w: 800, ls: 4, col: ACC });
      }
    }
    if (t >= lk) sfx(t, 'ピピッ', -560, 330, 100, lk + .01, { seed: 47, rot: -.1, sp: .8 });
  });
}

// ════════ Pre-chorus 2: finger on the shutter + heartbeat ════════
const FA = [[-260, -520], [940, -520], [940, 520], [-300, 520]];
const FB = [[-940, -520], [-284, -520], [-324, 520], [-940, 520]];
function S_p2(t) {
  const t0 = T('p2'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const beat = Math.max(Math.exp(-((bb) % 2) * 6) * (bb < 4 ? 1 : 0), 0);
  const into = ei(seg(bb, 3.2, 4));
  const [fx0, fy0, fx1, fy1] = bbox(FA), [btnX, btnY] = coverPt('finger', fx0, fy0, fx1 - fx0, fy1 - fy0, { z: 1.05 }, A.finger.btn[0], A.finger.btn[1]);
  cam(t, lerp(0, btnX, into), lerp(0, btnY, into), 1 + beat * .025 + into * 2.4, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, FA, t0, 'L', (x0, y0, w, h, l) => {
      cover('finger', x0, y0, w, h, { z: 1.05, dy: eo(seg(l, 0, 4 * B)) * 26 });
      rings(btnX, btnY, 140 + (l % (2 * B)) * 120, 4, 46, 141 + Math.floor(l / (2 * B)), INK, 5);
    }, { slam: 60 });
    panel(t, FB, t0 + .5 * B, 'D', (x0, y0, w, h, l) => {
      X.fillStyle = INK; X.fillRect(x0, y0, w, h);
      rings(x0 + w * .5, y0 + h * .5, 60 + (l % (2 * B)) * 300, 5, 60, 151, PAPER, 4);
    }, { bg: INK, slam: 50 });
    sfx(t, 'ドクン', -470, -380, 120, t0 + .02, { seed: 53, rot: 0, path: Math.PI / 2, sp: .95, outer: PAPER, rim: INK, fill: PAPER });
    if (bb >= 2) sfx(t, 'ドクン', -800, 0, 150, t0 + 2 * B, { seed: 59, rot: .05, path: Math.PI / 2, sp: .95, outer: PAPER, rim: INK, fill: PAPER });
  });
}

// ════════ Click! Full-page lettering → 0.75 s of silence: one "ma" (pause) panel, the camera just after the press, settling ════════
function S_kasha(t) {
  const t0 = T('kasha'), lt = t - t0;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  cam(t, 0, 0, 1 + lt * .04, -.02, () => {
    focus(0, 0, 340, 230, 320, 161 + boil(t, 12), INK, 10, 1700);
    sfx(t, 'パシャッ', -520, 10, 330, t0 + .01, { seed: 61, rot: -.1, sp: .76, stag: .035 });
  });
  if (lt < .22) { X.fillStyle = `rgba(243,240,232,${(1 - lt / .22) * .9})`; X.fillRect(0, 0, W, H); }
}
function S_hush(t) {
  // the silent beat: hard cut to a wide "ma" panel, no sound effect, no focus lines. Inside is the camera that has just fired,
  // rocking slightly in the aftershock and settling; one glint on the lens. The quiet comes from the picture alone, leaving the rhythm to the big burst on the next beat.
  const t0 = T('hush'), lt = t - t0;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const x0 = 250, y0 = 230, w = 1420, h = 600;
  X.save(); X.beginPath(); X.rect(x0, y0, w, h); X.clip();
  X.fillStyle = PAPER; X.fillRect(x0, y0, w, h);
  X.drawImage(lineTone('hushT', w, h, (u, v) => .03 + .3 * Math.max(0, v - .72) / .28, 9, -18), x0, y0);   // line tone on the table
  const k = eo(seg(lt, 0, .28)), z = 1 + lt * .035;
  put('hero', .5, .47, x0 + w * .5, y0 + h * .52 + (1 - k) * 18, 700 * z, lerp(-.035, -.012, k));
  // a glint on the lens (lens at about 0.33, 0.6 of the image)
  const g = Math.sin(Math.PI * seg(lt, .12, .5));
  if (g > 0) { const s = 700 * z / IMG.hero.height, gx = x0 + w * .5 + (.33 - .5) * IMG.hero.width * s, gy = y0 + h * .52 + (.6 - .47) * IMG.hero.height * s; star(gx - 40, gy - 50, 46 * g, .3, PAPER, INK); }
  X.restore();
  frame([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 7);
}

// ════════ Chorus 1, "thirty panels a second": the signature shot — one panel splits each beat 1→2→4→8→16→30, each a frame of her leaping over the pigeons ════════
const GRIDS = [[1, 1], [2, 1], [2, 2], [4, 2], [4, 4], [6, 5]];
function gridCells(lvl, gut) {
  const [cols, rows] = GRIDS[lvl], M = 34, G = gut ?? (lvl >= 4 ? 12 : 18);
  const cw = (W - M * 2 - G * (cols - 1)) / cols, ch = (H - M * 2 - G * (rows - 1)) / rows, out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ i: r * cols + (cols - 1 - c), x0: M + c * (cw + G), y0: M + r * (ch + G), cw, ch });
  return { cells: out, n: cols * rows, cols };
}
function burstCell(t, x0, y0, cw, ch, f, n, i, lt) {
  X.fillStyle = PAPER; X.fillRect(x0, y0, cw, ch);
  X.drawImage(lineTone('g' + n + (i % 3), cw, ch, (u, v) => .1 + .28 * (i % 3 === 0 ? u : v), n >= 16 ? 5 : 8, -12 - (i % 3) * 8), x0, y0);
  speed(x0, y0, cw, ch, 0, Math.max(8, 40 / Math.sqrt(n)), 80 + i, t, 1800, INK, Math.max(1.2, 4 / Math.sqrt(n)));
  // pigeons: fly to the upper left with the frame number
  if (IMG.pigS && IMG.pig) put(n <= 4 ? 'pig' : 'pigS', A.pig.u, A.pig.v, x0 + cw * lerp(.7, .35, f), y0 + ch * lerp(.75, .2, f), ch * .8);
  // her: one leap from right to left, one frame per panel
  const big = n <= 4, src = big ? 'jump' : 'jumps';
  const ax = x0 + cw * lerp(.66, .36, f) + (n === 1 ? -lt * 40 : 0), ay = y0 + ch * .52 - Math.sin(f * Math.PI) * ch * .14;
  put(src, A.jump.u, A.jump.v, ax, ay, ch * .95, (f - .5) * .12);
}
function S_c1(t) {
  const t0 = T('c1'), lt = t - t0, bb = lt / B;
  const lvl = Math.min(5, Math.floor(bb));
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  cam(t, W / 2, H / 2, 1 + ei(seg(bb, 7.5, 8)) * .08, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-400, -300, W + 800, H + 600);
    const { cells, n } = gridCells(lvl);
    const tl = t0 + lvl * B;
    for (const c of cells) {
      const f = n === 1 ? .5 : c.i / (n - 1), tin = tl + c.i * Math.min(.012, .25 / n);
      if (t < tin) continue;
      X.save(); X.beginPath(); X.rect(c.x0, c.y0, c.cw, c.ch); X.clip();
      burstCell(t, c.x0, c.y0, c.cw, c.ch, f, n, c.i, lt);
      const fl = 1 - seg(t, tin, tin + .08);
      // beats 6–7: the thirty panels flash their shutters again in reading order
      const wave = t0 + 6 * B + c.i * (1.5 * B / 30), fl2 = t > wave ? 1 - seg(t, wave, wave + .1) : 0;
      const ff = Math.max(fl, fl2);
      if (ff > 0) { X.fillStyle = `rgba(243,240,232,${ff * .85})`; X.fillRect(c.x0, c.y0, c.cw, c.ch); }
      X.restore();
      X.lineWidth = lvl >= 4 ? 4 : 6; X.strokeStyle = INK; X.strokeRect(c.x0, c.y0, c.cw, c.ch);
    }
    sfx(t, 'パシャシャシャ', 1240, 120, 84, t0 + B, { seed: 67, rot: .1, stag: B / 2 * .9, sp: .92 });
  });
}

// ════════ Chorus 2, "stop the wind in my hand": the thirty panels merge into one double-page spread; she breaks the frame; from beat 2 everything freezes ════════
const SP = [[-1260, -470], [1260, -500], [1260, 500], [-1260, 470]];
function S_c2(t) {
  const t0 = T('c2'), lt = t - t0, bb = lt / B, stop = t0 + 2 * B;
  const ft = Math.min(lt, 2 * B);                // once frozen, content time stops
  const frozen = t >= stop;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  cam(t, lerp(330, -330, eio(seg(lt, 0, 8 * B))), 0, .9, -.012, () => {
    X.fillStyle = PAPER; X.fillRect(-2000, -1000, 4000, 2000);
    path(SP); X.save(); X.clip();
    const [x0, y0, x1, y1] = bbox(SP), w = x1 - x0, h = y1 - y0;
    if (IMG.city) X.drawImage(IMG.city, x0 - 60 - ft * 40, y0 - 200, w + 200, (w + 200) * IMG.city.height / IMG.city.width);
    X.drawImage(lineTone('spw', w, h, (u, v) => .22 * (1 - v), 9, -24), x0, y0);
    speed(x0, y0, w, h, -.35, 90, 171, ft, 2600, PAPER, 4);
    if (IMG.pig) { put('pig', A.pig.u, A.pig.v, -620 - ft * 80, -120 - ft * 120, 820); put('pig', A.pig.u, A.pig.v, 820 - ft * 60, -200 - ft * 100, 600, 0, { flip: true }); }
    feathers(x0, y0, w, h, ft, 177, 26);
    X.restore();
    frame(SP, 8);
    // merge: the gutters of the thirty panels close from 14 px to 0
    const mg = 1 - eo(seg(lt, 0, .3));
    if (mg > 0) { X.save(); X.strokeStyle = PAPER; X.lineWidth = 16 * mg; for (let c = 1; c < 6; c++) { const x = x0 + w * c / 6; X.beginPath(); X.moveTo(x, y0 - 40); X.lineTo(x, y1 + 40); X.stroke(); } for (let r = 1; r < 5; r++) { const y = y0 + h * r / 5; X.beginPath(); X.moveTo(x0, y); X.lineTo(x1, y); X.stroke(); } X.restore(); }
    // she leaps out of the frame (white outline over the top border)
    if (IMG.jumpH) put(IMG.jumpH, A.jump.u, A.jump.v, 120 - ft * 120, -150 - Math.sin(Math.min(1, ft / 1.2) * Math.PI) * 60, 1080, -.05);
    if (frozen) sfx(t, 'ピタッ', 520, -330, 150, stop + .01, { seed: 79, rot: -.12, sp: .8, frozen: true });
  });
  if (t >= stop && t < stop + 2 / 30) { X.fillStyle = INK; X.fillRect(0, 0, W, H); }   // the freeze: 2 inverted frames
  // "in my hand": an inserted small panel, a hand holding the vermilion camera
  const ins = t0 + 5 * B;
  if (t >= ins) {
    const k = back(seg(t, ins, ins + .16), 1.6), pts = [[0, 0], [470, -18], [486, 330], [10, 340]];
    X.save(); X.translate(1380, 650); X.rotate(.03); X.scale(k, k);
    panel(t, pts, ins, 'L', (x0, y0, w, h, l) => {
      X.fillStyle = INK; X.fillRect(x0, y0, w, h);
      focus(x0 + w / 2, y0 + h / 2, 130, 100, 120, 181 + (t >= stop ? 0 : boil(t, 10)), PAPER, 4, 600);
      put('shootcam', .5, .5, x0 + w / 2, y0 + h / 2 + 10, h * 1.1);
    }, { bg: INK, slam: 30, lw: 7 });
    X.restore();
  }
}

// ════════ Chorus 3, "every panel, every panel": a nine-panel page of the photos she took today; the camera travels the gutters into one panel per beat, then pulls out to the whole page ════════
const C3W = 1000, C3H = 560, C3G = 40;
const C3IMG = ['city', 'feet', 'crowd', 'pig', 'eye', 'over', 'run', 'finger', 'key'];
function c3cell(k) { const r = Math.floor(k / 3), c = 2 - (k % 3); return [(c - 1) * (C3W + C3G), (r - 1) * (C3H + C3G)]; }
function S_c3(t) {
  const t0 = T('c3'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const zc = 1920 / (C3W + 70);
  let cx, cy, z;
  if (bb < 6) {
    const k = Math.min(5, Math.floor(bb + .55)), kp = Math.max(0, k - 1);
    const m = eio(seg(bb, k - .55, k));
    const [ax, ay] = c3cell(kp), [bx, by] = c3cell(k);
    cx = lerp(ax, bx, m); cy = lerp(ay, by, m); z = zc * (1 - .14 * Math.sin(Math.PI * m));
  } else {
    const m = eio(seg(bb, 6, 7.4)), [ax, ay] = c3cell(5);
    cx = lerp(ax, 0, m); cy = lerp(ay, 0, m); z = lerp(zc, .58, m);
  }
  cam(t, cx, cy, z, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-2400, -1400, 4800, 2800);
    for (let k = 0; k < 9; k++) {
      const [mx, my] = c3cell(k), x0 = mx - C3W / 2, y0 = my - C3H / 2;
      X.save(); X.beginPath(); X.rect(x0, y0, C3W, C3H); X.clip();
      const n = C3IMG[k], l = lt + k;
      if (n === 'pig' || n === 'run' || n === 'key') {
        X.drawImage(tone('c3t' + k, C3W, C3H, (u, v) => .05 + .45 * Math.hypot(u - .5, v - .5) * 1.3, 9), x0, y0);
        speed(x0, y0, C3W, C3H, 0, 40, 191 + k, l, n === 'run' ? -2400 : 1600, INK, 3);
        if (n === 'pig') put('pig', A.pig.u, A.pig.v, mx - lt * 30, my - lt * 30, C3H * 1.1);
        if (n === 'run') put('run', A.run.u, A.run.v, mx - lt * 50, my + 20 + Math.abs(Math.sin(lt * Math.PI * 2 / B)) * -14, C3H * 1.05);
        if (n === 'key') put('key', A.key.u, .32, mx + 40, my + 40, C3H * 1.9);
      } else if (n === 'crowd') {
        crowdIn(x0, y0, C3W, C3H, lt);
      } else {
        cover(n, x0, y0, C3W, C3H, { z: 1.06 + lt * .02, fu: n === 'eye' ? .6 : .5 });
      }
      X.restore();
      frame([[x0, y0], [x0 + C3W, y0], [x0 + C3W, y0 + C3H], [x0, y0 + C3H]], 8);
      // frame number (small vermilion tag)
      X.save(); X.fillStyle = ACC; X.fillRect(x0 + C3W - 96, y0 + 14, 82, 44);
      X.font = '800 38px Barlow'; X.fillStyle = PAPER; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(String(k + 1).padStart(2, '0'), x0 + C3W - 55, y0 + 37); X.restore();
      // on the beat the camera reaches a panel: shutter flash to white
      if (k < 6) { const ta = t0 + k * B, fl = t >= ta ? 1 - seg(t, ta, ta + .1) : 0; if (fl > 0 && k > 0) { X.fillStyle = `rgba(243,240,232,${fl * .8})`; X.fillRect(x0, y0, C3W, C3H); } }
    }
  });
}

// ════════ Chorus 4, "each one a decisive moment": she lowers the camera and smiles. Mood screentone + sparkles, the slowest 3 seconds of the film ════════
const EM = [[36, 36], [1884, 36], [1884, 1044], [36, 1044]];
function S_c4(t) {
  const t0 = T('c4'), lt = t - t0;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  cam(t, W / 2 + lt * 10, H / 2, lerp(1, 1.07, eio(seg(lt, 0, 3.2))), lerp(.006, -.004, seg(lt, 0, 3)), () => {
    X.fillStyle = PAPER; X.fillRect(-400, -300, W + 800, H + 600);
    panel(t, EM, t0, 'L', (x0, y0, w, h, l) => {
      X.drawImage(tone('emo', w, h, (u, v) => .62 * clamp(Math.hypot((u - .62) * 1.4, v - .42) - .12, 0, 1) ** .9, 9), x0, y0);
      // shoujo-manga mood background: bubbles + sparkles, drifting slowly upward
      const r = rng(211);
      for (let i = 0; i < 22; i++) {
        const bx = x0 + r() * w, by = y0 + h - ((r() * h + l * (40 + r() * 50)) % (h + 100)), R = 20 + r() * 70;
        X.save(); X.beginPath(); X.arc(bx, by, R, 0, Math.PI * 2); X.fillStyle = PAPER; X.fill(); X.lineWidth = 2; X.strokeStyle = INK; X.stroke();
        X.beginPath(); X.arc(bx - R * .35, by - R * .35, R * .18, 0, Math.PI * 2); X.fillStyle = INK; X.globalAlpha = .0; X.fill(); X.restore();
      }
      for (let i = 0; i < 16; i++) { const sx = x0 + r() * w, sy = y0 + r() * h - l * 30, tw = .5 + .5 * Math.sin(l * 6 + i * 2.1); star(sx, sy, (18 + r() * 34) * tw, i, PAPER, INK); }
      if (IMG.smile) put('smile', A.smile.u, A.smile.v, x0 + w * .64, y0 + h * .56 + Math.sin(l * 1.6) * 6, h * 1.02, Math.sin(l * 1.1) * .01);
    }, { slam: 40 });
    sfx(t, 'ニコッ', 1500, 200, 80, t0 + 2 * B, { seed: 97, rot: .14, sp: .8 });
  });
}

// ════════ Chorus 5, "thirty panels a second": a flip book — thirty pages in one second, the still panels come to life ════════
const BK = [-860, -470, 860, 470];             // the book pages (page coords)
function flipPage(k, lt) {
  // picture on page k: she lands, the pigeons scatter (k = 0..30)
  const [x0, y0, x1, y1] = BK, w = x1 - x0, h = y1 - y0, f = k / 30;
  X.fillStyle = PAPER; X.fillRect(x0, y0, w, h);
  const ix0 = x0 + 50, iy0 = y0 + 50, iw = w - 100, ih = h - 120;
  X.save(); X.beginPath(); X.rect(ix0, iy0, iw, ih); X.clip();
  if (IMG.city) X.drawImage(IMG.city, ix0 - 200 - f * 160, iy0 - 280, iw + 400, (iw + 400) * IMG.city.height / IMG.city.width);
  speed(ix0, iy0, iw, ih, 0, 50, 223, lt, 1800, PAPER, 3);
  if (IMG.pig) put('pig', A.pig.u, A.pig.v, ix0 + iw * lerp(.55, .25, f), iy0 + ih * lerp(.55, -.05, f), ih * lerp(.8, 1.3, f));
  const jy = iy0 + ih * (.42 + .3 * f * f) - Math.sin(f * Math.PI * .9) * ih * .18;
  if (IMG.jump) put('jump', A.jump.u, A.jump.v, ix0 + iw * lerp(.78, .3, f), jy, ih * .95, lerp(-.02, .12, f));
  X.restore();
  frame([[ix0, iy0], [ix0 + iw, iy0], [ix0 + iw, iy0 + ih], [ix0, iy0 + ih]], 6);
  X.font = '800 34px Barlow'; X.fillStyle = INK; X.textAlign = 'right'; X.textBaseline = 'alphabetic';
  X.fillText(String(k).padStart(2, '0') + ' / 30', x1 - 50, y1 - 26);
}
function S_c5(t) {
  const t0 = T('c5'), lt = t - t0;
  X.fillStyle = INK; X.fillRect(0, 0, W, H);
  X.save(); X.globalAlpha = .9; focus(W / 2, H / 2, 900, 520, 160, 231 + boil(t, 10), PAPER, 3, 1800); X.restore();
  const flipDur = 1.0, pf = clamp(lt / flipDur * 30, 0, 30), k = Math.floor(pf);
  cam(t, 0, 0, lerp(.9, .96, eio(seg(lt, 0, 3))), -.015, () => {
    // book thickness: page edges offset to the lower right
    for (let i = 6; i > 0; i--) { X.fillStyle = i % 2 ? PAPER : '#d9d5cc'; X.fillRect(BK[0] + i * 4, BK[1] + i * 5, BK[2] - BK[0], BK[3] - BK[1]); X.lineWidth = 2; X.strokeStyle = INK; X.strokeRect(BK[0] + i * 4, BK[1] + i * 5, BK[2] - BK[0], BK[3] - BK[1]); }
    if (k >= 30) { flipPage(30, lt); }
    else {
      // the next page underneath, the top page lifting from the right and turning away
      flipPage(k + 1, lt);
      const ph = .15 + .7 * hash(k + 7), [x0, y0, x1, y1] = BK, w = x1 - x0;
      const xf = x1 - w * ph * 1.0, sl = -.18;                  // fold line: top end at xf, slanted
      const fx = y => xf + (y - y0) * sl;
      X.save(); X.beginPath(); X.moveTo(x0, y0); X.lineTo(fx(y0), y0); X.lineTo(fx(y1), y1); X.lineTo(x0, y1); X.closePath(); X.clip(); flipPage(k, lt); X.restore();
      // back of the lifted page: mirror of the area left of the fold
      const fw = (x1 - xf) * .7;
      X.save(); X.beginPath(); X.moveTo(fx(y0), y0); X.lineTo(fx(y0) - fw, y0 + 30); X.lineTo(fx(y1) - fw * .8, y1 - 10); X.lineTo(fx(y1), y1); X.closePath();
      X.fillStyle = PAPER; X.fill(); X.lineWidth = 4; X.strokeStyle = INK; X.stroke(); X.clip();
      X.drawImage(lineTone('flipb', 900, 1000, (u) => .5 * u, 7, 70), fx(y0) - fw, y0); X.restore();
    }
    frame([[BK[0], BK[1]], [BK[2], BK[1]], [BK[2], BK[3]], [BK[0], BK[3]]], 5);
  });
  if (lt < flipDur + .05) sfx(t, 'パラパラパラ', 140, 120, 86, t0 + .02, { seed: 241, rot: -.06, stag: .09, sp: .9 });
}

// ════════ Chorus 6, "keep you on this page": she turns the lens to the viewer; for the first time the lyric becomes her speech balloon ════════
const AY = [[-900, -505], [900, -490], [900, 500], [-880, 505]];
function S_c6(t) {
  const t0 = T('c6'), lt = t - t0, bb = lt / B;
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  const push = ei(seg(bb, 6.3, 8));
  const im = IMG.aim, ah = 1060;
  const lensX = -60 + (A.aim.lens[0] - A.aim.u) * (im ? im.width * ah / im.height : 0), lensY = 20 + (A.aim.lens[1] - A.aim.v) * ah;
  cam(t, lerp(0, lensX, eio(push)), lerp(0, lensY, eio(push)), lerp(.94, 1.0, seg(bb, 0, 6.3)) + push * 2.8, 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    panel(t, AY, t0, 'L', (x0, y0, w, h, l) => {
      X.drawImage(tone('aim', w, h, (u, v) => .08 + .5 * Math.hypot(u - .45, v - .5) ** 1.2, 9), x0, y0);
      focus(lensX, lensY, 300, 300, 180, 261 + boil(t, 10), INK, 5, 1800);
      if (IMG.aimH) put(IMG.aimH, A.aim.u, A.aim.v, -60, 20 + Math.sin(l * 2) * 5, ah);
      // lens star glint
      star(lensX + 30, lensY - 40, 70 + 20 * Math.sin(l * 9), l);
    }, { slam: 60 });
    if (bb >= 3) sfx(t, 'パチッ', 560, -380, 100, t0 + 3 * B, { seed: 271, rot: .12, sp: .8 });
  });
  // as it pulls back, the four vermilion corners of the viewfinder land in the corners of the frame: she has framed you
  if (bb >= 2 && bb < 6.5) { const k = eo(seg(bb, 2, 2.4)); afBox(W / 2, H / 2, lerp(2400, 1780, k), lerp(1400, 960, k), ACC, 10); }
  if (bb >= 2 && bb < 6.5) sfx(t, 'ピピッ', 1640, 940, 80, t0 + 2 * B, { seed: 277, rot: -.1, sp: .8 });
}

// ════════ End card: the last spread. Brand on the right page, colophon (okuzuke) on the left ════════
const HR = [[90, -470], [900, -480], [900, 70], [60, 100]];
function S_end(t) {
  const t0 = T('c7'), lt = t - t0, to = T('outro');
  X.fillStyle = PAPER; X.fillRect(0, 0, W, H);
  cam(t, 0, 0, lerp(1, 1.018, eio(seg(lt, 0, 6))), 0, () => {
    X.fillStyle = PAPER; X.fillRect(-1300, -900, 2600, 1800);
    // spine shadow (line tone)
    X.drawImage(lineTone('spine', 120, 1100, (u) => .5 * (1 - Math.abs(u - .5) * 2) ** 2, 6, 90), -60, -550);
    // right page: burst lines (uni-flash) on black, the vermilion camera smashing out of the frame
    panel(t, HR, t0, 'L', (x0, y0, w, h, l) => {
      X.fillStyle = INK; X.fillRect(x0, y0, w, h);
      focus(x0 + w * .5, y0 + h * .5, 260, 180, 220, 301 + boil(t, 10), PAPER, 7, 1000);
    }, { bg: INK, slam: 60 });
    if (t >= t0 && IMG.heroH) {
      const k = eo(seg(lt, 0, .26)), hs = lerp(1.4, 1, k) * (1 + .012 * Math.sin(lt * 3));
      put(IMG.heroH, .5, .5, 490, -200, 540 * hs, lerp(-.16, -.06, k) + .01 * Math.sin(lt * 2));   // the new camera is flatter and wider (about 1.67:1); height set from a width of ≈ 900 px
    }
    sfx(t, 'ドンッ', 30, 0, 104, t0 + .02, { seed: 307, rot: -.14, sp: .78 });   // keep clear of the speed dial and shutter button on the top plate
    text(t, 'KOMA ONE', 90, 250, 108, t0 + .05, { f: 'Dela', w: 400, rim: PAPER, rimW: 18, id: 'brand', ls: 4 });
    if (t > t0 + .05) { const k = eo(seg(t, t0 + .05, t0 + .3)); X.fillStyle = ACC; X.fillRect(94, 278, 640 * k, 15); }
    text(t, '口袋相机', 94, 366, 52, t0 + B, { ls: 6, id: 'brand2' });
    text(t, 'POCKET CAMERA', 344, 362, 40, t0 + B + .05, { f: 'Barlow', w: 800, ls: 4, id: 'brand3' });
    text(t, '每一格，都是决定性瞬间', 94, 436, 44, t0 + 2 * B, { f: 'SerifSC', id: 'slogan' });
    text(t, 'Every frame, a decisive moment.', 96, 484, 32, t0 + 2 * B + .05, { f: 'Barlow', w: 800, ls: 1, id: 'sloganEn' });
    // left page: a small panel at the top (her eye, back to the opening), colophon box below
    panel(t, [[-900, -470], [-90, -470], [-90, -250], [-900, -250]], t0 + .5 * B, 'L', (x0, y0, w, h, l) => {
      if (IMG.eye) { const iw = w + 60, ih = IMG.eye.height * iw / IMG.eye.width; X.drawImage(IMG.eye, x0 - 30 - l * 6, y0 + h / 2 - ih * .46, iw, ih); }
    }, { slam: 40 });
    if (t >= to) {
      const k = eo(seg(t, to, to + .12));
      const bx = -860, by = -190, bw = 730, bh = 600;
      X.save(); X.beginPath(); X.rect(bx - 10, by - 10, (bw + 20) * k, bh + 20); X.clip();
      X.lineWidth = 3; X.strokeStyle = INK; X.strokeRect(bx, by, bw, bh); X.lineWidth = 1.5; X.strokeRect(bx + 10, by + 10, bw - 20, bh - 20);
      X.restore();
      const c = BJ.colophon;
      text(t, c.title_cn, bx + 44, by + 96, 54, to + .02, { noPop: true, id: 'col1' });
      text(t, c.title_en, bx + 46, by + 148, 32, to + .04, { f: 'Barlow', w: 800, noPop: true, ls: 1, id: 'col2' });
      if (t > to + .06) { X.fillStyle = INK; X.fillRect(bx + 46, by + 186, (bw - 92) * eo(seg(t, to + .06, to + .3)), 2); }
      text(t, '黑白漫画分格', bx + 44, by + 268, 46, to + .08, { noPop: true, id: 'col3' });
      text(t, 'Manga Panels', bx + 342, by + 266, 40, to + .1, { f: 'Barlow', w: 800, noPop: true, ls: 2, id: 'col4' });
      text(t, 'LemoLab × Claude Opus 5.5', bx + 46, by + 350, 42, to + .12, { f: 'Barlow', w: 800, noPop: true, ls: 1, id: 'col5' });
      text(t, c.credit_cn, bx + 46, by + 438, 24, to + .14, { noPop: true, id: 'col6' });
      text(t, c.credit_en, bx + 46, by + 478, 24, to + .16, { f: 'Barlow', w: 600, noPop: true, id: 'col7' });
      text(t, c.fiction, bx + 46, by + 548, 24, to + .18, { f: 'Barlow', w: 600, noPop: true, id: 'col8' });
      sfx(t, 'パシャッ', -330, -190, 74, to + .01, { seed: 311, rot: -.1, sp: .78 });
    }
    // page number (nombre)
    X.font = '600 26px Barlow'; X.fillStyle = INK; X.textAlign = 'center'; X.fillText('29', -840, 520); X.fillText('30', 840, 520);
  });
  if (t >= to && t < to + .2) { X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = `rgba(243,240,232,${(1 - seg(t, to, to + .2)) * .85})`; X.fillRect(0, 0, W, H); }
}

// ── Section scheduling ──
const SCENES = [['intro', S_intro], ['page4', S_page4], ['title', S_title], ['v1', S_v1], ['v2', S_v2], ['v3', S_v3], ['v4', S_v4],
  ['p1', S_p1], ['p2', S_p2], ['kasha', S_kasha], ['hush', S_hush], ['c1', S_c1], ['c2', S_c2], ['c3', S_c3], ['c4', S_c4], ['c5', S_c5], ['c6', S_c6], ['c7', S_end]];
// impact frames at cuts: [cut, inverted?]
const FLASH = [['title', true], ['v2', false], ['v3', true], ['v4', false], ['p1', true], ['kasha', true], ['c1', false], ['c3', false], ['c4', true], ['c5', false], ['c6', true], ['c7', false]];

function render(t) {
  TX.length = 0;
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
  let fn = SCENES[0][1];
  for (const [id, f] of SCENES) if (t >= T(id)) fn = f;
  fn(t);
  X.setTransform(1, 0, 0, 1, 0, 0);
  for (const [id, inv] of FLASH) if (flash(t, T(id), inv)) { TX.length = 0; break; }
  X.setTransform(1, 0, 0, 1, 0, 0);
  lyrics(t);
  grain();
}

// ── Sound events (for mix.py) + beat shake ──
function buildEvents() {
  const EV = [], ev = (t, type, g = 1, pan = 0) => EV.push({ t: +t.toFixed(4), type, g, pan }), hit = (t, a) => HITS.push([t, a]);
  const b = (id, n) => T(id) + n * B;
  // intro
  ev(b('intro', 0), 'shutter', 1); ev(b('intro', 0), 'iris', .8); hit(b('intro', 0), 22);
  ev(b('intro', 1), 'ping', .5); ev(b('intro', 1.5), 'ping', .5); ev(b('intro', 2), 'shutter', .8); ev(b('intro', 3.3), 'iris', .6);
  for (let i = 0; i < 4; i++) { ev(b('page4', i) - .08, 'brush', .6, [.4, -.4, .3, -.3][i]); hit(b('page4', i), [16, 12, 10, 12][i]); }
  ev(b('page4', 0), 'street', .5); ev(b('page4', 1), 'splash', .8, -.3); ev(b('page4', 2), 'clack', .8, .3); ev(b('page4', 3), 'shine', .5, -.3);
  ev(b('title', 0), 'impact', .8); hit(b('title', 0), 26); ev(b('title', 0), 'wind', .6); ev(b('title', .5), 'brush', .5); ev(b('title', 1), 'brush', .5, -.3);
  ev(T('v1') - .05, 'tear', .7);
  // verse
  ev(b('v1', 0), 'shine', .5, .3); ev(b('v1', 0), 'whoosh', .5, .4); ev(b('v1', 3.6), 'page', .5); ev(b('v1', 4) - .08, 'brush', .6, -.3); hit(b('v1', 4), 14);
  for (let i = 4; i < 8; i++) ev(b('v1', i), 'step', .7, -.3);
  ev(b('v2', 0), 'crowd', .7); hit(b('v2', 0), 12); ev(b('v2', 2) - .08, 'brush', .5); ev(b('v2', 2), 'whoosh', .4); hit(b('v2', 2), 8); ev(b('v2', 4) - .08, 'brush', .5); hit(b('v2', 4), 8); ev(b('v2', 6), 'riser', .4);
  ev(b('v3', 0), 'impact', .5); hit(b('v3', 0), 12); ev(b('v3', 2) - .08, 'brush', .5); ev(b('v3', 2), 'swish', .6); hit(b('v3', 2), 8); ev(b('v3', 4) - .08, 'brush', .5); hit(b('v3', 4), 10); ev(b('v3', 4), 'shine', .3);
  ev(b('v4', 0), 'impact', .4); hit(b('v4', 0), 10); ev(b('v4', 0), 'ping', .3); ev(b('v4', 1.5), 'ping', .3); ev(b('v4', 3), 'ping', .3); ev(b('v4', 2.4), 'page', .4);
  ev(b('v4', 6), 'wings', 1, -.4); ev(b('v4', 6), 'impact', .6); hit(b('v4', 6), 26);
  // pre-chorus
  ev(b('p1', 0), 'wings', .35, -.2);
  for (let i = 0; i < 4; i++) ev(b('p1', .3 + i * .5), 'tick', .35, (i % 2 ? .3 : -.3));
  ev(b('p1', 2.5), 'ping', .7); ev(b('p1', 2.5) + .09, 'ping', .7); hit(b('p1', 2.5), 6);
  ev(b('p2', 0), 'heart', 1); ev(b('p2', 2), 'heart', 1); hit(b('p2', 0), 8); hit(b('p2', 2), 8); ev(b('p2', 2), 'riser', .5);
  ev(b('kasha', 0), 'shutter', 1.3); ev(b('kasha', 0), 'impact', 1); hit(b('kasha', 0), 40);
  // chorus
  ev(b('c1', 0), 'impact', .7); hit(b('c1', 0), 22);
  for (let l = 1; l < 6; l++) { ev(b('c1', l) - .1, 'page', .3); hit(b('c1', l), 8); }
  for (let k = 0; k < 24; k++) ev(b('c1', 1 + k / 4), 'shutter', k % 4 === 0 ? .5 : .32, (k % 3 - 1) * .3);
  for (let k = 0; k < 8; k++) ev(b('c1', 6 + k / 4), 'shutter', .3, (k % 2 ? .4 : -.4));
  ev(b('c2', 0), 'whoosh', .5); ev(b('c2', 0), 'wind', .6); ev(b('c2', 2), 'stop', 1); hit(b('c2', 2), 18); ev(b('c2', 5), 'clack', .8, .4); hit(b('c2', 5), 10);
  for (let k = 0; k < 6; k++) { ev(b('c3', k), 'shutter', .5, (k % 2 ? .3 : -.3)); if (k) { ev(b('c3', k) - .2, 'swish', .35); hit(b('c3', k), 8); } }
  ev(b('c3', 6), 'whoosh', .5);
  ev(b('c4', 0), 'chime', .6); ev(b('c4', 2), 'chime', .4, .3);
  ev(b('c5', 0), 'flip', 1); hit(b('c5', 0), 12); ev(b('c5', 0) + 1.0, 'impact', .4);
  ev(b('c6', 0), 'impact', .5); hit(b('c6', 0), 12); ev(b('c6', 3), 'wink', .6); ev(b('c6', 6.3), 'riser', .5); ev(b('c6', 2), 'ping', .6); ev(b('c6', 2) + .09, 'ping', .6);
  ev(b('c7', 0), 'impact', 1); hit(b('c7', 0), 30); ev(b('c7', .5) - .08, 'brush', .5, -.4);
  ev(b('outro', 0), 'shutter', 1.2); ev(b('outro', 0) - .05, 'brush', .6, -.4); hit(b('outro', 0), 8);
  return EV;
}

(async () => {
  BJ = await (await fetch('beats.json')).json();
  B = 60 / BJ.bpm; OFF = BJ.offset;
  window.DUR = BJ.dur;
  const NAMES = ['shoot', 'shootcam', 'jump', 'jumps', 'eye', 'hero', 'city', 'key', 'run', 'ready', 'aim', 'smile', 'crowd', 'over', 'pig', 'pigS', 'feet', 'finger'];
  await Promise.all(NAMES.map(load));
  for (const f of ['900 40px SansSC', '900 40px SerifSC', '40px Dela', '800 40px Barlow', '600 40px Barlow']) await document.fonts.load(f);
  await document.fonts.ready;
  for (const [n, h] of [['hero', 'heroH'], ['jump', 'jumpH'], ['key', 'keyH'], ['run', 'runH'], ['aim', 'aimH'], ['smile', 'smileH']]) if (IMG[n]) IMG[h] = halo(IMG[n], 12);
  makeGrain();
  window.EV = buildEvents();
  window.TEXTS = () => TX.slice();
  window.render = render;
  window.READY = true;
})();
