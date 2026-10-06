#!/usr/bin/env python3
"""Record verified explicit approval files; this creates no decisions."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--repo-root', type=Path, default=Path.cwd())
p.add_argument('--add', action='append', default=[])
a = p.parse_args()
root = a.repo_root.resolve()
directory = Path('course-app/docs/final-quality-20261006/audio-review')
path = root / directory / 'accepted-file-checkpoint-20261006.json'
j = json.loads(path.read_text())
digest = lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
for name in a.add:
    f = directory / name
    ref = {'file': str(f), 'sha256': digest(root / f)}
    if ref not in j['acceptedSourceFrameGateFileReferences']:
        j['acceptedSourceFrameGateFileReferences'].append(ref)
catalog_file = root / 'course-app/content/audio-precision-targets-20261006.json'
catalog_sha = digest(catalog_file)
catalog = {x['id']: x for x in json.loads(catalog_file.read_text())['targets']}
rows = {}
for ref in j['acceptedSourceFrameGateFileReferences']:
    f = root / ref['file']
    assert digest(f) == ref['sha256'], ref['file']
    approved = json.loads(f.read_text())
    assert approved['independentTargetCatalogSHA256'] == catalog_sha
    for row in approved['acceptedSourceFrameGates']:
        target = catalog[row['id']]
        assert row['status'] == 'accepted-independent-machine-source-frame-review'
        assert row['level'] == target['level'] and row['unit'] == target['unit']
        assert row['sourceText'] == target['sourceText']
        rows.setdefault(row['id'], row)
j['acceptedUniqueIds'] = len(rows)
j['acceptedCountsByLevel'] = dict(Counter(str(x['level']) for x in rows.values()))
j['completeCoverage'] = False
path.write_text(json.dumps(j, ensure_ascii=False, indent=2) + '\n')
remaining = [x for x in catalog.values() if x['id'] not in rows and x['id'] != 'hsk3-fltrp-2026:l10:text3:line5']
(root / directory / 'actual-remaining-targets-checkpoint-01.json').write_text(json.dumps({
    'schemaVersion': 1, 'acceptedCheckpointSHA256': digest(path), 'targets': remaining,
    'countsByLevelAndUnit': dict(Counter(str(x['level']) + ':' + x['unit'] for x in remaining))
}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'accepted':len(rows),'countsByLevel':j['acceptedCountsByLevel'],'remaining':len(remaining),'checkpointSHA256':digest(path)}))
