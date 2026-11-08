// Launch arguments for headless Chrome. Finding the browser itself is left to playwright, matched to its version (the chromium-headless-shell installed by npm run);
// to use a different executable: PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell
// GPU: on macOS, Metal explicitly (on newer headless-shell, --use-angle=gl falls back to SwiftShader software rendering, ~6x slower);
//      other systems get no forced backend. LEMO_ANGLE=metal|gl|vulkan|swiftshader… overrides it; LEMO_ANGLE=default means don't pass --use-angle.
export const EXE = process.env.PLAYWRIGHT_CHROME || undefined;   // undefined = let playwright find it
const angle = process.env.LEMO_ANGLE || (process.platform === 'darwin' ? 'metal' : 'default');
export const ARGS = [...(angle === 'default' ? [] : [`--use-angle=${angle}`]), '--enable-gpu', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--force-color-profile=srgb'];

// A lost WebGL context leaves the page alive but no longer drawing: the frames come out blank and the render would still
// exit 0. Two causes: a virtualised GPU (most cloud VMs and CI runners: Chrome creates the context and drops it right away),
// or a page with more WebGL canvases than Chrome keeps (16; it drops the oldest). Caught on the way down (capture phase:
// webglcontextlost does not bubble; a canvas outside the document, like the probe below, never reaches window). Not counted:
// a context the page lets go itself (WEBGL_lose_context.loseContext(), which three.js forceContextLoss() calls) and one that
// comes back (webglcontextrestored). window.__glLost names a canvas still lost; page.mjs checks it before the first frame,
// still.mjs after each still and video.mjs while it renders.
export const GL_LOST_HELP = 'every frame from then on would come out blank. Either the page has more WebGL canvases than Chrome keeps (16, it drops the oldest),\n' +
  '  or the GPU dropped it: on a virtualised GPU (most cloud VMs and CI runners) Chrome starts WebGL on it and then drops it; run with\n' +
  '  LEMO_ANGLE=swiftshader (software rendering, slower; see core/README.md).';
export const WATCH_GL_LOST = `(() => {
  const own = new WeakSet(), wrapped = new WeakSet(), lost = new Set(), name = c => c && c.id ? 'canvas#' + c.id : 'canvas';
  for (const C of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) if (C) {
    const get = C.prototype.getExtension;
    C.prototype.getExtension = function (n) {
      const x = get.apply(this, arguments), cv = this.canvas;
      if (x && /^webgl_lose_context$/i.test(n) && !wrapped.has(x)) {
        wrapped.add(x); const lose = x.loseContext;
        x.loseContext = function () { own.add(cv); return lose.apply(this, arguments); };
      }
      return x;
    };
  }
  addEventListener('webglcontextlost', e => { if (own.has(e.target)) return; lost.add(e.target); window.__glLost = name(e.target); }, true);
  addEventListener('webglcontextrestored', e => { own.delete(e.target); lost.delete(e.target); window.__glLost = lost.size ? name([...lost][0]) : null; }, true);
})();`;
export const glLost = page => page.evaluate(() => window.__glLost || null);

// warn once if WebGL ended up on software rendering (2D-canvas demos are unaffected; never fails the render)
let warned = false;
export async function warnIfSoftwareGL(page) {
  if (warned) return; warned = true;
  try {
    const r = await page.evaluate(() => {
      const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) return null;
      const e = g.getExtension('WEBGL_debug_renderer_info'), name = e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '';
      g.getExtension('WEBGL_lose_context')?.loseContext(); return String(name);
    });
    if (r && /swiftshader|llvmpipe|software/i.test(r)) console.error(`[note] WebGL runs on software rendering (${r.slice(0, 80)}): 3D/CRT demos will be slow. macOS: LEMO_ANGLE=metal; Linux: needs GPU drivers. See core/README.md.`);
  } catch {}
}
