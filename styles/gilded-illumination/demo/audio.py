"""Score, foley and voice for 借来的光 Borrowed Light (Gilded Illumination demo). Writes out/mix.wav (48 kHz stereo, the film's length).
Run from the library root after the page's cues are exported:
   node core/render/events.mjs styles/gilded-illumination/demo          # -> events.json
   .venv/bin/python styles/gilded-illumination/demo/audio.py
Music: a small medieval band in D dorian (solo violin for the vielle, harp, recorder, soft organ as the portative, frame drum),
bells for the gold. The relighting of the sun lands on D major (a Picardy third). Foley is the painted world's own: wind, steps on
stone, the lantern's ring, the flame. Voice: Kokoro bf_emma (out/voice/*.wav, recorded from voice/lines.json), compressed, ~10 dB over the music by RMS; the music
gives way in 300 Hz-4 kHz while she speaks. Loudness is finished by core/render/mux.sh (-14 LUFS, true peak <= -1.2 dB)."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..')); sys.path.insert(0, LIB)   # styles/<slug>/demo -> library root
import numpy as np, soundfile as sf, soxr
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from core.audio import sampler as S, sfx as X
from core.audio.sfx import SR, add, limit, noise, bp, lp, hp, env_exp, t_, norm, whoosh, brown, compress

X._rng = np.random.default_rng(11); S.seed(11); R = np.random.default_rng(5)
EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(EV['dur']); N = int(round(DUR * SR)); ev = EV['ev']
at = lambda typ: [e['t'] for e in ev if e['type'] == typ]
one = lambda typ: at(typ)[0]
PAD = SR * 6
WK = [[0, 0], [5.4, 6.0], [11.6, 12.6], [16.4, 18.4], [19.6, 22.65], [22.0, 25.625], [24.4, 28.0], [28.6, 33.2], [30.7, 35.4], [31.5, 36.6], [33.7, 39.2], [38.7, 44.2], [41.0, 46.0], [46.8, 51.8]]
NT = lambda to: float(np.interp(to, [k[1] for k in WK], [k[0] for k in WK]))   # story clock → film clock (cues not in events.json)
mus = np.zeros((N + PAD, 2), np.float32); fx = np.zeros((N + PAD, 2), np.float32); amb = np.zeros((N + PAD, 2), np.float32)
USED = set()
def Sn(inst, note, t, dur, v, pan=0, g=1.0, buf=None, **kw): USED.add(inst); add(mus if buf is None else buf, S.note(inst, note, dur, v, **kw), t, g, pan)
def Hit(inst, var, t, v, pan=0, g=1.0, buf=None): USED.add(inst); add(mus if buf is None else buf, S.hit(inst, var, v), t, g, pan)
def groups(ts, gap=.12):   # merge cues closer than gap
    out = []
    for t in sorted(ts):
        if not out or t - out[-1][-1] > gap: out.append([t])
        else: out[-1].append(t)
    return [g[0] for g in out]
UP = ['D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7']   # D dorian, rising a step for each piece of gold

# ---------------------------------------------------------------- foley
def wind(d, v=1.0):
    tm = t_(d); return norm(bp(brown(d), 180, 1300) * (.55 + .45 * np.sin(2 * np.pi * .23 * tm + 1) ** 2) * np.minimum(1, tm / 1.2) * np.minimum(1, (d - tm) / 1.2)) * v
def flame(d, v=1.0):   # a small lantern flame: soft roar and a few crackles
    tm = t_(d); x = lp(noise(d), 900) * .5
    for c in R.uniform(0, d, int(d * 5)): i = int(c * SR); k = np.exp(-np.arange(600) / 60) * R.uniform(.4, 1); x[i:i + 600] += (hp(noise(600 / SR), 2500) * k)[:len(x) - i]
    return norm(x * np.minimum(1, tm / .2) * np.minimum(1, (d - tm) / .3)) * v
def ringcreak(v=1.0):   # the lantern's iron ring swinging
    return X.creak(v)
def stepstone(v=1.0):
    d = .09; tm = t_(d); return norm(lp(noise(d), 1400) * env_exp(d, .012) + bp(noise(d), 2000, 6000) * env_exp(d, .004) * .35) * v
def shimmer(d=1.2, v=1.0):   # leaf being burnished: a soft high hiss that rises and fades
    tm = t_(d); return norm(bp(noise(d), 5000, 11000) * np.sin(np.pi * tm / d) ** 2) * v
def brush(d=.25, v=1.0):
    tm = t_(d); return norm(bp(noise(d), 2500, 9000) * np.sin(np.pi * tm / d) ** 1.2 * (.7 + .3 * np.sin(tm * 160))) * v

room = hp(lp(brown(DUR + 6), 300), 60) * .25
add(amb, norm(room)[:N + PAD], 0, .035, 0)

# ---------------------------------------------------------------- 1 (0-6): far bell; drone; a slow harp in D dorian; the leaf shimmers
Sn('tubular_bells', 'D4', one('bell_far'), 5.0, .38, -.3, .22)
Sn('organ_soft', 'D3', .3, 6.2, .3, 0, .17, attack=1.2); Sn('organ_soft', 'A3', 1.1, 5.4, .28, 0, .12, attack=1.0)
for j, n in enumerate(['D4', 'A4', 'F5', 'E5', 'D5', 'A4', 'C5', 'D5', 'E5', 'A4']): Sn('harp', n, 1.2 + j * .48, 2.2, .36, .25 - .05 * j, .3)
add(fx, shimmer(2.4), .2, .03, .2)
Sn('glockenspiel', 'A6', 1.4, 1.4, .25, .3, .08)
add(amb, wind(13.0), 0, .05, -.2)
# ---------------------------------------------------------------- 2 (6-12.6): harp ostinato, a plain violin line; a star glints; the sun goes out to one held note
for k in range(13): Sn('harp', ['D3', 'A3', 'F4', 'A3', 'C4', 'G3', 'E4', 'G3'][k % 8], 5.4 + k * .32, 1.0, .34, .3, .26)
for n, s, l in [('A4', 0, .55), ('C5', .55, .35), ('D5', .9, .9), ('E5', 1.8, .35), ('F5', 2.15, .5), ('E5', 2.65, .35), ('D5', 3.0, .9)]: Sn('violin', n, 5.6 + s * .92, l * .97, .48, -.15, .3, attack=.06)
sg = one('star_glint'); Sn('glockenspiel', 'A6', sg, 1.6, .5, -.4, .2); Sn('hand_chimes', 'E6', sg + .03, 2.2, .4, -.4, .14)
bo = one('band_out')
Sn('organ_soft', 'D3', 5.4, bo - 5.4 + .3, .28, 0, .15, attack=.3)
for j, n in enumerate(['D6', 'A5', 'F5', 'D5', 'A4']): Sn('glockenspiel', n, bo + .25 + j * .3, 1.1, .3 - .04 * j, .35, .1)
Sn('organ_soft', 'A3', bo, one('cut_lamp') + .15 - bo, .36, 0, .2, attack=.25)
# ---------------------------------------------------------------- 3 (12.6-18.4): the lamp in the quatrefoil; the climb begins
cl = one('cut_lamp')
Sn('hand_chimes', 'D5', cl, 2.6, .45, 0, .18); add(fx, flame(5.8), cl, .05, .1)
Sn('organ_soft', 'D3', cl, 5.9, .3, 0, .14, attack=.5); Sn('organ_soft', 'F3', cl + .4, 5.5, .26, 0, .1, attack=.6)
for k in range(11): Sn('harp', ['D4', 'F4', 'A4', 'C5', 'A4', 'F4'][k % 6], cl + .2 + k * .4, 1.4, .33, .25, .24)
tune = [('D5', 0, .5), ('E5', .5, .25), ('F5', .75, .5), ('G5', 1.25, .25), ('A5', 1.5, 1.0), ('G5', 2.5, .25), ('F5', 2.75, .5), ('E5', 3.25, .25), ('D5', 3.5, 1.2)]
for n, s, l in tune: Sn('recorder', n, cl + .6 + s * .8, l * .82, .42, -.2, .22, attack=.04)
ll = one('lamp_lift'); add(fx, ringcreak(1), ll, .06, .2); Sn('glockenspiel', 'D6', ll + .1, 1.2, .3, .2, .1)
pf = one('push_frame'); add(fx, whoosh(1.6), pf + .2, .05, 0)
for j, n in enumerate(['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'A5', 'D6']): Sn('harp', n, pf + .8 + j * .06, 1.6, .4, -.3 + .05 * j, .2)
# ---------------------------------------------------------------- 4 (film 16.4-24.4): the walk, on a beat grid of .4 s; every piece of gold her lamp wakes rings on the grid, a step higher
ws = one('walk_start'); B0, BT = 16.4, .4
RW0, RW1, CW0, CW1 = NT(22.25), NT(23.0), NT(25.25), NT(26.0)   # the two wipes (rock, cloud)
gap = lambda tt: RW0 < tt < RW1 or CW0 < tt < CW1
for k, tt in enumerate(np.arange(ws, NT(29.3), .34)):
    if not gap(tt): add(fx, stepstone(), tt, .045 + .01 * (k % 2), .1 * (1 if k % 2 else -1))
for k, tt in enumerate(np.arange(B0, 24.4, BT)):
    if gap(tt): continue
    if k % 2 == 0: Hit('frame_drum', 'large', tt, .34, -.05, .22)
    else: Hit('frame_drum', 'small', tt, .26, .1, .15)
    if k % 4 == 3: Hit('tambourine', None, tt + .2, .2, .3, .07)
pat = ['D3', 'A3', 'D4', 'F4', 'C4', 'G3', 'C4', 'E4', 'B2', 'F3', 'B3', 'D4', 'A2', 'E3', 'A3', 'C#4']
for k, tt in enumerate(np.arange(B0, 24.4, BT / 2)):
    if not gap(tt): Sn('harp', pat[k % 16], tt, .7, .32 + .06 * (k % 4 == 0), .28, .22)
for c, s_ in [(['D3', 'A3'], 16.4), (['C3', 'G3'], 18.0), (['B2', 'F3'], 19.6), (['A2', 'E3'], 21.2), (['D3', 'A3'], 22.4)]:
    for n in c: Sn('organ_soft', n, s_, 1.7, .26, 0, .1, attack=.25)
walk = [('A4', 0, .4), ('D5', .4, .4), ('E5', .8, .2), ('F5', 1.0, .6), ('E5', 1.6, .4), ('D5', 2.0, .4), ('C5', 2.4, .4), ('A4', 2.8, .8)]
for base in [16.4, 20.0]:
    for n, s_, l in walk: Sn('violin', n, base + s_, l * 1.04, .44, -.15, .24, attack=.04)
for i, tt in enumerate(groups(at('gold_lit'), .14)):
    tq = B0 + round((tt - B0) / (BT / 2)) * (BT / 2)   # on the eighth-note grid
    Sn('glockenspiel', UP[min(i, 13)], tq, 1.1, .4, .35 * np.sin(i), .15)
    if i % 2 == 0: Sn('hand_chimes', UP[min(i, 13)], tq + .01, 1.6, .32, .35 * np.sin(i), .08)
rw = one('rock_wipe'); add(fx, whoosh(.8), rw, .08, .4); add(fx, X.thump(.6, 55), rw + .38, .05, 0)
cw = one('cloud_wipe'); add(fx, whoosh(1.0), cw, .06, 0); add(amb, wind(2.0), cw - .2, .07, .1)
Sn('harp', 'D4', cw + .45, 1.8, .4, -.2, .2); Sn('harp', 'A4', cw + .5, 1.8, .38, -.1, .18); Sn('harp', 'D5', cw + .55, 1.8, .36, 0, .16)
# ---------------------------------------------------------------- 5 (28-33.2): the summit. only a held note and the wind, then 0.8 s of near-silence
sm = one('summit'); si = 27.95   # 0.6 s of near-silence after line 7, before the close-up
Sn('organ_soft', 'D3', sm, si - sm + .2, .32, 0, .16, attack=.4); Sn('organ_soft', 'A3', sm + .2, si - sm, .28, 0, .1, attack=.6)
Sn('organ_pedal', 'D2', sm, si - sm + .2, .3, 0, .06, attack=.8)
add(amb, wind(si - sm + .8), sm, .09, -.1)
add(fx, flame(3.0), sm, .03, .2)
# ---------------------------------------------------------------- 6 (33.2-39.2): she lifts the lamp; the flame touches the leaf; the fullest bar; the stars
cs = one('close'); lf = one('lift'); tc = one('touch'); cw6 = one('cut_wide')
add(fx, ringcreak(.8), lf, .06, .1); add(amb, wind(3.0), cs, .05, -.2)
for j, n in enumerate(['A3', 'D4', 'E4', 'F4', 'A4']): Sn('harp', n, cs + .3 + j * .38, 1.6, .34 + .03 * j, .2, .2)
Sn('organ_soft', 'A3', cs + .2, tc - cs, .3, 0, .14, attack=.6)
Hit('sus_cymbal', 'cresc', tc - 1.5, .38, .1, .14)
Sn('tubular_bells', 'D4', tc, 4.5, .7, 0, .46); Sn('tubular_bells', 'A4', tc + .02, 4.0, .5, .2, .24); Hit('frame_drum', 'large', tc, .7, 0, .42)
Sn('timpani', 'D3', tc, 2.0, .8, 0, .5); Sn('timpani', 'D3', cw6, 2.0, .75, 0, .45); Sn('timpani', 'A2', cw6 + .4, 1.5, .55, 0, .3)
for j, n in enumerate(['D5', 'F#5', 'A5', 'D6', 'F#6', 'A6']): Sn('glockenspiel', n, tc + .15 + j * .16, 1.2, .38, -.3 + .12 * j, .12)
K6 = .8   # the fullest music of the film: bars of 6/8 at dotted quarter = .4 s, on D major
for b in range(4):
    t0 = tc + b * K6
    Hit('frame_drum', 'large', t0, .65, -.1, .36); Hit('frame_drum', 'small', t0 + .27, .4, .1, .22); Hit('frame_drum', 'large', t0 + .4, .5, -.1, .28); Hit('tambourine', None, t0 + .13, .25, .3, .09)
full = [('D5', 0, .5), ('F#5', .5, .33), ('G5', .83, .17), ('A5', 1.0, .5), ('D6', 1.5, .25), ('C6', 1.75, .25), ('A5', 2.0, .33), ('G5', 2.33, .17), ('A5', 2.5, .5), ('F#5', 3.0, .5), ('D5', 3.5, 1.2)]
for n, s, l in full: Sn('violin', n, tc + s * K6, l * K6 * 1.05, .68, -.15, .44, attack=.03)
for n, s, l in [('A4', 0, 1.0), ('D5', 1.0, 1.0), ('C5', 2.0, 1.0), ('A4', 3.0, 1.6)]: Sn('violas', n, tc + s * K6, l * K6, .52, .2, .28, attack=.06)
for ch_, s in [(['D3', 'A3', 'D4', 'F#4'], 0), (['G3', 'D4', 'G4', 'B4'], 1.0), (['C3', 'G3', 'C4', 'E4'], 2.0), (['D3', 'A3', 'D4', 'F#4'], 3.0)]:
    for j, n in enumerate(ch_): Sn('organ_soft', n, tc + s * K6, .85 if s < 3 else 2.2, .48, -.2 + .13 * j, .18, attack=.05)
for k in range(24): Sn('harp', ['D4', 'A4', 'D5', 'F#5', 'G3', 'D4', 'G4', 'B4', 'C4', 'G4', 'C5', 'E5'][k % 12], tc + k * .1333, .8, .44, .3, .25)
add(fx, whoosh(.6), cw6 - .3, .04, -.3); Hit('frame_drum', 'large', cw6, .5, 0, .22)
for i, tt in enumerate(groups(at('star'), .1)): Sn('glockenspiel', ['A6', 'F#6', 'D6', 'A5', 'F#6', 'E6', 'D6', 'B5', 'A5', 'F#5', 'E6', 'D6'][i % 12], tt, .9, .3, .5 - .08 * i, .1)
# ---------------------------------------------------------------- 7 (39.2-46): the light goes down the path; she is painted in four more places (a hand bell each); the border grows
bd = one('band_down')
for k in range(int((NT(46.0) - bd) / .25)): Sn('harp', ['D4', 'A4', 'F#5', 'A4', 'G3', 'D4', 'B4', 'D4', 'A3', 'E4', 'C#5', 'E4', 'D4', 'A4', 'D5', 'A4'][k % 16], bd + k * .25, .9, .3, .25, .2)
for c, s in [(['D3', 'A3', 'F#4'], bd), (['G3', 'D4', 'B4'], bd + 2.0), (['A3', 'E4', 'C#5'], bd + 4.0), (['D3', 'A3', 'F#4'], bd + 5.4)]:
    for n in c: Sn('organ_soft', n, s, 2.2, .26, 0, .1, attack=.4)
for n, s, l in [('F#5', 0, .75), ('E5', .75, .25), ('D5', 1.0, .5), ('A4', 1.5, 1.0), ('B4', 2.5, .5), ('C#5', 3.0, .5), ('D5', 3.5, .5), ('E5', 4.0, .5), ('F#5', 4.5, .5), ('A5', 5.0, 1.4)]:
    Sn('recorder', n, bd + .3 + s, l * 1.02, .4, -.2, .2, attack=.04)
for e in [e for e in ev if e['type'] == 'paint']:
    n = ['D6', 'A5', 'F#5', 'D5'][3 - e['i']]; Sn('hand_chimes', n, e['t'], 2.4, .5, -.3 + .2 * e['i'], .22); add(fx, brush(.5), e['t'] + .3, .02, .1)
Sn('tubular_bells', 'D3', one('border'), 4.0, .35, 0, .14); add(fx, shimmer(1.8), one('border') + .2, .02, 0)
Sn('tubular_bells', 'A3', one('border_full'), 4.0, .3, .2, .12)
# ---------------------------------------------------------------- 8 (46-51): the plaque, lettered in bole, gilded, flashed; D major to the end
pq = one('plaque'); bl = one('bole'); gd = one('gild'); tf = one('title_flash'); wr = one('write')
for j, n in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4']): Sn('organ_soft', n, NT(45.8), DUR - NT(45.8) + 2, .42, -.25 + .12 * j, .26, attack=.6)
Sn('organ_pedal', 'D2', NT(45.8), DUR - NT(45.8) + 2, .3, 0, .05, attack=.8)
for k in range(6): add(fx, brush(.22 + .08 * R.random()), bl + k * .1, .03, R.uniform(-.2, .2))
add(fx, shimmer(1.0), gd, .03, .1)
for j, n in enumerate(['D5', 'F#5', 'A5', 'D6']): Sn('glockenspiel', n, tf + j * .07, 1.8, .4, -.15 + .1 * j, .13)
Sn('hand_chimes', 'A5', tf, 3.0, .4, 0, .14)
for k in range(5): add(fx, brush(.2), wr + .05 + k * .14, .02, .1)
for j, n in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5', 'A5']): Sn('harp', n, pq + .1 + j * .07, 3.4, .5, -.3 + .08 * j, .36)
for k in range(14): Sn('harp', ['D4', 'A4', 'D5', 'F#5', 'A5', 'F#5', 'D5'][k % 7], tf + .4 + k * .25, 1.2, .36, .25, .2)
for n, s_, l in [('A4', 0, .75), ('D5', .75, .75), ('E5', 1.5, .5), ('F#5', 2.0, 1.6)]: Sn('recorder', n, tf + .3 + s_, l, .4, -.2, .22, attack=.05)
Sn('violin', 'F#5', pq + .2, 1.6, .5, -.1, .34, attack=.1); Sn('violin', 'D5', pq + 1.8, 2.8, .48, -.1, .3, attack=.12)
Sn('tubular_bells', 'D4', DUR - 3.4, 3.6, .38, .3, .2)

# ---------------------------------------------------------------- voice
L = json.load(open(os.path.join(HERE, 'voice', 'lines.json')))
voice = np.zeros(N + PAD)
for l in L:
    x, sr = sf.read(os.path.join(HERE, 'out', 'voice', l['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    x = hp(soxr.resample(x, sr, SR), 80); s = int(l['t'] * SR); voice[s:s + len(x)] += x
voice = compress(voice, thr=.12, ratio=3.0, att=.003, rel=.12)
act = maximum_filter1d((np.abs(voice) > .01).astype(float), size=int(.25 * SR)); act = uniform_filter1d(act, size=int(.12 * SR))
vr = np.sqrt((voice[act > .5] ** 2).mean()); voice *= .12 / vr

# ---------------------------------------------------------------- mix
mus = S.room(mus, size=.55, mix=.24); fx = S.room(fx, size=.3, mix=.1)
for ch in range(2):
    mid = bp(mus[:, ch], 300, 4000, 2); mus[:, ch] = (mus[:, ch] - .35 * mid * act) * (1 - .2 * act)
    fx[:, ch] *= 1 - .2 * act
mus *= 3.4; fx *= 1.8; amb *= 1.5
mrms = np.sqrt((mus[act > .5] ** 2).mean())
print('voice over music while speaking (dB):', round(20 * np.log10(.12 / mrms), 1))
mix = (mus + fx + amb + np.stack([voice, voice], 1))[:N]
for c_ in range(2): mix[:, c_] = hp(mix[:, c_], 40)
fade = np.clip((DUR - t_(DUR)[:N]) / 1.4, 0, 1) ** 1.3; mix *= fade[:, None]
mix[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))[:, None]
mix = np.stack([compress(mix[:, 0], thr=.35, ratio=2.2), compress(mix[:, 1], thr=.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1).astype(np.float32)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(S.credits(sorted(USED))))
print('mix.wav', round(len(mix) / SR, 3), 's  peak', round(float(np.abs(mix).max()), 3), ' instruments:', ', '.join(sorted(USED)))
