#!/bin/sh
# The Chinese font subset (fonts/NotoSansSC-VF-sub.woff2) from every CJK character in index.html, film.js and the subtitles
# in voice/lines.json. Source: Noto Sans SC variable (OFL) in fonts/src/, fetched by build.sh. Run from anywhere.
D="$(cd "$(dirname "$0")" && pwd)"; LIB=${LIB:-$(cd "$D/../../.." && pwd)}
SRC="$D/fonts/src/NotoSansSC-VF.ttf"
TXT=$("$LIB/.venv/bin/python" -c "import sys,re;s=''.join(open(f,encoding='utf-8').read() for f in sys.argv[1:]);print(''.join(sorted(set(re.findall(r'[　-〿一-鿿＀-￯]',s)))))" "$D/index.html" "$D/film.js" "$D/voice/lines.json")
"$LIB/.venv/bin/pyftsubset" "$SRC" --text="${TXT}0123456789%.,×÷·:=+-→ " --flavor=woff2 --output-file="$D/fonts/NotoSansSC-VF-sub.woff2" --layout-features='*'
echo "subset: $(printf %s "$TXT" | wc -m | tr -d ' ') CJK characters"
