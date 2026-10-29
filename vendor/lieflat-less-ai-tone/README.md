# lieflat-less-ai-tone (vendored detector)

仅限非商用（CC BY-NC 4.0）。Copyright (c) 2026 shiujan.

Source: https://github.com/larashero3-dotcom/lieflat-less-ai-tone
Commit: fe13f1a0712cd2c138b6cdc500a77927d5bf04ec

Files copied byte-for-byte: `LICENSE`, `scripts/detect.py`. No upstream modifications.
The detector imports only Python standard-library modules (`argparse`, `json`,
`re`, `sys`, `pathlib`); all rule tables are embedded. No other local modules,
wordlists, data files, pip packages or runtime downloads are required.

The repository's separate `scripts/narration/gate.py` extracts narration,
invokes the original CLI and adapts its warnings to a failure exit code.
The original CLI rejects short inputs; diagnostic calls to the original
`measure_docs` / `fmt_report` functions do not override that refusal.
See `scripts/narration/README.md` for threshold provenance.
