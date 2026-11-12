"""One timeline for the full film: where each narration line starts, its chunks, and the bilingual subtitle cues.
Reads voice/lines.json + voice/out/dur.json (Kokoro), writes timeline.json (page + mix) and ../sketchnote.srt.
The picture in index.html is timed to these line starts; if the voice changes, check that each line still fits before the next start."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'voice/lines.json')))
D = json.load(open(os.path.join(HERE, 'voice/out/dur.json')))
IN_GAP = 0.32                     # breath between the phrases of one line
START = {'v01': 0.60, 'v02': 5.22, 'v03': 8.06, 'v04': 10.55, 'v05': 15.95, 'v06': 20.17,
         'v07': 25.52, 'v08': 30.22, 'v09': 35.90, 'v10': 39.86, 'v11': 44.93}
SUB = {
 'v01': ('她这一辈子，一只蜜蜂只酿出这么多蜜。', 'In her whole life, one bee makes this much honey.'),
 'v02': ('十二分之一茶匙。', '1/12 of a teaspoon.'),
 'v03': ('那这些蜜是从哪来的？', 'So where does it come from?'),
 'v04': ('它最初是花蜜：一种糖水，大部分是水。', 'It starts as nectar, sugar water that is mostly water.'),
 'v05': ('蜜蜂把它装进蜜囊，带回家。', 'A bee carries it home in her honey stomach,'),
 'v06': ('在那里，一种叫转化酶的酶开始把糖分解。', 'There, an enzyme called invertase begins splitting the sugar.'),
 'v07': ('回到蜂巢，成千上万对翅膀把它扇干，', 'Inside the hive, thousands of wings fan it dry,'),
 'v08': ('含水从最多 80% 降到 18% 左右。', 'from up to 80% water, down to about 18%.'),
 'v09': ('然后蜜蜂用蜂蜡把它封住。这就是蜂蜜。', 'Then the bees seal it under wax. Honey.'),
 'v10': ('一磅蜂蜜，要采 200 万朵花的花蜜。', 'One pound of it takes nectar from 2 million flowers.'),
 'v11': ('整整一巢的辛劳，一勺一勺攒出来。', "A whole hive's work, one spoonful at a time."),
}
FILM = 51.0
lines = []
for lid, t in START.items():
    ch = [c for c in C if c['id'].startswith(lid + '_')]
    parts = []
    for c in ch:
        parts.append({'id': c['id'], 't': round(t, 3), 'dur': D[c['id']]}); t += D[c['id']] + IN_GAP
    end = parts[-1]['t'] + parts[-1]['dur']
    lines.append({'id': lid, 't0': START[lid], 't1': round(end, 3), 'parts': parts, 'zh': SUB[lid][0], 'en': SUB[lid][1]})
# subtitle cues: from the line start, at least max(1.8, line + 0.6) s, up to just before the next line
for i, L in enumerate(lines):
    need = max(1.8, L['t1'] - L['t0'] + 0.6)
    nxt = lines[i + 1]['t0'] - 0.12 if i + 1 < len(lines) else FILM - 0.3
    L['c0'] = L['t0']; L['c1'] = round(min(nxt, L['t0'] + need + 0.5), 3)
    assert L['c1'] - L['c0'] >= need - 1e-6, (L['id'], L['c1'] - L['c0'], need)
json.dump({'dur': FILM, 'lines': lines}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
with open(os.path.join(HERE, '..', 'sketchnote.srt'), 'w') as f:
    for i, L in enumerate(lines, 1):
        f.write(f"{i}\n{ts(L['c0'])} --> {ts(L['c1'])}\n{L['zh']}\n{L['en']}\n\n")
for L in lines:
    words = len(L['en'].split()); print(L['id'], L['t0'], L['t1'], f"cue {L['c0']}-{L['c1']} ({L['c1']-L['c0']:.2f}s)", f"{words / (L['t1'] - L['t0']):.2f} w/s")
