#!/bin/sh
# One command: 《月亮的传真》 The Moon's Fax (1-bit Dither demo)
#   sh demo/build.sh             fonts (if missing), events, lossless picture, mix, one H.264 encode, mux, readcheck, poster
#   WORKERS=3 sh demo/build.sh   more render workers (default 2)
# Needs the VSCO 2 CE + VCSL sample libraries: sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
#
# Why not core/render/video.mjs + mux.sh: JPEG q95 -> x264 crf 14 -> x264 crf 19 is three lossy generations, and on a
# 1-bit picture each one smears dot edges into grey, worst on fast moves. Here the frames go PNG -> FFV1 lossless master
# (demo/out/master.mkv, local only) -> ONE H.264 encode tuned for 1-bit pictures; the audio is loudness-normalised the
# way mux.sh does it (two-pass loudnorm to -14 LUFS / -1.2 dBTP) and muxed with the video stream copied.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/one-bit-dither/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/one-bit-dither
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/page.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=one-bit-dither
WORKERS=${WORKERS:-2}
OUT="$HERE/out"
cd "$LIB"
mkdir -p "$OUT" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): source fonts (OFL / Apache 2.0, see CREDITS), then subsets of the characters the .js files use
GF=https://github.com/google/fonts/raw/main
get() { [ -f "$HERE/fonts/src/$1" ] || curl -sfL -o "$HERE/fonts/src/$1" "$2"; }
get NotoSerifSC-VF.ttf "$GF/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
get NotoSansSC-VF.ttf "$GF/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
get Anton-Regular.ttf "$GF/ofl/anton/Anton-Regular.ttf"
get ArchitectsDaughter-Regular.ttf "$GF/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf"
get Newsreader-VF.ttf "$GF/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf"
get SpecialElite-Regular.ttf "$GF/apache/specialelite/SpecialElite-Regular.ttf"
get LXGWWenKai-Regular.ttf https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf
for f in serifsc sanssc handsc handen typeen newsen antonen; do
  [ -f "$HERE/fonts/$f.woff2" ] || { "$PY" "$HERE/tools/subset.py"; break; }
done

# events (cut, sync, row, stamp times for the sound), lossless picture, mix
node core/render/events.mjs "$HERE"
node "$HERE/tools/render.mjs" "$HERE" --fps 30 --workers "$WORKERS" --out "$OUT/master.mkv"
"$PY" "$HERE/audio.py"

# ONE lossy encode. H.264 High 4:2:0 (every internal pixel is an aligned 2x2 block, so chroma subsampling loses nothing),
# BT.709 tagged; crf 14 + tune animation keeps every dot edge on the fastest moves
ffmpeg -y -loglevel error -i "$OUT/master.mkv" -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 14 -tune animation -profile:v high \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv "$OUT/video.mp4"
M=$(ffmpeg -hide_banner -nostats -i "$OUT/mix.wav" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
AF="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000"
ffmpeg -y -loglevel error -i "$OUT/video.mp4" -i "$OUT/mix.wav" -map 0:v -map 1:a -c:v copy -af "$AF" -c:a aac -b:a 256k \
  -movflags +faststart -shortest "$FILM/$NAME.mp4"
ffmpeg -hide_banner -nostats -i "$FILM/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3

# checks, poster and the gallery style frame (the Moon, the station seen across the long shadows; no text in frame)
node core/render/readcheck.mjs "$HERE" > "$OUT/readcheck.txt" && echo "readcheck ok" || { tail -20 "$OUT/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 25.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 25.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
# the lossless master and the silent video are about 1 GB and only feed the encode above: remove them once the film is out
[ -s "$FILM/$NAME.mp4" ] && rm -f "$OUT/master.mkv" "$OUT/video.mp4"
echo "done: $FILM/$NAME.mp4"
