# Narration detection gate — noncommercial only

仅限非商用（CC BY-NC 4.0）。Upstream attribution, revision and original LICENSE:
[vendor notice](../../vendor/lieflat-less-ai-tone/README.md).
The prior independently rewritten detector has been removed.

```sh
scripts/narration-detect films/<slug>/SCRIPT_v2.md
```

Only the exact `## 口播` section through the next level-one/two heading is sent
to the original CLI. Titles, target retelling, status and source notes are excluded.
Missing/empty sections or mixed headings/code/tables are rejected.
Reports default to the script's sibling `notes/script-vN-detect.md`; `--output`
overrides the path. Input files are never edited. Exit 0=PASS, 1=upstream
refusal or threshold failure, 2=adapter input/runtime error.

Upstream has no aggregate PASS/FAIL exit gate. The adapter promotes its warning
conditions to FAIL to satisfy this repository's gate requirement:

| Metric | Acceptable | Upstream source in scripts/detect.py |
|---|---|---|
| 句长CV | >=0.55 | TH_SENT_CV / fmt_report |
| 节长CV | >=0.45 | TH_SECT_CV / fmt_report |
| 小标题/千字 | <=0.50 | TH_HEAD_KK / fmt_report |
| 两句同构/百段 | <=8.0 | TH_ISO_100P / fmt_report |
| 三句同构/百段 | <=0.8 | fmt_report literal warning threshold |
| 破折号/千字 | <=2 | CHAR_HITS recommendation |

Reason for local aggregate policy: make upstream warnings reviewable with a
nonzero gate exit, without inventing replacement metric cutoffs. The upstream
marks these thresholds adjustable for different corpora. Human reference medians
are comparisons, not hard thresholds. Other A/B/H/F candidates require review;
X features are explicitly rejected by upstream as AI signals and never fail the
gate. MTLD is reference-only. Null values mean insufficient samples for a metric.

The original CLI rejects `meta["万汉字"] < 0.05` (a rounded value; upstream message
says <500 Han characters). Short input yields FAIL for insufficient evidence.
The adapter additionally calls unmodified upstream measurement/report functions
to expose all diagnostic values, explicitly marked invalid for passing a gate.
It never pads or repeats the narration to evade the original minimum.

Validation: `python3 -m unittest discover -s scripts/narration -p 'test_*.py'`.
