"""Independent fresh original PCM and fine source-transition observations.

This produces observations, never an approval or phoneme/tone classifier.
"""
import hashlib, json, pathlib, subprocess
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.signal import lfilter
from scipy.linalg import solve_toeplitz

ROOT=pathlib.Path(__file__).resolve().parents[2]
BASE=ROOT/'course-app/docs/final-quality-20261006/audio-hsk1'
OUT=ROOT/'course-app/docs/final-quality-20261006/audio-root-peer-numerals'
SCOPES={'一':(2.98,3.17),'六':(1.24,1.44),'千':(45.85,46.04),'两':(12.58,12.74),'零':(10.52,10.70)}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p): return {'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)}
def checked(r):
    p=ROOT/r['file']; assert sha(p)==r['sha256']; return json.loads(p.read_text())
def pointer(x,p):
    for k in p.split('/')[1:]:x=x[int(k)] if isinstance(x,list) else x[k.replace('~1','/').replace('~0','~')]
    return x
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    records={}
    for index in ['numeral-original-syllable-evidence/producer-facts-index.json','numeral-complete-tail-syllable-evidence/producer-facts-index.json']:
        for r in json.loads((BASE/index).read_text())['targets']: records[r['id']]=r
    observations=[]
    for r in records.values():
        f=checked(r); t=f['target']; p=ROOT/t['sourceTrack']
        if not p.is_file():p=ROOT/'course-app/public'/t['sourceTrack']
        assert sha(p)==t['sourceSHA256']
        pcm=subprocess.run(['ffmpeg','-nostdin','-v','error','-threads','1','-i',str(p),'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
        assert hashlib.sha256(pcm).hexdigest()==t['sourcePCM_SHA256']
        s,e=t['sourceSampleRange16k'];assert hashlib.sha256(pcm[s*4:e*4]).hexdigest()==t['cropPCM_SHA256']
        src=checked(f['originalPrintedPinyinEvidence']); assert pointer(src,f['originalPrintedPinyinEvidence']['sourceJSONPointer'])==f['originalPrintedPinyinEvidence']['originalPrintedPinyin']
        assert pointer(src,f['originalPrintedOccurrenceTextEvidence']['sourceJSONPointer'])==f['originalPrintedOccurrenceTextEvidence']['sourceText']
        for exp in f['expandedGeometries']:
            a,b=exp['sourceSampleRange16k'];assert a<=s<e<=b and [a,b]!=[s,e]
            assert hashlib.sha256(pcm[a*4:b*4]).hexdigest()==exp['cropPCM_SHA256']
            assert set(exp['actualCropModelEvidence'])=={'small','medium'}
            for m in exp['actualCropModelEvidence'].values():
                raw=checked(m);assert raw['sourceSampleRange16k']==[a,b] and raw['cropPCM_SHA256']==exp['cropPCM_SHA256']
                assert ''.join(q['text'] for q in raw['rawSegments'])==m['originalTranscript']
                assert raw['options'].get('initial_prompt') is None and raw['options'].get('hotwords') is None
        obs={'id':t['id'],'sourceZH':t['sourceZH'],'producerFacts':r,'freshOriginalBytesAndFramesChecked':True,'sourceTrack':t['sourceTrack'],'sourceSHA256':t['sourceSHA256'],'sourcePCM_SHA256':t['sourcePCM_SHA256'],'sourceSampleRange16k':[s,e],'cropPCM_SHA256':t['cropPCM_SHA256'],'originalPrintedOccurrenceTextEvidence':f['originalPrintedOccurrenceTextEvidence'],'originalPrintedPinyinEvidence':f['originalPrintedPinyinEvidence'],'twoActualPairedContainingGeometriesVerified':len(f['expandedGeometries']),'productionApproved':False,'humanListening':False,'pronunciationToneCertified':False}
        zh=t['sourceZH']
        if zh in SCOPES:
            a,b=[int(v*16000) for v in SCOPES[zh]];x=np.frombuffer(pcm,dtype='<f4');fig,axes=plt.subplots(2,1,figsize=(15,6),sharex=True)
            axes[0].plot(np.arange(a,b)/16000,x[a:b],lw=.6)
            axes[1].specgram(x[a:b],NFFT=256,Fs=16000,noverlap=224,xextent=(a/16000,b/16000),vmin=-95,vmax=-20,cmap='magma');axes[1].set_ylim(0,5000)
            for ax in axes:
                ax.axvline(s/16000,color='green');ax.axvline(e/16000,color='green');ax.grid(alpha=.15)
            axes[0].set_title(t['candidateId']+' | freshly decoded original transition; no classification')
            axes[1].set_xlabel('Original source seconds');fig.tight_layout();p=OUT/(t['candidateId']+'-source-transition.png');fig.savefig(p,dpi=130);plt.close(fig)
            resonances=[]
            for center in np.arange(a+160,b-160,80):
                values=x[center-160:center+160:2];window=lfilter([1,-.97],[1],values)*np.hamming(len(values));ac=np.correlate(window,window,'full')[len(window)-1:len(window)+14]
                roots=np.roots(np.r_[1,solve_toeplitz(ac[:14],-ac[1:15])]);roots=roots[roots.imag>0];freq=np.angle(roots)*8000/(2*np.pi);bw=-np.log(abs(roots))*8000/np.pi
                resonances.append({'centerSourceFrame16k':int(center),'sourceWindowFrames16k':[int(center-160),int(center+160)],'actualResonanceCandidatesHzBandwidthHz':sorted([round(float(v)),round(float(w))] for v,w in zip(freq,bw) if 100<v<4500 and 0<w<700),'rmsDbFS':round(float(20*np.log10(max(np.sqrt(np.mean(values**2)),1e-12))),4)})
            obs.update({'originalTransitionPlot':ref(p),'originalTransitionPCM_SHA256':hashlib.sha256(pcm[a*4:b*4]).hexdigest(),'actual20msLPC14CandidatesAt5msHop':resonances,'resonancesAreNotCertifiedPhonemes':True})
        observations.append(obs)
    out=OUT/'fresh-original-source-transition-observations.json';out.write_text(json.dumps({'schemaVersion':1,'producer':ref(pathlib.Path(__file__)),'records':observations,'automaticApproval':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(ref(out)))
if __name__=='__main__':main()
