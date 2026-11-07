// Launch arguments for headless Chrome, and the executable to launch.
// PLAYWRIGHT_CHROME=/path/to/chrome-headless-shell always wins.
// Otherwise playwright-core looks for the one build its version was pinned to. On a
// machine whose ~/.cache/ms-playwright holds a different revision -- a CI image, a VM
// provisioned before an npm bump -- every renderer dies at launch() with
// "Executable doesnt exist at ..." before a single frame is drawn: exit 1, no file,
// for 2D-canvas styles as much as for WebGL ones. So when the pinned build is missing
// we fall back to the newest local one (chrome-headless-shell preferred) and say so on
// stderr; if there is none, playwright raises its own error as before.
// GPU: on macOS, Metal explicitly (on newer headless-shell, --use-angle=gl falls back to SwiftShader software rendering, ~6x slower);
//      other systems get no forced backend. LEMO_ANGLE=metal|gl|vulkan|swiftshader... overrides it; LEMO_ANGLE=default means dont pass --use-angle.
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const CACHE = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), ".cache", "ms-playwright");
const LAYOUTS = [
  ["chromium_headless_shell-", ["chrome-headless-shell-linux64", "chrome-headless-shell"]],
  ["chromium_headless_shell-", ["chrome-headless-shell-mac-arm64", "chrome-headless-shell"]],
  ["chromium_headless_shell-", ["chrome-headless-shell-mac-x64", "chrome-headless-shell"]],
  ["chromium-", ["chrome-linux64", "chrome"]],
  ["chromium-", ["chrome-linux", "chrome"]],
  ["chromium-", ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"]],
];

// newest revision wins; a headless shell outranks a full chromium of any revision
function newestLocalChrome() {
  let best, names;
  try { names = readdirSync(CACHE); } catch { return undefined; }
  for (const name of names) for (const [prefix, tail] of LAYOUTS) {
    if (!name.startsWith(prefix)) continue;
    const rev = Number(name.slice(prefix.length));
    if (!Number.isFinite(rev)) continue;
    const exe = join(CACHE, name, ...tail);
    if (!existsSync(exe)) continue;
    const rank = rev + (prefix.indexOf("headless_shell") >= 0 ? 1e6 : 0);
    if (!best || rank > best.rank) best = { rank, exe };
  }
  return best && best.exe;
}

function resolveExe() {
  if (process.env.PLAYWRIGHT_CHROME) return process.env.PLAYWRIGHT_CHROME;
  let pinned;
  try { pinned = chromium.executablePath(); } catch {}
  if (pinned && existsSync(pinned)) return undefined;   // healthy install: let playwright find it
  const local = newestLocalChrome();
  if (!local) return undefined;                         // nothing local either: let playwright report it
  console.error(`[note] playwright wants ${pinned || "its pinned build"}, which is not installed; using ${local}. Run: npx playwright install chromium-headless-shell`);
  return local;
}

export const EXE = resolveExe();
const angle = process.env.LEMO_ANGLE || (process.platform === 'darwin' ? 'metal' : 'default');
export const ARGS = [...(angle === 'default' ? [] : [`--use-angle=${angle}`]), '--enable-gpu', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--force-color-profile=srgb'];

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
