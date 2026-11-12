"""Whole-film timeline: the start of each narration line and the in/out of each subtitle slip (one Chinese and one English line). Writes src/cues.json (for baking the subtitle slips) and timeline.json (shared by the page, the mix and the srt).
Usage (library root): .venv/bin/python styles/vintage-collage/demo/src/timeline.py
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
DUR = 52.0                      # 49.55–52.0 s is the end-card credits
VO = {'L01': 0.7, 'L02': 5.6, 'L03': 10.4, 'L04': 15.6, 'L05': 21.9, 'L06': 27.7, 'L07': 31.3, 'L08': 35.0, 'L09': 40.6, 'L10': 43.3}
dur = json.load(open(os.path.join(ROOT, 'vo', 'dur.json')))
# split into slips: (line, start within the line in s, Chinese, English)
CUES = [
    ('L01', 0.0, '1918 年 5 月，美国要开始用飞机送信了。', 'May 1918. America is about to fly the mail.'),
    ('L02', 0.0, '为此发行的新邮票：红框里，一架蓝色飞机。', 'The new stamp: a blue plane, in a red frame.'),
    ('L03', 0.0, '每张纸都要过两次印刷机。', 'Every sheet goes through the press twice.'),
    ('L03', 2.3, '先印红，再印蓝。', 'Red first, then blue.'),
    ('L04', 0.0, '可有一张纸，蓝色印反了。', 'But on one sheet, the blue went on upside down.'),
    ('L05', 0.0, '集邮的威廉·罗比买下了它。', 'A collector named William Robey bought it.'),
    ('L05', 2.5, '100 枚，24 美元。', '100 stamps, $24.'),
    ('L06', 0.0, '一周后，他以 15,000 美元转手。', 'A week later, he sold it for $15,000.'),
    ('L07', 0.0, '整版被剪开，飞机各奔东西。', 'The sheet was cut up, and the planes flew apart.'),
    ('L08', 0.0, '2023 年，单单一枚就卖出 200 多万美元。', 'In 2023, a single one sold for just over $2 million.'),
    ('L09', 0.0, '有的遗失了，有的被偷了。', 'Some were lost. Some were stolen.'),
    ('L10', 0.0, '第 66 号在 1955 年失踪，', 'Number 66 vanished in 1955,'),
    ('L10', 2.85, '至今下落不明。', 'and has never been found.'),
]
cues = []
for i, (lid, off, zh, en) in enumerate(CUES):
    t0 = VO[lid] + off
    nxt = [VO[c[0]] + c[1] for c in CUES[i + 1:]]
    line_end = VO[lid] + dur[lid]
    t1 = min(nxt[0] - 0.08 if nxt else DUR, max(line_end + 0.6, t0 + 1.8))
    if (CUES[i + 1][0] == lid if i + 1 < len(CUES) else False):
        t1 = VO[lid] + CUES[i + 1][1] - 0.04
    cues.append(dict(t0=round(t0, 2), t1=round(t1, 2), zh=zh, en=en))
json.dump([dict(zh=c['zh'], en=c['en']) for c in cues], open(os.path.join(HERE, 'cues.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(dict(dur=DUR, vo={k: [v, dur[k]] for k, v in VO.items()}, cues=cues), open(os.path.join(ROOT, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
for c in cues: print(f"{c['t0']:6.2f}-{c['t1']:6.2f} {c['t1']-c['t0']:4.2f}  {c['en']}")
