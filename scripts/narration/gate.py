#!/usr/bin/env python3
"""Narration-only adapter for the noncommercial upstream detector."""
import argparse
import hashlib
import json
import re
import importlib.util
import subprocess
import sys
import tempfile
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--short', action='store_true', help='Explicit short mode (already the narration default)')
    parser.add_argument('script', type=Path)
    parser.add_argument('--output', type=Path, help='default: SCRIPT_vN.md sibling notes/script-vN-detect.md')
    args = parser.parse_args()
    raw = args.script.read_bytes()
    try:
        body = extract_narration(raw.decode('utf-8'))
    except ValueError as exc:
        parser.exit(2, f'Extraction error: {exc}\n')
    upstream_path = Path(__file__).resolve().parents[2] / 'vendor/lieflat-less-ai-tone/scripts/detect.py'
    spec = importlib.util.spec_from_file_location('lieflat_detect', upstream_path)
    upstream = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(upstream)
    with tempfile.TemporaryDirectory(prefix='narration-detect-') as tmp:
        speech = Path(tmp) / 'narration.txt'
        speech.write_text(body, encoding='utf-8')
        run = subprocess.run([sys.executable, str(upstream_path), str(speech), '--json', '--short'], capture_output=True, text=True)
    if run.returncode != 0:
        parser.exit(2, f'Upstream error: {run.stderr}\n')
    metrics = json.loads(run.stdout)
    st = metrics['structure']
    rows = [
        ('句长CV', st['句长CV'], '>=', upstream.TH_SENT_CV),
        ('节长CV', st['节长CV'], '>=', upstream.TH_SECT_CV),
        ('小标题/千字', st['小标题/千字'], '<=', upstream.TH_HEAD_KK),
        ('两句同构/百段', st['两句同构/百段'], '<=', upstream.TH_ISO_100P),
        ('三句同构/百段', st['三句同构/百段'], '<=', 0.8),
        ('破折号/千字', metrics['char_density']['破折号'], '<=', 2),
    ]
    def exceeds(value, direction, limit):
        return value is not None and (value < limit if direction == '>=' else value > limit)
    failed = run.returncode != 0 or any(exceeds(v, d, lim) for _, v, d, lim in rows)
    version = re.fullmatch(r'SCRIPT_v(\d+(?:\.\d+)?)\.md', args.script.name, re.I)
    if args.output is None and not version:
        parser.error('Use SCRIPT_vN.md or specify --output')
    output = args.output or args.script.parent / 'notes' / f'script-v{version[1]}-detect.md'
    report = ['# Narration detect — original lieflat detector', '',
              f'短稿模式，汉字数 {upstream.hanzi(body)}，短文本指标波动大，仅供参考。', '', f'Result: **{"FAIL" if failed else "PASS"}**',
              f'Original CLI exit: {run.returncode}; wrapper exit: {int(failed)}',
              f'Source: `{args.script.resolve()}`', f'SHA256: `{hashlib.sha256(raw).hexdigest()}`',
              '', '仅提取 ## 口播 到下一个一级/二级标题；原稿未修改。',
              'Upstream: fe13f1a0712cd2c138b6cdc500a77927d5bf04ec; CC BY-NC 4.0，仅限非商用。',
              '', '## Validity', run.stderr.strip() or 'Original CLI accepted input.',
              '短稿开关仅跳过最低汉字数拦截，其余度量与阈值保持不变。',
              '', '## Thresholds',
              '原版没有总 PASS/FAIL；本地适配器将原版 fmt_report 的结构告警及破折号建议转为失败。',
              '出处：vendor/lieflat-less-ai-tone/scripts/detect.py 的 TH_*、fmt_report（三句同构>0.8）、CHAR_HITS（破折号>2/千字）。',
              'A/B/H/F 其他候选没有自动拒绝阈值，原版要求复核；X 已否决特征不设失败阈值。null 表示样本不足，不判该项。',
              '| Metric | Value | Required |', '|---|---:|---|']
    report += [f'| {name} | {value} | {direction} {limit} |' for name, value, direction, limit in rows]
    report += ['', '## Original metrics (all values)', '```json',
               json.dumps(metrics, ensure_ascii=False, indent=2), '```', '', '## Located original lines']
    for name, hits in metrics['hits'].items():
        for hit in hits:
            line = body.splitlines()[hit['line'] - 1]
            report.append(f'- {name} (口播行 {hit["line"]}): {line}')
    for hit in metrics['syn_hits']:
        report.append(f'- 同义词轮换 (口播行 {hit["line"]}): {body.splitlines()[hit["line"] - 1]}')
    for kind, block, first_line in upstream.paragraph_blocks(body):
        if kind == 'prose':
            for n in (2, 3):
                for hit in upstream.isomorphic_hits(block, n):
                    report.append(f'- {n}句同构 (口播段起始行 {first_line}): {hit}')
    for _, name, char, _, _ in upstream.CHAR_HITS:
        for line_no, line in enumerate(body.splitlines(), 1):
            if char in line:
                report.append(f'- {name} (口播行 {line_no}, 指纹参考项): {line}')
    report += ['', '## Original formatted diagnostics', '```text', upstream.fmt_report(metrics, 5), '```', '']
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text('\n'.join(report), encoding='utf-8')
    print(f'{"FAIL" if failed else "PASS"}: {output}')
    return int(failed)


if __name__ == '__main__':
    raise SystemExit(main())
