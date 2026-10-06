#!/usr/bin/env python3
"""The actual 动/動 source-frame glyph scope never becomes a global conversion."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path.cwd()
D = ROOT / 'course-app/docs/final-quality-20261006/audio-review'
spec = importlib.util.spec_from_file_location('dong_triple', Path(__file__).with_name('review-triple-literal.py'))
GATE = importlib.util.module_from_spec(spec); spec.loader.exec_module(GATE)
SUPPORT = GATE.load('dong_support', 'review-decisions.py')
ROW = json.loads((D / 'hsk2-dong-existing-source-paired-01.json').read_text())['targets'][0]
DECISION = json.loads((D / 'hsk2-dong-fixed-glyph-independent-decisions-01.json').read_text())['decisions'][0]

class ExactDongGlyphTests(unittest.TestCase):
    def fixture(self): return copy.deepcopy(ROW), copy.deepcopy(DECISION)
    def reject(self, row, decision):
        with self.assertRaises(ValueError): GATE.validate(row, decision, ROOT, SUPPORT)
    def test_actual_three_raw_results_and_complete_original_reading_pass(self):
        result = GATE.validate(ROW, DECISION, ROOT, SUPPORT)
        self.assertFalse(result['automaticProductionApproval'])
    def test_adjacent_candidate_cannot_use_dong_glyph(self):
        r,d=self.fixture();r['candidateId']+='-next';self.reject(r,d)
    def test_changed_single_source_frame_is_rejected(self):
        r,d=self.fixture();r['sourceSampleRange16k'][0]+=1;self.reject(r,d)
    def test_different_word_is_not_a_glyph_pair(self):
        r,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['explicitSourceGlyphScopeEvidence']['originalTraditionalSourceText']='懂';self.reject(r,d)
    def test_raw_whitelist_cannot_drop_ctc_result(self):
        r,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['explicitSourceGlyphScopeEvidence']['originalRawResultWhitelist'].pop();self.reject(r,d)
    def test_no_global_conversion_claim_is_required(self):
        r,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['explicitSourceGlyphScopeEvidence']['noGlobalConversion']=False;self.reject(r,d)
    def test_unknown_phoneme_stays_held(self):
        r,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['phonemeIdentityUnknown']=True;self.reject(r,d)

if __name__ == '__main__': unittest.main(verbosity=2)
