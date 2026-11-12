#!/bin/sh
# One command: 《叮之前》 Before the Ding (Tabletop App Flythrough demo)
#   sh styles/desktop-flythrough/demo/build.sh        Chinese voice-over, the library demo  → styles/desktop-flythrough/desktop-flythrough.mp4
#   sh styles/desktop-flythrough/demo/build.sh en     English voice-over (same picture, same clock) → desktop-flythrough-en.mp4
# Steps: fonts → voice (edge-tts, checked with Whisper) → voice clock → events → score, foley, mix → picture → master → reading-time check → stills.
# Fonts and sample packs are not in git: fonts come from github.com/google/fonts (OFL), samples from tools/fetch.sh (CC0).
# edge-tts is an online service: the voice step needs the internet.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=desktop-flythrough
VOLANG=${1:-zh}
FPS=30
FRAME=56.85                                          # the closing wide view, title landed, before the sign-off: poster and README frame
STILL=15.8                                           # the compress card: gallery style frame (rendered without the subtitle bar)
cd "$LIB"
mkdir -p "$HERE/out" "$HERE/fonts"

# fonts (gitignored)
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/fonts/InstrumentSans.ttf" ] || curl -sfL -o "$HERE/fonts/InstrumentSans.ttf" "$GF/instrumentsans/InstrumentSans%5Bwdth,wght%5D.ttf"
[ -f "$HERE/fonts/IBMPlexMono-Medium.ttf" ] || curl -sfL -o "$HERE/fonts/IBMPlexMono-Medium.ttf" "$GF/ibmplexmono/IBMPlexMono-Medium.ttf"
[ -f "$HERE/fonts/IBMPlexMono-SemiBold.ttf" ] || curl -sfL -o "$HERE/fonts/IBMPlexMono-SemiBold.ttf" "$GF/ibmplexmono/IBMPlexMono-SemiBold.ttf"
[ -f "$HERE/tools/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/tools/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
"$PY" "$HERE/tools/subset.py"                        # fonts/NotoSansSC-sub.ttf: every character on screen and in the subtitles
for l in vcsl vsco2ce; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# voice: the Chinese lines set the film's clock (src/vo.js); the English lines start on the same seconds
"$PY" core/tts/tts_zh.py "$HERE/vo/lines.json" "$HERE/vo" --voice zh-CN-XiaoxiaoNeural --rate +15%
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang zh
python3 "$HERE/audio/vo_timeline.py"
VODIR=vo; OUT=$NAME
if [ "$VOLANG" = en ]; then
  "$PY" core/tts/tts_zh.py "$HERE/vo/lines_en.json" "$HERE/vo_en" --voice en-US-AvaNeural --rate +10%
  "$PY" core/tts/asr_check.py "$HERE/vo/lines_en.json" "$HERE/vo_en" --lang en
  VODIR=vo_en; OUT=$NAME-en
fi
DUR=$(python3 -c "import json;print(json.load(open('$HERE/vo/timeline.json'))['dur'])"); export DUR

# events and camera speed from the page, then the score, the foley and the mix (about -16 LUFS before the master)
node core/render/events.mjs "$HERE" --out "$HERE/out/events.json"
node "$HERE/tools/camspeed.mjs" "$HERE/out/camspeed.json"
"$PY" -I "$HERE/audio/compose.py"
"$PY" -I "$HERE/audio/foley.py" "$HERE/out/events.json" "$HERE/out/camspeed.json" "$HERE/music/harmony.json" "$HERE/out/sfx.wav"
VO_DIR=$VODIR "$PY" -I "$HERE/audio/mix.py" "$HERE/music/score.wav" "$HERE/out/sfx.wav" "$HERE/out/mix_$VOLANG.wav" -4

# picture and master (mux.sh brings the mix to -14 LUFS)
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix_$VOLANG.wav" "$FILM/$OUT.mp4" $FPS 0

# reading time of the words in the world and the sign-off (window.TEXTS)
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster (from the film) and the gallery style frame (from the page, without the subtitle bar)
if [ "$VOLANG" = zh ]; then
  ffmpeg -v error -y -ss $FRAME -i "$FILM/$OUT.mp4" -frames:v 1 -q:v 2 "$FILM/poster.jpg"
  node core/render/still.mjs "$HERE" $STILL --size 1920x1080 --q nosub=1 --out "$HERE/stills" --prefix sf_
  mv "$HERE/stills/sf_$STILL.jpg" "$HERE/stills/styleframe.jpg"
fi
echo "done: $FILM/$OUT.mp4"
