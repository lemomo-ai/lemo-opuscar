#!/bin/sh
# Rebuild Blueprint "Patent Pending: The Cloud Catcher" from scratch: run from the repo root  sh styles/blueprint/demo/build.sh
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
D=styles/blueprint/demo; S=styles/blueprint; PY=.venv/bin/python
$PY core/tts/tts.py $D/lines.json $D/voices                 # 1 voice-over (bm_daniel, en-gb)
$PY core/tts/asr_check.py $D/lines.json $D/voices           # 2 Whisper check, line by line
node $D/tools/subs.mjs                                      # 3 subtitle timings (page window.SUBS → subs.json)
node core/render/events.mjs $D                              # 4 sound-effect/narration events
$PY $D/music/score.py                                       # 5 score (sampled harpsichord/bassoon/spiccato strings/harp)
$PY $D/mix.py                                               # 6 foley + narration + score ducking
$PY $D/tools/check_mix.py                                   # 7 narration intelligibility self-check on the final mix
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4   # 8 frame-by-frame render
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/blueprint.mp4 24 4      # 9 mux at −14 LUFS, light grain
$PY core/render/srt.py $D/subs.json $S/blueprint.srt
node core/render/still.mjs $D 31.0 --q nosub --prefix sf_ --out $D/out/sf && cp $D/out/sf/sf_31.0.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 31.0 --q poster=1 --prefix po_ --out $D/out/sf && cp $D/out/sf/po_31.0.jpg $S/poster.jpg
