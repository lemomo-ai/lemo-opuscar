#!/bin/sh
# One command: Catching the Moon (Radar Sweep Documentary demo)
#   sh demo/build.sh             fonts (if missing), voice (if missing) + speech check, readcheck, events, picture, mix, master, subtitles, poster, styleframe
#   VOICE=1 sh demo/build.sh     regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh   more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/dark-documentary/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/dark-documentary
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=dark-documentary
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/stills" "$HERE/vo/wav"

# fonts (local, OFL): IBM Plex Sans and JetBrains Mono from github.com/google/fonts, Noto Sans SC Light subset to the film's characters
[ -f "$HERE/fonts/IBMPlexSans.ttf" ] && [ -f "$HERE/fonts/JetBrainsMono.ttf" ] && [ -f "$HERE/fonts/NotoSansSC-Light-subset.woff2" ] || sh "$HERE/tools/fetch_fonts.sh"

# voice: Kokoro bm_lewis, one clip per sentence; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/wav/v10.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo/wav"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo/wav" --lang en

# every on-screen text stays long enough to read
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# events, picture, wind + foley + score + voice, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0
"$PY" "$HERE/tools/make_srt.py" "$FILM/$NAME.srt"

# poster and the gallery style frame (the clear night: the dish scanned out of the dark, the title, the Milky Way)
ffmpeg -v error -y -ss 8.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 8.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
