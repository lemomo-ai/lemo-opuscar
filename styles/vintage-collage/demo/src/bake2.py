"""Part baking for the whole of 《The Inverted Jenny 倒置的珍妮》: beyond bake.py (old paper, coloured paper) it makes the stamp colour separations, the engraved plane, the halftone news photo,
ransom-note letters, typed slips, bilingual subtitle slips, silhouettes, scissors, printing press, roller, full sheet, data-engraving tower, album page and end title.
Usage (library root): .venv/bin/python styles/vintage-collage/demo/src/bake2.py   (run after bake.py) Fixed seeds, deterministic output.
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bake as BK                      # shared palette, save(), tear, etc.
import collage_lib as cl
from collage_lib import fbm, torn, paper_texture, poly_mask, ellipse_mask, engrave

RAW, OUT, FONTS = BK.RAW, BK.OUT, BK.FONTS
B = BK.B
hexc = BK.hexc
PAPER, CARD, INK, OCHRE, TEAL, MUSTARD = BK.PAPER, BK.CARD, BK.INK, BK.OCHRE, BK.TEAL, BK.MUSTARD
RED_INK = hexc('#C8463F')     # stamp red (ochre red shifted a little towards magenta)
BLUE_INK = hexc('#2F5D8C')    # stamp blue
NEWS = hexc('#E6E0D2')
GRAPHITE = hexc('#5E5A55')
M = BK.MANIFEST
font = lambda f, s: ImageFont.truetype(os.path.join(FONTS, f), int(s))
CP, CPB = 'CourierPrime-Regular.ttf', 'CourierPrime-Bold.ttf'
FELL, FELLI, FELLSC = 'IMFeENrm28P.ttf', 'IMFeENit28P.ttf', 'IMFeENsc28P.ttf'
ZH7, ZH9 = 'NotoSerifSC-700-subset.woff2', 'NotoSerifSC-900-subset.woff2'


def rs(a, w, h):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), float) / 255


# ---------- 1) Stamp colour separations: paper (real perforation outline), red plate, blue plate ----------
def bake_stamp():
    a = np.asarray(Image.open(os.path.join(RAW, 'jenny_c3_hi.jpg')).convert('RGB')).astype(float)
    R, G, Bc = a[..., 0], a[..., 1], a[..., 2]
    paper = ndi.binary_fill_holes(ndi.binary_opening(a.min(2) < 228, iterations=2))
    lab, n = ndi.label(paper); paper = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    red = np.clip((R - (G + Bc) / 2 - 18) / 110, 0, 1) * paper
    blue = np.clip((Bc - R - 4) / 90, 0, 1) * paper
    K = 2.0                                                  # upscale 2× then tighten the ink edges: sharper lines
    h, w = a.shape[:2]; W2, H2 = int(w * K), int(h * K)
    red2 = ndi.gaussian_filter(rs(red, W2, H2), 1.1); blue2 = ndi.gaussian_filter(rs(blue, W2, H2), 0.8)
    pap2 = rs(paper.astype(float), W2, H2)
    red2 = np.clip((red2 - 0.38) * 5 + 0.5, 0, 1)
    dark = np.clip((blue2 - 0.40) * 4 + 0.5, 0, 1)
    blue2 = np.maximum(dark, np.clip((blue2 - 0.06) * 2.2, 0, 0.6))
    pap2 = np.clip((pap2 - 0.5) * 6 + 0.5, 0, 1)
    tex = 1 + 0.025 * fbm(H2, W2, scales=(2, 8, 30), weights=(0.3, 0.4, 0.3), seed=301)
    col = CARD[None, None, :] * tex[..., None]
    BK.save('st_paper', col, pap2, k=K)
    rtex = 0.92 + 0.08 * fbm(H2, W2, scales=(1.5, 5), weights=(0.6, 0.4), seed=303)
    BK.save('st_red', RED_INK[None, None, :] * rtex[..., None] * np.ones((H2, W2, 1)), red2 * np.clip(rtex, 0, 1), k=K)
    BK.save('st_blue', BLUE_INK[None, None, :] * np.ones((H2, W2, 1)), blue2, k=K)
    # oval frame (extent of the blue plate): for the through-the-oval transition; coordinates in the pixels of the "paper" sprite
    pc = M['st_paper']['crop']
    ys, xs = np.nonzero(rs(blue, W2, H2) > 0.10)
    M['st_paper']['oval'] = [float((xs.min() + xs.max()) / 2 - pc[0]), float((ys.min() + ys.max()) / 2 - pc[1]),
                             float((xs.max() - xs.min()) / 2), float((ys.max() - ys.min()) / 2)]
    for k in ('st_red', 'st_blue'):
        M[k]['off'] = [M[k]['crop'][0] - pc[0], M[k]['crop'][1] - pc[1]]   # position relative to the paper when overprinting
    # engraved plane (large): the dark part of the blue plate, cut out with a white margin
    mask = ndi.binary_fill_holes(ndi.binary_closing(ndi.binary_opening(blue > 0.62, iterations=1), iterations=4))
    lab, n = ndi.label(mask); mask = (lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1))
    mask = ndi.binary_dilation(mask, iterations=2).astype(float)
    mask = (ndi.gaussian_filter(mask, 3.0) > 0.5).astype(float)              # smooth scissor cut, no jagged edges
    gray = 255 * (1 - np.clip((blue - 0.25) * 1.6, 0, 1))
    S = 1.65                                                   # the plane is about 520 px wide in the world
    rgba = cl.cutout(gray, mask, S, margin=4 * B, seed=311, paper=CARD)
    ink = 1 - (rgba[..., :3].mean(2) - BK.INK.mean()) / (CARD.mean() - BK.INK.mean())
    ink = np.clip((ndi.gaussian_filter(np.clip(ink, 0, 1), 0.9) - 0.42) * 3.2 + 0.5, 0, 1)   # tighten the ink edges
    col = CARD[None, None, :] * (1 - ink[..., None]) + BLUE_INK * 0.85 * ink[..., None]
    mp = BK.save('plane', col, rgba[..., 3])
    ys_, xs_ = np.nonzero(mask > 0.5); pad = int(4 * B / S) + 12
    mp['src'] = [float(max(0, xs_.min() - pad) + mp['crop'][0] / S), float(max(0, ys_.min() - pad) + mp['crop'][1] / S)]
    mp['srck'] = S
    M['st_paper']['srck'] = K
    pm = ndi.binary_dilation(rs(mask, W2, H2) > 0.5, iterations=int(6 * K))
    tint = np.clip((ndi.gaussian_filter(rs(blue, W2, H2), 0.8) - 0.06) * 2.2, 0, 0.6) * (1 - pm)
    BK.save('st_tint', BLUE_INK[None, None, :] * np.ones((H2, W2, 1)), tint, k=K)
    M['st_tint']['off'] = [M['st_tint']['crop'][0] - pc[0], M['st_tint']['crop'][1] - pc[1]]
    print('stamp + plane', M['st_paper']['w'], M['st_paper']['h'], M['plane']['w'], M['plane']['h'])


# ---------- 2) Halftone news photo: the Potomac Park polo grounds on the first-flight day, 15 May 1918 ----------
def bake_photo():
    g = np.asarray(Image.open(os.path.join(RAW, 'jn4_polo.jpg')).convert('L'), float)
    g = g[700:2800, 0:4661]
    Wd, Hd = int(600 * B), int(600 * B * g.shape[0] / g.shape[1])
    g = np.asarray(Image.fromarray(g.astype(np.uint8)).resize((Wd, Hd), Image.LANCZOS), float) / 255
    g = np.clip((g - 0.12) / 0.8, 0, 1) ** 1.1
    yy, xx = np.mgrid[:Hd, :Wd].astype(float)
    cell = 6.0 * B / 1.5 * 1.25
    c, s = math.cos(math.pi / 4), math.sin(math.pi / 4)
    u, v = (xx * c + yy * s) / cell, (-xx * s + yy * c) / cell
    du, dv = (u % 1) - 0.5, (v % 1) - 0.5
    d = np.sqrt(du * du + dv * dv)
    dark = 1 - g
    rad = np.sqrt(np.clip(dark, 0, 1) / math.pi) * 1.05
    dots = np.clip((rad - d) * cell * 0.9 + 0.5, 0, 1)
    P = int(26 * B); capH = int(46 * B)
    Hc, Wc = Hd + 2 * P + capH, Wd + 2 * P
    m = np.zeros((Hc + 20, Wc + 20), bool); m[10:10 + Hc, 10:10 + Wc] = True
    body, _ = torn(m, rough=1.6 * B, seed=321, amp=0.5)
    tex = paper_texture(Hc + 20, Wc + 20, seed=323, fibers=300); tex = 1 + (tex - 1) * 0.7
    col = NEWS[None, None, :] * tex[..., None]
    ink = np.zeros(body.shape); ink[10 + P:10 + P + Hd, 10 + P:10 + P + Wd] = dots * 0.92
    img = Image.new('L', (Wc + 20, Hc + 20), 0); d_ = ImageDraw.Draw(img)
    f = font(CP, 19 * B)
    d_.text((10 + P, 10 + P + Hd + 12 * B), 'POLO FIELD, WASHINGTON  ·  MAY 15, 1918', font=f, fill=235)
    ink = np.maximum(ink, np.asarray(img, float) / 255)
    col = col * (1 - ink[..., None]) + INK * ink[..., None]
    BK.save('photo', col, body)


# ---------- 3) Paper slips: typewriter slips, ransom-note letters, subtitle slips ----------
def strip(name, text, fnt, size, paper, ink, seed, padx=14, pady=8, mono=False, **meta):
    f = font(fnt, size * B)
    l, t, r, b = f.getbbox(text if text.strip() else 'x')
    asc, desc = f.getmetrics()
    tw = int(f.getlength(text)); th = asc + desc
    px, py = int(padx * B), int(pady * B)
    w, h = tw + 2 * px, th + 2 * py
    P = int(8 * B)
    m = np.zeros((h + 2 * P, w + 2 * P), bool); m[P:P + h, P:P + w] = True
    body, _ = torn(m, rough=1.2 * B, seed=seed, amp=0.45)
    tex = paper_texture(h + 2 * P, w + 2 * P, seed=seed, fibers=max(10, int(w * h / 1800))); tex = 1 + (tex - 1) * 0.6
    col = paper[None, None, :] * tex[..., None]
    img = Image.new('L', (w + 2 * P, h + 2 * P), 0); d = ImageDraw.Draw(img)
    x0, y0 = P + px, P + py
    d.text((x0, y0), text, font=f, fill=255)
    tx = np.asarray(img, float) / 255
    if meta.pop('blank', False):
        BK.save(name + '_bg', col, body)
    r_ = np.random.default_rng(seed)
    if mono:   # typewriter: the ink of each letter varies in weight and sits slightly off the line
        tx *= 0.85 + 0.15 * (r_.random(tx.shape) > 0.25)
    else:
        tx *= 0.92 + 0.08 * (r_.random(tx.shape) > 0.2)
    col = col * (1 - tx[..., None]) + ink * tx[..., None]
    mm = BK.save(name, col, body, text=text, **meta)
    mm['tx'] = (x0 - mm['crop'][0]) / B             # text start (world units, relative to the top left of the sprite)
    mm['adv'] = f.getlength('M') / B if mono else 0  # advance of the monospaced characters
    mm['n'] = len(text)
    return mm


RANSOM = [  # font, paper, ink
    (FELLSC, INK * 1.05, CARD), (FELL, CARD, INK), (CPB, MUSTARD, INK), (FELLI, NEWS, INK),
    (FELLSC, OCHRE, CARD), (FELL, TEAL, CARD), (CPB, CARD, RED_INK), (FELLSC, NEWS, INK),
]


def ransom(prefix, text, size, seed0):
    out = []
    for i, ch in enumerate(text):
        if ch == ' ':
            out.append(None); continue
        f, pa, ik = RANSOM[(i * 3 + seed0) % len(RANSOM)]
        if ch.isdigit() and f.startswith('IMFe'):          # IM Fell has old-style figures (1 looks like I, 0 like o); swap digits for lining figures
            f = [CPB, ZH9][(i + seed0) % 2]
        s = size * (0.86 + 0.28 * ((i * 7 + seed0) % 5) / 4)
        mm = strip(f'{prefix}{i}', ch, f, s, pa, ik, seed0 * 31 + i, padx=10, pady=4)
        out.append(f'{prefix}{i}')
    return out


def subtitles():
    cues = json.load(open(os.path.join(HERE, 'cues.json')))
    for i, c in enumerate(cues):
        strip(f'sub{i:02d}_zh', c['zh'], ZH7, 40, INK * 1.05, CARD, 500 + i, padx=14, pady=6)
        strip(f'sub{i:02d}_en', c['en'], CP, 30, CARD, INK, 600 + i, padx=12, pady=4, mono=True, blank=True)
    print('subtitles', len(cues))


def bake_strips():
    T = [('t_pass1', 'PASS 1 — RED', CPB, 30, CARD, RED_INK), ('t_pass2', 'PASS 2 — BLUE', CPB, 30, CARD, BLUE_INK),
         ('t_robey', 'WILLIAM T. ROBEY', CPB, 30, CARD, INK), ('t_collector', 'collector · May 14, 1918', CP, 24, NEWS, INK),
         ('t_receipt', '100 × 24¢ = $24.00', CPB, 44, CARD, INK), ('t_week', '+ 1 week', CP, 30, MUSTARD, INK),
         ('t_1918', '1918 · 24¢', CPB, 150, CARD, INK), ('t_2023', '2023 · one stamp', CPB, 150, CARD, INK),
         ('t_times', '≈ 8,360,000 ×', CPB, 150, MUSTARD, INK), ('t_redtag', 'red frame', CP, 28, CARD, RED_INK), ('t_bluetag', 'blue plane', CP, 28, CARD, BLUE_INK), ('t_lost', 'LOST', CPB, 46, CARD, INK),
         ('t_lost2', 'LOST', CPB, 46, NEWS, INK), ('t_stolen', 'STOLEN', CPB, 46, OCHRE, CARD), ('t_1955', 'stolen 1955', CP, 30, CARD, INK),
         ('t_po', 'U.S. POST OFFICE', FELLSC, 40, INK * 1.05, CARD)]
    for i, (n, tx, f, s, pa, ik) in enumerate(T):
        strip(n, tx, f, s, pa, ik, 400 + i, mono=f.startswith('Courier'), blank=(n in ('t_receipt', 't_1955')))
    strip('t_price', '$2,006,000', FELLSC, 190, INK * 1.05, CARD, 431, padx=30, pady=10)
    strip('title_en2', 'The Inverted Jenny', FELLI, 92, INK * 1.05, CARD, 441, padx=30, pady=12)
    strip('title_zh2', '倒置的珍妮', ZH9, 50, CARD, INK, 442, padx=18, pady=10)
    # end-card credits: style name (English + Chinese) and the sign-off, all cut paper slips
    strip('sig_style_en', 'Vintage Engraving Collage', FELLSC, 36, NEWS, INK, 451, padx=16, pady=6)
    strip('sig_style_zh', '复古版画拼贴', ZH7, 34, MUSTARD, INK, 452, padx=14, pady=6)
    strip('sig_line', 'LemoLab × Claude Opus 5.5', CPB, 34, INK * 1.05, CARD, 453, padx=16, pady=8, mono=True)
    M['_ransom'] = dict(airmail=ransom('ra', 'AIR MAIL', 120, 3), price=ransom('rp', '$15,000', 130, 5))


# ---------- 4) Silhouette, scissors, printing press, roller ----------
def bezier_pts(pts, n=24):
    out = []
    for i in range(0, len(pts) - 3, 3):
        p0, p1, p2, p3 = [np.array(p, float) for p in pts[i:i + 4]]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(tuple((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3))
    out.append(tuple(pts[-1]))
    return out


def bake_silhouette():
    """The 1918 collector: a profile silhouette in a straw boater (cut from black paper, not posing as any real photograph). World coordinates 520×800."""
    P = [(250, 120),  # hat crown, left
         (250, 120), (420, 112), (420, 112),        # hat crown
         (425, 140), (428, 175), (430, 205),        # right side of the crown
         (470, 206), (510, 210), (528, 222),        # brim, right
         (515, 236), (470, 236), (418, 234),        # under the brim
         (424, 262), (432, 288), (440, 300),        # forehead
         (446, 318), (452, 330), (470, 352),        # bridge to tip of the nose
         (476, 362), (462, 370), (452, 374),        # under the nose
         (456, 392), (458, 404), (452, 412),        # lips
         (458, 424), (456, 444), (440, 460),        # chin
         (420, 474), (398, 480), (392, 500),        # jaw to neck
         (392, 520), (400, 540), (430, 556),        # collar
         (470, 572), (500, 640), (512, 800),        # chest to bottom
         (300, 800), (100, 800), (10, 800),         # bottom edge
         (14, 700), (40, 600), (120, 560),          # back and shoulder
         (190, 536), (220, 520), (226, 470),        # nape
         (214, 420), (204, 360), (212, 300),        # back of the head
         (218, 260), (222, 240), (226, 236),
         (190, 236), (120, 230), (104, 222),        # brim, left
         (120, 210), (180, 206), (238, 204),
         (244, 170), (248, 140), (250, 120)]
    pts = bezier_pts(P)
    s = B
    w, h = int(540 * s), int(820 * s)
    m = poly_mask(h, w, [(x * s, y * s) for x, y in pts]) > 0.5
    body, _ = torn(m, rough=0.8 * B, seed=341, amp=0.2)
    tex = 1 + 0.06 * fbm(h, w, scales=(2, 10, 40), weights=(0.3, 0.4, 0.3), seed=343)
    col = INK[None, None, :] * 1.08 * tex[..., None]
    # hatband: a strip of ochre-red paper
    band = poly_mask(h, w, [(x * s, y * s) for x, y in [(246, 186), (428, 184), (430, 204), (240, 206)]]) * body
    col = col * (1 - band[..., None]) + OCHRE * band[..., None]
    BK.save('robey', col, body)


def line_art(name, fn, scale, seed, tint=None, closing=4):
    im = Image.open(os.path.join(RAW, fn))
    if im.mode == 'LA':
        a = np.asarray(im, float); gray = 255 - a[..., 1] * (1 - a[..., 0] / 255); line = a[..., 1] > 40
    else:
        gray = np.asarray(im.convert('L'), float); line = gray < 150
    sil = ndi.binary_fill_holes(ndi.binary_closing(line, iterations=closing))
    lab, n = ndi.label(sil); sil = (lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)).astype(float)
    rgba = cl.cutout(gray, sil, scale * B, tint=tint, margin=4 * B, seed=seed, paper=CARD)
    BK.save(name, rgba[..., :3], rgba[..., 3])


def bake_roller():
    w, h = int(70 * B), int(840 * B)
    yy, xx = np.mgrid[:h, :w].astype(float)
    u = xx / w
    tone = np.clip(0.25 + 0.75 * np.abs(u - 0.35) ** 0.8 * 1.6, 0, 1)        # cylinder: highlight to the left
    ink = engrave(tone, yy, 3.2 * B)
    ink = np.maximum(ink, (u < 0.04) | (u > 0.96))
    m = np.ones((h, w))
    col = CARD[None, None, :] * (1 - ink[..., None]) + INK * ink[..., None]
    # axles at both ends
    BK.save('roller', col, m)


# ---------- 5) Full sheet, album page, data-engraving tower ----------
CELL = (78, 70)          # the cell of one stamp on the full sheet (world units)


def bake_sheet():
    W_, H_ = 10 * CELL[0] + 80, 10 * CELL[1] + 90
    w, h = int(W_ * B), int(H_ * B)
    m = np.zeros((h + 20, w + 20), bool); m[10:10 + h, 10:10 + w] = True
    body, _ = torn(m, rough=0.7 * B, seed=351, amp=0.15)
    tex = paper_texture(h + 20, w + 20, seed=353, fibers=500); tex = 1 + (tex - 1) * 0.5
    col = CARD[None, None, :] * tex[..., None]
    img = Image.new('L', (w + 20, h + 20), 0); d = ImageDraw.Draw(img)
    x0, y0 = 10 + 40 * B, 10 + 46 * B
    gw, gh = 10 * CELL[0] * B, 10 * CELL[1] * B
    L = 14 * B
    for (cx, cy, sx, sy) in ((x0, y0, -1, -1), (x0 + gw, y0, 1, -1), (x0, y0 + gh, -1, 1), (x0 + gw, y0 + gh, 1, 1)):
        d.line([(cx + sx * 4 * B, cy), (cx + sx * (4 * B + L), cy)], fill=200, width=max(1, int(1.2 * B)))
        d.line([(cx, cy + sy * 4 * B), (cx, cy + sy * (4 * B + L))], fill=200, width=max(1, int(1.2 * B)))
    d.text((x0, 10 + 14 * B), 'PLATE 8493', font=font(CP, 15 * B), fill=150)
    ink = np.asarray(img, float) / 255
    col = col * (1 - ink[..., None]) + INK * ink[..., None]
    mm = BK.save('sheet', col, body)
    mm['grid'] = [(x0 - mm['crop'][0]) / B, (y0 - mm['crop'][1]) / B, CELL[0], CELL[1]]


def bake_album():
    cw, ch = 86, 78
    W_, H_ = 10 * cw + 120, 10 * ch + 150
    w, h = int(W_ * B), int(H_ * B)
    m = np.zeros((h + 20, w + 20), bool); m[10:10 + h, 10:10 + w] = True
    body, _ = torn(m, rough=0.6 * B, seed=361, amp=0.12)
    tex = paper_texture(h + 20, w + 20, seed=363, fibers=600); tex = 1 + (tex - 1) * 0.55
    col = (CARD * 1.005)[None, None, :] * tex[..., None]
    img = Image.new('L', (w + 20, h + 20), 0); d = ImageDraw.Draw(img)
    x0, y0 = 10 + 60 * B, 10 + 100 * B
    d.text((x0, 10 + 34 * B), 'U.S. AIR MAIL  ·  1918  ·  24 CENTS', font=font(FELLSC, 30 * B), fill=210)
    for r in range(10):
        for c in range(10):
            X, Y = x0 + c * cw * B, y0 + r * ch * B
            d.rectangle([X + 6 * B, Y + 6 * B, X + (cw - 6) * B, Y + (ch - 6) * B], outline=95, width=max(1, int(1.0 * B)))
    ink = np.asarray(img, float) / 255
    col = col * (1 - ink[..., None]) + INK * ink[..., None]
    # number pencilled in the empty space 66
    g = Image.new('L', (w + 20, h + 20), 0); dg = ImageDraw.Draw(g)
    X, Y = x0 + 5 * cw * B, y0 + 6 * ch * B
    dg.text((X + 22 * B, Y + 14 * B), '66', font=font(FELLI, 40 * B), fill=255)
    gm = ndi.gaussian_filter(np.asarray(g, float) / 255, 0.6) * (0.7 + 0.3 * np.random.default_rng(5).random(g.size[::-1]))
    col = col * (1 - 0.8 * gm[..., None]) + GRAPHITE * 0.8 * gm[..., None]
    mm = BK.save('album', col, body)
    mm['grid'] = [(x0 - mm['crop'][0]) / B, (y0 - mm['crop'][1]) / B, cw, ch]


def bake_tower():
    """Data engraving: 24 cents in 1918 vs $2,006,000 in 2023. The ratio is 8.36 million to one, too big to draw, so a torn break marks the cut."""
    TW, TH = 230, 1500
    w, h = int(TW * B / 1.5), int(TH * B / 1.5)       # the tower is too tall: bake it at 1.0×
    k = w / TW
    yy, xx = np.mgrid[:h, :w].astype(float)
    u = xx / w
    tone = np.clip(0.30 + 0.62 * (np.abs(u - 0.3) / 0.7) ** 0.9, 0, 1)
    ink = engrave(tone * 0.8, yy + 3 * np.sin(xx / 9), 7.0 * k)                    # horizontal hatching (swelling lines)
    cross = np.clip((u - 0.62) / 0.38, 0, 1)
    ink = np.maximum(ink, engrave(cross * 0.8, xx * 0.7 + yy * 0.7, 5.0 * k, min_w=0))
    edge = (u < 0.012) | (u > 0.988)
    ink = np.maximum(ink, edge)
    wash = np.clip(0.25 + 0.35 * (1 - u), 0, 1)
    col = CARD[None, None, :] * (1 - 0.6 * wash[..., None]) + OCHRE * 0.6 * wash[..., None]
    col = col * (1 - ink[..., None] * 0.85) + INK * ink[..., None] * 0.85
    # the torn break: cut a jagged gap at 40% of the height
    zig = h * 0.80 + 18 * k * np.abs(((xx / (26 * k)) % 2) - 1)
    gap = (yy > zig - 22 * k) & (yy < zig + 22 * k)
    alpha = (~gap).astype(float)
    BK.save('tower', col, alpha, k=k)
    M['tower']['gap'] = float(h * 0.80 / k)


if __name__ == '__main__':
    BK.MANIFEST.update(json.load(open(os.path.join(OUT, 'manifest.json'))))
    bake_stamp(); bake_photo(); bake_strips(); subtitles(); bake_silhouette()
    line_art('scissors', 'scissors.png', 0.55, 371)
    line_art('press', 'press.png', 0.62, 373, tint=MUSTARD * 0.95)
    bake_roller(); bake_sheet(); bake_album(); bake_tower()
    json.dump(BK.MANIFEST, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
    print('manifest', len(BK.MANIFEST))
