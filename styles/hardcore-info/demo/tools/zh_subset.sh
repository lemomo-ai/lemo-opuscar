#!/bin/sh
# Chinese subset: every Chinese character on screen (whole film), fetched as a Noto Sans SC subset from the Google Fonts CSS API (OFL).
# The character list fonts/zh-chars.txt is written by tools/timeline.py; after changing subtitles or on-screen Chinese, run timeline.py first, then this script
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
CHARS=$(cat "$HERE/fonts/zh-chars.txt")   # made from the subtitles and on-screen text in timeline.json

ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(open(sys.argv[1]).read()))" "$HERE/fonts/zh-chars.txt")
for W in 500 700; do
  URL=$(curl -s -A "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@$W&text=$ENC" | grep -o 'https://[^)]*' | head -1)
  curl -sfL -o "$HERE/fonts/NotoSansSC-$W-sub.woff2" "$URL"
done
curl -sfL -o "$HERE/fonts/OFL-NotoSansSC.txt" https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt
ls -la "$HERE/fonts"
