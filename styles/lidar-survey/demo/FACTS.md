# FACTS — 《林下的田》 The Fields Under the Forest

Every claim on screen and in the narration, its source and the quoted wording. Measured values come from the data in this folder and are labelled as measured or traced on screen. Checked against the final script (timeline.js, film.js) before the last render, 2026-10-16.

## Sourced claims

| # | Claim (screen / voice) | Source | Quoted wording |
|---|---|---|---|
| 1 | The place is Ashford, Connecticut; 41.8875° N, 72.1960° W is inside Ashford town | US Census Bureau Geocoder, geographies by coordinates (County Subdivisions, current vintage), queried 2026-10-16: `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=-72.196&y=41.8875&benchmark=Public_AR_Current&vintage=Current_Current&layers=County+Subdivisions&format=json` | result: "Ashford town" |
| 2 | In public lidar, stone walls, old roads and foundations of a farming past show under New England forest; aerial photos don't show them | K. M. Johnson & W. B. Ouimet (2014), "Rediscovering the lost archaeological landscape of southern New England using airborne light detection and ranging (LiDAR)", *Journal of Archaeological Science* 43: 9–20. PDF hosted by the UConn Stone Wall Initiative: https://stonewall.uconn.edu/wp-content/uploads/sites/534/2014/03/Johnson-and-Ouimet-2014-Rediscovering-the-lost-archaeological-landscape-of-southern-New-England-using-airborne-LiDAR.pdf | "In aerial and satellite imagery, these features are often hidden from view by a dense forest canopy; but by using LiDAR as others have done, these features become visible for identification and analysis." |
| 3 | The ridges are stone walls (voice: "Stone walls. Old fields, under the trees."; screen: 石墙, "stone walls") | same paper | "Stone walls appear as thin linear ridges of raised elevation that can form polygonal or linear patterns dependent on field or farmstead layout or arrangement. The presence of the walls indicates that the land nearby was likely used for agriculture and was cleared at one point in time" |
| 4 | Ashford ≈ 100 km² (card: 阿什福德全镇 · 约 100 km²) | same paper | "The town is comprised of approximately 100 km2 of land." |
| 5 | 1870: 67.3 km² cleared farmland (card; voice: "In 1870, two-thirds of Ashford was farmland.") | same paper, citing the 1870 Federal Census agricultural schedule | "the agricultural schedule from the Federal Census of 1870 denotes that 67.3 km2 were listed as “improved,” indicating that it had been cleared for agriculture" |
| 6 | 2006: 80.2 km² forest (card; voice: "By 2006, four-fifths was forest.") | same paper, citing 2006 land cover (UConn CLEAR) | "The 2006 land cover data for the town indicates that 80.2 km2 are currently forested (includes deciduous, coniferous, and forested wetlands)" |
| 7 | The photo is a July 2016 summer aerial (2016 年 7 月 · 夏季航拍; NAIP 航拍 · 2016-07-24) | NAIP item `ct_m_4107207_sw_18_.6_20160724_20160913`, Microsoft Planetary Computer STAC, collection `naip` | item datetime 2016-07-24, gsd 0.6 m |
| 8 | The point cloud is USGS 3DEP 2016 (USGS 3DEP 2016) | `USGS_LPC_CT_Statewide_B8_2016`, Entwine Point Tile on AWS Open Data: https://s3-us-west-2.amazonaws.com/usgs-lidar-public/USGS_LPC_CT_Statewide_B8_2016/ept.json | dataset name, Connecticut statewide 2016 |

Ratios in the voice: 67.3 / ≈100 km² → "two-thirds"; 80.2 / ≈100 km² → "four-fifths". The bars on the card are drawn against 100 km².

## Measured in this folder (labelled as measured / traced on screen)

| Value on screen | How | File |
|---|---|---|
| 4,789,797 个回波 (returns) | all returns of the EPT nodes (depth 0–10, full resolution) inside the 744 × 1000 m grid, noise classes 7 and 18 removed | `tools/build_data.py` → `data/facts.json` (`points`) |
| 0.744 km² | grid extent 744 m × 1000 m | `data/facts.json` (`area_km2`) |
| 27.6 % 打到地面的回波 (1,319,669 / 4,789,797) | share of returns classified ground (class 2) by the data provider | `data/facts.json` (`ground`, `ground_share`) |
| 树冠高度 ruler 0–30 m and its histogram | height of every non-ground return above a ground model triangulated from the class-2 returns (0.5 m grid); 95th percentile 26.1 m | `data/facts.json` (`veg_hag_hist`, `canopy_p95`) |
| 3.4 km 已描出的石墙, 22 段 (voice: "We traced 3.4 km of wall") | 22 walls digitised by eye on a local relief model (DTM minus a 5 m Gaussian), each snapped to the ridge crest within ±2.5 m and smoothed; total 3,425.5 m. Conservative: faint ridges were left out | `data/walls_traced.json` (the hand tracing), `tools/trace.py` → `data/walls.json` |
| 石墙剖面: 0.56 m high, 2.5 m wide at half height (voice: "Just over half a metre high") | wall C, 60 m of wall (along 20–80 m), 1,451 ground returns within 0.5 m of 60 profile lines spaced 1 m, offset across the wall, detrended by a line fitted beyond ±3.5 m; median in 0.5 m bins; height = peak of the median; width = full width at half height | `tools/profile.py` → `data/profile_C.json` |
| 地形起伏 ×2（局部）| display only: local relief (DTM minus a 5 m Gaussian) doubled on the rendered surface; all measurements use the undistorted data | `tools/build_data.py` (`EXAG`) |

## Not claimed

- No date is given for these particular walls. The paper links walls to agriculture and Ashford's clearance to the 19th century; the film says only "old fields" and gives the town's 1870 and 2006 figures.
- The film does not say this patch is one of the paper's mapped sites; it is a patch inside the same town, found by scouting the 3DEP elevation service and NAIP imagery.
- Modern houses and a gravel lane east of x ≈ 235 m are outside the survey window and not shown.
