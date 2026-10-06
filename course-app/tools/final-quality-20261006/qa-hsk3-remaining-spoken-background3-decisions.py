#!/usr/bin/env python3
"""Three source-name decisions, reusing exact already independently reviewed bounds."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'course-app/docs/final-quality-20261006'
OUT=BASE/'audio-context-peer-hsk3-remaining-spoken'
EXPLANATIONS={
 'l02:text1:line2':'独立重读2-1全源和exact114裁片6.8–10.46，原谢谢/一雪姐声群约6.9–7.65，再我都可以8.1–8.75、你们点吧9.1–9.7完整，下一飞的实际起声在cut以后。姓名原印Yīxuě jiě，一/雪/姐实际/i/+前部摩擦圆唇复韵+后jie连续完整。易/医/学模型原字全保；雪+姐第三声语境与学字预测兼容，易字预测也不单独构成yī实际调错证明。精确源父文请菜单与本答话同一人物身份闭合，不将姓名字形或性别作phone认证。不造全局易/医学→一雪替换；旧guard ASR飞起10.34不作为真声界，复用原exact背景双pause/邻界证据。',
 'l05:text1:line5:sentence2':'独立重读5-1完整原句和exact114第二句[345439,391201]。前句大衣完整衰减在21.45前，本句约21.78首要起，经要不要叫到22.6–23.22姓名一/雪/姐声群，再一起去约23.98弱尾，24.45 cut之后下一好主意约25.3另起。两crop醫學/一學及整源医学原样，不仅按字读词表批准；实际姓名高前i、x/ü-e与jie共同过渡及源书本父句邀请同一姐姐身份齐，雪+姐第三声上下文兼容表层xué，tone/逐字phone认证均false。row.sourcePinyin空值保持，canonical父句原印py独立核而不补child字符串。原连续低背景由exact两pause证据保全，无合成静音和真实邻句声。',
 'l07:text4:line4':'独立重读7-7末段全源和exact114 [475519,572160]，前开机声群约29.53前衰减，目标我约30.05起到看了好几个，都很满意，再晚上让一雪来决定吧完整尾约35.35，cut35.76在其后原背景中。双crop和whole医学原字全保；源姓名实际/i/+x的圆唇前复韵与后lai共同过渡在约33.9–34.9声群完整，对应确切印Yīxuě及选电视请一雪决定的原父文，而不凭模型医学字选择实际调或改教材。这里不引用雪+姐第三声变调规则：后为来；声调/native/逐phone唯一认证保持false。相同原PCM/currentcrop的两pause和邻界proof可复用，未知tone不等于缺核心或坏cut。',
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def main():
 obs_path=OUT/'text11-independent-actual-source-observations.json';obs={x['id']:x for x in json.loads(obs_path.read_text())['targets']}
 old_path=BASE/'audio-context-peer-hsk3-boundary/explicit-sentence-boundary-recommendations.json';old={x['id']:x for x in json.loads(old_path.read_text())['decisions']}
 spec=importlib.util.spec_from_file_location('h3_bg3_actual_context_bounds',ROOT/'tools/final-quality-20261006/review-decisions.py');support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
 decisions=[];checks=[]
 for tail,explanation in EXPLANATIONS.items():
  ident='hsk3-fltrp-2026:'+tail;o=obs[ident];rp=ROOT/o['currentActualReportEvidence']['file'];assert sha(rp)==o['currentActualReportEvidence']['sha256'];r=next(x for x in json.loads(rp.read_text())['targets']if x['id']==ident);previous=old[ident]
  for key in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256'):assert previous[key]==r[key]
  bounds=copy.deepcopy(previous['boundaryDecisionEvidence']);proof={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
  proof.update({'sourceText':r['sourceZH'],'sourcePinyin':r['sourcePinyin'],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,
   'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
   'sourceGroupEvidence':o['sourceGroupEvidence'],'originalPrintedSource':{k:r['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},
   'canonicalPrintedParentPinyin':o['canonicalPrintedParentPinyin'],
   'independentActualOriginalSourceObservations':ref(obs_path),
   'actualCurrentSourceCropPlot':o['actualCurrentSourceCropPlot'],
   'actualCompleteOriginalSourcePlot':o['actualCompleteOriginalSourcePlot'],
   'exactPreviousIndependentBoundaryEvidence':ref(old_path),
   'selectedCompleteOriginalUtteranceFrames16k':bounds['targetForegroundExtent16k'],
   'independentlyReviewedNeighborLimits16k':bounds['independentlyReviewedNeighborLimits16k'],
   'phonemeIdentityUnknown':False,'completeOriginalCoreUtteranceIndependentlyReviewed':True,
   'allRawModelDifferencesPreserved':True,'noGlobalSubstitution':True,
   'rawDifferences':[{'model':e['file'],'raw':e['rawTranscript'],'retained':True}for e in r['rawModelEvidence']],
   'explanation':explanation,'humanListening':False,'nativeSpeakerReview':False,
   'pronunciationToneCertified':False,'fullPhonemeCertification':False})
  d={'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
   'decision':'accept','sourceContextChecked':True,'acknowledgedFlags':r['flags'],'rationale':explanation,
   'sourceContextEvidence':proof,'boundaryDecisionEvidence':bounds,
   'resolvedTextHolds':[h for h in r['holds']if h in support.TEXT_REVIEW_HOLDS],
   'resolvedBoundaryHolds':[h for h in r['holds']if h not in support.TEXT_REVIEW_HOLDS],
   'resolvedSourceHolds':[],'resolvedDecoderASRDiagnosticHolds':[],
   'sourceReportEvidence':o['currentActualReportEvidence'],
   'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,
   'devicePlaybackCertified':False,'fullPhonemeCertification':False}
  support.contextual_decision(r,d,ROOT);support.boundary_decision(r,d,ROOT);decisions.append(d);checks.append({'id':ident,'contextAndExactBoundaryValidated':True})
 p=OUT/'background3-independent-source-context-explicit-decisions.json';p.write_text(json.dumps({'schemaVersion':1,'reviewer':'acceptance_scope_plan','scriptEvidence':ref(Path(__file__)),'independentActualOriginalSourceObservations':ref(obs_path),'exactPreviousIndependentBoundaryEvidence':ref(old_path),'decisions':decisions,'automaticApproval':False,'newASR':False,'sourceModified':False,'runtimeModified':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
 v=OUT/'background3-read-only-context-and-boundary-validation.json';v.write_text(json.dumps({'status':'read-only-independent-source-and-boundary-gates-validated-not-authority','decisionEvidence':ref(p),'checks':checks},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'decisions':ref(p),'validation':ref(v)}))
if __name__=='__main__':main()
