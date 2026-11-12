#!/bin/sh
# The site's media as one tar for the "site-media" release, which .github/workflows/pages.yml downloads and unpacks before the build.
# What goes in: everything in the media folder (styleboard/media.py's posters, stills, sprites and meta.json per film, OPUSCAR 98's
# frames, legacy/stills at the old addresses, labels.json) and the home page's long take beside them (manifest.json, vid/, still/,
# thumb/, clip/). Not in git (about 250 MB, already compressed: a plain tar). Measuring files stay out.
#   sh tools/site_media.sh [--media DIR] [--out FILE]   pack and check (defaults: site_config.MEDIA, .release/site-media.tar)
#   sh tools/site_media.sh --upload [...]               then upload it to the site-media release (it must exist:
#                                                       gh release create site-media --title "Site media" --notes "…")
set -eu
cd "$(dirname "$0")/.."
MEDIA=""; OUT=".release/site-media.tar"; UPLOAD=0
while [ $# -gt 0 ]; do
  case "$1" in
    --media) MEDIA="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --upload) UPLOAD=1; shift ;;
    *) sed -n '2,10p' "$0"; exit 2 ;;
  esac
done
[ -n "$MEDIA" ] || MEDIA=$(python3 -c 'import sys; sys.dont_write_bytecode = True; sys.path.insert(0, "styleboard"); import site_config; print(site_config.MEDIA)')
[ -d "$MEDIA" ] || { echo "✗ no media folder $MEDIA (python3 styleboard/media.py, or --media DIR)"; exit 1; }

# the bundle has what the build reads and the site serves
missing=""
for f in manifest.json labels.json films o98 vid still thumb clip legacy/stills; do [ -e "$MEDIA/$f" ] || missing="$missing $f"; done
[ -z "$missing" ] || { echo "✗ $MEDIA lacks:$missing"; exit 1; }
films=$(find "$MEDIA/films" -name meta.json | wc -l | tr -d ' ')
sprites=$(find "$MEDIA/films" -name sprite.webp | wc -l | tr -d ' ')
[ "$films" = "$sprites" ] || { echo "✗ $films films with meta.json but $sprites sprites (python3 styleboard/media.py)"; exit 1; }
if grep -rlE '/Users/[^/]+/|/home/[^/]+/' "$MEDIA" --include='*.json' --exclude='.*' >/dev/null 2>&1; then echo "✗ a json in $MEDIA names a path on this machine"; exit 1; fi

# out: measuring files, dotfiles (bookkeeping of the tools that rendered the long take), feature/ (a link to the film, no longer used)
mkdir -p "$(dirname "$OUT")"
set --
for f in $(ls "$MEDIA"); do
  case "$f" in label-rects.json|checks.json|search.json|feature) ;; *) set -- "$@" "$f" ;; esac
done
tar -cf "$OUT" -C "$MEDIA" --exclude='*/.*' "$@"
if tar -tvf "$OUT" | grep -q '^l'; then echo "✗ $OUT holds a symlink: the bundle must be plain files"; tar -tvf "$OUT" | grep '^l' | head -3; exit 1; fi
n=$(tar -tf "$OUT" | grep -vc '/$' || true)
size=$(du -k "$OUT" | cut -f1)
[ "$n" -gt "$films" ] || { echo "✗ $OUT holds only $n files"; exit 1; }
echo "✓ $OUT: $n files, $((size / 1024)) MB, $films films with their media (from $MEDIA)"

if [ "$UPLOAD" = 1 ]; then
  gh release view site-media >/dev/null 2>&1 || { echo "✗ no site-media release: gh release create site-media --title \"Site media\" --notes \"…\""; exit 1; }
  [ "$(basename "$OUT")" = site-media.tar ] || { echo "✗ pages.yml downloads site-media.tar: pack with --out <dir>/site-media.tar"; exit 1; }
  gh release upload site-media "$OUT" --clobber
  echo "✓ uploaded; the next push to main (or a manual run of the gallery workflow) builds the site with it"
fi
