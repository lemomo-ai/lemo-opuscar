#!/usr/bin/env python3
"""《你亮，我就亮》Shine Back: the film's one timeline. Picture (film.py), sound (mix.py) and subtitles (.srt) all read their times from here.

Running `python timeline.py` reads vo/wav/dur.json (the real length of each Kokoro phrase) and writes:
  timeline.json   the start of every narration phrase + the subtitle cues
  subtitles .srt  bilingual (each cue: one Chinese line + one English line), path from the SRT_OUT environment variable (default out/subtitles.srt)
"""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 50.6                  # the whole film (end card included)

# ---------------------------------------------------------------- story time points (seconds)
T_LAND = 1.6        # the stream of light settles: meadow, girl
T_CATCH = 3.1       # a firefly lands on her fingertip
T_Q1, T_Q2 = 3.6, 4.1        # two blinks at the fingertip = the question
T_RIP = 5.6         # ripple: the whole meadow blinks back in turn
T_ALL = 8.4        # the whole field flashes at the same instant ("all at once")
T_RISE = 8.8       # fireflies rise and swirl
T_DEER = 9.75        # the deer is fully formed
T_TOUCH = 11.0      # nose touches hand
T_HOP = 12.55       # the girl flies onto the deer's back
T_HOPLAND = 13.0
T_WALK = 13.05      # the deer sets off, the camera tracks sideways
T_GUST = 15.0       # the wind scatters them → wide shot
T_FAR = 16.0
T_CLOUD = 20.3      # the moon is blown into storm clouds, the stars go out
T_RAIN = 20.75      # the trailing fireflies turn into rain
T_PUSH = 21.7       # the wind pushes the wide shot into a medium shot
T_MED = 22.6
T_TEAR = 25.0       # the deer is torn apart by the gale and goes out
T_FALL = 25.15      # the girl falls
T_KNEEL = 25.65
T_DRY = 26.2        # the rain stops, darkness
T_LEADBACK = 28.4   # the last firefly lights up and drifts back into her hand
T_LEADIN = 29.5
T_STAND0, T_STAND1 = 29.7, 30.7
T_RAISE0, T_RAISE1 = 30.8, 31.8
T_ASK = 33.6        # held up, one blink = the question (the first sound after the silence)
T_ANS1 = 34.3      # one point on the horizon answers
T_ANS2 = 34.8       # five more
T_SYNC = 35.35      # the whole night answers together, from far to near
SYNC_PULSES = [36.75, 37.55, 39.15, 39.95, 40.75]   # after that the whole field flashes in sync ("all at once")
T_GIANT0 = 36.5     # the embers rise and swirl
T_GIANT = 38.05     # the giant deer is fully formed
T_BOW0, T_BOW1 = 38.5, 39.5
T_TOUCH2 = 39.7     # the giant deer's nose touches the light she holds up (rhymes with T_TOUCH)
T_LEAP = 41.0       # the giant deer leaps into the sky, the whole scene re-forms
T_HILL = 42.2
T_GBLINK = 42.55    # she blinks once on the hilltop
T_DBLINK = 45.0     # the deer's eye in the sky blinks back
T_TITLE0 = 45.6     # the trail rises
T_TITLE = 46.45     # the title is fully formed
T_CRED0 = 46.6      # style name and sign-off
T_CRED = 47.3
T_SIGN0 = 7.45      # only with SIGN=1 (a 10 s cut of the opening): the sign-off gathers in the top-left sky (not used in the full film)
T_SIGN = 8.05

# ---------------------------------------------------------------- narration: (phrase id, start)
VO = [('v1_0', 0.7), ('v1_1', 2.2),
      ('v2_0', 5.2), ('v2_1', 6.75),
      ('v3_0', 10.2),
      ('v4_0', 16.4), ('v4_1', 18.45),
      ('v5_0', 22.2), ('v5_1', 24.1),
      ('v6_0', 28.6),
      ('v7_0', 30.75), ('v7_1', 32.4),
      ('v8_0', 35.6),
      ('v9_0', 42.4), ('v9_1', 43.6)]

SUBS = [  # (list of phrase ids, Chinese, English)
    (['v1_0', 'v1_1'], '夏夜里，萤火虫闪一下，就是在发问。', "On summer nights, a firefly's blink is a question."),
    (['v2_0', 'v2_1'], '有一只回答，成千上万只就一起闪回来。', 'When one answers, thousands blink back, all at once.'),
    (['v3_0'], '那天晚上，回答长着鹿角。', 'That night, the answer had antlers.'),
    (['v4_0', 'v4_1'], '它驮着她，走出了她认得的一切。', 'It carried her past the edge of everything she knew.'),
    (['v5_0', 'v5_1'], '后来暴风雨来了，所有的光都灭了。', 'Then the storm came, and every light went out.'),
    (['v6_0'], '只剩下一只。', 'Except for one.'),
    (['v7_0', 'v7_1'], '她把它高高举起，问了一声。', 'So she held it up, and asked.'),
    (['v8_0'], '整片黑夜都回答了。', 'And the whole dark answered.'),
    (['v9_0', 'v9_1'], '你亮一下，就会有人亮回来。', 'Shine, and someone will shine back.'),
]


def build():
    dur = json.load(open(os.path.join(HERE, 'vo', 'wav', 'dur.json')))
    st = dict(VO)
    cues = []
    for ids, zh, en in SUBS:
        a = st[ids[0]]; b = st[ids[-1]] + dur[ids[-1]]
        t0 = a - 0.12
        t1 = max(b + 0.65, t0 + 1.9)
        cues.append(dict(t0=round(t0, 3), t1=round(t1, 3), zh=zh, en=en, speech=round(b - a, 3)))
    for k in range(len(cues) - 1):
        assert cues[k]['t1'] <= cues[k + 1]['t0'] - 0.05, ('subtitles overlap', cues[k], cues[k + 1])
    lines = [dict(id=i, t=t, d=dur[i]) for i, t in VO]
    for (i, t), (j, u) in zip(VO, VO[1:]):
        assert t + dur[i] + 0.3 <= u, ('narration overlaps', i, j)
    json.dump(dict(dur=DUR, lines=lines, cues=cues), open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
    def fmt(s):
        ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    srt = '\n'.join(f"{k + 1}\n{fmt(c['t0'])} --> {fmt(c['t1'])}\n{c['zh']}\n{c['en']}\n" for k, c in enumerate(cues))
    out = os.environ.get('SRT_OUT', os.path.join(HERE, 'out', 'subtitles.srt'))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(srt)
    for c in cues:
        print(f"{c['t0']:6.2f}–{c['t1']:6.2f}  hold {c['t1'] - c['t0']:.2f}s  speech {c['speech']:.2f}s  {c['en']}")
    return cues


def cues():
    p = os.path.join(HERE, 'timeline.json')
    return json.load(open(p))['cues'] if os.path.exists(p) else build()


if __name__ == '__main__':
    build()
