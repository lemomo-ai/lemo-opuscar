"""Mix: foley (water / wood / stone / glass, following the material) + ambience bed (waves, gulls, windmill, insects) + narration + music ducking → mix.wav
Usage: .venv/bin/python styles/lowpoly-island/demo/mix.py
Reads events.json (the same timeline exported by the page), voices/*.wav, music/score.wav"""
import os, sys, json, numpy as np, soundfile as sf, librosa
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, add, compress, limit, brown

rng = np.random.default_rng(21)
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; N = int(DUR * SR)
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); vo = np.zeros((N, 2))
nz = lambda d: rng.standard_normal(len(t_(d)))
db = lambda x: 10 ** (x / 20)

# —— material foley ——
def bubble_rise(d=.32, f0=170, f1=560):   # underwater bubbles rising
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * (.6 + .4 * np.sin(2 * np.pi * 23 * tt))

def splash(d=.45, size=1.0):   # breaking the surface: broadband noise + fine droplets
    tt = t_(d); body = bp(nz(d), 700, 5200) * env_exp(d, .06 + .04 * size)
    drops = np.zeros(len(tt))
    for k in range(int(6 + 8 * size)):
        s = int(rng.uniform(.02, d * .85) * SR); f = rng.uniform(1400, 3600); dd = .035
        g = np.sin(2 * np.pi * f * t_(dd) * (1 + 1.5 * t_(dd) / dd)) * env_exp(dd, .008)
        drops[s:s + len(g)] += g[:len(drops) - s] * rng.uniform(.2, .6)
    low = lp(nz(d), 400) * env_exp(d, .05) * .6 * size
    return norm(body * .8 + drops * .5 + low)

def wood_knock(f=620, d=.16, v=1.0):   # wooden block landing
    tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * m * tt) * env_exp(d, tau) for m, a, tau in [(1, 1, .03), (2.7, .45, .014), (5.1, .2, .007)])
    x += hp(nz(d), 2000) * env_exp(d, .002) * .5 + np.sin(2 * np.pi * 110 * tt) * env_exp(d, .025) * .5
    return norm(x) * v

def tile_clack(v=1.0):   # terracotta tile roof
    d = .1; tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * tt + rng.random() * 6) * env_exp(d, tau) for f, a, tau in [(2300, .7, .012), (3400, .5, .008), (900, .5, .02)])
    return norm(x + hp(nz(d), 3000) * env_exp(d, .002) * .6) * v

def leaf_pop(v=1.0):   # tree "pop": a short pitched breathy sound + leaf rustle
    d = .16; tt = t_(d); f = 380 + 900 * tt / d
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .035) + bp(nz(d), 3000, 8000) * env_exp(d, .03) * .35
    return norm(x) * v

def stone_thunk(v=1.0):   # lighthouse brick rings: heavier stone
    d = .3; tt = t_(d)
    x = np.sin(2 * np.pi * 95 * tt * (1 - .2 * tt)) * env_exp(d, .06) + bp(nz(d), 300, 1800) * env_exp(d, .02) * .7 + wood_knock(420, d, .4)
    return norm(x) * v

def glass_tink(v=1.0):
    d = .6; tt = t_(d)
    return norm(sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(3520, 1, .18), (5270, .5, .1), (7900, .25, .05)])) * v

def whump(v=1.0):   # lighthouse ignition: low-frequency swell
    d = 1.4; tt = t_(d)
    x = np.sin(2 * np.pi * 52 * tt) * (1 - np.exp(-tt / .02)) * env_exp(d, .45) + lp(nz(d), 900) * env_exp(d, .12) * .5
    return norm(x) * v

def gull(v=1.0):   # gull: a falling cry, with harmonics and vibrato
    d = rng.uniform(.28, .45); tt = t_(d); f = 1900 - 700 * (tt / d) ** .7
    ph = 2 * np.pi * np.cumsum(f * (1 + .02 * np.sin(2 * np.pi * 28 * tt))) / SR
    x = np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3 * ph)
    return norm(bp(x, 900, 6000) * np.sin(np.pi * tt / d) ** 1.5) * v

def cricket(v=1.0):
    d = .22; tt = t_(d); x = np.sin(2 * np.pi * 4600 * tt) * (np.sin(2 * np.pi * 34 * tt) > .2) * np.sin(np.pi * tt / d)
    return x * v

def creak(v=1.0):
    d = .5; tt = t_(d); f0 = 90 + rng.random() * 30
    saw = 2 * ((tt * f0 * (1 + .25 * np.sin(2 * np.pi * 5 * tt))) % 1) - 1
    return norm(bp(saw, 350, 2400) * (np.abs(np.sin(2 * np.pi * 14 * tt)) ** 3) * np.sin(np.pi * tt / d)) * v

for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', .7)
    pan = float(np.clip(rng.normal(0, .3), -.7, .7))
    if ty == 'rise':
        big = e.get('big', 0); n = e.get('n', 1)
        add(fx, bubble_rise(), t - .45, db(-30) * (1 + big), pan)
        add(fx, splash(.5 + .25 * big, .7 + .5 * big + .1 * n), t - .14, db(-19) * (1.6 if big else 1) * min(1.4, .8 + .15 * n), pan)
        if big: add(fx, whump(1), t - .12, db(-22), 0)
    elif ty == 'pop' and t < 21: add(fx, leaf_pop(), t, db(-27), pan)
    elif ty == 'floor':
        add(fx, wood_knock(rng.uniform(560, 700)), t, db(-22), pan); add(fx, wood_knock(rng.uniform(560, 700)), t + .21, db(-33), pan)
    elif ty == 'roof': add(fx, tile_clack(), t, db(-24), pan)
    elif ty == 'plank': add(fx, wood_knock(rng.uniform(300, 380), .2), t, db(-21), pan)
    elif ty == 'splash': add(fx, splash(.6, 1.1), t - .1, db(-19), pan)
    elif ty == 'ring': add(fx, stone_thunk(), t, db(-20), 0)
    elif ty == 'lamproom': add(fx, glass_tink(), t, db(-30), 0); add(fx, wood_knock(480), t, db(-26), 0)
    elif ty == 'ignite':
        add(fx, whump(1), t, db(-17), 0)
        d = DUR - t; tt = t_(d); hum = (np.sin(2 * np.pi * 110 * tt) + .4 * np.sin(2 * np.pi * 220 * tt)) * np.minimum(1, tt / .4)
        add(fx, hum, t, db(-44), 0)
    elif ty == 'boatbell' and e.get('answer'): pass

# —— ambience bed ——
tt = t_(DUR)
# waves: low-passed brown noise + slow swell + random breakers on the shore
w = lp(brown(DUR), 650); w2 = lp(brown(DUR), 650)
swell = .6 + .4 * np.sin(2 * np.pi * tt / 6.3) * np.sin(2 * np.pi * tt / 9.1 + 1)
wl = np.interp(tt, [0, 6, 21, 31, 36.25, 41, 48.75, DUR], [1.0, .8, .55, .9, .75, .6, .7, .5])   # waves are more prominent at night
amb[:, 0] += norm(w) * swell * wl * db(-22); amb[:, 1] += norm(w2) * swell[::-1] * wl * db(-22)
for k in range(26):
    s = rng.uniform(0, DUR - 1.5); d = rng.uniform(.8, 1.4); x = bp(nz(d), 500, 3500) * np.sin(np.pi * t_(d) / d) ** 3
    add(amb, norm(x), s, db(-34) * float(np.interp(s, [0, 21, 31, DUR], [1, .6, 1, .8])), rng.uniform(-.8, .8))
# distant seabirds at the opening, gulls in the daytime
for s in [1.6, 4.4]: add(amb, lp(gull(1), 3000), s, db(-40), rng.uniform(-.8, .8))
for s in np.arange(T0 := 20.6, 29.5, 1.7): add(amb, gull(1), s + rng.uniform(-.4, .4), db(-33), rng.uniform(-.8, .8))
for s in np.arange(21.4, 31.0, 1.25): add(amb, creak(1), s + rng.uniform(-.1, .1), db(-40), .35)
# insects (after dusk)
for s in np.arange(29.9, DUR - .5, .31):
    if rng.random() < .75: add(amb, cricket(1), s + rng.uniform(0, .1), db(-43) * float(np.interp(s, [29.9, 31.5, 36.25, 41, DUR], [.3, 1, .5, .7, .5])), rng.choice([-.6, .5]))

# —— narration ——
vox_on = np.zeros(N)
for e in E['ev']:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = librosa.resample(y, orig_sr=sr, target_sr=SR); y = hp(y, 90); y = norm(compress(norm(y), .3, 3.0), .5)
    add(vo, y, e['t'], db(-.5), 0)
    a, b = int(e['t'] * SR), int((e['t'] + len(y) / SR) * SR); vox_on[max(0, a - int(.15 * SR)):b + int(.25 * SR)] = 1

# —— score + ducking ——
mp = os.path.join(HERE, 'music', 'score.wav')
if os.path.exists(mp):
    m, msr = sf.read(mp, always_2d=True)
    if msr != SR: m = np.stack([librosa.resample(m[:, c], orig_sr=msr, target_sr=SR) for c in range(2)], 1)
    m = m[:N] if len(m) >= N else np.pad(m, ((0, N - len(m)), (0, 0)))
else:
    print('!! music/score.wav is missing; using silence for now'); m = np.zeros((N, 2))
from scipy.ndimage import uniform_filter1d
duck = 1 - (1 - db(-9.5)) * np.clip(uniform_filter1d(vox_on, int(.25 * SR)), 0, 1)
m = m + np.stack([hp(m[:, c], 3000) for c in range(2)], 1) * .45   # the score is on the dark side: gently lift above 3 kHz so the kalimba is brighter
mus = m * duck[:, None] * db(-4)

mix = vo + fx + amb * db(-1) + mus
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
def rms(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
on = vox_on > 0
print('mix.wav', mix.shape, 'peak', round(20 * np.log10(np.abs(mix).max()), 2), 'dB')
print('RMS  vo(while speaking)', round(rms(vo[on]), 1), ' music(while speaking)', round(rms(mus[on]), 1), ' music(whole film)', round(rms(mus), 1), ' fx', round(rms(fx), 1), ' amb', round(rms(amb), 1))
