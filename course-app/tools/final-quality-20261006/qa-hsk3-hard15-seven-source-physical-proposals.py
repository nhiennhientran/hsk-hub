#!/usr/bin/env python3
"""Immutable source-physical handoff for seven complete real utterances.

No central registry is changed and no decoder warning is discarded here.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'course-app/docs/final-quality-20261006'
OUT=BASE/'audio-context-peer-hsk3-remaining-spoken-hard15'
REPORT=BASE/'audio-review/hsk3-paired-full-03.json'
OBS=OUT/'hard15-independent-actual-source-observations.json'
CTC=OUT/'hard15-actual-CTC-independent-source-frame-verification.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mod(n,p):s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def frames(v):return [round(x*16000)for x in v]if v is not None else None
SCOPES={
 'l02:text3:line4':{'core':(17.83,19.48),'previous':(14.20,16.69),'following':(20.73,26.22),'limits':(16.72,20.65),
  'onset':'原他们家的t释放/送气与a/men声体从约17.89秒在crop17.4199375之后起，整第一音群未缺；前原送的尾声约16.65秒已结束，不能拿旧fullword时间16.62当exactphone边。',
  'final':'还能送约18.35–18.92秒的交替鼻声、擦音与声体再接外卖约18.95–19.44秒，末mai复韵与弱衰减到19.48秒保守包络内，crop19.54秒在实际尾后quiet。当前有一完整疑问句、未把句前停顿裁成无声语音。',
  'reading':'完整2-5对话第四原行；前也可以选好了让他们给你送与后对现在很多饭馆都能送外卖的实体声群分别在当前cut之前和约20.7秒之后，当前只保他们家还能送外卖这一印刷句。small/medium/CTC完整原字及whole上下文辅助身份，noSpeech warning与低概率flag都保留。'},
 'l08:text1:line1':{'core':(.62,3.90),'previous':None,'following':(5.0,8.88),'limits':(0,4.80),
  'onset':'原首天中的t高频起段约.7秒、两名字声体约.8–1.3秒完整留在frame0开首crop；beforeStart物理不存在，只有原首静音和afterStart真实quiet，未伪造前20ms。1.3–1.5秒的缓慢DC摆动不当作新增名字音节。',
  'final':'真实暂停后最近常看见你来体育馆从约1.78秒到3.84秒，馆的末复韵/鼻尾弱衰减完整保留至3.90秒包络，crop4.08秒在尾后quiet。完整原Tiānzhōng名字和体育馆内容均存在，不从天钟/天中字形推缺音或声调。',
  'reading':'8-1完整对话第一发言，source没有前邻句，后我每天下午都来跑一个小时步约5秒以后另起。canonical Tiānzhōng与当前天钟同音预测、whole天中/小模型/CTC天中都逐原字保留；使用打印名字和完整当前原发言身份，只解释字形差，不全局替换钟中或认证姓名每个声调。'},
 'l08:text4:line2':{'core':(10.57,18.10),'previous':(8.80,10.12),'following':(19.03,23.96),'limits':(10.15,18.98),
  'onset':'原有的弱起声从约10.6秒、10.75秒主周期开始，在10.24秒cut之后；有一种药中yào的主体声核约11.6秒完整，与小模型要同音字预测并不表示真实丢药。前吃药的方法的末声体已在10.12秒之前结束。',
  'final':'有一种药需要每天睡前吃一次完整首分句至约13.65秒；其他几种每天吃三次约14.30–17.2秒及饭后吃至18.02秒均完整，末ch高频/元音衰减后crop18.13秒quiet。一次与三次的不同核心声群均保原存在，不做数字转换或借下一句药说明。',
  'reading':'完整8-7原文第二印刷行，前出院前医生给我开了几种药而且告诉了我吃药的方法，后除了吃药医生还说最重要的是多休息在19秒后另起。每次吃法的原ZH/py/whole内容与当前完整声群共同闭合原utterance，保small要、繁体形与各低概率原结果；原录音没有被替换成期望药文本。'},
 'l11:text1:line4:sentence1':{'core':(11.29,15.72),'previous':(8.55,10.37),'following':(16.31,18.20),'limits':(10.42,16.25),
  'onset':'原后的弱h高频起段约11.3秒先于11.44秒周期核，11.14秒cut保留原完整后天上午；原首声没有借前那什么时候开会末会的声尾。',
  'final':'原后天上午十点约11.3–13.0秒再经真停顿接会议地点换到第一会议室约13.45–15.69秒；末室的sh高频与弱舌尖元音完整留在15.72秒包络内，15.76秒cut后的原窗quiet。原时间词是完整两音节十点，small written10与原十只作为exact raw数字书写差保留，不把10误当另一个语音读法。',
  'reading':'11-1对话第四行第1句，parent原ZH/py还含我正要给大家发邮件，第2句的我正要实体声群约16.31秒之后，未纳入当前cut。前提问最后声体约10.3秒已结束。三samecrop及whole后天上午十点原句辅助；当前source身份、时间词完整声群、首尾和第1句边界均独立看原谱，不依据数字format生成音素。'},
 'l12:text1:line8:sentence2':{'core':(33.48,37.885),'previous':(32.52,33.04),'following':None,'limits':(33.06,38.18),
  'onset':'前同parent第1句行的完整声群约32.6–33.0秒在cut33.17秒之前；原或者首h弱擦音约33.5秒/33.56秒周期主体完整，当前没有借行的韵核。',
  'final':'或者明天去约33.53–34.63秒，再或者后天去约35.12–36.17秒，真实停顿后我给你打电话约36.90–37.86秒，话的h高频与a弱尾在37.885秒包络内保留；37.90秒cut确实quiet。两条或者选择及末电话都保持原自然停顿，不把whole合写或繁体形式当缺原声。',
  'reading':'12-1对话第八行第2句，原parent开首行单独cut在外；该电话句是完整原轨最后实际发言，完整source尾后只有自然quiet，没有下一朗读句。whole原话和三samecrop字面只辅助，前行/第二句身份由印刷parent py与原局部/全轨谱独立固定，绝非拼接重复的或者。'},
 'l14:text2:line3':{'core':(12.94,17.455),'previous':(10.14,11.24),'following':(19.08,23.14),'limits':(11.28,18.98),
  'onset':'原咱的z摩擦释放约12.98秒接an/men声群，在12.46秒cut后，未缺弱z也未加入前游泳的鼻尾。咱们一起走吧原周期/擦音相位至约14.15秒。',
  'final':'我想去图书馆约14.74–15.95秒，再看看中文报纸约16.2–17.43秒，末纸弱舌尖元音尾在17.455秒包络内，17.48秒cut后三个与前窗实quiet；完整报纸核心与两个看的自然连读均保留。',
  'reading':'14-3完整对话第三行，由前我今天忙得很要先去图书馆借书然后去游泳末声体约11.2秒及后等等我的校园卡不见了约19.1秒首声群界定。当前只一完整咱们一起走吧...中文报纸原发言，两Whisper仅繁体书写与CTC简体原字保留，不跨源拼接或改进度ID。'},
 'l18:text1:line3':{'core':(9.22,10.455),'previous':(7.52,8.20),'following':(11.64,13.96),'limits':(8.25,11.57),
  'onset':'原你们的弱n起段约9.28秒先于9.35秒强周期，cut8.79秒保留真实句前暂停，未把前很高兴的ng尾当新的n；只有本句的一次你们原声。',
  'final':'怎样约9.65–9.98秒的摩擦/央元音与鼻化尾接过节约10.0–10.40秒，节的j高频/ie核衰减完整至10.455秒，10.55秒cut在quiet。没有因句短与NS概率将有声问句视作静音，仍保模型原概率。',
  'reading':'18-1对话第三原行，前第一次请外国朋友来家里过春节我也很高兴末声群约8.2秒前结束，后春节是中国最重要的节日约11.6秒重新起声。原Nǐmen zěnyàng guòjié/完整source上下文及实际一组首尾声群闭合身份；繁简原glyph差、低概率与noSpeech原结果全保，没有tone/fullphoneme认证。'},
}
def main():
    assert sha(OBS)=='821987562b045db6d6c849375e92860523a4a699f4da4b71359b4a9b15b160b2'
    assert sha(CTC)=='c1f33650ab071ac63027243832b20f301a66eb05d8d573d10de36dc436e4af5d'
    observations={x['id']:x for x in json.loads(OBS.read_text())['targets']}
    rows={x['id']:x for x in json.loads(REPORT.read_text())['targets']}
    ctcs={x['id']:x for x in json.loads(CTC.read_text())['observations']}
    support=mod('hard15_seven_source',ROOT/'tools/final-quality-20261006/review-decisions.py')
    features=mod('hard15_seven_features',ROOT/'tools/final-quality-20261006/review-syllable-evidence.py')
    decisions=[]
    for tail,s in SCOPES.items():
        ident='hsk3-fltrp-2026:'+tail;r=rows[ident];o=observations[ident];ctc=ctcs[ident]
        identity={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        identity['sourceText']=r['sourceZH'];a,b=r['sourceSampleRange16k'];pcm=support.original_pcm(ROOT,r)
        bins=features.features(pcm,a,b);stem=tail.replace(':','-')
        fp=OUT/(stem+'-actual-voiced-features.json');dump(fp,{**identity,'featureBins':bins,
          'featureBinsSHA256':features.feature_sha(bins),'method':'actual-original-PCM-normalized-autocorrelation-32ms-5ms-75-to-500Hz-energy-gated',
          'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False})
        wp=OUT/(stem+'-actual-waveform-observation.json');dump(wp,{**identity,'sourceSampleCount16k':len(pcm)//4,
          'plots':[o['actualCurrentSourceCropPlot']],'wholeOriginalPlot':o['actualCompleteOriginalSourcePlot'],
          'sourceObservationEvidence':ref(OBS),'manualEnvelopeFrames16k':frames(s['core']),'newASR':False,'sourceModified':False})
        explanation=s['onset']+s['final']+s['reading']
        physical={**identity,'selectedCompleteOriginalReadingFrames16k':frames(s['core']),
          'independentlyReviewedNeighborLimits16k':frames(s['limits']),'completeOriginalOnsetRimeAndFinalReviewed':True,
          'neighborPhonemesExcluded':True,'sourceOrderChecked':True,'originalPrintedPronunciationChecked':True,
          'allASRWarningsRetained':True,'noSyntheticPadding':True,'phonemeIdentityUnknown':False,'explanation':explanation,
          'onsetExplanation':s['onset'],'rimeAndFinalExplanation':s['final'],'originalReadingExplanation':s['reading'],
          'originalPrintedSource':{k:r['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},
          'waveformObservation':ref(wp),'actualSyllableFeatureEvidence':ref(fp),'actualOriginalObservationEvidence':ref(OBS),
          'independentlyVerifiedCTCSupplementalEvidence':ref(CTC),
          'sourceUtteranceEvidence':{'canonicalSourceId':r['canonicalSource']['sourceId'],
            'sentenceOrdinal':r['canonicalSource']['sentenceOrdinal'],'parentZH':r['canonicalSource']['parentZH'],
            'actualUtteranceFrames16k':frames(s['core']),'completeOriginalUtteranceIndependentlyReviewed':True,
            'previousActualSpeechFrames16k':frames(s['previous']),'followingActualSpeechFrames16k':frames(s['following']),
            'wholeSourceEvidence':[o['sourceGroupEvidence']],'manualOriginalSourceEnvelopeNotDecoderAlignment':True},
          'actualFourEdgeRMSDbFS20ms':o['actualFourEdgeRMSDbFS20ms'],
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
          'devicePlaybackCertified':False,'fullPhonemeCertification':False}
        # Actual utterance/neighbor envelopes and voiced bodies are reproduced
        # here. The central exact registry/approval remains a separate step.
        first,last=r['sourceSampleRange16k'];marks=physical['selectedCompleteOriginalReadingFrames16k'];limits=physical['independentlyReviewedNeighborLimits16k']
        assert 0<=limits[0]<=first<=marks[0]<marks[1]<=last<=limits[1]<=len(pcm)//4
        voiced=[x for x in bins if x['voicedObservation'] and marks[0]<=x['sourceWindowFrames16k'][0] and x['sourceWindowFrames16k'][1]<=marks[1]]
        assert len(voiced)>=10
        whitelist=[{k:e[k]for k in ('file','sha256','modelRepository','modelRevision','rawTranscript')}for e in r['rawModelEvidence']]
        whitelist.append({**ctc['rawEvidence'],'modelRepository':'SenseVoiceSmall-int8','rawTranscript':ctc['rawText']})
        decisions.append({'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':[a,b],'cropPCM_SHA256':r['cropPCM_SHA256'],
          'status':'complete-original-core-known-ready-for-central-exact-diagnostic-registration',
          'actualOriginalUtteranceSourcePhysicalEvidence':physical,'originalRawResultWhitelist':whitelist,
          'onlyAuthorizedZeroDecoderWordEmissions':[],'originalHoldsUnchanged':r['holds'],'flagsUnchanged':r['flags'],
          'actualCanonicalPrintedSourcePinyinRetained':o['canonicalPrintedParentPinyin'],
          'rawTextDifferencesPreserved':[{ 'modelRepository':e['modelRepository'],'rawTranscript':e['rawTranscript']}for e in r['rawModelEvidence']],
          'notProductionApproved':True})
    p=OUT/'seven-complete-original-utterance-physical-fixed-scope-proposals.json'
    dump(p,{'schemaVersion':1,'status':'independent-exact-physical-proposal-not-authority','reviewer':'acceptance_scope_plan',
      'sourceReportEvidence':ref(REPORT),'sourceObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
      'decisions':decisions,'newASR':False,'sourceModified':False,'runtimeModified':False,'automaticApproval':False,
      'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    print(json.dumps({'physicalProposals':ref(p),'targets':len(decisions)}))
if __name__=='__main__':main()
