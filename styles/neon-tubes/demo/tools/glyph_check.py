"""Overlay the neon hanzi of glyphs.json on Noto Sans SC (OFL) to check the tube skeleton.
.venv/bin/python styles/neon-tubes/demo/tools/glyph_check.py out.png [chars]   (needs fonts/src/NotoSansSC-VF.ttf, fetched by build.sh)
Lit strokes orange, painted double-backs grey dashes, electrodes blue dots; the font glyph is the grey fill."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, '..', 'glyphs.json')))
FONT = ImageFont.truetype(os.path.join(HERE, '..', 'fonts', 'src', 'NotoSansSC-VF.ttf'), 400)
try: FONT.set_variation_by_axes([400])
except Exception: pass
chars = sys.argv[2] if len(sys.argv) > 2 else ''.join(G['han'].keys())
S = 40; P = 30; cell = S * 10 + 2 * P
img = Image.new('RGB', (cell * min(5, len(chars)), cell * ((len(chars) + 4) // 5)), (14, 14, 18)); d = ImageDraw.Draw(img)
for i, ch in enumerate(chars):
    ox, oy = (i % 5) * cell + P, (i // 5) * cell + P
    # font glyph: the em square (ascent box) mapped onto the 10 x 10 grid
    g = Image.new('L', (S * 10, S * 10), 0); gd = ImageDraw.Draw(g)
    # the 1000-unit em box (top = baseline - 880, bottom = baseline + 120) on the grid
    gd.text((0, 400 * 0.88), ch, font=FONT, fill=255, anchor='ls')
    img.paste(Image.new('RGB', g.size, (70, 70, 80)), (ox, oy), g)
    for k in range(11):
        d.line([(ox + k * S, oy), (ox + k * S, oy + 10 * S)], fill=(30, 30, 36)); d.line([(ox, oy + k * S), (ox + 10 * S, oy + k * S)], fill=(30, 30, 36))
    for u in G['han'].get(ch, []):
        prev = None
        for st in u:
            if prev is not None:
                d.line([(ox + prev[0] * S, oy + prev[1] * S), (ox + st[0][0] * S, oy + st[0][1] * S)], fill=(110, 110, 120), width=3)
            d.line([(ox + x * S, oy + y * S) for x, y in st], fill=(255, 130, 50), width=9, joint='curve')
            prev = st[-1]
        for p in (u[0][0], u[-1][-1]): d.ellipse([ox + p[0] * S - 7, oy + p[1] * S - 7, ox + p[0] * S + 7, oy + p[1] * S + 7], fill=(80, 190, 255))
    d.text((ox, oy - 26), ch, fill=(200, 200, 200), font=ImageFont.truetype(os.path.join(HERE, '..', 'fonts', 'src', 'NotoSansSC-VF.ttf'), 22))
img.save(sys.argv[1])
