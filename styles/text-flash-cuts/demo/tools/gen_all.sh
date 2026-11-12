#!/bin/sh
# Draws the demo's 11 images in order from prompts/prompts.json with an image generator (core/image/gen_image.py, which
# needs the user's Codex CLI; see core/README.md, "Image generation"). "@name" in a "ref" list = the image already drawn
# as gen/<name>_*.png, passed as a reference. A name that already has gen/<name>_*.png is skipped. build.sh never calls it.
# With another image tool: use the same prompts, aspect and references, and save gen/<name>_<anything>.png.
HERE=$(cd "$(dirname "$0")/.." && pwd); cd "$HERE"
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
PY=${PY:-"$LIB/.venv/bin/python"}; [ -x "$PY" ] || PY=python3
GEN="$LIB/core/image/gen_image.py"
"$PY" "$GEN" --check || exit 4
mkdir -p gen
n=$("$PY" -c "import json;print(len(json.load(open('prompts/prompts.json'))))")
i=0
while [ $i -lt $n ]; do
  eval "$("$PY" - "$i" <<'PY'
import json, sys, glob, shlex
p = json.load(open('prompts/prompts.json'))[int(sys.argv[1])]
refs = []
for r in p['ref']:
    if r.startswith('@'):
        g = sorted(f for f in glob.glob(f'gen/{r[1:]}_*.png') if 'wrongaspect' not in f)
        if not g: print(f'echo "{p["name"]} needs gen/{r[1:]}_*.png first"; exit 1'); sys.exit()
        refs.append(g[0])
    else: refs.append(r)
print('NAME=' + shlex.quote(p['name']), 'ASPECT=' + shlex.quote(p['aspect']), 'PROMPT=' + shlex.quote(p['prompt']),
      'REFS=' + shlex.quote(' '.join('--ref ' + x for x in refs)))
PY
)"
  if ls gen/${NAME}_*.png 2>/dev/null | grep -qv wrongaspect; then echo "skip $NAME"; else
    echo "== $NAME"
    "$PY" "$GEN" "$PROMPT" --aspect "$ASPECT" --out gen --name "$NAME" $REFS --timeout 360 || echo "FAIL $NAME"
  fi
  i=$((i+1))
done
