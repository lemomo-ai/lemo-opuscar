"""Sound for 《汉字的故事》 The Story of Chinese Characters -> mix.wav (48 kHz stereo, exactly DUR seconds).
Run from the library root (build.sh does it):
    node core/render/events.mjs styles/chalkboard/demo        (events.json from the picture)
    .venv/bin/python styles/chalkboard/demo/audio.py [en]
Voice: edge-tts zh-CN-XiaoxiaoNeural (vo/*.wav), the loudest thing in the mix. Chalk: real recordings cut into
grains (foley/lib, CC0 / CC BY 4.0), one grain per stroke, length and level from the stroke. Score: a plucked
guqin (physical model) whose open-string twang is born from the oracle-bone bow, soft marimba and pizzicato bass
from the moment the panel slides; silence while the question and the verdict are read."""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit, whoosh, noise, bp, hp, lp, t_, brown, thump, compress

S.seed(11)
rng = np.random.default_rng(7)
EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; ev = EV['ev']; N = int(round(DUR * SR))
first = lambda k: next(e for e in ev if e['type'] == k)
vo = {e['id']: e['t'] for e in ev if e['type'] == 'vo'}
EN = len(sys.argv) > 1 and sys.argv[1] == 'en'                  # `audio.py en`: same score and foley, English voice (vo_en) -> mix_en.wav
VODIR, OUT = ('vo_en', 'mix_en.wav') if EN else ('vo', 'mix.wav')
voice, fx, mus = (np.zeros((N, 2), np.float32) for _ in range(3))

def fade(x, a=.004, b=.03):
    n = len(x); a, b = min(int(a * SR), n // 2), min(int(b * SR), n // 2)
    x = x.copy(); x[:a] *= np.linspace(0, 1, a); x[n - b:] *= np.linspace(1, 0, b); return x

# ---------------------------------------------------------------- voice
for vid, t in vo.items():
    x, sr = sf.read(os.path.join(HERE, VODIR, vid + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); x = hp(x, 90).astype(np.float32)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * .085                 # every line at the same speaking level
    add(voice, x, t, 1.0, 0)
vpres = np.abs(voice[:, 0]); k = int(.25 * SR)                     # voice presence, smoothed: the score ducks under it
vpres = np.convolve(vpres, np.ones(k) / k, 'same'); vpres = np.clip(vpres / (vpres.max() + 1e-9) * 3, 0, 1)

# ---------------------------------------------------------------- chalk
IDX = json.load(open(os.path.join(HERE, 'foley/lib/index.json')))
strokes = [g for g in IDX if g['kind'] == 'stroke' and g['src'] in ('fat', 'wws', 'tom')]
taps = [g for g in IDX if g['kind'] == 'tap']
cache = {}
def grain(g):
    if g['file'] not in cache:
        x, sr = sf.read(os.path.join(HERE, 'foley/lib', g['file']), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        cache[g['file']] = x / (np.abs(x).max() + 1e-9)
    return cache[g['file']]
def chalk(d, v, orange=False):
    """a stroke of duration d: grains chained and cross-faded to length, softer and duller for orange chalk"""
    out = np.zeros(int((d + .06) * SR), np.float32); pos = 0
    while pos < len(out) - int(.03 * SR):
        g = grain(strokes[rng.integers(len(strokes))]); n = min(len(g), len(out) - pos)
        out[pos:pos + n] += fade(g[:n], .006, .02); pos += max(int(.6 * n), int(.04 * SR))
    env = np.ones(len(out)); a = int(.012 * SR); env[:a] = np.linspace(.3, 1, a); env[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR))
    out = out * env
    out = lp(out, 3800) if orange else hp(out, 500)
    return (out * v).astype(np.float32)
for e in ev:
    if e['type'] != 'chalk' or e['t'] < 0: continue
    d = max(.04, e['d']); size = min(1.0, e['len'] / 700)
    v = (.12 + .32 * size) * (1.25 if e['big'] else .8)
    add(fx, chalk(d, v, e['color'] == 'orange'), e['t'], 1.0, e['pan'])
    if d > .12 and rng.random() < .55:                                # the landing knock
        add(fx, fade(grain(taps[rng.integers(len(taps))]), .002, .03) * .35 * v, e['t'] - .005, 1.0, e['pan'])

# ---------------------------------------------------------------- room, panel, wipe, thread, bell
room = lp(brown(DUR), 900) * .006; fx[:, 0] += room[:N]; fx[:, 1] += np.roll(room, 997)[:N]
for e in [x for x in ev if x['type'] == 'slide']:
  d = e['d']
  r = lp(brown(d + .3), 260) * .5; r *= np.sin(np.pi * np.clip(t_(d + .3) / (d + .3), 0, 1)) ** .7
  tick = np.zeros_like(r); per = int(.045 * SR)
  for i in range(0, len(tick) - 400, per): tick[i:i + 300] += np.exp(-np.arange(300) / 40) * .25 * (.5 + .5 * np.sin(np.pi * i / len(tick)))
  add(fx, ((r + lp(tick, 1200)) * .7).astype(np.float32), e['t'], 1.0, .2)
  add(fx, thump(.8, 62) * .7, e['t'] + d, 1.0, .35)                # it meets its stop
for e in [x for x in ev if x['type'] == 'tick']:                     # ticks on the arrow-ruler
  add(fx, fade(grain(taps[rng.integers(len(taps))]), .002, .03) * .3, e['t'], 1.0, 0)
add(fx, whoosh(.32, .7) * .5, first('whip')['t'] - .05, 1.0, -.3)
e = first('wipe'); d = e['d']                                        # one soft felt pass, following the arc's speed
w = bp(noise(d + .1), 280, 2200) * .22; w *= np.sin(np.pi * np.clip(t_(d + .1) / (d + .1), 0, 1)) ** 1.2 * (1 + .35 * np.sin(2 * np.pi * 2.2 * t_(d + .1)))
add(fx, w.astype(np.float32), e['t'], 1.0, 0)
e = first('thread'); d = e['d']
add(fx, chalk(d, .34, True), e['t'], 1.0, 0)
e = first('bell'); d = 2.2                                            # the bell, far down the corridor
b = (np.sign(np.sin(2 * np.pi * 980 * t_(d))) * .3 + np.sin(2 * np.pi * 1960 * t_(d)) * .2) * (.6 + .4 * np.sin(2 * np.pi * 24 * t_(d)))
b = lp(bp(b, 600, 3000), 2000) * np.minimum(1, t_(d) / .05) * np.exp(-np.maximum(0, t_(d) - 1.7) / .15) * .05
add(fx, S.room(np.stack([b, b], 1).astype(np.float32), size=.7, mix=.6)[:, 0], e['t'], 1.0, .5)

# ---------------------------------------------------------------- score
def gq(t, p, dur=3.0, v=.7, pan=0, g=1.0, **kw):
    if 0 <= t < DUR: add(mus, P.pluck('guqin', p, dur, v, **kw), t, g, pan)
def nt(t, inst, p, dur, v, pan=0, g=1.0):
    if 0 <= t < DUR: add(mus, S.note(inst, p, dur, v), t, g, pan)
T = lambda k: first(k)['t']
chalk_t = sorted(e['t'] + e['d'] for e in ev if e['type'] == 'chalk' and e['t'] > 0)
# the two notes of the opening: when 射 is finished, when 矮 is finished
gq(vo['n2'] - .05, 'D3', 3, .55, -.2, .8); gq(vo['n3'] - .05, 'A2', 3, .55, .2, .8)
# from the slide: a quiet pulse in D (marimba and pizzicato bass, 2 notes a second) until the thread lands
beat, t0, t1 = .5, T('slide') + 1.2, T('thread') + 1.7
seq = ['D4', 'A4', 'F4', 'A4', 'E4', 'A4', 'F4', 'A4']; bass = ['D2', 'D2', 'A1', 'A1', 'Bb1', 'Bb1', 'A1', 'A1']
i = 0; t = t0
while t < t1:
    nt(t, 'marimba', seq[i % 8], .4, .34 if i % 2 else .42, -.25 + .5 * (i % 2), .55)
    if i % 2 == 0: nt(t, 'contrabass_pizz', bass[(i // 2) % 8], .5, .5, 0, .7)
    t += beat; i += 1
# the bowstring: the oracle-bone bow sounds, then each form adds a note on the same string
gq(T('twang'), 'A2', 4, .85, 0, 1.1, harmonic=False); gq(T('twang') + .02, 'A4', 3, .5, .15, .6, harmonic=True)
gq(T('twang2'), 'D3', 3, .7, -.1, .9)
gq(vo['n6'] + .2, 'E3', 3, .65, .1, .85); gq(vo['n6'] + 1.2, 'A3', 3, .65, -.1, .85)
# the thread: a rising run that ends hanging (on the 4th), held through the wipe
tt = T('thread')
for k, p in enumerate(['D4', 'E4', 'G4', 'A4', 'C5']): nt(tt + k * .3, 'marimba', p, .5, .4 + .05 * k, -.3 + .15 * k, .55)
nt(tt + 1.6, 'vibraphone', 'G4', 2.4, .35, -.2, .5); nt(tt + 1.6, 'vibraphone', 'C5', 2.4, .32, .2, .5); nt(tt + 1.6, 'contrabass_pizz', 'G1', 1.2, .5, 0, .6)
# the answer: the check lands on the home chord, then the motif in full over the wide shot
ta = T('tap')
gq(ta, 'D3', 5, .8, 0, 1.0); gq(ta + .01, 'D5', 4, .5, .2, .55, harmonic=True)
nt(ta, 'vibraphone', 'D4', 3.5, .4, -.2, .55); nt(ta, 'vibraphone', 'A4', 3.5, .36, .2, .5); nt(ta, 'contrabass_pizz', 'D2', 1.5, .6, 0, .7)
tb = T('bell') + .4
for k, (p, dt) in enumerate([('A2', 0), ('D3', .5), ('E3', 1.0), ('A3', 1.5), ('D4', 2.25)]): gq(tb + dt, p, 3.5, .7 - .04 * k, -.2 + .1 * k, .9)
nt(tb + 2.25, 'vibraphone', 'F#4', 3, .3, .2, .4); nt(tb + 2.25, 'vibraphone', 'A4', 3, .3, -.2, .4)

mus = S.room(mus, size=.45, mix=.2)
duck = (1 - .86 * vpres)[:, None]                                  # about -17 dB under the voice, full level in the pauses
mix = voice * 1.0 + fx * .9 + mus * .8 * duck
# master: gentle glue, then level to about -16 LUFS, true peak under -3 dBFS
# (no bus compressor: the voice is already levelled and the score ducks under it)
def lufs(x):                                                        # BS.1770 K-weighted integrated loudness (gated)
    from scipy.signal import lfilter
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585]
    b2, a2 = [1, -2, 1], [1, -1.99004745483398, .99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0); blk = int(.4 * SR); hop = int(.1 * SR)
    ms = np.array([np.mean(np.sum(y[i:i + blk] ** 2, 1)) for i in range(0, len(y) - blk, hop)])
    l = -.691 + 10 * np.log10(ms + 1e-12); ms = ms[l > -70]; l0 = -.691 + 10 * np.log10(ms.mean()) - 10
    ms = ms[-.691 + 10 * np.log10(ms + 1e-12) > l0]; return -.691 + 10 * np.log10(ms.mean())
def limit2(x, ceil, look=.004):                                   # linked stereo look-ahead limiter
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    n = int(look * SR); m = maximum_filter1d(np.abs(x).max(1), size=2 * n + 1)
    g = uniform_filter1d(np.minimum(1, ceil / np.maximum(m, 1e-9)), size=n); return x * g[:, None]
stems = {'voice': voice, 'chalk+fx': fx * .9, 'score': mus * .8 * duck}
raw = {k: lufs(v.astype(np.float64)) for k, v in stems.items()}
for _ in range(4):                                                   # level, catch the chalk knocks, level again
    mix *= 10 ** ((-16 - lufs(mix)) / 20); mix = limit2(mix, .6)
over = soxr.resample(mix, SR, SR * 4)
tp = 20 * np.log10(np.abs(over).max() + 1e-12)
if tp > -2.0: mix *= 10 ** ((-2.0 - tp) / 20)
mix = mix[:N].astype(np.float32)
if len(mix) < N: mix = np.pad(mix, ((0, N - len(mix)), (0, 0)))
sf.write(os.path.join(HERE, OUT), mix, SR, subtype='PCM_24')
over = soxr.resample(mix, SR, SR * 4)
print(f'{OUT}  {DUR:.2f} s  {lufs(mix):.1f} LUFS  true peak {20 * np.log10(np.abs(over).max()):.1f} dBFS')
g0 = lufs(mix) - lufs((voice + fx * .9 + mus * .8 * duck).astype(np.float64))
print('stems (relative, LUFS):', {k: round(v + g0, 1) for k, v in raw.items()})
print(S.credits(['marimba', 'contrabass_pizz', 'vibraphone']))
