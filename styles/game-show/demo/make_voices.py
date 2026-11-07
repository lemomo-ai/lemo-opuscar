"""Shouted voice calls with Kokoro (offline, Apache-2.0): voices/shouts.json → voices/<id>.wav (44.1 kHz mono, 16-bit)
Each entry: id, text, voice (Kokoro), speed, pitch (factor, raised without changing the length), fx ("robot" or ""), and optionally
asr (how Whisper writes the call, for the speech check in build.sh).
Every call starts after the same 40 ms of silence, so it lands on its beat in music.py.
Usage (from the library root): .venv/bin/python styles/game-show/demo/make_voices.py [id ...]   (no ids = all)
"""
import json, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../../..'))
lines = json.load(open(os.path.join(HERE, 'voices/shouts.json'), encoding='utf-8'))
only = set(sys.argv[1:]); lines = [l for l in lines if not only or l['id'] in only]
ROBOT = 'aecho=0.8:0.5:5|9:0.3|0.2,highpass=f=160'   # a light metallic ring that keeps the words clear
with tempfile.TemporaryDirectory() as tmp:
    spec = os.path.join(tmp, 'lines.json')
    json.dump([dict(id=l['id'], text=l['text'], voice=l['voice'], speed=l['speed'], lang='en-us') for l in lines], open(spec, 'w'))
    subprocess.run([sys.executable, os.path.join(LIB, 'core/tts/tts.py'), spec, tmp], check=True)
    for l in lines:
        p = l['pitch']
        af = f'adelay=40,asetrate=24000*{p},aresample=44100,atempo={1 / p:.6f}' + (',' + ROBOT if l.get('fx') == 'robot' else '')
        subprocess.run(['ffmpeg', '-nostdin', '-y', '-loglevel', 'error', '-i', os.path.join(tmp, l['id'] + '.wav'), '-af', af,
                        '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', os.path.join(HERE, 'voices', l['id'] + '.wav')], check=True)
        print(l['id'], l['voice'])
