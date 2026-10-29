# Narration detection gate

Run from the repository root:

```sh
scripts/narration-detect films/<slug>/SCRIPT_v2.md
```

Absolute paths work. Reports default to the source directory's `notes/script-vN-detect.md`; `--output PATH` overrides this. Exit 0 = PASS; 1 = threshold exceeded; 2 = invalid input/extraction. The script never changes its input. It extracts only the exact `## 口播` section up to the next level-one or level-two heading, excluding titles, status and source notes. Empty/missing sections and embedded headings, code or tables are rejected, since speech must be explicit plain text.

Gate policy: stock filler phrases maximum 0; explicit `不是…，而是` / `不只是…，更是` templates maximum 1; sentences longer than 45 letters/digits/Han characters maximum 0. Punctuation/whitespace are excluded from character counts; Chinese/ASCII sentence-final punctuation ends a sentence. These are conservative local editorial thresholds, not research-derived cutoffs or a claim to identify AI authors. A factual contrast can be legitimate; review located hits before revising. No semantic score is fabricated.

## Upstream inspection / no vendoring

Reference: https://github.com/larashero3-dotcom/lieflat-less-ai-tone

Inspected revision: `fe13f1a0712cd2c138b6cdc500a77927d5bf04ec`.

Its [LICENSE](https://github.com/larashero3-dotcom/lieflat-less-ai-tone/blob/fe13f1a0712cd2c138b6cdc500a77927d5bf04ec/LICENSE) is **CC BY-NC 4.0**, copyright 2026 shiujan, with a noncommercial restriction and separate commercial licensing. This is not a permissive software license for unrestricted repository use. No source code or rule tables from that repository are copied here. This small independent implementation counts generic surface features with repository-defined thresholds. It does not reproduce the upstream detector or its research calibration.

Validation: `python3 -m unittest discover -s scripts/narration -p 'test_*.py'`.
