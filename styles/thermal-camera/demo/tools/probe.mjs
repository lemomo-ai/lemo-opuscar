// tracker positions frame by frame (to check they glide, not jump):
// node styles/thermal-camera/demo/tools/probe.mjs styles/thermal-camera/demo <from s> <to s>
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const [dir, a, b] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: '' });
let prev = null, maxStep = 0, maxAcc = 0, pd = null;
for (let f = Math.round(+a * 30); f <= Math.round(+b * 30); f++) {
  const t = f / 30;
  const p = await page.evaluate((t) => { window.__M.eyeAt = window.__M.leakAt = undefined; window.render(t); return window.__M.eyeAt || window.__M.leakAt; }, t);
  if (!p) { prev = pd = null; continue; }
  let line = `${t.toFixed(3)}  ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  if (prev) { const d = [p[0] - prev[0], p[1] - prev[1]], s = Math.hypot(...d); maxStep = Math.max(maxStep, s); line += `  step ${s.toFixed(2)}`;
    if (pd) { const acc = Math.hypot(d[0] - pd[0], d[1] - pd[1]); maxAcc = Math.max(maxAcc, acc); line += `  dstep ${acc.toFixed(2)}`; } pd = d; }
  prev = p; console.log(line);
}
console.log(`max step ${maxStep.toFixed(2)} px/frame, max change of step ${maxAcc.toFixed(2)} px/frame²`);
await browser.close(); closeServer();
