#!/bin/sh
# One command: 《为什么会有四季》 Why We Have Seasons (Textbook Doodle demo)
#   sh styles/textbook-doodle/demo/build.sh
# Steps: fonts, sample libraries, score, picture, master, reading-time check, subtitles, poster and stills.
# Fonts and samples are not in git: they are downloaded here (OFL / CC0 / CC BY, see CREDITS). No voice.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../textbook-doodle/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../textbook-doodle
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=textbook-doodle
FPS=24
FRAME=20.3                                           # the figure hanging on the torch, the spot stretching: poster and gallery frame
cd "$LIB"

# fonts (gitignored): Long Cang, Noto Serif SC, Noto Sans SC, subset from Google Fonts to the characters the film uses
ls "$HERE"/fonts/LongCang-*.woff* >/dev/null 2>&1 || "$PY" -I "$HERE/tools/fonts.py"
# sampled instruments (library packs: VSCO 2 CE and VCSL are CC0, FreePats' MuldjordKit is CC BY 4.0)
for l in vsco2ce vcsl freepats; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# score from timeline.json (the picture reads the same cues and reading holds)
"$PY" "$HERE/tools/score.py"

# picture and master (mux.sh brings the mix to -14 LUFS and adds a light grain)
node core/render/video.mjs "$HERE" --fps $FPS --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" $FPS

# every line on the page is held long enough to read (window.TEXTS)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# the handwriting as bilingual subtitles, the poster (= gallery style frame) and one still per section for DEMO.md
"$PY" "$HERE/tools/srt.py" "$FILM/$NAME.srt"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
for s in question:3.4 orbit:12.6 flashlight:21.6 answer:38.5; do
  ffmpeg -v error -y -ss "${s#*:}" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 -vf scale=960:-1 "$HERE/stills/frame_${s%%:*}.jpg"
done
echo "done: $FILM/$NAME.mp4"
