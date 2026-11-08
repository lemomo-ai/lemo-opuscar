#!/bin/sh
# Rebuild "Where the Wind Went" from scratch: sound cues → score → foley → mix → frame-by-frame render → mux
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
D=styles/urban-sketch/demo
node core/render/events.mjs $D
node $D/tools/export_cues.mjs
.venv/bin/python $D/audio/score.py
.venv/bin/python $D/audio/foley.py
.venv/bin/python $D/audio/mix.py
node core/render/video.mjs $D --fps 24 --workers 4 --out $D/out/video24.mp4
sh core/render/mux.sh $D/out/video24.mp4 $D/audio/mix.wav styles/urban-sketch/urban-sketch.mp4 24 2
.venv/bin/python core/render/srt.py $D/subs.json styles/urban-sketch/urban-sketch.srt
