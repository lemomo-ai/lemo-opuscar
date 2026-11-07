#!/bin/sh
# Download large assets that are not in git, from the "assets" release on GitHub.
# An interrupted download resumes when you run the same command again. It needs about 2.2x the pack's size
# in free disk space (the download, then the unpacked files).
set -e
cd "$(dirname "$0")/.."
LIBS="freepats karoryfer salamander vcsl vsco2ce"
usage() {
  cat <<USAGE
usage: sh tools/fetch.sh voice | hdri | textures | instruments <lib> | instruments all
  voice              Kokoro TTS model (English, offline) → core/tts/
  hdri               Poly Haven HDRIs → core/assets/polyhaven/
  textures           Poly Haven walnut veneer textures → core/assets/polyhaven/
  instruments <lib>  one sample library → core/audio/instruments/  (libs: $LIBS)
  instruments all    every sample library (about 1.4 GB)
USAGE
  exit 1
}
case "$1" in
  voice|hdri|textures) PACKS=$1 ;;
  instruments)
    case " $LIBS all " in *" $2 "*) ;; *) usage ;; esac
    if [ "$2" = all ]; then PACKS=""; for l in $LIBS; do PACKS="$PACKS instruments-$l"; done; else PACKS="instruments-$2"; fi ;;
  *) usage ;;
esac
# the library's own Python when it has one; the system's python3 otherwise (3.8+ is enough here)
if [ -x .venv/bin/python ]; then PY=.venv/bin/python; else PY=python3; fi
command -v "$PY" >/dev/null || { echo "✗ python3 is needed to run this script"; exit 1; }
# -X utf8: on Windows the console's legacy code page (cp1252) can't encode ↓ ✓ ✗, and Python would stop with UnicodeEncodeError
"$PY" -X utf8 tools/fetch.py $PACKS
