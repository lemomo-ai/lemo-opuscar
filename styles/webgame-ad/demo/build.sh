#!/bin/sh
# One command: 「买你这一下」 What Your Tap Costs (Web Game Ad demo)
#   sh styles/webgame-ad/demo/build.sh
# Steps: fonts, instruments, voice + speech check, timeline, score + mix, picture, master, reading-time check,
# subtitles, poster and gallery frame. Fonts and instruments are not in git: they are downloaded here (OFL / CC0 / CC BY,
# see CREDITS). The voice is edge-tts (online).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../webgame-ad/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../webgame-ad
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=webgame-ad
FPS=24
FRAME=0.9                                            # the ad itself, 是兄弟 / 就来砍我 over the fire wall: poster and gallery frame
cd "$LIB"

# fonts (gitignored): Google Fonts subsets of every character the page draws (tools/fonts.py rewrites fonts/fonts.css)
ls "$HERE"/fonts/*.woff* >/dev/null 2>&1 || "$PY" "$HERE/tools/fonts.py"
# sampled instruments (library packs: CC0, the drum kit CC BY)
for l in vcsl vsco2ce karoryfer freepats; do [ -d "core/audio/instruments/$l" ] || sh tools/fetch.sh instruments $l; done

# voice: 21 lines, one fast young male voice for all of them (voice and rate are set per line in lines.json)
"$PY" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/vo" --voice zh-CN-YunxiNeural --rate +40%
# lines.json "asr" spells what Whisper writes for exact homophones (充/冲, 服/符, 土/吐…). At +40 % five lines still come back one
# tone off (是/师, 于/欲, 服/夫, 人/忍, 买/马): a cue to listen, not a failure (DEMO.md, Build notes)
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/vo" --lang zh || echo "(speech check: tone-off differences only; listen to any new line)"

# timeline: every line on the 128 BPM grid, per-character times, cues and subtitle cues (timeline.json); then the score
"$PY" "$HERE/tools/timeline.py"
"$PY" "$HERE/tools/score.py"

# picture and master (mux.sh brings the mix to -14 LUFS; no grain on flat game art); subtitles are drawn by the page
node core/render/video.mjs "$HERE" --fps $FPS --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$FILM/$NAME.mp4" $FPS 0

# reading time of every word on screen (window.TEXTS)
# The demo runs at ad pace: the game UI copy is left out of TEXTS (film.js), and the argument's own numbers land on the word the
# voice says them; DEMO.md lists the blocks that are shorter than the reading time. A film for a user holds them.
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: $(grep -c '^BAD' "$HERE/out/readcheck.txt") blocks short (out/readcheck.txt)"

# bilingual subtitles, poster and the gallery frame (picture only, no subtitle plate)
"$PY" "$HERE/tools/srt.py" "$FILM/$NAME.srt"
node core/render/still.mjs "$HERE" $FRAME --q nosubs --out "$HERE/out" --prefix poster_
cp "$HERE/out/poster_$FRAME.jpg" "$FILM/poster.jpg"
mkdir -p "$HERE/stills" && cp "$HERE/out/poster_$FRAME.jpg" "$HERE/stills/styleframe.jpg"
# the stills DEMO.md shows: the leaderboard, the big spender and the newbie, the sieve, the end card
node core/render/still.mjs "$HERE" 16.3 21.0 42.2 58.5 --q nosubs --out "$HERE/out" --prefix still_
for p in rank:16.3 kill:21.0 sieve:42.2 card:58.5; do cp "$HERE/out/still_${p#*:}.jpg" "$HERE/stills/frame_${p%%:*}.jpg"; done
echo "done: $FILM/$NAME.mp4"
