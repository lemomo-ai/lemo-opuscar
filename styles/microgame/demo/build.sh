#!/bin/sh
# Rebuild "Five-Second Astronaut" from scratch: sh styles/microgame/demo/build.sh (runs from any directory)
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/microgame/demo; O=styles/microgame
node $D/tools/dump_timeline.mjs                                   # 1. tempo grid → timeline.json (shared by score / mix / self-checks)
$PY core/tts/tts.py $D/lines.json $D/voices                       # 2. Kokoro voices (am_fenrir / af_bella)
$PY $D/tools/trim_cmd.py $D/lines.json $D/voices                  # 3. one-word commands: cut the trailing vowel ("Pump, now!" → "Pump")
$PY core/tts/asr_check.py $D/lines.json.asr.json $D/voices        # 4. whisper check line by line (ah/choo are vocal sound effects, not counted)
$PY $D/music/score.py                                             # 5. original funk score → music/score.wav + stems + score.json
node core/render/events.mjs $D                                    # 6. picture events → events.json
$PY $D/tools/cuecheck.py                                          # 7. self-check: score hit points ↔ picture events alignment
$PY $D/mix.py                                                     # 8. foley + voice + ducking → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/srt.json $O/microgame.srt   # 9. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4        # 10. frame-by-frame render (~25 s)
CRF=20 sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav $O/microgame.mp4 24 0      # 11. mux: −14 LUFS, grain 0
$PY $D/tools/final_asr.py $O/microgame.mp4 || true                                # 12. whisper spot-check on the finished film
node core/render/still.mjs $D 50.2 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_50.2.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 6.4 --q nosub=1 --out $D/out/still --prefix po_ && cp $D/out/still/po_6.4.jpg $O/poster.jpg
node core/render/still.mjs $D 0 --q scene=frames.modelSheet --out $D/out/still --prefix ms_   # model sheet → out/still/ms_0.jpg
node core/render/still.mjs $D 0 --q scene=frames.styleSheet --out $D/out/still --prefix ss_   # style translation sheet → out/still/ss_0.jpg
