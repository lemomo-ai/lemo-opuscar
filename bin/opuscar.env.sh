# lemo-opuscar: environment for a GPU-less box (see bin/opuscar for the why).
# Source this from a shell profile, a cron entry or a systemd unit when calling
# `node core/render/*.mjs` directly instead of going through the wrapper.
export OPUSCAR_REPO="${OPUSCAR_REPO:-/opt/opuscar}"
export LEMO_ANGLE="${LEMO_ANGLE:-swiftshader}"
