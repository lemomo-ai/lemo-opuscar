"""Sound for the 3D Map Explainer demo: English narration + score + foley on one 52 s timeline (50 s + end card).

96 bpm, one bar = 2.5 s, 20 bars. The cues come from events.json (exported by the page) and voice/cues.json (narration timing).
Voice: compressed, then music balanced ~10 dB under it (RMS over the spoken parts), music carved at 300 Hz-4 kHz and ducked under each line.

usage (library root): .venv/bin/python styles/map-explainer/demo/mix.py [t0 t1]     (default: the whole film)
writes out/mix.wav
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
FULL = float(D['dur']); EV = D['ev']
T0 = float(sys.argv[1]) if len(sys.argv) > 2 else 0.0
T1 = float(sys.argv[2]) if len(sys.argv) > 2 else FULL
CUES = json.load(open(os.path.join(HERE, 'voice', 'cues.json')))
N = int(FULL * SR) + SR
tt = np.arange(N) / SR
rng = np.random.default_rng(7)
BEAT = 60 / 96; BAR = 4 * BEAT
evs = lambda k: [e for e in EV if e['type'] == k]


def env_lin(points):
    ts, vs = zip(*points); return np.interp(tt, ts, vs)


def st(x): return np.stack([x, np.roll(x, 1733)], 1)


mix = np.zeros((N, 2)); music = np.zeros((N, 2))

# ---------------- ambience ----------------
space = lp(rng.standard_normal(N), 220, 2) * env_lin([(0, 0), (.6, .02), (5.4, .02), (6.4, 0), (40.0, 0), (41.0, .018), (FULL, .018)])
air = bp(rng.standard_normal(N), 250, 5200, 2) * env_lin([(0, 0), (5.6, 0), (6.4, .016), (10, .011), (14.8, .011), (15.2, 0), (19.95, 0), (20.0, .02), (24.6, .02), (26, .010), (40, .009), (40.8, 0), (FULL, 0)])
dive = lp(rng.standard_normal(N), 1500, 2) * env_lin([(0, 0), (4.6, 0), (5.9, 1), (6.6, .5), (7.4, 0), (FULL, 0)]) ** 1.6 * .06
under = lp(rng.standard_normal(N), 260, 2) * env_lin([(0, 0), (15.6, 0), (16.1, .05), (19.9, .05), (20.0, 0), (FULL, 0)])     # the cut-away: a muffled undersea hush
surf = lp(bp(rng.standard_normal(N), 120, 900, 1), 700) * env_lin([(0, 0), (11, 0), (12.5, .028), (15.4, .028), (15.8, 0), (20.0, 0), (20.05, .05), (24.6, .05), (26, .015), (34.4, .015), (35, .02), (40, .02), (40.8, 0), (FULL, 0)])
for x in (space, air, dive, under, surf): mix += st(x)

# ---------------- score ----------------
ev = []
CH = {'Dm': [38, 45, 50, 53, 57], 'Bb': [34, 41, 46, 50, 53], 'C': [36, 43, 48, 52, 55], 'F': [41, 48, 53, 57, 60], 'Gm': [43, 50, 55, 58, 62]}
PLAN = {4: 'Dm', 5: 'Bb', 6: 'Dm', 9: 'Dm', 10: 'Bb', 11: 'Bb', 12: 'C', 13: 'Dm', 14: 'Bb'}      # bars with the pulse (1-based)
for b, ch in PLAN.items():
    t0 = (b - 1) * BAR; c = CH[ch]
    for q in range(4):
        if b == 14 and q == 3: continue                                   # the breath before the comparison
        ev.append((t0 + q * BEAT, 'contrabass_pizz', c[0] if q % 2 == 0 else c[1], .5, .52 if q == 0 else .4, -.05, .6))
    if b in (5, 6, 9, 10, 11, 12, 13):
        pat = [2, 3, 2, 1, 2, 3, 2, 3] if b % 2 else [2, 3, 2, 3, 2, 3, 3, 2]
        for i, k in enumerate(pat):
            if b == 14 and i >= 6: break
            ev.append((t0 + i * BEAT / 2, 'cellos_spic', c[k] + 12, .25, .32 + .1 * (i % 2 == 0), .25, .5))
    ev.append((t0, 'frame_drum', 'large_muted', None, .42, 0, .5))
# globe, bars 1-3: high bowed shimmer over a low string pedal
ev += [(0.05, 'vibraphone_bowed', 'A5', 6.0, .38, -.35, .3), (0.05, 'vibraphone_bowed', 'D6', 6.0, .34, .35, .26),
       (0.0, 'cellos', 'D2', 6.6, .36, 0, .32), (2.5, 'vibraphone_bowed', 'F5', 3.6, .3, .2, .2)]
for e in evs('pin'): ev.append((e['t'], 'hand_chimes', 'A5', 2.5, .5, .3, .55))
PENTA = [62, 65, 67, 69, 72, 74, 77]
for e in evs('terminal'): ev.append((e['t'], 'hand_chimes', PENTA[e['i']] + 12, 2.0, .4, e['pan'] * .8, .45))
# ignition at 12.5: bowed basses, glockenspiel climbs
ig = evs('ignite')[0]['t']
ev += [(ig, 'contrabass', 'D2', 2.4, .5, 0, .4), (ig, 'cellos', 'A2', 2.4, .42, -.2, .34), (ig, 'vibraphone_bowed', 'A4', 2.4, .38, -.3, .26),
       (ig, 'frame_drum', 'large', None, .58, 0, .7)]
for i, p in enumerate([74, 77, 81, 84]): ev.append((ig + i * BEAT / 2, 'glockenspiel', p, .9, .3 + .04 * i, .35 - .2 * i, .34))
# the cut-away (bars 7-8): music thins to a low pedal and slow bowed notes
cut = 15.0                                            # bar 7: the music thins out first, the cut lands 0.7 s later
ev += [(cut, 'contrabass', 'D1', 5.0, .45, 0, .4), (cut + .02, 'cellos', 'D2', 5.0, .32, 0, .26), (cut + 1.25, 'vibraphone_bowed', 'E5', 3.6, .3, .3, .18),
       (cut + 2.5, 'vibraphone_bowed', 'A4', 2.4, .3, -.3, .18)]
# hard cut 20.0: the pulse is back on the downbeat with a low hit
hc = evs('hardcut')[0]['t']
ev += [(hc, 'frame_drum', 'large', None, .6, 0, .75), (hc, 'timpani', 'D3', 1.5, .45, 0, .5)]
# the pillar (25.0-27.6): one pizzicato per slab, rising through the scale; horn swell under it
DSC = [62, 65, 67, 69, 72, 74, 77, 81]
for e in evs('slab'):
    if e.get('small'): ev.append((e['t'], 'violins_pizz', [74, 77, 81][e['i']], .4, .42, -.4, .4))
    else: ev.append((e['t'], 'violins_pizz', DSC[min(7, e['i'] * 8 // 20)], .4, .3 + .012 * e['i'], .2, .38))
ev += [(25.0, 'horn', 'F3', 2.6, .4, -.1, .3), (25.0, 'horn', 'A#3', 2.6, .36, .1, .26), (27.5, 'horn', 'C4', 2.4, .42, 0, .3), (27.5, 'horn', 'E3', 2.4, .36, 0, .24)]
# pipelines 30.0: a low bowed line follows the light across Arabia
ev += [(30.0, 'cellos', 'D3', 2.4, .38, -.3, .3), (32.5, 'cellos', 'A#2', 1.8, .38, -.3, .3)]
# comparison 35.0: almost nothing. A single low note when the small pillar stands, a bowed chord held while it is read
sm = evs('small')[0]['t']
ev += [(sm, 'contrabass_pizz', 'D2', 1.5, .55, 0, .6), (sm, 'vibraphone_bowed', 'D5', 5.0, .3, -.2, .18), (sm, 'vibraphone_bowed', 'F5', 5.0, .28, .2, .16),
       (37.5, 'cellos', 'G2', 2.6, .3, 0, .22), (37.5, 'vibraphone_bowed', 'A#4', 2.6, .26, 0, .14)]
for e in evs('iea'): ev.append((e['t'], 'glockenspiel', 'D6', 1.2, .25, .3, .22))
# globe again (bars 17-20): harp arpeggios open up, one chime per route, a resting D (add9) at the end
for b, ch in [(17, 'Dm'), (18, 'Bb'), (19, 'C')]:
    t0 = (b - 1) * BAR; c = CH[ch]
    for i, k in enumerate([1, 2, 3, 4, 3, 2, 3, 4]): ev.append((t0 + i * BEAT / 2, 'harp', c[k] + 12, 1.2, .34 + .05 * (i == 0), -.2 + .05 * i, .4))
    ev.append((t0, 'contrabass', c[0], 2.4, .4, 0, .3))
for e in evs('groute'): ev.append((e['t'], 'hand_chimes', 81 if e['asia'] else 74, 2.0, .42, .4 if e['asia'] else -.4, .4))
for e in evs('stat'): ev.append((e['t'], 'glockenspiel', 'A5', 1.5, .32, .3, .3))
fin = evs('final')[0]['t']
for i, p in enumerate([38, 50, 57, 62, 64, 69, 74]): ev.append((fin + i * .03, 'harp', p, 3.0, .52, -.3 + i * .1, .55))
ev += [(fin, 'vibraphone_bowed', 'E5', 3.0, .34, .2, .22), (fin, 'cellos', 'D2', 3.0, .36, 0, .3), (fin, 'glockenspiel', 'E6', 2.4, .3, .3, .26)]
# the end card: the add9 settles onto a plain D on the downbeat of bar 21 (50.0) and rings out to the end
for e in evs('sign'): ev.append((e['t'], 'hand_chimes', 'A5', 2.0, .36, .3, .3))
cl = evs('close')[0]['t'] if evs('close') else None
if cl is not None:
    ev += [(cl, 'vibraphone_bowed', 'D5', FULL - cl, .3, -.2, .2), (cl, 'vibraphone_bowed', 'A5', FULL - cl, .28, .2, .16),
           (cl, 'cellos', 'D2', FULL - cl, .3, 0, .24), (cl, 'harp', 'D3', 2.0, .4, -.1, .4), (cl + .05, 'harp', 'A3', 2.0, .36, .1, .34)]
S.seed(11)
sc = S.render(ev, dur=FULL + 1, master=False)[:N]
f0 = 36.71
drone = np.sin(2 * np.pi * f0 * tt) + .45 * np.sin(4 * np.pi * f0 * tt) + .22 * np.sin(6 * np.pi * f0 * tt)
drone *= env_lin([(0, 0), (1.0, .022), (6, .026), (12.4, .03), (12.6, .05), (15, .045), (20, .03), (34.4, .03), (34.9, 0), (35.0, .035), (40, .03), (47.5, .04), (50, .03), (FULL, .012)])
sc += st(drone)
sw = bp(rng.standard_normal(N), 300, 3000, 1)
swell = np.zeros(N)
for a, b in [(11.4, 12.5), (18.9, 20.0), (23.9, 25.0)]:
    swell += np.clip((tt - a) / (b - a), 0, 1) ** 3 * (tt < b)
sc += st(sw * swell * .05)
sc = np.stack([hp(sc[:, c], 32, 2) for c in range(2)], 1)
sc = S.room(sc, size=.55, mix=.22)
music += sc

# ---------------- foley tied to the picture ----------------
for e in EV:
    k, t = e['type'], e['t']
    if k == 'terminal': add(mix, hp(click(pitch=1.6, v=1.0), 2500) * .045, t, 1, e['pan'] * .8)
    elif k == 'dive': add(mix, lp(whoosh(1.4, 1.0), 2400) * .10, t, 1, 0)
    elif k == 'trunk': add(mix, lp(whoosh(2.0, 1.0), 1800) * .05, t, 1, -.2)
    elif k == 'measure':
        for i in range(7): add(mix, hp(click(pitch=1.2 + .08 * i, v=1.0), 1800) * .04, t + i * .1, 1, .2)
    elif k == 'tick':
        for d in (0, .07): add(mix, hp(click(pitch=.9, v=1.0), 1200) * .08, t + d, 1, .25)
    elif k == 'ignite':
        add(mix, thump(1.0, 52) * .24, t, 1, 0)
        n = int(2.0 * SR); x = np.arange(n) / SR
        buzz = bp(np.sin(2 * np.pi * 110 * x) + .5 * np.sin(2 * np.pi * 220.7 * x) + .3 * rng.standard_normal(n), 150, 2400, 1) * np.exp(-x / .7) * np.minimum(1, x / .05)
        add(mix, buzz * .03, t, 1, .15)
    elif k == 'orbit': add(mix, lp(whoosh(1.6, .8), 1200) * .06, t, 1, -.3)
    elif k == 'cut':                                  # the sea is sliced open: a long low tearing sweep
        n = int(1.3 * SR); x = np.arange(n) / SR
        tear = bp(rng.standard_normal(n), 80, 900, 2) * np.exp(-x / .5) * np.minimum(1, x / .02)
        add(mix, tear * .16, t, 1, 0); add(mix, thump(1.0, 40) * .2, t, 1, 0)
    elif k == 'hardcut': add(mix, lp(whoosh(.5, 1.0), 3000) * .09, t - .02, 1, 0)
    elif k == 'ruler':
        for i in range(4): add(mix, hp(click(pitch=1.0 + .1 * i, v=1.0), 1500) * .06, t + i * .18, 1, -.2 + .15 * i)
    elif k == 'crane' or k == 'whoosh': add(mix, lp(whoosh(1.8, 1.0), 1600) * .07, t, 1, 0)
    elif k == 'pipe':
        n = int(2.0 * SR); x = np.arange(n) / SR
        flow = bp(np.sin(2 * np.pi * 82 * x) + .4 * rng.standard_normal(n), 120, 1800, 1) * np.sin(np.pi * np.clip(x / 2.0, 0, 1)) ** 1.5
        add(mix, flow * .03, t, 1, -.4 if e['i'] == 0 else .4)
    elif k == 'ship': add(mix, lp(whoosh(1.2, .6), 600) * .04, t, 1, -.3 if e.get('lane') == 0 else .3)
    elif k == 'rise': add(mix, lp(whoosh(1.6, 1.0), 2400) * .08, t, 1, 0)

# carve the voice band out of the music, then duck it under every line
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
music = music - mid * (1 - 10 ** (-4 / 20))

# ---------------- narration ----------------
voice = np.zeros(N); active = np.zeros(N)
for c in CUES:
    x, sr = sf.read(os.path.join(HERE, 'out', 'voice', c['id'] + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    i = int(c['t0'] * SR); j = min(N, i + len(x)); voice[i:j] += x[:j - i]; active[i:j] = 1
voice = hp(voice, 80, 2)
voice = compress(voice, thr=.18, ratio=3.0)
duck = np.convolve(active, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
duck = 1 - .45 * np.clip(duck * 1.4, 0, 1)            # about -5 dB under the voice
music = music * duck[:, None]
vr = np.sqrt((voice[active > 0] ** 2).mean())
voice *= .16 / vr                                      # voice RMS while speaking
mr = np.sqrt((music[active > 0] ** 2).mean())
music *= (.16 * 10 ** (-10 / 20)) / mr                 # music 10 dB under the voice
fx_r = np.sqrt((mix[active > 0] ** 2).mean())
mix *= min(1.0, (.16 * 10 ** (-12 / 20)) / max(fx_r, 1e-9))   # foley and ambience stay under the voice too
mix += music + np.stack([voice, voice], 1)

a, b = int(T0 * SR), int(T1 * SR)
out = mix[a:b].copy()
nf = int(1.1 * SR); out[-nf:] *= np.linspace(1, 0, nf)[:, None] ** 1.5
out = np.stack([compress(out[:, 0], thr=.35, ratio=2.0), compress(out[:, 1], thr=.35, ratio=2.0)], 1)
out = np.stack([limit(out[:, 0]), limit(out[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix-full.wav'), out.astype(np.float32), SR)
used = ['hand_chimes', 'vibraphone_bowed', 'contrabass_pizz', 'cellos_spic', 'contrabass', 'cellos', 'glockenspiel', 'harp', 'frame_drum', 'timpani', 'violins_pizz', 'horn']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
vo_db = 20 * np.log10(np.sqrt((voice[active > 0] ** 2).mean())); mu_db = 20 * np.log10(np.sqrt((music[active > 0] ** 2).mean()))
print(f'mix {T0}-{T1}s peak {np.abs(out).max():.3f}  voice {vo_db:.1f} dB  music under voice {mu_db:.1f} dB  (gap {vo_db - mu_db:.1f} dB)')
