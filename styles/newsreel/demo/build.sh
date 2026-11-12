#!/bin/sh
# One-command rebuild of "Knock-Knee Alert" (1920s Newsreel library demo).
#   sh <demo>/build.sh             # full rebuild (downloads ~500 MB of archive sources on the first run)
#   VOICE=1 sh <demo>/build.sh     # also regenerate the announcer (Kokoro)
# Needs the library set up with: setup.sh deps voice music  (playwright, ffmpeg, Kokoro, Whisper, samples)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
[ -f "$LIB/core/render/video.mjs" ] || LIB=$(cd "$HERE/../.." && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
export LIB
PY="$LIB/.venv/bin/python"
OUTDIR=$(cd "$HERE/.." && pwd)          # newsreel.mp4 / .srt / poster.jpg sit next to demo/
cd "$LIB"
"$PY" -c 'import numba' 2>/dev/null || { echo "newsreel: the demo needs the music tier (numba, for core/audio/pluck.py), which isn't installed. Run: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice music" >&2; exit 1; }

# 0. sources and fonts (skips what is already there)
"$PY" "$HERE/tools/fetch_sources.py"

# 1. the clock, then raw/ -> assets/: shared grade, crops, archive-film upscale, map, record excerpt
python3 "$HERE/tools/timeline.py"
"$PY" "$HERE/tools/prep.py"

# 2. announcer (voice/out/ is kept unless VOICE=1) + speech-to-text check on the clean lines
if [ -n "$VOICE" ] || [ ! -f "$HERE/voice/out/dur.json" ]; then
  "$PY" "$HERE/tools/voice.py" "$HERE/voice/lines.json" "$HERE/voice/out"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en

# 3. checks on the page: reading time of every caption, one line per language for every subtitle
node core/render/readcheck.mjs "$HERE"
node "$HERE/tools/subcheck.mjs" "$HERE"

# 4. picture
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"

# 5. score + record + foley + announcer, subtitles, master (-14 LUFS, film grain 7)
"$PY" "$HERE/audio/mix.py"
python3 "$HERE/tools/cues.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$OUTDIR/newsreel.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$OUTDIR/newsreel.mp4" 24 7

# 6. speech check on the finished film, poster, style frame, phone copy
"$PY" "$HERE/tools/final_asr.py" "$OUTDIR/newsreel.mp4"
node core/render/still.mjs "$HERE" 30.2 --q nosub=1 --prefix poster_ --out "$HERE/out" >/dev/null
cp "$HERE/out/poster_30.2.jpg" "$OUTDIR/poster.jpg"; mkdir -p "$HERE/stills"; cp "$OUTDIR/poster.jpg" "$HERE/stills/styleframe.jpg"
ffmpeg -v error -y -i "$OUTDIR/newsreel.mp4" -vf scale=1280:-2 -c:v libx264 -crf 24 -preset slow -c:a aac -b:a 128k -movflags +faststart "$OUTDIR/newsreel-small.mp4"
echo "done: $OUTDIR/newsreel.mp4"
