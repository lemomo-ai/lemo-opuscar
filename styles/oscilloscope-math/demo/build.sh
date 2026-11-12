#!/bin/sh
# One command: 《吉布斯现象》 The Gibbs Phenomenon (Oscilloscope Math demo)
#   sh demo/build.sh            Manim env + fonts (if missing), voice (if missing) + speech check, picture, look, mix, master,
#                               subtitles, readcheck, poster and style frame
#   VOICE=1 sh demo/build.sh    regenerate the voice before the check
#   WORKERS=3 sh demo/build.sh  more render workers (default 2)
# Needs: ffmpeg 7+, Python 3.12 (Manim 0.22 is installed into demo/.venv with uv, or python3.12 -m venv), the library's
# .venv (core/, Kokoro, Whisper), the voice tier and the VCSL samples:  sh tools/fetch.sh voice; sh tools/fetch.sh instruments vcsl
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                  # .../styles/oscilloscope-math/demo
FILM=$(cd "$HERE/.." && pwd)                          # .../styles/oscilloscope-math
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}             # library root
export LIB
[ -f "$LIB/core/render/mux.sh" ] || { echo "set LIB to the library folder"; exit 1; }
PY=${PY:-"$LIB/.venv/bin/python"}                    # library tools: Kokoro, Whisper, core/audio
MPY="$HERE/.venv/bin/python"                          # Manim, the phosphor pass, the fonts
NAME=oscilloscope-math
WORKERS=${WORKERS:-2}
FRAME_SEC=$(python3 -c "import json;print(json.load(open('$FILM/style.json'))['frame_sec'])")
cd "$HERE"
export PYTHONWARNINGS=ignore

# Manim (Cairo renderer) in its own venv; no LaTeX: the formula is MathJax SVG kept in tex/formulas.json
if [ ! -x "$MPY" ]; then
  if command -v uv >/dev/null; then uv venv -p 3.12 .venv && VIRTUAL_ENV="$HERE/.venv" uv pip install -r requirements.txt
  else python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt; fi
fi

# fonts (gitignored): variable fonts from github.com/google/fonts (OFL), static instances and the SC subset by make_fonts.py
GF=https://github.com/google/fonts/raw/main/ofl
mkdir -p fonts/src out/voice stills
[ -f fonts/src/JetBrainsMono-VF.ttf ] || curl -sfL -o fonts/src/JetBrainsMono-VF.ttf "$GF/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"
[ -f fonts/src/STIXTwoText-VF.ttf ] || curl -sfL -o fonts/src/STIXTwoText-VF.ttf "$GF/stixtwotext/STIXTwoText%5Bwght%5D.ttf"
[ -f fonts/src/STIXTwoText-Italic-VF.ttf ] || curl -sfL -o fonts/src/STIXTwoText-Italic-VF.ttf "$GF/stixtwotext/STIXTwoText-Italic%5Bwght%5D.ttf"
[ -f fonts/src/NotoSerifSC-VF.ttf ] || curl -sfL -o fonts/src/NotoSerifSC-VF.ttf "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
[ -f fonts/NotoSerifSC-Medium-sub.ttf ] && [ -f fonts/JetBrainsMono-Medium.ttf ] || "$MPY" make_fonts.py

# voice: Kokoro am_michael, one clip per line; every clip must pass the speech-to-text check (writes dur.json, words.json)
if [ "${VOICE:-0}" = "1" ] || [ ! -f out/voice/v10.wav ]; then
  (cd "$LIB" && "$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/out/voice")
fi
(cd "$LIB" && "$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/out/voice" --lang en)

# picture: Manim draws the light channels (film.py), WORKERS slices in parallel, frames named by their index on the film
DUR=$(python3 -c "import json;print(json.load(open('timeline.json'))['dur'])")
K1=$(awk -v t="$DUR" 'BEGIN{printf "%d", t*24+0.5}')
rm -rf out/raw; mkdir -p out/raw
slice() { awk -v k1="$K1" -v i="$1" -v j="$WORKERS" 'BEGIN{printf "%.6f", int(k1*i/j)/24}'; }
PIDS=""; i=0
while [ $i -lt "$WORKERS" ]; do
  XPM_MEDIA="$HERE/out/manim-$i" "$MPY" film.py render "$(slice $i)" "$(slice $((i + 1)))" out/raw 2>out/render-$i.log & PIDS="$PIDS $!"
  i=$((i + 1))
done
for p in $PIDS; do wait "$p" || { echo "a render worker failed: see $HERE/out/render-*.log"; exit 1; }; done
# the phosphor pass (post.py) has no frame-to-frame state: same slices in parallel, joined without re-encoding
PIDS=""; i=0; : > out/post.txt
while [ $i -lt "$WORKERS" ]; do
  "$MPY" post.py "$(slice $i)" "$(slice $((i + 1)))" out/raw out/post-$i.mp4 & PIDS="$PIDS $!"
  echo "file 'post-$i.mp4'" >> out/post.txt; i=$((i + 1))
done
for p in $PIDS; do wait "$p" || { echo "a post worker failed"; exit 1; }; done
ffmpeg -v error -y -f concat -safe 0 -i out/post.txt -c copy out/video.mp4

# sound events and subtitle cues from the same timeline, the mix, the master, the .srt
"$MPY" film.py events out/events.json 2>/dev/null
"$MPY" film.py subs out/subs.json 2>/dev/null
python3 -c "import json;c=json.load(open('out/subs.json'));json.dump([dict(t0=q['t0'],t1=q['t1'],text=q['zh']+'\n'+q['en']) for q in c],open('out/cues.json','w'),ensure_ascii=False)"
"$PY" "$LIB/core/render/srt.py" out/cues.json "$FILM/$NAME.srt"
"$PY" mix.py out/events.json out/mix.wav
sh "$LIB/core/render/mux.sh" out/video.mp4 out/mix.wav "$FILM/$NAME.mp4" 24 0

# reading-time check: every text the viewer has to read, exported with its screen box, through a bridge page
mkdir -p out/readcheck && cp tools/readcheck.html out/readcheck/index.html
"$MPY" film.py texts out/readcheck/texts.json 2>/dev/null
(cd "$LIB" && node core/render/readcheck.mjs "$HERE/out/readcheck") > out/readcheck.txt && echo "readcheck ok" || { tail -20 out/readcheck.txt; exit 1; }

# poster and the gallery style frame (the circles stacking up while the wave turns square)
ffmpeg -v error -y -ss "$FRAME_SEC" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
ffmpeg -v error -y -ss "$FRAME_SEC" -i "$FILM/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/stills/styleframe.jpg"
echo "done: $FILM/$NAME.mp4"
