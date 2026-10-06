#!/usr/bin/env python3
"""Real four source nuclei: exact short nucleus/run exceptions stay bounded."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path.cwd()
D = ROOT / 'course-app/docs/final-quality-20261006'
def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module
FIXED = load('review-fixed-nucleus-spectrum')
SUPPORT = load('review-decisions')

class FourOriginalNucleusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = {}
        for filename in ('hsk3-three-fixed-original-nucleus-independent-decisions-01.json', 'hsk2-yuan-fixed-original-nucleus-independent-decisions-01.json'):
            doc = json.loads((D / 'audio-review' / filename).read_text())
            rows = json.loads((ROOT / doc['reviewReportEvidence']['file']).read_text())['targets']
            for decision in doc['decisions']:
                row = next(r for r in rows if r['id'] == decision['id'] and r['sourceSampleRange16k'] == decision['sourceSampleRange16k'])
                proof = decision['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidence']
                cls.fixtures[row['sourceZH']] = (row, proof, [list(FIXED.scope(row))])
    def reject(self, fixture):
        with self.assertRaises(ValueError): FIXED.validate(*fixture[:2], ROOT, SUPPORT, fixture[2])
    def test_four_immutable_original_nuclei_reproduce(self):
        for fixture in self.fixtures.values():
            self.assertTrue(FIXED.validate(*fixture[:2], ROOT, SUPPORT, fixture[2])['originalVoicedProxyThresholdsUnchanged'])
    def test_biji_retains_creaky_gaps_and_selects_exact_contiguous_run(self):
        f = self.fixtures['笔记']; result = FIXED.validate(*f[:2], ROOT, SUPPORT, f[2])
        self.assertEqual(result['actualHarmonicWindows'], 2)
        self.assertGreater(result['allActualQualifyingHarmonicWindows'], 2)
        f = copy.deepcopy(f); f[1]['reviewedHarmonicSourceWindowStarts16k'] = [93440, 94080]; self.reject(f)
    def test_difang_true_90ms_nucleus_has_one_true_80ms_window(self):
        f = self.fixtures['地方']; result = FIXED.validate(*f[:2], ROOT, SUPPORT, f[2])
        self.assertEqual(f[2], [[195520, 196960]])
        self.assertEqual(result['actualHarmonicWindows'], 1)
        self.assertEqual(result['actualHarmonicNucleusSourceExtent16k'], [195520, 196800])
    def test_single_window_cannot_be_used_for_liwu(self):
        f = copy.deepcopy(self.fixtures['礼物']); f[1]['singleOriginal80msNucleusLimitedScope'] = True; self.reject(f)
    def test_adjacent_candidate_cannot_reuse_nucleus(self):
        f = copy.deepcopy(self.fixtures['地方']); f[0]['candidateId'] += '-adjacent'; self.reject(f)
    def test_one_frame_or_nasal_tail_cannot_replace_vowel(self):
        for changed in ([[195521, 196960]], [[196960, 198880]]):
            f = copy.deepcopy(self.fixtures['地方']); f[2][:] = changed; self.reject(f)
    def test_missing_complete_independent_source_reference_rejected(self):
        f = copy.deepcopy(self.fixtures['地方']); f[1].pop('independentlyReviewedSourcePhysicalEvidence'); self.reject(f)
    def test_single_window_scope_flag_required(self):
        f = copy.deepcopy(self.fixtures['地方']); f[1].pop('singleOriginal80msNucleusLimitedScope'); self.reject(f)
    def test_fabricated_harmonic_measurement_is_rejected(self):
        f = copy.deepcopy(self.fixtures['地方']); data = json.loads((ROOT / f[1]['actualSpectrumObservation']['file']).read_text())
        data['windows'][0]['actualThreeHarmonicObservations'][0][0]['frequencyHz'] += 1
        with tempfile.TemporaryDirectory(dir=D / 'audio-review') as temporary:
            path = Path(temporary) / 'altered-spectrum.json'; path.write_text(json.dumps(data))
            f[1]['actualSpectrumObservation'] = {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}; self.reject(f)

if __name__ == '__main__': unittest.main(verbosity=2)
