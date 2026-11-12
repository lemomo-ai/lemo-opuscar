"""Sound for 《摩羯过琼州》 52 s narrated cut -> out/mix.wav (48 kHz stereo).
Run from the library root (build.sh does it):
    node core/render/events.mjs styles/flow-field/demo         (events.json in film time: cues, ticks, the wind under the camera every 0.1 s)
    .venv/bin/python styles/flow-field/demo/mix.py [start end]   (a cut of the same mix, with a short fade-out at its end)
Three layers: the narration (Kokoro bm_george, compressed, about 10 dB over the music), the wind (three noise bands and a
whistle following the modelled wind on screen) and a low D-minor score. The score below is written on the 49 s story
clock ("old" time in the code); O() maps those times onto the film through voice/timeline.json, while cues taken
from events.json are already in film time. Under every line the wind and the music give way in 300 Hz–4 kHz."""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfiltfilt, sosfilt
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, whoosh, thump, bp, lp, hp, compress

S.seed(11)
rng = np.random.default_rng(7)
EV = json.load(open(os.path.join(HERE, 'events.json')))
TL = json.load(open(os.path.join(HERE, 'voice/timeline.json')))
DUR = EV['dur']; ev = EV['ev']; N = int(round(DUR * SR)); tt = np.arange(N) / SR
cue = {}
for e in ev:
    if e['type'] not in ('w', 'tick', 'roll', 'row', 'landfall', 'vo'): cue.setdefault(e['type'], e['t'])

# film time <-> old chart time: the same monotone cubic as film.js
def mono(K):
    K = np.array(K, float); x, y = K[:, 0], K[:, 1]; n = len(x); d = np.diff(y) / np.diff(x); m = np.zeros(n)
    for i in range(1, n - 1): m[i] = 0 if d[i - 1] * d[i] <= 0 else 2 / (1 / d[i - 1] + 1 / d[i])
    m[0], m[-1] = d[0], d[-1]
    def f(t):
        t = np.clip(t, x[0], x[-1]); i = np.clip(np.searchsorted(x, t, 'right') - 1, 0, n - 2); h = x[i + 1] - x[i]; u = (t - x[i]) / h
        return (2*u**3 - 3*u**2 + 1) * y[i] + (u**3 - 2*u**2 + u) * h * m[i] + (-2*u**3 + 3*u**2) * y[i + 1] + (u**3 - u**2) * h * m[i + 1]
    return f
_g = np.arange(0, DUR + 1e-9, 0.005); _M = mono(TL['anchors'])(_g)
O = lambda o: float(np.interp(o, _M, _g))           # old chart time -> film time
# ---------------------------------------------------------------- wind (the lead)
W = [e for e in ev if e['type'] == 'w']
wt = np.array([e['t'] for e in W]); wv = np.array([e['v'] for e in W]); wm = np.array([e['vmax'] for e in W]); wp = np.array([e['pan'] for e in W])
def curve(y, smooth=0.25):
    c = np.interp(tt, wt, y)
    k = int(smooth * SR); ker = np.hanning(2 * k + 1); ker /= ker.sum()
    pad = np.pad(c, k, mode='edge'); return np.convolve(pad, ker, mode='valid')
v = curve(wv); vm = curve(wm); pan = np.clip(curve(wp, 0.5), -0.6, 0.6)
def lpnoise(cut, seed):
    r = np.random.default_rng(seed); x = r.standard_normal(N); return sosfiltfilt(butter(2, cut, 'low', fs=SR, output='sos'), x)
gust = 1 + 0.25 * np.tanh(lpnoise(0.6, 3) * 40)   # slow gusting, deterministic
wind = np.zeros((N, 2))
lvl = np.clip(v / 38, 0, 1.1); lvlm = np.clip((vm - 8) / 50, 0, 1.1)
for ch, seed in ((0, 21), (1, 22)):
    r = np.random.default_rng(seed); n = r.standard_normal(N)
    body = sosfilt(butter(2, [90, 420], 'band', fs=SR, output='sos'), n) * (0.30 + 0.8 * lvl) ** 1.3
    mid = sosfilt(butter(2, [400, 1600], 'band', fs=SR, output='sos'), n) * (0.16 + 0.7 * lvl) ** 1.6
    air = sosfilt(butter(2, [1800, 6500], 'band', fs=SR, output='sos'), n) * (0.03 + 0.5 * lvlm) ** 2
    wind[:, ch] = (0.55 * body + 0.45 * mid + 0.35 * air) * gust
# the whistle: narrow-band noise whose centre follows the strongest wind on screen (500 Hz calm -> ~1.9 kHz at 60 m/s)
f = 420 + 24 * vm; ph = 2 * np.pi * np.cumsum(f) / SR
for ch, (s1, s2) in enumerate(((31, 32), (33, 34))):
    a1, a2 = lpnoise(18, s1), lpnoise(18, s2); a = np.hypot(a1.std(), a2.std())
    wh = (a1 * np.cos(ph + ch * 0.6) + a2 * np.sin(ph + ch * 0.6)) / a
    wind[:, ch] += 0.16 * wh * np.clip((vm - 22) / 35, 0, 1) ** 1.5 * gust
# keep the wind's pan with the strongest wind
wind[:, 0] *= np.sqrt(0.5 * (1 - pan)) * 1.41; wind[:, 1] *= np.sqrt(0.5 * (1 + pan)) * 1.41
wind = hp(wind.T, 45).T
wind *= 0.5 / (np.abs(wind).max() + 1e-9)

# ---------------------------------------------------------------- score
mus = []
def n(t, inst, p, dur, vel, pan=0, gain=1.0, film=False, **kw):
    if not film:   # a literal time in the old chart timeline: move it and stretch its length with the film
        t1 = O(t + (dur or 0)); t = O(t); dur = (t1 - t) if dur else dur
    if t < 0 or t >= DUR: return
    mus.append(dict(t=float(t), inst=inst, pitch=p, dur=dur, vel=vel, pan=pan, gain=gain, **kw))
# 0–4.5: one long harmonic over a low drone
n(0.0, 'violins', 'A5', 4.8, .30, .25, .38, attack=1.2, release=1.4)
n(0.0, 'cellos', 'D2', 5.0, .30, -.2, .40, attack=1.5, release=1.2)
# 4.5–11.2: the low end builds as the storm forms
n(4.5, 'contrabass', 'D1', 7.0, .45, 0, .55, attack=2.5, release=1.0)
n(4.5, 'cellos', 'A2', 7.0, .40, -.2, .45, attack=2.5, release=1.0)
n(6.2, 'violas', 'F3', 5.2, .36, .2, .38, attack=1.8, release=1.0)
n(7.4, 'timpani', 'D2', 1.3, .35, 0, .5)
for k, tk in enumerate(np.arange(7.6, 8.55, 0.11)): n(tk, 'timpani', 'D2', .3, .28 + .05 * k, 0, .45)
for e in ev:   # each record passed while the tag rolls: a celesta-like glint rising with the grade
    if e['type'] == 'roll': n(e['t'], 'glockenspiel', ['D5', 'E5', 'F5', 'A5', 'C6', 'D6', 'F6'][min(e['g'], 6)], .6, .32, .35, .30, film=True)
n(cue['land'], 'piano', 'D2', 3.0, .55, -.1, .55, film=True); n(cue['land'], 'piano', 'A2', 3.0, .45, .1, .45, film=True); n(cue['land'], 'piano', 'F3', 3.0, .40, .1, .40, film=True)
n(cue['land'], 'sus_cymbal', None, None, .25, .3, .25, film=True)
# 11.2–18.4: the track draws; strings move D minor -> Bb -> F -> C, one tone per record
for t0, ch in ((11.2, ['D3', 'A3', 'F4']), (13.0, ['Bb2', 'F3', 'D4']), (14.8, ['F2', 'C4', 'A4']), (16.6, ['C3', 'G3', 'E4'])):
    for i, p in enumerate(ch): n(t0, ['cellos', 'violas', 'violins'][i], p, 2.2, .30, -.3 + .3 * i, .36, attack=.6, release=.8)
for e in ev:
    if e['type'] == 'tick' and O(11) < e['t'] < O(18.6):
        n(e['t'], 'vibraphone', ['D5', 'D5', 'E5', 'F5', 'A5', 'C6', 'D6'][min(e['g'], 6)], .9, .34, .3 * np.sin(e['t'] * 3), .32, film=True)
# 18.4–23.0: the table prints; held strings thin out; then silence for a beat
for e in ev:
    if e['type'] == 'row': n(e['t'], 'harp', ['D4', 'F4', 'A4', 'C5', 'D5', 'F5'][e['k']], 1.2, .38, .2, .38, film=True)
n(18.6, 'cellos', 'D3', 4.3, .28, -.2, .36, attack=1.0, release=.3)
n(18.6, 'violins', 'A4', 4.3, .22, .2, .26, attack=1.5, release=.3)
n(cue['pointer0'], 'violins', 'D5', .85, .25, .1, .28, attack=.7, release=.05, film=True)   # the pointer climbs on a swell, then cut
V = cue['verdict']
n(V, 'piano', 'D1', 3.5, .7, 0, .7, film=True); n(V, 'piano', 'D2', 3.5, .6, 0, .55, film=True); n(V, 'timpani', 'D2', 2.5, .6, 0, .7, film=True)
n(V, 'vibraphone_bowed', 'A4', 2.6, .5, .2, .45, film=True); n(V, 'contrabass', 'D1', 2.6, .45, 0, .5, attack=.05, release=1.0, film=True)
# 26–33.6: the dive and the landfall; music almost gone, the wind takes over
n(26.4, 'cellos', 'D2', 7.0, .30, -.2, .32, attack=2.0, release=1.5); n(26.4, 'contrabass', 'A0', 7.0, .30, 0, .35, attack=2.0, release=1.5)
# 33.6–39.6: through the strait; a falling line in the violas
for i, p in enumerate(['A3', 'G3', 'F3', 'E3']): n(33.8 + i * 1.4, 'violas', p, 1.6, .28, .1, .32, attack=.4, release=.8)
n(33.8, 'cellos', 'D2', 6.0, .25, -.2, .3, attack=1.0, release=1.2)
# 39.6–48: the storm is spent; the chord resolves quietly; the track's last records chime
for i, p in enumerate(['D3', 'A3', 'F4', 'E5']): n(39.8, ['cellos', 'violas', 'violins', 'violins'][i], p, 7.4, .24, -.3 + .2 * i, .30, attack=1.6, release=1.5)
for e in ev:
    if e['type'] == 'tick' and O(38) < e['t'] < O(47): n(e['t'], 'vibraphone', ['D5', 'D5', 'E5', 'F5', 'A5', 'C6', 'D6'][min(e['g'], 6)], .9, .26, .2, .26, film=True)
for i, p in enumerate(['D4', 'F4', 'A4', 'D5', 'E5', 'A5']): n(cue['curve'] + i * .09, 'harp', p, 1.6, .30, -.2 + .08 * i, .30, film=True)
n(cue['card'], 'piano', 'D3', 3.4, .40, -.1, .42, film=True); n(cue['card'], 'piano', 'A3', 3.4, .34, .1, .36, film=True); n(cue['card'] + .35, 'piano', 'E4', 3.0, .30, .1, .32, film=True)
n(cue['card'], 'violins', 'A5', 3.4, .20, .2, .22, attack=.8, release=1.0, film=True)
music = S.render([(m['t'], m['inst'], m['pitch'], m['dur'], m['vel'], m['pan'], m['gain']) if 'attack' not in m and 'release' not in m else m for m in mus], dur=DUR, master=False)
music = S.room(music, size=.55, mix=.22)
music = music[:N] if len(music) >= N else np.pad(music, ((0, N - len(music)), (0, 0)))
# the beat of silence before the verdict
gate = np.ones(N); a, b = int((V - 0.42) * SR), int(V * SR); gate[a:b] = 0.02
gate[a - int(.06 * SR):a] = np.linspace(1, .02, int(.06 * SR))
music *= gate[:, None]

# ---------------------------------------------------------------- effects on the picture's actions
fx = np.zeros((N, 2))
for e in ev:
    if e['type'] == 'landfall':
        k = e['k']; g = [0, 0.9, 0.6, 0.5][k]
        add(fx, thump(1.0, 52) * 0.8, e['t'], g); add(fx, bp(np.random.default_rng(k).standard_normal(int(1.6 * SR)), 60, 220) * np.exp(-np.arange(int(1.6 * SR)) / SR / .5) * .5, e['t'], g)
for key, d, g in (('rise', .9, .35), ('dive', 2.6, .55), ('cut', .5, .25), ('settle', .7, .2)):
    for e in ev:
        if e['type'] == key: add(fx, whoosh(d, 1.0), e['t'] - (0.2 if key != 'dive' else 0), g)
for e in ev:
    if e['type'] == 'tick' and e['t'] < O(47.5): add(fx, hp(np.random.default_rng(int(e['t'] * 100)).standard_normal(int(.02 * SR)), 3000) * np.exp(-np.arange(int(.02 * SR)) / SR / .004) * .25, e['t'], .5, .2)

# ---------------------------------------------------------------- narration
vo = np.zeros(N); duck = np.zeros(N)
for c in TL['cues']:
    x, sr = sf.read(os.path.join(HERE, 'out/voice', c['id'] + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); x = hp(x, 80); x = x / (np.abs(x).max() + 1e-9) * 0.9
    x = compress(x, thr=.22, ratio=3.5, att=.003, rel=.09)
    i = int(round(c['t0'] * SR)); j = min(N, i + len(x)); vo[i:j] += x[:j - i]
    a0, a1 = max(0, i - int(.25 * SR)), min(N, j + int(.35 * SR)); duck[a0:a1] = 1
k = int(.18 * SR); ker = np.hanning(2 * k + 1); ker /= ker.sum(); duck = np.convolve(np.pad(duck, k, mode='edge'), ker, mode='valid')
vo = np.stack([vo, vo], 1)

# ---------------------------------------------------------------- mix
def dip(x, d, band_cut=0.32, all_cut=0.72):
    """under the voice: the 300 Hz–4 kHz band drops to band_cut, everything to all_cut"""
    sos = butter(2, [300, 4000], 'band', fs=SR, output='sos'); bnd = sosfiltfilt(sos, x, axis=0)
    gb = (1 - d * (1 - band_cut))[:, None]; ga = (1 - d * (1 - all_cut))[:, None]
    return ((x - bnd) + bnd * gb) * ga
wind_g = 0.80; mus_g = 0.95; fx_g = 0.75
bed = dip(wind * wind_g, duck) + dip(music * mus_g, duck) + fx * fx_g
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
on = duck > 0.9
vrms = rms(vo[on]); mrms = rms((dip(music * mus_g, duck))[on]); wrms = rms((dip(wind * wind_g, duck))[on])
vo_g = 10 ** ((max(mrms + 10, wrms + 8) - vrms) / 20)        # voice at least 10 dB over the music and 8 dB over the wind while it speaks
mix = bed + vo * vo_g
print('under the voice (RMS): voice %.1f dB, music %.1f dB, wind %.1f dB' % (rms((vo * vo_g)[on]), mrms, wrms))
print('bus RMS (whole film): wind %.1f dB, music %.1f dB, fx %.1f dB, voice %.1f dB' % (rms(wind * wind_g), rms(music * mus_g), rms(fx * fx_g), rms(vo * vo_g)))
mix = hp(mix.T, 32).T
mix[: int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR))[:, None]
mix[-int(1.4 * SR):] *= np.linspace(1, 0, int(1.4 * SR))[:, None] ** 1.5
# loudness: bring to about -16 LUFS (ITU-R BS.1770 K-weighting, gated), then limit
def lufs(x):
    from scipy.signal import lfilter
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(.4 * SR), int(.1 * SR)
    ms = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    l = -0.691 + 10 * np.log10(ms + 1e-12); ms = ms[l > -70]
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    ms2 = ms[(-0.691 + 10 * np.log10(ms)) > rel]
    return -0.691 + 10 * np.log10(ms2.mean())
for _ in range(3):
    L = lufs(mix); mix *= 10 ** ((-16 - L) / 20)
    mix = limit(mix, ceil=10 ** (-5.2 / 20))   # room for loudnorm's +2 dB and the AAC encoder's inter-sample peaks
mix = mix[:N]
A = sys.argv[1:3]
if A:   # a cut [start, end) of the same mix, with a short fade-out at its end
    a, b = int(round(float(A[0]) * SR)), int(round(float(A[1]) * SR)); mix = mix[a:b].copy(); f = int(.35 * SR)
    mix[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5; mix[:int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR))[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav', mix.shape, 'LUFS %.1f' % lufs(mix), 'peak %.2f dBFS' % (20 * np.log10(np.abs(mix).max())))
used = sorted({m['inst'] for m in mus}); print('instruments:', ', '.join(used))
print('\n'.join(S.credits(used)))
