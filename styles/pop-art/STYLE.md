# Pop Art — Style Prompt

> Sixties screen-print and pop-art poster language used to tell something: Ben-Day dots fixed to the paper, heavy black key lines, flat red, yellow and blue, plates that never quite register. Every frame is one whole printed poster; the camera pushes into the dots, pulls back to the wall of prints, and moves through the shapes of the print itself.
> References (grammar only): 1960s silkscreen editions (the same image repeated across a sheet, each pull a little different, one image in several colourways); Ben-Day enlargements of print (the dot as the measure of distance); 1960s advertising and film-title posters (big condensed type locked into the image, type that is printed, not flown in). Copy no artwork, layout, product, logo or typeface from them, and never name them in the film.

## 1. Essence, and what it is not

- **A printed object, not an illustration.** Four plates (red, yellow, blue, black key) on paper. Every middle tone is a dot screen; there are no gradients, no soft shadows, no transparency.
- **Dots live on the paper.** The screen is fixed in page space at 45°: the closer the camera, the bigger the dots, until one dot is the size of a coin. Distance and emphasis are told by dot size.
- **Repetition is meaning.** The same print pulled again and again, edge to edge, with small differences in register and ink: mass production, copies, sameness. Changing one tile's colourway against the wall is the strongest gesture the style has.
- **Whole-frame posters.** Each shot is a full composition (a poster, a sheet of prints, a wall), not a scene with a poster in it.
- **Telling, not a comic.** No panels or gutters as a reading order, no speech balloons, no onomatopoeia, no acting characters. Information arrives as printed labels and headlines; a voice tells the story.

Not Halftone Dossier (cream archive paper, soft colours, characters), not Risograph Print (pink/blue/yellow soy inks overprinting into new colours), not Silkscreen Travel Poster (scenic places in flat layered colour, no dot screen), not Swiss Motion Graphics (grid type with no printed image), and not a comic book.

## 2. Materials & rendering

- **Three layers, one print pass** (`demo/engine/pop.js`): a plates canvas whose R, G, B channels hold the density of the red, yellow and blue plates (1 = solid, 0.05–0.95 = dots, 0 = paper), a black key canvas (alpha), and a spot canvas for the rare unscreened colour. A WebGL2 shader turns densities into round Ben-Day dots (dots up to 50 %, round holes above), multiplies the inks over paper and lays the key on top.
- **Opaque fills knock out what is beneath** (plates, key and spot), so painter's order holds; `over` adds ink to what is already printed (red dots over yellow = orange shading, red and blue dots growing over anything = the print darkening).
- **Dot screen in page space**, converted from screen pixels by the camera's inverse. Below about 2–4 px per cell on screen the dots fade into flat tint, so a wide shot never moirés.
- **Misregistration**: each colour plate is offset from the key by a few page units (clamped to a few pixels on screen), so a white sliver shows beside the outline. Per copy, offset the fill from its key line by a different small amount: repeated prints are never identical.
- **Key lines** are variable-width ribbons, heavier on the side away from the light (upper left), tapered at open ends; the line width compensates for local scale so small prints keep their outline.
- **Paper**: warm off-white with light fibre and ink unevenness; age and roughness stay low (clean print). Raise them only to date a print (an older edition: more age, wider misregistration).
- Grain in the mux at 1; nothing blurred.

## 3. Colour logic

- Three process colours plus black and paper. Every other colour is an overprint in dots: orange = yellow + red dots, green = yellow + blue, purple = red + blue, dark = red and blue growing over everything.
- Primaries are used flat and big: one ground colour per poster, one subject colour, black for drawing, paper for breathing.
- Never put a colour on itself (red type on a red ground, a yellow subject on a yellow ground without a key line or a paper disc between).
- Darkness is never a black fill: it is dots of red and blue growing until the image drowns. Black is reserved for the key (lines, type outlines).
- Example (our demo): red #E4232B, yellow #FFD21F, blue #1E62B0, key #141414, paper #F8F2E2.

## 4. Type & subtitles

- **Headlines**: a tall condensed grotesque (e.g. Anton, OFL), 100–260 px; colour fill, black outline, an offset shadow in another plate. They are printed in: colour lands from an offset, the key snaps on.
- **Labels**: a paper slip with a black frame and a plate-coloured offset block behind it, tilted ±2°, at a fixed corner of the frame. Headline line (condensed or a heavy grotesque such as Archivo Black, 90–130 px) over one short Chinese line (a heavy CJK sans such as Noto Sans SC Black, subset to the characters used, 46–56 px). Mixed Latin and Chinese lines use a font stack (Latin face first) so Latin never falls back to a serif.
- **Subtitles** are the same paper slip at the bottom centre: Chinese 40 px over English 28 px (Archivo Black), one line each, never wrapped; hold ≥ max(1.8 s, speech + 0.6 s).
- Labels enter with a fast print (0.5 s) where paper and words appear together, and leave by sliding out; nothing fades.
- Page-space type (a word printed on the sheet beside the subject) may be covered by the next copies or carried away by the camera: that is the medium's own exit.
- One headline and one label at a time. No page headers, no centred stacks of text, no bullet lists.
- Reading time: every label line ≥ characters ÷ 15 (Latin) + characters ÷ 4.5 (CJK) + 1.5 s, checked with `readcheck.mjs`.

## 5. Motion quality

- Prints arrive in one of two ways: **stamped** (a short scale from 1.1 to 1 with the colour plates sliding into register, on the beat) or **printed plate by plate** (yellow, red, blue, black, each landing with a thunk).
- Camera moves are long, eased, often logarithmic in zoom (a pull from dots to wall reads as one gesture).
- Copies accelerate as they multiply: the interval between stamps shrinks.
- Flips are card turns (scale X through zero), and the new print shows from the turn's midpoint.
- Spreading things (a rot, a colour, a signal) move as a front with a gradient of dot sizes behind it.
- Never moves: the dot screen relative to the paper; the paper itself.
- **Frame rate and grain**: 24 fps.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Pull from coin-sized dots to the whole print | "this is a print"; scale; the hook | a first image; a reveal of what a detail belongs to |
| Pull from one print to a wall of copies | sameness, quantity, mass production | copies, a product line, a crowd, a franchise |
| Push into a round shape, match-cut to another round shape | one thing is part of another | a cross-section; a planet; a coin; a pill |
| Through a hole in a printed letter or number | passing into another time or chapter | a year; a price; a percentage |
| Lateral track along a long print | sequence, growth, a line of things | generations; a production line; a journey |
| Push to fill the frame with one tile, then flip it | a substitution, a turn | replacement; before/after; a new version |
| Slow push into a wall while a front crosses it | threat, spread, inevitability | a flood; a price rise; a trend |

Framing: the subject is a whole print or a whole wall; at key moments one print fills at least a third of the frame height. Labels live in the top-left corner, subtitles at the bottom centre; keep subjects out of both. Transitions come from the print (stamp, push through a shape, flip, plate-by-plate print, sliding label); no cross-dissolves, no fades to black, no page turns.

## 7. Sound palette

- The print shop is the foley: squeegee drags (band-passed noise), stamps (low thump plus a paper slap), paper whooshes for camera moves, a card flick for every flip, a single thunk per plate, a low granular crackle under anything that spreads.
- Music in a sixties register: vibraphone, marimba, upright or jazz bass, conga, shaker, hand claps, muted and staccato trumpet; exotica, lounge or surf colours rather than orchestral pads. Darker passages strip the groove to a bass pedal and bowed vibraphone.
- One-note-per-copy: a repeated visual event (each flip, each stamp) can carry a pitched note that climbs a scale.
- Silence: before a turn, drop to a held low note for under a second; the first sound after it is a flip or a stamp.
- Voice: a warm, slightly radio-announcer narrator; compressed, set about 10 dB over the music by RMS, the music giving way in 300 Hz–4 kHz. Master −14 LUFS, true peak ≤ −1 dB (limit transients from stamps and claps before the master).

## 8. Native moves

- **Dot pull.** Start inside the screen (one shade area at zoom ×15–20, the dots as big as coins) and pull logarithmically to the whole print. *Fits content like:* the pixels of a famous photograph; a skin tone that turns out to be a face; a crowd that turns out to be one person.
- **Stamped copies.** One print stamped again and again in rings, faster and faster, until a wall. *Fits content like:* factory output; viral copies of a post; identical houses in a suburb.
- **Plate-by-plate print.** Hide the plates and bring them back one by one (`present({mask})`), sliding into register. *Fits content like:* a product launch; a new version; a portrait assembled from its parts.
- **Dots as data.** A front of growing dots crosses prints; dot size encodes amount. *Fits content like:* a drought across farmland; inflation across a shopping list; a rumour across a city.
- **Colour wave.** One tile flips to a new colourway, then a wave flips the whole wall. *Fits content like:* diversity; a team; a market opening up.
- **Through a letterform.** Cut a counter (the hole of a 0, an O, a P) out of the type sheet and push through it into the next print. *Fits content like:* a year; a score; a price.
- **Mosaic echo.** Pull back until each tile is one pixel of a bigger image whose colours were set by the tiles' grounds; draw the big key line along the tile edges. *Fits content like:* many faces making one face; many cities making a country; many small donations making one building.

Our demo opens on the *dot pull*, uses the *colour wave* as its turn and ends on the *mosaic echo*. A new film opens and ends another way: an empty sheet receiving its first stamp, a lateral track along a long print, an ending on a single tile left in a different colour on a wall of copies, or the last plate (the key) landing and the camera pulling out to the whole print.

## 9. Pitfalls of the medium

- **It turns into a comic.** Panels, balloons and sound words make it a comic strip; keep labels as printed slips and give the story to the voice.
- **Dots in screen space.** A screen-fixed dot pattern looks like a filter and swims under camera moves; always compute dots in page space.
- **Moiré in wide shots.** Fade dots to flat tint below a few pixels per cell.
- **Dirty paper.** Too much age, roughness or blotchy ink reads as a bad scan; keep it clean and use age only to date a print.
- **Same-colour collisions.** Red on red, yellow on yellow: put a key line or a paper disc between.
- **Blank print moments.** Printing plate by plate from an empty sheet leaves frames of bare paper; start with the first plate already down, and print a label's words together with its paper.
- **A key line that does not match its fill.** When an image is made of tiles, the outline must follow the tile edges; a smooth curve over square cells looks drawn wrong, not misregistered.
- **Too many words.** One label at a time, short Chinese lines, otherwise the reading-time rule cannot be met.
- **Hot transients.** Stamps and claps push the true peak over the limit; limit the mix before the master.

## 10. Engine

- `demo/engine/pop.js`: `createPop(canvas)` returns the printer. Drawing in page units: `begin(cam)`, `fill(shape, densities)`, `over(shape, densities)`, `black(shape)`, `line(shape, width, opts)`, `outline`, `ribbon(points, width)`, `text(str, x, y, {size, font, fill, outline, shadow, read})`, `measure`, `toScreen`; `present({cell, off, offMax, mask, age, rough})` prints the frame. `readBox` and `reads` collect readable text boxes for `window.TEXTS`.
- `demo/banana.js` (the demo's subject; your film draws its own): `banana(pop, variety)` (curved body, stem, belly dots, highlight, ridge, misregistered fill), `bananaLite` for tiles a few dozen pixels wide, `bananaPolys`, `slice(pop, R)` (cross-section), `plant(pop, {H, g})` (pseudostem and leaves, growing); `VAR` holds the colourways.
- `demo/main.js`: the demo's wall of tiles (`drawWall`, stamp order, flip wave, mosaic colours), `printType` (headline printed in), `label` (paper slip), `subtitle`, the shots, `window.EV` for the mix and `window.TEXTS`.
- Minimal example of something new: a wall of tins, one printed in another colourway.
  ```js
  pop.begin({ x: 0, y: 0, zoom: .5 });
  for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) {
    pop.save(); pop.translate(i * 420, j * 420);
    pop.fill(rectPts(-210, -210, 420, 420), i === 1 && j === 0 ? T.yellow : T.red);
    pop.fill(rectPts(-110, -150, 220, 300), T.white); pop.over(rectPts(-110, 40, 220, 110), { b: .4 });
    pop.outline(rectPts(-110, -150, 220, 300), 8, { closed: true });
    pop.restore();
  }
  pop.present({ cell: 5.6 });
  ```

## 11. Variation space

The agent decides the subject (an everyday object, a product, a number), what is repeated, what spreads, what the colourways mean, the palette ground per poster (within the four plates), the score and whether there is a voice.

- **Structures**: one print becomes a wall becomes one bigger image; a countdown of five posters, each printed plate by plate; before/after, the same wall in two colourways.
- **Openings**: inside the dots of a single shade; an empty sheet receiving its first stamp; a big number printed in, then entered through its counter.
- **Endings**: a mosaic that resolves into one image; a single tile left in a different colour on a wall of copies; the last plate (the key) landing and the camera pulling out to the whole print.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
