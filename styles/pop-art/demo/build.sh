#!/bin/sh
# One command: 《同一根香蕉》 The Same Banana (Pop Art demo)
#   sh demo/build.sh            fonts (if missing), voice (if missing) + speech check, timeline + subtitles, events, picture, mix, master, readcheck, poster, styleframe
#   VOICE=1 sh demo/build.sh    regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE, VCSL and Karoryfer sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; … vcsl; … karoryfer
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/pop-art/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/pop-art
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=pop-art
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/fonts" "$HERE/stills"

# fonts (gitignored): Anton and Archivo Black from github.com/google/fonts (OFL); Noto Sans SC Black subset to the characters used
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/anton_Anton-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/anton_Anton-Regular.ttf" "$GF/anton/Anton-Regular.ttf"
[ -f "$HERE/fonts/archivoblack_ArchivoBlack-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/archivoblack_ArchivoBlack-Regular.ttf" "$GF/archivoblack/ArchivoBlack-Regular.ttf"
[ -f "$HERE/fonts/NotoSansSC-Black-subset.ttf" ] || "$PY" "$HERE/tools/font_subset.py"

# voice: Kokoro am_michael, one clip per phrase; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/dur.json" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en

# timeline (line starts, cues, .srt), events, picture, mix, master
"$PY" "$HERE/timeline.py" "$FILM/$NAME.srt"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1

# checks, poster and the gallery style frame (42.4 s: the colour wave, without the subtitle slip)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
node core/render/still.mjs "$HERE" 42.4 --q nosubs=1 --out "$HERE/out/frame" --prefix f_
ffmpeg -v error -y -i "$HERE/out/frame/f_42.4.jpg" -q:v 5 "$FILM/poster.jpg"
ffmpeg -v error -y -i "$HERE/out/frame/f_42.4.jpg" -q:v 5 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
