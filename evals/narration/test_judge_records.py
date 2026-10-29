import json
import hashlib
import tempfile
import unittest
from pathlib import Path
from judge_records import find_record


class JudgeEvidenceTests(unittest.TestCase):
    def test_match_stale_null_and_no_record(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'runs.json'
            record = dict(case='v3', narration_sha256=hashlib.sha256('原稿'.encode()).hexdigest(), score=7, reason='reason')
            path.write_text(json.dumps(dict(runs=[record])))
            self.assertEqual(find_record('navier-stokes-v3', '  原稿\n', tmp)['status'], 'PASS')
            self.assertEqual(find_record('navier-stokes-v3', '新稿', tmp)['status'], 'STALE')
            self.assertIsNone(find_record('navier-stokes-v2', '原稿', tmp))
            record['score'] = None
            path.write_text(json.dumps(dict(runs=[record])))
            self.assertEqual(find_record('navier-stokes-v3', '原稿', tmp)['status'], 'SKIP')
            self.assertEqual(find_record('navier-stokes-v3', '新稿', tmp)['status'], 'STALE')
            record['score'] = 6
            path.write_text(json.dumps(dict(runs=[record])))
            self.assertEqual(find_record('navier-stokes-v3', '原稿', tmp)['status'], 'FAIL')

    def test_ambiguous_record_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = dict(runs=[dict(case='v3')])
            for name in ('one', 'two'):
                (Path(tmp) / f'{name}.json').write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'Ambiguous'):
                find_record('navier-stokes-v3', '原稿', tmp)
