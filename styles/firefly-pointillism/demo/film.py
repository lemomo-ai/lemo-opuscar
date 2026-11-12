#!/usr/bin/env python3
"""《你亮，我就亮》Shine Back: the whole Firefly Pointillism film (50.6 s, 60 fps). Deterministic and parallel: any frame can be computed on its own.

Every particle position is an analytic function of time t (one state function per act; between acts, a transition staggered per particle blends them).
Particles are conserved: five groups of points are the same pool from start to end, and in every act they "are" something:
  G girl  2400  : the girl (meadow → riding the deer → wide → medium → kneeling → standing → raising the light → hilltop)
  D deer  3600  : fireflies on the ground → the deer → the deer in the wide → the deer in the storm → dead embers → the giant deer → the deer constellation
  W grass 5000  : meadow → ridge → grass bent by the wind → hills
  X small fireflies 6000 : distant fireflies → trails → rain → answering lights on the horizon → the rising ribbon of light → title and sign-off
  B bokeh 1800  : background bokeh → moon and stars → storm clouds → starry sky
Plus one guiding firefly (the brightest single point in the film) and a few flashes.

Usage (from this folder or anywhere, with the library's .venv):
  python film.py still 3.1 11.0 38.0          # test frames → out/stills/
  python film.py render 0 50.6 out/video.mp4  # a range → ffmpeg (WORKERS defaults to 2)
  SIGN=1 python film.py render 0 10 out/short.mp4    # a 10 s cut of the opening: the sign-off gathers in the sky in its last 2.5 s (the full film doesn't use SIGN)
"""
import os, sys, math, json, subprocess
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from engine import *                     # noqa: F401,F403
from engine import _ik                   # noqa: F401
import timeline as TL
from timeline import *                   # noqa: F401,F403  (T_* time points)

FPS = 60
DUR = TL.DUR
FONT = os.path.join(HERE, 'fonts', 'LXGWWenKai-Regular.ttf')
GROUND = 880.0
SIGN = os.environ.get('SIGN', '0') == '1'

AMB, AMBF = [1.0, .74, .34], [1.0, .62, .28]          # girl: amber (hers alone)
LIME, LIMEF = [.78, 1.0, .46], [.60, .92, .36]        # deer: lime (its alone)
FIRE = [.86, 1.0, .40]


# ---------------------------------------------------------------- pose interpolation
def pmix(a, b, u):
    out = {}
    for k in set(a) | set(b):
        va, vb = a.get(k, b.get(k)), b.get(k, a.get(k))
        if isinstance(va, tuple): out[k] = tuple(x + (y - x) * u for x, y in zip(va, vb))
        else: out[k] = va + (vb - va) * u
    return out


def pkeys(t, ks):
    if t <= ks[0][0]: return dict(ks[0][1])
    for (t0, a), (t1, b) in zip(ks, ks[1:]):
        if t <= t1: return pmix(a, b, float(e_io((t - t0) / (t1 - t0))))
    return dict(ks[-1][1])


# ---------------------------------------------------------------- girl poses
def girl_pose_meadow(t):
    p = {}
    p['tilt'] = key(t, [(0, -.06), (1.9, -.06), (2.5, .40), (2.85, .36), (3.4, .12), (3.95, -.02), (5.6, -.02), (6.2, .22), (7.4, .14),
                        (8.6, .10), (9.2, .30), (9.75, .14), (10.4, -.03), (10.9, -.13), (12.0, -.09)])
    p['arm_n'] = (key(t, [(0, .1), (1.9, .1), (2.6, 2.45), (3.1, 2.55), (3.95, 1.55), (8.7, 1.55), (9.3, 1.0), (10.3, 1.05), (10.85, 1.72), (12.6, 1.72)]),
                  key(t, [(0, .28), (1.9, .28), (2.6, .12), (3.1, .1), (3.95, .55), (8.7, .55), (9.3, .45), (10.3, .42), (10.85, .04)]))
    p['arm_f'] = (key(t, [(0, -.1), (1.9, -.1), (2.6, .32), (5.6, .32), (6.1, .62), (7.2, .3), (9.6, .22), (10.3, .1)]), .32)
    p['leg_n'] = (.04, .03); p['leg_f'] = (-.07, .05)
    p['lean'] = key(t, [(0, 0), (9.7, 0), (9.95, -.07), (10.5, .02), (12, .02)])
    p['breath'] = 1.6 * math.sin(2 * math.pi * .45 * t)
    p['pony'] = .10 * math.sin(2 * math.pi * .55 * t) + key(t, [(0, 0), (2.0, 0), (2.4, -.25), (3.0, .05), (6.0, 0), (6.2, .2), (6.7, 0), (9.8, 0), (10.0, .3), (10.6, 0)])
    return p


P_HUNCH = dict(tilt=-.45, lean=-.30, bob=-67.0, leg_n=(.30, 1.87), leg_f=(.22, 1.82), arm_n=(.62, .95), arm_f=(.5, 1.0), pony=.18, breath=0.0)
P_LOOK = dict(tilt=.16, lean=-.10, bob=-67.0, leg_n=(.30, 1.87), leg_f=(.22, 1.82), arm_n=(1.25, .62), arm_f=(1.1, .72), pony=.05, breath=0.0)
P_STAND = dict(tilt=.10, lean=0.0, bob=0.0, leg_n=(.04, .03), leg_f=(-.07, .05), arm_n=(1.5, .5), arm_f=(1.15, .62), pony=0.0, breath=0.0)
P_RAISE = dict(tilt=.44, lean=.05, bob=0.0, leg_n=(.04, .03), leg_f=(-.07, .05), arm_n=(2.85, .05), arm_f=(-.12, .3), pony=.2, breath=0.0)
P_RAISE2 = dict(P_RAISE, tilt=.20)
P_HOLD = dict(tilt=.32, lean=.02, bob=0.0, leg_n=(.04, .03), leg_f=(-.07, .05), arm_n=(1.45, .45), arm_f=(.2, .3), pony=0.0, breath=0.0)
P_UP = dict(P_HOLD, tilt=.48, arm_n=(2.7, .08), pony=.15)


def girl_pose_C(t):
    p = pkeys(t, [(T_KNEEL, P_HUNCH), (28.6, P_HUNCH), (29.5, P_LOOK), (T_STAND0, P_LOOK), (T_STAND1, P_STAND), (T_RAISE0, P_STAND),
                  (T_RAISE1, P_RAISE), (T_GIANT, P_RAISE), (T_BOW1, P_RAISE2), (60, P_RAISE2)])
    sob = float(sstep(T_KNEEL, T_KNEEL + .3, t) * (1 - sstep(27.9, 28.4, t)))
    p['tilt'] += .025 * sob * math.sin(2 * math.pi * 2.6 * t)
    p['breath'] = 1.4 * math.sin(2 * math.pi * .45 * t) + 1.2 * sob * math.sin(2 * math.pi * 2.6 * t)
    p['pony'] += .08 * math.sin(2 * math.pi * .5 * t)
    if t > T_ASK - .2: p['arm_n'] = (p['arm_n'][0] + .06 * math.exp(-((t - T_ASK) / .12) ** 2), p['arm_n'][1])   # the hand lifts a little at the flash
    return p


def girl_pose_hill(t):
    p = pkeys(t, [(T_HILL, P_HOLD), (T_GBLINK - .4, P_HOLD), (T_GBLINK, P_UP), (60, P_UP)])
    p['breath'] = 1.2 * math.sin(2 * math.pi * .45 * t); p['pony'] += .1 * math.sin(2 * math.pi * .5 * t)
    return p


def girl_pose_rideM(t, ph, amt):
    p = girl_pose_ride(t, ph, amt); p['lean'] = -.16; p['tilt'] = -.22 + .03 * math.sin(4 * math.pi * ph)
    p['pony'] = -.5 + .12 * math.sin(2 * math.pi * 3.1 * t)             # ponytail blown back by the wind
    p['arm_n'] = (1.0, .65); p['arm_f'] = (.9, .7)
    return p


# ---------------------------------------------------------------- deer poses and motion
DEER_X0 = 740.0


def deer_vA(t):
    step = 296.0 * math.sin(math.pi * c01((t - 10.0) / .75)) ** 2           # one step forward ≈ 111 px
    walk = 262.0 * float(sstep(T_WALK, T_WALK + .6, t))
    return step + walk


_DXA_T = np.linspace(0, T_GUST + 1.5, 9001)
_v = np.array([deer_vA(a) for a in _DXA_T])
_DXA = np.concatenate([[0], np.cumsum((_v[1:] + _v[:-1]) * .5 * np.diff(_DXA_T))])


def deer_pose_A(t):
    p = {}
    p['neck'] = key(t, [(0, .26), (9.75, .26), (10.1, .5), (10.95, 1.36), (11.8, 1.30), (12.3, .55), (12.9, .62)])
    p['head'] = key(t, [(0, -.32), (9.75, -.32), (10.1, -.5), (10.95, -1.0), (11.8, -.95), (12.3, -.62)])
    if 11.0 < t < 11.75: p['head'] += .05 * math.sin((t - 11.0) * 2 * math.pi * 2.2)
    p['ear'] = .45 * math.exp(-((t - 10.25) / .06) ** 2) + .4 * math.exp(-((t - 11.35) / .05) ** 2)
    p['tail'] = .5 * math.exp(-((t - 12.95) / .07) ** 2) + .4 * math.exp(-((t - 10.4) / .06) ** 2)
    p['breath'] = 1.5 * math.sin(2 * math.pi * .4 * t)
    x = DEER_X0 + float(np.interp(t, _DXA_T, _DXA)); v = deer_vA(t)
    p['amt'] = min(1.0, v / 190.0); p['ph'] = (x - DEER_X0) * .62 / 118.0
    return p, x


FAR_SC = .32
def ridge_y(x): return 912 - .155 * x + 26 * np.sin(x / 260 + .5) + 9 * np.sin(x / 83 + 1.3)
def far_x(t): return 430 + 70 * (t - T_FAR)


def deer_pose_B(t):
    p = dict(neck=.6, head=-.6, breath=1.0 * math.sin(2 * math.pi * .4 * t))
    p['ear'] = .35 * math.exp(-((t - 18.6) / .06) ** 2); p['tail'] = .3 * math.sin(2 * math.pi * 1.1 * t)
    x = far_x(t); p['amt'] = 1.0; p['ph'] = (x / FAR_SC) * .62 / 118.0
    p['head'] += .04 * math.sin(4 * math.pi * p['ph'])
    return p, x


MED_SC = .62
def med_x(t): return 960 + 16 * (t - T_PUSH)


def deer_pose_M(t):
    ph = .62 * (t - T_PUSH)                       # legs walking, body hardly moving forward: against the wind
    p = dict(neck=.78 + .04 * math.sin(4 * math.pi * ph), head=-.78, amt=.6, ph=ph, breath=2.0 * math.sin(2 * math.pi * .7 * t))
    p['ear'] = -.5; p['tail'] = .6 * math.sin(2 * math.pi * 3.3 * t)
    return p, med_x(t)


GIANT_SC = 1.45
LIFT_LIGHT = 95.0                  # at the touch, the light rises from her hand to meet the deer's nose (the deer only lowers its head to here, its body keeps its shape)
P_GSTAND = dict(neck=.26, head=-.30)


def deer_pose_G(t, bow):
    nb, hb = bow
    neck = key(t, [(0, .26), (T_BOW0, .26), (T_BOW1, nb), (40.55, nb), (40.95, .05)])
    head = key(t, [(0, -.30), (T_BOW0, -.30), (T_BOW1, hb), (40.55, hb), (40.95, -.15)])
    crouch = -16 * math.exp(-((t - (T_LEAP - .12)) / .14) ** 2)          # a crouch before the leap
    p = dict(neck=neck, head=head, amt=0.0, ph=0.0, breath=2.4 * math.sin(2 * math.pi * .35 * t) + crouch, spread=34.0, lu=0.0, reach=0.0)
    p['ear'] = .4 * math.exp(-((t - (T_GIANT + .35)) / .07) ** 2) + .35 * math.exp(-((t - T_TOUCH2 - .3) / .06) ** 2)
    p['tail'] = .45 * math.exp(-((t - (T_GIANT + .6)) / .08) ** 2)
    return p


SKY_SC, SKY_G = .74, 548.0
FLIGHT = 1.15
P_LEAP = dict(neck=.12, head=-.12, spread=0.0, lu=75.0, reach=55.0, amt=0.0)
def sky_x(t): return 1290 + 15 * (t - T_LEAP)


def deer_pose_S(t):
    x = sky_x(t); ph = (x / SKY_SC) * .62 / 118.0 * 1.0
    p = dict(neck=.34, head=-.40, amt=.75, ph=ph, breath=1.2 * math.sin(2 * math.pi * .35 * t), spread=0.0, lu=0.0, reach=0.0)
    p['ear'] = .45 * math.exp(-((t - T_DBLINK - .1) / .06) ** 2); p['tail'] = .3 * math.sin(2 * math.pi * .9 * t)
    p['head'] += .03 * math.sin(4 * math.pi * ph)
    return p, x


GXM = 1040.0                       # medium shot: where the girl kneels / stands up
HX = 720.0                         # the girl on the hilltop
def hill_y(x): return 812 + 150 * ((np.asarray(x, float) - 720) / 1000) ** 2 + 7 * np.sin(np.asarray(x, float) / 90 + 1) + 12 * np.sin(np.asarray(x, float) / 310)


def to_world(xf, lp):
    (px, py), sx, sc = xf
    return np.array([px + sx * sc * lp[0], py - sc * lp[1]])


# ---------------------------------------------------------------- text (gathered from points)
def text_mask(items):
    """items: [(text, size, x_left, y_center, tracking)] → bool mask"""
    img = Image.new('L', (W, H), 0); d = ImageDraw.Draw(img)
    for s, size, x0, yc, tr in items:
        f = ImageFont.truetype(FONT, size); x = x0
        bb = d.textbbox((0, 0), 'Hg你', font=f); hgt = bb[3] - bb[1]
        for ch in s:
            d.text((x, yc - hgt / 2 - bb[1]), ch, font=f, fill=255); x += d.textlength(ch, font=f) + tr
    return np.array(img) > 110


TITLE_X = 232
def title_targets(rng):
    zh = grid_sample(text_mask([('你亮，我就亮', 138, TITLE_X, 262, 6)]), 3400, rng)
    en = grid_sample(text_mask([('SHINE BACK', 40, TITLE_X + 6, 372, 15)]), 800, rng)
    st = grid_sample(text_mask([('Firefly Pointillism · 萤火光点', 30, TITLE_X + 6, 446, 3)]), 800, rng)
    cr = grid_sample(text_mask([('LemoLab × Claude Opus 5.5', 32, TITLE_X + 6, 494, 3)]), 800, rng)
    sg = grid_sample(text_mask([('LemoLab × Claude Opus 5.5', 34, 232, 190, 3)]), 800, rng)
    return zh, en, st, cr, sg


# ---------------------------------------------------------------- model
class Model:
    def __init__(self):
        rng = np.random.default_rng(SEED); self.rng = rng
        self.girl = Rig(girl_geom, GIRL_REST, GIRL_Z, GIRL_G, 1500, 900, rng)
        self.deer = Rig(deer_geom, DEER_REST, DEER_Z, DEER_G, 2300, 1300, rng)
        self.nG, self.nD = self.girl.n, self.deer.n
        self.nW, self.nX, self.nB = 5000, 6000, 1800
        R = lambda n: rng.random(n)
        self.r = {}
        for gname, n in (('G', self.nG), ('D', self.nD), ('W', self.nW), ('X', self.nX), ('B', self.nB)):
            self.r[gname] = dict(s=R(n), lat=rng.normal(0, 1, n), lvl=R(n), d1=R(n), d2=R(n), d3=R(n),
                                 ang=R(n) * 2 * math.pi, mag=R(n), ph=R(n) * 2 * math.pi, rate=.35 + .6 * R(n),
                                 w1=.4 + R(n), w2=.3 + .9 * R(n), p1=R(n) * 6.28, p2=R(n) * 6.28, p3=R(n) * 6.28, p4=R(n) * 6.28)
        # ---- meadow (W): blades, spread wider than the frame (the camera tracks sideways)
        nbl = 1000; per = self.nW // nbl
        bx = rng.uniform(-200, 2750, nbl); band = rng.choice(3, nbl, p=[.32, .43, .25])
        by = np.where(band == 0, rng.uniform(850, 900, nbl), np.where(band == 1, rng.uniform(895, 990, nbl), rng.uniform(1000, 1130, nbl)))
        bh = np.where(band == 0, rng.uniform(22, 50, nbl), np.where(band == 1, rng.uniform(38, 95, nbl), rng.uniform(95, 210, nbl)))
        blean = rng.normal(0, .22, nbl); bph = rng.uniform(0, 6.28, nbl)
        bi = np.repeat(np.arange(nbl), per); bi = np.concatenate([bi, rng.integers(0, nbl, self.nW - len(bi))])
        self.W_b = dict(x=bx[bi], y=by[bi], h=bh[bi], lean=blean[bi], ph=bph[bi], band=band[bi], s=np.sqrt(rng.random(self.nW)))
        # ---- grass in the storm (W): a band along the ground, larger near and smaller far, all blown to the left
        nbl2 = 1000; q = rng.random(nbl2) ** .8
        sx2 = rng.uniform(-300, 2300, nbl2)
        bi2 = np.repeat(np.arange(nbl2), per); bi2 = np.concatenate([bi2, rng.integers(0, nbl2, self.nW - len(bi2))])
        self.W_s = dict(x=sx2[bi2], q=q[bi2], y=(GROUND - 12 + 130 * q ** 1.5)[bi2], h=(18 + 120 * q ** 1.6)[bi2],
                        lean=(-.55 - .25 * rng.random(nbl2))[bi2], ph=rng.uniform(0, 6.28, nbl2)[bi2], s=np.sqrt(rng.random(self.nW)))
        # ---- fireflies on the ground (D in the meadow)
        n = self.nD; kind = rng.choice(3, n, p=[.84, .06, .10])
        self.D_f = dict(x=rng.uniform(-60, 1980, n), y=980 - 600 * rng.random(n) ** 2.0, kind=kind,
                        lvl=np.where(kind == 0, rng.uniform(.25, 1.5, n), np.where(kind == 1, rng.uniform(2.6, 3.9, n), rng.uniform(1.8, 2.4, n))),
                        dz=np.where(kind == 1, 1.0, np.where(kind == 2, -1.0, 0.0)))
        self.D_f['lum'] = np.where(kind == 1, 1.1, np.where(kind == 2, .45, .62)) * (.6 + .6 * rng.random(n))
        warm = rng.random(n) < .2
        self.D_f['col'] = np.where(warm[:, None], [1.0, .80, .36], [.80, 1.0, .33])
        # ---- dead embers (D): blown to the left, lying on the ground
        self.D_e = dict(x=rng.uniform(-180, 1000, n), y=GROUND - 8 + 70 * rng.random(n) ** 1.5 - 260 * rng.random(n) ** 3, da=.35 * rng.random(n))
        # ---- small distant fireflies (X in the meadow)
        n = self.nX
        self.X_f = dict(x=rng.uniform(-60, 2700, n), y=905 - 600 * rng.random(n) ** 2.2, lvl=rng.uniform(.7, 1.9, n), lum=.07 + .13 * rng.random(n))
        # ---- rain (X)
        self.X_rain = dict(x=rng.uniform(-300, 2300, n), y=rng.uniform(-150, 1250, n))
        # ---- answering lights on the horizon (X): larger near and smaller far, denser in the distance
        qf = rng.random(n) ** 1.5
        hov = rng.random(n) ** 2.5                      # height above ground: fireflies fly, they don't sit on the ground
        self.X_ans = dict(x=np.where(qf < .5, rng.uniform(-400, 2400, n), rng.uniform(-250, 2250, n)), q=qf,
                          y=572 + 330 * qf ** 1.25 - hov * (25 + 230 * qf) + rng.normal(0, 4 + 14 * qf, n),
                          lvl=.2 + 3.0 * qf ** 2.2, b=(.35 + .55 * rng.random(n)) * (.32 + 1.0 * qf ** 1.5))
        far = np.nonzero((qf < .12) & (self.X_ans['x'] > 1450) & (self.X_ans['x'] < 1600))[0]
        self.ans1 = far[:1]
        mid = np.nonzero((qf < .3) & (self.X_ans['x'] > 1200) & (self.X_ans['x'] < 1900))[0]
        self.ans5 = mid[1:6]
        self.X_arr = T_SYNC + 1.25 * qf + .22 * np.abs(self.X_ans['x'] - GXM) / 1200 + .12 * rng.random(n)
        # ---- background bokeh (B in the meadow)
        n = self.nB
        self.B_f = dict(x=rng.uniform(-150, 2850, n), y=650 + rng.normal(0, 110, n), lvl=rng.uniform(3.0, 4.0, n), lum=.10 + .28 * rng.random(n) ** 2,
                        col=np.where((rng.random(n) < .35)[:, None], [.30, .62, .58], [.50, .80, .34]))
        # ---- moon + stars (B in the wide shot)
        nm = 1250; self.nMoon = nm
        rr = 182 * np.sqrt((np.arange(nm) + .5) / nm); th = np.arange(nm) * 2.39996323
        mx = 1490 + rr * np.cos(th) + rng.normal(0, 2.2, nm); my = 318 + rr * np.sin(th) + rng.normal(0, 2.2, nm)
        maria = .5 + .5 * np.sin(mx / 37 + 1.1) * np.sin(my / 29 - .4) + .3 * np.sin((mx + my) / 23)
        self.moon = dict(x=mx, y=my, lum=(.62 - .30 * c01(maria)) * (1 + .4 * (rr > 170)))
        ns = self.nB - nm; sx_, sy_ = [], []
        while len(sx_) < ns:
            x, y = rng.uniform(0, W), rng.uniform(15, 640)
            if (x - 1490) ** 2 + (y - 318) ** 2 < 250 ** 2: continue
            if y > ridge_y(x) - 60: continue
            sx_.append(x); sy_.append(y)
        self.stars = dict(x=np.array(sx_), y=np.array(sy_), lum=.05 + .55 * rng.random(ns) ** 3)
        # ---- storm clouds (B): nine large blobs of light
        K = 9; ck = rng.integers(0, K, n); cx = np.linspace(-100, 2500, K) + rng.uniform(-80, 80, K); cy = rng.uniform(120, 430, K)
        self.B_c = dict(x=cx[ck] + rng.normal(0, 170, n), y=cy[ck] + rng.normal(0, 60, n), lvl=3.3 + .7 * rng.random(n),
                        lum=.05 + .08 * rng.random(n))
        # ---- closing starry sky (B): keeps clear of the title
        ex, ey = [], []
        while len(ex) < n:
            x, y = rng.uniform(-60, W + 60), rng.uniform(10, 780)
            if 180 < x < 1010 and 150 < y < 530: continue
            if y > hill_y(x) - 40: continue
            ex.append(x); ey.append(y)
        self.B_end = dict(x=np.array(ex), y=np.array(ey), lum=.04 + .5 * rng.random(n) ** 3.2)
        # ---- ridge in the wide shot (W)
        n = self.nW; crest = rng.random(n) < .36; x = rng.uniform(-80, 2000, n)
        dy = np.where(crest, rng.normal(0, 3, n), np.abs(rng.normal(0, 70, n)) + rng.uniform(0, 70, n))
        self.ridge = dict(x=x, y=ridge_y(x) + dy, crest=crest, lvl=np.where(crest, .55, 1.0 + 1.3 * rng.random(n)),
                          lum=np.where(crest, .34, .12 * np.exp(-dy / 110)))
        # ---- closing hills (W)
        crest = rng.random(n) < .34; x = rng.uniform(-80, 2000, n)
        dy = np.where(crest, rng.normal(0, 2.5, n), np.abs(rng.normal(0, 80, n)) + rng.uniform(0, 90, n))
        self.hill = dict(x=x, y=hill_y(x) + dy, crest=crest, lvl=np.where(crest, .5, .9 + 1.4 * rng.random(n)),
                         lum=np.where(crest, .30, .11 * np.exp(-dy / 120)))
        # ---- text
        zh, en, st, cr, sg = title_targets(rng)
        self.title = np.concatenate([zh, en, st, cr])
        self.iT = len(self.title)                     # the first iT points of X form the title and sign-off
        self.T_kind = np.concatenate([np.zeros(len(zh)), np.ones(len(en)), 2 * np.ones(len(st)), 3 * np.ones(len(cr))])
        self.i_cr = np.arange(len(zh) + len(en) + len(st), self.iT)
        self.sign = sg
        self.X_trail = rng.random(self.nX) < .72
        # ---- the giant deer lowers its head to touch her hand: solve for the deer's position and head angle
        gC = girl_geom(dict(P_RAISE2, breath=0.0))
        hand = to_world(((GXM, GROUND), -1.0, MED_SC), gC['hand_n'][1]) + np.array([0, -10.0])
        self.hand_raise = hand
        best = None
        for nb in np.linspace(.3, 2.2, 60):
            for hb in np.linspace(-1.5, -.2, 40):
                p = dict(neck=nb, head=hb, spread=34.0); deer_geom(p); sn = p['_snout']
                err = abs(GROUND - GIANT_SC * sn[1] - (hand[1] - LIFT_LIGHT + 6)) + 20 * abs(hb + 1.25) + 30 * max(0.0, nb - 1.6)
                if best is None or err < best[0]: best = (err, nb, hb, sn)
        _, nb, hb, sn = best
        self.bow = (nb, hb)
        self.GX = float(hand[0] - 10 - GIANT_SC * sn[0])
        print('giant deer at x=%.0f, bow neck %.2f head %.2f' % (self.GX, nb, hb), file=sys.stderr)

    # ---- group states -------------------------------------------------------
    @staticmethod
    def st(pos, lvl, lum, col, dz=0.0):
        n = len(pos)
        return dict(pos=pos, lvl=np.broadcast_to(np.asarray(lvl, float), (n,)).copy(), lum=np.broadcast_to(np.asarray(lum, float), (n,)).copy(),
                    col=np.broadcast_to(np.asarray(col, float), (n, 3)).copy(), dz=np.broadcast_to(np.asarray(dz, float), (n,)).copy())

    def stream(self, gname, t):
        r = self.r[gname]
        tau = np.clip((t + .16) * 1.3 - r['s'] * .62, 0, 1.25)
        P0, P1, P2, P3 = np.array([-320, 1160.]), np.array([520, 1060.]), np.array([980, 230.]), np.array([2350, 330.])
        tt = tau[:, None]
        pos = (1 - tt) ** 3 * P0 + 3 * (1 - tt) ** 2 * tt * P1 + 3 * (1 - tt) * tt * tt * P2 + tt ** 3 * P3
        der = 3 * (1 - tt) ** 2 * (P1 - P0) + 6 * (1 - tt) * tt * (P2 - P1) + 3 * tt * tt * (P3 - P2)
        der /= np.linalg.norm(der, axis=1, keepdims=True) + 1e-9; nrm = np.stack([-der[:, 1], der[:, 0]], 1)
        spread = r['lat'][:, None] * (40 + 120 * tt)
        wob = 25 * np.sin(r['p1'][:, None] + 9 * tt + t * 3)
        pos = pos + nrm * (spread + wob)
        lvl = np.where(r['lvl'] < .2, 2.8 + 1.2 * r['d1'], .3 + 1.6 * r['d1'])
        lum = np.where(r['lvl'] < .2, .9, .42) * (.4 + .6 * r['d2'])
        dz = np.where(r['lvl'] < .2, 1.0, 0.0)
        return self.st(pos, lvl, lum, [.92, 1.0, .40], dz)

    def char_state(self, rig, pos, f, col_out, col_fill, sc, rgname, t):
        r = self.r[rgname]
        lum = np.where(rig.out, .52, .19) * f * (.78 + .22 * np.sin(r['w2'] * 5 * t + r['p2']))
        lum *= (.6 + .8 * r['d3'] ** 2)
        lvl = np.where(rig.out, .15 + .75 * r['d1'], .5 + 1.0 * r['d1'])
        col = np.where(rig.out[:, None], col_out, col_fill)
        if sc < .9:
            lum = lum * sc ** .9 * 1.15; lvl = lvl * (.6 + .4 * c01((sc - .32) / .5))
        elif sc > 1.1:
            lum = lum * 1.35; lvl = lvl + .2
        return self.st(pos, lvl, lum, col, 0.0)

    # meadow
    def fireflies_A(self, t):
        f = self.D_f; r = self.r['D']
        x = f['x'] + 34 * np.sin(r['w1'] * t + r['p1']) + 14 * np.sin(2.3 * r['w2'] * t + r['p3'])
        y = f['y'] + 22 * np.sin(r['w2'] * t + r['p2']) - 6 * t * (f['dz'] > 0)
        blink = .07 + 1.05 * pulse(t * r['rate'] + r['p4'] / 6.28, .10)
        return self.st(np.stack([x, y], 1), f['lvl'], f['lum'] * blink, f['col'], f['dz'])

    def grass_A(self, t):
        b = self.W_b; s = b['s']
        sway = .09 * np.sin(1.2 * t + b['x'] / 170 + b['ph']) + .04 * np.sin(2.7 * t + b['x'] / 60)
        tipx = (b['lean'] + sway) * b['h']
        x = b['x'] + tipx * s ** 1.6; y = b['y'] - b['h'] * s
        band = b['band']
        lvl = np.where(band == 0, 1.5, np.where(band == 1, .55 + .5 * s, 2.7 + .9 * self.r['W']['d1']))
        lum = np.where(band == 0, .14, .2) * (.35 + .65 * s ** 1.5)
        dz = np.where(band == 2, 1.0, np.where(band == 0, -.5, 0.0))
        col = np.array([.32, .62, .20])[None] * (1 - s[:, None]) + np.array([.62, .88, .30])[None] * s[:, None]
        return self.st(np.stack([x, y], 1), lvl, lum, col, dz)

    def small_A(self, t):
        f = self.X_f; r = self.r['X']
        x = f['x'] + 16 * np.sin(r['w1'] * .7 * t + r['p1']); y = f['y'] + 12 * np.sin(r['w2'] * .7 * t + r['p2'])
        blink = .12 + .95 * pulse(t * r['rate'] * .8 + r['p4'] / 6.28, .12)
        return self.st(np.stack([x, y], 1), f['lvl'], f['lum'] * blink, [.70, .95, .42], -1.0)

    def bokeh_A(self, t):
        f = self.B_f; r = self.r['B']
        x = f['x'] + 9 * t + 20 * np.sin(r['w1'] * .3 * t + r['p1']); y = f['y'] + 14 * np.sin(r['w2'] * .3 * t + r['p2'])
        lum = f['lum'] * (.6 + .4 * np.sin(r['w1'] * .8 * t + r['p3']))
        return self.st(np.stack([x, y], 1), f['lvl'], lum, f['col'], -1.0)

    # wide shot
    def ridge_B(self, t):
        f = self.ridge; r = self.r['W']
        y = f['y'] + np.where(f['crest'], 1.5 * np.sin(2 * t + r['p1']), 0)
        lum = f['lum'] * (.8 + .2 * np.sin(r['w1'] * 2 * t + r['p2'])) * (1 - .5 * sstep(T_CLOUD, T_PUSH, t))
        col = np.where(f['crest'][:, None], [.46, .74, .30], [.28, .55, .24])
        return self.st(np.stack([f['x'], y], 1), f['lvl'], lum, col, -.3)

    def sky_B(self, t):
        r = self.r['B']; nm = self.nMoon
        mx = self.moon['x'] + .6 * np.sin(t * 1.3 + r['p1'][:nm]); my = self.moon['y'] + .6 * np.sin(t * 1.1 + r['p2'][:nm])
        sx = self.stars['x'] - 4 * (t - T_FAR); sy = self.stars['y']; ns = len(sx)
        tw = .35 + .65 * (.5 + .5 * np.sin(r['w1'][nm:] * 4 * t + r['p3'][nm:]))
        pos = np.concatenate([np.stack([mx, my], 1), np.stack([sx, sy], 1)])
        lvl = np.concatenate([np.full(nm, 1.55), .05 + .3 * r['d1'][nm:]])
        lum = np.concatenate([self.moon['lum'] * (.9 + .1 * np.sin(t * 2 + r['p3'][:nm])), self.stars['lum'] * tw])
        col = np.concatenate([np.tile([1.0, .93, .74], (nm, 1)), np.tile([.80, .88, 1.0], (ns, 1))])
        return self.st(pos, lvl, lum, col, -1.0)

    def trail_B(self, t):
        r = self.r['X']; fx = far_x(t)
        q = r['d1']; tr = self.X_trail
        tx = fx - 60 - q * 760 + 16 * np.sin(r['w1'] * t + r['p1'])
        ty = ridge_y(fx) - 70 - q * 300 - 26 * r['d2'] * (.4 + q) + 45 * np.sin(q * 6.5 - t * 1.4) + 10 * np.sin(r['w2'] * t + r['p2'])
        mx = r['d2'] * W + 14 * np.sin(r['w1'] * .5 * t + r['p3']); my = 80 + r['d3'] * 520 + 12 * np.sin(r['w2'] * .5 * t + r['p4'])
        x = np.where(tr, tx, mx); y = np.where(tr, ty, my)
        blink = .3 + .7 * pulse(t * r['rate'] + r['p4'] / 6.28, .13)
        lum = np.where(tr, .42 * (1 - .7 * q), .08) * blink
        lvl = np.where(tr, .3 + 1.2 * r['d3'], 1.2)
        return self.st(np.stack([x, y], 1), lvl, lum, FIRE, np.where(tr, 0.0, -1.0))

    # storm
    def clouds(self, t):
        f = self.B_c; r = self.r['B']
        x = f['x'] - 55 * (t - T_CLOUD) + 25 * np.sin(r['w1'] * .4 * t + r['p1']); y = f['y'] + 10 * np.sin(r['w2'] * .4 * t + r['p2'])
        dim = 1 - .75 * sstep(T_TEAR, T_DRY + .3, t)
        lum = f['lum'] * (.75 + .25 * np.sin(r['w1'] * 1.1 * t + r['p3'])) * dim
        return self.st(np.stack([x, y], 1), f['lvl'], lum, [.40, .54, .50], -1.0)

    def rain(self, t):
        f = self.X_rain; r = self.r['X']; dt = t - T_RAIN
        x = np.mod(f['x'] + 300 - 640 * dt, 2600) - 300
        y = np.mod(f['y'] + 150 + 2300 * dt * (.85 + .3 * r['d1']), 1400) - 150
        amt = sstep(T_RAIN, T_RAIN + .7, t) * (1 - sstep(T_DRY - .4, T_DRY, t))
        lum = .085 * (.4 + .6 * r['d2']) * (.3 + .7 * amt)
        return self.st(np.stack([x, y], 1), .25 + .6 * r['d3'], lum, [.66, .82, .74], (r['d1'] - .5) * 1.2)

    def light_after(self, t, x, y):
        """Time the answering ripple reaches this position → (lit again 0..1, arrival flash)"""
        q = c01((y - 596) / 300.0)
        a = T_SYNC + 1.25 * q ** (1 / 1.5) + .22 * np.abs(x - GXM) / 1200
        on = sstep(a - .08, a + .3, t)
        fl = 2.0 * np.exp(-((t - a) / .11) ** 2)
        return on, fl

    def syncp(self, t):
        return sum(math.exp(-((t - P) / .11) ** 2) for P in SYNC_PULSES)

    def grass_S(self, t):
        b = self.W_s; s = b['s']; q = b['q']
        gust = .5 + .5 * math.sin(2.3 * t) * math.sin(.9 * t + 1)
        storm = 1 - .6 * sstep(T_DRY, T_DRY + 1.5, t)
        sway = storm * (.18 * np.sin(9 * t + b['x'] / 45 + b['ph']) * (.6 + .4 * gust)) + .05 * np.sin(1.3 * t + b['ph'])
        lean = b['lean'] * (storm * (.9 + .25 * gust) + (1 - storm) * .35)
        x = b['x'] + (lean + sway) * b['h'] * s ** 1.5; y = b['y'] - b['h'] * s * (1 - .25 * storm)
        lvl = .4 + 2.8 * q ** 2.2 + .3 * s
        on, fl = self.light_after(t, b['x'], b['y'] - 280 * (1 - q))
        base = .8 - .65 * sstep(T_TEAR, T_DRY, t)
        light = base + (1 - base) * on * (t > T_SYNC - .1) + .7 * fl * (t > T_SYNC - .1) + .5 * self.syncp(t)
        lum = .17 * (.35 + .65 * s ** 1.5) * light
        col = np.array([.30, .58, .22])[None] * (1 - s[:, None]) + np.array([.58, .84, .30])[None] * s[:, None]
        return self.st(np.stack([x, y], 1), lvl, lum, col, -.5 + 1.4 * q)

    def embers(self, t):
        f = self.D_e; r = self.r['D']
        x = f['x'] + 6 * np.sin(r['w1'] * .5 * t + r['p1']); y = f['y'] + 3 * np.sin(r['w2'] * .5 * t + r['p2'])
        on, fl = self.light_after(t - f['da'], f['x'], 596 + 300 * .85 + 0 * f['y'])
        on = on * (t > T_SYNC - .1); fl = fl * (t > T_SYNC - .1)
        blink = .25 + .9 * pulse(t * r['rate'] + r['p4'] / 6.28, .12)
        lum = .012 + on * (.17 * blink + .3 * self.syncp(t)) + .3 * fl
        return self.st(np.stack([x, y], 1), .5 + .9 * r['d1'], lum, LIME, .4)

    def answer(self, t):
        f = self.X_ans; r = self.r['X']; n = self.nX
        x = f['x'] + 12 * np.sin(r['w1'] * .6 * t + r['p1']); y = f['y'] + 6 * np.sin(r['w2'] * .6 * t + r['p2'])
        a = self.X_arr
        on = sstep(a - .08, a + .3, t); fl = 2.2 * np.exp(-((t - a) / .11) ** 2)
        lum = f['b'] * (on * (.16 + .1 * pulse(t * r['rate'] + r['p4'] / 6.28, .14) + 1.25 * self.syncp(t)) + fl)
        lum = lum * (t > T_SYNC - .1) * (1 - .45 * sstep(T_GIANT - .3, T_GIANT + .5, t))
        one = np.zeros(n)
        for k, i in enumerate(self.ans1):
            for P in (T_ANS1, T_ANS1 + .85):
                one[i] += 1.4 * math.exp(-((t - P) / .1) ** 2)
            one[i] += .25 * float(sstep(T_ANS1, T_ANS1 + .1, t))
        for k, i in enumerate(self.ans5):
            P0 = T_ANS2 + (.0, .07, .13, .2, .27)[k]
            one[i] += 1.2 * math.exp(-((t - P0) / .1) ** 2) + .2 * float(sstep(P0, P0 + .1, t))
        lum = np.where(t < a + .12, np.maximum(lum, one * f['b'] * 2.2), lum)
        return self.st(np.stack([x, y], 1), f['lvl'], lum, FIRE, -1.0 + 1.6 * f['q'])

    # ending
    def hill_E(self, t):
        f = self.hill; r = self.r['W']
        y = f['y'] + np.where(f['crest'], 1.2 * np.sin(2 * t + r['p1']), 0)
        lum = f['lum'] * (.82 + .18 * np.sin(r['w1'] * 2 * t + r['p2']))
        col = np.where(f['crest'][:, None], [.46, .74, .30], [.28, .55, .24])
        return self.st(np.stack([f['x'], y], 1), f['lvl'], lum, col, -.2)

    def stars_E(self, t):
        f = self.B_end; r = self.r['B']
        tw = .4 + .6 * (.5 + .5 * np.sin(r['w1'] * 3.5 * t + r['p3']))
        return self.st(np.stack([f['x'] - 3 * (t - T_LEAP), f['y']], 1), .05 + .3 * r['d1'], f['lum'] * tw, [.86, .90, 1.0], -1.0)

    def path_E(self, t, eyeS):
        """A ribbon of fireflies rising from the girl's hand to the deer constellation."""
        r = self.r['X']
        A = self.hand_hill + np.array([0, -14.0]); C = eyeS + np.array([-40.0, 60]); Bc = np.array([(A[0] + C[0]) / 2 - 160, min(A[1], C[1]) - 180])
        s = np.mod(r['d1'] + .055 * (t - T_LEAP), 1.0)
        ss = s[:, None]
        p = (1 - ss) ** 2 * A + 2 * (1 - ss) * ss * Bc + ss * ss * C
        wid = 10 + 70 * np.sin(math.pi * s) * (.4 + .6 * r['d2'])
        p = p + np.stack([r['lat'] * wid * .7 + 14 * np.sin(r['w1'] * t + r['p1']), r['lat'] * wid * .3 + 12 * np.sin(r['w2'] * t + r['p2'])], 1)
        blink = .3 + .8 * pulse(t * r['rate'] + r['p4'] / 6.28, .13)
        lum = .30 * np.sin(math.pi * s) ** 1.5 * blink
        return self.st(p, .3 + 1.1 * r['d3'], lum, FIRE, 0.0)

    def title_st(self, t):
        r = self.r['X']; n = self.nX; k = self.T_kind
        lum = np.choose(k.astype(int), [.40, .55, .50, .58]) * (.86 + .14 * np.sin(r['w1'][:self.iT] * 3 * t + r['p1'][:self.iT]))
        lum = lum * (1 + .7 * math.exp(-max(0.0, t - T_TITLE) / .3) * float(t > T_TITLE - .1))
        lvl = np.where(k == 0, .35 + .4 * r['d1'][:self.iT], .08 + .14 * r['d1'][:self.iT])
        pos = self.title + .25 * np.stack([np.sin(t * 1.7 + r['p2'][:self.iT]), np.cos(t * 1.3 + r['p3'][:self.iT])], 1)
        return self.st(pos, lvl, lum, [1.0, .90, .58], 0.0)

    # ---- transitions ---------------------------------------------------------
    @staticmethod
    def blend(a, b, u, r, ease=e_io, swirl=None, scatter=0.0, wind=(0, 0), lift=0.0, flare=.5, sub=None):
        if b is None: return a
        if sub is not None: r = {k: v[sub] for k, v in r.items()}
        e = ease(u); bump = np.sin(math.pi * u)
        pos = a['pos'] + (b['pos'] - a['pos']) * e[:, None]
        if swirl is not None:
            c, amp = swirl; aa = amp * bump * (.7 + .6 * r['mag'])
            ca, sa = np.cos(aa), np.sin(aa); d = pos - c
            pos = c + np.stack([ca * d[:, 0] - sa * d[:, 1], sa * d[:, 0] + ca * d[:, 1]], 1)
        if scatter:
            th = r['ang'] + 2.6 * u
            pos = pos + scatter * (r['mag'][:, None] ** .7) * bump[:, None] * np.stack([np.cos(th), np.sin(th)], 1)
        pos = pos + np.array(wind)[None] * (bump * (.6 + .8 * r['d2']))[:, None]
        if lift: pos[:, 1] -= lift * bump * (.7 + .6 * r['d1'])
        out = dict(pos=pos)
        for k in ('lvl', 'dz'): out[k] = a[k] + (b[k] - a[k]) * e
        out['lum'] = (a['lum'] + (b['lum'] - a['lum']) * e) * (1 + flare * bump)
        out['col'] = a['col'] + (b['col'] - a['col']) * e[:, None]
        return out

    @staticmethod
    def sub(s, idx):
        return {k: v[idx] for k, v in s.items()}

    @staticmethod
    def put(s, idx, part):
        for k in s: s[k][idx] = part[k]
        return s

    # ---- all points of one frame --------------------------------------------------
    def evaluate(self, t):
        G, D = self.girl, self.deer
        rG, rD, rW, rX, rB = (self.r[k] for k in 'GDWXB')
        u_land = lambda r: c01((t - (.08 + .62 * r['s'] + .12 * r['d3'])) / .62)
        sx_ = lambda pos, ox=0: c01((pos[:, 0] - ox) / W)
        groups = []; ctx = {}
        # ------------ character geometry
        A_on = t < T_GUST + 1.1
        F_on = T_GUST - .05 <= t < T_PUSH + 1.2
        M_on = T_PUSH - .05 <= t < T_TEAR + 1.4
        C_on = T_FALL - .05 <= t < T_LEAP + 1.3
        Gi_on = T_GIANT0 - .05 <= t < T_LEAP + 1.4
        E_on = t >= T_LEAP - .05
        if A_on:
            gA = girl_geom(girl_pose_meadow(t)); gxfA = ((1250.0, GROUND), -1.0, 1.0)
            dpA, dxA = deer_pose_A(t); dgA = deer_geom(dpA); dxfA = ((dxA, GROUND), 1.0, 1.0)
            ctx['handA'] = to_world(gxfA, gA['hand_n'][1]); ctx['eyeA'] = to_world(dxfA, dpA['_eye'])
            ctx['snoutA'] = to_world(dxfA, dpA['_snout']); ctx['backA'] = to_world(dxfA, dpA['_back']); ctx['cenA'] = np.array([dxA, GROUND - 330.0])
            if t >= T_HOP - .05:
                gR = girl_geom(girl_pose_ride(t, dpA['ph'], dpA['amt']))
                gxfR = ((ctx['backA'][0], ctx['backA'][1] + 140.0), 1.0, 1.0)
                girlR_w, girlR_f = G.eval(gR, gxfR, others=[(D, dgA, dxfA, 0, 1)], zoff=10, rid=0)
                deerA_w, deerA_f = D.eval(dgA, dxfA, others=[(G, gR, gxfR, 10, 0)], zoff=0, rid=1)
            else:
                deerA_w, deerA_f = D.eval(dgA, dxfA, others=[(G, gA, gxfA, 10, 0)], zoff=0, rid=1)
            girlS_w, girlS_f = G.eval(gA, gxfA, others=[], zoff=10, rid=0)
        if F_on:
            dpB, dxB = deer_pose_B(t); dgB = deer_geom(dpB); dxfB = ((dxB, float(ridge_y(dxB)) + 4), 1.0, FAR_SC)
            bk = to_world(dxfB, dpB['_back']); gB = girl_geom(girl_pose_ride(t, dpB['ph'], dpB['amt'])); gxfB = ((bk[0], bk[1] + FAR_SC * 140), 1.0, FAR_SC)
            girlB_w, girlB_f = G.eval(gB, gxfB, others=[(D, dgB, dxfB, 0, 1)], zoff=10, rid=0)
            deerB_w, deerB_f = D.eval(dgB, dxfB, others=[(G, gB, gxfB, 10, 0)], zoff=0, rid=1)
            ctx['eyeB'] = to_world(dxfB, dpB['_eye'])
        if M_on:
            dpM, dxM = deer_pose_M(t); dgM = deer_geom(dpM); dxfM = ((dxM, GROUND), 1.0, MED_SC)
            bk = to_world(dxfM, dpM['_back']); gM = girl_geom(girl_pose_rideM(t, dpM['ph'], dpM['amt'])); gxfM = ((bk[0], bk[1] + MED_SC * 140), 1.0, MED_SC)
            girlM_w, girlM_f = G.eval(gM, gxfM, others=[(D, dgM, dxfM, 0, 1)], zoff=10, rid=0)
            deerM_w, deerM_f = D.eval(dgM, dxfM, others=[(G, gM, gxfM, 10, 0)], zoff=0, rid=1)
            ctx['eyeM'] = to_world(dxfM, dpM['_eye'])
        if C_on:
            gC = girl_geom(girl_pose_C(t)); gxfC = ((GXM, GROUND), -1.0, MED_SC)
            girlC_w, girlC_f = G.eval(gC, gxfC, others=[], zoff=10, rid=0)
            ctx['handC'] = to_world(gxfC, gC['hand_n'][1]); ctx['handCf'] = to_world(gxfC, gC['hand_f'][1])
        if Gi_on:
            dpG = deer_pose_G(t, self.bow); dgG = deer_geom(dpG); dxfG = ((self.GX, GROUND), 1.0, GIANT_SC)
            deerG_w, deerG_f = D.eval(dgG, dxfG, others=[], zoff=0, rid=1)
            ctx['snoutG'] = to_world(dxfG, dpG['_snout']); ctx['eyeG'] = to_world(dxfG, dpG['_eye']); ctx['cenG'] = np.array([self.GX, GROUND - GIANT_SC * 330])
        if E_on:
            dpS, dxS = deer_pose_S(t); dgS = deer_geom(dpS); dxfS = ((dxS, SKY_G), 1.0, SKY_SC)
            deerS_w, deerS_f = D.eval(dgS, dxfS, others=[], zoff=0, rid=1)
            gH = girl_geom(girl_pose_hill(t)); gxfH = ((HX, float(hill_y(HX)) + 3), 1.0, .42)
            girlH_w, girlH_f = G.eval(gH, gxfH, others=[], zoff=10, rid=0)
            ctx['handH'] = to_world(gxfH, gH['hand_n'][1]); self.hand_hill = ctx['handH']
            ctx['eyeS'] = to_world(dxfS, dpS['_eye'])

        wind_u = lambda r, pos, t0, dur, spread, frac_fn: c01((t - t0 - (spread * frac_fn(pos) + .08 * r['d3'])) / dur)
        L2R = lambda pos: c01((pos[:, 0] - (430 if t < T_GUST + 1.2 else 0)) / W)
        R2L = lambda pos: 1 - c01(pos[:, 0] / W)

        # ---------------- girl
        s = self.stream('G', t)
        if A_on or t < T_GUST + 1.1:
            s = self.blend(s, self.char_state(G, girlS_w, girlS_f, AMB, AMBF, 1.0, 'G', t), u_land(rG), rG, ease=e_out, flare=.3)
            if t >= T_HOP:
                u = c01((t - T_HOP - .12 * rG['d2']) / .4)
                s = self.blend(s, self.char_state(G, girlR_w, girlR_f, AMB, AMBF, 1.0, 'G', t), u, rG, scatter=70, lift=170, flare=1.2)
        if F_on and t >= T_GUST - .05:
            fb = self.char_state(G, girlB_w, girlB_f, AMB, AMBF, FAR_SC, 'G', t)
            s = fb if not A_on else self.blend(s, fb, wind_u(rG, s['pos'], T_GUST, .62, .30, L2R), rG, scatter=110, wind=(820, -70), flare=.8)
        if M_on and t >= T_PUSH - .05:
            mb = self.char_state(G, girlM_w, girlM_f, AMB, AMBF, MED_SC, 'G', t)
            s = mb if not F_on else self.blend(s, mb, wind_u(rG, s['pos'], T_PUSH, .8, .28, R2L), rG, scatter=80, wind=(-380, -40), flare=.6)
        if C_on and t >= T_FALL - .05:
            cb = self.char_state(G, girlC_w, girlC_f, AMB, AMBF, MED_SC, 'G', t)
            dim = 1 - .5 * sstep(T_TEAR + .3, T_DRY, t) * (1 - sstep(T_LEADIN - .3, T_RAISE1, t))
            cb['lum'] = cb['lum'] * dim
            if M_on:
                u = c01((t - T_FALL - .1 * rG['d2']) / .5)
                s = self.blend(s, cb, u, rG, ease=e_out, scatter=45, lift=60, wind=(-160, 0), flare=.5)
            else: s = cb
        if E_on:
            hb = self.char_state(G, girlH_w, girlH_f, AMB, AMBF, .42, 'G', t)
            u = c01((t - T_LEAP - .1 - .12 * rG['d2']) / .85)
            s = self.blend(s, hb, u, rG, scatter=60, lift=140, flare=.9) if t < T_LEAP + 1.3 else hb
        groups.append(s)

        # ---------------- fireflies → deer → embers → giant deer → deer constellation
        s = self.stream('D', t)
        if t < T_GUST + 1.1:
            s = self.blend(s, self.fireflies_A(t), u_land(rD), rD, ease=e_out, flare=.3)
            if t >= T_RISE:
                deerS = self.char_state(D, deerA_w, deerA_f, LIME, LIMEF, 1.0, 'D', t)
                deerS['lum'] *= 1 + 1.1 * np.exp(-max(0, t - T_DEER) / .18) * (t >= T_DEER - .05)
                u = c01((t - T_RISE - .38 * rD['d2']) / .57)
                s = self.blend(s, deerS, u, rD, swirl=(ctx['cenA'], 1.55), scatter=90, flare=.9)
        if F_on and t >= T_GUST - .05:
            fb = self.char_state(D, deerB_w, deerB_f, LIME, LIMEF, FAR_SC, 'D', t)
            s = fb if not A_on else self.blend(s, fb, wind_u(rD, s['pos'], T_GUST, .62, .30, L2R), rD, scatter=110, wind=(820, -70), flare=.8)
        if M_on and t >= T_PUSH - .05:
            mb = self.char_state(D, deerM_w, deerM_f, LIME, LIMEF, MED_SC, 'D', t)
            s = mb if not F_on else self.blend(s, mb, wind_u(rD, s['pos'], T_PUSH, .8, .28, R2L), rD, scatter=80, wind=(-380, -40), flare=.6)
        if t >= T_TEAR:
            eb = self.embers(t)
            if M_on:
                u = c01((t - T_TEAR - (.35 * R2L(s['pos']) + .1 * rD['d3'])) / 1.15)
                s = self.blend(s, eb, u, rD, scatter=150, wind=(-1250, -110), flare=.7)
            else: s = eb
        if Gi_on and t >= T_GIANT0:
            gb = self.char_state(D, deerG_w, deerG_f, LIME, LIMEF, GIANT_SC, 'D', t)
            gb['lum'] *= (1 + 1.3 * np.exp(-max(0, t - T_GIANT) / .25) * (t >= T_GIANT - .05)) * (1 + .35 * self.syncp(t))
            u = c01((t - T_GIANT0 - .5 * rD['d2']) / 1.05)
            s = self.blend(s, gb, u, rD, swirl=(ctx['cenG'], 1.25), scatter=150, flare=1.0)
        if E_on:
            sb = self.char_state(D, deerS_w, deerS_f, [.92, 1.0, .74], [.80, .95, .62], 1.0, 'D', t)
            sb['lvl'] = .04 + .22 * rD['d1']; sb['lum'] = sb['lum'] * np.where(D.out, 1.0, .55) * 1.05
            if t < T_LEAP + FLIGHT:      # the whole giant deer leaps: the same skeleton flies up along an arc, shrinking into star points as it goes
                u = float(e_io((t - T_LEAP) / FLIGHT)) if t > T_LEAP else 0.0; bmp = math.sin(math.pi * u)
                pG = {k: v for k, v in deer_pose_G(t, self.bow).items()}; pS = {k: v for k, v in deer_pose_S(t)[0].items()}
                pf = pmix(pmix(pG, pS, u), P_LEAP, bmp)
                gf = deer_geom(pf)
                xf = ((self.GX + (sky_x(t) - self.GX) * u, GROUND + (SKY_G - GROUND) * u - 60 * bmp), 1.0, GIANT_SC + (SKY_SC - GIANT_SC) * u)
                fw, ff = D.eval(gf, xf, others=[], zoff=0, rid=1)
                fa = self.char_state(D, fw, ff, LIME, LIMEF, GIANT_SC, 'D', t)
                s = dict(pos=fw, dz=fa['dz'], lvl=fa['lvl'] + (sb['lvl'] - fa['lvl']) * u, col=fa['col'] + (sb['col'] - fa['col']) * u,
                         lum=(fa['lum'] + (sb['lum'] - fa['lum']) * u) * (1 + .5 * bmp))
            else: s = sb
        groups.append(s)

        # ---------------- grass → ridge → grass in the storm → hills
        s = self.stream('W', t)
        if t < T_GUST + 1.1:
            s = self.blend(s, self.grass_A(t), u_land(rW), rW, ease=e_out, flare=.2)
        if F_on and t >= T_GUST - .05:
            fb = self.ridge_B(t)
            s = fb if not A_on else self.blend(s, fb, wind_u(rW, s['pos'], T_GUST, .62, .30, L2R), rW, scatter=90, wind=(900, -40), flare=.6)
        if t >= T_PUSH - .05 and t < T_LEAP + 1.4:
            mb = self.grass_S(t)
            s = mb if not F_on else self.blend(s, mb, wind_u(rW, s['pos'], T_PUSH, .8, .28, R2L), rW, scatter=70, wind=(-380, -30), flare=.4)
        if E_on:
            hb = self.hill_E(t)
            u = c01((t - T_LEAP - .3 * c01(s['pos'][:, 0] / W) - .1 * rW['d3']) / .9) if t < T_LEAP + 1.4 else np.ones(self.nW)
            s = self.blend(s, hb, u, rW, scatter=60, flare=.5) if t < T_LEAP + 1.4 else hb
        groups.append(s)

        # ---------------- small fireflies → trails → rain → answers → ribbon → title
        s = self.stream('X', t)
        if t < T_GUST + 1.1:
            s = self.blend(s, self.small_A(t), u_land(rX), rX, ease=e_out, flare=.2)
            if SIGN and t >= T_SIGN0:
                i = self.i_cr; sg = self.st(self.sign + .2 * np.stack([np.sin(t * 1.7 + rX['p2'][i]), np.cos(t * 1.3 + rX['p3'][i])], 1),
                                            .08 + .14 * rX['d1'][i], .58 * (1 + .6 * math.exp(-max(0.0, t - T_SIGN) / .3) * float(t > T_SIGN - .1)), [1.0, .90, .58], 0.0)
                u = c01((t - T_SIGN0 - .25 * rX['d2'][i]) / .35)
                part = self.blend(self.sub(s, i), sg, u, rX, swirl=(np.array([450.0, 190]), .9), scatter=60, flare=1.0, sub=i)
                s = self.put(s, i, part)
        if F_on and t >= T_GUST - .05:
            fb = self.trail_B(t)
            s = fb if not A_on else self.blend(s, fb, wind_u(rX, s['pos'], T_GUST, .62, .30, L2R), rX, scatter=120, wind=(900, -90), flare=.7)
        if T_RAIN <= t < T_DRY + .6:
            rb = self.rain(t)
            u = c01((t - T_RAIN - .5 * rX['d2']) / .7)
            s = self.blend(s, rb, u, rX, flare=.0) if t < T_RAIN + 1.3 else rb
        if T_DRY - .05 <= t < T_LEAP + 1.4:
            ab = self.answer(t)
            if t < T_DRY + .6:
                u = c01((t - T_DRY - .15 * rX['d2']) / .4)
                ab_ = dict(ab); ab_['lum'] = ab['lum'] * 0
                s = self.blend(s, ab_, u, rX, ease=e_out, flare=0)
            else: s = ab
        if E_on:
            pb = self.path_E(t, ctx['eyeS'])
            u = c01((t - T_LEAP - .3 * rX['d2']) / 1.0)
            s = self.blend(s, pb, u, rX, scatter=100, lift=220, flare=.6) if t < T_LEAP + 1.4 else pb
            if t >= T_TITLE0:
                i = np.arange(self.iT)
                tb = self.title_st(t)
                late = np.isin(i, self.i_cr) | (self.T_kind == 2)
                t0 = np.where(late, T_CRED0, T_TITLE0); dur = np.where(late, .55, .62)
                u = c01((t - t0 - .3 * rX['d2'][i]) / dur)
                part = self.blend(self.sub(s, i), tb, u, rX, swirl=(np.array([560.0, 330]), 1.0), scatter=110, flare=1.0, sub=i)
                s = self.put(s, i, part)
        groups.append(s)

        # ---------------- bokeh → moon and stars → storm clouds → starry sky
        s = self.stream('B', t)
        if t < T_GUST + 1.1:
            s = self.blend(s, self.bokeh_A(t), u_land(rB), rB, ease=e_out, flare=.1)
        if F_on and t >= T_GUST - .05:
            fb = self.sky_B(t)
            s = fb if not A_on else self.blend(s, fb, wind_u(rB, s['pos'], T_GUST, .62, .30, L2R), rB, scatter=100, wind=(800, -60), flare=.5)
        if T_CLOUD <= t < T_LEAP + 1.6:
            cb = self.clouds(t)
            if t < T_CLOUD + 2.0:
                u = c01((t - T_CLOUD - (.5 * R2L(s['pos']) + .3 * rB['d3'])) / 1.1)
                s = self.blend(s, cb, u, rB, scatter=60, wind=(-200, 0), flare=-.3)
            else: s = cb
        if E_on:
            eb = self.stars_E(t)
            u = c01((t - T_LEAP - .5 * rB['d2']) / 1.1)
            s = self.blend(s, eb, u, rB, scatter=40, flare=.2) if t < T_LEAP + 1.7 else eb
        groups.append(s)

        # ---------------- synchronised flash ripple (meadow: spreads from the fingertip; then the whole field at the same instant)
        if 'handA' in ctx and T_RIP - .2 < t < T_ALL + .6:
            src = ctx['handA']
            for gi in (1, 2, 3):
                d = np.linalg.norm(groups[gi]['pos'] - src, axis=1)
                k = 1 + 2.6 * np.exp(-((t - T_RIP - d / 900) / .09) ** 2) + 2.2 * math.exp(-((t - T_ALL) / .08) ** 2)
                groups[gi]['lum'] = groups[gi]['lum'] * k

        groups.append(self.lead(t, ctx, rD))
        groups.append(self.flashes(t, ctx))
        return {k: np.concatenate([g_[k] for g_ in groups]) for k in ('pos', 'lvl', 'lum', 'col', 'dz')}

    # ---- the guiding firefly: the brightest one in the film -----------------------------------------
    def lead(self, t, ctx, r):
        start = np.array([1150.0, 70.0]); lum = 2.2; pos = start
        Q = lambda T0: 2.6 * math.exp(-((t - T0) / .07) ** 2)
        if t < 1.6: return self.st(np.array([start, start]), [.1, 2.6], [0.0, 0.0], [1.0, 1.0, .55], 0.0)
        if t < T_CATCH:
            u = (t - 1.6) / (T_CATCH - 1.6); e = e_io(u); hw = ctx['handA'] + [0, -10]
            pos = start + (hw - start) * e + np.array([60 * math.sin(6 * u) * (1 - u), 0]); lum = 2.2 * float(sstep(1.6, 1.9, t))
        elif t < T_RISE:
            pos = ctx['handA'] + np.array([2 * math.sin(t * 9), -10 + 3 * math.sin(t * 6)])
            lum = 1.6 + 2.6 * math.exp(-((t - T_CATCH) / .1) ** 2) + Q(T_Q1) * 1.5 + Q(T_Q2) * 1.5 + 1.2 * math.exp(-((t - T_RIP) / .1) ** 2)
        elif t < T_GUST:
            u = float(c01((t - T_RISE) / 1.0)); e = e_io(u); a = ctx['handA'] + [0, -10]
            pos = a + (ctx['eyeA'] - a) * e + np.array([0, -260 * math.sin(math.pi * u)]); lum = 2.0 - .5 * e
        elif t < T_PUSH:
            u2 = float(c01((t - T_GUST - .3 * c01((ctx.get('eyeA', ctx['eyeB'])[0] - 430) / W)) / .62)); e2 = e_io(u2)
            a = ctx['eyeA'] if 'eyeA' in ctx else ctx['eyeB']
            pos = a + (ctx['eyeB'] - a) * e2 + np.array([700, -60]) * math.sin(math.pi * u2); lum = 1.5 - .6 * e2
        elif t < T_TEAR + .05:
            u = float(c01((t - T_PUSH) / .8)); e = e_io(u)
            a = ctx['eyeB'] if 'eyeB' in ctx else ctx['eyeM']
            pos = a + (ctx['eyeM'] - a) * e + np.array([-300, -40]) * math.sin(math.pi * u); lum = .9 + .5 * e
        elif t < T_LEADBACK:
            e0 = self._eyeM_tear
            u = float(c01((t - T_TEAR - .05) / 1.6)); e = e_out(u)
            g = np.array([e0[0] - 150, GROUND - 6.0])
            pos = e0 + (g - e0) * e + np.array([28 * math.sin(7 * u) * (1 - u), 0]); lum = 1.4 * (1 - e) + .05 * e
        elif t < T_LEADIN:
            g = np.array([self._eyeM_tear[0] - 150, GROUND - 6.0]); h = (ctx['handC'] + ctx['handCf']) / 2 + [0, -8]
            u = float(c01((t - T_LEADBACK) / (T_LEADIN - T_LEADBACK))); e = e_io(u)
            pos = g + (h - g) * e + np.array([34 * math.sin(5 * u) * (1 - u), -90 * math.sin(math.pi * u)])
            lum = .05 + 1.45 * float(sstep(T_LEADBACK, T_LEADBACK + .6, t))
        elif t < T_LEAP:
            w = float(sstep(T_LEADIN, T_STAND0 + .3, t))
            h = (ctx['handC'] + ctx['handCf']) / 2 * (1 - w) + ctx['handC'] * w + [0, -10]
            rise = LIFT_LIGHT * float(sstep(T_BOW0 + .2, T_TOUCH2 - .05, t) * (1 - sstep(40.15, 40.85, t)))
            pos = h + np.array([1.5 * math.sin(t * 9), 2 * math.sin(t * 6) - rise])
            lum = 1.5 + .4 * float(sstep(T_RAISE0, T_RAISE1, t)) + Q(T_ASK) * 2.4 + Q(T_TOUCH2) * 1.6
        else:
            u = float(c01((t - T_LEAP - .1) / .85)); e = e_io(u); a = ctx['handC'] + [0, -10] if 'handC' in ctx else ctx['handH']
            pos = a + (ctx['handH'] + [0, -8] - a) * e + np.array([0, -140 * math.sin(math.pi * u)])
            lum = 1.6 - .3 * e + Q(T_GBLINK) * 2.2
        halo = .5 * float(sstep(T_LEADBACK, T_LEADBACK + .7, t) * (1 - sstep(T_LEAP + .5, T_HILL, t)))
        return self.st(np.array([pos, pos]), [.1, 2.6], [lum, halo], [1.0, 1.0, .55], 0.0)

    def flashes(self, t, ctx):
        """A fixed number of flash slots (motion blur evaluates at t ± shutter twice and needs the same particle count); slots not in use have brightness 0."""
        Z = np.zeros(2); ev = []
        A = 'handA' in ctx; hw = ctx['handA'] + [0, -10] if A else Z
        ev += [(T_CATCH, hw, 8 * A, .3, 3.2, [1, .95, .5]), (T_Q1, hw, 6 * A, .18, 3.4, [1, .95, .5]), (T_Q2, hw, 6 * A, .18, 3.4, [1, .95, .5]),
               (T_DEER, ctx['cenA'] if A else Z, 13 * A, .25, 4.0, [.8, 1, .5]), (T_TOUCH, (ctx['snoutA'] + hw) / 2 if A else Z, 14 * A, .4, 3.4, [1, .9, .55]),
               (T_HOPLAND, ctx['backA'] + [0, -120] if A else Z, 9 * A, .3, 3.4, [1, .8, .45])]
        Cc = 'handC' in ctx; hc = ctx['handC'] + [0, -10] if Cc else Z
        ev += [(T_ASK, hc, 16 * Cc, .45, 3.6, [1, .92, .55])]
        Gg = 'snoutG' in ctx
        ev += [(T_GIANT, ctx['cenG'] if Gg else Z, 22 * Gg, .35, 4.0, [.8, 1, .5]), (T_TOUCH2, self.hand_raise + [0, 4 - LIFT_LIGHT], 18 * Gg, .5, 3.6, [1, .92, .55])]
        for k, i in enumerate(np.concatenate([self.ans1, self.ans5])):      # the first distant answers: each point has a small halo
            p = np.array([self.X_ans['x'][i], self.X_ans['y'][i]])
            t0 = T_ANS1 if k == 0 else T_ANS2 + (.0, .07, .13, .2, .27)[k - 1]
            ev += [(t0, p, 2.2 if k == 0 else 1.4, .25, 2.4, [.9, 1, .5])]
            if k == 0: ev += [(T_ANS1 + .85, p, 1.8, .25, 2.4, [.9, 1, .5])]
        Hh = 'handH' in ctx
        ev += [(T_GBLINK, ctx['handH'] + [0, -8] if Hh else Z, 10 * Hh, .35, 3.4, [1, .92, .55]), (T_DBLINK, ctx['eyeS'] if Hh else Z, 12 * Hh, .45, 3.4, [.9, 1, .7]),
               (T_TITLE, np.array([560.0, 280]), 9, .22, 4.0, [1, .9, .55])]
        P, L, V, C = [], [], [], []
        for (t0, p, amp, tau, lv, col) in ev:
            a = 0.0 if t < t0 - .08 else amp * (math.exp(-max(0.0, t - t0) / tau) * float(sstep(t0 - .08, t0, t)))
            P.append(p); L.append(lv); V.append(a); C.append(col)
        if True:               # eye of the deer constellation: a steady star that flashes when answered
            k = float(sstep(T_LEAP + .9, T_LEAP + 1.4, t)) * ('eyeS' in ctx)
            P.append(ctx.get('eyeS', np.zeros(2))); L.append(.05); V.append(k * (1.2 + 4.0 * math.exp(-((t - T_DBLINK) / .12) ** 2) + 1.5 * math.exp(-((t - T_DBLINK - .5) / .1) ** 2)))
            C.append([.95, 1, .8])
        return self.st(np.array(P, float), L, V, C, 0.0)


# ---------------------------------------------------------------- camera
def cam(t):
    z = key(t, [(0, 1.0), (1.6, 1.0), (12.4, 1.055), (13.6, 1.03), (15.0, 1.0), (21.7, 1.0), (22.5, 1.05), (25.6, 1.05), (28.4, 1.0),
                (33.45, 1.2), (34.2, 1.2), (35.9, .86), (41.0, .86), (42.25, 1.0), (DUR, 1.016)])
    ox = key(t, [(0, 0), (12.75, 0), (15.05, 430), (15.95, 0), (21.6, 45), (22.5, 0), (DUR, 0)])
    oy = key(t, [(0, 42), (34.2, 42), (35.9, 20), (41.0, 14), (42.25, 30), (DUR, 30)])
    sh = float(sstep(T_MED - .5, T_MED, t) * (1 - sstep(T_TEAR + .6, T_DRY, t)))
    ox += sh * (2.4 * math.sin(37 * t) + 1.5 * math.sin(23 * t + 1)); oy += sh * 2.0 * math.sin(29 * t + 2)
    return z, ox, oy


def to_screen(pos, dz, t):
    z, ox, oy = cam(t); k = 1 + .38 * dz
    C = np.array([980.0, 600.0])
    zz = 1 + (z - 1) * k
    return np.stack([C[0] + (pos[:, 0] - C[0] - ox * k) * zz, C[1] + (pos[:, 1] - C[1] - oy * k) * zz], 1)


# ---------------------------------------------------------------- subtitles (burned into the picture)
_SUBS = {}
def sub_layer(c):
    key_ = c['zh']
    if key_ not in _SUBS:
        f1 = ImageFont.truetype(FONT, 40); f2 = ImageFont.truetype(FONT, 28)
        img = Image.new('L', (W, 150), 0); d = ImageDraw.Draw(img)
        w1 = d.textlength(c['zh'], font=f1); d.text(((W - w1) / 2, 18), c['zh'], font=f1, fill=255)
        img2 = Image.new('L', (W, 150), 0); d2 = ImageDraw.Draw(img2)
        w2 = d2.textlength(c['en'], font=f2); d2.text(((W - w2) / 2, 78), c['en'], font=f2, fill=255)
        a1 = np.asarray(img, np.float32) / 255; a2 = np.asarray(img2, np.float32) / 255
        glow = np.asarray(Image.fromarray(((a1 + a2) * 255).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7)), np.float32) / 255
        col1 = np.array([240, 232, 204], np.float32) / 255; col2 = np.array([220, 212, 186], np.float32) / 255
        rgb = a1[..., None] * col1 + a2[..., None] * col2
        alpha = np.clip(a1 + .92 * a2, 0, 1)
        _SUBS[key_] = (rgb, alpha, glow)
    return _SUBS[key_]


SUB_Y = 930
def draw_subs(img, t):
    for c in TL.cues():
        if c['t0'] - .01 <= t <= c['t1'] + .01:
            fa = float(sstep(c['t0'], c['t0'] + .18, t) * (1 - sstep(c['t1'] - .18, c['t1'], t)))
            if fa <= 0: continue
            rgb, alpha, glow = sub_layer(c)
            reg = img[SUB_Y:SUB_Y + 150]
            reg = reg + (glow[..., None] * np.array([1.0, .9, .6], np.float32) * .07) * fa
            reg = reg * (1 - alpha[..., None] * fa) + rgb * alpha[..., None] * fa
            img[SUB_Y:SUB_Y + 150] = reg
    return img


# ---------------------------------------------------------------- render
MODEL = None
def get_model():
    global MODEL
    if MODEL is None:
        MODEL = Model()
        # position of the deer's eye at the moment it is torn apart (the guiding firefly falls from here)
        p, x = deer_pose_M(T_TEAR + .05); deer_geom(p); MODEL._eyeM_tear = to_world(((x, GROUND), 1.0, MED_SC), p['_eye'])
        p = girl_pose_hill(T_LEAP); g = girl_geom(p); MODEL.hand_hill = to_world(((HX, float(hill_y(HX)) + 3), 1.0, .42), g['hand_n'][1])
    return MODEL


def render(t, fi=0):
    M = get_model(); sh = .25 / FPS
    a = M.evaluate(t - sh); b = M.evaluate(t + sh)
    p0 = to_screen(a['pos'], a['dz'], t - sh); p1 = to_screen(b['pos'], b['dz'], t + sh)
    lvl = np.clip((a['lvl'] + b['lvl']) * .5, 0, 3.999); lum = np.maximum(0, (a['lum'] + b['lum']) * .5)
    col = (a['col'] + b['col']) * .5
    jump = np.linalg.norm(p1 - p0, axis=1) > 260          # rain and the ribbon wrap around at the edges: don't draw trails across the frame
    p0 = np.where(jump[:, None], p1, p0)
    keep = lum > 1e-4
    p0, p1, lvl, lum, col = p0[keep], p1[keep], lvl[keep], lum[keep], col[keep]
    L0 = np.floor(lvl).astype(int); fr = lvl - L0
    bufs = []
    for k in range(5):
        res = LV_RES[k]; h, w = H // res, W // res
        wk = np.where(L0 == k, 1 - fr, 0) + np.where(L0 + 1 == k, fr, 0)
        wk = wk + HALO * (np.where(np.minimum(L0 + 2, 4) == k, 1 - fr, 0) + np.where(np.minimum(L0 + 3, 4) == k, fr, 0))
        m = wk > 1e-5
        if not m.any(): bufs.append(None); continue
        q0, q1, ww, cc = p0[m] / res, p1[m] / res, (wk * lum)[m] * LV_GAIN[k] / (res * res), col[m]
        ln = np.linalg.norm(q1 - q0, axis=1); ns = np.clip(np.ceil(ln / 1.1), 1, 40).astype(int)
        rep = np.repeat(np.arange(len(ns)), ns)
        start = np.repeat(np.cumsum(ns) - ns, ns); j = np.arange(rep.size) - start
        f = (j + .5) / ns[rep]
        q = q0[rep] + (q1[rep] - q0[rep]) * f[:, None]
        bufs.append(splat(h, w, q[:, 0], q[:, 1], ww[rep] / ns[rep], cc[rep]))
    acc = None
    for k in (4, 3, 2):
        res = LV_RES[k]; s = LV_SIG[k] / res
        cur = gaussian_filter(bufs[k], (s, s, 0), truncate=2.6) if bufs[k] is not None else np.zeros((H // res, W // res, 3), np.float32)
        acc = cur if acc is None else cur + up2(acc)
    acc = up2(acc)
    if bufs[1] is not None: acc += gaussian_filter(bufs[1], (LV_SIG[1], LV_SIG[1], 0), truncate=2.6)
    if bufs[0] is not None: acc += gaussian_filter(bufs[0], (LV_SIG[0], LV_SIG[0], 0), truncate=2.8)
    lin = background() + acc * EXPO
    img = 1 - np.exp(-lin)
    img = np.power(np.clip(img, 0, 1), 1 / 2.2).astype(np.float32)
    img = draw_subs(img, t)
    G_, U = tiles(); rg = np.random.default_rng(fi * 31 + 5)
    k = fi % 4; ox, oy = int(rg.integers(0, 512)), int(rg.integers(0, 512))
    grain = tile_full(G_, k, ox, oy); dith = tile_full(U, (k + 1) % 4, oy, ox)
    lum_ = img.mean(2, keepdims=True)
    img = img + (grain[..., None] * .0045 * (.35 + .65 * (1 - lum_))) + (dith[..., None] - .5) / 255.0 * 1.3
    return (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)


def _work(fi):
    return fi, render(fi / FPS, fi).tobytes()


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'render'
    if cmd == 'still':
        sd = os.environ.get('STILLS', os.path.join(HERE, 'out', 'stills')); os.makedirs(sd, exist_ok=True)
        for ts in sys.argv[2:]:
            t = float(ts); fi = int(round(t * FPS))
            Image.fromarray(render(t, fi)).save(os.path.join(sd, 's_%05.2f.jpg' % t), quality=92)
            print('still', t, flush=True)
        return
    if cmd == 'png':                                  # python film.py png 38.0 out.png
        t = float(sys.argv[2]); Image.fromarray(render(t, int(round(t * FPS)))).save(sys.argv[3]); return
    if cmd == 'render':
        a, b = float(sys.argv[2]), float(sys.argv[3]); out = sys.argv[4]
        f0, f1 = int(round(a * FPS)), int(round(b * FPS))
        workers = int(os.environ.get('WORKERS', '2'))
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H),
                               '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                               '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
        import multiprocessing as mp
        with mp.get_context('fork').Pool(workers, initializer=get_model) as pool:
            for fi, buf in pool.imap(_work, range(f0, f1), chunksize=4):
                ff.stdin.write(buf)
                if fi % 120 == 0: print('frame', fi, '/', f1, flush=True)
        ff.stdin.close(); ff.wait()
        print('wrote', out)


if __name__ == '__main__':
    main()
