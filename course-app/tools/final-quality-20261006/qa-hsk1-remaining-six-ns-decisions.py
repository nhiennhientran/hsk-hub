#!/usr/bin/env python3
"""Six explicit H1 spoken soleNS proofs after true original panel review."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006'
OUT=BASE/'audio-context-peer-hsk1-spoken22';OBS=OUT/'remaining22-actual-original-observation-index.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def module(name,p):
    spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
shared=module('ns_six_raw_bytes',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
MARKS={
 '您想买什么？':{'complete':(5.03,6.50),'previous':(1.08,3.08),'following':(8.53,10.73)},
 '明年女儿上中学。':{'complete':(.80,2.66),'previous':None,'following':(3.63,4.05)},
 '你好！':{'complete':(3.22,3.98),'previous':(.42,2.15),'following':(4.14,5.61)},
 '非常忙。':{'complete':(12.53,13.45),'previous':(9.54,11.16),'following':(13.83,14.40)},
}
NOTES={
 '您想买什么？':('原您 nín 的弱鼻音起段约5.03秒先于5.10秒周期；实际cut4.96秒留原暂停，您声体约5.10–5.32秒及鼻化收束完整，未把它与第4课您/你疑义跨源合并。',
  '想约5.34–5.60秒、买约5.64–5.89秒、什么约5.93–6.45秒的主体/弱末音到6.50秒，6.57秒cut在全原句尾后；hush/s擦音与末me弱周期均在谱中，不以单F0核认证每个音素/tone。',
  '完整10-3源这是第二原发言，前这儿的水果真不少已在3.08秒前结束，后我想买两斤苹果最早8.53秒；当前仅一完整您想买什么原句。整源五亿斤误字保留，此处原字 您想买什么 与当前三raw一致；不审后价格数词。'),
 '明年女儿上中学。':('原明年 míngnián 首弱鼻音从约.80秒、.87秒周期起，在.70秒cut后；没有借开头全源模型0秒时间当实际m起界。',
  '明年后女 nǚ 与独立ér约1.33–1.78秒连读区完整，再上 shàng/中 zhōng/学 xué 的擦音和有声主体到约2.60秒并衰减至2.66秒，2.78秒cut留全尾。打印女儿 nǚ ér 是独立儿音节，非 点儿/条儿 rhotic suffix；原册py原字不改，未认证全音素或声调。',
  '这是完整14-5源的第一原发言，物理原帧0到.80秒含真实领先静音，没有前邻句；后对的第一实际声区约3.63–4.05秒完全在cut之后。两alias是同原句同PCM，按各ID留历史，不声称两份独立音素证明。'),
 '你好！':('原第二发言的你好 nǐ hǎo 弱n起段约3.22秒、周期声约3.24–3.46秒；cut2.94秒保留真实句前暂停，不制造静音、不把第一发言的你好当当前source occurrence。',
  '好 hǎo 的弱高频起段与ao有声约3.52–3.91秒、末衰减到3.98秒在该整数cut末内，4个20ms窗实核安静；末mark取cut上界含原尾暂停而非宣称词边恰为该frame。后我在4.14秒起，没有加入后我叫白家月。',
  '完整2-5源第一人你好我叫李文先结束至约2.15秒，第二人先你好再姓名；当前仅第二行第1句，parent打印py包括姓名但currentZH只你好。完整源佳月/原家月同音字保持，不用它认证姓名句或音调。'),
 '非常忙。':('原非常忙 fēichángmáng 从约12.53秒弱f高频起段、12.67秒强有声起，12.36秒cut留该真实弱起与原暂停，不以feichang强峰替换f。',
  '非常的高频/周期相位接忙的m/ang连续周期与鼻尾弱衰减至13.45秒cut上界，安静edge由真实PCM逐窗核；整句约.92秒并非真实无声，高noSpeech仍原概率保留。谱/voicedbins证实际声体辅助，不认证native/tone。',
  '完整11-3源前三发言含你们学习忙不忙，结束至约11.16秒；本第四行第1句非常忙，然后我学医的首voice区13.83–14.40秒在外。parent py包括后句而currentZH只非常忙，不能把whole最后一句时间拼成当前完整音素。'),
}
def pair(v):return [round(s*16000)for s in v]if v is not None else None
def main():
    assert sha(OBS)=='c9f479887890af2c94a6a721ae1df4407dd3295be6642beed60ddd9de5ef2cd5'
    obs=json.loads(OBS.read_text());ns=[t for t in obs['targets']if set(t['holdsUnchanged'])=={'crop-ASR-hallucination-or-no-speech-warning'}];assert len(ns)==6
    ctcfile=BASE/'audio-hsk1/remaining22-soleNS-four-crop-CTC-inference/evidence-index.json';assert sha(ctcfile)=='daef7a8531d2df9b27b28b517a4ebd41be824e7f72ae76b068ad6373d13cfc9a'
    ctcidx=json.loads(ctcfile.read_text());ctcs={(t['id'],tuple(t['sourceSampleRange16k'])):t for t in ctcidx['targets']};ctcobs=[]
    for t in ns:
        c=ctcs[t['id'],tuple(t['sourceSampleRange16k'])];e=c['independentCTC'];p,v=shared.pinned(e)
        assert v['cropPCM_SHA256']==t['cropPCM_SHA256']and v['actualInputSamples']==t['sourceSampleRange16k'][1]-t['sourceSampleRange16k'][0]and json.loads(v['rawResultString'])==v['rawResult']
        assert v['producerAddedSilenceFrames']==0 and v['rawText']==e['rawText']
        for k in ['expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples']:assert v[k]is False
        ctcobs.append({**{k:t[k]for k in ['id','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']},'rawText':v['rawText'],'rawEvidence':ref(p),'nativeRawResultUnchanged':True,'CTCIsAuxiliaryNotPhonemeCertification':True})
    independentctc=OUT/'independently-verified-ctc-six-spoken-soleNS.json'
    dump(independentctc,{'schemaVersion':1,'status':'independent-CTC-bytes-source-frames-verified-not-approved','inputEvidence':ref(ctcfile),'observations':ctcobs,
      'newInferencePerformedByPeer':False,'producerActualSupplementUniqueCrops':4,'productionApproved':False,'fullPhonemeCertification':False})
    decisions=[]
    for t in ns:
        m=MARKS[t['sourceText']];marks=pair(m['complete']);previous=pair(m['previous']);following=pair(m['following']);limits=[previous[1]if previous else 0,following[0]]
        onset,rime,reading=NOTES[t['sourceText']];canonical=t['canonicalPrintedSource']
        proof={k:t[k]for k in ['sourceText','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
        proof.update({'category':'triple-literal-noSpeech-proxy-review','completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,'sourceOrderChecked':True,
          'originalPrintedPronunciationChecked':True,'allASRWarningsRetained':True,'noSyntheticPadding':True,'phonemeIdentityUnknown':False,
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,
          'explanation':'逐ID独立读12完整真实原轨的2页与15当前几何局部的3页，已核原书ZH/py及同PCM三actualraw、弱起段/发声主体/鼻尾或末音与邻句。NS诊断概率和两Whisper raw保持；CTC新4实际裁片原字只辅助，不改概率门、不造静音。scope仅这一个完整原发言/邻排除，不作native/tone/fullphoneme认证。',
          'onsetExplanation':onset,'rimeAndFinalExplanation':rime,'originalReadingExplanation':reading,
          'independentlyVerifiedCTCSupplementalEvidence':ref(independentctc),
          'originalPrintedSource':{k:canonical[k]for k in ['file','sha256','sourceJSONPointer']},
          'selectedCompleteOriginalReadingFrames16k':marks,'independentlyReviewedNeighborLimits16k':limits,
          'sourceUtteranceEvidence':{'canonicalSourceId':canonical['sourceId'],'sentenceOrdinal':canonical['sentenceOrdinal'],'parentZH':canonical['parentZH'],
            'actualUtteranceFrames16k':marks,'previousActualSpeechFrames16k':previous,'followingActualSpeechFrames16k':following,
            'completeOriginalUtteranceIndependentlyReviewed':True,'wholeSourceEvidence':t['wholeSourceEvidence'],'manualOriginalSourceMarksNotASRTimestamps':True},
          'waveformObservation':t['waveformObservation'],'actualSyllableFeatureEvidence':t['actualSyllableFeatureEvidence'],
          'actualCompleteOriginalSourcePlot':t['completeOriginalSourcePlot'],'phoneticSyllableErIsSeparateNotRhoticSuffix':t['sourceText']=='明年女儿上中学。'})
        if t['sourceText']=='明年女儿上中学。':
            proof['independentLexicalErReviewEvidence']={'category':'separate-original-lexical-er-syllable','sourceSampleRange16k':[21280,28480],
              'separateNuAndErSyllablesIndependentlyReviewed':True,
              'explanation':'已实际独立看1.10–2.05秒原PCM zoom：宽scope1.33–1.78秒内女的周期/前段约1.33–1.45秒接儿约1.46–1.76秒连续有声，谱中中高共振区由前段转为后段较低带；后上约1.80秒开始高频擦音，不在该宽儿scope内。两个连读元音相位与原册nǚ ér及whole/current三raw女儿共同限定完整独立词女儿，非省写的rhotic suffix；这些近似相位不是每音素精确起止或声调/native认证。',
              'actualOriginalSourceZoom':ref(OUT/'actual-lexical-nu-er-source-zoom.png'),'sourceWindow16k':[17600,32800],
              'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False}
        decisions.append({'id':t['id'],'sourceSampleRange16k':t['sourceSampleRange16k'],'decision':'accept','resolvedTextHolds':[],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],
          'resolvedDecoderASRDiagnosticHolds':['crop-ASR-hallucination-or-no-speech-warning'],'acknowledgedFlags':t['flagsUnchanged'],'tripleLiteralNoSpeechDecisionEvidence':proof,
          'rawEvidenceUnchanged':True,'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    output=OUT/'explicit-six-spoken-soleNS-peer-recommendations.json'
    dump(output,{'schemaVersion':1,'status':'explicit-independent-six-spoken-soleNS-recommendations-awaiting-central-validation','reviewer':'acceptance_scope_plan',
      'observationIndexEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),'actualCTCIndexEvidence':ref(ctcfile),'decisions':decisions,
      'counts':{'IDs':6,'geometries':4,'actualCTCRawUniqueCrops':4},'newInferencePerformedByPeer':False,'sourceOrProposalModified':False,'productionApproved':False,
      'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    validatorfile=ROOT/'tools/final-quality-20261006/review-triple-literal.py';validator=module('spoken_six_proxy_validator',validatorfile)
    report=json.loads((BASE/'audio-review/hsk1-paired-full-03.json').read_text());rows={(r['id'],tuple(r['sourceSampleRange16k'])):r for r in report['targets']};results=[]
    for d in decisions:
        try:validator.validate(rows[d['id'],tuple(d['sourceSampleRange16k'])],d,ROOT);results.append({'id':d['id'],'status':'passed'})
        except ValueError as error:results.append({'id':d['id'],'status':'requires-central-contract-review','reason':str(error)})
    reportfile=OUT/'read-only-six-spoken-soleNS-validation.json'
    dump(reportfile,{'status':'passed'if all(r['status']=='passed'for r in results)else'actual-proof-ready-contract-exclusion-retained',
      'recommendationEvidence':ref(output),'validatorEvidence':ref(validatorfile),'results':results,'passed':sum(r['status']=='passed'for r in results),'authorityModified':False})
    print(json.dumps({'recommendations':ref(output),'validation':ref(reportfile),'results':results}))
if __name__=='__main__':main()
