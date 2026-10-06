#!/usr/bin/env python3
"""Two exact actual-background proxy proofs and real-data rejection cases."""
import copy
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('background_triple',Path(__file__).with_name('review-triple-literal.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
support=gate.load('actual_background_support','review-decisions.py')

class FixedBackgroundTripleTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  b=ROOT/'course-app/docs/final-quality-20261006/audio-review'
  report=json.loads((b/'hsk3-background6-paired-01.json').read_text())
  cls.rows={x['id']:x for x in report['targets']}
  cls.decisions=json.loads((b/'hsk3-two-background-triple-independent-decisions-01.json').read_text())['decisions']
 def fixture(self):
  d=copy.deepcopy(self.decisions[0]);return copy.deepcopy(self.rows[d['id']]),d
 def test_both_actual_fixed_background_crops_reproduce(self):
  for d in self.decisions:
   r=gate.validate(self.rows[d['id']],d,ROOT,support)
   self.assertEqual(r['category'],'triple-literal-original-background-noSpeech-proxy-review')
   self.assertTrue(r['independentlyValidatedOriginalBackgroundDecision'])
   self.assertFalse(r['automaticProductionApproval'])
 def test_nearby_candidate_cannot_reuse_background_proxy(self):
  row,d=self.fixture();row['candidateId']='nearby-geometry'
  with self.assertRaisesRegex(ValueError,'restricted'):gate.validate(row,d,ROOT,support)
 def test_changed_crop_cannot_reuse_background_proxy(self):
  row,d=self.fixture();row['cropPCM_SHA256']='0'*64;d['tripleLiteralNoSpeechDecisionEvidence']['cropPCM_SHA256']='0'*64
  with self.assertRaisesRegex(ValueError,'restricted'):gate.validate(row,d,ROOT,support)
 def test_missing_background_pause_evidence_rejected(self):
  row,d=self.fixture();d['boundaryDecisionEvidence'].pop('waveformObservation')
  with self.assertRaisesRegex(ValueError,'exact original-background'):gate.validate(row,d,ROOT,support)
 def test_unknown_phonemes_rejected_even_with_three_models(self):
  row,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['phonemeIdentityUnknown']=True
  with self.assertRaisesRegex(ValueError,'known complete'):gate.validate(row,d,ROOT,support)
 def test_nonliteral_crop_transcript_rejected(self):
  row,d=self.fixture();row['rawModelEvidence'][0]['rawTranscript']='料'
  with self.assertRaisesRegex(ValueError,'literal crop transcripts'):gate.validate(row,d,ROOT,support)
 def test_text_hold_cannot_use_background_noSpeech_route(self):
  row,d=self.fixture();row['holds'].append('crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review')
  with self.assertRaisesRegex(ValueError,'sole no-speech'):gate.validate(row,d,ROOT,support)
 def test_silent_source_replacement_cannot_be_background_foreground(self):
  row,d=self.fixture();actual=support.original_pcm(ROOT,row)
  with patch.object(support,'original_pcm',return_value=bytes(len(actual))):
   with self.assertRaisesRegex(ValueError,'actual original pause PCM'):gate.validate(row,d,ROOT,support)
 def test_generic_quiet_proxy_still_rejects_these_nonquiet_crops(self):
  row,d=self.fixture();d['tripleLiteralNoSpeechDecisionEvidence']['category']='triple-literal-noSpeech-proxy-review';row['holds']=['crop-ASR-hallucination-or-no-speech-warning']
  with self.assertRaisesRegex(ValueError,'every actual available'):gate.validate(row,d,ROOT,support)

if __name__=='__main__':unittest.main()
