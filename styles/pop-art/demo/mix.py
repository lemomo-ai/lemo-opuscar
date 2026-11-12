"""Sound for The Same Banana: English narration + print-shop foley + an original 60s exotica score that makes room for the voice.

Inputs (this folder): timeline.json (shots, narration, cues), out/voice/*.wav (Kokoro), events.json (from index.html).
Output: out/mix.wav (48 kHz stereo).   Run from the library root:  .venv/bin/python styles/pop-art/demo/mix.py [start end]
With start/end it cuts that span and gives it a short sound fade-out (the 10 s demo)."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
SH = TL['shots']
DUR = float(TL['dur']); N = int(DUR * SR)
rng = np.random.default_rng(7)
tt = np.arange(N) / SR
rms = lambda x: float(np.sqrt(np.mean(np.square(x)) + 1e-12))
db = lambda x: 20 * np.log10(x + 1e-12)
def smooth(x, sec): k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, 'same')
def nz(d): return rng.standard_normal(max(1, int(d * SR)))
def env(n, a, r): e = np.ones(n); a = min(n, int(a * SR)); r = min(n - a, int(r * SR)); e[:a] = np.linspace(0, 1, a) if a else 1; e[n - r:] = np.linspace(1, 0, r) if r else 1; return e

# ---------------- voice ----------------
vo = np.zeros(N); vmask = np.zeros(N)
for L in TL['lines']:
    for p in L['parts']:
        x, sr = sf.read(os.path.join(HERE, 'out', 'voice', p['id'] + '.wav'), dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        i = int(p['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]; vmask[i:i + n] = 1
vo = hp(vo, 85)
vo = compress(vo / (np.abs(vo).max() + 1e-9) * 0.9, thr=0.2, ratio=3.2, att=0.003, rel=0.12)
duck = smooth(np.maximum(vmask, np.roll(vmask, int(0.15 * SR))), 0.18)

# ---------------- foley: the print shop ----------------
fo = np.zeros((N, 2))
def squeegee(v=1.0):
    d = 0.32; x = nz(d); f = np.linspace(900, 2600, len(x))
    y = bp(x, 700, 4200) * env(len(x), .03, .12) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, len(x))) ** 2)
    return y * 0.22 * v
def stamp(v=1.0):
    th = thump(v=1.0, f=95)[:int(.25 * SR)] * .55
    sl = hp(nz(.06), 900) * np.exp(-np.arange(int(.06 * SR)) / SR / .012) * .35
    out = np.zeros(max(len(th), len(sl))); out[:len(th)] += th; out[:len(sl)] += sl
    return out * v
def flick(v=1.0):
    d = .05; return bp(nz(d), 1800, 7000) * np.exp(-np.arange(int(d * SR)) / SR / .01) * .45 * v
def rotbed(d):
    n = int(d * SR); x = lp(nz(d), 700) * .5 + bp(nz(d), 1500, 5000) * (np.abs(lp(nz(d), 30)) * 6) ** 2 * .15
    return x * env(n, .6, .8) * .35
for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1.0)
    pan = e.get('pan', 0.0)
    if ty == 'stamp': add(fo, stamp(.55 * v), t, 1.0, pan)
    elif ty == 'print':
        add(fo, squeegee(v), t, 1.0, -0.2); add(fo, stamp(.45 * v), t + .3, 1.0, -0.2)
    elif ty in ('pull', 'dive', 'pan'):
        d = round(min(max(e.get('d', .6), .3), 2.5), 2)
        add(fo, lp(whoosh(d, 1.0), 2600) * (0.16 if ty != 'dive' else 0.2), t, 1.0, 0.0)
    elif ty == 'cut': add(fo, hp(nz(.04), 2000) * np.exp(-np.arange(int(.04 * SR)) / SR / .008) * .5, t, 1.0, .1)
    elif ty == 'tick': add(fo, hp(click(pitch=1.4, v=1.0), 1200) * .12, t, 1.0, .3)
    elif ty == 'grow': add(fo, stamp(.5), t, 1.0, pan); add(fo, bp(nz(.3), 2000, 6000) * env(int(.3 * SR), .05, .2) * .06, t + .05, 1.0, pan)
    elif ty == 'slam': add(fo, stamp(1.3), t, 1.0, 0); add(fo, lp(nz(.6), 200) * env(int(.6 * SR), .005, .5) * .4, t, 1.0, 0)
    elif ty == 'rot':
        d = e.get('d', 3); add(fo, rotbed(d), t, 1.0, -.1); add(fo, rotbed(d) * .8, t + .013, 1.0, .3)
    elif ty == 'flip': add(fo, flick(v), t, 1.0, pan)
    elif ty == 'plate': add(fo, stamp(.6) * (1 + .1 * e['k']), t, 1.0, -.3 + .2 * e['k'])
    elif ty == 'stampbig': add(fo, stamp(1.2), t, 1.0, .3)
    elif ty == 'draw':
        d = e.get('d', 1.5); n = int(d * SR); add(fo, bp(nz(d), 1200, 4500) * env(n, .1, .3) * .05, t, 1.0, 0)
fo *= 0.5 * (1 - 0.45 * duck)[:, None]
room = lp(rng.standard_normal(N), 400, 2) * 0.003
fo += np.stack([room, np.roll(room, 811)], 1)

# ---------------- score: 60s exotica, 112 bpm ----------------
B = 60 / 112
ev = []
def chord_at(t):
    for a, b, ch, mood in SECT:
        if a <= t < b: return ch, mood
    return SECT[-1][2], SECT[-1][3]
C, F, G, Am, Dm, Em, Fm = [48, 55, 60, 64, 67], [41, 53, 57, 60, 65], [43, 55, 59, 62, 67], [45, 57, 60, 64, 69], [50, 57, 62, 65, 69], [40, 55, 59, 64, 67], [41, 56, 60, 65, 68]
H = SH['hush']; S9 = SH['s9']
SECT = [(0, SH['s2'], C, 'intro'), (SH['s2'], 7.0, C, 'groove'), (7.0, SH['s3'], F, 'groove'), (SH['s3'], SH['s4'], Am, 'groove'),
        (SH['s4'], SH['s5'], G, 'groove'), (SH['s5'], SH['s6'], F, 'retro'), (SH['s6'], SH['s7'], Dm, 'dark'), (SH['s7'], SH['s8'], C, 'bright'),
        (SH['s8'], H, Am, 'dark2'), (H, S9, Am, 'hush'), (S9, SH['s10'], C, 'joy'), (SH['s10'], SH['card'], F, 'joy'), (SH['card'], DUR, C, 'end')]
for a, b, ch, mood in SECT:
    if mood == 'hush':
        ev.append(dict(t=a, inst='contrabass', pitch=33, dur=b - a + .3, vel=.35, pan=0, gain=.6, attack=.1)); continue
    if mood == 'end':
        for i, p in enumerate([48, 55, 60, 64, 67, 72, 76]): ev.append((a + i * .04, 'vibraphone', p, 3.5, .55, -.3 + .1 * i, .7))
        ev += [(a, 'jazz_bass', 36, 3.0, .7, 0, .9), (a, 'marimba', 84, 1.5, .5, .3, .5), (a + .1, 'glockenspiel', 91, 2.5, .45, .3, .45),
               (a, 'trumpet_mute', 67, 2.0, .4, -.2, .35), (a, 'trumpet_mute', 72, 2.0, .4, .2, .35)]
        continue
    t = a; k = 0
    while t < b - .02:
        beat = k % 4
        if mood in ('groove', 'retro', 'bright', 'joy', 'intro'):
            if mood != 'intro' and beat in (0, 2): ev.append((t, 'jazz_bass', ch[0] - 12 + (7 if beat == 2 else 0), B * .9, .62, 0, .85))
            ev.append((t, 'shaker', None, B * .5, .25 + .1 * (beat % 2), .35, .35))
            if beat in (1, 3): ev.append((t + B * .5, 'conga', None, .3, .35, -.35, .45))
            if beat == 3 and mood != 'intro': ev.append((t, 'conga', None, .3, .3, -.4, .35))
            if beat in (1, 3) and mood in ('joy', 'bright'): ev.append((t, 'claps', None, .3, .45, .1, .4))
            # vibraphone comping on the off-beats
            if beat in (0, 2): ev.append((t + B * .5 if mood != 'intro' else t, 'vibraphone', ch[2 + (k // 2) % 3], B * 1.2, .32, .25, .45))
            # marimba motif every bar
            if beat == 0 and mood in ('groove', 'joy', 'bright', 'intro'):
                mot = [ch[4] + 12, ch[3] + 12, ch[4] + 12, ch[2] + 12]
                for i, p in enumerate(mot): ev.append((t + i * B * .5, 'marimba', p, .35, .3, .2, .4))
            if mood == 'retro' and beat == 0:   # a muted trumpet line, a little old-fashioned
                ln = [ch[3] + 12, ch[2] + 12, ch[4] + 12, ch[3] + 12]
                for i, p in enumerate(ln): ev.append(dict(t=t + i * B, inst='trumpet_mute', pitch=p, dur=B * .85, vel=.45, pan=-.2, gain=.4))
            if mood == 'bright' and k == 0:
                for i, p in enumerate([67, 72, 76]): ev.append((t + i * .12, 'trumpet_stac', p, .3, .55, .2, .4))
            if mood == 'joy' and beat == 0 and k == 0:
                for p in [60, 64, 67, 72]: ev.append((t, 'trumpet_stac', p, .4, .7, 0, .45))
                ev.append((t, 'claps', 'group', .5, .8, 0, .6))
        else:  # dark, dark2: a pedal and a bowed shimmer, the groove gone
            if beat == 0: ev.append((t, 'jazz_bass', ch[0] - 12, B * 3.5, .5, 0, .8))
            if beat == 0 and k % 8 == 0: ev.append(dict(t=t, inst='vibraphone_bowed', pitch=ch[2], dur=B * 7.5, vel=.35, pan=-.2, gain=.4, attack=.5))
            if beat == 0 and k % 8 == 0: ev.append(dict(t=t + .05, inst='vibraphone_bowed', pitch=ch[3] + (1 if mood == 'dark2' else 0), dur=B * 7.5, vel=.3, pan=.25, gain=.35, attack=.5))
            if beat == 2: ev.append((t, 'conga', 'tumba', .4, .25, -.3, .35))
            if mood == 'dark2' and beat in (1, 3): ev.append((t, 'marimba', ch[1], .4, .18, .3, .3))
        t += B; k += 1
# the colour wave: one marimba note per flip, climbing a C major scale
scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
fl = [e for e in EV if e['type'] == 'flip' and e['t'] >= S9 - .01]
for n, e in enumerate(fl[:60]):
    ev.append((e['t'], 'marimba', scale[min(len(scale) - 1, n // 5)] + (12 if n == 0 else 0), .3, .35 if n else .7, -.4 + .8 * ((n * 37) % 11) / 10, .38 if n else .6))
ev.append((S9, 'glockenspiel', 84, 1.2, .55, .2, .5))
S.seed(11)
music = S.render(ev, dur=DUR + 4, master=False)[:N]
music = S.room(music, size=0.35, mix=0.18)
music = music - 0.4 * np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)   # make room where the voice lives
music *= (1 - 0.45 * duck)[:, None]
hush = np.ones(N); i0, i1 = int(H * SR), int(S9 * SR); hush[i0:i1] = 0.35; hush = smooth(hush, .12); music *= hush[:, None]
music *= np.clip((DUR - tt) / 1.6, 0, 1)[:, None] ** 1.5

# ---------------- balance ----------------
spk = vmask > 0
vg = (rms(music[spk].mean(1)) * 10 ** (10 / 20)) / rms(vo[spk])
mix = fo + music + np.stack([vo * vg, vo * vg], 1)
print(f'voice vs music (RMS while speaking): {db(rms(vo[spk]) * vg) - db(rms(music[spk].mean(1))):.1f} dB;'
      f' voice vs foley: {db(rms(vo[spk]) * vg) - db(rms(fo[spk].mean(1))):.1f} dB')
mix = np.stack([compress(mix[:, c], thr=0.3, ratio=2.5) for c in (0, 1)], 1)
# tame the transients so the master reaches -14 LUFS under a -1.2 dB true peak: ceiling = RMS + 11 dB
ceil = rms(mix.mean(1)) * 10 ** (11 / 20)
mix = np.stack([limit(mix[:, c] / ceil * .9, .9) * ceil / .9 for c in (0, 1)], 1)
if len(sys.argv) == 3:
    a, b = float(sys.argv[1]), float(sys.argv[2]); mix = mix[int(a * SR):int(b * SR)]
    n = len(mix); f = np.ones(n); r = int(.6 * SR); f[-r:] = np.linspace(1, 0, r) ** 1.5; mix *= f[:, None]
else:
    mix *= np.clip((DUR - tt) / 0.3, 0, 1)[:, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = ['jazz_bass', 'contrabass', 'vibraphone', 'vibraphone_bowed', 'marimba', 'glockenspiel', 'trumpet_mute', 'trumpet_stac', 'shaker', 'conga', 'claps']
cr = S.credits(used); open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix ok', mix.shape[0] / SR, 's')
