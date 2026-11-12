#!/bin/sh
# Regenerate the English narration: Kokoro bm_george (tools/../voice/lines.json), then run asr_check.
# Note: Kokoro adds a breath at the end of v10 that Whisper hears as "antennas", so it is cut at 3.33 s after generation (40 ms fade-out).
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
cd "$LIB"; PY=${PY:-"$LIB/.venv/bin/python"}
"$PY" core/tts/tts.py "$HERE/voice/lines.json" "$HERE/voice"
"$PY" - "$HERE/voice" <<'PY'
import sys, json, numpy as np, soundfile as sf
d = sys.argv[1]; x, sr = sf.read(f'{d}/v10.wav'); n = int(3.33 * sr); y = x[:n].copy(); f = int(.04 * sr); y[-f:] *= np.linspace(1, 0, f)
sf.write(f'{d}/v10.wav', y, sr); j = json.load(open(f'{d}/dur.json')); j['v10'] = round(n / sr, 3); json.dump(j, open(f'{d}/dur.json', 'w'), indent=1)
PY
"$PY" core/tts/asr_check.py "$HERE/voice/lines.json" "$HERE/voice" --lang en
