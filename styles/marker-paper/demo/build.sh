#!/bin/sh
# One command: «How Far Can You See?» (Marker on Paper demo)
#   sh styles/marker-paper/demo/build.sh                fonts and glyph skeletons (if missing), voice (if missing), events,
#                                                       picture, sound, master, subtitles, poster and gallery still
#   sh styles/marker-paper/demo/build.sh 0 12 out/cut.mp4   any stretch of the film's timeline (no subtitles file, no poster)
# Optional: WORKERS (render workers, default 2), PY (python with the library's requirements), PYLIB (library whose core/ the Python steps import; default LIB).
# Packs a fresh clone needs (fetched below when missing): sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; ... vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../marker-paper/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../marker-paper
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-$LIB/.venv/bin/python}
PYLIB=${PYLIB:-$LIB}
NAME=marker-paper
FRAME_SEC=6.9                                         # style.json frame_sec
A=${1:-0}; B=${2:-52.0}; OUT=${3:-$FILM/$NAME.mp4}
case "$OUT" in /*) ;; *) OUT="$HERE/$OUT" ;; esac
Q="t0=$A&t1=$B"
WK=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# fonts (not in git; OFL 1.1, from github.com/google/fonts): Kalam Bold/Regular, LXGW Marker Gothic → film subset
G=https://github.com/google/fonts/raw/main/ofl
for f in kalam/Kalam-Bold.ttf kalam/Kalam-Regular.ttf lxgwmarkergothic/LXGWMarkerGothic-Regular.ttf; do
  [ -f "$HERE/fonts/src/$(basename $f)" ] || curl -sfL -o "$HERE/fonts/src/$(basename $f)" "$G/$f"
done
cp -n "$HERE/fonts/src/Kalam-Bold.ttf" "$HERE/fonts/src/Kalam-Regular.ttf" "$HERE/fonts/" 2>/dev/null || true
[ -f "$HERE/fonts/LXGWMarkerGothic-film.ttf" ] || "$PY" "$HERE/tools/subset_film.py"     # every Chinese character on the sheets and in the subtitles
[ -f "$HERE/glyphs.json" ] || "$PY" "$HERE/tools/skeleton.py"                            # glyph centre lines for the handwriting (~45 s)
[ -f "$PYLIB/core/tts/kokoro-v1.0.onnx" ] && [ -f "$PYLIB/core/tts/voices-v1.0.bin" ] || (cd "$PYLIB" && sh tools/fetch.sh voice); for l in vsco2ce vcsl; do [ -d "$PYLIB/core/audio/instruments/$l" ] || (cd "$PYLIB" && sh tools/fetch.sh instruments $l); done
# English narration: Kokoro bm_george, then a speech-to-text check of every line
if [ ! -f "$HERE/vo/v01.wav" ]; then
  "$PY" "$PYLIB/core/tts/tts.py" "$HERE/vo/lines.json" "$HERE/vo"
  "$PY" "$PYLIB/core/tts/asr_check.py" "$HERE/vo/lines.json" "$HERE/vo" --lang en
fi

node core/render/events.mjs "$HERE" --q "$Q" --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --q "$Q" --fps 24 --workers "$WK" --out "$HERE/out/video.mp4"
LIB="$PYLIB" "$PY" "$HERE/mix.py" "$A" "$B"                                          # voice + marker foley + paper + score
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$OUT" 24 0           # −14 LUFS, true peak −1.2 dB
if [ "$A" = 0 ] && [ "$B" = 52.0 ]; then
  node "$HERE/tools/srt.mjs" && "$PY" core/render/srt.py "$HERE/out/cues.json" "$FILM/$NAME.srt"
  node core/render/still.mjs "$HERE" "$FRAME_SEC" --q nosubs=1 --out "$HERE/out/poster" > /dev/null
  cp "$HERE/out/poster/t_$FRAME_SEC.jpg" "$FILM/poster.jpg"
  cp "$HERE/out/poster/t_$FRAME_SEC.jpg" "$HERE/stills/styleframe.jpg"
fi
