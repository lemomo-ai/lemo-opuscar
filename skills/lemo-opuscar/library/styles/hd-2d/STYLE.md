# 2.5D Pixel Art — Style Prompt

> Hand-made pixel sprites standing like paper cut-outs inside a lit, fogged, fully 3D diorama, shot from a high three-quarter angle through a tilt-shift lens: a toy world where every lamp throws a real shadow.
> References (grammar only): *Octopath Traveler* (Square Enix × Acquire, 2018) and its sequel (2023), the games that defined the HD-2D look. Learn the grammar: sprite-in-diorama, high 3/4 camera, tilt-shift focus band, point lights with shadows, heavy bloom and vignette, framed dialogue box. Never use their characters, places, logos, UI ornaments or music, and never name them in the film.
> Name: this style was formerly called "HD-2D", Square Enix's term (and trademark) for that look; the library uses the term only to describe the look. This style and its demo have no connection to Square Enix and are not endorsed by it. Don't use "HD-2D" as a title or brand in a film.

## 1. Essence, and what it is not

A **3D miniature set** of boxes and cylinders wrapped in **pixel-art textures**, populated by **flat 2D pixel sprites that receive light and cast shadows**, seen from a **high, far camera** through a **tilt-shift band** so the world reads as a tabletop model. **Light is the subject**: practicals throw sprite shadows across the floor; shafts, fog, dust or rain hang in the air; strong bloom, heavy vignette. On top, a small **RPG UI**: chapter card, framed dialogue box with typewriter text, serif subtitles.

The key contrast: characters stay **flat, low-res and stepped** while camera, light, particles and focus move smoothly every frame.

Not a voxel game (no cubic characters), not a flat 2D pixel RPG (the set is real 3D with real light), not a tilt-shift photo of a real miniature (textures are pixels, not materials).

## 2. Materials & rendering

- **Constant texel density**: surfaces drawn per pixel on small canvases, `NearestFilter`, world-space UVs at one density (e.g. 24 px/m); sprites on a similar scale (a character ~30–60 px tall).
- **Colour from ramps**: 3–6 swatches picked by brightness through a narrow 4×4 Bayer dither. Sprites get a 1 px *selout* outline (neighbour colour darkened toward the ink).
- **Boxes and cylinders** for buildings, floors, rock; **billboards** (instanced) for foliage, distant props, ridges. Windows are emissive pixel panes; fire is a pixel atlas stepping at ~10 fps; water a shader with quantized ripples and light columns toward the camera.
- **Light rig per set**: one dim shadow-casting key, a hemisphere fill, **practical point lights** with shadows (lamps, fires, windows, screens), and a **front fill** ~2 m before the hero (a billboard lit from behind stays black). An additive glow sprite on every source gives bloom something to grab.
- **Post chain, at render time**: supersampled render → physical DOF with tilt-shift in the same signed circle of confusion (above the band = far, below = near; far never bleeds over a sharp foreground) → bloom → vignette/grade → filmic tone map. No film grain.

## 3. Colour logic

- **Two temperatures**: one large ambient key (cold, or pale, or dusty) against small warm or saturated practicals. The practicals carry the story; the ambient carries the mood.
- The darkest value is a warm ink, never pure black; the brightest is the light source itself, bloomed.
- Each set owns one fog colour and one light key, so a cut to a new place reads instantly.
- The hero wears the one saturated costume colour that no set uses, so the tiny sprite is findable in a wide.
- UI is one metal (gold, silver, copper) plus one paper white over a dark translucent plate.
- Examples: night canal town (blue fog, amber windows); autumn market at dusk (violet sky, pink paper lanterns); snowy mine at noon (grey-white daylight, green mineral glow).

## 4. Type & subtitles

- An inscriptional capital serif (Cinzel, wide tracking) for chapter labels and titles; an old-style serif (Cormorant, Cormorant Garamond italic) for subtitles, dialogue, taglines. All OFL.
- **Narration subtitles**: italic serif ~46–54 px, centred low on a soft dark gradient band, one line per voice clip, in ~0.35 s before the voice.
- **On-screen speech gets a dialogue box**, not a subtitle: dark plate, thin metal border, corner ornaments, name plate on its top edge, text **typed over ~90 % of the voice**, blinking caret, soft chime on entry.
- Chapter cards and a title card belong to the grammar. Hold ≥ max(1.8 s, speech + 0.6 s). Export the `.srt` from the data that drives the overlay.

## 5. Motion quality

- **Sprites step, everything else glides.** Walk cycles 4 frames at 6–10 fps, idles alternate two frames at ~1–2 Hz, blinks every few seconds, pose changes are instant cuts between drawings. Camera, lights, particles, beams and focus update every output frame (60 fps).
- **Poses are data**: a parameter object per drawing; a new pose is a new table entry.
- **Lights breathe**: every flame flickers (a few summed sines, about ±20 %). A light's level is one value that drives the sprite drawing, the point light (intensity ∝ level^~1.3), the glow opacity and its scale together.
- **Weather is procedural**: slanted rain streaks; lightning as a scripted flash curve (strike, dip, re-strike, decay) lifting sky, fill and exposure together.
- The world never shakes except for impact; the set never moves, only the camera and what lives in it.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic. Always look **down** on the world (never at eye level); every path is a monotone spline of a few keys, no overshoot; focus is recomputed every frame from camera to the subject.

| Move | Expresses | Can serve |
|---|---|---|
| Very high, very far, slow push; band on one tiny subject | Preciousness, a whole place as a map | where we are; scale; a landmark |
| Medium-high 3/4, near-static drift | Two figures on one stage | a conversation; a handover; a choice |
| Lateral tracking, camera leading slightly, foreground passing blurred | A path through a world | travel; a process with steps; a commute |
| Dive low and close while a figure kneels or stops | The toy world suddenly personal | exhaustion; care; a secret |
| Rising pull-back, focus handed from figure to object | The act spreads outward | consequence; a system switching on |
| Orbit half-way round a building or prop | An object seen from all sides | a workshop; a machine; a monument |
| Top-down, straight overhead, tilt band as a strip | A board game, a plan | routes; a schedule; a queue |
| Rack focus between two depths in a locked frame | Attention changing hands | a memory; someone watching; before/after |
| Return to an earlier framing, changed | The rhyme shows what changed | aftermath; growth; a season later |

Framing: characters ~1/12–1/8 of frame height; the sharp band follows the subject's projected height (clamped ~.2–.8 of screen); with no character, use a fixed band height per shot. Transitions: short fades to black or cuts between sets; no wipes, no 3D spins.

## 7. Sound palette

- **Music**: chamber-fantasy or cinematic colours (harp, celesta, strings, horns, low choir, timpani) or small folk instruments (lute, recorder, hand drum). Either one piece whose own arc matches the story, **cut inside it** at downbeats, or an original score; a downbeat can land on the frame of a visual event.
- **Silence as a tool**: a hard stop into a reverb tail, a pad alone, or one heartbeat when the light nearly dies; a short breath (< 1 s) when something fails.
- **Foley follows the diorama's matter**: footsteps per surface (wood, dirt, stone, snow), fire crackle, cloth, a UI chime for dialogue boxes and menus, small bells for things switching on, thunder after each flash, a deep boom with shimmer for a big ignition; ambience beds per set, crossfaded.
- **Voice**: storybook narrator, slow (speed ~.82–.90); on-screen characters low-passed (~7 kHz) so they sit "in the world". Put invented names in the TTS `asr` field.
- **Mix**: lines compressed and RMS-matched; per-line auto-duck ~10 dB (down only); −14 LUFS via `core/render/mux.sh`, grain 0.

## 8. Native moves

A menu: use the ones your story needs.

- **Shadows jump when a light is lit.** A practical turns on next to sprites and their shadows swing across the floor. *Fits content like:* a shop opening at dawn; a server rack powering up; a teacher switching on a projector.
- **The carried light as a meter.** One small light a character carries is key light and gauge at once: its brightness rises and falls with whatever the story is measuring. *Fits content like:* a phone battery on a long trip; a patient's heart monitor; a candle vigil.
- **Tilt-shift preciousness.** An extra-wide with the band on one tiny subject. *Fits content like:* a single delivery van in a city; a newborn's room in a whole hospital; one stall in a night market.
- **Lights popping on one by one.** Windows, lamps or boats light up at a steady cadence across the map. *Fits content like:* users joining a network; a village getting electricity; a festival beginning.
- **RPG grammar.** Chapter card, named character in a dialogue box, biomes, a landmark, a title card. *Fits content like:* onboarding a new employee; a history in eras; a recipe in stages.
- **Weather passes over the diorama.** Rain, snow or lightning sweeps the tabletop with the flash curve. *Fits content like:* a market crash; a harvest threatened; a hard week at work.

## 9. Pitfalls of the medium

- **Checkerboard everywhere** → the dither band is too wide (≈ .22 on sprites, ≈ .45 on textures).
- **A light burns out the sprite that holds it** → move the light ~0.45 m toward the camera; cap sprite lighting in the shader (`min(outgoingLight, diffuse * 1.35 + emissive)`).
- **Lights behind a billboard don't light it** (front normal only) → always the front fill.
- **Cylinder beams facing the camera give NaN** that bloom spreads into black blocks → billboard beam cards that fade toward the lens, glow sprite takes over.
- **Dark scenes unreadable** → lift environment mid-tones ~×2–2.5 outside the one beat that must go dark.
- **Distant glows hidden by fog** → `depthTest = false`, higher `renderOrder`.
- **Tilt-shift with no character to track** → fixed band height per shot. **Tilt as a separate blur pass** breaks occlusion → fold it into the DOF's signed CoC.
- **Node render scripts may not exit** after `done` (server keep-alive) → `process.exit(0)`; the file is complete once `done` prints.

## 10. Engine

In `demo/`: `px.js` (pixel canvas, Bayer ramps, surfaces, lit billboards, glow), `kit.js` (world UVs, materials, houses, props, pixel fire), `fx.js` (sky, pixel sea, particles, rain, beam cards, `flick`), `chars.js` (pose-table pixel characters, `makeChar`), `post_ts.js` (`makePost`: DOF + tilt-shift + bloom + grade), `ui.js` (chapter card, dialogue box, subtitles, title), `main.js` (page contract, `?tilt=1`). Module table, parameters and a minimal new set (a lantern-lit alley): [DEMO.md § Engine reference](DEMO.md#engine-reference).

## 11. Variation space

You decide the places, the characters, the light the story turns on, the chapters, the opening, the ending, the camera path, the key temperature and the music. All far from our demo:

- Structures: **a day-cycle map** (one set, dawn to night, each hour lit by different practicals as the town's routine unfolds); **a party of three** (three short chapters, each character's biome and light, converging in one room); **a menu of places** (a top-down overworld; the camera dives into one location per topic point and pulls back to the map between).
- Openings: **in the middle of the room** (a dialogue box already typing over a close 3/4 shot); **overhead map** (straight top-down, the band as a strip, then tilt down into the 3/4 view); **daylight** (a bright noon wide with no practicals at all, so the first lamp later is an event).
- Endings: **a save point** (the hero rests at a small glowing object, the UI shows a save line, fade); **the band narrows** (the sharp strip thins onto one sprite until everything else is blur); **the party leaves frame** (a locked wide holds after the characters walk out; only ambience and flicker remain).

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
