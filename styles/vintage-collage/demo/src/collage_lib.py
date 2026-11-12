"""Collage helpers: noise, paper texture, torn-paper edges, polygon masks, cut-outs with a white paper margin, and engrave()
(parallel engraved lines whose width follows the tone, the copperplate swelling line). Imported by bake.py and bake2.py.
"""
import sys, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, "raw")

W, H = 1920, 1080
RNG = np.random.default_rng(7)

# ---------- default colours (bake.py overrides PAPER, PAPER_HI and INK with the style palette) ----------
PAPER = np.array([238, 222, 186], float)      # base paper
PAPER_HI = np.array([246, 236, 210], float)   # cut-out engraving paper / cards
INK = np.array([30, 25, 21], float)
OCHRE = np.array([196, 98, 58], float)        # ochre red
TEAL = np.array([62, 132, 128], float)        # teal
MUSTARD = np.array([223, 172, 58], float)     # mustard
BRASS = np.array([196, 150, 72], float)



# ---------- Noise and paper ----------
def fbm(h, w, scales=(2, 6, 18, 60), weights=(0.15, 0.25, 0.3, 0.3), seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w))
    for s, wt in zip(scales, weights):
        n = ndi.gaussian_filter(r.standard_normal((h, w)), s)
        out += wt * n / (n.std() + 1e-9)
    return out / (out.std() + 1e-9)


def paper_texture(h, w, seed=1, fibers=900):
    """Returns a lightness multiplier field (about 0.85–1.05): mottling + fibres + small stains."""
    t = 1 + 0.035 * fbm(h, w, seed=seed)
    t += 0.012 * RNG.standard_normal((h, w))
    img = Image.new("L", (w, h), 128)
    d = ImageDraw.Draw(img)
    r = np.random.default_rng(seed + 5)
    for _ in range(fibers):
        x, y = r.uniform(0, w), r.uniform(0, h)
        a, L = r.uniform(0, math.pi), r.uniform(6, 26)
        pts = []
        for k in range(5):
            pts.append((x + math.cos(a) * L * k / 4 + r.normal(0, 1.2), y + math.sin(a) * L * k / 4 + r.normal(0, 1.2)))
        d.line(pts, fill=int(r.choice([110, 150, 160])), width=1)
    f = (np.asarray(img, float) - 128) / 128
    t += 0.05 * ndi.gaussian_filter(f, 0.6)
    # foxing
    for _ in range(int(h * w / 90000)):
        cy, cx, rr = r.uniform(0, h), r.uniform(0, w), r.uniform(10, 60)
        yy, xx = np.ogrid[:h, :w]
        sl = (slice(max(0, int(cy - rr * 2)), int(cy + rr * 2)), slice(max(0, int(cx - rr * 2)), int(cx + rr * 2)))
        sub = np.exp(-(((yy[sl[0]] - cy) ** 2 + (xx[:, sl[1]] - cx) ** 2) / (2 * rr * rr)))
        t[sl] -= 0.03 * r.uniform(0.3, 1) * sub
    return t


def torn(mask, rough=5.0, seed=0, amp=0.35):
    """Turns a binary shape into a torn-paper edge: returns (body alpha, white fibre-edge alpha)."""
    h, w = mask.shape
    m = ndi.gaussian_filter(mask.astype(float), rough)
    n = fbm(h, w, scales=(1.5, 4, 10), weights=(0.3, 0.4, 0.3), seed=seed)
    n = n * np.clip(4 * m * (1 - m) * 1.6, 0, 1)   # perturb only near the edge, to avoid specks all over the frame
    body = np.clip((m + amp * 0.5 * n - 0.5) * 3 + 0.5, 0, 1)
    body = np.clip((body - 0.5) * 6 + 0.5, 0, 1)
    fringe = np.clip(((m + amp * 0.5 * n) - 0.40) * 18, 0, 1)
    return body, np.clip(fringe - body, 0, 1)


# ---------- Canvas compositing ----------
class Canvas:
    def __init__(self, h, w):
        self.c = np.ones((h, w, 3)) * PAPER

    def over(self, color, alpha, x=0, y=0):
        """color: (h,w,3) or (3,), alpha: (h,w); pasted at (x,y)."""
        h, w = alpha.shape
        H_, W_ = self.c.shape[:2]
        x0, y0, x1, y1 = max(0, x), max(0, y), min(W_, x + w), min(H_, y + h)
        if x1 <= x0 or y1 <= y0:
            return
        a = alpha[y0 - y:y1 - y, x0 - x:x1 - x, None]
        col = color if np.ndim(color) == 1 else color[y0 - y:y1 - y, x0 - x:x1 - x]
        reg = self.c[y0:y1, x0:x1]
        self.c[y0:y1, x0:x1] = reg * (1 - a) + col * a

    def shade(self, alpha, x, y, strength=0.35, blur=6, dx=7, dy=9):
        sh = ndi.gaussian_filter(np.pad(alpha, 3 * blur), blur)
        self.over(np.array([60, 40, 25], float), sh * strength, x + dx - 3 * blur, y + dy - 3 * blur)


def flat_paper(cv, mask, color, seed, rough=5, shadow=0.28, fringe_on=True, mottle=0.06):
    """Flat coloured paper: rough edge + white fibre edge + paper mottling + drop shadow. mask is the size of the whole canvas."""
    body, fr = torn(mask, rough=rough, seed=seed)
    ys, xs = np.nonzero(body > 0.01)
    cv.shade(body, 0, 0, strength=shadow, blur=5, dx=4, dy=6)
    if fringe_on:
        cv.over(PAPER_HI * 1.0, fr * 0.9)
    tex = 1 + mottle * fbm(*mask.shape, scales=(3, 12, 40), weights=(0.3, 0.4, 0.3), seed=seed + 11)
    col = color[None, None, :] * tex[..., None]
    cv.over(col, body)


def ellipse_mask(h, w, cx, cy, rx, ry, rot=0):
    yy, xx = np.mgrid[:h, :w].astype(float)
    c, s = math.cos(rot), math.sin(rot)
    u, v = (xx - cx) * c + (yy - cy) * s, -(xx - cx) * s + (yy - cy) * c
    return ((u / rx) ** 2 + (v / ry) ** 2) <= 1


def poly_mask(h, w, pts, ss=1):
    im = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(im).polygon([(x * ss, y * ss) for x, y in pts], fill=255)
    if ss > 1:
        im = im.resize((w, h), Image.LANCZOS)
    return np.asarray(im, float) / 255


# ---------- Engraving cut-outs ----------
def ink_from_gray(g, mask, paper_q=88, black_q=3):
    """Turns a scanned greyscale into ink amount 0..1 (paper colour → 0)."""
    vals = g[mask > 0.5]
    hi = np.percentile(vals, paper_q) if vals.size else 255
    lo = np.percentile(vals, black_q) if vals.size else 0
    ink = np.clip((hi - g) / max(1, hi - lo), 0, 1)
    return ink ** 0.9


def cutout(gray, mask, scale, tint=None, margin=4, seed=0, paper=PAPER_HI, tint_mask=None, ink_gain=1.0):
    """gray, mask: float arrays at source resolution (mask 0..1). Returns a small RGBA (float) image:
    engraved ink lines + (optional) hand tinting + cut-paper white margin (slightly rough)."""
    ys, xs = np.nonzero(mask > 0.5)
    pad = int(margin / scale) + 12
    y0, y1 = max(0, ys.min() - pad), min(mask.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(mask.shape[1], xs.max() + pad)
    g, m = gray[y0:y1, x0:x1], mask[y0:y1, x0:x1]
    tm = None if tint_mask is None else tint_mask[y0:y1, x0:x1]
    ink = ink_from_gray(g, m) * ink_gain
    tw, th = max(2, int((x1 - x0) * scale)), max(2, int((y1 - y0) * scale))
    rs = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((tw, th), Image.LANCZOS), float) / 255
    ink, m = rs(ink), rs(m)
    if tm is not None:
        tm = rs(tm)
    # white margin: dilate + rough edge
    mb = m > 0.5
    dil = ndi.binary_dilation(mb, iterations=max(1, int(margin)))
    edge_body, _ = torn(dil, rough=1.2, seed=seed, amp=0.25)
    alpha = np.maximum(edge_body, m)
    base = np.ones((th, tw, 3)) * paper
    tex = 1 + 0.03 * fbm(th, tw, scales=(2, 8), weights=(0.5, 0.5), seed=seed + 3)
    base *= tex[..., None]
    if tint is not None:
        tmask = m if tm is None else tm * m
        tcol = np.asarray(tint, float)
        base = base * (1 - 0.85 * tmask[..., None]) + tcol * 0.85 * tmask[..., None]
    ink_m = ink * m  # ink only inside the cut line
    col = base * (1 - ink_m[..., None]) + INK * ink_m[..., None]
    return np.dstack([col, alpha])


def rotate_rgba(rgba, deg, flip=False):
    if flip:
        rgba = rgba[:, ::-1]
    chans = []
    for k in range(4):
        ch = rgba[..., k] if k < 3 else rgba[..., 3] * 255
        chans.append(Image.fromarray(ch.astype(np.float32), mode="F").rotate(deg, Image.BICUBIC, expand=True))
    out = np.dstack([np.asarray(c) for c in chans])
    a = np.clip(out[..., 3] / 255, 0, 1)
    rgb = out[..., :3]
    return rgb, a


def place(cv, rgba, cx, cy, deg=0, flip=False, shadow=0.38, sblur=5, sd=(7, 10)):
    rgb, a = rotate_rgba(rgba, deg, flip)
    h, w = a.shape
    x, y = int(cx - w / 2), int(cy - h / 2)
    cv.shade(a, x, y, strength=shadow, blur=sblur, dx=sd[0], dy=sd[1])
    cv.over(rgb, a, x, y)
    return x, y, w, h


def load_gray(name):
    return np.asarray(Image.open(os.path.join(RAW, name)).convert("L"), float)


# ---------- Data engraving: line engraving generated from light and dark ----------
def engrave(tone, phase, spacing, wobble=None, min_w=0.06, max_w=0.92):
    """tone: 0..1 light to dark (1 = darkest); phase: per-pixel line coordinate (in px, along the normal);
    returns ink amount: parallel lines whose width follows tone (the "swelling line" of copperplate engraving)."""
    u = phase / spacing
    if wobble is not None:
        u = u + wobble
    d = np.abs((u % 1.0) - 0.5) * spacing          # distance to the nearest line centre
    wid = np.where(tone > 0.02, (min_w + (max_w - min_w) * tone) * spacing, 0)
    return np.clip((wid / 2 - d) + 0.5, 0, 1) * (tone > 0.02)   # 1 px anti-aliasing
