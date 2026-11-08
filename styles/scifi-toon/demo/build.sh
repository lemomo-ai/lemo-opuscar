#!/bin/sh
# Rebuild the film from scratch: sh styles/scifi-toon/demo/build.sh   (runs from the repo root or anywhere else)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/scifi-toon/demo
$PY core/tts/tts.py $D/lines.json $D/out/raw          # 1. Kokoro voice-over (raw, 24k)
$PY $D/voice.py                                       # 2. per-character processing + truncation + mouth envelope → voices/
$PY $D/asr.py $D/lines.json $D/voices                 # 3. Whisper check, line by line
node core/render/events.mjs $D                        # 4. timeline → events.json (dialogue/foley/music cues)
$PY $D/music/score.py                                 # 5. synthesize the original score → music/score.wav
$PY $D/mix.py                                         # 6. foley + dialogue + ducked score + ambience → mix.wav
node $D/srt.mjs                                       # 7. subtitles → scifi-toon.srt
node core/render/video.mjs $D --fps 24 --workers 4 --out $D/out/video24.mp4   # 8. frame-by-frame render (~15 s)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav styles/scifi-toon/scifi-toon.mp4 24   # 9. mux + −14 LUFS
