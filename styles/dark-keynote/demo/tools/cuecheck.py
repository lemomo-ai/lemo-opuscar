"""Self-check: score (music/score.json) ↔ picture events (events.json), item by item.
① Key sync points compared one by one; ② "one note per element": every generated element's appearance time has to land on a score note.
python styles/dark-keynote/demo/tools/cuecheck.py"""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(D, 'music/score.json'))); KEYS = S['keys']; NOTES = sorted(n[0] for n in S['notes'])
E = json.load(open(os.path.join(D, 'events.json')))['ev']
def ev(ty, i=0): xs = [e['t'] for e in E if e['type'] == ty]; return xs[i] if i < len(xs) else None
pairs = [('stop', ev('freeze'), 'full-screen freeze / silence 1 starts'), ('chord', ev('press'), 'cursor press = full-ensemble chord')] + \
  [(f'check{i+1}', ev('check', i), f'sidebar tick {i+1}') for i in range(3)] + \
  [(f'lock{i+1}', ev('lock', i), f'digit {i+1} locks') for i in range(5)] + \
  [('num_chord', ev('files'), '"files." lands'), ('line2_ping', ev('line2'), '"Sorted in 0.8 seconds."'), ('last_note', ev('to_caret'), 'window collapses into the cursor'), ('final_chord', ev('end_card'), 'end card')]
mx = 0; print(f"{'score cue':14s} {'score s':>8s} {'pic s':>8s} {'diff ms':>8s}  picture event")
for k, t, name in pairs:
    m = KEYS[k]; m = m[0] if isinstance(m, list) else m; d = (t - m) * 1000; mx = max(mx, abs(d))
    print(f"{k:14s} {m:8.3f} {t:8.3f} {d:+8.1f}  {name}")
import bisect
sp = [e for e in E if e['type'] in ('spawn_file', 'spawn_photo', 'spawn_notif') and not e.get('fg')]
worst, miss = 0, 0
for e in sp:
    i = bisect.bisect_left(NOTES, e['t']); d = min(abs(e['t'] - NOTES[j]) for j in (i - 1, i) if 0 <= j < len(NOTES))
    worst = max(worst, d); miss += d > .006
print(f'key cues: max offset {mx:.1f} ms over {len(pairs)} items')
print(f'elements ↔ notes: {len(sp)} elements, max offset {worst * 1000:.1f} ms, {miss} over 6 ms')
