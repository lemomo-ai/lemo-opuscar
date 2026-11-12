"""Oscilloscope Math demo, "The Gibbs Phenomenon": a moving camera in a mathematical world, drawn with Manim (Cairo renderer).

    frame(t) -> (main mobjects, amber mobjects) for second t of the film (timeline.json)

The world is bigger than the frame. Everything lives in WORLD coordinates (px-like units, y down; 1 V = R units,
1 s of signal = PXS units) and a camera (centre cx, cy, zoom z) maps it to the 1920x1080 screen. Line widths are
in screen pixels, so the beam stays a beam at any zoom. The HUD (formula, readouts, subtitles) is screen-fixed.

Light channels (post.py turns them into phosphor):  R = beam trace, G = graticule / text, B = white-hot cores,
and a second pass for the amber CH2 layer (measurement cursors, spike markers), saved as the PNG's alpha.

    .venv/bin/python film.py render T0 T1 OUTDIR      frames (global index at 24 fps) as RGBA PNG
    .venv/bin/python film.py events OUT.json           sound events for mix.py
    .venv/bin/python film.py subs OUT.json             subtitle cues (also used for the .srt)
"""
import os, sys, json, math, functools
import numpy as np
import manimpango
from manim import VMobject, VGroup, Circle, Dot, Text, SVGMobject, config, LineJointType, CapStyleType, ITALIC

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
VOICE = os.environ.get('XPM_VOICE') or os.path.join(HERE, 'out', 'voice')   # Kokoro clips, dur.json and words.json (generated)
config.media_dir = os.environ.get('XPM_MEDIA') or os.path.join(HERE, 'out', 'manim')
config.disable_caching = True
FPS = TL['fps']; DUR = TL['dur']
for f in ('JetBrainsMono-Regular.ttf', 'JetBrainsMono-Medium.ttf', 'STIXTwoText-Regular.ttf', 'STIXTwoText-Italic.ttf', 'NotoSerifSC-Medium-sub.ttf'):
    manimpango.register_font(os.path.join(HERE, 'fonts', f))
MONO, STIX, SERIF_SC = 'JetBrains Mono', 'STIX Two Text', 'OM Serif SC'

# ------------------------------------------------------------------ helpers
PX = 135.0
def P(x, y): return np.array([(x - 960) / PX, (540 - y) / PX, 0.0])
def SW(px): return px / 1.35
TR, UI, HOT = '#FF0000', '#00FF00', '#0000FF'
FS = 1 / 1.875
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def ss(x): x = clamp(x); return x * x * (3 - 2 * x)
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def lerp(a, b, u): return a + (b - a) * u
def flash(t, t0, d=0.35): return clamp(1 - (t - t0) / d) if t >= t0 else 0.0

# ------------------------------------------------------------------ the signal
R = 200.0                 # world units per volt
PXS = 400.0               # world units per second of signal
X0 = 490.0                # write head (chain centre is the origin)
W = 2 * math.pi           # f0 = 1 Hz
RUN, STOP, GROW = TL['run'], TL['stop'], TL['grow']
MATH = TL['mathmode']
B = TL['births']
def coef(n): return 4 / (math.pi * n)

def _terms():
    T = [(1, TL['title1']['morph'][1], 0.0)]                         # (n, birth, grow time)
    T += [(3, B['n3'], GROW), (5, B['n5'], GROW), (7, B['n7'], GROW)]
    r0, r1 = B['rush']
    ks = list(range(5, 26))
    for i, k in enumerate(ks): T.append((2 * k - 1, r0 + (r1 - r0) * math.sqrt(i / (len(ks) - 1)), 0.3))
    for (a, b), (k0, k1) in [(B['burst1'], (26, 100)), (B['burst2'], (101, 400))]:
        for k in range(k0, k1 + 1): T.append((2 * k - 1, a + (b - a) * (k - k0) / (k1 - k0), 0.25))
    return T
TERMS = _terms()
NS = np.array([n for n, _, _ in TERMS], float); BS = np.array([b for _, b, _ in TERMS]); GS = np.array([g for _, _, g in TERMS])
AS = 4 / (math.pi * NS)

def gates(t):
    """growth 0..1 of every term at film time(s) t; shape (terms,) or (terms, samples)"""
    t = np.asarray(t, float)
    x = np.clip((t[None, ...] - BS.reshape((-1,) + (1,) * t.ndim)) / np.maximum(GS, 1e-6).reshape((-1,) + (1,) * t.ndim), 0, 1)
    x = np.where(GS.reshape((-1,) + (1,) * t.ndim) == 0, (t[None, ...] >= BS.reshape((-1,) + (1,) * t.ndim)).astype(float), x)
    return x * x * (3 - 2 * x)

def S(t):  return float(np.clip(t - RUN, 0, STOP - RUN))          # signal clock (frozen by STOP)
def N_at(t): return int((BS <= t).sum())

def trace(s, t):
    """value (V) of the trace at signal time(s) s, as seen at film time t"""
    s = np.asarray(s, float)
    if t >= MATH: gt = np.full_like(s, t)                              # math mode: the whole curve is f_N
    else: gt = s + RUN                                                  # each sample keeps the terms it was written with
    G = gates(gt)                                                       # (terms, samples)
    if t < MATH:                                                        # terms born after STOP apply to the whole frozen trace
        late = BS >= STOP
        if late.any(): G[late] = gates(np.full_like(s, t))[late]
    live = G.max(axis=1) > 0
    return (AS[live, None] * G[live] * np.sin(W * NS[live, None] * s[None, :])).sum(0)

@functools.lru_cache(None)
def peak(N):
    """first maximum of the N-term partial sum next to a rising edge (wt = pi/2N)"""
    x = np.linspace(1e-7, 3 * math.pi / (2 * N), 4001); n = 2 * np.arange(1, N + 1) - 1
    y = 4 / math.pi * (np.sin(np.outer(x, n)) / n).sum(1); return float(y.max())

def chain(t):
    """joints of the epicycle chain (world), with the growth of each term at time t"""
    g = gates(t); live = np.nonzero(g > 0)[0]; ts = S(t)
    r = R * AS[live] * g[live]; th = NS[live] * W * ts
    xs = np.concatenate([[0], np.cumsum(r * np.cos(th))]); ys = np.concatenate([[0], -np.cumsum(r * np.sin(th))])
    return np.stack([xs, ys], 1), r

# ------------------------------------------------------------------ camera
def ztween(A, Bk, u):
    """zoom in log space; the centre moves so that zooming feels like flying to the target"""
    z0, z1 = A[2], Bk[2]; z = z0 * (z1 / z0) ** u
    if abs(z1 - z0) > 1e-6: w = (1 / z0 - 1 / z) / (1 / z0 - 1 / z1)
    else: w = u
    return (lerp(A[0], Bk[0], w), lerp(A[1], Bk[1], w), z)

def square_x(t): b0, b1 = TL['beam']; return -1000 + (t - b0) * 560.0    # cold-open beam
def tip(t): j, _ = chain(t); return j[-1]

def cam(t):
    ma, mb = TL['title1']['morph']
    if t < 3.0: return (square_x(max(t, 0.3)) - 150, 0.0, 1.7)
    if t < 4.6: return ztween((square_x(3.0) - 150, 0.0, 1.7), (450.0, -40.0, 0.9), eio(seg(t, 3.0, 4.6)))
    if t < ma: return (450.0, -40.0, 0.9)
    if t < 9.6: return ztween((450.0, -40.0, 0.9), (0.0, 0.0, 1.5), eio(seg(t, ma, 9.6)))
    f0, f1 = TL['follow']; mc = TL['matchcut']
    if t < f0: return (0.0, 0.0, 1.5)
    if t < mc:                                                       # push onto the rotation, then ride the tip
        u = eio(seg(t, f0, f0 + 1.6)); p = tip(t); k = 0.85 * u
        return (k * p[0], k * p[1], 1.5 * (2.6 / 1.5) ** u)
    crest = X0 + 1.0 * PXS                                            # match cut: the previous crest of the sine
    C1 = (crest, -R * coef(1) * 0.85, 2.6)
    if t < 13.6: return C1
    if t < 16.4: return ztween(C1, (480.0, 0.0, 0.92), eio(seg(t, 13.6, 16.4)))
    W0 = (480.0, 0.0, 0.92)
    if t < 20.0: return W0
    if t < 24.0:
        u = eio(seg(t, 20.0, 22.0)); p = tip(t); A2 = (p[0] * 0.7 + 60, p[1] * 0.7 - 70, 1.9)
        return ztween(W0, A2, u)
    if t < 25.4:
        p = tip(24.0); A2 = (p[0] * 0.7 + 60, p[1] * 0.7 - 70, 1.9); return ztween(A2, W0, eio(seg(t, 24.0, 25.4)))
    W1 = (560.0, 0.0, 0.7)
    if t < 26.6: return W0
    if t < 29.2: return ztween(W0, W1, eio(seg(t, 26.6, 29.2)))
    d0, d1 = TL['dive']
    if t < d0: return W1
    D1 = dive_target()
    if t < TL['pullback'][0]: return ztween(W1, D1, eio(seg(t, d0, d1)) ** 1.0)
    p0, p1 = TL['pullback']; E1 = (900.0, -40.0, 0.55)
    return ztween(D1, E1, eio(seg(t, p0, p1)))

@functools.lru_cache(None)
def dive_target():
    # the newest rising edge before STOP: signal time 20.0 (STOP is at signal time 20.3)
    xe = X0 + (S(STOP) - 20.0) * PXS
    xp = xe - PXS / (4 * 25); yp = -R * peak(25)
    return (xp + 9.0, yp + 17.0, 14.0)

def w2s(c, x, y): return ((np.asarray(x) - c[0]) * c[2] + 960, (np.asarray(y) - c[1]) * c[2] + 540)

# ------------------------------------------------------------------ building blocks (screen px)
def vm(color, op, w, cap='round'):
    m = VMobject(stroke_color=color, stroke_width=SW(w), stroke_opacity=clamp(op), fill_opacity=0, joint_type=LineJointType.ROUND)
    m.cap_style = CapStyleType.ROUND if cap == 'round' else CapStyleType.BUTT
    return m

def segs(s, color, op, w, cap='round'):
    m = vm(color, op, w, cap)
    if len(s) == 0: return m
    s = np.asarray(s, float)
    a = np.stack([(s[:, 0] - 960) / PX, (540 - s[:, 1]) / PX, np.zeros(len(s))], 1)
    b = np.stack([(s[:, 2] - 960) / PX, (540 - s[:, 3]) / PX, np.zeros(len(s))], 1)
    m.set_points(np.stack([a, a + (b - a) / 3, a + 2 * (b - a) / 3, b], 1).reshape(-1, 3))
    return m

def poly(xy, color, op, w):
    xy = np.asarray(xy, float); return segs(np.hstack([xy[:-1], xy[1:]]), color, op, w)

def circ(x, y, r, color, op, w):
    return Circle(radius=max(r, 0.01) / PX, stroke_color=color, stroke_width=SW(w), stroke_opacity=clamp(op), fill_opacity=0).move_to(P(x, y))

def arc(x, y, r, a0, a1, color, op, w, n=480):
    a = np.linspace(a0, a1, max(2, int(n * abs(a1 - a0) / (2 * math.pi)) + 2))
    return poly(np.stack([x + r * np.cos(a), y + r * np.sin(a)], 1), color, op, w)

def dot(x, y, r, color, op=1.0): return Dot(P(x, y), radius=r / PX, color=color, fill_opacity=clamp(op), stroke_width=0)

_TXT = {}
def mktext(s, px, font, slant='NORMAL', weight='NORMAL'):
    key = (s, px, font, slant, weight)
    if key not in _TXT: _TXT[key] = Text(s, font=font, font_size=px * FS, slant=slant, weight=weight)
    return _TXT[key]

def text(s, px, font=MONO, color=UI, op=1.0, x=0.0, base=0.0, anchor='left', slant='NORMAL', weight='NORMAL'):
    m = mktext(s, px, font, slant, weight).copy()
    m.set_fill(color, opacity=clamp(op)); m.set_stroke(width=0)
    first = m.submobjects[0] if len(m.submobjects) else m
    dy = (540 - base) / PX - first.get_bottom()[1]
    dx = (x - 960) / PX - (m.get_left()[0] if anchor == 'left' else m.get_right()[0])
    m.shift(np.array([dx, dy, 0])); return m

_FORM = json.load(open(os.path.join(HERE, 'tex', 'formulas.json')))
def tex_svg(key):
    """'sum<N>' or 'suminf': the MathJax template for that many digits, with the digits' paths filled in"""
    if key == 'suminf': return _FORM['templates']['inf']
    n = key[3:]; s = _FORM['templates'][str(len(n))]
    for i, ch in enumerate(n): s = s.replace('{D%d}' % i, _FORM['digits'][ch])
    return s

_SVG = {}
def formula(key, width=520, x=56, y=34):
    k2 = (key, width, x, y)
    if k2 not in _SVG:
        d = os.path.join(config.media_dir, 'tex'); os.makedirs(d, exist_ok=True)   # one folder per worker (Manim writes temp files beside the SVG)
        src = os.path.join(d, key + '.svg'); open(src, 'w').write(tex_svg(key))
        m = SVGMobject(src, stroke_width=0); m.scale_to_fit_width(width / PX)
        m.move_to(P(x, y), aligned_edge=np.array([-1, 1, 0])); _SVG[k2] = m
    return _SVG[k2].copy()

# ---- world-anchored glyphs: titles that are written by the beam and then morph into geometry
def m2px(p): return np.stack([p[:, 0] * PX + 960, 540 - p[:, 1] * PX], 1)
def px2m(q): return np.stack([(q[:, 0] - 960) / PX, (540 - q[:, 1]) / PX, np.zeros(len(q))], 1)

class WorldGlyphs:
    """a line of text laid out on screen under camera `c0`, stored in world coordinates glyph by glyph
    (c0 = None: the text stays fixed on the screen, and only its morph targets live in the world)"""
    def __init__(self, s, px, font, x, base, c0, slant='NORMAL', t2s=None):
        self.screen = c0 is None; self.text = s
        if t2s: m = Text(s, font=font, font_size=px * FS, t2s=t2s)
        else: m = Text(s, font=font, font_size=px * FS, slant=slant)
        first = m.submobjects[0]
        m.shift(np.array([(x - 960) / PX - m.get_left()[0], (540 - base) / PX - first.get_bottom()[1], 0]))
        self.g = []
        for sm in m.submobjects:
            q = m2px(sm.points)
            if self.screen: self.g.append(q); continue
            wx = (q[:, 0] - 960) / c0[2] + c0[0]; wy = (q[:, 1] - 540) / c0[2] + c0[1]
            self.g.append(np.stack([wx, wy], 1))
        self.n = len(self.g)
        self.targets = None
    def screen_mob(self, w, c):
        if self.screen: v = VMobject(); v.set_points(px2m(w)); return v
        sx, sy = w2s(c, w[:, 0], w[:, 1]); v = VMobject(); v.set_points(px2m(np.stack([sx, sy], 1))); return v
    def box(self, c):
        """screen box (x0, y0, x1, y1) of the whole line under camera c"""
        q = np.vstack(self.g)
        if not self.screen: q = np.stack(w2s(c, q[:, 0], q[:, 1]), 1)
        return float(q[:, 0].min()), float(q[:, 1].min()), float(q[:, 0].max()), float(q[:, 1].max())
    def set_targets(self, tgt_world_list):
        """align every glyph with its target path (world coords, as point arrays of a VMobject)"""
        self.targets = []
        for gw, tw in zip(self.g, tgt_world_list):
            a = VMobject(); a.set_points(np.c_[gw, np.zeros(len(gw))])
            b = VMobject(); b.set_points(np.c_[tw, np.zeros(len(tw))])
            a.align_points(b); self.targets.append((a.points[:, :2].copy(), b.points[:, :2].copy()))
    def draw(self, t, c, out, write, morph=None, ui_op=0.92, hot_flash=True, stroke_w=2.4, fade=None):
        w0, w1 = write
        for i, gw in enumerate(self.g):
            ti = w0 + (w1 - w0 - 0.35) * i / max(1, self.n - 1)
            u = seg(t, ti, ti + 0.35)
            if u <= 0: continue
            fop = ui_op * ss(seg(t, ti + 0.2, ti + 0.45))
            if fade is not None: fop *= 1 - seg(t, *fade)
            if morph is not None and self.targets is not None:
                m0, m1 = morph; mi = m0 + (m1 - m0 - 0.6) * i / max(1, self.n - 1)
                a = eio(seg(t, mi, mi + 0.6))
                if a > 0:
                    A, Bp = self.targets[i]
                    if self.screen:                                   # screen-fixed source, world target: blend on screen
                        v = VMobject(); v.set_points(px2m(A * (1 - a) + np.stack(w2s(c, Bp[:, 0], Bp[:, 1]), 1) * a))
                    else: v = self.screen_mob(A * (1 - a) + Bp * a, c)
                    v.set_fill(UI, opacity=fop * (1 - a) ** 2); v.set_stroke(TR, width=SW(stroke_w * a + 1.2 * (1 - a)), opacity=clamp(0.25 + 0.75 * a))
                    out.append(v)
                    if a < 1:
                        h = v.copy(); h.set_fill(opacity=0); h.set_stroke(HOT, width=SW(1.4), opacity=0.7 * math.sin(math.pi * a)); out.append(h)
                    continue
            full = self.screen_mob(gw, c)
            if u < 1:                                  # the beam traces the outline first
                part = VMobject(); part.pointwise_become_partial(full, 0, eo(u))
                part.set_fill(opacity=0); part.set_stroke(HOT, width=SW(1.5), opacity=0.9); out.append(part)
            if fop > 0:
                full.set_fill(UI, opacity=fop); full.set_stroke(width=0); out.append(full)
            if hot_flash:
                f = flash(t, ti + 0.3, 0.4)
                if f > 0: h = full.copy(); h.set_fill(HOT, opacity=0.6 * f); out.append(h)

# ------------------------------------------------------------------ the world
def graticule(t, c, out, op):
    """an endless dotted grid whose divisions refine as you zoom in (the zoom is the TIME/DIV knob)"""
    if op <= 0: return
    z = c[2]; g = major_step(z)
    xl, xr = c[0] - 960 / z, c[0] + 960 / z; yt, yb = c[1] - 540 / z, c[1] + 540 / z
    for step, a in [(g, 1.0), (g / 5, clamp((g / 5 * z - 18) / 40))]:
        if a <= 0.02: continue
        d = []
        for gx in np.arange(math.floor(xl / step) * step, xr + step, step):
            sx = (gx - c[0]) * z + 960; y = 0.0
            while y < 1080: d.append((sx, y, sx, y + 2)); y += 9
        for gy in np.arange(math.floor(yt / step) * step, yb + step, step):
            sy = (gy - c[1]) * z + 540; x = 0.0
            while x < 1920: d.append((x, sy, x + 2, sy)); x += 9
        out.append(segs(d, UI, 0.17 * op * a, 1.0, 'butt'))

def major_step(z):
    g = 100.0
    while g * z > 520: g /= 5
    while g * z < 70: g *= 5
    return g

def axis(t, c, out, op):
    """the time axis (born from the second title) with ticks, and the 'now' line at the write head"""
    if op <= 0: return
    z = c[2]; g = major_step(z); sy = (0 - c[1]) * z + 540
    out.append(segs([(0, sy, 1920, sy)], UI, 0.40 * op, 1.3, 'butt'))
    xl, xr = c[0] - 960 / z, c[0] + 960 / z; tk = []
    for gx in np.arange(math.floor(xl / (g / 5)) * (g / 5), xr + g, g / 5):
        sx = (gx - c[0]) * z + 960; m = 9 if abs(gx / g - round(gx / g)) < 1e-6 else 5
        tk.append((sx, sy - m, sx, sy + m))
    out.append(segs(tk, UI, 0.45 * op, 1.1, 'butt'))

def cold_square(t, c, out):
    """the ideal square wave of the cold open, written by a beam the camera follows"""
    b0, b1 = TL['beam']
    if t < b0: return
    ma = TL['title1']['morph'][0]; fade = 1 - seg(t, ma - 0.3, ma + 0.9)
    if fade <= 0: return
    xd = square_x(min(t, b1 + 3)); per = 800.0
    xs = [-1000.0]; ys = [-R]
    x = -1000.0; k = 0
    while x < xd:
        nx = min(xd, -1000 + (k + 1) * per / 2); xs.append(nx); ys.append(ys[-1])
        if nx < xd: xs.append(nx); ys.append(-ys[-1])
        x = nx; k += 1
    sx, sy = w2s(c, np.array(xs), np.array(ys))
    out.append(poly(np.stack([sx, sy], 1), TR, 0.95 * fade, 3.2))
    if t < b1 + 0.3:
        hx, hy = w2s(c, xs[-1], ys[-1]); out.append(dot(hx, hy, 6, HOT, fade)); out.append(dot(hx, hy, 15, TR, 0.5 * fade))
    # the first light: a dot igniting
    f = flash(t, b0, 0.5)
    if f > 0: hx, hy = w2s(c, -1000, -R); out.append(dot(hx, hy, 10 + 30 * (1 - f), HOT, f))

def wave(t, c, out):
    """the trace: history of the tip, newest at the write head, sampled at screen resolution"""
    if t < RUN: return
    z = c[2]; Sn = S(t)
    xl, xr = c[0] - 980 / z, c[0] + 980 / z
    xa, xb = max(X0, xl), min(X0 + Sn * PXS, xr)
    if xb <= xa: return
    sx = np.arange(max(0, (xa - c[0]) * z + 960), min(1920, (xb - c[0]) * z + 960) + 2, 2.0)
    s = Sn - ((sx - 960) / z + c[0] - X0) / PXS
    Nn = max(1, N_at(t))
    # dense samples around every edge in view so steep edges and thin spikes are never missed
    k0, k1 = math.floor(s.min() * 2) - 1, math.ceil(s.max() * 2) + 1
    ext = [s]
    wdt = 4 / (4 * Nn)
    for k in range(k0, k1 + 1):
        e = k / 2.0
        ext.append(e + np.linspace(-wdt, wdt, 121))
    s = np.unique(np.concatenate(ext)); s = s[(s >= 0) & (s <= Sn)]
    x = X0 + (Sn - s) * PXS; s = s[np.argsort(x)]; x = np.sort(x)
    v = trace(s, t); px, py = w2s(c, x, -R * v)
    ok = (px > -40) & (px < 1960)
    px, py = px[ok], py[ok]
    if len(px) < 2: return
    xa_, ya_, xb_, yb_ = px[:-1], py[:-1], px[1:], py[1:]
    age = np.clip(((xa_ - 960) / z + c[0] - X0) / (PXS * 6.0), 0, 1)       # older = dimmer (6 s of signal)
    sl = np.abs(yb_ - ya_) / np.maximum(np.abs(xb_ - xa_), 0.5)
    speed = np.clip((1 / np.sqrt(1 + sl ** 2)) ** 0.25, 0.6, 1)
    I = (0.38 + 0.62 * (1 - age) ** 1.2) * speed
    lv = np.clip(np.round(I * 12), 1, 12)
    for L in np.unique(lv):
        sel = lv == L
        out.append(segs(np.stack([xa_[sel], ya_[sel], xb_[sel], yb_[sel]], 1), TR, L / 12, 3.0))
    # hot core behind the head while running
    if RUN < t < STOP:
        hx = (X0 - c[0]) * z + 960; sel = xa_ < hx + 160 * min(z, 1.5)
        if sel.any(): out.append(segs(np.stack([xa_[sel], ya_[sel], xb_[sel], yb_[sel]], 1), HOT, 0.6, 1.4))

def circles(t, c, out):
    """the epicycle chain with its afterglow, rotation arrows, arm and joints; the connector to the head"""
    ma0, ma1 = TL['title1']['morph']
    if t < ma1: return
    z = c[2]; J, r = chain(t)
    sxy = np.stack(w2s(c, J[:, 0], J[:, 1]), 1); rs = r * z
    running = RUN < t < STOP
    if running:                                                      # afterglow: earlier instants, fading
        for i in range(8, 0, -1):
            Jg, rg = chain(t - i * 0.009); a = 0.28 * (1 - i / 9) ** 2.2
            gx, gy = w2s(c, Jg[:, 0], Jg[:, 1])
            for j in range(min(len(rg), 6)):
                if rg[j] * z > 2: out.append(circ(gx[j], gy[j], rg[j] * z, TR, a, 1.4))
            out.append(poly(np.stack([gx[:7], gy[:7]], 1), TR, a, 1.4))
        TRL = 32
        trail = np.array([tip(t - i * 0.004) for i in range(TRL, -1, -1)])
        tx, ty = w2s(c, trail[:, 0], trail[:, 1]); al = 0.85 * (np.arange(1, TRL + 1) / TRL) ** 1.6
        lvv = np.round(al * 10)
        for L in np.unique(lvv):
            if L <= 0: continue
            s_ = lvv == L
            out.append(segs(np.stack([tx[:-1][s_], ty[:-1][s_], tx[1:][s_], ty[1:][s_]], 1), TR, L / 10, 2.4))
    live = np.nonzero(gates(t) > 0)[0]
    for j, ti in enumerate(live):
        if rs[j] < 1.2: continue
        if not (-rs[j] < sxy[j, 0] < 1920 + rs[j] and -rs[j] < sxy[j, 1] < 1080 + rs[j]): continue
        out.append(circ(sxy[j, 0], sxy[j, 1], rs[j], TR, 0.95 if j < 8 else 0.7, 2.4 if j < 4 else 1.6))
        fl = 1 - seg(t, BS[ti], BS[ti] + GS[ti] + 0.35)
        if j > 0 and fl > 0 and j < 30: out.append(circ(sxy[j, 0], sxy[j, 1], rs[j], HOT, 0.7 * fl, 2.0))
        ra = rs[j] * 0.72
        if ra >= 22 and j < 8:
            a0, a1 = -2.25, -1.45
            out.append(arc(sxy[j, 0], sxy[j, 1], ra, a1, a0, TR, 0.85, 2.0))
            ex, ey = sxy[j, 0] + ra * math.cos(a0), sxy[j, 1] + ra * math.sin(a0); tg = a0 - math.pi / 2
            tri = VMobject(fill_color=TR, fill_opacity=0.85, stroke_width=0)
            tri.set_points_as_corners([P(ex + 9 * math.cos(tg), ey + 9 * math.sin(tg)), P(ex + 7 * math.cos(tg + 2.3), ey + 7 * math.sin(tg + 2.3)),
                                       P(ex + 7 * math.cos(tg - 2.3), ey + 7 * math.sin(tg - 2.3)), P(ex + 9 * math.cos(tg), ey + 9 * math.sin(tg))])
            out.append(tri)
    a0, a1 = TL['arm']; ua = ss(seg(t, a0, a1))
    pts = sxy if ua >= 1 else np.array([sxy[0], sxy[0] + (sxy[1] - sxy[0]) * ua])
    if ua > 0:
        k = min(len(pts), 40)
        out.append(poly(pts[:k], HOT, 1, 3.0)); out.append(poly(pts[:k], TR, 0.55, 6.0))
        for j in range(min(k, 12)): out.append(dot(pts[j, 0], pts[j, 1], 6 if j == 0 else 4.2, HOT, 1))
    else: out.append(dot(sxy[0, 0], sxy[0, 1], 6, HOT, 1))
    if ua >= 1 and t >= RUN:
        tp = sxy[-1]; hx = (X0 - c[0]) * z + 960; d = []; x = tp[0]
        while x < hx - 4: d.append((x, tp[1], min(x + 6, hx - 4), tp[1])); x += 13
        if d: out.append(segs(d, TR, 0.6, 1.6, 'butt'))
        if t < STOP:
            out.append(dot(hx, tp[1], 6, HOT, 1)); out.append(dot(hx, tp[1], 14, TR, 0.5))

LABELS = [(3, 'n3', 3.6), (5, 'n5', 2.1), (7, 'n7', 2.1)]               # (harmonic, birth key, seconds on screen)
def label_text(n): return f'×{n}  ·  r = 1/{n}'

def label_pos(t, c, n):
    """where a tag sits: beside its circle; while the x5 tag is up, the x7 tag lines up under it (their circles overlap)"""
    if n == 7 and t < B['n5'] + dict((k, h) for _, k, h in LABELS)['n5'] + 0.3: x, y = label_pos(t, c, 5); return x, y + 32
    J, r = chain(t); live = list(np.nonzero(gates(t) > 0)[0]); idx = [NS[i] for i in live].index(n)
    sx, sy = w2s(c, J[idx, 0], J[idx, 1]); rr = r[idx] * c[2]
    return sx + rr * 0.75 + 14, sy - rr * 0.75 - 6

def labels(t, c, out):
    """'x3 . 1/3' tags that hang beside the first new circles"""
    for n, key, hold in LABELS:
        b = B[key]; a = ss(seg(t, b + 0.15, b + 0.45)) * (1 - ss(seg(t, b + hold, b + hold + 0.3)))
        if a <= 0: continue
        x, y = label_pos(t, c, n)
        out.append(text(label_text(n), 24, MONO, UI, 0.9 * a, x, y))

# ------------------------------------------------------------------ HUD (screen-fixed)
def hud(t, c, out):
    h0 = 14.6; a = ss(seg(t, h0, h0 + 0.5)) * (1 - ss(seg(t, 44.6, 45.2)))
    if a > 0:
        Nn = N_at(t); ft = float(trace(np.array([S(t)]), t)[0]) if t >= RUN else 0.0
        g = major_step(c[2]); ms = g / PXS * 1000; vd = g / R
        nstr = '∞' if t >= TL['infinity'] else str(Nn)
        lines = [f'N    = {nstr}', f't    = {S(t):.3f} s', f'f(t) = {"+" if ft >= 0 else "−"}{abs(ft):.3f} V']
        for i, s in enumerate(lines):
            out.append(text(s, 21, MONO, UI, 0.8 * a, 1500, 52 + 28 * i))
        for tt in [B['n3'], B['n5'], B['n7']] + list(BS[(BS > B['rush'][0]) & (BS < B['rush'][1] + 0.01)]):
            f = flash(t, tt, 0.3)
            if f > 0: out.append(text(lines[0], 21, MONO, HOT, 0.7 * f * a, 1500, 52)); break
        knob = f'{fmt_div(ms)}/div   {fmt_v(vd)}/div   {"RUN" if t < STOP else "STOP"}'
        out.append(text(knob, 19, MONO, UI, 0.62 * a, 1500, 52 + 28 * 3 + 6))
        f = flash(t, STOP, 0.6)
        if f > 0: out.append(text(knob, 19, MONO, HOT, 0.8 * f, 1500, 52 + 28 * 3 + 6))
    # the formula: arrives with the axis, its upper limit is the number of circles, then infinity
    f0 = 19.4
    if t >= f0:
        Nn = N_at(t); key = 'suminf' if t >= TL['infinity'] else 'sum' + str(max(1, Nn))
        m = formula(key); gl = sorted(m.submobjects, key=lambda q: q.get_center()[0]); k = len(gl)
        sig = max(gl, key=lambda q: q.height)
        for i, gg in enumerate(gl):
            ti = f0 + 0.8 * i / max(1, k - 1); u = ss(seg(t, ti, ti + 0.15))
            if u <= 0: continue
            gg.set_fill(UI, opacity=0.9 * u); out.append(gg)
            fl = flash(t, ti, 0.3)
            if sig.get_left()[0] <= gg.get_center()[0] <= sig.get_right()[0] and gg.get_center()[1] > sig.get_top()[1] - 0.02:
                for tt in [B['n3'], B['n5'], B['n7'], B['rush'][1], B['burst1'][1], B['burst2'][1], TL['infinity']]: fl = max(fl, flash(t, tt, 0.6))
            if fl > 0: h = gg.copy(); h.set_fill(HOT, opacity=0.85 * fl); out.append(h)

def fmt_div(ms): return f'{ms:.0f} ms' if ms >= 10 else (f'{ms:.1f} ms' if ms >= 1 else f'{ms * 1000:.0f} µs')
def fmt_v(v): return f'{v:.2f} V' if v >= 0.1 else f'{v * 1000:.0f} mV'

# ------------------------------------------------------------------ subtitles (bilingual, one line each)
@functools.lru_cache(None)
def cues():
    words = json.load(open(os.path.join(VOICE, 'words.json'))); subs = json.load(open(os.path.join(HERE, 'voice', 'subs.json')))
    dur = json.load(open(os.path.join(VOICE, 'dur.json')))
    out = []
    for cdef in subs:
        L = cdef['line']; t0 = TL['vo'][L]; w = words[L]
        if cdef['from'] == 0: a = t0 - 0.05                              # a line's first cue starts with the voice
        else: a = t0 + (w[cdef['from'] - 1][2] + w[cdef['from']][1]) / 2   # later cues split at the gap between words
        b = t0 + w[cdef['to']][2] + 0.25 if cdef['to'] < len(w) - 1 else t0 + dur[L] + 0.25
        if out and out[-1]['line'] == L: out[-1]['t1'] = a                  # no overlap inside a line
        out.append(dict(line=L, t0=a, t1=b, en=cdef['en'], zh=cdef['zh'], speech=b - 0.25 - a))
    for i, q in enumerate(out):                                       # every cue >= 1.8 s and >= its speech + 0.6 s, never into the next
        need = max(1.8, q['speech'] + 0.6)
        nxt = out[i + 1]['t0'] if i + 1 < len(out) else DUR - 1.0
        q['t1'] = min(max(q['t1'], q['t0'] + need), nxt)
    return out

def subtitles(t, out):
    for q in cues():
        if not (q['t0'] <= t < q['t1']): continue
        a = ss(seg(t, q['t0'], q['t0'] + 0.15)) * (1 - ss(seg(t, q['t1'] - 0.15, q['t1'])))
        zh = text(q['zh'], 36, SERIF_SC, UI, 0.95 * a, 140, 982); en = text(q['en'], 29, STIX, UI, 0.72 * a, 141, 1026, slant=ITALIC)
        wpx = max(zh.width, en.width) * PX
        for pad, op in [(70, 0.22), (40, 0.22), (14, 0.22)]:          # a soft dark scrim so the trace never runs through the words
            r = VMobject(fill_color='#000000', fill_opacity=op * a, stroke_width=0)
            x0, x1, y0, y1 = 100 - pad * 0.5, 150 + wpx + pad, 944 - pad * 0.5, 1040 + pad * 0.3
            r.set_points_as_corners([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1), P(x0, y0)]); out.append(r)
        out.append(segs([(118, 948, 118, 1032)], UI, 0.5 * a, 2.0, 'butt'))
        out.append(zh); out.append(en)

# ------------------------------------------------------------------ titles
@functools.lru_cache(None)
def title1():
    c0 = (450.0, -40.0, 0.9)
    g = WorldGlyphs('How do you roll a square out of circles?', 62, STIX, 150, 218, c0, t2s={'circles?': ITALIC})
    circ_pts = Circle(radius=R * coef(1)).points[:, :2] * np.array([1, -1])     # world circle at the origin
    g.set_targets([circ_pts] * g.n); return g

@functools.lru_cache(None)
def title2():
    c0 = (480.0, 0.0, 0.92)                                          # where the axis is laid (the camera at the morph)
    en = WorldGlyphs('Any wave is a sum of circles', 64, STIX, 150, 210, None, t2s={'circles': ITALIC})
    zh = WorldGlyphs('任何波，都是圆的叠加', 36, SERIF_SC, 150, 262, None)
    xl, xr = c0[0] - 1200 / c0[2], c0[0] + 1200 / c0[2]
    tot = en.n + zh.n
    def tgt(i):
        a = xl + (xr - xl) * i / tot; b = xl + (xr - xl) * (i + 1) / tot
        v = VMobject(); v.set_points_as_corners([[a, 0, 0], [b, 0, 0]]); return v.points[:, :2]
    en.set_targets([tgt(i) for i in range(en.n)]); zh.set_targets([tgt(en.n + i) for i in range(zh.n)])
    return en, zh

@functools.lru_cache(None)
def title3():
    c0 = (900.0, -40.0, 0.55)
    en = WorldGlyphs('The Gibbs phenomenon', 84, STIX, 150, 262, c0, t2s={'Gibbs phenomenon': ITALIC})
    zh = WorldGlyphs('吉布斯现象', 40, SERIF_SC, 152, 318, c0)
    return en, zh

# ------------------------------------------------------------------ amber layer (CH2): cursors and spike markers
def amber_lines(t, yp, y1):
    """the CH2 readout: three decimals (constant from N = 25 on); the share of the jump arrives with the verdict line"""
    pk = peak(min(N_at(t), 400)); dv = pk - 1.0; mid = (yp + y1) / 2
    L = [(f'Δ = {dv:.3f} V', 30, 1.0, 26, mid - 8), (f'peak  {pk:.3f} V', 21, 0.7, 27, yp - 14), ('1.000 V', 21, 0.6, 27, y1 + 30)]
    if t >= TL['verdict']: L.append((f'{dv / 2 * 100:.2f} % of the 2 V jump', 24, 0.85 * ss(seg(t, TL['verdict'], TL['verdict'] + 0.3)), 27, mid + 30))
    return L

def amber(t, c, out):
    c0 = TL['cursors']
    a = ss(seg(t, c0, c0 + 0.5)) * (1 - ss(seg(t, TL['pullback'][0], TL['pullback'][0] + 0.6)))
    if a > 0:
        z = c[2]; Nn = N_at(t); pk = peak(min(Nn, 400))
        y1 = (-R * 1.0 - c[1]) * z + 540; yp = (-R * pk - c[1]) * z + 540
        d = []; x = 0.0
        while x < 1920: d.append((x, y1, x + 10, y1)); x += 18
        out.append(segs(d, TR, 0.75 * a, 1.6, 'butt'))
        out.append(segs([(0, yp, 1920, yp)], TR, 0.9 * a, 1.6, 'butt'))
        ax = 1380
        out.append(segs([(ax, yp + 4, ax, y1 - 4)], TR, 0.9 * a, 2.0))
        for yy, sgn in [(yp + 4, 1), (y1 - 4, -1)]:
            out.append(segs([(ax, yy, ax - 8, yy + 12 * sgn), (ax, yy, ax + 8, yy + 12 * sgn)], TR, 0.9 * a, 2.0))
        dv = pk - 1.0; pct = dv / 2 * 100
        for s_, px, op, dx, y in amber_lines(t, yp, y1):
            out.append(text(s_, px, MONO, TR, op * a, ax + dx, y))
        for tt in (B['burst1'][1], B['burst2'][1]):                      # the readout re-measures each time circles are added
            f = flash(t, tt, 0.6)
            if f > 0: out.append(text(f'Δ = {dv:.3f} V', 30, MONO, TR, f, ax + 26, (yp + y1) / 2 - 8))
    # ending: every corner keeps its spike; a wave of amber light runs along them
    p0 = TL['pullback'][0]
    if t >= p0 + 1.0:
        z = c[2]; Nn = N_at(t); pk = peak(min(Nn, 400))
        b = ss(seg(t, p0 + 1.0, p0 + 2.0)) * (1 - seg(t, TL['poweroff'][0], TL['poweroff'][0] + 0.3))
        Sn = S(t)
        for k in range(0, int(Sn * 2) + 1):
            e = k / 2.0; rising = k % 2 == 0
            x = X0 + (Sn - e) * PXS - (PXS / (4 * Nn)) * (1 if rising else 1)
            y = -R * pk * (1 if rising else -1)
            sx, sy = w2s(c, x, y)
            if not (-30 < sx < 1950): continue
            ph = (t - (p0 + 1.4) - (sx / 1920) * 1.2) % 2.2
            pulse = 0.35 + 0.65 * math.exp(-(ph / 0.35) ** 2)
            out.append(dot(sx, sy, 4.5, TR, b * pulse)); out.append(dot(sx, sy, 13, TR, 0.35 * b * pulse))

# ------------------------------------------------------------------ end card: style name and credit, typed by the beam
CREDIT = 'LemoLab × Claude Opus 5.5'
def typed(t, t0, t1, s, px, font, x, base, out, op=0.9, anchor='right', slant='NORMAL'):
    m = text(s, px, font, UI, op, x, base, anchor, slant=slant); n = len(m.submobjects)
    for i, g in enumerate(m.submobjects):
        ti = t0 + (t1 - t0) * i / max(1, n - 1)
        if t < ti: continue
        out.append(g); f = flash(t, ti, 0.3)
        if f > 0: h = g.copy(); h.set_fill(HOT, opacity=0.8 * f); out.append(h)

def endcard(t, out):
    s0, s1 = TL['sign']
    if t < s0: return
    out.append(segs([(1858, 928, 1858 - 560 * eo(seg(t, s0, s0 + 0.4)), 928)], UI, 0.45, 1.2, 'butt'))   # a hairline the beam draws first
    zh = text('示波器数学', 28, SERIF_SC, UI, 0.8, 1858, 972, 'right')
    typed(t, s0 + 0.15, s0 + 0.45, '示波器数学', 28, SERIF_SC, 1858, 972, out, 0.8)
    typed(t, s0 + 0.05, s0 + 0.4, 'Oscilloscope Math', 28, STIX, 1858 - zh.width * PX - 20, 972, out, 0.8, slant=ITALIC)
    typed(t, s0 + 0.35, s1, CREDIT, 30, MONO, 1858, 1022, out, 0.95)

# ------------------------------------------------------------------ the frame
def frame(t):
    main, amb = [], []
    c = cam(t)
    gop = 0.55 + 0.45 * ss(seg(t, 19.0, 19.8))
    gop *= ss(seg(t, 0.0, 0.9))
    graticule(t, c, main, gop)
    a2en, a2zh = title2()
    axis(t, c, main, ss(seg(t, TL['title2']['morph'][1] - 0.1, TL['title2']['morph'][1] + 0.2)))
    cold_square(t, c, main)
    wave(t, c, main)
    circles(t, c, main)
    labels(t, c, main)
    # titles
    w1 = TL['title1']['write']; m1 = TL['title1']['morph']
    if w1[0] <= t < m1[1] + 0.1: title1().draw(t, c, main, w1, m1, ui_op=0.95)
    w2 = TL['title2']['write']; m2 = TL['title2']['morph']
    if w2[0] <= t < m2[1] + 0.1:
        a2en.draw(t, c, main, w2, m2, ui_op=0.95)
        a2zh.draw(t, c, main, (w2[0] + 0.3, w2[1] + 0.3), (m2[0] + 0.25, m2[1]), ui_op=0.8, hot_flash=False)
    w3 = TL['title3']['write']
    if t >= w3[0]:
        en, zh = title3(); en.draw(t, c, main, w3, None, ui_op=0.96); zh.draw(t, c, main, (w3[0] + 0.7, w3[1] + 0.5), None, ui_op=0.8, hot_flash=False)
        g = ss(seg(t, w3[1] + 0.2, w3[1] + 0.8))
        if g > 0:
            amb.append(text('overshoot → 8.95 %   for every N, even ∞', 24, MONO, TR, 0.85 * g, 152, 362))
    endcard(t, main)
    hud(t, c, main)
    amber(t, c, amb)
    subtitles(t, main)
    return main, amb

# ------------------------------------------------------------------ texts for the reading-time check (core/render/readcheck.mjs)
def _box(m): return (float(m.get_left()[0] * PX + 960), float(540 - m.get_top()[1] * PX), float(m.get_right()[0] * PX + 960), float(540 - m.get_bottom()[1] * PX))

def texts(t):
    """every text the viewer has to read at t, with its full wording and screen box. The live instrument readouts
    (N, t, f(t), TIME/DIV, the formula's upper limit) are meters, not reading text, and are left out; subtitles go by the .srt"""
    out = []; c = cam(t)
    w1, m1 = TL['title1']['write'], TL['title1']['morph']
    if w1[0] <= t < m1[0]: out.append(dict(id='title1', text=title1().text, box=title1().box(c)))
    en, zh = title2(); w2, m2 = TL['title2']['write'], TL['title2']['morph']
    if w2[0] <= t < m2[0]: out.append(dict(id='title2', text=en.text, box=en.box(c)))
    if w2[0] + 0.3 <= t < m2[0] + 0.25: out.append(dict(id='title2zh', text=zh.text, box=zh.box(c)))
    for n, key, hold in LABELS:
        b = B[key]
        if b + 0.15 <= t < b + hold + 0.3:
            x, y = label_pos(t, c, n)
            out.append(dict(id=f'label{n}', text=label_text(n), box=_box(text(label_text(n), 24, MONO, UI, 1, x, y))))
    if TL['cursors'] <= t < TL['pullback'][0]:
        pk = peak(min(N_at(t), 400)); y1 = (-R - c[1]) * c[2] + 540; yp = (-R * pk - c[1]) * c[2] + 540
        for i, (s_, px, op, dx, y) in enumerate(amber_lines(t, yp, y1)):
            out.append(dict(id=f'ch2-{i}', text=s_, box=_box(text(s_, px, MONO, TR, 1, 1380 + dx, y))))
    w3 = TL['title3']['write']
    if t >= w3[0] and t < TL['poweroff'][0]:
        e3, z3 = title3(); out.append(dict(id='title3', text=e3.text, box=e3.box(c)))
        if t >= w3[0] + 0.7: out.append(dict(id='title3zh', text=z3.text, box=z3.box(c)))
        if t >= w3[1] + 0.2:
            s_ = 'overshoot → 8.95 %   for every N, even ∞'; out.append(dict(id='overshoot', text=s_, box=_box(text(s_, 24, MONO, TR, 1, 152, 362))))
    s0, s1 = TL['sign']
    if s0 <= t < TL['poweroff'][0]:
        zh_ = text('示波器数学', 28, SERIF_SC, UI, 1, 1858, 972, 'right')
        out.append(dict(id='style-zh', text='示波器数学', box=_box(zh_)))
        out.append(dict(id='style-en', text='Oscilloscope Math', box=_box(text('Oscilloscope Math', 28, STIX, UI, 1, 1858 - zh_.width * PX - 20, 972, slant=ITALIC))))
        out.append(dict(id='credit', text=CREDIT, box=_box(text(CREDIT, 30, MONO, UI, 1, 1858, 1022, 'right'))))
    return [dict(id=q['id'], text=q['text'], x0=q['box'][0], y0=q['box'][1], x1=q['box'][2], y1=q['box'][3]) for q in out]

# ------------------------------------------------------------------ events for the sound
def events():
    ev = []
    b0, b1 = TL['beam']; ev.append(dict(type='ignite', t=b0))
    for k in range(1, 8):
        x = -1000 + k * 400.0; tt = b0 + (x + 1000) / 560.0
        if tt < b1: ev.append(dict(type='edge', t=tt, pan=0.0))
    ev.append(dict(type='beam', t=b0, d=b1 - b0))
    for name, (w0, w1), n in [('t1', TL['title1']['write'], title1().n), ('t2', TL['title2']['write'], title2()[0].n), ('t3', TL['title3']['write'], title3()[0].n)]:
        for i in range(n): ev.append(dict(type='glyph', t=w0 + (w1 - w0 - 0.35) * i / max(1, n - 1), pan=-0.6 + 1.0 * i / n))
    ev.append(dict(type='morph', t=TL['title1']['morph'][0], d=TL['title1']['morph'][1] - TL['title1']['morph'][0], kind='circle'))
    ev.append(dict(type='morph', t=TL['title2']['morph'][0], d=TL['title2']['morph'][1] - TL['title2']['morph'][0], kind='axis'))
    ev.append(dict(type='run', t=RUN)); ev.append(dict(type='cut', t=TL['matchcut']))
    for n, b, g in TERMS:
        if b < STOP: ev.append(dict(type='birth', t=b, n=n))
    ev.append(dict(type='stop', t=STOP)); ev.append(dict(type='dive', t=TL['dive'][0], d=TL['dive'][1] - TL['dive'][0]))
    ev.append(dict(type='cursor', t=TL['cursors']))
    for k in ('burst1', 'burst2'): ev.append(dict(type='burst', t=B[k][0], d=B[k][1] - B[k][0]))
    ev.append(dict(type='infinity', t=TL['infinity'])); ev.append(dict(type='pull', t=TL['pullback'][0], d=TL['pullback'][1] - TL['pullback'][0]))
    for i in range(len(CREDIT)): ev.append(dict(type='glyph', t=TL['sign'][0] + 0.35 + (TL['sign'][1] - TL['sign'][0] - 0.35) * i / (len(CREDIT) - 1), pan=0.5 + 0.3 * i / len(CREDIT)))
    ev.append(dict(type='poweroff', t=TL['poweroff'][0]))
    return dict(dur=DUR, bpm=TL['bpm'], run=RUN, stop=STOP, vo=TL['vo'], terms=[dict(n=n, t=b, g=g) for n, b, g in TERMS if b < STOP],
                ev=sorted(ev, key=lambda e: e['t']))

def render(T0, T1, outdir):
    from PIL import Image
    from manim.camera.camera import Camera
    os.makedirs(outdir, exist_ok=True); cam_ = Camera()
    for k in range(int(round(T0 * FPS)), int(round(T1 * FPS))):
        t = k / FPS; main, amb = frame(t)
        cam_.reset(); cam_.capture_mobjects(main); rgb = cam_.pixel_array[:, :, :3].copy()
        cam_.reset()
        if amb: cam_.capture_mobjects(amb)
        a = cam_.pixel_array[:, :, 0:1].copy()
        Image.fromarray(np.concatenate([rgb, a], 2), 'RGBA').save(os.path.join(outdir, f'f{k:05d}.png'), compress_level=1)

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'render': render(float(a[1]), float(a[2]), a[3])
    elif a and a[0] == 'events': json.dump(events(), open(a[1], 'w'), indent=0)
    elif a and a[0] == 'subs': json.dump(cues(), open(a[1], 'w'), indent=1, ensure_ascii=False)
    elif a and a[0] == 'texts':                                   # sampled every 0.04 s for readcheck
        steps = [round(k * 0.04, 2) for k in range(int(DUR / 0.04) + 1)]
        json.dump(dict(dur=DUR, step=0.04, frames=[texts(t) for t in steps]), open(a[1], 'w'), ensure_ascii=False)
