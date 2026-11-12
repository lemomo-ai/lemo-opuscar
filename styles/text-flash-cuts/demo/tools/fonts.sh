#!/bin/sh
# Font subsets (OFL, Google Fonts CSS API). Character list = every non-ASCII character in main.js (plus a few common punctuation marks); after changing the lines, delete fonts/*.woff2 and rerun.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); D=$HERE/fonts; mkdir -p "$D"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
font() { [ -s "$D/$2" ] && return 0
  url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?$1" | grep -o 'https://[^)]*' | head -1); curl -fsS -o "$D/$2" "$url"; }
CJK=$(python3 -c "
import sys,urllib.parse
s=open(sys.argv[1],encoding='utf-8').read()
cs=sorted(set(c for c in s if ord(c)>0x2000)|set('。，？《》·…0123456789'))
print(urllib.parse.quote(''.join(cs)))" "$HERE/main.js")
font "family=Noto+Serif+SC:wght@900&text=$CJK" serifsc900.woff2
font "family=Noto+Sans+SC:wght@900&text=$CJK" sanssc900.woff2
font "family=Cormorant+Garamond:ital,wght@1,600&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,%E2%80%94-%3A%20%E2%80%99%27%C3%97%C2%B7()" corm600i.woff2
echo "fonts ok"
