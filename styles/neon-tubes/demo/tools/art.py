"""Cast of 《夜宵》 Midnight Snack: the neon cat (a pose rig), the goldfish, the fishbowl and the goblet -> ../art.json
Run from the library root:  .venv/bin/python styles/neon-tubes/demo/tools/art.py [preview.png]   (the png is a sheet of every pose)
Cat poses are signed-distance silhouettes (smooth union of an ellipse haunch, a body capsule, chest, neck, head, muzzle, ears
and two-segment legs), outlined with marching squares and opened at one point for the electrodes: one bent tube per pose,
like a real animated neon sign. Cat units: facing right, ground at y = 0, body about 0.5 long (the film scales by CS).
The SDF and polyline helpers are in sdf.py.
"""
import json, math, os, sys
import numpy as np
from sdf import sd_circle, sd_ellipse, sd_capsule, sd_tri, smin, marching, split_loop, smooth, resample, rdp, fillet, bez, r2

HERE = os.path.dirname(os.path.abspath(__file__))

def rot2(v, a): c, s = math.cos(a), math.sin(a); return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)
def add(p, v): return (p[0] + v[0], p[1] + v[1])

def T(P, c, eps=0.0012):
    P = np.asarray(P, float)
    if eps: P = rdp(P, eps)
    return {'p': r2(P), 'c': c}

def silhouette(prims, box, step=0.004, k=0.022, sub=None):
    xs = np.arange(box[0], box[2], step); ys = np.arange(box[1], box[3], step)
    X, Y = np.meshgrid(xs, ys)
    F = None
    for p in prims:
        d = p(X, Y); F = d if F is None else smin(F, d, k)
    if sub is not None: F = np.maximum(F, -sub(X, Y))
    loops = marching(F, box[0], box[1], step)
    loops.sort(key=lambda L: -len(L))
    return loops[0]

# ------------------------------------------------------------ the cat rig
EAR1 = [(-0.055, 0.035), (-0.062, 0.148), (0.004, 0.072)]
EAR2 = [(0.004, 0.076), (0.044, 0.158), (0.07, 0.036)]
def cat_pose(P):
    hip, chest, head = P['hip'], P['chest'], P['head']; ha = P.get('headA', 0.0)
    ba = math.atan2(chest[1] - hip[1], chest[0] - hip[0])
    prims = [
        (lambda h=hip, r=P.get('hipR', (0.105, 0.1)), a=P.get('hipA', ba): (lambda X, Y: sd_ellipse(X, Y, h, r[0], r[1], a)))(),
        (lambda: (lambda X, Y: sd_capsule(X, Y, hip, chest, *P.get('bodyR', (0.086, 0.07)))))(),
        (lambda r=P.get('chestR', (0.078, 0.068)): (lambda X, Y: sd_ellipse(X, Y, chest, r[0], r[1], ba)))(),
        (lambda: (lambda X, Y: sd_capsule(X, Y, chest, head, 0.054, 0.05)))(),
        (lambda: (lambda X, Y: sd_circle(X, Y, head, 0.072)))(),
    ]
    mo = P.get('mouth', 0.0)
    if mo <= 0:
        m = add(head, rot2((0.06, -0.026), ha))
        prims.append((lambda m=m: (lambda X, Y: sd_ellipse(X, Y, m, 0.041, 0.03, ha)))())
    else:           # open jaws: an upper and a lower half-muzzle, hinged at the cheek
        hinge = add(head, rot2((0.03, -0.02), ha))
        for s_, sc in ((1, 1.0), (-1, 0.75)):
            a = ha + s_ * mo / 2; m = add(hinge, rot2((0.045, 0.0), a))
            prims.append((lambda m=m, a=a, sc=sc: (lambda X, Y: sd_ellipse(X, Y, m, 0.045, 0.017 * sc, a)))())
    ef = P.get('earFlat', 0.0)
    for E_ in (EAR1, EAR2):
        base = ((E_[0][0] + E_[2][0]) / 2, (E_[0][1] + E_[2][1]) / 2)
        pts = []
        for q in E_:
            v = (q[0] - base[0], q[1] - base[1])
            if q is E_[1]: v = rot2(v, ef * 0.75)
            pts.append(add(head, rot2(add(base, v), ha)))
        prims.append((lambda pts=pts: (lambda X, Y: sd_tri(X, Y, pts[0], pts[1], pts[2], 0.008)))())
    for L in P.get('legs', []):
        root, joint, paw = L[0], L[1], L[2]; r0, rm, r1 = (L[3] if len(L) > 3 else (0.034, 0.026, 0.021))
        prims.append((lambda a=root, b=joint, r0=r0, r1=rm: (lambda X, Y: sd_capsule(X, Y, a, b, r0, r1)))())
        prims.append((lambda a=joint, b=paw, r0=rm, r1=r1: (lambda X, Y: sd_capsule(X, Y, a, b, r0, r1)))())
        pa = L[4] if len(L) > 4 else 0.0
        prims.append((lambda p=paw, pa=pa: (lambda X, Y: sd_ellipse(X, Y, p, 0.03, 0.016, pa)))())
    xs = [q[0] for L in P.get('legs', []) for q in L[:3]] + [hip[0], chest[0], head[0]]
    ys = [q[1] for L in P.get('legs', []) for q in L[:3]] + [hip[1], chest[1], head[1]]
    box = (min(xs) - 0.2, min(ys) - 0.2, max(xs) + 0.22, max(ys) + 0.24)
    out = silhouette(prims, box)
    cut = P.get('cut', ((hip[0] + chest[0]) / 2, min(hip[1], chest[1]) - 0.3))
    o = split_loop(smooth(resample(out, 0.005), 3, closed=True), cut, 0.04)
    # eye, whiskers, tail, mouth anchor
    ec = add(head, rot2((0.03, 0.01), ha)); et = P.get('eye', 'open')
    if et == 'closed':
        eye = [add(ec, rot2((x, -0.012 * (1 - (x / 0.024) ** 2) + 0.004), ha)) for x in np.linspace(-0.024, 0.024, 12)]
    elif et == 'wide':
        eye = [add(ec, (0.021 * math.cos(a), 0.021 * math.sin(a))) for a in np.linspace(0.3, 2 * math.pi + 0.15, 22)]
    else:
        hgt = 0.0105 if et == 'slit' else 0.017
        up = [(x, hgt * (1 - (x / 0.026) ** 2)) for x in np.linspace(-0.026, 0.026, 12)]
        dn = [(x, -hgt * (1 - (x / 0.026) ** 2)) for x in np.linspace(0.026, -0.026, 12)][1:]
        eye = [add(ec, rot2(q, ha + (0.12 if et == 'slit' else 0.05))) for q in up + dn]
        eye[-1] = add(eye[-1], (0.002, 0.004))
    mz = add(head, rot2((0.085, -0.03), ha))
    wh = []
    if P.get('whisk', True) and mo <= 0:
        for dy, ln in ((0.012, 0.15), (-0.008, 0.16)):
            a = ha + P.get('whiskA', 0.0)
            wh.append([add(mz, rot2((0.005, dy), a)), add(mz, rot2((0.05, dy * 1.8 + 0.004), a)), add(mz, rot2((ln, dy * 3.2 + 0.012), a))])
    tail = bez(*P['tail'], 26) if 'tail' in P else None
    anchor = add(head, rot2((0.075, -0.05), ha))
    return {'outline': T(o, 'turq', 0.0008), 'eye': T(eye, 'pink', 0.0003),
            'whisk': [T(bez(w[0], w[1], w[1], w[2], 10), 'turq', 0.001) for w in wh],
            **({'tail': T(tail, 'turq', 0.001)} if tail is not None else {}), 'anchor': [round(anchor[0], 4), round(anchor[1], 4)],
            'headA': ha}

FRONT = (0.033, 0.025, 0.02); HIND = (0.045, 0.03, 0.021)
def tailp(*pts): return [tuple(p) for p in pts]
POSES = {
    # --- home: asleep, awake, stretch, yawn, alert
    'loaf': dict(hip=(-0.15, 0.09), hipR=(0.115, 0.088), chest=(0.06, 0.068), chestR=(0.08, 0.066), head=(0.17, 0.072), headA=-0.12, eye='closed',
                 legs=[((0.08, 0.04), (0.15, 0.018), (0.22, 0.015), FRONT)], tail=tailp((-0.25, 0.06), (-0.37, 0.05), (-0.4, 0.15), (-0.32, 0.19))),
    'loaf_open': dict(hip=(-0.15, 0.09), hipR=(0.115, 0.088), chest=(0.06, 0.068), chestR=(0.08, 0.066), head=(0.17, 0.072), headA=-0.12, eye='open',
                 legs=[((0.08, 0.04), (0.15, 0.018), (0.22, 0.015), FRONT)], tail=tailp((-0.25, 0.06), (-0.37, 0.05), (-0.4, 0.15), (-0.32, 0.19))),
    'loaf_up': dict(hip=(-0.15, 0.09), hipR=(0.115, 0.088), chest=(0.06, 0.075), chestR=(0.08, 0.07), head=(0.16, 0.14), headA=0.1,
                    legs=[((0.08, 0.04), (0.15, 0.018), (0.22, 0.015), FRONT)], tail=tailp((-0.25, 0.06), (-0.37, 0.05), (-0.42, 0.17), (-0.34, 0.23))),
    'stretch': dict(hip=(-0.12, 0.2), hipR=(0.1, 0.095), chest=(0.1, 0.075), head=(0.2, 0.125), headA=0.3, eye='closed',
                    legs=[((0.11, 0.05), (0.21, 0.02), (0.31, 0.013), FRONT), ((-0.12, 0.16), (-0.1, 0.08), (-0.11, 0.013), HIND)],
                    tail=tailp((-0.21, 0.25), (-0.3, 0.36), (-0.24, 0.48), (-0.15, 0.52))),
    'yawn': dict(hip=(-0.15, 0.09), hipR=(0.115, 0.088), chest=(0.06, 0.08), chestR=(0.08, 0.072), head=(0.15, 0.16), headA=0.55, mouth=0.9, eye='closed',
                 legs=[((0.08, 0.04), (0.15, 0.018), (0.22, 0.015), FRONT)], tail=tailp((-0.25, 0.06), (-0.37, 0.05), (-0.42, 0.17), (-0.34, 0.23))),
    'sit_alert': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.27), chestR=(0.075, 0.085), head=(0.1, 0.42), headA=0.0,
                      legs=[((0.07, 0.2), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.34, 0.02), (-0.42, 0.1), (-0.37, 0.22))),
    'sit_wide': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.27), chestR=(0.075, 0.085), head=(0.1, 0.42), headA=0.0, eye='wide',
                      legs=[((0.07, 0.2), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.34, 0.02), (-0.42, 0.1), (-0.37, 0.22))),
    'sit_slit': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.065, 0.26), chestR=(0.075, 0.085), head=(0.12, 0.4), headA=-0.1, eye='slit', earFlat=-0.15,
                      legs=[((0.07, 0.2), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.36, 0.06), (-0.46, 0.14), (-0.5, 0.22))),
    # --- the hunt
    'crouch_a': dict(hip=(-0.14, 0.13), hipR=(0.11, 0.1), chest=(0.07, 0.085), head=(0.19, 0.105), headA=0.0, eye='slit',
                     legs=[((0.07, 0.06), (0.13, 0.025), (0.18, 0.013), FRONT), ((-0.13, 0.09), (-0.07, 0.035), (-0.1, 0.013), HIND)],
                     tail=tailp((-0.24, 0.13), (-0.34, 0.11), (-0.42, 0.1), (-0.5, 0.13))),
    'crouch_b': dict(hip=(-0.125, 0.15), hipR=(0.11, 0.1), chest=(0.07, 0.085), head=(0.19, 0.105), headA=0.0, eye='slit', hipA=0.25,
                     legs=[((0.07, 0.06), (0.13, 0.025), (0.18, 0.013), FRONT), ((-0.12, 0.1), (-0.06, 0.04), (-0.09, 0.013), HIND)],
                     tail=tailp((-0.22, 0.16), (-0.33, 0.16), (-0.41, 0.2), (-0.47, 0.27))),
    'leap_push': dict(hip=(-0.1, 0.16), chest=(0.12, 0.26), head=(0.24, 0.34), headA=0.35,
                      legs=[((0.13, 0.21), (0.21, 0.17), (0.26, 0.21), FRONT), ((-0.12, 0.12), (-0.23, 0.06), (-0.34, 0.015), HIND, -0.4)],
                      tail=tailp((-0.19, 0.2), (-0.31, 0.21), (-0.43, 0.24), (-0.54, 0.29))),
    'leap_fly': dict(hip=(-0.14, 0.0), chest=(0.1, 0.02), head=(0.235, 0.06), headA=0.05,
                     legs=[((0.12, -0.0), (0.22, -0.035), (0.33, -0.025), FRONT, 0.0), ((-0.16, -0.03), (-0.28, -0.06), (-0.41, -0.055), HIND)],
                     tail=tailp((-0.24, 0.03), (-0.36, 0.07), (-0.47, 0.07), (-0.57, 0.11))),
    'leap_land': dict(hip=(-0.12, 0.22), chest=(0.1, 0.15), head=(0.22, 0.21), headA=-0.1,
                      legs=[((0.11, 0.1), (0.16, 0.05), (0.18, 0.012), FRONT), ((-0.12, 0.17), (-0.03, 0.12), (-0.08, 0.08), HIND)],
                      tail=tailp((-0.21, 0.26), (-0.31, 0.34), (-0.4, 0.37), (-0.48, 0.34))),
    'land': dict(hip=(-0.13, 0.11), hipR=(0.115, 0.1), chest=(0.08, 0.08), head=(0.19, 0.12), headA=0.05,
                 legs=[((0.09, 0.05), (0.13, 0.025), (0.17, 0.013), FRONT), ((-0.12, 0.07), (-0.06, 0.03), (-0.09, 0.013), HIND)],
                 tail=tailp((-0.23, 0.13), (-0.33, 0.22), (-0.3, 0.33), (-0.22, 0.36))),
    'run_1': dict(hip=(-0.075, 0.2), hipR=(0.1, 0.1), chest=(0.07, 0.2), head=(0.18, 0.245), headA=0.0, hipA=0.6,
                  legs=[((0.07, 0.15), (0.02, 0.08), (-0.05, 0.03), FRONT, 0.3), ((-0.07, 0.15), (0.03, 0.1), (0.07, 0.03), HIND)],
                  tail=tailp((-0.16, 0.25), (-0.27, 0.33), (-0.37, 0.33), (-0.45, 0.39))),
    'run_2': dict(hip=(-0.16, 0.15), chest=(0.12, 0.16), head=(0.25, 0.2), headA=0.05,
                  legs=[((0.12, 0.11), (0.24, 0.08), (0.37, 0.06), FRONT), ((-0.16, 0.11), (-0.29, 0.07), (-0.43, 0.05), HIND)],
                  tail=tailp((-0.25, 0.18), (-0.37, 0.2), (-0.48, 0.19), (-0.58, 0.22))),
    'run_3': dict(hip=(-0.12, 0.21), chest=(0.1, 0.13), head=(0.22, 0.16), headA=-0.12,
                  legs=[((0.1, 0.08), (0.13, 0.04), (0.11, 0.0), FRONT), ((-0.12, 0.17), (-0.22, 0.15), (-0.31, 0.15), HIND)],
                  tail=tailp((-0.21, 0.25), (-0.31, 0.32), (-0.42, 0.33), (-0.5, 0.38))),
    'run_4': dict(hip=(-0.1, 0.13), chest=(0.1, 0.22), head=(0.21, 0.28), headA=0.2,
                  legs=[((0.1, 0.17), (0.17, 0.12), (0.22, 0.16), FRONT), ((-0.1, 0.09), (-0.08, 0.04), (-0.03, 0.0), HIND)],
                  tail=tailp((-0.19, 0.15), (-0.31, 0.15), (-0.41, 0.12), (-0.51, 0.15))),
    'clock_reach': dict(hip=(-0.17, 0.1), chest=(0.05, 0.07), head=(0.15, 0.04), headA=-0.85, eye='slit',
                        legs=[((0.08, 0.04), (0.17, -0.06), (0.2, -0.17), FRONT, -1.0), ((-0.14, 0.06), (-0.08, 0.02), (-0.12, 0.012), HIND)],
                        tail=tailp((-0.27, 0.13), (-0.38, 0.2), (-0.37, 0.33), (-0.28, 0.36))),
    'clock_swat': dict(hip=(-0.17, 0.11), chest=(0.05, 0.08), head=(0.15, 0.05), headA=-0.8, eye='slit',
                       legs=[((0.08, 0.05), (0.2, -0.02), (0.27, -0.12), FRONT, -0.6), ((-0.14, 0.06), (-0.08, 0.02), (-0.12, 0.012), HIND)],
                       tail=tailp((-0.27, 0.14), (-0.39, 0.23), (-0.34, 0.36), (-0.24, 0.38))),
    # --- the goldfish shop
    'lie_peer': dict(hip=(-0.17, 0.1), hipR=(0.11, 0.1), chest=(0.06, 0.07), head=(0.17, 0.06), headA=-0.6, eye='slit',
                     legs=[((0.08, 0.04), (0.15, 0.018), (0.2, 0.012), FRONT), ((-0.14, 0.06), (-0.08, 0.02), (-0.12, 0.012), HIND)],
                     tail=tailp((-0.27, 0.13), (-0.38, 0.16), (-0.43, 0.3), (-0.34, 0.36))),
    'lie_reach': dict(hip=(-0.17, 0.11), hipR=(0.11, 0.1), chest=(0.06, 0.075), head=(0.175, 0.07), headA=-0.75, eye='slit',
                      legs=[((0.09, 0.045), (0.2, -0.08), (0.245, -0.18), FRONT, -1.1), ((-0.14, 0.06), (-0.08, 0.02), (-0.12, 0.012), HIND)],
                      tail=tailp((-0.27, 0.14), (-0.38, 0.17), (-0.43, 0.31), (-0.34, 0.37))),
    'wiggle_a': dict(hip=(-0.15, 0.17), hipR=(0.1, 0.1), chest=(0.07, 0.08), head=(0.18, 0.08), headA=-0.45, eye='slit', hipA=0.5,
                     legs=[((0.08, 0.04), (0.14, 0.02), (0.19, 0.012), FRONT), ((-0.13, 0.13), (-0.08, 0.06), (-0.11, 0.012), HIND)],
                     tail=tailp((-0.24, 0.22), (-0.35, 0.26), (-0.44, 0.25), (-0.5, 0.3))),
    'wiggle_b': dict(hip=(-0.135, 0.175), hipR=(0.1, 0.1), chest=(0.07, 0.08), head=(0.18, 0.08), headA=-0.45, eye='slit', hipA=0.65,
                     legs=[((0.08, 0.04), (0.14, 0.02), (0.19, 0.012), FRONT), ((-0.12, 0.13), (-0.07, 0.06), (-0.1, 0.012), HIND)],
                     tail=tailp((-0.22, 0.23), (-0.32, 0.31), (-0.38, 0.36), (-0.46, 0.38))),
    'pounce': dict(hip=(-0.06, 0.2), chest=(0.12, 0.04), head=(0.2, -0.04), headA=-0.85, eye='wide',
                   legs=[((0.14, 0.0), (0.24, -0.1), (0.31, -0.2), FRONT, -0.9), ((-0.09, 0.17), (-0.2, 0.22), (-0.3, 0.25), HIND)],
                   tail=tailp((-0.13, 0.27), (-0.2, 0.37), (-0.15, 0.48), (-0.06, 0.52))),
    'recoil': dict(hip=(-0.14, 0.1), hipR=(0.11, 0.095), chest=(0.03, 0.13), head=(0.12, 0.2), headA=0.05, eye='wide',
                   legs=[((0.05, 0.08), (0.07, 0.04), (0.08, 0.012), FRONT), ((-0.12, 0.06), (-0.06, 0.025), (-0.09, 0.012), HIND)],
                   tail=tailp((-0.24, 0.07), (-0.35, 0.03), (-0.37, 0.12), (-0.33, 0.18))),
    'ears_flat': dict(hip=(-0.14, 0.095), hipR=(0.11, 0.09), chest=(0.03, 0.12), head=(0.12, 0.18), headA=-0.15, eye='wide', earFlat=1.0,
                      legs=[((0.05, 0.08), (0.07, 0.04), (0.08, 0.012), FRONT), ((-0.12, 0.06), (-0.06, 0.025), (-0.09, 0.012), HIND)],
                      tail=tailp((-0.24, 0.05), (-0.33, 0.01), (-0.24, -0.005), (-0.12, 0.01))),
    'look_down': dict(hip=(-0.15, 0.1), hipR=(0.11, 0.09), chest=(0.04, 0.11), head=(0.15, 0.1), headA=-0.7, eye='wide', earFlat=0.9,
                      legs=[((0.06, 0.07), (0.09, 0.035), (0.11, 0.012), FRONT), ((-0.13, 0.06), (-0.07, 0.025), (-0.1, 0.012), HIND)],
                      tail=tailp((-0.25, 0.05), (-0.34, 0.01), (-0.25, -0.005), (-0.13, 0.01))),
    'dive': dict(hip=(0.0, 0.2), hipR=(0.1, 0.095), chest=(0.03, -0.06), head=(0.05, -0.19), headA=-1.45, eye='wide',
                 legs=[((0.05, -0.08), (0.08, -0.17), (0.07, -0.26), FRONT, -1.4), ((-0.02, 0.24), (-0.09, 0.3), (-0.15, 0.36), HIND)],
                 tail=tailp((-0.05, 0.28), (-0.06, 0.4), (0.04, 0.47), (0.1, 0.44))),
    'carry_up': dict(hip=(0.0, -0.06), hipR=(0.1, 0.095), chest=(0.03, 0.17), head=(0.08, 0.3), headA=0.75,
                     legs=[((0.05, 0.12), (0.12, 0.08), (0.17, 0.11), FRONT), ((-0.03, -0.1), (0.0, -0.18), (-0.04, -0.26), HIND)],
                     tail=tailp((-0.08, -0.08), (-0.18, -0.06), (-0.22, 0.05), (-0.17, 0.12))),
    'carry_stand': dict(hip=(-0.13, 0.17), chest=(0.09, 0.18), head=(0.21, 0.255), headA=0.15,
                        legs=[((0.09, 0.12), (0.1, 0.06), (0.11, 0.012), FRONT), ((-0.13, 0.13), (-0.11, 0.06), (-0.13, 0.012), HIND)],
                        tail=tailp((-0.22, 0.2), (-0.33, 0.25), (-0.38, 0.36), (-0.32, 0.43))),
    'drop_fall': dict(hip=(-0.02, -0.04), hipR=(0.1, 0.095), chest=(0.04, 0.15), head=(0.08, 0.28), headA=0.55,
                      legs=[((0.06, 0.09), (0.12, 0.01), (0.13, -0.08), FRONT), ((0.0, -0.09), (0.04, -0.17), (0.03, -0.25), HIND)],
                      tail=tailp((-0.1, -0.03), (-0.17, 0.07), (-0.14, 0.2), (-0.2, 0.3))),
    'climb': dict(hip=(0.0, -0.02), hipR=(0.1, 0.095), chest=(0.04, 0.2), head=(0.08, 0.33), headA=1.1,
                  legs=[((0.06, 0.16), (0.11, 0.26), (0.12, 0.36), FRONT, 1.2), ((-0.01, -0.07), (0.02, -0.16), (0.0, -0.25), HIND)],
                  tail=tailp((-0.08, -0.05), (-0.15, -0.13), (-0.13, -0.25), (-0.19, -0.32))),
    # --- the goblet
    'sit_down': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.25), chestR=(0.075, 0.085), head=(0.13, 0.33), headA=-0.6,
                     legs=[((0.07, 0.19), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.34, 0.02), (-0.42, 0.1), (-0.37, 0.22))),
    'sit_drop': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.25), chestR=(0.075, 0.085), head=(0.13, 0.32), headA=-0.7, mouth=0.55,
                     legs=[((0.07, 0.19), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.34, 0.02), (-0.42, 0.1), (-0.37, 0.22))),
    'sit_watch': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.26), chestR=(0.075, 0.085), head=(0.12, 0.37), headA=-0.45, eye='wide',
                      legs=[((0.07, 0.19), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.3, -0.02), (-0.15, -0.06), (0.05, -0.04))),
    'sit_happy': dict(hip=(-0.07, 0.12), hipR=(0.14, 0.12), chest=(0.06, 0.27), chestR=(0.075, 0.085), head=(0.11, 0.41), headA=-0.15, eye='closed',
                      legs=[((0.07, 0.2), (0.1, 0.1), (0.12, 0.015), FRONT)], tail=tailp((-0.2, 0.05), (-0.3, -0.02), (-0.12, -0.07), (0.1, -0.05))),
    'curl': dict(hip=(-0.07, 0.09), hipR=(0.135, 0.09), chest=(0.06, 0.08), chestR=(0.075, 0.07), head=(0.13, 0.075), headA=-0.35, eye='closed',
                 legs=[], tail=tailp((-0.19, 0.06), (-0.23, -0.02), (0.02, -0.04), (0.2, 0.0)), whisk=False),
    'curl_peek': dict(hip=(-0.07, 0.09), hipR=(0.135, 0.09), chest=(0.06, 0.08), chestR=(0.075, 0.07), head=(0.13, 0.09), headA=-0.2, eye='slit',
                      legs=[], tail=tailp((-0.19, 0.06), (-0.23, -0.02), (0.02, -0.04), (0.2, 0.0)), whisk=False),
}

# ------------------------------------------------------------ the goldfish (fish units: ~0.24 nose to tail tip, centre at origin, facing right)
def fish_pose(swing=0.0, bend=0.0, rot=0.0):
    a1, a2 = math.radians(28 + 18 * swing), math.radians(-28 + 18 * swing)
    tx = -0.085
    def W(X, Y):          # bend the body along a parabola (head and tail curl the same way)
        return X, Y - bend * X * X * 2.6
    base = [
        lambda X, Y: sd_ellipse(X, Y, (0.0, 0.0), 0.085, 0.062),
        lambda X, Y: sd_ellipse(X, Y, (0.055, -0.004), 0.04, 0.042),
        lambda X, Y: sd_capsule(X, Y, (-0.05, 0.0), (tx, 0.0), 0.03, 0.018),
        lambda X, Y: sd_ellipse(X, Y, (tx - 0.06 * math.cos(a1), 0.06 * math.sin(a1)), 0.07, 0.026, a1),
        lambda X, Y: sd_ellipse(X, Y, (tx - 0.06 * math.cos(a2), 0.06 * math.sin(a2)), 0.07, 0.026, a2),
        lambda X, Y: sd_tri(X, Y, (-0.03, 0.045), (0.02, 0.098), (0.035, 0.05), 0.006),
        lambda X, Y: sd_tri(X, Y, (0.0, -0.05), (0.03, -0.085), (0.045, -0.045), 0.005),
    ]
    prims = [(lambda f=f: (lambda X, Y: f(*W(X, Y))))() for f in base]
    out = silhouette(prims, (-0.3, -0.25, 0.2, 0.25), step=0.002, k=0.016)
    o = split_loop(smooth(resample(out, 0.004), 3, closed=True), (-0.06, -0.03 - bend * 0.03), 0.02)
    eye = [(0.052 + 0.011 * math.cos(a), 0.012 - bend * 0.022 + 0.011 * math.sin(a)) for a in np.linspace(0.3, 2 * math.pi + 0.1, 20)]
    gill = [(0.03 - 0.018 * math.sin(s * math.pi), 0.04 - s * 0.085 - bend * 0.012) for s in np.linspace(0, 1, 12)]
    c, s_ = math.cos(rot), math.sin(rot); R = np.array([[c, s_], [-s_, c]])
    tf = lambda P: np.asarray(P, float) @ R
    return {'outline': T(tf(o), 'neon', 0.0005), 'eye': T(tf(eye), 'neon', 0.0003), 'gill': T(tf(gill), 'neon', 0.0005)}

FISH = {
    'swim_a': dict(swing=-1.0), 'swim_b': dict(swing=1.0),
    'dart': dict(swing=1.3, bend=0.6), 'dart_b': dict(swing=-1.3, bend=-0.6),
    'flop_a': dict(swing=0.5, bend=1.1, rot=0.15), 'flop_b': dict(swing=-0.5, bend=-0.9, rot=-0.2),
    'carry': dict(swing=0.6, bend=0.7, rot=0.0), 'sink': dict(swing=0.2, bend=0.3, rot=-0.6),
    'rest': dict(swing=0.2, bend=0.25, rot=0.05),
}

# ------------------------------------------------------------ fishbowl (metres, centre at origin, R = 0.5) and the goblet (rim centre at origin)
def bowl(R=0.5):
    a0, a1 = math.radians(64), math.radians(116); yb = -R * 0.9; xb = math.sqrt(R * R - yb * yb)
    thL = np.linspace(a1, math.pi + math.asin(-yb / R), 60); thR = np.linspace(2 * math.pi - math.asin(-yb / R), 2 * math.pi + a0, 60)
    body = np.vstack([[[R * math.cos(a1) - 0.045, R * math.sin(a1) + 0.03]], np.c_[R * np.cos(thL), R * np.sin(thL)],
                      np.c_[R * np.cos(thR), R * np.sin(thR)], [[R * math.cos(a0) + 0.045, R * math.sin(a0) + 0.03]]])
    base = np.array([[-xb * 0.62, yb - 0.035], [xb * 0.62, yb - 0.035]])
    def wave(yw, amp=0.016, f=2.5, ph=0.0, w=1.0):
        xw = (math.sqrt(R * R - yw * yw) - 0.035) * w; xs = np.linspace(-xw, xw, 60)
        return np.c_[xs, yw + amp * np.sin(xs / max(xw, 1e-6) * math.pi * f + ph)]
    out = {'body': T(body, 'white', 0.0006), 'base': T(base, 'white'),
           'water': [T(wave(0.11), 'argon', 0.0005), T(wave(-0.12, 0.013, 3.0, 1.0), 'argon', 0.0005), T(wave(-0.32, 0.011, 2.5, 2.0), 'argon', 0.0005)],
           'bubbles': [T([[bx + br * math.cos(a), by + br * math.sin(a)] for a in np.linspace(0.4, 2 * math.pi + 0.2, 24)], 'white', 0.0003)
                       for (bx, by, br) in [(0.17, -0.12, 0.026), (0.21, -0.03, 0.021), (0.16, 0.05, 0.016)]],
           'pebbles': [T(bez((px - pw / 2, yb + 0.005), (px - pw / 2, yb + 0.05), (px + pw / 2, yb + 0.05), (px + pw / 2, yb + 0.005), 12), 'yellow', 0.0005)
                       for (px, pw) in [(-0.22, 0.07), (-0.1, 0.06), (0.04, 0.08), (0.2, 0.06)]],
           'weed': T(bez((-0.3, yb + 0.01), (-0.36, yb + 0.15), (-0.24, yb + 0.25), (-0.31, yb + 0.38), 24), 'green', 0.0008),
           'R': R, 'yb': yb, 'a0': a0, 'a1': a1}
    return out

def goblet():
    # rim y = 0, rim half-width 0.42; bowl down to the stem at y = -0.56; stem to -0.86; foot at -0.9
    L = bez((-0.42, 0.0), (-0.42, -0.34), (-0.2, -0.52), (-0.05, -0.56), 30)
    body = np.vstack([L, [[-0.05, -0.84]], [[-0.24, -0.9]], [[0.24, -0.9]], [[0.05, -0.84]], L[::-1] * np.array([-1, 1])])
    def inner(y):          # half-width of the bowl at height y (from the left wall curve)
        i = np.argmin(np.abs(L[:, 1] - y)); return -L[i, 0]
    yw = -0.13; xw = inner(yw) - 0.03; xs = np.linspace(-xw, xw, 50)
    water = np.c_[xs, yw + 0.014 * np.sin(xs / xw * math.pi * 2.5)]
    cube = lambda cx, cy, r, a: [[cx + r * math.cos(a + k * math.pi / 2 + math.pi / 4), cy + r * math.sin(a + k * math.pi / 2 + math.pi / 4)] for k in range(5)]
    c1 = cube(-0.17, -0.25, 0.085, 0.3); c1[4] = [c1[4][0] + 0.004, c1[4][1] - 0.01]
    c2 = cube(0.03, -0.33, 0.075, -0.25); c2[4] = [c2[4][0] + 0.004, c2[4][1] - 0.01]
    straw = [[-0.12, -0.36], [-0.27, 0.24], [-0.42, 0.33]]
    return {'body': T(body, 'argon', 0.0006), 'water': T(water, 'argon', 0.0005), 'cubes': [T(c1, 'white', 0.0005), T(c2, 'white', 0.0005)],
            'straw': T(straw, 'pink', 0.0), 'inner': [[round(y, 3), round(inner(y), 3)] for y in np.linspace(-0.55, 0.0, 12)]}

def main():
    art = {'cat': {k: cat_pose(v) for k, v in POSES.items()}, 'fish': {k: fish_pose(**v) for k, v in FISH.items()}, 'bowl': bowl(), 'goblet': goblet()}
    json.dump(art, open(os.path.join(HERE, '..', 'art.json'), 'w'), separators=(',', ':'))
    print('art.json', os.path.getsize(os.path.join(HERE, '..', 'art.json')), 'bytes;', len(POSES), 'cat poses,', len(FISH), 'fish poses')
    if len(sys.argv) > 1: preview(art, sys.argv[1])

def preview(art, out):
    from PIL import Image, ImageDraw
    col = {'turq': (40, 240, 220), 'pink': (255, 80, 160), 'neon': (255, 70, 20), 'white': (230, 230, 255), 'argon': (70, 120, 255), 'yellow': (255, 190, 40), 'green': (60, 255, 100)}
    names = list(art['cat']); n = len(names); cols = 8; cw, ch = 300, 300; s = 360
    img = Image.new('RGB', (cols * cw, ((n + cols - 1) // cols) * ch + 260), (12, 12, 16)); d = ImageDraw.Draw(img)
    def draw(t, ox, oy, sc, w=3):
        d.line([(ox + x * sc, oy - y * sc) for x, y in t['p']], fill=col[t['c']], width=w, joint='curve')
    for i, k in enumerate(names):
        ox, oy = (i % cols) * cw + 150, (i // cols) * ch + 200
        d.line([(ox - 140, oy), (ox + 140, oy)], fill=(40, 40, 50))
        P = art['cat'][k]
        for t in [P['outline'], P['eye'], *P['whisk'], *([P['tail']] if 'tail' in P else [])]: draw(t, ox, oy, s)
        a = P['anchor']; d.ellipse([ox + a[0] * s - 3, oy - a[1] * s - 3, ox + a[0] * s + 3, oy - a[1] * s + 3], outline=(255, 255, 0))
        d.text((ox - 140, oy - 190), k, fill=(200, 200, 200))
    y0 = ((n + cols - 1) // cols) * ch + 130
    for i, k in enumerate(art['fish']):
        for t in art['fish'][k].values(): draw(t, 100 + i * 220, y0, 450)
        d.text((40 + i * 220, y0 - 110), k, fill=(200, 200, 200))
    img.save(out)

if __name__ == '__main__':
    main()
