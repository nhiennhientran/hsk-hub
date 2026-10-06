#!/usr/bin/env python3
"""Meaningful negative checks for explicit per-ID review exception gates."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('explicit_review_decisions', Path(__file__).with_name('review-decisions.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class DecisionGates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        observed_file = ROOT / 'course-app/docs/final-quality-20261006/audio-review/hsk1-background-14-3/boundary-observations.json'
        observed = json.loads(observed_file.read_text())
        c = next(t for t in json.loads((ROOT / 'course-app/docs/final-quality-20261006/audio-hsk1/final-input-candidates.json').read_text())['targets'] if t['id'] == 'textbook-l14-text-2-line-02')
        cls.row = {**c, 'sourceDecodedDuration': observed['sourceSampleCount16k'] / 16000}
        cls.proof = {k: cls.row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        cls.proof.update(sourceText=c['sourceZH'], category='continuous-original-background',
                         waveformObservation={'file':str(observed_file), 'sha256':gate.digest(observed_file)},
                         targetForegroundExtent16k=[123840,147840], independentlyReviewedNeighborLimits16k=[113280,157440],
                         actualWaveformAndSpectrumReviewed=True, completeTargetPhonemesRetained=True,
                         neighborTargetSpeechExcluded=True, sourceOrderChecked=True, originalBackgroundPreserved=True,
                         noSyntheticPadding=True, rawASRTimestampsAreAuxiliaryOnly=True,
                         continuousBackgroundDistinctFromTargetVoice=True,
                         explanation='Gate fixture: actual classroom background remains between foreground turns.',
                         startBoundaryExplanation='7.60 precedes next foreground onset, after previous foreground end.',
                         endBoundaryExplanation='9.55 follows foreground end, before the next target voice.')

    def test_actual_source_observation_fixture_passes_boundary_structure_only(self):
        # Calling this evidence gate does not compile acceptance or certify listening.
        self.assertEqual(gate.boundary_decision(self.row, {'boundaryDecisionEvidence':self.proof}, ROOT), self.proof)

    def test_exception_cannot_be_reused_for_changed_frames(self):
        row=copy.deepcopy(self.row); row['sourceSampleRange16k'][0]+=1
        with self.assertRaisesRegex(ValueError, 'identity'):
            gate.boundary_decision(row, {'boundaryDecisionEvidence':self.proof}, ROOT)

    def test_source_waveform_bytes_must_match_pin(self):
        proof=copy.deepcopy(self.proof); proof['waveformObservation']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError, 'actual bytes'):
            gate.boundary_decision(self.row, {'boundaryDecisionEvidence':proof}, ROOT)

    def test_cut_cannot_cross_independent_neighbor_limit(self):
        proof=copy.deepcopy(self.proof); proof['independentlyReviewedNeighborLimits16k'][1]=150000
        with self.assertRaisesRegex(ValueError, 'bounds'):
            gate.boundary_decision(self.row, {'boundaryDecisionEvidence':proof}, ROOT)

    def test_actual_pause_pcm_sha_is_recomputed(self):
        with tempfile.TemporaryDirectory() as folder:
            proof=copy.deepcopy(self.proof)
            observed=json.loads(Path(proof['waveformObservation']['file']).read_text())
            observed['backgroundReferenceWindows'][0]['actualPCM_SHA256']='0'*64
            fn=Path(folder)/'observations.json'; fn.write_text(json.dumps(observed))
            proof['waveformObservation']={'file':str(fn),'sha256':gate.digest(fn)}
            with self.assertRaisesRegex(ValueError, 'actual original pause PCM'):
                gate.boundary_decision(self.row, {'boundaryDecisionEvidence':proof}, ROOT)

    def test_connected_boundary_requires_paired_expanded_probes(self):
        proof=copy.deepcopy(self.proof); proof['category']='localized-connected-speech'
        for key in ('onsetConsonantAndRimeReviewed','nasalAndFinalReleaseReviewed','expandedProbesCompared','phoneticEquivalenceIsAuxiliaryOnly'):
            proof[key]=True
        with self.assertRaisesRegex(ValueError, 'two expanded geometries'):
            gate.boundary_decision(self.row, {'boundaryDecisionEvidence':proof}, ROOT)

    def test_synthetic_quiet_padding_is_not_an_exception(self):
        proof=copy.deepcopy(self.proof); proof['noSyntheticPadding']=False
        with self.assertRaisesRegex(ValueError, 'noSyntheticPadding'):
            gate.boundary_decision(self.row, {'boundaryDecisionEvidence':proof}, ROOT)


if __name__=='__main__':
    unittest.main(verbosity=2)
