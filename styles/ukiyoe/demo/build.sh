#!/bin/sh
# Rebuild the finished film from scratch: sh styles/ukiyoe/demo/build.sh   (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/ukiyoe/demo
$PY core/tts/tts.py $D/lines.json $D/voices                 # 1. Kokoro narration (am_adam)
$PY core/tts/asr_check.py $D/lines.json $D/voices           # 2. whisper line-by-line check
node core/render/events.mjs $D                              # 3. timeline → events.json (narration / foley / ambience)
$PY $D/music/score.py                                       # 4. original score (shamisen / shakuhachi / taiko / hyoshigi wooden clappers) → music/score.wav
$PY $D/mix.py                                               # 5. foley + narration + score ducking + full silence for the ma (間, pause) → mix.wav
$PY $D/subs.py && $PY core/render/srt.py $D/out/subs.json styles/ukiyoe/ukiyoe.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4          # 7. frame-by-frame render (1056 frames)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav styles/ukiyoe/ukiyoe.mp4 24 0    # 8. mux at −14 LUFS, grain 0 (the paper texture is already in the picture)
$PY $D/check_asr.py styles/ukiyoe/ukiyoe.mp4                # 9. whisper self-check on the finished film
