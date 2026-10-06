#!/usr/bin/env python3
"""Actual immutable utterance fixtures: exact source diagnostics stay bounded."""
import copy
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('fixed_utterance_gate', Path(__file__).with_name('review-fixed-utterance.py'))
gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(gate)
support = gate.load('fixed_utterance_test_support', 'review-decisions.py')
BASE = ROOT/'course-app/docs/final-quality-20261006/audio-review'
REPORT = json.loads((BASE/'hsk2-paired-full-01.json').read_text())
DECISIONS = json.loads((BASE/'hsk2-two-fixed-utterance-independent-decisions-01.json').read_text())['decisions']
ROWS = {d['id']: next(r for r in REPORT['targets'] if r['id'] == d['id'] and r['sourceSampleRange16k'] == d['sourceSampleRange16k']) for d in DECISIONS}


class FixedUtteranceDiagnosticTests(unittest.TestCase):
    def fixture(self, index=0):
        d=copy.deepcopy(DECISIONS[index]); return copy.deepcopy(ROWS[d['id']]), d
    def reject(self, row, decision):
        with self.assertRaises(ValueError): gate.validate(row, decision, ROOT, support)
    def test_both_real_source_scopes_reproduce(self):
        for d in DECISIONS:
            proof=gate.validate(ROWS[d['id']], d, ROOT, support)
            self.assertFalse(proof['automaticProductionApproval'])
            self.assertTrue(proof['noWordAlignmentCreated'])
        original=gate.validate(ROWS[DECISIONS[1]['id']], DECISIONS[1], ROOT, support)
        self.assertEqual(original['retainedZeroDecoderWordEmissions'][0]['word'], '本')
        self.assertEqual(original['retainedZeroDecoderWordEmissions'][0]['start'], 5.46)
        self.assertEqual(original['retainedZeroDecoderWordEmissions'][0]['end'], 5.46)
    def test_nearby_candidate_cannot_reuse_scope(self):
        row,d=self.fixture();row['candidateId']='adjacent-candidate';self.reject(row,d)
    def test_one_original_frame_change_rejected(self):
        row,d=self.fixture();row['sourceSampleRange16k'][0]+=1;self.reject(row,d)
    def test_same_name_with_other_value_not_whitelisted(self):
        row,d=self.fixture();row['rawModelEvidence'][0]['rawTranscript']='爸妈这是白家月这是另一个人';self.reject(row,d)
    def test_missing_actual_ctc_reference_rejected(self):
        row,d=self.fixture();d['fixedOriginalUtteranceDecoderDecisionEvidence']['originalSourcePhysicalEvidence'].pop('independentlyVerifiedCTCSupplementalEvidence');self.reject(row,d)
    def test_unknown_original_core_stays_held(self):
        row,d=self.fixture();d['fixedOriginalUtteranceDecoderDecisionEvidence']['phonemeIdentityUnknown']=True;self.reject(row,d)
    def test_empty_decoder_cannot_use_name_noSpeech_scope(self):
        row,d=self.fixture();row['holds'].append('crop-ASR-empty-segments-or-word-evidence');self.reject(row,d)
    def test_unregistered_zero_emission_cannot_use_name_scope(self):
        row,d=self.fixture();row['holds'].append('crop-ASR-zero-inverted-or-out-of-bounds-word');self.reject(row,d)
    def test_zero_metadata_scope_does_not_clear_noSpeech(self):
        row,d=self.fixture(1);row['holds'].append('crop-ASR-hallucination-or-no-speech-warning');self.reject(row,d)
    def test_missing_whisper_snapshot_rejected(self):
        row,d=self.fixture();row['rawModelEvidence']=row['rawModelEvidence'][:1];self.reject(row,d)
    def test_silent_fake_source_cannot_be_complete_utterance(self):
        row,d=self.fixture();pcm=support.original_pcm(ROOT,row)
        with patch.object(support,'original_pcm',return_value=bytes(len(pcm))):self.reject(row,d)


if __name__=='__main__':unittest.main(verbosity=2)
