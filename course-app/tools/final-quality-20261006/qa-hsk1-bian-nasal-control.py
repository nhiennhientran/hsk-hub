#!/usr/bin/env python3
"""Actual same-scene, same-printed-speaker b/m control scopes, no classification."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 sp=importlib.util.spec_from_file_location('bian_control_source',ROOT/'tools/final-quality-20261006/review-decisions.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
 scopes=[('textbook-l09-text-1-line-01',1.45,1.72,'Current qian bian/mian original envelope'),('textbook-l09-text-1-line-03',11.31,11.56,'Same printed speaker wai bian'),
         ('textbook-l09-text-1-line-03',12.0,12.6,'Same printed speaker hao ma nasal control; inspect full actual scope')]
 result=[];fig,axes=plt.subplots(3,2,figsize=(21,11),squeeze=False)
 for i,(identifier,start,end,label)in enumerate(scopes):
  row=rows[identifier];raw=m.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=round(start*16000),round(end*16000);x=pcm[a:b]
  ax,sx=axes[i];ax.plot(np.arange(a,b)/16000,x,lw=.65,color='#1c4056');ax.set_title(label)
  f,t,p=spectrogram(x,fs=16000,nperseg=256,noverlap=240,nfft=512,scaling='spectrum');sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-105,vmax=-28,cmap='magma',shading='auto');sx.set_ylim(0,5000);sx.set_title('Actual original PCM: 16ms spectrum / 1ms step')
  for axis in (ax,sx):axis.grid(alpha=.2);axis.set_xlabel('Original seconds')
  result.append({'id':identifier,'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
   'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),'canonicalPrintedSource':row['canonicalSource'],'panelOrdinal':i+1,
   'scopeNotAcceptedPhonemeBoundaries':True})
 page=OUT/'actual-original-bian-and-ma-nasal-control.png';fig.tight_layout();fig.savefig(page,dpi=155);plt.close(fig)
 for r in result:r['actualSourcePlot']={**ref(page),'panelOrdinal':r['panelOrdinal']}
 path=OUT/'actual-original-bian-and-ma-nasal-control.json';path.write_text(json.dumps({'status':'actual-original-scene-control-not-approval','pairedReportEvidence':ref(report),
  'scriptEvidence':ref(Path(__file__)),'scopes':result,'newASR':False,'sourceSamplesChanged':False,'humanListening':False,'nativeSpeakerReview':False,
  'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(path)))
if __name__=='__main__':main()
