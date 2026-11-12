# Blob Simulation — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Is Faster Better?* 《跑得快，就更好吗？》 (52.0 s) · `pip-simulation.mp4` · source in [`demo/`](demo/)

160 Pips, each born with its own speed, race for beans on a lab board. Eat one bean and you live; eat two and you leave a copy; but running costs speed² energy every second. We follow one fast Pip that eats first and runs dry first, hand the story to a slow one that keeps going, judge the first night, then run 20 generations until the board has turned blue and the Pips line up into the answer: the mean speed falls from 1.25 to 0.73. Narrated in English (Kokoro `bm_george`) with Chinese and English subtitles. Every number is an output of the simulation in [`demo/filmsim.js`](demo/filmsim.js); see [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: the fast ones win the race and lose the game; under these rules, the slow inherit the board.

Arc: a fast Pip wakes, beans pop up around it, the question "Is faster better?" → rise to overhead, the three rules and the colour = speed legend → hard cut, the run starts in slow motion: the fast one (1.69) eats first, its energy bar empties, it fades to grey, slumps and turns to the camera → focus pull to a slow one (0.72) that keeps walking and eats two → crane up, the first night: 55 gone, 54 newborns, slow parents have 19 children and fast ones 6 → 20 generations from above, one wave per morning, the mean-speed chart stepping down; a hard cut into generation 9 shows one of the 20 fast Pips left among slow ones → tilt down: generation 20's 208 Pips walk into printed bars, generation 1 as a dashed outline, the fastest bin empty → "1.25 → 0.73", "Faster wasn't better. Under these rules, the slow ones win." → the end card printed on the board.

Two turns: the fast one wins the race and loses the day; then the whole board turns blue.

## Shots

Film time (`CUE` and `SHOTS` in `demo/film.js`).

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| S1 | 0–4.6 | The fast Pip and its neighbours asleep; beans pop up in rings from it; it blinks awake. Title upper left | low close-up, very slow orbit; picture shifted down to leave hazy board above the title | bean rain |
| S1→S2 | 4.6–6.4 | one Pip → a field of them | rise to overhead (spherical blend) | |
| S2 | 6.4–10.0 | The morning board; on the clean floor left of the board edge: 160 pips, three rules with bean dots, "running costs energy", the colour ramp | overhead, slow push | rules fully in frame |
| S3a | 10.0–14.6 | Hard cut: the run starts in slow motion (about 0.3×, about 0.1× as it runs dry). The fast Pip eats first; its tag "1.69 FAST" and energy bar drain; it fades to spent grey, slumps and turns round | low side tracking shot, slow push to the face; azimuth chosen by code | the race; running dry |
| S3b | 14.6–19.4 | Focus and look move to the slow Pip (0.72); time speeds up; it eats two | focus pull with pull-back, then follow | |
| S4 | 19.4–27.0 | The first night: the verdict sweeps the board (grey rings for the 55 gone, mint rings for 54 newborns); big head count 160 → 159; upper right "children by parent speed": slow 19, fast 6. Settles at 23.3 and holds | crane up to the board-wide view, picture shifted down 190 px, still from 21.8 | verdict sweep; held ≥ 2.5 s |
| S4→S5 | 27.0–28.3 | | rise to overhead | |
| S5 | 28.4–37.3 | Generations 2–20: a mint wave sweeps the board each morning, the old sink, the new pop up; left column on a light plate: big generation number, head count, mean speed, a large chart whose dot drops in on each wave | overhead tilting down and orbiting; 32.0–34.4 hard cut to a low close-up in generation 9 (one of 20 fast Pips left, the slow ones turning to look at it); hard cut back to the other side | the morning wave; waves speed up from 0.44 s to 0.25 s |
| S6 | 37.5–45.4 | The bars and the axis are printed onto the board; generation 20 walks into its slots; counts appear; "1.25 → 0.73" upper right with a mint underline | tilt down from overhead to oblique, slow push, still from 45.4 | Pips into the chart |
| End | 45.4–52.0 | "Rules in, results out. / 规则写进去，结果跑出来。" lower right until 48.8; 48.9–49.4 the end card is printed on the board in front of the histogram, held to 52.0 | locked | |

## Narration and subtitles

Kokoro `bm_george`, speed 0.9 (about 2.5 words per second), ten lines in `demo/voice/lines.json`, each checked with `asr_check.py` (line 3's "there" is a homophone of "their"; its `asr` field says so). Numbers are spelled out in the voice text and written as digits in the subtitles. Subtitles are burned in (`SUBS` in `film.js`) and exported to `pip-simulation.srt`; each cue holds at least the line plus 0.6 s (shortest cue 3.0 s).

| Start (s) | English | Chinese |
|---|---|---|
| 0.4 | 160 Pips. Each one is born with its own speed. | 160 只小人，每只天生一个速度。 |
| 6.0 | One bean keeps you alive. Two beans make a copy. | 吃到一颗能活下来，吃到两颗多生一只。 |
| 10.65 | The fast ones get there first. | 跑得快的，先抢到豆子。 |
| 13.75 | But speed burns energy, and they run dry. | 可速度很耗体力，它们很快就跑不动了。 |
| 17.8 | The slow ones just keep going. | 慢的，一直在走。 |
| 22.0 | By nightfall, the slow ones have left three times as many children. | 天黑时，慢的留下的后代是快的三倍。 |
| 27.3 | Now run it again. 20 generations. | 再跑一次，跑 20 代。 |
| 31.4 | Every morning, there is a little more blue on the board. | 每天早上，台面上的蓝色都多一点。 |
| 38.0 | The average speed falls from 1.25 to 0.73. | 平均速度从 1.25 降到 0.73。 |
| 45.0 | Faster wasn't better. Under these rules, the slow ones win. | 跑得快不一定更好。在这套规则下，慢的赢了。 |

## Score

120 bpm, G major (`demo/mix.py`, events from the page).

| Section | Music | Foley |
|---|---|---|
| 0–4.6 | hang D and G; the 14 nearest beans each get a kalimba note climbing the pentatonic; vibraphone as the fast Pip wakes | bean pops, room tone |
| 4.6–10 | bowed vibraphone on the rise; marimba quarter-note arpeggio; pizzicato pickup before the start | wind on the rise |
| 10.0 | woodblock + low pizzicato on the hard cut | |
| 10–15.6 | slow motion: groove stops, low cello and bowed vibraphone, a step down as the fast Pip runs dry | slowed, duller steps; a long sigh |
| 15.6–20.2 | groove back (G · Em · C), shaker | steps, noms and sighs of the whole board |
| 20.2–21.8 | near silence | |
| 21.8–23.3 | one glockenspiel note per newborn (pitch = its speed), a low woodblock per Pip gone; harp and vibraphone G chord at 23.3 | poofs |
| 27–37.5 | pizzicato eighths and marimba sixteenths (G · Em · C · D); one kalimba note per generation, pitched by that generation's mean speed, so the melody walks down | wind on the rise |
| 37.5–43.4 | thinner groove; a soft xylophone note per Pip landing in its slot (pitch = its speed) | |
| 43.5–52 | harp sweep, vibraphone, bowed vibraphone G chord, hang; at 48.9 a hang, harp and glockenspiel tail rings out to the end | a soft stamp as the end card prints |

The voice is compressed and set about 10 dB above the bed by RMS; the music is cut about 5 dB at 300 Hz–4 kHz and ducks about 5 dB more under the voice. Mastered by `core/render/mux.sh` to −14 LUFS.

## Palette & props

The style palette (STYLE.md §3) with speed as the ramp: cobalt (slowest, 0.7) → violet → rose → tomato → butter (fastest, 1.85); mint for beans, the wave, the energy bars and underlines; spent grey for Pips out of energy. Props: the board, mint beans, printed bars and axis, the generation-1 dashed outlines, two mean-speed triangles (outlined for generation 1, solid mint for generation 20).

## End card

Printed on the board in front of the histogram (lower right of the last shot), from 48.9 s (fully printed at 49.4 s) to 52.0 s: *Is faster better?* / 跑得快，就更好吗？ / BLOB SIMULATION · 小人模拟实验 / **LemoLab × Claude Opus 5.5**. Its rectangle is cast from the screen onto the board and the type is pre-stretched against the perspective so it reads at normal proportions.

## Build & code

New clone: `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments freepats`, `sh tools/fetch.sh instruments vsco2ce`, `sh tools/fetch.sh instruments vcsl`. Then from the library root:

```sh
sh styles/pip-simulation/demo/build.sh     # fonts and voice if missing, speech check, events, picture (2 workers), mix, master, subtitles, readcheck, poster
```

| File | What it is |
|---|---|
| `demo/index.html`, `demo/main.js` | the page; `?a=&b=` renders a stretch of the film |
| `demo/film.js` | the whole film: cues, shots and cameras, Pip acting, generations and waves, the histogram, the end card, type and subtitles, sound events, `window.TEXTS` |
| `demo/filmsim.js` | the simulation (rules, seed 11, k = 0.7); records day 1 step by step and every generation's morning |
| `demo/blob.js` | the Pip: lathe body, tuft, feet, expressions, flock material, instanced crowd |
| `demo/stage.js`, `demo/post.js` | renderer, lights, the shader-gridded board, printed decals; post (copy of `core/three/post.js`) |
| `demo/palette.js` | the only place colours are defined |
| `demo/mix.py` | narration, score and foley from `out/events.json` |
| `demo/subs.mjs`, `demo/make_fonts.py` | subtitle export; font preparation |

Picked by code, not by hand: the fast and the slow Pip (ids 149 and 126 in the run), the azimuths of the opening and tracking cameras (clear line of sight), the generation-9 close-up subject.

Reading-time check (`node core/render/readcheck.mjs styles/pip-simulation/demo`; `window.TEXTS` reports every type element except the subtitles, which are checked through the `.srt`). It does not pass; the picture is left as it is:

- Counters that change with the simulation never hold one value long: the head count and its −gone / +born line in the verdict, the generation number and its "pips · mean speed" line, the bar counts as they appear.
- S2 rules: "Running costs energy:" / "speed² every second" (2.2 s), "→ one more" (1.96 s), "COLOUR = SPEED" and the ramp ends "slow 0.6" / "1.9 fast" (1.6–1.7 s), each shorter than its reading time.
- Generation 9 close-up tag: "one of 20 fast pips left" (1.84 s), "generation 1 had 41" (1.76 s).
- End line "规则写进去，结果跑出来。" (3.36 s against 3.86 s).
- End card: held 2.56 s; read as one block of 66 characters it would need 7.9 s.
- The small "SPEED" axis label sits outside the frame in the final framing (it is never seen).
