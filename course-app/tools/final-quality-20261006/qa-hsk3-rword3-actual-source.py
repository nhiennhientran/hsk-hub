#!/usr/bin/env python3
"""Independent real source/geometry observations for three remaining r words.

Includes both already-inferred clean 聊天儿 variants and the two 一块儿 aliases.
No proposal, source, waveform or inference is changed.
"""
import hashlib,importlib.util,json,shutil
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-rword3'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mod(n,p):s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
SELECT=[('hsk3-fltrp-2026:l13:word19','6f3e708659010b4571bf964c','hsk3-hard-word30-paired-01.json'),
 ('hsk3-fltrp-2026:l13:word19','b6ab1ba2bd5a5ec8f2875cec','hsk3-hard-word30-paired-01.json'),
 ('hsk3-fltrp-2026:l14:word25','7c8b31d0f9b8ceef0351fe0b','hsk3-paired-full-03.json'),
 ('hsk3-fltrp-2026:l14:word26','e469731a34557463cab5dc88','hsk3-paired-full-03.json')]
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 support=mod('rword3_exact_source',ROOT/'tools/final-quality-20261006/review-decisions.py')
 shared=mod('rword3_raw_pins',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'))
 plot=mod('rword3_actual_plot',Path(__file__).with_name('qa-hsk1-remaining22-observations.py'))
 indexfile=BASE/'audio-hsk3/context-closure/full-source-context-index-amendment-77.json';fullindex=json.loads(indexfile.read_text());full={(x['sourceTrack'],x['sourcePCM_SHA256']):x for x in fullindex['sourceEvidence']}
 factsfile=BASE/'audio-hsk3/scoped-word-source-followup/all-remaining-scoped-source-head-facts-v3.json';sf=json.loads(factsfile.read_text());facts={x['sourceTrack']:x for x in sf['sources']}
 targets=[];decoded={};sources={}
 for ident,cid,reportname in SELECT:
  report=BASE/'audio-review'/reportname;row=next(x for x in json.loads(report.read_text())['targets']if x['id']==ident and x['candidateId']==cid)
  source=support.original_pcm(ROOT,row);decoded[row['sourceTrack']]=source;a,b=row['sourceSampleRange16k'];assert hashlib.sha256(source[a*4:b*4]).hexdigest()==row['cropPCM_SHA256']
  bp,book=shared.pinned(row['canonicalSource']);printed=shared.pointer(book,row['canonicalSource']['sourceJSONPointer']);assert printed['zh']==row['sourceZH']and printed['py']==row['canonicalSource']['sourcePinyin']
  models=[]
  for e in row['rawModelEvidence']:
   rp,raw=shared.pinned(e);shared.unprompted(raw);assert raw['candidateId']==ident and raw['cropPCM_SHA256']==row['cropPCM_SHA256']and raw['sourceSampleRange16k']==[a,b]
   assert ''.join(s.get('text','')for s in raw['rawSegments'])==e['rawTranscript'];actual=ref(rp)
   if raw.get('deduplicatedRawASRFile'):
    dp,dr=shared.pinned({'file':raw['deduplicatedRawASRFile'],'sha256':raw['deduplicatedRawASRSHA256']});assert dr['rawSegments']==raw['rawSegments']and dr['cropPCM_SHA256']==row['cropPCM_SHA256'];actual=ref(dp)
   models.append({**ref(rp),'actualInference':actual,'modelRepository':e['modelRepository'],'modelRevision':e['modelRevision'],'rawTranscript':e['rawTranscript'],'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags']})
  whole=full.get((row['sourceTrack'],row['sourcePCM_SHA256']))
  if whole:whole_ref={'file':whole['rawASRFile'],'sha256':whole['rawASRSHA256']}
  else:whole_ref=row['sourceOccurrenceEvidence']['originalTrackRawEvidenceRefs'][0]
  wp,wr=shared.pinned(whole_ref);shared.unprompted(wr)
  assert wr.get('cropPCM_SHA256',wr.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256']
  if wr.get('sourceSampleRange16k') is not None:assert wr['sourceSampleRange16k']==[0,len(source)//4]
  elif wr.get('track'):assert wr['track']['pcm']['samples']==len(source)//4
  else:assert wr['cropDurationSeconds']==len(source)/4/16000
  cb=BASE/'audio-hsk3/ctc-remaining-decoder-followup/inference/sensevoice/bindings'/ident.replace(':','_')/(cid+'.json');binding=json.loads(cb.read_text())
  for key in ('sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256'):assert binding[key]==row[key]
  cp,ctc=shared.pinned({'file':binding['inferenceFile'],'sha256':binding['inferenceSHA256']});assert ctc['modelSHA256']=='c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51';assert ctc['cropPCM_SHA256']==row['cropPCM_SHA256'];assert json.loads(ctc['rawResultString'])==ctc['rawResult'];assert ctc['rawResult']['text']==ctc['rawText']
  assert ctc['producerAddedSilenceFrames']==0
  for key in ('expectedTextPromptUsed','hotwordsUsed','externalLanguageModelUsed','inverseTextNormalizationUsed','homophoneReplacementUsed','producerAlteredSourceSamples'):assert ctc[key]is False
  shared.pinned({'file':ctc['provenanceFile'],'sha256':ctc['provenanceSHA256']});assert sha(ROOT/ctc['scriptFile'])==ctc['scriptSHA256']
  t={k:row[k]for k in ('id','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256')}
  t.update({'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'canonicalPrintedSource':row['canonicalSource'],'actualCropModelEvidence':models,
    'actualReportEvidence':ref(report),'sourceDecodedFrames16k':len(source)//4,'actualFourEdgeRMSDbFS20ms':row['actualEdgeRMSDbFS20ms'],
    'sourceGroupEvidence':{**ref(wp),'sourcePCM_SHA256':row['sourcePCM_SHA256'],'sourceSampleRange16k':[0,len(source)//4],'rawTranscriptRetainedVerbatim':''.join(s.get('text','')for s in wr['rawSegments'])},
    'producerSourcePhysicalHeadFactsEvidence':ref(factsfile),'sourceHeadProposalsPreserved':facts[row['sourceTrack']]['heads'],
    'actualCTCBinding':ref(cb),'actualCTCRaw':{**ref(cp),'rawText':ctc['rawText'],'rawResultStringVerifiedWithoutChanges':True},
    'originalHoldsUnchanged':row['holds'],'flagsUnchanged':row['flags'],'originalReadingRepetition':row['repetition'],
    'expectedReadingCount':row['expectedReadingCount'],'sourceModified':False,'productionApproved':False})
  targets.append(t);sources.setdefault(row['sourceTrack'],[]).append(t)
 uniques={ (t['sourceTrack'],tuple(t['sourceSampleRange16k'])):t for t in targets }
 fig,axes=plt.subplots(len(uniques),2,figsize=(23,len(uniques)*3.3),squeeze=False);local=OUT/'three-current-word-geometry-source-panels.png'
 for i,t in enumerate(uniques.values()):
  pcm=np.frombuffer(decoded[t['sourceTrack']],dtype='<f4');a,b=t['sourceSampleRange16k'];plot.plot_pair(axes[i],pcm,a,b,t['id']+' '+t['candidateId']+' ACTUAL SOURCE',max(0,a-16000),min(len(pcm),b+16000))
  for u in targets:
   if(u['sourceTrack'],u['sourceSampleRange16k'])==(t['sourceTrack'],t['sourceSampleRange16k']):u['_panel']=i+1
 fig.tight_layout();fig.savefig(local,dpi=140);plt.close(fig)
 for t in targets:t['actualCurrentSourceCropPlot']={**ref(local),'id':t['id'],'candidateId':t['candidateId'],'sourceSampleRange16k':t['sourceSampleRange16k'],'cropPCM_SHA256':t['cropPCM_SHA256'],'panelOrdinal':t.pop('_panel')}
 fig,axes=plt.subplots(len(sources),2,figsize=(23,len(sources)*3.7),squeeze=False);wholeplot=OUT/'two-complete-original-word-source-panels.png'
 for i,(track,ts)in enumerate(sources.items()):
  t=ts[0];pcm=np.frombuffer(decoded[track],dtype='<f4');a,b=t['sourceSampleRange16k'];plot.plot_pair(axes[i],pcm,a,b,track+' COMPLETE ORIGINAL')
  for u in ts:u['_wholePanel']=i+1
 fig.tight_layout();fig.savefig(wholeplot,dpi=140);plt.close(fig)
 for t in targets:t['actualCompleteOriginalSourcePlot']={**ref(wholeplot),'sourceTrack':t['sourceTrack'],'sourcePCM_SHA256':t['sourcePCM_SHA256'],'panelOrdinal':t.pop('_wholePanel')}
 # Detailed source transition panels are intentionally not word alignments.
 windows=[('course-assets/hsk3/audio/13-6.mp3',12.30,14.03),('course-assets/hsk3/audio/13-6.mp3',13.85,15.35),('course-assets/hsk3/audio/14-8.mp3',12.67,14.19)]
 fig,axes=plt.subplots(3,2,figsize=(22,9.6),squeeze=False);fine=OUT/'three-current-word-onset-core-tail-source-panels.png';scopes=[]
 for i,(track,start,end)in enumerate(windows):
  pcm=np.frombuffer(decoded[track],dtype='<f4');a,b=round(start*16000),round(end*16000);signal=pcm[a:b];ax,sx=axes[i];ax.plot(np.arange(a,b)/16000,signal,lw=.7);f,ts,p=spectrogram(signal,fs=16000,nperseg=512,noverlap=496,scaling='spectrum');sx.pcolormesh(ts+a/16000,f,10*np.log10(np.maximum(p,1e-12)),vmin=-95,vmax=-25,shading='auto',cmap='magma');sx.set_ylim(0,6500)
  ax.set_title(track+' ACTUAL original transition/complete body',fontsize=10);sx.set_title('32ms STFT / 1ms step; original samples, no word alignment',fontsize=9)
  for q in(ax,sx):q.set_xlabel('Actual original source seconds');q.grid(alpha=.12)
  scopes.append({'sourceTrack':track,'sourcePCM_SHA256':sources[track][0]['sourcePCM_SHA256'],'actualSourceScopeFrames16k':[a,b],'actualSourceScopePCM_SHA256':hashlib.sha256(decoded[track][a*4:b*4]).hexdigest(),'plotPanelOrdinal':i+1})
 fig.tight_layout();fig.savefig(fine,dpi=140);plt.close(fig)
 for t in targets:t['actualFineSourcePhaseEvidence']={**ref(fine),'sourceWindows':scopes}
 from PIL import Image
 for p in(local,wholeplot,fine):Image.open(p).verify();shutil.copyfile(p,ROOT.parent/('inspect-'+p.name))
 p=OUT/'three-rword-four-current-variants-independent-source-observations.json';dump(p,{'schemaVersion':1,'status':'independent-actual-source-geometry-observations-not-authority','reviewer':'acceptance_scope_plan',
  'scriptEvidence':ref(Path(__file__)),'sourceFullRawIndexEvidence':ref(indexfile),'producerHeadFactsEvidence':ref(factsfile),'targets':targets,
  'uniqueCurrentGeometries':len(uniques),'newASR':False,'sourceModified':False,'runtimeModified':False,'automaticApproval':False,
  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'devicePlaybackCertified':False,'fullPhonemeCertification':False})
 print(json.dumps(ref(p)))
if __name__=='__main__':main()
