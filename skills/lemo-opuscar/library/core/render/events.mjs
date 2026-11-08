// Export sound-effect events: node core/render/events.mjs <demo> [--q 'content=content_alt.json'] [--out <file>] [--size 1920x1080]
// Writes <demo>/events.json by default; with different content, pass parameters to the page with --q and write elsewhere with --out, so the main film's event list isn't overwritten
import fs from 'fs'; import path from 'path';
import { openDemo, closeServer, requireDemo, takeSize } from './page.mjs';
const args = process.argv.slice(2), { w, h } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0]; requireDemo(dir);
const Q = opt('--q', ''), out = opt('--out', path.join(dir, 'events.json'));
const { browser, page } = await openDemo(dir, { w, h, q: Q, gl: false });   // reads the timeline, draws nothing
const ev = await page.evaluate(() => ({ dur: window.DUR, ev: window.EV || [] }));
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, JSON.stringify(ev, null, 0));
console.log('events', ev.ev.length, 'dur', ev.dur, '→', out);
await browser.close(); closeServer();
