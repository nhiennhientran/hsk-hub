#!/usr/bin/env python3
"""Explicit independent decision for the one registered complete original utterance."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
OUT = BASE / 'audio-context-peer-hsk3-optional-r'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
    return {'file': path.relative_to(ROOT).as_posix(), 'sha256': sha(path)}


def main():
    report_path = BASE / 'audio-review/hsk3-paired-full-03.json'
    row = next(x for x in json.loads(report_path.read_text())['targets']
               if x['id'] == 'hsk3-fltrp-2026:l16:text3:line1')
    proposal_path = OUT / 'sole-zero-complete-original-utterance-fixed-scope-proposal.json'
    assert sha(proposal_path) == '3af87bec7104c26ae9d97f6c37b4ddd1378c4a2b25af3b82f5763d5c4d22ad27'
    proposal = json.loads(proposal_path.read_text())['decisions'][0]
    physical = proposal['actualOriginalUtteranceSourcePhysicalEvidence']
    scope_path = BASE / 'audio-review/fixed-original-utterance-decoder-scopes-02.json'
    assert sha(scope_path) == '6b1e5286b435fdce27d239799c88d27952617d04a8b0a2dc06553ab164360995'
    proof = {key: row[key] for key in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256',
                 'sourceSampleRange16k', 'cropPCM_SHA256')}
    proof.update({'sourceText': row['sourceZH'],
                  'category': 'fixed-complete-original-utterance-decoder-diagnostic-review',
                  'authorizedFixedSourceScope': ref(scope_path),
                  'originalSourcePhysicalEvidence': physical,
                  'phonemeIdentityUnknown': False,
                  'completeOriginalCoreUtteranceIndependentlyReviewed': True,
                  'independentCoreSourceSpectrumExplanation': physical['explanation'],
                  'humanListening': False, 'nativeSpeakerReview': False,
                  'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
                  'fullPhonemeCertification': False})
    decision = {'id': row['id'], 'candidateId': row['candidateId'],
                'sourceSampleRange16k': row['sourceSampleRange16k'],
                'cropPCM_SHA256': row['cropPCM_SHA256'], 'decision': 'accept',
                'sourceContextChecked': True, 'rationale': physical['explanation'],
                'acknowledgedFlags': row['flags'],
                'fixedOriginalUtteranceDecoderDecisionEvidence': proof,
                'resolvedDecoderASRDiagnosticHolds': row['holds'],
                'resolvedTextHolds': [], 'resolvedSourceHolds': [], 'resolvedBoundaryHolds': [],
                'humanListening': False, 'nativeSpeakerReview': False,
                'pronunciationToneCertified': False, 'devicePlaybackCertified': False,
                'fullPhonemeCertification': False}
    spec = importlib.util.spec_from_file_location('qa_h3_fixed_utterance_validator',
            ROOT / 'tools/final-quality-20261006/review-fixed-utterance.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    validated = module.validate(row, decision, ROOT)
    assert validated['allRawEvidenceUnchanged'] is True
    assert validated['retainedZeroDecoderWordEmissions'] == proposal['onlyAuthorizedZeroDecoderWordEmissions']
    path = OUT / 'sole-zero-fixed-original-utterance-independent-explicit-decision.json'
    path.write_text(json.dumps({'schemaVersion': 1, 'reviewer': 'acceptance_scope_plan',
        'reviewReportSHA256': sha(report_path), 'sourceReportEvidence': ref(report_path),
        'immutablePhysicalProposalEvidence': ref(proposal_path), 'scriptEvidence': ref(Path(__file__)),
        'decisions': [decision], 'automaticApproval': False,
        'newASR': False, 'sourceModified': False, 'runtimeModified': False},
        ensure_ascii=False, indent=2) + '\n')
    verification = OUT / 'sole-zero-fixed-original-utterance-read-only-validation.json'
    verification.write_text(json.dumps({'status': 'exact-source-core-and-fixed-decoder-gate-validated-not-authority',
        'decisionEvidence': ref(path), 'authorizedFixedSourceScope': ref(scope_path),
        'actualPreservedZeroDecoderWordEmissions': validated['retainedZeroDecoderWordEmissions'],
        'allRawEvidenceUnchanged': True, 'actualCoreSourceKnown': True,
        'automaticProductionApproval': False}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'decision': ref(path), 'validation': ref(verification)}))


if __name__ == '__main__':
    main()
