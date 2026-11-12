# Score + machine sounds → mix.wav (48 kHz stereo, exactly DUR seconds). No voice.
# Run from the library root:
#   node core/render/events.mjs styles/pen-plotter/demo && .venv/bin/python styles/pen-plotter/demo/audio.py [--stems]
# events.json comes from the page (window.EV): per frame pen speed / pen down / holder height / pen held, plus grips, pen taps,
# camps, jumps (each jump on a beat), cuts, the ring and the number. 120 BPM; every pen has its own instrument:
# brown = marimba, grey = vibraphone and strings, red = glockenspiel and harp, black = pizzicato strings.
import sys, os, json
sys.path.insert(0, '.')
import numpy as np, soundfile as sf
from core.audio import sampler as Smp
from core.audio.sfx import SR, add, limit, click, clack, thump, whoosh, noise, bp, hp, lp

HERE = os.path.dirname(os.path.abspath(__file__))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(EVJ['dur']); EV = EVJ['ev']; NS = int(round(DUR * SR))
Smp.seed(11); rng = np.random.default_rng(5)
B = .5   # beat (120 BPM)
first = lambda typ, **kw: next(e['t'] for e in EV if e['type'] == typ and all(e.get(k) == v for k, v in kw.items()))
CUTS = {e['shot']: e['t'] for e in EV if e['type'] == 'cut'}
T_S2, T_S3, T_INS, T_S4, T_S5, T_S6, T_S7, T_END = CUTS[2], CUTS[3], CUTS[40], CUTS[4], CUTS[5], CUTS[6], CUTS[7], CUTS[8]
T_RING, T_RINGDONE, T_NUM, T_PARK = first('ring'), first('ringDone'), first('numberDone'), first('parked')

music = []
def n(t, inst, p, d, v, pan=0, g=1.0, **kw): music.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g, **kw))

# ---- 1  the rack (0–4): a low held D, a bowed shimmer; the pen lands on a single piano note
n(0.0, 'contrabass', 'D2', 4.2, .32, 0, .55, attack=.6)
n(0.0, 'vibraphone_bowed', 'A4', 3.0, .35, .3, .45)
n(1.0, 'vibraphone_bowed', 'D5', 3.0, .3, -.3, .4)
t_land = next(e['t'] for e in EV if e['type'] == 'tap')
n(t_land, 'piano', 'D5', 2.0, .42, .1, .6); n(t_land, 'piano', 'A4', 2.0, .3, -.1, .45)
n(3.0, 'marimba', 'D4', .3, .3, -.2, .55); n(3.5, 'marimba', 'A4', .3, .32, -.2, .55)

# ---- 2  contours (brown pen = marimba): eighths, pizzicato bass, D – Bm – G – A, a climbing figure on top
H2 = [(T_S2, 'D2', ['D4', 'F#4', 'A4']), (T_S2 + 2, 'B1', ['D4', 'F#4', 'B4']), (T_S2 + 4, 'G1', ['D4', 'G4', 'B4']), (T_S2 + 6, 'A1', ['C#4', 'E4', 'A4'])]
top = ['A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5', 'D6']
for bi, (t0, bass, ch) in enumerate(H2):
    span = 2.0 if bi < 3 else T_S3 - t0
    for k in range(int(round(span / (B / 2)))):
        t = t0 + k * B / 2
        n(t, 'marimba', ch[k % 3] if k % 2 else ch[0], .25, .36 + .1 * (k % 4 == 0), -.25, .7)
    for k in range(int(round(span / B))):
        n(t0 + k * B, 'contrabass_pizz', bass if k % 2 == 0 else bass[:-1] + str(int(bass[-1]) + 1), .45, .6, 0, .75)
    n(t0, 'cellos', bass[:-1] + str(int(bass[-1]) + 1), span, .3, .1, .45, attack=.3)
    for k, p in enumerate(top[bi * 2:bi * 2 + 2] + top[bi * 2 + 1:bi * 2 + 3]):   # climbing figure, one note per beat on the off-beats
        n(t0 + B / 2 + k * B, 'marimba', p, .4, .42, .25, .65)
for e in EV:
    if e['type'] == 'jump' and T_S2 < e['t'] < T_S3: n(e['t'], 'woodblock', None, None, .22, .35, .35)

# ---- 3  the relief stands up (grey pen = vibraphone + strings): a swell under the lift, a harp falling as it lies down
L_UP = first('liftUp'); L_DN = first('liftDown')
for p, pan in [('G2', 0), ('D3', -.2), ('B3', .2), ('F#4', -.3), ('A4', .3)]:
    n(T_S3, 'violas' if p[-1] in '34' else 'cellos', p, L_DN - T_S3 + .8, .5, pan, .6, attack=1.2)
n(T_S3, 'violins', 'D5', L_DN - T_S3 + .6, .42, .35, .45, attack=1.6); n(L_UP + .9, 'violins', 'E5', L_DN - L_UP, .4, -.35, .4, attack=.8)
n(L_UP, 'sus_cymbal', 'roll', None, .3, .2, .4)
n(T_S3, 'contrabass', 'G1', L_DN - T_S3 + 1.0, .4, 0, .55, attack=.8)
for k, p in enumerate(['D6', 'B5', 'A5', 'F#5', 'E5', 'D5', 'B4', 'A4']): n(L_DN + k * .07, 'harp', p, 1.0, .4, -.2 + k * .05, .55)
for k in range(int((T_INS - (L_DN + .5)) / (B / 2))):
    t = L_DN + .5 + k * B / 2; ch = ['E4', 'G4', 'B4', 'D5'] if t < 15.5 else ['C4', 'E4', 'G4', 'B4'] if t < 16.5 else ['D4', 'F#4', 'A4', 'C#5']
    n(t, 'vibraphone_hard', ch[k % 4], .35, .3 + .08 * (k % 4 == 0), .3, .55)
for t0, b in [(L_DN + .5, 'E2'), (15.5, 'C2'), (16.5, 'D2')]: n(t0, 'contrabass_pizz', b, .5, .55, 0, .7); n(t0, 'cellos', b[:-1] + '3', 1.0, .3, -.1, .4, attack=.2)
for e in EV:
    if e['type'] == 'jump' and T_S3 < e['t'] < T_INS: n(e['t'], 'woodblock', None, None, .18, .35, .3)

# ---- 4  the route (red pen = glockenspiel + harp): one bell per camp, climbing; a chord at the summit
n(T_INS, 'harp', 'D3', 1.0, .4, -.2, .5); n(T_INS + .25, 'harp', 'A3', 1.0, .35, 0, .5); n(T_INS + .5, 'harp', 'D4', 1.0, .35, .2, .5)
CAMPBELL = {'base': 'D5', 'mid': 'E5', 'abc': 'F#5', 'c1': 'A5', 'c2': 'B5', 'c3': 'D6'}
for e in EV:
    if e['type'] == 'camp':
        p = CAMPBELL[e['id']]; prof = e['seg'] == 'profile'
        n(e['t'], 'glockenspiel', p, 1.2, .5 if not prof else .4, .25, .62)
        n(e['t'], 'harp', p[:-1] + str(int(p[-1]) - 1), 1.0, .4, -.2, .5)
t_sum = first('summit', seg='route'); t_psum = first('summit', seg='profile')
for p, pan in [('D4', -.3), ('F#4', 0), ('A4', .3), ('D5', .1)]: n(t_sum, 'harp', p, 1.6, .45, pan, .55)
n(t_sum, 'glockenspiel', 'F#6', 1.6, .4, .3, .5)
for k in range(int((T_S5 - T_S4) / B)):   # a walking pizzicato line under the climb
    t = T_S4 + k * B; n(t, 'contrabass_pizz', ['D2', 'E2', 'F#2', 'A2', 'B2', 'A2', 'G2', 'F#2', 'E2', 'D2', 'E2', 'F#2', 'A2'][k % 13], .45, .55, 0, .7)
for k in range(int((T_S5 - T_S4) / B)): n(T_S4 + k * B + B / 2, 'harp', ['A3', 'B3', 'D4', 'E4'][k % 4], .5, .3, -.3, .45)

# ---- 5  the profile (still red): rhythm thickens: spiccato cellos in eighths, harp sixteenths near the top
H5 = [(T_S5, 'D2', ['D3', 'A3']), (T_S5 + 2, 'A1', ['C#3', 'A3']), (T_S5 + 4, 'B1', ['D3', 'B3']), (T_S5 + 6, 'G1', ['D3', 'B3'])]
for t0, bass, cel in H5:
    span = min(2.0, T_S6 - t0)
    if span <= .05: continue
    for k in range(int(round(span / (B / 2)))):
        for p in cel: n(t0 + k * B / 2, 'cellos_spic', p, .2, .45 + .12 * (k % 4 == 0), .15, .6)
    n(t0, 'contrabass_pizz', bass, .6, .7, 0, .75); n(t0, 'contrabass', bass, span, .3, 0, .45, attack=.2)
for k in range(int((T_S6 - (T_S5 + 2.5)) / (B / 4))):
    t = T_S5 + 2.5 + k * B / 4; n(t, 'harp', ['D5', 'B4', 'G4', 'B4'][k % 4], .2, .26 + .05 * (k % 4 == 0), -.35, .42)
for p in ['D5', 'A5']: n(t_psum, 'glockenspiel', p, 1.4, .4, .3, .5)

# ---- 6  the three heights (black pen = pizzicato), then silence; the ring lands on one chord
for k in range(int(round((33.0 - T_S6) / (B / 2)))):
    t = T_S6 + k * B / 2; n(t, 'violins_pizz', ['D5', 'A4', 'F#4', 'A4'][k % 4], .2, .35, .25, .5); n(t, 'cellos_pizz', 'D3' if k % 4 < 2 else 'A2', .2, .35, -.2, .45)
n(T_S6, 'contrabass', 'D2', 2.0, .3, 0, .45, attack=.1)
n(33.0, 'vibraphone_bowed', 'A5', 2.6, .22, .2, .3)          # the held breath: one faint bowed note, nothing else
for p, pan in [('D3', -.25), ('A3', .25)]: n(T_RING, 'cellos', p, 3.0, .5, pan, .7, attack=.25)
for p, pan in [('F#4', -.3), ('A4', 0), ('E5', .3)]: n(T_RING, 'violins', p, 2.8, .45, pan, .6, attack=.35)
n(T_RINGDONE, 'vibraphone_hard', 'D5', 2.0, .55, .2, .7); n(T_RINGDONE + .12, 'vibraphone_hard', 'A5', 1.8, .45, -.2, .6)
n(T_RINGDONE, 'timpani', 'D3', 1.5, .45, 0, .6); n(T_RINGDONE, 'contrabass', 'D2', 1.0, .4, 0, .5)

# ---- 7  the number: the climbing figure returns on violins and horn, a resolve as the last stroke ends
theme = [('A4', 0), ('D5', .5), ('E5', 1.0), ('F#5', 1.5), ('A5', 2.0), ('B5', 2.5), ('A5', 2.75)]
for p, dt in theme: n(T_S7 + dt, 'violins', p, .55, .55, .2, .7, attack=.06)
for p, dt in theme[:5]: n(T_S7 + dt, 'horn', p[:-1] + str(int(p[-1]) - 1), .55, .35, -.2, .4)
for k in range(int((T_NUM - T_S7) / B)): n(T_S7 + k * B, 'contrabass_pizz', ['D2', 'D2', 'B1', 'B1', 'G1', 'G1'][k % 6], .45, .6, 0, .7); n(T_S7 + k * B, 'marimba', ['D5', 'F#5', 'A5', 'B5'][k % 4], .3, .35, -.3, .5)
for k in range(8): n(T_NUM - .9 + k * .11, 'timpani', 'A2' if k % 2 else 'D3', .2, .22 + .04 * k, 0, .5)
for p, pan in [('D3', -.2), ('A3', .2)]: n(T_NUM, 'cellos', p, 4.0, .55, pan, .75, attack=.05)
for p, pan in [('F#4', -.3), ('A4', .1), ('D5', .35)]: n(T_NUM, 'violins', p, 3.8, .5, pan, .65, attack=.08)
n(T_NUM, 'timpani', 'D3', 2.5, .7, 0, .8); n(T_NUM, 'gran_cassa', 'hit', None, .4, 0, .5); n(T_NUM, 'contrabass', 'D2', 3.8, .45, 0, .6)
n(T_NUM, 'glockenspiel', 'D6', 2.0, .45, .3, .55); n(T_NUM + .25, 'glockenspiel', 'A6', 1.8, .35, -.2, .45)
n(T_PARK, 'vibraphone_hard', 'F#5', 2.5, .35, .2, .5)
# ---- end card: one last chord and the climbing figure once, softly
for p, pan in [('D4', -.2), ('A4', .2), ('E5', .3)]: n(T_END, 'piano', p, 3.5, .4, pan, .55)
for k, p in enumerate(['A4', 'D5', 'E5', 'F#5', 'A5']): n(T_END + .3 + k * .25, 'glockenspiel', p, 1.5, .28, .25, .4)
n(T_END, 'cellos', 'D3', 3.6, .35, 0, .5, attack=.3); n(T_END, 'contrabass', 'D2', 3.6, .3, 0, .45, attack=.3)

mus = Smp.render(music, dur=DUR + 3)
mus = Smp.room(mus, size=.42, mix=.17)[:NS]
mus = np.stack([hp(mus[:, c], 45) for c in (0, 1)], 1)
fade = np.ones(NS); nf = int(.6 * SR); fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
mus *= fade[:, None]

# ---------------- the machine
fx = np.zeros((NS, 2), np.float32)
F = [e for e in EV if e['type'] == 'f']
ft = np.array([0.0] + [e['t'] for e in F]); fv = np.array([0.0] + [e['v'] for e in F]); fd = np.array([0.0] + [e['d'] for e in F])
fz = np.array([F[0]['z']] + [e['z'] for e in F]); fsh = np.array([1] + [e['shot'] for e in F]); fend = np.array([0] + [e['end'] for e in F])
tt = np.arange(NS) / SR
idx = np.clip(np.searchsorted(ft, tt, side='right') - 1, 0, len(ft) - 1)
v = np.interp(tt, ft, fv); d = np.interp(tt, ft, fd); shot = fsh[idx]; endc = fend[idx] > 0
vs = np.convolve(v, np.ones(480) / 480, 'same'); vc = np.minimum(vs, 400)
# distance of the microphone: close shots louder, wide/overhead softer, end card silent
near = np.select([shot == 1, shot == 2, shot == 3, shot == 40, shot == 4, shot == 5, shot == 6, shot == 7], [1.0, .55, .7, 1.0, .85, .75, .8, .8], .0)
near = np.convolve(near, np.ones(2400) / 2400, 'same') * (~endc)
# stepper whine: pitch follows speed, two coupled harmonics and a little grit
f0 = 120 + vc * 2.4
ph = 2 * np.pi * np.cumsum(f0) / SR
whine = np.sin(ph) + .45 * np.sin(2 * ph + .3) + .18 * np.sign(np.sin(3 * ph))
whine = bp(whine, 110, 4000) * np.minimum(1, vc / 60) ** .8 * .05 * near
# pen on paper: band noise while the pen is down, brighter with speed
scr = bp(noise(DUR)[:NS], 1800, 7500) * (np.convolve(d, np.ones(240) / 240, 'same') * (.35 + .65 * np.minimum(1, vc / 90))) * .05 * near
# Z servo: a short buzz whenever the holder moves up or down
dz = np.abs(np.gradient(np.interp(tt, ft, fz))) * SR
servo = bp(np.sign(np.sin(2 * np.pi * 330 * tt)) * .5 + noise(DUR)[:NS] * .3, 250, 2500) * np.minimum(1, dz / 40) * .03 * near
# the room: a faint mains hum, the night outside
room = lp(noise(DUR)[:NS], 250) * .012 + hp(lp(noise(DUR)[:NS], 1800), 300) * .004 + np.sin(2 * np.pi * 50 * tt) * .003
for c in (0, 1): fx[:, c] += whine * (.9 if c == 0 else 1.0) + scr + servo + room * (1 if c == 0 else .9)
for e in EV:
    t = e['t']
    if e['type'] == 'tap': add(fx, click(.6 + rng.random() * .15, 1), t, .1 + .05 * rng.random(), rng.uniform(-.2, .2))
    elif e['type'] == 'up': add(fx, click(.9, .5), t, .03, .1)
    elif e['type'] in ('grip', 'release'): add(fx, clack(.7 if e['type'] == 'grip' else .85, 1), t, .3 if T_S3 < t < T_INS else .45, -.15); add(fx, thump(1, 140), t, .1)
    elif e['type'] == 'cut' and e['shot'] != 8: add(fx, whoosh(.25, 1), t - .18, .025)
    elif e['type'] == 'parked': add(fx, clack(.6, 1), t, .3, -.2)
# the end card is plotted too: a light scratch under each line as it appears
for k, t0 in enumerate([T_END + .05, T_END + .22, T_END + .34, T_END + .45, T_END + .56]):
    x = bp(noise(.4), 2500, 7000) * np.hanning(int(.4 * SR)) * .02; add(fx, x, t0, 1.0, .1)
fx = np.stack([lp(fx[:, c], 12000) for c in (0, 1)], 1)

if '--stems' in sys.argv:
    db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
    for k in range(int(DUR)):
        a, b = int(k * SR), int((k + 1) * SR); print(f'{k:3d}s  music {db(mus[a:b]):6.1f}  fx {db(fx[a:b]):6.1f}')
mix = mus * .5 + fx * 1.3
GAIN = float(os.environ.get('GAIN', '2.6')); mix *= GAIN
for c in (0, 1): mix[:, c] = limit(mix[:, c], .63)
mix = mix.astype(np.float32); assert mix.shape == (NS, 2)
sf.write(os.path.join(HERE, 'mix.wav'), mix, SR, subtype='PCM_24')
print(f'mix.wav {mix.shape[0] / SR:.3f} s  peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
print('\n'.join(Smp.credits(sorted({m['inst'] for m in music}))))
