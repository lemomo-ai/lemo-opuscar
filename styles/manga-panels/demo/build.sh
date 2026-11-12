#!/bin/sh
# One command: KOMA ONE: Thirty Frames a Second (Manga Panels demo)
#   sh demo/build.sh              screentone (gen/ → img/), fonts (if missing), events, score + foley, picture, master, readcheck, poster
#   SKIP_PREP=1 sh demo/build.sh  keep the screened images already in img/
#   WORKERS=3 sh demo/build.sh    more render workers (default 2)
# Rebuilds from the drawings in gen/, which are not in git (no new generation here; that is tools/gen_all.sh + tools/gen_camswap.sh, prompts in prompts/).
# The whole cut grid is beats.json.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/manga-panels/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/manga-panels
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}; export PY
NAME=manga-panels
WORKERS=${WORKERS:-2}
OUT=${OUT:-"$FILM/$NAME.mp4"}
mkdir -p "$HERE/out" "$HERE/img" "$HERE/stills"
NOGEN="they come from an image generator: first check it with 'python3 core/image/gen_image.py --check' (from the library root), then run tools/gen_all.sh and tools/gen_camswap.sh (DEMO.md, Images)"
if [ -z "$SKIP_PREP" ]; then
  ls "$HERE"/gen/*.png >/dev/null 2>&1 || { echo "the demo's drawings (demo/gen/*.png) are not in git: $NOGEN"; exit 1; }
  sh "$HERE/tools/prep_all.sh"
fi
# every screened image the page loads (one per line of tools/prep_all.sh) must be there before the render starts
miss=""
for n in $(sed -n 's/^p [a-z_]* *\([A-Za-z]*\) .*/\1/p' "$HERE/tools/prep_all.sh"); do [ -f "$HERE/img/$n.png" ] || miss="$miss $n.png"; done
if [ -n "$miss" ]; then
  if [ -n "$SKIP_PREP" ]; then echo "SKIP_PREP is set, but demo/img/ is missing:$miss. Run without SKIP_PREP to screen them from demo/gen/*.png, which are not in git either: $NOGEN"
  else echo "demo/img/ is still missing:$miss (no matching drawing in demo/gen/). The drawings are not in git: $NOGEN"; fi
  exit 1
fi
sh "$HERE/tools/fonts.sh" >/dev/null
cd "$LIB"
node core/render/events.mjs "$HERE"
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$OUT" 30 1

# checks, poster and the gallery style frame (she aims the camera at the viewer; no lettering, no sign-off)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 40.2 -i "$OUT" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 40.2 -i "$OUT" -frames:v 1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $OUT"
