// Poster ../poster.jpg and gallery card stills/styleframe.jpg (same frame, no subtitles): node styles/hardcore-info/demo/tools/poster.mjs [t=17.4] (run from the library root)
import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LIB = process.env.LIB || path.resolve(HERE, '../../..');
const t = +(process.argv[2] ?? 17.4);
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(HERE, { w: 1920, h: 1080, q: 'from=0&to=52&subs=0', warnings: true });
await page.evaluate(t => window.render(t), t);
await page.screenshot({ path: path.join(path.dirname(HERE), 'poster.jpg'), type: 'jpeg', quality: 88 });
await page.screenshot({ path: path.join(HERE, 'stills', 'styleframe.jpg'), type: 'jpeg', quality: 88 });   // gallery card: same frame, no subtitles
await browser.close(); closeServer(); console.log('poster.jpg', t);
