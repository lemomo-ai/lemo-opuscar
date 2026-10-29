#!/usr/bin/env python3
"""Repository-owned deterministic editorial gate; no upstream code imported."""
import argparse
import hashlib
import re
from pathlib import Path


def extract_narration(markdown):
    lines = markdown.splitlines()
    start = next((i for i, line in enumerate(lines) if re.fullmatch(r'##\s+口播\s*', line)), None)
    if start is None:
        raise ValueError('Missing exact level-two heading: ## 口播')
    end = next((i for i in range(start + 1, len(lines)) if re.match(r'^#{1,2}\s+', lines[i])), len(lines))
    body = '\n'.join(lines[start + 1:end]).strip()
    # Refuse mixed production directions rather than silently counting them as speech.
    if not body or re.search(r'^\s*(?:#{1,6}\s|```|\|)', body, re.M):
        raise ValueError('口播 section must contain nonempty plain speech, without subheadings/code/tables')
    return body


def measure(body):
    chars = len(re.findall(r'[\u4e00-\u9fffA-Za-z0-9]', body))
    sentences = [s.strip() for s in re.split(r'[。！？!?]+', body) if s.strip()]
    lengths = [len(re.findall(r'[\u4e00-\u9fffA-Za-z0-9]', s)) for s in sentences]
    patterns = {
        'stock_phrases': (r'值得注意的是|不难发现|综上所述|总而言之|毋庸置疑|在当今|赋能|闭环|底层逻辑', 0),
        'contrast_templates': (r'不是[^。！？\n]{1,50}[，,]而是|不只是[^。！？\n]{1,50}[，,]更是', 1),
        'long_sentences_over_45': (None, 0),
    }
    rows = []
    for name, (pattern, limit) in patterns.items():
        hits = re.findall(pattern, body) if pattern else [s for s, n in zip(sentences, lengths) if n > 45]
        rows.append((name, len(hits), limit, hits))
    return chars, len(sentences), rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('script', type=Path)
    parser.add_argument('--output', type=Path, help='default: SCRIPT_vN.md sibling notes/script-vN-detect.md')
    args = parser.parse_args()
    raw = args.script.read_bytes()
    try:
        body = extract_narration(raw.decode('utf-8'))
    except ValueError as exc:
        parser.exit(2, f'Extraction error: {exc}\n')
    chars, count, rows = measure(body)
    failed = any(value > limit for _, value, limit, _ in rows)
    version = re.fullmatch(r'SCRIPT_v(\d+)\.md', args.script.name, re.I)
    if args.output is None and not version:
        parser.error('Use SCRIPT_vN.md or specify --output')
    output = args.output or args.script.parent / 'notes' / f'script-v{version[1]}-detect.md'
    report = ['# Narration detect', '', f'Result: **{"FAIL" if failed else "PASS"}**', '',
              f'Source: `{args.script.resolve()}`', f'SHA256: `{hashlib.sha256(raw).hexdigest()}`',
              '', 'Extraction: exact `## 口播` heading through the next level 1/2 heading. Title, status, sources and notes are excluded.',
              f'Count: {chars} letters/digits/Han characters; {count} sentences.', '',
              'Thresholds below are repository editorial policy, not calibrated AI-authorship probabilities. Any value above its maximum fails.', '',
              '| Metric | Observed | Maximum | Result |', '|---|---:|---:|---|']
    for name, value, limit, hits in rows:
        report.append(f'| {name} | {value} | {limit} | {"FAIL" if value > limit else "PASS"} |')
    report += ['', '## Located candidates', '']
    for name, _, _, hits in rows:
        report += [f'- {name}: {hit}' for hit in hits]
    report += ['', 'Only mechanical metrics ran. Semantic quality, factual accuracy and metaphor fit need separate review; PASS does not certify human authorship.', '']
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text('\n'.join(report), encoding='utf-8')
    print(f'{"FAIL" if failed else "PASS"}: {output}')
    return int(failed)


if __name__ == '__main__':
    raise SystemExit(main())
