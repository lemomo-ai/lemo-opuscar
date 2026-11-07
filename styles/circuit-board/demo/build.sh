#!/bin/sh
# One command: 《七毫秒》 Seven Milliseconds (Circuit Board demo)
#   sh styles/circuit-board/demo/build.sh        Chinese voice (the library demo): circuit-board.mp4
#   sh styles/circuit-board/demo/build.sh en     English voice, same picture and subtitles: circuit-board-en.mp4
# Steps: subtitle font, voice + speech check, events, score + mix, picture, master, subtitles (.srt), reading-time check, stills.
# The board's lettering is drawn in code; only the subtitle bar uses a font file (Noto Sans SC, OFL), downloaded from
# github.com/google/fonts in a fresh clone and cut down by tools/subset.py. The voice is Microsoft edge-tts (online).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../<slug>/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../<slug>
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=circuit-board
LANG_=${1:-zh}
FPS=30
FRAME=3.0                                            # the dam, every unit lit, title printed: poster and gallery still (no subtitles)
cd "$LIB"

# subtitle font (gitignored): Noto Sans SC variable -> weight 500, only the characters the subtitles use
GF=https://github.com/google/fonts/raw/main/ofl
[ -f "$HERE/tools/NotoSansSC-VF.ttf" ] || curl -sfL -o "$HERE/tools/NotoSansSC-VF.ttf" "$GF/notosanssc/NotoSansSC%5Bwght%5D.ttf"
"$PY" -I "$HERE/tools/subset.py" "$HERE"

# voice: Chinese zh-CN-XiaoxiaoNeural +20% (voice/), English en-US-AvaNeural +10% with per-line rates (voice_en/); every line checked by Whisper
"$PY" core/tts/tts_zh.py "$HERE/voice/lines.json" "$HERE/voice" --voice zh-CN-XiaoxiaoNeural --rate +20%
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang zh
if [ "$LANG_" = en ]; then
  "$PY" core/tts/tts_zh.py "$HERE/voice_en/lines.json" "$HERE/voice_en" --voice en-US-AvaNeural --rate +10%
  "$PY" core/tts/asr_check.py "$HERE/voice_en/lines.json" "$HERE/voice_en" --lang en
fi

# events from the picture, then the score and effects under the voice (mix.wav / mix_en.wav, about -16 LUFS before the master)
node core/render/events.mjs "$HERE"
if [ "$LANG_" = en ]; then "$PY" "$HERE/audio.py" en; MIX="$HERE/mix_en.wav"; OUT="$FILM/$NAME-en.mp4"
else "$PY" "$HERE/audio.py"; MIX="$HERE/mix.wav"; OUT="$FILM/$NAME.mp4"; fi

# picture (subtitles are drawn by the page) and master (mux.sh brings the mix to -14 LUFS and adds a light grain)
node core/render/video.mjs "$HERE" --fps $FPS --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$MIX" "$OUT" $FPS 1
python3 "$HERE/tools/srt.py" "$HERE" "$FILM/$NAME.srt"

# reading time of every word printed on the boards (window.TEXTS; the subtitle bar follows the voice, see DEMO.md)
mkdir -p "$HERE/out"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -20 "$HERE/out/readcheck.txt"; exit 1; }

# poster and the gallery style frame, rendered without the subtitle bar
node core/render/still.mjs "$HERE" $FRAME --q nosub=1 --out "$HERE/out/still" --prefix p_
cp "$HERE/out/still/p_$FRAME.jpg" "$FILM/poster.jpg"
mkdir -p "$HERE/stills"; cp "$HERE/out/still/p_$FRAME.jpg" "$HERE/stills/styleframe.jpg"
echo "done: $OUT"
