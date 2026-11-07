#!/usr/bin/env python3
"""The whole film as data: one board (the briefing wall), one continuous camera, timed elements,
sound events and bilingual subtitles  →  scenes/film.json and audio/cues.json.

    python3 scenes/_gen_film.py

Everything is timed on a 120 BPM grid (beat = 0.5 s; hits on sixteenths) and on the narration
(audio/vo/dur.json). Layout is in board px (zoom 1 shows 1,920 board px across). The river is
1,000 m = G px wide, and every bridge is scaled so its main span (anchors L → R in
kit/objects/<id>.json) is drawn to the same scale: the four dimension lines are honest bar lengths.
The wall is 16:9 so the final pull-back fills the frame; its right third (references, the verdict,
the end card) is never in shot before the reveal.
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__)); DEMO = os.path.dirname(HERE)
OBJ = os.path.join(DEMO, 'kit', 'objects')
VO = json.load(open(os.path.join(DEMO, 'audio', 'vo', 'dur.json')))
meta = lambda i: json.load(open(os.path.join(OBJ, i + '.json')))

# ================================================================= world layout
BW, BH = 6400, 3600
G = 1240                    # 1,000 m on the board
KPM = G / 1000              # board px per metre
BANK_L = 1000; BANK_R = BANK_L + G; MID = (BANK_L + BANK_R) / 2
RIV_T, RIV_B = 70, 1150     # plan view: the river runs top → bottom
DIM_Y = 300                 # "1,000 米" dimension across the river
CROSS_Y = 700               # the crossing (deck line, piers, later the ruler)
PIERS = [BANK_L + G * k / 8 for k in range(1, 8)]     # pier 4 sits on the channel centre line
SPANS = {'beam': 330, 'arch': 600, 'cable': 1208, 'suspension': 2023}   # FACTS.md F1–F4
NAMES = {'beam': '梁桥', 'arch': '拱桥', 'cable': '斜拉桥', 'suspension': '悬索桥'}
NUMTXT = {'beam': '330 米', 'arch': '600 米', 'cable': '1,208 米', 'suspension': '2,023 米'}
TAG, NUM = 78, 100          # name tags and numbers: sized for the final wall (≥ 20 px on screen)
NUM_EM = {'beam': 3.04, 'arch': 3.10, 'cable': 3.82, 'suspension': 3.92}   # advance widths of NUMTXT in LXGW Marker Gothic (em, with the 0.02 em track)
TAG_W = lambda n: n * TAG * 1.06 + TAG * 1.45     # a tag's width right of its magnet (board.js tagGeom: CJK 1 em + 6 % track, padding)

E, EV = [], []
def el(**k): E.append(k); return k
def ev(t, type, **k): EV.append(dict(t=round(t, 4), type=type, **k)); return t

class Cam:
    def __init__(s, x, y, z, roll=0):
        s.base = dict(x=x, y=y, z=z, roll=roll); s.cur = dict(x=x, y=y, lz=math.log(z), roll=roll); s.moves = []; s.shakes = []
    def to(s, t, d, x=None, y=None, z=None, roll=None, a=2, b=2):
        m = dict(t=round(t, 4), d=d, a=a, b=b)
        if x is not None: m['dx'] = round(x - s.cur['x'], 2); s.cur['x'] = x
        if y is not None: m['dy'] = round(y - s.cur['y'], 2); s.cur['y'] = y
        if z is not None: m['dl'] = math.log(z) - s.cur['lz']; s.cur['lz'] = math.log(z)
        if roll is not None: m['dr'] = roll - s.cur['roll']; s.cur['roll'] = roll
        s.moves.append(m); return t + d
    def shake(s, t, amp=6, f=9, k=7, dir=(0, 1), roll=0):
        s.shakes.append(dict(t=t, amp=amp, f=f, k=k, dir=list(dir), roll=roll))
    def json(s):
        return dict(x=s.base['x'], y=s.base['y'], z=s.base['z'], roll=s.base['roll'], moves=s.moves, shakes=s.shakes)

def wavy(x0, y0, x1, y1, amp, n, seed):
    pts = []
    for i in range(n + 1):
        u = i / n; w = amp * (math.sin(u * 7.3 + seed) * .6 + math.sin(u * 17.1 + seed * 2) * .4) * math.sin(u * math.pi) ** .5
        nx, ny = -(y1 - y0), (x1 - x0); L = math.hypot(nx, ny); nx, ny = nx / L, ny / L
        pts.append([round(x0 + (x1 - x0) * u + nx * w, 1), round(y0 + (y1 - y0) * u + ny * w, 1)])
    return pts
def bease(u, a=2, b=2, n=2000):   # same ease as kit/board.js (velocity ∝ u^a (1-u)^b)
    u = min(1, max(0, u)); tot = acc = 0.0
    for i in range(n): m = (i + .5) / n; w = m ** a * (1 - m) ** b; tot += w; acc += w if m < u else 0
    return acc / tot
def tip_time(t0, d, frac, a, b):
    lo, hi = 0.0, 1.0
    for _ in range(30):
        mid = (lo + hi) / 2; lo, hi = (mid, hi) if bease(mid, a, b, 400) < frac else (lo, mid)
    return t0 + d * lo

# ================================================================= timeline (seconds)
T = dict(L1=.45, L2=3.08, sil1=[7.0, 8.0], stamp=8.0, L3=8.30, L4=11.42, L5=15.9, L6=19.9, L7=24.0, L8=29.875, L9=32.375,
         sil2=[35.25, 35.75], reveal=35.75)
DUR = 40.0
# The test bench. Each bridge is met close on a structural detail as it lands, then the camera pulls out to its
# JUDGEMENT FRAME — the whole bridge, both bank lines (the 1,000 m "door"), the dimension line, tag, number and
# verdict, all in frame above the subtitles — and holds there (a slow push only) while the line is drawn, the voice
# reads the number and the verdict lands. Every judgement frame is wider than the one before.
BR = dict(
    beam=dict(land=15.0, pull=(15.25, .6), line=(15.875, .375), strike=17.125, leave=18.45),
    arch=dict(approach=(18.45, .55), land=19.0, pull=(19.25, .6), line=(19.875, .375), strike=21.125, leave=22.45),
    cable=dict(approach=(22.45, .6), land=23.125, pull=(23.375, .7), line=(24.125, 1.5), barely=26.0, leave=28.2),
    suspension=dict(approach=(28.2, .65), land=28.875, pull=(29.125, .7), line=(29.875, .5), ring=31.25, kick=30.175, leave=32.825))
ROW_T = {k: v['land'] for k, v in BR.items()}                       # photo lands (on the beat or a sixteenth)
LINE = {k: v['line'] for k, v in BR.items()}                        # dimension line: start, duration
STRIKE = {k: v['strike'] for k, v in BR.items() if 'strike' in v}
TITLE_T = [T['reveal'] + 1.125 + .25 * i for i in range(5)]

# ================================================================= S1 the river — the hook: the width snaps across in the first quarter-second
bankL = wavy(BANK_L, RIV_T, BANK_L, RIV_B, 9, 36, 1.3); bankR = wavy(BANK_R, RIV_T, BANK_R, RIV_B, 9, 36, 4.1)
el(type='ink', kind='line', id='bankL', points=bankL, lw=15, color='blue', t=-1.0, d=.8, ea=1.6, eb=2.2)
el(type='ink', kind='line', id='bankR', points=bankR, lw=15, color='blue', t=-.8, d=.7, ea=1.6, eb=2.2)
strokes = []
for i, y in enumerate(range(RIV_T + 40, RIV_B - 20, 70)):
    frac = (y - RIV_T) / (RIV_B - RIV_T)
    for side, bx, (t0, d) in ((-1, BANK_L, (-1.0, .8)), (1, BANK_R, (-.8, .7))):
        x0 = bx + side * 24
        strokes.append(dict(points=[[x0, y], [x0 + side * 46, y + 30]], t=round(tip_time(t0, d, frac, 1.6, 2.2) + .03, 3), d=.07, lw=6, color='grey'))
el(type='ink', kind='hatch', id='landhatch', strokes=strokes, lw=6, color='grey', alpha=.55)
water = []
for i, (fx, fy) in enumerate([(.18, .14), (.62, .22), (.33, .36), (.78, .44), (.15, .58), (.52, .66), (.84, .74), (.3, .84), (.66, .93)]):
    x0 = BANK_L + G * fx - 60; y0 = RIV_T + (RIV_B - RIV_T) * fy
    water.append(dict(points=wavy(x0, y0, x0 + 120, y0, 7, 8, i), t=1.0 + i * .14, d=.14, lw=7, color='water'))
el(type='ink', kind='hatch', id='water', strokes=water, lw=7, color='water', alpha=.7)
ev(1.0, 'scribble', d=1.3, v=.3)
el(type='ink', kind='dim', id='dim1000', **{'from': [BANK_L + 4, DIM_Y], 'to': [BANK_R - 4, DIM_Y]}, lw=12, color='blue', t=-.05, d=.3, ea=1.2, eb=2.4)
ev(0, 'dimzip', d=.25, v=1.0); ev(0, 'arrow', v=.7); ev(.25, 'arrow', v=1.0); ev(.25, 'hook')
el(type='ink', kind='write', id='w1000', text='1,000 米', xy=[BANK_L + 70, DIM_Y - 34], size=118, color='graphite', t=.35, d=.6)
ev(.35, 'ink', d=.6, kind='write')

# ================================================================= S2 first instinct (3 – 8)
el(type='ink', kind='line', id='deckA', points=[[BANK_L - 130, CROSS_Y - 15], [BANK_R + 130, CROSS_Y - 15]], lw=10, color='graphite', t=3.0, d=.6, ea=1.5, eb=2.5, erase=dict(t=13.55, d=.45))
el(type='ink', kind='line', id='deckB', points=[[BANK_L - 130, CROSS_Y + 15], [BANK_R + 130, CROSS_Y + 15]], lw=10, color='graphite', t=3.15, d=.6, ea=1.5, eb=2.5, erase=dict(t=13.6, d=.45))
ev(3.0, 'ink', d=.75, kind='line')
for k, px in enumerate(PIERS):
    pt = 4.25 + .25 * k; pop = 12.75 + .125 * k
    el(type='magnet', id=f'pier{k}', xy=[round(px, 1), CROSS_Y], r=27, color='graphite', z=16,
       arrive=dict(t=pt - .06, kind='snap', d=.35, lift=90), leave=dict(t=pop, kind='pop', d=.32, to=[(k - 3) * 28, -160], spin=30),
       jolts=[dict(t=T['stamp'] - .02, dy=(12 if k == 3 else 3), dx=(k - 3) * 1.5, dr=(6 if k == 3 else 0), k=8, f=24)])
    ev(pt, 'pier', n=k); ev(pop, 'pop', n=k)
ship_m = meta('ship'); SHIP_L = 500
bow_off = (ship_m['anchors']['bow'][1] - .5) * SHIP_L
s0 = -200; hit = CROSS_Y - 27 - 2 - bow_off
el(type='ink', kind='wake', id='wake', follow='ship', t=6.0, len=330, lw=6, out=8.05)
el(type='print', id='ship', src='ship', xy=[MID, s0], h=SHIP_L, z=6, shadow=.8, arrive=dict(t=5.98, kind='fade', d=.02),
   moves=[dict(t=6.0, d=2.0, dy=hit - s0, a=1.5, b=.35), dict(t=8.0, d=.32, dy=-14, a=.6, b=2.2)])
ev(5.75, 'horn', v=.55, far=1); ev(6.0, 'engine', d=2.0); ev(5.9, 'water', d=2.3)
el(type='stamp', id='stamp', text='否决', xy=[MID + 215, CROSS_Y - 125], size=118, rot=-9, t=T['stamp'], seed=7)
ev(T['stamp'], 'stamp')

# ================================================================= S4 the new rule (11 – 14.5)
RX = BANK_R + 200
el(type='ink', kind='write', id='w_rule0', text='新规矩', xy=[RX, 410], size=140, color='red', t=11.1, d=.45)
el(type='ink', kind='line', id='rule_ul', points=[[RX - 6, 452], [RX + 440, 444]], lw=11, color='red', t=11.58, d=.2)
el(type='ink', kind='write', id='w_rule1', text='航道不立墩', xy=[RX, 640], size=124, color='graphite', t=11.8, d=.75)
ev(11.1, 'ink', d=.45, kind='write'); ev(11.58, 'ink', d=.2, kind='line'); ev(11.8, 'ink', d=.75, kind='write')
ev(13.55, 'erase', d=.5)
el(type='ruler', id='ruler', **{'from': [BANK_L - 175, CROSS_Y], 'to': [BANK_R + 175, CROSS_Y]}, xy=[0, 0], w=86, z=9, inset=78,
   arrive=dict(t=round(14.0 - .28 * .95, 4), kind='drop', d=.28, lift=360, spin=1.5, land=.95))
ev(14.0, 'ruler')

# ================================================================= S5 the test bench (elevation)
PROJ_T = 14.4
for i, bx in enumerate((BANK_L, BANK_R)):
    el(type='ink', kind='line', id=f'proj{i}', points=[[bx, RIV_B + 40], [bx, BH - 70]], lw=7, color='blue', alpha=.7, dash=[26, 22],
       t=PROJ_T + i * .05, d=.85, ea=1.6, eb=2.4)
for k in range(8): ev(PROJ_T + .05 + k * .125, 'tick', v=.5 - k * .03)

rows = {}; y = RIV_B + 150
for name in ('beam', 'arch', 'cable', 'suspension'):
    m = meta(name); L, R = m['anchors']['L'], m['anchors']['R']
    span_px = SPANS[name] * KPM
    w = span_px / (R[0] - L[0]); h = w * m['h'] / m['w']
    above = L[1] * h; base = y + above
    cx = BANK_L - (L[0] - .5) * w; cy = base - (L[1] - .5) * h
    rows[name] = dict(base=base, w=w, h=h, cx=cx, cy=cy, span=span_px, top=y, end=BANK_L + span_px, dy=base + 62)
    y = base + 245
ROWS_BOTTOM = y
# pins: two magnets hold every bridge print, clacked on right after it lands (where the deck is)
LIFT = dict(beam=60, arch=320, cable=260, suspension=110)     # how far each print falls: kept low where the photo has few pixels to spare
PINS = dict(beam=(.2, .88, .35), arch=(.16, .93, .62), cable=(.06, .94, .82), suspension=(.06, .94, .5))
for name, r in rows.items():
    t0 = ROW_T[name]; heavy = name == 'suspension'
    el(type='print', id=name, src=name, xy=[round(r['cx'], 1), round(r['cy'], 1)], w=round(r['w'], 1), z=10,
       arrive=dict(t=round(t0 - (.5 if heavy else .42) * .82, 4), kind='drop', d=.5 if heavy else .42, lift=LIFT[name], spin=1.4, land=.82))
    ev(t0, 'land', size='big' if heavy else 'mid', v=1.0 if heavy else .85)
    px0, px1, py = PINS[name]
    for j, fx in enumerate((px0, px1)):
        mx, my = r['cx'] - r['w'] / 2 + fx * r['w'], r['cy'] - r['h'] / 2 + py * r['h']
        el(type='magnet', id=f'pin_{name}{j}', xy=[round(mx, 1), round(my, 1)], r=22, color='graphite', z=20, arrive=dict(t=t0 + .125 + .125 * j - .06, kind='snap', d=.3, lift=70))
        ev(t0 + .125 + .125 * j, 'pin', v=.55)
    ls, ld = LINE[name]; dy = r['dy']; te = ls + ld
    el(type='ink', kind='dim', id='dim_' + name, **{'from': [BANK_L, dy], 'to': [round(r['end'], 1), dy]}, lw=12, color='blue',
       ext=[[BANK_L, r['base'] - 10, dy + 30], [round(r['end'], 1), r['base'] - 10, dy + 30]], extColor='grey',
       t=ls, d=ld, ea=(1.5 if name != 'cable' else 1.6), eb=(2.6 if name != 'cable' else 3.6))
    ev(ls, 'dimzip', d=ld, v=1.0 if heavy else .7); ev(te, 'arrow', v=1.0)
    # label block under the arrow's end: [name tag] number
    el(type='ink', kind='write', id='num_' + name, text=NUMTXT[name], xy=[round(r['end'] - 6, 1), dy + 118], size=NUM, color='blue', align='right', t=te + .02, d=.4)
    ev(te + .02, 'ink', d=.4, kind='write')
    tag_dt = .125 if name in ('cable', 'arch', 'beam') else .25
    el(type='tag', id='tag_' + name, text=NAMES[name], xy=[round(r['end'] - 6 - NUM_EM[name] * NUM - 46 - TAG_W(len(NAMES[name])), 1), dy + 84], size=TAG, rot=-1.2 if name in ('beam', 'cable') else 1.0,
       arrive=dict(t=te + tag_dt, kind='swing', d=.8, amp=9))
    ev(te + tag_dt, 'tag', v=.6)
for name, ts in STRIKE.items():
    r = rows[name]
    next(e for e in E if e.get('id') == 'tag_' + name)['strike'] = dict(t=ts, d=.22, color='red')
    el(type='ink', kind='line', id='gap_' + name, points=[[r['end'] + 40, r['dy']], [BANK_R - 6, r['dy']]], lw=9, color='red', dash=[18, 16], t=ts + .12, d=.3)
    ev(ts, 'strike'); ev(ts + .12, 'ink', d=.3, kind='line', v=.5)
rc = rows['cable']
TB = BR['cable']['barely']
el(type='tag', id='tag_barely', text='勉强', xy=[rc['end'] + 95, rc['dy'] + 4], size=TAG, rot=4, arrive=dict(t=TB, kind='swing', d=.8, amp=12))
ev(TB, 'tag', v=.9)
rs = rows['suspension']
el(type='ink', kind='ring', id='ring', c=[round(rs['end'] - 6 - NUM_EM['suspension'] * NUM / 2, 1), rs['dy'] + 82], r=[round(NUM_EM['suspension'] * NUM / 2 + 34), 92], lw=11, color='red', t=BR['suspension']['ring'], d=.42)
ev(BR['suspension']['ring'], 'ink', d=.42, kind='line', v=.8)

# ================================================================= S6 the ship that sets the span: a side-view ship under the suspension span
SW = 340; sm = meta('ship_side'); sh = SW * sm['h'] / sm['w']; WL = rs['base']
ship_y = WL - (sm['anchors']['bow'][1] - .5) * sh
el(type='ink', kind='line', id='waterline', points=wavy(rs['end'] + 620, WL, BANK_L - 380, WL, 5, 60, 2.2), lw=7, color='water', alpha=.8, t=32.125, d=.6, ea=1.6, eb=2.2)
ev(32.125, 'ink', d=.6, kind='line', v=.6)
S0X, S1X = rs['end'] + 420, BANK_L + 1350          # still under the main span, near frame centre, when the reveal begins
el(type='print', id='ship_side', src='ship_side', xy=[S0X, round(ship_y, 1)], w=SW, z=7, shadow=.7, arrive=dict(t=32.475, kind='fade', d=.02),
   moves=[dict(t=32.525, d=4.0, dx=S1X - S0X, a=1.15, b=1.5)])
el(type='ink', kind='wake', id='wake_side', dir='side', follow='ship_side', y=WL, sgn=1, t=32.575, lw=6)
ev(32.0, 'horn', v=.75, far=0); ev(32.575, 'engine', d=2.6, v=.8); ev(32.475, 'water', d=2.75)   # the horn first (J-cut), then the ship

# ================================================================= the rest of the wall: seen whole only in the reveal
TITLE = dict(x=4010, y=1700, size=400)
el(type='ink', kind='line', id='leader', points=[[rs['end'] + 50, rs['dy'] + 70], [rs['end'] + 300, rs['dy'] - 200], [3830, 2350], [TITLE['x'] + 60, TITLE['y'] + 80]],
   lw=10, color='graphite', arrow=True, t=T['reveal'] + .95, d=.6, ea=1.6, eb=2.4)
ev(T['reveal'] + .95, 'ink', d=.6, kind='line', v=.6)
el(type='ink', kind='write', id='w_title_ship', text='船', xy=[TITLE['x'], TITLE['y']], size=TITLE['size'], color='red', t=TITLE_T[0], d=.24)
el(type='ink', kind='write', id='w_title_rest', text='决定跨度', xy=[TITLE['x'] + TITLE['size'] * 1.04, TITLE['y']], size=TITLE['size'], color='graphite', t=TITLE_T[1], d=1.0)
for t_ in TITLE_T: ev(t_, 'ink', d=.22, kind='write', v=1.0)
# reference prints pinned at the top right, each held by two magnets
for pid, (px, py, pw, rot) in dict(print_susp=(4310, 420, 640, -2.2), print_cable=(5020, 400, 600, 1.6), print_arch=(5730, 440, 640, -1.2), print_ship=(5245, 930, 540, 2.4)).items():
    pm = meta(pid); ph = pw * pm['h'] / pm['w']
    el(type='print', id=pid, src=pid, xy=[px, py], w=pw, z=6, rot=rot, shadow=.85)
    for j, fx in enumerate((-.38, .38)): el(type='magnet', id=f'{pid}_m{j}', xy=[round(px + fx * pw, 1), round(py - ph / 2 + 26, 1)], r=20, color=('red' if pid == 'print_susp' and j == 0 else 'graphite'), z=14)
el(type='card', id='sources', xy=[4440, 930], w=860, h=430, rot=-.6, z=7, magnetR=20, magnets=[[-392, -188, 'graphite'], [392, -188, 'graphite']],
   lines=[dict(text='数据来源', font='sc', weight=900, size=64, x=50, y=-96, color='graphite'),
          dict(text='梁桥 330 · 工程资料', font='sc', weight=500, size=46, x=50, y=-18, color='graphite'),
          dict(text='拱桥 600 · 通车公告', font='sc', weight=500, size=46, x=50, y=46, color='graphite'),
          dict(text='斜拉 1,208 · 通车公告', font='sc', weight=500, size=46, x=50, y=110, color='graphite'),
          dict(text='悬索 2,023 · 纪录认证', font='sc', weight=500, size=46, x=50, y=174, color='graphite')])
el(type='card', id='note1', xy=[5890, 960], w=660, h=230, rot=3, z=7, magnetR=18, magnets=[[0, -88, 'blue']],
   lines=[dict(rule=True, x=30, y=-40, w=600, h=3, color='blue'), dict(text='1,208 − 1,000 = 208', font='marker', size=64, x=40, y=40, color='blue'),
          dict(text='刚好够', font='marker', size=52, x=40, y=96, color='graphite')])
el(type='card', id='note2', xy=[4780, 3190], w=540, h=230, rot=-2.5, z=7, magnetR=18, magnets=[[0, -88, 'blue']],
   lines=[dict(rule=True, x=30, y=-40, w=480, h=3, color='blue'), dict(text='2,023 ÷ 1,000 ≈ 2', font='marker', size=54, x=30, y=40, color='blue'),
          dict(text='两倍有余', font='marker', size=52, x=40, y=96, color='graphite')])
# a small navigation-clearance section: the channel the ship needs under the deck (no numbers)
CX, CY = 5300, 2420
el(type='ink', kind='write', id='w_clear', text='通航净空', xy=[CX - 520, CY - 300], size=92, color='graphite', t=-5, d=.1)
el(type='ink', kind='line', id='cl_water', points=wavy(CX - 560, CY + 170, CX + 560, CY + 170, 5, 30, 3.3), lw=8, color='water', t=-5, d=.1)
el(type='ink', kind='line', id='cl_deck', points=[[CX - 560, CY - 170], [CX + 560, CY - 170]], lw=10, color='graphite', t=-5, d=.1)
el(type='ink', kind='line', id='cl_box', points=[[CX - 380, CY + 170], [CX - 380, CY - 150], [CX + 380, CY - 150], [CX + 380, CY + 170]], lw=7, color='blue', dash=[22, 16], t=-5, d=.1)
el(type='ink', kind='line', id='cl_ship', points=[[CX - 120, CY + 170], [CX - 150, CY + 40], [CX - 150, CY - 10], [CX - 60, CY - 10], [CX - 60, CY - 90], [CX + 40, CY - 90], [CX + 40, CY - 10], [CX + 150, CY - 10], [CX + 150, CY + 40], [CX + 120, CY + 170]], lw=8, color='graphite', t=-5, d=.1)
el(type='ink', kind='dim', id='cl_w', **{'from': [CX - 380, CY + 240], 'to': [CX + 380, CY + 240]}, lw=7, color='blue', t=-5, d=.1)
el(type='ink', kind='dim', id='cl_h', **{'from': [CX + 450, CY + 170], 'to': [CX + 450, CY - 150]}, lw=7, color='blue', t=-5, d=.1)
# end card: the drawing's title block, bottom right
CARD = dict(x=5660, y=3060, w=1130, h=780)
el(type='card', id='endcard', xy=[CARD['x'], CARD['y']], w=CARD['w'], h=CARD['h'], rot=.6, z=8, magnetR=28,
   magnets=[[-CARD['w'] / 2 + 62, -CARD['h'] / 2 + 58, 'red'], [CARD['w'] / 2 - 62, -CARD['h'] / 2 + 58, 'graphite']],
   lines=[dict(text='船说了算', font='sc', weight=900, size=150, x=70, y=-190, color='graphite', track=8),
          dict(rule=True, x=72, y=-150, w=180, h=10, color='red'),
          dict(text='ENGINEERING', font='mono', weight=600, size=72, x=72, y=-40, color='graphite', track=3),
          dict(text='BRIEFING BOARD', font='mono', weight=600, size=72, x=72, y=48, color='graphite', track=3),
          dict(text='工程简报板', font='sc', weight=700, size=78, x=72, y=160, color='graphite', track=10),
          dict(text='LemoLab × Claude Opus 5.5', font='mono', weight=500, size=60, x=72, y=290, color='grey', track=1)])
# licence credits: a card that fades in on the empty middle of the board as the camera pulls back to the whole board
CL = dict(font='mono', weight=500, size=52, color='graphite', pass_=True)
el(type='card', id='credits', xy=[3170, 1290], w=1180, h=930, rot=-1.2, z=7, magnetR=18,
   magnets=[[-520, -400, 'blue'], [520, -400, 'graphite']], arrive=dict(t=36.9, kind='fade', d=.4),
   lines=[dict(text='CREDITS', font='mono', weight=600, size=62, x=52, y=-300, color='graphite', track=3),
          dict(rule=True, x=54, y=-268, w=150, h=6, color='blue'),
          dict(CL, text='Photos', x=52, y=-180, color='blue'),
          dict(CL, text='BAW – Bundesanstalt für', x=52, y=-108), dict(CL, text='Wasserbau, CC BY 4.0', x=52, y=-36),
          dict(CL, text='“Bear mountain bridge west II”', x=52, y=36), dict(CL, text='by Russ, CC BY 2.0', x=52, y=108),
          dict(CL, text='Drums', x=52, y=200, color='blue'),
          dict(CL, text='“MuldjordKit” by Lars', x=52, y=272), dict(CL, text='Muldjord, CC BY 4.0', x=52, y=344)])

# ================================================================= camera
r1, r2, r3, r4 = (rows[n] for n in ('beam', 'arch', 'cable', 'suspension'))
c = Cam(BANK_L + 200, DIM_Y + 30, 2.6, roll=-3.0)
c.to(0, .5, x=MID + 140, a=1.4, b=2.8); c.to(0, .7, z=1.32, roll=0, y=DIM_Y + 160, a=1.6, b=2.8)      # whip with the snapping dimension
c.to(.55, .6, x=MID + 60, a=2, b=2.4)                                                                  # overshoot settles back
c.to(1.2, 1.7, x=BANK_L + 520, y=DIM_Y + 150, z=1.42, roll=1.0, a=2, b=2.2)                            # push in on "1,000 米"
c.to(2.85, 1.15, y=CROSS_Y - 10, x=BANK_L + 260, z=1.48, roll=0, a=2.2, b=2.4)                         # down to the crossing
c.to(3.85, 1.9, x=BANK_R - 330, a=2, b=2.2)                                                             # along the piers
c.to(5.45, 1.2, y=CROSS_Y - 150, x=MID + 20, z=1.22, a=2, b=2.2)                                       # up the channel
c.to(6.6, 1.55, y=CROSS_Y - 45, z=2.05, roll=-1.6, x=MID + 60, a=2, b=2.4)                             # silence: push, Dutch tilt
c.shake(T['stamp'], amp=7, f=8.5, k=6.5, dir=(0, 1), roll=.02)
c.to(8.2, 2.5, y=CROSS_Y - 230, z=1.42, roll=0, x=MID + 120, a=1.8, b=2.6)                             # pull back to the whole ship: "the ship is"
c.to(10.75, 1.0, x=RX - 120, y=575, a=2, b=3); c.to(10.75, 1.1, z=1.0, a=2, b=3)                         # to the rule
c.to(11.45, 1.4, x=RX + 160, z=1.06, a=2, b=2)                                                          # ride the marker as the rule is written
c.to(12.6, 1.3, x=RX - 160, a=2, b=2.2)                                                                 # back toward the river for the pops and the ruler
c.to(13.7, 1.2, z=1.0, y=600, a=2, b=2)
c.to(14.38, .72, y=r1['base'] - 30, x=BANK_L + 90, a=2.2, b=2.6); c.to(14.38, .74, z=2.05, a=2, b=2.6)     # down the projection line into the pier's foot
# judgement frames: the box that must be whole and readable, the zoom (each one wider than the last) and the centre
def tag_box(e):          # board.js tagGeom: the magnet sits at xy; the tag runs 0.875 em left of it and n·1.06 + 1.45 em right
    s_, n_ = e['size'], len(e['text']); x_, y_ = e['xy']; h_ = s_ * 1.75
    return [x_ - h_ * .5 - 8, y_ - h_ / 2 - 8, x_ + n_ * s_ * 1.06 + s_ * 1.45 + 8, y_ + h_ / 2 + 8]
def num_box(e):          # right-aligned marker number: board.js writeBox
    w_ = NUM_EM[e['id'][4:]] * NUM; X_, Y_ = e['xy']; return [X_ - w_, Y_ - NUM * .86, X_, Y_ + NUM * .16]
def union(bs): return [min(b_[0] for b_ in bs), min(b_[1] for b_ in bs), max(b_[2] for b_ in bs), max(b_[3] for b_ in bs)]
EL = {e['id']: e for e in E if 'id' in e}
MARGIN = dict(beam=60, arch=60, cable=70, suspension=110)          # the suspension's frame also absorbs the throw
JUDGE = {}; zprev = 9.0
for name in ('beam', 'arch', 'cable', 'suspension'):
    r = rows[name]; bs = [[r['cx'] - r['w'] / 2, r['cy'] - r['h'] / 2, r['cx'] + r['w'] / 2, r['cy'] + r['h'] / 2],   # the whole print
                          [BANK_L - 10, r['top'], BANK_R + 10, r['dy'] + 30],                                       # both bank lines (the door)
                          tag_box(EL['tag_' + name]), num_box(EL['num_' + name])]
    if name == 'cable': bs.append(tag_box(EL['tag_barely']))
    if name == 'suspension': ring = EL['ring']; bs.append([ring['c'][0] - ring['r'][0] - 8, ring['c'][1] - ring['r'][1] - 8, ring['c'][0] + ring['r'][0] + 8, ring['c'][1] + ring['r'][1] + 8])
    content = union(bs); m = MARGIN[name]; bx = [content[0] - m, content[1] - m, content[2] + m, content[3] + m]
    z = min(1920 / (bx[2] - bx[0]), .85 * 1080 / (bx[3] - bx[1]), zprev / 1.1); zprev = z          # ≥ 10 % wider than the last
    Hv = 1080 / z; y_lo = bx[3] - .35 * Hv; y_hi = bx[1] + .5 * Hv                     # the box stays above the subtitle strip (bottom 15 %)
    y_c = min(max((bx[1] + bx[3]) / 2 + .075 * Hv, y_lo), y_hi); y_c = max(y_lo, min(y_c, BH + 120 - Hv / 2))   # no more wall below the board than needed
    JUDGE[name] = dict(box=[round(v, 1) for v in content], z=round(z, 4), x=round((bx[0] + bx[2]) / 2, 1), y=round(y_c, 1))
DETAIL = dict(arch=dict(x=1190, y=r2['base'] - 180, z=1.6),                 # the arch rib and its hangers
              cable=dict(x=BANK_L + 250, y=r3['top'] + 70, z=1.8),          # the pylon top and its fan
              suspension=dict(x=1150, y=r4['base'] - 240, z=1.38))         # the near tower and its long hangers (z capped by rescheck)
for name in ('beam', 'arch', 'cable', 'suspension'):
    b_, J = BR[name], JUDGE[name]
    if 'approach' in b_:
        t0, d = b_['approach']; D_ = DETAIL[name]; c.to(t0, d, x=D_['x'], y=D_['y'], z=D_['z'], a=2.2, b=2.4)
    t0, d = b_['pull']; c.to(t0, d, x=J['x'], y=J['y'], z=J['z'] / 1.025, a=2, b=2.6)            # out to the judgement frame
    J['t0'] = round(t0 + d, 3); J['t1'] = b_['leave']
    c.to(t0 + d, b_['leave'] - t0 - d, z=J['z'], a=2, b=2)                                       # hold: only a slow push
# the suspension's line rockets past the right bank line: the camera is thrown right and settles back on the same frame
KX = JUDGE['suspension']['x']; c.to(BR['suspension']['kick'], .32, x=KX + 80, a=2.0, b=3.0); c.to(BR['suspension']['kick'] + .32, .8, x=KX, a=3.0, b=2.6)
c.to(BR['suspension']['leave'], .9, x=2950, y=r4['base'] - 20, z=1.42, a=2.2, b=2.6)            # down to the water by the far tower: the ship comes
c.to(33.475, T['reveal'] - 33.475, x=2500, a=2, b=2)                                                  # pan with the ship: the reveal starts from it
WALL = dict(x=BW / 2, y=BH / 2 + 45, z=.2795)
c.to(T['reveal'], 1.8, x=WALL['x'], y=WALL['y'], a=1.5, b=3.2); c.to(T['reveal'], 2.05, z=WALL['z'], a=1.4, b=3.2)
c.to(T['reveal'] + 2.4, DUR - T['reveal'] - 2.4, z=.2864, a=1.6, b=1.2)
ev(T['reveal'], 'reveal'); ev(T['reveal'], 'horn', v=1.0, far=0, tuned=1)
for t_, v in ((0, .7), (10.8, .4), (14.42, .45), (18.45, .35), (22.45, .4), (28.2, .45), (BR['suspension']['kick'], 1.0), (BR['suspension']['leave'], .45), (T['reveal'] + .05, .5)): ev(t_, 'whoosh', v=v)
for n_ in BR: ev(BR[n_]['pull'][0], 'whoosh', v=.2)
MB = [dict(t0=12.7, t1=13.7, n=5), dict(t0=13.7, t1=14.02, n=6), dict(t0=33.375, t1=T['reveal'] + .1, n=10)] + [dict(t0=ROW_T[n] - .5, t1=ROW_T[n] + .05, n=6) for n in ROW_T]
SHADE = [dict(t0=T['reveal'] + .75, t1=T['reveal'] + 5.75, x0=-1900, x1=BW + 900, w=1100, amt=.15, ang=-16), dict(t0=8.4, t1=10.9, x0=MID - 900, x1=MID + 900, w=420, amt=.06, ang=-16)]
RIGHT_ZONE = [3980, 0, BW, BH]          # prints, source card, notes, verdict, end card: never in shot before the reveal

# ================================================================= narration and subtitles (one cue per line; each language on one line)
LINES = {
 'L1': ('这条河宽 1,000 米。', 'This river is a thousand meters wide.'),
 'L2': ('第一反应：一路立桥墩，修座梁桥。', 'First instinct: piers all the way across. A beam bridge.'),
 'L3': ('可麻烦不在河，在船。', "But the river isn't the problem. The ship is."),
 'L4': ('新规矩：航道里不能有桥墩，一跨过去。', 'New rule: no piers in the channel. One span.'),
 'L5': ('梁桥：330 米，差得远。', 'Beam: 330. Not close.'),
 'L6': ('拱桥：600 米，还差。', 'Arch: 600. Still short.'),
 'L7': ('斜拉桥：1,208 米，刚好够。', 'Cable-stayed: 1,208. Just enough.'),
 'L8': ('悬索桥：2,000 米以上。', 'Suspension: over 2,000.'),
 'L9': ('河宽只是出题，船决定跨度。', 'The river sets the question. The ship sets the span.'),
}
subs = []
for k, (zh, en) in LINES.items():
    t0 = T[k]; d = VO[k]; ev(t0, 'vo', id=k)
    subs.append(dict(t0=round(t0, 3), t1=round(t0 + max(1.8, d + .6), 3), zh=zh, en=en, speech=d))
for a_, b_ in zip(subs, subs[1:]):
    if a_['t1'] > b_['t0'] - .02: print('WARNING subtitles overlap:', a_['zh'], '→', b_['zh'], a_['t1'], b_['t0'])

scene = dict(dur=DUR, reveal=T['reveal'], shade=SHADE, board=dict(w=BW, h=BH, seed=11, texScale=.42, ghosts=110), hand=1.0, sheen=.075,
             light=dict(x=-1800, y=-2400, r=17000, min=.8),
             tray=[dict(kind='marker', color='graphite', x=1500, rot=-2), dict(kind='marker', color='blue', x=1900, rot=1.5),
                   dict(kind='marker', color='red', x=2260, rot=-1), dict(kind='eraser', x=4400, rot=.5), dict(kind='marker', color='graphite', x=5200, rot=3)],
             cam=c.json(), mb=MB, elements=E, ev=sorted(EV, key=lambda e: e['t']), subs=subs,
             cues=dict(T, bpm=120, rows={k: dict(base=round(v['base'], 1), end=round(v['end'], 1), dy=round(v['dy'], 1)) for k, v in rows.items()},
                       title=TITLE, title_t=TITLE_T, ring=BR['suspension']['ring'], hook=.25, rows_bottom=round(ROWS_BOTTOM, 1),
                       sec=dict(rule=10.75, bench=14.45, crawl=list(BR['cable']['line']), build=BR['suspension']['land'] + .125,
                                after=32.0, lines_end=T['L9'] + VO['L9'])),
             judge=JUDGE, right_zone=RIGHT_ZONE)
json.dump(scene, open(os.path.join(HERE, 'film.json'), 'w'), ensure_ascii=False, indent=1)
json.dump([dict(t0=s['t0'], t1=s['t1'], text=s['zh'] + '\n' + s['en']) for s in subs], open(os.path.join(DEMO, 'audio', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print('scenes/film.json', DUR, 's ·', len(E), 'elements ·', len(EV), 'events ·', len(subs), 'subtitles · rows bottom', round(ROWS_BOTTOM - 245 + 62 + 118 + 30), '/', BH)
for k, v in rows.items(): print(f"  {k:11s} top {v['top']:.0f} base {v['base']:.0f}  span {v['span']:.0f}px  end x {v['end']:.0f}  photo {v['w']:.0f}×{v['h']:.0f}")
