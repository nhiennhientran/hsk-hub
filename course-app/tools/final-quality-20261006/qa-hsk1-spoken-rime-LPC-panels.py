#!/usr/bin/env python3
"""Actual unresolved utterance rime spectra/LPC windows, no rhotic classifier."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram,lfilter,freqz
from scipy.linalg import solve_toeplitz
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk1-spoken22'
SCOPES=[
 ('textbook-l05-text-2-line-04',7.26,7.62,[(7.36,7.396,'original vowel scope'),(7.46,7.496,'original tail scope')]),
 ('textbook-l12-text-1-line-04',10.27,10.49,[(10.31,10.346,'original vowel scope'),(10.402,10.438,'original tail scope')]),
 ('textbook-l12-text-3-line-04',11.00,11.24,[(11.05,11.086,'original vowel scope'),(11.115,11.151,'original tail scope')]),
 ('textbook-l15-text-1-line-04',14.90,15.15,[(14.943,14.979,'original vowel scope'),(14.988,15.024,'original tail scope')]),
 ('textbook-l15-text-2-line-03',11.60,12.14,[(11.73,11.766,'original vowel scope'),(11.974,12.01,'original tail scope')])]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 sp=importlib.util.spec_from_file_location('rime_source_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
 scopes=[];fig,axes=plt.subplots(5,3,figsize=(24,18),squeeze=False)
 for i,(identifier,start,end,windows)in enumerate(SCOPES):
  row=rows[identifier];raw=m.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=round(start*16000),round(end*16000);x=pcm[a:b]
  ax,sx,lx=axes[i];ax.plot(np.arange(a,b)/16000,x,lw=.6,color='#1b3f56');ax.set_title(identifier+' actual original rime')
  f,t,p=spectrogram(x,fs=16000,nperseg=512,noverlap=496,nfft=1024,scaling='spectrum');sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-108,vmax=-30,cmap='magma',shading='auto');sx.set_ylim(0,5000)
  r={'id':identifier,'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
   'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),'panelOrdinal':i+1,'windows':[]}
  for n,(first,last,label)in enumerate(windows):
   q,z=round(first*16000),round(last*16000);y=pcm[q:z].astype(float);y=(y-y.mean())*np.hanning(len(y));pre=lfilter([1,-.97],[1],y);ac=np.correlate(pre,pre,mode='full')[len(pre)-1:]
   envelopes=[]
   for order in [16,18,22]:
    co=np.r_[1.,solve_toeplitz((ac[:order],ac[:order]),-ac[1:order+1])];freq,h=freqz([1],co,worN=2048,fs=16000)
    roots=np.roots(co);complex_roots=roots[np.imag(roots)>0];formants=np.angle(complex_roots)*16000/(2*np.pi);bandwidth=-np.log(np.abs(complex_roots))*16000/np.pi
    candidates=sorted([{'candidateFrequencyHz':float(ff),'candidateBandwidthHz':float(bw)}for ff,bw in zip(formants,bandwidth)if 90<ff<5000 and 0<bw<1000],key=lambda z:z['candidateFrequencyHz'])
    envelopes.append({'LPCOrder':order,'descriptiveResonanceCandidates':candidates,'candidatesNotCertifiedFormantsOrRhoticClassification':True})
    lx.plot(freq,20*np.log10(np.maximum(np.abs(h),1e-12)),color=['#156c9c','#c95824'][n],alpha=.7,ls={16:'--',18:'-',22:':'}[order],label=label+' LPC'+str(order))
   for axis in (ax,sx):axis.axvspan(first,last,color=['#2e9ecc','#e2a257'][n],alpha=.16)
   r['windows'].append({'label':label,'sourceSampleRange16k':[q,z],'actualPCM_SHA256':hashlib.sha256(raw[q*4:z*4]).hexdigest(),'preEmphasis':.97,'LPCEnvelopes':envelopes})
  ax.set_xlabel('Original seconds');sx.set_xlabel('Original seconds');lx.set_xlim(0,5000);lx.set_xlabel('Hz');lx.legend(fontsize=7);lx.set_title('Actual window descriptive LPC, 3 orders; not r classifier')
  for axis in(ax,sx,lx):axis.grid(alpha=.16);axis.tick_params(labelsize=8)
  scopes.append(r)
 page=OUT/'actual-original-unresolved-rime-LPC-source-panels.png';fig.tight_layout();fig.savefig(page,dpi=145);plt.close(fig)
 for r in scopes:r['actualOriginalRimeLPCPlot']={**ref(page),'panelOrdinal':r['panelOrdinal']}
 output=OUT/'actual-original-unresolved-rime-LPC-scope-index.json';output.write_text(json.dumps({'status':'actual-original-descriptive-rime-LPC-not-approval',
  'pairedReportEvidence':ref(report),'scriptEvidence':ref(Path(__file__)),'scopes':scopes,'newASR':False,'originalSamplesChanged':False,
  'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(output)))
if __name__=='__main__':main()
