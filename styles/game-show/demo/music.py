# Score for "AI 进化节拍" (AI Evolution Beat), second cut: 150 BPM, royal road progression (王道进行) Fmaj7–G7–Em7–Am7; SFX and voices read from events.json
import json, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'   # python music.py [out.wav]
import synth_lib as S
from synth_lib import *

BEAT = 60 / 150
BAR = 4 * BEAT
at = lambda bar, beat=0: (bar * 4 + beat) * BEAT
EVJ = json.load(open('events.json'))
TOTAL = EVJ['dur']

# Voice/SFX bus (used to duck the music)
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414

def load(name):
    w = wave.open(f'voices/{name}.wav'); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return x / (np.max(np.abs(x)) + 1e-9)
VO = {n: load(n) for n in ['title', 'count1', 'count2', 'count3', 'count4', 'gameover', 'move37', 'whoa', 'attention', 'gpt1', 'gpt2', 'gpt3',
                           'hey_a', 'hey_b', 'hey_c', 'hey_d', 'hey_e', 'hey_f', 'wrong', 'aha', 'cheaper', 'remix', 'next', 'encore',
                           'question', 'final', 'mask', 'paint', 'action', 'cut', 'done', 'hi',
                           'physical', 'robots', 'double', 'gemini', 'sonnet', 'march', 'v4', 'liftoff']}

# ---------------- Instruments ----------------
def square_lead(m, dur=0.2, vib=0.004):
    n = int(dur * SR); t = np.arange(n) / SR
    f = mtof(m) * (1 + vib * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f) / SR
    s = np.sign(np.sin(2 * np.pi * ph)) * 0.5 + 0.5 * np.sin(2 * np.pi * ph)
    s = lp(s, 3500)
    return s * np.minimum(1, t / 0.005) * np.clip((dur - t) / 0.03, 0, 1) * 0.45

def brass_stab(ms, dur=0.16):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for d in (-0.08, 0.08):
            ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR
            s += 2 * (ph % 1) - 1
    s /= len(ms) * 2
    # Filter envelope: bright at the start, darkens quickly
    bright = lp(s, 4000); dark = lp(s, 900)
    k = np.exp(-t * 25)
    out = bright * k + dark * (1 - k)
    return out * np.minimum(1, t / 0.004) * np.clip((dur - t) / 0.04, 0, 1) * 0.8

def slap(m, dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    ph = 2 * np.pi * f * t
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) * np.exp(-t * 30) + 0.3 * (2 * ((f * t) % 1) - 1) * np.exp(-t * 20)
    return lp(s, 1600) * np.minimum(1, t / 0.003) * np.exp(-t * 7) * 0.7

def arp(m, dur=0.1):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * mtof(m) * t))
    return lp(s, 5000) * np.exp(-t * 28) * 0.3

def woodblock(f=1100):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.6 * t)) * np.exp(-t * 55) * 0.8

def cowbell():
    n = int(0.25 * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 560 * t)) + np.sign(np.sin(2 * np.pi * 845 * t))
    return bp(s, 500, 3000) * np.exp(-t * 14) * 0.3

def crash(dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 3500) * np.exp(-t * 2.8) * 0.35

def bleep():
    n = int(0.14 * SR); t = np.arange(n) / SR
    f = 1400 - 600 * t / 0.14
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 18) * 0.35 + snare()[:n] * 0.3

def stone():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2300 * t) * 0.6 + bp(rng.standard_normal(n), 2000, 8000)) * np.exp(-t * 70)

def puff(dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 1200) * np.sin(np.pi * t / dur) ** 2 * 0.6

def pssh(dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    return bp(x, 1500, 7000) * np.exp(-t * 9) * 0.7

def buzz():
    n = int(0.45 * SR); t = np.arange(n) / SR
    return lp(np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 116 * t)), 1500) * np.clip((0.45 - t) / 0.05, 0, 1) * 0.35

def ding():
    return bell(96, 1.2) * 0.6 + np.concatenate([np.zeros(int(0.09 * SR)), bell(100, 1.2) * 0.6])[: int(1.2 * SR)]

def clank():
    n = int(0.5 * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in (820, 1290, 2130, 3370): s += np.sin(2 * np.pi * f * t) * np.exp(-t * 9)
    return s / 4 * 0.6

def fanfare(t0):
    for k, m in enumerate([72, 76, 79, 84]): add(brass_stab([m, m + 4], 0.16), t0 + k * BEAT / 3, 0.6)
    add(brass_stab([72, 76, 79, 84], 1.2), t0 + BEAT * 4 / 3, 0.7)
    add(crash(2.0), t0, 0.8)

# ---------------- Arrangement ----------------
CH = [('F', 41, [65, 69, 72, 76]), ('G', 43, [67, 71, 74, 77]), ('Em', 40, [64, 67, 71, 74]), ('Am', 45, [60, 64, 67, 69])]
MA = [[72, 0, 74, 76, 0, 79, 76, 74], [74, 0, 76, 79, 0, 81, 79, 76], [76, 0, 79, 83, 81, 79, 76, 0], [81, 79, 76, 74, 76, 0, 72, 0]]
MB = [[84, 0, 81, 84, 0, 88, 86, 84], [86, 0, 83, 86, 0, 91, 88, 86], [88, 86, 83, 79, 83, 0, 86, 88], [84, 0, 81, 0, 79, 76, 79, 81]]

def drums(t0, kick_pat=(0, 2), snare_pat=(1, 3), hats=8, open_last=True, g=1.0, extra_kick=True):
    for k in kick_pat: add(kick(), t0 + k * BEAT, 0.85 * g)
    if extra_kick: add(kick(0.7), t0 + 2.5 * BEAT, 0.5 * g)
    for k in snare_pat: add(snare(), t0 + k * BEAT, 0.5 * g); add(clap(), t0 + k * BEAT, 0.35 * g, 0.15)
    for k in range(hats):
        step = 4 / hats
        add(hat(open_last and k == hats - 1), t0 + k * step * BEAT + (0.012 if k % 2 else 0), 0.45 * g, 0.35)

def bassline(t0, root, style='funk', g=1.0):
    pats = {
        'funk': [(0, 0), (0.75, 12), (1.5, 0), (2, 7), (2.5, 12), (3.25, 0), (3.5, 10)],
        'drive': [(k * 0.5, 0 if k % 2 == 0 else 12) for k in range(8)],
        'pump': [(0, 0), (1, 0), (2, 0), (3, 0)],
        'soft': [(0, 0), (2, 7)],
    }
    for b, o in pats[style]: add(slap(root + o, 0.18 if style != 'soft' else 0.6), t0 + b * BEAT, 0.6 * g)

def melody(t0, pat, inst='lead', g=1.0, octave=0):
    for k, m in enumerate(pat):
        if not m: continue
        m += octave
        if inst == 'lead': add(square_lead(m, 0.19), t0 + k * BEAT / 2, 0.42 * g, -0.15)
        elif inst == 'pluck': add(pluck(m, 0.25), t0 + k * BEAT / 2, 0.4 * g, 0.2)
        elif inst == 'bell': add(bell(m, 0.8), t0 + k * BEAT / 2, 0.22 * g, 0.3)

def jingle(t0):
    # Level card (1 bar): brass arpeggio + crash + snare fill on the last beat
    add(crash(), t0, 0.7); add(kick(), t0, 0.9)
    for k, m in enumerate([72, 76, 79, 84]): add(brass_stab([m, m - 5], 0.14), t0 + k * BEAT / 2, 0.55)
    add(brass_stab([72, 76, 79, 84], 0.35), t0 + 2 * BEAT, 0.6)
    for k in range(4): add(snare(), t0 + 3 * BEAT + k * BEAT / 4, 0.25 + 0.1 * k)

PLAN = {}
def span(a, b, mode):
    for bar in range(a, b + 1): PLAN[bar] = mode
span(0, 2, 'main'); PLAN[3] = 'count'
span(5, 12, 'funk')
span(14, 20, 'quiz'); PLAN[21] = 'popBig'
span(23, 26, 'electro'); span(27, 29, 'electro'); PLAN[30] = 'electroBuild'
span(32, 37, 'dream'); span(38, 39, 'film')
span(41, 44, 'pop'); span(45, 48, 'popBig')
span(50, 53, 'think'); span(54, 57, 'heavy')
span(59, 62, 'agent'); span(63, 66, 'agentFast')
PLAN[67] = 'fill'
span(68, 81, 'future'); span(82, 83, 'futureBig')
span(84, 85, 'egg'); span(86, 88, 'calm'); PLAN[89] = 'fanfare'; PLAN[90] = 'end'
for c in (4, 13, 22, 31, 40, 49, 58): jingle(at(c))

for bar, mode in PLAN.items():
    t0 = at(bar); name, root, ch = CH[bar % 4]; ci = bar % 4
    if mode == 'main':
        if bar == 0: add(crash(), t0, 0.8)
        drums(t0); bassline(t0, root, 'funk'); melody(t0, MA[ci], 'lead')
        for b in (1.5, 3.5): add(brass_stab(ch, 0.14), t0 + b * BEAT, 0.4)
    elif mode == 'count':
        for k in range(4): add(kick(), t0 + k * BEAT, 0.8); add(hat(), t0 + k * BEAT + BEAT / 2, 0.35)
        add(pad([m for m in ch], BAR), t0, 0.12)
    elif mode == 'funk':
        drums(t0); bassline(t0, root, 'funk')
        for b in (0.5, 1.5, 2.5, 3.5): add(brass_stab(ch, 0.1), t0 + b * BEAT, 0.25)
        melody(t0, MA[ci], 'pluck', 0.9)
        add(cowbell(), t0 + 1.5 * BEAT, 0.5, 0.4)
    elif mode in ('electro', 'electroBuild'):
        drums(t0, kick_pat=(0, 1, 2, 3), extra_kick=False, hats=16 if mode == 'electro' else 8)
        bassline(t0, root, 'drive')
        tones = ch + [c + 12 for c in ch]
        for k in range(16): add(arp(tones[(k * 3) % len(tones)] + 12, 0.1), t0 + k * BEAT / 4, 0.6, 0.3 * (1 if k % 2 else -1))
        if bar >= 20: melody(t0, MA[ci], 'lead', 0.7)
        if mode == 'electroBuild':
            for k in range(8): add(snare(), t0 + 2 * BEAT + k * BEAT / 4, 0.2 + 0.06 * k)
    elif mode in ('pop', 'popBig'):
        drums(t0, g=1.05 if mode == 'popBig' else 1.0)
        bassline(t0, root, 'drive')
        add(pad([m + 12 for m in ch], BAR), t0, 0.12)
        for b in (0.5, 1.5, 2.5, 3.5): add(brass_stab(ch, 0.12), t0 + b * BEAT, 0.35)
        melody(t0, (MB if mode == 'popBig' else MA)[ci], 'lead', 0.8)
        if mode == 'popBig': add(crash(1.0), t0, 0.35)
    elif mode == 'quiz':
        drums(t0, kick_pat=(0, 2), extra_kick=True)
        bassline(t0, root, 'drive')
        for b in (1, 3): add(brass_stab(ch, 0.14), t0 + b * BEAT, 0.45)
        add(cowbell(), t0 + 0.5 * BEAT, 0.35, 0.4); add(cowbell(), t0 + 2.5 * BEAT, 0.35, 0.4)
        melody(t0, MA[ci], 'pluck', 0.8)
    elif mode in ('dream', 'film'):
        add(kick(), t0, 0.7); add(kick(0.7), t0 + 2 * BEAT, 0.55)
        for k in (1, 3): add(clap(), t0 + k * BEAT, 0.3, 0.15)
        for k in range(8): add(hat(), t0 + k * BEAT / 2, 0.3, 0.3)
        add(pad([m + 12 for m in ch], BAR), t0, 0.16)
        bassline(t0, root, 'soft')
        tones = ch + [c + 12 for c in ch]
        for k in range(8): add(bell(tones[(k * 2) % len(tones)] + 12, 0.6), t0 + k * BEAT / 2, 0.12, 0.4 * (1 if k % 2 else -1))
        melody(t0, MA[ci], 'lead' if mode == 'film' else 'bell', 0.7)
    elif mode in ('agent', 'agentFast'):
        drums(t0, kick_pat=(0, 1, 2, 3), extra_kick=False, hats=16, g=1.05)
        bassline(t0, root, 'drive', 1.1)
        tones = ch + [c + 12 for c in ch]
        for k in range(16): add(arp(tones[(k * 5) % len(tones)] + 12, 0.08), t0 + k * BEAT / 4, 0.5, 0.3 * (1 if k % 2 else -1))
        melody(t0, (MB if mode == 'agentFast' else MA)[ci], 'lead', 0.75)
    elif mode == 'egg':
        add(pad([m + 12 for m in ch], BAR), t0, 0.16)
        add(kick(0.6), t0, 0.5)
        for k in range(4): add(hat(), t0 + k * BEAT + BEAT / 2, 0.2, 0.3)
    elif mode in ('future', 'futureBig'):
        # Up 2 semitones: sing out 2026
        TR = 2; ch2 = [c + TR for c in ch]; rt = root + TR
        if bar == 68: add(crash(), t0, 0.9)
        drums(t0, g=1.12 if mode == 'future' else 1.2, kick_pat=(0, 1, 2, 3) if mode == 'futureBig' else (0, 2))
        bassline(t0, rt, 'funk', 1.1)
        add(pad([c + 12 for c in ch2], BAR), t0, 0.15)
        for b in (0.5, 1.5, 2.5, 3.5): add(brass_stab(ch2, 0.12), t0 + b * BEAT, 0.4)
        melody(t0, [m + TR if m else 0 for m in MB[ci]], 'lead', 0.85)
        melody(t0, [m + TR if m else 0 for m in MA[ci]], 'bell', 0.8, 12)
        if mode == 'futureBig': add(crash(1.2), t0, 0.4)
    elif mode == 'think':
        add(kick(), t0, 0.8); add(kick(0.7), t0 + 2 * BEAT, 0.5)
        for k in range(8): add(hat(), t0 + k * BEAT / 2, 0.3, 0.3)
        add(pad([m + 12 for m in ch], BAR), t0, 0.12)
        bassline(t0, root, 'soft')
        melody(t0, [m if i % 2 == 0 else 0 for i, m in enumerate(MA[ci])], 'bell')
    elif mode == 'heavy':
        drums(t0, kick_pat=(0, 1, 2, 3), extra_kick=False, g=1.15)
        bassline(t0, root - 0, 'pump', 1.2)
        for b in (0, 2): add(brass_stab([c - 12 for c in ch], 0.3), t0 + b * BEAT, 0.5)
        melody(t0, MA[ci], 'lead', 0.7, -12)
    elif mode == 'fill':
        for k in range(16): add(snare(), t0 + k * BEAT / 4, 0.18 + 0.03 * k)
        for k in range(4): add(kick(), t0 + k * BEAT, 0.7)
        add(crash(), t0, 0.6)
    elif mode == 'full':
        if bar == 45: add(crash(), t0, 0.9)
        drums(t0, g=1.1); bassline(t0, root, 'funk', 1.1)
        add(pad([m + 12 for m in ch], BAR), t0, 0.14)
        for b in (0.5, 1.5, 2.5, 3.5): add(brass_stab(ch, 0.12), t0 + b * BEAT, 0.38)
        melody(t0, MB[ci], 'lead', 0.85)
        melody(t0, MA[ci], 'bell', 0.8, 12)
        if bar == 52: add(crash(), t0 + 3 * BEAT, 0.9)
    elif mode == 'calm':
        add(pad([m + 12 for m in ch], BAR), t0, 0.14)
        bassline(t0, root, 'soft', 0.8)
        add(kick(0.6), t0, 0.5); add(kick(0.6), t0 + 2 * BEAT, 0.4)
        for k in range(4): add(hat(), t0 + k * BEAT + BEAT / 2, 0.25, 0.3)
        for k, m in enumerate(ch): add(bell(m + 12, 1.0), t0 + k * BEAT, 0.14, -0.3 + 0.2 * k)
    elif mode == 'fanfare':
        fanfare(t0); drums(t0, g=1.0); bassline(t0, root, 'funk')
    elif mode == 'end':
        for k, m in enumerate([60, 64, 67, 72, 76, 79]): add(bell(m + 12, 3.0), t0 + k * 0.05, 0.2, -0.5 + 0.2 * k)
        add(pad([60, 64, 67, 72], 3.4), t0, 0.16); add(crash(2.4), t0, 0.5)

# ---------------- Events → SFX / voices ----------------
HEYS = ['hey_b', 'hey_c', 'hey_d', 'hey_e', 'hey_f']
for e in EVJ['ev']:
    t, s = e['t'], e['s']
    f = e.get('f', 900)
    if s.startswith('v:'):
        v = s[2:]
        if v == 'hey': addv(VO['hey_a'], t - 0.02, 0.8)
        elif v == 'crowd':
            for i, h in enumerate(HEYS): addv(VO[h], t - 0.02 + i * 0.006, 0.28, -0.6 + 0.3 * i)
        elif v in ('heyAll', 'heyBig'):
            for i, h in enumerate(['hey_a'] + HEYS): addv(VO[h], t - 0.02 + i * 0.005, 0.3 if v == 'heyAll' else 0.4, -0.6 + 0.24 * i)
        elif v.startswith('count'): addv(VO[v], t - 0.02, 0.9)
        elif v == 'heyVar': addv(VO[['hey_a', 'hey_b', 'hey_c', 'hey_d', 'hey_e', 'hey_f'][e.get('i', 0) % 6]], t - 0.02, 0.6)
        else: addv(VO[v], t - 0.03, 0.85)
        continue
    if s == 'slam': addv(stamp(big=True), t, 0.5); add(crash(), t, 0.5)
    elif s == 'pop': addv(pop(f), t, 0.25)
    elif s == 'whoosh': addv(whoosh(0.4), t - 0.2, 0.3)
    elif s == 'tock': addv(woodblock(1000), t, 0.7, -0.3)
    elif s == 'bleep': addv(bleep(), t, 0.6, 0.3)
    elif s == 'stone': addv(stone(), t, 0.7, 0.1)
    elif s == 'bigslam': addv(stamp(big=True), t, 0.8); addv(sparkle(), t, 0.5); add(crash(), t, 0.6)
    elif s == 'poof': addv(puff(), t - 0.1, 0.6)
    elif s == 'swish': addv(whoosh(0.2), t - 0.05, 0.25)
    elif s == 'punch': addv(kick(), t, 0.6); addv(clap(), t, 0.5); addv(pop(300), t, 0.4)
    elif s == 'pump': addv(pssh(), t, 0.6); addv(boing(200, 350, 0.25), t, 0.25)
    elif s == 'land': addv(plop(), t, 0.7); addv(boing(260, 520, 0.3), t, 0.3)
    elif s == 'pip': addv(pop(f + 400), t, 0.18, rng.uniform(-.5, .5))
    elif s == 'tick': addv(woodblock(1500), t, 0.45); addv(key_click(), t, 0.4)
    elif s == 'buzz': addv(buzz(), t, 0.7)
    elif s == 'ding': addv(ding(), t, 0.6)
    elif s == 'hammer': addv(stamp(), t, 0.7); addv(clank(), t, 0.5)
    elif s == 'clack': addv(key_click(), t, 0.7, rng.uniform(-.3, .3))
    elif s == 'kickhit': addv(kick(), t, 0.7); add(crash(0.6), t, 0.3)
    elif s == 'type': addv(key_click(), t, 0.35)
    elif s == 'boop': addv(pop(260), t, 0.35); addv(buzz()[: int(0.12 * SR)], t, 0.3)
    elif s == 'cheer':
        n = int(1.5 * SR); tt = np.arange(n) / SR; addv(bp(rng.standard_normal(n), 400, 3000) * np.sin(np.pi * tt / 1.5) * 0.5, t, 0.6)
    elif s == 'splat': addv(plop(), t, 0.5); addv(pssh(0.1), t, 0.3)
    elif s == 'denoise': addv(pssh(0.18)[::-1], t - 0.12, 0.35); addv(pop(1400), t, 0.2)
    elif s == 'clap': addv(woodblock(700), t, 0.8); addv(clap(), t, 0.5)
    elif s == 'stamp': addv(stamp(), t, 0.45)
    elif s == 'crack': addv(stone(), t, 0.7); addv(key_click(), t, 0.5)
    elif s == 'hatch': addv(stamp(), t, 0.5); addv(sparkle(), t, 0.6); add(crash(), t, 0.4)
    elif s == 'fall': addv(slide_whistle(1400, 300, 0.4) if 'slide_whistle' in dir() else boing(500, 150, 0.4), t, 0.4); addv(plop(), t + 0.25, 0.8)
    elif s == 'drop': addv(pop(f), t, 0.3); addv(woodblock(900), t, 0.4)
    elif s == 'servo':
        n = int(0.16 * SR); tt = np.arange(n) / SR; addv(lp(np.sign(np.sin(2 * np.pi * np.cumsum(300 + 900 * tt / 0.16) / SR)), 2500) * np.exp(-tt * 12) * 0.25, t, 0.6)
    elif s == 'step': addv(kick(0.5)[: int(0.1 * SR)], t, 0.35); addv(key_click(), t, 0.3)
    elif s == 'liftoff': addv(whoosh(1.2), t, 0.8); addv(stamp(big=True), t, 0.6); add(crash(2.0), t, 0.5)
    elif s == 'boing': addv(boing(200, 600, 0.4), t, 0.5)
    elif s == 'fanfare': pass
    elif s == 'blip': addv(pop(f), t, 0.15)

# ---------------- Mix: voices duck the music ----------------
vmono = np.abs(VL) + np.abs(VR)
env = lp(vmono, 12, order=1)
env = env / (np.max(env) + 1e-9)
duck = 1 - 0.4 * np.clip(env * 3, 0, 1)
mix = np.stack([S.L * duck + VL, S.R * duck + VR])
t = np.arange(S.N) / SR
mix *= np.clip((TOTAL - t) / 0.8, 0, 1)
mix = mix[:, : int(TOTAL * SR) + 1]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.5
mix = np.tanh(mix) * 0.9
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(out.tobytes()); w.close()
print('ok', OUT, out.shape, 'events', len(EVJ['ev']))
