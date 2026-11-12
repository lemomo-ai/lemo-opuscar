// Where each style page's text sits on its film: every line of the label and of the top bar, as rectangles in the film's 1280 x 720
// frame, both languages, into a JSON that `python3 styleboard/media.py --labels` reads. media.py then measures them on the poster
// (WCAG contrast under the scrim) and gives the pages that need it a deeper pool under the label or a darker band under the top bar.
// Needs a preview of a built site (python3 styleboard/serve.py) and playwright-core's Chromium (npx playwright-core install chromium):
//   node styleboard/labelcheck.mjs --base http://127.0.0.1:8000/ --out <media>/label-rects.json
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:8000/'), OUT = arg('--out', '');
if (!OUT) { console.error('labelcheck.mjs: --out <media>/label-rects.json'); process.exit(2); }
const slugs = (await (await fetch(BASE + 'media/search.json')).json()).rows.map(r => r[0]);
const browser = await chromium.launch({ headless: true });
const out = {};
async function one(ctx, slug, zh) {
  const page = await ctx.newPage();
  await page.goto(BASE + (zh ? 'zh/' : '') + `styles/${slug}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const box = document.querySelector('.plate .pl-box').getBoundingClientRect(), k = 1280 / box.width;
    // each line of text as its own box (a Range over the text), coloured as it is set: the name and the film title in paper, the rest at 70 %
    const parts = [['big', '.label h1'], ['small', '.label .meta'], ['small', '.label .alt'], ['paper', '.label .film em, .label .film .fm'], ['small', '.label .about'],
                   ['paper', '.label .acts .btn:not(.primary)'],
                   // the bar along the top of the page, on the film too (kinds starting with t: media.top_contrast)
                   ['tbig', '.top .mark'], ['tsmall', '.top .mark small'], ['tsmall', '.top .search span'], ['tsmall', '.top .lang']];
    const rects = [];
    for (const [kind, sel] of parts) for (const el of document.querySelectorAll(sel)) {
      const bs = el.matches('.btn') ? [el.getBoundingClientRect()] : [...(kind === 'tbig' ? [el.firstChild] : [el]).flatMap(n => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()]; })].filter(b => b.width > 2 && b.height > 2);
      for (const b of bs) rects.push([kind, (b.left - box.left) * k, (b.top - box.top) * k, (b.right - box.left) * k, (b.bottom - box.top) * k].map(x => typeof x === 'number' ? Math.round(x) : x));
    }
    return rects;
  });
  await page.close();
  (out[slug] = out[slug] || []).push(...r);
}
const ctxs = await Promise.all([0, 1, 2, 3].map(() => browser.newContext({ viewport: { width: 1440, height: 855 }, deviceScaleFactor: 1 })));
const jobs = slugs.flatMap(s => [[s, false], [s, true]]);
let i = 0;
await Promise.all(ctxs.map(async ctx => { while (i < jobs.length) { const [s, zh] = jobs[i++]; await one(ctx, s, zh); } }));
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`label rects for ${Object.keys(out).length} styles → ${OUT}`);
await browser.close();
