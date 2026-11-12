# Instruction Manual Art — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Step Ten* 《第十步》 (50.6 s) · `instruction-manual.mp4` · source in [`demo/`](demo/)

Two people who have never built anything assemble a crib from a flat-pack manual. Ten steps are laid out on one long sheet; the camera travels over it. Step 7 goes on upside down; they take it apart, laugh, try again. Step 9 is "wait" (nine months). Step 10 was never in the manual: the page draws it by itself, and the last yellow thing in the film is the swaddled baby in the crib. English narration (Kokoro `bm_george`, a calm, dry voice, as if the manual were speaking) with Chinese and English subtitles. No brand, logo or product code appears; the story, the crib and the counts are invented.

## Story & structure

Logline: a manual has nine steps for building a crib; the tenth is the one it can't print.

Arc: a flat box lands and opens; its parts fly out to a counted list → the two people (she reads the manual, he points over her shoulder) → a whip past steps 2 and 3 → step 4's do/don't box (don't lift alone / lift together) → push through the ✓ cell into the big picture of step 4 → tilt down to step 5: bolts, a magnifier circle with a hand turning the key, the click → push into the magnifier, shape-matched cut to a round knob on the floor: the left end is on upside down (step 7), ✗ → three beats: take it apart, laugh, try again (✓) → step 9, wait: the finished crib in a room corner, the window light sweeping across the floor nine times, faster each time → step 10: a lone "10", then the drawing grows by itself; the swaddle fills yellow → pull back to the whole page, title and sign-off printed in the footer.

Why this subject: assembly is the native subject of 45° manual drawing (parts lists, two-person lifts, do/don't, magnifiers, click, flip arrows), and it has a hook (a flat box, two beginners), a turn (step 7 upside down: everyone has done it) and an ending carried by the style's own rule (yellow = the new part).

Native moves spent: *parts explosion* (step 1), *line art grows* (the people, step 4's big picture, step 10), *do/don't box* (step 4), *push through a shape* (the ✓ cell; the magnifier), *magnifier circle* (step 5), *arrow-driven assembly* (steps 3, 5, 6 and the flip at step 8), *new part yellow* (every step; the swaddle), *the whole page* (ending).

### The assembly state table

Every picture of the crib (steps 2–10, the parts list, the final page) is drawn by `crib(v, S[k])` in `demo/crib.js` from this table.

Parts (as on the step 1 list): end panels 2 (two posts with knobs and an arched board each), side rails 2 (top rail, bottom rail, 11 round bars), base board 1, mattress 1, bolts 8, hex key 1.

In the box (inside 120 × 70 × 31 cm, bottom to top): mattress → base board → two rails → two end panels; bolts and key in a small bag in one corner. They come out top first: end panels ×2 → bolts → key → rails ×2 → base board → mattress; each flies along its own dotted line from where it lay to its place on the list, turning upright on the way. The box is empty only after the last part leaves.

Fixed geometry: crib 124 × 66 cm, posts 88 cm; rails between the posts, bolted from outside at 26 and 79 cm; base board on the bottom rails (top at 31 cm); mattress 10 cm thick on the board.

| Step | Adds | The crib at the end of the step | Parts used |
|---|---|---|---|
| 1 | unbox and count | — | — |
| 2 | right end panel stands; a dotted footprint of the whole crib | right end | end panel 1 |
| 3 | back rail into the right end, 2 bolts | right end + back rail (L shape) | rail 1, bolts 2 |
| 4 | the two of them carry the front rail (do/don't) | as step 3 | — |
| 5 | front rail into the right end, 2 bolts, turned until it clicks | U shape, open on the left | rail 1, bolts 2, key |
| 6 | base board slid in from the open side, then the mattress | U + board + mattress | board, mattress |
| 7 | left end, 4 bolts, upside down (turned 180° about the front-back axis: arch down, knobs on the floor) | four sides, left end inverted, ✗ on it | end panel 1, bolts 4 |
| 8 | left end lifted out, turned over, set back | the finished crib, ✓ | — |
| 9 | wait | as step 8, in a room | — |
| 10 | not in the manual | as step 8 + a swaddle on the mattress | — |

Bolts: 2 + 2 + 4 = 8, as on the list.

## Shots

One sheet, a zigzag: steps 1–4 left to right on the first row, 5–8 right to left on the second, 9–10 on the third, the footer to their right. Dotted lines join step to step. The angle never changes.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–6.4 | Step 1: a flat carton lands (0.62), the lid opens (1.55); the parts fly out one by one along dotted lines (from 2.2) and settle into the counted list; "1" printed at 4.6 | close on the box, pulling back as the parts spread | parts explosion |
| 2 | 6.4–10.0 | The two people appear: she reads the open manual, he leans over her shoulder and points; a parts box "2×" with two figures pops in | pan right | line art grows |
| 3 | 10.0–10.7 | Steps 2 and 3 pass by | whip pan with horizontal blur | the long page |
| 4 | 10.7–14.2 | Step 4's do/don't box held whole for 3.5 s: ✗ one person dragging the rail, the other end on the floor; ✓ two people, one at each end | locked, slight push | do/don't |
| 5 | 14.2–17.75 | Push into the ✓ cell until it fills the frame; its small picture is step 4's big picture (the white fades to paper); the two carry the yellow front rail toward the crib in short steps; dotted line and floating arrow drawn after | push through a shape | arrow-driven assembly, new part yellow |
| 6 | 17.75–23.2 | Step 5: tilt down to the second row, "5" entering from the bottom edge; bolts fly in along dotted lines; she half-kneels outside the right end beside the bolts, turning the key, her right forearm on her front knee; he stands with feet apart, steadying the open end of the front rail; a magnifier circle opens with a hand turning the key and a rotation arrow; the click lands on the word "clicks"; the rail's yellow fades to white; then the camera pushes into the magnifier until the bolt head fills the frame | tilt; push into the magnifier | magnifier circle |
| 7 | 23.2–28.8 | The bolt head cuts to a round knob, and the pull back shows the knob on the floor: the left end is on upside down. The two stand off the crib's left front corner: he slowly sets his hands on his hips, she scratches the back of her head; the music stops 0.8 s before the red ✗ stamps on "upside" | shape-matched cut + long pull back; locked | ✗ |
| 8 | 28.8–32.5 | Three beats on three words: (1) wide, "Take it apart": the wrong end, now a dotted outline, lifted out under a big arrow; (2) medium, "Laugh": he sits cross-legged, leaning forward, holding his stomach; she bends with hands on knees; three short "ha" lines; (3) close, "Try again": the yellow left end turns over along a 180° arrow and lands, blue ✓ | rhythm cuts, three shot sizes | flip arrow |
| 9 | 32.5–37.0 | Step 9: tilt to the third row: a room corner (two walls, a window, a rug) with the finished crib; parts box "9×" with a crescent moon; window light sweeps the floor nine times, faster each time; the clock (woodblock) starts half a beat early, under the end of step 8 | whip + very slow push | the manual's signs for time |
| 10 | 37.0–44.6 | Step 10: pan right to an empty cell; only "10" at first (37.85), almost silent; 38.05–40.85 the drawing grows by itself: the crib, the two of them leaning on its foot end with their backs to us, his arm across her back, hand on her near shoulder; 41.15 the last stroke fills the swaddle on the mattress yellow; hold 3.4 s with a very slow push | locked, the picture growing in frame; slow push | line art grows; the yellow rule pays off |
| 11 | 44.6–50.6 | The whole manual: a long pull back until all ten steps sit on one sheet (steps 2, 3, 6 included); every part white again, only the swaddle yellow; 46.5 the footer prints the title, 47.3 the style name and the sign-off; hold to the end | big pull back, then a slight push | the whole page |

Transitions: reveal by pull back, pan, whip pan, tilt, push through a shape (the ✓ cell), push into a magnifier + circular match cut (bolt head → knob), three rhythm cuts on three words, a J-cut clock, a picture growing in frame, and a pull back to the whole map. No page turns, no header bars.

## Voice and subtitles

Kokoro `bm_george`, speed 0.86 (about 2.3 words a second), ten lines in `demo/vo/lines.json`, each placed by `demo/tools/timeline.py` and checked with `asr_check.py`. Step 10 starts in silence; line j comes a second after the swaddle turns yellow.

| Line | Start | English (spoken) | 中文 |
|---|---|---|---|
| a | 0.70 | It arrives flat. | 送来的时候，它是扁的。 |
| b | 2.90 | A box of parts, and one small key. | 一箱零件，一把小扳手。 |
| c | 6.60 | And two people who have never built anything. | 还有两个从没装过任何东西的人。 |
| d | 11.00 | Step four. Never lift alone. | 第 4 步：别一个人抬。 |
| e | 19.30 | Step five. Turn until it clicks. | 第 5 步：拧到咔哒一声。 |
| f | 23.70 | Somewhere around step seven, / everyone puts one end on upside down. | 大概到第 7 步，/ 每个人都会把一头装反。 (two cues) |
| g | 29.07 | Take it apart. Laugh. Try again. | 拆开。笑一笑。再来。 |
| h | 33.10 | Step nine. Wait. | 第 9 步：等。 |
| i | 38.20 | Step ten was never in the manual. | 第 10 步，说明书里从来没有。 |
| j | 42.10 | You learn that one by heart. | 那一步，只能用心学会。 |

Eleven cues, each at least 1.8 s and at least the spoken line + 0.6 s; the last leaves at 45.0 s, before the sign-off is printed. Subtitles are drawn by the page and written to `instruction-manual.srt` from the same table.

## Score structure

F major, 92 BPM, a small ensemble (`demo/mix.py`).

| Section | Time | Palette | Notes |
|---|---|---|---|
| Unboxing | 0–6.4 | marimba eighths, cello pizzicato, glockenspiel | one glockenspiel note per part landing, rising through the chord |
| People, step 4 | 6.4–17.75 | the same little machine, felt piano | one pizzicato per carrying step |
| Step 5 | 17.75–23.2 | thinner | ratchet clicks, then the click alone |
| Step 7 | 23.2–28.8 | music stops dead 0.8 s before the ✗ | ✗ = a low "wrong" pizzicato + piano |
| Step 8 | 28.8–32.5 | pizzicato / marimba giggle / harp up + glockenspiel on the ✓ | one figure per beat |
| Step 9 | 32.5–37.0 | woodblock clock, one stroke a month, faster and faster | starts under the end of step 8 (J-cut) |
| Step 10 | 37.0–44.6 | near silence, pencil on paper | hand chimes + glockenspiel as the swaddle fills, then the piano plays the unboxing figure slowly |
| Whole page | 44.6–50.6 | the strings for the first time, harp running up | lands on F major as the sign-off prints; ends naturally |

Foley follows the materials: carton landing, lid, wood knocks, pencil, paper sliding, bolts, ratchet, click, rubber stamp, wood turning and landing. Mix: the voice compressed, the music about 10 dB under it and cut at 300 Hz–4 kHz while it speaks; −14 LUFS, true peak ≤ −1 dB (`mux.sh`). All cue times come from `events.json`.

## Palette & props

- Paper `#F4F1EA`, ink `#1E1D1B`, fitted parts white in three shades, the new part safety yellow, ✗ red `#D23A2E`, ✓ blue `#2C66AC`; mattress `#FFFFFF` / `#F1EEE7` / `#E4E0D6`.
- People (`rig.js`): faceless, about seven heads tall (she is 0.94 of his 172 cm). He: white top, mid-grey trousers, short hair. She: light-grey top, dark-grey trousers, a bun.
- Props: the flat carton, the crib (as in the state table), bolts, a hex key, the open manual, a room corner with a window and a rug, the swaddle.
- Line 2.6 px at 1:1, scaled by zoom^0.55; step numbers Inter 700 at 150 page units; parts counts Inter 600.

## End card

Printed on the page's footer, in ink, to the right of step 10: *Step Ten* 第十步 (title, 46.5 s), then *Instruction Manual Art* 说明书插画 and `LemoLab × Claude Opus 5.5` (47.3 s), held 3.3 s during the final settle. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh        one command: fonts (if missing) → voice (if missing) + speech check → timeline → events → picture → mix → master → readcheck → poster, style frame, model sheet
  index.html      the page: no query = the film; ?f=figs = the people's turnaround sheet (build.sh leaves it in out/modelsheet.jpg); ?f=hands = close-up hands
  film.js         render(t): the long page, camera keys, steps 1–10, footer, subtitles, motion blur; events() → window.EV; texts() → window.TEXTS
  iso.js          the 45° orthographic engine
  rig.js, poses.js   the people and their poses;  figs.js  the turnaround sheet and the close-up hands sheet (?f=hands)
  hand.js         a hand in close-up (not used in this film: its one close-up hand, in the step-5 magnifier, is drawn in film.js)
  crib.js         the one crib model and its state table S
  page.js         fonts, magnifier circle
  mix.py          score + foley + narration from events.json and timeline.json → out/mix.wav
  tools/timeline.py   narration placement, subtitle cues → timeline.json, ../instruction-manual.srt
  vo/             lines.json (Kokoro bm_george), dur.json, words.json; the clips are local
  shot.mjs        one still through the library's page opener (used for the model sheet)
  tools/fonts.sh  Noto Sans SC 500 subset to the characters on screen (Google Fonts CSS API, &text=); refetched when they change
```

- `sh styles/instruction-manual/demo/build.sh` from the library root (renders at 30 fps with `--workers 2`; `WORKERS=3` for more; `VOICE=1` regenerates the narration). On a fresh clone run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl` first; Inter is downloaded on the first run, and the Chinese subset whenever the on-screen characters change.
- Single frame: `node core/render/still.mjs styles/instruction-manual/demo 41.75`. Model sheet: `node styles/instruction-manual/demo/shot.mjs out.png --q f=figs`; hands sheet: `--q f=hands`.
- The model sheet (`?f=figs`; `build.sh` leaves it in `demo/out/modelsheet.jpg`) shows both people at eight headings and in the film's working poses; check every new pose there before using it in a shot.
- `render(t)` depends on `t` only; the camera is a list of keys (`buildKeys` in `film.js`) with zoom in log space, the zoom centre staying put on screen.
- Reading check: `window.TEXTS` reports the step numbers, the parts counts and the footer (subtitles excluded). 28 of 30 pieces pass. Two do not, on purpose: step 2's number "2" and its parts count "1×" cross the frame for well under a second during the whip pan at 10.0–10.7 s, which skims steps 2 and 3; both are read later on the whole page (from about 46 s, more than 4 s). The picture is left as it is; build.sh reports these two and goes on.
- Demo-specific pitfalls: the crib is drawn in three depth groups (far end and back rail → board, mattress and swaddle → front rail, near end, bolt heads), or the board and mattress cut through the bars; only the right end's outer face is turned to the viewer, so only its bolt heads are drawn; at step 7 the people stand off the crib's left front corner (behind the crib their legs showed through the bars); at full-page scale the upside-down end is small, so the ✗ sits on it and step 8 cuts in close.
