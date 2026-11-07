"""Mix: material foley (washi / wood / water / glass, all synthesised) + narration + original score (ducked under dialogue) + per-picture ambience → mix.wav
Usage: .venv/bin/python styles/ukiyoe/demo/mix.py (run core/render/events.mjs, tts and music/score.py first)"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, compress, limit, add
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(17)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown(d):
    w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR))
    if A: x[:A] *= np.linspace(0, 1, A)
    if R: x[n - R:] *= np.linspace(1, 0, R)
    return x
def sines(fs, d, taus, amps):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, tau, a in zip(fs, taus, amps))
def slow(d, rate, depth, seed=0):   # slowly undulating envelope
    k = max(2, int(d * rate) + 3); r = np.random.default_rng(seed).random(k)
    return 1 - depth + depth * np.interp(np.linspace(0, k - 1, int(round(d * SR))), np.arange(k), r)

# —— Paper ——
def baren(d=.36, v=1):   # baren (馬連, hand rubbing pad) circling on the back of the paper: band-passed noise + roughly 9 Hz circular modulation
    tt = t_(d); m = .55 + .45 * np.abs(np.sin(2 * np.pi * 4.6 * tt)); e = np.sin(np.pi * tt / d) ** .7
    return norm(bp(nz(d), 700, 5200) * m * e + lp(nz(d), 500) * e * .3) * v
def slip(v=1):   # paper slip dropping / peeling off
    d = .28; tt = t_(d); return norm(hp(nz(d), 1800) * np.sin(np.pi * tt / d) ** 2 * (1 - tt / d * .5)) * v
def seal(v=1):   # vermilion seal pressed on paper: dull thud + fine tack of the seal paste pulling away
    d = .35; x = sines([88, 180], d, [.07, .03], [1, .4]); x[:int(.012 * SR)] += bp(nz(.012), 200, 1500) * .9
    y = np.zeros(int(.45 * SR)); y[:len(x)] += x; k = int(.22 * SR); c = hp(nz(.08), 3000) * env_exp(.08, .02) * .15; y[k:k + len(c)] += c
    return norm(lp(y, 2500)) * v
def scroll(d, v=1):   # handscroll pan: long paper slide + small crinkles
    tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** 1.2
    f = np.interp(tt, [0, d], [1200, 3200]); x = np.zeros_like(tt); blk = 2400
    src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 4800):i + blk], f[i] * .6, f[i] * 1.6)[-len(x[i:i + blk]):]
    cr = hp(nz(d), 4000) * (rng.random(len(tt)) > .9985) * 3
    return norm(x * e + lp(cr, 9000) * e * .4) * v
# —— Wood ——
def block(v=1):   # woodblock set down on the bench
    d = .2; x = sines([180, 410, 960], d, [.05, .03, .015], [1, .6, .3]); x[:int(.004 * SR)] += nz(.004) * .5; return norm(lp(x, 3000)) * v
def step(m='dirt', v=1):
    if m == 'wood':
        d = .18; x = sines([170, 390, 720], d, [.06, .03, .012], [1, .5, .25]); x[:int(.01 * SR)] += bp(nz(.01), 300, 2500) * .6; return norm(lp(x, 2200)) * v
    d = .11; tt = t_(d); return norm(bp(nz(d), 300, 2600) * np.exp(-tt / .03) * (1 + .5 * np.sin(2 * np.pi * 60 * tt))) * v * .7
def cup(v=1):
    d = .5; x = sines([2780, 4120, 6400, 180], d, [.25, .15, .08, .03], [.6, .4, .2, .8]); x[:int(.003 * SR)] += nz(.003) * .4; return norm(x) * v
# —— Glass / metal ——
def chime(v=1):   # wind chime: glass bell + light strikes of the clapper
    d = 2.2; x = sines([2360, 5150, 7980, 2372], d, [.8, .4, .2, .8], [1, .45, .2, .5]); x[:int(.002 * SR)] += nz(.002) * .3
    y = np.zeros(int(2.6 * SR)); y[:len(x)] += x; k = int(.33 * SR); x2 = sines([2360, 5150], 1.8, [.6, .3], [.5, .2]); y[k:k + len(x2)] += x2; return norm(y) * v
# —— Creatures ——
def lark(v=1):
    out = np.zeros(int(1.2 * SR)); t0 = 0
    for i in range(7):
        d = .05 + rng.random() * .05; f0, f1 = 3200 + rng.random() * 1500, 4500 + rng.random() * 2000
        tt = t_(d); f = np.interp(tt, [0, d], [f0, f1]); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)
        k = int(t0 * SR); out[k:k + len(s)] += s; t0 += d + .03 + rng.random() * .06
    return norm(out) * v
def geese(v=1):
    out = np.zeros(int(1.6 * SR))
    for i, t0 in enumerate([0, .35, .5, .95]):
        d = .16; tt = t_(d); f = 420 + 60 * np.sin(np.pi * tt / d); ph = np.cumsum(f) / SR
        s = (2 * (ph % 1) - 1) * np.sin(np.pi * tt / d) ** .5; s = bp(s, 500, 2200)
        k = int(t0 * SR); out[k:k + len(s)] += s * (1 - i * .15)
    return norm(lp(out, 2500)) * v
def kite(v=1):   # kite (bird) call pii-hyoro: long downward glide + trill tail
    d1, d2 = .55, .7; t1 = t_(d1); f1 = np.interp(t1, [0, .1, d1], [2100, 2600, 2150])
    s1 = np.sin(2 * np.pi * np.cumsum(f1) / SR) * np.minimum(1, t1 / .05) * np.exp(-t1 / .8)
    t2 = t_(d2); f2 = 1900 + 250 * np.sin(2 * np.pi * 9 * t2) - 300 * t2 / d2
    s2 = np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.sin(np.pi * t2 / d2) * .7
    y = np.zeros(int(1.5 * SR)); y[:len(s1)] += s1; k = int(.62 * SR); y[k:k + len(s2)] += s2; return norm(y) * v
def sip(v=1):
    d = .35; tt = t_(d); return norm(bp(nz(d), 900, 3500) * np.sin(np.pi * tt / d) ** 3 * (.6 + .4 * np.sin(2 * np.pi * 14 * tt))) * v
def hat(v=1):   # kasa hat (woven straw) rustle
    d = .5; tt = t_(d); return norm(bp(nz(d), 1500, 7000) * np.sin(np.pi * tt / d) ** 2 * (rng.random(len(tt)) > .5)) * v
# —— Wind and water ——
def wind(d, v=1, lo=150, hi=900, seed=1):
    return norm(bp(brown(d) + nz(d) * .02, lo, hi) * slow(d, .6, .6, seed)) * v
def gust(v=1):
    d = 2.2; tt = t_(d); return norm(bp(nz(d), 300, 1800) * np.sin(np.pi * tt / d) ** 2) * v
def rise(d, v=1):   # low rumble of the wave standing up, growing fuller
    tt = t_(d); e = (tt / d) ** 1.6
    return norm(lp(brown(d), 380) * e + bp(nz(d), 600, 3000) * e ** 2 * .35 + np.sin(2 * np.pi * 42 * tt) * e * .25) * v
def crash_(v=1):
    d = .5; tt = t_(d); x = lp(nz(d), 5000) * np.exp(-tt / .25) + sines([48, 70], d, [.3, .2], [1.2, .6]) + hp(nz(d), 3000) * np.exp(-tt / .1) * .5
    return norm(x) * v
def amb(w, d):
    tt = t_(d)
    if w == 'field':
        trick = bp(nz(d), 2000, 6000) * (uniform_filter1d(np.abs(nz(d)), 900) > .92) * 2
        return wind(d, .5, 120, 700, 3) + lp(trick, 7000) * .12
    if w == 'rain':
        bed = hp(nz(d), 900) * .5 + bp(nz(d), 300, 2000) * .25
        drops = np.zeros_like(tt); idx = rng.integers(0, len(tt) - 400, int(d * 60))
        for i in idx: drops[i:i + 200] += np.exp(-np.arange(200) / 30) * (rng.random() - .5) * 3
        return norm(bed + hp(drops, 2500) * .4 + lp(brown(d), 300) * .4) * .55
    if w == 'tea':
        simmer = bp(nz(d), 400, 1500) * (uniform_filter1d(np.abs(nz(d)), 1200) > .9) * 1.5
        return norm(lp(brown(d), 250) * .3 + simmer * .6 + hp(nz(d), 5000) * .05) * .3
    if w == 'sea':
        sw = .35 + .65 * (np.sin(2 * np.pi * tt / 4.2 - 1) * .5 + .5) ** 2
        return norm(lp(brown(d), 700) * sw + bp(nz(d), 800, 5000) * sw ** 3 * .4) * .75
    if w == 'high':
        return wind(d, .35, 400, 1600, 9) + wind(d, .25, 90, 300, 10)
    return np.zeros_like(tt)

fx, ab, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
VOICE = {}
for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr); VOICE[e['id']] = (t, len(y) / SR); add(vo, y, t, 1.0, 0)
    elif ty == 'baren': add(fx, baren(e['d'], v), t, .32, .1)
    elif ty == 'block': add(fx, block(v), t, .3, -.1)
    elif ty == 'slip': add(fx, slip(v), t, .18, .2)
    elif ty == 'seal': add(fx, seal(v), t, .5, 0)
    elif ty == 'scroll': add(fx, scroll(e['d'], v), t, .22, 0)
    elif ty == 'step': add(fx, step(e['m'], v), t, .12 if e['m'] == 'dirt' else .16, .15)
    elif ty == 'cup': add(fx, cup(v), t, .14, .2)
    elif ty == 'sip': add(fx, sip(v), t, .08, .2)
    elif ty == 'chime': add(fx, chime(v), t, .06, -.35)
    elif ty == 'lark': add(fx, lark(v), t, .05, .5)
    elif ty == 'geese': add(fx, geese(v), t, .06, -.3)
    elif ty == 'kite': add(fx, kite(v), t, .07, .35)
    elif ty == 'hat': add(fx, hat(v), t, .1, 0)
    elif ty == 'gust': add(ab, gust(v), t, .18, -.2)
    elif ty == 'rise': add(ab, rise(e['d'], v), t, .5, 0)
    elif ty == 'crash': add(fx, crash_(v), t, .9, 0)
    elif ty == 'fall': add(ab, rise(e['d'], v) * .8 + fade(bp(nz(e['d']), 1500, 7000) * (t_(e['d']) / e['d']) ** 2, .01, .05) * .35, t, .45, 0)
    elif ty == 'amb':
        a = amb(e['w'], e['d']); a = fade(a, .4, .4); add(ab, a, t, .22 if e['w'] != 'sea' else .3, 0)

# Narration: light compression + a very faint room sound
vm = compress(vo[:, 0] * 1.414, .2, 3, .004, .1); vo = np.stack([vm, vm], 1) / 1.414
room = np.zeros_like(vo); dl = int(.023 * SR); room[dl:] = vo[:-dl] * .12; vo = vo + lp(room, 3000)
# Score: score + hyoshigi (拍子木, wooden clappers) raised another 3.5 dB; ducked under dialogue (deeper for L5)
mu, msr = sf.read(os.path.join(HERE, 'music/score.wav')); hy, _ = sf.read(os.path.join(HERE, 'music/stems/hyoshigi.wav'))
if mu.ndim == 1: mu = np.stack([mu, mu], 1)
if hy.ndim == 1: hy = np.stack([hy, hy], 1)
mu = mu[:N]; mu = np.pad(mu, ((0, N - len(mu)), (0, 0))); hy = np.pad(hy[:N], ((0, max(0, N - len(hy[:N]))), (0, 0)))
mu = mu + hy * .5
duck = np.ones(N)
for id_, (t0, d) in VOICE.items():
    a, b = int((t0 - .25) * SR), int((t0 + d + .3) * SR); depth = .25 if id_ == 'L5' else .42
    duck[a:b] = np.minimum(duck[a:b], depth)
duck = uniform_filter1d(duck, int(.25 * SR))
mu *= duck[:, None]; ab *= np.sqrt(duck)[:, None]
MIX = mu * 1.0 + vo * 1.25 + fx * 1.0 + ab * 1.0
# ma (間, pause): 60 ms fade-out from 30.40, then total silence until 32.2 (reverb tails included)
a, b, c = int(30.40 * SR), int(30.46 * SR), int(32.2 * SR)
MIX[a:b] *= np.linspace(1, 0, b - a)[:, None]; MIX[b:c] = 0
# fade out from 43.4 at the end
k = int(43.4 * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None]
MIX = limit(MIX, .92)
sf.write(os.path.join(HERE, 'mix.wav'), MIX.astype(np.float32), SR)
# level meter
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for name, (a, b) in {'printing': (0, 2.9), 'jo': (2.9, 10.5), 'rain': (10.5, 17.3), 'teahouse': (17.3, 22.9), 'kyū': (22.9, 30.4), 'ma': (30.46, 32.2), 'echo': (32.2, 38.8), 'coda': (38.8, 44)}.items():
    s = slice(int(a * SR), int(b * SR)); print(f'{name:8s} mix {db(MIX[s]):6.1f}  vo {db(vo[s] * 1.25):6.1f}  mu {db(mu[s]):6.1f}  fx {db(fx[s]):6.1f}  amb {db(ab[s]):6.1f}')
print('peak', np.abs(MIX).max())
for id_, (t0, d) in VOICE.items():
    s = slice(int(t0 * SR), int((t0 + d) * SR)); print(id_, f'vo {db(vo[s] * 1.25):6.1f}  bed {db((mu + fx + ab)[s]):6.1f}')
