#!/bin/sh
# Rebuild the film from scratch: sh styles/stained-glass/demo/build.sh (from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/stained-glass/demo; O=styles/stained-glass
$PY core/tts/tts.py $D/lines.json $D/voices                    # 1. Kokoro narration (bf_alice)
$PY core/tts/asr_check.py $D/lines.json $D/voices              # 2. whisper check (asr field: knight/night homophone)
node core/render/events.mjs $D                                 # 3. timeline -> events.json (voice, foley, subtitle cues)
$PY $D/music/score.py                                          # 4. original score (D Dorian; recorder, organ, harp, chimes, bells, timpani, glass)
$PY $D/mix.py                                                  # 5. foley + narration + ducked score -> mix.wav
$PY $D/subs_export.py                                          # 6. subtitles -> stained-glass.srt
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4   # 7. frames (~3 min with 3 workers)
CRF=22 sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav $O/stained-glass.mp4 24 4   # 8. mux: two-pass loudnorm -14 LUFS, grain 4
still() { for i in 1 2 3; do node core/render/still.mjs "$@" && return 0; echo "retry $i"; done; return 1; }
still $D 8.2 --prefix poster_ --out $D/out/st && cp $D/out/st/poster_8.2.jpg $O/poster.jpg            # 9. poster (title reveal)
still $D 40.6 --q 'nosub=1' --prefix sf_ --out $D/out/st && cp $D/out/st/sf_40.6.jpg $D/stills/styleframe.jpg
