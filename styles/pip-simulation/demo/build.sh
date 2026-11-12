#!/bin/sh
# One command: Is faster better? 跑得快，就更好吗？ (Blob Simulation demo)
#   sh styles/pip-simulation/demo/build.sh           fonts (if missing), voice (if missing) + speech check, events, picture, mix, master, subtitles, readcheck, poster
#   VOICE=1 sh styles/pip-simulation/demo/build.sh   regenerate the voice before the check
#   WORKERS=3 sh …/build.sh                          more render workers (default 2)
# Needs the voice tier (Kokoro model) and the FreePats, VSCO 2 CE and VCSL sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments freepats; … vsco2ce; … vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/pip-simulation/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/pip-simulation
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=pip-simulation
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): Inter and the Noto Sans SC variable font from github.com/google/fonts (OFL); Fredoka from core/fonts; SC subset
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/Inter-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Inter-VF.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
if [ ! -f "$HERE/fonts/NotoSansSC-sub.woff2" ] || [ ! -f "$HERE/fonts/fredoka-latin.woff2" ]; then
  [ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
  "$PY" "$HERE/make_fonts.py"
fi

# voice: Kokoro bm_george, one clip per sentence (voice/lines.json); every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/voice/v10.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en
rm -f "$HERE/voice/words.json"   # word timestamps from the check; not used by the film

# events, picture, narration + score + foley mix, master, subtitles
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py" "$HERE/out/events.json" "$HERE/out/mix.wav"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
node "$HERE/subs.mjs" "$HERE/out/subs.json"
"$PY" core/render/srt.py "$HERE/out/subs.json" "$FILM/$NAME.srt"

# reading-time check (report only; see DEMO.md), poster and the gallery style frame (the finished histogram, before the end line)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" 2>&1 && echo "readcheck ok" || { echo "readcheck: see $HERE/out/readcheck.txt"; tail -12 "$HERE/out/readcheck.txt"; }
ffmpeg -v error -y -ss 44.7 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 44.7 -i "$FILM/$NAME.mp4" -frames:v 1 -vf scale=1280:-1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
