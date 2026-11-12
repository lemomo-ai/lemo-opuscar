"""Sound for The Long Way Down: narration + one score + foley, all on the film's own timeline (film seconds), then the slice.

96 bpm, a bar = 2.5 s, the 52 s run into a 21st bar (the sign-off). Each scale has its own colour in the same key (D): airy bowed vibraphone for space,
a walking marimba for Earth, warm nylon guitar for the hand, pizzicato cellos in D minor for the blood, bells for the virus,
and everything together for the finale. Two real silences: the wind-up before the first shot of dots (5.3 s) and the moment
inside Orbi's lens (41.6 s). Foley is driven by the page's events (out/events.json, slice-relative).
Narration: vo/<id>.wav (Kokoro, af_heart), placed at the 'vo' events, compressed, music ducked under it and dipped 300 Hz–4 kHz.
Writes out/mix.wav (48 kHz stereo) and out/cues.json (subtitles for the .srt). Usage (from the library root):
  .venv/bin/python styles/flat-space-explainer/demo/mix.py [--from 0] [--to 52] [--fade 0.35] [--novo]
"""
import json, os, sys, argparse
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, clack, whoosh, thump, pop, ding, brown, heartbeat

ap = argparse.ArgumentParser(); ap.add_argument('--from', dest='a', type=float, default=0); ap.add_argument('--to', dest='b', type=float, default=52)
ap.add_argument('--fade', type=float, default=0.35); ap.add_argument('--novo', action='store_true')
A = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__))
EVJ = json.load(open(os.path.join(HERE, 'out', 'events.json')))
DUR = A.b - A.a; N = int(round(DUR * SR))
rng = np.random.default_rng(17)
BEAT = 0.625

# =============== score (film seconds) ===============
D2, Fs2, G1, A1, B1 = 38, 42, 31, 33, 35
ev = []
def E(t, inst, p, d, v, pan=0.0, gain=1.0, **kw): ev.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=gain, **kw))
# --- bars 1-4 (0-10): cold open, title, aim, lock
E(0.0, 'vibraphone_bowed', 69, 2.7, .4, -.2, 1.6, attack=.35); E(0.0, 'vibraphone_bowed', 76, 2.7, .34, .2, 1.6, attack=.5)
E(0.58, 'glockenspiel', 93, .6, .22, 0)
E(1.04, 'hand_chimes', 88, 1.2, .3, 0)
scale = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86]
for i, p in enumerate(scale): E(1.25 + 1.2 * (i / len(scale)) ** 0.8, 'harp', p, .8, .3 + .25 * i / len(scale), -.4 + .8 * i / len(scale))
E(2.5, 'contrabass_pizz', D2, 1.2, .72, 0); E(3.75, 'contrabass_pizz', D2 + 7, 1.0, .6, 0); E(4.375, 'contrabass_pizz', Fs2, .8, .5, 0)
for p in [54, 57, 61, 64]: E(2.5, 'vibraphone', p, 2.4, .38, .1)
for t, p in zip([2.5, 2.8125, 3.125, 3.4375], [69, 74, 78, 81]): E(t, 'violins_pizz', p, .6, .5, -.45)
for i, p in enumerate([74, 76, 78, 81, 83, 86, 88, 90]): E(4.05 + 0.7 * (i / 8) ** 1.6, 'xylophone', p, .4, .26 + .03 * i, .45)
E(4.72, 'glockenspiel', 86, .9, .3, .45)
E(5.0, 'contrabass_pizz', B1 + 12, 1.0, .65, 0)
for p in [62, 66, 69, 73]: E(5.0, 'vibraphone', p, .3, .36, -.1)
E(5.625, 'contrabass_pizz', G1 + 12, 1.0, .7, 0); E(6.875, 'contrabass_pizz', D2, .8, .55, 0)
for p in [59, 62, 66, 69]: E(5.625, 'vibraphone', p, 1.8, .4, .1)
for i in range(12): E(6.25 + i * 0.078, 'harp', [55, 59, 62, 66, 69, 71, 74, 78, 81, 83, 86, 90][i], .7, .3 + .02 * i, -.3 + .06 * i)
E(7.5, 'glockenspiel', 86, 1.5, .5, .1); E(7.5, 'glockenspiel', 93, 1.5, .4, .2); E(7.5, 'triangle', 'open', None, .35, .3)
E(7.5, 'timpani', 45, 1.5, .35, 0); E(7.5, 'contrabass_pizz', G1 + 12, 1.0, .65, 0)
for p in [59, 62, 66, 69]: E(7.5, 'vibraphone', p, .6, .36, 0)
for i, p in enumerate([81, 86, 88]): E(8.12 + i * 0.078, 'glockenspiel', p, .7, .3 + .05 * i, -.3)
E(8.125, 'contrabass_pizz', A1 + 12, 1.2, .6, 0)
for p in [57, 62, 64, 69]: E(8.125, 'vibraphone', p, 1.9, .4, 0)
E(8.75, 'vibraphone_bowed', 69, 1.6, .32, -.2, 1.4, attack=.3); E(8.75, 'vibraphone_bowed', 74, 1.6, .28, .2, 1.4, attack=.4)
E(9.4, 'glockenspiel', 88, .5, .2, -.3)
def shaker(t0, t1, v=.12, skip=()):
    for k in range(int(round((t1 - t0) / (BEAT / 4)))):
        t = t0 + k * BEAT / 4
        if any(a <= t < b for a, b in skip): continue
        E(t, 'shaker', None, None, v * (1.8 if k % 4 == 0 else 1), .25)
shaker(5.0, 8.75, .12, [(5.3, 5.6)])
# --- bar 5 (10-12.5): the dive. harp falls, a cymbal swells into the arrival
for i, p in enumerate(reversed(scale)): E(10.0 + 1.7 * (i / 16) ** 1.2, 'harp', p, .7, .28 + .2 * i / 16, .4 - .8 * i / 16)
E(10.3, 'sus_cymbal', 'cresc', None, .45, 0, .8)
E(12.0, 'timpani', 38 + 12, 1.6, .5, 0); E(12.0, 'contrabass_pizz', D2, 1.4, .7, 0)
# --- bars 5-7 (12-17): the Solar System. a bowed pad, the light walks on eighth-note glockenspiel
for p in [57, 62, 64, 68]: E(12.0, 'vibraphone_bowed', p, 4.6, .26, -.3 + .2 * (p % 4), attack=.6)
light = [62, 64, 66, 68, 69, 71, 73, 74, 76, 78]
for i in range(10): E(12.6 + i * 0.3125, 'glockenspiel', light[i] + 12, .5, .22 + .02 * i, -.5 + .1 * i)
E(14.375, 'contrabass_pizz', D2 + 7, 1.0, .55, 0)
E(15.6, 'hand_chimes', 86, 1.4, .45, .2); E(15.6, 'triangle', 'open', None, .3, .2); E(15.6, 'contrabass_pizz', D2, 1.0, .6, 0)
for i, p in enumerate(scale[4:]): E(16.2 + 0.75 * (i / 12) ** 0.9, 'harp', p, .6, .3 + .02 * i, -.2 + .04 * i)
# --- bars 7-10 (17-25.9): Earth. a walking marimba and pizz bass, D major
E(17.0, 'timpani', 45, 1.2, .4, 0)
prog = [(17.5, [50, 54, 57, 62]), (20.0, [55, 59, 62, 66]), (22.5, [57, 61, 64, 69]), (25.0, [50, 54, 57, 62])]
for t0, ch in prog:
    E(t0, 'contrabass_pizz', ch[0] - 12, 1.0, .65, 0); E(t0 + 1.25, 'contrabass_pizz', ch[2] - 12, .8, .5, 0)
    for k in range(8):
        t = t0 + k * BEAT / 2
        if t >= 25.9: break
        E(t, 'marimba', ch[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12, .3, .26 + .05 * (k % 2 == 0), .2)
shaker(17.5, 25.6, .08)
E(19.4, 'glockenspiel', 81, .8, .3, -.4)
E(21.4, 'glockenspiel', 88, 1.0, .3, -.3); E(21.4, 'hand_chimes', 81, 1.0, .25, -.3)
E(24.5, 'glockenspiel', 86, 1.0, .35, -.6)
# --- 25.9-27.6: the clouds. music thins to a swell and a fall
E(25.9, 'sus_cymbal', 'cresc', None, .4, 0, .7)
for i, p in enumerate(reversed(scale[3:])): E(25.95 + 1.1 * (i / 13), 'harp', p, .5, .25 + .015 * i, .3 - .05 * i)
# --- bars 11-13 (27.6-33.6): the hand. warm nylon guitar, G major, the "real size" chord at 30.85
gtr = [(27.6, [43, 50, 55, 59, 62]), (30.1, [48, 55, 60, 64, 67]), (32.6, [45, 52, 57, 61, 64])]
for t0, ch in gtr:
    for k in range(8):
        t = t0 + k * BEAT / 2
        if t >= 33.5: break
        E(t, 'guitar_nylon', ch[[0, 2, 3, 4, 1, 3, 2, 4][k]], .7, .35 + .07 * (k % 4 == 0), -.25)
E(28.45, 'contrabass_pizz', G1 + 12, 1.2, .55, 0)
for p in [55, 59, 62, 66, 71]: E(30.85, 'vibraphone', p, 2.0, .42, .1)
E(30.85, 'harp', 79, 1.2, .4, .3); E(30.95, 'harp', 83, 1.2, .38, .35); E(31.05, 'harp', 86, 1.2, .36, .4)
E(31.1, 'marimba', 79, .5, .4, .2)
E(32.5, 'glockenspiel', 86, 1.0, .35, .1)
# --- 33.6-35.0: through the skin: low thumps (heartbeat comes from the foley)
E(33.8, 'timpani', 38 + 12, 1.0, .35, 0); E(34.25, 'contrabass_pizz', D2, 1.0, .6, 0)
# --- bars 14-16 (35-40.9): the blood. D minor, pizzicato cellos, a low bowed drone, a sting on "hunt"
E(35.0, 'contrabass', 38, 5.6, .3, 0, .7, attack=.5)
for k in range(int((40.6 - 35.0) / (BEAT / 2))):
    t = 35.0 + k * BEAT / 2
    E(t, 'cellos_pizz', [50, 57, 53, 57, 50, 57, 55, 57][k % 8], .4, .42 + .08 * (k % 4 == 0), -.2)
E(38.7, 'violins_trem', 75, 1.1, .32, .3, attack=.05); E(38.7, 'violins_trem', 76, 1.1, .3, .4, attack=.05)
E(38.7, 'timpani', 45, 1.0, .5, 0)
for i, p in enumerate([96, 93, 89, 86, 81]): E(38.9 + i * 0.045, 'xylophone', p, .3, .45, -.4)
for p in [50, 54, 57, 62, 66]: E(40.0, 'vibraphone', p, 1.4, .4, 0)
# --- 40.9-42.2: into the lens. a glass swell, then near-silence inside the eye
for i, p in enumerate([74, 78, 81, 86, 90]): E(40.9 + i * 0.12, 'glass', p, .6, .3 + .04 * i, .1 * i - .2)
# --- bars 17-18 (42.2-45.8): the virus. bells and a high bowed pad
for p in [62, 69, 76]: E(42.2, 'vibraphone_bowed', p, 3.6, .28, 0, 1.0, attack=.4)
E(42.2, 'hand_chimes', 86, 1.8, .45, .1); E(42.2, 'hand_chimes', 81, 1.8, .35, -.2)
for t, p in [(43.125, 88), (43.75, 86), (44.375, 81), (45.0, 83)]: E(t, 'glockenspiel', p, .8, .25, .3)
E(43.7, 'marimba', 62, .5, .35, .1)
# --- bars 19-20 (45.8-50): the finale, everything together
E(45.8, 'harp', 50, 1.2, .5, -.3); E(45.8, 'contrabass_pizz', D2, 1.2, .7, 0)
for p in [54, 57, 61, 64]: E(45.8, 'vibraphone', p, 1.4, .38, .1)
for t0, ch in [(46.6, [50, 54, 57, 62]), (47.85, [47, 54, 59, 62])]:
    E(t0, 'contrabass_pizz', ch[0] - 12, 1.0, .6, 0)
    for k in range(4): E(t0 + k * BEAT / 2, 'marimba', ch[k] + 12, .3, .3, .2)
stopnotes = [74, 78, 81, 83, 86, 90]
for e in EVJ['ev']:
    if e['type'] == 'stop': E(e['t'] + A.a, 'glockenspiel', stopnotes[e['i']], 1.0, .4 + .04 * e['i'], e.get('pan', 0))
for i, p in enumerate(scale[6:]): E(48.35 + 0.4 * i / 10, 'harp', p, .5, .35 + .02 * i, -.3 + .06 * i)
for p in [50, 57, 62, 66, 69, 74]: E(49.15, 'vibraphone', p, 2.0, .48, 0)
E(49.15, 'contrabass_pizz', D2, 1.2, .75, 0); E(49.15, 'timpani', 50, 1.5, .4, 0); E(49.15, 'triangle', 'open', None, .4, .3)
E(49.15, 'glockenspiel', 86, 1.2, .5, .2); E(49.3, 'glockenspiel', 93, 1.0, .35, .3)
# the sign-off: the chord blooms into a bowed pad and two last bells, dying away by 52 s
for p in [62, 66, 69, 74]: E(49.6, 'vibraphone_bowed', p, 2.2, .3, -.2 + .1 * (p % 4), 1.0, attack=.4, release=.5)
E(49.1, 'glockenspiel', 81, 1.4, .3, .4); E(50.4, 'hand_chimes', 86, 1.6, .3, .2); E(51.2, 'glockenspiel', 93, .6, .18, .3)
shaker(46.6, 49.1, .1)

S.seed(3)
evs = [dict(e) for e in ev if A.a - 4 <= e['t'] < A.b]
for e in evs: e['t'] -= A.a
music = S.render(evs, dur=DUR + 3, master=False) if evs else np.zeros((N + 3 * SR, 2), np.float32)
music = S.room(music, size=.5, mix=.22)[:N]
music = np.stack([hp(music[:, 0], 45), hp(music[:, 1], 45)], 1)

# =============== narration ===============
vo = np.zeros(N); vo_env = np.zeros(N); cues = []
if not A.novo:
    for e in EVJ['ev']:
        if e['type'] != 'vo': continue
        x, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        x = resample_poly(x, SR, sr)
        x = hp(x, 90); x = compress(x / (np.abs(x).max() + 1e-9) * .8, thr=.18, ratio=3.0)
        i0 = int(e['t'] * SR); i1 = min(N, i0 + len(x))
        if i1 > i0: vo[i0:i1] += x[:i1 - i0]
        a0, a1 = max(0, i0 - int(.25 * SR)), min(N, i1 + int(.35 * SR)); vo_env[a0:a1] = 1
        cues.append({'t0': e['t'], 't1': e['t1'] - A.a if 't1' in e else e['t'] + e['dur'] + .6, 'text': e['cn'] + '\n' + e['en']})
    k = int(.2 * SR); vo_env = np.convolve(vo_env, np.ones(k) / k, 'same')
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# =============== foley (slice seconds, from the page) ===============
fx = np.zeros((N, 2))
def tt_(d): return np.arange(int(d * SR)) / SR
def servo(d, pitch):
    t = tt_(d); f = 140 * pitch * (1 + 0.35 * t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 14)); e = np.minimum(1, t / .015) * np.minimum(1, (d - t) / .03)
    return bp(x, 500, 3500) * e
def blip(f, d=.05):
    t = tt_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / .012) * np.minimum(1, t / .002)
def swish(d):
    t = tt_(d); return bp(rng.standard_normal(len(t)), 2500, 8000) * np.sin(np.pi * t / d) ** 2
def puff(d=.3):
    t = tt_(d); return lp(rng.standard_normal(len(t)), 900) * np.exp(-t / .08) * np.minimum(1, t / .01)
def wind(d, lo=200, hi=1800):
    t = tt_(d); x = bp(rng.standard_normal(len(t)), lo, hi); return x * np.sin(np.pi * t / d) ** 1.5
def boing(v=1.0):
    t = tt_(.35); f = 95 * (1 + .25 * np.exp(-t / .02)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .09) + lp(rng.standard_normal(len(t)), 500) * np.exp(-t / .01) * .4) * v
def gulp():
    t = tt_(.3); f = 320 - 220 * t / .3; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .3) ** 2
for e in EVJ['ev']:
    t, k, pn = e['t'], e['type'], e.get('pan', 0)
    if k == 'servo': add(fx, servo(e['d'], e['pitch']), t, .05, pn)
    elif k == 'blink': add(fx, lp(click(.5), 3500), t, .09, pn)
    elif k == 'focus': add(fx, click(.75), t, .13, pn); add(fx, lp(clack(1.2), 5000), t + .01, .06, pn)
    elif k == 'pull': add(fx, lp(whoosh(e['d']), 3500), t, .2, 0)
    elif k == 'word': add(fx, thump(1, 88), t, .16, pn)
    elif k == 'wipe': add(fx, swish(e['d']), t, .025, pn)
    elif k == 'tick': add(fx, hp(click(1.5), 1500), t, .045, pn)
    elif k == 'count': add(fx, hp(click(1.9), 2500), t, .03, pn)
    elif k == 'ringtick': add(fx, pop(), t, .06, pn)
    elif k == 'flap': add(fx, lp(whoosh(.22), 2200), t, .09, pn)
    elif k == 'zoom': add(fx, servo(.16, 1.5), t, .06, pn); add(fx, click(.9), t + .15, .1, pn)
    elif k == 'fire':
        tt = tt_(.14); f = 1500 - 800 * tt / .14; add(fx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .05), t, .09, pn); add(fx, puff(.2), t, .05, pn)
    elif k == 'dot': add(fx, blip(900 * 2 ** (e['i'] / max(1, e['n'] - 1))), t, .03, pn)
    elif k == 'lock': add(fx, clack(.9), t + .2, .13, pn); add(fx, lp(ding(), 6000)[:int(.8 * SR)] * np.exp(-tt_(.8) / .25), t + .2, .05, pn)
    elif k == 'hop': add(fx, puff(.35), t + .1, .16, pn)
    elif k == 'land': add(fx, thump(1, 120), t, .08 * e.get('v', 1), pn)
    elif k == 'dive': add(fx, lp(whoosh(e['d']), 2600), t, .22, 0); add(fx, wind(e['d'], 120, 900), t, .05, 0)
    elif k == 'arrive': add(fx, lp(thump(1, 60), 800), t, .12, pn)
    elif k == 'light':
        n = 40
        for i in range(n): add(fx, blip(1400 + 900 * i / n, .03), t + e['d'] * i / n, .012, -.6 + 1.2 * i / n)
        for i in range(int(e['d'] / .08)): add(fx, hp(click(2.2), 3000), t + i * .08, .012, -.7)   # the clock running
    elif k == 'hit': add(fx, lp(ding(), 7000)[:int(1.2 * SR)] * np.exp(-tt_(1.2) / .4), t, .06, pn)
    elif k == 'push': add(fx, lp(whoosh(e['d']), 3000), t, .16, 0)
    elif k == 'cut': add(fx, lp(thump(1, 70), 900), t, .1, 0)
    elif k == 'draw': add(fx, swish(e['d']) * .7, t, .03, pn)
    elif k == 'tape':
        nT = int(e['d'] / .025)
        for i in range(nT): add(fx, hp(click(1.6 + .2 * (i % 2)), 2000), t + i * .025, .02, pn)
    elif k == 'bounce': add(fx, boing(e.get('v', 1)), t, .13, pn)
    elif k == 'pop': add(fx, pop(), t, .08, pn)
    elif k == 'fall': add(fx, wind(e['d'], 150, 2400), t, .16, 0)
    elif k == 'cloud': add(fx, lp(whoosh(.5), 2000), t - .25, .12, pn)
    elif k == 'joy': add(fx, puff(.25), t, .05, pn)
    elif k == 'grape': add(fx, pop(), t, .07, pn)
    elif k == 'skin': add(fx, lp(thump(1, 90 - 12 * e['i']), 1200), t, .09, 0)
    elif k == 'heart':
        for i in range(4): add(fx, heartbeat(), t + i * 0.82, .22 * (1 - .15 * i), 0)
    elif k == 'hunt': add(fx, lp(thump(1, 55), 600), t, .14, pn)
    elif k == 'scare': add(fx, servo(.12, 2.2), t, .07, pn); add(fx, lp(whoosh(.18), 3000), t, .08, pn)
    elif k == 'gulp': add(fx, gulp(), t, .14, pn)
    elif k == 'lensdive': add(fx, servo(.35, 1.1), t, .06, 0); add(fx, lp(whoosh(.7), 2500), t + .05, .14, 0)
    elif k == 'reveal': add(fx, lp(ding(), 5000)[:int(1.4 * SR)] * np.exp(-tt_(1.4) / .5), t, .04, 0)
    elif k == 'shrink': add(fx, lp(whoosh(e['d']), 2800), t, .12, .3)
    elif k == 'fill': add(fx, swish(.35), t, .04, pn)
# a low room tone; the thruster bed while Orbi flies (bars 1-10 and the finale hop)
tt = np.arange(N) / SR + A.a
thr = lp(brown(DUR + .1)[:N], 380) * np.clip((tt - 1.5) / .7, 0, 1) * np.clip((28.6 - tt) / .3, 0, 1)
fx += np.stack([thr * .018, thr * .012], 1)
room = lp(rng.standard_normal(N), 180) * .006
fx += np.stack([room, np.roll(room, 1499)], 1)

# =============== mix: duck and dip the music under the voice, voice ~10 dB above ===============
duck = 1 - 0.68 * vo_env
mid = np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)
music_d = (music - 0.45 * mid * vo_env[:, None]) * duck[:, None]
fxd = fx * (1 - 0.3 * vo_env)[:, None]
voice = np.stack([vo, vo], 1) * .55
mix = music_d * .85 + fxd + voice
mix = np.stack([compress(mix[:, 0], thr=.3, ratio=2.5), compress(mix[:, 1], thr=.3, ratio=2.5)], 1)
if A.fade > 0:
    f = np.clip((DUR - np.arange(N) / SR) / A.fade, 0, 1); mix *= f[:, None]
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
if not A.novo:   # report: voice vs music RMS where the voice speaks
    m = vo_env > .9
    rv = 20 * np.log10(np.sqrt((voice[m] ** 2).mean()) + 1e-9); rm = 20 * np.log10(np.sqrt(((music_d * .85)[m] ** 2).mean()) + 1e-9)
    print(f'voice RMS {rv:.1f} dB, music under voice {rm:.1f} dB, difference {rv - rm:.1f} dB')
used = sorted({e['inst'] for e in ev})
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'instruments', ', '.join(used))
