// Open a demo page (the repo root is the static server root; film projects outside the library are mounted under /@film/) and wait for window.READY
// Fail loudly: a JS error in the page, or a failed load of a script (<script>, module import; resourceType script) or of the page itself (document), exits immediately (non-zero).
// Other types (fetch / xhr / images / fonts…) only print a one-line warning on 404: many demos fetch an optional voices/dur.json and use defaults when it's missing
import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { serve, pageURL } from './serve.mjs';
import { createRequire } from 'module';
import { EXE, ARGS, warnIfSoftwareGL, WATCH_GL_LOST, GL_LOST_HELP, glLost } from './browser.mjs';
export { GL_LOST_HELP, glLost };
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let srv = null;
export async function server() { if (!srv) srv = await serve(ROOT); return srv; }
// every entry script calls this before creating any output directory
export function requireDemo(dir) {
  if (!dir || dir.startsWith('--')) { console.error('usage: <demo> is the folder that holds index.html (see core/README.md)'); process.exit(2); }
  if (!fs.existsSync(path.join(dir, 'index.html'))) { console.error(`no index.html in "${dir}": the demo folder is wrong or the page isn't there yet`); process.exit(2); }
}
// --size WxH (default 1920x1080): removes the pair from args and returns { w, h }. Width and height must be even (an H.264 yuv420p requirement), 16–8192
export function takeSize(args) {
  const i = args.indexOf('--size'); if (i < 0) return { w: 1920, h: 1080 };
  const v = args.splice(i, 2)[1] || '', m = /^(\d+)x(\d+)$/.exec(v), w = m && +m[1], h = m && +m[2];
  if (!m || [w, h].some(n => n < 16 || n > 8192 || n % 2)) { console.error(`bad --size "${v}": use WxH with even numbers from 16 to 8192, e.g. 1080x1920`); process.exit(2); }
  return { w, h };
}
const warned = new Set();   // each optional file warns only once per process (video.mjs opens several pages)
const FATAL = new Set(['script', 'document']);   // things the page must have; module imports also have type script
// gl: check for a lost WebGL context before handing the page over (the tools that only read the page, readcheck and events, pass false)
export async function openDemo(dir, { w = 1920, h = 1080, q = '', warnings = false, gl = true } = {}) {
  requireDemo(dir);
  const { port } = await server();
  let browser;
  try { browser = await chromium.launch({ executablePath: EXE, args: ARGS }); }
  catch (e) {   // playwright's own advice (npx playwright install) fetches the browser of another playwright version
    if (!EXE && /Executable doesn't exist|playwright install/i.test(String(e.message))) {
      const v = createRequire(import.meta.url)('playwright-core/package.json').version;
      console.error(`the headless browser for playwright-core ${v} is not installed. From the library root run\n` +
        `  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps\n  (or: node node_modules/playwright-core/cli.js install chromium-headless-shell; not npx playwright install,\n` +
        `  which installs the browser of another playwright version). Or point PLAYWRIGHT_CHROME at a chrome-headless-shell.`);
      process.exit(1);
    }
    throw e;
  }
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.addInitScript(WATCH_GL_LOST);
  const log = [];   // recent errors, printed together if READY is slow to arrive
  const note = s => { log.push(s); if (log.length > 8) log.shift(); console.error(s); };
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && /^Failed to load resource/.test(t)) return;   // printed with its URL by the response event below
    if (m.type() === 'error' || (warnings && m.type() === 'warning') || /too many active webgl contexts/i.test(t)) note('[page] ' + t.slice(0, 300));
  });
  const fontsMissing = [];   // a page that loads its faces itself (document.fonts.load, new FontFace) rejects with a bare "network error"
  page.on('pageerror', e => {   // stop on an error during rendering, so no broken film is produced
    console.error('[pageerror]', e.message);
    if (fontsMissing.length && /network error/i.test(e.message)) console.error(`  that is the missing font file${fontsMissing.length > 1 ? 's' : ''} above (${fontsMissing.join(', ')})`);
    process.exit(1);
  });
  page.on('response', r => {
    if (r.status() < 400) return;
    const u = r.url(), p = new URL(u).pathname, type = r.request().resourceType();
    if (p === '/favicon.ico') return;
    if (FATAL.has(type)) {
      note(`[page] ${r.status()} ${u}`);
      console.error(`the page needs ${p} (a ${type}) but the server answered ${r.status()}. Check the path: pages use absolute URLs like /core/lib.js (see core/README.md)`); process.exit(1);
    }
    if (warned.has(u)) return; warned.add(u);
    if (type === 'font') {   // the text would come out in another face: say which file, and where fonts come from
      fontsMissing.push(p);
      let shown = p; try { shown = decodeURIComponent(p); } catch {}   // a bare % in a file name
      note(`[page] font file missing: ${shown} (${r.status()}). Fonts are not kept in git: a library demo's build.sh fetches them ` +
        `(its CREDITS names each face); in your own page, put the file there or correct the @font-face url`);
    } else note(`[page] optional file missing: ${u} (${r.status()}, requested by ${type === 'fetch' || type === 'xhr' ? 'fetch/xhr' : type}; fine if the page has a fallback)`);
  });
  page.on('requestfailed', r => { if (!/favicon/.test(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') note(`[page] request failed ${r.url()} (${r.failure()?.errorText})`); });
  await page.goto(pageURL(ROOT, port, dir) + (q ? '?' + q : ''));
  const hint = setTimeout(() => {
    console.error(`still waiting for window.READY after 20 s. The page has to set window.READY = true once fonts and images are loaded.\n` +
      (log.length ? '  problems seen so far:\n    ' + log.join('\n    ') + '\n' : '  no console errors so far: is the <script> closed, does it reach the line that sets window.READY?\n') +
      `  debug: node core/render/still.mjs ${dir} 0, or open the page in a normal browser (the tools serve the library root on 127.0.0.1)`);
  }, 20000);
  const t0 = Date.now();
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 180000 }); }
  catch (e) { console.error(`window.READY never became true (waited ${((Date.now() - t0) / 1000).toFixed(0)} s, limit 180 s): ${e.message.split('\n')[0]}`); process.exit(1); }
  finally { clearTimeout(hint); }
  const lost = gl && await glLost(page);   // a blank film is worse than a failed render
  if (lost) {
    console.error(`the WebGL context (${lost}) was lost before the first frame: ${GL_LOST_HELP}`);
    process.exit(1);
  }
  await warnIfSoftwareGL(page);
  return { browser, page };
}
export function closeServer() { if (srv) srv.server.close(); }
