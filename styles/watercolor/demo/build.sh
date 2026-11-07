#!/bin/sh
# One command: "Follow the Rain" (Watercolor Brush demo)
#   sh styles/watercolor/demo/build.sh                    rebuild the film, subtitles, poster and style frame in place
#   OUT=<dir> sh styles/watercolor/demo/build.sh          write the film, .srt, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/watercolor/demo/build.sh   stop after the sound and the subtitles (no frame render)
# Steps: fonts, paper, music source, voice + speech check, score edit, mix, subtitles, picture (60 fps, the demo's own
# render.mjs), master, stills.
# Needs the core and voice tiers (setup.sh deps voice), curl and network for the Google Fonts (OFL) and Scott Buckley's
# "Wildflowers" (CC BY 4.0), see CREDITS. Voices, score, paper.jpg, mix.wav and out/ are rebuilt inside demo/ (gitignored)
# whatever OUT says; voices/dur.json and music/score_beats.json are rewritten in place (in git).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../watercolor/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../watercolor
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=watercolor
WORKERS=${WORKERS:-8}                                # the published film used 8; use 2-3 when other jobs run
POSTER=29                                            # acacia shrubland: seal sun, budgerigars, rain running down the branches, kangaroo
FRAME=38                                             # eucalypt woodland and the koala: gallery style frame
DEST=${OUT:-$FILM}; unset OUT                        # tts/gen.py, music/*.py and render.mjs read OUT themselves
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out"
cd "$LIB"

# 0. sources not in git: fonts (Google Fonts, the Chinese one cut to the script's characters; also rewrites fonts.css),
#    the seeded paper texture, the score's source recording decoded for the edit (music/prep.sh skips what exists)
[ -f "$HERE/fonts/f0.woff2" ] || (cd "$HERE" && node fetch_fonts.mjs)
[ -f "$HERE/paper.jpg" ] || (cd "$HERE" && "$PY" paper.py)
sh "$HERE/music/prep.sh"
[ -f "$HERE/music/wf_beats.json" ] || "$PY" "$HERE/music/analyze.py"   # beat grid of the source (in git)

# 1. voice: Kokoro af_heart, speed 0.93 -> voices/v01..v13.wav + dur.json; every line checked by Whisper
#    (tts/lines.json is [[id, text], ...]; asr_check.py reads [{id, text, asr}], so a converted copy goes to out/, with
#    tts/asr.json's known transcriptions as "asr": names and spellings Whisper writes its own way)
"$PY" "$HERE/tts/gen.py"
"$PY" -c 'import json, sys; a = json.load(open(sys.argv[2])); json.dump([dict(id=i, text=t, **({"asr": a[i]} if i in a else {})) for i, t in json.load(open(sys.argv[1]))], open(sys.argv[3], "w"), ensure_ascii=False)' \
  "$HERE/tts/lines.json" "$HERE/tts/asr.json" "$HERE/out/lines_check.json"
#    Any DIFF stops the build: listen to that line
"$PY" core/tts/asr_check.py "$HERE/out/lines_check.json" "$HERE/voices"

# 2. score: one jump cut in "Wildflowers" (beats[85] -> beats[437]) -> music/score.wav + score_beats.json
"$PY" "$HERE/music/edit.py"
# 3. mix: score + narration (start times from the VO table in scene.js) + synthesised ambience -> mix.wav
"$PY" "$HERE/mix.py" "$HERE/mix.wav"
# 4. bilingual subtitles from the VO table in scene.js, the same intervals as the page: start -0.15 -> start + dur + 0.45
node -e '
const fs = require("fs"); const [scene, out] = process.argv.slice(1);
const m = fs.readFileSync(scene, "utf8").match(/const VO = \[([\s\S]*?)\n\];/);
const VO = new Function("return [" + m[1] + "\n]")();
fs.writeFileSync(out, JSON.stringify(VO.map(([id, s, d, en, zh]) => ({ t0: s - .15, t1: s + d + .45, text: en + "\n" + zh }))));' \
  "$HERE/scene.js" "$HERE/out/srt_cues.json"
"$PY" core/render/srt.py "$HERE/out/srt_cues.json" "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 5. picture: 6816 frames at 60 fps in $WORKERS segments -> out/seg_*.mp4 + out/list.txt (x264 CRF 12 intermediates)
node "$HERE/render.mjs" video "$WORKERS"
# 6. master: concat + x264 slow CRF 16, keyint 120, no grain (the paper is in the picture) + loudnorm -14 LUFS
sh "$HERE/mux.sh" "$DEST/$NAME.mp4"

# 7. poster and gallery style frame: frames of the finished film
ffmpeg -v error -y -ss $POSTER -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$DEST/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
