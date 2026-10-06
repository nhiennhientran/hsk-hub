#!/usr/bin/env python3
"""Explicit individually read original recording/context recommendations."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-optional-r'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
# Per-ID observation scopes were read from the eight actual PCM waveform/spectrum sheets.
# Approximate foreground windows aid reproducible context review, not phoneme timestamp certification.
NOTES={
'l01:text2:line4':([14.88,18.87],'原我好像/在哪/看到过这个箱子首子句与是不是有人拿错了末问句两组语音均完整，17.0附近自然子句暂停保留；前箱子描述已结束、后我们快找谁问一下在cut后。哪的完整原a韵/连下看到过保留，不用无儿ASR字证明r不存在。','哪儿'),
'l02:text3:line2':([5.88,9.56],'原你可以拿走这张菜单与看看下次还吃点什么两个语音组完整，前再来吃一次尾已在cut前，后不用拿菜单的初音在cut后；点位于第二组内部，后什么整个原声及句尾衰减都保留。整轨末字幕hallucination原样保留，不借其末虚字证明当前crop。','点儿'),
'l03:text1:line1':([.86,5.34],'初中离家/有点远首分句与咱们换一个近点的房子吧第二分句均为本原轨首行实声，内部暂停和吧尾完整，下一好啊 onset在当前cut后。两个点原核心韵均在句内，源录音/书中小雪与房子语义对应，不是从词序推未读字。','有点儿、近点儿'),
'l04:text1:line1':([.43,2.72],'真实原轨帧0开头有自身leading静音，首这个假期/咱们/去哪玩玩吧直到吧尾的整声组完整；下一好啊始于3.77附近，未进入2.9结束cut。beforeStart因物理frame0不可用不伪造负帧静音。小actualraw含哪儿、medium省儿都保留，只接受完整合法自然原读而不宣称r证书。','哪儿'),
'l04:text1:line4':([13.37,15.15],'现在去海边与有点冷各声相及冷的鼻韵尾完整；原边与点为本句内部，cut后实际pause后才是那去草原吧，cut前上一海边住几天末问已完。原core点/冷语流兼容书中内容，原始无儿预测未被改写。','有点儿'),
'l04:text1:line5:sentence2':([18.44,19.68],'同父行首那去草原吧在18.2当前start之前结束，草原一点也不冷独立第二句的草原起声、点至也连续韵与冷鼻尾全部在current范围内；末实际静音到后主意好，父子分界没有拿whole模型timestamp替代真实source谱。','一点儿'),
'l04:text4:line2':([8.27,16.32],'我们到的时候/天已经黑了/但是司机小李一直在机场等我们/一点也没着急四完整语流群逐一与本source全文对照；首w及末急韵在cuts内，前晚点了尾和后他特别热情开头排除。小李无不同名字、无数量或漏分句矛盾；点处于倒数语流内部，未裁掉可选尾。','一点儿'),
'l06:text2:line2:sentence2':([6.45,10.62],'父句我看见了在当前6.18秒start前结束，马上就到了/这条路车很多/您小心点三个原声组及点的周期尾在10.67cut前完整，后好你们还有一个小时从11.1附近开始排除；您保持原句和printednín身份而无字符边界证书。点为原utterance最后韵，末静音是真原样本。','点儿'),
'l07:text1:line1':([1.12,5.91],'真实首行自行车/小雪八岁买的完整首大声组、看起来有点旧了第二声组保留，前sourceleading实静音及后是啊开启间隔可分。八岁原字及双raw/whole一致，无数值冲突；点与旧内部transition保留，不以无儿字代替r判断。','有点儿'),
'l07:text2:line3':([9.98,11.64],'前更好看完整尾在9.2之前，当前裙子的起群/比短裤/贵一点周期末韵至11.64全部在9.38–11.7cuts内，后贵多少在本quiet后开始。句末点的实际periodic尾没有在clip外另缺一读，不要求每个可选儿音独立音节。','一点儿'),
'l07:text3:line4:sentence2':([16.72,19.84],'前是挺甜的在当前16.5cut前已结束，帮我选个大点的到内部pause、再来两斤香蕉整末分句及焦韵在19.88cut前完整。实际两斤核心/原whole与两个actualraw一致，不通过数量谐音替换；点与的共过渡完全保留。','大点儿'),
'l07:text3:line6':([24.27,26.50],'原我买了这么多与便宜点吧两组完整，句中短停顿与吧末尾保留；cut前一共五十八块五毛已结束、cut后您给我55吧另声组未进入。整轨别句数字不拿作本crop放过，当前句无数量/名词冲突。点/吧自然韵过渡源样本不变。','点儿'),
'l07:text4:line1:sentence2':([7.45,10.87],'父首这些天新家看电视发现问题的末声在current7.1start前结束，房子大了及电视看起来就有点小两组首尾都保留；后这个电视开头在11.8附近。点处于就有点小内，xiao尾完整到10.87，未剪断儿化或邻字。','有点儿'),
'l08:text2:line1:sentence2':([1.77,3.97],'同父句你怎么了在1.2前落尾，current1.55之后看上去有点不舒服独立第二句起看/末服保留；后昨天游完泳从4.9附近另起未混入。点与不连读区是原source内部完整样本，不要求把弱可选r全局补作一个字音。','有点儿'),
'l08:text3:line3':([11.70,14.12],'你看起来首组、一点也不像病人连续主体及人鼻尾完整，前需要住院检查尾在11前结束、后是啊句另起在15附近。病人原字/两个raw/全轨一致，当前一点儿与也连接完整source而非未读核心。','一点儿'),
'l08:text4:line4:sentence2':([28.82,31.62],'父首回家注意末声在28.2前结束，current28.39之后希望我的腿能与快一点好完整两声组及好ao尾至31.62皆保留；31.85cut后仍原轨背景尾而非新语音。点内韵及好初声连接留全，不以原source文件结束代替实际cut尾检查。','一点儿'),
'l10:text2:line2':([6.39,8.55],'首我觉得历史有点难声组及你呢第二短问声组都完整，原6.04–8.73cuts两边实际静音，前考试怎么样与后数学考试另声组排除。难完整鼻韵及你问句没有切入错题语境，原两crop/whole省儿原样保存。','有点儿'),
'l10:text3:line6:sentence2':([26.82,29.16],'同父我终于懂了在26.25前结束，当前26.66后这些句子与一点也不难完整第二句；末难鼻韵落尾在29.18cut内完整，后我也明白了另起排除。点与也内部自然连接全部保留，source原书句子含义一致。','一点儿'),
'l11:text1:line7':([29.36,33.72],'那到时候咱们早点过去完整第一群、你帮我把电脑接好吧第二群都保留，31.7前后自然暂停；前会议室电脑回答尾在28.3前结束，末吧韵在33.8cut前落尾，后只真实原轨尾背景。早点原核心与过去连读完全在source内部。','早点儿'),
'l11:text2:line7':([23.50,27.20],'听得见声音第一声群、但是声音有点小及听不清楚第二群的末楚fric/周期尾都在27.23cut内，start22.91在前现在呢之后真实quiet；下一看来没有办法另句27.8后开启。点处于句内有点小，主声音/听清语义与原source一致无核心换词。','有点儿')}
def main():
 obsfile=OUT/'first20-independent-actual-source-observations.json';obs=json.loads(obsfile.read_text());decisions=[];annotations=[]
 for t in obs['targets']:
  tail=t['id'].split(':',1)[1];voice,note,form=NOTES[tail];a,b=t['sourceSampleRange16k'];assert a/16000<=voice[0]<voice[1]<=b/16000
  rationale=note+' 已独立实际读4个local source/crop谱页与4个complete原轨页并逐ID对print/py、whole-source原raw和双crop原raw。精切接受范围为固定完整合法原录音及可选儿化自然语流variant；不把任一ASR省儿或脚本字符删儿证明r缺失，也不新增canonical-r/native/全音素/声调认证门。教材ZH/pinyin/IDs不动，学生明确原录音自然读法；若需声学canonical-r证书此scope不提供。'
  rawdif=[{**{k:m[k]for k in ['file','sha256','actualInference','modelRepository','modelRevision']},'sourceText':t['sourceText'],'observedRawText':m['rawTranscript'],'rawRetainedVerbatim':True,'decoderWarningsRetained':m['warningSegmentsRetained'],'holdsUnchanged':m['holdsUnchanged'],'flagsUnchanged':m['flagsUnchanged']}for m in t['actualCropModelEvidence']]
  annotation='教材标注：'+form+'；本段按原录音的自然语流读法播放。'
  variant={k:t[k]for k in ['id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};variant.update({'canonicalPrintedZH':t['sourceText'],'canonicalPrintedPinyin':t['sourcePinyin'],'canonicalPrintedSource':t['canonicalPrintedSource'],'sourceOriginalCoreUtteranceComplete':True,'sourceSamplesAndCanonicalTextUnchanged':True,'studentVisibleAnnotationZH':annotation,'recordedPronunciationDifference':'可选儿化在自然连读中呈现；此审只闭合完整合法原core/utterance，不额外声称canonical-r音素逐一认证或声学r绝对缺失。','scope':'fixed-complete-legal-original-recording-optional-rime-variant-context','acousticCanonicalRClaim':False,'rAbsenceAbsoluteNativeClaim':False,'annotationSuggestedNotRuntimeModified':True,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
  proof={k:t[k]for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256','sourceText','sourcePinyin']};proof.update({'canonicalPrintedSource':t['canonicalPrintedSource'],'sourceGroupEvidence':t['sourceGroupEvidence'],'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'rawDifferences':rawdif,'actualOriginalObservationEvidence':{**ref(obsfile),'id':t['id']},'actualCurrentSourceCropSpectrum':t['actualCurrentSourceCropPlot'],'actualCompleteOriginalSourceSpectrum':t['actualCompleteOriginalSourcePlot'],'actualFourEdgeRMSDbFS20ms':t['actualFourEdgeRMSDbFS20ms'],'actualForegroundObservationSecondsApproximateNotPhonemeBoundaries':voice,'wholeSourceWordsIntersectingCurrentCropAuxiliaryOnly':t['wholeSourceWordsIntersectingCurrentCropAuxiliaryOnly'],'recordedPronunciationVariantEvidence':variant,'explanation':rationale,'acousticCanonicalRClaim':False,'fullPhonemeCertification':False})
  d={k:t[k]for k in ['id','candidateId','sourceSampleRange16k','cropPCM_SHA256']};d.update({'decision':'accept','category':'fixed-recorded-rime-variant-context','recommendationOnly':True,'sourceContextChecked':True,'rationale':rationale,'sourceContextEvidence':proof,'resolvedTextHolds':t['holdsUnchanged'],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'resolvedDecoderASRDiagnosticHolds':[],'acknowledgedFlags':t['flagsUnchanged'],'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,'productionApproved':False});decisions.append(d);annotations.append(variant)
 out=OUT/'explicit-first20-complete-original-rime-context-peer-recommendations.json';dump(out,{'status':'explicit-independent-recommendations-awaiting-central-compile','reviewer':'acceptance_scope_plan','reviewReportEvidence':obs['targets'][0]['currentActualReportEvidence'],'observationEvidence':ref(obsfile),'scriptEvidence':ref(Path(__file__)),'decisions':decisions,'counts':{'recommendations':20,'runtimeApprovals':0},'sourceModified':False,'newASR':False,'runtimeModified':False,'acousticCanonicalRClaim':False,'allHumanNativeToneDeviceAndFullPhonemeCertificationsFalse':True})
 annotationfile=OUT/'first20-student-visible-optional-rime-context-proposal.json';dump(annotationfile,{'status':'proposal-for-root-display-overlay-not-runtime-write','decisionsEvidence':ref(out),'entries':annotations,'count':20,'canonicalTextPinyinIDsAndHistoryPreserved':True,'sourceAudioAndFramesPreserved':True})
 s=importlib.util.spec_from_file_location('h3_optional_validate',ROOT/'tools/final-quality-20261006/review-decisions.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);reports={};validated=[]
 for t,d in zip(obs['targets'],decisions):
  rp=ROOT/t['currentActualReportEvidence']['file'];r=reports.setdefault(str(rp),json.loads(rp.read_text()));row=next(z for z in r['targets']if z['id']==t['id']and z['candidateId']==t['candidateId']and z['sourceSampleRange16k']==t['sourceSampleRange16k']);m.contextual_decision(row,d,ROOT);validated.append(d['id'])
 val=OUT/'read-only-first20-source-context-validation.json';dump(val,{'status':'actual-context-schema-and-identity-validation-passed-not-authority','decisionEvidence':ref(out),'IDs':validated,'passed':len(validated),'runtimeModified':False});print(json.dumps({'proof':ref(out),'validation':ref(val),'annotation':ref(annotationfile)}))
if __name__=='__main__':main()
