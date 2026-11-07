#!/bin/sh
# One command: "Pip's Paper Adventure" (Paper Pop-up Book demo)
#   sh styles/paper-popup/demo/build.sh                    rebuild the film, subtitles, poster and style frame in place
#   OUT=<dir> sh styles/paper-popup/demo/build.sh          write the film, .srt, poster.jpg and styleframe.jpg to <dir> instead
#   STOP_BEFORE_VIDEO=1 sh styles/paper-popup/demo/build.sh   stop after the sound and the subtitles (no frame render)
# Steps: three.js, Poly Haven assets, fonts, music sources, voice + speech check, score edit, sound events, mix, subtitles,
# picture (60 fps, the demo's own render.mjs), master (mux.sh, zsh), stills.
# Needs the core and voice tiers (setup.sh deps voice), the HDRI pack (sh tools/fetch.sh hdri), npm, zsh, curl and network
# for the two Poly Haven models (CC0), the Google Fonts (OFL) and three Kevin MacLeod tracks (CC BY 4.0), see CREDITS.
# Voices, score, mix.wav and out/ are rebuilt inside demo/ (gitignored) whatever OUT says; voices/dur.json and
# events.json are rewritten in place (in git).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)                 # .../paper-popup/demo
FILM=$(cd "$HERE/.." && pwd)                         # .../paper-popup
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}            # styles/<slug>/demo -> library root
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=paper-popup
WORKERS=${WORKERS:-8}                                # the published film used 8; use 2 when other jobs share the GPU
POSTER=14.8                                          # the whole Papervale spread popped up, book edge and desk visible
FRAME=79.6                                           # the whale spouting confetti, Pip in the boat: gallery style frame
DEST=${OUT:-$FILM}; unset OUT                        # mux.sh reads OUT itself (as a file name)
mkdir -p "$DEST"; DEST=$(cd "$DEST" && pwd)                 # absolute: the steps below run from other folders
STILLS="$HERE/stills"; [ "$DEST" = "$FILM" ] || STILLS="$DEST"
mkdir -p "$DEST" "$STILLS" "$HERE/out" "$HERE/assets"
cd "$LIB"

# 0. sources not in git
# three.js r170 for the page's import map (demo/node_modules)
[ -f "$HERE/node_modules/three/build/three.module.js" ] || (cd "$HERE" && npm ci --no-audit --no-fund)
# Poly Haven (CC0): four are byte-identical to core/assets/polyhaven/, two models come from the Poly Haven API (1k glTF)
[ -f core/assets/polyhaven/lythwood_lounge_2k.hdr ] || sh tools/fetch.sh hdri
for a in lythwood_lounge_2k.hdr walnut_diff.jpg walnut_nor.jpg walnut_rough.jpg tea_set_01 desk_lamp_arm_01; do
  [ -e "$HERE/assets/$a" ] || cp -R "core/assets/polyhaven/$a" "$HERE/assets/"
done
for m in alarm_clock_01 potted_plant_04; do
  [ -f "$HERE/assets/$m/$m.gltf" ] || "$PY" -I -c 'import json, os, sys, urllib.request
name, out = sys.argv[1], sys.argv[2]
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "lemo-opuscar-build"})).read()
g = json.loads(get(f"https://api.polyhaven.com/files/{name}"))["gltf"]["1k"]["gltf"]
for rel, f in [(f"{name}.gltf", g)] + list(g["include"].items()):
    p = os.path.join(out, name, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(get(f["url"]))
print("assets/" + name)' "$m" "$HERE/assets"
done
# fonts (gitignored .woff2 from Google Fonts, the Chinese one cut to the characters in the script; also rewrites fonts.css)
[ -f "$HERE/fonts/f0.woff2" ] || (cd "$HERE" && node fetch_fonts.mjs)
# music: three Kevin MacLeod tracks, decoded to 48 kHz stereo for music/edit.py
IC=https://incompetech.com/music/royalty-free/mp3-royaltyfree
for f in Dreamy_Flashback Jaunty_Gumption Heartwarming; do
  [ -f "$HERE/music/$f.mp3" ] || curl -sSfL -o "$HERE/music/$f.mp3" "$IC/$(echo $f | sed 's/_/%20/g').mp3"
  [ -f "$HERE/music/$f.wav" ] || ffmpeg -v error -y -i "$HERE/music/$f.mp3" -ar 48000 -ac 2 "$HERE/music/$f.wav"
done

# 1. voice: Kokoro af_bella, speed 0.9 -> voices/v01..v15.wav + dur.json; every line checked by Whisper
#    (tts/lines.json is [[id, text], ...]; asr_check.py reads [{id, text, asr}], so a converted copy goes to out/, with
#    tts/asr.json's known transcriptions as "asr": names and spellings Whisper writes its own way)
"$PY" "$HERE/tts/gen.py" af_bella
"$PY" -c 'import json, sys; a = json.load(open(sys.argv[2])); json.dump([dict(id=i, text=t, **({"asr": a[i]} if i in a else {})) for i, t in json.load(open(sys.argv[1]))], open(sys.argv[3], "w"), ensure_ascii=False)' \
  "$HERE/tts/lines.json" "$HERE/tts/asr.json" "$HERE/out/lines_check.json"
#    Any DIFF stops the build: listen to that line
"$PY" core/tts/asr_check.py "$HERE/out/lines_check.json" "$HERE/voices"

# 2. score: Dreamy Flashback -> Jaunty Gumption (bar-aligned jump cut) -> Heartwarming -> music/score.wav
"$PY" "$HERE/music/edit.py"
# 3. sound events from the page (window.EV) -> events.json, then foley + voice + score -> mix.wav
node "$HERE/render.mjs" events
"$PY" "$HERE/mix.py" "$HERE/mix.wav"
# 4. bilingual subtitles (narration and speech bubbles, the same intervals as hud.js)
node "$HERE/make_srt.mjs" "$DEST/$NAME.srt"

[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture (STOP_BEFORE_VIDEO)"; exit 0; }

# 5. picture: 7980 frames at 60 fps in $WORKERS segments -> out/seg_*.mp4 + out/list.txt
node "$HERE/render.mjs" video "$WORKERS"
# 6. master: concat + light luma noise (c0s=2) + loudnorm -14 LUFS / TP -1.2, x264 CRF 17
OUT="$DEST/$NAME.mp4" zsh "$HERE/mux.sh"

# 7. poster and gallery style frame: frames of the finished film
ffmpeg -v error -y -ss $POSTER -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$DEST/poster.jpg"
ffmpeg -v error -y -ss $FRAME -i "$DEST/$NAME.mp4" -frames:v 1 -q:v 2 "$STILLS/styleframe.jpg"
echo "done: $DEST/$NAME.mp4"
