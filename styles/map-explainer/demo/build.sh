#!/bin/sh
# One command: Strait of Hormuz 霍尔木兹海峡 (3D Map Explainer demo)
#   sh demo/build.sh            data and fonts if missing, voice if missing + speech check, cues, events, picture, mix, master,
#                               subtitles, readcheck, poster and the gallery style frame
#   FETCH=1 sh demo/build.sh    re-download every map tile and rebuild the terrain assets first (~5 min, ~60 MB)
#   VOICE=1 sh demo/build.sh    regenerate the narration before the check
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs the voice tier (Kokoro model, faster-whisper) and the VSCO 2 CE + VCSL sample libraries:
#   sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
# In a fresh clone the map data (raw/, assets/*.bin|jpg|png) and the fonts are not in git: the first run downloads them.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/map-explainer/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/map-explainer
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=map-explainer
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/stills" "$HERE/raw" "$HERE/assets"

# map data (public tiles, see CREDITS): the strait at z10/z11, the region Red Sea → Gulf of Oman at z8/z9, the globe at z4,
# then the baked low-sun shadows. Every download is logged in raw/manifest.jsonl.
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/height.bin" ]; then
  "$PY" -I "$HERE/tools/fetch.py" "$HERE"; "$PY" -I "$HERE/tools/prep.py" "$HERE"
fi
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/wide_height.bin" ]; then
  "$PY" -I "$HERE/tools/fetch_wide.py" "$HERE"; "$PY" -I "$HERE/tools/prep_wide.py" "$HERE"
fi
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/world.jpg" ]; then "$PY" -I "$HERE/tools/fetch_world.py" "$HERE"; fi
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/wide_shadow.png" ]; then "$PY" -I "$HERE/tools/bake.py" "$HERE"; fi

# fonts (gitignored): Barlow Condensed from github.com/google/fonts, Noto Sans SC subsets from the Google Fonts CSS API
if [ ! -f "$HERE/fonts/BarlowCondensed-SemiBold.ttf" ] || [ ! -f "$HERE/fonts/NotoSansSC-500-sub.woff2" ]; then
  "$PY" -I "$HERE/tools/fonts.py" "$HERE"
fi

# narration: Kokoro bm_george, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/v10.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en
python3 "$HERE/tools/cues.py"                                                     # subtitle timing → voice/cues.json

# events, picture, narration + score + foley, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"                                                              # → out/mix-full.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix-full.wav" "$FILM/$NAME.mp4" 24 1
"$PY" core/render/srt.py "$HERE/voice/cues.json" "$FILM/$NAME.srt"

# checks, poster and the gallery style frame (the strait: the narrowest line and both lanes lit)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
# rendered from the page without the subtitle shelf (?nosubs=1), so the poster and the gallery card carry no subtitles
node core/render/still.mjs "$HERE" 13.8 --q nosubs=1 --out "$HERE/out/poster" > /dev/null
ffmpeg -v error -y -i "$HERE/out/poster/t_13.8.jpg" -q:v 4 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
