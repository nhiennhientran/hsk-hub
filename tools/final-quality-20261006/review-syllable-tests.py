#!/usr/bin/env python3
"""Negative gates exercised against actual original arithmetic PCM/printed source.

The test fixture has deliberately no approved boundary decision. Component
labels below only exercise rejection structure; they do not approve phonemes.
"""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('syllable_gate',Path(__file__).with_name('review-syllable-evidence.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
support=gate.module()


class ActualSyllableNegativeGates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        p=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/numeric-yi-arithmetic-word-crops/candidates.json'
        cls.row=json.loads(p.read_text())['targets'][0]
        cls.row['holds']=['crop-ASR-hallucination-or-no-speech-warning']
        cls.row['sourceDecodedDuration']=len(support.original_pcm(ROOT,cls.row))/4/16000
        original=ROOT/'hsk1-app/content/source-activities/lesson-02.json'
        activity=json.loads(original.read_text())['activities'][17]
        py=activity['pinyin'];zh=activity['prompt']['zh']
        a=py.rfind('yī,');x=zh.index('一',zh.index('减'))
        cls.proof={k:cls.row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        cls.proof.update(sourceText='一',category='asr-short-syllable-decoder-uncertainty',targetSourcePinyin='yī',
            originalPrintedOccurrenceId=activity['id'],
            originalPrintedPinyinEvidence={'file':str(original),'sha256':support.digest(original),
                'sourceJSONPointer':'/activities/17/pinyin','originalPrintedPinyin':py,'targetPinyinCharacterRange':[a,a+2]},
            originalPrintedOccurrenceTextEvidence={'file':str(original),'sha256':support.digest(original),
                'sourceJSONPointer':'/activities/17/prompt/zh','sourceText':zh,'targetTextCharacterRange':[x,x+1]},
            observedOriginalSyllableComponents16k=[
                {'kind':'glide','sourceSampleRange16k':[48560,48800],'observationExplanation':'Structural rejection fixture only; unapproved component.'},
                {'kind':'nucleus','sourceSampleRange16k':[48800,52800],'observationExplanation':'Structural rejection fixture only; unapproved component.'}],
            explanation='Negative-test fixture. No approved source phoneme or final acceptance.',
            onsetExplanation='Unapproved fixture component, used only to test required gates.',
            rimeAndFinalExplanation='Unapproved fixture component, used only to test required gates.',
            originalOccurrenceExplanation='Actual printed 再减一 source and original 2-7 PCM are bound for negative tests.')
        for k in ('actualOriginalSyllableWaveformAndSpectrumReviewed','completeOriginalOnsetOrGlideRetained',
            'completeOriginalRimeAndFinalRetained','neighborPhonemesExcluded',
            'originalPrintedPronunciationAndContextChecked','sourceOccurrenceIndependentlyIdentified',
            'sourceASRTimestampsAreAuxiliaryOnly','F0IsObservationNotToneCertification',
            'allActualCropASRDiagnosticsRetained','noSyntheticPadding',
            'phonemeIdentityIsKnownForThisExactSourceOccurrence'):
            cls.proof[k]=True
        pcm=support.original_pcm(ROOT,cls.row);first,last=cls.row['sourceSampleRange16k']
        cls.bins=gate.features(pcm,first,last)

    def decision(self):
        return {'shortSyllableDecoderDecisionEvidence':copy.deepcopy(self.proof)}

    def test_unknown_complete_phoneme_cannot_pass(self):
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['phonemeIdentityIsKnownForThisExactSourceOccurrence']=False
        with self.assertRaisesRegex(ValueError,'complete explicit'):
            gate.validate(self.row,d,ROOT)

    def test_synthetic_padding_cannot_pass(self):
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['noSyntheticPadding']=False
        with self.assertRaisesRegex(ValueError,'complete explicit'):
            gate.validate(self.row,d,ROOT)

    def test_context_cannot_certify_native_or_tone_review(self):
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['pronunciationToneCertified']=True
        with self.assertRaisesRegex(ValueError,'unsupported certification'):
            gate.validate(self.row,d,ROOT)

    def test_changed_single_frame_cannot_reuse_exception(self):
        row=copy.deepcopy(self.row);row['sourceSampleRange16k'][0]+=1
        with self.assertRaisesRegex(ValueError,'identity'):
            gate.validate(row,self.decision(),ROOT)

    def test_yi_target_rejects_qi_actual_printed_pinyin_slice(self):
        d=self.decision();p=d['shortSyllableDecoderDecisionEvidence']['originalPrintedPinyinEvidence'];p['targetPinyinCharacterRange']=[0,2]
        with self.assertRaisesRegex(ValueError,'pinyin slice'):
            gate.validate(self.row,d,ROOT)

    def test_yi_target_rejects_yi_fourth_tone_claim(self):
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['targetSourcePinyin']='yì'
        with self.assertRaisesRegex(ValueError,'canonical target'):
            gate.validate(self.row,d,ROOT)

    def test_target_catalog_cannot_masquerade_as_original_printed_source(self):
        d=self.decision();p=d['shortSyllableDecoderDecisionEvidence'];f=ROOT/'hsk1-app/content/stage3-catalog.json'
        p['originalPrintedPinyinEvidence']={'file':str(f),'sha256':support.digest(f),'sourceJSONPointer':'/vocabulary/83/py','originalPrintedPinyin':'yī','targetPinyinCharacterRange':[0,2]}
        with self.assertRaisesRegex(ValueError,'same canonical source file'):
            gate.validate(self.row,d,ROOT)

    def test_original_printed_glyph_must_be_same_occurrence(self):
        d=self.decision();p=d['shortSyllableDecoderDecisionEvidence']['originalPrintedOccurrenceTextEvidence'];p['targetTextCharacterRange']=[0,1]
        with self.assertRaisesRegex(ValueError,'printed source character slice'):
            gate.validate(self.row,d,ROOT)

    def test_actual_declared_track_prevents_other_recording_reuse(self):
        row=copy.deepcopy(self.row);row['sourceTrack']='new-hsk1/hsk1/audio/2-9.mp3'
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['sourceTrack']=row['sourceTrack']
        with self.assertRaisesRegex(ValueError,'actual recording track'):
            gate.validate(row,d,ROOT)

    def test_lost_glide_cannot_be_replaced_by_voiced_vowel(self):
        d=self.decision();p=d['shortSyllableDecoderDecisionEvidence'];p['observedOriginalSyllableComponents16k']=p['observedOriginalSyllableComponents16k'][1:]
        with self.assertRaisesRegex(ValueError,'required onset/glide'):
            gate.validate(self.row,d,ROOT)

    def test_component_cannot_extend_past_actual_crop(self):
        d=self.decision();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllableComponents16k'][1]['sourceSampleRange16k'][1]=self.row['sourceSampleRange16k'][1]+1
        with self.assertRaisesRegex(ValueError,'component geometry'):
            gate.validate(self.row,d,ROOT)

    def test_feature_bytes_cannot_be_fabricated_from_context(self):
        with tempfile.TemporaryDirectory()as folder:
            observed={k:self.row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
            bins=copy.deepcopy(self.bins);bins[0]['rmsDbFS']+=1
            observed.update(sourceText='一',method=gate.METHOD,sampleRate=16000,featureBins=bins,featureBinsSHA256=gate.feature_sha(bins))
            f=Path(folder)/'feature.json';f.write_text(json.dumps(observed))
            d=self.decision();d['shortSyllableDecoderDecisionEvidence']['actualSyllableFeatureEvidence']={'file':str(f),'sha256':support.digest(f)}
            with self.assertRaisesRegex(ValueError,'actual original PCM'):
                gate.validate(self.row,d,ROOT)

    def test_actual_low_energy_original_pause_is_not_voiced_nucleus(self):
        pcm=support.original_pcm(ROOT,self.row)
        pause=gate.features(pcm,56000,57600)
        self.assertFalse(any(b['voicedObservation']for b in pause))

    def test_actual_features_are_reproducible_without_approval(self):
        pcm=support.original_pcm(ROOT,self.row);a,b=self.row['sourceSampleRange16k']
        self.assertEqual(self.bins,gate.features(pcm,a,b))
        self.assertTrue(any(x['voicedObservation']for x in self.bins))
        self.assertTrue(all(x['estimatedF0Hz']is None or 75<=x['estimatedF0Hz']<=500 for x in self.bins))

    def multi_fixture(self):
        data=json.loads((ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/first-small-mismatch-second-reading-input.json').read_text())
        row=next(r for r in data['targets']if r['sourceZH']=='分钟')
        row['holds']=['crop-ASR-hallucination-or-no-speech-warning']
        proof=copy.deepcopy(self.proof)
        for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256'):proof[k]=row[k]
        file=ROOT/row['sourceLessonFile'];source=json.loads(file.read_text());obj=gate.pointer(source,row['sourceJSONPointer'].rpartition('/')[0])
        proof.update(sourceText='分钟',category='asr-complete-original-reading-decoder-uncertainty',
            targetSourcePinyin=obj['py'],originalPrintedOccurrenceId=obj['id'],
            originalPrintedPinyinEvidence={'file':str(file),'sha256':support.digest(file),'sourceJSONPointer':row['sourceJSONPointer'].rpartition('/')[0]+'/py','originalPrintedPinyin':obj['py'],'targetPinyinCharacterRange':[0,len(obj['py'])]},
            originalPrintedOccurrenceTextEvidence={'file':str(file),'sha256':support.digest(file),'sourceJSONPointer':row['sourceJSONPointer'],'sourceText':'分钟','targetTextCharacterRange':[0,2]},
            everyOriginalSyllableIndependentlyReviewed=True,
            observedOriginalSyllables=[
                {'sourcePinyinSegment':'fēn','sourcePinyinCharacterRange':[0,3],'components':[
                    {'kind':'onset','sourceSampleRange16k':[414560,414800],'observationExplanation':'Unapproved negative fixture.'},
                    {'kind':'nucleus','sourceSampleRange16k':[414800,418000],'observationExplanation':'Unapproved negative fixture.'},
                    {'kind':'coda','sourceSampleRange16k':[418000,418800],'observationExplanation':'Unapproved negative fixture.'}]},
                {'sourcePinyinSegment':'zhōng','sourcePinyinCharacterRange':[3,8],'components':[
                    {'kind':'onset','sourceSampleRange16k':[421000,421200],'observationExplanation':'Unapproved negative fixture.'},
                    {'kind':'nucleus','sourceSampleRange16k':[421200,430000],'observationExplanation':'Unapproved negative fixture.'},
                    {'kind':'coda','sourceSampleRange16k':[430000,431000],'observationExplanation':'Unapproved negative fixture.'}]}])
        return row,{'shortSyllableDecoderDecisionEvidence':proof}

    def test_multisyllable_cannot_use_single_syllable_category(self):
        row,d=self.multi_fixture();d['shortSyllableDecoderDecisionEvidence']['category']='asr-short-syllable-decoder-uncertainty'
        with self.assertRaisesRegex(ValueError,'multi-syllable word'):gate.validate(row,d,ROOT)

    def test_multisyllable_cannot_omit_second_source_syllable(self):
        row,d=self.multi_fixture();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllables'].pop()
        with self.assertRaisesRegex(ValueError,'every original syllable'):gate.validate(row,d,ROOT)

    def test_multisyllable_source_pinyin_partition_must_be_exact(self):
        row,d=self.multi_fixture();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllables'][1]['sourcePinyinCharacterRange'][0]=4
        with self.assertRaisesRegex(ValueError,'cover actual canonical word'):gate.validate(row,d,ROOT)

    def test_multisyllable_cannot_omit_nasal_final(self):
        row,d=self.multi_fixture();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllables'][1]['components'].pop()
        with self.assertRaisesRegex(ValueError,'required onset/glide'):gate.validate(row,d,ROOT)

    def test_two_syllables_cannot_reuse_one_voiced_nucleus(self):
        row,d=self.multi_fixture();d['shortSyllableDecoderDecisionEvidence']['observedOriginalSyllables'][0]['components'][1]['sourceSampleRange16k'][1]=423000
        with self.assertRaisesRegex(ValueError,'reuse one voiced nucleus'):gate.validate(row,d,ROOT)


if __name__=='__main__':
    unittest.main(verbosity=2)
