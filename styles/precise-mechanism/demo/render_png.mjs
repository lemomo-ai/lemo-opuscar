// Render the three style frames (run from the library root):
//   node styles/precise-mechanism/demo/render_png.mjs            -> stills/frame_1.jpg, frame_2.jpg, frame_3.jpg
//   node styles/precise-mechanism/demo/render_png.mjs 3 's=0.2' -> one frame with extra query, written to stills/test_3.jpg
import path from 'path'; import { fileURLToPath } from 'url';
import { openDemo, closeServer } from '../../../core/render/page.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2], extra = process.argv[3] || '';
for (const f of only ? [only] : ['1', '2', '3']) {
  const q = 'f=' + f + (extra ? '&' + extra : '');
  const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q, warnings: true });
  await page.evaluate(() => window.render(0));
  const out = path.join(dir, 'stills', (only ? 'test_' : 'frame_') + f + '.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
  await browser.close(); console.log(out);
}
closeServer();
