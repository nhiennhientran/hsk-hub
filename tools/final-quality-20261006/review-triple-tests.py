#!/usr/bin/env python3
"""Real accepted-proof fixtures: no-speech exceptions cannot hide other defects."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('triple_validator',Path(__file__).with_name('review-triple-literal.py'))
validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
report=json.loads((ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk3-priority27-approved-frames-01.json').read_text())
STRICT=next(x for x in report['acceptedSourceFrameGates']if x['tripleLiteralNoSpeechDecisionEvidence']['category']=='triple-literal-noSpeech-proxy-review')
GLYPH=next(x for x in report['acceptedSourceFrameGates']if x['tripleLiteralNoSpeechDecisionEvidence']['category']=='triple-fixed-source-glyph-noSpeech-proxy-review')


class FixedSourceNoSpeechGates(unittest.TestCase):
    def reject(self,row,decision):
        with self.assertRaises(ValueError):validator.validate(row,decision,ROOT)
    def fixture(self):return copy.deepcopy(STRICT),copy.deepcopy(STRICT['independentDecision'])
    def test_real_pinned_three_model_source_proof_passes(self):
        validator.validate(STRICT,STRICT['independentDecision'],ROOT)
    def test_real_explicit_glyph_proof_has_separate_scope(self):
        validator.validate(GLYPH,GLYPH['independentDecision'],ROOT)
    def test_actual_traditional_result_cannot_be_called_strict_literal(self):
        r=copy.deepcopy(GLYPH);d=copy.deepcopy(r['independentDecision']);p=d['tripleLiteralNoSpeechDecisionEvidence'];p['category']='triple-literal-noSpeech-proxy-review';p.pop('explicitSourceGlyphScopeEvidence');self.reject(r,d)
    def test_same_source_one_frame_change_cannot_reuse_proof(self):
        r,d=self.fixture();r['sourceSampleRange16k'][0]+=1;self.reject(r,d)
    def test_empty_decoder_evidence_stays_closed(self):
        r,d=self.fixture();r['holds'].append('crop-ASR-empty-segments-or-word-evidence');self.reject(r,d)
    def test_zero_duration_decoder_evidence_stays_closed(self):
        r,d=self.fixture();r['holds'].append('crop-ASR-zero-inverted-or-out-of-bounds-word');self.reject(r,d)
    def test_nonquiet_actual_cut_stays_closed(self):
        r,d=self.fixture();r['actualEdgeRMSDbFS20ms']['beforeStart']=-24;self.reject(r,d)
    def test_unknown_real_phoneme_stays_closed(self):
        r,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['phonemeIdentityUnknown']=True;self.reject(r,d)
    def test_ctc_model_alone_cannot_replace_whisper_pair(self):
        r,d=self.fixture();r['rawModelEvidence']=r['rawModelEvidence'][:1];self.reject(r,d)
    def test_explicit_glyph_scope_rejects_homophone_substitution(self):
        r=copy.deepcopy(GLYPH);d=copy.deepcopy(r['independentDecision']);d['tripleLiteralNoSpeechDecisionEvidence']['explicitSourceGlyphScopeEvidence']['originalTraditionalSourceText']='另一同音字';self.reject(r,d)
    def test_arbitrary_real_source_head_cannot_claim_four_readings(self):
        r,d=self.fixture();p=d['tripleLiteralNoSpeechDecisionEvidence'];p['sourceReadingEvidence']['originalFourReadingHeadEvidence']=[{'head':r['sourceZH'],'canonicalPrintedSource':p['originalPrintedSource'],'actualPrintedPinyin':r['sourcePinyin'],'actualFourReadingsIndependentlyReviewed':True,'explanation':'negative fixture attempts an unregistered four-reading head'}];self.reject(r,d)


if __name__=='__main__':unittest.main(verbosity=2)
