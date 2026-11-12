# Double Exposure — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Mountains and Seas* 《山海》 (50.5 s) · `double-exposure.mp4` · source in [`demo/`](demo/)

As night falls, from the mountains to the sea: a stag on a ridge, a wolf in a misty forest, an eagle above the clouds, a salmon in a river, a whale over the night sea. Each animal carries its own place inside its silhouette; at the end the whale settles on the horizon and the harbour inside it lands on the real shore. No people are drawn, nothing has to be explained. Six English lines (Kokoro `af_heart`), Chinese and English subtitles. The photographs and silhouettes are CC0 or public domain ([`demo/CREDITS`](demo/CREDITS)); skies, mist, water, lamps and everything else are drawn in code. No AI-generated images.

## Story & structure

Logline: every animal carries a place inside it; where the sea ends, that place is home.

Arc: a relay down the land, from ridge to sea, and in time from dusk to night. Each hand-over between animals is a different transition, and each animal brings a native move the film has not used yet, so the medium goes further every time; the last leg changes no animal but brings inside and outside into register.

| Leg | Native move spent here | Hand-over to the next |
|---|---|---|
| Stag | *develop the second exposure*: the dark shape, a shutter click, the misty forest printing into it from the hooves up | *through the window*: push into the chest until the outline leaves the frame |
| Wolf | *lamps inside* and a pull-out reveal: cabins light in the forest, the camera pulls back and the forest is inside a howling wolf (in through a stag, out through a wolf) | whip upwards |
| Eagle | *the window* while tracking: the snow peaks inside the wings slide slower than the bird; three wing beats, a bank | dive into the lens, screen dissolve into the river |
| Salmon | the place inside flows: river bed and weeds fastest, silt in the middle, the river town inside the fish slowest; its lamps light head to tail | *superimpose, don't morph*: the fish grows to the whale's length and the whole humpback fades in over it, the town and the harbour screen-blended |
| Whale | *cross the surface*: one arc out of the water while the camera rises through the waterline; then the city inside lights tail to head | same shot |
| Home | *register*: the whale settles on the horizon, the harbour's waterline slides onto the real sea line, the outline loosens to a veil and a warm line | title and credit develop in the night sky |

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–5.9 | High-key dusk sky, low white sun, ridge grass; a red deer stag on the ridge, its antlers in the sky; inside, the misty forest | slow push 1.0 → 1.2, then from 3.7 a fast push into the chest (about ×9 at 5.6) | 0.3 click, forest develops 0.3–1.7; head lifts 1.2–2.4; first lamp 4.9 |
| — | 5.5–5.95 | Through the window: once the outline has left the frame, a 0.45 s dissolve to the wolf shot's first frame, the same forest at the same place | | the two mappings are interpolated so the hand-over frame is one picture |
| 2 | 5.5–14.4 | The forest inside the wolf; cabins light 5.8–8.0; a large pull-back 6.8–10.2 reveals the wolf, foreground spruce sweeping the bottom edge; the moon | from ×3.2 tilted inside the wolf to wide and level | howl 12.5, the moon's halo flares, every lamp flickers |
| — | 13.9–14.4 | Whip up | vertical motion blur | |
| 3 | 14.3–22.0 | A golden eagle gliding right to left; the snow peaks inside the wings slide past slower; cloud layers in two directions; near snowfall; cabins in the peaks light 15.6–17.4 | tracking, banking with the bird; push in and back out 15.9–19.4 (up to ×1.2) | wing beats 15.2, 16.9, 18.6; a hard bank 19.3–20.4; dive into the lens from 20.6 |
| — | 21.3–22.1 | The wings fill the frame; snow peaks and the river from below screen-blended for about 0.4 s | | |
| 4 | 21.6–29.6 | Underwater, side-on: grey water, the bright surface band and light shafts, river-bed pebbles and weeds, silt; a salmon heading right, a river town at dusk inside it | slow track right | town lamps light head to tail 23.0–25.0; carangiform swimming, a glide and push twice per beat |
| — | 27.0–29.6 | The river bed sinks into deep sea; the fish grows to the whale's length, the whole humpback fades in over it, town and harbour screen-blended; the beat slows from 1.1 Hz to 0.3 Hz | pull back | |
| 5 | 29.6–33.0 | The whale lifts its head, strokes harder and rises on an arc; the waterline band sweeps down the frame 30.0–31.8; at 31.05 the surface bulges under it and 170 drops spray up and fall back | one continuous rise through the surface | upper half moonlit sea, lower half underwater, refraction at the line |
| 5′ | 31.35–39.0 | The humpback gliding over the night sea under the moon, the harbour inside it; waves, a moon path, the broken reflection | rise along the waves with a levelling roll, slow push | the city lights tail to head 33.6–35.2, warm light spreads on the water |
| 6 | 39.0–50.5 | The whale settles towards the horizon; the harbour's waterline slides onto the sea line (39.0–42.4, the last pixels slowest); the outline loosens to a faint veil (42.4–44.4), the harbour continuing outside it, a warm outline held to the end | locked, then a very slow push | title 45.6, credit 46.0, held to 50.5 |

No hard cuts and no white flashes.

## Voice and subtitles

Six English lines, one per leg, 46 words, wide gaps; the superimposition and the end card are wordless. Kokoro `af_heart`, speed 0.78, each clip checked with `asr_check.py` (`harbour` carries an `asr` spelling). Subtitles bottom left (the wolf's line bottom right, clear of the wolf), each held at least 0.6 s past its line.

| # | Time | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.7–4.4 | Every animal carries a place inside it. | 每只动物，身体里都装着一个地方。 |
| 2 | 9.5–13.2 | The wolf, a forest with its lamps lit. | 狼装着一片森林，林里的灯都亮着。 |
| 3 | 15.9–19.5 | The eagle, the snow above the clouds. | 鹰装着云层之上的雪。 |
| 4 | 23.5–27.2 | The salmon, the river that runs to the sea. | 鲑鱼装着一条流向大海的河。 |
| 5 | 34.1–37.3 | The whale, a harbour full of light. | 鲸装着一座灯火通明的港湾。 |
| 6 | 41.9–45.6 | And where the sea ends, that place is home. | 海的尽头，那个地方就是家。 |

The page draws the subtitles (`SUBS` in `index.html`); `double-exposure.srt` comes from `demo/vo/cues.json`.

## Score structure

D minor strings throughout (cello, double bass, viola, violins), one harmonic colour per animal: stag Dm, wolf Dm (synthesised howl), eagle B♭ → Gm (horn), salmon F (pizzicato and harp, low-passed underwater, low clarinet), whale F → Dm(add9) (bowed vibraphone), home a D major chord (Picardy third) held under the title and faded at the end. Each lamp is a harp or glockenspiel note with a small tick; the develop and the register each get a shutter click; whip and dive a riser and drums; the breach a wave, bass drum and a whoosh through the surface. Wind, water and sea beds hand over with the legs. Voice compressed, about 10 dB over the music by RMS, the music ducking 5 dB at 300 Hz–4 kHz. Mix about −16 LUFS, master −14 LUFS at the mux.

## Palette & props

- Photographs (all monochrome in the film): misty conifer forest (stag, wolf), monochrome snow peaks (eagle), a river town lit at dusk, Dinan, France (salmon), a city skyline over water at night (whale, and the shore after register), Icelandic waves (the night sea).
- Silhouettes: red deer stag, howling wolf, golden eagle, Atlantic salmon, humpback whale (PhyloPic).
- In code: sky, sun, moon, clouds, mist, far hills, ridge grass, spruce, snowfall, the water surface, light shafts, silt, river bed, weeds, bubbles, spray, every lamp, reflections.
- The salmon's front 30 % is darkened and unlit, with a faint dark eye, so the town's bright windows never sit on the head; fins and tail are darkened through the blurred mask; the town photograph sits so its lit band crosses the middle of the body.
- Lamp colour rgb(255,161,82) glow, rgb(255,219,158) core; title rgb(245,230,204).

## End card

On the night sky over the shore in register: the vertical Chinese title 山海 on the right; top left the English title *Mountains and Seas* (58 px italic), the style name (Double Exposure 30 px, 双重曝光 34 px), a thin rule, and `LemoLab × Claude Opus 5.5` (32 px). All develop from blur to sharp like a print and take the grade, vignette and grain; the credit is fully sharp for 3.8 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `demo/index.html`: the whole film as `window.render(t)`, a pure function of time; five scene shaders (stag, wolf, eagle, salmon/superimposition, whale/register) and the composite; timeline constants (`T_AB0`… `T_CRED`), cameras (`camA`, `cam1`, `cam2`, `camD`, `cam3`), the breach arc (`whaleScreen`, `keys`), `SUBS`, `TEXTS` for readcheck.
- `demo/audio.py`: score, foley and voice mix → `demo/out/mix.wav` (`core/audio/sampler.py`, `core/audio/sfx.py`).
- `demo/vo/`: `lines.json` (script), `cues.json` (subtitles), `dur.json`, `words.json`; the clips `v1.wav`… `v6.wav` are local.
- `demo/fetch_assets.py` with `demo/sources/photos.jsonl` and `demo/sources/silhouettes.jsonl`: fetches the photographs (Wikimedia Commons, 2560 px wide) and silhouettes (PhyloPic) into `demo/assets/` when missing. `demo/make_fonts.py` subsets Noto Serif SC 600 to the characters in `index.html`.
- `sh styles/double-exposure/demo/build.sh` from the library root: assets and fonts if missing, voice if missing (`VOICE=1` to regenerate) and the speech check, picture (`WORKERS`, default 2), mix, master, subtitles, readcheck, poster and style frame (38.5 s). On a fresh clone first run `sh tools/fetch.sh voice` and `sh tools/fetch.sh instruments` for `vsco2ce`, `vcsl` and `salamander`.
- A single frame: `node core/render/still.mjs styles/double-exposure/demo <seconds>`.
- About 30–70 ms a frame at 1080p; 1,515 frames.
- Checks at the last render: 50.5 s; about −14 LUFS, true peak −1.6 dBTP; no black frames; every voice line transcribes correctly; readcheck passes on the title and credit.
