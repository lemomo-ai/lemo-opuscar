"""Sound for the 50 s film «Six Hands Away»: English voice-over + score + foley.

Picture events come from events.json (exported from index.html, scene=full). The score runs on the film clock
(120 bpm, 2 s bars, D major) and follows the five shots:
  S1  0–10    hook: pizzicato + marimba; a kalimba note per handshake (the count climbs), a harp strum on the lift
  S2  10–24   letters: a walking pizzicato bass; each hand-off a soft kalimba; a dropped letter falls a minor third
  S3  24–37.75 rings: strings swell under a harp sweep per ring; the tally ticks; a full chord when the count passes Earth;
              a cymbal swell into the dive, cut by a soft low hit on the red frame
  S4  37.75–44.4 lighter again: ticks per handshake, one vibraphone note per value
  S5  44.4–50 the globe: plucked notes racing round both sides, the closing handshake lands on the biggest chord
Voice: compressed, placed ~10 dB (RMS) above the music; the music bus gives way 300 Hz–4 kHz and ducks under each line.
Run from the library root:  .venv/bin/python styles/stick-explainer/demo/mix.py [FROM] [TO]   → demo/out/mix.wav
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, pop, thump

HERE = os.path.dirname(os.path.abspath(__file__))
FROM = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
TO = float(sys.argv[2]) if len(sys.argv) > 2 else 52.0
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); N = int(round(DUR * SR))
assert abs(DUR - (TO - FROM)) < 1e-3, 'events.json was exported for another window'
EV = [dict(e, t=e['t'] + FROM) for e in D['ev']]                  # back to film seconds
FILM = 52.0; NF = int(FILM * SR) + SR                              # 50 s story + 2 s end card
rng = np.random.default_rng(11)
first = lambda typ: [e for e in EV if e['type'] == typ]

# ================= score =================
ev = []
def chordbar(t0, root, tri, pat=True, vel=.2, walk=False):
    ev.append((t0, 'contrabass_pizz', root, .8, .55, -.05, .9))
    if walk:
        for i, st in enumerate([4, 7, 9]): ev.append((t0 + .5 * (i + 1), 'contrabass_pizz', root + st, .5, .42, -.05, .75))
    else: ev.append((t0 + 1.0, 'contrabass_pizz', root + 7, .8, .45, -.05, .8))
    if pat:
        for i, k in enumerate([0, 1, 2, 1, 0, 2, 1, 2]):
            ev.append((t0 + i * .25, 'marimba', tri[k] + (12 if i % 4 == 2 else 0), .3, vel + .05 * (i % 2 == 0), .2, .5))
D_, Bm, G_, A_ = (38, [62, 66, 69]), (35, [62, 66, 71]), (43, [62, 67, 71]), (45, [61, 64, 69])
# S1 (same as the 10 s cut)
chordbar(0, *D_, pat=False)
for b, ch in [(1, Bm), (2, G_), (3, A_)]: chordbar(b * 2.0, *ch)
ev.append((.5, 'marimba', 62, .5, .35, -.5, .6)); ev.append((1.0, 'marimba', 74, .5, .3, .55, .55))
for i, p in enumerate([57, 61, 64, 69, 73, 76]): ev.append((7.0 + i * .035, 'harp', p, 1.2, .5, -.3 + i * .12, .8))
ev.append(dict(t=6.9, inst='violins', pitch=69, dur=3.0, vel=.3, pan=.25, gain=.3, attack=.6))
ev.append(dict(t=8.0, inst='cellos', pitch=50, dur=2.0, vel=.33, pan=0, gain=.32, attack=.3))
for i, p in enumerate([62, 66, 69, 74]): ev.append((8.0 + i * .03, 'vibraphone', p, 2.0, .36, -.2 + i * .13, .45))
CLASP = [74, 76, 78, 81, 83, 86]; NODE = [86, 88, 90, 93, 95, 98]
for e in first('clasp'): ev.append((e['t'], 'kalimba', CLASP[e['k'] - 1], 1.0, .6, e.get('pan', 0) * .6, .75))
for e in first('node'): ev.append((e['t'], 'glockenspiel', NODE[e['k'] - 1], .6, .3 + .03 * e['k'], e.get('pan', 0) * .6, .3))
for e in first('arrive'): ev.append((e['t'], 'vibraphone', 81, 1.4, .45, .5, .42)); ev.append((e['t'], 'vibraphone', 86, 1.4, .4, .55, .38))
# S2: walking bass, light marimba
for b, ch in enumerate([D_, Bm, G_, A_, D_, Bm, G_]): chordbar(10.0 + b * 2.0, *ch, vel=.16, walk=True)
HANDP = [74, 76, 78, 81, 83, 86]
for e in first('hand'): ev.append((e['t'], 'kalimba', HANDP[e['k'] - 1] - 12 * (e['r'] % 2), .7, .38, e.get('pan', 0) * .5, .45))
for e in first('drop'):
    ev.append((e['t'] + .05, 'marimba', 69, .4, .4, e.get('pan', 0), .45)); ev.append((e['t'] + .2, 'marimba', 66, .6, .35, e.get('pan', 0), .4))
for e in first('arrive2'):
    for i, p in enumerate([62, 66, 69, 74, 78]): ev.append((e['t'] + i * .03, 'vibraphone', p, 1.6, .42, -.2 + i * .1, .45))
for e in first('count'): ev.append((e['t'], 'glockenspiel', [86, 88, 90, 93, 95][e['k'] - 1], .5, .32, -.3 + .15 * e['k'], .3))
ev.append(dict(t=22.6, inst='violins', pitch=74, dur=1.6, vel=.28, pan=.2, gain=.3, attack=1.0))
# S3: a pad that grows ring by ring, harp sweeps, the tally, the big chord at Earth
pads = [(24.0, 29.4, [50, 57, 62]), (29.4, 33.0, [47, 54, 62]), (33.0, 35.2, [43, 55, 62, 67]), (35.2, 37.2, [45, 57, 61, 64, 69])]
for t0, t1, notes in pads:
    for i, p in enumerate(notes):
        inst = 'cellos' if p < 55 else ('violas' if p < 64 else 'violins')
        ev.append(dict(t=t0, inst=inst, pitch=p, dur=t1 - t0 + .3, vel=.3 + .05 * (t0 > 33), pan=-.3 + .2 * i, gain=.24 + .04 * (t0 > 33), attack=.5))
for e in first('ring'):
    k = e['k']; n = 7 if k < 2 else 5
    for i in range(n): ev.append((e['t'] + i * e['d'] / n, 'harp', [62, 66, 69, 74, 78, 81, 86][i] + (0 if k < 3 else 2 * (k - 2)), .9, .4, -.6 + 1.2 * i / n, .45))
for e in first('ringclose'): ev.append((e['t'], 'glockenspiel', 86 + 2 * e['k'], .8, .35, .2, .32))
for e in first('tally'): ev.append((e['t'], 'marimba', [74, 76, 78, 81, 86][e['k'] - 1], .5, .45, .4, .5))
for e in first('earth'):
    for i, p in enumerate([45, 57, 64, 69, 73]): ev.append(dict(t=e['t'], inst='horn' if i == 2 else 'cellos' if p < 55 else 'violins', pitch=p, dur=1.9, vel=.42, pan=-.2 + .1 * i, gain=.3, attack=.25))
    for i, p in enumerate([57, 61, 64, 69]): ev.append((e['t'] + i * .03, 'vibraphone', p, 1.8, .4, -.2 + .13 * i, .42))
# S4: lighter
for b, ch in enumerate([D_, Bm, G_]): chordbar(38.0 + b * 2.0, *ch, vel=.15)
for e in first('clasp4'): ev.append((e['t'], 'kalimba', [74, 76, 78, 81, 83, 86][e['k'] % 6] + 12 * (e['r'] == 2), .6, .35, -.2 + .1 * e['k'], .35))
for e in first('val'): ev.append((e['t'], 'vibraphone', [69, 74, 78][e['r']], 1.6, .45, .3, .45))
# S5: the globe
chordbar(44.0, *A_, pat=False)
for e in first('grow'):
    j = e['j']; p = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98, 100][j - 1]
    ev.append((e['t'], 'harp', p - 12, .5, .35, .6, .35)); ev.append((e['t'] + .01, 'harp', p - 12, .5, .35, -.6, .35))
for e in first('close'):
    T = e['t']
    for i, p in enumerate([38, 50, 57, 62, 66, 69, 74, 78]): ev.append((T + i * .03, 'harp', p, 2.5, .55, -.4 + .1 * i, .7))
    for i, p in enumerate([50, 57, 62, 66, 69, 74]):
        inst = 'cellos' if p < 55 else ('violas' if p < 64 else 'violins')
        ev.append(dict(t=T, inst=inst, pitch=p, dur=FILM - T + .5, vel=.38, pan=-.3 + .12 * i, gain=.3, attack=.12))
    ev.append((T, 'contrabass_pizz', 38, 1.5, .6, 0, .9))
for e in first('pulse5'):
    for i, p in enumerate([86, 90, 93, 98, 102]): ev.append((e['t'] + i * e['d'] / 5, 'glockenspiel', p, .8, .3, -.4 + .2 * i, .3))
for e in first('lift5'):
    for i, p in enumerate([62, 66, 69, 74]): ev.append((e['t'] + i * .04, 'vibraphone', p, 2.0, .4, -.2 + .13 * i, .42))
# the end card: one high bell as the credit lands, then the last breath of the chord — a low harp D, left to ring out
for e in first('sign'):
    ev.append((e['t'], 'glockenspiel', 86, 1.5, .3, .1, .28)); ev.append((e['t'] + .02, 'vibraphone', 74, 2.5, .32, -.1, .35))
ev.append((50.5, 'harp', 38, 2.5, .45, 0, .55)); ev.append((50.52, 'harp', 50, 2.5, .38, .1, .45))
S.seed(5)
win = [x for x in ev if (x['t'] if isinstance(x, dict) else x[0]) < TO + .5 and ((x['t'] if isinstance(x, dict) else x[0]) + 8 > FROM)]
music_full = S.render(win, dur=FILM + 3, master=False)
music = music_full[int(FROM * SR):int(FROM * SR) + N]
music = S.room(music, size=.32, mix=.17)

# ================= foley =================
fx = np.zeros((N, 2))
def at(t): return t - FROM
for e in EV:
    t, typ, pan = at(e['t']), e['type'], e.get('pan', 0) * .7
    if typ == 'pop': add(fx, lp(pop(1.0), 3500) * .10, t, 1.0, pan); add(fx, hp(click(pitch=.7), 1200) * .025, t + .03, 1.0, pan)
    elif typ == 'reach': add(fx, lp(whoosh(.28), 2200) * .035, t, 1.0, pan)
    elif typ in ('clasp', 'clasp4'): add(fx, lp(click(pitch=.42), 2600) * (.12 if typ == 'clasp' else .07), t, 1.0, pan)
    elif typ == 'grow': add(fx, lp(click(pitch=.5), 2600) * .05, t, 1.0, .5); add(fx, lp(click(pitch=.5), 2600) * .05, t + .01, 1.0, -.5)
    elif typ == 'close': add(fx, lp(click(pitch=.38), 2200) * .16, t, 1.0, 0)
    elif typ in ('pulse', 'pulse4', 'pulse5'):
        d = e['d'] + .15; n = int(d * SR); x = bp(rng.standard_normal(n), 1500, 5000) * np.sin(np.pi * np.arange(n) / n) ** 2 * (.03 if typ == 'pulse' else .02)
        for i in range(n // 480): add(fx, x[i * 480:(i + 1) * 480], t + i * 480 / SR, 1.0, -.8 + 1.6 * i / max(1, n // 480))
    elif typ == 'lift' or typ == 'lift5': add(fx, lp(whoosh(.55), 3000) * .07, t - .2, 1.0, 0)
    elif typ == 'line': n = int(e['d'] * SR); add(fx, bp(rng.standard_normal(n), 2500, 7000) * np.sin(np.pi * np.arange(n) / n) * .012, t, 1.0, -.3)
    elif typ in ('pullback', 'pushin', 'bend'): add(fx, lp(whoosh(e['d']), 1800) * .06, t, 1.0, 0)
    elif typ == 'zip':
        for i in range(6): add(fx, lp(click(pitch=.6 + .05 * i), 3000) * .03, t + i * .07, 1.0, -.5 + .2 * i)
    elif typ == 'hand': add(fx, hp(bp(rng.standard_normal(int(.08 * SR)), 2000, 6000), 1500) * np.linspace(1, 0, int(.08 * SR)) * .012, t - .05, 1.0, pan)
    elif typ == 'drop': add(fx, lp(thump(1.0, 110), 900) * .06, t + .48, 1.0, pan)
    elif typ == 'dive':
        n = int(.75 * SR); x = bp(rng.standard_normal(n), 800, 6000) * (np.arange(n) / n) ** 3 * .09
        add(fx, x, t, 1.0, 0)
        try: add(fx, S.hit('sus_cymbal', None, .5) [::-1][-n:] * .25, t, 1.0, 0)
        except Exception: pass
    elif typ == 'redout': add(fx, lp(thump(1.0, 55), 400) * .22, t, 1.0, 0)
room = lp(rng.standard_normal(N), 400, 2) * .003
fx += np.stack([room, np.roll(room, 977)], 1)

# ================= voice =================
voice = np.zeros((N, 2)); vmask = np.zeros(N)
import soxr
for e in first('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    x = hp(x, 80)
    x = compress(x / (np.abs(x).max() + 1e-9) * .8, thr=.25, ratio=3.0, att=.003, rel=.12)
    s = int(round(at(e['t']) * SR));
    if s >= N or s + len(x) <= 0: continue
    a0 = max(0, -s); s = max(0, s); e_ = min(N, s + len(x) - a0)
    voice[s:e_, 0] += x[a0:a0 + e_ - s]; voice[s:e_, 1] += x[a0:a0 + e_ - s]
    vmask[s:e_] = 1

# ================= bus =================
bus = music * .9 + fx
# give way to the voice: a steady dip 300 Hz–4 kHz, plus a gentle duck while a line is spoken
dip = np.stack([bp(bus[:, 0], 300, 4000), bp(bus[:, 1], 300, 4000)], 1)
k = int(.25 * SR); duck = np.convolve(vmask, np.ones(k) / k, 'same')
bus = bus - dip * (.3 + .3 * duck[:, None])
bus = bus * (1 - .3 * duck[:, None])
if vmask.any():
    rv = np.sqrt(np.mean(voice[vmask > 0] ** 2)); rm = np.sqrt(np.mean(bus[vmask > 0] ** 2)) + 1e-9
    voice *= (rm * 10 ** (10 / 20)) / (rv + 1e-9)                   # voice ≈ 10 dB above the music, by RMS while it speaks
mix = bus + voice
if TO < FILM - 1e-6:
    tt = np.arange(N) / SR; f = np.clip((DUR - tt) / .45, 0, 1) ** 1.5; mix *= f[:, None]
else:
    tt = np.arange(N) / SR; f = np.clip((DUR - tt) / 1.6, 0, 1) ** 1.3; mix *= f[:, None]   # the last chord fades with the picture
mix = np.stack([compress(mix[:, 0], thr=.35, ratio=2.2), compress(mix[:, 1], thr=.35, ratio=2.2)], 1)
mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = ['contrabass_pizz', 'marimba', 'kalimba', 'glockenspiel', 'harp', 'vibraphone', 'violins', 'violas', 'cellos', 'horn', 'sus_cymbal']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
if vmask.any():
    print('voice over music (RMS, while speaking): %.1f dB' % (20 * np.log10(np.sqrt(np.mean(voice[vmask > 0] ** 2)) / (np.sqrt(np.mean(bus[vmask > 0] ** 2)) + 1e-9))))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3))
