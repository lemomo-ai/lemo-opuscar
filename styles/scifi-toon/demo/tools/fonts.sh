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
get baloo2.woff2 "https://fonts.gstatic.com/s/baloo2/v23/wXKrE3kTposypRyd51jcAM4olXc.woff2"
get titanone.woff2 "https://fonts.gstatic.com/s/titanone/v17/mFTzWbsGxbbS_J5cQcjClDgm-khykw.woff2"
get vt323.woff2 "https://fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2isfFJXUdVNF.woff2"
get bungee.woff2 "https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0DXR1C9zfmQ.woff2"
