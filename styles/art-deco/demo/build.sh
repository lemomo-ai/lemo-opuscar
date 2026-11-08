#!/bin/sh
# Rebuild "Midnight at the Starlight Hotel" from scratch: sh styles/art-deco/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/art-deco/demo; O=styles/art-deco
node $D/tools/dump_timeline.mjs                                   # 1. tempo grid (116 → 138 → 116) → timeline.json (shared by score / mix / self-checks)
$PY core/tts/tts.py $D/lines.json $D/voices                       # 2. Kokoro voice-over (bm_fable announcer / am_puck bellboy)
$PY $D/tools/pitch.py $D/lines.json $D/voices                     # 3. pitch the bellboy's two lines up (sounds younger)
$PY core/tts/asr_check.py $D/lines.json $D/voices                 # 4. whisper check, line by line
$PY $D/music/score.py                                             # 5. original symphonic jazz → music/score.wav + stems + score.json
$PY $D/tools/cuecheck.py                                          # 6. self-check: score hit points ↔ picture time grid
$PY $D/mix.py                                                     # 7. announcer in five levels of space + foley + ambience bed + ducking → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/srt.json $O/art-deco.srt     # 8. subtitles
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4        # 9. frame-by-frame render (about 15 s with 4 workers)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $O/art-deco.mp4 24 3           # 10. mux: −14 LUFS, grain 3
# 11. stills: style frame / poster / model sheets
node core/render/still.mjs $D 41.9 3.6 --q nosub=1 --out $D/out/still --prefix p_
cp $D/out/still/p_41.9.jpg $D/stills/styleframe.jpg && cp $D/out/still/p_3.6.jpg $O/poster.jpg
for s in frameLobby frameRoof modelSheet kit; do node core/render/still.mjs $D 0 --q scene=frames.$s --out $D/out/still --prefix ${s}_; done
cp $D/out/still/frameLobby_0.jpg $D/stills/frame_lobby.jpg; cp $D/out/still/frameRoof_0.jpg $D/stills/frame_roof.jpg
cp $D/out/still/kit_0.jpg $D/stills/kit.jpg   # the model sheet stays in out/still/modelSheet_0.jpg
