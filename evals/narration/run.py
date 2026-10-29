#!/usr/bin/env python3
"""Build local promptfoo fixtures from narration only; never track source text."""
import argparse, json, os, re, subprocess, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent
DEFAULT = Path.home() / 'lemo-opuscar/films/openai-navier-stokes-lean-gap'
p = argparse.ArgumentParser()
p.add_argument('--case', help='Evaluate only this case id')
p.add_argument('--deterministic-only', action='store_true', help='Run only red-line and opening assertions')
p.add_argument('--project', type=Path, default=DEFAULT)
p.add_argument('--report', type=Path, required=True)
p.add_argument('--human-reference', type=Path, help='Verified human-written narration, not the placeholder')
p.add_argument('--promptfoo', default='promptfoo', help='Installed promptfoo executable')
a = p.parse_args()
def extract(text):
    m = re.search(r'^##\s+口播\s*\n(.*?)(?=^#{1,2}\s|\Z)', text, re.M | re.S)
    if not m or not m[1].strip():
        raise ValueError('Missing nonempty ## 口播 section')
    return m[1].strip()
tests = []
for version, case in enumerate(json.loads((ROOT / 'cases.json').read_text()), 1):
    if a.case and case['id'] != a.case:
        continue
    text = (a.project / case['file']).read_text()
    narration = extract(text)
    target = re.search(r'^外行复述句[：:]\s*(.+)$', text, re.M)
    tests.append({'description': f"{case['id']}: {case['label']}",
                  'vars': {'narration': narration, 'label': case['label']},
                  'assert': [{'type': 'javascript', 'value': f'file://{ROOT}/assertions.cjs:redLines'},
                             {'type': 'javascript', 'value': f'file://{ROOT}/assertions.cjs:opening'}]})
    llm_ready = not a.deterministic_only and bool((os.getenv('NARRATION_LLM_API_KEY') or os.getenv('OPENAI_API_KEY')) and os.getenv('NARRATION_LLM_MODEL'))
    if llm_ready and target:
        tests[-1]['vars']['retell_target'] = target[1]
        tests[-1]['assert'].append({'type': 'javascript', 'value': f'file://{ROOT}/assertions.cjs:retell'})
    if llm_ready and a.human_reference:
        human = a.human_reference.read_text().strip()
        if not human or '缺人写参照' in human:
            raise ValueError('Human reference is still a placeholder')
        tests[-1]['vars'].update(human_reference=human, blind_seed=42 + version)
        tests[-1]['assert'].append({'type': 'javascript', 'value': f'file://{ROOT}/assertions.cjs:blind'})
config = {'description': 'Narration regression: known negative examples; partial metrics do not override Baidi judgement',
          'prompts': ['{{narration}}'], 'providers': [f'file://{ROOT}/provider.cjs'], 'tests': tests}
# Private narration and promptfoo output stay outside git.
with tempfile.TemporaryDirectory(prefix='narration-eval-') as temp:
    config_path, result_path = Path(temp)/'config.json', Path(temp)/'results.json'
    config_path.write_text(json.dumps(config, ensure_ascii=False))
    command = [a.promptfoo, 'eval', '-c', str(config_path), '-o', str(result_path), '--no-cache', '--no-progress-bar']
    try:
        env = dict(os.environ)
        env.setdefault('PROMPTFOO_CONFIG_DIR', str(Path(temp)/'state'))
        env.setdefault('PROMPTFOO_DISABLE_TELEMETRY', '1')
        run = subprocess.run(command, capture_output=True, text=True, env=env)
        if not result_path.exists():
            raise RuntimeError(f'promptfoo exit {run.returncode}: {(run.stderr or run.stdout)[-1500:]}')
        raw = json.loads(result_path.read_text())
        results = raw.get('results', {}).get('results', []) if isinstance(raw.get('results'), dict) else raw.get('results', [])
        lines = ['# Narration eval', '', 'Labels: v1/v2=baidi_judged_bad，v3/v3.1=pending_baidi；局部检查不改变人工标签。', '',
                 '## 实跑：promptfoo 断言（缺项不计为通过）', '', f"LLM model: {os.getenv('NARRATION_LLM_MODEL', '未配置')}；base URL: {'已配置' if os.getenv('NARRATION_LLM_BASE_URL') or os.getenv('OPENAI_BASE_URL') else '默认 OpenAI（本轮无完整凭据）'}", '']
        for r in results:
            desc = r.get('testCase', {}).get('description', 'fixture')
            grading = r.get('gradingResult', {})
            lines += [f'### {desc}', f"- PASS={grading.get('pass')}，已运行断言均分={grading.get('score')}"]
            for c in grading.get('componentResults', []):
                lines.append(f"- {'PASS' if c.get('pass') else 'FAIL'} score={c.get('score')}: {c.get('reason')}")
        lines += ['', '## 附加断言状态（本轮缺项）', ('a) 复述断言：见上方评分；未启用的 fixture 缺目标句或 provider。' if any(any(':retell' in c['value'] for c in t['assert']) for t in tests) else '- a) 零背景复述：SKIP。本轮仅运行确定性断言或缺少目标句/完整 provider；不生成语义分数。'),
                  ('d) 盲测：见上方评分。' if a.human_reference and llm_ready else '- d) 盲测：SKIP，缺人写参照或完整 LLM provider；参见 human-reference.md。'),
                  '- b) 本轮是前15字的保守确定性矛盾词检查，不声称完成 LLM 语义判分。',
                  '', '阈值：复述 score>=0.8，其余 score=1 才 PASS；全部已运行项通过才局部关口 PASS，SKIP 不代表完整验收。任何 FAIL 退出1；评测工具失败退出2。',
                  '', '事实包仅作为边界来源，不参与禁词扫描；禁词只扫描 ## 口播 到下一个二级标题。']
        a.report.parent.mkdir(parents=True, exist_ok=True)
        a.report.write_text('\n'.join(lines)+'\n')
        print(a.report)
        raise SystemExit(0 if all(r.get('gradingResult', {}).get('pass', False) for r in results) and results else 1)
    except (OSError, RuntimeError) as error:
        a.report.parent.mkdir(parents=True, exist_ok=True)
        a.report.write_text(f'# Narration eval\n\nERROR: {error}\n\nNo scores generated.\n')
        print(error)
        raise SystemExit(2)
