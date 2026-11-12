#!/bin/sh
# Loudness of mix.wav: integrated LUFS, true peak, LRA (ffmpeg ebur128), and low-end share below 60 Hz.
HERE=$(cd "$(dirname "$0")/.." && pwd)
ffmpeg -hide_banner -nostats -i "$HERE/mix.wav" -af ebur128=peak=true -f null - 2>&1 | grep -A16 Summary | grep -E "I:|LRA:|Peak:" | grep -v Threshold
ffprobe -v error -show_entries format=duration -of csv=p=0 "$HERE/mix.wav"
