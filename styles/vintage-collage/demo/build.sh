#!/bin/sh
# One command: 《倒置的珍妮》 The Inverted Jenny (Vintage Engraving Collage demo)
#   sh demo/build.sh            archive images and fonts (if missing), voice (if missing) + speech check, timeline, parts,
#                               events, picture, mix, master, subtitles, readcheck, poster and style frame
#   VOICE=1 sh demo/build.sh    regenerate the voice before the check
#   PARTS=1 sh demo/build.sh    re-bake the paper parts (after changing src/bake*.py or a subtitle)
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl
# The archive images (public domain, Wikimedia Commons) and the fonts (OFL) are downloaded on the first run; network needed once.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/vintage-collage/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/vintage-collage
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=vintage-collage
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/raw" "$HERE/stills" "$HERE/out"

# archive images (gitignored): fetched from the URLs in SOURCES.jsonl
"$PY" - "$HERE" <<'PYEOF'
import json, os, sys, urllib.request
here = sys.argv[1]
for line in open(os.path.join(here, 'SOURCES.jsonl')):
    s = json.loads(line); p = os.path.join(here, s['file'])
    if not os.path.exists(p):
        req = urllib.request.Request(s['url'], headers={'User-Agent': 'lemo-opuscar-demo/1.0'})
        open(p, 'wb').write(urllib.request.urlopen(req, timeout=120).read()); print('fetched', s['file'])
PYEOF

# voice: Kokoro bm_george, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/L10.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo/"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en

# timeline (voice starts, subtitle cues) → fonts → paper parts
"$PY" "$HERE/src/timeline.py" > /dev/null
"$PY" "$HERE/make_fonts.py"
if [ "${PARTS:-0}" = "1" ] || [ ! -f "$HERE/parts/sub00_zh.png" ]; then
  "$PY" "$HERE/src/bake.py" && "$PY" "$HERE/src/bake2.py"
fi

# events, picture, voice + score + foley mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
FROM=0 "$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" -c "import json,sys; c=json.load(open(sys.argv[1]))['cues']; json.dump([dict(t0=x['t0'],t1=x['t1'],text=x['zh']+chr(10)+x['en']) for x in c], open(sys.argv[2],'w'), ensure_ascii=False)" "$HERE/timeline.json" "$HERE/out/cues.json"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$FILM/$NAME.srt"

# checks, poster and the gallery style frame (the stamp, just assembled)
# known: the three end-card slips (style name EN / 中文, sign-off) stay 2.1–2.4 s, under readcheck's need of 2.8–3.0 s (see DEMO.md)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || grep BAD "$HERE/out/readcheck.txt"
ffmpeg -v error -y -ss 9.6 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 9.6 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
