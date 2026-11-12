"""Sound for "Catching the Moon" (Radar Sweep Documentary demo), the whole film on one timeline.

Reads events.json (exported from the page for the cut being rendered; times relative to the cut) and the narration in vo/wav/,
writes out/mix.wav (48 kHz stereo). Layers:
  · ambience: a calm night, then the storm (wind bed, rain hiss, two gusts that roar), quieter inside the TV;
  · foley tied to the picture: scan surges and sonar pings, the dish's motors and gears, the slam, the wind alarm,
    the Quindar-like tone when the TV comes on, the TV's hiss and the clean switch, the CRT collapsing, the last ping;
  · score (96 bpm, CC0 samples): contrabass and cellos, bowed vibraphone, a vibraphone pulse for the signal,
    one bright D major chord at the switch, glockenspiel for the stars;
  · narration (Kokoro bm_lewis): compressed, about 10 dB above the music, which is ducked and dipped 300 Hz–4 kHz under it.
Two near-silences: the comparison panel (24.6–27.2 s) and the TV before the switch (40.3–41.1 s).
Run from the library root:  .venv/bin/python styles/dark-documentary/demo/mix.py [--t0 0]
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, limit, thump, noise, t_, env_exp, compress, quindar

HERE = os.path.dirname(os.path.abspath(__file__))
T0 = float(sys.argv[sys.argv.index('--t0') + 1]) if '--t0' in sys.argv else 0.0
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = [dict(e, t=e['t'] + T0) for e in D['ev']]
FILM = 52.0          # 50 s of story + the credit card held to 52 s
N = int(round(FILM * SR)) + SR * 4
rng = np.random.default_rng(1969)
S.seed(21)
BEAT = 60 / 96
tt = np.arange(N) / SR
ev = lambda kind: [e for e in EV if e['type'] == kind]
evt = lambda kind, default=None: (ev(kind)[0]['t'] if ev(kind) else default)


def st(x, pan=0.0):
    th = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1) * 1.414


def place(buf, x2, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x2) <= 0: return
    if i < 0: x2 = x2[-i:]; i = 0
    n = min(len(x2), len(buf) - i); buf[i:i + n] += x2[:n] * g


def env_pts(pts):
    """piecewise-linear envelope over the film from [(t, value), ...]"""
    xs, ys = zip(*pts); return np.interp(tt, xs, ys)


T = dict(day=evt('dayscan', 9.0), g1=0, g2=0, c2=13.4, c3a=18.5, c3b=21.6, c3c=evt('panel', 24.6), c4=27.2,
         tvon=evt('tvon', 30.0), mb=evt('mainbeam', 39.7), tvcut=evt('tvcut', 40.3), sw=evt('switch', 41.1),
         col=evt('collapse', 43.2), ping=evt('finalping', 45.3))
gusts = sorted(e['t'] for e in ev('gust')) or [19.8, 22.8]
T['g1'], T['g2'] = gusts[0], gusts[-1]

amb = np.zeros((N, 2)); fol = np.zeros((N, 2)); mus = np.zeros((N, 2))

# ---------- 1. ambience ----------
def wind(seed, lo=60, hi=520):
    r = np.random.default_rng(seed)
    x = lp(hp(r.standard_normal(N), lo, 2), hi, 2)
    g = lp(r.standard_normal(N), 0.4, 1); g = (g - g.min()) / (g.max() - g.min() + 1e-9)
    return x * (0.5 + 0.7 * g ** 1.5)
w = np.stack([wind(3), wind(4)], 1); w /= np.abs(w).max()
whistle = np.stack([bp(np.random.default_rng(5).standard_normal(N), 700, 1600, 2), bp(np.random.default_rng(6).standard_normal(N), 650, 1500, 2)], 1)
whistle /= np.abs(whistle).max()
rain = np.stack([bp(np.random.default_rng(8).standard_normal(N), 3500, 10000, 2), bp(np.random.default_rng(9).standard_normal(N), 3500, 10000, 2)], 1)
rain /= np.abs(rain).max()
gust = sum(np.exp(-((tt - g + 0.2) / 0.55) ** 2) * a for g, a in [(T['g1'], 0.8), (T['g2'], 1.0)])
# the storm is at Parkes: it drops away on the Moon and around the globe, comes back muffled in the control room
cM, cGl, cR = evt('moon', 27.6), evt('globe', 31.7), evt('room', 37.4)
storm = env_pts([(0, 0), (T['day'] - 0.2, 0), (T['day'] + 1.5, 0.8), (T['c3a'], 1.0), (T['c3c'], 1.0), (cM - 0.2, 0.9), (cM + 0.3, 0.03), (cR - 0.1, 0.03),
                 (cR + 0.2, 0.30), (T['tvcut'] - 0.05, 0.30), (T['tvcut'] + 0.1, 0.12), (T['col'], 0.12), (T['col'] + 0.4, 0.55), (FILM - 1.0, 0.4), (FILM, 0)])
night = env_pts([(0, 0), (0.6, 0.5), (T['day'], 0.5), (T['day'] + 1.0, 0)])
panel_hush = 1 - 0.65 * env_pts([(0, 0), (T['c3c'], 0), (T['c3c'] + 0.3, 1), (T['c4'] - 0.2, 1), (T['c4'] + 0.2, 0), (FILM, 0)])
amb += w * (night * 0.10 + storm * 0.32 * (1 + 1.6 * gust))[:, None] * panel_hush[:, None]
amb += whistle * (storm * gust * 0.10)[:, None]
amb += rain * (storm * 0.05)[:, None] * panel_hush[:, None]

# ---------- 2. foley ----------
def sonar(f, d=1.6, v=1.0, tau=0.18):
    x = t_(d); env = np.minimum(1, x / 0.004) * np.exp(-x / tau)
    s = np.sin(2 * np.pi * f * x) * env + 0.25 * np.sin(2 * np.pi * 2 * f * x) * env * np.exp(-x / 0.05)
    out = s.copy()
    for dl, a in [(0.21, 0.32), (0.42, 0.12)]:
        j = int(dl * SR); out[j:] += s[:len(s) - j] * a
    return out * v

def surge(d=0.55, v=1.0, lo=1800, hi=7000):
    x = t_(d); e = np.minimum(1, x / 0.012) * (1 - x / d) ** 2.2
    return bp(noise(d), lo, hi, 2) * e * v

for e in ev('ignite'):
    x = t_(2.4)
    sub = np.sin(2 * np.pi * 41 * x * (1 + 0.06 * x)) * np.minimum(1, x / 0.01) * np.exp(-x / 0.7)
    air = bp(noise(2.4), 3000, 9000, 2) * np.minimum(1, x / 0.6) * np.exp(-x / 0.5)
    place(fol, st(hp(sub, 35) * 0.22 + air * 0.10), e['t'])
PING_F = [1174.7, 1318.5, 1174.7, 1568.0, 1174.7, 1318.5, 1760.0, 1568.0]
for e in ev('ping'):
    place(fol, st(surge(0.6), e['pan']), e['t'], 0.07)
    place(fol, st(sonar(PING_F[e['k'] % 8]), e['pan']), e['t'], 0.085)
for e in ev('reveal'):
    x = t_(3.5)
    ring = sum(a * np.sin(2 * np.pi * f * x + p) * np.exp(-x / tau) for f, a, tau, p in
               [(293.7, 0.5, 1.4, 0), (587.3 * 1.004, 0.35, 0.9, 1), (880.0 * 1.01, 0.22, 0.6, 2), (1471.0, 0.12, 0.35, 3), (2349, 0.06, 0.2, 4)])
    place(fol, st(ring * np.minimum(1, x / 0.002), e['pan']), e['t'], 0.11)
for e in ev('dayscan'):            # the world is rewritten: a long air surge and a lower, darker ping
    place(fol, st(surge(1.6, 1.0, 600, 5000), -0.4), e['t'], 0.14)
    place(fol, st(sonar(587.3, 2.4, tau=0.35), -0.2), e['t'], 0.08)
for e in ev('sweep'):
    place(fol, st(surge(0.9, 1.0, 900, 6000), -0.5), e['t'], 0.08)
    place(fol, st(sonar(880.0, 1.8, tau=0.25)), e['t'], 0.06)
for e in ev('wipe'):
    place(fol, st(surge(0.45, 1.0, 2500, 9000), 0.0), e['t'] - 0.2, 0.06)
for e in ev('motor'):
    d = e['d'] + 0.4; x = t_(d)
    f0 = 52 * (1 + 0.08 * np.minimum(1, x / d)); ph = 2 * np.pi * np.cumsum(f0) / SR
    hum = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + 0.15 * np.sin(5 * ph))
    shape = np.minimum(1, x / 0.5) * np.minimum(1, (d - x) / 0.25)
    rasp = bp(noise(d), 250, 900, 2) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * x) ** 8)
    place(fol, st(hp(lp(hum, 600), 90) * shape * 0.5 + rasp * shape * 0.08, 0.2), e['t'], 0.32)
    for j in range(int(d / 0.31)):
        c = t_(0.05); tk = bp(noise(0.05), 1500, 4500, 2) * np.exp(-c / 0.006) + np.sin(2 * np.pi * 2100 * c) * np.exp(-c / 0.01) * 0.3
        place(fol, st(tk, 0.2), e['t'] + 0.25 + j * 0.31 + rng.random() * 0.03, 0.035 * shape[min(len(shape) - 1, int((0.25 + j * 0.31) * SR))])
def clank(v=1.0, f=(410, 1130, 2670)):
    c = t_(1.4)
    x = sum(a * np.sin(2 * np.pi * ff * c) * np.exp(-c / tau) for ff, a, tau in zip(f, (0.5, 0.3, 0.18), (0.35, 0.16, 0.06)))
    return (x + bp(noise(1.4), 800, 5000, 2) * np.exp(-c / 0.015) * 0.8) * v
for e in ev('lock'):
    place(fol, st(hp(thump(1.0, 62), 40), e['pan']), e['t'], 0.18)
    place(fol, st(clank(), e['pan']), e['t'], 0.08)
for e in ev('gust'):               # the slam against the zenith-axis gears: a deep hit, a metal groan, the gears chattering
    big = 1.0 if e['k'] == 2 else 0.7
    place(fol, st(hp(thump(1.0, 48), 30), 0.1), e['t'], 0.34 * big)
    place(fol, st(clank(1.0, (190, 520, 1310)), 0.15), e['t'], 0.14 * big)
    x = t_(1.6); f0 = 70 + 25 * np.exp(-x * 2)
    groan = bp(np.sin(2 * np.pi * np.cumsum(f0) / SR) + 0.6 * np.sin(4 * np.pi * np.cumsum(f0) / SR * 1.01), 120, 1800, 2) * np.minimum(1, x / 0.05) * np.exp(-x / 0.6)
    place(fol, st(groan, 0.1), e['t'] + 0.05, 0.10 * big)
    for j in range(7):
        c = t_(0.04); tk = bp(noise(0.04), 1200, 5000, 2) * np.exp(-c / 0.005)
        place(fol, st(tk, 0.1 + 0.1 * rng.random()), e['t'] + 0.12 + j * 0.06 + 0.02 * rng.random(), 0.06 * big * (1 - j / 8))
for e in ev('alarm'):              # an electric bell in the control room, behind glass
    d = e['d']; x = t_(d)
    strike = (np.sin(2 * np.pi * 22 * x) > 0).astype(float)
    bell = (np.sin(2 * np.pi * 1180 * x) + 0.6 * np.sin(2 * np.pi * 2950 * x) + 0.3 * np.sin(2 * np.pi * 4410 * x)) * (0.6 + 0.4 * lp(strike, 60, 1))
    gate = ((x % 0.5) < 0.32).astype(float); gate = lp(gate, 30, 1)
    place(fol, st(bp(bell, 900, 5000, 2) * gate * np.minimum(1, (d - x) / 0.2), 0.6), e['t'], 0.018)
for e in ev('panel'):
    c = t_(0.08); place(fol, st(bp(noise(0.08), 2000, 7000, 2) * np.exp(-c / 0.01)), e['t'], 0.05)
for e in ev('tvon'):               # the TV comes on: a short beep (Quindar-like) and the signal's carrier, low
    place(fol, st(quindar(1.0, 2525)), e['t'], 0.035)
    x = t_(10.0); car = np.sin(2 * np.pi * 220 * x + 0.4 * np.sin(2 * np.pi * 3 * x)) * np.minimum(1, x / 1.2)
    place(fol, st(lp(car, 400) * np.minimum(1, (10 - x) / 1.0), 0.3), e['t'] + 0.3, 0.025)
for e in ev('track'):
    for j, s in enumerate([0, 99, 282, 336, 409]):
        c = t_(0.03); place(fol, st(bp(noise(0.03), 2500, 7000, 2) * np.exp(-c / 0.004), 0.4), e['t'] + 2.6 * s / 600, 0.06)
# space: a thin radio hiss on the Moon and around the globe; the control room's own tone and the window rattling
sp = env_pts([(0, 0), (cM, 0), (cM + 0.3, 1), (cR - 0.05, 1), (cR + 0.1, 0), (FILM, 0)])
hiss = np.stack([bp(np.random.default_rng(12).standard_normal(N), 2500, 7000, 2), bp(np.random.default_rng(13).standard_normal(N), 2500, 7000, 2)], 1)
amb += hiss / np.abs(hiss).max() * (sp * 0.035)[:, None]
rm = env_pts([(0, 0), (cR, 0), (cR + 0.15, 1), (T['tvcut'] - 0.05, 1), (T['tvcut'] + 0.05, 0), (FILM, 0)])
tone = np.stack([lp(np.random.default_rng(14).standard_normal(N), 180, 2), lp(np.random.default_rng(15).standard_normal(N), 180, 2)], 1)
amb += tone / np.abs(tone).max() * (rm * 0.10)[:, None]
for e in ev('whip'):
    place(fol, st(surge(0.55, 1.0, 600, 5000), 0.5), e['t'], 0.10)
for e in ev('mainbeam'):
    c = t_(0.06); place(fol, st(bp(noise(0.06), 1800, 6000, 2) * np.exp(-c / 0.008), -0.2), e['t'], 0.09)   # the needle hits its stop
for e in ev('mainbeam'):
    x = t_(3.0); bell = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x / tau) for f, a, tau in [(1174.7, 0.5, 1.2), (2349.3, 0.2, 0.5), (3524, 0.08, 0.25)])
    place(fol, st(bell, 0.0), e['t'], 0.05)
tv0, sw = T['tvcut'], T['sw']
if tv0 < FILM:                     # the TV: hiss and line buzz while it is Honeysuckle's picture; cleaner after the switch
    d = T['col'] + 0.05 - tv0; x = t_(d)
    hiss = bp(noise(d), 1800, 9000, 2); buzz = np.sign(np.sin(2 * np.pi * 50 * x)) * 0.3; buzz = bp(buzz, 100, 1200, 2)
    pre = (x < (sw - tv0)).astype(float); pre = lp(pre, 40, 1)
    sig = hiss * (0.05 * pre + 0.012) + buzz * (0.012 * pre + 0.006)
    sig *= np.minimum(1, x / 0.08) * np.minimum(1, (d - x) / 0.03)
    place(fol, st(sig, 0.0), tv0)
for e in ev('switch'):
    c = t_(0.05); place(fol, st(bp(noise(0.05), 1500, 6000, 2) * np.exp(-c / 0.008)), e['t'], 0.08)
for e in ev('collapse'):           # the CRT collapses into a line: a falling whine and a soft pop
    x = t_(0.5); f = 3000 * np.exp(-x * 9) + 80
    zap = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.15)
    place(fol, st(zap, 0.0), e['t'], 0.05)
    place(fol, st(hp(thump(0.6, 70), 40)), e['t'] + 0.3, 0.10)
for e in ev('finalping'):
    place(fol, st(sonar(293.7, 6.0, tau=0.9), 0.0), e['t'], 0.10)
    place(fol, st(sonar(587.3, 5.0, tau=0.6), 0.0), e['t'] + 0.02, 0.05)

# ---------- 3. score ----------
sc = []
add = lambda *a, **k: sc.append(dict(zip(['t', 'inst', 'pitch', 'dur', 'vel', 'pan', 'gain'], a), **k))
# night
add(0.45, 'contrabass', 'D2', 9.0, 0.45, 0.0, 0.26, attack=1.6)
rev = evt('reveal', 1.1); add(rev, 'contrabass', 'A2', 8.0, 0.35, 0.15, 0.18, attack=1.2)
add(4.2, 'vibraphone_bowed', 'D4', 5.4, 0.5, -0.25, 0.45, attack=0.9)
add(4.2, 'vibraphone_bowed', 'A4', 5.4, 0.5, 0.25, 0.40, attack=1.1)
for e in ev('sky'):
    for j, (p, dt) in enumerate([('A6', 0.0), ('D7', BEAT / 2), ('E7', BEAT * 1.5), ('A6', BEAT * 3)]):
        add(e['t'] + dt, 'glockenspiel', p, 2.0, 0.32, 0.3 + 0.1 * j, 0.14)
# the storm day: minor, low strings, a high tremolo for tension
d0 = T['day']
add(d0, 'cellos', 'D3', 9.4, 0.5, -0.2, 0.30, attack=1.2)
add(d0, 'contrabass', 'D2', 15.6, 0.5, 0.0, 0.30, attack=1.0)
add(T['c2'] + 0.1, 'cellos', 'F3', 5.0, 0.45, 0.2, 0.22, attack=1.5)
add(T['c2'] + 0.1, 'violins_trem', 'A5', 5.0, 0.3, 0.3, 0.06, attack=2.0)
add(T['c3a'], 'cellos', 'Eb3', 6.0, 0.55, 0.2, 0.26, attack=0.4)
add(T['c3a'], 'violins_trem', 'Bb5', 6.0, 0.4, -0.3, 0.08, attack=1.0)
for g, v in [(T['g1'], 0.6), (T['g2'], 0.9)]:
    sc.append(dict(t=g, inst='timpani', pitch='A2', dur=2.5, vel=v, pan=0.0, gain=0.5))
# (near-silence during the comparison panel: nothing new from 24.6 to 27.2)
# the signal: a pulse comes back, building to the switch
c4 = T['c4']
add(c4, 'contrabass', 'D2', 13.2, 0.45, 0.0, 0.26, attack=1.5)
add(c4, 'vibraphone_bowed', 'A3', 9.5, 0.45, -0.3, 0.30, attack=1.2)
nb = int((T['tvcut'] - T['tvon']) / (BEAT / 2))
for j in range(nb):
    p = ['D5', 'A4', 'D5', 'E5'][j % 4] if j < nb * 0.6 else ['D5', 'A5', 'E5', 'A5'][j % 4]
    add(T['tvon'] + j * BEAT / 2, 'vibraphone', p, 0.4, 0.22 + 0.25 * j / nb, 0.3 * ((j % 2) * 2 - 1), 0.09 + 0.07 * j / nb)
add(T['c4'] + 9.8, 'violins', 'A4', 3.2, 0.4, -0.2, 0.10, attack=2.4)
add(T['c4'] + 9.8, 'cellos', 'F#3', 3.2, 0.4, 0.2, 0.16, attack=2.4)
# the switch: the one bright chord
s0 = T['sw']
for p, g, pan in [('D4', 0.45, -0.3), ('F#4', 0.40, 0.0), ('A4', 0.40, 0.3)]:
    add(s0, 'vibraphone_bowed', p, 7.5, 0.6, pan, g, attack=0.05)
add(s0, 'violins', 'D5', 7.0, 0.55, -0.2, 0.16, attack=0.3); add(s0, 'violins', 'F#5', 7.0, 0.5, 0.2, 0.12, attack=0.4)
add(s0, 'cellos', 'D3', 8.0, 0.55, 0.0, 0.26, attack=0.2); add(s0, 'contrabass', 'D2', 8.5, 0.55, 0.0, 0.28, attack=0.2)
for j, p in enumerate(['D5', 'F#5', 'A5', 'D6']): add(s0 + j * 0.06, 'harp', p, 3.0, 0.5, -0.4 + 0.25 * j, 0.20)
add(s0, 'glockenspiel', 'D7', 2.5, 0.4, 0.3, 0.12)
# the end: the chord breathes again with the last ping, then lets go
pg = T['ping']
add(pg, 'vibraphone_bowed', 'D4', 6.6, 0.45, -0.3, 0.32, attack=1.0); add(pg, 'vibraphone_bowed', 'A4', 6.6, 0.45, 0.3, 0.28, attack=1.2)
add(pg, 'vibraphone_bowed', 'E5', 3.4, 0.4, 0.4, 0.18, attack=1.6)
add(pg - 0.5, 'contrabass', 'D2', 7.3, 0.45, 0.0, 0.24, attack=1.0)
# the credit card: the suspended E resolves down to D, one soft harp note under the signature, and everything lets go by 52 s
add(48.3, 'vibraphone_bowed', 'D5', 3.5, 0.38, 0.35, 0.16, attack=0.8)
add(48.45, 'harp', 'D4', 3.4, 0.35, -0.2, 0.14)
add(48.45, 'glockenspiel', 'A6', 2.4, 0.22, 0.25, 0.06)
for j, (p, dt) in enumerate([('A6', 0.0), ('E7', BEAT), ('D7', BEAT * 2.5)]): add(pg + 0.4 + dt, 'glockenspiel', p, 2.0, 0.3, 0.2 + 0.1 * j, 0.10)
mus = S.render(sc, dur=N / SR, master=False)[:N]
mus = S.room(mus.astype(np.float32), size=0.75, mix=0.32)

# ---------- 4. narration ----------
vo = np.zeros((N, 2)); voenv = np.zeros(N)
words = {}
for e in ev('vo'):
    x, sr = sf.read(os.path.join(HERE, 'vo', 'wav', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = hp(x, 80, 2)
    x = compress(x / (np.abs(x).max() + 1e-9) * 0.8, thr=0.18, ratio=3.0)
    place(vo, st(x, 0.0), e['t'])
    i0 = int(e['t'] * SR); voenv[i0:i0 + len(x)] = 1
voenv = np.convolve(voenv, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')

# ---------- 5. balance: music and ambience give way to the voice ----------
def rms(x, m=None):
    x = x.mean(1) if x.ndim > 1 else x
    if m is not None: x = x[m]
    return np.sqrt((x ** 2).mean() + 1e-12)
on = voenv > 0.5
bed = mus + 0.6 * amb
target = rms(vo, on) / (10 ** (10 / 20))                                 # voice ≈ 10 dB above the bed while it speaks
bed *= target / (rms(bed, on) + 1e-9) * 1.8
duck = 1 - 0.45 * voenv
dip = np.stack([bp(bed[:, i], 300, 4000, 2) for i in range(2)], 1)
bed = bed - (0.5 * voenv)[:, None] * dip
mix = bed * duck[:, None] + fol * (1 - 0.3 * voenv)[:, None] * (target / (rms(bed, on) + 1e-9)) * 0.9 + vo
mix = 0.85 * mix + 0.15 * S.room(mix.astype(np.float32), size=0.5, mix=1.0)

# ---------- cut ----------
a, b = int(T0 * SR), int((T0 + DUR) * SR)
out = mix[a:b].copy()
if T0 + DUR < FILM - 1e-6:
    f = int(0.45 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
else:
    f = int(1.6 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
out /= np.abs(out).max() + 1e-9; out *= 0.5
out = np.stack([limit(out[:, i], 0.9) for i in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
vr = rms(vo[a:b], on[a:b]); br = rms((bed * duck[:, None])[a:b], on[a:b])
print('mix.wav', round(len(out) / SR, 2), 's · voice over bed while speaking:', round(20 * np.log10(vr / (br + 1e-12)), 1), 'dB')
