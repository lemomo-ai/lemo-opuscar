#!/bin/sh
# Rebuild "Twenty-Three" from scratch: sh styles/editorial-explainer/demo/build.sh (runs from any folder)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/editorial-explainer/demo; S=styles/editorial-explainer
$PY core/tts/tts.py $D/lines.json $D/voices                          # 1. Kokoro narration (am_michael, speed 1.0)
$PY core/tts/asr_check.py $D/lines.json $D/voices                    # 2. whisper line-by-line check (mismatches: 0)
node core/render/events.mjs $D                                       # 3. timeline → events.json (foley, score cues, subtitle cues)
$PY $D/music/score.py                                                # 4. original score, synthesised (reads the cues)
$PY $D/mix.py                                                        # 5. foley + narration + ducked score → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $S/editorial-explainer.srt   # 6. subtitles (asserts their durations)
node core/render/readcheck.mjs $D                                    # 7. every text on screen stays long enough to read
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4          # 8. frame-by-frame render
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/editorial-explainer.mp4 24 1   # 9. mux: −14 LUFS, light grain
node core/render/still.mjs $D 28.4 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_28.4.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 45.3 --q 'nosub=1&poster=1' --out $D/out/still --prefix po_ && cp $D/out/still/po_45.3.jpg $S/poster.jpg
