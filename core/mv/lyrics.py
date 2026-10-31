"""Lyrics for a music video: find them, then time every line and character to the song.

  python core/mv/lyrics.py search "<title>" [--artist A] [--dur 172] --out <project>/lyrics/
      Looks the song up on NetEase Cloud Music, LRCLIB and Kugou and saves every lyric it finds as refs/<source>-<id>.lrc
      (with the platform's translation as refs/<source>-<id>.trans.lrc when there is one), and refs.json, best match first:
      title, artist, duration, line count, whether it is timed. These are references: covers, AI-made and fan lyrics are
      common, and a live version is often sung differently. Read them, pick one and correct it by ear (MV.md §2).
  python core/mv/lyrics.py align song.wav lyrics.txt|.lrc --out <project>/lyrics/ [--lang auto|zh|ja|ko|en] [--model M]
      Splits off the vocals (demucs, cached in stems/), transcribes them with Whisper in short chunks cut at the singer's
      breaths (one pass over a whole song skips sections), then aligns the lyric text to what was heard, by sound:
      Chinese by toneless pinyin with the usual accent merges (zh/z, ch/c, sh/s, -ng/-n, l/n), so a homophone mishearing
      (一起走 heard as 依旧走) still lands on the right character. Writes lyrics.json:
        {lines: [{id, t0, t1, text, chars: [{c, t0, t1}], heard, match, flag}], extra: [{t0, t1, text}], credits: [...]}
      and prints a report. flag "" = timed by the voice; "weak" = under half its sounds matched (listen to it); "guess" =
      nothing matched, placed from the LRC times or between its neighbours (listen and fix). extra = sung phrases that are
      in no line: a live ad-lib, a missing line, or noise; add them to the text if they are lyrics and run align again.
      The transcription is cached (asr-<model>.json), so a corrected text re-aligns in seconds.
  python core/mv/lyrics.py listen song.wav <t0> <t1> --out <project>/lyrics/ [--lang zh]
      Your ear for a flagged line: transcribes that stretch with 5 s of context on each side (a short clip alone is often
      heard as nothing) and prints each word with its time. Then pin the line in the lyrics file: "@74.5 <the line>"
      starts that line at 74.5 s (its flag becomes "pinned").
  python core/mv/lyrics.py transcribe song.wav --out <project>/lyrics/ [--lang zh] [--model M]
      No lyrics anywhere: writes draft.txt, one line per sung phrase, for you to correct before align.
  python core/mv/lyrics.py ocr video.mp4 --out <project>/lyrics/ [--fps 5] [--conf .6]
      The video has the lyrics burned in (most fan uploads and short-video clips do): reads them off the frames with RapidOCR
      and writes ocr.lrc (one row per subtitle, timed to when it appears) and ocr.json. Far more reliable than the ear for
      dialect, rap and slang. Text that stays on screen most of the time (logos, watermarks, "全网已发行") and text that is
      mostly digits (number plates, prices) is dropped. OCR can misread or silently drop a rare character, even at full confidence:
      check the lines against a few frames by eye, fix them, then align on the corrected text.
      Get the video with get_song.py --video.

lyrics.txt is one sung line per row (blank rows and [section] rows are skipped). An .lrc may be used as it is; its credit
rows (作词 / 作曲 / 编曲 …, Lyrics by …) go to "credits", not to lines. Translations are not this tool's job: add an "en"
(or any language code) field to each line of lyrics.json yourself (MV.md §2).
Whisper: mlx-whisper on Apple silicon when installed, else faster-whisper; default model large-v3-turbo (--model or WHISPER_MODEL).
Exit codes: 0 done (search: something found); 1 nothing found / failed; 2 usage or missing package.
"""
import sys, os, re, json, argparse, hashlib, subprocess, urllib.request, urllib.parse, base64, difflib, unicodedata
import numpy as np

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36'
CJK = re.compile('[㐀-鿿豈-﫿]')
KANA_HANGUL = re.compile('[぀-ヿ가-힯]')
CREDIT = re.compile(r'^\s*(作词|作曲|编曲|制作人?|混音|母带|和声|吉他|贝斯|鼓|键盘|录音|监制|出品|发行|统筹|策划|词|曲|OP|SP|'
                    r'lyrics?|music|composer|arranger|producer|mixed|mastered)\b.{0,3}[:：]', re.I)
TAG = re.compile(r'\[(\d+):(\d+(?:[.:]\d+)?)\]')
MAX_UNIT = 0.9   # longest a sung unit counts for (s): even held notes rarely exceed it


def die(msg, code=1): print(f'✗ {msg}', file=sys.stderr); sys.exit(code)


def get(url, headers=None, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.read()


def get_json(url, headers=None):
    try: return json.loads(get(url, headers))
    except Exception as e: print(f'  ! {url.split("/")[2]}: {e}', file=sys.stderr); return None


# -- LRC / plain text --
def parse_lyrics(path):
    """-> (lines, credits). lines = [{'text', 'lrc_t'}]; lrc_t None means no time"""
    lines, credits = [], []
    for raw in open(path, encoding='utf-8-sig').read().splitlines():
        if raw.lstrip().startswith('#'): continue   # comment line
        tags = TAG.findall(raw); text = TAG.sub('', raw).strip()
        if re.match(r'^\[[a-z]+:.*\]$', raw.strip(), re.I) or raw.strip().startswith('{'): continue   # [ar:]-style metadata, NetEase JSON rows
        if not text or re.fullmatch(r'\[.*\]|【.*】', text): continue                                     # empty lines, [Chorus] section marks
        if re.fullmatch(r'[(（].*[)）]', text) and not (CJK.search(text) or KANA_HANGUL.search(text)): continue   # (Chorus) goes; a sung Chinese aside like (是咯) stays
        if CREDIT.match(text): credits.append(text); continue
        pin = None
        m = re.match(r'^@(\d+(?:\.\d+)?)\s+(.*)$', text)
        if m: pin, text = float(m.group(1)), m.group(2).strip()   # "@74.5 line": pinned to start at 74.5 s (a manual fix after listening)
        ts = [int(m_) * 60 + float(s_.replace(':', '.')) for m_, s_ in tags] or [None]
        for t in ts: lines.append({'text': text, 'lrc_t': t, 'pin': pin})
    if any(l['lrc_t'] is not None for l in lines): lines.sort(key=lambda l: l['lrc_t'] if l['lrc_t'] is not None else 1e9)
    return lines, credits


# -- sound units: Chinese by pinyin, kana/hangul by character, Latin script by word --
_NUM = '零一二三四五六七八九'


def zh_number(s):
    """Arabic numerals -> Chinese reading (0–9999; longer ones digit by digit), for alignment only"""
    n = int(s)
    if len(s) > 4 or s.startswith('0') and len(s) > 1: return ''.join(_NUM[int(c)] for c in s)
    if n < 10: return _NUM[n]
    out, units, zero = '', ['千', '百', '十', ''], False
    for d, u in zip(s.rjust(4, '0'), units):
        d = int(d)
        if d: out += ('零' if zero and out else '') + _NUM[d] + u; zero = False
        elif out: zero = True
    return out[1:] if out.startswith('一十') else out


def _pinyin():
    try:
        from pypinyin import lazy_pinyin, Style
        return lambda c: lazy_pinyin(c, style=Style.NORMAL, errors='ignore')
    except ImportError: die('pypinyin is missing: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv', 2)


def fuzz(p):
    """Merge the sounds accents and singing blur most: zh/z ch/c sh/s, front/back nasals, l/n, f/h"""
    p = re.sub('^zh', 'z', re.sub('^ch', 'c', re.sub('^sh', 's', p)))
    p = re.sub('^l', 'n', re.sub('^f', 'h', p))
    return re.sub('ng$', 'n', p)


def tokens(text):
    """A line of text -> [(token, start, end)]: one token per CJK/kana/hangul character, one per Latin word or digit run"""
    out = []
    for m in re.finditer(r'[A-Za-z\']+|\d+|[㐀-鿿豈-﫿぀-ヿ가-힯]', unicodedata.normalize('NFKC', text)):
        out.append((m.group(), m.start(), m.end()))
    return out


def units(tok, py):
    """Sound units of a token (a list; a digit run reads as several)"""
    if tok.isdigit(): return [fuzz(p) for p in py(zh_number(tok))]
    if CJK.match(tok): return [fuzz(p) for p in py(tok)] or [tok]
    if KANA_HANGUL.match(tok): return [tok]
    return [tok.lower().strip("'")]


# -- alignment: global Needleman–Wunsch scored by sound --
def sim(a, b):
    if a == b: return 2.0
    if a and b and (a[0] == b[0] or a[-2:] == b[-2:]): return 0.3   # same initial or final: half a match
    return -1.0


def align_units(A, B, gap=-0.7):
    """A, B are sound-unit lists -> for each A the index of its B (-1 if unmatched)"""
    n, m = len(A), len(B)
    S = np.zeros((n + 1, m + 1), np.float32); P = np.zeros((n + 1, m + 1), np.int8)   # 0 diagonal, 1 up, 2 left
    S[:, 0] = np.arange(n + 1) * gap; S[0, :] = np.arange(m + 1) * gap; P[1:, 0] = 1; P[0, 1:] = 2
    Bs = B
    for i in range(1, n + 1):
        a = A[i - 1]; row, prev = S[i], S[i - 1]
        diag = prev[:-1] + np.array([sim(a, b) for b in Bs], np.float32)
        up = prev[1:] + gap
        best = np.maximum(diag, up); pick = np.where(diag >= up, 0, 1).astype(np.int8)
        for j in range(1, m + 1):   # a left move depends on the previous cell in the row, so cells go one by one
            l = row[j - 1] + gap
            if l > best[j - 1]: row[j] = l; P[i, j] = 2
            else: row[j] = best[j - 1]; P[i, j] = pick[j - 1]
    out = [-1] * n; i, j = n, m
    while i > 0 and j > 0:
        p = P[i, j]
        if p == 0:
            if A[i - 1] == B[j - 1] or sim(A[i - 1], B[j - 1]) > 0: out[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif p == 1: i -= 1
        else: j -= 1
    return out


# -- vocals and recognition --
def vocals(song, out):
    stem = os.path.join(out, 'stems', 'vocals.wav')
    if os.path.exists(stem) and os.path.getmtime(stem) > os.path.getmtime(song): return stem
    print('separating vocals (demucs)…')
    r = subprocess.run([sys.executable, '-m', 'demucs', '--two-stems', 'vocals', '-n', 'htdemucs', '-o', os.path.join(out, 'sep'), song],
                       capture_output=True, text=True)
    if r.returncode: die('demucs failed (sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv):\n' + r.stderr[-800:])
    d = os.path.join(out, 'sep', 'htdemucs', os.path.splitext(os.path.basename(song))[0])
    os.makedirs(os.path.join(out, 'stems'), exist_ok=True)
    for f in ('vocals.wav', 'no_vocals.wav'): os.replace(os.path.join(d, f), os.path.join(out, 'stems', f))
    return stem


def envelope(x, sr, hop_s=0.05):
    hop = int(sr * hop_s); e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
    db = 20 * np.log10(e); return db, max(-50.0, np.percentile(db, 95) - 28)


def chunks(x, sr, max_len=24.0, min_len=16.0, a0=0.0, a1=None):
    """Cut a0–a1 into chunks of <= max_len s, each cut at the weakest vocal frame between min_len and max_len (a breath).
    24 s chunks with the lyrics as a prompt matched far more words than 14 s chunks or no prompt (tested on a 144 s live
    rap); skipped lines are left to holes(). Returns [(t0, t1)]"""
    db, _ = envelope(x, sr); n = len(db) if a1 is None else min(len(db), int(a1 / .05)); out, a = [], int(a0 / .05)
    while a < n:
        if (n - a) * .05 <= max_len: out.append((a * .05, n * .05)); break
        lo, hi = a + int(min_len / .05), a + int(max_len / .05)
        w = np.convolve(db[lo:hi], np.ones(5) / 5, 'same')   # smooth a little so a cut does not fall in the gap inside a word
        b = lo + int(np.argmin(w)); out.append((a * .05, b * .05)); a = b
    return [(max(0.0, t0 - .3), t1 + .3) for t0, t1 in out]


def holes(x, sr, words, dur, min_gap=1.2):
    """Gaps of >= min_gap s between words while the voice keeps sounding: lines Whisper skipped"""
    db, thr = envelope(x, sr); out = []; edges = [0.0] + [t for w in words for t in (w['t0'], w['t1'])] + [dur]
    for a, b in zip(edges[0::2], edges[1::2]):
        if b - a < min_gap: continue
        seg = db[int(a / .05):int(b / .05)]
        if len(seg) and (seg > thr).mean() > .5: out.append((a, b))
    return out


def trust(text, logprob, no_speech, compression):
    """Drop segments Whisper itself is unsure of: invented sign-offs, no speech, loops (high compression ratio), low overall confidence"""
    return not (HALLUCINATION.search(text) or no_speech > .6 or compression > 2.4 or logprob < -1.0)


def degenerate(ws):
    """Remove the loops Whisper produces when stuck (one character 4+ times in a row, or one repeated inside a word)"""
    out = []
    for w in ws:
        if len(w['w']) >= 6 and len(set(w['w'])) <= 2: continue
        if len(out) >= 3 and all(o['w'] == w['w'] for o in out[-3:]): continue
        out.append(w)
    return out


# lines Whisper invents over silence or mush (video-site subtitle-group sign-offs are the most common)
HALLUCINATION = re.compile(r'订阅|点赞|打赏|转发|字幕|明镜|感谢观看|谢谢观看|请不吝|Amara|subtitles? by|thanks? for watching', re.I)


def whisper(path, lang, model, prompt, out):
    """-> [{'w', 't0', 't1'}] (word times with the chunk offset added), cached in asr-<model>.json"""
    import soundfile as sf
    x, sr = sf.read(path, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != 16000:
        import soxr; x = soxr.resample(x, sr, 16000); sr = 16000
    key = hashlib.md5(f'{os.path.getsize(path)}{os.path.getmtime(path)}{lang}{prompt}'.encode()).hexdigest()[:10]
    cache = os.path.join(out, f'asr-{re.sub(r"[^A-Za-z0-9.-]", "_", model)}.json')
    if os.path.exists(cache):
        c = json.load(open(cache, encoding='utf-8'))
        if c.get('key') == key: return c['words']
    backend = None
    try:
        import mlx_whisper; backend = 'mlx'
        repo = model if '/' in model else f'mlx-community/whisper-{model}'
    except ImportError:
        try: from faster_whisper import WhisperModel; backend = 'faster'; fw = WhisperModel(model, compute_type='int8')
        except ImportError: die('no Whisper backend: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv', 2)
    def run(a, b):
        clip = x[int(max(0, a) * sr):int(b * sr)]
        if backend == 'mlx':
            r = mlx_whisper.transcribe(clip, path_or_hf_repo=repo, language=lang, word_timestamps=True, initial_prompt=prompt,
                                       condition_on_previous_text=False, verbose=None)
            ws = [(w['word'], w['start'], w['end']) for s in r['segments'] if trust(s['text'], s.get('avg_logprob', 0), s.get('no_speech_prob', 0), s.get('compression_ratio', 1)) for w in s.get('words', [])]
        else:
            ss, _ = fw.transcribe(clip, language=lang, word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False,
                                  vad_filter=False)
            ws = [(w.word, w.start, w.end) for s in ss if trust(s.text, s.avg_logprob, s.no_speech_prob, s.compression_ratio) for w in (s.words or [])]
        return degenerate([{'w': w.strip(), 't0': round(a + t0, 3), 't1': round(a + min(t1, b - a), 3)} for w, t0, t1 in ws if w.strip() and t0 < b - a])
    segs = chunks(x, sr)
    print(f'transcribing {len(segs)} chunks with {backend}-whisper {model}…')
    words = [w for a, b in segs for w in run(a, b)]
    # Whisper also skips whole lines inside a chunk: where the voice sounds but no word lands, listen again on its own
    words.sort(key=lambda w: w['t0'])
    gaps = holes(x, sr, words, len(x) / sr)
    for a, b in gaps:   # re-listen with a few seconds either side: given only a short clip Whisper often hears nothing
        for c0, c1 in chunks(x, sr, 10.0, 5.0, a, b): words += [w for w in run(c0 - 5, c1 + 3) if max(a, c0) - .3 <= w['t0'] < min(b, c1)]
    if gaps: print(f'  re-listened to {len(gaps)} skipped stretches: ' + ', '.join(f'{a:.1f}–{b:.1f}' for a, b in gaps))
    words.sort(key=lambda w: w['t0'])
    json.dump({'key': key, 'model': model, 'backend': backend, 'words': words}, open(cache, 'w', encoding='utf-8'), ensure_ascii=False)
    return words


def heard_units(words, py):
    """Recognised words -> a sound-unit stream [(unit, t0, t1, char)], time split evenly across a word's characters"""
    out = []
    for w in words:
        toks = tokens(w['w'])
        if not toks: continue
        us = [(u, t) for t, _, _ in toks for u in units(t, py)]
        d = min((w['t1'] - w['t0']) / len(us), MAX_UNIT)   # Whisper's word ends often run into the silence after them
        for k, (u, t) in enumerate(us): out.append((u, w['t0'] + k * d, w['t0'] + (k + 1) * d, t))
    return out


def lang_of(texts):
    s = ''.join(texts)
    if len(CJK.findall(s)) > 0.3 * max(1, len(re.sub(r'\s', '', s))): return 'zh'
    if re.search('[぀-ヿ]', s): return 'ja'
    if re.search('[가-힯]', s): return 'ko'
    return 'en'


def do_align(a):
    lines, credits = parse_lyrics(a.lyrics)
    if not lines: die(f'no lyric lines in {a.lyrics}')
    lang = a.lang if a.lang != 'auto' else lang_of([l['text'] for l in lines])
    py = _pinyin() if lang == 'zh' else (lambda c: [c])
    os.makedirs(a.out, exist_ok=True)
    stem = vocals(a.song, a.out)
    ref_text = '，'.join(l['text'] for l in lines)
    prompt = ('歌词：' if lang == 'zh' else '') + ref_text[:120]   # the lyrics themselves prompt the wording and simplified/traditional script
    H = heard_units(whisper(stem, lang, a.model, prompt, a.out), py)

    # reference lyrics -> sound units, remembering the line and token of each
    R, owner = [], []
    toks = [tokens(l['text']) for l in lines]
    for li, tl in enumerate(toks):
        for ti, (t, _, _) in enumerate(tl):
            for u in units(t, py): R.append(u); owner.append((li, ti))
    hit = align_units(R, [h[0] for h in H])
    used = set(j for j in hit if j >= 0)

    # token time = time of its matched unit
    tt = [[None] * len(tl) for tl in toks]; got = [[0, 0] for _ in lines]
    for k, (li, ti) in enumerate(owner):
        got[li][1] += 1
        if hit[k] >= 0:
            got[li][0] += 1; h = H[hit[k]]; cur = tt[li][ti]
            tt[li][ti] = (h[1], h[2]) if cur is None else (min(cur[0], h[1]), max(cur[1], h[2]))
    durs = [b - a_ for row in tt for x in row if x for a_, b in [x]]
    cd = float(np.median(durs)) if durs else 0.25

    # outlier anchors within a line: one or two characters seconds away from the rest were usually grabbed by a homophone elsewhere (a chorus, a repeated word); drop and re-interpolate
    for li, row in enumerate(tt):
        idx = [i for i, x in enumerate(row) if x]
        if len(idx) < 3: continue
        gaps = [(row[idx[k + 1]][0] - row[idx[k]][1], k) for k in range(len(idx) - 1)]
        for g, k in gaps:
            if g > max(1.2, 6 * cd):
                left, right = idx[:k + 1], idx[k + 1:]
                for i in (left if len(left) < len(right) else right): row[i] = None; got[li][0] -= 1

    # interpolate within a line: unmatched characters share the time between matched ones; line ends extrapolate by the median character length
    for li, row in enumerate(tt):
        idx = [i for i, x in enumerate(row) if x]
        if not idx: continue
        for i in range(len(row)):
            if row[i]: continue
            lo = max([j for j in idx if j < i], default=None); hi = min([j for j in idx if j > i], default=None)
            if lo is not None and hi is not None:
                f0, f1 = (i - lo) / (hi - lo), (i - lo + 1) / (hi - lo)
                row[i] = (row[lo][1] + (row[hi][0] - row[lo][1]) * f0 * .999, row[lo][1] + (row[hi][0] - row[lo][1]) * min(1, f1))
            elif lo is not None: row[i] = (row[lo][1] + (i - lo - 1) * cd, row[lo][1] + (i - lo) * cd)
            else: row[i] = (row[hi][0] - (hi - i) * cd, row[hi][0] - (hi - i - 1) * cd)

    # lines with no match at all: with LRC times, fit a piecewise-linear map on matched lines; otherwise fit between neighbours
    anchors = [(l['lrc_t'], tt[i][0][0]) for i, l in enumerate(lines) if l['lrc_t'] is not None and tt[i] and tt[i][0] and got[i][0] / max(1, got[i][1]) >= .5]
    flags = []
    for li, l in enumerate(lines):
        m = got[li][0] / max(1, got[li][1])
        flags.append('' if m >= .5 else 'weak' if m > 0 else 'guess')
    for li, row in enumerate(tt):
        if flags[li] != 'guess' or not row: continue
        if lines[li]['lrc_t'] is not None and len(anchors) >= 2:
            xs, ys = zip(*sorted(anchors)); t0 = float(np.interp(lines[li]['lrc_t'], xs, ys))
            if lines[li]['lrc_t'] > xs[-1]: t0 = ys[-1] + (lines[li]['lrc_t'] - xs[-1])
            if lines[li]['lrc_t'] < xs[0]: t0 = ys[0] - (xs[0] - lines[li]['lrc_t'])
        else:
            prev = next((tt[k][-1][1] for k in range(li - 1, -1, -1) if tt[k] and tt[k][-1]), 0.0)
            t0 = prev + 0.15
        for i in range(len(row)): row[i] = (t0 + i * cd, t0 + (i + 1) * cd)

    # pinned lines start at the pin; matched characters keep their relative rhythm and shift together, else laid out by the median character length
    for li, l in enumerate(lines):
        if l.get('pin') is None or not tt[li]: continue
        row = tt[li]; nxt = next((lines[k]['pin'] for k in range(li + 1, len(lines)) if lines[k].get('pin') is not None), None)
        if flags[li] == '' and abs(row[0][0] - l['pin']) < .15: continue
        span = row[-1][1] - row[0][0]
        if flags[li] or span <= 0 or span > 4 * cd * len(row): span = cd * len(row)
        if nxt is not None: span = min(span, nxt - l['pin'] - .05)
        k_ = span / ((row[-1][1] - row[0][0]) or span)
        tt[li] = [(l['pin'] + (a0 - row[0][0]) * k_, l['pin'] + (a1 - row[0][0]) * k_) for a0, a1 in row] if not flags[li] else \
                 [(l['pin'] + i * span / len(row), l['pin'] + (i + 1) * span / len(row)) for i in range(len(row))]
        flags[li] = 'pinned'

    # neighbouring lines may not overlap: when a line runs into the next, squeeze it proportionally to end before the next starts, and flag both for a listen
    for li in range(len(tt) - 1):
        a_, b_ = tt[li], next((tt[k] for k in range(li + 1, len(tt)) if tt[k]), None)
        if not a_ or not b_ or a_[-1][1] <= b_[0][0] + .05: continue
        t0, end = a_[0][0], b_[0][0] - .05
        if end - t0 < .08 * len(a_) and lines[li].get('pin') is None: t0 = end - .08 * len(a_)   # even rap gives a character 0.08 s; a pinned line keeps its start
        span = a_[-1][1] - a_[0][0] or 1
        tt[li] = [(t0 + (x0 - a_[0][0]) / span * (end - t0), t0 + (x1 - a_[0][0]) / span * (end - t0)) for x0, x1 in a_]
        for k in (li, li + 1):
            if not flags[k] and lines[k].get('pin') is None: flags[k] = 'weak'

    out_lines = []
    for li, l in enumerate(lines):
        row = tt[li]
        if not row: continue
        t0, t1 = row[0][0], row[-1][1]
        heard = ''.join(h[3] if CJK.match(h[3]) or KANA_HANGUL.match(h[3]) else ' ' + h[3] for h in H if t0 - .05 <= (h[1] + h[2]) / 2 <= t1 + .05).strip()
        chars = [{'c': toks[li][i][0], 't0': round(row[i][0], 3), 't1': round(row[i][1], 3)} for i in range(len(row))]
        out_lines.append({'id': f'L{len(out_lines) + 1:02d}', 't0': round(t0, 3), 't1': round(t1, 3), 'text': l['text'], 'chars': chars,
                          'heard': heard, 'match': round(got[li][0] / max(1, got[li][1]), 2), 'flag': flags[li]})

    # sung but in no line
    extra, cur = [], None
    for j, h in enumerate(H):
        inside = any(L['t0'] - .05 <= (h[1] + h[2]) / 2 <= L['t1'] + .05 for L in out_lines)
        if j in used or inside:
            if cur: extra.append(cur); cur = None
            continue
        if cur and h[1] - cur['t1'] < .6: cur['t1'] = round(h[2], 3); cur['text'] += h[3]
        else:
            if cur: extra.append(cur)
            cur = {'t0': round(h[1], 3), 't1': round(h[2], 3), 'text': h[3]}
    if cur: extra.append(cur)

    res = {'song': os.path.abspath(a.song), 'lyrics': os.path.abspath(a.lyrics), 'lang': lang, 'model': a.model,
           'lines': out_lines, 'extra': extra, 'credits': credits}
    json.dump(res, open(os.path.join(a.out, 'lyrics.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for L in out_lines:
        mark = {'': ' ', 'weak': '?', 'guess': '!', 'pinned': '@'}[L['flag']]
        print(f"{mark} {L['id']} {L['t0']:7.2f}–{L['t1']:7.2f}  {L['match']:.2f}  {L['text']}" + (f"   ‹heard: {L['heard']}›" if L['flag'] in ('weak', 'guess') else ''))
    for e in extra: print(f"+ extra {e['t0']:7.2f}–{e['t1']:7.2f}  {e['text']}")
    n = sum(1 for L in out_lines if L['flag'] in ('weak', 'guess')); print(f"{len(out_lines)} lines, {n} to check (? weak, ! guess; @ pinned), {len(extra)} extra → {os.path.join(a.out, 'lyrics.json')}")


def do_listen(a):
    """Listen to a stretch: transcribe with 5 s of context each side, print only the words and times inside [t0, t1] (the agent's ears)"""
    import soundfile as sf
    stem = os.path.join(a.out, 'stems', 'vocals.wav'); src = stem if os.path.exists(stem) else a.song
    x, sr = sf.read(src, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    import soxr; x = soxr.resample(x, sr, 16000); sr = 16000
    c0, c1 = max(0.0, a.t0 - 5), min(len(x) / sr, a.t1 + 5); clip = x[int(c0 * sr):int(c1 * sr)]
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(clip, path_or_hf_repo=a.model if '/' in a.model else f'mlx-community/whisper-{a.model}', language=a.lang,
                                   word_timestamps=True, condition_on_previous_text=False, verbose=None)
        segs = [(s['text'], [(w['word'], w['start'], w['end']) for w in s.get('words', [])]) for s in r['segments']]
    except ImportError:
        from faster_whisper import WhisperModel
        ss, _ = WhisperModel(a.model, compute_type='int8').transcribe(clip, language=a.lang, word_timestamps=True, condition_on_previous_text=False)
        segs = [(s.text, [(w.word, w.start, w.end) for w in (s.words or [])]) for s in ss]
    for text, ws in segs:
        ws = [(w, c0 + t0, c0 + t1) for w, t0, t1 in ws if a.t0 - .3 <= c0 + t0 <= a.t1]
        if ws: print(f"{ws[0][1]:7.2f}–{ws[-1][2]:7.2f}  " + ' '.join(f'{w.strip()}@{t0:.2f}' for w, t0, _ in ws))


def do_transcribe(a):
    os.makedirs(a.out, exist_ok=True)
    words = whisper(vocals(a.song, a.out), a.lang, a.model, None, a.out)
    rows, cur, last = [], '', -1
    for w in words:
        if cur and w['t0'] - last > .45: rows.append(cur); cur = ''
        cur += w['w'] if a.lang in ('zh', 'ja', 'ko') else ' ' + w['w']; last = w['t1']
    if cur: rows.append(cur)
    p = os.path.join(a.out, 'draft.txt'); open(p, 'w', encoding='utf-8').write('\n'.join(r.strip() for r in rows) + '\n')
    print(f'{p}: {len(rows)} lines (a draft: correct it by ear, then run align)')


def do_ocr(a):
    """Burned-in lyrics: OCR frames at fps; drop text that stays (watermarks, channel logos) and mostly-digit text (plates, prices); merge consecutive frames of one line"""
    try: from rapidocr_onnxruntime import RapidOCR
    except ImportError: die('rapidocr is missing: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps mv', 2)
    os.makedirs(a.out, exist_ok=True)
    pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', a.video], capture_output=True, text=True)
    if pr.returncode or not pr.stdout.strip(): die(f'no video stream in {a.video}', 2)
    w, h = map(int, pr.stdout.strip().split(',')[:2]); scale = min(1.0, 960 / max(w, h)); w2, h2 = int(w * scale) // 2 * 2, int(h * scale) // 2 * 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'fps={a.fps},scale={w2}:{h2}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, h2, w2, 3); eng = RapidOCR(); seen = []
    print(f'reading {len(frames)} frames…')
    for f in frames:
        res, _ = eng(f)
        seen.append([(unicodedata.normalize('NFKC', r[1]).strip(), float(r[2])) for r in (res or []) if r[2] >= a.conf and r[1].strip()])
    like = lambda x, y: x in y or y in x or difflib.SequenceMatcher(None, x, y).ratio() > .75
    texts = {b[0] for boxes in seen for b in boxes}
    # text that stays: watermarks, logos. OCR reads a different fragment each frame, so count the frames where something like it appears
    static = {t for t in texts if sum(any(like(t, b[0]) for b in boxes) for boxes in seen) > .4 * len(frames)}
    def keep(t):
        letters = sum(1 for c in t if CJK.search(c) or KANA_HANGUL.search(c) or c.isalpha())
        if letters < max(1, .6 * (letters + sum(c.isdigit() for c in t))): return False   # mostly digits (plates, prices): drop
        for x in static:   # a watermark fragment, or part of one stuck to other text
            m = difflib.SequenceMatcher(None, t, x).find_longest_match(0, len(t), 0, len(x)).size
            if like(t, x) or (m >= 3 and m > .6 * len(t)): return False
        return True
    runs = []   # consecutive frames read exactly alike become one run
    for k, boxes in enumerate(seen):
        text = ' '.join(b[0] for b in boxes if keep(b[0]))
        if runs and runs[-1]['text'] == text and runs[-1]['k1'] == k - 1: runs[-1]['k1'] = k
        else: runs.append({'k0': k, 'k1': k, 'text': text})
    # a run of one or two frames that resembles a neighbour is an OCR misread: merge it; runs of similar length stay separate (they can be different lines)
    for _ in range(len(runs)):
        for i, r in enumerate(runs):
            if r['k1'] - r['k0'] > 1 or not r['text']: continue
            nb = [j for j in (i - 1, i + 1) if 0 <= j < len(runs) and runs[j]['text'] and like(r['text'], runs[j]['text'])]
            if nb:
                j = max(nb, key=lambda j: runs[j]['k1'] - runs[j]['k0'])
                runs[j]['k0'], runs[j]['k1'] = min(runs[j]['k0'], r['k0']), max(runs[j]['k1'], r['k1']); del runs[i]; break
        else: break
        for i in range(len(runs) - 1, 0, -1):   # after merging, join neighbouring runs of the same line
            if runs[i]['text'] == runs[i - 1]['text'] and runs[i]['k0'] == runs[i - 1]['k1'] + 1: runs[i - 1]['k1'] = runs[i]['k1']; del runs[i]
    out = [{'t0': round(r['k0'] / a.fps, 2), 't1': round((r['k1'] + 1) / a.fps, 2), 'text': r['text']} for r in runs if r['text']]
    json.dump({'video': os.path.abspath(a.video), 'fps': a.fps, 'dropped': sorted(static), 'lines': out}, open(os.path.join(a.out, 'ocr.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    lrc = ''.join(f"[{int(r['t0'] // 60):02d}:{r['t0'] % 60:05.2f}]{r['text']}\n" for r in out)
    open(os.path.join(a.out, 'ocr.lrc'), 'w', encoding='utf-8').write(lrc)
    for r in out: print(f"{r['t0']:7.2f}–{r['t1']:7.2f}  {r['text']}")
    print(f"{len(out)} lines → {os.path.join(a.out, 'ocr.lrc')}" + (f"; dropped {len(static)} static readings (watermarks), e.g. {', '.join(sorted(static, key=len)[:5])}" if static else ''))


# -- search --
def s_netease(q, dur):
    d = get_json('https://music.163.com/api/search/get?' + urllib.parse.urlencode({'s': q, 'type': 1, 'limit': 12}), {'Referer': 'https://music.163.com'})
    for s in ((d or {}).get('result') or {}).get('songs') or []:
        l = get_json(f"https://music.163.com/api/song/lyric?id={s['id']}&lv=1&tv=1", {'Referer': 'https://music.163.com'}) or {}
        lrc = (l.get('lrc') or {}).get('lyric') or ''
        if not lrc.strip(): continue
        yield {'src': 'netease', 'id': str(s['id']), 'title': s['name'], 'artist': ','.join(x['name'] for x in s['artists']),
               'album': s['album']['name'], 'duration': s['duration'] / 1000, 'lrc': lrc, 'trans': (l.get('tlyric') or {}).get('lyric') or ''}


def s_lrclib(q, dur):
    for s in get_json('https://lrclib.net/api/search?' + urllib.parse.urlencode({'q': q})) or []:
        lrc = s.get('syncedLyrics') or s.get('plainLyrics') or ''
        if lrc.strip(): yield {'src': 'lrclib', 'id': str(s['id']), 'title': s['trackName'], 'artist': s['artistName'],
                               'album': s.get('albumName'), 'duration': s.get('duration'), 'lrc': lrc, 'trans': ''}


def s_kugou(q, dur):
    d = get_json('http://mobilecdn.kugou.com/api/v3/search/song?' + urllib.parse.urlencode({'format': 'json', 'keyword': q, 'page': 1, 'pagesize': 10}))
    for s in ((d or {}).get('data') or {}).get('info') or []:
        c = get_json(f"https://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=&duration={s['duration'] * 1000}&hash={s['hash']}")
        for cand in ((c or {}).get('candidates') or [])[:1]:
            l = get_json(f"https://lyrics.kugou.com/download?ver=1&client=pc&id={cand['id']}&accesskey={cand['accesskey']}&fmt=lrc&charset=utf8")
            try: lrc = base64.b64decode((l or {}).get('content') or '').decode('utf-8', 'replace')
            except Exception: lrc = ''
            if lrc.strip(): yield {'src': 'kugou', 'id': str(cand['id']), 'title': s['songname'], 'artist': s['singername'],
                                   'album': s.get('album_name'), 'duration': s['duration'], 'lrc': lrc, 'trans': '',
                                   'note': cand.get('product_from', '') + (' · ' + cand['nickname'] if cand.get('nickname') else '')}


def do_search(a):
    refs = []
    os.makedirs(os.path.join(a.out, 'refs'), exist_ok=True)
    for q in dict.fromkeys([f'{a.title} {a.artist}' if a.artist else a.title, a.title]):   # search with the artist, then by title alone (covers and live versions are often filed under someone else)
        for fn in (s_netease, s_lrclib, s_kugou):
            try:
                for r in fn(q, a.dur):
                    if difflib.SequenceMatcher(None, a.title.lower(), (r['title'] or '').lower()).ratio() >= .5 or a.title.lower() in (r['title'] or '').lower(): refs.append(r)
            except Exception as e: print(f'  ! {fn.__name__[2:]}: {e}', file=sys.stderr)
    seen, keep = set(), []
    for r in refs:
        body = re.sub(r'\[[^\]]*\]|\s', '', r['lrc'])
        if body in seen: continue
        seen.add(body); p = os.path.join(a.out, 'refs', f"{r['src']}-{r['id']}.lrc"); open(p, 'w', encoding='utf-8').write(r['lrc'])
        if r['trans'].strip(): open(p[:-4] + '.trans.lrc', 'w', encoding='utf-8').write(r['trans'])
        lines, _ = parse_lyrics(p)
        artist_ok = bool(a.artist) and difflib.SequenceMatcher(None, a.artist.lower(), (r['artist'] or '').lower()).ratio() >= .5   # a simplified/traditional difference still counts as a match
        score = difflib.SequenceMatcher(None, a.title.lower(), (r['title'] or '').lower()).ratio() + (0.5 if artist_ok else 0)
        if a.dur and r['duration']: score -= min(1, abs(a.dur - r['duration']) / 60)
        keep.append({'src': r['src'], 'id': r['id'], 'title': r['title'], 'artist': r['artist'], 'album': r.get('album'), 'duration': r['duration'],
                     'lines': len(lines), 'timed': any(l['lrc_t'] is not None for l in lines), 'translation': bool(r['trans'].strip()),
                     'note': r.get('note', ''), 'file': p, 'score': round(score, 2)})
    keep.sort(key=lambda r: -r['score'])
    json.dump(keep, open(os.path.join(a.out, 'refs.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for r in keep: print(f"{r['score']:5.2f}  {r['src']:8s} {r['title']} / {r['artist']}  {r['duration'] or 0:.0f}s  {r['lines']} lines{' timed' if r['timed'] else ''}{' +trans' if r['translation'] else ''}  {r['note']}")
    print(f"{len(keep)} references → {os.path.join(a.out, 'refs.json')}" if keep else 'nothing found: try another title spelling, or transcribe')
    sys.exit(0 if keep else 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search'); s.add_argument('title'); s.add_argument('--artist'); s.add_argument('--dur', type=float); s.add_argument('--out', required=True)
    model = os.environ.get('WHISPER_MODEL', 'large-v3-turbo')
    for name in ('align', 'transcribe'):
        p = sub.add_parser(name); p.add_argument('song')
        if name == 'align': p.add_argument('lyrics')
        p.add_argument('--out', required=True); p.add_argument('--lang', default='auto' if name == 'align' else 'zh'); p.add_argument('--model', default=model)
    p = sub.add_parser('listen'); p.add_argument('song'); p.add_argument('t0', type=float); p.add_argument('t1', type=float)
    p.add_argument('--out', required=True); p.add_argument('--lang', default='zh'); p.add_argument('--model', default=model)
    p = sub.add_parser('ocr'); p.add_argument('video'); p.add_argument('--out', required=True)
    p.add_argument('--fps', type=float, default=5); p.add_argument('--conf', type=float, default=.6)
    a = ap.parse_args()
    {'search': do_search, 'align': do_align, 'transcribe': do_transcribe, 'listen': do_listen, 'ocr': do_ocr}[a.cmd](a)


if __name__ == '__main__': main()
