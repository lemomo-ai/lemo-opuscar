#!/bin/sh
# Living Screencast · "Clawd Moves In" — rebuild everything from this repo alone.
#   sh styles/living-screencast/demo/build.sh [--vo]     (--vo re-synthesises and re-checks the voice)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../../.." && pwd); cd "$ROOT"
PY=.venv/bin/python; D=styles/living-screencast/demo; OUT=styles/living-screencast
if [ "$1" = "--vo" ]; then
  $PY core/tts/tts.py $D/lines.json $D/voices                        # Kokoro am_michael
  WM=medium.en $PY $D/tools/asr_check.py $D/lines.json $D/voices     # whisper check + word timestamps
fi
node core/render/events.mjs $D                                      # every key, click, jump, pane → events.json
$PY $D/sound.py                                                     # score + foley + VO → mix.wav
node core/render/video.mjs $D --fps 30 --workers 6 --out $D/out/video30.mp4
sh core/render/mux.sh $D/out/video30.mp4 $D/mix.wav $OUT/living-screencast.mp4 30 0
node $D/tools/subs.mjs && $PY core/render/srt.py $D/out/subs.json $OUT/living-screencast.srt
node core/render/still.mjs $D 40.9 --q nosubs=1 --prefix sf_ --out $D/out/stills && mkdir -p $D/stills && cp $D/out/stills/sf_40.9.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 8.9 --q nosubs=1 --prefix po_ --out $D/out/stills && cp $D/out/stills/po_8.9.jpg $OUT/poster.jpg
echo "built $OUT/living-screencast.mp4"
