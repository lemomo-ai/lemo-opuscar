#!/bin/sh
# Rebuild "Night Shift Orientation" from scratch: sh styles/backrooms/demo/build.sh (run from the repo root)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
D=styles/backrooms/demo; PY=.venv/bin/python
$PY core/tts/tts.py $D/lines.json $D/voices                 # 1. voice-over (Kokoro: af_bella for the PA / am_michael for the camera operator)
$PY core/tts/asr_check.py $D/lines.json $D/voices            # 2. whisper checks the raw voices + word-level timestamps (used to split subtitles)
$PY $D/music/muzak.py                                        # 3. original in-scene elevator music (sampler, CC0 samples)
node core/render/events.mjs $D                               # 4. page timeline → events.json (dialogue/foley/subtitles share one source)
$PY $D/mix.py                                                # 5. foley + PA speaker + quiet speech + hum + tape speed → mix.wav
$PY core/tts/asr_check.py $D/lines.json $D/voices_fx         # 6. whisper re-checks the processed voices (p2 "Rule two/2" is just a difference in how the number is written; acceptable)
node core/render/video.mjs $D --fps 24 --workers 3           # 7. frame-by-frame render (1433 frames, about 80 s)
CRF=24 sh $D/tools/mux.sh $D/out/video.mp4 $D/mix.wav styles/backrooms/backrooms.mp4 24 0   # 8. mux (−14 LUFS, grain 0: the VHS noise is already in the picture)
python3 -c "import json;E=json.load(open('$D/events.json'));json.dump([{'t0':e['t'],'t1':e['t1'],'text':e['text']} for e in E['ev'] if e['type']=='cap'],open('$D/out/cues.json','w'))"
$PY core/render/srt.py $D/out/cues.json styles/backrooms/backrooms.srt
node core/render/still.mjs $D 3.6 9.0 --q nosub=1 --prefix pf_ --out $D/out/t   # 9. poster / style frames
cp $D/out/t/pf_3.6.jpg styles/backrooms/poster.jpg; cp $D/out/t/pf_9.0.jpg $D/stills/styleframe.jpg
