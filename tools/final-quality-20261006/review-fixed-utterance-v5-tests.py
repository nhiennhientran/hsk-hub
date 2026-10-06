#!/usr/bin/env python3
"""Actual price and final-qian fixtures preserve source differences exactly."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('utterance05', Path(__file__).with_name('review-fixed-utterance.py'))
gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(gate)
support = gate.load('utterance05_support', 'review-decisions.py')
D = ROOT/'course-app/docs/final-quality-20261006/audio-review'
DECISIONS = json.loads((D/'hsk3-final-price-qian-independent-decisions-01.json').read_text())['decisions']
REPORT = json.loads((D/'hsk3-paired-full-03.json').read_text())
ROWS = {(r['id'], tuple(r['sourceSampleRange16k'])):r for r in REPORT['targets']}

class ExactPriceTests(unittest.TestCase):
    def fixture(self):
        d = next(x for x in DECISIONS if 'originalRecordedNumeralVariantEvidence' in x['fixedOriginalUtteranceDecoderDecisionEvidence'])
        return copy.deepcopy(ROWS[d['id'],tuple(d['sourceSampleRange16k'])]), copy.deepcopy(d)
    def reject(self,r,d):
        with self.assertRaises(ValueError): gate.validate(r,d,ROOT,support)
    def test_both_actual_original_utterances_reproduce(self):
        for d in DECISIONS: gate.validate(ROWS[d['id'],tuple(d['sourceSampleRange16k'])],d,ROOT,support)
    def test_wrong_candidate(self):
        r,d=self.fixture(); r['candidateId']+='-next'; self.reject(r,d)
    def test_changed_frame(self):
        r,d=self.fixture(); r['sourceSampleRange16k'][1]+=1; self.reject(r,d)
    def test_different_numeric_value(self):
        r,d=self.fixture(); d['fixedOriginalUtteranceDecoderDecisionEvidence']['originalRecordedNumeralVariantEvidence']['canonicalWrittenFirstPrice']='48'; self.reject(r,d)
    def test_missing_notice(self):
        r,d=self.fixture(); d['fixedOriginalUtteranceDecoderDecisionEvidence'].pop('studentVisibleRecordingNoteEvidence'); self.reject(r,d)
    def test_false_shi_pronunciation_claim(self):
        r,d=self.fixture(); d['fixedOriginalUtteranceDecoderDecisionEvidence']['originalRecordedNumeralVariantEvidence']['canonicalFullBashiPronunciationClaim']=True; self.reject(r,d)
    def test_changed_raw_model_prediction(self):
        r,d=self.fixture();r['rawModelEvidence'][0]['rawTranscript']='裙子408短裤400';self.reject(r,d)
    def test_unknown_source_core(self):
        r,d=self.fixture();d['fixedOriginalUtteranceDecoderDecisionEvidence']['phonemeIdentityUnknown']=True;self.reject(r,d)

if __name__=='__main__':unittest.main(verbosity=2)
