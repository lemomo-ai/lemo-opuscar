#!/bin/sh
# Download the OFL fonts into fonts/ (build.sh runs this when they are missing; fonts stay local).
# The Chinese face is a subset: pass the characters the film uses as $1 to refresh it.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); F="$HERE/fonts"; mkdir -p "$F"
B=https://raw.githubusercontent.com/google/fonts/main/ofl
curl -sfL -o "$F/IBMPlexSans.ttf"   "$B/ibmplexsans/IBMPlexSans%5Bwdth,wght%5D.ttf"
curl -sfL -o "$F/OFL-ibmplexsans.txt" "$B/ibmplexsans/OFL.txt"
curl -sfL -o "$F/JetBrainsMono.ttf" "$B/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"
curl -sfL -o "$F/OFL-jetbrainsmono.txt" "$B/jetbrainsmono/OFL.txt"
curl -sfL -o "$F/OFL-notosanssc.txt" "$B/notosanssc/OFL.txt"
CHARS=${1:-$(python3 -c "import sys;s=open(sys.argv[1]).read();print(''.join(sorted(set(c for c in s if '\u3000'<=c<='\u9fff' or '\uff00'<=c<='\uffef'))))" "$HERE/main.js")}
T=$(python3 -c "import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))" "$CHARS")
URL=$(curl -sf -A "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300&text=$T" | grep -o 'https://[^)]*' | head -1)
curl -sfL -o "$F/NotoSansSC-Light-subset.woff2" "$URL"
ls -la "$F"
