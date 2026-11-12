"""poster.jpg and stills/styleframe.jpg: one frame of the film (no subtitle, no end card), JPEG quality 60, under 500 KB.
Usage (library root): .venv/bin/python styles/colored-pencil/demo/tools/poster.py <film.mp4> <seconds> <out.jpg> [<out.jpg> …]"""
import os, subprocess, sys, tempfile
from PIL import Image
film, t, outs = sys.argv[1], sys.argv[2], sys.argv[3:]
with tempfile.TemporaryDirectory() as d:
    png = os.path.join(d, 'f.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', film, '-frames:v', '1', png], check=True)
    im = Image.open(png).convert('RGB')
    for o in outs:
        im.save(o, quality=60, optimize=True, progressive=True, subsampling=2)
        print(o, os.path.getsize(o) // 1024, 'KB')
