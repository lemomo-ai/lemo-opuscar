#!/bin/sh
# Noto Sans SC (SIL OFL 1.1), subset to the Chinese the film prints: every CJK character in demo/*.js and timeline.json
# (subtitles, footer, model sheet), fetched through the Google Fonts CSS API with &text= (TECHNIQUE.md §11).
# build.sh runs it after the timeline; it fetches again only when the character set changed (out/fonts-chars.txt), so a new
# subtitle never falls back to a system font and an unchanged film builds offline. The film sets Chinese at weight 500 only.
#   sh styles/instruction-manual/demo/tools/fonts.sh      -> demo/fonts/NotoSansSC-500.woff2
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); D=$HERE/fonts; OUT=$D/NotoSansSC-500.woff2; STAMP=$HERE/out/fonts-chars.txt
mkdir -p "$D" "$HERE/out"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
ZH=$(python3 -I - "$HERE" <<'PY'
import sys, os, urllib.parse
h = sys.argv[1]; s = ''
for f in sorted(os.listdir(h)):
    if f.endswith('.js') or f == 'timeline.json': s += open(os.path.join(h, f), encoding='utf-8').read()
cs = sorted(set(c for c in s if ord(c) > 0x2E80 and not c.isspace()) | set('，。：、？！（）0123456789'))
print(urllib.parse.quote(''.join(cs)))
PY
)
if [ -s "$OUT" ] && [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$ZH" ]; then echo "fonts ok (unchanged)"; exit 0; fi
url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500&text=$ZH" | grep -o 'https://[^)]*' | head -1)
[ -n "$url" ] || { echo "fonts.sh: Google Fonts returned no font URL"; exit 1; }
curl -fsS -o "$OUT.tmp" "$url"; mv "$OUT.tmp" "$OUT"; printf '%s' "$ZH" > "$STAMP"
echo "fonts ok: NotoSansSC-500.woff2 $(wc -c < "$OUT" | tr -d ' ') bytes"
