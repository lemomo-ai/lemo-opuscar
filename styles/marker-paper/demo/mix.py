"""Sound for «How far can you see?» (马克笔白纸速写): English narration + felt-tip marker foley + paper + the score.

Everything is written in whole-film seconds and cut to [t0, t1] at the end (build.sh passes them; the page exported
out/events.json for the same cut). Order of the mix:
  voice compressed first → music EQ'd out of the voice band (300 Hz–4 kHz) → music set ~10 dB under the voice by RMS
  → foley ~7 dB under the voice → per-channel limiter. mux.sh then brings the whole film to −14 LUFS, true peak −1.2 dB.

run from the library root:  .venv/bin/python styles/marker-paper/demo/mix.py [t0=0] [t1=52.0]   → out/mix.wav
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, limit, compress

HERE = os.path.dirname(os.path.abspath(__file__))
T0 = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
T1 = float(sys.argv[2]) if len(sys.argv) > 2 else 52.0
D = json.load(open(os.path.join(HERE, 'out', 'events.json')))
EV = D['ev']; DUR = float(D['dur']); N = int(round(DUR * SR))
assert abs(DUR - (T1 - T0)) < 1e-3, 'events.json was exported for another cut'
rng = np.random.default_rng(7)
cue = dict(question=10.2, push=11.6, cut=12.35, drop=21.8, answer=27.6, peel=29.0, reveal=36.2, plane=39.4, rule=46.2, sign=48.35)   # film.js CUE
cue.update({e['name']: e['t'] + T0 for e in EV if e['type'] == 'cue'})            # whole-film seconds
FULL = int(round((T1 + 3) * SR))                                         # work in whole-film time, cut at the end


def place(buf, x, at, gain=1.0, pan=0.0):
    if at * SR >= len(buf): return
    add(buf, np.asarray(x, np.float32), max(0.0, at), gain, float(np.clip(pan, -1, 1)))


# ───────────────────────── voice (Kokoro bm_george, 24 kHz → 48 kHz), compressed
vo = np.zeros((FULL, 2), np.float32)
LINES = {l['id']: l for l in json.load(open(os.path.join(HERE, 'vo', 'lines.json')))}
for e in EV:
    if e['type'] != 'vo': continue
    x, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = hp(x, 80) / (np.abs(x).max() + 1e-9) * .7
    x = compress(x, thr=.18, ratio=3.0, att=.003, rel=.12)
    place(vo, x, e['t'] + T0, 1.0, 0.0)
vmask = lp((np.abs(vo.mean(1)) > 1e-3).astype(float), 3, 1) > .2   # where someone is speaking

# ───────────────────────── foley: a bullet-tip felt marker on matte paper (STYLE.md §7)
def felt(d, v, seed, bright=1.0):
    n = max(int(d * SR), 64); r = np.random.default_rng(seed)
    x = bp(r.standard_normal(n), 550 * bright, min(5200, (1700 + v * .45) * bright), 2)
    tooth = lp(np.abs(r.standard_normal(n)), 60 + v * .02, 1); tooth = tooth / (np.percentile(tooth, 90) + 1e-9)
    x *= .55 + .45 * np.clip(tooth, 0, 1.6)
    env = np.ones(n); a = min(n // 3, int(.006 * SR)); rel = min(n // 3, int(.025 * SR))
    env[:a] = np.linspace(0, 1, a); env[-rel:] *= np.linspace(1, 0, rel) ** 1.5
    if d > .15 and v > 1400:   # the felt tip drags: a faint squeak riding on a long fast stroke
        tt = np.arange(n) / SR; f0 = 1750 + 300 * r.random()
        sq = np.sin(2 * np.pi * (f0 * tt + 14 * np.cumsum(lp(r.standard_normal(n), 6, 1)) / SR))
        x += sq * np.clip(lp(np.abs(r.standard_normal(n)), 8, 1) * 6, 0, 1) * .05
    return x * env * np.clip(v / 2500, .35, 1.0) ** .7

def tok(seed, v=1.0):       # the nib touching down: a soft felt tap through the pad
    r = np.random.default_rng(seed); n = int(.05 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * (210 + 40 * r.random()) * tt) * np.exp(-tt / .009) * .6 + bp(r.standard_normal(n), 900, 3200, 2) * np.exp(-tt / .003) * .5) * v

def tsk(seed, v=1.0):       # one quick hatch flick
    r = np.random.default_rng(seed); n = int(.045 * SR); tt = np.arange(n) / SR
    return bp(r.standard_normal(n), 1300, 5200, 2) * np.minimum(1, tt / .003) * np.exp(-tt / .014) * v

fol = np.zeros((FULL, 2), np.float32)
for i, e in enumerate(EV):
    k = e['type']; t = e['t'] + T0
    if k not in ('line', 'write', 'hatch', 'dash'): continue
    pan, bright = e.get('pan', 0) * .55, (.92 if e.get('col') != 'black' else 1.0)
    if k == 'hatch': place(fol, tsk(i, .9), t, .32, pan)
    elif k == 'dash': place(fol, felt(e['d'], e['v'], i, bright), t, .30, pan); place(fol, tok(i, .5), t, .16, pan)
    elif k == 'write':
        x = felt(e['d'], e['v'], i, bright * 1.05); tt = np.arange(len(x)) / SR
        x *= .55 + .45 * np.abs(np.sin(2 * np.pi * (9 + 4 * rng.random()) * tt + rng.random() * 3))
        place(fol, x, t, .30, pan)
        if rng.random() < .55: place(fol, tok(i + 999, .55), t, .14, pan)
    else: place(fol, felt(e['d'], e['v'], i, bright), t, .42, pan); place(fol, tok(i, .8), t, .20, pan)

# paper: the peel (corner lifts with a crackle, the sheet slides off), and the push through the mark (air)
def peel_sound(d, seed):
    r = np.random.default_rng(seed); n = int((d + .5) * SR); tt = np.arange(n) / SR
    crack = np.zeros(n)
    for _ in range(40):
        j = int(r.uniform(0, .45) * SR); m = int(.006 * SR)
        if j + m < n: crack[j:j + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (.0015 * SR)) * r.uniform(.3, 1)
    crack = bp(crack, 1500, 7000, 2)
    slide = bp(r.standard_normal(n), 400, 3500, 2) * np.clip(np.sin(np.pi * np.clip((tt - .2) / (d + .1), 0, 1)), 0, 1) ** 1.5
    return crack * .5 + slide * .35
place(fol, peel_sound(.8, 3), cue['peel'], .9, .3)
def air(d, seed):
    r = np.random.default_rng(seed); n = int(d * SR); tt = np.arange(n) / SR
    x = lp(r.standard_normal(n), 900, 2) * (tt / d) ** 2.2
    return x / (np.abs(x).max() + 1e-9)
place(fol, air(cue['cut'] - cue['push'], 5), cue['push'], .16, .2)
room = lp(rng.standard_normal(FULL), 420, 2) * .0035
fol += np.stack([room, np.roll(room, 1301)], 1).astype(np.float32)

# ───────────────────────── score (whole-film seconds): 100 bpm, beat 0.6 s, bar 2.4 s, D dorian → F major
BEAT, BAR = .6, 2.4
def b(bar, beat=1.0): return (bar - 1) * BAR + (beat - 1) * BEAT
ev = []
def bass(t, p, v=.6): ev.append((t, 'contrabass_pizz', p, .55, v, -.08, 1.0))
def shaker(a, z):
    t = a
    while t < z: ev.append((t + BEAT / 2, 'shaker', None, None, .2, .35, .45)); t += BEAT
# ① 0–12.35: walking pizzicato bass pushes the question forward
for bar, notes in {1: [('D2', 1), ('A1', 3)], 2: [('D2', 1), ('F2', 2), ('G2', 3), ('A2', 4)], 3: [('D2', 1), ('E2', 2), ('F2', 3), ('A2', 4)],
                   4: [('G2', 1), ('B2', 2), ('D3', 3), ('B2', 4)], 5: [('A2', 1), ('C3', 2)]}.items():
    for p, bt in notes: bass(b(bar, bt), p)
shaker(0, b(5, 2))
for bar in (1, 2, 3, 4): ev.append((b(bar, 4), 'claves', None, None, .28, -.3, .4))
for p, bt in [('A4', 1), ('F4', 1.5), ('D4', 2), ('E4', 2.5)]: ev.append((b(2, bt), 'clarinet_stac', p, .25, .34, .25, .5))
for p, bt in [('G3', 1), ('B3', 1.5), ('D4', 2), ('B3', 3)]: ev.append((b(4, bt), 'bassoon_stac', p, .25, .4, -.2, .55))
q = cue.get('question', 10.2)                                   # red lands: a question left hanging (A sus4)
for p, dt, v in [('A3', 0, .6), ('D4', .04, .58), ('E4', .08, .56), ('A4', .12, .55)]: ev.append((q + dt, 'harp', p, 1.6, v, -.25, .75))
ev += [(q, 'contrabass_pizz', 'A1', .9, .7, 0, 1.0), (q, 'glockenspiel', 'A6', 1.6, .6, .3, .6), (q + .3, 'glockenspiel', 'E6', 1.4, .45, .35, .45)]
# the push: the glockenspiel climbs into the mark; a low pluck on the cut
for i, p in enumerate(['A5', 'D6', 'E6', 'A6']): ev.append((cue['push'] + .1 + i * .15, 'glockenspiel', p, .6, .3 + .06 * i, .25, .4))
ev += [(cue['cut'], 'contrabass_pizz', 'D2', .8, .7, 0, 1.0), (cue['cut'], 'harp', 'D3', 1.2, .5, -.2, .6)]
# ② 12.35–29.0: the bass walks under the drawing, the woodwinds fill the silent algebra, F major on the answer
t = 13.2
for p in ['D2', 'F2', 'A2', 'C3', 'B1', 'D2', 'G2', 'B2', 'A1', 'C2', 'E2', 'G2']: bass(t, p, .55); t += BEAT
for i, (p, d) in enumerate([('A4', .5), ('C5', .5), ('D5', .5), ('F5', .7), ('E5', .5), ('D5', .9)]): ev.append((18.4 + i * .3, 'clarinet_stac', p, .25, .42, .25, .6))
for i, p in enumerate(['D3', 'F3', 'A3', 'C4']): ev.append((18.4 + i * .3, 'bassoon_stac', p, .25, .45, -.2, .6))
t = 19.6
for p in ['D2', 'A1', 'D2', 'A1', 'G1', 'D2']: bass(t, p, .5); t += BEAT * 2
ev += [(cue['drop'], 'contrabass_pizz', 'E1', .6, .75, 0, 1.0), (cue['drop'] + .02, 'woodblock', None, None, .35, .2, .4)]
for i, p in enumerate(['D4', 'F4', 'A4', 'D5', 'F5']): ev.append((22.6 + i * .09, 'harp', p, 1.2, .5, -.1 + .05 * i, .55))
t = 23.4
for p in ['G1', 'G2', 'A1', 'A2', 'Bb1', 'Bb2', 'C2', 'C3']: bass(t, p, .5); t += BEAT
a = cue['answer']                                               # the answer: F major, resolved
for p, dt, v in [('F3', 0, .62), ('A3', .03, .6), ('C4', .06, .58), ('F4', .09, .58), ('A4', .12, .56), ('C5', .15, .55)]: ev.append((a + dt, 'harp', p, 2.0, v, -.3 + dt * 3, .8))
ev += [(a, 'contrabass_pizz', 'F1', 1.2, .75, 0, 1.0), (a, 'glockenspiel', 'F6', 1.6, .55, .3, .55), (a, 'clarinet', 'A4', 1.3, .4, .25, .5), (a, 'bassoon', 'F3', 1.3, .42, -.2, .5)]
# 29.0–29.8: the peel — the music stops, only paper (silence 1)
# ③ 29.9–52.0: sparse again; a pluck per red bar; the pull-back is almost silent (silence 2); the long bar is a harp run
t = 29.9
for p in ['D2', 'A1', 'D2', 'F2', 'G2', 'A2', 'D2', 'A1', 'D2', 'F2']: bass(t, p, .5); t += BEAT
for tt_, p in [(32.55, 'A5'), (34.45, 'D6'), (35.05, 'E6')]: ev.append((tt_, 'glockenspiel', p, .8, .45, .3, .5))
ev.append((33.85, 'harp', 'A4', .8, .45, -.2, .5))
pl = cue['plane']
for i, p in enumerate(['D3', 'F3', 'A3', 'C4', 'D4', 'F4', 'A4', 'C5', 'D5', 'F5', 'A5', 'C6']): ev.append((pl + i * .1, 'harp', p, 1.0, .45 + .02 * i, -.4 + .07 * i, .55))
ev += [(pl, 'contrabass_pizz', 'D2', .8, .65, 0, 1.0), (40.7, 'glockenspiel', 'D6', 1.4, .5, .3, .5)]
t = 41.4
for p in ['D2', 'F2', 'G2', 'A2', 'Bb2', 'A2', 'G2', 'C2', 'C2']: bass(t, p, .45); t += BEAT
ev += [(44.1, 'bassoon', 'Bb2', 2.0, .32, -.2, .45), (44.1, 'clarinet', 'D4', 2.0, .28, .25, .4)]
rl = cue['rule']                                                # the last red stroke: the whole chord
for p, dt, v in [('F2', 0, .62), ('C3', .04, .6), ('F3', .08, .6), ('A3', .12, .58), ('C4', .16, .58), ('F4', .2, .56), ('A4', .24, .55), ('C5', .28, .55)]:
    ev.append((rl + dt, 'harp', p, 2.6, v, -.35 + dt * 2.5, .85))
ev += [(rl, 'contrabass_pizz', 'F1', 1.5, .75, 0, 1.0), (rl, 'glockenspiel', 'C6', 2.4, .55, .3, .55), (rl + .35, 'glockenspiel', 'F6', 2.2, .45, .35, .45),
       (rl, 'clarinet', 'A4', 2.2, .4, .25, .5), (rl, 'bassoon', 'F3', 2.2, .42, -.2, .5)]
# the end card: when the signature is down, a soft F major settles the film to its end (no cut, no loop)
sg = cue['sign']
for p, dt, v in [('F3', 0, .42), ('A3', .06, .4), ('C4', .12, .4), ('F4', .18, .38), ('A4', .24, .36)]: ev.append((sg + dt, 'harp', p, 2.4, v, -.2 + dt, .5))
ev += [(sg + .1, 'glockenspiel', 'F6', 2.2, .32, .3, .32), (sg, 'contrabass_pizz', 'F1', 1.2, .45, 0, .7)]
S.seed(11)
music = S.render([e for e in ev if e[0] < T1 + 2], dur=(FULL / SR), master=False)
music = S.room(music, size=.3, mix=.14)[:FULL].astype(np.float32)
music = np.pad(music, ((0, FULL - len(music)), (0, 0)))
# give the voice its band: −6 dB between 300 Hz and 4 kHz
music = music - .5 * np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1).astype(np.float32)

# ───────────────────────── balance by RMS where the narrator speaks
def rms(x, m): return np.sqrt(np.mean(x[m] ** 2)) + 1e-12
m = vmask[:FULL]
music *= (rms(vo, m) / rms(music, m)) * 10 ** (-10 / 20)
fol *= (rms(vo, m) / rms(fol, m)) * 10 ** (-7 / 20)
mix = vo + music + fol
i0 = int(round(T0 * SR)); mix = mix[i0:i0 + N]
mix = np.pad(mix, ((0, N - len(mix)), (0, 0)))
tt = np.arange(N) / SR
mix *= np.clip((DUR - tt) / (1.4 if T1 >= 52 else .6), 0, 1)[:, None] ** 1.2   # a short fade at the end of a cut; the whole film lets the last chord settle
mix = np.stack([limit(mix[:, c], .9) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
mm = m[i0:i0 + N]
print(f'mix.wav {DUR:.2f}s | while speaking: voice {db(vo[i0:i0+N][mm]):.1f} dB, music {db(music[i0:i0+N][mm]):.1f} dB, foley {db(fol[i0:i0+N][mm]):.1f} dB')
