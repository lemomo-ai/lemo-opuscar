#!/bin/sh
# Two illustrative plates for this demo (server aisle, silicon wafer). Optional: the finished JPEGs are committed in assets/plates/.
# With the Codex CLI: core/image/gen_image.py generates each one (results differ every run), then it is saved as assets/plates/<name>.jpg.
# With another image tool: use the same prompts (prompts/<name>.txt, then prompts/common.txt), export 16:9 (≥ 1600 px wide) and save to assets/plates/<name>.jpg.
# On-screen words are always typeset in code; the plates are tagged "ILLUSTRATION / 示意" ("illustration") whenever visible.
set -e
cd "$(dirname "$0")/.."
LIB=${LIB:-$(cd ../../.. && pwd)}
PY="$LIB/.venv/bin/python"
COMMON=$(cat prompts/common.txt)   # the prompts are in prompts/: <name>.txt for each plate, common.txt appended to both
"$PY" "$LIB/core/image/gen_image.py" --check || exit 4
gen() { out=$("$PY" "$LIB/core/image/gen_image.py" "$(cat "prompts/$1.txt") $COMMON" --aspect 16:9 --out gen --name "$1" --timeout 420) || exit 2
  "$PY" -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=88, optimize=True)" "$out" "assets/plates/$1.jpg"
  echo "assets/plates/$1.jpg"; }
mkdir -p gen assets/plates
gen plate_datacenter
gen plate_wafer
