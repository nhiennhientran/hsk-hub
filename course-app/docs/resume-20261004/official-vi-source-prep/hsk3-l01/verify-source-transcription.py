#!/usr/bin/env python3
"""Check author bundle integrity/structure. Does not independently accept print."""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import csv
import hashlib
import json
import sys
from PIL import Image

BASE = Path(__file__).resolve().parent
PDF = Path('/workspace/scratch/28b55072841a/upload/HSK3 (3.0).pdf')
PDF_SHA = '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951'
PAGE_COUNTS = {13: 11, 14: 13, 15: 8, 16: 15, 17: 5, 18: 12, 19: 5, 20: 10, 21: 7, 195: 22}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def load(name):
    return json.loads((BASE / name).read_text())

def main():
    checks, issues = [], []
    def check(name, value):
        checks.append({'check': name, 'passed': bool(value)})
        if not value:
            issues.append(name)

    s = load('source-transcription.json')
    records = s['records']
    ids = [r['sourceId'] for r in records]
    check('actual-original-PDF-byte-identity', sha(PDF) == PDF_SHA and PDF.stat().st_size == s['officialPDFBytes'] == 96266563 and s['officialPDFSHA256'] == PDF_SHA)
    check('108-unique-manually-transcribed-source-identities', len(records) == len(set(ids)) == 108 and dict(Counter(r['pdfPage'] for r in records)) == PAGE_COUNTS)
    check('pending-distinct-independent-acceptance', s['status'] == 'source-only-transcribed-pending-independent-original-page-review' and s['author'] == 'native_catalogue' and s['level'] == 3 and s['lesson'] == 1 and s['boundaries']['independentSourceAcceptancePerformed'] is False)
    check('source-only-no-website-proposal-runtime-or-OCR', all(s['boundaries'][k] is False for k in ('websiteVietnameseRead', 'websiteComparisonPerformed', 'websiteProposalPrepared', 'websiteVietnameseAlignmentComplete', 'productionChanged', 'historyOrGradingStorageChanged', 'OCRUsed', 'PDFTextLayerUsedAsAuthority')))
    words = [r for r in records if 'printedNumber' in r]
    check('27-consecutive-original-numbered-words', [r['printedNumber'] for r in words] == list(range(1, 28)) and all(r['printedPOSRaw'] and r['posPrinted'] is True and r['sourceWordKind'] == 'ordinary-numbered-word' for r in words))
    check('decisive-literal-printed-POS-and-pinyin', words[16]['printedPOSRaw'] == 'đtnn.' and words[23]['printedPinyin'] == 'bújiàn' and words[4]['printedPOSRaw'] == 'lượng.')
    roles = [r for r in records if 'printedRoleVi' in r]
    check('19-appendix-role-lines-in-7-6-6-texts', len(roles) == 19 and dict(Counter(r['printedTextNumber'] for r in roles)) == {1: 7, 2: 6, 3: 6} and all(r['pdfPage'] == 195 and r['printedPage'] == 183 and r['sourceScope'] == 'official-Vietnamese-translation-appendix' and 'printedRoleZh' not in r for r in roles))
    for t, n in ((1, 7), (2, 6), (3, 6)):
        check(f'original-role-order:text{t}', [r['printedDialogueOrdinal'] for r in roles if r['printedTextNumber'] == t] == list(range(1, n + 1)))
    paragraphs = [r for r in records if r['section'] == 'appendix-text4-whole-paragraph']
    check('text4-one-whole-unlabelled-paragraph', len(paragraphs) == 1 and paragraphs[0]['printedSpeaker'] is None and paragraphs[0]['noWebsiteLinePartitionInferred'] is True and paragraphs[0]['viPrinted'].startswith('Hôm qua tôi đã đến Bắc Kinh.') and paragraphs[0]['viPrinted'].endswith('Trung Quốc rất ngon.'))
    body = s['bodyChineseOnlyTexts']
    body_ids = [r['bodySourceId'] for r in body]
    check('20-body-Chinese-only-units-unique', len(body) == len(set(body_ids)) == 20 and all(r['printedVietnameseInBody'] is False and len(r['appendixSourceIds']) == 1 for r in body))
    by_id = {r['sourceId']: r for r in records}
    for unit in body:
        counterpart = by_id[unit['appendixSourceIds'][0]]
        check('body-appendix-counterpart:' + unit['bodySourceId'], counterpart['bodyChineseSourceRef'] == unit['bodySourceId'] and counterpart['zhAnchor'] == unit['zhPrinted'] and counterpart['zhAnchorPDFPage'] == unit['pdfPage'] and counterpart['zhAnchorPrintedPage'] == unit['printedPage'] and counterpart['bodyVietnamesePrinted'] is False and counterpart['printedTextNumber'] == unit['printedTextNumber'])
    check('all-four-official-texts-fully-linked', dict(Counter(r['printedTextNumber'] for r in body)) == {1: 7, 2: 6, 3: 6, 4: 1} and {r['bodyChineseSourceRef'] for r in records if 'bodyChineseSourceRef' in r} == set(body_ids))
    check('actual-lesson-boundary-and-appendix-locator', s['scope']['actualBodyPDFPages'] == [13, 21] and s['scope']['actualBodyPrintedPages'] == [1, 9] and s['scope']['actualAppendixPDFPages'] == [195] and s['scope']['actualAppendixPrintedPages'] == [183] and s['scope']['nextLessonBoundary']['observedPrintedFooter'] == '010' and s['scope']['nextLessonBoundary']['printedLessonMarker'] == 'Bài 2' and s['scope']['supplementalConnectedSummaryPageCount'] == 0)
    pages = load('source-page-evidence.json')['pages']
    check('10-source-page-proofs-body9-plus-appendix1', [p['pdfPage'] for p in pages] == list(range(13, 22)) + [195] and len(s['readProof']) == 10)
    evidence_ids = set()
    for p in pages:
        path = BASE / p['path']
        with Image.open(path) as im:
            dimensions = list(im.size)
            im.verify()
        check('source-full-page-sha-footer:' + str(p['pdfPage']), sha(path) == p['renderSHA256'] and path.stat().st_size == p['renderBytes'] and dimensions == p['renderDimensions'] and p['sourcePDFSHA256'] == PDF_SHA and p['observedPrintedFooter'] == f"{p['printedPage']:03}" and p['authorActuallyVisuallyRead'] is True and p['originalPDFCropBoxRendered'] is True)
        evidence_ids.add(p['evidenceId'])
    details = load('source-detail-crop-evidence.json')['details']
    for p in details:
        path = BASE / p['path']
        with Image.open(path) as im:
            dimensions = list(im.size)
            im.verify()
        check('original-detail-sha-rectangle:' + p['evidenceId'], sha(path) == p['sha256'] and path.stat().st_size == p['bytes'] and dimensions == p['dimensions'] == p['rectOriginalRotatedCropBoxPixelsXYWH'][2:] and p['sourcePDFSHA256'] == PDF_SHA and p['renderDPI'] == 360 and p['origin'] == 'direct-original-PDF-CropBox' and p['authorActuallyVisuallyViewed'] is True)
        evidence_ids.add(p['evidenceId'])
    locators = load('source-locator-evidence.json')['locators']
    check('3-actually-viewed-locators', len(locators) == 3 and [p['observedPrintedFooter'] for p in locators] == ['VIII', 'X', '010'])
    for p in locators:
        path = BASE / p['path']
        with Image.open(path) as im:
            dimensions = list(im.size)
            im.verify()
        check('locator-sha-footer:' + p['path'], sha(path) == p['sha256'] and path.stat().st_size == p['bytes'] and dimensions == p['dimensions'] and p['sourcePDFSHA256'] == PDF_SHA and p['authorActuallyVisuallyViewed'] is True)
    check('all16-permanent-PNG-paths-declared', {str(p.relative_to(BASE)) for p in (BASE / 'evidence').glob('*.png')} == {p['path'] for p in pages + details + locators})
    for r in records:
        check('sourceID-value-evidence:' + r['sourceId'], r['sourceId'] == f"hsk3-official-vi:l01:p{r['printedPage']:03}:{r['section']}" and bool(r['zhAnchor']) and bool(r['viPrinted']) and r['reviewStatus'] == 'author-original-visual-transcription-awaiting-independent-review' and set(r['evidence']) <= evidence_ids and f"original-full-pdf{r['pdfPage']:03}" in r['evidence'])
    with (BASE / 'source-transcription.tsv').open(newline='') as f:
        tabular = list(csv.DictReader(f, delimiter='\t'))
    check('TSV-identities-values-exact-108', [r['sourceId'] for r in tabular] == ids and all(t['viPrinted'] == r['viPrinted'] and t['zhAnchor'] == r['zhAnchor'] for t, r in zip(tabular, records)))
    freeze_path = BASE / 'freeze-manifest.json'
    if freeze_path.exists():
        frozen = load('freeze-manifest.json')['artifacts']
        check('freeze-inventory-complete', {x['path'] for x in frozen} == {str(p.relative_to(BASE)) for p in BASE.rglob('*') if p.is_file() and p != freeze_path})
        for item in frozen:
            p = BASE / item['path']
            check('frozen-byte-identity:' + item['path'], sha(p) == item['sha256'] and p.stat().st_size == item['bytes'])
    result = {'schemaVersion': 1, 'verificationUTC': datetime.now(timezone.utc).isoformat(), 'authorBundleChecksPass': not issues, 'sourceOnly': True, 'independentSourceAcceptancePerformed': False, 'automatedChecksAreVisualReading': False, 'websiteAlignmentCertified': False, 'sourceItems': len(records), 'bodyPrintedVI': 86, 'appendixPrintedVI': 22, 'words': len(words), 'appendixRoleLines': len(roles), 'bodyAppendixBindings': len(body), 'checksPassed': sum(c['passed'] for c in checks), 'checksTotal': len(checks), 'issues': issues, 'checks': checks, 'sourceTranscriptionSHA256': sha(BASE / 'source-transcription.json')}
    if '--write' in sys.argv:
        if freeze_path.exists():
            raise SystemExit('Author source freeze is read-only.')
        (BASE / 'author-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'checks'}, ensure_ascii=False, indent=2))
    return 1 if issues else 0

if __name__ == '__main__':
    sys.exit(main())
