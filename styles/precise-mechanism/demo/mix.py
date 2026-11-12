"""Sound for the full film 《三套系统走时》 (52 s): English narration + ticks + foley + a score on the 150 bpm grid.

Reads events.json (the page's EV on the full timeline): 'dialtick' / 'tick' / 'bigtick' (one per centre crossing of the balance,
panned to it), 'cut', 'lift', 'explode', 'land', 'lock', 'descend', 'seat', 'dye', 'label', 'ratio', 'final', the 'rush' curve
(how fast the free train runs), and 'sub' (each narration line: start, end, text). Voice files: voice/<id>.wav (Kokoro).

Mix: voice compressed, then set by RMS ~10 dB over the music; the music is ducked under the voice
and gives way in 300 Hz–4 kHz; master to −14 LUFS in mux.sh.
usage (library root):  .venv/bin/python styles/precise-mechanism/demo/mix.py      → out/mix-full.wav, out/cues.json
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, t_, env_exp, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
FULL = float(D['dur']); EV = D['ev']
N = int(FULL * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(7)
BEAT = 0.4
ev = lambda kind: [e for e in EV if e['type'] == kind]
one = lambda kind: ev(kind)[0]['t']
SUBS = ev('sub')


# ───────────────── foley ─────────────────
def tick(k, bright=1.0):
    """a watch beat: unlock, impulse, drop – three metal clicks inside ~15 ms; tick and tock differ a little"""
    d = .14; x0 = t_(d); p = (1.0 if k % 2 == 0 else 0.93) * bright
    out = np.zeros(len(x0))
    for off, a in [(0.0, .55), (.006, .35), (.014, 1.0)]:
        s = int(off * SR); n = len(x0) - s; x = x0[:n]
        tr = hp(rng.standard_normal(n), 3000) * np.exp(-x / .0009)
        res = sum(g * np.sin(2 * np.pi * f * p * x + rng.random() * 6) * np.exp(-x / tau)
                  for f, g, tau in [(3150, .7, .010), (4870, .55, .007), (6920, .4, .005), (2230, .25, .014)])
        out[s:] += a * (tr * .6 + res)
    return out / np.abs(out).max()


def metal_swish(d, f0, f1, tink=True):
    x0 = t_(d); n = rng.standard_normal(len(x0)); out = np.zeros(len(x0))
    for i in range(0, len(n), 480):
        hi = min(len(n), i + 480); f = f0 + (f1 - f0) * (i / len(n)) ** 1.3
        out[i:hi] = bp(n[max(0, i - 2000):hi], f * .8, f * 1.25)[-(hi - i):]
    env = np.minimum(1, x0 / .03) * np.exp(-np.maximum(0, x0 - .05) / (d * .4))
    x = out * env; x /= np.abs(x).max()
    y = np.zeros(int((d + .6) * SR)); y[:len(x)] += x * .7
    if tink:
        tk = sum(g * np.sin(2 * np.pi * f * t_(.6)) * env_exp(.6, tau) for f, g, tau in [(5240, .5, .09), (7900, .3, .05)])
        s = int((d - .06) * SR); y[s:s + len(tk)] += tk * .35
    return y


def clack(v=1.0, f=1.0):
    """two brass parts meeting: a short bright knock with a low body"""
    d = .25; x = t_(d)
    k = hp(rng.standard_normal(len(x)), 1800) * np.exp(-x / .002)
    body = sum(g * np.sin(2 * np.pi * fr * f * x) * np.exp(-x / tau) for fr, g, tau in [(1850, .6, .03), (3400, .4, .02), (420, .7, .05), (160, .6, .07)])
    y = k * .8 + body; return y / np.abs(y).max() * v


mix = np.zeros((N, 2))
for e in ev('dialtick'):           # under the closed dial: real speed, softer and duller
    add(mix, lp(tick(e['k']), 5200), e['t'], .20, .15)
for e in ev('tick'):
    add(mix, tick(e['k']), e['t'], .34, float(np.clip(e['pan'] * .7, -.8, .8)))
for e in ev('bigtick'):            # the climax: the one tick that matters
    x = tick(e['k'], .9); y = np.zeros(int(1.6 * SR)); y[:len(x)] += x
    add(mix, y, e['t'], .42, 0); add(mix, thump(.9, 70)[:int(.4 * SR)], e['t'] + .012, .14, 0)
for e in ev('cut'):
    if e['which'] == 'dial': add(mix, metal_swish(.9, 900, 4200), e['t'], .16, .2)
    else: add(mix, metal_swish(.42, 1800, 7000), e['t'], .14, -.35)
add(mix, lp(whoosh(1.2, 1.0), 3000), one('lift') + .1, .10, 0)
add(mix, lp(whoosh(1.1, 1.0), 3500), one('explode'), .10, 0)
for e in ev('land'): add(mix, clack(.6, .9), e['t'], .16, 0)
add(mix, clack(1.0, 1.0), one('lock'), .26, .2)                                  # the fork drops in: the train stops dead
add(mix, lp(whoosh(1.4, 1.0), 2500), one('descend'), .10, 0)
add(mix, clack(.7, .6), one('seat'), .14, 0); add(mix, thump(.8, 90)[:int(.3 * SR)], one('seat'), .10, 0)
for e in ev('label'): add(mix, hp(click(pitch=1.5, v=1.0), 2500), e['t'] + .15, .03, 0)

# the free-running train: a gear buzz at the tooth-passing rate plus air, both following the rush curve
R = [e for e in EV if e['type'] == 'curve' and e['name'] == 'rush'][0]
rush = np.interp(tt, np.arange(len(R['v'])) * R['dt'], R['v'])
rate = 8 + 60 * rush                                       # teeth of the seconds wheel passing per second
ph = np.cumsum(rate / SR); pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
buzz = bp(np.convolve(pulses, np.exp(-np.arange(int(.004 * SR)) / (.0008 * SR)), 'same') * rng.standard_normal(N) * .5 + np.convolve(pulses, np.ones(8) / 8, 'same'), 1200, 6000)
air = bp(rng.standard_normal(N), 400, 2400)
gr = rush ** 1.3
mix += np.stack([buzz * gr * .55 + air * gr * .05, buzz * gr * .5 + air * gr * .05], 1)
room = lp(rng.standard_normal(N), 420, 2) * .003
mix += np.stack([room, np.roll(room, 1709)], 1)

# ───────────────── score ─────────────────
TONES = {'D': (50, [62, 66, 69, 74]), 'Bm': (47, [62, 66, 71, 74]), 'G': (43, [62, 67, 71, 74]), 'A': (45, [61, 64, 69, 73])}
CH = [(0, 'D'), (3.2, 'Bm'), (6.4, 'G'), (9.6, 'A'), (12.8, 'D'), (16.0, 'Bm'), (19.2, 'G'), (22.4, 'A'), (25.6, 'Bm'), (28.8, 'A'),
      (30.4, 'D'), (33.6, 'Bm'), (36.8, 'G'), (38.4, 'A'), (40.0, 'D'), (43.2, 'G'), (44.0, 'A'), (45.2, 'D')]
chord_at = lambda t: [c for s, c in CH if s <= t + 1e-6][-1]
LOCK, TICK, FINAL, EXPL = one('lock'), one('bigtick'), one('final'), one('explode')
score = []


def harp(t0, t1, lv, step=BEAT / 2):
    pat = [0, 2, 1, 3, 0, 2, 1, 3]
    t, i = t0, 0
    while t < t1 - 1e-6:
        root, ns = TONES[chord_at(t)]
        score.append((t, 'harp', ns[pat[i % 8]], .5, (.26 + .05 * (i % 2 == 0)) * lv, .25)); t += step; i += 1


def bass(t0, t1, lv):
    t = t0
    while t < t1 - 1e-6:
        root, _ = TONES[chord_at(t)]
        score.append((t, 'cellos_pizz', root, .8, .6 * lv, -.05)); t += 2 * BEAT


harp(0.0, 6.4, .45, BEAT)                        # the hook: quarter notes over the fast real-time ticks
harp(6.4, EXPL, 1.0); bass(6.4, EXPL, 1.0)
score.append(dict(t=one('ratio'), inst='vibraphone', pitch=67, dur=2.4, vel=.42, pan=-.1))    # the cut to 4,800×
score.append(dict(t=one('ratio'), inst='vibraphone', pitch=71, dur=2.4, vel=.38, pan=.1))
score.append(dict(t=one('ratio'), inst='cellos', pitch=50, dur=4.6, vel=.26, pan=-.1, attack=.4))
for p, lv in [(69, .30), (76, .26)]:             # the rush: tremolo strings swell, cut dead at the lock
    score.append(dict(t=EXPL + 1.4, inst='violins_trem', pitch=p, dur=LOCK - EXPL - 1.4, vel=lv, pan=.15, attack=2.5, release=.04))
harp(LOCK + .45, 37.2, .65); bass(LOCK + .45, 37.2, .7)
score.append((TICK + .02, 'glockenspiel', 86, 2.0, .5, .1)); score.append((TICK + .02, 'contrabass_pizz', 38, 1.5, .6, 0))
harp(40.0, FINAL, .75); bass(40.0, FINAL, .8)
for i, p in enumerate([50, 57, 62, 66, 69, 76]):  # the last image: D add9
    score.append((FINAL + i * .028, 'harp', p, 3.0, .58, -.3 + i * .12))
score.append((FINAL, 'vibraphone', 66, 3.4, .42, .1)); score.append((FINAL, 'vibraphone', 69, 3.4, .38, .15))
score.append((FINAL + .02, 'glockenspiel', 86, 3.0, .42, .25)); score.append((FINAL, 'contrabass_pizz', 38, 1.4, .6, 0))
score.append(dict(t=FINAL, inst='cellos', pitch=50, dur=4.0, vel=.30, pan=-.1, attack=.3))
harp(FINAL + 1.6, FULL - 1.6, .42, BEAT)                    # thins out under the credit, the last chord rings to the end
score.append((FULL - 1.6, 'harp', 50, 2.0, .40, -.2)); score.append((FULL - 1.6, 'vibraphone', 62, 2.0, .30, .1))
NOTE = {'power': ('vibraphone', 50), 'center': ('marimba', 74), 'third': ('marimba', 78), 'fourth': ('marimba', 83),
        'escape': ('glockenspiel', 81), 'pallet': ('glockenspiel', 85), 'balance': ('glockenspiel', 88)}
for e in ev('dye'):
    inst, p = NOTE[e['g']]
    score.append((e['t'], inst, p, 1.0, .5 if inst != 'glockenspiel' else .4, float(np.clip(e['pan'] * .6, -.6, .6))))

S.seed(11)
music = S.render(score, dur=FULL + 3, master=False)[:N]
music = S.room(music, size=.32, mix=.16)
# shape: silence before the tick (37.2 → tick), a breath after the lock, fade at the very end
g = np.ones(N)
g *= 1 - np.clip((tt - 37.0) / .4, 0, 1) * (tt < TICK)
g *= np.where((tt > LOCK) & (tt < LOCK + .45), 0, 1)
g *= np.clip((FULL - tt) / 1.4, 0, 1) ** 1.5

# narration: compress, then place; music ducks under it and leaves room in 300 Hz–4 kHz
voice = np.zeros(N); duck = np.zeros(N)
for s in SUBS:
    x, sr = sf.read(os.path.join(HERE, 'voice', s['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr); x = hp(x, 80); x = compress(x / np.abs(x).max(), thr=.3, ratio=3.0)
    i0 = int(s['t'] * SR); i1 = min(N, i0 + len(x)); voice[i0:i1] += x[:i1 - i0]
    a, b = s['t'] - .15, s['vEnd'] + .25
    duck = np.maximum(duck, np.clip(np.minimum((tt - a) / .15, (b - tt) / .3), 0, 1))
mid = np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)
music = (music - mid * .45 * duck[:, None]) * (1 - .45 * duck)[:, None]
music *= g[:, None]
mix += music * .5

speech = np.abs(voice) > 1e-4
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
m_rms = rms(music[speech].mean(1) * .5); v_rms = rms(voice[speech])
voice *= (m_rms * 10 ** (10 / 20)) / v_rms                 # voice 10 dB over the music
voice = limit(voice, rms(voice[speech]) * 10 ** (8.5 / 20))  # tame the narration's plosive peaks (peak ≤ RMS + 8.5 dB)
mix += np.stack([voice, voice], 1) * .98

mix = np.stack([compress(mix[:, 0], thr=.4, ratio=2.0), compress(mix[:, 1], thr=.4, ratio=2.0)], 1)
# peak-to-loudness: the ticks are 1 ms metal transients; shave them 5 dB with a look-ahead limiter so loudnorm can reach
# −14 LUFS with true peak ≤ −1.2 dB (PLR ≤ ~12 dB)
pk = np.abs(mix).max(); c = pk * 10 ** (-10 / 20)
mix = np.stack([limit(mix[:, 0], c), limit(mix[:, 1], c)], 1)
mix *= .63 / np.abs(mix).max()
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix-full.wav'), mix.astype(np.float32), SR)
used = ['harp', 'cellos_pizz', 'contrabass_pizz', 'cellos', 'violins_trem', 'vibraphone', 'marimba', 'glockenspiel']
open(os.path.join(HERE, 'out', 'instruments-full.txt'), 'w').write('\n'.join(S.credits(used)))
# subtitles (Chinese line over English line) for demo-full.srt
json.dump([{'t0': s['t'], 't1': s['t1'], 'text': s['zh'] + '\n' + s['en']} for s in SUBS], open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print('mix', mix.shape, 'peak', float(np.abs(mix).max()), 'music rms in speech', 20 * np.log10(m_rms), 'voice', 20 * np.log10(rms(voice[speech])))
