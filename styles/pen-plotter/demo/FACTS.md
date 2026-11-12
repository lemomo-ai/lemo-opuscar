# FACTS · 8848.86

Every number on the sheet, where it comes from, and the wording quoted from the source. Checked against the final `plot.json` (tools/make_plot.py).

## Summit heights (the inset, the number)

| On screen | Claim | Source | Quoted wording |
|---|---|---|---|
| 2020 · 8848.86 m · 雪面高程 snow surface; 8848.86 m; 2020年 中尼共同宣布 / Announced by China and Nepal, 2020 | On 8 December 2020 China and Nepal jointly announced the summit height 8848.86 m; it is a snow-surface height | People's Daily, 2020-12-09, p. 15: https://paper.people.com.cn/rmrbwap/html/2020-12/09/nw.D110000renmrb_20201209_2-15.htm · Ministry of Foreign Affairs of the PRC, 2020-12-08: https://www.mfa.gov.cn/web/gjhdq_676201/gj_676203/yz_676205/1206_676812/xgxw_676818/202012/t20201208_9301005.shtml | 「8848.86米！12月8日，中国、尼泊尔两国向全世界正式宣布，珠穆朗玛峰的最新高程为8848.86米。」(人民日报, People's Daily: "8848.86 metres! On 8 December, China and Nepal formally announced to the world that the latest height of Mount Qomolangma is 8848.86 metres.") · 「我很高兴同阁下一道，共同宣布珠穆朗玛峰最新雪面高程为8848.86米。」(班达里总统信函，外交部, President Bhandari's letter, Ministry of Foreign Affairs: "I am glad to announce together with Your Excellency that the latest snow-surface height of Mount Qomolangma is 8848.86 metres.") |
| 1975 · 8848.13 m | China's 1975 survey | People's Daily, same page | 「1975年，我国测得珠峰海拔高程为8848.13米；」 ("In 1975 China measured the height of Qomolangma as 8848.13 metres;") |
| 2005 · 8844.43 m · 岩面高程 rock surface | China's 2005 survey measured the rock surface of the summit | People's Daily, same page | 「2005年，我国测得珠峰峰顶岩石面的海拔高程为8844.43米；」 ("in 2005 China measured the height of the rock surface of the summit as 8844.43 metres;") |

The three values are not directly comparable (snow surface vs rock surface, different datums); the inset therefore labels 2005 as rock surface and 2020 as snow surface and claims no growth or shrinkage. 1975 carries no surface label because the quoted source gives none.

## Camps of the north route (the camp labels; the profile)

Source: China News Service (中新网), 2020-05-27, 《登顶！2020珠峰高程测量登山队站上喜马拉雅之巅》 (Summit! The 2020 Qomolangma height-survey team stands on top of the Himalayas), https://www.rmzxw.com.cn/c/2020-05-27/2583927.shtml ; China Daily, 2020-05-26, 《珠峰测量队向海拔8300进发，最新攻顶名单公布》 (Qomolangma survey team heads for 8300 m; latest summit team announced), https://cn.chinadaily.com.cn/a/202005/26/WS5ecca8c9a310eec9c72bb61a.html

| On screen | Quoted wording |
|---|---|
| 大本营 Base Camp 5200 m | 「登山队由珠峰海拔5200米位置的大本营出发」 ("the team set out from base camp at 5200 m") |
| 中间营地 Interim Camp 5800 m | 「途经绒布冰川和东绒布冰川，抵达海拔5800米的中间营地宿营」 ("by way of the Rongbuk and East Rongbuk glaciers, reaching the interim camp at 5800 m for the night") |
| 前进营地 Advanced Base Camp 6500 m | 「到达海拔6500米的前进营地」 ("reaching advanced base camp at 6500 m") |
| 一号营地 北坳 Camp 1, North Col 7028 m | 「途经海拔6600-7000米的北坳大冰壁，抵达海拔7028米的一号营地」 ("by way of the great ice wall of the North Col at 6600–7000 m, reaching Camp 1 at 7028 m"); China Daily: 「从海拔7028米的C1营地出发」 ("setting out from Camp C1 at 7028 m"); elsewhere called 北坳营地 (North Col Camp) |
| 二号营地 Camp 2 7790 m | 「途径海拔7500米的大风口，到达海拔7790米的二号营地」 ("by way of the windy gap at 7500 m, reaching Camp 2 at 7790 m") |
| 三号营地 Camp 3 8300 m | 「从二号营地出发，到达海拔8300米的三号营地」 ("setting out from Camp 2, reaching Camp 3 at 8300 m"; also called 突击营地, assault camp) |

## Names

- 珠穆朗玛峰 / Mount Qomolangma (Everest): Chinese official name; English as used by Xinhua.

## Terrain, route and profile (measured, not quoted)

- **Contours**: from NASADEM HGT v001 (see SOURCES.md), 1 arc-second, smoothed lightly (Gaussian σ 1.1 samples), interval 50 m, index contours every 250 m traced twice. Map scale 1:80 000, WGS 84 latitude/longitude, graticule every 2′. Crop: 27.900–28.160 N, 86.800–87.020 E.
- **NASADEM summit**: 8781 m at 27.9886 N, 86.9250 E. A 30 m DEM flattens the summit; the official height is a survey, not a DEM value, so the sheet takes the summit height from the survey and the terrain from the DEM.
- **Route line**: approximate (labelled 路线为示意 / Route line approximate on the sheet). A least-cost path through the DEM (cost rises with slope and with climbing) pinned at three published points: North Base Camp 28°8′29″N 86°51′5″E (Wikipedia, Everest base camps, https://en.wikipedia.org/wiki/Everest_base_camps), North Col 28°00′57″N 86°55′30″E (Wikipedia, North Col, https://en.wikipedia.org/wiki/North_Col), and the NASADEM summit cell. The path runs up the Rongbuk and East Rongbuk glaciers, under the North Col, up the north ridge and along the north-east ridge, matching the route in the CNS article above. Length 25.2 km.
- **Camp positions**: each camp sits where the route's DEM profile first reaches the camp's published height (so map and profile agree): Interim 9.9 km, ABC 17.5 km, C1 20.1 km (DEM 7034 m, 160 m from the published North Col point), C2 21.9 km, C3 23.2 km. Base Camp is the route's start; NASADEM gives 5141 m there against the published 5200 m.
- **Profile**: horizontal distance along the route line (km) against NASADEM height (m), 0–26 km × 5000–9000 m. Distances are therefore approximate, as the route is.
- **Relief lifted off the page** (low shot): the same contours every 100 m at true scale (1 mm = 80 m vertically and horizontally), fading back to the paper beyond ~80 mm from the massif.
