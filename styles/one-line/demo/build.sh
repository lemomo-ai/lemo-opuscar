#!/bin/sh
# rebuild the film from scratch: voice → whisper check → events → score → mix → frame-by-frame render → mux (−14 LUFS, grain 0) → subtitles / poster / style frames
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
D=styles/one-line/demo
.venv/bin/python core/tts/tts.py $D/lines.json $D/voices
.venv/bin/python core/tts/asr_check.py $D/lines.json $D/voices
node core/render/events.mjs $D
.venv/bin/python $D/music/score.py
.venv/bin/python $D/mix.py
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav styles/one-line/one-line.mp4 24 0
.venv/bin/python $D/cues_export.py
.venv/bin/python core/render/srt.py $D/cues.json styles/one-line/one-line.srt
node core/render/still.mjs $D 46.9 --out $D/out/poster --prefix p_ && cp $D/out/poster/p_46.9.jpg styles/one-line/poster.jpg
node core/render/still.mjs $D 39.3 --q nosub=1 --out $D/out/poster --prefix s_ && cp $D/out/poster/s_39.3.jpg $D/stills/styleframe.jpg
echo done
