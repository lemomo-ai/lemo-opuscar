"""Flicker metric over exact consecutive frames: for each triple, the share of pixels whose middle value departs from the
average of its neighbours by more than 40 levels AND is not explained by monotone motion (it's a spike: brighter or darker than both)."""
import sys, glob, numpy as np
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f_*.png'))
F = [np.asarray(Image.open(f).convert('L'), dtype=np.int16) for f in fs]
out = []
for k in range(1, len(F) - 1):
    a, b, c = F[k - 1], F[k], F[k + 1]
    spike = ((b - np.maximum(a, c) > 40) | (np.minimum(a, c) - b > 40))
    out.append(spike.mean() * 100)
print(sys.argv[1], 'spike pct: mean %.3f max %.3f at %d' % (np.mean(out), np.max(out), int(np.argmax(out)) + 1))
print(' '.join('%.2f' % v for v in out))
