#!/bin/sh
# One command: 《二十一键》 21 Keys, Opened (Exploded Teardown demo)
#   sh demo/build.sh          voice → checks → events → picture → score + mix → master → .srt → checks → poster
#   FETCH=1 sh demo/build.sh  first rebuild the CAD data from foostan/crkbd (pinned commit) and the fonts
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../teardown/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../teardown
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # films/teardown/demo or styles/teardown/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=teardown
cd "$LIB"

# prep: everything below is gitignored, so a clean clone rebuilds it (FETCH=1 forces it)
#   data/case.bin (+ data/pcb.json): the CAD from foostan/crkbd at a pinned commit (needs network, npm for occt-import-js)
#   fonts: Noto Sans SC subsets, Inter, JetBrains Mono from Google Fonts
#   library packs: the studio HDRI, the Kokoro model, the sample libraries the score uses (vcsl, freepats, vsco2ce)
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/data/case.bin" ]; then sh "$HERE/tools/fetch_cad.sh"; fi
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/fonts/NotoSansSC-500.woff2" ] || [ ! -f "$HERE/fonts/Inter.ttf" ] || [ ! -f "$HERE/fonts/JetBrainsMono.ttf" ]; then
  python3 -I "$HERE/tools/fetch_fonts.py"
fi
[ -f core/assets/polyhaven/photo_studio_loft_hall_2k.hdr ] || sh tools/fetch.sh hdri
[ -f core/tts/kokoro-v1.0.onnx ] || sh tools/fetch.sh voice
for l in vcsl freepats vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# voice: Kokoro am_michael, speech-to-text check with the small English model; then cues from the real durations
node "$HERE/tools/export.mjs" "$HERE" > /dev/null || true
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE"

# picture, events, score + mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
node "$HERE/tools/subcheck.mjs" "$HERE"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" -I "$HERE/tools/motioncheck.py" "$FILM/$NAME.mp4"

# poster and gallery style frame: the signature shot (all six layers labelled), rendered without the subtitle strip
node core/render/still.mjs "$HERE" 9.75 --q nosub=1 --prefix sig_ --out "$HERE/out"
ffmpeg -v error -y -i "$HERE/out/sig_9.75.jpg" -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills" && cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
