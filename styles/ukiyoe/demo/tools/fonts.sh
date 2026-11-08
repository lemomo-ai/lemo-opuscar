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
get shippori-500.woff2 "https://fonts.gstatic.com/s/shipporiminchob1/v24/wXK1E2wCr44tulPdnn-xbIpJ9RgT9-nKeol_2XKgxn0Euw.woff2"
get shippori-700.woff2 "https://fonts.gstatic.com/s/shipporiminchob1/v24/wXK1E2wCr44tulPdnn-xbIpJ9RgT9-nKMo9_2XKgxn0Euw.woff2"
get shippori-kanji.woff2 "https://fonts.gstatic.com/l/font?kit=wXK1E2wCr44tulPdnn-xbIpJ9RgT9-nKVo5P23in5H8-_RXZDE7W25vpdrc6QOoP0WpmWVU1b9jQ0jEYbmSFyIUvUmfsKExGgph7rtuYO14gDMyLqEC63bJyQlHQpBY8AfVc6-vGCe4&skey=2867c78c9b80ca5d&v=v24"
get yuji-kanji.woff2 "https://fonts.gstatic.com/l/font?kit=BngNUXdTV3vO6Lw5ApOPqPLgxKiB016imHlMp0YYi8XemWgmMW4qkeGyGCGeJldNtdeK0nam1Ei7yQhLaOgxngPhTHqCSBMwXg2wc_7rwvYBS5rRPhfWavKMIBqT&skey=9ffd14150d67040a&v=v9"
