# FACTS · Is faster better?

The film states no real-world facts. Every number on screen and in the narration is the output of one run of the toy
simulation in `filmsim.js` (seed 11), recomputed on every build. It describes this simulation, not real animals.

## The rules (filmsim.js, `FILM_P`)

- 160 Pips in generation 1, speeds spread evenly over 0.6–1.9; board ±14 units; 230 beans every day; Pips land at random each morning.
- A Pip heads for the nearest bean within 3.2 units, otherwise wanders; it spends k × speed² energy per second (k = 0.7, starting energy 1) and stops when it runs out.
- 0 beans → gone; 1 bean → lives to the next day; 2 beans → lives and leaves a copy whose speed is mutated (Gaussian, σ 0.09, floor 0.3).

## Numbers and how they come out of the run

| On screen / narration | Value | Notes |
|---|---|---|
| Pips on day 1 | 160 | |
| Day 1 verdict | 55 gone, 51 one bean, 54 two beans → 159 | the head count rolls from 160 to 159 |
| "three times as many children" | slow (< 0.9) 19, fast (> 1.5) 6 | parent-speed groups of 35 and 41 Pips; per Pip the gap is larger |
| The fast Pip, the slow Pip | speeds 1.69 and 0.72 | ids 149 and 126 in the run |
| Generation 9 close-up | 20 fast (> 1.5) Pips left; generation 1 had 41 | |
| Mean speed | 1.25 (generation 1) → 0.73 (generation 20) | 208 Pips in generation 20 |
| "≤ 0.5" bin | 44 Pips | 20 of them sit at the simulation's speed floor of 0.3 |

The energy constant k = 0.7 was chosen so that the effect shows within 20 generations; at k = 0.5 the speed
distribution barely moves in that time. The rules are otherwise unchanged by that choice.
