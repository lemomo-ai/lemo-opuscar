"""Why We Have Seasons (为什么会有四季) · Textbook Doodle demo · original score from timeline.json. Run from the library root:
   .venv/bin/python styles/textbook-doodle/demo/tools/score.py  → styles/textbook-doodle/demo/out/mix.wav
F major, 120 BPM (one bar = 2 s). A classroom band: pizzicato strings, clarinet, xylophone, glockenspiel, a small kit;
a trombone for the wrong answer, sleigh bells for the Australian Christmas. Pen and highlighter foley from noise (sfx.py).
The music follows the lesson: a question → a wrong answer → the orbit groove → the flashlight melody → the build → the answer.
Written on the 30 s grid of timeline.json; the reading holds there are inserted at the end: every event after a hold point
moves later, and the gap is filled with the groove (pizzicato, kit, hook, string pad) of the two seconds before it."""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(HERE))))   # styles/<slug>/demo -> library root
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, add, limit

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); C = TL['cues']; HOLDS = TL['holds']
warp = lambda t: t + sum(d for p, d in HOLDS if t >= p)
DUR = warp(TL['grid']) + TL['tail']
BAR, B8 = 2.0, .25                       # one bar, one eighth note
S.seed(11)
ev = []
GROOVE = False                           # True while the groove helpers write: those notes are repeated to fill the holds
def n(t, inst, p, d, v, pan=0, g=1.0): ev.append((t, inst, p, d, v, pan, g, GROOVE))
def groove(f):
    def w(*a, **k):
        global GROOVE
        GROOVE = True
        try: f(*a, **k)
        finally: GROOVE = False
    return w

CH = {'F': ['F3', 'A3', 'C4'], 'Dm': ['D3', 'F3', 'A3'], 'Bb': ['Bb2', 'D3', 'F3'], 'C': ['C3', 'E3', 'G3'], 'Gm': ['G2', 'Bb2', 'D3']}
PROG = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'C', 'F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'F']   # bars 0–14
ARP = {'F': ['F4', 'C5', 'A4', 'C5', 'F5', 'C5', 'A4', 'C5'], 'Dm': ['D4', 'A4', 'F4', 'A4', 'D5', 'A4', 'F4', 'A4'],
       'Bb': ['Bb3', 'F4', 'D4', 'F4', 'Bb4', 'F4', 'D4', 'F4'], 'C': ['C4', 'G4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4']}
ROOT = {'F': 'F2', 'Dm': 'D2', 'Bb': 'Bb1', 'C': 'C2'}
up = lambda p, k: S.name(S.midi(p) + k)

@groove
def pizz_bar(b, ch, v=.55, half=False):           # pizzicato eighth-note arpeggio + pizzicato bass
    t0 = b * BAR
    for i, p in enumerate(ARP[ch][:4 if half else 8]): n(t0 + i * B8, 'violins_pizz', p, .3, v * (1 if i % 2 == 0 else .8), .25)
    for i in (0, 4): n(t0 + i * B8, 'cellos_pizz', ROOT[ch], .5, v + .1, -.2)
    n(t0 + 6 * B8, 'cellos_pizz', up(ROOT[ch], 12), .4, v - .1, -.2)

@groove
def kit_bar(b, snare=True, fill=False, v=1.0):
    t0 = b * BAR
    for i in range(8): n(t0 + i * B8, 'drum_kit', 'hi_hat_closed', .2, (.38 if i % 2 else .5) * v, .3)
    for i in (0, 3, 4): n(t0 + i * B8, 'drum_kit', 'kick_drum_left', .4, (.85 if i != 3 else .6) * v, 0)
    if snare: [n(t0 + i * B8, 'drum_kit', 'snare_1', .4, .7 * v, -.05) for i in (2, 6)]
    if fill: [n(t0 + (6 + k * .5) * B8, 'drum_kit', 'snare_2', .2, .5 + .1 * k, -.05) for k in range(4)]

# the orbit hook (xylophone + clarinet an octave below), an A phrase and a B phrase
HOOK_A = [('A5', 0, 1), ('G5', 1, 1), ('F5', 2, 1), ('C5', 3, 1), ('D5', 4, 2), ('F5', 6, 1), ('G5', 7, 1)]
HOOK_B = [('A5', 0, 1), ('C6', 1, 1), ('Bb5', 2, 1), ('A5', 3, 1), ('G5', 4, 3), ('E5', 7, 1)]
@groove
def hook(b, H, v=.55):
    for p, i, l in H: n(b * BAR + i * B8, 'xylophone', p, l * B8, v, .15); n(b * BAR + i * B8, 'clarinet_stac', up(p, -12), l * B8 * .8, v * .5, -.25)

# ── 0–4 a question: pizzicato + the clarinet asks (stops on G, unanswered); 2.0 the student confidently writes the wrong answer
pizz_bar(0, 'F', .45); pizz_bar(1, 'C', .5)
for p, k, d in [('C5', 0, .2), ('F5', .25, .2), ('A5', .5, .2), ('G5', .75, 1.0)]: n(C['q'] + k, 'clarinet', p, d, .55, -.2)
for p, k, d in [('A5', 0, .2), ('C6', .25, .2), ('F6', .5, .5)]: n(C['wrong'] + .5 + k, 'xylophone', p, d, .55, .2)   # 「离太阳近」: a confident run up
# ── 4 the red cross: trombone 'wah-wah-wah' sliding down, the band stops
n(C['cross'], 'drum_kit', 'snare_1', .3, .8, 0)
for i, p in enumerate(['D3', 'Db3', 'C3', 'B2']): n(C['cross'] + .05 + i * .22, 'trombone_stac', p, .2 if i < 3 else .6, .85, 0, 1.3)
# ── 5 「1月最近，却是冬天！」: one glockenspiel note, pizzicato stops on Dm
n(C['near'], 'glockenspiel', 'E6', .8, .6, .3); n(C['near'], 'cellos_pizz', 'D2', .6, .7, -.2); n(C['near'] + .25, 'xylophone', 'D5', .3, .5, .2)
n(C['near'] + .5, 'violins_pizz', 'A4', .3, .45, .25); n(C['near'] + .75, 'violins_pizz', 'D5', .3, .45, .25)
# ── 6–16 the Earth is drawn and carried round the sun: a light kit enters, one glockenspiel note per station (climbing), 14.5 red parallel lines
pizz_bar(3, 'Bb', .5)
n(C['earth'], 'harp', 'F4', 1, .45, .1); n(C['earth'] + .12, 'harp', 'A4', 1, .45, .1); n(C['earth'] + .24, 'harp', 'C5', 1, .45, .1)
for b in range(4, 8):
    pizz_bar(b, PROG[b], .52); kit_bar(b, snare=b >= 6, fill=(b == 7), v=.85); hook(b, HOOK_A if b % 2 == 0 else HOOK_B)
for i, k in enumerate(C['stations']): n(k, 'glockenspiel', ['C6', 'D6', 'F6', 'C7'][i], 1.0, .6, .35); n(k, 'drum_kit', 'crash_left' if i == 3 else 'ride_bell_left', 1, .35, -.3)
for j, p in enumerate(['F5', 'A5', 'C6', 'F6']): n(C['axis'] + j * .08, 'glockenspiel', p, .6, .5, .3)
n(C['axis'], 'drum_kit', 'snare_1', .3, .75, 0)
# ── 16–22 the flashlight: the clarinet sings, the switch is a woodblock click; the hero sweats in the hot spot, shivers in the cold one
for b in range(8, 11): pizz_bar(b, PROG[b], .5); kit_bar(b, snare=True, v=.75)
MEL = [('C5', 16.0, .5), ('F5', 16.5, .5), ('A5', 17.0, .75), ('G5', 17.75, .25), ('F5', 18.0, .5), ('D5', 18.5, .5), ('E5', 19.0, .75), ('F5', 19.75, .25),
       ('G5', 20.0, 1.0), ('Bb5', 21.0, .5), ('A5', 21.5, .5)]
for p, t, d in MEL: n(t, 'clarinet', p, d * .95, .6, -.15)
for i, p in enumerate(['D3', 'C3', 'Bb2']): n(C['beamB'] - .5 + i * .16, 'trombone_stac', p, .18, .5, 0)   # the torch tips over: trombone walks down three steps
for k in (C['beamA'], C['beamB']): n(k, 'woodblock', 'a', .2, .7, .3); n(k + .02, 'glockenspiel', 'A6' if k == C['beamA'] else 'D6', .8, .45, .3)
n(C['lab1'], 'xylophone', 'C6', .2, .45, .2); n(C['lab2'], 'xylophone', 'A5', .2, .45, .2)
n(C['people'], 'drum_kit', 'snare_1', .3, .7, 0)
def shiver(t0, k=6):                                                                                # the hero shivers: xylophone trill
    for i in range(k): n(t0 + i * .06, 'xylophone', ['E5', 'F5'][i % 2], .1, .38, -.3)
for k in (C['near'] + .4, C['beamB'] + .8, C['dec'] + .55): shiver(k)
def hop(t0, v=.35):                                                                                  # the hero jumps: a quick xylophone run up
    for j, p in enumerate(['C5', 'E5', 'G5', 'C6']): n(t0 + j * .035, 'xylophone', p, .1, v, .35)
for k in (C['q'] + .75, C['cross'] + .3, C['earth'] + .45, C['beamA'] - .2, C['beamB'] - .7, C['people'], C['dec'], C['answer'] - 1, C['answer'] + .75): hop(k)
for i in range(4): n(C['beamA'] + .3 + i * .12, 'shaker', 'down' if i % 2 else 'up', .1, .3, -.2)     # fanning himself in the heat
# ── 22–28 the hemispheres: full band over sustained strings; 25 the south is reversed; 26 Christmas in summer: sleigh bells
for b in range(11, 14):
    pizz_bar(b, PROG[b], .58); kit_bar(b, fill=(b == 13)); hook(b, HOOK_A if b % 2 == 0 else HOOK_B, .62)
    for p in CH[PROG[b]]: groove(n)(b * BAR, 'violins', up(p, 24), BAR, .32, .1)
n(C['june'], 'drum_kit', 'crash_right', 2, .6, .3); n(C['dec'], 'glockenspiel', 'C6', .6, .45, .3)
n(C['south'], 'drum_kit', 'crash_left', 1.5, .65, -.3); n(C['south'], 'drum_kit', 'snare_1', .3, .8, 0)
for i in range(8): n(C['santa'] + i * B8, 'sleighbells', None, .3, .65 if i % 2 == 0 else .45, .35)
for j, p in enumerate(['C6', 'E6', 'G6', 'C7']): n(C['santa'] + j * .07, 'glockenspiel', p, .5, .45, .4)
# ── 28 the answer: tutti on F; 29 the tick: triangle + glockenspiel; 29.5 final button
for p in ['F4', 'A4', 'C5']: n(C['answer'], 'trumpet_stac', p, .4, .9, 0, 1.3)
for p in ['F3', 'C4']: n(C['answer'], 'horn_stac', p, .4, .9, 0, 1.3)
for p in CH['F']: n(C['answer'], 'violins', up(p, 24), 1.4, .45, .1)
n(C['answer'], 'timpani', 'F2', 1.0, .9, 0, 1.3); n(C['answer'], 'drum_kit', 'crash_left', 2, .85, -.3); n(C['answer'], 'drum_kit', 'kick_drum_left', .5, 1, 0)
for p, k in [('A5', 0), ('C6', .25), ('F6', .5)]: n(C['answer'] + .5 + k, 'xylophone', p, .2, .6, .2)   # the question from 0 s is answered this time
n(C['tick'], 'triangle', 'open', 1.5, .7, .3); n(C['tick'], 'glockenspiel', 'F6', 1.0, .6, .3)
for p in ['F3', 'A3', 'C4', 'F4']: n(C['end'], 'violins_pizz', p, .5, .8, .2)
for p in ['F2', 'C3', 'F3', 'A3']: n(C['end'], 'horn_stac', p, .4, .8, -.1)
n(C['end'], 'xylophone', 'F5', .5, .8, .2); n(C['end'], 'glockenspiel', 'C7', 1.5, .55, .3)
n(C['end'], 'drum_kit', 'kick_drum_left', .5, 1, 0); n(C['end'], 'drum_kit', 'crash_right', 2.5, .75, .3); n(C['end'], 'cellos_pizz', 'F2', .5, .9, -.2)

# reading holds: shift everything after each hold point, then repeat the groove of the two seconds before it
for k, (p, d) in enumerate(HOLDS):                   # one hold at a time, in the time already moved by the earlier ones
    P = p + sum(dd for _, dd in HOLDS[:k])
    ev = [((e[0] + d) if e[0] >= P else e[0],) + e[1:] for e in ev] + [(e[0] + d,) + e[1:] for e in ev if e[7] and P - d <= e[0] < P]
mix = S.render([e[:7] for e in ev], dur=DUR + .6)
mix = S.room(mix, size=.3, mix=.12)

# ── pen on paper, highlighter
def pen(d, v=1.0, lo=2500, hi=9000):
    x = X.bp(X.noise(d), lo, hi) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 7 * X.t_(d))))
    f = np.minimum(1, X.t_(d) / .03) * np.minimum(1, np.maximum(0, d - X.t_(d)) / .05)
    return X.norm(x * f, .06 * v)
fx = np.zeros_like(mix)
WR = [(C['wrong'], .9), (C['cross'], .3), (C['near'], .3), (C['near'] + .25, .9), (C['earth'], .8), (C['axis'], .5), (C['axis'] + .2, .6),
      (C['flash'], .35), (C['lab1'], .6), (C['lab2'], .6), (C['june'], .7), (C['june'] + .8, .7), (C['dec'], .7), (C['dec'] + .8, .7),
      (C['south'], .5), (C['south'] + .4, .5), (C['santa'] + .4, .8), (C['answer'], .7), (C['answer'] + .7, .3), (C['tick'], .2)]
WR += [(k + .1, .35) for k in [C['earth']] + C['stations'][:3]]
for t0, d in WR: add(fx, pen(d), warp(t0), 1, .1)
add(fx, pen(.5, 1.4, 900, 4000), warp(C['q']), 1, .1)                                   # highlighter: broader and duller
out = limit((mix + fx) * 1.5, .7)   # pushed into a limiter: a smaller peak-to-loudness gap, so mux can normalise to −14 LUFS with true peak under −1.2 dB
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out[:int(DUR * SR)], SR)
print('mix.wav', out.shape, 'peak', float(np.abs(out).max()))
print('\n'.join(S.credits(sorted({e[1] for e in ev}))))
