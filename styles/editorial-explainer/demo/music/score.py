"""Original score for "Twenty-Three": marimba ostinato, plucked strings, a soft bass and a shaker, all synthesised here with numpy
(no samples). It reads the cue events the page exports (events.json), so every stop and hit sits on the picture.
python styles/editorial-explainer/demo/music/score.py   → music/score.wav (48 kHz stereo)"""
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../../core/audio'))
from sfx import SR, t_, env_exp, lp, hp, bp, noise, norm, add

ev = json.load(open(os.path.join(HERE, '../events.json')))
CUE = {e['name']: e['t'] for e in ev['ev'] if e['type'] == 'cue'}
DUR = ev['dur'] + 1.0; N = int(DUR * SR); BEAT = .6                       # 100 bpm; the line starts in lines.json sit on this grid
rng = np.random.default_rng(23)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def marimba(m, v=1.0, d=.7):
    f = hz(m); t = t_(d)
    x = np.sin(2 * np.pi * f * t) * env_exp(d, .16) + .32 * np.sin(2 * np.pi * 4 * f * t) * env_exp(d, .045) + .1 * np.sin(2 * np.pi * 9.2 * f * t) * env_exp(d, .02)
    return (x + hp(noise(d), 3000) * env_exp(d, .003) * .12) * v
def pluck(m, v=1.0, d=.9, damp=.5):
    """Karplus–Strong, one period at a time: each period is the low-passed copy of the one before"""
    f = hz(m); P = int(round(SR / f)); n = int(d * SR); per = lp(rng.standard_normal(P), 2600 + 3000 * v); out = np.zeros(n + P)
    for i in range(0, n, P):
        out[i:i + P] = per; per = (damp * per + (1 - damp) * np.roll(per, 1)) * .992
    return hp(out[:n], 80) * np.minimum(1, t_(n / SR) / .002) * v
def bass(m, v=1.0, d=.55):
    f = hz(m); t = t_(d)
    return (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2 * f * t) + .22 * np.sin(2 * np.pi * 3 * f * t)) * env_exp(d, .2) * np.minimum(1, t / .006) * v
def shaker(v=1.0): d = .07; return bp(noise(d), 5000, 11000) * np.sin(np.pi * t_(d) / d) ** 2 * v
def bell(m, v=1.0, d=1.6): f = hz(m); t = t_(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * 2.76 * f * t) * env_exp(d, .25)) * env_exp(d, .5) * v

CH = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]]       # Am · F · C · G, one bar each
PAT = [0, 2, 1, 2, 0, 2, 3, 2]
mar, plk, bas, shk, hit = (np.zeros((N, 2)) for _ in range(5))

def groove(t0, t1, level=1.0, strings=False, low=True, sixteenths=None):
    """bars on the grid from t0 to t1; sixteenths = (a, b): the marimba doubles its notes between those times, getting louder"""
    k = int(round(t0 / (BEAT / 2)))
    while k * BEAT / 2 < t1 - .01:
        t = k * BEAT / 2; bar = int(t // (BEAT * 4)) % 4; step = k % 8; ch = CH[bar]
        add(mar, marimba(ch[PAT[step]] + 12, .55 + .25 * (step % 4 == 0)), t, .20 * level, pan=-.25 + .1 * (step % 2))
        if sixteenths and sixteenths[0] <= t < sixteenths[1]:
            u = (t - sixteenths[0]) / (sixteenths[1] - sixteenths[0])
            add(mar, marimba(ch[PAT[(step + 3) % 8]] + 24, .5), t + BEAT / 4, .08 + .16 * u, pan=.3)
            add(shk, shaker(), t + BEAT / 4, .03 + .05 * u, pan=.2)
        add(shk, shaker(), t, (.05 if step % 2 else .028) * level, pan=.15)
        if low and step in (0, 5): add(bas, bass(ch[0] - 12 if ch[0] > 52 else ch[0]), t, .30 * level)
        if strings and step in (2, 6): [add(plk, pluck(m, .6), t, .11 * level, pan=.35) for m in ch[1:3]]
        k += 1

def stab(t, bar, v=1.0, high=0):
    for i, m in enumerate(CH[bar]): add(hit, pluck(m + high, .9, 1.4), t + i * .004, .16 * v, pan=-.3 + .2 * i)
    add(hit, marimba(CH[bar][3] + 12 + high, 1, 1.2), t, .26 * v); add(bas, bass(CH[bar][0] - 12 if CH[bar][0] > 52 else CH[bar][0], 1, .9), t, .34 * v)

groove(0, CUE['guess'], .8, low=False)                                    # the question: marimba and shaker only
groove(CUE['guess'], CUE['silence1'], .9)                                 # the guess: the bass comes in
stab(CUE['answer'], 2, 1.1)                                               # silence, then 23 lands on a C chord
groove(CUE['answer'] + BEAT * 4, CUE['trick'], .8, strings=True)
groove(CUE['trick'], CUE['land'], 1.0, strings=True, sixteenths=(CUE['fan'], CUE['land']))   # the pairs multiply: the beat divides
stab(CUE['land'], 3, 1.0)
add(hit, bell(88, .8), CUE['match'], .16, pan=.2); add(hit, bell(91, .8), CUE['match'] + .15, .14, pan=-.2)
groove(CUE['land'] + BEAT * 2, CUE['curve'], .7, low=False)
groove(CUE['curve'], CUE['silence2'], 1.0, strings=True)
stab(CUE['fifty'], 2, .7); stab(CUE['ninetynine'], 2, .9, high=12)
t = CUE['last']                                                            # the last line over almost nothing: single marimba notes
for i, m in enumerate([69, 72, 76, 72]): add(mar, marimba(m, .6, 1.2), t + i * BEAT * 1.0, .16, pan=-.1)
stab(CUE['final'], 2, 1.2)
groove(CUE['final'] + BEAT * 2, CUE['final'] + BEAT * 8, .55, low=False)
add(hit, bell(84, .7, 2.4), CUE['final'] + BEAT * 8, .18); add(mar, marimba(72, .8, 1.6), CUE['final'] + BEAT * 8, .24)

mix = mar + plk + bas * .9 + shk + hit
mix = np.stack([hp(mix[:, c], 35) for c in range(2)], 1); mix /= max(1e-9, np.abs(mix).max()) / .8
assert np.isfinite(mix).all()
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
lo = np.sqrt(np.mean(bp(mix[:, 0], 20, 120) ** 2)); al = np.sqrt(np.mean(mix[:, 0] ** 2))
print('score %.1f s · low band %.1f dB rel. to all' % (DUR, 20 * np.log10(lo / al)))
