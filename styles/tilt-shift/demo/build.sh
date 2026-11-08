#!/bin/sh
# Rebuild "Toy Town Rush Hour" from scratch: sh styles/tilt-shift/demo/build.sh (runs from the repo root or any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
D="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$D/../../.." && pwd)"; PY="$R/.venv/bin/python"
cd "$R"
echo "== 1. voice + whisper check"
$PY core/tts/tts.py "$D/lines.json" "$D/voices"
$PY core/tts/asr_check.py "$D/lines.json" "$D/voices"
echo "== 2. export events (cars crossing the stop line / lights changing / carriages / ducks hopping the kerb…) and subtitles"
node core/render/events.mjs "$D"
node "$D/subs.mjs"
$PY core/render/srt.py "$D/cues.json" "$D/../tilt-shift.srt"
echo "== 3. score (sampled marimba, fixed skeleton + event gating)"
$PY "$D/music/score.py"
echo "== 4. mix"
$PY "$D/mix.py"
echo "== 5. render the picture (24 fps, 3 workers)"
node core/render/video.mjs "$D" --fps 24 --workers 3 --q noev --out "$D/out/video24.mp4"
echo "== 6. mux (two-pass loudnorm -14 LUFS, grain 1)"
sh core/render/mux.sh "$D/out/video24.mp4" "$D/mix.wav" "$D/../tilt-shift.mp4" 24 1
echo "== 7. poster and style frames"
node core/render/still.mjs "$D" 20.6 --q "noev&nohud" --prefix sf_ --out "$D/out/stills"
cp "$D/out/stills/sf_20.6.jpg" "$D/stills/styleframe.jpg"
node core/render/still.mjs "$D" 8.7 --q "noev&nohud" --prefix poster_ --out "$D/out/stills"
cp "$D/out/stills/poster_8.7.jpg" "$D/../poster.jpg"
echo "done: $D/../tilt-shift.mp4"
