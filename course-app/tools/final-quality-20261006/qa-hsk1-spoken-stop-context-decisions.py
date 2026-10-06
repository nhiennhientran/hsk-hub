#!/usr/bin/env python3
"""Explicit peer decisions for four H1 exact original spoken stop contrasts."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 observed=OUT/'remaining22-actual-original-observation-index.json';obs={r['id']:r for r in json.loads(observed.read_text())['targets']}
 contrast=OUT/'actual-original-spoken-contrast-measurements.json';fine=OUT/'actual-original-stop-nasal-fine-measurements.json';nasal=OUT/'actual-original-bian-and-ma-nasal-control.json'
 assert sha(observed)=='c9f479887890af2c94a6a721ae1df4407dd3295be6642beed60ddd9de5ef2cd5'
 assert sha(contrast)=='427e75ec554049f174c1c948ad2ad4b832ddf6afa03c0925c43311832b2e7c57'
 assert sha(fine)=='0d0c828ff2a46f22a43480db8f57277a89a87fe0a53400081ed92e2f8d542b11'
 assert sha(nasal)=='d70a9a03eab3349a36079ddb4bd1512f59b9b1f3124044efc1a6868021041421'
 sp=importlib.util.spec_from_file_location('stop_context_verifier',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 configurations={
  'textbook-l09-text-1-line-01':{
   'foreground':[round(.73*16000),round(3.10*16000)],'followingEarliest':round(3.82*16000),
   'contrasts':{
    'currentStopReleaseObservationRange16k':[24176,24304], #1.511-1.519
    'currentFirstPeriodicVowelObservationRange16k':[24304,24448], #1.519-1.528
    'currentVOTCompatibleObservedRangeMilliseconds':[0,17],
    'sameSceneSamePrintedSpeakerControlId':'textbook-l09-text-1-line-03',
    'controlPrintedText':'好！我们七点在电影院外边见，好吗？',
    'controlPrintedPinyin':'hǎo！ wǒ men qī diǎn zài diàn yǐng yuàn wài biān jiàn， hǎo ma？',
    'controlBStopReleaseObservationRange16k':[182256,182368], #11.391-11.398
    'controlFirstPeriodicVowelObservationRange16k':[182352,182464], #11.397-11.404
    'controlVOTCompatibleObservedRangeMilliseconds':[0,13],
    'independentMControlNasalObservationRange16k':[195088,196272], #12.193-12.267
    'controlMContinuousNasalObserved':True,'localIntervalsAreBroadDescriptiveObservationsNotExactPhonemeBoundaries':True},
   'explanation':'逐一重读本原轨实际整句、完整原轨、16ms与8ms细谱，原q擦音约1.24–1.315，前的周期主体约1.33–1.49，目标声母实际在1.511–1.519的短释放，之后1.519–1.528进入完整ian元音主体。此前whole-ASR把前/面定位偏早，不用其词时间作声母边界。实际短释放及高带突然开放与同印刷说话人、同原轨外边在11.391–11.398的b释放吻合；同人好吗的m在12.193–12.267保留连续低鼻带、随后直接入a，不出现目标短释放方式。目标入口完整且不处于crop切边，ian元音及鼻尾在1.6–1.74保留，完整电影院末尾及邻句隔离也实核。本固定原声的短双唇闭塞释放支持原biān，不能把全轨/两crop模型前面字样当实际miàn或把同义词直接替换。保留small原繁体前面、medium前面和whole原前面；同crop CTC前边仅辅助。此为实际源声母/完整单句身份scope，不认证声调、native、人听或全部音素。'},
  'textbook-l13-text-3-line-04':{
   'foreground':[round(12.63*16000),round(15.78*16000)],'followingEarliest':round(17.06*16000),
   'contrasts':{
    'currentStopReleaseObservationRange16k':[210416,210528], #13.151-13.158
    'currentFirstPeriodicVowelObservationRange16k':[210896,210960], #13.181-13.185
    'currentVOTCompatibleObservedRangeMilliseconds':[23,34],
    'sameSceneSamePrintedSpeakerControlId':'textbook-l13-text-3-line-06',
    'controlPrintedText':'请给我一杯茶吧。','controlPrintedPinyin':'Qǐng gěi wǒ yì bēi chá ba.',
    'controlGStopReleaseObservationRange16k':[348064,348128], #21.754-21.758
    'controlFirstPeriodicVowelObservationRange16k':[348544,348624], #21.784-21.789
    'controlVOTCompatibleObservedRangeMilliseconds':[26,35],
    'localIntervalsAreBroadDescriptiveObservationsNotExactPhonemeBoundaries':True},
   'explanation':'逐一重读本原轨实际完整四十个句、全源与8ms细谱；十末周期结束后13.12–13.15闭塞，13.151–13.158短释放，13.181–13.185进入连续周期e元音，真实VOT宽误差范围23–34ms。与同印刷说话人、同原轨请给我中gěi的21.754–21.758释放→21.784–21.789周期元音（26–35ms）作实际声学对照，两者都是短释放后直接进入原元音，不存在将kè所需长连续送气段裁掉或另置到crop外的情况。目标e元音与后太的入口至13.3、整个我要一半吧至15.78完整，切边12.53/15.82严格静音且邻turn排除。两个数字音节四、十的原周期/擦音仍保留；raw 40作为该固定四十音节的模型数字写法明确审，不将它删掉或通过泛转换。不靠数量上下文或CTC去猜g/k：实际短释放与同声g对照支持原gè。保留两crop raw40克以及source全轨small四十个、medium40克差异，同crop CTC四十个仅辅助，不改原书个为克。不认证声调、native、人听或全部音素。'}
 }
 decisions=[];validation=[]
 for primary,cfg in configurations.items():
  for identifier in (primary,primary+'-sentence-1'):
   row=rows[identifier];o=obs[identifier];c={k:row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
   explanation=cfg['explanation']+f" 此ID={identifier}，精确frames={row['sourceSampleRange16k']}；line/child同PCM别名分别钉ID，未重复计唯一裁片。原四边20ms RMS={o['actualFourEdgeRMSDbFS20ms']}，按既有-45dBFS，原ASR flags/holds保留于report。"
   source={**c,'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'canonicalPrintedSource':row['canonicalSource'],
    'sourceGroupEvidence':o['wholeSourceEvidence'][0], 'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,
    'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
    'rawDifferences':[{'file':q['file'],'sha256':q['sha256'],'actualInference':q['actualInference'], 'modelRepository':q['modelRepository'],
       'modelRevision':q['modelRevision'],'sourceText':row['sourceZH'],'observedRawText':q['rawTranscript'],'rawRetainedVerbatim':True,
       'decoderWarningsRetained':q['warningSegmentsRetained']}for q in o['actualCropModelEvidence']],
    'actualOriginalObservationEvidence':{**ref(observed),'id':identifier},'actualCurrentCropSourceSpectrum':o['actualCurrentCropSourceSpectrum'],
    'actualOriginalWholeSourceSpectrum':o['completeOriginalSourcePlot'],'actualWaveformObservation':o['waveformObservation'],
    'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],'manuallyObservedForegroundEnvelope16k':cfg['foreground'],
    'manuallyObservedFollowingTurnEarliestForeground16k':cfg['followingEarliest'],
    'actualStopContrastEvidence':{**cfg['contrasts'],'actualOriginalContrastMeasurementEvidence':ref(contrast),
      'actualOriginalFineMeasurementEvidence':ref(fine), 'actualOriginalBAndMControlEvidence':ref(nasal)if 'l09' in primary else None},
    'CTCEvidenceAuxiliaryOnly':o['actualCTCSupplementalEvidence'],'explanation':explanation,'fullPhonemeCertification':False}
   decision={'id':identifier,'sourceSampleRange16k':row['sourceSampleRange16k'],'cropPCM_SHA256':row['cropPCM_SHA256'],
    'decision':'accept','category':'independent-original-stop-contrast-source-context','sourceContextChecked':True,
    'rationale':explanation,'sourceContextEvidence':source,'resolvedTextHolds':[h for h in row['holds']if h in v.TEXT_REVIEW_HOLDS],
    'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'retainedHolds':[h for h in row['holds']if h not in v.TEXT_REVIEW_HOLDS],
    'acknowledgedFlags':row['flags'],'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
    'devicePlaybackCertified':False,'fullPhonemeCertification':False,'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,'productionApproved':False}
   v.contextual_decision(row,decision,ROOT);decisions.append(decision);validation.append({'id':identifier,'status':'passed'})
 result=OUT/'explicit-four-spoken-stop-contrast-peer-recommendations.json'
 result.write_text(json.dumps({'status':'explicit-independent-scoped-recommendations-awaiting-central-compile','reviewer':'acceptance_scope_plan',
  'reviewReportEvidence':ref(report),'originalObservationEvidence':ref(observed),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'acceptedRecommendations':4,'uniqueActualCrops':2},'authorityModified':False,
  'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 val=OUT/'read-only-four-spoken-stop-context-validation.json';val.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(result),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':validation,'passed':len(validation),'authorityModified':False},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'recommendations':ref(result),'validation':ref(val)},ensure_ascii=False))
if __name__=='__main__':main()
