"""Mix: foley (cloth / hide / bamboo / wood / fire) + narration + music (ducked under the narration) → mix.wav
Usage (from the repo root): .venv/bin/python styles/shadow-puppet/demo/mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')); sys.path.insert(0, ROOT)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, creak, whoosh, compress, limit, add
from scipy.signal import fftconvolve
D = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = EV['dur']; ev = EV.get('events') or EV.get('ev') or EV.get('EV')
N = int(DUR * SR) + SR
fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); amb = np.zeros((N, 2))
rng = np.random.default_rng(11)

def room_ir(d=.7, damp=3000):
    n = int(d * SR); e = np.exp(-np.arange(n) / SR / (d / 6.9)); ir = np.stack([lp(rng.standard_normal(n), damp) * e, lp(rng.standard_normal(n), damp) * e], 1)
    ir[0] = 1; return ir / np.abs(ir).sum(0) * 6
def verb(x, ir, mix=.25):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1); return x * (1 - mix) + y * mix

# —— Foley ——
def woodclap(v=1.):       # xingmu (醒木, the storyteller's wooden clapper): hardwood slapped on a table
    d = .5; tt = t_(d)
    x = hp(noise(d), 900) * env_exp(d, .002) * 1.2
    x += sum(a * np.sin(2 * np.pi * f * tt + rng.random() * 6) * env_exp(d, tau) for f, a, tau in [(1150, .7, .03), (2350, .5, .018), (3500, .3, .01), (620, .4, .05)])
    x += np.sin(2 * np.pi * 140 * tt) * env_exp(d, .04) * .8
    return norm(x) * v
def match_(v=1.):
    d = .5; tt = t_(d); am = (rng.random(len(tt)) > .7) * 1.0; am = lp(am, 60)
    x = bp(noise(d), 1800, 6500) * am * np.minimum(1, tt / .03) * np.exp(-np.maximum(0, tt - .18) / .05)
    fl = lp(noise(d), 1500) * np.sin(np.clip((tt - .15) / .35, 0, 1) * np.pi) * .6
    return norm(x + fl) * v
def fwoomp(v=1., d=.8, f=900):
    tt = t_(d); e = np.minimum(1, tt / .06) * np.exp(-tt / (d / 3))
    return norm(lp(noise(d), f) * e + np.sin(2 * np.pi * 70 * tt) * e * .4) * v
def rodtap(v=1.):         # bamboo rod tapping the cloth
    d = .12; tt = t_(d)
    x = hp(noise(d), 1500) * env_exp(d, .003) + sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(1800, .5, .01), (3200, .3, .006)]) + lp(noise(d), 500) * env_exp(d, .015) * .6
    return norm(x) * v
def flap(v=1.):           # donkey hide flipping / lifting off the cloth
    d = .18; tt = t_(d)
    return norm(bp(noise(d), 600, 5000) * np.sin(np.pi * tt / d) ** 2 * (1 + .6 * np.sin(2 * np.pi * 30 * tt))) * v
def leather_step(v=1.):
    d = .07; tt = t_(d)
    return norm(bp(noise(d), 900, 4000) * env_exp(d, .006) + np.sin(2 * np.pi * 380 * tt) * env_exp(d, .01) * .5) * v
def twang(v=1.):          # bowstring
    d = .6; tt = t_(d); f = 196 * (1 + .03 * np.exp(-tt / .02))
    x = sum(a * np.sin(2 * np.pi * f * k * tt) * env_exp(d, .18 / k) for k, a in [(1, 1), (2, .5), (3, .35), (4, .2), (6, .1)])
    return norm(x + hp(noise(d), 2000) * env_exp(d, .004) * .6) * v
def thwack(v=1.):         # arrow striking hide
    d = .25; tt = t_(d)
    return norm(bp(noise(d), 300, 2500) * env_exp(d, .02) + np.sin(2 * np.pi * 160 * tt * (1 - tt)) * env_exp(d, .05)) * v
def snuff(v=1.):          # wick pinched out: a puff + a hiss
    d = .7; tt = t_(d)
    return norm(lp(noise(d), 700) * env_exp(d, .05) * 1.2 + hp(noise(d), 4000) * np.minimum(1, tt / .05) * env_exp(d, .25) * .35) * v
def wingflap(v=1.):
    d = .7; out = np.zeros(int(d * SR))
    for k in range(4): s = int(k * .14 * SR); f = lp(noise(.12), 900) * np.sin(np.pi * t_(.12) / .12) ** 2; out[s:s + len(f)] += f * (1 - k * .2)
    return norm(out) * v
def crack_(v=1.):
    d = .3; tt = t_(d)
    return norm(hp(noise(d), 700) * env_exp(d, .008) * (1 + (rng.random(len(tt)) > .97) * 2) + lp(noise(d), 300) * env_exp(d, .05)) * v
def breath(v=1.):
    d = 1.1; tt = t_(d); return norm(bp(noise(d), 300, 2200) * np.sin(np.pi * tt / d) ** 1.5) * v
def cloth(v=1., d=.7):
    tt = t_(d); am = lp(rng.random(len(tt)), 25); return norm(bp(noise(d), 1500, 6500) * am * np.sin(np.pi * tt / d)) * v
def crackle_bed(d, dens=1.):
    out = np.zeros(int(d * SR)); n = int(d * 14 * dens)
    for _ in range(n):
        s = int(rng.random() * (len(out) - 2000)); c = hp(noise(.01), 2500) * env_exp(.01, .0015) * (.3 + rng.random()); out[s:s + len(c)] += c
    return out
def heat_bed(d):
    tt = t_(d); b = lp(brown(d), 160) * 1.0 + bp(noise(d), 2500, 7000) * .08
    return b * np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / .03)   # hard cut where the silence starts
def water_bed(d):
    tt = t_(d); m = lp(rng.random(len(tt)), 6); x = bp(noise(d), 500, 3500) * (.4 + m)
    return x * np.minimum(1, tt / 1.0) * np.minimum(1, (d - tt) / 1.0)
def room_bed(d):
    tt = t_(d); return (lp(brown(d), 250) * .6 + crackle_bed(d, .5) * .4) * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .4)

G = dict(clap=.9, match=.5, ignite=.45, rodtap=.35, liftoff=.25, flare=.3, crack=.35, fireup=.35, step=.16, hop=.25, land=.35,
         creak=.28, twang=.45, arrow=.35, hit=.55, snuff=.35, crowflap=.25, bowease=.18, wind=.3, cloth=.25, breath=.12)
for e in ev:
    ty, t, v = e['type'], e['t'], e.get('v', 1)
    pan = 0
    if ty == 'clap': add(fx, woodclap(v), t, G[ty])
    elif ty == 'match': add(fx, match_(v), t, G[ty], .3)
    elif ty == 'ignite': add(fx, fwoomp(v, 1.0, 900), t, G[ty], .3)
    elif ty == 'rodtap': add(fx, rodtap(v), t, G[ty])
    elif ty == 'liftoff': add(fx, flap(v), t, G[ty])
    elif ty == 'flare': i = e['i']; add(fx, fwoomp(1, .5, 1200 + i * 200), t, G[ty] * (.7 + i * .05), -.5 + i * .12)
    elif ty == 'heat': add(amb, heat_bed(e['d']), t, .14)
    elif ty == 'crackle': add(amb, crackle_bed(e['d'], 1.2), t, .35)
    elif ty == 'crack': add(fx, crack_(v), t, G[ty])
    elif ty == 'fireup': add(fx, fwoomp(1, 1.2, 1400), t, G[ty])
    elif ty == 'step': add(fx, leather_step(v), t, G[ty], -.2)
    elif ty == 'hop': add(fx, flap(v), t, G[ty])
    elif ty == 'land': add(fx, rodtap(1), t, G[ty]); add(fx, leather_step(1), t + .01, G[ty])
    elif ty == 'creak':
        d = e.get('d', .3); k = 0.0
        while k < d: add(fx, creak(1 + k / max(d, .01) * .5), t + k, G[ty] * v * (.6 + .4 * k / max(d, .01)), -.1); k += .11
    elif ty == 'twang': add(fx, twang(v), t, G[ty], -.1)
    elif ty == 'arrow': add(fx, whoosh(max(.18, e['d'] + .1), 1), t, G[ty], .2)
    elif ty == 'hit': add(fx, thwack(v), t, G[ty] * (1 - e['i'] * .04), .25)
    elif ty == 'snuff': add(fx, snuff(v), t, G[ty] * (1 - e['i'] * .03), .2)
    elif ty == 'crowflap': add(fx, wingflap(v), t, G[ty], .3)
    elif ty == 'bowease': add(fx, creak(.7), t, G[ty]); add(fx, creak(.6), t + .4, G[ty] * .7)
    elif ty == 'water': add(amb, water_bed(e['d']), t, .1)
    elif ty == 'wind': add(fx, whoosh(e['d'], 1), t, G[ty])
    elif ty == 'cloth': add(fx, cloth(1), t, G[ty])
    elif ty == 'room': add(amb, room_bed(e['d']), t, .12)
    elif ty == 'breath': add(fx, breath(1), t, G[ty], .5)
# Wick bed noise: a very faint crackle whenever the lamps are lit
add(amb, crackle_bed(DUR - 1.3, .6), 1.3, .15)

# —— Narration: compression + warmth + small-theatre reverb ——
vo_env = np.zeros(N)
for e in ev:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR); y = compress(norm(y, .9), .3, 3)
    y = y + lp(y, 250) * .25
    add(vo, y, e['t'], 1.35)
    s = int(e['t'] * SR); vo_env[s:s + len(y)] = 1
vo = verb(vo, room_ir(.9), .14)

# —— Music + ducking ——
mp = os.path.join(D, 'music', 'score.wav')
mus = np.zeros((N, 2))
if os.path.exists(mp):
    m, sr = sf.read(mp)
    if m.ndim == 1: m = np.stack([m, m], 1)
    if sr != SR: m = soxr.resample(m, sr, SR)
    mus[:min(N, len(m))] = m[:N]
    from scipy.ndimage import uniform_filter1d
    k = uniform_filter1d(vo_env, int(.25 * SR)); k = np.clip(k * 1.6, 0, 1)
    duck = 10 ** (-12 * k / 20); mus *= duck[:, None]
else:
    print('!! music/score.wav is missing; run music/score.py first')

fx = verb(fx, room_ir(.6), .18)
fx *= (10 ** (-4 * k / 20))[:, None] if os.path.exists(mp) else 1
amb *= (10 ** (-5 * k / 20))[:, None] if os.path.exists(mp) else 1
mix = mus * .85 + fx + amb + vo
# The silence (34.8–36.85) keeps only the wick and the bowstring: make sure no music or bed noise is left there
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)[:int(DUR * SR)]
sf.write(os.path.join(D, 'mix.wav'), mix.astype(np.float32), SR)
def rms(a, b): x = mix[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix.wav', mix.shape, 'peak', np.abs(mix).max().round(3))
for a, b, n in [(0, 2.4, 'open'), (7.2, 12, 'suns'), (18, 21.6, 'run'), (30, 34.8, 'volley'), (34.85, 36.8, 'silence'), (37.2, 43.2, 'heal'), (44.5, 50.4, 'back'), (50.5, 54.3, 'end')]:
    print(f'{n:8s} {rms(a, b):6.1f} dB')
# Level difference between voice and everything else (per line)
bed = mus * .85 + fx + amb
for e in ev:
    if e['type'] != 'vo': continue
    a, b = int(e['t'] * SR), int((e['t'] + 2) * SR)
    rv = 20 * np.log10(np.sqrt((vo[a:b] ** 2).mean()) + 1e-9); rb = 20 * np.log10(np.sqrt((bed[a:b] ** 2).mean()) + 1e-9)
    print(f"{e['id']}  voice {rv:6.1f}  bed {rb:6.1f}  diff {rv - rb:5.1f} dB")
