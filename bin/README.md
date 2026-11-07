# bin/opuscar

Wrapper for running this repo on a GPU-less Linux box (cloud VM / CI runner).

It sets two things that `node core/render/*.mjs` needs there and cannot infer:

- `LEMO_ANGLE=swiftshader` — without a pinned ANGLE backend, WebGL styles
  initialise and then draw nothing (blank film, exit 0). See PR #35.
- `PLAYWRIGHT_CHROME` — `playwright-core@1.63` asks for the browser build it
  was pinned to; a box with an older `~/.cache/ms-playwright` fails at
  `launch()` with "Executable doesn't exist". The wrapper picks the newest
  local build, preferring `chrome-headless-shell`.

Any variable already set in the shell wins, so `LEMO_ANGLE=metal opuscar ...`
still works on macOS.

Usage:

    opuscar core/render/video.mjs styles/ascii-crt/demo --fps 24 --workers 3 --out /tmp/x.mp4
    opuscar core/render/still.mjs styles/ascii-crt/demo 39.4 --q 'nosub=1' --out /tmp/s

Verified on this VPS (4 vCPU, no GPU): still at t=39.4 scores SSIM 0.988 (Y)
against the committed `styles/ascii-crt/demo/stills/styleframe.jpg`.
