import unittest
from gate import extract_narration


class ExtractionTests(unittest.TestCase):
    def test_metadata_and_nonspoken_banned_words_excluded(self):
        body = extract_narration('# 标题赋能\n## 口播\n这是口播。\n## 来源注（不口播）\n闭环')
        self.assertEqual(body, '这是口播。')

    def test_missing_and_mixed_sections_rejected(self):
        for text in ['# no speech', '## 口播\n', '## 口播\n### notes\nfoo']:
            with self.assertRaises(ValueError):
                extract_narration(text)

    def test_adapter_uses_short_narration(self):
        import subprocess
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as tmp:
            script = Path(tmp) / 'SCRIPT_v1.md'
            report = Path(tmp) / 'report.md'
            script.write_text('## 口播\n这是口播。\n## 来源\n' + '字' * 600)
            result = subprocess.run([str(Path(__file__).resolve().parents[1] / 'narration-detect'), str(script), '--output', str(report)], capture_output=True)
            self.assertIn(result.returncode, (0, 1))
            self.assertIn('短稿模式，汉字数 4', report.read_text())
            self.assertIn('Original CLI exit: 0', report.read_text())


if __name__ == '__main__':
    unittest.main()
