# Facts on the board and in the voice

*Einstein in Your Pocket.* Every number and factual claim the film says or writes on the board: where it comes from and the source's own words, or how it was worked out. The voice text is `lines.json` (English; subtitles in `../whiteboard.srt`). Times are subtitle times. Checked on 2026-11-07.

## Sources

- [S1] GPS.gov, Space Segment (U.S. government; archived copy of the official page) — https://archive.gps.gov/systems/gps/space/ — "GPS satellites fly in medium Earth orbit (MEO) at an altitude of approximately 20,200 km (12,550 miles)." "As of July 3, 2023, there were a total of 31 operational satellites in the GPS constellation, not including the decommissioned, on-orbit spares."
- [S2] GPS.gov, GPS Accuracy — https://archive.gps.gov/systems/gps/performance/accuracy/ — "For example, GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius under open sky"
- [S3] N. Ashby, "Relativity and the Global Positioning System", *Physics Today* 55(5), 41 (2002) — https://physicstoday.aip.org/features/relativity-and-the-global-positioning-system — "If these relativistic effects were not corrected for, satellite clock errors building up in just one day would cause navigational errors of more than 11 km, quickly rendering the system useless." "Nowadays the rate of every orbiting GPS clock is adjusted by this “factory offset” before launch."
- [S4] N. Ashby, "Relativity in the Global Positioning System", *Living Reviews in Relativity* 6, 1 (2003) — https://pmc.ncbi.nlm.nih.gov/articles/PMC5253894/ — "The Space Segment consists essentially of 24 satellites carrying atomic clocks." "… measurements from four satellites are needed for navigation" so that "the three components of the receiver’s position vector, and the local clock bias, can be determined". "This adjustment is accomplished on the ground before the clock is placed in orbit."
- [S5] R. Pogge, "Real-World Relativity: The GPS Navigation System", Ohio State University, Astronomy 162 — https://www.astronomy.ohio-state.edu/pogge.1/Ast162/Unit5/gps.html — "the on-board atomic clocks on the satellites should fall behind clocks on the ground by about 7 microseconds per day"; "the clocks in each GPS satellite should get ahead of ground-based clocks by 45 microseconds per day"; "the clocks on-board each satellite should tick faster than identical clocks on the ground by about 38 microseconds per day"; "errors in global positions would continue to accumulate at a rate of about 10 kilometers each day"; "the onboard clocks were designed to 'tick' at a slower frequency than ground reference clocks".
- [S6] NIST, CODATA value of the speed of light in vacuum — https://physics.nist.gov/cgi-bin/cuu/Value?c — c = 299 792 458 m s⁻¹ (exact).

## Claims

| # | Where | Wording in the film | Source | Verdict |
|---|---|---|---|---|
| 1 | voice 0:00.9 | "your phone knows where you are, to within a few metres" | [S2] 4.9 m radius under open sky | supported |
| 2 | voice 0:14.1; board "20,000 km up" | "About thirty satellites circle twenty thousand kilometres above us." | [S1] 31 operational satellites, about 20,200 km | supported (rounded) |
| 3 | voice 0:19.0; board "atomic clock", "12:00:00.000 / .001 / .002" | "Each one carries an atomic clock, and broadcasts the time, over and over." | [S4], [S5] "Each satellite carries with it an atomic clock" | supported. Each satellite actually carries several clocks; "an atomic clock" is a simplification. The ticking time stamps are illustrative |
| 4 | voice 0:24.5–0:32.5; board "heard 12:00:00.067", "delay × speed of light = distance", "0.067 s × c ≈ 20,000 km" | "The signal travels at the speed of light, but it still arrives a little late. And that delay is a distance." | [S6] + arithmetic: 0.067 s × 299,792 km/s = 20,086 km; for a satellite straight overhead at 20,200 km [S1] the delay is 0.067 s | supported (worked out) |
| 5 | voice 0:34.8–0:43.0; board circles and "?" | "One satellite puts you somewhere on a circle. Two, at one of two points. Three. Right here." | Trilateration, drawn in 2D | simplified but defensible: in space each range is a sphere, not a circle; the board is a flat diagram |
| 6 | board, after "Right here" | "+1 more satellite fixes the phone's own cheap clock" | [S4] four satellites give position plus "the local clock bias" | supported |
| 7 | voice 0:56.2; board "speed … slows it −7 μs" | "Moving fast slows the orbiting clock, by seven microseconds a day." | [S5] "about 7 microseconds per day" | supported |
| 8 | voice 1:01.6; board "gravity ↓ speeds it up +45 μs" | "Weaker gravity speeds it up, by forty-five." | [S5] "45 microseconds per day"; [S3] gravitational shift makes satellite clocks "run faster" | supported |
| 9 | voice 1:05.2; board "+38 μs fast / day" | "Together, thirty-eight microseconds fast. Every single day." | [S5] "about 38 microseconds per day" | supported |
| 10 | voice 1:09.9; board "38 μs × c ≈ 11 km" | "in thirty-eight microseconds, light travels over eleven kilometres" | [S6] + arithmetic: 38 × 10⁻⁶ s × 299,792 km/s = 11.4 km | supported (worked out) |
| 11 | voice 1:16.4; board week strip Mon–Sun | "Left alone, your map pin would drift that far, every day." | [S3] "navigational errors of more than 11 km" in one day; [S5] "about 10 kilometers each day" | simplified but defensible: this is the standard textbook framing. In a real receiver part of a common clock offset would be absorbed into the receiver-clock solution, so the error would not be a clean, steady drift of the pin |
| 12 | voice 1:20.8; board "sea", "?" | "By next week, you'd be somewhere out at sea." | Extrapolation of claim 11: 7 days × ~11 km ≈ 80 km | simplified: an illustrative extrapolation of the ~38 µs/day error, true only for a viewer within ~80 km of a coast |
| 13 | voice 1:28.8; board "tuned slow before launch ✓" | "So before launch, engineers tune the satellite clocks to tick slightly slow." | [S3] "factory offset" before launch; [S4] "accomplished on the ground before the clock is placed in orbit"; [S5] | supported |
| 14 | voice 1:35.9 | "Einstein's relativity, quietly at work in your pocket." | [S3], [S4] (special and general relativity both enter the correction) | supported |

Board texture that is not a claim: the faint ghost marks of earlier lessons ("x = 4", "lab 3", "TUE", "pH 7", "due fri" and the like), the title card, the credits.
