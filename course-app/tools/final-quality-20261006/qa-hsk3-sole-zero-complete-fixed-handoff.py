#!/usr/bin/env python3
"""Verify the one authorized actual CTC and pin independently reviewed source facts.

This performs no inference, changes no source frames, and grants no approval.
The central reviewer must register and validate the exact fixed utterance scope.
"""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-context-peer-hsk3-optional-r'
MODEL_SHA = 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def pinned(reference):
    path = ROOT / reference['file']
    assert sha(path) == reference['sha256'], reference
    return path, json.loads(path.read_text())


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    report = BASE / 'audio-review/hsk3-paired-full-03.json'
    row = next(x for x in json.loads(report.read_text())['targets']
               if x['id'] == 'hsk3-fltrp-2026:l16:text3:line1')
    assert row['candidateId'] == '15dd9b4f8e96ac11d78cfaca'
    assert row['sourceSampleRange16k'] == [3999, 89280]
    original_proposal = OUT / 'sole-zero-original-utterance-independent-physical-handoff.json'
    original = json.loads(original_proposal.read_text())['decisions'][0]
    physical = copy.deepcopy(original['actualOriginalUtteranceSourcePhysicalEvidence'])
    assert physical['phonemeIdentityUnknown'] is False
    for key in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
                'sourceSampleRange16k', 'cropPCM_SHA256'):
        assert physical[key] == row[key]
    spec = importlib.util.spec_from_file_location('qa_h3_ctc_source_support',
            ROOT / 'tools/final-quality-20261006/review-decisions.py')
    support = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(support)
    source = support.original_pcm(ROOT, row)
    first, last = row['sourceSampleRange16k']
    assert hashlib.sha256(source).hexdigest() == row['sourcePCM_SHA256']
    assert hashlib.sha256(source[first*4:last*4]).hexdigest() == row['cropPCM_SHA256']

    index_path = BASE / 'audio-hsk3-ctc-independent-peer/qa-l16-t3-l1-one-ctc/evidence-index.json'
    assert sha(index_path) == '3aa5dd64ceda491009296ce9032e4b63b61c836ada509de37e261e58e762c022'
    index = json.loads(index_path.read_text())
    input_path, supplied = pinned({'file': index['inputFile'], 'sha256': index['inputSHA256']})
    assert len(index['targets']) == len(supplied['targets']) == 1
    target = index['targets'][0]
    for key in ('id', 'candidateId', 'sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
                'sourceSampleRange16k', 'cropPCM_SHA256'):
        assert target[key] == row[key] == supplied['targets'][0][key]
    raw_path, ctc = pinned(target['independentCTC'])
    assert ctc['modelSHA256'] == MODEL_SHA
    assert ctc['sampleRate'] == 16000 and ctc['actualInputSamples'] == last-first
    assert ctc['cropPCM_SHA256'] == row['cropPCM_SHA256']
    assert ctc['actualInputSeconds'] == (last-first)/16000
    for key in ('expectedTextPromptUsed', 'hotwordsUsed', 'externalLanguageModelUsed',
                'inverseTextNormalizationUsed', 'homophoneReplacementUsed',
                'producerAlteredSourceSamples', 'automaticPrecisionApproval',
                'humanListening', 'pronunciationToneCertified'):
        assert ctc[key] is False, key
    assert ctc['producerAddedSilenceFrames'] == 0
    assert ctc['options']['use_itn'] is False
    assert ctc['options']['decoding_method'] == 'greedy_search'
    assert json.loads(ctc['rawResultString']) == ctc['rawResult']
    assert ctc['rawResult']['text'] == ctc['rawText'] == target['independentCTC']['rawText']
    assert ctc['rawText'] == '这只大熊猫一会儿爬上去一会儿跳下来可爱极了'
    script_path = ROOT / ctc['scriptFile']
    assert sha(script_path) == ctc['scriptSHA256']
    provenance_path, provenance = pinned({'file': ctc['provenanceFile'], 'sha256': ctc['provenanceSHA256']})
    # Provenance and native model body are immutable source evidence, never
    # transformed into phoneme boundaries by the token-emission timestamps.
    run_path, run = pinned({'file': index['runFile'], 'sha256': index['runSHA256']})
    observation = {key: row[key] for key in ('id', 'candidateId', 'sourceTrack',
                   'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
    observation.update({'rawEvidence': ref(raw_path), 'rawText': ctc['rawText'],
                        'actualSourceAndCropBytesVerified': True,
                        'rawResultStringVerifiedWithoutChanges': True,
                        'actualSourceIndex': ref(index_path), 'actualInputEvidence': ref(input_path),
                        'actualRunEvidence': ref(run_path), 'actualScriptEvidence': ref(script_path),
                        'actualProvenanceEvidence': ref(provenance_path),
                        'emissionTimestampsNotPhonemeBoundaries': True})
    checked_path = OUT / 'sole-zero-actual-CTC-independent-source-frame-verification.json'
    dump(checked_path, {'status': 'independent-CTC-bytes-source-frames-verified-not-approved',
                       'reviewer': 'acceptance_scope_plan', 'observations': [observation],
                       'noNewInference': True, 'automaticApproval': False,
                       'humanListening': False, 'pronunciationToneCertified': False})
    physical['independentlyVerifiedCTCSupplementalEvidence'] = ref(checked_path)
    whitelist = copy.deepcopy(original['originalRawResultWhitelist'])
    whitelist.append({**ref(raw_path), 'modelRepository': 'SenseVoiceSmall-int8',
                      'rawTranscript': ctc['rawText']})
    proposal_path = OUT / 'sole-zero-complete-original-utterance-fixed-scope-proposal.json'
    decision = {key: row[key] for key in ('id', 'candidateId', 'sourceSampleRange16k', 'cropPCM_SHA256')}
    decision.update({'status': 'actual-complete-core-and-CTC-verified-ready-for-central-fixed-scope-registration',
                     'actualOriginalUtteranceSourcePhysicalEvidence': physical,
                     'preservedDecoderDiagnosticEvidence': original['preservedDecoderDiagnosticEvidence'],
                     'originalRawResultWhitelist': whitelist,
                     'onlyAuthorizedZeroDecoderWordEmissions': [{'modelRepository': 'Systran/faster-whisper-medium',
                         'segmentIndex': 0, 'wordIndex': 11, 'word': '一', 'start': 3.22, 'end': 3.22}],
                     'originalHoldsUnchanged': row['holds'], 'flagsUnchanged': row['flags'],
                     'notProductionApproved': True})
    dump(proposal_path, {'schemaVersion': 1, 'status': 'exact-fixed-source-proposal-not-authority',
                         'reviewer': 'acceptance_scope_plan', 'sourceReportEvidence': ref(report),
                         'originalIndependentPhysicalProposal': ref(original_proposal),
                         'scriptEvidence': ref(Path(__file__)), 'decisions': [decision],
                         'newASR': False, 'sourceModified': False, 'runtimeModified': False,
                         'automaticApproval': False, 'humanListening': False,
                         'nativeSpeakerReview': False, 'pronunciationToneCertified': False,
                         'devicePlaybackCertified': False, 'fullPhonemeCertification': False})
    print(json.dumps({'ctcVerification': ref(checked_path), 'physicalProposal': ref(proposal_path)}))


if __name__ == '__main__':
    main()
