// Reading-time self-check: node core/render/readcheck.mjs <demo> [--q 'k=v'] [--step 0.04] [--latin-cps 15] [--cjk-cps 4.5] [--pad 1.5] [--min 1.5] [--size 1920x1080]
// Page contract: window.TEXTS(t) → [{id, text, x0, y0, x1, y1}]: every piece of text visible on screen at t seconds and its screen box (pixels, viewport the same as --size, default 1920×1080).
//   id identifies "this block of text" (a number or a string); if the text under the same id changes, it counts as a new piece and timing restarts. Don't report the subtitle bar: its hold is set by the .srt.
//   text must be the block's [complete text] from the first frame it appears: if a typewriter effect reports "the substring typed so far", every extra character is a new piece and the whole check fails —
//   for typewriter text, always report the full text in TEXTS and leave "which characters are shown yet" to the picture itself.
// Rule (same as DIRECTOR.md §7): from the moment a piece of text first fully enters the frame, the time it stays fully in frame continuously, and still in TEXTS, must be ≥
//   (number of hanzi/kana/hangul ÷ cjk-cps + number of other non-whitespace characters ÷ latin-cps) + pad seconds, and no less than min. Defaults 4.5 chars/s (CJK), 15 chars/s (alphanumeric), pad 1.5, min 1.5.
//   Text that never fully enters the frame (cropped at the edge, a ticker running out of frame) is reported as "never fully visible".
//   Text the viewer isn't meant to read in full (a shop sign in a fly-through, a label the camera sweeps past, the fine-print licence credits
//   on an end card) can carry pass: true: it is listed as passing and not timed. Anything the film needs the viewer to read must not be marked.
// Exit code: 0 all pass; 1 some fail; 2 the check couldn't run (the page has no window.TEXTS, or the whole film never returned any text) — this does not count as a pass.
import { openDemo, closeServer, requireDemo, takeSize } from './page.mjs';
const args = process.argv.slice(2), { w: VW, h: VH } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0]; requireDemo(dir);
const Q = opt('--q', ''), STEP = +opt('--step', 0.04), LATIN = +opt('--latin-cps', 15), CJK = +opt('--cjk-cps', 4.5), PAD = +opt('--pad', 1.5), MIN = +opt('--min', 1.5);
if (![STEP, LATIN, CJK, PAD, MIN].every(Number.isFinite) || STEP <= 0 || LATIN <= 0 || CJK <= 0) { console.error('bad option value (step and the cps values must be > 0)'); process.exit(2); }
const { browser, page } = await openDemo(dir, { w: VW, h: VH, q: Q, gl: false });   // reads text boxes, draws nothing
const res = await page.evaluate(({ STEP }) => {
  if (typeof window.TEXTS !== 'function') return { noTexts: true };
  if (!(window.DUR > 0)) return { noDur: true };
  const W = innerWidth, H = innerHeight, seen = {}, partial = {}, passing = {};
  for (let t = 0; t <= window.DUR; t += STEP) {
    window.render(t);
    const vis = new Set();
    for (const b of window.TEXTS(t) || []) {
      b.id = String(b.id);   // numeric ids are fine too
      const key = b.id + '\u0000' + b.text;   // text changed under the same id = a new piece
      if (b.pass) { passing[key] ??= { id: b.id, text: b.text, t0: t }; continue; }   // only passed, not read: listed, not timed
      if (!(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= W && b.y1 <= H)) { partial[key] ??= { id: b.id, text: b.text, t0: t }; continue; }
      vis.add(key);
      const s = seen[key] ??= { id: b.id, text: b.text, t0: t, run: 0, done: false };
      if (!s.done) s.run = Math.min(t + STEP, window.DUR) - s.t0;
    }
    for (const k in seen) if (!vis.has(k)) seen[k].done = true;   // only the first continuous on-screen stretch counts
  }
  for (const k in partial) if (seen[k]) delete partial[k];
  return { seen: Object.values(seen), partial: Object.values(partial), passing: Object.values(passing) };
}, { STEP });
await browser.close(); closeServer();

if (res.noTexts || res.noDur || (!res.seen.length && !res.partial.length && !res.passing.length)) {
  console.error('readcheck: NOT CHECKED — ' + (res.noTexts ? 'the page has no window.TEXTS(t) (see the header of core/render/readcheck.mjs for the contract).'
    : res.noDur ? 'window.DUR is not a positive number.' : 'window.TEXTS(t) never returned any text over the whole film.') + ' This is not a pass.');
  process.exit(2);
}
const isCJK = ch => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch);
const need = text => { let cjk = 0, other = 0; for (const ch of text) { if (/\s/.test(ch)) continue; isCJK(ch) ? cjk++ : other++; } return Math.max(MIN, cjk / CJK + other / LATIN + PAD); };
let bad = 0;
for (const s of res.seen) {
  const n = need(s.text), ok = s.run >= n - 1e-6; if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'BAD'} ${s.id.padEnd(18)} at ${s.t0.toFixed(2)}s  ${String([...s.text].filter(c => !/\s/.test(c)).length).padStart(3)} chars  need ${n.toFixed(2)}s  got ${s.run.toFixed(2)}s  ${JSON.stringify(s.text.slice(0, 24))}`);
}
for (const s of res.partial) { bad++; console.log(`BAD ${s.id.padEnd(18)} at ${s.t0.toFixed(2)}s  never fully visible (its box is outside the frame)  ${JSON.stringify(s.text.slice(0, 24))}`); }
for (const s of res.passing) console.log(`--  ${s.id.padEnd(18)} at ${s.t0.toFixed(2)}s  passing (pass: true), not timed  ${JSON.stringify(s.text.slice(0, 24))}`);
process.exit(bad ? 1 : 0);
