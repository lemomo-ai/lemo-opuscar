// Median of the raw readings the overlay measures over time windows (to set the registered values in hud.js STATE).
// node styles/thermal-camera/demo/tools/measure.mjs styles/thermal-camera/demo
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const dir = process.argv[2];
const W = { cat: [26, 27.9], eye: [26.8, 28.8] };
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: '' });
const acc = {};
for (let t = 5.6; t < 43.3; t += .2) {
  const m = await page.evaluate((t) => { window.render(t); return { ...window.__M }; }, t);
  for (const k in W) if (t >= W[k][0] && t <= W[k][1] && m[k] !== undefined) (acc[k] ??= []).push(m[k]);
}
for (const k in acc) { const a = acc[k].sort((x, y) => x - y); console.log(k.padEnd(6), 'median', a[a.length >> 1].toFixed(2), 'min', a[0].toFixed(2), 'max', a[a.length - 1].toFixed(2)); }
await browser.close(); closeServer();
