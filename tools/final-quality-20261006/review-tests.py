#!/usr/bin/env python3
"""Meaningful negative probes for independent crop identity and evidence gates."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from array import array

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location('crop_review', HERE / 'review-crops.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
EVIDENCE = ROOT / 'course-app/docs/resume-20261004/media-closure/asr-evidence'


class ReviewChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        recipe = review.read(EVIDENCE / 'padded-crop-review-input.json')
        cls.candidate = next(x for x in recipe['candidates'] if x['unit'] == 'word')
        cls.candidate = dict(cls.candidate, sourceZH='颜色')
        cls.rawpath = next(p for p in (EVIDENCE / 'crop-run-37219656715/small/crops').glob('*.json')
                           if review.read(p).get('candidateId') == cls.candidate['id'])
        cls.raw = review.read(cls.rawpath)

    def inspect(self, raw=None, candidate=None):
        c = candidate or self.candidate
        return review.inspect_raw(raw or self.raw, c, self.candidate['cropPCM_SHA256'],
                                  self.raw['cropDurationSeconds'], self.rawpath)

    def test_actual_raw_identity_baseline(self):
        self.assertEqual(self.inspect()['holds'], [])

    def test_zero_time_high_confidence_is_held(self):
        r = copy.deepcopy(self.raw)
        r['rawSegments'][0]['words'][0].update(end=0, probability=.9999)
        x = self.inspect(r)
        self.assertIn('crop-ASR-zero-inverted-or-out-of-bounds-word', x['holds'])
        self.assertEqual(x['zeroDurationIndices'], [0])

    def test_wrong_crop_source_frames_and_pcm_are_held(self):
        for field, value, expected in [
            ('originalSourceSHA256', '0'*64, 'crop-ASR-source-SHA-mismatch'),
            ('sourceSampleRange16k', [1, 10], 'crop-ASR-source-frame-mismatch'),
            ('cropPCM_SHA256', '0'*64, 'crop-ASR-actual-PCM-mismatch'),
            ('candidateId', 'other-word', 'crop-ASR-candidate-ID-mismatch')]:
            with self.subTest(field=field):
                r = copy.deepcopy(self.raw)
                r[field] = value
                self.assertIn(expected, self.inspect(r)['holds'])

    def test_expected_text_prompt_is_held(self):
        r = copy.deepcopy(self.raw)
        r['options']['initial_prompt'] = '颜色'
        self.assertIn('crop-ASR-options-not-frozen-unprompted-policy', self.inspect(r)['holds'])
        r = copy.deepcopy(self.raw)
        r['rawTranscriptionInfo']['transcription_options']['initial_prompt'] = '颜色'
        self.assertIn('crop-ASR-actual-inference-metadata-contains-source-cue', self.inspect(r)['holds'])

    def test_neighbor_chinese_not_erased(self):
        r = copy.deepcopy(self.raw)
        r['rawSegments'][0]['text'] += '谢谢'
        self.assertIn('crop-ASR-Chinese-differs-from-source-needs-phonetic-or-glyph-review', self.inspect(r)['holds'])

    def test_Roman_source_unit_cannot_disappear_in_CJK_filter(self):
        c = dict(self.candidate, sourceZH='AI颜色')
        self.assertIn('crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven', self.inspect(candidate=c)['holds'])
        c = dict(self.candidate, sourceZH='40颜色')
        self.assertIn('crop-ASR-meaningful-Roman-or-numeric-source-unit-not-proven', self.inspect(candidate=c)['holds'])

    def test_low_probability_retained_without_fabricating_human_review(self):
        r = copy.deepcopy(self.raw)
        r['rawSegments'][0]['words'][0]['probability'] = .01
        x = self.inspect(r)
        self.assertTrue(x['lowProbabilityWords'])
        self.assertTrue(x['flags'])

    def test_canonical_chinese_mismatch_is_rejected(self):
        lesson = review.read(ROOT / self.candidate['sourceLessonFile'])
        wrong = dict(self.candidate, sourceZH='红色')
        with self.assertRaisesRegex(ValueError, 'canonical source'):
            review.source_binding(wrong, lesson)

    def test_actual_canonical_sentence_child_and_neighbors(self):
        recipe = review.read(EVIDENCE / 'padded-crop-review-input.json')
        c = copy.deepcopy(recipe['candidates'][2])
        c['sourceZH'] = '你们别客气，快坐吧！'
        wanted, context = review.source_binding(c, review.read(ROOT / c['sourceLessonFile']))
        self.assertEqual(wanted, c['sourceZH'])
        self.assertEqual(context['sentenceOrdinal'], 2)
        self.assertTrue(context['previousSentence'])

    def test_external_source_path_is_rejected(self):
        with self.assertRaises(ValueError):
            review.inside(ROOT, '../../outside.json')

    def test_one_transcript_does_not_hide_two_waveform_readings(self):
        # Two audible islands separated by 300 ms. This is an observable hold,
        # not a fabricated semantic/audio model assertion.
        pcm = array('f', [0.] * 1600 + [.1] * 4800 + [0.] * 4800 + [.1] * 4800 + [0.] * 1600)
        runs = review.word_runs(pcm.tobytes(), 16000)
        self.assertEqual(len(runs), 2)
        self.assertEqual(runs[0][0], 17600)

    def test_different_model_revision_is_not_approved_by_shape(self):
        r = copy.deepcopy(self.raw)
        r['modelRevision'] = 'f' * 40
        self.assertIn('crop-ASR-model-not-approved-immutable-snapshot', self.inspect(r)['holds'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
