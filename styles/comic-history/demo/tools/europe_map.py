"""Builds demo/europe.json, the only map data the page loads: python3 tools/europe_map.py (needs network).

Reads world-atlas 2.0.2 countries-50m.json (Natural Earth 1:50m admin-0, public domain; ISC) from the npm CDN in
memory, keeps the countries the page prints (GROUPS in index.html) and clips them to a box around the frame
(12°W–30°E, 36°N–71°N). The output is TopoJSON with the source's quantisation, one arc per ring, so every point
inside the box decodes to exactly the value it had in the source. The box edges stay far outside every view the
film bakes (the tallest is the crane shot's sheet, about 8°W–22°E, 43°N–66°N).
"""
import json
import pathlib
import urllib.request

SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "europe.json"
BOX = (-12.0, 36.0, 30.0, 71.0)  # lon0, lat0, lon1, lat1
NAMES = [
    "France", "Monaco", "Germany", "Poland", "Austria", "Hungary", "Czechia", "Slovakia", "Slovenia", "Croatia",
    "Bosnia and Herz.", "Italy", "San Marino", "Vatican", "Lithuania", "Belarus", "Ukraine", "Russia", "Latvia",
    "Moldova", "United Kingdom", "Ireland", "Isle of Man", "Jersey", "Guernsey", "Spain", "Andorra", "Portugal",
    "Switzerland", "Liechtenstein", "Belgium", "Netherlands", "Luxembourg", "Denmark", "Sweden", "Norway",
    "Serbia", "Romania", "Montenegro", "Kosovo", "Albania", "Macedonia", "Bulgaria",
]


def clip(ring, x0, y0, x1, y1):
    """Sutherland-Hodgman against an axis-aligned box, in quantised integer space."""
    def cut(pts, inside, inter):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q):
                    out.append(inter(q, p))
                out.append(p)
            elif inside(q):
                out.append(inter(q, p))
        return out

    def at_x(x):
        return lambda a, b: [x, round(a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))]

    def at_y(y):
        return lambda a, b: [round(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])), y]

    pts = ring[:-1]
    for inside, inter in ((lambda p: p[0] >= x0, at_x(x0)), (lambda p: p[0] <= x1, at_x(x1)),
                          (lambda p: p[1] >= y0, at_y(y0)), (lambda p: p[1] <= y1, at_y(y1))):
        if not pts:
            break
        pts = cut(pts, inside, inter)
    return pts + pts[:1] if len(pts) >= 3 else None


def main():
    with urllib.request.urlopen(SRC) as r:
        topo = json.load(r)
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for a in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append([x, y])
        arcs.append(pts)

    def ring(idx):
        pts = []
        for i in idx:
            a = arcs[~i][::-1] if i < 0 else arcs[i]
            pts.extend(a[1:] if pts else a)
        return pts

    qbox = (round((BOX[0] - tx) / sx), round((BOX[1] - ty) / sy), round((BOX[2] - tx) / sx), round((BOX[3] - ty) / sy))
    out_arcs, geoms = [], []
    by_name = {g["properties"]["name"]: g for g in topo["objects"]["countries"]["geometries"]}
    for name in NAMES:
        g = by_name.get(name)
        if not g:
            continue
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"] if g["type"] == "MultiPolygon" else []
        new_polys = []
        for p in polys:
            new_p = []
            for k, idx in enumerate(p):
                r = ring(idx)
                c = r if all(qbox[0] <= x <= qbox[2] and qbox[1] <= y <= qbox[3] for x, y in r) else clip(r, *qbox)
                if c is None:
                    if k == 0:
                        break  # outer ring gone: drop the polygon with its holes
                    continue
                delta = [c[0]] + [[b[0] - a[0], b[1] - a[1]] for a, b in zip(c, c[1:])]
                new_p.append([len(out_arcs)])
                out_arcs.append(delta)
            if new_p:
                new_polys.append(new_p)
        if new_polys:
            geoms.append({"type": "MultiPolygon", "properties": {"name": name}, "arcs": new_polys})
    out = {"type": "Topology", "transform": topo["transform"],
           "objects": {"countries": {"type": "GeometryCollection", "geometries": geoms}}, "arcs": out_arcs}
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{OUT.name}: {len(geoms)} countries, {len(out_arcs)} rings, {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
