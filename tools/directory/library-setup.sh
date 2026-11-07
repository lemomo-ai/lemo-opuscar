#!/bin/sh
# Lemo-Opuscar library (plugin directory edition): check the tools and install packages. Run from anywhere.
#   sh tools/setup.sh                       report what is missing and which package tiers are installed → LIB=<path>
#   sh tools/setup.sh deps [voice] [music]  install packages: core = Node packages, headless browser, Python core tier;
#                                           voice = TTS and speech check (+ the English voice model); music = pluck.py (numba)
# Everything installs inside this library folder (node_modules/, .venv/, core/tts/); nothing outside it changes.
set -e
LIB=$(cd "$(dirname "$0")/.." && pwd -P)

# Installed packages are tracked by content: a marker holds a checksum of the files they came from (and the Python
# version), so a changed package.json or requirements file triggers a reinstall.
sig() { cat "$@" 2>/dev/null | cksum | cut -d' ' -f1; }
pysig() { echo "$(sig "$1")-$("$LIB/.venv/bin/python" -V 2>&1 | cut -d. -f1,2)"; }
req() { [ "$1" = core ] && echo "$LIB/requirements.txt" || echo "$LIB/requirements-$1.txt"; }
node_ok() { [ "$(cat "$LIB/node_modules/.lemo-ok" 2>/dev/null)" = "$(sig "$LIB/package.json" "$LIB/package-lock.json")" ]; }
py_ok() { [ "$(cat "$LIB/.venv/.lemo-$1" 2>/dev/null)" = "$(pysig "$(req "$1")")" ]; }
# a Python 3.11+ for the venv when uv is absent; kokoro-onnx (voice tier) needs < 3.14, so those come first
find_py() {
  for c in python3.12 python3.13 python3.11 python3 python; do
    "$c" -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null && { echo "$c"; return 0; }
  done
  return 1
}
# Windows (Git Bash): a venv keeps its Python in Scripts/python.exe. Give it the .venv/bin/python every tool calls,
# a shim that also forces UTF-8 (a Chinese Windows defaults to GBK, which can't print ✓ or read our UTF-8 files).
win_shim() {
  [ -f .venv/Scripts/python.exe ] && [ ! -e .venv/bin/python ] || return 0
  mkdir -p .venv/bin
  printf '#!/bin/sh\nPYTHONUTF8=1 PYTHONIOENCODING=utf-8 exec "$(dirname "$0")/../Scripts/python.exe" "$@"\n' > .venv/bin/python
  chmod +x .venv/bin/python
}
# One deps run per library at a time (#23): two sessions sharing a library would otherwise half-install, or remove,
# each other's packages. A lock folder holds the run's pid; a lock whose run is gone is taken over.
lock_deps() {
  lock=$LIB/.lemo-deps.lock; n=0
  until mkdir "$lock" 2>/dev/null; do
    p=$(cat "$lock/pid" 2>/dev/null || true)
    if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then rm -rf "$lock"; continue; fi
    [ $n -gt 0 ] || echo "… another '$1 deps' is installing into $LIB; waiting for it to finish"
    n=$((n + 1)); [ $n -lt 1800 ] || { echo "✗ $lock is still there after 30 minutes: remove it if no install is running"; exit 1; }
    sleep 1
  done
  echo $$ > "$lock/pid"
  trap 'rm -rf "$lock"' EXIT; trap 'exit 1' INT TERM HUP
}

case "$1" in
  deps)
    shift; tiers=core
    for t in "$@"; do case $t in voice|music) tiers="$tiers $t" ;; *) echo "usage: sh tools/setup.sh deps [voice] [music]"; exit 1 ;; esac; done
    cd "$LIB"; lock_deps "sh tools/setup.sh"
    command -v npm >/dev/null || { echo "✗ npm not found: install Node 20+ first"; exit 1; }
    if ! node_ok; then
      cp package-lock.json .package-lock.orig
      npm install --no-audit --no-fund --loglevel=error
      mv .package-lock.orig package-lock.json   # keep the shipped lock file, so the checksum stays the same
      sig package.json package-lock.json > node_modules/.lemo-ok
    fi
    node node_modules/playwright-core/cli.js install chromium-headless-shell   # the renderer's browser (a no-op when present)
    # a venv whose Python is gone (after a Python upgrade) can't be repaired in place: make it again
    win_shim
    [ ! -e .venv ] || .venv/bin/python -c pass 2>/dev/null || { echo "! $LIB/.venv is broken; making it again"; rm -rf .venv; }
    if [ ! -x .venv/bin/python ]; then
      if command -v uv >/dev/null; then uv venv --quiet --python 3.12 .venv
      else py=$(find_py) || { echo "✗ Python 3.11+ is needed (or install uv, which fetches it)"; exit 1; }; "$py" -m venv .venv; fi
      win_shim
    fi
    # uv is a native program: on Windows it needs the venv's Scripts/python.exe, not a bin/python meant for sh
    upy=.venv/bin/python; [ ! -f .venv/Scripts/python.exe ] || upy=.venv/Scripts/python.exe
    for t in $tiers; do
      py_ok "$t" && continue
      if command -v uv >/dev/null; then uv pip install --quiet --python "$upy" -r "$(req "$t")"
      else .venv/bin/python -m pip install --quiet --disable-pip-version-check -r "$(req "$t")"; fi
      pysig "$(req "$t")" > ".venv/.lemo-$t"
    done
    case " $tiers " in *" voice "*) [ -f core/tts/kokoro-v1.0.onnx ] && [ -f core/tts/voices-v1.0.bin ] || sh tools/fetch.sh voice ;; esac
    ;;
  "") ;;
  *) echo "usage: sh tools/setup.sh [deps [voice] [music]]"; exit 1 ;;
esac

# Tools the pipeline needs (report only; installing them is up to the user)
miss=""
if command -v node >/dev/null; then
  [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || miss="$miss node20+(found $(node -v))"
else miss="$miss node20+"; fi
command -v ffmpeg >/dev/null || miss="$miss ffmpeg"
command -v uv >/dev/null || find_py >/dev/null || miss="$miss python3.11+(or uv)"
[ -n "$miss" ] && echo "! missing:$miss"
node_ok && py_ok core || echo "! packages not installed yet: run 'sh tools/setup.sh deps' (a few minutes) before the first render"
# Package tiers: core renders; voice (TTS + speech check) and music (pluck.py) are added when a film needs them
mark() { if "$@"; then printf '✓'; else printf '✗'; fi; }
core_ok() { node_ok && py_ok core; }
voice_ok() { py_ok voice && [ -f "$LIB/core/tts/kokoro-v1.0.onnx" ] && [ -f "$LIB/core/tts/voices-v1.0.bin" ]; }
add=""; voice_ok || add="$add voice"; py_ok music || add="$add music"
tline="packages: core $(mark core_ok) · voice $(mark voice_ok) · music $(mark py_ok music)"
core_ok && [ -n "$add" ] && tline="$tline  (when a film needs them: sh tools/setup.sh deps$add)"
echo "$tline"
echo "LIB=$LIB"
