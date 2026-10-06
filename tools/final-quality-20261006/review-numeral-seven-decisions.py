#!/usr/bin/env python3
"""Materialize seven explicitly reviewed original numeral source-frame decisions.

The fixed candidates below were separately inspected in the original waveform
and spectrum. This script assembles byte-pinned evidence; review-decisions.py
independently revalidates it before producing any accepted frame gates.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path.cwd()
BASE = Path('course-app/docs/final-quality-20261006')
REPORT = BASE / 'audio-review/hsk1-numeral13-paired-02.json'
PEER = BASE / 'audio-root-peer-numerals/explicit-independent-physical-recommendations.json'
FACTS_INDEX = BASE / 'audio-hsk1/numeral-original-syllable-evidence/producer-facts-index.json'
CTC_REPORTS = [BASE/'audio-review/independent-ctc-source-frame-review-01.json', BASE/'audio-review/numeric-nine-zero-source-order-repair-ctc-independent-ctc-01.json']
OUTPUT = BASE/'audio-review/hsk1-seven-numeral-independent-decisions-01.json'
FIXED = {
    '二': '4d343bee9b052aff4d3e9bc6', '三': '7d7ef4b874b05090ed7c477f',
    '四': '59975b1a408e50fcc8ba74af', '五': 'f1a238607472bff48ec5e2a4',
    '八': 'b9489c761232719c0dcfb8d1', '九': 'a5edc08fcd1c7edf05bc73a5',
    '两': '22776ee62fe691d89d1f2ebf',
}
EXPLANATIONS = {
    '二': ('The original er nucleus begins after the previous jin decay; the selected 17.63 start precedes the separate body near 17.66.', 'The continuous er nucleus and rhotic final through about 17.85 are retained before the following shi frication after the 17.855 cut.'),
    '三': ('The selected leading transition precedes the source s frication around 13.03–13.14. It is the original san in 苹果三块五一斤, not the preceding complete guo syllable.', 'The an nucleus and low nasal continuation through about 13.30 remain before the following kuai entry; the unchanged cut is 13.311.'),
    '四': ('The original leading pause is retained before the complete s frication around 1.73–1.90 in the printed tongue-twister 四是四，十是十.', 'The apical vowel and its release through about 2.13 precede the next shi frication. The actual end remains 2.14, without an invented ASR-token subdivision.'),
    '五': ('The previous xie-like body has decayed before 12.402; the independent u/glide phase starts near 12.423 inside this crop.', 'The complete original u vowel and declining final finish near 12.62, before the next kuai entry around 12.67. The 12.625 cut excludes that following syllable.'),
    '八': ('The preceding mi body is outside the selected 19.55 cut; the original b attack appears around 19.60.', 'The complete a movement and decay finish before about 19.82, followed by the original pause retained to 19.95. The next kan entry is after 20.18.'),
    '九': ('The printed occurrence is 九个小时 / jiǔ gè xiǎo shí. The selected 5.30 start precedes the original j frication/release around 5.36–5.45.', 'The complete iu vowel movement and declining final are before 5.745. The next ge attack is after about 5.76; the next source word is 个.'),
    '两': ('The previous wu-like body ends outside 12.347; the complete original l/glide entry and vowel begin after about 12.37.', 'The original ang/ng continuation decays through about 12.657. The following low-amplitude closure is retained to 12.674, before the dian release near 12.69; the nasal final is not removed.'),
}
NUCLEUS_SPECTRUM_REVIEWS = {}


def ref(path):
    path = Path(path)
    return {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def load(reference):
    path = Path(reference['file'])
    assert ref(path)['sha256'] == reference['sha256']
    return json.loads(path.read_text())


def main():
    spec = importlib.util.spec_from_file_location('decision_support', Path(__file__).with_name('review-decisions.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    report = json.loads(REPORT.read_text())
    peers = json.loads(PEER.read_text())['records']
    index = json.loads(FACTS_INDEX.read_text())
    ctc_reports = CTC_REPORTS
    decisions = []
    for glyph, cid in FIXED.items():
        row, = [x for x in report['targets'] if x['candidateId']==cid and x['sourceZH']==glyph]
        peer, = [x for x in peers if x['id']==row['id'] and x['sourceSampleRange16k']==row['sourceSampleRange16k']]
        m.actual_identity(row, dict(peer,sourceText=peer['sourceZH']), 'independent-numeral-physical-peer')
        spectrum_review = NUCLEUS_SPECTRUM_REVIEWS.get(cid)
        if spectrum_review:
            spectrum_spec=importlib.util.spec_from_file_location('fixed_nucleus_scope',Path(__file__).with_name('review-fixed-nucleus-spectrum.py'))
            spectrum_gate=importlib.util.module_from_spec(spectrum_spec);spectrum_spec.loader.exec_module(spectrum_gate)
            spectrum_gate.scope(row)
            assert peer['independentPhysicalRecommendation'] in ('recommend-complete-physical-reading-voicing-proxy-still-separate','physical-reading-observed-voicing-proxy-not-yet-approved')
        else:
            assert peer['independentPhysicalRecommendation'] in ('recommend-complete-original-physical-reading','recommend-complete-repaired-original-physical-reading','recommend-complete-repaired-source-reading')
        fref, = [x for x in index['targets'] if x['candidateId']==cid]
        f = load(fref)
        assert f['target']['sourceSampleRange16k']==row['sourceSampleRange16k'] and f['target']['cropPCM_SHA256']==row['cropPCM_SHA256']
        identity = {k:row[k] for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        identity['sourceText'] = glyph
        left, right = EXPLANATIONS[glyph]
        explanation = left+' '+right+' Original source, printed glyph/pinyin, two distinct containing probe geometries each decoded with both pinned unprompted models, and the actual source spectrum were reviewed together. All raw competing glyphs, empty results, zero timings and noSpeech warnings are retained; CTC text is supplemental evidence, not a phoneme or tone certificate.'
        ctc = []
        for p in ctc_reports:
            d = json.loads(p.read_text())
            matches = [x for x in d['observations'] if x['id']==row['id'] and x['sourceSampleRange16k']==row['sourceSampleRange16k'] and x['cropPCM_SHA256']==row['cropPCM_SHA256']]
            if matches: assert len(matches)==1; ctc.append(ref(p))
        assert len(ctc)==1
        expanded=[]
        for target in f['expandedGeometries']:
            for evidence in target['actualCropModelEvidence'].values():
                rawref={'file':evidence.get('rawFile')or evidence['file'],'sha256':evidence.get('rawSHA256')or evidence['sha256']}
                raw=load(rawref)
                expanded.append(dict(rawref,observedRawText=''.join(s.get('text','')for s in raw['rawSegments'])))
        components=[]
        for component in (spectrum_review['independentlyReviewedComponents16k'] if spectrum_review else f['componentGeometryProposals16k']):
            kind=component['kind'];components.append(dict(component,observationExplanation=(left if kind in ('onset','glide')else right if kind in ('coda','release')else 'The original voiced nucleus is the target vowel/rime between its independently located onset and final. '+explanation)))
        first,last=row['sourceSampleRange16k']
        boundary=dict(identity,category='localized-connected-speech',explanation=explanation,startBoundaryExplanation=left,endBoundaryExplanation=right,
            waveformObservation=f['waveformObservation'],targetForegroundExtent16k=[components[0]['sourceSampleRange16k'][0],components[-1]['sourceSampleRange16k'][1]],
            independentlyReviewedNeighborLimits16k=[first,last],expandedProbeEvidence=expanded,
            independentPhysicalPeerEvidence=ref(PEER))
        for key in ('actualWaveformAndSpectrumReviewed','completeTargetPhonemesRetained','neighborTargetSpeechExcluded','sourceOrderChecked','originalBackgroundPreserved','noSyntheticPadding','rawASRTimestampsAreAuxiliaryOnly','onsetConsonantAndRimeReviewed','nasalAndFinalReleaseReviewed','expandedProbesCompared','phoneticEquivalenceIsAuxiliaryOnly'): boundary[key]=True
        source=dict(identity,sourcePinyin=row['sourcePinyin'],explanation=explanation,
            rawDifferences=[{'modelRepository':x['modelRepository'],'rawTranscript':x['rawTranscript'],'evidence':{**ref(x['file'])}}for x in row['rawModelEvidence']],
            sourceGroupEvidence=f['originalFullTrackRawEvidenceRefs'][0],originalPrintedSource=f['originalPrintedOccurrenceTextEvidence'],independentPhysicalPeerEvidence=ref(PEER))
        for key in ('wholeSourceGroupUnpromptedASRReviewed','sourceOrderChecked','neighborSpeechExcluded','actualCropBoundariesChecked','phoneticEquivalenceIsAuxiliaryOnly','originalRepeatedReadingsChecked','originalPrintedSourceOccurrenceChecked','targetAndOriginalPronunciationCompared','telephoneYaoNotSubstitutedForYi'): source[key]=True
        source_only = not (set(row['holds']) & m.DECODER_DIAGNOSTIC_HOLDS)
        proof=dict(identity,category='asr-original-syllable-source-context-review' if source_only else'asr-short-syllable-decoder-uncertainty',
            targetSourcePinyin=row['sourcePinyin'],explanation=explanation,onsetExplanation=left,rimeAndFinalExplanation=right,originalOccurrenceExplanation=peer['explanation'],
            originalPrintedOccurrenceId=f['originalPrintedOccurrenceId'],originalPrintedPinyinEvidence=f['originalPrintedPinyinEvidence'],
            originalPrintedOccurrenceTextEvidence=f['originalPrintedOccurrenceTextEvidence'],observedOriginalSyllableComponents16k=components,
            actualSyllableFeatureEvidence=f['actualSyllableFeatureEvidence'],waveformObservation=f['waveformObservation'],
            independentlyVerifiedCTCSupplementalEvidence=ctc[0],independentPhysicalPeerEvidence=ref(PEER),producerFactsEvidence=fref)
        for key in ('actualOriginalSyllableWaveformAndSpectrumReviewed','completeOriginalOnsetOrGlideRetained','completeOriginalRimeAndFinalRetained','neighborPhonemesExcluded','originalPrintedPronunciationAndContextChecked','sourceOccurrenceIndependentlyIdentified','sourceASRTimestampsAreAuxiliaryOnly','F0IsObservationNotToneCertification','allActualCropASRDiagnosticsRetained','noSyntheticPadding','phonemeIdentityIsKnownForThisExactSourceOccurrence'):proof[key]=True
        if spectrum_review:
            proof['supersededProducerComponentProposal16k']=f['componentGeometryProposals16k']
            alternative=dict(identity,category='fixed-ID-original-nucleus-spectrum-proxy-review',actualSpectrumObservation=spectrum_review['actualSpectrumObservation'],explanation=spectrum_review['explanation'])
            for key in ('nucleusPhaseIndependentlyReviewed','actualThreeHarmonicSourceSpectrumReviewed','F0GateAndOriginalBinsUnchanged','noToneOrPhonemeCertificationClaimed'):alternative[key]=True
            proof['fixedOriginalNucleusSpectrumEvidence']=alternative
        if glyph=='零':
            proof['printedNumeralCodeReadingEvidence']={'category':'printed-numeral-code-reading','literalPrintedPinyin':False,'literalPrintedTargetGlyph':False,'printedSymbol':'0','canonicalTargetZH':'零','canonicalTargetPinyin':'líng','telephoneCodeContextIndependentlyReviewed':True,'explanation':'The unchanged original phone number ends in printed 0; its source pinyin field also contains digits, not printed líng. Canonical 零/líng is separately bound to the independently reviewed l onset, i nucleus and ng final of this exact original final-code occurrence. No telephone yāo or invented printed Chinese pinyin is used.'}
        decision=dict(id=row['id'],candidateId=cid,sourceSampleRange16k=row['sourceSampleRange16k'],decision='accept',sourceContextChecked=True,rationale=explanation,
            acknowledgedFlags=row['flags'],resolvedTextHolds=sorted(set(row['holds'])&m.TEXT_REVIEW_HOLDS),resolvedSourceHolds=sorted(set(row['holds'])&m.SOURCE_REVIEW_HOLDS),
            resolvedBoundaryHolds=sorted(set(row['holds'])&m.BOUNDARY_REVIEW_HOLDS),resolvedDecoderASRDiagnosticHolds=sorted(set(row['holds'])&m.DECODER_DIAGNOSTIC_HOLDS),
            sourceContextEvidence=source,boundaryDecisionEvidence=boundary)
        decision['originalSyllableSourceContextEvidence' if source_only else'shortSyllableDecoderDecisionEvidence']=proof
        decisions.append(decision)
    output=OUTPUT
    output.write_text(json.dumps(dict(schemaVersion=1,reviewer='independent central audio reviewer',reviewReportFile=str(REPORT),reviewReportSHA256=ref(REPORT)['sha256'],independentPhysicalPeerEvidence=ref(PEER),decisions=decisions),ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'explicitDecisions':len(decisions),'output':str(output)}))


if __name__=='__main__':main()
