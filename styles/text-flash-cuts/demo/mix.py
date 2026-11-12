""""Behind You" soundtrack: gothic suspense score (real instrument samples, CC0) + procedural sfx. Reads events.json (section starts in sec + action events), writes out/mix.wav.
150 BPM (one beat 0.4 s, one bar 1.6 s), D minor. Instruments: harpsichord, double bass/cello pizzicato, tremolo violin, bowed vibraphone, glockenspiel,
wood block (clock), timpani, bass drum, snare, trombone/tuba/horn, tubular bells, gong, suspended cymbal. No piano, no wall of sustained strings."""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.abspath(os.path.join(HERE, '..', '..', '..')))
sys.path.insert(0, LIB); sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from core.audio import sampler as Sm
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; N = int((DUR + .1) * SR)
SEC = {e['name']: e['t'] for e in E['ev'] if e['type'] == 'sec'}
EV = [e for e in E['ev'] if e['type'] != 'sec']
BEAT, BAR = .4, 1.6
Sm.seed(7)
M = []                                                        # score events (t, inst, pitch, dur, vel, pan, gain)
def n(t, inst, p, d, v, pan=0., gain=1.): M.append((round(t, 4), inst, p, d, v, pan, gain))

# ───────── Score ─────────
CH = {0: ('D4', 'A4', 'F4', 'D2'), 1: ('D4', 'Bb4', 'F4', 'Bb1'), 2: ('D4', 'Bb4', 'G4', 'G1'), 3: ('C#4', 'A4', 'E4', 'A1')}
def chord_at(t): return CH[int(t / BAR + 1e-6) % 4]
def ostinato(t0, t1, step=BEAT / 4, vel=.55, oct_up=False, pan=-.25):
    """harpsichord 16th-note arpeggio: root-5th-3rd-5th-octave root-5th-3rd-5th, chord changes every bar (i–VI–iv–V)"""
    k = 0; t = t0
    while t < t1 - 1e-6:
        a, b, c, _ = chord_at(t)
        hi = {'D4': 'D5', 'C#4': 'C#5'}[a]
        seq = [a, b, c, b, hi, b, c, b]
        p = seq[k % 8]
        if oct_up: p = p[:-1] + str(int(p[-1]) + 1)
        n(t, 'harpsichord', p, step * .9, vel * (1 if k % 4 == 0 else .82), pan)
        k += 1; t += step
def bassline(t0, t1, every=2, vel=.7):
    t = t0
    while t < t1 - 1e-6:
        root = chord_at(t)[3]
        n(t, 'contrabass_pizz', root, .6, vel, .1)
        t += BEAT * every

c, c1, c2, c3, c4 = SEC['cold'], SEC['ch1'], SEC['ch2'], SEC['ch3'], SEC['ch4']
sil, snap, slate, end = SEC['silence'], SEC['snap'], SEC['slate'], SEC['end']

# cold open: low string drone + single harpsichord notes
n(.05, 'contrabass', 'D2', 4.6, .45, 0, .8); n(.05, 'cellos', 'D3', 4.4, .3, .2, .5)
n(.7, 'cellos', 'Eb3', 2.4, .22, -.2, .45)
for i, p in enumerate(['A5', 'D5']): n(3.2 + i * .4, 'harpsichord', p, .4, .6, .3)
for k in range(6): n(.8 + k * BEAT, 'woodblock', 'a' if k % 2 else 'b', None, .3 if k % 2 else .42, .35, .6)   # clock motif: first heard in the cold open
# Episode 1: harpsichord ostinato + plucked bass + wood-block clock
n(c1, 'tubular_bells', 'D4', 3, .7, 0, .9)
ostinato(c1 + .6, c2 - .2, vel=.5)
bassline(c1 + .6, c2 - .2)
for k in range(int((c2 - c1 - .6) / BEAT)): n(c1 + .6 + k * BEAT, 'woodblock', 'a' if k % 2 else 'b', None, .35 if k % 2 else .5, .35, .7)
for i, p in enumerate(['F5', 'E5', 'D5', 'A4']): n(7.0 + i * .8, 'violins_pizz', p, .5, .55, .4, .9)
# Episode 2: rain. The ostinato drops out, leaving only very soft tremolo strings + bowed vibraphone; one step from her each beat (low timpani, louder and louder)
n(c2 + .6, 'vibraphone_bowed', 'D5', 2.4, .5, .3, .9)
n(c2 + .2, 'violins_trem', 'D5', 5.4, .22, -.3, .5); n(c2 + 1.4, 'violins_trem', 'Eb5', 4.2, .2, .3, .45)
n(c2 + .2, 'contrabass', 'D2', 5.4, .35, 0, .6)
T_UMB = [e['t'] for e in EV if e['type'] == 'umbrella'][0]
n(T_UMB, 'vibraphone_bowed', 'A4', 1.4, .5, -.2, .8); n(T_UMB, 'contrabass', 'Eb2', 1.6, .4, 0, .6)
# Episode 3: glockenspiel lullaby (her theme) + 8th-note harpsichord
lull = [('A5', 0), ('D6', .4), ('F6', .8), ('E6', 1.2), ('D6', 1.6), ('A5', 2.0)]
for p, dt in lull: n(c3 + .6 + dt, 'glockenspiel', p, 1.0, .5, .2)
ostinato(c3 + .6, c4 - .4, step=BEAT / 2, vel=.45, pan=-.3)
bassline(c3 + .6, c4 - .4, every=2, vel=.6)
for i in range(9): n(23.0 + i * .1, 'glockenspiel', ['D6', 'F6', 'A6', 'D7', 'C#7', 'A6', 'F6', 'E6', 'D6'][i], .6, .45, -.4 + i * .1, .8)
for p in ['D2', 'A2']: n(24.5, 'trombone_stac', p, .4, .8, 0, .9)
n(24.5, 'tuba_stac', 'D2', .4, .8)
# Episode 4: 16th-note harpsichord at full speed + timpani rising each beat + staccato brass on the counts + accelerating snare
ostinato(c4 + .6, sil - .05, vel=.58)
bassline(c4 + .6, sil - .05, every=1, vel=.6)
for k, p in enumerate(['F2', 'G2', 'A2', 'Bb2', 'C3', 'D3', 'E3']): n(27.8 + k * BEAT, 'timpani', p, .5, .55 + k * .05, 0, 1.0)
for t0, ps in [(30.6, ['D2', 'A2', 'D3', 'F3']), (31.1, ['Eb2', 'Bb2', 'Eb3', 'G3']), (31.433, ['E2', 'B2', 'E3', 'G#3'])]:
    for p in ps: n(t0, 'trombone_stac' if Sm.midi(p) < 53 else 'horn_stac', p, .3, .85, 0, .8)
tt = 30.6; dt = .1
while tt < 32.2: n(tt, 'snare2', 'on', None, min(.9, .3 + (tt - 30.6) * .4), -.1, .7); dt = max(.033, dt * .93); tt += dt
n(32.2, 'trombone', 'D2', 2.5, .55, 0, .8); n(32.2, 'tuba', 'D1', 2.5, .5, 0, .8); n(32.2, 'horn', 'A2', 2.5, .4, .2, .6)
n(sil, 'timpani', 'D3', 1.0, .95); n(sil, 'gran_cassa', 'hit', None, .9)
# the head turn: two bell strokes (in the sfx) → gong + low brass Dm(♭9) + low strings
t = snap + .13
n(t, 'gong', None, None, .85, 0, 1.0); n(t, 'gran_cassa', 'hit', None, 1.0)
for p, inst in [('D2', 'trombone'), ('A2', 'trombone'), ('D1', 'tuba'), ('F3', 'horn'), ('Eb4', 'horn')]: n(t, inst, p, 2.2, .75, 0, .75)
n(t, 'contrabass', 'D2', 2.8, .5, 0, .7); n(t, 'cellos', 'D3', 2.6, .45, .2, .6)
n(t + .2, 'sus_cymbal', 'roll', None, .4, .3, .5)
# eye, mouth corner: fragments of the glockenspiel lullaby
n(39.2, 'glockenspiel', 'D6', 1.2, .5, .2); n(40.0, 'glockenspiel', 'A5', .8, .45, -.2); n(40.4, 'glockenspiel', 'F6', .8, .4, .2)
# end card: tubular bells + timpani + four glockenspiel notes
n(slate, 'tubular_bells', 'D4', 4, .75); n(slate, 'timpani', 'D3', 1.5, .7); n(slate, 'gong', None, None, .45, 0, .6)
n(slate, 'contrabass', 'D2', 4.6, .4, 0, .6)
for i, p in enumerate(['D6', 'F6', 'A6', 'D7']): n(slate + .8 + i * .4, 'glockenspiel', p, 1.5, .4, -.3 + i * .2, .8)
mus = Sm.render(M, dur=DUR + .1, master=False)[:N]
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))

# ───────── Sfx ─────────
dry = np.zeros((N, 2)); wet = np.zeros((N, 2)); amb = np.zeros((N, 2))
def hit(p=1.):
    d = .5; tt = t_(d)
    tr = hp(noise(d), 3000) * env_exp(d, .004)
    ring = sum(a * np.sin(2 * np.pi * f * p * tt) * env_exp(d, tau) for f, a, tau in [(1760, .5, .08), (2637, .35, .05), (4186, .2, .03)])
    sub = np.sin(2 * np.pi * 52 * tt * (1 - .4 * tt)) * env_exp(d, .09)
    return norm(tr * 1.0 + ring + sub * 1.2)
def tick(v=1.): return sfx.click(1.6, v)
def blip(): d = .07; tt = t_(d); return norm(np.sin(2 * np.pi * 3200 * tt) * env_exp(d, .015))
def swell(d=.35): x = hp(noise(d), 800) * np.linspace(0, 1, int(round(d * SR))) ** 3; return norm(x)
def snapfx():
    a = sfx.clack(.55, 1); b = np.pad(sfx.click(.8, .8), (int(.012 * SR), 0)); m = max(len(a), len(b))
    a = np.pad(a, (0, m - len(a))); b = np.pad(b, (0, m - len(b))); d = m / SR
    return norm(a + b + hp(noise(d), 1500)[:m] * env_exp(d, .003)[:m])
def sting(big=False):
    d = .9; tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * tt + i) for i, f in enumerate([2093, 2217, 2349, 2489])) * env_exp(d, .25) * .4
    x += bp(noise(d), 3000, 7000) * env_exp(d, .05)
    return norm(x)
def paper(): d = .25; return norm(bp(noise(d), 2000, 7000) * (np.abs(np.sin(np.pi * t_(d) / d)) ** 2) * (1 + .6 * np.sin(2 * np.pi * 37 * t_(d))))
def locker():
    d = .45; tt = t_(d)
    x = sfx.clack(.45, 1); x = np.pad(x, (0, int(d * SR) - len(x)))
    ring = sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(410, .5, .12), (1130, .35, .08), (2380, .2, .05)])
    return norm(x + ring + sfx.thump(1, 90)[:len(tt)] * .6 if len(sfx.thump(1, 90)) >= len(tt) else x + ring)
def buzz(d=.6):
    tt = t_(d); car = np.sign(np.sin(2 * np.pi * 155 * tt)) * .6 + np.sin(2 * np.pi * 310 * tt) * .3
    gate = ((tt % .3) < .22).astype(float)
    return norm(lp(car, 1800) * gate)
def wetstep(v=1.):
    d = .3; tt = t_(d)
    return norm(np.sin(2 * np.pi * 60 * tt) * env_exp(d, .05) + bp(noise(d), 600, 3000) * env_exp(d, .03) * .5 + hp(noise(d), 4000) * env_exp(d, .015) * .3) * v
def rail(): return norm(sfx.thump(1, 95) * .8 + np.pad(sfx.click(.7, .6), (0, len(sfx.thump(1, 95)) - len(sfx.click(.7, .6)))))
def tickclock(): return Sm.hit('woodblock', 'b', .8)

for e in EV:
    t, k = e['t'], e['type']
    if k == 'hit': x = hit(e.get('p', 1)); add(dry, x, t, .55); add(wet, x, t, .3)
    elif k == 'boom': add(dry, sfx.thump(1, 38), t, .9); x = hit(.75); add(dry, x, t, .5); add(wet, x, t, .9)
    elif k == 'rush': add(dry, sfx.whoosh(.4, 1), t, .45)
    elif k == 'cut': add(dry, tick(.8), t, .3)
    elif k == 'suck': add(dry, swell(.33), t, .4)
    elif k == 'tick': x = tickclock(); add(dry, x, t, .9, .3); add(wet, x, t, .9)
    elif k == 'chapter': x = hit(e.get('p', 1) * .8); add(dry, x, t, .55); add(wet, x, t, .5); add(dry, sfx.thump(1, 48), t, .6)
    elif k == 'locker': add(dry, locker(), t, .6, .3); add(wet, locker(), t, .3)
    elif k == 'sting':
        x = sting(); add(dry, x, t, .35 if not e.get('big') else .5); add(wet, x, t, .5)
        if e.get('big'): add(dry, sfx.thump(1, 42), t, .9); add(dry, Sm.hit('sus_cymbal', 'scrape', .7), t, .35)
    elif k == 'paper': add(dry, paper(), t, .35, -.2)
    elif k == 'blip': add(dry, blip(), t, .25, .3)
    elif k == 'rail': add(dry, rail(), t, .45)
    elif k == 'buzz':
        add(dry, buzz(.6), t, .14, .2)
    elif k == 'step': kk = e['k']; x = wetstep(); add(dry, x, t, .18 + kk * .07, .1); add(wet, x, t, .3)
    elif k == 'umbrella': add(dry, sfx.whoosh(.8, 1), t, .2, -.3)
    elif k == 'pane': pass                                   # glockenspiel is in the score
    elif k == 'clack': x = snapfx(); add(dry, x, t, .6); add(wet, x, t, .4)
    elif k == 'climb': add(dry, sfx.step(1), t, .25, .1)
    elif k == 'pre': add(dry, swell(.12), t - .05, .35)
    elif k == 'snap': x = snapfx(); add(dry, x, t, .9); add(wet, x, t, .8); add(dry, sfx.thump(1, 40), t, .8)
    elif k == 'heart': add(dry, sfx.heartbeat(1), t, .42)
    elif k == 'slate': add(dry, sfx.thump(1, 38), t, .8)
    elif k == 'rainin': pass

# ambience: low hum (whole film) + rain (Episode 2)
tt = t_(DUR + .1)[:N]
drone = (np.sin(2 * np.pi * 55 * tt) * .5 + np.sin(2 * np.pi * 82.4 * tt) * .2 + lp(noise(DUR + .1)[:N], 160) * .5)
drone *= (.22 + .12 * np.sin(2 * np.pi * .6 * tt) ** 2)
amb[:, 0] += drone * .16; amb[:, 1] += drone * .16
r0, r1 = c2 - .2, c3
rain = np.zeros(N); i0, i1 = int(r0 * SR), int(r1 * SR)
rn = bp(noise(r1 - r0), 900, 9000) * .5 + lp(noise(r1 - r0), 500) * .5
rn = rn[:i1 - i0] * np.minimum(1, np.arange(i1 - i0) / (.25 * SR)) * np.minimum(1, (i1 - i0 - np.arange(i1 - i0)) / (.3 * SR))
rain[i0:i0 + len(rn)] = rn
amb[:, 0] += rain * .22; amb[:, 1] += np.roll(rain, 400) * .22

# reverb (2.2 s exponentially decaying noise IR)
ir_d = 2.2; ir = lp(noise(ir_d) * env_exp(ir_d, .45), 5000); ir /= np.sqrt((ir ** 2).sum())
for ch in range(2): wet[:, ch] = fftconvolve(wet[:, ch], ir)[:N]
mus_wet = np.stack([fftconvolve(mus[:, ch], ir * .5)[:N] for ch in range(2)], 1)

# silence: from the gap event, 0.2 s (before the hand on the shoulder), everything cut; before the head turn (silence section +0.25 s up to the head turn) only the clock remains (sfx)
def mask(a, b, fade=.04):
    m = np.ones(N); x = np.arange(N) / SR
    m = np.minimum(m, np.clip((a - x) / fade, 0, 1) + np.clip((x - b) / fade, 0, 1))
    return m
GAP = [e['t'] for e in EV if e['type'] == 'gap'][0]
g1 = mask(GAP, GAP + .2, .02); g2 = mask(sil + .25, snap - .03, .12)
music = (mus * .62 + mus_wet * .16) * (g1 * g2)[:, None]
fx = (dry + wet * .32) * g1[:, None]
ambient = amb * (g1 * g2)[:, None]
mix = music + fx + ambient
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], .5)
mix = mix / np.abs(mix).max() * .9
for ch in range(2): mix[:, ch] = sfx.limit(mix[:, ch], .5, .003)   # second stage: another 5 dB off the transients, so the true peak stays ≤ −1.2 dB after loudnorm
mix = mix / np.abs(mix).max() * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix ok', mix.shape, 'instruments:', sorted({m[1] for m in M}))
