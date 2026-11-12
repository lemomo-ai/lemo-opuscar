#!/bin/sh
# One command: 《蝴蝶》 The Butterfly (Crayon World 3D demo)
#   sh styles/crayon-world/demo/build.sh     (WORKERS=2 for fewer render processes, CRF to change the delivery encode)
#                                            fonts (if missing) -> sample libraries (if missing) -> score -> picture (12 drawings a second, 24 fps)
#                                            -> master -> reading check -> poster + stills
# Fonts are not in git: tools/fonts.py subsets them from Google Fonts (OFL). Instruments are the library's CC0 sample packs.
# Needs the core and music tiers: setup.sh deps music (tools/score.py uses core/audio/pluck.py, which needs numba).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../crayon-world/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../crayon-world
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=crayon-world
FRAME=32.5                                           # over the fence into the garden, him watering the row: poster and gallery frame
cd "$LIB"
"$PY" -c 'import numba' 2>/dev/null || { echo "crayon-world: the demo needs the music tier (numba, for core/audio/pluck.py), which isn't installed. Run: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps music" >&2; exit 1; }

# fonts (gitignored .woff2): Long Cang for the Chinese line, Patrick Hand for the English one
for f in LongCang PatrickHand; do [ -f "$HERE/fonts/$f.woff2" ] || { "$PY" -I "$HERE/tools/fonts.py" "$HERE"; break; }; done
# sampled instruments (library packs, CC0): nylon guitar (freepats), clarinet (vsco2ce), recorder and glockenspiel (vcsl)
for l in freepats vcsl vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done
mkdir -p "$HERE/out" "$HERE/stills"

# score (music box, guitar, clarinet, recorder; water and birds), picture, master (-14 LUFS, no grain)
"$PY" "$HERE/tools/score.py"
node core/render/video.mjs "$HERE" --fps 24 --workers "${WORKERS:-4}" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 0
# delivery encode: every drawing is new wax and paper texture, so at mux.sh's crf 19 the film is ~500 MB.
# No added grain (the duplicate frame of each drawing then costs almost nothing) and crf 30 bring it to ~150 MB;
# the strokes, the outlines and the type keep their look, only the finest paper tooth softens a little. Audio is copied.
ffmpeg -v error -y -i "$HERE/out/master.mp4" -map 0 -c:v libx264 -preset slow -crf "${CRF:-30}" -c:a copy -movflags +faststart "$FILM/$NAME.mp4"

# the printed words are held long enough to read (window.TEXTS)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { cat "$HERE/out/readcheck.txt"; exit 1; }

# poster = gallery style frame; one still per part of the film for DEMO.md
ffmpeg -v error -y -ss $FRAME -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 6 "$FILM/poster.jpg"
ffmpeg -v error -y -i "$FILM/poster.jpg" -q:v 8 "$HERE/stills/styleframe.jpg"   # gallery card, kept under 500 KB
for s in wake:5.5 village:23.0 landed:38.0 words:60.0; do
  ffmpeg -v error -y -ss "${s#*:}" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 -vf scale=960:-1 "$HERE/stills/frame_${s%%:*}.jpg"
done
echo "done: $FILM/$NAME.mp4"
