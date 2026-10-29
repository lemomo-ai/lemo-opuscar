# Web Game Ad (传奇页游广告) — Style Prompt

> The loud, gold-on-fire look of Chinese "Legend" web-game ads (传奇页游 买量广告): beveled gold characters slammed onto red rays and a wall of flame, a warrior in white sneakers mid-swing, crit numbers, a pulsing 立即试玩 button. Played straight but used to explain something: the film keeps the ad's grammar (every claim a slammed gold line on the beat, every scene a game screen) and turns it on the topic.
> References (grammar only): mid-2010s 页游 / 传奇 ads, MMO HUDs of that era (server lists, top-up pop-ups, leaderboards, system chat). Never copy a real ad's frames, logo, UI art or music, or a spokesperson's face, name or voice.

## 1. Essence, and what it is not

- **Gold type is the headline.** Chinese characters in a thick black outline, a copper rim and a vertical metal gradient (white → yellow → amber, a hard dark band just below the middle → gold), with an orange glow. Every claim is one line of it, slammed in on a beat.
- **Fire and rays.** A dark-red radial ground with slowly turning rays, a wall of particle flame along the bottom edge, embers drifting up.
- **Game screens carry the content.** A server list, a 首充 pop-up, a leaderboard, a system notice, a chat box, a bronze-framed panel: information arrives as a game system the viewer already knows.
- **A front-facing cartoon lead.** Thick black outline, flat fill with one shade, sneakers, a tunic or gold armour; the lead is in every scene that isn't a chart.
- **Hit-driven.** Shake, white flash, crit numbers and light pillars land on cue words and downbeats.

Not a pixel RPG (no pixel grid, no tilemap), not a game-show flat (no pastel, no rounded sans), not a microgame frenzy (one continuous argument, not a string of minigames), not a keynote (never calm, never white space as luxury).

## 2. Materials & rendering

- Canvas 2D, redrawn whole every frame as a pure function of `t`.
- Type: `goldText` = shadow glow pass → black outline stroke (~0.2 × size) → copper rim stroke (~0.09 × size) → gradient fill. The same recipe in red (`REDS`) for warnings and in silver for secondary weight.
- Metal panels: dark fill, gold double border, studs in the corners, a red title ribbon. Buttons: a rounded pill with a vertical gradient, a gold rim and a glossy top band.
- Fire: particles burning upwards from a baseline, additive (`lighter`), seeded so they flicker the same on every render. Rays and glows are additive too; everything else is source-over.
- Characters: limbs as thick round strokes (ink outline under a colour stroke), body and head as outlined blobs, one flat shade. No gradients on skin or cloth; metal gets gradients.
- Shake, flash and vignette are screen-space; fire, pillars and embers belong to the set.

## 3. Colour logic

- The ground is near-black red or warm stone (dark brown wall, never grey). Red and gold carry everything; white is reserved for flashes, light pillars and blade highlights.
- Gold = the claim, the reward, the number that matters. Red gradient type = loss, danger, the line that stings. Cream (`#f3e6c0`-ish) = plain labels and sources. Green = player names (as in MMO nameplates). Grey and desaturation = "it stopped": a frozen ad, a closed game.
- A chart is gold bars or a gold line on stone, a single red accent for the thing it argues against. No rainbow charts.
- The ad's own copy may be loud green-to-red gradients (that loudness is the subject); explanation never is.

## 4. Type & subtitles

- **Brush display face** (Ma Shan Zheng, OFL) for slogans and the ad's copy; **heavy serif** (Noto Serif SC 900, OFL) for claims and numbers; **sans** (Noto Sans SC 500–900, OFL) for labels, sources, subtitles and UI text.
- Sizes: a claim 90–170 px, a number 110–150 px, labels 40–60 px, source lines 24–32 px (top left, under the section tab). One claim per line, 4–12 characters; a number gets its own line.
- Subtitles are part of the ad: Chinese in gold sans 900, popping in character by character with the voice (karaoke), English underneath in cream sans 500, both centred at the bottom over a dark gradient plate. One line per language. Hold ≥ max(1.8 s, speech + 0.6 s) unless the next line starts first.
- Reading time: every claim, number and source line holds ≥ CJK ÷ 4.5 + other ÷ 15 + 1.5 s (`readcheck.mjs`). Game UI copy (buttons, slogans, nameplates, rank rows, server tags, chat, system notices) is texture: it repeats the genre, carries no fact, and is left out of `TEXTS`. If a fact sits in UI copy, give it its own claim line.
- Real company names are partly masked (one or two characters pixelated) when the film shows their disclosed figures.

## 5. Motion quality

- 24 fps, eased on ones. Arrivals are violent and short: **slam** (from 2.6× to 0.92× to 1 in 0.2 s), **pop** (back-ease overshoot in ~0.2 s), drop on a string with a damped swing. Departures are cuts, not fades.
- Every hit is three things at once: a shake (decays in ~0.4 s), optionally a white flash (≤ 0.2 s), and a sound. Big hits add a crit number or a light pillar.
- Characters bob and nod on the beat. Rays turn and fire flickers: the frame is never still, except a deliberate freeze or a dead black screen.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Locked frame with shake on hits | the ad's own camera: loud, frontal, flat | a claim; a pop-up; a chart verdict |
| Pull back to reveal a device | "this was an ad on someone's screen" | an opening; a turn from fiction to fact; a return to the viewer |
| Punch-in (scale jump on a hit) | emphasis on one number or one face | the figure that matters; a reaction |
| Freeze + desaturate | time stops, the spell breaks | a tap; a decision; a cost revealed |
| Lateral slide across the town square | moving through the game world | time passing; a crowd thinning; going somewhere |

Framing: one subject centred or two facing each other; claims in the upper half, characters below; the bottom 120 px belongs to the subtitles. Transitions: hard cuts on downbeats, a white flash, a pop-up opening over the scene. No dissolves, no wipes.

## 7. Sound palette

- Ad brass (trumpet, horn and trombone stabs), frame drums, timpani, gongs and a bass drum for anything that is the ad itself; a trap-like groove (kick, claps, rolling hats, finger bass, tuba) under explanation; Chinese colour on top (guzheng sweeps up the pentatonic scale, a low erhu when things empty out).
- Game foley from instruments: coins = glockenspiel and triangle, a level-up = marimba run, price tags = woodblock, "you died" = a falling trombone line.
- Hits: kick on every cue; brass stab or crash on the big ones, but never under a word — while the voice speaks, the hit is the kick alone and the brass waits for the gap.
- Silence is the one quiet tool: when the game is closed, the music fades in 0.25 s and the frame is silent until the ad comes back.
- Voice: one fast, bright young male narrator (edge-tts zh-CN-YunxiNeural at about +40 %), ducked over by nothing; music ducks ~9 dB under it. Mix to −14 LUFS, true peak ≤ −1.2 dB.

## 8. Native moves

- **The ad, played straight.** Fire, rays, a warrior, a crit, a gold slogan, a pulsing button, all within two seconds. *Fits content like:* the hook of any film about attention or marketing; a parody of hype; the "before" of a before/after.
- **Price tag on a string.** A red tag drops in from above, swings and settles over the thing being bought. *Fits content like:* what a click costs; the real price of a free app; what a subscription adds up to.
- **Game system as chart.** A leaderboard, server list or top-up panel holds the data. *Fits content like:* income distribution; who uses a service most; a ranking of countries or products.
- **The pop-up.** A bronze dialog bursts open over the scene with a title ribbon, a body and two buttons. *Fits content like:* a terms-of-service clause; a choice the viewer faces; a warning.
- **Light pillar and crit.** A beam of light drops on a character and a number explodes beside them. *Fits content like:* a reward; a record; someone winning at someone else's expense.
- **The sieve.** A loud banner over a crowd; most fall away, a few remain. *Fits content like:* filtering users; how a test selects; why a design looks bad on purpose.
- **Freeze and pull back.** The ad stops, greys out, and the camera finds the person holding the phone. *Fits content like:* the moment of a purchase; the viewer as the product; any "this is about you" turn.
- **The button changes.** 立即试玩 becomes 不了 (or any refusal) in grey. *Fits content like:* an ending that says no; quitting; unsubscribing.

## 9. Pitfalls of the medium

- **Everything slams, nothing reads.** At ad pace a claim lasts one beat. Give each fact a claim line that holds its reading time; let the voice say it at the same moment; keep UI copy as texture.
- **Gold on gold.** Gold type on a gold panel vanishes: keep claims on dark ground, and keep the outline at ≥ 0.14 × size.
- **Brass under words.** Stabs on every hit bury the voice: hits under speech are kick only.
- **Mocking the players.** The joke is the business model, not the people who play: the lead is sympathetic, and the ending gives him the choice.
- **Real ads and real faces.** No spokesperson's likeness or voice, no real ad frames or logos; real companies' figures only from their own disclosures, names partly masked, third-party estimates labelled as such (`demo/FACTS.md`).
- **Fire everywhere.** Fire is the ad's; scenes that explain sit on stone. Use fire again only when the ad returns.

## 10. Engine

- `demo/engine/fx.js` — the kit: `goldText` (+ `GOLDS`, `REDS`, `SILVERS`), `slam`, `pop`, `flames`, `embers`, `pillar`, `crit`, `panel`, `button`, `dialog`, `chatBox`, `seal`, `flash`, `burst`, and `TX` / `note` (every text drawn records its screen box for `window.TEXTS`).
- `demo/engine/hero.js` — `hero(ctx, x, y, s, look, {pose, beat, talk, sad, flip})` with looks `xd` (newbie), `dr` (big spender in gold), `p4` (the ad's warrior); `weapon`, `nameplate`.
- `demo/engine/props.js` — `adBG` (red rays), `fireWall`, `plaza` (night town square with a wall, gate and torches, `cx` slides it), `stoneBG`, `ingot`.
- Minimal example, not in the demo: a pop-up asking whether to renew a subscription over the town square —

```js
P.plaza(ctx, 1920, 1080, t); hero(ctx, 960, 1000, 1, 'xd', { beat: (t / .47) % 1 });
F.dialog(ctx, 960, 420, 900, 420, '续费提醒', [{ text: '自动续费 ¥25 / 月' }], [{ text: '续费' }, { text: '不了', grey: true }], t - 1);
```

## 11. Variation space

The agent decides the topic's structure, the lead (who, and what they want), which game systems carry which facts, the opening and the ending, the pacing (ad pace or slower), and the palette within the red-and-gold logic.

- **Structures:** a receipt walked line by line as top-up pop-ups; a rise-and-fall told as one server's life from 开服 to 合服; a versus match where two options fight and the HUD keeps score.
- **Openings:** a crit number with no context, then what it counts; a server-list screen with the topic as the new server; a chat box where someone asks the film's question.
- **Endings:** the lead logs out and the screen goes black; a leaderboard where the lead's name finally climbs; the ad returns but its slogan now says the truth.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
