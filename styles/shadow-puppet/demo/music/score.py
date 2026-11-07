"""Original score for "Hou Yi Shoots the Suns": luogu jing (锣鼓经, Chinese-opera gong-and-drum patterns) + a banhu (板胡) feel (erhu samples brightened + nasal formants + variable-speed glides) + a suona (唢呐) feel (oboe + saturation + formants)
Run (from the repo root): .venv/bin/python styles/shadow-puppet/demo/music/score.py
Output: music/score.wav (48k stereo float, 54.4 s), music/stems/{luogu,banhu,suona,bass}.wav, music/score.json
All time points are copied from T in demo/story.js (100 BPM, 1 beat = 0.6 s). All melodies are original."""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp

DUR = 54.4
N = int(DUR * SR)
S.seed(7)
# —— Time points from story.js ——
T = dict(titleIn=2.4, titleSet=3.6, flares=[7.8, 8.4, 8.9, 9.3, 9.6, 9.9, 10.2, 10.4, 10.6], hot=10.8,
         liang=21.6, draw1=(25.5, 27.2), rel=[27.6, 29.4, 30.6, 31.2, 31.8, 32.1, 32.4, 32.7, 33.0],
         fly=[.3, .3, .22, .22, .2, .2, .18, .18, .18], stop=34.8, softGong=36.9, heal0=37.4, truck0=43.2, clap2=50.6)
HIT = [r + f for r, f in zip(T['rel'], T['fly'])]
D = 62  # tonic D (midi: D4=62, D5=74)

stems = {k: np.zeros((N, 2), np.float32) for k in ['luogu', 'banhu', 'suona', 'bass']}


# ================= Utilities =================
def warp(x, semis):
    """Variable-speed resampling: semis(t in seconds) → pitch-offset curve in semitones; output length adapts to the curve"""
    x = np.asarray(x, np.float64); n = len(x)
    out_n = int(n * 1.6) + SR
    t = np.arange(out_n) / SR
    r = 2 ** (semis(t) / 12.0)
    ph = np.concatenate([[0], np.cumsum(r[:-1])])
    m = ph < n - 1
    ph = ph[m]
    i = ph.astype(int); f = ph - i
    return (x[i] * (1 - f) + x[i + 1] * f).astype(np.float32)


def fade(x, fi=.01, fo=.05):
    x = x.copy(); a, b = int(fi * SR), int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b and b < len(x): x[-b:] *= np.linspace(1, 0, b)
    return x


def trim(x, d, fo=.06):
    n = int(d * SR); x = x[:n].copy() if len(x) > n else np.pad(x, (0, n - len(x)))
    return fade(x, 0, fo)


def env_curve(pts):
    """[(t, v), ...] piecewise linear → function"""
    ts, vs = zip(*pts)
    return lambda t: np.interp(t, ts, vs)


# ================= Gongs and drums (luogu) =================
def big_gong(vel=.8, drop=-3.0, choke=None):
    """Big gong "kuang" (哐): after the strike the pitch slides down by drop semitones within 0.4 s; choke = damp it after this many seconds"""
    x = S.hit('gong2', 'big', vel)
    y = warp(x, lambda t: drop * np.clip(t / .4, 0, 1) ** .7)
    y = y + .35 * lp(y, 260)         # thicken the low end of the "kuang"
    if choke: y = trim(y, choke, .12)
    return y


def small_gong(vel=.7, rise=1.6):
    """Small gong "tai" (台): pitch rises within 0.12 s after the strike"""
    x = S.hit('gong2', 'small', vel)
    return warp(x, lambda t: rise * np.clip(t / .12, 0, 1))


def cymbal(vel=.7, d=.9):
    return trim(S.hit('sus_cymbal', 'stick', vel), d, .3)


def crash(vel=.8, d=2.5):
    return trim(S.hit('crash', None, vel), d, .8)


def bangu(vel=.6):        # bangu (板鼓, clapper drum): high, hard "da"
    x = S.hit('woodblock', 'a', vel)
    return trim(x, .25, .05)


def tanggu(vel=.6, d=1.2):   # tanggu (堂鼓, hall drum): large frame drum + bass drum
    x = S.hit('frame_drum', 'large', vel)
    y = S.hit('bass_drum', None, vel * .7)
    n = max(len(x), len(y)); z = np.pad(x, (0, n - len(x))) + .6 * np.pad(y, (0, n - len(y)))
    return trim(z, d, .3)


def muyu(vel=.4):
    return trim(S.hit('log_drum', 'hi', vel), .3, .05)


L = stems['luogu']
# C1 opening (起板, qiban) 2.4–7.2: "tai tai qi-tai cang" (台 台 七台 仓) accelerating
for t, v in [(2.4, .55), (2.7, .45), (2.85, .5), (3.0, .55), (3.12, .5), (3.24, .55), (3.36, .6), (3.48, .65)]:
    add(L, bangu(v), t, .8, .15)
add(L, small_gong(.6), 2.55, .7, -.2); add(L, small_gong(.65), 2.95, .7, -.2)
add(L, cymbal(.45, .4), 3.3, .5, .3); add(L, small_gong(.7), 3.42, .7, -.2)
add(L, big_gong(.85), T['titleSet'], 1.0, 0); add(L, cymbal(.8, 1.4), T['titleSet'], .75, .25)
for t in [4.8, 6.0]: add(L, small_gong(.35), t, .35, -.25)
for t in [4.2, 4.5, 5.4, 5.7, 6.6]: add(L, bangu(.3), t, .35, .15)

# C2 ten suns (十日) 7.2–12.0: one hit per lamp lighting, getting denser and denser
for i, t in enumerate(T['flares']):
    v = .45 + .04 * i
    add(L, small_gong(v, 1.2 + .15 * i) if i % 2 == 0 else cymbal(v, .5), t, .6, (-.3 if i % 2 == 0 else .3))
add(L, big_gong(.95, -3.5), T['hot'], 1.1, 0); add(L, crash(.9, 3.0), T['hot'], .85, .2)
for k, t in enumerate(np.arange(10.95, 12.0, .07)):          # tanggu roll, fading
    add(L, tanggu(.45, .3), t, .5 * (1 - k / 16), -.1)

# C3 scorched earth (焦土) 12.0–18.0: tanggu heartbeat (two hits every 1.2 s)
for t in np.arange(12.0, 17.7, 1.2):
    add(L, tanggu(.5, 1.0), t, .55, 0); add(L, tanggu(.35, .8), t + .24, .4, 0)

# C4 jijifeng (急急风, "rushing wind" pattern) 18.0–21.6: bangu roll accelerating from eighth notes to thirty-second notes
t, dt = 18.0, .3
while t < 21.5:
    add(L, bangu(.5 + .4 * (t - 18) / 3.5), t, 1.05 + .5 * (t - 18) / 3.5, .15); add(L, tanggu(.3 + .3 * (t - 18) / 3.5, .2), t, .25 + .3 * (t - 18) / 3.5, -.1)
    t += dt; dt = max(.075, dt * .93)
for t in np.arange(18.0, 21.6, .6):
    add(L, cymbal(.5 + .1 * (t - 18) / 3.6, .5), t, .6, .3)
add(L, big_gong(1.0, -3.0, choke=.55), T['liang'], 1.15, 0); add(L, trim(crash(.95), .55, .3), T['liang'], .9, .2)

# C5 hero motif (英雄动机) 22.2–25.2: light bangu
for t in np.arange(22.2, 25.0, .6): add(L, bangu(.3), t, .4, .15)
add(L, small_gong(.35), 24.6, .35, -.25)

# C6 drawing the bow (开弓) 25.2–30.0: drum roll crescendo → cymbal on the arrow's release → big gong when the sun is hit
t, dt = 25.5, .18
while t < 27.5:
    u = (t - 25.5) / 2.0
    add(L, bangu(.3 + .5 * u), t, .5 + .5 * u, .15); add(L, tanggu(.25 + .4 * u, .25), t + .04, .35 * u, -.1)
    t += dt; dt = max(.06, dt * .94)
add(L, cymbal(.85, 1.0), T['rel'][0], .8, .3); add(L, big_gong(1.0, -3.0), HIT[0], 1.1, 0)
add(L, cymbal(.7, .8), T['rel'][1], .7, .3); add(L, big_gong(.8, -2.5), HIT[1], .85, 0)

# C7 volley (连射) 30.0–34.8: kuai changchui (快长锤, fast percussion pattern) (bangu sixteenths + cymbals on the beat + small gong on the offbeat) + one gong stroke per sun hit (each one lower than the last)
for t in np.arange(30.0, 34.79, .15): add(L, bangu(.35 + .1 * ((round((t - 30) / .15)) % 4 == 0)), t, .55, .15)
for t in np.arange(30.0, 34.79, .6): add(L, cymbal(.55, .4), t, .5, .3)
for t in np.arange(30.3, 34.79, .6): add(L, small_gong(.4), t, .35, -.3)
for i in range(2, 9):
    k = i - 2
    g = big_gong(.8 + .02 * k, -2.0 - .35 * k) if k % 2 == 0 else small_gong(.75, -.4 * k)
    add(L, g, HIT[i], .95, (-.15 if k % 2 else .1))

# ================= Banhu (erhu samples brightened) =================
def banhu_note(midi, dur, vel=.6, slide=None, vib=(5.8, .25, .25), fall=None):
    """slide=(starting offset in semitones, seconds); vib=(Hz, depth in semitones, vibrato onset time); fall=(slide down at the end in semitones, seconds)"""
    x = S.note('erhu', midi, dur + .3, vel, release=.25)
    so, st = slide if slide else (0, .01)
    fo, ft = fall if fall else (0, .01)
    hz, dep, v0 = vib
    def semis(t):
        s = so * np.clip(1 - t / st, 0, 1) ** 1.6
        s = s + dep * np.clip((t - v0) / .3, 0, 1) * np.sin(2 * np.pi * hz * t)
        s = s + fo * np.clip((t - (dur - ft)) / ft, 0, 1) ** 2
        return s
    y = warp(x, semis)
    return trim(y, dur + .22, .2)


def banhu_color(x):
    """Banhu: brighter and more nasal (high shelf + two formants + light saturation)"""
    y = x + .9 * hp(x, 2400) + .7 * bp(x, 950, 1450) + .45 * bp(x, 2300, 3300)
    y = np.tanh(y * 1.6) / 1.6
    return y


B = stems['banhu']
fa_up, si_dn = 5.4, 10.5     # kuyin (苦音, the "bitter" mode) inflected notes: fa↑, si↓ (semitones above tonic D, microtonal)
# C1 kuyin opening phrase 3.9–7.0 (long A5 → fa↑ → E → D → si↓ → A4)
line1 = [(3.95, D + 19, .85, .75, (-3, .2)), (4.8, D + 12 + fa_up, .3, .6, (0, .01)), (5.1, D + 19, .25, .6, (-1, .06)),
         (5.35, D + 14, .45, .62, (1, .08)), (5.8, D + 12, .55, .65, (-1, .1)), (6.35, D + si_dn, .25, .55, (1, .06)), (6.6, D + 7, .38, .55, (1.5, .1))]
for t, m, d, v, sl in line1:
    add(B, banhu_color(banhu_note(m, d, v, sl, fall=(-2, .15) if t == 6.6 else None)), t, .55, -.15)
# C3 scorched earth: kuyin tremolo long notes (low volume, keeping out of the narration's way)
for t, m, d, fall in [(12.1, D + 7, 2.3, (-1.5, .5)), (14.7, D + fa_up, 1.5, (-1, .4)), (16.3, D + 2, 1.6, (-2.5, .6))]:
    x = banhu_note(m, d, .45, (-1, .25), vib=(7.5, .35, .1), fall=fall)
    trem = 1 + .35 * np.sin(2 * np.pi * 11 * np.arange(len(x)) / SR)     # tremolo bowing
    add(B, banhu_color(x * trem), t, .32, -.15)
# C5 hero motif (huanyin (欢音, the "joyful" mode) D E F# A B) 22.2–25.0
hero = [(22.2, 12, .28), (22.5, 14, .28), (22.8, 19, .55), (23.4, 21, .28), (23.7, 19, .28), (24.0, 16, .28), (24.3, 14, .28), (24.6, 12, .5)]
for t, s, d in hero:
    add(B, banhu_color(banhu_note(D + s, d, .6, (-2, .07) if s >= 19 else (0, .01), vib=(6, .18, .15))), t, .42, -.15)
# C6 drawing the bow: one continuous glide from A4 to A5 (tense, vibrato getting faster and faster)
def rising(t):
    return 12 * np.clip((t - .1) / 1.6, 0, 1) ** 1.3 + .3 * np.clip(t / 1.7, 0, 1) * np.sin(2 * np.pi * (5 + 3 * t) * t)
x = S.note('erhu', D + 7, 2.2, .6, release=.2)
add(B, banhu_color(trim(warp(x, rising), 1.95, .25)), 25.5, .45, -.15)
# C9 renewal (回春): huanyin theme, slow and soft (feels like ~90 BPM)
heal = [(37.3, 12, 1.0, (-5, .3)), (38.4, 14, .6, (0, .01)), (39.0, 16, 1.2, (-2, .15)), (40.4, 19, .8, (-3, .2)),
        (41.3, 16, .6, (1, .1)), (41.9, 14, .5, (0, .01)), (42.4, 12, 1.1, (2, .15))]
for t, s, d, sl in heal:
    add(B, banhu_color(banhu_note(D + s, d, .5, sl, vib=(5.2, .22, .3))), t, .34, -.15)
# C10 backstage (幕后): a few very slow long notes
for t, s, d in [(44.3, 7, 2.6), (47.1, 4, 2.2), (49.2, 2, .7)]:
    add(B, banhu_color(banhu_note(D + s, d, .4, (-1, .3), vib=(4.8, .2, .5))), t, .24, -.1)
# C11 closing (收板, shouban): the last long note resolves on the tonic D5
add(B, banhu_color(banhu_note(D + 12, 3.1, .5, (-2, .4), vib=(4.5, .2, .8), fall=(0, .01))), 50.75, .38, -.1)

# ================= Suona (oboe + saturation + formants) =================
def suona_note(midi, dur, vel=.8, slide=None, vib=(6.5, .3, .15)):
    x = S.note('oboe', midi, dur + .3, vel, release=.12)
    so, st = slide if slide else (0, .01); hz, dep, v0 = vib
    y = warp(x, lambda t: so * np.clip(1 - t / st, 0, 1) ** 1.5 + dep * np.clip((t - v0) / .2, 0, 1) * np.sin(2 * np.pi * hz * t))
    y = trim(y, dur + .08, .06)
    y = y + 1.1 * bp(y, 1200, 3000) + .3 * hp(y, 3500)
    return np.tanh(y * 2.4) / 2.4


SU = stems['suona']
add(SU, suona_note(D + 24, .85, .9, (-3, .12), (6.8, .35, .2)), T['rel'][0] - .02, .5, .2)      # one high D6 on the arrow's release
b = .6
mel = [(0, 19, .5), (.5, 21, .5), (1, 24, 1), (2, 21, .5), (2.5, 19, .5), (3, 16, .5), (3.5, 19, .5),
       (4, 21, .5), (4.5, 19, .5), (5, 21, .5), (5.5, 24, .5), (6, 26, 2)]
for bt, s, d in mel:
    add(SU, suona_note(D + s, d * b - .03, .85, (-1.5, .06) if s >= 24 else (-.6, .04)), 30.0 + bt * b, .45, .2)

# ================= Bass pad underneath (very quiet) =================
BA = stems['bass']
def pad(inst, m, t, d, g, att=.8):
    add(BA, trim(S.note(inst, m, d, .35, attack=att, release=.8), d + .6, .6), t, g, 0)
pad('contrabass', D - 24, 12.0, 5.8, .22)                   # scorched-earth low drone D2
hum = np.sin(2 * np.pi * 73.4 * np.arange(int(5.8 * SR)) / SR) * .04 * np.minimum(1, np.arange(int(5.8 * SR)) / SR / 1.0)
add(BA, fade(hum.astype(np.float32), .5, 1.0), 12.0, 1, 0)
pad('cellos', D - 12, 37.3, 5.7, .12, 1.2)                  # renewal
pad('contrabass', D - 24, 43.4, 6.8, .16, 1.5)              # backstage
pad('cellos', D - 12, 50.75, 3.3, .1, .6)                   # closing

# ================= Reverb, hard stop, closing =================
rv = {'luogu': (.5, .2), 'banhu': (.42, .2), 'suona': (.4, .16), 'bass': (.5, .15)}
for k in stems: stems[k] = S.room(stems[k], size=rv[k][0], mix=rv[k][1])

t = np.arange(N) / SR
gate = np.ones(N, np.float32)
s0 = int(T['stop'] * SR); gate[s0:s0 + int(.025 * SR)] = np.linspace(1, 0, int(.025 * SR)); gate[s0 + int(.025 * SR):int(36.85 * SR)] = 0
g2 = (t >= 50.5) & (t < 50.7); gate[g2] = 0                  # leave a gap for the xingmu (醒木, storyteller's wooden clapper)
gate[int(50.44 * SR):int(50.5 * SR)] = np.linspace(1, 0, int(.06 * SR))
gate[:int(2.4 * SR)] = 0                                      # C0: no music
for k in stems: stems[k] *= gate[:, None]
# Gongs/drums and suona: zeroed permanently after 34.8 (the gongs' long tails are cut too, otherwise the tails come back after 36.85)
for k in ['luogu', 'suona']: stems[k][s0 + int(.025 * SR):] = 0
# After the hard stop: one very faint small gong in the silence; one big gong with a long tail at the close
late = np.zeros((N, 2), np.float32)
add(late, small_gong(.2), T['softGong'], .1, -.2)
add(late, big_gong(.75, -2.0), 50.7, .8, 0)
for tt in np.arange(37.4, 42.9, 1.333): add(late, muyu(.3), tt, .3, .2)      # C9 light taps on the muyu (木鱼, wooden fish block)
late = S.room(late, size=.6, mix=.25)
late[:int(36.85 * SR)] = 0
stems['luogu'] += late
# 43.2 transition: a soft gong scrape
tr = np.zeros((N, 2), np.float32); add(tr, fade(S.hit('gong2', 'scrape', .5), .3, .8), T['truck0'] - .1, .5, .1)
stems['luogu'] += S.room(tr, size=.6, mix=.25)
stems['luogu'][g2] = 0
# fully decayed before 54.2
tail = np.clip((54.2 - t) / 1.2, 0, 1).astype(np.float32)
for k in stems: stems[k] *= tail[:, None]

stems['banhu'] *= 1.8; stems['suona'] *= 2.0
mix = sum(stems.values())
peak = np.abs(mix).max(); g = .89 / peak                     # −1 dBFS
mix *= g
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k in stems: sf.write(os.path.join(HERE, 'stems', k + '.wav'), (stems[k] * g).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')

# ================= score.json + self-check =================
cues = [('C0 clapper', 0, 2.4), ('C1 opening', 2.4, 7.2), ('C2 ten suns', 7.2, 12.0), ('C3 scorched earth', 12.0, 18.0), ('C4 jijifeng drums', 18.0, 21.6),
        ('C5 pose / hero motif', 21.6, 25.2), ('C6 drawing the bow', 25.2, 30.0), ('C7 volley', 30.0, 34.8), ('C8 silence', 34.8, 37.2),
        ('C9 spring returns', 37.2, 43.2), ('C10 backstage', 43.2, 50.4), ('C11 closing', 50.4, 54.4)]
json.dump(dict(dur=DUR, bpm=100, beat=.6, key='D (kuyin inflected notes fa↑=+5.4, si↓=+10.5 semitones; huanyin D E F# A B)',
               hits=dict(titleSet=T['titleSet'], flares=T['flares'], hot=T['hot'], liang=T['liang'], release=T['rel'], sunHit=[round(h, 3) for h in HIT],
                         hardStop=T['stop'], softGong=T['softGong'], scrape=T['truck0'] - .1, clapGap=[50.5, 50.7], endGong=50.7),
               cues=[dict(name=n, t0=a, t1=b) for n, a, b in cues], stems=list(stems)), open(os.path.join(HERE, 'score.json'), 'w'), ensure_ascii=False, indent=1)
mono = mix.mean(1)
F = np.fft.rfftfreq
def seg_stats(a, b):
    x = mono[int(a * SR):int(b * SR)]
    r = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    X = np.abs(np.fft.rfft(x)) ** 2; f = F(len(x), 1 / SR); hf = X[f > 8000].sum() / max(X.sum(), 1e-20)
    return r, hf
print('peak dBFS', round(20 * np.log10(np.abs(mix).max()), 2))
for n, a, b in cues:
    r, hf = seg_stats(a, b); print(f'{n:22s} {a:5.1f}-{b:5.1f}  RMS {r:7.1f} dB  8-20k {hf*100:5.2f}%')
r, _ = seg_stats(34.83, 36.85); print('silence 34.83-36.85 RMS', round(r, 1), 'dB', 'OK' if r < -70 else 'FAIL')
r, _ = seg_stats(50.5, 50.7); print('gap for the clapper 50.5-50.7 RMS', round(r, 1), 'dB')
used = ['gong2', 'sus_cymbal', 'crash', 'woodblock', 'frame_drum', 'bass_drum', 'log_drum', 'erhu', 'oboe', 'cellos', 'contrabass']
open(os.path.join(HERE, 'credits.txt'), 'w').write('\n'.join(S.credits(used)) + '\n')
print('\n'.join(S.credits(used)))
for k in stems:
    x = stems[k].mean(1) * g
    print(k, ' '.join(f'{n.split()[0]}:{20*np.log10(np.sqrt(np.mean(x[int(a*SR):int(b*SR)]**2))+1e-12):.0f}' for n, a, b in cues))
