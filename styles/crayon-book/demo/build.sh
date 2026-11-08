#!/bin/sh
# Rebuild the film from scratch: sh styles/crayon-book/demo/build.sh   (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/crayon-book/demo
$PY core/tts/tts.py $D/lines.json $D/voices                 # 1. Kokoro voice af_heart (soft bedtime voice)
$PY core/tts/asr_check.py $D/lines.json $D/voices           # 2. whisper line-by-line check
node core/render/events.mjs $D                              # 3. timeline → events.json (narration / foley / music cues / stars appearing)
$PY $D/music/score.py                                       # 4. original score (music box / toy piano / flute / clarinet / glockenspiel) → music/score.wav
$PY $D/mix.py                                               # 5. foley + narration + music ducking + room tone → mix.wav
node $D/subs.mjs && $PY core/render/srt.py $D/subs.json styles/crayon-book/crayon-book.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4                # 7. frame-by-frame render
CRF=26 sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav styles/crayon-book/crayon-book.mp4 24 0   # 8. mux + −14 LUFS (the paper texture is already grain, so no extra grain; CRF 26)
