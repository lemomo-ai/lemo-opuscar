# Facts on screen and in the voice

Every number or name the film prints or says, where it comes from and the source's own words; what could not be sourced says how it was worked out. The voice text is `voice/lines.json` (Chinese) and `data/subs_en.json` (English, also spoken in the English version).

## Sources

- [S1] Baihetan Dam, Wikipedia — https://en.wikipedia.org/wiki/Baihetan_Dam — "equipped with 16 hydro-generating units each having a capacity of 1 gigawatt"; "All hydro-generating units of the Baihetan hydropower station became fully operational on 20 December 2022."
- [S2] The Paper (澎湃新闻) — https://www.thepaper.cn/newsDetail_forward_21364518 — "其中，左岸、右岸各建设8台百万千瓦级机组，分别送电江苏、浙江。" ("Of these, eight 1 GW units are built on each of the left and right banks, sending power to Jiangsu and Zhejiang respectively.")
- [S3] IT之家, Baihetan–Jiangsu line in service — https://www.ithome.com/0/627/417.htm — "白鹤滩-江苏工程起于四川省凉山州布拖县，止于江苏省苏州常熟市，途经四川、重庆、湖北、安徽、江苏 5 省（直辖市），线路全长 2080 公里，新建白鹤滩、虞城 2 座换流站。" ("The Baihetan–Jiangsu project starts in Butuo county, Liangshan prefecture, Sichuan, and ends in Changshu, Suzhou, Jiangsu, passing through 5 provinces and municipalities (Sichuan, Chongqing, Hubei, Anhui, Jiangsu); the line is 2,080 km long, with 2 new converter stations, Baihetan and Yucheng.") "工程额定电压 ±800 千伏、额定输送容量 800 万千瓦……2022 年 7 月竣工投产。" ("Rated voltage ±800 kV, rated capacity 8 GW … completed and put into service in July 2022.")
- [S4] China News Service (中国新闻网), 2022-06-20 — https://www.chinanews.com.cn/gn/2022/06-20/9783791.shtml — "以白江线为例，起于四川凉山布拖换流站，止于江苏常熟虞城换流站。" ("Take the Baihetan–Jiangsu line: it starts at the Butuo converter station, Liangshan, Sichuan, and ends at the Yucheng converter station, Changshu, Jiangsu.") On UHV transmission: "输电距离远、输送容量大、运行损耗低……特高压让“电从远方来”成为现实" ("long transmission distance, large capacity, low running loss … UHV makes 'power from far away' a reality").
- [S5] Structural study of ±800 kV valve halls (steel-framed buildings housing the converter valves) — https://aminer.org/pub/53e9a42bb7602d9702d47000/structure-form-selection-of-the-valve-hall-and-control-building-of-kv
- [S6] GB/T 156, 标准电压 (Chinese national standard voltages): household supply 220 V, 50 Hz.

## On screen

| Printed | Claim | Source / how |
|---|---|---|
| 白鹤滩 / BAIHETAN (small, texture), 16 generator pads G1–G16 | Baihetan has 16 units of 1 GW | [S1] |
| G1–G8 run to the Jiangsu line; G9–G16 leave through connector J2 | eight units on each bank; one bank sends to Jiangsu, the other to Zhejiang | [S2]. The picture never prints 左岸/右岸 |
| 换流站 / CONVERTER STATION (both ends) | converter stations at Butuo and at Yucheng, Changshu | [S3], [S4]. The sending station is also reported as 白鹤滩换流站; it stands in Butuo county, and the film names neither |
| 四川 / SICHUAN, 江苏 / JIANGSU, 2,080 公里 / 2,080 km | the line runs 2,080 km from Sichuan to Jiangsu | [S3] |
| 7 毫秒 / 7 ms | worked out: 2,080 km ÷ 299,792 km/s ≈ 6.94 ms. On an overhead line the wave travels a little slower than light in vacuum, so the voice says "only" and the figure is rounded to 7. What crosses in 7 ms is the electromagnetic signal, not the electrons, which drift far more slowly | arithmetic |
| test pads every 500 km (small "500 km" texture) | placed at 500/2080, 1000/2080, 1500/2080 of the drawn route's length; the route itself is schematic | arithmetic |
| 220 V ~ 50 Hz (small, on the socket) | household supply in mainland China | [S6] |
| 充电器 / CHARGER, USB-C · 20 W (small) | a fictional 20 W phone charger; its layout is invented. The chain plug → fuse → bridge rectifier → bulk capacitor → flyback transformer → output is the common one for small chargers | — |
| 整流桥 / BRIDGE RECTIFIER, 交流 → 直流 / AC → DC, 同一个电路原理 / THE SAME CIRCUIT | both ends are drawn with the bridge-rectifier symbol meaning "AC becomes DC" (the inverter is its mirror). Simplification: a real ±800 kV converter uses 12-pulse thyristor valve groups, not four diodes; the principle (bridge rectification) is the same | stated as a principle |
| 功率差 4 亿倍 / 400 MILLION × THE POWER | 8,000 MW (the line's rated capacity) ÷ 20 W (the film's charger) = 4 × 10⁸ | [S3] + arithmetic |

Drawn but not labelled (texture, not claims): the Yangtze with the Jinsha, Jialing, Wu, Han, Xiang and Gan rivers; Dongting, Poyang, Chaohu and Taihu lakes; the east coast; real cities as round test points with pinyin tags; three more ±800 kV lines of the west-to-east corridor (to Suzhou, Shanghai and Jinhua), never lit. All routes are schematic (octilinear), not survey-accurate. No provincial or national borders are drawn; the board shows only the Yangtze corridor.

## In the voice

| Line | Claim | Source / how |
|---|---|---|
| 四川深山里发出来的电 | the Jiangsu line starts at Butuo, Liangshan, Sichuan, fed by Baihetan in the mountains on the Sichuan–Yunnan border | [S3], [S4] |
| 仅仅七毫秒 / 全程只要七毫秒 | ≈ 6.9 ms | arithmetic (above) |
| 两千公里外 / 两千多公里长 | 2,080 km | [S3] |
| 如果直接送去太远的地方，在路上就会白白损耗掉很多 | long distance is why UHV DC is used, and low running loss is one of its stated advantages; the voice says it without a figure | [S4] |
| 电得先进一趟换流站，变成只朝一个方向跑的直流电 / 到了终点站，它会被重新变回交流电 | converter stations at both ends | [S3] |
| 再把电压一级一级降下来，最终送进你家墙上的插座里 | stepped down through the grid to 220 V at the socket | [S6]; the steps are not numbered |
| 换流站里那个几层楼高的大家伙 | a spoken description, not a measured figure: the converter valves hang in a valve hall, a steel-framed building [S5] tens of metres tall; no official height for this station was found, so no number is said or printed | colloquial |
| 用的是同一个电路原理 | both rectify with a bridge (simplification above) | — |
| 是这个小充电头的整整四亿倍 | 8,000 MW ÷ 20 W = 4 × 10⁸ | [S3] + arithmetic |
