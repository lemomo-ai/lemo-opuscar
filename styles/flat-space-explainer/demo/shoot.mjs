// Save the frames as lossless PNGs, run from the library root:
//   node styles/flat-space-explainer/demo/shoot.mjs                 options-1.png (the guide's character sheet) + frame-1/2/3.png
//   node styles/flat-space-explainer/demo/shoot.mjs --only 2        just one page
import path from 'path'; import { fileURLToPath } from 'url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const rel = path.relative(process.cwd(), dir) || '.';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const out = arg('out') || dir, only = arg('only');
const pages = only ? [only] : ['options', '1', '2', '3'];
for (const f of pages) {
  const t0 = Date.now(), name = f === 'options' ? 'options-1.png' : `frame-${f}.png`;
  const { browser, page } = await openDemo(rel, { w: 1920, h: 1080, q: `f=${f}`, warnings: true });
  await page.evaluate(() => window.render(0));
  await page.screenshot({ path: path.join(out, name), type: 'png' });
  console.log(name, Date.now() - t0 + 'ms');
  await browser.close();
}
closeServer();
