#!/bin/sh
# One command: 《第十步》 Step Ten (Instruction Manual Art demo), from the one timeline in film.js
#   sh styles/instruction-manual/demo/build.sh   Inter (if missing), voice (if missing) + speech check, timeline, CJK font subset, events,
#                                               picture, mix, master, readcheck, poster, style frame, model sheet
#   VOICE=1 sh …/build.sh     regenerate the narration before the check
#   WORKERS=3 sh …/build.sh   more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/instruction-manual/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/instruction-manual
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=instruction-manual
WORKERS=${WORKERS:-2}
FPS=30
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts" "$HERE/stills"

# fonts (gitignored, OFL): Inter variable from github.com/google/fonts (Latin, under 1 MB); Noto Sans SC subset to the
# characters the film uses (TECHNIQUE.md §11), refetched after the timeline below whenever the characters change
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/Inter-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Inter-VF.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf"

# narration: Kokoro bm_george, one clip per line (vo/a.wav … vo/j.wav); every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/a.wav" ] || [ ! -f "$HERE/vo/j.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
  "$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en
fi

"$PY" "$HERE/tools/timeline.py"                       # narration placement, subtitles, ../instruction-manual.srt
sh "$HERE/tools/fonts.sh"                              # Noto Sans SC 500, subset to the subtitles and footer
node core/render/events.mjs "$HERE"                     # every sound cue the picture makes → events.json
node core/render/video.mjs "$HERE" --fps $FPS --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"                                    # score + foley + narration → out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" $FPS 1

# checks; poster and gallery style frame (step 10, the swaddle just turned yellow, between two subtitles); the people's model sheet
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; echo "readcheck: see DEMO.md, Build notes"; }
ffmpeg -v error -y -ss 41.75 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 41.75 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
node "$HERE/shot.mjs" "$HERE/out/modelsheet.png" --q f=figs
ffmpeg -v error -y -i "$HERE/out/modelsheet.png" -q:v 3 "$HERE/out/modelsheet.jpg"   # a working check for poses, not published
echo "done: $FILM/$NAME.mp4  $FILM/$NAME.srt"
