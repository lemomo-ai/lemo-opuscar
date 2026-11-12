#!/bin/sh
# One command: 《借来的光》 Borrowed Light (Gilded Illumination demo), 46.8 s at 30 fps
#   sh styles/gilded-illumination/demo/build.sh           fonts (if missing), voice (if missing) + speech check, events, mix, subtitles, picture, master, readcheck, poster, styleframe
#   VOICE=1 sh styles/gilded-illumination/demo/build.sh   record the narration again before the check
#   WORKERS=3 sh styles/gilded-illumination/demo/build.sh more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries: sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; … vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/gilded-illumination/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/gilded-illumination
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=gilded-illumination
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): Grenze Gotisch, Uncial Antiqua, IM Fell English and the Noto Serif SC variable font from github.com/google/fonts (OFL 1.1)
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/GrenzeGotisch.ttf" ]        || curl -sfL -o "$HERE/fonts/GrenzeGotisch.ttf"        "$GF/grenzegotisch/GrenzeGotisch%5Bwght%5D.ttf"
[ -f "$HERE/fonts/UncialAntiqua-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/UncialAntiqua-Regular.ttf" "$GF/uncialantiqua/UncialAntiqua-Regular.ttf"
[ -f "$HERE/fonts/IMFellEnglish.ttf" ]        || curl -sfL -o "$HERE/fonts/IMFellEnglish.ttf"        "$GF/imfellenglish/IMFeENrm28P.ttf"
[ -f "$HERE/fonts/IMFellEnglish-Italic.ttf" ] || curl -sfL -o "$HERE/fonts/IMFellEnglish-Italic.ttf" "$GF/imfellenglish/IMFeENit28P.ttf"
if [ ! -f "$HERE/fonts/zh-serif-500.ttf" ] || [ ! -f "$HERE/fonts/zh-serif-700.ttf" ]; then
  [ -f "$HERE/fonts/src/NotoSerifSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSerifSC-VF.ttf" "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
  "$PY" "$HERE/fonts/make_fonts.py"
fi

# voice: Kokoro bf_emma at 0.8, one clip per line; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/v10.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en

# events → score, foley, voice → subtitles → picture → master (−14 LUFS, true peak −1 dB)
node core/render/events.mjs "$HERE"
"$PY" "$HERE/audio.py"
"$PY" "$HERE/make_srt.py" "$FILM/$NAME.srt"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1

# checks, poster and the gallery style frame (41.1 s: the whole painting, five of her, before the plaque and with no subtitle)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; echo "readcheck: see out/readcheck.txt and DEMO.md"; }
ffmpeg -v error -y -ss 41.1 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 3 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 41.1 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 4 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
