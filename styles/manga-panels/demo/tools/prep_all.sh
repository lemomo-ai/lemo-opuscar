#!/bin/sh
# Generated images → screentone sheets (gen/ → img/). Each is scaled to its "display size on screen" before toning, so the dot period stays stable.
HERE=$(cd "$(dirname "$0")/.." && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
PY=${PY:-"$LIB/.venv/bin/python"}
cd "$HERE"
g() { ls "$HERE"/gen/$1_*.png 2>/dev/null | grep -v wrongaspect | tail -1; }
p() { f=$(g $1); shift; [ -z "$f" ] || "$PY" tools/prep.py "$f" "$@"; }   # a missing drawing is skipped; build.sh names it
p char_shoot shoot    --key --width 1500 --cell 7
p char_shoot shootcam --key --crop 150,230,650,640 --width 1100 --cell 9
p char_jump  jump     --key --width 1800 --cell 7
p char_jump  jumps    --key --width 640 --cell 4 --lo .34
p prod_hero  hero     --key --width 1300 --cell 7
p char_eye   eye      --width 2000 --cell 8
p bg_city    city     --width 2300 --cell 7
p key_title  key      --key --width 1100 --cell 7
p run        run      --key --width 1700 --cell 7
p ready      ready    --key --width 1300 --cell 7
p aim_you    aim      --key --width 1900 --cell 7
p smile      smile    --key --width 1400 --cell 7
p crowd      crowd    --width 2000 --cell 6
p over       over     --width 2000 --cell 7
p pigeons    pig      --key --width 1700 --cell 7
p pigeons    pigS     --key --width 560 --cell 4 --lo .34
p feet       feet     --width 1500 --cell 7
p finger     finger   --width 2000 --cell 8
