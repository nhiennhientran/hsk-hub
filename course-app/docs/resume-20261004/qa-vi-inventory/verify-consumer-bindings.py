#!/usr/bin/env python3
"""Read actual stable consumer identities after the author regenerates the graph."""
from pathlib import Path
import collections
import hashlib
import json

ROOT = Path.cwd()
OUT = ROOT / 'course-app/docs/resume-20261004/qa-vi-inventory'
INVENTORY = ROOT / 'course-app/docs/resume-20261004/vi-inventory'


def read(name):
    return json.loads((ROOT / name).read_text())


def main():
    records = json.loads((INVENTORY / 'semantic-consumers.json').read_text())
    by_id = collections.defaultdict(list)
    for record in records:
        by_id[(record['kind'], record['semanticId'])].append(record)
    checks = []
    book = read('hsk1-app/content/textbook.json')
    catalog = read('hsk1-app/content/stage3-catalog.json')
    for sense in catalog['vocabulary']:
        linked = [word['id'] for lesson in book['lessons'] for word in lesson['vocab']
                  if any(item['senseId'] == sense['senseId'] for item in word.get('source', {}).get('catalogSources', []))]
        found = by_id[('word-sense', sense['senseId'])]
        good = len(found) == 1 and found[0]['course'] == 'hsk1' and found[0]['canonicalRecord'] == sense['id'] and found[0]['chinese'] == sense['zh'] and found[0]['bookTargetIds'] == linked
        checks.append({'kind': 'hsk1-word-sense', 'id': sense['senseId'], 'passed': good})
    for level in [2, 3]:
        for sense in read(f'course-app/content/hsk{level}-lexicon.json')['senses']:
            found = by_id[('word-sense', sense['id'])]
            good = len(found) == 1 and found[0]['course'] == f'hsk{level}' and found[0]['canonicalRecord'] == sense['id'] and found[0]['chinese'] == sense['zh'] and found[0]['sourceWordIds'] == [item['wordId'] for item in sense['sources']]
            checks.append({'kind': 'hsk23-word-sense', 'id': sense['id'], 'passed': good})
        for number in range(1, (15 if level == 2 else 18) + 1):
            source = read(f'course-app/content/hsk{level}/lesson-{number:02}.json')
            for activity in source['activities']:
                found = by_id[('source-activity', activity['id'])]
                expected = {'renderer': 'course-app/src/lesson-view.ts mapped(ref)',
                            'targetRef': activity['targetRef'],
                            'fieldTargetRefs': [{'fieldId': f['id'], 'targetRef': f.get('targetRef')}
                                                for f in activity['fields']]}
                good = len(found) == 1 and found[0]['course'] == f'hsk{level}' and found[0]['targetRef'] == activity['targetRef'] and found[0]['fieldIds'] == [f['id'] for f in activity['fields']] and found[0].get('sourceColumnBinding') == expected and 'sourceViews' not in found[0]
                checks.append({'kind': 'hsk23-actual-source-column', 'id': activity['id'], 'passed': good,
                               'reason': None if good else 'regenerated real targetRef/fieldTargetRefs binding required; sourceViews is not an actual runtime property'})
    for number in range(1, 16):
        suffix = '-current' if number == 4 else ''
        for activity in read(f'hsk1-app/content/source-activities/lesson-{number:02}{suffix}.json')['activities']:
            identity = activity['id'] + '@' + activity['version']
            found = by_id[('source-activity-version', identity)]
            figures = activity.get('figures', [activity['figure']] if activity.get('figure') else [])
            good = len(found) == 1 and found[0]['course'] == 'hsk1' and found[0]['fieldIds'] == [f['id'] for f in activity['fields']] and found[0]['figureIds'] == figures
            checks.append({'kind': 'hsk1-source-activity-version', 'id': identity, 'passed': good})
    summary = {'status': 'passed' if all(x['passed'] for x in checks) else 'pending-regeneration-or-mismatch',
               'semanticConsumersSHA256': hashlib.sha256((INVENTORY / 'semantic-consumers.json').read_bytes()).hexdigest(),
               'checksPassed': sum(x['passed'] for x in checks), 'checksTotal': len(checks),
               'countsByCheckKind': dict(collections.Counter(x['kind'] for x in checks)), 'checks': checks,
               'limits': 'Source identity relationships only. No official VI decision, image archive rendering or learner-facing native execution is approved.'}
    OUT.mkdir(exist_ok=True, parents=True)
    (OUT / 'consumer-binding-review.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: summary[k] for k in ['status', 'checksPassed', 'checksTotal', 'countsByCheckKind']}))
    raise SystemExit(0 if summary['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
