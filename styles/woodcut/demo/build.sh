#!/bin/sh
# Rebuild 《The Bell Founder》 from scratch: sh styles/woodcut/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/woodcut/demo; O=styles/woodcut
$PY core/tts/tts.py $D/lines.json $D/voices                       # 1. Kokoro voice-over (am_onyx 0.88, 4 lines)
$PY core/tts/asr_check.py $D/lines.json $D/voices                 # 2. whisper line-by-line check → words.json
$PY $D/music/score.py                                             # 3. original score (reads timeline.json) → music/score.wav + stems + score.json
node core/render/events.mjs $D                                    # 4. picture events → events.json
$PY $D/tools/cuecheck.py                                          # 5. self-check: score hit points ↔ picture events ↔ timeline alignment (including the two silences)
$PY $D/mix.py                                                     # 6. per-material synthesised foley + ambience + narration + score ducking + two silences + bell → mix.wav
$PY $D/tools/subs.py                                              # 7. subtitles → woodcut.srt
node core/render/video.mjs $D --fps 24 --workers 4 --out $D/out/video24.mp4        # 8. frame-by-frame render (about 45 s with 4 workers)
sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav $O/woodcut.mp4 24 6              # 9. mux: −14 LUFS, grain 6, CRF 28
$PY $D/tools/final_asr.py $O/woodcut.mp4 || true                                  # 10. whisper spot-check of the finished film
node core/render/still.mjs $D 40.3 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_40.3.jpg $D/stills/styleframe.jpg   # 11. style frame
node core/render/still.mjs $D 10.0 --out $D/out/still --prefix po_ && cp $D/out/still/po_10.0.jpg $O/poster.jpg              # 12. poster (the first print, with the title)
node core/render/still.mjs $D 1.3 --q test=spark --out $D/out/still --prefix ex_ && cp $D/out/still/ex_1.3.jpg $D/stills/engine_example.jpg   # 13. STYLE.md §10 minimal engine example
