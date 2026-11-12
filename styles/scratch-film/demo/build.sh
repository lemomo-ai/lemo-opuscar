#!/bin/sh
# One command: 《夜里往上游》 The Night Climb (Scratch Film demo)
#   sh demo/build.sh           voice (if missing) + speech check, timeline, fonts (if missing), events, picture, mix, master, subtitles, readcheck, poster
#   VOICE=1 sh demo/build.sh   regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries: sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; … vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/scratch-film/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/scratch-film
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=scratch-film
WORKERS=${WORKERS:-2}
FRAME=39.2                                            # gallery frame: the school under the moon, between two subtitle cues
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/stills"

# voice: Kokoro bf_emma, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/dur.json" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/out/voice" --lang en
"$PY" "$HERE/timeline.py"                             # line starts and subtitle cues → timeline.json, out/subs.srt

# fonts (gitignored): downloaded from github.com/google/fonts (OFL) and subset to the characters used
[ -f "$HERE/fonts/marker.woff2" ] && [ -f "$HERE/fonts/mono.woff2" ] && [ -f "$HERE/fonts/jost.woff2" ] || "$PY" "$HERE/make_fonts.py"

# events, picture (30 fps, 15 drawings a second), score + foley + voice, master with a little grain, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1
cp "$HERE/out/subs.srt" "$FILM/$NAME.srt"

# checks, poster and the gallery style frame (no subtitle, no sign-off on screen at FRAME)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
