#!/bin/sh
# Fonts for the Sketchnote demo (not in git; all SIL OFL 1.1, licences copied next to them):
#   Kalam Bold, Patrick Hand        github.com/google/fonts (ofl/kalam, ofl/patrickhand)
#   ZCOOL KuaiLe (subset)           Google Fonts CSS2 API with &text= (only the characters the film uses)
# usage: sh tools/fonts.sh <demo folder>
set -e
F="$1/fonts"; mkdir -p "$F"
G=https://github.com/google/fonts/raw/main/ofl
curl -sfL -o "$F/Kalam-Bold.ttf" "$G/kalam/Kalam-Bold.ttf"
curl -sfL -o "$F/OFL-kalam.txt" "$G/kalam/OFL.txt"
curl -sfL -o "$F/PatrickHand-Regular.ttf" "$G/patrickhand/PatrickHand-Regular.ttf"
curl -sfL -o "$F/OFL-patrickhand.txt" "$G/patrickhand/OFL.txt"
curl -sfL -o "$F/OFL-zcoolkuaile.txt" "$G/zcoolkuaile/OFL.txt"
# every Chinese character on the page and in the subtitles (a plain user agent gets a .ttf back)
CHARS='%0123456789。一万上么之二些从住出分初到劳勺化匙十千只叫右后含哪囊回在多大她始子它家对封就巢左带干开怎成扇把攒整是最朵来样水然物生用的磅种笔糖翅膀花茶蜂蜜蜡装要视觉解记课转辈辛这进那部酶酿采里降，：？'
Q=$(python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))" "$CHARS")
URL=$(curl -sf "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&text=$Q" | grep -o 'https://[^)]*' | head -1)
curl -sfL -o "$F/ZCOOLKuaiLe-subset.ttf" "$URL"
echo "fonts ok"
