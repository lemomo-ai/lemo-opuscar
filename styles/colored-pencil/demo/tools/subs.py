"""Bilingual .srt from the page's subtitle events (events.json): one cue per narration line, Chinese over English.
Usage (library root): .venv/bin/python styles/colored-pencil/demo/tools/subs.py <out.srt>"""
import json, os, sys, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))
D = json.load(open(os.path.join(HERE, 'events.json')))
cues = [{'t0': max(0, e['t']), 't1': min(D['dur'], e['t1']), 'text': e['zh'] + '\n' + e['en']} for e in D['ev'] if e['type'] == 'sub' and e['t1'] > 0 and e['t'] < D['dur']]
p = os.path.join(HERE, 'out', 'cues.json'); json.dump(cues, open(p, 'w'), ensure_ascii=False, indent=1)
subprocess.run([sys.executable, os.path.join(LIB, 'core/render/srt.py'), p, sys.argv[1]], check=True)
print('cues', len(cues), 'shortest', round(min(c['t1'] - c['t0'] for c in cues), 2) if cues else '-')
