"""慢半拍 Half a Beat · score + foley -> mix.wav (48 kHz stereo, exactly DUR seconds).
Run from the library root:  .venv/bin/python styles/silhouette-rhythm/demo/audio.py   (build.sh does it)
Event times come from events.json (node core/render/events.mjs styles/silhouette-rhythm/demo). Writes out/mix.wav.

120 BPM (beat 0.5 s, bar 2 s). The sound of the story:
  adults' head-flags = a low log drum ON the beat; the young one = a bright woodblock, OFF the beat (late);
  in the count-in (32-34) the young one's woodblock finally lands on the beat.
Sections: groove (0-16.3) -> tension (16.5-18) -> stumbling run (18-21.5) -> record stop, silence (21.5-28)
-> the beat comes back one ring at a time (28-32) -> count-in + run, one instrument per step (32-35.5)
-> half a beat of silence -> the freeze hit + held chord (36-39) -> chorus in F (39-46) -> last chord, a late tik.
"""
import sys, os, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))   # styles/<slug>/demo -> library root
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, bp, noise, brown, norm, t_, env_exp, whoosh, thump

S.seed(11)
rng = np.random.default_rng(5)
D = json.load(open(os.path.join(HERE, 'events.json')))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
DUR = float(D['dur']); EV = D['ev']
N = int(round(DUR * SR))
B = 0.5
USED = set()
def evs(tp): return [e for e in EV if e['type'] == tp]

# ------------------------------------------------------------------ score (sampled)
ev = []
def E(t, inst, pitch, dur, vel, pan=0, gain=1.0):
    USED.add(inst); ev.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain))
def H(t, inst, var, vel, pan=0, gain=1.0):
    USED.add(inst); ev.append((t, inst, var, None, vel, pan, gain))
def kit(t, var, vel, pan=0, gain=1.0): H(t, 'drum_kit', var, vel, pan, gain)
kev = []   # hits that belong to the characters (flags, count-in, title): they survive the music cuts
def KH(t, inst, var, vel, pan=0, gain=1.0):
    USED.add(inst); kev.append((t, inst, var, None, vel, pan, gain))

CH = {  # (marimba tones, bass root)
    'Dm9':    (['D4', 'F4', 'A4', 'C5', 'E5'], 'D2'),
    'Bbmaj9': (['D4', 'F4', 'A4', 'Bb4', 'C5'], 'Bb1'),
    'F':      (['C4', 'F4', 'A4', 'C5', 'E5'], 'F1'),
    'C':      (['C4', 'E4', 'G4', 'C5', 'D5'], 'C2'),
    'Gm9':    (['D4', 'F4', 'G4', 'Bb4', 'A4'], 'G1'),
    'A7sus':  (['D4', 'E4', 'G4', 'A4', 'D5'], 'A1'),
}
RIFF = [(0, 0), (.75, 2), (1.5, 1), (2.0, 3), (2.5, 2), (3.25, 4)]   # (beat offset, chord tone), two bars

def groove(t0, t1, chords, marimba=True, bass=True, drums=True, claps=True, shaker=True, hats=True, vel=1.0, double=False):
    """chords: [(start, name, dur)], all inside [t0, t1)"""
    for c0, name, d in chords:
        tones, root = CH[name]
        if marimba:
            for bo, k in RIFF:
                tt = c0 + bo * B
                if c0 <= tt < min(c0 + d, t1) - 1e-6:
                    E(tt, 'marimba', tones[k], .3, (.6 + .1 * (bo == 0)) * vel, -.25 + .12 * k, .85)
        if bass:
            pat = [(0, 0, .85), (1.5, 12, .65), (3, 0, .7)] if not double else [(i * .5, 12 * (i % 2), .75 - .05 * (i % 2)) for i in range(8)]
            for bo, oc, v in pat:
                tt = c0 + bo * B
                if c0 <= tt < min(c0 + d, t1) - 1e-6:
                    E(tt, 'jazz_bass', S.midi(root) + oc + (12 if S.midi(root) < 31 else 0), .42, v * vel, 0, 1.1)
    k = 0; tt = t0
    while tt < t1 - 1e-6:
        if drums: kit(tt, 'kick_drum_left', (.85 if k % 4 == 0 else .72) * vel, 0, .9)
        if claps and k % 2 == 1: H(tt, 'claps', 'group', .7 * vel, 0, .5)
        k += 1; tt += B
    tt = t0; k = 0
    step = .125 if double else .25
    while tt < t1 - 1e-6:
        if shaker: H(tt, 'shaker', None, (.45 if k % 2 else .6) * vel, .35, .32)
        if hats and k % 2 == 1 and not double: kit(tt, 'hi_hat_open' if k % 4 == 3 else 'hi_hat_closed', .5 * vel, -.3, .38)
        k += 1; tt += step

# A 0-4: the hook. Kick + marimba only; the flags carry the rhythm. 3.5: everything stops for the stare.
groove(0, 3.5, [(0.0, 'Dm9', 2.0), (2.0, 'Bbmaj9', 1.5)], claps=False, hats=False, shaker=False, vel=.8)
# B 4-10: the march, full groove
groove(4.0, 10.0, [(4.0, 'Dm9', 2.0), (6.0, 'Bbmaj9', 2.0), (8.0, 'F', 1.0), (9.0, 'C', 1.0)])
for i, tt in enumerate([7.625, 7.75, 7.875]): kit(tt, ['tom_1', 'tom_2', 'tom_3'][i], .75, .35 - i * .35, .8)
kit(8.0, 'crash_left', .6, -.3, .5)
# C 10-12: the line-up: lighter (no hats), stomps on the snaps
groove(10.0, 12.0, [(10.0, 'Gm9', 1.0), (11.0, 'A7sus', 1.0)], hats=False, vel=.9)
tts = 11.5 + .48 * (1 - (1 - np.linspace(0, 1, 12)) ** 1.6)
for i, tt in enumerate(tts): kit(float(tt), 'snare_2', .3 + i * .04, 0, .55 + i * .02)
# D 12-16.3: take-off, double time
groove(12.0, 16.3, [(12.0, 'Dm9', 2.0), (14.0, 'Bbmaj9', 2.0), (16.0, 'C', .3)], double=True, claps=True)
for k in range(17):
    tt = 12.0 + k * .25
    if tt >= 16.3: break
    if k % 2: kit(tt, ['tom_2', 'tom_3'][k // 2 % 2], .45, .2 - .4 * (k // 2 % 2), .5)
kit(12.0, 'crash_right', .65, .3, .5)
kit(13.42, 'crash_left', .75, -.3, .6)
for e in evs('takeoff'):
    p = ['D5', 'E5', 'F5', 'A5', 'C6', 'D6', 'E6', 'F6'][e['i']]
    E(e['t'], 'marimba', p, .35, .62, e.get('pan', 0), .8)
    E(e['t'], 'glockenspiel', p, .8, .35, e.get('pan', 0), .25)
# E 16.5-18: left behind. A held low A, hats ticking, then nothing.
E(16.5, 'jazz_bass', 'A1', 1.0, .8, 0, 1.0)
E(16.5, 'cellos', 'A2', 1.1, .45, 0, .5)
for k in range(6): kit(16.5 + k * .125, 'hi_hat_closed', .3 - k * .03, -.2, .3)
# F 18-21.5: the first run. The band keeps the beat it can't match: kick + bass on the beat, the marimba scrambles.
for k in range(7):
    tt = 18.0 + k * B
    kit(tt, 'kick_drum_left', .7, 0, .8)
    if k % 2 == 0: E(tt, 'jazz_bass', 'D3', .4, .75, 0, 1.0)
    else: E(tt, 'jazz_bass', 'A2', .3, .6, 0, 1.0)
for i, p in enumerate(['D5', 'E5', 'F5', 'E5', 'D5', 'C5', 'D5', 'F5', 'G5', 'F5', 'E5', 'D5', 'E5', 'F5', 'A5', 'G5']):
    tt = 18.12 + i * .2 + .045 * np.sin(i * 2.3)   # a frantic figure, a little off the grid
    if tt < 21.2: E(float(tt), 'marimba', p, .2, .45, -.3 + .04 * i, .6)
# H 28-32: the beat comes back, one ring at a time (each ring = a drum hit + a rising note)
RING_NOTES = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'A5']
for e in evs('ringBeat'):
    i = e['i']; tt = e['t']
    kit(tt, 'kick_drum_left', .62 + .04 * i, 0, .85)
    H(tt, 'conga', 'tumba' if i % 2 == 0 else 'conga', .7, .15, .55)
    if i < 5: E(tt, 'kalimba', RING_NOTES[i], 1.2, .8, -.2 + .1 * i, 1.0)
    E(tt, 'marimba', RING_NOTES[i], .6, .5, -.2 + .1 * i, .55 if i < 5 else .9)
    if i >= 5: E(tt, 'glockenspiel', RING_NOTES[i], 1.0, .35, .2, .35)
for tt in [30.0, 31.0]: E(tt, 'jazz_bass', 'D2', .9, .7, 0, 1.0)
for k in range(8): H(31.0 + k * .125, 'shaker', None, .35 + .03 * k, .35, .3)
E(29.0, 'violins', 'A4', 3.0, .25, -.3, .3, ); E(29.0, 'violins', 'D5', 3.0, .22, .3, .25)
E(29.0, 'cellos', 'D3', 3.0, .3, 0, .35)
# I 32-34: the count-in: the young one's woodblock ON the beat, with a kick under each
for e in evs('count'): kit(e['t'], 'kick_drum_left', .75, 0, .9)
E(32.0, 'jazz_bass', 'G1', 1.0, .7, 0, 1.0); E(33.0, 'jazz_bass', 'G2', .9, .6, 0, 1.0)
tts = 33.5 + .48 * (1 - (1 - np.linspace(0, 1, 10)) ** 1.5)
for i, tt in enumerate(tts): kit(float(tt), 'snare_2', .3 + i * .05, 0, .55 + i * .02)
# J 34-35.5: the run, an instrument per beat; 35.5 everything drops out
groove(34.0, 35.5, [(34.0, 'A7sus', 1.5)], marimba=False, claps=False, shaker=False, hats=False)
groove(34.5, 35.5, [(34.5, 'A7sus', 1.0)], marimba=False, bass=False, drums=False, shaker=False, hats=False)
groove(35.0, 35.5, [(35.0, 'A7sus', .5)], bass=False, drums=False, claps=False, hats=True)
kit(34.0, 'crash_right', .55, .3, .45)
# K 36: the freeze. One hit, then a held F chord (the lift into the relative major)
FZ = 36.0
kit(FZ, 'kick_drum_left', 1.0, 0, 1.1); kit(FZ, 'crash_right', .95, .25, .8); kit(FZ, 'china', .7, -.3, .4)
H(FZ, 'bass_drum', None, .9, 0, .8)
for i, p in enumerate(['F3', 'C4', 'E4', 'G4', 'A4']): E(FZ, 'violins', p, 3.0, .55, -.5 + i * .25, .55)
for p in ['F2', 'C3']: E(FZ, 'cellos', p, 3.0, .55, 0, .6)
for i, p in enumerate(['F4', 'A4', 'C5', 'E5', 'G5']): E(FZ + i * .03, 'vibraphone', p, 2.5, .6, -.4 + i * .2, .55)
E(FZ, 'harp', 'F2', 3.0, .7, 0, .6)
# L 39-46: the chorus in F: they fly together
UF = 39.0
kit(UF, 'kick_drum_left', .95, 0, 1.0); kit(UF, 'crash_left', .8, -.3, .6)
groove(39.0, 46.0, [(39.0, 'F', 2.0), (41.0, 'C', 2.0), (43.0, 'Bbmaj9', 2.0), (45.0, 'C', 1.0)])
for i, p in enumerate(['A3', 'C4', 'F4']): E(39.0, 'violins', p, 7.0, .35, -.3 + .3 * i, .32)
E(39.0, 'cellos', 'F2', 4.0, .4, 0, .4); E(43.0, 'cellos', 'Bb1', 3.0, .4, 0, .4)
# title words: an adult's log drum for HALF and A, the young one's woodblock for BEAT (late), a glockenspiel for 慢半拍
for e in evs('wordZh'): E(e['t'], 'glockenspiel', 'A6', 1.6, .45, .2, .45); E(e['t'] + .1, 'glockenspiel', 'F6', 1.6, .35, -.2, .35)
for e in evs('line'): E(e['t'], 'hand_chimes', 'C6' if e['t'] < 44.8 else 'F5', 2.0, .35, 0, .35)
# M 46: the last chord, then one late tik (the young one, half a beat after)
E(46.0, 'jazz_bass', 'F1', 2.5, .8, 0, 1.1); kit(46.0, 'kick_drum_left', .85, 0, .9); kit(46.0, 'crash_right', .55, .25, .5)
for i, p in enumerate(['F4', 'A4', 'C5', 'E5', 'G5']): E(46.0 + i * .025, 'marimba', p, 1.5, .6, -.4 + .2 * i, .7); E(46.0 + i * .03, 'vibraphone', p, 3.0, .5, -.4 + .2 * i, .5)
for i, p in enumerate(['F3', 'C4', 'A4']): E(46.0, 'violins', p, 2.8, .4, -.3 + .3 * i, .4)

# flags: adults (log drum, on the beat) and the young one (woodblock, late)
for e in evs('flagA'): KH(e['t'], 'log_drum', 'hi', .55 if e.get('soft') else .85, -.15, .7 if e.get('soft') else 1.0)
for e in evs('bobA'): KH(e['t'], 'log_drum', 'lo', .4, -.15, .45)
for e in evs('flagY'):
    v = .5 if e.get('soft') else .9
    if e.get('last'): v = .75
    KH(e['t'], 'woodblock', 'b', v, .3, .75 if e.get('soft') else 1.0)
for e in evs('count'): KH(e['t'], 'woodblock', 'b', .95, .2, 1.0)
for e in evs('word'): KH(e['t'], 'log_drum', 'hi', .8, -.3, .9)
for e in evs('wordLate'): KH(e['t'], 'woodblock', 'b', .9, .3, 1.0)
for e in evs('bonk'): KH(e['t'], 'woodblock', 'a', .6, .2, .5)
for e in evs('snap'): H(e['t'], 'claps', 'group', .8, 0, .6); H(e['t'], 'cajon', 'bass', .7, 0, .6)

# groove bus: cut at the record stop (21.5) and at the half-beat drop (35.5); hold bus rings on
def tof(e): return e['t'] if isinstance(e, dict) else e[0]
music_ev = ev
m = S.render(music_ev, dur=DUR + 2, master=False)
music = np.zeros((N + SR * 2, 2)); music[:len(m)] += m
def cut(buf, t, fade=.02, until=None):
    a = int(t * SR); f = int(fade * SR); b = int(until * SR) if until else len(buf)
    buf[a:a + f] *= np.linspace(1, 0, f)[:, None]; buf[a + f:b] = 0
# keep the reverb tails: a wet copy decays across each cut
wet = S.room(music.astype(np.float32), size=.7, mix=1.0)
tail = np.zeros_like(music)
for t0, d in [(21.5, .5), (35.5, .35), (3.5, .25)]:
    a = int(t0 * SR); n = int(1.5 * SR)
    tail[a:a + n] += wet[a:a + n] * np.exp(-np.arange(n) / (d * SR))[:, None] * .5
# the stare: 3.5-4.0 only the young one's sheepish tik survives (it is in the foley-ish woodblock events, re-rendered below)
cut(music, 3.5, .015, 4.0 - .005)
cut(music, 21.5, .012, 28.0 - .01)
cut(music, 35.5, .012, FZ - .004)
music = S.room(music.astype(np.float32), size=.38, mix=.14) + tail
k = S.render(kev, dur=DUR + 2, master=False)
keep = np.zeros((N + SR * 2, 2)); keep[:len(k)] += k
keep = S.room(keep.astype(np.float32), size=.35, mix=.12)
music = music[:N]; keep = keep[:N]

# ------------------------------------------------------------------ foley
fx = np.zeros((N, 2))
def splash(v=1.0, size=1.0):
    d = .35 * size; tt = t_(d)
    hit = bp(noise(d), 700, 7000) * env_exp(d, .03 * size)
    body = lp(noise(d), 900) * env_exp(d, .06 * size) * .6
    plip = np.sin(2 * np.pi * np.cumsum(900 + 1400 * np.exp(-tt / .02)) / SR) * env_exp(d, .025) * .35
    bub = np.zeros_like(tt)
    for k in range(int(4 * size)):
        s = int((.03 + rng.random() * .15 * size) * SR); f = 1200 + rng.random() * 1800; bd = .03
        b = np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.6, int(bd * SR))) / SR) * env_exp(bd, .008)
        bub[s:s + len(b)] += b[:len(bub) - s] * .3
    return norm(hit + body + plip + bub) * v
def flap(v=1.0, d=.32, lo=250, hi=2600):  # feathery whoosh pair
    tt = t_(d)
    x = lp(bp(noise(d), lo, hi), 1800) * np.sin(np.pi * tt / d) ** 1.5
    y = np.zeros(int((d + .2) * SR)); y[:len(x)] += x; y[int(.12 * SR):int(.12 * SR) + len(x)] += x * .8
    return norm(y) * v
def wing(v=1.0, d=.22):  # one wingbeat: a soft low push
    tt = t_(d); x = lp(bp(noise(d), 120, 1400), 900) * np.sin(np.pi * tt / d) ** 2
    return norm(x) * v
def drip(v=1.0):
    d = .12; tt = t_(d); f = 1100 + 1500 * np.exp(-tt / .015)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .03)) * v
def scratch():
    d = .32; tt = t_(d)
    f = 900 * (1 + .9 * np.sin(2 * np.pi * 9 * tt)) * np.exp(-tt / .25)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    x = bp(saw * .6 + noise(d) * .5, 300, 5000) * np.minimum(1, tt / .01) * np.exp(-tt / .22)
    return norm(x)
def slide_down(d=.4):
    tt = t_(d); f = 1700 * (500 / 1700) ** (tt / d) * (1 + .03 * np.sin(2 * np.pi * 14 * tt))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / .02) * np.exp(-tt / (d * .8)))
def honk(v=1.0):  # a distant flamingo call: two nasal syllables
    out = np.zeros(int(.5 * SR))
    for k, (st, f0) in enumerate([(0, 620), (.2, 560)]):
        d = .16; tt = t_(d); f = f0 * (1 + .06 * np.sin(np.pi * tt / d))
        saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
        x = (bp(saw, 900, 1300) + .6 * bp(saw, 2200, 2800)) * np.sin(np.pi * tt / d) ** .6
        s = int(st * SR); out[s:s + len(x)] += x
    return norm(lp(out, 2400)) * v
def gulp():
    d = .18; tt = t_(d); f = 300 * (1 + 1.2 * np.sin(np.pi * tt / d))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d))
def water_amb(d):
    b = lp(brown(d), 600) * (.6 + .4 * np.sin(2 * np.pi * .37 * t_(d))) + bp(noise(d), 1500, 5000) * .05 * (.5 + .5 * np.sin(2 * np.pi * .9 * t_(d) + 1))
    return norm(b)
def wind(d):
    x = bp(noise(d), 200, 1200) * (.55 + .45 * np.sin(2 * np.pi * .13 * t_(d)) * np.sin(2 * np.pi * .071 * t_(d) + 1))
    return norm(lp(x, 900))
def reverse_cym():
    x = S.hit('drum_kit', 'crash_right', .8)
    x = x[:int(.65 * SR)][::-1] * np.linspace(0, 1, int(.65 * SR)) ** 2
    return x

pan_r = lambda: float(np.clip(rng.normal(0, .4), -.8, .8))
for e in evs('splash'): add(fx, splash(1.0, .8), e['t'] - .01, .15 * (6 / e['z']) ** 1.2, pan_r())
for e in evs('splashY'): add(fx, splash(1.0, .6), e['t'] - .01, .14 if e.get('run') else .1, -.3 + .1 * rng.random())
for e in evs('splashRun'): add(fx, splash(1.0, 1.0), e['t'] - .01, .22, .1)
for e in evs('patter'): add(fx, splash(1.0, .55), e['t'] - .01, .05, pan_r())
for e in evs('stepBeat'): add(fx, splash(1.0, 1.0), e['t'] - .005, .26 + .02 * e['k'], -.2 + .05 * e['k'])
for e in evs('hop'): add(fx, splash(1.0, .5), e['t'], .08, .25)
for e in evs('flapBig'): add(fx, flap(1.0), e['t'] - .05, .28 * e.get('v', 1), .1)
for e in evs('flapSmall'): add(fx, flap(1.0, .18, 600, 4000), e['t'], .12, -.1)
for e in evs('takeoff'): add(fx, flap(1.0), e['t'] - .05, .2, e.get('pan', 0))
for e in evs('wingbeat'): add(fx, wing(1.0), e['t'] - .06, .12 * e.get('v', 1), .15)
for e in evs('wingbeatY'): add(fx, wing(1.0, .14), e['t'] - .04, .16 if e.get('near') else .07, -.2)
for e in evs('drip'): add(fx, drip(1.0), e['t'], .22, .1)
for e in evs('shake'): add(fx, splash(1.0, .5), e['t'], .1, .1); add(fx, flap(1.0, .12, 1500, 6000), e['t'], .06, 0)
for e in evs('bonk'): add(fx, thump(1, 180), e['t'], .25, .2)
for e in evs('bump'): add(fx, thump(1, 120), e['t'], .35, -.1); add(fx, flap(1.0, .16, 500, 3000), e['t'] + .02, .12, -.1)
for e in evs('turn'): add(fx, whoosh(.45, 1.0), e['t'] - .1, .3, 0)
for e in evs('turnY'): add(fx, whoosh(.2, 1.0), e['t'], .14, -.3)
for e in evs('wipe'): add(fx, lp(whoosh(.4, 1.0), 1500), e['t'], .4, .3)
for e in evs('whip'): add(fx, whoosh(.3, 1.0), e['t'] - .05, .45, -.5)
for e in evs('look'): add(fx, whoosh(.12, 1.0), e['t'], .08, .2)
for e in evs('gulp'): add(fx, gulp(), e['t'], .12, -.1)
for e in evs('lookUp'): add(fx, honk(1.0), e['t'] + .1, .05, .4)
for e in evs('liftoff'): add(fx, flap(1.0, .42), e['t'] - .08, .35, .1)
for e in evs('trip'): add(fx, slide_down(.45), e['t'], .12, 0); add(fx, thump(1, 90), e['t'], .2, 0)
for e in evs('scratch'): add(fx, scratch(), e['t'] - .02, .35, 0)
for e in evs('plop'): add(fx, splash(1.0, 1.8), e['t'] - .02, .45, -.1); add(fx, thump(1, 60), e['t'], .3, 0)
for e in evs('freeze'): add(fx, flap(1.0, .4), e['t'] - .06, .5, -.1); add(fx, thump(1, 46), e['t'], .6, 0)
for e in evs('reverse'): add(fx, reverse_cym(), e['t'], .5, 0)
for e in evs('unfreeze'): add(fx, flap(1.0, .4), e['t'] - .04, .45, .1)
for e in evs('word') + evs('wordLate'): add(fx, splash(1.0, .5), e['t'] + .1, .08, -.3)
# far flamingo calls in the silence, moving away
for tt, g in [(23.2, .05), (24.6, .035), (26.0, .022)]: add(fx, honk(1.0), tt, g, .45)
# ambience: water + wind under everything; up a little in the silences and the freeze
amb = water_amb(DUR) * .03
wnd = wind(DUR) * .022
ae = np.ones(N)
for a, b, g in [(21.5, 28.0, 1.9), (35.5, 36.0, 1.6), (36.0, 39.0, 1.5)]: ae[int(a * SR):int(b * SR)] = g
fx[:, 0] += (amb + wnd) * ae; fx[:, 1] += (np.roll(amb, 1777) + np.roll(wnd, 911)) * ae


# ------------------------------------------------------------------ mix
mix = music * .55 + keep * .6 + fx
for c in range(2): mix[:, c] = hp(mix[:, c], 35)
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))[:, None]

def lufs(x):
    p = os.path.join(OUT, '.tmp_meas.wav'); sf.write(p, x.astype(np.float32), SR)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.remove(p); line = [l for l in out.splitlines() if l.strip().startswith('I:')][-1]
    return float(line.split()[1])
TARGET, CEIL = -16.0, 10 ** (-4.5 / 20)   # headroom so the -14 LUFS master keeps its true peak under -1.2 dB
for _ in range(3):
    g = 10 ** ((TARGET - lufs(mix)) / 20); mix = mix * g
    for c in range(2): mix[:, c] = limit(mix[:, c], CEIL)
L = lufs(mix)
mix = mix[:N].astype(np.float32)
assert mix.shape == (N, 2)
sf.write(os.path.join(OUT, 'mix.wav'), mix, SR, subtype='PCM_24')
print('mix.wav %.3f s; peak %.2f dBFS; integrated %.1f LUFS' % (len(mix) / SR, 20 * np.log10(np.abs(mix).max()), L))
db = lambda v: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)
print('per 1 s  music / fx (dB, before loudness gain):')
print(' '.join('%d:%.0f/%.0f' % (i // SR, db(music[i:i + SR] * .55), db(fx[i:i + SR])) for i in range(0, N, SR)))
print('\n'.join(S.credits(sorted(USED))))
