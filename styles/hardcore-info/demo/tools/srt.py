"""Bilingual subtitles in timeline.json → ../<slug>.srt (two lines per cue: Chinese, English).  python styles/hardcore-info/demo/tools/srt.py"""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
def ts(t): ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
SLUG = os.path.basename(os.path.dirname(HERE)); OUT = os.path.join(os.path.dirname(HERE), SLUG + '.srt')
with open(OUT, 'w', encoding='utf-8') as f:
    for i, s in enumerate(TL['subs'], 1): f.write(f"{i}\n{ts(s['t0'])} --> {ts(s['t1'])}\n{s['zh']}\n{s['en']}\n\n")
print(os.path.basename(OUT), len(TL['subs']), 'cues; shortest', min(round(s['t1'] - s['t0'], 2) for s in TL['subs']), 's')
