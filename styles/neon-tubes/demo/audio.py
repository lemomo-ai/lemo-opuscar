"""夜宵 Midnight Snack · score + foley -> mix.wav (48 kHz stereo, exactly the film's length, about -16 LUFS, true peak < -3 dBTP before mastering).
Run from the library root, after exporting the picture's cues (the length comes from events.json):
    node core/render/events.mjs styles/neon-tubes/demo && .venv/bin/python styles/neon-tubes/demo/audio.py
Electronic city pop in F major, 120 BPM (beat 0.5 s), bar lines on even seconds. Everything is synthesised here (drums, bass, electric piano,
pads, lead, bells, plucks); no samples, no recordings.
Every neon sound follows the picture: strikes use the same flash envelope as strike() in film.js, read from events.json.
The cat has no voice: its purr is the transformer hum, its steps are relay clicks.
"""
import os, sys, json, math, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', '..')))
import numpy as np, soundfile as sf
from core.audio.sfx import SR, lp, hp, bp, noise, norm, t_, env_exp, click, thump, whoosh

rng = np.random.default_rng(29)
EVF = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(EVF['dur']); N = int(round(DUR * SR)); EV = EVF['ev']
BEAT = 0.5; BAR = 2.0
TT = {e['type']: e['t'] for e in EV}          # first time of each cue type

def hsh(n): n = math.sin(n * 127.1 + 311.7) * 43758.5453; return n - math.floor(n)
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def nm(s): return 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]

mus = np.zeros((N + SR * 2, 2)); fx = np.zeros((N + SR * 2, 2))
def put(buf, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= len(buf): return
    if s < 0: x = x[-s:]; s = 0
    e = min(len(buf), s + len(x)); a = (pan + 1) * np.pi / 4
    if x.ndim == 1: buf[s:e, 0] += x[:e - s] * g * np.cos(a) * 1.414; buf[s:e, 1] += x[:e - s] * g * np.sin(a) * 1.414
    else: buf[s:e] += x[:e - s] * g
def addm(buf, x, at, g=1.0):
    s = int(round(at * SR)); e = min(len(buf), s + len(x))
    if s < len(buf) and e > s: buf[s:e] += x[:e - s] * g

# ------------------------------------------------------------------ synth voices
def adsr(d, a=0.005, dc=0.1, s=0.7, r=0.1):
    n = int(d * SR); nr = int(r * SR); e = np.ones(n + nr)
    na = max(1, int(a * SR)); nd = max(1, int(dc * SR))
    e[:na] = np.linspace(0, 1, na); e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd])); e[na + nd:n] = s
    e[n:] = s * np.exp(-np.arange(nr) / (r * SR / 5)) if nr else 0
    return e
def fit(e, n): return np.pad(e, (0, max(0, n - len(e))))[:n]
def saw(f, n, ph=0.0): return 2 * ((np.arange(n) * f / SR + ph) % 1) - 1
def kick(v=1.0):
    d = 0.42; tt = t_(d); f = 62 + 95 * np.exp(-tt / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, 0.16) + hp(noise(d), 2000) * env_exp(d, 0.003) * 0.4
    return np.tanh(x * 1.6) * v
def clap(v=1.0):
    d = 0.35; x = np.zeros(int(d * SR)); nz = bp(noise(d), 900, 3200)
    for k, o in enumerate([0, 0.011, 0.022]): s = int(o * SR); x[s:] += nz[s:] * env_exp(d - o, 0.006)[:len(x) - s] * (0.8 if k < 2 else 1)
    return norm(x + nz * env_exp(d, 0.09) * 0.45) * v
def snare(v=1.0):
    d = 0.25; tt = t_(d); x = bp(noise(d), 1500, 7000) * env_exp(d, 0.06) + np.sin(2 * np.pi * 190 * tt) * env_exp(d, 0.04) * 0.6
    return norm(x) * v
def hat(v=1.0, open_=False):
    d = 0.35 if open_ else 0.06; return hp(noise(d), 7000) * env_exp(d, 0.11 if open_ else 0.014) * v
def cymbal(v=1.0):
    d = 2.5; return hp(noise(d), 4500) * env_exp(d, 0.7) * v
def bass_note(m, d, v=1.0, cut=500):
    f = mtof(m); n = int((d + 0.05) * SR)
    x = saw(f, n) * 0.6 + np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.2; tt = np.arange(n) / SR
    return (lp(x, cut, 2) * 0.7 + lp(x, cut * 3, 2) * 0.3 * np.exp(-tt / 0.05)) * fit(adsr(d, 0.004, 0.08, 0.8, 0.05), n) * v
def epiano(m, d, v=1.0):
    f = mtof(m); n = int((d + 0.6) * SR); tt = np.arange(n) / SR
    idx = 1.6 * np.exp(-tt / 0.25) + 0.3
    x = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * tt)) * np.exp(-tt / 1.4) + 0.18 * np.sin(2 * np.pi * f * 14 * tt) * np.exp(-tt / 0.03)
    rel = np.ones(n); k = int(d * SR); rel[k:] = np.exp(-np.arange(n - k) / (0.12 * SR))
    return x * rel * v
def pad(ms, d, v=1.0, cut=1800, a=0.6):
    n = int((d + 1.0) * SR); out = np.zeros(n)
    for m in ms:
        f = mtof(m)
        for det in (-0.12, 0.0, 0.11): out += saw(f * 2 ** (det / 12), n, rng.random())
    return lp(lp(out, cut, 2), cut * 1.4, 2) * fit(adsr(d, a, 0.3, 0.85, 1.0), n) * v / len(ms)
def lead(m, d, v=1.0, glide_from=None):
    n = int((d + 0.25) * SR); tt = np.arange(n) / SR
    f = mtof(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / 0.3))
    if glide_from is not None: f = f * (1 + (mtof(glide_from) / mtof(m) - 1) * np.exp(-tt / 0.04))
    ph = np.cumsum(f) / SR; x = (np.where((ph % 1) < 0.42, 1.0, -1.0) * 0.5 + (2 * (ph % 1) - 1) * 0.5)
    return lp(x, 3200, 2) * fit(adsr(d, 0.01, 0.15, 0.7, 0.15), n) * v
def pluck(m, v=1.0, d=0.5):
    f = mtof(m); n = int((d + 0.3) * SR); tt = np.arange(n) / SR; x = saw(f, n) + saw(f * 1.005, n, 0.3)
    return (lp(x, 1200, 2) * 0.5 + hp(x, 1200) * np.exp(-tt / 0.06) * 0.6) * np.exp(-tt / 0.28) * v
def bell(m, v=1.0, d=1.5):
    f = mtof(m); tt = t_(d)
    return sum(a * np.sin(2 * np.pi * f * r * tt + rng.random() * 6) * np.exp(-tt / tau) for r, a, tau in [(1, 1, 0.9), (2.76, 0.45, 0.35), (5.4, 0.25, 0.15), (8.93, 0.12, 0.07)]) * v
def stereo_delay(x, t_l=0.375, t_r=0.5, fb=0.35, mix=0.35):
    out = np.stack([x, x], 1).astype(np.float64)
    for ch, dt in ((0, t_l), (1, t_r)):
        k = int(dt * SR); y = out[:, ch].copy()
        for i in range(1, 5):
            if k * i >= len(y): break
            y[k * i:] += x[:len(y) - k * i] * mix * fb ** (i - 1)
        out[:, ch] = y
    return out

# ------------------------------------------------------------------ harmony: F major city pop
CH = {'F': (nm('F2'), ['A3', 'C4', 'E4', 'G4']), 'Bb': (nm('Bb1'), ['A3', 'D4', 'F4', 'C5']), 'C': (nm('C2'), ['Bb3', 'D4', 'E4', 'G4']),
      'Am': (nm('A1'), ['G3', 'C4', 'E4', 'B4']), 'Dm': (nm('D2'), ['F3', 'A3', 'C4', 'E4']), 'Gm': (nm('G1'), ['F3', 'Bb3', 'D4', 'A4'])}
CH = {k: (b, [nm(x) for x in u]) for k, (b, u) in CH.items()}
# what plays in each 2 s bar (bar b starts at 2b s): (section, chord)
BARS = {0: ('intro', 'F'), 1: ('intro', 'F'), 2: ('fish', 'Bb'), 3: ('fish', 'C'), 4: ('verse', 'Bb'), 5: ('verse', 'C'), 6: ('verse', 'Am'), 7: ('verse', 'Dm'),
        8: ('pre', 'Gm'), 9: ('break', 'Dm'), 10: ('break', 'Bb'), 11: ('break', 'Gm'), 12: ('build', 'C'), 13: ('chorus', 'Bb'), 14: ('chorus', 'C'),
        15: ('chorus', 'Am'), 16: ('chorus', 'Dm'), 17: ('glass', 'F'), 18: ('glass', 'Am'), 19: ('outro', 'Bb'), 20: ('outro', 'Bb'), 21: ('outro', 'F'),
        22: ('end', 'F'), 23: ('end', 'F')}
def sec_at(t): return BARS[min(23, int(t // BAR))][0]

# pad bed: closed in the intro, opens through the verse, dims in the break, full in the chorus, warm at the end
pad_bus = np.zeros(len(mus))
for b in range(24):
    t0 = b * BAR; sec, c = BARS[b]
    cut = {'intro': 900, 'fish': 1300, 'verse': 1700, 'pre': 1200, 'break': 750, 'build': 1500, 'chorus': 2600, 'glass': 1800, 'outro': 1200, 'end': 1100}[sec]
    vol = {'intro': 0.5, 'fish': 0.45, 'verse': 0.42, 'pre': 0.5, 'break': 0.5, 'build': 0.45, 'chorus': 0.5, 'glass': 0.55, 'outro': 0.55, 'end': 0.55}[sec]
    d = BAR if b < 23 else DUR - t0 + 0.3
    x = pad(CH[c][1], d, vol, cut, a=0.9 if b == 0 else 0.4)
    addm(pad_bus, x, t0)
tt = np.arange(len(pad_bus)) / SR
pad_bus *= np.interp(tt, [0, 18.5, 19.0, 22.0, 23.4, 23.5, 24.0, 24.3, 33.2, 33.3, 34.0, 34.05, DUR], [1, 1, 0.75, 0.45, 0.25, 0.0, 0.0, 0.6, 1.0, 0.0, 0.0, 1.0, 1.0])
put(mus, stereo_delay(pad_bus, 0.011, 0.017, 0.0, 0.6), 0, 0.9)

drums = np.zeros((len(mus), 2)); bassb = np.zeros(len(mus)); keys = np.zeros(len(mus))
for b in range(24):
    t0 = b * BAR; sec, c = BARS[b]; root = CH[c][0]
    for k in range(4):
        tb = t0 + k * BEAT
        if tb >= DUR: break
        # kick / clap
        if sec == 'intro' and tb >= 2.0 and k in (0, 2): put(drums, kick(0.7), tb)
        if sec == 'fish' and k in (0, 2): put(drums, kick(0.8), tb)
        if sec in ('verse', 'chorus'):
            put(drums, kick(1.0), tb)
            if k in (1, 3): put(drums, clap(0.55 if sec == 'verse' else 0.7), tb, 1.0, 0.05)
        if sec == 'pre' and k == 0: put(drums, kick(0.8), tb)
        if sec == 'glass' and tb >= 34.0 and k in (0, 2): put(drums, kick(0.75), tb)
        if sec == 'glass' and tb >= 34.0 and k == 2: put(drums, clap(0.45), tb, 1.0, 0.05)
        # hats
        hs = {'fish': 2, 'verse': 4, 'chorus': 4, 'pre': 2, 'glass': 2}.get(sec, 0)
        if sec == 'glass' and tb < 34.0: hs = 0
        for j in range(hs):
            th = tb + j * BEAT / hs; put(drums, hat((0.5 if j == hs // 2 else 0.3) * (1.2 if sec == 'chorus' else 1)), th, 1.0, 0.35)
        if sec == 'chorus' and k in (1, 3): put(drums, hat(0.35, True), tb + 0.25, 1.0, -0.3)
        # bass
        if sec in ('verse', 'chorus'):
            pat = [(0, 0, 0.2), (0.25, 12, 0.12)] if k != 3 else [(0, 7, 0.2), (0.25, 10, 0.15)]
            if k == 1: pat = [(0.25, 0, 0.15)]
            for o, iv, d in pat: addm(bassb, bass_note(root + iv, d, 0.9, 720 if sec == 'chorus' else 540), tb + o)
        elif sec in ('fish', 'intro') and tb >= 2.0 and k == 0: addm(bassb, bass_note(root, 1.8, 0.7, 380), tb)
        elif sec == 'pre' and k == 0: addm(bassb, bass_note(root, 1.9, 0.75, 330), tb)
        elif sec == 'glass' and tb >= 34.0 and k in (0, 2): addm(bassb, bass_note(root + (0 if k == 0 else 7), 0.8, 0.8, 420), tb)
    # electric piano comping
    if sec in ('verse', 'chorus', 'fish') or (sec == 'glass' and t0 >= 34.0):
        hits = [0.0, 0.75, 1.25] if sec in ('verse', 'chorus') else [0.0, 1.0]
        for o in hits:
            for i, m in enumerate(CH[c][1]): addm(keys, epiano(m, 0.45, 0.2), t0 + o + i * 0.008)
# pickup, revival chord, final chord
for i, m in enumerate(CH['F'][1] + [nm('F3')]): addm(keys, epiano(m, 3.0, 0.3), TT['revive'] + i * 0.02)
addm(bassb, bass_note(nm('F1'), 1.8, 0.85, 300), TT['revive'])
for i, m in enumerate([nm('F3'), nm('A3'), nm('C4'), nm('E4'), nm('G4')]): addm(keys, epiano(m, 5.0, 0.24), 43.0 + i * 0.03)
addm(bassb, bass_note(nm('F2'), 4.8, 0.6, 260), 43.0)
# the build: a snare roll from the dive to the chorus downbeat, a crash on the downbeat
for i in range(48):
    tr = 24.5 + i * (1.5 / 48) ** 1.0
    if tr >= 26.0: break
    put(drums, snare(0.15 + 0.6 * (tr - 24.5) / 1.5), tr, 1.0, 0.1 * (i % 2 * 2 - 1))
put(drums, cymbal(0.5), 26.0, 1.0, -0.2); put(drums, kick(1.1), 26.0)
put(drums, cymbal(0.35), 34.0, 1.0, 0.2)
put(mus, drums, 0, 0.8); put(mus, np.stack([bassb, bassb], 1), 0, 0.75); put(mus, stereo_delay(keys, 0.0, 0.012, 0.0, 0.7), 0, 0.85)

# chorus hook (26-33) with a ping-pong echo; it answers once, softly, after the fish comes back (35-37)
lead_b = np.zeros(len(mus))
HOOK1 = [(0.0, 'C5', 0.4), (0.5, 'D5', 0.25), (0.75, 'F5', 0.5), (1.5, 'G5', 0.25), (1.75, 'A5', 0.25), (2.0, 'G5', 0.5), (2.75, 'F5', 0.25), (3.0, 'D5', 0.5), (3.5, 'C5', 0.25), (3.75, 'D5', 0.25)]
HOOK2 = [(0.0, 'A5', 0.4), (0.5, 'G5', 0.25), (0.75, 'F5', 0.5), (1.5, 'D5', 0.25), (1.75, 'F5', 0.25), (2.0, 'G5', 0.75), (3.0, 'A5', 0.3)]
prev = None
for base, hook, v in ((26.0, HOOK1, 0.32), (30.0, HOOK2, 0.32), (35.0, HOOK1[:6], 0.16)):
    for o, n_, d in hook:
        if base + o >= 33.0 and base < 34: continue
        addm(lead_b, lead(nm(n_), d, v, prev), base + o); prev = nm(n_)
put(mus, stereo_delay(lead_b, 0.375, 0.25, 0.4, 0.3), 0, 0.8)

# the goldfish's motif (bells) when it first lights, and once more, softer, while the cat peers in
stabs = np.zeros(len(mus))
for base, v in ((4.0, 0.3), (16.0, 0.18)):
    for o, n_ in [(0.0, 'A5'), (0.5, 'C6'), (0.75, 'D6'), (1.0, 'C6'), (1.5, 'A5'), (2.0, 'G5'), (2.5, 'F5')]:
        addm(stabs, bell(nm(n_), v, 1.4), base + o)
# every sign the cat lights on its way plays the next note of a rising F pentatonic line
PENT = [nm(x) for x in ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6', 'C7']]; k = 0; seenT = set()
for e in EV:
    if e['type'] == 'strike' and 8.4 < e['t'] < 13.5 and round(e['t'], 1) not in seenT:
        seenT.add(round(e['t'], 1)); addm(stabs, pluck(PENT[min(k, len(PENT) - 1)] - (12 if k > 5 else 0), 0.35), e['t']); k += 1
# closing time: each sign that goes off plays a falling note
DOWN = [nm(x) for x in ['C6', 'A5', 'G5', 'F5', 'D5', 'C5', 'A4', 'G4']]; k = 0; seenT = set()
for e in EV:
    if e['type'] == 'off' and 37.9 < e['t'] < 41 and round(e['t'], 1) not in seenT:
        seenT.add(round(e['t'], 1)); addm(stabs, bell(DOWN[min(k, len(DOWN) - 1)], 0.24, 2.0), e['t']); k += 1
addm(stabs, bell(nm('A6'), 0.18, 1.6), TT['peek'] + 0.02)
put(mus, stereo_delay(stabs, 0.375, 0.5, 0.35, 0.3), 0, 0.8)

# ------------------------------------------------------------------ neon foley (follows events.json)
def strike_env(sd, d=1.4):
    tt = t_(d); j = hsh(sd) * 0.03
    e = np.where(tt < 0.05 + j, 1.0, np.where(tt < 0.12 + j, 0.0, np.where(tt < 0.17 + j, 0.7, np.where(tt < 0.23 + j, 0.08, np.minimum(1, 0.6 + (tt - 0.23 - j) * 5)))))
    k = int(0.0015 * SR); return np.convolve(e, np.ones(k) / k, 'same')
def buzz(d, f0=100.0, rasp=0.5):
    tt = t_(d)
    x = sum((0.7 / k ** 0.8) * np.sin(2 * np.pi * f0 * k * tt + k * 1.3) for k in range(1, 16))
    x = x * 0.6 + np.tanh((2 * ((tt * f0) % 1) - 1) * 3) * rasp * 0.4
    return norm(x + hp(noise(d), 3000) * (rng.random(len(tt)) > 0.985) * 3) * 0.6
def neon_strike(sd, gas='neon', d=1.2):
    e = strike_env(sd, d); tt = t_(d)
    loud = np.where(tt < 0.3, 1.0, 0.12 + 0.88 * np.exp(-(tt - 0.3) / 0.1))
    x = hp(buzz(d, 100, 0.6 if gas == 'neon' else 0.35), 90) * e * loud * 0.8
    for i in np.nonzero((e[1:] > 0.5) & (e[:-1] <= 0.5))[0]:
        c = click(0.75 + 0.2 * hsh(sd + i), 1.0) * 0.3; x[i:i + len(c)] += c[:len(x) - i]
    cl = lp(noise(0.07), 900) * env_exp(0.07, 0.012) * 0.5; x[:len(cl)] += cl
    x[-int(0.2 * SR):] *= np.linspace(1, 0, int(0.2 * SR))
    return x
def relay(v=1.0, pitch=1.0):
    d = 0.08; tt = t_(d)
    return norm(fit(click(0.55 * pitch, 1.0), len(tt)) * 0.8 + np.sin(2 * np.pi * 3100 * pitch * tt) * env_exp(d, 0.01) * 0.25) * v
def sizzle(d, dens=0.03):
    tt = t_(d); m = np.convolve((rng.random(len(tt)) < dens).astype(float), np.ones(40) / 4, 'same')
    return norm(hp(noise(d), 2500) * m + bp(buzz(d, 100, 0.8), 200, 3000) * 0.25)
def glass_ting(m, v=1.0, d=1.2):
    f = mtof(m); tt = t_(d)
    return sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / tau) for r, a, tau in [(1, 1, 0.5), (2.32, 0.5, 0.25), (4.25, 0.3, 0.12), (6.63, 0.15, 0.06)]) * v
def rain_bed(d): return bp(noise(d), 900, 9000) * 0.5 + lp(noise(d), 600) * 0.25 + hp(noise(d), 6000) * 0.25
def drip(v=1.0):
    d = 0.12; tt = t_(d); f = 1800 + 1400 * rng.random()
    return np.sin(2 * np.pi * f * (1 - 0.3 * tt / d) * tt) * env_exp(d, 0.015) * v
def drop_sound(scale=1.0):
    d = 1.0; tt = t_(d)
    plip = np.sin(2 * np.pi * np.cumsum(1500 * np.exp(-tt / 0.012) + 420 * scale) / SR) * env_exp(d, 0.05)
    bloop = np.sin(2 * np.pi * np.cumsum(260 * np.exp(-tt / 0.08) + 140 * scale) / SR) * np.exp(-tt / 0.18) * 0.7
    return norm(plip * 0.6 + bloop + bp(noise(d), 1500, 7000) * env_exp(d, 0.03) * 0.4)
def gurgle(d=0.9):          # water draining a level: bubbles falling in pitch under a filtered rush
    tt = t_(d); x = bp(noise(d), 300, 1400) * np.exp(-tt / 0.5) * 0.4
    for i in range(9):
        s0 = rng.random() * d * 0.8; f0 = 900 - 500 * s0 / d + rng.random() * 200; dd = 0.06
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.8 * t_(dd) / dd)) / SR) * env_exp(dd, 0.02)
        s = int(s0 * SR); x[s:s + len(b)] += b[:len(x) - s] * 0.5
    return norm(x)
def slap(v=1.0):            # a fish flopping on dry glass
    d = 0.09; return norm(lp(noise(d), 1600) * env_exp(d, 0.012) + np.sin(2 * np.pi * 240 * t_(d)) * env_exp(d, 0.02) * 0.5) * v
def splash(v=1.0, d=0.7):
    tt = t_(d); x = bp(noise(d), 600, 6000) * env_exp(d, 0.12) + np.sin(2 * np.pi * np.cumsum(300 * np.exp(-tt / 0.05) + 120) / SR) * np.exp(-tt / 0.15) * 0.8
    return norm(x) * v
def purr(d):                # the transformer hum, trembling at 25 Hz
    tt = t_(d); x = hp(lp(buzz(d, 100, 0.2), 700), 80) * (0.55 + 0.45 * np.sin(2 * np.pi * 25 * tt) ** 2)
    return x * np.minimum(1, tt / 0.3) * np.minimum(1, (d - tt) / 0.4)

pan_of = lambda e: 0.6 * e.get('pan', 0)
for e in EV:
    t0, ty = e['t'], e['type']
    if ty == 'strike':
        sd = len(e['circ']) * 3.1 + t0
        g = 0.5 if e['circ'].startswith(('deco', 'hotel.ar', 'gold.bub', 'gold.peb')) else 0.75
        if e['circ'] in ('cat.eye', 'fish'): g = 0.9
        put(fx, neon_strike(sd, e.get('gas', 'neon')), t0, g, pan_of(e)); put(fx, thump(0.5, 60), t0, 0.2 * g, pan_of(e))
    elif ty == 'off':
        put(fx, relay(0.6, 0.8), t0, 0.32, pan_of(e)); put(fx, lp(buzz(0.12, 100, 0.6), 1500) * np.linspace(1, 0, int(0.12 * SR)), t0, 0.22, pan_of(e))
    elif ty == 'spark':
        put(fx, hp(noise(0.12), 2000) * env_exp(0.12, 0.02), t0, 0.5, 0.0); put(fx, click(1.3, 1.0), t0, 0.3)
    elif ty == 'fill':
        d = e['dur'] + 0.3; tt = t_(d); f = 100 * (1 + 0.6 * tt / d)
        put(fx, hp(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + bp(noise(d), 800, 3000) * 0.15, 60) * np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.2), t0, 0.25)
        put(fx, bell(nm('C6'), 0.5, 1.6), t0 + e['dur'], 0.25)
    elif ty == 'purr': put(fx, purr(e['dur']), t0, 0.22, 0.0)
    elif ty == 'step':
        put(fx, relay(0.5, 1.2 + 0.2 * hsh(t0 * 7)), t0, 0.16, pan_of(e))
        if e.get('wet'): put(fx, bp(noise(0.15), 1500, 7000) * env_exp(0.15, 0.03), t0, 0.22, pan_of(e))
    elif ty == 'land':
        put(fx, thump(0.8, 85), t0, 0.35, pan_of(e)); put(fx, relay(0.7, 0.9), t0, 0.22, pan_of(e))
    elif ty == 'swat': put(fx, click(0.7, 1.0), t0, 0.5, pan_of(e)); put(fx, thump(0.6, 140), t0, 0.3, pan_of(e))
    elif ty == 'spin':
        d = e['dur']; s = 0.0
        while s < d:
            put(fx, click(1.6, 1.0) * 0.6, t0 + s, 0.16, 0.3); s += 0.12 * (1 - 0.8 * s / d) + 0.015
        put(fx, whoosh(d, 1.0), t0, 0.18, 0.1)
    elif ty == 'crack':
        put(fx, glass_ting(nm('E7'), 1.0, 0.8), t0, 0.5, pan_of(e)); put(fx, glass_ting(nm('Bb7'), 0.6, 0.5), t0 + 0.01, 0.3, pan_of(e))
        put(fx, sizzle(0.45, 0.08), t0, 0.5, pan_of(e)); put(fx, thump(1.0, 65), t0, 0.4, pan_of(e))
        put(fx, hp(noise(0.06), 3000) * env_exp(0.06, 0.008), t0, 0.7, pan_of(e))
    elif ty == 'leak': d = 1.6; put(fx, hp(noise(d), 4000) * np.exp(-t_(d) / 0.6) * 0.4, t0, 0.3, pan_of(e))
    elif ty == 'drain': put(fx, gurgle(0.9), t0, 0.3, 0.3)
    elif ty == 'glug': put(fx, drop_sound(0.6), t0, 0.18, 0.3)
    elif ty == 'flop': put(fx, slap(1.0), t0, 0.3, pan_of(e))
    elif ty == 'die':
        for i in range(4): put(fx, relay(0.8, 0.6), t0 + i * 0.25, 0.25, 0.3); put(fx, sizzle(0.2, 0.08), t0 + i * 0.25, 0.25, 0.3)
    elif ty == 'fizz': put(fx, sizzle(e['dur'], 0.05), t0, 0.3, 0.4)
    elif ty == 'dive': put(fx, splash(1.0, 0.6), t0, 0.35, 0.0)
    elif ty == 'grab': put(fx, splash(0.6, 0.4), t0, 0.2, 0.0)
    elif ty == 'drop': put(fx, drop_sound(), t0, 0.6, -0.1)
    elif ty == 'splash': put(fx, splash(1.0, 0.8), t0, 0.5, -0.2); put(fx, glass_ting(nm('G6'), 0.5), t0 + 0.02, 0.2, -0.2)
    elif ty == 'revive':
        put(fx, neon_strike(77, 'neon', 1.4), t0, 1.0, -0.15); put(fx, thump(1.0, 55), t0, 0.4)
    elif ty == 'sleep': put(fx, relay(0.5, 0.7), t0, 0.2, -0.1)
    elif ty == 'lastdrop': put(fx, drop_sound(), t0, 0.42, 0.05)
    elif ty == 'peek': put(fx, neon_strike(91, 'pink', 0.5), t0, 0.35, -0.2); put(fx, drop_sound(1.6) * 0.5, t0 + 0.12, 0.12, -0.2)

# rain bed (from the swat on), louder down at the water; drips after it stops
rb = rain_bed(DUR + 1)
lvl = np.interp(np.arange(len(rb)) / SR, [0, 9.6, 11, 15.5, 18.5, 23.5, 24.0, 26.0, 28.5, 28.6, 30.5, 30.6, 31.6, 33.0, 37.5, 38.7, DUR],
                [0, 0, 0.13, 0.12, 0.1, 0.1, 0.1, 0.18, 0.18, 0.12, 0.12, 0.18, 0.16, 0.1, 0.1, 0.0, 0.0])
put(fx, np.stack([rb * lvl, np.roll(rb, 1931) * lvl], 1), 0, 0.55)
for k in range(90):
    at = 9.8 + rng.random() * 28.0
    put(fx, drip(1.0), at, 0.05 * (0.4 + rng.random()), rng.uniform(-0.8, 0.8))
for at in (39.4, 40.7, 41.9, 42.7): put(fx, drip(1.0), at, 0.06, 0.2)
# the transformers' hum under everything: grows with the signs lit; the goblet's hum alone at the end
ht = np.arange(N) / SR
hum_amt = np.interp(ht, [0, 0.25, 2.5, 4.0, 13.5, 18.5, 22.5, 23.5, 24.0, 26.0, 33.0, 37.5, 40.5, 44.0, DUR - 0.3, DUR],
                    [0.15, 0.4, 0.6, 0.7, 1.0, 1.0, 0.7, 0.55, 0.55, 1.0, 1.0, 0.9, 0.45, 0.4, 0.3, 0.0])
hum = hp(lp(buzz(DUR + 0.1, 100, 0.25)[:N], 900), 90) * hum_amt * 0.05
fx[:N, 0] += hum; fx[:N, 1] += np.roll(hum, 211)

# ------------------------------------------------------------------ mix
music = mus[:N].copy() * np.interp(np.arange(N) / SR, [0, 25.9, 26.0, 33.0, 33.1, DUR], [1, 1, 1.25, 1.25, 1, 1])[:, None]
music *= np.interp(np.arange(N) / SR, [0, 23.45, 23.5, 24.0, 24.05, 33.2, 33.3, 33.95, 34.0, DUR], [1, 1, 0.0, 0.0, 1, 1, 0.0, 0.0, 1, 1])[:, None]
for c in range(2): music[:, c] = hp(music[:, c], 48, 3)
fxl = np.sqrt(np.convolve(np.mean(fx[:N] ** 2, 1), np.ones(2400) / 2400, 'same'))
duck = 1 / (1 + 14 * fxl)
mix = music * 0.25 * duck[:, None] + fx[:N]
_m = music * 0.25 * duck[:, None]; _rows = []
for e in EV:
    a = int(e['t'] * SR); b = a + int(0.12 * SR)
    if b < N and e['type'] not in ('step',): _rows.append(10 * np.log10(np.mean(fx[a:b] ** 2) + 1e-12) - 10 * np.log10(np.mean(_m[a:b] ** 2) + 1e-12))
BAL = (np.median(_rows), np.percentile(_rows, 10))
for c in range(2): mix[:, c] = hp(mix[:, c], 30, 2)
fo = int(0.8 * SR); mix[N - fo:N] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix[:int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
mix = mix[:N]

def measure(x):
    p = os.path.join(HERE, '.meas.wav'); sf.write(p, x.astype(np.float32), SR)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(p)
    I = float([l for l in out.splitlines() if l.strip().startswith('I:')][-1].split()[1])
    pk = float([l for l in out.splitlines() if l.strip().startswith('Peak:')][-1].split()[1])
    return I, pk
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
def tp_limit(x, ceil):           # limit the 4x oversampled signal, so inter-sample peaks stay under the ceiling too
    up = resample_poly(x, 4, 1); m = maximum_filter1d(np.abs(up), size=4 * 481)
    g = uniform_filter1d(np.minimum(1, ceil / np.maximum(m, 1e-9)), size=4 * 240)[::4][:len(x)]
    return x * np.pad(g, (0, len(x) - len(g)), constant_values=1)
TARGET = -16.0
for _ in range(4):
    I, pk = measure(mix); mix *= 10 ** ((TARGET - I) / 20)
    for c in range(2): mix[:, c] = tp_limit(mix[:, c], 10 ** (-5.6 / 20))
I, pk = measure(mix)
mix = mix.astype(np.float32); assert mix.shape == (N, 2)
sf.write(os.path.join(HERE, 'mix.wav'), mix, SR, subtype='PCM_24')
db = lambda v: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)
print('cue foley over music: median %+.1f dB, 10th pct %+.1f dB' % BAL)
print('mix.wav %.3f s; integrated %.1f LUFS; true peak %.1f dBTP; music %.1f dB, foley %.1f dB (RMS before gain)' % (len(mix) / SR, I, pk, db(music * 0.25), db(fx[:N])))
