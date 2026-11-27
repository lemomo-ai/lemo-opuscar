"""Mix for "Twenty-Three": score (music/score.wav) + narration (voices/*.wav) + paper foley made here → mix.wav
python styles/editorial-explainer/demo/mix.py   (events.mjs and music/score.py first)
Foley follows the desk's materials, dry and close: paper sliding and landing, a felt-tip highlighter, pencil on paper, a cut-out pressed down."""
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

rng = np.random.default_rng(23)
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur'] + .5; N = int(DUR * SR)

def slide(d=.22):                                # a sheet pushed across the desk
    return norm(bp(noise(d), 600, 4500) * np.sin(np.pi * t_(d) / d) ** 1.5)
def slap(big=False):                             # it lands: air pushed out, then the sheet's own slap
    d = .4 if big else .24; t = t_(d)
    return norm(lp(noise(d), 800) * env_exp(d, .04 if big else .028) + np.sin(2 * np.pi * (70 if big else 115) * t) * env_exp(d, .07 if big else .04) * .7 + hp(noise(d), 3000) * env_exp(d, .006) * .4)
def marker(d=.4):                                # felt tip: a squeak that rises a little, over a soft hiss
    t = t_(d); f = 1500 + 500 * t / d + 40 * np.sin(2 * np.pi * 31 * t)
    sq = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.5 + .5 * np.sin(2 * np.pi * 47 * t)) * .22
    return norm((bp(noise(d), 1800, 7000) * .9 + sq) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .05))
def pencil(d=.4, hard=False):                    # graphite: grainy band-passed noise, amplitude flickering with the paper's tooth
    t = t_(d); grain = .55 + .45 * np.abs(lp(noise(d), 60)) / .05
    return norm(bp(noise(d), 2200 if hard else 3000, 9000) * np.clip(grain, 0, 2) * np.minimum(1, t / .015) * np.minimum(1, (d - t) / .04))
def pop():                                       # a cut-out pressed onto the desk
    d = .07; t = t_(d); p = .9 + rng.random() * .3
    return norm(np.sin(2 * np.pi * 420 * p * t * (1 - 2.5 * t)) * env_exp(d, .016) + hp(noise(d), 2500) * env_exp(d, .003) * .5)
def tick():                                      # one more pencil line
    d = .035; t = t_(d); return norm(hp(noise(d), 4000) * env_exp(d, .004) + np.sin(2 * np.pi * 2600 * t) * env_exp(d, .005) * .3)
def riffle(d=1.0):                               # many small squares appearing: a card-riffle of clicks
    x = np.zeros(int(d * SR)); k = tick()
    for i in range(int(d * 24)): s = int(i / 24 * SR); n = min(len(k), len(x) - s); x[s:s + n] += k[:n] * (.5 + .5 * rng.random())
    return norm(x)
def dot():                                       # a point marked on the chart
    d = .3; t = t_(d); return norm(np.sin(2 * np.pi * 880 * t) * env_exp(d, .08) + np.sin(2 * np.pi * 1320 * t) * env_exp(d, .05) * .4)

FOLEY = {
    'slide': (lambda e: slide(), .10), 'slap': (lambda e: slap(), .26), 'slapBig': (lambda e: slap(True), .5),
    'marker': (lambda e: marker(e.get('d', .4)), .15), 'pencil': (lambda e: pencil(e.get('d', .4)), .09), 'scribble': (lambda e: pencil(e.get('d', .2), True), .2),
    'pop': (lambda e: pop(), .13), 'tick': (lambda e: tick(), .07), 'riffle': (lambda e: riffle(e.get('d', 1)), .06), 'dot': (lambda e: dot(), .12),
    'thump': (lambda e: sfx.thump(1, 62), .5), 'whoosh': (lambda e: sfx.whoosh(e.get('d', .5)), .13),
}
fol = np.zeros((N, 2)); used = set()
for e in ev['ev']:
    if e['type'] not in FOLEY: continue
    fn, gain = FOLEY[e['type']]; used.add(e['type'])
    add(fol, fn(e).astype(np.float64), max(0, e['t']), gain * e.get('g', 1), pan=float(rng.uniform(-.3, .3)))

lines = json.load(open(os.path.join(HERE, 'lines.json')))
vo = np.zeros((N, 2)); vad = np.zeros(N)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voices', L['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, SR, sr); y = hp(y, 85); y = sfx.compress(y / (np.abs(y).max() + 1e-9), thr=.3, ratio=3, att=.003, rel=.1); y = norm(y, .9)
    add(vo, y, L['t'], .74); s = int(L['t'] * SR); vad[s:s + len(y)] = 1
vad = uniform_filter1d(maximum_filter1d(vad, size=int(.16 * SR)), size=int(.25 * SR)); duck = 1 - .66 * vad      # music about −9.5 dB under the voice

mus, msr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert msr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mus = mus * duck[:, None] * .62
mix = mus + vo + fol
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')

db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print('foley used:', ' '.join(sorted(used)), '· peak %.2f dBFS' % (20 * np.log10(np.abs(mix).max())))
for L in lines:
    s = int(L['t'] * SR); e = s + int(sf.info(os.path.join(HERE, 'voices', L['id'] + '.wav')).duration * SR)
    print(f"{L['id']:3s} voice {db(vo[s:e]):6.1f}  music {db(mus[s:e]):6.1f}  foley {db(fol[s:e]):6.1f}")
