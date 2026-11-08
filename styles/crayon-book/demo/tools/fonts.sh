#!/bin/sh
# The fonts this page uses (SIL Open Font License 1.1, named in ../CREDITS) are not kept in git. This fetches each one into
# fonts/, the same files the film was made with: google/fonts pinned to one commit, or a versioned Google Fonts file.
# Files already there are kept; FORCE=1 fetches them again. build.sh runs it first.
set -e
D=$(cd "$(dirname "$0")/.." && pwd)/fonts; mkdir -p "$D"
GF=https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b
get() {
  [ -s "$D/$1" ] && [ -z "$FORCE" ] && return 0
  # into a plain name first: Git Bash on Windows hands curl a path with [ ] in it unconverted
  curl -fsSL -g --retry 2 -o "$D/download.part" "$2" ||
    { rm -f "$D/download.part"; echo "✗ could not fetch fonts/$1 from $2 (offline, or behind a proxy? curl uses https_proxy)" >&2; exit 1; }
  mv "$D/download.part" "$D/$1"; echo "fonts/$1"
}
get patrickhand_PatrickHand-Regular.ttf "$GF/ofl/patrickhand/PatrickHand-Regular.ttf"
get gaegu_Gaegu-Regular.ttf "$GF/ofl/gaegu/Gaegu-Regular.ttf"
get gaegu_Gaegu-Bold.ttf "$GF/ofl/gaegu/Gaegu-Bold.ttf"
get shortstack_ShortStack-Regular.ttf "$GF/ofl/shortstack/ShortStack-Regular.ttf"
get gochihand_GochiHand-Regular.ttf "$GF/ofl/gochihand/GochiHand-Regular.ttf"
get caveatbrush_CaveatBrush-Regular.ttf "$GF/ofl/caveatbrush/CaveatBrush-Regular.ttf"
get sniglet_Sniglet-Regular.ttf "$GF/ofl/sniglet/Sniglet-Regular.ttf"
