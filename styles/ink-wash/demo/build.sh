#!/bin/sh
# Rebuild "The Swordsman and the River" from scratch in one go: from the repo root run sh styles/ink-wash/demo/build.sh
set -e
cd "$(dirname "$0")/../../.."
D=styles/ink-wash/demo
PY=.venv/bin/python
echo "1/7 voice"; $PY core/tts/tts.py $D/lines.json $D/voices
echo "2/7 whisper check"; $PY core/tts/asr_check.py $D/lines.json $D/voices
echo "3/7 score"; $PY $D/music/score.py
echo "4/7 events + mix"; node core/render/events.mjs $D && $PY $D/mix.py
echo "5/7 render 1152 frames"; node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4
echo "6/7 mux (−14 LUFS, no grain: the xuan-paper texture is in the shader)"; sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav styles/ink-wash/ink-wash.mp4 24 0
echo "7/7 subtitles / poster / style frames"
node $D/cues.mjs > $D/cues.json && $PY core/render/srt.py $D/cues.json styles/ink-wash/ink-wash.srt
node core/render/still.mjs $D 12.4 --q poster=1 --out $D/out --prefix poster_ && cp $D/out/poster_12.4.jpg styles/ink-wash/poster.jpg
node core/render/still.mjs $D 32.9 --q nosub=1 --out $D/out --prefix sf_ && cp $D/out/sf_32.9.jpg $D/stills/styleframe.jpg
echo done
