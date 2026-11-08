// Render stills: node core/render/still.mjs <demo> <t> [<t> ...] [--range a:b:step] [--q 'k=v&..'] [--prefix t_] [--out dir] [--size 1920x1080]
// <demo> = the folder that holds index.html (e.g. styles/<slug>/demo, films/<name>); the page must expose window.READY and window.render(t).
// A page error or a 404 on a required file exits immediately (non-zero); giving no time points is a usage error
import fs from 'fs'; import path from 'path';
import { openDemo, closeServer, requireDemo, takeSize, GL_LOST_HELP, glLost } from './page.mjs';
const args = process.argv.slice(2);
const take = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const { w, h } = takeSize(args), out = take('--out'), q = take('--q') || '', prefix = take('--prefix') || 't_', rg = take('--range');
const [dir, ...times] = args;
requireDemo(dir);
if (rg) {
  const [a, b, st] = rg.split(':').map(Number);
  if (![a, b, st].every(Number.isFinite) || !(st > 0) || b < a) { console.error(`bad --range "${rg}": use a:b:step with step > 0 (e.g. 0:50:2.5)`); process.exit(2); }
  for (let x = a; x <= b + 1e-9; x += st) times.push(x.toFixed(2));
}
if (!times.length || times.some(t => !Number.isFinite(parseFloat(t)))) { console.error('usage: node core/render/still.mjs <demo> <t> [<t> ...] [--range a:b:step] [--q k=v] [--prefix t_] [--out dir] [--size WxH]'); process.exit(2); }
const outDir = out || path.join(dir, 'stills'); fs.mkdirSync(outDir, { recursive: true });
const { browser, page } = await openDemo(dir, { w, h, q, warnings: true });   // one page, many stills
for (const ts of times) {
  const t0 = Date.now();
  await page.evaluate(t => window.render(t), parseFloat(ts));
  const f = path.join(outDir, `${prefix}${ts}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log(f, Date.now() - t0 + 'ms');
  const lost = await glLost(page);   // see WATCH_GL_LOST in browser.mjs
  if (lost) { fs.rmSync(f, { force: true }); console.error(`the WebGL context (${lost}) was lost by t = ${ts} s (that still is not kept): ${GL_LOST_HELP}`); process.exit(1); }
}
await browser.close(); closeServer();
