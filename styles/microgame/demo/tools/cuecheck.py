"""Self-check: score hit points (music/score.json) ↔ picture events (events.json), aligned item by item. python tools/cuecheck.py"""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(D, 'music/score.json')))['keys']; E = json.load(open(os.path.join(D, 'events.json')))['ev']
def ev(ty, i=0): xs = [e['t'] for e in E if e['type'] == ty]; return xs[i] if i < len(xs) else None
seg = {s['id']: s for s in json.load(open(os.path.join(D, 'timeline.json')))['segs']}
pairs = [('G1_cmd', seg['G1']['t0'], 'command PUMP!')] + [(f'G1_pump{i+1}', ev('pump', i), f'pump {i+1}') for i in range(4)] + [
 ('G1_float', ev('float_up'), 'rocket floats up'), ('S1_click_gap', ev('crown', 0), 'Tick taps the crown'), ('G2_cmd', seg['G2']['t0'], "command DON'T SNEEZE!"), ('G2_dust', ev('dust', 0), 'dust drifts in'),
 ('G2_achoo', ev('sneeze'), 'ACHOO, ink all over the visor'), ('S2_click_gap', ev('crown', 1), 'taps the crown'), ('G3_cmd', seg['G3']['t0'], 'command STRAP IN!')] + [(f'G3_belt{i+1}', ev('ratchet', i), f'seat-belt notch {i+1}') for i in range(3)] + [
 ('G3_buckle', ev('buckle'), 'buckled [##]'), ('S3_click_gap', ev('crown', 2), 'taps the crown'), ('G4_cmd', seg['G4']['t0'], 'command CATCH!'), ('G4_catch', ev('grab'), 'grabs the sandwich'), ('G4_chomp_gap', ev('chomp'), 'CHOMP'),
 ('S4_button', ev('button'), 'button close-up slams down')] + [(f'SPEED_reel{k}', ev('reel_stop', k - 1), f'slot reel {k} stops') for k in (1, 2, 3)] + [
 ('G5_cmd', seg['G5']['t0'], 'command DODGE!')] + [(f'G5_over{i+1}', ev('jump', i) + .2, f'meteor {i+1} cleared') for i in range(3)] + [
 ('S5_click_gap', ev('crown', 3), 'taps the crown'), ('G6_cmd', seg['G6']['t0'], 'command ZIP!')] + [(f'G6_zip{i+1}', ev('zip', i), f'zip tooth {i+1}') for i in range(6)] + [
 ('G6_stamp', ev('red_stamp'), 'red stamp OK'), ('S6_click_gap', ev('crown', 4), 'taps the crown'), ('G7_cmd', seg['G7']['t0'], 'command SALUTE!'), ('G7_swing', ev('swing'), 'arm starts swinging'), ('G7_bonk', ev('bonk'), 'red ball knocked away'),
 ('G7_bounce1', ev('bounce', 0), 'red ball lands, bounce 1'), ('G7_bounce2', ev('bounce', 1), 'red ball lands, bounce 2'), ('G7_resume', ev('replay_out'), 'replay ends'), ('S7_lightsoff', ev('lights_off'), 'lights out'),
 ('BOSS_land', seg['BOSS']['t0'], 'command LAND IT!'), ('BOSS_pull', ev('lever'), 'PULL! lever'), ('BOSS_chute', ev('chute_pop'), 'pixel parachute pops'), ('BOSS_err', ev('err'), 'ERR'), ('BOSS_dust', ev('dust', 1), 'ink dust drifts in at the porthole'),
 ('BOSS_achoo', ev('sneeze_big'), 'ACHOO → ink spray'), ('BOSS_splash', ev('splash'), 'lands in the red circle'), ('BOSS_clear', ev('clear'), 'CLEAR!'), ('RESULT_salute', ev('salute'), 'closing salute'), ('RESULT_ding', ev('tick_hand'), 'second hand back to zero'),
 ('END_chord', seg['END']['t0'], 'end card'), ('END_button', ev('rocket_pop'), 'skyrocket')]
mx = 0; print(f"{'score cue':16s} {'score s':>8s} {'pic s':>8s} {'diff ms':>8s}  picture event")
for k, t, name in pairs:
    m = K[k]; m = m[0] if isinstance(m, list) else m; d = (t - m) * 1000; mx = max(mx, abs(d))
    print(f"{k:16s} {m:8.3f} {t:8.3f} {d:+8.1f}  {name}")
print('max offset %.1f ms over %d items' % (mx, len(pairs)))
