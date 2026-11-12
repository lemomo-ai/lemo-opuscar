# Flat check of the whole plot (no 3D): plot.json → data/flat.png. Optional crop: x0 y0 x1 y1 (mm) and px/mm.
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); P = json.load(open(os.path.join(HERE, '..', 'plot.json')))
crop = [float(v) for v in sys.argv[1:5]] if len(sys.argv) >= 5 else [0, 0, 594, 420]
k = float(sys.argv[5]) if len(sys.argv) >= 6 else 4.0
W, H = int((crop[2] - crop[0]) * k), int((crop[3] - crop[1]) * k)
im = Image.new('RGB', (W, H), (242, 237, 225)); d = ImageDraw.Draw(im)
COL = [(25, 25, 30), (120, 66, 32), (120, 118, 112), (205, 40, 32)]
WID = [.32, .3, .25, .5]
for s in P['strokes']:
    p = s['pts']; pts = [((p[i] - crop[0]) * k, (p[i + 1] - crop[1]) * k) for i in range(0, len(p), 2)]
    d.line(pts, fill=COL[s['p']], width=max(1, round(WID[s['p']] * k * (1.5 if s.get('dbl') else 1))))
im.save(os.path.join(HERE, '..', 'data', 'flat.png')); print(W, H)
