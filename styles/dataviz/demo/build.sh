#!/bin/sh
# Rebuild "A Hundred Summers" from scratch: sh styles/dataviz/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/dataviz/demo; S=styles/dataviz
$PY $D/tools/extract_data.py                                          # 0. GISTEMP CSV → data/jja.json (JJA column) + facts used in the narration
$PY core/tts/tts.py $D/lines.json $D/voices                           # 1. Kokoro voice-over (af_alloy, speed 0.92)
$PY core/tts/asr_check.py $D/lines.json $D/voices                     # 2. whisper check, line by line (should report mismatches: 0)
$PY $D/tools/words.py                                                 # 3. per-word timings → chart-caption subtitles appear word by word
node core/render/events.mjs $D                                        # 4. picture timeline → events.json (data points / foley / morph events)
$PY $D/music/score.py                                                 # 5. original score: data sonification + modular synth (reads events.json)
$PY $D/tools/cuecheck.py | tail -1                                    # 6. check score ↔ picture hit points
$PY $D/mix.py                                                         # 7. ambience bed + foley + ducking under narration + score → mix.wav
$PY $D/tools/subs.py > /dev/null && $PY core/render/srt.py $D/out/subs.json $S/dataviz.srt   # 8. subtitles (asserts hold times)
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4         # 9. frame-by-frame render (1200 frames, about 30 s)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/dataviz.mp4 24 0              # 10. mux: −14 LUFS, grain 0
node core/render/still.mjs $D 37.62 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_37.62.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 37.1 --q nosub=1 --out $D/out/still --prefix po_ && cp $D/out/still/po_37.1.jpg $S/poster.jpg
