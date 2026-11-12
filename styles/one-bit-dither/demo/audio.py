# 《月亮的传真》 sound: the facsimile signal is the clock of the score (scan hiss = hats, line sync = snare).
# Reads events.json (node core/render/events.mjs <demo>) and writes out/mix.wav, 48 kHz stereo, exactly DUR s.
# Run from the library root: .venv/bin/python styles/one-bit-dither/demo/audio.py
import sys, os, json, subprocess, re
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # styles/<slug>/demo -> library root
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, noise, lp, hp, bp, t_, env_exp, brown, norm, thump, whoosh, clack, click, creak, rumble

EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; N = int(round(DUR * SR))
ev = EV['ev']
def times(kind): return [e['t'] for e in ev if e['type'] == kind]
SHOT = {e['name']: e['t'] for e in ev if e['type'] == 'shot'}
A0, B0, C0, D0, E0, F0, G0, H0, END = (SHOT[k] for k in ['A0', 'B0', 'C0', 'D0', 'E0', 'F0', 'G0', 'H0', 'END'])
BEAT = 60 / 126; BAR = 4 * BEAT
SYNCS = times('sync'); CUTS = times('cut'); ROWS = times('row'); STAMPS = times('stamp'); RIM = times('rim')[0]
S.seed(66); rng = np.random.default_rng(66)
def buf(): return np.zeros((N, 2), np.float32)
def fade(x, a, b): g = np.ones(len(x)); na, nb = int(a * SR), int(b * SR); g[:na] = np.linspace(0, 1, na) if na else 1; g[len(x) - nb:] = np.linspace(1, 0, nb) if nb else 1; return x * g
def M(name): return S.midi(name)

# ======================= foley =======================
fx = buf()
# shot 1: cold wind, a dog far off, the telescope's motor and its wheels on the rail
wind = bp(noise(4.6), 260, 1400) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.35 * t_(4.6) + 1.0)); add(fx, fade(norm(wind), 0.02, 0.6).astype(np.float32), 0, 0.10, -0.2)
add(fx, fade(norm(hp(noise(4.6), 3000)) * 0.4, 0.02, 0.6).astype(np.float32), 0, 0.04, 0.3)
def bark(v=1.0):
    d = 0.16; tt = t_(d); f = 260 - 380 * tt; ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sign(np.sin(ph)) * 0.6 + np.sin(2 * ph)) * env_exp(d, 0.05) * np.minimum(1, tt / 0.01)
    return norm(bp(x + 0.3 * noise(d), 350, 1800)) * v
for t0, g in ((1.15, 0.05), (1.42, 0.04)): add(fx, lp(bark(), 2400).astype(np.float32), t0, g, -0.6)
hum_d = 4.2; tt = t_(hum_d); hum = sum(np.sin(2 * np.pi * 50 * k * tt) / k for k in range(1, 7))
add(fx, fade(norm(lp(hum, 320)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * tt)), 0.4, 0.3).astype(np.float32), 0.0, 0.07, 0.2)
def squeal(d=0.7, f0=2700, f1=2300):
    tt = t_(d); f = np.linspace(f0, f1, len(tt)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 17 * tt)) + 0.3 * bp(noise(d), 1800, 4200)
    return norm(x) * np.sin(np.pi * tt / d) ** 2
add(fx, squeal(0.8).astype(np.float32), 1.9, 0.035, 0.3); add(fx, squeal(0.6, 2400, 2550).astype(np.float32), 3.05, 0.028, 0.35)
add(fx, rumble(2.5, 1.0).astype(np.float32), 1.6, 0.10, 0.1)
add(fx, whoosh(1.0, 1.0).astype(np.float32), 2.9, 0.08, 0.0)

# the facsimile signal on the speaker: carrier hiss with the picture tone, a sync "tack" each line
def signal(d, seed=1):
    r = np.random.default_rng(seed); tt = t_(d); line = np.floor(tt / (2 * BEAT))
    tone = np.zeros(len(tt))
    k = np.interp(tt, np.arange(0, d + 0.06, 0.06), r.random(int(d / 0.06) + 2))
    f = 1500 + 800 * k                                      # 1.5–2.3 kHz white..black
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    hiss = bp(noise(d), 1100, 2600)
    return norm(0.55 * tone + 0.6 * norm(hiss))
sig_a, sig_b = 3.55, D0 + 0.05
sig = signal(sig_b - sig_a)
env = np.ones(len(sig)); tt = t_(sig_b - sig_a) + sig_a
env *= np.clip((tt - sig_a) / 0.45, 0, 1) * 0.35 + np.clip((tt - B0) / 0.05, 0, 1) * 0.65   # pre-lap, full at the cut
env *= np.where(tt > C0, 0.55, 1.0)
spk = bp(sig * env, 300, 3400)                               # through a small speaker
add(fx, fade(spk, 0.05, 0.08).astype(np.float32), sig_a, 0.075, -0.15)
for t0 in SYNCS:
    if t0 < sig_a or t0 > D0: continue
    tack = norm(np.sin(2 * np.pi * 1200 * t_(0.035)) * env_exp(0.035, 0.008) + 0.5 * click(1.3, 1.0)[:int(0.035 * SR)])
    add(fx, tack.astype(np.float32), t0, 0.10 if t0 >= B0 else 0.05, -0.15)
# chart recorder pen scratch (the saw drops on each sync)
for t0 in SYNCS:
    if B0 <= t0 < C0:
        d = 0.8; sc = bp(noise(d), 2500, 6000) * np.linspace(0.2, 1, int(d * SR)) ** 2 * 0.5; add(fx, sc.astype(np.float32), t0 - 0.8, 0.012, 0.1)
# room tone, night
rt = norm(lp(brown(C0 - B0), 220)); add(fx, fade(rt, 0.1, 0.1).astype(np.float32), B0, 0.04)
# shot 3: one sound per cut — car door, crate latch, plug in, drum motor winding up
d = 1.0; car = lp(brown(d), 160) * np.linspace(1, 0.2, int(d * SR)); add(fx, norm(car).astype(np.float32), CUTS[0], 0.09, -0.4)
add(fx, thump(1.0, 85).astype(np.float32), CUTS[0] + 0.32, 0.20, -0.4); add(fx, clack(0.7, 1.0).astype(np.float32), CUTS[0] + 0.33, 0.07, -0.4)
add(fx, clack(1.1, 1.0).astype(np.float32), CUTS[1], 0.15, 0.2); add(fx, clack(0.8, 1.0).astype(np.float32), CUTS[1] + 0.07, 0.10, 0.2); add(fx, creak(1.0).astype(np.float32), CUTS[1] + 0.12, 0.05, 0.2)
add(fx, click(0.8, 1.0).astype(np.float32), CUTS[2] + 0.38, 0.22, 0.0); add(fx, thump(0.6, 140).astype(np.float32), CUTS[2] + 0.38, 0.08, 0.0)
hum2 = sum(np.sin(2 * np.pi * 100 * k * t_(0.5)) / k for k in range(1, 5)); add(fx, fade(norm(hum2), 0.05, 0.1).astype(np.float32), CUTS[2] + 0.42, 0.025, 0.0)
d = 2.2; tt = t_(d); f = 60 + 180 * np.clip(tt / 1.2, 0, 1) ** 0.7; mot = norm(lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 3) / SR), 1200)) * np.clip(tt / 0.2, 0, 1)
mot = fade(mot, 0.05, 0.9); add(fx, mot.astype(np.float32), CUTS[3] + 0.05, 0.05, 0.25)
# shot 4: the stylus writing each line (fine scratch per row, under the hats)
for t0 in ROWS:
    d = 0.1; s = bp(noise(d), 3000, 8000) * env_exp(d, 0.03); add(fx, s.astype(np.float32), t0, 0.02, rng.uniform(-0.3, 0.3))
# through the dots: a breath of air, then the Moon has no air at all
add(fx, whoosh(0.9, 1.0).astype(np.float32), E0 - 0.6, 0.12, 0.0)
# the far signal on the Moon (same signal, tiny, filtered, a long way off)
d = F0 - E0 - 0.3; far = lp(hp(signal(d, 5), 900), 1700) * 0.5
far = fade(far, 1.2, 1.0) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t_(d)))
add(fx, far.astype(np.float32), E0 + 0.3, 0.025, 0.4)
# back in the room: the print snaps on its peg; the clock races through the night; the first bird
add(fx, clack(1.5, 1.0).astype(np.float32), F0 + 0.02, 0.08, 0.3)
d = 0.35; pap = bp(noise(d), 1500, 7000) * env_exp(d, 0.08); add(fx, pap.astype(np.float32), F0 + 0.05, 0.03, 0.3)
tk, t = [], F0 + 0.2
while t < G0 - 0.3:
    tk.append(t); prog = (t - F0) / (G0 - F0); t += max(0.07, 0.55 * (1 - prog) ** 1.6)
for i, t0 in enumerate(tk): add(fx, S.hit('woodblock', 'c' if i % 2 else 'b', 0.35), t0, 0.10 if i % 2 else 0.08, -0.35)
def chirp(d=0.11, f0=3800, f1=5200):
    tt = t_(d); f = np.linspace(f0, f1, len(tt)) + 400 * np.sin(2 * np.pi * 38 * tt); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d))
for t0, a, b in ((32.05, 3800, 5200), (32.22, 4300, 3600), (32.36, 3900, 5400), (33.0, 4100, 4900)): add(fx, chirp(0.1, a, b).astype(np.float32), t0, 0.03, 0.55)
room2 = norm(lp(brown(G0 - F0 + 1), 250)); add(fx, fade(room2, 0.2, 0.3).astype(np.float32), F0, 0.03)
# the verdict: two stamps on cork
for t0 in STAMPS:
    add(fx, thump(1.0, 62).astype(np.float32), t0, 0.32, -0.1); add(fx, clack(0.55, 1.0).astype(np.float32), t0, 0.16, -0.1)
    d = 0.12; s = lp(noise(d), 900) * env_exp(d, 0.03); add(fx, norm(s).astype(np.float32), t0 + 0.005, 0.10, -0.1)
room3 = norm(lp(brown(H0 - G0), 250)); add(fx, fade(room3, 0.2, 0.3).astype(np.float32), G0, 0.05)
# the board hold: the far signal again, faint, from the speaker down the corridor
d = STAMPS[0] - G0; s3 = bp(signal(d, 9), 600, 2600) * 0.4; add(fx, fade(s3, 0.6, 0.15).astype(np.float32), G0, 0.03, 0.5)
# the morning: the paper van pulling away down the street, the twine creaks, then wind over the roofs
d = 6.5; tt = t_(d); f = 38 + 6 * np.sin(2 * np.pi * 0.7 * tt); eng = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + lp(brown(d), 200)
eng = lp(eng, 600) * np.exp(-tt / 2.2); add(fx, norm(eng).astype(np.float32), H0, 0.10, -0.45)
add(fx, creak(1.0).astype(np.float32), H0 + 0.25, 0.05, 0.1)
w2 = bp(noise(DUR - H0 - 3.5), 250, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t_(DUR - H0 - 3.5))); add(fx, fade(norm(w2), 1.5, 1.2).astype(np.float32), H0 + 3.5, 0.06, 0.2)

# ======================= music =======================
mu = buf(); ev_m = []
DM = lambda off: [(0, 'D'), (1, 'Bb'), (2, 'F'), (3, 'A')][off]
# shot 4 (four bars from D0): hats on every printed line, snare on the line sync, pizz bass walking, clarinet theme
for k in range(int((E0 - 0.15 - D0) / (BEAT / 4)) + 1):    # the scan hiss: sixteenths, one per printed line while the printer runs
    t0 = D0 + k * BEAT / 4; printing = t0 <= ROWS[-1] + 0.01
    ev_m.append(dict(t=t0, inst='hihat', pitch='closed', vel=(0.32 if printing else 0.24) + 0.12 * (k % 4 == 0), pan=0.25))
for t0 in SYNCS:
    if D0 - 0.01 <= t0 < E0 - 0.2: ev_m.append(dict(t=t0 + BEAT, inst='snare2', pitch='on', vel=0.45, pan=-0.05))
bass = [['D2', 'A2', 'D2', 'A2'], ['Bb1', 'F2', 'Bb1', 'F2'], ['F2', 'C3', 'F2', 'C3'], ['A1', 'E2', 'A1', 'C#2']]
for b in range(4):
    for k in range(4):
        t0 = D0 + b * BAR + k * BEAT
        if t0 < E0 - 0.2: ev_m.append(dict(t=t0, inst='contrabass_pizz', pitch=bass[b][k], dur=BEAT * 0.9, vel=0.62, pan=0.0))
for b in range(4):
    t0 = D0 + b * BAR
    if b >= 1: ev_m.append(dict(t=t0, inst='bass_drum', pitch=None, vel=0.25, pan=0.0))
THEME = [('D5', 0, 1), ('F5', 1, 1), ('A5', 2, 1.5), ('G5', 3.5, 0.5), ('F5', 4, 1), ('E5', 5, 1), ('D5', 6, 2),
         ('C5', 8, 1), ('D5', 9, 1), ('F5', 10, 1), ('E5', 11, 1), ('D5', 12, 2), ('A4', 14, 2)]
def theme(t0, inst, vel, pan, oct=0, start=0, limit_t=None, release=0.25):
    for p, b, l in THEME:
        if b < start: continue
        tt0 = t0 + (b - start) * BEAT
        if limit_t and tt0 >= limit_t: continue
        ev_m.append(dict(t=tt0, inst=inst, pitch=M(p) + 12 * oct, dur=l * BEAT * 0.95, vel=vel, pan=pan, release=release))
theme(D0 + BAR, 'clarinet', 0.55, -0.2, oct=-1, limit_t=E0 - 0.25)
for t0, p in ((D0 + 2 * BAR, 'D6'), (D0 + 2 * BAR + 2 * BEAT, 'A6'), (D0 + 3 * BAR, 'F6'), (D0 + 3 * BAR + 2 * BEAT, 'E6')):
    ev_m.append(dict(t=t0, inst='glockenspiel', pitch=p, dur=1.0, vel=0.42, pan=0.35))
UP = lambda n, det=0.13: M(n) + det                         # the upright is a little out of tune
for b, ch in ((2, ['F3', 'A3', 'C4']), (3, ['A3', 'C#4', 'E4'])):
    for k in (0, 2):
        for n in ch: ev_m.append(dict(t=D0 + b * BAR + k * BEAT, inst='upright', pitch=UP(n), dur=BEAT * 1.6, vel=0.4, pan=-0.3))
ev_m.append(dict(t=D0, inst='cellos', pitch='D3', dur=E0 - D0 - 0.2, vel=0.3, pan=0.2, attack=1.5, release=0.1))
# the Moon: nothing but a far bowed note, and the glockenspiel when the rim of light appears
ev_m.append(dict(t=E0 + 1.2, inst='vibraphone_bowed', pitch='D4', dur=4.5, vel=0.22, pan=-0.3, attack=1.5, release=1.5))
ev_m.append(dict(t=RIM, inst='glockenspiel', pitch='A6', dur=3.0, vel=0.5, pan=0.15, release=3.0))
ev_m.append(dict(t=RIM + 0.02, inst='vibraphone_bowed', pitch='A4', dur=2.4, vel=0.25, pan=0.3, attack=0.4, release=1.6))
# dawn: a held, quiet chord under the clock
for n, v in (('D4', 0.18), ('F4', 0.15), ('A4', 0.15)): ev_m.append(dict(t=F0 + 0.4, inst='vibraphone_bowed', pitch=n, dur=G0 - F0 - 0.6, vel=v, pan=0.0, attack=1.2, release=1.0))
# after the second stamp the music comes back: low strings swell into the last shot
S2 = STAMPS[1]
ev_m.append(dict(t=S2 + 0.05, inst='upright', pitch=UP('D3'), dur=1.5, vel=0.5, pan=-0.2))
ev_m.append(dict(t=S2 + 0.05, inst='upright', pitch=UP('A3'), dur=1.5, vel=0.42, pan=-0.2))
ev_m.append(dict(t=S2 + 0.1, inst='cellos', pitch='D3', dur=H0 - S2, vel=0.32, pan=0.2, attack=1.6, release=0.2))
ev_m.append(dict(t=S2 + 0.1, inst='violas', pitch='F3', dur=H0 - S2, vel=0.25, pan=-0.2, attack=1.8, release=0.2))
for k in range(5): ev_m.append(dict(t=S2 + 0.9 + k * BEAT * 2, inst='contrabass_pizz', pitch=['D2', 'A1', 'D2', 'C2', 'A1'][k], dur=BEAT, vel=0.5, pan=0.0))
# the morning: the theme once through, whole, then the long chord
theme(H0, 'clarinet', 0.55, -0.2, oct=0, limit_t=H0 + 3 * BAR - 0.05)
theme(H0, 'glockenspiel', 0.3, 0.35, oct=1, limit_t=H0 + 3 * BAR - 0.05, release=0.8)
for b, ch in ((0, ['D3', 'F3', 'A3']), (1, ['Bb2', 'D3', 'F3']), (2, ['F3', 'A3', 'C4'])):
    for k in (0, 2):
        for n in ch: ev_m.append(dict(t=H0 + b * BAR + k * BEAT, inst='upright', pitch=UP(n), dur=BEAT * 1.8, vel=0.45, pan=-0.3))
bassH = [['D2', 'A2', 'F2', 'A2'], ['Bb1', 'F2', 'D2', 'F2'], ['F2', 'C3', 'A2', 'E2']]
for b in range(3):
    for k in range(4): ev_m.append(dict(t=H0 + b * BAR + k * BEAT, inst='contrabass_pizz', pitch=bassH[b][k], dur=BEAT * 0.9, vel=0.55, pan=0.0))
for b in range(3):
    for k in range(4): ev_m.append(dict(t=H0 + b * BAR + k * BEAT + BEAT / 2, inst='hihat', pitch='closed', vel=0.22, pan=0.25))
    ev_m.append(dict(t=H0 + b * BAR + BEAT, inst='snare2', pitch='on', vel=0.32, pan=-0.05)); ev_m.append(dict(t=H0 + b * BAR + 3 * BEAT, inst='snare2', pitch='on', vel=0.32, pan=-0.05))
ev_m.append(dict(t=H0, inst='cellos', pitch='D3', dur=3 * BAR, vel=0.3, pan=0.2, attack=0.8, release=0.3))
CH = H0 + 3 * BAR                                         # the long chord: D major, it rings into the end card
for inst, notes, v, pan in (('cellos', ['D3', 'A3'], 0.4, 0.25), ('violas', ['F#4'], 0.32, -0.2), ('violins', ['A4', 'D5'], 0.3, 0.1), ('contrabass', ['D2'], 0.35, 0.0), ('clarinet', ['F#4'], 0.32, -0.3)):
    for n in notes: ev_m.append(dict(t=CH, inst=inst, pitch=n, dur=DUR - CH - 1.6, vel=v, pan=pan, attack=0.25, release=1.5))
for n in ('D3', 'A3', 'D4', 'F#4'): ev_m.append(dict(t=CH, inst='upright', pitch=UP(n), dur=4.5, vel=0.45, pan=-0.2))
ev_m.append(dict(t=CH, inst='glockenspiel', pitch='D6', dur=4.0, vel=0.45, pan=0.35, release=4.0))
ev_m.append(dict(t=CH, inst='sus_cymbal', pitch=None, vel=0.18, pan=0.3))

music = S.render(ev_m, dur=DUR, master=False)
music = S.room(music, size=0.4, mix=0.16)
# the Moon is silent: duck everything that is not the far signal / bowed / glock (nothing else plays there anyway)
mix = fx + music.astype(np.float32) * 0.8
mix = hp(mix.T, 45, 4).T.astype(np.float32)
g = np.ones(N, np.float32); fo = int(0.6 * SR); g[-fo:] = np.linspace(1, 0, fo) ** 1.5; mix *= g[:, None]

def loud(x):
    tmp = os.path.join(HERE, '_tmp_mix.wav'); sf.write(tmp, x, SR, subtype='FLOAT')
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(tmp)
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', out)[-1]); LRA = float(re.findall(r'LRA:\s+(-?[\d.]+) LU', out)[-1])
    return I, TP, LRA
I, TP, _ = loud(mix)
mix *= 10 ** ((-16.0 - I) / 20)
mix = limit(mix, ceil=10 ** (-4.3 / 20))
I, TP, LRA = loud(mix)
assert len(mix) == N
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print(f'out/mix.wav  {len(mix) / SR:.3f} s  {I:.1f} LUFS  true peak {TP:.1f} dBTP  LRA {LRA:.1f} LU')
print('\n'.join(S.credits(sorted({e['inst'] for e in ev_m} | {'woodblock'}))))
