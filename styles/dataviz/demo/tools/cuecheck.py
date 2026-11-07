# Alignment table of score hit points ↔ picture events: music/score.json keys vs events.json (picture events); also reports the 24 fps frame-rounding error
import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = json.load(open(os.path.join(D, 'music/score.json')))['keys']; EV = json.load(open(os.path.join(D, 'events.json')))['ev']
pic = {}
for e in EV:
    if e['type'] == 'dot': pic[f"dot_{e['year']}"] = (e['t'], f"{e['year']} dot lands")
b = [e for e in EV if e['type'] == 'break']; pic['break1'] = (b[0]['t'], '1998 breaks through the top'); pic['break2'] = (b[1]['t'], '2024 breaks through the top')
for ty, nm, lab in [('stop', 'stop', 'hard cut / silence starts'), ('tap2026', 'tap2026', '2026 dot lands'), ('end', 'final_note', 'end card / the 1926 note')]:
    pic[nm] = ([e for e in EV if e['type'] == ty][0]['t'], lab)
pic['morph_start'] = (min(e['t'] for e in EV if e['type'] == 'morph'), 'morph starts')
worst, worstf, n = 0, 0, 0
rows = []
for k, (tp, lab) in pic.items():
    if k not in S: continue
    d = (S[k] - tp) * 1000; fr = (round(tp * 24) / 24 - tp) * 1000
    worst = max(worst, abs(d)); worstf = max(worstf, abs(fr)); n += 1
    rows.append((tp, k, S[k], d, fr, lab))
rows.sort()
for tp, k, s, d, fr, lab in rows:
    if not k.startswith('dot_') or k in ('dot_1926', 'dot_1933', 'dot_1958', 'dot_1998', 'dot_2024', 'dot_2025', 'dot_2026'):
        print(f'{k:12s} score {s:8.3f}  picture {tp:8.3f}  diff {d:+6.2f} ms  frame rounding {fr:+6.1f} ms  {lab}')
print(f'{n} items (101 of them data points), max score ↔ picture offset {worst:.2f} ms; max 24 fps frame rounding {worstf:.1f} ms')
