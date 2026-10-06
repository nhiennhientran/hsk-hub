#!/usr/bin/env python3
"""Preserved zero-width decoder words and complete original source utterances."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-remaining-spoken-hard15'
REPORT=BASE/'audio-review/hsk3-paired-full-03.json';OBS=OUT/'hard15-independent-actual-source-observations.json';CTC=OUT/'hard15-actual-CTC-independent-source-frame-verification.json'
FINE=OUT/'hard15-localized-original-source-phase-evidence.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mod(n,p):s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def frames(v):return [round(x*16000)for x in v]if v is not None else None
SCOPES={
 'l02:text4:line4':{'core':(34.32,42.075),'previous':(32.43,33.55),'following':None,'limits':(33.60,42.25),
  'onset':'原有时候弱y起/周期声约34.38秒，在cut34.22秒后完整；前高兴了末声体在33.55秒以前已结束，当前开首没有借邻句。',
  'final':'原有时候约34.38–34.88秒、妈妈只做几个简单的菜约35.3–37.0秒、我也非常爱吃约37.54–38.64秒、因为什么都没有妈妈做的饭好吃约39.44–42.04秒，各真实停顿与末吃的高频/韵尾保留；42.11秒cut的可用4窗strictquiet。局部妈妈原低带鼻音过渡/两a周期声相位约35.30–35.59秒齐全，末没有妈妈再次原读完整，不是妈被裁掉。',
  'reading':'本2-7完整原轨末印刷行。medium seg0 word2妈的start=end.74原概率.9960458874702454不改；绝对source34.96落在有时候结束后的自然pause，真实妈妈鼻/元音声群在35.3以后，small两妈各正时间、whole与actualCTC完整妈妈仅辅助。zero仅是模型词发射时间不成立，完整source utterance core不为零，后方只有真实原轨末quiet，没有下一朗读句；不造逐phone精确对齐或声调证明。'},
 'l11:text4:line1:sentence1':{'core':(.98,3.855),'previous':None,'following':(4.88,14.20),'limits':(0,4.80),
  'onset':'原前的q摩擦/释放从约1.03秒、周期约1.1秒起，cut.48秒在真实领先quiet；前几天全声群保留至1.7秒，原轨首发言之前没有另一发言。',
  'final':'上海在原2.03–2.28秒有完整sh高频摩擦、ang周期/鼻收束，再海的h弱摩擦与ai周期约2.33–2.41秒；后同事来北京了的全部声体/鼻尾及弱了到3.83秒，3.98秒cut处4窗真quiet。原局部2.03–2.1高频与2.12–2.22强ang韵核明确存在，故没有因zero删上。',
  'reading':'11-7源首原行第1句，parent还含一起吃饭时等后句，那一句实际约4.9秒后另起，当前cut没有纳入。medium seg0 word3上的start=end1.82原概率.9853480458259583保留，绝对source2.30在上/海的原transition附近，不能从该点给上声核零长度；small上是1.56–1.72正长而当前真实sh-ang群完整。保两Whisper繁体原字/CTC简体原字和modeltimes，不拿书面上海替换真正音频；scope仅这一完整原utterance/邻排除，无tone/native/fullphoneme认证。'},
}
def main():
 assert sha(FINE)=='25e3442e3256c3144e9a7f1d21801b9043854ed786a8906cc04ce36c06b4cf54'
 obs={x['id']:x for x in json.loads(OBS.read_text())['targets']};rows={x['id']:x for x in json.loads(REPORT.read_text())['targets']};ctcs={x['id']:x for x in json.loads(CTC.read_text())['observations']}
 support=mod('two_zero_source',ROOT/'tools/final-quality-20261006/review-decisions.py');features=mod('two_zero_features',ROOT/'tools/final-quality-20261006/review-syllable-evidence.py');decisions=[]
 for tail,s in SCOPES.items():
  ident='hsk3-fltrp-2026:'+tail;r=rows[ident];o=obs[ident];c=ctcs[ident];a,b=r['sourceSampleRange16k'];pcm=support.original_pcm(ROOT,r)
  identity={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')};identity['sourceText']=r['sourceZH'];stem=tail.replace(':','-');bins=features.features(pcm,a,b)
  fp=OUT/(stem+'-actual-voiced-features.json');dump(fp,{**identity,'featureBins':bins,'featureBinsSHA256':features.feature_sha(bins),'method':'actual-original-PCM-normalized-autocorrelation-32ms-5ms-75-to-500Hz-energy-gated','pronunciationToneCertified':False,'fullPhonemeCertification':False})
  wp=OUT/(stem+'-actual-waveform-observation.json');dump(wp,{**identity,'sourceSampleCount16k':len(pcm)//4,'plots':[o['actualCurrentSourceCropPlot']],
    'wholeOriginalPlot':o['actualCompleteOriginalSourcePlot'],'localizedOriginalSourcePhases':ref(FINE),'newASR':False,'sourceModified':False})
  physical={**identity,'selectedCompleteOriginalReadingFrames16k':frames(s['core']),'independentlyReviewedNeighborLimits16k':frames(s['limits']),
    'completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,'sourceOrderChecked':True,'originalPrintedPronunciationChecked':True,
    'allASRWarningsRetained':True,'noSyntheticPadding':True,'phonemeIdentityUnknown':False,'explanation':s['onset']+s['final']+s['reading'],
    'onsetExplanation':s['onset'],'rimeAndFinalExplanation':s['final'],'originalReadingExplanation':s['reading'],
    'originalPrintedSource':{k:r['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},'waveformObservation':ref(wp),
    'actualSyllableFeatureEvidence':ref(fp),'actualOriginalObservationEvidence':ref(OBS),'actualFineSourcePhasesEvidence':ref(FINE),
    'independentlyVerifiedCTCSupplementalEvidence':ref(CTC),'sourceUtteranceEvidence':{'canonicalSourceId':r['canonicalSource']['sourceId'],
      'sentenceOrdinal':r['canonicalSource']['sentenceOrdinal'],'parentZH':r['canonicalSource']['parentZH'],'actualUtteranceFrames16k':frames(s['core']),
      'completeOriginalUtteranceIndependentlyReviewed':True,'previousActualSpeechFrames16k':frames(s['previous']),
      'followingActualSpeechFrames16k':frames(s['following']),'wholeSourceEvidence':[o['sourceGroupEvidence']]},
    'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],'humanListening':False,'nativeSpeakerReview':False,
    'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  marks=physical['selectedCompleteOriginalReadingFrames16k'];limits=physical['independentlyReviewedNeighborLimits16k'];assert 0<=limits[0]<=a<=marks[0]<marks[1]<=b<=limits[1]<=len(pcm)//4
  zeros=[];diagnostics=[]
  for e in r['rawModelEvidence']:
   raw=json.loads(support.actual_file(ROOT,e).read_text())
   for si,segment in enumerate(raw['rawSegments']):
    for wi,word in enumerate(segment.get('words',[])):
     if word['start']==word['end']:
      zeros.append({'modelRepository':e['modelRepository'],'segmentIndex':si,'wordIndex':wi,'word':word['word'],'start':word['start'],'end':word['end']})
      diagnostics.append({'bindingEvidence':{k:e[k]for k in ('file','sha256')},'modelRepository':e['modelRepository'],'modelRevision':e['modelRevision'],
        'rawSegmentIndex':si,'rawWordIndex':wi,'rawWordUnchanged':word,'auxiliaryAbsoluteSourcePositionSeconds':a/16000+word['start'],
        'rawTimestampNotPhonemeBoundary':True,'actualSourceFinePhaseEvidence':ref(FINE)})
  assert len(zeros)==1
  whitelist=[{k:e[k]for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')}for e in r['rawModelEvidence']]
  whitelist.append({**c['rawEvidence'],'modelRepository':'SenseVoiceSmall-int8','rawTranscript':c['rawText']})
  decisions.append({'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':[a,b],'cropPCM_SHA256':r['cropPCM_SHA256'],
    'status':'actual-complete-original-core-known-with-preserved-zero-emission-ready-for-central-exact-registration',
    'actualOriginalUtteranceSourcePhysicalEvidence':physical,'originalRawResultWhitelist':whitelist,
    'onlyAuthorizedZeroDecoderWordEmissions':zeros,'preservedDecoderDiagnosticEvidence':diagnostics,'originalHoldsUnchanged':r['holds'],
    'flagsUnchanged':r['flags'],'notProductionApproved':True})
 p=OUT/'two-zero-complete-original-utterance-physical-fixed-scope-proposals.json';dump(p,{'schemaVersion':1,'status':'actual-complete-original-core-known-not-authority',
   'reviewer':'acceptance_scope_plan','sourceReportEvidence':ref(REPORT),'sourceObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
   'decisions':decisions,'newASR':False,'sourceModified':False,'runtimeModified':False,'automaticApproval':False,
   'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
 print(json.dumps({'physicalProposals':ref(p),'targets':len(decisions)}))
if __name__=='__main__':main()
