"""From the shot list, work out which seconds of each source are used and where they sit in the film, write that back into the `used` field of SOURCES.jsonl, then generate SOURCES.md.
Usage: python tools/used.py"""
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
os.chdir(os.path.join(HERE, '..'))
from shots import SHOTS, CLIPS, GRID_STAGES
from prep import speed_curve
from timeline import GRID, BRAKE

RAW = {'sky': 'sky23', 'nyim': 'nyim', 'b99': 'br1899', 'empty': 'empty', 'pcm': 'pcm', 'cav': 'cav', 'mbn': 'mbn', 'fw': 'fw16',
       'kel': 'kel', 'sun': 'sunfox', 'earth': 'earth'}
use = {}


def add(name, s): use.setdefault(name, []).append(s)


def span(cid):
    c = CLIPS[cid]; e = speed_curve(c['speed'], c['n'])
    return c['s0'], c['s0'] + e[-1]


for s in SHOTS:
    k = s['kind']
    if k == 'clip':
        a, b = span(s['id']); sp = CLIPS[s['id']]['speed']
        sp = f'{sp}×' if isinstance(sp, (int, float)) else 'speed ramp ' + '→'.join(f'{v}×' for _, v in sp)
        add(RAW[CLIPS[s['id']]['src']], f"{a:.1f}–{b:.1f} s ({sp}) → film {s['t0']:.2f}–{s['t1']:.2f}")
    elif k == 'photo':
        for nm in s['names']: add(nm, f"film {s['t0']:.2f}–{s['t1']:.2f}")
    elif k == 'split':
        for side in ('left', 'right'):
            a, b = span(s[side]); add(RAW[CLIPS[s[side]]['src']], f"{a:.1f}–{b:.1f} s (split screen, {side}) → film {s['t0']:.2f}–{s['t1']:.2f}")
    elif k == 'flicker':
        for cid in (s['a'], s['b']):
            a, b = span(cid); add('sky23', f"{a:.0f}–{b:.0f} s (day and night alternating every 2 frames) → film {s['t0']:.2f}–{s['t1']:.2f}")
    elif k == 'page':
        add('lg380', f"film {s['t0']:.2f}–{s['t1']:.2f}, the book page; the quotation is from section 6 on this page")
pool = sorted({c for st in GRID_STAGES for c in st[3]})
for cid in pool:
    a, b = span(cid); add(RAW[CLIPS[cid]['src']], f"{a:.1f}–{b:.1f} s (grid cell) → film {GRID:.1f}–{BRAKE:.1f}")

recs = [json.loads(l) for l in open('SOURCES.jsonl') if l.strip()]
for r in recs:
    r['used'] = use.get(r['name'], [])
    if r['name'] in ('nyim',): r['used'].append("every shot scaled 1.18× about the centre, pushing the author's top-left logo out of frame")
    if r['name'] == 'fw16' and r['used']: r['used'].append('the seconds above count from the start of the excerpt (100–200 s of the original); original time = +100 s')
    if r['name'] == 'empty' and r['used']: r['used'].append('cropped to 1804×1014 (from 58 px on the left, top-aligned) and then scaled up, cropping the bottom-right watermark out of frame')
open('SOURCES.jsonl', 'w').write(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in recs))
unused = [r['name'] for r in recs if not r['used']]
if unused: print('⚠ unused:', unused)
subprocess.run(['python3', 'tools/footage.py', 'md'], check=True)
