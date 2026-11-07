# 60s Spy Title Sequence — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Velvet Cipher* (44 s) · `spy-titles.mp4` · source in [`demo/`](demo/)


A 30–60 second film: an agent chases a courier and a stolen key through sets built from the credits, and the key turns out to open the film's title.

## Story & structure

The graphic grammar of late-1950s / 1960s title design (Saul Bass's *North by Northwest*, *Anatomy of a Murder*, *Vertigo*; the 2002 homage by Kuntzel + Deygas for *Catch Me If You Can*): **flat, opaque inks on paper, hand-cut edges, abstraction down to silhouettes, and typography that is part of the picture's structure**. A title sequence is a story in itself: one goal, one chase, a few locations, one reveal — and the reveal is the title.

It is **not** a gun-barrel opening, not a tiptoeing cartoon panther, not a copy of any real title's logo, lettering, characters or shots. The credits contain only fictional roles ("A LEMOLAB PICTURE", "STARRING THE AGENT", "MUSIC BY THE SAMPLER") — never real names.

Pick stories that are **a pursuit of something that turns out to be the film itself**. The demo used all five native powers, the strongest (the diagonal grid assembling the title) at the peak:

| Native power | Story use |
|---|---|
| **Type is the set** | Each location is exactly one line of credits, and that line *is* the architecture: letters as colonnade pillars (the hero hides behind the **I**), words as train carriages (he leaps the gaps between words), the **O** of a name as a roulette wheel, an em-dash as a roof ledge, a letter as a lock. At some moment every line must be fully readable. |
| **Credits are rhythm** | Credits land on beats. Brass stabs = hard cuts. Hold each credit long enough to read it alongside a subtitle. |
| **Graphic match cuts** | Abstraction makes shape rhymes cheap and powerful: wheel → roulette → pupil → moon → keyhole. Cut on the brass, and make the interval shrink (2 bars → 1.5 bars → 2 beats) as the chase accelerates. |
| **The diagonal grid** | The opening splits along a 30° diagonal that multiplies into a grid; at the climax every fragment flies back along the same diagonals to assemble the title; the title closes along the same cut. Opening wound → closing seam. |
| **Silhouette puppets** | Figures are flat cut paper, always in profile, animated on twos. All acting is outline and timing: run, flatten, look back, freeze. |

Adapting any topic: make the topic the **MacGuffin** and the title its destination. A product launch → the product is the stolen object, and its logo is what the fragments assemble into. A lecture → the key idea is chased through four "chapters" set as credits. A birthday → the chase ends with the name assembling.

**Emotional arc (35–45 s):** a cold open on one shape + one line of briefing (hook in 3 s) → the theft → pursuit through 3–4 locations, each shorter than the last → a gag (hero half-hidden; stop-time freeze) → acceleration montage of shape-match cuts → the catch in silhouette against a giant circle → the world shatters along the grid and assembles into the title → a quiet button: one beat of silence, one bongo, one deadpan line.

## Shots

| Beat | Camera |
|---|---|
| Cold open | Locked, centered single shape (the keyhole) on black. It is secretly an extreme close-up of the title's **I**. |
| Every credit-set location | Start **wide enough to read the entire credit line**, then push/truck in to the action. |
| Chase | Lateral tracking (Catch Me grammar): screen direction always left → right, pursued ahead, pursuer behind. |
| Montage | Hard cuts on brass stabs; circles keep the same screen position and size across the cut. |
| Hero moment | Silhouette in front of a giant cream moon. |
| Ending | Push in on the title's lock until the frame matches the cold open exactly, then hard-cut back to the full title on the final bongo. |

- **Puppets on twos** (12 fps): poses *and* positions of figures, hands, letters landing, the plane. **Camera, credit slides, grid growth on ones** (24 fps) — a stepped camera reads as judder.
- Run cycle: 8 drawings, one step per beat (cycle = 2 beats at 132 BPM), lean 0.3 rad, tie flying at ~65°. Walks: 1 step per beat, coat swinging.
- Credits slide in along grid lines and stop dead on the beat (ease-out, 0.2 s), letters land with a paper slap.
- **Stop-time**: at a brass stab the whole picture (background scroll included) freezes for 2 beats while the music is dead silent, then resumes — the big-band device made visual, and a wordless gag.
- The climax: the previous scene is sliced into strips parallel to the cut line that slide off alternately along the diagonal (N×NW), while title glyphs fly in along the same diagonal and land on consecutive 16th notes.

## Score structure

- **Music: 1960s spy big band** (not cool noir jazz, not ragtime), minor key, ~132 BPM. Original motif: a chromatic descent from the fifth, then a leap to the tonic (B–A♯–A–G | E), dotted rhythm. **Avoid** the famous E–F–F♯–F crawl and the Em(maj9) ending chord; end on Em6/9.
- **Brass stabs = edit points**: `trumpet_stac` + `trombone_stac` stacked in octaves + crash, ~0.25 s, placed 8 ms early so the sample peak hits the frame. Surf guitar low-string twang (`electric_guitar`) through a home-made spring reverb (dispersive chirp echoes, ~41 ms round trip, 2 s decay). `jazz_bass` walking. Brushes early (soft snare + egg shaker), sticks for the train (16th "rail" snare). `world_perc` bongos/shakers for the casino. Big chord for the title, then a short button, **one beat of digital silence**, one dry bongo.
- **Silence is a tool**: cold open is only a tape click; stop-time and the last beat are true zero (reverb tails included); the final line plays over nothing but tape hiss.
- **Foley follows the material**: paper (cut "shh", slides, card slaps for every letter landing, blind flips, a tear for the shatter), metal (key jingle, chain snap, key sliding into the lock, the lock click), tape (click, hiss). Environments only hinted: jet pass (panned L→R), train rumble with wheel "ka-chunk" in tempo, roulette ball ticks slowing down, rooftop wind.
- **Voice**: British mission-briefing male (Kokoro `bm_george`, speed 0.9–0.97) through a tape chain: band-pass 220–5200 Hz, soft saturation, 0.9 Hz wow, hiss that rises under the voice. 4–6 very short lines; the last line pays off the first ("Nobody knows what it opens." → "Now you know what it opens."). Music ducks ~−7 dB under the voice. Loudness −14 LUFS.

## Palette & props

- **Four inks, no gradients**: ink black `#1b1714`, paper cream `#efe4c9`, signal red `#d23a22`, mustard `#e2a52a`. Allowed "darker paper" variants only for depth/shadows: `#9a2a18` (dark red), `#b07e1c`, `#3a322b` (distant city). Each scene gets one dominant ground color: black (cold open, rooftop), red (grid, train, casino), cream (velvet, title), mustard (airport).
- **Scissor-cut edges**: every polygon is resampled every ~9–10 px and displaced along its normal by low-frequency noise (amp 1.2–2.2 px, larger for bigger shapes) plus a rare 1–2 px notch. **Cut the edge once in the piece's local space and cache it** — a moving cutout keeps the same edge, exactly like real cutout animation. (Edges computed in screen space "crawl" when pieces move.)
- **Paper layering**: separate pieces are separated by a **2.4 px cut gap in the ground color** and cast a small paper shadow (offset 2.5/3.5 px, blur 5, alpha ~0.3). Whole figures get the gap as an outline, so a black figure still reads in front of a black letter.
- **Paper texture**: one full-frame texture multiplied on top (low-frequency mottling + faint fibers) and a sparse "ink void" speckle screened on (only shows on dark ink), plus faint horizontal squeegee streaks. Film grain in the mux at ~6. No halftone (that belongs to other styles).
- **Silhouette figures** (model sheet: `?sheet=1`): 7-head-tall agent with narrow-brim hat (the band is a cut slit), broad-shouldered jacket, pointed shoes, **one red tie as his only color** (it streams back when he runs — the motion indicator). Villain 1.2× taller: wide flat brim, A-line coat with a red lining that only shows when he runs, a mustard key chained to his wrist so the MacGuffin is findable in every shot. Pieces **merge into one outline** inside the figure; only thin (1.7 px) slits at shoulder, elbow, hip/hem and knee. Hands are sharp wedges. No faces except a cream eye slit in close-ups.
- **The MacGuffin** always sits on a black backing (= ink keyline) so it reads on any ground; it is the brightest thing in frame.
- **Type**: credits in League Gothic (OFL), glyph outlines extracted with opentype.js and **re-cut** per letter (edge noise, ±0.8° rotation, ±1.5 px baseline jitter). The film title uses custom geometric cut glyphs (straight cuts + arcs, uneven weights, jaunty staggered baselines) — never a real title's lettering. Subtitles in League Spartan 600.

## Titles, subtitles & end card

- **Subtitles**: a narrow paper strip (scissor-cut ends, tilted −1°) bottom-left at (96, 958), a small red keyhole glyph as the bullet, League Spartan 600 44 px. Cream strip with ink text on dark scenes; ink strip with cream text on cream scenes. Slides in 60 px from the left in 0.18 s. Display ≥ max(1.8 s, voice + 0.6 s).
- **Credits live in the set**, never in the subtitle band. One line per location.
- **Title**: custom cut glyphs; the MacGuffin's slot is a letter (here the I of CIPHER is a black "lock plate" with a red keyhole; the key's outline fills it).
- **End card**: small title, "60s SPY TITLE SEQUENCE" in cut League Gothic, "LemoLab × Claude Opus 5.5" in red Spartan, tiny agent tipping his hat. Under the credit line, the licence credit for the MuldjordKit drums (CC BY 4.0). The LemoLab sign-off (and the "A LEMOLAB PICTURE" credit) belong to this library's demo only: a user's film carries no LemoLab credit and no copy of this card; its fictional credits name the user's own roles.

## Pitfalls

- Every internal piece outlined with a gap makes the figures look like wooden-mannequin diagrams. Draw each figure into an offscreen layer where pieces merge, cut only joint slits (`destination-out`), then composite with an 8-direction ground-color outline + one shadow.
- `clear()` that resets the transform silently kills the camera → keep the camera matrix across the background fill.
- The hero fully hidden behind the I reads as "nobody there": shift him so hat brim, nose, tie knot and the fluttering tie stick out past the pillar. The tie must wave (multi-segment ribbon with travelling sine + width wobble) or it reads as a tongue.
- A credit that is only ever seen partially ("R R I N") is uncomfortable to read: always open wide on the full line.
- Telegraph poles in black between word-carriages read as the letter I — push background props into a darker version of the ground color.
- A mustard key on a mustard ground vanishes — give it a black backing.
- A roulette wheel dropped into a space character covers neighbouring letters; lay out the two halves of the word around a gap of 2.2 × radius.
- A near-arm drawn on top with the wheel/pupil/moon matches: keep circle centers identical across cuts or the match doesn't register.
- Brass staccato samples need ~8 ms to peak — place them early so the hit lands on the cut.
- A peaky mix (big stabs over quiet brushes) stops at −14.4 LUFS under the −1.2 dBTP ceiling; push ~4 dB into a limiter before loudnorm.

## Build notes

```
styles/spy-titles/demo/
  paper.js   four inks, scissor edges (cached), cut gaps, paper shadow, texture, silhouette layer + joint slits
  glyph.js   League Gothic → opentype.js outlines → re-cut letters
  chars.js   agent / courier rigs (side, front, back), poses, run/walk cycles, key + keyhole
  title.js   custom title glyphs, lock-plate I, diagonal split
  scenes.js  keyhole, grid, velvet, intro, airport, train, wheel, casino, pupil, rooftop, title background
  film.js    timeline, acting, cameras, subtitles, sound events     story.js  132-BPM grid (single source of truth)
  sheet.js / frames.js   model sheet and style frames
  music/score.py   original big-band score (sampler)      mix.py  foley + tape voice + ducking
```

1. `node core/render/still.mjs styles/spy-titles/demo 12 20.8 --q nosub=1` — review stills (`?sheet=1&v=1`, `?frame=airport|train|title`).
2. `core/tts/tts.py lines.json voices` → `core/tts/asr_check.py` (6/6).
3. `python music/score.py` → `node core/render/events.mjs` → `python mix.py`.
4. `node core/render/video.mjs styles/spy-titles/demo --fps 24 --workers 3` (1058 frames ≈ 17 s, Canvas2D).
5. `CRF=24 sh demo/tools/mux.sh out/video24.mp4 mix.wav spy-titles.mp4 24 6` (core mux + a CRF knob: flat inks + grain at crf19 = 270 MB, at crf24 = 18.5 MB with no visible difference). Or just `sh demo/build.sh`.
