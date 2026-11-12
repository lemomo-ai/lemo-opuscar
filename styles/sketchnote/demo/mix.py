"""Sound for the full film (50 s): English narration + pen foley + a light score that makes room for the voice.

Inputs (all in this folder): timeline.json (narration starts and subtitle cues), voice/out/*.wav (Kokoro),
events.json (one event per stroke + the story cues, exported from index.html).
Output: out/mix.wav (48 kHz stereo). Run from the library root:  .venv/bin/python styles/sketchnote/demo/mix.py
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(TL['dur']); N = int(DUR * SR); EV = EVJ['ev']
CUE = {e['name']: e['t'] for e in EV if e['type'] == 'cue'}
rng = np.random.default_rng(31)
tt = np.arange(N) / SR
rms = lambda x: float(np.sqrt(np.mean(np.square(x)) + 1e-12))
db = lambda x: 20 * np.log10(x + 1e-12)


def smooth(x, sec):
    k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, 'same')


# ---------------- voice ----------------
vo = np.zeros(N); vmask = np.zeros(N)
for L in TL['lines']:
    for p in L['parts']:
        x, sr = sf.read(os.path.join(HERE, 'voice', 'out', p['id'] + '.wav'), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        i = int(p['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]; vmask[i:i + n] = 1
vo = hp(vo, 90)
vo = compress(vo / (np.abs(vo).max() + 1e-9) * 0.9, thr=0.22, ratio=3.0, att=0.003, rel=0.12)
duck = smooth(np.maximum(vmask, np.roll(vmask, int(0.12 * SR))), 0.15)   # 1 while speaking, eased edges


# ---------------- pen foley (driven by the strokes on screen) ----------------
def activity(kind):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] != kind: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e['d'], 0.03)) * SR))
        if i1 <= i0: continue
        n = i1 - i0; env = np.ones(n); r = min(n // 3, int(0.012 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    return smooth(1 - np.exp(-a * 0.9), 0.02), smooth(pan, 0.02)


def scratch_noise(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed); x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * g)


def wobble(rate, seed):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 0.35 * lp(r.standard_normal(N), 3, 1) * 8) / SR) * 2 * np.pi
    return 0.55 + 0.45 * np.abs(np.sin(ph))


def pan_st(x, pan):
    th = (pan + 1) * np.pi / 4; return np.stack([x * np.cos(th), x * np.sin(th)], 1)


foley = np.zeros((N, 2))
for kind, (lo, hi, gh, dep, rate, pw, g, sd) in {
        'pen': (2400, 6500, 900, 0.85, 6, 1.0, 0.14, 1),
        'write': (2000, 6000, 700, 0.9, 11, 1.5, 0.17, 3),
        'marker': (700, 3200, 300, 0.6, 14, 2.0, 0.14, 5)}.items():
    lv, pn = activity(kind)
    foley += pan_st(scratch_noise(lo, hi, gh, dep, sd) * wobble(rate, sd + 1) ** pw * lv, pn * 0.6) * g
for e in EV:
    if e['type'] in ('pen', 'write') and e['d'] >= 0.12:
        add(foley, hp(click(pitch=0.55 + rng.random() * 0.2, v=1.0), 1500) * 0.04, e['t'], 1.0, e.get('pan', 0) * 0.6)
foley *= (1 - 0.5 * duck)[:, None]                                   # pens step back under the voice
room = lp(rng.standard_normal(N), 500, 2) * 0.004
foley += np.stack([room, np.roll(room, 997)], 1)
# the drop lands in the spoon
d = 0.16; t_ = np.arange(int(d * SR)) / SR
plip = np.sin(2 * np.pi * (1500 - 2600 * t_) * t_) * np.exp(-t_ / 0.035)
add(foley, plip * 0.16, CUE['drop'], 1.0, -0.2)
# camera moves made of paper and air
add(foley, lp(whoosh(0.8, 1.0), 3000) * 0.07, 7.7, 1.0, 0.2)                   # whip-tilt to the title
add(foley, lp(whoosh(0.5, 1.0), 2500) * 0.06, CUE['match'] - 0.25, 1.0, 0.1)   # match cut
add(foley, lp(whoosh(0.9, 1.0), 2000) * 0.05, CUE['deep'], 1.0, -0.1)          # the dive into the stomach
add(foley, lp(whoosh(1.6, 1.0), 2500) * 0.08, CUE['pull'], 1.0, 0.0)           # the final pull-back

# ---------------- score: F major, 100 bpm, chords follow the story ----------------
B = 0.6
CH = [  # (start, end, chord tones, texture)
    (CUE['music'], CUE['s1'], [53, 60, 65, 69, 72], 'marimba'),
    (CUE['s1'], CUE['match'], [50, 57, 62, 65, 69], 'marimba'),
    (CUE['match'], CUE['deep'], [46, 58, 62, 65, 70], 'marimba'),
    (CUE['deep'], CUE['follow'], [43, 55, 62, 67, 70], 'bowed'),        # inside the stomach: held, airy
    (CUE['follow'], CUE['chart'], [48, 55, 60, 64, 67], 'marimba'),
    (CUE['chart'], CUE['seal'], [45, 57, 60, 64, 69], 'marimba'),
    (CUE['seal'], CUE['honey'], [46, 58, 62, 65, 70], 'marimba'),
    (CUE['honey'], CUE['million'], [53, 60, 65, 69, 72], 'marimba'),
    (CUE['million'], CUE['pull'], [50, 57, 62, 65, 69], 'marimba'),
    (CUE['pull'], CUE['done'] - 0.5, [46, 58, 62, 65, 70], 'climb')]
ev = []
for i, (a, b, ns, tex) in enumerate(CH):
    ev.append((a, 'kalimba', ns[3] + 12 if i % 2 else ns[4], 1.2, 0.5, -0.25, 0.7))     # each chapter: one kalimba note
    ev.append((a, 'cellos_pizz', ns[0] if ns[0] < 52 else ns[0] - 12, 0.8, 0.5, -0.1, 0.8))
    if tex == 'bowed':
        for j, n in enumerate(ns[2:]): ev.append(dict(t=a + 0.1 * j, inst='vibraphone_bowed', pitch=n, dur=b - a - 0.2, vel=0.4, pan=-0.3 + 0.3 * j, gain=0.5, attack=0.6))
        continue
    t = a + B; k = 0
    while t < b - 0.05:
        if tex == 'marimba':
            ev.append((t, 'marimba', ns[1 + (k * 2) % 4], 0.4, 0.26 + 0.05 * (k % 2 == 0), 0.15, 0.5))
            if k % 4 == 3: ev.append((t, 'cellos_pizz', ns[0] + 7 if ns[0] + 7 < 60 else ns[0], 0.6, 0.35, -0.1, 0.6))
        t += B; k += 1
    if tex == 'climb':
        for j, n in enumerate([77, 81, 84, 86, 89, 91]):
            ev.append((a + 0.35 + j * 0.42, 'glockenspiel', n, 0.8, 0.3 + 0.04 * j, 0.3, 0.42))
            ev.append((a + 0.35 + j * 0.42, 'marimba', n - 24, 0.4, 0.3, 0.1, 0.5))
ev.append((CUE['honey'], 'glockenspiel', 84, 1.2, 0.5, 0.3, 0.5)); ev.append((CUE['honey'] + 0.12, 'glockenspiel', 89, 1.2, 0.45, 0.3, 0.45))
DONE = CUE['done']
for i, p in enumerate([53, 60, 65, 69, 72, 77]):
    ev.append((DONE + i * 0.035, 'harp', p, 2.5, 0.62, -0.3 + i * 0.12, 0.9))
ev += [(DONE, 'vibraphone', 65, 2.5, 0.5, 0.0, 0.6), (DONE, 'vibraphone', 69, 2.5, 0.45, 0.1, 0.5),
       (DONE + 0.02, 'glockenspiel', 89, 2.0, 0.55, 0.2, 0.55), (DONE, 'cellos_pizz', 41, 1.5, 0.6, 0.0, 0.85)]
S.seed(5)
music = S.render(ev, dur=DUR + 3, master=False)[:N]
music = S.room(music, size=0.4, mix=0.2)
music = music - 0.37 * np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)   # ~ -4 dB where the voice lives
music *= (1 - 0.45 * duck)[:, None]                                                            # and ducks while she speaks
fade = np.clip((DUR - tt) / 0.8, 0, 1); music *= fade[:, None]

# ---------------- balance: voice ~10 dB above the music (RMS) ----------------
spk = vmask > 0
m_rms = rms(music[spk].mean(1)); v_rms = rms(vo[spk])
vg = (m_rms * 10 ** (10 / 20)) / v_rms
mix = foley + music + np.stack([vo * vg, vo * vg], 1)
print(f'voice vs music (RMS while speaking): {db(rms(vo[spk]) * vg) - db(rms(music[spk].mean(1))):.1f} dB;'
      f' voice vs pens: {db(rms(vo[spk]) * vg) - db(rms(foley[spk].mean(1))):.1f} dB')
mix = np.stack([limit(compress(mix[:, c], thr=0.35, ratio=2.0)) for c in (0, 1)], 1)
mix *= np.clip((DUR - tt) / 0.25, 0, 1)[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = ['cellos_pizz', 'marimba', 'kalimba', 'glockenspiel', 'harp', 'vibraphone', 'vibraphone_bowed']
cr = S.credits(used); open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3))
