#!/bin/sh
# One command: 《被炸平的城市怎样长回来》 How a Flattened City Grew Back (Projection on White Model demo)
#   sh demo/build.sh            data (if missing) -> voice -> checks -> events -> picture -> score + mix -> master -> .srt -> checks -> poster
#   FETCH=1 sh demo/build.sh    first re-download 3DBAG LOD1.3 + BGT water and bridge decks (~55 MB into assets/raw/)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # films/<slug>/demo or styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=white-model
BBOX=91500,435200,94300,438000                       # RD New (EPSG:28992), wider than the model crop
cd "$LIB"

if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/raw/l13_0.json" ]; then
  mkdir -p "$HERE/assets/raw"
  curl -sf -m 600 -o "$HERE/assets/raw/l13_0.json" "https://data.3dbag.nl/api/BAG3D/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=BAG3D:lod13&count=20000&startIndex=0&outputFormat=application/json&bbox=$BBOX,EPSG:28992&sortBy=fid"
  for c in waterdeel overbruggingsdeel; do
    curl -sf -m 300 -o "$HERE/assets/raw/$c.json" "https://api.pdok.nl/lv/bgt/ogc/v1/collections/$c/items?bbox=$BBOX&bbox-crs=http://www.opengis.net/def/crs/EPSG/0/28992&crs=http://www.opengis.net/def/crs/EPSG/0/28992&limit=1000&f=json"
  done
fi
mkdir -p "$HERE/data" "$HERE/out"
"$PY" -I "$HERE/tools/prep.py" "$HERE" > "$HERE/out/prep.log"      # model.json, water.png, zshadow.png, stats.json (every number on screen)
# fonts (gitignored .woff2, subset from Google Fonts): fetch when any is missing
for f in NotoSansSC-300 NotoSansSC-500 InterTight-200 InterTight-400 IBMPlexMono-400; do
  [ -f "$HERE/fonts/$f.woff2" ] || { "$PY" -I "$HERE/tools/fonts.py" "$HERE"; break; }
done

# voice: Kokoro (bm_george), speech-to-text check with the small English model, cues from the real durations
node "$HERE/tools/export.mjs" "$HERE" > /dev/null || true
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE"                # cues.json; fails on overlap

# picture, events, score + mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
"$PY" -I "$HERE/tools/cuecheck.py" "$HERE" > "$HERE/out/cuecheck.txt" || { cat "$HERE/out/cuecheck.txt"; exit 1; }; tail -1 "$HERE/out/cuecheck.txt"
node "$HERE/tools/subcheck.mjs" "$HERE" > "$HERE/out/subcheck.txt" || { cat "$HERE/out/subcheck.txt"; exit 1; }; tail -1 "$HERE/out/subcheck.txt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" -I "$HERE/tools/motioncheck.py" "$FILM/$NAME.mp4" | tail -2
"$PY" -I "$HERE/tools/impactcheck.py" "$HERE" | tail -4

# poster (the signature shot) and the gallery style frame
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss 30.4 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
