#!/bin/sh
# One command: After the Fire (Ruach demo), 26.5 s, 1920×1080, 30 fps, music and sound, no voice
#   sh demo/build.sh     fonts if missing, score and sound, picture, mix and master → styles/ruach/ruach.mp4,
#                        the poster and the gallery style frame
# Light by default (one render worker, no supersampling, low priority); on a strong machine: WORKERS=3 SSAA=2 sh demo/build.sh
# SIZE=1080x1920 renders the vertical version to demo/out/. Needs the VSCO 2 CE samples: sh tools/fetch.sh instruments vsco2ce
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/ruach/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/ruach
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; FPS=30; WORKERS=${WORKERS:-1}; SSAA=${SSAA:-1}; SIZE=${SIZE:-1920x1080}
OUT="$HERE/out"; mkdir -p "$OUT"
cd "$LIB"
"$PY" "$HERE/tools/fonts.py"
nice -n 10 "$PY" "$HERE/audio/score.py" "$OUT"
nice -n 10 node core/render/video.mjs "$HERE" --fps $FPS --workers $WORKERS --size "$SIZE" --q "ssaa=$SSAA" --out "$OUT/video.mp4"
if [ "$SIZE" = "1920x1080" ]; then FINAL="$FILM/ruach.mp4"; else FINAL="$OUT/ruach-$SIZE.mp4"; fi
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$FINAL" $FPS 2
if [ "$SIZE" = "1920x1080" ]; then
  ffmpeg -v error -y -ss 21 -i "$FINAL" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
  node core/render/still.mjs "$HERE" 3.8 --q "shot=horeb&ssaa=2" --out "$OUT"
  cp "$OUT/t_3.8.jpg" "$HERE/stills/styleframe.jpg"
fi
echo "→ $FINAL"
