// Render video: node core/render/video.mjs <demo> [--fps 24] [--workers 3] [--q 'k=v'] [--out <demo>/out/video.mp4] [--size 1920x1080]
// when several films are in production in parallel, use 3 workers (the default); a render on its own can go up to 6
// each worker has its own browser; JPEG screenshots are piped to ffmpeg; the segments are joined losslessly at the end
// with the environment variable RENDER_SLOTS (an integer) set, the machine runs at most that many full-film renders at once (slot.mjs); unset means no limit. Segment files go in a hidden directory next to --out, unique to each render, deleted when the render finishes (or fails, or is interrupted).
// The same demo can render several versions in parallel, but each version needs its own --out: two renders writing the same --out fail with an error instead of silently overwriting each other.
// <out>.lock holds the owner's pid; if the owner is gone, or the lock file hasn't been refreshed for over 12 hours (the pid was reused by another process), it counts as stale and a new render takes over.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { openDemo, closeServer, requireDemo, takeSize } from './page.mjs';
const args = process.argv.slice(2), { w: W, h: H } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0]; requireDemo(dir);
const FPS = +opt('--fps', 24), WK = +opt('--workers', 3), Q = opt('--q', '');
if (!(FPS > 0) || !Number.isInteger(WK) || WK < 1) { console.error('bad --fps / --workers: fps must be > 0, workers an integer ≥ 1'); process.exit(2); }
const out = path.resolve(opt('--out', path.join(dir, 'out', 'video.mp4')));
const outDir = path.dirname(out), base = path.basename(out, path.extname(out));
fs.mkdirSync(outDir, { recursive: true });

// —— only one render may write a given --out: <out>.lock holds the pid ——
const alive = pid => {
  if (!Number.isInteger(pid) || pid <= 0) return false;   // an empty pid file reads as 0, and kill(0) would hit the whole process group (same guard as slot.mjs)
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};
const lock = out + '.lock', LOCK_MAX_AGE = 12 * 3600 * 1000;
try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); } catch {
  const other = Number(fs.readFileSync(lock, 'utf8')), age = Date.now() - fs.statSync(lock).mtimeMs;
  if (Number.isInteger(other) && other > 0 && alive(other) && age < LOCK_MAX_AGE) {
    console.error(`another render (pid ${other}) is already writing ${out}. Give this one its own --out.\n` +
      `If no render is running (a crashed one can leave its lock behind), delete ${lock} and run this again.`); process.exit(2);
  }
  fs.writeFileSync(lock, String(process.pid));   // the previous render crashed (or its pid is now used by another process, or the lock is too old): take over
}
setInterval(() => { try { const n = new Date(); fs.utimesSync(lock, n, n); } catch {} }, 10 * 60 * 1000).unref();   // long renders refresh it periodically so they aren't taken for stale
// clear out segment directories left by crashes (whose pid is gone)
for (const n of fs.readdirSync(outDir)) if (n.startsWith(`.${base}_segs-`)) {
  try { const p = Number(fs.readFileSync(path.join(outDir, n, 'pid'), 'utf8')); if (!alive(p)) fs.rmSync(path.join(outDir, n), { recursive: true, force: true }); } catch {}
}
let segDir = null, cleaned = false; const procs = new Set();   // running ffmpeg processes: stop them before cleaning the directory, so they don't error on a deleted directory
const cleanup = () => { if (cleaned) return; cleaned = true; for (const p of procs) p.kill('SIGKILL'); if (segDir) fs.rmSync(segDir, { recursive: true, force: true }); try { fs.unlinkSync(lock); } catch {} };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(128 + (sig === 'SIGINT' ? 2 : 15)); });
const fail = msg => { console.error(msg); cleanup(); process.exit(1); };

const release = process.env.RENDER_SLOTS ? await (await import('./slot.mjs')).acquire() : () => {};   // with RENDER_SLOT_HELD=1 (an outer process already holds a slot), pass straight through
segDir = fs.mkdtempSync(path.join(outDir, `.${base}_segs-`)); fs.writeFileSync(path.join(segDir, 'pid'), String(process.pid));
const probe = await openDemo(dir, { w: W, h: H, q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
if (!(DUR > 0)) fail(`window.DUR must be a positive number of seconds (got ${DUR})`);
const TOTAL = Math.round(DUR * FPS), per = Math.ceil(TOTAL / WK), t0 = Date.now();
try { await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = w * per, b = Math.min(TOTAL, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(dir, { w: W, h: H, q: Q });
  // cwd set to the segment directory with relative filenames: that way ffmpeg won't read characters such as # ? in the path as protocol syntax
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', `seg_${w}.mp4`], { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
  procs.add(ff); ff.on('close', () => procs.delete(ff));
  let dead = null;   // ffmpeg exited early (missing encoder, disk full…): its own error is already on stderr; here we just note it and stop feeding frames
  let done; const closed = new Promise(r => { done = r; }); ff.on('close', code => done(code));
  ff.on('error', e => { dead = e.code === 'ENOENT' ? 'ffmpeg is not installed (or not on PATH)' : e.message; done(-1); });
  ff.stdin.on('error', () => { dead ??= 'ffmpeg closed its input early'; });
  for (let f = a; f < b && !dead; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (dead) break;
    if (!ff.stdin.write(buf)) await Promise.race([new Promise(r => ff.stdin.once('drain', r)), closed]);
    if ((f - a) % 60 === 0) console.log(`w${w} ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); const code = await closed; await browser.close();
  if (dead || code !== 0) fail(`ffmpeg failed for worker ${w}: ${dead || 'exit code ' + code} (ffmpeg's own message, if any, is above)`);
})); } catch (e) { fail(`render stopped: ${String(e.message || e).split('\n')[0]}`); }   // e.g. the page's render(t) threw
const list = path.join(segDir, 'segs.txt');
fs.writeFileSync(list, [...Array(WK)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < TOTAL).join('\n'));
try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs.txt', '-c', 'copy', 'merged.mp4'], { cwd: segDir, stdio: ['ignore', 'inherit', 'inherit'] }); }
catch { fail('ffmpeg could not join the segments (its message is above)'); }
fs.renameSync(path.join(segDir, 'merged.mp4'), out);   // any characters in the final filename are fine: it doesn't go through ffmpeg
cleanup(); release();
console.log('done', out, TOTAL, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
closeServer();
