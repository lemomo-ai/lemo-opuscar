"""Sound for the Tablet Sketch Explainer demo film (0-51 s): English narration + pencil on paper + a café bossa score.

- Foley is driven by the page (events.json: one event per mark, gestures, the colour morph, the crack, the grounds, the pour).
- The score is on the film's 96 bpm grid (bar = 2.5 s), D major: nylon guitar, jazz double bass, egg shaker, soft vibraphone.
  Two near-silences: before the colour morph (5.75-6.25 s) and before the first crack (33.1-33.76 s).
- Narration: voice/<id>.wav placed at voice/cues.json "start"; compressed, then set ~10 dB (RMS) above the music,
  which ducks and gives way in 300 Hz-4 kHz while someone speaks.
Run from the library root:  .venv/bin/python styles/ipad-sketch/demo/mix.py <from> <to>   (build.sh does)
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
FROM = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
TO = float(sys.argv[2]) if len(sys.argv) > 2 else 51.0
FULL = 51.0
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR))
tt = np.arange(N) / SR
rng = np.random.default_rng(7)
VO = json.load(open(os.path.join(HERE, 'voice', 'cues.json')))


# ---------------- pencil foley ----------------
def activity(kinds):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] not in kinds: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e['d'], 0.035)) * SR))
        if i1 <= i0: continue
        n = i1 - i0; env = np.ones(n)
        r = min(n // 3, int(0.01 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    level = 1 - np.exp(-a * 1.1)
    k = int(0.015 * SR); ker = np.ones(k) / k
    return np.convolve(level, ker, 'same'), np.convolve(pan, ker, 'same')


def tooth_noise(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * np.clip(g, 0, 2.5))


def hand(rate, seed, sharp=1.0):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 2.5 * lp(r.standard_normal(N), 3, 1)) / SR) * 2 * np.pi
    return (0.5 + 0.5 * np.abs(np.sin(ph))) ** sharp


def pan_st(x, pan):
    th = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


fol = np.zeros((N, 2))
lv, pn = activity(['pencil']); fol += pan_st(tooth_noise(700, 4200, 380, 0.9, 1) * hand(5, 2) * lv, pn * 0.55) * 0.28
lv, pn = activity(['light']); fol += pan_st(tooth_noise(1400, 5200, 500, 0.9, 3) * hand(7, 4) * lv, pn * 0.55) * 0.11
lv, pn = activity(['write']); fol += pan_st(tooth_noise(900, 4800, 450, 0.92, 5) * hand(10, 6, 1.6) * lv, pn * 0.55) * 0.27
lv, pn = activity(['color']); fol += pan_st(tooth_noise(320, 2600, 220, 0.75, 7) * hand(13, 8, 2.0) * lv, pn * 0.55) * 0.23
for e in EV:
    t, d, p = e['t'], e['d'], e.get('pan', 0)
    if e['type'] == 'tap':
        add(fol, hp(click(pitch=0.7 + rng.random() * 0.25, v=1.0), 1800) * 0.035, t, 1.0, p * 0.5)
    elif e['type'] in ('gesture', 'punch'):
        n = int(d * SR); x = lp(hp(rng.standard_normal(n), 150), 1300, 2)
        u = np.linspace(0, 1, n); env = np.sin(np.pi * u) ** 1.5
        g = np.stack([x * env, np.roll(x, 211) * env], 1) * (0.05 if e['type'] == 'gesture' else 0.07)
        i0 = int(t * SR); i1 = min(N, i0 + n); fol[i0:i1] += g[:i1 - i0]
    elif e['type'] == 'morph':   # an inhale into the cup, then the colour turning over
        n = int(d * SR); u = np.linspace(0, 1, n)
        nz = rng.standard_normal(n); x = (lp(nz, 400, 2) * (1 - u) + lp(nz, 2800, 2) * u) * u ** 2.5 * np.where(u < 0.33, 1, np.exp(-(u - 0.33) * 6))
        add(fol, x / (np.abs(x).max() + 1e-9) * 0.16, t, 1.0, 0)
        add(fol, thump(0.8, 62) * 0.22, t + 0.35, 1.0, 0)
        add(fol, hp(click(pitch=0.5, v=1.0), 600) * 0.08, t + 1.03, 1.0, -0.2)   # the colour lands as the cherry
    elif e['type'] == 'cut':
        add(fol, lp(whoosh(0.22, 1.0), 4000) * 0.07, t - 0.11, 1.0, 0)
    elif e['type'] == 'crack':   # first crack: a few dry pops, the first the loudest
        for k, (dt, v) in enumerate([(0, 1.0), (0.07, 0.6), (0.16, 0.75), (0.26, 0.45), (0.41, 0.55), (0.6, 0.35)]):
            c = hp(click(pitch=1.3 + rng.random() * 0.6, v=1.0), 900) * 0.6
            nb = lp(rng.standard_normal(int(0.012 * SR)), 5000) * np.exp(-np.arange(int(0.012 * SR)) / (0.003 * SR)); c[:len(nb)] += nb * 0.4
            add(fol, c * 0.34 * v, t + dt, 1.0, rng.uniform(-0.4, 0.4))
    elif e['type'] == 'grains':  # grounds pattering through the air into the cup
        for k in range(160):
            tk = t + rng.uniform(0, d) ** 1.2 * (d / d ** 1.2)
            g = hp(rng.standard_normal(int(0.004 * SR)), 2500) * np.exp(-np.arange(int(0.004 * SR)) / (0.0012 * SR))
            add(fol, g * 0.05 * rng.uniform(0.3, 1), tk, 1.0, np.clip(-0.2 + (tk - t) / d * 0.9 + rng.normal(0, 0.15), -1, 1))
    elif e['type'] == 'pour':
        n = int(d * SR); u = np.linspace(0, 1, n)
        x = bp(rng.standard_normal(n), 500, 3500, 2) * (0.6 + 0.4 * np.abs(np.sin(np.cumsum(9 + 4 * rng.standard_normal(n) * 0.01) / SR * 2 * np.pi)))
        env = np.minimum(1, u / 0.1) * np.minimum(1, (1 - u) / 0.3)
        add(fol, x / (np.abs(x).max() + 1e-9) * env * 0.09, t, 1.0, p * 0.6)
room = lp(rng.standard_normal(N), 420, 2) * 0.003
fol += np.stack([room, np.roll(room, 1013)], 1)

# ---------------- score ----------------
BEAT = 60 / 96; BAR = 4 * BEAT
CH = {
    'Dmaj7': ([50, 57, 61, 66], 38, 45), 'Bm7': ([47, 54, 57, 62], 35, 42), 'Gmaj7': ([55, 59, 62, 66], 31, 38),
    'A7sus': ([57, 62, 64, 67], 33, 40), 'A7': ([57, 61, 64, 67], 33, 40), 'Dmaj9': ([54, 57, 61, 64], 38, 45),
    'Em7': ([52, 55, 59, 62], 40, 47), 'F#m7': ([54, 57, 61, 64], 42, 49), 'Bbmaj7': ([53, 58, 62, 65], 34, 41)}
CHART = ['Dmaj7', 'Bm7', 'Gmaj7', 'Dmaj7', 'Bm7', 'Em7', 'A7sus', 'Dmaj7', 'F#m7', 'Gmaj7',
         'A7', 'Bbmaj7', 'A7', 'Dmaj7', 'Bm7', 'Gmaj7', 'Em7', 'A7sus', 'Dmaj9', 'Dmaj9']
QUIET = [(5.72, 6.25), (33.05, 33.76)]           # near-silences: only the room and the pencil
quiet = lambda t: any(a <= t < b for a, b in QUIET)
ev = []
gpat = [[1, 3, 4, 6], [1, 3, 5, 6]]
for b, name in enumerate(CHART):
    t0 = b * BAR
    if t0 >= FULL: break
    vo, root, fifth = CH[name]
    sparse = b in (0, 1)                          # the hook: guitar only
    if b == 17:                                  # 42.5 s: A7sus, then the arrival on Dmaj9 at 43.75 with the pull-back
        halves = [('A7sus', 0, 2), ('Dmaj9', 2, 4)]
    else:
        halves = [(name, 0, 4)]
    for nm, b0, b1 in halves:
        vo, root, fifth = CH[nm]
        if not sparse:
            for beat, p in ((b0, root), (b0 + 2 if b1 - b0 > 2 else None, fifth)):
                if beat is None: continue
                t = t0 + beat * BEAT
                if quiet(t) or t >= 47.5: continue
                ev.append((t, 'jazz_bass', p, BEAT * 1.6, 0.62, -0.05, 0.95))
        for k in gpat[b % 2]:
            beat = k / 2
            if not (b0 <= beat < b1): continue
            t = t0 + beat * BEAT
            if t < 0.6 or quiet(t) or t >= 47.5 or (sparse and k not in (1, 4)): continue
            if b == 17 and abs(beat - 2) < 0.01: continue
            for j, p in enumerate(vo):
                ev.append((t + j * 0.011, 'guitar_nylon', p, 0.32, 0.34 + 0.06 * (k % 2), -0.18 + j * 0.06, 0.62))
for j, p in enumerate(CH['Dmaj7'][0]):          # the first strum, beat 2
    ev.append((BEAT + j * 0.018, 'guitar_nylon', p, 1.0, 0.42, -0.18 + j * 0.06, 0.62))
# landings: the cherry (6.25), the crack (33.76), the arrival (43.75)
for T, chord, bass in [(6.25, 'Gmaj7', 31), (33.76, 'Dmaj7', 38), (43.75, 'Dmaj9', 38), (47.5, 'Dmaj9', 38)]:   # 47.5: the credit card is done, the last chord rings out
    for j, p in enumerate([CH[chord][0][0] - 12 + 12] + CH[chord][0] + [CH[chord][0][1] + 12]):
        ev.append((T + j * 0.03, 'guitar_nylon', p, 1.8, 0.5, -0.25 + j * 0.08, 0.7))
    ev.append((T, 'jazz_bass', bass, 1.6, 0.7, 0, 1.0))
for i in range(int(FULL / (BEAT / 2))):
    t = i * BEAT / 2
    if t < 2 * BAR or quiet(t) or (43.6 < t < 44.5) or t > 47.5: continue
    ev.append((t, 'world_perc', 'egg_shaker_soft', 0.2, 0.2 + 0.1 * (i % 2), 0.3, 0.45))
# vibraphone: one soft note on each new idea, and the roast colours on the words
for t, p, v in [(6.25, 79, 0.42), (10.52, 71, 0.3), (11.26, 74, 0.32), (13.2, 76, 0.3), (19.46, 78, 0.3), (21.5, 74, 0.28),
                (25.0, 81, 0.36), (27.64, 74, 0.32), (28.56, 76, 0.32), (29.28, 78, 0.34), (37.0, 81, 0.3), (37.4, 78, 0.28),
                (37.8, 74, 0.26), (43.75, 78, 0.42), (43.77, 81, 0.34), (46.3, 85, 0.3), (47.5, 81, 0.36), (47.52, 85, 0.3)]:
    ev.append((t, 'vibraphone', p, 1.4, v, 0.25, 0.55))
S.seed(11)
music = S.render(ev, dur=FULL + 2.5, master=False)
music = S.room(music, size=0.3, mix=0.16)
i0 = int(round(FROM * SR)); music = music[i0:i0 + N]
if len(music) < N: music = np.vstack([music, np.zeros((N - len(music), 2))])
music *= np.clip((FULL - (tt + FROM)) / 1.6, 0, 1)[:, None] ** 1.3      # the last chord (47.5 s) rings, then lets go

# ---------------- narration ----------------
voice = np.zeros((N, 2)); speak = np.zeros(N)
for vid, st in VO['start'].items():
    x, sr = sf.read(os.path.join(HERE, 'voice', vid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = hp(x, 80)
    x = compress(x / (np.abs(x).max() + 1e-9) * 0.6, thr=0.18, ratio=3.0)
    s = int(round((st - FROM) * SR))
    if s >= N or s + len(x) <= 0: continue
    a, b = max(0, s), min(N, s + len(x))
    voice[a:b] += np.stack([x[a - s:b - s]] * 2, 1)
    speak[max(0, s - int(0.15 * SR)):min(N, s + len(x) + int(0.25 * SR))] = 1
k = int(0.12 * SR); speak = np.convolve(speak, np.ones(k) / k, 'same')
# music gives way while someone speaks: a dip in 300 Hz-4 kHz and a general duck
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in (0, 1)], 1)
music = music - mid * (0.55 * speak)[:, None]
music *= (1 - 0.45 * speak)[:, None]
rms = lambda x, m: np.sqrt(np.mean(x[m] ** 2) + 1e-12)
on = speak > 0.5
vg = 10 ** (10 / 20) * rms(music.mean(1), on) / rms(voice.mean(1), voice.mean(1) != 0)
voice *= vg
fol_duck = (1 - 0.35 * speak)[:, None]
mix = voice + music + fol * fol_duck * 0.9

mix = np.stack([compress(mix[:, 0], thr=0.35, ratio=2.2), compress(mix[:, 1], thr=0.35, ratio=2.2)], 1)
if TO < FULL:
    f = np.clip((DUR - tt) / 0.35, 0, 1) ** 1.5; mix *= f[:, None]
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), '| voice vs music (speaking) dB', round(db(voice.mean(1)[on]) - db(music.mean(1)[on]), 1))
cr = S.credits(['guitar_nylon', 'jazz_bass', 'world_perc', 'vibraphone'])
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
