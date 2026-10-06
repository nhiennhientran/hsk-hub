#!/usr/bin/env python3
"""Two fixed original hao-wan-r utterance peer scopes, actual rime convergence."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 obsfile=OUT/'remaining22-actual-original-observation-index.json';obs={r['id']:r for r in json.loads(obsfile.read_text())['targets']}
 rimefile=OUT/'actual-original-unresolved-rime-LPC-scope-index.json';assert sha(rimefile)=='0b24d3e36538157359b5773c716d1a73ccc17ad60376903af9ca6274f2d2b01d'
 rime=next(r for r in json.loads(rimefile.read_text())['scopes']if r['id']=='textbook-l15-text-2-line-03')
 control=OUT/'actual-original-word-rime-source-controls.json';assert sha(control)=='c89f34d55f0a55b279ed56f255286e91922fefb5fbbd1660eac717614c239866'
 sp=importlib.util.spec_from_file_location('haowan_context_verifier',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 decisions=[];passed=[]
 for identifier in ('textbook-l15-text-2-line-03','textbook-l15-text-2-line-03-sentence-1'):
  r=rows[identifier];o=obs[identifier];explanation='独立实际原wán内韵wave/STFT及36ms窗LPC的16/18/22阶复读，主体11.730–11.766第三共振候选3537/3543/3593Hz向原尾11.974–12.010的2692/2703/2728收下；中带从890–908升至1973–2066，第三/中带间距显著由约2.6k收为约0.7k。实际原谱同样显示末部中/高带收拢，原periodic尾至12.05衰减，随后原pause至今年约12.58起音，韵尾未被cut掉。原词轨15-4好玩儿两读的真源窗也逐图查看，只作为可见内韵走势对照，不从印儿、词的源读序或未认证词control推出r；positive cue来自本current实际下降/上移的稳定共振及原STFT。先前粗谱无强cue的待查状态因真实细化测量得到本固定末韵正向cue，局限为本原utterance好玩儿收缩r韵兼容身份。完整前几年我去了西安和非常好玩末尾保留，child8.30–12.085的真实尾20ms已quiet；full8.29–15.11还保完整今年我也想去北京句尾。印source ZH/pinyin/15-3场景、前后turn与本轨唯一utterance逐源匹配；不以ASR词时间划phone。两crop以及whole好玩省儿预测原样保留，无全局补儿、无需模型原字儿literal。3阶共振候选均为descriptive原窗测量，与真实谱并读，不作自动r分类器或全部phoneme/tone/native/human证书。'+f" exactID={identifier}, cid={r['candidateId']}, frames={r['sourceSampleRange16k']}, cropSHA={r['cropPCM_SHA256']}，原geometry/source/raw不变。"
  p={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},'sourceText':r['sourceZH'],
   'sourcePinyin':r['sourcePinyin'],'canonicalPrintedSource':r['canonicalSource'],'sourceGroupEvidence':o['wholeSourceEvidence'][0],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,
   'phoneticEquivalenceIsAuxiliaryOnly':True,'actualOriginalObservationEvidence':{**ref(obsfile),'id':identifier},
   'actualCurrentCropSourceSpectrum':o['actualCurrentCropSourceSpectrum'],'actualOriginalWholeSourceSpectrum':o['completeOriginalSourcePlot'],
   'actualWaveformObservation':o['waveformObservation'],'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],
   'actualOriginalRimeMeasurementEvidence':ref(rimefile),'actualOriginalRimeScope':rime,'actualPrintedWordOriginalTwoReadScopeEvidence':ref(control),
   'descriptiveRimeConvergenceReview':{'originalVowelWindow16k':[187680,188256],'originalTailWindow16k':[191584,192160],
    'LPCOrdersIndependentlyCompared':[16,18,22],'higherResonanceCandidateHzVowel':[3593,3543,3537],
    'higherResonanceCandidateHzTail':[2692,2703,2728],'middleResonanceCandidateHzVowelRange':[890,908],
    'middleResonanceCandidateHzTailRange':[1973,2066],'actualOriginalSTFTConvergenceReviewed':True,'descriptiveResonanceNotAutomaticClassifier':True},
   'rawDifferences':[{'file':q['file'],'sha256':q['sha256'],'actualInference':q['actualInference'],'modelRepository':q['modelRepository'],
    'modelRevision':q['modelRevision'],'sourceText':r['sourceZH'],'observedRawText':q['rawTranscript'],'rawRetainedVerbatim':True,
    'decoderWarningsRetained':q['warningSegmentsRetained']}for q in o['actualCropModelEvidence']],
   'explanation':explanation,'fullPhonemeCertification':False}
  d={'id':identifier,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
   'decision':'accept','category':'fixed-original-contracted-rime-source-context','sourceContextChecked':True,'rationale':explanation,
   'sourceContextEvidence':p,'resolvedTextHolds':[h for h in r['holds']if h in v.TEXT_REVIEW_HOLDS],
   'retainedHolds':[h for h in r['holds']if h not in v.TEXT_REVIEW_HOLDS],'acknowledgedFlags':r['flags'],
   'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,
   'fullPhonemeCertification':False,'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,'productionApproved':False}
  v.contextual_decision(r,d,ROOT);decisions.append(d);passed.append({'id':identifier,'status':'passed'})
 output=OUT/'explicit-two-haowan-rime-peer-recommendations.json';output.write_text(json.dumps({'status':'explicit-independent-fixed-rime-utterance-scopes-awaiting-central-compile',
  'reviewer':'acceptance_scope_plan','reviewReportEvidence':ref(report),'observationEvidence':ref(obsfile),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'fixedPositiveRimeSourceContextScopes':2,'uniqueActualCrops':2},'authorityModified':False,
  'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 val=OUT/'read-only-two-haowan-rime-context-validation.json';val.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(output),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':passed,'passed':2,'authorityModified':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'recommendations':ref(output),'validation':ref(val)}))
if __name__=='__main__':main()
