#!/bin/sh
# One command: 《一块纸》 One Piece of Paper (Comic History Cartoon demo), run from anywhere
#   sh styles/comic-history/demo/build.sh          fonts (if missing), parts (if missing), voice (if missing) + speech check,
#                                                  events, picture, mix, master, subtitles, readcheck, poster, styleframe
#   VOICE=1 sh .../build.sh    regenerate the voice before the check
#   PARTS=1 sh .../build.sh    re-key the part sheets (src/sheet-*.png) into parts/
#   WORKERS=3 sh .../build.sh  more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL + FreePats sample libraries (see DEMO.md, Build notes).
# The three part sheets in src/ are Codex image generations and are not in git (see CREDITS and DEMO.md).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/comic-history/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/comic-history
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=comic-history
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts" "$HERE/stills"

# fonts (gitignored): IM FELL English / SC, Lilita One, ZCOOL KuaiLe, Old Standard TT from github.com/google/fonts (OFL)
GF=https://github.com/google/fonts/raw/main/ofl
for u in imfellenglish/IMFeENrm28P.ttf imfellenglish/IMFeENit28P.ttf imfellenglishsc/IMFeENsc28P.ttf lilitaone/LilitaOne-Regular.ttf \
         zcoolkuaile/ZCOOLKuaiLe-Regular.ttf oldstandardtt/OldStandard-Regular.ttf oldstandardtt/OldStandard-Bold.ttf oldstandardtt/OldStandard-Italic.ttf; do
  f="$HERE/fonts/$(basename "$u")"; [ -f "$f" ] || curl -sfL -o "$f" "$GF/$u"
done

# puppet parts: key and cut the three green-screen sheets (src/sheet-fr.png, sheet-pr.png, sheet-al.png)
if [ "${PARTS:-0}" = "1" ] || [ ! -f "$HERE/parts/al_13.png" ]; then
  for s in fr pr al; do [ -f "$HERE/src/sheet-$s.png" ] || { echo "missing src/sheet-$s.png: see DEMO.md, Build notes (part sheets)"; exit 1; }; done
  "$PY" "$HERE/tools/extract.py"
fi

# voice: Kokoro bm_george, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/v9.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en

# events, picture, voice + foley + score mix, master (-14 LUFS, grain 1), subtitles
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py" --events out/events.json --from 0 --to 51 --out out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 1
node "$HERE/tools/srt.mjs" 0 51 > "$FILM/$NAME.srt"

# checks, poster and the gallery style frame (1871 after the slap: the grey patch, MINE NOW; no caption box, no credit)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -12 "$HERE/out/readcheck.txt"; echo "readcheck: see DEMO.md, Build notes"; }
T=${FRAME:-9.9}
ffmpeg -v error -y -ss "$T" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss "$T" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
