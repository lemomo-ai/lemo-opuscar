#!/bin/sh
# Rebuild "Room to Think" from scratch: sh styles/dark-keynote/demo/build.sh (runs from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/dark-keynote/demo; O=styles/dark-keynote
node $D/tools/dump_timeline.mjs                                   # 1. tempo grid + note tables of the three voices → timeline.json
$PY core/tts/tts.py $D/lines.json $D/voices                       # 2. Kokoro voice-over (af_kore)
$PY core/tts/asr_check.py $D/lines.json $D/voices                 # 3. whisper line-by-line check
$PY $D/music/score.py                                             # 4. original minimalist score (phasing marimbas) → music/score.wav + score.json
node $D/tools/export.mjs                                          # 5. picture events → events.json, subtitles → out/srt.json
$PY $D/tools/cuecheck.py                                          # 6. score ↔ picture sync self-check + one note per element
$PY $D/mix.py                                                     # 7. foley + voice + ducking → mix.wav
$PY core/render/srt.py $D/out/srt.json $O/dark-keynote.srt       # 8. subtitles
node core/render/video.mjs $D --fps 24 --workers 2 --out $D/out/video24.mp4   # 9. frame-by-frame render
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $O/dark-keynote.mp4 24 0 # 10. mux: −14 LUFS, grain 0
$PY $D/tools/final_asr.py $O/dark-keynote.mp4 || true                     # 11. whisper spot-check of the finished film + SNR in the voice band
node core/render/still.mjs $D 16.45 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_16.45.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 0 --q scene=poster --out $D/out/still --prefix po_ && cp $D/out/still/po_0.jpg $O/poster.jpg
