# Stained Glass — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Dragon of the East Window* (56.5 s) · `stained-glass.mp4` · source in [`demo/`](demo/)


## Story & structure

An east window in a stone hall shows a knight sent to slay "the dragon that ate the sun". Wherever the sun falls, that pane's story moves. At dusk, in the last pane, the knight strikes and the glass cracks: he sees that the dragon was guarding the sun's last ember, kept warm until morning. The pieces slide back along the leads and are re-welded into a kneeling knight with his sword laid flat. At night only that pane still glows. The title's "East" is the answer: because the dragon keeps the ember all night, the sun can rise in the east again.

The window: four lancets side by side plus a rose above, in a thick splayed wall, the title carved on the string course below. Left to right = one day:

| Pane | Time | Light | Scene |
|---|---|---|---|
| I | dawn | cool blue-white, low | the charge: knight on the battlements, sword raised; a roundel in the canopy shows "the sun-eating dragon" (the folk misunderstanding) |
| II | noon | white-gold, brightest, short patch | the journey: hills, trees, a river, a dove passes |
| III | afternoon | gold, patch lengthening | the fight, played out in the floor patch |
| IV | dusk | deep red-orange | the ember: strike → crack → wings slide open → re-leaded kneeling knight |
| Rose | all day | follows the sun | a sun wheel (gold centre, red and blue petals); its brightness is a clock, dark at night |

Structure used: one scene per lancet, each lit in turn (dawn → noon → afternoon → dusk), the rose as the sun clock, opening in darkness with a knife-thin ray, one hard crack at the emotional peak, then silence, a slow reveal, re-leading on the beat, a single bell, night. Native moves spent: light is time (throughout), glass projects onto stone (the duel, 24–30 s), cracks and mending leads (31.8–44.6 s), a window that holds its own light (47–53 s). Rhymes: the dawn ray at 0.5 s and a thin blue dawn ray on the end card at 55.2 s play the same glass note; the new lead lines remain as a scar where the story changed.

Ways to adapt other topics (for reference): a sequence of stations the light visits in order; a product launch as stages of making with the product as the pane that glows at night; a biography in four panes with the one choice as the crack; history as eras across the day.

## Shots

80 BPM: one beat 0.75 s, one bar 3.0 s; times set from measured voice lengths.

| # | Time (s) | Shot | Camera | Sound |
|---|---|---|---|---|
| S1 | 0.0–4.8 | Black, faint dust. 0.5 a knife-thin dawn ray lights pane I top to bottom (`bandW` 18 → 310, skew .45 → .06, ~1 s); 2.6 the knight lifts his head | low close-up, pane ≈ 85 % of frame height | glass tink + air; recorder chant over organ pedal D; L1 at 1.0 |
| S2 | 4.8–9.6 | Pull back to the whole window; only pane I lit, a blue floor patch, dust in shafts; 5.4 a light sweep gilds the carved title | wide: the audience learns the rule in one frame | water glass + hand chime |
| S3 | 9.6–15.6 | Push into pane I; 11.1 sword raised (three stepped poses, on the beat); the canopy roundel lights | medium | harp Dm–G, recorder, chimes; L2 at 10.0 |
| S4 | 15.6–17.2 | The light slides right; pane I dims, knight frozen mid-step | truck with the band to pane II | water-glass glide, wind |
| S5 | 17.2–22.6 | Noon: knight steps piece by piece on the beat, background pieces shift back; 20.4 a dove | medium, very slow follow | harp, chimes, tubular bell on 17.2; L3 at 17.8 |
| S6 | 22.6–24.0 | Light reaches pane III, gold; dragon rears, red wings open | tilt down the shafts to the floor | full organ enters, timpani hit |
| S7 | 24.0–30.0 | **The floor duel**: stretched coloured patch with lead lines on flagstones; three clashes (charge / shield / wing sweep) on beats; the patch keeps lengthening | top-down on the flagstones; the subject is light | organ ostinato, timpani per clash; L4 at 24.4 |
| S8 | 30.0–31.8 | Back up to the window, red light on pane IV: knight raises sword, dragon curled, wings over its chest | low medium, charge | timpani roll |
| S9 | 31.8 | The blow (two stepped frames) → the pane cracks: 9 white lines in 0.28 s, flash 0.45 s, 2-frame shake | same framing, no cut | all music hard-cut, glass shatter + long reverb |
| S10 | 31.8–33.8 | Stillness; dust falls in red light; 33.0 wing pieces slide along the leads to reveal an amber ember | slow push to the ember | silence: reverb tail, lead creak, glass friction |
| S11 | 33.8–41.3 | The ember breathes; knight's face swaps from stern to astonished (one face piece) | close: face + ember in one frame | soft organ, sparse chimes; L5 33.8, L6 38.3 |
| S12 | 41.3–44.6 | **Re-leading**: groups (sword → legs → torso → arms) slide to kneeling, sword flat before the ember; a weld spark per beat | locked medium | one rising Dorian note per weld |
| S13 | 44.6–47.2 | Last weld = one bell; mending leads remain | still frame | tubular bell D, long reverb; L7 at 45.0 |
| S14 | 47.2–52.9 | Night: red → violet → moonlight; all panes grey-blue except pane IV, glowing warm from inside | slow pull back to the S2 wide | recorder reprise, harp harmonics; L8 at 49.2 |
| S15 | 52.9–56.5 | End card carved in the stone band; 55.2 a thin blue dawn ray touches pane I | push in on the string course | ends on a D–A open fifth; 55.2 the same glass tink as 0.5 |

Why this route, for this story: the knife-thin ray gave the spectacle in the first second; the pull-back taught the light rule; trucking with the light made time visible; the floor was the only place the duel could be bigger than its lancet; holding through the crack let the medium break instead of the edit; the return to the S2 wide showed the light had moved from outside the window to inside it. Each is one choice from STYLE.md §6, not the style's default opening or ending.

Staging in pane IV: close-ups at 1.3–2.3× on a 300-unit lancet; knight lower-left, dragon upper-right. Stage the reveal at the final zoom: both figures small, the ember at frame centre at ≥ ~1/8 of the frame width with its glow, the knight on the left third looking at it, the dragon whole inside the pane, then a pull-back to both.

## Score structure

Original score (`demo/music/score.py`), medieval / plainchant feel, **D Dorian** (the raised 6th, B♮, gives the colour), 80 BPM for the metred cues. Instruments: `recorder`, `organ_soft` / `organ` / `organ_pedal`, `harp`, `hand_chimes`, `tubular_bells`, `timpani`, `glass` (water glass, "the light"), `glockenspiel` (dust glints, rare). All CC0 (VSCO 2 CE / VCSL / FreePats). Bus reverb `room(size=.8, mix≈.3)`; the bell alone at `size≈.95`.

| Cue | Time | Tempo | Orchestration | Sync |
|---|---|---|---|---|
| C1 Incipit | 0.5–9.6 | free | solo recorder chant over organ pedal D2 / soft D3–A3 drone | 0.5 ray (water glass D6); 5.4 title (glass + chime) |
| C2 Dawn | 9.6–15.6 | 80 | harp arpeggios Dm–G (Dorian i–IV), recorder, chimes on downbeats | 11.1 sword raise |
| T1 Light moves | 15.6–17.2 | — | rising water-glass glide | 17.2 arrival |
| C3 Noon | 17.2–22.6 | 80 | harp, chimes, tubular bells, recorder up an octave, soft organ | a step per beat |
| C4 Battle | 22.6–31.8 | 80 | full organ eighth-note ostinato (Dm–C–B♭–C), pedal, timpani | clashes 24.75 / 26.25 / 27.75; roll 30.0–31.8 |
| — Crack | 31.8–33.8 | — | **everything hard-cut, reverb tails included**; only the shatter's own reverb | 31.8 |
| C5 Ember | 33.8–44.6 | 60 (free) | warm soft-organ chords, sparse chimes, harp harmonics | from 41.3 one weld note per beat up the mode |
| C6 Bell | 44.6–47.2 | — | a single tubular bell D, very long reverb | the sword laid down |
| C7 Nocturne | 47.2–56.5 | free | recorder reprise (softer), soft organ D, harp harmonics | ends on a D–A open fifth |

Foley specific to this film: the ember's quiet crackle, far pigeons in the vault, the dove's wings, sword and shield clashes. Music ducked ~9 dB under the voice; timpani and heavy glass hits avoid word onsets.

Voice: Kokoro `bf_alice`, speed .86–.88, "like a nun telling an old story", 8 short lines (`demo/lines.json`). Whisper hears "knight" as "night": the expected transcription goes in the line's `asr` field.

## Palette & props

- Transmittance colours: cobalt `#1d3a9c` (dominant) · deep blue `#142a70` · ruby `#a8101c` · gold `#dc9a22` · emerald `#2f7f36` · olive `#6b7a22` · murrey `#632a63` · flesh `#d2a288` · white `#cfdac6` · mail `#a9b7b2` · sky `#7fa2cf` · umber `#7a4e24` · ember amber `#ff9a2a` (the story light).
- Sun colour × intensity: dawn `(.70,.83,1.0)` × 2.2, low, long patches · noon `(1,.97,.9)` × 2.7, short patches · afternoon `(1,.84,.6)` × 2.35 · dusk `(1,.6,.34)` × 2.6 · night moon `(.55,.66,1.0)` × 0.5 through every pane, plus the ember.
- Lit pane backlight 2.2–2.8, band edge `bandW` ≈ lancet width + 10, soft 24, slight diagonal skew.
- Lead `#1d1f23`, 6 units (4.2 quarries, 3–4 small details). Aged piece edges: two soft strokes, rgb 206 / 168.
- Grisaille trace `rgba(44,26,12,.88)`: brows 3.8, eyes 3.0, folds 2.3–2.6 units; matting `wash .35–.45`; scraped highlights use the piece's own colour `g.__col`.
- Borders: ruby band with gold pearls + white fillet with a running vine; quarries carry a small vine curl each.
- Room: ashlar courses 86 units; the title in Cinzel on the string course with a moving strip of light.
- The knight (`knight.js`): elongated ~7.5-head proportions, big hands, mail as staggered arcs, a sun device on the shield, swappable face pieces (stern / astonished). The dragon (`dragon.js`): a wyvern built as a spine chain cut into banded dorsal and belly pieces, scales as arcs along the spine, transverse belly plates, open and folded wings, the ember at its chest.

## End card

The carved inscription on the stone string course changes from *THE DRAGON OF THE EAST WINDOW* to *STAINED GLASS* and *LEMOLAB × CLAUDE OPUS 5.5* (Cinzel 600, incised and gilded, revealed by the sweep light); the camera pushes in so the credit line is ≥ 30 px, and a thin blue dawn ray touches pane I. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Rights

Original story, characters, window design and score. References (see STYLE.md header) were studied for grammar only; no Chartres window subject or religious imagery is reproduced. Samples are CC0; fonts are OFL (see `demo/CREDITS`).

## Build notes

```
styles/stained-glass/demo/
  glass.js    pieces, textures, lead, grisaille brushes, lozenges    comp.js   WebGL2 compositor (glass/stone/floor/shafts/bloom)
  knight.js   glass knight rig + poses + faces                       dragon.js wyvern rig (spine bands, head, folded/open wings, ember)
  window.js   lancets, rose, borders, scenes, stone wall, carving    scene.js  camera, floor projection, shafts, dust -> compositor
  story.js    timeline: light, camera, lancet states, crack, re-lead, events, subtitles
  subs.js     banderole subtitles     test.js  model sheet / test pages (?test=sheet|knight|dragon)   frames.js  style frames (?frame=...)
  lines.json  narration   music/score.py  original score   mix.py  foley + mix   subs_export.py  -> .srt   build.sh  one-shot rebuild
```

1. `node core/render/still.mjs styles/stained-glass/demo 36 --q nosub=1`: review stills. `?test=sheet` for the model sheet.
2. `core/tts/tts.py lines.json voices` → `asr_check.py`.
3. `node core/render/events.mjs` → `music/score.py` → `mix.py` → `subs_export.py`.
4. `node core/render/video.mjs styles/stained-glass/demo --fps 24 --workers 3` (1356 frames, about 3–4 min with 3 workers; Canvas2D vector glass plus the WebGL compositor).
5. `CRF=22 sh demo/tools/mux.sh out/video24.mp4 mix.wav stained-glass.mp4 24 4` (grain 4). Or simply `sh styles/stained-glass/demo/build.sh`.

Pitfalls tied to this demo's props:
- A folded wing built from the open-wing rig looks like a pile of sticks: draw a dedicated folded silhouette (knuckle up, pleated blade sweeping back), far wing hidden.
- The turning-point reveal is unreadable when the knight fills the frame and the lancet edge cuts the dragon: stage it at the final zoom (see Shots).
- The carved end card at night is unreadable in the wide shot: push in and park the sweep light on the text.
- Give lines and the end card their reading time even if the film runs long (56.5 s here): L6 starts at 38.3 s so it doesn't collide with L5's reading time, and the end card has its push-in so the credit stays legible.
