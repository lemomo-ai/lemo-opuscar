# Scratchboard Long Take — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Thirty-Three Cranes* 《三十三只》 (60.0 s) · `printed-long-take.mp4` (English narration) · source in [`demo/`](demo/)

## Story & structure

A January dawn at minus twenty on the Setsuri river at Tsurui, in the wetlands of eastern Hokkaido. The river is spring-fed and does not freeze; red-crowned cranes sleep standing in it. The crowns wake one by one, the flock lifts off over the cleared marsh to a feeding field, where a board says that in the winter of 1952 only 33 cranes were found in all of Hokkaido. Feeding began that year; the same field is printed again as the numbers grow; the board is cut with the January 2025 count, 1,927, and "Vulnerable" is struck and sealed "Near Threatened" (Ministry of the Environment, March 2026). A narrator tells it in eleven short lines; every line has a subtitle bar, Chinese above English. Every fact is in [`demo/FACTS.md`](demo/FACTS.md). The bridge name 音羽橋 on the plate is the real bridge's name; the plate, thermometer, board, notice and seal are our own drawing.

Why it fits: the crane is already ink, paper and one red, so the single red needs no excuse; the steaming river, rimed trees and volcano row are what knife cuts draw well. Native moves spent: the sky carved open and one red waking (dawn), through the steam (takeoff into the air), the same place printed again (the four prints, the red as a second plate), words cut into the world (plate, board, seal), a plate of type in the sky (title and end card).

## Shots

| # | Time | Narration | Shot | Camera |
|---|---|---|---|---|
| 1 | 0–5.2 | line 1 | night valley, volcano row, windbreak grid, steaming river; title cut into the sky (0.15–5.0) | high wide, sinking |
| 2 | 5.2–7.5 | line 2 | low over the water toward the bridge | glide, decelerating |
| 3 | 7.5–11.3 | — | stone pier with the cast-iron plate 音羽橋 / Otowa Bridge and a dial at −20, snow and icicles; then past the pier and under the bridge | long-lens hold, then the pass slowed to half speed with an ease in and out (10.0–11.3) |
| 4 | 11.3–14.1 | line 3 | sleeping cranes close in the water, the sky starting to be cut | water level, low aim |
| 5 | 14.1–16.6 | — | crowns wake left to right; the nearest pair calls | tilting up with the dawn |
| 6 | 16.6–19.35 | — | run, splash, lift off; into the steam (19.1–19.55, under half a second of paper) | rising with the leaders |
| 7 | 19.35–24.4 | line 4 | aerial over the marsh; tilts down to the cleared field grid (20.9–22.6) | tracking behind |
| 8 | 24.4–29.0 | line 5 | following one crane down into the corn field | follow, then along the fence |
| 9 | 29.0–34.0 | line 6 | the board: 丹顶鹤 · 冬季清点, 1952 年冬, 33 只; notice 保护等级 易危 | near-still |
| 10 | 34.0–38.3 | line 7 | the 1952 print: 33 cranes, deep snow, tracks; corn spreads at 37.0 | locked |
| 11 | 38.3–41.7 | line 8 | peels at 39.3, 40.1, 40.8; each print gets its red a beat later, a hair off register | locked |
| 12 | 41.7–46.1 | line 9 | 2025 年 1 月 and 1,927 只 cut into the right column (42.0–44.1) | near-still |
| 13 | 46.1–51.8 | line 10 | 易危 struck at 48.0; the seal 近危 2026.3 and 已移出濒危 at 48.95, one frame of shake | near-still |
| 14 | 51.8–56.8 | line 11 | a quick turn off the board to a pair dancing; crane up to the opening direction | rise and pull back |
| 15 | 56.8–60.0 | — | end card cut into the day sky | still |

## Narration

The voice reads one line per cue; Chinese and English start at the same moments, and the subtitle bar (and `printed-long-take.srt`) shows both lines.

| # | Chinese | English |
|---|---|---|
| 1 | 这么冷的清晨，河水却没有结冰，还升腾着阵阵白汽。 | On a morning this cold, the river still hasn’t frozen; it breathes white steam. |
| 2 | 这里是北海道东部的湿地。 | This is a wetland in eastern Hokkaido. |
| 3 | 站在河水里安静睡觉的，是丹顶鹤。 | Asleep, standing in the water: red-crowned cranes. |
| 4 | 早年间，随着湿地被一片片开垦，它们差点就彻底失去了家园。 | Long ago, as the wetlands were cleared field by field, they nearly lost their home for good. |
| 5 | 天亮后，它们成群飞去的地方，是一块专门撒满玉米的田地。 | At daybreak they fly in flocks to a field scattered with corn, just for them. |
| 6 | 回想一九五二年冬天，整个北海道，一共只找到了三十三只丹顶鹤。 | Think back to the winter of 1952: in all of Hokkaido, only 33 cranes were found. |
| 7 | 也是从那一年起，当地人决定在冬天给它们投喂食物。 | That was the year local people decided to feed them through the winter. |
| 8 | 就这样，丹顶鹤的数量，一年比一年多。 | And so, year after year, there were more of them. |
| 9 | 到了二零二五年，已经数到了一千九百二十七只。 | By 2025 the count had reached 1,927. |
| 10 | 它们的保护级别，也终于从易危，降到了近危。 | Their status finally eased, from Vulnerable to Near Threatened. |
| 11 | 虽然不再算作濒危物种了，但这群雪地里的精灵，依然需要人们的守护。 | No longer counted as endangered, these spirits of the snow still need people to look after them. |

- English (the library demo): edge-tts `en-US-AvaNeural`, `+10%`; lines 1, 4, 5, 6 and 9 at `+25%`. In the spoken version only (`say` in `demo/lines_en.json`), line 1 drops "still", line 6 drops "Think back to", line 9 drops "had" and reads the number as "one thousand nine hundred twenty-seven", line 5 gets a pause after "daybreak".
- Chinese: edge-tts `zh-CN-XiaoxiaoNeural`, `+25%`.
- Line starts (s): 1.0, 5.4, 11.11, 19.6, 24.6, 29.2, 34.2, 38.5, 41.9, 46.3, 52.0 (`VO` in `demo/timeline.js`, before the bridge slow-down; `window.EV` and the subtitles carry them through it).

## Score structure

72 bpm in three, D dorian to D major, ducked about 17 dB under the voice (foley about 7 dB) and up again in the silent shots 3, 5, 6 and 15. Night: bowed vibraphone, a double bass pedal, glockenspiel under the title; harp on every beat from 5.5 s, slowing with the picture under the bridge. Dawn: the horn theme, hand chimes. Takeoff: timpani and string tremolo, cut by the steam. Air: pizzicato bass and xylophone in three. Prints: timpani and pizzicato strokes on the block thumps and the corn. Verdict: a held bass A1, the seal with a gran cassa, the theme in D major on horn, harp from 51.8 s, a long D major chord and three glockenspiel notes on the end card. Foley: the river under its ice edge, frost cracks, synthesised crane calls, splashes and wing beats, wind, snow crunches, pecking, knife cuts, block thumps, a torn sheet, the seal. Mix before the master: −16.0 LUFS, true peak −2.1 dBFS, 60.00 s.

## Palette & props

Ink `#16171b`, paper `#ede5cd`, red `#c4332b` only on crowns (each with a thin paper ring, never under 5 px by day), yellow `#dfa443` for the sun, its light and the corn. Props: the volcano row (an even cone, a broad massif with a crater rim, a small cone), the windbreak grid, rimed alders and willows, a stone pier with a cast-iron plate, a dial thermometer, snow and icicles; a fenced feeding field with huts, corn, crane tracks and fence shadows; a plank board in two columns (1952 | 2025) over a pasted status notice, Chinese and numbers only, with a square seal. Cranes: 16 silhouette poses; distant ones drawn up to 3× larger.

## End card

Cut into the day sky as an ink plate over the still wide shot, upper right and at least 5% inside the frame: 三十三只 / Thirty-Three Cranes / LemoLab × Claude Opus 5.5, from 56.8 to 60.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/printed-long-take/demo/build.sh` makes `printed-long-take.mp4` with the English narration; `sh styles/printed-long-take/demo/build.sh zh` makes `printed-long-take-zh.mp4` with the Chinese one. Steps: font subset (`tools/subset.py`, Noto Serif SC 700 from github.com/google/fonts), narration with edge-tts into `voice/<lang>/` and `asr_check.py`, `events.mjs`, `audio.py [zh]` → `mix.wav`, `video.mjs`, `mux.sh`, `tools/srt.py` → `printed-long-take.srt`, `readcheck.mjs`, poster and style frame at 15.4 s.
- Files: `index.html` → `scene.js` (renderer, print pass with the subtitle bar, flocks, cameras, sky state, the bridge slow-down `WARP`, `window.TEXTS`, `window.EV`), `timeline.js` (every time and `VO`), `world.js` (terrain, river, volcanoes, trees, bridge and pier, field, `Flock`), `look.js` (materials), `textures.js` (atlases), `props.js` (plate, dial, board, sky type), `audio.py` (narration, score, foley, ducking), `lines_zh.json`, `lines_en.json`, `voice/*/dur.json`, `FACTS.md`, `CREDITS`.
- The subtitle bar is timed on the Chinese reading (`voice/zh/dur.json`) in both versions; English lines finish inside the same cues. Its band is 62% ink here, over a mostly dark picture; STYLE.md asks about 80% for pictures with more paper.
- Rendered at 30 fps (`FPS=30` in `build.sh`), the style's output rate; the print pass's 12 Hz flicker is in `printMat` (`tf`), not tied to it.
- `readcheck.mjs` passes on every word in the world (17 pieces). The subtitle bar follows the speech and is left out by its contract; `?subs=1` reports it too.
- `?atlas=crane|tree|mist|sun` shows an atlas; `?cam=x,y,z,tx,ty,tz` overrides the camera to check a frame.
- Demo-specific pitfalls: the plate and the board must stay fully in frame through their holds; trees are cleared along the camera path (`clearPath`) so the low glide never passes through a crown; the print shot renders two passes during each peel; any time after 10 s written in `timeline.js` is on the timeline before the bridge slow-down.
