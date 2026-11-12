# Fact sheet: 《被炸平的城市怎样长回来》 (How a Bombed-flat City Grew Back)

Every number, year and factual claim in the film is in the tables below: claim → source (URL) → source wording. Checked on 2026-10-16.

On-screen text and subtitles are Chinese; they are quoted as they appear, with an English gloss. Dutch source wording is quoted in the original, with an English translation in brackets.

Two kinds of number must be kept apart:

- **Official / published claims** (table A below): the wording of the Rotterdam City Archives (Stadsarchief Rotterdam, a municipal body); the roof height of Zalmhaven also takes the Wikipedia article as a reference, cross-checked against this film's own measurement.
- **Data measurements** (table B below): computed by this film from public data (share by construction period, building counts per period, number of buildings over 100 m, roof height, sun elevation, shadow length, roofs in the shadow). All the algorithms are in `tools/prep.py`, the results are written to `data/stats.json`, and the page reads only that file. On screen they are labelled "按建筑占地面积 · BAG 建成年份" (by building footprint · BAG year of construction), "3DBAG 激光实测" (3DBAG laser measurement) and "太阳位置按天文算法" (sun position by astronomical algorithm).

## A. History and published sources

| # | Claim in the film (picture / narration) | Source | Wording |
|---|---|---|---|
| A1 | Pin label "1940.5.14  13:27"; narration "May fourteenth, nineteen forty."; subtitle "1940 年 5 月 14 日。" (14 May 1940.) | Rotterdam City Archives, "Rotterdam in oorlog" https://stadsarchief.rotterdam.nl/rotterdam-oorlog | "Daarom bombarderen Duitse Heinkels op 14 mei 1940 om 13.27 uur de binnenstad van Rotterdam." [That is why German Heinkels bomb the centre of Rotterdam on 14 May 1940 at 13.27.] |
| A2 | Narration "Bombs and fire took much of the centre."; subtitle "炸弹和大火吞掉了大片市中心。" (Bombs and fire swallowed much of the city centre.) | Same as A1 | "Binnen een kwartier zijn grote delen van de binnenstad verwoest." [Within a quarter of an hour large parts of the city centre are destroyed.] / "De bommen en de branden daarna verwoesten 25.000 woningen en 11.000 andere panden." [The bombs and the fires afterwards destroy 25,000 homes and 11,000 other buildings.] |
| A3 | Second line of the pin label "258 公顷城区成为废墟" (258 hectares of the city in ruins) | Same as A1 | "Een oppervlakte van 258 hectare stad ligt in puin." [An area of 258 hectares of the city lies in ruins.] |
| A4 | Pin label "市政厅 · 1920 / 轰炸中几乎完好" (City Hall · 1920 / almost undamaged in the bombing) | Rotterdam City Archives, "Het stadhuis tijdens het bombardement" https://stadsarchief.rotterdam.nl/het-stadhuis-tijdens-het-bombardement ; the year 1920 see B3 | "Maar hoe kan het dat zo'n groot gebouw de verwoesting van 14 mei 1940 vrijwel ongeschonden heeft doorstaan?" [But how is it that such a large building came through the destruction of 14 May 1940 almost unscathed?] / "Het vuur krijgt geen vat op het vrijstaande stadhuis." [The fire gets no hold on the free-standing city hall.] |
| A5 | Pin label "Kop van Zuid / 马斯河南岸" (south bank of the Maas) (pinned on the Wilhelminapier) | Wikipedia, "Kop van Zuid" https://en.wikipedia.org/wiki/Kop_van_Zuid | "…located on the south bank of the Nieuwe Maas opposite the center of town." / the district "includes the Wilhelmina Pier" |
| A6 | Pin label "Zalmhaven I / 屋面 203 m" (roof 203 m) (measure: roof, mast excluded) | Wikipedia, "De Zalmhaven" https://en.wikipedia.org/wiki/De_Zalmhaven ; agrees with the measured value in B5 | "The main tower of the complex, Zalmhaven I, reaches 215 metres (705 ft) in height," / "The roof height is 203 metres (666 ft), while the mast takes up the last 12 metres (39 ft) of height." |
| A7 | Pin label "Zalmhaven I / 2022 年建成" (completed 2022) | BAG original construction year 2022 (B5); Wikipedia as above | "…the entire project was completed in April 2022." |

Note: the Laurenskerk (St Lawrence Church) is not labelled with a year. The original construction year registered in BAG is 1640 (when the tower was raised), while the church's website only says "The Laurenskerk is the only remaining late Gothic building from the medieval Rotterdam." (https://laurenskerk.nl/en/visit/) and gives no construction year; the "15th century" and 1640 readings would contradict each other. So the building labelled with a year in the film is the City Hall, for which the City Archives give wording.

## B. Data measurements (computed by this film)

Data: 3DBAG (LOD1.3 roof parts, reconstructed from the AHN laser point cloud, CC BY 4.0) + the BAG field it carries, `oorspronkelijkbouwjaar` (original construction year, CC0); BGT water and bridge surfaces (CC0). Model extent: RD coordinates x 91700–94000, y 435300–437900 (2.3 × 2.6 km, centre 51.914°N, 4.484°E). Only roof parts lying entirely inside the extent are kept: 3,887 buildings, 8,860 parts. Building height = 70th-percentile roof height of the part − ground height (`b3_h_70p − b3_h_maaiveld`); each building takes its highest part.

| # | Claim in the film | Method | Result |
|---|---|---|---|
| B1 | Readout "23% · 1940 年以前建成 · 按建筑占地面积" (23% · built before 1940 · by building footprint); "1,606 栋" (1,606 buildings) | Footprint (sum of part areas) of buildings with BAG original construction year < 1940 ÷ footprint of all buildings | 0.2276 → 23%; 1,606 buildings |
| B2 | Period legend "1940–1964 · 1,113 栋 / 1965–1989 · 522 栋 / 1990–2009 · 413 栋 / 2010–2025 · 233 栋" (栋 = buildings); rolling year 1940 → 2025 | Count by original construction year, binned | 1,113 / 522 / 413 / 233 |
| B3 | City Hall "1920" | BAG original construction year (NL.IMBAG.Pand.0599100000701897) | 1920 |
| B4 | Readout "24/25 · 百米高楼，1990 后建" (24/25 · buildings over 100 m, built after 1990) (on screen only; no narration line or subtitle states it) | Buildings taller than 100 m, binned by period | 25 in total: 1 in 1965–89, 13 in 1990–2009, 11 in 2010–25 → 24/25. The buildings above 100 m are exactly the 25 tallest |
| B5 | "Zalmhaven I · 屋面 203 m · 2022 年建成" (roof 203 m · completed 2022); top of the height legend 203 m; "最高那栋楼" (the tallest building) | NL.IMBAG.Pand.0599100100020122, the building with the highest roof in the model | 203.0 m, BAG year 2022 |
| B6 | "14.6° · 冬至正午太阳高度" (14.6° · sun elevation at noon on the winter solstice); narration "below fifteen degrees"; the clock stops at 12:40 | NOAA/Meeus sun position algorithm (`tools/sun.py`), 2025-12-21, CET (UTC+1), latitude/longitude of the model centre; maximum elevation taken at 5-minute steps | 12:40 CET, elevation 14.647°, azimuth 179.94° |
| B7 | "777 m · 冬至正午的影长" (777 m · shadow length at noon on the winter solstice); narration "nearly eight hundred metres" | Shadow length = roof height ÷ tan(sun elevation) = 203.0 ÷ tan 14.647°; separately, ray marching through a height field on a 2 m grid puts the actual end of the shadow 784 m from the centre of the tower's top part | 776.6 m → 777 m |
| B8 | "16 个屋顶落在它的影里 · 其中 9 栋建于 1940 年以前" (16 roofs fall in its shadow · 9 of them built before 1940); narration "across sixteen roofs. Nine were there before the war." | 2 m grid height field: for each cell, step along the sun direction; if Zalmhaven I's height minus distance × tan(elevation) is still more than 0.5 m above the cell's roof, the cell is in its shadow; a building counts if the centre cell of its highest part is in shadow | 16 buildings (262–734 m from the tower), of which 9 have a BAG year < 1940 (1928–1939) |

"Were there before the war" (Nine were there before the war) means buildings with a BAG original construction year earlier than 1940 that still stand today.
