#!/usr/bin/env python3
"""The one complete 八千八 source is not a general numeric exemption."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('fixed_number_gate',Path(__file__).with_name('review-triple-literal.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
FILE=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk2-ba-qian-ba-approved-frames-01.json'
ROW=json.loads(FILE.read_text())['acceptedSourceFrameGates'][0]

class FixedNumberScopeTests(unittest.TestCase):
    def fixture(self):return copy.deepcopy(ROW),copy.deepcopy(ROW['independentDecision'])
    def reject(self,row,d):
        with self.assertRaises(ValueError):gate.validate(row,d,ROOT)
    def test_actual_three_syllable_source_proof_passes(self):gate.validate(ROW,ROW['independentDecision'],ROOT)
    def test_same_number_new_candidate_not_authorized(self):
        row,d=self.fixture();row['candidateId']='unreviewed-number';self.reject(row,d)
    def test_digit_notation_cannot_replace_actual_raw_number(self):
        row,d=self.fixture();row['rawModelEvidence'][0]['rawTranscript']='8800';self.reject(row,d)
    def test_different_value_cannot_replace_source_number(self):
        row,d=self.fixture();row['sourceZH']='八千九！';self.reject(row,d)
    def test_missing_one_original_syllable_rejected(self):
        row,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['independentFixedNumericUtteranceReviewEvidence']['originalSyllableComponents16k'].pop();self.reject(row,d)
    def test_inverted_component_order_rejected(self):
        row,d=self.fixture();parts=d['tripleLiteralNoSpeechDecisionEvidence']['independentFixedNumericUtteranceReviewEvidence']['originalSyllableComponents16k'];parts[1],parts[2]=parts[2],parts[1];self.reject(row,d)

if __name__=='__main__':unittest.main(verbosity=2)
