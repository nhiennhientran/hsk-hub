#!/usr/bin/env python3
"""Seven explicit second-reading no-speech-proxy peer recommendations.

Manual full-original reading maps and component observations were read from the
actual source spectrum and each exact crop panel. This script preserves those
decisions; it neither infers decisions from transcripts nor promotes authority.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'course-app/docs/final-quality-20261006/audio-context-peer-hsk2-words/second7'
OBS = OUT / 'second7-actual-original-observation-index.json'

# Broad, manually inspected complete original foreground envelopes, seconds.
# These include weak onsets/decays outside the producer's threshold runs.
MAPS = {
 '2-6':[(.90,1.53),(2.12,2.88),(4.36,4.98),(5.43,6.16)],
 '4-4':[(.30,1.30),(1.72,2.78),(3.76,4.64),(5.07,6.08),(6.66,7.31),(7.68,8.40),(8.91,9.80),(10.24,11.20),(11.46,12.56),(12.82,14.15)],
 '4-8':[(.47,1.45),(1.75,2.87)],
 '8-4':[(.54,1.23),(1.70,2.41),(3.04,4.21),(4.55,5.82),(6.40,7.47),(7.90,9.07)],
 '8-6':[(.35,1.10),(1.51,2.35),(2.64,3.68),(3.91,5.04),(5.44,6.35),(6.74,7.69),(8.26,8.84),(9.36,9.93)],
 '9-2':[(.60,1.10),(1.88,2.49),(2.86,3.82),(4.18,5.16),(5.48,6.45),(6.80,7.83),(8.45,9.22),(9.73,10.56),(11.15,11.81),(12.39,13.17),(13.75,14.44),(15.01,15.74),(16.32,17.10),(17.45,18.09)],
 '14-6':[(.48,1.26),(1.78,2.68),(3.19,4.27),(4.44,5.67),(6.11,7.15),(7.38,8.48)],
}
NOTES = {
 '票': (
  '原印刷票 piào；2.12–2.20 秒的低幅高频起段位于强周期声之前，2.05 秒裁点在真实暂停内，未用 2.17 秒阈值起点裁掉 p 的送气起段。',
  '其后约 2.21–2.83 秒为连续有声 iao 主体与滑动衰减，尾至 2.88 秒已退回背景；2.96 秒 cut 保留该尾。声区是一个单音节，不含别的起段。',
  '全原轨先票两读，再别两读；选择第二票 [2.12,2.88]，第一票末 1.53 秒与第一别起 4.36 秒分别在裁片外。整源 raw 票别仅支持原词身份，实际双读由源波谱逐相位观察。'),
 '白色': (
  '原印刷白色 báisè；第二读 1.72 秒左右的 b 瞬态及接续周期声均在 1.66 秒开始之后；原第一白色末 1.30 秒已分开。',
  'bai 有声主体约 1.78–2.29 秒，se 擦音约 2.31–2.43 秒接 2.45–2.74 秒周期声及衰减，完整两相位至 2.78 秒在 2.86 秒 cut 前；不能只用有声音高忽略 s 擦音。',
  '完整原轨逐相位白色、因为、试、红色、所以各两读；选择首词的第二读。整源 raw 因为是 的是/试同音字保留不改，不影响当前白色原词身份；因为第一读 3.76 秒起，未拼入。'),
 '颜色': (
  '原印刷颜色 yánsè；单词原轨只有两次颜色。第二读低幅开始约 1.75 秒，渐进到约 1.78 秒的 yan 主体；1.70 秒 cut 保留该起段，不能由强峰 1.86 秒当音节起点。',
  'yan 约 1.78–2.20 秒及其鼻化收束后，se 约 2.30–2.84 秒高频/周期相位完整至 2.87 秒背景；2.96 秒 cut 在末尾后。两个音节均在同一第二读，不含另一读。',
  '全 3.168 秒原轨第一颜色约 [.47,1.45]、第二约 [1.75,2.87]，独立原声相位/暂停与印刷唯一颜色头一致；源 raw 颜色只辅助身份，不承担次数或首尾界。'),
 '爱情片': (
  '原印刷爱情片 àiqíngpiàn；第二读从约 4.55 秒低幅起段进入爱 4.60–4.89 秒主体，4.48 秒 cut 前后实核暂停。三音节首段并非从情的强瞬态开始。',
  '情含约 5.01–5.11 秒送气擦音及 5.13–5.25 秒有声/鼻尾，片有约 5.32–5.41 秒 p 起段及 5.44–5.76 秒 ian 有声/尾鼻化，退回背景至 5.82 秒；5.88 秒 cut 保留全尾。',
  '原源记得、爱情片、有意思各两读；第二爱情片 [4.55,5.82] 与第一读末 4.21 秒、有意思首读 6.40 秒隔开。三相位与印刷原词及本 crop 三份原字观察一致，后有意思未并入。'),
 '点': (
  '原印刷点 diǎn；第二读约 1.51 秒微弱起段/1.56 秒瞬态在 1.45 秒 cut 内，不能取强有声约 1.61 秒抹掉 d 的起始。',
  '约 1.61–2.12 秒 ia 有声主体到 2.10–2.32 秒鼻尾/衰减，完整 foreground 至 2.35 秒；2.44 秒 cut 保留鼻尾后真实暂停。单有声区不是数字或英文点读的替代。',
  '全原轨点、虽然、但是、花各两读；本第二点 [1.51,2.35] 与第一点末 1.10 秒、虽然第一读 2.64 秒分开。整源 raw 点 虽然 但是 花逐头身份仅作辅助，源实际双读逐相位保留。'),
 '旁边': (
  '原印刷旁边 pángbiān；第二读约 4.18 秒起，约 4.20 秒 p 瞬态及 4.23 秒送气先于 4.29 秒周期声，4.13 秒 cut 不裁该弱起段。',
  'pang 约 4.29–4.60 秒主体/鼻尾，bian 约 4.73–5.10 秒主体及末鼻尾衰减至 5.16 秒；5.23 秒 cut 在完整词末之后。两个音节的分相不作为两次旁边，前后相位组成一次原读。',
  '完整源坏、旁边、男孩儿、这样、个子、那么、高各两读；第二旁边 [4.18,5.16] 与第一旁边末 3.82 秒、男孩儿首读约 5.48 秒隔开。整源 男孩 省儿的预测完整保留，不认证邻词儿化或最后高的旧裁片。'),
 '房子': (
  '原印刷房子 fángzi；第二房子弱 f 高频起段约 1.78–1.90 秒，先于约 1.91 秒的强声，1.75 秒 cut 后20ms -46.335 dBFS 的真实弱背景窗已保留，未把强阈值组 1.91 秒当音素起点。',
  'fang 主体约 1.94–2.37 秒包含鼻化收束，zi 约 2.45–2.66 秒相位及衰减至 2.68 秒；2.74 秒 cut 留全尾及真实暂停。不能由一个 F0 nucleus 宣称全部 f/ng/zi 音素或声调认证。',
  '完整源房子、小孩儿、女孩儿各两读；本第二房子 [1.78,2.68] 与第一房子末 1.26 秒及小孩儿首读 3.19 秒分开。整源 小孩/女孩 省儿原样保留，本决策只当前房子，不扩大到邻词儿化。'),
}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p): return {'file':str(p.relative_to(ROOT)), 'sha256':sha(p)}
def dump(p, o): p.write_text(json.dumps(o, ensure_ascii=False, indent=2)+'\n')

def main():
    assert sha(OBS)=='9ea64936c60dac08ecc2e3e05c78d4139b4ee6478a1a765830ccfc61631bfe16'
    observed=json.loads(OBS.read_text())
    pool=json.loads((ROOT/observed['sourcePoolEvidence']['file']).read_text())
    assert sha(ROOT/observed['sourcePoolEvidence']['file'])==observed['sourcePoolEvidence']['sha256']
    rows={x['currentProducerPreflight']['id']:x['currentProducerPreflight'] for x in pool['targets']}
    decisions=[]
    for t in observed['targets']:
        row=rows[t['id']]; track=Path(t['sourceTrack']).stem; bounds=[[round(s*16000),round(e*16000)] for s,e in MAPS[track]]
        heads=t['canonicalHeads']; selected=t['selectedHeadOrdinal0Based']*2+1; marks=bounds[selected]
        limits=[bounds[selected-1][1],bounds[selected+1][0] if selected+1<len(bounds) else t['originalSourceSampleCount16k']]
        onset,rime,reading=NOTES[t['sourceText']]
        proof={k:t[k] for k in ['sourceText','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
        proof.update({
          'category':'triple-literal-noSpeech-proxy-review',
          'completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,'sourceOrderChecked':True,
          'originalPrintedPronunciationChecked':True,'allASRWarningsRetained':True,'noSyntheticPadding':True,'phonemeIdentityUnknown':False,
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,
          'explanation':'逐ID独立核原书ZH/py、真实全源/当前第二读局部波谱、整读弱起段/末尾和两侧邻读。三份实际 crop raw 原字一致仅为辅助；保留高 no_speech_prob 及全部模型原文/flags，概率诊断不代表真实无声，不自动降低阈值。决定范围为当前完整原读及邻排除，不含native、tone或完整音素认证。',
          'onsetExplanation':onset,'rimeAndFinalExplanation':rime,'originalReadingExplanation':reading,
          'independentlyVerifiedCTCSupplementalEvidence':observed['independentlyVerifiedCTCSupplementalEvidence'],
          'originalPrintedSource':{k:t['canonicalPrintedSource'][k] for k in ['file','sha256','sourceJSONPointer']},
          'selectedCompleteOriginalReadingFrames16k':marks,'independentlyReviewedNeighborLimits16k':limits,
          'sourceReadingEvidence':{'canonicalHeads':heads,'selectedHeadOrdinal0Based':t['selectedHeadOrdinal0Based'],'selectedRepetition1Based':2,
           'orderedOriginalReadings':[{'head':heads[i//2],'readingOrdinal':i%2+1,'sourceSampleRange16k':v} for i,v in enumerate(bounds)],
           'wholeSourceEvidence':t['wholeSourceEvidence'],'manualSourceMapNotASRTimestamps':True},
          'waveformObservation':t['waveformObservation'],'actualSyllableFeatureEvidence':t['actualSyllableFeatureEvidence'],
          'independentCompleteOriginalSourcePlot':t['completeOriginalSourcePlot'],'actualRawEvidenceUnchanged':True,
        })
        decisions.append({'id':row['id'],'sourceSampleRange16k':row['sourceSampleRange16k'],'decision':'accept',
          'resolvedTextHolds':[],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],
          'resolvedDecoderASRDiagnosticHolds':['crop-ASR-hallucination-or-no-speech-warning'],'acknowledgedFlags':row['flags'],
          'tripleLiteralNoSpeechDecisionEvidence':proof,'rawEvidenceUnchanged':True,'productionApproved':False,
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    output=OUT/'explicit-second7-triple-literal-peer-recommendations.json'
    dump(output,{'schemaVersion':1,'status':'independent-explicit-seven-original-second-reading-recommendations-awaiting-compiler',
     'reviewer':'acceptance_scope_plan','observationIndexEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
     'decisions':decisions,'counts':{'scopedRecommendations':7,'held':0,'ordinary13NotRepeated':13},
     'newInferencePerformed':False,'sourceOrProposalModified':False,'automaticProductionApproval':False,
     'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    validator_path=ROOT/'tools/final-quality-20261006/review-triple-literal.py'
    spec=importlib.util.spec_from_file_location('peer_read_only_triple_validator',validator_path)
    validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
    results=[]
    for decision in decisions:
        validator.validate(rows[decision['id']],decision,ROOT)
        results.append({'id':decision['id'],'sourceSampleRange16k':decision['sourceSampleRange16k'],'status':'read-only-real-source-raw-feature-validation-passed'})
    report=OUT/'read-only-second7-triple-validation.json'
    dump(report,{'status':'passed','recommendationEvidence':ref(output),'validatorEvidence':ref(validator_path),
      'count':7,'failures':0,'results':results,'authorityModified':False,'productionApproved':False})
    print(json.dumps({'recommendations':ref(output),'validation':ref(report),'count':7},ensure_ascii=False))

if __name__=='__main__':main()
