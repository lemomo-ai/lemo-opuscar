#!/bin/sh
# One command: 《山海》 Mountains and Seas (Double Exposure demo)
#   sh demo/build.sh           assets and fonts (if missing), voice (if missing) + speech check, picture, mix, master, subtitles, readcheck, poster
#   VOICE=1 sh demo/build.sh   regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh more render workers (default 2)
# Needs the voice tier (Kokoro model) and the sample libraries the score uses:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl; sh tools/fetch.sh instruments salamander
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/double-exposure/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/double-exposure
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=double-exposure
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# photographs and silhouettes (gitignored): Wikimedia Commons (CC0) and PhyloPic (CC0 / PD), from sources/*.jsonl
"$PY" "$HERE/fetch_assets.py"

# fonts (gitignored): Newsreader and the Noto Serif SC variable font from github.com/google/fonts (OFL), then the SC subset
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/Newsreader-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Newsreader-VF.ttf" "$GF/newsreader/Newsreader%5Bopsz,wght%5D.ttf"
[ -f "$HERE/fonts/Newsreader-Italic-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Newsreader-Italic-VF.ttf" "$GF/newsreader/Newsreader-Italic%5Bopsz,wght%5D.ttf"
if [ ! -f "$HERE/fonts/NotoSerifSC-600-film.ttf" ]; then
  [ -f "$HERE/fonts/src/NotoSerifSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSerifSC-VF.ttf" "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
  "$PY" "$HERE/make_fonts.py"
fi

# voice: Kokoro af_heart, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/v6.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"
fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en

# picture, score + foley + voice mix, master, subtitles
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/audio.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1
"$PY" core/render/srt.py "$HERE/vo/cues.json" "$FILM/$NAME.srt"

# checks, then the poster and the gallery style frame: 38.5 s, the whale over the night sea with its harbour lit (no subtitle, no credit)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 38.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 38.5 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
