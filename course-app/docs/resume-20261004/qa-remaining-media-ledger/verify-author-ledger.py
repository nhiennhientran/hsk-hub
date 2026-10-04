#!/usr/bin/env python3
"""Independently compare every author ledger target with live source and resolver output.

This verifies identities, held coverage and fallback limits. It cannot certify spoken
presence, acoustic cut safety, tones, devices or human listening.
"""
import collections
import hashlib
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
CONTENT = ROOT / 'course-app/content'
ASR = ROOT / 'course-app/docs/resume-20261004/media-closure/asr-evidence'


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cjk(text):
    return ''.join(ch for ch in unicodedata.normalize('NFKC', text)
                   if '\u3400' <= ch <= '\u9fff' or '\U00020000' <= ch <= '\U000323af')


def sentences(text):
    return [part.strip() for part in re.findall(r'[^。！？!?]+[。！？!?]*', text) if cjk(part)]


author_path = ASR / 'runtime-media-partition-ledger.json'
author = read(author_path)
assert digest(author_path) == '859eb81ddd524752401c71a5225d2eee559e72dbced5d06ae4bc2b07556df349'
assert author['newPrecisionFromRemainingRawCollection'] == 0
for field in ['humanListening', 'nativeSpeakerReview', 'devicePlaybackCertified', 'pronunciationToneCertified']:
    assert author[field] is False
resolver = read(HERE / 'resolver-review.json')
word_resolver = {row['id']: row for row in resolver['preciseWords'] + resolver['fallbackWords']}
rendered = set(resolver['renderedSentenceFragmentIds'])
rendered_requests = {}
for line in resolver['sourceLines']:
    if line['renderedPreciseControl'] == 'single-sentence':
        rendered_requests[line['id']] = line['preciseLineRequest']
    for child in line['rendererSentenceChildren']:
        rendered_requests[child['id']] = child['request']
assert set(rendered_requests) == rendered
tracks = {t['id']: t for t in read(CONTENT / 'audio-manifest.json')['tracks']}
by_metadata = {(t['level'], t['lesson'], f"{t['lesson']}-{t['track']}"): t for t in tracks.values()}
source_words, source_sentences, source_lines = {}, {}, {}
for level in [2, 3]:
    for path in sorted((CONTENT / f'hsk{level}').glob('lesson-*.json')):
        lesson = read(path)
        for word in lesson['vocabulary']:
            assert word['id'] not in source_words
            source_words[word['id']] = (word, by_metadata[(level, lesson['number'], word['audioTrack'])])
        for text in lesson['texts']:
            track = by_metadata[(level, lesson['number'], text['audioTrack'])]
            for line in text['lines']:
                assert line['id'] not in source_lines
                source_lines[line['id']] = (line, track)
                parts = sentences(line['zh'])
                for ordinal, part in enumerate(parts, 1):
                    sid = f"{line['id']}:sentence{ordinal}" if len(parts) > 1 else line['id']
                    source_sentences[sid] = (line, track, ordinal, part if len(parts) > 1 else line['zh'])
assert len(source_words) == 749 and len(source_lines) == 738 and len(source_sentences) == 996
assert {row['id'] for row in author['words']} == set(source_words)
assert {row['id'] for row in author['sentences']} == set(source_sentences)
assert len(author['words']) == len(source_words) and len(author['sentences']) == len(source_sentences)

availability_ref = author['actualOriginalAvailability']
availability_path = ROOT / availability_ref['file']
assert digest(availability_path) == availability_ref['sha256']
assert availability_ref['sha256'] == '6762490778e59232b8a26326dfcba4f89eaedc70499a720830987f34e8651f04'
availability = read(availability_path)
available = {t['id']: t for t in availability['tracks']}
assert len(available) == 264 and set(available) == set(tracks)
for track in available.values():
    source = tracks[track['id']]
    b = (ROOT / 'course-app/public' / track['file']).read_bytes()
    assert hashlib.sha256(b).hexdigest() == track['actualSHA256'] == source['sha256']
    assert len(b) == track['actualBytes'] == source['bytes']
    assert track['available'] is True and track['actualExists'] is True
assert availability['newCompleteDecodedLegacyTracks'] == 32
assert availability['sameUnchangedOriginalsWithPreviouslyVerifiedCompletePCM'] == 232

diag_targets, diagnostics = {}, {}
diagnostic_paths = [ASR / 'pilot-exact-match-report.json', *sorted((ASR / 'remaining-run-37219831025').glob('*-exact-source-diagnostics.json'))]
for path in diagnostic_paths:
    report = read(path)
    diagnostics[str(path.relative_to(ROOT))] = {'sha256': digest(path), 'report': report}
    for tr in report['tracks']:
        raw_directory = ASR / 'final-run-37217540172' if path.name == 'pilot-exact-match-report.json' else path.parent / path.name.replace('-exact-source-diagnostics.json', '')
        raw_path = raw_directory / 'tracks' / tr['rawEvidenceFile']
        assert digest(raw_path) == tr['rawEvidenceSHA256']
        raw = read(raw_path)
        for prompt_field in ['initial_prompt', 'prefix', 'hotwords']:
            assert raw['options'][prompt_field] is None
        assert raw['options']['language'] == 'zh' and raw['options']['word_timestamps'] is True
        assert raw['options']['condition_on_previous_text'] is False
        assert raw['modelRevision'] == '536b0662742c02347bc0e980a01041f333bce120'
        assert raw['track']['sha256'] == tr['track']['sha256']
        for target in tr['targets']:
            assert target['id'] not in diag_targets
            diag_targets[target['id']] = (target, tr, str(path.relative_to(ROOT)))
assert len(diag_targets) == 146 + 1617

coverage = collections.Counter()
held_by_batch = collections.defaultdict(lambda: collections.Counter())
current_inputs = []
for path in diagnostic_paths:
    current_inputs.append({'path': str(path.relative_to(ROOT)), 'sha256': digest(path)})


def original(row, track):
    value = row['original']
    assert value['trackId'] == track['id'] and value['file'] == track['file']
    assert value['sourceSHA256'] == track['sha256']
    assert value['available'] is True and value['wholeTrackFallbackAvailable'] is True
    assert 'not newly read' in value['bindingEvidenceScope']
    assert value['sourceRecord']['file'] == availability_ref['file']
    assert value['sourceRecord']['trackId'] == track['id']


def held(row):
    assert row['precisionAccepted'] is False and row['holdReasons']
    assert row['request']['sourceKind'] == 'original'
    assert row['request']['start'] is None and row['request']['end'] is None
    assert 'not independently established' in row['targetOriginalSemanticPresence']
    ref = row.get('diagnostic')
    if ref:
        target, tr, filename = diag_targets[row['id']]
        assert ref['file'] == filename and ref['sha256'] == diagnostics[filename]['sha256']
        assert ref['trackId'] == tr['track']['id']
        assert ref['rawFile'] == tr['rawEvidenceFile'] and ref['rawSHA256'] == tr['rawEvidenceSHA256']
        if target['uniqueWholeWordOccurrence']:
            assert any('unique-literal' in reason for reason in row['holdReasons'])
        elif not target['exactOccurrences']:
            assert 'unmatched-in-unprompted-literal-ASR' in row['holdReasons']
        held_by_batch[filename]['word' if row['id'] in source_words else 'sentence'] += 1
    else:
        assert row['cohort'] == 'legacy-four-reviewed-lessons'


for row in author['words']:
    word, track = source_words[row['id']]
    assert row['sourceText'] == word['zh'] and row['sourcePinyin'] == word['py'] and row['source'] == word['source']
    original(row, track)
    assert row['precisionAccepted'] == bool(word_resolver[row['id']]['preciseRequest'])
    assert row['request']['urlAssetRelative'] == track['file']
    if row['precisionAccepted']:
        expected = word_resolver[row['id']]['preciseRequest']
        assert row['request']['start'] == expected['start'] and row['request']['end'] == expected['end']
        assert row['verification']['humanListening'] is False
        coverage['wordAcceptedMetadata'] += 1
    else:
        held(row)
        assert row['actualUI']['labelZH'] == word_resolver[row['id']]['rendererLabel'].split(' / ')[0]
        coverage['wordHeld'] += 1

for row in author['sentences']:
    line, track, ordinal, unit = source_sentences[row['id']]
    assert row['parentLineId'] == line['id'] and row['fullSourceLineText'] == line['zh']
    assert row['sourceText'] == unit and row['sourceOrdinal'] == ordinal and row['source'] == line['source']
    original(row, track)
    assert row['precisionAccepted'] == (row['id'] in rendered)
    assert row['request']['urlAssetRelative'] == track['file']
    if row['precisionAccepted']:
        assert row['request']['sourceKind'] == 'segment'
        assert row['request']['start'] == rendered_requests[row['id']]['start']
        assert row['request']['end'] == rendered_requests[row['id']]['end']
        assert row['verification']['humanListening'] is False
        coverage['sentenceAcceptedMetadataOrNewGuard'] += 1
    else:
        held(row)
        coverage['sentenceHeld'] += 1
    if row['id'] in diag_targets:
        target, _, _ = diag_targets[row['id']]
        assert cjk(row['sourceText']) == cjk(target['zh'])

assert coverage == {'wordAcceptedMetadata': 61, 'wordHeld': 688, 'sentenceAcceptedMetadataOrNewGuard': 97, 'sentenceHeld': 899}
assert len(author['nonCJKCompatibilityUnits']) == 5
assert all(row['precisionAccepted'] is False and row['holdReasons'] for row in author['nonCJKCompatibilityUnits'])
for row in author['nonCJKCompatibilityUnits']:
    line, track = source_lines[row['sourceLineId']]
    assert row['fullSourceLineText'] == line['zh'] and not cjk(row['sourceText'])
    original(row, track)
assert author['summary']['confirmedAbsentIndividualOriginalTargets'] == 0
assert 'undetermined' in author['summary']['confirmedAbsentScope']
assert len(held_by_batch) == 10  # one pilot plus all nine remaining batches
review = {
    'schemaVersion': 1,
    'status': 'accepted-counts-stable-ID-held-partition-and-fallback-binding-only',
    'authorLedger': {'file': str(author_path.relative_to(ROOT)), 'sha256': digest(author_path)},
    'scope': 'All 749 word IDs, 996 strict CJK units, five non-CJK compatibility units and current original/resolver identities checked; no new source-page, audio-meaning or cut-safety acceptance',
    'counts': dict(coverage), 'wholeOriginalAssetHashChecks': 264,
    'diagnosticRawFileHashChecks': 232,
    'authorDecodeEvidence': {'old32': 'author actual complete decode records checked as ledger provenance; not repeated by this verifier', 'prior232': 'same source bytes and retained complete PCM verification references'},
    'cohortHeldSources': {name: dict(counter) for name, counter in held_by_batch.items()},
    'diagnosticInputs': current_inputs,
    'sourceContextLimits': ['Previous accepted metadata does not restore 46 missing raw evidence paths', 'New official VI Chinese/PY/POS audit does not restore old Chinese HSK3 SHA or English appendix', 'Printed-track metadata and available whole track do not independently prove an isolated target was spoken', 'Unmatched ASR does not prove original target absent'],
    'newIndependentPreciselyApprovedTargetsByThisReview': 0,
    'certifications': {'humanListening': False, 'nativeSpeakerReview': False, 'pronunciationToneCertified': False, 'devicePlaybackCertified': False},
    'runtimeRepairRequiredByThisReview': [],
    'futureRepairConditional': 'If actual original-target absence is established, add a precise per-ID absent-original state and replace blanket belongs-to-group copy for that ID; currently no such absence is established.'
}
(HERE / 'independent-review.json').write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': review['status'], 'counts': dict(coverage), 'heldEvidenceCohorts': len(held_by_batch)}, ensure_ascii=False))
