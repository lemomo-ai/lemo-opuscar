"""Hit-point self-check: key picture events (lock / value confirm / ignite / hotspot / CTA / narration start) ↔ score onsets and silence zones.
Usage (repo root): .venv/bin/python styles/hologram-hud/demo/tools/cuecheck.py"""
import os, json
D = os.environ.get('HH_WORK') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EV = json.load(open(os.path.join(D, 'events.json')))['ev']
S = json.load(open(os.path.join(D, 'music', 'score.json')))
on = sorted(o['t'] for o in S['onsets'])
near = lambda t: min(abs(t - x) for x in on)
KEY = {'lock', 'confirm', 'ignite', 'ping', 'cta', 'confirm_small', 'detect', 'scan_done', 'leader', 'dock', 'vo'}
bad, rows = 0, []
for e in EV:
    if e['type'] not in KEY: continue
    g = abs(e['t'] / .125 - round(e['t'] / .125)) * .125          # distance from the 1/16 grid
    d = near(e['t'])
    ok = g < 1e-3 and d < 1 / 24
    bad += not ok
    rows.append(f"{'OK ' if ok else 'BAD'} {e['t']:7.3f} {e['type']:<14} grid {g*1000:5.1f}ms  onset {d*1000:5.1f}ms")
print('\n'.join(rows))
sil = [(e['t'], e['t'] + e['d']) for e in EV if e['type'] == 'silence']
for a, b in sil:
    ms = [s for s in S.get('silence', []) if abs(s[0] - a) < .02 and abs(s[1] - b) < .02]
    print(f"silence {a:.2f}-{b:.2f}: {'OK' if ms else 'BAD (no matching silence in the score)'}"); bad += not ms
print('mismatches:', bad)
