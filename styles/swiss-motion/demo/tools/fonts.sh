#!/bin/sh
# The fonts this page uses (SIL Open Font License 1.1, named in ../CREDITS) are not kept in git. This fetches each one into
# fonts/, the same files the film was made with: google/fonts pinned to one commit, or a versioned Google Fonts file.
# Files already there are kept; FORCE=1 fetches them again. build.sh runs it first.
set -e
D=$(cd "$(dirname "$0")/.." && pwd)/fonts; mkdir -p "$D"
GF=https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b
get() {
  [ -s "$D/$1" ] && [ -z "$FORCE" ] && return 0
  curl -fsSL -g --retry 2 -o "$D/$1.part" "$2" ||
    { rm -f "$D/$1.part"; echo "✗ could not fetch fonts/$1 from $2 (offline, or behind a proxy? curl uses https_proxy)" >&2; exit 1; }
  mv "$D/$1.part" "$D/$1"; echo "fonts/$1"
}
get Archivo-VF.ttf "$GF/ofl/archivo/Archivo[wdth,wght].ttf"
get UnifrakturMaguntia-Regular.ttf "$GF/ofl/unifrakturmaguntia/UnifrakturMaguntia-Book.ttf"
get DMSerifDisplay-Regular.ttf "$GF/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf"
