# Tabletop App Flythrough 桌面卡片穿梭 — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *叮之前 · Before the Ding* (59.95 s) · `desktop-flythrough.mp4` · source in [`demo/`](demo/)

## Story & structure

You send a friend a cat photo and their phone dings at once, but the photo did not fly straight there. The film follows it: step 1, the app shrinks it (4.2 MB → 300 KB, an illustrative figure); stop 2, it waits on the chat app's server; step 3, the server sends a notification; then the friend's phone fetches the photo, and on a slow connection it shows up blurry before it turns sharp. The ending: unless you ticked "Original", your friend has a compressed copy; the original never left your phone.

Four stops on one desk: your phone, the compress card, the server tower, your friend's phone (小林, fictional), joined by a cobalt dotted route. The hero is the cat photo itself, a 16×16 voxel toy that blinks, waits on the beat, gets squashed into its 8×8 copy and hops the whole route. The opening and closing titles are objects on the desk. Every claim and its source is in [`demo/FACTS.md`](demo/FACTS.md); no app or company is named.

## Shots

| # | Time | Shot | Camera | Native move |
|---|---|---|---|---|
| 1 | 0–4.6 | your phone (full chat interface, the photo attached) and the title tent 叮之前 / BEFORE THE DING; 1.0 the cat pops; 2.0 send; 2.25 the friend's phone dings, banner and photo appear at once | low three-quarter on the phone and tent; a whip that arcs up over the desk to the friend's phone | sticker pop |
| 2 | 4.6–7.6 | that instant rewinds; a grey straight line between the phones is crossed out; the cobalt route draws through the compress card and the server | rise to a wide view, the four objects filling the frame | UI rises |
| 3 | 7.6–10.6 | the cat leaps to the compress card; badge 1 压小 | the whip rides the leap | card hop |
| 4 | 10.6–17.2 | 10.5 the press drops (the cat squints); 28 pixel cubes burst out and roll away; the 8×8 copy pops out in the dashed box and bounces; the counter runs 4.2 MB → 300 KB; ≈ between original and copy | near top-down on the card, held | press |
| 5 | 17.2–20.3 | three hops along the route to the server tower; badge 2 服务器 | ride along, settle on the tower | card hop |
| 6 | 20.3–26.0 | 云端中转站: the cat waits bouncing on the roof; yellow data cubes hop into the windows; the drawer slides out, the cat hops in, it closes, one window lights cobalt; the antenna blinks on the beat | half an orbit round the tower | drawer |
| 7–8 | 26.0–32.1 | badge 3 通知; the bell rises, flies to the friend's phone leaving a dotted trail, taps twice; the banner 你 · 新照片 drops | tilt up, follow the flight, settle on the phone | messenger |
| 9 | 32.1–34.6 | the ring: the bell swings, the phone jolts, vibration marks either side, a cobalt ring spreads | phone close | slam and ring |
| 10 | 34.6–39.6 | after the notification the phone goes to the server: the route lights back, yellow data cubes run along it, a loading spinner, the drawer opens, the cat hops home | pull out to both, then ride the hops | data run |
| 11 | 39.6–44.8 | 网慢: one red signal bar; the bubble shows a blurry preview; 43.1 the cat drops into the bubble and it snaps sharp | near top-down on the screen, held | blurry, then sharp |
| 12 | 44.8–48.4 | the whole relay; the route glows in a wave | pull back to a top view | desk pull-back |
| 13 | 48.4–52.6 | unless you ticked "Original": the friend's chunky copy, tag 300 KB | push in | |
| 14 | 52.6–55.4 | your album: the fine original, tag 4.2 MB | whip back, arcing up over the desk | |
| 15 | 55.4–59.95 | the closing shot: rise and pull back until all four stops and the route are in frame; the route glows; each stop hops once, left to right; the two cats pop up and bow; 56.25 the title card 叮之前 / BEFORE THE DING drops into the middle of the desk and bounces (the small tent folds away); 57.0 the sign-off | long pull-back, slow orbit | curtain call |

## Voice-over

Fourteen lines, Chinese, voiced with edge-tts `zh-CN-XiaoxiaoNeural` at `+15 %` (line 5 at `+8 %`), checked line by line with Whisper; 0.8 s lead, 0.3–0.6 s between lines. Subtitles: one cue per line, Chinese over English ([`desktop-flythrough.srt`](desktop-flythrough.srt)).

| # | Start | 中文 | English |
|---|---|---|---|
| 1 | 0.8 | 你给朋友发了张猫，叮的一声，对面马上就收到了。 | You send a friend a cat photo. Ding, it arrives right away. |
| 2 | 4.8 | 可这张照片，并没有直接飞过去。 | But the photo didn't fly straight there. |
| 3 | 7.8 | 按下发送的那一刻，第一步，是压小。 | The moment you hit send, step one: make it smaller. |
| 4 | 10.9 | 原图太大、传得太慢，软件会先把它悄悄压缩，体积小了，看着却差不多。 | The original is too big and slow to send, so the app quietly compresses it: smaller, yet it looks about the same. |
| 5 | 17.5 | 接着，照片来到第二站，服务器。 | Next, the photo reaches stop two: the server. |
| 6 | 20.6 | 也就是聊天软件的云端中转站，照片先存放在这儿，等着对面来取。 | That's the chat app's relay station in the cloud. The photo waits here to be picked up. |
| 7 | 26.2 | 第三步，才轮到发通知。 | Only then comes step three: the notification. |
| 8 | 28.4 | 服务器拍了拍朋友的手机，嘿，有张照片找你。 | The server taps your friend's phone: "Hey, a photo for you." |
| 9 | 32.3 | 这时候，手机才响了一声。 | That's when the phone goes ding. |
| 10 | 34.9 | 收到通知后，朋友的手机才真正去服务器，把照片取回来。 | After the notification, your friend's phone goes to the server and fetches the photo. |
| 11 | 39.6 | 所以网慢的时候，你会看到它先糊一下，再瞬间变清楚。 | So on a slow connection, you see it blurry for a moment, then suddenly sharp. |
| 12 | 44.8 | 一声叮的背后，其实是一场无声的接力。 | Behind that one ding is a silent relay. |
| 13 | 48.1 | 如果你没勾原图，朋友收到的，只是那只猫的压缩版。 | Unless you ticked "Original", what your friend gets is just a compressed copy of the cat. |
| 14 | 52.3 | 而真正的原图，一直都在你的手机里。 | The real original has been on your phone all along. |

**English version** (`sh demo/build.sh en` → `desktop-flythrough-en.mp4`): the English lines are voiced with `en-US-AvaNeural` at `+10 %` and start on the same seconds as the Chinese ones; lines 3, 4 and 7 at `+15 %`, line 5 at `+13 %`, line 13 at `+25 %`; line 7 is spoken as "Step three: the notification." to fit before line 8 (the subtitle keeps the full sentence); lines 1, 8, 9 and 11 carry spoken punctuation only. Picture, subtitles and length do not change.

## Score structure

120 BPM, D major, a bar = 2 s from 0.0, one chord per bar. Under the voice: string pad, contrabass pizzicato on 1 and 3, a soft synthetic kick, shaker in eighths, a two-note marimba figure from the chord; the music ducks 16 dB while someone speaks and comes back up in the gaps. The marimba head (F♯–A B–D'–C♯') opens the film and returns, with claps, under the pull-back and the closing shot, resolving on a held D chord with horns and vibraphone; four glockenspiel notes on the four curtain-call hops. Accents: glockenspiel on the cat's pop, the badges, the ring and the sharp photo; timpani on the press and the close; a thump and two bell notes as the title lands. Foley comes from the page's events (pitched from `music/harmony.json`); whooshes from the measured camera speed. Mix before the master: −16.0 LUFS, true peak −3.1 dBFS; after `mux.sh`: −14 LUFS, true peak −1.2 dBTP.

## Palette & props

Paper mat #e2e8f5 with dots #c4cde3 on light oak; cards and screens near-white, ink #171c2e, accent cobalt #2f5bff (route, badges, send button, the lit window, the drawer), mustard for the bell and the data cubes, the photo's own orange, blue and green, red only for the weak signal bar. Type: IBM Plex Mono (labels, sizes), Instrument Sans (pills, titles, subtitles), Noto Sans SC (Chinese, and the fallback of both). Cast: the cat 16 × 16 at 0.0062 per pixel (≈ 0.10 wide, a third of the 0.30 phone card), its copy 8 × 8 at 0.0074 (≈ 0.06); in the closing wide view about 63 and 37 px wide. Set: two phone cards with full chat interfaces, the compress card with its press, a four-slab server tower with a drawer and an antenna, a title tent, name plates (in the wide shots), the closing title card; props: a pen, a sticky-note pad, a mug of coffee, earbuds with their cable, an eraser.

## End card

Over the closing wide view, under the title card in the middle of the desk, from 57.0 s: LemoLab × Claude Opus 5.5 in a light plate at the subtitle position, to the end, over the held final chord. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/desktop-flythrough/demo/build.sh` (Chinese voice, the library demo) or `… build.sh en` (English voice): fonts (downloaded from Google Fonts and subset) → voice (`core/tts/tts_zh.py`, checked with `core/tts/asr_check.py`) → `audio/vo_timeline.py` (writes `src/vo.js` and `vo/timeline.json`) → events and camera speed → `audio/compose.py` → `audio/foley.py` → `audio/mix.py` → `core/render/video.mjs` → `core/render/mux.sh` → `readcheck.mjs` → poster and style frame. The voice step needs the internet (edge-tts). `tools/subset.py` runs before the voice here only because `src/vo.js` is committed; a new film subsets after `vo_timeline.py`.
- Code: `index.html` → `src/main.js` (page contract, speed-capped shutter, `TEXTS`) → `src/film.js` (cards, tower, props, cast, timeline cued to the voice, sound events, reading boxes) and `src/shots.js` (camera keys); `src/captions.js` (subtitles, sign-off, `?nosub=1` for clean stills).
- Reading time: `TEXTS` reports the title tent, the two sizes on the compress card, the server's name, the banner, 网慢, the two size tags, the closing title and the sign-off; subtitle cues follow the voice.
- Pitfalls of these props: name plates show only in the wide shots; badges stay 3.4 s and leave before the camera moves on; the cat waits beside the photo bubble, not under the subtitle bar; the eraser sits clear of the closing title card.
