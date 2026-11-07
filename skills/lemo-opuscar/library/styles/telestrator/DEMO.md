# Sports Telestrator — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Freeze Frame* (定格, 54.4 s) · `telestrator.mp4` · source in [`demo/`](demo/)

Istanbul, 25 February 2019: Beşiktaş lead Fenerbahçe 3–0 at half-time; Fenerbahçe score three in twelve minutes and draw 3–3. A fictional analysis show, *定格 FREEZE FRAME*, takes the comeback apart goal by goal, each goal with its own technique and the score bar flipping 3–0 → 3–1 → 3–2 → 3–3: the 55th-minute goal frozen mid-play on the pass from the right; the 61st-minute header frozen in two camera angles side by side, then stamped by the VAR check; the 67th-minute equaliser — the decisive one — watched live, rewound and frozen three times (the half-cleared ball, nobody stepping out, a strike 0.84 s after receiving, from outside the box), then seen from the reverse replay. Finally the strike frame flattens into a top-down board where all three shooting positions land: two from close range, one from 27 metres. A data card repeats the counted numbers; the hero's minute and name close it.

This is an unofficial fan analysis made from real broadcast footage released under CC BY by the broadcaster itself (beIN SPORTS Türkiye, on its verified YouTube channel; one clip via Wikimedia Commons), a CC BY photo and a CC0 photo. The show is fictional; beIN SPORTS, the clubs and the league did not make or endorse it. Every fact is quoted in [`demo/FACTS.md`](demo/FACTS.md); the licence check is in [`demo/SOURCES.md`](demo/SOURCES.md).

The CC BY rests on the broadcaster's own licence statement on YouTube (checked 2026-10-21; evidence in `demo/tools/license-evidence.json`); we cannot see the rights chain from league and clubs to broadcaster. Hosting the film here with full attribution is what the licence allows, but re-uploads to video platforms may still be matched by Content ID. A film made in this style for your own topic should use your own footage, or footage whose licence you have checked the same way.

## Story & structure

Shape: a chronological build to the deep breakdown, then a summary. Sting and match-record card (0–5.2 s) set up 0–3 and bracket the three second-half goals. Goal one (5.2–10.6) and goal two (10.6–17.8) are light treatments, so the third keeps the full grammar to itself (17.8–36.8). The shot map (36.8–42.6) is the only new idea after the breakdown: where the three were struck. The data card (42.6–47.0), the 67′ slate (47.0–49.6) and the end card (49.6–54.4) close.

Formats spent, each once and each for a new fact: show sting; match-record card with a goal timeline and a marker bracket; live play with commentary transcript; freeze-in-play; dual-angle split-screen freeze; VAR stamp; score-bar flips (three); tape rewind; three spotlight freezes with rings, a red space patch, cyan link lines, the traced box line; slow motion with a running-trail ring; frame-counting stopwatch; ball comet; reverse replay with its own freeze; perspective flatten into a shot map; data card with a polaroid; hero slate; end card.

## Shots

Times in seconds; segment boundaries in `demo/timeline.json`. Clip `a` = the Commons cut of the third goal (25 fps); `b` = the broadcaster's summary at 110.52 s (first goal); `c` = the summary at 140.80 s (second goal: main camera F001–090, high reverse replay F091–192).

| # | Time | Picture | Format / move | Note |
|---|---|---|---|---|
| 1 | 0.0–1.6 | show board | sting: chalk half-pitch drawn, yellow marker slash at 0.12, title stamped 0.44 (1.6 → 1 overshoot) | strong action by 0.5 s |
| 2 | 1.6–5.2 | stadium photo, darkened | match-record card: date / venue, 3 – 0 – then the away score jumps 1, 2, 3 on each goal dot (2.4, 2.6, 2.8); marker bracket under 55′–67′; label "下半场 三球" | |
| 3 | 5.2–6.8 | `b` F066–F106, 1× | live; ring on No. 17 from F084 | bug LIVE, score 3–0 55′ |
| 4 | 6.8–9.0 | `b` F106 frozen | **freeze-in-play**: ring under No. 17, dashed ball path to the finishing point (that point measured in F119 and mapped back into F106 with that frame's homography), red patch in front of goal, Zajc ringed with his run | voice: "Fifty-five…" |
| 5 | 9.0–10.6 | `b` F106–F146, 1× | play on: ring on Zajc, ball comet; score flips 3–1 at F125 (9.76) | |
| 6 | 10.6–12.4 | `c` main F010→F046 ‖ reverse F108→F156 | **split screen** opens from the centre; each window reaches the header on the same beat | camera labels A / B |
| 7 | 12.4–14.6 | both frozen | **dual-angle freeze**: free-kick path, ring under the header, header arrow, in both windows | voice: "Sixty-one…" |
| 8 | 14.6–17.8 | `c` main F046→F090, slow | score flips 3–2 on F057 (15.4); **VAR stamp** 15.55 | voice: "VAR checks…" |
| 9 | 17.8–22.4 | `a` F001–F116, 1× | live with commentary transcript; score flips 3–3 on F078 (20.92) | |
| 10 | 22.4–23.0 | `a` reversed | rewind | |
| 11 | 23.0–25.0 | `a` F001 | freeze ①: ball circled, dashed arrow, "解围没解远"; No. 3 arriving from off-frame | |
| 12 | 25.0–26.6 | `a` F001→F035, 0.85× | ring picks up No. 3, running trail | |
| 13 | 26.6–28.4 | `a` F035 | freeze ②: red space, two defenders ringed cyan with link lines, "无人上抢" | |
| 14 | 28.4–29.6 | `a` F035→F056, 0.7× | stopwatch counts frames | |
| 15 | 29.6–31.6 | `a` F056 | freeze ③: box line traced, No. 26's block arrow, dashed shot line, stopwatch held at 0.84 s | |
| 16 | 31.6–33.2 | `a` F056→F084, 0.6× | ball comet, ring bursts at the net | |
| 17 | 33.2–36.8 | `a` F262–F336 reverse replay | corner bug REPLAY; freeze 35.04 on No. 26's slide | |
| 18 | 36.8–42.6 | `a` F056 → board | **perspective flatten** 37.35–38.25; dots 2 and 3 drop at 38.25, 38.45; rows of the left column with ≈9 / ≈8 / ≈27 m; all in by 38.95, held to 42.6 | voice: "Two from close range…" |
| 19 | 42.6–47.0 | board | data card: 0.84 s, ≈0.9 s, 12 minutes; polaroid; red circle on 0.84 | |
| 20 | 47.0–49.6 | `a` celebration, slowed | 67′ slate with the commentator's "Mükemmel bir gol!" | |
| 21 | 49.6–54.4 | same, darker | end card | |

`readcheck.mjs` passes on every text the viewer has to read: the record card's title and score, the split-screen camera labels, the shot map's title and three rows, the data card's three rows, the 67′ slate and the end card. Freeze labels and the VAR stamp repeat the voice-over's subtitle (whose timing the .srt carries) and stay out of `TEXTS`.

## Score structure

- 120 BPM, E minor, sampled band: MuldjordKit drums, electric bass, staccato trumpet and trombone, timpani, horn, cellos, glockenspiel.
- The groove restarts at the head of each played segment (full in the record card and the data card, low under live play so the commentary leads, half-time in slow play and the split screen). Every freeze is a brass stab + timpani + thump + shutter, then hi-hat only: the drums stop with the picture.
- Goals: big brass chord with crash and glockenspiel on each score-bar flip; the VAR stamp lands on low timpani, trombone and crash.
- Shot map: stab on the cut, a timpani roll building under the flatten, a second stab when the board settles, glockenspiel B–D–E as the three rows land, then half-time groove.
- Slate and end card: big chord, horns and cellos held in E minor, two glockenspiel strokes, fade with the picture.
- Natural sound: the broadcaster's commentary and crowd at full level in live play, a low-passed crowd bed under freezes, the goal roars aligned to the goal frames.
- Voice: Kokoro `bm_george`, 8 lines at speed 1.1; names spelled for the voice ("Zayits", "Saduk"), real spelling in the subtitles.

## Palette & props

- Yellow `#FFD400` (the team we follow, the ball), cyan `#3FD8FF` (opponents), red `#FF3B30` (space), chalk `#F4F1E8`, board `#0C1411`.
- Type: Noto Sans SC 500 / 700 / 900, Barlow Condensed 600 / 800 Italic, IBM Plex Mono 500 (OFL subsets in `demo/fonts/`).
- Show packaging "定格 FREEZE FRAME" (fictional): sting, corner bug in three modes, score bar, yellow slanted wipe.

## End card

From 49.6 s, held to 54.1 then cut to black with the picture: "定格" (150 px), "Freeze Frame" (yellow), a thin rule, "SPORTS TELESTRATOR · 体育战术板", "LemoLab × Claude Opus 5.5", then five lines of credits: the broadcaster's CC BY video and its Commons cut with title and licence, the changes made, the CC BY photo, the CC BY drum kit, and the CC0 sources with the voice. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  index.html              the page: segments, one function per format, tracking keyframes (TRK), GOALS, TEXTS for readcheck
  timeline.json           segments (clip, source frame ranges) and voice lines — shared by page, .srt and mix
  audio/lines.json        narration (Kokoro, with phonetic names and expected ASR)
  tools/fetch_sources.sh  downloads raw/ (~55 MB: Commons clip and photos, the broadcaster's CC BY video via uvx yt-dlp)
  tools/prep.sh           clips → 1920 JPEG sequences a/ b/ c/ (deblock, lanczos 1.5×, unsharp, grade), photos, match sound
  tools/pitch.json        pitch points per shot frame     tools/homography.py   → assets/pitch.json (matrices, shot positions)
  tools/mix.py            score, foley, voice, match sound, ducking → out/mix.wav
  tools/cues.py           timeline.json → audio/cues.json     tools/fonts.py   OFL subsets
  tools/final_check.sh    loudness, black frames, speech-to-text of the final mix
  tools/footage.py        finding and logging footage (see STYLE.md §10)     tools/license-evidence.json
  FACTS.md, SOURCES.md, SOURCES.jsonl, CREDITS
```

`sh demo/build.sh` (library set up with `setup.sh deps voice music`, sample packs freepats / vsco2ce / vcsl, and `uv`): sources → frames → homographies → fonts → voice + speech check → cues → reading check → render (1,632 frames, 30 fps) → mix → .srt → master (−14 LUFS, grain 2) → poster and styleframe (13.6 s, the dual-angle freeze) → final checks. `?dbg=1` paints the tracked points; `?nosub=1` hides subtitles.

Demo-specific choices and pitfalls: the first two goals come from the broadcaster's full summary, which is the source of the Commons clip (its file page cites the video), so all footage is one CC BY release; the Commons page has no licence-review stamp, so check the licence on the video page itself (verified channel, CC BY field), see `demo/SOURCES.md`. Sources disagree on the first goal's assist (Valbuena vs Dirar), so the film names neither and shows "No. 17 from the right"; the official goal list (55′ / 61′ / 67′) wins over match reports that say 62′ and 66′. A "far corner" claim in one report contradicts the footage, so the third goal's corner is not mentioned. Clip each split-screen window to its slice in source coordinates: unclipped, the sliding windows show the broadcaster's URL for a few frames. Land the VAR stamp after the ball crosses the line (after F057), and make the segment long enough for that. Lengthen record card, shot map, data card and end card (don't slow them) until every row they carry passes the reading check.
