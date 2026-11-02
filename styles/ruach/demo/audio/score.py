"""After the Fire: score and sound for the Ruach demo (26.5 s). Writes <out>/mix.wav (48 kHz stereo).
Usage: LIB=<library> python score.py <out_dir>   (demo/build.sh runs it)
Cues follow TREATMENT.md: red drone and crackle → boom cut at 6.4 → wind, cello and piano → silence 12.6–13.6
→ wordless choir and strings as the light breaks (13.6) → D major resolution, birds → ring-out."""
import os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.environ['LIB'])
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, bp, noise, brown, env_exp, t_, norm, rumble, thump

DUR, CUT, HUSH, LIGHT = 26.5, 6.4, 12.6, 13.6
S.seed(7); rng = np.random.default_rng(7)
N = int(DUR * SR)
music, fx = np.zeros((N, 2), np.float32), np.zeros((N, 2), np.float32)

def fade(x, a, b):   # linear fades in and out, seconds
    n = len(x); e = np.ones(n)
    ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * e

# —— Wordless choir: additive voices shaped by an "oo/ah" formant envelope, slow vibrato, detuned unison ——
FORM = {'oo': [(300, 1., 70), (870, .35, 90), (2240, .08, 120)], 'ah': [(700, 1., 90), (1220, .5, 100), (2600, .15, 140)]}
def choir(f0, dur, vowel='oo', voices=4, att=1.2, rel=1.6, vel=.5):
    tt = t_(dur + rel); out = np.zeros(len(tt))
    for v in range(voices):
        det = 2 ** ((rng.uniform(-7, 7)) / 1200); vib = 1 + .004 * np.sin(2 * np.pi * (4.6 + rng.uniform(-.4, .4)) * tt + rng.uniform(0, 6))
        ph = 2 * np.pi * np.cumsum(f0 * det * vib) / SR
        for k in range(1, 40):
            fk = f0 * k
            if fk > 5000: break
            g = sum(a * np.exp(-((fk - F) / bw) ** 2 / 2) for F, a, bw in FORM[vowel]) + .02 / k
            out += g * np.sin(k * ph + rng.uniform(0, 6))
    env = np.minimum(1, tt / att) * np.where(tt > dur, np.exp(-(tt - dur) / (rel / 4)), 1)
    out = lp(out * env, 4200)
    return (norm(out, 1) * vel).astype(np.float32)

def hz(n): return 440 * 2 ** ((S.midi(n) - 69) / 12)

# —— 1. Red: low drone, a slow timpani swell into the cut ——
ev = [
    (0.0, 'contrabass', 'D1', 6.6, .55, -.2), (0.0, 'cellos', 'D2', 6.6, .4, .2), (2.4, 'cellos', 'Eb2', 4.2, .32, .25),
    (4.6, 'timpani', 'D2', 1.8, .35, 0),
]
# —— 2. Night: solo-ish cello line, sparse felt piano ——
ev += [
    (7.0, 'cellos', 'A3', 1.6, .6, .1), (8.6, 'cellos', 'F3', 1.2, .58, .1), (9.8, 'cellos', 'G3', 1.0, .6, .1), (10.8, 'cellos', 'D3', 1.8, .55, .1),
    (7.4, 'upright', 'D5', 1.2, .5, -.3), (9.2, 'upright', 'A4', 1.2, .46, -.3), (10.8, 'upright', 'F4', 1.6, .44, -.3),
    (6.6, 'contrabass', 'D2', 5.8, .3, -.1),
]
# —— 3. Light: strings bloom in D major, harp glissando, piano arpeggios, contrabass root ——
ev += [
    (13.7, 'upright', 'D4', 1.5, .45, -.3), (13.78, 'upright', 'F#4', 1.5, .45, -.2), (13.86, 'upright', 'A4', 1.5, .45, -.1), (13.94, 'upright', 'D5', 1.5, .45, 0),
    (14.02, 'upright', 'F#5', 1.5, .42, .1), (14.1, 'upright', 'A5', 1.8, .4, .2), (14.18, 'upright', 'D6', 2.2, .38, .3),
    dict(t=13.8, inst='violins', pitch='A4', dur=8.5, vel=.42, pan=.25, attack=2.2), dict(t=13.8, inst='violins', pitch='F#5', dur=8.5, vel=.38, pan=.3, attack=2.6),
    dict(t=13.8, inst='violas', pitch='D4', dur=8.5, vel=.4, pan=-.15, attack=2.2), dict(t=13.8, inst='cellos', pitch='D3', dur=9.5, vel=.42, pan=-.2, attack=1.8),
    dict(t=13.8, inst='contrabass', pitch='D2', dur=10.5, vel=.4, pan=0, attack=1.5),
    dict(t=19.6, inst='violins', pitch='B4', dur=3.4, vel=.36, pan=.25, attack=1.2), dict(t=19.6, inst='violins', pitch='G5', dur=3.4, vel=.34, pan=.3, attack=1.2),
    dict(t=22.6, inst='violins', pitch='A4', dur=3.9, vel=.36, pan=.25, attack=.8), dict(t=22.6, inst='violins', pitch='F#5', dur=3.9, vel=.34, pan=.3, attack=.8),
]
for i, n in enumerate(['D4', 'A4', 'F#5', 'A4', 'D5', 'A4', 'F#5', 'E5', 'D5']):
    ev.append((16.2 + i * .62, 'upright', n, 1.2, .3, -.25))
ev.append((22.6, 'upright', 'D4', 3.6, .3, -.2)); ev.append((22.6, 'upright', 'A4', 3.6, .26, -.2)); ev.append((22.6, 'upright', 'F#5', 3.6, .28, -.2))
music += S.render(ev, dur=DUR, master=False)[:N]
# wordless choir: enters on the light, carries to the end
for n, pan, vel in [('D4', -.2, .32), ('F#4', .1, .26), ('A4', .25, .26), ('D5', -.05, .2)]:
    add(music, fade(choir(hz(n), 10.4, 'oo' if n != 'D5' else 'ah', att=1.6, rel=2.0, vel=vel), 0, .4), LIGHT + .1, 1.0, pan)
music = S.room(music, size=.7, mix=.3)
# the silence: everything but the wind drops out from HUSH to LIGHT
gate = np.ones(N); a, b = int((HUSH - .25) * SR), int(HUSH * SR); gate[a:b] = np.linspace(1, 0, b - a); gate[b:int(LIGHT * SR)] = 0
music *= gate[:, None]

# —— Sound effects ——
# red: fire crackle and a distant rumble
crack = np.zeros(int(CUT * SR))
for _ in range(220):
    at = int(rng.uniform(0, CUT - .05) * SR); l = int(rng.uniform(.002, .012) * SR)
    crack[at:at + l] += rng.uniform(.2, 1) * rng.standard_normal(l) * np.exp(-np.arange(l) / (l / 3))
add(fx, hp(crack, 1200) * .5, 0, .4, -.1)
add(fx, fade(lp(brown(CUT), 140), .8, .3) * .9, 0, .45, 0)
add(fx, rumble(2.5, .6), 1.5, .5, .2)
# the cut: a deep boom
add(fx, thump(1.0, 46), CUT - .02, 1.0, 0); add(fx, rumble(2.2, 1.0), CUT, .7, 0)
# wind from the cut to the end, thinner once the light is in
wl = DUR - CUT; w = bp(noise(wl), 250, 1600)
mod = .55 + .45 * np.sin(2 * np.pi * .13 * t_(wl)) * np.sin(2 * np.pi * .07 * t_(wl) + 1)
wd = np.interp(t_(wl), [0, LIGHT - CUT, LIGHT - CUT + 3, wl], [1, 1, .55, .4])
add(fx, fade(norm(w * mod * wd, .9), .6, 1.5), CUT, .22, -.2)
# light: rising shimmer when the source opens
sh = t_(2.6); shim = sum(np.sin(2 * np.pi * f * (1 + .3 * sh / 2.6) * sh + p) for f, p in [(1760, 0), (2217, 1), (2637, 2), (3520, 3)])
add(fx, (shim * np.minimum(1, sh / 1.4) * np.exp(-np.maximum(0, sh - 1.4) / .6) * .1).astype(np.float32), LIGHT - .1, .5, .3)
# birds in the garden key
def chirp(f, d=.09):
    tt = t_(d); return np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * tt / d))) / SR) * np.sin(np.pi * tt / d) ** 2
for at in [17.4, 17.55, 19.2, 19.32, 19.44, 21.0, 22.3, 22.42, 24.1]:
    add(fx, chirp(rng.uniform(2800, 4200)) * .25, at, .5, rng.uniform(-.6, .6))

mix = limit(music * .9 + fx, .9)
fl = np.ones(N); fo = int(1.6 * SR); fl[-fo:] = np.linspace(1, 0, fo) ** 1.5
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
sf.write(os.path.join(out, 'mix.wav'), (mix * fl[:, None]).astype(np.float32), SR)
print('wrote', os.path.join(out, 'mix.wav'), mix.shape[0] / SR, 's')
print('\n'.join(S.credits(sorted({e[1] if isinstance(e, tuple) else e['inst'] for e in ev}))))
