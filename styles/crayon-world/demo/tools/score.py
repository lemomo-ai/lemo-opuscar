"""The Butterfly (《蝴蝶》): original score. Run from the library root (build.sh does):
   .venv/bin/python styles/crayon-world/demo/tools/score.py  -> styles/crayon-world/demo/out/mix.wav
D major, 3/4, 78 BPM (one bar = 2.308 s). The style's palette, no strings or piano: a music box (her instrument, from the
first frame to the last), nylon guitar picking, a clarinet's long low notes under the second half of the flight, and a
recorder for the one tune, held back until the cut to his eyes and played in full once (its second half doubled by the music
box: the two of them). The flight is wistful, slow picking under long music-box notes starting on Bm, not a waltz. A breath of
silence when he stops at her flower. The theme ends on the tonic, then the music box runs down.
The film's beats sit on bar lines (film.js: WAKE = bar 3, CUT = bar 19, UP = bar 20, SAY = bar 23).
Water from the ladle and a few birds are made from noise and sine chirps (core/audio/sfx.py)."""
import sys, os
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.environ.get('LIB') or os.path.dirname(os.path.dirname(os.path.dirname(HERE))))   # styles/<slug>/demo -> library root
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.pluck import pluck
from core.audio.sfx import SR, add, limit

BAR = 3 * 60 / 78; Q = BAR / 3; E = Q / 2
DUR = 64.5
at = lambda b, beat=0: b * BAR + beat * Q          # bar b, beat `beat` (both counted from 0)
S.seed(7)
ev, mb = [], []                                     # sampled-instrument events; music-box (pluck synthesis) events
def n(t, inst, p, d, v, pan=0, g=1.0): ev.append((t, inst, p, d, v, pan, g))
def box(t, p, v=.6, pan=.15, **kw): mb.append((t, p, v, pan, kw))

CH = {'D': ('D2', ['A3', 'D4', 'F#4']), 'G': ('G2', ['B3', 'D4', 'G4']), 'A': ('A2', ['C#4', 'E4', 'A4']), 'Bm': ('B2', ['B3', 'D4', 'F#4']),
      'Em': ('E2', ['B3', 'E4', 'G4']), 'A/C#': ('C#3', ['A3', 'E4', 'A4']), 'Asus': ('A2', ['D4', 'E4', 'A4']), 'D/F#': ('F#2', ['A3', 'D4', 'F#4'])}
def arp(b, ch, v=.42, up=12):                       # guitar picking: six eighth notes
    root, tri = CH[ch]; seq = [root, tri[0], tri[1], tri[2], tri[1], tri[0]]
    for i, p in enumerate(seq): n(at(b) + i * E, 'guitar_nylon', p if i == 0 else S.name(S.midi(p)), E * 1.6, v * (1 if i == 0 else .75), -.1)

# The theme (heard whole only once, at the end): D | Bm | D | A | G | Em | Asus-A | D
THEME = [[('F#5', 0, 2), ('E5', 2, 1)], [('D5', 0, 1), ('E5', 1, 1), ('F#5', 2, 1)], [('A5', 0, 2), ('F#5', 2, 1)], [('E5', 0, 3)],
         [('G5', 0, 2), ('F#5', 2, 1)], [('E5', 0, 1), ('D5', 1, 1), ('B4', 2, 1)], [('D5', 0, 2), ('E5', 2, 1)], [('D5', 0, 3)]]

# ── bars 0-3, waking: the music box plucks slowly (as if just wound), the guitar comes in softly in bar 2. Only hints of the theme, never the tune
for p, b, k, v in [('F#5', 0, .3, .5), ('D5', 0, 1.3, .36), ('E5', 0, 2.3, .44), ('A4', 1, .4, .34), ('D5', 1, 1.2, .42), ('F#5', 1, 2.2, .36),
                   ('B4', 2, .3, .4), ('D5', 2, 1.1, .36), ('A4', 2, 2.0, .38)]: box(at(b, k), p, v)
arp(1, 'D', .22); arp(2, 'G', .24)

# ── bars 3-15, the flight: slow guitar picking, long music-box notes (one or two a bar, falling), a clarinet's long notes from bar 7; it starts on Bm: missing someone, not cheerful
FLY = ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'A', 'G', 'D/F#', 'Em', 'A']
FLYMEL = [[('D6', 0, 2), ('C#6', 2, 1)], [('B5', 0, 3)], [('A5', 0, 2), ('F#5', 2, 1)], [('E5', 0, 3)],
          [('D6', 0, 2), ('C#6', 2, 1)], [('B5', 0, 2), ('D6', 2, 1)], [('E6', 0, 2), ('D6', 2, 1)], [('C#6', 0, 3)],
          [('B5', 0, 2), ('A5', 2, 1)], [('A5', 0, 2), ('F#5', 2, 1)], [('G5', 0, 2), ('E5', 2, 1)], [('E5', 0, 1), ('F#5', 1, 1), ('G5', 2, 1)]]
CLAR = ['D4', 'B3', 'B3', 'C#4', 'B3', 'A3', 'G3', 'C#4']
for i, ch in enumerate(FLY):
    b = 3 + i
    arp(b, ch, .3 if i < 11 else .24)
    for p, k, l in FLYMEL[i]: box(at(b, k), p, .5 if k == 0 else .4, .2)
    if i >= 4: n(at(b), 'clarinet', CLAR[i - 4], BAR * 1.02, .4, -.25, .5)
for b, p in [(9, 'B6'), (11, 'D7')]: n(at(b, 1), 'glockenspiel', p, 1.2, .22, .35)   # over the village: one glockenspiel note each

# ── bars 15-19, the garden: the guitar alone, a music-box note or two; one breath of silence when he reaches her flower (arrives 38.4, looks down 38.9)
arp(15, 'D', .26); box(at(15, 1), 'F#5', .32); box(at(15, 2.5), 'A5', .28)
arp(16, 'Bm', .24); box(at(16, 1), 'D6', .3)
# bar 17, beats 1-2: nothing (he looks down at the flower)
n(at(17, 2), 'guitar_nylon', 'B3', BAR, .24, -.05); n(at(17, 2) + .02, 'guitar_nylon', 'D4', BAR, .2, 0)
arp(18, 'Asus', .24); n(at(18, 2), 'guitar_nylon', 'C#4', Q, .22, 0)   # he looks back at the flower: suspension -> resolution, like something left unsaid

# ── bars 19-27, his eyes: the recorder plays the whole theme once; 20 the butterfly takes off; 23, with the words, the music box joins an
#    octave up and the two finish the second half together; 26 back on D, one strummed guitar chord; the music box plucks a few more
#    notes, slower and slower, the last one drooping (the spring has run down)
ENDCH = ['D', 'Bm', 'D', 'A', 'G', 'Em', 'Asus']
for i, ch in enumerate(ENDCH): arp(19 + i, ch, .3)
n(at(25, 2), 'guitar_nylon', 'C#4', Q, .22, 0)
for i in range(8):
    for p, k, l in THEME[i]:
        n(at(19 + i, k), 'recorder', p, l * Q * (.95 if i < 7 else 2.2), .55, .05, .27 if i < 4 else .22)   # the recorder samples are some 14 dB hotter than the guitar and the music box
        if i >= 4: box(at(19 + i, k), S.name(S.midi(p) + 12), .36, .2)
for j, p in enumerate(['D2', 'A2', 'F#3', 'A3', 'D4', 'F#4']): n(at(26) + j * .045, 'guitar_nylon', p, BAR * 2, .3 - .015 * j, -.1 + .04 * j)
tail = [('A5', 1.4), ('F#5', 2.6), ('E5', 4.0), ('D5', 5.8)]
for j, (p, k) in enumerate(tail):
    kw = {'bend': [(0, 0), (1.4, -.4)]} if j == len(tail) - 1 else {}
    box(at(26) + k * Q, p, .3 - .03 * j, .1, **kw)

mix = S.render(ev, dur=DUR + 1)
mbuf = np.zeros_like(mix)
for t, p, v, pan, kw in mb: add(mbuf, pluck('music_box', p, None, v, **kw), t, .9, pan)
# alone at the start, the music box's steel comb is bright and exposed: low-pass it while she wakes, opening up just before take-off
k = np.clip((np.arange(len(mbuf)) / SR - (at(3) - 1.5)) / 1.5, 0, 1)[:, None]
mbuf = mbuf * k + X.lp(X.lp(mbuf.T, 2200), 4000).T * 1.2 * (1 - k)
mix = S.room(mix + mbuf, size=.45, mix=.2)

# ── sound effects: water from the ladle onto the soil (the four pours), a few birds (waking, the garden)
fx = np.zeros_like(mix)
def water(d=.7):
    x = X.bp(X.noise(d), 350, 2400) * (.55 + .45 * np.abs(np.sin(2 * np.pi * 11 * X.t_(d) + 3 * np.sin(2 * np.pi * 3 * X.t_(d)))))
    f = np.minimum(1, X.t_(d) / .06) * np.minimum(1, np.maximum(0, d - X.t_(d)) / .15)
    return X.norm(x * f, .028)   # onto soil: duller and softer
for t0 in (36.2, 37.4, 40.1, 41.3): add(fx, water(), t0 + .45, 1, -.05)
def chirp(f0=4200, k=3, v=.03):
    out = []
    for i in range(k):
        d = .06 + .03 * (i % 2); t = X.t_(d); f = f0 * (1 + .25 * np.sin(np.pi * t / d)) * (1 - .1 * i)
        out += [np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2, np.zeros(int(.05 * SR))]
    return X.norm(np.concatenate(out), v)
for t0, f0, k, pan, v in [(1.2, 3000, 3, .6, .016), (3.9, 2700, 2, -.5, .014), (5.6, 3200, 3, .4, .016), (35.5, 4000, 3, .7, .03), (39.6, 3500, 2, -.6, .03), (44.8, 4400, 3, .5, .03)]: add(fx, chirp(f0, k, v), t0, 1, pan)   # the birds while she wakes are farther and lower

out = limit((mix + fx) * 1.6, .7)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out[:int(DUR * SR)], SR)
print('mix.wav', out.shape, 'peak', float(np.abs(out).max()), '| bar', round(BAR, 4), '| CUT', round(at(19), 3), 'UP', round(at(20), 3), 'SAY', round(at(23), 3), 'WAKE', round(at(3), 3))
print('\n'.join(S.credits(sorted({e[1] for e in ev}))))
