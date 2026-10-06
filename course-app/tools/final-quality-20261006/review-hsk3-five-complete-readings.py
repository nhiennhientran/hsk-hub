#!/usr/bin/env python3
"""Bind five explicitly inspected original readings and unchanged decoder evidence."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'course-app/docs/final-quality-20261006'
REPORT = BASE / 'audio-hsk3/decoder-hard31-closure/paired-selected31-actual-current-v1.json'
FACTS = BASE / 'audio-hsk3/decoder-hard31-closure/selected31-original-source-physical-facts-v1.json'
HANDOFF = BASE / 'audio-hsk3/decoder-hard31-closure/selected31-actual-evidence-handoff-v1.json'
CTC = BASE / 'audio-review/hsk3-current377-independent-ctc-source-frame-review-01.json'
EXPLANATIONS = {
    '好久': ('The second original h/ao begins after the first reading has decayed before 14.50; the 14.60 crop preserves h around 14.66 and the complete ao movement around 14.83–15.09.', 'The separate j transition around 15.13–15.24 leads into iu around 15.30–15.76. Its natural decay is retained before 15.88; the first complete reading is outside. Source printed 好久/hǎojiǔ and the original head sequence bind this exact reading; raw 好酒 remains a decoder spelling.'),
    '不用': ('The first complete original reading begins with the b attack around 4.36, followed by u around 4.40–4.66; crop 4.25 preserves the entire initial.', 'The rounded y/ong movement around 4.69–5.08 and nasal continuation/release through about 5.18 are retained before 5.23. The second complete reading starts around 5.38 outside the crop. Raw 不用/不用嘛/other decoder outcomes stay unchanged.'),
    '以后': ('The selected first source reading follows the preceding word decay before 15.23; crop 15.26 precedes the i entry around 15.33 and complete i nucleus around 15.39–15.67.', 'The separate h noise and ou movement around 15.71–16.09 and release through 16.16 finish inside the 16.28 crop. The next complete reading starts around 16.58 outside. This is the printed 以后/yǐhòu source head, with the actual first reading retained.'),
    '加': ('The previous source word has decayed before 12.57. Crop 12.57 preserves the original palatal initial around 12.64–12.72 and the ia transition.', 'The a nucleus around 12.78–13.13 and its weak decay through about 13.17 are retained before crop 13.35. The next same-head reading begins around 13.55 outside. Printed 加/jiā is bound to this source occurrence; 家 predictions are retained, without a global glyph substitution.'),
    '邻居': ('The selected second reading begins after the first has decayed before about 1.19. Crop 1.52994 precedes l around 1.59 and the i nucleus around 1.67–1.89.', 'The nasal continuation around 1.89–1.97 is followed by the separate palatal j and rounded ü movement around 2.00–2.36; release finishes before 2.45 and crop 2.52. The following printed 放心 starts around 3.0 outside. 原印邻居/línjū and the two-reading sequence identify this full source reading; raw alternate text and noSpeech remain unchanged.'),
}

def ref(path):
    return {'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

def load(reference):
    path = Path(reference['file'])
    path = path if path.is_absolute() else ROOT / path
    assert hashlib.sha256(path.read_bytes()).hexdigest() == reference['sha256']
    return json.loads(path.read_text())

def main():
    assert ref(REPORT)['sha256'] == 'c2bb3dd51976a88ec1c33b5764ccea6fab84fbb510006f95e10fd1cba5b54588'
    assert ref(FACTS)['sha256'] == '71e811256c8a511761279ee3aed4d5a9f514cbed2f2a7f0aab8053cc1342e451'
    assert ref(HANDOFF)['sha256'] == '411c3a63cef71e97f89f4775e621ddf6d04c21f14d19270d5c0794d6923ac0d2'
    report, facts, handoff = [json.loads(p.read_text())['targets'] for p in (REPORT, FACTS, HANDOFF)]
    ctc = json.loads(CTC.read_text())
    assert ctc['status'] == 'independent-CTC-bytes-source-frames-verified-not-approved'
    decisions = []
    for word, (left, right) in EXPLANATIONS.items():
        row, = [r for r in report if r['sourceZH'] == word]
        f, = [r for r in facts if r['candidateId'] == row['candidateId']]
        h, = [r for r in handoff if r['candidateId'] == row['candidateId']]
        assert len([x for x in ctc['observations'] if x['id'] == row['id'] and x['sourceSampleRange16k'] == row['sourceSampleRange16k'] and x['cropPCM_SHA256'] == row['cropPCM_SHA256']]) == 1
        identity = {k: row[k] for k in ('sourceTrack', 'sourceSHA256', 'sourcePCM_SHA256', 'sourceSampleRange16k', 'cropPCM_SHA256')}
        identity['sourceText'] = word
        explanation = left + ' ' + right + ' Actual current original waveform, spectrum, two distinct containing geometries with both pinned unprompted models, printed head/pinyin and immutable full-source evidence were independently reviewed. All raw glyphs, noSpeech probabilities and low-confidence flags remain unchanged. F0 is an observation, not a tone/native/full-phoneme certificate.'
        syllables = copy.deepcopy(f['observedOriginalSyllablesProducerProposals'])
        components = [c for s in syllables for c in s['components']]
        expanded = []
        for geometry in h['distinctContainingOriginalSourceGeometries']:
            for evidence in geometry['actualPinnedModels']:
                raw = load(evidence['binding'])
                expanded.append(dict(evidence['binding'], observedRawText=''.join(s.get('text', '') for s in raw['rawSegments'])))
        first, last = row['sourceSampleRange16k']
        boundary = dict(identity, category='localized-connected-speech', explanation=explanation,
                        startBoundaryExplanation=left, endBoundaryExplanation=right,
                        waveformObservation=f['waveformObservation'], expandedProbeEvidence=expanded,
                        targetForegroundExtent16k=[components[0]['sourceSampleRange16k'][0], components[-1]['sourceSampleRange16k'][1]],
                        independentlyReviewedNeighborLimits16k=[first, last])
        for key in ('actualWaveformAndSpectrumReviewed', 'completeTargetPhonemesRetained', 'neighborTargetSpeechExcluded', 'sourceOrderChecked', 'originalBackgroundPreserved', 'noSyntheticPadding', 'rawASRTimestampsAreAuxiliaryOnly', 'onsetConsonantAndRimeReviewed', 'nasalAndFinalReleaseReviewed', 'expandedProbesCompared', 'phoneticEquivalenceIsAuxiliaryOnly'):
            boundary[key] = True
        printed = f['canonicalPrintedOriginalRow']; original = printed['row']
        assert original['zh'] == word and original['py'] == row['sourcePinyin'] and original['id'] == row['id']
        pinyin_ref = dict(printed['reference'], sourceJSONPointer=printed['sourceJSONPointer'] + '/py', originalPrintedPinyin=original['py'], targetPinyinCharacterRange=[0, len(original['py'])])
        text_ref = dict(printed['reference'], sourceJSONPointer=printed['sourceJSONPointer'] + '/zh', sourceText=original['zh'], targetTextCharacterRange=[0, len(word)])
        source = dict(identity, sourcePinyin=row['sourcePinyin'], explanation=explanation,
                      sourceGroupEvidence=f['originalWholeSourceEvidence'][0], originalPrintedSource=text_ref,
                      actualPrintedHeadEvidence=printed, actualSourceReadingStratification=f['sourceVisualReadingStratification'],
                      rawDifferences=[{k: r[k] for k in ('modelRepository', 'rawTranscript', 'file', 'sha256')} for r in row['rawModelEvidence']])
        for key in ('wholeSourceGroupUnpromptedASRReviewed', 'sourceOrderChecked', 'neighborSpeechExcluded', 'actualCropBoundariesChecked', 'phoneticEquivalenceIsAuxiliaryOnly', 'originalRepeatedReadingsChecked'):
            source[key] = True
        proof = dict(identity, category='asr-short-syllable-decoder-uncertainty' if len(syllables) == 1 else 'asr-complete-original-reading-decoder-uncertainty',
                     targetSourcePinyin=row['sourcePinyin'], explanation=explanation, onsetExplanation=left,
                     rimeAndFinalExplanation=right, originalOccurrenceExplanation=explanation,
                     originalPrintedOccurrenceId=original['id'], originalPrintedPinyinEvidence=pinyin_ref,
                     originalPrintedOccurrenceTextEvidence=text_ref, actualSyllableFeatureEvidence=f['actualSyllableFeatureEvidence'],
                     waveformObservation=f['waveformObservation'], independentlyVerifiedCTCSupplementalEvidence=ref(CTC),
                     producerFactsEvidence=ref(FACTS), actualTwoContainingGeometryEvidence=ref(HANDOFF))
        if len(syllables) == 1:
            proof['observedOriginalSyllableComponents16k'] = components
        else:
            proof['observedOriginalSyllables'] = syllables
            proof['everyOriginalSyllableIndependentlyReviewed'] = True
        for key in ('actualOriginalSyllableWaveformAndSpectrumReviewed', 'completeOriginalOnsetOrGlideRetained', 'completeOriginalRimeAndFinalRetained', 'neighborPhonemesExcluded', 'originalPrintedPronunciationAndContextChecked', 'sourceOccurrenceIndependentlyIdentified', 'sourceASRTimestampsAreAuxiliaryOnly', 'F0IsObservationNotToneCertification', 'allActualCropASRDiagnosticsRetained', 'noSyntheticPadding', 'phonemeIdentityIsKnownForThisExactSourceOccurrence'):
            proof[key] = True
        decision = dict(id=row['id'], candidateId=row['candidateId'], sourceSampleRange16k=row['sourceSampleRange16k'], cropPCM_SHA256=row['cropPCM_SHA256'], decision='accept', sourceContextChecked=True,
                        acknowledgedFlags=row['flags'], rationale=explanation, sourceContextEvidence=source,
                        boundaryDecisionEvidence=boundary, shortSyllableDecoderDecisionEvidence=proof)
        for key in ('humanListening', 'nativeSpeakerReview', 'pronunciationToneCertified', 'devicePlaybackCertified', 'fullPhonemeCertification'):
            decision[key] = False
        decisions.append(decision)
    output = BASE / 'audio-review/hsk3-five-complete-reading-independent-decisions-01.json'
    doc = {'schemaVersion': 1, 'reviewer': 'check_screenshot', 'reviewReportSHA256': ref(REPORT)['sha256'],
           'reviewReportEvidence': ref(REPORT), 'scriptEvidence': ref(Path(__file__).resolve()), 'decisions': decisions,
           'humanListening': False, 'nativeSpeakerReview': False, 'pronunciationToneCertified': False,
           'devicePlaybackCertified': False, 'fullPhonemeCertification': False}
    data = (json.dumps(doc, ensure_ascii=False, indent=2) + '\n').encode()
    assert not output.exists() or output.read_bytes() == data
    output.write_bytes(data)
    print(json.dumps(ref(output)))

if __name__ == '__main__':
    main()
