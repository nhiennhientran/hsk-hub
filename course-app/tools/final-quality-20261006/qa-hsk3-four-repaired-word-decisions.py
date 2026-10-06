#!/usr/bin/env python3
"""Explicit independent decisions after actual four local and three full plots."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-four-repaired-words'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
MANUAL={
 'hsk3-fltrp-2026:l13:word02':([48400,61920],[44480,67199],
  '新crop2.8899375–4.10，独立实际原谱重读南的n起音/元音/鼻尾约3.025–3.36，方的f擦音入口约3.45与ang周期元音/鼻尾衰减至3.87，完整第一遍南方在[48400,61920]宽包络。先前旧end4.7099已进入第二遍南；新end4.10位于原3.87–4.1999停顿，第二遍南起音4.1999之后不在crop。前请客第二遍弱尾在2.78前结束，actual full source/head/nánfāng两遍与print源一致。原3.90–3.98及4.06–4.14两实际pause有DC/低频缓慢baseline以及孤立弱瞬态，真实RMS高而无目标周期谐波/声母元音，不过滤/归零/填静音。末边rawmean占能量0.85/0.999保留，不能假quiet；这是固定原背景例外。保留small南低prob0.429与两literal原raw，不把字面或DC均值单独当完整音素证明。'),
 'hsk3-fltrp-2026:l16:word04':([161200,177600],[151000,183200],
  '新crop9.95–11.12，原脚第一遍j短起音/iao元音/最后圆唇低能尾约10.075–11.10完整；特别独立谱显示弱周期尾超过producer[161200,173280]提案的10.83，故本peer包络扩为[161200,177600]，不借生产者threshold当音素末界。前一会儿第二读弱尾9.43前结束；脚第二读最早11.45之后，crop排除它。actual原二读顺序/print jiǎo/同cropsmall脚与medium脚完整一致，四真实20ms边仍<-45；只用真实源样本保全首尾，没有合成静音或重置旧词ID。'),
 'hsk3-fltrp-2026:l16:word09':([414400,432800],[404000,440960],
  '新crop25.7999375–27.11，原动物园第一读d起音、ong元音鼻尾、wu主体和yuan末鼻尾约25.90–27.05完整；旧end26.93在园弱尾，实际新end退到真实pause。原第二遍周末弱尾25.25前结束，动物园第二遍最早27.56之后，单读不借ASR重复抑制；后动物也不混入。原顺序/print dòngwùyuán、同cropsmall原動物園繁体与medium动物园保留（非NS合同，无繁简原字exact宣称），四20ms边真实quiet；字形等价仅aux，完整三音节及末鼻尾原谱已读。'),
 'hsk3-fltrp-2026:l18:word29':([194880,211360],[191680,213440],
  '新crop12.11–13.28，原目标第一读m低鼻起音与u主体约12.18–12.62，b短释放及iao周期/弱尾至13.21完整。前完成第二读弱尾在11.98前；目标第二读m最早13.34之后，原旧end13.3378125触邻起，新end13.28实际停顿排除。print mùbiāo/原完整同head顺序与两cropliteral目标一致；四真实20ms边quiet。首m鼻带和b释放都在cut内，最后圆唇/弱尾保留，不拿时戳或总体能量峰当末音素。')}
def main():
 report=BASE/'audio-review/hsk3-four-weak-repairs-paired-01.json';obsfile=OUT/'four-repaired-word-independent-actual-observations.json'
 assert sha(obsfile)=='412d748285f0551354cade6cf03567ac81075d2b607dc1294278a71104a744b2'
 obs={r['id']:r for r in json.loads(obsfile.read_text())['targets']};rows=json.loads(report.read_text())['targets']
 sp=importlib.util.spec_from_file_location('four_repaired_decision',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 decisions=[];results=[]
 for r in rows:
  o=obs[r['id']];marks,limits,explanation=MANUAL[r['id']]
  assert limits[0]<=r['sourceSampleRange16k'][0]<=marks[0]<marks[1]<=r['sourceSampleRange16k'][1]<=limits[1]
  proof={**{k:r[k]for k in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},'sourceText':r['sourceZH'],
   'sourcePinyin':r['sourcePinyin'],'canonicalPrintedSource':r['canonicalSource'],'sourceGroupEvidence':o['wholeSourceEvidence'][0],
   'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'originalRepeatedReadingsChecked':True,
   'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
   'actualIndependentObservationEvidence':{**ref(obsfile),'id':r['id']},'actualOriginalWholeSourceSpectrum':o['actualCompleteOriginalSourcePanel'],
   'actualOriginalCropAndNeighborSpectrum':o['actualOriginalSourcePanel'],'manuallyObservedForegroundEnvelope16k':marks,
   'independentlyReviewedNeighborLimits16k':limits,'rawDifferences':[{'file':m['file'],'sha256':m['sha256'],'actualInference':m['actualInference'],
    'modelRepository':m['modelRepository'],'modelRevision':m['modelRevision'],'sourceText':r['sourceZH'],'observedRawText':m['rawTranscript'],
    'warningsRetained':m['warningSegmentsUnchanged'],'rawRetainedVerbatim':True}for m in o['actualCropModelEvidence']],
   'explanation':explanation,'fullPhonemeCertification':False}
  d={'id':r['id'],'sourceSampleRange16k':r['sourceSampleRange16k'],'decision':'accept','sourceContextChecked':True,'rationale':explanation,
   'sourceContextEvidence':proof,'acknowledgedFlags':r['flags'],'humanListening':False,'nativeSpeakerReview':False,
   'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,'productionApproved':False,
   'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True}
  v.contextual_decision(r,d,ROOT)
  if r['holds']:
   observed={'sourceTrack':r['sourceTrack'],'sourceSHA256':r['sourceSHA256'],'sourcePCM_SHA256':r['sourcePCM_SHA256'],
    'plots':[{**o['actualOriginalSourcePanel'],'id':r['id'],'sourceSampleRange16k':r['sourceSampleRange16k'],'cropPCM_SHA256':r['cropPCM_SHA256']}],
    'backgroundReferenceWindows':o['twoIndependentActualOriginalPauseWindows'],'originalSamplesUnaltered':True}
   wf=OUT/'nanfang-actual-independent-source-boundary-observations.json';wf.write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
   d['boundaryDecisionEvidence']={**{k:proof[k]for k in ('sourceText','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')},
    'category':'continuous-original-background','actualWaveformAndSpectrumReviewed':True,'completeTargetPhonemesRetained':True,
    'neighborTargetSpeechExcluded':True,'sourceOrderChecked':True,'originalBackgroundPreserved':True,'noSyntheticPadding':True,
    'rawASRTimestampsAreAuxiliaryOnly':True,'continuousBackgroundDistinctFromTargetVoice':True,'waveformObservation':ref(wf),
    'targetForegroundExtent16k':marks,'independentlyReviewedNeighborLimits16k':limits,'explanation':explanation,
    'startBoundaryExplanation':'真实start2.8899375在请客第二读后/南方第一读n前原pause，完整n起音3.025以后。',
    'endBoundaryExplanation':'真实end4.10在第一读方ang弱尾3.87后、第二南4.1999前；保留本来DC/低频原背景，不把高raw-RMS伪改quiet。'}
   v.boundary_decision(r,d,ROOT)
  decisions.append(d);results.append({'id':r['id'],'status':'passed','preservedOriginalHolds':r['holds'],'actualFourEdgeRMSDbFS20ms':r['actualEdgeRMSDbFS20ms']})
 path=OUT/'explicit-four-repaired-word-peer-recommendations.json';path.write_text(json.dumps({'status':'explicit-independent-peer-scopes-awaiting-central-compile',
  'reviewer':'acceptance_scope_plan','reviewReportEvidence':ref(report),'observationEvidence':ref(obsfile),'scriptEvidence':ref(Path(__file__)),
  'decisions':decisions,'counts':{'ordinaryScopes':3,'boundedOriginalBackgroundScopes':1,'totalIndependentRecommendations':4},
  'authorityModified':False,'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True},ensure_ascii=False,indent=2)+'\n')
 validation=OUT/'read-only-four-repaired-word-peer-validation.json';validation.write_text(json.dumps({'status':'passed','recommendationEvidence':ref(path),
  'validatorEvidence':ref(ROOT/'tools/final-quality-20261006/review-decisions.py'),'results':results,'passed':len(results),'authorityModified':False},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'recommendations':ref(path),'validation':ref(validation)}))
if __name__=='__main__':main()
