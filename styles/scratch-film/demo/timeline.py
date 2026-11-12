"""One timeline for the film: where each narration line starts, and the bilingual subtitle cues.
Reads vo/lines.json + out/voice/dur.json (Kokoro), writes timeline.json (read by the page and by mix.py) and out/subs.srt.
The picture in js/shots.js is timed to these starts (see the T table there); if the voice changes, check they still fit."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, 'vo/lines.json')))
D = json.load(open(os.path.join(HERE, 'out/voice/dur.json')))
FILM = 52.0
START = {'v01': 0.60, 'v02': 5.60, 'v03': 10.20, 'v04': 14.40, 'v05': 19.60, 'v06': 23.30,
         'v07': 27.60, 'v08': 32.45, 'v09': 36.55, 'v10': 39.25, 'v11': 43.35, 'v12': 47.0}
SUB = {
 'v01': '日落时分，在半公里深的海里，有东西开始往上游。',
 'v02': '一条灯笼鱼，还没有手指长。',
 'v03': '它摸着黑，一路游向海面。',
 'v04': '可头顶那点微光，会把它照成一个影子。',
 'v05': '下面的猎手，正抬头往上看。',
 'v06': '于是，它点亮肚子上的一排灯，',
 'v07': '和头顶的光一样亮。影子不见了。',
 'v08': '到了午夜，它游到海面觅食。',
 'v09': '而它并不孤单。',
 'v10': '每天夜里，无数动物从深海升起。',
 'v11': '这是地球上规模最大的迁徙。',
 'v12': '日出之前，它们又一起沉回黑暗。',
}
EN_SUB = {'v01': 'At sunset, half a kilometre down, something starts to climb.'}
lines = []
for l in L:
    t0 = START[l['id']]; d = D[l['id']]
    lines.append({'id': l['id'], 't0': t0, 't1': round(t0 + d, 3), 'dur': d, 'zh': SUB[l['id']], 'en': EN_SUB.get(l['id'], l['text'])})
lines.sort(key=lambda x: x['t0'])
for i, x in enumerate(lines):
    need = max(1.8, x['dur'] + 0.6)
    nxt = lines[i + 1]['t0'] - 0.1 if i + 1 < len(lines) else FILM - 0.4
    x['c0'] = x['t0']; x['c1'] = round(min(nxt, x['t0'] + need + 0.5), 3)
    assert x['c1'] - x['c0'] >= need - 1e-6, (x['id'], x['c1'] - x['c0'], need)
    if i + 1 < len(lines): assert x['t1'] < lines[i + 1]['t0'] - 0.25, ('overlap', x['id'])
json.dump({'dur': FILM, 'lines': lines}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
def ts(v):
    h, r = divmod(v, 3600); m, s = divmod(r, 60); ms = int(round((s - int(s)) * 1000))
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{ms:03d}'
with open(os.path.join(HERE, 'out', 'subs.srt'), 'w') as f:
    for i, x in enumerate(lines, 1):
        f.write(f"{i}\n{ts(x['c0'])} --> {ts(x['c1'])}\n{x['zh']}\n{x['en']}\n\n")
for x in lines:
    w = len(x['en'].split())
    print(x['id'], x['t0'], x['t1'], f"cue {x['c0']}-{x['c1']} ({x['c1'] - x['c0']:.2f}s)", f"{w / x['dur']:.2f} w/s")
