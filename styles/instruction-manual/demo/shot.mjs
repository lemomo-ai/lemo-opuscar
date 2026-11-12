// node styles/instruction-manual/demo/shot.mjs <out.png> [--q 'f=figs'] [--size WxH]   (run from the library root)
// Renders one style frame as a lossless PNG through the library's page opener.
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { openDemo, closeServer, takeSize } = await import(path.resolve(here, '../../../core/render/page.mjs'));
const args = process.argv.slice(2);
const take = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const { w, h } = takeSize(args), q = take('--q') || 'f=figs';
const out = path.resolve(args[0] || path.join(here, 'out', 'modelsheet.png'));
const { browser, page } = await openDemo(path.relative(process.cwd(), here) || '.', { w, h, q, warnings: true });
await page.evaluate(() => window.render(0));
await page.screenshot({ path: out, type: 'png' }); console.log(out);
await browser.close(); closeServer();
