"""Independently close the one original-PDF punctuation finding.

Reads immutable v1 audit and copied v2 author input; never reruns or overwrites
the v1 report. The original 8-page visual reading remains valid for unchanged
occurrences; the directly rendered 5x PDF27 instruction proves the correction.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V1 = ROOT.parent
OLD_SHA = '15fca6b2e6e139e6c72f8fcd6258aed77a0544d38fcb1798f1bcd4781fd3b7da'
NEW_SHA = '5a92589ef8e874835374115122eb10096b7cb26c83c07b0abefb24b288eb7889'
NEW_FREEZE = '6ec6bd08b13105d33d7ba92e0372880d8e4a8f56afe7e4158bb1579d967000b2'
V1_REPORT = '70b3d060ab187f2ac0ba5c03418c7d4573e27dda65b6d00beabfe76c393d5f97'
OID = 'hsk1-official-vi-l03-pdf027-text-1-role-read'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def diff(old, new, path=''):
    if type(old) != type(new):
        return [{'pointer': path, 'old': old, 'new': new}]
    if isinstance(old, dict):
        result = []
        for key in sorted(old.keys() | new.keys()):
            pointer = path + '/' + key.replace('~', '~0').replace('/', '~1')
            if key not in old or key not in new:
                result.append({'pointer': pointer, 'old': old.get(key), 'new': new.get(key)})
            else:
                result += diff(old[key], new[key], pointer)
        return result
    if isinstance(old, list):
        assert len(old) == len(new), path
        result = []
        for index, (a, b) in enumerate(zip(old, new)):
            result += diff(a, b, path + '/' + str(index))
        return result
    return [] if old == new else [{'pointer': path, 'old': old, 'new': new}]


def main():
    assert sha(V1 / 'author-input/source-transcription.json') == OLD_SHA
    assert sha(V1 / 'review.json') == V1_REPORT
    for row in json.loads((V1 / 'freeze-manifest.json').read_text())['files']:
        assert sha(V1 / row['file']) == row['sha256']
    assert sha(ROOT / 'author-input/source-transcription.json') == NEW_SHA
    assert sha(ROOT / 'author-input/freeze-manifest.json') == NEW_FREEZE
    old = json.loads((V1 / 'author-input/source-transcription.json').read_text())
    new = json.loads((ROOT / 'author-input/source-transcription.json').read_text())
    report = json.loads((V1 / 'review.json').read_text())
    assert report['counts'] == {'occurrences': 131, 'accepted': 130, 'repair': 1, 'missing': 0}
    changes = diff(old, new)
    assert len(changes) == 135
    text_changes = [r for r in changes if r['pointer'] in
                    ['/occurrences/21/viText', '/occurrences/21/fragments/0/lineTexts/0']]
    assert len(text_changes) == 2
    for row in text_changes:
        assert row['old'] == 'Phân vai đọc to đoạn hội thoại.'
        assert row['new'] == 'Phân vai đọc to đoạn hội thoại'
    refs = [r for r in changes if r['pointer'].endswith('/renderRef')]
    assert len(refs) == 131
    for row in refs:
        assert row['new'] == '../' + row['old']
    other = [r for r in changes if r not in text_changes and r not in refs]
    assert {r['pointer'] for r in other} == {'/authorCorrection', '/sourceTranscriptionRevision'}
    assert new['sourceTranscriptionRevision'] == 2
    correction = new['authorCorrection']
    assert correction['initialSourceSHA256'] == OLD_SHA
    assert correction['initialFreezeSHA256'] == '8555eae6afef3de977c285bbb1426e3f7c8e522124d3dded3878db7c1569c5aa'
    assert correction['changedOccurrenceIds'] == [OID]
    assert correction['changedFields'] == ['viText', 'fragments/0/lineTexts/0']
    assert new['independentReview'] == {'status': 'pending', 'reviewer': None}
    # Recheck all 131 full raw readings against immutable independent originals.
    current = {o['occurrenceId']: o for o in new['occurrences']}
    accepted = []
    for item in report['perOccurrence']:
        occurrence = current[item['occurrenceId']]
        for key, value in item['independentOriginalPDFReading'].items():
            assert occurrence.get(key) == value, (item['occurrenceId'], key)
        accepted.append({'occurrenceId': item['occurrenceId'], 'status': 'accepted',
                         'basis': 'original-PDF punctuation repair rechecked at 5x' if item['occurrenceId'] == OID
                                 else 'unchanged bytes/fields from separately accepted original-PDF reading'})
    assert len(accepted) == 131
    for key in ['wordTableRows', 'coverage', 'layoutContinuations', 'sourcePDF', 'summaryScopeLessons']:
        assert new[key] == old[key]
    (ROOT / 'exact-json-delta.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2) + '\n')
    crop = next(r for r in json.loads((V1 / 'crop-manifest.json').read_text())['crops']
                if r['path'].endswith('pdf-027-role-read-independent.png'))
    assert sha(V1 / crop['path']) == crop['sha256']
    result = {
        'schemaVersion': 1, 'reviewer': 'release_assembly', 'author': 'hsk23_remaining_source',
        'scope': 'HSK1 lesson 3 corrected original-PDF source transcription v2; no website audit',
        'status': 'accepted-source-transcription',
        'sourceSHA256': NEW_SHA, 'authorFreezeSHA256': NEW_FREEZE,
        'supersedesSourceSHA256': OLD_SHA, 'v1ReviewSHA256': V1_REPORT,
        'v1StatusPreserved': 'repair-required',
        'counts': {'occurrences': 131, 'accepted': 131, 'repair': 0, 'missing': 0},
        'closedFinding': {'occurrenceId': OID, 'fields': [r['pointer'] for r in text_changes],
                          'printedText': 'Phân vai đọc to đoạn hội thoại',
                          'pdfPage': 27, 'printedPage': '011',
                          'originalPDFCrop': '../' + crop['path'], 'cropSHA256': crop['sha256']},
        'diffClassification': {'languageFields': 2, 'relativeRenderReferences': 131,
                               'correctionMetadata': 2, 'otherChanges': 0},
        'deltaEvidence': {'file': 'exact-json-delta.json', 'sha256': sha(ROOT / 'exact-json-delta.json')},
        'authorOriginalFreezePreserved': True, 'independentV1FreezePreserved': True,
        'websiteOldVietnameseRead': False, 'authorFilesModified': False,
        'runtimeActivation': 'none', 'websiteVietnameseAuditComplete': False,
        'perOccurrence': accepted,
    }
    (ROOT / 'review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'counts': result['counts'],
                      'reviewSHA256': sha(ROOT / 'review.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
