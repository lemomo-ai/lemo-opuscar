# Isometric People Scene — Style Prompt

> A calm explainer of an everyday rule, set in one real place drawn in true isometric with flat colour: small faceless people seen from behind do the thing in order, while serif type lands on the ground, character by character, as if painted there. Whatever hides the action (a roof, a wall) is cut away or lifts off like a paper flap. The order of movement is the explanation.
> References (grammar only): isometric explainers about public manners (queues, platforms, crossings) and picture-book cutaways where a roof or a wall is lifted away to show the inside. Take the calm pacing, people as the diagram and type on the floor; never copy their characters, layouts, typefaces or music.

## 1. Essence, and what it is not

- **One real place, full bleed.** A platform, a gate, a cabin, a crossing, a counter: the ground runs off every edge of the frame. No floating board, no frame line, no vignette. A topic that travels (a parcel, a route, a production line) can still be one place: one continuous ground at one scale, with the stops along it (see §11); what breaks the look is a separate board, a map view or a change of scale for each stop.
- **People are the diagram.** Slim figures seen from behind, no faces and no hands, move only when the rule says so. Who moves first, who waits, who sits is the information.
- **Type lies on the ground.** Each idea is one key word or number painted on the floor, big and small sizes, one accent character, landing one character at a time.
- **The cut-away.** Whatever stands between the camera and the action (a roof, a canopy, the top of a wall, a glass façade) is cut low or lifts off like a paper flap, so the camera always looks into the place from above.
- **Clean, always.** One place, one action, one phrase per beat. Large calm areas of ground around the type, people in tidy lines and rows, few props, every object instantly recognisable. A frame that needs a second look to find its subject is wrong.

Not **Isometric Infographic**: that style builds a model on a floating board over a dot lattice and labels it with sans-serif pins, icon statistics and inset bubbles to trace a process; here there is no board edge, no pins and no icons: the place is real and full bleed, the labels are serif words lying on its floor, and the explanation is people obeying a rule. Not **Low-poly Isometric Island**: no lighting, no faceted terrain, no shadows or glow; solids are flat three-tone paper colours and the ground is a printed plane. Not a cartoon (no expressions, no gags), not a slide (no headers, no centred titles, no cards).

## 2. Materials & rendering

- True isometric (axes at 30°), Canvas 2D, painter's sort. Every solid and every person is sorted by its **floor footprint** (x + y at floor level), never by the centre of its box: a seat back sorted by its centre height ends up drawn over the passenger sitting behind it.
- Solids are flat-shaded in **three tones per colour**: top lifted toward warm paper, +y face the base colour, +x face dropped toward a warm umber. Curved bodies (a fuselage, a column) are faceted and quantised to the same tones plus one in-between, so they read as round without gradients. No outlines on solids, no shadows, no textures, no highlight spots (a round tree crown or a ball is a flat disc or a faceted solid in the same tones, never a glint).
- **New objects** (vehicles, machines, buildings, trees) follow the same model: built from boxes, prisms and faceted solids at real size in metres, three tones from the kit's `tri()`, recognisable from their silhouette at a glance, simpler than the people. Vehicles read from the body (cab, cargo box, a band of the subject hue); wheels are small, low and mostly under the body in one dark tone, never thick drums or tyre-and-hub detail.
- Ground surfaces carry only their functional markings (painted lanes, chevrons, lead-in lines, stop bars, seat squares) and a faint tile or slab grid.
- **Cut-aways** are part of the model: the near wall is cut low and the far wall keeps its windows; a lid is its own solid with a paper-coloured underside, hinged on the far edge so it opens away from the camera; glass is a pale tint with thin mullions and is cut to a parapet whenever it would stand between the camera and type or people.
- **People** are billboards anchored at their feet, about 1.6–1.8 m tall: a round hair-dark head with a sliver of skin at the ear, a two-tone torso, separate trouser legs, dark shoes, optional long hair or skirt, a rolling case. Seated people show only shoulders and the back of the head above a low seat back. Walking scissors the legs along the screen; arms counter-swing.
- Bodies obey space: people never pass through seats, walls or each other; a queue keeps about 0.75 m between feet; someone sitting down first steps back into the row's legroom, walks sideways to the seat and sits (never sinking into or floating above it); a lifted case travels up over the open bin and is lowered in, never into a wall or a seat.
- Everything is a function of time. A crowd that queues is simulated once at load (deterministic) and **sampled with interpolation**, so replaying it slowed down still moves every frame.

## 3. Colour logic

- A warm paper neutral for every ground (outdoor concrete a touch cooler, indoor carpet a touch warmer), one dark ink, **one accent reserved for the rule** (the key character, the "stand here" outline, arrows, a lit sign, the winning number, a stretch of floor that matters), one **subject hue** carried by the place itself (seats, livery bands, chairs in a paler tint, sign trim), one marking colour (lead-in lines, a tug, a baggage tractor). People wear four muted tops, so a filled room reads as an even four-colour weave.
- The accent never decorates; it appears only where the rule is. It stays small because its rarity is what makes the eye go to it: many frames carry none at all. A path in the accent marks the stretch being explained now (it grows ahead of the walker or the vehicle and fades behind it), not a trail left across the whole film.
- The subject hue and the marking colour must be clearly apart, in hue and in value, from the four tops: people have to stand out from the place they move through (a blue-green place swallows fog-blue people).
- Shade toward warm umber and paper, never toward grey or violet: dirty shadows are the fastest way to lose this look.
- Example palette: paper #F1E8D8, concrete #EAE2D3, carpet #F2E5CE, ink #2A2E29, accent persimmon #D0573A, subject green #3D6B59 / #A7C2B2, marking ginger #E2AE3A; tops ochre, fog blue, grey violet, oat.

## 4. Type & subtitles

- Chinese: a serif (Noto Serif SC, 700 for keywords, 500 for particles); Latin and numerals: a book serif (Newsreader). Open-licence fonts only, subset to the characters used.
- **Floor type**: big ≈ 1.5 m on the ground, small ≈ 0.8 m; read along the up-right axis (coordinates in §10). One phrase per beat; one line where the frame is tight. One accent character or number per phrase, never a single thin stroke (一 in the accent reads as a line, not a character). Characters land ≈ 0.14 s apart: fade and scale 1.22 → 1, pale ghost → ink. A painted title or a pair of numbers may scale up to ×1.6.
- Type sits on clear ground: nothing stands on it, nothing raised stands in front of it (see §9), at least 5 % from every frame edge, and clear of the subtitle bar.
- Signs in the world (gate signs, group signs, screens) face the camera side of the room at the iso angle, never a flat card facing the lens.
- Reading time: every piece of world text stays fully in frame ≥ CJK/4.5 + Latin/15 + 1.5 s.

### Narration & subtitles

When the film tells something, a narrator says it and the picture shows it at the same moment: one line per action or shot, each line starting as its action starts. A calm, quick reader in the film's language; the floor carries only that line's key word or number, never the sentence. Subtitles: one cue per narration line on a pale bar in the lower safe area, one Chinese line above (≈ 34 px) and one English line below (≈ 25 px, a translation of the whole sentence), switched hard, never two cues on screen. Numbers the viewer must remember: at most three, each said with what it compares to, and held on screen ≥ 2.5 s.

## 5. Motion quality

- **30 fps, on ones** (pass `--fps 30` to the render and to `mux.sh`): crowds and walks are judged frame by frame (§9), and the check assumes this rate.
- People move only when the rule says so, in order; the order is the point. Walk ≈ 1.5 m/s; nobody moves faster than about 3 m/s on screen, even in a time-lapse: when a process must be compressed, show it as places filling (people settling into their seats) rather than people zipping past.
- Everything eases; nothing pops. A beat = one floor phrase + one diagram mark (an outline traced, an arrow grown ahead of the walkers, a light run along a path) + one action.
- A rewind runs the same motion backwards, faster, with a counter running down.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| slow drift and push (≈ 6–8 % zoom) | calm attention on one rule | a call, a waiting room, a hold to read |
| follow the head of a line | the order of things | a corridor, a boarding, a procession |
| travel along the ground at the subject's pace | one place after another on the same road | a delivery, a parade route, a line of workshops |
| rise to wide while a lid opens | revealing a space whole | an interior, a capacity, a grid of places |
| locked frame | judging, reading | a verdict, a comparison, the last frame |
| step back to frame one whole incident | cause and effect in one view | one person blocking, one door jamming |
| tilt down from outside to the people | arrival, cause → people | an opening, a change of place |
| scale jump (room → building → site) | the result in context | a verdict, an ending |

The angle never changes (iso is fixed); camera moves are translation and zoom. Every move is motivated by the action, and text and subject stay inside the frame at both ends of it. Transitions: a continuous move, a lid opening, a run back along the same path, or a cut on the beat at the same angle. No page turns, wipes, black or blank frames; a pull-out shows its next subject (a mark being drawn) within half a second. A lid is a reveal only while it is seen: it finishes turning, paper side up, inside the frame before it glides off away from the camera.

## 7. Sound palette

Soft upright piano and vibraphone; a vibraphone note per landing character (keywords louder, the accent doubled on glockenspiel); pizzicato and shaker when people walk. Repeated actions become rhythm: a stuck queue is broken pizzicato stabs, an orderly one is one chord per group. Quiet place beds (hall air, cabin air, distant engines) and a sustained low string root overlap every cut so no scene change drops out; functional sounds of the place (a home-made chime, wheels on carpet and on metal, bin lids, a tug). A rewind plays the last second of music backwards. With narration, the music ducks about 16 dB under the voice and lifts between lines; mix ≈ −16 LUFS before mux, true peak under −1.5 dBFS.

## 8. Native moves

- **Floor type.** The key word lands on the ground beside the action. *Fits content like:* a hospital triage rule; a polling-station step; a library's quiet zone.
- **Domino stand-up.** The group called sits together and rises one by one from the near end into a painted lane. *Fits content like:* an exam hall emptying by row; a ferry deck released lane by lane; a classroom drill.
- **Lid off.** A roof flips open on its far hinge, paper side up, and glides away; the camera rises to see the whole inside. *Fits content like:* a bus at a depot; a lecture hall; a container being packed.
- **Order lighting.** Places light up one by one in the order they will be used, before anyone moves. *Fits content like:* seat assignments; a parking plan; a vaccination queue by number.
- **Order arrows.** A flat accent arrow grows ahead of the walkers and branches where each one turns. *Fits content like:* escalator lanes; recycling bins by type; a one-way museum route.
- **Weave fill.** Places fill in a pattern (every other, window first) so the room becomes a woven grid in four colours. *Fits content like:* a stadium by sections; a cinema with assigned seats; a car park by level.
- **Bars on the ground.** Two quantities painted as strips on the floor in proportion, the difference marked by a dashed bracket after a still hold. *Fits content like:* two queue times; two routes' lengths; before and after a change.
- **People as the sample.** The people of a study stand on the ground in the shape of the thing they tested. *Fits content like:* a 72-person boarding test; a class of 30 in their desk plan; a jury in their box.
- **Stand here.** An accent outline or a lit stretch of floor marks the spot that matters. *Fits content like:* where to wait for a lift; the jammed stretch of an aisle; the right queue at a counter.

## 9. Pitfalls of the medium

- Anything raised by H metres hides what lies behind it (toward −x behind a face that looks +x, toward −y behind a face that looks +y): floor up to H metres back from a long edge, and a person standing there loses everything below the edge's top, vanishing completely within H − 1.7 m. It holds for low objects too: a 0.8 m belt or counter covers floor type 0.8 m behind it, a 3.2 m truck side hides people's legs up to 3.2 m behind it and whole people within 1.5 m, a glass wall or a wing hides type metres away. Keep type and the people who matter on the camera side of tall objects, or cut those objects down; check every frame in which a vehicle passes.
- A path that zigzags (turning at every vehicle or doorway) reads as noise; routes run along the world axes with few right-angle turns, and the walker or vehicle on them heads away from the camera (see the back-view pitfall below).
- A crowd folded into a serpentine reads as a solid block; one straight line reads as order. Numbers on the floor beside each person need spacing wide enough for the label (about 1 m).
- People walking toward the camera show a back view that looks wrong; route walks up-left, up-right or across.
- Seated people disappear behind high seat backs: keep backs low enough that shoulders show.
- Sorting boxes by their centre and people by their feet puts furniture over people (see §2).
- Colours passed to the engine as a bare hex string are shaded by `engine.js`'s own `tri()`, which darkens toward violet; always pass `kit.js`'s `tri(colour)` (warm umber). `iso.sphere` adds a white glint unless given `{ hi: false }`.
- A simulated crowd sampled by rounding to frames steps on and off when replayed slowly; interpolate. Compressing a long process by moving people faster than ~6 m/s (0.2 m per frame) reads as teleporting.
- A camera move can drag a sign or a word across the frame edge, and background details (a far sign, a row of labels) can appear half-cut at the edge of another shot: anything meant to be read needs both ends of the move checked, and background text belongs only to its own shot.
- Check a crowd film frame by frame, not by eye: `demo/tools/motion_check.mjs` renders every frame at 30 fps and lists jumps, stop-start stepping and people standing closer than a body width, from positions the film reports through a one-line hook (documented in the tool); copying it is in §10.

## 10. Engine

**Copy as they are** into the project folder (they hold no demo content): `demo/engine.js`, `demo/kit.js` and `demo/tools/motion_check.mjs`. `kit.js` re-exports what you need from `engine.js`, so a film imports from `kit.js`. `main.js` and `index.html` are a short page shell (fonts loaded, then `window.DUR`, `SHOTS`, `TEXTS`, `render`, `READY`, as `core/README.md` describes) to rewrite with your own fonts and characters.

**Demo-only, read for technique, don't reuse as props:** `plane.js` (a lofted fuselage, a cut-away cabin, a hinged flap `lid` / `lidMap`), `places.js` (apron markings, a glass wall that drops to a parapet, painted lanes, signs, chairs), `film.js` (a timeline built from narration line lengths, a deterministic queue simulation sampled with interpolation, sitting and stowing, `texts()` for readcheck).

**What the kit gives:**
- World: metres; x runs down-right on screen, y down-left, z up; depth toward the viewer is x + y + z. `kit.js` exports one shared `iso`: set `iso.g = g` and `iso.cam = { x, y, z, k }` each frame (k = pixels per metre; the camera only translates and zooms).
- Solids: queued `iso.box(x, y, z, w, d, h, tri(c), o)`, `prism(footprint, z, h, …)`, `cyl(…, { axis })`, `cone`, `roof`, drawn by `iso.flush()`; `*Now` versions draw at once (inside a cut-away, between back and front walls). `o.bias` corrects the sort: the queue sorts by the box's centre, people by their feet, so a solid that should sort by its footprint gets `bias = −(z + h/2 − floor height)`. `o.faceColor`, `o.decal` for a lit face or markings on it.
- `facet(g, pts3, tri, { out })`: any flat polygon in metres, toned by its normal (`out` points outward), for curved bodies and lids.
- `onPlane(g, x, y, z, plane, fn)`: draw in metres on a plane: `'xy'` floor (u = −y, v = +x), `'yz'` wall facing +x (u = −y, v = −z), `'xz'` wall facing +y (u = +x, v = −z). Markings, signs, windows and screens go through it.
- Floor type: `phraseLayout(P)` with `P = { x, y, z, t0, t1, step, scale, lines: [[[text, kind], …], …] }` (kinds: `B` big ink, `A` big accent, `s` small, `n` / `na` / `ns` numerals, `e` / `en` Latin), then `floorType(g, t, P, L)` every frame. The first line's baseline lies along x = P.x and reads from y = P.y toward −y (up-right); its glyphs fill x ∈ [P.x − size, P.x], and later lines step toward +x. `phraseWorld(P, L)` returns the floor rectangle (keep it clear, §4 and §9), `phraseBox(P, L)` the screen box for `texts()`.
- People: `iso.bill(x, y, floor z, gg => drawPerson(gg, p, pose))` with `p = { h, top, legs, skirt?, hairLong?, bagc? }` (tops and legs from `TOPS` / `LEGS`) and `pose = { walking, phase, bag, lift }` (walk, rolling case, case raised overhead); `drawSeated(gg, p)` for shoulders and head above a seat back. Push `globalThis.__POS?.push({ i, k: 'w' | 's', x, y, a })` where each person is drawn, for the motion check.
- `subtitles(g, t, cues)` (two lines, hard switch) and `subtitleBox()` for the margin check; `tri()`, `C`, `mix`, easing (`ss`, `eo`, `eio`, `seg`).

**What a new topic builds itself:** the place (its ground, markings, cut-away buildings), its vehicles and machines (§2), and any pose beyond walking, carrying a case and sitting. A pose is made like `drawPerson`: a billboard in metres, back view, no face or hands, parts as flat shapes in the top's three tones (a rider, for example, is the seated torso raised to the saddle with two leg quads that swap with the pedal phase). A lid on any building is a `facet` roof turned about its far edge, as `lidMap` does.

**Motion check:** in the copy of `motion_check.mjs`, point the `page.mjs` import at the library's `core/render/page.mjs` (from `films/<name>/tools/` that is `../../../core/render/page.mjs`; outside a clone, an absolute path), then `node <project>/tools/motion_check.mjs <project> --fps 30` from the library root.

Minimal example, not in the demo: a lift lobby with two painted lanes, `floorType()` with 先下后上 on the floor, people billboards stepping out of a box car before the waiting line steps in.

## 11. Variation space

The agent decides the place, its cut-aways, the cast size, the rules and their order, the narration, the camera path, the pacing and the palette within the colour logic.

- Structures: one rule shown right once; the same group doing it two ways and compared (rewind between); a day in one place as five small rules; one thing travelling through several stops, one small rule each.
- A travelling topic is one way among others to stage, not a required form. One option: lay the stops along one continuous street, yard or hall, each a cut-away building or a marked stretch of the same ground, and join them with the travelling move, a run back along the path, or a cut on the beat at the same angle; keep each stop to one action and one floor phrase.
- Openings: the place empty, then people arrive; the title painted on the ground as the first person walks over it; a tilt down from the building to the room.
- Endings: the place empty again with the rule left on the floor; a scale jump out to the building; the last person stepping onto the outlined spot.

---

How our demo was made (story, shots, narration, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
