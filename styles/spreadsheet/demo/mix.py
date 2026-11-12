"""Sound for "The Hidden Column" (52 s): English narration + spreadsheet foley + a score of drums, bass, piano and mallets.

Inputs (this folder): timeline.json (narration starts, subtitle cues), vo/chunks/*.wav (Kokoro af_bella),
events.json (every key, Enter, painted cell, unhidden column, landed patient… exported from index.html).
Output: out/mix.wav (48 kHz stereo).   Run from the library root:  .venv/bin/python styles/spreadsheet/demo/mix.py [start end]
With start/end (seconds) it writes only that slice of the same mix, with a short fade-out."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DUR = float(TL['dur']); N = int(DUR * SR)
CUE = {e['name']: e['t'] for e in EV if e['type'] == 'cue'}
rng = np.random.default_rng(31)
tt = np.arange(N) / SR
rms = lambda x: float(np.sqrt(np.mean(np.square(x)) + 1e-12))
db = lambda x: 20 * np.log10(x + 1e-12)
def smooth(x, sec): k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, 'same')
def evs(kind): return [e for e in EV if e['type'] == kind]

# ---------------- voice ----------------
vo = np.zeros(N); vmask = np.zeros(N)
for L in TL['lines']:
    for p in L['parts']:
        x, sr = sf.read(os.path.join(HERE, 'vo', 'chunks', p['id'] + '.wav'), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        i = int(p['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]; vmask[i:i + n] = 1
vo = hp(vo, 90)
vo = compress(vo / (np.abs(vo).max() + 1e-9) * 0.9, thr=0.22, ratio=3.0, att=0.003, rel=0.12)
duck = smooth(np.maximum(vmask, np.roll(vmask, int(0.12 * SR))), 0.15)

# ---------------- score: C major, 120 BPM (beat 0.5 s), sections follow the story ----------------
B = 0.5
sc = []
def n(t, inst, p, d, v, pan=0.0, gain=1.0):
    if 0 <= t < DUR: sc.append((t, inst, p, d, v, pan, gain))
QUIET, WHIP, UNH, PIV, FLY1 = CUE['quiet'], CUE['whip'], CUE['unhide'], CUE['pivot'], CUE['fly1']
JUDGE, BLOOM, LAND, MERGE = CUE['judge'], CUE['bloom'], CUE['landing'], CUE['merge']
ENTER = {e['n']: e['t'] for e in evs('enter')}
CHORDS = {'C': (36, [60, 64, 67]), 'Am': (33, [57, 60, 64]), 'F': (29, [57, 60, 65]), 'G': (31, [59, 62, 67]),
          'Em': (28, [59, 64, 67]), 'Dm': (26, [57, 62, 65])}
def groove(a, b, prog, kick='half', hats=True, bass=True, stabs=True, vel=1.0):
    """bars of 2 s from a to b; prog cycles per bar"""
    t = a; bar = 0
    while t < b - 0.01:
        root, ch = CHORDS[prog[bar % len(prog)]]
        for q in range(4):
            bt = t + q * B
            if bt >= b: break
            if kick == 'four' or (kick == 'half' and q in (0, 2)) or (kick == 'one' and q == 0):
                n(bt, 'drum_kit', 'kick_drum_left', None, .82 * vel, 0, 1.0)
            if hats: n(bt + B / 2, 'hihat', 'closed', None, .5 * vel, .25, .4)
            if bass and q in (0, 2): n(bt + (B / 2 if q == 2 else 0), 'electric_bass', root, .35, .72 * vel, 0, .85)
        if stabs:
            for off in (0.75, 1.75):
                if t + off < b:
                    for p in ch: n(t + off, 'piano', p, .16, .45 * vel, -.15, .42)
        t += 2.0; bar += 1

# 0 – Enter A: a counting pulse under the typing
for q in range(4): n(q * B, 'marimba', [72, 76, 79, 76][q], .25, .45, .25, .55)
n(ENTER[1], 'drum_kit', 'kick_drum_left', None, .9, 0, 1.0); n(ENTER[1], 'marimba', 72, .4, .7, .3, .7)
groove(ENTER[1], 7.5, ['C', 'Am', 'F'], kick='half', stabs=False, vel=.85)
n(ENTER[2], 'drum_kit', 'crash_left', None, .5, -.3, .4)
for q, p in enumerate([67, 71, 74, 79]): n(ENTER[2] + q * .06, 'marimba', p, .4, .62, .3, .55)   # 83 % lands
# pull-out + conditional format: four on the floor, climbing to the reveal
groove(7.5, 10.0, ['G'], kick='four', vel=.95)
for q in range(8): n(8.0 + q * .25, 'drum_kit', 'snare_2', None, .2 + q * .05, -.1, .3)
n(10.0, 'drum_kit', 'crash_right', None, .7, .3, .5)
for p in [48, 55, 60, 64, 67, 72]: n(10.0, 'piano', p, 1.6, .6, 0, .5)
groove(10.0, QUIET, ['C', 'Am', 'F'], kick='half', vel=.8)
# the turn: one real silence, then a clock and a held low note
n(WHIP, 'electric_bass', 33, 2.6, .8, 0, .9); n(WHIP, 'piano', 45, 3.0, .55, 0, .5)
for q in range(int((UNH - WHIP) / B)):
    n(WHIP + 0.25 + q * B, 'hihat', 'closed', None, .42, .25, .35)
    if q % 2 == 0: n(WHIP + q * B, 'marimba', 69 if q % 4 == 0 else 72, .3, .4, -.2, .45)
n(WHIP + 2.0, 'piano', 57, 1.6, .45, -.1, .4); n(WHIP + 2.0, 'piano', 64, 1.6, .4, .1, .38)
# unhide: one xylophone step per opening column, then the groove comes back
SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for e in evs('unhide'): n(e['t'], 'xylophone', SCALE[min(len(SCALE) - 1, e['n'] // 2)], .14, .45, -.3 + .6 * e['n'] / 28, .38)
n(UNH + 1.3, 'drum_kit', 'crash_left', None, .55, -.3, .4)
groove(UNH + 1.3, ENTER[4] - 1.2, ['F', 'G', 'Am', 'Em'], kick='half', vel=.8)
for q in range(10): n(ENTER[4] - 1.2 + q * .12, 'drum_kit', 'snare_2', None, .2 + q * .06, -.1, .32)
# pivot: the fullest section while 700 cells fly
n(ENTER[4], 'drum_kit', 'crash_right', None, .8, .3, .55)
groove(ENTER[4], FLY1 + 0.5, ['C', 'G', 'Am', 'F'], kick='four', vel=1.0)
for q in range(16): n(ENTER[4] + q * .125 + .06, 'marimba', SCALE[q % 10] + 12, .1, .35, .3, .32)
# the verdicts: light groove under the voice, a stab on each win
groove(FLY1 + 0.5, JUDGE, ['C', 'Am', 'F', 'G'], kick='half', vel=.72, stabs=False)
for e in evs('win') + evs('winB'):
    for q, p in enumerate([72, 76, 79]): n(e['t'] + q * .05, 'marimba', p, .45, .6, .3, .5)
    n(e['t'], 'glockenspiel', 84, .8, .45, .2, .35)
# judgement: hold still, long chords, no drums
for a, ch in [(JUDGE, [45, 57, 60, 64]), (JUDGE + 2.0, [41, 57, 60, 65]), (ENTER[6] - 0.05, [43, 55, 62, 67, 71])]:
    for p in ch: n(a, 'piano', p, 2.2, .45, 0, .45)
n(ENTER[6], 'drum_kit', 'crash_left', None, .5, -.3, .35)
# bloom: everything comes in, the colour scale is a rising arpeggio
n(BLOOM, 'drum_kit', 'crash_right', None, .85, .3, .55)
groove(BLOOM, LAND, ['F', 'G', 'Am'], kick='four', vel=1.0)
for q in range(int((LAND - BLOOM) / .125)):
    root, ch = CHORDS[['F', 'G', 'Am'][int((q * .125) // 2) % 3]]
    n(BLOOM + q * .125, 'marimba', ch[q % 3] + 12 * (1 + (q // 3) % 2), .12, .42 + .1 * (q % 4 == 0), .25, .4)
for q in range(6): n(LAND - 0.75 + q * .125, 'drum_kit', 'snare_2', None, .35 + q * .08, -.1, .35)
# landing on the end card: the home chord rings out
END = ENTER[7]
n(MERGE, 'drum_kit', 'kick_drum_left', None, .9, 0, 1.0)
for p in [36, 48, 55, 60, 64, 67, 72]: n(MERGE, 'piano', p, 3.6, .6, 0, .5)
n(MERGE, 'electric_bass', 36, 2.5, .8, 0, .85)
for q, p in enumerate([72, 76, 79, 84, 88]): n(END + q * .07, 'marimba', p, .8, .6, .3, .5)
n(END, 'glockenspiel', 84, 2.0, .5, .2, .4); n(END, 'drum_kit', 'crash_left', None, .45, -.3, .35)
S.seed(7)
music = S.render(sc, dur=DUR + 2, master=False)[:N]
music = S.room(music, size=.32, mix=.13)
music = music - 0.37 * np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)   # room for the voice
music *= (1 - 0.42 * duck)[:, None]
# the real silence before the turn
gap = np.ones(N); i0, i1 = int((QUIET - 0.05) * SR), int(WHIP * SR)
gap[i0:i1] = 0.0; gap[i0 - int(.06 * SR):i0] = np.linspace(1, 0, int(.06 * SR))
music *= gap[:, None]

# ---------------- foley: the sheet itself ----------------
fx = np.zeros((N, 2))
def blip(f, d=.016, tau=.004):
    t = X.t_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
paints = evs('paint')
for q, e in enumerate(paints):                                     # one tick per painted cell, pitch climbs
    add(fx, blip(1300 + 1700 * q / len(paints) + rng.uniform(-50, 50)) * (1.0 if e['ok'] else .8), e['t'], .045, rng.uniform(-.6, .6))
for e in evs('land'):                                              # patients landing in the bars
    add(fx, blip(900 + 70 * e['row'] + rng.uniform(-30, 30), .02, .005), e['t'], .04, rng.uniform(-.5, .5))
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'key': add(fx, X.click(rng.uniform(.85, 1.2), 1), t, .3, rng.uniform(-.2, .2))
    elif ty == 'enter': add(fx, X.clack(1.0, 1), t, .45, 0); add(fx, X.thump(1, 90), t, .3, 0)
    elif ty == 'hop': add(fx, X.click(1.45, 1), t, .16, -.2)
    elif ty == 'unhide': add(fx, hp(X.click(1.7, 1), 1200), t, .22, -.4 + .8 * e['n'] / 28)
    elif ty == 'click': add(fx, X.click(1.25, 1), t, .3, .1)
    elif ty == 'menu': add(fx, X.pop(1), t, .14, .1)
    elif ty in ('rate', 'count', 'pop'): add(fx, X.pop(1), t, .28, .1)
    elif ty in ('win', 'winB'): add(fx, X.ding(1), t, .14, .2)
for name, d, g_ in [('pull', 1.6, .2), ('whip', .45, .3), ('unhide', 1.2, .12), ('pivot', 1.0, .16), ('bloom', 1.8, .2), ('landing', 1.0, .22)]:
    add(fx, lp(X.whoosh(d, 1.0), 3500), CUE[name] - (0.1 if name != 'landing' else 0.6), g_, 0)
room = lp(rng.standard_normal(N), 600, 2) * 0.004                  # a quiet office
fx += np.stack([room, np.roll(room, 997)], 1)
fx *= (1 - 0.35 * duck)[:, None]

# ---------------- balance: voice ~10 dB over the music (RMS while speaking) ----------------
spk = vmask > 0
vg = (rms(music[spk].mean(1)) * 10 ** (10 / 20)) / rms(vo[spk])
mix = music + fx + np.stack([vo * vg, vo * vg], 1)
print(f'voice vs music: {db(rms(vo[spk]) * vg) - db(rms(music[spk].mean(1))):.1f} dB;  voice vs foley: {db(rms(vo[spk]) * vg) - db(rms(fx[spk].mean(1))):.1f} dB')
mix = np.stack([limit(compress(mix[:, c], thr=.35, ratio=2.0) * 1.95, ceil=.7, look=.004) for c in (0, 1)], 1)   # hot enough for -14 LUFS without true-peak overs
mix *= np.clip((DUR - tt) / 1.2, 0, 1)[:, None] ** 1.5           # the chord dies away with the film
if len(sys.argv) == 3:                                             # a cut of the same mix
    a, b = float(sys.argv[1]), float(sys.argv[2]); mix = mix[int(a * SR):int(b * SR)].copy()
    f = int(0.35 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = sorted({x[1] for x in sc})
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(S.credits(used)))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'instruments', used)
