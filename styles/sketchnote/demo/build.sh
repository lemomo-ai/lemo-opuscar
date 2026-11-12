#!/bin/sh
# One command: "How Bees Make Honey" (Sketchnote demo)
#   sh styles/sketchnote/demo/build.sh     fonts (if missing), voice + check, timeline + subtitles, events, picture,
#                                           pen foley + score + mix, master, reading check, style frame and poster
# Fonts and voice files are not in git; the script fetches / regenerates them.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../styles/sketchnote/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../styles/sketchnote
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=sketchnote
WORKERS=${WORKERS:-2}
cd "$LIB"

# the sample libraries the score plays, downloaded now if missing (tools/fetch.sh), not after a long render
"$PY" core/audio/sampler.py --need "$HERE/mix.py"

# fonts (OFL, gitignored) and the glyph skeletons used to write letters stroke by stroke (glyphs.json is committed)
if [ ! -f "$HERE/fonts/Kalam-Bold.ttf" ] || [ ! -f "$HERE/fonts/PatrickHand-Regular.ttf" ] || [ ! -f "$HERE/fonts/ZCOOLKuaiLe-subset.ttf" ]; then
  sh "$HERE/tools/fonts.sh" "$HERE"
fi
[ -f "$HERE/glyphs.json" ] || "$PY" "$HERE/tools/skeleton.py"

# voice: Kokoro af_heart, one file per phrase; every phrase must pass the speech-to-text check
[ -f "$HERE/voice/out/v11_1.wav" ] || "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en

# narration starts, subtitle cues (timeline.json) and the .srt
"$PY" "$HERE/timeline.py"

# picture, events, sound, master
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1

# reading time of the words on the page (the subtitle slip is timed by the .srt)
# Notes passed by on the way are read again in the final hold; readcheck lists them, and the build goes on
if node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt"; then echo "readcheck ok"; else echo "readcheck: $(grep -c '^BAD' "$HERE/out/readcheck.txt") short holds, see demo/out/readcheck.txt"; fi

# style frame: the finished page at 47.5 s, before the footer, drawn without the subtitle slip
node core/render/still.mjs "$HERE" 47.5 --q 'nosub=1' --out "$HERE/out/poster" > /dev/null
mkdir -p "$HERE/stills"
ffmpeg -v error -y -i "$HERE/out/poster/t_47.5.jpg" -q:v 3 "$HERE/stills/styleframe.jpg"
# poster: the film's frame at style.json frame_sec, saved by Pillow (quality 90, optimized). With the default WORKERS=2
# it matches the committed poster.jpg byte for byte; another WORKERS value encodes the film, and so the poster, slightly differently
FRAME_SEC=48.7                                       # style.json frame_sec
ffmpeg -v error -y -ss "$FRAME_SEC" -i "$FILM/$NAME.mp4" -frames:v 1 "$HERE/out/poster/frame.png"
"$PY" -c 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "JPEG", quality=90, optimize=True)' \
  "$HERE/out/poster/frame.png" "$FILM/poster.jpg"
echo "done: $FILM/$NAME.mp4"
