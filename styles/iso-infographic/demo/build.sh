#!/bin/sh
# Rebuild "From Bean to Cup" from scratch: sh styles/iso-infographic/demo/build.sh (runs from any directory)
set -e
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/iso-infographic/demo; O=styles/iso-infographic
$PY core/tts/tts.py $D/lines.json $D/voices                               # 1. Kokoro voice-over (bf_alice)
$PY core/tts/asr_check.py $D/lines.json $D/voices                         # 2. whisper check, line by line
$PY $D/music/score.py                                                     # 3. original score → music/score.wav + stems + score.json
node core/render/events.mjs $D                                            # 4. picture events → events.json (shared by foley / self-checks)
$PY $D/tools/cuecheck.py                                                  # 5. score hit points ↔ picture events
$PY $D/mix.py                                                             # 6. ambience bed + foley + voice + ducking → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/srt.json $O/iso-infographic.srt   # 7. subtitles
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4             # 8. frame-by-frame render
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $O/iso-infographic.mp4 24 0           # 9. mux: −14 LUFS, grain 0
$PY $D/tools/final_asr.py $O/iso-infographic.mp4 || true                                # 10. whisper spot-check of the finished film
node core/render/still.mjs $D 56.0 --q 'nosub=1&nocard=1' --out $D/out/still --prefix sf_ >/dev/null && cp $D/out/still/sf_56.0.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 57.0 --q nosub=1 --out $D/out/still --prefix po_ >/dev/null && cp $D/out/still/po_57.0.jpg $O/poster.jpg
node core/render/still.mjs $D 3.4 50.9 --q nosub=1 --out $D/out/still --prefix hand_ >/dev/null && $PY core/render/sheet.py $D/stills/frame_hands.jpg $D/out/still/hand_3.4.jpg $D/out/still/hand_50.9.jpg --cols 2 --w 960
node core/render/still.mjs $D 0 --q test=spark --out $D/out/still --prefix eng_ >/dev/null && cp $D/out/still/eng_0.jpg $D/stills/engine_shape.jpg
