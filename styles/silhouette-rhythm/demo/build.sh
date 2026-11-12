#!/bin/sh
# One command: Half a Beat 《慢半拍》 (Silhouette Rhythm demo)
#   sh demo/build.sh             fonts (if missing), events, score + foley, picture, master, readcheck, poster + style frame
#   WORKERS=3 sh demo/build.sh   more render workers (default 2)
# The score needs four sample libraries: sh tools/fetch.sh instruments vcsl; ... vsco2ce; ... freepats; ... karoryfer
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/silhouette-rhythm/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/silhouette-rhythm
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=silhouette-rhythm
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): Anton, Barlow Condensed and the Noto Sans SC variable font from github.com/google/fonts (OFL), then subsets
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/src/Anton-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/src/Anton-Regular.ttf" "$GF/anton/Anton-Regular.ttf"
[ -f "$HERE/fonts/src/BarlowCondensed-Medium.ttf" ] || curl -sfL -o "$HERE/fonts/src/BarlowCondensed-Medium.ttf" "$GF/barlowcondensed/BarlowCondensed-Medium.ttf"
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
for f in Anton-sub BarlowCondensed-500-sub NotoSansSC-900-title NotoSansSC-500-title; do
  [ -f "$HERE/fonts/$f.ttf" ] || { "$PY" "$HERE/make_fonts.py"; break; }
done

# sound cues from the picture, then score + foley (out/mix.wav, exactly 49.000 s)
node core/render/events.mjs "$HERE"
"$PY" "$HERE/audio.py"

# picture, master (-14 LUFS, true peak under -1 dB, grain 1)
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1

# checks, poster and the gallery style frame (the take-off freeze: no text on screen)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 37.0 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 37.0 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
