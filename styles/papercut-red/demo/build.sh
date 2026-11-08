#!/bin/sh
# Rebuild the finished film from scratch: sh styles/papercut-red/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/papercut-red/demo; O=styles/papercut-red
$PY core/tts/tts.py $D/lines.json $D/voices                     # 1. Kokoro voice-over (af_sarah 0.9)
$PY core/tts/asr_check.py $D/lines.json $D/voices               # 2. whisper line-by-line check (the asr field registers Nian→Nyan/Nion as homophones)
node core/render/events.mjs $D                                  # 3. timeline → events.json (narration / foley hit points)
$PY $D/music/score.py                                           # 4. original score (pipa pluck + zheng + erhu + flute + woodblock + gong + frame drum) → music/score.wav
$PY $D/mix.py                                                   # 5. paper / scissors / candle / firecracker foley + narration + music ducking → mix.wav
$PY $D/subs.py                                                  # 6. subtitle cues → papercut-red.srt
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4   # 7. frame-by-frame render (1176 frames, about 30 s)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $O/papercut-red.mp4 24 0   # 8. mux: two-pass loudnorm −14 LUFS, no grain added (the paper fibre is already in the image)
$PY $D/check_final.py                                           # 9. final check: per-line whisper + blackdetect
still() { for i in 1 2 3; do node core/render/still.mjs "$@" && return 0; echo "retry $i"; done; return 1; }
still $D 32.7 --q 'nosub=1&poster=1' --prefix P_ --out $D/out/t && cp $D/out/t/P_32.7.jpg $O/poster.jpg
still $D 32.7 --q 'nosub=1' --prefix S_ --out $D/out/t && cp $D/out/t/S_32.7.jpg $D/stills/styleframe.jpg
