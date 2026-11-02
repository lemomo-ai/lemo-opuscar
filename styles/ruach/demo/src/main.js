// Ruach page: one timeline of shots (cuts and dissolves); window.render(t) draws second t.
// ?shot=<name> renders a single shot from t = 0. Text (key word, quote) is HTML over the canvas.
import * as THREE from 'three';
import { Pipe } from './post.js';
import { dispose } from './ruach.js';
import { ss, seg } from './lib.js';
import * as SH from './shots.js';

const Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') || 2);
const W = innerWidth || 1920, H = innerHeight || 1080;
const canvas = document.getElementById('c'); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, W, H, SSAA);
await Promise.all([document.fonts.load('500 40px EBGaramond', 'aφ'), document.fonts.load('italic 500 40px EBGaramond', 'a'), document.fonts.load('500 40px Inter', 'a')]);
const E = { w: W, h: H, ss: SSAA };

// The film: [build, start, transition]. Shot-local time starts at 0.
const FILM = Q.has('shot') ? [[E => SH[Q.get('shot')](E), 0]] : [[E => SH.forest(E, 'ember'), 0], [E => SH.forest(E, 'dawn'), 6.4]];
const DUR = Q.has('shot') ? 8 : 26.5;
window.DUR = DUR;
const live = new Map();
const get = i => { if (!live.has(i)) live.set(i, FILM[i][0](E)); return live.get(i); };
const gc = keep => { for (const [i, s] of live) if (i !== keep) { dispose(s.scene); live.delete(i); } };

// On-screen text: id, element, [in, out] in film time
const TXT = [
  { id: 'word', el: document.getElementById('word'), t0: 6.9, t1: 13.0 },
  { id: 'quote', el: document.getElementById('quote'), t0: 17.4, t1: 25.0 },
];
function R(t) {
  let i = FILM.length - 1; while (i > 0 && t < FILM[i][1]) i--;
  const s = get(i), tl = t - FILM[i][1]; gc(i);
  s.update(tl);
  pipe.shot(s.scene, s.cam, s.post(), pipe.rtA);
  const fade = Q.has('shot') ? 1 : ss(seg(t, 0, .8)) * (1 - ss(seg(t, DUR - 2, DUR)));
  pipe.final({ ...s.grade(), time: t, fade });
  for (const x of TXT) x.el.style.opacity = Q.has('notext') ? 0 : Math.min(ss(seg(t, x.t0, x.t0 + .9)), 1 - ss(seg(t, x.t1 - .7, x.t1)));
}
window.render = R;
window.TEXTS = t => TXT.filter(x => t > x.t0 + .9 && t < x.t1 - .7).map(x => { const b = x.el.getBoundingClientRect(); return { id: x.id, text: x.el.innerText, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom }; });
window.READY = true;
