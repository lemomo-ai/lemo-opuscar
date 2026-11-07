"""Score cue points (music/score.json) ↔ picture events (events.json). Run from the repo root."""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(D, 'music/score.json')))['keys']; E = json.load(open(os.path.join(D, 'events.json')))['ev']
ev = lambda ty: [e['t'] for e in E if e['type'] == ty]
pairs = [('land', ev('palm'), 'red cherry drops into the palm'), ('title', ev('title_word'), 'the four title words stand up'), ('cut', ev('cherry_cut'), 'cherry cut open'),
         ('rakes', ev('rake'), 'four rake strokes'), ('suns', ev('sun'), '21 suns'), ('load', ev('box_hold') + [e['t'] for e in E if e['type'] == 'box_land' and not e.get('wave')], 'containers land ×6'),
         ('depart', [e['t'] for e in E if e['type'] == 'ship_engine'], 'ship leaves port'), ('ff', ev('whoosh_ff'), 'fast-forward starts'), ('dive', ev('knife')[1:2] + ev('slide_steel')[:1] + ev('slide_steel')[1:2] + ev('tear'), 'three cutaway layers'),
         ('silence', ev('silence')[:1], 'silence 1'), ('horn', ev('horn'), 'ship horn'), ('pour', ev('beans_metal'), 'green beans poured into the drum'), ('cracks', ev('crack'), 'first crack ×8'),
         ('grind', ev('grinder'), 'grinding'), ('tamp', ev('tamp'), 'tamping'), ('stop', ev('silence')[1:2], 'silence 2'), ('drop', ev('drip'), 'first drop'), ('clink', ev('clink'), 'cup clinks on saucer'),
         ('hand', ev('tag')[1:2], '11,000 km tag'), ('stations', ev('station'), 'all seven stops on the map'), ('card', ev('card'), 'end card')]
mx, n = 0, 0
print(f"{'score cue':10s} {'score s':>8s} {'pic s':>8s} {'diff ms':>8s}  picture event")
for k, ts, name in pairs:
    ms = K[k] if isinstance(K[k], list) else [K[k]]
    if k == 'dive': ms = ms[:4]
    for i, (m, t) in enumerate(zip(ms, ts)):
        d = (t - m) * 1000; mx = max(mx, abs(d)); n += 1
        print(f"{k + ('' if len(ms) == 1 else str(i + 1)):10s} {m:8.3f} {t:8.3f} {d:+8.1f}  {name}")
    if len(ms) != len(ts): print(f"  ! {k}: score {len(ms)} vs picture {len(ts)}")
print('max offset %.1f ms over %d items' % (mx, n))
