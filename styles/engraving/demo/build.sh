#!/bin/sh
# Rebuild "The Honeybee, Plate VII" from scratch: sh styles/engraving/demo/build.sh [content.json]
# Swap in your own content: write a JSON like content.json and pass its name (it must live in this demo folder).
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../../.."
PY=.venv/bin/python; D=styles/engraving/demo; O=styles/engraving; C=${1:-content.json}
# 1. voice lines from the content file → Kokoro (bm_fable, en-gb) → whisper check
$PY -c "import json,sys; c=json.load(open('$D/$C')); v=c['voice']; json.dump([dict(id=l['id'],text=l['text'],voice=v['voice'],speed=v.get('speed',.92),lang='en-gb',**({'asr':l['asr']} if 'asr' in l else {})) for l in v['lines']], open('$D/lines.json','w'), indent=1)"
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices
# 2. original baroque score → music/score.wav + stems
$PY $D/music/score.py
# 3. picture events → events.json; cue check (score accents ↔ picture); sound mix
node $D/tools/events.mjs $D $C
$PY $D/mix.py
$PY $D/tools/cuecheck.py
# 4. subtitles
$PY $D/tools/subs.py $C && $PY core/render/srt.py $D/out/subs.json $O/engraving.srt
# 5. frames (through the batch render gate when it exists) → mux at −14 LUFS with grain 4
G=""   # machine-wide render throttling already lives in core/render/video.mjs
$G node core/render/video.mjs $D --fps 24 --workers 2 --q "content=$C" --out $D/out/video.mp4
sh core/render/mux.sh $D/out/video.mp4 $D/mix.wav $O/engraving.mp4 24 4
# 6. stills
node core/render/still.mjs $D 30.9 --q "content=$C&nosub=1" --out $D/out/still --prefix sf_ && cp $D/out/still/sf_30.9.jpg $D/stills/styleframe.jpg
node core/render/still.mjs $D 33.5 --q "content=$C&nosub=1" --out $D/out/still --prefix po_ && cp $D/out/still/po_33.5.jpg $O/poster.jpg
