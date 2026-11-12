// Lossless render for a 1-bit film: PNG screenshots → FFV1 (lossless) segments → one lossless master.
// The only lossy step is the final H.264 encode (demo/build.sh), so the dot patterns go through one generation, not three
// (core/render/video.mjs pipes JPEG q95 into x264, and mux.sh encodes again).
// Run from the library root: node styles/one-bit-dither/demo/tools/render.mjs styles/one-bit-dither/demo [--fps 30] [--workers 4] [--from s] [--to s] [--out file.mkv]
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo, closeServer } from '../../../../core/render/page.mjs';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], FPS = +opt('--fps', 30), WK = +opt('--workers', 4);
const out = path.resolve(opt('--out', path.join(dir, 'out', 'master.mkv')));
fs.mkdirSync(path.dirname(out), { recursive: true });
const probe = await openDemo(dir, { w: 1920, h: 1080, q: '' }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const F0 = Math.round(+opt('--from', 0) * FPS), F1 = Math.round(+opt('--to', DUR) * FPS);
const segDir = fs.mkdtempSync(path.join(path.dirname(out), '.segs-'));
const per = Math.ceil((F1 - F0) / WK), t0 = Date.now(); const procs = new Set();
const cleanup = () => { for (const p of procs) p.kill('SIGKILL'); fs.rmSync(segDir, { recursive: true, force: true }); };
process.on('SIGINT', () => { cleanup(); process.exit(130); });
try {
  await Promise.all([...Array(WK)].map(async (_, w) => {
    const a = F0 + w * per, b = Math.min(F1, a + per); if (a >= b) return;
    const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: '' });
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'rgb24', `seg_${w}.mkv`], { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
    procs.add(ff); const closed = new Promise(r => ff.on('close', r));
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - a) % 90 === 0) console.log(`w${w} ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); const code = await closed; procs.delete(ff); await browser.close();
    if (code !== 0) throw new Error('ffmpeg failed for worker ' + w);
  }));
  fs.writeFileSync(path.join(segDir, 'segs.txt'), [...Array(WK)].map((_, w) => `file 'seg_${w}.mkv'`).filter((_, w) => F0 + w * per < F1).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs.txt', '-c', 'copy', 'merged.mkv'], { cwd: segDir, stdio: 'inherit' });
  fs.renameSync(path.join(segDir, 'merged.mkv'), out);
} catch (e) { console.error(String(e.message || e)); cleanup(); closeServer(); process.exit(1); }
cleanup(); closeServer();
console.log('done', out, F1 - F0, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
