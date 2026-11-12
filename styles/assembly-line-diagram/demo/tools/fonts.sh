#!/bin/sh
# Font subsets: collects every character used in demo/*.js and timeline.json and fetches subsets through the Google Fonts CSS API (rebuilt every run)
#   Noto Sans SC (SIL OFL 1.1) · Big Shoulders Display (SIL OFL 1.1) · Archivo (SIL OFL 1.1)
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); D=$HERE/fonts; mkdir -p "$D"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
font() { url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?$1" | grep -o 'https://[^)]*' | head -1); curl -fsS -o "$D/$2.tmp" "$url"; mv "$D/$2.tmp" "$D/$2"; }
ZH=$(python3 - "$HERE" <<'PY'
import sys, os, re, urllib.parse
h = sys.argv[1]; s = ''
for f in os.listdir(h):
    if f.endswith('.js') or f == 'timeline.json': s += open(os.path.join(h, f), encoding='utf-8').read()
cs = sorted(set(c for c in s if ord(c) > 0x2E80 and not c.isspace()) | set('，。：（）0123456789'))
print(urllib.parse.quote(''.join(cs)))
PY
)
EN=$(python3 -c "import urllib.parse;print(urllib.parse.quote(\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?×·-—→'()&/\"))")
for w in 900 700 500; do font "family=Noto+Sans+SC:wght@$w&text=$ZH" sanssc$w.woff2; done
for w in 900 800 700; do font "family=Big+Shoulders+Display:wght@$w&text=$EN" bsd$w.woff2; done
for w in 800 600; do font "family=Archivo:wght@$w&text=$EN" arc$w.woff2; done
echo "fonts ok: $(ls "$D" | wc -l) files"
