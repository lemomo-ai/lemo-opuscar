# Make a style your own

A user makes a style of their own, in one of two ways: **change a library style**, or **start from a blank page**. You plan it with them, one question at a time or in free conversation, prove the look with a style frame and make a short demo film. When they confirm it, you keep it in their own folder in the same shape as a library style. From then on they name it like any library style when they ask for a film. It lives outside the library and never changes it.

Use this guide when the user wants to change a style or make their own ("I want to change this style", "make my own version", "start from scratch", "我想改风格", "做成我自己的风格", "从空白开始"), or when they name a style that is in their own folder. Everything else in a film follows [`AGENTS.md`](AGENTS.md) as usual, with the exceptions this guide gives.

Talk to the user in their language. Write the files in English, like the library, with the style's name in both languages.

## Where it lives

Until the user confirms it (§6), a style is a draft in the demo film's project folder. Confirmed styles live in **`~/lemo-my-styles/`**, outside the library, so library updates and uninstalling never touch them. `~/lemo-my-styles/README.md` lists every style, one row each (English and Chinese name, slug, base, one line on what it is, and the folder when it isn't in `~/lemo-my-styles/`): it's how a later session finds a style by name. If the user wants a style kept in another folder, keep it there and still add its row, with the full path, to `~/lemo-my-styles/README.md`.

Each style has its own folder, `~/lemo-my-styles/<slug>/`, shaped like a library style (`MAINTAINING.md` **Add a style**, without the gallery and the release):

| File | What it holds |
|---|---|
| `style.json` | `slug`, `en`, `cn`, `based_on` (the base slug; from a blank page, the technique base), `borrows` (slugs moves were taken from, may be empty), `size` (only when the default isn't 1920×1080, e.g. `"1080x1440"`), `needs` (copied from the base, e.g. `["image-generation"]` for a ✦ base; leave it out when the base has none), `library_version` (`git -C "$LIB" rev-parse --short HEAD`, or the plugin version when `$LIB` isn't a git clone), `created`, `line`, `line_cn` |
| `STYLE.md` | the style's invariants only, in the sections of a library `STYLE.md` (11 in most; a changed style keeps its base's): no story, beat table, durations or end card |
| `CHANGES.md` | one row per decision: section, base, now, why. From a blank page, "base" is the technique base's value, or "—" for something new. This is what the user approves and what you check the demo film against |
| `DEMO.md` | how the demo film was made, like a library `DEMO.md`: it opens with "One example among many. Don't reuse its story, arc, shots, props or timings.", then the story, shots, palette, score, build notes and which file draws what. It stands in for the film's `TREATMENT.md`, which isn't kept |
| `demo/` | the demo film's source with a one-command `build.sh` and `CREDITS`: the code and the small assets it needs to rebuild (fonts, data), not renders, frames, `node_modules`, virtual environments or caches |
| `styleframe.jpg` | the approved style frame |
| `styleframe-vs-base.jpg` | changing a library style only: the same frame, base on the left, theirs on the right |
| `test.mp4`, `test.jpg` | the demo film and its poster |

Never write into `styles/` or edit the library's guides for this. The name and slug must not match a library style or a row in `~/lemo-my-styles/README.md`.

## 1. Where to start

- **Change a library style.** The user names one (see **Finding the style** in `AGENTS.md`). If they haven't, do as **Finding the style** does for a film: the full list of library styles in your message, the gallery link, two or three suggestions on top when you know what they'll use it for, then a plain-text question asking them to type the name (not `AskUserQuestion`). One base only. If they want to mix two, take the one whose §1 *Essence* is closest as the base and take only what they want from the other, as changes (list it in `borrows`).
- **Start from a blank page.** The user describes the look in their own words, or brings a picture or a film they like. Choose one library style as the **technique base** (the closest materials and engine: what the code will build on) and at most two to borrow moves from. Make that the first question: your choice and why in one line each, with the next closest as the other options.

Either way, read the base `STYLE.md` in full before the first question. In this flow you may read the base's `DEMO.md` (and, in skill mode, get its source with `setup.sh demo <slug>`) before any treatment: the style frame needs its techniques. The demo film's story must still differ from the base demo's (DIRECTOR.md §11, *Not the demo again*, compared with the base).

## 2. Plan it together

Interview the user until every section of their `STYLE.md` is decided and they know what each choice costs.

**How to ask**

- **One question per message.** Use the `AskUserQuestion` tool: 2–3 options, the one you recommend first and marked (Recommended), each with one line on what it does to the film, and **Free conversation** (in their language) as the last option. Without the tool, a short numbered list with your recommendation, and free conversation as its last line.
- **Free conversation.** When they pick it, stop asking one by one. Post in the chat a checklist: what's decided, and each open item with your recommendation (when changing a library style, also its group from the table below). They answer in their own words, in any order, several at once, or ask you back. When they aren't sure about an item, give two or three concrete directions for it. Update the checklist each round; when everything is decided, or they say "you decide", go to the summary.
- Every question has your recommendation and the reason, drawn from the base `STYLE.md` and what the user said, with concrete examples from this style, not generic words.
- Don't ask what you can look up (the base `STYLE.md`, the library, their files).
- **About ten questions at most**, the technique base included. When more sections are in play, ask related ones together (motion with sound, camera with native moves). If they say "you decide" ("你定", "都按推荐"), take your recommendations for the rest, list them in one message and go on.

**The order** (skip what they've already said):

1. **Use.** What films they'll make with it, for whom, where they'll post them, and so the frame size (a vertical feed needs 1080×1920 or 1080×1440). Their brand or IP: colours, logo, font, a character. They give you the files later.
2. **What changes.**
   - *Change a library style*: first show the three groups as a short message, using this style's own sections and examples. Then ask which parts they want to touch (several may be picked).

     Section numbers below are the usual ones; some styles (Edit & Documentary above all) number or split them differently, so go by the section's subject in the base `STYLE.md`.

     | Group | Sections of `STYLE.md` | What to tell the user |
     |---|---|---|
     | **Safe to change** | §3 colour (the palette within its logic), §4 type, §5 motion (tempo, how much moves), §7 sound palette (instruments, density), §8 native moves (add or swap one) | the style stays itself; give 2–3 ideas for each |
     | **Changes its character** | §2 materials and rendering, the colour logic itself in §3, §6 camera grammar | possible; say what the style loses with each change |
     | **Can't change** | §1 essence (and its "what it is not"), §10 engine | that's a different style, not a version of this one. Say so and suggest a closer base |

     When a safe change narrows a phrase in §1 (three inks become two), adjust that phrase; the essence stays.
   - *From a blank page*: the essence first, one sentence on what it is and one on what it is not. Then the materials.
3. **Section by section**, only the sections in play, in `STYLE.md` order: materials and rendering, colour, type, motion, camera, sound, native moves. Give 2–3 concrete directions for each.
4. **The name**: English, Chinese or both, and the slug.

**Help them change it well.** Most users know the feeling they want, not the section. While you ask:

- Start from the use. The changes follow what the films are for: a weekly brand bulletin needs readable type and a fixed opening, a kids' channel needs bigger shapes and slower reading.
- Turn vague wishes into options, never silent edits:

  | They say | Usually means |
  |---|---|
  | more premium, 高级 | fewer colours, stronger contrast between light and dark, slower motion, more empty space, lighter type |
  | younger, livelier, 活泼 | a brighter accent, cuts on the beat, bouncier easing, more percussion |
  | calmer, 安静 | slower tempo, longer holds, fewer moving things, sparser instruments |
  | like our brand, 像我们品牌 | the brand colour as the accent, not the ground; the brand font for titles; the logo at the open and the end |

- **Brand.** Keep the base's light-and-dark structure so text stays readable, and bring the brand colour in as the accent first. A brand font must cover the film's language (Chinese glyphs for a Chinese film) and allow use in video. Logos and fonts come from the user.
- **A reference.** Name two or three things in it that make it work, map each to a section, and say which ones would touch §1 essence.
- **Keep the signature.** The native move is what makes the style recognisable: swap at most one.
- **Changes that travel together.** Faster motion needs denser sound. A darker palette needs the type contrast checked. A new material brings its own pitfalls into §9.
- **Up to five changes** per round when changing a library style; more are hard to judge. A change the film's language forces (a Chinese font when the base has none) doesn't count.
- **Draw the way the base draws.** Code draws everything unless the base is marked ✦: then the images still come from an image generator the user provides (AGENTS.md, Workflow, Brief), and code never draws stand-ins for them. Don't add image or video generation to a base that has none: the user may not have it. Anything that isn't code (pictures, fonts, stroke or map data, samples) is the user's own or openly licensed, as in TECHNIQUE.md §11, and named in `CREDITS`. A licence the user has to agree to is asked once, and their answer goes into `STYLE.md` so later films don't ask again. If something can't work, say so and offer the closest change code can draw.
- **What doesn't need a style.** Story, structure, opening, ending, cast, sets, pacing and voice (§11 *Variation space*) are free in every film. If that's all they want, they don't need their own style: they say it when they ask for a film.

When the plan is complete, show the user a short summary in their language: each decision, before and after, and what it costs. **Wait for their OK**, then write it down.

## 3. Write it down

Make the demo film's project folder now (`films/<slug>-test/` in a clone, `<slug>-test/` in the user's folder in skill mode) and work only there until §6. The draft style goes in its `style/` folder, with the files of the table above.

- **`STYLE.md`**:
  - *Change a library style*: a full copy of the base `STYLE.md` with the changes written into their sections, so it reads like any style prompt (no "see the base" gaps). Change the title to the new name and add one line under it: `Based on <base name> (<base slug>) from Lemo-Opuscar.`
  - *From a blank page*: all 11 sections written from the plan, with STYLE.md §10 *Engine* from the technique base for now (step 5 below points it at the style's own code). Under the title: `Made from a blank page; techniques from <base name> (<base slug>) in Lemo-Opuscar.`
  - When the default size isn't 1920×1080, one more line under the title: `Default size: 1080×1440.`
  - Links: the style's own `DEMO.md` and `demo/` (they exist after §5) stay relative; links to the base become `$LIB/styles/<base slug>/…`. Keep every pitfall in §9 that still applies, and add the ones the changes bring.
- **`CHANGES.md`** and **`style.json`** as in the table above.

## 4. Prove the look

Render one style frame with the real drawing code, starting from the base style's techniques (copy code into the project, never edit the library). Check it against the new `STYLE.md` and fix what's off, once.

- *Change a library style*: render the same frame a second time with the base's settings (its colours, materials and type; a stand-in font when the base's has no glyphs for the film's language), and put the two side by side, base on the left, so only the changes differ: `style/styleframe-vs-base.jpg` (`core/render/sheet.py` tiles stills).
- *From a blank page*: there's nothing to compare against. Show the frame on its own, next to the user's reference if they gave one.

Save the frame as `style/styleframe.jpg`. **Show it to the user and wait.** If they want more, update `STYLE.md` and `CHANGES.md` and render again. If it still isn't right after two rounds of their notes, say so and suggest a closer base.

## 5. The demo film (15–30 s)

A short film whose job is to show the style working, not a full production:

- **Topic**: the user's own if they give one; otherwise a simple one with movement and a little light (a kite on a windy beach, the first tram of the morning). Not the base demo's story.
- **Every row of `CHANGES.md` is clearly on screen** at least once, and the native move appears once.
- Music and sound effects, no voice and no subtitles unless the user asks (a voice is a separate test).
- Treatment: one structure is enough (no three candidates). No storyboard. DIRECTOR.md's counts are written for longer films: at this length one real silence and three kinds of camera move are enough.
- **Checks**, as for any film: DIRECTOR.md §11, with its one fix round (no LemoLab sign-off in the film).

Then save it into `style/`:

- the film and its poster as `test.mp4` and `test.jpg`;
- the source as `demo/`, with `CREDITS` and a `build.sh` that runs from there: `LIB=<path>` at the top, library files as `$LIB/…` (never `../..`, also in code copied from the base), and everything it writes going to `${OUT:-<a folder outside demo/>}`. Run it once from the saved folder with `OUT` set to a temporary folder, and check that `demo/` holds the same files afterwards. Code copied from the library keeps its MIT notice in `demo/CREDITS`; that is a licence, not a credit in the film;
- `DEMO.md`;
- From a blank page, point §10 *Engine* in `STYLE.md` at the files in `demo/` that draw the style, then at the technique base.

## 6. Keep it

Show the user the demo film: where it is, and each change with the second where it can be seen. Then ask with `AskUserQuestion`:

1. **Keep it as my style** (Recommended): check that the name and slug are still free, copy `style/` to `~/lemo-my-styles/<slug>/` (or the folder they want), add its row to `~/lemo-my-styles/README.md` (create it if it's missing: a title and a table with one row per style), and tell them where it is and how to use it ("Make a film in my <name> style about…").
2. **One more round**: change what they ask (§7), then ask again.
3. **Not now**: leave it in the project folder. Tell them its path, and that saying "keep the style in <path> as my style" later saves it then.

Only a kept style is theirs: listed when the skill starts, and found by name.

## 7. Revise or use it

- **Not right yet**: change `STYLE.md` and `CHANGES.md`, then render the style frame and the demo film again and replace `demo/` and `DEMO.md`. Change only what the user asks.
- **Using it**: find it through `~/lemo-my-styles/README.md`. Read its `STYLE.md` in place of a library `STYLE.md` and follow the normal workflow in `AGENTS.md`, treatment first, at the style's default size unless the user asks for another. For techniques, read the style's own `DEMO.md` and `demo/` first, then the base's (`$LIB/styles/<based_on>/DEMO.md`). The demo film is one example: never reuse its story, shots or timeline. The films are the user's: no LemoLab credit, no watermark.
- **After a library update**: if the base `STYLE.md` changed since `library_version`, mention it once and offer to bring the useful fixes into their copy. Don't change their style without asking.
