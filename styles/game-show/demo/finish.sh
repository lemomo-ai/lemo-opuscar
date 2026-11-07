#!/bin/sh
# Concatenates the segments produced by `render.mjs video` + mixes in music.wav → finished film
# Usage: sh finish.sh [out.mp4]   default output ../game-show.mp4 (this overwrites the library's finished film; for test runs pass another path, e.g. out/test.mp4)
# Sound and encode: core/render/mux.sh (two-pass loudnorm → −14 LUFS, true peak ≤ −1 dBTP; x264 slow crf 19, AAC 256k 48 kHz, no grain);
# with AUDIO_FROM the picture is encoded here instead (x264 slow crf 16) and the old audio copied
# AUDIO_FROM=old_film.mp4 sh finish.sh …  → no remix, copies the old film's audio track as-is (for re-rendering part of the picture while keeping the audio unchanged)
set -e
cd "$(dirname "$0")"
O="${1:-../game-show.mp4}"
ffmpeg -y -loglevel error -f concat -safe 0 -i out/list.txt -c copy out/video_noaudio.mp4
if [ -n "$AUDIO_FROM" ]; then
  ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i "$AUDIO_FROM" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a copy -movflags +faststart "$O"
  echo "$O (audio copied from $AUDIO_FROM)"; exit 0
fi
# the library's mux: two-pass loudnorm to -14 LUFS, then a true-peak guard so the film peaks at or under -1 dBTP (flat vector picture: no grain)
LIB=${LIB:-$(cd ../../.. && pwd)}   # LIB= when the demo was copied out of the library
sh "$LIB/core/render/mux.sh" out/video_noaudio.mp4 music.wav "$O" 30 0
