#!/bin/sh
# Contact sheet: one 960×540 still every 0.5 s → out/sheet.jpg. Run from anywhere (LIB = library root).
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}; cd "$LIB"
PY=${PY:-"$LIB/.venv/bin/python"}
rm -rf "$HERE/out/sheet"; mkdir -p "$HERE/out/sheet"
node core/render/still.mjs "$HERE" --range 0:49.9:0.5 --size 960x540 --out "$HERE/out/sheet" --prefix s_ 2>&1 | grep -v Canvas2D | awk '{print $2}' | sort -n | tail -3
"$PY" core/render/sheet.py "$HERE/out/sheet.jpg" $(ls "$HERE"/out/sheet/s_*.jpg | sort -t_ -k3 -n) --cols 8 --w 240
