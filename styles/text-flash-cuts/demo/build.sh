#!/bin/sh
# Text Flash Cuts: rebuilds "Behind You" in one go from the 11 generated images in gen/ (not in git; this script does not draw them):
# font subset → key/prep images → events → readability check → picture at 30 fps → score and sfx → mux at −14 LUFS → poster, style frames
# To regenerate images: sh tools/gen_all.sh (prompts and the --ref chain are in prompts/prompts.json; a new character image means re-measuring PIVOT/HEADPOLY/COLLAR, HB, HF in main.js)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}          # <repo>/films/<name>/demo or <repo>/styles/<slug>/demo
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
SLUG=text-flash-cuts
OUT=$(cd "$HERE/.." && pwd)
for l in vsco2ce vcsl; do [ -d "$LIB/core/audio/instruments/$l" ] || (cd "$LIB" && sh tools/fetch.sh instruments $l); done
sh "$HERE/tools/fonts.sh"
mkdir -p "$HERE/assets" "$HERE/out" "$HERE/stills"
ls "$HERE"/gen/char_lookback_*.png >/dev/null 2>&1 || { echo "the demo's 11 images (demo/gen/*.png) are not in git: they come from an image generator (tools/gen_all.sh; DEMO.md)"; exit 1; }
"$PY" "$HERE/tools/prep.py"
"$PY" "$HERE/tools/key.py" "$(ls "$HERE"/gen/char_lookback_*.png | head -1)" "$HERE/assets/char.png"
"$PY" -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=93)" "$(ls "$HERE"/gen/eye_*.png | head -1)" "$HERE/assets/eye.jpg"
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE" --step 0.04
node core/render/video.mjs "$HERE" --fps 30 --workers ${WORKERS:-2} --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$OUT/$SLUG.mp4" 30 0
node core/render/still.mjs "$HERE" 38.3 --prefix poster_ --out "$HERE/out" >/dev/null
cp "$HERE/out/poster_38.3.jpg" "$OUT/poster.jpg"
cp "$HERE/out/poster_38.3.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $OUT/$SLUG.mp4"
