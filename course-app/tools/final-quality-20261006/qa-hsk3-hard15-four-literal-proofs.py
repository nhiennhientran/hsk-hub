#!/usr/bin/env python3
"""Four independent, fixed-crop complete-utterance no-speech explanations.

The reviewer has read all four current-crop and four complete-source sheets.
Existing native raw results and the real source are never rewritten.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT/'course-app/docs/final-quality-20261006'
OUT = BASE/'audio-context-peer-hsk3-remaining-spoken-hard15'
OBS = OUT/'hard15-independent-actual-source-observations.json'
REPORT = BASE/'audio-review/hsk3-paired-full-03.json'
CTC = OUT/'hard15-actual-CTC-independent-source-frame-verification.json'


def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p): return {'file': p.relative_to(ROOT).as_posix(), 'sha256': sha(p)}
def dump(p, x): p.write_text(json.dumps(x, ensure_ascii=False, indent=2)+'\n')
def mod(n, p):
    s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def frames(xs): return [round(x*16000) for x in xs] if xs is not None else None

# Conservative source envelopes observed on the actual sheets, not decoder
# word-emission boundaries. Neighbor envelopes can include their real pauses.
SCOPES={
 'l02:text4:line2': {
  'core':(16.82,26.92),'previous':(13.55,15.55),'following':(27.98,34.10),'limits':(15.55,27.98),
  'onset':'原快的弱高频释放/送气起段约16.98秒、强周期主体约17.02秒；当前start16.3899375在真实句前暂停内，保留原快要考试的完整开首，未用强峰剪去k起段。',
  'final':'快要考试/又忙又累第一声群约17.0–19.2秒，没时间出去吃饭约19.6–21.2秒，家里又什么吃的都没有约21.7–23.65秒，我可能好几天只吃方便面约24.4–26.8秒；最后面的鼻声与弱韵衰减后才到26.98秒cut。4个20ms窗均真实quiet，长句的中间停顿未删掉。',
  'reading':'完整2-7原轨的第二印刷行四个子句保持原顺序。前午饭和晚饭也都在外面吃的末声区在15.55秒之前；后现在回到中国了的下一个实体声群约28秒另起，在cut26.98秒之后。原source整句与三samecrop原字仅辅助，完整core身份由原谱/原行ZH和py共同闭合；未以模型noSpeech概率代替实际发声。'},
 'l09:text2:line3': {
  'core':(10.35,12.90),'previous':(8.25,9.25),'following':(13.99,18.45),'limits':(9.30,13.95),
  'onset':'原不的低能起段及是的摩擦相位从约10.45秒转入10.59秒周期声，cut9.94秒留足原静音；不是比赛约10.45–11.08秒的首b/后sh和各声体完整，不借前一句末了。',
  'final':'打不好没关系的首d释放约11.62秒、bu/hao/mei/guan/xi的交替周期与擦音原序至约12.83秒，末xi弱高频/元音衰减在12.90秒内；当前end13.02秒在完整尾后的实际quiet。未把弱不作为不存在，未认证声调。',
  'reading':'完整9-3对话第三行由前我好多年没打羽毛球了几乎忘了怎么打了及后这么多同学一起打界定。前末声区9.25秒前结束，后这么多最早约14秒重新起声，当前只含这一原发言，没有重复读或跨句声；印刷Bú shì bǐsài, dǎ bu hǎo méi guānxi与实际完整原core兼容。'},
 'l13:text2:line1': {
  'core':(1.23,6.07),'previous':None,'following':(7.68,12.00),'limits':(0,7.60),
  'onset':'原第一句首d释放/di周期约1.30–1.6秒，当前start.72秒位于真实领先静音，未把原音0秒模型时间视作实际d onset；第一次请新邻居来做客从约1.3–3.25秒完整保留。',
  'final':'总是担心有什么没准备好在约3.84–6.02秒形成连续真实声群，末好的ao韵核和弱衰减到6.07秒保守包络内，cut6.1400625秒在真实quiet处；两分句的停顿与弱没均保留，原起尾没有补静音或归一化。',
  'reading':'完整13-3原轨首发言，前方只有物理原帧0至首声前的领先静音，没有前一句。下一放心吧首声区约7.7秒，随后我帮你看了另起，全部在本cut外；源ZH/py与完整source次序闭合第一次请新邻居来做客这一 utterance，而不是仅依赖三模型字面。'},
 'l14:text2:line7': {
  'core':(36.15,41.57),'previous':(32.40,34.50),'following':(42.88,46.75),'limits':(34.55,42.70),
  'onset':'原进的j高频释放及in元音核约36.20秒起，35.74秒cut留真实句前暂停；进不去图书馆也没关系完整首分句的摩擦/周期相位至约38.28秒，未将前我忘记了的末了或喘息当进。',
  'final':'上网看看约38.95–39.72秒，真实停顿后有没有电子书约40.23–41.54秒；书的sh高频起段/后元音与弱尾都在41.57秒包络内，cut41.62秒后20ms仍quiet。前后含完整声群，不把短语内原停顿删掉，noSpeech概率原样保持。',
  'reading':'完整14-3对话第七行按源先我忘记了可能被我放在家里了后到进不去图书馆，再到下一不行我必须去界定；前末声体在34.5秒之前、后不行约42.9秒另起，均不在当前cut内。上网/有没有电子书的次序、实体声群及印刷py身份闭合，whole及三同crop字面辅助，不生成语音或修改任何模型时标。'},
}


def main():
    # Full actual evidence is independently pinned by its present exact body.
    assert sha(OBS)=='821987562b045db6d6c849375e92860523a4a699f4da4b71359b4a9b15b160b2'
    assert sha(REPORT)=='0311e6d565ce6e0ea579e3bfd8b7f4d4f1f4514fc26bd4fd30d41a7fd1c4731d'
    assert sha(CTC)=='c1f33650ab071ac63027243832b20f301a66eb05d8d573d10de36dc436e4af5d'
    obs={x['id']:x for x in json.loads(OBS.read_text())['targets']}
    rows={x['id']:x for x in json.loads(REPORT.read_text())['targets']}
    support=mod('h3_four_ns_support',ROOT/'tools/final-quality-20261006/review-decisions.py')
    syllable=mod('h3_four_ns_actual_features',ROOT/'tools/final-quality-20261006/review-syllable-evidence.py')
    validator=mod('h3_four_ns_literal_validator',ROOT/'tools/final-quality-20261006/review-triple-literal.py')
    decisions=[];results=[]
    for tail,s in SCOPES.items():
        ident='hsk3-fltrp-2026:'+tail;r=rows[ident];o=obs[ident]
        identity={k:r[k] for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
        identity['sourceText']=r['sourceZH'];a,b=r['sourceSampleRange16k'];pcm=support.original_pcm(ROOT,r)
        bins=syllable.features(pcm,a,b);stem=tail.replace(':','-')
        fp=OUT/(stem+'-actual-voiced-features.json')
        dump(fp,{**identity,'featureBins':bins,'featureBinsSHA256':syllable.feature_sha(bins),
          'method':'actual-original-PCM-normalized-autocorrelation-32ms-5ms-75-to-500Hz-energy-gated',
          'certifiesPerCharacterAlignment':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False})
        wp=OUT/(stem+'-actual-waveform-observation.json')
        dump(wp,{**identity,'sourceSampleCount16k':len(pcm)//4,'plots':[o['actualCurrentSourceCropPlot']],
          'completeOriginalPlot':o['actualCompleteOriginalSourcePlot'],'observationEvidence':ref(OBS),
          'manualEnvelopeFrames16k':frames(s['core']),'sourceModified':False,'newASR':False})
        explanation=s['onset']+s['final']+s['reading']
        proof={**identity,'category':'triple-literal-noSpeech-proxy-review',
          'completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,'sourceOrderChecked':True,
          'originalPrintedPronunciationChecked':True,'allASRWarningsRetained':True,'noSyntheticPadding':True,
          'phonemeIdentityUnknown':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
          'devicePlaybackCertified':False,'fullPhonemeCertification':False,'explanation':explanation,
          'onsetExplanation':s['onset'],'rimeAndFinalExplanation':s['final'],'originalReadingExplanation':s['reading'],
          'independentlyVerifiedCTCSupplementalEvidence':ref(CTC),
          'originalPrintedSource':{k:r['canonicalSource'][k] for k in ('file','sha256','sourceJSONPointer')},
          'selectedCompleteOriginalReadingFrames16k':frames(s['core']),
          'independentlyReviewedNeighborLimits16k':frames(s['limits']),
          'sourceUtteranceEvidence':{'canonicalSourceId':r['canonicalSource']['sourceId'],
            'sentenceOrdinal':r['canonicalSource']['sentenceOrdinal'],'parentZH':r['canonicalSource']['parentZH'],
            'actualUtteranceFrames16k':frames(s['core']),'previousActualSpeechFrames16k':frames(s['previous']),
            'followingActualSpeechFrames16k':frames(s['following']),'completeOriginalUtteranceIndependentlyReviewed':True,
            'wholeSourceEvidence':[o['sourceGroupEvidence']],'manualOriginalSourceEnvelopeNotDecoderAlignment':True},
          'waveformObservation':ref(wp),'actualSyllableFeatureEvidence':ref(fp),
          'actualCompleteOriginalSourcePlot':o['actualCompleteOriginalSourcePlot']}
        d={'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':[a,b],'cropPCM_SHA256':r['cropPCM_SHA256'],
          'decision':'accept','sourceContextChecked':True,'rationale':explanation,'acknowledgedFlags':r['flags'],
          'tripleLiteralNoSpeechDecisionEvidence':proof,'resolvedDecoderASRDiagnosticHolds':r['holds'],
          'resolvedTextHolds':[],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
          'devicePlaybackCertified':False,'fullPhonemeCertification':False,'automaticProductionApproval':False}
        validated=validator.validate(r,d,ROOT)
        assert validated['allRawEvidenceUnchanged'] is True
        results.append({'id':ident,'status':'passed','retainedWhisperNoSpeechWarnings':validated['retainedWhisperNoSpeechWarnings']})
        decisions.append(d)
    p=OUT/'four-strict-literal-complete-utterance-explicit-decisions.json'
    dump(p,{'schemaVersion':1,'reviewer':'acceptance_scope_plan','sourceReportEvidence':ref(REPORT),
      'sourceObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),'decisions':decisions,
      'status':'independent-exact-utterance-four-recommendations-not-authority','newASR':False,
      'sourceModified':False,'runtimeModified':False,'productionApproved':False})
    q=OUT/'four-strict-literal-complete-utterance-read-only-validation.json'
    dump(q,{'status':'passed','decisionEvidence':ref(p),'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-triple-literal.py'),
      'passed':len(results),'results':results,'authorityModified':False,'automaticProductionApproval':False})
    print(json.dumps({'decisions':ref(p),'validation':ref(q),'passed':len(results)}))


if __name__=='__main__':main()
