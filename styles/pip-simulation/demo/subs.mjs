// Export the bilingual subtitles: node styles/pip-simulation/demo/subs.mjs <out.json> (from the library root) → [{t0, t1, text: Chinese\nEnglish}] for core/render/srt.py
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), LIB = process.env.LIB || path.resolve(HERE, '../../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(HERE, { q: '', warnings: true });
const subs = await page.evaluate(() => window.SUBS.map(s => ({ t0: +s.t0.toFixed(2), t1: +s.t1.toFixed(2), text: s.zh + '\n' + s.en })));
fs.writeFileSync(process.argv[2], JSON.stringify(subs, null, 1));
console.log(subs.length, 'subtitles, shortest', Math.min(...subs.map(s => s.t1 - s.t0)).toFixed(2) + 's');
await browser.close(); closeServer();
