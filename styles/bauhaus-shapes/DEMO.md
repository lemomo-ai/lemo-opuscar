# Bauhaus Shapes — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *COMPOUND* 《复利是怎么滚起来的》 (52.0 s) · `bauhaus-shapes.mp4` · source in [`demo/`](demo/)

One green dot rolls through the whole film. It doubles every ten years and becomes 128 after seventy; the same rate without compounding gives 6.02; the last ten years add exactly what the first sixty built (64 = 63 + 1); starting ten years late leaves half; and the rule of 72 closes it (72 ÷ 7.2 = 10). English narration (Kokoro `af_heart`), Chinese and English subtitles. Every number is exact for the film's premise; the sources and the one approximation (the rule of 72) are in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: one dot, seventy years, and why the last ten matter most.

Arc: hook (a dot rolls into a disc that breaks the frame, 1 → 128) → first turn (take the interest out: 6.02 against 128, as true areas) → second turn (the last ten years equal everything before them) → consequence (ten years late, half) → a rule to take away (72 ÷ rate = years to double), set on the same grid that built the title.

Native moves spent: *the snowball* (S1), *the ruler* (S2), *cut and tangent* (S3), *the ghost* (S4), *the grid sets the type* (S5). The construction grid returns in every scene and does one more thing each time: layout → ruler → tangent → scale on the slope → the formula's baselines, then folds into the zero.

## Shots

Film time (`SHOTS`, `T1`…`T5` in `demo/film.js`).

| # | Time | Shot | Camera / transition | Native move |
|---|---|---|---|---|
| S1 | 0.0–11.6 | Construction lines draw the layout; a yellow square slides in and locks; the blue slope swings up about its corner; COMPOUND rises letter by letter, its O a green dot dropping in; a green "1" appears on the slope and rolls up, a ring per decade, the number on the slope jumping 2…128; the disc lands at 7.35 and the grid retracts | locked while it builds; slow push 7.6–11.6 | the snowball |
| S2 | 11.6–21.0 | The title slides off as one block; the slope, its path and the disc swing flat about the corner and the blue becomes the ground under a ruler; decade ticks, and a column at each decade rising to the diameter of the ball at that age; under the line, one yellow square per decade (simple interest, area = money); 128 against 6.02, held about 5 s | pull back while it swings; push into the disc's yellow ring until it fills the frame | the ruler |
| S3 | 21.0–32.7 | Out of the yellow: the ball alone, centred; a compass circles the 64 disc, a construction axis runs from the core through every ring; the 64 disc slides out leaving a paper hole, two tangents tie them, a blue = drops between; the first dot hops out and becomes "= 63 + ●" | through a shape (pull out of yellow), slow push then ease back; whip right with long construction lines passing | cut and tangent |
| S4 | 32.7–40.5 | The slope again, decades along its edge; the 128 drains to an outline and its path turns pale; the start marker slides one decade up; a second run grows only to 64, nested in the outline; measure lines tie 128 and 64 to their tops; held about 3 s | wider locked frame; slow push | the ghost |
| S5 | 40.5–52.0 | Labels, balls and slope fall out of frame in that order; the five construction lines left behind re-form as baselines, cap line and column; 72 ÷ 7.2 rises block by block (÷ is a bar and two dots, the point a square); = slides in; the 0 of 10 is a ball that rolls in and grows three rings; the reading in the right column; the grid folds into the zero; the title signature and the end card | grid match cut; locked to the end | the grid sets the type |

## Narration and subtitles

`demo/voice/lines.json`: twelve lines, each with the spoken text (numbers spelled out), the English and Chinese subtitle lines and the Kokoro settings (`af_heart`, speed 0.76–0.78, about 2.2–2.7 words per second). Line starts are `VO_T` in `film.js`; subtitle cues are built from them (each ≥ 1.8 s and ≥ its line + 0.6 s) and burned into a paper block fixed to the bottom-right corner.

## Score

`demo/mix.py`, one 120 bpm grid in D major, one bar = 2 s: pizzicato bass on 1 and 3, marimba broken chords (half the notes in S3 to leave air), vibraphone on the title blocks, a kalimba note per ring climbing the scale, a harp + vibraphone + glockenspiel chord at each landing (128 at 7.35, 64 at 37.3) and a bigger one when the grid folds (48.95), decaying to the end. Effects follow the geometry (pen hiss per grid line, clacks for squares, thuds lower as balls grow, whooshes for the swing, the zoom and the whip). The voice is compressed; the bed sits 10 dB under it by RMS and dips in 300 Hz–4 kHz while a line plays.

## Palette & props

Palette Klein (paper #F8F7F3, protagonist #0E9F7A, field #2138C8, pivot #F4E04D, secondary #D5DCEE, ink #161C3A); `PAL=sorbet` renders the same film in Sorbet. Props: one dot, one slope, rings, squares, construction lines, and type. Premise: the money doubles every ten years (a yearly rate of 2^(1/10) − 1 = 7.177%).

## End card

From 48.2 s to the end (52.0 s), in the right column under the small COMPOUND INTEREST signature: a yellow square drops, `BAUHAUS SHAPES 包豪斯几何` and `LemoLab × Claude Opus 5.5` rise from their slots like every other label in the film.

## Build

```sh
sh tools/fetch.sh voice
sh tools/fetch.sh instruments vsco2ce
sh tools/fetch.sh instruments vcsl
sh tools/fetch.sh instruments freepats
sh styles/bauhaus-shapes/demo/build.sh          # bauhaus-shapes.mp4 + .srt, poster.jpg, demo/stills/styleframe.jpg
PAL=sorbet sh styles/bauhaus-shapes/demo/build.sh
```

`build.sh` fetches the fonts if missing (Jost and Noto Sans SC from google/fonts) and builds the Chinese subset (`subset.sh`), makes the voice if missing and checks every line with `asr_check.py`, exports events and subtitle cues from the page (`cues.mjs`), mixes (`mix.py`), renders, masters to −14 LUFS and runs `readcheck.mjs`. About 1,560 frames at 30 fps; two workers take a few minutes.

Code entry points:
- `demo/index.html`: drawing kit (shapes, type, the paper finish), the two palettes, three still layouts (`?frame=1|2|3`: title, a lever, a share of water), and the film switch. Query: `?pal=klein|sorbet`, `?cut=a:b` for a stretch, `?sign=1` to draw the credit in a stretch's last 2.5 s.
- `demo/film.js`: the whole film: rolling balls (`makeRoll`, phase integrated along the path), rings (`ball`), the camera (`camLerp`, `camZoomTo` for zooms through a shape), one function per scene, subtitles, sound events, `window.TEXTS` for the reading check.
- `demo/mix.py`: voice, score and effects for the whole timeline, cut to `[a, b]`.
