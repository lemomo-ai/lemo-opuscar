"""textbook-doodle.srt: the film has no voice, so its subtitles are the lines written on the page, one Chinese and one English
line per cue, each shown from the moment the line starts being written until the next one starts.
usage: python styles/textbook-doodle/demo/tools/srt.py <out.srt>"""
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); C = TL['cues']
warp = lambda t: t + sum(d for p, d in TL['holds'] if t >= p)
DUR = warp(TL['grid']) + TL['tail']
# (cue, offset in s, Chinese as on the page, English); offsets match the write() calls in film.js
LINES = [
    (0, 0, '为什么夏天热、冬天冷？', 'Why is summer hot and winter cold?'),
    ('wrong', 0, '离太阳近？', 'Because we are closer to the Sun?'),
    ('near', .25, '1月最近，却是冬天！', 'Closest in January, yet it is winter!'),
    ('axis', .2, '地轴方向不变', 'The axis always points the same way'),
    ('lab1', 0, '直射：集中 → 热', 'Straight on: concentrated → hot'),
    ('lab2', 0, '斜射：摊开 → 冷', 'Slanted: spread out → cold'),
    ('june', .7, '6月：北半球 夏', 'June: summer in the north'),
    ('dec', .7, '12月：北半球 冬', 'December: winter in the north'),
    ('south', 0, '南半球：冬 · 南半球：夏', 'In the south: winter · summer'),
    ('santa', .2, '澳洲的圣诞在夏天', 'Christmas in Australia is in summer'),
    ('answer', 0, '是地轴倾斜！', 'It is the tilted axis!'),
]
t0s = [warp(C[c] if isinstance(c, str) else c) + o for c, o, _, _ in LINES]
ts = lambda x: '%02d:%02d:%02d,%03d' % (x // 3600, x % 3600 // 60, x % 60, round(x % 1 * 1000) % 1000)
out = [f"{k + 1}\n{ts(t0)}" + f" --> {ts(t0s[k + 1] if k + 1 < len(LINES) else DUR)}\n{zh}\n{en}\n" for k, (t0, (_, _, zh, en)) in enumerate(zip(t0s, LINES))]
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(out))
print(f'{sys.argv[1]}: {len(LINES)} cues')
