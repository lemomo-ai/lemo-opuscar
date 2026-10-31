# Directing a Lemo-Opuscar film

The directing method behind every film in this library. Pair it with one `styles/<slug>/STYLE.md` (the style) and [`TECHNIQUE.md`](TECHNIQUE.md) (how to build).

You are the director, not a tech demo. A film is judged in this order: **sound, rhythm, camera, directing** (performance, staging, emotional arc). Good-looking frames are only the starting point.

---

## 1. Take the brief

The user gives a style and a topic, sometimes more (length, language, voice, must-have shots, brand rules). Everything else is your decision. Ask once, in a single message (AGENTS.md, Workflow), then no more questions. Defaults:

- Length **30–60 s**; shorter and tight beats padded. Beyond two or three minutes multiplies time and token cost: tell the user.
- 1920×1080 at 24 fps by default; an output frame rate set in the style's `STYLE.md` (30 or 60 fps, for example) wins, and is what you pass to `--fps` and `mux.sh`; other sizes (vertical 1080×1920, for example) with `--size WxH` on the render tools.
- Voice and subtitles in the language the user writes in. Subtitles burned in and exported as `.srt`.
- Loudness −14 LUFS.

Say it in the questions when it matters: offline, Kokoro reads Chinese but sounds plain; Microsoft's online service (edge-tts) sounds much better, but it sends the narration text to Microsoft, so in this edition use it only when the user asks for it and agrees to that (TECHNIQUE.md §4). Default: Kokoro.

Requests that only change the plan:

- **No voice, or no subtitles.** Drop those steps and say so in the treatment.
- **Their own voice recording.** Use it as it is; transcribe it with faster-whisper for word timings.
- **Their own material**: logos, photos, footage, and for styles built from real material (the Evidence Films) their own data, scans, imagery or CAD. Ask whether they have any; what they give comes first, and the sources in the `STYLE.md` are the fallback. Before you download from those sources, tell the user what you will fetch, from where and under which licence. Rights: section 12.

## 2. Find a benchmark first

Before writing anything, pick one or two reference works (films, title sequences, games, ads) that set the bar for this style **and this topic**. They are your choice, made for the user's film; don't borrow the demo's. Write down:

- **What to learn**: composition, pacing, camera grammar, colour logic, score structure.
- **What not to take**: characters, designs, melodies, specific shots, logos, fonts.

The benchmark lifts quality more than any rule below.

## 3. Shape the story

- **One subject, one goal, one turn.** A character (or a single object, product or idea) wants something, something changes, it ends differently from how it began.
- **Hook in the first 3 seconds.** No slow logo reveal before anything happens.
- **An ending that echoes.** Bookend the opening, reveal the scale, or let the character do the thing right the second time.
- **One native move**: a moment only this medium can do (a fold that becomes a transition, ink that blooms into the next scene, a type grid that snaps into the logo). Put it at the emotional peak. `STYLE.md` lists the medium's native moves; pick or invent the one your story needs.
- **Cut the extras.** One gag the audience reads at thumbnail size beats three they can't. If a beat needs explaining, remove it.

## 4. Write the treatment

Write `TREATMENT.md` before drawing anything, and before you open the style's `DEMO.md` or demo code (an Edit & Documentary style gathers its material first: AGENTS.md, "Treatment first"):

1. **Three candidate structures**, a few lines each (for example: a single journey, a before/after, a countdown, a list that turns), then the one you chose and why. Choose the opening image, the ending and the shape of the score from the topic too; the first idea that comes to mind for a style is usually its cliché.
2. **Logline and arc**: one sentence, then setup → turn → ending.
3. **Benchmark**: learn / don't learn (section 2).
4. **Shot list**: for every shot, the framing (wide / full / medium / close / insert), angle, camera move (push, pull, pan, track, crane, zoom), duration, and **why** it is shot that way.
5. **Beat sheet**, second by second.
6. **Cue map**: tempo, bar grid, instrumentation per section, and on which beat every cut, key action and subtitle lands.
7. **Sound design table**: for each section, the ambience bed, the main foley and the music state.
8. **Subtitle and title design**: the type is part of the style.

## 5. Prove the look

- **With characters**: draw a model sheet (turnaround, 3–4 expressions, 2–3 key poses, palette) plus two style frames.
- **Without characters**: three style frames from the film, one of them the signature shot.

Render them with the real drawing code, not a mock-up, and check them yourself against the `STYLE.md` before going on.

### The storyboard (only if the user asked for one)

Render 6–9 key shots with the real drawing code, tiled into one sheet (`core/render/sheet.py`) with shot number, framing, duration and line under each. Send it with the logline and what you are least sure about, and **wait for approval**. If the user didn't ask for one, don't stop.

## 6. Sound is half the film

- **Every visible action has a sound**: landings, page turns, cuts, drips, clicks, cloth. Match the material (paper, wood, metal, ink and glass all sound different).
- **Three layers**: ambience (room, wind, rain, city), foley (tied to actions) and music. Duck the music under dialogue and key foley.
- **At least two real silences**, or near-silences, before the turn or the emotional peak. The first sound after the silence should be one of the most important sounds in the film.
- **Use sound as a transition** at least twice: bring the next scene's sound in early (J-cut) or let the last scene's sound run over the cut (L-cut).
- **Avoid generic "piano and strings".** Score in the instruments of the style's sound palette.

## 7. Rhythm: the music grid comes first

- Write the cue map before animating. The picture locks to the grid, and a script checks every cue (TECHNIQUE.md §3).
- **Vary the pace**: alternate fast and slow, include one clear acceleration or deceleration, and give the audience one breath (a long take or a held pause). A film at one even speed has failed.
- One action, one sound, one cut, but don't cut on every beat. Leave time to see.
- **Pace for the viewer, not the clock**:
  - Hold every subtitle at least 1.8 s, and never shorter than the spoken line + 0.6 s.
  - After text finishes animating in, hold it for roughly (letters ÷ 15 + 1.5) s in English, (characters ÷ 4.5 + 1.5) s in Chinese; `readcheck.mjs` checks this for you.
  - Hold a title card at least 4 s.
  - Give failures and gags enough time to be understood.
  - Fast is fine; make it fast with fewer words per screen, not by cutting before people finish reading.

## 8. Camera: every shot needs a reason

- Use at least **four different camera moves** and real changes of framing. 2D has a camera too: push, pull, parallax, focus pulls, frames within frames.
- **One signature shot** people remember: a oner, a scale reveal, a transition made from the medium itself.
- **Design transitions inside the medium** (a page turn, a carved line growing, ink spreading), as one consistent grammar. Avoid default fades and hard cuts.
- At key moments the subject fills at least a third of the frame height, with clear staging and a readable silhouette.

## 9. Performance

- **Anticipation, action, follow-through** on every meaningful move. Characters change emotion. They do not just slide across the screen.
- **Motion continuity**, especially for characters built from code rigs:
  - Blend every pose with keyframes and easing; never switch poses inside an `if`. The only exception is a deliberate one-frame comic pop.
  - Check shoulders and arms on a large action test sheet (reach, raise, run, kneel) before shooting (TECHNIQUE.md §10).
  - Held props sit **between the palms**, at a depth between the two arms. A hand-over interpolates from one palm to the other. A rolling object turns by distance ÷ radius.
  - Step through key actions at 0.2 s intervals, enlarged.
- Check every expression at final size, especially eyebrow direction: "worried" and "angry" are one flip apart.

## 10. The failures we saw most

- Subject too small, too far away, or pushed against the frame edge.
- Too dark to read, or a colour laid on the same colour (red on red).
- Subtitles covering the subject.
- A gag or failure too fast to understand.
- Blank frames in transitions.
- A timed effect (iris, zoom, follow cam) that doesn't track the subject after the camera moves (one world → screen function, TECHNIQUE.md §2).

## 11. Before you deliver

- Run the review loop (TECHNIQUE.md §8): contact sheets, 0.2 s strips of key actions, one full-speed viewing with sound.
- **One fix round.** Fix everything the review and the checks below find in one round, then check once more. Small fixes that second check turns up (a level, a frame) belong to the same round; anything bigger, tell the user in one line when you deliver. The user's notes after delivery are new rounds: change only what they ask.
- **Not the demo again.** After the treatment, read `DEMO.md` and compare: structure, opening, signature shot, camera path, score shape, ending. At least four of the six must differ; rethink the ones that match.
- Voice: every line transcribes back correctly (speech-to-text check). For Chinese, one misheard character in a short line is normal: listen, and if it is right, let the check expect what the model heard (TECHNIQUE.md §4).
- Loudness about −14 LUFS; no black frames, no NaN frames; subtitles in sync and not covering key action.
- Every row of the sound design table is actually in the mix.
- Every map, globe or satellite view passes section 13, checked enlarged.
- No LemoLab sign-off: `grep -rniE "lemo ?lab|opus 5\.5" <project folder>` finds nothing outside `LICENSE`, `CREDITS` and the library's path in `LIB=` lines, and you have watched the last seconds of the film (text drawn into an image can't be grepped).

**Deliver**, in the project folder (the complete list):

- `<name>.mp4` (24 fps unless `STYLE.md` sets another rate, about −14 LUFS) and `poster.jpg`;
- `<name>.srt`, when the film has narration, dialogue or subtitles;
- `TREATMENT.md`;
- `CREDITS`: every third-party asset in the film (sample libraries, music, fonts, images, the voice engine) with its source and licence (TECHNIQUE.md §11);
- the source, with a one-command `build.sh` (TECHNIQUE.md §2).

**Tell the user**, in their language: where the project folder and the film are; that `CREDITS` lists the third-party assets in the film and their licences; and that they are responsible for the materials they use in it.

## 12. Copyright red lines

- References teach grammar only. Don't copy characters, designs, melodies, shots, logos or type designs.
- No existing works, games, brands or events appear in the film unless the user owns them or has the right to use them. That includes the logos, photos and footage the user hands you: use them when they say they have the right, otherwise draw fictional stand-ins.
- Some of our demos are unofficial fan films of real events or characters. Keep the style, and never carry those names, marks or characters into a user's film.

## 13. Maps

These apply to every frame that shows a map, a globe or satellite imagery, in every style.

- **No borders unless the film is about them.** Draw coastlines, terrain, imagery or streets, without national or provincial borders. Prefer a regional view to a world map, and keep disputed areas out of frame.
- **When China is in frame, draw all of it.** Taiwan, Hainan, the South China Sea islands with the dashed line (in frame, or in an inset), and the Diaoyu Islands with Chiwei Yu. Taiwan and the mainland are one country, in the same colour and the same treatment. Zangnan and Aksai Chin are drawn as on China's standard map.
- **Default border data doesn't meet this.** The default boundaries of Natural Earth, world-atlas and OpenStreetMap can't be used to draw China. When the film needs borders, use China-view data (such as Natural Earth's `admin_0_countries_chn` layers, checked against the standard map) or China's standard map service (bzdt.ch.mnr.gov.cn).
- **Words follow the same map.** Taiwan, Hong Kong and Macao are never listed as countries: not in labels, legends, subtitles, the voice-over or data tables. A list that includes them is "countries and regions". Clean a dataset's country field before you chart it.
- **Other disputed areas**: the same; frame them out, or leave their borders undrawn.
- **Check and credit.** Before delivery, enlarge every map shot and check it against these rules. `CREDITS` names the map data, its source and its view (for example "Natural Earth 1:50m, China view").
