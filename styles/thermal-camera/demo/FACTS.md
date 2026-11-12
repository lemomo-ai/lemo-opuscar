# Fact sheet: 《冬夜，一栋楼的体温》 (A Building on a Winter Night)

The building, the residents and the dates are fictional. The temperatures on screen are not typed in: the surface temperature of every surface is computed from the material values below by steady-state heat transfer, then converted to an "apparent temperature" with the emissivity and the reflected ambient temperature and rendered into a temperature buffer. The spot meters, boxes and hottest-point cursor all read that buffer (`tools/measure.mjs` takes the median over each hold; the on-screen readout adds a ±0.1 refresh flicker on top of it).

Chinese source wording is quoted in the original, with an English translation in brackets.

## 1. Thermal values (GB 50176-2016, *Code for thermal design of civil building*)

Source: https://zh.wikisource.org/wiki/GB_50176-2016_民用建筑热工设计规范

| Claim | Source wording | Use in the film |
|---|---|---|
| External surface resistance 0.04 m²·K/W | Table B.4.1-2: "冬季 外墙、屋面与室外空气直接接触的地面 23.0 0.04" [Winter: external walls, roofs, floors in direct contact with outdoor air 23.0 0.04] | External surface temperature = outdoor + (indoor − outdoor)·U·Re, minus 0.6 °C for sky radiation |
| Internal surface resistance 0.11 m²·K/W | Table B.4.1-1: "冬季和夏季 墙面、地面……8.7 0.11" [Winter and summer: walls, floors … 8.7 0.11] | Wall U-values |
| Clay brick masonry λ = 0.81 | Table B.1: "重砂浆砌筑黏土砖砌体 1800 0.81 …" [Clay brick masonry laid in heavy mortar 1800 0.81 …] | 240 mm brick wall U ≈ 2.1 W/(m²K), external wall −4.4 °C |
| Reinforced concrete λ = 1.74 | Table B.1: "钢筋混凝土 2500 1.74 …" [Reinforced concrete 2500 1.74 …] | Ring beams, floor slabs and tie columns are thermal bridges (bright bands) |
| Polystyrene board λ = 0.039 | Table B.1: "聚苯乙烯泡沫塑料 20 0.039（白板）…" [Expanded polystyrene 20 0.039 (white board) …] | After the retrofit: 80 mm EPS (×1.2 correction), U ≈ 0.46, external wall −6.1 °C |
| Single glazing, centre of pane K ≈ 5.8 | Table C.5.3-1: "3mm 透明玻璃 5.8 …" [3 mm clear glass 5.8 …] | Single-glazed steel window, outer glass surface about −0.6 °C |

The wall below the window behind each radiator (120 mm): its inner surface is taken as 35 °C, which gives an outer surface of about +1 °C, the brightest patch on the external wall. This is a modelling assumption, not a clause of the standard. The riser pipes are modelled as set into wall chases near the outer face (a +3 °C vertical band), also an assumption.

## 2. Retrofit requirements (Ministry of Housing and Urban-Rural Development, Jianke [2008] No. 126)

Source: https://www.gov.cn/gongbao/content/2009/content_1205389.htm, 《北方采暖地区既有居住建筑供热计量及节能改造技术导则》（试行） [Technical guideline for heat metering and energy-saving retrofit of existing residential buildings in the northern heating region (trial)]

- 4.1.3: "改造后房间外窗的传热系数……在寒冷地区不应大于3.2W/（m2K）" [After the retrofit, the heat transfer coefficient of a room's external windows … in cold regions should not exceed 3.2 W/(m²K)] → the new windows in the film use 2.7.
- 3.0.2: "在保证室内温度达到设计要求的前提下，改造后热源端的节能效果应不低于20%。" [Provided the indoor temperature meets the design requirement, the energy saving at the heat source after the retrofit should be no less than 20%.] → the film's −61 % is heat loss through the building envelope, not energy use at the heat source; the two are measured on different bases.

## 3. Heat-loss estimate (on screen 187 kW → 73 kW, −61 %)

Script `tools/heatloss.py`: steady-state transmission plus ventilation, indoor 20 °C, outdoor −6 °C (a 26 K difference). Walls 1378 m² (U 2.27 before the retrofit including the thermal-bridge allowance, 0.50 after), windows 361 m² (5.5 → 2.7), roof 428 m² (1.5 → 0.40), ground floor unchanged, air changes 0.8 → 0.5 per hour. Output:

```
H before 7199 W/K -> 187 kW ; after 2795 W/K -> 73 kW ; change -61 %
```

Order of magnitude: the "65 % energy saving" for residential buildings in cold regions is measured against the 1980–1981 general housing designs (Tianjin's wording, https://finance.sina.com.cn/g/20050708/1532188337.shtml: "新建住宅的耗热量指标需达到14.4W/㎡以下，即在1980年-1981年住宅通用设计的基础上节能65%" [new housing must reach a heat consumption index below 14.4 W/m², that is, a 65% energy saving relative to the 1980–1981 general housing designs]). The old building in the film is a brick-and-concrete block of exactly that generation, so −61 % sits in that range.

## 4. Survey conditions

- Fluke, *Thermal imaging basics for building inspections*: "Confirm a difference in temperature (delta-T) of at least 10 °C (18 °F) from interior to exterior surfaces" (https://trutechtools.com/content/assets/blog/images/thermal-imaging-for-buildings-fluke-appilcations-note.pdf) → in the film it is 20 °C indoors, −6 °C outdoors, shot at night.
- Heating season: Beijing's heating regulations, "北京采暖期为当年11月15日至次年3月15日" [Beijing's heating season runs from 15 November to 15 March of the following year] (as reported by Xinhua, https://www.xinhuanet.com/politics/20251115/f2583aab2cf24014926d444d451b8022/c.html) → both surveys in the film take place in December.
- Indoor 18 °C: Beijing room temperatures, "卧室、起居室达到18度以上" [bedrooms and living rooms at 18 degrees or above] (China News Service, https://www.chinanews.com/sh/2013/10-29/5439029.shtml; a press report, not the text of a regulation) → the flats in the film are set to 18.5–22.5 °C, and one empty flat with its valve shut to 11 °C.

## 5. The ironbow palette

FLIR, *Picking a Thermal Color Palette* (https://www.flir.com/discover/industrial/picking-a-thermal-color-palette/): "Ironbow is a general-purpose palette that quickly identifies thermal anomalies using color to show heat distribution and subtle details." The film defines its own palette (black, blue-violet, magenta, orange, yellow, white) and copies no brand's colour table.

## 6. The cat

MSD Veterinary Manual, "Normal Rectal Temperature Ranges": cat 38.1–39.2 °C (https://www.msdvetmanual.com/multimedia/table/normal-rectal-temperature-ranges). The surface of the fur is far below body temperature: in the film the back reads 15.6 °C, the side against the car bonnet 21 °C, the face 25–28 °C and the open eyes 35 °C (the eyes are the body surface closest to core temperature). These surface temperatures are estimates based on the fur insulating and its upper surface radiating to the cold sky; no authoritative measurement of a cat's fur surface temperature outdoors on a winter night was found. The car bonnet, about half an hour after parking: 10–16 °C above the engine, 7 °C at the edge, both estimates.
