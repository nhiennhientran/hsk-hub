#!/usr/bin/env python3
"""Explicit six original utterance context scopes from actual nasal/rime panels."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 observation=OUT/'remaining22-actual-original-observation-index.json';obs={r['id']:r for r in json.loads(observation.read_text())['targets']}
 fine=OUT/'actual-original-stop-nasal-fine-measurements.json';contrast=OUT/'actual-original-spoken-contrast-measurements.json';rimes=OUT/'actual-original-unresolved-rime-LPC-scope-index.json'
 assert sha(observation)=='c9f479887890af2c94a6a721ae1df4407dd3295be6642beed60ddd9de5ef2cd5'
 assert sha(fine)=='0d0c828ff2a46f22a43480db8f57277a89a87fe0a53400081ed92e2f8d542b11'
 assert sha(contrast)=='427e75ec554049f174c1c948ad2ad4b832ddf6afa03c0925c43311832b2e7c57'
 assert sha(rimes)=='0b24d3e36538157359b5773c716d1a73ccc17ad60376903af9ca6274f2d2b01d'
 rime={r['id']:r for r in json.loads(rimes.read_text())['scopes']}
 configs={
 'textbook-l04-text-3-line-05':{
  'marks':[210240,229280], #13.14-14.33 broad complete utterance
  'category':'complete-original-nin-nu-coarticulated-utterance-context',
  'specificEvidence':{'actualNasalContrastMeasurementEvidence':ref(contrast),'actualNasalLPCMeasurementEvidence':ref(fine),
   'actualNasalOnsetSourceWindow16k':[210320,210720], #13.145-13.170
   'actualSharedNasalTransitionSourceScope16k':[212480,215040], #13.28-13.44
   'sameOriginalSceneControlIds':['textbook-l04-text-3-line-01','textbook-l04-text-3-line-03'],
   'sameOriginalSceneControlPrintedNinPinyin':['zhè shì nín ér zi ma？','nín érzi jǐ suì？'],
   'sameSourceControlNasalLPCWindow16k':[147040,147440], #9.190-9.215
   'ninNuCoarticulationUnassignedPerCharacterBoundary':True,'uniquePerCharacterPhonemeBoundaryCertification':False,
   'phoneticUtteranceSourceCompatibilityScope':True,'globalNiNinSubstitutionUsed':False},
  'explanation':'本固定原句音序nín nǚ ér duō dà的实际起鼻音在原13.145–13.170低带强、上高带弱，随后i元音高带开放；与同原轨同印刷说话人另外两个明白您原occurrence，特别9.190–9.215鼻起窗作actual raw FFT/LPC与wave/spectrum对照。本current13.28–13.44持续周期鼻性过渡连入下一nǚ，shared原段全部保留，不把nin末n和下一nu首n人为唯一拆给某字：nin-nü coarticulation unassigned per-character boundary。这里审完整原utterance身份及印nín-nǚ音序兼容，完整原共同鼻段不会因当前cut丢/删n；不是声调或每字独立音素唯一认证。原parentID/您/py与4-5原audioTrack逐源一致，女/ér及多大完整至原14.33，前他今年五岁、后她今年十二在原pause之外；四边20ms原quiet。crop small因女儿多大/medium你女儿多大及whole您女儿多大全部保留；模型字样与场景礼貌都只辅助，不全局你→您或因→您替换，不据字词选择nin，不宣称phone/tone/native/human certification。'},
 'textbook-l12-text-1-line-04':{
  'marks':[159680,202880], #9.98-12.68 broad actual utterance
  'category':'fixed-original-contracted-rime-source-context',
  'specificEvidence':{'actualOriginalRimeMeasurementEvidence':ref(rimes),'actualOriginalRimeScope':rime['textbook-l12-text-1-line-04'],
   'independentDescriptiveResonanceReview':{'originalVowelWindow16k':[164960,165536],'originalTailWindow16k':[166432,167008],
    'LPCOrdersIndependentlyCompared':[16,18,22],'higherResonanceCandidateHzVowel':[2983,3005,3016],
    'higherResonanceCandidateHzTail':[2510,2506,2453],'middleResonanceCandidateHzVowelRange':[1775,1826],
    'middleResonanceCandidateHzTailRange':[1967,1976], 'originalSTFTBandConvergenceAlsoReviewed':True,
    'resonanceCandidatesNotAutomaticRhoticOrToneClassifier':True}},
  'explanation':'逐一actual原全句、全源、内韵末wave/32ms STFT、36ms真实PCM窗3阶LPC实读：点的原10.310–10.346元音第三共振候选2983/3005/3016Hz，在10.402–10.438末韵下降到2510/2506/2453Hz；第二候选由1775–1826升至1967–1976，间距从约1.2k收拢至约0.5k。原谱相同第三带下收/中带趋近且周期尾完整在原10.44前，大的后声母在原10.51之后，目标韵末没有被切边截去。三阶拟合只作描述性原声候选，STFT真带与该固定点末收拢支持原diǎnr收缩儿化，不靠打印儿、whole省儿、一个LPC根或ASR文字当证书。后我觉得很冷的完整句尾至12.68在crop内，前后canonical turns与原pause核对；四20ms边原quiet。两crop和whole有点大都原样保留，字形缺儿预测不改成字面exact；源py Yǒudiǎnr dà, wǒ juéde hěn lěng.保持。只建议本原完整utterance/内韵sourceContext，不声称全音素/声调/native/人听认证，也不将所有省儿项批过。'},
 'textbook-l12-text-3-line-04':{
  'marks':[152000,221600], #9.50-13.85 broad actual utterance
  'category':'fixed-original-contracted-rime-source-context',
  'specificEvidence':{'actualOriginalRimeMeasurementEvidence':ref(rimes),'actualOriginalRimeScope':rime['textbook-l12-text-3-line-04'],
   'independentDescriptiveResonanceReview':{'originalVowelWindow16k':[176800,177376],'originalTailWindow16k':[177840,178416],
    'LPCOrdersIndependentlyCompared':[16,18,22],'higherResonanceCandidateHzVowel':[3058,3040,3039],
    'higherResonanceCandidateHzTail':[2068,2020,2022],'tailLowerResonanceCandidateHzRange':[700,722],
    'tailMiddleResonanceCandidateHzRange':[1530,1546], 'originalSTFTBandConvergenceAlsoReviewed':True,
    'resonanceCandidatesNotAutomaticRhoticOrToneClassifier':True}},
  'explanation':'逐一actual原全句、全源、内点末wave/32ms STFT、36ms真实PCM窗3阶LPC实读：原11.050–11.086点主体第三共振候选3039–3058Hz，在11.115–11.151原末韵收向2020–2068Hz；原末低/中带约700–722/1530–1546Hz稳定跨3阶，STFT第三带同样向下收并保留原周期韵尾。该下收末韵处于吃一点儿药的点/药之间，药后起音约11.31，当前crop两边9.43/13.90远离内韵，儿化尾不可能因cut截掉。print py原hǎo de， chī yì diǎn ér yào， jīn tiān xiū xí bàn tiān ba。保持原空格，不把它新增成另一个音节或静音补齐；本句点末实际收缩韵与原diǎnr表达兼容。三阶描述性候选及STFT真带一起审，不把单根、全轨省儿或书上儿单独当phone证书。后今天休息半天吧全尾至13.85在crop内，原前后turn/pause/四20msquiet核对。两crop及whole一点药原字仍留，不伪改ASR为儿literal；只建议本完整原utterance/实际内韵scope，不认证全phoneme/tone/native/human，不能泛批准其他未闭合r。'}}
 sp=importlib.util.spec_from_file_location('nasal_rime_context_verifier',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 decisions=[];results=[]
 for primary,cfg in configs.items():
  for identifier in (primary,primary+'-sentence-1'):
   r=rows[identifier];o=obs[identifier];explanation=cfg['explanation']+f" 本固定ID={identifier}, cid={r['candidateId']}, frames={r['sourceSampleRange16k']}, crop={r['cropPCM_SHA256']}，原geometry/source/raw不变。"
   p={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
    'sourceText':r['sourceZH'],'sourcePinyin':r['sourcePinyin'],'canonicalPrintedSource':r['canonicalSource'],
    'sourceGroupEvidence':o['wholeSourceEvidence'][0],'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,
    'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
    'actualOriginalObservationEvidence':{**ref(observation),'id':identifier},'actualCurrentCropSourceSpectrum':o['actualCurrentCropSourceSpectrum'],
    'actualOriginalWholeSourceSpectrum':o['completeOriginalSourcePlot'],'actualWaveformObservation':o['waveformObservation'],
    'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],'manuallyObservedForegroundEnvelope16k':cfg['marks'],
    'fixedNasalOrRimeSpecificEvidence':cfg['specificEvidence'],
    'rawDifferences':[{'file':q['file'],'sha256':q['sha256'],'actualInference':q['actualInference'],'modelRepository':q['modelRepository'],
     'modelRevision':q['modelRevision'],'sourceText':r['sourceZH'],'observedRawText':q['rawTranscript'],'rawRetainedVerbatim':True,
     'decoderWarningsRetained':q['warningSegmentsRetained']}for q in o['actualCropModelEvidence']],
    'explanation':explanation,'fullPhonemeCertification':False}
   d={'id':identifier,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
    'decision':'accept','category':cfg['category'],'sourceContextChecked':True,'rationale':explanation,'sourceContextEvidence':p,
    'resolvedTextHolds':[h for h in r['holds']if h in v.TEXT_REVIEW_HOLDS],'retainedHolds':[h for h in r['holds']if h not in v.TEXT_REVIEW_HOLDS],
    'acknowledgedFlags':r['flags'],'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
    'devicePlaybackCertified':False,'fullPhonemeCertification':False,'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,'productionApproved':False}
   v.contextual_decision(r,d,ROOT);decisions.append(d);results.append({'id':identifier,'status':'passed'})
 path=OUT/'explicit-six-spoken-nasal-rime-peer-recommendations.json';path.write_text(json.dumps({'status':'explicit-independent-fixed-utterance-scopes-awaiting-central-compile',
  'reviewer':'acceptance_scope_plan','reviewReportEvidence':ref(report),'observationEvidence':ref(observation),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'ninNuWholeUtteranceScopes':2,'fixedPositiveRimeSourceContextScopes':4,'uniqueActualCrops':3},
  'authorityModified':False,'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 val=OUT/'read-only-six-spoken-nasal-rime-context-validation.json';val.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(path),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':results,'passed':len(results),'authorityModified':False},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'recommendations':ref(path),'validation':ref(val)}))
if __name__=='__main__':main()
