# Text Flash Cuts — Style Prompt

> Avant-garde TV anime in the manner of the early-2000s "text frame" school: full-screen heavy Mincho title cards cut in for two to nine frames, architecture reduced to symbolic geometry, a red-black-white palette, characters as silhouettes or extreme close-ups, and the signature over-the-shoulder head tilt. Painted characters come from image generation; everything else (cards, buildings, rain, cuts, inversions) is code.
> References (grammar only): the early-2000s TV-anime "text frame" school, with its flash title cards, symbolic architecture and over-the-shoulder head tilt. Borrow the editing and design grammar; never a work's characters, lines, card texts, logos or specific shots.

## 1. Essence, and what it is not

Three layers, and the collision between them is the look:
- **Type as picture.** A word fills the frame, bleeds off an edge, or stands in a vertical column. Cards are dialogue, chapter titles and punctuation of the cut.
- **Symbolic architecture.** Stairs that never end, window grids, lockers, a one-point street: flat polygons, no props, no sky, no texture.
- **Flat characters in three states only**: black silhouette (far), flat cel colour (mid), fragment (an eye, a hand, a mouth corner) filling the frame.

It is not a lyric video (type is not synced to a song and never animates letter by letter), not a manga panel film (no speech balloons, no screentone), not a horror film (no gore, no blood; dread comes from cutting, silence and stillness), and not a slide deck (never centred text on a plain card followed by a page-turn).

## 2. Materials & rendering

- Characters: generated cel art, clean thin uniform black lines, completely flat fills with a single hard shadow tone, no gradients, no paper grain. Keyed from a chroma-green background into RGBA; any pure generated red is pulled to the film's red.
- Everything code-drawn is hard-edged polygons on Canvas 2D. No blur, no glow, no grain (mux grain 0). The only smear is the head-tilt ghosting (three 28 % copies of the head layer).
- Silhouettes are the same art filled with one colour (`source-in`), so a character can be black, white or red without new images.

## 3. Colour logic

| Name | Value | Use |
|---|---|---|
| Red | `#d4162b` | the protagonist's rail, card fields, rails of light, the main prop, accents |
| Black | `#0a0a0c` | walls, silhouettes, the second character's rail, the end card |
| Paper white | `#f2efe8` | treads, windows, card fields, type on black |
| Grey | `#8d8a84` | English lines only (on black or white) |

Secondary values only for depth inside geometry: `#d8d4cc`, `#26262a`, `#1b1b1f`. Skin and hair in generated art are the only other colours.
- **Inversion is red-black swapping, never RGB inversion** (RGB inversion makes cyan): grayscale → contrast(5) → invert → multiply red. White becomes black, black becomes red. Used as 1–6-frame accents on impacts, never as a look.
- Each speaker owns a field colour (for example: protagonist = red rail, black type; second character = black rail, white type). Keep it fixed through the film so the audience reads who speaks without voices.

## 4. Type

- Cards and titles: **Noto Serif SC 900** (heavy Mincho feel, OFL). Single glyphs 700–1100 px, allowed to bleed off the frame on flash cards; dialogue columns 120–170 px, never bleeding.
- Small vertical notes (episode numbers, speaker tags, counters): Noto Sans SC 900, 40–64 px.
- English: one line of **Cormorant Garamond Italic 600**, about a quarter of the Chinese size, grey on black or white, black on red.
- Vertical punctuation: 。and ，move to the top right of their cell; ？stays upright.
- Never centred on the frame. Type sits in a corner, on a rail at the edge, on an object (a letter), or bleeds.
- Two classes of text: **flash cards** (2–9 frames, deliberately below reading time, only ever repeat or fragment words that are also shown in full) and **held lines** (dialogue, a letter, the end card), each held for its full reading time and checked with `readcheck.mjs`.

## 5. Motion quality

- Editing is the animation: flash cards 2–9 frames at 30 fps; architecture shots 0.3–1.6 s; nothing static for more than a second. Lock cuts to a beat grid (150 BPM = 12 frames a beat works well at 30 fps; 8th = 6 frames, 16th = 3 frames).
- Card slam: frame 0 at 1.08×, frame 1 at 1.02×, then 1.0; jitter 10–14 px on the first two frames, 1–3 px after (whole-pixel random per frame, no motion blur).
- Rails slam in from the frame edge in 3 frames and are counted as on screen only when complete.
- Characters move by layers and steps, not tweens: a head layer rotated about the neck, a figure that jumps closer once per beat, a silhouette that bobs once per step.
- Accelerate by shortening shots (9 → 6 → 4 → 3 frames), not by moving faster.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Fast push into a one-point corridor, stairs or street, perfectly symmetric | inevitability, being drawn in | a summons; a chase; a countdown |
| Extreme offset: subject at one edge, half the frame empty | isolation, something missing | a back turned; waiting; absence |
| Hard push into one element of a grid (a locker, a window) | this one, out of many | a choice; a clue; a name on a list |
| Lateral track along an orthogonal wall | searching, passing time | a corridor; a facade; an archive |
| Beat-locked step push (the camera jumps one step per beat) | effort, climbing | ascent; levels; progress |
| Low angle from below a figure at the top of a space | power, the end of a path | a confrontation; a destination |
| Insert at 1:1 scale (an eye, a hand, a letter) held under a slow push | intimacy, threat | a reveal; a touch; a message |
| Multi-panel grid of one face cropped many ways | obsession, surveillance | a stalker; a crowd of selves; memory |
| Split frame: picture on one side, a speaker's rail on the other | dialogue without lips | a phone call; an interrogation; a confession |

Cut on beats. Transitions are cuts, 1–6 frames of inversion, a one-point tunnel rush, or a red slit opening on black. Never dissolves, wipes or page turns, and never a fully black frame between shots (use the slit).

## 7. Sound palette

- **Instruments**: harpsichord ostinato in 16ths, contrabass and cello pizzicato, a woodblock as a clock, glockenspiel for a lullaby motif, violins tremolo at a whisper, bowed vibraphone, timpani, bass drum, snare, low brass (trombone, tuba, horn) for stabs and a ♭9 chord, tubular bells, tam-tam. Avoid piano and wall-to-wall string pads.
- **Card hit** (synthesised): high-passed noise transient + metallic ring at 1760/2637/4186 Hz + a 52 Hz drop; pitch rises card by card as tension rises.
- **Foley**: locker clank, paper, phone vibration (155 Hz gated square), footsteps that grow louder, a weather bed, a neck-bone "crack" (low clack + click + noise transient) for the head tilt, heartbeat.
- **Silence is a cut**: at least two hard silences (a gate on everything but one sound), the longest right before the head tilt.
- Mix: clock and hits dry and forward, music under; limit transients before loudness normalisation (−14 LUFS, true peak ≤ −1 dBTP).

## 8. Native moves

A menu: use the ones your story needs. Each is built in code in `demo/main.js`.

- **Flash card** (`shotCard`): a solid field, one giant glyph (bleed allowed), slam + jitter, 2–9 frames; cards alternate with 3–6-frame picture cuts in a "type–image–type" saw-tooth. *Fits content like:* a countdown; a list of demands; a word that interrupts.
- **Speaker rail** (`rail`): a full-height column at the left or right edge in the speaker's colour, vertical type plus one English line and a one-glyph speaker tag; the picture beside it keeps cutting while the line holds. *Fits content like:* a phone call; a confession; a two-hander argument.
- **Chapter card** (`shotChapter`): one enormous glyph, a vertical episode number, an English line, a colour bar cutting in; four layouts so no two chapters look alike. *Fits content like:* a series trailer; a manifesto in parts; a product in four promises.
- **The head tilt** (`shotTurn`): the character art split into head and body layers (head polygon + neck pivot + a black collar patch that hides the seam). Back-turned (head −35°) → 60 ms wind-up → 120 ms whip to +0.1 rad with overshoot → `0.1·e^(−9t)·cos(26t)` settle. The whip happens in full silhouette with three ghost heads; the frame it settles cuts hard to colour with 2 frames of red-black inversion. *Fits content like:* a reveal; a challenge; a brand mascot's "look".
- **Symbolic architecture**: geometric stairs (treads scaled by `r^k`, red light climbing the risers), window tunnel (nested rectangles `k = 1/(z·0.32+0.08)`), one-point street with lamps scaled by depth, locker wall, window wall. *Fits content like:* a school; an office tower; a city at night.
- **Stepping approach**: a figure that is redrawn larger once per beat, never tweened. *Fits content like:* a deadline; a rival; an incoming storm.
- **Fragment insert**: eye, hand, mouth corner or object at frame-filling scale for 6–24 frames, slammed and jittered. A reflection drawn into the iris ties two characters together. *Fits content like:* a clue; a touch; a lie.
- **Multi-panel faces**: one portrait cropped nine ways in a 3×3 grid (full, eye, mouth, upside down, silhouette), appearing on 16ths, then all heads tilt together with staggered springs. *Fits content like:* surveillance; a split personality; many fans.
- **Count-up acceleration**: numerals as flash cards alternating with ever-shorter architecture shots. *Fits content like:* a launch; floors of a building; days until.
- **Object on a solid field**: a key, a cracked watch, a ticket, drawn flat in red, black and white. *Fits content like:* a product; a clue; a keepsake.

Our demo opens on a one-point tunnel rush into *flash cards* that spell the first line, uses *count-up acceleration* as its build and *the head tilt* as its climax, and ends on *fragment inserts* and the end card. A new film opens and ends another way: a clock that stops, an *object on a solid field* before any figure is seen, the head tilt spent early as a turn rather than saved for the end, an ending on an architecture shot reversed, or a card cut before the last word lands.

## 9. Characters and image generation

**An image generator is required.** The characters are drawn with the image tool the user provides: their Codex CLI through `core/image/gen_image.py` (`--check` first), or another image API or app, where they make the images from your prompts and save them under your file names. With neither, a film in this style cannot start: say so in the brief (core/README.md, "Image generation"); never draw stand-in characters in code.

**Materials first.** Before generating anything, ask the user whether they have their own character designs, logos or product images; what they give comes first. If not, characters come from the image generator, and **before generating, tell the user how many images and of what** (for example: "one model sheet each for two characters, then six poses and three close-ups, eleven images").

**Pipeline.**
1. A model sheet per character: a half-body in the defining pose on flat chroma green (`#00FF00`).
2. Every further image gets that sheet as a reference image (`--ref` in `gen_image.py`) (and the other character's sheet when both appear), with the prompt saying "the same character as the reference image". A new character uses an existing one only as a style reference ("a different person; the reference is for drawing style only").
3. Close-ups (eye, mouth, hands, letter) on their own; full-frame inserts may keep a plain background, everything that will be composited goes on chroma green.
4. No text in any image ("no text, no letters, no logo, no watermark"); all type is set in code.

**Prompt template** (fill the bracket):
> Flat cel animation style of a modern avant-garde TV anime, matching the reference image's drawing style exactly: clean thin uniform black linework, completely flat colors with one hard-edged shadow tone only, no gradients, no painterly texture, no blush hatching. Palette limited to jet black, off-white, pale skin and crimson red. [subject, pose, framing, expression, costume]. Background: perfectly uniform flat pure chroma green #00FF00, no shadow on the background, no floor. no text, no letters, no logo, no watermark.

**Consistency rules.** Fix each character's silhouette-defining features (hair shape, one accessory such as a red clip, collar) and repeat them in every prompt; give each character one eye colour that survives as a cue in close-ups. Measure the neck pivot and head polygon on the image you rig; a new image means new measurements.

## 10. Pitfalls of the medium

- RGB inversion turns red cyan → red-black swap (§3).
- A large head rotation shows a gap at the neck → only rotate far while the figure is a silhouette; in colour stay within 0.1 rad.
- A black silhouette in a black doorway disappears → doorways are white.
- A half-body image standing in a long shot "breaks at the waist" → generate a full-body back view for long shots.
- Flash cards counted as dialogue fail the reading check, and cutting away from a held line resets its clock → hold lines on rails or objects while the picture beside them cuts.
- Centred cards on plain fields read as slides → always bleed, offset, rail or object.
- Generated red (`#ff0000`-like) breaks the palette → pull saturated reds to `#d4162b` when preparing assets.
- Steady drones and pads fill the silences → gate everything but one sound before the peak.
- Very sharp hits plus loudness normalisation overshoot the peak → limit the mix before `mux.sh`.
- A subset font misses a new glyph and Canvas falls back to a system serif → build the subset from the source text (`tools/fonts.sh` collects every non-ASCII character in `main.js`).

## 11. Variation space

You decide the story, the characters, the spaces, the chapters, the colours each speaker owns and the order of the moves. All far from our demo:

- Structures: **a manifesto in five words** (each word a chapter card, each chapter one building); **an interrogation** (two rails facing each other across a table drawn as a single red line, shots of evidence between questions); **a product's countdown** (numerals and objects on solid fields, the product revealed with the head-tilt timing applied to a lid or a door).
- Openings: **a single word on red before anything is seen**; **a clock that stops** (woodblock, then silence); **a one-point corridor rushing toward a closed door**.
- Endings: **the title appearing inside the last close-up** (in an iris, on a blade, on a screen); **an architecture shot reversed** (the tunnel pulling out to show it was a pattern on a coat); **a card that is cut before the last word lands**.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
