#!/usr/bin/env python3
"""Bind two actual source decisions to the independently registered exact v05."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-context-peer-hsk3-remaining-spoken-hard15'
REPORT = BASE / 'audio-review/hsk3-paired-full-03.json'
REGISTRY = BASE / 'audio-review/fixed-original-utterance-decoder-scopes-05.json'
PROPOSALS = OUT / 'two-source-differences-complete-original-utterance-physical-proposals.json'
NOTICE = OUT / 'price480-original-colloquial-recording-student-note-proposal.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def main():
    assert sha(REGISTRY) == '0e17839d970908c507bf5702318e85c93a55d1d0f340ee07e4308e85cdfd9aee'
    assert sha(PROPOSALS) == '71a12ba1744fa4f9d047be6ba5f3e32e8ab7dcb7d6c033932d4a290c3ed79799'
    assert sha(REPORT) == '0311e6d565ce6e0ea579e3bfd8b7f4d4f1f4514fc26bd4fd30d41a7fd1c4731d'
    assert sha(NOTICE) == 'c1207add2c91f1982f07ed4e11a4f9c385c090cb8bee5e7168feb14cb34086f8'
    registry = json.loads(REGISTRY.read_text())
    rows = {r['id']: r for r in json.loads(REPORT.read_text())['targets']}
    proposals = json.loads(PROPOSALS.read_text())['decisions']
    assert len(proposals) == 2
    support = module('two_fixed_actual_context', ROOT / 'tools/final-quality-20261006/review-decisions.py')
    validator_path = ROOT / 'tools/final-quality-20261006/review-fixed-utterance.py'
    validator = module('two_fixed_actual_utterance', validator_path)
    decisions = []; checks = []
    for proposal in proposals:
        row = rows[proposal['id']]
        physical = proposal['actualOriginalUtteranceSourcePhysicalEvidence']
        entry = next(r for r in registry['targets'] if r['id'] == row['id'])
        for key in ('id', 'candidateId', 'sourceSampleRange16k', 'cropPCM_SHA256'):
            assert proposal[key] == entry[key] == row[key]
        assert entry['originalPhysicalEvidence'] == physical
        assert entry['originalRawResultWhitelist'] == proposal['originalRawResultWhitelist']
        assert entry['onlyAuthorizedZeroDecoderWordEmissions'] == proposal['onlyAuthorizedZeroDecoderWordEmissions']
        proof = {k: row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        proof.update({'sourceText': row['sourceZH'],
            'category': 'fixed-complete-original-utterance-decoder-diagnostic-review',
            'authorizedFixedSourceScope': ref(REGISTRY), 'originalSourcePhysicalEvidence': physical,
            'phonemeIdentityUnknown': False, 'completeOriginalCoreUtteranceIndependentlyReviewed': True,
            'independentCoreSourceSpectrumExplanation': physical['explanation'],
            'humanListening': False, 'nativeSpeakerReview': False, 'pronunciationToneCertified': False,
            'devicePlaybackCertified': False, 'fullPhonemeCertification': False})
        if physical.get('originalRecordedNumeralVariantEvidence'):
            assert entry['studentVisibleRecordingNoteEvidence'] == ref(NOTICE)
            proof['originalRecordedNumeralVariantEvidence'] = copy.deepcopy(physical['originalRecordedNumeralVariantEvidence'])
            proof['studentVisibleRecordingNoteEvidence'] = ref(NOTICE)
        context = copy.deepcopy(proposal['originalSourceContextEvidence'])
        support.contextual_decision(row, {'sourceContextEvidence': context}, ROOT)
        decision = {k: row[k] for k in ('id', 'candidateId', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        decision.update({'decision': 'accept', 'sourceContextChecked': True,
            'rationale': physical['explanation'], 'acknowledgedFlags': row['flags'],
            'sourceContextEvidence': context, 'fixedOriginalUtteranceDecoderDecisionEvidence': proof,
            'resolvedTextHolds': sorted(set(row['holds']) & support.TEXT_REVIEW_HOLDS),
            'resolvedDecoderASRDiagnosticHolds': sorted(set(row['holds']) & support.DECODER_DIAGNOSTIC_HOLDS),
            'resolvedSourceHolds': [], 'resolvedBoundaryHolds': [],
            'humanListening': False, 'nativeSpeakerReview': False, 'pronunciationToneCertified': False,
            'devicePlaybackCertified': False, 'fullPhonemeCertification': False, 'productionApproved': False})
        validated = validator.validate(row, decision, ROOT)
        assert validated['allRawEvidenceUnchanged'] is True
        checks.append({'id': row['id'], 'candidateId': row['candidateId'], 'status': 'passed',
            'exactScope': ref(REGISTRY), 'originalPhysicalEvidenceUnchanged': True,
            'retainedWhisperNoSpeechWarnings': validated['retainedWhisperNoSpeechWarnings'],
            'allRawEvidenceUnchanged': True,
            'printed480AndSourceBashiRetainedSeparatelyFromRecordedSibaiBa': bool(physical.get('originalRecordedNumeralVariantEvidence'))})
        decisions.append(decision)
    path = OUT / 'two-source-differences-fixed-original-explicit-decisions.json'
    dump(path, {'schemaVersion': 1, 'status': 'independent-exact-original-source-decisions-awaiting-central-compile',
        'reviewer': 'acceptance_scope_plan', 'reviewReportSHA256': sha(REPORT), 'sourceReportEvidence': ref(REPORT),
        'authorizedFixedSourceScope': ref(REGISTRY), 'immutablePhysicalProposalsEvidence': ref(PROPOSALS),
        'studentVisiblePriceRecordingNoteEvidence': ref(NOTICE), 'scriptEvidence': ref(Path(__file__)),
        'decisions': decisions, 'newASR': False, 'sourceModified': False, 'runtimeModified': False, 'automaticApproval': False})
    validation = OUT / 'two-source-differences-fixed-original-read-only-validation.json'
    dump(validation, {'status': 'passed', 'passed': len(checks), 'checks': checks, 'decisionEvidence': ref(path),
        'validatorEvidence': ref(validator_path), 'authorizedFixedSourceScope': ref(REGISTRY),
        'allRawEvidenceUnchanged': True, 'authorityModified': False, 'automaticProductionApproval': False})
    print(json.dumps({'decisions': ref(path), 'validation': ref(validation), 'passed': len(checks)}))


if __name__ == '__main__':
    main()
