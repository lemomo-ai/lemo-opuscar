# Circuit Board — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Seven Milliseconds · 七毫秒* (60 s, Chinese voice-over, bilingual subtitles) · `circuit-board.mp4` · source in [`demo/`](demo/)

## Story & structure

Power made deep in the mountains of Sichuan reaches Jiangsu, 2,000 km away, in seven milliseconds. A Chinese voice (edge-tts Xiaoxiao, +20%) tells it as a friend would: household power swings back and forth (alternating current); sent that far it would be lost on the way; so a converter station turns it into one-way direct current; it races 2,080 km in 7 ms; at the other end it is turned back, stepped down level by level and sent to a wall socket; inside a phone charger a tiny bridge rectifier does the same job as the giant in the converter station, on the same circuit principle, with 400 million times less power. Every line has a subtitle (Chinese over English, bottom safe area); the board itself only prints the voice's key words and numbers (交流电 / AC, 损耗 / LOSS, 换流站, 直流电, 2,080 公里, 7 毫秒, 降压, 充电器, 整流桥, 同一个电路原理, 功率差 4 亿倍). Facts: [`demo/FACTS.md`](demo/FACTS.md).

Native moves spent: flow becomes current (dam), pulse-path explainer (the whole film), AC vs DC told by the shape of the light (bus close-up, loss board, Butuo), the map is a board (corridor), matched step-down (four cuts), plunge through a hole (socket → charger), detail callout (verdict), nested boards (closing pull-out).

## Shots

| # | Time | Voice (first words) | Shot | Camera | Note |
|---|---|---|---|---|---|
| 1 | 0–4.7 | 四川深山里发出来的电… | Baihetan: water through 16 penstocks, generators light on 16ths; title 七毫秒 / SEVEN MILLISECONDS top right | macro on G1 at frame 0, pull-out ×10 by 2.0 s, hold | flow becomes current |
| 2 | 4.7–10.1 | 平时我们家里用的电… | the right-bank bus close up: big AC dashes swinging slowly back and forth; 交流电 / AC with a silk sine | push in, hold | the swing slowed to ~0.55 Hz |
| 3 | 10.1–14.4 | 如果直接送去太远的地方… | a long straight board: AC dashes move on, dimmer, thinner and fewer; 损耗 / LOSS | slow pan right | stand-alone board |
| 4 | 14.4–19.1 | 所以，电得先进一趟换流站… | Butuo: AC in, the bridge conducts at 16.3, two DC streams out; 交流电, 换流站, 直流电 | slow push, whip east at 18.75 | |
| 5 | 19.1–23.5 | 然后再顺着这根两千多公里长的电线… | the corridor: rides the DC head, rises until both ends are in frame; 四川 / 江苏 large, 2,080 公里 | ride → rise → crash zoom at 23.0 | main line ≥ 6.5 px wide at map scale |
| 6 | 23.5–29.6 | 全程只要七毫秒… / 到了终点站… | Yucheng: 7 毫秒 / 7 ms tag; at 27.4 AC leaves (交流电 / AC) | locked | reading hold |
| 7 | 29.6–32.4 | …再把电压一级一级降下来… | four step-down transformers T1–T4 at one screen size, 0.7 s each; 降压 / STEP DOWN stays in the same place | matched cuts | |
| 8 | 32.4–34.6 | …最终送进你家墙上的插座里。 | the block flashes by; the socket wall (switch, two sockets, L/N/PE wiring); plunge into the live hole | pan, hold, plunge | |
| 9 | 34.6–42.1 | 而当你插上手机充电器时… | out of the charger's pin: the whole charger (plug, fuse, bridge, capacitor, transformer, USB-C), 充电器 / CHARGER; push in to the bridge: 整流桥, 交流 → 直流 | reverse out, hold, push | |
| 10 | 42.1–52.9 | 说出来你可能不信… / 只不过… | detail callout: Butuo's bridge beside DB1 at the same size; 换流站; "=" and 同一个电路原理 at 47.6; 功率差 4 亿倍 at 49.4 | locked | verdict held 5.4 s before "=" |
| 11 | 52.9–54.5 | 你手机里的每一格电… | one pull-out from the charger to the whole board, the main line glowing | log zoom | |
| 12 | 54.5–60 | — | the whole board on a desk, noon window light; title block: 七毫秒 / SEVEN MILLISECONDS, LemoLab × Claude Opus 5.5 | slow push, 2° turn | end card |

## Voice-over

Chinese voice, edge-tts `zh-CN-XiaoxiaoNeural` at +20% (`demo/voice/lines.json`); each line starts at the time below, and its subtitle (Chinese over English) comes and goes with it. The English version (`sh demo/build.sh en`) speaks the English subtitle lines with `en-US-AvaNeural` at +10% (a few lines faster, up to +25%), starting at the same moments (`demo/voice_en/lines.json`; where a spoken line is shorter than its subtitle, the `say` field holds what is spoken).

| # | Start | Chinese | English |
|---|---|---|---|
| 1 | 0.40 s | 四川深山里发出来的电，仅仅七毫秒后，就到了两千公里外的江苏。 | Power made deep in the mountains of Sichuan reaches Jiangsu, 2,000 km away, in just 7 milliseconds. |
| 2 | 5.58 s | 平时我们家里用的电，电流是来回摆动着走的，叫做交流电。 | The electricity in our homes swings back and forth as it flows. It's called alternating current, AC. |
| 3 | 10.22 s | 如果直接送去太远的地方，在路上就会白白损耗掉很多。 | Sent that far as it is, a lot of it would simply be lost on the way. |
| 4 | 14.55 s | 所以，电得先进一趟换流站，变成只朝一个方向跑的直流电。 | So first it goes through a converter station and becomes direct current, DC, flowing one way only. |
| 5 | 19.24 s | 然后再顺着这根两千多公里长的电线，一路狂奔到江苏。 | Then it races along this line, more than 2,000 km long, all the way to Jiangsu. |
| 6 | 23.53 s | 全程只要七毫秒，连眨一下眼睛的时间都不到。 | The whole trip takes 7 milliseconds, less than the blink of an eye. |
| 7 | 27.15 s | 到了终点站，它会被重新变回交流电，再把电压一级一级降下来，最终送进你家墙上的插座里。 | At the end it's turned back into AC, stepped down level by level, and sent to the socket in your wall. |
| 8 | 34.20 s | 而当你插上手机充电器时，充电头里其实也藏着一个叫整流桥的小零件，正在把交流电重新变回直流电。 | Plug in your phone charger, and inside it a tiny part called a bridge rectifier turns the AC back into DC. |
| 9 | 42.24 s | 说出来你可能不信，它和换流站里那个几层楼高的大家伙，用的是同一个电路原理。 | Believe it or not, it works on the same circuit principle as the giant, storeys tall, in the converter station. |
| 10 | 48.39 s | 只不过，换流站那边的功率，是这个小充电头的整整四亿倍。 | Only the station's power is a full 400 million times that of this little charger. |
| 11 | 53.05 s | 你手机里的每一格电，都是跨越千山万水，这么跑过来的。 | Every bar of charge on your phone came this far, across mountains and rivers. |

## Score structure

Voice first: the bed (music and room tone) is ducked 9.5 dB under each line and sits about 17 dB under the voice; effects drop 7 dB. 100 BPM, G (the mains hum on G1). AC is a gated tone (slowed to 1.1 Hz while the voice explains it, dying away over the loss board); at Butuo (16.3) the gate smooths into a steady tone, the kick, ticks and bass enter, an arpeggio climbs through the ride with a glockenspiel at each 500 km pad; impact at 23.0, a bell for 7 ms, AC again at 27.4, four relays one step lower each, cicadas and an air-conditioner drone at the socket, suction and a pop through the hole; in the charger a faint whine, a high gated tone that smooths at the bridge (39.4); in the verdict a low tone (the station) under the high one, a clean G major chord on "=". Pull-out whoosh and pad, the last hit at 54.8, the hum to the end. −16.0 LUFS integrated, −4.5 dBTP.

## Palette & props

Mask greens #05190F / #1C6A44 / #4AA977, gold #D9B25B, bare-copper dam bar #C9784A, silk #F2EEE1, current amber (255,190,84), water silver (170,214,226). Props: the dam with 16 penstocks and generators (a step-up coil on every lead), connector J2; the bridge footprint (a diamond package with four diode symbols and a pad at each vertex: AC in at the left, return via at the right, + top, − bottom), converter transformers, AC filter banks, smoothing reactors, valve-hall courtyards; the corridor geography (octilinear Yangtze with five tributaries, four lakes, the east coast, the board's south-east corner cut at 45° over open sea so its edge stays clear of Taiwan, real cities as test points, three more unlit ±800 kV lines); the loss board (one long bus, a ruler, test points); a city module (streets as channels, buildings as pad grids); a street module (a block of 18 floors as a lit pad array, pole transformer, a socket wall with a switch and a second socket, L/N/PE wiring, a sun and a clock at noon); the charger (plug blades, L/N pads, F1, RV1, CX1, DB1, C1, T1 over an isolation slot, CY1, U1, U2, C2, USB-C).

## End card

The board's own title block, top right of the corridor board, plotted at 54.8: 七毫秒 (≈ 75 px) / SEVEN MILLISECONDS; at 56.0 the row LemoLab × Claude Opus 5.5 (≈ 25 px caps); REV A / SHEET 1 OF 1 in its corner. No voice after 57.0; held to 60.0 under the window light. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- One command: `sh styles/circuit-board/demo/build.sh` (Chinese voice → `circuit-board.mp4`) or `sh styles/circuit-board/demo/build.sh en` (English voice → `circuit-board-en.mp4`). It cuts the subtitle font, voices and checks every line, exports the events, scores and mixes, renders, masters, writes `circuit-board.srt`, runs the reading-time check and renders the poster and gallery still without the subtitle bar.
- Which files in `src/` are reusable and which are this film's content, and the world-module and scene interfaces: [`STYLE.md`](STYLE.md) §10.
- Files in `demo/`: `index.html`; `src/main.js` (timeline: cameras, scenes, subtitles, sound events), `src/world.js` (corridor board, 1 unit ≈ 1 km), `src/city.js` (10 m), `src/house.js` (10 cm), `src/charger.js` (mm), `src/loss.js` (the loss board), `src/levels.js` (nesting), `src/render.js`, `src/post.js`, `src/parts.js`, `src/geo.js`, `src/font.js`, `src/hanzi.js`, `src/palette.js`; `voice/` and `voice_en/` (`lines.json`, `dur.json`), `data/subs_en.json` (English subtitles); `audio.py` → `mix.wav` / `mix_en.wav`; `tools/subset.py` (subtitle font), `tools/srt.py` (subtitles file), `tools/sheet.sh` (0.5 s contact sheet into `out/`).
- Reading time: `window.TEXTS(t)` reports every word printed on the boards and `readcheck.mjs` passes on all of them. The subtitle bar follows the voice (about 5.6 characters a second), so it is reported only with `--q subs=1`. `?nosub=1` renders without subtitles.
- The page always draws at 1920×1080 and is scaled by CSS, so stills at other sizes keep the framing. 1080p frames take 30–75 ms, about 180–270 ms in the pull-out (several nested boards plus motion-blur sub-frames).
- Demo-specific pitfalls: the sending station is reported both as 布拖换流站 and 白鹤滩换流站 (the voice and screen only say 换流站); the dam complex is drawn about 50× its map scale, so the river's first reach is schematic; the AC bus and the DC pair cross the river (a trace may cross a bare channel); the four step-down cuts use one on-screen symbol size (300 px), so each transformer's world size follows from its cut's zoom, and the 降压 label sits at the same screen place in all four so it reads as one; keep picture text above the subtitle band.
