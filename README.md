<div align="center">

# Lemo-Opuscar

**A toolbox of film styles made in code: <!--n-->59<!--/n--> ready to use, and your own.**<br>
Pick a style or make one from scratch, bring your story, and let your coding agent direct.<br>
<sub><!--n-->59<!--/n--> 种影片风格，每种都配一支完全用代码做出来的短片 · 🇨🇳 中文用户请看 <a href="README.zh-CN.md">简体中文说明</a></sub>

<a href="https://lemomo-ai.github.io/lemo-opuscar/"><img alt="Watch the gallery" src="https://img.shields.io/badge/-%E2%96%B6%20Watch%20the%20gallery-E8553A?style=for-the-badge"></a> <a href="README.zh-CN.md"><img alt="简体中文" src="https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-555?style=for-the-badge"></a> <a href="https://github.com/lemomo-ai/lemo-opuscar/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/lemomo-ai/lemo-opuscar?style=for-the-badge&color=F5B700&label=stars"></a> <a href="#licence"><img alt="MIT · CC BY 4.0" src="https://img.shields.io/badge/licence-MIT%20%C2%B7%20CC%20BY%204.0-2EA44F?style=for-the-badge"></a>

<a href="https://trendshift.io/repositories/262645?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-262645" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/262645/daily?language=JavaScript" alt="lemomo-ai%2Flemo-opuscar | Trendshift" width="250" height="55"/></a>

⚠️ **Built for Claude.** The styles are tuned for Claude Opus 5.5;<br>
other models may not reproduce them well, so use them with care.

🆕 **2026-10-22 · [Edit & Documentary](https://lemomo-ai.github.io/lemo-opuscar/#edit-documentary)**: 8 styles cut from real footage, documents and data. [See them ↓](#edit--documentary)<br>
🆕 **2026-10-22 · [Make a style your own](#make-a-style-your-own)**: change a style or start blank, and keep it. [See how ↓](#make-a-style-your-own)<br>
🆕 **2026-10-16 · [Evidence Films](https://lemomo-ai.github.io/lemo-opuscar/#evidence-films)**: 8 styles that film real material, every number sourced. [See them ↓](#evidence-films)

<sub>Official repo: [github.com/lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) · by Lemomo ([@lemomo_ai](https://x.com/lemomo_ai))</sub>

</div>

## 🎬 Feature presentation: OPUSCAR 98

<table><tr>
<td width="50%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/opuscar98/"><img src="docs/opuscar98.jpg" alt="OPUSCAR 98 — 98 Years of Best Picture"></a><br><b>▶ The film</b> · 1927 – 2025 · 6:31<br><sub>One Clawd walks through all 98 Best Picture winners, each one redrawn in a style that fits the film.</sub></td>
<td width="50%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles"><img src="docs/opuscar98-styles.jpg" alt="OPUSCAR 98 — all 98 styles open"></a><br><b>All 98 styles, open</b> · 77 in 2D · 4 in 2.5D · 17 in 3D<br><sub>Each film's style, a frame and a style prompt to reuse on your own topic.</sub></td>
</tr></table>

<div align="center">

Every frame, every note and every cut was written in code by Claude Opus 5.5.<br>
[**▶ Watch**](https://lemomo-ai.github.io/lemo-opuscar/opuscar98/) · [**All 98 styles**](https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles) · [**Download 1080p**](https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/opuscar98.mp4)

</div>

## 👋 About me

I'm **Lemomo** ([@lemomo-ai](https://github.com/lemomo-ai)). More about me on my profile.

> **Not an awesome list.** Every film here was made by me, with Claude Opus 5.5.<br>
> The styles are tuned for Opus 5.5; other models may not reproduce them.

![All styles](docs/cover.jpg)

Every film was directed, drawn, scored and mixed by an AI agent writing code:

- 🎨 **Picture**: canvas and WebGL pages, rendered frame by frame
- 🎵 **Music**: original scores from free sample libraries
- 🎙️ **Voice**: text-to-speech narration

No video generation, no stock footage.

## How to use

Two ways in; the skill is the easiest.

### Option 1: install the skill (recommended)

In your terminal:

```sh
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
```

Then use it from any folder.

- On first use it downloads the guides, tools and style prompts to `~/lemo-opuscar`, shared by all your films.
- Each film's project, from source to finished video, goes in the folder you started from.
- For other agents, copy [`plugin/skills/lemo-opuscar/`](plugin/skills/lemo-opuscar/) into their skills folder.

### Option 2: clone the repo

```sh
git clone https://github.com/lemomo-ai/lemo-opuscar.git
cd lemo-opuscar
claude
```

Films go into `films/<name>/` inside the repo.

### Then just say what you want

> Make a 45-second film in the **watercolor** style about the coffee farm my family runs. Warm female narrator.

> Make a 40-second **LiDAR Survey** film about the old quarry in the hills behind our town, from public laser-scan data.

Name the style in English or Chinese; the [style index](styles/README.md) lists them all.

Not sure yet? With the skill installed, type `/lemo-opuscar:lemo-opuscar` and nothing else. It asks which language to use, then what you'd like to do: a film in a library style, [make a style your own](#make-a-style-your-own), or a film in a style you've saved.

It asks you once, up front:

- anything it can't decide about your topic;
- whether you have your own **voice, music or other material**;
- whether you want to see a **storyboard** first. Say yes and it stops once to show you the key shots in the real style; otherwise it goes straight to the finished film.

The agent reads three guides and works like a small studio:

| File | What it gives the agent |
|---|---|
| [`DIRECTOR.md`](DIRECTOR.md) | how to direct: story, sound, rhythm, camera, performance, self-checks |
| [`TECHNIQUE.md`](TECHNIQUE.md) | how to build: frame-by-frame rendering, voice, music, mixing |
| `styles/<style>/STYLE.md` | what the style looks and sounds like; the story is yours |

### Make a style your own

Everyone wants something different: their own brand colours, logo, characters, the tone of their channel. Now you can change a library style into one that's only yours, or make one from a blank page that the library doesn't have. It's the same process I use to add a new style to the library.

<table><tr>
<td width="50%" valign="top"><a href="https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/swiss-motion.mp4"><img src="docs/my-style-before.jpg" alt="A library style: Swiss Motion Graphics"></a><br><b>A library style</b> · Swiss Motion Graphics<br><sub>A flat grid, one signal colour, every move on the beat.</sub></td>
<td width="50%" valign="top"><a href="https://github.com/lemomo-ai/lemo-opuscar/releases/download/films/my-style-material-grid.mp4"><img src="docs/my-style-after.jpg" alt="My style: Material Grid"></a><br><b>My style</b> · Material Grid · ▶ 31 s demo film<br><sub>The Swiss grid, beat and type kept, the shapes made of clay, plastic, felt, glass and chrome: from above it reads as a poster, one tilt and it's a table of objects.</sub></td>
</tr></table>

**Two ways in.** Pick one after starting the skill, or say it in one line:

> I want to change the **Ukiyo-e** style into my own version.

> Start from a blank page: a chalk-on-blackboard style, warm and slow.

- **Change a library style**: it lists all 59 with the gallery link, and you type the one to change.
- **Start from a blank page**: describe the look in your own words, or share a picture or a film you like. Claude picks the closest library style as the technique base, tells you why, and you agree or pick another.

**Then five steps:**

1. **Plan it one question at a time.** Each question has a few options, the recommended one first, with the reason. Roughly:
   - what it's for: what kind of films, which platform (vertical feeds want 1080×1920 or 1080×1440), any brand colours, logo, fonts or recurring characters;
   - what to change: for a library style it first sorts the style into three groups, **safe to change** (palette, type, pace, sound, signature moves), **changes its character** (materials and rendering, the colour logic, camera grammar) and **can't change** (the style's essence: change that and it's a different style);
   - which way to take each part, and last, a name.

   Vague is fine: say "more premium" or "livelier" and it turns that into concrete changes to pick from. Too slow? Choose "free conversation", the last option on every question, and just talk it through; say "you decide" at any point and it fills in the rest with its recommendations. At most five changes a round when changing a library style; everything is drawn in code, no image generation.
2. **Review the summary.** Each part before, after, and what it costs. Nothing is written until you agree.
3. **See one style frame first**, drawn with the real code. When you changed a library style, the same frame is rendered in the original too, side by side: original left, yours right. Say what's off; if it still isn't right after two rounds, it says so and suggests a closer base.
4. **A 15–30 second demo film.** Every change is on screen, with music and sound effects. It checks the film and fixes it once before handing it over.
5. **Keep it when you're happy.** It asks: keep it as my style, another round, or not now. Until you say yes, everything stays in that project's folder.

Once kept, the style lives in `~/lemo-my-styles/<name>/`, shaped like a library style: the style prompt, what changed, the demo film and its source, so later films can reuse the techniques. Then name it like any other style: *"Make a 30-second film in my **Night Ukiyo-e** style about…"*. When you pick a style, your own are listed first.

Library updates and reinstalling never touch them. When the base style is updated later, Claude mentions it once and asks whether to bring the useful fixes into your copy. The steps Claude follows are in [`MY-STYLES.md`](MY-STYLES.md).

### Before you start

- A film takes an agent about 30–60 minutes and a fair amount of tokens.
- You need Node 20+, ffmpeg and Python 3.11+ (or [uv](https://docs.astral.sh/uv/)); the agent installs the rest.
- Default output 1920×1080, 24 fps; other sizes on request.

### Update or uninstall

Update, then restart Claude Code (the library in `~/lemo-opuscar` updates itself on the next film):

```sh
claude plugin marketplace update lemolab && claude plugin update lemo-opuscar@lemolab
```

After an update, ask for a film as usual; to make a style your own, see [above](#make-a-style-your-own).

Uninstall, then delete `~/lemo-opuscar`:

```sh
claude plugin uninstall lemo-opuscar@lemolab
```

Your own styles in `~/lemo-my-styles/` stay through updates and uninstalls; delete that folder yourself if you don't want them.

If a step stays stuck, [open an issue](https://github.com/lemomo-ai/lemo-opuscar/issues).

## The styles

Click a frame for its `STYLE.md`.

<!-- styles:start -->

### Edit & Documentary

<table>
<tr>
<td width="33%" valign="top"><a href="styles/caption-news/STYLE.md"><img src="docs/frames/caption-news.jpg" alt="Caption News"></a><br><b>Caption News</b><br><i>The Bee Ledger</i><br><sub>America lost 1.3 million bee colonies, yet the count rose 6 %: a news short that works with the sound off.</sub></td>
<td width="33%" valign="top"><a href="styles/newsreel/STYLE.md"><img src="docs/frames/newsreel.jpg" alt="1920s Newsreel"></a><br><b>1920s Newsreel</b><br><i>Knock-Knee Alert</i><br><sub>1926: the papers say the Charleston will ruin America&#x27;s knees; at Ford&#x27;s own picnic the kids dance it anyway.</sub></td>
<td width="33%" valign="top"><a href="styles/countdown/STYLE.md"><img src="docs/frames/countdown.jpg" alt="Live Countdown Split-screen"></a><br><b>Live Countdown Split-screen</b><br><i>Counting Itself Down</i><br><sub>The last minute of the Artemis II launch, uncut: one cell opens to nine, and they merge into one at ignition.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/city-symphony/STYLE.md"><img src="docs/frames/city-symphony.jpg" alt="Time-lapse Symphony"></a><br><b>Time-lapse Symphony</b><br><i>One Day in New York</i><br><sub>One day in New York in time-lapse: rivers of light, a grid on the sixteenths, 1899 beside today.</sub></td>
<td width="33%" valign="top"><a href="styles/visual-investigation/STYLE.md"><img src="docs/frames/visual-investigation.jpg" alt="Visual Investigation"></a><br><b>Visual Investigation</b><br><i>The Hindenburg: Four Minutes, 32 Seconds</i><br><sub>Newsreel, photos, testimony and the 1937 inquiry on one clock: five sources point to the same spot.</sub></td>
<td width="33%" valign="top"><a href="styles/kino-montage/STYLE.md"><img src="docs/frames/kino-montage.jpg" alt="Constructivist Montage"></a><br><b>Constructivist Montage</b><br><i>410 Days</i><br><sub>The Empire State&#x27;s 1931 brochure credits its builders; the site film and Hine&#x27;s photos answer: 2,500 a day.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/telestrator/STYLE.md"><img src="docs/frames/telestrator.jpg" alt="Sports Telestrator"></a><br><b>Sports Telestrator</b><br><i>Freeze Frame</i><br><sub>Down 3–0 at half-time, Fenerbahçe scored three in 12 minutes: freeze, draw, split screen, shot map.</sub></td>
<td width="33%" valign="top"><a href="styles/news-package/STYLE.md"><img src="docs/frames/news-package.jpg" alt="Broadcast News Package"></a><br><b>Broadcast News Package</b><br><i>The Week in AI</i><br><sub>Four AI stories from one week in a full on-air package: rundown, headline strap, price board, spec card.</sub></td>
</tr>
</table>

### Evidence Films

<table>
<tr>
<td width="33%" valign="top"><a href="styles/satellite-briefing/STYLE.md"><img src="docs/frames/satellite-briefing.jpg" alt="Satellite Briefing"></a><br><b>Satellite Briefing</b><br><i>The Map Still Says Sea</i><br><sub>A satellite follows the map to the Aral Sea and finds a desert; only the part someone dammed came back.</sub></td>
<td width="33%" valign="top"><a href="styles/briefing-board/STYLE.md"><img src="docs/frames/briefing-board.jpg" alt="Engineering Briefing Board"></a><br><b>Engineering Briefing Board</b><br><i>The Ship Decides</i><br><sub>Four bridge types are tested on one briefing wall, and the ship that must pass under picks the winner.</sub></td>
<td width="33%" valign="top"><a href="styles/lidar-survey/STYLE.md"><img src="docs/frames/lidar-survey.jpg" alt="LiDAR Survey"></a><br><b>LiDAR Survey</b><br><i>The Fields Under the Forest</i><br><sub>A laser survey strips the canopy off a Connecticut forest and finds 3.4 km of old farm walls.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/white-model/STYLE.md"><img src="docs/frames/white-model.jpg" alt="Projection on White Model"></a><br><b>Projection on White Model</b><br><i>How a Flattened City Grew Back</i><br><sub>A projector paints Rotterdam&#x27;s white model layer by layer, from the 1940 gap to today&#x27;s towers.</sub></td>
<td width="33%" valign="top"><a href="styles/data-physical/STYLE.md"><img src="docs/frames/data-physical.jpg" alt="Data Physicalization"></a><br><b>Data Physicalization</b><br><i>Two Spirals</i><br><sub>Twelve years of wind and solar stacked as real plates, spiralling round a walnut dial until solar overtakes.</sub></td>
<td width="33%" valign="top"><a href="styles/teardown/STYLE.md"><img src="docs/frames/teardown.jpg" alt="Exploded Teardown"></a><br><b>Exploded Teardown</b><br><i>21 Keys, Opened</i><br><sub>Half an open-source keyboard comes apart in one orbit, down to the chip, then closes with its real dimensions.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/microscope/STYLE.md"><img src="docs/frames/microscope.jpg" alt="Microscope Story"></a><br><b>Microscope Story</b><br><i>Measured Blue</i><br><sub>One continuous move from a liver slide to a single nucleus; two circles, counted pixel by pixel, differ 2.4 times in blue.</sub></td>
<td width="33%" valign="top"><a href="styles/archive-lighttable/STYLE.md"><img src="docs/frames/archive-lighttable.jpg" alt="Archive Light Table"></a><br><b>Archive Light Table</b><br><i>Two Seconds Short</i><br><sub>The telegram said 57 seconds; under a loupe, the Wrights&#x27; glass negatives and the archive say 59.</sub></td>
</tr>
</table>

### Hand-drawn & Painting

<table>
<tr>
<td width="33%" valign="top"><a href="styles/crayon-book/STYLE.md"><img src="docs/frames/crayon-book.jpg" alt="Crayon Picture Book"></a><br><b>Crayon Picture Book</b><br><i>The Moon Can&#x27;t Sleep</i><br><sub>The moon can&#x27;t sleep, so a little girl climbs onto the roof to sing it a lullaby.</sub></td>
<td width="33%" valign="top"><a href="styles/watercolor/STYLE.md"><img src="docs/frames/watercolor.jpg" alt="Watercolor Brush"></a><br><b>Watercolor Brush</b><br><i>Follow the Rain</i><br><sub>Follow the rain from Australia&#x27;s red desert heart to its green coast in one unbroken painted walk.</sub></td>
<td width="33%" valign="top"><a href="styles/ink-wash/STYLE.md"><img src="docs/frames/ink-wash.jpg" alt="Chinese Ink Wash"></a><br><b>Chinese Ink Wash</b><br><i>The Swordsman and the River</i><br><sub>A swordsman crosses the river on the water and splits the current with a single stroke.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/impasto/STYLE.md"><img src="docs/frames/impasto.jpg" alt="Impasto Oil Painting"></a><br><b>Impasto Oil Painting</b><br><i>The Colour of Rain</i><br><sub>In a grey, rainy square one red umbrella opens, and a waltz paints the whole plaza in colour.</sub></td>
<td width="33%" valign="top"><a href="styles/one-line/STYLE.md"><img src="docs/frames/one-line.jpg" alt="One-line Drawing"></a><br><b>One-line Drawing</b><br><i>The Line That Never Lifted</i><br><sub>One unbroken line draws a whole life, then the pen passes to a child.</sub></td>
<td width="33%" valign="top"><a href="styles/whiteboard/STYLE.md"><img src="docs/frames/whiteboard.jpg" alt="Whiteboard Explainer"></a><br><b>Whiteboard Explainer</b><br><i>Einstein in Your Pocket</i><br><sub>How your phone knows where you are: GPS, atomic clocks, and the 38 microseconds relativity adds every day.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/urban-sketch/STYLE.md"><img src="docs/frames/urban-sketch.jpg" alt="Urban Sketch · Pen &amp; Wash"></a><br><b>Urban Sketch · Pen &amp; Wash</b><br><i>Where the Wind Went</i><br><sub>A park that is only a pen sketch; wherever the wind carries her straw hat, colour follows.</sub></td>
</tr>
</table>

### East Asian Traditions

<table>
<tr>
<td width="33%" valign="top"><a href="styles/shadow-puppet/STYLE.md"><img src="docs/frames/shadow-puppet.jpg" alt="Shadow Puppetry"></a><br><b>Shadow Puppetry</b><br><i>Hou Yi Shoots the Suns</i><br><sub>Ten suns scorch the earth until the archer Hou Yi draws his bow, told with leather puppets on a lit screen.</sub></td>
<td width="33%" valign="top"><a href="styles/ukiyoe/STYLE.md"><img src="docs/frames/ukiyoe.jpg" alt="Ukiyo-e"></a><br><b>Ukiyo-e</b><br><i>Toward the Mountain</i><br><sub>A traveller walks toward a distant mountain; every shot is a woodblock print, a great wave at the climax, the mountain and the whole scroll at the end.</sub></td>
<td width="33%" valign="top"><a href="styles/papercut-red/STYLE.md"><img src="docs/frames/papercut-red.jpg" alt="Red Paper-cut"></a><br><b>Red Paper-cut</b><br><i>Nian Comes to Town</i><br><sub>On New Year&#x27;s Eve the beast Nian comes to town, and one girl&#x27;s giant paper-cut lights up the village to scare it off.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/paper-lantern/STYLE.md"><img src="docs/frames/paper-lantern.jpg" alt="Paper-cut Lightbox"></a><br><b>Paper-cut Lightbox</b><br><i>A Mooncake&#x27;s Longing</i><br><sub>A single mooncake tells the Mid-Autumn story of reunion and longing inside a glowing paper-cut lightbox.</sub></td>
</tr>
</table>

### Print & Printmaking

<table>
<tr>
<td width="33%" valign="top"><a href="styles/risograph/STYLE.md"><img src="docs/frames/risograph.jpg" alt="Risograph Print"></a><br><b>Risograph Print</b><br><i>Sunday Ride</i><br><sub>A Sunday-morning bike ride through the city — bakery, park, riverside — each stop adding an ink until three misregistered plates overprint.</sub></td>
<td width="33%" valign="top"><a href="styles/halftone-dossier/STYLE.md"><img src="docs/frames/halftone-dossier.jpg" alt="Halftone Dossier"></a><br><b>Halftone Dossier</b><br><i>Case File: Chubby</i><br><sub>A chubby orange cat stands trial for testing gravity and 4 a.m. parkour, and walks free.</sub></td>
<td width="33%" valign="top"><a href="styles/woodcut/STYLE.md"><img src="docs/frames/woodcut.jpg" alt="Woodcut Print"></a><br><b>Woodcut Print</b><br><i>The Bell Founder</i><br><sub>A village spends a whole winter casting one bell; the first time it rings, the snow stops.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/engraving/STYLE.md"><img src="docs/frames/engraving.jpg" alt="Copperplate Engraving"></a><br><b>Copperplate Engraving</b><br><i>The Honeybee, Plate VII</i><br><sub>A natural-history plate engraves itself: the burin cuts the copper, the bee builds up line by line, and a watercolour wash brings it to life.</sub></td>
<td width="33%" valign="top"><a href="styles/silkscreen-poster/STYLE.md"><img src="docs/frames/silkscreen-poster.jpg" alt="Silkscreen Travel Poster"></a><br><b>Silkscreen Travel Poster</b><br><i>Three Trails</i><br><sub>Three trail posters are screen-printed one ink at a time, then climbed in one long take from noon to dusk.</sub></td>
</tr>
</table>

### Graphic & Type

<table>
<tr>
<td width="33%" valign="top"><a href="styles/swiss-motion/STYLE.md"><img src="docs/frames/swiss-motion.jpg" alt="Swiss Motion Graphics"></a><br><b>Swiss Motion Graphics</b><br><i>Five Rules for a Poster</i><br><sub>A concert poster lays itself out by five Swiss design rules; the fifth is to break just one.</sub></td>
<td width="33%" valign="top"><a href="styles/spy-titles/STYLE.md"><img src="docs/frames/spy-titles.jpg" alt="60s Spy Title Sequence"></a><br><b>60s Spy Title Sequence</b><br><i>The Velvet Cipher</i><br><sub>Opening titles for an imaginary 1964 spy film: a chase for a stolen key until the shapes lock into the title.</sub></td>
<td width="33%" valign="top"><a href="styles/art-deco/STYLE.md"><img src="docs/frames/art-deco.jpg" alt="Art Deco"></a><br><b>Art Deco</b><br><i>Midnight at the Starlight Hotel</i><br><sub>A grand hotel, 1930: a bellboy races lifts and revolving doors to deliver one letter before midnight.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/blueprint/STYLE.md"><img src="docs/frames/blueprint.jpg" alt="Blueprint"></a><br><b>Blueprint</b><br><i>Patent Pending: The Cloud Catcher</i><br><sub>An inventor&#x27;s blueprint draws, explodes and assembles a cloud-catching machine, and its revision cloud starts to rain.</sub></td>
<td width="33%" valign="top"><a href="styles/stained-glass/STYLE.md"><img src="docs/frames/stained-glass.jpg" alt="Stained Glass"></a><br><b>Stained Glass</b><br><i>The Dragon of the East Window</i><br><sub>Sunlight crosses a cathedral window from dawn to dusk, waking each pane of a knight-and-dragon tale.</sub></td>
<td width="33%" valign="top"><a href="styles/pictogram-motion/STYLE.md"><img src="docs/frames/pictogram-motion.jpg" alt="Pictogram Motion"></a><br><b>Pictogram Motion</b><br><i>Aichi-Nagoya 2026 — All 43 Sports</i><br><sub>All 43 sports of the 2026 Asian Games as beat-locked geometric pictograms.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/ascii-crt/STYLE.md"><img src="docs/frames/ascii-crt.jpg" alt="ASCII / CRT Terminal"></a><br><b>ASCII / CRT Terminal</b><br><i>Tranquility.log</i><br><sub>A moon-base AI wakes after forty years to a signal from Earth, and replies by drawing “home” in characters.</sub></td>
</tr>
</table>

### Information & Keynote

<table>
<tr>
<td width="33%" valign="top"><a href="styles/dataviz/STYLE.md"><img src="docs/frames/dataviz.jpg" alt="Data Storytelling"></a><br><b>Data Storytelling</b><br><i>A Hundred Summers</i><br><sub>A hundred years of summer temperatures, where the chart itself tells the story.</sub></td>
<td width="33%" valign="top"><a href="styles/iso-infographic/STYLE.md"><img src="docs/frames/iso-infographic.jpg" alt="Isometric Infographic"></a><br><b>Isometric Infographic</b><br><i>From Bean to Cup</i><br><sub>A coffee&#x27;s journey from the plantation to your hands, across one isometric world.</sub></td>
<td width="33%" valign="top"><a href="styles/dark-keynote/STYLE.md"><img src="docs/frames/dark-keynote.jpg" alt="Dark Tech Keynote"></a><br><b>Dark Tech Keynote</b><br><i>Room to Think</i><br><sub>Launch film for Tidy, a fictional app: one buried cursor snaps hundreds of windows back into place.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/living-screencast/STYLE.md"><img src="docs/frames/living-screencast.jpg" alt="Living Screencast"></a><br><b>Living Screencast</b><br><i>Clawd Moves In</i><br><sub>Clawd hops out of the terminal into the Claude app and acts out plan mode and self-checks in one take.</sub></td>
<td width="33%" valign="top"><a href="styles/hologram-hud/STYLE.md"><img src="docs/frames/hologram-hud.jpg" alt="Sci-fi Hologram HUD"></a><br><b>Sci-fi Hologram HUD</b><br><i>Volt · Spec Scan</i><br><sub>An e-bike is scanned into a hologram; target boxes lock onto the battery, motor and brakes.</sub></td>
</tr>
</table>

### Cartoon & Anime

<table>
<tr>
<td width="33%" valign="top"><a href="styles/rubber-hose/STYLE.md"><img src="docs/frames/rubber-hose.jpg" alt="1930s Rubber Hose Cartoon"></a><br><b>1930s Rubber Hose Cartoon</b><br><i>Coffee Cup Chase</i><br><sub>A coffee cup chases a runaway sugar cube around the kitchen, 1930s-cartoon style.</sub></td>
<td width="33%" valign="top"><a href="styles/cel-anime-80s/STYLE.md"><img src="docs/frames/cel-anime-80s.jpg" alt="80s Cel Anime"></a><br><b>80s Cel Anime</b><br><i>City Lights, 1987</i><br><sub>A courier girl rides through a rain-soaked neon city to deliver a tape before the dawn launch.</sub></td>
<td width="33%" valign="top"><a href="styles/scifi-toon/STYLE.md"><img src="docs/frames/scifi-toon.jpg" alt="Sci-Fi Sitcom Toon"></a><br><b>Sci-Fi Sitcom Toon</b><br><i>Coffee Run</i><br><sub>A jaded genius opens a portal just to buy coffee and tumbles through ever-stranger universes.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/midcentury-toon/STYLE.md"><img src="docs/frames/midcentury-toon.jpg" alt="Mid-century Cartoon"></a><br><b>Mid-century Cartoon</b><br><i>Meet Pip</i><br><sub>A robot vacuum set up in three steps, told like a 1950s classroom film.</sub></td>
</tr>
</table>

### Games

<table>
<tr>
<td width="33%" valign="top"><a href="styles/pixel-rpg/STYLE.md"><img src="docs/frames/pixel-rpg.jpg" alt="16-bit Pixel RPG"></a><br><b>16-bit Pixel RPG</b><br><i>The Last Save Point</i><br><sub>At the final boss door a hero saves the game, and the save screen replays the whole journey.</sub></td>
<td width="33%" valign="top"><a href="styles/hd-2d/STYLE.md"><img src="docs/frames/hd-2d.jpg" alt="HD-2D"></a><br><b>HD-2D</b><br><i>The Lampbearer</i><br><sub>The lighthouse goes dark; a girl carries the last flame through a night forest and up the storm cliffs.</sub></td>
<td width="33%" valign="top"><a href="styles/microgame/STYLE.md"><img src="docs/frames/microgame.jpg" alt="Microgame Frenzy"></a><br><b>Microgame Frenzy</b><br><i>Five-Second Astronaut</i><br><sub>A clumsy cadet survives a five-second boot camp, faster and faster, until the boss: landing home.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/game-show/STYLE.md"><img src="docs/frames/game-show.jpg" alt="Game Show Flat"></a><br><b>Game Show Flat</b><br><i>Rhythm of AI, 1997 → 2026</i><br><sub>The history of AI as a rhythm game: models take the stage on the beat, and a report card closes the show.</sub></td>
</tr>
</table>

### Cinema & Eras

<table>
<tr>
<td width="33%" valign="top"><a href="styles/silent-film/STYLE.md"><img src="docs/frames/silent-film.jpg" alt="1920s Silent Film"></a><br><b>1920s Silent Film</b><br><i>The Runaway Loaf</i><br><sub>A baker&#x27;s boy chases a runaway loaf downhill, then breaks it in half for a hungry girl.</sub></td>
<td width="33%" valign="top"><a href="styles/backrooms/STYLE.md"><img src="docs/frames/backrooms.jpg" alt="Liminal Found Footage"></a><br><b>Liminal Found Footage</b><br><i>Night Shift Orientation</i><br><sub>A new night-shift hire films their first night in an endless yellow office, following the rules on the wall.</sub></td>
</tr>
</table>

### Materials & 3D

<table>
<tr>
<td width="33%" valign="top"><a href="styles/brick-toy/STYLE.md"><img src="docs/frames/brick-toy.jpg" alt="Brick Toy"></a><br><b>Brick Toy</b><br><i>Rocket from Spare Parts</i><br><sub>A brick astronaut builds a rocket from spare parts and flies to a brick moon.</sub></td>
<td width="33%" valign="top"><a href="styles/paper-popup/STYLE.md"><img src="docs/frames/paper-popup.jpg" alt="Paper Pop-up Book"></a><br><b>Paper Pop-up Book</b><br><i>Pip&#x27;s Paper Adventure</i><br><sub>A pop-up book opens on a desk; a sprite named Pip adventures through paper worlds and jumps out into ours.</sub></td>
<td width="33%" valign="top"><a href="styles/tilt-shift/STYLE.md"><img src="docs/frames/tilt-shift.jpg" alt="Tilt-Shift Miniature"></a><br><b>Tilt-Shift Miniature</b><br><i>Toy Town Rush Hour</i><br><sub>Morning rush hour in a town that looks like a model: traffic, trains and tiny people.</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="styles/lowpoly-island/STYLE.md"><img src="docs/frames/lowpoly-island.jpg" alt="Low-poly Isometric Island"></a><br><b>Low-poly Isometric Island</b><br><i>The Island That Grew</i><br><sub>An island and its village grow tile by tile from an empty sea, each tile a note, into a starry night.</sub></td>
<td width="33%" valign="top"><a href="styles/glass-product/STYLE.md"><img src="docs/frames/glass-product.jpg" alt="Glass Product Render"></a><br><b>Glass Product Render</b><br><i>Aura — Hear the Light</i><br><sub>Unboxing and close-ups of Aura, fictional glass earbuds, in strip-light sweeps and caustics.</sub></td>
</tr>
</table>
<!-- styles:end -->

## Star history

<a href="https://www.star-history.com/#lemomo-ai/lemo-opuscar&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=lemomo-ai/lemo-opuscar&type=Date" />
 </picture>
</a>

### Thank you for every star

A thank-you film at each milestone, made in code like everything here.<br>
Click a poster to watch on the <a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/">thank-you page</a>.

<table><tr>
<td width="20%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars6000"><img src="docs/thanks/thanks-6000.jpg" alt="6,000 stars · The Quilt (50 s)"></a><br><sub>6,000 stars · The Quilt (50 s)</sub></td>
<td width="20%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars3000"><img src="docs/thanks/thanks-3000.jpg" alt="3,000 stars · Class Photo (48 s)"></a><br><sub>3,000 stars · Class Photo (48 s)</sub></td>
<td width="20%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars2000"><img src="docs/thanks/thanks-2000.jpg" alt="2000 stars · Refresh (50 s)"></a><br><sub>2,000 stars · Refresh (50 s)</sub></td>
<td width="20%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars800"><img src="docs/thanks/thanks-800.jpg" alt="800 stars · Reverse Shot (39 s)"></a><br><sub>800 stars · Reverse Shot (39 s)</sub></td>
<td width="20%" valign="top"><a href="https://lemomo-ai.github.io/lemo-opuscar/thanks/#stars300"><img src="docs/thanks/thanks-300.jpg" alt="300 stars · The Lamplighter (18 s)"></a><br><sub>300 stars · The Lamplighter (18 s)</sub></td>
</tr></table>

## Licence

Made by **LemoLab × Claude Opus 5.5**.

- **Code and docs**: MIT.
- **Demo films and their stills** (in `styles/`, the gallery and the Releases): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You may share, adapt and use them commercially; credit **LemoLab** with a link to this repository, and say if you changed them.
- **Films you make with the library**: yours, no credit needed.
- **Third-party assets in the demos**: they keep their own licences (see each demo's `CREDITS`).
- **Three voice tracks are not CC BY 4.0**: the shouts in Game Show Flat (macOS system voices, `say`), the narration in Paper-cut Lightbox (Microsoft Edge TTS), which will be re-voiced with Kokoro, and the narration in Broadcast News Package (Doubao TTS, under Volcengine's terms). They are excluded from the licence above. Don't reuse them; in your own films use Kokoro (the default) or a voice you have the right to use.

You are responsible for the materials you use in your films.

## More from LemoLab

- 📸 **[lemo-wake](https://github.com/lemomo-ai/lemo-wake)**: one picture in, a seamless loop of about five seconds out.
- 🍋 **[lemo-mod](https://github.com/lemomo-ai/lemo-mod)**: re-skin Claude Code with 21 styles, in the terminal and the desktop app.
- 🟥 **[Stampy](https://github.com/lemomo-ai/lemo-stampy)**: a tiny Mac menu bar stamp that marks your copies "For XX use only".

---

<div align="center">

⭐ **Star this repo**<br>
👀 **Watch → Custom → Releases** to hear about new versions<br>
𝕏 Follow [@lemomo_ai](https://x.com/lemomo_ai)

<sub>LemoLab · by Lemomo</sub>

</div>

### Narration writing checks

For script review without producing a film, use the Chinese editing skill
[`stop-slop-cn`](plugin/skills/stop-slop-cn/SKILL.md), then run
`scripts/narration-detect films/<slug>/SCRIPT_vN.md` and the
[`promptfoo narration evaluations`](evals/narration/README.md).
The detector reads only `## 口播` and writes a report in the film's `notes/`;
its PASS means the documented surface thresholds passed, not audience approval.
The detect component vendors lieflat-less-ai-tone under **CC BY-NC 4.0
(noncommercial use only)**; see its [notice](vendor/lieflat-less-ai-tone/README.md).
Keep rewrite comparisons in `notes/` and preserve the original script unless
its author explicitly requests an edit. No voice or video production is required.
