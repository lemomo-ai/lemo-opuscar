"""CLI regressions for core/render/srt.py; run with unittest discovery.

Uses only Python's standard library and temporary input/output files.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / 'core' / 'render' / 'srt.py'


class SrtExportTests(unittest.TestCase):
    def export(self, cues):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, output = root / 'cues.json', root / 'subtitles.srt'
            original = json.dumps(cues, ensure_ascii=False).encode('utf-8')
            source.write_bytes(original)
            result = subprocess.run(
                [sys.executable, '-I', str(SCRIPT), str(source), str(output)],
                cwd=root, capture_output=True, text=True, encoding='utf-8',
                timeout=10,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(source.read_bytes(), original, 'input was modified')
            self.assertEqual(result.stdout.strip(), f'{output} {len(cues)} cues')
            return output.read_bytes().decode('utf-8')

    def test_one_cue(self):
        self.assertEqual(self.export([{'t0': 1.2, 't1': 3.4, 'text': 'Hello'}]),
                         '1\n00:00:01,200 --> 00:00:03,400\nHello\n')

    def test_sort_and_number_in_time_order(self):
        cues = [{'t0': 5, 't1': 6, 'text': 'Later'},
                {'t0': 1, 't1': 2, 'text': 'Earlier'}]
        self.assertEqual(self.export(cues),
                         '1\n00:00:01,000 --> 00:00:02,000\nEarlier\n\n'
                         '2\n00:00:05,000 --> 00:00:06,000\nLater\n')

    def test_overlap_is_clipped_after_sorting(self):
        cues = [{'t0': 3, 't1': 7, 'text': 'Second'},
                {'t0': 1, 't1': 5, 'text': 'First'}]
        self.assertEqual(self.export(cues),
                         '1\n00:00:01,000 --> 00:00:03,000\nFirst\n\n'
                         '2\n00:00:03,000 --> 00:00:07,000\nSecond\n')

    def test_touching_cues_keep_their_boundary(self):
        cues = [{'t0': 0, 't1': 1, 'text': 'One'},
                {'t0': 1, 't1': 2, 'text': 'Two'}]
        self.assertEqual(self.export(cues),
                         '1\n00:00:00,000 --> 00:00:01,000\nOne\n\n'
                         '2\n00:00:01,000 --> 00:00:02,000\nTwo\n')

    def test_bilingual_multiline_utf8(self):
        text = '你好，世界！\nHello, world! 🎬'
        self.assertEqual(self.export([{'t0': 0, 't1': 4, 'text': text}]),
                         f'1\n00:00:00,000 --> 00:00:04,000\n{text}\n')

    def test_rounding_carries_into_seconds_minutes_and_hours(self):
        for start, expected in [(1.9996, '00:00:02,000'),
                                (59.9996, '00:01:00,000'),
                                (3599.9996, '01:00:00,000')]:
            with self.subTest(start=start):
                subtitle = self.export([{'t0': start, 't1': start + 1, 'text': 'Carry'}])
                self.assertTrue(subtitle.splitlines()[1].startswith(expected + ' --> '))

    def test_submillisecond_values_round_without_carry(self):
        self.assertEqual(self.export([{'t0': 1.2344, 't1': 2.3456, 'text': 'Round'}]),
                         '1\n00:00:01,234 --> 00:00:02,346\nRound\n')

    def test_negative_start_is_clamped_to_zero(self):
        self.assertEqual(self.export([{'t0': -0.5, 't1': 1, 'text': 'Start'}]),
                         '1\n00:00:00,000 --> 00:00:01,000\nStart\n')

    def test_empty_input_writes_empty_file(self):
        self.assertEqual(self.export([]), '')

    def test_missing_arguments_exit_two(self):
        for args in [[], ['cues.json']]:
            with self.subTest(args=args):
                result = subprocess.run([sys.executable, '-I', str(SCRIPT), *args],
                                        capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode, 2)
                self.assertIn('usage:', result.stderr)
                self.assertEqual(result.stdout, '')


if __name__ == '__main__':
    unittest.main()
