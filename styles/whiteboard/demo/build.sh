#!/bin/sh
# Whiteboard Explainer · "Einstein in Your Pocket" — rebuild everything from this repo alone.
#   sh styles/whiteboard/demo/build.sh [--vo]     (run from anywhere; --vo re-synthesises and re-checks the voice)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../../.." && pwd); cd "$ROOT"
PY=.venv/bin/python; D=styles/whiteboard/demo; OUT=styles/whiteboard
if [ "$1" = "--vo" ]; then
  $PY core/tts/tts.py $D/lines.json $D/voices                 # Kokoro bm_george, lang en-gb
  WM=medium.en $PY $D/tools/asr_check.py $D/lines.json $D/voices   # whisper check + word timestamps (words.json)
fi
node core/render/events.mjs $D                               # every stroke / wipe / magnet → events.json
$PY $D/tools/cuecheck.py
$PY $D/music.py                                              # score (reads events.json)
$PY $D/mix.py                                                # foley + VO + score → mix.wav
node core/render/video.mjs $D --fps 24 --workers 5 --out $D/out/video24.mp4
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $OUT/whiteboard.mp4 24 2
node $D/tools/subs.mjs && $PY core/render/srt.py $D/out/subs.json $OUT/whiteboard.srt
node core/render/still.mjs $D 53.1 --q nosubs=1 --prefix sf_ --out $D/out/stills && cp $D/out/stills/sf_53.1.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 13.95 --q 'nosubs=1&nopens=1&poster=1' --prefix po_ --out $D/out/stills && cp $D/out/stills/po_13.95.jpg $OUT/poster.jpg
node core/render/still.mjs $D 42.4 85.45 101.9 --q nosubs=1 --prefix frame_ --out $D/stills
echo "built $OUT/whiteboard.mp4"
