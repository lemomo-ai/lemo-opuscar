""""KOMA ONE · Thirty Panels a Second": score + foley, all synthesized with numpy.
160 BPM, E-minor anime-opening rock: distorted power chords, bass, drums, square-wave melody (stands in for the vocal and marks where each lyric line sits), shutter sounds as percussion.
The grid comes entirely from beats.json (bpm, offset, cuts, sections, silence); foley reads events.json (window.EV from film.js, exported by core/render/events.mjs).
To switch to a real song: re-measure beats.json and replace the score here with "song + foley".
Writes out/mix.wav (mux.sh normalizes to −14 LUFS)."""
import os, sys, json
import numpy as np
import soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.join(HERE, '..', '..', '..')), 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add, compress, limit

BJ = json.load(open(os.path.join(HERE, 'beats.json')))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
BPM = BJ['bpm']; B = 60 / BPM; OFF = BJ['offset']; DUR = BJ['dur']
bar = lambda n: OFF + n * 4 * B
CUT = {k: bar(v) for k, v in BJ['cuts'].items()}
N = int((DUR + .5) * SR)
mus = np.zeros((N, 2)); drm = np.zeros((N, 2)); fx = np.zeros((N, 2)); amb = np.zeros((N, 2))
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
rng = np.random.default_rng(7)

# ── Drums ──
def kick(v=1.):
    d = .35; tt = t_(d); f = 50 + 150 * np.exp(-tt / .025)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .1) + hp(noise(d), 2500) * env_exp(d, .004) * .6
    return np.tanh(x * 2.2) * v
def snare(v=1.):
    d = .26; tt = t_(d)
    body = np.sin(2 * np.pi * np.cumsum(200 + 60 * np.exp(-tt / .01)) / SR) * env_exp(d, .045)
    nz = bp(noise(d), 1500, 9500) * env_exp(d, .06)
    return norm(np.tanh((body * .7 + nz) * 1.7)) * v
def hat(v=1., d=.045): return norm(hp(noise(d), 8500) * env_exp(d, d / 4)) * v
def ohat(v=1.): return norm(hp(noise(.24), 7000) * env_exp(.24, .07)) * v
def crash(v=1., d=2.2):
    x = hp(noise(d), 3800) * env_exp(d, .6) + bp(noise(d), 5000, 11000) * env_exp(d, .22) * .5
    return norm(x) * v
def tom(f=110, v=1.):
    d = .3; tt = t_(d)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-tt / .03))) / SR) * env_exp(d, .1) * 1.5) * v
def shutter(v=1.):     # mechanical shutter: two "clacks" + a metallic spring (also used as percussion)
    d = .13; out = np.zeros(int(d * SR))
    for dt, g in ((0, 1), (.042, .75)):
        s = int(dt * SR); k = bp(noise(.03), 1400, 9000) * env_exp(.03, .004) * g
        k = k + np.sin(2 * np.pi * 2600 * t_(.03)) * env_exp(.03, .003) * .35 * g
        out[s:s + len(k)] += k
    return norm(out) * v

# ── Pitched instruments ──
def saw(f, d, det=0.): ph = (t_(d) * f * (1 + det)) % 1; return 2 * ph - 1
def power(root, d, v=1., mute=False):
    tt = t_(d)
    x = sum(saw(mtof(n), d, dt) for n in (root, root + 7, root + 12) for dt in (-.004, .005))
    x = lp(np.tanh(x * 3.4), 1300 if mute else 4000, 2)
    e = np.minimum(1, tt / .002) * np.exp(-tt / .06) if mute else np.minimum(1, tt / .004) * (np.exp(-tt / .45) * .55 + .45)
    return x * e * np.minimum(1, (d - tt) / .02) * v
def bass(n, d, v=1.):
    tt = t_(d); f = mtof(n)
    x = lp(np.tanh((saw(f, d) * .6 + np.sign(np.sin(2 * np.pi * f * tt)) * .4) * 1.6), 1000)
    return x * np.minimum(1, tt / .003) * np.exp(-tt / (d * .9 + .05)) * np.minimum(1, (d - tt) / .015) * v
def lead(n, d, v=1.):
    tt = t_(d); f = mtof(n) * (1 + .007 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / .15))
    ph = np.cumsum(f) / SR
    x = lp(np.sign(np.sin(2 * np.pi * ph)) * .45 + (2 * (ph % 1) - 1) * .45 + (2 * ((ph * 1.005) % 1) - 1) * .3, 3800)
    return x * np.minimum(1, tt / .008) * (np.exp(-tt / .5) * .35 + .65) * np.minimum(1, (d - tt) / .03) * v

def A(buf, x, t, g=1., p=0.): add(buf, x, t, g, p)
def Bt(b): return OFF + b * B            # beat b (counted from beat 0 of bar 0)

E, G, Am, C, D, Bn = 40, 43, 45, 48, 50, 47
# ═══ Intro ═══
b0 = 0
A(drm, crash(1.), Bt(0), .7); A(drm, kick(), Bt(0), 1.)
for b, n in ((0, E), (1.5, G), (2.5, Am)):
    A(mus, power(n, B * 1.4), Bt(b), .5); A(mus, bass(n - 12, B * 1.4), Bt(b), .5)
for b in range(4): A(drm, shutter(), Bt(b), .45, (-.3, .3, -.2, .2)[b])
for k in range(4): A(drm, snare(.4 + .15 * k), Bt(3 + k / 4), .8)
# bar 1: one panel per beat, four power chords slamming the panels
for i, n in enumerate((E, G, Am, Bn)):
    A(mus, power(n, B * .9), Bt(4 + i), .52); A(mus, bass(n - 12, B * .9), Bt(4 + i), .5); A(drm, kick(), Bt(4 + i), 1.)
    A(drm, shutter(), Bt(4 + i + .5), .3)
# bars 2–3: title page, riff groove
A(drm, crash(.9), Bt(8), .7)
for bb, (n1, n2) in ((8, (E, E)), (12, (C, D))):
    for k in range(8):
        n = n1 if k < 4 else n2
        A(mus, power(n, B / 2 * .9, mute=(k % 4 != 0)), Bt(bb + k / 2), .42 if k % 4 else .52)
        A(mus, bass(n - 12, B / 2 * .9), Bt(bb + k / 2), .5)
        A(drm, hat(.45 if k % 2 else .3), Bt(bb + k / 2), .4)
    for b in (0, 1.5, 2.5): A(drm, kick(), Bt(bb + b), .95)
    for b in (1, 3): A(drm, snare(), Bt(bb + b), .8)
for k, b in enumerate((15, 15.25, 15.5, 15.75)): A(drm, tom(170 - 28 * k), Bt(b), .65)

# ═══ Verse: palm-muted eighths + rock drums, four lines ═══
VS = [(E, E), (C, D), (E, E), (Am, Bn)]
for i in range(4):
    s = (4 + 2 * i) * 4
    for h in range(2):
        n1, n2 = VS[(i * 2 + h) % 4]
        for k in range(8):
            n = n1 if k < 4 else n2
            A(mus, power(n, B / 2 * .9, mute=(k % 4 != 0)), Bt(s + h * 4 + k / 2), .4 if k % 4 else .48)
            A(mus, bass(n - 12, B / 2 * .9), Bt(s + h * 4 + k / 2), .5)
            A(drm, hat(.45 if k % 2 else .28), Bt(s + h * 4 + k / 2), .38)
        for b in (0, 1.5, 2.5): A(drm, kick(), Bt(s + h * 4 + b), .9)
        for b in (1, 3): A(drm, snare(), Bt(s + h * 4 + b), .75)
A(drm, crash(.6), Bt(16), .5)
# vocal position (square-wave stand-in): 2 bars per line
VMEL = [[(0, 67, .5), (.5, 67, .5), (1.5, 69, .5), (2, 71, .5), (2.5, 71, 1)],
        [(0, 71, .5), (.5, 69, .5), (1.5, 67, .5), (2, 67, .5), (2.5, 69, .5), (3, 71, .5), (3.5, 67, 1.5)],
        [(0, 64, .5), (.5, 67, .5), (1, 69, 1), (2, 71, .5), (2.5, 72, .5), (3, 71, 1.5)],
        [(0, 71, .5), (.5, 72, .5), (1, 74, 1), (2, 74, .5), (2.5, 72, .5), (3, 71, .5), (3.5, 74, 2)]]
for i, ph in enumerate(VMEL):
    s = (4 + 2 * i) * 4
    for b, n, d in ph: A(mus, lead(n, B * d * .92), Bt(s + b), .17, .1)

# ═══ Pre-chorus: drums drop out, sustained chords + heartbeat + riser; 0.75 s of silence after the click ═══
s = 12 * 4
A(mus, power(C, B * 4), Bt(s), .26); A(mus, power(D, B * 4), Bt(s + 4), .26)
A(mus, bass(C - 12, B * 4), Bt(s), .3); A(mus, bass(D - 12, B * 4), Bt(s + 4), .3)
for b, n, d in ((0, 71, 1), (1, 72, 1), (2, 74, 2), (4, 76, 1), (5, 74, .5), (5.5, 76, 2.5)): A(mus, lead(n, B * d * .92), Bt(s + b), .18, .1)
for b in (0, 2, 4, 6): A(drm, kick(.8), Bt(s + b), .5)
s = 14 * 4                                            # bar 14: snare roll building + tremolo power chords
for k in range(16): A(drm, snare(.3 + .045 * k), Bt(s + k / 4), .8)
for k in range(8): A(mus, power(Bn, B / 2 * .8, mute=True), Bt(s + k / 2), .3 + .03 * k)
s = 15 * 4                                            # the click: one full-band hit
A(drm, crash(1.1, 1.0), Bt(s), .8); A(drm, kick(1.1), Bt(s), 1.); A(mus, power(E, B * 1.9), Bt(s), .55); A(mus, bass(E - 12, B * 1.9), Bt(s), .55)

# ═══ Chorus: four-on-the-floor + open hat + melody; "each one a decisive moment" two bars at half time; "KOMA ONE" two hits ═══
CH = [E, C, G, D]
for bi in range(16, 28):
    s = bi * 4; n = CH[(bi - 16) % 4]; half = bi in (22, 23)
    A(mus, power(n, B * 4 * .97), Bt(s), .44)
    if half:
        A(mus, bass(n - 12, B * 2 * .95), Bt(s), .55); A(mus, bass(n - 12, B * 2 * .95), Bt(s + 2), .5)
        A(drm, kick(), Bt(s), 1.); A(drm, snare(), Bt(s + 2), .85); A(drm, hat(.4), Bt(s + 1), .3); A(drm, hat(.4), Bt(s + 3), .3)
    else:
        for k in range(8): A(mus, bass(n - 12, B / 2 * .9), Bt(s + k / 2), .55)
        for b in range(4): A(drm, kick(), Bt(s + b), 1.); A(drm, ohat(.5), Bt(s + b + .5), .32)
        for b in (1, 3): A(drm, snare(), Bt(s + b), .85)
for bi in (16, 20, 24): A(drm, crash(.9), Bt(bi * 4), .7)
A(drm, crash(.8), Bt(18 * 4 + 2), .5)                 # "stop"
CMEL = [[(0, 76, .5), (.5, 76, .5), (1, 79, .5), (1.5, 76, .5), (2, 74, 2)],                           # thirty panels a second
        [(0, 74, .5), (.5, 76, .5), (1, 79, 1), (2.5, 79, .5), (3, 81, .5), (3.5, 79, 1.5)],             # stop the wind in my hand
        [(0, 81, .5), (.5, 79, .5), (1, 76, 1), (2, 81, .5), (2.5, 79, .5), (3, 76, 1)],                 # every panel, every panel
        [(0, 74, 1), (1, 76, 1), (2, 79, 1), (3, 81, 1), (4, 79, 2), (6, 76, 2)],                       # each one a decisive moment (half time)
        [(0, 76, .5), (.5, 76, .5), (1, 79, .5), (1.5, 76, .5), (2, 74, 2)],
        [(0, 74, .5), (.5, 76, .5), (1, 79, 1), (2.5, 81, .5), (3, 83, .5), (3.5, 79, 2)]]               # keep you on this page
for i, ph in enumerate(CMEL):
    s = (16 + 2 * i) * 4
    for b, n, d in ph: A(mus, lead(n, B * d * .92), Bt(s + b), .2, .1)
s = 28 * 4                                            # KOMA ONE: two full-band hits
for b in (0, 1.5):
    A(drm, crash(1., 1.4), Bt(s + b), .7); A(drm, kick(1.1), Bt(s + b), 1.); A(mus, power(E, B * 1.3), Bt(s + b), .55); A(mus, bass(E - 12, B * 1.3), Bt(s + b), .55)
for k in range(4): A(drm, snare(.5 + .12 * k), Bt(s + 3 + k / 4), .85)
# ═══ Outro: one last shutter + a long guitar note ═══
s = 29 * 4
A(drm, crash(1., 3.), Bt(s), .8); A(drm, kick(1.1), Bt(s), 1.)
A(mus, power(E, B * 12), Bt(s), .55); A(mus, bass(E - 12, B * 8), Bt(s), .55)
A(mus, lead(83, B * 6), Bt(s), .12, .1)

# ═══ Room tone: street (verse), dropped in the pre-chorus ═══
def street(d):
    x = lp(noise(d), 700) * .5 + bp(noise(d), 300, 2000) * .25
    tt = t_(d); car = sum(np.exp(-((tt - c) / .9) ** 2) for c in rng.uniform(0, d, int(d / 3)))
    return x * (.6 + .4 * car)
a0, a1 = CUT['page4'], CUT['p1']
st = np.stack([street(a1 - a0 + 1), street(a1 - a0 + 1)], 1) * .06
fade = np.ones(len(st)); fade[-int(SR * .6):] = np.linspace(1, 0, int(SR * .6)); st *= fade[:, None]
amb[int(a0 * SR):int(a0 * SR) + len(st)] += st[:N - int(a0 * SR)]

# ═══ Foley (events.json: window.EV from film.js) ═══
def brush(v=1., d=.22):
    tt = t_(d); x = bp(noise(d), 1800, 9000) * np.sin(np.pi * tt / d) ** 1.5 + hp(noise(d), 6000) * env_exp(d, .03) * .4
    return norm(x) * v
def page(v=1.):
    d = .32; tt = t_(d); flut = .55 + .45 * np.sin(2 * np.pi * (28 + 30 * tt) * tt) ** 2
    x = bp(noise(d), 900, 7000) * flut * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** .7
    sn = np.zeros_like(x); s0 = int(.24 * SR); k = bp(noise(.06), 600, 4000) * env_exp(.06, .01); sn[s0:s0 + len(k)] = k[:len(sn) - s0]
    return norm(x + sn * 1.4) * v
def impact(v=1.):
    d = 1.2; tt = t_(d)
    x = np.sin(2 * np.pi * np.cumsum(32 + 120 * np.exp(-tt / .05)) / SR) * env_exp(d, .35) + lp(noise(d), 2200) * env_exp(d, .06)
    return np.tanh(x * 1.6) * v
def riser(d, v=1.):
    tt = t_(d); n = noise(d); out = np.zeros_like(n); hop = 480
    for i in range(0, len(n), hop):
        hi = min(len(n), i + hop); f = 500 + 7000 * (i / len(n)) ** 2
        out[i:hi] = bp(n[max(0, i - 2000):hi], f * .7, min(f * 1.4, 20000))[-(hi - i):]
    return norm(out) * (tt / d) ** 2 * v
def ping(v=1.):
    d = .07; tt = t_(d); return np.sin(2 * np.pi * 3200 * tt) * np.minimum(1, (d - tt) / .01) * np.minimum(1, tt / .002) * v
def tick(v=1.):
    d = .03; return bp(noise(d), 3000, 9000) * env_exp(d, .004) * v * 3
def shine(v=1.):
    d = .9; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / (.35 / k)) for k, f in enumerate((2960, 4430, 6210, 7900), 1))) * v
def whoosh(v=1., d=.4):
    tt = t_(d); n = noise(d); f = 600 + 4000 * np.sin(np.pi * tt / d)
    return norm(bp(n, 500, 6000) * np.sin(np.pi * tt / d) ** 2) * v
def swish(v=1.): return whoosh(v, .22)
def iris(v=1.):   # shutter blades: a string of very fast small metallic clicks
    d = .16; out = np.zeros(int(d * SR))
    for i in range(7):
        s = int(i * .018 * SR); k = bp(noise(.012), 2500, 10000) * env_exp(.012, .002); out[s:s + len(k)] += k * (1 - i * .08)
    return norm(out) * v
def splash(v=1.):
    d = .5; tt = t_(d); x = bp(noise(d), 400, 6000) * env_exp(d, .09) + bp(noise(d), 2000, 9000) * env_exp(d, .25) * .4 * (rng.random(len(tt)) > .97)
    return norm(x) * v
def clack(v=1.):
    d = .08; return norm(bp(noise(d), 800, 5000) * env_exp(d, .012) + np.sin(2 * np.pi * 1700 * t_(d)) * env_exp(d, .01) * .5) * v
def wind(v=1., d=2.0):
    tt = t_(d); return norm(bp(noise(d), 300, 2500) * (.5 + .5 * np.sin(2 * np.pi * .7 * tt)) * np.sin(np.pi * tt / d)) * v
def tear(v=1.):
    d = .35; tt = t_(d); return norm(bp(noise(d), 1200, 8000) * (rng.random(len(tt)) ** 6 + .2) * np.sin(np.pi * tt / d)) * v
def stepf(v=1.):
    d = .12; return norm(lp(noise(d), 900) * env_exp(d, .02) + bp(noise(d), 1500, 5000) * env_exp(d, .008) * .5) * v
def crowd(v=1., d=2.6):
    tt = t_(d); x = sum(bp(noise(d), f, f * 1.6) * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(1, 4) * tt + rng.uniform(0, 6))) for f in (250, 400, 650, 900))
    return norm(x * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .5)) * v
def wings(v=1.):
    d = 1.4; tt = t_(d); out = np.zeros(len(tt))
    for k in range(18):
        s = rng.uniform(0, .9); fl = bp(noise(.09), 300, 3000) * np.sin(np.pi * t_(.09) / .09) ** 2
        i = int(s * SR); out[i:i + len(fl)] += fl[:len(out) - i] * rng.uniform(.4, 1)
    return norm(out * np.exp(-tt / .7)) * v
def heart(v=1.):
    d = .5; out = np.zeros(int(d * SR))
    for dt, g in ((0, 1), (.17, .7)):
        tt = t_(.2); k = np.sin(2 * np.pi * np.cumsum(45 + 40 * np.exp(-tt / .02)) / SR) * env_exp(.2, .06) * g
        s = int(dt * SR); out[s:s + len(k)] += k
    return np.tanh(out * 1.8) * v
def stopfx(v=1.):  # "pita!": a crisp reversed inhale + wood block
    d = .25; tt = t_(d); x = bp(noise(d), 800, 7000) * (tt / d) ** 3 * (tt < .2)
    k = np.zeros_like(x); s0 = int(.2 * SR); c = clack(1.)[:len(k) - s0]; k[s0:s0 + len(c)] = c
    return norm(x + k * 1.5) * v
def chime(v=1.):
    d = 1.6; tt = t_(d); return norm(sum(np.sin(2 * np.pi * mtof(m) * tt) * np.exp(-tt / .6) for m in (88, 95, 100))) * v
def flip(v=1.):   # flip book: thirty pages in one second
    d = 1.1; out = np.zeros(int(d * SR))
    for i in range(30):
        s = int(i / 30 * SR); k = bp(noise(.03), 1500, 8000) * env_exp(.03, .006); out[s:s + len(k)] += k * rng.uniform(.6, 1)
    return norm(out) * v
def wink(v=1.): return norm(np.sin(2 * np.pi * np.cumsum(np.linspace(1800, 3200, int(.06 * SR))) / SR) * env_exp(.06, .02)) * v
FX = {'shutter': shutter, 'iris': iris, 'ping': ping, 'brush': brush, 'street': lambda v: whoosh(v, .5), 'splash': splash, 'clack': clack,
      'shine': shine, 'impact': impact, 'wind': wind, 'tear': tear, 'whoosh': whoosh, 'page': page, 'step': stepf, 'crowd': crowd,
      'riser': lambda v: riser(2 * B, v), 'swish': swish, 'wings': wings, 'tick': tick, 'heart': heart, 'stop': stopfx, 'chime': chime,
      'flip': flip, 'wink': wink}
GAIN = {'shutter': .55, 'impact': .7, 'brush': .45, 'page': .45, 'ping': .3, 'tick': .3, 'shine': .3, 'whoosh': .35, 'riser': .3, 'heart': .9,
        'wings': .6, 'crowd': .35, 'wind': .3, 'chime': .25, 'flip': .55}
for e in EVJ['ev']:
    f = FX.get(e['type'])
    if f is None: print('unknown event', e['type']); continue
    A(fx, f(1.), e['t'], e['g'] * GAIN.get(e['type'], .5), e.get('pan', 0))

mix = mus * .85 + drm * .8 + fx * .95 + amb
mix = np.stack([compress(mix[:, c], .3, 3.) for c in range(2)], 1)
# silent section (after the click): everything off
s0, s1 = BJ['silence']; i0, i1 = int(s0 * SR), int(s1 * SR)
g = np.ones(N); g[i0:i1] = 0; g[i0 - 240:i0] = np.linspace(1, 0, 240); mix *= g[:, None]
f0, f1 = BJ['fade_out']; fd = np.ones(N); a, b = int(f0 * SR), int(f1 * SR); fd[a:b] = np.linspace(1, 0, b - a) ** 1.4; fd[b:] = 0
mix = mix * fd[:, None] * 1.2
mix = np.stack([limit(mix[:, c], .92) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('mix ok', DUR)
