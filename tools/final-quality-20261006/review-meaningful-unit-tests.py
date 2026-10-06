#!/usr/bin/env python3
"""Meaningful-unit regression cases using an immutable actual lesson/crop fixture.

Mutated text observations below are rejection fixtures, never audio approvals.
"""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('crop_gate',Path(__file__).with_name('review-crops.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
HOLD='crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven'


class MeaningfulUnits(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        report=json.loads((ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk2-paired-full-01.json').read_text())
        cls.row,=[r for r in report['targets']if r['id']=='hsk2-fltrp-2026:l05:text1:line6']
        cls.path=Path(cls.row['rawModelEvidence'][1]['file'])
        cls.raw=json.loads(cls.path.read_text())

    def holds(self,source,transcript=None):
        row=copy.deepcopy(self.row);row['sourceZH']=source
        raw=copy.deepcopy(self.raw)
        if transcript is not None:
            raw.pop('deduplicatedRawASRFile',None)
            raw['rawSegments']=[{'id':1,'text':transcript,'no_speech_prob':0.01,'compression_ratio':1,
                'words':[{'word':transcript,'start':0,'end':row['duration'],'probability':0.99}]}]
        result=gate.inspect_raw(raw,row,row['cropPCM_SHA256'],row['duration'],self.path,root=ROOT)
        return result['holds']

    def test_actual_same_eleven_cjk_name_difference_is_text_only(self):
        holds=self.holds(self.row['sourceZH'])
        self.assertNotIn(HOLD,holds)
        self.assertIn('crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review',holds)

    def test_changed_number_rejected(self):
        self.assertIn(HOLD,self.holds(self.row['sourceZH'],'没事,医学姐说12点前到就可以'))

    def test_number_expansion_not_silently_equated(self):
        self.assertIn(HOLD,self.holds(self.row['sourceZH'],'没事,医学姐说十一点前到就可以'))

    def test_repeated_number_rejected(self):
        self.assertIn(HOLD,self.holds(self.row['sourceZH'],'没事,医学姐说11点11前到就可以'))

    def test_two_number_order_is_preserved(self):
        self.assertIn(HOLD,self.holds('11点到22点','22点到11点'))

    def test_missing_roman_name_rejected(self):
        self.assertIn(HOLD,self.holds('AI小语','小语'))

    def test_roman_case_only_and_cjk_typo_keep_roman_unit(self):
        self.assertNotIn(HOLD,self.holds('AI小语','ai小雨'))

    def test_different_roman_unit_rejected(self):
        self.assertIn(HOLD,self.holds('AI小语','AG小语'))


if __name__=='__main__':unittest.main(verbosity=2)
