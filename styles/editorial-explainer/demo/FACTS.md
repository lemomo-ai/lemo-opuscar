# Facts in "Twenty-Three"

Every number on screen and in the narration is a computation, under the usual assumptions of the birthday problem: 365 equally likely birthdays, no leap day, birthdays independent.

| Claim | Where | Computation | Value |
|---|---|---|---|
| 23 people give a better-than-even chance that two share a birthday | narration l3, l7; "50.7%" slip | 1 − ∏_{i=0}^{22} (365 − i)/365 | 0.5073 (22 people: 0.4757) |
| 23 people make 253 pairs | narration l5; counter | 23 × 22 / 2 | 253 |
| At 57 people the chance is 99% | narration l8; "99%" slip | 1 − ∏_{i=0}^{56} (365 − i)/365 | 0.9901 |
| 183 is half the calendar | narration l2; "183 OF 365" card | ⌈365 / 2⌉ | 183 |

The curve on the chart is the same product for n = 1…75 (`prob` in `film.js`), drawn straight between whole numbers of people.
"It feels like 183" is the film's way of naming the common intuition; it is not a survey result.

Check: `python3 -c "q=1
for i in range(23): q*=(365-i)/365
print(1-q)"` prints 0.5072972343239857.
