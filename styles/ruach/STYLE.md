# Ruach 灵息 — Style Prompt

Its own style; the rendering techniques come from [Paper-cut Lightbox](../paper-lantern/STYLE.md) (`paper-lantern`).
Default size: 1920×1080; every framing rule below also gives the vertical 1080×1920 version.

> Narrated biblical-theology explainers where **light tells the story**: wide landscapes built from flat, angular planes stacked in depth, small figures under a huge sky, one source of glory that breaks through and lights the world layer by layer. Colour is a script: each chapter's hue carries a fixed meaning.
> References (grammar only):
> - **BibleProject theme videos (2016–2026)**: narrated word studies over layered flat landscapes, a symbolic colour script per chapter, light as divine presence, small figures against mountains and cities, scripture quoted in a quiet serif in the sky.
> - **Mid-century background painting (Eyvind Earle, Maurice Noble)**: angular stylised trees and ranges, value steps instead of detail.
> - **Contemporary flat landscape illustration**: one lit face and one shade face per shape, soft atmospheric light over hard shapes.
>
> Never copy a real film's composition, character design, title card, logo or end-credit layout, and never name BibleProject (or any studio) inside a film.

## 1. Essence, and what it is not

A **narrated idea made visible in light**. Every shot is a deep stack of flat planes (sky, far ranges, mid hills or city, near ground, a foreground frame) seen through a slow camera, with **one light source** that is the subject: a glory in a cloud, a sun behind a mountain, a lamp in a doorway, a figure that glows. The light is the presence of God, life, wisdom; darkness and red are its absence or its counterfeit. The theology is carried by **where the light is and what it touches**.

What makes it read as Ruach and not as generic flat vector art:
- **Hard shapes, soft light.** Every object is an angular flat shape with a lit face and a shade face; only light is soft (halo, rays, haze, bloom).
- **Scale.** Figures are small against land and sky; a close-up is an event.
- **The colour script.** A chapter change is a hue change with a fixed meaning (§3).
- **Light that arrives.** Shots begin in contre-jour and the light reaches the layers one by one (§8, *Light breaks through*).

Not Paper-cut Lightbox (no box, no paper, no fibre, no cast shadows between sheets, no real-world set), not Silkscreen Poster (light is soft here; stepped bands are not required), not Mid-century Cartoon (no ink line, no off-register cels, no how-to cards), not painterly impasto (edges are clean). Not a lecture with slides: no bullet lists, no charts, no talking-head frames.

## 2. Materials & rendering

- **Units in metres, y up**, as in the base: each plane is a Canvas2D drawing mapped onto a three.js plane, stacked in z from the sky (z ≈ −40) to the foreground (z ≈ 0). Planes are wider than the frame so a slow travel never shows an edge; the sky moves with the camera.
- **Shapes**: angular polygons drawn as `Path2D`, no outline. Each shape is **two flat fills**: a lit face and a shade face split along one facet line (mountains have 2–4 facets, a tree canopy is a cluster of 5–9 angular lobes, a building is a block with one lit side). Edges are hard and anti-aliased; no stroke anywhere except a hairline highlight on the lit edge of a near shape (~1.5 px, the light's colour at ~40 %).
- **Light is the only soft thing**: an analytic radial falloff in the shader (never a transparent texture square, see §9), rays as additive wedges with soft edges, haze as a vertical value lift on far planes, bloom on the source.
- **Per-plane light uniform** (inherited from the base backlight): `color = fill × ambient + lightCol × lit × falloff`, where `lit` is a 0→1 per-plane value animated by the light cue. At `lit = 0` a plane sits in contre-jour (its shade face colour everywhere); at `lit = 1` its lit faces take the light.
- **Grain**: fine monochrome film grain (~3 %) over the whole frame after bloom, plus a very light flat-colour mottle on large fills so they don't read as vector. No paper fibre, no texture photos.
- **Lens**: gentle depth of field (foreground frame and far range soft, the story plane sharp), bloom on the source, a slight vignette; supersample 2×.
- **Figures** (§5): flat angular cut-outs, separate sheets for head, torso, arms, garment hem and hair, so they can turn and sway.
- **Vertical frame (1080×1920)**: the same stack; the camera is narrower, so the light source sits in the upper third and the figure in the lower third, sky above taking ≥ 40 % of the height.

## 3. Colour logic

- **A colour script with fixed meanings.** Each chapter is lit in one key; the film moves between keys to tell its theology:

  | Key | Means | Ladder (sky → far → mid → near), light |
  |---|---|---|
  | **Gold / green** | God's presence, the garden, life, the renewed world | `#F4E9C8 #B9D3A0 #5E9A6A #1F4A3A`, light `#FFE7A3` |
  | **Red / black** | Babel, the dragon, empire, death, the counterfeit | `#3A0E12 #7A1A1E #2A0A0E #0C0406`, light `#FF3B2E` (eyes, fire, a hot red glow) |
  | **Blue / violet** | night, exile, waiting, the wilderness | `#2B2F5E #5B5E9E #8A6FB0 #1A1838`, light `#F6E3C4` (a moon, a distant gleam) |
  | **Sand / ochre** | journey, desert, the ordinary day | `#F2DDB4 #D9B07A #A87850 #4A2E22`, light `#FFF1D0` |

- **The light is always the brightest thing in the frame**, warm unless the key is red/black (then the red glow is a false light: hard, small, never blooming wide).
- **Values step from far (light, hazed) to near (dark)**; depth is value first, focus second.
- **One accent**, the thing the chapter is about (a seed, a scroll, a figure's garment), in the light's hue or its complement. Never two.
- **A key change is a statement**: it happens on a cut, on the light cue, or by the light flooding the layers; never as a slow arbitrary drift.
- A film may choose its own ladders for each key, but the meanings stay fixed.

## 4. Type & subtitles

- **Scripture quote**: a quiet book serif (e.g. EB Garamond or Cormorant Garamond 500, OFL), ~34 px at 1080p (~40 px in vertical), the light's colour or paper-white, placed **in the sky**, ragged-right, max ~42 characters per line, with the reference under it in letter-spaced small caps (`GENESIS 1:2`, ~20 px). It fades up word group by word group on the narration, holds ≥ max(2.5 s, chars/12 + 1 s) after the last word, then fades.
- **The key word**: when the film explains a Hebrew or Greek word, it appears large (~120 px) in the serif, transliterated (`rûaḥ`), with the original script small above it (`רוּחַ`, a Hebrew-covering OFL font such as Frank Ruhl Libre) and a one-word gloss under it (`breath · wind · spirit`). It lands on the spoken word and stays still while the light moves around it.
- **Subtitles**: a clean humanist sans (e.g. Inter or Source Sans 3, 500), ~38 px Latin / ~40 px CJK, off-white with a soft dark shadow, bottom centre ~72 px from the edge (vertical: ~260 px from the bottom, above the platform UI). One line per language, no wrapping; a longer line becomes two cues, split at the comma nearest the middle. Hold ≥ max(1.8 s, speech + 0.6 s). Words already on screen as a quote are not subtitled twice.
- **No chapter titles, no bullet points, no lower thirds.** The colour change is the chapter mark.
- **End credits**: a narrow right-hand column of small-caps role labels and names over a held, slowly drifting landscape (the film's own last place), never a black card.

## 5. Motion quality

- **The world is still; light, air and cloth move.** Mountains, cities and trees hold; clouds drift, grass and hems sway, haze breathes, the light's halo pulses very slowly (`1 + .03·sin(0.9t)`).
- **Figures are held poses.** The body holds; only head turns, arm gestures, garment, hair and eyes animate. A gesture: anticipation (~0.2 s), action (0.4–0.7 s, ease-in-out), settle. A walk is shown wide and small (a sliding figure with a two-pose bob on twos), never in close-up.
- **Figure design**: angular, elongated, 2–3 flat colours plus one shade face; a face is a profile or three-quarter silhouette with a nose, a brow line and closed or tiny eyes; hands are mitten shapes. Skin tones vary and are Near-Eastern by default for biblical figures.
- **Light cues are the big motion** (§8): the source opens (~0.8 s), rays sweep (~1.5 s), then each plane's `lit` rises in a 0.25–0.4 s stagger from far to near.
- **Everything eases**; nothing snaps except a red/black hit (a door slam, the dragon's eyes opening), which cuts hard.
- Render on ones at 30 fps; slow is the default tempo. A shot rarely holds less than 3 s.

## 6. Camera grammar

The camera is a slow crane over a deep stack; it never shakes. A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push toward the source with parallax | being drawn into presence | a call; a vision; a holy place |
| Slow pull-back revealing scale | smallness; context; a whole world at once | a figure alone; a city rising; a summary |
| Tilt up from figure to sky | looking up; hope; heaven and earth | a promise; prayer; a mountain climb |
| Tilt down from sky to ground | descent; the word coming to earth | God coming down; an exile; a burial |
| Lateral travel with depth parallax | journey; history unrolling | a genealogy; a wandering; centuries passing |
| Locked frame with only light changing | waiting; a day or an age passing | a vigil; a promise delayed; a dawn |
| Foreground wipe (a near rock, trunk or wall crosses the lens) | a threshold between scenes | a chapter change; the same theme in another book |
| Rack focus from a near object to the far light | a symbol pointing beyond itself | a seed and a tree; a lamp and the dawn |

Framing: the light source sits on a third (upper third in vertical), the figure on the opposite third, low. Transitions: dissolves (0.6–1.2 s), a foreground wipe, a light flood to white or a fall to black (only for death or exile). No whip pans, no digital zooms, no handheld.

## 7. Sound palette

- **Instruments**: slow string pads (sustained, low divisi), felt piano, a soft synth drone, a solo cello or duduk for lament, a wordless choir (ooh/ah) **only when the light breaks through**. No drum kit; percussion as a single low timpani roll or a deep boom on a red/black hit.
- **Foley is air and place**: wind through grass, breath, distant water, birds in a garden key; a low rumble and crackle in a red key; crickets and wind in a night key. A soft rising shimmer on every light cue.
- **Silence**: the beat before the light breaks, all music drops to a room tone or wind alone, then the choir swell enters with the light.
- **Mix character**: voice forward (RMS ~−18 dB), music ducked 5–6 dB under speech, foley low (−24…−34 dB), peak-limited, final at −14 LUFS.
- **Voice**: a warm teacher, curious and calm, never preachy or announcer-like; pauses before a Hebrew word. Proof every line with whisper, and check the pronunciation of each transliterated word.

## 8. Native moves

A menu: use the ones your story needs. **Light breaks through** is the signature and appears in every film.

- **Light breaks through.** The frame starts in contre-jour; a source opens (a cloud parts, a rock splits, a door opens, a figure ignites), rays sweep across the stack, and each layer takes the light from far to near while the key may change. *Fits content like:* creation; a theophany; resurrection; a moment of understanding.
- **Key flood.** A red/black world is overtaken by gold/green as the light advances across the planes, one plane at a time, a visible front. *Fits content like:* a kingdom replacing an empire; healing; a city renewed.
- **The small one under the sky.** A single tiny figure in the lower third, a vast stack above, a slow pull-back. *Fits content like:* Abraham under the stars; Elijah in the wilderness; the reader's own question.
- **The word in the sky.** A key word or scripture quote settles into the sky while the camera drifts under it. *Fits content like:* a word study; a promise; a refrain that returns.
- **Same place, two keys.** One composition shown first in one key and later in another (Eden and the renewed garden, Babel and the new Jerusalem). *Fits content like:* before and after; type and fulfilment; exile and return.
- **The glowing figure.** One figure carries the light; the light spreads from them to the people and the land around. *Fits content like:* Jesus; Spirit-filled people; a prophet sent.

## 9. Pitfalls of the medium

- A transparent radial-gradient texture shows a square edge as an additive glow → use an analytic shader falloff for every halo and ray (the base's `burst()`).
- **Gradients belong to light only.** A gradient fill on a mountain or a garment makes it read as stock vector art; shade with a second flat face.
- **Light over text** washes it out: keep the source and rays clear of the quote and the subtitles, or give the quote the sky opposite the source.
- **Too many lights** kill the meaning: one source per shot (a red/black false light may answer it, smaller).
- **Faces in close-up** expose stiffness: keep figures small, in profile or in contre-jour; a close-up holds a pose and moves only eyes, hair or cloth.
- **A key change by slow drift** reads as a grading mistake; change on a cut or on the light cue.
- **Vertical crops**: a 16:9 composition centre-cropped loses the source or the figure; compose every vertical shot on its own thirds.
- Planes that are too narrow show their edges in a lateral travel; the sky must move with the camera.
- **Grade state must not carry over** between shots: every grade key a shot omits falls back to a default each frame.
- Headless Chrome must run with GPU flags; SwiftShader is ~6× slower.
- Hebrew in the serif: check the font covers the vowel points (niqqud) before rendering; a missing glyph shows as tofu.

## 10. Engine

In [`demo/src/`](demo/src/): `ruach.js` (`plane()` = one flat plane drawn in two keys, each with its own shapes, switched by a light front spreading in screen space from the source; `light()`, `glow()`, `rays()`, `range()`, `ridge()`, `cloud()`, `tree()`, `poly()`, `ppmAt()`), `figure.js` (`robed()`, `walker()` with poses), `shots.js` (the style frame `horeb()` and the demo `forest()`, the palettes), `post.js` (DoF, bloom, grade, grain), `main.js` (timeline, cuts, fades, HTML text, `window.TEXTS`). API table and a minimal shot: [DEMO.md](DEMO.md) "Engine reference". The depth-of-field and bloom pipeline comes from Paper-cut Lightbox, `../paper-lantern/demo/src/post.js`.

Rendering on a modest machine: `?ssaa=1` and one worker (the demo's `build.sh` default); `SSAA=2` doubles the texture resolution and quadruples memory.

## 11. Variation space

You decide the passages, the places, the figures (or none), the keys and their order, the light source of each shot, the opening, the ending and the camera path. Stay away from the reference films' shots and designs, and from our demo's story (a burnt hillside that turns green when the sun breaks over the ridge), its shots (embers on charred trunks, a walker with a sapling on the crest, trunks becoming trees as the light front passes) and its props (the sapling, the Greek word in the night sky, the Thoreau quote). Some directions:

- Structures: **one word, five scenes** (a Hebrew word followed through the canon, one key per book); **two cities** (the same place in two keys, cut back and forth, ending in the renewed one); **a descent and an ascent** (tilt down from heaven to the garden to exile, then back up the mountain).
- Openings: **darkness and one point of light** that becomes a sun, a lamp or a face; **the word first** (the key word alone in the sky, the landscape assembling under it); **mid-journey** (a small figure already walking across a wide desert).
- Endings: **the light reaches the foreground** and floods to warm white; **the opening composition returns in the gold key**; **the camera rises into the sky** where the quote waits, credits in the right column.

---

How our demo was made (story, shots, score, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
