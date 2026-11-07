#!/bin/sh
# One command: "The Lampbearer" (HD-2D demo, the tilt-shift cut)
#   sh styles/hd-2d/demo/build.sh                    rebuild the film, subtitles, poster and style frame in place
#   OUT=<dir> sh styles/hd-2d/demo/build.sh          write the film, .srt, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/hd-2d/demo/build.sh   stop after the sound and the subtitles (no frame render)
# Steps: fonts and music source, voice + speech check, score edit, mix, subtitles, picture (60 fps, ?tilt=1), master, stills.
# Needs the core and voice tiers (setup.sh deps voice), curl and network for the Google Fonts slices (OFL) and Scott Buckley's
# "Precipice" (CC BY 4.0, see CREDITS). Voices, score, mix.wav and out/ are rebuilt inside demo/ (gitignored) whatever OUT
# says; voices/dur.json, voices/words.json, music/measure.json and music/CUES.md are rewritten in place (in git).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../hd-2d/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../hd-2d
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=hd-2d
FPS=60
POSTER=16.9                                          # the harbour lamp lit
FRAME=26.2                                           # gallery style frame
DEST=${OUT:-$FILM}; unset OUT
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out" "$HERE/music/src"
cd "$LIB"

# 0. fonts (gitignored): the latin slices of Cinzel 500/700 and Cormorant Garamond italic 500, 500, 600, in that order
#    h0..h4.woff2 (fonts/fonts.css is in git); the score's source recording
for i in 0 1 2 3 4; do [ -f "$HERE/fonts/h$i.woff2" ] || MISSING=1; done
if [ -n "$MISSING" ]; then
  UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
  curl -sSf -A "$UA" 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=block' |
    awk '/\/\* latin \*\//{f=1} f&&/src:/{match($0,/https:[^)]*/); print substr($0,RSTART,RLENGTH); f=0}' |
    { i=0; while read -r u; do curl -sSfL -o "$HERE/fonts/h$i.woff2" "$u"; i=$((i+1)); done; }
  for i in 0 1 2 3 4; do [ -s "$HERE/fonts/h$i.woff2" ] || { echo "build.sh: could not download the Google Fonts slices (fonts/h$i.woff2 missing)" >&2; exit 1; }; done
fi
[ -f "$HERE/music/src/sb_precipice.mp3" ] || curl -sSfL -o "$HERE/music/src/sb_precipice.mp3" \
  https://www.scottbuckley.com.au/library/wp-content/uploads/2021/01/sb_precipice.mp3

# 1. voice: Kokoro af_heart (narrator) and bm_george (the Old Keeper), checked by Whisper.
#    n1's "asr" field holds how Whisper writes "Greywater" ("gray water"); any DIFF stops the build: listen to that line.
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"

# 2. score: "Precipice" cut and re-timed to the picture -> music/score.wav (+ measure.json, CUES.md)
(cd "$HERE/music" && "$PY" edit.py)
# 3. mix: score (ducked under voice) + per-set ambience + foley from sfx_events.json + voices at vo_times.json -> mix.wav
"$PY" "$HERE/mix.py" "$HERE/mix.wav"
# 4. subtitles from story.js and voices/dur.json
"$PY" "$HERE/tools/srt.py" "$DEST/$NAME.srt" > /dev/null && echo "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 5. picture: the tilt-shift cut (?tilt=1 is a render-time post effect in post_ts.js), 4590 frames at 60 fps
node core/render/video.mjs "$HERE" --fps $FPS --workers 2 --q tilt=1 --out "$HERE/out/video_tilt.mp4"
# 6. master: -14 LUFS, grain 0 (pixel art takes no film grain)
sh core/render/mux.sh "$HERE/out/video_tilt.mp4" "$HERE/mix.wav" "$DEST/$NAME.mp4" $FPS 0

# 7. poster and gallery style frame: frames of the finished film
ffmpeg -v error -y -ss $POSTER -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$DEST/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
