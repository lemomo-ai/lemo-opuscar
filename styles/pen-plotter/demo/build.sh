#!/bin/sh
# One command: 《8848.86》 (Pen Plotter demo)
#   sh demo/build.sh            plot (if missing), events, picture, score + machine sounds, master, readcheck, poster
#   PLOT=1 sh demo/build.sh     rebuild plot.json from the elevation data even when it exists
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs the VSCO 2 CE, VCSL and Salamander sample libraries: sh tools/fetch.sh instruments vsco2ce; … vcsl; … salamander
# The first run downloads the NASADEM tiles (Microsoft Planetary Computer, ~90 MB) and the font sources (github, ~45 MB) into
# demo/data/ (local, not in git), then builds plot.json: every pen stroke of the sheet, in plotting order.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/pen-plotter/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/pen-plotter
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=pen-plotter
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/data/fontsrc" "$HERE/stills"

# plot.json (local): font sources → NASADEM tiles → cropped DEM → route and profile → every stroke on the sheet
if [ "${PLOT:-0}" = "1" ] || [ ! -f "$HERE/plot.json" ]; then
  SRC="$HERE/data/fontsrc"; GF=https://github.com/google/fonts/raw/main/ofl
  RS=https://github.com/isdat-type/Relief-SingleLine/raw/main
  [ -f "$SRC/NotoSansSC-VF.ttf" ]   || curl -sfL -o "$SRC/NotoSansSC-VF.ttf"   "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
  [ -f "$SRC/NotoSerifSC-VF.ttf" ]  || curl -sfL -o "$SRC/NotoSerifSC-VF.ttf"  "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
  [ -f "$SRC/OFL-NotoSansSC.txt" ]  || curl -sfL -o "$SRC/OFL-NotoSansSC.txt"  "$GF/notosanssc/OFL.txt"
  [ -f "$SRC/OFL-NotoSerifSC.txt" ] || curl -sfL -o "$SRC/OFL-NotoSerifSC.txt" "$GF/notoserifsc/OFL.txt"
  [ -f "$SRC/ReliefSingleLine.svg" ] || curl -sfL -o "$SRC/ReliefSingleLine.svg" "$RS/fonts/open_svg/ReliefSingleLineSVG-Regular.svg"
  [ -f "$SRC/OFL-ReliefSingleLine.txt" ] || curl -sfL -o "$SRC/OFL-ReliefSingleLine.txt" "$RS/OFL.txt"
  [ -f "$HERE/data/dem.npy" ] || { "$PY" -I "$HERE/tools/fetch_dem.py"; "$PY" -I "$HERE/tools/crop_dem.py"; }
  "$PY" -I "$HERE/tools/route.py"
  "$PY" -I "$HERE/tools/make_plot.py"
  "$PY" -I "$HERE/tools/fonts.py"
fi

# events (per-frame pen speed, pen down, grips, camps, jumps), picture, score + machine sounds, master (grain 1)
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/audio.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$FILM/$NAME.mp4" 30 1

# checks, poster and the gallery style frame (the red pen at Base Camp, 18.4 s)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 18.4 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 4 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 18.4 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
