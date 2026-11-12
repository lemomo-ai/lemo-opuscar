// the film's .srt: the subtitle cues the page draws (window.SUBS_CUES, whole-film seconds) → out/cues.json → core srt.py
// node styles/marker-paper/demo/tools/srt.mjs   (from the library root)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080 });
const c = await page.evaluate(() => window.SUBS_CUES);
fs.writeFileSync(path.join(dir, 'out', 'cues.json'), JSON.stringify(c, null, 1));
await browser.close(); closeServer();
console.log(c.length, 'cues; shortest', Math.min(...c.map(x => x.t1 - x.t0)).toFixed(2), 's');
