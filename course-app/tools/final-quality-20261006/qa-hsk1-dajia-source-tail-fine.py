#!/usr/bin/env python3
"""Actual final spoken source/cut fine panel; no optional-r certification."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'course-app/docs/final-quality-20261006';OUT=BASE/'audio-context-peer-hsk1-spoken22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=BASE/'audio-review/hsk1-paired-full-03.json';rows=json.loads(report.read_text())['targets']
 row=next(r for r in rows if r['id']=='textbook-l15-text-1-line-04');child=next(r for r in rows if r['id']=='textbook-l15-text-1-line-04-sentence-2')
 sp=importlib.util.spec_from_file_location('dajia_tail_original_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py');v=importlib.util.module_from_spec(sp);sp.loader.exec_module(v)
 raw=v.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=234080,len(pcm);x=pcm[a:b]
 fig,axes=plt.subplots(2,1,figsize=(22,9));axes[0].plot(np.arange(a,b)/16000,x,lw=.6)
 axes[0].axvline(child['sourceSampleRange16k'][1]/16000,color='#167939',label='actual child cut end 15.16s')
 axes[0].axvline(row['sourceSampleRange16k'][1]/16000,color='#a75323',label='actual parent cut end 15.228s')
 axes[0].axvline(b/16000,color='#6d418d',label='actual original decoded file end 15.9749375s');axes[0].legend()
 axes[0].set_title('Actual original chi / final dian(er) and original source end; no character-boundary classification')
 f,t,p=spectrogram(x,fs=16000,nperseg=128,noverlap=120,nfft=512,scaling='spectrum')
 axes[1].pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-110,vmax=-30,cmap='magma',shading='auto');axes[1].set_ylim(0,6000)
 axes[1].axvline(child['sourceSampleRange16k'][1]/16000,color='#167939');axes[1].axvline(row['sourceSampleRange16k'][1]/16000,color='#a75323')
 axes[1].set_title('Actual 8ms spectrum / .5ms step; original samples unchanged')
 for axis in axes:axis.grid(alpha=.15);axis.set_xlabel('Original seconds')
 page=OUT/'actual-original-dajia-point-weak-tail-fine.png';fig.tight_layout();fig.savefig(page,dpi=150);plt.close(fig)
 output=OUT/'actual-original-dajia-point-weak-tail-fine.json';output.write_text(json.dumps({**{k:row[k]for k in ('id','sourceTrack','sourceSHA256','sourcePCM_SHA256')},
  'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),'actualOriginalSourcePlot':ref(page),
  'actualParentEndFrame16k':row['sourceSampleRange16k'][1],'actualChildEndFrame16k':child['sourceSampleRange16k'][1],
  'actualOriginalSourceSampleCount16k':b,'parentCutEndIsNotOriginalFileEnd':True,'scriptEvidence':ref(Path(__file__)),
  'newASR':False,'originalSamplesChanged':False,'phonemeBoundaryClassification':False,'humanListening':False,'nativeSpeakerReview':False,
  'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(output)))
if __name__=='__main__':main()
