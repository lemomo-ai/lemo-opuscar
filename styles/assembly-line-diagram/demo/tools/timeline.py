"""One timeline for picture, sound and subtitles ("The Disassembly Line", full film).

Reads out/voice/dur.json and out/voice/words.json (tts.py / asr_check.py), places every narration line at its planned start
and writes:
  demo/timeline.json   (story time) {dur, vo: {id: [t0, t1]}, w: {mark: t}, subs: [{t0, t1, en, zh, n}]}  (read by the page and mix.py)
  ../assembly-line-diagram.srt   bilingual: one Chinese line, one English line per cue, in film time (tools/warp.py)
Rules: one line per language, each cue >= 1.8 s and >= its spoken words + 0.6 s.
Run from anywhere: python3 styles/assembly-line-diagram/demo/tools/timeline.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from warp import film, FILM_DUR
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILM = os.path.dirname(HERE)
VO = os.path.join(HERE, 'out', 'voice')
dur = json.load(open(os.path.join(VO, 'dur.json')))
words = json.load(open(os.path.join(VO, 'words.json')))

# planned starts (s): the shot list in DEMO.md is cut to these
PLAN = [('v1', 0.6), ('v2', 5.0), ('v3', 9.7), ('v4', 13.4), ('v5', 16.8), ('v6', 21.4), ('v7', 25.8),
        ('v9', 33.7), ('v10', 38.0), ('v11', 40.9), ('v12', 45.05)]
DUR = 51.9
# (en, zh, station number shown on the ticket)
SUBS = {
    'v1': [('Most factories put things together.', '大多数工厂，是把东西装起来。', 0)],
    'v2': [('The one inside you takes them apart.', '你身体里这一座，专门拆。', 0)],
    'v3': [('It starts at the crushers.', '第一站，粉碎机。', 1)],
    'v4': [('An acid drum churns it all to paste,', '酸液滚筒把它搅成一团糊，', 2)],
    'v5': [('and a gatekeeper lets it out, a spoonful at a time.', '看门人一次只放出去一勺。', 3)],
    'v6': [('On the sorting line, the sandwich comes apart:', '到了分拣线，三明治被拆开：', 4)],
    'v7': [('bread into sugar, ham into amino acids,', '面包变成糖，火腿变成氨基酸，', 4), ('cheese into fatty acids.', '奶酪变成脂肪酸。', 4)],
    'v9': [('The liver shelves the sugar, and it waits.', '肝把糖码上货架，然后等着。', 5)],
    'v10': [('6 hours later: the bus.', '6 个小时以后：公交车来了。', 0)],
    'v11': [('Down the arteries, into tiny furnaces.', '顺着动脉，送进一个个小熔炉。', 6)],
    'v12': [('Taken apart, lunch becomes the strength to run.', '拆开了的午饭，变成你奔跑的力气。', 0)],
}
SPLIT = {'v7': 7}           # index of the first word of part 2
MARKS = {'sugar': ('v7', 0), 'ham': ('v7', 3), 'cheese': ('v7', 7), 'spoonful': ('v5', 7), 'apart2': ('v2', 6),
         'arteries': ('v11', 2), 'furnaces': ('v11', 5), 'run': ('v12', 7), 'lunch': ('v12', 2), 'bus': ('v10', 4)}

vo, subs = {}, []
for sid, t0 in PLAN:
    t1 = t0 + dur[sid]; vo[sid] = [round(t0, 3), round(t1, 3)]
    parts = SUBS[sid]
    if len(parts) == 1:
        subs.append([t0, max(t1 + 0.6, t0 + 1.8), *parts[0]])
    else:
        ts = t0 + max(0.0, words[sid][SPLIT[sid]][1]) - 0.05
        subs.append([t0, ts, *parts[0]]); subs.append([ts, max(t1 + 0.6, ts + 1.8), *parts[1]])
for i in range(1, len(subs)):
    assert subs[i][0] >= subs[i - 1][1] - 1e-6, ('overlap', subs[i - 1], subs[i])
for s in subs: assert s[1] - s[0] >= 1.8 - 1e-6, s
w = {k: round(vo[s][0] + max(0.0, words[s][i][1]), 3) for k, (s, i) in MARKS.items()}
json.dump({'dur': DUR, 'vo': vo, 'w': w,
           'subs': [{'t0': round(a, 3), 't1': round(b, 3), 'en': e, 'zh': z, 'n': n} for a, b, e, z, n in subs]},
          open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)

def ts(x):
    ms = int(round(x * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(FILM, 'assembly-line-diagram.srt'), 'w') as f:
    for i, (a, b, e, z, n) in enumerate(subs, 1):
        f.write(f'{i}\n{ts(film(a))} --> {ts(film(b))}\n{z}\n{e}\n\n')   # the .srt is in film time
print('dur', DUR, 'cues', len(subs), 'shortest', round(min(b - a for a, b, *_ in subs), 2), 'last sub ends', round(subs[-1][1], 2))
for k, v in vo.items(): print(k, v)
print(w)
