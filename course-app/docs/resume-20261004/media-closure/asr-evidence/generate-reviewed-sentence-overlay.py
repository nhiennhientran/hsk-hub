#!/usr/bin/env python3
"""Materialize only the two frozen independent post-crop runtime decisions."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
REVIEW = ROOT / 'course-app/docs/resume-20261004/qa-audio-asr-pilot/post-crop-review.json'
REVIEW_SHA = '76c0d3571f5ea0ce1c2d40de7baeffe3a58155ee6782a27636d99865c761501c'
IDS = ['hsk2-fltrp-2026:l04:text2:line3', 'hsk2-fltrp-2026:l05:text2:line8:sentence2']


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


assert digest(REVIEW) == REVIEW_SHA, 'independent review bytes changed'
review = read(REVIEW)
assert review['acceptedRuntimeFragmentIds'] == IDS
ref = {'file': str(REVIEW.relative_to(ROOT)), 'sha256': REVIEW_SHA}
manifest = {'schemaVersion': 1, 'coverageMode': 'reviewed-sentence-subset',
            'scope': {'levels': [2], 'lessons': [4, 5]}, 'review': ref,
            'acceptedRuntimeFragmentIds': IDS,
            'verificationScope': 'Two independently machine-reviewed fixed source-frame sentence fragments only. No parent-turn, word, human listening, tone or device certification.',
            'humanListening': False, 'devicePlaybackCertified': False,
            'pronunciationToneCertified': False,
            'tracks': {}, 'words': {}, 'lines': {}, 'subsegments': {}, 'unresolved': []}
authority = {'schemaVersion': 1, 'coverageMode': 'reviewed-sentence-subset', 'review': ref,
             'acceptedRuntimeFragmentIds': IDS, 'tracks': {}, 'fragments': {}}
for decision in review['sentenceDecisions']:
    identifier = decision['id']
    assert identifier in IDS and decision['eligibleForReviewedRuntimeFragment'] is True
    lesson_path = ROOT / decision['sourceLessonFile']
    assert digest(lesson_path) == decision['sourceLessonSHA256']
    lesson = read(lesson_path)
    line_id = identifier.split(':sentence')[0]
    line = next(line for text in lesson['texts'] for line in text['lines'] if line['id'] == line_id)
    zh_parts = [piece.strip() for piece in re.findall(r'[^。！？!?]+[。！？!?]*', line['zh']) if piece.strip()]
    py_parts = [piece.strip() for piece in re.findall(r'[^.!?]+[.!?]*', line['py']) if piece.strip()]
    child = ':sentence' in identifier
    ordinal = int(identifier.rsplit('sentence', 1)[1]) if child else 1
    assert len(zh_parts) == len(py_parts) and zh_parts[ordinal - 1] == decision['sourceText']
    kind = 'subsegments' if child else 'lines'
    segment = {'track': decision['sourceTrack'], 'sourceHash': decision['sourceHash'],
               'start': decision['start'], 'end': decision['end'],
               'sourceText': decision['sourceText'], 'sourcePinyin': py_parts[ordinal - 1],
               'unit': 'sentence', 'sentenceNumber': ordinal,
               'verification': {'status': 'verified',
                                'method': 'independently-reviewed-unprompted-dual-model-crop+source-frame-guards',
                                'contentMatch': 'exact-CJK-after-review-scoped-five-glyph-observation-normalization',
                                'humanListening': False, 'devicePlaybackCertified': False,
                                'pronunciationToneCertified': False},
               'guardedEvidence': {key: decision[key] for key in
                                  ['sampleRate', 'sourceSampleRange', 'sourcePCM_SHA256', 'cropPCM_SHA256', 'rawModelEvidence']}}
    segment['guardedEvidence'].update({'reviewReportSHA256': REVIEW_SHA,
                                      'lowProbabilityFlagsRetained': True,
                                      'observationGlyphMapping': review['acceptedObservationGlyphMapping']})
    if child:
        segment['parentLineId'] = line_id
    # Raw endpoint/probability/orthography observations remain byte-value exact.
    for observation in segment['guardedEvidence']['rawModelEvidence']:
        assert digest(ROOT / observation['file']) == observation['sha256']
    manifest[kind][identifier] = segment
    binding = {'kind': kind, 'level': 2, 'lesson': lesson['number'],
               'sourceLessonFile': decision['sourceLessonFile'],
               'sourceLessonSHA256': decision['sourceLessonSHA256'], 'segment': segment}
    if child:
        binding['sourceParent'] = {'id': line_id, 'sourceText': line['zh'], 'sourcePinyin': line['py'],
                                   'sentences': [{'id': f'{line_id}:sentence{index + 1}',
                                                  'sourceText': zh, 'sourcePinyin': py}
                                                 for index, (zh, py) in enumerate(zip(zh_parts, py_parts))]}
    authority['fragments'][identifier] = binding
    raw = read(HERE / f"final-run-37217540172/tracks/hsk2-l{lesson['number']:02d}-t3.json")['track']
    assert raw['sha256'] == decision['sourceHash'] and raw['pcm']['sha256'] == decision['sourcePCM_SHA256']
    manifest['tracks'][segment['track']] = {'sourceHash': raw['sha256'], 'duration': raw['pcm']['durationSeconds'],
                                            'containerDuration': raw['manifestDurationSeconds']}
    authority['tracks'][segment['track']] = {'sourceHash': raw['sha256'], 'decodedDuration': raw['pcm']['durationSeconds'],
                                            'containerDuration': raw['manifestDurationSeconds']}
manifest_path = ROOT / 'course-app/content/audio-segments-hsk2-reviewed-sentences.json'
authority_path = ROOT / 'course-app/content/audio-segment-reviewed-sentences-authority.json'
write(manifest_path, manifest)
write(authority_path, authority)
canonical_node = """import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.entries(x).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}':JSON.stringify(x);
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(readFileSync(process.argv[1])))).digest('hex'));"""
snapshot_sha = subprocess.check_output(['node', '--input-type=module', '-e', canonical_node,
                                       str(authority_path)], text=True)
contract = ROOT / 'course-app/src/audio-segment-contract.ts'
old = contract.read_text()
if 'REVIEWED_AUTHORITY_CANONICAL_SHA256' in old:
    contract.write_text(old.replace('REVIEWED_AUTHORITY_CANONICAL_SHA256', snapshot_sha))
assert snapshot_sha in contract.read_text(), 'contract digest pin differs; review change explicitly'
print(json.dumps({'manifestSHA256': digest(manifest_path), 'authorityFileSHA256': digest(authority_path),
                  'authorityCanonicalSHA256': snapshot_sha, 'acceptedSentenceFragments': len(IDS)}, indent=2))
