#!/usr/bin/env python3
"""Freeze four explicitly inspected original HSK2 utterance decisions.

This pins the two additional diagnostic scopes; it neither edits original raw
results nor accepts another source, spelling, crop or decoder warning.
"""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-review'
PEER = BASE / 'audio-root-peer-hsk2-four-final'


def ref(path):
    return {'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def put(path, obj):
    data = (json.dumps(obj, ensure_ascii=False, indent=2) + '\n').encode()
    if path.exists() and path.read_bytes() != data:
        raise ValueError('immutable review output already differs: ' + str(path))
    path.write_bytes(data)
    return ref(path)


report_file = OUT / 'hsk2-paired-full-01.json'
report = json.loads(report_file.read_text())
rows = {x['id']: x for x in report['targets']}
ordinary_file = PEER / 'two-final-source-context-independent-decisions.json'
ordinary = json.loads(ordinary_file.read_text())
assert ref(ordinary_file)['sha256'] == '7a37221596af55205a209a7301c748d0613fa9bcd33a7ae567e25052a397295d'
assert ordinary['reviewReportSHA256'] == ref(report_file)['sha256']
assert {x['id'] for x in ordinary['decisions']} == {
    'hsk2-fltrp-2026:l06:text4:line1:sentence5', 'hsk2-fltrp-2026:l11:text3:line5'}
ordinary = copy.deepcopy(ordinary)
ordinary['centralIndependentPeerEvidence'] = ref(ordinary_file)
ordinary['centralIndependentSourceSpectrumReview'] = (
    'The four original whole/crop spectra and localized core panels were actually read. '
    'The reduplicated shu/shu/fu/fu/de bodies, complete j/ia plus connected y/ue '
    'name bodies, utterance source order and excluded neighboring utterances were '
    'independently compared with the original printed parent and unchanged raw results. '
    'No raw spelling or probability is changed and no tone/native certificate is supplied.')
ordinary_ref = put(OUT / 'hsk2-final-two-context-independent-decisions-01.json', ordinary)

proposal_file = PEER / 'two-fixed-original-utterance-independent-physical-proposals.json'
proposal = json.loads(proposal_file.read_text())
assert ref(proposal_file)['sha256'] == '33186d0d967758eb23640ef1d908f797d7b31f752b7a1199ca64f1436d2479c9'
assert proposal['reviewReportSHA256'] == ref(report_file)['sha256']
assert {x['id'] for x in proposal['decisions']} == {
    'hsk2-fltrp-2026:l11:text3:line6', 'hsk2-fltrp-2026:l13:text4:line1:sentence2'}
previous_file = OUT / 'fixed-original-utterance-decoder-scopes-02.json'
previous = json.loads(previous_file.read_text())
assert ref(previous_file)['sha256'] == '6b1e5286b435fdce27d239799c88d27952617d04a8b0a2dc06553ab164360995'
registry = copy.deepcopy(previous)
registry['previousImmutableRegistry'] = ref(previous_file)
keys = ('id', 'candidateId', 'sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
        'sourceSampleRange16k', 'cropPCM_SHA256')
warning = 'crop-ASR-hallucination-or-no-speech-warning'
for decision in proposal['decisions']:
    row = rows[decision['id']]
    assert row['sourceSampleRange16k'] == decision['sourceSampleRange16k']
    assert warning in row['holds']
    physical = decision['actualOriginalUtteranceSourcePhysicalEvidence']
    ctc = decision['actualUnmodifiedCTCRawWhitelist']
    whitelist = copy.deepcopy(decision['actualUnmodifiedTwoModelRawWhitelist'])
    whitelist.append({'file': ctc['file'], 'sha256': ctc['sha256'],
                      'modelRepository': 'SenseVoiceSmall-int8',
                      'rawTranscript': ctc['unalteredRawTranscript']})
    registry['targets'].append({**{k: row[k] for k in keys},
        'canonicalSource': row['canonicalSource'], 'canonicalSourceText': row['sourceZH'],
        'allowedDecoderHolds': [warning], 'originalSourcePhysicalProposal': ref(proposal_file),
        'originalPhysicalEvidence': physical, 'originalRawResultWhitelist': whitelist,
        'onlyAuthorizedZeroDecoderWordEmissions': [],
        'sourceScopeExplanation': decision['rationale']})
registry_ref = put(OUT / 'fixed-original-utterance-decoder-scopes-03.json', registry)

decisions = []
for proposed in proposal['decisions']:
    decision = copy.deepcopy(proposed)
    row = rows[decision['id']]
    physical = decision['actualOriginalUtteranceSourcePhysicalEvidence']
    explanation = decision['rationale'] + (
        ' Central independent reading of the actual original whole/crop and localized '
        'source spectra confirms complete first-to-last utterance bodies and excluded '
        'adjacent original utterances. The source-bound diǎnr tail is retained in its '
        'complete natural context; the printed 她 spelling is bound to this original '
        'Tā occurrence rather than inferred audibly. All native decoder text, NS '
        'probabilities, flags and timestamps remain unchanged.')
    decision.update(decision='accept', sourceContextChecked=True,
                    acknowledgedFlags=row['flags'],
                    resolvedDecoderASRDiagnosticHolds=[warning],
                    rationale=explanation, independentPeerEvidence=ref(proposal_file))
    decision['fixedOriginalUtteranceDecoderDecisionEvidence'] = {
        **{k: row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
                             'sourceSampleRange16k', 'cropPCM_SHA256')},
        'sourceText': row['sourceZH'],
        'category': 'fixed-complete-original-utterance-decoder-diagnostic-review',
        'authorizedFixedSourceScope': registry_ref,
        'originalSourcePhysicalEvidence': physical,
        'completeOriginalCoreUtteranceIndependentlyReviewed': True,
        'phonemeIdentityUnknown': False,
        'independentCoreSourceSpectrumExplanation': explanation,
        'humanListening': False, 'nativeSpeakerReview': False,
        'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
        'fullPhonemeCertification': False}
    decisions.append(decision)
fixed_ref = put(OUT / 'hsk2-final-two-fixed-utterance-independent-decisions-01.json', {
    'schemaVersion': 1, 'reviewReportSHA256': ref(report_file)['sha256'],
    'reviewReportFile': str(report_file.relative_to(ROOT)),
    'independentPeerEvidence': ref(proposal_file), 'decisions': decisions})
print(json.dumps({'ordinary': ordinary_ref, 'fixedRegistry': registry_ref,
                  'fixedDecisions': fixed_ref}))
