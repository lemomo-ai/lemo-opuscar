// Copy of core/render/video.mjs: PNG screenshots (JPEG 4:2:0 eats the colour of the pink/blue halftone dots), intermediate in yuv444 crf10
// Use 3 workers (default) when several films are being made in parallel; up to 6 when rendering alone
// Each worker has its own browser, screenshots are piped to ffmpeg as PNG; segments are joined losslessly at the end
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], FPS = +opt('--fps', 24), WK = +opt('--workers', 3), Q = opt('--q', '');
const outDir = path.join(dir, 'out'); fs.mkdirSync(outDir, { recursive: true });
const out = opt('--out', path.join(outDir, 'video.mp4'));
const probe = await openDemo(dir, { q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const F0 = Math.round(+opt('--from', 0) * FPS), TOTAL = Math.round(+opt('--to', DUR) * FPS) - F0, per = Math.ceil(TOTAL / WK), t0 = Date.now();
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = w * per, b = Math.min(TOTAL, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(dir, { q: Q });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-qp', '0', '-pix_fmt', 'yuv444p', path.join(outDir, `seg_${w}.mp4`)]);
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.render(t), (f + F0) / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 60 === 0) console.log(`w${w} ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
}));
const list = path.join(outDir, 'segs.txt');
fs.writeFileSync(list, [...Array(WK)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < TOTAL).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
console.log('done', out, TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
closeServer();
