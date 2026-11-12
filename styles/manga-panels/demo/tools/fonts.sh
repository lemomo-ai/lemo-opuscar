#!/bin/sh
# Font subsets (Google Fonts, OFL), downloaded if missing. After adding new characters, delete the matching woff2 and rerun.
HERE=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$HERE/fonts"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
font() {
  [ -s "$HERE/fonts/$2" ] && return 0
  url=$(curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?$1" | grep -o 'https://[^)]*' | head -1)
  curl -fsS -o "$HERE/fonts/$2" "$url"
}
q() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
ZH='街角光在跑人群一秒就变了举起来别眨眼下一格是现对焦零点二把风停我手里每都决定性瞬间三十你留这页第口袋相机新品黑白漫画面分音乐合成生图代码与均为虚构牌产，。、：《》（）…·×+/0123456789.KOMANEsLemoLabClaudeOpusSCdxnumpy '
JP='カシャッザワバチキギンラタシースョロジサピドクパニコKOMAONE!！'
font "family=Noto+Sans+SC:wght@900&text=$(q "$ZH")" sanssc900.woff2
font "family=Noto+Serif+SC:wght@900&text=$(q "$ZH")" serifsc900.woff2
font "family=Dela+Gothic+One&text=$(q "$JP")" dela.woff2
font "family=Barlow+Condensed:ital,wght@1,800&text=$(q 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-/·—×+:()!? ')" barlow.woff2
font "family=Barlow+Condensed:wght@600&text=$(q 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-/·—×+:()!? ')" barlow600.woff2
ls -la "$HERE/fonts"
