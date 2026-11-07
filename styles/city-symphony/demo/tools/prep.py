"""Clip engine: source → work/clips/<id>.mp4 (frame-accurate). One function covers time-lapse speed-up, light rivers, speed ramps and slow motion:
  1. the speed curve speed(t) (a constant, or keyframes with smooth interpolation) is integrated into source time pos(t);
  2. output frame i covers the source time window [pos(i/30), pos((i+1)/30));
  3. several frames in the window → average up to `blend` frames (360° shutter: headlights become lines, crowds become fog, clouds become water);
     no frame in the window (slow motion) → take the nearest frame; with interp>1, first interpolate frames with minterpolate motion compensation so slow motion doesn't stutter.
Source pre-processing: the Herder footage is scaled up 1.18× to push the top-left channel logo out of frame; the Longfellow footage has its bottom-right watermark cropped off; the Schwab time-lapse gets light denoising; the 1899 film gets denoising + light sharpening.
Usage: python tools/prep.py [id …] [--force] [-j 4]"""
import os, sys, json, math, subprocess
from concurrent.futures import ProcessPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
from shots import CLIPS, V
from timeline import FPS
os.chdir(os.path.join(HERE, '..'))

PRE = {
    'nyim': 'scale=2266:1275:flags=lanczos,crop=1920:1080:173:97',    # centred 1.18× scale-up: the top-left channel logo (x≤140 px) goes entirely out of frame
    'sky': 'hqdn3d=1.5:1.5:3:3',
    'b99': 'hqdn3d=2:2:5:5,unsharp=5:5:0.45:5:5:0',
    'empty': 'crop=1804:1014:58:0',                                   # crop off the bottom-right “© Longfellow Films” watermark (y≥1022)
    'sun': 'crop=1270:714:0:3',                                       # 1270×720 → 16:9
    'earth': 'eq=gamma=1.5:saturation=1.1',                          # the night aerial source is dark; lift the midtones
}


def src_fps(path, _c={}):
    if path not in _c:
        r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate',
                            '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
        a, b = r.split('/'); _c[path] = float(a) / float(b)
    return _c[path]


def speed_curve(sp, n):
    """Source time offset (seconds) at each output frame boundary: numerical integration of speed(t)"""
    T = n / FPS
    ts = np.linspace(0, T, n * 16 + 1)
    if isinstance(sp, (int, float)):
        v = np.full_like(ts, float(sp))
    else:
        kt = np.array([k[0] for k in sp]); kv = np.array([k[1] for k in sp])
        v = np.empty_like(ts)
        for i, t in enumerate(ts):
            if t <= kt[0]: v[i] = kv[0]; continue
            if t >= kt[-1]: v[i] = kv[-1]; continue
            j = np.searchsorted(kt, t) - 1
            u = (t - kt[j]) / (kt[j + 1] - kt[j]); u = u * u * (3 - 2 * u)
            v[i] = kv[j] + (kv[j + 1] - kv[j]) * u
    pos = np.concatenate([[0], np.cumsum((v[1:] + v[:-1]) / 2 * np.diff(ts))])
    return pos[::16]          # n+1 boundaries


def make(cid):
    c = CLIPS[cid]
    out = f'work/clips/{cid}.mp4'
    path = V[c['src']]
    R = src_fps(path) * c['interp']
    n = c['n']; W, H = c['size']
    edges = speed_curve(c['speed'], n)
    need = []                                          # per output frame: [(source frame index, weight)]
    for i in range(n):
        a, b = edges[i] * R, edges[i + 1] * R
        js = list(range(math.ceil(a - 1e-6), math.ceil(b - 1e-6)))
        if not js:                                     # slow motion: no whole frame in the window
            m = (a + b) / 2
            if c.get('mix'):                           # crossfade the two neighbouring frames by distance (cleaner than motion compensation, doesn't warp thin lines)
                j0 = int(math.floor(m)); w1 = m - j0
                need.append([(j0, 1 - w1), (j0 + 1, w1)] if w1 > .02 else [(j0, 1.0)]); continue
            js = [int(round(m))]
        if len(js) > c['blend']:
            idx = np.linspace(0, len(js) - 1, c['blend']).round().astype(int)
            js = [js[k] for k in idx]
        need.append([(j, 1 / len(js)) for j in js])
    jmax = max(max(j for j, _ in js) for js in need)
    f = []
    if c['src'] in PRE: f.append(PRE[c['src']])
    if c['interp'] > 1:
        f.append(f'minterpolate=fps={R:.4f}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1')
    f.append(f'scale={W}:{H}:flags=lanczos')
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{c["s0"]:.3f}', '-i', path, '-an', '-vf', ','.join(f),
                            '-frames:v', str(jmax + 1), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', '-pix_fmt', 'yuv420p', out + '.part.mp4'], stdin=subprocess.PIPE)
    users = {}
    for i, js in enumerate(need):
        for j, w in js: users.setdefault(j, []).append((i, w))
    left = [len(js) for js in need]
    acc = {}; nxt = 0; done = {}; last = None
    for j in range(jmax + 1):
        b = dec.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        fr = np.frombuffer(b, np.uint8).reshape(H, W, 3); last = fr
        for i, w in users.get(j, []):
            if i not in acc: acc[i] = fr.astype(np.float32) * w
            else: acc[i] += fr.astype(np.float32) * w
            left[i] -= 1
            if left[i] == 0:
                done[i] = (acc.pop(i) + .5).clip(0, 255).astype(np.uint8)
        while nxt in done:
            enc.stdin.write(done.pop(nxt).tobytes()); nxt += 1
    dec.stdout.close(); dec.wait()
    while nxt < n:      # source too short: pad with the last frame (prints a warning)
        fr = done.pop(nxt, None)
        if fr is None:
            fr = last
            print(f'  ⚠ {cid}: source ran out of frames; frame {nxt} repeats the last one', flush=True)
        enc.stdin.write(fr.tobytes()); nxt += 1
    enc.stdin.close(); enc.wait()
    os.replace(out + '.part.mp4', out)
    return f'{cid}: {n} frames from {edges[-1]:.2f} s of source, up to {max(len(j) for j in need)} frames blended'


if __name__ == '__main__':
    os.makedirs('work/clips', exist_ok=True)
    force = '--force' in sys.argv
    jobs = 4
    if '-j' in sys.argv: jobs = int(sys.argv[sys.argv.index('-j') + 1])
    only = [a for a in sys.argv[1:] if not a.startswith('-') and not a.isdigit()]
    todo = [k for k in CLIPS if (k in only) or (not only and (force or not os.path.exists(f'work/clips/{k}.mp4')))]
    with ProcessPoolExecutor(jobs) as ex:
        for msg in ex.map(make, todo):
            print(msg, flush=True)
