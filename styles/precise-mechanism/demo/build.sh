#!/bin/sh
# One command: 《三套系统走时》 Three Systems Keep the Time (Color-Coded Mechanism demo, 52 s)
#   sh styles/precise-mechanism/demo/build.sh        fonts (if missing) → voice + check → events → picture → sound → master → subtitles → poster
#   WORKERS=3 sh …/build.sh                           more render workers (default 2)
#   LIB=<a library clone with .venv, the Kokoro model and the sample libraries> sh …/build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../precise-mechanism/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../precise-mechanism
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=precise-mechanism
WK=${WORKERS:-2}
cd "$LIB"

# fonts (gitignored, all SIL OFL 1.1, from github.com/google/fonts)
F="$HERE/fonts"; G=https://github.com/google/fonts/raw/main/ofl
[ -f "$F/Inter-VF.ttf" ] || curl -sfL -o "$F/Inter-VF.ttf" "$G/inter/Inter%5Bopsz,wght%5D.ttf"
[ -f "$F/NotoSansSC-VF.ttf" ] || curl -sfL -o "$F/NotoSansSC-VF.ttf" "$G/notosanssc/NotoSansSC%5Bwght%5D.ttf"
[ -f "$F/IBMPlexMono-Medium.ttf" ] || curl -sfL -o "$F/IBMPlexMono-Medium.ttf" "$G/ibmplexmono/IBMPlexMono-Medium.ttf"

# narration: Kokoro bm_george (speed 0.88), every line checked by speech-to-text
if [ ! -f "$HERE/voice/v11.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"
  "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en
fi

node core/render/events.mjs "$HERE"                                                   # ticks, cuts, landings, subtitles → events.json
node core/render/video.mjs "$HERE" --fps 24 --workers "$WK" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"                                                                  # voice + foley + score → out/mix-full.wav, out/cues.json
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix-full.wav" "$FILM/$NAME.mp4" 24 0
"$PY" core/render/srt.py "$HERE/out/cues.json" "$FILM/$NAME.srt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok"

# poster and the gallery style frame: the 4,800× comparison, rendered from the page without subtitles (?nosubs)
mkdir -p "$HERE/stills"
node core/render/still.mjs "$HERE" 21.0 --q nosubs --prefix poster_ --out "$HERE/out"
cp "$HERE/out/poster_21.0.jpg" "$FILM/poster.jpg"
cp "$HERE/out/poster_21.0.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
