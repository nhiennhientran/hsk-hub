#!/usr/bin/env python3
"""Actual 极 source variant remains a single immutable complete-recording scope."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('recorded_head_syllable',Path(__file__).with_name('review-syllable-evidence.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
support=gate.module()
D=ROOT/'course-app/docs/final-quality-20261006'
DECISION=json.loads((D/'audio-review/hsk3-ji-complete-original-head-independent-decisions-01.json').read_text())['decisions'][0]
REPORT=json.loads((D/'audio-context-peer-hsk3-final4/four-original-source-fresh-paired-v1.json').read_text())
ROW=next(r for r in REPORT['targets'] if r['id']==DECISION['id'])

class RecordedHeadTests(unittest.TestCase):
    def fixture(self):return copy.deepcopy(ROW),copy.deepcopy(DECISION)
    def reject(self,r,d):
        with self.assertRaises(ValueError):gate.validate(r,d,ROOT,support)
    def test_actual_complete_recording_preserves_nonquiet_and_uncertainty(self):
        p=gate.validate(ROW,DECISION,ROOT,support)
        self.assertFalse(p['phonemeIdentityIsKnownForThisExactSourceOccurrence'])
        self.assertTrue(p['actualOriginalHeadCoreIsIdentified'])
        self.assertFalse(p['uniqueCanonicalOnsetClassificationCertified'])
        self.assertTrue(any(v>-45 for v in ROW['actualEdgeRMSDbFS20ms'].values() if v is not None))
    def test_neighboring_candidate_rejected(self):
        r,d=self.fixture();r['candidateId']+='-next';self.reject(r,d)
    def test_one_frame_change_rejected(self):
        r,d=self.fixture();r['sourceSampleRange16k'][1]+=1;self.reject(r,d)
    def test_unknown_recorded_core_rejected(self):
        r,d=self.fixture();d['shortSyllableDecoderDecisionEvidence']['actualOriginalHeadCoreIsIdentified']=False;self.reject(r,d)
    def test_false_unique_phone_classification_rejected(self):
        r,d=self.fixture();d['shortSyllableDecoderDecisionEvidence']['uniqueCanonicalOnsetClassificationCertified']=True;self.reject(r,d)
    def test_missing_student_note_rejected(self):
        r,d=self.fixture();d['shortSyllableDecoderDecisionEvidence']['fixedOriginalRecordedHeadVariantEvidence'].pop('studentVisibleRecordingNoteEvidence');self.reject(r,d)
    def test_missing_expansion_rejected(self):
        r,d=self.fixture();d['boundaryDecisionEvidence']['expandedProbeEvidence'].pop();self.reject(r,d)
    def test_changed_onset_or_final_rejected(self):
        r,d=self.fixture();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllableComponents16k'][0]['sourceSampleRange16k'][0]+=1;self.reject(r,d)
    def test_changed_model_result_rejected(self):
        r,d=self.fixture();r['rawModelEvidence'][0]['rawTranscript']='另一个词';self.reject(r,d)
    def test_extra_zero_diagnostic_rejected(self):
        r,d=self.fixture();r['holds'].append('crop-ASR-zero-inverted-or-out-of-bounds-word');self.reject(r,d)
    def test_silent_pcm_cannot_be_an_original_voiced_head(self):
        r,d=self.fixture();pcm=support.original_pcm(ROOT,r)
        with patch.object(support,'original_pcm',return_value=bytes(len(pcm))):self.reject(r,d)

if __name__=='__main__':unittest.main(verbosity=2)
