"""Self-check of score.wav / score.json"""
import os, json, numpy as np, soundfile as sf
H = os.path.dirname(os.path.abspath(__file__))
x, sr = sf.read(os.path.join(H, 'score.wav')); S = json.load(open(os.path.join(H, 'score.json')))
TL = json.load(open(os.path.join(H, '..', 'timeline.json')))
db = lambda v: 20 * np.log10(max(v, 1e-12))
rms = lambda a, b: np.sqrt(np.mean(x[int(a*sr):int(b*sr)] ** 2))
ok = True
print('len', len(x) / sr, 'ch', x.shape[1], 'sr', sr); ok &= abs(len(x)/sr - TL['dur']) < 1e-3
print('NaN', np.isnan(x).any()); ok &= not np.isnan(x).any()
pk = db(np.abs(x).max()); print(f'peak {pk:.2f} dBFS'); ok &= pk <= -1.0
for a, b in S['silence']:
    r = rms(a, b); print(f'silence {a}-{b}: rms {db(r):.1f} dBFS, max {np.abs(x[int(a*sr):int(b*sr)]).max():.2e}'); ok &= db(r) < -60
off = [o for o in S['onsets'] if abs(o['t'] * 8 - round(o['t'] * 8)) > 1e-6]
print('onsets', len(S['onsets']), 'off-grid', len(off)); ok &= not off
h0 = TL['high'][0]
pre, drop, post = rms(h0 - 2, h0 - 0.5), rms(h0, h0 + 1), rms(h0 + 4, h0 + 6)
print(f'drop: pre {db(pre):.1f}  drop {db(drop):.1f}  lock {db(post):.1f}'); ok &= drop > pre * 1.4 and drop > post * 1.4
segs = [('scan', 0, 4), ('establish', 4, TL['intro'][1] - .5)] + [(f"part {c['i']+1}", c['t0'], c['t1']) for c in TL['calls']] + \
       [('regroup', TL['regroup'][0], TL['regroup'][1] - .5), ('light-up', *TL['high']), ('lock-up', *TL['lock']), ('end', *TL['end'])]
for n, a, b in segs: r = db(rms(a, b)); print(f'{n:9s} {a:5.1f}-{b:5.1f}  {r:6.1f} dBFS  ' + '#' * max(0, int((r + 45))))
print(f'last 20ms max {np.abs(x[-int(.02*sr):]).max():.2e}')
print('ALL OK' if ok else 'FAIL')
