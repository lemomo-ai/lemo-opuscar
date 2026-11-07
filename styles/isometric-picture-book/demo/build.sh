#!/bin/sh
# One command: 《七十二个座位》 Seventy-Two Seats (Isometric Picture Book demo)
#   sh styles/isometric-picture-book/demo/build.sh        Chinese narration (the library film): isometric-picture-book.mp4
#   sh styles/isometric-picture-book/demo/build.sh en     English narration over the same picture and subtitles: isometric-picture-book-en.mp4
# Steps: fonts, sample packs, narration (edge-tts, online) + speech check, events, score + mix, picture, master,
# reading-time check, bilingual subtitles, poster and gallery still. Fonts, voices and mixes are not in git: this rebuilds them.
set -e
VO_LANG=${1:-zh}
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=isometric-picture-book
FPS=30
FRAME=10.3                                           # the cabin with its roof flipped open: poster and gallery still (no subtitle)
cd "$LIB"

# fonts (OFL, gitignored): Noto Serif SC variable (subset to the characters used) and Newsreader variable
GF=https://github.com/google/fonts/raw/main/ofl
mkdir -p "$HERE/fonts" "$HERE/out"
[ -f "$HERE/tools/NotoSerifSC-VF.ttf" ] || curl -sfL -o "$HERE/tools/NotoSerifSC-VF.ttf" "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
[ -f "$HERE/fonts/Newsreader-VF.ttf" ] || curl -sfL -o "$HERE/fonts/Newsreader-VF.ttf" "$GF/newsreader/Newsreader%5Bopsz,wght%5D.ttf"
"$PY" "$HERE/tools/subset.py"                        # fonts/NotoSerifSC-sub.ttf
# sampled instruments (library packs: VSCO 2 CE and VCSL CC0, Salamander piano CC BY 3.0), fetched once per clone
for l in vsco2ce vcsl salamander; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# narration: 13 lines. Chinese zh-CN-XiaoxiaoNeural +25 % (film.js VO_DUR holds these line lengths and builds the shots from them);
# English en-US-AvaNeural +10 % (three lines faster, set per line in lines_en.json), each line starting with its Chinese line.
if [ "$VO_LANG" = en ]; then
  "$PY" core/tts/tts_zh.py "$HERE/lines_en.json" "$HERE/out/vo_en" --voice en-US-AvaNeural --rate +10%
  "$PY" core/tts/asr_check.py "$HERE/lines_en.json" "$HERE/out/vo_en" --lang en --model medium.en
else
  "$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/out/vo_zh" --voice zh-CN-XiaoxiaoNeural --rate +25%
  "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/out/vo_zh" --lang zh --model medium
  "$PY" "$HERE/tools/vo_lengths.py"                  # the voice lengths must still match VO_DUR in film.js
fi

# events from the picture, then narration + score + effects (about -16 LUFS before the master, music 16.5 dB under the voice)
node core/render/events.mjs "$HERE"
if [ "$VO_LANG" = en ]; then "$PY" "$HERE/audio.py" "$HERE" --vo out/vo_en --out mix_en.wav; MIX="$HERE/mix_en.wav"; OUTF="$FILM/$NAME-en.mp4"
else "$PY" "$HERE/audio.py" "$HERE"; MIX="$HERE/mix.wav"; OUTF="$FILM/$NAME.mp4"; fi

# picture and master (mux.sh brings the mix to -14 LUFS)
if [ "$VO_LANG" != en ] || [ ! -f "$HERE/out/video.mp4" ]; then node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"; fi   # the English build reuses the picture
sh core/render/mux.sh "$HERE/out/video.mp4" "$MIX" "$OUTF" $FPS 0

# reading time of every word on the ground (window.TEXTS); subtitles follow the narration and go to the .srt
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }
"$PY" "$HERE/tools/srt.py"

# poster and the gallery style frame: the page itself, without the subtitle bar
node core/render/still.mjs "$HERE" $FRAME --q nosub=1 --out "$HERE/out" --prefix sf_ >/dev/null
mkdir -p "$HERE/stills"
cp "$HERE/out/sf_$FRAME.jpg" "$HERE/stills/styleframe.jpg"; cp "$HERE/out/sf_$FRAME.jpg" "$FILM/poster.jpg"
echo "done: $OUTF"
