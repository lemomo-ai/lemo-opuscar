"""Vintage Engraving Collage · base parts: the old-paper table and the torn colour papers, saved as parts/*.png + parts/manifest.json.
Shared helpers (palette, save(), torn-paper sprites) used by bake2.py. Fixed seeds: the output is deterministic.
Run from the library root:  .venv/bin/python styles/vintage-collage/demo/src/bake.py
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import collage_lib as cl
from collage_lib import fbm, torn, paper_texture, poly_mask, ellipse_mask, engrave, ink_from_gray

RAW = os.path.join(ROOT, 'raw')
OUT = os.path.join(ROOT, 'parts')
FONTS = os.path.join(ROOT, 'fonts')
os.makedirs(OUT, exist_ok=True)

B = 1.5            # bake scale: parts are stored at world coordinates ×1.5 in pixels, so a push-in to 1.24× stays sharp
BG_B = 1.25        # scale of the base paper

# ---------- Palette (6 colours, hex in STYLE.md §3) ----------
hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
PAPER = hexc('#ECDFC2')      # old paper of the table top
CARD = hexc('#F6EEDB')       # cut-out engraving paper / paper slips
INK = hexc('#221C17')        # ink
OCHRE = hexc('#C65F3A')      # ochre red
TEAL = hexc('#2F7F7A')       # teal
MUSTARD = hexc('#E1AB3B')    # mustard
BRASS = hexc('#C49548')      # hand-tinted gears (mustard one step darker)
cl.PAPER, cl.PAPER_HI, cl.INK = PAPER, CARD, INK

MANIFEST = {}


def save(name, rgb, alpha, **meta):
    """rgb (h,w,3) float 0..255, alpha (h,w) 0..1 → parts/<name>.png; meta goes into the manifest."""
    a = np.clip(alpha, 0, 1)
    ys, xs = np.nonzero(a > 0.004)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    y0, x0 = max(0, y0 - 2), max(0, x0 - 2)
    y1, x1 = min(a.shape[0], y1 + 2), min(a.shape[1], x1 + 2)
    im = np.dstack([np.clip(rgb, 0, 255), a * 255])[y0:y1, x0:x1].astype(np.uint8)
    Image.fromarray(im, 'RGBA').save(os.path.join(OUT, name + '.png'), optimize=False, compress_level=3)
    m = dict(w=int(x1 - x0), h=int(y1 - y0), crop=[int(x0), int(y0)], **meta)
    MANIFEST[name] = m
    return m


def tear_sprite(mask, color, seed, rough, mottle=0.06, fringe=True, tex=None):
    body, fr = torn(mask, rough=rough, seed=seed)
    h, w = mask.shape
    t = 1 + mottle * fbm(h, w, scales=(3 * B, 12 * B, 40 * B), weights=(0.3, 0.4, 0.3), seed=seed + 11)
    if tex is not None:
        t = t * tex
    col = color[None, None, :] * t[..., None]
    if fringe:
        a = np.maximum(body, fr * 0.92)
        w_ = np.clip(fr * 0.92 - body, 0, 1) / np.maximum(a, 1e-6)
        col = col * (1 - w_[..., None]) + CARD * 1.01 * w_[..., None]
    else:
        a = body
    return col, a


# ---------- 1) Base paper ----------
def bake_paper():
    W, H = int(2016 * BG_B), int(1134 * BG_B)
    tex = paper_texture(H, W, seed=1, fibers=1400)
    tex = 1 + (tex - 1) * 0.75                     # a notch lighter than a raw paper scan: clean
    col = PAPER[None, None, :] * tex[..., None]
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'paper.jpg'), quality=93)
    MANIFEST['paper'] = dict(w=W, h=H, x=-48, y=-27, scale=BG_B)


# ---------- 2) Torn-paper colour blocks (shapes defined in world coordinates) ----------
def flat(name, poly=None, ell=None, circles=None, cut_below=None, color=None, seed=0, rough=4, mottle=0.06):
    if poly is not None:
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    elif ell is not None:
        cx, cy, r = ell; xs = [cx - r, cx + r]; ys = [cy - r, cy + r]
    else:
        xs = [c[0] - c[2] for c in circles] + [c[0] + c[2] for c in circles]
        ys = [c[1] - c[2] for c in circles] + [c[1] + c[2] for c in circles]
    pad = 30
    X0, Y0 = min(xs) - pad, min(ys) - pad
    w, h = int((max(xs) - X0 + pad) * B), int((max(ys) - Y0 + pad) * B)
    if poly is not None:
        m = poly_mask(h, w, [((x - X0) * B, (y - Y0) * B) for x, y in poly]) > 0.5
    elif ell is not None:
        m = ellipse_mask(h, w, (cx - X0) * B, (cy - Y0) * B, r * B, r * B)
    else:
        m = np.zeros((h, w), bool)
        for c in circles:
            m |= ellipse_mask(h, w, (c[0] - X0) * B, (c[1] - Y0) * B, c[2] * B, c[2] * B * 0.9)
        if cut_below is not None:
            m &= np.mgrid[:h, :w][0] < (cut_below - Y0) * B
    col, a = tear_sprite(m, color, seed, rough * B, mottle)
    mm = save(name, col, a)
    mm['x'] = X0 + mm['crop'][0] / B
    mm['y'] = Y0 + mm['crop'][1] / B
    print('flat', name, mm['w'], mm['h'])


def bake_flats():
    flat('teal', poly=[(640, -60), (2010, -60), (2010, 660), (1700, 640), (1500, 600), (1330, 640), (1180, 610),
                       (1040, 560), (930, 470), (820, 430), (700, 320)], color=TEAL, seed=41, rough=4)
    flat('strip', poly=[(560, 520), (760, 330), (980, 250), (1240, 150), (1520, 70), (1760, 20), (2010, -10),
                        (2010, 165), (1700, 230), (1500, 320), (1250, 390), (1050, 470), (860, 560), (700, 640)],
         color=PAPER * 1.025, seed=43, rough=5, mottle=0.04)
    flat('ochre', ell=(400, 560, 430), color=OCHRE, seed=45, rough=4)
    flat('sun', ell=(1690, 700, 165), color=MUSTARD, seed=47, rough=3)
    for nm, (cx, cy, s, sd) in dict(cloud1=(140, 850, 1.0, 51), cloud2=(1060, 960, 0.9, 53), cloud3=(1830, 520, 0.75, 55)).items():
        circ = [(cx + dx * s, cy + dy * s, rr * s) for dx, dy, rr in ((0, 0, 70), (75, 15, 55), (-70, 20, 50), (140, 35, 38), (-130, 40, 34))]
        flat(nm, circles=circ, cut_below=cy + 45 * s, color=CARD * 0.995, seed=sd, rough=3, mottle=0.035)


if __name__ == '__main__':
    bake_paper()
    bake_flats()
    MANIFEST['_'] = dict(B=B, palette=dict(paper='#ECDFC2', card='#F6EEDB', ink='#221C17', ochre='#C65F3A', teal='#2F7F7A', mustard='#E1AB3B'))
    json.dump(MANIFEST, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print('manifest', len(MANIFEST))
