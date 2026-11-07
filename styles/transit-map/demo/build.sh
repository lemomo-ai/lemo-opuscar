#!/bin/sh
# One command: 《6 公里》 6 Kilometres (Transit Map demo)
#   sh styles/transit-map/demo/build.sh     fonts, events, score + mix, picture, master, reading-time check, poster
# No narration, so no voice and no subtitles: every word is printed on the sheet or on the counter.
# In a fresh clone (fonts and samples are not in git) Inter and Noto Sans SC are downloaded from github.com/google/fonts (OFL)
# and the sample packs with tools/fetch.sh.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=transit-map
FPS=30
FRAME=36.2                                           # the low sweep over today's network: poster and gallery still
cd "$LIB"

# fonts (gitignored): Inter variable, and Noto Sans SC variable as the source of the subset the page loads
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/Inter.ttf" ] || curl -sfL -o "$HERE/fonts/Inter.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
[ -f "$HERE/tools/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/tools/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
"$PY" "$HERE/tools/subset.py"                        # fonts/NotoSansSC-sub.ttf from every CJK character in the JS
# sampled instruments (library packs, CC0), fetched once per clone
for l in vcsl freepats vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# events from the picture, then the score and effects placed on them (mix.wav, about -16 LUFS before the master)
node core/render/events.mjs "$HERE"
"$PY" "$HERE/audio.py"

# picture and master (mux.sh brings the mix to -14 LUFS and adds a light grain)
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$FILM/$NAME.mp4" $FPS 1

# reading time of every printed word (window.TEXTS)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster and the gallery style frame
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
