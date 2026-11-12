# Facts behind the numbers

The film is a worked example, not a market claim: its premise is that the money doubles every ten years. Everything else follows by arithmetic.

| Claim on screen or in the voice | How it is computed |
|---|---|
| Doubles every 10 years | yearly rate r = 2^(1/10) − 1 = 7.177% |
| After 70 years, 128 | 7 doublings: 2^7 = 128 |
| Interest taken out every year: 6.02 | simple interest at the same rate: 1 + 0.07177 × 70 = 6.02 (at a round 7.2% it would be 6.04; the voice says "just over 6") |
| The last 10 years add 64, all the growth before them plus the dot | 128 − 64 = 64 = 63 (growth over the first 60 years, 1 → 64) + 1 (the starting amount) |
| Start 10 years later: half | 6 doublings: 2^6 = 64 = 128 ÷ 2 |
| 72 ÷ 7.2 = 10 | the rule of 72: years to double ≈ 72 ÷ yearly rate in %. It is an approximation: at exactly 7.2% the doubling time is ln 2 ÷ ln 1.072 = 9.97 years. 7.2 on screen is the film's 7.177% rounded to one decimal |

The still layouts in `index.html` (`?frame=2|3`) use: a lever in balance, 1 × 3 = 3 × 1 (the light end moves three times as far for the same angle); Earth's water from USGS, *Where is Earth's water?* (https://www.usgs.gov/special-topics/water-science-school/science/where-earths-water): saline about 97.5%, fresh about 2.5%; of fresh water, ice caps and glaciers 68.7%, groundwater 30.1%, surface and other 1.2%.
