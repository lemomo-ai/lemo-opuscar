#!/bin/sh
# Rebuild "The Velvet Cipher" from scratch: sh styles/spy-titles/demo/build.sh (runs from any directory)
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/spy-titles/demo; O=styles/spy-titles
$PY core/tts/tts.py $D/lines.json $D/voices                     # 1. Kokoro voice-over (bm_george)
$PY core/tts/asr_check.py $D/lines.json $D/voices               # 2. whisper line-by-line check (mismatches: 0)
$PY $D/music/score.py                                           # 3. original 60s spy big-band score → music/score.wav + stems
node core/render/events.mjs $D                                  # 4. timeline → events.json
$PY $D/mix.py                                                   # 5. foley + tape narration + ducking → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $O/spy-titles.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4        # 7. frame-by-frame render (~20 s)
CRF=24 sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav $O/spy-titles.mp4 24 6   # 8. mux: −14 LUFS, grain 6, crf24 (core mux.sh + CRF parameter)
node core/render/still.mjs $D 20.8 --q 'nosub=1' --out $D/out/still --prefix sf_ && cp $D/out/still/sf_20.8.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 20.8 --q 'nosub=1&poster=1' --out $D/out/still --prefix po_ && cp $D/out/still/po_20.8.jpg $O/poster.jpg
node core/render/still.mjs $D 0 --q 'sheet=1' --out $D/out/still --prefix ms_   # model sheet → out/still/ms_0.jpg
