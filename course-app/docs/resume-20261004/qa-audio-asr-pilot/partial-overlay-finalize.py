#!/usr/bin/env python3
import base64
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
REPO = APP.parent
AUTHOR = APP / 'docs/resume-20261004/media-closure/asr-evidence'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
integration = AUTHOR / 'reviewed-sentence-integration.json'
assert sha(integration) == 'face2475c214ae2cee0e200915cd3ee4ba711a9d45659c57ad2cfe7183d2fd21'
author = read(integration)
for x in author['productionFiles'] + author['unchangedLegacy']:
    assert sha(REPO / x['file']) == x['sha256']
raw = AUTHOR / 'reviewed-sentence-native-chromium/browser-results.json'
assert sha(raw) == '440920105bce54d604e0fad0f8f3445b886e5d1733eb789879f186d5ca0cc7bd'
ledger_file = AUTHOR / 'reviewed-sentence-native-chromium/attachment-ledger.json'
ledger = read(ledger_file)


def walk(suites):
    for s in suites:
        yield from s.get('specs', [])
        yield from walk(s.get('suites', []))


actual = [(a['name'], base64.b64decode(a['body']))
          for s in walk(read(raw)['suites']) for t in s['tests'] for r in t['results']
          for a in r.get('attachments', [])]
assert len(actual) == len(ledger['files']) == 4
for x, (name, body) in zip(ledger['files'], actual):
    assert name == x['name'] and hashlib.sha256(body).hexdigest() == x['sha256']
    assert len(body) == x['bytes'] and (REPO / x['portableFile']).read_bytes() == body
files = ['partial-overlay-probes.mjs', 'partial-overlay-probe-results.json',
         'partial-overlay-loader-concurrency.mjs', 'partial-overlay-loader-concurrency-before-repair.json',
         'partial-overlay-loader-concurrency-result.json', 'partial-overlay-loader-checksum-failure-result.json',
         'partial-overlay-loader-optional-failure-result.json', 'partial-overlay-unit.log',
         'partial-overlay-typecheck.log', 'partial-overlay-fixture-typecheck.log',
         'partial-overlay-native-review.py', 'partial-overlay-native-chromium-results.json',
         'partial-overlay-native-observation.json', 'partial-overlay-finalize.py']
evidence = [{'file': str(p.relative_to(REPO)), 'sha256': sha(p)}
            for p in [HERE / f for f in files] + [integration, raw, ledger_file]]
subset = read(APP / 'content/audio-segments-hsk2-reviewed-sentences.json')
probes = read(HERE / 'partial-overlay-probe-results.json')
native = read(HERE / 'partial-overlay-native-observation.json')
gates = []
for kind in ['lines', 'subsegments']:
    for identifier, s in subset[kind].items():
        gates.append({'id': identifier, 'sampleRate': 16000,
                      'sourceFrames': s['guardedEvidence']['sourceSampleRange'],
                      'start': s['start'], 'end': s['end'], 'sourceText': s['sourceText'],
                      'sourcePinyin': s['sourcePinyin'], 'sourceHash': s['sourceHash'],
                      'sourceOrdinal': s['sentenceNumber'], 'machineReviewed': True,
                      'lowProbabilityFlagsRetained': True})
report = {
    'schemaVersion': 1,
    'reviewer': 'independent source, contract and integration reviewer',
    'status': 'accepted for exactly two machine-reviewed source-frame sentence fragments; wider WebKit/device coverage remains untested here',
    'acceptedRuntimeFragmentIds': subset['acceptedRuntimeFragmentIds'],
    'sourceFrameGates': gates,
    'frozenProductionFiles': author['productionFiles'],
    'unchangedLegacy': author['unchangedLegacy'],
    'authorityCanonicalSHA256': '5fde9de3374e597ecd7cffaf84223288f51ad6d1c48c41c109374cdefcb4869b',
    'independentPostCropSourceReview': author['independentSourceFrameReview'],
    'counts': probes['counts'],
    'engineeringTests': {
        'independentSourcePositiveChecks': 30, 'independentRejectedMutations': 81,
        'actualLoaderAcceptedConcurrentGate': 'passed; callers await real SHA256 gate',
        'actualLoaderBadChecksumConcurrentGate': 'passed; old clips remain, new clips hidden',
        'actualOptionalOverlayImportFailure': 'passed; old registry remains, no new clips',
        'necessaryAuthorUnitCasesIndependentlyRun': 18,
        'sourceTypeScript': 'passed', 'fixtureTypeScript': 'passed',
        'legacyValidatorAndMergeFunctionBodies': 'byte-identical to HEAD'},
    'fixedFinding': {
        'beforeSourceSHA256': 'd093a3d14f566a4a2e281946e6024dd31bf2255776d1b6be1f85c9e27b394379',
        'description': 'A concurrent loader call could return legacy cache before the reviewed async gate finished, letting a newer route render without the 2 accepted clips. Actual-body delayed-crypto probe reproduced this.',
        'afterSourceSHA256': 'bec026507a53aaf19fd8f3af7627b21a3779371a4e5de717fdad27089e4eed00',
        'resolution': 'Shared in-flight promise precedes completed-data check. Concurrent callers await settlement; optional import/digest/merge failures preserve registered baseline.'},
    'runtimeConstraints': {
        'partialChildSourceOrdinal': 2, 'preciseParentL5Line8': False,
        'preciseSiblingSentence1': False, 'colorWordPrecision': False,
        'colorRepetitionInvented': False, 'otherCandidatesPromotedByAnalogy': False,
        'rootAndPerSegmentHumanDeviceToneCertification': False,
        'rawObservationsChanged': False, 'textbookChineseOrPinyinChanged': False,
        'reviewerProductionEdits': 0, 'deploymentPerformed': False},
    'actualNativeEvidence': native,
    'portableAttachmentIdentity': {'originalBase64Attachments': 4,
                                   'byteIdenticalDecodedFiles': 4, 'passed': True},
    'evidenceFiles': evidence,
    'limitations': [
        'No audio target beyond the 2 frozen post-crop source-frame decisions is approved.',
        'Chromium: 4 local cases; WebKit: 0, physical devices: 0, human/native-speaker listening: 0.',
        'Loader-body probes adapt only Vite/JSON imports; the real contract and real digest are used.',
        'Browser events establish seek/play/stop behavior, not sample-perfect hardware, phonetic or tone certification.',
        'Color retains the original whole vocabulary-track fallback with no repetition or precision count claim.',
        'Official Vietnamese full-book alignment remains the later B phase.']}
(HERE / 'partial-overlay-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'reviewSHA256': sha(HERE / 'partial-overlay-review.json'),
                  'sourcePositiveChecks': 30, 'negativeProbes': 81, 'unitCases': 18,
                  'actualChromiumCases': 4, 'WebKitCases': 0,
                  'finalLoaderSHA256': sha(APP / 'src/segments.ts')}))
