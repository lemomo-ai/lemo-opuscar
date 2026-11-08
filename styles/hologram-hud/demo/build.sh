#!/bin/sh
# Rebuild "Volt · Spec Scan" from scratch: sh styles/hologram-hud/demo/build.sh (runs from any directory)
# Swap the content (one command): CONTENT=content_alt.json NAME=kite sh styles/hologram-hud/demo/build.sh
#   → voice, score, mix, subtitles and final film are all redone; output goes to demo/out/kite/ (kite.mp4 / kite.srt / poster.jpg)
#   Model: the JSON that content.json's "model" points to; for your own product, first write models/gen_<name>.mjs to generate it (format in STYLE.md §11)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/hologram-hud/demo; O=styles/hologram-hud
CONTENT=${CONTENT:-content.json}; NAME=${NAME:-hologram-hud}
if [ "$CONTENT" = "content.json" ]; then W=$D; OUT=$O; else W=$D/out/$NAME; OUT=$W; fi
mkdir -p $W/out
export HH_WORK=$W
VREL=$(node -e "console.log(require('path').relative('$D','$W/voices')||'voices')")
RS=""   # machine-wide render throttling already lives in core/render/video.mjs
node $D/models/gen_volt.mjs > $D/models/volt.json                 # 1. wireframe model (vertices / edges / faces → JSON)
node $D/models/gen_kite.mjs > $D/models/kite.json                 #    drone used to test content swapping
node $D/tools/make_lines.mjs $CONTENT $W/lines.json               # 2. content → lines.json
$PY core/tts/tts.py $W/lines.json $W/voices                       # 3. Kokoro voice-over (af_heart)
$PY core/tts/asr_check.py $W/lines.json $W/voices                 # 4. whisper line-by-line check
node $D/tools/export.mjs $CONTENT $W                              # 5. picture events → events.json, timing grid → timeline.json, subtitles → out/srt.json
$PY $D/music/score.py                                             # 6. original score (120 BPM, numpy synthesis) → music/score.wav + score.json
$PY $D/tools/cuecheck.py                                          # 7. self-check of score ↔ picture hit points
$PY $D/mix.py                                                     # 8. UI sounds + mechanical foley + ambience bed + voice + ducking → mix.wav
$PY core/render/srt.py $W/out/srt.json $OUT/$NAME.srt             # 9. subtitles
Q="content=$CONTENT&voices=$VREL"
$RS node core/render/video.mjs $D --fps 24 --workers 2 --q "$Q" --out $W/out/video24.mp4   # 10. frame-by-frame render (whip-pan segments use 5-subframe motion blur)
sh core/render/mux.sh $W/out/video24.mp4 $W/mix.wav $OUT/$NAME.mp4 24 0          # 11. mux: −14 LUFS, no grain
$PY $D/tools/final_asr.py $OUT/$NAME.mp4 || true                  # 12. whisper spot check of the final film + SNR in the voice band
if [ "$CONTENT" = "content.json" ]; then
  node core/render/still.mjs $D 25.5 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_25.5.jpg $D/stills/styleframe.jpg
  node core/render/still.mjs $D 33 --q nosub=1 --out $D/out/still --prefix po_ && cp $D/out/still/po_33.jpg $O/poster.jpg
  # stills of the swapped content (proves content_alt.json works; its sound is not rebuilt)
  node core/render/still.mjs $D 5 12 37 --q content=content_alt.json --out $D/out/alt --prefix alt_
  cp $D/out/alt/alt_5.jpg $D/stills/alt_title.jpg; cp $D/out/alt/alt_12.jpg $D/stills/alt_signature.jpg; cp $D/out/alt/alt_37.jpg $D/stills/alt_lockup.jpg
else
  T=$(node -e "const t=require('./$W/timeline.json');console.log(t.lock[1]-1)")
  node core/render/still.mjs $D $T --q "$Q&nosub=1" --out $W/out --prefix po_ && cp $W/out/po_$T.jpg $OUT/poster.jpg
fi
