"""Turns the generated images in gen/ into assets/: green-screen images keyed to RGBA (not cropped, coordinates = source pixels), the rest converted to JPG;
stray pure reds that drift off the three colours (like the generator's own #ff0000) are pulled back to the film's red #d4162b.
Usage: python tools/prep.py   (the character char.png is keyed and cropped by tools/key.py; its anchor coordinates are in that cropped image)"""
import glob, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import minimum_filter, uniform_filter
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G, A = os.path.join(HERE, 'gen'), os.path.join(HERE, 'assets')
os.makedirs(A, exist_ok=True)
RED = np.array([212, 22, 43], np.float32)
one = lambda n: sorted(glob.glob(os.path.join(G, n + '_*.png')))[0]

def fix_red(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (r > 150) & (g < 90) & (b < 90) & (r - np.maximum(g, b) > 110)
    k = np.clip((r - np.maximum(g, b) - 110) / 40, 0, 1)[..., None] * m[..., None]
    return rgb * (1 - k) + RED * k

def key(name, scale=1.0):
    im = np.asarray(Image.open(one(name)).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    gn = g - np.maximum(r, b)
    a = 1 - np.clip((gn - 12) / 60, 0, 1)
    a = uniform_filter(minimum_filter(a, size=3), size=2)
    g2 = np.where(gn > 0, (r + b) / 2, g)
    rgb = fix_red(np.dstack([r, g2, b]))
    out = Image.fromarray(np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    if scale != 1: out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
    out.save(os.path.join(A, name + '.png'), optimize=True); print('key', name, out.size)

def jpg(name):
    im = np.asarray(Image.open(one(name)).convert('RGB')).astype(np.float32)
    Image.fromarray(fix_red(im).clip(0, 255).astype(np.uint8)).save(os.path.join(A, name + '.jpg'), quality=93); print('jpg', name)

for n in ['boy_front', 'boy_phone', 'her_back', 'her_front', 'her_umbrella', 'her_hand']:
    if glob.glob(os.path.join(G, n + '_*.png')): key(n)
for n in ['boy_eye', 'letter_hands', 'her_mouth']:
    if glob.glob(os.path.join(G, n + '_*.png')): jpg(n)
