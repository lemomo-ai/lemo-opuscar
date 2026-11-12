"""Green-screen key: alpha = 1 − (how far G − max(R,B) exceeds the threshold), despill, shrink the edge by 1 px, crop to the content box.
Usage: python tools/key.py <in.png> <out.png>   (also writes <out>.json: source size and crop offset)"""
import sys, json
import numpy as np
from PIL import Image
from scipy.ndimage import minimum_filter, uniform_filter
src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx = np.maximum(r, b)
gn = g - mx
a = 1 - np.clip((gn - 12) / 60, 0, 1)
a = minimum_filter(a, size=3)                  # trim a ring of green edge
a = uniform_filter(a, size=2)
spill = gn > 0
g2 = np.where(spill, (r + b) / 2, g)   # despill: greenish edge pixels get G pulled down to (R+B)/2, so the green halo becomes a warm rim light
out = np.dstack([r, g2, b, a * 255]).clip(0, 255).astype(np.uint8)
ys, xs = np.where(a > .02)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
Image.fromarray(out[y0:y1, x0:x1], 'RGBA').save(dst, optimize=True)
json.dump({'w': im.shape[1], 'h': im.shape[0], 'x0': int(x0), 'y0': int(y0)}, open(dst[:-4] + '.json', 'w'))
print(dst, x1 - x0, y1 - y0, 'offset', x0, y0)
