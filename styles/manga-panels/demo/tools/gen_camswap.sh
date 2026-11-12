#!/bin/sh
# Changing the prop after the drawings exist (STYLE.md §9, Pipeline 6), as done for this demo's camera:
#   1. move the drawings that show the old prop into gen/before/ (prod_hero and every name in prompts/_camswap_list.txt);
#   2. this script redraws the camera alone (prompts/prod_hero_redesign.txt, an edit of the old prod_hero), then edits each
#      listed image with the old drawing as the image to edit and the new prod_hero as the second reference:
#      prompt = prompts/_camswap.txt + that image's line in prompts/_camswap_list.txt (name|aspect|how the camera is held)
#      + prompts/_camswap_tail.txt + tools/style_suffix.txt.
# Faces, poses and framing stay; re-measure every anchor that sits on the prop afterwards. One at a time; existing names are skipped.
HERE=$(cd "$(dirname "$0")/.." && pwd); cd "$HERE"
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
PY=${PY:-"$LIB/.venv/bin/python"}; [ -x "$PY" ] || PY=python3
GEN="$LIB/core/image/gen_image.py"
"$PY" "$GEN" --check || exit 4
S=$(cat tools/style_suffix.txt); C=$(cat prompts/_camswap.txt); T=$(cat prompts/_camswap_tail.txt)
before() { ls gen/before/$1_*.png 2>/dev/null | grep -v wrongaspect | tail -1; }
if ! ls gen/prod_hero_*.png 2>/dev/null | grep -qv wrongaspect; then
  old=$(before prod_hero); [ -n "$old" ] || { echo "move the old gen/prod_hero_*.png into gen/before/ first"; exit 1; }
  "$PY" "$GEN" "$(cat prompts/prod_hero_redesign.txt) $S" --edit --aspect 4:3 --out gen --name prod_hero --ref "$old" --timeout 480 || exit 2
fi
HERO=$(ls gen/prod_hero_*.png | grep -v wrongaspect | tail -1)
while IFS='|' read -r n a how; do
  [ -n "$n" ] || continue
  ls gen/${n}_*.png 2>/dev/null | grep -qv wrongaspect && { echo "skip $n"; continue; }
  src=$(before "$n"); [ -n "$src" ] || { echo "no gen/before/${n}_*.png: skipped"; continue; }
  echo "== $n"
  "$PY" "$GEN" "$(printf '%s\n%s\n%s\n%s' "$C" "$how" "$T" "$S")" --edit --aspect "$a" --out gen --name "$n" --ref "$src" --ref "$HERO" --timeout 480 </dev/null \
    || echo "FAIL $n"
done < prompts/_camswap_list.txt
echo "all done"
