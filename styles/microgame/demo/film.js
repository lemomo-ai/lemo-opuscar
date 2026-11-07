// Whole-film assembly: segments → picture; TV-frame transitions, stage, slot machine, Boss collage, end card, subtitles, sound-effect events
import { P, K, setCtx, part, line, circ, rrect, poly, outlined } from './toon.js';
import { drawDot, drawTick, whiteGlove } from './chars.js';
import { drawStage, TV, tvCam, confetti } from './stage.js';
import { fuse, command, stamp, subtitle, lifeIcon } from './hud.js';
import { canvas } from './glpass.js';
import { SEGS, S, find, bt, DUR } from './timeline.js';
import * as CRY from './g_crayon.js';
import * as INK from './g_ink.js';
import * as AS from './g_ascii.js';
import * as RS from './g_riso.js';
import * as PX from './g_pixel.js';
import * as BL from './g_blue.js';
import * as SWS from './g_swiss.js';
import * as BOSS from './g_boss.js';
import { clamp, seg, eo, ei, ss, lerp, mulberry, back } from '/core/lib.js';
const TAU = Math.PI * 2;
export { DUR };

const SCENE = { G1: CRY.scenePump, G2: INK.sceneSneeze, G3: AS.sceneStrap, G4: RS.sceneCatch, G5: PX.sceneDodge, G6: BL.sceneZip, G7: SWS.sceneSalute, BOSS: BOSS.sceneBoss };
const GAMES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
let MAIN = null;
function renderGameTo(ctx, id, lt) { setCtx(ctx); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080); SCENE[id](ctx, lt); ctx.restore(); setCtx(MAIN); }
// Static frame cache (game first / last frame, Boss first frame, stage stills)
const CACHE = {};
function still(key, fn) { if (CACHE[key]) return CACHE[key]; const [c, x] = canvas(); fn(x); return (CACHE[key] = c); }
const lastFrame = id => still('last_' + id, x => renderGameTo(x, id, S[id].t1 - S[id].t0 - 1e-3));
const firstFrame = id => still('first_' + id, x => renderGameTo(x, id, 0));

// ───────── lines / subtitles / sound-effect events ─────────
let LINES = [], DURS = {};
export function setLines(lines, dur) { LINES = lines; DURS = dur; }
export function subs() {
  const out = [];
  const L = LINES.filter(l => !l.cmd && !l.fx);
  L.forEach((l, i) => { let t1 = l.t + Math.max(1.8, (DURS[l.id] || 1) + .6); const nx = L[i + 1]; if (nx && t1 > nx.t - .05) t1 = nx.t - .05; out.push({ t0: l.t, t1, text: l.text, who: l.who }); });
  return out;
}
export function srtCues() {   // the .srt includes command words
  return LINES.filter(l => !l.fx).map(l => ({ t0: l.t, t1: l.t + Math.max(l.cmd ? .9 : 1.8, (DURS[l.id] || 1) + .6), text: l.text }));
}
export function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(4), type, ...o });
  for (const l of LINES) ev(l.t, 'voice', { id: l.id, who: l.who });
  for (const s of SEGS) {
    if (s.kind === 'game' || s.kind === 'boss') { ev(s.t0, 'fuse_on', { dur: s.t1 - s.t0, boss: s.kind === 'boss' }); ev(s.t0, 'cmd_slam'); }
    if (s.kind === 'stage' || s.id === 'END') { ev(s.t0, 'tv_out'); }
  }
  // stage: crown tap, TV push-in, life cracking, lights off, button
  const crown = { S1: 3.5, S2: 1.5, S3: 1.5, S5: .65, S6: .65 };
  for (const [id, lt] of Object.entries(crown)) ev(S[id].t0 + lt, 'crown');
  for (const id of ['S1', 'S2', 'S3', 'S5', 'S6', 'RESULT']) ev(S[id].t1 - tvOutDur(S[id]), 'tv_in');
  ev(S.S2.t0 + .2, 'crack'); ev(S.S7.t0 + .05, 'crack'); ev(S.S7.t0, 'lights_off');
  ev(S.S1.t0 + .05, 'stamp_ok'); ev(S.S3.t0 + .05, 'stamp_ok'); ev(S.S5.t0 + .05, 'stamp_ok'); ev(S.S6.t0 + .05, 'stamp_ok'); ev(S.S4.t0 + .05, 'stamp_ok'); ev(S.RESULT.t0 + .05, 'stamp_ok');
  ev(S.S2.t0 + .05, 'stamp_bad'); ev(S.S7.t0 + .05, 'stamp_bad');
  ev(S.S4.t0 + 1.25, 'insert_whoosh'); ev(S.S4.t0 + 1.5, 'button');
  for (let k = 0; k < 8; k++) ev(S.S1.t0 + .25 + k * .09, 'bulb', { i: k });
  // SPEED: reels
  ev(S.SPEED.t0, 'reels_spin', { dur: S.SPEED.beatT[3] - S.SPEED.t0 }); for (let k = 1; k <= 3; k++) ev(S.SPEED.beatT[k], 'reel_stop', { k });
  ev(S.SPEED.t1 - .2, 'zoom_whoosh');
  // BOSSIN: tiles flipping over
  for (let k = 0; k < 8; k++) ev(bt('BOSSIN', k / 2), 'tile_flip', { k });
  for (let k = 0; k < 6; k++) ev(bt('BOSSIN', 2.3 + k * .25), 'tile_flip', { k: k + 8, soft: true });
  // foley for each game
  const g = id => S[id].t0;
  CRY.PUMPS.forEach((p, i) => ev(g('G1') + p, 'pump', { i })); ev(g('G1') + 3.0, 'float_up'); ev(g('G1') + 3.0, 'yay');
  ev(g('G2') + .5, 'dust'); ev(g('G2') + 2.5, 'sneeze'); ev(g('G2') + 2.5, 'ink_splat'); ev(g('G2') + 3.0, 'drip'); ev(g('G2') + 3.5, 'blink');
  ev(g('G3') + .8, 'typing', { dur: 2.6 }); [1.0, 1.5, 2.0].forEach((t, i) => ev(g('G3') + t, 'ratchet', { i })); ev(g('G3') + 2.5, 'buckle'); ev(g('G3') + 3.0, 'beep2');
  ev(g('G4') + .2, 'float_whoosh'); ev(g('G4') + 2.5, 'grab'); ev(g('G4') + 3.0, 'chomp');
  PX.DODGE_HITS.forEach((h, i) => { ev(g('G5') + h - .2, 'jump', { i }); ev(g('G5') + h - .15, 'meteor', { i }); }); ev(g('G5') + PX.DODGE_HITS[2], 'graze');
  ev(g('G6') + .05, 'pencil'); BL.ZIP_STEPS.forEach((t, i) => ev(g('G6') + t, 'zip', { i })); ev(g('G6') + BL.ZIP_STAMP, 'red_stamp');
  ev(g('G7') + SWS.SAL.swing, 'swing'); ev(g('G7') + SWS.SAL.hit, 'bonk'); ev(g('G7') + SWS.SAL.hit + SWS.BOUNCE[0], 'bounce', { i: 0 }); ev(g('G7') + SWS.SAL.hit + SWS.BOUNCE[1], 'bounce', { i: 1 });
  ev(g('G7') + SWS.SAL.rep0, 'replay_in'); ev(g('G7') + SWS.SAL.rep1, 'replay_out'); ev(g('G7') + SWS.SAL.rep1, 'roll', { dur: .45 });
  const b = g('BOSS'), T = BOSS.BT;
  ev(b, 'reentry', { dur: T.zoom }); for (let k = 0; k < 12; k++) ev(b + k * .375, 'cloud_whoosh', { k });
  ev(b + T.pull, 'lever'); ev(b + T.pop, 'chute_pop'); ev(b + T.err, 'err'); ev(b + T.zoom, 'zoom_in');
  ev(b + T.dust, 'dust'); ev(b + T.achoo, 'sneeze_big'); ev(b + T.achoo, 'ink_boom'); ev(b + T.achoo + .55, 'canopy_open');
  ev(b + T.canopy, 'wind', { dur: T.land - T.canopy }); ev(b + T.land, 'splash'); ev(b + T.clear, 'clear');
  const r = g('RESULT');
  ev(r + .15, 'confetti'); ev(r + .2, 'applause', { dur: 3.2 }); [.35, .5, .65].forEach((t, i) => ev(r + t, 'hop', { i })); ev(bt('RESULT', 7), 'salute'); ev(bt('RESULT', 8), 'tick_hand');
  ev(S.END.t0 + 2.2, 'rocket_pop');
  E.sort((a, b2) => a.t - b2.t);
  return E;
}

// ───────── stage segments ─────────
const R2 = s => (s.bpm === 140 || (Array.isArray(s.bpm) && s.bpm[0] >= 140));
function tvOutDur(s) { return s.id === 'RESULT' ? .3 : R2(s) ? .2 : .25; }
function tvInDur(s) { return R2(s) ? .25 : .33; }
const PREV = { S1: 'G1', S2: 'G2', S3: 'G3', S4: 'G4', S5: 'G5', S6: 'G6', S7: 'G7', RESULT: 'BOSS' };
const NEXT = { S1: 'G2', S2: 'G3', S3: 'G4', S5: 'G6', S6: 'G7' };
const BADGE = { S1: 2, S2: 3, S3: 4, S4: 5, S5: 6, S6: 7, S7: 8 };
function tickState(id, lt, t) {
  const T = Math.floor(lt * 12) / 12;
  const beatNo = Math.floor(t / (60 / 120));
  const st = { pose: 'present', face: 'grin', view: 'q', hand: beatNo * TAU / 12, press: 0 };
  const slapAt = { S1: 3.5, S2: 1.5, S3: 1.5, S5: .65, S6: .65 }[id];
  if (id === 'S2' && T >= .15 && T < 1.25) { st.pose = 'facepalm'; st.face = 'facepalm'; st.view = 'front'; }
  if (id === 'S3' && T >= .1 && T < 1.1) { st.pose = 'cheer'; st.face = 'cheer'; st.view = 'front'; }
  if (id === 'S4') { st.pose = 'point'; st.face = 'sly'; }
  if (id === 'S7') { st.pose = 'serious'; st.face = 'serious'; st.view = 'front'; st.hand = 0; }
  if (id === 'RESULT') { st.pose = 'cheer'; st.face = 'cheer'; st.view = 'front'; st.hand = t * 14; const sal = bt('RESULT', 7) - S.RESULT.t0; if (T >= sal) { st.pose = 'present'; st.face = 'grin'; st.view = 'q'; st.hand = T >= sal + .37 ? 0 : (t * 14); } }
  if (slapAt !== undefined && T >= slapAt - .25 && T < slapAt + .15) { st.pose = 'slap'; st.face = 'shout'; st.view = 'front'; st.press = T >= slapAt ? 1 : 0; }
  return st;
}
const [scr] = canvas();
function stageSeg(g, s, lt, t) {
  const id = s.id, T12 = Math.floor(lt * 12) / 12, dur = s.t1 - s.t0;
  const prev = PREV[id], next = NEXT[id] || (id === 'RESULT' ? 'END' : null);
  const tin = tvInDur(s), tout = next ? tvOutDur(s) : 0;
  let u = 0, screen = prev ? lastFrame(prev) : null, showStamp = true;
  if (lt < tin) u = 1 - eo(lt / tin);
  if (next && lt > dur - tout) { u = ei((lt - (dur - tout)) / tout); screen = next === 'END' ? still('endcard', x => endCard(x, 0)) : firstFrame(next); showStamp = false; }
  // S4 button close-up insert
  if (id === 'S4' && lt >= 1.25) return buttonInsert(g, lt - 1.25, t);
  const lives = { S1: 3, S2: 2, S3: 2, S4: 2, S5: 2, S6: 2, S7: 1, RESULT: 1 }[id];
  const crack = id === 'S2' ? [2, seg(lt, .2, 1.1)] : id === 'S7' ? [1, seg(lt, .05, .95)] : null;
  const st = {
    lives, crack: crack && crack[1] > 0 && crack[1] < 1 ? crack : null, stage: BADGE[id], screen,
    title: id === 'S1' ? seg(lt, .25, .95) : 1, sub: id === 'S1' && lt >= 1.0, dark: id === 'S7' && lt >= .05,
    blink: id === 'S7' && lt > 1 ? .55 + .45 * Math.cos(lt * 12) : 0,
    tick: tickState(id, lt, t),
    confetti: id === 'RESULT' ? S.RESULT.t0 + .15 : null,
  };
  if (id === 'RESULT') {
    const salT = bt('RESULT', 7) - S.RESULT.t0;
    const hopU = seg(T12, .3, .75), x = lerp(2100, 1270, eo(hopU)), y = 1010 - Math.abs(Math.sin(hopU * Math.PI * 3)) * 50 * (1 - hopU);
    const sal = T12 >= salT, antW = sal ? Math.sin((T12 - salT) * 26) * Math.exp(-(T12 - salT) * 6) * .5 : Math.sin(T12 * 18) * .3;
    st.dot = { x, y, s: 1.5, face: sal ? 'proud' : 'happy', pose: sal ? 'salute' : 'stand', view: sal ? 'front' : 'q', ant: antW };
    st.stage = undefined;
  }
  g.save(); tvCam(g, u);
  drawStage(g, t, st);
  if (prev && showStamp && lt > tin * .6) {
    const ok = S[prev].ok;
    stamp(g, ok, id === 'RESULT' ? TV.cx - 300 : TV.cx + 300, TV.cy + 150, lt - tin * .6, .85);
  }
  g.restore();
  // subtitles
}
function buttonInsert(g, lt, t) {
  // big red button close-up: white glove slams down from above (beat 1.5 = local .25)
  g.fillStyle = P.deep; g.fillRect(0, 0, 1920, 1080);
  g.save(); g.translate(960, 640); g.scale(3.2, 3.2); g.translate(-1600, -700);
  drawStage(g, t, { lives: 2, marquee: false, tick: { x: -900 }, press: lt >= .25 ? 1 : 0 });
  g.restore();
  // radial speed lines
  g.save(); g.globalAlpha = .5; g.strokeStyle = P.gold; g.lineWidth = 8;
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(960 + Math.cos(a) * 700, 560 + Math.sin(a) * 700); g.lineTo(960 + Math.cos(a) * 1300, 560 + Math.sin(a) * 1300); g.stroke(); }
  g.restore();
  const gy = lt < .25 ? lerp(-300, 330, ei(lt / .25)) : 330 + (lt < .33 ? 0 : 0);
  K.s = 3; g.save(); whiteGlove(960, gy, Math.PI, 3.4); g.restore(); K.s = 1;
  // arm
  g.save(); g.fillStyle = P.mag; g.strokeStyle = P.ink; g.lineWidth = 8; g.fillRect(900, -40, 120, gy - 40 + 40); g.strokeRect(900, -40, 120, gy); g.restore();
  if (lt >= .25) { g.save(); g.globalAlpha = .6 * Math.max(0, 1 - (lt - .25) / .2); g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080); g.restore(); outlined(g, 'SMASH!', 960, 250, { font: '160px Titan', lw: 18, fill: P.gold, shadow: P.mag, sd: [8, 12] }); }
}
// ───────── SPEED UP slot machine ─────────
const REEL_ITEMS = () => [still('stageS4', x => { setCtx(x); drawStage(x, 24, { lives: 2, stage: 5, screen: lastFrame('G4'), tick: tickState('S4', .5, 24.5) }); setCtx(MAIN); }), lastFrame('G1'), lastFrame('G2'), lastFrame('G3'), lastFrame('G4')];
function speedTile(g, k, x0, w) {
  g.fillStyle = [P.gold, P.mag, P.cyan][k]; g.fillRect(x0, 0, w, 1080);
  g.save(); g.beginPath(); g.rect(x0, 0, w, 1080); g.clip(); g.translate(x0 + w / 2, 540);
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 16; i += 2) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1400, i / 16 * TAU, (i + 1) / 16 * TAU); g.fill(); }
  const txt = ['SPEED', 'UP', '!'][k];
  outlined(g, txt, 0, 70, { font: `${k === 0 ? 170 : 230}px Titan`, lw: 22, fill: P.white, shadow: P.ink, sd: [10, 14] });
  g.restore();
}
function speedSeg(g, s, lt, t) {
  const items = REEL_ITEMS(), w = 640, H = 1080;
  const stops = [1, 2, 3].map(k => s.beatT[k] - s.t0);
  for (let k = 0; k < 3; k++) {
    const x0 = k * w, stop = stops[k];
    g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    if (lt >= stop) {
      const b2 = lt - stop, bounce = Math.sin(b2 * 30) * 60 * Math.exp(-b2 * 12);
      g.translate(0, bounce); speedTile(g, k, x0, w);
      g.restore(); continue;
    }
    // spinning: offset = integral of speed (accelerate then decelerate), decelerating in the 0.1s before the stop
    const spin = Math.min(lt, stop), v0 = 5200;
    const pos = v0 * (spin - .5 * spin * spin / (stop * 1.6)) + k * 400;
    const n = items.length + 1, total = n * H;
    for (let j = -1; j <= 1; j++) {
      const off = ((pos + j * H) % total + total) % total, idx = Math.floor(off / H), fy = -(off - idx * H);
      for (let m = 0; m < 2; m++) {
        const ii = (idx + m) % n, yy = fy + m * H + j * 0;
        if (j !== 0) continue;
        if (ii === items.length) speedTile(g, k, x0, w);
        else { g.globalAlpha = 1; g.drawImage(items[ii], x0, 0, w, H, x0, yy, w, H); }
        // motion blur: two more offset semi-transparent layers on top
        g.globalAlpha = .35; if (ii < items.length) { g.drawImage(items[ii], x0, 0, w, H, x0, yy - 60, w, H); g.drawImage(items[ii], x0, 0, w, H, x0, yy - 120, w, H); } g.globalAlpha = 1;
      }
    }
    g.restore();
  }
  // reel frame: gold frame + ink-coloured dividers
  g.save(); g.fillStyle = P.ink; for (const x of [0, 640, 1280, 1920]) g.fillRect(x - 12, 0, 24, 1080);
  g.strokeStyle = P.gold; g.lineWidth = 8; for (const x of [640, 1280]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1080); g.stroke(); }
  // top and bottom shading (drum curvature)
  const gr = g.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, 'rgba(20,6,50,.55)'); gr.addColorStop(.2, 'rgba(20,6,50,0)'); gr.addColorStop(.8, 'rgba(20,6,50,0)'); gr.addColorStop(1, 'rgba(20,6,50,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); g.restore();
  // last 0.2s: push into the "!" and flash white
  const zu = seg(lt, s.t1 - s.t0 - .2, s.t1 - s.t0);
  if (zu > 0) { g.save(); g.globalAlpha = zu * .9; g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080); g.restore(); }
}
// ───────── BOSS STAGE collage ─────────
function bossinSeg(g, s, lt, t) {
  g.fillStyle = '#0c0420'; g.fillRect(0, 0, 1920, 1080);
  const bossF = still('boss0', x => renderGameTo(x, 'BOSS', 0));
  const tw = 480, th = 540;
  for (let k = 0; k < 8; k++) {
    const c = k % 4, r = Math.floor(k / 4), x = c * tw, y = r * th;
    const tIn = bt('BOSSIN', k / 2) - s.t0, tOut = bt('BOSSIN', 2.3 + (c + r) * .25) - s.t0;
    if (lt < tIn) continue;
    let sx = eo(seg(lt, tIn, tIn + .08)), face = 0;
    if (lt >= tOut) { const u = seg(lt, tOut, tOut + .12); sx = Math.abs(Math.cos(u * Math.PI)); face = u >= .5 ? 1 : 0; }
    g.save(); g.translate(x + tw / 2, y + th / 2); g.scale(Math.max(.02, sx), 1); g.translate(-(x + tw / 2), -(y + th / 2));
    if (face) g.drawImage(bossF, x, y, tw, th, x, y, tw, th);
    else if (k < 7) { g.drawImage(lastFrame(GAMES[k]), 0, 0, 1920, 1080, x + 10, y + 10, tw - 20, th - 20); g.strokeStyle = P.gold; g.lineWidth = 8; g.strokeRect(x + 10, y + 10, tw - 20, th - 20); }
    else { g.fillStyle = P.red; g.fillRect(x + 10, y + 10, tw - 20, th - 20); outlined(g, 'BOSS', x + tw / 2, y + th / 2 + 40, { font: '120px Titan', lw: 16, fill: P.white }); }
    g.restore();
  }
  const e15 = bt('BOSSIN', .75) - s.t0, e5 = bt('BOSSIN', 2.3) - s.t0;
  command(g, 'BOSS STAGE!', lt - e15, e5 - e15 - .05, { burst: P.red, size: 190, noTag: true });
}
// ───────── end card ─────────
export function endCard(g, lt) {
  setCtx(g);
  g.fillStyle = P.deep; g.fillRect(0, 0, 1920, 1080);
  g.save(); g.translate(960, 540); for (let i = 0; i < 28; i += 2) { const a0 = lt * .15 + i / 28 * TAU; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1600, a0, a0 + TAU / 28); g.fillStyle = '#3d168f'; g.fill(); } g.restore();
  const T = Math.floor(lt * 12) / 12, pop = k => back(seg(T, k, k + .25), 2.2);
  g.save(); g.translate(960, 400); g.scale(pop(0), pop(0));
  outlined(g, 'FIVE-SECOND', 0, -30, { font: '150px Titan', lw: 22, fill: P.white, shadow: P.mag, sd: [8, 14] });
  outlined(g, 'ASTRONAUT', 0, 130, { font: '150px Titan', lw: 22, fill: P.gold, shadow: P.mag, sd: [8, 14] });
  g.restore();
  g.save(); g.globalAlpha = clamp(seg(T, .3, .5)); outlined(g, 'Microgame Frenzy', 960, 650, { font: '64px Lilita', lw: 10, fill: P.cyan }); g.restore();
  g.save(); g.globalAlpha = clamp(seg(T, .5, .7)); outlined(g, 'LemoLab × Claude Opus 5.5', 960, 760, { font: '52px Lilita', lw: 8, fill: P.white }); g.restore();
  // licence credits (fine print): on the card from its first frame, so they hold the whole 2.6 s
  g.save(); g.font = '500 22px Inter'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.82)';
  g.fillText('Piano: “Salamander Grand Piano V3” by Alexander Holm, CC BY 3.0', 960, 838);
  g.fillText('Drums: “MuldjordKit” by Lars Muldjord, CC BY 4.0', 960, 870); g.restore();
  drawDot(330, 1000, 1.25 * pop(.15), { face: 'proud', pose: 'salute' });
  drawTick(1600, 1030, 1.0 * pop(.25), { face: 'grin', pose: 'present', view: 'q', flip: true, hand: 0 });
  setCtx(MAIN);
}
// ───────── main render ─────────
let SUBS = [];
export function renderFilm(g, t, Q) {
  MAIN = g; setCtx(g); K.s = 1;
  if (!SUBS.length && LINES.length) SUBS = subs();
  const s = find(t), lt = t - s.t0;
  g.save();
  if (s.kind === 'game' || s.kind === 'boss') {
    SCENE[s.id](g, lt); setCtx(g); K.s = 1;
    const hold = s.kind === 'boss' ? .75 : R2(s) ? .64 : .75;
    const repl = s.id === 'G7' && lt >= SWS.SAL.rep0 && lt < SWS.SAL.rep1;
    if (!repl) command(g, s.cmd, lt, hold);
    if (s.kind === 'boss' && lt >= BOSS.BT.pull && lt < BOSS.BT.zoom) command(g, 'PULL!', lt - BOSS.BT.pull, .5, { size: 200, noTag: true });
    const dur = s.t1 - s.t0;
    let prog = lt / dur;
    if (s.id === 'G7') prog = SWS.live7(lt) / (dur - (SWS.SAL.rep1 - SWS.SAL.rep0));
    const inReplay = s.id === 'G7' && lt >= SWS.SAL.rep0 && lt < SWS.SAL.rep1;
    const hideFuse = inReplay || (s.kind === 'boss' && lt >= BOSS.BT.zoom && lt < BOSS.BT.achoo + .3);
    if (!hideFuse) fuse(g, prog, s.kind === 'boss' ? 16 : s.beats - (s.id === 'G7' ? 2 : 0), t, { boss: s.kind === 'boss' });
  } else if (s.kind === 'stage') stageSeg(g, s, lt, t);
  else if (s.kind === 'speed') speedSeg(g, s, lt, t);
  else if (s.kind === 'bossin') bossinSeg(g, s, lt, t);
  else if (s.kind === 'end') endCard(g, lt);
  g.restore();
  // subtitles
  if (!Q || !Q.has('nosub')) for (const c of SUBS) if (t >= c.t0 && t < c.t1) subtitle(g, c.text, t - c.t0, c.t1 - c.t0, { icon: c.who === 'dot' ? 'dot' : 'tick', y: (s.kind === 'game' || s.kind === 'boss') ? 900 : 950 });
}
