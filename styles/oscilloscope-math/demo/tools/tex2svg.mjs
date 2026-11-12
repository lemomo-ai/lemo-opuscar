// Regenerates tex/formulas.json (committed, so the build needs no TeX and no extra npm package).
// The formula f(t) = 4/pi sum_{k=1}^{N} sin((2k-1) wt)/(2k-1) is typeset by MathJax 3 (npm mathjax-full 3.2.2, Apache-2.0)
// as plain SVG paths: one template per number of digits in the upper limit (digits left as {D0}{D1}{D2}), one for infinity,
// and the ten digit paths. film.py fills a template for any N.
//   npm install --prefix /tmp/mj mathjax-full@3.2.2 && NODE_PATH=/tmp/mj/node_modules node demo/tools/tex2svg.mjs
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');
const DEMO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: 'none' }) });
const F = N => String.raw`f(t)=\frac{4}{\pi}\sum_{k=1}^{${N}}\frac{\sin\big((2k-1)\,\omega t\big)}{2k-1}`;
const svg = tex => adaptor.innerHTML(doc.convert(tex, { display: true }))
  .replace(/currentColor/g, '#ffffff')
  .replace(/(width|height)="([\d.]+)ex"/g, (_, a, v) => `${a}="${(parseFloat(v) * 8.6).toFixed(2)}"`)
  .replace(/style="vertical-align:[^"]*"/, '');
const out = { templates: {}, digits: {} };
for (const n of [1, 2, 3]) {                 // the formula has no 8 anywhere else, so 8s mark the limit's digits
  let i = 0;
  out.templates[n] = svg(F('8'.repeat(n))).replace(/(<path data-c="38" d=")[^"]*"/g, (_, a) => `${a}{D${i++}}"`);
}
out.templates.inf = svg(F(String.raw`\infty`));
for (let d = 0; d <= 9; d++) out.digits[d] = /<path data-c="3\d" d="([^"]*)"/.exec(svg(String(d)))[1];
fs.writeFileSync(path.join(DEMO, 'tex', 'formulas.json'), JSON.stringify(out));
console.log('tex/formulas.json');
