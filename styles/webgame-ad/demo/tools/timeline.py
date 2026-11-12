"""Lay the voice lines on the 128 BPM grid and write timeline.json (the picture, the score and the subtitles all read it):
   python3 styles/webgame-ad/demo/tools/timeline.py
Each line starts on the next eighth note after the previous one ends (+ a short gap, longer between sections), so the
music grid and the voice agree. Per-character times come from the speech check (vo/words.json): when Whisper's characters
line up with the script one for one they are used directly, otherwise the line's speech span is spread evenly. Cues are the
times of key words (「两百」, 「划走」…) that the picture slams on. Subtitle cues (subs) pair each line with its English
(lines_en.json) and hold until the next line starts, or 0.6 s after the voice ends, at least 1.8 s."""
import json, os, re, math
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(HERE, 'vo')
LINES = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8')); DUR = json.load(open(os.path.join(VO, 'dur.json')))
WORDS = json.load(open(os.path.join(VO, 'words.json'), encoding='utf-8'))
EN = {l['id']: l['text'] for l in json.load(open(os.path.join(HERE, 'lines_en.json'), encoding='utf-8'))}
BPM = 128; Q = 60 / BPM; E = Q / 2; FPS = 24
up = lambda t: math.ceil(t / E - 1e-6) * E
fr = lambda t: round(t * FPS) / FPS
PUN = re.compile(r'[，。、：；！？“”（）,.!?:; ]')

def chars_of(L, t0):
    text = L['text']; cs = [c for c in text if not PUN.match(c)]
    ws = [w for w in WORDS.get(L['id'], [])]
    wc = []
    for w, a, b in ws:
        s = [c for c in w if not PUN.match(c)]
        for k, c in enumerate(s): wc.append((c, a + (b - a) * k / len(s)))
    if len(wc) == len(cs): ts = [max(0, t) for _, t in wc]
    else:
        a = max(0, ws[0][1]) if ws else 0; b = ws[-1][2] if ws else DUR[L['id']]
        ts = [a + (b - a) * k / len(cs) for k in range(len(cs))]
    out, k = [], 0
    for c in text:
        if PUN.match(c): out.append([c, None])
        else: out.append([c, round(t0 + ts[k], 3)]); k += 1
    return out

T = {}; lines = []
def place(i, t0):
    L = LINES[i]; t0 = fr(t0); lines.append({'id': L['id'], 'text': L['text'], 't0': t0, 't1': round(t0 + DUR[L['id']], 3), 'chars': chars_of(L, t0)})
    return lines[-1]
byid = {L['id']: i for i, L in enumerate(LINES)}
ad = place(byid['ad'], .2)
T['tap'] = fr(up(ad['t1'] + .1)); T['freeze'] = fr(T['tap'] + Q)
t = T['freeze'] + .35
prev = None
for L in LINES[1:]:
    if L['id'] in ('e1', 'e2'): continue
    sec = prev is not None and L['id'][0] != prev[0]
    t = up(t + (.24 if sec else .06)) if prev else up(t)
    ln = place(byid[L['id']], t); t = ln['t1']; prev = L['id']
T['close'] = fr(up(t + .3)); T['buzz'] = fr(up(T['close'] + 1.6))
e1 = place(byid['e1'], up(T['buzz'] + .5)); e2 = place(byid['e2'], up(e1['t1'] + .12))
T['no'] = fr(up(e2['t1'] + .35)); T['card'] = fr(up(T['no'] + 1.8)); DURF = fr(T['card'] + 6.5)   # end card: title, sign-off, sources

L = {l['id']: l for l in lines}
def at(i, sub):
    l = L[i]; k = l['text'].index(sub)
    for c, tt in l['chars'][k:]:
        if tt is not None: return fr(tt)
CUE = dict(tag200=at('q1', '两百'), scaleIn=at('q2', '一道题'), ineq=at('q3', '少于'), one=at('a1', '一个'), more=at('a2', '多充'),
           six=at('a3', '六块'), press=at('a3', '钱包'), rankUp=at('a4', '越充'), n469=at('a5', '四百'), slash=at('a6', '砍人'), watch=at('a6', '有人看'),
           empty=at('b1', '走光'), newsv=at('b2', '开新服'), lvl1=at('b2', '一级'), again=at('b2', '再充'), merge=at('b3', '合在'),
           buy=at('c1', '花钱买'), pct=at('c2', '六到八成'), nextYou=at('c2', '下一个你'), payback=at('c3', '回得了本'),
           waste=at('d1', '浪费'), tu=at('d2', '这么土'), swipe=at('d2', '划走'), stay=at('d2', '留下'), pct06=at('d3', '零点几'),
           notAll=at('e2', '不是'), you=at('e2', '会充钱的你'), **T)
SC = [('ad', 0), ('click', T['tap'] - .3), ('pullback', L['q1']['t0']), ('scale', L['q2']['t0']), ('payers', L['a1']['t0']), ('firstpay', L['a3']['t0']),
      ('rank', L['a4']['t0']), ('case1', L['a5']['t0']), ('kill', L['a6']['t0']), ('dead', L['b1']['t0']), ('spikes', L['b2']['t0']), ('merge', L['b3']['t0']),
      ('newbuy', L['c1']['t0']), ('bars', L['c2']['t0']), ('loop', L['c3']['t0']), ('sieve', L['d1']['t0']), ('star', L['d3']['t0']),
      ('close', T['close'] - .6), ('buzz', T['buzz']), ('final', L['e2']['t0']), ('card', T['card'])]
# hits: [time, shake, white flash]
H = [[0, 1.4, .7], [T['tap'], .6, 0], [T['freeze'], 1.0, .5], [CUE['tag200'], 1.2, .3], [CUE['ineq'], 1.2, .4], [CUE['one'], .9, 0], [CUE['more'], .8, 0],
     [CUE['press'], 1.3, .6], [CUE['rankUp'], .8, 0], [CUE['n469'], 1.2, .3], [CUE['slash'], 1.4, .4], [CUE['empty'], .6, 0], [CUE['again'], .9, .2],
     [CUE['merge'], 1.5, .6], [CUE['buy'], 1.0, .2], [CUE['pct'], 1.2, .3], [CUE['payback'], 1.2, .4], [CUE['swipe'], 1.0, .2], [CUE['stay'], 1.2, .3],
     [CUE['pct06'], 1.0, .2], [T['buzz'], 1.2, .3], [CUE['notAll'], 1.0, .2], [CUE['you'], 1.7, .8], [T['no'], .8, 0]]
H += [[fr(t0), .5, 0] for n, t0 in SC[2:] if n not in ('close',) and all(abs(t0 - h[0]) > .2 for h in H)]
order = sorted(lines, key=lambda l: l['t0'])
subs = []
for k, l in enumerate(order):
    nxt = order[k + 1]['t0'] - .07 if k + 1 < len(order) else DURF   # the next cue starts .05 s before its voice
    t0 = max(0, l['t0'] - .05); subs.append({'id': l['id'], 't0': round(t0, 3), 't1': round(min(nxt, max(t0 + 1.8, l['t1'] + .6)), 3), 'zh': l['text'], 'en': EN[l['id']]})
json.dump({'bpm': BPM, 'dur': DURF, 'lines': lines, 'subs': subs, 'scenes': [{'name': n, 't0': fr(t0)} for n, t0 in SC], 'cues': CUE, 'hits': sorted(H)},
          open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('dur', DURF, '| scenes', ' '.join(f'{n}@{t0:.2f}' for n, t0 in SC))
