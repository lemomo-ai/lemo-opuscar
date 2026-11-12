"""Score for 叮之前 / Before the Ding (Tabletop App Flythrough demo). about 60 s (read from vo/timeline.json), 120 BPM, D major, a bar = 2 s from 0.0.
A light bed under the voice-over: plucked bass, soft kick, shaker, a string pad and a sparse marimba figure; the marimba theme is
played in full only where nobody speaks (the opening second, the pull-back, the end). Accents on the picture's hits.
Run from the library root:  .venv/bin/python -I styles/desktop-flythrough/demo/audio/compose.py"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..')); LIB = os.path.abspath(os.path.join(ROOT, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, t_, env_exp

S.seed(11)
TL = json.load(open(os.path.join(ROOT, 'vo/timeline.json'))); DUR = TL['dur']; FIN = round(TL['dur'] - 3.3, 2)   # FIN: the last line is over, the closing shot begins
BAR = 2.0; BEAT = .5
CH = ['D', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'D', 'Em', 'A', 'Bm', 'G', 'A', 'D', 'G', 'A', 'Bm', 'G', 'Em', 'A', 'D', 'G', 'D', 'A', 'G', 'A', 'D', 'D']
PAD = {'D': ['A3', 'D4', 'F#4'], 'G': ['G3', 'B3', 'D4'], 'A': ['A3', 'C#4', 'E4'], 'Bm': ['B3', 'D4', 'F#4'], 'Em': ['G3', 'B3', 'E4']}
ROOT_ = {'D': 'D2', 'G': 'G2', 'A': 'A2', 'Bm': 'B2', 'Em': 'E2'}
HEAD = [(0, 'F#5', 1), (1, 'A5', .5), (1.5, 'B5', .5), (2, 'D6', 1.5), (3.5, 'C#6', .5)]
# the theme where nobody speaks; elsewhere a two-note marimba figure on beats 1 and 3 (chord tones, soft)
MEL = {0: HEAD, 22: [(1, 'D6', 1), (2, 'A5', 1), (3, 'B5', 1)], 23: [(0, 'B5', 1), (1, 'D6', .5), (1.5, 'B5', .5), (2, 'G5', 2)],
       27: [(0, 'E6', 1), (1, 'C#6', .5), (1.5, 'A5', .5), (2, 'E6', 2)], 28: HEAD, 29: [(0, 'D6', 2.5)]}
ev = []
def E(t, inst, p, d, v, pan=0., **kw): ev.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, **kw))
for b, ch in enumerate(CH):
    t0 = b * BAR
    if t0 >= DUR: break
    for i, p in enumerate(PAD[ch]): E(t0, 'violas' if i else 'cellos', p, BAR + .1, .24, [-.3, 0, .3][i], attack=.35, release=.6)
    if b in MEL:
        for (bt, n, d) in MEL[b]: E(t0 + bt * BEAT, 'marimba', n, max(.18, d * BEAT), .74, .05); (d >= 1.5) and E(t0 + bt * BEAT, 'vibraphone', n, d * BEAT, .3, -.1)
    else:
        tones = sorted(S.midi(p) + 12 for p in PAD[ch])
        E(t0, 'marimba', S.name(tones[2]), .4, .42, .1); E(t0 + 2 * BEAT, 'marimba', S.name(tones[1]), .4, .36, .1)
    rt = ROOT_[ch]
    if b < 29:
        E(t0, 'contrabass_pizz', rt, .45, .74, 0); E(t0 + 2 * BEAT, 'contrabass_pizz', rt, .4, .58, 0)
        for k in range(8): E(t0 + k * BEAT / 2, 'shaker', 'down' if k % 2 == 0 else 'up', None, .18 + (.06 if k % 2 == 0 else 0), .35)
    if 22 <= b < 29: 
        for k in (1, 3): E(t0 + k * BEAT, 'claps', 'solo', None, .36, -.2)
def chordhit(t, ch, v=.5):
    for p in PAD[ch]: E(t, 'violins_pizz', S.name(S.midi(p) + 12), .3, v, .2)
E(1.0, 'glockenspiel', 'D6', 1.0, .4, .2)
E(10.5, 'timpani', 'D2', 1.2, .55, 0); E(10.5, 'cellos_pizz', 'D3', .4, .55)
E(19.0, 'glockenspiel', 'A5', .8, .3, .2); E(26.5, 'glockenspiel', 'B5', .8, .3, .2)
E(33.5, 'glockenspiel', 'F#6', 1.0, .38, .2); chordhit(33.5, 'D', .4)
E(43.3, 'glockenspiel', 'A6', 1.0, .38, .2); chordhit(43.3, 'Em', .35)
E(45.0, 'sus_cymbal', 'hit', None, .22)
E(FIN, 'timpani', 'D2', 2.5, .45); E(FIN, 'sus_cymbal', 'hit', None, .25)
for p in ['D4', 'F#4', 'A4', 'D5']: E(FIN, 'vibraphone', p, DUR - FIN - .4, .28, 0)
for p in ['D3', 'A3']: E(FIN, 'horn', p, DUR - FIN - .4, .26, 0, attack=.3, release=.5)
E(FIN, 'contrabass', 'D2', DUR - FIN - .4, .38, 0, attack=.2, release=.5)
for k, p in enumerate(['A5', 'D6', 'F#6', 'A6']): E(FIN + .85 + k * .14, 'glockenspiel', p, .8, .3, -.3 + .2 * k)   # the four stations hop
mus = S.render(ev, dur=DUR)
# soft kick: a short sine sweep (not an 808 tail), on 1 and 3; on 1 only while the square is judged; none in the comic stop
def kick(v):
    d = .22; tt = t_(d); f = 62 + 70 * np.exp(-tt / .03)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .07) * v).astype(np.float32)
for b in range(28):
    for k in (0, 2): add(mus, kick(.36 if k == 0 else .26), b * BAR + k * BEAT, 1, 0)
for t in (1.0, 10.5, 33.5, 43.3, FIN): add(mus, kick(.5), t, 1, 0)
mus = S.room(mus, size=.32, mix=.12)
fade = int(.5 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mus *= .5 / max(1e-9, np.abs(mus).max())
os.makedirs(os.path.join(ROOT, 'music'), exist_ok=True)
sf.write(os.path.join(ROOT, 'music/score.wav'), mus[:int(DUR * SR)], SR, subtype='PCM_24')
har = [{'bar': b, 't0': b * BAR, 'chord': ch, 'notes': [S.midi(p) for p in PAD[ch]], 'root': S.midi(ROOT_[ch])} for b, ch in enumerate(CH)]
json.dump(har, open(os.path.join(ROOT, 'music/harmony.json'), 'w'))
print('score', mus.shape, 'peak', float(np.abs(mus).max()))
print(S.credits(sorted({e['inst'] for e in ev})))
