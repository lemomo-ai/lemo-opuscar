"""Reuse supplied judge evidence only for an exact stripped narration hash."""
import hashlib
import json
from pathlib import Path


def find_record(case_id, narration, directory):
    version = case_id.removeprefix('navier-stokes-')
    matches = []
    for path in sorted(Path(directory).glob('*.json')):
        for record in json.loads(path.read_text())['runs']:
            if record['case'] == version:
                matches.append((path, record))
    if not matches:
        return None
    if len(matches) != 1:
        raise ValueError(f'Ambiguous judge records for {case_id}')
    path, record = matches[0]
    digest = hashlib.sha256(narration.strip().encode('utf-8')).hexdigest()
    if digest != record['narration_sha256']:
        status, reason = 'STALE', 'narration_sha256 does not match current stripped narration'
    elif record['score'] is None:
        status, reason = 'SKIP', record['reason']
    else:
        score = record['score']
        if isinstance(score, bool) or not isinstance(score, (int, float)) or not 0 <= score <= 10:
            raise ValueError(f'Invalid judge score for {case_id}')
        status, reason = ('PASS' if score >= 7 else 'FAIL'), record['reason']
    return dict(status=status, reason=reason, current_sha256=digest,
                source=path.name, record=record)
