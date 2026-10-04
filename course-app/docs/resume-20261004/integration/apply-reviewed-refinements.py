"""Apply independently reviewed refinements to candidate and runtime copies.

Run after candidate generators. Stable IDs and old stored contexts stay intact;
only changed activity versions are advanced. Assertions prevent stale targeting.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DOC = ROOT / 'course-app/docs/resume-20261004'
VERSION = 'source-resume-20261004-reviewed-2'
proposals = json.loads((DOC / 'qa-content-09-11/oral-optional-proposals.json').read_text())['items']
stems = json.loads((DOC / 'qa-content-12-15/stem-pinyin-final-review.json').read_text())['entries']
report = []
for lesson in range(9, 16):
    batch = 'content-09-11' if lesson < 12 else 'content-12-15'
    candidate = DOC / batch / f'lesson-{lesson:02}.json'
    runtime = ROOT / 'hsk1-app/content/source-activities' / candidate.name
    previous = hashlib.sha256(candidate.read_bytes()).hexdigest()
    data = json.loads(candidate.read_text())
    acts = {a['id']: a for a in data['activities']}
    changed = set()
    for item in proposals:
        if item['lesson'] != lesson:
            continue
        a = acts[item['activity']]
        f = next(f for f in a['fields'] if f['id'] == item['field'])
        assert a['kind'] == 'pair-work' and f['assessment'] == 'ungraded'
        f['required'] = False
        a['version'] = VERSION
        changed.add(a['id'])
    if lesson == 9:
        a = acts['hsk1-original-2026-l09-p067-cloze-01']
        assert a['prompt']['zh'] == '＿＿上有一只小猫，房间外＿＿一只小狗。'
        assert 'mèo con' in a['prompt']['vi'] and 'chó con' in a['prompt']['vi']
        a['version'] = VERSION
        changed.add(a['id'])
    for item in stems:
        if item['activityId'] not in acts:
            continue
        a = acts[item['activityId']]
        f = next(f for f in a['fields'] if f['id'] == item['fieldId'])
        assert f['label']['zh'] == item['sourceChineseLabel']
        field_source = f.get('source', a['source'])
        assert field_source['printedPage'] == item['sourcePage']
        assert field_source['pdfPage'] == item['pdfPage']
        f['pinyin'] = item['pinyin']
        a['version'] = VERSION
        changed.add(a['id'])
    if changed:
        data['version'] = VERSION
    payload = (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode()
    candidate.write_bytes(payload)
    runtime.write_bytes(payload)
    report.append({'lesson': lesson, 'beforeSHA256': previous, 'afterSHA256': hashlib.sha256(payload).hexdigest(), 'revisedActivities': sorted(changed), 'runtimeBytesMatchCandidate': True})
(DOC / 'integration/reviewed-refinements.json').write_text(json.dumps({'reviewedOptionalFields': len(proposals), 'reviewedPrintedPinyinFields': len(stems), 'lessons': report}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'optionalFields': len(proposals), 'printedPinyinFields': len(stems), 'revisedActivities': sum(len(r['revisedActivities']) for r in report)}))
