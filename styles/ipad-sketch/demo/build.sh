#!/bin/sh
# One command: «From Cherry to Cup» (Tablet Sketch Explainer demo), 51 s.
#   sh styles/ipad-sketch/demo/build.sh      fonts (if missing), glyph skeletons (if missing), voice (if missing) + speech
#                                           check, subtitle cues + .srt, events, picture, narration + foley + score mix,
#                                           master, reading-time check, poster and style frames
# Run from anywhere; LIB defaults to the library root three folders up. A fresh clone needs: sh tools/fetch.sh voice and
# sh tools/fetch.sh instruments freepats / karoryfer / vcsl (guitar, double bass, shaker, vibraphone).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../ipad-sketch/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../ipad-sketch
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=ipad-sketch
WORKERS=${WORKERS:-2}
cd "$LIB"

# fonts (gitignored, OFL): Caveat, Long Cang, LXGW WenKai, cut to the characters the film uses
[ -f "$HERE/fonts/Caveat-Bold.ttf" ] && [ -f "$HERE/fonts/LongCang-subset.ttf" ] && [ -f "$HERE/fonts/LXGWWenKai-subset.ttf" ] \
  || sh "$HERE/tools/fonts.sh" "$HERE" "$PY"
# glyph skeletons for the stroke-by-stroke lettering
[ -f "$HERE/glyphs.json" ] || "$PY" "$HERE/tools/skeleton.py"

# voice: Kokoro af_heart (deterministic); every line must pass the speech-to-text check
NEED=""; for i in 01 02 03 04 05 06 07 08 09 10; do [ -f "$HERE/voice/v$i.wav" ] || NEED=1; done
if [ -n "$NEED" ]; then "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"; fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en

# voice timing → subtitle cues (voice/cues.json, read by the page) and the .srt; events, picture, mix, master
"$PY" "$HERE/tools/cues.py"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1     # −14 LUFS, a light film grain

# checks: reading time of every text drawn on the page (subtitles are checked by tools/cues.py)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: see demo/out/readcheck.txt"

# poster and gallery style frame: the finished page before the credit card, no stylus, no subtitle (?clean=1);
# three more style frames for DEMO.md
mkdir -p "$HERE/stills" "$HERE/out/stills"
node core/render/still.mjs "$HERE" 46.49 11.8 29.9 37.9 --q clean=1 --out "$HERE/out/stills" > /dev/null
ffmpeg -v error -y -i "$HERE/out/stills/t_46.49.jpg" -q:v 4 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
n=1; for t in 11.8 29.9 37.9; do ffmpeg -v error -y -i "$HERE/out/stills/t_$t.jpg" -q:v 4 "$HERE/stills/frame_$n.jpg"; n=$((n + 1)); done
echo "done: $FILM/$NAME.mp4"
