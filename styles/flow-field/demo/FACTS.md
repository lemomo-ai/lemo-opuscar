# FACTS · 摩羯过琼州 (Typhoon Yagi, 2411)

Every number or claim on screen, where it comes from, and the wording of the source. Copies of the source pages are not shipped with the demo; the URLs below are the record.

## 1. Best track (positions, central pressure, maximum wind)

- **On screen:** the dashed track and its dots (every 6 h; every 3 h from 5 Sep 17:00 to 6 Sep 14:00 Beijing time, as in the source), the storm tag's dates, wind and pressure, the intensity curve, and the storm state that drives the whole wind field.
- **Source:** CMA best track as carried in NOAA IBTrACS v04r01, file `ibtracs.last3years.list.v04r01.csv` (server Last-Modified 2026-10-22), storm SID `2024244N09137`, TRACK_TYPE `main`. Only CMA's own records are used (IBTrACS interpolated rows dropped). https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/
- **Unit:** IBTrACS column documentation: "CMA_WIND … Two-minute mean maximum sustained wind (MSW; converted to knots from m/s)". Converted back to whole m/s (each record maps to exactly one integer and agrees with CMA's grade column and the landfall bulletins below).
- **Why not the CMA file itself:** tcdata.typhoon.org.cn (CMA Tropical Cyclone Data Center, CH2024BST.txt) sits behind a web firewall that returns HTTP 468 to scripts; the same CMA data was taken from IBTrACS.
- **Table:** `data/yagi_cma_track.csv` (36 records, 1 Sep 08:00 → 8 Sep 20:00 Beijing time). Key rows:

| Beijing time | lat | lon | hPa | m/s | grade |
|---|---|---|---|---|---|
| 09-01 08:00 | 12.2 | 126.2 | 1004 | 13 | 热带低压 TD |
| 09-05 08:00 | 19.0 | 115.7 | 915 | 62 | 超强台风 SuperTY (first best-track peak; shown on the storm tag) |
| 09-06 14:00 | 19.7 | 111.3 | 915 | 62 | 超强台风 SuperTY |
| 09-06 20:00 | 20.0 | 110.3 | 925 | 58 | 超强台风 SuperTY |
| 09-07 14:00 | 20.9 | 107.0 | 925 | 58 | 超强台风 SuperTY |
| 09-07 20:00 | 21.0 | 106.0 | 960 | 40 | 台风 TY |
| 09-08 20:00 | 21.9 | 103.6 | 1002 | 13 | 热带低压 TD |

- **Note on the peak:** CMA's real-time bulletins reported a peak of 68 m/s / 905 hPa on 6 Sep (e.g. the 数据画像 (data profile) page: "6日5时在海南东部近海达到强度极值（中心附近最大风力17级以上，68米/秒）", "at 05:00 on the 6th it reached its peak intensity off eastern Hainan (maximum wind near the centre force 17 or above, 68 m/s)"). The best track's peak is 62 m/s / 915 hPa. The film uses the best track throughout and never claims a peak value.

## 2. Landfall in Wenchang (verdict table, landfall tag)

- **On screen:** "登陆时 · 9月6日16时20分 · 海南文昌", "62 m/s · 17级以上 · 915 hPa", "9月6日16时20分 登陆".
- **Source:** CMA, 2024-09-06 https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202409/t20240906_6547833.html
- **Wording:** 「中央气象台9月6日16时25分发布台风登陆消息：今年第11号台风"摩羯"（超强台风级）的中心已于9月6日16时20分在海南文昌沿海登陆，登陆时中心附近最大风力有17级以上（62米/秒），中心最低气压915百帕。」 ("At 16:25 on 6 September the National Meteorological Centre issued a landfall bulletin: the centre of this year's typhoon No. 11, Yagi (super typhoon grade), made landfall on the coast of Wenchang, Hainan, at 16:20 on 6 September, with maximum wind near the centre of force 17 or above (62 m/s) and a minimum central pressure of 915 hPa.")
- **Town** (Wengtian, used for the landfall pin position 19.97°N 110.93°E): Hainan Meteorological Service https://hi.cma.gov.cn/xwzx/gzdt/202409/t20240907_6552804.html 「6日16时20分前后在文昌市翁田镇沿海地区登陆」 ("made landfall around 16:20 on the 6th on the coast of Wengtian town, Wenchang").

## 3. Through the Qiongzhou Strait, second landfall at Xuwen

- **On screen:** "琼州海峡 Qiongzhou Strait", "22时20分 再次登陆", pin "徐闻 Xuwen".
- **Source:** Hainan Meteorological Service (same page as above): 「登陆后穿过海口市移入琼州海峡，于6日22时20分前后在广东省徐闻县角尾乡再次登陆（17级，58米／秒），随后移入北部湾海面，强度略有减弱。」 ("After landfall it crossed Haikou into the Qiongzhou Strait, made a second landfall around 22:20 on the 6th at Jiaowei township, Xuwen county, Guangdong (force 17, 58 m/s), then moved over the Beibu Gulf, weakening slightly.")
- CMA, 2024-09-07 https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202409/t20240907_6552670.html 「昨天晚上10点20分前后在广东省徐闻县角尾乡再次登陆，登陆时中心附近最大风力有17级（58米／秒），中心最低气压为925百帕」 ("made a second landfall around 10:20 last night at Jiaowei township, Xuwen county, Guangdong, with maximum wind near the centre of force 17 (58 m/s) and a minimum central pressure of 925 hPa").
- **Path:** through the Qiongzhou Strait into the Beibu Gulf, as the wording above says. The eye does not fill in the strait (still 58 m/s, super typhoon, at Xuwen); it fills after the landfall in Viet Nam (see §5), which is where the film shows it.

## 4. Beibu Gulf

- **On screen:** "北部湾 Beibu Gulf" label from film 37.4 s (storm time about 7 Sep 02:00).
- **Source:** CMA 2024-09-07 (page above): 「今天（7日）早晨5点钟，其中心位于北部湾海面上，就是北纬20.3度、东经108.6度，中心附近最大风力有16级（52米／秒，超强台风级）」 ("at 5 this morning (the 7th) its centre was over the Beibu Gulf, at 20.3°N 108.6°E, with maximum wind near the centre of force 16 (52 m/s, super typhoon grade)"). No exact entry time was published; the label is placed by the track.

## 5. Landfall in Viet Nam and decay

- **On screen:** "9月7日15时30分 登陆越南", "Landfall in Viet Nam · 15:30, 7 Sep"; the curve's drop; the eye filling.
- **Source:** CMA, 2024-09-07 https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202409/t20240907_6552823.html 「中央气象台9月7日15时40分发布台风登陆消息：……已于7日15时30分前后在越南广宁省南部沿海登陆，登陆时中心附近最大风力有17级（58米／秒），中心最低气压925百帕。」 ("At 15:40 on 7 September the National Meteorological Centre issued a landfall bulletin: … made landfall around 15:30 on the 7th on the southern coast of Quang Ninh province, Viet Nam, with maximum wind near the centre of force 17 (58 m/s) and a minimum central pressure of 925 hPa.")
- Decay: best track 7 Sep 20:00 → 40 m/s (台风, typhoon), 8 Sep 08:00 → 18 m/s (热带风暴, tropical storm). CMA 数据画像 (data profile) https://www.cma.gov.cn/2011xzt/20160518/202409/t20240909_6566513.html 「8日11时，"摩羯"在越南山萝省境内减弱为热带低压」 ("at 11:00 on the 8th Yagi weakened to a tropical depression in Son La province, Viet Nam"), 「于9月8日17时停编」 ("numbering stopped at 17:00 on 8 September").

## 6. Grades (verdict table)

- **On screen:** the six grades, their wind ranges in m/s and Beaufort-scale levels; "GB/T 19201-2006".
- **Standard:** GB/T 19201-2006《热带气旋等级》 (Grades of tropical cyclones), in force, issued 2006-05-09, effective 2006-06-15 (national standards portal): https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=016555C8A7A7F9EDDF96CE84A88EAFC6
- **Values:** Ministry of Agriculture repost of the notice implementing the standard https://www.moa.gov.cn/ztzl/nyfzjz/200606/t20060622_635055.htm 「热带气旋底层中心附近最大平均风速达到10.8m/s-17.1m/s（风力6-7级）为热带低压……达到或大于51.0 m/s（风力16级或以上）为超强台风」 ("a tropical cyclone whose maximum mean wind near the centre at the surface reaches 10.8–17.1 m/s (force 6–7) is a tropical depression … one reaching or exceeding 51.0 m/s (force 16 or above) is a super typhoon"). Full table:

| grade | m/s | level |
|---|---|---|
| 热带低压 TD | 10.8–17.1 | 6–7 |
| 热带风暴 TS | 17.2–24.4 | 8–9 |
| 强热带风暴 STS | 24.5–32.6 | 10–11 |
| 台风 TY | 32.7–41.4 | 12–13 |
| 强台风 STY | 41.5–50.9 | 14–15 |
| 超强台风 SuperTY | ≥ 51.0 | 16 or above |

- The wind-line colours use the same thresholds.

## 7. The wind field (how the lines are computed)

Not a claim on screen beyond the title block ("中国气象局最佳路径 / CMA best track"); documented here and in DEMO.md.

- **Symmetric vortex:** Holland, G. J. (1980), *An analytic model of the wind and pressure profiles in hurricanes*, Monthly Weather Review 108, 1212–1218. Profile V(r) = Vmax·√((Rm/r)^B·e^(1−(Rm/r)^B)), normalised so its peak equals the best-track 2-min Vmax.
- **B:** Holland (1980) relation B = ρ·e·Vmax²/Δp, ρ = 1.15 kg m⁻³, Δp = 1010 hPa (assumed ambient) − best-track central pressure; clamped to 1.0–2.2.
- **Rmax:** Willoughby, H. E., Darling, R. W. R. & Rahn, M. E. (2006), *Parametric representation of the primary hurricane vortex. Part II*, Monthly Weather Review 134, 1102–1120: Rmax = 46.4·exp(−0.0155·Vmax + 0.0169·φ) km.
- **Inflow angle:** 10° inside Rmax, rising to 20° at 1.2 Rmax and beyond (Sobey, Harper & Stark 1977, as used in many surge models); +15° over land (approximation).
- **Background flow:** 0.55 × the storm's translation velocity turned 20° anticlockwise (Lin, N. & Chavas, D. 2012, *On hurricane parametric wind and applications in storm surge modeling*, JGR Atmospheres 117, D09120).
- **Outer edge:** the vortex is tapered beyond an outer radius of 420 km + 9 km per m/s above 15 m/s (a modelling choice so a weak storm doesn't turn the whole sea).
- **Land and terrain (approximation):** over land the vortex is reduced to 0.75 and turned 15° further inward; the up-slope part of the wind is removed in proportion to the slope of ETOPO1 terrain smoothed over ~8–10 km, so surface flow goes round high ground. This is a picture of the effect, not a mesoscale simulation.
- **Track between records:** Catmull–Rom spline through the records' positions; Vmax and pressure by monotone cubic (never overshooting a record).

## 8. The narration

Every spoken claim and where it stands. All rest on §1–§6.

| Line | Claim | Source |
|---|---|---|
| v01 "Every line on this chart is wind." | the lines are streamlines of the modelled wind field | §7 (Holland 1980 vortex driven by the CMA best track) |
| v02 "Then, over the Philippines, they began to turn." | the storm was over Luzon at the film's opening (best track 2–3 Sep) | §1: track crosses Luzon between the 09-02 and 09-03 records |
| v03 "A calm eye opened." | the model's core clears as the wind rises (fading lines inside Rmax) | §7; a picture of the model, not a satellite observation of the eye |
| v04 "Its name was Yagi. Each point is one record of its path." | name; one dot per CMA best-track record (6-hourly, 3-hourly near landfall) | §1 |
| v04b "It headed west, toward Hainan." | track heads west-north-west from Luzon to east of Hainan, 3–6 Sep | §1 |
| v05 "62 metres per second. The top grade: super typhoon." | 62 m/s best-track maximum (5 Sep 08:00 and at landfall); ≥ 51.0 m/s is 超强台风, the highest of six grades | §1, §2, §6 |
| v06 "It came ashore at Wenchang, and the land bent the lines." | landfall Wenchang 6 Sep 16:20; the bending over land is the model's terrain approximation | §2, §7 |
| v07 "It crossed the strait, and struck the mainland again." | crossed the Qiongzhou Strait, second landfall Xuwen 6 Sep 22:20 | §3 |
| v08 "Into Vietnam, the spiral came apart, and the lines went back to ink." | landfall Quang Ninh 7 Sep 15:30, then rapid decay (40 m/s at 20:00, 18 m/s next morning) | §5 |
| v09 "Its whole week fits in one last line." | the intensity curve covers 1–8 Sep (best track 1 Sep 08:00 → 8 Sep 20:00) | §1 |

## 9. The map: South China Sea islands, the dashed line, Diaoyu Islands

How the map is drawn, and how sure each element is.

- **Taiwan**: the same ETOPO1 land, the same treatment as the mainland; no country name anywhere. No land boundary is drawn in the film, and no line in the Beibu Gulf.
- **Xisha Islands**: island marks at the base points of the 1996 declaration (中华人民共和国政府关于中华人民共和国领海基线的声明, Declaration of the Government of the People's Republic of China on the Baselines of the Territorial Sea, 1996-05-15), Xisha points 1–28: 东岛, 浪花礁 (ring), 中建岛, 北礁 (ring), 赵述岛, 北岛, 中岛, 南岛; 永兴岛 from Wikidata Q393044. Official coordinates.
- **Huangyan Dao**: reef ring through the 15 base points of the 2024-11-10 declaration. Official coordinates.
- **Diaoyu Dao and its affiliated islands, Chiwei Yu**: island marks at the base points of the 2012-09-10 declaration (parts I and II). Official coordinates. In frame only in the opening oblique view (top left, small, unlabelled).
- **Dongsha, Nansha, Zhongsha, Zengmu Ansha**: Wikidata coordinates (CC0); item ids in CREDITS and `tools/make_scs.py`. Island marks are symbols scaled up to stay legible, not coastlines.
- **Names**: standard Chinese names; English in pinyin (Xisha Islands, Huangyan Dao). Every name is placed beside its group, clear of the dashed line.
- **The 南海诸岛 inset**: the region shot (3) and the closing map (8) show the South China Sea without its southern part, so both carry an inset, 2–23°N, 105–122°E, Mercator, with the nine dashes in the sea, all four island groups and Zengmu Ansha (labelled). Its coastline is ETOPO1 at 6′ (`tools/prep_inset.py`). The dash east of Taiwan lies outside the inset (north of 23°N).
- **The dashed line, nine dashes in the South China Sea**: from Natural Earth's China point-of-view maritime indicator layer (public domain). China has published no coordinates for the dashes, so every dash is an approximation at the scale of a regional sea chart, not a survey position. Nine dashes in the sea plus one east of Taiwan, ten in all, as on the current standard map of China; none in the Beibu Gulf. From north-west to north-east: off central Vietnam (≈109.3–109.9°E, 15.6–16.6°N), off southern Vietnam (≈110.1–110.4°E, 11.5–12.6°N), north of Natuna (≈108.3–108.4°E, 6.2–7.4°N), south of Zengmu Ansha (≈111.5–112.7°E, 3.4–3.7°N), west of Sabah and Palawan (≈115.7–116.5°E, 7.3–8.1°N), north-west of Palawan (≈118.6–119.0°E, 11.3–12.4°N), east of Huangyan Dao (≈119.0°E, 14.8–15.9°N), north-west of Luzon (≈119.4–119.8°E, 17.8–18.8°N), the Bashi Channel (≈121.1–121.8°E, 20.9–21.7°N).
- **The dash east of Taiwan**: no coordinates in any source reached. It is drawn because the sea east of Taiwan is in frame in the opening view, the region shot and the closing map; its position is an illustration: the median between Taiwan's east coast (ETOPO1, 121.48°E at 23.4°N, 121.87°E at 24.6°N) and Yonaguni-jima (Wikidata Q220701, 24.455°N 122.987°E), 23.4–24.6°N, about the length of the other dashes. The two end points are `twn` in `tools/make_scs.py`.
