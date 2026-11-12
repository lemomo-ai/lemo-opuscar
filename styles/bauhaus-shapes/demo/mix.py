"""Sound for the Bauhaus film: narration + music + effects for the WHOLE 52 s timeline, then cut to [a, b].

Reads events.json (absolute film seconds, exported from index.html, including one 'voice' event per line)
and voice/<id>.wav (Kokoro, af_heart). The score is written for the whole film on one 120 bpm grid in D major.
Voice: compressed, then the music is set about 10 dB under it by RMS and dips in 300 Hz–4 kHz while a line plays.
Writes out/mix-<a>-<b>.wav (48 kHz stereo). Run from the library root:
  .venv/bin/python styles/bauhaus-shapes/demo/mix.py [a b]      (default: the whole film)
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, clack, whoosh, thump, pop

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
FULL = float(D['dur']); EV = D['ev']; N = int(FULL * SR)
A, B = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) > 2 else (0.0, FULL)
rng = np.random.default_rng(7)

def evs(kind): return [e for e in EV if e['type'] == kind]
def rms(x): return float(np.sqrt(np.mean(np.square(x)) + 1e-12))
def db(x): return 20 * np.log10(x + 1e-12)

# ---------------- effects ----------------
fx = np.zeros((N, 2))
for e in evs('grid'):                         # a ruling pen along a straight edge
    d = e['d']; n = int(d * SR); x = bp(rng.standard_normal(n), 3000, 7500, 2)
    env = np.sin(np.pi * np.arange(n) / n) ** 1.5 * (0.7 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 9))
    add(fx, x * env * 0.030, e['t'], 1.0, e['pan'] * 0.8)
    add(fx, hp(click(pitch=1.4, v=1.0), 2500) * 0.035, e['t'], 1.0, e['pan'] * 0.8)
for e in evs('snap'):
    add(fx, clack(pitch=0.55, v=1.0) * 0.28, e['t'], 1.0, e['pan']); add(fx, thump(v=1.0, f=95) * 0.36, e['t'], 1.0, e['pan'])
for e in evs('hinge'):
    add(fx, lp(whoosh(0.7, 1.0), 2200) * 0.15, e['t'] - 0.55, 1.0, 0.1)
    add(fx, thump(v=1.0, f=62) * 0.5, e['t'], 1.0, e['pan']); add(fx, clack(pitch=0.4, v=1.0) * 0.14, e['t'], 1.0, e['pan'])
for i, e in enumerate(evs('block')):
    add(fx, click(pitch=0.55 + 0.03 * (i % 8), v=1.0) * 0.15, e['t'], 1.0, e['pan'])
for e in evs('drop'):
    add(fx, thump(v=1.0, f=140) * 0.3, e['t'], 1.0, e['pan']); add(fx, pop(1.0) * 0.05, e['t'] + 0.02, 1.0, e['pan'])
for e in evs('slide'):
    add(fx, hp(whoosh(e['d'], 1.0), 900) * 0.05, e['t'], 1.0, e['pan'])
for e in evs('pop'):
    add(fx, pop(1.0) * 0.15, e['t'], 1.0, e['pan']); add(fx, click(pitch=0.8, v=1.0) * 0.07, e['t'], 1.0, e['pan'])
for e in evs('roll'):                         # low felt rumble that grows with the ball
    n = int(e['d'] * SR); x = lp(rng.standard_normal(n), 260, 2)
    grow = np.linspace(0, 1, n) ** 1.6; tail = np.minimum(1, np.linspace(e['d'], 0, n) / 0.15)
    wob = 0.75 + 0.25 * np.sin(np.cumsum(np.linspace(6, 2, n)) / SR * 2 * np.pi)
    add(fx, x * (0.15 + 0.85 * grow) * tail * wob * (0.12 if e.get('small') else 0.2), e['t'], 1.0, 0.0)
for e in evs('ring'):
    k = e['k']; add(fx, thump(v=1.0, f=150 * 0.86 ** k) * (0.2 + 0.045 * k), e['t'], 1.0, e['pan'] * 0.7)
for e in evs('retract'):
    add(fx, hp(whoosh(e['d'], 1.0), 2500)[::-1] * 0.035, e['t'], 1.0, 0.0)
for e in evs('tick'):                         # ruler ticks: dry, small, wooden
    add(fx, hp(clack(pitch=1.3, v=1.0), 1500) * 0.07, e['t'], 1.0, e['pan'])
for e in evs('tock'):                         # simple-interest squares: same knock every decade (nothing compounds)
    add(fx, clack(pitch=0.7, v=1.0) * 0.16, e['t'], 1.0, e['pan']); add(fx, thump(v=1.0, f=180) * 0.10, e['t'], 1.0, e['pan'])
for e in evs('swing'):
    add(fx, lp(whoosh(e['d'], 1.0), 1800) * 0.16, e['t'], 1.0, 0.0)
for e in evs('zoom'):                         # through the yellow ring: rising air, then the reveal on the far side
    n = int(e['d'] * SR); x = bp(rng.standard_normal(n), 400, 5000, 2); env = np.sin(np.pi * np.arange(n) / n) ** 2
    add(fx, x * env * 0.06, e['t'], 1.0, 0.0)
for e in evs('whip'):
    add(fx, whoosh(e['d'] + 0.1, 1.0) * 0.16, e['t'] - 0.05, 1.0, 0.0)
for e in evs('drain'):
    add(fx, pop(1.0)[::-1] * 0.10, e['t'], 1.0, e['pan']); add(fx, hp(whoosh(0.45, 1.0), 1200) * 0.05, e['t'], 1.0, e['pan'])
for e in evs('fall'):                         # the S4 pieces drop out of frame, one after another
    for i, dt in enumerate([0.25, 0.42, 0.6, 0.78]):
        add(fx, thump(v=1.0, f=70 + 12 * i) * 0.18, e['t'] + dt, 1.0, -0.3 + 0.2 * i)
    add(fx, lp(whoosh(0.8, 1.0), 1500) * 0.10, e['t'], 1.0, 0.0)

# ---------------- score: 120 bpm, D major, bar = 2 s ----------------
CH = {'D': (50, [62, 66, 69]), 'Bm': (47, [62, 66, 71]), 'G': (43, [62, 67, 71]), 'A': (45, [61, 64, 69]), 'F#m': (54, [61, 66, 69]), 'Em': (52, [64, 67, 71])}
# chord per bar, by section (bar b starts at 2b s)
BARS = ['D', 'D', 'Bm', 'G', 'A', 'D',          # S1  0–12
        'D', 'F#m', 'G', 'A', 'Bm',              # S2 12–22
        'G', 'Em', 'Bm', 'G', 'A',               # S3 22–32
        'Bm', 'G', 'D', 'A',                     # S4 32–40
        'D', 'G', 'A', 'G', 'D']                 # S5 40–50
LANDS = [e['t'] for e in evs('land')] + [e['t'] for e in evs('final')]
def quiet_marimba(t):
    if t < 3.5: return True                                    # S1 build: blocks and grid only
    for L in LANDS:
        if L - 0.1 <= t < L + 1.6: return True                 # let each landing ring
    if 20.3 <= t < 22.2: return True                           # the zoom through the ring
    if 40.4 <= t < 41.8: return True                           # the fall
    if t >= 48.9: return True
    return False
music_ev = []
for b, name in enumerate(BARS):
    t0 = b * 2.0; root, tones = CH[name]
    if t0 >= FULL: break
    if t0 >= 1.0:
        music_ev.append((t0, 'cellos_pizz', root, 0.6, 0.50, -0.1, 0.8))
        if not any(L - 0.3 <= t0 + 1.0 < L + 1.2 for L in LANDS): music_ev.append((t0 + 1.0, 'cellos_pizz', root + 7, 0.6, 0.40, -0.1, 0.7))
    for i in range(8):
        t = t0 + i * 0.25
        if t >= FULL or quiet_marimba(t): continue
        if 21.0 <= t < 32.7 and i % 2: continue                # S3: half the notes, more air for the explanation
        p = tones[[0, 2, 1, 2, 0, 2, 1, 2][i]] + (12 if i in (3, 7) else 0)
        music_ev.append((t, 'marimba', p, 0.3, 0.25 + 0.05 * (i % 2 == 0), 0.2, 0.5))
for t, p in [(1.4, 62), (1.95, 66), (2.5, 69), (3.15, 74)]:
    music_ev.append((t, 'vibraphone', p, 1.2, 0.42, -0.2, 0.55))
SCALE = [74, 76, 78, 81, 83, 86, 88]
for e in evs('ring'):
    music_ev.append((e['t'], 'kalimba', SCALE[min(6, e['k'] - 1)], 1.2, 0.5 + 0.04 * e['k'], 0.3, 0.75))
def chord(t, notes, big=False):
    for i, p in enumerate(notes):
        music_ev.append((t + i * 0.03, 'harp', p, 2.0, 0.6 if big else 0.5, -0.3 + i * 0.12, 0.85))
    music_ev.append((t, 'vibraphone', notes[-3], 2.0, 0.5, 0.0, 0.6)); music_ev.append((t, 'vibraphone', notes[-2], 2.0, 0.45, 0.1, 0.5))
    music_ev.append((t + 0.02, 'glockenspiel', notes[-1] + 12, 1.5, 0.5, 0.2, 0.5)); music_ev.append((t, 'cellos_pizz', notes[0] - 12, 1.0, 0.6, 0.0, 0.9))
KEYS = {'D': [50, 57, 62, 66, 69, 74], 'Bm': [47, 54, 59, 62, 66, 71], 'G': [43, 50, 55, 59, 62, 67]}
for e in evs('land'): chord(e['t'], KEYS[e.get('key', 'D')])
for e in evs('accent'):
    k = KEYS[e.get('key', 'D')]
    music_ev.append((e['t'], 'vibraphone', k[3], 1.6, 0.45, -0.1, 0.55)); music_ev.append((e['t'], 'vibraphone', k[4], 1.6, 0.42, 0.1, 0.5))
    music_ev.append((e['t'] + 0.02, 'glockenspiel', k[5] + 12, 1.2, 0.42, 0.2, 0.45))
for e in evs('final'):
    chord(e['t'], [38, 50, 57, 62, 66, 69, 74], big=True)
    for i, p in enumerate([86, 90, 93]): music_ev.append((e['t'] + 0.25 + 0.18 * i, 'glockenspiel', p, 1.5, 0.35, 0.3, 0.4))
S.seed(5)
music = S.render(music_ev, dur=FULL + 3, master=False)[:N]
music = S.room(music, size=0.35, mix=0.18)
tail = np.clip((FULL - np.arange(N) / SR) / 0.9, 0, 1) ** 1.2
music *= tail[:, None]

# ---------------- voice ----------------
vo = np.zeros(N); VOICE = []
for e in evs('voice'):
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    x = hp(x, 90)
    i0 = int(e['t'] * SR); i1 = min(N, i0 + len(x)); vo[i0:i1] += x[:i1 - i0]; VOICE.append((e['t'], e['t'] + len(x) / SR))
vo = compress(vo, thr=0.12, ratio=3.0, att=0.003, rel=0.12)
voiced = np.zeros(N, bool)
for a, b in VOICE: voiced[int(a * SR):int(b * SR)] = True
vo *= 0.22 / rms(vo[voiced])                               # a fixed reference level for the voice
# music: dip in the voice band while a line plays, then sit ~10 dB under the voice by RMS
duck = np.ones(N); duck[voiced] = 0.0
k = int(0.3 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
music = music - mid * (1 - duck)[:, None] * 0.55
bed = music + fx
g_bed = (rms(vo[voiced]) / 10 ** (10 / 20)) / rms(bed[voiced].mean(1))
bed *= g_bed
mix = bed + np.stack([vo, vo], 1)
print('voice − bed (RMS, while speaking): %.1f dB' % (db(rms(vo[voiced])) - db(rms(bed[voiced].mean(1)))))

# ---------------- master the cut ----------------
i0, i1 = int(A * SR), int(min(B, FULL) * SR)
out = mix[i0:i1].copy()
f = int(0.35 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5      # the only change for an excerpt: a short fade
out = np.stack([compress(out[:, c], thr=0.18, ratio=2.5) for c in range(2)], 1)
out = np.stack([limit(out[:, c], ceil=0.45) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
dst = os.path.join(HERE, 'out', f'mix-{A:g}-{B:g}.wav')
sf.write(dst, out.astype(np.float32), SR)
used = ['cellos_pizz', 'marimba', 'vibraphone', 'kalimba', 'harp', 'glockenspiel']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', out.shape, f'{A:g}-{B:g}s', 'peak', round(float(np.abs(out).max()), 3), '→', dst)
