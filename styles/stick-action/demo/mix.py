# Mix: score (out/score.wav) + stylised foley from events.json (the page's window.EV) + wind and paper room tone → out/mix.wav
# The figures are ink, not flesh: hits are a low thump + a snap, blocks a dry wooden clack, steps paper taps, falls a thud with a paper rattle.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.join(HERE, '../../..')), 'core/audio'))
from sfx import *

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
tt = np.arange(N) / SR
rng = np.random.default_rng(13)
def curve(keys): k = np.array(keys, float); return np.interp(tt, k[:, 0], k[:, 1])
def stereo(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)

# ——— beds: paper room tone; wind for the standoffs, the empty edge and the last stance; energy hiss for the power-up ———
room = lp(brown(DUR), 300) * .05
wind_g = curve([(0, 0), (5.0, 0), (6.0, .6), (10.8, .5), (11.1, 0), (19.5, 0), (19.9, .8), (21.5, .5), (25.6, .2), (25.8, 0), (35.6, 0), (36.4, .7), (41.0, .9), (41.15, 0), (41.4, .5), (44.5, .6), (46.5, .25), (DUR, .2)])
wind = bp(noise(DUR), 200, 1600) * (.6 + .4 * np.sin(2 * np.pi * .23 * tt) * np.sin(2 * np.pi * .07 * tt + 1)) * .28
hiss_g = curve([(0, 0), (27.6, 0), (32.4, 1), (33.0, 1), (34.8, .6), (36.4, 0), (DUR, 0)])
crk = np.zeros(N); idx = rng.integers(0, N, 7000); crk[idx] = rng.uniform(.2, 1, len(idx))
hiss = (bp(noise(DUR), 2500, 9000) * .08 + bp(crk, 1500, 8000) * .6) * hiss_g
beds = stereo(room) + stereo(wind * wind_g, -.35) + stereo(np.roll(wind, 9001) * wind_g, .35) + stereo(hiss * .5, -.2) + stereo(np.roll(hiss, 5003) * .5, .2)

# ——— foley ———
def swish(v=1.0):
    d = .14 + .1 * min(v, 1.5); x = whoosh(d, 1)
    return hp(x, 300 + 500 * v) * min(1, .35 + .4 * v)
def snap(): d = .05; return norm(hp(noise(d), 2000) * env_exp(d, .004))
def thumpk(f=70): d = .3; t = t_(d); return norm(np.sin(2 * np.pi * (f + 60 * np.exp(-t / .02)) * t) * np.exp(-t / .08))
def hit(big=1.0): return norm(thumpk(60) * 1.0 + np.pad(snap(), (0, int(.25 * SR)))[:int(.3 * SR)] * .7) * big
def block():
    d = .12; t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau) for f, a, tau in ((880, 1, .03), (1620, .6, .02), (420, .5, .04))) + hp(noise(d), 1500) * np.exp(-t / .006)
    return norm(x)
def paper_tap(): d = .06; return norm(bp(noise(d), 600, 4000) * env_exp(d, .01)) * .6
def scrape(d=.5): t = t_(d); return norm(bp(noise(d), 800, 6000) * (1 + .6 * np.sin(2 * np.pi * 37 * t)) * np.sin(np.pi * t / d)) * .7
def puff(): d = .35; t = t_(d); return norm(lp(noise(d), 900) * np.exp(-t / .07))
def thud(): d = .5; t = t_(d); return norm(np.sin(2 * np.pi * (50 + 40 * np.exp(-t / .03)) * t) * np.exp(-t / .12) + bp(noise(d), 1000, 5000) * np.exp(-t / .05) * .3)
def boom(d=2.0): t = t_(d); return norm(np.sin(2 * np.pi * (34 + 70 * np.exp(-t / .06)) * t) * np.exp(-t / .6) + lp(noise(d), 1500) * np.exp(-t / .15) * .7)
def slash():
    d = .6; t = t_(d); ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / .25) for f in (3150, 4720, 6200)) * .3
    w = hp(whoosh(.25, 1), 1500)
    return norm(np.pad(w, (0, len(t) - len(w))) + ring)
def rip(d=.45): t = t_(d); x = np.zeros(len(t)); ii = rng.integers(0, len(t), 900); x[ii] = rng.uniform(.3, 1, 900); return norm(bp(x, 800, 7000) * np.exp(-t / .25) + bp(noise(d), 300, 3000) * np.exp(-t / .1) * .4)
def pen(d):
    t = t_(d); strokes = (np.sin(2 * np.pi * 6.5 * t) > -.2).astype(float)
    return bp(noise(d), 2500, 9000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 13 * t))) * lp(strokes, 30) * .5
def clap(): d = .15; return norm(bp(noise(d), 800, 3500) * env_exp(d, .02))
def fall(): d = 1.2; t = t_(d); f = 1400 * np.exp(-t / .5) + 200; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .1) * np.exp(-t / .5) * .25
def impact_tr(): d = .2; t = t_(d); return norm(hp(noise(d), 500) * np.exp(-t / .01) + np.sin(2 * np.pi * 90 * t) * np.exp(-t / .05))

fol = np.zeros((N, 2))
PAN = {'R': -.25, 'B': .25}
for ev in E['ev']:
    ty, t, who = ev['type'], ev['t'], ev.get('who'); pan = PAN.get(who, 0)
    if ty == 'pen': add(fol, pen(ev['d']), t, .22)
    elif ty == 'swish': add(fol, swish(ev.get('v', 1)), t, .22, pan)
    elif ty == 'block' or ty == 'lock': add(fol, block(), t, .5, pan)
    elif ty == 'hit': add(fol, hit(1.0), t, .8, pan); add(fol, boom(.8), t, .35)
    elif ty == 'whoosh': add(fol, swish(1.4), t, .3, pan)
    elif ty in ('land', 'hop', 'dash'): add(fol, puff(), t, .3, pan); add(fol, paper_tap(), t, .3, pan)
    elif ty == 'skid': add(fol, scrape(.45), t, .35, pan); add(fol, puff(), t, .25, pan)
    elif ty == 'step' or ty == 'knee': add(fol, paper_tap(), t, .3 if ty == 'step' else .45, pan)
    elif ty == 'grip': add(fol, paper_tap(), t, .6, -.4); add(fol, scrape(.2), t + .02, .25, -.4)
    elif ty == 'scrape': add(fol, scrape(.7), t, .35, -.4)
    elif ty == 'clash': add(fol, boom(2.5), t, .9); add(fol, rip(.6), t + .05, .5); add(fol, impact_tr(), t, .7)
    elif ty == 'snap': add(fol, boom(1.2), t, .7); add(fol, puff(), t, .4, -.5); add(fol, puff(), t, .4, .5)
    elif ty == 'pass': add(fol, slash(), t, .7)
    elif ty == 'cut': add(fol, hit(1.0), t, .7, .2); add(fol, slash() * .4, t, .4, .2)
    elif ty == 'thud': add(fol, thud(), t, .7, -.2)
    elif ty == 'clap': add(fol, clap(), t, .5)
    elif ty == 'fall': add(fol, fall(), t - .3, .5, -.6)
    elif ty == 'impactframe': add(fol, impact_tr(), t, .5)
    elif ty == 'title': add(fol, hit(.8), t, .4)
    elif ty == 'titleout': add(fol, whoosh(.3, 1), t, .2)

mus, _ = sf.read(os.path.join(HERE, 'out/score.wav'))
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
# duck the music a little under the big impacts rather than under a voice (there is none)
duck = np.zeros(N)
for ev in E['ev']:
    if ev['type'] in ('hit', 'clash', 'snap', 'pass', 'cut'): duck[int(ev['t'] * SR):int((ev['t'] + .35) * SR)] = 1
from scipy.ndimage import uniform_filter1d
duck = uniform_filter1d(duck, int(.08 * SR))
out = mus * .55 * (1 - .35 * duck)[:, None] + beds + fol
from scipy.signal import butter as _bt, sosfiltfilt
out = out + (10 ** (-10 / 20) - 1) * sosfiltfilt(_bt(4, 120, 'low', fs=SR, output='sos'), out, axis=0)   # low shelf: taiko and booms would otherwise swamp small speakers
# silences: the hit-stop (4 frames) and the held breath before the pass keep only the room
out[int(41.0 * SR):int(41.2 * SR)] *= .25
out *= np.minimum(1, (DUR - tt) / 1.5)[:, None]
out /= np.percentile(np.abs(out), 99.99) / .85
out = np.stack([limit(out[:, c], .4) for c in (0, 1)], 1)   # the impacts' transients are tamed so loudnorm keeps its peak ceiling
sf.write(os.path.join(HERE, 'out/mix.wav'), out.astype(np.float32), SR)
def band(x, a, b): return 10 * np.log10(np.mean(bp(x.mean(1), a, b) ** 2) + 1e-12)
print('mix.wav', DUR, 's · 20–120 Hz vs 120–8k: %.1f dB' % (band(out, 20, 120) - band(out, 120, 8000)))
