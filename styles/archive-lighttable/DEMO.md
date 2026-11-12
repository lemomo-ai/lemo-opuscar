# Archive Light Table — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Two Seconds Short* 《差两秒》 (40.0 s) · `archive-lighttable.mp4` · source in [`demo/`](demo/)

The Wright brothers' flights of 17 December 1903 on a light table, told through five Library of Congress items: two glass negatives, a telegram, a newspaper clipping, and a third negative as a prop. It is an unofficial film about a real event, made only from public-domain scans. Chinese on screen, English narration, bilingual subtitles (Chinese line above, English below). Every fact and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: the telegram said the longest flight lasted 57 seconds, and the next day's paper printed it; the glass negatives and the Library's record say 59.

Arc: the claim (the table switches on; a loupe lands on Orville's telegram; inside the lens the lines light up and "57" lifts out as a reading) → the echo (the camera rises and glides to the Dayton Herald clipping, where the same sentence is underlined and its 57 ringed) → the evidence, which is also the emotional peak (the loupe lands on the first-flight negative, the negative turns positive inside the lens, the camera falls through the lens into the photograph, and the Flyer separates from the horizon and drifts forward; 12 s, 120 ft) → the measurement (the fourth-flight negative: a ruler laid on the ground plane from the camera to the tiny machine on the horizon; 852 ft, 59 s) → the verdict (57 and 59 side by side, held still 2.7 s, then 57 is struck: "差 2 秒") → the ending (pull back to the whole table; every object's tag flies into one archive index; end card).

Native moves spent: *the line lights up* on the telegram and the clipping; *negative to positive under the loupe* and *into the photograph* for the first flight (the signature, at the peak); *measuring on the photograph* for the fourth flight; *two records, held side by side* for the verdict; *the table becomes the index* for the ending.

## Shots

One continuous camera over one table; framing changes by zoom and by passing through the loupe. Times in seconds.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.3 | the dark table flickers on (0.0, 0.17, 0.42, 0.55; steady at 0.67); the telegram fills two thirds of the frame, the clipping at the bottom edge | glide toward the telegram with a 4° roll that levels it | the starter clicks and hum are the first sounds |
| 2 | 1.3–2.0 | the loupe drops onto the telegram (scale 1.35 → 1, shadow tightening) | settles | glass clack on the beat |
| 3 | 2.0–3.3 | push into the lens: the rim passes the frame while the view inside widens to the whole message | zoom 0.31 → 1.5 | the date line lights at 2.67 |
| 4 | 3.3–9.3 | inside the telegram: "Success four flights …" lights at 4.0, "… longest 57 seconds …" at 7.33, each with an underline; the rest of the paper dims; 57 is ringed at 8.0 and a reading card "电报 · 最长一次 57 秒" draws out to the right | slow track along the lines, then a push onto 57 | reading |
| 5 | 9.3–11.3 | rise out of the lens; the loupe lifts at 10.33; the card stays on screen until 11.4 | zoom out and glide down-right | a ring stays on the telegram's 57 |
| 6 | 11.3–13.3 | the Dayton Herald clipping: "longest time in air was 57 seconds." lights and underlines at 12.0, its 57 ringed at 12.33; a caption plate "1903.12.18 / 代顿先驱报" held still on the right | push in with a 4° roll | the echo |
| 7 | 13.3–14.7 | glide to the first-flight negative; crop corners (the 16:9 frame the photograph will open to) | glide and settle | the loupe lands at 14.67 |
| 8 | 14.7–16.0 | inside the lens the negative; a develop front from the centre turns it positive (15.0–15.8); readout "×2.5 负像 → 正像" | hold | |
| 9 | 16.0–18.0 | **signature**: the rim grows past the frame while the view inside widens, under a riser and the strings; at 17.6 the sound is sucked out; at 18.0 we are inside the photograph | zoom 0.335 → 1.45; inside 0.84 → 0.56 px per scan px | no narration through the push; the full chord lands at 18.0 and the narrator starts at 18.35 |
| 10 | 18.0–22.7 | the photograph in depth: the Flyer (its own layer) drifts 125 px forward and up against the horizon; the sand swells under a dolly; wind over the dunes; labels "第一次飞行 / 12 秒 · 120 英尺 · 上午 10:35", "威尔伯·莱特", "快门：John T. Daniels" | dolly (0.55) + lateral shift (260, −140) about the Flyer's depth | near-silence from 21.3: wind only |
| 11 | 22.7–24.7 | rise out of the photograph; glide over the 14 December plate to the fourth-flight negative | zoom out, glide right | |
| 12 | 24.7–26.3 | the loupe lands; push in; the positive already shows (the viewer stays switched on) | zoom 0.31 → 1.45 | |
| 13 | 26.3–30.0 | the ruler: from the bottom edge (the camera, the start) to the machine on the horizon, ticks every 100 ft crowding into perspective, labels 100 / 200 / 400; the reading counts 852 ft (lands 28.67) and 59 s (lands 30.0); "落地点" ringed | push toward the machine (0.62 → 1.3) with a ground-plane dolly | ticks on every 100 ft |
| 14 | 30.0–33.3 | two caption cards: the telegram's own line (a crop of the scan) "57 秒", the record's wording "852 feet covered in 59 seconds." "59 秒"; held still 2.67 s; silence from 32.8 | locked | comparison held before the verdict |
| 15 | 33.3–35.9 | 57 struck in signal orange, "差 2 秒" | locked, then the rise begins under the cards at 35.0 | the strike lands on low D after the silence |
| 16 | 35.9–40.0 | pull back to the whole light table in its frame on the dark desk; five tags fly into "档案索引" (the two 57s struck); end card at 36.33 | zoom to 0.094, roll to level | scale reveal |

## Score structure

90 BPM, 4/4; every key action on a beat or half-beat (`demo/tools/cuecheck.mjs`), except the two breaths (17.6, 32.8), which sit just before their downbeats by design. B minor turning to D major.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Light | 0–2.7 | piano D5 with the light; hum and starter clicks | |
| Telegram | 2.7–10.7 | felt piano broken chords in eighths, Bm–G–D–A; a paper sweep and a glass ring on each lit line; cellos D3 and violas A3 enter under the 57 | |
| Clipping | 10.7–13.3 | the same broken chords, quieter (Bm, G) | an echo |
| First flight | 13.3–23.6 | D at the glide; strings swell from the develop (attack 1.6 s), piano climbs D4 → A5 in eighths and a noise riser rises through the push; everything is cut at 17.6; at 18.0 the full D chord (piano D2–A4, strings, contrabass D2, glass D6, a soft cymbal), then a falling line A4–F♯4–D4–E4–F♯4 | wind and surf replace the hum inside the photograph |
| Measure | 26.3–32.8 | piano eighths on an A-major pedal, getting slightly louder; cellos A3 and violas E4 underneath; ticks every 100 ft; glass A5 at 852, E6 at 59 | acceleration by density, not tempo |
| Verdict | 32.8–33.3 | silence (hum only) | |
|  | 33.3 | pen stroke, piano D2/D3/A3, glass D6, soft timpani D3 | |
| End | 35.7–40.0 | the theme in D (F♯4–A4–D5–C♯5–A4), ticks as index rows land; the final D chord with strings and bowed vibraphone at 36.33 | |

Mix (in `mix.py`): music about 11 dB under the voice before ducking, ducked a further ~5 dB while the narrator speaks; foley 9 dB under the voice, beds 24 dB under; a 38 Hz high-pass on everything but the voice; a master limiter keeps the peak-to-RMS ratio near 11.5 dB so `mux.sh` can reach −14 LUFS with true peak ≤ −1 dBTP.

## Palette & props

- Table #F7F9FB with a brushed-aluminium frame and a dark desk (#0E0F11); ink #15171A; signal orange #FF5A1F; caption plates rgba(14,15,17,0.74).
- Props (all Library of Congress, true scale, 5000 world units = 7 in): telegram (LC-USZ62-65459 / mcc.061), Dayton Herald clipping (LC-USZ62-70686), first-flight negative (LC-DIG-ppprs-00626), fourth-flight negative (LC-DIG-ppprs-00629), 14 December negative (LC-DIG-ppprs-00610).
- The loupe: 2.5×, lens radius 1000 world units (≈ 1.4 in).
- Narrator: Kokoro `bm_george`, speeds 0.92–1.0.

## End card

Over the pulled-back table, bottom left: 差两秒 (Noto Serif SC), *Two Seconds Short*, a signal-orange rule, `ARCHIVE LIGHT TABLE` 档案灯台, `LemoLab × Claude Opus 5.5`, and in fine print the licence credit for the Salamander piano samples (CC BY 3.0); the archive index on the right. 3.7 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh          one command: (FETCH) scans + textures + fonts → voice → speech check → cues → cue grid →
                    video → mix → master → .srt → subtitle widths → readcheck → poster + style frame
  index.html        two canvases (WebGL2 picture, 2D marks), fonts
  film.js           the table, camera keys, the three dives, the shader, every mark, readouts, index, end card, subtitles
  timeline.js       beats, key actions, narration, subtitle cues (single source; tools/export.mjs → out/timeline.json, out/cues.json)
  mix.py            score, foley, beds, voice, mix → out/mix.wav + out/stems/
  tools/            prep.py (masks, layers, fill), fonts.py, sru.py (LoC catalogue lookups), export.mjs,
                    cuecheck.mjs, subcheck.mjs
  sources/          the Library of Congress catalogue records (MARCXML) behind FACTS.md
  assets/           raw/ (downloads), tex/ (textures the page reads)
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- `sh demo/build.sh` takes about 4 minutes on Apple silicon (the picture renders in about 40 s with 4 workers; the master pass is the slowest step). From a clean clone it first fetches what git does not hold: the fonts from Google Fonts (`tools/fonts.py`), the Kokoro model and the salamander, vsco2ce and vcsl sample libraries (`tools/fetch.sh`), and about 100 MB of Library of Congress scans, which `tools/prep.py` turns into textures (about 25 s). `FETCH=1` forces the fonts and scans again.
- Checks it runs: `asr_check.py` with `small.en` (two lines carry an `asr` field: Whisper writes "17th, 1903" for the spoken date and hears "four flights" as "for flights"), the cue grid, subtitle single-line widths measured with the real fonts (widest 648 px against 1500 px), `readcheck.mjs`.
- Demo-specific pitfalls: loc.gov item pages sit behind a Cloudflare challenge, so the catalogue records come from the Library's SRU server (`lx2.loc.gov:210/lcdb`) and the files from `tile.loc.gov`; in the first-flight plate the sky can be unmixed exactly against a smooth membrane, but the sand cannot, so below the horizon only strong marks are cut (lower wing, skids, struts; a vertical-line filter catches thin struts) and the rest stays on the ground; the fourth-flight scan is low in contrast and gets its own levels in the positive; the clipping is a low-resolution copy, so the camera never pushes past about 0.66 zoom on it.
