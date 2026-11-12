"""Sound for the whole of 《The Inverted Jenny》: English narration + cutting-table foley + a small 1918-flavoured ensemble score.
Reads events.json (every action the page exports) and timeline.json (narration starts), writes out/mix.wav (48 kHz stereo).
- Narration: Kokoro bm_george, compressed, then set about 10 dB above the music by RMS; while it speaks, the music's 300 Hz–4 kHz dips another 6 dB.
- Score: 120 bpm, one bar = 2 s. An "oom-pah" march in F major (tuba, bassoon, pizzicato); the printing section turns to mechanical woodblock and clarinet arpeggios,
  the inverted-print section moves to D minor with only timpani, the glockenspiel climbs step by step as the tower grows with one horn call, and the ending is a glockenspiel music box and harp.
- Excerpts: the environment variable FROM (film seconds) starts score and narration at the same second; the last 0.6 s fade out in the sound only.
Usage (library root): .venv/bin/python styles/vintage-collage/demo/mix.py
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump, pop, rumble

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
OFF = float(os.environ.get('FROM', '0'))                  # events.json is exported for the whole film (from 0 s); an excerpt filters by FROM / TO
TO = float(os.environ.get('TO', D['dur']))
DUR = TO - OFF; EV = [dict(e, t=e['t'] - OFF) for e in D['ev'] if OFF - 1e-6 <= e['t'] < TO]; N = int(round(DUR * SR))
OUT_WAV = os.environ.get('OUT_WAV', os.path.join(HERE, 'out', 'mix.wav'))
rng = np.random.default_rng(11)
tt = np.arange(N) / SR


def env_ar(n, a, r):
    e = np.ones(n); a = max(1, min(n // 2, a)); r = max(1, min(n - a, r))
    e[:a] = np.linspace(0, 1, a) ** 1.5; e[-r:] = np.linspace(1, 0, r) ** 2
    return e


def paper_slide(d, size=1.0):
    n = max(64, int(d * SR)); x = bp(rng.standard_normal(n), 700 if size >= 1 else 1100, 5200, 2)
    grain = lp(np.abs(rng.standard_normal(n)), 120, 1); grain = 0.55 + 0.45 * grain / (grain.max() + 1e-9)
    return x * grain * env_ar(n, int(0.04 * SR), int(0.5 * n)) * np.linspace(1.0, 0.6, n)


def paper_pat(w=1.0):
    n = int(0.09 * SR); x = lp(hp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.012 * SR)), 180), 3800)
    th = np.zeros(n); b = thump(v=0.5, f=85)[:n]; th[:len(b)] = b
    return x * 0.9 + th * 0.5 * w


def slap():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.006 * SR)), 900) + lp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.02 * SR)), 600) * 0.6


def flutter(d, rate, lo, hi):
    n = max(64, int(d * SR)); x = bp(rng.standard_normal(n), lo, hi, 2)
    ph = np.cumsum(np.full(n, rate) / SR) * 2 * np.pi
    return x * np.clip(np.sin(ph), 0, 1) ** 3 * env_ar(n, int(0.03 * SR), int(0.4 * n))


def clink(f0=2100, v=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, (m, dec, a) in enumerate(((1.0, 0.09, 1.0), (1.63, 0.06, 0.6), (2.41, 0.045, 0.45), (3.37, 0.03, 0.3))):
        x += a * np.sin(2 * np.pi * f0 * m * t + k) * np.exp(-t / dec)
    return x * v * 0.5


def key():
    """Typewriter key: a metallic tick + the dull thud of the typebar on paper"""
    n = int(0.05 * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1800, 7000, 2) * np.exp(-t / 0.004) + 0.5 * lp(rng.standard_normal(n), 900) * np.exp(-t / 0.012)
    return x


def snip():
    """Scissors: two blades sliding past each other + the paper parting"""
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2500, 9000, 2) * np.exp(-((t - 0.03) / 0.02) ** 2) + 0.6 * clink(3400, 0.6)[:n] * np.exp(-t / 0.02)
    return x


def roller(d):
    """Roller over paper: a low continuous roll + a little sticky ink sound"""
    n = int(d * SR); x = lp(rng.standard_normal(n), 220, 2) * 3 + 0.3 * bp(rng.standard_normal(n), 1200, 3000) * (0.5 + 0.5 * np.sin(np.arange(n) / SR * 2 * np.pi * 17))
    return x * env_ar(n, int(0.06 * SR), int(0.15 * SR))


fx = np.zeros((N, 2))
for e in EV:
    t, ty, pn = e['t'], e['type'], e.get('pan', 0) * 0.7
    if ty == 'slide': add(fx, paper_slide(e['d'], e.get('size', 1)), t, 0.15 * (1 if e.get('size', 1) >= 1 else 0.7), pn)
    elif ty == 'land': add(fx, paper_pat(e.get('w', 1)), t, 0.28 * e.get('w', 1), pn)
    elif ty == 'slap': add(fx, slap(), t, 0.20, pn)
    elif ty == 'fly_plane':
        add(fx, flutter(e['d'], 11, 250, 1800), t, 0.07, pn); add(fx, lp(whoosh(min(e['d'], 1.2), 0.8), 2500), t + (0 if e.get('out') else e['d'] - 1.0), 0.10, pn)
    elif ty == 'spin': add(fx, paper_slide(e['d'], 1), t, 0.18, pn)
    elif ty == 'thunk': add(fx, thump(v=1.0, f=70), t, 0.30, pn); add(fx, paper_pat(1.0), t, 0.25, pn)
    elif ty == 'roll': add(fx, roller(e['d']), t, 0.10, pn)
    elif ty == 'key': add(fx, key(), t, 0.16, pn)
    elif ty == 'bell': add(fx, clink(4200, 1.0), t, 0.18, pn)
    elif ty == 'strike': add(fx, bp(rng.standard_normal(int(e['d'] * SR)), 1500, 6000) * np.linspace(1, 0.3, int(e['d'] * SR)), t, 0.10, pn)
    elif ty == 'snip': add(fx, snip(), t, 0.22, pn)
    elif ty == 'burst':
        for j in range(14): add(fx, flutter(0.5 + 0.4 * rng.random(), 9 + 4 * rng.random(), 1200, 6500), t + j * 0.05, 0.05, (rng.random() - .5) * 1.4)
        add(fx, lp(whoosh(0.8, 1.0), 4000), t, 0.15, 0)
    elif ty == 'fly_stamp': add(fx, flutter(e['d'], 10, 1200, 6500), t, 0.08, pn)
    elif ty == 'grow': add(fx, bp(rng.standard_normal(int(e['d'] * SR)), 300, 2400) * np.linspace(0.2, 1, int(e['d'] * SR)) ** 2, t, 0.05, pn)
    elif ty == 'drops':
        for j in range(e['n']): add(fx, paper_pat(0.3), t + j * 0.25 / e['n'] + 0.01 * rng.random(), 0.06, (rng.random() - .5))
# Transitions: through the oval, whip pan, through the empty space
for t0, d, g in ((10.2 - OFF, 0.75, 0.16), (21.45 - OFF, 0.4, 0.2), (46.3 - OFF, 1.1, 0.14)):
    if 0 <= t0 < DUR: add(fx, lp(whoosh(d, 1.0), 5000), t0, g, 0)
room = lp(rng.standard_normal(N), 400, 2) * 0.004
fx += np.stack([room, np.roll(room, 997)], 1)

# ---------------- Score (film seconds) ----------------
ev = []
def E(t, inst, p, d, v, pan=0.0, g=0.7): ev.append((t, inst, p, d, v, pan, g))
F, C7, Bb, Dm, A7, Gm = (41, [60, 65, 69]), (36, [58, 64, 67]), (34, [58, 62, 65]), (38, [57, 62, 65]), (33, [57, 61, 64]), (31, [58, 62, 67])
def oompah(t0, bars, chords, tuba=True, vel=0.5):
    for b in range(bars):
        root, tri = chords[b % len(chords)]
        for beat in range(4):
            t = t0 + b * 2 + beat * 0.5
            if beat % 2 == 0: E(t, 'tuba_stac' if tuba else 'bassoon_stac', root + (0 if beat == 0 else 7), 0.3, vel, -0.1, 0.75)
            else:
                for i, p in enumerate(tri): E(t + i * 0.01, 'violins_pizz', p, 0.25, vel * 0.8, 0.25 - 0.1 * i, 0.55)
# A：0–10
oompah(0.0, 4, [F, F, C7, F])
for t, p in ((2.0, 72), (2.25, 74), (2.5, 77), (2.75, 81), (3.0, 79)): E(t, 'xylophone', p, 0.2, 0.35, 0.3, 0.45)     # AIR MAIL letters
for i, p in enumerate([65, 69, 72, 77, 81, 84]): E(5.85 + i * 0.03, 'harp', p, 1.2, 0.5, -0.3 + 0.1 * i, 0.6)       # the stamp assembles
E(5.85, 'glockenspiel', 89, 1.2, 0.45, 0.3, 0.45)
E(8.0, 'tuba_stac', 41, 0.4, 0.55, 0, 0.8); [E(8.0 + i * 0.012, 'violins_pizz', p, 0.4, 0.5, 0.2, 0.6) for i, p in enumerate([60, 65, 69, 72])]
E(9.0, 'clarinet_stac', 72, 0.25, 0.45, 0.1, 0.55); E(9.5, 'clarinet_stac', 77, 0.4, 0.5, 0.1, 0.6)
# B: 10–14.7 printing press: woodblock on every beat, clarinet arpeggios like a machine
for b in range(9):
    t = 10.5 + b * 0.5; E(t, 'woodblock', None, None, 0.35 if b % 2 == 0 else 0.25, -0.2, 0.5)
oompah(10.5, 2, [F, C7], vel=0.42)
for t, p in ((13.0, 72), (13.25, 77), (13.5, 81), (13.75, 84)): E(t, 'clarinet_stac', p, 0.2, 0.35, 0.15, 0.4)
# 14.7–15.6: near silence (only paper sounds)
# C: 15.6–21.4 inverted print: D minor, timpani, pizzicato walking down
E(15.6, 'bassoon', 38, 1.8, 0.35, -0.1, 0.5)
for i, p in enumerate([62, 61, 60, 59]): E(16.7 + i * 0.12, 'violins_pizz', p, 0.2, 0.45, 0.2, 0.55)
E(17.25, 'timpani', 38, 1.0, 0.5, 0, 0.6); E(18.55, 'timpani', 38, 1.0, 0.55, 0, 0.6)
for i, p in enumerate([57, 56, 55, 54]): E(18.0 + i * 0.12, 'violins_pizz', p, 0.2, 0.42, 0.2, 0.55)
E(19.4, 'glockenspiel', 86, 2.0, 0.45, 0.3, 0.5); E(19.4, 'harp', 62, 2.0, 0.4, -0.3, 0.5); E(19.42, 'harp', 69, 2.0, 0.38, -0.2, 0.5)
E(19.4, 'contrabass_pizz', 38, 1.5, 0.5, 0, 0.6)
# D: 21.4–31 Robey: a light walking bass
walk = [41, 43, 45, 46, 48, 46, 45, 43]
for i in range(16):
    t = 21.9 + i * 0.5; E(t, 'bassoon_stac', walk[i % 8] + 12, 0.3, 0.45, -0.15, 0.6)
    if i % 2: [E(t + j * 0.01, 'violins_pizz', p, 0.2, 0.32, 0.25, 0.45) for j, p in enumerate([65, 69, 72])]
for i, p in enumerate([72, 74, 76, 77, 79, 81, 84]): E(28.95 + i * 0.125, 'xylophone', p, 0.2, 0.4 + 0.03 * i, 0.3, 0.5)     # $15,000
E(29.85, 'glockenspiel', 96, 1.0, 0.5, 0.3, 0.5); E(29.85, 'triangle', None, None, 0.5, 0.4, 0.45)
oompah(30.0, 1, [F], vel=0.45)
# E: 31–35 cut apart, scattering
for i in range(12): E(31.0 + i * 0.25, 'violins_spic', [65, 65, 64, 64, 62, 62, 60, 60, 62, 64, 65, 67][i], 0.2, 0.35, 0.2, 0.45)
for i, p in enumerate([53, 57, 60, 65, 69, 72, 77, 81, 84, 89]): E(33.0 + i * 0.025, 'harp', p, 1.0, 0.5, -0.3 + 0.07 * i, 0.6)
E(33.0, 'sus_cymbal', None, None, 0.3, 0.2, 0.35)
# F: 35–40.5 tower: glockenspiel climbing step by step, timpani roll, horn at the top
for i, p in enumerate([77, 79, 81, 82, 84, 86, 88, 89]): E(35.45 + i * 0.21, 'glockenspiel', p, 0.5, 0.3 + 0.03 * i, 0.3, 0.42)
for i in range(14): E(35.45 + i * 0.12, 'timpani', 41, 0.3, 0.15 + 0.025 * i, 0, 0.45)
E(37.45, 'horn', 65, 2.2, 0.5, -0.1, 0.55); E(37.45, 'horn', 69, 2.2, 0.45, 0.1, 0.5); E(37.45, 'trombone', 53, 2.2, 0.4, 0, 0.45)
E(37.45, 'tuba_stac', 41, 0.5, 0.6, 0, 0.7); E(37.45, 'timpani', 41, 1.2, 0.6, 0, 0.6)
E(38.25, 'harp', 77, 2.0, 0.35, 0.2, 0.4)
# G: 40.5–43.3 album page: pizzicato eighth notes following the stamps dropping into place one by one
for i in range(8): [E(40.6 + i * 0.25 + j * 0.01, 'violins_pizz', p, 0.15, 0.32, 0.2, 0.45) for j, p in enumerate([[65, 69], [64, 67], [65, 69], [67, 70]][i % 4])]
for i in range(4): E(40.6 + i * 0.5, 'bassoon_stac', [53, 48, 53, 46][i], 0.3, 0.4, -0.15, 0.55)
# H: 43.3–50 ending: music box, harp, an F major chord at the title
mb = [(43.4, 77), (44.4, 76), (45.4, 72), (46.4, 74), (46.9, 77)]
for t, p in mb: E(t, 'glockenspiel', p, 1.5, 0.3, 0.3, 0.42)
for i, p in enumerate([41, 53, 60, 65, 69, 72, 77]): E(47.15 + i * 0.05, 'harp', p, 2.5, 0.5, -0.3 + 0.1 * i, 0.6)
E(47.15, 'glockenspiel', 89, 2.5, 0.42, 0.3, 0.45); E(47.15, 'contrabass_pizz', 41, 2.0, 0.55, 0, 0.6); E(47.15, 'horn', 65, 2.2, 0.3, 0, 0.4)
E(48.9, 'glockenspiel', 84, 1.2, 0.25, 0.4, 0.35)
# End-card credits (from 49.55): one more low harp pluck, glockenspiel lands on the tonic, the ring-out lasts to 52 s
E(49.55, 'harp', 53, 2.5, 0.35, -0.2, 0.45); E(49.6, 'harp', 60, 2.4, 0.32, 0, 0.42); E(49.65, 'harp', 65, 2.35, 0.3, 0.2, 0.4)
E(49.85, 'glockenspiel', 77, 2.2, 0.28, 0.3, 0.35); E(49.55, 'contrabass_pizz', 41, 2.4, 0.4, 0, 0.5)
ev = [(e[0] - OFF,) + tuple(e[1:]) for e in ev if e is not None and e[0] >= OFF - 1e-6]
S.seed(9)
music = S.render(ev, dur=DUR + 3, master=False)[:N]
music = S.room(music, size=0.32, mix=0.16)

# ---------------- Narration ----------------
vo = np.zeros(N); active = np.zeros(N)
for lid, (t0, d) in TL['vo'].items():
    t0 -= OFF
    if t0 + d < 0 or t0 >= DUR: continue
    x, sr = sf.read(os.path.join(HERE, 'vo', lid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = compress(x / (np.abs(x).max() + 1e-9) * 0.8, thr=0.18, ratio=3.0)
    i0 = int(t0 * SR); i1 = min(N, i0 + len(x)); s0 = max(0, -i0)
    vo[max(0, i0):i1] += x[s0:i1 - i0]
    active[max(0, i0 - int(0.15 * SR)):min(N, i1 + int(0.2 * SR))] = 1
k = int(0.12 * SR); act = np.convolve(active, np.ones(k) / k, 'same')
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1.0
# Music: while the narration speaks, the whole score dips 4 dB, the mids (300 Hz–4 kHz) another 6 dB
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
duck = 1 - 0.37 * act
music = (music - mid * (0.5 * act)[:, None]) * duck[:, None]
vo_rms = rms(vo); mu_rms = rms(music.mean(1)[active > 0]) if active.any() else rms(music.mean(1))
vo_gain = (mu_rms * 10 ** (10 / 20)) / (vo_rms + 1e-9)
mix = fx + music * 0.9 + np.stack([vo, vo], 1) * vo_gain
fade = np.clip((DUR - tt) / 0.6, 0, 1) ** 1.5
mix *= fade[:, None]
mix = np.stack([compress(mix[:, c], thr=0.35, ratio=2.2) for c in range(2)], 1)
# Hold the peaks before mastering: at −14 LUFS the true peak must stay under −1.2 dB, so peaks may not rise more than about 11 dB above RMS
m = mix.mean(1); r = np.sqrt(np.mean(m[np.abs(m) > 1e-3] ** 2))
mix *= 0.1 / r
mix = np.stack([limit(mix[:, c], ceil=0.1 * 10 ** (11 / 20)) for c in range(2)], 1)
mix *= 0.85 / max(1e-9, np.abs(mix).max())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(OUT_WAV, mix.astype(np.float32), SR)
used = ['tuba_stac', 'bassoon_stac', 'bassoon', 'violins_pizz', 'violins_spic', 'contrabass_pizz', 'clarinet_stac', 'timpani', 'harp', 'sus_cymbal',
        'xylophone', 'glockenspiel', 'woodblock', 'triangle', 'horn', 'trombone']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'vo gain', round(float(vo_gain), 2))
