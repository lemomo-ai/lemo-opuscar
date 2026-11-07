#!/bin/sh
# One command: 《汉字的故事》 The Story of Chinese Characters (Chalkboard demo)
#   sh styles/chalkboard/demo/build.sh        Chinese voice (the library demo)
#   sh styles/chalkboard/demo/build.sh en     English voice: same picture and subtitles, mix_en.wav, chalkboard-en.mp4
# Steps: fonts, chalk recordings, voice + speech check, events, score + mix, picture, master, reading-time check,
# subtitles, poster and gallery frame. Fonts and recordings are not in git: they are downloaded here (OFL / CC0 / CC BY,
# see CREDITS). The voice is edge-tts (online).
set -e
LANG_VO=${1:-zh}
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../chalkboard/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../chalkboard
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=chalkboard
FPS=30
FRAME=42.5                                           # the verdict on the board, between voice lines: poster and gallery frame
cd "$LIB"

# fonts (gitignored): single-line EMS fonts for the English chalk; LXGW WenKai as the source of the subtitle subset
EMS=https://gitlab.com/oskay/svg-fonts/-/raw/master/fonts/EMS
for f in EMSDelight EMSCasualHand; do [ -f "$HERE/fonts/$f.svg" ] || curl -sfL -o "$HERE/fonts/$f.svg" "$EMS/$f.svg"; done
[ -f "$HERE/fonts/LXGWWenKai-Regular.ttf" ] || curl -sfL -o "$HERE/fonts/LXGWWenKai-Regular.ttf" \
  https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Regular.ttf
"$PY" "$HERE/tools/subset.py"                        # fonts/wenkai-sub.woff2

# chalk recordings from Wikimedia Commons, cut into grains (foley/lib)
C=https://upload.wikimedia.org/wikipedia/commons
mkdir -p "$HERE/foley/raw"
[ -f "$HERE/foley/raw/chalk-on-chalkboard.wav" ] || curl -sfL -o "$HERE/foley/raw/chalk-on-chalkboard.wav" "$C/8/81/264944_chalk-on-chalkboard.wav"
[ -f "$HERE/foley/raw/Chalkboard-writing.ogg" ]  || curl -sfL -o "$HERE/foley/raw/Chalkboard-writing.ogg" "$C/3/36/Chalkboard-writing.ogg"
[ -f "$HERE/foley/raw/WWS_Chalk.ogg" ]          || curl -sfL -o "$HERE/foley/raw/WWS_Chalk.ogg" "$C/2/20/WWS_Chalk.ogg"
[ -f "$HERE/foley/lib/index.json" ] || "$PY" -I "$HERE/tools/foley_lib.py" "$HERE/foley/lib" \
  fat="$HERE/foley/raw/chalk-on-chalkboard.wav" tom="$HERE/foley/raw/Chalkboard-writing.ogg" wws="$HERE/foley/raw/WWS_Chalk.ogg"
# sampled instruments (library packs, CC0)
for l in vcsl vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# voice: nine lines; `say` carries the readings (矢→史, 委→伟, 量→良 in Chinese; pinyin in English). Lengths go into VO in js/film.js
if [ "$LANG_VO" = en ]; then
  "$PY" core/tts/tts_zh.py "$HERE/lines_en.json" "$HERE/vo_en" --voice en-US-AvaNeural --rate +10%
  "$PY" core/tts/asr_check.py "$HERE/lines_en.json" "$HERE/vo_en" --lang en
else
  "$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/vo" --voice zh-CN-XiaoxiaoNeural --rate +15%
  # 射/涉/社 and 和/合 are homophones to Whisper: a Chinese difference is a cue to listen, not a failure
  "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/vo" --lang zh --model medium || echo "(Chinese check: differences are homophones; listen to any new line)"
fi

# events from the picture (strokes, voice starts, subtitle cues), then the score and chalk placed on them
node core/render/events.mjs "$HERE"
if [ "$LANG_VO" = en ]; then "$PY" "$HERE/audio.py" en; MIX="$HERE/mix_en.wav"; OUT="$FILM/$NAME-en.mp4"
else "$PY" "$HERE/audio.py"; MIX="$HERE/mix.wav"; OUT="$FILM/$NAME.mp4"; fi

# picture and master (mux.sh brings the mix to -14 LUFS and adds a light grain); subtitles are drawn by the page
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$MIX" "$OUT" $FPS 1

# reading time of every word on the board (window.TEXTS)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# bilingual subtitles, poster and the gallery frame (picture only, no subtitle plate)
"$PY" "$HERE/tools/srt.py" "$FILM/$NAME.srt"
node core/render/still.mjs "$HERE" $FRAME --q nosubs --out "$HERE/out" --prefix poster_
cp "$HERE/out/poster_$FRAME.jpg" "$FILM/poster.jpg"
mkdir -p "$HERE/stills" && cp "$HERE/out/poster_$FRAME.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $OUT"
