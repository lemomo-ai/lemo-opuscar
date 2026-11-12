"""Sound for 《一块纸》 One Piece of Paper (Comic History Cartoon demo): English narration + paper-puppet foley on the page's events + the film's score.

Everything is written in film seconds for the whole 51 s timeline; build.sh exports events for a stretch [FROM, TO)
and this script renders the same stretch.  Run from the library root:
  .venv/bin/python styles/comic-history/demo/mix.py --events out/events.json --from 0 --to 51
Writes out/mix.wav (48 kHz stereo).

Accents (kept for the whole film): the German side = tuba + trombone oom-pah; the French side = accordion.
1940 drops both: low strings and a slow timpani, no comic sounds. The ending plays both accents together.
The narration sits about 10 dB over the music; under it the music's 300 Hz-4 kHz band ducks further.
"""
import json, os, sys, argparse
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump, creak, t_, norm, rumble, ding

ap = argparse.ArgumentParser(); ap.add_argument('--from', dest='frm', type=float, default=0.0); ap.add_argument('--to', type=float, default=51.0)
ap.add_argument('--events', default='events.json'); ap.add_argument('--out', default='out/mix.wav')
A = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, A.events)))
FROM, DUR = A.frm, float(D['dur'])
EV = D['ev']; N = int(round(DUR * SR))
rng = np.random.default_rng(23)
fx = np.zeros((N, 2)); vo = np.zeros((N, 2))


# ---------------------------------------------------------------- paper and puppet foley (synthesized)
def paper_slap(v=1.0, size=1.0):
    d = 0.45; tt = t_(d)
    crack = hp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt / 0.006)
    body = bp(rng.standard_normal(len(tt)), 500, 4500) * np.exp(-tt / (0.035 * size))
    knock = np.sin(2 * np.pi * 95 * tt * (1 - .4 * tt)) * np.exp(-tt / (0.06 * size))
    return norm(crack * .9 + body * 1.0 + knock * .8 * size) * v

def snip(v=1.0):
    d = 0.09; tt = t_(d)
    a = hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / 0.002)
    ring = np.sin(2 * np.pi * 4300 * tt) * np.exp(-tt / 0.012) * .35 + np.sin(2 * np.pi * 6100 * tt) * np.exp(-tt / 0.008) * .2
    shear = bp(rng.standard_normal(len(tt)), 2500, 7000) * np.exp(-((tt - 0.01) / 0.012) ** 2) * .5
    return norm(a + np.roll(a, int(0.018 * SR)) * .6 + ring + shear) * v

def crinkle(d, v=1.0, density=0.004):
    n = int(d * SR); x = (rng.random(n) < density) * rng.standard_normal(n) * 3
    x = bp(x, 1500, 7500) + bp(rng.standard_normal(n), 800, 3000) * .08
    return x * np.sin(np.pi * np.arange(n) / n) ** .6 * v

def rip(d, v=1.0):
    """paper tearing: a dense, accelerating crackle with a fibrous mid band"""
    n = int(d * SR); tt = np.arange(n) / SR
    dens = 0.02 + 0.2 * (tt / d)
    x = (rng.random(n) < dens) * rng.standard_normal(n) * 2
    x = bp(x, 900, 7000) + bp(rng.standard_normal(n), 1200, 4000) * .25
    return norm(x * np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04)) * v

def slide_whistle(d, f0, f1, v=1.0):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); ph = np.cumsum(f) / SR * 2 * np.pi
    x = np.sin(ph) + .25 * np.sin(2 * ph) + bp(rng.standard_normal(len(tt)), 1500, 5000) * .05
    return x * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.04) * v

def puff(v=1.0):
    d = 0.32; tt = t_(d)
    return norm(bp(rng.standard_normal(len(tt)), 400, 2600) * (tt / 0.03).clip(0, 1) * np.exp(-tt / 0.09)) * v

def joint(v=1.0, pitch=1.0): return lp(click(pitch=pitch, v=1.0), 5000) * v

def page_slide(d, v=1.0):   # a sheet sliding under the camera
    return lp(bp(rng.standard_normal(int(d * SR)), 300, 3000) * np.sin(np.pi * np.arange(int(d * SR)) / int(d * SR)) ** 2, 4000) * v

def metal_ping(v=1.0, f=1900):
    d = .6; tt = t_(d)
    return norm(sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / tau) for m, a, tau in [(1, 1, .18), (2.76, .5, .08), (5.4, .3, .04)])) * v

for e in EV:
    t, k, pan = e['t'], e['type'], e.get('pan', 0) * 0.7
    if k == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'), dtype='float32')
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr)
        y = hp(y, 90); y = compress(y / (np.abs(y).max() + 1e-9) * .9, thr=.22, ratio=3.0)
        add(vo, y, t, 1.0, 0.0)
        continue
    if k == 'hop': add(fx, joint(.10, 0.8 + .1 * e.get('i', 0)), t, 1, pan)
    elif k == 'slip': add(fx, paper_slap(.22, .5), t, 1, pan)
    elif k == 'print':
        for j in range(6): add(fx, hp(click(pitch=1.4, v=1), 2500) * .025, t + j * e['d'] / 6, 1, pan)
    elif k == 'fly': add(fx, lp(whoosh(0.3, 1), 6000) * .07, t, 1, pan)
    elif k == 'snip': add(fx, snip(.30), t, 1, pan)
    elif k == 'hathop': add(fx, joint(.08, 1.3), t, 1, pan)
    elif k == 'windup': add(fx, creak(.08), t, 1, pan); add(fx, crinkle(e['d'], .05, .002), t, 1, pan)
    elif k == 'swish': add(fx, hp(whoosh(0.16, 1), 600) * .22, t, 1, pan)
    elif k == 'slap': add(fx, paper_slap(.75, 1.4), t, 1, pan)
    elif k == 'hatoff': add(fx, slide_whistle(0.26, 700, 1500, .07), t + .01, 1, pan); add(fx, slide_whistle(0.30, 1500, 520, .06), t + .26, 1, pan)
    elif k == 'hatland': add(fx, paper_slap(.18, .4), t, 1, pan)
    elif k == 'rub': add(fx, crinkle(e['d'], .16), t, 1, pan)
    elif k == 'stamp': add(fx, thump(.25, 120), t, 1, pan); add(fx, paper_slap(.20, .6), t, 1, pan)
    elif k == 'standup': add(fx, joint(.07, 1.0), t + .05, 1, pan); add(fx, joint(.06, 1.2), t + .3, 1, pan)
    elif k == 'cross': add(fx, joint(.09, 1.1), t + .08, 1, pan); add(fx, joint(.08, .9), t + .22, 1, pan)
    elif k == 'strip': add(fx, lp(whoosh(0.22, 1), 7000) * .08, t, 1, pan); add(fx, hp(crinkle(0.08, 1, 0.02), 2000) * .12, t + .22, 1, pan)
    elif k == 'lift': add(fx, slide_whistle(e['d'], 500, 900, .05), t, 1, pan)
    elif k == 'stomp': add(fx, thump(.55, 60), t, 1, pan); add(fx, paper_slap(.35, 1.0), t, 1, pan)
    elif k == 'puff': add(fx, puff(.16), t, 1, pan)
    elif k in ('pageout', 'slide', 'drop'): add(fx, page_slide(e['d'], .10), t, 1, 0)
    elif k == 'whip': add(fx, hp(whoosh(e['d'], 1), 400) * .2, t, 1, 0)
    elif k == 'tag': add(fx, paper_slap(.16, .45), t + .2, 1, pan)
    elif k == 'stampdown': add(fx, lp(whoosh(e['d'], 1), 3000) * .08, t, 1, 0)
    elif k == 'idstamp': add(fx, thump(.5, 90), t, 1, 0); add(fx, paper_slap(.45, .8), t, 1, 0)
    elif k == 'grab': add(fx, crinkle(.12, .14, .02), t, 1, pan)
    elif k == 'rip': add(fx, rip(e['d'], .5), t, 1, pan)
    elif k == 'smack': add(fx, paper_slap(.5, .7), t, 1, pan)
    elif k == 'helmet': add(fx, metal_ping(.10, 1700), t + .02, 1, pan); add(fx, slide_whistle(.3, 600, 1300, .05), t + .05, 1, pan)
    elif k == 'helmetland': add(fx, metal_ping(.12, 1150), t, 1, pan); add(fx, thump(.15, 140), t, 1, pan)
    elif k == 'handdown': add(fx, lp(rumble(e['d'], 1), 160) * .25, t, 1, 0)
    elif k == 'press': add(fx, thump(.6, 50), t, 1, 0); add(fx, lp(paper_slap(.3, 1.6), 1500), t, 1, 0)
    elif k == 'curl': add(fx, creak(.07), t + .1, 1, 0); add(fx, crinkle(e['d'], .07, .003), t, 1, 0)
    elif k == 'strain':
        for j in range(int(e['d'] / .33)): add(fx, creak(.06), t + j * .33, 1, pan)
        add(fx, crinkle(e['d'], .08, .003), t, 1, pan)
    elif k == 'snapback': add(fx, paper_slap(.35, .5), t + .05, 1, pan); add(fx, slide_whistle(.25, 1300, 500, .05), t, 1, pan)
    elif k == 'fall': add(fx, thump(.35, 80), t, 1, pan)
    elif k == 'thunk': add(fx, thump(.9, 48), t, 1, 0); add(fx, lp(paper_slap(.6, 2.0), 2500), t, 1, 0)
    elif k == 'tilt': add(fx, page_slide(e['d'], .08), t, 1, 0)
    elif k == 'popup': add(fx, joint(.10, 1.1), t, 1, pan); add(fx, lp(click(pitch=.7, v=1), 3000) * .06, t + .08, 1, pan)
    elif k == 'tap': add(fx, lp(paper_slap(.12, .4), 3000), t, 1, pan)
    elif k == 'pin': add(fx, joint(.14, 1.5), t, 1, pan); add(fx, ding(.04), t + .01, 1, pan)
    elif k == 'titleslap': add(fx, paper_slap(.45, 1.0), t, 1, pan)
room = lp(rng.standard_normal(N), 700, 2) * 0.0035
fx += np.stack([room, np.roll(room, 1171)], 1)

# ---------------------------------------------------------------- score (film seconds; 120 bpm, a bar = 2 s, Bb major)
score = []
def ev(t, inst, p, d, v, pan=0.0, g=1.0): score.append((t, inst, p, d, v, pan, g))
OOM = 'tuba_stac'; PAH = ['trombone_stac', 'clarinet_stac']
CH = {'Bb': (34, [53, 58, 62]), 'F7': (29, [57, 63, 65]), 'Eb': (39, [55, 58, 63]), 'Gm': (31, [55, 58, 62]), 'Cm': (36, [55, 60, 63])}
ACC = {'Bb': [58, 62, 65], 'F7': [57, 60, 63], 'Eb': [58, 63, 67], 'Gm': [55, 58, 62], 'Cm': [55, 60, 63]}
def oompah(t, ch, oom=True, pah=True, v=1.0):
    r, voic = CH[ch]
    if oom: ev(t, OOM, r, .4, .62 * v, -.15, 1.0)
    if pah:
        for i, p in enumerate(voic): ev(t + .5, PAH[i % 2], p, .18, .42 * v, .25 - .1 * i, .8)
def musette(t, ch, v=1.0):   # the French accent: accordion chord on 2 and 4, pizz bass on 1 and 3
    r = CH[ch][0] + 12
    ev(t, 'cellos_pizz', r, .4, .55 * v, -.2, .8); ev(t + 1.0, 'cellos_pizz', r + 7, .4, .5 * v, -.2, .7)
    for p in ACC[ch]: ev(t + .5, 'accordion', p, .3, .45 * v, -.4, .45); ev(t + 1.5, 'accordion', p, .3, .42 * v, -.4, .42)

# 0-10: 1871
ev(0.0, 'snare', 'on', None, .45, .1, .5); ev(0.03, 'snare', 'on', None, .6, .1, .6)
oompah(0.0, 'Bb'); oompah(1.0, 'F7')
for i, p in enumerate([77, 82, 86, 89]):
    ev(0.5 + i * .5, 'xylophone', p, .3, .55, .35, .7); ev(0.5 + i * .5, 'woodblock', 'a', None, .5, .3, .45)
oompah(2.0, 'Bb', v=.85)
for p in [61, 64, 67, 70]: ev(2.15, 'accordion', p, .32, .6, -.5, .55)
for i, p in enumerate([82, 81, 80, 79]): ev(2.15 + i * .25, 'xylophone', p, .2, .3, .3, .45)
ev(3.0, 'violins_trem', 89, .95, .22, .2, .35)
ev(4.0, 'gran_cassa', None, None, .8, 0, .9); ev(4.0, 'clash', None, None, .35, .15, .35)
ev(4.0, 'tuba', 34, .5, .85, -.1, 1.0); ev(4.0, 'trombone_stac', 46, .3, .8, .1, .8); ev(4.0, 'trombone_stac', 53, .3, .75, .2, .7)
for p in [62, 65, 68, 71]: ev(4.52, 'accordion', p, .22, .55, -.5, .5)
for p in [62, 65, 68, 71, 74]: ev(4.6, 'accordion', p, .55, .8, -.45, .65)
ev(4.6, 'snare', 'on', None, .5, -.2, .45)
oompah(5.0, 'Eb', v=.9); ev(5.0, 'woodblock', 'c', None, .5, 0, .4)
oompah(6.0, 'Bb'); oompah(7.0, 'F7', v=.9)
for i, p in enumerate([58, 62, 65, 70]): ev(6.4 + i * .25, 'trombone_stac', p, .2, .6, .2, .75)
ev(7.35, 'trombone', 70, .3, .5, .2, .6)
ev(8.0, 'gran_cassa', None, None, .6, -.3, .7); ev(8.0, 'tuba_stac', 29, .3, .7, -.1, .9)
for p in [53, 57, 63]: ev(8.25, 'trombone_stac', p, .15, .55, .15, .65)
ev(8.5, 'tuba', 34, .6, .75, -.1, 1.0)
for i, p in enumerate([53, 58, 62, 65, 70]): ev(8.5, ['trombone', 'trombone', 'horn', 'clarinet', 'trumpet_stac'][i], p, .45, .6, -.2 + .1 * i, .7)
ev(8.5, 'glockenspiel', 94, 1.2, .3, .3, .35)
for p in [57, 60, 63]: ev(9.1, 'accordion', p, .5, .25, -.5, .3)
# 10-16.2: meanwhile in Alsace. Glockenspiel and pizz, a little music-box tune; it stops dead at the stamp
for b, ch in enumerate(['Bb', 'Gm', 'Eb']):
    t0 = 10.0 + b * 2.0 + (1.0 if b else 0.5)
    r = CH[ch][0] + 24
    for j in range(4 if b else 3):
        tj = t0 + j * .5
        if tj >= 15.15: break
        ev(tj, 'cellos_pizz', r if j % 2 == 0 else r + 7, .3, .45, -.15, .6)
for i, p in enumerate([77, 79, 82, 81, 79, 77, 74, 77, 79, 77, 74, 72]):
    tj = 11.2 + i * .33
    if tj < 15.1: ev(tj, 'glockenspiel', p, .4, .28, .3, .3)
ev(T_STAMP := 15.2, 'tuba', 34, .25, .7, -.1, .8); ev(15.55, 'tuba', 33, .7, .65, -.1, .8)   # a sinking two-note "oh no"
# 16.8-26.2: 1918. The French take the tune: accordion musette, snare brushes, then the slap and a flourish
musette(17.0, 'Bb', .8); musette(19.0, 'F7', .9); musette(21.0, 'Bb', .6)
mel = [(18.0, 70), (18.25, 72), (18.5, 74), (19.0, 77), (19.5, 74), (20.0, 72), (20.5, 70), (21.0, 74)]
for tj, p in mel: ev(tj, 'accordion', p, .22, .5, -.35, .45)
ev(T_RIP := 20.75, 'xylophone', 86, .3, .4, .2, .5)
ev(22.6, 'gran_cassa', None, None, .7, 0, .8); ev(22.6, 'clash', None, None, .3, .1, .3)
for p in [58, 62, 65, 70]: ev(22.6, 'accordion', p, .5, .75, -.4, .6)
ev(22.6, 'tuba', 34, .4, .6, -.1, .8)
for i, p in enumerate([70, 74, 77, 82]): ev(22.9 + i * .08, 'accordion', p, .2, .55, -.3, .5)
musette(23.4, 'Eb', .7); musette(24.6, 'Bb', .6)
# 26.9-33.4: 1940. No jokes. Low strings in G minor, a slow timpani like footsteps, the press, the curl
for p, v in [(43, .45), (50, .35), (55, .3)]: ev(26.7, 'cellos', p, 6.4, v, -.1, .7)
ev(26.7, 'contrabass', 31, 6.4, .45, 0, .8)
for j in range(6): ev(27.2 + j * 1.0, 'timpani', 50 if j % 2 else 43, 1.0, .32, 0, .5)
ev(29.3, 'gran_cassa', None, None, .5, 0, .6)
ev(30.3, 'violins_trem', 74, 3.0, .2, .2, .35); ev(30.3, 'violas', 70, 3.0, .22, -.2, .4)
# 34.1-38: 1944-45. A snare roll that builds under the tug-of-war, the fall, then the THUNK
ev(34.6, 'snare', 'roll', None, .3, .1, .35)
for j in range(5): ev(35.0 + j * .4, 'snare', 'on', None, .25 + .05 * j, .1, .4)
for p in [46, 53]: ev(35.0, 'trombone', p, 1.9, .4, .1, .45)
ev(T_LETGO := 36.95, 'xylophone', 89, .2, .45, -.3, .5); ev(37.15, 'xylophone', 77, .3, .4, -.3, .5)
ev(37.7, 'gran_cassa', None, None, .95, 0, 1.0); ev(37.7, 'timpani', 41, 1.5, .8, 0, .8); ev(37.7, 'clash', None, None, .45, 0, .4)
for p in [34, 41, 46]: ev(37.7, 'tuba' if p < 40 else 'trombone', p, .9, .75, 0, .8)
# 38-50: the ending. Both accents in one tune: accordion melody over the tuba's oom-pah, glockenspiel at the pin
for b, ch in enumerate(['Bb', 'Eb', 'Bb', 'F7', 'Gm', 'Eb']):
    t0 = 38.4 + b * 1.4
    ev(t0, 'tuba', CH[ch][0], .5, .45, -.15, .7)
    for p in ACC[ch]: ev(t0 + .7, 'accordion', p, .5, .35, -.3, .4)
for i, p in enumerate([65, 70, 74, 72, 70, 69, 70, 74, 77, 75, 74, 72]):
    ev(39.0 + i * .7, 'clarinet', p, .6, .32, .25, .35)
ev(45.6, 'glockenspiel', 89, 1.0, .35, .2, .45); ev(45.75, 'glockenspiel', 94, 1.0, .3, .2, .4)
for i, p in enumerate([34, 46, 53, 58, 62, 65]): ev(47.05, ['tuba', 'trombone', 'trombone', 'horn', 'accordion', 'accordion'][i], p, 3.0, .55, -.25 + .1 * i, .6)
ev(47.05, 'glockenspiel', 82, 3.6, .35, .3, .45); ev(47.05, 'harp', 70, 3.6, .4, .3, .4)
ev(49.2, 'glockenspiel', 89, 1.8, .22, .25, .35)                                                   # one last bell as the credit settles
used = sorted({e[1] for e in score})
S.seed(9)
music = S.render([e for e in score if FROM - 1 <= e[0] < FROM + DUR], dur=FROM + DUR + 2, master=False)
music = music[int(FROM * SR):int(FROM * SR) + N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = S.room(music, size=0.3, mix=0.14)

# ---------------------------------------------------------------- mix: voice on top, music and foley duck under it
env = np.abs(vo).max(1)
k = int(.03 * SR); env = np.convolve(env, np.ones(k) / k, 'same')
act = np.clip(env / (np.percentile(env[env > 1e-4], 50) + 1e-9), 0, 1) if (env > 1e-4).any() else env * 0
# smooth: fast attack, slow release
dk = np.zeros(N); a = 0.0; att, rel = np.exp(-1 / (.05 * SR)), np.exp(-1 / (.35 * SR))
for i in range(0, N, 48):
    x = act[i]; a = att * a + (1 - att) * x if x > a else rel * a + (1 - rel) * x; dk[i:i + 48] = a
mid = np.stack([bp(music[:, c], 300, 4000) for c in (0, 1)], 1)
music_d = (music - mid * (1 - 10 ** (-7 / 20) ) * dk[:, None]) * (1 - (1 - 10 ** (-3 / 20)) * dk[:, None])
fx_d = fx * (1 - (1 - 10 ** (-3 / 20)) * dk[:, None])
# balance: voice RMS while speaking about 10 dB over the music under it
speak = dk > .5
vr = np.sqrt((vo[speak] ** 2).mean()) if speak.any() else 1
mr = np.sqrt((music_d[speak] ** 2).mean()) if speak.any() else 1
mg = (vr / 10 ** (10 / 20)) / (mr + 1e-9)
mix = vo + (music_d + fx_d) * mg
mix = np.stack([compress(mix[:, 0], thr=0.3, ratio=2.5, att=0.002), compress(mix[:, 1], thr=0.3, ratio=2.5, att=0.002)], 1)
tt = np.arange(N) / SR
mix *= np.clip((DUR - tt) / (1.2 if DUR > 40 else 0.35), 0, 1)[:, None] ** (1.5 if DUR > 40 else 1)   # the film's chord rings down over its last 1.2 s; a cut gets a short fade
pk = np.abs(mix).max(); mix *= 0.5 / pk * 2.2
mix = np.stack([limit(mix[:, 0], ceil=.8), limit(mix[:, 1], ceil=.8)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, A.out), mix.astype(np.float32), SR)
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'music gain', round(float(mg), 3), 'instruments:', ', '.join(used))
