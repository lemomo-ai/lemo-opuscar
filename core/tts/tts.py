"""Kokoro offline voice: python core/tts/tts.py lines.json out_dir
lines.json = [{"id":..., "text":..., "voice":"bm_george", "speed":0.92, "lang":"en-us"}, ...]
  Defaults: voice=af_bella, speed=0.92, lang=en-us. For Chinese use "lang":"cmn" with a zf_*/zm_* voice (works offline, plain timbre).
Writes out_dir/<id>.wav (24 kHz, leading/trailing silence trimmed) and out_dir/dur.json.
Model: kokoro-v1.0.onnx / voices-v1.0.bin in this folder; download with sh tools/fetch.sh voice (about 350 MB).
Path limit: the data folder of espeak-ng (which Kokoro uses to turn text into phonemes) must have a real path, after symlinks, shorter than
         160 bytes (a CJK character counts 3), or it is not found and the error names a path on someone else's machine (the one espeak-ng was
         built on). A library under a short path such as ~/lemo-opuscar is fine; this script checks before it starts and explains.
More natural Chinese, Japanese and other voices: core/tts/tts_zh.py (Microsoft edge-tts, online), same interface and output layout.
"""
import sys, json, os, re
if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
    print(__doc__); sys.exit(0 if len(sys.argv) > 1 and sys.argv[1] in ('-h', '--help') else 2)
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
CJK = re.compile('[぀-ヿ㐀-鿿가-힯豈-﫿]')
DEFAULT_VOICE = {'cmn': 'zf_xiaoxiao'}
lines, out = json.load(open(sys.argv[1], encoding='utf-8')), sys.argv[2]

# check the input first, then load the model (the model takes a few seconds)
wrong = [L['id'] for L in lines if L.get('lang', 'en-us').lower().startswith('en') and CJK.search(L['text'])]
if wrong:
    sys.exit(f"tts.py: line(s) {', '.join(map(str, wrong))} contain Chinese/Japanese/Korean text but lang is English, and Kokoro would read them as noise.\n"
             f"  offline: add \"lang\": \"cmn\" and a zf_*/zm_* voice to those lines;  more natural (needs network): python core/tts/tts_zh.py {sys.argv[1]} {out}")
model, voices = os.path.join(HERE, 'kokoro-v1.0.onnx'), os.path.join(HERE, 'voices-v1.0.bin')
if not (os.path.exists(model) and os.path.exists(voices)):
    sys.exit(f'tts.py: the Kokoro model is not in {HERE}.\n  install the voice tier: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice   (from the library root; it also fetches the model, about 350 MB)')
ESPEAK_LIMIT = 160   # measured: the espeak-ng data directory works when its real path is ≤159 bytes; at ≥160 bytes phontab can't be found (symlinks are resolved first, so the real path is what's measured)
try:
    import espeakng_loader
    espeak_dir = os.path.realpath(espeakng_loader.get_data_path())
except Exception:
    espeak_dir = None   # not installed via espeakng_loader (e.g. the system espeak-ng): don't check, let Kokoro report its own error
if espeak_dir and len(espeak_dir.encode('utf-8')) >= ESPEAK_LIMIT:
    sys.exit(f"tts.py: this library sits under a folder path that is too long for the offline voice engine (espeak-ng).\n"
             f"  its data folder is {len(espeak_dir.encode('utf-8'))} bytes long (a Chinese character counts as 3), the limit is {ESPEAK_LIMIT - 1}:\n"
             f"    {espeak_dir}\n"
             f"  Move the library to a shorter path (e.g. LEMO_OPUSCAR_HOME=~/lemo-opuscar, or a shorter folder for the clone) and run\n"
             f"  `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` there (a moved .venv does not work). No need to move anything for tts_zh.py.")
try: from kokoro_onnx import Kokoro
except ImportError: sys.exit('tts.py: kokoro-onnx is missing: install the voice tier: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice')
k = Kokoro(model, voices)
avail = k.get_voices()
for L in lines:
    v = L.get('voice') or DEFAULT_VOICE.get(L.get('lang', 'en-us'), 'af_bella')
    if v not in avail: sys.exit(f"tts.py: unknown voice '{v}' in line '{L['id']}'.\n  available: {', '.join(avail)}")
os.makedirs(out, exist_ok=True); dur = {}
for L in lines:
    lang = L.get('lang', 'en-us')
    a, sr = k.create(L['text'], voice=L.get('voice') or DEFAULT_VOICE.get(lang, 'af_bella'), speed=L.get('speed', .92), lang=lang)
    nz = np.where(np.abs(a) > (np.abs(a).max() if len(a) else 0) * .02)[0]
    if len(nz): a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]   # trim leading/trailing silence; if the whole clip is nearly silent, keep it as is
    else: print('warning: line', L['id'], 'is silent', file=sys.stderr)
    sf.write(os.path.join(out, f"{L['id']}.wav"), a, sr); dur[L['id']] = round(len(a) / sr, 3)
    print(L['id'], dur[L['id']], L['text'])
json.dump(dur, open(os.path.join(out, 'dur.json'), 'w', encoding='utf-8'), indent=1)
