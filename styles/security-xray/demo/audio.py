# 《安检口的夜班》 sound: the operator's voice (Kokoro, out/voice) + score (sampled instruments) + console tones and foley (procedural) -> mix.wav
# 48 kHz stereo, exactly DUR seconds. Cue times, voice clips and their starts come from events.json (node core/render/events.mjs <demo>).
# Run from the library root:  .venv/bin/python <demo>/audio.py
import sys, os, json
import numpy as np, soundfile as sf, soxr
from scipy.signal import lfilter, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # styles/<slug>/demo -> library root
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, noise, lp, hp, bp, t_, env_exp, brown, norm, thump, ding, whoosh, click, clack, quindar, pop, compress

EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; N = int(round(DUR * SR))
S.seed(11); rng = np.random.default_rng(5)
evs = EV['ev']
def at(kind): return [e for e in evs if e['type'] == kind]
B = 0.5   # one beat at 120 BPM; cuts and scans land on the beat grid

# ---------------------------------------------------------------- score
sc = []
def n(t, inst, p, d, v, pan=0.0, **k): sc.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, **k))
# A. power-on: a low D and a bowed shimmer, then the belt groove from the first scan (D dorian)
n(0.0, 'contrabass', 'D2', 1.4, 0.45, 0, attack=0.02, release=0.5)
n(0.0, 'vibraphone_bowed', 'A4', 1.6, 0.35, 0.2, release=0.6)
n(0.05, 'vibraphone_bowed', 'D5', 1.5, 0.3, -0.2, release=0.6)
BASS = {0: ['D2', 'D2', 'D2', 'C2'], 1: ['Bb1', 'Bb1', 'C2', 'C2'], 2: ['D2', 'D2', 'F2', 'G2'], 3: ['A1', 'A1', 'C2', 'E2']}
CELLO = ['D3', 'D3', 'A3', 'D3', 'F3', 'D3', 'A3', 'G3']
# cue anchors, all from events.json (film time)
AL = [e['t'] for e in at('alarm')]; NO = [e['t'] for e in at('no')]; GL = [e['t'] for e in at('glitch')]
CUTS = [e['t'] for e in at('cut')]; MONT = [e['t'] for e in at('cut') if 'item' in e]
WAT = max(c for c in CUTS if c < AL[1]); NIGHT = max(c for c in CUTS if c < GL[0]); SUMC = [c for c in CUTS if c > GL[1]][0]
RS = at('rescan')[0]; TW = [e['t'] for e in at('twitch')]; CNT = at('count')[0]['t']
def groove(t0, t1, vel=1.0, ticks=True, chords=True):
    t = t0
    while t < t1 - 1e-6:
        i = int(round(t / 0.25)); bar = int(t // 2) % 4; beat = int((t % 2) // 0.5)
        n(t, 'cellos_spic', CELLO[i % 8] if bar != 1 else ['Bb2', 'Bb2', 'F3', 'Bb2', 'D3', 'Bb2', 'F3', 'C3'][i % 8], 0.18, (0.55 if i % 2 == 0 else 0.4) * vel, -0.2)
        if i % 2 == 0: n(t, 'contrabass_pizz', BASS[bar][beat], 0.5, 0.72 * vel, 0.0)
        if ticks and i % 2 == 1: sc.append((t, 'hihat', None, None, 0.22 * vel, 0.35))
        if chords and i % 4 == 2:
            ch = {0: ['F4', 'A4', 'D5'], 1: ['F4', 'Bb4', 'D5'], 2: ['F4', 'A4', 'C5'], 3: ['E4', 'A4', 'C5']}[bar]
            for k, p in enumerate(ch): n(t + k * 0.012, 'violins_pizz', p, 0.3, 0.42 * vel, 0.25 - k * 0.15)
        t += 0.25
groove(1.0, 4.5, 0.75, ticks=False, chords=False)
groove(4.5, AL[0], 1.0)
for c in at('cut'):
    if 'item' in c: sc.append((c['t'], 'bass_drum', None, None, 0.5, 0.0)); sc.append((c['t'], 'woodblock', None, None, 0.35, -0.3))
# B. the power bank: suspense under the reading, release on the verdict
def suspense(t0, t1, root='D', vel=1.0):
    n(t0, 'timpani', 'D2' if root == 'D' else 'A1', 1.5, 0.75 * vel, 0)
    n(t0 + 0.05, 'violins_trem', 'A5', t1 - t0 - 0.05, 0.22 * vel, 0.3, attack=0.6, release=0.15)
    n(t0 + 0.05, 'violins_trem', 'Bb5', t1 - t0 - 0.05, 0.16 * vel, -0.3, attack=0.9, release=0.15)
    n(t0, 'cellos', 'D3', t1 - t0, 0.32 * vel, -0.1, attack=0.4, release=0.2)
    t = t0 + 0.5
    while t < t1 - 0.2: n(t, 'cellos_pizz', 'D2', 0.3, 0.45 * vel, 0); t += 0.5
ok = [e['t'] for e in at('ok')][0]
suspense(AL[0], ok)
for k, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5']): n(ok + k * 0.06, 'harp', p, 1.6, 0.6, -0.3 + k * 0.1, release=1.2)
for p, pan in (('D3', -0.2), ('A3', 0.1), ('F#4', 0.25), ('D5', -0.25)): n(ok, 'violas' if p == 'A3' else 'cellos' if p == 'D3' else 'violins', p, 1.3, 0.3, pan, attack=0.15, release=0.4)
# C. the water: light groove, suspense, the low no, the rescan clears
groove(WAT, AL[1], 0.8, ticks=True, chords=False)
no_ts = [e['t'] for e in at('no')]
suspense(AL[1], no_ts[0], vel=0.8)
n(no_ts[0], 'contrabass', 'D1', 0.9, 0.7, 0, release=0.3); n(no_ts[0], 'timpani', 'D2', 1.2, 0.8, 0)
for k, p in enumerate(['A4', 'D5', 'F5']): n(RS['t'] + RS['d'] + k * 0.08, 'harp', p, 0.8, 0.4, 0.2 - k * 0.15, release=0.6)
# D. 03:12: the belt slows; low pad and a lonely vibraphone, half the tempo
nd = GL[0] - NIGHT + 0.1; n(NIGHT, 'cellos', 'D2', nd, 0.25, -0.1, attack=0.6, release=0.6); n(NIGHT, 'violas', 'A2', nd, 0.18, 0.15, attack=0.9, release=0.6)
for k, (dt, p) in enumerate([(0.1, 'A4'), (1.1, 'F4'), (2.1, 'E4'), (2.6, 'D4')]): n(NIGHT + dt * (GL[0] - NIGHT) / 3.0, 'vibraphone', p, 1.2, 0.33, 0.2 - k * 0.1, release=1.0)
# E. CT: a funny plucked walk (pizzicato + staccato bassoon), stops dead before the leg moves
walk = ['D3', 'F3', 'A3', 'G#3', 'A3', 'C4', 'A3', 'F3', 'D3', 'F3', 'A3', 'G#3', 'A3', 'D4']
for k, p in enumerate(walk):
    t = GL[0] + 0.3 + k * 0.125
    if t > TW[0] - 0.2: break
    n(t, 'cellos_pizz', p, 0.2, 0.55, -0.15); n(t, 'bassoon_stac', p, 0.15, 0.32, 0.2)
tw = [e['t'] for e in at('twitch')]
for t in tw: n(t + 0.02, 'xylophone', 'G5', 0.4, 0.55, 0.3); n(t + 0.1, 'xylophone', 'D6', 0.4, 0.42, 0.35)
cnt = [e['t'] for e in at('count')][0]
for k, p in enumerate(['D5', 'E5', 'F5', 'G5', 'A5', 'C6']): n(cnt + k * 0.06, 'marimba', p, 0.4, 0.5, -0.3 + k * 0.12)
for k in range(int((NO[1] - CNT - 0.6) / 0.5)): n(CNT + 0.45 + k * 0.5, 'cellos_pizz', ['D2', 'A2'][k % 2], 0.3, 0.32, 0)   # waiting
n(no_ts[1], 'trombone_stac', 'A2', 0.3, 0.6, 0.1); n(no_ts[1] + 0.32, 'trombone', 'G#2', 0.7, 0.55, 0.1, release=0.3)   # wah-wah: not in the cabin
n(no_ts[1], 'tuba_stac', 'D2', 0.3, 0.45, -0.1)
# F. dawn: warm D major pad, harp arpeggios, glockenspiel on the breakfast
D0 = GL[1]; CH = (SUMC - D0) / 3
for (t0, d, ch) in [(D0, CH, ['D3', 'A3', 'F#4']), (D0 + CH, CH, ['G2', 'D3', 'B3']), (D0 + 2 * CH, CH, ['A2', 'E3', 'C#4'])]:
    for k, p in enumerate(ch): n(t0, ['cellos', 'violas', 'violins'][k], p, d + 0.3, 0.28 + 0.04 * k, -0.25 + 0.25 * k, attack=0.5, release=0.6)
    arp = [ch[0][:-1] + str(int(ch[0][-1]) + 1), ch[1][:-1] + str(int(ch[1][-1]) + 1), ch[2][:-1] + str(int(ch[2][-1]) + 1), ch[1][:-1] + str(int(ch[1][-1]) + 2)]
    for k in range(int(d / 0.25)): n(t0 + k * 0.25, 'harp', arp[k % 4], 0.6, 0.36, 0.3 - (k % 4) * 0.15, release=0.6)
tag = [e['t'] for e in at('tag')][0]
for k, p in enumerate(['F#6', 'A6', 'D7']): n(tag + k * 0.09, 'glockenspiel', p, 0.8, 0.35, 0.2)
lo = [e['t'] for e in at('lightsOff')][0]
for k, p in enumerate(['D6', 'C#6', 'B5', 'A5', 'F#5', 'E5', 'D5']): n(lo + k * 0.25, 'glockenspiel', p, 0.6, 0.18, 0.4 - k * 0.12)
# summary: a soft held chord under the rows
S0 = SUMC
for k, p in enumerate(['D3', 'A3', 'E4', 'F#4']): n(S0, ['cellos', 'violas', 'violins', 'violins'][k], p, 6.0, 0.22, -0.3 + 0.2 * k, attack=0.8, release=1.0)
# G. the belt stops; last chord under the end card
E0 = [e['t'] for e in at('end')][0]
for k, p in enumerate(['D3', 'A3', 'D4', 'E4', 'F#4', 'A4', 'D5']): n(E0 + k * 0.07, 'harp', p, 2.8, 0.42, -0.3 + k * 0.1, release=2.0)
n(E0, 'vibraphone', 'F#5', 2.8, 0.3, 0.2, release=2.0); n(E0 + 0.2, 'vibraphone', 'A5', 2.6, 0.24, -0.2, release=2.0)
n(E0, 'cellos', 'D2', 2.8, 0.2, 0, attack=0.6, release=1.2)

score = S.render(sc, dur=DUR + 3)[:N]
score = S.room(score, size=0.45, mix=0.18)

# ---------------------------------------------------------------- console tones and foley
fx = np.zeros((N, 2), np.float32)
def tone(f, d, v=1.0, harm=0.25):   # the console's tone: sine + a little 2nd harmonic, soft edges
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) + harm * np.sin(4 * np.pi * f * tt)
    e = np.minimum(1, tt / 0.006) * np.minimum(1, (d - tt) / 0.03); return (x * e * 0.5 * v).astype(np.float32)
def xray_buzz(d):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.12 + bp(noise(d), 2400, 7000) * 0.5 + np.sin(2 * np.pi * 240 * tt) * 0.15
    e = np.minimum(1, tt / 0.04) * np.minimum(1, (d - tt) / 0.08); return (lp(x, 7500) * e).astype(np.float32)
def motor(d, spd=None):
    tt = t_(d); s = np.ones_like(tt) if spd is None else spd
    f = 50 + 50 * s; ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * 2 * ph) * 0.4 + np.sin(2 * np.pi * 4 * ph) * 0.15 + lp(brown(d), 180) * 0.8
    return (x * s).astype(np.float32)
def digital(d=0.16):
    tt = t_(d); x = np.round(noise(d) * 3) / 3
    x = x * (np.sin(2 * np.pi * 60 * tt) > 0) + np.sign(np.sin(2 * np.pi * 900 * tt)) * 0.3
    return (hp(x, 300) * env_exp(d, 0.06)).astype(np.float32)
def servo(d, f0=180, f1=600):
    tt = t_(d); f = f0 + (f1 - f0) * (tt / d) ** 1.5
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bp(noise(d), 600, 2400) * 0.35
    return (x * np.sin(np.pi * tt / d) ** 1.5).astype(np.float32)

# room tone and the machine's hum for the whole shift (quieter at night, gone at power-down)
dn = DUR; tt = t_(dn)
pd = [e['t'] for e in at('powerDown')][0]
hum_env = np.clip(1 - (tt - pd) / 0.8, 0, 1) * np.where((tt > NIGHT) & (tt < GL[0]), 0.7, 1.0)
room = lp(brown(dn), 400) * 0.5 + bp(noise(dn), 150, 900) * 0.08
hum = (np.sin(2 * np.pi * 100 * tt) * 0.25 + np.sin(2 * np.pi * 200 * tt) * 0.08) * hum_env
add(fx, (room * 0.6).astype(np.float32), 0, 0.05); add(fx, hum.astype(np.float32), 0, 0.03)
# belt motor runs until the stop
bs = [e for e in at('beltStop') if e.get('last')][0]
mlen = bs['t'] + bs['d'] + 0.3; spd = np.clip(1 - (t_(mlen) - bs['t']) / bs['d'], 0, 1); spd[t_(mlen) < 0.3] *= (t_(mlen)[t_(mlen) < 0.3] / 0.3)
add(fx, motor(mlen, spd), 0, 0.07)
add(fx, thump(1.0, 52), bs['t'] + bs['d'], 0.35); add(fx, clack(0.7, 1.0), bs['t'] + bs['d'] + 0.02, 0.12)
# power-on
add(fx, thump(1.0, 60), 0.0, 0.3); add(fx, tone(880, 0.08), 0.05, 0.12, -0.2); add(fx, tone(1320, 0.08), 0.2, 0.12, -0.2)
for k in range(5): add(fx, click(1.4, 1.0), 0.02 + k * 0.1, 0.05, 0.3)
add(fx, tone(1760, 0.06), 0.45, 0.1, 0.4)
for e in evs:
    t, k = e['t'], e['type']
    if k == 'scan':
        d = e['d']; add(fx, xray_buzz(d + 0.1), t, 0.13, 0.25); add(fx, whoosh(min(0.35, d), 1.0), t, 0.12, 0.35); add(fx, tone(2093, 0.05), t, 0.06, 0.3)
    elif k == 'cut' and t < 10.6: add(fx, click(0.8, 1.0), t, 0.1)
    elif k == 'alarm':
        for i in range(2): add(fx, tone(1760, 0.11), t + i * 0.26, 0.26, 0.15); add(fx, tone(1320, 0.11), t + i * 0.26 + 0.12, 0.26, 0.15)
    elif k == 'mark':
        for i in range(4): add(fx, click(1.3, 1.0), t + i * 0.045, 0.07, 0.4)
    elif k == 'beltStop' and not e.get('last'): add(fx, thump(1.0, 60), t, 0.25); add(fx, clack(0.9, 1.0), t + 0.02, 0.07)
    elif k == 'zoom': add(fx, servo(e['d']), t, 0.1, 0.1)
    elif k == 'panel': add(fx, pop(1.0), t, 0.08, 0.3)
    elif k == 'photo': add(fx, click(0.6, 1.0), t, 0.14, 0.3); add(fx, click(1.1, 1.0), t + 0.05, 0.08, 0.3)
    elif k == 'type':
        for i in range(10): add(fx, click(1.6 + rng.random() * 0.3, 1.0), t + i * e['d'] / 10, 0.05, 0.3)
    elif k == 'gauge': add(fx, servo(0.35, 400, 900), t, 0.06, 0.3)
    elif k == 'land': add(fx, clack(1.2, 1.0), t, 0.12, 0.3)
    elif k == 'ok': add(fx, tone(1318, 0.5, 1.0, 0.1) * env_exp(0.5, 0.18).astype(np.float32), t, 0.32, 0.2); add(fx, ding(1.0), t, 0.1, 0.2)
    elif k == 'measure':
        for i in range(8): add(fx, click(1.9, 1.0), t + i * e['d'] / 8, 0.05, -0.2)
    elif k == 'no':
        d = 0.42; tt2 = t_(d); x = np.sign(np.sin(2 * np.pi * 220 * tt2)) * 0.5 + np.sin(2 * np.pi * 110 * tt2)
        add(fx, (lp(x, 1600) * np.minimum(1, (d - tt2) / 0.05) * 0.5).astype(np.float32), t, 0.28, 0.0)
    elif k == 'rescan': add(fx, xray_buzz(e['d']), t, 0.12, 0.25); add(fx, whoosh(0.5, 1.0), t, 0.14, -0.3)
    elif k == 'os':
        d = e['d'] + 0.2; nn = noise(d); sw = np.zeros_like(nn)
        for i in range(0, len(nn), 480):
            h2 = min(len(nn), i + 480); fc = 6000 * (1 - i / len(nn)) + 300
            sw[i:h2] = bp(nn[max(0, i - 2000):h2], fc * 0.7, min(fc * 1.3, 20000))[-(h2 - i):]
        add(fx, (norm(sw) * np.sin(np.pi * t_(d) / d) ** 2).astype(np.float32), t, 0.16, -0.2)
    elif k == 'key': add(fx, click(1.0, 1.0), t, 0.12, 0.1); add(fx, tone(2637, 0.05), t + 0.02, 0.07, 0.1)
    elif k == 'glitch': add(fx, digital(), t - 0.04, 0.14); add(fx, thump(1.0, 48), t, 0.25)
    elif k == 'gantry':
        d = e['d']; tt2 = t_(d); w = bp(noise(d), 300, 1100) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.6 * tt2)) + np.sin(2 * np.pi * 75 * tt2) * 0.25
        add(fx, (w * np.minimum(1, tt2 / 0.3) * np.minimum(1, (d - tt2) / 0.3)).astype(np.float32), t, 0.045)
    elif k == 'twitch': add(fx, clack(1.5, 1.0), t, 0.3, 0.3); add(fx, click(2.2, 1.0), t + 0.03, 0.18, 0.35)
    elif k == 'moved': add(fx, tone(1760, 0.07), t, 0.12, 0.3)
    elif k == 'count':
        for i in range(6): add(fx, pop(1.0), t + i * 0.06, 0.05, -0.3 + i * 0.12)
    elif k == 'tag': add(fx, pop(1.0), t, 0.1, 0.2)
    elif k == 'pull': add(fx, whoosh(e['d'] * 0.6, 1.0), t, 0.06, -0.1)
    elif k == 'lightsOff':
        for i in range(7): add(fx, click(0.5, 1.0), t + i * 0.25, 0.025, 0.5 - i * 0.12)
    elif k == 'beep': add(fx, tone([1318, 1480, 1661, 1760, 1976][e['i']], 0.09), t, 0.2, 0.15)
    elif k == 'powerDown':
        d = 0.9; tt2 = t_(d); f = 600 * (1 - tt2 / d) ** 2 + 40
        add(fx, (np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - tt2 / d) * 0.4).astype(np.float32), t, 0.16)
        add(fx, click(0.5, 1.0), t + 0.75, 0.1)

# ---------------------------------------------------------------- mix and master
def shelf_lo(x, f=70):   # trim the very low end (keep the weight at 60-120 Hz, not below)
    sos = butter(4, 48, 'high', fs=SR, output='sos'); return sosfilt(sos, x, axis=0)
# duck the music under the cues that carry information (alarm, verdicts, the leg, the summary beeps)
duck = np.ones(N, np.float32)
for e in evs:
    if e['type'] in ('alarm', 'ok', 'no', 'twitch', 'beep', 'mark', 'key'):
        a, b = int(e['t'] * SR), int((e['t'] + 0.45) * SR); r = int(0.05 * SR)
        seg_ = np.full(b - a, 0.6, np.float32); seg_[:r] = np.linspace(1, 0.6, r); seg_[-r:] = np.linspace(0.6, 1, r)
        duck[a:b] = np.minimum(duck[a:b], seg_[:len(duck[a:b])])
score = score * duck[:, None]

# ---------------------------------------------------------------- the operator's voice
# one clip per sentence; compressed, then set by RMS about 10 dB over the music while she speaks;
# the music ducks under her and gives up 300 Hz-4 kHz (a band cut that follows the voice envelope)
vox = np.zeros(N, np.float32); spk = np.zeros(N, np.float32)
for e in at('vo'):
    x, sr0 = sf.read(os.path.join(HERE, 'out', 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr0, SR).astype(np.float32)
    x = hp(x, 90).astype(np.float32); x = compress(x / (np.abs(x).max() + 1e-9) * 0.9, thr=0.22, ratio=3.2, att=0.003, rel=0.09)
    a = int(round(e['t'] * SR)); b = min(N, a + len(x)); vox[a:b] += x[:b - a]; spk[a:b] = 1
from scipy.ndimage import maximum_filter1d, uniform_filter1d
venv = uniform_filter1d(maximum_filter1d(spk, size=int(0.5 * SR)), size=int(0.12 * SR)).astype(np.float32)   # opens a little before, closes after
mus = score * 0.5
mus = mus - (0.6 * venv)[:, None] * bp(mus, 300, 4000, 2).astype(np.float32)   # band cut while she speaks
mus = mus * (1 - 0.4 * venv)[:, None]
def rms(x): return float(np.sqrt(np.mean(np.square(x)) + 1e-12))
on = spk > 0
fx = fx * (1 - 0.3 * venv)[:, None]   # the machine beds step back a little too (tones still read)
# at least 10 dB over the music and 7 dB over music + foley, whichever is louder
g_v = max(rms(mus[on]) * 10 ** (10 / 20), rms((mus + fx)[on]) * 10 ** (7 / 20)) / rms(vox[on])
vox = vox * g_v
mix = mus + fx * 1.0 + np.stack([vox, vox], 1)
print(f'voice vs music while speaking: {20 * np.log10(rms(vox[on]) / rms(mus[on])):+.1f} dB;  vs music+foley: {20 * np.log10(rms(vox[on]) / rms((mus + fx)[on])):+.1f} dB')
mix = shelf_lo(mix).astype(np.float32)
mix[:int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))[:, None]
fade = np.clip((DUR - t_(DUR)) / 1.2, 0, 1) ** 1.3
mix *= fade[:N, None]

def lufs(x):   # ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms blocks, gated)
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    l = -0.691 + 10 * np.log10(z + 1e-12); z = z[l > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]; return -0.691 + 10 * np.log10(z.mean())
def true_peak(x): up = soxr.resample(x, SR, SR * 4); return 20 * np.log10(np.abs(up).max())
target = -16.0; ceil = 10 ** (-3.8 / 20); src = mix.copy()
for _ in range(8):   # loudness to target, then a peak limiter whose ceiling is lowered until the 4x-oversampled true peak sits under -3 dBTP
    m = src * 10 ** ((target - lufs(src)) / 20)
    mix = np.stack([limit(m[:, 0], ceil), limit(m[:, 1], ceil)], 1).astype(np.float32)
    TP = true_peak(mix)
    if TP <= -3.05: break
    ceil *= 10 ** ((-3.15 - TP) / 20)
L, TP = lufs(mix), true_peak(mix)
mix = mix[:N].astype(np.float32); assert mix.shape == (N, 2)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='PCM_24')
# low-end share: energy below 60 Hz relative to the full band
lo = sosfilt(butter(4, 60, 'low', fs=SR, output='sos'), mix, axis=0)
print(f'mix.wav {mix.shape} {mix.shape[0] / SR:.3f} s  integrated {L:.1f} LUFS  true peak {TP:.1f} dBTP  <60 Hz {10 * np.log10((lo ** 2).mean() / (mix ** 2).mean()):.1f} dB')
used = sorted(set(e['inst'] if isinstance(e, dict) else e[1] for e in sc))
print('\n'.join(S.credits(used))); print('instruments:', ', '.join(used))
