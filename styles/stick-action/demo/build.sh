#!/bin/sh
# One command: Last Stroke 《最后一笔》 (Stickman Action demo)
#   sh styles/stick-action/demo/build.sh     fonts (if missing) -> events -> picture (24 fps) -> score -> mix -> master -> reading check -> poster + stills
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=stick-action
cd "$LIB"

# fonts (gitignored .woff2, subset from Google Fonts, OFL): fetch when any is missing
for f in Anton-400 BarlowSC-600 NotoSansSC-900; do
  [ -f "$HERE/fonts/$f.woff2" ] || { "$PY" -I "$HERE/tools/fonts.py" "$HERE"; break; }
done
mkdir -p "$HERE/out" "$HERE/stills"

# picture on ones at 24 fps; the sound events come from the same page (window.EV)
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$PY" -I "$HERE/music.py"
"$PY" -I "$HERE/mix.py"
# no grain: the paper grain is already in the frame and clean vector strokes compress well
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0

# every on-screen text is held long enough to read
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok"

# poster (the clash) = gallery style frame; stills for DEMO.md
ffmpeg -v error -y -ss 33.7 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
for s in exchange:14.45 impact:17.15 edge:22.75 pass:41.5 hand:50.8; do
  ffmpeg -v error -y -ss "${s#*:}" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 -vf scale=960:-1 "$HERE/stills/frame_${s%%:*}.jpg"
done
echo "done: $FILM/$NAME.mp4"
