#!/usr/bin/env python3
"""Real new utterance fixtures stay bound to exact diagnostic scope versions."""
import copy
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch
import unittest

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
spec = importlib.util.spec_from_file_location('fixed_utterance_v3_gate', Path(__file__).with_name('review-fixed-utterance.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
support = gate.load('fixed_utterance_v3_test_support', 'review-decisions.py')
PANDA = json.loads((BASE / 'audio-context-peer-hsk3-optional-r/sole-zero-fixed-original-utterance-independent-explicit-decision.json').read_text())
FINAL = json.loads((BASE / 'audio-review/hsk2-final-two-fixed-utterance-independent-decisions-01.json').read_text())
FIXTURES = []
for filename, decisions in [('hsk3-paired-full-03.json', PANDA['decisions']),
                            ('hsk2-paired-full-01.json', FINAL['decisions'])]:
    report = json.loads((BASE / 'audio-review' / filename).read_text())
    for d in decisions:
        matches = [r for r in report['targets'] if r['id'] == d['id'] and r['sourceSampleRange16k'] == d['sourceSampleRange16k']]
        assert len(matches) == 1
        FIXTURES.append((matches[0], d))


class FixedUtteranceV3Tests(unittest.TestCase):
    def fixture(self, index=0):
        return copy.deepcopy(FIXTURES[index])

    def reject(self, row, decision):
        with self.assertRaises(ValueError):
            gate.validate(row, decision, ROOT, support)

    def test_actual_three_new_source_scopes_reproduce(self):
        for row, decision in FIXTURES:
            proof = gate.validate(row, decision, ROOT, support)
            self.assertTrue(proof['allRawEvidenceUnchanged'])
            self.assertFalse(proof['automaticProductionApproval'])
        panda = gate.validate(*FIXTURES[0], ROOT, support)
        zero = panda['retainedZeroDecoderWordEmissions'][0]
        self.assertEqual((zero['word'], zero['start'], zero['end']), ('一', 3.22, 3.22))

    def test_nearby_candidate_rejected(self):
        row, d = self.fixture(); row['candidateId'] += 'nearby'; self.reject(row, d)

    def test_changed_crop_hash_rejected(self):
        row, d = self.fixture(); row['cropPCM_SHA256'] = '0' * 64; self.reject(row, d)

    def test_one_original_frame_shift_rejected(self):
        row, d = self.fixture(1); row['sourceSampleRange16k'][0] += 1; self.reject(row, d)

    def test_other_registry_version_cannot_supply_new_scope(self):
        row, d = self.fixture(1)
        d['fixedOriginalUtteranceDecoderDecisionEvidence']['authorizedFixedSourceScope'] = gate.SCOPE_REFERENCE
        self.reject(row, d)

    def test_unknown_original_core_rejected(self):
        row, d = self.fixture(2)
        d['fixedOriginalUtteranceDecoderDecisionEvidence']['phonemeIdentityUnknown'] = True
        self.reject(row, d)

    def test_missing_actual_ctc_rejected(self):
        row, d = self.fixture(1)
        d['fixedOriginalUtteranceDecoderDecisionEvidence']['originalSourcePhysicalEvidence'].pop('independentlyVerifiedCTCSupplementalEvidence')
        self.reject(row, d)

    def test_unregistered_caption_or_empty_warning_rejected(self):
        for hold in ['crop-ASR-empty-segments-or-word-evidence', 'crop-ASR-repetition-or-compression-warning']:
            row, d = self.fixture(); row['holds'].append(hold); self.reject(row, d)

    def test_new_zero_not_authorized_by_noSpeech_scope(self):
        row, d = self.fixture(1); row['holds'].append(gate.ZERO_WORD); self.reject(row, d)

    def test_raw_text_change_is_not_a_source_context_license(self):
        row, d = self.fixture(2); row['rawModelEvidence'][0]['rawTranscript'] += '另一句'; self.reject(row, d)

    def test_silent_pcm_cannot_claim_complete_original_utterance(self):
        row, d = self.fixture(1)
        original = support.original_pcm(ROOT, row)
        with patch.object(support, 'original_pcm', return_value=bytes(len(original))):
            self.reject(row, d)


if __name__ == '__main__':
    unittest.main(verbosity=2)
