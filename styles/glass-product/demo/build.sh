#!/bin/sh
# Rebuild "Aura — Hear the Light" from scratch in one command: sh styles/glass-product/demo/build.sh (runs from any folder)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=styles/glass-product/demo; PY=.venv/bin/python
echo "== 1. voice + whisper check"
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices
echo "== 2. original score (numpy synthesis)"
$PY $D/music/score.py
echo "== 3. timeline events → foley + mix"
node core/render/events.mjs $D
$PY $D/mix.py
echo "== 4. frame-by-frame render (three.js, 2× supersampling)"
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4
echo "== 5. mux the film (−14 LUFS, grain 0) + subtitles"
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav styles/glass-product/glass-product.mp4 24 0
$PY $D/subs.py && $PY core/render/srt.py $D/cues.json styles/glass-product/glass-product.srt
echo "== 6. self-check the film (whisper, line by line)"
$PY $D/check_mix.py styles/glass-product/glass-product.mp4
