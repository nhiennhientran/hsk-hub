#!/usr/bin/env python3
"""Meaningful synthetic audio regressions for source guards and parent aliases."""
import hashlib,importlib.util,json,math,tempfile,unittest,wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
TOOL=ROOT/'course-app/tools/final-quality-20261006/refine-quiet-boundaries.py'
spec=importlib.util.spec_from_file_location('edge_refiner_tests',TOOL);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class SourceGuardTests(unittest.TestCase):
 def setUp(self):
  parent=ROOT/'course-app/.repro-output/final-quality';parent.mkdir(parents=True,exist_ok=True);self.temp=tempfile.TemporaryDirectory(prefix='refine-test-',dir=parent);self.base=Path(self.temp.name);self.audio=self.base/'source.wav';self.lesson=self.base/'lesson.json';self.lesson.write_text('{"testSource":true}\n');a=np.zeros(4*16000,dtype=np.float32)
  for first,last in[(.5,1.),(1.5,2.),(2.5,3.)]:
   n=round((last-first)*16000);a[round(first*16000):round(first*16000)+n]=.2*np.sin(np.arange(n)*2*np.pi*220/16000)
  with wave.open(str(self.audio),'wb')as h:h.setnchannels(1);h.setsampwidth(2);h.setframerate(16000);h.writeframes((a*32767).astype('<i2').tobytes())
 def tearDown(self):self.temp.cleanup()
 def target(self,id,unit,zh,start,end,**extra):
  return {'id':id,'unit':unit,'level':3,'lesson':1,'sourceZH':zh,'sourcePinyin':'','sourceLessonFile':self.lesson.relative_to(ROOT).as_posix(),'sourceLessonSHA256':hashlib.sha256(self.lesson.read_bytes()).hexdigest(),'sourceTrack':self.audio.relative_to(ROOT).as_posix(),'sourceSHA256':hashlib.sha256(self.audio.read_bytes()).hexdigest(),'start':start,'end':end,'rawRange':[start,end],**extra}
 def execute(self,targets):
  input=self.base/'input.json';input.write_text(json.dumps({'schemaVersion':1,'targets':targets}));output=self.base/'output';module.run(ROOT,input,output);return json.loads((output/'candidates.json').read_text())['targets']
 def test_parent_and_single_sentence_alias_do_not_become_neighbors(self):
  targets=[self.target('parent','line','甲',.3,1.2,lineId='parent'),self.target('parent-sentence-1','sentence','甲',.3,1.2,lineId='parent',sentenceIndex=0,sentenceCount=1),self.target('next','sentence','乙',1.3,2.2)]
  result=self.execute(targets)
  for t in result[:2]:
   self.assertEqual(t['sourceSampleRange16k'],[4800,19200]);self.assertEqual(t['boundaryRefinementSourceGuards']['sourceNext']['id'],'next');self.assertFalse(t['boundaryRefinementStatus'].startswith('held'))
 def test_parent_contains_multiple_sentences_uses_external_neighbors(self):
  targets=[self.target('parent','line','甲。乙。',.3,2.2,lineId='parent'),self.target('parent-sentence-1','sentence','甲。',.3,1.2,lineId='parent',sentenceIndex=0,sentenceCount=2),self.target('parent-sentence-2','sentence','乙。',1.3,2.2,lineId='parent',sentenceIndex=1,sentenceCount=2),self.target('next','sentence','丙。',2.3,3.2)]
  result=self.execute(targets);parent=result[0];self.assertEqual(parent['boundaryRefinementSourceGuards']['sourceNext']['id'],'next');self.assertEqual(parent['sourceSampleRange16k'],[4800,35200]);self.assertFalse(any(t['boundaryRefinementStatus'].startswith('held')for t in result))
 def test_unsafe_asr_neighbor_anchor_remains_held(self):
  target=self.target('word','word','甲',.3,.98,rawEvidence={'followingWord':{'start':.99,'end':1.8,'word':'乙'}});result=self.execute([target])[0];self.assertEqual(result['sourceSampleRange16k'][1],15680);self.assertTrue(result['boundaryRefinementStatus'].startswith('held'));self.assertLessEqual(result['end'],.99)
 def test_extends_complete_source_tail_to_quiet_without_entering_neighbor(self):
  target=self.target('word','word','甲',.3,.98,rawEvidence={'followingWord':{'start':1.5,'end':2.,'word':'乙'}});result=self.execute([target])[0];self.assertGreaterEqual(result['end'],1.02);self.assertLess(result['end'],1.5);self.assertEqual(result['wordPronunciationRunCount'],1);self.assertFalse(result['productionApproved']);self.assertFalse(result['boundaryRefinementStatus'].startswith('held'))
if __name__=='__main__':unittest.main()
