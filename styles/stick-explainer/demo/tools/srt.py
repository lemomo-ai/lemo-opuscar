"""Subtitles: events.json ('sub' events) → ../stick-explainer.srt (one Chinese line + one English line per cue)."""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, 'events.json')))
FROM = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return '%02d:%02d:%06.3f' % (h, m, s)
out = []
for i, e in enumerate([e for e in D['ev'] if e['type'] == 'sub'], 1):
    t0, t1 = e['t'] - FROM, e['t1'] - FROM
    out.append(f"{i}\n{ts(t0).replace('.', ',')} --> {ts(t1).replace('.', ',')}\n{e['zh']}\n{e['en']}\n")
open(os.path.join(os.path.dirname(HERE), 'stick-explainer.srt'), 'w').write('\n'.join(out))
print('srt cues', len(out), 'shortest %.2f s' % min(e['t1'] - e['t'] for e in D['ev'] if e['type'] == 'sub'))
