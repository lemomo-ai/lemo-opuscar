# Stick-figure Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Six Hands Away* (52 s) · `stick-explainer.mp4` · source in [`demo/`](demo/)

![The hook chain, hands lifted](demo/stills/styleframe.jpg)

## Story & structure

How many people stand between you and any stranger on Earth? "Six handshakes", the saying goes. The film tests the claim with Milgram's 1967 letters, explains why the number is so small (people you know, times people they know, outgrows the Earth by step five), shows the online chains shrinking (4.74, then 3.57), and ends with the last chain bending onto a globe and growing around it until the circle closes.

- **Hook** (0–10 s): you and a stranger at the two ends of a line; five people pop up between you and clasp hands, faster and faster; the accent runs from you to the stranger; the row lifts its hands. "Six, they say."
- **Turn 1** (10–24 s): pull back; your chain is one of four. Letters pass hand to hand; three chains break (someone lets go, the letter drops and greys); yours arrives. 64 of 296 letters arrived; 5.2 people in between.
- **Turn 2** (24–37.75 s): push into you; rings of people form around you, each 2.5× the last, under a fractal pull-back while the count runs 100 → 10,000,000,000 and passes Earth's 8.2 billion.
- **Turn 3** (37.75–44.4 s): dive through your red head into three chains: 1967 ≈ 6, 2011 4.74, 2016 3.57 steps; the chains are the bar chart.
- **Landing** (44.4–52 s): the shortest chain bends onto a globe; people grow down both sides and the last two hands meet at the bottom; the accent runs both ways from you; everyone lifts. "Closer than you think." End card.

The signature move escalates each time: one handshake → a chain → four chains carrying letters (and letting go) → closed rings → the whole Earth.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| S1 | 0–9.65 | The line draws in; "you" (accent head) and "a stranger" pop up at the two ends; title "How many hands between / you and anyone?"; five people pop up and clasp (2.5 / 3.5 / 4.25 / 4.75 / 5.25 / 5.75 s); the accent runs (6.0–6.75), nodes count 1–6; the row lifts (7.0); "Six, they say." top right | locked | the chain; join the hands |
| → | 9.65–11.7 | Titles leave; three more rows pop up and zip their hands | pull back 1× → 0.37× (log zoom) | one case becomes many |
| S2 | 11.7–22.8 | From Nebraska / To Boston; four letters pass from chest to chest through the joined hands; three chains let go at hand-offs 2, 4, 5; ours arrives (16.1); 64 / 296 and 5.2 in the right column; the five in between light up 1–5 | slow drift | let go; the accent run as a trail |
| → | 22.8–24.0 | Everyone but you fades; you let go | push in 0.39× → 1.25× + focus shift | — |
| S3 | 24.0–37.15 | "Why so few?"; ring 1 (16 people) pops up around you and closes; rings 2–5, each 2.5× the radius and size; the count column runs 1 → 100 … 5 → 10,000,000,000 (accent), a rule, "Earth 8,200,000,000" | fractal pull back, each ring framed at the same screen size (zoom 0.53 → 0.014); rings 3–5 cut quickly | rings |
| → | 37.15–37.75 | The rings sweep outward; your red head glides to the centre and fills the frame | dive through the head (anchor-preserving zoom ×5000) | through a shape |
| S4 | 37.75–44.3 | The red shrinks to the head of "you" in the 1967 row; three chains build: ≈6, 4.74, 3.57 steps; each value lands as its chain completes; all three held ≥ 2.5 s | pull out from the head, slow push 1 → 1.025 | the bar chart of people |
| → | 44.3–45.65 | Two rows fade; the 2016 row's base line bends into an arc and its people turn radial | match transform + push in | — |
| S5 | 45.65–52 | 17 people grow down each side of the globe and clasp; the circle closes at the bottom (47.02); the globe fills; the accent runs both ways from you; everyone lifts; "Closer than / you think." and 比你想的更近 in the globe; end card from 48.65 | pull back to the whole globe (1.35× → 0.48×), then a slow push to the end | the whole shape |

Three style frames from the same engine (`?scene=f1|f2|f3`) show other uses: a title over a ripple row ([frame_1](demo/stills/frame_1.jpg)), a phantom traffic jam in three time slices ([frame_2](demo/stills/frame_2.jpg)), a bank run as a grid of people with a threshold bar ([frame_3](demo/stills/frame_3.jpg)).

## Score structure

D major, 120 bpm, 2 s bars, on the film clock; the voice owns the mids.

- **S1**: pizzicato bass and a soft marimba broken chord (D – Bm – G – A); a kalimba note per handshake, climbing D E F♯ A B D; glockenspiel on each node as the accent passes; a harp strum on the lift; the landing on D at 8 s with vibraphone and cellos.
- **S2**: a walking pizzicato bass; a soft kalimba for every hand-off; a dropped letter falls a minor third on marimba with a low thud; a vibraphone chord when ours arrives; glockenspiel 1–5.
- **S3**: a string pad that thickens ring by ring; a harp sweep per ring; marimba per tally; a full chord with horn when the count passes Earth; a reversed cymbal swell into the dive and a soft low hit on the red frame.
- **S4**: lighter again; a kalimba tick per handshake, one vibraphone note per value.
- **S5**: harp notes racing down both sides of the globe; the biggest chord on the closing handshake (strings, harp, low pizzicato); glockenspiel on the accent run; a vibraphone chord on the lift; a bell as the credit lands; a low harp D at 50.5 s left to ring; the last 1.6 s fade.
- **Mix**: voice compressed and set 10 dB (RMS) above the music while it speaks; the music bus dips 300 Hz–4 kHz and ducks under each line; −14 LUFS, true peak ≤ −1 dBTP.

Voice: Kokoro `af_heart`, speed 0.78–0.8, ten lines (`demo/voice/lines.json`), every line passing `asr_check.py`. Numbers are spelled out in the voice text and written as digits in the subtitles.

## Palette & props

- Paper #F3F0EA, ink #24242C, mute #9C978C, tint #E2DDD2, accent #EB4A2A, globe fill #E9E4DA.
- Figures: A "even hose" weight (8 px at 380 px tall, head ring 7.5 px); "you" and anyone reached have a solid accent head.
- Props: the system line with nodes, envelopes (paper fill, ink outline, a V flap; grey when dropped), rings, the globe.
- Type: Jost (titles, numbers, labels), Noto Sans SC (Chinese, subset).

## End card

Inside the globe, under "Closer than you think." (which moves up 46 px from 48.65 s): "Six Hands Away 隔着几只手", "Stick-figure Explainer 火柴人讲解", "LemoLab × Claude Opus 5.5" (30 px), arriving 48.8–49.4 s and fully visible until 52.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/stick-explainer/demo/build.sh` (from anywhere; `WORKERS=2` by default): fonts if missing (Jost and Noto Sans SC from google/fonts, the Chinese face cut to `tools/zh-chars.txt`), voice if missing (Kokoro) and the speech check, `events.json`, picture at 60 fps (~2.5 min with 2–3 workers), `mix.py`, `tools/srt.py`, `mux.sh`, `readcheck`, poster and stills.
- `demo/index.html`: rig, springs, figure drawer, hook chain, style frames. `demo/full.js`: the film (five shots, four worlds, camera, subtitles, events). `demo/mix.py`: score + foley + voice. `demo/tools/png.mjs`: PNG stills of any scene. Sources and facts: `demo/CREDITS`, `demo/FACTS.md`.
- Render a slice: `node core/render/video.mjs styles/stick-explainer/demo --q 'scene=full&from=48.6&to=52' …`; the page draws film second `from + t`, so a slice joins the full render frame-exactly.
- Pitfalls of this demo's props: envelopes sit in front of the chest (on the shoulder they cover the head); camera dives must keep the target's screen position continuous (interpolating centres while zoom changes by ×5000 throws the target off screen); outer rings pop in only once the camera has nearly framed them, or their arms cross the count column.
