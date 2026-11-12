"""One timeline for picture, sound and subtitles of "Step Ten".

Reads vo/dur.json and vo/words.json (tts.py / asr_check.py), places every narration line at its planned start
(pushed later if the subtitle before it is still on screen), and writes:
  timeline.json   {dur, vo: {id: [t0, t1]}, words: {id: [[word, t0, t1], …] absolute}, subs: [{t0, t1, en, zh}]}
  ../../instruction-manual.srt   one Chinese line, one English line per cue
Rules (MAINTAINING.md, library demos): one line per language per cue, each cue ≥ 1.8 s and ≥ its spoken words + 0.6 s.
Run from anywhere: python3 styles/instruction-manual/demo/tools/timeline.py
"""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dur = json.load(open(os.path.join(HERE, 'vo', 'dur.json')))
words = json.load(open(os.path.join(HERE, 'vo', 'words.json')))

# planned start of each line (s); the shot list in DEMO.md is cut to these
PLAN = [('a', .7), ('b', 2.9), ('c', 6.6), ('d', 11.0), ('e', 19.3), ('f', 23.7), ('g', 29.0), ('h', 33.1), ('i', 38.2), ('j', 42.1)]
DUR = 50.6   # the end card is printed on the page footer at 47.3 and held to the end
SUBS = {
    'a': [('It arrives flat.', '送来的时候，它是扁的。')],
    'b': [('A box of parts, and one small key.', '一箱零件，一把小扳手。')],
    'c': [('And two people who have never built anything.', '还有两个从没装过任何东西的人。')],
    'd': [('Step 4. Never lift alone.', '第 4 步：别一个人抬。')],
    'e': [('Step 5. Turn until it clicks.', '第 5 步：拧到咔哒一声。')],
    'f': [('Somewhere around step 7,', '大概到第 7 步，'), ('everyone puts one end on upside down.', '每个人都会把一头装反。')],
    'g': [('Take it apart. Laugh. Try again.', '拆开。笑一笑。再来。')],
    'h': [('Step 9. Wait.', '第 9 步：等。')],
    'i': [('Step 10 was never in the manual.', '第 10 步，说明书里从来没有。')],
    'j': [('You learn that one by heart.', '那一步，只能用心学会。')],
}
SPLIT = {'f': 4}   # index of the first word of part 2

vo, subs, wabs, free = {}, [], {}, 0.0
for sid, t in PLAN:
    t0 = max(t, free); t1 = t0 + dur[sid]; vo[sid] = [round(t0, 3), round(t1, 3)]
    wabs[sid] = [[w, round(t0 + max(0.0, a), 3), round(t0 + b, 3)] for w, a, b in words[sid]]
    parts = SUBS[sid]
    if len(parts) == 1:
        subs.append([t0, max(t1 + .6, t0 + 1.8), *parts[0]])
    else:
        ts = t0 + max(0.0, words[sid][SPLIT[sid]][1]) - .05
        subs.append([t0, max(ts, t0 + 1.8), *parts[0]])
        a = subs[-1][1]; subs.append([a, max(t1 + .6, a + 1.8), *parts[1]])
    free = subs[-1][1] + .02
for i in range(1, len(subs)):
    if subs[i][0] < subs[i - 1][1]: subs[i - 1][1] = subs[i][0]
for s in subs:
    assert s[1] - s[0] >= 1.8 - 1e-6, s
assert subs[-1][1] < 47.2, 'the last subtitle must be gone before the end card is printed'
json.dump({'dur': DUR, 'vo': vo, 'words': wabs, 'subs': [{'t0': round(a, 3), 't1': round(b, 3), 'en': e, 'zh': z} for a, b, e, z in subs]},
          open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)


def ts(x):
    ms = int(round(x * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


with open(os.path.join(os.path.dirname(HERE), 'instruction-manual.srt'), 'w') as f:
    for i, (a, b, e, z) in enumerate(subs, 1):
        f.write(f'{i}\n{ts(a)} --> {ts(b)}\n{z}\n{e}\n\n')
print('dur', DUR, 'cues', len(subs), 'shortest', round(min(b - a for a, b, *_ in subs), 2))
for k, v in vo.items(): print(k, v)
