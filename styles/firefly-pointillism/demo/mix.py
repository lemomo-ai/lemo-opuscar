#!/usr/bin/env python3
"""《你亮，我就亮》Shine Back, sound: score (real instrument samples) + ambience (crickets, wind, rain) + foley + English narration → out/mix.wav (48 kHz stereo).
Every time point comes from timeline.py (the same one the picture uses).

  python mix.py                 # the whole film, 0–50.6 s
  python mix.py 0 10            # one range only: the sound fades out over its last 0.5 s
"""
import os, sys, math, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, LIB); sys.path.insert(0, HERE)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, whoosh
import timeline as TL
from timeline import *            # noqa: F401,F403

A0 = float(sys.argv[1]) if len(sys.argv) > 2 else 0.0
A1 = float(sys.argv[2]) if len(sys.argv) > 2 else TL.DUR
DUR = TL.DUR; N = int(round(DUR * SR)); tt = np.arange(N) / SR
rng = np.random.default_rng(1031)
rms = lambda x: float(np.sqrt(np.mean(np.square(x)) + 1e-12))
db = lambda x: 20 * np.log10(x + 1e-12)
def env(pts):                     # piecewise-linear envelope [(t, v), …]
    a = np.array(pts, float); return np.interp(tt, a[:, 0], a[:, 1])
def smooth(x, sec):
    k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, 'same')
def st(x, pan=0.0):
    th = (pan + 1) * math.pi / 4; return np.stack([x * math.cos(th), x * math.sin(th)], 1)


# ======================================================================= score
S.seed(31)
ev = []
def E(t, inst, p, d, v, pan=0.0, g=1.0, **kw):
    if kw: ev.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g, **kw))
    else: ev.append((t, inst, p, d, v, pan, g))
def chord(t, inst, ps, d, v, pan0=-.3, step=.0, g=1.0, **kw):
    for i, p in enumerate(ps): E(t + step * i, inst, p, d, v, pan0 + .6 * i / max(1, len(ps) - 1), g, **kw)
def pad(t, d, notes, v=.3, g=.7, att=.4):
    insts = ['contrabass', 'cellos', 'violas', 'violins', 'violins']
    for inst, p in zip(insts[5 - len(notes):] if len(notes) < 5 else insts, notes):
        E(t, inst, p, d, v, {'contrabass': 0, 'cellos': -.3, 'violas': .05, 'violins': .3}[inst], g, attack=att)
def question(t, v=.36, pan=0.0):                 # question: two notes going up
    E(t, 'glockenspiel', 'E6', .9, v, pan, .7); E(t + .5, 'glockenspiel', 'A6', 1.2, v + .04, pan, .7)
def answer(t, v=.4, pan=0.0, inst='hand_chimes'):  # answer: falls to the tonic
    E(t, inst, 'A6' if inst == 'glockenspiel' else 'A5', 1.4, v, pan, .7)
    E(t + .22, inst, 'F#6' if inst == 'glockenspiel' else 'F#5', 1.4, v, pan, .7)
    E(t + .44, inst, 'D6' if inst == 'glockenspiel' else 'D5', 2.2, v + .04, pan, .75)

# ---- 0 the stream of light sweeps in: rising harp glissando + glockenspiel sparks
gl = ['D3', 'E3', 'F#3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5']
for i, p in enumerate(gl): E(.02 + .9 * (i / len(gl)) ** .8, 'harp', p, .9, .40 + .025 * i, -.5 + i / len(gl), .9)
for t, p, pan in [(.3, 'A6', .4), (.55, 'F#6', -.2), (.8, 'D7', .3), (1.05, 'E6', -.3), (1.3, 'B6', .2)]: E(t, 'glockenspiel', p, .7, .22, pan, .55)
# ---- 1.6 settles: harp D chord + string pad
chord(T_LAND, 'harp', ['D2', 'A2', 'D3', 'F#3', 'A3', 'E4'], 2.4, .55, step=.03)
pad(T_LAND, 3.9, ['D2', 'D3', 'A3', 'F#4'], .3, .65, .5)
# ---- the guiding firefly drifts down: falling vibraphone; lands on the fingertip
for t, p in [(1.9, 'A5'), (2.35, 'F#5'), (2.75, 'E5')]: E(t, 'vibraphone', p, 1.0, .3, .35, .65)
E(T_CATCH, 'hand_chimes', 'A5', 2.0, .5, .3, .85); E(T_CATCH, 'glass', 'D6', 1.6, .38, .25, .6)
# ---- two blinks at the fingertip = the question
question(T_Q1 - .0, .34, .3)
# ---- ripple: the whole meadow blinks back again and again = the answer (fast harp arpeggios sweep across the stereo field)
pad(5.5, 3.0, ['G2', 'G3', 'D4', 'B4'], .28, .6, .6)
for i, p in enumerate(['D4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6']): E(T_RIP + .05 * i, 'harp', p, 1.1, .36, -.7 + .15 * i, .8)
answer(T_RIP + .1, .34, .1)
E(7.4, 'sus_cymbal', 'cresc', None, .42, .1, .4)
# ---- the whole field at the same instant
chord(T_ALL, 'hand_chimes', ['D5', 'F#5', 'A5', 'E6'], 2.0, .45, step=.0, g=.75)
chord(T_ALL, 'harp', ['D3', 'A3', 'D4', 'F#4'], 1.6, .5)
E(T_ALL, 'glockenspiel', 'D7', 1.0, .3, .3, .5)
# ---- rising, the deer gathers: Bm → G accelerating arpeggios + suspended cymbal + strings
arp = ['B2', 'F#3', 'B3', 'D4', 'F#4', 'B4', 'D5', 'G3', 'D4', 'G4', 'B4', 'D5', 'G5', 'B5']
tq = T_RISE
for i, p in enumerate(arp):
    E(tq, 'harp', p, .9, .34 + .03 * i, -.6 + 1.2 * (i % 5) / 4, .85); tq += .085 * (1 - i / len(arp) * .5)
E(T_RISE, 'violins_trem', 'F#5', T_DEER - T_RISE, .28, .3, .5, attack=.5)
E(T_RISE, 'cellos', 'B2', .5, .36, -.3, .8, attack=.1); E(T_RISE + .5, 'cellos', 'G2', .5, .42, -.3, .85, attack=.08)
E(T_RISE + .05, 'sus_cymbal', 'cresc', None, .5, .1, .5)
# ---- the deer fully formed: Gmaj7(#11)
chord(T_DEER, 'hand_chimes', ['G4', 'B4', 'D5', 'F#5'], 2.4, .45, step=.02, g=.7)
E(T_DEER, 'timpani', 'G2', 1.5, .45, 0, .8); E(T_DEER, 'harp', 'G2', 2.0, .6, -.2); E(T_DEER, 'harp', 'G3', 2.0, .5, .2)
pad(T_DEER, 1.25, ['G2', 'D4', 'F#4', 'C#5'], .32, .65, .08)
# ---- the touch
E(T_TOUCH, 'glass', 'F#6', 1.8, .45, .1, .7); E(T_TOUCH, 'hand_chimes', 'D6', 2.0, .4, -.1, .6); E(T_TOUCH, 'vibraphone', 'A5', 1.2, .25, .2, .5)
pad(T_TOUCH - .3, 1.9, ['D2', 'D3', 'A3', 'F#4', 'E5'], .27, .55, .6)
# ---- onto the deer's back
for i, p in enumerate(['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6']): E(T_HOP + .06 * i, 'glockenspiel', p, .8, .26 + .02 * i, -.3 + .1 * i, .6)
chord(T_HOPLAND, 'harp', ['A2', 'E3', 'A3', 'C#4'], 2.0, .5); E(T_HOPLAND, 'hand_chimes', 'C#6', 1.8, .36, .3, .6)
# ---- setting off: a light walking bass (pizzicato), harp eighth notes
B8 = .3125
for k in range(int((T_GUST - T_WALK) / (2 * B8))):
    t = T_WALK + 2 * B8 * k
    E(t, 'cellos_pizz', ['D2', 'A2', 'B2', 'A2'][k % 4], .5, .42, -.2, .75)
    E(t + B8, 'harp', ['F#4', 'A4', 'D5', 'A4'][k % 4], .6, .3, .25, .6)
pad(T_WALK, T_GUST - T_WALK + .3, ['D3', 'A3', 'F#4'], .24, .5, .5)
# ---- the wind changes the scene → wide shot
E(T_GUST, 'violins_trem', 'A5', 1.0, .3, .3, .55, attack=.5); E(T_GUST + .05, 'sus_cymbal', 'roll', None, .42, -.1, .42)
for i, p in enumerate(['A6', 'F#6', 'E6', 'D6', 'B5', 'A5', 'F#5']): E(T_GUST + .1 + .085 * i, 'glockenspiel', p, .6, .2, .6 - .2 * i, .5)
chord(T_FAR, 'harp', ['B1', 'F#2', 'B2', 'D3', 'F#3', 'B3', 'D4'], 2.4, .52, step=.03)
# wide shot: flute melody (the journey theme), broken harp chords
MEL = [(16.05, 'F#5', .9), (17.0, 'E5', .45), (17.45, 'D5', .45), (17.95, 'E5', .9), (18.95, 'A5', .6), (19.6, 'B5', 1.1), (20.75, 'A5', .5)]
for t, p, d in MEL: E(t, 'flute', p, d, .38, .15, .72, attack=.06)
PROG = [(16.0, ['B2', 'F#3', 'B3', 'D4']), (17.25, ['G2', 'D3', 'G3', 'B3']), (18.5, ['D2', 'A2', 'D3', 'F#3']), (19.75, ['A2', 'E3', 'A3', 'C#4'])]
for t0, ns in PROG:
    for k in range(4):
        E(t0 + k * B8, 'harp', ns[k], .9, .3, -.3 + .2 * k, .62)
    E(t0, 'cellos', ns[0] if ns[0][-1] != '1' else 'B2', 1.25, .3, -.3, .6, attack=.3)
pad(16.0, 4.3, ['B2', 'F#3', 'D4'], .22, .45, .8)
# ---- the weather turns: B minor, low string tremolo, timpani roll
E(T_CLOUD, 'cellos', 'B2', 2.4, .32, -.3, .7, attack=.6)
E(T_CLOUD, 'contrabass', 'B1', 6.0, .30, 0, .7, attack=1.0)
E(T_CLOUD + .4, 'violas', 'F#3', 2.0, .26, .1, .5, attack=.8)
E(T_PUSH - .2, 'sus_cymbal', 'roll', None, .38, .2, .4)
E(T_MED, 'cellos', 'G2', 2.4, .36, -.3, .75, attack=.3)
E(T_MED, 'violins_trem', 'B4', 2.4, .26, .3, .5, attack=.6)
E(T_MED + 1.2, 'violins_trem', 'C5', 1.2, .28, .3, .5, attack=.3)
E(24.1, 'timpani', 'F#2', 1.2, .42, 0, .8)
E(24.2, 'cellos', 'F#2', 1.0, .4, -.3, .8, attack=.2)
E(24.25, 'violins_trem', 'C#5', 1.0, .32, .3, .55, attack=.2)
# ---- torn apart: fast falling glockenspiel + suspended-cymbal roll → silence
for i, p in enumerate(['D7', 'B6', 'A6', 'F#6', 'E6', 'D6', 'B5', 'A5', 'F#5', 'E5']): E(T_TEAR + .05 + .07 * i, 'glockenspiel', p, .7, .26 - .012 * i, .4 - .09 * i, .55)
E(T_TEAR - .3, 'sus_cymbal', 'cresc', None, .45, -.1, .42)
E(T_TEAR + .05, 'contrabass', 'B1', 1.4, .32, 0, .7, attack=.05)
# ---- the last one: a single glass-harmonica note (the first sound after the silence)
E(T_LEADBACK + .05, 'glass', 'B5', 2.4, .36, .1, .7)
E(T_LEADIN, 'hand_chimes', 'D6', 2.0, .32, .1, .6)
pad(T_STAND0, T_ASK - .25 - T_STAND0, ['D3', 'A3', 'D4', 'F#4'], .2, .5, 1.6)
E(T_RAISE0, 'vibraphone_bowed', 'A4', T_ASK - .3 - T_RAISE0, .26, -.2, .5, attack=.8)
# ---- the question
question(T_ASK - .5, .42, .05)
E(T_ASK, 'hand_chimes', 'A5', 2.2, .45, .05, .7)
# ---- half a beat of silence → one distant answer → five → everything
E(T_ANS1, 'glockenspiel', 'F#6', 1.4, .30, .55, .6); E(T_ANS1 + .85, 'glockenspiel', 'F#6', 1.4, .24, .55, .5)
for k, p in enumerate(['A6', 'D7', 'E6', 'B6', 'F#6']): E(T_ANS2 + (.0, .07, .13, .2, .27)[k], 'glockenspiel', p, 1.0, .22, .2 + .12 * k, .5)
gl2 = ['D3', 'F#3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6']
for i, p in enumerate(gl2): E(T_SYNC + .9 * (i / len(gl2)) ** 1.1, 'harp', p, 1.2, .38 + .02 * i, .6 - 1.2 * i / len(gl2), .85)
answer(T_SYNC + .15, .4, -.1)
pad(T_SYNC, 2.8, ['D2', 'D3', 'A3', 'F#4', 'A4'], .3, .7, .5)
E(T_SYNC, 'timpani', 'D3', 1.2, .3, 0, .6)
for P in SYNC_PULSES:
    chord(P, 'hand_chimes', ['D5', 'A5'] if P < T_GIANT else ['F#5', 'D6'], 1.4, .3, step=.0, g=.55)
# ---- the embers swirl, the giant deer forms: D major tutti
tq = T_GIANT0
arp2 = ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'G3', 'D4', 'G4', 'B4', 'D5', 'G5', 'A3', 'E4', 'A4', 'C#5', 'E5', 'A5']
for i, p in enumerate(arp2):
    E(tq, 'harp', p, .9, .34 + .02 * i, -.6 + 1.2 * (i % 6) / 5, .85); tq += .09 * (1 - i / len(arp2) * .45)
E(T_GIANT0, 'sus_cymbal', 'cresc', None, .55, .0, .55)
E(T_GIANT0 + .3, 'timpani', 'A2', .4, .25, 0, .5)
E(T_GIANT0, 'violins_trem', 'A5', T_GIANT - T_GIANT0, .3, .3, .55, attack=.6)
E(T_GIANT0, 'cellos', 'A2', T_GIANT - T_GIANT0, .36, -.3, .7, attack=.5)
chord(T_GIANT, 'hand_chimes', ['D5', 'F#5', 'A5', 'E6'], 3.0, .5, step=.02, g=.75)
chord(T_GIANT, 'harp', ['D2', 'A2', 'D3', 'F#3', 'A3', 'E4', 'F#4'], 3.0, .62, step=.03)
E(T_GIANT, 'timpani', 'D3', 2.0, .55, 0, .9); E(T_GIANT, 'glockenspiel', 'D7', 1.4, .32, .35, .55)
E(T_GIANT, 'horn', 'A3', 2.4, .34, -.15, .55, attack=.15); E(T_GIANT, 'horn', 'D4', 2.4, .32, .15, .5, attack=.15)
pad(T_GIANT, 2.9, ['D1' if False else 'D2', 'D3', 'A3', 'F#4', 'E5'], .4, .8, .1)
# ---- the touch (rhymes with the one at 11 s)
E(T_TOUCH2, 'glass', 'F#6', 2.0, .45, .1, .75); E(T_TOUCH2, 'hand_chimes', 'D6', 2.2, .42, -.1, .65); E(T_TOUCH2, 'vibraphone', 'A5', 1.4, .28, .2, .5)
pad(T_TOUCH2 - .2, 1.6, ['G2', 'D3', 'B3', 'G4'], .3, .6, .4)
# ---- the leap into the sky
gl3 = ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6']
for i, p in enumerate(gl3): E(T_LEAP + .9 * (i / len(gl3)) ** 1.2, 'harp', p, .9, .34 + .02 * i, -.5 + i / len(gl3), .85)
E(T_LEAP, 'sus_cymbal', 'cresc', None, .42, .1, .45)
chord(T_HILL, 'harp', ['D2', 'A2', 'D3', 'F#3', 'A3'], 2.6, .5, step=.03)
pad(T_HILL, 4.2, ['D2', 'D3', 'A3', 'F#4'], .24, .55, .8)
question(T_GBLINK - .5, .32, -.25)
# the flute finishes the journey theme
MEL2 = [(43.4, 'F#5', .8), (44.25, 'E5', .4), (44.65, 'D5', .4)]
for t, p, d in MEL2: E(t, 'flute', p, d, .34, .15, .65, attack=.06)
answer(T_DBLINK, .44, .35)
E(T_DBLINK, 'harp', 'D3', 2.0, .4, -.2, .7)
# ---- title: big harp glissando → D add9 tutti, let ring to a natural end
gl4 = ['G3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'D6']
for i, p in enumerate(gl4): E(T_TITLE0 + .1 + .7 * (i / len(gl4)) ** 1.25, 'harp', p, .9, .32 + .02 * i, -.5 + i / len(gl4), .8)
E(T_TITLE0 + .1, 'sus_cymbal', 'cresc', None, .42, .1, .4)
chord(T_TITLE, 'harp', ['D2', 'A2', 'D3', 'F#3', 'A3', 'E4', 'F#4', 'A4'], 3.5, .56, step=.035)
chord(T_TITLE, 'hand_chimes', ['D5', 'F#5', 'A5', 'E6'], 3.5, .4, step=.02, g=.7)
E(T_TITLE, 'timpani', 'D3', 2.0, .34, 0, .7)
pad(T_TITLE, 3.1, ['D2', 'D3', 'A3', 'F#4', 'E5'], .32, .7, .1)
E(T_TITLE + .02, 'flute', 'A5', 2.4, .34, .15, .7, attack=.1)
E(T_CRED, 'glockenspiel', 'D7', 1.6, .24, .35, .5)

# hooves: pizzicato while walking on the meadow (footfalls computed from the gait phase)
import film as F
def footfalls(fn, t0, t1, offs=(.25, .75, .75, .25)):
    out = []; prev = None
    for t in np.arange(t0, t1, .002):
        p, x = fn(t); ph = p['ph']; cur = [((ph + o) % 1.0) for o in offs]
        if prev is not None and p['amt'] > .3:
            for k in range(4):
                if cur[k] < prev[k] - .5: out.append((float(t), k))
        prev = cur
    return out
steps = footfalls(F.deer_pose_A, 9.9, T_GUST)
for t, k in steps: E(t, 'violins_pizz', ['D5', 'A4', 'F#5', 'A5'][k], .3, .2, -.2 + .13 * k, .42)
stepsM = footfalls(F.deer_pose_M, T_MED, T_TEAR)
for t, k in stepsM: E(t, 'cellos_pizz', ['D2', 'A2', 'D2', 'A2'][k], .3, .25, -.1 + .1 * k, .35)

music = S.render(ev, dur=DUR + 3, master=False)[:N]
music = S.room(music, size=.6, mix=.24)

# ======================================================================= ambience + foley
amb = np.zeros((N, 2))
# crickets: short pulse trains at 4.3–5.2 kHz, each with its own rhythm and pan; present in the meadow, gone in the storm, back one by one after the answer
def cricket(f0, rate, pan, seed, on):
    r = np.random.default_rng(seed); x = np.zeros(N)
    t = r.uniform(0, 1 / rate)
    while t < DUR:
        for j in range(r.integers(3, 6)):
            i = int((t + j * .032) * SR); n = int(.018 * SR)
            if i + n >= N: break
            k = np.arange(n) / SR; x[i:i + n] += np.sin(2 * np.pi * f0 * k) * np.sin(np.pi * k / .018) ** 2
        t += 1 / rate * (.85 + .3 * r.random())
    return st(x * on, pan)
CR = [(4400, 1.3, -.7, 1), (4900, 1.1, .6, 2), (4650, 1.6, -.2, 3), (5100, .9, .35, 4), (4300, 1.45, .8, 5)]
for k, (f0, rt, pn, sd) in enumerate(CR):
    back = T_SYNC + .4 + .9 * k
    on = env([(0, 0), (1.4, 0), (2.2, 1), (T_CLOUD, 1), (T_CLOUD + 1.2, 0), (back, 0), (back + .8, 1), (DUR, 1)])
    amb += cricket(f0, rt, pn, sd, on) * .010
# wind: a breeze in the wide shot, a gale in the storm (gusting), loudest at the tearing apart
wn = rng.standard_normal(N)
gusty = .6 + .4 * np.sin(2 * np.pi * .37 * tt) * np.sin(2 * np.pi * .13 * tt + 1)
wind = bp(wn, 180, 1400) * env([(0, 0), (T_GUST - .2, 0), (T_GUST + .3, .35), (T_FAR + .5, .12), (T_CLOUD, .15), (T_PUSH, .7), (T_TEAR, .8), (T_TEAR + .6, 1.0),
                                  (T_DRY, .25), (T_DRY + 1.6, .05), (T_LEADBACK, 0), (DUR, 0)]) * gusty
amb += np.stack([wind, np.roll(wind, 1301)], 1) * .05
# rain: high-frequency hiss + random drops (J-cut: comes in 0.3 s before the rain on screen)
rain_on = env([(0, 0), (T_RAIN - .35, 0), (T_RAIN + .8, .7), (T_MED, 1.0), (T_TEAR, 1.0), (T_DRY - .3, .8), (T_DRY + .2, 0), (DUR, 0)])
rn = hp(rng.standard_normal(N), 2500) * .5 + bp(rng.standard_normal(N), 700, 2500) * .3
drops = np.zeros(N); idx = rng.integers(0, N - 400, 9000); amp = rng.random(9000) ** 3
for i, a in zip(idx, amp): drops[i:i + 200] += a * np.exp(-np.arange(200) / 30) * np.sin(np.arange(200) * (.6 + a))
rain = (rn + hp(drops, 1500) * .8) * rain_on
amb += np.stack([rain, np.roll(rain, 2203)], 1) * .045
# foley: the air of the streams of light
fx = np.zeros((N, 2))
def air(at, d, g, pan=0.0, f=4000):
    add(fx, lp(whoosh(d, 1.0), f), at, g, pan)
air(0.0, 1.0, .45, -.4)                 # the stream of light sweeps in
air(T_RISE - .1, 1.2, .3, -.3)          # swirling into the deer
air(T_HOP - .02, .45, .25, .2)          # onto the deer's back
air(T_GUST - .05, 1.1, .55, .0)         # the wind changes the scene
air(T_PUSH - .1, 1.0, .45, .4, 2500)    # pushed closer by the wind
air(T_TEAR - .05, 1.6, .7, .5, 2500)    # torn apart
air(T_FALL, .5, .2, .0, 2000)           # the fall
air(T_GIANT0, 1.6, .35, -.4)            # the embers swirl
air(T_LEAP - .05, 1.3, .5, .0)          # the leap into the sky
air(T_TITLE0, .9, .25, -.3)             # the trail rises

# ======================================================================= narration
TLJ = json.load(open(os.path.join(HERE, 'timeline.json')))
vo = np.zeros(N); vmask = np.zeros(N)
for L in TLJ['lines']:
    x, sr = sf.read(os.path.join(HERE, 'vo', 'wav', L['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    i = int(L['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]; vmask[i:i + n] = 1
vo = hp(vo, 90)
vo = compress(vo / (np.abs(vo).max() + 1e-9) * .9, thr=.22, ratio=3.0, att=.003, rel=.12)
duck = smooth(np.maximum(vmask, np.roll(vmask, int(.12 * SR))), .2)

# ======================================================================= mix
bed = music + (amb + fx) * (1 - .55 * duck)[:, None]   # wind and rain step back under speech (the storm is the most likely to mask the voice)
carve = np.stack([bp(bed[:, 0], 300, 4000), bp(bed[:, 1], 300, 4000)], 1)
bed = bed - .55 * carve * duck[:, None]                 # under speech, make room at 300 Hz–4 kHz (about −7 dB)
bed = bed * (1 - .35 * duck)[:, None]
spk = vmask > 0
vg = rms(bed[spk].mean(1)) * 10 ** (11 / 20) / rms(vo[spk])
mix = bed + st(vo * vg, 0)
print(f'voice vs bed (RMS while speaking): {db(rms(vo[spk]) * vg) - db(rms(bed[spk].mean(1))):.1f} dB')
# low-frequency check
from scipy.signal import welch
f_, P = welch(mix.mean(1), SR, nperseg=8192)
lo = P[(f_ > 20) & (f_ < 120)].mean(); mid = P[(f_ > 120) & (f_ < 8000)].mean()
print(f'20–120 Hz vs 120–8k (mean PSD): {10 * np.log10(lo / mid):.1f} dB')
mix = np.stack([limit(compress(mix[:, c], thr=.4, ratio=2.0)) for c in (0, 1)], 1)
mix *= np.clip((DUR - tt) / .6, 0, 1)[:, None]        # the chord decays naturally; the last 0.6 s fade to clean silence

i0, i1 = int(A0 * SR), int(A1 * SR); out = mix[i0:i1].copy()
if A1 < DUR - .01:
    n = len(out); out *= np.clip((A1 - A0 - np.arange(n) / SR) / .5, 0, 1)[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
name = 'mix.wav' if (A0, A1) == (0.0, TL.DUR) else 'mix_%g-%g.wav' % (A0, A1)
sf.write(os.path.join(HERE, 'out', name), out.astype(np.float32), SR)
print('wrote out/' + name, 'events', len(ev))
used = sorted({(e[1] if isinstance(e, tuple) else e['inst']) for e in ev})
cr = S.credits(used); open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
