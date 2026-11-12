"""One timeline for the film: shot starts, narration line starts (with their chunks), bilingual subtitle cues.
Reads out/voice/dur.json (Kokoro, from voice/lines.json). Writes timeline.json (read by index.html and mix.py) and the .srt.
Run from anywhere:  python3 styles/pop-art/demo/timeline.py [out.srt]   (default: ../pop-art.srt)"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'out/voice/dur.json')))
IN_GAP = 0.30
FILM = 52.0
# shot starts (s): see DEMO.md, Shots
SHOTS = {'s1': 0.0, 's2': 4.6, 's3': 10.0, 's4': 12.9, 's5': 16.0, 's6': 21.6, 's7': 26.6, 's8': 30.9,
         'hush': 39.9, 's9': 40.45, 's10': 44.9, 'card': 47.4}
# one subtitle cue per entry: (start, [chunks], zh, en)
CUES = [
    (0.50, ['v01_a'], '你买到的香蕉，几乎都是同一根香蕉。', 'Almost every banana you buy is the same banana.'),
    (4.90, ['v02_a', 'v02_b'], '不只是同一个品种，是同一株植物的复制。', 'Not just the same kind. The same plant, copied.'),
    (10.45, ['v03_a'], '香芽蕉没有种子。', 'The Cavendish has no seeds.'),
    (13.20, ['v03_b'], '每一株，都是从另一株身上分出来的。', 'Each one grows from a piece of another.'),
    (16.85, ['v04_a', 'v04_b'], '你的祖父母吃的是另一种：大麦克。', 'Your grandparents ate a different banana, the Gros Michel.'),
    (21.95, ['v05_a'], '1950 年代，一种土壤真菌席卷了它的种植园。', 'In the 1950s, a soil fungus tore through its farms.'),
    (27.05, ['v06_a'], '于是整个行业换成了能抵抗它的香芽蕉。', 'So the trade switched to the Cavendish, which resisted it.'),
    (31.50, ['v07_a', 'v07_b'], '现在，新菌株「热带 4 号」连香芽蕉也能杀死。', 'Now a new strain, Tropical Race 4, kills the Cavendish as well.'),
    (37.20, ['v08_a'], '2019 年，它到了哥伦比亚。', 'In 2019, it reached Colombia.'),
    (40.80, ['v09_a'], '可地球上的香蕉，有一千多种。', 'Yet over 1,000 kinds of banana grow on Earth.'),
    (45.47, ['v10_a', 'v10_b'], '出路不是一根完美的香蕉，而是很多种。', "The way out is not one perfect banana. It's many."),
]
lines = []
for t0, ch, zh, en in CUES:
    t = t0; parts = []
    for c in ch:
        parts.append({'id': c, 't': round(t, 3), 'dur': D[c]}); t += D[c] + IN_GAP
    end = parts[-1]['t'] + parts[-1]['dur']
    lines.append({'id': ch[0][:3], 't0': t0, 't1': round(end, 3), 'parts': parts, 'zh': zh, 'en': en})
for i, L in enumerate(lines):
    need = max(1.8, L['t1'] - L['t0'] + 0.6)
    nxt = lines[i + 1]['t0'] - 0.08 if i + 1 < len(lines) else FILM - 0.2
    L['c0'] = L['t0']; L['c1'] = round(min(nxt, L['t0'] + need + 0.35), 3)
    assert L['c1'] - L['c0'] >= need - 1e-6, (L['id'], round(L['c1'] - L['c0'], 2), round(need, 2))
json.dump({'dur': FILM, 'shots': SHOTS, 'lines': lines}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)


def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'


with open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'pop-art.srt'), 'w') as f:
    for i, L in enumerate(lines, 1):
        f.write(f"{i}\n{ts(L['c0'])} --> {ts(L['c1'])}\n{L['zh']}\n{L['en']}\n\n")
for L in lines:
    w = len(L['en'].split())
    print(L['id'], L['t0'], '→', L['t1'], f"cue {L['c1'] - L['c0']:.2f}s", f"{w / (L['t1'] - L['t0']):.2f} w/s")
