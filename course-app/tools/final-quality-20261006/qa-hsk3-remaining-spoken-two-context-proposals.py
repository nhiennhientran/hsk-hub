#!/usr/bin/env python3
"""Bounded source-context proposals for the complete mall and weak-particle utterances."""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk3-remaining-spoken'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def main():
 observations=OUT/'text11-independent-actual-source-observations.json';obs={x['id']:x for x in json.loads(observations.read_text())['targets']}
 fine=OUT/'text11-localized-original-source-phase-evidence.json';controls=OUT/'shangchang-original-source-control-phase-evidence.json'
 reviews=[('l07:text1:line6',[486400,531360],[480000,None],
  '独立原7-1完整对话与exact30.04–33.28裁片：前句怎么去约29.3结束，首sh类摩擦约30.49到第一开放后元音/nasal，再第二塞擦/后元音/nasal声群至约30.95，之后不远、咱们可以走着去完整末尾到33.2，裁片前后真实quiet且原轨后无另一问句。源同一对话的商场里开了自行车店、同刘明原现在长高了的开放后元音/nasal及本句咱的真实source-control谱都独立读过；两个目标元音/nasal声群完整，非借词表字数推未朗读声。双crop和whole生产原字均保留，不能拿这个字预测单独判定源改说生产。精确印Shāngchǎng和商场是否远、如何去购物的父文身份，与实际原首两完整后元音/nasal声群相容；本scope是完整合法原utterance，非所有n/ng、声调或逐phoneme唯一cert，绝不全球生产→商场替字。',None),
 ('l14:text3:line6',[404800,480000],[397120,None],
  '独立原14-5最后鼓励句和exact24.85–30.2裁片：前紧张上一句声尾约24.35前结束，目标紧张什么约25.3起，到26.04–26.4弱周期尾连续保留，再我们都喜欢听你唱歌与你要相信自己完整末尾29.98，真实quiet后cut不截声。26.04–26.4局部真谱有完整衰弱尾和共同过渡，未把么/啊逐字边界硬分；两crop和whole省啊原字预测全保，不拿脚本或ASR省字证明实际a完全不存在。确切印Jǐnzhāng shénme a和合法原鼓励utterance核心完整且邻句排除；canonical独立清晰a claim=false，shared末尾给么/啊的唯一归属不作认证。这是合法原连读的固定source scope，不改原书与py，显示语气词未单独清晰的双语录音说明，避免学生误以为播放器漏裁。',
  {'zh':'教材标注“什么啊”；本段录音末尾与前音连读，语气词“啊”不单独清晰。',
   'vi':'Sách ghi “什么啊”; trong bản ghi này phần cuối nối với âm trước, “啊” không được đọc tách rõ.'})]
 spec=importlib.util.spec_from_file_location('h3_last_two_context_support',ROOT/'tools/final-quality-20261006/review-decisions.py');support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
 decisions=[];notes=[]
 for tail,marks,limits,explanation,note in reviews:
  ident='hsk3-fltrp-2026:'+tail;o=obs[ident];rp=ROOT/o['currentActualReportEvidence']['file'];assert sha(rp)==o['currentActualReportEvidence']['sha256'];r=next(x for x in json.loads(rp.read_text())['targets']if x['id']==ident)
  assert set(r['holds'])<=support.TEXT_REVIEW_HOLDS;limits=[limits[0],limits[1]if limits[1]is not None else o['sourceDecodedFrames16k']];a,z=r['sourceSampleRange16k'];assert limits[0]<=a<=marks[0]<marks[1]<=z<=limits[1]
  proof={k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
  proof.update({'sourceText':r['sourceZH'],'sourcePinyin':r['sourcePinyin'],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,
   'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
   'sourceGroupEvidence':o['sourceGroupEvidence'],'originalPrintedSource':{k:r['canonicalSource'][k]for k in ('file','sha256','sourceJSONPointer')},
   'independentActualOriginalSourceObservations':ref(observations),
   'actualCurrentSourceCropPlot':o['actualCurrentSourceCropPlot'],
   'actualCompleteOriginalSourcePlot':o['actualCompleteOriginalSourcePlot'],
   'actualLocalizedSourcePhaseEvidence':ref(fine),
   'actualSourceControlPhaseEvidence':ref(controls)if note is None else None,
   'selectedCompleteOriginalUtteranceFrames16k':marks,'independentlyReviewedNeighborLimits16k':limits,
   'phonemeIdentityUnknown':False,'completeOriginalCoreUtteranceIndependentlyReviewed':True,
   'rawDifferences':[{'model':e['file'],'raw':e['rawTranscript'],'retained':True}for e in r['rawModelEvidence']],
   'allRawModelDifferencesPreserved':True,'noGlobalSubstitution':True,
   'explanation':explanation,'humanListening':False,'nativeSpeakerReview':False,
   'pronunciationToneCertified':False,'fullPhonemeCertification':False})
  if note:
   proof.update({'recordedWeakParticleContext':{'category':'fixed-complete-original-weak-particle-coarticulation',
    'actualSharedWeakTailSourceSampleRange16k':[416640,422400],
    'canonicalSeparateClearParticleClaim':False,'globalParticleRemovalApplied':False,
    'sourceCoreUnknown':False,'perCharacterTransitionAssignmentCertified':False},'studentVisibleRecordingNoteProposal':note})
  d={'id':ident,'candidateId':r['candidateId'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256'],
   'decision':'accept','sourceContextChecked':True,'acknowledgedFlags':r['flags'],'rationale':explanation,
   'sourceContextEvidence':proof,'resolvedTextHolds':r['holds'],'resolvedBoundaryHolds':[],
   'resolvedSourceHolds':[],'resolvedDecoderASRDiagnosticHolds':[],
   'sourceReportEvidence':o['currentActualReportEvidence'],'humanListening':False,
   'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,
   'fullPhonemeCertification':False}
  support.contextual_decision(r,d,ROOT);decisions.append(d)
  if note:notes.append({**{k:r[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},'canonicalZH':r['sourceZH'],'canonicalPinyin':r['sourcePinyin'],'recordingNote':note,'canonicalSeparateClearParticleClaim':False,'independentSourceEvidence':ref(observations),'actualWeakTailPhaseEvidence':ref(fine)})
 p=OUT/'two-complete-original-context-explicit-proposals.json';p.write_text(json.dumps({'schemaVersion':1,'reviewer':'acceptance_scope_plan','scriptEvidence':ref(Path(__file__)),'decisions':decisions,'sourceOrRuntimeModified':False,'newASR':False,'automaticApproval':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n')
 q=OUT/'weak-particle-student-visible-recording-context-proposal.json';q.write_text(json.dumps({'schemaVersion':1,'count':len(notes),'independentDecisionEvidence':ref(p),'entries':notes,'canonicalTextPinyinAndIdsUnchanged':True,'globalSubstitution':False,'automaticApproval':False,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'decisions':ref(p),'noticeProposal':ref(q)}))
if __name__=='__main__':main()
