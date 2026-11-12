# SOURCES · 8848.86

No photographs, footage, 3D models or AI images. Everything on screen is drawn by code; the terrain is real elevation data.

## Elevation data

- **NASADEM HGT v001**, NASA JPL (2020), 1 arc-second, tiles NASADEM_HGT_n27e086, n28e086, n27e087, n28e087.
  - Citation: NASA JPL. (2020). NASADEM Merged DEM Global 1 arc second V001 [Dataset]. NASA Land Processes Distributed Active Archive Center. https://doi.org/10.5067/MEASURES/NASADEM/NASADEM_HGT.001 (derived from Shuttle Radar Topography Mission telemetry).
  - Licence: NASA Earthdata data-use guidance (https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance): NASA mission data are CC0 unless marked otherwise, "While there are no restrictions on the use of these data"; NASA material may not be used to imply NASA endorsement. Shown on the sheet as 高程数据 NASADEM（美国航天局，公有领域）/ Elevation data NASADEM (NASA, public domain).
  - Download: Microsoft Planetary Computer STAC, collection `nasadem` (Cloud-Optimised GeoTIFF, anonymous read token): `tools/fetch_dem.py`, log in `data/raw/download_log.json` (the downloaded tiles and font sources live in `data/`, kept local; `build.sh` fetches them).
  - Processing: `tools/crop_dem.py` (mosaic + crop → `data/dem.npy`), `tools/route.py` (route line + profile → `data/route.json`), `tools/make_plot.py` (contours, hatching, profile, lettering → `plot.json`). `tools/preview_route.py` draws a check image of the route over the terrain.

## Place coordinates (route pins)

- North Base Camp 28°8′29″N 86°51′5″E: Wikipedia, "Everest base camps" (CC BY-SA text; a coordinate fact only, no text reused).
- North Col 28°00′57″N 86°55′30″E: Wikipedia, "North Col" (same).

## Facts

- Heights and camp altitudes: see FACTS.md (People's Daily, Ministry of Foreign Affairs of the PRC, China News Service, China Daily).
