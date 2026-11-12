# Data Physicalization — Style Prompt

> Real statistics built as real objects: every unit is a countable piece of material (a plate, a block, a coin, a bar) stacked to exact scale on a crafted base, shot like a product in a studio — soft key, long shadows, shallow depth of field, physically based materials. The camera reads a number at the edge of one plate, follows the data as it grows, and pulls back until the chart is an installation.
> References (grammar only): data-sculpture and physical-visualisation practice (one unit = one object, the object is the axis); product and still-life photography (a warm key at a low angle, a cool rim, a seamless sweep); annual-report editorial design (one reading per screen, a source line, a quiet grotesk). Copy none of them; never name them in the film.

## 1. Essence, and what it is not

- **The unit is an object.** One plate, block or coin equals one stated quantity, and the rule is said on screen once ("1 plate = 10 GW"). A heavier material marks every tenth unit, so the stack is its own ruler.
- **Scale is exact.** Heights, counts and areas are computed from the data; rounding is one unit at most and written in the facts. Two series compared on the same base use the same unit.
- **Studio light, real matter.** Metal reflects an HDRI, wood shows grain, acrylic transmits; nothing glows, nothing is outlined, no fake UI.
- **Growth is assembly.** Data increases by pieces being placed, one after another, with weight and sound; it never scales or morphs.
- **The pull-back.** At least once the chart is revealed as a made thing: a dial, a table piece, a landscape of stacks.
- **Every number has a source on screen**: real published statistics (or the user's own figures), credited in frame.

Not Isometric Infographic (no icons, no flat colour coding), not Glass Product Render (the object is data), not Data Storytelling (no paper chart or inked axes), not Dark Tech Keynote (no black stage or neon), not Brick Toy (no toy proportions, no characters).

## 2. Materials & rendering

- **Pieces**: thin boxes or cylinders instanced in the thousands, each with a few-millimetre random offset and yaw, a ±7 % value change and a hairline gap: that is what makes a stack read as stacked, not as a bar.
- **Material per series**, chosen so two series separate in one glance at thumbnail size: brushed metal against tinted acrylic, pale wood against dark stone, copper coins against paper. A third material (e.g. brass) only for the ruler pieces, shared by every series.
- **Base**: a real-texture slab (wood veneer, stone) with inlaid marks: a tick ring, the series' paths, the labels of categories or years, cut into the surface at the base's own scale, lit with the scene.
- **Rendering**: PBR (transmission for acrylic), an HDRI at low intensity for reflections only, a warm key at 20–35° with long soft shadows, one or two cool rims so metal and acrylic separate from wood at distance; GTAO, physical depth of field, 2× supersampling, a light vignette.
- **Screen space only for type**: readings, verdicts, the source line, subtitles, the title card. Every reading is pinned to its object through the same world → screen function as the camera.
- **Post**: grain light (the background is pale), no lens flares, no chromatic aberration.

## 3. Colour logic

- The set is warm and neutral: a seamless greige sweep, the base in a natural material, the series in material colours (silver, pale teal, brass, oak). Material, not paint, separates series.
- **One accent** (e.g. signal orange) for the reading or verdict that matters on this screen; nothing else is accent-coloured.
- Ink is near-black at two strengths (value, then labels at ~60 %).
- No rainbow series palettes, no colour ramps on the objects, no dark mode.

Example (our demo): sweep #C4BEB4, walnut base, aluminium #C8CCD1 (metal), acrylic #9FD3D6 with teal attenuation, brass #D2B07A, ink #1C1D20, accent #D4521C.

## 4. Type & subtitles

- **Roles**: a light grotesk for numbers (e.g. Inter 200–300; the hero reading 130–170 px, a stack reading 46–56 px); a sans for labels and verdicts in the film's language (e.g. Noto Sans SC 500, 24–46 px); a monospace for units, years and source lines (20–24 px); a serif only for the title. OFL, self-hosted, CJK subset.
- **A reading** = a dot on the object, a 1.4 px leader, a small swatch of the series' material, the category line, then the value and unit, on a translucent paper plate (~84 %). Two readings of one pair stack in one column, larger value on top.
- **The source line** (dataset, publisher, year, licence, e.g. "数据：IRENA (2026)，经 Our World in Data 整理 · CC BY 4.0") is in frame with the data, small (20–22 px, ink at ~60 %) in a corner away from the subtitles, at least from the first reading to the summary, and on the title card.
- **A verdict** sits in the upper-left third on its own plate in the accent colour, underlined by a growing rule; it appears only after the readings it judges have been still for ≥ 2.5 s.
- **Subtitles**: bottom-left, a 2 px ink rule and a paper plate fading right; if the film is bilingual, the film's language on top; each line one line only, measured with the real font (`nowrap`), split into two cues rather than wrapped. Hold ≥ max(1.8 s, speech + 0.6 s).
- Labels hold ≥ CJK characters ÷ 4.5 + 1.5 s / letters ÷ 15 + 1.5 s; a counter reports its landing value; nothing below 20 px.

## 5. Motion quality

- On ones, 24 fps; the camera never stops (2–5 % creep on holds).
- **Cascade**: a stack assembles bottom-to-top in 0.5–1.0 s, each piece dropping a few centimetres with an ease-out.
- **Feed**: one period's increase arrives piece by piece from out of frame, quintic ease-out, a yaw that unwinds ("placed", not "dropped"), 8–16 pieces per second, the counter rolling with the pieces landed.
- **A single heavy object** falls with gravity, lands with one small damped bounce, its shadow tightening.
- Readings fade in with a 16 px rise and draw their leader; they leave by fading, never by sliding.
- Never moves: the base, a piece once landed, the ruler pieces.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Macro dolly along a stack's edge, rack focus | the unit is real and countable | the rule "1 piece = X"; a single record |
| Low lateral track along the series | time passing; growth | a decade; a ranking; a sequence of sites |
| Locked three-quarter frame on two subjects | comparison | before/after; A against B; a crossover |
| Crane with the rising top | accumulation | one year's increase; a target being reached |
| Pull-back to near top view | the whole as an object | a summary; a ratio; an ending |
| Slow orbit around the base | the installation as sculpture | a title; a breath |

The subject fills at least a third of the frame height at key moments; readings live in empty background, never over the subtitle strip; comparisons keep both subjects completely in frame. Transitions are camera moves inside one set (one continuous take where possible); no cuts to a chart, no wipes, no page turns.

## 7. Sound palette

- **The material's own sound** is the foley: metal plates tick bright and short (inharmonic partials 3–8 kHz), acrylic toks duller (1–3 kHz), wood knocks, coins ring. A cascade is a burst of these at the landing times, scaled down as density rises.
- **The ruler sings**: every ruler piece (each 10th) rings a pitched mallet note, one timbre per series (e.g. glockenspiel for metal, glass harp for acrylic), climbing a pentatonic scale with the count — the chart becomes an arpeggio.
- **Score**: mallets and air — marimba ostinato, bowed and struck vibraphone, harp, glass, a soft synth pad and a pulse bass with audible 2nd/3rd harmonics; horns for a turn. Accelerate by subdivision (8ths → 16ths), not tempo.
- **Impacts**: a turn or a last object lands on punch (60–120 Hz) + bass drum + timpani + a bell; the two or three designed impacts are the loudest moments.
- **Silence**: a 0.3–0.6 s suck-out (music and foley −30 dB) before each designed impact; a thin studio-air bed stays.
- **Mix**: voice ~10 dB over music, ruler notes under the voice, −14 LUFS, true peak ≤ −1 dBTP. Voice: calm, precise, short sentences.

## 8. Native moves

- **The unit close-up.** Push into the side of a stack until one piece fills the frame; bracket one piece ("= 10 GW") and one ruler piece ("= 100 GW"). *Fits content like:* tonnes of CO₂ as steel plates; a budget as banknote bricks; a population as wooden discs.
- **The paired climb.** Two series on one base, one material each, built year by year as the camera tracks; the crossover is held still with both readings before the verdict. *Fits content like:* imports vs exports; renewables vs fossil capacity; two companies' revenue.
- **The feed.** One period's increase arrives piece by piece onto last period's level, the counter rolling with the landings. *Fits content like:* this year's new hires on last year's team; a quarter's sales; a record harvest.
- **Chart to installation.** Pull back until the bars are a dial, a skyline or a table piece; the base's inlaid marks become its typography. *Fits content like:* twelve months as a clock; regions as a map-shaped base; product lines as a city.
- **The last object.** One single heavier piece (a brass puck, a coin, a weight) lands on the base carrying the final number engraved. *Fits content like:* a total; a ratio; a target met.

## 9. Pitfalls of the medium

- Two materials too alike (bright aluminium vs clear acrylic) read as one series: give one a tint or a finish change, and check at thumbnail size.
- Long shadows and warm reflections turn metal brown at distance: add a cool rim light and keep the base darker than the pieces.
- Thin pieces moiré at 2–3 px per layer: random per-piece value and offset, 2× supersampling.
- A reading pinned to a moving object can leave the frame: clamp it to a safe box.
- Counters that roll by time instead of by landed pieces lie; tie them to the object count.
- Rounding to whole pieces can invert close values; when two values are within one unit, say so on screen or choose a finer unit.
- Transmission streaks at low angles: acrylic roughness ≥ 0.2, tinted attenuation.

## 10. Engine

- `demo/set.js` — `buildSet(scene)` (HDRI, warm key + cool rims, base with inlay canvas, instanced pieces per material, the last object) and the landing schedule (`SHEETS`, `EVENTS`, `landed(stack, t)`); change `PAIRS`, the unit and the materials for any single or paired series.
- `demo/film.js` — cylindrical camera keys (`track`, `core/lib.js`) with focus on a target point, the reading kit (`pairLabels`, `verdict`, `plate`, `swatch`), counter, subtitles (`SUBCHECK`), `TEXTS`, `EV`. `demo/mix.py` — material foley (`tick_alu`, `tok_acr`), ruler notes, suck-outs, master.
- **Extra packages and packs**: beyond `setup.sh deps` only the studio HDRI, `sh tools/fetch.sh hdri` (Poly Haven, CC0, 12 MB); with narration `setup.sh deps voice`; for a sampled score `sh tools/fetch.sh instruments vsco2ce` / `vcsl` / `freepats`. The walnut veneer is in `core/assets/polyhaven/`. Anything you add (a spreadsheet reader, other textures) goes into a private venv / node_modules in the project folder, never into `$LIB/.venv`.
- Minimal example, not in the demo: one series of twelve monthly values on a 12-position circle, the annual total engraved on the last object.

### Sources, licences, facts

- **Statistics for a new topic**: Our World in Data (each chart's "About this data" names the original source; CC BY 4.0 — credit both), World Bank Open Data (CC BY 4.0), Eurostat (CC BY 4.0), US Census / BLS / EIA (public domain); UN Data, IRENA, IEA free tables and other national statistics offices (e.g. 国家统计局): check each dataset's terms. Search the portal for the indicator, download the CSV, keep the file and its metadata in the project's `data/`.
- **Licences**: CC0, public domain and CC BY are fine with a credit. ODbL, CC BY-SA, "no known restrictions" or "free for non-commercial use" are not CC0: name the terms to the user and ask before using them. Textures and HDRIs: Poly Haven / ambientCG (CC0).
- **The user's own numbers** (annual report, ESG data, sales): ask for them and for the document they come from; never invent or round them into a better story. Never let generated images stand in for real data or material.
- **Keep a FACTS.md in the project folder** — each on-screen number and spoken claim, its source URL, the quoted wording or row, and how any derived value (ratio, difference, units per piece) was computed — and deliver it with the film.

## 11. Variation space

Decided per film: the unit and its materials, the base and its shape, which series share it, the camera route, pacing, the last object, accent hue within the colour logic.

- Structures: a single series rising to a record; two series and their crossover; a ranking of regions laid out as a map-shaped base.
- Openings: the macro of one piece being placed; the finished installation seen from above, then the dive to the first unit; an empty base with its inlay waiting.
- Endings: the last object landing at the centre; a slow orbit of the whole installation; a single piece lifted off to show what one unit is.

---

How our demo was made (story, shots, score, title card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
