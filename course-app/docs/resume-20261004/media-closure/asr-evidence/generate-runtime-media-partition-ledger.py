#!/usr/bin/env python3
"""Bind every HSK2/3 source word/sentence ID to actual runtime precision/fallback.

The 1001 historical punctuation units include five non-CJK pieces. Preserve
them explicitly; neither ellipses nor a closing parenthesis is an audio cut.
"""
import collections
import concurrent.futures
import hashlib
import importlib.util
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
CONTENT = ROOT / 'course-app/content'
spec = importlib.util.spec_from_file_location('compare', HERE / 'compare-raw-source.py')
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


manifests = ['audio-segments-pilot.json', 'audio-segments-hsk2-lessons02-03.json',
             'audio-segments-hsk2-reviewed-sentences.json']
accepted_words, accepted_sentences, pending_words = {}, {}, {}
accepted_origin = {}
for name in manifests:
    data = read(CONTENT / name)
    for identifier, segment in data['words'].items():
        assert identifier not in accepted_words
        accepted_words[identifier] = segment
        accepted_origin[identifier] = name
    for identifier, segment in {**{key: value for key, value in data['lines'].items() if value['unit'] == 'sentence'}, **data['subsegments']}.items():
        assert identifier not in accepted_sentences
        accepted_sentences[identifier] = segment
        accepted_origin[identifier] = name
    pending_words.update({item['id']: item for item in data['unresolved']})
assert len(accepted_words) == 61 and len(accepted_sentences) == 97 and len(pending_words) == 13
audio_manifest = read(CONTENT / 'audio-manifest.json')
tracks = {track['file']: track for track in audio_manifest['tracks']}
diagnostics, track_diagnostics = {}, {}
diagnostic_files = [HERE / 'pilot-exact-match-report.json',
                    *sorted((HERE / 'remaining-run-37219831025').glob('*-exact-source-diagnostics.json'))]
for path in diagnostic_files:
    for track in read(path)['tracks']:
        track_diagnostics[track['track']['file']] = {'file': str(path.relative_to(ROOT)), 'sha256': digest(path),
                                                    'trackId': track['track']['id'], 'rawFile': track.get('rawEvidenceFile'),
                                                    'rawSHA256': track.get('rawEvidenceSHA256')}
        for target in track['targets']:
            assert target['id'] not in diagnostics
            diagnostics[target['id']] = (target, track_diagnostics[track['track']['file']])


def actual_source(track):
    path = ROOT / 'course-app/public' / track['file']
    result = {'id': track['id'], 'file': track['file'], 'kind': track['kind'],
              'declaredSHA256': track['sha256'], 'actualExists': path.exists(),
              'bindingEvidenceScope': 'accepted original printed track association in Chinese source metadata; no new original-PDF page reread'}
    if not path.exists():
        result['available'] = False
        return result
    result.update({'actualSHA256': digest(path), 'actualBytes': path.stat().st_size,
                   'available': digest(path) == track['sha256'] and path.stat().st_size == track['bytes']})
    if track['file'] in track_diagnostics:
        # Actual full decode+PCM SHA was independently recorded/verified above.
        reference = track_diagnostics[track['file']]
        result.update({'actualFullDecode': 'previously verified actual complete PCM for same unchanged MP3 SHA',
                       'evidence': reference})
    else:
        pcm = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-map', '0:a:0',
                              '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                             check=True, capture_output=True).stdout
        result.update({'actualFullDecode': 'passed in this ledger run', 'sampleRate': 16000,
                       'actualPCM_SHA256': hashlib.sha256(pcm).hexdigest(),
                       'samples': len(pcm) // 4, 'decodedDuration': len(pcm) / 4 / 16000})
    return result


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as workers:
    actual_tracks = list(workers.map(actual_source, tracks.values()))
assert len(actual_tracks) == 264 and all(track['available'] for track in actual_tracks)
availability_path = HERE / 'original-source-availability.json'
write(availability_path, {'schemaVersion': 1, 'tracks': actual_tracks,
                         'allOriginalFilesHashAndBytesMatched': 264,
                         'newCompleteDecodedLegacyTracks': sum(track['file'] not in track_diagnostics for track in actual_tracks),
                         'sameUnchangedOriginalsWithPreviouslyVerifiedCompletePCM': 232,
                         'humanListening': False, 'devicePlaybackCertified': False})
report = {'schemaVersion': 1, 'producerSHA256': digest(Path(__file__)),
          'scope': 'HSK2 15 + HSK3 18 source lessons only; HSK1 distinct accepted media ledger retained separately',
          'sourceAudioManifestSHA256': digest(CONTENT / 'audio-manifest.json'),
          'actualOriginalAvailability': {'file': str(availability_path.relative_to(ROOT)), 'sha256': digest(availability_path)},
          'precisionManifestBytes': [{'file': str((CONTENT / name).relative_to(ROOT)), 'sha256': digest(CONTENT / name)} for name in manifests],
          'sourceLessons': [], 'words': [], 'sentences': [], 'nonCJKCompatibilityUnits': [],
          'humanListening': False, 'nativeSpeakerReview': False, 'devicePlaybackCertified': False,
          'pronunciationToneCertified': False, 'newPrecisionFromRemainingRawCollection': 0}


def original_for(level, lesson, audio_id):
    track = next(track for track in tracks.values() if track['level'] == level and
                 track['lesson'] == lesson and f"{lesson}-{track['track']}" == audio_id)
    return {'trackId': track['id'], 'file': track['file'], 'sourceSHA256': track['sha256'],
            'available': True, 'wholeTrackFallbackAvailable': True,
            'bindingEvidenceScope': 'accepted Chinese textbook metadata to printed original-track association; source context not newly read',
            'sourceRecord': {'file': str(availability_path.relative_to(ROOT)), 'trackId': track['id']}}


def precision_or_fallback(identifier, unit, source, segment):
    if segment:
        return {'runtimeState': 'accepted-original-' + unit + '-fragment',
                'precisionAccepted': True, 'manifest': accepted_origin[identifier],
                'targetOriginalSemanticPresence': 'within existing explicitly accepted machine source/range gate; no human certification',
                'request': {'sourceKind': 'segment', 'urlAssetRelative': segment['track'],
                            'start': segment['start'], 'end': segment['end']},
                'verification': segment['verification'],
                'guardedEvidence': segment.get('guardedEvidence'), 'holdReasons': []}
    diag = diagnostics.get(identifier)
    reasons = ['no-independent-accepted-precision-source-boundary-and-crop-gate']
    reference = None
    if identifier in pending_words:
        reasons.extend(['previous-explicit-word-hold', pending_words[identifier]['reason'],
                        'historical-ASR-evidence-references-not-restored; prior metadata is not fresh raw proof'])
    if diag:
        target, reference = diag
        matches = target['exactOccurrences']
        if not matches:
            reasons.append('unmatched-in-unprompted-literal-ASR')
        elif len(matches) > 1:
            reasons.append('multiple-ASR-observations-need-independent-repeat-disambiguation')
        elif not target['uniqueWholeWordOccurrence']:
            reasons.append(matches[0]['status'])
        else:
            reasons.append('unique-literal-ASR-observation-only; no-safe-cut-approved')
            if matches[0]['minimumRawProbability'] < .5:
                reasons.append('raw-probability-below-0.5-retained')
        if target['sourceHasNonCJKLettersOrDigits']:
            reasons.append('source-non-CJK-letter-or-number-domain-is-not-certified-by-CJK-match')
    elif identifier not in pending_words:
        reasons.append('no-corresponding-raw-target-diagnostic; no-source-time-binding-inferred')
    if identifier == 'hsk2-fltrp-2026:l04:word16':
        reasons.append('independently-accepted-one-word-original-wholetrack-only; repetition-unknown; not-single-pronunciation')
    return {'runtimeState': 'whole-original-' + ('vocabulary' if unit == 'word' else 'text') + '-track-fallback',
            'precisionAccepted': False, 'request': {'sourceKind': 'original', 'urlAssetRelative': source['file'],
                                                   'start': None, 'end': None},
            'targetOriginalSemanticPresence': 'not independently established for this isolated target; raw match/unmatched is not proof of presence/absence',
            'actualUI': {'labelZH': '听所在生词组原音' if unit == 'word' else '完整课文原音',
                         'descriptionZH': '本词独立原音尚待核验，可听所在整组原音。' if unit == 'word' else '完整课文原音；未验句不显示独立句按钮',
                         'code': 'course-app/src/lesson-view.ts' if unit == 'word' else 'course-app/src/main.ts + segment-resolver.ts'},
            'holdReasons': reasons, 'diagnostic': reference}


for level, maximum in [(2, 15), (3, 18)]:
    for number in range(1, maximum + 1):
        path = CONTENT / f'hsk{level}/lesson-{number:02d}.json'
        lesson = read(path)
        cohort = 'legacy-four-reviewed-lessons' if (level == 2 and number <= 3) or (level == 3 and number == 1) else 'pilot-l04-06' if level == 2 and number <= 6 else 'remaining-26-lessons'
        report['sourceLessons'].append({'id': lesson['id'], 'file': str(path.relative_to(ROOT)),
                                        'sha256': digest(path), 'cohort': cohort,
                                        'sourceProvenance': lesson['source'],
                                        'newOriginalPageReadClaimed': False})
        for word in lesson['vocabulary']:
            source = original_for(level, number, word['audioTrack'])
            assert tracks[source['file']]['kind'] == 'vocab'
            precise = accepted_words.get(word['id'])
            if precise:
                assert precise['sourceText'] == word['zh'] and precise['sourcePinyin'] == word['py']
            report['words'].append({'id': word['id'], 'level': level, 'lesson': number, 'cohort': cohort,
                                     'sourceText': word['zh'], 'sourcePinyin': word['py'],
                                     'source': word['source'], 'original': source,
                                     **precision_or_fallback(word['id'], 'word', source, precise)})
        for text in lesson['texts']:
            source = original_for(level, number, text['audioTrack'])
            assert tracks[source['file']]['kind'] == 'text'
            for line in text['lines']:
                parts = compare.sentences(line['zh'])
                for index, part in enumerate(parts):
                    identifier = line['id'] if len(parts) == 1 else f"{line['id']}:sentence{index + 1}"
                    source_text = line['zh'] if len(parts) == 1 else part
                    precise = accepted_sentences.get(identifier)
                    if precise:
                        assert precise['sourceText'] == source_text
                    entry = {'id': identifier, 'parentLineId': line['id'], 'sourceOrdinal': index + 1,
                             'level': level, 'lesson': number, 'cohort': cohort,
                             'sourceText': source_text, 'fullSourceLineText': line['zh'],
                             'source': line['source'], 'original': source,
                             **precision_or_fallback(identifier, 'sentence', source, precise)}
                    if re.fullmatch(r'[（(].*[）)]', line['zh']):
                        entry['holdReasons'].append('stage-direction-source; not-certified-as-spoken-by-metadata')
                    report['sentences'].append(entry)
                naive_parts = [part.strip() for part in re.split('[。！？!?]', line['zh']) if part.strip()]
                for naive_index, part in enumerate(naive_parts):
                    if not compare.cjk(part):
                        identifier = line['id'] if not parts else f"{line['id']}:nonspoken-punctuation{naive_index + 1}"
                        report['nonCJKCompatibilityUnits'].append({'id': identifier, 'idScope': 'source line ID or explicit ledger-only punctuation suffix; not an accepted runtime sentence ID',
                                                                   'sourceLineId': line['id'], 'sourceText': part, 'fullSourceLineText': line['zh'],
                                                                   'source': line['source'], 'original': source,
                                                                   'runtimeState': 'no-spoken-source-fragment-established; full-source-track-remains-available',
                                                                   'precisionAccepted': False,
                                                                   'holdReasons': ['historical-naive-punctuation-unit-only; not-extra-spoken-content',
                                                                                   'do-not-infer-audio-boundary-from-ellipsis-or-closing-parenthesis']})
assert len(report['words']) == 749 and len({row['id'] for row in report['words']}) == 749
assert len(report['sentences']) == 996 and len({row['id'] for row in report['sentences']}) == 996
assert len(report['nonCJKCompatibilityUnits']) == 5
assert len(report['sourceLessons']) == 33
assert {row['id'] for row in report['words'] if row['precisionAccepted']} == set(accepted_words)
assert {row['id'] for row in report['sentences'] if row['precisionAccepted']} == set(accepted_sentences)
report['summary'] = {'sourceLessons': 33, 'sourceLines': 738, 'wordSenseEntries': 749,
                     'acceptedWordFragments': 61, 'wordWholeTrackFallbacks': 688,
                     'CJKSourceSentenceUnits': 996, 'historicalNaivePunctuationUnits': 1001,
                     'nonCJKCompatibilityUnitsExplicitlyRetained': 5,
                     'acceptedSentenceFragments': 97, 'CJKSentenceWholeTrackFallbacks': 899,
                     'newGuardedSentenceFragments': 2, 'newWordFragments': 0,
                     'allDeclaredOriginalTracksActuallyAvailableAndSHA_Matched': 264,
                     'perCohort': {cohort: {'wordEntries': sum(row['cohort'] == cohort for row in report['words']),
                                           'acceptedWords': sum(row['cohort'] == cohort and row['precisionAccepted'] for row in report['words']),
                                           'CJKSentenceUnits': sum(row['cohort'] == cohort for row in report['sentences']),
                                           'acceptedSentences': sum(row['cohort'] == cohort and row['precisionAccepted'] for row in report['sentences'])}
                                   for cohort in ['legacy-four-reviewed-lessons', 'pilot-l04-06', 'remaining-26-lessons']}}
report['remainingSourceBlockers'] = [{'scope': 'previous original HSK3 English appendix page evidence',
                                     'status': 'not restored; handled in independent source appendix ledger',
                                     'recoveryReport': 'course-app/docs/resume-20261004/source-recovery/hsk3-original-recovery.json',
                                     'originalSHA256': '33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2',
                                     'rule': 'Current metadata/new VI edition context is not a substitute claim of rereading the missing original English pages'}]
report['additionalOfficialVIEditionChineseSourceAudit'] = {'file': 'course-app/docs/resume-20261004/qa-hsk3-official-source/review.json',
                                                        'sha256': '9f015fbf612d81a8c8ab498ecf6b3af40209f5ae0832d34e78bc961f85d5a23c',
                                                        'scope': 'independent visual audit of new VI edition Chinese/PY/POS/numbered vocabulary; not restoration of original English appendix or audio semantics'}
report['summary']['confirmedAbsentIndividualOriginalTargets'] = 0
report['summary']['confirmedAbsentScope'] = 'No individual absence asserted from ASR failures or metadata; undetermined is preserved as undetermined'
write(HERE / 'runtime-media-partition-ledger.json', report)
print(json.dumps(report['summary'], ensure_ascii=False))
