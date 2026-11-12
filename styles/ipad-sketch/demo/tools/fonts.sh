#!/bin/sh
# Fonts for the Tablet Sketch Explainer demo (not in git; all SIL OFL 1.1, licences copied next to them):
#   Caveat Bold / Medium   github.com/google/fonts (ofl/caveat), static instances cut from the variable font (fontTools)
#   Long Cang (subset)     github.com/google/fonts (ofl/longcang), cut to tools/zh-longcang.txt (Chinese on the page)
#   LXGW WenKai (subset)   github.com/lxgw/LxgwWenKai (v1.245.1, pinned), cut to tools/zh-subs.txt (Chinese subtitles)
# usage: sh tools/fonts.sh <demo folder> <python with fontTools>
set -e
F="$1/fonts"; PY="$2"; T=$(mktemp -d); mkdir -p "$F"
G=https://github.com/google/fonts/raw/main/ofl
curl -sfL -o "$T/Caveat.ttf" "$G/caveat/Caveat%5Bwght%5D.ttf"
"$PY" -m fontTools.varLib.instancer "$T/Caveat.ttf" wght=700 -o "$F/Caveat-Bold.ttf" -q
"$PY" -m fontTools.varLib.instancer "$T/Caveat.ttf" wght=500 -o "$F/Caveat-Medium.ttf" -q
curl -sfL -o "$F/OFL-caveat.txt" "$G/caveat/OFL.txt"
curl -sfL -o "$T/LongCang.ttf" "$G/longcang/LongCang-Regular.ttf"
"$PY" -m fontTools.subset "$T/LongCang.ttf" --text-file="$1/tools/zh-longcang.txt" --output-file="$F/LongCang-subset.ttf"
curl -sfL -o "$F/OFL-longcang.txt" "$G/longcang/OFL.txt"
curl -sfL -o "$T/LXGWWenKai.ttf" "https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.245.1/fonts/TTF/LXGWWenKai-Regular.ttf"
"$PY" -m fontTools.subset "$T/LXGWWenKai.ttf" --text-file="$1/tools/zh-subs.txt" --output-file="$F/LXGWWenKai-subset.ttf" 2>/dev/null
curl -sfL -o "$F/OFL-lxgwwenkai.txt" "https://raw.githubusercontent.com/lxgw/LxgwWenKai/main/OFL.txt"
rm -rf "$T"
echo "fonts ok"
