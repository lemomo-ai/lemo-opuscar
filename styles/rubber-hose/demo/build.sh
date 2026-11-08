#!/bin/sh
# Rebuild the finished film from scratch: sh styles/rubber-hose/demo/build.sh   (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/rubber-hose/demo; S=styles/rubber-hose
$PY core/tts/tts.py $D/lines.json $D/voices                     # 1. Kokoro voice-over (bm_lewis, radio-announcer delivery)
$PY core/tts/asr_check.py $D/lines.json $D/voices               # 2. whisper line-by-line check
node core/render/events.mjs $D                                  # 3. timeline → events.json (narration / foley events)
$PY $D/music/score.py                                           # 4. original big-band score (samples + plucked-string modelling) → music/score.wav
$PY $D/mix.py                                                   # 5. foley + radio-style narration + ducking + optical-soundtrack ageing → mix.wav
node $D/tools/subs.mjs && $PY core/render/srt.py $D/out/cues.json $S/rubber-hose.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4          # 7. frame-by-frame render (1200 frames, ~50–80 s)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/rubber-hose.mp4 24 3           # 8. mux + grain 3 + −14 LUFS
$PY $D/tools/final_asr.py $S/rubber-hose.mp4                                         # 9. whisper self-check on the finished film
# 10. poster / style frame; model sheets render only to out/ (the versions committed to the repo are in stills/)
node core/render/still.mjs $D 43.1 --q 'poster=1&nosub=1' --out $D/out --prefix poster_ && cp $D/out/poster_43.1.jpg $S/poster.jpg
node core/render/still.mjs $D 37.95 --q 'nosub=1' --out $D/out --prefix sf_ && cp $D/out/sf_37.95.jpg $D/stills/styleframe.jpg
node $D/tools/still.mjs $D 0 --q 'mode=sheet&w=2880&h=1620' --w 2880 --h 1620 --out $D/out --prefix sheet_
node $D/tools/still.mjs $D 0 --q 'mode=kitchen&w=2880&h=1620' --w 2880 --h 1620 --out $D/out --prefix kitchen_
