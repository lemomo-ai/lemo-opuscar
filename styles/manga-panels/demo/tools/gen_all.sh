#!/bin/sh
# Draws the demo's images with an image generator (core/image/gen_image.py, which needs the user's Codex CLI; see
# core/README.md, "Image generation"). Prompt text is in prompts/<name>.txt, with tools/style_suffix.txt appended.
# Order: the two references first (the photographer char_shoot, the camera prod_hero), then every image with --ref to them.
# One at a time; a name that already has gen/<name>_*.png is skipped; stops after 3 failures in a row. build.sh never calls it.
# With another image tool: use the same prompts, suffix, aspect and references, and save gen/<name>_<anything>.png.
HERE=$(cd "$(dirname "$0")/.." && pwd); cd "$HERE"
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
PY=${PY:-"$LIB/.venv/bin/python"}; [ -x "$PY" ] || PY=python3
GEN="$LIB/core/image/gen_image.py"
"$PY" "$GEN" --check || exit 4
S=$(cat tools/style_suffix.txt)
fails=0
one() {  # name aspect refs...
  n=$1; a=$2; shift 2
  ls gen/${n}_*.png 2>/dev/null | grep -qv wrongaspect && { echo "skip $n"; return 0; }
  refs=""; for r in "$@"; do f=$(ls gen/${r}_*.png 2>/dev/null | grep -v wrongaspect | tail -1)
    [ -n "$f" ] || { echo "$n needs gen/${r}_*.png first"; exit 1; }; refs="$refs --ref $f"; done
  echo "== $n ($a)$refs"
  if "$PY" "$GEN" "$(cat prompts/$n.txt) $S" --aspect $a --out gen --name $n $refs --timeout 360; then fails=0
  else fails=$((fails+1)); echo "FAIL $n ($fails)"; [ $fails -ge 3 ] && { echo "3 failures in a row, stopping"; exit 9; }; fi
}
one char_shoot 4:3
one char_jump 16:9 char_shoot
one prod_hero 4:3 char_shoot
one char_eye 21:9 char_shoot
one bg_city 16:9
one key_title 3:4 char_shoot char_jump
one run 16:9 char_shoot char_jump
one ready 4:3 char_shoot
one aim_you 16:9 char_shoot prod_hero
one smile 4:3 char_shoot
one crowd 16:9 char_shoot
one over 16:9 char_shoot
one pigeons 16:9
one feet 16:9 char_jump
one finger 4:3 prod_hero
echo "all done"
