#!/bin/sh
# Publish local changes: refresh the gallery data, check the repo, pack and upload films and asset packs, verify the releases.
# After it passes, when a style's film was added, changed or removed:  sh tools/films_repo.sh, then sh tools/films_repo.sh --push
# (the films repository the site plays the style films from, before main; MAINTAINING.md, The site). Then:
#   git add -A && git commit -m "…" && git push     (add -A: the new files must go in too)
# Don't commit tools/assets.json from a run that failed: it may point at packs that were never uploaded.
set -e
cd "$(dirname "$0")/.."
python3 styleboard/build.py
sh tools/web_cuts.sh
python3 tools/release.py check
python3 tools/release.py pack
python3 tools/release.py upload
python3 tools/release.py verify
echo
git status --short 2>/dev/null | head -30 || true
echo "Ready. When a style's film was added, changed or removed: sh tools/films_repo.sh, check it, then sh tools/films_repo.sh --push"
echo "      (the films repository, before main). Then: git add -A && git commit -m \"…\" && git push      (-A, not -a: untracked files are part of the release)"
