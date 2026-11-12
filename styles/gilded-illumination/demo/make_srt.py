"""<slug>.srt from the subtitle table in film.js (one cue per line: Chinese line, English line). Usage: python make_srt.py OUT.srt"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'film.js'), encoding='utf-8').read()
block = src[src.index('const SUBS = ['):src.index('];', src.index('const SUBS = ['))]
cues = re.findall(r"\[([\d.]+), ([\d.]+), '([^']+)', '([^']+)'\]", block)
ts = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round((s - int(s)) * 1000)):03d}"
out = []
for i, (a, b, zh, en) in enumerate(cues, 1): out.append(f"{i}\n{ts(float(a))} --> {ts(float(b))}\n{zh}\n{en}\n")
dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'demo.srt')
open(dst, 'w', encoding='utf-8').write('\n'.join(out))
print(os.path.basename(dst), len(cues), 'cues; shortest', round(min(float(b) - float(a) for a, b, _, _ in cues), 2), 's')
