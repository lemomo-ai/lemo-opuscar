# Mix: original score (music/score.wav) + material foley (crayon scratching paper, wet brush, felt, paper pages) + night ambience + narration → mix.wav
# Usage: .venv/bin/python styles/crayon-book/demo/mix.py
import sys, os, json, numpy as np, soundfile as sf, soxr
from scipy.ndimage import uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../../core/audio'))
from sfx import *

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']; N = int(DUR * SR)
tt = np.arange(N) / SR
rng = np.random.default_rng(12)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def T(d): return np.arange(int(round(d * SR))) / SR
def fade(x, a=.01, b=.03):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x
def envelope(d, pts):
    k = np.array(pts, float); return np.interp(T(d), k[:, 0] * d, k[:, 1])

# ——— crayon on paper: stick-slip friction = band-passed noise × irregular grain modulation; the faster the speed, the denser and brighter the grain ———
def crayon(d, speed=1.0, v=1.0):
    n = nz(d); g = np.abs(rng.standard_normal(len(n)))
    rate = int(SR / (70 + 90 * speed))
    grain = uniform_filter1d((rng.random(len(n) // rate + 2) ** 3).repeat(rate)[:len(n)], rate // 3 + 1)
    x = bp(n, 1400 + 600 * speed, 6500, 2) * (0.35 + grain * 1.6) + bp(n, 300, 900, 1) * 0.15
    return fade(x * envelope(d, [(0, 0), (.08, 1), (.85, .9), (1, 0)]) * v * 0.22, .01, .04)
# Fill: back-and-forth hatching = one short scratch per pass
def scribble(d, rate=6.5, v=1.0):
    out = np.zeros(int(d * SR)); k = 0; t = 0.0
    while t < d - 0.08:
        L = 1 / rate * (0.8 + 0.4 * rng.random()); s = crayon(min(L, d - t), 1.3, v * (0.7 + 0.3 * rng.random()))
        i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]; t += L; k += 1
    return out
def write(d, v=1.0):   # writing: in little clusters
    out = np.zeros(int(d * SR)); t = 0.0
    while t < d - 0.1:
        L = 0.07 + 0.1 * rng.random(); s = crayon(L, 0.8, v); i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]; t += L + 0.03 * rng.random()
    return out
def paper_rustle(d=0.6, v=1.0):
    n = nz(d); cr = (rng.random(len(n)) < 0.004) * rng.standard_normal(len(n)) * 3
    return fade((hp(n, 900) * 0.25 + bp(cr, 1500, 8000)) * envelope(d, [(0, 0), (.2, 1), (1, 0)]) * v * 0.25)
def blink(v=1.0):
    t = T(0.09); return fade(np.sin(2 * np.pi * (1500 - 5000 * t) * t) * np.exp(-t / 0.02) * 0.25 * v, .001, .02)
def swish(d=0.4, v=1.0):   # blanket swish
    n = nz(d); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    return lp(bp(n, 250, 2500), 2200) * e * 0.35 * v
def felt(v=1.0):   # sheep landing: felt thump
    t = T(0.22); return fade((np.sin(2 * np.pi * 105 * t) * np.exp(-t / 0.05) * 0.7 + lp(nz(0.22), 600) * np.exp(-t / 0.03) * 0.5) * v * 0.45)
def baa(v=1.0, f0=430):
    d = 0.42; t = T(d); f = f0 * (1 + 0.02 * np.sin(2 * np.pi * 7 * t)) * (1 - 0.08 * t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    x = bp(saw, 600, 1100) * 1.0 + bp(saw, 1900, 2600) * 0.5
    trem = 1 + 0.5 * np.sin(2 * np.pi * 18 * t)
    return fade(x * trem * envelope(d, [(0, 0), (.1, 1), (.7, .8), (1, 0)]) * 0.12 * v, .02, .08)
def cricket(d=1.2, v=1.0):
    out = np.zeros(int(d * SR)); t = 0
    while t < d - 0.1:
        for k in range(3):
            tc = T(0.018); c = np.sin(2 * np.pi * 4700 * tc) * np.sin(np.pi * tc / 0.018)
            i = int((t + k * 0.026) * SR); out[i:i + len(c)] += c[:len(out) - i]
        t += 0.32 + 0.1 * rng.random()
    return out * 0.05 * v
def tap(v=1.0, f=900):   # small footsteps on the roof tiles
    t = T(0.08); return fade((bp(nz(0.08), f, f * 3) * np.exp(-t / 0.012) + np.sin(2 * np.pi * f * 0.35 * t) * np.exp(-t / 0.02) * 0.4) * 0.35 * v, .001, .02)
def plip(v=1.0):   # brush dipped in water
    t = T(0.25); x = np.sin(2 * np.pi * np.cumsum(900 + 1400 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.05)
    return fade(x * 0.25 * v + bp(nz(0.25), 2000, 7000) * np.exp(-t / 0.02) * 0.08 * v)
def brush(d, v=1.0):   # wet bristles across paper: soft broadband + fine grain, soft attack and release
    n = nz(d)
    wet = lp(n, 1800) * 0.5 + bp(n, 1800, 5000) * 0.18
    grain = uniform_filter1d(np.abs(rng.standard_normal(len(n))), 400) * 0.6 + 0.7
    body = wet * grain * envelope(d, [(0, 0), (.06, .9), (.3, 1), (.8, .85), (1, 0)])
    return fade(body * 0.22 * v, .03, .1)
def pat(v=1.0):
    t = T(0.12); return fade(lp(nz(0.12), 500) * np.exp(-t / 0.025) * 0.5 * v + np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.03) * 0.2 * v)
def page_turn(d=1.2, v=1.0):
    out = np.zeros(int((d + 0.4) * SR))
    lift = hp(nz(0.35), 700) * envelope(0.35, [(0, 0), (.5, .6), (1, .2)]) * 0.18
    wh = bp(nz(0.6), 300, 4000) * np.sin(np.linspace(0, np.pi, int(0.6 * SR))) ** 1.5 * 0.35
    cr = (rng.random(int(0.6 * SR)) < 0.003) * rng.standard_normal(int(0.6 * SR)) * 2.5
    flap_t = T(0.25); flap = (lp(nz(0.25), 1500) * np.exp(-flap_t / 0.03) * 0.6 + np.sin(2 * np.pi * 90 * flap_t) * np.exp(-flap_t / 0.05) * 0.3)
    for x, at in [(lift, 0.0), (wh + bp(cr, 2000, 9000), 0.25), (flap, d - 0.1)]:
        i = int(at * SR); out[i:i + len(x)] += x[:len(out) - i]
    return out * v
def tick(v=1.0, hi=True):
    t = T(0.04); return fade(bp(nz(0.04), 2500 if hi else 1800, 7000) * np.exp(-t / 0.006) * 0.12 * v, .0005, .01)

buf = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(x, at, g=1.0, pan=0.0, b=None): add(buf if b is None else b, x.astype(np.float64), at, g, pan)

for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0.0)
    if ty == 'scratch': put(crayon(e['dur'], 1.1), t, 1.0, pan)
    elif ty == 'write': put(write(e['dur']), t, 0.9, pan)
    elif ty == 'scribble': put(scribble(e['dur']), t, 0.75, pan)
    elif ty == 'paper': put(paper_rustle(0.8), t, 0.8)
    elif ty == 'pop': put(blink(), t, 0.8, pan)
    elif ty == 'toss': put(swish(0.45), t - 0.05, 1.0, pan)
    elif ty == 'hop': put(felt(), t, 0.8, -0.2 + 0.15 * e['i'])
    elif ty == 'baa': put(baa(0.9, 420 + 25 * e['i']), t, 0.9, pan)
    elif ty == 'number': put(crayon(0.2, 1.4), t, 0.7, -0.6)
    elif ty == 'cricket': put(cricket(0.7), t, 1.0, pan)
    elif ty == 'rung': put(crayon(0.12, 1.6), t - 0.12, 0.8, 0.3)
    elif ty == 'hopout': put(swish(0.3, 0.6), t, 1.0, 0.1); put(felt(0.7), t + 0.42, 1.0, 0.2)
    elif ty == 'climbover': put(swish(0.4, 0.6), t, 1.0, 0.2); put(pat(0.7), t + 0.3, 1.0, 0.2)
    elif ty == 'step': put(tap(0.8), t, 1.0, -0.1)
    elif ty == 'sit': put(pat(0.8), t, 1.0, -0.2); put(swish(0.3, 0.4), t - 0.1, 1.0, -0.2)
    elif ty == 'dip': put(plip(), t, 0.9, -0.5)
    elif ty == 'brush':
        d = e['dur'] + 0.25; x = brush(d)
        # pan follows the brush: panned in two halves
        p0, p1 = (-0.85, 0.85) if e['dir'] > 0 else (0.85, -0.85)
        L = len(x); s = int(t * SR); pn = np.linspace(p0, p1, L)
        l, r = np.cos((pn + 1) * np.pi / 4) * 1.414, np.sin((pn + 1) * np.pi / 4) * 1.414
        e2 = min(N, s + L); buf[s:e2, 0] += (x * l)[:e2 - s]; buf[s:e2, 1] += (x * r)[:e2 - s]
    elif ty == 'cap': put(crayon(e['dur'], 1.0), t, 0.8, 0.3)
    elif ty == 'quilt': put(scribble(e['dur'], 7.5), t, 0.8, 0.3); put(swish(1.2, 0.35), t + 0.2, 1.0, 0.3)
    elif ty == 'tuck': put(pat(0.7), t, 1.0, 0.3)
    elif ty == 'liedown': put(swish(0.5, 0.5), t, 1.0, -0.1)
    elif ty == 'page': put(page_turn(e['dur']), t, 0.4, -0.1)
    elif ty == 'room':
        # the desk scene: warm indoor room tone + a distant mantel clock
        d = DUR - t; x = lp(brown(d), 400) * 0.02 * envelope(d, [(0, 0), (.15, 1), (1, 1)])
        add(amb, x, t, 1.0, 0.0)
        k = 0; tc = t + 0.3
        while tc < DUR - 0.2: add(amb, tick(0.8, k % 2 == 0), tc, 1.0, 0.5); tc += 1.0; k += 1

# Night ambience: very soft crickets after the sheep counting, even softer during the song; fades out before the desk scene
nb = np.zeros(N)
for t0 in np.arange(15.0, 45.5, 1.7): x = cricket(1.2, 0.35); i = int(t0 * SR); nb[i:i + len(x)] += x[:N - i]
nb *= np.interp(tt, [15, 16, 27, 28, 44, 45.8], [0, 1, 1, .5, .5, 0])
amb[:, 0] += nb * 0.8; amb[:, 1] += np.roll(nb, 900) * 0.8
# Paper room tone: a very faint "paper" air sound (from the opening to the desk)
air = hp(nz(DUR), 3000) * 0.0025
amb[:, 0] += air * np.interp(tt, [0, 1, 45, 46], [1, 1, 1, 0]); amb[:, 1] += np.roll(air, 2000) * np.interp(tt, [0, 1, 45, 46], [1, 1, 1, 0])

# ——— narration: Kokoro af_heart (soft bedtime voice), 24k → 48k ———
# Chain: high-pass → compress first (slow attack, slow release, to cut the TTS peak-to-average ratio) → balancing EQ (warm low shelf, gentle 3 kHz cut, 6 kHz high-shelf cut)
#       → split-band de-essing → level by RMS → warm close-up reverb (pre-delay + early reflections + low-passed tail)
from scipy.signal import fftconvolve, sosfilt as _sosfilt
def biquad(x, kind, f0, gain_db, q=0.707):   # RBJ cookbook
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; cw, sw = np.cos(w), np.sin(w); al = sw / (2 * q)
    if kind == 'peak':
        b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]
    else:
        s2 = 2 * np.sqrt(A) * al; sg = 1 if kind == 'high' else -1
        b = [A * ((A + 1) + sg * (A - 1) * cw + s2), -2 * sg * A * ((A - 1) + sg * (A + 1) * cw), A * ((A + 1) + sg * (A - 1) * cw - s2)]
        a = [(A + 1) - sg * (A - 1) * cw + s2, 2 * sg * ((A - 1) - sg * (A + 1) * cw), (A + 1) - sg * (A - 1) * cw - s2]
    return _sosfilt(np.array([b + a]) / a[0], x)
def deess(x, lo=4800, hi=10000, thr_rel=0.5, ratio=4.0):
    band = bp(x, lo, hi, 2)
    eb = uniform_filter1d(np.abs(band), int(0.004 * SR)); ef = uniform_filter1d(np.abs(x), int(0.004 * SR))
    over = eb / (ef * thr_rel + 1e-9)                      # sibilant segment: high-band envelope is too large a share of the full-band envelope
    g = np.where(over > 1, over ** (1 / ratio - 1), 1.0)
    g = uniform_filter1d(g, int(0.003 * SR))
    return x - band + band * g, 20 * np.log10(g.min() + 1e-9)
VO_RMS = 10 ** (-21.0 / 20)                                # active-segment RMS per line (about +6~10 dB over music + foley at the same time)
LN = json.load(open(os.path.join(HERE, 'lines.json')))
vo = np.zeros((N, 2)); vmask = np.zeros(N)
for e in [x for x in EV if x['type'] == 'voice']:
    a, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR)
    a = hp(a, 75)
    a = compress(a / (np.abs(a).max() + 1e-9) * 0.8, thr=.2, ratio=2.5, att=.008, rel=.14)   # compress first
    a = biquad(a, 'low', 220, 1.5)                          # a little chest warmth
    a = biquad(a, 'peak', 3200, -2.0, 1.0)                  # gentle 3 kHz cut, removes "sharpness"
    a = biquad(a, 'high', 6000, -4.0)                       # high shelf −4 dB, not harsh
    a, gr = deess(a)
    act = np.abs(a) > np.abs(a).max() * 0.05
    a = a * VO_RMS / (np.sqrt(np.mean(a[act] ** 2)) + 1e-9)
    print(f'  vo {e["id"]}: de-ess max GR {gr:5.1f} dB  peak {20*np.log10(np.abs(a).max()):5.1f}')
    add(vo, a, e['t'], 1.0, 0.0)
    s = int(e['t'] * SR); vmask[s:s + len(a)] = 1
# Warm close-up reverb: 12 ms pre-delay, a few early reflections, 0.7 s low-passed tail, decorrelated channels; wet about −17 dB
def warm_ir(seed):
    r = np.random.default_rng(seed); L = int(0.9 * SR); ir = np.zeros(L); pd = int(0.012 * SR)
    for ms, g in [(7, .5), (11, .38), (17, .3), (23, .22), (31, .16)]: ir[pd + int((ms + r.uniform(-1, 1)) * SR / 1000)] += g * r.choice([-1, 1])
    tt_ = np.arange(L - pd) / SR; tail = r.standard_normal(L - pd) * np.exp(-tt_ / 0.11) * np.clip(tt_ / 0.02, 0, 1) * 0.35
    ir[pd:] += lp(tail, 3200); return lp(ir, 5000)
dry = vo.copy()
for c in range(2):
    wet = fftconvolve(dry[:, c], warm_ir(31 + c), 'full')[:N]
    vo[:, c] += wet * (10 ** (-17 / 20)) / (np.sqrt(np.mean(wet ** 2)) / (np.sqrt(np.mean(dry[:, c] ** 2)) + 1e-12) + 1e-12)

# ——— score ———
mp = os.path.join(HERE, 'music', 'score.wav')
SG = {'musicbox': 1.45, 'glock': 1.4, 'toypiano': 1.0, 'flute': 1.0, 'clarinet': 1.0, 'bass': 1.0}
stems = [os.path.join(HERE, 'music', 'stems', k + '.wav') for k in SG]
if all(os.path.exists(p) for p in stems):
    mus = np.zeros((N, 2))
    for k, p in zip(SG, stems):
        m, msr = sf.read(p)
        if m.ndim == 1: m = np.stack([m, m], 1)
        L = min(N, len(m)); mus[:L] += m[:L] * SG[k]
    # metallic sheen of music box and glockenspiel: gentle 3–6 kHz lift
    for c in range(2): mus[:, c] += bp(mus[:, c], 3000, 7000, 2) * 0.35
elif os.path.exists(mp):
    m, msr = sf.read(mp)
    if msr != SR: m = soxr.resample(m, msr, SR)
    if m.ndim == 1: m = np.stack([m, m], 1)
    mus = np.zeros((N, 2)); L = min(N, len(m)); mus[:L] = m[:L]
else:
    print('!! music/score.wav is missing; run music/score.py first'); mus = np.zeros((N, 2))
# duck about −7 dB under narration (smoothed)
duck = uniform_filter1d(vmask, int(0.25 * SR)); duck = np.clip(duck * 1.6, 0, 1)
g = 1 - duck * (1 - 10 ** (-7 / 20))
mus *= g[:, None]
# foley also ducks 4 dB under narration (foley is dense in the counting-sheep, ladder and blanket lines)
buf *= (1 - duck * (1 - 10 ** (-4 / 20)))[:, None]
# the song section is the emotional peak: no narration, music raised 4 dB overall (smooth in and out)
mus *= (10 ** (np.interp(tt, [27.0, 27.6, 37.2, 38.2], [0, 4, 4, 0]) / 20))[:, None]

buf *= np.interp(tt, [0, 5, 5.5], [0.8, 0.8, 1.0])[:, None]
mix = mus * 0.95 + buf * 1.0 + amb * 1.0 + vo * 1.0
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
# level meter
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for name, x in [('music', mus), ('foley', buf), ('amb', amb), ('voice', vo), ('mix', mix)]: print(f'{name:6s} RMS {db(x):6.1f} dB  peak {20*np.log10(np.abs(x).max()+1e-9):6.1f}')
for a, b in [(0, 7.5), (7.5, 15), (15, 20), (20, 27.5), (27.5, 37.5), (37.5, 45), (45, 52)]:
    s, e = int(a * SR), int(b * SR); print(f'{a:5.1f}-{b:5.1f}  mus {db(mus[s:e]):6.1f}  fol {db(buf[s:e]):6.1f}  vo {db(vo[s:e]):6.1f}  mix {db(mix[s:e]):6.1f}')
if os.environ.get('DBG'):
    fb = np.abs(buf).max(1); 
    for i in np.argsort(fb)[::-1][:1]: print('foley peak at', i / SR)
    w = int(0.5 * SR)
    for k in range(0, N - w, w):
        p = np.abs(buf[k:k + w]).max()
        if p > 0.3: print(f'  {k/SR:5.1f}s foley peak {p:.2f}')
# per line: narration vs music + foley at the same time (target +6~9 dB: clearly audible but not jumping out)
for e in [x for x in EV if x['type'] == 'voice']:
    s = int(e['t'] * SR); L = int(json.load(open(os.path.join(HERE, 'voices', 'dur.json')))[e['id']] * SR)
    bed = mus[s:s + L] * 0.95 + buf[s:s + L] + amb[s:s + L]
    print(f'  {e["id"]}  vo {db(vo[s:s+L]):6.1f}  bed {db(bed):6.1f}  diff {db(vo[s:s+L]) - db(bed):5.1f} dB')
