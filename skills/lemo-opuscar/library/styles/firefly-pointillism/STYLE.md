# Firefly Pointillism — Style Prompt

> Thousands of soft, breathing points of light on black make up the people, animals, grass, moon, rain and words. The points are never created or destroyed: they scatter, fly off and gather somewhere else as something new, and that is how this style tells a story. A moving pointillist painting, or a summer night of fireflies.
> References (grammar only): pointillism (Seurat: form out of discrete dots); Johansson's point-light walkers (1973: a few dots read as a person when the motion is right); photographic bokeh (out-of-focus points grow large and faint); the synchronous fireflies of the Great Smoky Mountains (a field flashing together). Copy no existing character design; a glowing deer or forest spirit is a common motif, keep it generic.

## 1. Essence, and what it is not

- **Black is more than half the frame.** All light comes from the points themselves: no ambient light, no gradient sky, no solid surfaces.
- **Everything is the same kind of point.** Characters, grass, moon, stars, rain and titles come out of one renderer and differ only in colour, density and focus.
- **Depth is size and blur.** In-focus points are small and sharp, out-of-focus points become large, faint discs. Particles pulling from blur to sharp *is* focusing, and focusing is how a form appears.
- **Forms are outlines.** A character is a dotted silhouette (dense outline points, sparse fill), read through pose and action, never through a face.
- **Conservation.** One pool of particles for the whole film; every point is always something (a river → a road → a crowd; falling snow → a city's windows → the title). This is what lets every transition flow instead of cut.

Not a digital-rain, hologram or dark-keynote look (no cold blue, no wireframes, no tech); not a particle-logo reel (there are characters and a story); not a fluid gradient; not iron filings or hard pixels. The points are always round, soft and warm.

## 2. Materials & rendering

- **Splatting into five blur levels**: σ ≈ 1.0 / 2.1 / 4.8 / 10.5 / 23 px, rendered at 1 / 1 / ½ / ¼ / ⅛ resolution; each particle carries a fractional blur level and is split between the two neighbouring levels, so focus can be pulled continuously. Energy gain per level `[1, 1.55, 2.7, 5.2, 10] / res²`, so large bokeh is bigger and fainter at once.
- **Halo**: each point puts ~16 % of its energy two levels up, so bright points glow.
- **Exposure and tone**: linear light × exposure, `1 − exp(−x)`, gamma 2.2. Point cores burn towards white and the edges keep their hue.
- **Motion blur**: a 180° shutter; each point is drawn as samples between its positions at the two ends of the shutter, so fast flight turns into light streaks by itself. Points that wrap around the frame (rain, flows) must not draw a streak across the screen.
- **Grain**: very light, darker areas slightly more, plus 1–2 LSB dither against banding. Heavy grain multiplies the file size.
- **Characters**: a 2D bone rig (tapered capsules and polygons). Points are bound to normalised local coordinates on each part, so poses, scale and mirroring never resample. Outline points that fall inside another part on the same or a nearer layer are dimmed to a few percent (union silhouette); without this the figure reads as a wireframe.
- **Positions are functions of time**: every group has a state function per scene and transitions blend per particle with staggered delays. Any frame renders alone, in any order (parallel and reproducible). The particle count must be identical at every time.

## 3. Colour logic

Linear colours times brightness; the screen shows a mid tone and a burnt core for each.

| Role | Linear | Mid tone | Core |
|---|---|---|---|
| Ground (top → bottom) | (.00016,.00034,.00052) → (.0003,.00062,.0004) | `#050708` → `#060907` | — |
| Protagonist (exclusive) | (1.0, .74, .34) | `#B2A076` | `#F5ECC6` |
| Companion (exclusive) | (.78, 1.0, .46) | `#A3B286` | `#EEF5D6` |
| Fireflies, ambient lights | (.86, 1.0, .40) | `#A6B279` | `#F0F5C8` |
| Landscape (ground cover, hills) | (.32,.62,.20) → (.62,.88,.30) | `#73965F` → `#96AA70` | — |
| Weather (cloud, rain) | (.40,.54,.50) / (.66,.82,.74) | `#8A9893` | — |
| Stars (cold) | (.86, .90, 1.0) | `#A6AAB2` | `#F0F2F5` |
| Titles | (1.0, .90, .58) | `#B2AB92` | `#F5F2E2` |

- One warm yellow-green family. **Each character owns one colour and keeps it through every transformation**: after a scatter and re-gathering, the audience recognises who is who by colour alone. Colours are never swapped.
- Cold colour only for stars and rain, under 5 % of the frame. No pure white, no saturated red or blue.

## 4. Type & subtitles

- **Titles and credits are made of points**: the text is rendered to a mask and sampled on a jittered grid (not randomly), one particle per sample. A 140–170 px CJK title needs about 3,400 points, a 30–40 px Latin line about 800; sparser and the strokes stop reading. Once landed, the text holds absolutely still (sub-pixel shimmer only), with a short flash on landing. Place it in empty sky, left-aligned, never centred over a character, never on a plate.
- **Subtitles** are plain type burned in (legibility first), a soft brush-like CJK face such as LXGW WenKai (OFL): Chinese ≈ 40 px in warm cream, English ≈ 28 px a little dimmer, centred at the bottom, no outline, no plate, only a faint glow of the same colour. Keep every subject above the subtitle band.

## 5. Motion quality

- 60 fps, every frame (no stepping). Particle paths are always curves: straight flight gets a rotation or scatter added.
- **Breathing**: character points pulse slowly (± 22 %), and a few points are much brighter than the rest (pointillist sparkle). Fireflies are mostly dark: a narrow pulse, so only about a quarter are lit at any moment.
- **Drift instead of physics**: a sum of slow sines (0.3–1.4 rad/s) for floating points; easing replaces damping (ease-out to land, smootherstep elsewhere).
- **Performance**: big silhouette actions only (look up, reach, lower the head, jump, run, fall, kneel, stand, raise an arm). Blinks and fingers cannot be drawn. A large figure keeps its full silhouette while it acts: when it bows or leaps, move the head, neck and legs and keep the back line and every limb readable.
- **Three speeds**: fast (transitions, climaxes, points streaking), medium (performance, one pose change per beat), still (reading, emotional pauses: positions frozen ≥ 1.5 s, brightness breathing only).

## 6. Camera grammar

A 2D camera on the particle world, with parallax by depth layer (screen offset × (1 + 0.38 × depth)).

| Move | Meaning | Use for |
|---|---|---|
| Slow push | closeness, attention | an encounter, a held light |
| Lateral tracking with parallax | travelling together | a walk, a ride, time passing |
| Locked wide shot | smallness, quiet, reading time | titles, farewells, a lone figure |
| Focus pull (bokeh → sharp) | appearing, "it is real" | a character forming |
| Fast pull-back | reveal of scale | a crowd revealed across the whole horizon |
| Whole-scene re-forming | a change of place without a cut | travel, time jumps, a final tableau |

**Transitions happen only inside the medium**: a flow pours in, a swirl gathers, a gust blows the scene away and it re-forms elsewhere, lights go out, the world re-forms upward. No hard cuts, dissolves or page turns.

## 7. Sound palette

- Real sampled instruments (`core/audio/sampler.py`): harp (glissandi for flows, arpeggios for gathering, chords for landing), glockenspiel, hand chimes, glass harp and vibraphone for single lights, touches and flashes, string pads and tremolo, flute melody, timpani and suspended cymbal for forming and wind. Major with a Lydian ♯4 colour: bright and magical, not sad; a minor turn is available for loss.
- **Particle action ↔ sound**: gathering = rising arpeggio or glissando plus cymbal swell, landing exactly on the chord; scattering = wind and a falling glockenspiel run; a landing = a harp pluck or a hand chime; a synchronous flash = a fast harp sweep.
- Procedural ambience: crickets (short 4–5 kHz pulse trains), wind, rain; footsteps of animals from the gait phase.
- A light can carry a motif: a two-note rising figure for a "question", a falling figure to the tonic for an "answer".

## 8. Native moves

- **The pour-in**: a stream of light enters from off-frame and lands, point by point, as the world and its characters.
- **The guiding light**: the single brightest point in the film (strong halo) leads the eye and can become a character's eye.
- **Synchronous flash**: a ripple delayed by distance (`1 + 2.6·exp(−((t − t0 − d/v)/0.08)²)`), or the whole field at once. *For*: an answer, a connection, "the world heard".
- **Swirl gathering**: points rotate around the new form's centre while they fly and focus. *For*: a summoning, a birth, many becoming one; the same move scales from a life-size animal to one taller than the frame.
- **Gust change of scene**: delay by screen x (one side leaves first), a wind vector, scatter; streaks come from motion blur. Wind direction is story direction (following wind = travel, head wind = storm).
- **Going out**: blown apart and not re-formed, brightness down to 1–2 %, embers left on the ground. *For*: loss.
- **Identity swap**: the same points change role without a break in the picture (a sun → a clock face, sparks → a flock of birds → the title).
- **Arc jump**: one rig's points fly from one pose and place to another (a leap across a gap, a dive); a facing flip can hide inside it.
- **Into a constellation**: a whole character leaps with its rig intact, shrinks, turns sharp and cool, and keeps walking in the sky as stars.

Our demo opens on *the pour-in*, uses *going out* followed by a *synchronous flash* across the horizon as its turn and ends *into a constellation*, the title gathered by an *identity swap*. A new film opens and ends another way: *the guiding light* alone in the dark, a focus pull from bokeh to a sharp form, an ending on *going out* with only embers left on the ground, or a *gust change of scene* into a locked wide shot.

## 9. Pitfalls of the medium

- **Green fog**: background bokeh, out-of-focus grass and fireflies add up to a haze and the black is lost. Keep fireflies mostly dark, background bokeh at 0.1–0.38, near blurred grass around 0.2.
- **Walls of light**: distant points on one horizontal line read as a lit wall; give them height above ground and random depth, and soften ripple fronts.
- **Hard distribution edges**: a uniform random band draws a visible line; use power-law vertical distributions.
- **Unreadable characters**: fill points alone are a cloud; outlines need about 0.7 points per pixel and occlusion culling. A standing animal seen from the side hides its far legs behind the near ones: stagger the feet so all four read.
- **Shapes dissolving at the peak**: a per-particle scatter on a big character turns it into a column of dots; for a hero action, move the rig and keep the shape.
- **Unreadable text**: random sampling or moving after landing; sample on a jittered grid and freeze.
- **Low-resolution levels**: energy splatted at ⅛ resolution must be divided by res², or the frame turns white.
- **Variable counts**: optional flashes must be fixed slots with zero brightness, or the two shutter evaluations differ in length.
- **Delays from in-flight positions**: compute a transition's delays from settled positions, not from the moving ones, or the points jitter.
- **Grain = bitrate**: per-frame random grain at 1 % makes the file ten times larger.

## 10. Engine

A numpy/scipy renderer, no browser: `engine.py` (rig, occlusion, text sampling, pyramid splatting) and a film module with one state function per group per scene, a `blend()` for transitions, a camera function and `render(t)`. Frames stream into ffmpeg from a multiprocessing pool (about 0.3–1 s per frame per core at 1080p with ~19,000 particles).

## 11. Variation space

- **Palette**: any warm family on black, as long as each character owns one hue and cold stays rare.
- **Subjects**: children and animals, crowds becoming one shape, maps of light, constellations, migrations, a city's windows as points.
- **Scenes**: meadow (three grass depths + fireflies + bokeh), far ridge (a dense crest line and a fading hill body, a dotted moon disc with mare noise), storm (cloud bokeh, slanted rain streaks, flattened grass), interiors (window and door outlines at low brightness, a lamp as warm bokeh), close-ups (the same point count on a 3× enlarged contour, background pushed to bokeh), water (a mirrored copy at 35 % with a lateral wobble).
- **Narration**: optional; when the story rests on a rule or a feeling the dots can't draw, a few short lines carry it.

See [`DEMO.md`](DEMO.md) for our demo film and how it was built.
