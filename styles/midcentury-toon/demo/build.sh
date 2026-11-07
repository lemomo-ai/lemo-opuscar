#!/bin/sh
# Rebuild "Meet Pip" from scratch: sh styles/midcentury-toon/demo/build.sh (run from anywhere)
# Swap content: edit demo/content.json (or pass another file: CONTENT=content_alt.json sh build.sh stills)
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/midcentury-toon/demo; O=styles/midcentury-toon
if [ "$1" = "stills" ]; then   # content test: three stills from another content file, no audio needed
  node core/render/still.mjs $D 3.5 32.4 41.3 --q "content=${CONTENT:-content_alt.json}" --prefix alt_ --out $D/out/alt; exit 0; fi
python3 $D/tools/lines.py $D/content.json $D/lines.json                       # 1. narration lines from content.json
$PY core/tts/tts.py $D/lines.json $D/voices                                   # 2. Kokoro voice (am_michael)
$PY core/tts/asr_check.py $D/lines.json $D/voices                             # 3. whisper check, every line must be OK
$PY $D/music/score.py                                                         # 4. original cool-jazz score -> music/score.wav + stems + hits.json
node core/render/events.mjs $D                                                # 5. picture events -> events.json (same times drive the foley)
$PY $D/tools/cuecheck.py                                                      # 6. cue check: picture hits vs grid + score
$PY $D/mix.py                                                                 # 7. foley + voice + ducking + silences -> mix.wav
node $D/tools/cues.mjs > $D/out/cues.json && $PY core/render/srt.py $D/out/cues.json $O/midcentury-toon.srt   # 8. subtitles
node core/render/slot.mjs -- node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4   # 9. frames (render slot)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $O/midcentury-toon.mp4 24 4                                     # 10. -14 LUFS, light grain
node core/render/still.mjs $D 6.0 35.8 --q nosubs=1 --prefix ns_ --out $D/out/still
cp $D/out/still/ns_6.0.jpg $D/stills/styleframe.jpg; cp $D/out/still/ns_35.8.jpg $O/poster.jpg
node core/render/still.mjs $D 0 --q test=sheet --prefix sheet_ --out $D/out/still   # model sheet → out/still/sheet_0.jpg
