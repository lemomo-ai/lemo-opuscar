#!/bin/sh
# One command: 《你手机的天线在哪》 Where Is Your Phone's Antenna? (Line-Art Cutaway demo, 52 s)
#   sh styles/hardcore-info/demo/build.sh      fonts (if missing), voice (if missing), subtitles, events, picture, mix, master, poster
# Fonts and voice WAVs are not in git: fonts come from github.com/google/fonts and the Google Fonts CSS API (Noto Sans SC subset),
# the narration is regenerated offline with Kokoro (bm_george) and checked with asr_check.py (tools/voice.sh).
# Needs the voice tier (Kokoro model) and the VCSL, VSCO 2 CE and Karoryfer sample libraries; a clean clone fetches them:
#   sh tools/fetch.sh voice; sh tools/fetch.sh instruments vcsl; sh tools/fetch.sh instruments vsco2ce; sh tools/fetch.sh instruments karoryfer
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}
NAME=hardcore-info
WORKERS=${WORKERS:-2}
cd "$LIB"
[ -f core/tts/kokoro-v1.0.onnx ] && [ -f core/tts/voices-v1.0.bin ] || sh tools/fetch.sh voice
for l in vcsl vsco2ce karoryfer; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# fonts: IBM Plex Sans / Mono (OFL) and a Noto Sans SC subset of the characters on screen (OFL)
if [ ! -f "$HERE/fonts/IBMPlexSans-VF.ttf" ] || [ ! -f "$HERE/fonts/IBMPlexMono-Medium.ttf" ]; then
  R=https://raw.githubusercontent.com/google/fonts/main/ofl
  mkdir -p "$HERE/fonts"
  curl -sfL -o "$HERE/fonts/IBMPlexSans-VF.ttf" "$R/ibmplexsans/IBMPlexSans%5Bwdth,wght%5D.ttf"
  curl -sfL -o "$HERE/fonts/IBMPlexMono-Regular.ttf" "$R/ibmplexmono/IBMPlexMono-Regular.ttf"
  curl -sfL -o "$HERE/fonts/IBMPlexMono-Medium.ttf" "$R/ibmplexmono/IBMPlexMono-Medium.ttf"
fi
python3 "$HERE/tools/timeline.py" >/dev/null                                  # narration starts + bilingual subtitles → timeline.json, zh-chars.txt
[ -f "$HERE/fonts/NotoSansSC-500-sub.woff2" ] || sh "$HERE/tools/zh_subset.sh" >/dev/null
[ -f "$HERE/voice/v10.wav" ] || sh "$HERE/tools/voice.sh"                     # Kokoro + tail trim + asr_check
END=$(python3 -c "import json;print(json.load(open('$HERE/timeline.json'))['end'])")
node core/render/events.mjs "$HERE" --q "from=0&to=$END"                       # sound events → events.json
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" --q "from=0&to=$END" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py" 0 "$END" "$HERE/out/mix.wav"                              # narration + score + foley
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" 24 0
"$PY" "$HERE/tools/srt.py"                                                    # ../hardcore-info.srt
node "$HERE/tools/poster.mjs" 17.4                                            # ../poster.jpg
echo "done: $FILM/$NAME.mp4"
