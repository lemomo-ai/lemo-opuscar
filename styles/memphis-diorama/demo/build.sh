#!/bin/sh
# One command: 《柚子城的四季》 Four Seasons in Pomelo Town (Memphis Diorama demo)
#   sh styles/memphis-diorama/demo/build.sh     fonts (if missing) -> picture (60 fps) -> score -> master -> reading check -> poster + stills
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=memphis-diorama
cd "$LIB"

# fonts (gitignored .woff2, subset from Google Fonts, OFL): fetch when any is missing
for f in NotoSansSC-400 NotoSansSC-600 InterTight-400 InterTight-600 IBMPlexMono-400; do
  [ -f "$HERE/fonts/$f.woff2" ] || { "$PY" -I "$HERE/tools/fonts.py" "$HERE"; break; }
done
mkdir -p "$HERE/out" "$HERE/stills"

# picture at 60 fps (the style never drops frames), score, master (no grain: the frame already carries its own)
node core/render/video.mjs "$HERE" --fps 60 --workers 4 --out "$HERE/out/video.mp4"
"$PY" -I "$HERE/music.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 60 0

# every bottom line is held long enough to read
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster (autumn: haystacks and the geese) = gallery style frame; one still per season for DEMO.md
ffmpeg -v error -y -ss 25.0 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
for s in spring:5.0 summer:15.0 squat:19.32 winter:37.6; do
  ffmpeg -v error -y -ss "${s#*:}" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 -vf scale=960:-1 "$HERE/stills/frame_${s%%:*}.jpg"
done
echo "done: $FILM/$NAME.mp4"
