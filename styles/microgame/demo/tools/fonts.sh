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
get TitanOne-Regular.ttf "$GF/ofl/titanone/TitanOne-Regular.ttf"
get LilitaOne-Regular.ttf "$GF/ofl/lilitaone/LilitaOne-Regular.ttf"
get VT323-Regular.ttf "$GF/ofl/vt323/VT323-Regular.ttf"
get ArchitectsDaughter-Regular.ttf "$GF/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf"
get GochiHand-Regular.ttf "$GF/ofl/gochihand/GochiHand-Regular.ttf"
get Silkscreen-Regular.ttf "$GF/ofl/silkscreen/Silkscreen-Regular.ttf"
get Silkscreen-Bold.ttf "$GF/ofl/silkscreen/Silkscreen-Bold.ttf"
get Inter.ttf "$GF/ofl/inter/Inter[opsz,wght].ttf"
