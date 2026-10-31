# Caption News — Style Prompt

> Social-video news that reads with the sound off. Real footage, photos and the source document are the ground; huge captions are the lead actor, slammed in a chunk at a time with one keyword on a yellow block. Hard cuts on a music grid, numbers that roll, a source tag that slides in whenever a figure appears, and the original document highlighted on screen before its number is believed. 16:9, built for a feed.
> References (grammar only): the captions-first social news of the mid-2010s (NowThis, AJ+), horizontal explainers that set big type over footage (Bloomberg Quicktake). Never copy their logos, fonts, colour ratios, idents or shots, and never name them in the film.

## 1. Essence, and what it is not

1. **Sound-off first.** Every beat must be understood from the picture and the captions alone; the voice adds pace, not information.
2. **The caption is the shot.** One Chinese line, set huge, slammed in two or three chunks, one keyword in a yellow block; one English line under it. The footage is chosen to sit under the line.
3. **Evidence on screen.** Each number arrives with its source: a source tag slides in; key figures are first seen highlighted in the original document; per-shot footage credits sit in the corner like a news "Video:" tag.
4. **A hook on frame 4.** The film's largest number lands in the first 0.15 s and rolls to its value.
5. **One turn.** The bad-news hook is answered by a fact that changes its meaning; the rest of the film explains that turn, one new fact per shot.

Not **Data Storytelling** (charts are short inserts between footage, never the whole film, never a dashboard). Not a **TV news package** (no anchor, no lower-third ticker, no studio, no scrolling crawl). Not a keynote: no headers, no centred title-and-bullets, no page turns.

## 2. Frame and layout (1920×1080)

| Zone | Position | Content |
|---|---|---|
| Footage | full bleed | video, photo, document or data card; never a vertical frame pillar-boxed in the middle |
| Caption card | left aligned at x 120; Chinese baseline y ≈ 948, English baseline y ≈ 1014 | one line per language, never wrapped |
| Channel bug | top left, x 96 y 52, 46 px high | yellow block with a fictional channel name + topic in Chinese and English small caps |
| Source tag | under the bug, y 108, 36 px | white "来源" + dark label (`USDA NASS · 2026.08.03`, `… · 第 13 页`); only on data and document shots, slides in 0.2 s |
| Footage credit | top right, 19 px on a 50 % dark chip | `视频 作者 · CC BY 3.0`; every CC BY shot carries it |
| Lower third | x 120, y 742, 96 px high | yellow bar + label + one English line; for a place, date or speaker, never for the main sentence |

Under the caption: a bottom gradient (0 → 84 % from y 560) plus a soft dark radial from the bottom-left corner; a top gradient (55 % → 0 over 200 px) under the bug and the credit. Data cards use a lighter gradient that starts at y 820. Graphics and charts sit right of centre and bleed to the frame edge; their title and source sit top left, never centred.

Vertical 9:16 is a different layout, not a crop: put the caption under a 1080×1560 footage band (horizontal sources then scale ≤ 1.5×), stack the chunks on two lines there (the one-line rule is for 16:9 subtitles), and move the bug and source tag into the top safe area.

## 3. Editing grammar

- **Cuts on a 120 BPM half-beat grid** (every cut at a multiple of 0.5 s). Footage shots 1.5–3 s; data cards and documents 3–4.5 s; a shot that holds a comparison stays until every item has been fully on screen ≥ 2.5 s.
- **Captions cross cuts.** A caption can run over two shots (picture changes, words don't); captions change at most every ~2.5 s even when shots change every 1.5 s. Reading time, not shot length, sets the caption clock.
- **The order of a fact**: footage (feeling) → the number on a card → the document line that says it → the consequence. Never a number without its source tag in the same shot.
- **Transitions are few and fixed**: hard cut (default); a 1–2-frame white flash on the turn and on the freeze; a card sliding in from the right with speed streaks (0.18 s); a split screen opening from its divider; grid panels rising staggered (0.1 s apart); a punch-in (0.3 s ease-out to ~1.25×) on the culprit; a **mask transition** where a photo grows out of a map shape. No dissolves, no page turns, no 3D flips.
- **Pace**: a strong action within 0.5 s of every shot; no frame flat for more than 1 s (rolling counters, line drawing, highlighter sweeps, slow pushes keep it alive); one held breath (2–3 s) after the turn; two real silences.

## 4. Caption card (the subtitle *is* the graphic)

- **Chinese line**: Noto Sans SC 900, 88 px (verdict lines 110 px), ivory `#F7F5EF`, 20 px dark soft shadow. Split into 2–3 chunks with `|` in the timeline; each chunk slams 0.12 s after the previous: scale 1.3 → 1 in 0.13 s (back ease, overshoot 1.6), opacity full in 0.04 s.
- **Keyword**: `{…}` inside a chunk; a honey-yellow block `#FFC21A` wipes left → right in 0.12 s behind it, text turns ink `#0E0E0C`. One keyword per caption, at most.
- **English line**: Inter Tight 500, 33 px, ivory, fades and rises 10 px in 0.18 s, 0.1 s after the first chunk. It is the spoken line (numbers as digits), not a translation of the Chinese.
- **One line per language, always.** If either language would wrap, split the sentence into two captions. A caption is on screen ≥ 1.8 s and ideally ≥ the spoken line + 0.6 s; the Chinese is a paraphrase short enough to read in that time (≤ ~14 characters).
- The `.srt` is generated from the same timeline (`timeline.json` → `tools/cues.py` → `core/render/srt.py`): one Chinese line, one English line per cue.
- A text-only beat (caption with no voice) is native to the style: use it for the breath after the turn.

## 5. Graphics

- **Ledger card** (the data-card ground): `#151512` sheet, faint ruled lines every 54 px (4.5 % white), a thin red double margin at x 78/86 — the "account book" that ties every chart together. It slides in from the right over 0.18 s; inside, a slow push (×1.025–1.03 over the shot).
- **Colour meaning**: honey `#FFC21A` = the point / gains / the highlight; red `#FF4A3D` = losses, the spike, the bad number; ivory = everything else; grey `#8D8B83` = labels and units; `#5E5C55` = the bars that don't matter.
- **Numbers**: Inter Tight 800 with fixed-width digit cells (`num()` in `demo/main.js`), so a rolling counter never jitters. Counters roll with ease-out and turn their colour when they arrive. Units in Chinese (箱, 万箱) set smaller after the number.
- **Charts**: titled top left in Chinese (Noto Sans SC 900 64 px, ≤ 6 characters so it can be read in the shot) with one grey English line; lines draw segment by segment (eio); the key point gets a bigger dot, an expanding ring (0.7 s) and a block label; bars grow from the left one after another (first one slower and longer if it is the point).
- **Map**: state shapes from Natural Earth (maps follow DIRECTOR.md §13), projected (Albers), sequential fill in five steps of one hue, states without data in dark grey with a "未单列" legend swatch; the subject state outlined in yellow with a leader and a label; the map pushes in on it.
- **Documents**: the PDF page rendered at 220 dpi as white paper on a dark desk (±1–2° tilt, soft shadow, vignette), pushed in slowly; highlighter rectangles placed from `pdftotext -bbox` coordinates (1 pt = 3.0556 px), `multiply` blend, swept left → right in 0.3–0.5 s; the number read from it is re-set as a big yellow block beside the page. The printed text is picture; what must be read is re-set in type.
- **Split screen**: two halves with a 4 px yellow divider that drops first; the "bad" half desaturated, darkened and tinted red, the "good" half in full grade; a label block (Chinese + English word) and a counter in each; a shared stamp centred on the divider.
- **Grid**: three panels (632 px, 12 px gaps) rising staggered; each one lights up (yellow border, label turns yellow) on the word that names it; numbered 1–2–3.
- **Freeze frame**: the shot stops on a frame, a 0.14 s white flash, punch 1.0 → 1.12, saturation drops to 45 %, yellow corner brackets close in on the subject, a timecode chip with a pause mark appears top right.
- **Title sting**: a yellow ruled page (the ledger again, in yellow) wipes across the left 45 % over live footage; the title slams, the English title and a dateline chip follow; the page wipes off left and the title becomes the channel bug.

## 6. Grade and image quality

- One grade for every piece of footage: `contrast(1.07) saturate(0.92) brightness(0.98)` + a 6 % warm soft-light layer; documents 4 %. Light grain in the master (`mux.sh … 30 1`).
- **Scale limits**: modern footage ≤ 1.5× (prepare frames at their final size with ffmpeg: crop, lanczos, `unsharp=5:5:0.45`); photos ≤ 1:1 of their source; archive material ≤ 2.5× after deblocking. Pushes stay inside those limits — a 720p source already at 1.5× gets no push.
- Remove station logos by cropping (never cover them with a caption), blur legible private details (phone numbers, names on hives, number plates) with `delogo`, skip shots with burned-in text.
- Captions, numbers and charts are always vector, never scaled footage.

## 7. Sound palette

| Layer | What | Level |
|---|---|---|
| Voice | one brisk narrator (Kokoro, speed 1.1–1.17), numbers spelled out in the TTS text | compressed, ≈ 8 dB over the music |
| Music | 120 BPM pulse in sampled instruments: kit (kick on the beat, hats on off-beats), eighth-note electric bass, a sixteenth-note marimba ostinato, vibraphone off-beat chords, glockenspiel accents, staccato brass stabs on the big numbers, timpani and suspended cymbal for turns | ducked ~45 % under the voice |
| Structure | the hook hit on frame 4; a hard stop into silence before the turn (only natural sound and the question); the turn lands on a major-key brass hit; half-time and low strings for the threat; a snare build into the spike; a second short silence before the verdict; a major chord with bells on the verdict | |
| Foley | every graphic action has a sound: chunk slam (click + thump), counter rattle (a tick every 45 ms), whoosh into each card, highlighter squeak, camera shutter on the freeze, stamp thump on a big number, pops for labels, ticks as map states fill, a riser into the map push | |
| Natural sound | the subject's own location sound (here a swarm), J-cut 0.3 s before the freeze, bed under the ending | not ducked below audibility |

Master −14 LUFS, true peak −1.2 dB (`core/render/mux.sh`).

## 8. Native moves

1. **Frame-4 hook** — kicker line, then a giant number in a yellow block rolling to its value in 0.45 s, then the unit and the subject word (`hook()`).
2. **Chunk slam with one yellow keyword** (`capCard()`).
3. **Proportion by darkness** — a yellow line sweeps across the footage to the percentage; what it passed goes grey and dark; the figure appears on the dark side (`shotHalf()`). Works for any "X % of …".
4. **The document says it** — headline or sentence highlighted from PDF bbox coordinates, then the number popped as a yellow block beside the paper (`paper()`, `shotDoc6()`, `shotQuote()`).
5. **Freeze and question** — the image stops on the viewer's question, music cut to silence (`shotFreeze()`).
6. **Ledger split** — two counters racing side by side, the difference stamped after both settle (`shotSplit()`).
7. **Lit grid** — three ways / three causes, each panel lighting on its word (`shotGrid()`).
8. **Punch and circle** — 0.3 s punch-in on the culprit, a circle drawn round it, a leader to its name and its Latin name (`shotSem()`).
9. **Map to ground** — the map pushes into a region, then a photo of that place grows out of the region's outline (`shotMap()`).

## 9. Material

1. **Ask the user first** whether they have their own footage, photos, documents or data (and the rights to them). Their material comes first; the sources below are the fallback.
2. **Where to look** (judge every file on its own page, not the search result):
   - **Wikimedia Commons** (video and photos): read the licence on each file page. Fine: CC0, public domain, CC BY (credit author, title, licence on screen and in `CREDITS`). Not used: CC BY-SA, "no known restrictions", unclear licences, YouTube re-uploads, colourised or "restored" versions.
   - **U.S. federal agencies** (USDA, USGS, NASA, NOAA, NARA): works of federal employees are public domain; check that the page does not credit a contractor or a third party. NASA: https://images.nasa.gov. NARA: https://catalog.archives.gov.
   - **Internet Archive**: only items whose own page states public domain or a CC0/CC BY licence; U.S. works published before 1931 are public domain.
   - **Library of Congress**: read each item's rights statement; "no known restrictions" is not enough.
   - **Official documents and data** (reports, statistics, court filings) from the agency's own site: the source of every fact; keep `FACTS.md` (claim, URL, quoted wording, derived sums with their arithmetic).
   - **Map geometry**: Natural Earth (public domain). Its default borders are not usable for China: DIRECTOR.md §13.
3. **Before downloading, tell the user** what you will fetch, from where and under which licence, and keep within a size budget. The finder copied into this style, `demo/tools/footage.py` (`search commons|archive|nasa`, `fetch`, `used`, `md`), logs licence, author, page and the seconds used of each file into `SOURCES.jsonl` and writes `SOURCES.md`; `demo/tools/commons-tools/peek.py` previews a Commons video from thumbnails before downloading it, `seg.py` downloads only a segment of a long one, `commons_thumb.py` takes a standard-width thumbnail when the original is rate-limited. Wikimedia rate-limits bursts (HTTP 429): one request at a time with pauses.
4. **People on screen**: no close-up or slow motion of an identifiable private person; public figures and people in the news event are fine. Never use generated images as footage.

## 10. Engine

Copy `demo/` into the project and replace the content:
- `main.js` — the page (`window.render(t)` draws synchronously with placeholders first, so `TEXTS(t)` is valid for `readcheck.mjs`, then loads the frames it needs and draws again). Shot functions per format; `SHOTS` table for cuts.
- `timeline.json` — captions (`zh` with `|` chunks and `{keyword}`, `en`), voice start times, silences and hits; read by the page, `tools/cues.py` (.srt + timing check) and `audio/mix.py`.
- `tools/prep.sh` — every video shot as a 30 fps JPEG sequence at its display size (crop, lanczos, unsharp, delogo); report pages; photos; the map projection (`tools/map_prep.py`).
- `audio/mix.py` — sampled score from the timeline, foley from `events.json`, voice, natural sound, ducking.
- `tools/fonts.sh` (OFL subsets for every character in `main.js`), `tools/final_check.sh` (loudness, black frames, speech-to-text of the final mix).

## 11. Pitfalls

- **Text that can't be read in its shot.** Chart titles ≤ 6 Chinese characters; ornamental stamps (datelines) must recur readably elsewhere; a label that changes text (a counter) is reported to `TEXTS` with its final value. Run `readcheck.mjs`.
- **Two-line Chinese captions in 16:9** read as a slide. Split the sentence instead.
- **The voice running to the cut**: lines that end on the cut feel rushed; speed the TTS (≤ 1.17 — faster, Kokoro starts to mangle names: "varroa" became "Veroa") or shorten the line.
- **Homophones in ASR**: "requeen the weak" was heard as "week"; "varroa mite" as "might". Rewrite the line ("give old ones a new queen", "varroa mites").
- **Words stronger than the source**: the report says "stressor", not "killer"; quarterly losses summed are not "annual net loss". Write what the source says.
- **Footage from elsewhere**: illustrative footage (here Dutch hives) never carries a place label it doesn't have; dates on photos (an almond orchard in 2014) are stated in the credit.
- **Blank first frames on transitions**: start split/grid/sting animations 0.1–0.15 s before the cut so frame 1 already has picture.
- **Station logos**: crop them out; never park a caption over a logo.

## 12. Variation space

The agent decides per film: topic, the turn, which formats are spent where, footage, the channel's fictional name and colour (keep one accent colour), the title.

- **Three structures:** the inverted pyramid with a mid-film turn (bad number → "really?" → the document says otherwise → why); a list of three that turns on the third; a countdown of numbers that ends on the one that matters.
- **Three openings:** the biggest number on frame 4; the document headline highlighted in the first second; a freeze on the event with a question.
- **Three endings:** a two-part verdict caption on footage with music returning after a silence; back to the hook's number, now re-read; the last data card's key point becoming the closing caption.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
