#!/usr/bin/env python3
"""Finalize already completed bounded restore evidence; performs no transfer."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
REPO = APP.parent
WORKSPACE = REPO.parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
inventory_path = APP / 'docs/source-inventory.json'
old_record_path = APP / 'docs/resume-20261004/source-recovery/hsk3-original-recovery.json'
# The parent-specified complete source identity must match the inventory and ledger.
expected_hash = '33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2'
target = next(s for s in read(inventory_path)['sources'] if s['sha256'] == expected_hash)
prior = read(old_record_path)['target']
assert prior['sha256'] == expected_hash and prior['expected_pages'] == 212
assert prior['printedToPdfOffset'] == 12
current = read(HERE / 'download-input.json')['result']
while 'results' not in current:
    current = current['structuredContent']
entry = current['results'][0]
assert entry['name'] == target['name'] and entry['size_bytes'] == target['size_bytes'] == 75121060
assert entry['library_file_id'] == prior['library_file_id'] == 'libfile_ffde15d98ec48191a117bb239439fe39'
assert entry['file_id'] == prior['file_id'] == 'file_00000000a36081fb887efeb76ce50ce7'
attempt = read(HERE / 'transfer-attempt.json')
assert attempt['helperInvocationsThisTask'] == 1 and attempt['helperReturnCode'] == 1
assert not attempt['timedOut']
stderr = (HERE / 'transfer-stderr.log').read_text()
assert stderr == 'library download request failed: download failed with HTTP status 502\n'
dest = WORKSPACE / 'hsk3-original-restore-downloads-current'
downloaded = [{'localPath': str(p), 'sizeBytes': p.stat().st_size}
              for p in sorted(dest.rglob('*')) if p.is_file()] if dest.exists() else []
assert not downloaded, 'Do not report no bytes if any partial or complete file exists'
files = [HERE / f for f in ['exact-search-response.json', 'download-input.json',
                            'current-helper-record.json', 'transfer-attempt.json',
                            'transfer-stdout.log', 'transfer-stderr.log', 'finalize_restore.py']]
files += [inventory_path, old_record_path]
report = {
    'schemaVersion': 1, 'reviewer': 'independent bounded original-HSK3 restore',
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'status': 'blocked-original-Chinese-HSK3; current single authorized materialization attempt returned HTTP502 and stopped',
    'target': {**target, 'expectedPages': 212, 'expectedPrintedToPdfOffset': 12,
               'library_file_id': entry['library_file_id'], 'file_id': entry['file_id']},
    'grounding': {
        'inventoryFile': str(inventory_path.relative_to(REPO)),
        'identifierLedger': str(old_record_path.relative_to(REPO)),
        'freshExactTitleSearch': 'one exact original target in results[0]; supplemental fuzzy answer PDFs were not selected',
        'searchQuery': '"'+target['name']+'"', 'search_title_only': True,
        'selectedIndex': '000', 'filenameAndByteSizeMatch': True,
        'identifiersMatchBothLedgerAndFreshSearch': True},
    'materialization': {
        **attempt, 'currentHelperRecord': 'current-helper-record.json',
        'companionPythonFiles': len(read(HERE / 'current-helper-record.json')['files']),
        'currentHelpersFreshPrivateDirectory': True, 'fullUnchangedSearchResultViaStdin': True,
        'originalFailureResponse': stderr, 'httpStatus': 502,
        'retryAfterFailure': False, 'downloadedFiles': downloaded,
        'sourceBytesRecovered': False, 'wholeFileSHA256Verified': False,
        'pageCountVerified': False},
    'scopeBoundaries': {
        'noDownloadFile32MiBRoute': True, 'noConstructedURL': True,
        'noManualURLTransfer': True, 'noPublicThirdPartyDownload': True,
        'noAuthBypass': True, 'noRepeatReadOfExtractedBacking': True,
        'newVietnamesePDFUsedAsOriginalSubstitute': False,
        'originalEnglishAppendixNewlySourceVerified': False,
        'textbookContentOrMetadataChanged': False, 'productionEdits': 0,
        'remoteWrites': 0, 'deploymentPerformed': False,
        'bPhaseStartedByThisTask': False},
    'distinctAvailableEdition': {
        'sha256': '7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951',
        'relation': 'already accepted additional official Vietnamese edition; not this original SHA or a restored byte-equivalent file'},
    'evidenceFiles': [{'file': str(p.relative_to(REPO)), 'sha256': sha(p)} for p in files],
    'nextAction': 'No further restore retries in this task. Main website work continues independently. Old original-Chinese/English source remains explicitly unavailable.'}
(HERE / 'restore-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'status': 'blocked; stopped', 'httpStatus': 502,
                  'attempts': 1, 'bytesRecovered': 0,
                  'reviewSHA256': sha(HERE / 'restore-review.json')}))
