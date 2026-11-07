# 16-bit Pixel RPG — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Last Save Point* (54.5 s) · `pixel-rpg.mp4` · source in [`demo/`](demo/)

A 30–60 second film: a lone hero at a save crystal remembers his lost companion through three eras of colour depth, then opens the great door.

## Story & structure

A world drawn at **320×180 native pixels**, scaled ×6 with nearest-neighbour to 1080p. Every color comes from a **limited, indexed palette**. Gradients are **ordered dither**, not blends. Characters are **sprites** around 22×34 px that animate in a handful of frames. Story is told the way a game tells it: through **dialog boxes with portraits**, **menus**, **status bars**, **battle messages** and **save files**.

It is *not* HD-2D (no depth of field, no bloom, no real-time light), *not* CRT nostalgia (no scanlines, no grain), and *not* a parody. It takes the game's systems seriously as a language for feeling.

Never use existing game names, characters, UI frames, fonts, logos, melodies or sound effects. Learn the grammar, not the assets.

Pick stories where **the game's own systems carry the emotion**. The demo used these native powers, the strongest (the palette collapse and flood) at the emotional peak.

| Native power | Story use |
|---|---|
| **Palette = feeling** | Because the image is indexed, you can swap the whole palette in one frame. Memory, grief, hope can literally be color depth. In the demo: older memories have fewer colors (16-bit → 8-bit → 4-color). The present after a loss is **faded**. The collapse of a memory is the palette **dropping one level per beat**. Hope is the full palette **flooding back through an ordered-dither wave**. |
| **Protected colors** | Exempt a few palette indices from every palette effect. One red object (a scarf) that never fades becomes the thread through the whole film, and a perfect **match cut** between eras. |
| **Game UI as narration** | Save files = a list of memories (choosing *NEW FILE* = refusing to overwrite them). A name greyed out in the party list = death, without a word. "No inn will ever heal it" = grief in the medium's own vocabulary. |
| **Text boxes & blips** | A dialog box *is* the subtitle. A character with no voice actor, only text blips, reads as someone who now exists only in text. |
| **Era shifts** | The same characters redrawn in older hardware: 4 shades at half resolution, a 13-color 8-bit set, full 16-bit. Time travel for free. |
| **Genre transitions** | Mosaic in and out for gentle memories. The **encounter swirl** to crash into danger. White flash on the climax. |

Adapting any topic: find the **game system** hidden in it. A product launch is a new item obtained (fanfare, item box, stat comparison). A farewell is a save file that is never overwritten. A career is a level-up screen. A city is an overworld map with save points.

**Arc for 45–60 s:** loneliness (quiet, faded, long scroll) → warmth (a memory) → loss (the system breaks) → resolve (the system restored in full color) → an end card that is also a game prompt (*CONTINUE ▶*).

## Shots

| Beat | Camera |
|---|---|
| Opening | Long side-scroll through a colonnade, hero small (1/6 of the frame height), four parallax layers, one colored object ahead |
| Menus | Locked-off frame, UI on the left third, hero and prop visible on the right |
| Warm memory | Wide, static or slow pan; characters small against sky or fire |
| Battle | Classic side view: enemy left, party right facing left, UI window below, message window on top |
| Loss | Hold the frame. No cut, no move while the palette collapses |
| The monument | **Integer-pixel tilt** up a three-screen-tall door to a rose window, hold, tilt back down. The one memorable camera move |
| Climax | Back view at the threshold, light spilling on the floor, color flooding outward from the hero |

- Output 24 fps. Sprites step at **8 fps** (walk) to **12 fps** (flames, KO blink). Camera and parallax move **on ones** at integer pixels. Walk speed 30 px/s ≈ 1.25 px per frame.
- Game-native acting: hop forward to act, cast pose with raised staff, knockback recoil, kneel, then the **KO blink** (12 fps on/off) and vanish. Breath = shoulders up 1 px for 0.6 s.
- UI motion: windows slide in over 0.3 s (ease-out, integer px). The hand cursor bobs 1 px at 4 fps and **stops bobbing when the character hesitates**. Text types at 38–40 chars/s (30 for 8-bit), with ▼ blinking at 3 Hz when done.
- Transitions: **thumbnail expand + mosaic** (block 10 → 1 over 0.75 s); **mosaic cross** (1 → 16 → 1 over 0.8 s, palette switched at the peak); **encounter swirl** (polar twist growing with `s^1.6`, mosaic, Bayer-dissolve to white, 0.8 s); **screen shake** of 3–2–1 px over 8 frames; **palette step fades** (4 levels), never alpha.

## Score structure

- **Music**: original chiptune (square 12.5/25/50%, 4-bit triangle, LFSR noise, wavetable). One motif runs through every section as **regional variations**. The music's fidelity follows the color depth:
  - 4-color: mono, 4-bit volume steps, 11 kHz sample-and-hold;
  - 8-bit: NES-like, mono;
  - 16-bit: stereo with SNES-style echo (3 taps ~180/270/370 ms, feedback 0.35–0.45, low-pass ~3 kHz in the loop);
  - present: the same music muffled (LP 2.2 kHz).
  During the palette collapse, the music loses one layer per step: harmony, then echo and stereo, then bass, then only a single square tone, then **one beat of silence** exactly when the image reaches the present's grey. The boss prelude is the motif in minor; the full band enters on the bar where color floods back. The end card resolves the phrase the opening left on the dominant.
- **Foley**, all synthesized and bit-crushed to the scene's era: cursor/select blips, text blips (the companion's are higher and 5-bit), stone footsteps with echo, fire crackle, ward shimmer (triangle arpeggio), charge (rising square + noise), blast (swept low-pass noise + 48 Hz thump, crushed to 6-bit), HP tick-down, KO blink, **bit-drop** per palette step (lower and coarser each time), save ticks, door grind (brown noise + AM creak), torch ignite, reverse swell.
- **One organic sound**: the hero's breath before the door, band-passed noise and not crushed. It makes him human at the last moment.
- **Silence**: after the blast (true zero, echo tails cut too) and the beat before the present.
- **Voice**: Kokoro `bm_george` at speed 0.9, first person, 5 short lines. Duck the music ~−7.5 dB under the voice (60 ms attack, 350 ms release). Mix to −14 LUFS, **grain 0**.

## Palette & props

- **Resolution & scaling**: native 320×180 indexed framebuffer (`Uint8Array` of palette indices). Present through a **lookup table** (index → RGB) and scale ×6 nearest-neighbour. Everything, including text, is drawn in the framebuffer. Camera moves are **integer pixels**; each parallax layer rounds its own offset.
- **Master palette**: ENDESGA-32 (`#be4a2f #d77643 #ead4aa #e4a672 #b86f50 #733e39 #3e2731 #a22633 #e43b44 #f77622 #feae34 #fee761 #63c74d #3e8948 #265c42 #193c3e #124e89 #0099db #2ce8f5 #ffffff #c0cbdc #8b9bb4 #5a6988 #3a4466 #262b44 #181425 #ff0044 #68386c #b55088 #f6757a #e8b796 #c28569`), plus **protected duplicates** (scarf red `#e43b44/#a22633/#f6757a`, crystal cyan `#2ce8f5/#0099db/#ffffff/#124e89`) that no palette effect touches.
- **Color-depth tables** (all computed from the master palette):
  - *16-bit*: identity.
  - *8-bit*: nearest of 15 colors `#000000 #fcfcfc #a4a4b8 #58587c #1c2c8c #3c7cfc #94e0fc #b8141c #fc7454 #fcb81c #8c4c1c #2c9c2c #fcd8a8 #0c4c18 #4c2410`. It needs a dark green and a dark brown, or night grass turns blue.
  - *4-color*: fixed luminance thresholds (<60, <115, <175) → `#1f2a1c #4b5e3a #93a263 #d6dba6`. Draw 4-color scenes with the four representative indices (ink / slate / steel / white) so every pixel lands on the intended shade. Render them at **160×90** and double.
  - *Faded*: `lum^0.8 × 7` → 7 blue-greys `#0e0d17 … #c3c9d6`. **Do not** map by rank: rank mapping crushes the scene to black.
  - *Collapse steps*: 16-color and 8-color subsets that **keep warm hues** (orange, pink, plum), or the first step turns the frame red. Then 4 grey-blues, 2 tones, faded.
- **Light is index stepping**: a `LIGHT[]` / `DARK[]` table moves each index one step along its ramp. Torch glow, moonlight and fire are Bayer-thresholded rings of `LIGHT[LIGHT[c]]` / `LIGHT[c]`. Firelight in an 8-bit scene uses a **warm remap** (greens → browns → rust), not generic brightening, which turns grass radioactive.
- **Dither**: 4×4 Bayer for gradients and glows. Light shafts use a flat 50% checker with a 25% edge, which reads cleaner than a gradient.
- **Parallax** (side-scroller): far wall with arched windows 0.35×, colonnade with banners and torches 0.7×, floor with pseudo-perspective joints 1×, black foreground pillars 1.6×.
- **Sprites**: a **rig** (capsule limbs with 3-tone shading from an upper-left light, per-part inner line in the material's darkest tone, global 1-px ink outline) plus **hand-placed ASCII heads**. One rig gives every pose: walk ×4, attack, hurt, look up, push, sit, kneel, back-view push. For 8-bit scenes use the same rig with the **highlight tone removed**. Give the hero a **silhouette mark**: a long scarf whose tails flutter in a **3-frame stepped cycle**, plus a cowlick.
- **Portraits** 32×32, 3/4 view, base face + eye/brow and mouth overlays (neutral, wistful, smile, sad, resolve). They carry all facial acting; the 34-px sprite face has one eye pixel.
- **Props**: the save crystal is a flat-shaded octahedron rotated in 3D and quantized to 4 protected cyans (8 frames per 90°), with a dithered halo. The great door is a front-on paneled stone door with a sunburst tympanum, voussoirs, a rune ring that splits when it opens, and a rose window above for the tilt-up.

## Titles, subtitles & end card

- **The dialog box is the subtitle**, drawn in the framebuffer at y 134–176:
  - three-layer rounded border (ink / white / silver);
  - blue→navy→night dithered fill;
  - 32×32 portrait on the left;
  - original variable-width pixel font (cap 7, x-height 5, descender 2) in white with a 1-px night shadow;
  - types with the voice; ▼ when done.
- **Skins follow the era**: 4-color light box with dark text at 160×90; 8-bit black box with white frame and an 8-bit portrait; 16-bit/present blue (it fades with the present and turns vivid when color returns).
- Battle messages go in a thin top window. Every box stays ≥ 1.8 s and ≥ voice + 0.6 s. The next box cuts the previous one. The `.srt` is exported from the same `window.SUBS` array.
- **Title**: two lines, 2× font, 8-neighbour ink outline, white→silver→steel gradient by row, Bayer-dissolved in and out. **End card**: gold title, blinking `▶ CONTINUE`, style name, `LemoLab × Claude Opus 5.5`, and the red scarf drifting across once. The LemoLab sign-off belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls

- **Rank-based palette mapping crushes everything to black**: with many dark colors in the master palette, a quantile map puts half the scene in the darkest step. Map by luminance with a gamma (`lum^0.8`).
- **Collapse subsets without warm hues** turn a sunset solid red on the first step. Keep orange, pink and plum in the 16- and 8-color sets.
- **8-bit palette without a dark green**: night grass turns blue. **Generic brightening around a fire** makes grass neon green. Use a warm remap.
- **Post-quantizing a full-color scene to 4 shades is mud**. Draw 4-color scenes natively with 4 known indices at half resolution.
- Hair drawn as a smooth dome reads as a helmet. Back hair with alternating single pixels reads as sawtooth noise; use 2–3 big spikes. A cream tunic reads as bare skin. A staff held in the front hand crosses the face in side view; hold it in the back hand behind the body. A back-mounted sword crosses the front of the torso; use a hip scabbard.
- A dark plank door reads as a jail. Use recessed panels with bevels lit from the upper left, studs, ring handles and a tympanum. Draw the closed door's centre seam dark, not light.
- **Negative modulo**: `Math.floor(t*12) % 4` is negative when a phase offset makes `t` negative, and it indexes `undefined`. Use `((n % m) + m) % m`.
- **Homophones**: whisper hears "inn" as "in". Accept it through the `asr` field; the subtitle disambiguates.
- The dialog box covers the bottom 25%. Put the floor line at y 128 so standing characters stay above it.
- For a match cut on a protected color, compute both screen positions. The demo's scarf is at (197, 104) in both eras.

## Build notes

```
styles/pixel-rpg/demo/
  px.js        indexed framebuffer, palettes & LUTs (full/nes/gb4/faded/c16/c8/c4/c2), dither, mosaic
  font.js      variable-width pixel font      ui.js        windows, dialog, menus, file list, status, save
  sprites.js   rig + ASCII heads, scarf tails portraits.js 32×32 portraits + expressions
  props.js     crystal, halo, pedestal, door  memsprites.js 4-color kid sprites
  scenes.js    corridor (parallax), door tilt, LIGHT/DARK index lighting, torches
  memscenes.js village (160×90), campfire (8-bit), battle (16-bit), thumbnails, title, end card
  main.js      director: shots, transitions, palette timing, EV (sound events), SUBS
  timeline.json single source of timing (music, picture, mix)   lines.json voice script
  music/score.py original chiptune from timeline.json            mix.py foley + voice + ducking
  sheet.js     model sheet (?sheet=1)          tools/subs.mjs srt export      build.sh one-shot rebuild
```

1. Write `timeline.json` first: sections, BPM, downbeats, hits, silences, the collapse steps. Music, picture and mix all read it.
2. `?sheet=1` → model sheet; `?frame=corridor|door&lut=faded` → environment self-check frames before laying out shots.
3. `core/tts/tts.py` → `asr_check.py` (all OK), then compose `music/score.py` against the timeline (a parallel sub-agent works well).
4. `node core/render/still.mjs demo --range 0.3:54.3:1.5` → `sheet.py` overview; check the key moments frame by frame.
5. `events.mjs` → `mix.py` → `tools/subs.mjs` → `video.mjs --workers 3` (1308 frames in about 20 s) → `mux.sh … 24 0`.
6. `sh demo/build.sh` reproduces everything from scratch.
