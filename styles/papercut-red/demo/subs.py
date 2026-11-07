"""Build cues.json from the VO table in story.js + voices/dur.json (same rule as SUBS in the page), then export .srt"""
import json, re, os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(D, '../../..'))
src = open(os.path.join(D, 'story.js')).read()
vo = [(float(t), txt.replace('\\u2019', '’')) for t, txt in re.findall(r"\{ id: 'L\d', t: ([\d.]+), text: '((?:[^'\\]|\\.)*)' \}", src)]
ids = re.findall(r"id: '(L\d)'", src); dur = json.load(open(os.path.join(D, 'voices', 'dur.json'))); DUR = float(re.search(r'DUR = ([\d.]+)', src).group(1))
cues = []
for i, ((t, txt), id_) in enumerate(zip(vo, ids)):
    nxt = vo[i + 1][0] - .15 if i + 1 < len(vo) else DUR
    cues.append({'t0': round(t - .05, 3), 't1': round(min(nxt, t + max(1.8, dur[id_] + .7)), 3), 'text': txt})
json.dump(cues, open(os.path.join(D, 'out', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
subprocess.run([sys.executable, os.path.join(ROOT, 'core/render/srt.py'), os.path.join(D, 'out', 'cues.json'), os.path.join(D, '..', 'papercut-red.srt')], check=True)
for c in cues: print(c)
