#!/bin/sh
# One command: 《复利是怎么滚起来的》 COMPOUND (Bauhaus Shapes demo)
#   sh styles/bauhaus-shapes/demo/build.sh              fonts (if missing), voice (if missing) + speech check, events, subtitles,
#                                                       mix, picture, master, readcheck, poster and gallery frame (no subtitles)
#   VOICE=1 sh …/build.sh                               regenerate the voice before the check
#   WORKERS=3 sh …/build.sh                             more render workers (default 2)
#   PAL=sorbet sh …/build.sh                            the same film in the second palette (writes bauhaus-shapes-sorbet.mp4)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE, VCSL and FreePats sample libraries:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments vcsl; sh tools/fetch.sh instruments freepats
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/bauhaus-shapes/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/bauhaus-shapes
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=bauhaus-shapes; PAL=${PAL:-klein}; WORKERS=${WORKERS:-2}
[ "$PAL" = klein ] && OUT="$FILM/$NAME.mp4" || OUT="$FILM/$NAME-$PAL.mp4"
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): Jost and Noto Sans SC variable fonts from github.com/google/fonts (OFL), then the SC subset
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/Jost-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Jost-VF.ttf" "$GF/jost/Jost%5Bwght%5D.ttf"
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
[ -f "$HERE/fonts/NotoSansSC-VF-sub.woff2" ] || sh "$HERE/subset.sh"

# voice: Kokoro af_heart, one clip per sentence (durations to voice/dur.json); every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/voice/v12.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"
fi
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en

# events and subtitle cues from the page, then the mix (voice + score + effects) for the whole film
node core/render/events.mjs "$HERE"
node "$HERE/cues.mjs" 0 52 "$HERE/out/cues.json"
"$PY" core/render/srt.py "$HERE/out/cues.json" "${OUT%.mp4}.srt"
"$PY" "$HERE/mix.py"

# picture and master
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --q "pal=$PAL" --out "$HERE/out/video-$PAL.mp4"
sh core/render/mux.sh "$HERE/out/video-$PAL.mp4" "$HERE/out/mix-0-52.wav" "$OUT" 30 1

# checks, then the poster and the gallery style frame: the title with 128 landed (9.4 s), drawn without subtitles or credit
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
if [ "$PAL" = klein ]; then
  node core/render/still.mjs "$HERE" 9.4 --q "nosub=1" --out "$HERE/out/still" --prefix card_
  ffmpeg -v error -y -i "$HERE/out/still/card_9.4.jpg" -q:v 3 "$FILM/poster.jpg"
  cp "$FILM/poster.jpg" "$HERE/stills/styleframe.jpg"
fi
echo "done: $OUT"
