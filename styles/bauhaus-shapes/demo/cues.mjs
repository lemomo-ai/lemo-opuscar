// Subtitle cues from the page (film.js), shifted to the cut: node styles/bauhaus-shapes/demo/cues.mjs <a> <b> <out.json>
// Writes [{t0, t1, text}] (text = Chinese line \n English line) for core/render/srt.py, and checks the house rules:
// each cue ≥ 1.8 s and ≥ its voice line + 0.6 s.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const [a = '0', b = '52', out = path.join(here, 'out', 'cues.json')] = process.argv.slice(2);
const { browser, page } = await openDemo(here, { w: 1920, h: 1080, q: '' });
const cues = await page.evaluate(() => window.CUES);
await browser.close(); closeServer();
const A = +a, B = +b, res = [];
let bad = 0, minHold = 99;
for (const c of cues) {
  if (c.t1 <= A || c.t0 >= B) continue;
  const t0 = Math.max(0, c.t0 - A), t1 = Math.min(B, c.t1) - A;
  res.push({ t0: +t0.toFixed(2), t1: +t1.toFixed(2), text: c.text });
  const hold = c.t1 - c.t0; minHold = Math.min(minHold, hold);
  if (hold < 1.8 || hold < c.vd + 0.6) { bad++; console.error('cue too short:', c.text.split('\n')[1], hold.toFixed(2), 'voice', c.vd); }
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log('cues', res.length, 'shortest hold', minHold.toFixed(2), 's', bad ? `(${bad} too short)` : 'ok', '→', out);
if (bad) process.exit(1);
