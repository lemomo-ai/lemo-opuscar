"""Blob Simulation demo · the whole film's sound: English narration + foley + score.

Reads out/events.json (exported by the page from the picture: beans, every footstep, every bean eaten, Pips running dry, gone, born,
every generation, every Pip landing in its histogram slot, the section cues and the narration times) and the narration voice/<id>.wav
(Kokoro bm_george, 24 kHz). Score at 120 bpm in G major following the sections; the music leaves 300 Hz–4 kHz to the voice and ducks under it.
Usage (from the library root): .venv/bin/python styles/pip-simulation/demo/mix.py [events.json] [out.wav]
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, t_, env_exp, whoosh

HERE = os.path.dirname(os.path.abspath(__file__))
EVF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'events.json')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out', 'mix.wav')
D = json.load(open(EVF)); DUR = float(D['dur']); EV = D['ev']; N = int(DUR * SR)
rng = np.random.default_rng(23)
C = {e['name']: e['t'] for e in EV if e['type'] == 'cue'}
PENTA = [55, 57, 59, 62, 64, 67, 69, 71, 74, 76, 79, 81, 83, 86]

# ———————— foley ————————
fx = np.zeros((N, 2))
def felt_step(slow=1.0):
    d = .07 * slow; x = lp(rng.standard_normal(len(t_(d))), 900 / slow, 2) * env_exp(d, .012 * slow)
    x += np.sin(2 * np.pi * (150 + 70 * rng.random()) / slow ** .5 * t_(d)) * env_exp(d, .018 * slow) * .6
    return x / (np.abs(x).max() + 1e-9)
def plip(f0):
    d = .12; f = f0 * (1.25 - .45 * t_(d) / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .03); x[:48] *= np.linspace(0, 1, 48); return x
def nom(f0):
    out = np.zeros(int(.16 * SR))
    for k, (dt, ff) in enumerate([(0, f0), (.065, f0 * 1.33)]):
        d = .08; f = ff * (.85 + .3 * t_(d) / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .025) * (1 - .3 * k); x[:24] *= np.linspace(0, 1, 24)
        i = int(dt * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out
def sigh(length=.32, f0=520):
    d = length; f = f0 * (1 - .45 * t_(d) / d)
    x = bp(rng.standard_normal(len(t_(d))), 500, 1800) * .35 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .5
    return x * np.sin(np.pi * t_(d) / d) ** 1.5
def poof():
    d = .22; x = lp(rng.standard_normal(len(t_(d))), 2200, 2) * env_exp(d, .05); return x / (np.abs(x).max() + 1e-9)

for e in EV:
    k, g, pan = e['type'], e.get('g', .5), e.get('pan', 0)
    if k == 'step':
        sl = min(3.0, e.get('slow', 1))   # in slow motion the steps are slower and duller
        add(fx, felt_step(sl ** .5), e['t'], (.2 if e.get('hero') else .09) * g ** 1.3 / sl ** .3, pan * .8)
    elif k == 'bean': add(fx, plip(1100 + 500 * rng.random()), e['t'], .10 * g ** 1.5, pan * .8)
    elif k == 'eat': add(fx, nom(520 + 260 * min(1, (e['s'] - .6) / 1.3)), e['t'] - .03, (.32 if e.get('hero') else .06) * g ** 1.2, pan * .8)
    elif k in ('tired', 'slump'):
        if e.get('hero'): add(fx, sigh(1.4, 430), e['t'], .32, pan * .6)   # Bolt: a long sigh in slow motion
        else: add(fx, sigh(), e['t'], .07 * g ** 1.3, pan * .8)
    elif k == 'gone': add(fx, poof(), e['t'] + .12, .14 * max(g, .25), pan * .8)
    elif k == 'wake' and e.get('hero'): add(fx, plip(1500), e['t'], .12, pan * .6)
# a soft breath of wind on each rise (S1→S2, S3→S4, S4→S5, S5→S6)
for a, b, gn in [('rise0', 'rise1', .05), ('crane0', 'crane1', .05), ('top0', 'top1', .035), ('hist0', 'hist1', .04)]:
    add(fx, lp(whoosh(C[b] - C[a] + .3, 1.0), 2400), C[a], gn, 0.0)
if 'card0' in C:
    d = .12; st = lp(rng.standard_normal(len(t_(d))), 700, 2) * env_exp(d, .02) + np.sin(2 * np.pi * 110 * t_(d)) * env_exp(d, .03) * .5
    add(fx, st / (np.abs(st).max() + 1e-9), C['card0'] + .02, .12, .25)
room = lp(rng.standard_normal(N), 380, 2) * .003
fx += np.stack([room, np.roll(room, 1301)], 1)

# ———————— score ————————
ev = []
B = .5
GO, P0, P1, CR0, CR1, VER, SET, TOP0, G0, G1, H0, W0, W1, STILL = (C[k] for k in ['go', 'pan0', 'pan1', 'crane0', 'crane1', 'verdict', 'settle', 'top0', 'gen0', 'gen1', 'hist0', 'walk0', 'walk1', 'still'])
DAYEND = C['dayEnd']
# S1 intro: hang D and G; the 14 nearest beans each get a kalimba note climbing the G pentatonic; vibraphone as Bolt wakes
ev += [(0.05, 'hang', 62, 2.2, .42, -.15, .7), (0.55, 'hang', 67, 1.8, .34, .15, .6)]
hw = next((e['t'] for e in EV if e['type'] == 'wake' and e.get('hero')), .75)
ev.append((hw, 'vibraphone', 74, 1.4, .42, .1, .55))
beans = sorted([e for e in EV if e['type'] == 'bean'], key=lambda e: -e['g'])[:14]
for i, e in enumerate(sorted(beans, key=lambda e: e['t'])):
    ev.append((e['t'], 'kalimba', PENTA[3 + i % 9], .8, .3 + .3 * e['g'], e['pan'] * .7, .55))
# S2 rules: marimba quarter-note arpeggio (G), bowed vibraphone swelling on the rise; a pizzicato pickup half a bar before the start
ev.append((C['rise0'], 'vibraphone_bowed', 74, 2.6, .4, .2, .38))
for i in range(int((GO - 6.0) / B)):
    t = 6.0 + i * B; ev.append((t, 'marimba', [67, 71, 74, 71][i % 4], .4, .36, .15, .5))
ev += [(GO - .5, 'cellos_pizz', 43, .4, .55, -.1, .8), (GO - .25, 'cellos_pizz', 47, .4, .55, -.1, .8)]
# 10.0 hard cut, the run starts: one woodblock + low pizzicato
ev += [(GO, 'woodblock', None, None, .7, 0, .4), (GO, 'cellos_pizz', 43, .8, .7, 0, .9)]
# S3 slow motion: the groove stops, only a low cello and bowed vibraphone (time slowing down), a step down as Bolt runs dry
ev += [(GO + .4, 'cellos', 43, P0 - GO, .32, -.1, .45), (GO + .6, 'vibraphone_bowed', 71, 2.6, .3, .2, .3), (12.9, 'vibraphone_bowed', 69, 2.4, .3, -.2, .3)]
# over to Moss, time speeds up: the groove returns at 15.6 (G · Em · C) until the day ends
PROG = [(15.6, [43, 59, 62, 67]), (17.6, [40, 59, 64, 67]), (19.6, [36, 60, 64, 67])]
for t0, (root, *ch) in PROG:
    for b in range(4):
        t = t0 + b * B
        if t >= DAYEND - .01: break
        if b in (0, 2): ev.append((t, 'cellos_pizz', root if b == 0 else root + 7, .5, .58, -.15, .9))
        ev.append((t + .25, 'marimba', ch[b % 3] + 12, .25, .42, .2, .55)); ev.append((t + .25, 'marimba', ch[(b + 1) % 3] + 12, .25, .37, -.2, .48))
ev.append((CR0, 'vibraphone_bowed', 74, 2.4, .36, .2, .34))
# verdict: one glockenspiel note per birth (pitch = its speed), one low woodblock per Pip gone; a G chord when it settles
for e in EV:
    if e['type'] == 'birth':
        k = int(np.clip((e['s'] - .3) / 1.6 * 9, 0, 9)); ev.append((e['t'], 'glockenspiel', PENTA[3 + k], .5, .22 + .3 * e['g'], e['pan'] * .8, .26))
    if e['type'] == 'gone': ev.append((e['t'] + .1, 'woodblock', None, None, .25 + .25 * max(e['g'], .2), e['pan'] * .8, .15))
for i, p in enumerate([55, 62, 67, 71, 74]): ev.append((SET + i * .035, 'harp', p, 2.4, .55, -.3 + i * .14, .6))
ev += [(SET, 'vibraphone', 71, 2.4, .4, 0, .42), (SET, 'cellos_pizz', 43, 1.0, .55, 0, .7)]
# S5 20 generations: pizzicato eighths + marimba sixteenth arpeggios (G · Em · C · D); one kalimba note per generation, pitch = that generation's mean speed (falling)
LOOP = [(43, [67, 71, 74]), (40, [64, 67, 71]), (36, [64, 67, 72]), (38, [66, 69, 74])]
t = TOP0 + .5; i = 0
while t < W1 - .01:
    root, ch = LOOP[int((t - TOP0 - .5) // 2) % 4]
    if (i % 2) == 0: ev.append((t, 'cellos_pizz', root + (7 if i % 4 == 2 else 0), .3, .5, -.15, .75))
    if t < H0: ev.append((t, 'marimba', ch[i % 3] + (12 if i % 6 >= 3 else 0), .2, .3 + .05 * (i % 2 == 0), .2, .42))
    t += .25; i += 1
for e in EV:
    if e['type'] == 'gen':
        k = int(np.clip(round((e['mean'] - .65) / .6 * 8), 0, 8)); ev.append((e['t'], 'kalimba', PENTA[2 + k] + 12, .5, .5, .3, .5))
# S6 into the histogram: a soft xylophone note per Pip landing (pitch = its speed, at most one per 40 ms); a big G chord when all are in, ringing to the end
last = -1
for e in sorted([e for e in EV if e['type'] == 'slot'], key=lambda e: e['t']):
    if e['t'] - last < .04: continue
    last = e['t']; k = int(np.clip((e['s'] - .3) / 1.6 * 9, 0, 9)); ev.append((e['t'], 'xylophone', PENTA[3 + k], .2, .25, e['pan'] * .6, .16))
FIN = W1 + .1
for i, p in enumerate([43, 55, 62, 67, 71, 74, 79]): ev.append((FIN + i * .04, 'harp', p, 4.0, .62, -.3 + i * .1, .7))
ev += [(FIN, 'vibraphone', 71, 4.5, .45, 0, .5), (FIN, 'vibraphone', 74, 4.5, .4, .1, .45), (FIN, 'cellos_pizz', 31 + 12, 1.0, .65, 0, .8), (FIN, 'vibraphone_bowed', 67, 5.5, .32, -.1, .4),
       (FIN + 2.0, 'hang', 62, 3.0, .3, -.2, .45), (FIN + 4.0, 'hang', 67, 3.0, .26, .2, .4)]
# end card printed on the board (48.9–49.4): a soft stamp, then a hang + harp + glockenspiel tail that rings out naturally
CARD = C.get('card0')
if CARD is not None:
    ev += [(CARD, 'hang', 62, 3.0, .3, 0, .5), (CARD + .04, 'harp', 67, 3.0, .42, -.15, .45), (CARD + .3, 'glockenspiel', 79, 2.5, .28, .2, .25), (CARD + .3, 'vibraphone', 71, 2.6, .3, .1, .35)]
S.seed(13)
music = S.render(ev, dur=DUR + 3, master=False)[:N]
# synthesized shaker: sixteenths in the groove sections
sh = np.zeros(N)
def shaker(a, b, gain):
    for j in range(int((b - a) / .125)):
        t = a + j * .125; d = .06; x = hp(rng.standard_normal(len(t_(d))), 5000, 2) * env_exp(d, .012) * (1.0 if j % 4 == 0 else .55) * gain
        i0 = int(t * SR); sh[i0:i0 + len(x)] += x[:N - i0]
shaker(15.6, DAYEND, 1.0); shaker(TOP0 + .5, H0 + 1.0, 1.0)
music += np.stack([sh * .018, np.roll(sh, 240) * .018], 1)
music = S.room(music, size=.34, mix=.17)
# make room for the voice: 300 Hz–4 kHz down about 5 dB
music = music - .44 * np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)

# ———————— narration: compressed, about 10 dB above the bed by RMS; the bed ducks under it ————————
vo = np.zeros((N, 2)); duck = np.zeros(N)
for e in [e for e in EV if e['type'] == 'vo']:
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = hp(x, 90, 2); x = compress(x / (np.abs(x).max() + 1e-9) * .8, thr=.25, ratio=3.0)
    add(vo, x, e['t'], 1.0, 0.0)
    i0 = int(e['t'] * SR); duck[max(0, i0 - int(.15 * SR)):min(N, i0 + len(x) + int(.25 * SR))] = 1
k = int(.12 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
rms = lambda a: np.sqrt(np.mean(a[np.abs(a).sum(1) > 1e-4] ** 2)) if np.any(np.abs(a).sum(1) > 1e-4) else 1e-9
bed = fx + music * .8
bed_rms = rms(bed[duck < .5]) if np.any(duck < .5) else rms(bed)
vo *= (bed_rms * 10 ** (10 / 20)) / rms(vo)      # voice RMS ≈ bed + 10 dB
bed *= (1 - .45 * duck)[:, None]                 # bed down about 5 dB under the voice
mix = bed + vo
mix = np.stack([compress(mix[:, 0], thr=.35, ratio=2.2), compress(mix[:, 1], thr=.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
k = int(.4 * SR); mix[-k:] *= np.linspace(1, 0, k)[:, None] ** 1.5
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sf.write(OUT, mix.astype(np.float32), SR)
used = ['hang', 'vibraphone', 'vibraphone_bowed', 'kalimba', 'cellos_pizz', 'cellos', 'marimba', 'glockenspiel', 'woodblock', 'harp', 'xylophone']
cr = S.credits(used); open(os.path.join(os.path.dirname(OUT), 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'vo/bed gain', round(float(bed_rms), 4))
