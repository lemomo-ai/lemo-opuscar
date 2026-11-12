#!/bin/sh
# One command: «Six Hands Away» (Stick-figure Explainer demo), 52 s.
#   sh styles/stick-explainer/demo/build.sh      fonts (if missing), voice (if missing) + speech check, events, picture,
#                                                score + voice mix, subtitles, master, poster, style frames
# Run from anywhere; LIB defaults to the library root three folders up.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../stick-explainer/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../stick-explainer
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=stick-explainer
WORKERS=${WORKERS:-2}
cd "$LIB"

# fonts (gitignored, OFL): Jost and Noto Sans SC from github.com/google/fonts; the Chinese face is cut to tools/zh-chars.txt
if [ ! -f "$HERE/fonts/Jost.ttf" ]; then
  curl -sfL -o "$HERE/fonts/Jost.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/Jost%5Bwght%5D.ttf"
fi
if [ ! -f "$HERE/fonts/NotoSansSC-sub.ttf" ]; then
  curl -sfL -o "$HERE/fonts/NotoSansSC-full.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
  "$LIB/.venv/bin/pyftsubset" "$HERE/fonts/NotoSansSC-full.ttf" --text-file="$HERE/tools/zh-chars.txt" --output-file="$HERE/fonts/NotoSansSC-sub.ttf"
  rm -f "$HERE/fonts/NotoSansSC-full.ttf"
fi

# voice: Kokoro af_heart (deterministic); every line must pass the speech-to-text check
NEED=""; for i in 01 02 03 04 05 06 07 08 09 10; do [ -f "$HERE/voice/v$i.wav" ] || NEED=1; done
if [ -n "$NEED" ]; then "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"; fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en

# events, picture, score + voice mix, subtitles, master
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 60 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/srt.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 60 0      # −14 LUFS, no grain (the paper stays clean)

# checks: reading time of every on-screen text
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok"

# poster (the hook chain, hands lifted) and the gallery style frame; the three style frames the docs show
ffmpeg -v error -y -ss 9.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
for f in 1 2 3; do
  node "$HERE/tools/png.mjs" f$f 0 "$HERE/out/frame_$f.png" > /dev/null
  ffmpeg -v error -y -i "$HERE/out/frame_$f.png" -q:v 2 "$HERE/stills/frame_$f.jpg"
done
echo "done: $FILM/$NAME.mp4"
