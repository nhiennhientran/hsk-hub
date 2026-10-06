#!/usr/bin/env python3
"""Actual fixed original nucleus observations and adversarial proof fixtures."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('spectrum_gate',Path(__file__).with_name('review-fixed-nucleus-spectrum.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
support=gate.__dict__.get('support')
spec=importlib.util.spec_from_file_location('spectrum_support',Path(__file__).with_name('review-decisions.py'))
support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)

class FixedOriginalSpectrumTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  b=ROOT/'course-app/docs/final-quality-20261006/audio-review'
  report=json.loads((b/'hsk1-numeral13-paired-02.json').read_text())
  cls.rows=[r for r in report['targets']if r['id']in gate.SCOPES]
  cls.temp=tempfile.TemporaryDirectory();cls.out=Path(cls.temp.name)
 def proof(self,row):
  a,b=gate.scope(row);path=ROOT/f"course-app/docs/final-quality-20261006/audio-review/{row['candidateId']}-actual-nucleus-spectrum-01.json"
  p={k:row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
  p.update(sourceText=row['sourceZH'],category='fixed-ID-original-nucleus-spectrum-proxy-review',actualSpectrumObservation={'file':str(path),'sha256':support.digest(path)},explanation='Actual fixed original 80ms harmonic windows; no phoneme or tone certificate.')
  for k in ('nucleusPhaseIndependentlyReviewed','actualThreeHarmonicSourceSpectrumReviewed','F0GateAndOriginalBinsUnchanged','noToneOrPhonemeCertificationClaimed'):p[k]=True
  return p,[[a,b]]
 def test_both_actual_fixed_original_nuclei_reproduce(self):
  for row in self.rows:
   p,n=self.proof(row);x=gate.validate(row,p,ROOT,support,n)
   self.assertGreaterEqual(x['actualHarmonicWindows'],2);self.assertIs(x['automaticApproval'],False)
 def test_one_sample_changed_crop_rejected(self):
  row=copy.deepcopy(self.rows[0]);p,n=self.proof(row);row['sourceSampleRange16k'][0]+=1
  with self.assertRaisesRegex(ValueError,'limited'):gate.validate(row,p,ROOT,support,n)
 def test_different_target_cannot_use_fixed_proxy(self):
  row=copy.deepcopy(self.rows[0]);p,n=self.proof(row);row['id']='unregistered-target'
  with self.assertRaisesRegex(ValueError,'limited'):gate.validate(row,p,ROOT,support,n)
 def test_neighbor_nucleus_range_rejected(self):
  row=self.rows[0];p,n=self.proof(row);n[0][0]-=160
  with self.assertRaisesRegex(ValueError,'another component'):gate.validate(row,p,ROOT,support,n)
 def test_fabricated_harmonic_frequency_rejected(self):
  row=self.rows[0];p,n=self.proof(row);d=json.loads(Path(p['actualSpectrumObservation']['file']).read_text())
  d['windows'][0]['actualThreeHarmonicObservations'][0][0]['frequencyHz']+=1
  f=self.out/'forged.json';f.write_text(json.dumps(d));p['actualSpectrumObservation']={'file':str(f),'sha256':support.digest(f)}
  with self.assertRaisesRegex(ValueError,'do not reproduce'):gate.validate(row,p,ROOT,support,n)
 def test_changed_observation_bytes_fail_hash(self):
  row=self.rows[0];p,n=self.proof(row);p['actualSpectrumObservation']['sha256']='0'*64
  with self.assertRaises(ValueError):gate.validate(row,p,ROOT,support,n)
 def test_missing_actual_spectrum_cannot_pass(self):
  row=self.rows[0];p,n=self.proof(row);p.pop('actualSpectrumObservation')
  with self.assertRaises(ValueError):gate.validate(row,p,ROOT,support,n)
 def test_silent_pcm_cannot_create_harmonic_nucleus(self):
  windows=gate.observations(bytes(4*4000),0,3000)
  self.assertTrue(windows);self.assertFalse(any(x['harmonicNucleusObservation']for x in windows))

if __name__=='__main__':unittest.main()
