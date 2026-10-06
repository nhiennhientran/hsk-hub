#!/usr/bin/env python3
"""Two bounded original-source decisions with real spectral controls.

Original raw predictions, numbers and phonetic spelling are retained. This
does not change a central registry or certify native pronunciation or tones.
"""
import hashlib,importlib.util,json
from pathlib import Path
import numpy as np
from scipy.signal import welch
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-remaining-spoken-hard15'
REPORT=BASE/'audio-review/hsk3-paired-full-03.json';OBS=OUT/'hard15-independent-actual-source-observations.json';CTC=OUT/'hard15-actual-CTC-independent-source-frame-verification.json';FINE=OUT/'hard15-localized-original-source-phase-evidence.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mod(n,p):s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def frames(v):return [round(x*16000)for x in v]if v is not None else None
SCOPES={
 'l07:text2:line5':{'core':(14.28,16.805),'previous':(12.28,13.31),'following':(17.92,21.76),'limits':(13.35,17.80),
  'onset':'原裙的q高频起段约14.31秒与ün周期、子弱韵全部在14.08秒cut后；前贵多少末声群在13.31秒之前已结束。首句不是从数词峰开始裁，保裙子完整弱起。',
  'final':'第一价格在约14.80–14.94秒的s摩擦/舌尖元音、14.97–15.09秒的b释放/ai复韵、15.155–15.390秒的b释放/a周期形成原四百八三数词相位；原八的尾韵后15.400–15.760秒是真pause（实际RMS -51.32931dBFS），没有另一十的连续擦音/元音声群，然后短裤约15.78秒重新起声、四百末price声群完整衰减到16.78秒，16.83秒cut4窗真quiet。此范围认证完整原录音读法，不宣称原音完整读了打印bāshí。',
  'reading':'完整7-3原对话第五行，前贵多少、后裙子不比短裤贵多少分别在当前cut前和约17.9秒后界定原价格发言。原教材数字480与py sìbǎi bāshí保留；实际源四百八是价格口语省十的480表达，后短裤四百亦完整。本源C71/whole四百八及medium数字480、small数字48全保留，不能从48转换数字反推音素，也不要求假补一个十。采用exact完整合法原声省十变体并附学生中越说明，逐同源三数词声群/真pause和打印价格语境独立闭合；不是48元，不改原书拼音、答案或ID。'},
 'l07:text3:line1':{'core':(.68,3.90),'previous':None,'following':(5.12,7.51),'limits':(0,5.02),
  'onset':'原西的x高频起段约.72秒先于.82秒周期，原source .3999375秒cut在真实leadingquiet；西瓜又大又新鲜所有首分句声群完整至约2.38秒，第一印刷发言前没有另一句。',
  'final':'不甜不要钱完整第二声群约2.73–3.87秒。第一甜的t释放/弱送气相位2.850–2.925秒与末争议钱的完整持续高频fric3.534–3.622秒直接同说话人本句对照：末段4.5–7k占2–7k频段能量约.5568，第一甜仅.2283；末钱的较长强腭区fric后接高前/ian周期及鼻化尾3.64–3.86秒，符合完整qian而非只借相同ian元音猜字。cut3.9200625秒保留全尾且4窗quiet。',
  'reading':'完整7-5源首店员原发言，下一王一雪西瓜看起来不错怎么卖約5.12秒后另起，当前只一完整原句。另原第三行同店员五块钱一公斤的真实q钱fric控制9.240–9.326秒4.5–7k占比约.7078，与当前末q-fric同类强高频而区别首甜弱送气；打印第三行及实际whole source身份/PCM全部pin，不从模型钱字单独判phone。保small/CTC/whole甜与medium钱原结果；这次范围是canonical钱核心与整句完整性有实际同源对照支持，并不声称native/tone/F0逐音素认证或全局把甜改钱。'},
}
def band_fact(pcm_bytes,start,end,label):
 a,b=frames((start,end));signal=np.frombuffer(pcm_bytes[a*4:b*4],dtype='<f4')
 f,p=welch(signal,fs=16000,nperseg=256,noverlap=192,detrend='constant',scaling='spectrum')
 scope=(f>=2000)&(f<=7000);high=(f>=4500)&(f<=7000)
 return {'label':label,'actualSourceScopeFrames16k':[a,b],'actualSourceScopePCM_SHA256':hashlib.sha256(pcm_bytes[a*4:b*4]).hexdigest(),
  'actualRMSdBFS':round(float(20*np.log10(np.sqrt(np.mean(signal**2)))),6),
  'spectralCentroid2To7kHz':round(float(np.sum(f[scope]*p[scope])/np.sum(p[scope])),6),
  'energy4p5To7kFractionOf2To7k':round(float(p[high].sum()/p[scope].sum()),6)}
def main():
 assert sha(FINE)=='25e3442e3256c3144e9a7f1d21801b9043854ed786a8906cc04ce36c06b4cf54'
 rows={x['id']:x for x in json.loads(REPORT.read_text())['targets']};obs={x['id']:x for x in json.loads(OBS.read_text())['targets']};ctcs={x['id']:x for x in json.loads(CTC.read_text())['observations']}
 support=mod('hard15_differences_source',ROOT/'tools/final-quality-20261006/review-decisions.py');features=mod('hard15_differences_voiced',ROOT/'tools/final-quality-20261006/review-syllable-evidence.py')
 qi=rows['hsk3-fltrp-2026:l07:text3:line1'];qx=support.original_pcm(ROOT,qi)
 bands=[band_fact(qx,2.850,2.925,'same-utterance-first-tian-weak-release/aspiration-control'),
        band_fact(qx,3.534,3.622,'current-final-qian-continuous-frication'),
        band_fact(qx,9.240,9.326,'same-source-seller-wu-kuai-qian-voiced-word-control')]
 nr=rows['hsk3-fltrp-2026:l07:text2:line5'];nx=support.original_pcm(ROOT,nr);a,b=frames((15.400,15.760));p=np.frombuffer(nx[a*4:b*4],dtype='<f4')
 measured=OUT/'two-source-differences-actual-control-and-pause-facts.json'
 dump(measured,{'status':'actual-original-source-measurements-not-authority','sourceFineEvidence':ref(FINE),'scriptEvidence':ref(Path(__file__)),
   'fricationTargetIdentity':{k:qi[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
   'sameSourceFricationObservations':bands,'spectrumMethod':'Welch 16ms Hann windows / 4ms step, constant detrend for feature calculation only; original PCM unmodified',
   'sameOriginalPrintedControl':{k:qi['canonicalSource'][k]for k in ('file','sha256')}|{'sourceJSONPointer':'/texts/2/lines/2','zh':'五块钱一公斤。来，您先尝尝这块冰西瓜，甜极了！','py':'Wǔ kuài qián yì gōngjīn. Lái, nín xiān chángchang zhè kuài bīng xīguā, tián jí le!','speaker':'店员'},
   'numeralTargetIdentity':{k:nr[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
   'originalPauseAfterBa':{'actualSourceScopeFrames16k':[a,b],'actualSourceScopePCM_SHA256':hashlib.sha256(nx[a*4:b*4]).hexdigest(),
     'actualRMSdBFS':round(float(20*np.log10(np.sqrt(np.mean(p**2)))),6),'sourceWaveformSpectrumActuallyReviewed':True},
   'sourceSamplesUnmodified':True,'metricAloneIsNotPhonemeClassifier':True,'humanListening':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
 decisions=[]
 for tail,s in SCOPES.items():
  ident='hsk3-fltrp-2026:'+tail;r=rows[ident];o=obs[ident];c=ctcs[ident];a,b=r['sourceSampleRange16k'];pcm=support.original_pcm(ROOT,r)
  identity={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')};identity['sourceText']=r['sourceZH'];stem=tail.replace(':','-');bins=features.features(pcm,a,b)
  fp=OUT/(stem+'-actual-voiced-features.json');dump(fp,{**identity,'featureBins':bins,'featureBinsSHA256':features.feature_sha(bins),'method':'actual-original-PCM-normalized-autocorrelation-32ms-5ms-75-to-500Hz-energy-gated','fullPhonemeCertification':False,'pronunciationToneCertified':False})
  wp=OUT/(stem+'-actual-waveform-observation.json');dump(wp,{**identity,'sourceSampleCount16k':len(pcm)//4,'plots':[o['actualCurrentSourceCropPlot']],
    'wholeOriginalPlot':o['actualCompleteOriginalSourcePlot'],'actualFinePhaseEvidence':ref(FINE),'actualControlsEvidence':ref(measured),'sourceModified':False})
  explanation=s['onset']+s['final']+s['reading'];physical={**identity,'selectedCompleteOriginalReadingFrames16k':frames(s['core']),
    'independentlyReviewedNeighborLimits16k':frames(s['limits']),'completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,
    'sourceOrderChecked':True,'originalPrintedPronunciationChecked':True,'allASRWarningsRetained':True,'noSyntheticPadding':True,
    'phonemeIdentityUnknown':False,'explanation':explanation,'onsetExplanation':s['onset'],'rimeAndFinalExplanation':s['final'],'originalReadingExplanation':s['reading'],
    'originalPrintedSource':{k:r['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},'waveformObservation':ref(wp),'actualSyllableFeatureEvidence':ref(fp),
    'actualOriginalObservationEvidence':ref(OBS),'actualFineSourcePhasesEvidence':ref(FINE),'actualOriginalControlEvidence':ref(measured),
    'independentlyVerifiedCTCSupplementalEvidence':ref(CTC),'sourceUtteranceEvidence':{'canonicalSourceId':r['canonicalSource']['sourceId'],
      'sentenceOrdinal':r['canonicalSource']['sentenceOrdinal'],'parentZH':r['canonicalSource']['parentZH'],'actualUtteranceFrames16k':frames(s['core']),
      'completeOriginalUtteranceIndependentlyReviewed':True,'previousActualSpeechFrames16k':frames(s['previous']),
      'followingActualSpeechFrames16k':frames(s['following']),'wholeSourceEvidence':[o['sourceGroupEvidence']]},
    'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],'humanListening':False,'nativeSpeakerReview':False,
    'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  if ident==nr['id']:
   physical['originalRecordedNumeralVariantEvidence']={'category':'fixed-original-price-colloquial-tens-unit-omission',
     'actualOriginalRecordedZH':'裙子四百八，短裤四百。','canonicalWrittenFirstPrice':'480','printedSourcePinyinUnchanged':r['sourcePinyin'],
     'recordedFirstPriceComponents':[{'pinyin':'sì','actualSourceObservationFrames16k':frames((14.800,14.940))},
       {'pinyin':'bǎi','actualSourceObservationFrames16k':frames((14.970,15.090))},{'pinyin':'bā','actualSourceObservationFrames16k':frames((15.155,15.390))}],
     'actualPauseAfterBaEvidence':ref(measured),'allComponentsActuallyReviewedOnOriginalFineSpectrum':True,
     'colloquialFourHundredEightMeans480InThisPriceContext':True,'canonicalFullBashiPronunciationClaim':False,
     'noSyntheticShiAdded':True,'noDigitPredictionUsedAsPhoneEvidence':True,'studentRecordingNoteRequired':True}
  whitelist=[{k:e[k]for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')}for e in r['rawModelEvidence']];whitelist.append({**c['rawEvidence'],'modelRepository':'SenseVoiceSmall-int8','rawTranscript':c['rawText']})
  context={**identity,'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,
    'phoneticEquivalenceIsAuxiliaryOnly':True,'sourceGroupEvidence':o['sourceGroupEvidence'],'sourcePinyin':r['sourcePinyin'],'explanation':explanation,
    'rawDifferences':[{'modelRepository':e['modelRepository'],'actualRaw':e['rawTranscript'],'canonicalUnchanged':r['sourceZH']}for e in r['rawModelEvidence']],
    'actualOriginalControlEvidence':ref(measured),'canonicalParentPinyinRetained':o['canonicalPrintedParentPinyin'],
    'humanListening':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False}
  support.contextual_decision(r,{'sourceContextEvidence':context},ROOT)
  decisions.append({'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':[a,b],'cropPCM_SHA256':r['cropPCM_SHA256'],
    'status':'actual-complete-original-core-known-need-central-exact-registration-and-numeral-recording-note',
    'actualOriginalUtteranceSourcePhysicalEvidence':physical,'originalSourceContextEvidence':context,'originalRawResultWhitelist':whitelist,
    'onlyAuthorizedZeroDecoderWordEmissions':[],'originalHoldsUnchanged':r['holds'],'flagsUnchanged':r['flags'],'notProductionApproved':True})
 p=OUT/'two-source-differences-complete-original-utterance-physical-proposals.json';dump(p,{'schemaVersion':1,'status':'exact-original-context-physical-proposals-not-authority',
   'reviewer':'acceptance_scope_plan','sourceReportEvidence':ref(REPORT),'sourceObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
   'decisions':decisions,'newASR':False,'sourceModified':False,'runtimeModified':False,'automaticApproval':False,
   'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
 note=OUT/'price480-original-colloquial-recording-student-note-proposal.json';entry={k:nr[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
 entry.update({'canonicalZH':nr['sourceZH'],'canonicalPinyin':nr['sourcePinyin'],'actualOriginalRecordedZH':'裙子四百八，短裤四百。',
   'recordingNote':{'zh':'教材写480（四百八十）；录音按价格的口语读法说“四百八”，意思是480。',
     'vi':'Sách ghi 480 (四百八十); bản ghi dùng cách nói giá tiền thông thường “四百八”, nghĩa là 480.'},
   'canonicalTextPinyinAndIdsUnchanged':True,'canonicalFullBashiPronunciationClaim':False,'independentSourceEvidence':ref(OBS),
   'actualNumeralSourcePhaseEvidence':ref(FINE),'actualSourceControlAndPauseEvidence':ref(measured)})
 dump(note,{'schemaVersion':1,'count':1,'independentDecisionEvidence':ref(p),'entries':[entry],'globalNumericOrTextSubstitution':False,
   'automaticApproval':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
 print(json.dumps({'physicalProposals':ref(p),'studentNote':ref(note),'actualControls':ref(measured),'targets':len(decisions)}))
if __name__=='__main__':main()
