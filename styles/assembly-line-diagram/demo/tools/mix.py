""""The Disassembly Line" full-film sound: score (sampled instruments, 120 bpm factory march) + hit-point sfx (procedural) + English narration → demo/out/mix.wav
Reads demo/cues.json (action times), demo/timeline.json (narration positions), demo/out/voice/*.wav.
Run from the library root: .venv/bin/python styles/assembly-line-diagram/demo/tools/mix.py

The idea of the score: an assembly line is an ostinato. The assembly line on the paper is a tidy C-major march; inside the mouth, wood block and bass drum hit the bites;
in the stomach it turns to D-minor churning, the whole band stops dead when the gatekeeper raises the STOP sign and picks up again when the spoon tips; on the sorting line each of the three lines brings in a voice in turn;
in the warehouse it drops to half density, and during the fast-forward only the clock and a rising xylophone remain; after the alarm a full-speed march (D major), the three furnaces igniting are three timpani hits + brass;
during the big pull-out brass chords build all the way up, a glockenspiel note each time the light streak reaches a station, and the plaque landing is the final D-major tutti.
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, add, bp, lp, hp, compress, limit
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import warp
F, W = warp.film, warp.story        # story time (cues.json, timeline.json, the numbers below) → film time, and back

K = json.load(open(os.path.join(HERE, 'cues.json')))
TLN = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = warp.FILM_DUR; N = int(DUR * SR)            # film length (the title hold is stretched, see tools/warp.py)
S.seed(11)
B = 0.5
ev = []
evf = []                                            # events already in film time (the loops that run through the stretched title hold)
def E(t, inst, p, d, v, pan=0.0): ev.append((t, inst, p, d, v, pan))     # story time
def Ef(t, inst, p, d, v, pan=0.0): evf.append((t, inst, p, d, v, pan))   # film time
def D(**k): ev.append(k)
def addf(buf, x, t, *a): add(buf, x, F(t), *a)       # sfx at a story time

STOP = (K['stops'][0][0], K['spoons'][0])          # first time the sign goes up: the music stops dead
def quiet(t): return STOP[0] - .02 <= t < STOP[1] - .02 or (K['alarm'] - .05 <= t < 38.5) or (K['clockFF'][0] <= t < K['alarm'])

# ---------------- Ostinato + bass ----------------
SEC = [  # (start, end, 4 bass notes, 4 xylophone notes, density 1=eighths 2=quarters, xylophone instrument)
    (0.0, 4.5, ['C2', 'G2', 'C3', 'G2'], ['C5', 'G4', 'E5', 'G4'], 1, 'marimba'),
    (4.5, 6.5, ['F2', 'C3', 'F3', 'C3'], ['F5', 'C5', 'A5', 'C5'], 1, 'marimba'),
    (6.5, 8.5, ['G2', 'D3', 'G3', 'D3'], ['B4', 'D5', 'G5', 'D5'], 1, 'marimba'),
    (8.5, 9.0, ['C2', 'G2', 'C3', 'G2'], ['C5', 'E5', 'G5', 'E5'], 1, 'marimba'),
    (9.0, 12.4, ['A1', 'E2', 'A2', 'E2'], ['A4', 'C5', 'E5', 'C5'], 1, 'marimba'),
    (13.3, 16.95, ['D2', 'A2', 'D3', 'A2'], ['D5', 'F5', 'A5', 'F5'], 1, 'marimba'),
    (18.0, 19.5, ['D2', 'A2', 'D3', 'A2'], ['D5', 'F5', 'A5', 'F5'], 1, 'marimba'),
    (19.5, 20.9, ['A1', 'E2', 'A2', 'C#3'], ['C#5', 'E5', 'G5', 'E5'], 1, 'marimba'),
    (20.9, 25.8, ['F2', 'C3', 'F3', 'C3'], ['F5', 'A5', 'C6', 'A5'], 1, 'marimba'),
    (25.8, 29.64, ['D2', 'A2', 'D3', 'A2'], ['D5', 'F5', 'A5', 'F5'], 1, 'marimba'),
    (29.64, 33.0, ['C2', 'G2', 'C3', 'G2'], ['C5', 'E5', 'G5', 'E5'], 1, 'marimba'),
    (33.0, 36.15, ['G1', 'D2', 'G2', 'D2'], ['G4', 'B4', 'D5', 'B4'], 2, 'vibraphone'),
    (38.5, 41.15, ['D2', 'A2', 'D3', 'A2'], ['D5', 'A4', 'F#5', 'A4'], 1, 'marimba'),
    (41.95, 44.75, ['D2', 'A2', 'D3', 'A2'], ['D5', 'F#5', 'A5', 'F#5'], 1, 'marimba'),
]
for a, b, bass, ost, dens, mal in SEC:
    k = 0; t = F(a); b = F(b)                         # step the beat in film time, so the groove keeps its tempo through the slowed title hold
    while t < b - 1e-6:
        if not quiet(W(t)):
            if k % dens == 0: Ef(t, mal, ost[(k // dens) % 4], .25, .5 + .1 * (k % 2 == 0), -.25)
            if k % 2 == 0: Ef(t, 'contrabass_pizz', bass[(k // 2) % 4], .5, .78, .1)
            if k % 2 == 0 and dens == 1: Ef(t, 'bassoon_stac', S.midi(bass[(k // 2) % 4]) + 12, .2, .4, .15)
            if dens == 1: Ef(t, 'hihat', None, None, .16 + .08 * (k % 2), .3)
            if k % 4 == 2 and dens == 1: Ef(t, 'woodblock', None, None, .4, -.4)
        t += B / 2; k += 1

# ---------------- Melody: staccato clarinet (a factory tune), changing key by section ----------------
MOT = [(0, 0), (.5, 2), (.75, 4), (1.25, 2), (1.5, 1), (1.75, 0)]     # (time within the beat, scale degree)
def scale(root, minor=False):
    st = [0, 2, 3, 5, 7, 8, 10] if minor else [0, 2, 4, 5, 7, 9, 11]
    r = S.midi(root); return lambda d: r + st[d % 7] + 12 * (d // 7)
for a, b, root, mn, inst in [(0.5, 4.4, 'C5', False, 'clarinet_stac'), (5.0, 8.4, 'F4', False, 'clarinet_stac'), (13.4, 16.9, 'D5', True, 'oboe_stac'),
                             (38.5, 41.1, 'D5', False, 'clarinet_stac'), (41.95, 44.6, 'D5', False, 'trumpet_stac')]:
    sc = scale(root, mn); t0 = F(a); b = F(b); n = 0
    while t0 < b - .2:
        for dt, deg in MOT:
            tt = t0 + dt
            if tt < b and not quiet(W(tt)): Ef(tt, inst, sc(deg + (n % 2) * 2) - 12, .2, .42, .25)
        t0 += 2.0; n += 1

# ---------------- Sorting line: each of the three lines carries a voice ----------------
L = K['lines']
RU = K['run']
for i, (inst, pat, base) in enumerate([('bassoon_stac', [0, 7, 12, 7], 'D3'), ('clarinet_stac', [12, 16, 19, 16], 'D4'), ('flute_stac', [24, 19, 28, 19], 'D4')]):
    t = RU[i] - .02; k = 0
    while t < 33.0:
        root = S.midi('C3' if t >= 29.64 else 'D3') - S.midi('D3')
        E(t, inst, S.midi(base) + pat[k % 4] + root, .2, .42 + .04 * i, [-.3, .2, .4][i]); t += B / 2; k += 1
for t, p in zip(L, ['A5', 'D6', 'F6']): E(t, 'glockenspiel', p, .8, .5, .3)
E(30.4, 'glockenspiel', 'C7', 1.2, .45, .3)
D(t=30.4, inst='horn', pitch='C4', dur=2.6, vel=.4, pan=-.2, attack=.3); D(t=30.4, inst='horn', pitch='G4', dur=2.6, vel=.36, pan=.2, attack=.3)

# ---------------- Bites, sign, plunge ----------------
for c in K['chomps']: E(c, 'bass_drum', None, None, .75, 0); E(c, 'woodblock', None, None, .8, -.2); E(c, 'trombone_stac', 'A2', .2, .6, -.1)
for i, p in enumerate(['C7', 'A6', 'F6', 'D6', 'A5', 'F5', 'D5', 'A4']): E(K['tilt'][0] + .05 + i * .09, 'xylophone', p, .2, .5, .2)
E(STOP[0], 'trumpet_stac', 'A4', .2, .7, .3); E(STOP[0], 'snare', 'on', None, .6, 0)
for s in K['spoons']: E(s + .3, 'tuba_stac', 'D2', .3, .6, 0)
for s, e in K['stops'][1:]: E(s, 'trumpet_mute', 'A4', .18, .5, .3)

# ---------------- Warehouse: fast-forward ----------------
a, b = K['clockFF']
D(t=a, inst='cellos', pitch='E2', dur=b - a + .2, vel=.45, pan=-.1, attack=.2)
D(t=a, inst='violins_trem', pitch='B4', dur=b - a + .2, vel=.3, pan=.2, attack=.3)
for i in range(16): E(a + (b - a) * (1 - (1 - i / 16) ** 1.6), 'xylophone', S.midi('E5') + [0, 2, 3, 5, 7, 8, 10, 12][i % 8] + 12 * (i // 8), .2, .4 + i * .02, .2)

# ---------------- After the alarm: march → furnaces ignite ----------------
E(38.5, 'crash', None, None, .5, .2); E(38.5, 'timpani', 'D3', 1.0, .6, 0)
for i, p in enumerate(['A5', 'F#5', 'D5', 'A4', 'F#4', 'D4']): E(K['whip'][0] + i * .1, 'xylophone' if i < 2 else 'marimba', p, .2, .55, -.2)
for i, (ti, ch) in enumerate(zip(K['ignite'], [['D4', 'F#4', 'A4'], ['E4', 'G4', 'B4'], ['F#4', 'A4', 'D5']])):
    E(ti, 'timpani', 'D3', 1.2, .8, 0); E(ti, 'bass_drum', None, None, .6, 0)
    for p in ch: E(ti, 'trumpet_stac', p, .3, .7, .1)
    E(ti, 'trombone_stac', S.midi(ch[0]) - 12, .3, .65, -.1)

# ---------------- Big pull-out → the whole line lights up → plaque ----------------
p0 = K['pull'][0]
for t, ch, bass in [(p0, ['D4', 'F#4', 'A4'], 'D2'), (p0 + 1.5, ['D4', 'G4', 'B4'], 'G1'), (p0 + 3.0, ['E4', 'A4', 'C#5'], 'A1')]:
    for p in ch: D(t=t, inst='horn', pitch=p, dur=1.55, vel=.48, pan=0, attack=.25)
    D(t=t, inst='violins', pitch=S.midi(ch[-1]) + 12, dur=1.55, vel=.38, pan=.3, attack=.3)
    D(t=t, inst='cellos', pitch=bass, dur=1.55, vel=.45, pan=-.3, attack=.2)
    E(t, 'contrabass_pizz', bass, .6, .7, 0)
for k in range(int((K['card'] - p0) / B)):  # running rhythm
    t = p0 + k * B
    E(t, 'marimba', ['D5', 'A4', 'F#5', 'A4', 'G5', 'D5', 'B4', 'D5', 'A5', 'E5', 'C#6', 'E5'][k % 12], .2, .38, -.3)
E(K['card'] - 1.0, 'snare', 'roll', None, .35, 0)
# each station the light streak reaches: one glockenspiel note (pitch rising)
a, b = K['light']
for i, p in enumerate(['D6', 'E6', 'F#6', 'A6', 'B6', 'D7']):
    E(K['stations'][i], 'glockenspiel', p, 1.0, .55, .35)
T = K['card']
for p in ['D4', 'F#4', 'A4', 'D5']: E(T, 'trumpet_stac', p, .4, .8, 0)
for p in ['D3', 'A3']: D(t=T, inst='horn', pitch=p, dur=DUR - F(T) - .4, vel=.5, pan=0, attack=.05)
D(t=T, inst='trombone', pitch='D3', dur=DUR - F(T) - .5, vel=.55, pan=-.2); D(t=T, inst='tuba', pitch='D2', dur=DUR - F(T) - .5, vel=.6, pan=0)
D(t=T, inst='violins', pitch='F#5', dur=DUR - F(T) - .5, vel=.4, pan=.3, attack=.1); D(t=T, inst='cellos', pitch='D3', dur=DUR - F(T) - .5, vel=.45, pan=-.3, attack=.1)
E(T, 'timpani', 'D3', 1.2, .8, 0); E(T, 'crash', None, None, .45, .3)
for i, p in enumerate(['D6', 'F#6', 'A6', 'D7']): E(T + .1 + i * .08, 'glockenspiel', p, 1.6, .45, .3)

ev = [e for e in ev if e is not None]
ev = [(F(e[0]),) + e[1:] if isinstance(e, tuple) else {**e, 't': F(e['t'])} for e in ev] + evf   # story → film
music = S.render(ev, dur=DUR + 2)
music = S.room(music, size=.35, mix=.13)[:N]

# ---------------- Sfx ----------------
fx = np.zeros((N, 2), np.float32)
def hiss(d, lo=2500, hi=9000, v=1.0):
    x = bp(X.noise(d), lo, hi); e = np.minimum(1, X.t_(d) / .03) * np.minimum(1, (d - X.t_(d)) / .08); return (x * e * v).astype(np.float32)
def tone(f0, f1, d, v=1.0, vib=0):
    tt = X.t_(d); f = f0 + (f1 - f0) * tt / d + vib * np.sin(2 * np.pi * 28 * tt) * f0 * .02
    ph = 2 * np.pi * np.cumsum(f) / SR; e = np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .05)
    return (np.sin(ph) * e * v).astype(np.float32)
def beltn(d, v=1.0, rate=14):
    x = lp(X.brown(d), 400) * .8; tt = X.t_(d); x = x * (0.7 + 0.3 * np.sin(2 * np.pi * rate * tt))
    for k in np.arange(0, d, 1 / rate): s = int(k * SR); c = X.click(1.6, .25); x[s:s + len(c)] += c[:len(x) - s]
    e = np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .08); return (x * e * v).astype(np.float32)
_crng = np.random.default_rng(3)                      # pitch wobble of each chain link (fixed seed, identical on every build)
def chain(d, v=1.0):
    x = np.zeros(int(d * SR), np.float32)
    for k in np.arange(0, d, .045): s = int(k * SR); c = X.click(2.2 + _crng.random() * .6, .5); x[s:s + len(c)] += c[:len(x) - s]
    return x * v

# ① assembly line: conveyor + five drops + time clock
addf(fx, beltn(5.9, .7), 0.0, .28, -.2)
for i, td in enumerate(K['drops']):
    addf(fx, X.creak(.5), td - .45, .18, .3); addf(fx, X.thump(.8, 120 + 20 * i), td, .5, -.1); addf(fx, X.pop(.7), td + .01, .3, -.1)
addf(fx, X.clack(1.3, .9), K['ticket'], .55, .2); addf(fx, X.ding(.6), K['ticket'] + .05, .22, .2)
# ② sign: chain rattle + lands with two bounces + Chinese sub-sign + roller shutter + sandwich into the mouth
addf(fx, chain(.5, 1.0), K['sign'] - .05, .35, -.3); addf(fx, X.thump(1.0, 90), K['sign'] + .14, .7, -.3); addf(fx, X.clack(.9, .7), K['sign'] + .14, .45, -.3)
addf(fx, X.thump(.5, 110), K['sign'] + .42, .3, -.3)
addf(fx, chain(.3, .8), K['signZh'] - .05, .3, -.2); addf(fx, X.clack(1.1, .6), K['signZh'] + .14, .35, -.2)
addf(fx, chain(.5, .7), K['doorOpen'], .25, .4)
addf(fx, beltn(1.1, .8), K['enter'][0], .3, .2)
addf(fx, X.whoosh(.7, 1.0), 8.35, .45, .2)
# ③ crushers: three bites + saliva spray + tongue conveyor + swallow
for i, c in enumerate(K['chomps']): addf(fx, X.clack(.8 + .1 * i, 1.0), c, .8, -.1); addf(fx, X.thump(1.0, 60), c, .9, 0)
addf(fx, hiss(1.8, v=.7), 10.0, .3, .5)
addf(fx, beltn(.9, .6), K['tongue'][0], .3, .2)
addf(fx, X.whoosh(.95, 1.0), K['tilt'][0], .6, 0)
# ④ drum + acid rain + gatekeeper
addf(fx, X.thump(1.0, 70), K['drumIn'], .8, -.2)
addf(fx, X.rumble(K['panGate'][1] - K['drumIn'] + .6, 1.0), K['drumIn'], .5, -.2)
addf(fx, hiss(3.0, 3000, 9000, .7), K['drumIn'] + .2, .25, -.4)
addf(fx, X.creak(.9), K['panGate'][0] + .2, .3, .3)
for s, e in K['stops']: addf(fx, tone(2700, 2600, .3, .7, vib=1), s, .3, .5); addf(fx, X.click(1.2, .8), s, .3, .5)
for s in K['spoons']: addf(fx, X.creak(.7), s, .35, .4); addf(fx, X.pop(1.0), s + .2, .6, .4); addf(fx, X.thump(.6, 140), s + .5, .45, .3)
# ⑤ match cut: drop into the hopper + machine start-up + three lines
addf(fx, X.thump(.9, 100), K['cut5'] + .5, .7, 0); addf(fx, X.pop(.9), K['cut5'] + .52, .45, 0)
addf(fx, tone(60, 140, 1.0, .5), K['n4'] - .2, .25, .2); addf(fx, beltn(11.5, .7, 10), K['n4'], .22, .1)
for i in range(int((33.0 - RU[0]) / .72)): addf(fx, X.clack(1.4, .6), RU[0] + i * .72 + .18, .22, -.3)
for i in range(int((33.0 - RU[1]) / .6)): addf(fx, X.click(2.0, .7), RU[1] + i * .6 + .15, .25, .1)
addf(fx, X.rumble(33.0 - RU[2], .7), RU[2], .2, .4)
for i, r in enumerate(RU): addf(fx, tone(80 + 30 * i, 220 + 40 * i, .35, .5), r - .05, .2, -.2 + .2 * i)
for i, l in enumerate(L): addf(fx, X.click(1.6, .8), l + .3, .35, -.2 + .2 * i); addf(fx, X.pop(.6), l + .5, .25, -.2 + .2 * i)
# ⑥ follow up into the warehouse: sliding through the pipe + stacking + clock fast-forward
addf(fx, X.whoosh(1.2, .7), K['follow'][0] + .3, .3, -.3)
for i in range(9): addf(fx, X.click(1.1, .6), 34.6 + i * .4, .18, .2)
for i in range(4): addf(fx, X.click(3.0, .5), 34.5 + i * 1.0, .15, .5)            # clock ticks
a, b = K['clockFF']
for i in range(30): addf(fx, X.click(3.2, .4), a + (b - a) * (1 - (1 - i / 30) ** 2), .12, .5)
addf(fx, tone(200, 900, b - a, .4), a, .12, .5)
# ⑦ alarm → control room → bus → plunge → ignition
def bell(d):
    tt = X.t_(d); x = np.zeros_like(tt)
    for k in np.arange(0, d, 1 / 18): s = int(k * SR); dd = X.t_(.12); b_ = (np.sin(2 * np.pi * 2400 * dd) + .5 * np.sin(2 * np.pi * 3700 * dd)) * np.exp(-dd / .03); x[s:s + len(b_)] += b_[:len(x) - s]
    return x * np.minimum(1, (d - tt) / .1)
addf(fx, bell(1.4), K['alarm'], .32, .5)
addf(fx, X.clack(1.0, 1.0), K['cutCtrl'] + .02, .4, -.2)
addf(fx, X.whoosh(.4, .8), K['iris'][0], .35, 0)
addf(fx, lp(X.brown(1.2), 300) * .7, K['iris'][1] - .1, .5, .3)                        # bus engine
addf(fx, hiss(.5, 1500, 6000, 1.0), K['iris'][2] - .45, .35, .2)                       # air-brake hiss
addf(fx, X.whoosh(.4, .8), K['iris'][2], .3, 0)
for i in range(10): addf(fx, X.step(.7), K['cutWh'] + .1 + i * .13, .3, .1 * (i % 2))
addf(fx, X.whoosh(.9, 1.0), K['whip'][0], .75, 0)
for ti in K['ignite']: addf(fx, X.ignite(1.0), ti, .7, 0); addf(fx, X.thump(1.0, 55), ti, .6, 0)
for i in range(int((K['pull'][1] + 1 - K['ignite'][2]) / .35)): addf(fx, X.thump(.4, 90), K['ignite'][2] + .1 + i * .35, .25, -.2)
# ⑧ big pull-out: wind + door hiss + plaque landing
addf(fx, X.whoosh(2.4, 1.0), K['pull'][0], .45, 0)
addf(fx, hiss(.7, 1500, 6000, .8), K['busDoor'], .3, -.6)
addf(fx, X.thump(1.0, 80), K['card'] + .1, .7, .4); addf(fx, X.clack(1.0, .7), K['card'] + .1, .4, .4)

# ---------------- Narration: compressed → about 10 dB above the music, music ducks 300 Hz–4 kHz ----------------
import soxr
voice = np.zeros(N)
for k, (a, b) in TLN['vo'].items():
    x, sr = sf.read(os.path.join(HERE, 'out', 'voice', f'{k}.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    i0 = int(F(a) * SR); x = x[:N - i0]; voice[i0:i0 + len(x)] += x
voice = hp(voice, 80)
voice = compress(voice, thr=.12, ratio=3.0, att=.003, rel=.12)
env = np.convolve(np.abs(voice), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); env = np.clip(env / (np.percentile(env[env > 1e-4], 70) + 1e-9), 0, 1)
env = np.convolve(env, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in (0, 1)], 1); rest = music - mid
music = rest + mid * (1 - .55 * env)[:, None]
vst = np.stack([voice, voice], 1); vmask = env > .5
m_rms = float(np.sqrt(np.mean(music[vmask] ** 2))); v_rms = float(np.sqrt(np.mean(vst[vmask] ** 2)))
g_music = (v_rms / m_rms) * 10 ** (-10.0 / 20)
f_rms = float(np.sqrt(np.mean(fx[np.abs(fx).max(1) > 1e-3] ** 2)) + 1e-9)
g_fx = (v_rms / f_rms) * 10 ** (-9.0 / 20)
music = music * (1 + .6 * (1 - env))[:, None]          # music lifts about 4 dB between lines
mix = vst + music * g_music + fx * g_fx
db = lambda x, m: 20 * np.log10(np.sqrt(np.mean(x[m] ** 2)) + 1e-12)
print('voice', round(db(vst, vmask), 1), 'music(vo)', round(db(music * g_music, vmask), 1), 'music(gaps)', round(db(music * g_music, ~vmask), 1))
mix = np.stack([compress(mix[:, c], thr=.5, ratio=2.0) for c in (0, 1)], 1)
fade = np.ones(N); nf = int(.6 * SR); fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
mix = mix * fade[:, None]
mix = mix / np.abs(mix).max() * .89
mix = np.stack([limit(mix[:, c], ceil=.4) for c in (0, 1)], 1)     # tame the transients of the bites and ignitions (the final film's true peak must be ≤ −1 dB)
mix = mix / np.abs(mix).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
names = sorted({e[1] if isinstance(e, tuple) else e['inst'] for e in ev})
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(S.credits(names)) + '\n')
print('ok', mix.shape, names)
