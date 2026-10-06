#!/usr/bin/env python3
"""Read-only exact original source/crop evidence; no new ASR or decisions."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk3-optional-r'
def mod(n,p):
 s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
shared=mod('h3_optional_shared',Path(__file__).with_name('qa-hsk1-peer-context-observations.py'));support=mod('h3_optional_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py');plots=mod('h3_optional_source_plot',Path(__file__).with_name('qa-hsk1-remaining22-observations.py'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def dump(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
SELECT=['l01:text1:line3', 'l01:text1:line4', 'l01:text1:line5', 'l02:text1:line4:sentence1', 'l05:text1:line4', 'l06:text3:line8', 'l08:text2:line2', 'l18:text2:line6']
def main():
 workfile=OUT/'frozen-current-optional-r-spoken-worklist.json';work=json.loads(workfile.read_text());triagefile=BASE/'audio-review/remaining-best-machine-variants-triage-01.json';triage=json.loads(triagefile.read_text());best={r['id']:r for r in triage['targets']};oldfile=BASE/'audio-context-peer-hsk3-boundary/explicit-sentence-boundary-recommendations.json';old={r['id']:r for r in json.loads(oldfile.read_text())['decisions']};repairfile=BASE/'audio-review/hsk3-sentence114-paired-01.json';repairreport=json.loads(repairfile.read_text());best={r['id']:{**r,'report':ref(repairfile)}for r in repairreport['targets']};targets=[];decoded={};sources={};reports={}
 for tail in SELECT:
  id='hsk3-fltrp-2026:'+tail;b=best[id];rp=ROOT/b['report']['file'];assert sha(rp)==b['report']['sha256'];report=reports.setdefault(str(rp),json.loads(rp.read_text()));row=next(r for r in report['targets']if r['id']==id and r['candidateId']==b['candidateId'] and r['sourceSampleRange16k']==b['sourceSampleRange16k']);assert row['cropPCM_SHA256']==b['cropPCM_SHA256'];o=old[id];assert o['sourceSampleRange16k']==row['sourceSampleRange16k']and o['sourcePCM_SHA256']==row['sourcePCM_SHA256']
  raw=decoded.setdefault(row['sourceTrack'],support.original_pcm(ROOT,row));pcm=np.frombuffer(raw,dtype='<f4');a,z=row['sourceSampleRange16k'];assert hashlib.sha256(raw[a*4:z*4]).hexdigest()==row['cropPCM_SHA256'];cp,canon=shared.pinned(row['canonicalSource']);line=shared.pointer(canon,row['canonicalSource']['sourceJSONPointer']);assert line['zh']==row['canonicalSource']['parentZH']and line['py']==row['canonicalSource']['sourcePinyin']; assert not row['sourcePinyin'] or line['py']==row['sourcePinyin']
  gp,g=shared.pinned(o['sourceGroupEvidence']);shared.unprompted(g);assert g.get('cropPCM_SHA256',g.get('track',{}).get('pcm',{}).get('sha256'))==row['sourcePCM_SHA256'];whole={**ref(gp),'sourcePCM_SHA256':row['sourcePCM_SHA256'],'sourceSampleRange16k':[0,len(pcm)],'rawTranscriptRetainedVerbatim':''.join(s.get('text','')for s in g['rawSegments']),'rawTimestampNotPhonemeBoundary':True,'modelRepository':g['modelRepository'],'modelRevision':g['modelRevision']}
  models=[]
  for e in row['rawModelEvidence']:
   bp,bv=shared.pinned(e);shared.unprompted(bv);assert bv['candidateId']==id and bv['sourceSampleRange16k']==[a,z]and bv['cropPCM_SHA256']==row['cropPCM_SHA256']and bv['originalSourceSHA256']==row['sourceSHA256'];transcript=''.join(s.get('text','')for s in bv['rawSegments']);assert transcript==e['rawTranscript'];actual=ref(bp)
   if bv.get('deduplicatedRawASRFile'):
    ip,iv=shared.pinned({'file':bv['deduplicatedRawASRFile'],'sha256':bv['deduplicatedRawASRSHA256']});shared.unprompted(iv);assert iv['rawSegments']==bv['rawSegments']and iv['cropPCM_SHA256']==row['cropPCM_SHA256'];actual=ref(ip)
   models.append({**ref(bp),'actualInference':actual,'modelRepository':bv['modelRepository'],'modelRevision':bv['modelRevision'],'rawTranscript':transcript,'holdsUnchanged':e['holds'],'flagsUnchanged':e['flags'],'warningSegmentsRetained':[{'id':s['id'],'no_speech_prob':s.get('no_speech_prob'),'compression_ratio':s.get('compression_ratio')}for s in bv['rawSegments']]})
  windows=[('beforeStart',a-320,a),('afterStart',a,a+320),('beforeEnd',z-320,z),('afterEnd',z,z+320)];edges={k:shared.db(pcm[x:y])if 0<=x<y<=len(pcm)else None for k,x,y in windows};# Actual nonquiet original background requires the existing independent per-ID boundary proof; no fake quiet.
  t={k:row[k]for k in ['id','candidateId','unit','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']};t.update({'sourceText':row['sourceZH'],'sourcePinyin':row['sourcePinyin'],'canonicalPrintedParentPinyin':line['py'],'canonicalPrintedSource':row['canonicalSource'],'sourceDecodedFrames16k':len(pcm),'actualFourEdgeRMSDbFS20ms':edges,'actualCropModelEvidence':models,'sourceGroupEvidence':whole,'wholeSourceWordsIntersectingCurrentCropAuxiliaryOnly':[{'segmentIndex':si,'wordIndex':wi,**ww}for si,ss in enumerate(g['rawSegments'])for wi,ww in enumerate(ss.get('words',[]))if ww['end']>a/16000 and ww['start']<z/16000],'priorExactSourceFrameEvidence':ref(oldfile),'currentActualReportEvidence':ref(rp),'holdsUnchanged':row['holds'],'flagsUnchanged':row['flags'],'noNewInference':True,'sourceOrProposalsModified':False,'productionApproved':False});targets.append(t);sources.setdefault(row['sourceTrack'],[]).append(t)
 localpages=[]
 for offset in range(0,len(targets),5):
  batch=targets[offset:offset+5];fig,axes=plt.subplots(len(batch),2,figsize=(24,len(batch)*3.3),squeeze=False);page=OUT/f'boundary8-actual-source-crop-panels-{offset//5+1:02}.png'
  for i,t in enumerate(batch):
   a,z=t['sourceSampleRange16k'];pcm=np.frombuffer(decoded[t['sourceTrack']],dtype='<f4');plots.plot_pair(axes[i],pcm,a,z,t['id']+' '+t['sourcePinyin'],max(0,a-16000),min(len(pcm),z+16000))
  fig.tight_layout();fig.savefig(page,dpi=125);plt.close(fig); __import__('PIL.Image',fromlist=['Image']).open(page).verify();localpages.append(ref(page))
  for i,t in enumerate(batch,1):t['actualCurrentSourceCropPlot']={**ref(page),'panelOrdinal':i,'id':t['id'],'sourceSampleRange16k':t['sourceSampleRange16k'],'cropPCM_SHA256':t['cropPCM_SHA256']}
 fullpages=[];sourceitems=list(sources.items())
 for offset in range(0,len(sourceitems),5):
  batch=sourceitems[offset:offset+5];fig,axes=plt.subplots(len(batch),2,figsize=(24,len(batch)*3.1),squeeze=False);page=OUT/f'boundary8-complete-original-source-panels-{offset//5+1:02}.png'
  for i,(track,ts)in enumerate(batch):
   t=ts[0];a,z=t['sourceSampleRange16k'];plots.plot_pair(axes[i],np.frombuffer(decoded[track],dtype='<f4'),a,z,track+' COMPLETE ORIGINAL; actual whole-source PCM; first target='+t['id'])
  fig.tight_layout();fig.savefig(page,dpi=125);plt.close(fig); __import__('PIL.Image',fromlist=['Image']).open(page).verify();fullpages.append(ref(page))
  for i,(_,ts)in enumerate(batch,1):
   for t in ts:t['actualCompleteOriginalSourcePlot']={**ref(page),'panelOrdinal':i,'sourcePCM_SHA256':t['sourcePCM_SHA256']}
 out=OUT/'boundary8-independent-actual-source-observations.json';dump(out,{'status':'actual-original-source-evidence-not-approval','worklistEvidence':ref(workfile),'bestVariantsEvidence':ref(triagefile),'scriptEvidence':ref(Path(__file__)),'targets':targets,'localPages':localpages,'completeOriginalPages':fullpages,'counts':{'IDs':len(targets),'originalTracks':len(sources)},'newASR':False,'sourceModified':False,'runtimeModified':False,'humanListening':False,'nativeSpeakerReview':False,'fullPhonemeCertification':False,'pronunciationToneCertified':False,'productionApproved':False});print(json.dumps(ref(out)))
if __name__=='__main__':main()
