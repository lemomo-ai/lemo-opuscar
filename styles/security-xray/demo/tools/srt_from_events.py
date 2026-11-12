# events.json 'sub' entries -> cues json for core/render/srt.py (one Chinese line, one English line per cue)
import json, sys
ev = json.load(open(sys.argv[1]))['ev']
cues = [{'t0': e['t'], 't1': e['t1'], 'text': e['zh'] + '\n' + e['en']} for e in ev if e['type'] == 'sub']
json.dump(cues, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
short = min(c['t1'] - c['t0'] for c in cues)
print(f'{len(cues)} cues, shortest {short:.2f} s')
