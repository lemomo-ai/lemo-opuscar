"""Self-check: score hit points (music/score.json) ↔ picture events (events.json) ↔ timeline (timeline.json), item by item. python tools/cuecheck.py"""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open(os.path.join(D, 'music/score.json')))['keys']; E = json.load(open(os.path.join(D, 'events.json')))['ev']
K = json.load(open(os.path.join(D, 'timeline.json')))['keys']
def ev(ty, i=0): xs = sorted(e['t'] for e in E if e['type'] == ty); return xs[i] if i < len(xs) else None
def mk(k, i=None): m = M[k]; return m[i] if i is not None else (m[0] if isinstance(m, list) else m)
pairs = [
 ('C1_bass_in', None, ev('gouge_u'), 'first U-gouge set carves the ridge'),
 ('C1_frame', 2, ev('brayer'), 'brayer inks the block'),
 ('C2_motif_start', None, ev('paper_land'), 'first print settles'),
 ('C3_heartbeat', 0, K['cut_hands'], 'cut to close-up of the hands'),
 ('C4_pizz', 0, ev('gift_pot'), 'copper pot drops into the crucible'),
 ('C4_pizz', 1, ev('gift_candle'), 'candlestick'),
 ('C4_pizz', 2, ev('gift_keys'), 'keys'),
 ('C4_pizz', 3, ev('gift_spoon'), 'spoon'),
 ('C4_woodblock_run', 1, ev('gift_bracelet'), 'bracelet'),
 ('C4_woodblock_run', 2, ev('cloth_grip'), 'the boy grips the compass'),
 ('C5_anvil_first', None, ev('bellows', 0), 'workshop · first pump of the bellows'),
 ('C5_glow_swell', None, ev('molten_bubble', 0), 'copper melts to orange'),
 ('C5_forge_tang', 2, ev('pour', 0), 'first pour'),
 ('C5_smash', None, ev('mould_smash'), 'hammer smashes the clay mould'),
 ('C5_reveal_dominant', None, ev('dust'), 'bell revealed'),
 ('C5_cut', None, ev('clunk'), 'dead clunk · music cuts'),
 ('C8_cello_in', None, ev('compass_click'), 'compass lid "click"'),
 ('C9_anvil16_start', None, ev('fire_roar', 1), 'second bellows'),
 ('C9_roll_start', None, ev('tongs_clank', 1), 'crucible lifted'),
 ('C9_pour2_hit', None, ev('pour', 1), 'second pour (the peak)'),
 ('C9_drop_drone', None, ev('steam'), 'bell unveiled · steam'),
 ('C9_fade', 0, ev('peel', 1), 'paper peels back into the bell tower'),
 ('H_strings_in', None, K['strings'], "strings enter (the bell's afterglow)"),
 ('H_final_chord', None, ev('knife_bite', 1), 'last cut on the end card'),
 ('end', None, json.load(open(os.path.join(D, 'events.json')))['dur'], 'end'),
]
mx = 0; print(f"{'score cue':20s} {'score s':>8s} {'pic s':>8s} {'diff ms':>8s}  picture event")
for k, i, t, name in pairs:
    m = mk(k, i); d = (t - m) * 1000; mx = max(mx, abs(d))
    print(f"{k + ('' if i is None else f'[{i}]'):20s} {m:8.3f} {t:8.3f} {d:+8.1f}  {name}")
# silences: the score must have no hit points inside them
for a, b, nm in [(K['clunk'] + .05, K['click'] - .01, 'silence 1'), (K['silence2'], K['bell'] - .01, 'silence 2')]:
    bad = [(k, v) for k, v in M.items() for x in (v if isinstance(v, list) else [v]) if isinstance(x, (int, float)) and a < x < b and k != 'sr']
    print(f"{nm} {a:.2f}–{b:.2f}: {len(bad)} score cues inside {bad}")
print('max offset %.1f ms over %d items' % (mx, len(pairs)))
