# -*- coding: utf-8 -*-
"""Last Stroke — original score, synthesised with numpy (no samples).

Run: $LIB/.venv/bin/python -I music.py  → out/score.wav (48 kHz stereo, 55 s)

140 BPM, 4/4, D Dorian. Written to the cuts in main.js:
  0–5.2     the figures are drawn: no music (pen scratches only, in mix.py)
  5.2–11.1  standoff: low drone, breathy flute; taiko + brass stab on the title (bar 4)
  11.1–17.1 the exchange: breakbeat, taiko, distorted bass, stabs on the blocks
  17.14     hit-stop: the band cuts for 4 frames, a stab on the kick
  19.6–20.9 off the page: the music falls away (silence, wind in the mix)
  20.9–25.7 the climb: drone + slow taiko pulses, building
  25.7–33.0 back in, then the power-up: double-time drums, 16th bass, riser
  33.0–34.8 the clash in slow motion: everything drops to a low pitched-down hum
  34.8–35.7 the snap: crash, one bar of full band
  35.7–43.6 the last stance and the pass-through: near silence, one flute note
  45.6–55   aftermath and the handshake: flute melody, string pad, a brass chord on the pull-up
"""
import os, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000; BPM = 140; BEAT = 60 / BPM; BAR = 4 * BEAT; DUR = 57.5; N = int(DUR * SR)
rng = np.random.default_rng(140)
def ts(n): return np.arange(n) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def _sos(k, f, o): return butter(o, f, k, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('band', [lo, hi], o), x, axis=0)
def noise(n): return rng.standard_normal(n)
def B(b, beat=0.0): return (b * 4 + beat) * BEAT

# ───── instruments ─────
def kick(v=1.0):
    t = ts(int(.35 * SR)); f = 48 + 110 * np.exp(-t / .025)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.6) * np.exp(-t / .14) * v
def snare(v=1.0):
    n = int(.3 * SR); t = ts(n)
    return (np.sin(2 * np.pi * 185 * t) * np.exp(-t / .04) * .7 + bp(noise(n), 1500, 9000) * np.exp(-t / .07)) * v
def hat(v=1.0, o=False):
    t = ts(int((.2 if o else .05) * SR)); return hp(noise(len(t)), 7500) * np.exp(-t / (.07 if o else .012)) * v * .5
def taiko(v=1.0, f0=62):
    n = int(1.0 * SR); t = ts(n); f = f0 * (1 + .35 * np.exp(-t / .05))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(2 * np.pi * np.cumsum(f * 1.6) / SR) * np.exp(-t / .1)
    skin = lp(noise(n), 900) * np.exp(-t / .03) * .8
    return np.tanh((body * np.exp(-t / .45) + skin) * 1.3) * v
def tom(m, v=1.0):
    t = ts(int(.5 * SR)); f = mtof(m) * (1 + .4 * np.exp(-t / .04))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .22) * v
def cymbal(v=1.0, d=2.4):
    t = ts(int(d * SR)); return hp(noise(len(t)), 4500) * np.exp(-t / .8) * v * .45
def bass(m, d, v=.8):
    f = mtof(m); n = int((d + .05) * SR); t = ts(n)
    x = 2 * ((f * t) % 1) - 1 + .5 * (2 * ((f * 1.007 * t) % 1) - 1)
    e = np.exp(-t / .08); x = np.tanh((lp(x, 700) * (1 - e) + lp(x, 2500) * e) * 2.5)   # the filter opens on the pluck
    return x * np.minimum(1, t / .004) * np.where(t < d, 1, np.exp(-(t - d) / .02)) * v * .5
def stab(ms, d, v=.9):
    n = int((d + .15) * SR); t = ts(n)
    x = sum(sum(2 * ((mtof(m) * k * t + rng.random()) % 1) - 1 for k in (.994, 1.006)) for m in ms)
    return lp(x, 3200) * np.minimum(1, t / .006) * np.exp(-t / .22) * np.where(t < d, 1, np.exp(-(t - d) / .06)) * v * .12
def flute(m, d, v=.5, bend=0.0):
    n = int((d + .3) * SR); t = ts(n)
    f = mtof(m) * (1 + bend * np.exp(-t / .12)) * (1 + .007 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / .5))
    ph = np.cumsum(f) / SR
    tone = np.sin(2 * np.pi * ph) + .18 * np.sin(4 * np.pi * ph) + .06 * np.sin(6 * np.pi * ph)
    breath = bp(noise(n), 900, 5000) * (.25 + .5 * np.exp(-t / .15))
    env = np.minimum(1, t / .12) * np.where(t < d, 1, np.exp(-(t - d) / .18))
    return (tone + breath) * env * v * .3
def drone(m, d, v=.3):
    n = int(d * SR); t = ts(n)
    x = sum(np.sin(2 * np.pi * mtof(m) * k * t + k) / k for k in (1, 2, 3, 5)) + .5 * np.sin(2 * np.pi * mtof(m + 7) * t)
    return lp(x, 900) * np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / .6) * v * .25
def strings(ms, d, v=.3):
    n = int((d + 1) * SR); t = ts(n)
    x = sum(sum(2 * ((mtof(m) * k * t + rng.random()) % 1) - 1 for k in (.997, 1.003)) for m in ms)
    return lp(x, 2200) * np.minimum(1, t / .8) * np.where(t < d, 1, np.exp(-(t - d) / .5)) * v * .08
def riser(d, v=.5):
    n = int(d * SR); t = ts(n); out = np.zeros(n); x = noise(n)
    for i in range(0, n, 960):
        f = 300 * (8000 / 300) ** (i / n); out[i:i + 960] = bp(x[max(0, i - 3000):i + 960], f * .7, min(f * 1.4, 20000))[-len(out[i:i + 960]):]
    return out * (t / d) ** 2 * v

BUS = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'mel', 'pad', 'fx')}
def place(bus, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0: return
    s = sig[max(0, -i):]; i = max(0, i); s = s[:N - i]
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    BUS[bus][i:i + len(s), 0] += s * gain * l; BUS[bus][i:i + len(s), 1] += s * gain * r

D = 50   # D3
def breakbeat(b, dyn=1.0, double=False):
    # a broken beat: kick on 1, the "and" of 2, 3½; snare on 2 and 4 with ghost notes; 16th hats
    for s in range(16):
        t = B(b, s / 4)
        if s in ((0, 6, 10) if not double else (0, 4, 6, 8, 10, 14)): place('drums', kick(1), t, .55 * dyn)
        if s in (4, 12): place('drums', snare(1), t, .35 * dyn)
        if s in (7, 15) or (double and s % 2 == 1): place('drums', snare(.35), t, .12 * dyn)
        place('drums', hat(.6 + .4 * (s % 2 == 0), o=(s == 14)), t, .09 * dyn, .3)
def taiko_bar(b, pat=(0, 2.5, 3), dyn=1.0):
    for beat in pat: place('drums', taiko(1, 58 if beat == 0 else 66), B(b, beat), .5 * dyn, -.2)
def bass_bar(b, notes, dyn=1.0, sixteenth=False):
    if sixteenth:
        for s in range(16): place('bass', bass(notes[(s // 4) % len(notes)], BEAT / 4 * .8, .8), B(b, s / 4), .5 * dyn)
    else:
        for k, (beat, m, d) in enumerate(notes): place('bass', bass(m, d * BEAT), B(b, beat), .55 * dyn)

# —— the cue (bars at 140 BPM; bar 4 = 6.857 s) ——
place('pad', drone(D - 12, 6.0, .5), 5.0)                                     # standoff drone
place('mel', flute(D + 14, 1.6, .5, -.06), 5.4, .6, -.2); place('mel', flute(D + 17, 2.2, .45, -.04), 7.6, .55, -.2)
place('fx', stab([D + 12, D + 15, D + 19], BEAT, 1), B(4), .9); place('drums', taiko(1.2, 52), B(4), .7); place('drums', cymbal(.8), B(4), .4)
for b in (5,): taiko_bar(b, (0, 2), .7)
place('mel', flute(D + 12, 1.4, .45, -.05), 9.4, .55, -.2)
place('fx', riser(1.0, .4), B(6.5) - 1.0)
RIFF = [(0, D - 12, .75), (.75, D - 12, .25), (1.5, D - 10, .5), (2, D - 7, .75), (3, D - 5, .5), (3.5, D - 7, .5)]
for b in range(7, 10):   # bars 7–10: the exchange (bar 6.5 is the dash fill below)
    breakbeat(b); taiko_bar(b, (0, 2.5), .6); bass_bar(b, RIFF)
for bb, beat in ((6, 2), (6, 3), (6, 3.5)): place('drums', tom(45 - int(beat * 2)), B(bb, beat), .5)
for s in range(8):   # the dash: half a bar of kick and hats
    place('drums', kick(1) if s in (0, 6) else hat(.8), B(6.5, s / 4), .5 if s in (0, 6) else .1)
for t0 in (11.82, 12.23, 13.62, 14.0, 14.2, 14.4): place('fx', stab([D + 12, D + 17], .12, .7), t0, .45, .3)
# hit-stop at 17.14: everything stops for 4 frames, then a stab and the band again
place('fx', stab([D + 10, D + 14, D + 17], BEAT * 1.5, 1), 17.14, 1.0); place('drums', taiko(1.3, 50), 17.14, .8); place('drums', cymbal(1), 17.31, .5)
breakbeat(10, 1.0); bass_bar(10, RIFF)
place('fx', stab([D + 9, D + 12, D + 16], BEAT, 1), 18.14, .9); place('drums', taiko(1.2, 48), 18.14, .7)
# the climb: drone + pulses
place('pad', drone(D - 14, 4.8, .45), 20.9)
for k, t0 in enumerate((21.2, 22.0, 22.6, 23.1, 23.5, 23.85, 24.15, 24.4, 24.6, 24.8, 25.0, 25.2)): place('drums', taiko(.8 + k * .03, 60), t0, .25 + k * .03)
place('fx', riser(1.5, .5), 25.71 - 1.5)
# back in, power-up, double time
for b in range(15, 19):
    breakbeat(b, 1.0, double=b >= 17); taiko_bar(b, (0, 1, 2, 3) if b >= 17 else (0, 2.5), .7); bass_bar(b, RIFF) if b == 15 else bass_bar(b, [D - 12, D - 12, D - 10, D - 9] if b < 17 else [D - 12, D - 9, D - 7, D - 5], sixteenth=True)
place('pad', strings([D, D + 3, D + 7, D + 10], 5.2, .5), B(16))
place('fx', riser(B(19.25) - B(17), .6), B(17))
for k in range(8): place('drums', tom(52 - k), B(18.5, k / 2), .45)   # tom fill into the dash
# the clash in slow motion: a low pitched-down hum, then the snap
t = ts(int(1.8 * SR)); hum = np.sin(2 * np.pi * (55 - 15 * t / 1.8) * t) + .3 * np.sin(2 * np.pi * (110 - 30 * t / 1.8) * t)
place('fx', hum * np.minimum(1, t / .1) * np.minimum(1, (1.8 - t) / .1) * .5, 33.0, .8)
place('fx', stab([D, D + 7, D + 12, D + 15], BEAT * 2, 1), 34.8, 1.0); place('drums', cymbal(1.2, 3), 34.8, .6); place('drums', taiko(1.4, 46), 34.8, .9)
breakbeat(20.3, 1.1); bass_bar(20.3, [(0, D - 12, 1), (1, D - 10, 1), (2, D - 9, 1)])
# the last stance: one flute note, a breath before the pass
place('mel', flute(D + 7, 4.2, .4, -.03), 36.6, .5, -.2)
place('drums', taiko(1.3, 50), 43.6, .7)
# aftermath and the handshake: D Dorian melody, string pad, brass on the pull-up
MEL = [(45.9, D + 9, .9), (46.8, D + 12, .9), (47.7, D + 14, 1.3), (49.0, D + 12, .6), (49.6, D + 16, 1.6)]
for t0, m, d in MEL: place('mel', flute(m, d, .45), t0, .6, -.15)
place('pad', strings([D - 12, D, D + 3, D + 7], 9.0, .45), 45.6)
place('fx', stab([D, D + 4, D + 7, D + 14], 2.4, .8), 50.5, .8); place('pad', strings([D - 10, D + 2, D + 5, D + 9], 4.0, .5), 50.5)   # the pull-up lifts to F major
place('drums', taiko(1, 55), 50.5, .5); place('drums', cymbal(.7, 3.5), 50.5, .35)
place('drums', taiko(1, 50), 53.4, .5)

# ───── mix the score ─────
def reverb(x, rt, wet):
    n = int(rt * SR); t = ts(n); ir = lp(noise(n) * np.exp(-t * 6.9 / rt), 6000); ir /= np.sqrt((ir ** 2).sum())
    return x + wet * np.stack([fftconvolve(x[:, c], ir)[:len(x)] for c in (0, 1)], 1)
G = {'drums': (1.0, .9, .12), 'bass': (.85, .4, .03), 'mel': (1.0, 2.6, .35), 'pad': (.9, 2.6, .3), 'fx': (.9, 1.6, .2)}
mix = sum(reverb(BUS[k], rt, wet) * gain for k, (gain, rt, wet) in G.items())
# hit-stop: 4 frames of nothing; off the page: the music falls away; the slow clash keeps only the hum; the last stance is near-silent
def cut(a, b, keep=0.0):
    i, j = int(a * SR), int(b * SR); mix[i:j] *= keep
fx_only = BUS['fx'] * .9
cut(17.14, 17.31)
i0, i1 = int(19.4 * SR), int(20.9 * SR); mix[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 3
mix[int(33.0 * SR):int(34.8 * SR)] = reverb(fx_only, 1.6, .2)[int(33.0 * SR):int(34.8 * SR)]
mix /= np.percentile(np.abs(mix), 99.99) / .85
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/score.wav'), np.clip(mix, -1, 1).astype(np.float32), SR)
print('score.wav', DUR, 's')
