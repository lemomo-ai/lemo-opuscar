import numpy as np

def _circle(img, cx, cy, r, col, outline=3):
    h, w, _ = img.shape
    r_tot = r + outline
    x0, x1 = max(0, int(cx - r_tot)), min(w, int(cx + r_tot + 1))
    y0, y1 = max(0, int(cy - r_tot)), min(h, int(cy + r_tot + 1))
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.ogrid[y0:y1, x0:x1]
    d2 = (xx - cx)**2 + (yy - cy)**2
    sub = img[y0:y1, x0:x1]
    if outline > 0:
        sub[d2 <= r_tot**2] = (0.06, 0.06, 0.08)
    sub[d2 <= r**2] = col

def _box(img, x0, y0, x1, y1, col, outline=2):
    h, w, _ = img.shape
    ix0, ix1 = max(0, int(min(x0, x1))), min(w, int(max(x0, x1)))
    iy0, iy1 = max(0, int(min(y0, y1))), min(h, int(max(y0, y1)))
    if ix1 <= ix0 or iy1 <= iy0: return
    if outline > 0:
        ox0, ox1 = max(0, ix0 - outline), min(w, ix1 + outline)
        oy0, oy1 = max(0, iy0 - outline), min(h, iy1 + outline)
        img[oy0:oy1, ox0:ox1] = (0.06, 0.06, 0.08)
    img[iy0:iy1, ix0:ix1] = col

def _capsule(img, p0, p1, r, col, outline=2):
    if p0 is None or p1 is None: return
    dist = np.hypot(p1[0] - p0[0], p1[1] - p0[1])
    step_sz = max(1.5, r * 0.75)
    steps = max(2, int(dist / step_sz))
    xs = np.linspace(p0[0], p1[0], steps)
    ys = np.linspace(p0[1], p1[1], steps)
    for x, y in zip(xs, ys):
        _circle(img, x, y, r, col, outline=outline)

def draw_toon_character(img, wx, wy=None, wz=None, cam_pos=None, focal=None,
                        shirt_col=(0.18, 0.52, 0.92), hat_col=(0.35, 0.28, 0.16),
                        expr="neutral", phase=0.0, scale=1.0, flip=False, prop=None):
    """
    Renders an expressive stylized toon character.
    Supports 3D world projection (when wx, wy, wz, cam_pos, focal are provided)
    or direct 2D screen coordinates (when called with screen sx, sy).
    """
    h, w, _ = img.shape

    # Check if 2D screen space call
    if wy is None or wz is None or cam_pos is None or focal is None:
        sx, sy = wx, (wy if wy is not None else 600)
        # 2D Screen mode
        _box(img, sx - 28*scale, sy - 95*scale, sx + 28*scale, sy - 20*scale, shirt_col)
        _box(img, sx - 24*scale, sy - 20*scale, sx - 4*scale, sy + 45*scale, (0.15, 0.18, 0.25))
        _box(img, sx + 4*scale, sy - 20*scale, sx + 24*scale, sy + 45*scale, (0.15, 0.18, 0.25))
        hy = sy - 135 * scale
        _circle(img, sx, hy, 34 * scale, (0.96, 0.80, 0.68))
        eye_r = (6 if expr in ("shocked", "panic") else 4) * scale
        _circle(img, sx - 12*scale, hy - 5*scale, eye_r, (1.0, 1.0, 1.0), outline=1)
        _circle(img, sx + 12*scale, hy - 5*scale, eye_r, (1.0, 1.0, 1.0), outline=1)
        _circle(img, sx - 12*scale, hy - 5*scale, 2*scale, (0.05, 0.05, 0.05), outline=0)
        _circle(img, sx + 12*scale, hy - 5*scale, 2*scale, (0.05, 0.05, 0.05), outline=0)
        if expr in ("shocked", "panic"):
            _circle(img, sx, hy + 14*scale, 8*scale, (0.45, 0.10, 0.12), outline=2)
        else:
            _box(img, sx - 10*scale, hy + 12*scale, sx + 10*scale, hy + 16*scale, (0.1, 0.1, 0.1), outline=0)
        return

    # 3D Perspective Projection Mode
    dx, dy, dz = wx - cam_pos[0], wy - cam_pos[1], wz - cam_pos[2]
    if dz <= 0.35: return
    proj = lambda x, y, z: (w * 0.5 + ((x - cam_pos[0]) / z) * focal, h * 0.5 - ((y - cam_pos[1]) / z) * focal)

    bob = abs(np.sin(phase)) * 0.06 * scale
    p_hip  = proj(wx, wy + 0.62 * scale + bob, wz)
    p_shld = proj(wx, wy + 1.18 * scale + bob, wz)
    p_head = proj(wx, wy + 1.56 * scale + bob, wz)
    head_r = max(12, int((0.26 * scale / dz) * focal))
    body_r = max(8,  int((0.16 * scale / dz) * focal))
    limb_r = max(3,  int(head_r * 0.14))

    # Legs & Walking stride
    stride = np.sin(phase) * 0.22 * scale
    p_f1 = proj(wx - 0.12 * scale + stride, wy, wz - stride * 0.3)
    p_f2 = proj(wx + 0.12 * scale - stride, wy, wz + stride * 0.3)
    _capsule(img, p_hip, p_f1, limb_r, (0.10, 0.10, 0.12), outline=1)
    _capsule(img, p_hip, p_f2, limb_r, (0.10, 0.10, 0.12), outline=1)

    # Colored Capsule Torso
    _capsule(img, p_hip, p_shld, body_r, shirt_col, outline=max(2, limb_r))

    # Arms & Gestures
    dir_s = -1.0 if flip else 1.0
    if prop == "aim_gun":
        # Both hands forward grasping machine gun grips
        p_h1 = proj(wx + 0.18 * scale * dir_s, wy + 0.88 * scale + bob, wz)
        p_h2 = proj(wx + 0.34 * scale * dir_s, wy + 0.84 * scale + bob, wz)
    elif prop == "binoculars":
        # Hands up to eyes
        p_h1 = (p_head[0] - head_r * 0.2, p_head[1] + head_r * 0.1)
        p_h2 = (p_head[0] + head_r * 0.2, p_head[1] + head_r * 0.1)
    else:
        arm_lift = 0.25 if expr in ("angry", "panic", "shocked") else (0.10 * np.sin(phase))
        p_h1 = proj(wx - 0.28 * scale, wy + (0.85 + arm_lift) * scale + bob, wz)
        p_h2 = proj(wx + 0.32 * scale * dir_s, wy + (0.92 + arm_lift * 1.4) * scale + bob, wz)

    _capsule(img, p_shld, p_h1, limb_r, (0.10, 0.10, 0.12), outline=1)
    _capsule(img, p_shld, p_h2, limb_r, (0.10, 0.10, 0.12), outline=1)

    # Hand-held accessories
    if prop == "binoculars":
        _box(img, p_head[0]-head_r*0.4, p_head[1], p_head[0]+head_r*0.4, p_head[1]+head_r*0.25, (0.18, 0.20, 0.22), outline=2)
    elif prop == "beer_mug":
        _box(img, p_h2[0]-8, p_h2[1]-16, p_h2[0]+12, p_h2[1]+6, (0.92, 0.75, 0.22), outline=2)
        _circle(img, p_h2[0]+2, p_h2[1]-16, 8, (0.96, 0.96, 0.92), outline=1)

    # Large Expressive Head
    face_col = (1.0, 0.52, 0.48) if expr == "angry" else (0.98, 0.97, 0.95)
    hx, hy = p_head
    _circle(img, hx, hy, head_r, face_col, outline=max(3, int(head_r * 0.13)))

    # Military Slouch Hat / Hair Cap
    if hat_col is not None:
        _capsule(img, (hx - head_r * 1.25, hy - head_r * 0.55), (hx + head_r * 1.25, hy - head_r * 0.65), max(3, int(head_r * 0.22)), hat_col, outline=2)
        _capsule(img, (hx - head_r * 0.65, hy - head_r * 0.85), (hx + head_r * 0.65, hy - head_r * 0.85), max(4, int(head_r * 0.30)), hat_col, outline=2)

    # Eyes & Expressions
    ex_off = head_r * 0.34 * dir_s
    eye_r  = max(3, int(head_r * 0.20))
    _circle(img, hx - head_r * 0.15 + ex_off * 0.4, hy - head_r * 0.08, eye_r, (1.0, 1.0, 1.0), outline=2)
    _circle(img, hx + head_r * 0.32 + ex_off * 0.4, hy - head_r * 0.08, eye_r, (1.0, 1.0, 1.0), outline=2)
    _circle(img, hx - head_r * 0.12 + ex_off * 0.5, hy - head_r * 0.08, max(2, eye_r // 2), (0.05, 0.05, 0.08), outline=0)
    _circle(img, hx + head_r * 0.35 + ex_off * 0.5, hy - head_r * 0.08, max(2, eye_r // 2), (0.05, 0.05, 0.08), outline=0)

    if expr in ("angry", "panic", "shocked"):
        # Slanted angry brows + open shouting mouth
        _capsule(img, (hx - head_r * 0.35, hy - head_r * 0.35), (hx + head_r * 0.05, hy - head_r * 0.22), 2, (0.05, 0.05, 0.08), outline=0)
        _capsule(img, (hx + head_r * 0.55, hy - head_r * 0.35), (hx + head_r * 0.15, hy - head_r * 0.22), 2, (0.05, 0.05, 0.08), outline=0)
        _circle(img, hx + head_r * 0.12, hy + head_r * 0.38, max(4, int(head_r * 0.24)), (0.55, 0.08, 0.12), outline=2)
        if expr == "panic":
            _circle(img, hx - head_r * 0.85, hy - head_r * 0.15, max(3, int(head_r * 0.14)), (0.25, 0.85, 1.0), outline=1)
    else:
        # Confident / smug grin
        _capsule(img, (hx - head_r * 0.12, hy + head_r * 0.34), (hx + head_r * 0.34, hy + head_r * 0.30), max(2, int(head_r * 0.08)), (0.08, 0.08, 0.10), outline=0)
