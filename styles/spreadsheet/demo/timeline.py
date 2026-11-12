"""One timeline for the whole film: narration starts, phrase timings, bilingual subtitle cues.
Reads vo/chunks.json + vo/chunks/dur.json (Kokoro af_bella), writes tl.js (page), timeline.json (mix) and ../spreadsheet.srt.
The picture in index.html keys its actions to these starts (window.TL), so regenerating the voice keeps picture and voice in sync."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'vo/chunks.json')))
D = json.load(open(os.path.join(HERE, 'vo/chunks/dur.json')))
IN_GAP = 0.30                      # breath between the phrases of one line
START = {'v01': 0.50, 'v02': 3.05, 'v03': 8.40, 'v04': 10.35, 'v05': 15.40, 'v06': 18.90, 'v07': 21.05,
         'v08': 25.50, 'v09': 29.80, 'v10': 34.45, 'v11': 39.25, 'v12': 42.65, 'v13': 44.90}
SUB = {
 'v01': ('治肾结石的两种手术。', 'Two treatments for kidney stones.'),
 'v02': ('B 的成功率更高：83% 对 78%。', 'Treatment B worked more often: 83% against 78%.'),
 'v03': ('你会选哪一个？', 'Which would you choose?'),
 'v04': ('每一格是一位真实的病人，一共 700 位。', 'Every cell is one real patient. 700 in all.'),
 'v05': ('可是这张表藏起了几列。', 'But some columns are hidden.'),
 'v06': ('藏起来的，是结石的大小。', 'They hold stone size.'),
 'v07': ('大结石更难治，而大多数大结石分给了 A。', 'Big stones are harder to treat, and most of them went to A.'),
 'v08': ('现在按结石大小，把病人分开。', 'Now split the patients by stone size.'),
 'v09': ('小结石：A 赢，93% 对 87%。', 'Small stones: A wins, 93 to 87.'),
 'v10': ('大结石：还是 A，73% 对 69%。', 'Large stones: A again, 73 to 69.'),
 'v11': ('每一组都更好，合起来却更差。', 'Better in every group, worse in total.'),
 'v12': ('这就是辛普森悖论。', "That's Simpson's paradox."),
 'v13': ('相信一个总数之前，先把藏起来的列打开。', 'Before you trust a total, unhide the columns.'),
}
FILM = 52.0
lines = []
for lid, t in START.items():
    parts = []
    for c in [c for c in C if c['id'].startswith(lid + '_')]:
        parts.append({'id': c['id'], 't': round(t, 3), 'dur': D[c['id']]}); t += D[c['id']] + IN_GAP
    end = parts[-1]['t'] + parts[-1]['dur']
    lines.append({'id': lid, 't0': START[lid], 't1': round(end, 3), 'parts': parts, 'zh': SUB[lid][0], 'en': SUB[lid][1]})
# cues: from the line start, at least max(1.8, line + 0.6) s, up to just before the next line
for i, L in enumerate(lines):
    need = max(1.8, L['t1'] - L['t0'] + 0.6)
    nxt = lines[i + 1]['t0'] - 0.12 if i + 1 < len(lines) else FILM - 3.45
    L['c0'] = L['t0']; L['c1'] = round(min(nxt, L['t0'] + need + 0.6), 3)
    assert L['c1'] - L['c0'] >= need - 1e-6, (L['id'], L['c1'] - L['c0'], need)
P = {p['id']: p['t'] for L in lines for p in L['parts']}
json.dump({'dur': FILM, 'lines': lines}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(HERE, 'tl.js'), 'w').write('window.TL = ' + json.dumps({'dur': FILM, 'lines': lines, 'p': P}, ensure_ascii=False) + ';\n')
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
with open(os.path.join(HERE, '..', 'spreadsheet.srt'), 'w') as f:
    for i, L in enumerate(lines, 1):
        f.write(f"{i}\n{ts(L['c0'])} --> {ts(L['c1'])}\n{L['zh']}\n{L['en']}\n\n")
words = sum(len(c['text'].split()) for c in C); speech = sum(D.values())
for L in lines:
    print(L['id'], L['t0'], L['t1'], f"cue {L['c0']}-{L['c1']} ({L['c1']-L['c0']:.2f}s)")
print(f'{words} words in {speech:.1f} s of speech: {words / speech:.2f} w/s')
