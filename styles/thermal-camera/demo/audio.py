# 《冬夜，一栋楼的体温》 sound: score (sampled instruments) + camera tones and foley (procedural) + one recorded meow (CC0)
# -> out/mix.wav, 48 kHz stereo, exactly DUR seconds. Cue times come from events.json (node core/render/events.mjs styles/thermal-camera/demo).
# Run from the library root:  .venv/bin/python styles/thermal-camera/demo/audio.py
import sys, os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import lfilter, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # styles/<slug>/demo -> library root
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, noise, lp, hp, bp, t_, env_exp, brown, norm, thump, click, clack, whoosh

EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; N = int(round(DUR * SR))
evs = EV['ev']
at = lambda kind: [e for e in evs if e['type'] == kind]
first = lambda kind: at(kind)[0]['t']
S.seed(19); rng = np.random.default_rng(7)
CUTS = [e['t'] for e in at('cut')]          # 16.2 22.6 29.6 35.2 44.0
VERD, END = first('verdict'), first('end')

# ---------------------------------------------------------------- score
# D minor, a slow 72 BPM pulse for the survey; the cat in D major; the verdict lands on a warm D major chord.
sc = []
def n(t, inst, p, d, v, pan=0.0, **k): sc.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, **k))
B = 60 / 72
# 0 - 4.6: the scan: bowed vibraphone and glass shimmer swelling over a low D
n(0.0, 'contrabass', 'D2', 4.8, .32, 0, attack=.8, release=1.2)
for p, pan in (('A4', -.3), ('D5', .2), ('E5', .35)): n(.05, 'vibraphone_bowed', p, 4.6, .3, pan, attack=1.0, release=1.4)
for i, p in enumerate(['D6', 'A5', 'E6', 'F6']): n(.3 + i * .55, 'glass', p, 1.6, .22, -.4 + i * .25, release=1.0)
# 4.6 - 16.2: harp eighths over a cello pedal (Dm - Bb - Gm - A), tension on the alarm
prog = [('D3', ['D4', 'F4', 'A4', 'E5']), ('Bb2', ['D4', 'F4', 'Bb4', 'C5']), ('G2', ['D4', 'G4', 'Bb4', 'D5']), ('A2', ['C#4', 'E4', 'A4', 'E5'])]
t = 4.6; i = 0
while t < CUTS[0] - .05:
    bar = int((t - 4.6) // (4 * B)) % 4; root, ch = prog[bar]
    n(t, 'harp', ch[i % 4], .9, .34 + .06 * (i % 2 == 0), -.3 + .2 * (i % 4))
    if i % 8 == 0: n(t, 'cellos', root, 4 * B, .3, -.1, attack=.3, release=.6); n(t, 'contrabass', root, 4 * B, .25, .1, attack=.3, release=.6)
    t += B / 2; i += 1
al = first('alarm')
n(al, 'violins_trem', 'Bb5', CUTS[0] - al, .16, .3, attack=.8, release=.4); n(al, 'violins_trem', 'A5', CUTS[0] - al, .12, -.3, attack=1.2, release=.4)
# 16.2 - 22.6: veins in the wall: a pizzicato heartbeat (lub-dub) and a slow cello line
t = CUTS[0]
while t < CUTS[1] - .2:
    n(t, 'contrabass_pizz', 'D2', .5, .5, 0); n(t + .24, 'contrabass_pizz', 'D2', .4, .34, 0); t += 1.0
for k, p in enumerate(['F3', 'E3', 'D3', 'C#3', 'D3', 'A2']): n(CUTS[0] + k * 1.05, 'cellos', p, 1.15, .36, -.15, attack=.15, release=.4)
n(CUTS[0] + 1.1, 'vibraphone_bowed', 'D5', 5.0, .2, .3, attack=1.5, release=1.0)
# 22.6 - 29.6: the cat: D major, glockenspiel and harp, sparse, a breath at the meow
cat_mel = [(0, 'F#5'), (.9, 'A5'), (1.8, 'D6'), (2.9, 'C#6'), (3.4, 'A5'), (5.4, 'F#5'), (6.3, 'E5')]
for dt, p in cat_mel: n(CUTS[1] + .3 + dt, 'glockenspiel', p, 1.4, .26, .25, release=1.2)
for k, p in enumerate(['D3', 'A3', 'F#4', 'A4']): n(CUTS[1] + k * .09, 'harp', p, 3.0, .38, -.35 + k * .2, release=1.6)
for k, p in enumerate(['G3', 'B3', 'D4', 'G4']): n(CUTS[1] + 3.6 + k * .09, 'harp', p, 2.4, .3, -.35 + k * .2, release=1.4)
n(CUTS[1], 'cellos', 'D3', 3.3, .22, -.1, attack=.6, release=.8); n(CUTS[1] + 3.6, 'cellos', 'G2', 3.4, .22, -.1, attack=.6, release=.8)
# 29.6 - 35.2: up over the roof: strings rise with the crane
for p, pan, v in (('D4', -.3, .18), ('A4', .3, .16), ('F5', 0, .14)): n(CUTS[2], 'violins_trem' if p != 'D4' else 'violas', p, CUTS[3] - CUTS[2], v, pan, attack=2.5, release=.5)
n(CUTS[2], 'cellos', 'Bb2', CUTS[3] - CUTS[2], .3, -.1, attack=1.0, release=.6)
for k in range(6): n(CUTS[2] + .8 + k * .75, 'harp', ['A4', 'D5', 'F5', 'A5', 'D6', 'E6'][k], 1.2, .3, -.3 + .12 * k)
# 35.2 - 43.4: the report: quiet held fifth while it is read, the verdict chord at VERD
n(CUTS[3], 'contrabass', 'A1', VERD - CUTS[3], .22, 0, attack=.5, release=.3)
n(CUTS[3], 'vibraphone_bowed', 'E5', VERD - CUTS[3], .16, .2, attack=1.0, release=.4)
n(CUTS[3] + 1.4, 'vibraphone_bowed', 'A4', VERD - CUTS[3] - 1.4, .14, -.2, attack=1.0, release=.4)
for k in range(5): n(CUTS[3] + .4 + k * 1.0, 'harp', ['E5', 'A4', 'E5', 'C#5', 'E5'][k], 1.0, .22, .2)
LD = END - VERD + 3.2
for p, pan in (('D2', -.1), ('A2', .1)): n(VERD, 'cellos', p, LD, .45, pan, attack=.05, release=1.5)
n(VERD, 'contrabass', 'D2', LD, .4, 0, attack=.05, release=1.5)
for p, pan in (('F#4', -.3), ('A4', .3), ('E5', -.15)): n(VERD, 'violins', p, LD, .3, pan, attack=.4, release=1.5)
n(VERD, 'horn', 'D4', 2.6, .3, .15, attack=.25, release=1.0)
for k, p in enumerate(['D3', 'A3', 'F#4', 'A4', 'E5', 'F#5']): n(VERD + k * .045, 'harp', p, 3.0, .55, -.4 + k * .16, release=1.6)
for p in ('D4', 'F#4', 'A4', 'E5'): n(VERD, 'vibraphone', p, 3.0, .38, 0, release=1.5)
n(VERD, 'gran_cassa', None, None, .3, 0)
# 43.4 - end: resolution: the cat motif again, slower; a last chord on the end card
for dt, p in [(0.0, 'A5'), (.8, 'F#5'), (1.6, 'D6'), (2.7, 'E5')]: n(CUTS[4] + .2 + dt, 'glockenspiel', p, 1.6, .22, .25, release=1.4)
for k, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): n(END + k * .06, 'harp', p, 3.0, .45, -.4 + k * .16, release=1.8)
for p in ('D5', 'F#5', 'A5'): n(END, 'vibraphone', p, 3.0, .28, 0, release=1.8)
n(END, 'cellos', 'D2', DUR - END, .32, 0, attack=.3, release=.8)
music = S.render(sc, dur=DUR + 4)[:N]
music = S.room(music, size=.55, mix=.24)

# ---------------------------------------------------------------- foley and camera tones
fx = np.zeros((N, 2), np.float32)
def sine(f, d, tau=None, att=.004):
    x = np.sin(2 * np.pi * f * t_(d)); x *= env_exp(d, tau) if tau else 1
    a = int(att * SR); x[:a] *= np.linspace(0, 1, a); return x
def beep(f=2100, d=.09, v=1.0): return sine(f, d, .035) * v
def tick(v=1.0): d = .012; return hp(noise(d), 4000) * env_exp(d, .0015) * v
def scan(d, f0=110):
    tt = t_(d); shape = np.sin(np.pi * np.minimum(1, tt / d)) ** 1.4
    hum = np.sin(2 * np.pi * f0 * tt) + .5 * np.sin(2 * np.pi * 2 * f0 * tt) + .25 * np.sin(2 * np.pi * 3.01 * f0 * tt)
    air = whoosh(d, 1.0)[:len(tt)]; hiss = hp(noise(d), 5000) * .2
    return norm(hum * .32 * shape + air * .85 + hiss * shape)
def servo(d, f0=260, f1=420):
    tt = t_(d); f = f0 + (f1 - f0) * (tt / d); ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .35 * np.sin(2 * ph)) * np.sin(np.pi * tt / d) ** .7
    return lp(x, 1200) * .5
# wind: brown noise with slow gusts; louder on the roof, softer at the bonnet
wind = brown(DUR); wind = bp(wind, 60, 900) * 1.0 + bp(noise(DUR), 900, 4000) * .02
tt = t_(DUR)[:len(wind)]
gust = .55 + .45 * (np.sin(tt * .37 + 1) * .5 + .5) * (np.sin(tt * .91 + 2) * .5 + .5)
lvl = np.interp(tt, [0, 22.6, 22.9, 29.4, 29.9, 35.0, 35.4, 43.9, 44.3, DUR], [1, 1, .55, .55, 1.6, 1.6, .7, .7, .9, .7])
wind = norm(wind * gust * lvl) * .075
fx[:len(wind), 0] += wind; fx[:len(wind), 1] += np.roll(wind, 900)
# the camera's own fan whenever it is on
fan = (np.sin(2 * np.pi * 63 * tt) * .5 + lp(noise(DUR)[:len(tt)], 400) * .3) * .006
fx[:len(fan)] += fan[:, None]
for e in at('scan'): add(fx, scan(max(e['d'], .5), 110 if e.get('dir', 1) > 0 else 130) * .38, e['t'] - .02, 1.0, .35 * e.get('dir', 1))
for e in at('cut'): add(fx, thump(.35, 58), e['t'], 1.0, 0)
for e in at('crane'): add(fx, servo(e['d']), e['t'], .22, -.2)
for e in at('zoom'): add(fx, servo(e['d'], 520, 700), e['t'], .12, .2)
for k, e in enumerate(at('lock')):
    add(fx, beep(2100 + 160 * (k % 3), .09, .3), e['t'], 1.0, .25)
    for j in range(9): u = j / 9; add(fx, tick(.16 * (1 - .5 * u)), e['t'] + .04 + .5 * (1 - (1 - u) ** 2), 1.0, .25)
    add(fx, beep(3150, .05, .14), e['t'] + .55, 1.0, .25)
for e in at('label'): add(fx, beep(1650, .06, .16), e['t'], 1.0, -.2); add(fx, tick(.2), e['t'] + .05, 1.0, -.2)
for e in at('alarm'):
    for j in range(2): add(fx, beep(1580, .12, .3), e['t'] + j * .18, 1.0, .1); add(fx, beep(2370, .1, .18), e['t'] + j * .18 + .02, 1.0, .1)
for e in at('box'): add(fx, beep(1900, .07, .22), e['t'], 1.0, 0)
for e in at('span'): add(fx, click(1.3, .5), e['t'], 1.0, .3); add(fx, beep(2600, .05, .12), e['t'] + .04, 1.0, .3)
for e in at('nuc'):   # the shutter flag of an uncooled detector
    add(fx, clack(1.6, .35), e['t'], 1.0, .15); add(fx, click(2.0, .25), e['t'] + .09, 1.0, .15)
for e in at('max'): add(fx, beep(2900, .07, .2), e['t'], 1.0, 0); add(fx, beep(3500, .05, .12), e['t'] + .07, 1.0, 0)
# water in the heating pipes: low gurgle and small bubbles
for e in at('flow'):
    d = e['d']; x = norm(lp(brown(d), 160)); x = x * .5 * np.sin(np.pi * np.minimum(1, t_(d)[:len(x)] / d)) ** .5
    add(fx, x * .5, e['t'], 1.0, 0)
    for j in range(16):
        bt = e['t'] + rng.random() * d; f = 300 + rng.random() * 500; dd = .06
        b = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * t_(dd))) / SR) * env_exp(dd, .015)
        add(fx, lp(b, 1500) * .05, bt, 1.0, -.3 + .6 * rng.random())
# the cat: fur rustle when it stirs and settles, ear twitches, one meow (recorded, CC0)
def rustle(d, v=1.0): x = bp(noise(d), 1500, 6000) * np.sin(np.pi * t_(d) / d) ** 2; return x * v
for e in at('stir'): add(fx, rustle(.6, .05), e['t'], 1.0, .1)
for e in at('settle'): add(fx, rustle(e['d'], .05), e['t'], 1.0, .1)
for e in at('ear'): add(fx, rustle(.12, .03), e['t'], 1.0, .1)
mw, msr = sf.read(os.path.join(HERE, 'assets', 'meow', 'meow_cc0.flac'))
if mw.ndim > 1: mw = mw.mean(1)
mw = soxr.resample(mw, msr, SR); mw = norm(hp(mw, 180)) * .32
f = int(.01 * SR); mw[:f] *= np.linspace(0, 1, f); mw[-f * 4:] *= np.linspace(1, 0, f * 4)
for e in at('meow'): add(fx, mw, e['t'] - .05, 1.0, .05)
for e in at('whoosh'): add(fx, whoosh(e['d'], .5), e['t'], 1.0, 0)

# ---------------------------------------------------------------- mix
# duck the music a little under the camera tones and the meow
duck = np.ones(N)
for e in evs:
    if e['type'] in ('lock', 'alarm', 'meow', 'max', 'label'):
        a, b = int((e['t'] - .05) * SR), int((e['t'] + (1.0 if e['type'] == 'meow' else .4)) * SR)
        duck[max(0, a):min(N, b)] = np.minimum(duck[max(0, a):min(N, b)], .7 if e['type'] != 'meow' else .55)
duck = lfilter([.002], [1, -.998], duck)
mix = music * .55 * duck[:, None] + fx
mix = sosfilt(butter(2, 42, 'high', fs=SR, output='sos'), mix, axis=0)
for nm, x in (('music', music * .55), ('fx', fx)): print(nm, 'rms dBFS', round(20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9), 1))
fi = int(.008 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(.5 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

def lufs(x):   # ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms blocks, gated)
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
def true_peak(x): up = soxr.resample(x, SR, SR * 4); return 20 * np.log10(np.abs(up).max())
target = -15.3; ceil = 10 ** (-3.8 / 20); src = mix.copy()
for _ in range(8):
    m = src * 10 ** ((target - lufs(src)) / 20)
    mix = np.stack([limit(m[:, 0], ceil), limit(m[:, 1], ceil)], 1).astype(np.float32)
    TP = true_peak(mix)
    if TP <= -3.05: break
    ceil *= 10 ** ((-3.15 - TP) / 20)
L, TP = lufs(mix), true_peak(mix)
mix = mix[:N].astype(np.float32); assert mix.shape == (N, 2)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='PCM_24')
lo = sosfilt(butter(4, 60, 'low', fs=SR, output='sos'), mix, axis=0)
print(f'mix.wav {mix.shape} {mix.shape[0] / SR:.3f} s  integrated {L:.1f} LUFS  true peak {TP:.1f} dBTP  <60 Hz {10 * np.log10((lo ** 2).mean() / (mix ** 2).mean()):.1f} dB')
used = sorted(set(e['inst'] for e in sc))
print('\n'.join(S.credits(used))); print('instruments:', ', '.join(used))
