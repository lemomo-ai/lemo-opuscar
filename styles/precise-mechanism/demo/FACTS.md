# Facts in the demo

Every number on screen and in the narration, with its source or how it was computed.

| Claim (where) | Source / derivation | Note |
|---|---|---|
| "Yet it drifts only a few seconds a day." (narration 2) | COSC, *Mechanical movements*: a certified chronometer movement over 20 mm keeps an average daily rate within −4/+6 s a day. https://cosc.swiss/en/certification/mechanical-movements · Wikipedia, *COSC*: https://en.wikipedia.org/wiki/COSC | A typical figure for a good mechanical watch, not a claim about the teaching movement in the film |
| 5 beats a second, 18,000 / h (narration 9, label) | Wikipedia, *Balance wheel*: "Watches made prior to the 1970s usually had a rate of 5 beats per second (18,000 BPH)." https://en.wikipedia.org/wiki/Balance_wheel | Many modern watches run at 28,800 / h; 18,000 was chosen as the classic rate |
| The balance and hairspring set the rate | Same article: "The balance wheel and hairspring together form a harmonic oscillator." | |
| Centre wheel 1 turn / h, seconds wheel 1 turn / min, escape wheel released one tooth at a time | Wikipedia, *Wheel train*: https://en.wikipedia.org/wiki/Wheel_train | |
| "half a tooth at a time" (narration 8) | beats per hour = 2 × escape-wheel teeth × escape-wheel turns per hour: 18,000 = 2 × 15 × 600, so 2.5 teeth per second at 5 beats per second, half a tooth per beat | |
| 4,800×; barrel 1 turn / 8 h; escape wheel 1 turn / 6 s (narration 6, on screen) | Computed in `physics.js` from the teaching movement's tooth counts: 64/8 · 64/8 · 60/8 · 60/6 = 4,800, 15-tooth escape wheel | The narration says "in this teaching movement" and the screen shows the tooth counts; real calibres use other ratios |
| "Left alone, the spring would empty in a single rush." (narration 7) | Qualitative: without an escapement the going train runs free and the mainspring unwinds at once | The 60 rpm shown for the free-running seconds wheel is an illustration, not a measurement |
| Balance amplitude 321° (motion only, not shown) | Model value from `physics.js` at 72 % wind (inertia, Q and efficiency of a common order of magnitude) | Wikipedia gives about 270° each side as typical |
