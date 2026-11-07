#!/bin/sh
# One command: 《林下的田》 The Fields Under the Forest (LiDAR Survey demo)
#   sh demo/build.sh          voice, checks, events, picture, score + mix, master, subtitles, checks, poster
#   FETCH=1 sh demo/build.sh  first re-download and rebuild the data: USGS 3DEP points (EPT, ~50 MB), NAIP 2016 photo,
#                             DTM, wall tracing, wall profile, binaries for the page (~3 min, ~350 MB in assets/raw)
# Fonts are fetched from Google Fonts by tools/fonts.py whenever they are missing (they are not in git).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # films/<slug>/demo or styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
DPY="$HERE/assets/raw/.venv/bin/python"              # data tools need laspy + lazrs + scikit-image (private venv)
NAME=lidar-survey
cd "$LIB"

# style-specific packages live in a private venv inside the project, not in $LIB/.venv
[ -x "$DPY" ] || { python3 -m venv "$HERE/assets/raw/.venv" && "$DPY" -m pip install -q laspy lazrs numpy scipy pillow scikit-image fonttools brotli; }
# data: keyed on a gitignored artefact, so a clean clone always rebuilds it
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/raw/build/points.bin" ] || [ ! -f "$HERE/assets/raw/build/naip.jpg" ]; then
  "$DPY" -I "$HERE/tools/fetch_ept.py" "$HERE/assets/raw/ept" 14 USGS_LPC_CT_Statewide_B8_2016 -72.2005,-72.1915,41.8830,41.8920
  "$DPY" -I "$HERE/tools/walls.py" "$HERE/assets/raw/ept" "$HERE/assets/raw/work"        # DTM + local relief (+ a ridge review image)
  "$DPY" -I "$HERE/tools/trace.py" "$HERE/assets/raw/work" "$HERE/data"                  # snap data/walls_traced.json -> data/walls.json
  "$DPY" -I "$HERE/tools/profile.py" "$HERE/assets/raw/ept" "$HERE/data" C 20 80         # data/profile_C.json
  "$DPY" -I "$HERE/tools/build_data.py" "$HERE/assets/raw/ept" "$HERE/assets/raw/work" "$HERE/data" "$HERE/assets/raw/build"
  "$DPY" -I "$HERE/tools/fetch_naip.py" "$HERE/assets/raw/build"
fi
"$DPY" -I "$HERE/tools/fonts.py" "$HERE"           # fetches Barlow Condensed, IBM Plex Mono, Noto Sans SC (Google Fonts, OFL) if missing; CJK subset

# voice: Kokoro (bm_george), speech-to-text check with the small English model, cues from the real durations
node "$HERE/tools/export.mjs" "$HERE" > /dev/null || true
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE"

# picture, events, score + mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 0
# a dense point cloud is all fine detail: at mux's CRF 19 the film is ~200 MB; CRF 26 looks the same on the points and is ~90 MB
ffmpeg -v error -y -i "$HERE/out/master.mp4" -map 0 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a copy -movflags +faststart "$FILM/$NAME.mp4"
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
"$PY" -I "$HERE/tools/cuecheck.py" "$HERE" > "$HERE/out/cuecheck.txt" || { cat "$HERE/out/cuecheck.txt"; exit 1; }; tail -1 "$HERE/out/cuecheck.txt"
node "$HERE/tools/subcheck.mjs" "$HERE" > "$HERE/out/subcheck.txt" || { cat "$HERE/out/subcheck.txt"; exit 1; }; tail -1 "$HERE/out/subcheck.txt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" -I "$HERE/tools/motioncheck.py" "$FILM/$NAME.mp4" | tail -2

# poster (the signature shot) and the gallery style frame
ffmpeg -v error -y -ss 15.4 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss 18.6 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
