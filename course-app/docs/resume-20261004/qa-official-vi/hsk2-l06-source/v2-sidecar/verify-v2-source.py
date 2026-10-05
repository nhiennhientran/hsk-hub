#!/usr/bin/env python3
"""Check a separately versioned one-record source repair against frozen source QA."""
from pathlib import Path
import hashlib
import json

OUT = Path(__file__).resolve().parent
APP = OUT.parents[4]
REPO = APP.parent
ORIGINAL = APP / 'docs/resume-20261004/official-vi-source-prep/hsk2-l06'
V2 = ORIGINAL / 'source-correction-v2'
INITIAL_QA = OUT.parent
TARGET = 'hsk2-official-vi:l06:p052:text4-whole-paragraph'
OLD_SHA = 'bbe804e8bf0d2abb8caf7f44a67baa4da58935c8179c9d10ff4f907749aeff71'
NEW_SHA = '9df03d8b01446b998c1afe6e9fadb500106b525ad6c2d438388d0232641ba94d'
V2_FREEZE_SHA = '53db8c82b300b2f159a0db6921642926795758bc2946ed97573f87bbc395dcc9'
INITIAL_QA_FREEZE_SHA = '0de5d0c6e4e394fc89ea820a9dd13bdce1e35a42133fa506d366d98b85bbfa2a'
checks = []


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(name, actual, expected):
    assert actual == expected, (name, actual, expected)
    checks.append({'name': name, 'passed': True})


check('original source bytes remain frozen', sha(ORIGINAL / 'source-transcription.json'), OLD_SHA)
check('initial independent QA freeze unchanged', sha(INITIAL_QA / 'freeze-manifest.json'), INITIAL_QA_FREEZE_SHA)
check('actual corrected source bytes', sha(V2 / 'source-transcription.json'), NEW_SHA)
check('actual v2 author freeze bytes', sha(V2 / 'freeze-manifest.json'), V2_FREEZE_SHA)
original = json.loads((ORIGINAL / 'source-transcription.json').read_text())
corrected = json.loads((V2 / 'source-transcription.json').read_text())
freeze = json.loads((V2 / 'freeze-manifest.json').read_text())
original_freeze = json.loads((ORIGINAL / 'freeze-manifest.json').read_text())
initial_review = json.loads((INITIAL_QA / 'independent-review.json').read_text())
initial_decisions = json.loads((INITIAL_QA / 'item-decisions.json').read_text())['records']
own_repair = json.loads((INITIAL_QA / 'repair-list.json').read_text())['repairs'][0]
repair = json.loads((V2 / 'repair.json').read_text())
for file in freeze['files']:
    check('v2 frozen file bytes ' + file['file'], (V2 / file['file']).stat().st_size, file['bytes'])
    check('v2 frozen file SHA ' + file['file'], sha(V2 / file['file']), file['sha256'])
for file, expected in original_freeze['files'].items():
    check('original author frozen file preserved ' + file, sha(ORIGINAL / file), expected)
check('v2 repaired author differs from independent reviewer', corrected['author'] != 'remaining_media_audit', True)
check('exact allowed top-level changed keys', sorted(key for key in set(original) | set(corrected) if key != 'records' and original.get(key) != corrected.get(key)), ['author', 'revision', 'status'])
check('original author clearly retained', corrected['revision']['originalAuthor'], original['author'])
check('original source reference SHA', corrected['revision']['originalSourceSHA256'], OLD_SHA)
check('original freeze reference SHA', corrected['revision']['originalFreezeSHA256'], sha(ORIGINAL / 'freeze-manifest.json'))
check('only one changed stable ID declared', corrected['revision']['changedRecordIds'], [TARGET])
check('v2 source still no website comparison', corrected['revision']['websiteComparisonPerformed'], False)
check('v2 source still no runtime activation', corrected['revision']['runtimeActivated'], False)
old_records = original['records']
new_records = corrected['records']
check('exact116 source records', len(new_records), 116)
check('ordered exact stable source IDs preserved', [x['sourceId'] for x in new_records], [x['sourceId'] for x in old_records])
check('source IDs unique', len(set(x['sourceId'] for x in new_records)), 116)
changes = []
item_reviews = []
for index, (old, new, inherited) in enumerate(zip(old_records, new_records, initial_decisions)):
    check(f'{index} inherited decision exact source ID', inherited['sourceId'], old['sourceId'])
    if old['sourceId'] != TARGET:
        check(f'{index} complete record unchanged', new, old)
        check(f'{index} inherited independent source acceptance', inherited['decision'], 'accepted')
        reason = 'Identical complete record to original source item independently compared to original PDF pages in initial frozen QA.'
    else:
        for key in sorted(set(old) | set(new)):
            if old.get(key) != new.get(key):
                changes.append({'sourceId': old['sourceId'], 'recordIndex': index, 'field': key, 'oldValue': old.get(key), 'newValue': new.get(key)})
        check('exact corrected whole paragraph agrees with original-image finding', new['viPrinted'], own_repair['newValue'])
        check('original complete paragraph expected-value guard', old['viPrinted'], repair['expectedValue'])
        check('corrected complete paragraph repair declaration', new['viPrinted'], repair['correctedValue'])
        copy = dict(new)
        copy['viPrinted'] = old['viPrinted']
        check('all target source fields except VI preserved', copy, old)
        check('one exact printed word insertion', new['viPrinted'], old['viPrinted'].replace('rất bận rộn và mệt,', 'rất bận rộn và rất mệt,'))
        reason = 'Independent original PDF66/footer052 diary 4x detail confirms the second printed rất; full whole paragraph otherwise unchanged.'
    item_reviews.append({'sourceId': new['sourceId'], 'sourceRecordIndex': index, 'decision': 'accepted', 'reason': reason, 'inheritedOriginalEvidence': inherited['originalPageEvidence']})
check('exactly one source field differs', len(changes), 1)
check('exact corrected source field', (changes[0]['sourceId'], changes[0]['recordIndex'], changes[0]['field']), (TARGET, 84, 'viPrinted'))
check('declared unchanged records115', repair['unchangedRecordCount'], 115)
check('declared single source field change', repair['recordFieldsChanged'], 1)
evidence = REPO / repair['evidenceFile']
check('repair evidence is correct repository-relative path', repair['evidenceFile'], 'course-app/docs/resume-20261004/qa-official-vi/hsk2-l06-source/pdf066-diary-detail-4x.png')
check('repair evidence exists as actual regular file', evidence.is_file() and not evidence.is_symlink(), True)
check('actual repair evidence bytes', sha(evidence), repair['evidenceSHA256'])
check('own independent image equals cited repair SHA', own_repair['detailSHA256'], repair['evidenceSHA256'])
check('all116 decisions accepted', len([r for r in item_reviews if r['decision'] == 'accepted']), 116)
result = {'schemaVersion': 1, 'reviewer': 'remaining_media_audit', 'author': 'root',
          'scope': 'Source-only v2 repair and reuse of frozen independent original-page acceptance, not website comparison',
          'originalSourceSHA256': OLD_SHA, 'correctedSourceSHA256': NEW_SHA, 'initialIndependentQAFreezeSHA256': INITIAL_QA_FREEZE_SHA,
          'v2AuthorFreezeSHA256': V2_FREEZE_SHA, 'checks': len(checks), 'failed': 0, 'accepted': 116, 'repair': 0, 'held': 0,
          'actualRecordChanges': changes, 'topLevelRevisionChanges': ['author', 'revision', 'status'],
          'evidencePathExists': True, 'evidencePathLayerErrorFound': False, 'evidenceSHA256': sha(evidence),
          'fullOriginalPageReadReused': True, 'freshFullPageRereadClaimed': False,
          'originalAuthorFilesChangedByReviewer': False, 'initialIndependentQAFilesChanged': False,
          'runtimeChanged': False, 'websiteComparisonPerformed': False, 'runtimeActivationApproved': False, 'publicationApproved': False,
          'itemReviews': item_reviews, 'structuralChecks': checks}
(OUT / 'v2-independent-review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key not in ['itemReviews', 'structuralChecks', 'actualRecordChanges']}, ensure_ascii=False))
