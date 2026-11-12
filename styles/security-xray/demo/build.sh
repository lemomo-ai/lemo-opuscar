#!/bin/sh
# One command: 《安检口的夜班》 Night Shift at Lane 3 (Security X-ray demo)
#   sh demo/build.sh           fonts (if missing), voice (if missing) + speech check, events, picture, mix, master, subtitles, readcheck, poster
#   VOICE=1 sh demo/build.sh   regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh more render workers (default 2)
# Needs the voice tier (Kokoro model) and the VSCO 2 CE + VCSL sample libraries: sh tools/fetch.sh voice; sh tools/fetch.sh instruments vsco2ce; … vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/security-xray/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/security-xray
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=security-xray
WORKERS=${WORKERS:-2}
cd "$LIB"
mkdir -p "$HERE/out/voice" "$HERE/fonts/src" "$HERE/stills"

# fonts (gitignored): IBM Plex Mono and the Noto Sans SC variable font from github.com/google/fonts (OFL), then the SC subsets
GF=https://github.com/google/fonts/raw/main/ofl
for w in Regular Medium; do
  [ -f "$HERE/fonts/IBMPlexMono-$w.ttf" ] || curl -sfL -o "$HERE/fonts/IBMPlexMono-$w.ttf" "$GF/ibmplexmono/IBMPlexMono-$w.ttf"
done
[ -f "$HERE/fonts/src/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/fonts/src/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
[ -f "$HERE/fonts/NotoSansSC-500.ttf" ] && [ -f "$HERE/fonts/NotoSansSC-700.ttf" ] || "$PY" "$HERE/make_fonts.py"

# voice: Kokoro af_heart, one clip per sentence; every clip must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/out/voice/v13.wav" ]; then
  "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice"
fi
WHISPER_MODEL=small.en "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en

# events, picture, voice + score + foley mix, master, subtitles
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" --out "$HERE/out/video.mp4"
"$PY" "$HERE/audio.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 30 1
"$PY" "$HERE/tools/srt_from_events.py" "$HERE/events.json" "$HERE/out/cues.json"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$FILM/$NAME.srt"

# checks, poster and the gallery style frame (the CT shot, just after the leg kicks)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
ffmpeg -v error -y -ss 31.2 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss 31.2 -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
