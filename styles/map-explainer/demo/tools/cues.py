"""Subtitle cues from the narration timeline (voice/subs.json start times + out/voice/dur.json lengths) -> voice/cues.json.
The page draws its subtitles from this file and build.sh turns it into map-explainer.srt, so both always match.
Each cue: one Chinese line + one English line; it stays up until just before the next line starts,
never shorter than the spoken line + 0.6 s or 1.8 s (checked here).
usage: python3 styles/map-explainer/demo/tools/cues.py
"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
subs = json.load(open(os.path.join(HERE, 'voice', 'subs.json')))
dur = json.load(open(os.path.join(HERE, 'out', 'voice', 'dur.json')))
cues, bad = [], 0
for i, s in enumerate(subs):
    d = dur[s['id']]
    end = subs[i + 1]['t'] - 0.08 if i + 1 < len(subs) else s['t'] + d + 1.0
    need = max(1.8, d + 0.6)
    if end - s['t'] < need - 1e-6 or (i + 1 < len(subs) and s['t'] + d > subs[i + 1]['t'] - 0.3):
        print('TOO SHORT', s['id'], round(end - s['t'], 2), 'need', round(need, 2)); bad += 1
    cues.append({'id': s['id'], 't0': s['t'], 't1': round(end, 3), 'vo_end': round(s['t'] + d, 3), 'zh': s['zh'], 'en': s['en'], 'text': s['zh'] + '\n' + s['en']})
json.dump(cues, open(os.path.join(HERE, 'voice', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print('cues', len(cues), 'shortest', round(min(c['t1'] - c['t0'] for c in cues), 2), 's')
sys.exit(1 if bad else 0)
