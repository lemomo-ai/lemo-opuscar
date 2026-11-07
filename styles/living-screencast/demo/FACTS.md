# Facts in the voice and on screen

*Clawd Moves In.* Every product claim the voice makes and every button, mode name and shortcut the redrawn interface shows, checked against Anthropic's own Claude Code documentation. The voice text is `lines.json`; the interface strings are in `ui.js` and `film.js`; subtitles in `../living-screencast.srt`. Times are subtitle times. Checked on 2026-11-07 against the docs as published that day; the app changes often, so re-check before reusing any of this.

This is an unofficial fan film (end card and `DEMO.md`); Anthropic did not make or endorse it.

## Sources

- [D1] Claude Code docs, "Desktop application" — https://code.claude.com/docs/en/desktop — the page also exists as Markdown at https://code.claude.com/docs/en/desktop.md, from which the wording below is quoted.
- [D2] Claude Code docs, "Model configuration" — https://code.claude.com/docs/en/model-config

## Voice

| # | Time | Wording in the film | Source wording | Verdict |
|---|---|---|---|---|
| 1 | 0:02.2 | "Meet Clawd." | not in the docs | unchecked: "Clawd" is the name the community and press use for the Claude Code pixel mascot; no Anthropic page that names it was found |
| 2 | 0:03.4–0:06.1 | "It used to live in your terminal. Now it lives right inside the Claude app." | [D1] "After installing, launch Claude, sign in, and click the **Code** tab." "If you already use the terminal-based CLI, see the CLI comparison for what carries over." | simplified but defensible: Claude Code runs in the Claude app's Code tab; it has not left the terminal, it is in both |
| 3 | 0:10.8 | "Just say what you want, in plain words." | [D1] "Type what you want Claude to do and press **Enter** to send." | supported |
| 4 | 0:13.4; HUD "@ mention a file", file popover | "Point at a file with the @ sign," | [D1] "**@mention files**: type `@` followed by a filename to add a file to the conversation context." | supported |
| 5 | 0:16.0 | "and Claude reads your project before it touches a thing." | [D1] "Claude reads your project files, makes changes, and runs commands based on your permission mode." | simplified but defensible |
| 6 | 0:20.2; HUD "⇧ ⌘ M permission mode" | "Not sure yet? Switch to Plan mode." | [D1] shortcut table "`Cmd` `Shift` `M` — Open permission mode menu"; "You can switch permission modes at any time using the mode selector in the row under the prompt box." | supported |
| 7 | 0:22.8; plan panel, "No files changed" | "You get a clear plan, and nothing changes until you say go." | [D1] Plan: "Claude reads files and runs commands to explore, then proposes a plan without editing your source code." "Once you approve the plan, switch to Accept edits or Manual to execute it." | supported |
| 8 | 0:28.0; "+24 −3" stat bar, diff view | "Every edit shows up as a diff." | [D1] "After Claude makes changes to your code, the diff view lets you review modifications file by file". "To open the diff view, click the line counts, such as `+12 -1`" | supported |
| 9 | 0:30.4–0:34.5; comment box "Your comment · line 6", HUD "⌘ ↵ send comments", "Comment sent to Claude" | "Click any line, leave a note, and Claude revises it." | [D1] "hover over a line and click the **+** that appears beside its line number to open a comment box." "submit all comments at once: **macOS**: press **Cmd+Enter**". "Claude reads your comments and makes the requested changes, which appear as a new diff you can review." | supported (the film's "click any line" compresses "hover, click the +") |
| 10 | 0:36.4–0:42.7; Browser pane "npm run dev · localhost:5173", toast "Screenshot · contrast OK" | "Then it checks its own work. It runs your app in the preview, and clicks through it, just like you would." | [D1] "Claude can start a dev server and open it in the Browser pane to verify its changes." "Watch Claude verify its own changes automatically: it takes screenshots, inspects the DOM, clicks elements, fills forms, and fixes issues it finds" | supported |
| 11 | 0:42.9; HUD "⌘ N new session", sidebar "＋ New session ⌘N" | "Got more to do? Start another session." | [D1] "Click **+ New** in the sidebar, or press **Cmd+N** on macOS … to work on multiple tasks in parallel." | supported (the button is labelled "+ New" in the docs) |
| 12 | 0:45.7; HUD "⌥ click split view"; chapter "05 Side by side" | "They work side by side." | [D1] "**Side by side**: hold **Option** on macOS … and click a session in the sidebar"; "**In its own window**: hold **Cmd** on macOS … and click a session" | supported. |
| 13 | 0:50.7 | "Claude Code. Say it. Plan it. Review it. Ship it." | the film's tagline | not a claim |

## Interface shown

| # | Element | Source wording | Verdict |
|---|---|---|---|
| U1 | mode menu: "Manual — Ask before every edit", "Accept edits — Edit files, ask before commands", "Plan — Explore and propose. No edits.", "Auto — Run with background safety checks" | [D1] Manual: "Claude asks before editing files or running commands." Accept edits: "auto-accepts file edits and common filesystem commands … but still asks before running other terminal commands." Plan: as in 7. Auto: "before actions such as shell commands and network requests run, a background classifier checks that they align with your request." | supported (short paraphrases; Manual also asks before commands, and the menu omits Bypass permissions, which "appears in the mode selector once enabled") |
| U2 | model picker "Opus 5.5" | [D2] model table lists "Opus 5.5" for the Anthropic API | supported |
| U3 | second session's PR card: "Checks running · n/6", "6 checks passed", toggle "Auto-merge", "Merged" | [D1] "To have Claude fix failing checks, or to have GitHub merge the pull request, turn on **Auto-fix** or **Merge when ready**." "**Merge when ready**: turns on GitHub's auto-merge for the PR." | simplified: the feature exists, but the toggle is labelled **Merge when ready** in the docs, not "Auto-merge" |
| U4 | third session: integrated terminal running `npm test -- --repeat 50` | [D1] "The integrated terminal lets you run commands alongside your session" | supported (the test run itself is invented) |
| U5 | project files, code, plan steps, "Dark mode toggle", "Fix flaky timer test", "tomato" timer app | invented sample project | not claims |
