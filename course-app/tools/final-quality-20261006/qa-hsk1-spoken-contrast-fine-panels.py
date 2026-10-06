#!/usr/bin/env python3
"""Fine original stop/nasal scopes. Descriptive PCM/LPC evidence, no classifier."""
import hashlib,importlib.util,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.linalg import solve_toeplitz
from scipy.signal import spectrogram,freqz,lfilter
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk1-spoken22'
SCOPES=[
 ('textbook-l09-text-1-line-01',1.48,1.59,'Current b release after qian; complete source samples'),
 ('textbook-l09-text-1-line-03',11.34,11.44,'Same printed speaker b release after wai'),
 ('textbook-l13-text-3-line-04',13.12,13.23,'Current g/k release and onset of periodic e'),
 ('textbook-l13-text-3-line-06',21.72,21.82,'Same printed speaker gei release')]
LPC_SCOPES=[('textbook-l04-text-3-line-05',[(13.145,13.17,'onset'),(13.20,13.225,'vowel'),(13.32,13.345,'nasal transition'),(13.44,13.465,'following nu')]),
 ('textbook-l04-text-3-line-03',[(9.19,9.215,'onset'),(9.26,9.285,'vowel'),(9.35,9.375,'nasal transition'),(9.425,9.45,'following er')])]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def main():
 report=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json';rows={r['id']:r for r in json.loads(report.read_text())['targets']}
 sp=importlib.util.spec_from_file_location('fine_source',ROOT/'tools/final-quality-20261006/review-decisions.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
 scopes=[];fig,axes=plt.subplots(4,2,figsize=(22,13),squeeze=False)
 for i,(identifier,start,end,title)in enumerate(SCOPES):
  row=rows[identifier];raw=m.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=round(start*16000),round(end*16000);x=pcm[a:b]
  ax,sx=axes[i];ax.plot(np.arange(a,b)/16000,x,lw=.75,color='#133951');ax.set_title(title,fontsize=10)
  f,t,p=spectrogram(x,fs=16000,nperseg=128,noverlap=120,nfft=512,scaling='spectrum')
  sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-108,vmax=-30,cmap='magma',shading='auto');sx.set_ylim(0,6000);sx.set_title('Actual 8ms STFT / 0.5ms step',fontsize=10)
  for axis in(ax,sx):axis.set_xlabel('Original source seconds');axis.grid(alpha=.2);axis.set_xticks(np.arange(np.ceil(start*100)/100,end+.001,.01));axis.tick_params(labelsize=8)
  scopes.append({'id':identifier,'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
   'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),'panelOrdinal':i+1,'sourceScopeNotAcceptedPhonemeBoundary':True})
 page=OUT/'actual-original-stop-release-fine-panels.png';fig.tight_layout();fig.savefig(page,dpi=160);plt.close(fig)
 for r in scopes:r['actualFineSourcePlot']={**ref(page),'panelOrdinal':r['panelOrdinal']}
 fig,axes=plt.subplots(2,2,figsize=(21,9),squeeze=False);lpc=[]
 for i,(identifier,windows)in enumerate(LPC_SCOPES):
  row=rows[identifier];raw=m.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4')
  for start,end,title in windows:
   a,b=round(start*16000),round(end*16000);x=pcm[a:b].astype(float);xx=(x-x.mean())*np.hanning(len(x));em=lfilter([1,-.97],[1],xx)
   ac=np.correlate(em,em,mode='full')[len(em)-1:];order=18
   co=np.r_[1.,solve_toeplitz((ac[:order],ac[:order]),-ac[1:order+1])]
   f,h=freqz([1.],co,worN=2048,fs=16000);s=np.abs(np.fft.rfft(xx,n=2048));sf=np.fft.rfftfreq(2048,1/16000)
   axes[i,0].plot(sf,20*np.log10(np.maximum(s,1e-12)),label=title)
   axes[i,1].plot(f,20*np.log10(np.maximum(np.abs(h),1e-12)),label=title)
   lpc.append({'id':identifier,'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],'sourcePCM_SHA256':row['sourcePCM_SHA256'],
    'scopeLabel':title,'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),
    'LPCOrder':order,'preEmphasis':.97,'measuredEnvelopeNotAutomaticFormantOrAntiformantIdentity':True,'panelOrdinal':i+1})
  for j,axis in enumerate(axes[i]):axis.set_xlim(0,5000);axis.legend();axis.grid(alpha=.2);axis.set_xlabel('Hz');axis.set_ylabel('relative dB');axis.set_title(identifier+(' actual raw FFT'if j==0 else' descriptive LPC envelope'))
 lp=OUT/'actual-original-nin-nasal-LPC-comparison.png';fig.tight_layout();fig.savefig(lp,dpi=150);plt.close(fig)
 for r in lpc:r['actualLPCSourcePlot']={**ref(lp),'panelOrdinal':r['panelOrdinal']}
 result=OUT/'actual-original-stop-nasal-fine-measurements.json';result.write_text(json.dumps({'status':'actual-original-descriptive-stop-nasal-measurements-not-approval',
  'pairedReportEvidence':ref(report),'scriptEvidence':ref(Path(__file__)),'fineStopScopes':scopes,'nasalLPCScopes':lpc,
  'newASR':False,'sourceSamplesChanged':False,'phonemeClassifierUsed':False,'humanListening':False,'nativeSpeakerReview':False,
  'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(result)))
if __name__=='__main__':main()
