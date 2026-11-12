# Facts in «How Far Can You See?»

Every number on the sheets and in the narration is computed in `film.js` from the values below (`R_KM`, `H1`, `H2`, `H3`, `dKm`).

| Claim | Value | Source / status |
|---|---|---|
| Earth's radius | R = 6,371 km | NASA NSSDCA, Earth Fact Sheet, <https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html>: "Volumetric mean radius (km) 6371.000" (checked 2026-10-31) |
| Eye height of the viewer | h = 1.6 m | An example value: the height of an adult's eyes above the ground (eyes sit roughly 0.1 m below the top of the head). Not a measurement. |
| Distance to the horizon | d = √((R + h)² − R²) = √(2Rh + h²) ≈ √(2Rh) | Geometry: the line of sight is tangent to the sphere, so it is perpendicular to the radius. h² is dropped because h ≪ R. |
| From 1.6 m | ≈ 4.52 km (shown and said 4.5 km) | Computed. |
| From 160 m (100 × 1.6 m) | ≈ 45.2 km (shown 45 km, said "ten times farther") | Computed; √100 = 10. 160 m is an example height, not a particular tower. |
| From 10 km | ≈ 357.0 km (shown ≈ 357 km, said "about three hundred and fifty-seven kilometres") | Computed. "A plane, 10 km up" is an example height; airliners are commonly said to cruise at roughly 10–12 km (about 33,000–40,000 ft), which this film does not state as a figure. |
| Rule of thumb | d (km) ≈ 3.57 √h (m) | √(2 × 6,371 / 1000) = 3.5696; not shown, given for reuse. |

Limits stated plainly: these are geometric horizons over a smooth sphere. Atmospheric refraction usually puts the visible horizon a few per cent farther; terrain, waves and the height of the far object are ignored. Sheets ① and ② exaggerate the Earth's curvature to make the geometry visible; the bars on sheet ③ are drawn to scale (1150 px = 357 km).
