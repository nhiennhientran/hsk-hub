#!/usr/bin/env python3
"""Six explicit source-context decisions after actual whole/crop spectra were read."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-remaining-spoken'
REVIEWS = {
 'l01:text4:line4': ([523200, 599360], [515200, None],
  '独立原1-7完整末句和当前crop谱显示，前句年轻的真实声群在32秒前结束，32.4 cut留真实间隔；晚上从约32.8起，接一/雪/姐三相位到约34.3，带我们去吃了到一家很好吃的中国菜完整尾约37.4，37.58 cut在真实尾后。原印姓名Yīxuě jiě属于来北京叙述中的同一姐姐，双crop和整轨均保医学预测；雪+姐是两个相邻第三声，学的字形不能单独证明实际雪的声调错误，也不据此作声调认证。原前i核、x/ü-e复韵和后jie完整连读属于这一次合法源句，未借词表或另一读替代。此结论限完整原句与本书印刷姓名上下文，不全局把医学改一雪、不声称逐字声调唯一。'),
 'l04:text2:line3': ([150080, 172160], [139200, 181760],
  '原4-3该问句约9.38–10.75完整在当前8.94–10.88裁片内，真实b/i-n起韵、guan接ye，再完整前部摩擦/圆唇前复韵和后好了吗均在，四真实边界quiet；上一购票回答与下一是的分开。宾/冰均保bīn相同核心，馆/管保原模型字而不判声调；small与whole的学预测和medium的选预测都不改。独立细谱9.8–10.35保留ye到后复韵/尾、好起声的全部共同过渡，medium原句也选好了吗与原书同问宾馆是否已选好上下文闭合。没有实际词核未朗读或坏cut的证据；不凭模型学字替换原书选，不赋予逐音素或声调证书。'),
 'l06:text2:line7:sentence1': ([464640, 493920], [458400, 501280],
  '采用真实nine-repair [461120,496641]，约29.04首我到30.87末了完整留存，前句声群28.55前止、后如果约31.36另起，四真实边界quiet。独立29.25–30.02细谱保一的周期核、约29.43–29.53前部摩擦/塞擦相和29.55–29.80高前i周期韵，再接就；实际整源/medium的挤预测也是ji核心而不能单凭字推断急的实际调错，small的起预测、medium和实际whole的挤预测原样保留。原书父句印刷急及原司机解释急而走错的同一源utterance身份齐，当前无缺ji核心/弱尾或夹邻句；对急/挤声调与j/q的逐phone唯一边界均不生成认证。row.sourcePinyin原来为空，保持空值，独立只核canonical父句原印py，不补造child拼音。'),
 'l10:text3:line3': ([198400, 286400], [190400, 293600],
  '真实10-5此原句约12.45起书的摩擦/周期声，到第五页对话我看不懂，再16.25以后小/雪/也及不明白的全部声群，末弱尾约17.93，cut12.04–17.98保留首尾；前问哪个题不会及后我课上讲过分开。双crop和whole均保小学预测。原印Xiǎoxuě yě中雪和也两相邻第三声，不能把学字预测当原录音调错；其x/ü-e核心接ye的完整相位与同一父文学生小雪语境闭合。未拿性别/汉字/词序代音素证书，不作雪/学全局替字或所有tone通过宣称。'),
 'l12:text2:line3:sentence1': ([159520, 166400], [155200, 177920],
  '选真实sentence114 [158720,172480]，原10.0–10.35只有一个完整开口a样周期感叹声、自然轻呼气起声和衰减，cut9.92–10.78保全，下一我每天约11.17后另起。独立whole原字啊?与原父文印Á?一致；两个crop原字蛤? / 蛤均保留，它们不是实际g塞音出现的证明，原谱没有额外g词核或被截去的初始独立词。源合法完整感叹utterance与书面啊上下文可闭合，轻呼气过渡不要求单独人工tone/逐phone证书；不把蛤改写进教材、不全球规范化蛤/啊。'),
 'l18:text2:line1:sentence1': ([15200, 36800], [0, 41600],
  '原18-3首问候，当前[6559,37281]有真实leadingquiet；约.98开首短前部摩擦/塞擦到1.02后开口周期声、鼻韵过渡并接阿姨，再李叔叔全部原声尾约2.29完整，下一过年好2.63以后另起。独立.91–1.57细谱可见同一姓名声群前部摩擦与开放后元音/nasal到阿的共同过渡，没有换另一读或漏姓声群；整源原字張阿姨与印Zhāng āyí原父文身份明确。两个crop原字鄭/曾保留，均不作为实际姓或声调定论，不全局郑/曾改张；结论是此合法完整原问候与确切书面称呼上下文，未赋予名字逐音素唯一/声调认证。'),
}


def sha(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path):
 return {'file':path.relative_to(ROOT).as_posix(),'sha256':sha(path)}


def main():
 observations = OUT/'text11-independent-actual-source-observations.json'
 data=json.loads(observations.read_text()); targets={x['id']:x for x in data['targets']}
 fine=OUT/'text11-localized-original-source-phase-evidence.json'
 spec=importlib.util.spec_from_file_location('h3_first6_context_gate',ROOT/'tools/final-quality-20261006/review-decisions.py')
 support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
 decisions=[];checks=[]
 for tail,(marks,limits,explanation)in REVIEWS.items():
  ident='hsk3-fltrp-2026:'+tail;o=targets[ident]
  report_path=ROOT/o['currentActualReportEvidence']['file'];assert sha(report_path)==o['currentActualReportEvidence']['sha256']
  row=next(x for x in json.loads(report_path.read_text())['targets']if x['id']==ident)
  assert set(row['holds']) <= support.TEXT_REVIEW_HOLDS
  assert all(x is None or x<=-45 for x in o['actualFourEdgeRMSDbFS20ms'].values())
  limits=[limits[0],limits[1]if limits[1]is not None else o['sourceDecodedFrames16k']]
  a,z=row['sourceSampleRange16k'];assert limits[0]<=a<=marks[0]<marks[1]<=z<=limits[1]
  proof={k:row[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
  proof.update({'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,
   'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,
   'phoneticEquivalenceIsAuxiliaryOnly':True,'sourceGroupEvidence':o['sourceGroupEvidence'],
   'originalPrintedSource':{k:row['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},
   'canonicalPrintedParentPinyin':o['canonicalPrintedParentPinyin'],
   'independentActualOriginalSourceObservations':ref(observations),
   'actualCurrentSourceCropPlot':o['actualCurrentSourceCropPlot'],
   'actualCompleteOriginalSourcePlot':o['actualCompleteOriginalSourcePlot'],
   'actualLocalizedSourcePhaseEvidence':ref(fine),
   'selectedCompleteOriginalUtteranceFrames16k':marks,
   'independentlyReviewedNeighborLimits16k':limits,
   'phonemeIdentityUnknown':False,'completeOriginalCoreUtteranceIndependentlyReviewed':True,
   'allRawModelDifferencesPreserved':True,'noGlobalSubstitution':True,
   'rawDifferences':[{'model':e['file'],'raw':e['rawTranscript'],'retained':True}for e in row['rawModelEvidence']],
   'explanation':explanation,'humanListening':False,'nativeSpeakerReview':False,
   'pronunciationToneCertified':False,'fullPhonemeCertification':False})
  d={'id':ident,'candidateId':row['candidateId'],'sourceSampleRange16k':row['sourceSampleRange16k'],
     'cropPCM_SHA256':row['cropPCM_SHA256'],'decision':'accept','sourceContextChecked':True,
     'acknowledgedFlags':row['flags'],'rationale':explanation,'sourceContextEvidence':proof,
     'resolvedTextHolds':row['holds'],'resolvedBoundaryHolds':[],
     'resolvedSourceHolds':[],'resolvedDecoderASRDiagnosticHolds':[],
     'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
     'devicePlaybackCertified':False,'fullPhonemeCertification':False,
     'sourceReportEvidence':o['currentActualReportEvidence']}
  support.contextual_decision(row,d,ROOT);decisions.append(d);checks.append({'id':ident,'actualSourceContextGateValidated':True})
 path=OUT/'first6-independent-source-context-explicit-decisions.json'
 path.write_text(json.dumps({'schemaVersion':1,'reviewer':'acceptance_scope_plan',
  'independentSourceObservations':ref(observations),'actualLocalizedSourcePhaseEvidence':ref(fine),
  'scriptEvidence':ref(Path(__file__)),'decisions':decisions,'automaticApproval':False,
  'newASR':False,'sourceModified':False,'runtimeModified':False,
  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
  'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
 check=OUT/'first6-read-only-source-context-validation.json'
 check.write_text(json.dumps({'status':'independent-context-verified-not-authority','decisionEvidence':ref(path),
  'checks':checks,'acceptedByCompiler':False},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'decisions':ref(path),'validation':ref(check)}))


if __name__=='__main__':main()
