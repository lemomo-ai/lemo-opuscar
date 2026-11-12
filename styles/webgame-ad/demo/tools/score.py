"""Web Game Ad demo 「买你这一下」 (What Your Tap Costs) · score + voice mix from timeline.json. Run from the library root:
   .venv/bin/python styles/webgame-ad/demo/tools/score.py  → styles/webgame-ad/demo/out/mix.wav
D minor, 128 BPM. The voice (vo/, edge-tts zh-CN-YunxiNeural +40 %) carries the argument, so the music is a bed under it and
ducks ~9 dB while it speaks. The ad itself: brass stabs, frame drums, timpani, gong. The tap freezes it. Then a trap groove
(kick, clap, rolling hats, finger bass, tuba) with guzheng flourishes at each new question; part ② (the players leave) thins to hats and a low erhu;
③ goes dark (Gm, trombones). He closes the game: silence. The ad comes back for the last two lines; a gong on 「会充钱的你」 ("you, who pays"),
a two-note trombone 'no' on the button. Every hit in timeline.json gets a kick, the big ones a brass stab or a cymbal."""
import sys, os, json, math
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.environ.get('LIB') or os.path.dirname(os.path.dirname(os.path.dirname(HERE))))   # styles/<slug>/demo -> library root
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, add, limit

TL = json.load(open(os.path.join(HERE, 'timeline.json'))); DUR = TL['dur']; C = TL['cues']; SCN = {s['name']: s['t0'] for s in TL['scenes']}
LN = {l['id']: l for l in TL['lines']}
BAR = 60 / 128 * 4; Q = BAR / 4; E = Q / 2; X16 = Q / 4
NB = math.ceil(DUR / BAR)
S.seed(7)
ev = []
def n(t, inst, p, d, v, pan=0, g=1.0): ev.append((t, inst, p, d, v, pan, g))
up = lambda p, k: S.name(S.midi(p) + k)
bar_of = lambda t: int(t // BAR)
SILENT = (C['close'], C['buzz'])

CH = {'Dm': ['D4', 'F4', 'A4'], 'Bb': ['D4', 'F4', 'Bb4'], 'C': ['E4', 'G4', 'C5'], 'A': ['E4', 'A4', 'C#5'], 'Gm': ['D4', 'G4', 'Bb4']}
ROOT = {'Dm': 'D2', 'Bb': 'Bb1', 'C': 'C2', 'A': 'A1', 'Gm': 'G1'}
def section(t):
    for name, a, b in [('ad', 0, LN['q1']['t0']), ('one', LN['q1']['t0'], SCN['dead']), ('two', SCN['dead'], SCN['newbuy']), ('three', SCN['newbuy'], SCN['sieve']),
                       ('four', SCN['sieve'], SILENT[0]), ('quiet', SILENT[0], SILENT[1]), ('end', SILENT[1], 999)]:
        if a <= t < b: return name
def chord(b):
    sec = section(b * BAR)
    if sec == 'three': return ['Dm', 'Gm', 'Bb', 'A'][b % 4]
    return ['Dm', 'Bb', 'C', 'A'][b % 4]

def stab(t, ch, v=.9, g=1.2):
    for p in CH[ch]: n(t, 'trumpet_stac', up(p, 12), .3, v, .1, g)
    for p in CH[ch][:2]: n(t, 'horn_stac', p, .3, v, -.1, g)
    n(t, 'tuba_stac', up(ROOT[ch], 12), .3, v, 0, g)
talking = lambda t: any(l['t0'] <= t < l['t1'] for l in TL['lines'])
def coin(t, v=.6, k=0):
    if talking(t): v *= .4                          # a ding mid-sentence stays soft so it doesn't cover the words
    n(t, 'glockenspiel', up('B6', k), .5, v, .3); n(t + .06, 'glockenspiel', up('E7', k), .8, v, .3); n(t, 'triangle', 'open', 1.0, v * .7, .35)
def zheng(t, v=.5):                                 # a guzheng sweep up the pentatonic scale
    for j, p in enumerate(['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5']): n(t + j * .025, 'dan_tranh', p, .8, v * (.6 + .05 * j), .25)

# ── hits
for t, amp, fl in TL['hits']:
    if SILENT[0] <= t < SILENT[1]: continue
    n(t, 'drum_kit', 'kick_drum_left', .4, min(1, .55 + .3 * amp), 0)
    talk = talking(t)                                                        # mid-sentence: kick only (softer cymbal); brass and snare wait for the gaps between lines
    if amp >= 1.2 and not talk: stab(t, chord(bar_of(t)), min(1, .55 + .2 * amp))
    if fl >= .3: n(t, 'clash', 'crash', 2.0, min(1, .35 + .5 * fl) * (.45 if talk else 1), .2)
    elif amp >= .9 and not talk: n(t, 'drum_kit', 'snare_1', .3, .45 + .2 * amp, -.05)

# ── the ad: frame drums, timpani, gong, trumpet
def taiko_bar(b, v=1.0, t_end=None):
    for k in range(8):
        t = b * BAR + k * E
        if t_end is not None and t >= t_end: break
        n(t, 'frame_drum', 'large' if k % 2 == 0 else 'small', .4, (.85 if k % 4 == 0 else .6) * v, -.15 if k % 2 else .15)
    n(b * BAR, 'timpani', 'D2', 1.2, .9 * v, 0)
taiko_bar(0, t_end=C['tap'])
n(0, 'gong', None, 3.0, .6, 0); n(0, 'bass_drum', None, 1.5, 1, 0)
for p, k, d in [('A4', 1, .2), ('D5', 1.5, .2), ('F5', 3, .4)]: n(k * Q, 'trumpet', p, d, .6, .15, 1.1)
n(C['tap'], 'woodblock', 'a', .2, .8, .3); n(C['tap'] + .02, 'glockenspiel', 'A6', .6, .6, .3)
fz = LN['q1']['t0'] - C['freeze']
n(C['freeze'], 'violins_trem', 'A5', fz + .3, .28, .1); n(C['freeze'], 'contrabass', 'D2', fz + .3, .45, -.1)

# ── groove
def kit_bar(b, v=1.0, roll=False, clap=True, kick=True, t0=None, t1=None):
    for k in range(16):
        t = b * BAR + k * X16
        if (t0 is not None and t < t0) or (t1 is not None and t >= t1): continue
        if kick and k in (0, 6, 10): n(t, 'drum_kit', 'kick_drum_left', .4, (.85 if k == 0 else .65) * v, 0)
        if clap and k == 8: n(t, 'claps', 'group', .4, .6 * v, 0); n(t, 'drum_kit', 'snare_1', .3, .45 * v, -.05)
        if roll and k >= 12: [n(t + j * X16 / 3, 'hihat', 'closed', .1, .3 * v, .3) for j in range(3)]
        else: n(t, 'hihat', 'closed', .1, (.4 if k % 4 == 0 else .26) * v, .3)
def bass_bar(b, ch, v=.8, t0=None, t1=None):
    r = ROOT[ch]
    for k, p in [(0, r), (3, r), (6, up(r, 12)), (7, up(r, 7))]:
        t = b * BAR + k * E
        if (t0 is not None and t < t0) or (t1 is not None and t >= t1): continue
        n(t, 'electric_bass', up(p, 12), E * .9, v, -.1)
    if t0 is None or b * BAR >= t0: n(b * BAR, 'tuba', up(r, 12), BAR * .9, .25 * v, 0)

g0, g1 = LN['q1']['t0'], SILENT[0]
for b in range(bar_of(g0), bar_of(g1) + 1):
    sec = section(max(b * BAR, g0)); ch = chord(b)
    if sec == 'two':
        kit_bar(b, .8, clap=False, kick=False, t0=g0, t1=g1)
        n(b * BAR, 'erhu', ['D4', 'C4', 'A3', 'C4'][b % 4], BAR * .95, .32, -.15); n(b * BAR, 'contrabass', ROOT[ch], BAR, .35, -.1)
        continue
    kit_bar(b, .85 if sec == 'four' else 1, roll=(b % 2 == 1), t0=g0, t1=g1); bass_bar(b, ch, t0=g0, t1=g1)
    if sec == 'three':
        n(b * BAR, 'trombone', CH[ch][0], BAR * .95, .28, -.1); n(b * BAR, 'trombone', up(CH[ch][1], -12), BAR * .95, .24, .1)
for t in (LN['a1']['t0'], LN['b1']['t0'], LN['c1']['t0'], LN['d1']['t0']): zheng(t - .3, .55); n(t, 'gong2', 'small', 1.0, .45, 0)   # each new question

# ── things happening in the picture
coin(C['tag200'], .75)
for j, p in enumerate(['D5', 'F5', 'A5', 'D6']): n(C['scaleIn'] + j * .05, 'harp', p, 1.0, .5, .2)
n(C['ineq'], 'timpani', 'D2', 1.0, .7, 0)
n(C['one'], 'glockenspiel', 'A6', .8, .2, .3); coin(C['more'], .55, 2)
coin(C['press'], .7, 3); [n(C['press'] + j * .05, 'glockenspiel', p, .8, .45, .3) for j, p in enumerate(['A5', 'D6', 'F6', 'A6'])]
for j in range(3): coin(C['rankUp'] + j * .08, .4, 2 * j)
coin(C['n469'], .6, 3)
for i, p in enumerate(['D3', 'Db3', 'C3', 'B2']): n(C['slash'] + .3 + i * .17, 'trombone_stac', p, .15 if i < 3 else .45, .7, 0, 1.1)   # 'you have died'
for j in range(6): n(LN['a6']['t1'] + .05 + j * .05, 'claps', 'solo', .2, .3, (j % 3 - 1) * .4)   # onlookers clapping (after the line ends)
for k, p in [('newsv', 'D6'), ('lvl1', 'F6'), ('again', 'A6')]: n(C[k], 'xylophone', p, .3, .5, .25)
n(C['merge'] - .3, 'sus_cymbal', 'cresc', .32, .5, .2); n(C['merge'], 'timpani', 'D2', 1.2, 1, 0); n(C['merge'], 'bass_drum', None, 1.5, .9, 0)
for i in range(5): n(C['buy'] + i * .07, 'woodblock', 'b', .15, .55, -.4 + i * .2)    # five price tags drop in
for i in range(5): n(SCN['bars'] + .1 + i * .14, 'marimba', ['A5', 'F5', 'G5', 'E5', 'D5'][i], .3, .5, .2)
coin(C['nextYou'], .65)
coin(C['payback'] + .3, .7, 2); n(C['payback'] + .3, 'gran_cassa', 'hit', 1, .7, 0)
n(C['tu'], 'drum_kit', 'crash_left', 1.0, .35, -.3); coin(C['stay'], .7)
n(C['pct06'], 'glockenspiel', 'A6', .8, .4, .3)
# ── ending: the ad comes back, gong, the 'no'
for k in range(int((C['you'] - C['buzz']) / E)): n(C['buzz'] + k * E, 'frame_drum', 'large' if k % 2 == 0 else 'small', .4, (.8 if k % 4 == 0 else .5), -.15 if k % 2 else .15)
n(C['buzz'], 'gong2', 'small', 1.2, .6, 0); n(C['buzz'], 'timpani', 'D2', 1.0, .8, 0)
for p in CH['Dm']: n(C['notAll'], 'violins', up(p, 12), C['you'] - C['notAll'], .35, .1)
e2end = LN['e2']['t1'] + .05                                   # only a short hit under 「会充钱的你」; gong and horns wait for the line to end
n(e2end, 'gong', None, 4.0, .9, 0); n(e2end, 'bass_drum', None, 2, 1, 0); n(e2end, 'timpani', 'D2', 2, 1, 0)
for p in ['D4', 'F4', 'A4', 'D5']: n(e2end, 'horn', p, 1.2, .5, -.1)
for i, p in enumerate(['A3', 'D3']): n(C['no'] + i * .22, 'trombone_stac', p, .2 if i == 0 else .5, .75, 0, 1.2)
# end card: a soft gong and a harp run up D minor, a glockenspiel on top, then it rings out
n(C['card'], 'gong2', 'small', 3.0, .35, 0)
for i, p in enumerate(['D4', 'F4', 'A4', 'D5', 'F5', 'A5']): n(C['card'] + .1 + i * E / 2, 'harp', p, 2.5, .45, -.3 + i * .12)
n(C['card'] + .1 + 6 * E / 2, 'glockenspiel', 'D6', 2.0, .35, .2)

mix = S.render(ev, dur=DUR + .6)
mix = S.room(mix, size=.35, mix=.1)
fx = np.zeros_like(mix)
add(fx, X.whoosh(.32, 1) * .5, 0, 1, .3)                               # the blade flash in the ad
add(fx, X.roar(1.6, .5) * .3, 0, 1, 0)
add(fx, X.whoosh(.32, 1) * .5, C['slash'] - .05, 1, .3)
add(fx, X.whoosh(.3, .8) * .5, C['swipe'] - .1, 1, -.4)
s0, s1, nf = int(SILENT[0] * SR), int(SILENT[1] * SR), int(.25 * SR)       # the game closes: music fades, then silence
fade = np.linspace(1, 0, nf); mix[s0:s0 + nf] *= fade[:, None]; mix[s0 + nf:s1] = 0
add(fx, X.click(1.0, .3) * .3, C['close'], 1, 0)

# ── voice: placed on the timeline, the music ducks under it
vo = np.zeros(len(mix)); g = math.gcd(SR, 24000)
for l in TL['lines']:
    x, sr = sf.read(os.path.join(HERE, 'vo', l['id'] + '.wav')); x = x if x.ndim == 1 else x.mean(1)
    x = resample_poly(x, SR // math.gcd(SR, sr), sr // math.gcd(SR, sr)); a = int(l['t0'] * SR); vo[a:a + len(x)] += x[:len(vo) - a] * (1.15 if l['id'] == 'ad' else 1.0)
k = int(.25 * SR)
pres = np.convolve((np.abs(vo) > .01).astype(float), np.ones(k) / k, mode='same') > 0   # where the voice speaks (with a little margin)
env = np.convolve(pres.astype(float), np.ones(int(.12 * SR)) / int(.12 * SR), mode='same')   # smooth in and out
duck = 1 - .8 * env                                                       # ≈ −14 dB
music = (mix + fx) * duck[:, None]
VO = X.compress(vo, thr=.15, ratio=4)
VO = VO / (np.abs(VO).max() + 1e-9) * .8
out = limit((music * 1.1 + VO[:, None]) * 1.55, .6)   # push and limit so true peak holds when mux normalises to −14 LUFS
fi = int(.025 * SR); out[:fi] *= np.linspace(0, 1, fi)[:, None]          # frame 0 is a downbeat: a 25 ms fade-in keeps loudness normalisation from overshooting true peak at the start
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out[:int(DUR * SR)], SR)
print('mix.wav', out.shape, 'peak', float(np.abs(out).max()))
print('\n'.join(S.credits(sorted({e[1] for e in ev}))))
