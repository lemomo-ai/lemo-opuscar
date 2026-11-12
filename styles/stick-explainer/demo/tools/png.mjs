// PNG stills of this demo: node styles/stick-explainer/demo/tools/png.mjs <scene> <t> <out.png>   (run from the library root)
// scene: full (the film, t in film seconds) | f1 | f2 | f3 (the three style frames)
import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LIB = process.env.LIB || path.resolve(HERE, '../../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const [scene, t, out] = process.argv.slice(2);
const { browser, page } = await openDemo(HERE, { q: 'scene=' + scene, warnings: true });
await page.evaluate(t => window.render(t), parseFloat(t));
await page.screenshot({ path: out, type: 'png' }); console.log(out);
await browser.close(); closeServer();
