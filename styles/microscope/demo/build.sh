#!/bin/sh
# One command: 《量出来的蓝》 Measured Blue (Microscope Story demo)
#   sh demo/build.sh            fonts -> voice + speech check -> cues -> events -> picture -> score + mix -> master
#                               -> subtitles -> checks -> poster and style frame
#   FETCH=1 sh demo/build.sh    first re-download the slide (Ventana-1.bif, 227 MB, CC0), rebuild every plate
#                               and measurement (tools/plates.py, tools/nucleus.py) and re-fetch the fonts.
#                               Without FETCH, whatever is missing (slide, plates, fonts) is fetched or rebuilt.
# Needs the library's core tier and voice tier (Kokoro, faster-whisper); the slide reader gets its own .venv here.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # films/<slug>/demo or styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=microscope
VPY="$HERE/.venv/bin/python"
if [ ! -x "$VPY" ]; then python3 -m venv "$HERE/.venv"; "$HERE/.venv/bin/pip" install -q tifffile imagecodecs numpy pillow scipy; fi

RAW="$HERE/assets/raw/Ventana-1.bif"
SHA=2eb05cd8f628c36408c3fde09beeeebaaae90181c4f840d5475ec7594bdcbbb6
# keyed on gitignored artefacts: a clean clone has plates.json (tracked) but no plate images, fonts or slide
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/plates/c1.jpg" ] || [ ! -f "$HERE/assets/plates/roiB.png" ]; then
  if [ "${FETCH:-0}" = "1" ] || [ ! -f "$RAW" ]; then
    mkdir -p "$HERE/assets/raw"
    curl -L --fail -o "$RAW" https://openslide.cs.cmu.edu/download/openslide-testdata/Ventana/Ventana-1.bif
  fi
  echo "$SHA  $RAW" | shasum -a 256 -c -
  "$VPY" -I "$HERE/tools/plates.py" "$HERE"               # plates, registration, collagen counts, tissue axis
  "$VPY" -I "$HERE/tools/nucleus.py" "$HERE" 13297 9265   # the measured nucleus (level-0 px, approx. centre)
fi
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/fonts/NotoSerifSC-600.woff2" ] || [ ! -f "$HERE/fonts/BarlowCondensed-Light.ttf" ]; then
  "$VPY" -I "$HERE/tools/fonts.py" "$HERE"                # Barlow Condensed, IBM Plex Mono, Noto Sans/Serif SC subsets
fi
cd "$LIB"

# voice: Kokoro af_heart, speech-to-text check (small.en), then cues from the real durations
node "$HERE/tools/export.mjs" "$HERE" > /dev/null
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE"

# picture, events, score + mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0          # no grain: the scan carries its own texture
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
"$PY" "$HERE/tools/cuecheck.py" "$HERE" > "$HERE/out/cuecheck.txt" || { cat "$HERE/out/cuecheck.txt"; exit 1; }; tail -1 "$HERE/out/cuecheck.txt"
node "$HERE/tools/subcheck.mjs" "$HERE" > "$HERE/out/subcheck.txt" || { cat "$HERE/out/subcheck.txt"; exit 1; }; tail -1 "$HERE/out/subcheck.txt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
WHISPER_MODEL=small.en "$PY" "$HERE/tools/finalasr.py" "$FILM/$NAME.mp4" "$HERE" | grep -c '^OK' | sed 's/$/ lines heard in the final mix/'
ffmpeg -v info -i "$FILM/$NAME.mp4" -vf blackdetect=d=0.1:pix_th=0.05 -an -f null - 2>&1 | grep -c black_start | sed 's/$/ black stretches/'

# poster (the signature shot) and the gallery style frame
ffmpeg -v error -y -ss 24.6 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss 24.6 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
