#!/bin/sh
# Rebuild "Sunday Ride" from scratch: sh styles/risograph/demo/build.sh (runs from any directory)
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/risograph/demo
$PY core/tts/tts.py $D/lines.json $D/voices                     # 1. Kokoro voice-over (am_adam)
$PY core/tts/asr_check.py $D/lines.json $D/voices               # 2. whisper line-by-line check (should report mismatches: 0)
$PY $D/music/score.py                                           # 3. original bossa nova score → music/score.wav + stems (~25s)
node core/render/events.mjs $D                                  # 4. timeline → events.json (foley / ambience / narration events)
$PY $D/mix.py                                                   # 5. foley + narration ducking + score → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json styles/risograph/risograph.srt   # 6. subtitles
node $D/tools/video_png.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4   # 7. frame-by-frame render (PNG screenshots → lossless intermediate, ~2–4 minutes)
sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav styles/risograph/risograph.mp4 24 0   # 8. mux: crf16 -tune grain, −14 LUFS
node core/render/still.mjs $D 28.8 --q 'nosub=1' --out $D/out/still --prefix sf_ && cp $D/out/still/sf_28.8.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 28.8 --q 'nosub=1&poster=1' --out $D/out/still --prefix po_ && cp $D/out/still/po_28.8.jpg styles/risograph/poster.jpg
node core/render/still.mjs $D 0 --q 'sheet=1' --out $D/out/still --prefix ms_   # model sheet → out/still/ms_0.jpg
