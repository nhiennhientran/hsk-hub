#!/usr/bin/env python3
"""One exact original recorded head; canonical j/q classification stays unclaimed."""
import json

PHYSICAL = {'file':'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-final4/ji-complete-original-variant-independent-physical-proposal-v1.json',
            'sha256':'95af09837d97b7769d48c5b8ba60282aa6f76b9e24d40dcf8ab0a263dea260a9'}
NOTICE = {'file':'course-app/docs/final-quality-20261006/audio-review/hsk3-ji-original-head-recording-note-proposal-01.json',
          'sha256':'3279178d427229a13939eab6a4b259caa0566f8fc0c8df58e786dcc5e92e8425'}
KEYS = ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')

def validate(row, decision, root, support):
    proof = decision['shortSyllableDecoderDecisionEvidence']
    variant = proof.get('fixedOriginalRecordedHeadVariantEvidence',{})
    if variant.get('category')!='fixed-complete-original-recorded-head-variant' or variant.get('originalPhysicalEvidence')!=PHYSICAL or variant.get('studentVisibleRecordingNoteEvidence')!=NOTICE:
        raise ValueError('recorded head variant needs its exact immutable source and student notice')
    data = json.loads(support.actual_file(root,PHYSICAL).read_text())
    target = data['targets'][0]
    if len(data['targets'])!=1 or any(row.get(k)!=target.get(k) for k in KEYS) or row['sourceZH']!='极' or row.get('sourcePinyin')!='jí' or row['unit']!='word':
        raise ValueError('this recording variant is scoped only to the fixed original 极 crop')
    if set(row['holds']) & support.DECODER_DIAGNOSTIC_HOLDS != {'crop-ASR-hallucination-or-no-speech-warning'}:
        raise ValueError('recording variant cannot clear another decoder diagnostic')
    if target.get('actualOriginalHeadCoreIsIdentified')is not True or proof.get('actualOriginalHeadCoreIsIdentified')is not True or proof.get('phonemeIdentityIsKnownForThisExactSourceOccurrence')is not False or proof.get('uniqueCanonicalOnsetClassificationCertified')is not False:
        raise ValueError('complete recorded head and unclassified canonical onset must remain separate')
    for key, original in [('observedOriginalSyllableComponents16k','originalHeadComponents16k'),('actualSyllableFeatureEvidence','actualSyllableFeatureEvidence'),('waveformObservation','waveformObservation')]:
        if proof.get(key)!=target[original]:
            raise ValueError('actual complete original components/PCM observations changed')
    if decision.get('boundaryDecisionEvidence')!=target['boundaryDecisionEvidence']:
        raise ValueError('this source variant requires its actual localized two-context neighbour evidence')
    ctc=proof.get('independentlyVerifiedCTCSupplementalEvidence')
    if not ctc:
        raise ValueError('the recorded head requires independent exact CTC byte/frame verification')
    checked=json.loads(support.actual_file(root,ctc).read_text())
    matches=[o for o in checked.get('observations',[]) if all(o.get(k)==row.get(k) for k in ('id','sourceSampleRange16k','cropPCM_SHA256'))]
    if len(matches)!=1 or matches[0].get('rawEvidence')!=target['independentActualCTCSourceFramesReviewed']['unalteredInference'] or matches[0].get('rawText')!='几':
        raise ValueError('the fixed recorded-head CTC result/body has changed')
    if any(variant.get(k)is not False for k in ('canonicalUniquePhoneClassificationCertified','globalHomophoneReplacementUsed','pronunciationToneCertified')):
        raise ValueError('recorded variant cannot certify classification or substitute phones')
    expected = target['actualPureUnalteredNativeEvidence']
    if len(row['rawModelEvidence'])!=2 or any({k:r.get(k) for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')} not in [{k:r.get(k) for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')} for r in expected] for r in row['rawModelEvidence']):
        raise ValueError('actual native decoder bodies must stay in the fixed raw whitelist')
    notice=json.loads(support.actual_file(root,NOTICE).read_text())
    entries=[n for n in notice['entries'] if all(n.get(k)==row.get(k) for k in KEYS)]
    if len(entries)!=1 or entries[0].get('recordingNote')!=target['recordingNote'] or not all(entries[0]['recordingNote'].get(k) for k in ('zh','vi')):
        raise ValueError('student source note is absent or bound to a different crop')
    support.boundary_decision(row,decision,root)
    return dict(variant,actualOriginalHeadCoreIsIdentified=True,canonicalUniquePhoneClassificationCertified=False,allOriginalDecoderDiagnosticsRetained=True,automaticProductionApproval=False)
