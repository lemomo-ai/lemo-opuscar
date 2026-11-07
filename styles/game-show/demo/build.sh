#!/bin/sh
# One command: "AI 进化节拍 · Rhythm of AI" (Game Show Flat demo)
#   sh styles/game-show/demo/build.sh                     rebuild the film and subtitles in place
#   OUT=<dir> sh styles/game-show/demo/build.sh           write the film and .srt to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/game-show/demo/build.sh  stop after the sound and the subtitles (no frame render)
# Steps: fonts, page (assemble + build), shouted calls (Kokoro) + speech check, picture events, score + mix, subtitles, picture (30 fps), master.
# Needs the core and voice tiers (setup.sh deps voice), node with playwright-core (npm install in demo/, once),
# and network for the six Google Fonts families (OFL, see CREDITS) when demo/fonts/ is empty.
# The poster and the gallery style frame come from the 2023 scene (unchanged), so they are not rebuilt here.
# Voices, music.wav and out/ are rebuilt inside demo/ (gitignored) whatever OUT says.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../game-show/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../game-show
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB                                           # make_voices.py and finish.sh read it too
[ -f "$LIB/core/tts/tts.py" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=game-show
DEST=${OUT:-$FILM}; unset OUT
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
mkdir -p "$DEST" "$HERE/out"
cd "$HERE"

# 0. fonts (gitignored .woff2 slices from Google Fonts; fetch_fonts.mjs also rewrites fonts.css with the same names)
[ -f "$HERE/fonts/f0.woff2" ] || (cd "$HERE" && mkdir -p fonts && node fetch_fonts.mjs)

# 1. the page: main.js from main_v1.js (shared helpers, characters) + main_b.js (scenes), then index.html
python3 assemble.py && python3 build.py

# 2. shouted calls: Kokoro voices from voices/shouts.json, every call checked by Whisper (small.en: base.en mishears one-word shouts;
#    an "asr" field holds how Whisper writes a call, e.g. GPT-1 for "G. P. T. one!")
"$PY" make_voices.py
T=$(mktemp -d)
python3 -c 'import json, sys; json.dump([{k: l[k] for k in ("id", "text", "asr") if k in l} for l in json.load(open(sys.argv[1]))], open(sys.argv[2], "w"))' voices/shouts.json "$T/lines.json"
cp voices/*.wav "$T/"
WHISPER_MODEL=${WHISPER_MODEL:-small.en} "$PY" "$LIB/core/tts/asr_check.py" "$T/lines.json" "$T" --lang en
rm -rf "$T"

# 3. picture events -> events.json; score, calls and hits -> music.wav; calls -> subtitles
node render.mjs events
"$PY" music.py
python3 make_srt.py "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 4. picture (30 fps, 6 headless pages) and master
node render.mjs video 6
sh finish.sh "$DEST/$NAME.mp4"
echo "done: $DEST/$NAME.mp4"
