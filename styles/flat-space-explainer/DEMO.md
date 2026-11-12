# Scale Zoom Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Long Way Down* 《一路往下缩》 (52.0 s) · `flat-space-explainer.mp4` · source in [`demo/`](demo/)

A little probe whose eye is a zoom lens takes us from the Milky Way down to a virus, six levels, one comparison per level. English narration, bilingual subtitles (Chinese line above, English line below); on-screen text in English with one Chinese line under the title.

## Story & structure

Logline: Orbi fires a dotted sight line at each next stop and dives through it; on your fingertip it is shown at its true size for the first time, then shrinks with us until it is the size of a virus.

Arc: the hook (a full-frame lens blinks and focuses; pull back to find who and where) → the galaxy (title, the first sight line locks on the Sun) → the Solar System (sunlight walks to Earth in dots, a clock runs to 8:20) → Earth (orbits at true scale, a tape measure, Earth as a basketball, a magnifier on the Space Station) → your hand (through the clouds onto a fingertip; the camera pulls back: Orbi is 2 cm, the size of a grape) → your blood (through the skin; a white blood cell turns to Orbi, Orbi jumps, the cell eats a bacterium instead) → a virus (into Orbi's own lens; Orbi sits on the virus and looks back) → the summary (the virus shrinks into the last stop of the scale ribbon, dots run from galaxy to virus, the ribbon fills, Orbi winks).

Orbi's size runs as one thread in the narration: drawn big so you can see it → its true size on your hand → it shrinks with us → now virus-sized.

Native moves spent: *the sight line* six times, each going further (aim, light, tape, aim at the skin, aim at the virus, the ribbon); *through the ring* into the Solar System; *true size, at last* on the hand; *inside the lens* for the virus; *the scale ribbon summary* at the end. Other transitions: a shape match (Earth's dot becomes Earth), clouds, concentric skin layers.

## Shots

Times in seconds on one timeline.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0–1.25 | full-frame lens: a glance, a blink, the barrel steps out to focus | extreme close-up, slight push | the hook |
| 2 | 1.25–2.9 | Orbi appears whole, the galaxy slides in from the right | log pull-back from rest, 2 % overshoot | three parallax layers |
| 3 | 2.5–4.8 | the title rises word by word; the scale ribbon draws on, the readout rolls to 185,000 light-years | locked | Orbi nods as each word lands |
| 4 | 4.4–7.5 | wind-up (squash, back, panels swept) → barrel out → recoil, the sight line fires at the Sun | slow push | sight line 1 |
| 5 | 7.3–10 | the ring locks on the Sun; Orbi's iris widens, it smiles, hops, blinks | push toward the ring | next-stop ring |
| 6 | 10–12 | the ring fills the frame, the galaxy blows past, the Solar System grows inside it; the title drops out | accelerating push | through the ring |
| 7 | 12–16.2 | the Sun at true size is a dot; sunlight walks to Earth in dots; a clock 0:00 → 8:20 | tracking the light while pulling out | sight line 2 (light) |
| 8 | 16.2–17 | Earth's dot grows into a disc | fast push | shape match |
| 9 | 17–25.9 | Earth and three orbits at true scale; a tape from the geostationary orbit to the ground; basketball seams on Earth; a magnifier on the Space Station: 400 km, "< 1 cm" on a basketball | settle, locked, inset | sight line 3 (tape); frame within frame |
| 10 | 25.9–27.3 | tape reeled in; a fall toward "You", cloud banks rush past | accelerating push + fly-through | the cut hides behind the thickest bank |
| 11 | 26.9–30.2 | a blue sky; Orbi lands on a pointing fingertip (close-up), then the pull-back shows the whole hand | follow the fall → wide pull-back | true size, at last |
| 12 | 30.2–33.6 | a "2 cm" bracket and a 2 cm grape side by side, held 30.5–33.0; Orbi looks at itself and smiles; a short sight line to the skin | locked | sight line 4 |
| 13 | 33.1–35 | push into the fingertip; skin layers open as circles | fast push + concentric iris | |
| 14 | 35–40.9 | red blood cells drift; a white blood cell chases a bacterium, turns to Orbi (Orbi jumps), then swallows the bacterium | slow push | sight line 5 finds a 0.1 µm virus |
| 15 | 40.9–42.2 | the camera dives into Orbi's lens; the virus is inside the glass | subjective push | inside the lens; near-silence |
| 16 | 42.2–45.8 | a virus, 0.1 µm; the edge of one hair fills the right side (80 µm wide); Orbi lands on the virus and looks back | slow push | |
| 17 | 45.8–52 | the virus shrinks into the ribbon's last stop; "28 powers of ten"; dots run through the six stops, the ribbon fills; Orbi hops and winks; end card from 49.1 | gather, locked | sight line 6; ribbon summary |

## Narration and subtitles

Kokoro `af_heart` (a warm, unhurried teacher), speeds 0.68–0.86, about 2.3–2.8 words per second. Every line passes `asr_check.py` (the `asr` fields in `demo/vo/lines.json` hold what the model hears for "Orbi" and a few spellings).

| Id | Time | English (voice) | Chinese (subtitle) |
|---|---|---|---|
| v1 | 2.4 | This is our galaxy. A hundred thousand light-years across. | 这是我们的银河系，宽约十万光年。 |
| v3 | 12.2 | The Sun's light takes more than eight minutes to reach the Earth. | 太阳的光，要走八分多钟才到地球。 |
| v4a | 17.6 | Shrink the Earth to a basketball, | 把地球缩成一个篮球， |
| v4b | 20.6 | and the Space Station flies less than a centimetre above it. | 空间站离它的表面还不到一厘米。 |
| v5a | 26.9 | We drew Orbi big, so you could see it. | 前面为了让你看清，Orbi 一直画得很大。 |
| v5b | 30.6 | This is its true size: about one grape. | 这才是它真实的大小：一颗葡萄那么大。 |
| v6a | 34.45 | Now Orbi shrinks with us, into your blood. | 接下来，Orbi 跟着我们一起缩小，钻进你的血里。 |
| v6b | 38.7 | Some cells here hunt. | 这里有些细胞，会捕猎。 |
| v7 | 41.05 | Now Orbi is virus-sized: a thousand times thinner than a hair. | 现在 Orbi 和病毒一样小：比一根头发细大约一千倍。 |
| v8 | 46.04 | From galaxy to virus: ten times smaller, twenty-eight times over. | 从银河到病毒，每次缩小十倍，一共缩了二十八次。 |

Numbers are spelled out in the voice text and written as digits in the subtitles. Each cue holds max(1.8 s, speech + 0.6 s); the shortest is 2.32 s.

## Score structure

96 BPM, a bar = 2.5 s, 21 bars; D major, D minor inside the body.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Galaxy | 0–10 | bowed vibraphone fifth; harp sweep up on the pull-back; pizzicato double bass, vibraphone Dmaj9, a pizzicato note per title word, xylophone run with the readout; shaker 16ths | the wind-up half-beat is silent; the lock: glockenspiel, triangle, timpani; an unresolved A sus4 |
| Dive | 10–12 | harp falling, suspended cymbal crescendo, timpani on arrival | |
| Solar System | 12–17 | bowed vibraphone Lydian pad; one glockenspiel note per step of the light, rising | hand chimes + triangle when the light lands |
| Earth | 17–25.9 | marimba walking 8ths, pizzicato bass, light shaker | glockenspiel accents on the seams and the inset |
| Clouds | 25.9–27.3 | the music thins: cymbal swell, harp falling | |
| Hand | 27.6–33.6 | nylon guitar arpeggios in G | vibraphone chord + three harp notes on "true size" |
| Blood | 33.6–40.9 | heartbeat; pizzicato cellos in D minor, a low bowed double bass | violin tremolo + timpani on "hunt", a falling xylophone flourish when Orbi jumps |
| Lens | 40.9–42.2 | glass harp rising, then near-silence under the voice | |
| Virus | 42.2–45.8 | hand chimes, sparse glockenspiel, a high bowed pad | |
| Finale | 45.8–52 | everything back; one glockenspiel note per stop, rising; harp run as the ribbon fills; D major tutti at 49.15 | a bowed pad and two bells let it ring out to 52 s |

Mix (in `mix.py`): voice compressed, music ducked ~10 dB under the voice and dipped 300 Hz–4 kHz; foley from the page's events (`window.EV`): servo whirrs, blink clicks, dot blips, ring locks, whooshes, a thruster bed, a basketball bounce, a gulp. −14 LUFS, true peak −1.1 dB.

## Palette & props

- Colours as in STYLE.md's example; the hand level turns the ground to the blue with pale cloud pills and comes back to night inside the skin.
- Orbi: a sun-yellow sphere with a shade crescent, a lens eye (cream ring, night barrel, blue iris), coral cheeks, two blue solar panels, a lavender antenna with a coral bead, a two-layer teardrop flame. It holds a coral tape-measure case on Earth. Drawn about 150–280 px everywhere except the hand level, where it is 2 cm.
- Props: a two-arm spiral galaxy with star clouds, the Solar System at true radii (Sun 0.00465 AU), Earth with three orbits at true scale, a tape measure ticked every 1,000 km, satellites, a pointing hand (index out, three curled fingers, thumb, sleeve), a grape, red blood cells, a macrophage with a feeding cup, bacteria, a virus with spikes, the edge of a hair.

## End card

From 49.1 s, bottom right of the final ribbon shot, wiped in line by line and held to the end (2.5 s fully written): `THE LONG WAY DOWN · 一路往下缩`, `Scale Zoom Explainer · 扁平尺度漫游`, `LemoLab × Claude Opus 5.5` in sun yellow. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: fonts (if missing) → voice (if missing) + asr_check → events → video → mix → master → .srt → readcheck → poster
  index.html     the page; ?f=1|2|3|options draws the three style frames and the character sheet, no ?f draws the film
  flat.js        palette and flat-drawing helpers
  orbi.js        Orbi with continuous pose parameters (the film)
  heroes.js      the guide, Orbi, as drawn in the style frames and the character sheet
  sheet.js       the guide's character sheet (?f=options)
  film.js        0–10 s: camera and parallax, Orbi's first performance, title, first sight line, next-stop ring
  scenes.js      10–52 s: every later level and transition, scale ribbon, subtitles, end card, sound events
  mix.py         narration placement, score, foley, mix → out/mix.wav and out/cues.json
  shoot.mjs      the style frames as PNGs
  vo/            lines.json (voice text, speeds, asr fields), dur.json; the clips are local
  tools/fonts.py fetch Jost and the Noto Sans SC subset
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- `sh demo/build.sh` takes about 4 minutes on Apple silicon with 2 render workers (1,248 frames in under a minute; the rest is the mix). In a fresh clone first run `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`, `sh tools/fetch.sh voice` and `sh tools/fetch.sh instruments vcsl`, `… vsco2ce`, `… freepats`; or set `LIB` to a library folder that already has `.venv` and `core/audio/instruments`.
- Fonts are not in git: `tools/fonts.py` downloads Jost from github.com/google/fonts and the Noto Sans SC Bold subset from the Google Fonts CSS2 API. Delete `fonts/NotoSansSC-Bold-sub.woff2` and rerun after adding Chinese text.
- `?from=a&to=b` renders a slice of the film; `window.TEXTS` reports every label for `readcheck.mjs` (subtitles and the two counters are left out).
- `readcheck.mjs` (written to `demo/out/readcheck.txt`) passes 48 labels and flags 7 as shorter than its rule: the next-stop labels "You" (0.8 s), "Into your blood" (0.2 s) and "A virus, 0.1 µm" (1.3 s), which the camera dives through; "on a basketball Earth: < 1 cm" (2.7 s of 3.0 s); and the three end-card lines (2.7–2.9 s against 2.9–4.1 s, because the film stops at 52 s). The build reports them and carries on.
- Demo-specific pitfalls: the inner world of a ring or lens needs its own background disc, or its rectangle shows inside the circle; the cloud cut happens when the covering bank is culled, so that bank must cover the whole frame at that moment.
