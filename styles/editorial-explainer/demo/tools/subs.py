"""Subtitle cues, as the page shows them (the 'sub' events in events.json) → out/subs.json, for core/render/srt.py.
Checks that the last cue of each line stays at least max(1.8 s, its speech + 0.6 s)."""
import json, os
D = os.path.dirname(os.path.abspath(__file__)) + '/..'
ev = json.load(open(f'{D}/events.json')); lines = json.load(open(f'{D}/lines.json')); dur = json.load(open(f'{D}/voices/dur.json'))
cues = [{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in ev['ev'] if e['type'] == 'sub']
i = 0
for L in lines:
    part = cues[i:i + len(L['subs'])]; i += len(L['subs']); last = part[-1]; end = L['t'] + dur[L['id']]
    assert last['t1'] - last['t0'] >= 1.8 - 1e-6 and last['t1'] >= end + .6 - 1e-6, (L['id'], last, end)
    for a, b in zip(part, part[1:]): assert abs(a['t1'] - b['t0']) < .01, (L['id'], a, b)
os.makedirs(f'{D}/out', exist_ok=True); json.dump(cues, open(f'{D}/out/subs.json', 'w'), indent=1); print(len(cues), 'cues ok')
