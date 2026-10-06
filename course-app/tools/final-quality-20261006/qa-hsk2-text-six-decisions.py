#!/usr/bin/env python3
"""Explicit residual-source decisions; genuine unknowns remain held."""
import hashlib,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk2-words/residual-six'
OBS=OUT/'residual-six-actual-observation-index.json'
PHASES={3:(7.18,7.76,8.32),61:(6.38,7.00,7.35),79:(3.48,4.12,4.52),86:(9.57,9.87,10.42),89:(.60,1.22,1.70),93:(3.43,4.07,4.60)}
NOTES={
 3:('hold','原接 jiē；crop small七一/medium鸡/CTC七未明确当前完整jie，i/ie及送气声母差异不能靠全文接或第4词顺序覆盖。谱显示首读擦音及发声主体完整、第二读排除，但实际当前jie声韵身份仍未知，保留TEXT；不把鸡或七全局改成接。'),
 61:('accept','原游 yóu；两Whisper及CTC当前raw均有，通常yǒu与原yóu声調不同，原整源游保留该源书写身份。原7-6确有跑步、游泳、游各两读，当前独立游首读不含前游泳末泳或后第二游。局部源谱约6.38秒渐进y起段、6.45–6.94秒连续ou滑动及衰减至7.00秒完整，第二游约7.35秒才起。仅解除同源书写有/游差异，明确不认证实际二/三声或将有当严格同调。'),
 79:('accept','原词 cí；small磁在该cí同音，medium死sǐ不同声母/声调、CTC此通常cǐ不同声调，三者原字完整保留。整源考试 词 本子 错 题 还是逐词支持当前词；第二词首读约3.48秒弱高频/送气头段先于3.67秒周期、末舌尖元音声体/衰减至4.12秒，4.22秒cut留全尾。后第二词约4.52秒独立，不含本子起音；small同crop磁与真实完整第一源读只作此cí书写限定，不从此/死推定录音tone错。'),
 86:('hold','原着 zhe轻声；当前两Whisper真、CTC这，完整原轨也真，不能说整源着已原字观察。谱只闭合第五词第一短发声相位及邻排除；zhe/zhēn鼻尾与原轻声完整身份仍未知，保留TEXT。原头/疼/经常/动之后的词序只辅助目标，不能代替实际韵尾。'),
 89:('hold','原进 jìn；small親常qīn、medium敬jìng、CTC剑jiàn均没有明确当前完整jìn。整源禁jìn仅原同音书写辅助，但原模型可能压第二读，不得用整个禁词头覆盖当前首读n/ng及i/ian声韵冲突；谱完整首读主体/衰减/邻排除已核，当前完整jìn仍unknown，保留TEXT。'),
 93:('accept','原晴 qíng；两Whisper、CTC及整源raw都请，通常qǐng与原qíng同声母韵尾但非同声調，差异完整保留。真实原12-2事情、晴、正各两读，本第二词第一读约3.43秒q擦音/送气先于3.61秒周期，约3.64–4.00秒i/ng主体及衰减至4.07秒处于cut内，后第二晴4.60秒才起。仅按本课源身份及完整同声韵当前原读解释请/晴书写，实际tone仍未认证，不将请字预测直接定为原声第三声。'),
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def main():
    assert sha(OBS)=='ca46ca59cf5f6c5c6ed3fb3e0e5f86cc6fb7f08fccf5cbae7ac293bbebfba659'
    obs=json.loads(OBS.read_text());pool=json.loads((ROOT/obs['sourcePoolEvidence']['file']).read_text());decisions=[]
    for t in obs['targets']:
        i=t['poolOrdinal'];status,note=NOTES[i];marks=[round(v*16000)for v in PHASES[i][:2]];nextvoice=round(PHASES[i][2]*16000)
        a,b=t['sourceSampleRange16k'];assert a<=marks[0]<marks[1]<=b<=nextvoice
        heads=t['printedHeadsInOriginalSourceOrder'];hi=next(j for j,h in enumerate(heads)if h['sourceZH']==t['sourceText']);raw=[{**{k:m[k]for k in ['file','sha256','modelRepository','modelRevision']},'sourceText':t['sourceText'],'observedRawText':m['rawTranscript'],'rawRetainedVerbatim':True}for m in t['actualCropModelEvidence']]
        rationale=note+f" 手工宽包络frames={marks}，后第二读最早前景约{nextvoice}；此为真实原谱观测，不是Whisper/CTC词时间，原四边20ms RMS={t['actualEdgeRMSDbFS20ms']}均遵既有-45dBFS。全6源及6局部panel独立读，静音/印刷源序均不单独证明音素。"
        proof={k:t[k]for k in ['sourceText','sourcePinyin','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
        proof.update({'canonicalPrintedSource':t['canonicalPrintedSource'],'sourceGroupEvidence':t['sourceGroupEvidence'],
          'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'originalRepeatedReadingsChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,
          'actualOriginalPCMObservation':{**ref(OBS),'id':t['id']},'actualOriginalWholeSourceSpectrum':t['actualCompleteOriginalSourceWaveformSpectrum'],'actualCurrentCropSourceSpectrum':t['actualSourceWaveformAndSpectrum'],
          'actualFourEdgeRMSDbFS20ms':t['actualEdgeRMSDbFS20ms'],'manuallyObservedForegroundEnvelope16k':marks,'manuallyObservedFollowingReadingEarliestForeground16k':nextvoice,
          'sourceHeadOrdinalOneBasedAuxiliaryOnly':hi+1,'originalCurrentReadingOrdinal':1,'actualCTCWordIdentityAuxiliaryOnly':t['actualCTCAuxiliaryOnly'],
          'CTCTimestampsNeverUsedForPhonemeOrBoundaryMarks':True,'rawDifferences':raw,'explanation':rationale,'fullPhonemeCertification':False})
        decisions.append({'id':t['id'],'poolOrdinal':i,'sourceSampleRange16k':t['sourceSampleRange16k'],'decision':status,'category':'retained-tone-source-text-scope' if status=='accept'else'held-current-crop-phoneme-identity-unknown',
          'recommendationScope':'only exact original first-reading source-context TEXT; no tone, full-phoneme, native, human or device certificate',
          'sourceContextChecked':True,'rationale':rationale,'sourceContextEvidence':proof,'resolvedTextHolds':t['holdsUnchanged']if status=='accept'else[],
          'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'retainedHolds':t['holdsUnchanged']if status=='hold'else[],'acknowledgedFlags':t['flagsUnchanged'],
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,
          'rawEvidenceUnchanged':True,'originalGeometryUnchanged':True,'productionApproved':False})
    output=OUT/'explicit-residual-six-peer-recommendations.json'
    dump(output,{'schemaVersion':1,'status':'explicit-independent-source-context-recommendations-awaiting-central-review','reviewer':'acceptance_scope_plan',
      'sourcePoolEvidence':obs['sourcePoolEvidence'],'actualObservationEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),'decisions':decisions,
      'counts':{'reviewed':6,'scopedAcceptRecommendations':3,'genuineCurrentPhonemeUnknownHeld':3},'excludedPreviouslyAcceptedIDs':True,
      'newInferencePerformed':False,'sourceOrProposalModified':False,'productionApproved':False,'humanListening':False,'nativeSpeakerReview':False,'fullPhonemeCertification':False})
    validatorpath=ROOT/'tools/final-quality-20261006/review-decisions.py';spec=importlib.util.spec_from_file_location('context_read_only',validatorpath);validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
    valid=[]
    for d in decisions:
        if d['decision']=='accept':validator.contextual_decision(pool['targets'][d['poolOrdinal']],d,ROOT);valid.append(d['id'])
    report=OUT/'read-only-residual-three-context-validation.json'
    dump(report,{'status':'passed','recommendationEvidence':ref(output),'validatorEvidence':ref(validatorpath),'count':3,'failures':0,'validatedIDs':valid,'authorityModified':False})
    print(json.dumps({'recommendations':ref(output),'validation':ref(report),'counts':{'acceptedScopes':3,'heldUnknown':3}}))
if __name__=='__main__':main()
