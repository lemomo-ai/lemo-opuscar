"""Sound for "Step Ten": paper and flat-pack foley, a small chamber score and the narration.

Reads events.json (window.EV: every cue the picture makes, with its time) and timeline.json; writes out/mix.wav (48 kHz stereo).
Run from the library root:  .venv/bin/python styles/instruction-manual/demo/mix.py
Score idea: a manual is cheerful and tidy, so the score is a little pizzicato machine in F major at 92 BPM (pizz, marimba,
glockenspiel, a felt-soft piano) that counts the steps. It trips on step 7 (it stops dead for the cross), giggles on the laugh,
ticks like a clock through step 9, and then leaves the room: step 10 is drawn in near silence, and the first note after it is
a chime as the swaddle turns yellow. The pull-out over the whole page is the only time the strings play out.
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, clack, whoosh, thump, creak

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json'))); TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(DUR * SR)
rng = np.random.default_rng(5)
ev_of = lambda typ: [e for e in EV if e['type'] == typ]
one = lambda typ: ev_of(typ)[0]['t']

# ---------------- foley ----------------
fol = np.zeros((N, 2))
def noise_burst(d, lo, hi, shape=1.5):
    n = int(d * SR); x = bp(rng.standard_normal(n), lo, hi); return x * np.sin(np.linspace(0, np.pi, n)) ** shape
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'land':   # a flat carton dropped on a wooden floor
        add(fol, lp(thump(1.0, 75), 900) * .9, t - .01, 1.0, -.1); add(fol, noise_burst(.12, 300, 2500, 2) * .25, t, 1.0, -.1)
    elif ty == 'lid':
        add(fol, noise_burst(.45, 700, 4000) * .12, t, 1.0, .1); add(fol, hp(click(pitch=.5, v=1.0), 500) * .2, t + .5, 1.0, .1)
    elif ty == 'rise':
        add(fol, lp(whoosh(.5, .6), 3000) * .1, t, 1.0, .2)
    elif ty == 'settle':
        add(fol, bp(clack(pitch=1.1 + rng.random() * .3, v=1.0), 600, 5000) * .22, t, 1.0, .25)
    elif ty == 'draw':   # pencil on paper, line by line
        n = int(e['d'] * SR); x = bp(rng.standard_normal(n), 1800, 6500)
        g = (lp(np.abs(rng.standard_normal(n)), 9, 1) > .55).astype(float); g = np.convolve(g, np.ones(600) / 600, 'same')
        add(fol, x * g * .05, t, 1.0, .15)
    elif ty in ('pop', 'mag'):
        add(fol, hp(click(pitch=.8, v=1.0), 800) * .25, t, 1.0, .3)
    elif ty == 'whip':
        add(fol, lp(whoosh(e['d'] + .2, 1.0), 4000) * .5, t - .1, 1.0, .3)
    elif ty in ('push', 'dive', 'out'):
        add(fol, lp(whoosh(e['d'], .8), 2200) * .22, t, 1.0, 0)
    elif ty == 'portal':
        add(fol, noise_burst(.35, 1500, 7000, 2) * .1, t - .1, 1.0, 0)
    elif ty == 'step':
        add(fol, lp(thump(.5, 110), 1400) * .25, t, 1.0, rng.random() * .4 - .2)
    elif ty == 'slide':   # the page sliding past: paper friction
        add(fol, noise_burst(e['d'], 500, 3500, 1.2) * .16, t, 1.0, -.2)
    elif ty == 'bolt':
        add(fol, lp(whoosh(.35, .7), 5000) * .12, t, 1.0, .4); add(fol, bp(clack(pitch=1.8, v=1.0), 1500, 8000) * .2, t + .4, 1.0, .4)
    elif ty == 'ratchet':
        add(fol, bp(click(pitch=1.6, v=1.0), 2000, 9000) * .2, t, 1.0, .35)
    elif ty == 'click':   # the one that matters
        add(fol, bp(clack(pitch=1.3, v=1.0), 700, 9000) * .85, t, 1.0, .3); add(fol, hp(click(pitch=1.0, v=1.0), 1200) * .5, t + .012, 1.0, .3)
    elif ty == 'stamp':   # the red cross, a rubber stamp on paper
        add(fol, lp(thump(1.0, 90), 1000) * .7, t - .01, 1.0, .2); add(fol, bp(click(pitch=.35, v=1.0), 300, 3000) * .3, t, 1.0, .2)
    elif ty == 'lift':
        add(fol, bp(creak(.8), 200, 3000) * .25, t + .1, 1.0, .3)
    elif ty == 'flip':
        add(fol, lp(whoosh(e['d'], 1.0), 2500) * .25, t, 1.0, .1)
    elif ty == 'land2':
        add(fol, lp(thump(.9, 120), 1800) * .5, t, 1.0, .1); add(fol, bp(clack(pitch=.8, v=1.0), 500, 5000) * .3, t + .01, 1.0, .1)
    elif ty == 'print':
        add(fol, lp(thump(.6, 140), 2000) * (.4 if t > 30 else .3), t, 1.0, -.2)
    elif ty == 'card':
        add(fol, lp(thump(.8, 110), 1500) * .45, t, 1.0, 0); add(fol, bp(click(pitch=.4, v=1.0), 400, 3000) * .2, t, 1.0, 0)
room = lp(rng.standard_normal(N), 380, 2) * .003
fol += np.stack([room, np.roll(room, 997)], 1)

# ---------------- score ----------------
B = 60 / 92; ev = []
CH = {'F': [41, 53, 57, 60, 65], 'C': [36, 52, 55, 60, 64], 'Dm': [38, 50, 53, 57, 62], 'Bb': [34, 50, 53, 58, 62], 'Gm': [43, 50, 55, 58, 62], 'Am': [45, 52, 57, 60, 64]}
def bar(t0, ch, v=1.0, ost=True, bass=True, end=None):
    n = CH[ch]
    for i in (0, 2):
        if bass and (end is None or t0 + i * B < end): ev.append((t0 + i * B, 'cellos_pizz', n[0] + (12 if n[0] < 40 else 0), .7, .5 * v, -.15))
    if ost:
        for i, k in enumerate([3, 1, 4, 2, 3, 1, 4, 2]):
            tt = t0 + i * B / 2
            if end is None or tt < end: ev.append((tt, 'marimba', n[k] + 12, .3, (.22 + .06 * (i % 2 == 0)) * v, .15))
def run(t0, t1, chords, v=1.0, ost=True):
    t, i = t0, 0
    while t < t1 - .05:
        bar(t, chords[i % len(chords)], v, ost, end=t1); t += 4 * B; i += 1
VO = {k: v for k, v in TL['vo'].items()}
# 0–6.4 · the box: a soft piano F, then one note per part as it settles (rising through the chord)
ev += [(one('land'), 'piano', 41, 2.5, .35, -.1), (one('land'), 'piano', 53, 2.5, .25, -.1), (one('land') + .02, 'glockenspiel', 77, 1.2, .2, .2)]
for e, p in zip(ev_of("settle"), [72, 74, 76, 77, 79, 81, 84, 86]): ev.append((e['t'], 'glockenspiel', p, 1.0, .22, .25)); ev.append((e['t'], 'kalimba', p - 12, 1.0, .25, -.1))
ev += [(one('lid'), 'harp', p, 1.4, .22, -.2 + .1 * i) for i, p in enumerate([60, 65, 69])]
# 6.4–10 · two people: the little machine starts
run(6.45, 10.0, ['F', 'C'], v=.8, ost=True)
ev += [(one('pop'), 'glockenspiel', 84, .8, .2, .3)]
# 10 · whip; 10.7–14.2 · step 4 held: pizz only, steady
ev += [(10.0 + i * .045, 'harp', 60 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17][i], .8, .2, -.3 + .06 * i) for i in range(11)]
run(10.75, 14.2, ['Dm', 'Bb'], v=.75, ost=False)
# 14.2 · push through the tick: a bowed swell, then the carry walks in step
ev += [(14.2, 'vibraphone_bowed', p, 1.4, .2, 0) for p in (65, 69)]
for e, p in zip(ev_of('step'), [41, 48, 41, 48, 43, 48]): ev.append((e['t'], 'cellos_pizz', p, .5, .45, -.1))
run(15.4, 17.8, ['F', 'C'], v=.65, ost=True)
# 17.8–22.2 · step 5: thin texture under the ratchet so the click lands on its own
run(18.75, 21.4, ['Gm', 'C'], v=.6, ost=False)
ev += [(one('click') + .02, 'glockenspiel', 89, 1.6, .38, .3), (one('click') + .02, 'vibraphone', 65, 1.6, .25, 0), (one('click'), 'cellos_pizz', 41, .8, .5, -.1)]
ev += [(22.3 + i * .09, 'harp', p, 1.0, .18 + .015 * i, .2) for i, p in enumerate([65, 69, 72, 77, 81, 84, 89, 93])]   # diving into the circle
# 23.2–28.8 · step 7: the machine again, then it stops dead for the cross
run(23.25, one('stamp') - .85, ['F', 'Dm', 'Bb'], v=.7, ost=True)
ev += [(one('stamp'), 'cellos_pizz', 30, .9, .6, 0), (one('stamp'), 'piano', 42, 1.2, .3, 0), (one('stamp') + .01, 'piano', 47, 1.2, .25, 0)]   # a flat, wrong note
# 28.8–32.4 · take it apart (pluck), laugh (a marimba giggle), try again (harp up, the tick chimes)
ev += [(one('lift'), 'cellos_pizz', 48, .5, .45, 0), (one('lift') + .33, 'cellos_pizz', 53, .5, .4, 0)]
ev += [(one('laugh') + i * .07, 'marimba', p, .2, .28, .2) for i, p in enumerate([84, 81, 84, 81, 84, 79, 81, 77])]
ev += [(one('flip') + i * .07, 'harp', p, 1.2, .22, -.2 + .05 * i) for i, p in enumerate([53, 57, 60, 65, 69, 72, 77])]
ev += [(one('tick'), 'glockenspiel', 84, 1.4, .32, .2), (one('tick'), 'vibraphone', 69, 1.8, .26, 0), (one('tick'), 'cellos_pizz', 41, .8, .45, -.1)]
# 32.5–37 · step 9: a clock. One tick per month (they speed up), a held bowed chord, a low pizz on each sweep
months = ev_of('month')
ev.append((32.1, 'woodblock', None, None, .3, .2))   # J-cut: the clock starts under the end of step 8
for i, e in enumerate(months):
    ev.append((e['t'], 'woodblock', None, None, .32 + .02 * i, .25 * (1 if i % 2 else -1)))
    ev.append((e['t'], 'cellos_pizz', [41, 45, 48, 41, 45, 48, 41, 45, 48][i], .5, .32, -.1))
ev += [(32.6, 'vibraphone_bowed', p, 4.2, .15, 0) for p in (53, 60, 65)]
# 37–41.1 · step 10 is drawn in near silence (only the pencil); then a chime as the swaddle turns yellow
F_ = one('fill')
ev += [(F_, 'hand_chimes', 77, 3.0, .38, .1), (F_ + .02, 'glockenspiel', 89, 2.0, .26, .25), (F_, 'vibraphone', 65, 3.5, .3, -.1), (F_, 'vibraphone', 69, 3.5, .26, .1)]
ev += [(F_ + .4, 'piano', p, 3.2, .22, 0) for p in (41, 53, 60)]
# under "You learn that one by heart": the opening's rising notes again, slow, on piano
ev += [(42.0 + i * B, 'piano', p, 1.6, .24, .1) for i, p in enumerate([72, 76, 77, 81])]
# 44.6–50.6 · the whole page: strings for the first time, a harp running up the page, landing on F as the card prints
O0 = one('out')
ev += [(O0, 'cellos', 41, 6.0, .32, -.2, ), (O0, 'violas', 57, 6.0, .22, .1), (O0 + .3, 'violins', 65, 5.6, .2, .25)]
ev += [(O0 + i * .14, 'harp', p, 1.6, .2 + .01 * i, -.3 + .04 * i) for i, p in enumerate([53, 57, 60, 65, 69, 72, 77, 81, 84, 89])]
run(O0 + .3, one('card') - .05, ['Bb', 'C'], v=.55, ost=True)
Cd = one('card')
ev += [(Cd, 'cellos_pizz', 41, 1.2, .55, -.1), (Cd, 'piano', 41, 3.3, .32, 0), (Cd, 'piano', 53, 3.3, .26, 0), (Cd, 'piano', 60, 3.3, .24, 0), (Cd, 'piano', 69, 3.3, .22, 0),
       (Cd + .03, 'glockenspiel', 89, 2.4, .3, .25), (Cd, 'kalimba', 77, 2.5, .3, -.2), (Cd, 'vibraphone', 65, 3.3, .26, 0)]
ev = [e if len(e) == 6 else e[:6] for e in ev]
S.seed(11)
music = S.render(ev, dur=DUR + 3, master=False)[:N]
music = S.room(music, size=.35, mix=.18)

# ---------------- narration ----------------
voice = np.zeros(N)
for k, (a, b) in VO.items():
    x, sr = sf.read(os.path.join(HERE, 'vo', f'{k}.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        from scipy.signal import resample_poly
        x = resample_poly(x, SR, sr)
    i0 = int(a * SR); x = x[:N - i0]; voice[i0:i0 + len(x)] += x
voice = hp(voice, 80)
voice = compress(voice, thr=.12, ratio=3.0, att=.003, rel=.12)
env = np.convolve(np.abs(voice), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); env = np.clip(env / (np.percentile(env[env > 1e-4], 70) + 1e-9), 0, 1)
env = np.convolve(env, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in (0, 1)], 1); rest = music - mid
music = rest * (1 - .2 * env)[:, None] + mid * (1 - .6 * env)[:, None]
vst = np.stack([voice, voice], 1); vmask = env > .5
m_rms = float(np.sqrt(np.mean(music[vmask] ** 2))); v_rms = float(np.sqrt(np.mean(vst[vmask] ** 2)))
g_music = (v_rms / m_rms) * 10 ** (-10.0 / 20)            # music ≈ 10 dB under the voice while he speaks
mix = vst + music * g_music + fol * (v_rms / .06)
if os.environ.get('STEMS'):
    db = lambda x, m: 20 * np.log10(float(np.sqrt(np.mean(x[m] ** 2))) + 1e-12)
    print('voice', round(db(vst, vmask), 1), 'music(vo)', round(db(music * g_music, vmask), 1), 'music(gaps)', round(db(music * g_music, ~vmask), 1))
mix = np.stack([compress(mix[:, c], thr=.5, ratio=2.0) for c in (0, 1)], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * .9
mix = np.stack([limit(mix[:, c], .95) for c in (0, 1)], 1)
nf = int(1.0 * SR); mix[-nf:] *= (np.cos(np.linspace(0, np.pi / 2, nf)) ** 2)[:, None]   # the last chord rings out
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = sorted({e[1] for e in ev})
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write(str(S.credits(used)))
print('mix', mix.shape, 'music gain', round(20 * np.log10(g_music), 1), 'dB', 'instruments', used)
