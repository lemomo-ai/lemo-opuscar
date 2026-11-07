#!/bin/sh
# One command: 《差两秒》 Two Seconds Short (Archive Light Table demo)
#   sh demo/build.sh            voice, checks, cues, picture, score + mix, master, subtitles, checks, poster
#   FETCH=1 sh demo/build.sh    first re-download the fonts and the Library of Congress scans (~100 MB), rebuild the textures
#   (a clean clone fetches fonts, scans, the voice model and the sample libraries by itself; needs setup.sh deps voice)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # films/<slug>/demo or styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=archive-lighttable
RAW="$HERE/assets/raw"
cd "$LIB"

# fonts (gitignored): every face the page uses, from Google Fonts
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/fonts/IBMPlexMono-400.woff2" ] || [ ! -f "$HERE/fonts/NotoSansSC-400.woff2" ]; then
  mkdir -p "$HERE/fonts"; "$PY" -I "$HERE/tools/fonts.py" "$HERE"
fi
# the voice model and the three sample libraries the score uses (skipped when present)
[ -f core/tts/kokoro-v1.0.onnx ] || sh tools/fetch.sh voice
for l in salamander vsco2ce vcsl; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# archive scans and textures (gitignored): keyed on a texture the page reads
if [ "${FETCH:-0}" = "1" ] || [ ! -f "$HERE/assets/tex/p1_fly.png" ]; then
  mkdir -p "$RAW"
  T=https://tile.loc.gov/storage-services/master/pnp
  for id in 00626 00629 00610; do curl -sSL -o "$RAW/loc_ppprs${id}u.tif" "$T/ppprs/00600/${id}u.tif"; done
  curl -sSL -o "$RAW/loc_cph3b18080u.tif" "$T/cph/3b10000/3b18000/3b18000/3b18080u.tif"
  curl -sSL -A "LemoOpuscar/1.0" -o "$RAW/telegram_mcc061.jpg" "https://upload.wikimedia.org/wikipedia/commons/7/72/Telegram_Orville_Wright_17_dec_1903.jpg"
  "$PY" -I "$HERE/tools/prep.py" "$HERE"             # plates, masks, the Flyer / Wilbur layers and the cleaned background
fi

# voice: Kokoro (bm_george), speech-to-text check with the small English model
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice/out"
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice/out" --lang en
node "$HERE/tools/export.mjs" "$HERE" > /dev/null     # cues and timeline from the real durations; fails on overlap
node "$HERE/tools/cuecheck.mjs" "$HERE" > "$HERE/out/cuecheck.txt" || { cat "$HERE/out/cuecheck.txt"; exit 1; }; tail -1 "$HERE/out/cuecheck.txt"

# picture, events, score + mix, master, subtitles
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
"$PY" core/render/srt.py "$HERE/out/cues_srt.json" "$FILM/$NAME.srt"

# checks
node "$HERE/tools/subcheck.mjs" "$HERE" > "$HERE/out/subcheck.txt" || { cat "$HERE/out/subcheck.txt"; exit 1; }; tail -1 "$HERE/out/subcheck.txt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster (the signature shot) and the gallery style frame
mkdir -p "$HERE/stills"
node core/render/still.mjs "$HERE" 22.3 15.75 --q 'nosubs=1' --prefix pf_ --out "$HERE/out" > /dev/null
cp "$HERE/out/pf_22.3.jpg" "$FILM/poster.jpg"                    # inside the first flight, labels on
cp "$HERE/out/pf_15.75.jpg" "$HERE/stills/styleframe.jpg"        # the develop front under the loupe
echo "done: $FILM/$NAME.mp4"
