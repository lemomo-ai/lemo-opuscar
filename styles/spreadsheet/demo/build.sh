#!/bin/sh
# One command: The Hidden Column 《藏起来的那一列》 (Spreadsheet Film demo, 52 s)
#   sh demo/build.sh              fonts, voice + speech check, timeline + subtitles, events, picture, mix, master, poster
#   sh demo/build.sh cut 20 30    any [start, end) of the same timeline → demo/out/cut_20-30.mp4 (short sound fade at its end)
# In a fresh clone (fonts and voice files are not in git) the fonts are downloaded and the voice is regenerated.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../spreadsheet/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../spreadsheet
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=spreadsheet
cd "$LIB"

# fonts (gitignored): Inter and Noto Sans SC variable fonts from github.com/google/fonts (OFL), subset to the film's characters
GF=https://raw.githubusercontent.com/google/fonts/main/ofl
mkdir -p "$HERE/fonts/src"
[ -f "$HERE/fonts/src/Inter-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/Inter-VF.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
"$PY" -I "$HERE/tools/fonts.py"

# voice: Kokoro af_bella, one WAV per phrase; every phrase must pass the speech-to-text check
[ -f "$HERE/vo/chunks/v13_1.wav" ] || "$PY" core/tts/tts.py "$HERE/vo/chunks.json" "$HERE/vo/chunks"
"$PY" core/tts/asr_check.py "$HERE/vo/chunks.json" "$HERE/vo/chunks" --lang en
"$PY" "$HERE/timeline.py"                            # phrase starts, subtitle cues → tl.js, timeline.json, ../spreadsheet.srt

node core/render/events.mjs "$HERE"                  # every key, painted cell, opened column, landed patient → events.json
if [ "$1" = "cut" ]; then
  A=$2; B=$3
  node core/render/video.mjs "$HERE" --fps 24 --workers 2 --q "from=$A&to=$B" --out "$HERE/out/video_cut.mp4"
  "$PY" "$HERE/mix.py" "$A" "$B"
  sh core/render/mux.sh "$HERE/out/video_cut.mp4" "$HERE/out/mix.wav" "$HERE/out/cut_$A-$B.mp4" 24 0
  echo "done: $HERE/out/cut_$A-$B.mp4"; exit 0
fi
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok"

# poster and gallery style frame: the far pull-out under the colour scale (47.3 s), drawn without the subtitle note
node core/render/still.mjs "$HERE" 47.3 --q nosub=1 --out "$HERE/out/poster"
ffmpeg -v error -y -i "$HERE/out/poster/t_47.3.jpg" -q:v 4 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -i "$HERE/out/poster/t_47.3.jpg" -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
