#!/usr/bin/env python3
"""Verify source-review identities/partitions. This cannot replace visual reading."""
from pathlib import Path
import hashlib
import json
import sys
import fitz

APP = Path(__file__).resolve().parents[4]
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK2 ( 3.0).pdf')
PDF_SHA = '6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def record_sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


lesson = int(sys.argv[1])
assert lesson in [4, 5, 6]
out = APP / f'docs/resume-20261004/qa-official-vi/hsk2-l{lesson:02d}-source'
src = APP / f'docs/resume-20261004/official-vi-source-prep/hsk2-l{lesson:02d}'
checks = []


def check(name, actual, expected):
    assert actual == expected, (name, actual, expected)
    checks.append({'name': name, 'passed': True})


check('original uploaded PDF actual SHA', sha(PDF), PDF_SHA)
doc = fitz.open(PDF)
check('original uploaded PDF page count', len(doc), 162)
source = json.loads((src / 'source-transcription.json').read_text())
freeze = json.loads((src / 'freeze-manifest.json').read_text())
review = json.loads((out / 'independent-review.json').read_text())
decisions = json.loads((out / 'item-decisions.json').read_text())['records']
check('frozen source actual SHA', sha(src / 'source-transcription.json'), freeze['sourceTranscriptionSHA256'])
check('independent reviewed source exact identity', review['sourceTranscriptionSHA256'], freeze['sourceTranscriptionSHA256'])
for name, expected in freeze['files'].items():
    check('author frozen input ' + name, sha(src / name), expected)
records = source['records']
ids = [r['sourceId'] for r in records]
check('source identity uniqueness', len(set(ids)), len(ids))
check('source declared count', len(ids), source['counts']['sourceItems'])
check('reviewed exact stable IDs', [r['sourceId'] for r in decisions], ids)
partition = review['acceptedSourceIDs'] + review['repairSourceIDs'] + review['heldSourceIDs']
check('reviewed partition uniqueness', len(set(partition)), len(ids))
check('reviewed partition exhaustive exact IDs', sorted(partition), sorted(ids))
for decision, record in zip(decisions, records):
    label = record['sourceId']
    check(label + ' identity structure', label, f"hsk2-official-vi:l{lesson:02d}:p{record['printedPage']:03d}:{record['section']}")
    check(label + ' actual printed-page offset', record['pdfPage'] - record['printedPage'], 14)
    check(label + ' exact reviewed record bytes', decision['sourceRecordSHA256'], record_sha(record))
    check(label + ' decision partition', label in review[decision['decision'] + 'SourceIDs'], True)
    for evidence in decision['originalPageEvidence']:
        check(label + ' independent image ' + str(evidence['pdfPage']), sha(out / evidence['file']), evidence['sha256'])
pages = json.loads((out / 'independent-page-evidence.json').read_text())['pages']
check('actual scope pages', [p['pdfPage'] for p in pages], source['scope']['actualPDFPages'])
for page in pages:
    original = doc[page['pdfPage'] - 1]
    check('actual page CropBox ' + str(page['pdfPage']), list(original.cropbox), page['cropBox'])
    check('actual page rotation ' + str(page['pdfPage']), original.rotation, page['rotation'])
    check('actual fresh page image ' + str(page['pdfPage']), sha(out / page['renderFile']), page['renderSHA256'])
    check('visual-read declaration ' + str(page['pdfPage']), page['wholePageActuallyIndependentlyViewed'], True)
words = [r for r in records if r.get('sourceWordKind') == 'ordinary-numbered-word']
check('numbered vocabulary ordinals', [r['printedNumber'] for r in words], list(range(1, source['counts']['ordinaryNumberedWords'] + 1)))
for word in words:
    check(word['sourceId'] + ' actual POS field present', word['posPrinted'] and bool(word['printedPOSRaw']), True)
roles = [r for r in records if 'printedRoleVi' in r]
check('printed role line count', len(roles), source['counts']['printedRoleTranslationLines'])
for text in [1, 2, 3]:
    current = [r for r in roles if r['printedTextNumber'] == text]
    check('text' + str(text) + ' printed role ordinals', [r['printedDialogueOrdinal'] for r in current], list(range(1, len(current) + 1)))
for name in ['source-page-evidence.json', 'source-detail-crop-evidence.json', 'source-boundary-evidence.json']:
    for evidence in json.loads((src / name).read_text()):
        check('author referenced image bytes ' + evidence['file'], sha(Path(evidence['file'])), evidence['sha256'])
for evidence in json.loads((out / 'independent-boundary-review.json').read_text())['boundaries']:
    check('independent boundary bytes ' + str(evidence['pdfPage']), sha(out / evidence['file']), evidence['sha256'])
repairs = json.loads((out / 'repair-list.json').read_text())['repairs']
check('expected initial source repair count', len(repairs), 1 if lesson == 6 else 0)
for repair in repairs:
    record = next(r for r in records if r['sourceId'] == repair['sourceId'])
    check('repair complete old VI bound', repair['oldValue'], record['viPrinted'])
    check('repair only second printed rất', repair['newValue'], record['viPrinted'].replace('rất bận rộn và mệt,', 'rất bận rộn và rất mệt,'))
    check('repair actual fresh detail bytes', sha(out / repair['detailFile']), repair['detailSHA256'])
for item in json.loads((out / 'source-semantic-observations.json').read_text())['observations']:
    check('publisher omission detail bytes', sha(out / item['detailFile']), item['detailSHA256'])
    record = next(r for r in records if r['sourceId'] == item['sourceId'])
    check('publisher omission original VI retained', item['actualWholePrintedVI'], record['viPrinted'])
result = {'schemaVersion': 1, 'lesson': lesson, 'sourceTranscriptionSHA256': sha(src / 'source-transcription.json'),
          'checks': len(checks), 'failed': 0, 'counts': review['counts'], 'structuralIdentityVerificationPassed': True,
          'sourceSemanticAndVisualJudgmentNotAutomated': True, 'productionChanged': False, 'results': checks}
(out / 'verification-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'results'}, ensure_ascii=False))
