# Lettering for a pen plotter: every glyph becomes pen strokes (polylines in sheet millimetres, y down).
#  - Latin, digits, punctuation: Relief SingleLine (OFL), a true single-line font (SVG font paths, one stroke per subpath).
#  - CJK labels: Noto Sans SC at weight 100 (OFL). The pen traces the outline; the hairline glyph is thinner than the
#    pen, so the two edges merge into one line, the way plotters write outline fonts with a fine pen.
#  - Display CJK (titles): Noto Serif SC Bold (OFL): outline plus fine hatching, like hand-lettered map titles.
import os, re, math, html
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'data', 'fontsrc')

# ---------------- Relief SingleLine (SVG font)
_REL = None
def _relief():
    global _REL
    if _REL: return _REL
    s = open(os.path.join(SRC, 'ReliefSingleLine.svg'), encoding='utf-8').read()
    G = {}
    for m in re.finditer(r'<glyph\b([^>]*)/?>', s, re.S):
        a = m.group(1)
        u = re.search(r'unicode="([^"]*)"', a); adv = re.search(r'horiz-adv-x="([^"]*)"', a); d = re.search(r'\sd="([^"]*)"', a)
        if not u: continue
        ch = html.unescape(u.group(1))
        if len(ch) != 1: continue
        G[ch] = {'adv': float(adv.group(1)) if adv else 280.0, 'paths': _svgpath(d.group(1)) if d else []}
    _REL = G; return G

def _svgpath(d, tol=8.0):
    """SVG path data → list of polylines (font units, y up). Curves flattened adaptively."""
    toks = re.findall(r'[MmLlHhVvCcSsQqTtZzAa]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d)
    i = 0; cmd = None; x = y = 0.0; sx = sy = 0.0; out = []; cur = None; lc = None; lq = None
    def num():
        nonlocal i; v = float(toks[i]); i += 1; return v
    def bez(p0, p1, p2, p3):
        L = math.dist(p0, p1) + math.dist(p1, p2) + math.dist(p2, p3); n = max(2, int(L / tol))
        for k in range(1, n + 1):
            t = k / n; u = 1 - t
            cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0], u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]): cmd = toks[i]; i += 1
        rel = cmd.islower(); C = cmd.upper()
        if C == 'M':
            nx, ny = num(), num()
            if rel: nx += x; ny += y
            x, y = nx, ny; sx, sy = x, y; cur = [(x, y)]; out.append(cur); cmd = 'l' if rel else 'L'; lc = lq = None
        elif C == 'L':
            nx, ny = num(), num()
            if rel: nx += x; ny += y
            x, y = nx, ny; cur.append((x, y)); lc = lq = None
        elif C == 'H':
            nx = num(); x = nx + (x if rel else 0); cur.append((x, y)); lc = lq = None
        elif C == 'V':
            ny = num(); y = ny + (y if rel else 0); cur.append((x, y)); lc = lq = None
        elif C in 'CS':
            if C == 'C': x1, y1 = num(), num()
            else: x1, y1 = (2 * x - lc[0], 2 * y - lc[1]) if lc else (x, y)
            x2, y2, nx, ny = num(), num(), num(), num()
            if rel:
                if C == 'C': x1 += x; y1 += y
                x2 += x; y2 += y; nx += x; ny += y
            bez((x, y), (x1, y1), (x2, y2), (nx, ny)); lc = (x2, y2); lq = None; x, y = nx, ny
        elif C in 'QT':
            if C == 'Q': qx, qy = num(), num()
            else: qx, qy = (2 * x - lq[0], 2 * y - lq[1]) if lq else (x, y)
            nx, ny = num(), num()
            if rel:
                if C == 'Q': qx += x; qy += y
                nx += x; ny += y
            p1 = (x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y)); p2 = (nx + 2 / 3 * (qx - nx), ny + 2 / 3 * (qy - ny))
            bez((x, y), p1, p2, (nx, ny)); lq = (qx, qy); lc = None; x, y = nx, ny
        elif C == 'Z':
            if cur and (cur[-1] != (sx, sy)): cur.append((sx, sy))
            x, y = sx, sy; lc = lq = None
        else:
            raise ValueError('path command ' + cmd)
    return [p for p in out if len(p) >= 2]

# ---------------- outline fonts (fontTools)
_FONTS = {}
def _font(kind):
    if kind in _FONTS: return _FONTS[kind]
    src, w = {'sans': ('NotoSansSC-VF.ttf', 100), 'sansmed': ('NotoSansSC-VF.ttf', 300), 'serif': ('NotoSerifSC-VF.ttf', 800)}[kind]
    cache = os.path.join(SRC, f'_inst_{kind}.ttf')
    if not os.path.exists(cache):
        f = TTFont(os.path.join(SRC, src)); f = instantiateVariableFont(f, {'wght': w}); f.save(cache)
    f = TTFont(cache)
    _FONTS[kind] = (f, f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm); return _FONTS[kind]

class _Flat(BasePen):
    def __init__(self, gs, tol):
        super().__init__(gs); self.c = []; self.cur = None; self.tol = tol
    def _moveTo(self, p): self.cur = [p]; self.c.append(self.cur)
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]; L = math.dist(p0, p1) + math.dist(p1, p2) + math.dist(p2, p3); n = max(2, int(L / self.tol))
        for k in range(1, n + 1):
            t = k / n; u = 1 - t
            self.cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0], u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]; L = math.dist(p0, p1) + math.dist(p1, p2); n = max(2, int(L / self.tol))
        for k in range(1, n + 1):
            t = k / n; u = 1 - t
            self.cur.append((u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]))
    def _closePath(self):
        if self.cur and self.cur[0] != self.cur[-1]: self.cur.append(self.cur[0])
    _endPath = _closePath

def is_cjk(ch): return '⺀' <= ch <= '鿿' or '　' <= ch <= '〿' or '＀' <= ch <= '￯'

USED = {'sans': set(), 'sansmed': set(), 'serif': set()}

def glyph(ch, kind_cjk='sans'):
    """→ (advance in em, [polylines in em units, y up], is_outline)"""
    if is_cjk(ch):
        f, gs, cmap, upm = _font(kind_cjk); USED[kind_cjk].add(ch)
        g = gs[cmap[ord(ch)]]; p = _Flat(gs, upm / 140); g.draw(p)
        return g.width / upm, [[(x / upm, y / upm) for x, y in c] for c in p.c if len(c) > 2], True
    R = _relief(); g = R.get(ch) or R.get('?')
    if ch == ' ': return R[' ']['adv'] / 1000 if ' ' in R else .28, [], False
    return g['adv'] / 1000, [[(x / 1000, y / 1000) for x, y in pth] for pth in g['paths']], False

def layout(text, x, y, em, align='left', rot=0.0, track=0.0, cjk='sans', cjk_scale=1.0, cjk_drop=0.0):
    """Lay out one line. (x, y) = baseline anchor in mm (y down). Returns dict with strokes, outline flags, bbox."""
    items = []; pen_x = 0.0
    for ch in text:
        adv, polys, outline = glyph(ch, cjk)
        s = em * (cjk_scale if outline else 1.0)
        items.append((pen_x, s, polys, outline)); pen_x += adv * s + track * em
    width = pen_x - track * em if text else 0
    ox = {'left': 0, 'center': -width / 2, 'right': -width}[align]
    ca, sa = math.cos(rot), math.sin(rot)
    strokes = []; outl = []
    for px, s, polys, outline in items:
        for poly in polys:
            pts = []
            for gx, gy in poly:
                lx = ox + px + gx * s; ly = -(gy * s) + (cjk_drop * em if outline else 0)
                pts.append((x + lx * ca - ly * sa, y + lx * sa + ly * ca))
            strokes.append(pts); outl.append(outline)
    xs = [p[0] for s_ in strokes for p in s_] or [x]; ys = [p[1] for s_ in strokes for p in s_] or [y]
    return {'strokes': strokes, 'outline': outl, 'w': width, 'bbox': [min(xs), min(ys), max(xs), max(ys)]}

def hatch_polys(polys, ang, sp):
    """Even-odd scanline hatching of closed polygons → list of 2-point strokes, boustrophedon order."""
    ca, sa = math.cos(ang), math.sin(ang)
    R = [[(x * ca + y * sa, -x * sa + y * ca) for x, y in p] for p in polys]
    vs = [q[1] for r in R for q in r]
    if not vs: return []
    out = []; flip = False; v = min(vs) + sp * .5
    while v < max(vs):
        xs = []
        for r in R:
            for (u0, v0), (u1, v1) in zip(r, r[1:] + r[:1]):
                if (v0 <= v) != (v1 <= v): xs.append(u0 + (v - v0) / (v1 - v0) * (u1 - u0))
        xs.sort(); segs = [(xs[k], xs[k + 1]) for k in range(0, len(xs) - 1, 2) if xs[k + 1] - xs[k] > .12]
        if flip: segs = [(b, a) for a, b in segs[::-1]]
        for a, b in segs: out.append([(a * ca - v * sa, a * sa + v * ca), (b * ca - v * sa, b * sa + v * ca)])
        if segs: flip = not flip
        v += sp
    return out
