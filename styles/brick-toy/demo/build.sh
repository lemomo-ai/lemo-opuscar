#!/bin/sh
# One command: "Rocket from Spare Parts" (Brick Toy demo)
#   sh styles/brick-toy/demo/build.sh                    rebuild the film, subtitles, poster and style frame in place
#   OUT=<dir> sh styles/brick-toy/demo/build.sh          write the film, .srt, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/brick-toy/demo/build.sh   stop after the sound and the subtitles (no frame render)
# Steps: music sources, voice + speech check, picture events, score edit, mix, subtitles, picture (24 fps), master, stills.
# Needs the core and voice tiers (setup.sh deps voice), the HDRI pack (sh tools/fetch.sh hdri: photo_studio_loft_hall_2k.hdr),
# curl and network for the two Kevin MacLeod tracks (CC BY 4.0, see CREDITS). Voices, score, mix.wav and out/ are rebuilt
# inside demo/ (gitignored) whatever OUT says.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../brick-toy/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../brick-toy
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=brick-toy
FPS=24
POSTER=45.925                                        # the astronaut on the brick moon, "...starts with one brick": poster (frames 1102-1103)
FRAME=45.84                                          # the 12 fps pose just before it: gallery style frame (frames 1100-1101)
DEST=${OUT:-$FILM}; unset OUT
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out"
cd "$LIB"

# 0. sources not in git: the HDRI pack, the two tracks and their beat grids (librosa beat_track at 22.05 kHz)
[ -f core/assets/polyhaven/photo_studio_loft_hall_2k.hdr ] || sh tools/fetch.sh hdri
M="$HERE/music"; IC=https://incompetech.com/music/royalty-free/mp3-royaltyfree
[ -f "$M/Monkeys_Spinning_Monkeys.mp3" ] || curl -sSfL -o "$M/Monkeys_Spinning_Monkeys.mp3" "$IC/Monkeys%20Spinning%20Monkeys.mp3"
[ -f "$M/Heroic_Age.mp3" ] || curl -sSfL -o "$M/Heroic_Age.mp3" "$IC/Heroic%20Age.mp3"
for s in Monkeys_Spinning_Monkeys Heroic_Age; do
  [ -f "$M/${s}_beats.npy" ] || "$PY" -c 'import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1]); np.save(sys.argv[2], librosa.beat.beat_track(y=y, sr=sr, units="time")[1])' "$M/$s.mp3" "$M/${s}_beats.npy"
done

# 1. voice: Kokoro bm_george (narrator) and am_adam (radio countdown), every line checked by Whisper
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"

# 2. picture events -> events.json (foley times), score edit -> music/score.wav, mix -> mix.wav
node core/render/events.mjs "$HERE"
(cd "$M" && "$PY" edit.py)
"$PY" "$HERE/mix.py"

# 3. subtitles: the same intervals as the pill in main.js (line start -0.05 -> end of voice +0.5; the countdown stacks until ignition)
node --input-type=module -e '
import fs from "fs";
const [story, durs, out] = process.argv.slice(1);
const S = await import("data:text/javascript;base64," + fs.readFileSync(story).toString("base64"));
const dur = JSON.parse(fs.readFileSync(durs, "utf8")); const said = [];
const cues = S.VO.map(v => v.radio ? (said.push(v.text), { t0: v.t - .05, t1: S.T.ignite, text: said.join("  ") })
                                    : { t0: v.t - .05, t1: v.t + dur[v.id] + .5, text: v.text });
fs.writeFileSync(out, JSON.stringify(cues));' "$HERE/story.js" "$HERE/voices/dur.json" "$HERE/out/srt.json"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 4. picture (12 fps stop-motion acting inside a 24 fps film) and master: -14 LUFS, grain 2
node core/render/video.mjs "$HERE" --fps $FPS --workers 2 --out "$HERE/out/video24.mp4"
sh core/render/mux.sh "$HERE/out/video24.mp4" "$HERE/mix.wav" "$DEST/$NAME.mp4" $FPS 2

# 5. poster and gallery style frame: frames of the finished film (subtitle pill included)
ffmpeg -v error -y -ss $POSTER -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$DEST/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
