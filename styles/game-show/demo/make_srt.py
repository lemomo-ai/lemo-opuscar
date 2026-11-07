# Builds ../game-show.srt from the v:* hits in events.json + the lines in voices/shouts.json
# The film only has English shouted calls (the on-screen title cards are Chinese and burned into the picture), so the srt holds only the calls; the same line repeated back-to-back (gap < 0.15 s) is merged into one entry.
# Usage: python make_srt.py [out.srt]
import json, os, sys, wave
os.chdir(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '../game-show.srt'
TXT = {l['id']: l['text'] for l in json.load(open('voices/shouts.json', encoding='utf-8'))}
def dur(n):
    w = wave.open(f'voices/{n}.wav'); return w.getnframes() / w.getframerate()
ALIAS = {'hey': 'hey_a', 'crowd': 'hey_a', 'heyAll': 'hey_a', 'heyBig': 'hey_a', 'heyVar': 'hey_a'}
cues = []
for e in json.load(open('events.json'))['ev']:
    if not e['s'].startswith('v:'): continue
    v = ALIAS.get(e['s'][2:], e['s'][2:])
    text = TXT[v].replace('A. I.', 'AI').replace('G. P. T.', 'GPT')   # spelled out for the voice, written normally on screen
    t0 = e['t'] - 0.03; t1 = t0 + max(0.6, dur(v) + 0.1)
    if cues and cues[-1][2] == text and t0 - cues[-1][1] < 0.15: cues[-1][1] = t1; continue
    if cues and cues[-1][1] > t0: cues[-1][1] = t0 - 0.01
    cues.append([t0, t1, text])
fmt = lambda t: f'{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}'
with open(OUT, 'w', encoding='utf-8') as f:
    for i, (a, b, s) in enumerate(cues, 1): f.write(f'{i}\n{fmt(max(0, a))} --> {fmt(b)}\n{s}\n\n')
print(OUT, len(cues), 'cues')
