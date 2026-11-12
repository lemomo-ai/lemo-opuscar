"""Signed-distance and polyline helpers for tools/art.py: SDF primitives, smooth union, marching squares,
Douglas-Peucker, fillets, resampling, smoothing and cubic Bezier curves. All in metres, y up."""
import math
import numpy as np

def rdp(pts, eps):
    pts = np.asarray(pts, float)
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; ab = b - a; L = np.hypot(*ab)
    if L < 1e-9: d = np.hypot(*(pts - a).T)
    else: d = np.abs(ab[0] * (pts[:, 1] - a[1]) - ab[1] * (pts[:, 0] - a[0])) / L
    i = int(np.argmax(d))
    if d[i] > eps:
        l = rdp(pts[:i + 1], eps); r = rdp(pts[i:], eps)
        return np.vstack([l[:-1], r])
    return np.vstack([a, b])

def fillet(pts, r, n=6):
    """round every interior corner with an arc of radius <= r"""
    pts = [np.asarray(p, float) for p in pts]
    if len(pts) < 3: return np.array(pts)
    out = [pts[0]]
    for i in range(1, len(pts) - 1):
        p0, p1, p2 = pts[i - 1], pts[i], pts[i + 1]
        v0 = p0 - p1; v1 = p2 - p1; l0 = np.hypot(*v0); l1 = np.hypot(*v1)
        if l0 < 1e-9 or l1 < 1e-9: continue
        u0 = v0 / l0; u1 = v1 / l1
        cosang = np.clip(np.dot(u0, u1), -1, 1); ang = math.acos(cosang)
        if ang > math.pi - 0.05: out.append(p1); continue
        t = r / math.tan(ang / 2)
        t = min(t, l0 * 0.45, l1 * 0.45)
        a = p1 + u0 * t; b = p1 + u1 * t
        for k in range(n + 1):  # quadratic bezier a -> p1 -> b
            s = k / n
            out.append((1 - s) ** 2 * a + 2 * (1 - s) * s * p1 + s * s * b)
    out.append(pts[-1])
    return np.array(out)

def resample(pts, step):
    pts = np.asarray(pts, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    if d[-1] < 1e-9: return pts
    n = max(2, int(d[-1] / step) + 1); s = np.linspace(0, d[-1], n)
    return np.c_[np.interp(s, d, pts[:, 0]), np.interp(s, d, pts[:, 1])]

def smooth(pts, it=2, closed=False):
    pts = np.asarray(pts, float)
    for _ in range(it):
        if closed:
            pts = (np.roll(pts, 1, 0) + 2 * pts + np.roll(pts, -1, 0)) / 4
        else:
            q = pts.copy(); q[1:-1] = (pts[:-2] + 2 * pts[1:-1] + pts[2:]) / 4; pts = q
    return pts

def r2(pts, nd=4): return [[round(float(x), nd), round(float(y), nd)] for x, y in pts]

def sd_circle(X, Y, c, r): return np.hypot(X - c[0], Y - c[1]) - r

def sd_ellipse(X, Y, c, rx, ry, ang=0.0):
    ca, sa = math.cos(ang), math.sin(ang); x = (X - c[0]) * ca + (Y - c[1]) * sa; y = -(X - c[0]) * sa + (Y - c[1]) * ca
    k = np.hypot(x / rx, y / ry); return (k - 1) * min(rx, ry)

def sd_capsule(X, Y, a, b, ra, rb):
    a = np.array(a, float); b = np.array(b, float); ba = b - a; L2 = ba @ ba
    h = np.clip(((X - a[0]) * ba[0] + (Y - a[1]) * ba[1]) / L2, 0, 1)
    return np.hypot(X - a[0] - ba[0] * h, Y - a[1] - ba[1] * h) - (ra + (rb - ra) * h)

def sd_tri(X, Y, p0, p1, p2, rr=0.0):
    P = [np.array(p0, float), np.array(p1, float), np.array(p2, float)]
    d = np.full(X.shape, 1e9); s = np.ones(X.shape)
    for i in range(3):
        a = P[i]; b = P[(i + 1) % 3]; e = b - a
        wx = X - a[0]; wy = Y - a[1]
        h = np.clip((wx * e[0] + wy * e[1]) / (e @ e), 0, 1)
        dx = wx - e[0] * h; dy = wy - e[1] * h
        d = np.minimum(d, dx * dx + dy * dy)
        c = e[0] * wy - e[1] * wx
        s = s * np.where(c > 0, 1, -1)
    # inside if all cross products have same sign: use winding via product trick
    inside = _inside_tri(X, Y, P)
    return np.where(inside, -1, 1) * np.sqrt(d) - rr

def _inside_tri(X, Y, P):
    def cr(a, b): return (b[0] - a[0]) * (Y - a[1]) - (b[1] - a[1]) * (X - a[0])
    c0 = cr(P[0], P[1]); c1 = cr(P[1], P[2]); c2 = cr(P[2], P[0])
    return ((c0 >= 0) & (c1 >= 0) & (c2 >= 0)) | ((c0 <= 0) & (c1 <= 0) & (c2 <= 0))

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1); return b * (1 - h) + a * h - k * h * (1 - h)

def marching(F, x0, y0, step):
    """zero contour of F (rows = y) -> list of closed polylines in world coords"""
    H, W = F.shape; segs = []
    def interp(p, q, fp, fq): t = fp / (fp - fq); return p + (q - p) * t
    for j in range(H - 1):
        for i in range(W - 1):
            f = [F[j, i], F[j, i + 1], F[j + 1, i + 1], F[j + 1, i]]
            idx = sum(1 << k for k in range(4) if f[k] < 0)
            if idx == 0 or idx == 15: continue
            c = [np.array([i, j]), np.array([i + 1, j]), np.array([i + 1, j + 1]), np.array([i, j + 1])]
            e = {}
            for k in range(4):
                a, b = k, (k + 1) % 4
                if (f[a] < 0) != (f[b] < 0): e[k] = interp(c[a].astype(float), c[b].astype(float), f[a], f[b])
            ks = sorted(e)
            if len(ks) == 2: segs.append((e[ks[0]], e[ks[1]]))
            elif len(ks) == 4: segs.append((e[ks[0]], e[ks[1]])); segs.append((e[ks[2]], e[ks[3]]))
    # chain
    key = lambda p: (round(p[0], 4), round(p[1], 4))
    adj = {}
    for a, b in segs:
        adj.setdefault(key(a), []).append(key(b)); adj.setdefault(key(b), []).append(key(a))
    used = set(); loops = []
    for s in list(adj):
        if s in used: continue
        loop = [s]; used.add(s); prev = None; cur = s
        while True:
            nx = [n for n in adj[cur] if n != prev and n not in used]
            if not nx: break
            prev, cur = cur, nx[0]; used.add(cur); loop.append(cur)
        if len(loop) > 8:
            L = np.array(loop, float)
            loops.append(np.c_[x0 + L[:, 0] * step, y0 + L[:, 1] * step])
    return loops

def split_loop(L, cut_at, gap):
    """open a closed outline at the point nearest cut_at, leaving a gap (metres)"""
    L = np.asarray(L, float)
    i = int(np.argmin(np.hypot(L[:, 0] - cut_at[0], L[:, 1] - cut_at[1])))
    R = np.vstack([L[i:], L[:i]])
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(R, axis=0).T))]
    m = (d > gap / 2) & (d < d[-1] - gap / 2)
    return R[m]

def bez(p0, p1, p2, p3, n=24):
    p0, p1, p2, p3 = map(lambda q: np.array(q, float), (p0, p1, p2, p3)); s = np.linspace(0, 1, n)[:, None]
    return (1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3 * p3
