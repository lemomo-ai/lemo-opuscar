#!/bin/sh
# One command: "Case File: Chubby" (Halftone Dossier demo)
#   sh styles/halftone-dossier/demo/build.sh                    rebuild the film, poster and style frame in place
#   OUT=<dir> sh styles/halftone-dossier/demo/build.sh          write the film, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/halftone-dossier/demo/build.sh   stop after the score (no frame render)
# Steps: fonts, score + SFX, picture (30 fps, the demo's own render.mjs), master, stills. No voice: the film is read, not
# spoken; halftone-dossier.srt (the on-screen captions with their English translation) is written by hand, not built here.
# Needs the core tier (node, playwright-core, a headless Chrome: PLAYWRIGHT_CHROME or CHROME_PATH if render.mjs can't find
# one), ffmpeg, and network for the five Google Fonts families (OFL, see CREDITS) when demo/fonts/ is empty.
# music.wav and out/ are rebuilt inside demo/ (gitignored) whatever OUT says.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../halftone-dossier/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../halftone-dossier
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=halftone-dossier
POSTER=7.2                                           # the mugshot against the height chart
FRAME=11.1667                                        # frame 335: the "testing gravity" numeral, cat and starburst: gallery style frame
DEST=${OUT:-$FILM}; unset OUT
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out"
cd "$LIB"

# 0. fonts (gitignored .woff2 slices from Google Fonts; fonts.css in git names them; fetch_fonts.mjs rewrites it only when the slicing changes)
[ -f "$HERE/fonts/f0.woff2" ] || (cd "$HERE" && mkdir -p fonts && node fetch_fonts.mjs)

# 1. score + sound effects + master, synthesised and seeded -> music.wav (120 BPM, one bar = 2 s)
"$PY" "$HERE/music.py" "$HERE/music.wav"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 2. picture: 900 frames at 30 fps as PNG -> out/seg_*.mp4 -> out/video_noaudio.mp4 (x264 CRF 12 master)
node "$HERE/render.mjs" video 2
# 3. master: CRF 16 + music.wav at -1.6 dB, AAC 256k/48k, no grain (the paper texture is drawn by the page)
node "$HERE/render.mjs" mux "$DEST/$NAME.mp4"

# 4. poster and gallery style frame from the page itself
node "$HERE/render.mjs" stills $POSTER $FRAME --dir "$HERE/out/still"
ffmpeg -v error -y -i "$HERE/out/still/t_$POSTER.png" -q:v 2 "$DEST/poster.jpg"
ffmpeg -v error -y -i "$HERE/out/still/t_$FRAME.png" -q:v 2 "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
