"""Glyph skeletons for stroke-by-stroke handwriting.

For every glyph we need, render it big with Pillow, thin it to a 1-px centre line (Zhang-Suen),
then walk that centre line the way a pen would: start at the top-left free end, keep going in the
smoothest direction, lift the pen and jump to the nearest remaining free end when a stroke ends.
The page reveals each glyph by stroking a fat mask along this path (destination-in), so letters
appear stroke by stroke in the real font's shapes.

Output: glyphs.json = {font: {hw: half stroke width (em), g: {char: [[x,y, x,y, ...], ...]}}}
coordinates in em units relative to the glyph origin (left, baseline), y down.
Run:  .venv/bin/python tools/skeleton.py   (from the film folder or anywhere)
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 220  # render size in px (1 em)
ASCII = ''.join(chr(c) for c in range(33, 127)) + '≈·×→’²√'
ZH_CHARS = open(os.path.join(HERE, 'tools', 'zh_chars.txt'), encoding='utf-8').read().strip()
FONTS = {   # key = the family name the page registers
    'Kalam700': ('fonts/Kalam-Bold.ttf', ASCII),
    'Kalam400': ('fonts/Kalam-Regular.ttf', ASCII),
    'LXGW400': ('fonts/LXGWMarkerGothic-film.ttf', ZH_CHARS),
}


def thin(img):
    """Zhang-Suen thinning, vectorised. img: bool array."""
    I = np.pad(img.astype(np.uint8), 1)
    while True:
        changed = False
        for step in (0, 1):
            P2 = I[:-2, 1:-1]; P3 = I[:-2, 2:]; P4 = I[1:-1, 2:]; P5 = I[2:, 2:]
            P6 = I[2:, 1:-1]; P7 = I[2:, :-2]; P8 = I[1:-1, :-2]; P9 = I[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(int) for n in nb)
            seq = nb + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                c = (P2 * P4 * P6 == 0) & (P4 * P6 * P8 == 0)
            else:
                c = (P2 * P4 * P8 == 0) & (P2 * P6 * P8 == 0)
            m = (I[1:-1, 1:-1] == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if m.any():
                I[1:-1, 1:-1][m] = 0; changed = True
        if not changed:
            break
    return I[1:-1, 1:-1].astype(bool)


NB = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


def trace(sk):
    pts = set(zip(*np.nonzero(sk.T)))  # (x, y)
    left = set(pts)
    def nbrs(p, pool):
        return [(p[0] + dx, p[1] + dy) for dx, dy in NB if (p[0] + dx, p[1] + dy) in pool]
    strokes = []; cur = None
    while left:
        ends = [p for p in left if len(nbrs(p, left)) <= 1]
        cand = ends if ends else list(left)
        if cur is None:
            start = min(cand, key=lambda p: p[0] * 1.0 + p[1] * 0.6)
        else:
            start = min(cand, key=lambda p: (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2)
        path = [start]; left.discard(start); d = None
        while True:
            nx = nbrs(path[-1], left)
            if not nx:
                break
            if d is None:
                q = min(nx, key=lambda p: abs(p[0] - path[-1][0]) + abs(p[1] - path[-1][1]))
            else:
                q = max(nx, key=lambda p: ((p[0] - path[-1][0]) * d[0] + (p[1] - path[-1][1]) * d[1]) /
                        max(1e-6, np.hypot(p[0] - path[-1][0], p[1] - path[-1][1])))
            # staircase leftovers: other neighbours of the previous pixel that also touch q are redundant
            for r in nbrs(path[-1], left):
                if r != q and abs(r[0] - q[0]) <= 1 and abs(r[1] - q[1]) <= 1:
                    left.discard(r)
            path.append(q); left.discard(q)
            # smoothed direction over the last few pixels
            k = min(len(path) - 1, 4); d = (path[-1][0] - path[-1 - k][0], path[-1][1] - path[-1 - k][1])
        cur = path[-1]
        if len(path) >= 3:
            strokes.append(path)
        elif strokes:
            strokes[-1].extend(path)
        else:
            strokes.append(path)
    return strokes


def rdp(P, eps):
    if len(P) < 3:
        return P
    a, b = np.array(P[0], float), np.array(P[-1], float)
    ab = b - a; L = np.hypot(*ab)
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L if L else np.hypot(*(np.array(p, float) - a)) for p in P]
    i = int(np.argmax(d))
    if d[i] > eps:
        return rdp(P[:i + 1], eps)[:-1] + rdp(P[i:], eps)
    return [P[0], P[-1]]


def main():
    out = {}
    for key, (path, chars) in FONTS.items():
        font = ImageFont.truetype(os.path.join(HERE, path), S)
        g = {}; hws = []
        for ch in chars:
            pad = S
            img = Image.new('L', (S * 3, S * 3), 0)
            ImageDraw.Draw(img).text((pad, pad * 2), ch, font=font, fill=255, anchor='ls')
            a = np.array(img) > 110
            if not a.any():
                continue
            dt = ndimage.distance_transform_edt(a)
            sk = thin(a)
            hws.append(np.percentile(dt[sk], 90))
            strokes = trace(sk)
            res = []
            for st in strokes:
                st = rdp(st, 0.9)
                res.append([round(v, 4) for p in st for v in ((p[0] - pad) / S, (p[1] - pad * 2) / S)])
            g[ch] = res
        out[key] = {'hw': round(float(np.median(hws)) / S, 4), 'g': g}
        print(key, len(g), 'glyphs, half width', out[key]['hw'])
    with open(os.path.join(HERE, 'glyphs.json'), 'w') as f:
        json.dump(out, f, separators=(',', ':'), ensure_ascii=False)


if __name__ == '__main__':
    main()
