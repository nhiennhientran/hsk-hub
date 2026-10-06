"""Reproduce four real repaired crops and original source transitions."""
import hashlib,importlib.util,json,pathlib,subprocess
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1/numeral-minimal-transition-syllable-evidence'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-numeral-repairs'
SCOPES={'一':(3.0,3.11),'六':(1.25,1.43),'千':(45.85,46.04),'零':(10.53,10.72)}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
 p=ROOT/r['file'];assert sha(p)==r['sha256'];return json.loads(p.read_text())
def main():
 OUT.mkdir(parents=True,exist_ok=True);spec=importlib.util.spec_from_file_location('root_numeric_features',pathlib.Path(__file__).with_name('review-syllable-evidence.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);out=[]
 for record in json.loads((BASE/'producer-facts-index.json').read_text())['targets']:
  f=checked(record);t=f['target'];p=ROOT/t['sourceTrack']
  if not p.is_file():p=ROOT/'course-app/public'/t['sourceTrack']
  assert sha(p)==t['sourceSHA256'];pcm=subprocess.run(['ffmpeg','-nostdin','-v','error','-threads','1','-i',str(p),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout;assert hashlib.sha256(pcm).hexdigest()==t['sourcePCM_SHA256'];s,e=t['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==t['cropPCM_SHA256']
  raw_models=[]
  for name,r in t['actualCropModelEvidence'].items():
   bpath=ROOT/r['file'];assert sha(bpath)==r['sha256'];raw=json.loads(bpath.read_text());assert raw['cropPCM_SHA256']==t['cropPCM_SHA256'];assert raw['sourceSampleRange16k']==[s,e] and raw['originalSourceSHA256']==t['sourceSHA256'];assert raw['options'].get('initial_prompt') is None and raw['options'].get('hotwords') is None;raw_models.append({'model':name,**ref(bpath),'unalteredRawTranscript':''.join(q['text'] for q in raw['rawSegments'])})
  for expanded in f['expandedGeometries']:
   a,b=expanded['sourceSampleRange16k'];assert a<=s<e<=b and [a,b]!=[s,e];assert hashlib.sha256(pcm[a*4:b*4]).hexdigest()==expanded['cropPCM_SHA256'];assert set(expanded['actualCropModelEvidence'])=={'small','medium'}
   for raw_ref in expanded['actualCropModelEvidence'].values():
    raw=checked(raw_ref);assert raw['sourceSampleRange16k']==[a,b] and raw['cropPCM_SHA256']==expanded['cropPCM_SHA256'];assert ''.join(q['text'] for q in raw['rawSegments'])==raw_ref['originalTranscript']
  original=checked(f['originalPrintedPinyinEvidence']);assert m.pointer(original,f['originalPrintedPinyinEvidence']['sourceJSONPointer'])==f['originalPrintedPinyinEvidence']['originalPrintedPinyin'];assert m.pointer(original,f['originalPrintedOccurrenceTextEvidence']['sourceJSONPointer'])==f['originalPrintedOccurrenceTextEvidence']['sourceText']
  observed=checked(f['actualSyllableFeatureEvidence']);bins=m.features(pcm,s,e);assert observed['featureBins']==bins and observed['featureBinsSHA256']==m.feature_sha(bins)
  a,b=[int(v*16000) for v in SCOPES[t['sourceZH']]];x=np.frombuffer(pcm,dtype='<f4');fig,axes=plt.subplots(2,1,figsize=(13,5),sharex=True);axes[0].plot(np.arange(a,b)/16000,x[a:b],lw=.6);axes[1].specgram(x[a:b],NFFT=256,Fs=16000,noverlap=224,xextent=(a/16000,b/16000),vmin=-95,vmax=-20,cmap='magma');axes[1].set_ylim(0,5000)
  for ax in axes:ax.axvline(s/16000,color='green');ax.axvline(e/16000,color='green')
  axes[0].set_title(t['candidateId']+' | real repaired source frames; no automatic approval');axes[1].set_xlabel('Original source seconds');fig.tight_layout();p=OUT/(t['candidateId']+'-source-transition.png');fig.savefig(p,dpi=130);plt.close(fig)
  out.append({k:t[k] for k in ['id','sourceZH','candidateId','sourceTrack','sourceSHA256','sourcePCM_SHA256','sourceSampleRange16k','cropPCM_SHA256']});out[-1].update({'producerFacts':record,'actualRawModelBindings':raw_models,'actualSyllableFeatureEvidence':f['actualSyllableFeatureEvidence'],'freshExactFeatureBinsSHA256':m.feature_sha(bins),'freshOriginalTransitionPlot':ref(p),'allRawWarningsUnchanged':True,'runtimeApproved':False})
 p=OUT/'fresh-repaired-original-source-observations.json';p.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'producerIndex':ref(BASE/'producer-facts-index.json'),'records':out,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(p)))
if __name__=='__main__':main()
