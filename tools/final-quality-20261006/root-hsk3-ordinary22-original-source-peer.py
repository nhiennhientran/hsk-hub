"""Independent source review of 22 ordinary foreign-token decoder disagreements."""
import hashlib, importlib.util, json, pathlib, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT/'course-app/docs/final-quality-20261006/audio-hsk3-ctc-independent-peer'
OUT = ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-hsk3-ordinary22'
PHASES = {
 '瘦':'sh-like noise11.96–12.13, a complete ou body12.13–12.54 and finite natural decay before12.67; the second reading starts after13.05',
 '带':'short d-like release5.803, the complete ai body5.83–6.20 and finite tail through6.24; the second reading starts after6.93',
 '又':'original initial glide near3.30 followed by the complete ou-like body3.36–3.77; the next reading starts after4.12',
 '外卖':'the complete first wai body8.84–9.22, separate m-like transition9.25–9.35, ai body9.35–9.66 and finite tail9.69; the next reading starts after10.03',
 '办':'short original release near0.485, sustained vowel0.50–0.73 and complete nasal/final decay through about1.01; the actual foreground ends before the unchanged1.1800625 cut, despite the coarse producer proposal extending to1.28',
 '搬':'original b-like release2.78, a body2.81–3.04, nasal continuation3.04–3.28 and finite tail3.32; the second reading starts after4.00',
 '树':'continuous original sh-like broadband noise grows after3.94, followed by the complete u body4.15–4.33 and finite weak tail through about4.51; the second reading starts after4.96. The additional actual fine initial plot distinguishes the isolated low-frequency events before3.92 from the later sustained frication',
 '电':'short d-like release8.58, complete ian body8.63–8.87 and nasal/final continuation8.90–9.10; the next reading starts after9.65',
 '该':'original g-like entry near0.50, complete ai body0.52–0.99 and finite tail1.04; the second reading starts after1.55',
 '耳机':'complete first er body0.416–0.72, distinct j-like frication0.77–0.90 and separate i body0.90–1.21 with natural decay through about1.27; the unchanged1.33 cut contains the actual entire first head despite the coarse producer proposal extending to1.38',
 '矮':'complete second original a/ai body8.60–9.11 with finite weak tail through about9.28; subsequent source foreground starts after9.71',
 '更':'short g-like entry13.75, complete e body13.78–14.01 and nasal/final continuation14.02–14.16; the next reading starts after14.79',
 '低':'short d-like release7.89, complete i body7.93–8.29 and finite tail8.34; the next reading starts after8.88',
 '页':'original y-like glide0.59, complete ie body0.65–0.94 and finite tail1.04; the second reading starts after1.70',
 '为':'original w-like glide13.20, complete ei body13.25–13.70 and finite tail13.85; the next source foreground starts after14.17',
 '风':'original f-like noise4.83–4.99, complete eng body5.00–5.40 and nasal/final decay5.40–5.46; the second reading starts after5.85',
 '变':'short b-like entry17.80, complete ian body17.84–18.05 and nasal/final continuation18.06–18.23; the next reading starts after18.80',
 '放':'original f-like noise7.18–7.31, complete ang body7.31–7.60 and nasal/final decay7.60–7.70; the second reading starts after8.15',
 '脏':'only one complete original head occurs in the0–2.18 crop: original frication begins around0.84, followed by the complete vowel around0.98 and nasal/final decay before about1.50. The second reading starts after2.42. The original initial low-level click is preserved and is not a preceding vocabulary head',
 '收':'original sh-like noise5.60–5.76, complete ou body5.76–6.17 and finite weak tail6.22; the next reading starts after6.61',
 '刚':'short g-like entry7.56, a body7.58–7.79, nasal continuation7.80–8.01 and finite weak decay before about8.075; the next reading starts after8.38',
}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p): return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def module(name, file):
 s=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 support=module('ordinary22_review','review-decisions.py');feature=module('ordinary22_features','review-syllable-evidence.py')
 facts_path=BASE/'root-extra22-original-source-independent-source-physical-observations.json'
 whole_path=BASE/'root-extra22-original-source-whole-order-observations.json'
 assert sha(facts_path)=='6bf068d56abb7ce280400a378e0a07856734bbdad60dcd05848ee877f2e134a0'
 assert sha(whole_path)=='2b20f75553a7126d3e24ba13673b0bc786c0cb3f700e079df8aaa7acab1876bf'
 facts=json.loads(facts_path.read_text());whole=json.loads(whole_path.read_text())
 support.actual_file(ROOT,facts['inputReference']);support.actual_file(ROOT,facts['producerSourceFactsReference'])
 grouped={};summary=[]
 for f in facts['targets']:
  rp=support.actual_file(ROOT,f['originalReviewReportReference']);report=json.loads(rp.read_text())
  rows=[r for r in report['targets'] if r['id']==f['id'] and r['sourceSampleRange16k']==f['sourceSampleRange16k']]
  assert len(rows)==1;r=rows[0];assert r['candidateId']==f['candidateId'] and r['holds']==f['originalHoldsRetained']
  assert set(r['holds'])<=support.TEXT_REVIEW_HOLDS
  pcm=support.original_pcm(ROOT,r);s,e=r['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==r['cropPCM_SHA256']
  a=np.frombuffer(pcm,dtype='<f4');edges={}
  for name,x,y in [('beforeStart',s-320,s),('afterStart',s,s+320),('beforeEnd',e-320,e),('afterEnd',e,e+320)]:
   v=None if not 0<=x<y<=len(a) else round(float(20*np.log10(max(np.sqrt(np.mean(a[x:y].astype('f8')**2)),1e-12))),6)
   assert v is None or v<=-45;edges[name]=v
  assert set(edges)==set(r['actualEdgeRMSDbFS20ms'])
  assert all((v is None and r['actualEdgeRMSDbFS20ms'][k] is None) or (v is not None and round(v,3)==r['actualEdgeRMSDbFS20ms'][k]) for k,v in edges.items())
  context=f['sourceContextEvidence'];book=json.loads(support.actual_file(ROOT,context['canonicalSource']).read_text());obj=feature.pointer(book,context['sourceJSONPointer'])
  assert obj==context['canonicalRow'] and obj['id']==r['id'] and obj['zh']==r['sourceZH'] and obj['py']==r['sourcePinyin']
  assert r['sourceTrack'].endswith('/'+obj['audioTrack']+'.mp3')
  support.actual_file(ROOT,f['waveformObservation']);support.actual_file(ROOT,f['actualSyllableFeatureEvidence'])
  w=next(z for z in whole['observations'] if z['sourceTrack']==r['sourceTrack']);support.actual_file(ROOT,w['wholeSourcePlot'])
  source_refs=[]
  for rr in context['originalSourceRawEvidenceRefs']:
   raw=json.loads(support.actual_file(ROOT,rr).read_text());support.unprompted(raw)
   assert raw.get('cropPCM_SHA256',raw.get('track',{}).get('pcm',{}).get('sha256'))==r['sourcePCM_SHA256']
   assert ''.join(z['text'] for z in raw['rawSegments'])==rr['rawText'];source_refs.append({'file':rr['file'],'sha256':rr['sha256']})
  assert source_refs
  for rr in r['rawModelEvidence']:
   raw=json.loads(support.actual_file(ROOT,rr).read_text());support.unprompted(raw)
   assert raw['sourceSampleRange16k']==[s,e] and raw['cropPCM_SHA256']==r['cropPCM_SHA256']
   assert ''.join(z['text'] for z in raw['rawSegments'])==rr['rawTranscript']
  ctc=json.loads(support.actual_file(ROOT,f['independentCTCSupplementalRawEvidence']).read_text())
  assert ctc['cropPCM_SHA256']==r['cropPCM_SHA256'] and ctc['expectedTextPromptUsed'] is False and json.loads(ctc['rawResultString'])==ctc['rawResult']
  assert ctc['rawText']==f['independentCTCSupplementalRawEvidence']['rawText']
  explanation='The exact complete original '+r['sourceZH']+' vocabulary head was independently located using the actual source book/pinyin, full original source order and repeated physical readings. Root actually viewed all six local spectrum sheets and all five whole-source order pages. The selected original recording contains '+PHASES[r['sourceZH']]+'. The unchanged pure decoder predictions are auxiliary observations, not substitute vocabulary or proof of pronunciation. The original onset, complete vowel/rime and finite natural final remain inside the unchanged four-quiet cut; neighboring original heads stay outside. All actual raw predictions/word times/flags remain intact. No human listening, native-speaker, tone or device certification is asserted.'
  identity={k:r[k] for k in ['sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};identity['sourceText']=r['sourceZH']
  proof={**identity,'sourcePinyin':r['sourcePinyin'],'wholeSourceGroupUnpromptedASRReviewed':True,'sourceOrderChecked':True,'neighborSpeechExcluded':True,'actualCropBoundariesChecked':True,'phoneticEquivalenceIsAuxiliaryOnly':True,'originalRepeatedReadingsChecked':True,'sourceGroupEvidence':source_refs[0],'originalPrintedSource':{**context['canonicalSource'],'sourceJSONPointer':context['sourceJSONPointer']},'rawDifferences':[{'file':z['file'],'sha256':z['sha256'],'unalteredRawTranscript':z['rawTranscript']} for z in r['rawModelEvidence']],'actualOriginalPhysicalFacts':ref(facts_path),'actualOriginalWholeOrderObservations':ref(whole_path),'actualWaveformObservation':f['waveformObservation'],'explanation':explanation}
  if r['sourceZH']=='树':proof['actualFineInitialObservation']=ref(OUT/'shu-original-initial-fine-01.json')
  d={'id':r['id'],'sourceSampleRange16k':[s,e],'decision':'accept','sourceContextChecked':True,'acknowledgedFlags':r['flags'],'rationale':explanation,'resolvedTextHolds':r['holds'],'resolvedSourceHolds':[],'resolvedBoundaryHolds':[],'resolvedDecoderASRDiagnosticHolds':[],'sourceContextEvidence':proof,'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False}
  support.contextual_decision(r,d,ROOT);grouped.setdefault(rp,[]).append(d);summary.append({'id':r['id'],'candidateId':r['candidateId'],'sourceSampleRange16k':[s,e],'cropPCM_SHA256':r['cropPCM_SHA256'],'actualEdgeRMSDbFS20ms':edges})
 assert len(summary)==22
 outputs=[]
 for rp,decisions in grouped.items():
  dp=OUT/(rp.stem+'-ordinary22-independent-decisions.json');op=OUT/(rp.stem+'-ordinary22-approved.json')
  dp.write_text(json.dumps({'schemaVersion':1,'reviewReportSHA256':sha(rp),'independentReviewScript':ref(pathlib.Path(__file__)),'actualOriginalPhysicalFacts':ref(facts_path),'actualWholeOrderObservations':ref(whole_path),'decisions':decisions,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n')
  subprocess.run(['python',str(ROOT/'tools/final-quality-20261006/review-decisions.py'),'--repo-root',str(ROOT),'--report',str(rp),'--decisions',str(dp),'--target-catalog',str(ROOT/'course-app/content/audio-precision-targets-20261006.json'),'--output',str(op)],check=True)
  outputs.append({**ref(op),'actualCount':len(decisions)})
 print(json.dumps({'actualIndependentlyCompiled':len(summary),'outputs':outputs},ensure_ascii=False))
if __name__=='__main__':main()
