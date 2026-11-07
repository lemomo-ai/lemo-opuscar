#!/bin/sh
# One command: 《地图上还写着海》 The Map Still Says Sea (Satellite Briefing demo)
#   sh demo/build.sh            voice, events, picture, score + mix, master, subtitles, checks, poster
#   FETCH=1 sh demo/build.sh    first re-download and rebuild the imagery (Landsat via Planetary Computer,
#                               Blue Marble via NASA GIBS, Natural Earth): ~25 min, ~3.5 GB in assets/raw
# In a fresh clone (plates, raw scenes and fonts are not in git) the imagery and fonts are fetched automatically.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=satellite-briefing
cd "$LIB"

# the test keys on gitignored artefacts: a clean clone has the tracked vectors.json/plates.json but no plates
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/plates/r2025.jpg" ] || [ ! -f "$HERE/assets/plates/mapfield.png" ]; then
  mkdir -p "$HERE/assets/raw/ne"
  for f in ne_10m_lakes_historic ne_10m_rivers_lake_centerlines; do
    curl -sL -o "$HERE/assets/raw/ne/$f.geojson" "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/$f.geojson"
  done
  "$PY" -I "$HERE/tools/fetch_gibs.py" "$HERE"
  for p in r2025 r1977 r1989 r2000 r2009 r2014 la2025 mu2025 ko2001 ko2009 ko2025; do
    "$PY" -I "$HERE/tools/fetch_landsat.py" "$HERE" $p
  done
  "$PY" -I "$HERE/tools/plates.py" "$HERE"
  "$PY" -I "$HERE/tools/bmng.py" "$HERE"
  "$PY" -I "$HERE/tools/vectors.py" "$HERE"
  "$PY" -I "$HERE/tools/mapfield.py" "$HERE"     # the printed map (distance field, relief) + rivers
  "$PY" -I "$HERE/tools/growth.py" "$HERE"       # North Aral: 2001 -> 2009 growth order
fi
# fonts (gitignored): Barlow Condensed + IBM Plex Mono from github.com/google/fonts, Noto SC subsets from the CSS2 API
if [ ! -f "$HERE/fonts/BarlowCondensed-Light.ttf" ] || [ ! -f "$HERE/fonts/IBMPlexMono-Medium.ttf" ] || [ ! -f "$HERE/fonts/NotoSerifSC-600.woff2" ]; then
  "$PY" -I "$HERE/tools/fonts.py" "$HERE"
fi

# voice: Kokoro (bf_emma), trim one over-aspirated stop, speech-to-text check with the small English model
node "$HERE/tools/export.mjs" "$HERE" > /dev/null || true
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
"$PY" -I "$HERE/tools/voicefix.py" "$HERE"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE"                # cues.json from the real durations; fails on overlap

# picture, events, score + mix, master
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
"$PY" -I "$HERE/tools/cuecheck.py" "$HERE"
node "$HERE/tools/subcheck.mjs" "$HERE"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" -I "$HERE/tools/motioncheck.py" "$FILM/$NAME.mp4" | tail -2
"$PY" -I "$HERE/tools/impactcheck.py" "$HERE" | head -4

# poster (the signature shot) and the gallery style frame
ffmpeg -v error -y -ss 13.61 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss 13.61 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
