#!/bin/sh
# One command: 《你亮，我就亮》 Shine Back (Firefly Pointillism demo)
#   sh demo/build.sh           font (if missing), voice (if missing) + speech check, timeline + subtitles,
#                              picture (Python particle renderer, 60 fps), mix, master, readcheck, poster and gallery frame
#   VOICE=1 sh demo/build.sh   regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh more render workers (default 2)
# Needs the core tier (numpy, scipy, pillow, soundfile, soxr), the voice tier (Kokoro model + faster-whisper) and the
# VSCO 2 CE, VCSL and FreePats sample libraries: sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; … vcsl; … freepats
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/firefly-pointillism/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/firefly-pointillism
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/mux.sh" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=firefly-pointillism
export WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/stills" "$HERE/fonts"

# font (gitignored): LXGW WenKai Regular v1.245.1 (OFL), pinned so the particle text samples the same glyphs
[ -f "$HERE/fonts/LXGWWenKai-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/LXGWWenKai-Regular.ttf" \
  https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.245.1/fonts/TTF/LXGWWenKai-Regular.ttf

# voice: Kokoro af_bella, one clip per phrase; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/wav/v9_1.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo/wav"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo/wav" --lang en

# timeline (phrase starts, subtitle cues) and the .srt; picture; score + ambience + foley + voice; master
SRT_OUT="$FILM/$NAME.srt" "$PY" "$HERE/timeline.py"
"$PY" "$HERE/film.py" render 0 50.6 "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 60 0

# checks: the end-card text (subtitles are checked from the .srt); poster and gallery frame = the giant deer's touch, no text on screen
node core/render/readcheck.mjs "$HERE/readcheck" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; echo "readcheck: see DEMO.md, Build notes"; }
ffmpeg -v error -y -ss 39.8 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 39.8 -i "$FILM/$NAME.mp4" -frames:v 1 -vf scale=1280:-2 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
