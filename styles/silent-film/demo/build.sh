#!/bin/sh
# Rebuild "The Runaway Loaf" from scratch: sh styles/silent-film/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/silent-film/demo; O=styles/silent-film
node $D/tools/dump_timeline.mjs                                   # 1. tempo grid (cue sheet sections) → timeline.json
$PY $D/music/score.py                                             # 2. original silent-film piano accompaniment (upright piano + reed organ) → music/score.wav + score.json
$PY $D/tools/cuecheck.py                                          # 3. picture hit points ↔ score hit points
$PY $D/mix.py                                                     # 4. score + projector (start-up, noise floor, silent stretches, film run-out flapping at the end) → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/srt.json $O/silent-film.srt      # 5. intertitle text → .srt
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4           # 6. frame-by-frame render (about 45 s with 4 workers)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $D/out/master.mp4 24 1            # 7. mux: −14 LUFS (grain is already in the picture, so mux adds only 1)
ffmpeg -loglevel error -i $D/out/master.mp4 -c:v libx264 -preset slow -crf 25 -tune grain -c:a copy -movflags +faststart -y $O/silent-film.mp4   # 8. film-grain encode (~80 MB)
# 9. stills: poster / style frames / redraw sample
node core/render/still.mjs $D 7.4 23.2 44.9 --out $D/out/still --prefix p_
cp $D/out/still/p_7.4.jpg $O/poster.jpg; cp $D/out/still/p_23.2.jpg $D/stills/styleframe.jpg; cp $D/out/still/p_44.9.jpg $D/stills/frame_tender.jpg
node core/render/still.mjs $D 0 --q scene=frames.modelSheet --out $D/out/still --prefix ms_   # model sheet → out/still/ms_0.jpg
node core/render/still.mjs $D 0 --q scene=frames.cardSheet --out $D/out/still --prefix cs_ && cp $D/out/still/cs_0.jpg $D/stills/frame_cards.jpg
node core/render/still.mjs $D 0 --q scene=frames.redrawSample --out $D/out/still --prefix rd_ && cp $D/out/still/rd_0.jpg $D/stills/frame_redraw.jpg
