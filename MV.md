# Making a music video

The user brings a song and wants a video for it: a fan video (二创 MV), a lyric video, a video for their own track. Here **the song is fixed and the picture follows it**: no voice-over, no score of your own, and the cue map comes out of the song instead of being written. Everything else in [`DIRECTOR.md`](DIRECTOR.md) holds (story, camera, performance, the review loop, delivery); this guide says what changes. Tools are in [`core/README.md`](core/README.md#music-videos), styles in [`styles/README.md`](styles/README.md).

```
song (URL or file) ──► get_song.py ──► song.wav
                                         ├─► lyrics.py search ──► reference lyrics ──► lyrics.py align ──► lyrics.json (every character timed)
                                         │   lyrics.py ocr (lyrics burned into the video) ─┘
                                         │                                              ▲ correct by ear, translate
                                         └─► song.py ──► song.json (beats, bars, sections, drum hits, energy)
style chosen from the song ──► TREATMENT.md (section plan on the song's bars) ──► picture: render(t) reads song.json + lyrics.json
──► mux with the song itself ──► <name>.mp4 + <name>.srt
```

Install the tier first: `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv` (about 1.3 GB, mostly PyTorch for the vocal split; a few minutes). Everything here runs offline after that, except fetching the song and searching lyrics.

## 1. The brief

Ask once, in one message, only what the request doesn't already answer (AGENTS.md, Workflow):

- **The song**: a link (Bilibili, YouTube, NetEase…) or a file. If the platform has several versions (studio, live, cover, sped-up), which one. A live recording is fine; its lyrics often differ from the studio ones (§2).
- **The style**: the user may name one. If not, you pick it from the song (§4) and say why in the brief summary; offer two alternatives in one line each.
- **Length**: the whole song by default. Over about 4 minutes, offer a cut (one verse and the last chorus, or the "TV size" around 90 s) and say a full one costs more time and tokens.
- **Lyrics on screen**: in the original language only (default), bilingual, or translated only. A song in a language the user doesn't write in is bilingual by default.
- **Format**: 1920×1080 by default; 1080×1920 for Douyin, Kuaishou, Reels, Shorts (`--size 1080x1920` on every render tool).
- **Rights**, said as information, not as a question: the video carries the song, and who may publish it is the user's responsibility. Platform licences for derivative works (Bilibili's and Douyin's music programmes, for example) cover publishing **on that platform**; they don't make the song free to put elsewhere. Credit the artist in the video's description.

Their own lyrics file, artwork or logo: ask whether they have them. Never draw the artist's face, a band logo or an album cover unless the user owns them or says they have the right (DIRECTOR.md §12).

## 2. Get the song and its words

```sh
P=<project>
.venv/bin/python core/mv/get_song.py "<url or file>" $P/song [--video]              # → song.wav, source.json, cover.jpg (+ video.mp4)
.venv/bin/python core/mv/lyrics.py search "<title>" --artist "<artist>" --dur <s> --out $P/lyrics
.venv/bin/python core/mv/lyrics.py align $P/song/song.wav <chosen reference or lyrics.txt> --out $P/lyrics
```

**Choose the reference.** `refs.json` lists what the lyric sites have, best match first. Read the top few before choosing: a site's lyric may belong to a cover, be AI-made (Kugou marks some `天琴实验室AI生成`), be a fan transcription, or follow a studio version the live one departs from. Prefer the original artist's; when two disagree, the voice decides. If nothing is found and the video has the lyrics burned in (most fan uploads and short-video clips do), get it with `--video` and read them off the picture: `lyrics.py ocr $P/song/video.mp4 --out $P/lyrics` writes `ocr.lrc`, each line timed to when it appears. It is far more reliable than the ear for dialect, rap and slang, and catches the ad-libs too; check it against a few frames by eye (OCR can drop a rare character even at full confidence), then align on it. Only with neither, `lyrics.py transcribe` writes a draft from the voice alone: correct it by ear, line by line, before aligning. Subtitles leave out what the audio bleeps or the uploader censored, so listen for it.

**Align, then correct by ear.** `align` prints every line with its time and how much of it the voice matched. Then:

- `?` weak and `!` guess lines: listen to that stretch with `lyrics.py listen song.wav <t0 − 2> <t1 + 2> --out <dir>`. It transcribes with context and prints every word with its time. If the singer sings something else, fix the text; if the line starts somewhere else, **pin** it: write `@<seconds> ` before the line in the lyrics file (`@74.5 <the line>`).
- Whisper hears sung words worst where the same phrase repeats (a hook sung twice in a row), where the crowd sings along in a live recording, and over long held notes. Those are the lines to pin.
- `extra` phrases are sung but in no line: a live ad-lib, a missing line, a crowd shout, or noise. Add the real ones to the lyrics file as their own lines.
- Edit the lyrics file and run `align` again; the transcription is cached, so it takes seconds. Repeat until no line is flagged that you haven't listened to. If a human is around, ask them to spot-check the pinned lines.
- One line in `lyrics.json` = one line on screen. Split a long sung line in the text file where the singer breathes; merge two short ones the same way.

Keep the lyrics file you aligned (`lyrics.txt` or the `.lrc`) in the project: `build.sh` re-runs `align` from it.

**Translate** when the brief asks for it: add a field per line in `lyrics.json` (`"en": "…"`). Translate the meaning and the register (slang stays slang, a pun becomes a pun or a plain line, never a footnote), line for line with the singing, short enough to read in the line's sung time. Names and in-jokes the audience won't know: keep them, don't explain them on screen.

## 3. Map the song

```sh
.venv/bin/python core/mv/song.py $P/song/song.wav --out $P/song/song.json --sheet $P/song/song.png --lyrics $P/lyrics/lyrics.json
```

Look at `song.png` before anything else: waveform, bar numbers, sections (same letter = sounds alike), kick (red) and snare (green) hits, the **moments** (purple triangles) and the lyric lines on top. Then:

- **Check the tempo by ear.** Count four bars against the song; if the bars run at half or double speed, run again with `--bpm <what you hear>`.
- **Name the sections** in your treatment: intro, verse, pre-chorus, chorus, bridge, break, outro. Use the letters, the energy and the lyrics; a repeated lyric over a returning letter is the chorus. The tool only cuts; it can't tell a hook from a verse.
- **Find the turns**: the silences and drops (an energy dip with no kick), the key change, the line the song pivots on. These are where your native move and your signature shot go.
- **List the moments.** `moments` are drum hits that land right after a gap or a dip: the band stops on the last word, then everything comes back in at once. These are the hits the audience feels in the body. Add to the list by ear the punchlines the music can't show: a one-word line, a question thrown at the listener, the twist. Every item on this list gets a planned hit (§5); write them into the treatment's sync map.

`song.json` replaces the cue map of DIRECTOR.md §7: you don't write a tempo grid, you read it. Load it in the page (`fetch('song.json')`) next to `lyrics.json`, and put every cut and key action on a time taken from them, never on a hand-typed second.

## 4. Choose the style from the song

When the user hasn't named a style, listen first, then choose. What decides it, in this order:

1. **The world of the lyrics**: where it happens, what objects and people it names, the culture it comes from. A song about exams lives on paper; a song about a night drive lives in light.
2. **Tone**: earnest, ironic, self-mocking, angry, tender. A comic song in a solemn style is a joke only if you mean it.
3. **The energy curve and density**: a dense rap needs a style that can carry a lot of type and fast change (graphic, print, doodle styles); a slow ballad wants one with long, living holds (painting, ink, paper light).
4. **Era and genre**: last, and only as a hint. Genre clichés (neon for synthwave, ink for guofeng) are the first idea everyone has.

Suggest the one you'd choose plus two alternatives, one line each, in the brief summary. Any style in the library works for a music video; read its `STYLE.md` as usual and apply this guide on top.

## 5. The treatment

Write `TREATMENT.md` as DIRECTOR.md §4 asks, with these changes:

- **Three candidate concepts** instead of structures, drawn from the kinds of music video (mix them freely):
  - *narrative*: a story that runs alongside the lyrics, or against them;
  - *performance*: a drawn performer sings or raps, lip-synced from the character times in `lyrics.json`;
  - *concept*: one visual idea transformed section by section;
  - *lyric-led*: the words themselves are the picture.
- **Section plan instead of a beat sheet**: one row per section, with its bars, the lyric lines, the energy, the picture idea, the camera and what changes from the last time this section played.
- **Benchmark**: one or two music videos (not films) for this song's genre and this style, with what to learn and what not to take.
- No voice casting, no score and no sound design table (§8).

Directing rules that matter more in a music video:

- **The chorus is the visual hook.** Give it one image the audience recognises at every return, and escalate it each time: a new angle, more elements, a colour turned up, the camera finally moving. The same shot three times is a loop, not a hook.
- **Picture density follows the song's energy.** Cut and move more where the energy is high, hold and breathe where it drops. The quietest bar of the song gets the stillest frame.
- **Don't illustrate every word.** One image per line at most, often one per couplet. Pick the words that carry the line (a name, an object, a verb) and let the rest be type. Drawing every noun is "mickey-mousing" and reads as a slideshow.
- **The song's turn gets the native move.** The twist line, the drop after the silence, the last chorus: that is where the medium does what only it can.
- **The ending is the song's ending.** Let the last chord ring on a held frame; don't cut to black on the final beat unless the song stops dead.
- **Hit the moments (§3).** Build tension on the line and release it on the hit: push in slowly while the line is sung, stand still on the gap, then on the hit put down the biggest mark of the section, shake, snap the camera back out. A cut or a page turn on a moment **starts** on the hit; a turn timed to *land* on it is already moving during the gap and wastes it. Viewers notice an unmarked drum entry more than any other miss.
- **What the lyrics name, show for real.** When a line names something people know (a game, a brand, a snack, a phone app), bring that thing into the picture as an object of its world, in its real form (the exact product, the screen as it really looks, not a generic stand-in). A vague stand-in kills the joke. If recognising it needs a trademark or logo, say so to the user once and let them decide (DIRECTOR.md §12); keep it out of anything that goes into this library.

## 6. Lyrics on screen

The lyrics are part of the picture: set them in the style's type (`STYLE.md` §4) as its native writing, inscription, caption or sign, never as a default subtitle bar.

- **Timing.** A line appears on its first sung character and leaves after its last (`t0`, `t1` in `lyrics.json`); it may lead by one or two frames, never lag. Character-by-character reveals use `chars[].t0`. Snap every time to the frame: `Math.round(t * 24) / 24`.
- **Song time, not reading time.** Sung lines follow the singer, so DIRECTOR.md §7's reading-time rule doesn't apply to them: keep them out of `window.TEXTS`, so `readcheck.mjs` checks only your other titles and labels. Instead, hold every line at least 0.8 s (merge a shorter one with its neighbour for display) and never let two lines overlap at the same size.
- **Dense rap.** Not every line can be big. Pick the hero words of each bar and set them large in the picture; the full line runs as a smaller band. The hero words are the ones your images answer.
- **Bilingual.** The translation sits under the original, smaller and quieter, and changes with it.
- **Subtitles file.** Export the lines as `.srt` for the platform: `cues.json` from `lyrics.json` (`[{t0, t1, text}]`, with the translation on a second line when bilingual) through `core/render/srt.py`.

## 7. Sync

- **Cuts land on bar lines** (`downbeats`), not on every one: a cut every bar is a slideshow. Inside a section, move on beats (`beats`), accent on snares and kicks (`hits`), let small things tick on hats.
- **Drops and breaks** (energy dips in `bars`): stop the camera, empty the frame, or hold one image; the first hit after the break is one of the strongest moments in the video (DIRECTOR.md §6, silence before the peak).
- **Performers** lip-sync from `chars`: open the mouth on each character's `t0`, close between words.
- **Live recordings** have loose drums: the kick may skip the downbeat in some bars. Put events that belong on the bar line on the bar (`on: "bar"`), not on the nearest detected kick, and trust your ear.
- **Check it**: give every timed event in `window.EV` an `on` field naming what it lands on (`"bar"`, `"beat"`, `"kick"`, `"snare"`, `"hat"`, `"line"` for a lyric line start), export with `events.mjs`, then run `.venv/bin/python core/mv/synccheck.py <project>/events.json <project>/song/song.json --lyrics <project>/lyrics/lyrics.json`. Aim for every event within one frame (42 ms at 24 fps).

## 8. Sound

The song is the soundtrack. Mux the song itself (`sh core/render/mux.sh out/video.mp4 song/song.wav <name>.mp4 24`): `mux.sh` normalises it to −14 LUFS, which is all the mastering it needs. No voice-over, no score.

Sound effects only where the song leaves room (an intro, a break, the tail), in the style's sound palette, well under the music (about −18 dB), and never over the vocal. Most music videos need none.

**A cut version** (§1): edit the song on bar lines (downbeats from `song.json`), with a 20–50 ms crossfade (`ffmpeg … acrossfade`), and run `lyrics.py align` and `song.py` again on the cut file, so every time comes from the audio you deliver.

## 9. Review with the user

Renders are fast, so work in rounds:

1. Before showing anything, review it yourself: a contact sheet every 3 s across the whole song (`still.mjs --range` + `sheet.py`), then frame by frame around every moment, every page turn or cut and every object that enters, then `synccheck.py`.
2. Deliver the first full version as soon as it is clean, and ask the user to watch it **with sound**. You can't hear the result; they can.
3. Notes come back as specific moments ("make this hit harder", "that's the wrong kind of object"). Fix exactly those, re-render, re-run `synccheck.py`, and say per note what changed. A note about one moment usually applies to its siblings: if the user asks for a stronger hit on one drum entry, check every other moment for the same weakness.

## 10. Before you deliver

DIRECTOR.md §11, plus:

- Watch it once at full speed with sound, and once with the sound off: without the song, does the picture still have a shape (setup, chorus hook, turn, ending)?
- Every lyric line on screen matches what is sung (spot-check the flagged lines from §2 in the final render).
- `synccheck.py` is clean, and the cuts feel on the beat to you (trust your ear over the number).
- No frame shows the artist's likeness, logo or cover art the user hasn't cleared.

**Deliver** what DIRECTOR.md §11 lists (the `<name>.srt` is the lyrics), plus `lyrics/lyrics.json` and the lyrics file it came from. `CREDITS` names the song (title, artist, where it came from) as the user's material, not under a free licence. Tell the user the video contains the song and that publishing it is theirs to decide (§1).

## 11. Library demos

A demo in `styles/` may only use a song under CC0 or CC BY, or one whose rights the owner of this library holds, credited in `demo/CREDITS`. The song file itself is not committed (`build.sh` fetches it).
