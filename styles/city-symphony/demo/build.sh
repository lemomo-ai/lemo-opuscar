#!/bin/sh
# City Symphony — "One Day in New York": one-command build.
# sources (fetch what is missing) → clips (retime / frame-blend / ramps) → score → picture → subtitles → master → poster, stills, phone cut.
# From a clean clone the first run downloads the footage listed in SOURCES.jsonl (≈ 1 GB, Commons / LOC / NASA / Internet Archive)
# and two OFL fonts (tools/fetch_sources.py), and the vsco2ce + vcsl sample packs (library tools/fetch.sh).
# Needs: the library venv (numpy, scipy, Pillow, soundfile, soxr), ffmpeg, node (readcheck).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}          # <repo>/films/<name>/demo or <repo>/styles/<slug>/demo
[ -f "$LIB/core/render/mux.sh" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
OUT="$HERE/.."
SLUG=city-symphony
cd "$HERE"
mkdir -p raw fonts work/clips out audio stills
python3 tools/fetch_sources.py
for l in vsco2ce vcsl; do [ -d "$LIB/core/audio/instruments/$l" ] || (cd "$LIB" && sh tools/fetch.sh instruments $l); done

# 1 clips: speed curve → source-time windows → frame blend (light rivers) / crossfade or motion-compensated slow motion
"$PY" tools/prep.py -j 4
# 2 score (every cut in tools/shots.py sits on a beat of tools/timeline.py)
"$PY" tools/music.py audio/music.wav
# 3 picture: grade, grid, split, crowd tracks, type, grain, 1.85:1 matte; also writes texts.json for readcheck
"$PY" tools/render.py out/picture.mp4
# 4 reading-time check of every on-screen text (index.html exposes texts.json)
node "$LIB/core/render/readcheck.mjs" "$HERE"
# 5 subtitles (on-screen text only; the film has no voice), master to -14 LUFS
"$PY" "$LIB/core/render/srt.py" cues.json "$OUT/$SLUG.srt"
sh "$LIB/core/render/mux.sh" out/picture.mp4 audio/music.wav "$OUT/$SLUG.mp4" 30 0
# 6 poster, gallery still, phone cut
ffmpeg -v error -y -ss 17.6 -i "$OUT/$SLUG.mp4" -frames:v 1 -q:v 2 "$OUT/poster.jpg"
ffmpeg -v error -y -ss 11.2 -i "$OUT/$SLUG.mp4" -frames:v 1 -q:v 2 stills/styleframe.jpg
ffmpeg -v error -y -i "$OUT/$SLUG.mp4" -vf scale=1280:-2 -c:v libx264 -crf 24 -preset medium -c:a aac -b:a 128k "$OUT/$SLUG-small.mp4"
"$PY" tools/used.py
echo "done: $OUT/$SLUG.mp4"
