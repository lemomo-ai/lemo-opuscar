"""Sound for The Other Half (whole-film timeline; renders the stretch FROM..TO).

Layers, all placed from the page's events (events.json):
  narration  English, Kokoro bf_emma (out/voice/*.wav, from voice/lines.json), compressed, set ~10 dB over the music by RMS;
             under each line the music ducks and gives up 300 Hz – 4 kHz.
  ambience   meadow wind + distant birds above ground; closed down by a low-pass as the camera sinks; a close,
             quiet earth tone inside the magnifier; the meadow comes back faintly in the last wide shot.
  foley      graphite writing and ruling, waxy colour-pencil hatching, long strokes for the roots, a dry crackle when
             hyphae spread, a lens "tock" when the magnifier opens/closes, plinks for the sugar and water grains.
  score      96 bpm, 4/4, a bar = 2.5 s, D major, 19.5 bars:
             surface (guitar + a flute question that doesn't resolve) → descent (bass steps down, clarinet) → near-silence
             before the magnifier → bowed vibraphone and harp inside it → the trade (marimba calls, kalimba answers) →
             the open question (thin, unresolved) → near-silence → the wood (guitar, strings, the flute line resolves on D).
Writes out/mix.wav (48 kHz stereo). Run from the library root:  .venv/bin/python styles/colored-pencil/demo/mix.py   (FROM / TO pick a stretch; default the whole film)
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
FROM = float(os.environ.get('FROM', 0)); TO = float(os.environ.get('TO', 50.8)); FILM = 50.8
D = json.load(open(os.path.join(HERE, 'events.json')))
EV = [dict(e, t=e['t'] + FROM) for e in D['ev']]
N = int(TO * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(7)
BEAT = 0.625; BAR = 2.5
first = lambda typ: next((e['t'] for e in EV if e['type'] == typ), None)


def activity(kinds, k=0.9, smooth=0.03):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] not in kinds: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e.get('d', 0.05), 0.03)) * SR))
        if i1 <= i0 or i0 < 0: continue
        n = i1 - i0; env = np.ones(n); r = min(n // 3, int(0.02 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    level = 1 - np.exp(-a * k)
    ker = np.ones(int(smooth * SR)); ker /= ker.size
    return np.convolve(level, ker, 'same'), np.convolve(pan, ker, 'same')


def scratch(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * g)


def wobble(rate, seed, power=1.0):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 2.5 * lp(r.standard_normal(N), 3, 1)) / SR) * 2 * np.pi
    return (0.5 + 0.5 * np.abs(np.sin(ph))) ** power


def pan_st(x, pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-12)

# ---------------- foley ----------------
fx = np.zeros((N, 2))
lv, pn = activity({'write'}); fx += pan_st(scratch(2000, 6500, 800, 0.9, 1) * wobble(10, 2, 1.5) * lv, pn * 0.6) * 0.15
lv, pn = activity({'line'}); fx += pan_st(scratch(1800, 5200, 500, 0.7, 3) * wobble(4, 4) * lv, pn * 0.6) * 0.12
lv, pn = activity({'color'}, k=0.7, smooth=0.08); fx += pan_st(scratch(600, 3200, 260, 0.75, 5) * wobble(7.5, 6, 2) * lv, pn * 0.7) * 0.18
lv, pn = activity({'root', 'root2'}, k=0.25, smooth=0.1); fx += pan_st(scratch(450, 2400, 180, 0.6, 7) * wobble(2.6, 8) * lv, pn * 0.7) * 0.13
lv, pn = activity({'myc'}, k=0.5, smooth=0.1)
crk = np.zeros(N); r = np.random.default_rng(9)
for i in np.nonzero(r.random(N) < 70 / SR)[0]: crk[i] = r.uniform(0.3, 1.0) * r.choice([-1, 1])
crk = hp(crk, 3500, 2)
fx += pan_st(crk * lv, pn * 0.8) * 0.2
for e in EV:
    p = e.get('pan', 0) * 0.6
    if e['type'] == 'tag': add(fx, lp(click(pitch=0.35, v=1.0), 2500) * 0.15, e['t'], 1.0, p)
    if e['type'] in ('write', 'line') and e.get('d', 0) > 0.1: add(fx, hp(click(pitch=0.6 + rng.random() * 0.2, v=1.0), 1500) * 0.04, e['t'], 1.0, p)
    if e['type'] == 'pop':                                                    # the lens: a soft wooden tock + air
        add(fx, lp(click(pitch=0.22, v=1.0), 1800) * 0.35, e['t'], 1.0, p)
        add(fx, lp(whoosh(0.9, 1.0), 3000) * 0.10, e['t'] - 0.05, 1.0, 0)
    if e['type'] == 'absorb':
        n = int(0.5 * SR); x = hp(np.random.default_rng(3).standard_normal(n), 4000) * np.linspace(1, 0, n) ** 2
        add(fx, x * 0.025, e['t'], 1.0, 0)

# ---------------- ambience ----------------
cam = sorted([(e['t'], e['y'], e.get('z', 8), e.get('close', 0)) for e in EV if e['type'] == 'cam'])
ct = [c[0] for c in cam]
cy = np.interp(tt, ct, [c[1] for c in cam]); cz = np.interp(tt, ct, [c[2] for c in cam]); cc = np.interp(tt, ct, [c[3] for c in cam])
under = np.clip((1.7 - cy) / 2.6, 0, 1); under = under * under * (3 - 2 * under)
wide = np.clip((cz - 15) / 5, 0, 1)
surf_amt = np.clip((1 - under) * (1 - cc) + 0.55 * wide, 0, 1)
wind = lp(rng.standard_normal(N), 900, 2) * (0.6 + 0.4 * lp(rng.standard_normal(N), 0.4, 1) * 30).clip(0.2, 1.4)
birds = np.zeros(N)
for t0 in [0.35, 1.6, 2.2, 3.4, 41.0, 42.4, 44.8, 46.5]:
    n = int(0.11 * SR); x = np.arange(n) / SR
    f = 3800 + 1400 * np.sin(np.pi * x / 0.11) + rng.uniform(-300, 300)
    for k in range(2):
        s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.04 * k)) / SR) * np.sin(np.pi * x / 0.11) ** 2
        i = int((t0 + k * 0.16) * SR)
        if 0 <= i and i + n < N: birds[i:i + n] += s * (0.5 if k else 0.8)
surface = wind * 0.035 + birds * 0.011
surface = surface * surf_amt + lp(surface, 380, 2) * (1 - surf_amt) * under * 0.6
earth = lp(np.cumsum(rng.standard_normal(N)) * 0.002, 160, 2); earth -= lp(earth, 30, 1)
earth = earth / (np.abs(earth).max() + 1e-9) * 0.045 * np.clip(under + cc, 0, 1) * (1 - 0.5 * wide)
fx += np.stack([surface + earth, np.roll(surface, 613) + np.roll(earth, 401)], 1)

# ---------------- score ----------------
ev = []
def B(bar, beat=0.0): return bar * BAR + beat * BEAT
def arp(bar, notes, v, n=8, inst='guitar_nylon', pan=-0.2, g=0.75, step=0.5):
    for i in range(n): ev.append((B(bar, i * step), inst, notes[i % len(notes)], 0.9, v + 0.05 * (i % 4 == 0), pan + 0.05 * (i % 3), g))
# surface: D – Bm, the flute asks (rises, stops on E)
arp(0, [50, 57, 62, 64, 66, 64, 62, 57], 0.40); arp(1, [47, 54, 57, 62, 64, 62, 57, 54], 0.36)
for t, p, d, v in [(B(0, 1), 69, 0.5, 0.36), (B(0, 1.5), 74, 0.5, 0.38), (B(0, 2), 76, 0.6, 0.40), (B(0, 3), 78, 0.4, 0.38), (B(1, 0), 76, 1.6, 0.36)]:
    ev.append((t, 'flute', p, d, v, 0.25, 0.5))
# descent: the bass walks down, the clarinet follows
arp(2, [43, 50, 55, 59, 54, 50, 47, 50], 0.32); arp(3, [40, 47, 52, 55, 52, 47, 43, 47], 0.28)
for t, p in [(B(0), 38), (B(0, 2), 45), (B(1), 35), (B(1, 2), 42), (B(2), 31), (B(2, 2), 28), (B(3), 28), (B(4), 26)]:
    ev.append((t, 'contrabass_pizz', p, 1.0, 0.5, 0.05, 0.85))
for t, p, d in [(B(2), 66, 1.2), (B(2, 2), 64, 1.2), (B(3), 62, 1.2), (B(3, 2), 59, 1.5)]:
    ev.append((t, 'clarinet', p, d, 0.34, 0.2, 0.5))
arp(4, [38, 45, 50, 45], 0.24, n=6)                                  # thinning out; 11.4–12.5 nearly silent
# the magnifier opens (12.5): a bell, then bowed vibraphone chords with sparse harp
ev.append((B(5), 'glockenspiel', 86, 1.5, 0.42, 0.3, 0.45)); ev.append((B(5), 'harp', 62, 2.0, 0.5, -0.2, 0.6))
for bar, ch in [(5, [57, 62, 66, 69]), (6, [59, 62, 66, 71]), (7, [55, 62, 67, 71])]:
    for p in ch: ev.append((B(bar), 'vibraphone_bowed', p, 2.5, 0.36, (p - 64) / 14, 0.5))
    for i, p in enumerate(ch * 2):
        if i % 2 == 0: ev.append((B(bar, i * 0.5), 'harp', p + 12, 1.2, 0.22, 0.3 - 0.1 * i, 0.4))
for i, p in enumerate([81, 83, 86, 88, 90]):                         # hyphae drawn round the root
    ev.append((14.6 + i * 0.42, 'glockenspiel', p, 0.6, 0.16, 0.4 - 0.15 * i, 0.3))
# the trade (20–30): marimba calls (sugar out), kalimba answers (water back), pizz bass
for bar, root, ch in [(8, 38, [62, 66, 69, 74]), (9, 43, [62, 67, 71, 74]), (10, 40, [59, 64, 67, 71]), (11, 45, [61, 64, 69, 73])]:
    ev.append((B(bar), 'contrabass_pizz', root, 1.0, 0.5, 0.0, 0.8)); ev.append((B(bar, 2), 'contrabass_pizz', root + 7, 1.0, 0.42, 0.0, 0.7))
    for i in range(4): ev.append((B(bar, i), 'marimba', ch[i], 0.4, 0.34, 0.25, 0.5))
    if bar >= 10:
        for i in range(4): ev.append((B(bar, i + 0.5), 'kalimba', ch[3 - i] + 12, 0.5, 0.4, -0.25, 0.55))
# the next tree, the open question (30–38.75): kalimba alone, then a suspended chord and an unanswered clarinet
for i, p in enumerate([74, 71, 69, 66, 69, 71]): ev.append((B(12, i * 0.5), 'kalimba', p, 0.6, 0.32, -0.2, 0.5))
for p in [55, 62, 64, 69]: ev.append((B(13), 'vibraphone_bowed', p, 4.8, 0.34, (p - 62) / 14, 0.45))
for t, p, d in [(B(13, 3), 62, 0.6), (B(14), 64, 0.6), (B(14, 1), 66, 0.6), (B(14, 2), 69, 1.6)]:
    ev.append((t, 'clarinet', p, d, 0.32, 0.2, 0.45))
ev.append((B(14, 2), 'contrabass_pizz', 33, 1.0, 0.4, 0.0, 0.7))
# iris-in: harp falls; 40.0 the wood: guitar, strings, the flute line answers itself on D
for i, p in enumerate([86, 81, 78, 74, 69, 66, 62]): ev.append((B(15, 2.2) + i * 0.09, 'harp', p, 1.0, 0.35, 0.3 - 0.1 * i, 0.55))
for bar, notes in [(16, [50, 57, 62, 64, 66, 64, 62, 57]), (17, [47, 54, 57, 62, 66, 62, 57, 54])]:
    arp(bar, notes, 0.40)
for bar, ch in [(16, [50, 57, 62, 66]), (17, [47, 54, 62, 66])]:
    for p in ch: ev.append((B(bar), 'cellos' if p < 55 else 'violins', p, 2.5, 0.30, (p - 58) / 20, 0.45))
for t, p, d, v in [(B(16, 1), 69, 0.5, 0.38), (B(16, 1.5), 74, 0.5, 0.40), (B(16, 2), 76, 0.6, 0.42), (B(16, 3), 78, 0.6, 0.42), (B(17, 0), 76, 0.6, 0.40), (B(17, 1), 74, 2.2, 0.40)]:
    ev.append((t, 'flute', p, d, v, 0.25, 0.5))
CAD = B(18)
for i, p in enumerate([50, 57, 62, 66, 69, 74, 78]): ev.append((CAD + i * 0.04, 'harp', p, 4.5, 0.5, -0.3 + i * 0.1, 0.75))
for p in [50, 57, 62, 66]: ev.append((CAD, 'cellos' if p < 55 else 'violins', p, 5.0, 0.3, (p - 58) / 20, 0.45))
for i, p in enumerate([74, 78, 81]): ev.append((CAD + 2.5 + i * 0.3, 'harp', p, 2.5, 0.28, 0.2 - 0.1 * i, 0.5))   # a last light arpeggio under the credit
ev.append((CAD, 'contrabass_pizz', 38, 1.6, 0.55, 0.0, 0.85)); ev.append((CAD + 0.02, 'glockenspiel', 86, 2.5, 0.35, 0.2, 0.4))
S.seed(11)
music = S.render([e for e in ev if e[0] < TO], dur=TO + 4, master=False)[:N]
music = S.room(music, size=0.42, mix=0.2)
fade = np.clip((FILM - tt) / 2.6, 0, 1) ** 1.3                          # the film's own tail
music *= fade[:, None]

# ---------------- narration ----------------
vo = np.zeros(N); voenv = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    x, sr = sf.read(os.path.join(HERE, 'out', 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); i = int(e['t'] * SR)
    if i >= N or i + len(x) <= 0: continue
    j0 = max(0, -i); x = x[j0:]; i = max(0, i); n = min(len(x), N - i)
    vo[i:i + n] += x[:n]; voenv[i:i + n] = 1
vo = compress(hp(vo, 90), thr=0.12, ratio=3.0)
ker = np.ones(int(0.25 * SR)); ker /= ker.size
duck = np.clip(np.convolve(voenv, ker, 'same') * 1.6, 0, 1)
mid = bp(music, 300, 4000, 2) if music.ndim == 1 else np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
music = music - mid * (0.55 * duck)[:, None]
music *= (1 - 0.45 * duck)[:, None]
bed = music * 0.8 + fx
if voenv.any():
    on = voenv > 0
    vo_rms = rms(vo[on]); bed_rms = rms(bed[on].mean(1))
    vo *= (bed_rms * 10 ** (10 / 20)) / vo_rms                         # voice ~10 dB over everything under it
mix = bed + np.stack([vo, vo], 1)

# ---------------- master the stretch ----------------
mix = mix[int(FROM * SR):]
if TO < FILM:
    n = int(0.35 * SR); mix[-n:] *= np.linspace(1, 0, n)[:, None] ** 1.5
mix = np.stack([compress(mix[:, 0], thr=0.3, ratio=2.5), compress(mix[:, 1], thr=0.3, ratio=2.5)], 1)
# keep the crest factor ~11 dB so mastering to -14 LUFS leaves true peaks under -1 dB
ceil = min(0.9, rms(mix) * 10 ** (11 / 20))
mix = np.stack([limit(mix[:, 0], ceil=ceil), limit(mix[:, 1], ceil=ceil)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = ['guitar_nylon', 'contrabass_pizz', 'flute', 'clarinet', 'vibraphone_bowed', 'glockenspiel', 'harp', 'marimba', 'kalimba', 'cellos', 'violins']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3))
