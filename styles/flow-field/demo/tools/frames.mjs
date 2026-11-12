// Exact-time frames for the flicker test: node styles/flow-field/demo/tools/frames.mjs <t0> <n> <outdir> [WxH]   (frames at t0 + k/30)
import fs from 'fs'; import path from 'path';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const [t0, n, out, size = '960x540'] = process.argv.slice(2); const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const dir = 'styles/flow-field/demo';   // run from the library root
const { browser, page } = await openDemo(dir, { w, h });
for (let k = 0; k < +n; k++) { const t = +t0 + k / 30; await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(out, `f_${String(k).padStart(3, '0')}.png`) }); }
await browser.close(); closeServer();
