#!/usr/bin/env python3
"""Actual fixed source nuclei and fail-closed identity/observation regressions."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path.cwd()
BASE = ROOT / 'course-app/docs/final-quality-20261006'

def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

FIXED = module('fixed_source_actual_nucleus_tests', 'review-fixed-nucleus-spectrum.py')
SUPPORT = module('fixed_source_decision_tests', 'review-decisions.py')

class ActualSourceNucleusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = []
        for filename in ('hsk1-three-fixed-original-nucleus-independent-decisions-01.json', 'hsk3-dictionary-fixed-original-nucleus-independent-decisions-01.json'):
            doc = json.loads((BASE / 'audio-review' / filename).read_text())
            rows = json.loads((ROOT / doc['reviewReportEvidence']['file']).read_text())['targets']
            for decision in doc['decisions']:
                row = next(x for x in rows if x['id'] == decision['id'] and x['sourceSampleRange16k'] == decision['sourceSampleRange16k'])
                proof = decision['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidence']
                cls.fixtures.append((row, proof, [list(FIXED.scope(row))]))

    def test_four_actual_original_source_nuclei(self):
        self.assertEqual(len(self.fixtures), 4)
        for row, proof, nuclei in self.fixtures:
            with self.subTest(id=row['id']):
                result = FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)
                self.assertGreaterEqual(result['actualHarmonicWindows'], 2)
                self.assertTrue(result['originalVoicedProxyThresholdsUnchanged'])

    def test_different_candidate_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        row['candidateId'] = '0' * 24
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_different_crop_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        row['cropPCM_SHA256'] = '0' * 64
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_different_nucleus_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        nuclei[0][0] += 1
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_unregistered_source_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        row['id'] = 'hsk3-fltrp-2026:l02:word14'
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_missing_independent_complete_source_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        proof.pop('independentlyReviewedSourcePhysicalEvidence')
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_unregistered_physical_reference_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        proof['independentlyReviewedSourcePhysicalEvidence']['sha256'] = '0' * 64
        with self.assertRaises(ValueError):
            FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

    def test_fake_measured_harmonics_rejected(self):
        row, proof, nuclei = copy.deepcopy(self.fixtures[0])
        original = ROOT / proof['actualSpectrumObservation']['file']
        data = json.loads(original.read_text())
        data['windows'][0]['actualThreeHarmonicObservations'][0][0]['frequencyHz'] += 1
        with tempfile.TemporaryDirectory(dir=BASE / 'audio-review') as temporary:
            path = Path(temporary) / 'changed-observation.json'
            path.write_text(json.dumps(data))
            proof['actualSpectrumObservation'] = {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            with self.assertRaises(ValueError):
                FIXED.validate(row, proof, ROOT, SUPPORT, nuclei)

if __name__ == '__main__':
    unittest.main()
