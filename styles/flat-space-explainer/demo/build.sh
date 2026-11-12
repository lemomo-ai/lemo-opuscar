#!/bin/sh
# One command: The Long Way Down 《一路往下缩》 (Scale Zoom Explainer demo)
#   sh demo/build.sh          fonts (if missing), voice (if missing) + speech check, events, picture, score + mix, master, subtitles, poster
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# LIB must hold .venv (setup.sh deps voice) and core/audio/instruments (sh tools/fetch.sh instruments vcsl vsco2ce freepats).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=flat-space-explainer
cd "$LIB"

# fonts (gitignored): Jost from github.com/google/fonts, Noto Sans SC Bold subset from the CSS2 API
[ -f "$HERE/fonts/Jost.ttf" ] && [ -f "$HERE/fonts/NotoSansSC-Bold-sub.woff2" ] || "$PY" -I "$HERE/tools/fonts.py" "$HERE"

# voice: Kokoro af_heart, one clip per line (vo/lines.json), then the speech-to-text check
[ -f "$HERE/vo/v8.wav" ] || "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en

# events (sound cues + narration times + subtitle text), picture, score + mix, master, subtitles
mkdir -p "$HERE/out"
node core/render/events.mjs "$HERE" --q "from=0&to=52" --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --q "from=0&to=52" --fps 24 --workers "${WORKERS:-2}" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py" --from 0 --to 52 --fade 0.35
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0      # −14 LUFS, no grain (flat vector style)
"$PY" core/render/srt.py "$HERE/out/cues.json" "$FILM/$NAME.srt"

# reading time of the on-screen labels (subtitles are timed by the .srt)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: some labels are short, see demo/out/readcheck.txt"

# poster and the gallery style frame: the first sight line locked on the Sun
ffmpeg -v error -y -ss 8.9 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss 8.9 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
