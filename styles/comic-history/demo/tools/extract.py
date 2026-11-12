"""Chroma-key the three puppet part sheets and cut every part into its own PNG.

Usage: .venv/bin/python styles/comic-history/demo/tools/extract.py   (reads src/sheet-*.png, writes parts/)
Writes parts/<sheet>_<n>.png and parts/index.json (bbox of every part in sheet px)
plus parts/<sheet>_debug.jpg with each part numbered, so pivots can be read off.

Key: green dominance d = g - max(r, b). Background d ~ 110+, paper parts d < 10.
alpha = 1 - smoothstep(lo, hi, d); despill: g clamped to max(r, b) + small margin
where the pixel is near the key, so no green fringe survives on the paper edge.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the film folder (this file is in tools/)
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'parts')
os.makedirs(OUT, exist_ok=True)

SHEETS = {'fr': 'sheet-fr.png', 'pr': 'sheet-pr.png', 'al': 'sheet-al.png'}
GROW = {'fr': 6, 'pr': 6, 'al': 3}   # the Alsace sheet has tighter gaps between the arm pieces
UP = 2  # upsample before keying: the sheets are only 1672 px wide


def key(img):
    a = np.asarray(img).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    lo, hi = 28.0, 70.0
    t = np.clip((d - lo) / (hi - lo), 0, 1)
    alpha = 1 - t * t * (3 - 2 * t)
    # despill: anywhere green leads, pull it back to the other channels
    spill = np.clip((d - 4) / 40.0, 0, 1)
    g2 = g - spill * np.maximum(d - 4, 0)
    out = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    return out, alpha


def paper_edge(crop, px=7):
    """Leave a margin of cream card around the piece, as if cut out with scissors."""
    a = crop[..., 3].astype(np.float32) / 255
    core = a > 0.5
    rim = ndi.binary_dilation(core, iterations=px)
    rim = ndi.binary_closing(rim, iterations=4)
    rimf = ndi.gaussian_filter(rim.astype(np.float32), 0.9)
    h, w = a.shape
    rng = np.random.default_rng(h * 7 + w)
    n = ndi.gaussian_filter(rng.standard_normal((h, w)), 1.2) * 10
    card = np.dstack([241 + n, 233 + n, 214 + n * 0.9]).clip(0, 255)
    rgb = crop[..., :3].astype(np.float32)
    # a hairline of darker card where the piece meets the margin (glue line)
    edge = np.clip(ndi.gaussian_filter(core.astype(np.float32), 1.5) - a, 0, 1)[..., None]
    out_rgb = rgb * a[..., None] + card * (1 - a[..., None])
    out_rgb = out_rgb * (1 - 0.25 * edge)
    out_a = np.maximum(a, rimf)
    return np.dstack([out_rgb, out_a * 255]).clip(0, 255).astype(np.uint8)


def main():
    index = {}
    for name, fn in SHEETS.items():
        img = Image.open(os.path.join(SRC, fn)).convert('RGB')
        img = img.resize((img.width * UP, img.height * UP), Image.LANCZOS)
        rgba, alpha = key(img)
        solid = alpha > 0.5
        solid = ndi.binary_opening(solid, iterations=2)
        # bridge hairline gaps inside one part (rivets, epaulette fringes)
        grown = ndi.binary_dilation(solid, iterations=GROW[name])
        lab, n = ndi.label(grown)
        objs = ndi.find_objects(lab)
        parts = []
        dbg = Image.fromarray(rgba).convert('RGB').resize((img.width // UP, img.height // UP))
        dr = ImageDraw.Draw(dbg)
        for i, sl in enumerate(objs):
            ys, xs = sl
            area = int((lab[sl] == i + 1).sum())
            if area < 4000:
                continue
            pad = 24
            y0, y1 = max(ys.start - pad, 0), min(ys.stop + pad, img.height)
            x0, x1 = max(xs.start - pad, 0), min(xs.stop + pad, img.width)
            m = (lab[y0:y1, x0:x1] == i + 1)
            crop = rgba[y0:y1, x0:x1].copy()
            crop[..., 3] = (crop[..., 3] * m).astype(np.uint8)
            crop = paper_edge(crop)
            k = len(parts)
            Image.fromarray(crop).save(os.path.join(OUT, f'{name}_{k}.png'))
            parts.append({'id': k, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})
            dr.rectangle([x0 / UP, y0 / UP, x1 / UP, y1 / UP], outline=(255, 0, 255))
            dr.text((x0 / UP + 4, y0 / UP + 2), str(k), fill=(255, 0, 255))
        dbg.save(os.path.join(OUT, f'{name}_debug.jpg'), quality=88)
        index[name] = {'scale': UP, 'parts': parts}
        print(name, len(parts), 'parts')
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
