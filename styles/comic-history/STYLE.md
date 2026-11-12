# Comic History Cartoon — Style Prompt

> Countries are paper puppets joined with brass split pins, standing on a map printed on paper; whoever takes a piece of land cuts a scrap of paper and slaps it onto the map. The whole film is one comic page on a table, a panel per moment, and the camera travels between the panels.
> References (grammar only): fast comic history explainers on video platforms (personified countries bickering over a map); cut-out paper animation (pinned joints, stepped poses, real shadows); nineteenth-century printed atlases (engraved coastlines, small-caps place names, scale bars). Copy none of their characters, layouts, typefaces or music, and never name them in a film.

## 1. Essence, and what it is not

- **Every change of territory is a paper action.** Land changes hands by being cut, slapped down, torn off, pressed flat, peeled at a corner, or covered with another layer. A country is never simply recoloured.
- **The map is printed matter.** An old engraved map on paper (coast ripples, graticule, ink borders, flat printed fills, small-caps names), not a map standing in a room and not a vector infographic.
- **Countries are people made of paper.** Puppets cut from card, joined with brass split pins, with oversized round heads and swapped expression heads. They personify a country or a side, never a real person.
- **A comic page holds the film.** Panels with ink frames and cream gutters on a table; one panel is one moment or one place, and narrow panels change the tone.
- **Comedy, with one serious register.** Slapstick for the squabbles; a darker panel without jokes when the history is violent.

Not Paper Pop-up Book (no folds that stand up from a spread), not Isometric Infographic or Data Storytelling (no charts, no clean vector map), not Shadow Puppetry (opaque colour, not silhouettes), not Mid-century Cartoon (cut paper with texture and pins, not cel lines).

## 2. Materials & rendering

- **Printed map** (rule): equirectangular projection with longitude compressed by cos(centre latitude); about six engraved ripple lines outside each coast; dashed graticule; thin ink borders; flat fills with a lighter rim about 20 % wide inside each shape, as if the plate inked thin at the edge; compass rose and a kilometre scale bar. A procedural paper texture (mottle, fibres, fine grain) overlays everything, about 55 % overlay.
- **Borders**: Natural Earth for modern lines, except where China is in frame (DIRECTOR.md §13); historical borders are pieced from modern ones and hand-traced where the difference shows in frame. Name the error margin in the credits.
- **Puppets** (rule): green-screen part sheets keyed and cut into parts; each part gets a cream card edge (dilated a few px) so it reads as cut paper. Parts rotate about their pins (2D forward kinematics); arms reach targets with two-bone IK. Small part-on-part shadows (about 3–4 px) and one larger cast shadow on the map (about 13–19 px).
- **Paper patches**: opaque card with a dashed line printed inside the edge and a thin cream rim; torn edges are jagged with white fibres; a peeled corner is a fold transform with the back of the paper showing.
- **Height is shadow** (rule): a patch held in the air throws a large soft shadow offset 30–45 px; once down it keeps only a 3–4 px paper-edge shadow.
- **The page**: panels drawn into their own canvases at 1:1 so a panel pushed to full screen stays sharp; ink panel frames, cream gutters, a warm grey textured table that only shows when the camera pulls back.
- Nothing is translucent: patches, bubbles, tags and caption boxes are opaque paper.

## 3. Colour logic

- Two protagonists, two colours, kept for the whole film (for example a printed blue and a printed grey). Neighbours are low-saturation print colours (sand, sage, brick, ochre) and never compete.
- **A new patch is one step away from the printed colour** of its owner (lighter or deeper), so it reads as another piece of paper laid on the print.
- Ink is one warm near-black for all type and lines; paper is a warm cream. One accent red is reserved for scissors handles and the Chinese line in speech bubbles.
- A serious panel drops saturation and value (darker, colder) instead of adding new colours.
- Example (our demo): paper #F1E8D2, ink #2B2219, side A #6E93D6, side B #5D6672, sea #A6CCD3, red #C8463A, brass #D9B158, caption card #F5E9C4, table #7B6A57.

## 4. Type & subtitles

All licence-free (OFL). Roles:

- **Place names**: an engraved small-caps serif (e.g. IM FELL English SC), tracked out, pure ink. No outline, glow or shadow.
- **Small print** (tag captions, treaty slips, title card): the same family in roman and italic.
- **Every number** (rule): a serif with lining figures (e.g. Old Standard TT). Old-style figures turn 1975 into "I975" and drop the 7 below the baseline. Year tags are bold lining figures with a thin printed rule under them; numbers inside other text switch to the lining face at the surrounding weight, on the same baseline, at about 0.9 of the surrounding size.
- **Shouts** in speech bubbles: a round heavy display face (e.g. Lilita One), one English line; the Chinese line under it in a rounded hand-drawn face (e.g. ZCOOL KuaiLe) in the accent red.
- **Where text lives** (rule): speech bubbles hold only what characters say, short, in the upper half above the speaker, tail growing from the bubble edge to the mouth. Narration goes into comic caption boxes (pale yellow card, ink border) at the bottom centre, Chinese above English, one line each, never wrapped; feet, place names and scale bars stay clear of that band. The year is a printed tag pasted at the top left of the panel; extra facts are slips pasted under it. Words on props (a passport, a pin, a title card) enter as paper: held up, stamped, dropped, slapped on.
- On-screen Chinese at least about 34 px at 1080p. Hold each caption ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- **Puppets on twos** (12 poses a second); camera and shadows move every frame.
- Keyframes with spring overshoot: hop (legs swing, squat on landing), wind-up (lean back, tremble), strike (lunge, every joint rebounds), settle (arms crossed with overshoot). A head swap pops the head 1.07–1.10× for a frame or two.
- **One in-between drawing** carries a big strike: the pose at the top holds and trembles, then a single frame with ink motion arcs lands it.
- Impact spreads: the camera shakes, paper scraps fly, ink lines burst, the other puppet's hat jumps off and lands back.
- Emotions are paper: jagged-edged card bubbles for shouts, two paper clouds of steam for anger.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push inside a panel | attention gathering on the map | a claim; a build-up before a cut |
| Shake (small / large) | weight of paper landing | a stamp; a slap; the heaviest blow of the film |
| Pull back to the whole page | "this is a comic page" | a reveal; a change of place; an ending |
| Lateral slide into the next panel | the same moment elsewhere | a parallel scene; a quiet aside |
| Whip across a gutter with speed lines | a jump in time | decades passing; a punchline |
| Diagonal drop down the page | the next row of the story | returning to the light after a dark panel |
| Tilt down and push in until the map becomes a tabletop | the thickness of the paper | layers of history; what is left underneath |

- Inside a panel the camera stays on the paper; when a panel is pushed up it fills the frame exactly (1:1). A narrow panel parks at one side of frame with the panel just played still visible beside it, never centred over bare table.
- Transitions are page moves only (slide, whip, drop, pull back); no dissolves or flips between panels.

## 7. Sound palette

- **Accents per side**: each country gets one instrument family (e.g. tuba and trombone oom-pah, accordion), so the audience hears who is winning. Xylophone steps for hops and snips, a music-box glockenspiel for a civilian moment, low strings and slow timpani for the serious panel with no comic sounds.
- **Paper foley**: slaps (a high crack, the paper body, a low thump), scissors (two metal clicks and a short ring), rubbing paper flat, tearing, crumpling, tape, a slide whistle for a flying hat, small clicks of the pins.
- A near-silence (a thin tremolo) before the biggest slap; the music can stop dead on a stamp.
- Voice: a dry, slightly amused narrator. Compress it and set it about 10 dB over the music; while it speaks, the music and foley dip about 3 dB and the music's 300 Hz–4 kHz band another 6–7 dB. Master at −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

- **Cut along the dotted line.** A dashed cut line prints along the border, scissors snip along it, the cut land greys and hatches, a new patch drops with a big shadow and slaps down. *Fits content like:* a company buying a rival's market; a district redrawn for an election; a river changing course and moving a border.
- **Tear it back.** A patch is torn off with ragged fibres and leftover shreds underneath, and flung at the other puppet. *Fits content like:* a treaty revoked; a franchise reclaimed; a merger undone.
- **It won't lie flat.** A patch pressed on by force keeps a peeled corner; someone tugs it and it will not come off. *Fits content like:* an occupation; a policy nobody accepts; a rebrand that doesn't stick.
- **Layer on layer.** Instead of tearing, a new patch is pasted over the old ones, until the tilt-down shows a stack. *Fits content like:* a city's successive names; layers of regulation; a product's version history.
- **Stamp the papers.** A small civilian holds a document; a stamp drops in front of their face and changes one word. *Fits content like:* a citizenship change; a visa rule; a currency switch.
- **Pin on the map.** A labelled pin drops onto the real location to end a thread. *Fits content like:* where a headquarters moved; where a battle ended; where a person still lives.

Our demo opens on a puppet hopping in with a patch and *cut along the dotted line*, uses the tilt down through *layer on layer* as its climax and ends on *pin on the map*, then a pull back to the whole page. A new film opens and ends another way: scissors already cutting before anyone appears, the whole comic page on the table before a push into the first panel, *stamp the papers* in a narrow corner panel as the last word, or a whip across a gutter that lands the punchline.

## 9. Pitfalls of the medium

- Recolouring a country without a paper action: the style disappears.
- A new patch in exactly the printed colour of its owner: once it moves it reads as a white outline only.
- Outlines, glows or drop shadows on type; old-style figures in years; system fonts.
- Two speech bubbles on screen at once, bubbles over place names, tails pointing at hats instead of mouths.
- Characters' feet, names or the scale bar in the caption band.
- Smooth on-ones puppet motion or ease curves with no overshoot: it reads as software, not paper.
- Comic sound effects or slapstick on war deaths, massacres or persecution; those panels go darker and quieter.
- Real flags with political symbols, Nazi symbols, real people's likenesses. Uniforms personify a country; say in the narration who the actual party was when the costume simplifies it.
- Upscaling a panel past 1:1: render panels at their on-screen size.

## 10. Engine

- **The part sheets come from an image generator, one set per film, and the user provides it**: their Codex CLI through `core/image/gen_image.py` (`--check` first), or another image API or app, where they make the sheets from your prompts and save them under your file names. With neither, a film in this style cannot start: say so in the brief (core/README.md, "Image generation"); never draw stand-in puppets in code. Before generating, ask the user whether they have their own character designs; if not, tell them how many sheets and for whom (one per puppet), then generate them for the user's own sides and costumes: a flat chroma-green background (`#00FF00`, or the demo's `#00B140`: `extract.py` keys any strong green), no text, no letters, no flags with political symbols. The demo's sheets (prompts in `demo/tools/sheets.json`) belong to the demo and are not reused. Name the generation in the film's `CREDITS`.
- Part sheets on chroma green (one per character: four expression heads, hat, torso, upper arms, forearms with hands, legs, props, a pin at each joint) are keyed and cut by `demo/tools/extract.py` (Python, numpy, scipy, Pillow) into `parts/*.png`, `parts/index.json` and a numbered debug sheet for reading pivots.
- The demo's page (`demo/index.html`, Canvas 2D) prints the map from a Natural Earth topojson cut down to the region in frame (`demo/europe.json` is the demo's region; your film cuts its own), rigs the puppets (forward kinematics plus two-bone IK, left and right forearm parts picked by facing), draws patches, tears, folds and the stack, renders each panel into its own canvas, and moves a page camera between them. `window.TEXTS` reports on-screen text for the reading check; `window.EV` drives the sound.
- Foley and score are synthesised and sampled in `demo/mix.py` from those events.

## 11. Variation space

The agent decides the territory, the sides and their costumes, the panels and their order, which native moves to spend, the words, the pacing and the score.

- **Three structures:** one piece of land changing hands several times, each change a different paper action; two sides trading blows across one map, panel by panel, until a third party arrives; one civilian's life told in the corner panels while the map changes behind them.
- **Three openings:** a puppet hopping into an empty map holding a patch; scissors already cutting before anyone appears; the whole comic page on the table, then a push into the first panel.
- **Three endings:** pull back to the full page with a title card pasted in the last panel; tilt down to the stack of layers; a pin dropping onto the place where it all happened.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
