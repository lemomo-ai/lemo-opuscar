"""Whisper line-by-line check: python core/tts/asr_check.py lines.json voices_dir [--lang en|zh|ja|ko|auto] [--model base|small|…] [--threshold 0.92]
Compares each line's text with its transcription (0.6 s of silence is padded on both sides first; short lines are misheard without it) and
writes per-word timestamps to voices_dir/words.json (for lip sync and line breaks).
A line in lines.json may carry an "asr" field that overrides the expected text (proper names, onomatopoeia, a word Whisper always hears as another).
--lang  auto (default) decides by the script: CJK characters mean zh, with kana ja and with hangul ko; otherwise en. en requires an exact word-by-word match after dropping punctuation
        and case (whole numbers 0–999 are turned into words on both sides, so "forty" and "40" match; larger numbers, years, ordinals like 3rd and
        numbers with punctuation (3.5, 1:30, 1,000, 40%) are not, so write the expected transcription in the "asr" field). zh (also ja / ko) compares
        by character, each number counting as one character with its value: 十九 and 19, 两千零二十六 and 2026, 一万九千 and 1.9万, 三点五 and 3.5,
        百分之三十 and 30%, 二〇二六 and 2026 are the same. After dropping punctuation and folding full-width to half-width, a difflib similarity
        ≥ --threshold (default 0.92) passes, except that a number heard as a different number fails the line (三只 heard as 五只, 一百 as 1000);
        a number left out fails too (一, often a plain word, excepted); a number heard as a word that isn't one (千里 as 尖里) only lowers the
        similarity. 三点五十分 matches 3点50分 and 3:50, not 3点5分. Whisper often drops punctuation, so in its text 点 and a comma between digits
        are also read as a word and a pause (三点，两个人 / 三点两个人; 一百，两百 / 100,200).
Model: --model (or the WHISPER_MODEL environment variable; a model name, or a local folder for offline use); default en → base.en, zh → small (base mishears too many Chinese lines), other languages → base (multilingual).
      If the default mishears a line that sounds right to you, check again with a larger model (base → small, about 480 MB; small → medium), more accurate and several times slower.
      The first run downloads from Hugging Face (base / base.en ≈ 145 MB, small ≈ 480 MB); behind a firewall set HF_ENDPOINT=https://hf-mirror.com,
      or download the model beforehand and pass --model /path/to/model-dir.
Exit codes: 0 all lines pass; 1 some lines differ; 2 the check could not run (model failed to load, etc.).
"""
import sys, json, re, os, argparse, difflib, unicodedata

CJK = re.compile('[㐀-鿿豈-﫿぀-ヿ가-힯]')
CHAR_LANGS = {'zh', 'ja', 'ko'}           # these languages are compared by character, the rest by word
_ZH_DIGIT = dict(zip('零〇一二三四五六七八九两兩', '0012345678922'))   # 萬 億 兩: Whisper sometimes writes traditional characters
_ZH_UNIT = {'十': 10, '百': 100, '千': 1000, '万': 10 ** 4, '萬': 10 ** 4, '亿': 10 ** 8, '億': 10 ** 8}
_ZH_D = r'\d零〇一二三四五六七八九两兩'
_ZH_SEP = r'\d{1,3}(?:,\d{3})+(?!\d)|'   # 1,000 as one number
_ZH_NUM = {dec: re.compile(rf'(?P<pct>百分之)?(?P<int>(?:{sep}[{_ZH_D}十百千])(?:{sep}[{_ZH_D}十百千万亿萬億])*)'   # 万 亿 on their own (过万, 万一) aren't numbers
                           rf'(?:{pt}(?P<frac>[{_ZH_D}十]+)(?P<mul>[万亿萬億]*))?(?:\s*(?P<pc>%))?')   # 三点五, 一点九万, 三点五十 / 3:50
           for dec, pt, sep in ((True, r'(?:[.点]|(?<=\d):)', _ZH_SEP), (False, r'\.', ''))}   # or 点 a word, a comma or colon a pause (三点两个人, 100,200, 3:2)


_ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
_TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()


def num_words(n):
    """0–999 → list of words for the English reading: 40 → ['forty'], 105 → ['one', 'hundred', 'five']"""
    out = []
    if n >= 100: out += [_ONES[n // 100], 'hundred']; n %= 100
    if n >= 20: out.append(_TENS[n // 10]); n %= 10
    if n or not out: out.append(_ONES[n])   # whole hundreds (100, 200…) don't get a trailing zero; 0 itself is read as zero
    return out


_SENTENCE_PUNCT = '.,;:!?"()[]{}\u2026\u201c\u201d\u2018\u2019'   # punctuation at either end of a word (full stops, commas, brackets…); the percent sign isn't included


def _is_formatted_number(raw):
    """Numbers written with punctuation between digits: decimals 3.5, times 1:30, dates 12/25, thousands separators 1,000, and percentages such as 40%.
    With the punctuation removed they would look like a different number (3.5 → 35), so they can't be converted to a reading."""
    core = raw.strip(_SENTENCE_PUNCT)
    return bool(re.search(r'\d[.,:/]\d', core) or ('%' in core and re.search(r'\d', core)))


def norm_en(s):
    """Word list for English comparison: lowercase, punctuation removed; integers 0–999 (whisper often writes forty as 40) replaced by their reading; the "and" in "hundred and" isn't counted.
    Kept as is (punctuation removed only, not converted to a reading): larger numbers, years, ordinals (3rd), and numbers with punctuation (decimals 3.5, times 1:30, thousands separators 1,000, percentages 40%) —
    otherwise 3.5 would become 35 and be confused with "thirty five". For their reading, write the expected transcription in the asr field of lines.json."""
    out = []
    for raw in s.lower().replace("'", '').replace('-', ' ').split():
        w = re.sub(r"[^a-z0-9]", '', raw)
        if not w: continue
        if re.fullmatch(r'0|[1-9]\d{0,2}', w) and not _is_formatted_number(raw): out += num_words(int(w))
        elif w == 'and' and out and out[-1] == 'hundred': pass
        else: out.append(w)
    return out


def zh_int(run):
    """A whole number in digits and numerals → int: 十九 → 19, 两千零二十六 → 2026, 一万五 → 15000, 三亿五 → 350000000, 3万 → 30000, 1,000 → 1000.
    Without 十百千万亿 the digits are read one by one and returned as a string: 二〇二六 → '2026'."""
    run = run.replace(',', '')
    if not any(c in _ZH_UNIT for c in run): return ''.join(_ZH_DIGIT.get(c, c) for c in run)
    toks = re.findall(r'\d+|.', run); total = section = 0; num = None
    for t in toks:
        u = _ZH_UNIT.get(t)
        if u == 10 ** 8: total, section, num = (total + section + (num or 0)) * u, 0, None
        elif u == 10 ** 4: total, section, num = total + (section + (num or 0)) * u, 0, None
        elif u: section, num = section + (1 if num is None else num) * u, None   # 十九: a 十 with nothing before it is one ten
        elif t not in '零〇': num = int(t) if t.isdigit() else int(_ZH_DIGIT[t])
    if num is not None and len(toks) > 1 and _ZH_UNIT.get(toks[-2], 10) > 10: num *= _ZH_UNIT[toks[-2]] // 10   # 三百五 = 350, 一万五 = 15000 (一百零五 keeps its 5)
    return total + section + (num or 0)


def zh_tokens(s, point_is_decimal=True, digit_by_digit=False):
    """Chinese text → list of characters and numbers, a number as ('n', value, its characters, a lone 一). The value keeps what was said: '19000'
    for 一万九千 and 1.9万 alike, '3.5', '30%', '2026'; after the point every digit counts, so 三点五十 (3:50) is '3.50' and 三点五 is '3.5'.
    NFKC folds full-width to half-width; punctuation and whitespace go, but still keep the numbers on either side apart. Bare numerals with 两
    are single digits (两三个 / 2、3个), and with digit_by_digit=True any bare numerals are (三二一 / 3、2、1; 三五天 / 3、5天).
    With point_is_decimal=False (for Whisper's text, which often drops punctuation), 点 stays a character, a comma or colon always separates
    (三点两个人, 100,200, 3:2) and digits split by spaces join (138 0013 8000)."""
    from decimal import Decimal
    s = unicodedata.normalize('NFKC', s.replace('，', '、')).lower()   # a full-width comma isn't a thousands separator: 一百，两百 / 100，200
    s = re.sub(r'(?<=\d)\s+(?=[万亿萬億%])' if point_is_decimal else r'(?<=\d)\s+(?=[\d万亿萬億%])', '', s)   # 8160 亿, 30 %
    out, pos = [], 0
    keep = lambda t: [c for c in t if unicodedata.category(c)[0] in 'LN']
    digits = lambda t: ''.join(_ZH_DIGIT.get(c, c) for c in t)
    for m in _ZH_NUM[point_is_decimal].finditer(s):
        out += keep(s[pos:m.start()]); pos = m.end(); run, frac = m['int'], m['frac']; pct = '%' if m['pct'] or m['pc'] else ''
        if len(run) > 1 and not (frac or pct or re.search(r'[\d十百千万亿萬億]', run)) and (digit_by_digit or re.search('[两兩]', run)):
            out += [('n', _ZH_DIGIT[c], c, False) for c in run]; continue
        fd = frac and (str(zh_int(frac)) if '十' in frac else digits(frac))
        if m['mul']:
            v = Decimal(zh_int(run)) + (Decimal('0.' + fd) if fd else 0)
            for c in m['mul']: v *= _ZH_UNIT[c]
            val = format(v.normalize(), 'f')
        else: val = (str(zh_int(run)).lstrip('0') or '0') + ('.' + fd if fd else '')
        out.append(('n', val + pct, ''.join(keep(m[0])), m[0] == '一'))
    return out + keep(s[pos:])


def zh_check(a, b, threshold):
    """Two token lists → (passed or not, why). Aligned with each number as one character: wherever the alignment replaces a stretch that has
    numbers on both sides, those numbers must be equal, and a number left out or added fails too (一, often a plain word, excepted).
    Then the similarity, on characters: a number found on both sides counts as the script's characters on both, any other number as the
    characters it was written with (千万 heard as 钱万 is one character off, as before)."""
    keys = {}
    enc = lambda t: ''.join(c if isinstance(c, str) else keys.setdefault(c[1], chr(0xE000 + len(keys))) for c in t)
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, enc(a), enc(b)).get_opcodes():
        na, nb = [c for c in a[i1:i2] if not isinstance(c, str)], [c for c in b[j1:j2] if not isinstance(c, str)]
        if (op == 'replace' and na and nb and [c[1] for c in na] != [c[1] for c in nb]) or (op in ('delete', 'insert') and not all(c[3] for c in na + nb)):
            na, nb = [c[1] for c in na], [c[1] for c in nb]
            return False, f"numbers {' '.join(na) or '-'} ≠ {' '.join(nb) or '-'}"
    both = {c[1] for c in a if not isinstance(c, str)} & {c[1] for c in b if not isinstance(c, str)}
    src = {c[1]: c[2] for c in a if not isinstance(c, str)}
    flat = lambda t: ''.join(c if isinstance(c, str) else src[c[1]] if c[1] in both else c[2] for c in t)
    x, y = flat(a), flat(b); r = difflib.SequenceMatcher(None, x, y).ratio() if (x or y) else 1.0
    return r >= threshold, '' if r >= threshold else f'similarity {r:.2f} < {threshold}'


def detect_lang(texts):
    """auto: CJK script decides, then kana means Japanese and hangul Korean (Whisper is told the language, so Japanese must not be sent as zh)"""
    cjk = sum(len(CJK.findall(t)) for t in texts); latin = sum(len(re.findall('[A-Za-z]', t)) for t in texts)
    if not (cjk and cjk >= 0.3 * (cjk + latin)): return 'en'
    s = ''.join(texts)
    return 'ja' if re.search('[぀-ヿ]', s) else 'ko' if re.search('[가-힯]', s) else 'zh'


def compare(want, got, lang, threshold=0.92):
    """Returns (passed or not, why it failed: '' when it passed or the language is compared word by word)"""
    if lang in CHAR_LANGS:
        # the script's punctuation says what 点 is (三点五 / 三点，五个人); Whisper often drops it, so its text is read both ways.
        # Bare numerals on the script's side are tried whole and digit by digit (二〇二六 / 2026; 三二一 / 3、2、1)
        tries = [zh_check(zh_tokens(want, True, dd), zh_tokens(got, dec, not dec), threshold) for dd in (False, True) for dec in (True, False)]
        return next((t for t in tries if t[0]), tries[0])
    a, b = norm_en(want), norm_en(got)
    return a == b, ''


def load_model(name):
    try: from faster_whisper import WhisperModel
    except ImportError: sys.exit('asr_check.py: faster-whisper is missing: install the voice tier: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice')
    try:
        return WhisperModel(name, device='cpu', compute_type='int8')
    except Exception as e:
        msg = f'{type(e).__name__}: {e}'
        print(f"asr_check.py: cannot load the whisper model '{name}'.\n  {msg[:300]}", file=sys.stderr)
        if not os.path.isdir(name):
            print("  The model is downloaded from huggingface.co on first use. If that site is blocked or you are offline:\n"
                  "    set HF_ENDPOINT=https://hf-mirror.com (a mirror), or download the model once and pass --model /path/to/model-dir", file=sys.stderr)
        sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines'); ap.add_argument('voices_dir')
    ap.add_argument('--lang', default='auto'); ap.add_argument('--model'); ap.add_argument('--threshold', type=float, default=0.92)
    a = ap.parse_args()
    lines = json.load(open(a.lines, encoding='utf-8'))
    want = {L['id']: L.get('asr', L['text']) for L in lines}
    lang = detect_lang(list(want.values())) if a.lang == 'auto' else a.lang
    name = a.model or os.environ.get('WHISPER_MODEL') or {'en': 'base.en', 'zh': 'small'}.get(lang, 'base')
    if lang != 'en' and os.path.basename(name.rstrip('/')).endswith('.en'):
        print(f"asr_check.py: model '{name}' is English-only but the lines are '{lang}'. Use a multilingual model (e.g. --model base or --model small).", file=sys.stderr); sys.exit(2)
    import numpy as np, soundfile as sf, soxr
    m = load_model(name)
    bad, words = 0, {}
    for L in lines:
        y, sr = sf.read(os.path.join(a.voices_dir, f"{L['id']}.wav"))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, 16000, quality='HQ'); pad = np.zeros(int(.6 * 16000))   # same as librosa's default soxr_hq
        kw = dict(initial_prompt='以下是普通话的句子。') if lang == 'zh' else {}          # prompt in Simplified Chinese so the transcription doesn't come out in Traditional
        segs, _ = m.transcribe(np.concatenate([pad, y, pad]).astype(np.float32), beam_size=5, language=lang, word_timestamps=True, **kw)
        tail = (len(y) + len(pad)) / 16000 - .5   # Whisper sometimes repeats the line inside the trailing pad: drop such no-speech segments
        segs = [s for s in segs if not (s.no_speech_prob > .5 and s.start > tail)]; got = ' '.join(s.text.strip() for s in segs)
        words[L['id']] = [(w.word.strip(), round(w.start - .6, 3), round(w.end - .6, 3)) for s in segs for w in s.words]
        ok, why = compare(want[L['id']], got, lang, a.threshold); bad += not ok
        print(('OK  ' if ok else 'DIFF'), L['id'], '|', want[L['id']], '→', got, f'   ({why})' if why else '')
    json.dump(words, open(os.path.join(a.voices_dir, 'words.json'), 'w', encoding='utf-8'), indent=0, ensure_ascii=False)
    print('mismatches:', bad, f'(lang={lang}, model={name})')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
