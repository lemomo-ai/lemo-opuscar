"""山海 Mountains and Seas · score + foley + narration -> out/mix.wav (48 kHz stereo 24-bit, exactly DUR s, about -16 LUFS, peaks under -3 dBFS).
Run from the library root:  .venv/bin/python styles/double-exposure/demo/audio.py   (or set LIB to the library folder)
Cue times mirror the timeline in index.html. D minor throughout, one harmonic colour per animal:
stag Dm (develop click, first lamp) -> wolf Dm (harp per cabin lamp, howl) -> eagle Bb -> Gm (horn, wing beats, dive)
-> salmon F, underwater (harp ostinato, low clarinet, the town's lamps on celesta-like glock) -> morph to Dm(add9) with a whale call
-> whale F -> Dm(add9) (bowed vibraphone on the city lights) -> register: D major (Picardy third) held under the title to the end.
Narration (Kokoro af_heart, vo/*.wav) is compressed and sits ~10 dB over the music by RMS; the music gives way at 300 Hz-4 kHz under it.
"""
import sys, os, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..')))
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, bp, noise, brown, norm, t_, env_exp, whoosh, thump, compress

S.seed(7)
DUR = 50.5
N = int(round(DUR * SR))
T_AB0, T_WHIP, T_X0, T_X1, T_SURF = 5.5, 14.42, 21.3, 22.1, 31.35
T_REG0, T_DIS0, T_TITLE, T_CRED = 39.0, 42.4, 45.6, 46.0
L1_ON = [4.9] + [5.85 + i * .21 for i in range(1, 11)]
L2_ON = [15.6 + i * .2 for i in range(9)]
FLAPS = [15.2, 16.9, 18.6]
VO = [('v1', 0.8), ('v2', 9.6), ('v3', 16.0), ('v4', 23.6), ('v5', 34.2), ('v6', 42.0)]
INSTR = ['cellos', 'contrabass', 'violins', 'violas', 'harp', 'horn', 'clarinet', 'glockenspiel', 'vibraphone_bowed',
         'gran_cassa', 'timpani', 'sus_cymbal', 'piano', 'cellos_pizz']

def stereo(x): return np.stack([x, x], 1)
def place(buf, x, at, g=1.0):
    s = int(round(at * SR))
    if s >= len(buf): return
    if x.ndim == 1: x = stereo(x)
    e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * g

# ---------------------------------------------------------------- score
ev = []
def E(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw): ev.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))

# 1 · stag on the ridge (0-5.9): an open D minor, still and wide
E(0.0, 'contrabass', 'D2', 14.2, .4, -.1, .5, attack=.6)
E(0.0, 'cellos', 'A2', 6.0, .38, -.3, .7, attack=1.2)
E(0.9, 'violas', 'F3', 5.0, .34, .3, .45, attack=1.5)
E(2.2, 'violins', 'A4', 3.6, .32, .4, .32, attack=1.6)
E(4.9, 'harp', 'A4', 1.4, .55, -.2, .6)                       # the first lamp, inside the stag
E(4.9, 'glockenspiel', 'E6', 1.0, .32, -.2, .2)
E(3.9, 'violins', 'D5', 2.4, .3, -.4, .3, attack=1.4)          # the push swells into the forest
# 2 · wolf (5.5-14.4): the forest chord, a harp drop per cabin lamp, the pull-back opens the strings
E(5.5, 'cellos', 'F3', 8.4, .4, .2, .5, attack=.8)
E(5.6, 'cellos', 'A2', 8.6, .4, -.3, .65, attack=.5)
SCALE = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6']
for i, t0 in enumerate(L1_ON[1:]):
    E(t0, 'harp', SCALE[i % len(SCALE)], 1.0, .48 + .03 * i, -.5 + i * .1, .5)
E(7.6, 'violas', 'A3', 6.3, .38, .3, .45, attack=1.4)
E(8.4, 'violins', 'D5', 5.5, .36, .4, .36, attack=1.8)
E(12.4, 'violins', 'E5', 2.0, .42, .45, .4, attack=.4)           # lifts on the howl
E(12.4, 'violins', 'A5', 1.8, .3, -.45, .25, attack=.6)
# 3 · eagle (14.4-21.3): Bb major lift, horn call, then G minor into the dive
E(T_WHIP, 'contrabass', 'Bb1', 4.8, .5, 0, .5, attack=.03)
E(T_WHIP, 'cellos', 'F2', 4.8, .48, -.3, .7, attack=.03)
E(T_WHIP, 'cellos', 'D3', 4.8, .44, .2, .5, attack=.05)
E(T_WHIP + .03, 'violins', 'F5', 2.6, .46, .4, .4, attack=.05)
E(14.7, 'horn', 'F3', 1.0, .6, -.2, .62)
E(15.6, 'horn', 'Bb3', .6, .58, -.2, .58)
E(16.2, 'horn', 'C4', 1.9, .62, -.2, .62)
E(17.0, 'violins', 'G5', 2.0, .44, .4, .38, attack=.4)
E(18.4, 'horn', 'D4', .7, .6, -.2, .58)
E(19.0, 'horn', 'C4', 1.8, .58, -.2, .56)
E(19.2, 'contrabass', 'G1', 2.2, .5, 0, .5, attack=.2)
E(19.2, 'cellos', 'G2', 2.2, .46, -.3, .6, attack=.3)
E(19.2, 'violas', 'Bb3', 2.1, .44, .3, .5, attack=.3)
E(19.2, 'violins', 'D5', 2.1, .4, .4, .36, attack=.5)
for i, t0 in enumerate(L2_ON):
    E(t0, 'glockenspiel', ['D6', 'F6', 'A6', 'C7', 'D7', 'F6', 'A6', 'C7', 'D7'][i], .6, .3, -.6 + i * .15, .18)
# 4 · salmon underwater (21.3-29.6): F major, a slow harp ostinato like water, a low clarinet line
E(21.6, 'contrabass', 'F1', 8.2, .42, 0, .5, attack=.8)
E(21.8, 'cellos', 'C3', 8.0, .36, -.3, .5, attack=1.4)
ost = ['F3', 'C4', 'A4', 'C4', 'G4', 'C4', 'A4', 'E4']
for i in range(22):
    t0 = 22.2 + i * .42
    if t0 > 29.0: break
    E(t0, 'harp', ost[i % 8], .9, .36 + .04 * (i % 2), -.3 + .6 * ((i % 4) / 3), .32)
E(23.2, 'clarinet', 'A3', 1.6, .42, -.1, .5, attack=.25)
E(24.8, 'clarinet', 'G3', .8, .4, -.1, .45, attack=.15)
E(25.6, 'clarinet', 'F3', 2.4, .42, -.1, .5, attack=.2)
for i, p in enumerate(['C6', 'E6', 'F6', 'A6', 'C7']):                 # the town's lamps, head to tail
    E(23.0 + i * .42, 'glockenspiel', p, .8, .26, .5 - i * .25, .16)
# the morph (26.9-29.6): the river opens into the sea; D minor add9 rises out of F
E(26.8, 'violas', 'A3', 4.6, .4, .3, .45, attack=1.6)
E(27.2, 'violins', 'E5', 4.2, .38, .4, .34, attack=1.8)
E(27.6, 'cellos', 'D3', 4.0, .42, -.3, .55, attack=1.2)
E(28.4, 'contrabass', 'D2', 3.2, .46, 0, .5, attack=.8)
E(28.4, 'vibraphone_bowed', 'A5', 3.0, .4, .2, .3)
E(28.9, 'vibraphone_bowed', 'E6', 2.6, .36, -.2, .26)
# 5 · whale over the sea (31.35-39): F major opening, then the city lights shimmer
E(T_SURF, 'contrabass', 'F1', 3.0, .5, 0, .55, attack=.05)
E(T_SURF, 'cellos', 'C3', 3.2, .44, -.3, .6, attack=.2)
E(T_SURF, 'violas', 'A3', 3.2, .42, .3, .5, attack=.3)
E(T_SURF + .2, 'violins', 'C5', 3.0, .4, .4, .4, attack=.5)
for i, p in enumerate(['F4', 'A4', 'C5', 'E5', 'F5', 'A5', 'C6', 'E6']):
    E(33.6 + i * .2, 'vibraphone_bowed', p, 1.8, .48, -.6 + i * .17, .42)
    E(33.6 + i * .2, 'harp', p, 1.0, .42, -.6 + i * .17, .3)
for p, inst, v, pan, g in [('D2', 'contrabass', .48, 0, .55), ('A2', 'cellos', .44, -.3, .6), ('F3', 'cellos', .4, .2, .5),
                           ('E4', 'violas', .38, .3, .45), ('A4', 'violins', .38, .4, .4)]:
    E(34.6, inst, p, 7.9, v, pan, g, attack=1.2)
E(37.0, 'clarinet', 'D4', 1.8, .38, -.2, .42, attack=.4)
E(38.8, 'clarinet', 'E4', 1.2, .36, -.2, .4, attack=.3)
E(40.0, 'clarinet', 'F4', 2.2, .38, -.2, .42, attack=.3)
# 6 · register (42.4-): D major, the Picardy third, held under the title to the end
for p, inst, v, pan, g in [('D2', 'contrabass', .52, 0, .58), ('A2', 'cellos', .48, -.3, .66), ('F#3', 'cellos', .44, .2, .55),
                           ('E4', 'violas', .4, .3, .48), ('A4', 'violins', .4, .4, .44), ('D5', 'violins', .38, -.4, .4)]:
    E(T_DIS0, inst, p, DUR - T_DIS0 - .4, v, pan, g, attack=.9, release=1.2)
E(T_DIS0, 'piano', 'D2', 5.0, .5, -.1, .5)
E(T_DIS0, 'piano', 'A2', 5.0, .42, .1, .38)
E(T_DIS0 + .02, 'harp', 'F#4', 2.0, .45, .3, .4)
E(T_TITLE + .02, 'glockenspiel', 'A6', 2.4, .38, .3, .26)
E(T_TITLE + .35, 'glockenspiel', 'E7', 2.4, .3, -.3, .2)
E(T_CRED + .3, 'glockenspiel', 'D7', 3.0, .3, .1, .2)
E(T_TITLE, 'piano', 'F#4', 3.6, .34, .2, .3)
music = S.render(ev, dur=DUR + 1, master=False)[:N + SR]
music = S.room(music.astype(np.float32), size=.72, mix=.3)

# ---------------------------------------------------------------- foley
fx = np.zeros((N + SR, 2))
def hit(name, var, vel, t, g, pan=0): add(fx, S.hit(name, var, vel), t, g, pan)
tt = t_(DUR + 1)
def ramp(a, b, c, d): return np.clip(np.minimum((tt - a) / max(b - a, 1e-3), (d - tt) / max(d - c, 1e-3)), 0, 1)
ridge = bp(noise(DUR + 1), 300, 3000) * (.55 + .45 * np.sin(2 * np.pi * .13 * tt) ** 2)      # wind in the grass
air = lp(brown(DUR + 1), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * .21 * tt))
gust = bp(noise(DUR + 1), 500, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * .9 * tt) ** 2)
under = lp(brown(DUR + 1), 380) * (.6 + .4 * np.sin(2 * np.pi * .11 * tt))                    # muffled water
sea = lp(brown(DUR + 1), 900) * (0.55 + 0.45 * np.sin(2 * np.pi * .16 * tt + 1) ** 2)
bed = (norm(ridge) * .03 * ramp(-1, 0.2, 5.0, 5.8) + norm(air) * .05 * ramp(5.0, 5.8, 13.9, 14.5)
       + norm(gust) * .07 * ramp(14.3, 14.6, 20.8, 21.4) + norm(under) * .12 * ramp(21.3, 22.0, 30.8, 31.4)
       + norm(sea) * .09 * ramp(31.3, 31.9, 47.5, 49.8))
bed = hp(bed, 120)
fx[:, 0] += bed; fx[:, 1] += np.roll(bed, 1301)

def shutter(v=1.0):
    """two blades: click-click"""
    d = .14; x = np.zeros(int(d * SR))
    for k, (at, f) in enumerate([(0, 3800), (.055, 3000)]):
        n = int(.03 * SR); s = int(at * SR)
        b = bp(noise(.03), f * .5, min(f * 2.2, 20000)) * env_exp(.03, .004) + np.sin(2 * np.pi * (f * .4) * t_(.03)) * env_exp(.03, .006) * .4
        x[s:s + n] += b[:n] * (1 if k == 0 else .8)
    return norm(lp(x, 9000)) * v
add(fx, shutter(), .3, .16, .1)                               # the stag develops on a shutter click
def tick(v=1.0):
    d = .05; x = bp(noise(d), 2500, 7000) * env_exp(d, .006) + np.sin(2 * np.pi * 1800 * t_(d)) * env_exp(d, .01) * .3
    return norm(x) * v
for i, t0 in enumerate(L1_ON): add(fx, tick(), t0, .045, -.5 + i * .09)
for i, t0 in enumerate(L2_ON): add(fx, tick(), t0, .03, -.6 + i * .15)
def riser(d, f0, f1):
    x = t_(d); nz = noise(d); out = np.zeros_like(nz)
    for i in range(0, len(nz), 480):
        hi = min(len(nz), i + 480); fc = f0 * (f1 / f0) ** (i / len(nz))
        out[i:hi] = bp(nz[max(0, i - 3000):hi], fc * .6, min(fc * 1.6, 20000))[-(hi - i):]
    return norm(out) * (x / d) ** 2.2
# the push through the stag into the forest
add(fx, riser(1.8, 150, 2400), 3.8, .1, 0)
add(fx, whoosh(.7), 5.25, .14, 0)
hit('sus_cymbal', 'cresc', .35, 4.2, .08, -.2)
# the wolf pull-back, the howl
add(fx, norm(lp(noise(3.6), 900) * np.sin(np.pi * t_(3.6) / 3.6) ** 2), 6.8, .05, 0)
def howl(d=1.9):
    x = t_(d); u = x / d
    f0 = np.interp(u, [0, .18, .62, 1], [360, 610, 590, 470]) * (1 + .014 * np.sin(2 * np.pi * 5.3 * x) * np.clip((x - .3) / .3, 0, 1))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    tone = np.sin(ph) + .32 * np.sin(2 * ph + .3) + .1 * np.sin(3 * ph + .9) + .04 * np.sin(4 * ph)
    breath = bp(noise(d), 900, 3200) * .08
    e = np.clip(x / .22, 0, 1) ** 1.5 * np.clip((d - x) / .55, 0, 1) ** 1.2
    return norm(lp(tone + breath, 2600) * e)
hw = howl()
place(fx, S.room(np.stack([hw, hw], 1).astype(np.float32), size=.85, mix=.45) * np.array([[.95, .7]]), 12.5, .12)
hit('sus_cymbal', 'cresc', .45, 11.9, .1, .3)
# whip up into the clouds
add(fx, riser(.5, 300, 4500), T_WHIP - .5, .2, 0)
add(fx, whoosh(.45), T_WHIP - .12, .26, .1)
hit('timpani', 'drum2', .7, T_WHIP, .42, 0)
hit('sus_cymbal', 'hit', .35, T_WHIP, .09, .3)
def wingbeat():
    d = .55; x = t_(d)
    a = lp(noise(d), 380) * np.exp(-((x - .08) / .06) ** 2)
    b = lp(noise(d), 600) * np.exp(-((x - .32) / .08) ** 2) * .7
    c = np.sin(2 * np.pi * 48 * x) * np.exp(-((x - .1) / .05) ** 2) * .5
    return norm(a + b + c)
for t0 in FLAPS: add(fx, wingbeat(), t0, .3, -.1)
add(fx, whoosh(1.1), 19.2, .1, .3)                             # the bank
# dive into the lens, into the river
add(fx, riser(.7, 200, 5000), 20.6, .24, 0)
add(fx, whoosh(.5), 20.95, .3, -.1)
hit('gran_cassa', 'hit', .85, 21.3, .5, 0)
add(fx, thump(1, 44), 21.3, .36, 0)
def plunge(d=1.6):
    x = t_(d)
    hit_ = lp(noise(d), 2500) * np.exp(-x / .08)
    body = lp(brown(d), 500) * np.exp(-x / .5)
    return norm(hit_ + body * .8)
add(fx, plunge(), 21.45, .2, 0)
def bubble(f=900, d=.09):
    x = t_(d); fr = f * (1 + 1.6 * x / d)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x / .025)
rb = np.random.default_rng(3)
for i in range(26):
    t0 = 21.6 + rb.random() * 2.2; add(fx, bubble(500 + rb.random() * 1200), t0, .025 * (1 - (t0 - 21.6) / 2.6), rb.random() * 1.4 - .7)
# a humpback call during the morph: a slow glide with harmonics, far away
def whale_call(d=2.6):
    x = t_(d); u = x / d
    f0 = np.interp(u, [0, .3, .7, 1], [180, 320, 260, 140])
    ph = 2 * np.pi * np.cumsum(f0) / SR
    tone = np.sin(ph) + .5 * np.sin(2 * ph) + .2 * np.sin(3 * ph)
    e = np.sin(np.pi * u) ** 1.4
    return norm(lp(tone * e, 1200))
wc = whale_call()
place(fx, S.room(np.stack([wc, wc], 1).astype(np.float32), size=.95, mix=.6) * np.array([[.7, .9]]), 28.0, .1)
# the breach
add(fx, riser(1.4, 120, 3500), 29.95, .18, 0)
def crash(d=2.4):
    x = t_(d)
    return norm(lp(noise(d), 2200) * (np.clip(x / .05, 0, 1) * np.exp(-x / .6)) + lp(brown(d), 300) * np.exp(-x / 1.1) * .5)
add(fx, crash(), 31.0, .3, .1)
hit('gran_cassa', 'hit', .7, 31.05, .38, 0)
add(fx, whoosh(.8), 31.25, .16, 0)                         # the camera rises through the surface
sw = hp(noise(1.6), 5000) * np.sin(np.pi * t_(1.6) / 1.6) ** 2      # light sweep on the whale
add(fx, norm(sw), 33.6, .025, .3)
# register: the outline lets go
add(fx, norm(hp(noise(2.0), 4000) * np.sin(np.pi * t_(2.0) / 2.0) ** 2), T_DIS0, .022, -.2)
hit('gran_cassa', 'hit', .45, T_DIS0, .2, 0)
add(fx, shutter(.8), T_DIS0 + 1.9, .08, .2)                       # one click: two images have become one
hit('sus_cymbal', 'bell', .4, T_TITLE + .01, .06, .4)

# ---------------------------------------------------------------- narration
voice = np.zeros(N + SR)
windows = []
for vid, at in VO:
    x, sr = sf.read(os.path.join(HERE, 'vo', vid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr)
    x = hp(x, 90)
    x = compress(x / np.abs(x).max() * .8, thr=.2, ratio=3.0)
    s = int(at * SR); voice[s:s + len(x)] += x
    windows.append((at, at + len(x) / SR))
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)

# ---------------------------------------------------------------- mix
mus = (music * .9 + fx)[:N + SR]
# under the voice: a gentle duck, deeper in 300 Hz-4 kHz
duck = np.zeros(N + SR)
for a, b in windows:
    duck = np.maximum(duck, np.clip(np.minimum((tt[:N + SR] - (a - .25)) / .25, ((b + .35) - tt[:N + SR]) / .45), 0, 1))
for c in range(2):
    band = bp(mus[:, c], 300, 4000)
    mus[:, c] = mus[:, c] - band * (1 - 10 ** (-5 / 20)) * duck - mus[:, c] * .12 * duck
vmask = duck > .99
g_v = 10 ** (10 / 20) * rms(mus[vmask].mean(1)) / rms(voice[vmask])
mix = mus + stereo(voice * g_v) * np.array([[1.0, 1.0]])
mix = mix[:N]
mix = np.stack([hp(mix[:, 0], 40), hp(mix[:, 1], 40)], 1)
fi = np.ones(N); k = int(.04 * SR); fi[:k] = np.linspace(0, 1, k)
fo = np.ones(N); k = int(1.0 * SR); fo[-k:] = np.linspace(1, 0, k) ** 1.4
mix *= (fi * fo)[:, None]

def lufs(x):
    p = os.path.join(OUT, '.tmp_meas.wav'); sf.write(p, x.astype(np.float32), SR)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(p); line = [l for l in out.splitlines() if l.strip().startswith('I:')][-1]
    return float(line.split()[1])
TARGET, CEIL = -16.0, 10 ** (-5.0 / 20)
for _ in range(3):
    g = 10 ** ((TARGET - lufs(mix)) / 20); mix = mix * g
    for c in range(2): mix[:, c] = limit(mix[:, c], CEIL)
L = lufs(mix)
mix = mix[:N].astype(np.float32)
assert mix.shape == (N, 2)
sf.write(os.path.join(OUT, 'mix.wav'), mix, SR, subtype='PCM_24')
vr = rms(stereo(voice * g_v)[:N][vmask[:N]].mean(1)); mr = rms(mus[:N][vmask[:N]].mean(1))
print('mix.wav', len(mix) / SR, 's; peak dBFS %.2f; integrated %.1f LUFS; voice over music (RMS, under voice) %.1f dB' % (20 * np.log10(np.abs(mix).max()), L, 20 * np.log10(vr / mr)))
low = lp(mix.mean(1), 120); print('energy under 120 Hz vs total: %.1f dB' % (20 * np.log10(rms(low) / rms(mix.mean(1)))))
print('\n'.join(S.credits(INSTR)))
