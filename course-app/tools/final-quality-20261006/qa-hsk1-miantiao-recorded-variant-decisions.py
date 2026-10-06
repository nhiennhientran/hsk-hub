#!/usr/bin/env python3
"""Two fixed complete original recording scopes with explicit weaker-r annotation."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 obsfile=OUT/'remaining22-actual-original-observation-index.json';obs={r['id']:r for r in json.loads(obsfile.read_text())['targets']}
 rimefile=OUT/'actual-original-unresolved-rime-LPC-scope-index.json';control=OUT/'actual-original-word-rime-source-controls.json'
 assert sha(rimefile)=='0b24d3e36538157359b5773c716d1a73ccc17ad60376903af9ca6274f2d2b01d'
 assert sha(control)=='c89f34d55f0a55b279ed56f255286e91922fefb5fbbd1660eac717614c239866'
 rime=next(r for r in json.loads(rimefile.read_text())['scopes']if r['id']=='textbook-l05-text-2-line-04')
 word=next(r for r in json.loads(control.read_text())['scopes']if r['id']=='v-l05-lex-60f87a79fc-s1')
 sp=importlib.util.spec_from_file_location('recorded_variant_context_verifier',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 decisions=[];variants=[];results=[]
 for identifier in ('textbook-l05-text-2-line-04','textbook-l05-text-2-line-04-sentence-1'):
  r=rows[identifier];o=obs[identifier];variant=r['sourceZH'].replace('面条儿','面条')
  explanation='本固定实际原utterance完整我会做面条、饺子，也会做一些菜，父行还有星期天我也做饭；源book教材写面条儿/miàntiáor及完整parent py保持。真实原条主体7.360–7.396与末7.460–7.496的3阶LPC、32ms谱逐图读，较高共振候选3295–3346→3248–3301，另一高带3582–3619→3625–3677保持，当前tiao末periodic直到7.51，之后真实pause至饺子起音，不存在把儿化尾裁到clip外的情况。另原5-4面条儿词两读的真实尾带更显著下收，也已读，但词轨speaker/书印r都不单独认证本句r。所有current两crop及whole都保留面条省儿原字，此处不声称本句canonical-r声学已通过，而接受该固定源本来合法完整原音的recorded-pronunciation-variant scope：本段录音的儿化不明显。并非把任何儿字全局忽略或删去、不是合成/补音；额外可选儿化phoneme唯一/声调/native/人听认证不成为完整原音剪裁的条件。学生须明确看到教材标注面条儿（miàntiáor）与本段录音儿化不明显的差异，教材ZH/py/IDs/旧提交保留。当前full6.09–12.32及child5.76–10.14均原strictquiet切边，完整我起音、菜/饭末尾保留，原前后canonical句与实际whole/pause排除邻语。'+f" exactID={identifier}, cid={r['candidateId']}, frames={r['sourceSampleRange16k']}, cropSHA={r['cropPCM_SHA256']}，原source/crop/ASR不变。"
  variantproof={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
   'id':identifier,'candidateId':r['candidateId'],'canonicalPrintedZH':r['sourceZH'],'canonicalPrintedPinyin':r['sourcePinyin'],
   'canonicalPrintedSource':r['canonicalSource'],'recordedVariantTextForDisplay':variant,
   'recordedPronunciationDifference':'本段原录音的面条儿词尾未呈现清晰儿化，保留完整原条韵及原pause。',
   'studentVisibleAnnotationZH':'教材标注：面条儿（miàntiáor）；本段录音的儿化不明显。',
   'annotationSuggestedNotRuntimeModified':True,'acousticCanonicalRClaim':False,'rAbsenceAbsoluteNativeClaim':False,
   'scope':'complete-legal-original-utterance-recorded-pronunciation-variant; canonical-r-phoneme-completeness-not-claimed',
   'sourceOriginalCoreUtteranceComplete':True,'sourceSamplesAndCanonicalTextUnchanged':True,
   'actualOriginalRimeMeasurementEvidence':ref(rimefile),'actualOriginalRimeScope':rime,
   'actualOriginalPrintedWordTwoReadControlEvidence':ref(control),'wordControlScope':word,
   'wordControlNotPositiveCanonicalRReferenceCertification':True,
   'higherResonanceCandidatesHzVowel':[3346,3298,3295],'higherResonanceCandidatesHzTail':[3290,3301,3248],
   'anotherHigherBandCandidatesHzVowel':[3619,3582,3595],'anotherHigherBandCandidatesHzTail':[3632,3677,3625],
   'formantCandidatesDescriptiveNotAutomaticRhoticClassifier':True,'humanListening':False,'nativeSpeakerReview':False,
   'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  p={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},'sourceText':r['sourceZH'],
   'sourcePinyin':r['sourcePinyin'],'canonicalPrintedSource':r['canonicalSource'],'sourceGroupEvidence':o['wholeSourceEvidence'][0],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,
   'phoneticEquivalenceIsAuxiliaryOnly':True,'actualOriginalObservationEvidence':{**ref(obsfile),'id':identifier},
   'actualCurrentCropSourceSpectrum':o['actualCurrentCropSourceSpectrum'],'actualOriginalWholeSourceSpectrum':o['completeOriginalSourcePlot'],
   'actualWaveformObservation':o['waveformObservation'],'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],
   'recordedPronunciationVariantEvidence':variantproof,
   'rawDifferences':[{'file':q['file'],'sha256':q['sha256'],'actualInference':q['actualInference'],'modelRepository':q['modelRepository'],
    'modelRevision':q['modelRevision'],'sourceText':r['sourceZH'],'observedRawText':q['rawTranscript'],'rawRetainedVerbatim':True,
    'decoderWarningsRetained':q['warningSegmentsRetained']}for q in o['actualCropModelEvidence']],
   'explanation':explanation,'fullPhonemeCertification':False,'acousticCanonicalRClaim':False}
  d={'id':identifier,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
   'decision':'accept','category':'fixed-recorded-pronunciation-variant-context','sourceContextChecked':True,'rationale':explanation,
   'sourceContextEvidence':p,'recordedPronunciationVariantEvidence':variantproof,
   'resolvedTextHolds':[h for h in r['holds']if h in v.TEXT_REVIEW_HOLDS],'retainedHolds':[h for h in r['holds']if h not in v.TEXT_REVIEW_HOLDS],
   'acknowledgedFlags':r['flags'],'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
   'devicePlaybackCertified':False,'fullPhonemeCertification':False,'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,
   'productionApproved':False,'acousticCanonicalRClaim':False}
  v.contextual_decision(r,d,ROOT);decisions.append(d);variants.append(variantproof);results.append({'id':identifier,'status':'passed','acousticCanonicalRClaim':False})
 path=OUT/'explicit-two-miantiao-recorded-variant-peer-recommendations.json';path.write_text(json.dumps({'status':'explicit-independent-complete-recording-variant-scopes-awaiting-central-compile',
  'reviewer':'acceptance_scope_plan','reviewReportEvidence':ref(report),'observationEvidence':ref(obsfile),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'fixedCompleteOriginalRecordingVariantScopes':2,'uniqueActualCrops':2},'authorityModified':False,
  'runtimeModified':False,'acousticCanonicalRClaim':False,'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 overlay=OUT/'two-miantiao-student-visible-recording-variant-proposal.json';overlay.write_text(json.dumps({'status':'bound-explicit-annotation-proposal-not-runtime-change',
  'recommendationEvidence':ref(path),'variants':variants,'canonicalTextPinyinIdsUnchanged':True,'runtimeModified':False,'acousticCanonicalRClaim':False},ensure_ascii=False,indent=2)+'\n')
 val=OUT/'read-only-two-miantiao-recorded-variant-context-validation.json';val.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(path),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':results,'passed':2,'authorityModified':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'recommendations':ref(path),'annotationProposal':ref(overlay),'validation':ref(val)}))
if __name__=='__main__':main()
