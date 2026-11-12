#!/bin/sh
# One command: 摩羯过琼州 Typhoon Yagi over Qiongzhou (Flow-field Wind Lines demo)
#   sh demo/build.sh            data and fonts if missing, chart and island data, voice if missing + speech check, timeline,
#                               events, picture, mix, master, subtitles, readcheck, poster and the gallery style frame
#   VOICE=1 sh demo/build.sh    regenerate the narration before the check
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs the voice tier (Kokoro model, faster-whisper), the Salamander piano and the VSCO 2 CE + VCSL sample libraries:
#   sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice
#   sh tools/fetch.sh instruments salamander; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
# In a fresh clone the relief data (raw/), the coastline chart (raw/chart.json) and the fonts are not in git:
# the first run downloads them (ETOPO1 through ERDDAP ~32 MB, Natural Earth, Google Fonts) and rebuilds the chart and the inset.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/flow-field/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/flow-field
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=flow-field
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/stills"

# data: relief, the dashed line and the fonts (tools/fetch_data.py), then the chart, the best track and the islands
"$PY" -I "$HERE/tools/fetch_data.py"
[ -f "$HERE/raw/chart.json" ] || "$PY" -I "$HERE/tools/prep_dem.py"         # ETOPO1 → coastlines, contours, height grids
[ -f "$HERE/raw/inset.json" ] || "$PY" -I "$HERE/tools/prep_inset.py"     # ETOPO1 at 6′ → the 南海诸岛 inset (land mask, coastline)
python3 "$HERE/tools/make_trackjs.py"                                        # CMA best track (data/) → track.js
python3 "$HERE/tools/make_scs.py"                                            # South China Sea islands, dashed line, Diaoyu Islands → scs.js
"$PY" -I "$HERE/tools/subset.py"                                             # fonts subset to the characters printed

# narration: Kokoro bm_george, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/v09.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en
python3 "$HERE/tools/timeline.py"                    # line starts, captions, film↔chart time map → timeline.js, voice/timeline.json, ../flow-field.srt

# events, picture, wind + score + narration, master
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"                                                         # → out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1

# checks, poster and the gallery style frame (the grazing pass at Wenchang), rendered without captions (?nocap=1)
node core/render/readcheck.mjs "$HERE" --step 0.1 > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { grep -v '^OK' "$HERE/out/readcheck.txt" | tail -12; echo "readcheck: see DEMO.md for the known entries"; }
node core/render/still.mjs "$HERE" 33.6 --q nocap=1 --out "$HERE/out/poster" > /dev/null
ffmpeg -v error -y -i "$HERE/out/poster/t_33.6.jpg" -q:v 5 "$FILM/poster.jpg"
cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
