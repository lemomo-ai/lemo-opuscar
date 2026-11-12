# Comic History Cartoon — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *One Piece of Paper* 《一块纸》 (51.0 s) · `comic-history.mp4` · source in [`demo/`](demo/)

Alsace-Lorraine changed hands four times: 1871, 1918, 1940, 1944–45. Each time someone tore the piece of paper off the map and pasted a new one. The people living on it never moved; only their papers changed. An English narrator (Kokoro `bm_george`), Chinese and English subtitles burned in as comic caption boxes and written to `comic-history.srt`. Facts and sources: [`demo/FACTS.md`](demo/FACTS.md). The generals are comic personifications of states, not portraits; the Alsatian woman is a personification of the region's people, not a real person.

## Story & structure

Logline: one piece of paper was torn off and pasted back four times; the woman living on it never moved house, but her home switched countries four times.

Arc: 1871, a Prussian general hops in, scissors cut the border, a grey patch slaps down, the French general stamps his foot → the camera pulls back: it is a comic page; in the next, narrow panel an Alsatian woman's identity card reads *Française*, a stamp drops: DEUTSCH → whip across the gutter to 1918: the French general tears the grey paper off and flings it in the Prussian's face, the helmet flies, a blue patch slaps on: MINE AGAIN → 1940, a narrow, dark panel with no jokes: a faceless hand presses a grey patch down, it will not lie flat, a corner peels up → 1944–45: the French general tugs the corner, cannot get it off, falls over, pastes another layer on top, THUNK → tilt down and push in: four layers of paper seen from the side; the woman, now a grandmother, stands on the stack with her granddaughter; a STRASBOURG pin drops on the real Strasbourg → pull back to the whole page; a title card slaps into the last panel.

Native moves spent, each a step further than the last: *cut along the dotted line* (1871), *stamp the papers* (Alsace), *tear it back* (1918), *it won't lie flat* (1940), *layer on layer* (1944–45 and the stack), *pin on the map* (the ending).

The comic page has six panels: 1871 (wide), Alsace (narrow), 1918 (wide), 1940 (narrow, dark), 1944–45 (wide), title card (narrow).

## Shots

| # | Time | Panel | Shot | Camera / transition | Native move / note |
|---|---|---|---|---|---|
| 1 | 0.0–10.0 | 1871, full screen | Prussian general hops in on the beat holding a grey patch; the 1871 tag drops in; a dashed cut line prints, scissors snip four times, the cut land greys and hatches; he lifts the patch overhead and trembles; one in-between frame and SLAP; LORRAINE and ALSACE print on the patch; HEY! then MINE NOW. 归我了！; treaty slip pasted under the tag; the French general stamps; two paper clouds | slow push 1.0→1.065, big shake on the slap, slow pull back; small shake on the stamp | cut along the dotted line; height is shadow; impact spreads (hat flies off and lands) |
| T1 | 10.0–11.0 | 1→2 | first sight of the comic page | pull back to 0.6×, then slide to the narrow panel, which parks at the right of frame with the 1871 panel still beside it | page reveal |
| 2 | 11.0–16.2 | Alsace, narrow | a timber-framed house; the woman holds up her card, *Française*; a stamp drops past her nose: DEUTSCH; she switches to the worried head | locked; the whole panel jolts at the stamp | stamp the papers |
| T2 | 16.2–16.8 | 2→3 | | whip pan diagonally across the gutter with speed lines | time jump |
| 3 | 16.8–26.2 | 1918, full screen | the French general hops over, tears the grey paper off (ragged fibres, shreds left under it), flings it into the Prussian's face, the helmet flies and lands; a blue patch slaps on; MINE AGAIN. 又归我了！ | push in on the tear, pull back with the throw; shake on the slap | tear it back; callback to 1871's line |
| T3 | 26.2–26.9 | 3→4 | | slide to the narrow panel, which parks at the right; the panel darkens and cools, its shadow falls over the lit 1918 panel beside it | tone change |
| 4 | 26.9–33.4 | 1940, narrow, dark | only the piece of land; a faceless dark grey paper hand presses a grey patch down and leaves; a corner peels up | close-up 2.3×; light shake on the press | it won't lie flat; no comic sound |
| T4 | 33.4–34.1 | 4→5 | | diagonal drop down the page, pull out then push in | back to the light |
| 5 | 34.1–38.0 | 1944–45, full screen | the French general tugs the peeled corner, it holds, he falls on his back; he pastes another blue layer: THUNK | push in 1.06 on the tug; the biggest shake of the film | weight of thick paper |
| 6 | 38.0–46.2 | 1944–45, full screen | the map flattens into a tabletop: four layers of paper seen from the side; grandmother and granddaughter hop onto the stack hand in hand; the grandmother stamps twice (the 1871 rhyme); the STRASBOURG pin drops | tilt down and push in to 1.85× | layer on layer; pin on the map |
| T5 | 46.2–51.0 | the page | pull back to rows 3–5 of the page; at 47.0 s the title card slaps into the last panel; held to 51.0 s | pull back to 0.7×, slow drift | end card |

## Score structure

120 bpm (a bar is 2 s), B-flat major, about 25½ bars; every cue is written in film seconds in `demo/mix.py`.

| Time | Section | Instruments |
|---|---|---|
| 0–10 | 1871, the German side's march | tuba and trombone oom-pah; a rising xylophone note on each hop, four falling xylophone notes for the snips; only a thin violin tremolo during the wind-up (3.0–3.85 s), then the whole band on the slap; brass cadence at 8.5 s |
| 10–16.2 | Alsace | glockenspiel and pizzicato music-box tune; stops dead on the stamp, the tuba sinks two notes |
| 16.8–26.2 | 1918, the French side takes the tune | accordion musette, snare brushes, the slap and a flourish |
| 26.9–33.4 | 1940 | both accents gone: low strings in G minor and slow timpani like footsteps; no comic sounds |
| 34.1–38 | 1944–45 | a snare roll that builds under the tug-of-war; the THUNK is the heaviest hit of the film |
| 38–51 | the ending | for the first time the accordion melody plays over the tuba's oom-pah; glockenspiel on the pin; the whole ensemble on a B-flat major chord as the title card lands, left to ring out to 51 s |

Foley is all synthesised in `mix.py`: paper slaps, scissors, rubbing paper flat, tearing, the slide whistle of a flying hat, pin clicks, tape, paper clouds.

Mix: the voice is compressed and set by RMS about 10 dB over the music; while it speaks the music and foley dip 3 dB and the music's 300 Hz–4 kHz band another 7 dB. `mux.sh` masters to −14 LUFS (−13.9 LUFS, true peak −1.2 dB measured) with grain level 1.

## Palette & props

- Palette: paper #F1E8D2, ink #2B2219, France #6E93D6, German Empire #5D6672, a German patch #7A8390 (one step lighter than the print), a French patch #5A80CC (one step deeper), sea #A6CCD3, accent red #C8463A, brass pins #D9B158, caption card #F5E9C4, table #7B6A57; neighbours in print sand #E2B85A, sage #8DB56F, brick #D9705F.
- Map: Natural Earth 1:50m (`demo/europe.json`, Europe only), equirectangular centred on Alsace; 1871 groups pieced from modern borders (Poland's west inside the German Empire), the 1871 Alsace-Lorraine line hand-traced.
- Puppets: a French general (bicorne with cockade, sash), a Prussian general (spiked helmet, moustache, sabre), an Alsatian woman in traditional dress with a large black bow (young, worried, smiling, grandmother, surprised grandmother) and her granddaughter; each with swapped heads.
- Paper props: scissors with red handles and a pin pivot, grey and blue patches with dashed inner edges, torn shreds, a peeled corner, the stack of four layers, an identity card (Française / DEUTSCH), a rubber stamp, a faceless dark paper hand, a timber-framed house with geraniums, year tags (1871, 1871, 1918, 1940, 1944–45) with a printed rule, a treaty slip, the STRASBOURG pin, paper speech bubbles and steam clouds.

## End card

The title card slaps into the last (narrow) panel at 47.0 s: *ONE PIECE OF PAPER* · 一块纸 · *Alsace-Lorraine 1871–1945*; under a thin printed rule, the style name *Comic History Cartoon* / 搞笑历史卡通 and `LemoLab × Claude Opus 5.5` (IM FELL English, about 29 px on screen). Held to 51.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh         one command: fonts (if missing) → parts (if missing) → voice (if missing) + speech check → events → picture → mix → master → subtitles → readcheck → poster, styleframe
  index.html       render(t): the page camera PCAM, six panels drawn into their own canvases, the printed map, puppet rigs RIG (FK + two-bone IK),
                   patches (cut, tear, fold, stack), bubbles, year tags, caption boxes from SUBS, fillMixed()/numFont() for numbers, EV, TEXTS
  mix.py           narration + foley + score from out/events.json → out/mix.wav (film seconds; --from/--to render a span)
  europe.json      the printed map's data (Natural Earth 1:50m, Europe only; from tools/europe_map.py)
  tools/europe_map.py  builds europe.json from world-atlas 2.0.2 (Natural Earth 1:50m countries)
  tools/extract.py keys and cuts src/sheet-*.png into parts/*.png, parts/index.json and parts/*_debug.jpg (numbered parts, for reading pivots)
  tools/srt.mjs    the .srt from the page's SUBS table
  tools/sheets.json  the prompts the three part sheets were generated from
  vo/lines.json    the voice script (numbers spelled out for the voice, digits in the subtitles)
  FACTS.md         every fact in the film with its source
  CREDITS
```

- `sh styles/comic-history/demo/build.sh` from anywhere (renders 1,224 frames at 24 fps with `--workers 2`, about 30 s; the whole build takes about two minutes). On a fresh clone first run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce`, `sh tools/fetch.sh instruments vcsl` and `sh tools/fetch.sh instruments freepats` (the accordion). The first run also needs the network for the fonts. `VOICE=1` regenerates the narration, `PARTS=1` re-keys the part sheets, `FRAME=<s>` picks another poster time.
- **The part sheets are Codex image generations and are not in git** (`demo/src/*.png`, `demo/parts/*.png`, gitignored). A clone cannot rebuild this film as it is (`build.sh` stops and says so): a fresh generation from `tools/sheets.json` will not match these sheets, and the pivots and part numbers in `index.html` (`RIG`) are read off them. To build a working copy, generate new sheets with `core/image/gen_image.py` (it needs the Codex CLI): each prompt in `tools/sheets.json` with `--aspect 16:9 --out demo/src --name sheet-fr` (`sheet-pr`, then `sheet-al` with `--ref demo/src/sheet-fr_*.png` as the style reference), rename the results to `src/sheet-fr.png`, `sheet-pr.png`, `sheet-al.png`, run `PARTS=1`, and re-read the pivots in `RIG` from `parts/*_debug.jpg`. The film will then look different from `comic-history.mp4`.
- The map is `demo/europe.json` (committed, 95 KB): the countries in `GROUPS`, clipped to a box well outside every baked view. `python3 tools/europe_map.py` rebuilds it from world-atlas on the npm CDN (needs the network); points inside the box keep the source's exact values, so the picture doesn't change. A new map region needs a new box and country list, and DIRECTOR.md §13 for any border data.
- `?from=A&to=B` renders a span of the one timeline (`window.DUR = B − A`); the picture is never re-made for a cut. One frame: `node core/render/still.mjs styles/comic-history/demo 42`.
- Readcheck: all 24 pieces of on-screen text pass (the tightest is HEY!, 1.92 s against 1.77 s). Subtitles are checked against the `.srt`: every cue holds at least max(1.8 s, speech + 0.6 s); the tightest is cue 7 (*Four layers. One lifetime.*), 2.98 s against 2.97 s.
- Known limits: in the 1940 panel the grey patch is low in contrast against the printed German grey (the panel is dark on purpose); the side of the final stack is built layer by layer in 2.5D, not true 3D, and its four colours read dark from the side.
- Demo-specific pitfalls: IM FELL has only old-style figures (1871 reads "I87I"), so every number is set in Old Standard TT's lining figures; a narrow panel centred on screen leaves a third of the frame as bare table, so it parks at one side; a patch in its owner's exact printed colour disappears once it moves.
