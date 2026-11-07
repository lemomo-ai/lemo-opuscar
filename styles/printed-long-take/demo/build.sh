#!/bin/sh
# One command: 《三十三只》 Thirty-Three Cranes (Printed Long Take demo)
#   sh styles/printed-long-take/demo/build.sh        English narration (the library demo)
#   sh styles/printed-long-take/demo/build.sh zh     Chinese narration
# font, narration and its speech check, events, score + mix, picture, master, subtitles, reading-time check, poster.
# In a fresh clone (fonts and samples are not in git) Noto Serif SC is downloaded from github.com/google/fonts (OFL)
# and the sample packs with tools/fetch.sh. The narration uses edge-tts (online).
set -e
LANGV=${1:-en}
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=printed-long-take
OUT=$NAME; [ "$LANGV" = zh ] && OUT=$NAME-zh
FPS=30
FRAME=15.4                                           # the crowns waking at dawn: poster and gallery still (no subtitle on screen)
cd "$LIB"

# font (gitignored): Noto Serif SC variable, subset to every character the film prints at weight 700
[ -f "$HERE/tools/NotoSerifSC-VF.ttf" ] || curl -sfL -o "$HERE/tools/NotoSerifSC-VF.ttf" "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
"$PY" "$HERE/tools/subset.py"
# sampled instruments (library packs, CC0), fetched once per clone
for l in vcsl vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# narration: one wav per line in voice/<lang>/ (Xiaoxiao +25% for Chinese, Ava +10% with per-line rates for English), then check it
if [ "$LANGV" = zh ]; then
  "$PY" core/tts/tts_zh.py "$HERE/lines_zh.json" "$HERE/voice/zh" --voice zh-CN-XiaoxiaoNeural --rate +25%
  "$PY" core/tts/asr_check.py "$HERE/lines_zh.json" "$HERE/voice/zh" --lang zh || echo "(Chinese check: differences are homophones and digits; listen to any new line)"
else
  "$PY" core/tts/tts_zh.py "$HERE/lines_en.json" "$HERE/voice/en" --voice en-US-AvaNeural --rate +10%
  "$PY" core/tts/asr_check.py "$HERE/lines_en.json" "$HERE/voice/en" --lang en
fi
# the subtitle bar is timed on the Chinese reading in either version
[ -f "$HERE/voice/zh/dur.json" ] || "$PY" core/tts/tts_zh.py "$HERE/lines_zh.json" "$HERE/voice/zh" --voice zh-CN-XiaoxiaoNeural --rate +25%

# events from the picture, then narration, score and effects placed on them (mix.wav, about -16 LUFS before the master)
node core/render/events.mjs "$HERE"
"$PY" "$HERE/audio.py" "$LANGV"

# picture and master (mux.sh brings the mix to -14 LUFS)
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$FILM/$OUT.mp4" $FPS 0

# bilingual subtitles and the reading time of every word in the world (window.TEXTS)
"$PY" "$HERE/tools/srt.py"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster and the gallery style frame
ffmpeg -v error -y -ss $FRAME -i "$FILM/$OUT.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
mkdir -p "$HERE/stills"
ffmpeg -v error -y -ss $FRAME -i "$FILM/$OUT.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$OUT.mp4"
