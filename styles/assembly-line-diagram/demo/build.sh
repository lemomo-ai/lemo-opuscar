#!/bin/sh
# One command: "The Disassembly Line" (Assembly-Line Diagram demo, 54.9 s, 1920x1080, 24 fps)
#   sh styles/assembly-line-diagram/demo/build.sh          fonts (if missing), voice (if missing) + speech check, timeline + subtitles, mix, picture, master, readcheck, poster
#   VOICE=1 sh .../build.sh     regenerate the voice before the check
#   WORKERS=3 sh .../build.sh   more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries: sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; ... vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/assembly-line-diagram/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/assembly-line-diagram
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=assembly-line-diagram
WORKERS=${WORKERS:-2}
FRAME=35.1                                            # gallery frame (film time): the sorting line held still, between two subtitles
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/stills"

# fonts (gitignored): Noto Sans SC, Big Shoulders Display and Archivo subsets from the Google Fonts CSS API (OFL)
[ -s "$HERE/fonts/sanssc700.woff2" ] || sh "$HERE/tools/fonts.sh"

# voice: Kokoro am_michael, one clip per line; every clip must pass the speech-to-text check (small.en)
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/dur.json" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en

# one timeline for picture, sound and subtitles, then the mix, the picture and the master
python3 "$HERE/tools/timeline.py"                     # -> demo/timeline.json + ../assembly-line-diagram.srt
"$PY" "$HERE/tools/mix.py"                            # -> demo/out/mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1

# reading-time check (report only; see DEMO.md), poster and the gallery style frame (no subtitle, no sign-off)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { grep '^BAD' "$HERE/out/readcheck.txt" || tail -5 "$HERE/out/readcheck.txt"; }
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
