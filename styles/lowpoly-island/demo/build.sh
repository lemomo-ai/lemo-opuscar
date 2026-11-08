#!/bin/sh
# rebuild the film from scratch: sh styles/lowpoly-island/demo/build.sh (runs from any folder)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/lowpoly-island/demo; S=styles/lowpoly-island
$PY core/tts/tts.py $D/lines.json $D/voices                 # 1. Kokoro voice (af_sky)
$PY core/tts/asr_check.py $D/lines.json $D/voices           # 2. whisper check, line by line
node core/render/events.mjs $D                              # 3. timeline → events.json (growth events carry pitches = the melody voice)
$PY $D/music/score.py                                       # 4. original score: the melody is synthesised note by note from the growth events
$PY $D/music/check.py                                       #    librosa check: onsets / pitches of key notes vs picture events, true silence, band energy
$PY $D/mix.py                                               # 5. material foley + ambience bed + narration + music ducking → mix.wav
$PY $D/subs.py && $PY core/render/srt.py $D/out/cues.json $S/lowpoly-island.srt   # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4        # 7. frame-by-frame render (2× supersampling + GTAO)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $S/lowpoly-island.mp4 24 0     # 8. mux + −14 LUFS, no grain
