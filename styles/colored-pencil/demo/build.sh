#!/bin/sh
# One command: 《树的另一半》 The Other Half (Colored-Pencil Science Illustration demo)
#   sh styles/colored-pencil/demo/build.sh         font (if missing), voice (if missing) + speech check, events, picture, mix, master, subtitles, readcheck, poster
#   VOICE=1 sh styles/colored-pencil/demo/build.sh regenerate the voice before the check
#   WORKERS=3 sh …/build.sh                        more render workers (default 2)
# Needs the voice tier (Kokoro model) and the FreePats, VSCO 2 CE and VCSL sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments freepats; … vsco2ce; … vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/colored-pencil/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/colored-pencil
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root (its core/ tools, .venv, samples and voice model)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=colored-pencil
WORKERS=${WORKERS:-2}
export FROM=0 TO=50.8
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/fonts/src" "$HERE/stills"

# font (gitignored): LXGW WenKai Regular v1.245.1 (OFL), pinned to the version glyphs.json was made from, then the subset and the glyph skeletons for the hand lettering
[ -f "$HERE/fonts/src/LXGWWenKai-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/src/LXGWWenKai-Regular.ttf" https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.245.1/fonts/TTF/LXGWWenKai-Regular.ttf
[ -f "$HERE/fonts/LXGWWenKai-subset.ttf" ] || "$PY" "$HERE/tools/make_font.py"
[ -f "$HERE/glyphs.json" ] || "$PY" "$HERE/tools/skeleton.py"

# voice: Kokoro bf_emma, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/v9.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en

# events, picture, voice + score + foley mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" "$HERE/tools/subs.py" "$FILM/$NAME.srt"

# checks, then the poster and the gallery style frame: the same frame (the root zone, before the magnifier)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || tail -8 "$HERE/out/readcheck.txt"
"$PY" "$HERE/tools/poster.py" "$FILM/$NAME.mp4" 11.0 "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
