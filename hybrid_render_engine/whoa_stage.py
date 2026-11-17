import numpy as np

def circle(img, cx, cy, r, col, outline=3):
    h, w, _ = img.shape
    rt = r + outline
    x0, x1 = max(0, int(cx - rt)), min(w, int(cx + rt + 1))
    y0, y1 = max(0, int(cy - rt)), min(h, int(cy + rt + 1))
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.ogrid[y0:y1, x0:x1]
    d2 = (xx - cx)**2 + (yy - cy)**2
    sub = img[y0:y1, x0:x1]
    if outline > 0:
        sub[d2 <= rt**2] = (0.06, 0.06, 0.08)
    sub[d2 <= r**2] = col

def box(img, x0, y0, x1, y1, col, outline=2):
    h, w, _ = img.shape
    ix0, ix1 = max(0, int(min(x0, x1))), min(w, int(max(x0, x1)))
    iy0, iy1 = max(0, int(min(y0, y1))), min(h, int(max(y0, y1)))
    if ix1 <= ix0 or iy1 <= iy0: return
    if outline > 0:
        ox0, ox1 = max(0, ix0 - outline), min(w, ix1 + outline)
        oy0, oy1 = max(0, iy0 - outline), min(h, iy1 + outline)
        img[oy0:oy1, ox0:ox1] = (0.06, 0.06, 0.08)
    img[iy0:iy1, ix0:ix1] = col

def seg(img, p0, p1, r, col, outline=1):
    if p0 is None or p1 is None: return
    dist = np.hypot(p1[0] - p0[0], p1[1] - p0[1])
    step_sz = max(1.5, r * 0.75)
    steps = max(2, int(dist / step_sz))
    xs = np.linspace(p0[0], p1[0], steps)
    ys = np.linspace(p0[1], p1[1], steps)
    for x, y in zip(xs, ys):
        circle(img, x, y, r, col, outline=outline)

def proj(wx, wy, wz, cam_pos, focal, w=720, h=1280):
    dx, dy, dz = wx - cam_pos[0], wy - cam_pos[1], wz - cam_pos[2]
    if dz <= 0.25: return None
    return (w * 0.5 + (dx / dz) * focal, h * 0.5 - (dy / dz) * focal, dz)

# -----------------------------------------------------------------------------
# Great Emu War 3D Props & Outback Stage
# -----------------------------------------------------------------------------

def draw_emu_silhouette(img, wx, wy, wz, cam_pos, focal, phase=0.0, scale=1.0, facing_left=True):
    """Draws a running Outback emu silhouette with articulated galloping legs."""
    p_body = proj(wx, wy + 0.65 * scale, wz, cam_pos, focal)
    if not p_body: return
    h, w, _ = img.shape
    dz = p_body[2]
    sc = max(4, int(11.0 * scale / dz))
    facing = -1.0 if facing_left else 1.0

    col_sil = (0.12, 0.08, 0.08) # Outback dark silhouette

    # Animated gallop cycle
    stride1 = np.sin(phase) * 0.28 * scale
    stride2 = np.sin(phase + np.pi) * 0.28 * scale
    bob = abs(np.sin(phase * 2.0)) * 0.07 * scale

    p_hip = proj(wx, wy + (0.58 + bob) * scale, wz, cam_pos, focal)
    p_knee1 = proj(wx + stride1 * 0.6 * facing, wy + 0.32 * scale, wz, cam_pos, focal)
    p_foot1 = proj(wx + stride1 * 1.1 * facing, wy, wz, cam_pos, focal)
    p_knee2 = proj(wx + stride2 * 0.6 * facing, wy + 0.32 * scale, wz, cam_pos, focal)
    p_foot2 = proj(wx + stride2 * 1.1 * facing, wy, wz, cam_pos, focal)

    # Galloping legs
    seg(img, p_hip, p_knee1, max(2, sc // 3), col_sil, outline=0)
    seg(img, p_knee1, p_foot1, max(2, sc // 4), col_sil, outline=0)
    seg(img, p_hip, p_knee2, max(2, sc // 3), col_sil, outline=0)
    seg(img, p_knee2, p_foot2, max(2, sc // 4), col_sil, outline=0)

    # Oval feathered body
    circle(img, p_hip[0], p_hip[1], int(sc * 1.8), col_sil, outline=0)

    # Curved slender neck and head
    neck_tilt = np.sin(phase) * 0.05
    p_neck = proj(wx + (0.24 + neck_tilt) * scale * facing, wy + (1.05 + bob) * scale, wz, cam_pos, focal)
    p_head = proj(wx + (0.34 + neck_tilt) * scale * facing, wy + (1.32 + bob) * scale, wz, cam_pos, focal)
    seg(img, p_hip, p_neck, max(3, int(sc * 0.45)), col_sil, outline=0)
    seg(img, p_neck, p_head, max(3, int(sc * 0.40)), col_sil, outline=0)
    circle(img, p_head[0], p_head[1], max(4, int(sc * 0.75)), col_sil, outline=0)

    # Pointed beak
    p_beak = (p_head[0] + sc * 1.2 * facing, p_head[1] + sc * 0.1)
    seg(img, p_head, p_beak, max(2, sc // 3), col_sil, outline=0)

def draw_lewis_gun(img, wx, wy, wz, cam_pos, focal, firing=False, frame_idx=0, scale=1.0):
    """Draws a 3D-mounted Lewis light machine gun on tripod with animated firing effects."""
    p_mount = proj(wx, wy + 0.54 * scale, wz, cam_pos, focal)
    if not p_mount: return
    h, w, _ = img.shape
    dz = p_mount[2]
    sc = max(4, int(13.0 * scale / dz))
    gun_metal = (0.20, 0.22, 0.24)
    dark_iron = (0.10, 0.11, 0.12)

    # Tripod legs
    p_l1 = proj(wx - 0.24 * scale, wy, wz - 0.12 * scale, cam_pos, focal)
    p_l2 = proj(wx + 0.24 * scale, wy, wz - 0.12 * scale, cam_pos, focal)
    p_l3 = proj(wx, wy, wz + 0.30 * scale, cam_pos, focal)
    seg(img, p_mount, p_l1, max(2, sc // 4), dark_iron, outline=1)
    seg(img, p_mount, p_l2, max(2, sc // 4), dark_iron, outline=1)
    seg(img, p_mount, p_l3, max(2, sc // 4), dark_iron, outline=1)

    # Mount swivel collar
    circle(img, p_mount[0], p_mount[1], max(3, sc // 2), dark_iron, outline=1)

    # Recoil offset when firing
    recoil = (np.sin(frame_idx * 1.8) * 0.04 * scale) if firing else 0.0
    gx = wx + recoil

    # Receiver & Breech block
    p_rec_back = proj(gx - 0.20 * scale, wy + 0.56 * scale, wz, cam_pos, focal)
    p_rec_front = proj(gx + 0.18 * scale, wy + 0.56 * scale, wz, cam_pos, focal)
    seg(img, p_rec_back, p_rec_front, max(3, int(sc * 0.7)), gun_metal, outline=2)

    # Iconic Lewis cooling shroud / tubular radiator barrel casing
    p_shroud_end = proj(gx + 0.72 * scale, wy + 0.56 * scale, wz, cam_pos, focal)
    seg(img, p_rec_front, p_shroud_end, max(4, int(sc * 0.85)), gun_metal, outline=2)

    # Barrel muzzle & recoil booster cone
    p_muzzle = proj(gx + 0.82 * scale, wy + 0.56 * scale, wz, cam_pos, focal)
    seg(img, p_shroud_end, p_muzzle, max(2, int(sc * 0.45)), dark_iron, outline=1)

    # Iconic circular pan drum magazine (mounted flat on top of receiver)
    p_drum = proj(gx + 0.05 * scale, wy + 0.74 * scale, wz, cam_pos, focal)
    circle(img, p_drum[0], p_drum[1], int(sc * 1.15), (0.28, 0.30, 0.32), outline=2)
    circle(img, p_drum[0], p_drum[1], max(2, sc // 3), dark_iron, outline=1)

    # Rear spade grip / wooden stock
    p_stock = proj(gx - 0.42 * scale, wy + 0.48 * scale, wz, cam_pos, focal)
    seg(img, p_rec_back, p_stock, max(3, int(sc * 0.45)), (0.42, 0.26, 0.16), outline=1)

    # Firing muzzle flash & ejected brass casings
    if firing and p_muzzle:
        mx, my = p_muzzle[0], p_muzzle[1]
        flash_sz = int(sc * (2.8 + (frame_idx % 3) * 0.6))
        # Jagged muzzle flash starburst
        circle(img, mx + flash_sz * 0.4, my, int(flash_sz * 0.85), (1.0, 0.45, 0.10), outline=0)
        circle(img, mx + flash_sz * 0.6, my, int(flash_sz * 0.55), (1.0, 0.90, 0.25), outline=0)
        circle(img, mx + flash_sz * 0.8, my, int(flash_sz * 0.30), (1.0, 1.0, 0.95), outline=0)
        # Smoke puff
        circle(img, mx + flash_sz * 1.2, my - flash_sz * 0.3, int(flash_sz * 0.50), (0.75, 0.75, 0.78), outline=0)
        # Flying ejected brass casings
        for k in range(3):
            bx = p_drum[0] - sc * (0.4 + k * 0.5)
            by = p_drum[1] - sc * (0.8 + (k % 2) * 0.4)
            box(img, bx - 3, by - 2, bx + 3, by + 2, (0.95, 0.82, 0.22), outline=1)

def render_outback_stage(img, cam_pos, focal, frame_idx=0, show_flock=True):
    h, w, _ = img.shape
    # Warm sunset sky + terracotta Outback hills + golden wheat field
    img[:int(h*0.30), :] = (0.86, 0.48, 0.14)
    yy, xx = np.ogrid[:h, :w]
    hill_y = h * (0.28 + 0.04 * np.sin(xx / 180.0 + cam_pos[0] * 0.3))
    img[(yy >= hill_y) & (yy < h * 0.52)] = (0.78, 0.30, 0.06)
    img[int(h * 0.52):, :] = (0.92, 0.62, 0.22)

    # Green bush clusters on hill ridge
    for bx, by in [(0.18, 0.27), (0.24, 0.28), (0.82, 0.25), (0.88, 0.26)]:
        circle(img, w * bx - cam_pos[0] * 35, h * by, 26, (0.22, 0.56, 0.18), outline=3)

    # Outback eucalyptus / ghost gum tree silhouettes
    for tx, tz in [(-2.8, 8.5), (3.0, 9.2)]:
        p_root = proj(tx, 0.0, tz, cam_pos, focal, w, h)
        p_top = proj(tx, 2.8, tz, cam_pos, focal, w, h)
        if p_root and p_top:
            seg(img, p_root, p_top, max(3, int(18.0 / tz)), (0.90, 0.88, 0.85), outline=1)
            circle(img, p_top[0], p_top[1] - 15, max(14, int(90.0 / tz)), (0.32, 0.44, 0.24), outline=2)
            circle(img, p_top[0] + 18, p_top[1] - 8, max(12, int(75.0 / tz)), (0.36, 0.48, 0.26), outline=2)

    # Distant emu silhouettes galloping across ridge
    if show_flock:
        flock_phase = frame_idx * 0.35
        for i, fx in enumerate([-2.2, -1.4, -0.6, 0.4, 1.2, 2.0]):
            wx = fx + np.sin(flock_phase * 0.5 + i) * 0.2
            draw_emu_silhouette(img, wx, 0.72, 11.5 + (i % 2) * 0.8, cam_pos, focal, phase=flock_phase + i * 1.1, scale=0.65)

    # Golden wheat stalks across field
    rng = np.random.RandomState(42)
    for _ in range(80):
        wx = rng.uniform(-3.2, 3.2)
        wz = rng.uniform(3.2, 11.5)
        p0 = proj(wx, 0.0, wz, cam_pos, focal, w, h)
        p1 = proj(wx + 0.03 * np.sin(frame_idx * 0.2 + wx), 0.32, wz, cam_pos, focal, w, h)
        if p0 and p1 and p0[1] > h * 0.50:
            seg(img, p0, p1, max(1, int(3.0 / p0[2])), (0.98, 0.82, 0.28), outline=0)

    # White wooden ranch fence across z = 6.2
    fz = 6.2
    for r_y in (0.42, 0.78):
        pl = proj(-3.5, r_y, fz, cam_pos, focal, w, h)
        pr = proj(3.5,  r_y, fz, cam_pos, focal, w, h)
        if pl and pr:
            box(img, pl[0], pl[1] - 6, pr[0], pr[1] + 6, (0.94, 0.94, 0.92), outline=2)
    for px in np.arange(-3.0, 3.2, 0.85):
        pb = proj(px, 0.0, fz, cam_pos, focal, w, h)
        pt = proj(px, 0.95, fz, cam_pos, focal, w, h)
        if pb and pt:
            box(img, pb[0] - 7, pt[1], pb[0] + 7, pb[1], (0.96, 0.96, 0.94), outline=2)

    # Olive military ammo crates on left foreground
    for cx, cz, cw, ch in [(-1.35, 4.4, 0.55, 0.45), (-1.25, 4.1, 0.42, 0.32)]:
        p_bl = proj(cx - cw*0.5, 0.0, cz, cam_pos, focal, w, h)
        p_tr = proj(cx + cw*0.5, ch,  cz, cam_pos, focal, w, h)
        if p_bl and p_tr:
            box(img, p_bl[0], p_tr[1], p_tr[0], p_bl[1], (0.28, 0.36, 0.18), outline=3)

# -----------------------------------------------------------------------------
# Eiffel Tower Con Props & Parisian Stage
# -----------------------------------------------------------------------------

def draw_scrap_cart(img, wx, wy, wz, cam_pos, focal, scale=1.0):
    """Draws a Parisian scrap metal cart loaded with Eiffel Tower iron trusses."""
    p_base = proj(wx, wy + 0.20 * scale, wz, cam_pos, focal)
    if not p_base: return
    dz = p_base[2]
    sc = max(4, int(12.0 * scale / dz))

    # Wheels
    p_w1 = proj(wx - 0.45 * scale, wy + 0.18 * scale, wz, cam_pos, focal)
    p_w2 = proj(wx + 0.45 * scale, wy + 0.18 * scale, wz, cam_pos, focal)
    if p_w1 and p_w2:
        circle(img, p_w1[0], p_w1[1], int(sc * 1.1), (0.22, 0.20, 0.18), outline=2)
        circle(img, p_w2[0], p_w2[1], int(sc * 1.1), (0.22, 0.20, 0.18), outline=2)
        circle(img, p_w1[0], p_w1[1], max(2, sc // 3), (0.40, 0.38, 0.36), outline=1)
        circle(img, p_w2[0], p_w2[1], max(2, sc // 3), (0.40, 0.38, 0.36), outline=1)

    # Wooden cart bed
    p_bl = proj(wx - 0.65 * scale, wy + 0.22 * scale, wz, cam_pos, focal)
    p_tr = proj(wx + 0.65 * scale, wy + 0.52 * scale, wz, cam_pos, focal)
    if p_bl and p_tr:
        box(img, p_bl[0], p_tr[1], p_tr[0], p_bl[1], (0.48, 0.34, 0.20), outline=3)

    # Piles of cut Eiffel Tower steel girders & rivets
    iron_col = (0.36, 0.32, 0.30)
    rust_col = (0.58, 0.28, 0.16)
    p_g1 = proj(wx - 0.55 * scale, wy + 0.54 * scale, wz, cam_pos, focal)
    p_g2 = proj(wx + 0.60 * scale, wy + 0.72 * scale, wz, cam_pos, focal)
    seg(img, p_g1, p_g2, max(4, int(sc * 0.65)), iron_col, outline=2)
    p_g3 = proj(wx - 0.35 * scale, wy + 0.75 * scale, wz, cam_pos, focal)
    p_g4 = proj(wx + 0.45 * scale, wy + 0.56 * scale, wz, cam_pos, focal)
    seg(img, p_g3, p_g4, max(4, int(sc * 0.55)), rust_col, outline=2)

    # Rivet details
    for frac in (0.25, 0.5, 0.75):
        pr = proj(wx - 0.55*scale + frac*1.1*scale, wy + 0.54*scale + frac*0.18*scale, wz, cam_pos, focal)
        if pr:
            circle(img, pr[0], pr[1], max(2, sc // 4), (0.12, 0.10, 0.10), outline=0)

    # Scrap dealer sign: "DÉMOLITION EIFFEL"
    p_sbl = proj(wx - 0.45 * scale, wy + 0.30 * scale, wz, cam_pos, focal)
    p_str = proj(wx + 0.45 * scale, wy + 0.46 * scale, wz, cam_pos, focal)
    if p_sbl and p_str:
        box(img, p_sbl[0], p_str[1], p_str[0], p_sbl[1], (0.92, 0.88, 0.78), outline=1)

def draw_blowtorch_cutting(img, wx, wy, wz, cam_pos, focal, frame_idx=0):
    """Draws an active oxy-acetylene cutting blowtorch with spark shower."""
    p_tip = proj(wx, wy, wz, cam_pos, focal)
    if not p_tip: return
    tx, ty = p_tip[0], p_tip[1]

    # Blue-white high-intensity flame core
    circle(img, tx, ty, 8, (0.42, 0.75, 1.0), outline=0)
    circle(img, tx, ty, 4, (0.95, 0.98, 1.0), outline=0)

    # Shower of glowing golden-orange sparks flying downward
    rng = np.random.RandomState(frame_idx)
    for _ in range(16):
        dx = rng.uniform(-18, 18) + (rng.uniform(-2, 2) * (frame_idx % 4))
        dy = rng.uniform(4, 38)
        circle(img, tx + dx, ty + dy, rng.randint(2, 4), (1.0, rng.uniform(0.6, 0.9), 0.15), outline=0)

def render_paris_stage(img, cam_pos, focal, frame_idx=0, wrecking_ball=False, show_scrap=True):
    h, w, _ = img.shape
    # Parisian twilight sky + Haussmann skyline + Champ de Mars park + cobblestone plaza
    img[:int(h*0.34), :] = (0.24, 0.28, 0.52)
    img[int(h*0.34):int(h*0.48), :] = (0.88, 0.56, 0.34)
    yy, xx = np.ogrid[:h, :w]
    roof_y = h * (0.44 + 0.03 * np.sin(xx / 90.0 + cam_pos[0] * 0.4))
    img[(yy >= roof_y) & (yy < h * 0.54)] = (0.18, 0.20, 0.30)
    img[int(h * 0.54):, :] = (0.44, 0.45, 0.50)

    # Park trees flanking the plaza
    for tx in (-2.4, -1.8, 1.8, 2.4):
        pt = proj(tx, 1.25, 7.5, cam_pos, focal, w, h)
        pb = proj(tx, 0.0,  7.5, cam_pos, focal, w, h)
        if pt and pb:
            box(img, pb[0]-8, pt[1], pb[0]+8, pb[1], (0.34, 0.22, 0.14), outline=2)
            circle(img, pt[0], pt[1], max(18, int(90/pt[2])), (0.18, 0.48, 0.22), outline=3)

    # 3D Eiffel Tower lattice silhouette at z = 8.2
    tz = 8.2
    p_top = proj(0.0, 4.3, tz, cam_pos, focal, w, h)
    p_m1l = proj(-0.32, 2.4, tz, cam_pos, focal, w, h)
    p_m1r = proj(0.32,  2.4, tz, cam_pos, focal, w, h)
    p_b1l = proj(-0.95, 0.0, tz, cam_pos, focal, w, h)
    p_b1r = proj(0.95,  0.0, tz, cam_pos, focal, w, h)
    if all([p_top, p_m1l, p_m1r, p_b1l, p_b1r]):
        iron = (0.28, 0.24, 0.22)
        seg(img, p_top, p_m1l, 5, iron, outline=2)
        seg(img, p_top, p_m1r, 5, iron, outline=2)
        seg(img, p_m1l, p_b1l, 7, iron, outline=2)
        seg(img, p_m1r, p_b1r, 7, iron, outline=2)
        box(img, p_m1l[0]-10, p_m1l[1]-6, p_m1r[0]+10, p_m1r[1]+6, (0.36, 0.30, 0.26), outline=2)
        # Cross girders
        for frac in (0.35, 0.70):
            xl = -0.95 + (0.95 - 0.32) * frac
            yl = 2.4 * frac
            pl = proj(xl, yl, tz, cam_pos, focal, w, h)
            pr = proj(-xl, yl, tz, cam_pos, focal, w, h)
            if pl and pr:
                seg(img, pl, pr, 3, iron, outline=1)

    if show_scrap:
        draw_scrap_cart(img, 1.4, 0.0, 5.8, cam_pos, focal, scale=0.95)
        draw_blowtorch_cutting(img, 1.1, 0.62, 5.6, cam_pos, focal, frame_idx=frame_idx)

    if wrecking_ball and p_top:
        swing = np.sin(frame_idx * 0.35) * 0.95
        pb_end = proj(swing, 2.1, tz - 0.5, cam_pos, focal, w, h)
        pb_anc = proj(0.8, 3.8, tz - 0.5, cam_pos, focal, w, h)
        if pb_end and pb_anc:
            seg(img, pb_anc, pb_end, 3, (0.12, 0.12, 0.14), outline=0)
            circle(img, pb_end[0], pb_end[1], 24, (0.16, 0.16, 0.18), outline=3)

# -----------------------------------------------------------------------------
# London Beer Flood Props & Stage
# -----------------------------------------------------------------------------

def draw_beer_barrel(img, wx, wy, wz, cam_pos, focal, rot=0.0, floating=False, scale=1.0):
    """Draws an oak beer barrel with double iron hoops and bung hole."""
    p_center = proj(wx, wy + 0.35 * scale, wz, cam_pos, focal)
    if not p_center: return
    dz = p_center[2]
    sc = max(4, int(14.0 * scale / dz))
    bw, bh = int(sc * 1.5), int(sc * 2.2)

    cx, cy = p_center[0], p_center[1]
    oak_body = (0.54, 0.34, 0.18)
    iron_hoop = (0.18, 0.18, 0.20)

    # Barrel body
    box(img, cx - bw, cy - bh, cx + bw, cy + bh, oak_body, outline=3)
    # Bulging barrel staves
    circle(img, cx - bw * 0.9, cy, int(bh * 0.65), oak_body, outline=0)
    circle(img, cx + bw * 0.9, cy, int(bh * 0.65), oak_body, outline=0)

    # Double iron hoops top and bottom
    for hy in [cy - bh * 0.65, cy - bh * 0.28, cy + bh * 0.28, cy + bh * 0.65]:
        box(img, cx - bw - 2, hy - 3, cx + bw + 2, hy + 3, iron_hoop, outline=1)

    # Cork bung stopper
    circle(img, cx, cy, max(2, sc // 4), (0.75, 0.55, 0.30), outline=1)

def render_london_beer_flood_stage(img, cam_pos, focal, frame_idx=0, flood_level=0.0):
    """Renders the 1814 St. Giles London streetscape and rising beer wave flood."""
    h, w, _ = img.shape
    # Moody overcast London twilight sky + Georgian brick facades
    img[:int(h*0.35), :] = (0.32, 0.35, 0.40)
    yy, xx = np.ogrid[:h, :w]
    chimney_y = h * (0.35 + 0.02 * np.sin(xx / 60.0))
    img[(yy >= chimney_y) & (yy < h * 0.55)] = (0.42, 0.22, 0.18) # Red brick
    img[int(h * 0.55):, :] = (0.30, 0.30, 0.32) # Cobblestones

    # Ruptured Meux & Co Horseshoe Brewery giant wooden vat at z = 7.5
    vat_z = 7.5
    p_vl = proj(-1.8, 0.0, vat_z, cam_pos, focal, w, h)
    p_vr = proj(-0.4, 3.2, vat_z, cam_pos, focal, w, h)
    if p_vl and p_vr:
        box(img, p_vl[0], p_vr[1], p_vr[0], p_vl[1], (0.38, 0.24, 0.14), outline=3)
        # Exploded staves & burst iron hoops
        for k in (0.3, 0.6, 0.85):
            seg(img, (p_vl[0]-10, p_vl[1] - (p_vl[1]-p_vr[1])*k), (p_vr[0]+15, p_vl[1] - (p_vl[1]-p_vr[1])*k), 4, (0.15, 0.15, 0.18), outline=1)

    # Street gas lamps
    for lx in (-2.2, 2.2):
        p_base = proj(lx, 0.0, 5.5, cam_pos, focal, w, h)
        p_lamp = proj(lx, 1.8, 5.5, cam_pos, focal, w, h)
        if p_base and p_lamp:
            seg(img, p_base, p_lamp, 4, (0.12, 0.12, 0.15), outline=1)
            circle(img, p_lamp[0], p_lamp[1], 12, (0.98, 0.90, 0.50), outline=2)

    # Beer flood wave torrent
    flood_h = int(h * (0.55 - min(0.35, flood_level * 0.30)))
    if flood_h < h:
        # Dark porter/stout beer liquid mass
        porter_col = (0.22, 0.10, 0.04)
        img[flood_h:, :] = porter_col

        # Frothing churning beer wave crests
        wave_y = flood_h + int(14 * np.sin(xx / 45.0 + frame_idx * 0.4))
        foam_mask = (yy >= wave_y - 12) & (yy <= wave_y + 14)
        img[foam_mask] = (0.92, 0.86, 0.72) # Creamy stout foam head

        # Floating tumbling beer barrels
        draw_beer_barrel(img, -0.6, flood_level * 0.8, 4.8, cam_pos, focal, rot=frame_idx*0.1, floating=True)
        draw_beer_barrel(img, 0.8, flood_level * 0.9, 4.2, cam_pos, focal, rot=-frame_idx*0.15, floating=True)

# -----------------------------------------------------------------------------
# Roman Beach Stage & Characters
# -----------------------------------------------------------------------------

def render_roman_beach_stage(img, cam_pos, focal, frame_idx=0, shells_visible=False):
    h, w, _ = img.shape
    img[:int(h*0.32), :] = (0.42, 0.74, 0.96)
    yy, xx = np.ogrid[:h, :w]
    cliff_y = h * (0.28 + 0.04 * np.cos(xx / 150.0))
    img[(yy >= cliff_y) & (yy < h * 0.48)] = (0.86, 0.84, 0.76)
    img[int(h * 0.48):, :] = (0.94, 0.82, 0.54)

    # Ocean waves
    shore_x = w * (0.54 + 0.04 * np.sin(frame_idx * 0.25 + yy / 45.0))
    sea_mask = (yy >= int(h * 0.48)) & (xx >= shore_x)
    foam_mask = (yy >= int(h * 0.48)) & (xx >= shore_x - 16) & (xx < shore_x + 10)
    img[sea_mask] = (0.08, 0.44, 0.78)
    img[foam_mask] = (0.95, 0.98, 1.0)

    if shells_visible:
        rng = np.random.RandomState(7)
        for _ in range(18):
            sx = rng.uniform(-1.5, 0.6)
            sz = rng.uniform(3.2, 6.2)
            ps = proj(sx, 0.04, sz, cam_pos, focal, w, h)
            if ps:
                circle(img, ps[0], ps[1], max(5, int(24/ps[2])), (0.98, 0.76, 0.84), outline=2)

def draw_character(img, wx, wy, wz, cam_pos, focal, role="major", expr="smug", phase=0.0, scale=1.0):
    p_hip  = proj(wx, wy + 0.62 * scale, wz, cam_pos, focal)
    p_shld = proj(wx, wy + 1.18 * scale, wz, cam_pos, focal)
    p_head = proj(wx, wy + 1.58 * scale, wz, cam_pos, focal)
    if not all([p_hip, p_shld, p_head]): return
    dz = p_head[2]
    hr = max(16, int((0.28 * scale / dz) * focal))
    br = max(10, int((0.17 * scale / dz) * focal))
    lr = max(3, int(hr * 0.11))

    # Legs & Arms
    st = np.sin(phase) * 0.20 * scale
    seg(img, p_hip, proj(wx - 0.12*scale + st, wy, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    seg(img, p_hip, proj(wx + 0.12*scale - st, wy, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    lift = 0.32 if expr == "shocked" else 0.0
    seg(img, p_shld, proj(wx - 0.30*scale, wy + (0.85 + lift)*scale, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    seg(img, p_shld, proj(wx + 0.30*scale, wy + (0.85 + lift)*scale, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)

    # Outfit Torso
    if role == "minister":
        seg(img, p_hip, p_shld, br, (0.12, 0.15, 0.24), outline=3)
        circle(img, p_shld[0] - 6, p_shld[1] + 4, 5, (0.88, 0.14, 0.14), outline=1)
        circle(img, p_shld[0] + 6, p_shld[1] + 4, 5, (0.88, 0.14, 0.14), outline=1)
    elif role == "farmer":
        seg(img, p_hip, p_shld, br, (0.16, 0.34, 0.68), outline=3)
    else: # Major / Soldier
        seg(img, p_hip, p_shld, br, (0.28, 0.36, 0.18), outline=3)
        seg(img, p_shld, (p_hip[0], p_hip[1] - 4), max(2, br // 4), (0.10, 0.14, 0.08), outline=0)

    # White Circular Head
    hx, hy = p_head[0], p_head[1]
    circle(img, hx, hy, hr, (0.98, 0.98, 0.98), outline=max(3, int(hr * 0.10)))

    # Role-Specific Hats
    if role == "minister":
        box(img, hx - hr*1.1, hy - hr*0.78, hx + hr*1.1, hy - hr*0.62, (0.12, 0.12, 0.16), outline=2)
        box(img, hx - hr*0.65, hy - hr*1.35, hx + hr*0.65, hy - hr*0.75, (0.12, 0.12, 0.16), outline=2)
        box(img, hx - hr*0.65, hy - hr*0.88, hx + hr*0.65, hy - hr*0.75, (0.85, 0.15, 0.15), outline=0)
    elif role == "farmer":
        box(img, hx - hr*1.25, hy - hr*0.75, hx + hr*1.25, hy - hr*0.60, (0.95, 0.80, 0.32), outline=2)
        box(img, hx - hr*0.68, hy - hr*1.12, hx + hr*0.68, hy - hr*0.72, (0.95, 0.80, 0.32), outline=2)
    elif role == "major":
        circle(img, hx, hy - hr*0.58, int(hr*0.88), (0.26, 0.34, 0.18), outline=3)
        box(img, hx - hr*1.05, hy - hr*0.58, hx + hr*1.05, hy - hr*0.44, (0.92, 0.94, 0.92), outline=2)
        box(img, hx - hr*0.95, hy - hr*0.46, hx + hr*0.95, hy - hr*0.36, (0.14, 0.42, 0.22), outline=1)
    else:
        circle(img, hx, hy - hr*0.62, int(hr*0.85), (0.28, 0.38, 0.22), outline=3)

    # Eyes & Expressions
    er = max(4, int(hr * 0.21))
    ex1, ex2, ey = hx - hr*0.30, hx + hr*0.30, hy - hr*0.06
    circle(img, ex1, ey, er, (1.0, 1.0, 1.0), outline=2)
    circle(img, ex2, ey, er, (1.0, 1.0, 1.0), outline=2)
    circle(img, ex1, ey, max(2, er//2), (0.05, 0.05, 0.08), outline=0)
    circle(img, ex2, ey, max(2, er//2), (0.05, 0.05, 0.08), outline=0)

    if expr == "smug":
        box(img, ex1 - er, ey - er, ex1 + er, ey - 1, (0.94, 0.94, 0.94), outline=1)
        box(img, ex2 - er, ey - er, ex2 + er, ey - 1, (0.94, 0.94, 0.94), outline=1)
    elif expr in ("angry", "sweat"):
        seg(img, (ex1 - er, ey - er*1.4), (ex1 + er*0.8, ey - er*0.9), 2, (0.06, 0.06, 0.08), outline=0)
        seg(img, (ex2 + er, ey - er*1.4), (ex2 - er*0.8, ey - er*0.9), 2, (0.06, 0.06, 0.08), outline=0)
        if expr == "sweat":
            circle(img, hx + hr*0.75, hy - hr*0.25, max(4, int(hr*0.14)), (0.35, 0.85, 1.0), outline=1)

    # Mustache & Mouth
    if role in ("major", "minister", "farmer"):
        seg(img, (hx - hr*0.34, hy + hr*0.32), (hx - hr*0.05, hy + hr*0.24), max(3, int(hr*0.09)), (0.28, 0.24, 0.20), outline=0)
        seg(img, (hx + hr*0.05, hy + hr*0.24), (hx + hr*0.34, hy + hr*0.32), max(3, int(hr*0.09)), (0.28, 0.24, 0.20), outline=0)
    if expr == "shocked":
        circle(img, hx, hy + hr*0.50, max(5, int(hr*0.18)), (0.45, 0.10, 0.12), outline=2)
    else:
        seg(img, (hx - hr*0.18, hy + hr*0.48), (hx + hr*0.18, hy + hr*0.46), 2, (0.08, 0.08, 0.10), outline=0)

def draw_emu_whoa(img, wx, wy, wz, cam_pos, focal, phase=0.0, beret=False):
    bob = abs(np.sin(phase)) * 0.08
    pb = proj(wx, wy + 0.72 + bob, wz, cam_pos, focal)
    ph = proj(wx + 0.18, wy + 1.38 + bob, wz, cam_pos, focal)
    if not pb or not ph: return
    sc = max(5, int(11.0 / pb[2]))
    st = np.sin(phase) * 0.16
    seg(img, pb, proj(wx + st, wy, wz, cam_pos, focal), max(2, sc//3), (0.08, 0.08, 0.10), outline=0)
    seg(img, pb, proj(wx - st, wy, wz, cam_pos, focal), max(2, sc//3), (0.08, 0.08, 0.10), outline=0)
    circle(img, pb[0], pb[1], int(sc * 1.9), (0.36, 0.24, 0.14), outline=3)
    seg(img, pb, ph, max(4, int(sc * 0.55)), (0.42, 0.54, 0.72), outline=2)
    circle(img, ph[0], ph[1], int(sc * 1.05), (0.42, 0.54, 0.72), outline=2)
    circle(img, ph[0] + sc*0.25, ph[1] - sc*0.15, max(3, sc//2), (1.0, 1.0, 1.0), outline=1)
    circle(img, ph[0] + sc*0.30, ph[1] - sc*0.15, max(2, sc//4), (0.05, 0.05, 0.08), outline=0)
    seg(img, (ph[0] + sc*0.8, ph[1]), (ph[0] + sc*1.9, ph[1] + sc*0.2), max(3, sc//3), (0.96, 0.65, 0.15), outline=1)
    if beret:
        box(img, ph[0] - sc*0.9, ph[1] - sc*1.25, ph[0] + sc*0.8, ph[1] - sc*0.85, (0.78, 0.16, 0.14), outline=2)

def draw_red_stamp(img, text_tag="MILITARY ACTION", cy_ratio=0.22):
    h, w, _ = img.shape
    bw, bh = 420, 64
    x0, y0 = w // 2 - bw // 2, int(h * cy_ratio)
    box(img, x0, y0, x0 + bw, y0 + bh, (0.92, 0.55, 0.20), outline=0)
    img[y0:y0+6, x0:x0+bw] = (0.86, 0.14, 0.14)
    img[y0+bh-6:y0+bh, x0:x0+bw] = (0.86, 0.14, 0.14)
    img[y0:y0+bh, x0:x0+6] = (0.86, 0.14, 0.14)
    img[y0:y0+bh, x0+bw-6:x0+bw] = (0.86, 0.14, 0.14)

def draw_extra_character(img, wx, wy, wz, cam_pos, focal, role="conman", expr="smug", phase=0.0, scale=1.0, prop=None):
    p_hip  = proj(wx, wy + 0.62 * scale, wz, cam_pos, focal)
    p_shld = proj(wx, wy + 1.18 * scale, wz, cam_pos, focal)
    p_head = proj(wx, wy + 1.58 * scale, wz, cam_pos, focal)
    if not all([p_hip, p_shld, p_head]): return
    dz = p_head[2]
    hr = max(16, int((0.28 * scale / dz) * focal))
    br = max(10, int((0.17 * scale / dz) * focal))
    lr = max(3, int(hr * 0.11))

    st = np.sin(phase) * 0.20 * scale
    seg(img, p_hip, proj(wx - 0.12*scale + st, wy, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    seg(img, p_hip, proj(wx + 0.12*scale - st, wy, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    seg(img, p_shld, proj(wx - 0.30*scale, wy + 0.85*scale, wz, cam_pos, focal), lr, (0.06, 0.06, 0.08), outline=0)
    p_rhand = proj(wx + 0.32*scale, wy + 0.88*scale, wz, cam_pos, focal)
    seg(img, p_shld, p_rhand, lr, (0.06, 0.06, 0.08), outline=0)

    # Torso & Outfit
    if role == "conman":
        seg(img, p_hip, p_shld, br, (0.12, 0.12, 0.16), outline=3)
        seg(img, p_shld, (p_hip[0], p_hip[1]-4), max(2, br//4), (0.85, 0.14, 0.18), outline=0)
    elif role == "buyer":
        seg(img, p_hip, p_shld, br, (0.46, 0.30, 0.18), outline=3)
    elif role == "emperor":
        seg(img, p_hip, p_shld, br, (0.52, 0.12, 0.68), outline=3)
        seg(img, (p_shld[0]-br, p_shld[1]), (p_hip[0]+br, p_hip[1]), max(3, br//3), (0.96, 0.80, 0.18), outline=1)
    else:
        seg(img, p_hip, p_shld, br, (0.76, 0.14, 0.14), outline=3)

    # Head
    hx, hy = p_head[0], p_head[1]
    face_c = (1.0, 0.62, 0.58) if expr == "angry" else (0.98, 0.98, 0.98)
    circle(img, hx, hy, hr, face_c, outline=max(3, int(hr * 0.10)))

    # Hats / Helmets
    if role == "conman":
        box(img, hx - hr*1.15, hy - hr*0.76, hx + hr*1.15, hy - hr*0.60, (0.14, 0.14, 0.18), outline=2)
        box(img, hx - hr*0.68, hy - hr*1.15, hx + hr*0.68, hy - hr*0.72, (0.14, 0.14, 0.18), outline=2)
        box(img, hx - hr*0.68, hy - hr*0.84, hx + hr*0.68, hy - hr*0.72, (0.88, 0.72, 0.20), outline=0)
    elif role == "buyer":
        box(img, hx - hr*1.05, hy - hr*0.72, hx + hr*1.05, hy - hr*0.58, (0.32, 0.22, 0.14), outline=2)
        circle(img, hx, hy - hr*0.72, int(hr*0.68), (0.32, 0.22, 0.14), outline=2)
    elif role == "emperor":
        seg(img, (hx - hr*0.85, hy - hr*0.55), (hx + hr*0.85, hy - hr*0.55), max(4, int(hr*0.14)), (0.96, 0.82, 0.16), outline=2)
    else:
        circle(img, hx, hy - hr*0.52, int(hr*0.86), (0.82, 0.68, 0.28), outline=3)
        box(img, hx - hr*0.20, hy - hr*1.32, hx + hr*0.20, hy - hr*0.75, (0.88, 0.14, 0.16), outline=2)

    # Eyes & Eyebrows
    er = max(4, int(hr * 0.21))
    ex1, ex2, ey = hx - hr*0.30, hx + hr*0.30, hy - hr*0.06
    circle(img, ex1, ey, er, (1.0, 1.0, 1.0), outline=2)
    circle(img, ex2, ey, er, (1.0, 1.0, 1.0), outline=2)
    circle(img, ex1, ey, max(2, er//2), (0.05, 0.05, 0.08), outline=0)
    circle(img, ex2, ey, max(2, er//2), (0.05, 0.05, 0.08), outline=0)

    if expr == "smug":
        box(img, ex1 - er, ey - er, ex1 + er, ey - 1, (0.94, 0.94, 0.94), outline=1)
        box(img, ex2 - er, ey - er, ex2 + er, ey - 1, (0.94, 0.94, 0.94), outline=1)
    elif expr in ("angry", "sweat"):
        seg(img, (ex1 - er, ey - er*1.4), (ex1 + er*0.8, ey - er*0.9), 2, (0.06, 0.06, 0.08), outline=0)
        seg(img, (ex2 + er, ey - er*1.4), (ex2 - er*0.8, ey - er*0.9), 2, (0.06, 0.06, 0.08), outline=0)
        if expr == "sweat":
            circle(img, hx + hr*0.75, hy - hr*0.25, max(4, int(hr*0.14)), (0.35, 0.85, 1.0), outline=1)

    if role in ("conman", "buyer"):
        seg(img, (hx - hr*0.32, hy + hr*0.30), (hx + hr*0.32, hy + hr*0.30), max(2, int(hr*0.08)), (0.14, 0.12, 0.12), outline=0)
    if expr == "shocked":
        circle(img, hx, hy + hr*0.48, max(5, int(hr*0.18)), (0.45, 0.10, 0.12), outline=2)
    else:
        seg(img, (hx - hr*0.18, hy + hr*0.46), (hx + hr*0.18, hy + hr*0.44), 2, (0.08, 0.08, 0.10), outline=0)

    # Held Props
    if prop == "briefcase" and p_rhand:
        box(img, p_rhand[0]-18, p_rhand[1]-6, p_rhand[0]+18, p_rhand[1]+20, (0.96, 0.78, 0.18), outline=2)
    elif prop == "gladius" and p_rhand:
        thrust = max(0.0, np.sin(phase)) * 28.0
        box(img, p_rhand[0]-26, p_rhand[1]-22, p_rhand[0]-4, p_rhand[1]+22, (0.78, 0.14, 0.14), outline=2)
        seg(img, (p_rhand[0]+4, p_rhand[1]), (p_rhand[0]+42+thrust, p_rhand[1]+26+thrust), 4, (0.88, 0.90, 0.95), outline=1)
        if thrust > 16:
            circle(img, p_rhand[0]+48+thrust, p_rhand[1]+26+thrust, 12, (0.92, 0.98, 1.0), outline=0)
