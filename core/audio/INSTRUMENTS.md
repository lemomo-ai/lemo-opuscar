# Real-instrument toolchain: sampler (samples) + pluck (physically modelled plucked strings)

For writing **original scores** for Lemo-Opuscar style films. Everything is synthesised offline with numpy/soxr at **48 kHz**, with the same conventions as `sfx.py` (`SR`, `add()`, `limit()`).
The goal is "sounds like a real instrument": use samples wherever possible (97 instruments, real recordings), and fill in the folk plucked strings the sample libraries lack (guqin, pipa, shamisen…) with physical modelling (11 presets).

- Preview: the repo has no ready-made preview files (`core/audio/*.wav` is not in git, and not in the sample packs either). After downloading a sample pack, use the pattern in section 1 to play a small root-fifth-octave motif on each instrument and render a stretch to listen to yourself
- Sample libraries: `core/audio/instruments/` (lossless FLAC; each library keeps its original LICENSE/README). Not in git; download per library, only the ones the film uses: `sh tools/fetch.sh instruments <lib>` (`vsco2ce` 395 MB, `vcsl` 271 MB, `salamander` 218 MB, `freepats` 397 MB, `karoryfer` 74 MB), or `instruments all` (about 1.4 GB). The Source column in section 5 is the library an instrument lives in: VSCO 2 CE → `vsco2ce`, VCSL → `vcsl`, Salamander → `salamander`, FreePats and MuldjordKit → `freepats`, Karoryfer → `karoryfer`
- Index: `core/audio/instruments/index.json` (every library's pack ships a copy: pitch, velocity layer, onset point and level of every sample; ready to use on import, no rebuild needed)

---

## 1. Thirty-second start

```python
import sys; sys.path.insert(0, '.')   # run from the repo root
import numpy as np, soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

x = S.note('cellos', 'D3', 4.0, vel=.6)            # cello section long note, 4 s (extended seamlessly if the sample is too short)
y = S.hit('snare', 'roll', .5)                       # unpitched hit: instrument + variant + velocity
z = P.pluck('guqin', 'A3', 3, vel=.7, bend=[(.5, 0), (.9, 2)])   # guqin stopped note sliding up a whole tone

# score: (time s, instrument, pitch, duration s, velocity 0-1, pan -1..1[, gain])
mix = S.render([
    (0.0, 'piano',   'D4', 1.0, .70, -.2),
    (0.0, 'cellos',  'D3', 4.0, .55,  .2),
    (0.5, 'violins', 'A4', 3.5, .50,  .3),
    dict(t=1.0, inst='harp', pitch='F#5', dur=1, vel=.6, pan=-.4),
    (2.0, 'gong', None, None, .5, 0),              # unpitched: pitch is the variant name or None
], dur=8)                                           # → (N,2) float32, limited per channel automatically above 0.95
mix = S.room(mix, size=.45, mix=.18)                # simple convolution reverb (optional)
sf.write('cue.wav', mix, SR)
```

> Calling `note()/hit()/pluck()` on their own gives **mono float32 @48k**, length ≈ `dur + release`; place it into a stereo buffer with `sfx.add(buf, x, t, gain, pan)`.

---

## 2. Using sampler.py

| Function | What it does |
|---|---|
| `load(name)` | Loads an instrument by name (lazy + cached; the first call reads only the index, samples are read from disk when used). Returns an `Inst`; `print` shows range / velocity layers / variants |
| `note(inst, pitch, dur, vel=.8, release=None, attack=0, var=None)` | Single note. `pitch` can be `'C#4'` `'Db3'` `'Bb-1'` or a midi number (**C4=60**; fractions allowed = microtones). `dur` = how long the note is held; `release` = release time in seconds after the note stops (default per instrument); `attack>0` adds a fade-in for string pads |
| `hit(inst, name_or_index=None, vel=.8, dur=None)` | Unpitched hit. Variant names can be given as a prefix / without underscores (`'kick'`→`kick_drum_left`, `'hihat_open'`); an integer = the n-th variant (`hit('timpani', 2)` = the 3rd drum); `dur` truncates (with a 30 ms fade-out). Also works on pitched instruments: `hit('piano','A3')` plays the whole natural decay |
| `chord(inst, pitches, dur, vel, strum=0)` | Chord (mono); `strum>0` delays each note in turn (arpeggio / strum) |
| `render(events, dur=None, master=True)` | Score → stereo. Events are tuples `(t, inst, pitch, dur, vel, pan[, gain])` or dicts (may carry `release`/`attack`/`var`) |
| `room(x, size=.5, mix=.2, predelay=.015, damp=.5)` | Convolution reverb with a decorrelated exponentially decaying noise IR; `size` 0–1 → RT60 0.4–3.4 s; returns (N,2) of the same length |
| `credits(names)` | From the list of instruments you used, generates the end-credit CREDITS lines (the required CC BY wording + CC0 acknowledgements) |
| `info(name=None)` / `instruments(fam=None)` | Prints an overview / lists names (`fam` takes `strings` / `woodwinds` / `brass` / `percussion` / `keyboards` / `plucked` / `folk`; the Chinese names 弦乐 / 木管 / 铜管 / 打击 / 键盘 / 拨弦 / 民族 are accepted too) |
| `midi(p)` / `hz(p)` / `name(m)` / `seed(n)` | Note-name utilities; `seed` fixes the round-robin randomness (same call order → same result) |
| `build_index(names=None, force=False)` | Rescans the samples and rebuilds `index.json` (only needed if samples were swapped or added; ~15 s; needs librosa: `requirements-dev.txt`) |

**What it does behind the scenes**
- **Sample selection**: weighs both "closest to the target note" and "closest velocity layer" (cost = semitone distance + 4×velocity difference, with a small extra penalty for transposing up); multiple round-robins in the same cell rotate randomly, avoiding the machine-gun effect.
- **Transposition**: `soxr` HQ resampling (which also converts 44.1k to 48k). Keep transposition within ±4 semitones (samples are usually every 2–3 semitones, so the default stays within that range). Notes outside the sampled range still sound, but the timbre turns "cartoonish".
- **Velocity**: multi-layer instruments pick the layer first, then fine-tune ±4 dB within the layer; single-layer instruments scale gain by velocity and slightly darken the highs when played softly (real instruments are darker when played softly).
- **Long-note extension** (the `sustained, extendable` type): when `dur` exceeds the recording's length, grains of 0.4–1 s are taken at random from the recording's stable section, **aligned by cross-correlation at the fundamental period**, then spliced with 100 ms raised-cosine crossfades, and each grain's level is matched to the stable-section mean, so there is no hard cut and no looping "hum" periodicity. FreePats' accordion/bagpipe come with loop points; their loop regions are used directly.
- **Note-off**: after `dur`, an exponential decay over `release` (-60 dB) + 5 ms to zero; decaying instruments (piano, pizzicato, marimba…) decay naturally before `dur`, and when `dur` arrives they are "damped" over the release time. For glockenspiel/tubular bells/gong and the like, if you want them to ring on, write a long `dur` or a large `release`.
- **Level**: every instrument is already normalised from measurements of its recordings (sustained by the RMS of the loudest 0.4 s window, decaying by a 0.1 s window, percussion by each variant's peak), so at `vel=.8` the instruments are roughly equally loud (within ±6 dB). Balance directly with `vel`/`gain` when writing the score.
- **Pitch calibration**: every sample in the index has its fundamental measured with yin. In many VSCO/VCSL folders the file names are **an octave lower** than the actual pitch (e.g. `VlnEns_susVib_A2` is actually A3), while Karoryfer's erhu/bass file names are **an octave higher**: all of this is corrected automatically from the measurements (`octave_fix` in index.json), and samples off equal temperament by 8–80 cents are fine-tuned to equal temperament (Salamander uses its official Retuned table). **Just write the actual pitch.**

---

## 3. Using pluck.py (physically modelled plucked strings)

```python
P.pluck(preset, pitch, dur=None, vel=.8, **kw)   # → mono float32 @48k; dur=None lets it decay out naturally
P.strum(preset, pitches, dur, vel=.8, spread=.025, up=False)   # strum / arpeggio
```

| Preset | Description | Notes |
|---|---|---|
| `guqin` | guqin | Silk strings, long sustain (~7 s), low-frequency body resonance; supports stopped-note slides with `bend` and yin-nao (吟猱) vibrato with `vib`, **silk-string friction noise is added automatically while sliding**; `harmonic=True` = harmonics (pure, bell-like) |
| `pipa` | pipa | Bright plectrum attack, decay ~2.5 s; `trem=12~16` = lunzhi (轮指, rolled-finger tremolo) |
| `shamisen` | shamisen | Plectrum + skin slap + **sawari buzz from the string touching the bridge** (`buzz` 0–1, `thr` adjustable; measured spectral centroid of the sustain 1.5k→2.0k Hz) |
| `koto` | koto (Japanese zither) | `bend` can do oshide (押手, pressing the string to raise the pitch) |
| `banjo` | banjo | Drum-head resonance, fast decay, stiff steel strings |
| `acoustic_guitar` | steel-string folk guitar | Pair with `strum()` for strumming |
| `nylon_guitar` | nylon-string guitar | Warm (sampled version: `guitar_nylon`) |
| `upright_bass_pizz` | double bass pizzicato | Dull fingertip thump + low-frequency body (sampled version: `jazz_bass`, more realistic) |
| `harp` | harp | Plucked at the string's midpoint, warm (sampled version: `harp`) |
| `kalimba` | kalimba | Modal synthesis: tine partials 1 : 5.93 : 16.6 + fingernail click + resonator box (sampled version: `kalimba`) |
| `music_box` | music box | Modal synthesis: comb-tooth partials 1 : 6.27 : 17.55, slight beating between paired teeth, mechanical "tick", short metallic decay |

Common keywords:
- `bend=[(t, semitones), ...]` piecewise-linear pitch envelope (relative to `pitch`); `glide=(target pitch, seconds)` glides to a note; `vib=(Hz, depth in semitones, start s)` vibrato / yin-nao
- `trem=Hz` lunzhi / yaozhi (轮指/摇指, tremolo: repeated plucks, velocity slightly randomised); `harmonic=True` harmonics
- Override physical parameters: `t60` (seconds for the fundamental to decay to -60 dB), `damp` (0–0.9, higher = darker), `pos` (pluck position 0–0.5, smaller = brighter), `bright`, `buzz`/`thr`, `bmix` (body proportion), `noise`, `release`

```python
# a guqin phrase: open string → stopped note sliding up → yin vibrato → harmonic
buf = np.zeros((int(8 * SR), 2), np.float32)
add(buf, P.pluck('guqin', 'D3', 2.5, .75), 0.0)
add(buf, P.pluck('guqin', 'A3', 3.0, .7, bend=[(0, 0), (.6, 0), (1.1, 2)], vib=(4.5, .2, 1.5)), 1.2)
add(buf, P.pluck('guqin', 'D5', 3.0, .6, harmonic=True), 4.0, .8, .2)
# pipa lunzhi tremolo + shamisen
add(buf, P.pluck('pipa', 'E4', 1.5, .7, trem=14), 0, .7, -.3)
add(buf, P.pluck('shamisen', 'C4', .6, .8, buzz=.7), 2, .8, .3)
```

---

## 4. Licences and end-credit attribution (must read)

| Library | Folder | Licence | What the credits must say |
|---|---|---|---|
| VS Chamber Orchestra: Community Edition (Versilian Studios, github.com/sgossner/VSCO-2-CE) | `instruments/vsco2ce/` | **CC0 1.0** | Not required; the author would like credit to "Versilian Studios / Sam Gossner" (the pipe organ is by Ivy Audio / Simon Dalzell) |
| Versilian Community Sample Library (github.com/sgossner/VCSL) | `instruments/vcsl/` | **CC0 1.0** | Not required |
| FreePats (freepats.zenvoid.org): classical guitar, ukulele, clean electric guitar, fingered electric bass, kalimba, hang, accordion, glass harp, old piano, bagpipe, world percussion | `instruments/freepats/<name>/` | **CC0 1.0** | Not required |
| Karoryfer Samples (github.com/sfzinstruments): erhu aliexpress-erhu, jazz double bass Sneakybass, alto sax Weresax | `instruments/karoryfer/` | **CC0 1.0** | Not required |
| **Salamander Grand Piano V3** (Alexander Holm; FreePats FLAC version) | `instruments/salamander/` | **CC BY 3.0** | **Required whenever you use `piano`** ↓ |
| **MuldjordKit** (Lars Muldjord; FreePats version) | `instruments/freepats/muldjord_kit/` | **CC BY 4.0** | **Required whenever you use `drum_kit`** ↓ |

If you use `piano`, write this in CREDITS exactly:

```
Piano: "Salamander Grand Piano V3" by Alexander Holm, licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
```

If you use `drum_kit`, write this in CREDITS exactly:

```
Drums: "MuldjordKit" by Lars Muldjord (drumgizmo.org), FreePats version, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
```

Suggested (for the CC0 parts, optional, one line is enough): `Samples (CC0): Versilian Studios VSCO 2 CE & VCSL, FreePats, Karoryfer Samples`.
Easiest: `print('\n'.join(S.credits(['piano', 'cellos', 'drum_kit'])))` generates them automatically. `pluck.py` is pure synthesis, with no licence requirements.

Processing applied to the samples (all within what the licences allow): the VSCO/VCSL/Karoryfer WAVs were converted **losslessly** to FLAC (verified identical sample by sample); for Salamander only 5 of the 16 velocity layers are kept (v2/v6/v10/v13/v16); the photos in the FreePats packs (some CC BY-NC) were deleted, keeping only audio and sfz/notes.

---

## 5. Available instruments

"Sampled range" is the range the recordings actually cover (corrected to the actual sounding pitch, C4=60); a few steps beyond it still works, only with longer transposition. "Velocity layers" = the number of recorded layers for the same note on that instrument (1 = velocity simulated by gain + darkening alone).

### Strings

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `violins` | violin section, sustained (vibrato) | VSCO 2 CE | CC0 1.0 | G3–D6 | 2 | sustained, extendable |
| `violins_trem` | violin section, tremolo | VSCO 2 CE | CC0 1.0 | G3–D6 | 2 | sustained, extendable |
| `violins_pizz` | violin section, pizzicato | VSCO 2 CE | CC0 1.0 | G3–D6 | 2 | natural decay |
| `violins_spic` | violin section, spiccato (short notes) | VSCO 2 CE | CC0 1.0 | G3–D6 | 2 | natural decay |
| `violin` | solo violin, sustained | VSCO 2 CE | CC0 1.0 | G3–C7 | 2 | sustained, extendable |
| `violin_pizz` | solo violin, pizzicato | VSCO 2 CE | CC0 1.0 | G3–C7 | 2 | natural decay |
| `violas` | viola section, sustained | VSCO 2 CE | CC0 1.0 | C3–D6 | 2 | sustained, extendable |
| `violas_pizz` | viola section, pizzicato | VSCO 2 CE | CC0 1.0 | C3–D6 | 2 | natural decay |
| `cellos` | cello section, sustained | VSCO 2 CE | CC0 1.0 | C2–F5 | 2 | sustained, extendable |
| `cellos_pizz` | cello section, pizzicato | VSCO 2 CE | CC0 1.0 | C2–F5 | 2 | natural decay |
| `cellos_spic` | cello section, spiccato | VSCO 2 CE | CC0 1.0 | C2–F5 | 2 | natural decay |
| `contrabass` | double bass, sustained | VSCO 2 CE | CC0 1.0 | F#1–B3 | 2 | sustained, extendable |
| `contrabass_pizz` | double bass, classical pizzicato | VSCO 2 CE | CC0 1.0 | E1–B3 | 2 | natural decay |
| `harp` | harp | VCSL | CC0 1.0 | E1–F7 | 4 | natural decay |

### Woodwinds

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `flute` | flute, sustained | VSCO 2 CE | CC0 1.0 | C4–C7 | 1 | sustained, extendable |
| `flute_stac` | flute, staccato | VSCO 2 CE | CC0 1.0 | A4–C7 | 4 | natural decay |
| `piccolo` | piccolo | VSCO 2 CE | CC0 1.0 | G5–G7 | 1 | sustained, extendable |
| `clarinet` | clarinet, sustained | VSCO 2 CE | CC0 1.0 | D3–F#6 | 3 | sustained, extendable |
| `clarinet_stac` | clarinet, staccato | VSCO 2 CE | CC0 1.0 | D3–F6 | 3 | natural decay |
| `oboe` | oboe, sustained | VSCO 2 CE | CC0 1.0 | A#3–F6 | 2 | sustained, extendable |
| `oboe_stac` | oboe, staccato | VSCO 2 CE | CC0 1.0 | A#3–F6 | 3 | natural decay |
| `bassoon` | bassoon, sustained | VSCO 2 CE | CC0 1.0 | A#1–D#5 | 2 | sustained, extendable |
| `bassoon_stac` | bassoon, staccato | VSCO 2 CE | CC0 1.0 | A#1–C5 | 2 | natural decay |
| `recorder` | alto recorder (baroque) | VCSL | CC0 1.0 | F4–E6 | 1 | sustained, extendable |
| `ocarina` | ocarina | VCSL | CC0 1.0 | A4–C#6 | 1 | sustained, extendable |
| `tenor_sax` | tenor sax, vibrato | VCSL | CC0 1.0 | A#2–D6 | 1 | sustained, extendable |
| `tenor_sax_nv` | tenor sax, straight tone | VCSL | CC0 1.0 | G#2–E6 | 2 | sustained, extendable |
| `tenor_sax_stac` | tenor sax, staccato | VCSL | CC0 1.0 | G#2–E6 | 2 | natural decay |
| `alto_sax` | alto sax (Weresax) | Karoryfer | CC0 1.0 | C#3–G#5 | 2 | sustained, extendable |
| `harmonica` | chromatic harmonica | VCSL | CC0 1.0 | C3–C7 | 1 | sustained, extendable |

### Brass

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `trumpet` | trumpet, sustained | VSCO 2 CE | CC0 1.0 | F3–C6 | 2 | sustained, extendable |
| `trumpet_stac` | trumpet, staccato | VSCO 2 CE | CC0 1.0 | F3–C6 | 3 | natural decay |
| `trumpet_mute` | trumpet, straight mute | VSCO 2 CE | CC0 1.0 | A#3–A5 | 2 | sustained, extendable |
| `horn` | French horn, sustained | VSCO 2 CE | CC0 1.0 | A1–F5 | 4 | sustained, extendable |
| `horn_stac` | French horn, staccato | VSCO 2 CE | CC0 1.0 | A1–F5 | 3 | natural decay |
| `trombone` | trombone, sustained | VSCO 2 CE | CC0 1.0 | A#1–F4 | 3 | sustained, extendable |
| `trombone_stac` | trombone, staccato | VSCO 2 CE | CC0 1.0 | A#1–F4 | 4 | natural decay |
| `tuba` | tuba, sustained | VSCO 2 CE | CC0 1.0 | F1–D4 | 3 | sustained, extendable |
| `tuba_stac` | tuba, staccato | VSCO 2 CE | CC0 1.0 | A1–D4 | 2 | natural decay |

### Percussion

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `timpani` | timpani (5 drums; pitch = main vibration mode (1,1), measured from the spectrum); variants: `drum1` `drum2` `drum3` `drum4` `drum5` | VSCO 2 CE | CC0 1.0 | F2–G3 | 3 | natural decay |
| `glockenspiel` | glockenspiel | VCSL | CC0 1.0 | G5–C8 | 3 | natural decay |
| `xylophone` | xylophone | VCSL | CC0 1.0 | G4–C8 | 2 | natural decay |
| `marimba` | marimba | VCSL | CC0 1.0 | F2–C7 | 3 | natural decay |
| `vibraphone` | vibraphone, soft mallets | VCSL | CC0 1.0 | F3–E6 | 2 | natural decay |
| `vibraphone_hard` | vibraphone, hard mallets | VCSL | CC0 1.0 | F3–E6 | 2 | natural decay |
| `vibraphone_bowed` | vibraphone, bowed (airy long notes) | VCSL | CC0 1.0 | A3–E6 | 1 | sustained, extendable |
| `tubular_bells` | tubular bells | VCSL | CC0 1.0 | C4–E5 | 5 | natural decay |
| `hand_chimes` | hand chimes (soft bell tone) | VCSL | CC0 1.0 | C4–C7 | 1 | natural decay |
| `kalimba` | kalimba (thumb piano) | FreePats | CC0 1.0 | F3–C#5 | 1 | natural decay |
| `mbira` | mbira / Tanzanian kalimba (grittier; the original instrument is not in equal temperament, tuned to equal temperament from measurements) | VCSL | CC0 1.0 | G2–C#7 | 1 | natural decay |
| `hang` | hang (D minor, sounds best on the instrument's own notes only) | FreePats | CC0 1.0 | A3–D5 | 1 | natural decay |
| `glass` | glass harp | FreePats | CC0 1.0 | A#4–F6 | 1 | natural decay |
| `bass_drum` | concert bass drum (7 velocity layers) | VSCO 2 CE | CC0 1.0 | — | 7 | unpitched |
| `gran_cassa` | bass drum 2 (with rolls / crescendos); variants: `hit` `roll` `roll_fast` `cresc` `rub` | VCSL | CC0 1.0 | — | 5 | unpitched |
| `snare` | snare drum (orchestral); variants: `on` `off` `roll` `roll_off` | VSCO 2 CE | CC0 1.0 | — | 5 | unpitched |
| `snare2` | snare drum 2 (close-miked); variants: `on` `off` `roll` `stick` `taps` | VCSL | CC0 1.0 | — | 5 | unpitched |
| `toms` | toms (high/low × sticks/mallets); variants: `high` `low` `high_mallet` `low_mallet` `roll` | VCSL | CC0 1.0 | — | 3 | unpitched |
| `crash` | crash cymbals (orchestral) | VSCO 2 CE | CC0 1.0 | — | 4 | unpitched |
| `clash` | crash cymbals 2; variants: `crash` `short` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `sus_cymbal` | suspended cymbal (soft mallet/stick/bell/roll/crescendo/bow); variants: `hit` `stick` `bell` `roll` `cresc` `bow` `scrape` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `gong` | large gong / tam-tam | VSCO 2 CE | CC0 1.0 | — | 4 | unpitched |
| `gong2` | gong 2 (including small gong, scrapes); variants: `big` `small` `scrape` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `triangle` | triangle; variants: `open` `muted` `semi` `roll` | VCSL | CC0 1.0 | — | 2 | unpitched |
| `tambourine` | tambourine | VSCO 2 CE | CC0 1.0 | — | 2 | unpitched |
| `claves` | claves | VSCO 2 CE | CC0 1.0 | — | 3 | unpitched |
| `cowbell` | cowbell | VSCO 2 CE | CC0 1.0 | — | 4 | unpitched |
| `sleighbells` | sleigh bells | VSCO 2 CE | CC0 1.0 | — | 1 | unpitched |
| `log_drum` | log drum / slit drum; variants: `hi` `lo` | VSCO 2 CE | CC0 1.0 | — | 3 | unpitched |
| `woodblock` | woodblock; variants: `a` `b` `c` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `frame_drum` | hand drum / frame drum; variants: `large` `small` `large_muted` `small_muted` `hand` | VCSL | CC0 1.0 | — | 2 | unpitched |
| `hihat` | hi-hat; variants: `closed` `open` `loose` `pedal` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `cajon` | cajón; variants: `bass` `slap` `tone` | VCSL | CC0 1.0 | — | 3 | unpitched |
| `conga` | conga; variants: `conga` `quinto` `tumba` `muted` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `claps` | hand claps; variants: `group` `solo` | VCSL | CC0 1.0 | — | 4 | unpitched |
| `shaker` | shaker; variants: `down` `up` `slap` `roll` | VCSL | CC0 1.0 | — | 1 | unpitched |
| `nepal_bells` | Nepalese hand bells | VCSL | CC0 1.0 | — | 1 | unpitched |
| `world_perc` | world percussion (cajón/bongo/egg shaker/castanets/darbuka etc., variants in info()); variants: `cajon_flamenco_1` `cajon_flamenco_3` `cajon_flamenco_2` `bongo_muted` `bongo_high` `bongo_low_low_velocity` `bongo_low_high_velocity` `egg_shaker_slow` `egg_shaker_fast` `egg_shaker_soft` `tambourine` `tambourine_fast` `hand_clap` `claves` `castanets` `conga` `low_conga` `high_conga` `muted_conga` `muted_low_conga` `maracas_fw` `maracas_bw` `darbuka_doom` `darbuka_tak` `darbuka_pa` | FreePats | CC0 1.0 | — | 2 | unpitched |
| `drum_kit` | pop drum kit MuldjordKit (CC BY 4.0); variants: `kick_drum_left` `kick_drum_right` `snare_1` `snare_2` `hi_hat_closed` `hi_hat_open` `ride_left` `ride_bell_left` `ride_right` `ride_bell_right` `crash_left` `crash_right` `china` `tom_1` `tom_2` `tom_3` `tom_4` `snare_rest_1` `snare_rest_2` | MuldjordKit | CC BY 4.0 | — | 16 | unpitched |

### Keyboards

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `piano` | Salamander grand piano (Yamaha C5, 5 velocity layers) | Salamander | CC BY 3.0 | A0–C8 | 5 | natural decay |
| `upright` | upright piano (warm, slightly worn) | VSCO 2 CE | CC0 1.0 | C1–G7 | 3 | natural decay |
| `honky_tonk` | old player piano (saloon honky-tonk flavour) | FreePats | CC0 1.0 | G#0–B7 | 1 | natural decay |
| `harpsichord` | harpsichord (Italian) | VCSL | CC0 1.0 | F#1–B5 | 1 | natural decay |
| `organ` | pipe organ, full manual (with the 16' stop, heavy) | VSCO 2 CE | CC0 1.0 | C2–C7 | 1 | sustained, extendable |
| `organ_soft` | pipe organ, soft manual stops | VSCO 2 CE | CC0 1.0 | C2–C7 | 1 | sustained, extendable |
| `organ_pedal` | pipe organ, pedal bass (pitch as measured) | VSCO 2 CE | CC0 1.0 | F#1–F#4 | 1 | sustained, extendable |
| `accordion` | button accordion | FreePats | CC0 1.0 | B2–G5 | 1 | sustained, extendable |

### Plucked strings

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `guitar_nylon` | nylon-string classical guitar | FreePats | CC0 1.0 | G1–C6 | 1 | natural decay |
| `ukulele` | ukulele | FreePats | CC0 1.0 | B2–C6 | 1 | natural decay |
| `electric_guitar` | clean electric guitar | FreePats | CC0 1.0 | C2–C#6 | 3 | natural decay |
| `electric_bass` | electric bass, fingered | FreePats | CC0 1.0 | E1–D#2 | 1 | natural decay |
| `jazz_bass` | double bass, jazz pizzicato (Sneakybass) | Karoryfer | CC0 1.0 | C1–C4 | 1 | natural decay |
| `strumstick` | Strumstick, dulcimer-style folk plucked instrument (steel-string folk feel) | VCSL | CC0 1.0 | D3–A5 | 3 | natural decay |
| `dan_tranh` | Vietnamese zither Đàn tranh (same family as the guzheng, can stand in for a guzheng) | VCSL | CC0 1.0 | B2–B5 | 3 | natural decay |
| `dan_tranh_trem` | Vietnamese zither, yaozhi (摇指, tremolo) | VCSL | CC0 1.0 | B2–B5 | 1 | sustained, extendable |

### Folk

| Name | Description | Source | Licence | Sampled range | Velocity layers | Type |
|---|---|---|---|---|---|---|
| `erhu` | erhu, sustained | Karoryfer | CC0 1.0 | D4–A5 | 1 | sustained, extendable |
| `erhu_stac` | erhu, short bow | Karoryfer | CC0 1.0 | D4–A5 | 1 | natural decay |
| `bagpipe` | bagpipe (chanter; G2/G3 are the drones) | FreePats | CC0 1.0 | G2–G5 | 1 | sustained, extendable |

### Physical modelling (pluck.py)

`guqin` `pipa` `shamisen` `koto` `banjo` `acoustic_guitar` `nylon_guitar` `upright_bass_pizz` `harp` `kalimba` `music_box`: any pitch (C4=60, fractions allowed), see section 3.

### Aliases

`strings`→violins, `cello`→cellos, `viola`→violas, `double_bass`→contrabass, `upright_bass_pizz`→jazz_bass, `french_horn`→horn, `glock`→glockenspiel, `vibes`→vibraphone, `chimes`→tubular_bells, `grand_piano`→piano, `acoustic_guitar`→guitar_nylon (in sampler; in pluck, `acoustic_guitar` is the steel-string model), `guzheng`/`zither`→dan_tranh, `sax`→tenor_sax, `kick`→bass_drum, `cymbal`→crash, `tamtam`→gong, `celesta`→glockenspiel (there is no celesta sample; the glockenspiel is closest).

---

## 6. Picking instruments by style (quick reference)

| The feel you want | Suggested combination |
|---|---|
| Orchestral / epic / documentary | `violins` `violas` `cellos` `contrabass` as the bed (`attack=.3~.8` fade-in) + `horn` `trombone` `tuba` + `timpani` `gran_cassa` `sus_cymbal:roll` `gong`; for light, brisk passages use `violins_spic` `cellos_pizz` `flute_stac` |
| Fairy tale / gentle / handmade | `glockenspiel` `celesta→glockenspiel` `pluck:music_box` `kalimba` `harp` `vibraphone` `hand_chimes` `ukulele` `guitar_nylon` + `clarinet` `flute` |
| Chinese | Samples: `erhu` `dan_tranh` (as guzheng) `dan_tranh_trem` (yaozhi tremolo) `gong2:small` `frame_drum` `log_drum` `woodblock`; modelled: `pluck:guqin` (with slides/harmonics) `pluck:pipa` (lunzhi tremolo); there are no dizi/xiao samples, use `flute` `recorder` `ocarina` instead |
| Japanese | `pluck:shamisen` `pluck:koto` + `flute`/`recorder` (in place of shakuhachi) + `gran_cassa` `frame_drum:large` `toms:low_mallet` (there is no CC0/CC BY taiko; layer these to build one) |
| Jazz / café | `piano` `jazz_bass` `alto_sax` `tenor_sax` `trumpet_mute` `vibraphone_hard` + `drum_kit:ride` `drum_kit:hihat` `snare2:taps` `claps` |
| Retro / old film / saloon | `honky_tonk` `upright` `accordion` `harmonica` `banjo` `clarinet` `tuba_stac` `strumstick` |
| Baroque / court | `harpsichord` `organ_soft` `recorder` `violin` `cellos` `oboe` `bassoon` |
| Church / sacred | `organ` `organ_pedal` `tubular_bells` `hand_chimes` `vibraphone_bowed` + a long `room(size=.8)` |
| Pop / upbeat | `drum_kit` `electric_bass` `electric_guitar` `piano` `glockenspiel` `claps` `shaker` `tambourine` |
| World / folk | `world_perc` (cajón/bongo/darbuka/castanets/shaker) `cajon` `conga` `mbira` `hang` `bagpipe` `pluck:banjo` `guitar_nylon` |
| Cold / ethereal / sci-fi | `vibraphone_bowed` `glass` `hang` `sus_cymbal:bow` `violins_trem` (low velocity) + `room(size=.9, mix=.35)` |

---

## 7. Known issues / cautions

- **`organ` (all stops out) includes the 16′**: the measured fundamental is an octave below the key name (pyin measures D3 for key D4); this is the organ's natural weight. If you want "key name = actual pitch", use `organ_soft`. `organ_pedal` pitches are given as measured.
- **Tubular bells `tubular_bells`**: a tubular bell's "strike tone" is a virtual pitch (the missing fundamental of partials 4/5/6 in the ratio 2:3:4); checked against the spectrum and correct, but pyin reports it an octave/fifth high, which is normal.
- **Timpani `timpani`**: only 5 drums (main vibration mode measured from the spectrum at about F2, B2, D3, E3, G3); `note('timpani', X)` transposes from the nearest drum; the most natural use is `hit('timpani', 'drum1'...)` or writing only notes between F2 and G3.
- **Hang `hang`**: the original instrument is in D minor (A3 D4 E4 F4 G4 A4 C5 D5 etc.); it sounds best on its own notes; other notes are transposed, and the overtones shift with them.
- **`tenor_sax` (vibrato version) has a slow attack**: for short notes use `tenor_sax_stac`/`tenor_sax_nv`; the `contrabass` sustained recordings contain real bow-change swells (about once every 2.3 s).
- **Long-note extension** has been tested at the 25 s scale: the extended section's level differs from the original recording's median by <1 dB, and level jumps between adjacent 0.1 s windows are mostly ≤3 dB (violin section/sax swing up to ~6 dB because of their own vibrato). For extremely long (>1 minute) sustained notes, retrigger in segments or overlap them with an `attack` fade-in.
- **Missing instruments**: no CC0/CC BY licensed samples were found for **taiko, a Chinese gong-and-drum set (big drum/cymbals/small gong as a full set), celesta, music box samples, acoustic steel-string guitar samples, dizi/xiao/shakuhachi** (Floe/SCC taiko is CC BY-SA, so it is excluded under the licence policy). Substitutes: taiko→`gran_cassa`+`frame_drum`+`toms:low_mallet`; gong→`gong`/`gong2:small`; celesta→`glockenspiel` (low velocity); music box→`pluck:music_box`; steel-string guitar→`pluck:acoustic_guitar`/`strumstick`.
- Files missing from the download: the FreePats ukulele's `chuck.wav` (muted strum) was restored with 7-Zip; nothing else is missing.
- The first call to `pluck` JIT-compiles (numba, ~0.5 s, result cached in `core/audio/__pycache__`); `sampler` takes ~10 ms the first time it reads a sample, then serves it from the memory cache (transposition results are cached too).
- Stereo: samples are mixed down to mono when read (one uniform interface); spatial feel comes from `pan` + `room()`.

---

## 8. Self-checks done (no listening was possible: everything rests on data)

**What was verified**
1. **Pitch**: every sample of all 97 sampled instruments had its fundamental measured with yin and written into `index.json`; the octave conventions of the file names were corrected by an octave-consistency vote (VSCO/VCSL mostly +12, Karoryfer −12, timpani from the main spectral vibration mode). The first note of 61 instruments was **rendered on its own and spot-checked with librosa.pyin: 59/61 within ±50 cents, passing ones with median deviation +3.7 cents and maximum 16 cents**; both "failures" are known and checked: tubular bells (virtual pitch; the 2:3:4 spectral partials confirm the strike tone is right) and `organ` (16′ stop, fundamental an octave low). Spot-checking the same 61 first notes directly in the finished mix: 57/61 pass; the other 4 (glockenspiel, tubular bells, erhu, banjo) were disturbed by the previous instrument's decay or are virtual pitches, and are all correct when rendered alone / checked against the spectrum (glockenspiel rendered alone: spectral peak = D6 +12 cents).
2. **Physical modelling**: 11 presets × 2–3 pitches all hit by pyin (within ±1 cent); the pyin trace of the guqin `bend` matches the setting (0.8→1.4 s sliding from 50 to 52); harmonic pitches correct; pipa lunzhi measured at 13.3 per second (set to 14); shamisen sawari on/off spectral centroid of the sustain 2030 Hz / 1500 Hz; decay times guqin≈4.3 s, pipa≈2.1 s, shamisen≈0.9 s, banjo≈1.0 s (T60 extrapolated from -30 dB).
3. **Finished-mix numbers**: 85.5 s, 48 kHz stereo, no NaN/Inf, peak −2.0 dBFS, 0 clipped samples; median 0.5 s RMS −24 dBFS.
4. **Long-note extension**: violin section/cello section/flute/trumpet/horn/clarinet/oboe/accordion/bagpipe/erhu/sax/organ rendered as 14–25 s long notes; the extended sections have no silent holes and their level matches the original recording (see the figures in the item above).
5. **Every instrument** has actually been loaded and rendered once (no exceptions, no NaN), every percussion variant hit once, and peaks normalised per variant to ~0.4.

**What could not be verified**
- Whether the subjective timbre is "convincing", whether the mix sounds good, whether velocity-layer switching is smooth, whether the extension splices have audible phase/timbre jumps: these can only be judged indirectly from data. Listen with your own ears the first time you use them (one small motif per instrument is enough).
- The "folk flavour" of the physical models (the guqin's loose, deep tone, the shamisen's sawari texture) was tuned only by physical parameters and spectral trends, never compared by ear with real recordings.
- Microtones, and the timbre of notes transposed more than ±6 semitones beyond the sampled range.

---

## 9. Directory layout

```
core/audio/
  sampler.py            sampled-instrument engine (section 2 of this file)
  pluck.py              physically modelled plucked strings + modal synthesis (section 3)
  instruments/
    index.json          pitch/velocity/level index (rebuildable with build_index())
    vsco2ce/            VSCO 2 CE selection (strings/woodwinds/brass/percussion/upright piano/pipe organ)  395 MB
    vcsl/               VCSL selection (harp/vibraphone/tubular bells/marimba/harpsichord/sax/harmonica/đàn tranh/percussion…) 271 MB
    salamander/         Salamander Grand Piano V3 (5 velocity layers, FLAC 48k/24bit)  218 MB
    freepats/           FreePats CC0 packs + MuldjordKit (CC BY 4.0)  397 MB
    karoryfer/          erhu / Sneakybass / Weresax  74 MB
```

Source links: VSCO 2 CE https://github.com/sgossner/VSCO-2-CE · VCSL https://github.com/sgossner/VCSL · Salamander https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html · FreePats https://freepats.zenvoid.org/ · Karoryfer https://github.com/sfzinstruments (aliexpress-erhu / karoryfer.sneakybass / karoryfer.weresax)

Availability: the sample libraries must be downloaded first (`sh tools/fetch.sh instruments <lib>`, see the top of this file). When a library that hasn't been downloaded is used, `sampler` raises an error naming the command to run. `sampler.py` needs only the core-tier Python packages; `pluck.py` needs numba (`setup.sh deps music`).
