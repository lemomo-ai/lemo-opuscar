"""Sound for the Line-Art Cutaway demo: English narration + a full-length score + foley that follows on-screen events, cut to a segment [from, to].

    .venv/bin/python styles/hardcore-info/demo/mix.py [from] [to] [out.wav]     (run from the library root; default: the whole film, out/mix.wav)

Reads timeline.json (narration starts), voice/*.wav (Kokoro bm_george, passed asr_check), events.json (events exported by the page, times in segment seconds).
The score is written in whole-film seconds (96 bpm, one bar = 2.5 s), with two near-silences: 7.5–10 s after the signal drops, 38.1–42.7 s after the hand grips.
The cut through the slit is at 23.8 s (after sentence 5 ends at 23.63 s); the hiss of the dive is held under the narration and swells only after the sentence.
Narration is compressed first, then set about 10 dB above the music by RMS; the music makes room at 300 Hz–4 kHz and ducks a little more under the voice. A 0.4 s fade-out ends each segment (for cutting segments).
"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, t_

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
FILM = float(TL['end'])
FROM = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
TO = float(sys.argv[2]) if len(sys.argv) > 2 else FILM
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'out', 'mix.wav')
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
NF = int((FILM + 1.0) * SR)
rng = np.random.default_rng(7)
BEAT = 0.625; BAR = 2.5


def stereo(n): return np.zeros((n, 2))
def pan_st(x, pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)
def place(buf, st, t):
    i0 = int(t * SR); n = min(len(st), len(buf) - i0)
    if n > 0: buf[i0:i0 + n] += st[:n]
def glide(d, f0, f1, harm=(1.0, 0.25, 0.08)):
    n = int(d * SR); f = np.geomspace(f0, f1, n); ph = np.cumsum(f) / SR * 2 * np.pi
    return sum(a * np.sin(ph * (i + 1)) for i, a in enumerate(harm))
def fadeio(x, a=0.01, b=0.05):
    n = len(x); e = np.ones(n); ia, ib = max(1, int(a * SR)), max(1, int(b * SR))
    e[:ia] = np.linspace(0, 1, ia); e[-ib:] = np.minimum(e[-ib:], np.linspace(1, 0, ib)); return x * e


# ---------------- foley (follows on-screen events; event time + FROM = whole-film time) ----------------
fol = stereo(NF)
for e in EV:
    t, ty, pan, d = e['t'] + FROM, e['type'], e.get('pan', 0), e.get('d', 0.3)
    n = int(max(d, 0.05) * SR)
    if ty == 'sweep':           # section plane sweeps: a narrow band of noise sweeping up
        x = rng.standard_normal(n); fcs = np.geomspace(900, 5200, 8); pos = np.linspace(0, 7, n); y = np.zeros(n)
        for k, f in enumerate(fcs): y += bp(x, f * 0.85, f * 1.18, 2) * np.clip(1 - np.abs(pos - k), 0, 1)
        place(fol, pan_st(y * np.sin(np.linspace(0, np.pi, n)) ** 0.7 * 0.09, np.linspace(pan, e.get('pan1', pan), n)), t)
    elif ty == 'type':          # text traced left to right: a run of very light ticks
        for k in range(int(d / 0.1)): add(fol, hp(click(pitch=1.4 + 0.2 * rng.random(), v=1), 2500) * 0.022, t + k * 0.1, 1.0, pan + 0.03 * k)
    elif ty == 'hand':          # hand comes in / leaves: sleeve and skin friction
        x = lp(hp(rng.standard_normal(n), 300), 2400) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
        add(fol, x * 0.05, t, 1.0, pan)
        if not e.get('out'): add(fol, lp(click(pitch=0.4, v=1), 900) * 0.10, t + d, 1.0, pan)   # fingers close on the frame
    elif ty == 'tick':
        c = hp(click(pitch=1.5 if e.get('accent') else 1.25, v=1), 1500)
        add(fol, c * (0.07 if e.get('accent') else 0.055), t, 1.0, pan)
    elif ty in ('barsdown', 'barsup'):   # signal bars: four beeps, one per bar
        for k in range(4):
            f = (1760 * 2 ** (-k * 3 / 12)) if ty == 'barsdown' else (1320 * 2 ** (k * 3 / 12))
            x = np.sin(2 * np.pi * f * t_(0.09)) * np.exp(-t_(0.09) / 0.03)
            add(fol, x * 0.035, t + k * d / 4, 1.0, pan)
    elif ty == 'flood':         # orange floods the frame: a swell + an upward glide
        x = lp(rng.standard_normal(n + int(0.4 * SR)), 1800); x *= np.sin(np.linspace(0, np.pi, len(x))) ** 2
        add(fol, x * 0.05, t, 1.0, pan)
        add(fol, fadeio(glide(d, 660, 1320, (1, .2))) * 0.02, t, 1.0, pan)
    elif ty == 'tip':           # phone tips over: a low whoosh
        add(fol, lp(whoosh(d, 1.0), 1400) * 0.07, t, 1.0, pan)
    elif ty == 'lift':
        add(fol, lp(whoosh(d, 1.0), 3200) * 0.06, t, 1.0, pan)
    elif ty == 'seat':
        add(fol, click(pitch=0.8 + 0.08 * rng.random(), v=1.0) * 0.09 * e.get('v', 0.8), t, 1.0, pan)
        add(fol, lp(click(pitch=0.35, v=1.0), 600) * 0.11, t, 1.0, pan)
    elif ty == 'ping':
        add(fol, glide(1.2, 2093, 2093, (1.0, 0.0, 0.12)) * np.exp(-t_(1.2) / 0.32) * 0.035, t, 1.0, pan)
    elif ty == 'zip':           # signal travels along the path
        x = glide(d, 520, 1560, (1.0, 0.3, 0.12)) * (0.4 + 0.6 * np.linspace(0, 1, n) ** 0.8)
        x = fadeio(x, 0.08, 0.05) + bp(rng.standard_normal(n), 2500, 6000) * 0.15 * np.linspace(0.3, 1, n)
        place(fol, pan_st(x * 0.026, np.linspace(pan, e.get('pan1', pan), n)), t)
    elif ty == 'drop':          # the other layers sink
        add(fol, lp(whoosh(d, 1.0), 1200) * 0.08, t, 1.0, pan)
    elif ty == 'dive':          # camera dives into the slit: a hiss growing closer and brighter
        x = rng.standard_normal(n); ramp = np.linspace(0, 1, n) ** 2
        y = lp(x, 600) * (1 - ramp) + bp(x, 1500, 7000) * ramp
        tl = np.arange(n) / SR; swell = np.clip((tl - (d - 0.3)) / 0.3, 0, 1)      # swells only after the narration ends (0.3 s before the cut)
        add(fol, y * ramp ** 0.6 * (0.022 + 0.05 * swell), t, 1.0, pan)
    elif ty == 'iris':          # iris opens: a paper swipe + a low thud
        add(fol, hp(whoosh(d, 1.0), 900) * 0.07, t, 1.0, pan)
        add(fol, lp(click(pitch=0.3, v=1), 300) * 0.16, t, 1.0, 0)
    elif ty == 'glass':
        x = sum(a * np.sin(2 * np.pi * f * t_(1.0)) for f, a in [(2637, 1), (3951, .4), (5274, .2)]) * np.exp(-t_(1.0) / 0.25)
        add(fol, x * 0.02, t, 1.0, pan)
    elif ty == 'ruler':         # ruler pulled out: a run of fine ratchet ticks
        k = 0
        while k * 0.045 < d: add(fol, hp(click(pitch=1.7, v=1), 3000) * 0.018, t + k * 0.045, 1.0, pan + 0.3 * k * 0.045 / d); k += 1
    elif ty == 'rejoin':
        add(fol, lp(whoosh(d, 1.0), 2400) * 0.06, t, 1.0, pan)
    elif ty == 'drain':         # orange drains back to the feed point: a downward glide
        add(fol, fadeio(glide(d, 990, 330, (1, .3, .1))) * 0.03, t, 1.0, pan)
    elif ty == 'switch':        # switch to the top antenna: an upward glide + a bright ding
        add(fol, fadeio(glide(d, 440, 1320, (1, .3))) * 0.025, t, 1.0, pan)
        add(fol, glide(1.2, 2637, 2637, (1, 0, .1)) * np.exp(-t_(1.2) / 0.3) * 0.03, t + d, 1.0, pan)
    elif ty == 'trace':         # ending: a light runs once around the frame
        x = fadeio(glide(d, 880, 1760, (1, .2, .1)), 0.05, 0.3) + bp(rng.standard_normal(n), 5000, 11000) * 0.2
        place(fol, pan_st(x * 0.02, np.sin(np.linspace(0, 2 * np.pi, n)) * 0.6), t)

# ---------------- score: 96 bpm, A minor, whole-film time ----------------
ev = []
def chord_bar(t0, ns, dens, vel=0.28, bass=True, glock=False):
    root, hi = ns[0], ns[2:] + [ns[2] + 12]
    if bass:
        ev.append((t0, 'jazz_bass', root, 0.9, 0.5, -0.05, 0.85)); ev.append((t0 + 2 * BEAT, 'jazz_bass', root + 7, 0.6, 0.42, -0.05, 0.7))
    if dens == 1:
        for i in range(4): ev.append((t0 + i * BEAT, 'vibraphone_hard', hi[i % 4], 0.5, vel, 0.25, 0.5))
    elif dens == 2:
        for i in range(8): ev.append((t0 + i * BEAT / 2, 'vibraphone_hard', hi[[0, 2, 1, 3, 0, 2, 3, 1][i]], 0.35, vel + 0.04 * (i % 2 == 0), 0.3 * (1 if i % 2 else -1), 0.45))
    if glock:
        for i in range(8): ev.append((t0 + BEAT / 4 + i * BEAT / 2, 'glockenspiel', hi[[1, 3, 0, 2, 3, 1, 2, 0][i]] + 12, 0.3, 0.13, 0.45, 0.22))
Am, F, Dm, C, G, E, Fm7, Em = [45, 57, 64, 71, 72], [41, 57, 64, 69, 72], [38, 57, 62, 65, 69], [48, 55, 64, 67, 72], [43, 55, 62, 67, 74], [40, 56, 64, 68, 71], [41, 57, 64, 67, 72], [40, 55, 62, 67, 71]
# A hook (0–7.5): sparse vibraphone on the beat, bass enters in bar 2
ev.append((0.0, 'glockenspiel', 81, 1.5, 0.42, 0.2, 0.5))
chord_bar(0.0, Am, 1, 0.26, bass=False); chord_bar(2.5, F, 1, 0.27); chord_bar(5.0, Dm, 2, 0.26)
# signal drops (7.5): three falling glockenspiel notes, then near-silence until 10 s
for i, p in enumerate([76, 72, 69]): ev.append((7.5 + i * 0.21, 'glockenspiel', p, 0.8, 0.3 - 0.05 * i, 0.2, 0.4))
ev.append((7.5, 'vibraphone_bowed', 45, 2.6, 0.22, 0.0, 0.25))
# B reveal (10.9, the frame floods): harp sweep over a bowed-vibraphone bed, a lift into A major
for i, p in enumerate([45, 52, 57, 61, 64, 69, 73]): ev.append((10.9 + i * 0.03, 'harp', p, 2.0, 0.42, -0.3 + i * 0.1, 0.65))
ev.append((10.9, 'vibraphone_bowed', 61, 3.0, 0.3, 0.1, 0.3)); ev.append((10.9, 'vibraphone_bowed', 69, 3.0, 0.28, -0.1, 0.28))
chord_bar(12.5, [45, 57, 61, 64, 69], 1, 0.22, bass=True)
# C exploded view + path (15–18.4): eighth-note arpeggios + sixteenth-note glockenspiel
chord_bar(15.0, Am, 2, 0.27, glock=False); chord_bar(17.5, F, 2, 0.24, bass=True)
# D dive into the slit (18.4–23.8): only eighth-note bass + a climbing glockenspiel, one hit at 23.8 (the cut after the sentence)
for i in range(16): ev.append((18.75 + i * BEAT / 2, 'jazz_bass', [45, 45, 52, 45][i % 4], 0.25, 0.32 + 0.02 * i, -0.05, 0.6))
for i, p in enumerate([69, 71, 72, 74, 76, 79, 81]): ev.append((19.4 + i * 0.45, 'glockenspiel', p, 0.6, 0.16 + 0.03 * i, 0.3, 0.3))
ev.append((23.8, 'contrabass_pizz', 33, 1.2, 0.65, 0.0, 0.85)); ev.append((23.8, 'glockenspiel', 88, 1.5, 0.35, 0.3, 0.35))
for i, p in enumerate([57, 64, 69, 72, 76]): ev.append((23.8 + i * 0.03, 'harp', p, 1.8, 0.4, -0.2 + i * 0.1, 0.55))
# E top-down + rulers (23.75–34.4): quiet clockwork feel, F → Em → Dm → C loop
for b, ch in enumerate([F, Em, Dm, C]):
    chord_bar(25.5 + b * BAR, ch, 2 if b in (1, 3) else 1, 0.2, bass=True)
# F reassemble and stand up (34.4–37.5): a G-chord push
chord_bar(35.5, G, 2, 0.25, glock=True)
# silence 2 (38.1–42.7): the hand grips, only one very low bowed vibraphone
ev.append((38.0, 'vibraphone_bowed', 40, 4.6, 0.2, 0.0, 0.22))
# G antenna switch (42.7): A major lights up, glockenspiel + harp + vibraphone
for i, p in enumerate([45, 52, 57, 61, 64, 69, 73, 76]): ev.append((42.7 + i * 0.025, 'harp', p, 2.0, 0.45, -0.3 + i * 0.08, 0.65))
ev.append((42.7, 'glockenspiel', 85, 1.5, 0.38, 0.3, 0.38))
chord_bar(43.0, [45, 57, 61, 64, 69], 2, 0.24, glock=True); chord_bar(45.5, [42, 57, 61, 66, 69], 2, 0.22)
# H ending (48.0): D → E → A, resolving in A major and ringing to the end
chord_bar(48.0, [38, 57, 62, 66, 69], 1, 0.22)
for i, p in enumerate([40, 52, 56, 59, 64, 68, 71, 76]): ev.append((49.25 + i * 0.03, 'harp', p, 1.4, 0.45, -0.3 + i * 0.08, 0.6))
ev.append((49.25, 'vibraphone', 64, 1.8, 0.4, 0.0, 0.4)); ev.append((49.25, 'contrabass_pizz', 28, 1.2, 0.55, 0.0, 0.75))
# end credit (from 48.1, the title block drawn cell by cell): bowed vibraphone holds A major, one glockenspiel note as the credit line lands, ringing out by 52 s
ev.append((49.1, 'vibraphone_bowed', 57, 2.8, 0.26, -0.1, 0.3)); ev.append((49.1, 'vibraphone_bowed', 64, 2.8, 0.24, 0.1, 0.28))
ev.append((48.1 + 1.35, 'glockenspiel', 88, 1.8, 0.3, 0.2, 0.32)); ev.append((48.1 + 1.38, 'vibraphone', 69, 1.8, 0.3, -0.1, 0.32))
ev = [e for e in ev if e]
S.seed(11)
music = S.render(ev, dur=FILM + 1.0, master=False)[:NF]
music = S.room(music, size=0.32, mix=0.16)
# plotter ticks: densest in the exploded view, none in the two silences
tick = hp(click(pitch=2.0, v=1), 4000) * 0.010
for k in range(int(FILM / (BEAT / 4))):
    t = k * BEAT / 4
    if 7.6 < t < 10.9 or 38.1 < t < 42.7 or t > 49.2: continue   # no ticks after 49.2 s
    dense = 14.2 < t < 18.4 or 34.9 < t < 38.0 or 42.7 < t < 48.0
    if not dense and k % 4: continue
    add(music, tick * (1.0 if k % 4 == 0 else 0.5), t, 1.0, 0.5 if k % 2 else -0.5)
# 1 s fade-out at the end
tt = np.arange(NF) / SR
music *= np.clip((FILM - tt) / 1.0, 0, 1)[:, None] ** 1.2
# music makes room at 300 Hz–4 kHz, about 5 dB
def dip(x): return x - bp(x, 300, 4000, 2) * 0.44
music = np.stack([dip(music[:, 0]), dip(music[:, 1])], 1)

# ---------------- narration ----------------
vo = np.zeros(NF)
for s in TL['subs']:
    x, sr = sf.read(os.path.join(HERE, 'voice', s['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = hp(x, 90); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.08
    x = compress(x, thr=0.12, ratio=3.0)
    i0 = int(s['vo'] * SR); vo[i0:i0 + len(x)] += x[:NF - i0]
# balance: while speaking, narration RMS sits about 10 dB above music + foley; music ducks another 4 dB under speech
env = np.abs(vo); k = int(0.15 * SR); env = np.convolve(env, np.ones(k) / k, 'same')
speaking = env > 0.01
duck = 1 - 0.37 * np.clip(np.convolve(speaking.astype(float), np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same'), 0, 1)
bed = (music * 0.9 + fol) * duck[:, None]
rv = np.sqrt(np.mean(vo[speaking] ** 2)); rb = np.sqrt(np.mean(np.mean(bed[speaking] ** 2, 1)))
bed *= (rv / 10 ** (10 / 20)) / max(rb, 1e-9)
film = bed + np.stack([vo, vo], 1) * 0.98

# ---------------- cut the segment ----------------
i0, i1 = int(FROM * SR), int(TO * SR)
mix = film[i0:i1].copy(); N = len(mix)
fo = int(0.4 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
sf.write(OUT, mix.astype(np.float32), SR)
names = sorted({e[1] for e in ev})
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write(str(S.credits(names)))
print(os.path.basename(OUT), f'{N / SR:.2f}s', 'voice/bed RMS ratio set to +10 dB', 'instruments:', ', '.join(names))
