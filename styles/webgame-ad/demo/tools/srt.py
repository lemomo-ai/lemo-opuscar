"""<slug>.srt from the subtitle cues in timeline.json (subs: id, t0, t1, zh, en), the same cues the page draws: one Chinese
line and one English line per cue. usage: python styles/webgame-ad/demo/tools/srt.py <out.srt>"""
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
subs = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))['subs']
def ts(x):
    ms = round(x * 1000); return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)
out = [f"{k + 1}\n{ts(max(0, q['t0']))} --> {ts(q['t1'])}\n{q['zh']}\n{q['en']}\n" for k, q in enumerate(subs)]
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(out))
print(f'{sys.argv[1]}: {len(subs)} cues')
