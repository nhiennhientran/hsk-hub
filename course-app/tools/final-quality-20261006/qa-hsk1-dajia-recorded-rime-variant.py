#!/usr/bin/env python3
"""Two exact complete original final-utterance scopes with weak-r transparency."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 obsfile=OUT/'remaining22-actual-original-observation-index.json';obs={r['id']:r for r in json.loads(obsfile.read_text())['targets']}
 fine=OUT/'actual-original-dajia-point-weak-tail-fine.json';assert sha(fine)=='3b69b89ae24cd7e925f10092a8faacf8440315fc57f2cf30d14e56bce804d166'
 rime=OUT/'actual-original-unresolved-rime-LPC-scope-index.json';assert sha(rime)=='0b24d3e36538157359b5773c716d1a73ccc17ad60376903af9ca6274f2d2b01d'
 sp=importlib.util.spec_from_file_location('dajia_recorded_variant',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 decisions=[];proposals=[];results=[]
 for identifier in ('textbook-l15-text-1-line-04','textbook-l15-text-1-line-04-sentence-2'):
  r=rows[identifier];o=obs[identifier]
  explanation='逐一原15-1全轨/完整我爱吃中国菜也喜欢做、大家多吃点儿/child与末8ms细谱实际重读；点的原声母/前滑音、周期主体及弱末韵完整，最后语音/弱尾在原15.08前衰减，child15.16及parent15.228均在本来quiet中，不是将可选儿化尾切到clip外。实际原source文件EOF15.9749375/255599帧，parent243648帧只是cut end，不能伪称parent到文件edge或伪造不可用末窗口；原四边20ms真实RMS<-45且原source后留背景尾全部可查。末36ms3阶候选第三带约2579/2636/2641Hz，前短韵体的较高带宽大且弱，不声称r独立唯一认证；保留真实完整合法原core点/utterance身份，按fixed recorded-rime-variant scope学生明示本段儿化不明显、acousticCanonicalRClaim=false。small父行有儿预测概率0.1625及medium/child/whole省儿预测与所有warnings原样保存，不把弱literal儿作为r证书，不全局删儿、不补音/静音、不替原book点儿/完整sourcepy/IDs/旧作业。全句语义与原print/实际whole准确匹配core，没有数量、姓名、未读或邻语冲突；额外每个可选r/fulltone/native证书不是精切完整合法原声的用户要求。'+f" exactID={identifier}, cid={r['candidateId']}, frames={r['sourceSampleRange16k']}, cropSHA={r['cropPCM_SHA256']}，原audio bytes/geometry/raw不变。"
  variant={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
   'id':identifier,'candidateId':r['candidateId'],'canonicalPrintedZH':r['sourceZH'],'canonicalPrintedPinyin':r['sourcePinyin'],
   'canonicalPrintedSource':r['canonicalSource'],'recordedVariantTextForDisplay':r['sourceZH'].replace('点儿','点'),
   'recordedPronunciationDifference':'原core点完整，原点儿末韵儿化不明显；不声称独立r不存在或canonical-r已认证。',
   'studentVisibleAnnotationZH':'教材标注：点儿；本段录音的儿化不明显。',
   'actualOriginalFineSourceEvidence':ref(fine),'actualOriginalRimeMeasurementEvidence':ref(rime),
   'sourceOriginalCoreUtteranceComplete':True,'sourceSamplesAndCanonicalTextUnchanged':True,
   'actualOriginalSourceDecodedSampleCount16k':255599,'parentEndNotSourceEOF':True,
   'acousticCanonicalRClaim':False,'rAbsenceAbsoluteNativeClaim':False,
   'scope':'complete-legal-original-utterance-recorded-rime-variant; independent-canonical-r-certification-not-claimed',
   'annotationSuggestedNotRuntimeModified':True,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
   'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  p={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},'sourceText':r['sourceZH'],
   'sourcePinyin':r['sourcePinyin'],'canonicalPrintedSource':r['canonicalSource'],'sourceGroupEvidence':o['wholeSourceEvidence'][0],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,
   'phoneticEquivalenceIsAuxiliaryOnly':True,'actualOriginalObservationEvidence':{**ref(obsfile),'id':identifier},
   'actualCurrentCropSourceSpectrum':o['actualCurrentCropSourceSpectrum'],'actualOriginalWholeSourceSpectrum':o['completeOriginalSourcePlot'],
   'actualWaveformObservation':o['waveformObservation'],'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],
   'recordedPronunciationVariantEvidence':variant,
   'rawDifferences':[{'file':q['file'],'sha256':q['sha256'],'actualInference':q['actualInference'],'modelRepository':q['modelRepository'],
    'modelRevision':q['modelRevision'],'sourceText':r['sourceZH'],'observedRawText':q['rawTranscript'],'rawRetainedVerbatim':True,
    'decoderWarningsRetained':q['warningSegmentsRetained']}for q in o['actualCropModelEvidence']],
   'explanation':explanation,'fullPhonemeCertification':False,'acousticCanonicalRClaim':False}
  d={'id':identifier,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
   'decision':'accept','category':'fixed-recorded-rime-variant-context','sourceContextChecked':True,'rationale':explanation,
   'sourceContextEvidence':p,'recordedPronunciationVariantEvidence':variant,
   'resolvedTextHolds':[h for h in r['holds']if h in v.TEXT_REVIEW_HOLDS],'retainedHolds':[h for h in r['holds']if h not in v.TEXT_REVIEW_HOLDS],
   'acknowledgedFlags':r['flags'],'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
   'devicePlaybackCertified':False,'fullPhonemeCertification':False,'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,
   'productionApproved':False,'acousticCanonicalRClaim':False}
  v.contextual_decision(r,d,ROOT);decisions.append(d);proposals.append(variant);results.append({'id':identifier,'status':'passed','acousticCanonicalRClaim':False})
 path=OUT/'explicit-two-dajia-recorded-rime-variant-peer-recommendations.json';path.write_text(json.dumps({'status':'explicit-independent-complete-recording-rime-variant-scopes-awaiting-central-compile',
  'reviewer':'acceptance_scope_plan','reviewReportEvidence':ref(report),'observationEvidence':ref(obsfile),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'fixedCompleteOriginalRecordingRimeVariantScopes':2,'uniqueActualCrops':2},'authorityModified':False,'runtimeModified':False,
  'acousticCanonicalRClaim':False,'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 proposal=OUT/'two-dajia-student-visible-recording-rime-variant-proposal.json';proposal.write_text(json.dumps({'status':'bound-explicit-annotation-proposal-not-runtime-change',
  'recommendationEvidence':ref(path),'variants':proposals,'canonicalTextPinyinIdsUnchanged':True,'runtimeModified':False,'acousticCanonicalRClaim':False},ensure_ascii=False,indent=2)+'\n')
 val=OUT/'read-only-two-dajia-recorded-rime-context-validation.json';val.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(path),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':results,'passed':2,'authorityModified':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'recommendations':ref(path),'annotationProposal':ref(proposal),'validation':ref(val)}))
if __name__=='__main__':main()
