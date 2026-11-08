#!/bin/sh
# Rebuild "The Colour of Rain" (impasto) from scratch. Run from anywhere.
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
D="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$D/../../.." && pwd)"; cd "$ROOT"
node "$D/tools/dump_timeline.mjs"                         # music grid -> out/timeline.json
.venv/bin/python "$D/music/score.py"                       # score (sampler, CC0 instruments)
.venv/bin/python "$D/mix.py"                               # sound design + mix
node core/render/video.mjs "$D" --fps 24 --workers 3 --out "$D/out/video24.mp4"
sh core/render/mux.sh "$D/out/video24.mp4" "$D/mix.wav" "$D/../impasto.mp4" 24 0   # no grain: keeps knife edges crisp
