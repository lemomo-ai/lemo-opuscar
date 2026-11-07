# Facts on the map and in the voice

*From Bean to Cup.* Every number the infographic prints or the voice says: where it comes from and the source's own words, or how it was worked out. The voice text and the km numbers are in `timeline.js` (`KM = { farm: 400, sea: 10500, city: 100, total: 11000 }`); the labels are in `film.js` (`LAB`, `overlays`, `fullMap`); subtitles in `../iso-infographic.srt`. Times are film times. Checked on 2026-11-07.

The journey is one bean's **illustrative route**: no farm, port or country is named, and the map is labelled "NOT TO SCALE". The route lengths are therefore chosen, not measured; they only have to be plausible and add up (400 + 10,500 + 100 = 11,000 km, and the Isotype bar is coloured in those proportions).

## Sources

- [S1] FAO, *Arabica coffee manual for Lao PDR*, ch. 3 — https://www.fao.org/4/ae939e/ae939e03.htm — "After pollination, a fruit develops into a cherry about 10 to 15 mm long containing two seeds (the coffee beans)." "An elevation greater than 1000 m above sea level (m.a.s.l.) is required for Arabica coffee."
- [S2] FAO, same manual, ch. 8 (processing) — https://www.fao.org/4/ae939e/ae939e08.htm — "Drying cherry coffee may take 18 to 20 days." "Coffee processing transforms fresh coffee cherries into clean, green bean of 12% moisture ready for export or for roasting."
- [S3] USDA Foreign Agricultural Service, *Coffee Annual*, Brasília, BR2026-0025 (2026) — https://www.fas.usda.gov/data/gain-report/2026/06/Coffee%20Annual_Brasilia_Brazil_BR2026-0025.pdf — production given in "million bags (60 kilograms per bag), green bean equivalent". The 60-kg bag is the trade's standard unit (also used by the ICO).
- [S4] Jimma University study of green Arabica beans from 20 Ethiopian agro-ecological zones, *Beverage Plant Research* (2024), table of physical properties — https://maxapress.com/app/figure_table/66594ceffa6c580a0f23dede — mean hundred-bean weight about 15.5 g (rows from about 14.1 to 16.2 g), i.e. about 0.155 g per green bean. Table value; read through a search summary, not quoted verbatim.
- [S5] National Coffee Association USA, "The Lifecycle of Coffee" — https://www.aboutcoffee.org/origins/lifecycle-of-coffee/ — "When the beans reach an internal temperature of about 400 degrees Fahrenheit, they begin to turn brown." "Roasting is generally performed in the country where the beans will be sold."
- [S6] Istituto Nazionale Espresso Italiano, Certified Italian Espresso parameters (INEI brochure, copy hosted at https://www.nespressoguide.com/files/File/istituzionale_inei_hq_en.pdf; the espressoitaliano.org original no longer resolves) — "Necessary portion of ground coffee 7 g ± 0,5"; about 25 ml in the cup.
- [S7] BIMCO, reported by Hellenic Shipping News, "Ships above 12,000 TEU drive 100% increase in average ship size" (2024) — https://www.hellenicshippingnews.com/ships-above-12000-teu-drive-100-increase-in-average-ship-size/ — "Since 2006, the average container ship has doubled in size to 4,580 TEU and ships with a capacity of more than 12,000 TEU has accounted for 51% of the fleet's capacity expansion."

## Claims

| # | Where | Wording in the film | Source / how | Verdict |
|---|---|---|---|---|
| 1 | voice 8.4 s; inset "1 CHERRY = [2 beans] SEEDS" | "It began as a cherry on a hillside, with two seeds inside." | [S1] | supported |
| 2 | label 7.8–11.3 s "HARVEST 1,600 m" | the farm stands at 1,600 m | [S1] Arabica needs more than 1,000 m | simplified: an illustrative altitude within the Arabica range, not a named farm |
| 3 | label 12.0–15.8 s "DRY 21 days" (21 suns) | sun-drying takes 21 days | [S2] "18 to 20 days" | simplified but defensible: one day over the FAO figure; drying time depends on weather |
| 4 | voice 12.9 s; label 15.0–17.2 s "1 SACK · 60 KG · 400,000 beans" | "Dried in the sun, then packed with four hundred thousand others." | [S3] 60-kg bag; [S4] 60,000 g ÷ 0.155 g ≈ 387,000 beans | supported (rounded) |
| 5 | label 19.8–22.7 s "SHIP 14,000 containers" (14 icons, 1 = 1,000) | one ship carries 14,000 containers | [S7] ships above 12,000 TEU are a common large class | simplified: ship capacity is counted in TEU (twenty-foot equivalents). A 14,000 TEU ship carries fewer physical boxes, because many are 40 ft (2 TEU) |
| 6 | voice 23.4 s; label "SEA · 18 DAYS", counter to 10,500 km | "Eighteen days at sea." | arithmetic: 10,500 km in 18 days ≈ 24 km/h ≈ 13 knots, an ordinary container-ship speed | simplified: illustrative route; plausible for a South America–Europe crossing |
| 7 | labels "TRUCK 400 km", "TRUCK 100 km"; end card "road 500 · sea 10,500" | road legs of the route | chosen for the illustrative route | illustrative (no real route) |
| 8 | the whole sequence: green beans cross the sea, roasting happens in the city at the end | beans travel green and are roasted where they are sold | [S2] "green bean … ready for export"; [S5] "Roasting is generally performed in the country where the beans will be sold." | supported |
| 9 | label 36.6–40.5 s "ROAST · 12 MIN", thermometer to "220 °C" | roast to 220 °C in 12 minutes | [S5] browning starts at about 400 °F (204 °C); a medium roast ends somewhat above that | simplified: a typical drum-roast end temperature and time; no primary source gives exactly 220 °C / 12 min, and both vary with roast level and roaster |
| 10 | label 41.4–44.1 s "1 CUP ≈ 70 beans" (70 beans form a cup) | one cup takes about 70 beans | [S6] 7 g for an espresso; roasted beans lose roughly 15–20 % of their green weight, so ≈ 0.13 g each: 7 g ≈ 55 beans, 9 g ≈ 70 | simplified but defensible: 70 beans is about a 9 g dose, the top of the usual single-shot range (7–9 g) |
| 11 | voice 49.9 s; hand tag "11,000 km"; end card "TOTAL 11,000 km", "= 1,000 km" bar | "Eleven thousand kilometres, from one pair of hands to yours." | arithmetic of claims 6–7: 400 + 10,500 + 100 | supported as arithmetic of an illustrative route |

Not claims: "How far did your coffee travel?", "Somewhere in here is yours.", "OURS", "1 of 400,000" (restates 4), "0 km", the title, "NOT TO SCALE", the credits.
