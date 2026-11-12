"""Whisper on the finished film: print what it hears per narration line, next to the script (timeline.json)."""
import json, os, re, subprocess, sys, tempfile
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
film = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'pop-art.mp4')
wav = os.path.join(tempfile.mkdtemp(), 'a.wav')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', film, '-ac', '1', '-ar', '16000', wav], check=True)
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'base.en'), device='cpu', compute_type='int8')
segs, _ = m.transcribe(wav, language='en', word_timestamps=True, vad_filter=False)
words = [w for s in segs for w in s.words]
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
norm = lambda s: re.sub(r'[^a-z0-9 ]', '', s.lower().replace('-', ' ')).split()
bad = 0
for L in TL['lines']:
    heard = ' '.join(w.word.strip() for w in words if L['t0'] - .3 <= w.start < L['t1'] + .3)
    a, b = norm(L['en']), norm(heard)
    ok = sum(1 for x in a if x in b) / max(1, len(a))
    flag = 'OK ' if ok >= .8 else 'LOW'; bad += ok < .8
    print(f"{flag} {ok:.2f} {L['t0']:5.2f}  {L['en']}  →  {heard}")
print('lines below 0.8:', bad)
