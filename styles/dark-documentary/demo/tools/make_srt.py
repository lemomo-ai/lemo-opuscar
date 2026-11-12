"""Bilingual .srt from events.json + vo/wav/dur.json (same timing as the burned-in captions: line start − 0.15 s → end + 0.45 s).
Run from the library root:  .venv/bin/python styles/dark-documentary/demo/tools/make_srt.py out.srt"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = json.load(open(os.path.join(HERE, 'events.json')))['ev']
dur = json.load(open(os.path.join(HERE, 'vo', 'wav', 'dur.json')))
fmt = lambda s: '%02d:%02d:%02d,%03d' % (s // 3600, s % 3600 // 60, s % 60, round(s % 1 * 1000) % 1000)
cues = [(e['t'] - 0.15, e['t'] + dur[e['id']] + 0.45, e['zh'], e['en']) for e in ev if e['type'] == 'vo']
cues.sort()
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    for i, (a, b, zh, en) in enumerate(cues, 1):
        f.write(f'{i}\n{fmt(max(0, a))} --> {fmt(b)}\n{zh}\n{en}\n\n')
short = min(b - a for a, b, *_ in cues)
print(sys.argv[1], len(cues), 'cues · shortest', round(short, 2), 's')
