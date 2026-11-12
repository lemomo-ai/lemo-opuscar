"""Turns generated images into "printed black-and-white manga": solid ink black + paper white + screentone (gray areas → 45° dot screen), the red camera body → the only accent colour.

Usage: python prep.py <src.png> <name> [--key] [--width W] [--cell C] [--crop x0,y0,x1,y1] [--hi H] [--lo L]
  --key    pure-green key (figures / products), output with an alpha channel (transparent = background)
  --width  scale to this width first (≈ the display size on screen, so the dots come out at "print size")
  --cell   dot period (pixels; 6–9 px on screen looks most like screentone)
  --lo/--hi  luminance thresholds: < lo → solid black; > hi → paper white; the "flat gray" in between → screentone
Output img/<name>.png (RGBA, only the three colours INK / PAPER / ACC + dot anti-aliasing)
"""
import os, argparse
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, binary_dilation

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK = np.array([18, 18, 18], np.float32) / 255
PAPER = np.array([243, 240, 232], np.float32) / 255
ACC = np.array([240, 60, 30], np.float32) / 255        # vermilion #F03C1E: the only colour in the film


def sm(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def dots(v, cell, H, W, ang=45):
    """AM dot screen: coverage v (0..1) → ink amount (0..1), 1 px anti-aliasing"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.deg2rad(ang)
    u = xx * np.cos(a) + yy * np.sin(a)
    w = -xx * np.sin(a) + yy * np.cos(a)
    fu = (u / cell) % 1 - .5
    fw = (w / cell) % 1 - .5
    d = np.sqrt(fu * fu + fw * fw) * cell
    r = cell * np.sqrt(np.clip(v, 0, 1) / np.pi) * 1.05
    return np.clip(r - d + .5, 0, 1) * (v > .04)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('name')
    ap.add_argument('--key', action='store_true')
    ap.add_argument('--width', type=int, default=0)
    ap.add_argument('--cell', type=float, default=7)
    ap.add_argument('--crop', default='')
    ap.add_argument('--lo', type=float, default=.30)
    ap.add_argument('--hi', type=float, default=.86)
    ap.add_argument('--pad', type=int, default=16)
    a = ap.parse_args()

    im = Image.open(a.src).convert('RGB')
    if a.crop:
        im = im.crop(tuple(int(v) for v in a.crop.split(',')))
    if a.width:
        im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float32) / 255
    H, W, _ = rgb.shape
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    matte = np.ones((H, W), np.float32)
    if a.key:
        gd = g - np.maximum(r, b)
        matte = 1 - sm(.10, .28, gd)
        m = Image.fromarray((matte * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
        matte = np.asarray(m).astype(np.float32) / 255
        g = np.minimum(g, np.maximum(r, b) + .03)          # remove green fringe

    # accent colour: the red camera body (strongly red and not too dark)
    rd = r - np.maximum(g, b)
    acc = sm(.28, .45, rd) * sm(.30, .45, r)
    acc = gaussian_filter(acc, .6)

    L = .30 * r + .59 * g + .11 * b
    L = np.where(acc > .5, 1.0, L)                         # red areas count as paper white; colour is laid on below
    # detail areas (lines, hatching): high local variance → hard threshold; flat gray: low variance → screentone
    mu = gaussian_filter(L, 2.0)
    sd = np.sqrt(np.maximum(gaussian_filter(L * L, 2.0) - mu * mu, 0))
    detail = sm(.06, .14, sd)
    hard = 1 - sm(.44, .56, L)                              # binarize the linework
    flat_v = np.clip((a.hi - mu) / (a.hi - a.lo), 0, 1)     # 0 = white … 1 = black
    solid = sm(.84, .95, flat_v)
    tone_v = np.clip(flat_v * .62, 0, .62)                  # screentone covers at most 62%
    tone = np.maximum(dots(tone_v, a.cell, H, W), solid)
    ink = detail * hard + (1 - detail) * tone
    ink = np.where(L < a.lo * .7, 1.0, ink)                 # true black always stays solid black

    col = PAPER[None, None] * (1 - ink[..., None]) + INK[None, None] * ink[..., None]
    accm = acc * (1 - (L < .25))                            # keep black lines inside red areas
    # dark parts of the source inside red areas (body shadows) → screentone over the red
    rlum = r
    rshade = dots(np.clip((.85 - rlum) * 1.4, 0, .5), a.cell, H, W, 45) * acc
    accol = ACC[None, None] * (1 - rshade[..., None]) + INK[None, None] * rshade[..., None]
    col = col * (1 - accm[..., None]) + accol * accm[..., None]

    out = np.dstack([col, matte])
    if a.key:
        ys, xs = np.where(matte > .5)
        x0, x1 = max(0, xs.min() - a.pad), min(W, xs.max() + a.pad)
        y0, y1 = max(0, ys.min() - a.pad), min(H, ys.max() + a.pad)
        out = out[y0:y1, x0:x1]
        print(f'{a.name}: bbox {x0},{y0},{x1},{y1} of {W}x{H}')
    os.makedirs(os.path.join(HERE, 'img'), exist_ok=True)
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA').save(os.path.join(HERE, 'img', a.name + '.png'))
    print(a.name, out.shape[1], 'x', out.shape[0])


if __name__ == '__main__':
    main()
