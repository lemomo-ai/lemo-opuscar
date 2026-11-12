"""Narration timing → subtitle cues (voice/cues.json, read by the page and mix.py) and the film's .srt.

Each line starts at START[id] (full-film seconds, placed on the picture's beats). Long lines are split into two cues at
a word (word timestamps from asr_check's words.json). Writes voice/cues.json and ../ipad-sketch.srt. Every cue: one Chinese line + one English line, held at least
1.8 s and at least its spoken part + 0.6 s.
Run: <LIB>/.venv/bin/python styles/ipad-sketch/demo/tools/cues.py   (build.sh does)
"""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(HERE, 'voice')
START = {'v01': 0.80, 'v02': 3.70, 'v03': 7.60, 'v04': 13.05, 'v05': 17.60, 'v06': 23.20,
         'v07': 27.00, 'v08': 31.18, 'v09': 37.00, 'v10': 40.40}
EN = {'v03': ['Coffee cherries ripen on the branch,', 'from green to red.'],
      'v05': ['The cherries dry whole in the sun,', 'then the husk comes off.'],
      'v08': ['Near 196 °C,', 'they crack, like popcorn.']}
SPLIT = {'v03': 'from', 'v05': 'then', 'v08': 'they'}
lines = json.load(open(os.path.join(V, 'lines.json')))
dur = json.load(open(os.path.join(V, 'dur.json')))
words = json.load(open(os.path.join(V, 'words.json')))
zh = json.load(open(os.path.join(V, 'cues_zh.json')))
cues = []
for L in lines:
    i, t, d = L['id'], START[L['id']], dur[L['id']]
    if i in SPLIT:
        w = next(x for x in words[i] if x[0].strip('.,').lower() == SPLIT[i])
        s = w[1]
        b = t + s + 0.2
        cues.append({'id': i + 'a', 't0': t - 0.55, 't1': b, 'zh': zh[i][0], 'en': EN[i][0], 'spoken': s})
        cues.append({'id': i + 'b', 't0': b, 't1': t + d + 0.85, 'zh': zh[i][1], 'en': EN[i][1], 'spoken': d - s})
    else:
        cues.append({'id': i, 't0': t - 0.3, 't1': t + d + 0.6, 'zh': zh[i][0], 'en': L['text'], 'spoken': d})
cues.sort(key=lambda c: c['t0'])
for a, b in zip(cues, cues[1:]):
    if a['t1'] > b['t0'] - 0.05: a['t1'] = b['t0'] - 0.05
bad = [c for c in cues if c['t1'] - c['t0'] < max(1.8, c['spoken'] + 0.6) - 1e-6]
for c in cues:
    print(f"{c['id']:5} {c['t0']:6.2f}–{c['t1']:6.2f}  {c['t1'] - c['t0']:.2f}s (spoken {c['spoken']:.2f})  {c['en']}")
if bad: print('TOO SHORT:', [c['id'] for c in bad])
json.dump({'start': START, 'dur': dur, 'words': {k: words[k] for k in START}, 'cues': cues},
          open(os.path.join(V, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
fmt = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
with open(os.path.join(HERE, '..', 'ipad-sketch.srt'), 'w', encoding='utf-8') as f:
    for n, c in enumerate(cues, 1):
        f.write(f"{n}\n{fmt(c['t0'])} --> {fmt(c['t1'])}\n{c['zh']}\n{c['en']}\n\n")
print('cues', len(cues), '→ voice/cues.json, ipad-sketch.srt')
