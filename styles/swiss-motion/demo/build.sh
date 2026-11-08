#!/bin/sh
# Rebuild 《Five Rules for a Poster》 from scratch: sh styles/swiss-motion/demo/build.sh (runs from any folder)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/swiss-motion/demo; S=styles/swiss-motion
$PY core/tts/tts.py $D/lines.json $D/voices                          # 1. Kokoro voice-over (af_sarah, speed 1.0)
$PY core/tts/asr_check.py $D/lines.json $D/voices                    # 2. whisper line-by-line check (should give mismatches: 0)
$PY $D/tools/words.py                                                # 3. word timings → subtitles snap in word by word
$PY $D/music/score.py                                                # 4. original motorik score (reads score.json, ~4 s)
node core/render/events.mjs $D                                       # 5. timeline → events.json (foley events)
$PY $D/mix.py                                                        # 6. foley + voice-over ducking + score → mix.wav
$PY $D/tools/subs.py && $PY core/render/srt.py $D/out/subs.json $S/swiss-motion.srt   # 7. subtitles (asserts on-screen durations)
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4          # 8. frame-by-frame render (~12 s)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/swiss-motion.mp4 24 0          # 9. mux: −14 LUFS, grain 0
node core/render/still.mjs $D 33.4 --q nosub=1 --out $D/out/still --prefix sf_ && cp $D/out/still/sf_33.4.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 43.5 --q 'nosub=1&poster=1' --out $D/out/still --prefix po_ && cp $D/out/still/po_43.5.jpg $S/poster.jpg
