# Living Screencast — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Clawd Moves In* (59.4 s) · `living-screencast.mp4` · source in [`demo/`](demo/) · Claude Code in the Claude app, with Clawd (the Claude Code pixel mascot) as the protagonist. Unofficial fan film; Anthropic did not make or endorse it.


## Story & structure

Clawd, the Claude Code pixel mascot, climbs out of the terminal logo and moves into the Claude app, then acts out four features in four chapters: **01 Just say it** (plain-language prompt with an @-mention, reading files), **02 Plan first** (Plan mode; nothing changes until you say go), **03 Review** (the diff, a line comment, the revision), **04 Checks its own work** (the preview, the dark-mode toggle, parallel sessions). The slogan closes it: "Say it. Plan it. Review it. Ship it." Every interaction matches the official desktop documentation.

The demo's six rules (spread over STYLE.md §1–§6):

| Rule | Why |
|---|---|
| **Real UI, redrawn** | Every label, mode name and shortcut matches the real product. No screenshots, no lorem ipsum. The demo code, diff and test output are coherent, and the "app under test" really changes. |
| **Recording-software camera** | One continuous take inside the screen. Push in on the action, drift slightly, and whip-pan between panes. Zoom never drops below 1, so we never see outside the monitor. Cuts happen only under chapter transitions. |
| **Pixel grid is sacred** | The mascot, its props (pencil, "!", sparkles, heart, dust) and its trails share one square-pixel grid with crisp edges. It scales with the camera. Its position snaps to half-pixels, so its motion feels stepped. |
| **Gravity = top edges of UI** | The mascot only ever stands on the top edge of a real element: input box, menu, file row, diff line, button, CI bar, the title's letters. Position comes from **measuring the live DOM** every frame, never hand-placed coordinates. |
| **Cause and effect** | Every mascot action triggers a real UI state change, and every user action is a cursor move, click or keystroke shown on a KeyCastr-style HUD. |
| **Information layers** | A chapter pill (01–04), the keystroke HUD, frosted-glass caption pills, and an optional "▶▶ 4×" time-lapse tag. Nothing else overlays the screen. |

### Director's toolkit, as the demo spent it (all ten used)

1. **Match-cut origin story.** The terminal logo's quadrant block characters (`▐▛███▜▌`) are the mascot's pixels 1:1. Each tall quadrant morphs into a square pixel, and the character climbs out of the terminal, leaving a dashed outline behind.
2. **Diegetic title.** The product name drops in as the app's empty-state heading, and the mascot lands on its letters on the downbeat.
3. **Staging on a moving floor.** The mascot follows the typing caret, jumps onto the @-mention popup, and rides the sent message as it flies up the chat.
4. **Time-lapse with a tag.** Reading files runs at 4× with a flashing tag and rack focus: the chat is blurred and the pane is sharp.
5. **Spotlight freeze.** On the key promise ("nothing changes until you say go") the camera pushes in and a vignette isolates the *No files changed* badge.
6. **Directional motion blur only on whips.** It is derived from camera speed and applied as an anisotropic Gaussian on an **untransformed wrapper**. Slow moves stay sharp.
7. **The film itself changes state.** The dark-mode toggle's reveal doesn't stop at the preview. The circle keeps growing over the whole app and desktop, and the rest of the film is in dark mode. At the end, the mascot's last stomp brings the light back from its own feet.
8. **Cell division.** The new session splits the window, and the mascot splits into two with a pixel burst.
9. **Karaoke-ball end card.** The mascot hops from word to word of the slogan, landing on each word as it is spoken.
10. **The cursor and the mascot are characters.** The cursor "pets" the mascot on the head: it squashes, closes its eyes, and a heart pops up.

The demo's sprite is an **18×10** grid unfolded 1:1 from the terminal logo's quadrant characters; its props (pencil, "!", sparkles, heart, dust) share that grid.

## Shots

| # | Time | Picture / Clawd | Camera / move |
|---|---|---|---|
| 1 | 0:00 | `claude` typed in a terminal; the logo's blocks come alive and Clawd climbs out, leaving a dashed outline | locked on the terminal → match-cut origin |
| 2 | 0:05 | The Claude app window opens; Clawd lands on the empty-state heading, the title | diegetic title on the downbeat |
| 3 | 0:09 | **01** typing, @ file popup; Clawd stands on the input box, then rides the sent message | push-in to the caret; moving floor |
| 4 | 0:14 | Clawd runs along the file tree, read rows highlight | 4× time-lapse tag + rack focus |
| 5 | 0:19 | **02** ⇧⌘M mode menu; Clawd on top of the menu watches Plan get picked | push-in on the menu |
| 6 | 0:23 | Plan pane; Clawd writes item 4 with a pixel pencil; *No files changed* badge | spotlight freeze |
| 7 | 0:29 | **03** `+24 −3` stat bar; Clawd cheers on it; the cursor clicks Review | whip-pan to the diff (motion blur) |
| 8 | 0:32 | Diff: comment on line 6, ⌘↵; Clawd lies on the comment box reading | push-in |
| 9 | 0:37 | The line is rewritten, "!" over Clawd, stats become +13 | locked |
| 10 | 0:42 | **04** preview; Clawd stomps the toggle, dark spreads from the button over the whole app and desktop | the film changes state |
| 11 | 0:50 | ⌘N new session; the window splits, Clawd splits into three (CI green, tests 50/50, new session) | pull back; cell division |
| 12 | 0:56 | End card: karaoke-ball slogan; the last stomp brings the light back from Clawd's feet | locked |

## Score structure

- **Score in two resolutions.** The hi-fi layer (piano, upright bass, drum kit, glockenspiel, real samples) is the world. The chiptune square wave is the mascot's voice.
- **Score structure:**
    - The band enters when the mascot lands on the title.
    - Each chapter transition gets a tom fill and a crash.
    - The last chapter drops the drums to build tension.
    - The dark-mode stomp crossfades the whole band into a low-passed "night" version.
    - The split screen becomes a left/right duet (piano left, chiptune right).
    - The end-card words are chiptune notes; the final stomp opens the filter on a big major-9 chord.
- **Foley:** keyboard (a thock plus a click, with human timing jitter), trackpad clicks, pane swishes, popup pops, CI ticks, a shutter for screenshots. Mascot steps, jumps and landings are 8-bit.
- **VO:** calm, one feature per line, product names verified with whisper. Keep effects off word onsets: a keypress landing on "Start" masks the word.

Tempo ~104 BPM. The end-card words are chiptune notes C5 E5 G5 C6 in `sound.py`.

Mascot timings in the demo: anticipation crouch 0.14 s with squash 0.28; walk at 9 steps/s. The full acting notes:

- **Jumps:** anticipation crouch (0.14 s, squash 0.28), stretch on take-off, tucked legs in the air, a landing squash with a damped bounce, and dust puffs.
- **Idle:** a tiny squash on every beat of the score, so the character breathes in time with the music. It blinks at irregular intervals.
- **Walk:** 9 steps/s leg alternation. The direction flips the sprite.
- **Eyes carry the acting:** n / l / r / u / d / wide / happy / shut / blink. They look at what matters: the popup, the cursor, the line being revised.
- **Arms:** down / up (cheer) / wave. Props sit on the same grid.

Voice: Kokoro `am_michael`, speed 1.0 (other voices read "Claude" as "Clod"). Keep effects off word onsets: a keypress landing on "Start" masks the word.

## Palette & props

The Claude app's light theme (ink `#1F1E1C`, clay `#D97757`, `--clay2` `#BD5D3A` for the stressed slogan word) and its real dark theme after the toggle (ink `#EEEAE2`, clay `#E08565`), all as CSS variables in `demo/index.html`. Clawd in brand clay `#D97757` with `#B85F40` shading and `#2A2622` eyes; pencil yellow `#F2C14E`, heart `#E0543A`, check `#2F9E4F` (`demo/clawd.js`). Fonts: Inter, Newsreader, JetBrains Mono (OFL). The "app under test" is a small tomato-timer project (`~/tomato-timer`); the UI shows the model name as it appeared in the app.

**Rights.** Unofficial fan film: it uses the official Claude Code mascot and redraws the Claude app's interface closely. The end card says "Unofficial fan film". A user's film should show their own product and mascot, or an original pixel character.

## End card

Clawd hops across "Say it. Plan it. Review it. Ship it." word by word as it is spoken (Newsreader 64 px, the last word in clay italic), then "Claude Code · in the Claude app" and a small credit line (`film.js`, end-card function): "LemoLab × Claude Opus 5.5 · Unofficial fan film · Voice · Fonts", plus the sample credits (Salamander Grand Piano V3, MuldjordKit, Versilian Studios, Karoryfer). The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (remove that line when adapting `film.js`).

## Build notes

- `demo/film.js` is the timeline. VO lines are placed at fixed times, and every visual beat hangs off a spoken word (`W(id, word)`). It holds the camera moves, the `Actor` (mascot) segments, the `Cursor`, and the sound events.
- `demo/ui.js` turns state into HTML for the terminal and the Claude app.
- `demo/clawd.js` holds the sprite grid, poses and pixel props.
- `demo/main.js` handles the light and dark layers, DOM anchor measurement, motion blur, and the HUD (captions, keys, pixel wipes, spotlight).
- `demo/sound.py` builds the score, foley and VO from `events.json`, with ducking.
- Run everything with `sh styles/living-screencast/demo/build.sh`. The full render takes about 30 s.

Other files: `demo/lines.json` (VO lines), `demo/tools/asr_check.py` (whisper check + word timestamps, `sh demo/build.sh --vo`), `demo/tools/mixcheck.py`, `demo/tools/subs.mjs` (captions → `.srt`). `build.sh` also renders the style frame (40.9 s) and the poster (8.9 s).

Don'ts (also in STYLE.md §9):

- Don't invent features or rename modes. If a button isn't in the docs, it isn't in the film.
- Don't let the mascot float in empty space, cover text the viewer should read, or sit under a caption.
- Don't use screenshots, blur-filter "fake depth" on text you want read, or zoom out past the screen.
- Don't put a hand, arm or finger on screen. The cursor is the user.
