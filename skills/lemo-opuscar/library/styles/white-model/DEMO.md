# Projection-Mapped Model — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *How a Flattened City Grew Back* 《被炸平的城市怎样长回来》 (40.0 s) · `white-model.mp4` · source in [`demo/`](demo/)

Rotterdam's centre as a 1:1000 white model (2.3 × 2.6 km: 3,887 buildings, 8,860 roof parts, 108 bridge decks). Chinese on screen, English narration, bilingual subtitles (Chinese line above, English line below). This is an unofficial film made from open data (3DBAG, Kadaster BAG, BGT); 3DGI, TU Delft, Kadaster and the City of Rotterdam did not make or endorse it.

## Story & structure

Logline: light picks out everything on the model built before 1940 and finds a hole in the middle; decade by decade the hole fills and the city climbs; then the tallest new tower's midwinter-noon shadow runs 777 m across sixteen roofs, nine of them pre-war.

Arc: the white model under gallery light → lights out, the lamp strikes, the pre-war layer (23 % of the footprint) and the hole → 14 May 1940, 13:27; the city hall that came through almost undamaged → four post-war layers pop on, faster each time, a year counter rolling 1940 → 2025; the city crosses the river (Kop van Zuid) → a level of light climbs every facade and tops out on Zalmhaven I (roof 203 m); 24 of the 25 buildings over 100 m are post-1990 → the projector goes dark (silence) → the winter sun at solar noon (14.6°), the tower's shadow traced and measured (777 m), the sixteen roofs inside it light up, the nine pre-war ones in the first layer's amber → house lights up, white model, end card.

Native moves spent: *lights out, lamp on* at 1.8–2.4 s; *the hole* for 1940; *layers by time* for the growth; *the rising level* for heights; *the sun clock* plus a projected shadow trace and a range line as the signature; *the pick-out* for the roofs; *lights up* as the bookend.

Every number on screen is computed by `demo/tools/prep.py` into `demo/data/stats.json`; every claim and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Shots

One continuous take. Camera = target, azimuth (0 = south of the target looking north, 90 = east), elevation, distance in model metres.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.8 | white roofs at rooftop height, shallow focus, gallery light, AO | macro glide from the north-east (az 152 → 142, el 7 → 11, d 0.55 → 0.72) | the model as an object |
| 2 | 1.8–2.4 | house lights cut (0.25 s), darkness | glide continues | relay; silence of the room |
| 3 | 2.4–6.0 | the lamp strikes with a flicker; an amber wash spreads from the projector axis over every pre-1940 building | crane up and back (el 11 → 36, d 0.72 → 1.85) | the hole appears as the camera rises; readout 23 % |
| 4 | 6.0–11.6 | 14 May 1940 stamp in the hole (6.0), the city hall pinned (7.8) | slow push and orbit (az 128 → 104, d 1.85 → 1.62) | short suck-out before the date hit |
| 5 | 11.6–17.1 | four post-war layers switch on building by building (1.0 / 0.9 / 0.9 / 0.75 s spreads), year counter, legend rows; Kop van Zuid pinned at 14.6 | orbit to the south-east with a rise (az 104 → 52, d 1.62 → 2.75) | acceleration by spread, not by tempo |
| 6 | 18.0–21.6 | a soft level of light climbs every facade (heights ramp, 25 m rings), the reading rides up Zalmhaven I to 203 m | boom down to a low angle (el 36 → 17, d 1.95) | towers against black |
| 7 | 21.6–22.8 | projector dark | drift | silence |
| 8 | 22.8–27.0 | winter sun at the real azimuth, clock 10:55 → 12:40 (solar noon), data put away, shade projected blue | rise and turn (az 34 → 28, el 24) | first sound after the silence: brass in A♭ |
| 9 | 27.0–35.4 | the tower's noon shadow traced (fill + edge) as a range line grows 0 → 777 m with 100 m ticks; 16 roofs ping on (29.4–31.2), 9 amber | side-on from the south-east, closing in (az 40 → 32, d 1.6 → 1.16) | **signature**: poster at 30.4 s |
| 10 | 35.4–40.0 | house lights up, data off, end card | pull back and rise (d 1.3 → 2.85, el 35 → 44) | bookend |

## Score structure

100 BPM, 4/4; every layer onset, the date, the top of the climb, the sun, the line landing, the roofs and the lights sit on a beat (`demo/tools/cuecheck.py`: 0 ms on 19 cues).

| Section | Time | Palette | Notes |
|---|---|---|---|
| White | 0–1.8 | bowed vibraphone G4/C5, room tone, idle projector fan | |
| Lamp | 1.8–6.0 | relay, lamp strike, wash air swell; contrabass C2 + cellos G2, bowed vibraphone E♭5, a quiet marimba pulse in 8ths | suck-out 5.55–6.0 |
| Date | 6.0 | timpani C3, gran cassa, gong, bass drum, low brass stab in C minor (tuba, trombones, horns) + a 60–120 Hz punch | loudest moment of the film |
| Aftermath | 6.0–12.0 | contrabass C2, cellos E♭3, bowed vibraphone A♭4 → G4, sparse vibraphone; glass tick on the city-hall pin | |
| Growth | 12.0–18.0 | E♭ major; bass climbs E♭–F–G–A♭ one step per layer; marimba 8ths → 16ths → 16th-note triplets, pizzicato violins from layer 2, hand-chime chord per layer, horns swell from the river crossing; a soft tick per building switching on | |
| Height | 18.0–21.6 | A♭: contrabass A♭1, bowed vibraphone C5/E♭5, glockenspiel + vibraphone line climbing with the level, air riser; tubular bell E♭5 + cymbal on the top | |
| Silence | 21.6–22.8 | thin fan hum only | |
| Sun | 22.8–27.0 | horns A♭3/C4/E♭4, trombones A♭2/E♭3, tuba A♭1, timpani, gran cassa, bowed cymbal; organ (soft) and bowed vibraphone hold | second-loudest moment |
| Shadow | 27.0–31.2 | F minor floor (contrabass, cellos, soft organ), timpani heartbeat every two beats, a click per 100 m, timpani + bell when the line lands; one glass note per roof (G5 pre-war, C6 newer) | |
| Coda / lights | 31.2–40.0 | D♭ → E♭ held; at the lights a C major chord (horns, bowed vibraphone), relays, fan settling; tubular bell C5 and two glass notes on the end card | |

Mix (`demo/mix.py`): music balanced to sit 10 dB under the voice while it speaks and ducked 40 %; hits ducked 20 %, uncompressed; bus compression on music, foley and beds only; a 38 Hz high-pass (46 Hz, 4th order on hits) and a −5 dB shelf below 62 Hz on everything but the voice; master at −14.4 LUFS with a true-peak limiter at −4.6 dBTP; `mux.sh` measures the film at −13.8 LUFS, LRA 6.1 LU. `demo/tools/impactcheck.py`: the date is the loudest momentary moment, the sun −0.7 dB under it; each follows a dip of −20 and −28 dB; the silence sits 16 dB under the median program.

## Palette & props

- Model #F3F3F1 (roughness 0.88), plate water inlay (0.10, 0.13, 0.17) satin, plinth #17181A; room background a dark radial gradient.
- Layers: pre-1940 #FFA13D; 1940–64 #2A46FF; 1965–89 #2F98FF; 1990–2009 #6FDCFF; 2010–25 #E6FBFF; height ramp #1A1440 → #5A35D6 → #E2509A → #FFE7C4; projected shade #1C2C66; sun #FFD9AD; shadow trace fill (0.10, 0.22, 0.65) with a pale edge; newer shaded roofs #BFF3FF.
- Props: the model (3DBAG LOD1.3, BAG construction years), BGT water and bridge decks, the 2 m heightfield noon shadow of Zalmhaven I, the sun table for 21 Dec 2025 at 51.914° N, 4.484° E.
- Narrator: Kokoro `bm_george`, speeds 0.95–1.08.
- Real places and buildings appear as data; this is not an official film of the City of Rotterdam or of any building's owner.

## End card

Over the white model as the house lights return, a left block: 被炸平的城市怎样长回来 (Noto Sans SC 500, 64 px), *How a Flattened City Grew Back* (Inter Tight 200), an amber rule, `白模投影 · PROJECTION ON WHITE MODEL`, `3DBAG · BAG · BGT · 鹿特丹市档案馆`, the 3DBAG licence credit in fine print (3DGI and the 3D geoinformation research group, TU Delft, CC BY 4.0), `LemoLab × Claude Opus 5.5`. 35.7–40.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: data (if missing) → voice → speech check → cues → events → video → mix → master → .srt → checks → poster
  index.html     WebGL canvas + 2D overlay canvas, fonts
  main.js        render(t): camera keys, projection state per layer, overlay, window.EV, SUBCHECK
  studio.js      renderer, post, room, projection material (projLight / roofGlow), model mesh, plate, plinth, lights
  overlay.js     readouts, pins, range line, subtitle strip, end card, text registry for readcheck
  timeline.js    beats, layers, sun clock, narration (single source; tools/export.mjs → timeline.json, voice/lines.json, cues.json)
  mix.py         score, foley, beds, voice, mix → out/mix.wav + out/stems/
  tools/         prep.py (data → model, masks, stats), rd.py (RD ↔ WGS84), sun.py (solar position), fonts.py (CJK subset);
                 export.mjs (voice/cues); cuecheck.py, subcheck.mjs, motioncheck.py, impactcheck.py, finalasr.py (checks)
  data/          model.json, water.png, zshadow.png, stats.json (generated)
  assets/raw/    3DBAG and BGT downloads (gitignored)
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- `sh demo/build.sh` takes about 4 minutes on Apple silicon (picture ~60 s with 4 workers; TTS and the Whisper check most of the rest). `FETCH=1` re-downloads the data (~55 MB).
- Checks it runs: `asr_check.py` with `small.en` (British spellings "centre", "metres" set in the `asr` fields), cue grid, single-line subtitle widths with the real fonts (widest 618 px against 1500 px), `readcheck.mjs`, motion per second (no flat stretch; the jumps at 2.0, 2.6 and 35.6 s are the lights and the lamp), the impact ranking. `tools/finalasr.py` checks every narration line on the final mix.
- Demo-specific pitfalls: the 3DBAG WFS returns all LOD1.3 parts in one request at `count=20000` for this box (13,345 features); parts are kept only when fully inside the crop, which leaves a clean street margin at the plate edge. The heightfield shadow counts a roof as shaded when its tallest part's centroid cell is under the tower's shadow height (2 m grid); the 16 roofs are listed in `stats.json` with distances 262–734 m. Zalmhaven's 3DBAG roof (203.0 m above ground, 70th percentile of the highest part) matches the published roof height; the 12 m mast is not in the model. GTAO is faded out after the lamp strikes because it bands on the wide grazing views.
