# Modification notice

Copyright (c) 2026 shiujan. 仅限非商用（CC BY-NC 4.0）。
Source: https://github.com/larashero3-dotcom/lieflat-less-ai-tone
Upstream commit: fe13f1a0712cd2c138b6cdc500a77927d5bf04ec

Local modification, 2026-10-29: added the optional `--short` CLI flag.
It skips only the existing `meta["万汉字"] < 0.05` refusal. All measurement
functions, tables, thresholds and formatted upstream reports are unchanged.
Without the flag, original minimum-length behavior remains in force.
The separate narration adapter enables this flag by default and reports the
exact Han-character count plus a short-text variability notice.
Original LICENSE is unchanged.
