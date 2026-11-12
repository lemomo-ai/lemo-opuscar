"""The Night Climb · score, sound and voice → out/mix.wav (48 kHz stereo).
Run from the library root after `node core/render/events.mjs styles/scratch-film/demo`:
    .venv/bin/python styles/scratch-film/demo/mix.py [start end] [--novo]
The whole film is mixed on one timeline (events.json from the page, timeline.json for the voice), then the segment
[start, end) is cut; a cut only gets a short fade-out at its end. --novo leaves the narration out (not used by build.sh).

Sound palette (style): hand-made instruments, not piano and strings: vibraphone (struck and bowed), glockenspiel,
pizzicato double bass, log drum, brushes; the cut itself (needle on emulsion: a gritty squeal); a "drawn" tone for each
belly light (a sine read at 24 drawings a second, so it flutters like a hand-drawn sound stripe). Ambience: the sea
above the surface (wash) and below it (a low, slow swell). Two real silences: before the lights (22.2–23.3 s) and half
a beat before dawn (45.35–45.75 s)."""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp, limit, compress, whoosh, thump, clack, click, creak, t_

args = [a for a in sys.argv[1:] if not a.startswith('--')]
NOVO = '--novo' in sys.argv
EVD = json.load(open(os.path.join(HERE, 'events.json'))); EV = EVD['ev']
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = float(EVD['dur']); N = int(round(DUR * SR))
SEG0 = float(args[0]) if len(args) > 1 else 0.0
SEG1 = float(args[1]) if len(args) > 1 else DUR
rng = np.random.default_rng(11); S.seed(3)
tt = np.arange(N) / SR
ev = lambda k: [e for e in EV if e['type'] == k]
seg = lambda x, a, b: np.clip((x - a) / (b - a), 0, 1)
SIL1 = (22.15, 23.3); SIL2 = (45.35, 45.75)

# ---------------- ambience ----------------
amb = np.zeros((N, 2))
def swell(seed, lo, hi, rate):
    r = np.random.default_rng(seed); x = bp(r.standard_normal(N), lo, hi, 2)
    m = lp(np.abs(r.standard_normal(N)), rate, 1); m /= np.percentile(m, 95) + 1e-9
    return x * (.35 + .65 * np.clip(m, 0, 1.4))
above = (1 - seg(tt, 2.2, 3.4)) + seg(tt, 31.9, 33.0)       # sea wash above the surface; J-cut into shot 6
below = 1 - above
wash = swell(1, 300, 2400, .25)
under = lp(swell(2, 40, 260, .12), 220)
amb[:, 0] += wash * above * .05 + under * below * .11
amb[:, 1] += np.roll(wash, 4111) * above * .05 + np.roll(under, 2333) * below * .11
for s0, s1 in (SIL1, SIL2):                                  # the silences keep only a breath of the sea
    g = 1 - .7 * (seg(tt, s0, s0 + .05) * (1 - seg(tt, s1 - .02, s1)))
    amb *= g[:, None]

# ---------------- foley ----------------
fx = np.zeros((N, 2))
def needle(d, v=1.0, seed=0):
    """the cut: gritty high noise with chatter + a thin squeal that wanders"""
    r = np.random.default_rng(seed); x = t_(d); n = len(x)
    grit = bp(r.standard_normal(n), 2200, 7500, 2) * (.5 + .5 * (lp(np.abs(r.standard_normal(n)), 60, 1) * 6))
    f = 3600 + 500 * np.sin(2 * np.pi * .9 * x + r.random() * 6) + 200 * lp(r.standard_normal(n), 8, 1) * 30
    sq = np.sin(2 * np.pi * np.cumsum(f) / SR) * .12
    env = np.minimum(1, x / .02) * np.minimum(1, (d - x) / .05)
    return (grit * .55 + sq) * env * v
for i, e in enumerate(ev('cut')):
    d = max(.08, e['dur']); x = needle(d, e.get('v', 1), seed=i + 3)
    n = len(x); pan = np.linspace(e.get('pan0', 0), e.get('pan1', 0), n)
    s = int(e['t'] * SR); m = min(N, s + n) - s
    l, rr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    fx[s:s + m, 0] += x[:m] * l[:m] * .2; fx[s:s + m, 1] += x[:m] * rr[:m] * .2
for e in ev('tick'): add(fx, hp(click(1.4, 1), 2000) * .06 * e.get('v', 1), e['t'], 1, .2)
for e in ev('whoosh'): add(fx, lp(whoosh(e['dur'], 1), 1800) * .09 * e.get('v', 1), e['t'], 1, 0)
for e in ev('flick'): add(fx, bp(whoosh(.35, 1), 250, 1600) * .1 * e.get('v', 1), e['t'] - .05, 1, -.1)
for e in ev('jaw'): add(fx, lp(creak(1), 900) * .05, e['t'], 1, .1)
for e in ev('snap'):
    add(fx, thump(1, 62) * .32, e['t'], 1, 0); add(fx, lp(clack(.6, 1), 2500) * .12, e['t'], 1, .05)
for e in ev('leave'): add(fx, lp(whoosh(e['dur'], 1), 700) * .1, e['t'], 1, -.2)
for e in ev('bite'): add(fx, lp(click(.8, 1), 5000) * .08, e['t'], 1, .1)
for e in ev('sink'):                                          # everything going down: a long falling breath
    d = e['dur']; x = t_(d); r = np.random.default_rng(9).standard_normal(len(x))
    y = lp(r, 900) * np.exp(-x / 2.4) * np.minimum(1, x / .6); add(fx, y * .05, e['t'], 1, 0)
# the pull: a shimmer that opens as the frame widens
for e in ev('pull'):
    d = e['dur']; x = t_(d); r = np.random.default_rng(5).standard_normal(len(x))
    y = hp(r, 5000) * (x / d) ** 2 * np.minimum(1, (d + .3 - x) / .3); add(fx, lp(y, 9000) * .025, e['t'], 1, 0)

# ---------------- score ----------------
E = []                                                         # (t, inst, pitch, dur, vel, pan, gain)
def nt(t, inst, p, d, v, pan=0, g=1.0, **kw):
    e = dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g); e.update(kw); E.append(e)
B = 60 / 84                                                    # 84 bpm
# A · sunset and the descent (0–5.6): a bowed vibraphone chord, the bass steps down as we sink
for p, v in ((57, .45), (62, .4), (65, .38), (69, .35), (76, .28)): nt(.2, 'vibraphone_bowed', p, 4.6, v, (p - 66) / 30, .9, attack=1.2)
for t, p in ((.9, 81), (1.7, 76), (2.6, 74)): nt(t, 'vibraphone', p, 1.2, .3, .3, .6)
for t, p in ((2.4, 50), (3.3, 48), (4.2, 45), (5.0, 43)): nt(t, 'contrabass_pizz', p, .9, .55, -.1)
# B · the fish is cut (5.6–10): a quiet vibraphone figure, resolving where the 10 s cut ends
fig = [62, 69, 72, 69, 65, 69, 74, 69]
for i in range(8):
    nt(6.0 + i * B / 2, 'vibraphone', fig[i], .5, .28 + .04 * (i % 2 == 0), .25, .7)
nt(8.9, 'vibraphone', 74, 1.5, .35, .1, .8); nt(8.9, 'vibraphone', 69, 1.5, .3, -.1, .7); nt(8.9, 'contrabass_pizz', 38 + 12, 1.0, .5, -.1)
nt(9.45, 'glockenspiel', 86, 1.0, .3, .3, .5)
# C · the climb (10–14.3): ostinato, the bass walks up one step a beat
fig2 = [62, 69, 74, 69, 65, 72, 77, 72]
k = 0; t = 10.0
while t < 14.25:
    nt(t, 'vibraphone', fig2[k % 8], .45, .26 + .05 * (k % 4 == 0), .2 * (1 if k % 2 else -1), .7); k += 1; t += B / 2
for i, p in enumerate([38, 40, 41, 43, 45, 47]): nt(10.0 + i * B, 'contrabass_pizz', p + 12 if p < 40 else p, .6, .55, -.1)
for t0 in (10.95, 11.95, 13.15): nt(t0, 'snare', 'off', None, .22, .1, .4)
# D · the shadow (14.3–22.15): the figure stops; a dark bowed chord; the hunter: log drum, a pulse
for p, v in ((58, .4), (62, .38), (65, .36), (70, .3)): nt(14.35, 'vibraphone_bowed', p, 7.0, v, (p - 64) / 30, .85, attack=1.5)
nt(14.35, 'contrabass', 38 + 12, 7.0, .4, 0, .5, attack=1.0)
for i in range(4): nt(18.95 + i * B, 'log_drum', 'lo', None, .45 + .1 * i, -.05, .7)
nt(20.6, 'vibraphone_hard', 63, 1.6, .42, .2, .6); nt(20.6, 'vibraphone_hard', 64, 1.6, .38, -.2, .6)
for i in range(3): nt(20.6 + (i + 1) * B * .75, 'log_drum', 'lo', None, .55, .05, .7)
# (silence 22.15–23.3: nothing)
# E · the lights (23.3–31): one glockenspiel note per light, rising; a bright bowed chord grows under them
GL = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98, 100]
lights = sorted(ev('light'), key=lambda e: e['i'])
for e in lights: nt(e['t'], 'glockenspiel', GL[e['i']] - 12 if GL[e['i']] > 96 else GL[e['i']], .8, .34, -.4 + e['i'] * .07, .55)
for p, v in ((62, .3), (66, .3), (69, .28), (74, .25)): nt(24.0, 'vibraphone_bowed', p, 6.6, v, (p - 66) / 30, .7, attack=2.0)
for p, v in ((62, .38), (66, .36), (69, .34), (71, .3), (76, .28)): nt(27.6, 'vibraphone_bowed', p, 3.6, v, (p - 66) / 30, .85, attack=1.2)
for p in (62, 66, 69, 74, 78): nt(29.9, 'vibraphone', p, 2.0, .32, (p - 70) / 30, .7)
nt(29.9, 'contrabass_pizz', 50, 1.2, .5, -.1)
# the bite on nothing
nt(31.45, 'log_drum', 'lo', None, .8, 0, .9); nt(31.45, 'contrabass_pizz', 38 + 12, .8, .7, 0)
# F · the surface (32.4–36.5): light vibraphone and glock, the sea comes back
for i, (p, d) in enumerate([(69, 1), (74, 1), (76, 1.5), (78, 1), (76, 1), (74, 2)]):
    nt(32.5 + i * B, 'vibraphone', p, d, .28, .2 * (-1) ** i, .65)
nt(35.0, 'glockenspiel', 90, .5, .3, .3, .45); nt(35.0, 'contrabass_pizz', 50, .6, .5, -.1)
# G · not alone (36.5–45.35): the figure returns and builds; bloom when the frame is widest
fig3 = [62, 69, 74, 78, 76, 69, 74, 81]
k = 0; t = 36.6
while t < 45.3:
    u = (t - 36.6) / 8.7
    nt(t, 'vibraphone', fig3[k % 8] + (12 if (u > .55 and k % 4 == 3) else 0), .5, .24 + .16 * u, .25 * (1 if k % 2 else -1), .75); k += 1; t += B / 2
bass = [50, 50, 47, 47, 43, 43, 45, 45, 50, 50, 47, 45]
for i, p in enumerate(bass): nt(36.6 + i * B, 'contrabass_pizz', p, .7, .5 + .2 * (i / 12), -.1)
for i in range(6): nt(37.3 + i * 2 * B, 'glockenspiel', [86, 90, 93, 88, 93, 98][i], 1.0, .26 + .03 * i, .35, .5)
for p, v in ((62, .3), (66, .32), (69, .32), (73, .3), (78, .26)): nt(43.4, 'vibraphone_bowed', p, 1.9, v + .1, (p - 68) / 30, .9, attack=.4)
for p in (62, 66, 69, 74): nt(43.4, 'vibraphone', p, 1.8, .45, (p - 68) / 30, .8)
nt(43.4, 'glockenspiel', 90, 1.5, .4, .3, .55); nt(43.4, 'contrabass_pizz', 50, 1.0, .75, -.1)
# (half a beat of silence 45.35–45.75)
# H · dawn (45.75–52): the cut, then the big chord; the bass goes down with the lights; the last light, twice
for p, v in ((62, .5), (66, .48), (69, .46), (74, .42), (78, .38), (81, .34)): nt(46.0 + (p - 62) * .012, 'vibraphone', p, 3.5, v, (p - 70) / 25, .85)
for p, v in ((62, .3), (69, .3), (74, .28), (78, .24)): nt(46.0, 'vibraphone_bowed', p, 5.0, v, (p - 70) / 25, .7, attack=1.0)
nt(46.02, 'glockenspiel', 86, 2.0, .45, .3, .6)
for i, p in enumerate([50, 45, 43, 38 + 12]): nt(46.6 + i * .8, 'contrabass_pizz', p, .9, .6 - .05 * i, -.1)
for e in ev('last'): nt(e['t'], 'glockenspiel', 81 if e['t'] < 51 else 86, 1.2, .32, -.1, .5)
for p, v in ((62, .26), (69, .24), (74, .22)): nt(48.7, 'vibraphone_bowed', p, 3.0, v, 0, .55, attack=.8)
E = [e for e in E if e is not None]
music = S.render(E, dur=DUR + 3, master=False)[:N]
# the drawn tone: one fluttering sine per light (24 drawings a second), same pitch as the glockenspiel note
draw = np.zeros(N)
for e in lights:
    p = GL[e['i']] - 24; f = 440 * 2 ** ((p - 69) / 12); d = .35; x = t_(d)
    y = np.sin(2 * np.pi * f * x) * (1 + .35 * np.sign(np.sin(2 * np.pi * 24 * x))) * np.exp(-x / .12) * np.minimum(1, x / .004)
    s = int(e['t'] * SR); m = min(N, s + len(y)) - s; draw[s:s + m] += y[:m] * .05
music[:, 0] += draw; music[:, 1] += draw
music = S.room(music, size=.55, mix=.24)
# hard silences in the music
for s0, s1 in (SIL1, SIL2):
    g = 1 - seg(tt, s0 - .06, s0) * (1 - seg(tt, s1, s1 + .01))
    music *= g[:, None]
# end: everything rings out into the last second
fade = 1 - seg(tt, DUR - 1.2, DUR - .05) ** 2
# ---------------- voice ----------------
vo = np.zeros(N)
if not NOVO:
    for L in TL['lines']:
        y, sr = sf.read(os.path.join(HERE, 'out', 'voice', L['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        if sr != SR:
            import soxr; y = soxr.resample(y, sr, SR)
        s = int(L['t0'] * SR); m = min(N, s + len(y)) - s; vo[s:s + m] += y[:m]
    vo = hp(vo, 90); vo = compress(vo / (np.abs(vo).max() + 1e-9) * .9, thr=.22, ratio=3.2, att=.003, rel=.12)
    vo = vo + .25 * bp(vo, 2500, 5000)                       # a little presence
# voice envelope → music makes room (300 Hz–4 kHz) and ducks a little
venv = lp(np.abs(vo), 6, 1); venv = np.clip(venv / (np.percentile(venv[venv > 1e-4], 70) if np.any(venv > 1e-4) else 1), 0, 1)
def mid(x): return bp(x, 300, 4000, 2)
for c in range(2):
    music[:, c] = music[:, c] - .55 * venv * mid(music[:, c])
    music[:, c] *= (1 - .3 * venv)
bed = music * .9 + fx + amb
bed *= fade[:, None]
# balance: voice ≈ 10 dB above the music by RMS where the voice speaks
act = venv > .3
if act.any() and not NOVO:
    rv = np.sqrt(np.mean(vo[act] ** 2)); rm = np.sqrt(np.mean(music[act] ** 2) + 1e-12)
    gv = (rm * 10 ** (10 / 20)) / (rv + 1e-12)
    vo *= gv
mix = bed + np.stack([vo, vo], 1)
# tame the transients (glockenspiel, log drum, the bite) so the master can reach −14 LUFS under −1 dB true peak
mix = mix / (np.abs(mix).max() + 1e-9)
for _ in range(2):
    m = np.maximum(np.abs(mix[:, 0]), np.abs(mix[:, 1]))     # linked: both channels get the same gain
    g = limit(m, .42, .004) / np.maximum(m, 1e-9)
    mix = mix * g[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * .85
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = mix[int(round(SEG0 * SR)):int(round(SEG1 * SR))].copy()
if SEG1 < DUR - .01:
    nf = int(.3 * SR); out[-nf:] *= (np.linspace(1, 0, nf) ** 2)[:, None]
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
used = ['vibraphone', 'vibraphone_bowed', 'vibraphone_hard', 'glockenspiel', 'contrabass_pizz', 'contrabass', 'log_drum', 'snare']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('mix', SEG0, SEG1, out.shape, f'voice/music RMS (voiced) {rms_db(vo[act]) - rms_db(music[act]):.1f} dB' if act.any() and not NOVO else '')
