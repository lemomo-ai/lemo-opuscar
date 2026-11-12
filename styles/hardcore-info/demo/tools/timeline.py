"""Narration starts + bilingual subtitles → timeline.json (shared by the page, mix.py and srt), and writes the Chinese character list fonts/zh-chars.txt.
    python3 styles/hardcore-info/demo/tools/timeline.py
Subtitle rules: each cue is one Chinese line + one English line; each lasts ≥ 1.8 s and ≥ narration + 0.6 s; it appears 0.1 s early and ends 0.1 s before the next cue or 1.2 s after the narration."""
import json, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dur = json.load(open(os.path.join(HERE, 'voice/dur.json')))
END = 52.0                                     # 50 s of film + the end credit card
STARTS = {"v01": 0.45, "v02": 4.9, "v03": 10.1, "v04": 14.2, "v05": 19.0, "v06": 24.74, "v07": 27.2, "v08": 35.0, "v09": 40.6, "v10": 45.9}
ZH = {"v01": "2010 年，一款新手机有个怪毛病。",
      "v02": "握住它底部的那个角，信号就掉了。",
      "v03": "为什么？你手里的金属边框，就是天线。",
      "v04": "信号从芯片出发，顺着一根细线，接到边框上。",
      "v05": "金属圈被切开了：每道塑料缝隔出一支独立的天线。",
      "v06": "每一段的长度，对应一个频段。",
      "v07": "700 MHz 约需 11 厘米；3.5 GHz 只要 2 厘米。",
      "v08": "现在握住这个角：手把缝连了起来，信号就弱了。",
      "v09": "于是手机学会了换用没被手盖住的那支天线。",
      "v10": "不是你拿错了，你握着的，就是天线。"}
EN = {"v01": "In 2010, a new phone had a strange problem.",
      "v02": "Hold it by the bottom corner, and the signal dropped.",
      "v03": "Why? The metal edge in your hand is the antenna.",
      "v04": "From the chip, a thin cable carries the signal to the frame.",
      "v05": "The ring is cut: each plastic slit splits off a separate antenna.",
      "v06": "Each piece is sized to its band.",
      "v07": "700 MHz needs about 11 cm. 3.5 GHz, just 2.",
      "v08": "Now grip the corner. Your hand bridges the slit, and the signal fades.",
      "v09": "So phones learned to switch to the antenna your hand isn't covering.",
      "v10": "You're not holding it wrong. You are holding the antenna."}
SCREEN_ZH = '你手机的天线在哪边框就是握着线稿剖面图解'      # Chinese on screen (besides the subtitles)
ids = sorted(STARTS); subs = []
prev = -9                                     # start = max(the set start, end of the previous line + 0.605 s)
for k in ids: STARTS[k] = round(max(STARTS[k], prev + 0.605), 3); prev = STARTS[k] + dur[k]
for i, k in enumerate(ids):
    s = STARTS[k]; e = s + dur[k]
    t0 = round(s - 0.1, 3); nxt = STARTS[ids[i + 1]] - 0.1 if i + 1 < len(ids) else END
    t1 = round(min(nxt, e + 1.2), 3)
    need = max(1.8, dur[k] + 0.6)
    assert t1 - t0 >= need - 1e-6, f'{k}: subtitle {t1 - t0:.2f}s < {need:.2f}s'
    subs.append({"id": k, "t0": t0, "t1": t1, "zh": ZH[k], "en": EN[k], "vo": s, "dur": dur[k]})
json.dump({"end": END, "subs": subs}, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
chars = set(''.join(ZH.values())) | set(SCREEN_ZH)
open(os.path.join(HERE, 'fonts/zh-chars.txt'), 'w').write(''.join(sorted(c for c in chars if ord(c) > 0x2e80)))
for s in subs: print(s['id'], s['t0'], s['t1'], round(s['t1'] - s['t0'], 2))
