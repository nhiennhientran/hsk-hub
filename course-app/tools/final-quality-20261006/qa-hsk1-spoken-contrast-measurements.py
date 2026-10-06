#!/usr/bin/env python3
"""Read-only original-PCM contrast panels; no phoneme classifier or new inference."""
import hashlib, importlib.util, json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-context-peer-hsk1-spoken22'
REPORT=ROOT/'course-app/docs/final-quality-20261006/audio-review/hsk1-paired-full-03.json'
# These are manually chosen real source scopes, not accepted phoneme timings.
GROUPS=[
 ('nin',[
  ('textbook-l04-text-3-line-05',13.12,13.46,'Current nin before nu; raw disagreement retained'),
  ('textbook-l04-text-3-line-03',9.12,9.46,'Same scene speaker: printed nin before er'),
  ('textbook-l04-text-3-line-01',.92,1.32,'Same scene speaker: printed nin between shi and er')]),
 ('bian-mian',[
  ('textbook-l09-text-1-line-01',1.24,1.80,'Current qian-bian/mian: closure/nasal identity unresolved'),
  ('textbook-l09-text-1-line-03',11.10,11.72,'Same printed speaker: wai bian jian control')]),
 ('ge-ke',[
  ('textbook-l13-text-3-line-04',13.10,13.34,'Current ge/ke: original burst/periodicity scope'),
  ('textbook-l13-text-3-line-06',21.57,22.05,'Same printed speaker: gei wo control'),
  ('textbook-l13-text-3-line-03',10.76,11.07,'Other speaker: si shi ge control, not same-voice equivalence')])]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p):return {'file':str(p.relative_to(ROOT)),'sha256':sha(p)}
def features(x):
    rms=float(np.sqrt(np.mean(x*x)))
    n=len(x); centered=x-x.mean(); win=np.hanning(n)
    spectrum=np.abs(np.fft.rfft(centered*win))**2; freqs=np.fft.rfftfreq(n,1/16000)
    total=float(spectrum[(freqs>=80)&(freqs<5000)].sum())
    powers={f'{lo}-{hi}Hz':float(spectrum[(freqs>=lo)&(freqs<hi)].sum()/max(total,1e-30)) for lo,hi in [(80,500),(500,1500),(1500,3000),(3000,5000)]}
    ac=np.correlate(centered,centered,mode='full')[n-1:]
    a,b=round(16000/450),min(round(16000/60),n-1)
    peaklag=a+int(np.argmax(ac[a:b+1])); peak=float(ac[peaklag]/max(ac[0],1e-30))
    return {'rmsDbFS':20*np.log10(max(rms,1e-15)), 'relativeSpectralPowers':powers,
            'maximumPitchPeriodAutocorrelation':peak, 'maximumPitchPeriodLagSamples':peaklag,
            'descriptiveFeaturesOnlyNoPhonemeClassification':True}

def main():
    rows={r['id']:r for r in json.loads(REPORT.read_text())['targets']}
    spec=importlib.util.spec_from_file_location('contrast_original_pcm',ROOT/'tools/final-quality-20261006/review-decisions.py')
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    clips=[];pages=[]
    for kind,scopes in GROUPS:
        fig,axes=plt.subplots(len(scopes),3,figsize=(24,4.3*len(scopes)),squeeze=False)
        page=OUT/f'actual-original-{kind}-contrast.png'
        for i,(identifier,start,end,title) in enumerate(scopes):
            row=rows[identifier];raw=m.original_pcm(ROOT,row);pcm=np.frombuffer(raw,dtype='<f4');a,b=round(start*16000),round(end*16000);x=pcm[a:b]
            ax,sx,px=axes[i]
            ax.plot(np.arange(a,b)/16000,x,lw=.65,color='#11394a');ax.set_title(title,fontsize=10)
            f,t,p=spectrogram(x,fs=16000,nperseg=256,noverlap=240,nfft=512,scaling='spectrum')
            sx.pcolormesh(t+a/16000,f,10*np.log10(np.maximum(p,1e-14)),vmin=-105,vmax=-28,cmap='magma',shading='auto');sx.set_ylim(0,5000)
            sx.set_title('Actual 16ms STFT / 1ms step; time envelopes only',fontsize=10)
            bins=[]
            for s in range(a,b-320+1,32):
                bins.append({'frames16k':[s,s+320],**features(pcm[s:s+320])})
            times=[(q['frames16k'][0]+160)/16000 for q in bins]
            px.plot(times,[q['relativeSpectralPowers']['80-500Hz'] for q in bins],label='80-500Hz relative power')
            px.plot(times,[q['relativeSpectralPowers']['3000-5000Hz'] for q in bins],label='3000-5000Hz relative power')
            px.plot(times,[q['maximumPitchPeriodAutocorrelation'] for q in bins],label='Period-lag ACF peak')
            px.set_ylim(0,1.03);px.legend(fontsize=8);px.set_title('Measured 20ms features / 2ms step; not labels',fontsize=10)
            for axis in (ax,sx,px):axis.grid(alpha=.18);axis.set_xlabel('Original seconds');axis.tick_params(labelsize=8)
            clips.append({'id':identifier,'contrastGroup':kind,'sourceTrack':row['sourceTrack'],'sourceSHA256':row['sourceSHA256'],
              'sourcePCM_SHA256':row['sourcePCM_SHA256'],'sourceScopeFrames16k':[a,b],'sourceScopePCM_SHA256':hashlib.sha256(raw[a*4:b*4]).hexdigest(),
              'canonicalPrintedSource':row['canonicalSource'],'panelOrdinal':i+1,'actualFeatureBins':bins,
              'sourceScopeNotAcceptedPhonemeBoundary':True,'sourceScopeTitle':title})
        fig.tight_layout();fig.savefig(page,dpi=145);plt.close(fig);pages.append({'contrastGroup':kind,**ref(page)})
    for r in clips:r['actualSourceContrastPlot']={**next(p for p in pages if p['contrastGroup']==r['contrastGroup']),'panelOrdinal':r['panelOrdinal']}
    result=OUT/'actual-original-spoken-contrast-measurements.json'
    result.write_text(json.dumps({'status':'measured-original-sample-contrasts-not-approval','pairedReportEvidence':ref(REPORT),'scriptEvidence':ref(Path(__file__)),
      'scopes':clips,'pages':pages,'newASR':False,'sourceSamplesChanged':False,'phonemeClassifierUsed':False,
      'humanListening':False,'nativeSpeakerReview':False,'pronunciationToneCertified':False,'fullPhonemeCertification':False,'productionApproved':False},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(ref(result)))
if __name__=='__main__':main()
