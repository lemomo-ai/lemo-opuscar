"""Firefly Pointillism engine:
helpers, skeleton → point binding (Rig), the girl's and the deer's skeletons, jittered-grid sampling of text, low-level functions of the five-level blur-pyramid renderer.
The story, the state functions and the camera are in film.py."""
import math
import numpy as np
from PIL import Image

W, H = 1920, 1080
SEED = 20261031

# ---------------------------------------------------------------- helpers
def c01(x): return np.clip(x, 0.0, 1.0)
def sstep(a, b, x):
    t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t)
def e_io(u): return u * u * u * (u * (u * 6 - 15) + 10)
def e_out(u): return 1 - (1 - u) ** 3
def key(t, ks):
    if t <= ks[0][0]: return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * e_io((t - t0) / (t1 - t0))
    return ks[-1][1]
def rotm(a):
    c, s = math.cos(a), math.sin(a); return np.array([[c, -s], [s, c]])
def rv(v, a):
    c, s = math.cos(a), math.sin(a); return np.array([c * v[0] - s * v[1], s * v[0] + c * v[1]])
def ang(a): return np.array([math.sin(a), -math.cos(a)])   # limb direction measured from "straight down" (positive = forward, +x)
def pulse(x, w=0.09):
    f = np.mod(x, 1.0) - 0.5; return np.exp(-(f * f) / (2 * w * w))


def integ(vfn, t, dt=1 / 600):
    """∫0^t v(s) ds, trapezoid rule, fixed step (deterministic)."""
    n = max(1, int(math.ceil(t / dt))); s = np.linspace(0, t, n + 1)
    v = np.array([vfn(x) for x in s]); return float(np.trapezoid(v, s))


# ---------------------------------------------------------------- skeleton → point binding
class Rig:
    """Parts: ('cap', A, B, ra, rb, dvec) tapered capsule / ('poly', O, X, Y, verts) polygon.
    Points are shared among parts by perimeter (outline points) and area (fill points) and stored as normalised local parameters, so they follow when the pose changes."""

    def __init__(self, geom_fn, rest, zmap, gmap, n_out, n_fill, rng, jit=0.05):
        self.geom_fn = geom_fn
        g = geom_fn(rest)
        self.names = list(g.keys())
        self.z = np.array([zmap.get(n, 1) for n in self.names], float)
        self.gain = np.array([gmap.get(n, 1.0) for n in self.names], float)
        per, area = [], []
        for n in self.names:
            e = g[n]
            if e[0] == 'cap':
                L = np.linalg.norm(e[2] - e[1]); ra, rb = e[3], e[4]
                per.append(2 * L + math.pi * (ra + rb)); area.append(L * (ra + rb) + math.pi * (ra * ra + rb * rb) / 2)
            else:
                v = np.asarray(e[4]); vv = np.roll(v, -1, 0)
                per.append(np.linalg.norm(vv - v, axis=1).sum())
                area.append(abs(np.sum(v[:, 0] * vv[:, 1] - vv[:, 0] * v[:, 1])) / 2)
        per, area = np.array(per), np.array(area)
        cnt_o = self._alloc(per * self.gain ** .5, n_out)
        cnt_f = self._alloc(area, n_fill)
        P, OUT, A1, A2, A3 = [], [], [], [], []
        for k, n in enumerate(self.names):
            e = g[n]
            for no, outline in ((cnt_o[k], True), (cnt_f[k], False)):
                if no == 0: continue
                if e[0] == 'cap':
                    L = np.linalg.norm(e[2] - e[1]); ra, rb = e[3], e[4]
                    if outline: wts = np.array([2 * L, math.pi * ra, math.pi * rb])
                    else: wts = np.array([L * (ra + rb), math.pi * ra * ra / 2, math.pi * rb * rb / 2])
                    wts = wts / wts.sum(); reg = rng.choice(3, no, p=wts)
                    u = rng.random(no); ee = np.zeros(no); vv = np.zeros(no)
                    if outline:
                        side = np.where(rng.random(no) < .5, -1.0, 1.0)
                        vv = side * (1 + rng.normal(0, jit, no))
                        phA = math.pi / 2 + rng.random(no) * math.pi
                        phB = -math.pi / 2 + rng.random(no) * math.pi
                        rr = 1 + rng.normal(0, jit, no)
                    else:
                        vv = rng.uniform(-1, 1, no)
                        phA = math.pi / 2 + rng.random(no) * math.pi
                        phB = -math.pi / 2 + rng.random(no) * math.pi
                        rr = np.sqrt(rng.random(no))
                    mA, mB = reg == 1, reg == 2
                    u[mA] = 0; ee[mA] = rr[mA] * np.cos(phA[mA]); vv[mA] = rr[mA] * np.sin(phA[mA])
                    u[mB] = 1; ee[mB] = rr[mB] * np.cos(phB[mB]); vv[mB] = rr[mB] * np.sin(phB[mB])
                    A1.append(u); A2.append(ee); A3.append(vv)
                else:
                    v = np.asarray(e[4], float); vv2 = np.roll(v, -1, 0)
                    if outline:
                        el = np.linalg.norm(vv2 - v, axis=1); ei = rng.choice(len(v), no, p=el / el.sum())
                        tt = rng.random(no); p = v[ei] + (vv2[ei] - v[ei]) * tt[:, None]
                        d = (vv2[ei] - v[ei]) / el[ei, None]; nrm = np.stack([-d[:, 1], d[:, 0]], 1)
                        p = p + nrm * rng.normal(0, 1.6, no)[:, None]
                    else:
                        lo, hi = v.min(0), v.max(0); pts = []
                        while sum(len(q) for q in pts) < no:
                            c = lo + (hi - lo) * rng.random((no * 3, 2)); pts.append(c[_inpoly(c, v)])
                        p = np.concatenate(pts)[:no]
                    A1.append(p[:, 0]); A2.append(p[:, 1]); A3.append(np.zeros(no))
                P.append(np.full(no, k)); OUT.append(np.full(no, outline))
        self.pidx = np.concatenate(P); self.out = np.concatenate(OUT)
        self.a1, self.a2, self.a3 = np.concatenate(A1), np.concatenate(A2), np.concatenate(A3)
        order = np.argsort(self.pidx, kind='stable')
        for nm in ('pidx', 'out', 'a1', 'a2', 'a3'): setattr(self, nm, getattr(self, nm)[order])
        self.n = len(self.pidx)
        self.slices = [np.nonzero(self.pidx == k)[0] for k in range(len(self.names))]
        self.pz = self.z[self.pidx]; self.pgain = self.gain[self.pidx]

    @staticmethod
    def _alloc(w, n):
        w = np.asarray(w, float); raw = w / w.sum() * n; c = np.floor(raw).astype(int)
        rem = n - c.sum(); c[np.argsort(-(raw - c))[:rem]] += 1; return c

    def local(self, g):
        out = np.zeros((self.n, 2))
        for k, nm in enumerate(self.names):
            ix = self.slices[k]
            if len(ix) == 0: continue
            e = g[nm]
            if e[0] == 'cap':
                A, B, ra, rb, dv = e[1], e[2], e[3], e[4], e[5]
                d = B - A; L = np.linalg.norm(d)
                d = (np.asarray(dv, float) if dv is not None else np.array([1.0, 0])) if L < 1e-6 else d / L
                nn = np.array([-d[1], d[0]])
                u, ee, vv = self.a1[ix], self.a2[ix], self.a3[ix]
                r = ra + (rb - ra) * u
                out[ix] = A + u[:, None] * (B - A) + r[:, None] * (ee[:, None] * d + vv[:, None] * nn)
            else:
                O, X, Y = e[1], e[2], e[3]
                out[ix] = O + self.a1[ix, None] * X + self.a2[ix, None] * Y
        return out

    def world_parts(self, g, xf, zoff=0.0, rid=0):
        pos, sx, sc = xf; parts = []
        def tw(p): return np.array([pos[0] + sx * sc * p[0], pos[1] - sc * p[1]])
        for k, nm in enumerate(self.names):
            e = g[nm]
            if e[0] == 'cap':
                parts.append(('cap', rid * 100 + k, self.z[k] + zoff, tw(e[1]), tw(e[2]), e[3] * sc, e[4] * sc))
            else:
                X = np.array([sx * sc * e[2][0], -sc * e[2][1]]); Y = np.array([sx * sc * e[3][0], -sc * e[3][1]])
                parts.append(('poly', rid * 100 + k, self.z[k] + zoff, tw(e[1]), X, Y, np.asarray(e[4], float), sc))
        return parts

    def eval(self, g, xf, others=(), zoff=0.0, rid=0):
        """→ world coordinates (n,2), brightness factors (n,) (outline points hidden by a nearer layer are dimmed, overlapping fill points share their brightness)"""
        pos, sx, sc = xf
        lp = self.local(g)
        wp = np.stack([pos[0] + sx * sc * lp[:, 0], pos[1] - sc * lp[:, 1]], 1)
        parts = self.world_parts(g, xf, zoff, rid)
        for (orig, og, oxf, oz, orid) in others:
            parts += orig.world_parts(og, oxf, oz, orid)
        own = rid * 100 + self.pidx; oz_ = self.pz + zoff
        cnt = np.zeros(self.n)
        for pt in parts:
            m = (own != pt[1]) & (pt[2] >= oz_)
            if not m.any(): continue
            sd = _sdf(pt, wp)
            cnt += m & (sd < -1.2 * sc)
        f = np.where(self.out, np.where(cnt > 0, 0.06, 1.0), 1.0 / (1 + cnt))
        return wp, f * self.pgain


def _inpoly(P, V):
    x, y = P[:, 0], P[:, 1]; ins = np.zeros(len(P), bool); n = len(V)
    for i in range(n):
        x1, y1 = V[i]; x2, y2 = V[(i + 1) % n]
        c = ((y1 > y) != (y2 > y)) & (x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-12) + x1)
        ins ^= c
    return ins


def _sdf(pt, P):
    if pt[0] == 'cap':
        A, B, ra, rb = pt[3], pt[4], pt[5], pt[6]
        BA = B - A; L2 = BA @ BA
        PA = P - A
        t = np.zeros(len(P)) if L2 < 1e-9 else c01((PA @ BA) / L2)
        d = np.linalg.norm(PA - t[:, None] * BA, axis=1)
        return d - (ra + (rb - ra) * t)
    O, X, Y, V, sc = pt[3], pt[4], pt[5], pt[6], pt[7]
    M = np.array([[X[0], Y[0]], [X[1], Y[1]]]); Mi = np.linalg.inv(M)
    Q = (P - O) @ Mi.T
    d = np.sum((Q - V[0]) ** 2, 1); s = np.ones(len(Q)); n = len(V)
    for i in range(n):
        j = i - 1; e = V[j] - V[i]; w = Q - V[i]
        b = w - e[None] * c01((w @ e) / (e @ e))[:, None]
        d = np.minimum(d, np.sum(b * b, 1))
        c1 = Q[:, 1] >= V[i][1]; c2 = Q[:, 1] < V[j][1]; c3 = e[0] * w[:, 1] > e[1] * w[:, 0]
        flip = (c1 & c2 & c3) | (~c1 & ~c2 & ~c3); s = np.where(flip, -s, s)
    return s * np.sqrt(d) * sc


# ---------------------------------------------------------------- girl
DRESS = [(-27, 0), (27, 0), (46, -60), (80, -126), (40, -133), (0, -135), (-40, -133), (-80, -126), (-46, -60)]


def girl_geom(p):
    g = {}
    bob = p.get('bob', 0.0); br = p.get('breath', 0.0)
    hip = np.array([0.0, 140.0 + bob])
    for side in ('f', 'n'):
        th, tk = p['leg_' + side]
        hx = hip + np.array([2.0 if side == 'n' else -5.0, 0])
        knee = hx + 68 * ang(th); a2 = th - tk
        ank = knee + 66 * ang(a2); toe = ank + 19 * np.array([math.cos(a2), math.sin(a2)])
        g['thigh_' + side] = ('cap', hx, knee, 11.0, 9.5, None)
        g['shin_' + side] = ('cap', knee, ank, 9.5, 6.5, None)
        g['foot_' + side] = ('cap', ank, toe, 6.5, 5.5, None)
    waist = np.array([0.0, 262.0 + bob + br * .3])
    lean = p.get('lean', 0.0); RL = rotm(lean)
    g['dress'] = ('poly', waist, np.array([1.0, 0]), np.array([0, 1.0]), DRESS)
    chest = waist + RL @ np.array([3.0, 56 + br])
    g['torso'] = ('cap', waist, chest, 27.0, 24.0, None)
    pivot = chest + RL @ np.array([1.0, 12])
    R = rotm(p['tilt'] + lean); hd = R @ np.array([1.0, 0])
    g['neck'] = ('cap', chest, pivot + R @ np.array([0, 6.0]), 10.0, 10.0, None)
    hc = pivot + R @ np.array([5.0, 36]); g['head'] = ('cap', hc, hc, 44.0, 44.0, hd)
    hr = pivot + R @ np.array([-7.0, 44]); g['hair'] = ('cap', hr, hr, 49.0, 49.0, hd)
    nz = pivot + R @ np.array([48.0, 30]); g['nose'] = ('cap', nz, nz, 5.5, 5.5, hd)
    pb = pivot + R @ np.array([-40.0, 66])
    pony = p.get('pony', 0.0)
    d1 = rv(rv(np.array([-0.55, -0.83]), p['tilt'] * .6 + lean), pony)
    d2 = rv(d1, pony * 1.4 + 0.32)
    p1 = pb + 44 * d1; p2 = p1 + 40 * d2
    g['pony1'] = ('cap', pb, p1, 17.0, 13.0, None)
    g['pony2'] = ('cap', p1, p2, 13.0, 5.0, None)
    ey = pivot + R @ np.array([30.0, 40]); g['eye'] = ('cap', ey, ey, 3.2, 3.2, hd)
    bw = pb + R @ np.array([6.0, 8]); g['bow'] = ('cap', bw + R @ np.array([0, 9.0]), bw - R @ np.array([0, 9.0]), 6.0, 6.0, None)
    sh = chest + RL @ np.array([3.0, -7])
    for side in ('f', 'n'):
        ts, te = p['arm_' + side]
        s0 = sh + np.array([-4.0 if side == 'f' else 0.0, 0])
        el = s0 + 62 * ang(ts); a2 = ts + te; wr = el + 56 * ang(a2); hcn = wr + 7 * ang(a2)
        g['uarm_' + side] = ('cap', s0, el, 10.0, 8.5, None)
        g['farm_' + side] = ('cap', el, wr, 8.5, 7.0, None)
        g['hand_' + side] = ('cap', hcn, hcn, 9.5, 9.5, ang(a2))
    return g


GIRL_Z = {'thigh_f': 0, 'shin_f': 0, 'foot_f': 0, 'uarm_f': 0, 'farm_f': 0, 'hand_f': 0,
          'thigh_n': .5, 'shin_n': .5, 'foot_n': .5, 'uarm_n': 2, 'farm_n': 2, 'hand_n': 2}
GIRL_G = {'thigh_f': .55, 'shin_f': .55, 'foot_f': .55, 'uarm_f': .55, 'farm_f': .55, 'hand_f': .55, 'nose': 1.2, 'eye': 2.4}
GIRL_Z['eye'] = 3
GIRL_REST = dict(tilt=0, leg_f=(0, 0), leg_n=(0, 0), arm_f=(0.1, .2), arm_n=(0.1, .2))


def girl_pose_ride(t, walk_ph, amt):
    bob = amt * 3 * math.sin(4 * math.pi * walk_ph)
    return dict(tilt=.06 + .03 * math.sin(4 * math.pi * walk_ph + 1), lean=.04,
                arm_n=(1.12, .42), arm_f=(1.0, .5), leg_n=(1.42, 1.52), leg_f=(1.3, 1.36),
                breath=1.2 * math.sin(2 * math.pi * .45 * t), bob=bob,
                pony=.18 * math.sin(4 * math.pi * walk_ph - .6) * amt + .06 * math.sin(2 * math.pi * .5 * t))


# ---------------------------------------------------------------- deer
ANTLER = [((0, 0), (-12, 52)), ((-12, 52), (-4, 100)), ((-4, 100), (-28, 146)), ((-12, 52), (20, 82)),
          ((-4, 100), (24, 134)), ((-4, 100), (-40, 112)), ((0, 10), (22, 26))]


def _ik(R, T, L1, L2, bend):
    d = T - R; dist = max(1e-3, min(np.linalg.norm(d), L1 + L2 - 1e-3)); dn = d / np.linalg.norm(d)
    a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist); h = math.sqrt(max(0.0, L1 * L1 - a * a))
    perp = np.array([-dn[1], dn[0]]) * bend
    M = R + dn * a; return M + perp * h


def _gait_foot(ph, stride, lift, beta=.62):
    p = ph % 1.0
    if p < beta: return stride / 2 - stride * (p / beta), 0.0
    q = (p - beta) / (1 - beta); s = q * q * (3 - 2 * q)
    return -stride / 2 + stride * s, lift * math.sin(math.pi * q)


def deer_geom(p):
    g = {}; ph = p.get('ph', 0.0); amt = p.get('amt', 0.0)
    bob = amt * 4 * math.sin(4 * math.pi * ph) + p.get('breath', 0)
    A = np.array([-88.0, 300 + bob]); B = np.array([78.0, 298 + bob])
    stride = 118 * amt; lift = 38 * amt
    legs = [('lf_f', 72, 285, .25, 128, 150, 1), ('lh_f', -70, 300, .75, 150, 160, -1),
            ('lf_n', 62, 285, .75, 128, 150, 1), ('lh_n', -80, 300, .25, 150, 160, -1)]
    # legs: name, root x, root y, phase offset, upper and lower segment lengths, bend direction
    for nm, rx, ry, off, L1, L2, bend in legs:
        R0 = np.array([rx, ry + bob]); fx, fy = _gait_foot(ph + off, stride, lift)
        T = np.array([rx + fx + (6 if 'f_' in nm[:3] else -6), 6 + fy])
        sp = p.get('spread', 0.0); lu = p.get('lu', 0.0); front = nm[1] == 'f'; far = nm.endswith('_f')
        T = T + np.array([(sp if far else -.45 * sp) if front else (-sp if far else .5 * sp), 0.0])   # stance: the four legs staggered, so the far legs aren't hidden by the near ones
        T = T + np.array([p.get('reach', 0.0) * (1 if front else -1), lu * (1.0 if front else .8)])     # leap: front legs reach forward, hind legs push back, legs tucked
        J = _ik(R0, T, L1, L2, bend)
        hind = nm[1] == 'h'
        g['up_' + nm] = ('cap', R0, J, 22.0 if hind else 17.0, 9.0, None)
        g['lo_' + nm] = ('cap', J, T, 8.0, 5.0, None)
    g['body'] = ('cap', A, B, 66.0, 63.0, None)
    g['rump'] = ('cap', np.array([-98.0, 322 + bob]), np.array([-62.0, 338 + bob]), 52.0, 50.0, None)
    g['chest'] = ('cap', np.array([70.0, 282 + bob]), np.array([96.0, 316 + bob]), 50.0, 44.0, None)
    tn = p['neck']; N0 = np.array([80.0, 322 + bob]); NE = N0 + 150 * np.array([math.sin(tn), math.cos(tn)])
    g['neck'] = ('cap', N0, NE, 46.0, 25.0, None)
    th = p['head']; Rh = rotm(th); hd = np.array([math.cos(th), math.sin(th)])
    sn = NE + 72 * hd
    g['head'] = ('cap', NE, sn, 29.0, 13.0, None)
    eb = NE + Rh @ np.array([-8.0, 18]); ea = th + 2.25 + p.get('ear', 0.0)
    g['ear'] = ('cap', eb, eb + 42 * np.array([math.cos(ea), math.sin(ea)]), 12.0, 3.5, None)
    tl = np.array([-142.0, 336 + bob]); ta = 2.3 + p.get('tail', 0.0)
    g['tail'] = ('cap', tl, tl + 26 * np.array([math.cos(ta), math.sin(ta)]), 10.0, 5.0, None)
    for side, off, rot_, sc in (('f', np.array([12.0, -3]), .16, .92), ('n', np.array([0.0, 0]), 0.0, 1.0)):
        base = NE + Rh @ (np.array([2.0, 20]) + off); Ra = rotm(th + .5 + rot_)
        for i, (a, b) in enumerate(ANTLER):
            pa = base + Ra @ (np.array(a, float) * sc); pb_ = base + Ra @ (np.array(b, float) * sc)
            g['ant%s%d' % (side, i)] = ('cap', pa, pb_, 4.2 if i < 2 else 3.4, 2.6, None)
    p['_eye'] = NE + Rh @ np.array([26.0, 9]); p['_snout'] = sn
    p['_back'] = np.array([-14.0, 364 + bob]); p['_center'] = np.array([0.0, 330 + bob])
    return g


DEER_Z = {}
DEER_G = {}
for _s in ('lf_f', 'lh_f'):
    DEER_Z['up_' + _s] = 0; DEER_Z['lo_' + _s] = 0; DEER_G['up_' + _s] = .55; DEER_G['lo_' + _s] = .55
for _s in ('lf_n', 'lh_n'):
    DEER_Z['up_' + _s] = 2; DEER_Z['lo_' + _s] = 2
for _i in range(len(ANTLER)):
    DEER_Z['antf%d' % _i] = 0; DEER_G['antf%d' % _i] = .55; DEER_Z['antn%d' % _i] = 1.5
DEER_Z['ear'] = 2
DEER_REST = dict(neck=.42, head=-.55)


def grid_sample(mask, n, rng):
    A = mask.sum(); d = math.sqrt(A / n) * 1.02
    for _ in range(30):
        ys = np.arange(0, H, d); xs = np.arange(0, W, d)
        gx, gy = np.meshgrid(xs, ys); gx = gx.ravel() + rng.uniform(-.3, .3, gx.size) * d; gy = gy.ravel() + rng.uniform(-.3, .3, gy.size) * d
        ok = mask[np.clip(gy.astype(int), 0, H - 1), np.clip(gx.astype(int), 0, W - 1)]
        if ok.sum() >= n: break
        d *= .96
    p = np.stack([gx[ok], gy[ok]], 1); sel = rng.permutation(len(p))[:n]
    return p[sel]


LV_SIG = [1.0, 2.1, 4.8, 10.5, 23.0]
LV_RES = [1, 1, 2, 4, 8]
LV_GAIN = [1.0, 1.55, 2.7, 5.2, 10.0]
EXPO = 11.0
HALO = .16


def splat(h, w, xs, ys, ws, cols):
    x0 = np.floor(xs).astype(np.int64); y0 = np.floor(ys).astype(np.int64)
    m = (x0 >= 0) & (x0 < w - 1) & (y0 >= 0) & (y0 < h - 1)
    x0, y0, fx, fy, ws, cols = x0[m], y0[m], (xs - np.floor(xs))[m], (ys - np.floor(ys))[m], ws[m], cols[m]
    idx = y0 * w + x0
    I = np.concatenate([idx, idx + 1, idx + w, idx + w + 1])
    Wt = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy]) * np.tile(ws, 4)
    out = np.empty((h, w, 3), np.float32)
    for c in range(3):
        out[:, :, c] = np.bincount(I, Wt * np.tile(cols[:, c], 4), minlength=h * w).reshape(h, w)
    return out


def up2(a):
    ap = np.concatenate([a[:1], a, a[-1:]], 0)
    b = np.empty((a.shape[0] * 2,) + a.shape[1:], np.float32)
    b[0::2] = .75 * ap[1:-1] + .25 * ap[:-2]; b[1::2] = .75 * ap[1:-1] + .25 * ap[2:]
    bp = np.concatenate([b[:, :1], b, b[:, -1:]], 1)
    c = np.empty((b.shape[0], b.shape[1] * 2) + a.shape[2:], np.float32)
    c[:, 0::2] = .75 * bp[:, 1:-1] + .25 * bp[:, :-2]; c[:, 1::2] = .75 * bp[:, 1:-1] + .25 * bp[:, 2:]
    return c


_BG = None
def background():
    global _BG
    if _BG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        v = yy / H
        top = np.array([.00016, .00034, .00052], np.float32); bot = np.array([.00030, .00062, .00040], np.float32)
        bg = top[None, None] * (1 - v[..., None]) + bot[None, None] * v[..., None]
        r = np.sqrt(((xx - W / 2) / (W * .62)) ** 2 + ((yy - H * .52) / (H * .7)) ** 2)
        bg *= (1.25 - .55 * np.clip(r, 0, 1.4)[..., None])
        _BG = bg.astype(np.float32)
    return _BG


_TILES = None
def tiles():
    global _TILES
    if _TILES is None:
        rg = np.random.default_rng(SEED + 7)
        _TILES = (rg.normal(0, 1, (4, 512, 512)).astype(np.float32), rg.random((4, 512, 512)).astype(np.float32))
    return _TILES


def tile_full(T, k, ox, oy):
    t = np.roll(np.roll(T[k], oy, 0), ox, 1)
    return np.tile(t, (H // 512 + 1, W // 512 + 1))[:H, :W]

