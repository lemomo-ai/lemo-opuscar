"""Toward the Mountain — original score (jo-ha-kyū, 序・破・急: slow opening, development, rush)
shamisen (physically modelled pluck, sawari buzz) + shakuhachi (recorder/flute samples: vibrato removed, breath noise, slide-ins, meri/kari pitch bends)
+ taiko (bass drum/tom/frame drum samples + synthesised drum head) + hyoshigi (拍子木, wooden clappers; woodblock/claves samples + synthesised hardwood resonance)
Run: .venv/bin/python styles/ukiyoe/demo/music/score.py   → music/score.wav, stems/, score.json
"""
import sys, os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 44.0
N = int(DUR * SR)
rng = np.random.default_rng(1703)
S.seed(17)
def bpf(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lpf(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def st(): return np.zeros((N, 2), np.float32)
stems = {k: st() for k in ['shamisen', 'shakuhachi', 'taiko', 'hyoshigi', 'other']}
EVENTS = []  # (t, stem, note)
def mark(t, k, d): EVENTS.append((round(t, 3), k, d))

# ——————————————— hyoshigi (two hardwood sticks struck together) ———————————————
def hyoshigi(v=1.0):
    L = int(.5 * SR); t = np.arange(L) / SR
    y = np.zeros(L)
    for f, a, tau in [(1180, 1., .05), (2460, .7, .035), (3870, .45, .022), (5300, .25, .012), (760, .35, .07)]:
        y += a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
    cl = rng.standard_normal(L) * np.exp(-t / .0018); y += 1.6 * bpf(cl, 1500, 9000)
    y /= np.abs(y).max()
    s1 = S.hit('world_perc', 'claves', .9); s2 = S.hit('woodblock', 'a', .9)
    out = np.zeros(L); out[:min(L, len(s1))] += s1[:L] / (np.abs(s1).max() + 1e-9) * .8; out[:min(L, len(s2))] += s2[:L] / (np.abs(s2).max() + 1e-9) * .45
    out += y * .9
    # the two pieces hit almost together: a second transient 3 ms later
    d = int(.003 * SR); out[d:] += .35 * out[:-d]
    return (out / np.abs(out).max() * .85 * v).astype(np.float32)

# ——————————————— taiko ———————————————
def odaiko(v=1.0, big=False):
    L = int(2.4 * SR); t = np.arange(L) / SR
    f = 58 + 62 * np.exp(-t / .045)                       # pitch drops after the head is struck
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (.55 if big else .42)) + .35 * np.sin(1.59 * ph + 1) * np.exp(-t / .22) + .18 * np.sin(2.14 * ph) * np.exp(-t / .12)
    don = bpf(rng.standard_normal(L), 90, 900) * np.exp(-t / .02) * .8   # the "don" of the struck head
    stick = bpf(rng.standard_normal(L), 1200, 5000) * np.exp(-t / .004) * .25  # stick
    syn = body + don + stick
    syn /= np.abs(syn).max()
    out = syn * .85
    for inst, var, g in [('gran_cassa', 'hit', .55), ('toms', 'low_mallet', .35), ('frame_drum', 'large', .3)]:
        s = S.hit(inst, var, min(1, .55 + .45 * v)); s = s[:L] / (np.abs(s).max() + 1e-9)
        out[:len(s)] += s * g
    out = lpf(out, 3500)
    return (out / np.abs(out).max() * v).astype(np.float32)
def cut(x, d):
    n = int(d * SR)
    if n >= len(x): return x
    x = x[:n].copy(); k = min(n, int(.08 * SR)); x[-k:] *= np.linspace(1, 0, k); return x
def shime(v=.6):
    L = int(.6 * SR); t = np.arange(L) / SR
    f = 390 + 140 * np.exp(-t / .01); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .07) + .5 * bpf(rng.standard_normal(L), 800, 4000) * np.exp(-t / .006)
    s = S.hit('frame_drum', 'small_muted', .7); s = s[:L] / (np.abs(s).max() + 1e-9)
    y = y / np.abs(y).max() * .7; y[:len(s)] += s * .5
    return (y / np.abs(y).max() * v).astype(np.float32)

# ——————————————— shamisen ———————————————
def sam(p, v=.7, dur=None, **kw):
    kw.setdefault('buzz', .7)
    return P.pluck('shamisen', p, dur, v, **kw)

# ——————————————— shakuhachi (recorder+flute samples → vibrato removed, slides, breath noise) ———————————————
def _f0track(y, f):
    hop, Nw = 480, 2048; out = []
    for s in range(0, max(1, len(y) - Nw), hop):
        fr = y[s:s + Nw] * np.hanning(Nw); sp = np.abs(np.fft.rfft(fr, 8 * Nw)); fq = np.fft.rfftfreq(8 * Nw, 1 / SR)
        m = (fq > f * .85) & (fq < f * 1.18); out.append(fq[m][np.argmax(sp[m])] if sp[m].max() > 1e-6 else f)
    return np.array(out), hop
def shaku(p, dur, v=.7, slide=-1.5, fall=0.0, kari=0.0, swell=.5, breath=1.0, rel=.35):
    """p: actual pitch; slide: attack slides in from this many semitones below (0 = no slide); fall: meri drop in semitones at the phrase end (negative); kari: upward lift at the phrase end (positive)
    swell: amount of crescendo in the middle of the note; breath: proportion of breath noise"""
    m = S.midi(p); f = 440 * 2 ** ((m - 69) / 12)
    ext = dur + rel + .8
    a = S.note('recorder', max(m, S.midi('F4') - 3), ext, .7, release=.2)
    b = S.note('flute', max(m, S.midi('C4')), ext, .6, release=.2)
    n = min(len(a), len(b)); y = .62 * a[:n] / (np.abs(a).max() + 1e-9) + .38 * b[:n] / (np.abs(b).max() + 1e-9)
    y = y.astype(np.float64)
    # 1) remove amplitude tremolo: divide by the smoothed envelope
    w = int(.06 * SR); e = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, 'same')) + 1e-4
    e = np.convolve(e, np.ones(w) / w, 'same'); y = y / e
    y[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))
    # 2) remove pitch vibrato + apply slides: variable-rate resampling
    tr, hop = _f0track(y, f); dev = 12 * np.log2(tr / np.median(tr[3:]))  # semitones
    dev = np.clip(dev, -.6, .6)
    tt = np.arange(n) / SR; devs = np.interp(tt, np.arange(len(dev)) * hop / SR + 1024 / SR, dev)
    L = int((dur + rel) * SR); to = np.arange(L) / SR
    bend = np.zeros(L)
    if slide: sl = .16; bend += np.where(to < sl, slide * (1 - np.sin(np.clip(to / sl, 0, 1) * np.pi / 2)), 0)
    if fall: k = np.clip((to - (dur - .45)) / .5, 0, 1); bend += fall * k * k
    if kari: k = np.clip((to - (dur - .3)) / .3, 0, 1); bend += kari * np.sin(k * np.pi / 2)
    dv = np.interp(to + .05, tt, devs)
    phase = .05 * SR + np.concatenate([[0], np.cumsum(2 ** ((bend[:-1] - dv[:-1]) / 12))])
    phase = np.minimum(phase, n - 2)
    z = np.interp(phase, np.arange(n), y)
    # 3) our own envelope: breath first, tone after; swells in the middle then falls back (shakuhachi-style breathing)
    at = .12; envl = np.clip(to / at, 0, 1) ** 1.6
    mid = 1 + swell * np.sin(np.clip(to / max(dur, .1), 0, 1) * np.pi) ** 1.5 * .8
    relk = np.clip((to - dur) / rel, 0, 1); envl = envl * mid * (1 - relk) ** 2
    z = z * envl
    # a bit darker, a bit hollower
    z = lpf(z, 3200) * .8 + bpf(z, 900, 1600) * .5
    # 4) breath noise: 1–4 kHz band-passed noise, stronger at the attack (muraiki, the forced breathy attack)
    nz = bpf(rng.standard_normal(L), 1000, 4000, 3)
    be = .22 * envl + .9 * np.exp(-np.clip(to, 0, None) / .07) * np.clip(to / .012, 0, 1)
    z = z / (np.abs(z).max() + 1e-9) + breath * .5 * nz / (np.abs(nz).max() + 1e-9) * be
    z[-min(len(z), 480):] *= np.linspace(1, 0, min(len(z), 480))
    return (z / (np.abs(z).max() + 1e-9) * v).astype(np.float32)

def put(k, x, t, g=1.0, pan=0.0, note=None):
    add(stems[k], x, t, g, pan)
    if note: mark(t, k, note)

# ================= C1 printing: hyoshigi =================
for i, t in enumerate([.35, 1.05, 1.70, 2.30]):
    put('hyoshigi', hyoshigi(.8 + .07 * i), t, 1.0, (-.25, .2, -.1, .15)[i], f'hyoshigi {i+1} (block {i+1})')

# ================= C2 jo (序, opening) 2.9–10.5 =================
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .85, spread=.018, buzz=.8, t60=2.2), 2.9, 1.1, -.15, 'title: shamisen chord')
# shakuhachi opening motif M: A4 (slid in) — Bb4 — A4 (meri drop) … G4
put('shakuhachi', shaku('A4', 1.55, .75, slide=-2, swell=.6), 3.05, 1, .1, 'shakuhachi: motif A4')
put('shakuhachi', shaku('Bb4', .42, .6, slide=0, swell=.1, breath=.7), 4.72, 1, .1)
put('shakuhachi', shaku('A4', .95, .66, slide=0, fall=-1.2, swell=.3), 5.12, 1, .1)
put('shamisen', sam('A3', .45), 4.72, .7, -.2)
# narration L1 6.0–9.5: keep only one low held note + sparse shamisen
put('shakuhachi', shaku('D4', 2.9, .42, slide=-1, swell=.8, breath=.8, rel=.6), 6.35, 1, .1, 'shakuhachi: low ro long note (makes room for the narration)')
put('shamisen', sam('D3', .4), 7.6, .6, -.2)
put('shamisen', sam('D5', .75, t60=.8, buzz=.5), 10.1, .9, .15, 'seal: shamisen "chin"')

# ================= C3 rain 72 BPM =================
bt = 60 / 72
beats = [11.5 + i * bt for i in range(7)]
for i, b in enumerate(beats):
    quiet = 12.2 < b < 14.3
    put('shamisen', sam('D3' if i % 2 == 0 else 'A2', (.5 if quiet else .66)), b, .8, -.15, 'shamisen slow pulse 72 BPM' if i == 0 else None)
    if b + bt / 2 < 16.9:
        put('shamisen', sam('A3' if i % 3 else 'D4', .3 if quiet else .38, buzz=.4), b + bt / 2, .6, .1)   # sukui (すくい), light upstroke
put('shamisen', sam('Eb5', .72, t60=.8, buzz=.5), 16.0, .9, .15, 'seal: shamisen')
put('shakuhachi', shaku('G4', .7, .55, slide=-1.5, swell=.3), 14.45, 1, .05, 'shakuhachi answers')
put('shakuhachi', shaku('A4', .95, .58, slide=0, kari=.8, swell=.4), 15.15, 1, .05)

# ================= C4 ha (破, development) 96 BPM =================
bt = 60 / 96; e8 = bt / 2
pat = ['D4', 'A3', 'D4', 'Eb4', 'D4', 'A3', 'G3', 'A3']
t = 17.3; i = 0
while t < 22.25:
    quiet = 18.0 < t < 20.7
    v = (.44 if quiet else .56) * (1.0 if i % 2 == 0 else .75)
    put('shamisen', sam(pat[i % 8], v, buzz=.55), t, .75, -.1 + .2 * (i % 2), 'shamisen ostinato 96 BPM' if i == 0 else None)
    if i % 4 == 2: put('taiko', shime(.42 if quiet else .55), t, .9, .3, 'shime-daiko' if i == 2 else None)
    if i % 8 == 7: put('taiko', shime(.3), t + e8 / 2, .9, .3)
    t += e8; i += 1
put('shamisen', sam('D5', .75, t60=.8, buzz=.5), 21.95, .9, .15, 'seal: shamisen')
for k, p in enumerate(['D3', 'A3', 'D4', 'Eb4', 'G4', 'A4', 'Bb4', 'D5']):
    put('shamisen', sam(p, .5 + k * .04, buzz=.6), 22.32 + k * .06, .8, -.3 + k * .08, 'kyū pan: fast rising arpeggio' if k == 0 else None)

# ================= C5 kyū (急, rush) (44 s cut: rise → hang → fall → impact) =================
# heartbeat: from 23.2 the interval starts at 0.9 and shrinks by × 0.84 (before 25.4 identical to the 42 s cut), keeps shrinking to 0.15 during the rise, hands over to the hang roll at 27.3
ts = []; t = 23.2; gap = .9
while t < 27.3:
    ts.append(t); gap = max(.15, gap * .84); t += gap
for j, t in enumerate(ts):
    prog = (t - 23.2) / 4.1
    v = .55 + .33 * prog
    if 23.5 < t < 25.4: v *= .8
    put('taiko', cut(odaiko(min(1, v)), max(.45, 3 * (ts[j + 1] - t)) if j + 1 < len(ts) else .45), t, .85, (rng.random() - .5) * .3, 'ōdaiko heartbeat starts (accelerating)' if j == 0 else None)
mark(25.4, 'taiko', 'wave rises: heartbeat keeps speeding up 0.45→0.15 s')
# hang 27.3–28.42: one hit every 0.07 s, crescendo to the densest and loudest
t = 27.3; j = 0
while t < 28.40:
    k = (t - 27.3) / 1.1
    put('taiko', cut(odaiko(min(1, .82 + .18 * k)), .28), t, .42 + .2 * k, (-.2, .2)[j % 2], 'crest: taiko roll at 0.07 s, crescendo' if j == 0 else None)
    t += .07; j += 1
mark(28.42, 'other', 'inhale: everything stops 28.42–28.5')
# low-frequency swell (other): brown noise + low sine, crescendo from rise → hang
def swell(d, f0, f1, g0=.05, g1=1.0):
    n = int(d * SR); tt = np.arange(n) / SR
    br = lpf(np.cumsum(rng.standard_normal(n)), 120, 3); br = hpf(br, 28, 2); br /= np.abs(br).max()
    f = f0 + (f1 - f0) * tt / d; sn = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = (g0 + (g1 - g0) * (tt / d) ** 1.8); y = (.7 * br + .45 * sn) * env
    y[:int(.2 * SR)] *= np.linspace(0, 1, int(.2 * SR))
    return (y / np.abs(y).max()).astype(np.float32)
put('other', swell(3.02, 42, 55), 25.4, .55, 0, 'low-frequency swell')
# shamisen tremolo crescendo from 25.4 → sustained through the hang to the peak
tr = P.pluck('shamisen', 'D4', 3.02, .75, trem=13, buzz=.8, t60=1.0)
tr = (tr * np.linspace(.15, 1, len(tr)) ** 1.5).astype(np.float32)
put('shamisen', tr, 25.4, .7, -.25, 'shamisen tremolo crescendo')
tr2 = P.pluck('shamisen', 'A4', 2.12, .7, trem=14, buzz=.8, t60=1.0); tr2 = (tr2 * np.linspace(.1, 1, len(tr2)) ** 2).astype(np.float32)
put('shamisen', tr2, 26.3, .55, .25)
tr3 = P.pluck('shamisen', 'D5', 1.12, .7, trem=15, buzz=.8, t60=.8); tr3 = (tr3 * np.linspace(.3, 1, len(tr3))).astype(np.float32)
put('shamisen', tr3, 27.3, .5, 0, 'crest: shamisen tremolo at its peak')
# shakuhachi high shriek (muraiki) 27.6–28.4
put('shakuhachi', shaku('D6', .72, .9, slide=-2, kari=.7, swell=.5, breath=2.2, rel=.08), 27.6, .62, .1, 'shakuhachi high shriek (muraiki)')
# fall 28.5: heavy hit
FALL = 28.5
put('taiko', odaiko(.95, big=True), FALL, .9, 0, 'fall: heavy hit (taiko + hyoshigi + shamisen chord)')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4', 'A4'], .3, .9, spread=.008, buzz=1.0), FALL, .75, 0)
put('hyoshigi', hyoshigi(.85), FALL, .7, .2)
# second roll: slightly sparser than the hang, heavier lows, crescendo pushing into the impact
t = 28.75; j = 0
while t < 30.28:
    k = (t - 28.75) / 1.53
    put('taiko', cut(odaiko(min(1, .6 + .38 * k), big=True), .35), t, .38 + .2 * k, (-.15, .15)[j % 2], 'second roll' if j == 0 else None)
    t += .095 - .02 * k; j += 1
put('other', swell(1.8, 36, 48, .15, 1.0), 28.56, .7, 0)
# shamisen descending glissando
for k, p in enumerate(['D5', 'Bb4', 'A4', 'G4', 'Eb4', 'D4', 'A3', 'G3', 'Eb3', 'D3']):
    put('shamisen', sam(p, .55 + k * .035, buzz=.8), 29.05 + k * .065, .8, .3 - k * .06, 'shamisen descending glissando' if k == 0 else None)
trl = P.pluck('shamisen', 'D3', .9, .8, trem=14, buzz=.9, t60=1.0); trl = (trl * np.linspace(.3, 1, len(trl)) ** 1.5).astype(np.float32)
put('shamisen', trl, 29.75, .7, -.1)
# impact 30.36 (foam fills the frame)
IMP = 30.36
put('taiko', odaiko(1.0, big=True), IMP, 1.5, 0, 'impact: ōdaiko + shamisen chord + hyoshigi')
put('taiko', odaiko(.9, big=True), IMP + .004, .8, -.3)
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4', 'A4'], .3, 1.0, spread=.008, buzz=1.0), IMP, 1.0, 0)
put('hyoshigi', hyoshigi(.9), IMP, .8, .2)

# ================= C7 echo (everything shifted +2.0 s) =================
O = 2.0
for i, t in enumerate([30.2, 30.7, 31.2, 31.7]):
    put('taiko', odaiko(.72 + .09 * i, big=True), t + O, 1.0, (-.1, .1, -.05, .05)[i], f'taiko, block {i+1}')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .5, spread=.12, buzz=.6, t60=1.8), 32.1 + O, .5, -.2, 'shamisen soft broken chord')
put('shakuhachi', shaku('A4', 1.3, .55, slide=-2, swell=.5), 32.05 + O, .62, .1, 'shakuhachi: the motif echoes')
put('shakuhachi', shaku('Bb4', .4, .46, slide=0, swell=.1, breath=.7), 33.5 + O, .62, .1)
put('shakuhachi', shaku('A4', .75, .5, slide=0, fall=-.8, swell=.3), 33.9 + O, .62, .1)
put('shakuhachi', shaku('G4', .55, .5, slide=0, swell=.2), 34.75 + O, .75, .1)
put('shakuhachi', shaku('D4', 1.05, .55, slide=-1, swell=.5, rel=.4), 35.3 + O, 1, .1, 'shakuhachi: lands on the tonic D')
put('shamisen', sam('A4', .38, harmonic=True), 35.1 + O, .7, .3, 'hat comes off: shamisen harmonic')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .9, spread=.02, buzz=.85, t60=2.4), 36.3 + O, 1.1, 0, 'final print: shamisen closing chord + taiko + hyoshigi')
put('taiko', odaiko(.85, big=True), 36.3 + O, .9, 0)
put('hyoshigi', hyoshigi(.7), 36.3 + O, .7, .25)

# ================= C8 coda =================
put('shakuhachi', shaku('D5', 3.6, .5, slide=-2, fall=-1.0, swell=.7, breath=1.1, rel=.9), 37.0 + O, 1, .1, 'shakuhachi final long note')
put('shamisen', sam('D3', .7, t60=4.2, buzz=.9), 38.4 + O, 1.0, -.1, 'shamisen last note, long sawari ring')

# ================= reverb, silence, sum =================
wet = {'shamisen': (.45, .2), 'shakuhachi': (.6, .3), 'taiko': (.65, .22), 'hyoshigi': (.35, .12), 'other': (.5, .2)}
for k, (sz, mx) in wet.items():
    if np.abs(stems[k]).max() > 0: stems[k] = S.room(stems[k], size=sz, mix=mx).astype(np.float32)
GAIN = {'shamisen': 1.0, 'shakuhachi': .8, 'taiko': .95, 'hyoshigi': .85, 'other': 1.0}
MA0, MA1 = 30.40, 32.2
IN0, IN1 = 28.41, 28.498   # intake of breath
fade = int(.06 * SR); a0 = int(MA0 * SR); a1 = int(MA1 * SR)
tail = int(DUR * SR) - int(.2 * SR)
fi = int(.01 * SR); i0 = int(IN0 * SR); i1 = int(IN1 * SR)
for k in stems:
    x = stems[k] * GAIN[k]
    x[a0:a0 + fade] *= np.linspace(1, 0, fade)[:, None]
    x[a0 + fade:a1] = 0
    x[a1 - 1] = 0
    x[i0:i0 + fi] *= np.linspace(1, 0, fi)[:, None]; x[i0 + fi:i1] = 0
    # down to zero before 44.0
    x[tail:] *= np.linspace(1, 0, N - tail)[:, None]
    stems[k] = x.astype(np.float32)
mix = sum(stems.values())
pk = np.abs(mix).max(); sc = .89 / pk
mix *= sc
for k in stems: stems[k] *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for k, x in stems.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), x, SR, subtype='FLOAT')

# ================= self-check =================
mono = mix.mean(1)
def rms_db(a, b):
    s = mono[int(a * SR):int(b * SR)]; r = np.sqrt(np.mean(s ** 2)) + 1e-12; return round(20 * np.log10(r), 1)
def cent(a, b):
    s = mono[int(a * SR):int(b * SR)]
    if np.abs(s).max() == 0: return 0
    sp = np.abs(np.fft.rfft(s * np.hanning(len(s)))); f = np.fft.rfftfreq(len(s), 1 / SR); return round(float((sp * f).sum() / sp.sum()), 0)
CUES = [('C1 printing', 0, 2.9), ('C2 jo', 2.9, 10.5), ('C3 rain', 10.5, 17.3), ('C4 ha', 17.3, 22.9), ('C5a kyū · heartbeat', 22.9, 25.4), ('C5b wave rises', 25.4, 27.3), ('C5c crest', 27.3, 28.5), ('C5d fall', 28.5, 30.4), ('C6 ma', 30.4, 32.2), ('C7 echo', 32.2, 38.8), ('C8 coda', 38.8, 44.0)]
table = [dict(cue=n, t0=a, t1=b, rms_db=rms_db(a, b), peak=round(float(np.abs(mix[int(a * SR):int(b * SR)]).max()), 3), centroid_hz=cent(a, b)) for n, a, b in CUES]
VO = [('L1', 6.0, 9.5), ('L2', 12.3, 14.2), ('L3', 18.0, 20.6), ('L4', 23.5, 25.4), ('L5', 34.4, 37.1)]
vo = [dict(line=n, rms_db=rms_db(a, b), mid_1_4k_db=round(20 * np.log10(np.sqrt(np.mean(bpf(mono[int(a * SR):int(b * SR)], 1000, 4000) ** 2)) + 1e-12), 1)) for n, a, b in VO]
silent = bool(np.all(mix[int((MA0 + .061) * SR):int(MA1 * SR)] == 0))
def onset_err(t, win=.03):
    # onset = first sample exceeding "noise floor of the preceding 25 ms + 30% margin" (not fooled by the decay of the previous hit)
    s = int((t - win) * SR); seg = np.abs(mono[s:s + int(2 * win * SR)])
    pre = np.abs(mono[int((t - .03) * SR):int((t - .005) * SR)]).max(); thr = pre + .3 * (seg.max() - pre)
    i = int(np.argmax(seg > thr)); return round((s + i) / SR * 1000 - t * 1000, 1), round(float(seg.max()), 3)
ons = {str(t): dict(zip(['err_ms', 'peak'], onset_err(t))) for t in [.35, 1.05, 1.70, 2.30, 32.2, 32.7, 33.2, 33.7, FALL, IMP]}
report = dict(dur=len(mix) / SR, sr=SR, peak=round(float(np.abs(mix).max()), 3), ma_silent_30_46_to_32_2=silent, inhale_silent_28_42_to_28_498=bool(np.all(mix[int(28.42 * SR):int(IN1 * SR)] == 0)),
              impact=IMP, cues=table, voice_windows=vo, onsets=ons, events=EVENTS,
              notes='miyako-bushi scale D Eb G A Bb; opening motif A4–Bb4–A4 (meri); C7 echo lands on D4. 44 s version: the great wave is stretched after 25.4 (wave rises / crest / inhale / fall / impact at 30.36), ma 30.4–32.2, everything after it +2 s. hyoshigi = synthesised hardwood resonance + claves + woodblock; taiko = synthesised drum head (120→58 Hz) + gran_cassa + toms low_mallet + frame_drum large; shakuhachi = recorder 62% + flute 38% samples → divided by a smoothed envelope to remove amplitude wobble, f0-tracked inverse varispeed to remove pitch wobble, varispeed slides / meri / kari, 1–4 kHz breath noise.')
json.dump(report, open(os.path.join(HERE, 'score.json'), 'w'), ensure_ascii=False, indent=1, default=float)
print(json.dumps({k: report[k] for k in ['dur', 'peak', 'ma_silent_30_46_to_32_2', 'inhale_silent_28_42_to_28_498', 'onsets']}, ensure_ascii=False))
for r in table: print(r)
for r in vo: print(r)
