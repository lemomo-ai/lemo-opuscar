#!/bin/sh
# Rebuild "TRANQUILITY.LOG" from scratch: sh styles/ascii-crt/demo/build.sh (runs from any folder)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/ascii-crt/demo; S=styles/ascii-crt
$PY core/tts/tts.py $D/lines.json $D/voices_raw                  # 1. Kokoro voice (am_echo, speed 0.8)
$PY $D/voice_fx.py                                               # 2. AI voice treatment: light ring modulation + comb resonance + band-pass → voices/
$PY core/tts/asr_check.py $D/lines.json $D/voices                # 3. whisper line-by-line check (mismatches: 0) + per-word timings words.json (for the log panel's word-by-word typing)
$PY $D/music/score.py                                            # 4. original analogue-synth score → music/score.wav + stems (~6s)
node core/render/events.mjs $D                                   # 5. timeline → events.json (keyboard / handshake / landing / narration events)
$PY $D/mix.py                                                    # 6. synthesised foley + narration ducking + score → mix.wav
node $D/tools/subs.mjs $D && $PY core/render/srt.py $D/out/subs.json $S/ascii-crt.srt   # 7. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4             # 8. frame-by-frame render (1435 frames, ~35s)
ffmpeg -v error -y -i $D/mix.wav -af "aresample=192000,alimiter=limit=0.6:attack=1:release=60:level=false,aresample=48000" -c:a pcm_s24le $D/out/mix_lim.wav   # 9a. oversampled peak limiter so the AAC film stays under −1 dBTP
sh core/render/mux.sh $D/out/video24.mp4 $D/out/mix_lim.wav $S/ascii-crt.mp4 24 0       # 9. mux: −14 LUFS, no grain added (the noise is in the picture)
node core/render/still.mjs $D 39.4 --q 'nosub=1' --out $D/out/still --prefix sf_ && cp $D/out/still/sf_39.4.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 0 --q 'frame=poster' --out $D/out/still --prefix po_ && cp $D/out/still/po_0.jpg $S/poster.jpg
