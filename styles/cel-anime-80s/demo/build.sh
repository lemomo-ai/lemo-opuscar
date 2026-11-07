#!/bin/sh
# One command: "City Lights, 1987" (80s Cel Anime demo)
#   sh styles/cel-anime-80s/demo/build.sh                    rebuild the film, subtitles, poster and style frame in place
#   OUT=<dir> sh styles/cel-anime-80s/demo/build.sh          write the film, .srt, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/cel-anime-80s/demo/build.sh   stop after the sound and the subtitles (no frame render)
# Steps: fonts, voice + speech check, original score, picture events, mix, subtitles, picture (24 fps), master, stills.
# Needs the core, voice and music tiers (setup.sh deps voice music: score.py uses numba), curl and network for the
# three Google Fonts families (OFL, see CREDITS). Voices, score, mix.wav and out/ are rebuilt inside demo/ (gitignored).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../cel-anime-80s/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../cel-anime-80s
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=cel-anime-80s
FPS=24
POSTER=16.2                                          # side-on ride past the neon shopfronts (no subtitles)
FRAME=21.3                                           # the courier's close-up in the speed lines: gallery style frame (no subtitles)
DEST=${OUT:-$FILM}; unset OUT
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out"
cd "$LIB"

# 0. fonts (gitignored .ttf, straight from github.com/google/fonts; fonts/fonts.css is in git)
GF=https://github.com/google/fonts/raw/main/ofl
for f in delagothicone/DelaGothicOne-Regular kanit/Kanit-BlackItalic kanit/Kanit-ExtraBoldItalic kanit/Kanit-SemiBoldItalic \
         barlowsemicondensed/BarlowSemiCondensed-Medium barlowsemicondensed/BarlowSemiCondensed-SemiBold barlowsemicondensed/BarlowSemiCondensed-Bold; do
  [ -f "$HERE/fonts/${f#*/}.ttf" ] || curl -sSfL -o "$HERE/fonts/${f#*/}.ttf" "$GF/$f.ttf"
done

# 1. voice: Kokoro am_michael (base, "D" lines) and af_bella (the courier, "G" lines), every line checked by Whisper
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"

# 2. original city-pop score (116 BPM bar grid) -> music/score.wav + stems + score.json
"$PY" "$HERE/music/score.py"

# 3. picture events -> events.json, then foley + voice + score with ducking -> mix.wav
node core/render/events.mjs "$HERE"
"$PY" "$HERE/mix.py"

# 4. subtitles: tools/srt.py reads story.js + voices/dur.json and writes ../cel-anime-80s.srt next to the demo it sits in,
#    so it runs from a scratch copy under out/ and the result is moved to DEST
S="$HERE/out/srt"; rm -rf "$S"; mkdir -p "$S/tools"
cp "$HERE/tools/srt.py" "$S/tools/"; ln -s "$HERE/story.js" "$S/story.js"; ln -s "$HERE/voices" "$S/voices"
"$PY" "$S/tools/srt.py" > /dev/null && mv "$HERE/out/$NAME.srt" "$DEST/$NAME.srt" && echo "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 5. picture (characters on twos, camera and light every frame; CRT pass and burnt-in subtitles inside the page)
node core/render/video.mjs "$HERE" --fps $FPS --workers 4 --out "$HERE/out/video24.mp4"
# 6. master with the demo's own mux: two-pass loudnorm to -14 LUFS, light luma noise 2, x264 CRF 23
sh "$HERE/tools/mux.sh" "$HERE/out/video24.mp4" "$HERE/mix.wav" "$DEST/$NAME.mp4" $FPS

# 7. poster and gallery style frame, rendered without subtitles
node core/render/still.mjs "$HERE" $POSTER $FRAME --q nosub=1 --out "$HERE/out/still" --prefix p_
cp "$HERE/out/still/p_$POSTER.jpg" "$DEST/poster.jpg"
cp "$HERE/out/still/p_$FRAME.jpg" "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
