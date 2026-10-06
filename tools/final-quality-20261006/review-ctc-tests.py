#!/usr/bin/env python3
"""Actual CTC fixture coverage negatives; fail before expensive audio work."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('review_ctc',Path(__file__).with_name('review-ctc-evidence.py'))
review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/independent-sensevoice-evidence-index.json'


class CoverageNegatives(unittest.TestCase):
    def check_bad(self,kind):
        index=json.loads(BASE.read_text())
        with tempfile.TemporaryDirectory(dir=ROOT/'course-app/docs/final-quality-20261006/audio-review')as tmp:
            folder=Path(tmp)
            if kind.startswith('index'):
                if kind.endswith('missing'):index['targets'].pop()
                else:index['targets'].append(copy.deepcopy(index['targets'][0]))
            else:
                run=json.loads((ROOT/index['runFile']).read_text())
                if kind.endswith('missing'):run['completedCrops'].pop()
                else:run['completedCrops'].append(copy.deepcopy(run['completedCrops'][0]))
                rp=folder/'modified-run.json';rp.write_text(json.dumps(run))
                index['runFile']=str(rp.relative_to(ROOT));index['runSHA256']=hashlib.sha256(rp.read_bytes()).hexdigest()
            p=folder/'modified-index.json';p.write_text(json.dumps(index))
            with self.assertRaisesRegex(ValueError,'coverage/unique binding|every exact target key once'):
                review.verify(ROOT,p)
    def test_missing_index_target(self):self.check_bad('index-missing')
    def test_duplicated_index_target(self):self.check_bad('index-duplicate')
    def test_missing_binding(self):self.check_bad('binding-missing')
    def test_duplicated_binding(self):self.check_bad('binding-duplicate')


if __name__=='__main__':unittest.main()
