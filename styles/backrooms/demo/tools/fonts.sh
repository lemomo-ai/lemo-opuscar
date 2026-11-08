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
get IBMPlexMono-500.woff2 "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJwlBFgsAXHNk.woff2"
get IBMPlexMono-600.woff2 "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgsAXHNk.woff2"
get IBMPlexSans-400.woff2 "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2"
get IBMPlexSans-600.woff2 "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2"
get IBMPlexSans-700.woff2 "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYbSB4Zh.woff2"
get IBMPlexSansCondensed-600.woff2 "https://fonts.gstatic.com/s/ibmplexsanscondensed/v15/Gg8gN4UfRSqiPg7Jn2ZI12V4DCEwkj1E4LVeHY527LvspYYnFBq4.woff2"
get IBMPlexSansCondensed-700.woff2 "https://fonts.gstatic.com/s/ibmplexsanscondensed/v15/Gg8gN4UfRSqiPg7Jn2ZI12V4DCEwkj1E4LVeHY4S7bvspYYnFBq4.woff2"
