#!/usr/bin/env python3
"""Actual nine complete-utterance scopes remain exact and fail closed."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('fixed_utterance_v4', Path(__file__).with_name('review-fixed-utterance.py'))
gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(gate)
support = gate.load('fixed_utterance_v4_support', 'review-decisions.py')
D = ROOT / 'course-app/docs/final-quality-20261006'
DECISIONS = json.loads((D / 'audio-review/hsk3-nine-fixed-original-utterance-independent-decisions-01.json').read_text())['decisions']
REPORT = json.loads((D / 'audio-review/hsk3-paired-full-03.json').read_text())
ROWS = {(r['id'], tuple(r['sourceSampleRange16k'])): r for r in REPORT['targets']}


class FixedUtteranceV4Tests(unittest.TestCase):
    def fixture(self, zero=False):
        d = next(d for d in DECISIONS if ('crop-ASR-zero-inverted-or-out-of-bounds-word' in d['resolvedDecoderASRDiagnosticHolds']) == zero)
        return copy.deepcopy(ROWS[d['id'], tuple(d['sourceSampleRange16k'])]), copy.deepcopy(d)

    def reject(self, row, decision):
        with self.assertRaises(ValueError):
            gate.validate(row, decision, ROOT, support)

    def test_all_nine_actual_source_scopes_reproduce(self):
        for d in DECISIONS:
            proof = gate.validate(ROWS[d['id'], tuple(d['sourceSampleRange16k'])], d, ROOT, support)
            self.assertFalse(proof['automaticProductionApproval'])
            self.assertTrue(proof['noWordAlignmentCreated'])

    def test_adjacent_candidate_is_not_authorized(self):
        r, d = self.fixture(); r['candidateId'] += '-adjacent'; self.reject(r, d)

    def test_one_frame_change_is_not_authorized(self):
        r, d = self.fixture(); r['sourceSampleRange16k'][1] += 1; self.reject(r, d)

    def test_missing_ctc_source_verification_is_rejected(self):
        r, d = self.fixture(); d['fixedOriginalUtteranceDecoderDecisionEvidence']['originalSourcePhysicalEvidence'].pop('independentlyVerifiedCTCSupplementalEvidence'); self.reject(r, d)

    def test_unknown_core_is_not_overridden(self):
        r, d = self.fixture(); d['fixedOriginalUtteranceDecoderDecisionEvidence']['phonemeIdentityUnknown'] = True; self.reject(r, d)

    def test_extra_zero_diagnostic_cannot_use_nospeech_scope(self):
        r, d = self.fixture(); r['holds'].append(gate.ZERO_WORD); self.reject(r, d)

    def test_changed_zero_emission_raw_text_is_rejected(self):
        r, d = self.fixture(zero=True); r['rawModelEvidence'][0]['rawTranscript'] += '多一个字'; self.reject(r, d)

    def test_empty_decoder_stays_closed(self):
        r, d = self.fixture(); r['holds'].append('crop-ASR-empty-segments-or-word-evidence'); self.reject(r, d)

    def test_silent_source_cannot_fake_complete_utterance(self):
        r, d = self.fixture(); pcm = support.original_pcm(ROOT, r)
        with patch.object(support, 'original_pcm', return_value=bytes(len(pcm))):
            self.reject(r, d)


if __name__ == '__main__':
    unittest.main(verbosity=2)
