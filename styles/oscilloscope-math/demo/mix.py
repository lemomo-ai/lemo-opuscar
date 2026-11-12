"""Sound for the Oscilloscope Math demo.   $LIB/.venv/bin/python styles/oscilloscope-math/demo/mix.py EVENTS.json OUT.wav

Layers
  voice     English narration (Kokoro am_michael, out/voice/*.wav), compressed, placed at timeline.json "vo"
  ambience  the instrument's electrical air, from the first light to the power-off
  foley     one sound per visible action (film.py events): ignition, the beam writing the square, a tick per corner and
            per title glyph, morph whooshes (title -> circle rises, title -> axis falls), RUN / STOP relays, the match-cut
            tick, a detent + harmonic bell per new circle, rising ticks for the rush, the dive, cursor blips, bursts,
            the infinity bell, the pull-back, the CRT switch-off
  signal    the square-wave partial sum at 110 Hz with exactly the circles on screen (RUN to STOP)
  score     96 bpm. Lead = Fourier pluck whose timbre is the partial sum with the circles on screen:
            square timbre in the cold open (the square), pure sine when the single circle appears, filling back to
            square as circles stack. STOP cuts it dead (the film's first silence); the corner is a drone and a clock;
            the ending resolves to A major. Music is ducked under the voice and gives way between 300 Hz and 4 kHz.
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, click, clack, thump, whoosh, compress

HERE = os.path.dirname(os.path.abspath(__file__))
EVF, OUT = sys.argv[1], sys.argv[2]
D = json.load(open(EVF)); TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = float(D['dur']); N = int(DUR * SR); EV = D['ev']; RUN, STOP = D['run'], D['stop']
TERMS = [(e['n'], e['t'], e['g']) for e in D['terms']]
BEAT = 60 / D['bpm']; E8 = BEAT / 2; BAR = 4 * BEAT
tt = np.arange(N) / SR
rng = np.random.default_rng(11)
fx = np.zeros((N, 2)); music = np.zeros((N, 2))
OFF = TL['poweroff']

def n_at(t): return sum(1 for n, b, g in TERMS if t >= b)
def gate(b, g, t):
    if g == 0: return (t >= b).astype(float)
    x = np.clip((t - b) / g, 0, 1); return x * x * (3 - 2 * x)
def midi_hz(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'A': 9, 'B': 11, 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7}
def m_(s): return 12 * (int(s[-1]) + 1) + NOTE[s[0]] + (1 if '#' in s else 0)

# ------------------------------------------------------------------ ambience
air = lp(rng.standard_normal(N), 900, 2) * 0.006
hum = sum(np.sin(2 * np.pi * f * tt + p) * a for f, a, p in [(150, .0016, 0), (250, .0010, 1), (350, .0006, 2)])
on = np.clip(tt / 0.4, 0, 1) * np.clip((OFF[0] + 0.3 - tt) / 0.3, 0, 1)
fx += np.stack([air + hum, np.roll(air, 1201) + hum], 1) * on[:, None]

# ------------------------------------------------------------------ foley
def chirp(d, f0, f1, v, decay=0.45):
    t = np.arange(int(d * SR)) / SR; f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * decay)) * np.minimum(1, t / 0.01) * v
def blip(f=2400, d=0.03, v=1.0):
    t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 3)) * v
def tick(v=1.0, f=5200):
    t = np.arange(int(0.012 * SR)) / SR
    return hp(rng.standard_normal(len(t)) * np.exp(-t / 0.0025), 2500) * 0.6 * v + np.sin(2 * np.pi * f * t) * np.exp(-t / 0.002) * 0.25 * v
def bell(f, d=2.4, v=1.0):
    t = np.arange(int(d * SR)) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9) + 0.18 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.18)
    return x * np.minimum(1, t / 0.004) * v
def sweep_noise(d, f0, f1, v):
    n = int(d * SR); z = rng.standard_normal(n); out = np.zeros(n); k = 12
    for i in range(k):
        a, b = i * n // k, (i + 1) * n // k; fc = f0 * (f1 / f0) ** (i / (k - 1))
        out[a:b] = bp(z, fc * 0.7, fc * 1.4, 2)[a:b]
    u = np.arange(n) / n; return out * np.sin(np.pi * u) ** 0.8 * v

for e in EV:
    ty, t = e['type'], e['t']
    if ty == 'ignite':
        add(fx, clack(pitch=0.8, v=1.0) * 0.30, t, 1.0, -0.1); add(fx, thump(v=1.0, f=60) * 0.16, t, 1.0, 0)
        add(fx, chirp(0.5, 160, 1200, 0.05), t + 0.03, 1.0, 0)
    elif ty == 'beam':                                   # the beam writing the square: a thin electric buzz
        n = int(e['d'] * SR); u = np.arange(n) / SR
        bz = np.sign(np.sin(2 * np.pi * 220 * u)) * 0.5 + np.sin(2 * np.pi * 440 * u) * 0.3
        bz = lp(bz, 2200, 2) * np.minimum(1, u / 0.2) * np.clip((e['d'] - u) / 0.4, 0, 1) * 0.010
        add(fx, bz, t, 1.0, 0.0)
    elif ty == 'edge': add(fx, tick(1.0, 3800) * 0.08, t, 1.0, 0.0)
    elif ty == 'glyph': add(fx, tick(0.6, 6200) * 0.05, t, 1.0, e.get('pan', 0) * 0.6)
    elif ty == 'morph':
        if e['kind'] == 'circle': add(fx, sweep_noise(e['d'], 500, 3800, 0.10), t, 1.0, 0.2); add(fx, bell(220, 2.5, 0.05), t + e['d'], 1.0, 0)
        else: add(fx, sweep_noise(e['d'], 3500, 400, 0.10), t, 1.0, -0.2); add(fx, thump(v=1.0, f=70) * 0.10, t + e['d'], 1.0, 0)
    elif ty == 'run': add(fx, clack(pitch=1.25, v=0.9) * 0.22, t, 1.0, -0.2)
    elif ty == 'cut': add(fx, tick(1.0, 4400) * 0.14, t, 1.0, 0.1)
    elif ty == 'birth':
        n_ = e['n']
        if n_ == 1: continue
        if n_ <= 7:
            add(fx, click(pitch=1.6, v=1.0) * 0.12, t, 1.0, -0.2); add(fx, bell(110 * n_, 2.4, 0.045), t + 0.01, 1.0, 0.25)
        else:
            k = (n_ - 9) / 40; add(fx, blip(900 * 2 ** (k * 2.2), 0.025, 0.6) * 0.04, t, 1.0, -0.3 + 0.6 * k)
    elif ty == 'stop':
        add(fx, clack(pitch=0.95, v=1.0) * 0.32, t, 1.0, 0.1)
    elif ty == 'dive':
        add(fx, sweep_noise(e['d'], 2600, 220, 0.12), t, 1.0, 0)
        add(fx, chirp(e['d'], 900, 110, 0.04, 0.9), t, 1.0, 0)
    elif ty == 'cursor':
        add(fx, blip(1760, 0.04, 1.0) * 0.05, t, 1.0, 0.4); add(fx, blip(2640, 0.04, 1.0) * 0.05, t + 0.12, 1.0, 0.4)
    elif ty == 'burst':
        m = 40
        for i in range(m):
            add(fx, blip(700 * 2 ** (2.5 * i / m), 0.02, 0.5) * 0.035, t + e['d'] * (i / m) ** 0.8, 1.0, -0.4 + 0.8 * i / m)
    elif ty == 'infinity':
        for j, f in enumerate([220, 330, 440, 550]): add(fx, bell(f, 3.5, 0.04), t + 0.03 * j, 1.0, -0.3 + 0.2 * j)
    elif ty == 'pull': add(fx, sweep_noise(e['d'], 250, 2800, 0.09), t, 1.0, 0)
    elif ty == 'poweroff':
        add(fx, chirp(0.7, 1800, 60, 0.07, 0.6), t, 1.0, 0); add(fx, thump(v=1.0, f=50) * 0.12, t + 0.05, 1.0, 0)
        add(fx, clack(pitch=0.7, v=0.8) * 0.18, t + 0.02, 1.0, 0)

# ------------------------------------------------------------------ the signal: the partial sum on screen, at 110 Hz
sig = np.zeros(N)
for n, b, g in TERMS:
    if 110 * n > 9000: continue
    sig += gate(b, g, tt) * np.sin(2 * np.pi * 110 * n * tt) / n
env = np.clip((tt - RUN) / 0.25, 0, 1) * (tt < STOP)
sig = lp(sig * env, 3000, 2) * 0.016
fx += np.stack([sig, sig], 1)

# ------------------------------------------------------------------ score
def fpluck(m, n_terms, d=0.8, v=1.0):
    f = midi_hz(m); t = np.arange(int(d * SR)) / SR; x = np.zeros_like(t)
    for k in range(1, n_terms + 1):
        h = 2 * k - 1
        if f * h > 12000: break
        x += np.sin(2 * np.pi * f * h * t) / h * np.exp(-t * (1 + 0.5 * h) / 0.30)
    return x * np.minimum(1, t / 0.003) * v
def sbass(m, d, v=1.0):
    f = midi_hz(m); t = np.arange(int((d + 0.4) * SR)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.22 * np.sin(6 * np.pi * f * t)
    return x * np.minimum(1, t / 0.02) * np.exp(-t / (d * 0.9)) * np.clip((d + 0.4 - t) / 0.4, 0, 1) * v

def timbre(t):
    if t < TL['title1']['morph'][1]: return 10                    # the cold open IS the square
    return max(1, min(12, n_at(t)))
lead = []
# cold open: a question figure per bar, square timbre
for b0, notes in [(0.6, ['A4', 'C5', 'E5']), (0.6 + BAR, ['A4', 'C5', 'F5']), (0.6 + 2 * BAR, ['A4', 'D5', 'E5', 'G#5'])]:
    for i, nn in enumerate(notes): lead.append((b0 + i * E8, nn, 0.7))
# one circle: the pulse starts with RUN, pure sine
prog = [('A', ['A4', 'E5', 'C5', 'E5']), ('F', ['A4', 'F5', 'C5', 'F5']), ('C', ['G4', 'E5', 'C5', 'E5']), ('G', ['G4', 'D5', 'B4', 'D5'])]
t = RUN; i = 0
while t < STOP - 0.05:
    ch = prog[int((t - RUN) // BAR) % 4][1]
    rush = TL['births']['rush'][0] <= t < STOP
    step = E8 / 2 if rush else E8
    lead.append((t, ch[i % 4] if not rush else ch[i % 4].replace('4', '5'), 0.9 if i % 2 == 0 else 0.7))
    t += step; i += 1
bass = []
for k in range(int((STOP - RUN) // BAR) + 1):
    t0 = RUN + k * BAR
    if t0 >= STOP: break
    root = {'A': 'A2', 'F': 'F2', 'C': 'C3', 'G': 'G2'}[prog[k % 4][0]]
    bass.append((t0, root, min(BAR, STOP - t0)))
# the ending: A major, slow arpeggio in square timbre, a glockenspiel answering each spike pulse
p0 = TL['pullback'][0]
for i, nn in enumerate(['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'E5', 'A5', 'C#6', 'A5']):
    tm = TL['infinity'] + 0.6 + i * BEAT
    if tm < OFF[0] - 0.2: lead.append((tm, nn, 0.7))
bass += [(TL['infinity'], 'A2', 3.0), (TL['infinity'] + 3.0, 'E2', 1.5), (TL['infinity'] + 4.6, 'A2', OFF[0] - TL['infinity'] - 4.6)]
for tm, nn, v in lead:
    nt = 10 if tm >= TL['infinity'] else timbre(tm)
    add(music, fpluck(m_(nn), nt, 0.9, v) * 0.07, tm, 1.0, 0.25 if int(tm / E8) % 2 else -0.25)
for tm, nn, d in bass: add(music, sbass(m_(nn), d) * 0.06, tm, 1.0, 0)
ev = []
for t0, chord, d in [(0.0, ['E5', 'A5', 'B5'], 9.4), (RUN, ['E5', 'A5', 'C6'], 2 * BAR), (RUN + 2 * BAR, ['G5', 'C6', 'E6'], 2 * BAR),
                     (RUN + 4 * BAR, ['E5', 'A5', 'C6'], 2 * BAR), (RUN + 6 * BAR, ['F5', 'A5', 'C6'], STOP - RUN - 6 * BAR),
                     (TL['infinity'], ['E5', 'A5', 'C#6'], OFF[0] - TL['infinity'])]:
    for j, nn in enumerate(chord): ev.append(dict(t=t0, inst='vibraphone_bowed', pitch=m_(nn), dur=d, vel=0.30, pan=-0.4 + 0.4 * j, attack=0.4))
# the corner: a low drone and a soft clock, one high bell when the spike is named
ev.append(dict(t=TL['vo']['v08'] + 0.3, inst='glockenspiel', pitch=m_('E7'), dur=2.5, vel=0.30, pan=0.3))
for k in range(9):
    tm = TL['infinity'] + 2.4 + k * 0.7
    if tm < OFF[0] - 0.2: ev.append(dict(t=tm, inst='glockenspiel', pitch=m_(['A6', 'E6', 'C#7', 'A6', 'E7', 'C#7', 'A6', 'E6', 'A7'][k]), dur=1.5, vel=0.18, pan=-0.5 + k * 0.12))
S.seed(13)
music += S.render(ev, dur=DUR, master=False)[:N] * 0.30
dr0, dr1 = STOP + 0.6, TL['mathmode'] + 0.6
u = np.clip((tt - dr0) / 1.0, 0, 1) * np.clip((dr1 - tt) / 1.0, 0, 1)
drone = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 110 * tt) + 0.25 * np.sin(2 * np.pi * 165 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * tt))
music += np.stack([drone, drone], 1) * (u * 0.022)[:, None]
for k in range(int((dr1 - dr0) / BEAT)):
    add(music, tick(0.5, 3000) * 0.05, dr0 + 0.4 + k * BEAT, 1.0, 0.4 if k % 2 else -0.4)
# STOP cuts the music dead (reverb tail only); power-off cuts everything
music *= np.where((tt >= STOP) & (tt < dr0), 0.0, 1.0)[:, None]
music = music * 0.9 + S.room(music, size=0.4, mix=1.0) * 0.14

# ------------------------------------------------------------------ voice: compress, place, duck the music
VO = TL['vo']; voice = np.zeros(N)
for k, t0 in VO.items():
    x, sr = sf.read(os.path.join(os.environ.get('XPM_VOICE') or os.path.join(HERE, 'out', 'voice'), k + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); x = hp(x, 80, 2)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.08
    x = compress(x, thr=0.10, ratio=3.0, att=0.003, rel=0.08)
    i = int(t0 * SR); voice[i:i + len(x)] += x[:N - i]
venv = np.convolve((np.abs(voice) > 1e-4).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
venv = np.clip(venv * 3, 0, 1)
band = np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
music = music - band * (0.5 * venv)[:, None]                          # give the voice its band
music *= (1 - 0.35 * venv)[:, None]
fxd = fx * (1 - 0.25 * venv)[:, None]
# balance: voice about 10 dB over music (RMS while speaking)
spk = venv > 0.5
vr = np.sqrt(np.mean(voice[spk] ** 2)); mr = np.sqrt(np.mean((music[spk] ** 2).mean(1)))
music *= (vr / 10 ** (10 / 20)) / (mr + 1e-9) if mr > vr / 10 ** (10 / 20) else 1.0
mix = fxd + music + np.stack([voice, voice], 1)
kill = np.clip((OFF[0] + 0.75 - tt) / 0.15, 0, 1); mix[:, :] *= np.maximum(kill, (tt < OFF[0]))[:, None]
pk = np.abs(mix).max(); mix *= 0.9 / pk
fo = int(0.3 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(OUT, mix.astype(np.float32), SR, subtype='FLOAT')
print(f'mix.py -> {OUT}  voice/music RMS while speaking: {20*np.log10(vr/(np.sqrt(np.mean((music[spk]**2).mean(1)))+1e-9)):.1f} dB')
