"""post.py: turn Manim's three light channels into a phosphor screen.

    .venv/bin/python post.py T0 T1 RAWDIR OUT.mp4        all frames of [T0, T1) -> video (piped to ffmpeg)
    .venv/bin/python post.py --still T RAWDIR OUT.png     one frame (with the persistence of the 0.5 s before it)

raw frame channels (film.py): R = beam trace, G = graticule and text, B = white-hot cores.
Per frame:
  1. persistence: the beam channels keep a short afterglow  acc = max(now, acc * DECAY)  (P31-ish, very short)
  2. colour: each channel gets its phosphor colour (palette below)
  3. bloom: four Gaussian blurs on 1/2 .. 1/16 size copies, added back (energy grows with brightness, like a real spot)
  4. saturation to white where the light piles up, a soft shoulder instead of clipping
  5. the screen: faint green ambient falloff, vignette, a little dither so the glow doesn't band in 8-bit
Shots that aren't made yet (timeline.json: done = false) come out grey.
"""
import sys, os, json, subprocess
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, os.environ.get('XPM_TL', 'timeline.json'))))
FPS = TL['fps']; W, H = 1920, 1080

# palette (sRGB 0..1)
BG     = np.array([0x01, 0x04, 0x02]) / 255     # #010402 screen black
AMBI   = np.array([0x0B, 0x24, 0x12]) / 255     # #0B2412 phosphor ambient at the centre
P_TR   = np.array([0x4D, 0xFF, 0x88]) / 255     # #4DFF88 beam phosphor
P_UI   = np.array([0x8D, 0xFF, 0xB0]) / 255     # #8DFFB0 graticule / text
P_HOT  = np.array([0xE6, 0xFF, 0xEC]) / 255     # #E6FFEC white-hot core
P_AMB  = np.array([0xFF, 0xB5, 0x47]) / 255     # #FFB547 CH2 amber: measurement cursors (PNG alpha)
DECAY = 0.0   # frame-level afterglow is OFF: at 24 fps it strobes (the trace scrolls 17 px a frame); the afterglow is drawn sub-frame in film.py
BLOOM = [(2, 1.2, 0.50), (4, 2.0, 0.42), (8, 2.6, 0.30), (16, 3.0, 0.20)]   # (downscale, sigma at that scale, weight)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r_c = np.sqrt((xx - 960) ** 2 + ((yy - 580) * 1.15) ** 2)
amb = np.clip(1 - r_c / 1150, 0, 1) ** 1.8
r_v = np.sqrt((xx - 960) ** 2 + ((yy - 540) * 1.35) ** 2)
vig = 1 - 0.55 * np.clip((r_v - 620) / 700, 0, 1) ** 1.6
SCREEN = (BG[None, None, :] + AMBI[None, None, :] * amb[..., None] * 0.55).astype(np.float32)
VIG = vig[..., None].astype(np.float32)

def done_at(t):
    for s in TL['shots']:
        if s['t0'] <= t < s['t1']: return s['done']
    return False

def bloom(src):
    acc = np.zeros_like(src)
    for ds, sg, w in BLOOM:
        sm = cv2.resize(src, (W // ds, H // ds), interpolation=cv2.INTER_AREA)
        sm = cv2.GaussianBlur(sm, (0, 0), sg)
        acc += w * cv2.resize(sm, (W, H), interpolation=cv2.INTER_LINEAR)
    return acc

def shoulder(x, k=0.78):
    return np.where(x < k, x, k + (1 - k) * (1 - np.exp(-(x - k) / (1 - k))))

class Phosphor:
    def __init__(self): self.tr = None; self.hot = None
    def frame(self, raw, k):
        amb = raw[:, :, 3:4].astype(np.float32) / 255 if raw.shape[2] == 4 else None
        rgb = raw[:, :, 2::-1].astype(np.float32) / 255  # cv2 reads BGR(A)
        R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        if self.tr is None: self.tr, self.hot = R.copy(), B.copy()
        else: self.tr = np.maximum(R, self.tr * DECAY); self.hot = np.maximum(B, self.hot * DECAY)
        tr, hot = self.tr[..., None], self.hot[..., None]; ui = G[..., None]
        light = tr * P_TR + ui * P_UI * 0.92 + hot * P_HOT
        src = tr * P_TR * 1.0 + hot * P_HOT * 1.3 + ui * P_UI * 0.22
        if amb is not None: light = light + amb * P_AMB; src = src + amb * P_AMB * 0.9
        out = SCREEN + light + bloom(src) * 0.95
        lum = out.max(axis=2, keepdims=True)
        out = out + np.clip(lum - 0.9, 0, None) * 0.30           # piled-up light goes white
        out = shoulder(out) * VIG
        if not done_at(k / FPS):                                   # placeholder shots: grey card
            g = (out @ np.array([0.30, 0.59, 0.11], np.float32))[..., None]
            out = np.repeat(g, 3, axis=2) * 0.9 + 0.04
        out = power_off(out, k / FPS)
        rng = np.random.default_rng(k)
        out = out + (rng.random((H, W, 1), dtype=np.float32) - 0.5) * (1.6 / 255)
        return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)

def power_off(img, t):
    """CRT switch-off: the picture collapses to a bright line, then to a dot that fades"""
    po = TL.get('poweroff')
    if not po or t < po[0]: return img
    a, b = po; m = a + (b - a) * 0.55
    u1 = min(1, (t - a) / (m - a)); u2 = min(1, max(0, (t - m) / (b - m)))
    sy = max(2.0, H * (1 - u1) ** 3); sx = max(3.0, W * (1 - u2) ** 3)
    small = cv2.resize(img, (max(1, int(sx)), max(1, int(sy))), interpolation=cv2.INTER_AREA) * (1 + 2.5 * u1)
    lay = np.zeros_like(img)
    y0, x0 = (H - small.shape[0]) // 2, (W - small.shape[1]) // 2
    lay[y0:y0 + small.shape[0], x0:x0 + small.shape[1]] = np.clip(small - SCREEN[:small.shape[0], :small.shape[1]], 0, None)
    lay = lay + cv2.GaussianBlur(lay, (0, 0), 6) * 1.2 + cv2.GaussianBlur(lay, (0, 0), 24) * 1.2
    if t > b: lay = lay * max(0.0, 1 - (t - b) / 0.2)
    scr = SCREEN * max(0.0, 1 - u1)                                  # the screen glow dies with the picture
    return np.clip(scr + lay, 0, 1)

def raw_path(d, k): return os.path.join(d, f'f{k:05d}.png')

def video(T0, T1, rawdir, out):
    k0, k1 = int(round(T0 * FPS)), int(round(T1 * FPS))
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    ph = Phosphor()
    for k in range(k0, k1):
        img = cv2.imread(raw_path(rawdir, k), cv2.IMREAD_UNCHANGED)
        if img is None: raise SystemExit(f'post.py: missing raw frame {raw_path(rawdir, k)}')
        ff.stdin.write(ph.frame(img, k).tobytes())
    ff.stdin.close()
    if ff.wait() != 0: raise SystemExit('post.py: ffmpeg failed')

def still(T, rawdir, out):
    k = int(round(T * FPS)); ph = Phosphor(); o = None
    for j in range(max(0, k - 12), k + 1):
        if not os.path.exists(raw_path(rawdir, j)): continue
        img = cv2.imread(raw_path(rawdir, j), cv2.IMREAD_UNCHANGED)
        if img is None: continue
        o = ph.frame(img, j)
    cv2.imwrite(out, o[:, :, ::-1])

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--still': still(float(a[1]), a[2], a[3])
    else: video(float(a[0]), float(a[1]), a[2], a[3])
