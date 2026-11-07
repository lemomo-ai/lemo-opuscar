# 1920s Newsreel — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Knock-Knee Alert* (膝盖警报, 54.6 s) · `newsreel.mp4` · source in [`demo/`](demo/)

March 1926: a Texas newspaper warns that the Charleston will make Americans knock-kneed and pigeon-toed. The newsreel traces the dance from a 1923 Broadway show across the map, lets a Hollywood star teach it in nine steps, then brings on the opposition: Henry Ford, whose orchestra plays the dances of his youth and whose 1926 dance book says the jazzy new dances "are losing vogue everywhere". Old-time against Charleston in a split screen; the verdict comes from Ford's own workers' picnic, where a 1925 record of "Charleston" takes over the soundtrack and the kids are doing the dance. Knock-kneed? Who cares.

All pictures are real archive material: U.S. National Archives films (Ford Motor Company Film Collection, 1924–27), *The Austin Statesman* (5 March 1926), *Photoplay* (October 1925), the Fords' book "Good Morning" (1926), and the Golden Gate Orchestra's 1925 Edison record of "Charleston" (UC Santa Barbara Library transfer). "THE SPOTLIGHT NEWS" is an invented newsreel; this is an unofficial film, not affiliated with any archive, museum, newspaper, publisher or company shown. Facts and quotations: [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Shape: one issue of a newsreel with two sides and a verdict. Hook (0–0.2 s): the searchlights snap on with a flash and the fanfare. Setup (3.6–13.2 s): the warning (spinning newspaper, grease pencil on the dancer's knees) and the spread (map, years rolling 1923 → 1926). Development (13.2–28.2 s): the lesson (nine *Photoplay* stills dealt on the beat, then played as a flip-book), the item card "ENTER MR. FORD", Ford's side in footage and in his own printed words (page turned, two lines underlined). Turn (28.2–32.4 s): the split-screen duel, each side with its own band in its own channel, trading bars, then half bars, then beats. Climax (32.4–44.4 s): the Charleston panel pushes the old-time one out; the band cuts dead and the 1925 record plays under the Ford workers' picnic: couples in the pavilion, tap dancers, a four-way grid, the kids. Button (44.4–46.8 s): the record's final chord lands on a freeze, the needle lifts, grease pencil on the kids' knees, one line in near-silence. Sign-off: the ident again ("THAT'S THE NEWS!"), then the end card.

Why it fits the style: the story is told by news objects (a newspaper, a map, a magazine, a book, a record) and by real film, each filmed with its own move; the band edits the film and stops for the punchline; the "knee" thread runs from the headline through Ford's book (on page 12 it also says "a bent-knee dance is ungainly") to the last freeze.

## Shots

Times in seconds; the grid is 200 BPM (beat 0.3 s, bar 1.2 s).

| # | Time | Shot | Move | Material / native move |
|---|---|---|---|---|
| 1 | 0.0–3.6 | ident | searchlights on at 0.15, globe grows, name lands, iris closes on the globe | ident ritual |
| 2 | 3.6–7.2 | newspaper | spins 2.5 turns into lens, slams on 4.8, pushes to the headline | *Austin Statesman*, 5 Mar 1926 · spinning paper |
| 3 | 7.2–8.4 | insert: the dancer's knee | punch-in on the beat, grease-pencil ring + arrow | same page · grease pencil |
| 4 | 8.4–13.2 | US map | diagonal wipe in; Broadway star; dotted arcs to Hollywood (10.2) and Austin (10.55); odometer 1923 → 1926; push to Hollywood | Natural Earth outline · map spread |
| 5 | 13.2–15.9 | 5 + 4 grid | flip in; nine stills dealt one per beat | *Photoplay*, Oct 1925 · grid deal |
| 6 | 15.9–18.0 | full frame | dive into step 1, then steps on the beat | flip-book |
| 7 | 18.0–21.0 | item card "ENTER MR. FORD · 福特登场" | venetian blinds in; frame draws, title lands, slow push | title card |
| 8 | 21.0–24.0 | orchestra → violinist → man dancing to the band | iris open; hard cuts on bars | NARA FC-2275 (1926), FC-2307 (1925) |
| 9 | 24.0–27.0 | "Good Morning" (1926) | title page slams, turns; push to p. 30; two underlines (25.87, 26.9) | document underline |
| 10 | 27.0–28.2 | field of dancers in a circle | slow push | NARA FC-2292 (1927) |
| 11 | 28.2–32.4 | split screen OLD-TIME · 1927 / CHARLESTON · 1924 | circle squeezes left, kids slide in from the right; labels one beat apart; held 4 s | split-screen duel |
| 12 | 32.4–34.7 | pavilion couples | right panel pushes the left out; needle drop | NARA FC-4158 (1924) · needle drop |
| 13 | 34.7–39.5 | pavilion couples, then tap dancers ("Special events") | four cuts on the record's beat (0.12 s ahead of the grid) | same |
| 14 | 39.5–41.9 | four-way grid | cells pop in one per beat | same |
| 15 | 41.9–44.4 | the kids doing the Charleston | clock wipe | same (NARA: "kids doing the 'Charleston'") |
| 16 | 44.4–46.8 | freeze on the kids' knees | jolt; two grease-pencil rings; iris closes | grease-pencil freeze · band stop |
| 17 | 46.8–50.4 | ident reprise "THAT'S THE NEWS! · 本期完" | iris opens; brass "da–DA!" | |
| 18 | 50.4–54.6 | end card | fade through black; held 4.2 s | |

Place cards (top left): AUSTIN · MARCH 5, 1926; PHOTOPLAY · OCT. 1925; FORD FILMS 1925–26; GOOD MORNING · 1926; FORD WORKERS' PICNIC · 1924; and the record's label under the spinning 78 at top right ("CHARLESTON" · 1925 RECORD). Every caption passes `readcheck.mjs`.

## Score structure

- 200 BPM. Fanfare in F (timpani roll, trumpets C–F–A … G–A–C, crash) → original hot Charleston band in F (tuba, banjo, trombones on the Charleston figure, snare, honky-tonk piano; muted trumpet tune under the map, open trumpet + clarinet from the lesson) with glockenspiel pings on each map arrival and a woodblock on every flip-book page → a dead stop on the item card (one D7 stab, crash, timpani roll and two strokes) → original old-time reel in D (fiddle in eighths, a plucked dulcimer double, upright piano, tuba), entering one beat before the iris (J-cut) → the duel (reel left, band right, gated: 1 bar each, then ½, then ¼) → **needle drop**: the band stops dead and the last 12.4 s of the Golden Gate Orchestra's 1925 "Charleston" play, varispeeded +1.06 % to 200 BPM and placed so its final chord lands on the freeze → needle lift, near-silence (projector only) for the button → "da–DA!" (C7 stab, then F with crash and timpani) → a soft clarinet tag under the end card.
- Foley: carbon-arc snap, spinning-paper whoosh with flutter, thump + paper slap, grease-pencil squeaks, telegraph clicks under the map arcs, a camera shutter per still, paper flicks per flip-book page, slat flutter, book slam, page turn, soft-lead scratches, needle drop, stylus skid, freeze thump; projector bed throughout.
- Voice: Kokoro, blend `am_liam:0.6,bm_george:0.4`, speed 1.12–1.18, ten lines; treated as a 1930 optical track (`period_voice()`); band and record ducked ≈ 4.6 dB under it; −14 LUFS.

## End card

50.4–54.6 s, inside a thin double frame: "膝盖警报 Knock-Knee Alert" on one line; a thin rule; "1920s 新闻影片 · 1920s NEWSREEL"; "LemoLab × Claude Opus 5.5"; four lines of source credits (NARA Ford collection, the 1925 record and its UCSB transfer, the three print sources, Natural Earth; "All archive material public domain · An unofficial film"). The "LemoLab × Claude Opus 5.5" line belongs to this library demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  index.html            the page: scenes, transitions, film look, type layer, TEXTS / SUBCHECK
  timeline.json         the clock (written by tools/timeline.py): sections, hits, lines, tags, clips, record
  tools/timeline.py     bars → seconds; voice starts; place cards; archive clip in-points
  tools/prep.py         raw/ → assets/: base grade, crops, film upscale + frame sequences, map projection, record excerpt
  tools/voice.py        Kokoro with blended voices        tools/final_asr.py  speech check on the finished film
  tools/subcheck.mjs    one line per language              tools/cues.py       subtitles
  tools/fetch_sources.py downloads raw/ and fonts/        tools/footage.py    search / fetch / log archive material
  audio/mix.py          score, duel, record, foley, announcer, mix
  voice/lines.json      the ten lines (en, zh)             SOURCES.jsonl / SOURCES.md, CREDITS, FACTS.md
```

1. `sh demo/build.sh` (library set up with `setup.sh deps voice music`): fetches sources and fonts (~500 MB, first run only) → timeline → prep → voice (kept unless `VOICE=1`) + speech check → reading check + subtitle check → events → render (1,310 frames) → mix → subtitles → mux (−14 LUFS, grain 7) → speech check on the film → poster/style frame (rendered without subtitles, `?nosub=1`) → `newsreel-small.mp4`.
2. Change the story by editing `tools/timeline.py` (bars, clips, cards) and `voice/lines.json`; every scene reads its times from `timeline.json`.

Pitfalls tied to this demo: photographs whose rights read only "no known restrictions" (e.g. Library of Congress National Photo Company, Missouri Historical Society) are not used. The NARA description of the 1924 picnic lists "old time dances" as well as "kids doing the 'Charleston'": the old-time couples are not Charleston evidence; only the pavilion couples, the tap dancers and the kids are used as such. The record's beat runs 0.12 s ahead of the grid once its final chord is placed on the freeze, so the cuts inside the record follow the record. Kokoro reads "Bessie" as "Bestie", so the line says "Hollywood star Bessie Love"; Whisper hears "knock-kneed" as "knock-need" through the period treatment (homophone, allowed in the final check). The four-way grid and freeze use 2.3×-upscaled 1924 film, which is soft; the freeze stays wide instead of pushing in.
