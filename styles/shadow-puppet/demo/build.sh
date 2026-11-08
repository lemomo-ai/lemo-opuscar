#!/bin/sh
# Rebuild the finished film from scratch: sh styles/shadow-puppet/demo/build.sh (can be run from any directory)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/shadow-puppet/demo; O=styles/shadow-puppet
$PY core/tts/tts.py $D/lines.json $D/voices                    # 1. Kokoro voice-over (am_michael)
$PY core/tts/asr_check.py $D/lines.json $D/voices              # 2. whisper line-by-line check (the asr field handles the homophones ten/10, suns/sons, Hou/Hu)
node core/render/events.mjs $D                                 # 3. timeline → events.json (narration / foley / music hit points)
$PY $D/music/score.py                                          # 4. original score (luogu jing (锣鼓经, opera gong-and-drum patterns) + banhu + suona, core/audio/sampler) → music/score.wav
$PY $D/mix.py                                                  # 5. foley + narration + music ducking → mix.wav
$PY $D/tools/cues.py && $PY core/render/srt.py $D/out/cues.json $O/shadow-puppet.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4             # 7. frame-by-frame render (~80 s)
sh $D/tools/mux.sh $D/out/video24.mp4 $D/mix.wav $O/shadow-puppet.mp4 24 2              # 8. mux: two-pass loudnorm −14 LUFS, grain 2, CRF 22
# 9. poster + style frame (screenshots occasionally time out when 14 agents share the GPU, so retry 3 times)
still() { for i in 1 2 3; do node core/render/still.mjs "$@" && return 0; echo "retry $i"; done; return 1; }
still $D 1 --q 'test=poster' --prefix poster_ --out $D/out/st && cp $D/out/st/poster_1.jpg $O/poster.jpg
still $D 32.6 --q 'nosub=1' --prefix sf_ --out $D/out/st && cp $D/out/st/sf_32.6.jpg $D/stills/styleframe.jpg
