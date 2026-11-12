#!/bin/sh
# One command: 《冬夜，一栋楼的体温》 A Building on a Winter Night (Thermal Camera demo)
#   sh demo/build.sh           fonts and the meow recording (if missing), events, readcheck, mix, picture, master, poster
#   WORKERS=3 sh demo/build.sh more render workers (default 2)
# Needs the VSCO 2 CE, VCSL and FreePats sample libraries: sh tools/fetch.sh instruments vsco2ce; … vcsl; … freepats
# No voice, no subtitles. three.js comes from the library's node_modules.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/thermal-camera/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/thermal-camera
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=thermal-camera
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills" "$HERE/assets/meow"

# fonts (gitignored): IBM Plex Mono, Inter and the Noto Sans SC variable font from github.com/google/fonts (OFL), then the SC subsets
GF=https://github.com/google/fonts/raw/main/ofl
for w in Regular Medium; do
  [ -f "$HERE/fonts/IBMPlexMono-$w.ttf" ] || curl -sfL -o "$HERE/fonts/IBMPlexMono-$w.ttf" "$GF/ibmplexmono/IBMPlexMono-$w.ttf"
done
[ -f "$HERE/fonts/Inter.ttf" ] || curl -sfL -o "$HERE/fonts/Inter.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
[ -f "$HERE/fonts/NotoSansSC-500.ttf" ] && [ -f "$HERE/fonts/NotoSansSC-700.ttf" ] || "$PY" "$HERE/make_fonts.py"

# the one recorded sound (gitignored): a meow by Tsester, CC0 1.0, Wikimedia Commons
[ -f "$HERE/assets/meow/meow_cc0.flac" ] || curl -sfL -A "lemo-opuscar build" -o "$HERE/assets/meow/meow_cc0.flac" \
  "https://commons.wikimedia.org/wiki/Special:FilePath/2015-11-24.%CE%BD%CE%B9%CE%B1%CE%BF%CF%8D%CF%81%CE%B9%CF%83%CE%BC%CE%B1.%CE%9D%CE%B9%CE%AC%CE%BF%CF%85.noise_reduced.flac"

# events, reading-time check, score + tones + foley, picture, master (grain 1)
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" "$HERE/audio.py"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1

# poster and the gallery style frame (the scan line halfway across the block: heat on the left, the night picture on the right)
ffmpeg -v error -y -ss 1.3 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 1.3 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
