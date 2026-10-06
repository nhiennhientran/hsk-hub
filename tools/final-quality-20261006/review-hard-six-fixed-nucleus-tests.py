#!/usr/bin/env python3
"""Real original source nuclei: each fixed oral core belongs to one syllable."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path.cwd()
D = ROOT / 'course-app/docs/final-quality-20261006'
def module(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
SUPPORT = module('review-decisions')
SYLLABLE = module('review-syllable-evidence')
FIXED = module('review-hard-six-fixed-original-nuclei')

class ExactOriginalNucleiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        j = json.loads((D / 'audio-review/hsk3-hard-six-complete-original-independent-decisions-01.json').read_text())
        rows = json.loads((ROOT / j['reviewReportEvidence']['file']).read_text())['targets']
        cls.fixtures = [(next(r for r in rows if r['id'] == d['id'] and r['sourceSampleRange16k'] == d['sourceSampleRange16k']), d) for d in j['decisions']]
    def verify(self, fixture):
        return SYLLABLE.validate(*fixture, ROOT, SUPPORT)
    def reject(self, fixture):
        with self.assertRaises(ValueError): self.verify(fixture)
    def test_six_complete_original_readings_seven_distinct_nuclei(self):
        for f in self.fixtures:
            result = self.verify(f)
            self.assertTrue(result['allASRWarningsRetained'])
    def test_second_yi_keeps_full_nucleus_and_later_tail(self):
        f = self.fixtures[0]
        alt = f[1]['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable'][1]
        self.assertEqual(alt['completeObservedNucleusRange16k'], [138400,141280])
        self.assertEqual(alt['analysisNucleusRange16k'], [138400,140320])
        self.assertEqual(FIXED.validate(f[0], alt, ROOT, SUPPORT, [[138400,141280]], [3,5])['actualHarmonicWindows'], 3)
    def test_missing_second_syllable_proof_rejected(self):
        f = copy.deepcopy(self.fixtures[0]); f[1]['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable'].pop(); self.reject(f)
    def test_duplicate_first_nucleus_cannot_certify_second(self):
        f = copy.deepcopy(self.fixtures[0]); a = f[1]['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable']; a[1] = copy.deepcopy(a[0]); self.reject(f)
    def test_oral_analysis_cannot_move_into_nasal_or_other_source(self):
        f = copy.deepcopy(self.fixtures[-1]); a = f[1]['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable'][0]; a['analysisNucleusRange16k'] = [90080,91680]; self.reject(f)
        f = copy.deepcopy(self.fixtures[-1]); f[0]['candidateId'] += '-neighbor'; self.reject(f)
    def test_one_frame_source_change_rejected(self):
        f = copy.deepcopy(self.fixtures[1]); f[0]['sourceSampleRange16k'][0] += 1; self.reject(f)
    def test_singular_proof_cannot_override_separate_nuclei(self):
        f = copy.deepcopy(self.fixtures[0]); e = f[1]['shortSyllableDecoderDecisionEvidence']; e['fixedOriginalNucleusSpectrumEvidence'] = copy.deepcopy(e['fixedOriginalNucleusSpectrumEvidenceBySyllable'][0]); self.reject(f)
    def test_fake_spectrum_or_unknown_source_phoneme_rejected(self):
        f = copy.deepcopy(self.fixtures[0]); f[1]['shortSyllableDecoderDecisionEvidence']['fixedOriginalNucleusSpectrumEvidenceBySyllable'][0]['actualSpectrumObservation']['sha256'] = '0' * 64; self.reject(f)
        f = copy.deepcopy(self.fixtures[0]); f[1]['shortSyllableDecoderDecisionEvidence']['phonemeIdentityIsKnownForThisExactSourceOccurrence'] = False; self.reject(f)

if __name__ == '__main__': unittest.main(verbosity=2)
