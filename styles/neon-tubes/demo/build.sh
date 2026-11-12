#!/bin/sh
# One command: 《夜宵》 Midnight Snack (Neon Tubes demo)
#   sh demo/build.sh             fonts (if missing), neon glyphs, cast, cues, score + foley, picture, master, readcheck, poster
#   WORKERS=3 sh demo/build.sh   more render workers (default 2)
# Needs only the core tier: no voice, no sample libraries (the score and foley are synthesised in audio.py).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/neon-tubes/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/neon-tubes
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=neon-tubes
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): Barlow Condensed Bold and the Noto Sans SC variable font from github.com/google/fonts (OFL),
# then the subset with the six hanzi of the end card
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/BarlowCondensed-Bold.ttf" ] || curl -sfL -o "$HERE/fonts/BarlowCondensed-Bold.ttf" "$GF/barlowcondensed/BarlowCondensed-Bold.ttf"
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
[ -f "$HERE/fonts/NotoSansSC-sub.ttf" ] || "$PY" "$HERE/tools/fonts.py"

# neon hanzi on the font's skeleton -> glyphs.json; cat poses, goldfish, fishbowl, goblet -> art.json (both deterministic)
"$PY" "$HERE/tools/glyphs_build.py"
"$PY" "$HERE/tools/art.py"

# sound cues from the picture, score + foley, every frame, master to -14 LUFS
node core/render/events.mjs "$HERE"
"$PY" "$HERE/audio.py"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$FILM/$NAME.mp4" 30 1

# checks, poster and the gallery style frame (the paw in the fishbowl)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 16.75 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 16.75 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
