# Mix: ambience and foley (from events.json) + narration + score (ducked under narration) → mix.wav
# Sound design: the time-lapse stretches are music-led, keeping only a very light "sped-up city" bed, track clicks and signal relays; the real-speed stretch suddenly turns "real" — idling engines, birdsong, ducks, webbed feet slapping the ground
import sys, os, json, numpy as np, soundfile as sf, librosa
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../core/audio'))
from sfx import *
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR); EV = E['ev']
T = lambda ty: [e for e in EV if e['type'] == ty]
rng = np.random.default_rng(20)
amb, sfxb, vob = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def envw(a, b, fi=.3, fo=.3): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))

# —— Ambience beds ——
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
city_far = colored(80, 900) * .5 + colored(900, 3000) * .12            # distant city bed
wind = lp(np.cumsum(rng.standard_normal(N)) * .01, 400); wind = hp(wind, 30); wind /= np.abs(wind).max()
# Time-lapse stretches: "the sped-up city" — band-passed noise + fast granular modulation (8–16 Hz), density rising section by section
grain = colored(600, 5000) * (0.55 + 0.45 * np.sin(2 * np.pi * (11 + 3 * np.sin(tt * .7)) * tt) ** 2)
tl_level = np.interp(tt, [0, 5, 5.2, 9, 14, 19, 22.5, 23.8, 24, 29.9, 30.2, 34, 36, 38], [0, 0, .25, .35, .45, .5, .7, .1, 0, 0, .6, .45, .15, 0])
for ch, p in ((0, .9), (1, 1.1)):
    amb[:, ch] += grain * tl_level * .05 * p
# Dawn: wind + distant city
amb += (wind * .06 * envw(0, 5.2, .6, .4))[:, None]
amb += (city_far * .03 * envw(0, 5.2, .5, .4))[:, None]
# Real-speed stretch: idling (several cars' low end layered) + distant city + sparrows
idle = sum(np.sin(2 * np.pi * f * tt + rng.random() * 6) * (1 + .3 * np.sin(2 * np.pi * (f / 30) * tt)) for f in (31, 33.5, 29, 36)) / 4
idle = lp(idle + .35 * np.tanh(idle * 3) * np.sin(2 * np.pi * 62 * tt), 220)
real = envw(23.6, 30.4, .5, .35)
amb += (idle * .055 * real)[:, None]
amb += (city_far * .05 * real)[:, None]
def chirp(d=.09, f0=4200, f1=5600):
    t = t_(d); f = np.linspace(f0, f1, len(t)); ph = np.cumsum(2 * np.pi * f / SR)
    return np.sin(ph) * np.sin(np.pi * t / d) ** 2
for t0 in [.4, .62, 2.1, 24.3, 24.5, 26.9, 27.1, 28.9]:   # sparrows (dawn + real-speed stretch)
    for k in range(rng.integers(2, 4)): add(amb, chirp(.06 + rng.random() * .04, 3800 + rng.random() * 900, 5200 + rng.random() * 900), t0 + k * .09, .05, rng.uniform(-.7, .7))
# Rise: upward-sweeping wind
up = bp(rng.standard_normal(N), 300, 4000) * envw(30.3, 36.5, 1.2, 2.5)
up = np.array([np.convolve(up, np.ones(1), 'same')]).ravel()
amb += (hp(up, 200) * .05)[:, None]

# —— Foley ——
def relay(v=1.):   # traffic-signal relay
    d = .05; t = t_(d); return (hp(noise(d), 3000) * env_exp(d, .002) * .6 + np.sin(2 * np.pi * 1800 * t) * env_exp(d, .006) * .4) * v
def car_pass(d=1.6, v=1.):   # first car of the morning passing (Doppler + engine)
    t = t_(d); f = 55 * (1.15 - .3 * t / d); ph = np.cumsum(2 * np.pi * f / SR)
    eng = np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3.1 * ph); tyre = bp(noise(d), 300, 1800) * .6
    return lp(eng + tyre, 1500) * np.sin(np.pi * t / d) ** 1.5 * v
def rail(v=1.):   # wheels over a rail joint: click-clack
    x = clack(.55, 1) * .8; y = np.zeros(int(.12 * SR) + len(x)); y[:len(x)] += x; y[int(.12 * SR):] += clack(.5, .8)[:len(y) - int(.12 * SR)]
    return y * v
def squeal(d=.7, v=1.):
    t = t_(d); f = 2600 - 400 * t / d; return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) * (1 + .2 * np.sin(40 * t)) * v
def chime(v=1.):
    out = np.zeros(int(1.0 * SR))
    for k, f in enumerate([988, 784]):
        t = t_(.6); s = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * env_exp(.6, .18); out[int(k * .28 * SR):int(k * .28 * SR) + len(s)] += s
    return out * v
def hiss(d=.5, v=1.): return hp(noise(d), 2500) * env_exp(d, .15) * v
def honk(f=420, d=.28, v=1.):
    t = t_(d); x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * .5
    return bp(x, 400, 3000) * np.minimum(1, t / .01) * np.minimum(1, (d - t) / .03) * v
def pat(v=1.):   # webbed feet on asphalt: a wet, soft "pat"
    d = .04; return lp(noise(d), 900) * env_exp(d, .006) * v
def quack(soft=False, v=1.):
    d = .22 if not soft else .16; t = t_(d); f = 520 - 180 * t / d
    x = np.sign(np.sin(np.cumsum(2 * np.pi * f / SR))) * .6 + np.sin(np.cumsum(2 * np.pi * f * 2 / SR)) * .4
    x = bp(x, 700, 2600, 2) + bp(x, 1200, 1700, 2) * .6
    return x * np.sin(np.pi * t / d) ** .6 * v
def peep(happy=False, v=1.):
    d = .1 if not happy else .16; t = t_(d); f = np.linspace(3600, 4600 if happy else 4100, len(t))
    if happy: f = 3600 + 1400 * np.sin(np.pi * t / d)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / d) ** 2 * v
def tape_down(d=1.6, v=1.):   # time-lapse "brake": a whoosh with falling pitch
    t = t_(d); f = 900 * np.exp(-2.4 * t / d) + 40; x = bp(noise(d), 200, 3000) * .5 + np.sin(np.cumsum(2 * np.pi * f / SR)) * .5
    return lp(x, 2500) * np.sin(np.pi * np.minimum(t / d, 1)) ** .5 * v
def rev(d=1.2, v=1.):   # release: a wash of engines pulling away
    t = t_(d); out = np.zeros(len(t))
    for k in range(5):
        f = (40 + 8 * k) * (1 + 1.2 * (t / d) ** .7); out += np.sin(np.cumsum(2 * np.pi * f / SR) + k) * (.6 + .4 * rng.random())
    return lp(out, 600) * np.sin(np.pi * t / d) ** .8 * v
def splash(v=1.): d = .5; return (bp(noise(d), 400, 3000) * env_exp(d, .08) + lp(noise(d), 300) * env_exp(d, .05) * .5) * v

add(sfxb, car_pass(2.2, 1), .5, .12, .3)                 # red car drives in from the bottom of frame
add(sfxb, relay(1.2), 2.98, .25, 0)                       # green light
add(sfxb, car_pass(1.4, .8), 3.05, .1, -.2)               # pulls away through the junction
for e in T('light'):
    if e['win'] in ('ix', 'jam'): add(sfxb, relay(.8), e['t'], .12, rng.uniform(-.3, .3))
for e in T('carriage'): add(sfxb, rail(1), e['t'], .22, -.1 + e['k'] * .05)
add(sfxb, squeal(.8), 16.2, .03, .2); add(sfxb, hiss(.6), 17.05, .08, 0); add(sfxb, chime(1), 17.2, .06, 0); add(sfxb, hiss(.5), 18.4, .07, 0)
for k in range(9): add(sfxb, honk(rng.choice([330, 392, 440, 494]), .18 + rng.random() * .2), 19.3 + rng.random() * 3.0, .03 + rng.random() * .02, rng.uniform(-.8, .8))
add(sfxb, tape_down(1.6), 22.45, .12, 0)
for e in T('duckStep'): add(sfxb, pat(1), e['t'], .06 if e['i'] == 0 else .035, np.clip((10.5 - 10.4) * .1, -1, 1))
for e in T('hop'): add(sfxb, pat(1.4), e['t'] + .3, .1, -.2)
for e in T('hopFail'): add(sfxb, lp(noise(.06), 500) * env_exp(.06, .01), e['t'] + .2, .14, -.2)
for e in T('quack'): add(sfxb, quack(bool(e.get('soft'))), e['t'], .09 if not e.get('soft') else .06, -.25)
for e in T('peep'): add(sfxb, peep(bool(e.get('happy'))), e['t'], .05, -.15)
add(sfxb, rev(1.4), 29.85, .12, 0)
for e in T('splash'): add(sfxb, splash(), e['t'], .02, -.3)

# —— Narration ——
VO = {e['id']: e['t'] for e in T('vo')}
for k, t in VO.items():
    y, sr = sf.read(os.path.join(HERE, 'voices', k + '.wav')); y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    y = compress(y / np.abs(y).max(), .3, 3.0); add(vob, y, t, 1.0)

# —— Score —— (ducked about -8 dB under narration)
mus = np.zeros((N, 2))
mp = os.path.join(HERE, 'music', 'score.wav')
if os.path.exists(mp):
    m, sr = sf.read(mp)
    if m.ndim == 1: m = np.stack([m, m], 1)
    if sr != SR: m = librosa.resample(m.T, orig_sr=sr, target_sr=SR).T
    mus[:min(N, len(m))] = m[:N]
else: print('!! no music/score.wav; mixing only ambience + foley + narration')
# The tuned-horn chords (20.0 / 22.0) don't stand out enough when the skeleton is completely full: push the brass stem up another +4 dB at those two points
bp_ = os.path.join(HERE, 'music', 'stems', 'brass.wav')
if os.path.exists(bp_):
    b, sr = sf.read(bp_)
    if b.ndim == 1: b = np.stack([b, b], 1)
    b = b[:N]; g = np.zeros(N)
    for t0 in (20.0, 22.0): g += np.clip(1 - np.abs(tt[:len(g)] - (t0 + .25)) / .5, 0, 1)
    mus[:len(b)] += b * (10 ** (4 / 20) - 1) * g[:len(b), None]
venv = uniform_filter1d(np.abs(vob).max(1), int(.05 * SR)); vk = np.clip(venv / .05, 0, 1)
vk = uniform_filter1d(np.maximum.accumulate(vk[::-1])[::-1] * 0 + vk, int(.25 * SR))
duck = 1 - .6 * np.clip(vk * 1.5, 0, 1)
mus *= duck[:, None]

def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
mix = mus * .85 + vob * .95 + sfxb * 1.0 + amb * 1.0
# Pre-raise the overall level to RMS≈-17 dB, then limit at -1.5 dBFS, so mux.sh's two-pass loudnorm can reach -14 LUFS with linear gain (the peak won't force it back into dynamic mode)
mix *= 10 ** ((-17 - 20 * np.log10(rms(mix))) / 20)
for ch in range(2): mix[:, ch] = limit(mix[:, ch], .84)
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
for a, b, nm in [(0, 5, 'dawn'), (5, 9, 'title'), (9, 14, 'ix'), (14, 19, 'train'), (19, 22.5, 'jam'), (22.5, 24, 'ramp'), (24, 30, 'rest'), (30, 34, 'top'), (34, 38, 'end')]:
    s = slice(int(a * SR), int(b * SR))
    print(f'{nm:6s} mix {20*np.log10(rms(mix[s])):6.1f}  mus {20*np.log10(rms(mus[s])):6.1f}  vo {20*np.log10(rms(vob[s])):6.1f}  sfx {20*np.log10(rms(sfxb[s])+1e-9):6.1f}  amb {20*np.log10(rms(amb[s])):6.1f} dB')
print('mix.wav', mix.shape)
