# Rhythm Game Show — Style Prompt

> A rhythm-game variety show in flat vector: toy-like mascots with thick ink outlines on candy-coloured stripes and sunbursts, every hit landing on a fixed tempo grid, call-and-response patterns, and a judgement word when each round is won.
> References (grammar only): rhythm-action party games in the Rhythm Heaven mould (cue → answer, round cards, judgement words), Japanese variety-show telops (thick outlined captions, stripe and sunburst sets), WarioWare-style stage cards. Never use their names, characters, UI, levels or music.

The length follows the number of rounds: each round is a title card plus its bars of play. Narration is optional: the style can carry a film on short shouts and telops alone.

## 1. Essence, and what it is not

- **Everything is on the grid.** One fixed, fast tempo. Every pop, drop, stamp, typed character and camera punch sits at a (bar, beat) and is also a sound event; the score is generated from the picture's own timeline, so they can't drift.
- **One drawing kit, many sets.** Flat fills, one heavy ink outline, round caps, hard offset shadows; each round gets a new saturated background colour and pattern.
- **Characters are toys.** One body construction for the whole cast, told apart by colour, a belly patch, one head accessory and a name tag. They hop on the beat, squash on hits, throw arms up on a shout.
- **A round = a repeatable verb + a win.** The topic is split into rounds; each round has one action that can repeat on a beat, and ends on a judgement the audience reads in one glance.

Not a microgame frenzy (no timer or one-verb command per 3 s game, no change of art style per round), not a mid-century cartoon (no textured painted backgrounds, no character acting), not a keynote (no slow reveals, no gradients).

## 2. Materials & rendering

- **Vector only**, SVG or canvas paths at 1920×1080: flat fills, one outline colour (near-black), 8 px outlines on characters and props, 5–7 px on small parts, round joins and caps.
- **No gradients, no blur, no texture, no soft shadow.** Depth is a **hard offset shadow**: the same shape in outline colour shifted ~10 px (stickers, banners) to ~14 px (cards), then the coloured shape on top.
- **Sets** = one saturated background + a same-hue pattern one step lighter: diagonal stripes (often scrolling slowly), offset polka dots (~20 % white), or a rotating sunburst. A darker floor band with an ink line on top grounds the characters.
- **Characters**: a rounded bean body, stubby arms with mitten hands, oval eyes with a catch-light, a mouth that swaps to an open one. Humans share the construction; older machines or eras read through a boxier silhouette.
- **UI kit**: round card, corner sticker banner, judgement word, burst (star + ring + speed lines), scoreboards.
- `render(t)` is a pure function of `t`: every element's state is recomputed from `t`, never carried over from the previous frame.

## 3. Colour logic

- **Ink + paper + candy.** Near-black ink, white, and a warm cream for cards and paper props; around eight saturated candy hues (yellow, orange, red, pink, green, lime, sky, blue) plus two or three deep hues with darker partners for night or finale sets.
- **One set = one hue.** The background, its pattern and the round card share a hue; the card changes colour to match the set it introduces. Neighbouring rounds never share a hue.
- **Characters own colours.** A contestant's body colour is its identity and never changes; keep it distinct from the set it stands on (a character is never the same hue as the background).
- Big words are white or yellow with a thick ink stroke; judgement words may be pink or yellow.
- Set examples: tangerine ground `#FFB870` with `#FFA85A` stripes; teal with mint dots; navy with a gold sunburst.

## 4. Type & subtitles

- **Display**: a heavy rounded sans for Latin and numbers (e.g. Fredoka 700); a black-weight sans for CJK (e.g. Noto Sans SC 900); a hand-lettered face only for handwritten props (e.g. ZCOOL KuaiLe).
- **Telop text**: white or yellow fill with an ink stroke ≈ 14 % of the font size painted *under* the fill (`paint-order: stroke`). Titles are built glyph by glyph so each character can pop in.
- **The telops are the subtitles.** Round cards, corner banners, labels, prop text and judgement words carry the meaning; keep them short (≤ ~20 CJK characters on a banner line, ≤ ~12 on a plate; Latin runs ~1.6× wider). With narration, subtitles are telop plates at the bottom in the same outlined type, never a thin generic caption.
- Hold every text ≥ max(1.8 s, speech + 0.6 s); a judgement word may be shorter because it is read at a glance.

## 5. Motion quality

- **Idle = hop on the beat**: a parabola per beat (8–30 px); neighbours hop on the off-beat so a crowd ripples.
- **Hit = squash**: a damped wobble (~30 rad/s, ~0.35 s) after each hit; a small squash on every downbeat.
- **Entrances drop from the sky** with ease-in and land exactly on their beat, so the sound lands with them. Crowds drop in one per beat or half-beat.
- **Pops use back-ease** for anything appearing (cards, stickers, stamps, words); ease-in for exits. Nothing fades in slowly: things are either on or popping.
- **Shout pose**: arms up + open mouth for about half a beat.
- **Typewriter** reveals on fractions of a beat, with a click every few characters.
- Scene changes are **hard cuts on bar lines**, with a very short white flash. A fade is saved for the very end, if at all.
- Nothing moves off the grid: an event between beats sits on a subdivision.

## 6. Camera grammar

The stage is a frontal, symmetrical proscenium; the frame itself does the moving. A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Beat punch (zoom 0.8–5 % around centre, decays in ~0.16 s) | the hit, felt in the frame | any accent; a slam; a count-in |
| Several punches in one bar | the frame breathing with the music | a chorus; an escalating pattern |
| Locked frontal wide | the whole stage as a game board | a pattern being set up; a crowd; a scoreboard |
| Hard cut on the bar line + flash | a new round, a new set | chapter changes; a before/after |
| Split stage (two halves, two sets) | two sides answering each other | a rivalry; human vs machine; old vs new |
| Shrink to thumbnail (a finished bit scales down into a slot) | memory, accumulation | a recap; "and then all of this happened" |
| Vertical scroll of the set (floor to sky) | rising stakes or scale | a leaderboard; growth; a tower of items |
| Snap zoom onto one prop (hard cut to a 2× framing, back on the next bar) | this detail is the joke | a price tag; a number; a face reacting |

Keep the sum of simultaneous punches below ~0.06 so the frame edge never shows. Characters stand on the floor band; banners top-left, judgement words centre-top. Hard cuts only; no dissolves.

## 7. Sound palette

- **All synthesized** from the picture's events: a sine kick with soft saturation, band-passed noise snare and clap, hats, slap bass, detuned-saw brass stabs with a closing filter, square lead with vibrato, marimba-like pluck, music-box bell, triangle pad, square arp, cowbell.
- **A bright major pop harmony** on a short chord loop, one chord per bar; each round gets its own flavour (funk, quiz, electro, dream, heavy…), not a new song.
- **Event foley is toy-like and pitched**: pops, plop + boing landings, stamps, typewriter clicks, buzzers, dings, servo whirs, splats; pitched pips can spell a melody as a crowd drops in.
- **Shouts, not sentences**: one- to three-word calls ("Hey!", a number, a verdict), placed 20–30 ms before the beat so the consonant lands on it. A crowd shout = several different voices stacked a few ms apart and panned across the stereo field.
- Options to vary intensity (pick what the film needs): a jingle (crash + rising brass + snare roll) into each round; a transposition up for a finale; dropping to drums only for one bar before a big hit; a half-time bar for a reveal; one bar of silence broken by a single shout.
- **Mix**: voices and foley on their own bus; music ducked from that bus's envelope; soft-clip rather than hard limit; −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

A menu: use the ones your story needs.

- **Rounds with a card.** A 1-bar card (round number + name + a tag such as a year or a step) flies in on a jingle, then play. *Fits content like:* the steps of a recipe; the stages of a startup; the chapters of a museum tour.
- **Report card.** A typewritten recap with a grade stamp. *Fits content like:* a quarterly review; a trip summary; a final score.
- **Call-and-response.** Anything with a turn becomes a rhythm pattern; speeding up the pattern (quarters → eighths) *is* the plot. *Fits content like:* a teacher's question and the class answer; a customer order and the barista's reply; ping-pong between two negotiators.
- **Next-level tease.** Something hatches or unlocks. *Fits content like:* a next version; next season; a next grade.
- **Judgement word.** A big outlined word pops at an angle on the round's last hit. *Fits content like:* "Delivered!" on a logistics step; "Approved!" on a permit; "Personal best!" on a training plan.
- **Remix board.** One set with a timeline ribbon; each item gets a few bars centre stage, then shrinks into a slot along the bottom; at a climax all slots bounce together. *Fits content like:* a year in review; a team's release list; a festival line-up.
- **Stats as game UI.** Numbers become podium scores, counters racing to a target, price tags getting hammered, bar charts that grow per beat. *Fits content like:* fundraising progress; calories per dish; downloads of an app.
- **Crowd drop.** Many contestants drop in one per beat, each with a pitched pip. *Fits content like:* every member of a club; the planets; the ingredients of a dish.

## 9. Pitfalls of the medium

- **Stateful updates break parallel renders**: a worker starting cold shows the initial state. Recompute every pose from `t`; compare single stills with a sequential render.
- **Cue lists drift** when cut flashes, jingles and arrangement are separate hand lists: derive them from one table.
- **Fixed-length audio buffers** cut the tail: size them from the duration.
- **Text measured before fonts load** overflows plates: load fonts, then build.
- **TTS misreads digits and symbols** in shouts: spell them out.
- **Real products as characters**: names on tags, original mascots, no logos or UI; real people only as generic stand-ins.

## 10. Engine

`demo/frame_head.html` (SVG helpers: `el`, `txt`, `tf`, `op`, easing `E`, per-glyph `chars`/`charsPop`, `measure`), `demo/main_v1.js` (tempo grid `at(bar, beat)`, `ev()` sound events, `punch()`, `hopY`/`hitSq`, `gtext` telops, `stripes`/`dots`/`raysEl` sets, `burst`, `judge`, `banner`), `demo/main_b.js` (`bean()` characters + `pose()`, `human()`, `scene(t0, t1, build)`, `card()`, `dropY`, `heyAt`), `demo/music.py` + `demo/synth_lib.py` (event-driven score and SFX). The contract: `scene()` builds nodes once and returns `update(t)`, which only sets attributes. Module table and a minimal new round: [DEMO.md](DEMO.md#engine-reference).

## 11. Variation space

You decide the rounds and their verbs, the cast, the sets and colours, whether there is narration, the tempo, the opening, the ending and the length. The grid, the drawing kit and the telop language stay.

All far from our demo:

- Structures: **a tournament bracket** (two contestants per round, the winner advances, the final is a split stage); **one long round** that keeps escalating its single pattern from quarters to sixteenths as the story's pressure rises; **a quiz show** with three contestants where each question is a fact of the topic and the scoreboard is the argument.
- Openings: **the judgement first** (a "Perfect!" pops on an empty stage, then we rewind to how it was earned); **a single contestant alone** hopping on a bare floor until the crowd drops in; **the scoreboard** showing a final number, then counting back to zero.
- Endings: **a group photo** (everyone freezes mid-hop, a flash, the frame becomes a polaroid on a card); **a level-select map** where every finished round is a lit node; **a curtain** falling bar by bar with the last shout under it.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
