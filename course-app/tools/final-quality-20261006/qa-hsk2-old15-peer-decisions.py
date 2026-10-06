#!/usr/bin/env python3
"""Fifteen explicit strict-raw soleNS recommendations, no inference or promotion."""
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk2-words/old15'
OBS=OUT/'old15-actual-original-observation-index.json'
spec=importlib.util.spec_from_file_location('seven_explicit_source_maps',Path(__file__).with_name('qa-hsk2-second7-peer-decisions.py'))
seven=importlib.util.module_from_spec(spec);spec.loader.exec_module(seven)
MAPS={**seven.MAPS,
 '1-8':[(.39,1.24),(1.61,2.66),(3.02,3.99),(4.34,5.37),(5.84,6.64),(7.00,7.70),(8.13,8.86),(9.40,10.13),(10.74,12.01),(12.60,14.11)],
 '3-2':[(.82,1.59),(2.09,2.97),(3.91,4.51),(5.20,5.90),(6.48,6.99),(7.39,8.04)],
 '5-8':[(.55,1.30),(1.72,2.48),(2.85,3.88),(4.10,5.30)],
 '12-6':[(.50,1.74),(2.04,3.38),(3.70,4.78),(5.18,6.39),(6.87,7.48),(7.95,8.64)],
 '14-4':[(.40,1.33),(1.77,2.83),(3.24,4.20),(4.73,5.83),(6.31,6.84),(7.30,7.95),(8.24,9.22),(9.55,10.80)],
}
NOTES={
 ('介绍',1):('原介绍 jièshào；第一读弱高频起段约 .39 秒，jie 周期主体约 .44–.76 秒，先于 shao 的后相位。裁点 .3199375 秒在原暂停内，未从最强 .9 秒脉冲开始。',
  'shao 高擦音约 .78–.88 秒后接 .90–1.18 秒的 ao 周期及末衰减至 1.24 秒，1.29 秒 cut 保留尾。首词两相位组成一次原读，随后 1.61 秒才第二介绍。',
  '全源介绍、有时、懂、意思、北京烤鸭各两读，首读 [.39,1.24] 从原起始暂停后完整保留；未将整源 raw 合并重复的介绍时间当首读音素界。'),
 ('意思',1):('原意思 yìsi；懂两读后的第四词第一读约 8.13 秒弱起进入 yi 8.19–8.54 秒有声区，8.09 秒裁点留原起始。',
  'si 约 8.56–8.71 秒高频擦音及末端弱有声/衰减至 8.86 秒，8.96 秒 cut 不截轻声尾；不凭强 yi 周期宣称 si 无声可删。',
  '完整源前介绍、有时、懂各双读后才意思双读，第一意思 [8.13,8.86] 与懂第二读末 7.70 秒、意思第二读 9.40 秒分开；北京烤鸭还在两读之后。'),
 ('回来',1):('原回来 huílái；第一读约 .82 秒 h 弱擦音进入 hui 周期，.75 秒开始保留弱起段而非取 .85 秒阈值组。',
  'hui 约 .87–1.16 秒和 lai 约 1.22–1.55 秒及衰减至 1.59 秒在 1.6800625 秒 cut 内。两音节之间短弱相位不是第二回来。',
  '原轨回来、这么、完各两读；首回来 [.82,1.59]、次回来 [2.09,2.97] 分开。原整源 raw 玩与原完 wán 同音字保留，不把此邻词转换成当前回来证据。'),
 ('白色',1):('原白色 báisè；首读 .30 秒以后仍暂停，约 .35–.40 秒 b 瞬态接 .42 秒有声，.30 秒 cut 留起始。',
  'bai 约 .43–.82 秒主体后 se 擦音约 .86–.96 秒、周期约 .98–1.22 秒，衰减至1.30秒；1.36秒cut与1.72秒第二读相离。',
  '全源白色、因为、试、红色、所以各双读，本为第一白色。整源 是/试 原字保留，源第二白色批准不能直接代替当前第一读，当前实际局部相位另外实读。'),
 ('红色',1):('原红色 hóngsè；因为和试双读后的第四词首读约 8.91 秒 h 弱擦音/周期起段在 8.87 秒 cut 内。',
  'hong 约 8.98–9.39 秒有声及鼻化尾接 se 约 9.42 秒擦音、9.5–9.73 秒周期/衰减至9.80秒；9.88秒cut保留两相位全尾。',
  '原源白色、因为、试各两读后红色两读，再所以两读；第一红色 [8.91,9.80] 在第二红色10.24秒之前独立结束，无试/所以邻声。'),
 ('颜色',1):('原颜色 yánsè；首读低幅起段约 .47 秒，.43 秒 cut 在原暂停，不用 .53 秒能量组当 yan 首音。',
  'yan 约 .53–.90 秒周期和鼻化收束后 se 约 .94–1.09 秒高频/1.12–1.39 秒主体，尾至1.45秒，1.53秒cut保留完整。',
  '该完整原轨只颜色两读，第一 [.47,1.45] 与第二 [1.75,2.87] 由实际源暂停分开。当前第一读三 raw 原字只辅助，未复用第二读批准冒充首读。'),
 ('酒店',1):('原酒店 jiǔdiàn；走双读后第一酒店从2.85秒高频微弱起段进入约2.93秒 jiu 声体，2.79秒cut未抹首段。',
  'jiu约2.95–3.37秒，dian约3.45秒瞬态后3.48–3.80秒声体及鼻化衰减至3.88秒；3.96秒cut保留两音节/鼻尾。',
  '全源只有走、酒店各两读；本为第二词第一读 [2.85,3.88]，走第二读末2.48秒与酒店第二读起4.10秒均在外。原走 酒店全文与印刷词头一致，时间不作音素界。'),
 ('爱情片',1):('原爱情片 àiqíngpiàn；第一读约3.04秒弱起至3.14秒爱的强有声，在3.02秒cut后真实可用起窗，不能从3.2秒强主体截起。',
  '爱约3.15–3.49秒，情约3.51秒送气/3.55–3.76秒主体，片约3.83秒起段后3.90–4.12秒 ian 主体及衰减至4.21秒；4.2700625秒cut完整。',
  '全源记得、爱情片、有意思各两读，本第一爱情片 [3.04,4.21] 与记得第二末2.41秒、爱情片第二起4.55秒分开。三音节相位是一次原读，不把它计三次pronunciation。'),
 ('点',1):('原点 diǎn；首读约 .35 秒微弱 d 瞬态在 .30 秒cut内，约 .40 秒后有声，不把更强 .46 秒当起段。',
  'ia 有声约 .43–.93 秒到1.04秒鼻化/衰减，前景完整至1.10秒；1.1600625秒cut留原尾暂停。实际voicedbin14只是该原单音节声体的物理辅助，不等完整声调认证。',
  '全原点、虽然、但是、花各两读；第一点 [.35,1.10] 与第二点1.51秒起分開，后虽然不进入cut。两模型高NS仍保存，其中medium.8918不当原声无声证明。'),
 ('花',1):('原花 huā；第四词首读约8.26秒弱 h 高频起段到8.36秒周期，8.23秒cut保留h而非以8.34秒强阈值组截起。',
  'ua 主体约8.37–8.72秒连续周期/滑动到8.84秒衰减，8.89秒cut不裁韵尾；单原词声体无后第二读9.36秒起段。',
  '源点、虽然、但是双读后花两读，本选择花第一 [8.26,8.84]。花第二几何另外保留为同ID独立备选，不把两读/两个候选当两份独立词身份。'),
 ('花',2):('原花 huā；第二读约9.36秒弱 h 起段进9.46秒周期，9.33秒cut保留原起段，第一花8.84秒已结束。',
  '约9.48–9.80秒 ua 声体与滑动/衰减至9.93秒，10.01秒cut在完整尾后；不因重复词语义相同而省略当前实际裁片相位检查。',
  '完整源最后花两读，第二 [9.36,9.93] 后仅原结尾静音至10.248秒，没有下一词；按原第二读选择，不重置原第一候选或本词ID。'),
 ('旁边',1):('原旁边 pángbiān；首读约2.91秒弱p起段及2.94秒送气均在2.86秒cut所保留的边缘静音后，强声约3.00秒不是起界；手工整读包络2.86秒包含原前静音余量，不宣称该frame就是p起音。',
  'pang约3.01–3.28秒主体/鼻化后bian約3.36–3.75秒声体及鼻尾衰减至3.82秒；3.88秒cut完整两相位。',
  '源坏两读后旁边两读，本第一旁边 [2.86,3.82] 与坏第二末2.49秒、旁边第二起4.18秒分開。整源男孩省儿原字保留，此決策不审核后男孩儿/高的声韵。'),
 ('从小',1):('原从小 cóngxiǎo；第一读约 .50 秒 c 弱擦音/送气在 .46 秒cut内，.63秒才渐进有声，不用 .56 秒阈值或音高首点代替擦音起段。',
  'cong约 .64–1.08 秒有声/鼻尾，小的 x 高频区约1.11–1.24秒后iao主体1.27–1.67秒及尾至1.74秒；1.80秒cut保留第二音节末。',
  '全源从小、地铁、楼各两读，第一从小 [.50,1.74]、第二 [2.04,3.38] 独立。打印cóngxiǎo与完整原源raw逐头一致，但原模型时间/CTCtokens不作实际音素界。'),
 ('前面',1):('原前面 qiánmiàn；前三词过年/没意思/位双读后前面首读约8.24秒 q 擦音/送气在8.20秒cut内，8.36秒附近才有声主体。',
  'qian约8.40–8.76秒有声/鼻化到8.81秒，mian约8.83–9.10秒周期及末鼻化衰减至9.22秒；9.30秒cut留全尾。',
  '原四词各两读，第一前面 [8.24,9.22] 与位第二末7.95秒、前面第二起9.55秒分开。原raw 过年 没意思。位 前面 保留原标点，未以其他教材前边/前面异文替换。'),
 ('房子',1):('原房子 fángzi；首读弱 f 高频约 .48–.53 秒先于 .55 秒强声，.42 秒cut留原弱起，不把 .52 秒能量组当真正onset。',
  'fang约 .56–.91 秒主体/鼻化收束，zi约 .95–1.19 秒相位和末衰减至1.26秒；1.33秒cut完整，未把后第二房子1.78秒并入。',
  '全源房子、小孩儿、女孩儿各两读，本为第一房子 [.48,1.26]。整源小孩/女孩省儿原字保持，实际邻词另有两读不扩大到儿化认证；第二房子独立批准不替首读判定。'),
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')

def main():
    assert sha(OBS)=='8770de61dfb084320fa3ffd63ff9a63c10626a609448ca8b53d806fa1a6e6461'
    obs=json.loads(OBS.read_text());pool=json.loads((ROOT/obs['pairedPoolEvidence']['file']).read_text())
    assert sha(ROOT/obs['pairedPoolEvidence']['file'])==obs['pairedPoolEvidence']['sha256']
    key=lambda r:(r['id'],tuple(r['sourceSampleRange16k']))
    rows={key(r):r for r in pool['targets']};decisions=[]
    for t in obs['targets']:
        row=rows[key(t)];bounds=[[round(a*16000),round(b*16000)] for a,b in MAPS[Path(t['sourceTrack']).stem]]
        hi=t['selectedHeadOrdinal0Based'];rep=t['selectedRepetition1Based'];selected=hi*2+rep-1;marks=bounds[selected]
        limits=[bounds[selected-1][1] if selected else 0,bounds[selected+1][0] if selected+1<len(bounds) else t['originalSourceSampleCount16k']]
        onset,rime,reading=NOTES[t['sourceText'],rep]
        proof={k:t[k] for k in ['sourceText','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']}
        proof.update({'category':'triple-literal-noSpeech-proxy-review',
          'completeOriginalOnsetRimeAndFinalReviewed':True,'neighborPhonemesExcluded':True,'sourceOrderChecked':True,
          'originalPrintedPronunciationChecked':True,'allASRWarningsRetained':True,'noSyntheticPadding':True,'phonemeIdentityUnknown':False,
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False,
          'explanation':'逐ID独立看3页真实局部源/crop谱和11原轨的2页freshdecode全谱；完整原书ZH/py、弱起段/韵尾、源双读映射与邻排除均单独实核。三实际raw严格原字一致仅为辅助，全部高NS及原raw/flags保留，诊断概率不当真实无声；未做繁简/同音/数字替换，无native/tone/fullphoneme认证。',
          'onsetExplanation':onset,'rimeAndFinalExplanation':rime,'originalReadingExplanation':reading,
          'independentlyVerifiedCTCSupplementalEvidence':obs['independentlyVerifiedCTCSupplementalEvidence'],
          'originalPrintedSource':{k:t['canonicalPrintedSource'][k] for k in ['file','sha256','sourceJSONPointer']},
          'selectedCompleteOriginalReadingFrames16k':marks,'independentlyReviewedNeighborLimits16k':limits,
          'sourceReadingEvidence':{'canonicalHeads':t['canonicalHeads'],'selectedHeadOrdinal0Based':hi,'selectedRepetition1Based':rep,
            'orderedOriginalReadings':[{'head':t['canonicalHeads'][i//2],'readingOrdinal':i%2+1,'sourceSampleRange16k':v}for i,v in enumerate(bounds)],
            'wholeSourceEvidence':t['wholeSourceEvidence'],'manualSourceMapNotASRTimestamps':True},
          'waveformObservation':t['waveformObservation'],'actualSyllableFeatureEvidence':t['actualSyllableFeatureEvidence'],
          'independentCompleteOriginalSourcePlot':t['completeOriginalSourcePlot'],'actualRawEvidenceUnchanged':True})
        decisions.append({'id':row['id'],'sourceSampleRange16k':row['sourceSampleRange16k'],'decision':'accept',
          'resolvedTextHolds':[],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],
          'resolvedDecoderASRDiagnosticHolds':['crop-ASR-hallucination-or-no-speech-warning'],'acknowledgedFlags':row['flags'],
          'tripleLiteralNoSpeechDecisionEvidence':proof,'rawEvidenceUnchanged':True,'productionApproved':False,
          'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    output=OUT/'explicit-old15-triple-literal-peer-recommendations.json'
    dump(output,{'schemaVersion':1,'status':'independent-explicit-strict-raw-original-word-recommendations-awaiting-compiler',
      'reviewer':'acceptance_scope_plan','observationIndexEvidence':ref(OBS),'scriptEvidence':ref(Path(__file__)),
      'decisions':decisions,'counts':{'scopedVariantRecommendations':15,'uniqueIDs':14,'held':0,'scriptOnlyExcludedVariants':3},
      'newInferencePerformed':False,'sourceOrProposalModified':False,'automaticProductionApproval':False,
      'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
    validatorpath=ROOT/'tools/final-quality-20261006/review-triple-literal.py'
    spec=importlib.util.spec_from_file_location('old_read_only_triple_validator',validatorpath);validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
    results=[]
    for d in decisions:
        validator.validate(rows[key(d)],d,ROOT)
        results.append({'id':d['id'],'sourceSampleRange16k':d['sourceSampleRange16k'],'status':'read-only-real-source-raw-feature-validation-passed'})
    report=OUT/'read-only-old15-triple-validation.json'
    dump(report,{'status':'passed','recommendationEvidence':ref(output),'validatorEvidence':ref(validatorpath),'count':15,'uniqueIDs':14,'failures':0,
      'results':results,'authorityModified':False,'productionApproved':False})
    print(json.dumps({'recommendations':ref(output),'validation':ref(report),'count':15,'uniqueIDs':14}))
if __name__=='__main__':main()
